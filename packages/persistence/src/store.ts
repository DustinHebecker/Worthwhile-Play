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
/**
 * Schema history (upgrades are additive; existing stores and data are never touched):
 * 1 — `saves` (one game save per game id)
 * 2 — `decks` (learning decks imported by the user)
 */
export const DB_VERSION = 2;
export const SAVES_STORE = 'saves';
export const DECKS_STORE = 'decks';
/** How long to wait for another tab (running an older version) to release the database before giving up. */
export const UPGRADE_BLOCKED_TIMEOUT_MS = 4000;

export function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

/** Creates the object stores missing in `db` (runs inside `onupgradeneeded`; never deletes anything). */
export function upgradeDatabase(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(SAVES_STORE)) db.createObjectStore(SAVES_STORE, { keyPath: 'gameId' });
  if (!db.objectStoreNames.contains(DECKS_STORE)) db.createObjectStore(DECKS_STORE, { keyPath: 'id' });
}

export function openDatabase(factory: IDBFactory = globalThis.indexedDB, name = DB_NAME, blockedTimeoutMs = UPGRADE_BLOCKED_TIMEOUT_MS): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const req = factory.open(name, DB_VERSION);
    req.onupgradeneeded = () => upgradeDatabase(req.result);
    req.onsuccess = () => {
      const db = req.result;
      if (timer !== undefined) clearTimeout(timer);
      if (settled) {
        // We already gave up waiting (blocked upgrade); do not keep an unused connection open.
        db.close();
        return;
      }
      settled = true;
      // Let a newer version of the app (in another tab) upgrade the database: close instead of blocking it.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => {
      if (timer !== undefined) clearTimeout(timer);
      if (settled) return;
      settled = true;
      reject(req.error ?? new Error('Could not open IndexedDB'));
    };
    // Another tab still holds an older version open. Wait a moment (it may close or release it), then give up
    // so the caller can fall back instead of hanging.
    req.onblocked = () => {
      if (timer !== undefined || settled) return;
      timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('IndexedDB upgrade blocked by another tab'));
      }, blockedTimeoutMs);
    };
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
    read: (gameId) => idbRequest(tx('readonly').get(gameId)),
    write: async (save) => {
      await idbRequest(tx('readwrite').put(JSON.parse(JSON.stringify(save))));
    },
    remove: async (gameId) => {
      await idbRequest(tx('readwrite').delete(gameId));
    },
    keys: async () => (await idbRequest(tx('readonly').getAllKeys())).map(String)
  };
}
