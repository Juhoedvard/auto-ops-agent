import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  
  ],
  server: {
    watch: {
      usePolling: true,
    },
    allowedHosts: ['.onrender.com'],
    host: "0.0.0.0",
    strictPort: true,
    port: Number(process.env.PORT) || 5173,
  },
  preview: {

    allowedHosts: ['.onrender.com'],
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 10000,
  }
})
