# Kobbleston database

Supabase project: `https://sdnjdgeqrhzkyfyohcsz.supabase.co`

Apply the migrations in order from the SQL editor (or `supabase db push`):

1. `0001_init.sql` - tables and indexes
2. `0002_policies.sql` - row level security
3. `0003_functions.sql` - triggers and RPCs
4. `0004_realtime.sql` - realtime publication
5. `0005_accounts_and_create.sql` - signup fields and the Create marketplace
6. `0006_storage_and_review.sql` - the uploads bucket and the review pipeline

Notes:

- Profiles are created automatically by the `on_auth_user_created` trigger, so
  the client never inserts one.
- Visit counts only move through `enter_space()`, which records at most one
  visit per person per space per hour. There is no client-writable counter.
- `platform_stats()` and `recent_activity()` are the only things the
  logged-out landing page reads, and both are exposed to `anon`.
- Only the publishable key belongs in the frontend. The service role key must
  never leave the Supabase dashboard.

## The Kobbleston account

Kobbleston's own uploads show a verified mark in Create. After signing that
account up normally, mark it once:

```sql
update public.profiles set is_admin = true, is_moderator = true
 where lower(username) = 'kobbleston';
```

`list_assets()` sorts admin uploads first and returns `creator_is_admin`, which
is what the verified mark reads.

## Reviewing uploads

Uploads land in `public.assets` with `status = 'pending'`. Nothing reachable
from the browser can change a status: `assets_update_own_metadata` only lets a
creator rename their own row while it is still pending, and `review_asset()`
has execute revoked from `anon` and `authenticated`. Until something approves
an upload, only its creator can see it.

Approving happens outside the database, from a worker holding the service
role key, which is the only place that key may ever live:

```sql
select public.review_asset('<asset id>', 'approved');
select public.review_asset('<asset id>', 'rejected', 'Not your artwork.');
```

Point that worker at whatever automated check you want to run first, and have
it call `review_asset` with the outcome. A signed-in moderator (a profile with
`is_moderator`) can read the backlog through `review_queue()` and make the same
calls by hand. Until a worker is deployed, uploads simply stay pending and
invisible, which is the safe failure.

## The Kobbleston account

Kobbleston's own uploads show a verified mark in Create. After signing that
account up normally, mark it once:

```sql
update public.profiles set is_admin = true, is_moderator = true
 where lower(username) = 'kobbleston';
```

`list_assets()` sorts admin uploads first and returns `creator_is_admin`, which
is what the verified mark reads.

## Reviewing uploads

Uploads land in `public.assets` with `status = 'pending'`. Nothing reachable
from the browser can change a status: `assets_update_own_metadata` only lets a
creator rename their own row while it is still pending, and `review_asset()`
has execute revoked from `anon` and `authenticated`. Until something approves
an upload, only its creator can see it.

Approving happens outside the database, from a worker holding the service role
key, which is the only place that key may ever live:

```sql
select public.review_asset('<asset id>', 'approved');
select public.review_asset('<asset id>', 'rejected', 'Not your artwork.');
```

Point that worker at whatever automated check you want to run first, and have
it call `review_asset` with the outcome. A signed-in moderator (a profile with
`is_moderator`) can read the backlog through `review_queue()` and make the same
calls by hand. Until a worker is deployed, uploads simply stay pending and
invisible, which is the safe failure.
