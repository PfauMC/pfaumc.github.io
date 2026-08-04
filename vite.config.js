import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Локальный API форума (scripts/dev-server.mjs). На проде /api обслуживают
    // Netlify Functions, эта настройка работает только в `npm run dev`.
    proxy: {
      '/api': { target: `http://localhost:${process.env.FORUM_DEV_PORT ?? 8787}`, changeOrigin: false },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom')) return 'vendor'
        },
      },
    },
  },
})
