import { describe, expect, it } from 'vitest';
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import type { GameModule } from '@wp/game-core';
import {
  createIndexedDbDeckStore,
  createIndexedDbLearningStore,
  createIndexedDbStore,
  createMemoryLearningStore,
  createSave,
  DB_VERSION,
  DECKS_STORE,
  LEARNING_STORE,
  openDatabase,
  SAVES_STORE,
  type LearningRow,
  type LearningStore
} from '../src';

const module = {
  metadata: { id: 'memory', stateVersion: 1, skills: ['memory'], typicalMinutes: [1, 2], inputMethods: ['pointer'], capabilities: {}, messages: {} }
} as unknown as GameModule<unknown>;

const row = (deckId: string, itemId: string, direction = 'forward', box = 1) => ({ deckId, itemId, direction, box, due: '2026-03-11' });

/**
 * Creates a database exactly as an older app version did: version 1 (`saves`) or version 2 (`saves`, `decks`),
 * with one save (and one deck) in it.
 */
function createOldDatabase(factory: IDBFactory, name: string, version: 1 | 2): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = factory.open(name, version);
    open.onupgradeneeded = () => {
      open.result.createObjectStore('saves', { keyPath: 'gameId' });
      if (version >= 2) open.result.createObjectStore('decks', { keyPath: 'id' });
    };
    open.onsuccess = () => {
      const db = open.result;
      const stores = version >= 2 ? ['saves', 'decks'] : ['saves'];
      const tx = db.transaction(stores, 'readwrite');
      tx.objectStore('saves').put(createSave(module, 7, { kept: true }, 'small', new Date('2026-01-01T00:00:00Z')));
      if (version >= 2) tx.objectStore('decks').put({ id: 'user-old-1', importedAt: '2026-01-02T00:00:00.000Z', deck: { kept: true } });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    open.onerror = () => reject(open.error);
  });
}

describe.each([
  ['memory', async () => createMemoryLearningStore()],
  ['indexeddb', async () => createIndexedDbLearningStore(new FakeIDBFactory(), 'learning-test')]
])('%s learning store', (_name, factory) => {
  it('stores, replaces, removes per deck and clears records', async () => {
    const store: LearningStore = await factory();
    expect(await store.list()).toEqual([]);
    await store.putMany([row('flags', 'de'), row('flags', 'de', 'backward'), row('flags', 'fr'), row('user-a-1', 'x')]);
    await store.putMany([row('flags', 'de', 'forward', 3)]);
    await store.putMany([]);
    const all = (await store.list()) as (LearningRow & { box: number })[];
    expect(all).toHaveLength(4);
    expect(all.find((r) => r.deckId === 'flags' && r.itemId === 'de' && r.direction === 'forward')?.box).toBe(3);
    await store.removeDeck('flags');
    expect(await store.list()).toEqual([row('user-a-1', 'x')]);
    await store.removeDeck('missing');
    expect(await store.list()).toHaveLength(1);
    await store.clear();
    expect(await store.list()).toEqual([]);
  });

  it('rejects records without key fields or that are not serializable, writing nothing', async () => {
    const store = await factory();
    await expect(store.putMany([row('flags', 'de'), { deckId: 'flags' } as unknown as LearningRow])).rejects.toThrow();
    const cyclic: Record<string, unknown> = { ...row('flags', 'fr') };
    cyclic.self = cyclic;
    await expect(store.putMany([cyclic as unknown as LearningRow])).rejects.toThrow();
    expect(await store.list()).toEqual([]);
  });
});

describe.each([1, 2] as const)('database upgrade %i → 3', (version) => {
  it('adds the learning store and keeps saves (and decks) untouched', async () => {
    const factory = new FakeIDBFactory();
    await createOldDatabase(factory, 'upgrade', version);
    const learning = await createIndexedDbLearningStore(factory, 'upgrade');
    expect(learning.persistent).toBe(true);
    expect(await learning.list()).toEqual([]);
    await learning.putMany([row('flags', 'de')]);

    const saves = await createIndexedDbStore(factory, 'upgrade');
    expect(await saves.keys()).toEqual(['memory']);
    expect(await saves.read('memory')).toMatchObject({ gameId: 'memory', seed: 7, state: { kept: true }, updatedAt: '2026-01-01T00:00:00.000Z' });
    const decks = await createIndexedDbDeckStore(factory, 'upgrade');
    expect(await decks.list()).toEqual(version >= 2 ? [{ id: 'user-old-1', importedAt: '2026-01-02T00:00:00.000Z', deck: { kept: true } }] : []);

    const db = await openDatabase(factory, 'upgrade');
    expect(db.version).toBe(DB_VERSION);
    expect(DB_VERSION).toBe(3);
    expect([...db.objectStoreNames].sort()).toEqual([DECKS_STORE, LEARNING_STORE, SAVES_STORE].sort());
    db.close();
    expect(await learning.list()).toEqual([row('flags', 'de')]);
  });
});

describe('separation of stores', () => {
  it('deleting saves or decks never touches learning records, and vice versa', async () => {
    const factory = new FakeIDBFactory();
    const saves = await createIndexedDbStore(factory, 'separate');
    const decks = await createIndexedDbDeckStore(factory, 'separate');
    const learning = await createIndexedDbLearningStore(factory, 'separate');
    await saves.write(createSave(module, 1, {}));
    await decks.put({ id: 'user-keep-1' });
    await learning.putMany([row('flags', 'de')]);
    for (const key of await saves.keys()) await saves.remove(key);
    await decks.clear();
    expect(await learning.list()).toEqual([row('flags', 'de')]);
    await saves.write(createSave(module, 2, {}));
    await learning.clear();
    expect(await saves.keys()).toEqual(['memory']);
  });

  it('falls back to memory when IndexedDB is unavailable', async () => {
    expect((await createIndexedDbLearningStore(null)).persistent).toBe(false);
    const broken = { open: () => { throw new Error('denied'); } } as unknown as IDBFactory;
    expect((await createIndexedDbLearningStore(broken)).persistent).toBe(false);
  });
});
