import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    allowedHosts: ['wsd-app.anajak.cloud', 'sg1.anajak.cloud', 'localhost'],
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'icon-192.png', 'icon-512.png', 'maskable.png'],
      workbox: { maximumFileSizeToCacheInBytes: 2000000 },
      manifest: {
        id: '/',
        name: 'វត្តស្នាយដួច',
        short_name: 'វត្តស្នាយដួច',
        description: 'កម្មវិធីគ្រប់គ្រងទិន្នន័យវត្តស្នាយដួច',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});
