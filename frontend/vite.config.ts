import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// O proxy evita CORS: o navegador só fala com o Vite, que repassa /api ao Laravel.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: process.env.API_TARGET ?? 'http://localhost:8081', changeOrigin: true },
      // WebSocket do Reverb (Echo conecta em /app/<chave>) pelo mesmo host/porta da página.
      '^/app/': { target: process.env.WS_TARGET ?? 'http://localhost:8080', ws: true, changeOrigin: true },
    },
  },
})
