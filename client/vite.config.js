import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const backend = process.env.VITE_PROXY_TARGET || 'http://localhost:5001';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/uploads': { target: backend, changeOrigin: true },
    },
  },
});
