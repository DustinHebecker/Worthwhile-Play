import type { GameSave } from './save';

/** Key-value store for game saves. One active save per game id. */
export interface SaveStore {
  /** Returns the raw (unvalidated) stored value. Use `interpretSave` before trusting it. */
  read(gameId: string): Promise<unknown>;
  write(save: GameSave): Promise<void>;
  remove(gameId: string): Promise<void>;
  /** Ids of games that currently have a save. */
  keys(): Promise<string[]>;
}

export function createMemoryStore(): SaveStore {
  const data = new Map<string, string>();
  return {
    async read(gameId) {
      const value = data.get(gameId);
      return value === undefined ? undefined : JSON.parse(value);
    },
    async write(save) {
      // Round-trip through JSON so tests catch non-serializable state exactly like IndexedDB would.
      data.set(save.gameId, JSON.stringify(save));
    },
    async remove(gameId) {
      data.delete(gameId);
    },
    async keys() {
      return [...data.keys()];
    }
  };
}

export const DB_NAME = 'worthwhile-play';
export const DB_VERSION = 1;
export const SAVES_STORE = 'saves';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

export function openDatabase(factory: IDBFactory = globalThis.indexedDB, name = DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SAVES_STORE)) db.createObjectStore(SAVES_STORE, { keyPath: 'gameId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open IndexedDB'));
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));
  });
}

/**
 * IndexedDB-backed store. Values are stored as JSON-compatible structured clones
 * (state must be plain data). Falls back to an in-memory store when IndexedDB is
 * unavailable (e.g. some private-browsing modes) so play is still possible.
 */
export async function createIndexedDbStore(factory: IDBFactory | null = globalThis.indexedDB ?? null, name = DB_NAME): Promise<SaveStore & { persistent: boolean }> {
  if (!factory) return { ...createMemoryStore(), persistent: false };
  let db: IDBDatabase;
  try {
    db = await openDatabase(factory, name);
  } catch {
    return { ...createMemoryStore(), persistent: false };
  }
  const tx = (mode: IDBTransactionMode) => db.transaction(SAVES_STORE, mode).objectStore(SAVES_STORE);
  return {
    persistent: true,
    read: (gameId) => request(tx('readonly').get(gameId)),
    write: async (save) => {
      await request(tx('readwrite').put(JSON.parse(JSON.stringify(save))));
    },
    remove: async (gameId) => {
      await request(tx('readwrite').delete(gameId));
    },
    keys: async () => (await request(tx('readonly').getAllKeys())).map(String)
  };
}
