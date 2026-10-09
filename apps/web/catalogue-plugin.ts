import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { runnerImport, type Plugin } from 'vite';

/**
 * Builds the game catalogue (`virtual:wp-catalogue`) at build/dev time.
 *
 * The shell needs every game's metadata for the home page and the game page header, but only a few of its
 * translations (title, tagline, rules, difficulty labels). Importing each game's `metadata.ts` directly would
 * bundle the complete message catalogues of all games in all 16 locales into the main chunk (over 2 MB).
 * This plugin loads each game's metadata in Node and emits it with only the catalogue keys; the complete
 * metadata arrives with the lazily loaded game chunk.
 */
export const CATALOGUE_ID = 'virtual:wp-catalogue';

/** Message keys the shell renders before a game's code is loaded. */
export const isCatalogueKey = (key: string): boolean => key === 'title' || key === 'tagline' || key === 'rules' || key.startsWith('difficulty.');

/** The workspace root (directory with pnpm-workspace.yaml) above the current directory. Not derived from
 *  import.meta.url, which points elsewhere when Vite/Vitest bundle the config. */
function findRoot(from = process.cwd()): string {
  for (let dir = from; ; dir = dirname(dir)) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    if (dirname(dir) === dir) throw new Error('wp-catalogue: pnpm-workspace.yaml not found above the working directory');
  }
}
const root = findRoot();
const webRoot = `${root}/apps/web/`;
/** A path-like id (never written to disk) so both Vite and Vitest's module runner can load it. */
const RESOLVED = `${webRoot}.wp-catalogue.generated.js`;

/** Game packages the app depends on (apps/web/package.json), mapped to their metadata source files. */
function gamePackages(): { name: string; dir: string; metadata: string; messages: string }[] {
  const pkg = JSON.parse(readFileSync(`${webRoot}package.json`, 'utf8')) as { dependencies: Record<string, string> };
  return Object.keys(pkg.dependencies)
    .filter((name) => name.startsWith('@wp/game-') && name !== '@wp/game-core')
    .map((name) => {
      const dir = `${root}/packages/games/${name.slice('@wp/game-'.length)}`;
      return { name, dir, metadata: `${dir}/src/metadata.ts`, messages: `${dir}/src/messages.ts` };
    });
}

type Metadata = { id: string; messages: Record<string, Record<string, string>> } & Record<string, unknown>;

export async function buildCatalogue(): Promise<Record<string, Metadata>> {
  const games = gamePackages();
  const loaded = await Promise.all(
    games.map(async ({ name, metadata }) => {
      const { module } = await runnerImport<{ metadata: Metadata }>(metadata, { configFile: false, root: webRoot, logLevel: 'silent' });
      if (!module.metadata?.id) throw new Error(`${name}: src/metadata.ts does not export metadata`);
      return module.metadata;
    })
  );
  const catalogue: Record<string, Metadata> = {};
  for (const metadata of loaded) {
    const messages: Record<string, Record<string, string>> = {};
    for (const [locale, table] of Object.entries(metadata.messages)) {
      messages[locale] = Object.fromEntries(Object.entries(table).filter(([key]) => isCatalogueKey(key)));
    }
    catalogue[metadata.id] = { ...metadata, messages };
  }
  return catalogue;
}

export function cataloguePlugin(): Plugin {
  return {
    name: 'wp-catalogue',
    resolveId: (id) => (id === CATALOGUE_ID ? RESOLVED : undefined),
    async load(id) {
      if (id !== RESOLVED) return undefined;
      for (const game of gamePackages()) {
        this.addWatchFile(game.metadata);
        this.addWatchFile(game.messages);
      }
      return `export default ${JSON.stringify(await buildCatalogue())};`;
    }
  };
}
