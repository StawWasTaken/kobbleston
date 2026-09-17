-- Three fixes: uploads being refused outright, uploads sitting in review that
-- had no business being there, and giving every piece of user made content an
-- ID of its own.

-- ------------------------------------------------ uploads were being refused
--
-- `review_new_asset()` runs BEFORE INSERT and decides the status. Row level
-- security checks the row AFTER that trigger, and the policy still insisted on
-- 'pending', so anything the filter approved was rejected by the policy.
-- The client cannot choose a status anyway, because the trigger overwrites it.

drop policy if exists assets_insert_own on public.assets;
create policy assets_insert_own on public.assets for insert
  with check (creator_id = auth.uid() and not public.is_guest());

-- -------------------------------------------- terms that held back too much
--
-- Terms like "kobbleston" or "admin" matter in a username, where someone is
-- pretending to be staff. In the name of an upload they are ordinary words,
-- and they were parking innocent files in a queue nobody empties.

alter table public.moderation_terms
  add column scope text not null default 'all' check (scope in ('all', 'identity'));

update public.moderation_terms
   set scope = 'identity'
 where pattern in (
   '(^|[^a-z])(admin|moderator|staff|official|kobbleston)([^a-z]|$)',
   '(https?://|www\.)',
   '(^|[^a-z])(discord\.gg|t\.me|bit\.ly|tinyurl)'
 );

create or replace function public.screen_text(input text, check_scope text default 'all')
returns table (decision public.screen_decision, reason text)
language plpgsql stable security definer set search_path = public as $$
declare
  flattened text := public.normalize_for_screening(input);
  raw text := lower(coalesce(input, ''));
  hit record;
begin
  if coalesce(trim(input), '') = '' then
    return query select 'ok'::public.screen_decision, null::text;
    return;
  end if;

  for hit in
    select t.decision, t.reason
      from public.moderation_terms t
     where (t.scope = 'all' or t.scope = check_scope)
       and (flattened ~* t.pattern or raw ~* t.pattern)
     order by (t.decision = 'block') desc
     limit 1
  loop
    return query select hit.decision, hit.reason;
    return;
  end loop;

  return query select 'ok'::public.screen_decision, null::text;
end;
$$;

-- Identity keeps the stricter list.
create or replace function public.screen_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  verdict record;
begin
  select * into verdict from public.screen_text(new.username, 'identity');
  if verdict.decision = 'block' then
    raise exception 'That username is not allowed: %', verdict.reason;
  end if;

  select * into verdict from public.screen_text(new.display_name, 'identity');
  if verdict.decision = 'block' then
    raise exception 'That display name is not allowed: %', verdict.reason;
  end if;

  select * into verdict from public.screen_text(new.bio);
  if verdict.decision = 'block' then
    raise exception 'That bio is not allowed: %', verdict.reason;
  end if;

  return new;
end;
$$;

create or replace function public.check_username(candidate text)
returns table (ok boolean, reason text)
language plpgsql stable security definer set search_path = public as $$
declare
  verdict record;
begin
  if candidate !~ '^[a-zA-Z0-9_]{3,20}$' then
    return query select false, 'Letters, numbers and underscores. 3 to 20 characters.';
    return;
  end if;

  if exists (select 1 from public.profiles where lower(username) = lower(candidate)) then
    return query select false, 'That name is taken.';
    return;
  end if;

  select * into verdict from public.screen_text(candidate, 'identity');
  if verdict.decision <> 'ok' then
    return query select false, coalesce(verdict.reason, 'That name is not allowed.');
    return;
  end if;

  return query select true, null::text;
end;
$$;

-- ------------------------------------------------------------- content IDs
--
-- Every piece of user made content gets a number from one shared sequence, so
-- the numbers say what order things were made in across the whole platform,
-- and a short prefix says what kind of thing it is. An upload is IMG-1042, a
-- Space is SPC-17, and the two can never collide.

create sequence if not exists public.content_id_seq start 1000;

alter table public.assets      add column content_id bigint unique default nextval('public.content_id_seq');
alter table public.spaces      add column content_id bigint unique default nextval('public.content_id_seq');
alter table public.space_badges add column content_id bigint unique default nextval('public.content_id_seq');
alter table public.communities add column content_id bigint unique default nextval('public.content_id_seq');

-- Anything made before this migration is numbered by when it was made, so the
-- order holds for old content too.
with ordered as (
  select id, row_number() over (order by created_at) as n
    from (
      select id, created_at from public.spaces
      union all select id, created_at from public.assets
      union all select id, created_at from public.space_badges
      union all select id, created_at from public.communities
    ) everything
)
update public.spaces s set content_id = o.n from ordered o where o.id = s.id;

update public.assets a set content_id = nextval('public.content_id_seq') where a.content_id is null;
update public.space_badges b set content_id = nextval('public.content_id_seq') where b.content_id is null;
update public.communities c set content_id = nextval('public.content_id_seq') where c.content_id is null;

select setval('public.content_id_seq', greatest(
  (select coalesce(max(content_id), 1000) from public.spaces),
  (select coalesce(max(content_id), 1000) from public.assets),
  (select coalesce(max(content_id), 1000) from public.space_badges),
  (select coalesce(max(content_id), 1000) from public.communities)
) + 1);

-- Finding anything by its number, whatever kind it is.
create or replace function public.find_by_content_id(target bigint)
returns table (kind text, id uuid, name text, slug text, owner_username text)
language sql stable security definer set search_path = public as $$
  select 'space', s.id, s.name, s.slug, p.username
    from public.spaces s join public.profiles p on p.id = s.owner_id
   where s.content_id = target and s.is_published and not s.is_removed
  union all
  select a.kind::text, a.id, a.name, null, p.username
    from public.assets a join public.profiles p on p.id = a.creator_id
   where a.content_id = target and a.status = 'approved'
  union all
  select 'badge', b.id, b.name, null, p.username
    from public.space_badges b
    join public.spaces s on s.id = b.space_id
    join public.profiles p on p.id = s.owner_id
   where b.content_id = target
  union all
  select 'community', c.id, c.name, c.slug, null
    from public.communities c
   where c.content_id = target and c.is_public and not c.is_removed
  limit 1;
$$;

grant execute on function public.find_by_content_id to anon, authenticated;

-- The marketplace read carries the number too.
create or replace function public.list_assets(
  kind_filter text default null,
  search text default null,
  limit_count int default 24
)
returns table (
  id uuid,
  kind public.asset_kind,
  name text,
  description text,
  file_path text,
  thumbnail_path text,
  download_count integer,
  content_id bigint,
  created_at timestamptz,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  creator_is_admin boolean
)
language sql stable security definer set search_path = public as $$
  select a.id, a.kind, a.name, a.description, a.file_path, a.thumbnail_path,
         a.download_count, a.content_id, a.created_at,
         p.username, p.display_name, p.avatar_url, p.is_admin
    from public.assets a
    join public.profiles p on p.id = a.creator_id and not p.is_suspended
   where a.status = 'approved'
     and (kind_filter is null or a.kind::text = kind_filter)
     and (search is null or a.name ilike '%' || search || '%')
   order by p.is_admin desc, a.created_at desc
   limit least(greatest(limit_count, 1), 60);
$$;
