// Copies the build into the repository root, which is what GitHub Pages
// publishes when its source is a branch. Run by the deploy workflow after
// `npm run build`; `npm run deploy` does both by hand.
import { cpSync, existsSync, rmSync } from 'node:fs'
import { pageRoots } from './site-pages.mjs'

// The addresses that point at something get their own files too, written
// by write-item-pages.mjs before this runs.
const itemRoots = ['s', 'c', 'u', 'e']

const built = ['index.html', '404.html', 'assets', 'brand', ...pageRoots, ...itemRoots]

if (!existsSync('dist/index.html')) {
  console.error('No build to publish. Run `npm run build` first.')
  process.exit(1)
}

const copied = []

for (const name of built) {
  /*
   * Item pages are written from the database, so a build that could not
   * reach it has none. Leaving the published ones alone is right: a run
   * without the database should not wipe every card off the site.
   */
  if (!existsSync(`dist/${name}`)) continue

  // Asset filenames are content hashed, so stale ones have to go rather than
  // pile up in the repository.
  rmSync(name, { recursive: true, force: true })
  cpSync(`dist/${name}`, name, { recursive: true })
  copied.push(name)
}

console.log(`Published to the repository root: ${copied.join(', ')}`)
