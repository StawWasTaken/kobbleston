// Copies the build into the repository root, which is what GitHub Pages
// publishes when its source is a branch. Run by the deploy workflow after
// `npm run build`; `npm run deploy` does both by hand.
import { cpSync, existsSync, rmSync } from 'node:fs'

const built = ['index.html', '404.html', 'assets', 'brand']

if (!existsSync('dist/index.html')) {
  console.error('No build to publish. Run `npm run build` first.')
  process.exit(1)
}

for (const name of built) {
  // Asset filenames are content hashed, so stale ones have to go rather than
  // pile up in the repository.
  rmSync(name, { recursive: true, force: true })
  cpSync(`dist/${name}`, name, { recursive: true })
}

console.log(`Published to the repository root: ${built.join(', ')}`)
