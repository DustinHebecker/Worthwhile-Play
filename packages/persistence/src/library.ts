import {
  GameLibraryError,
  isLibraryId,
  isRecord,
  libraryDataSize,
  LIBRARY_LIMITS,
  normalizeLibraryName,
  type GameLibrary,
  type LibraryEntry,
  type LibraryItem
} from '@wp/game-core';
import { DB_NAME, LIBRARY_BY_GAME_INDEX, LIBRARY_STORE, idbRequest, openDatabase } from './store';

/** A stored item of a game's library (ADR 0012). Key: `[gameId, id]`. */
export interface LibraryRow {
  readonly gameId: string;
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
  /** UTF-8 bytes of `JSON.stringify(data)`. */
  readonly size: number;
  readonly data: unknown;
}

/** Result of `LibraryStore.put`: `full` means nothing was written (the game already has `maxItems` items). */
export type LibraryPutResult = 'created' | 'replaced' | 'full';

/**
 * Things players create in games (e.g. maps), for all games, separate from saves, preferences, decks and learning
 * records: "Delete all saved games" keeps them; Settings has its own confirmed delete. Values are untrusted on read.
 * Games never see this store: they get a `GameLibrary` scoped to their id (`createGameLibrary`).
 */
export interface LibraryStore {
  /** False when IndexedDB is unavailable and items only live until the page is closed. */
  readonly persistent: boolean;
  /** Raw rows of one game. */
  list(gameId: string): Promise<unknown[]>;
  get(gameId: string, id: string): Promise<unknown>;
  /** Creates or replaces a row; creating checks `maxItems` for its game in the same transaction. */
  put(row: LibraryRow, maxItems: number): Promise<LibraryPutResult>;
  remove(gameId: string, id: string): Promise<void>;
  /** Number of items per game id (only games that have items). */
  counts(): Promise<Map<string, number>>;
  /** Removes every item of every game. */
  clear(): Promise<void>;
}

export function createMemoryLibraryStore(): LibraryStore {
  // gameId → id → JSON of the row (a JSON round trip, so callers never share objects with the store).
  const data = new Map<string, Map<string, string>>();
  return {
    persistent: false,
    async list(gameId) {
      return [...(data.get(gameId)?.values() ?? [])].map((v) => JSON.parse(v) as unknown);
    },
    async get(gameId, id) {
      const value = data.get(gameId)?.get(id);
      return value === undefined ? undefined : (JSON.parse(value) as unknown);
    },
    async put(row, maxItems) {
      const encoded = JSON.stringify(row);
      const items = data.get(row.gameId) ?? new Map<string, string>();
      const exists = items.has(row.id);
      if (!exists && items.size >= maxItems) return 'full';
      items.set(row.id, encoded);
      data.set(row.gameId, items);
      return exists ? 'replaced' : 'created';
    },
    async remove(gameId, id) {
      const items = data.get(gameId);
      items?.delete(id);
      if (items?.size === 0) data.delete(gameId);
    },
    async counts() {
      return new Map([...data].map(([gameId, items]) => [gameId, items.size] as const));
    },
    async clear() {
      data.clear();
    }
  };
}

/** IndexedDB-backed library store (`worthwhile-play` → `library`); falls back to memory like the other stores. */
export async function createIndexedDbLibraryStore(factory: IDBFactory | null = globalThis.indexedDB ?? null, name = DB_NAME): Promise<LibraryStore> {
  if (!factory) return createMemoryLibraryStore();
  let db: IDBDatabase;
  try {
    db = await openDatabase(factory, name);
  } catch {
    return createMemoryLibraryStore();
  }
  const store = (mode: IDBTransactionMode) => db.transaction(LIBRARY_STORE, mode).objectStore(LIBRARY_STORE);
  return {
    persistent: true,
    list: (gameId) => idbRequest(store('readonly').index(LIBRARY_BY_GAME_INDEX).getAll(gameId)),
    get: (gameId, id) => idbRequest(store('readonly').get([gameId, id])),
    put: (row, maxItems) => {
      // Serialize first, so a row that is not plain data rejects before a transaction starts.
      const plain = JSON.parse(JSON.stringify(row)) as LibraryRow;
      return new Promise<LibraryPutResult>((resolve, reject) => {
        const tx = db.transaction(LIBRARY_STORE, 'readwrite');
        const objects = tx.objectStore(LIBRARY_STORE);
        let result: LibraryPutResult = 'full';
        // Check and write in one transaction, so two tabs cannot both add the 51st item.
        const existing = objects.count([plain.gameId, plain.id]);
        existing.onsuccess = () => {
          if (existing.result > 0) {
            result = 'replaced';
            objects.put(plain);
            return;
          }
          const count = objects.index(LIBRARY_BY_GAME_INDEX).count(plain.gameId);
          count.onsuccess = () => {
            if (count.result >= maxItems) return;
            result = 'created';
            objects.put(plain);
          };
        };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
      });
    },
    remove: async (gameId, id) => {
      await idbRequest(store('readwrite').delete([gameId, id]));
    },
    counts: async () => {
      const counts = new Map<string, number>();
      for (const key of await idbRequest(store('readonly').getAllKeys())) {
        if (Array.isArray(key) && typeof key[0] === 'string') counts.set(key[0], (counts.get(key[0]) ?? 0) + 1);
      }
      return counts;
    },
    clear: async () => {
      await idbRequest(store('readwrite').clear());
    }
  };
}

/** The row as a list entry of `gameId`, or undefined if it is unreadable (stored data is untrusted). */
function toEntry(row: unknown, gameId: string): (LibraryEntry & { data: unknown }) | undefined {
  if (!isRecord(row) || row.gameId !== gameId || !isLibraryId(row.id) || typeof row.name !== 'string' || typeof row.updatedAt !== 'string') return undefined;
  if (!Number.isSafeInteger(row.size) || (row.size as number) < 0 || !('data' in row)) return undefined;
  return { id: row.id, name: row.name, updatedAt: row.updatedAt, size: row.size as number, data: row.data };
}

export interface GameLibraryOptions {
  /** Clock for `updatedAt` (tests). */
  now?: () => Date;
  /** Id for new items without one (tests); default `crypto.randomUUID()`. */
  newId?: () => string;
  /** Lower bounds for tests; never above `LIBRARY_LIMITS` in the app. */
  limits?: Partial<typeof LIBRARY_LIMITS>;
}

let fallbackCounter = 0;
/** A random id; host code only (games must not depend on ids being random). */
export function randomLibraryId(): string {
  const crypto = globalThis.crypto as Crypto | undefined;
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  // Very old browsers or insecure contexts: unique enough for one device.
  fallbackCounter += 1;
  return `id-${Date.now().toString(36)}-${fallbackCounter.toString(36)}`;
}

/**
 * The `GameContext.library` of one game: validates and bounds every write (ADR 0012) and skips unreadable rows.
 * Every method rejects with a `GameLibraryError` only. `store` may be a promise (the app opens IndexedDB once).
 */
export function createGameLibrary(store: LibraryStore | Promise<LibraryStore>, gameId: string, options: GameLibraryOptions = {}): GameLibrary {
  const limits = { ...LIBRARY_LIMITS, ...options.limits };
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? randomLibraryId;
  /** Runs a storage call; storage failures become `unavailable`. */
  const run = async <T>(call: (s: LibraryStore) => Promise<T>): Promise<T> => {
    try {
      return await call(await store);
    } catch (error) {
      throw error instanceof GameLibraryError ? error : new GameLibraryError('unavailable', error instanceof Error ? error.message : String(error));
    }
  };
  return {
    list: () =>
      run(async (s) => {
        const entries: LibraryEntry[] = [];
        for (const row of await s.list(gameId)) {
          const entry = toEntry(row, gameId);
          if (entry) entries.push({ id: entry.id, name: entry.name, updatedAt: entry.updatedAt, size: entry.size });
        }
        // Most recently changed first; ties (same millisecond) in a stable order.
        return entries.sort((a, b) => (a.updatedAt === b.updatedAt ? (a.id < b.id ? -1 : 1) : a.updatedAt < b.updatedAt ? 1 : -1));
      }),
    get: async (id) => {
      if (!isLibraryId(id)) throw new GameLibraryError('invalid', 'malformed id');
      return run(async (s) => {
        const entry = toEntry(await s.get(gameId, id), gameId);
        return entry && entry.id === id ? ({ id: entry.id, name: entry.name, data: entry.data, updatedAt: entry.updatedAt } satisfies LibraryItem) : undefined;
      });
    },
    put: async (item) => {
      const input = isRecord(item) ? item : {};
      const name = normalizeLibraryName(input.name);
      if (name === undefined || [...name].length > limits.maxNameLength) throw new GameLibraryError('invalid', 'name must have 1 to 60 characters');
      if (input.id !== undefined && !isLibraryId(input.id)) throw new GameLibraryError('invalid', 'malformed id');
      const size = libraryDataSize(input.data);
      if (size === undefined) throw new GameLibraryError('invalid', 'data must be plain JSON');
      if (size > limits.maxBytes) throw new GameLibraryError('too-large', `data has ${size} bytes (at most ${limits.maxBytes})`);
      const row: LibraryRow = {
        gameId,
        id: (input.id as string | undefined) ?? newId(),
        name,
        updatedAt: now().toISOString(),
        size,
        data: JSON.parse(JSON.stringify(input.data)) as unknown
      };
      const result = await run((s) => s.put(row, limits.maxItems));
      if (result === 'full') throw new GameLibraryError('full', `at most ${limits.maxItems} items`);
      return { id: row.id, name: row.name, updatedAt: row.updatedAt, size: row.size };
    },
    delete: async (id) => {
      if (!isLibraryId(id)) throw new GameLibraryError('invalid', 'malformed id');
      await run((s) => s.remove(gameId, id));
    }
  };
}
