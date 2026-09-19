import { defineConfig } from 'vite'
import { resolve } from 'node:path'

/** The engine harness: the runtime on its own, away from the website. */
export default defineConfig({
  root: 'tools/engine',
  publicDir: resolve(process.cwd(), 'public'),
  resolve: { alias: { '@': resolve(process.cwd(), 'src') } },
  server: { port: 5320 },
})
