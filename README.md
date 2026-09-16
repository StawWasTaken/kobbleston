# Kobbleston

> Pixels go brrr

Kobbleston is a social platform for making little corners of the internet.
People build **Spaces**, publish them, and visit each other's.

Built by Staw.

## Running it

```bash
npm install
cp .env.example .env   # already filled in with the publishable key
npm run dev
```

`npm run build` typechecks and builds to `dist/`.

## The database

Supabase backs everything. Apply the four migrations in `supabase/migrations`
in order from the Supabase SQL editor before running the app — see
[`supabase/README.md`](supabase/README.md).

Only the publishable key ever reaches the browser. Every counter the platform
shows (visits, updates, accounts) is computed server-side by a `security
definer` function, and row level security means a query from the client can
only ever return what that person is allowed to see.

## Layout

```
public/brand/      logos, banners, Kobby illustrations
src/components/
  brand/           wordmark, pixel field, Kobby, signature
  layout/          app shell, sidebar, topbar, nav
  social/          activity feed, stats, notifications, reporting
  spaces/          the Space card
  ui/              buttons, cards, inputs, dialogs, presence, toasts
src/hooks/         auth + presence, async requests, reduced motion
src/lib/           supabase client, the whole data layer, helpers
src/pages/         one file per route
supabase/          schema, policies, functions, realtime
```

## Design notes

- `#1B34E8` is the brand and the interaction colour. `#162382` is the sidebar.
  `#101012` is everything behind it.
- `#1CAE71` means one thing only: a Space. Entering one, being inside one.
  Presence on the platform itself is blue; offline is grey.
- Headings are BD Gravel-VF. Drop `BDGravel-VF.woff2` into `public/fonts` and
  it takes over from the fallback with no other change.
- Icons are filled Font Awesome, no exceptions.
- Kobby appears in empty states, notifications, errors and 404s — moments,
  not decoration.
- Everything animated respects `prefers-reduced-motion`.

## Not built yet

The Kobbleston editor (building the inside of a Space) is deliberately out of
scope for now, and the UI says so where it would otherwise be a dead end
rather than pretending it exists.
