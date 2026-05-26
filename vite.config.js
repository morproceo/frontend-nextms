import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    // Bind on all interfaces so a phone on the same Wi-Fi (or a cloudflared
    // tunnel proxying to this port) can reach the dev server.
    host: true,
    // cloudflared / ngrok tunnels send Host: <random>.trycloudflare.com,
    // which Vite blocks by default as a "cross-origin attack". Allow any
    // host while in dev.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
