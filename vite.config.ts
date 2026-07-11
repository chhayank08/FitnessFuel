import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { UserConfig } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig(async (): Promise<UserConfig> => {
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        strategies: 'generateSW',
        manifestFilename: 'manifest.webmanifest',
        includeAssets: ['icons/*.png'],
        manifest: {
          id: '/dashboard',
          name: 'Fitness Fuel',
          short_name: 'FitnFuel',
          description: 'Your personalized digital health platform — nutrition, training, and recovery in one place.',
          start_url: '/dashboard',
          scope: '/',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          background_color: '#0D0D18',
          theme_color: '#0D0D18',
          orientation: 'portrait',
          categories: ['health', 'fitness', 'lifestyle'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-assets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/storage\.googleapis\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'mediapipe-model',
                expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\//,
              handler: 'NetworkFirst',
              method: 'GET',
              options: {
                cacheName: 'supabase-postgrest',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/auth\/v1\//,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/functions\/v1\//,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/world\.openfoodfacts\.org\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'openfoodfacts-api', cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\/\/api\.nal\.usda\.gov\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'usda-api', cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\/\/exercisedb\.p\.rapidapi\.com\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'exercisedb-api', cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\/\/eutils\.ncbi\.nlm\.nih\.gov\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'pubmed-api', cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\/\/clinicaltrials\.gov\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'clinicaltrials-api', cacheableResponse: { statuses: [0, 200] } },
            },
            {
              urlPattern: /^https:\/\/api\.fda\.gov\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'openfda-api', cacheableResponse: { statuses: [0, 200] } },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            recharts: ['recharts'],
            'framer-motion': ['framer-motion'],
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api/diet': {
          target: `http://localhost:5001`,
          changeOrigin: true,
          secure: false,
          timeout: 10000,
          rewrite: (path: string) => path.replace(/^\/api/, ''),
          configure: (proxy: any) => {
            proxy.on('error', (err: Error, _req: IncomingMessage, res: ServerResponse) => {
              console.log('Proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(503, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({ 
                  error: 'Diet service unavailable',
                  detail: 'The diet recommendation service is currently unavailable. Please try again later.'
                }));
              }
            });

            proxy.on('proxyReq', (proxyReq: any, req: any) => {
              if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
              }
            });
          },
        },
      },
    },
  };
});
