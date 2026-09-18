# Link previews

What a Kobbleston address looks like when it is pasted into Discord, Slack,
iMessage or a search result.

## How this works

Kobbleston is one document with a router inside it. The robot that builds a
preview does not run the router, so whatever is in the HTML it is handed is
the preview. That splits the problem in two.

**Addresses that read the same for everybody** are written at build time.
`scripts/site-pages.mjs` lists them, and the build writes a real file for
each one with its own title, description and picture: `/discover/index.html`,
`/communities/index.html`, and so on. Adding a page to that list is all it
takes. `404.html` carries the site's own card, so anything not on the list
still previews as Kobbleston rather than as nothing.

**Addresses that point at something** are written the same way, from the
database. `scripts/write-item-pages.mjs` asks for everything that is already
public and writes a file for each one: `/s/1042/the-attic/`, `/c/1016/attic-
club/`, `/c/attic-club/`, `/u/1001/previewer/`, `/u/previewer/`,
`/u/previewer/the-attic/`, `/e/1020/`, `/create/SND-1033/`. Both forms of
every address, because both are links people actually have.

It reads with the same publishable key the browser carries, so it sees
exactly what a stranger sees. The deploy runs it on every push and again on
the hour, which is how something made since the last run gets its card. A run
that cannot reach the database writes nothing and leaves the published cards
alone rather than wiping them.

There is also `link_preview(path)` in the database and the `og` edge
function, which answer the same question live. They are what to reach for if
the hourly gap ever matters, or if the site moves somewhere that can run code
per request.

`link_preview` only returns things that are already public: a published
Space, a listed Community, a profile that is not suspended. Marketplace files
stay protected, so an upload previews with its name and its creator and none
of its content.

## Doing it live instead

The files above go stale for at most an hour. If that is too long, a proxy in
front of kobbleston.com can send preview robots to the `og` function, which
answers from the database there and then. GitHub Pages cannot do this itself:
it serves files and cannot tell a robot from a person.

With the domain on Cloudflare, this worker does it:

```js
const BOTS = /discordbot|twitterbot|facebookexternalhit|slackbot|telegrambot|whatsapp|linkedinbot|embedly|bingbot|googlebot|pinterest|redditbot|mastodon|bluesky/i

// Addresses that already have a file of their own do not need the function.
const DYNAMIC = /^\/(s|c|u|e)\//

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const agent = request.headers.get('user-agent') ?? ''

    if (BOTS.test(agent) && (DYNAMIC.test(url.pathname) || /^\/create\/[a-z]{3}-\d+$/i.test(url.pathname))) {
      return fetch(
        `https://sdnjdgeqrhzkyfyohcsz.supabase.co/functions/v1/og?path=${encodeURIComponent(url.pathname)}`,
        { headers: { apikey: PUBLISHABLE_KEY } },
      )
    }

    return fetch(request)
  },
}
```

`PUBLISHABLE_KEY` is the same publishable key the browser carries, which is
not a secret. Nothing here needs the service role key, and it must never be
put in a worker.

None of this is needed for previews to work. It is only worth doing if a card
being up to an hour out of date is a problem.

## Checking it

- `https://kobbleston.com/discover` should preview as Discover with the site
  picture, straight from the built file.
- `npm run pages:items` writes the item cards into `dist/`. Check one with
  `grep og: dist/c/*/*/index.html`.
- `supabase functions serve og` then
  `curl 'http://localhost:54321/functions/v1/og?path=/c/1016/name'` should
  come back with that Community's name and emblem in the meta tags.
- Discord caches a preview hard. Add `?x=1` to the address to make it fetch
  again while testing.


## What a card says

A card is one sentence about the thing, then whatever its owner wrote. The
name is the title on its own: the site name is already shown above it by
everything that renders these, so "Kobbleston - Kobbleston" was saying it
twice.

| Address | Title | First line |
| --- | --- | --- |
| `/c/1016/name` | the community's name | "X is a community on Kobbleston, run by @owner, with N members." |
| `/s/1042/name` | the Space's name | "A Space on Kobbleston by @owner. N visits, N% liked." |
| `/u/1042/name` | "Name (@handle)" | "Name is on Kobbleston, here since Month Year. N Spaces." |
| `/e/1016` | the event's title | "An event in X on Kobbleston, Saturday 19th September. N people going." |
| `/create/IMG-1042` | the upload's name | "A decal by @creator on the Kobbleston Marketplace, IMG-1042. N uses." |

The picture is the widest one there is: a Space's cover, a community's banner,
an event's cover. Those make the big card. Where there is only a square one,
an emblem or somebody's face, the card is the small kind instead, because a
square stretched into a wide card is cut into a stripe. A Marketplace upload
shows no picture at all: the file is protected, and a preview is not a way
around that.

Both paths say the same thing: `link_preview` in the database, for anything
serving these live, and `scripts/write-item-pages.mjs`, which writes a real
file for every address so GitHub Pages can answer a robot that does not run
routers.
