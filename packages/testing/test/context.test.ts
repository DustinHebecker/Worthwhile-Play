// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { GameModule } from '@wp/game-core';
import { createMemoryLibraryStore } from '@wp/persistence';
import { createTestContext, createTestLibrary } from '../src';

const module = { metadata: { id: 'maps', messages: { en: {} } } } as unknown as GameModule<unknown>;

describe('test context library (ADR 0012)', () => {
  it('gives every context its own in-memory library with the app bounds', async () => {
    const a = createTestContext(module);
    const b = createTestContext(module);
    expect(a.context.library).toBe(a.library);
    await a.context.library!.put({ id: 'm1', name: 'Map', data: { cells: [1] } });
    expect((await a.library!.get('m1'))?.data).toEqual({ cells: [1] });
    expect(await b.context.library!.list()).toEqual([]);
    await expect(a.context.library!.put({ name: '', data: 1 })).rejects.toMatchObject({ reason: 'invalid' });
  });

  it('can share a library between contexts, scope it per game, or leave it out', async () => {
    const store = createMemoryLibraryStore();
    const shared = createTestLibrary('maps', store);
    const first = createTestContext(module, 'en', undefined, { library: shared.library });
    await first.context.library!.put({ id: 'kept', name: 'Kept', data: 1 });
    const second = createTestContext(module, 'de', undefined, { library: shared.library });
    expect((await second.context.library!.get('kept'))?.name).toBe('Kept');
    expect(await createTestLibrary('other', store).library.list()).toEqual([]);
    expect(await store.counts()).toEqual(new Map([['maps', 1]]));
    const without = createTestContext(module, 'en', undefined, { library: undefined });
    expect(without.context.library).toBeUndefined();
    expect('library' in without.context).toBe(false);
    expect(without.library).toBeUndefined();
  });

  it('supports create-if-absent like the app: exists leaves the item unchanged, one of concurrent puts wins', async () => {
    const { library } = createTestLibrary('maps');
    await expect(library.put({ id: 'slot-1', name: 'First', data: 1 }, { ifAbsent: true })).resolves.toMatchObject({ id: 'slot-1' });
    await expect(library.put({ id: 'slot-1', name: 'Second', data: 2 }, { ifAbsent: true })).rejects.toMatchObject({ name: 'GameLibraryError', reason: 'exists' });
    expect(await library.get('slot-1')).toMatchObject({ name: 'First', data: 1 });
    await expect(library.put({ id: 'slot-1', name: 'Replaced', data: 3 })).resolves.toMatchObject({ name: 'Replaced' });

    const shared = createMemoryLibraryStore();
    const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => createTestLibrary('maps', shared).library.put({ id: 'race', name: `R${i}`, data: i }, { ifAbsent: true })));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await shared.counts()).toEqual(new Map([['maps', 1]]));
  });
});
