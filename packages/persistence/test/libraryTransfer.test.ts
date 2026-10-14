import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { LIBRARY_LIMITS, normalizeLibraryName } from '@wp/game-core';
import {
  createGameLibrary,
  createIndexedDbLibraryStore,
  createMemoryLibraryStore,
  exportLibrary,
  importLibrary,
  LIBRARY_EXPORT_FORMAT,
  LIBRARY_IMPORT_MAX_BYTES,
  libraryExportToJson,
  parseLibraryExport,
  type LibraryRow,
  type LibraryStore
} from '../src';

const AT = new Date(Date.UTC(2026, 9, 13, 12, 0, 0));
const known = (id: string) => id === 'relay-command' || id === 'sokoban';
const file = (items: unknown[], extra: Record<string, unknown> = {}) => JSON.stringify({ format: LIBRARY_EXPORT_FORMAT, version: 1, exportedAt: AT.toISOString(), items, ...extra });
const item = (gameId: string, id: string, name: string, data: unknown, updatedAt = AT.toISOString()) => ({ gameId, id, name, updatedAt, data });

function parsed(text: string): LibraryRow[] {
  const result = parseLibraryExport(text, known);
  if (!result.ok) throw new Error(result.problem);
  return result.rows;
}

describe.each([
  ['memory', async () => createMemoryLibraryStore()],
  ['indexeddb', async () => createIndexedDbLibraryStore(new FakeIDBFactory(), 'transfer-test')]
])('%s store: export, import and delete per game', (_name, factory) => {
  async function seeded(): Promise<LibraryStore> {
    const store = await factory();
    await createGameLibrary(store, 'relay-command').put({ id: 'slot-1', name: 'Ridge', data: { cells: [1, 2] } });
    await createGameLibrary(store, 'relay-command').put({ id: 'slot-0', name: 'Delta', data: { cells: [3] } });
    await createGameLibrary(store, 'sokoban').put({ id: 'a', name: 'Level', data: 'x' });
    return store;
  }

  it('exports every item, sorted by game and id, as a versioned file', async () => {
    const out = await exportLibrary(await seeded(), AT);
    expect(out.format).toBe(LIBRARY_EXPORT_FORMAT);
    expect(out.version).toBe(1);
    expect(out.exportedAt).toBe(AT.toISOString());
    expect(out.items.map((i) => `${i.gameId}/${i.id}/${i.name}`)).toEqual(['relay-command/slot-0/Delta', 'relay-command/slot-1/Ridge', 'sokoban/a/Level']);
    expect(out.items[0]?.data).toEqual({ cells: [3] });
  });

  it('round trip: exporting and importing into an empty store restores every item', async () => {
    const exported = await exportLibrary(await seeded(), AT);
    const target = await factory();
    await target.clear();
    expect(await importLibrary(target, parsed(libraryExportToJson(exported)))).toEqual({ added: 3, replaced: 0, unchanged: 0, kept: 0, full: 0 });
    // Names, ids, data and the time of the last change all survive.
    expect((await exportLibrary(target, AT)).items).toEqual(exported.items);
  });

  it('importing the same file again changes nothing', async () => {
    const store = await seeded();
    const text = libraryExportToJson(await exportLibrary(store, AT));
    expect(await importLibrary(store, parsed(text))).toEqual({ added: 0, replaced: 0, unchanged: 3, kept: 0, full: 0 });
  });

  it('keeps an existing, different item unless replace is chosen', async () => {
    const store = await seeded();
    const rows = parsed(file([item('relay-command', 'slot-1', 'Other ridge', { cells: [9] }), item('relay-command', 'slot-5', 'New', 5)]));
    expect(await importLibrary(store, rows)).toEqual({ added: 1, replaced: 0, unchanged: 0, kept: 1, full: 0 });
    expect(((await store.get('relay-command', 'slot-1')) as LibraryRow).name).toBe('Ridge');
    expect(await importLibrary(store, rows, { replace: true })).toEqual({ added: 0, replaced: 1, unchanged: 1, kept: 0, full: 0 });
    expect(((await store.get('relay-command', 'slot-1')) as LibraryRow).data).toEqual({ cells: [9] });
  });

  it('never exceeds the per-game limit', async () => {
    const store = await factory();
    await store.clear();
    // Two places left: of five new items two are added, three find no space.
    for (let i = 0; i < LIBRARY_LIMITS.maxItems - 2; i++) await createGameLibrary(store, 'sokoban').put({ id: `old-${i}`, name: `Old ${i}`, data: i });
    const items = Array.from({ length: 5 }, (_, i) => item('sokoban', `l-${i}`, `Level ${i}`, i));
    expect(await importLibrary(store, parsed(file(items)))).toEqual({ added: 2, replaced: 0, unchanged: 0, kept: 0, full: 3 });
    expect((await store.counts()).get('sokoban')).toBe(LIBRARY_LIMITS.maxItems);
  });

  it('deletes the items of one game only', async () => {
    const store = await seeded();
    await store.removeGame('relay-command');
    expect(await store.counts()).toEqual(new Map([['sokoban', 1]]));
    await store.removeGame('not-there');
    expect(await store.counts()).toEqual(new Map([['sokoban', 1]]));
  });
});

describe('parseLibraryExport (untrusted files)', () => {
  it('refuses text that is not JSON, not an export, or from a newer version', () => {
    expect(parseLibraryExport('{', known)).toEqual({ ok: false, problem: 'not-json' });
    expect(parseLibraryExport('[]', known)).toEqual({ ok: false, problem: 'wrong-format' });
    expect(parseLibraryExport(JSON.stringify({ format: 'something-else', version: 1, items: [] }), known)).toEqual({ ok: false, problem: 'wrong-format' });
    expect(parseLibraryExport(file([], { version: 0 }), known)).toEqual({ ok: false, problem: 'wrong-format' });
    expect(parseLibraryExport(file([], { version: 1.5 }), known)).toEqual({ ok: false, problem: 'wrong-format' });
    expect(parseLibraryExport(file([], { items: {} }), known)).toEqual({ ok: false, problem: 'wrong-format' });
    expect(parseLibraryExport(file([], { version: 2 }), known)).toEqual({ ok: false, problem: 'newer-version' });
  });

  it('skips unreadable items, unknown games and repeated ids, and keeps the rest', () => {
    const big = 'x'.repeat(LIBRARY_LIMITS.maxBytes);
    const result = parseLibraryExport(
      file([
        item('relay-command', 'slot-1', '  Ridge  ', { cells: [1] }),
        item('relay-command', 'slot-1', 'Duplicate', 2),
        item('unknown-game', 'a', 'Elsewhere', 1),
        item('relay-command', 'bad id', 'Bad', 1),
        item('relay-command', 'b', '', 1),
        item('relay-command', 'c', 'x'.repeat(61), 1),
        item('relay-command', 'd', 'Too big', big),
        item('relay-command', 'e', 'Bad time', 1, 'yesterday'),
        item('relay-command', 'e2', 'Loose time', 1, '0'),
        { gameId: 'relay-command', id: 'f', name: 'No data', updatedAt: AT.toISOString() },
        null,
        'text',
        item('sokoban', 'g', 'Level', [null, true, 'ü'])
      ]),
      known
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.skipped).toBe(11);
    expect(result.rows).toEqual([
      { gameId: 'relay-command', id: 'slot-1', name: 'Ridge', updatedAt: AT.toISOString(), size: 13, data: { cells: [1] } },
      { gameId: 'sokoban', id: 'g', name: 'Level', updatedAt: AT.toISOString(), size: 16, data: [null, true, 'ü'] }
    ]);
  });

  it('keeps at most the per-game limit of a file and caps times in the future', () => {
    const items = Array.from({ length: LIBRARY_LIMITS.maxItems + 5 }, (_, i) => item('sokoban', `l-${i}`, `Level ${i}`, i, '2999-01-01T00:00:00.000Z'));
    const result = parseLibraryExport(file(items), known, AT);
    expect(result.ok && result.rows.length).toBe(LIBRARY_LIMITS.maxItems);
    expect(result.ok && result.skipped).toBe(5);
    expect(result.ok && result.rows.every((row) => row.updatedAt === AT.toISOString())).toBe(true);
  });

  it('a game at its bounds fits the import size limit and survives the round trip', async () => {
    const store = createMemoryLibraryStore();
    // Array-heavy data is where pretty-printing would have multiplied the size.
    const data = Array.from({ length: Math.floor((LIBRARY_LIMITS.maxBytes - 2) / 2) }, () => 0);
    for (let i = 0; i < LIBRARY_LIMITS.maxItems; i++) await createGameLibrary(store, 'sokoban').put({ id: `l-${i}`, name: `Level ${i}`, data });
    const text = libraryExportToJson(await exportLibrary(store, AT));
    expect(new TextEncoder().encode(text).length).toBeLessThan(LIBRARY_IMPORT_MAX_BYTES / 9);
    expect(parsed(text)).toHaveLength(LIBRARY_LIMITS.maxItems);
  });

  it('does not fail on corrupt stored data: such an item counts as different', async () => {
    const store = createMemoryLibraryStore();
    const corrupt = { gameId: 'sokoban', id: 'a', name: 'Level', updatedAt: AT.toISOString(), size: 1, data: 1 };
    await store.put(corrupt, 50);
    Object.assign(store, { list: async () => [{ ...corrupt, data: 10n }] });
    const rows = parsed(file([item('sokoban', 'a', 'Level', 1)]));
    expect(await importLibrary(store, rows)).toEqual({ added: 0, replaced: 0, unchanged: 0, kept: 1, full: 0 });
  });

  it('never throws and only returns rows within the bounds, for any input', () => {
    const anyItem = fc.record({
      gameId: fc.oneof(fc.constantFrom('relay-command', 'sokoban', 'other'), fc.string()),
      id: fc.oneof(fc.constantFrom('slot-0', 'slot-1', 'a'), fc.string()),
      name: fc.string({ maxLength: 70 }),
      updatedAt: fc.oneof(fc.constant(AT.toISOString()), fc.string()),
      data: fc.jsonValue()
    });
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.array(fc.oneof(anyItem, fc.anything())).map((items) => file(items))), (text) => {
        const result = parseLibraryExport(text, known);
        if (!result.ok) return;
        const keys = new Set<string>();
        for (const row of result.rows) {
          expect(known(row.gameId)).toBe(true);
          expect(row.name.length).toBeGreaterThan(0);
          expect(row.size).toBeLessThanOrEqual(LIBRARY_LIMITS.maxBytes);
          keys.add(`${row.gameId}/${row.id}`);
        }
        expect(keys.size).toBe(result.rows.length);
      }),
      { numRuns: 300 }
    );
  });

  it('round trip for any valid library content (property)', async () => {
    const entry = fc.record({
      gameId: fc.constantFrom('relay-command', 'sokoban'),
      id: fc.stringMatching(/^[A-Za-z0-9_-]{1,12}$/),
      // Names the library accepts unchanged (already trimmed, no control characters).
      name: fc.string({ minLength: 1, maxLength: 20 }).filter((n) => normalizeLibraryName(n) === n),
      data: fc.jsonValue({ maxDepth: 3 })
    });
    await fc.assert(
      fc.asyncProperty(fc.array(entry, { maxLength: 12 }), async (entries) => {
        const source = createMemoryLibraryStore();
        for (const e of entries) await createGameLibrary(source, e.gameId).put({ id: e.id, name: e.name, data: e.data });
        const exported = await exportLibrary(source, AT);
        const target = createMemoryLibraryStore();
        await importLibrary(target, parsed(libraryExportToJson(exported)));
        expect((await exportLibrary(target, AT)).items).toEqual(exported.items);
      }),
      { numRuns: 100 }
    );
  });
});
