import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { LIBRARY_LIMITS } from '@wp/game-core';
import {
  applyTool,
  mirrorImages,
  withBases,
  withSupply,
  withTeams,
  START_SUPPLY,
  THREE_SEATS,
  SUPPLY_CHOICES,
  supplyOf,
  blankMap,
  customSpec,
  DEPOSIT_SIZES,
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
  MAX_UNITS_PER_SIDE,
  memoryStore,
  removeFromLibrary,
  resize,
  saveToLibrary,
  hostMapLibrary,
  migratePreferenceMaps,
  preferenceMapLibrary,
  TERRAIN_CODES,
  toScenario,
  type EditMap,
  type Tool
} from '../src/maps';
import { createTestLibrary } from '@wp/testing';
import { initialWorld, isValidState, lockTurn, newGame, specOf, teamShapeOf, teamShapes } from '../src/rules';
import { BASTION, FIELD_EXERCISE, RIDGE_VALLEY, SCENARIOS } from '../src/scenarios';

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

  it('caps units per side but not deposits (owner, 2026-10-14); resizing cuts off what lies outside', () => {
    let m = blankMap(24, 16);
    for (let i = 0; i < 40; i++) m = applyTool(m, { type: 'unit', kind: 'rifles', side: 0 }, i % 24, Math.floor(i / 24), false);
    expect(m.units).toHaveLength(MAX_UNITS_PER_SIDE);
    // A deposit on every free cell of the largest map: valid, and its share code reads back.
    for (let y = 2; y < 16; y++) for (let x = 0; x < 24; x++) m = applyTool(m, { type: 'deposit', size: DEPOSIT_SIZES[(x + y) % 3]! }, x, y, false);
    expect(m.deposits).toHaveLength(24 * 14);
    expect(isValidMap(m)).toBe(true);
    expect(decodeMap(encodeMap(m))).toEqual(m);
    const small = resize(m, 10, 8);
    expect(small.terrain).toHaveLength(80);
    expect(small.units.every((u) => u.x < 10 && u.y < 8)).toBe(true);
    expect(isValidMap(small)).toBe(true);
  });

  it('towers in the editor (owner decision 2026-10-16): placed like any structure, start finished, and the map code is append-only so older codes read the same', () => {
    // The kinds before the towers keep their index in the map code (codes made before the towers decode unchanged).
    expect(MAP_KINDS.slice(0, 14)).toEqual(['command-post', 'muster', 'motor-pool', 'extractor', 'relay-mast', 'rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'mast-truck', 'field-post', 'jammer', 'tracer']);
    expect(MAP_KINDS.slice(14)).toEqual(['tower-gun', 'tower-artillery', 'tower-laser', 'tower-emp']);
    let m = blankMap(12, 8);
    m = applyTool(m, { type: 'unit', kind: 'command-post', side: 0 }, 1, 1, true);
    for (const [i, kind] of (['tower-gun', 'tower-artillery', 'tower-laser', 'tower-emp'] as const).entries()) m = applyTool(m, { type: 'unit', kind, side: 0 }, 3 + i, 2, true);
    expect(m.units.filter((u) => u.kind.startsWith('tower-'))).toHaveLength(8); // mirrored
    expect(decodeMap(encodeMap(m))).toEqual(m);
    expect(mapIssues(m)).toEqual([]);
    const towers = toScenario(m).entities.filter((e) => e.kind.startsWith('tower-'));
    expect(towers).toHaveLength(8);
    expect(towers.every((e) => !('build' in e) || !e.build)).toBe(true); // no construction: they stand from turn 1
  });

  it('deposit sizes: plain, rich, endless; the tool sets the size of a deposit already there; fairness, codes and scenarios carry it', () => {
    let m = blankMap(12, 8);
    m = applyTool(m, { type: 'deposit' }, 2, 3, true);
    expect(m.deposits).toEqual([{ x: 2, y: 3 }, { x: 9, y: 4 }]);
    // Re-sizing one side only: the map is no longer fair.
    m = applyTool(m, { type: 'deposit', size: 'rich' }, 2, 3, false);
    expect(m.deposits).toEqual([{ x: 2, y: 3, size: 'rich' }, { x: 9, y: 4 }]);
    expect(isFair(m)).toBe(false);
    m = applyTool(m, { type: 'deposit', size: 'rich' }, 9, 4, false);
    expect(isFair(m)).toBe(true);
    // The same size again changes nothing (the same object comes back).
    expect(applyTool(m, { type: 'deposit', size: 'rich' }, 2, 3, false)).toBe(m);
    // An Extractor on a deposit stays when the size changes.
    m = applyTool(m, { type: 'unit', kind: 'extractor', side: 0 }, 2, 3, false);
    m = applyTool(m, { type: 'deposit', size: 'endless' }, 2, 3, false);
    expect(m.deposits[0]).toEqual({ x: 2, y: 3, size: 'endless' });
    expect(m.units.some((u) => u.kind === 'extractor' && u.x === 2 && u.y === 3)).toBe(true);
    expect(decodeMap(encodeMap(m))).toEqual(m);
    // The engine scenario: plain 300, rich 600, endless keeps 300 on show and never runs dry.
    expect(toScenario(m).map.deposits).toEqual([{ x: 2, y: 3, left: 300, endless: true }, { x: 9, y: 4, left: 600 }]);
    expect(fromScenario({ id: 'custom', turnLimit: 12, scenario: toScenario(m) }).deposits).toEqual(m.deposits);
    // Unknown sizes are refused, in maps and in codes.
    expect(isValidMap({ ...m, deposits: [{ x: 2, y: 3, size: 'huge' }] })).toBe(false);
    expect(applyTool(m, { type: 'deposit', size: 'huge' as never }, 5, 5, false)).toBe(m);
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
        // Maps up to 24×16 fit one preference value (the store before the host library); larger maps live in the library.
        expect(JSON.stringify(code).length).toBeLessThanOrEqual(m.w * m.h <= 24 * 16 ? 2000 : LIBRARY_LIMITS.maxBytes);
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

  it('the largest map (48×32, a deposit on every other cell, full armies) fits one library item', () => {
    let m = blankMap(48, 32, 'x'.repeat(40));
    for (let i = 0; i < 24; i++) m = applyTool(m, { type: 'unit', kind: 'field-post', side: 0 }, i, 0, true);
    for (let y = 2; y < 16; y += 2) for (let x = 0; x < 48; x += 2) m = applyTool(m, { type: 'deposit' }, x, y, true);
    expect(m.units).toHaveLength(48);
    expect(new TextEncoder().encode(JSON.stringify(encodeMap(m))).length).toBeLessThanOrEqual(LIBRARY_LIMITS.maxBytes);
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
    expect(removeFromLibrary(store, 1)).toBe(true);
    expect(loadLibrary(store)[1]).toBeUndefined();
    store.set('map:2', 'junk');
    expect(loadLibrary(store)[2]).toBeUndefined();
    const broken = { get: () => { throw new Error('blocked'); }, set: () => { throw new Error('blocked'); } };
    expect(loadLibrary(broken)).toHaveLength(MAP_SLOTS);
    expect(saveToLibrary(broken, playable(), null)).toBeNull();
    expect(removeFromLibrary(broken, 0)).toBe(false);
    expect(removeFromLibrary({ get: () => 'kept', set: () => undefined }, 0)).toBe(false);
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
    expect(await maps.remove(1)).toBe(true);
    expect((await maps.list())[1]).toBeUndefined();
    const refusing = { ...lib, put: () => Promise.reject(Object.assign(new Error('x'), { reason: 'full' })) };
    expect(await hostMapLibrary(refusing, named).save(playable(), null)).toEqual({ ok: false, reason: 'full' });
    const broken = { list: () => Promise.reject(new Error('down')), get: () => Promise.reject(new Error('down')), put: () => Promise.reject(new Error('down')), delete: () => Promise.reject(new Error('down')) };
    expect(await hostMapLibrary(broken, named).list()).toEqual(Array.from({ length: MAP_SLOTS }, () => undefined));
    expect(await hostMapLibrary(broken, named).save(playable(), 3)).toEqual({ ok: false, reason: 'unavailable' });
    expect(await hostMapLibrary(broken, named).remove(0)).toBe(false);
  });

  it('two windows saving new maps at the same time keep both, each in the place it was told', async () => {
    for (let n = 2; n <= MAP_SLOTS; n++) {
      const lib = host();
      const windows = Array.from({ length: n }, () => hostMapLibrary(lib, named));
      const results = await Promise.all(windows.map((w, i) => w.save({ ...playable(), name: `M${i}` }, null)));
      const listed = await windows[0]!.list();
      results.forEach((r, i) => {
        expect(r.ok, `${n} windows, map ${i}`).toBe(true);
        if (r.ok) expect(listed[r.slot]?.name).toBe(`M${i}`);
      });
      expect(new Set(results.map((r) => (r.ok ? r.slot : -1))).size).toBe(n);
    }
    // One more than there are places: exactly one is told "full", the others are all kept.
    const lib = host();
    const results = await Promise.all(Array.from({ length: MAP_SLOTS + 1 }, (_, i) => hostMapLibrary(lib, named).save({ ...playable(), name: `M${i}` }, null)));
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: 'full' }]);
    expect((await hostMapLibrary(lib, named).list()).filter((m) => m !== undefined)).toHaveLength(MAP_SLOTS);
  });

  it('the slow window cannot overwrite a new map: places are created only while free (ifAbsent), even when its write lands after the other window checked', async () => {
    const lib = host();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => (release = r));
    // Window B lists (place 0 free), then its write is held until window A has saved and read back.
    const slow = { ...lib, put: async (item: Parameters<typeof lib.put>[0], options?: Parameters<typeof lib.put>[1]) => { await gate; return lib.put(item, options); } };
    const b = hostMapLibrary(slow, named).save({ ...playable(), name: 'B' }, null);
    const a = await hostMapLibrary(lib, named).save({ ...playable(), name: 'A' }, null);
    release();
    const bResult = await b;
    expect(a).toEqual({ ok: true, slot: 0 });
    expect(bResult).toEqual({ ok: true, slot: 1 });
    const listed = await hostMapLibrary(lib, named).list();
    expect([listed[0]?.name, listed[1]?.name]).toEqual(['A', 'B']);
  });

  it('moving old maps over while another window saves a new one loses neither', async () => {
    const store = memoryStore();
    saveToLibrary(store, { ...playable(), name: 'Old' }, 0);
    const lib = host();
    const [moved, saved] = await Promise.all([migratePreferenceMaps(store, hostMapLibrary(lib, named)), hostMapLibrary(lib, named).save({ ...playable(), name: 'New' }, null)]);
    expect(moved).toBe(1);
    expect(saved.ok).toBe(true);
    const listed = await hostMapLibrary(lib, named).list();
    expect(listed.filter((m) => m !== undefined).map((m) => m!.name).sort()).toEqual(['New', 'Old']);
    if (saved.ok) expect(listed[saved.slot]?.name).toBe('New');
  });

  it('says "conflict" when another writer replaced the place it saved into, and false when a delete failed', async () => {
    const lib = host();
    await lib.put({ id: 'slot-4', name: 'Other', data: { ...playable(), name: 'Other' } });
    // Another window writes slot-4 right after this one did.
    const racing = { ...lib, put: async (item: Parameters<typeof lib.put>[0]) => { const r = await lib.put(item); await lib.put({ id: 'slot-4', name: 'Other', data: { ...playable(), name: 'Other' } }); return r; } };
    expect(await hostMapLibrary(racing, named).save(playable(), 4)).toEqual({ ok: false, reason: 'conflict' });
    expect((await hostMapLibrary(lib, named).list())[4]?.name).toBe('Other');
    const refusing = { ...lib, delete: () => Promise.reject(new Error('blocked')) };
    expect(await hostMapLibrary(refusing, named).remove(4)).toBe(false);
    expect((await hostMapLibrary(lib, named).list())[4]?.name).toBe('Other');
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

describe('map editor: four bases (owner decision 2026-10-24)', () => {
  const four = () => withBases(blankMap(16, 12, 'Four'), 4);

  it('a mirrored edit on a four-base map lands on all four images, each piece with its mirror seat', () => {
    let m = applyTool(four(), { type: 'unit', kind: 'command-post', side: 0 }, 2, 9, true);
    m = applyTool(m, { type: 'unit', kind: 'rifles', side: 0 }, 3, 9, true);
    m = applyTool(m, { type: 'terrain', code: 'f' }, 5, 6, true);
    m = applyTool(m, { type: 'deposit', size: 'rich' }, 4, 10, true);
    const posts = m.units.filter((u) => u.kind === 'command-post').map((u) => `${u.side}@${u.x},${u.y}`);
    expect(posts.sort()).toEqual(['0@2,9', '1@2,2', '2@13,2', '3@13,9']);
    for (const [x, y] of [[5, 6], [10, 6], [5, 5], [10, 5]]) expect(m.terrain[y! * 16 + x!]).toBe('f');
    expect(m.deposits.filter((d) => d.size === 'rich')).toHaveLength(4);
    expect(isFair(m)).toBe(true);
    expect(mapIssues(m)).toEqual([]);
    expect(customSpec(m).seats).toBeDefined();
    // A piece placed for base B is mirrored with the seats swapped as the corners are.
    const b = applyTool(four(), { type: 'unit', kind: 'lancer', side: 1 }, 2, 2, true);
    expect(b.units.map((u) => `${u.side}@${u.x},${u.y}`).sort()).toEqual(['0@2,9', '1@2,2', '2@13,2', '3@13,9']);
    // Not mirrored: one cell only; a two-side map keeps the point mirror.
    expect(applyTool(four(), { type: 'unit', kind: 'rifles', side: 2 }, 12, 2, false).units).toHaveLength(1);
    expect(mirrorImages(blankMap(16, 12), 2, 9)).toEqual([{ x: 13, y: 2, seat: [1, 0] }]);
    // Seats beyond the map's are refused.
    expect(applyTool(blankMap(16, 12), { type: 'unit', kind: 'rifles', side: 2 }, 3, 3, false).units).toHaveLength(0);
  });

  it('switching to two bases drops the pieces of bases C and D; four bases back keeps the map', () => {
    let m = applyTool(four(), { type: 'unit', kind: 'command-post', side: 0 }, 2, 9, true);
    const two = withBases(m, 2);
    expect(two.seats).toBeUndefined();
    expect(two.units.every((u) => u.side < 2)).toBe(true);
    expect(isValidMap(two)).toBe(true);
    m = withBases(two, 4);
    expect(m.seats).toBe(4);
    expect(isValidMap(m)).toBe(true);
  });

  it('a share code carries the four bases; a two-side code stays as it was; a code with another seat count is refused', () => {
    const m = applyTool(applyTool(four(), { type: 'unit', kind: 'command-post', side: 0 }, 2, 9, true), { type: 'unit', kind: 'rifles', side: 0 }, 3, 9, true);
    expect(decodeMap(encodeMap(m))).toEqual(m);
    const two = blankMap(12, 10, 'Two');
    expect(decodeMap(encodeMap(two))).toEqual(two);
    const json = JSON.stringify(['x', 12, 10, '.'.repeat(120), [], [], 5]);
    expect(decodeMap('RC1.' + btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''))).toBeUndefined();
  });

  it('starting from Four Corners gives a four-base map; a game on a player-made four-base map offers 1 to 3 opponents', () => {
    const corners = fromScenario(SCENARIOS.find((x) => x.id === 'four-corners')!, 'Corners');
    expect(corners.seats).toBe(4);
    expect(isValidMap(corners)).toBe(true);
    expect(mapIssues(corners)).toEqual([]);
    expect(isFair(corners)).toBe(false); // a quarter turn, not a mirror: told, not required
    for (const n of [1, 2, 3]) {
      const s = newGame(1, FIELD_EXERCISE, 'normal', 12, false, corners, n);
      expect(s.opponents).toBe(n);
      expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    }
    const team = newGame(1, FIELD_EXERCISE, 'normal', 12, false, corners, 3, [], false, null, '2v2-next');
    expect(team.world.teams).toEqual([0, 0, 1, 1]);
    // The editor keeps a four-base draft.
    expect(isValidState({ ...team, edit: { map: corners, slot: null, mirror: true } })).toBe(true);
  });
});

describe('map editor: asymmetric maps (owner decision 2026-10-26)', () => {
  const code = (data: unknown[]) => 'RC1.' + btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  /** A playable four-base map: a post and a squad per corner, mirrored. */
  const four = () => {
    let m = withBases(blankMap(16, 12, 'Four'), 4);
    m = applyTool(m, { type: 'unit', kind: 'command-post', side: 0 }, 2, 9, true);
    return applyTool(m, { type: 'unit', kind: 'rifles', side: 0 }, 3, 9, true);
  };

  it('each base starts with the Supply chosen for it; the usual start everywhere leaves no Supply on the map', () => {
    const m = withSupply(playable(), 1, 1500);
    expect(m.supply).toEqual([START_SUPPLY, 1500]);
    expect(supplyOf(m)).toEqual([300, 1500]);
    expect(isValidMap(m)).toBe(true);
    expect(isFair(m)).toBe(false); // the bases start unequal
    expect(toScenario(m).supply).toEqual([300, 1500]);
    expect(newGame(1, FIELD_EXERCISE, 'normal', 12, false, m).world.supply).toEqual([300, 1500]);
    // Back to the usual amount: no Supply of its own; fair again.
    const back = withSupply(m, 1, START_SUPPLY);
    expect(back).not.toHaveProperty('supply');
    expect(isFair(back)).toBe(true);
    expect(toScenario(back)).not.toHaveProperty('supply');
    // Only the offered amounts, only the map's bases.
    for (const [seat, amount] of [[1, 301], [2, 600], [-1, 600], [0.5, 600], [0, -150]] as const) expect(withSupply(m, seat, amount)).toBe(m);
    expect(SUPPLY_CHOICES).toContain(START_SUPPLY);
  });

  it('with four bases, every base its own Supply, laid out by seat for any number of opponents', () => {
    const m = withSupply(withSupply(four(), 0, 0), 2, 3000);
    expect(supplyOf(m)).toEqual([0, 300, 3000, 300]);
    expect(newGame(1, FIELD_EXERCISE, 'normal', 12, false, m, 3).world.supply).toEqual([0, 300, 3000, 300]);
    // One opponent sits across (seat 2), two take seats 1 and 2.
    expect(newGame(1, FIELD_EXERCISE, 'normal', 12, false, m, 1).world.supply).toEqual([0, 3000]);
    expect(newGame(1, FIELD_EXERCISE, 'normal', 12, false, m, 2).world.supply).toEqual([0, 300, 3000]);
    // Two bases: C and D (and their Supply) go; four again: they start with the usual amount.
    const two = withBases(m, 2);
    expect(two.supply).toEqual([0, 300]);
    expect(withBases(two, 4).supply).toEqual([0, 300, 300, 300]);
    expect(withBases(withSupply(four(), 3, 600), 2)).not.toHaveProperty('supply');
  });

  it('a four-base map made for teams offers only 1 against 3 (you are base A) and 3 against 1 (base A the lone opponent)', () => {
    const m = withTeams(withSupply(four(), 0, 1500), true);
    expect(m.teams).toBe(true);
    expect(isValidMap(m)).toBe(true);
    expect(isFair(m)).toBe(false);
    expect(mapIssues(m)).toEqual([]);
    const spec = customSpec(m);
    expect(teamShapes(spec, 3)).toEqual(['1v3', '3v1']);
    expect(teamShapes(spec, 2)).toEqual([]);
    const alone = newGame(1, FIELD_EXERCISE, 'normal', 12, false, m, 3);
    expect(teamShapeOf(alone.world)).toBe('1v3');
    expect(alone.world.supply).toEqual([1500, 300, 300, 300]);
    expect(isValidState(JSON.parse(JSON.stringify(alone)))).toBe(true);
    const three = newGame(1, FIELD_EXERCISE, 'normal', 12, false, m, 3, [], false, null, '3v1');
    expect(teamShapeOf(three.world)).toBe('3v1');
    // Base A is side 2 (the lone opponent): its post and its Supply.
    const postA = m.units.find((u) => u.side === 0 && u.kind === 'command-post')!;
    expect(three.world.entities.find((e) => e.kind === 'command-post' && e.side === 2)).toMatchObject({ x: postA.x, y: postA.y });
    expect(three.world.supply).toEqual([300, 300, 1500, 300]);
    expect(isValidState(JSON.parse(JSON.stringify(three)))).toBe(true);
    // Not for teams any more; a two-side map is never made for teams.
    expect(withTeams(m, false)).not.toHaveProperty('teams');
    expect(withTeams(playable(), true)).toEqual(playable());
    expect(withBases(m, 2)).not.toHaveProperty('teams');
    expect(withBases(m, 4)).toHaveProperty('teams', true);
  });

  it('Bastion opens in the editor as it is: made for teams, its Supply per base; played from there it starts as Bastion', () => {
    const m = fromScenario(BASTION, 'Bastion');
    expect(m).toMatchObject({ seats: 4, teams: true, supply: [1500, 300, 300, 300] });
    expect(isValidMap(m)).toBe(true);
    expect(mapIssues(m)).toEqual([]);
    for (const shape of ['1v3', '3v1'] as const) {
      const own = initialWorld(customSpec(m), 1, 3, false, shape);
      const built = initialWorld(BASTION, 1, 3, false, shape);
      expect(own.supply, shape).toEqual(built.supply);
      expect(own.entities.map((e) => `${e.side}:${e.kind}@${e.x},${e.y}`), shape).toEqual(built.entities.map((e) => `${e.side}:${e.kind}@${e.x},${e.y}`));
    }
    // A built-in map at the usual start carries no Supply.
    expect(fromScenario(SCENARIOS.find((x) => x.id === 'four-corners')!)).not.toHaveProperty('supply');
  });

  it('share codes carry Supply and teams; codes from before still read; malformed extras are refused', () => {
    const teams = withTeams(withSupply(four(), 0, 1500), true);
    expect(decodeMap(encodeMap(teams))).toEqual(teams);
    const two = withSupply(playable(), 0, 600);
    expect(decodeMap(encodeMap(two))).toEqual(two);
    // Without anything asymmetric the codes are what they were (six fields, seven with four bases).
    expect(encodeMap(playable())).toBe(encodeMap(withSupply(withSupply(playable(), 0, 600), 0, START_SUPPLY)));
    const base = ['x', 12, 10, '.'.repeat(120), [], []];
    expect(decodeMap(code([...base, 2, { s: [600, 300] }]))).toMatchObject({ supply: [600, 300] });
    for (const bad of [
      [...base, 2, { s: [600, 301] }], // not an offered amount
      [...base, 2, { s: [600] }], // one per base
      [...base, 2, { t: 1 }], // teams need four bases
      [...base, 4, { t: 2 }],
      [...base, 4, { x: 1 }],
      [...base, 5, { s: [300, 300, 300, 300, 300] }],
      [...base, 3, {}], // nothing asymmetric: the seven-field code
      [...base, 4, 'teams'],
      [...base, 4, {}, 9]
    ]) expect(decodeMap(code(bad)), JSON.stringify(bad.slice(6))).toBeUndefined();
  });

  it('refuses maps with Supply or teams that do not fit', () => {
    const m = four();
    expect(isValidMap({ ...m, supply: [300, 300] })).toBe(false);
    expect(isValidMap({ ...m, supply: [300, 300, 300, 'x'] })).toBe(false);
    expect(isValidMap({ ...m, supply: 300 })).toBe(false);
    expect(isValidMap({ ...m, teams: false })).toBe(false);
    expect(isValidMap({ ...playable(), teams: true })).toBe(false);
    expect(isValidMap({ ...m, supply: [0, 150, 1000, 3000], teams: true })).toBe(true);
  });
});

describe('map editor: three bases (2026-10-29, as Lake Country)', () => {
  const three = () => withBases(blankMap(16, 12, 'Three'), 3);
  /** A playable three-base map: a post and a squad per base, placed by hand (never mirrored). */
  function playableThree(): EditMap {
    let m = three();
    const put = (tool: Tool, x: number, y: number) => (m = applyTool(m, tool, x, y, true));
    for (const [side, x, y] of [[0, 1, 10], [1, 1, 1], [2, 14, 6]] as const) {
      put({ type: 'unit', kind: 'command-post', side }, x, y);
      put({ type: 'unit', kind: 'rifles', side }, x + (x < 8 ? 1 : -1), y);
    }
    return m;
  }

  it('Lake Country opens as a three-base map with its Supply; it plays with one or two opponents', () => {
    const lake = fromScenario(SCENARIOS.find((x) => x.id === 'lake-country')!, 'Lakes');
    expect(lake.seats).toBe(3);
    expect(lake.supply).toEqual([150, 300, 300]);
    expect(isValidMap(lake)).toBe(true);
    expect(mapIssues(lake)).toEqual([]);
    expect(isFair(lake)).toBe(false);
    expect(customSpec(lake).seats).toBe(THREE_SEATS);
    expect(toScenario(lake).sides).toBe(3);
    for (const n of [1, 2]) {
      const s = newGame(1, FIELD_EXERCISE, 'normal', 12, false, lake, n);
      expect(s.opponents).toBe(n);
      expect(s.world.sides).toBe(n + 1); // with one opponent, seat C's post stays neutral
      expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    }
    // The editor keeps a three-base draft across a reload.
    expect(isValidState(JSON.parse(JSON.stringify({ ...newGame(1, FIELD_EXERCISE, 'normal', 12, false, null, 1), edit: { map: lake, slot: null, mirror: true } })))).toBe(true);
    // Teams as the built-in map offers them.
    expect(teamShapes(customSpec(lake), 2)).toEqual(teamShapes(SCENARIOS.find((x) => x.id === 'lake-country')!, 2));
  });

  it('a three-base map is never mirrored: a mirrored edit changes its own cell only', () => {
    expect(mirrorImages(three(), 2, 9)).toEqual([]);
    const m = applyTool(three(), { type: 'unit', kind: 'command-post', side: 2 }, 13, 2, true);
    expect(m.units).toEqual([{ side: 2, kind: 'command-post', x: 13, y: 2 }]);
    expect(applyTool(three(), { type: 'terrain', code: 'f' }, 2, 2, true).terrain.split('f')).toHaveLength(2);
    expect(applyTool(three(), { type: 'unit', kind: 'rifles', side: 3 }, 3, 3, false).units).toHaveLength(0);
    const m3 = playableThree();
    expect(mapIssues(m3)).toEqual([]);
    expect(isFair(m3)).toBe(false);
  });

  it('switching bases keeps the pieces and Supply of the bases that stay; teams only with four', () => {
    let four = withTeams(withSupply(withSupply(withBases(blankMap(16, 12, 'Four'), 4), 2, 600), 3, 1500), true);
    four = applyTool(four, { type: 'unit', kind: 'command-post', side: 0 }, 2, 9, true);
    const m = withBases(four, 3);
    expect(m.seats).toBe(3);
    expect(m.units.map((u) => u.side).sort()).toEqual([0, 1, 2]);
    expect(m.supply).toEqual([300, 300, 600]);
    expect(m).not.toHaveProperty('teams');
    expect(isValidMap(m)).toBe(true);
    const back = withBases(m, 4);
    expect(back.supply).toEqual([300, 300, 600, 300]);
    expect(back).not.toHaveProperty('teams');
    expect(withBases(withSupply(three(), 2, 600), 2)).not.toHaveProperty('supply');
    expect(withBases(three(), 2).seats).toBeUndefined();
  });

  it('share codes carry three bases (seven fields; eight with Supply); a three-base map refuses a fourth seat or teams', () => {
    const m = playableThree();
    expect(decodeMap(encodeMap(m))).toEqual(m);
    const rich = withSupply(m, 1, 1000);
    expect(decodeMap(encodeMap(rich))).toEqual(rich);
    const lake = fromScenario(SCENARIOS.find((x) => x.id === 'lake-country')!);
    expect(decodeMap(encodeMap(lake))).toEqual({ ...lake, units: decodeMap(encodeMap(lake))!.units });
    expect(isValidMap({ ...m, units: [...m.units, { side: 3, kind: 'rifles', x: 8, y: 8 }] })).toBe(false);
    expect(isValidMap({ ...m, teams: true })).toBe(false);
    expect(isValidMap({ ...m, supply: [300, 300] })).toBe(false);
    expect(isValidMap({ ...m, seats: 5 })).toBe(false);
  });
});
