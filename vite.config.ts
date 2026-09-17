import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
// @ts-expect-error plain JavaScript, shared with the publish step
import { describe, pages } from './scripts/site-pages.mjs'
import { fileURLToPath, URL } from 'node:url'

// The site is served from kobbleston.com, so everything is addressed from the
// root. Set VITE_BASE to '/kobbleston/' to build a copy for the old project
// path on github.io instead.
const base = process.env.VITE_BASE ?? '/'

/**
 * Pages publishes the repository root, so the built index.html has to be
 * committed there. `app.html` is the source document Vite builds from, which
 * keeps it from being overwritten by its own output. The same document is
 * also written as 404.html: Pages has no rewrites, so that is what hands a
 * deep link like /discover to the router.
 */
function emitSitePages() {
  return {
    name: 'emit-site-pages',
    closeBundle() {
      for (const name of ['index.html', '404.html']) {
        copyFileSync('dist/app.html', `dist/${name}`)
      }
      rmSync('dist/app.html')

      /*
       * A link preview is made by a robot that does not run the router, so
       * every address that reads the same for everybody gets its own file
       * with its own title, description and picture written into it. The
       * router still takes over the moment a person opens it.
       */
      const document = readFileSync('dist/index.html', 'utf8')
      for (const page of pages) {
        const written = describe(document, page)
        if (!page.path) {
          writeFileSync('dist/index.html', written)
          continue
        }
        const file = `dist/${page.path}/index.html`
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, written)
      }
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), emitSitePages()],
  build: {
    rollupOptions: { input: 'app.html' },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
