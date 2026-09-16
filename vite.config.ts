import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, rmSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages serves this repo from /kobbleston/. Set VITE_BASE to '/' when
// deploying to a domain root instead.
const base = process.env.VITE_BASE ?? '/kobbleston/'

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
