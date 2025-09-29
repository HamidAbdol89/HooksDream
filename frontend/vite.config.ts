import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['crypto', 'stream', 'util', 'buffer', 'process'],
      exclude: ['fs'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
              }
            }
          },
          // Thêm runtime caching cho API calls
          {
            urlPattern: /^https:\/\/.*\.(?:json)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'HooksDream',
        short_name: 'HooksDream',
        description: 'HooksDream is a modern social media platform that helps you connect with friends, share beautiful moments, and discover interesting things every day.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['social', 'entertainment'],
        lang: 'vi',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      // Thêm cấu hình devOptions để test PWA trên dev mode
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Thêm cấu hình server để hỗ trợ mobile testing
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ các device khác
    port: 5173,
    cors: true,
    // Thêm headers để tránh CORS issues
    proxy: {
      '/api': {
        target: 'https://hooksdream.fly.dev', 
        changeOrigin: true,
        secure: true,
      }
    }
  },
  // Cấu hình preview cho production build
  preview: {
    host: '0.0.0.0',
    port: 4173,
    cors: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Đảm bảo assets được build đúng
    assetsInlineLimit: 4096,
  },
});