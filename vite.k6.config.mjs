import { defineConfig } from 'vite'
export default defineConfig({
  root: 'tools/k6/preview',
  publicDir: '../../../public/k6',
  server: { port: 5310 },
})
