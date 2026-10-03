// @ts-nocheck
import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * Legal-notice data is read from the environment at build time and is never committed
 * (docs/deployment.md). Either one combined value `WP_LEGAL="Name|Street|City|Country"`
 * or the separate WP_LEGAL_NAME / WP_LEGAL_ADDRESS (pipe-separated); optional WP_LEGAL_EMAIL.
 */
function legalFromEnv(mode: string) {
  const env = { ...loadEnv(mode, new URL('../..', import.meta.url).pathname, 'WP_'), ...process.env };
  const lines = (value: string | undefined) => (value ?? '').split('|').map((line) => line.trim()).filter(Boolean);
  const combined = lines(env.WP_LEGAL);
  return {
    name: (env.WP_LEGAL_NAME ?? '').trim() || (combined[0] ?? ''),
    address: env.WP_LEGAL_ADDRESS?.trim() ? lines(env.WP_LEGAL_ADDRESS) : combined.slice(1),
    email: (env.WP_LEGAL_EMAIL ?? '').trim()
  };
}

export default defineConfig(({ mode }) => ({
  define: {
    __WP_LEGAL__: JSON.stringify(legalFromEnv(mode)),
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
