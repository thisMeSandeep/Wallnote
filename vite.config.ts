import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' rather than 'autoUpdate': the wall lives in localStorage and
      // saves on a 400ms debounce, so a reload the user didn't ask for can
      // drop the stroke or sentence they were in the middle of.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Wallnote',
        short_name: 'Wallnote',
        description: 'A wall you stick notes on — and draw on.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#211d1a',
        theme_color: '#211d1a',
        orientation: 'any',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Fonts must be precached explicitly — the default glob covers only
        // js/css/html/svg/png, which would leave the handwriting missing the
        // first time the app opened offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      devOptions: {
        // Lets the service worker be exercised via `npm run dev` instead of
        // only in a production build.
        enabled: false,
        type: 'module',
      },
    }),
  ],
  server: { port: 5173, open: true },
});
