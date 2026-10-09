import { describe, expect, it } from 'vitest';
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import type { GameModule } from '@wp/game-core';
import {
  createIndexedDbDeckStore,
  createIndexedDbStore,
  createMemoryDeckStore,
  createSave,
  DB_VERSION,
  DECKS_STORE,
  LEARNING_STORE,
  openDatabase,
  SAVES_STORE,
  type DeckStore
} from '../src';

const module = {
  metadata: { id: 'memory', stateVersion: 1, skills: ['memory'], typicalMinutes: [1, 2], inputMethods: ['pointer'], capabilities: {}, messages: {} }
} as unknown as GameModule<unknown>;

/** Creates a version-1 database exactly like the app did before decks existed, with one save in it. */
function createV1Database(factory: IDBFactory, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = factory.open(name, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('saves', { keyPath: 'gameId' });
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(createSave(module, 7, { kept: true }, 'small', new Date('2026-01-01T00:00:00Z')));
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
  ['memory', async () => createMemoryDeckStore()],
  ['indexeddb', async () => createIndexedDbDeckStore(new FakeIDBFactory(), 'decks-test')]
])('%s deck store', (_name, factory) => {
  it('stores, lists, replaces and removes decks', async () => {
    const store: DeckStore = await factory();
    expect(await store.list()).toEqual([]);
    await store.put({ id: 'user-a-1', title: 'A' });
    await store.put({ id: 'user-b-1', title: 'B' });
    await store.put({ id: 'user-a-1', title: 'A2' });
    expect(await store.get('user-a-1')).toEqual({ id: 'user-a-1', title: 'A2' });
    expect(await store.get('missing')).toBeUndefined();
    expect(((await store.list()) as { id: string }[]).map((r) => r.id).sort()).toEqual(['user-a-1', 'user-b-1']);
    await store.remove('user-a-1');
    expect(await store.list()).toEqual([{ id: 'user-b-1', title: 'B' }]);
    await store.clear();
    expect(await store.list()).toEqual([]);
  });

  it('rejects non-serializable records', async () => {
    const store = await factory();
    const cyclic: Record<string, unknown> = { id: 'user-c-1' };
    cyclic.self = cyclic;
    await expect(store.put(cyclic as { id: string })).rejects.toThrow();
  });
});

describe('database upgrade 1 → current', () => {
  it('adds the decks store and keeps existing saves untouched', async () => {
    const factory = new FakeIDBFactory();
    await createV1Database(factory, 'upgrade');
    const saves = await createIndexedDbStore(factory, 'upgrade');
    expect(saves.persistent).toBe(true);
    expect(await saves.keys()).toEqual(['memory']);
    expect(await saves.read('memory')).toMatchObject({ gameId: 'memory', seed: 7, state: { kept: true }, updatedAt: '2026-01-01T00:00:00.000Z' });
    const decks = await createIndexedDbDeckStore(factory, 'upgrade');
    expect(decks.persistent).toBe(true);
    await decks.put({ id: 'user-x-1' });
    expect(await decks.list()).toEqual([{ id: 'user-x-1' }]);
    const db = await openDatabase(factory, 'upgrade');
    expect(db.version).toBe(DB_VERSION);
    expect([...db.objectStoreNames].sort()).toEqual([DECKS_STORE, LEARNING_STORE, SAVES_STORE].sort());
    db.close();
  });

  it('deleting all saves does not touch decks (separate stores)', async () => {
    const factory = new FakeIDBFactory();
    const saves = await createIndexedDbStore(factory, 'separate');
    const decks = await createIndexedDbDeckStore(factory, 'separate');
    await saves.write(createSave(module, 1, {}));
    await decks.put({ id: 'user-keep-1' });
    for (const key of await saves.keys()) await saves.remove(key);
    expect(await saves.keys()).toEqual([]);
    expect(await decks.list()).toEqual([{ id: 'user-keep-1' }]);
  });

  it('closes its connection when a newer version needs to upgrade', async () => {
    const factory = new FakeIDBFactory();
    const db = await openDatabase(factory, 'versionchange');
    const next = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = factory.open('versionchange', DB_VERSION + 1);
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    expect(next.version).toBe(DB_VERSION + 1);
    next.close();
    expect(() => db.transaction(SAVES_STORE)).toThrow();
  });

  it('gives up (so the app can fall back) when an older tab blocks the upgrade', async () => {
    const factory = new FakeIDBFactory();
    // An "old tab": holds version 1 open and ignores versionchange.
    const old = await new Promise<IDBDatabase>((resolve) => {
      const open = factory.open('blocked', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('saves', { keyPath: 'gameId' });
      open.onsuccess = () => resolve(open.result);
    });
    await expect(openDatabase(factory, 'blocked', 30)).rejects.toThrow(/blocked/);
    old.close();
  });

  it('falls back to memory when IndexedDB is unavailable', async () => {
    expect((await createIndexedDbDeckStore(null)).persistent).toBe(false);
    const broken = { open: () => { throw new Error('denied'); } } as unknown as IDBFactory;
    expect((await createIndexedDbDeckStore(broken)).persistent).toBe(false);
  });
});
