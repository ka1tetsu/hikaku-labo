import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        tools: fileURLToPath(new URL('./tools/index.html', import.meta.url)),
        travel: fileURLToPath(new URL('./travel/index.html', import.meta.url)),
        compare: fileURLToPath(new URL('./compare/index.html', import.meta.url)),
        'guide-travel-budget': fileURLToPath(new URL('./guides/travel-budget/index.html', import.meta.url)),
        'guide-website-tools': fileURLToPath(new URL('./guides/website-tools/index.html', import.meta.url)),
      },
    },
  },
})
