import { describe, expect, it } from 'vitest';
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { GameLibraryError, LIBRARY_LIMITS, type GameLibrary, type GameModule } from '@wp/game-core';
import {
  createGameLibrary,
  createIndexedDbDeckStore,
  createIndexedDbLearningStore,
  createIndexedDbLibraryStore,
  createIndexedDbStore,
  createMemoryLibraryStore,
  createSave,
  DB_VERSION,
  DECKS_STORE,
  LEARNING_STORE,
  LIBRARY_STORE,
  openDatabase,
  SAVES_STORE,
  type GameLibraryOptions,
  type LibraryStore
} from '../src';

const module = {
  metadata: { id: 'memory', stateVersion: 1, skills: ['memory'], typicalMinutes: [1, 2], inputMethods: ['pointer'], capabilities: {}, messages: {} }
} as unknown as GameModule<unknown>;

/** Deterministic clock and ids: every call is one second later / the next id. */
function library(store: LibraryStore | Promise<LibraryStore>, gameId = 'relay-command', limits: GameLibraryOptions['limits'] = {}) {
  let tick = 0;
  let id = 0;
  return createGameLibrary(store, gameId, {
    now: () => new Date(Date.UTC(2026, 9, 13, 12, 0, tick++)),
    newId: () => `gen-${++id}`,
    limits
  });
}

const reason = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(GameLibraryError);
    return (error as GameLibraryError).reason;
  }
  return 'resolved';
};

describe.each([
  ['memory', async () => createMemoryLibraryStore()],
  ['indexeddb', async () => createIndexedDbLibraryStore(new FakeIDBFactory(), 'library-test')]
])('%s library store', (_name, factory) => {
  it('creates, lists (most recent first), reads, replaces and deletes items', async () => {
    const lib = library(await factory());
    expect(await lib.list()).toEqual([]);
    const a = await lib.put({ name: '  Ridge  ', data: { w: 3, cells: [1, 2, 3] } });
    expect(a).toEqual({ id: 'gen-1', name: 'Ridge', updatedAt: '2026-10-13T12:00:00.000Z', size: JSON.stringify({ w: 3, cells: [1, 2, 3] }).length });
    const b = await lib.put({ id: 'slot-1', name: 'Valley', data: [true, null, 'ä'] });
    expect(b.size).toBe(16); // [true,null,"ä"]: 15 characters, ä takes two bytes
    expect((await lib.list()).map((e) => e.id)).toEqual(['slot-1', 'gen-1']);
    expect(await lib.get('gen-1')).toEqual({ id: 'gen-1', name: 'Ridge', data: { w: 3, cells: [1, 2, 3] }, updatedAt: '2026-10-13T12:00:00.000Z' });
    expect(await lib.get('missing')).toBeUndefined();

    const replaced = await lib.put({ id: 'gen-1', name: 'Ridge 2', data: { w: 4 } });
    expect(replaced).toMatchObject({ id: 'gen-1', name: 'Ridge 2', updatedAt: '2026-10-13T12:00:02.000Z' });
    expect((await lib.list()).map((e) => [e.id, e.name])).toEqual([['gen-1', 'Ridge 2'], ['slot-1', 'Valley']]);
    expect((await lib.get('gen-1'))?.data).toEqual({ w: 4 });

    await lib.delete('gen-1');
    await lib.delete('gen-1'); // missing: not an error
    expect((await lib.list()).map((e) => e.id)).toEqual(['slot-1']);
  });

  it('copies data in both directions (no shared objects)', async () => {
    const lib = library(await factory());
    const data = { cells: [1, 2] };
    await lib.put({ id: 'x', name: 'X', data });
    data.cells.push(3);
    const first = await lib.get('x');
    expect(first?.data).toEqual({ cells: [1, 2] });
    (first?.data as { cells: number[] }).cells.push(9);
    expect((await lib.get('x'))?.data).toEqual({ cells: [1, 2] });
  });

  it('keeps games apart and counts items per game', async () => {
    const store = await factory();
    const relay = library(store, 'relay-command');
    const other = library(store, 'sokoban');
    await relay.put({ id: 'same', name: 'Relay map', data: 1 });
    await relay.put({ name: 'Second', data: 2 });
    await other.put({ id: 'same', name: 'Sokoban level', data: 3 });
    expect((await relay.get('same'))?.name).toBe('Relay map');
    expect((await other.get('same'))?.name).toBe('Sokoban level');
    expect(await other.list()).toHaveLength(1);
    await other.delete('same');
    expect(await relay.get('same')).toBeDefined();
    expect(await store.counts()).toEqual(new Map([['relay-command', 2]]));
    await other.put({ name: 'Back', data: 0 });
    expect(await store.counts()).toEqual(new Map([['relay-command', 2], ['sokoban', 1]]));
    await store.clear();
    expect(await store.counts()).toEqual(new Map());
    expect(await relay.list()).toEqual([]);
  });

  it('refuses a new item when the game is full, but still replaces existing ones', async () => {
    const store = await factory();
    const lib = library(store, 'g', { maxItems: 3 });
    for (let i = 0; i < 3; i++) await lib.put({ id: `m${i}`, name: `Map ${i}`, data: i });
    expect(await reason(lib.put({ name: 'One too many', data: 4 }))).toBe('full');
    expect(await reason(lib.put({ id: 'm9', name: 'One too many', data: 4 }))).toBe('full');
    await expect(lib.put({ id: 'm1', name: 'Map 1b', data: 5 })).resolves.toMatchObject({ id: 'm1' });
    // Other games have their own limit.
    await expect(library(store, 'h', { maxItems: 3 }).put({ name: 'Elsewhere', data: 0 })).resolves.toBeDefined();
    await lib.delete('m0');
    await expect(lib.put({ name: 'Fits again', data: 6 })).resolves.toBeDefined();
    expect(await lib.list()).toHaveLength(3);
  });

  it('never exceeds the limit with concurrent writes', async () => {
    const lib = library(await factory(), 'g', { maxItems: 4 });
    const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => lib.put({ id: `c${i}`, name: `C${i}`, data: i })));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(4);
    expect(results.filter((r) => r.status === 'rejected').map((r) => ((r as PromiseRejectedResult).reason as GameLibraryError).reason)).toEqual(Array(6).fill('full'));
    expect(await lib.list()).toHaveLength(4);
  });

  it('bounds the size of the data (UTF-8 bytes of its JSON)', async () => {
    const lib = library(await factory());
    const fits = 'a'.repeat(LIBRARY_LIMITS.maxBytes - 2); // plus two quotes
    await expect(lib.put({ id: 'big', name: 'Big', data: fits })).resolves.toMatchObject({ size: LIBRARY_LIMITS.maxBytes });
    expect(await reason(lib.put({ id: 'big', name: 'Big', data: `${fits}a` }))).toBe('too-large');
    expect(await reason(lib.put({ name: 'Wide', data: 'ä'.repeat(LIBRARY_LIMITS.maxBytes / 2) }))).toBe('too-large');
    expect((await lib.get('big'))?.data).toBe(fits);
  });

  it('refuses invalid names, ids and data, writing nothing', async () => {
    const lib = library(await factory());
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const bad: unknown[] = [
      { name: '', data: 1 },
      { name: '   ', data: 1 },
      { name: 'x'.repeat(LIBRARY_LIMITS.maxNameLength + 1), data: 1 },
      { name: 'line\nbreak', data: 1 },
      { name: 42, data: 1 },
      { id: 'has space', name: 'A', data: 1 },
      { id: '', name: 'A', data: 1 },
      { id: 'x'.repeat(65), name: 'A', data: 1 },
      { id: 7, name: 'A', data: 1 },
      { name: 'A', data: cyclic },
      { name: 'A', data: { f: () => 1 } },
      { name: 'A', data: Number.NaN },
      { name: 'A', data: { n: Number.POSITIVE_INFINITY } },
      { name: 'A', data: { u: undefined } },
      { name: 'A', data: new Date(0) },
      { name: 'A', data: new Map() },
      { name: 'A', data: 10n },
      { name: 'A' },
      null,
      'not an object'
    ];
    for (const input of bad) expect(await reason(lib.put(input as never)), JSON.stringify(String(input))).toBe('invalid');
    expect(await reason(lib.get('bad id'))).toBe('invalid');
    expect(await reason(lib.delete('bad/id'))).toBe('invalid');
    expect(await lib.list()).toEqual([]);
    // Exactly 60 characters (code points, not UTF-16 units) is fine.
    await expect(lib.put({ name: '🗺'.repeat(LIBRARY_LIMITS.maxNameLength), data: {} })).resolves.toBeDefined();
  });
});

describe('untrusted rows and failures', () => {
  it('skips unreadable rows when reading', async () => {
    const store = createMemoryLibraryStore();
    const good = { gameId: 'g', id: 'ok', name: 'OK', updatedAt: '2026-01-01T00:00:00.000Z', size: 1, data: 1 };
    await store.put(good, 50);
    for (const row of [
      { ...good, id: 'no-name', name: undefined },
      { ...good, id: 'neg', size: -1 },
      { ...good, id: 'float', size: 1.5 },
      { ...good, id: 'bad id!' },
      { gameId: 'g', id: 'no-data', name: 'N', updatedAt: 'x', size: 0 }
    ]) {
      await store.put(row as never, 50);
    }
    const lib = createGameLibrary(store, 'g');
    expect((await lib.list()).map((e) => e.id)).toEqual(['ok']);
    expect(await lib.get('neg')).toBeUndefined();
    expect(await lib.get('no-data')).toBeUndefined();
    expect(await lib.get('ok')).toEqual({ id: 'ok', name: 'OK', data: 1, updatedAt: good.updatedAt });
  });

  it('turns storage failures into "unavailable"', async () => {
    const failing: LibraryStore = {
      ...createMemoryLibraryStore(),
      list: () => Promise.reject(new Error('io')),
      get: () => Promise.reject(new Error('io')),
      put: () => Promise.reject(new DOMException('quota', 'QuotaExceededError')),
      remove: () => Promise.reject(new Error('io'))
    };
    const lib = createGameLibrary(failing, 'g');
    expect(await reason(lib.list())).toBe('unavailable');
    expect(await reason(lib.get('a'))).toBe('unavailable');
    expect(await reason(lib.put({ name: 'A', data: 1 }))).toBe('unavailable');
    expect(await reason(lib.delete('a'))).toBe('unavailable');
    const never = createGameLibrary(Promise.reject(new Error('no database')), 'g');
    expect(await reason(never.list())).toBe('unavailable');
  });

  it('uses random ids and the real clock by default', async () => {
    const lib: GameLibrary = createGameLibrary(createMemoryLibraryStore(), 'g');
    const a = await lib.put({ name: 'A', data: 1 });
    const b = await lib.put({ name: 'B', data: 2 });
    expect(a.id).toMatch(/^[A-Za-z0-9_-]{1,64}$/);
    expect(a.id).not.toBe(b.id);
    expect(Number.isNaN(Date.parse(a.updatedAt))).toBe(false);
  });

  it('falls back to memory when IndexedDB is unavailable', async () => {
    expect((await createIndexedDbLibraryStore(null)).persistent).toBe(false);
    const broken = { open: () => { throw new Error('denied'); } } as unknown as IDBFactory;
    expect((await createIndexedDbLibraryStore(broken)).persistent).toBe(false);
    expect((await createIndexedDbLibraryStore(new FakeIDBFactory(), 'ok')).persistent).toBe(true);
  });
});

/** A version-3 database exactly as the previous app version created it, with a save, a deck and a learning record. */
function createV3Database(factory: IDBFactory, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = factory.open(name, 3);
    open.onupgradeneeded = () => {
      open.result.createObjectStore('saves', { keyPath: 'gameId' });
      open.result.createObjectStore('decks', { keyPath: 'id' });
      open.result.createObjectStore('learning', { keyPath: ['deckId', 'itemId', 'direction'] });
    };
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(['saves', 'decks', 'learning'], 'readwrite');
      tx.objectStore('saves').put(createSave(module, 7, { kept: true }, 'small', new Date('2026-01-01T00:00:00Z')));
      tx.objectStore('decks').put({ id: 'user-old-1', deck: { kept: true } });
      tx.objectStore('learning').put({ deckId: 'flags', itemId: 'de', direction: 'forward', box: 2 });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    open.onerror = () => reject(open.error);
  });
}

describe('database upgrade 3 → 4', () => {
  it('adds the library store and keeps saves, decks and learning records untouched', async () => {
    const factory = new FakeIDBFactory();
    await createV3Database(factory, 'upgrade');
    const store = await createIndexedDbLibraryStore(factory, 'upgrade');
    expect(store.persistent).toBe(true);
    const lib = library(store);
    expect(await lib.list()).toEqual([]);
    await lib.put({ id: 'm', name: 'Map', data: { kept: true } });

    const saves = await createIndexedDbStore(factory, 'upgrade');
    expect(await saves.read('memory')).toMatchObject({ gameId: 'memory', seed: 7, state: { kept: true } });
    expect(await (await createIndexedDbDeckStore(factory, 'upgrade')).list()).toEqual([{ id: 'user-old-1', deck: { kept: true } }]);
    expect(await (await createIndexedDbLearningStore(factory, 'upgrade')).list()).toEqual([{ deckId: 'flags', itemId: 'de', direction: 'forward', box: 2 }]);

    const db = await openDatabase(factory, 'upgrade');
    expect(DB_VERSION).toBe(4);
    expect(db.version).toBe(4);
    expect([...db.objectStoreNames].sort()).toEqual([DECKS_STORE, LEARNING_STORE, LIBRARY_STORE, SAVES_STORE].sort());
    db.close();
    expect((await lib.get('m'))?.data).toEqual({ kept: true });
  });

  it('deleting all saves, decks or learning records never touches the library, and clearing it keeps them', async () => {
    const factory = new FakeIDBFactory();
    const saves = await createIndexedDbStore(factory, 'separate');
    const decks = await createIndexedDbDeckStore(factory, 'separate');
    const learning = await createIndexedDbLearningStore(factory, 'separate');
    const store = await createIndexedDbLibraryStore(factory, 'separate');
    await saves.write(createSave(module, 1, {}));
    await decks.put({ id: 'user-keep-1' });
    await learning.putMany([{ deckId: 'flags', itemId: 'de', direction: 'forward' }]);
    await library(store).put({ id: 'keep', name: 'Keep', data: 1 });
    for (const key of await saves.keys()) await saves.remove(key);
    await decks.clear();
    await learning.clear();
    expect(await store.counts()).toEqual(new Map([['relay-command', 1]]));
    await saves.write(createSave(module, 2, {}));
    await decks.put({ id: 'user-keep-2' });
    await store.clear();
    expect(await saves.keys()).toEqual(['memory']);
    expect(await decks.list()).toHaveLength(1);
  });
});
