/*
 * The pages the build can describe on its own.
 *
 * Kobbleston is one document with a router inside it, and the robots that
 * make a link preview do not run the router: they read the HTML they are
 * given. So every address that is the same for everybody gets its own file
 * here, with its own title, description and picture written in. Addresses
 * that depend on who or what they point at (a Space, a Community, a person)
 * cannot be known at build time and fall through to 404.html, which carries
 * the site's own card.
 */

export const SITE = 'https://kobbleston.com'
export const TAGLINE = 'Make Something Nobody Else Has'

export const pages = [
  {
    path: '',
    title: 'Kobbleston',
    description: `${TAGLINE}. Build your own Space, fill it with whatever you want, and let people in.`,
  },
  {
    path: 'discover',
    title: 'Discover Spaces on Kobbleston',
    description: 'Spaces people are building and visiting right now. Walk into one and see what they did with it.',
  },
  {
    path: 'create',
    title: 'Kobbleston Create',
    description: 'Upload images, sounds, video and fonts, sell what you make, and build Spaces out of what other people made.',
  },
  {
    path: 'create/marketplace',
    title: 'Creator Marketplace - Kobbleston Create',
    description: 'Images, sounds, video and fonts made by people on Kobbleston, used by their number so the credit sticks.',
  },
  {
    path: 'communities',
    title: 'Communities on Kobbleston',
    description: 'Fan clubs, build teams and hobby corners, each with its own wall, its own ranks, its own events and its own Spaces.',
  },
  {
    path: 'people',
    title: 'People on Kobbleston',
    description: 'Everybody on Kobbleston. Search a name, a username, or the words somebody wrote about themselves.',
  },
  {
    path: 'login',
    title: 'Log in to Kobbleston',
    description: 'Log in with your username and carry on building.',
  },
  {
    path: 'signup',
    title: 'Make a Kobbleston account',
    description: `${TAGLINE}. Free, and it takes about a minute.`,
  },
  {
    path: 'terms',
    title: 'Terms of Service - Kobbleston',
    description: 'The short version of the deal between you and Kobbleston, written so it can actually be read.',
  },
  {
    path: 'guidelines',
    title: 'Community Guidelines - Kobbleston',
    description: 'What is fine on Kobbleston, and what will get your things taken down.',
  },
]

/** Top level names the publish step has to copy and clear out. */
export const pageRoots = [...new Set(
  pages.map((page) => page.path.split('/')[0]).filter(Boolean),
)]

const escape = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Rewrites the shared card in a built document with one page's own. */
/**
 * Create wears its own mark, so a page under it carries that icon in the file
 * itself rather than only once the app has started. A tab should not have to
 * wait for JavaScript to know where it is.
 */
const iconFor = (path) => (
  String(path ?? '').startsWith('create') ? '/brand/favicon-create.png' : '/brand/favicon.png'
)

export function describe(html, page) {
  const url = `${SITE}/${page.path}${page.path ? '/' : ''}`
  const title = escape(page.title)
  const description = escape(page.description)

  return html
    .replace(
      /<link rel="icon" type="image\/png" href="[^"]*" \/>/,
      `<link rel="icon" type="image/png" href="${iconFor(page.path)}" />`,
    )
    .replace(
      /<meta property="og:type" content="[^"]*" \/>/,
      `<meta property="og:type" content="${escape(page.type ?? 'website')}" />`,
    )
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${description}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${url}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${url}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${title}" />`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${description}" />`,
    )
    .replace(
      /<meta property="og:image:alt" content="[^"]*" \/>/,
      `<meta property="og:image:alt" content="${escape(page.imageAlt ?? page.title)}" />`,
    )
}
