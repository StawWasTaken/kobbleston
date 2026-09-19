# What would make the next Kobbleston awkward

An honest look through the repository against `docs/direction.md`. Each entry
says what is there now, why it matters later, and what I would do about it.
Nothing here is a reason to stop and rebuild: most of it is a seam to put in
before it is needed, not a rewrite.

## 1. The currency is named in fifty places (done on the web side)

**Was:** the word "Kubes" was written into pages, labels, toasts and policy
text; the mark was a component called `Kube`; the balance column is
`profiles.pixels`, from the name before that.

**Now:** `src/lib/currency.ts` holds the name, the plural, the short code, how
an amount reads in a sentence, and what each kind of movement reads as.
`src/components/brand/Currency.tsx` holds the mark and a price;
`src/components/money/` holds a balance and a list of movements. Nothing else
on the site draws its own. Renaming what people see, or replacing the mark
with a shape of our own, is a change to those files and nothing else.

The settings section is keyed rather than named for the same reason, so the
menu reads whatever the currency is called rather than a word baked into a
type.

**Still to do:** the database keeps the oldest name of all. `profiles.pixels`,
`move_pixels`, `grant_community_kubes`, `burn_kubes` and friends are a
migration of their own, with functions and policies hanging off them. Worth
doing once the name is settled, in one pass, rather than half now.

## 2. A Space can only ever be a website

`spaces` has no notion of what kind of thing it is. Everything downstream
assumes files and blocks: `space_files`, `page.json`, the compiler, the
sandboxed frame, Discover, the builder.

**Why it matters:** a 3D Space, a game and a 2D site have to live in the same
table to share visits, likes, favourites, comments, ads, moderation, chat and
addresses. If they do not, half the platform gets forked.

**What to do:** one column, `kind`, defaulting to the website we have, before
anything else in that area is built. Every existing query keeps working, the
builder filters on it, and a second kind becomes an addition rather than a
parallel world. Not a migration to write today, but the first one when 3D
research starts.

## 3. The avatar is a picture, not an avatar

A profile has `avatar_url`, and now `style` as a snapshot of what somebody is
wearing. Style items are placements on a square picture: x, y, width, rotation,
layer.

**Why it matters:** Phase 5 wants an avatar with a body, a face, colours and
parts, whose profile picture is rendered from it rather than uploaded beside
it. The placement model is 2D by nature and cannot describe a hat on a head in
three dimensions.

**What to do, in order:** an `avatars` model (body, colours, parts) that the
profile points at; the picture becomes something we draw from it and cache;
`style_items` grows a way to say how a thing is rendered, so a 2D placement and
a future 3D asset are two kinds of the same Catalog item rather than two
Catalogs. What exists keeps working throughout: a 2D placement stays a valid
way to render an item.

## 4. Two legal pages, no policy system

`src/pages/Policies.tsx` carries Terms and Guidelines as arrays of headings and
paragraphs. There is no hub, no per topic document, no versioning, no dates,
and no way to point at one rule.

**What to do:** a policy hub with a document per topic (Catalog and UGC,
Creator Marketplace, currency, games and experiences, moderation, copyright),
each with its own address and a last updated date, so support and moderation
can link to the rule rather than the page. The wording needs proper review by
somebody qualified. Nothing on the site should claim it has had that review
until it has.

## 5. The component language is half there

`src/components/ui` has Button, Card, Input, Select, Dialog, Menu, Tooltip,
Toast, States, Confirm, Avatar, PersonAvatar, StatusDot and Picker, and they
are used everywhere. Good.

What is not there, and is therefore hand rolled per page, at last count in
Friends, Style, People, Create, Communities and Settings: tabs, filter chips,
page headers, section headers, stat tiles, the sticky toolbar, the money row.
Each is written slightly differently, which is exactly how a site stops
looking like one product.

**What to do:** promote those six into `ui`, then move pages onto them one at
a time. This is Phase 2 and it is mostly deleting.

## 6. One way in to the backend, mostly

`src/lib/api.ts` is the single place that talks to Supabase for data, which is
what makes three clients possible later. Nine files reach for the client
directly, and all of them have a reason: realtime channels, auth, presence.

**What to do:** nothing structural now. Keep the rule that data access goes
through `api.ts`, and when a second client appears, that file plus
`src/types/db.ts` become the shared package. It is 1,900 lines and wants
splitting by area at that point, not before.

## 7. Types mix the database and the screen

`src/types/db.ts` holds both row shapes and shapes invented for a page. Two
clients would want the row shapes on their own.

**What to do:** split when the second client exists, not now. Noted so it is a
decision rather than an accident.

## 8. Notifications carry everything, including things that must not be lost

One `notifications` table, one bell, one feed. The direction separates two
kinds of message: ordinary activity, and communication from Kobbleston
itself, which is moderation decisions, security notices, support replies,
policy notices and announcements. The second kind cannot be allowed to scroll
past behind six people liking a Space.

**What to do:** an official inbox as its own thing, with its own address, its
own unread count and its own retention, feeding from moderation, support and
announcements. The notifications table stays as it is for activity. This
lands with the safety structure below rather than on its own.

## 9. There is no account standing, and nothing to appeal to

Reports exist and create real rows. What does not exist is the other half:
what happened as a result, what somebody is currently restricted from doing,
and a way to ask for that to be looked at again. Moderation today can only
remove things.

**What to do:** violations as records against an account, an account status
page that says plainly where somebody stands without exposing internal
moderation notes, and appeals that create real rows a moderator sees. No
decorative pages: if it is on screen, it is connected to something.

## 10. Create is built around uploads and Spaces

The hub's rail is Spaces, Uploads, Marketplace, Inventory, Analytics, Ads. The
direction wants Spaces, Avatar, Catalog and, later, experiences.

**What to do:** the rail is data, so this is a small change when the avatar
work lands. Worth doing at the same time rather than twice.
