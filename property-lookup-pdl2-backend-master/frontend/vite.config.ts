import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['pdl.4projectss.com'],
    hmr: {
      protocol: 'wss',
      host: 'pdl.4projectss.com',
      clientPort: 443,
    },
  },
})
