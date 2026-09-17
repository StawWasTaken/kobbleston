# Kobbleston Workspace

The plan for the editor that fills a Space. Nothing here is built yet; this is
the shape to build toward, so the decisions are made before the code is.

Two things it is pulling from. From Roblox Studio: one window where you build
the thing and press a button to see it live, a library of parts other people
made, and publishing that is one action rather than a deployment. From
Neocities: what you end up with is a website, made of files, that belongs to
the person who made it and can be as strange as they like.

## What a Space actually is

A Space is a small static site plus the things Kobbleston knows about it
(visits, badges, chat, its place in Discover). The editor edits the site. The
platform handles the rest.

Files live in a `space_files` table keyed by Space and path, holding text for
markup, styles and scripts. Images, audio, video and fonts are not copied in;
they are referenced by the content ID they already have in Create, which is
what those IDs are for.

```
index.html          the page itself
style.css
script.js
```

## The three ways to build

The editor should meet people where they are, so the same Space can be worked
on three ways and they all write the same files.

1. **Blocks.** Drag sections onto the page: a heading, a gallery, a guestbook,
   a music player, a wall of links. Each block is a small template that writes
   markup. This is how somebody with no idea what HTML is makes something on
   their first afternoon.
2. **Style.** Fonts, colours, spacing, background, borders, one panel that
   writes CSS variables rather than a stylesheet nobody can read afterwards.
3. **Files.** The actual markup, styles and scripts, for people who want them.
   Turning this on is a one way door for a given Space: once the files are
   hand edited, the block editor stops trying to own them.

## Using what is in Create

The asset picker in the editor is Create, filtered to approved things. Picking
one drops a reference by content ID:

```html
<img src="kob://IMG-1042">
<audio src="kob://SND-2087"></audio>
```

Those are rewritten to real URLs when the Space is served. Referencing by ID
rather than by URL means an asset taken down by moderation disappears
everywhere at once, and nothing in a Space can point at a file that was never
reviewed.

## Safety, which is the hard part

A Space is somebody else's code running where people are signed in. That is
the whole problem, and it decides the architecture.

- **Spaces are served from a different origin.** Not a path on the main site,
  a separate domain. Nothing a Space does can touch a Kobbleston session,
  because the browser will not let it.
- **The page renders in a sandboxed iframe**, allow-scripts only, no
  allow-same-origin. Script can run; it cannot reach cookies, storage or the
  parent page.
- **A strict content security policy** on the served page: assets only from
  the Kobbleston asset domain, no third party scripts, no inline event
  handlers, no remote fetches. A Space cannot phone home.
- **Markup is sanitised on save, not on render**, so what is stored is already
  clean, and a sanitiser bug does not become a stored attack.
- **Talking to the platform goes through one narrow bridge.** A Space cannot
  call the API. It can post a small set of messages to the parent frame
  (`awardBadge`, `getVisitor`, `saveState`), each checked on our side and rate
  limited. Everything else is refused.
- **Badges are awarded through that bridge**, which is what finally makes
  badges award themselves rather than needing the owner to hand them out.

## Publishing

Editing writes to a draft. Publishing copies the draft over the live version
and stamps an update, which is what the existing update feed and the notify
button already listen for. Every publish keeps the previous version, so a
Space can be rolled back after a bad save.

## What to build first

1. `space_files`, the sandboxed serving domain and the CSP. Nothing else can
   be safely tried before this exists.
2. The file editor, because it is the smallest thing that makes a Space real.
3. The asset picker and `kob://` rewriting.
4. The block editor on top, once files and serving are known to work.
5. The bridge, and badges awarding themselves through it.
