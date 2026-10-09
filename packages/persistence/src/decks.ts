import { DB_NAME, DECKS_STORE, openDatabase, idbRequest } from './store';

/** A stored deck record. The shape beyond `id` is owned by the caller (validated on read). */
export interface DeckRecord {
  id: string;
  [key: string]: unknown;
}

/**
 * Key-value store for learning decks imported by the user, separate from game saves:
 * deleting saved games never deletes decks. Values are untrusted on read (validate them).
 */
export interface DeckStore {
  /** False when IndexedDB is unavailable and decks only live until the page is closed. */
  readonly persistent: boolean;
  list(): Promise<unknown[]>;
  get(id: string): Promise<unknown>;
  put(record: DeckRecord): Promise<void>;
  remove(id: string): Promise<void>;
  /** Removes every imported deck. */
  clear(): Promise<void>;
}

export function createMemoryDeckStore(): DeckStore {
  const data = new Map<string, string>();
  return {
    persistent: false,
    async list() {
      return [...data.values()].map((v) => JSON.parse(v) as unknown);
    },
    async get(id) {
      const value = data.get(id);
      return value === undefined ? undefined : (JSON.parse(value) as unknown);
    },
    async put(record) {
      data.set(record.id, JSON.stringify(record));
    },
    async remove(id) {
      data.delete(id);
    },
    async clear() {
      data.clear();
    }
  };
}

/** IndexedDB-backed deck store (`worthwhile-play` → `decks`); falls back to memory like the save store. */
export async function createIndexedDbDeckStore(factory: IDBFactory | null = globalThis.indexedDB ?? null, name = DB_NAME): Promise<DeckStore> {
  if (!factory) return createMemoryDeckStore();
  let db: IDBDatabase;
  try {
    db = await openDatabase(factory, name);
  } catch {
    return createMemoryDeckStore();
  }
  const tx = (mode: IDBTransactionMode) => db.transaction(DECKS_STORE, mode).objectStore(DECKS_STORE);
  return {
    persistent: true,
    list: () => idbRequest(tx('readonly').getAll()),
    get: (id) => idbRequest(tx('readonly').get(id)),
    put: async (record) => {
      await idbRequest(tx('readwrite').put(JSON.parse(JSON.stringify(record))));
    },
    remove: async (id) => {
      await idbRequest(tx('readwrite').delete(id));
    },
    clear: async () => {
      await idbRequest(tx('readwrite').clear());
    }
  };
}
