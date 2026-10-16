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
      },
    },
  },
})
