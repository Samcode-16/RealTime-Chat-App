import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Adds a dev proxy so frontend requests to /api are forwarded to the backend
// This avoids CORS and keeps the frontend free of hardcoded ports in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy any request starting with /api to the backend dev server
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
