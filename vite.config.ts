import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages serves this repo from /kobbleston/. Set VITE_BASE to '/' when
// deploying to a domain root instead.
const base = process.env.VITE_BASE ?? '/kobbleston/'

/**
 * Pages has no server-side rewrites, so a deep link like /discover would 404.
 * Serving the same document as 404.html hands those requests to the router.
 */
function spaFallback() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html')
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), spaFallback()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
