import { DB_NAME, LEARNING_STORE, idbRequest, openDatabase } from './store';

/** A stored learning record. Beyond its key fields the shape is owned by `@wp/learning-content` (validated on read). */
export interface LearningRow {
  deckId: string;
  itemId: string;
  direction: string;
  [key: string]: unknown;
}

/**
 * Spaced-repetition records ("Items worth reviewing"), separate from saves and decks: deleting saved games keeps
 * them, and they have their own, confirmed delete control. Values are untrusted on read.
 */
export interface LearningStore {
  /** False when IndexedDB is unavailable and records only live until the page is closed. */
  readonly persistent: boolean;
  list(): Promise<unknown[]>;
  /** Inserts or replaces records (one transaction). */
  putMany(rows: readonly LearningRow[]): Promise<void>;
  /** Removes every record of one learning deck (e.g. when an imported deck is deleted). */
  removeDeck(deckId: string): Promise<void>;
  clear(): Promise<void>;
}

const keyOf = (row: Pick<LearningRow, 'deckId' | 'itemId' | 'direction'>) => JSON.stringify([row.deckId, row.itemId, row.direction]);
const isKeyed = (row: LearningRow) => typeof row.deckId === 'string' && typeof row.itemId === 'string' && typeof row.direction === 'string';

export function createMemoryLearningStore(): LearningStore {
  const data = new Map<string, string>();
  return {
    persistent: false,
    async list() {
      return [...data.values()].map((v) => JSON.parse(v) as unknown);
    },
    async putMany(rows) {
      if (!rows.every(isKeyed)) throw new TypeError('Learning records need deckId, itemId and direction');
      const encoded = rows.map((row) => [keyOf(row), JSON.stringify(row)] as const);
      for (const [key, value] of encoded) data.set(key, value);
    },
    async removeDeck(deckId) {
      for (const [key, value] of [...data]) if ((JSON.parse(value) as LearningRow).deckId === deckId) data.delete(key);
    },
    async clear() {
      data.clear();
    }
  };
}

/** IndexedDB-backed learning store (`worthwhile-play` → `learning`); falls back to memory like the other stores. */
export async function createIndexedDbLearningStore(factory: IDBFactory | null = globalThis.indexedDB ?? null, name = DB_NAME): Promise<LearningStore> {
  if (!factory) return createMemoryLearningStore();
  let db: IDBDatabase;
  try {
    db = await openDatabase(factory, name);
  } catch {
    return createMemoryLearningStore();
  }
  const store = (mode: IDBTransactionMode) => db.transaction(LEARNING_STORE, mode).objectStore(LEARNING_STORE);
  return {
    persistent: true,
    list: () => idbRequest(store('readonly').getAll()),
    putMany: async (rows) => {
      // Check and serialize first, so a bad row rejects before anything is written.
      if (!rows.every(isKeyed)) throw new TypeError('Learning records need deckId, itemId and direction');
      const plain = rows.map((row) => JSON.parse(JSON.stringify(row)) as LearningRow);
      if (plain.length === 0) return;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(LEARNING_STORE, 'readwrite');
        const objects = tx.objectStore(LEARNING_STORE);
        try {
          for (const row of plain) objects.put(row);
        } catch (error) {
          tx.abort();
          reject(error);
          return;
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
      });
    },
    removeDeck: (deckId) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(LEARNING_STORE, 'readwrite');
        const objects = tx.objectStore(LEARNING_STORE);
        const keys = objects.getAllKeys();
        // Keys are [deckId, itemId, direction]; delete within the same transaction.
        keys.onsuccess = () => {
          for (const key of keys.result) if (Array.isArray(key) && key[0] === deckId) objects.delete(key);
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB delete aborted'));
      }),
    clear: async () => {
      await idbRequest(store('readwrite').clear());
    }
  };
}
