# Kobbleston database

Supabase project: `https://sdnjdgeqrhzkyfyohcsz.supabase.co`

Apply the migrations in order from the SQL editor (or `supabase db push`):

1. `0001_init.sql` — tables and indexes
2. `0002_policies.sql` — row level security
3. `0003_functions.sql` — triggers and RPCs
4. `0004_realtime.sql` — realtime publication

Notes:

- Profiles are created automatically by the `on_auth_user_created` trigger, so
  the client never inserts one.
- Visit counts only move through `enter_space()`, which records at most one
  visit per person per space per hour. There is no client-writable counter.
- `platform_stats()` and `recent_activity()` are the only things the
  logged-out landing page reads, and both are exposed to `anon`.
- Only the publishable key belongs in the frontend. The service role key must
  never leave the Supabase dashboard.
