import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { runnerImport, type Plugin } from 'vite';

/**
 * Builds the game catalogue at build/dev time, split so that the main chunk carries no translations:
 *
 * - `virtual:wp-catalogue`: every game's metadata without messages (ids, skills, difficulties, capabilities…).
 * - `virtual:wp-catalogue/<locale>`: the catalogue messages of one locale for every game, `{ [gameId]: messages }`.
 *   Only the catalogue keys (title, tagline, rules, difficulty labels) are kept; the complete messages arrive
 *   with the lazily loaded game chunk. The shell imports these per locale on demand (apps/web/src/i18n), so each
 *   locale is its own chunk.
 *
 * Importing each game's `metadata.ts` directly would bundle the complete message catalogues of all games in all
 * 16 locales into the main chunk (over 2 MB).
 */
export const CATALOGUE_ID = 'virtual:wp-catalogue';
const LOCALE_PREFIX = `${CATALOGUE_ID}/`;

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
/** Path-like ids (never written to disk) so both Vite and Vitest's module runner can load them. */
const RESOLVED = `${webRoot}.wp-catalogue.generated.js`;
const RESOLVED_LOCALE = /\.wp-catalogue\.([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)\.generated\.js$/;
const resolvedLocale = (locale: string) => `${webRoot}.wp-catalogue.${locale}.generated.js`;

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

type Messages = Record<string, Record<string, string>>;
type Metadata = { id: string; messages: Messages } & Record<string, unknown>;

export interface Catalogue {
  /** Metadata per game id, without `messages`. */
  metadata: Record<string, Omit<Metadata, 'messages'>>;
  /** Catalogue messages per locale, then per game id. */
  messages: Record<string, Record<string, Record<string, string>>>;
}

export async function buildCatalogue(): Promise<Catalogue> {
  const games = gamePackages();
  const loaded = await Promise.all(
    games.map(async ({ name, metadata }) => {
      const { module } = await runnerImport<{ metadata: Metadata }>(metadata, { configFile: false, root: webRoot, logLevel: 'silent' });
      if (!module.metadata?.id) throw new Error(`${name}: src/metadata.ts does not export metadata`);
      return module.metadata;
    })
  );
  const catalogue: Catalogue = { metadata: {}, messages: {} };
  for (const { messages, ...rest } of loaded) {
    catalogue.metadata[rest.id] = rest;
    for (const [locale, table] of Object.entries(messages)) {
      (catalogue.messages[locale] ??= {})[rest.id] = Object.fromEntries(Object.entries(table).filter(([key]) => isCatalogueKey(key)));
    }
  }
  return catalogue;
}

export function cataloguePlugin(): Plugin {
  // One build of the catalogue serves the main module and all locale modules; reset when a source changes.
  let cached: Promise<Catalogue> | undefined;
  const watched = new Set<string>();
  return {
    name: 'wp-catalogue',
    resolveId(id) {
      if (id === CATALOGUE_ID) return RESOLVED;
      if (id.startsWith(LOCALE_PREFIX)) return resolvedLocale(id.slice(LOCALE_PREFIX.length));
      return undefined;
    },
    watchChange(id) {
      if (watched.has(id)) cached = undefined;
    },
    async load(id) {
      const locale = RESOLVED_LOCALE.exec(id)?.[1];
      if (id !== RESOLVED && locale === undefined) return undefined;
      for (const game of gamePackages()) {
        for (const file of [game.metadata, game.messages]) {
          watched.add(file);
          this.addWatchFile(file);
        }
      }
      const catalogue = await (cached ??= buildCatalogue().catch((error: unknown) => {
        cached = undefined;
        throw error;
      }));
      if (locale === undefined) return `export default ${JSON.stringify(catalogue.metadata)};`;
      const messages = catalogue.messages[locale];
      if (!messages) throw new Error(`wp-catalogue: no game has messages for locale "${locale}"`);
      return `export default ${JSON.stringify(messages)};`;
    }
  };
}
