/*
 * A file for every address that points at something.
 *
 * The robots that build a link preview do not run routers, and GitHub Pages
 * cannot tell a robot from a person, so the only way an address like
 * /c/1016/attic-club or /create/SND-1033 can carry its own card is for that
 * address to be a real file. This writes one for every Space, Community,
 * person, event and marketplace upload that is already public, with its name,
 * its words and its picture written in.
 *
 * It reads with the same publishable key the browser carries, so it sees
 * exactly what a stranger sees and nothing more. The deploy runs it again on
 * a schedule, which is how a new Space gets its file.
 *
 * With no network, or with the key missing, it writes nothing and says so:
 * a preview is never worth failing a build over.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { describe, SITE } from './site-pages.mjs'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** The prefix in a marketplace address: SND-1033 is a sound. */
const tags = { image: 'IMG', audio: 'SND', video: 'VID', font: 'FNT', model: 'MDL' }

/** What that kind is called in a sentence. */
const kindWords = {
  image: 'An image', audio: 'A sound', video: 'A video', font: 'A font', model: 'A model',
}

const slug = (value) => encodeURIComponent(value)

/** A card picture has to be somewhere a robot can fetch, over https. */
const picture = (value) => (value && /^https:\/\//.test(value) ? value : null)

/*
 * Each kind is asked for on its own: one table refusing to answer should
 * cost that kind its cards, not every kind its cards.
 */
let refused = 0

async function read(table, query) {
  try {
    const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 200)}`)
    return await response.json()
  } catch (error) {
    refused += 1
    console.warn(`No cards for ${table}: ${error.message}`)
    return []
  }
}

const shorten = (text, limit = 200) => {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  return clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean
}

export async function writeItemPages(into = 'dist') {
  if (!url || !key) {
    console.log('No Supabase details, so no item pages were written.')
    return []
  }

  const document = readFileSync(`${into}/index.html`, 'utf8')
  const pages = []

  const add = (path, page) => pages.push({ path, ...page })

  const [spaces, communities, people, events, assets] = await Promise.all([
    read('spaces', 'select=content_id,slug,name,description,cover_url,emblem_url,owner:profiles!spaces_owner_id_fkey(username,display_name)&is_published=eq.true&is_removed=eq.false&limit=5000'),
    read('communities', 'select=content_id,slug,name,description,icon_url,banner_url,member_count&is_public=eq.true&is_removed=eq.false&limit=5000'),
    read('profiles', 'select=content_id,username,display_name,bio,avatar_url&is_suspended=eq.false&limit=5000'),
    read('community_events', 'select=content_id,title,subtitle,description,cover_url,community:communities(name,icon_url)&is_cancelled=eq.false&limit=5000'),
    read('assets', 'select=content_id,kind,name,description,creator:profiles!assets_creator_id_fkey(display_name)&status=eq.approved&is_public=eq.true&limit=5000'),
  ])

  for (const space of spaces) {
    const by = space.owner?.display_name ?? 'somebody'
    const page = {
      title: `${space.name} - Visit on Kobbleston`,
      description: shorten(space.description) || `A Space on Kobbleston by ${by}. Walk in and see what they did with it.`,
      image: picture(space.cover_url) ?? picture(space.emblem_url),
    }
    if (space.content_id) add(`s/${space.content_id}/${slug(space.slug)}`, page)
    if (space.owner?.username) add(`u/${slug(space.owner.username)}/${slug(space.slug)}`, page)
  }

  for (const group of communities) {
    const page = {
      title: `${group.name} - Kobbleston`,
      description: shorten(group.description)
        || `A Community on Kobbleston with ${group.member_count} ${group.member_count === 1 ? 'member' : 'members'}.`,
      image: picture(group.icon_url) ?? picture(group.banner_url),
      square: !!picture(group.icon_url),
    }
    if (group.content_id) add(`c/${group.content_id}/${slug(group.slug)}`, page)
    add(`c/${slug(group.slug)}`, page)
  }

  for (const person of people) {
    const page = {
      title: `${person.display_name} (@${person.username}) - Kobbleston`,
      description: shorten(person.bio) || `${person.display_name} is on Kobbleston.`,
      image: picture(person.avatar_url),
      square: !!picture(person.avatar_url),
    }
    if (person.content_id) add(`u/${person.content_id}/${slug(person.username)}`, page)
    add(`u/${slug(person.username)}`, page)
  }

  for (const event of events) {
    if (!event.content_id) continue
    add(`e/${event.content_id}`, {
      title: `${event.title} - Kobbleston`,
      description: shorten(event.subtitle || event.description)
        || `An event in ${event.community?.name ?? 'a Community'} on Kobbleston.`,
      image: picture(event.cover_url) ?? picture(event.community?.icon_url),
    })
  }

  for (const asset of assets) {
    if (!asset.content_id) continue
    const tag = tags[asset.kind] ?? 'IMG'
    // The file itself is protected, so the card says what it is and who made
    // it and shows none of it.
    add(`create/${tag}-${asset.content_id}`, {
      title: `${asset.name} - Kobbleston Create`,
      description: shorten(asset.description)
        || `${kindWords[asset.kind] ?? 'Something'} by ${asset.creator?.display_name ?? 'somebody'} on the Creator Marketplace.`,
    })
  }

  for (const page of pages) {
    let html = describe(document, page)
    if (page.image) {
      html = html
        .replace(
          /<meta property="og:image" content="[^"]*" \/>/,
          `<meta property="og:image" content="${page.image}" />`,
        )
        .replace(
          /<meta name="twitter:image" content="[^"]*" \/>/,
          `<meta name="twitter:image" content="${page.image}" />`,
        )
        // An emblem or somebody's picture is square, so a wide card would cut
        // it into a stripe.
        .replace(
          /<meta name="twitter:card" content="[^"]*" \/>/,
          `<meta name="twitter:card" content="${page.square ? 'summary' : 'summary_large_image'}" />`,
        )
      if (page.square) {
        html = html.replace(
          /<meta property="og:image:width" content="[^"]*" \/>\s*<meta property="og:image:height" content="[^"]*" \/>/,
          '',
        )
      }
    }

    const file = `${into}/${page.path}/index.html`
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
  }

  /*
   * A mark for the publish step: with it, this build knows every card there
   * should be and may clear the old ones out. It is only left when every
   * table answered, because a run that could not read one of them does not
   * know what is missing, and must not delete what it cannot see.
   */
  if (refused === 0) {
    writeFileSync(`${into}/.item-pages`, `${pages.length}\n`)
  } else {
    console.warn(`${refused} of the tables did not answer, so published cards are left alone.`)
  }

  console.log(`Wrote ${pages.length} item pages under ${SITE}.`)
  return pages
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeItemPages().catch((error) => {
    console.warn(`No item pages written: ${error.message}`)
  })
}
