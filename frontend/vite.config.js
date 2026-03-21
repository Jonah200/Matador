import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    cors: {
      origin: [
        'chrome-extension://filoabfofdljklbbebjdgfoicabljdnm',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
      credentials: true,
    },
  },
})