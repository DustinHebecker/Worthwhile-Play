import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { runnerImport, type Plugin } from 'vite';

/**
 * Publishes the guides for AIs ("Create a deck with an AI") as static Markdown files, one per UI locale:
 * `/ai/deck-guide.<locale>.md`. They are generated from `packages/learning-content/src/ai-guide.ts` at build
 * time (emitted into `dist/`) and served from memory by the dev server, so they are never committed and cannot
 * drift from the importer. They are not precached by the service worker (only AIs and curious people read
 * them, online), and the service worker does not answer them with the app shell (`navigateFallbackDenylist`).
 *
 * `WP_SITE_ORIGIN` overrides the origin the guides name in their links (default: the production site).
 */
export const AI_GUIDE_PREFIX = '/ai/';

function findRoot(from = process.cwd()): string {
  for (let dir = from; ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    if (dirname(dir) === dir) throw new Error('wp-ai-guide: pnpm-workspace.yaml not found above the working directory');
  }
}

type GuideModule = { deckGuideFiles: (origin?: string) => Record<string, string> };

export async function buildAiGuides(origin = process.env.WP_SITE_ORIGIN || undefined): Promise<Record<string, string>> {
  const root = findRoot();
  const { module } = await runnerImport<GuideModule>(`${root}/packages/learning-content/src/ai-guide.ts`, { configFile: false, root: `${root}/apps/web/`, logLevel: 'silent' });
  return module.deckGuideFiles(origin);
}

export function aiGuidePlugin(): Plugin {
  let cached: Promise<Record<string, string>> | undefined;
  const files = () =>
    (cached ??= buildAiGuides().catch((error: unknown) => {
      cached = undefined;
      throw error;
    }));
  return {
    name: 'wp-ai-guide',
    configureServer(server) {
      // Regenerate after edits to the guide or the importer.
      server.watcher.on('change', (file) => {
        if (file.includes('/packages/learning-content/src/')) cached = undefined;
      });
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split(/[?#]/)[0] ?? '';
        if (!path.startsWith(AI_GUIDE_PREFIX)) return next();
        files()
          .then((all) => {
            const body = all[path.slice(1)];
            if (body === undefined) return next();
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.end(body);
          })
          .catch(next);
      });
    },
    async generateBundle() {
      for (const [fileName, source] of Object.entries(await files())) this.emitFile({ type: 'asset', fileName, source });
    }
  };
}
