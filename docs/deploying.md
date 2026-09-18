# Deploying the parts that are not the site

The site itself deploys on its own: a push to main rebuilds it and GitHub
Pages serves it. Two things sit outside that, and both are done by hand.

## Migrations

Everything in `supabase/migrations`, in order, applied in the SQL editor on
the Supabase dashboard or with the CLI. Every one of them is written to be
safe to run twice.

## Edge functions

There are two: `login` (username and password, looked up behind the service
role key) and `og` (link previews for addresses that depend on what they
point at). Neither is required for the site to work: logging in falls back to
`login_email_for` in the database, and previews fall back to the files the
build writes.

### With the CLI

```
npm i -g supabase          # once
supabase login             # opens a browser
supabase link --project-ref sdnjdgeqrhzkyfyohcsz
supabase functions deploy login
supabase functions deploy og
```

`supabase functions deploy` reads `supabase/functions/<name>/index.ts` from
this repository, so run it from the repository root. The service role key is
already there as an environment variable inside functions: it never needs to
be passed in, and it must never be put anywhere the browser can read.

### Without the CLI

On the dashboard: **Edge Functions** → **Deploy a new function** → name it
`login`, paste the contents of `supabase/functions/login/index.ts`, deploy.
Then the same for `og`.

### Checking it worked

The login page tells you which path it took by what it says when the details
are wrong:

- "Wrong username or password." means the lookup ran and refused. That is the
  real answer.
- "Too many attempts." comes from the database fallback, which allows ten
  tries per name in a quarter of an hour.

If logging in works but you want it going through the function, deploy it and
try again: the function is tried first every time, and the database is only
asked when it does not answer.
