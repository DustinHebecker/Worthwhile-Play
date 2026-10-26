/**
 * Lazy access to the atlas (design § 11.3, § 11.5): the generated module is one dynamically imported chunk, loaded
 * on the first opening of the game (`preload`), never on the home page, precached for offline use like every chunk.
 */
import { decodeAtlas, type Atlas } from '../atlas';

let cached: Atlas | null = null;
let pending: Promise<Atlas> | null = null;

/** Loads and decodes the atlas once; a failed load (e.g. offline before caching) is retried by the next call. */
export function loadAtlas(): Promise<Atlas> {
  if (cached) return Promise.resolve(cached);
  pending ??= import('./atlas.gen').then(
    (m) => (cached = decodeAtlas(m.ATLAS_DATA)),
    (error: unknown) => {
      pending = null;
      throw error;
    }
  );
  return pending;
}

/** The decoded atlas; throws when `loadAtlas` has not completed (a programming error, like `contentFor`). */
export function atlasSync(): Atlas {
  if (!cached) throw new Error('The atlas is not loaded: await loadAtlas() (the game\'s preload) first.');
  return cached;
}

/** Whether the atlas is loaded (`isValidState` rejects saves it cannot check). */
export const atlasLoaded = (): boolean => cached !== null;
