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
      strategies: 'generateSW',
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,webp,jpg,jpeg}',
          'assets/**/*'
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
        skipWaiting: true,
        clientsClaim: true,
        mode: 'production', // ⚡ Disable workbox logs
        disableDevLogs: true, // ⚡ Disable dev logs
        runtimeCaching: [
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          },
          // API calls - Network First with fallback
          {
            urlPattern: /^https:\/\/hooksdream\.fly\.dev\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 10 // 10 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          },
          // Images - Cache First with long expiration
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          // Cloudinary images
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              }
            }
          },
          // Static assets
          {
            urlPattern: /\.(?:js|css|woff2?)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              }
            }
          }
        ]
      },
      manifest: {
        name: 'HooksDream - Social Media Platform',
        short_name: 'HooksDream',
        description: 'Connect, share, and discover with HooksDream - the modern social platform for meaningful connections and beautiful moments.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?utm_source=pwa&standalone=true',
        categories: ['social', 'entertainment', 'lifestyle', 'photo', 'communication'],
        lang: 'vi',
        dir: 'ltr',
        // Advanced display modes
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui', 'browser'],
        // Launch handler for better startup
        launch_handler: {
          client_mode: ['navigate-existing', 'auto']
        },
        // Handle system theme
        prefer_related_applications: false,
        // Edge side panel for desktop
        edge_side_panel: {
          preferred_width: 400
        },
        // Shortcuts for quick actions
        shortcuts: [
          {
            name: 'Create Post',
            short_name: 'Post',
            description: 'Create a new post',
            url: '/create?utm_source=pwa_shortcut',
            icons: [{ src: '/icon-create.png', sizes: '96x96' }]
          },
          {
            name: 'Messages',
            short_name: 'Chat',
            description: 'View messages',
            url: '/messages?utm_source=pwa_shortcut',
            icons: [{ src: '/icon-messages.png', sizes: '96x96' }]
          },
          {
            name: 'Profile',
            short_name: 'Profile',
            description: 'View your profile',
            url: '/profile?utm_source=pwa_shortcut',
            icons: [{ src: '/icon-profile.png', sizes: '96x96' }]
          }
        ],
        // File handling for sharing
        file_handlers: [
          {
            action: '/share',
            accept: {
              'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
              'video/*': ['.mp4', '.webm', '.mov']
            }
          }
        ],
        // Share target for receiving shares
        share_target: {
          action: '/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'files',
                accept: ['image/*', 'video/*']
              }
            ]
          }
        },
        // Protocol handlers
        protocol_handlers: [
          {
            protocol: 'web+hooksdream',
            url: '/handle?url=%s'
          }
        ],
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
          },
          // Additional icon sizes for better platform support
          {
            src: '/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
         
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
        target: 'https://just-solace-production.up.railway.app', 
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
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          socket: ['socket.io-client'],
          utils: ['lodash-es', 'date-fns'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    target: 'esnext',
    cssCodeSplit: true,
    reportCompressedSize: false
  },
});