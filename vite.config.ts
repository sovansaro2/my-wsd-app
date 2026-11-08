import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  server: {
    allowedHosts: ['watsnaydouch.site', 'wsd-app.anajak.cloud', 'sg1.anajak.cloud', 'localhost'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('logoBase64') || id.includes('fontEmbed') || id.includes('signBase64')) {
            return 'heavy-embeds';
          }
          if (id.includes('node_modules')) {
            if (id.includes('exceljs')) return 'vendor-exceljs';
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html-to-image')) return 'vendor-export';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('motion')) return 'vendor-motion';
          }
        }
      }
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico', 
        'icon.svg', 
        'icon-192.png', 
        'icon-512.png', 
        'pwa-192x192.png', 
        'pwa-512x512.png', 
        'maskable.png', 
        'logo.png', 
        'Sign.png',
        'fonts/KhmerOS_muollight.ttf'
      ],
      workbox: {
        maximumFileSizeToCacheInBytes: 10000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,mp3}'],
        globIgnores: ['**/logo-original.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 15,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|ttf|mp3)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        id: '/',
        name: 'វត្តស្នាយដួច',
        short_name: 'វត្តស្នាយដួច',
        description: 'កម្មវិធីគ្រប់គ្រងទិន្នន័យវត្តស្នាយដួច',
        theme_color: '#028090',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
});
