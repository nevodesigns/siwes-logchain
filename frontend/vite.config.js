import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the worker ourselves from an inline script in index.html
      // (see index.html) so we can append a version query string. Pxxl's edge
      // returned the SPA fallback for the bare /sw.v2.js path once and cached
      // that HTML immutably, poisoning the bare URL. Cloudflare keys its cache
      // by query string, so /sw.v2.js?v=N is a clean key that serves the real
      // worker file. The plugin's own registration cannot add that query, so
      // we disable it here.
      injectRegister: false,
      // Pxxl serves .js files with a one year immutable cache and never purges
      // sw.js on deploy, so the old precache worker stayed frozen at the CDN
      // edge and kept old code alive on returning devices. Serving the worker
      // under a fresh filename gets it past that frozen cache. It only ever
      // needs bumping again if the worker logic itself changes, which is rare
      // now that the worker is network first.
      filename: 'sw.v2.js',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'SIWES LogChain',
        short_name: 'SIWESLog',
        description:
          'Tamper-proof onchain logbook for Nigerian industrial training',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Hashed assets are precached for offline use, but the HTML document is
        // deliberately NOT precached. Navigations go network first so a
        // returning user always gets the latest app when online, even if the
        // service worker file itself is stale-cached by the host CDN (Pxxl
        // serves sw.js immutable, which would otherwise pin users to old code).
        // Contract reads are JSON-RPC POSTs to the Monad RPC, no route matches
        // them so they are never cached, records are always live.
        globPatterns: ['**/*.{js,css,svg,png,ico,woff2}'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // always try the network for the app shell, fall back to cache only
            // when offline so a new deploy is picked up on the next load
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-shell',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 12 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
