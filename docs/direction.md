# Where Kobbleston is going

Written down after the direction meeting, so the work has one place to point
at rather than living in a chat log.

## The short version

Kobbleston is a social creation platform. It begins with 2D Spaces and grows
into avatars, a Catalog, 3D worlds and games, with a player and a desktop
creator alongside the website. The website builder is not being replaced. It
becomes the first generation of Kobbleston, and a Space eventually means more
than one kind of thing.

The goal is not to rebuild somebody else's platform under our name. It is to
build a place where people make things, share them and experience them
together, which is what Kobbleston already is at a smaller size.

## Three doors, one platform

Eventually there are three ways in, and they are the same Kobbleston:

- **Kobbleston Web.** What exists today: accounts, profiles, friends, chat,
  discovery, 2D Spaces, the Catalog, creator management, publishing, settings.
  This does not shrink as the rest arrives. It grows.
- **A player.** A dedicated application for entering 3D Spaces and games.
  Not built, not named.
- **A desktop creator.** Deep 3D creation: scenes, assets, scripting, testing,
  publishing, versioning. Not built, not named, and deliberately not called
  Studio by default. Kobbleston Create on the web is management and 2D making;
  the desktop application is for the heavy work. They are not the same product
  and neither pretends to be the other.

They share accounts, profiles, avatars, friends, chat, Spaces, the Catalog,
the currency, permissions, moderation, publishing, notifications and the
backend. Somebody moving between them should feel like they walked through a
different door of the same building.

## What is being built now, and what is not

In order, and only as far as each is actually needed:

1. Keep today's Kobbleston working and coherent.
2. Know what in the architecture would make the rest awkward, and write it
   down (`docs/audit.md`).
3. One product, visually and behaviourally: a real component language rather
   than forty pages each solving tabs and chips their own way.
4. The currency behind an abstraction, so it can be renamed once and properly.
5. A policy system rather than two legal pages.
6. The avatar data model, derived from Kobby, with the profile picture drawn
   from the avatar rather than uploaded beside it.
7. Create grows: Spaces, Avatar, Catalog, and later experiences.
8. Catalog and UGC foundations, with user content treated as untrusted at
   every step.
9. Only then, research on a 3D runtime, starting at the smallest thing that
   runs: a scene, a Kobby shaped character, a camera, movement, a floor.

Nothing here is a reason to rip anything out. Each step leaves the site
working, and each is small enough to test before the next one starts.

## Principles

- The existing work is the foundation, not a draft to be thrown away.
- Small subsystem, tested, integrated, committed, then the next one. No giant
  speculative architecture in one pass.
- Kobbleston looks like Kobbleston: our own type, our own components, our own
  motion, our own words, Kobby used deliberately. Not a generic product, and
  not a copy of the platforms we are compared to.
- User content is untrusted input, always, in every surface. Nothing a person
  uploads runs as trusted platform code, and authorisation lives in the
  database rather than in a form.
