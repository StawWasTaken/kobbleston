# What is still to build

Kept here rather than in my head, so nothing quietly falls off. Order is
roughly what I would do next, not a promise about dates.

## Big pieces

### The Spaces creator
`docs/editor.md` holds the plan. The first two steps of it are built: Spaces
have files, and there is an editor for them.

- **Files, and serving them (built).** `space_files` holds a draft and a live
  copy per Space. Publishing moves one to the other and keeps what was live,
  so a bad publish can be undone. A page is drawn in a sandboxed frame with
  no same origin and a strict content policy, so a Space cannot reach the
  page holding it, its storage, or the network. Content is referenced by its
  number and turned into a short lived link at the last moment.
- **The file editor (built).** Files down one side, what you are writing in
  the middle, the page itself on the right, with Save, Publish and Undo
  publish.
- **The asset picker (built).** A number typed in, or an upload that goes to
  Create and fills its own number in.
- **Blocks (built).** A canvas with drag, resize, snapping, layers and an
  inspector, kept as `page.json` and compiled into the files. Writing the
  files by hand has been taken out: a Space is built out of blocks, holds no
  scripts, and the database refuses to store one.
- **The bridge (partly built).** Donate buttons and ad presses cross it, both
  handled outside the frame. Badges awarding themselves is not built.
- **Richer blocks (mostly built).** A wall of links, a quote, a marquee and
  the Create player, in three shapes, plus a sound that simply runs and
  loops. A guestbook is not built: it needs a table behind it.
- **Fonts you own (built).** The four the site comes with, plus any font in
  your inventory, for the page or one block. More of them come from the
  Marketplace.

#### Redo the whole builder
The next big piece of work, and a rewrite rather than another round of
additions. What is there now grew one feature at a time and shows it: the
canvas, the inspector and the compiler each know too much about the others,
there is one way to arrange things and it is absolute positions on a grid,
and a page is a single screen with no notion of sections, templates or
anything repeating. The next version wants:

- **A layout that is not only absolute positions**: sections down the page,
  with things arranged inside them, so a Space holds up on a phone by
  construction rather than by a media query at the end.
- **More than one page per Space**, with links between them.
- **Templates and parts worth starting from**, including ones other people
  made, since that is what the Marketplace is for.
- **A model that can be versioned**: `page.json` is already the source, but
  it has no migrations, so every new property is a default in the reader.
- **Undo and redo**, selecting more than one block, grouping, proper
  alignment guides.
- **A preview that is the real thing** rather than a canvas approximation of
  it, so what is built and what is served cannot drift apart.

### Ads and gifts
Built. An ad is bought up front, costs a Kube a view, runs until its budget or
its fortnight is out, and hands back what it did not spend when it is
stopped. A finished campaign can be put back up rather than built again. An
ad names the thing it advertises, and can only be bought by somebody allowed
to advertise that thing; Kobbleston's own account is the only one that may
point one off the site. Ads are shown in the blocks Spaces choose to keep and
in Kobbleston's own slots, on the home page, in Discover, on profiles,
community pages and Space pages, where nobody takes a share because nobody
owns the page. The Space showing it keeps 15%, counted in hundredths and paid in
whole Kubes. A donate block gives Kubes straight to whoever made the Space,
confirmed outside the page so the amount cannot be misrepresented.

### Spaces, the rest of it
Badges worth earning, visiting people inside a Space, what a Space can do
beyond showing pictures: guestbooks, pages, links between Spaces. Presence
inside a Space is built; the Space itself is not.

### The logged-out page **(done)**
Redone. It now says what Kobbleston is in three pillars, carries the real
platform numbers, the Spaces being visited, what people have put on the
marketplace and the Communities worth joining, and walks somebody through
getting started. Everything on it is read from the database or it is not
shown at all.

### Login and signup **(done)**
Username and password everywhere, through the login function where it is
deployed and through `login_email_for` in the database where it is not.
Switching accounts keeps the sessions it already has, so it never asks twice.
A guest who decides to stay keeps the account they have been using. A failure
says what actually went wrong rather than blaming the password for it.

## Making the whole thing feel finished

The standing complaint, and a fair one: some pages are thin. The rule for
this work is that a page is done when it would survive somebody using it
every day, not when it renders.

Pages that are still light and need to be made heavy:

- **Library.** Three grids. It should be somewhere you keep things.
- **Discover.** Rows and a filter. It should surface things worth finding.
- **Home.** Better than it was, still mostly rails.
- **Notifications.** A panel with a list in it.
- **Communities.** The wall, ranks and affiliates are real; forums, polls,
  events, the store and payouts from the reference are not built.
- **Search.** Now searches names, descriptions and creators; it does not
  rank anything.

### Profile and avatar customisation
Not built. A marketplace for what people wear and how their profile looks,
which is where the Kobby with sunglasses belongs on the front page. Needs
somewhere to keep what somebody owns, somewhere to put it on, and a way for
creators to sell into it.

## Create

Create is meant to be one of the most important parts of Kobbleston, so it
gets its own list:

- Selling for Pixels **(built)**, with a ceiling per kind of content.
- A page per creator **(built)**.
- Bulk upload, and editing several uploads at once.
- Collections: a creator grouping their own work.
- Follow a creator and hear about what they publish.
- A proper moderation queue for the admin account, rather than the automatic
  filter alone.
- Numbers that go further back than thirty days.

## Smaller things worth doing

- Ads. Deferred by decision, with a 15% creator share documented.
- Avatar and profile customisation, which is its own marketplace.
- Notifications that group sensibly.
- Keyboard shortcuts.
