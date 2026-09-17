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

**Addresses that depend on what they point at** cannot be known at build
time: a Space, a Community, a person, an event, an upload. For those there is
`link_preview(path)` in the database, which turns an address into the few
facts a card needs, and the `og` edge function, which renders those facts as
a small HTML document and sends a person straight on to the real address.

`link_preview` only returns things that are already public: a published
Space, a listed Community, a profile that is not suspended. Marketplace files
stay protected, so an upload previews with its name and its creator and none
of its content.

## The piece that has to be in front

GitHub Pages serves files and nothing else: it cannot look at who is asking
and answer robots differently. So the last step is a proxy in front of
kobbleston.com that sends preview robots to the `og` function and everybody
else to the site as usual.

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

Until that proxy exists, every address still previews with the Kobbleston
card and a sensible description, and the pages in `site-pages.mjs` preview
with their own.

## Checking it

- `https://kobbleston.com/discover` should preview as Discover with the site
  picture, straight from the built file.
- `supabase functions serve og` then
  `curl 'http://localhost:54321/functions/v1/og?path=/c/1016/name'` should
  come back with that Community's name and emblem in the meta tags.
- Discord caches a preview hard. Add `?x=1` to the address to make it fetch
  again while testing.
