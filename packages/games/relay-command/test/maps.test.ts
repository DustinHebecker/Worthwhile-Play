import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  applyTool,
  blankMap,
  customSpec,
  decodeMap,
  encodeMap,
  fromScenario,
  isFair,
  isValidMap,
  loadLibrary,
  MAP_HEIGHTS,
  MAP_KINDS,
  MAP_SLOTS,
  MAP_WIDTHS,
  mapIssues,
  MAX_DEPOSITS,
  MAX_UNITS_PER_SIDE,
  memoryStore,
  removeFromLibrary,
  resize,
  saveToLibrary,
  hostMapLibrary,
  migratePreferenceMaps,
  preferenceMapLibrary,
  TERRAIN_CODES,
  type EditMap,
  type Tool
} from '../src/maps';
import { createTestLibrary } from '@wp/testing';
import { isValidState, lockTurn, newGame, specOf } from '../src/rules';
import { FIELD_EXERCISE, RIDGE_VALLEY } from '../src/scenarios';

/** A small playable map built with the editor's own tool, mirrored. */
function playable(): EditMap {
  let m = blankMap(12, 8, 'Test');
  const put = (tool: Tool, x: number, y: number) => (m = applyTool(m, tool, x, y, true));
  put({ type: 'unit', kind: 'command-post', side: 0 }, 1, 6);
  put({ type: 'unit', kind: 'rifles', side: 0 }, 2, 6);
  put({ type: 'terrain', code: 'f' }, 5, 3);
  put({ type: 'deposit' }, 3, 5);
  return m;
}

describe('map editor: editing', () => {
  it('mirrors every edit to the opposite cell, units with the other side; the result is fair and playable', () => {
    const m = playable();
    expect(m.units).toEqual([
      { side: 0, kind: 'command-post', x: 1, y: 6 },
      { side: 0, kind: 'rifles', x: 2, y: 6 },
      { side: 1, kind: 'rifles', x: 9, y: 1 },
      { side: 1, kind: 'command-post', x: 10, y: 1 }
    ]);
    expect(m.terrain[3 * 12 + 5]).toBe('f');
    expect(m.terrain[4 * 12 + 6]).toBe('f');
    expect(m.deposits).toEqual([{ x: 3, y: 5 }, { x: 8, y: 2 }]);
    expect(isFair(m)).toBe(true);
    expect(mapIssues(m)).toEqual([]);
    expect(isValidMap(m)).toBe(true);
  });

  it('without mirroring only the cell changes; one Command Post per side (placing one moves it)', () => {
    let m = playable();
    m = applyTool(m, { type: 'unit', kind: 'command-post', side: 0 }, 0, 0, false);
    expect(m.units.filter((u) => u.kind === 'command-post' && u.side === 0)).toEqual([{ side: 0, kind: 'command-post', x: 0, y: 0 }]);
    expect(isFair(m)).toBe(false);
  });

  it('water and ridges take nothing; deposits take only Extractors; the eraser removes a unit, then the deposit', () => {
    let m = playable();
    m = applyTool(m, { type: 'terrain', code: '~' }, 2, 6, false);
    expect(m.units.some((u) => u.x === 2 && u.y === 6)).toBe(false);
    expect(applyTool(m, { type: 'unit', kind: 'rifles', side: 0 }, 2, 6, false)).toBe(m); // water
    expect(applyTool(m, { type: 'unit', kind: 'rifles', side: 0 }, 3, 5, false)).toBe(m); // deposit
    m = applyTool(m, { type: 'unit', kind: 'extractor', side: 0 }, 3, 5, false);
    expect(m.units.some((u) => u.kind === 'extractor')).toBe(true);
    expect(applyTool(m, { type: 'unit', kind: 'extractor', side: 0 }, 4, 4, false).units.filter((u) => u.kind === 'extractor')).toHaveLength(1); // off a deposit
    m = applyTool(m, { type: 'erase' }, 3, 5, false);
    expect(m.units.some((u) => u.kind === 'extractor')).toBe(false);
    expect(m.deposits.some((d) => d.x === 3 && d.y === 5)).toBe(true);
    m = applyTool(m, { type: 'erase' }, 3, 5, false);
    expect(m.deposits.some((d) => d.x === 3 && d.y === 5)).toBe(false);
    // Outside the map, unknown codes and kinds: nothing happens.
    expect(applyTool(m, { type: 'erase' }, 99, 0, true)).toBe(m);
    expect(applyTool(m, { type: 'terrain', code: 'x' }, 0, 0, true)).toBe(m);
    expect(applyTool(m, { type: 'unit', kind: 'kite', side: 0 }, 0, 0, true)).toBe(m);
  });

  it('caps units per side and deposits; resizing cuts off what lies outside', () => {
    let m = blankMap(24, 16);
    for (let i = 0; i < 40; i++) m = applyTool(m, { type: 'unit', kind: 'rifles', side: 0 }, i % 24, Math.floor(i / 24), false);
    expect(m.units).toHaveLength(MAX_UNITS_PER_SIDE);
    for (let i = 0; i < 20; i++) m = applyTool(m, { type: 'deposit' }, i, 10, false);
    expect(m.deposits).toHaveLength(MAX_DEPOSITS);
    const small = resize(m, 10, 8);
    expect(small.terrain).toHaveLength(80);
    expect(small.units.every((u) => u.x < 10 && u.y < 8)).toBe(true);
    expect(isValidMap(small)).toBe(true);
  });

  it('tells what is missing: a post per side, something besides it, and a ground path between the posts', () => {
    const empty = blankMap(12, 8);
    expect(mapIssues(empty).map((i) => `${i.key}:${i.side}`)).toEqual(['map.posts:0', 'map.posts:1', 'map.units:0', 'map.units:1']);
    // A wall of water between the posts.
    let walled = playable();
    for (let y = 0; y < 8; y++) walled = applyTool(walled, { type: 'terrain', code: '~' }, 6, y, false);
    expect(mapIssues(walled)).toEqual([{ key: 'map.path' }]);
  });

  it('built-in maps are valid editor maps, fair and playable', () => {
    for (const spec of [FIELD_EXERCISE, RIDGE_VALLEY]) {
      const m = fromScenario(spec, 'x');
      expect(isValidMap(m)).toBe(true);
      expect(isFair(m)).toBe(true);
      expect(mapIssues(m)).toEqual([]);
    }
  });
});

describe('map editor: share codes and the library', () => {
  const arbMap = fc
    .record({
      w: fc.constantFrom(...MAP_WIDTHS),
      h: fc.constantFrom(...MAP_HEIGHTS),
      name: fc.string({ maxLength: 40 }),
      edits: fc.array(
        fc.record({ kind: fc.constantFrom('terrain', 'deposit', 'unit', 'erase'), code: fc.constantFrom(...TERRAIN_CODES), unit: fc.constantFrom(...MAP_KINDS), side: fc.integer({ min: 0, max: 1 }), x: fc.nat(23), y: fc.nat(15), mirror: fc.boolean() }),
        { maxLength: 60 }
      )
    })
    .map(({ w, h, name, edits }) => {
      let m = blankMap(w, h, name);
      for (const e of edits) {
        const tool: Tool = e.kind === 'terrain' ? { type: 'terrain', code: e.code } : e.kind === 'unit' ? { type: 'unit', kind: e.unit, side: e.side } : { type: e.kind as 'deposit' | 'erase' };
        m = applyTool(m, tool, e.x % w, e.y % h, e.mirror);
      }
      return m;
    });

  it('every edited map stays valid and round-trips through its share code (within one preference value)', () => {
    fc.assert(
      fc.property(arbMap, (m) => {
        expect(isValidMap(m)).toBe(true);
        const code = encodeMap(m);
        expect(JSON.stringify(code).length).toBeLessThanOrEqual(2000);
        expect(decodeMap(code)).toEqual(m);
      }),
      { numRuns: 200 }
    );
  });

  it('the largest map still fits one preference value', () => {
    let m = blankMap(24, 16, 'x'.repeat(40));
    for (let i = 0; i < 24; i++) m = applyTool(m, { type: 'unit', kind: 'field-post', side: 0 }, i, 0, true);
    for (let i = 0; i < 6; i++) m = applyTool(m, { type: 'deposit' }, i, 5, true);
    expect(m.units).toHaveLength(48);
    expect(JSON.stringify(encodeMap(m)).length).toBeLessThanOrEqual(2000);
  });

  it('junk is never a map and never throws', () => {
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(decodeMap(v)).toBeUndefined();
        expect(isValidMap(v)).toBe(false);
      })
    );
    for (const bad of ['RC1.', 'RC1.!!!', 'RC1.' + btoa('[1,2]'), 'RC2.' + encodeMap(playable()).slice(4), encodeMap(playable()).slice(0, -6)]) expect(decodeMap(bad)).toBeUndefined();
    expect(isValidMap({ ...playable(), w: 11 })).toBe(false);
    expect(isValidMap({ ...playable(), units: [...playable().units, { side: 0, kind: 'rifles', x: 1, y: 6 }] })).toBe(false); // two on one cell
    expect(isValidMap({ ...playable(), units: [...playable().units, { side: 2, kind: 'rifles', x: 5, y: 5 }] })).toBe(false);
    expect(isValidMap({ ...playable(), units: [...playable().units, { side: 0, kind: 'extractor', x: 5, y: 5 }] })).toBe(false); // off a deposit
  });

  it('keeps up to eight maps per device: saves into the given slot or the first free one, removes, and never throws', () => {
    const store = memoryStore();
    expect(loadLibrary(store)).toEqual(Array.from({ length: MAP_SLOTS }, () => undefined));
    expect(saveToLibrary(store, playable(), null)).toBe(0);
    expect(saveToLibrary(store, { ...playable(), name: 'B' }, null)).toBe(1);
    expect(saveToLibrary(store, { ...playable(), name: 'A2' }, 0)).toBe(0);
    expect(loadLibrary(store)[0]?.name).toBe('A2');
    for (let i = 2; i < MAP_SLOTS; i++) saveToLibrary(store, playable(), null);
    expect(saveToLibrary(store, playable(), null)).toBeNull();
    removeFromLibrary(store, 1);
    expect(loadLibrary(store)[1]).toBeUndefined();
    store.set('map:2', 'junk');
    expect(loadLibrary(store)[2]).toBeUndefined();
    const broken = { get: () => { throw new Error('blocked'); }, set: () => { throw new Error('blocked'); } };
    expect(loadLibrary(broken)).toHaveLength(MAP_SLOTS);
    expect(saveToLibrary(broken, playable(), null)).toBeNull();
    expect(() => removeFromLibrary(broken, 0)).not.toThrow();
    expect(loadLibrary(undefined)).toHaveLength(MAP_SLOTS);
  });
});

describe('a game on a player-made map', () => {
  it('starts, plays, saves and restores; the save carries the map (scenario "custom")', () => {
    const m = playable();
    let s = newGame(3, FIELD_EXERCISE, 'normal', 12, false, m);
    expect(s).toMatchObject({ scenario: 'custom', map: m, edit: null });
    expect(s.world.map.w).toBe(12);
    expect(specOf(s)).toEqual(customSpec(m));
    for (let i = 0; i < 3; i++) s = lockTurn(s);
    expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    // The map must match the world and be playable; the scenario id must say 'custom'.
    expect(isValidState({ ...s, map: { ...m, terrain: 'f' + m.terrain.slice(1) } })).toBe(false);
    expect(isValidState({ ...s, scenario: 'field-exercise' })).toBe(false);
    expect(isValidState({ ...s, map: null })).toBe(false);
    expect(isValidState({ ...newGame(1), edit: { map: m, slot: null, mirror: true } })).toBe(true);
    expect(isValidState({ ...newGame(1), edit: { map: m, slot: 9, mirror: true } })).toBe(false);
    expect(isValidState({ ...newGame(1), edit: { map: { ...m, w: 7 }, slot: null, mirror: true } })).toBe(false);
  });

  it('the opponent plays a player-made map to an end (the AI knows nothing of the built-in maps)', () => {
    let m = blankMap(16, 10, 'Duel');
    const put = (tool: Tool, x: number, y: number) => (m = applyTool(m, tool, x, y, true));
    put({ type: 'unit', kind: 'command-post', side: 0 }, 1, 8);
    for (const [kind, x, y] of [['rifles', 2, 7], ['lancer', 3, 8], ['outrider', 2, 8], ['muster', 1, 6]] as const) put({ type: 'unit', kind, side: 0 }, x, y);
    let s = newGame(5, FIELD_EXERCISE, 'hard', 40, false, m);
    while (s.phase === 'plan') s = lockTurn(s);
    expect(s.phase).toBe('finished');
    expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });
});

describe('map library: the host library (ADR 0012), preferences as fallback, and moving maps over', () => {
  const host = () => createTestLibrary('relay-command').library;
  const named = (m: EditMap) => m.name || 'Untitled';

  it('keeps maps in the host library as slot-<n> items, validated when read; failures come back as reasons', async () => {
    const lib = host();
    const maps = hostMapLibrary(lib, named);
    expect(await maps.save(playable(), null)).toEqual({ ok: true, slot: 0 });
    expect(await maps.save({ ...playable(), name: 'B' }, null)).toEqual({ ok: true, slot: 1 });
    expect((await lib.list()).map((e) => e.id).sort()).toEqual(['slot-0', 'slot-1']);
    expect((await lib.list()).find((e) => e.id === 'slot-1')?.name).toBe('B');
    expect((await maps.list())[1]?.name).toBe('B');
    // Junk stored under a slot id reads as an empty place.
    await lib.put({ id: 'slot-2', name: 'junk', data: { w: 3 } });
    expect((await maps.list())[2]).toBeUndefined();
    await maps.remove(1);
    expect((await maps.list())[1]).toBeUndefined();
    const refusing = { ...lib, put: () => Promise.reject(Object.assign(new Error('x'), { reason: 'full' })) };
    expect(await hostMapLibrary(refusing, named).save(playable(), null)).toEqual({ ok: false, reason: 'full' });
    const broken = { list: () => Promise.reject(new Error('down')), get: () => Promise.reject(new Error('down')), put: () => Promise.reject(new Error('down')), delete: () => Promise.reject(new Error('down')) };
    expect(await hostMapLibrary(broken, named).list()).toEqual(Array.from({ length: MAP_SLOTS }, () => undefined));
    expect(await hostMapLibrary(broken, named).save(playable(), 3)).toEqual({ ok: false, reason: 'unavailable' });
    await expect(hostMapLibrary(broken, named).remove(0)).resolves.toBeUndefined();
  });

  it('falls back to preferences without a host library (full and unavailable told apart)', async () => {
    const store = memoryStore();
    const maps = preferenceMapLibrary(store);
    for (let i = 0; i < MAP_SLOTS; i++) expect((await maps.save(playable(), null)).ok).toBe(true);
    expect(await maps.save(playable(), null)).toEqual({ ok: false, reason: 'full' });
    const dropping = { get: () => undefined, set: () => undefined };
    expect(await preferenceMapLibrary(dropping).save(playable(), null)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('moves maps kept in preferences into the host library once; a failing move leaves them in place; no duplicates on retry', async () => {
    const store = memoryStore();
    saveToLibrary(store, { ...playable(), name: 'Old A' }, 0);
    saveToLibrary(store, { ...playable(), name: 'Old B' }, 3);
    // The library refuses the second move: nothing is removed from preferences.
    const lib = host();
    let puts = 0;
    const flaky = { ...lib, put: (item: Parameters<typeof lib.put>[0]) => (++puts === 2 ? Promise.reject(Object.assign(new Error('x'), { reason: 'unavailable' })) : lib.put(item)) };
    expect(await migratePreferenceMaps(store, hostMapLibrary(flaky, named))).toBe(0);
    expect(loadLibrary(store).filter((m) => m !== undefined)).toHaveLength(2);
    // Next start: both arrive (the one moved before is not moved twice), then preferences are cleared.
    expect(await migratePreferenceMaps(store, hostMapLibrary(lib, named))).toBe(2);
    expect((await hostMapLibrary(lib, named).list()).filter((m) => m !== undefined).map((m) => m!.name).sort()).toEqual(['Old A', 'Old B']);
    expect(loadLibrary(store).every((m) => m === undefined)).toBe(true);
    expect(await migratePreferenceMaps(store, hostMapLibrary(lib, named))).toBe(0);
  });
});
