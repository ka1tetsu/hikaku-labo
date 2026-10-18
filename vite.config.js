import { defineConfig } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { SITE_ORIGIN, siteOrigin } from './src/shared/site.js'

export default defineConfig({
  plugins: [react()],
  define: { 'import.meta.env.VITE_SITE_ORIGIN': JSON.stringify(siteOrigin(process.env.SITE_ORIGIN || SITE_ORIGIN)) },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        tools: fileURLToPath(new URL('./tools/index.html', import.meta.url)),
        travel: fileURLToPath(new URL('./travel/index.html', import.meta.url)),
        compare: fileURLToPath(new URL('./compare/index.html', import.meta.url)),
        life: fileURLToPath(new URL('./life/index.html', import.meta.url)),
        sim: fileURLToPath(new URL('./sim/index.html', import.meta.url)),
        hikari: fileURLToPath(new URL('./hikari/index.html', import.meta.url)),
        card: fileURLToPath(new URL('./card/index.html', import.meta.url)),
        hoken: fileURLToPath(new URL('./hoken/index.html', import.meta.url)),
        'guide-travel-budget': fileURLToPath(new URL('./guides/travel-budget/index.html', import.meta.url)),
        'guide-website-tools': fileURLToPath(new URL('./guides/website-tools/index.html', import.meta.url)),
      },
    },
  },
})
