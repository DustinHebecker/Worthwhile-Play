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

  it('creates with ifAbsent when the id is new, and refuses an existing id without changing it', async () => {
    const store = await factory();
    const lib = library(store);
    const created = await lib.put({ id: 'slot-1', name: 'First', data: { v: 1 } }, { ifAbsent: true });
    expect(created).toEqual({ id: 'slot-1', name: 'First', updatedAt: '2026-10-13T12:00:00.000Z', size: 7 });
    expect(await reason(lib.put({ id: 'slot-1', name: 'Second', data: { v: 2 } }, { ifAbsent: true }))).toBe('exists');
    expect(await lib.get('slot-1')).toEqual({ id: 'slot-1', name: 'First', data: { v: 1 }, updatedAt: '2026-10-13T12:00:00.000Z' });
    expect(await lib.list()).toHaveLength(1);
    // The same id in another game is a different item.
    await expect(library(store, 'other').put({ id: 'slot-1', name: 'Other', data: 0 }, { ifAbsent: true })).resolves.toMatchObject({ id: 'slot-1' });
    // Without the option (or with `false`) a put still replaces.
    await expect(lib.put({ id: 'slot-1', name: 'Replaced', data: 3 }, { ifAbsent: false })).resolves.toMatchObject({ name: 'Replaced' });
    await expect(lib.put({ id: 'slot-1', name: 'Again', data: 4 })).resolves.toMatchObject({ name: 'Again' });
    expect((await lib.get('slot-1'))?.data).toBe(4);
    // After deleting, the id is free again.
    await lib.delete('slot-1');
    await expect(lib.put({ id: 'slot-1', name: 'Fresh', data: 5 }, { ifAbsent: true })).resolves.toMatchObject({ name: 'Fresh' });
  });

  it('ignores ifAbsent without an id (a generated id is always new)', async () => {
    const lib = library(await factory());
    const a = await lib.put({ name: 'A', data: 1 }, { ifAbsent: true });
    const b = await lib.put({ name: 'B', data: 2 }, { ifAbsent: true });
    expect([a.id, b.id]).toEqual(['gen-1', 'gen-2']);
    expect(await lib.list()).toHaveLength(2);
  });

  it('validates before checking existence (invalid and too-large win over exists)', async () => {
    const lib = library(await factory());
    await lib.put({ id: 'x', name: 'X', data: 1 });
    expect(await reason(lib.put({ id: 'x', name: '', data: 1 }, { ifAbsent: true }))).toBe('invalid');
    expect(await reason(lib.put({ id: 'x', name: 'X', data: 'a'.repeat(LIBRARY_LIMITS.maxBytes) }, { ifAbsent: true }))).toBe('too-large');
    expect((await lib.get('x'))?.data).toBe(1);
  });

  it('reports exists before full: an existing id is "exists" even in a full library, a new id is "full"', async () => {
    const lib = library(await factory(), 'g', { maxItems: 2 });
    await lib.put({ id: 'a', name: 'A', data: 1 }, { ifAbsent: true });
    await lib.put({ id: 'b', name: 'B', data: 2 }, { ifAbsent: true });
    expect(await reason(lib.put({ id: 'a', name: 'A2', data: 9 }, { ifAbsent: true }))).toBe('exists');
    expect(await reason(lib.put({ id: 'c', name: 'C', data: 3 }, { ifAbsent: true }))).toBe('full');
    expect(await reason(lib.put({ name: 'D', data: 4 }, { ifAbsent: true }))).toBe('full');
    expect((await lib.list()).map((e) => [e.id, e.name])).toEqual([['b', 'B'], ['a', 'A']]);
    expect((await lib.get('a'))?.data).toBe(1);
  });

  it('lets exactly one of many concurrent ifAbsent puts of the same id succeed', async () => {
    const store = await factory();
    // Separate library instances share one store, like two tabs sharing one database.
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) => library(store, 'g').put({ id: 'shared', name: `Writer ${i}`, data: i }, { ifAbsent: true }))
    );
    const won = results.flatMap((r, i) => (r.status === 'fulfilled' ? [i] : []));
    expect(won).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected').map((r) => ((r as PromiseRejectedResult).reason as GameLibraryError).reason)).toEqual(Array(11).fill('exists'));
    const stored = await library(store, 'g').get('shared');
    expect(stored).toMatchObject({ name: `Writer ${won[0]}`, data: won[0] });
    expect(await store.counts()).toEqual(new Map([['g', 1]]));
  });

  it('keeps the limit with concurrent ifAbsent puts of different ids', async () => {
    const lib = library(await factory(), 'g', { maxItems: 3 });
    // Ids 0..9, each twice: at most 3 distinct items, every rejection is "full" or "exists".
    const results = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => lib.put({ id: `k${i % 10}`, name: `K${i}`, data: i }, { ifAbsent: true })));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(3);
    const reasons = new Set(results.flatMap((r) => (r.status === 'rejected' ? [(r.reason as GameLibraryError).reason] : [])));
    expect([...reasons].every((r) => r === 'full' || r === 'exists')).toBe(true);
    expect(await lib.list()).toHaveLength(3);
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

  it('create-if-absent is atomic across two connections to one database (two tabs)', async () => {
    const factory = new FakeIDBFactory();
    const tabA = await createIndexedDbLibraryStore(factory, 'tabs');
    const tabB = await createIndexedDbLibraryStore(factory, 'tabs');
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) => library(i % 2 === 0 ? tabA : tabB, 'g').put({ id: 'slot-1', name: `Tab ${i % 2 === 0 ? 'A' : 'B'} ${i}`, data: i }, { ifAbsent: true }))
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected').map((r) => ((r as PromiseRejectedResult).reason as GameLibraryError).reason)).toEqual(Array(9).fill('exists'));
    expect(await tabA.counts()).toEqual(new Map([['g', 1]]));
    expect(await tabB.get('g', 'slot-1')).toEqual(await tabA.get('g', 'slot-1'));
  });

  it('store level: ifAbsent returns exists before full and writes nothing', async () => {
    for (const store of [createMemoryLibraryStore(), await createIndexedDbLibraryStore(new FakeIDBFactory(), 'level')]) {
      const row = { gameId: 'g', id: 'a', name: 'A', updatedAt: '2026-01-01T00:00:00.000Z', size: 1, data: 1 };
      expect(await store.put(row, 1, { ifAbsent: true })).toBe('created');
      expect(await store.put({ ...row, name: 'B', data: 2 }, 1, { ifAbsent: true })).toBe('exists');
      expect(await store.put({ ...row, id: 'b' }, 1, { ifAbsent: true })).toBe('full');
      expect(await store.get('g', 'a')).toEqual(row);
      expect(await store.put({ ...row, name: 'C' }, 1)).toBe('replaced');
    }
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
