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

## What is built

1. **`space_files`, the sandbox and the policy (built).** A draft and a live
   copy per Space, publishing between them, and the page drawn in a frame
   with scripts only, no same origin, and a policy that refuses everything
   but pictures, sound and fonts.
2. **The file editor (built).** Files down one side, the text in the middle,
   the page on the right.
3. **The asset picker and `kob://` rewriting (built).** A number typed in, or
   an upload that goes to Create and fills its own number in. References
   become short lived links only at the moment of drawing.
4. **The block editor (built).** A canvas with drag, resize, snapping and
   layers; a toolbox of blocks; an inspector for the selected one and for the
   page. Blocks are kept as `page.json` and compiled to the markup and styles,
   and taking the files over by hand is the one way door it was always meant
   to be.
5. **The bridge (partly built).** A Space can say two things: somebody pressed
   a donate button, and somebody pressed an ad. Both are handled outside the
   frame, where the amount can be shown plainly and the account is reachable.
   Badges awarding themselves still needs doing.

## Still to build

- **Blocks for the rest of it**: a guestbook, a wall of links, a music player
  that is more than an audio element.
- **Style, as its own way of working**, rather than the per block colours and
  sizes the inspector has now.
- **Badges through the bridge**, which is what finally makes them award
  themselves.
- **Sanitising markup on save**, so what is stored is already clean rather
  than relying on the frame alone.
- **A serving domain of its own.** The frame already has an origin of null,
  which is what isolation needs; a separate domain would let a Space be
  visited directly rather than only inside Kobbleston.
