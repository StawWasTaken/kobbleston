# What is still to build

Kept here rather than in my head, so nothing quietly falls off. Order is
roughly what I would do next, not a promise about dates.

## Big pieces

### The Spaces creator
The editor itself. `docs/editor.md` holds the plan: three ways to build
(Blocks, Style, Files), content used by id (`kob://IMG-1042`) rather than
copied, and every Space served from a separate origin in a sandboxed iframe
with a strict content policy, so nothing a person writes can reach the rest
of Kobbleston. This is the biggest thing left and everything else in "Spaces
stuff" depends on it.

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

### Login and signup
The whole flow needs another pass: username login goes through an edge
function, guests are throwaway accounts, account switching keeps stored
sessions. It works, but it is not solid enough, and the edges (a wrong
password, a taken name, a guest who wants to keep their Space) are not
handled the way they deserve.

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
