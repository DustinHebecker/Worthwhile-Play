import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { legalFromEnv } from '../../scripts/legal-env.mjs';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };

/** Legal-notice data comes from the environment at build time and is never committed (docs/deployment.md). */
const legalConfig = (mode: string) => legalFromEnv({ ...loadEnv(mode, new URL('../..', import.meta.url).pathname, 'WP_'), ...process.env });

export default defineConfig(({ mode }) => ({
  define: {
    __WP_LEGAL__: JSON.stringify(legalConfig(mode)),
    __WP_VERSION__: JSON.stringify(pkg.version)
  },
  build: { target: 'es2022', sourcemap: true },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'maskable-icon.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Worthwhile Play',
        short_name: 'Worthwhile',
        description: 'Games worth your attention: logic, memory, strategy and communication. Offline, ad-free, no streaks.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f6f4ef',
        theme_color: '#2f5d50',
        categories: ['games', 'education'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        // Core app and all bundled games are precached: they must work offline after the first visit.
        // Large optional packs (audio, AI models) will use separate, explicitly user-triggered caches.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,txt}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
      },
      devOptions: { enabled: false }
    })
  ]
}));
