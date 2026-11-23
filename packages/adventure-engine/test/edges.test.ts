import { describe, expect, it } from 'vitest';
import {
  available, canonicalJson, compile, initialState, isActionShape, isValidAdventureState, MAX_HOPS, stateHash, step, textKeys,
  type Action, type Adventure, type AdventureState
} from '../src';
import { C, WALKTHROUGH, WATCHTOWER } from './fixture';

const play = (actions: readonly Action[]): AdventureState => actions.reduce((s, a) => step(C(), s, a).state, initialState(C(), 1));
const errorOf = (adv: Adventure): string => {
  try {
    compile(adv);
    return '';
  } catch (e) {
    return (e as Error).message;
  }
};
const withYardHotspot = (patch: object): Adventure => ({
  ...WATCHTOWER,
  scenes: WATCHTOWER.scenes.map((sc) => (sc.id === 'yard' ? { ...sc, hotspots: [...sc.hotspots, { id: 'extra', shape: { x: 0, y: 0, w: 120, h: 120 }, ...patch }] } : sc))
});

describe('available: exact lists', () => {
  it('at the start: hotspot verbs in reading order, selection, nothing else', () => {
    expect(available(C(), initialState(C(), 1))).toEqual([
      { a: 'examine', hs: 'rope' },
      { a: 'take', hs: 'rope' },
      { a: 'examine', hs: 'keeper' },
      { a: 'talk', hs: 'keeper' },
      { a: 'examine', hs: 'stair' },
      { a: 'use', hs: 'stair' },
      { a: 'examine', hs: 'window' },
      { a: 'use', hs: 'window' },
      { a: 'select', item: null }
    ]);
  });

  it('clues are presented only to people (hotspots that talk or take clues)', () => {
    const s = play(WALKTHROUGH.slice(0, 10));
    const presents = available(C(), s).filter((a) => a.a === 'present');
    expect(presents).toEqual(['shifts', 'ledger-dates', 'gate-unwatched'].map((clue) => ({ a: 'present', clue, hs: 'keeper' })));
  });

  it('pairs are listed once each, in inventory/journal order', () => {
    const s = play([...WALKTHROUGH.slice(0, 7)]);
    expect(available(C(), s).filter((a) => a.a === 'combine' || a.a === 'deduce')).toEqual([
      { a: 'combine', x: 'rope', y: 'hook' },
      { a: 'deduce', x: 'shifts', y: 'ledger-dates' }
    ]);
  });

  it('no travel away from a scene that is off the map, no travel to it', () => {
    const inTower = play(WALKTHROUGH.slice(0, 13));
    expect(available(C(), inTower).some((a) => a.a === 'travel')).toBe(false);
    const c = compile({ ...WATCHTOWER, scenes: WATCHTOWER.scenes.map((sc) => (sc.id === 'yard' ? { ...sc, map: false } : sc)) });
    const inCellar = step(c, initialState(c, 1), { a: 'use', hs: 'stair' }).state;
    expect(available(c, inCellar).some((a) => a.a === 'travel')).toBe(false);
    expect(step(c, inCellar, { a: 'travel', scene: 'yard' }).out).toEqual({ ok: false, reason: 'not-reachable' });
  });

  it('every listed action has a valid shape', () => {
    let s = initialState(C(), 1);
    for (const a of WALKTHROUGH) {
      for (const b of available(C(), s)) expect(isActionShape(b), JSON.stringify(b)).toBe(true);
      s = step(C(), s, a).state;
    }
  });
});

describe('events', () => {
  it('report exactly what changed', () => {
    const s = play(WALKTHROUGH.slice(0, 6));
    expect(step(C(), s, { a: 'combine', x: 'rope', y: 'hook' }).out).toEqual({
      ok: true,
      text: ['combo.hook.rope.0', 'chapter.below'],
      events: [{ type: 'used', item: 'rope' }, { type: 'used', item: 'hook' }, { type: 'gained', item: 'grapnel' }, { type: 'chapter', chapter: 'below' }]
    });
    expect(step(C(), initialState(C(), 1), { a: 'use', hs: 'stair' }).out).toEqual({ ok: true, text: ['hs.yard.stair.use.0'], events: [{ type: 'moved', scene: 'cellar' }] });
    expect(step(C(), initialState(C(), 1), { a: 'talk', hs: 'keeper' }).out).toEqual({
      ok: true,
      text: ['hs.yard.keeper.talk.0', 'dlg.keeper.hello'],
      events: [{ type: 'dialogue', id: 'keeper', node: 'hello' }]
    });
  });

  it('a flag back at 0 is removed from the state', () => {
    const c = compile(withYardHotspot({ on: { use: [{ when: { flag: 'keeper-mood' }, then: [{ add: 'keeper-mood', by: -3 }] }, { then: [{ set: 'keeper-mood', to: 2 }] }] } }));
    const up = step(c, initialState(c, 1), { a: 'use', hs: 'extra' }).state;
    expect(up.flags).toEqual({ 'keeper-mood': 2 });
    const down = step(c, up, { a: 'use', hs: 'extra' }).state;
    expect(down.flags).toEqual({});
    expect(isValidAdventureState(c, down)).toBe(true);
  });

  it('flags are clamped to their range', () => {
    const c = compile(withYardHotspot({ on: { use: [{ then: [{ add: 'keeper-mood', by: 3 }, { add: 'keeper-mood', by: 3 }] }] } }));
    expect(step(c, initialState(c, 1), { a: 'use', hs: 'extra' }).state.flags).toEqual({ 'keeper-mood': 3 });
  });

  it(`onEnter loops stop after ${MAX_HOPS} scene changes`, () => {
    const loop: Adventure = {
      ...WATCHTOWER,
      scenes: WATCHTOWER.scenes.map((sc) =>
        sc.id === 'cellar' ? { ...sc, onEnter: [{ then: [{ go: 'yard' }] }] } : sc.id === 'yard' ? { ...sc, onEnter: [{ when: { visited: 'cellar' }, then: [{ go: 'cellar' }] }] } : sc
      )
    };
    const c = compile(loop);
    const r = step(c, initialState(c, 1), { a: 'use', hs: 'stair' });
    expect(r.out.ok && r.out.events.filter((e) => e.type === 'moved')).toHaveLength(MAX_HOPS);
    expect(r.state.scene).toBe('yard');
  });

  it('a start scene without onEnter rules logs nothing; travel into it shows no text', () => {
    const c = compile({ ...WATCHTOWER, start: { scene: 'cellar' } });
    const s = initialState(c, 1);
    expect(s.log).toEqual([]);
    const back = step(c, step(c, s, { a: 'use', hs: 'stair' }).state, { a: 'travel', scene: 'cellar' });
    expect(back.out).toEqual({ ok: true, text: [], events: [{ type: 'moved', scene: 'cellar' }] });
  });

  it('a chapter whose condition already holds at the start ends at once; several can end in one step', () => {
    const c = compile({ ...WATCHTOWER, chapters: [{ id: 'one', done: { visited: 'yard' } }, { id: 'two', done: { in: 'yard' } }, { id: 'three', done: { has: 'map' } }] });
    const s = initialState(c, 1);
    expect(s.chapter).toBe(2);
    expect(s.log).toEqual(['scene.yard.enter.0', 'chapter.one', 'chapter.two']);
  });
});

describe('edge cases found by mutation testing', () => {
  it('using up an item that is not held changes nothing (and keeps the selection)', () => {
    const c = compile(withYardHotspot({ on: { use: [{ then: [{ take: 'hook' }] }] } }));
    const s = step(c, step(c, initialState(c, 1), { a: 'take', hs: 'rope' }).state, { a: 'select', item: 'rope' }).state;
    const r = step(c, s, { a: 'use', hs: 'extra' });
    expect(r.state.items).toEqual(['rope']);
    expect(r.state.used).toEqual([]);
    expect(r.state.selected).toBe('rope');
    expect(r.out).toMatchObject({ ok: true, events: [] });
  });

  it('using up another item keeps the selection', () => {
    const c = compile(withYardHotspot({ on: { use: [{ then: [{ take: 'rope' }] }] } }));
    let s = initialState(c, 1);
    s = { ...s, items: ['rope', 'hook'], selected: 'hook' };
    expect(step(c, s, { a: 'use', hs: 'extra' }).state.selected).toBe('hook');
  });

  it('an ending reached inside a dialogue closes it', () => {
    const adv: Adventure = {
      ...WATCHTOWER,
      dialogues: [{ id: 'keeper', nodes: [{ id: 'hello', options: [{ id: 'gift', next: 'hello', then: [{ give: 'map' }] }, { id: 'bye', next: null }] }] }]
    };
    const c = compile(adv);
    const s = step(c, initialState(c, 1), { a: 'talk', hs: 'keeper' }).state;
    const r = step(c, s, { a: 'choose', option: 'gift' });
    expect(r.state.ended).toBe('map-found');
    expect(r.state.dialogue).toBeNull();
    expect(isValidAdventureState(c, r.state)).toBe(true);
  });

  it('a clue cannot be presented to a hotspot that is not visible', () => {
    const s = { ...initialState(C(), 1), clues: ['shifts'], items: ['rope'] };
    expect(step(C(), s, { a: 'present', clue: 'shifts', hs: 'rope' }).out).toEqual({ ok: false, reason: 'not-here' });
    expect(step(C(), s, { a: 'present', clue: 'shifts', hs: 'hook' }).out).toEqual({ ok: false, reason: 'not-here' });
  });

  it('people are hotspots that talk or take clues', () => {
    const c = compile({
      ...withYardHotspot({ clues: { shifts: [{}] } }),
      scenes: withYardHotspot({ clues: { shifts: [{}] } }).scenes.map((sc) =>
        sc.id === 'yard' ? { ...sc, hotspots: [...sc.hotspots, { id: 'talker', shape: { x: 0, y: 0, w: 120, h: 120 }, on: { talk: [{}] } }] } : sc
      )
    });
    const s = { ...initialState(c, 1), clues: ['shifts'] };
    expect(available(c, s).filter((a) => a.a === 'present').map((a) => (a as { hs: string }).hs)).toEqual(['keeper', 'extra', 'talker']);
  });
});

describe('isActionShape', () => {
  it.each<[unknown, boolean]>([
    [{ a: 'examine', hs: 'x' }, true],
    [{ a: 'examine', hs: 'x', item: 'y' }, false],
    [{ a: 'useItem', item: 'i', hs: 'h' }, true],
    [{ a: 'useItem', item: 'i' }, false],
    [{ a: 'useItem', item: 1, hs: 'h' }, false],
    [{ a: 'useItem', item: 'i', hs: 2 }, false],
    [{ a: 'useItem', item: 'i', hs: 'h', x: 1 }, false],
    [{ a: 'present', clue: 'c', hs: 'h' }, true],
    [{ a: 'present', clue: 1, hs: 'h' }, false],
    [{ a: 'present', clue: 'c', hs: 1 }, false],
    [{ a: 'present', clue: 'c', item: 'h' }, false],
    [{ a: 'present', clue: 'c', hs: 'h', x: 1 }, false],
    [{ a: 'take', hs: ['x'] }, false],
    [{ a: 'combine', x: 'a', y: 'b' }, true],
    [{ a: 'combine', x: 1, y: 'b' }, false],
    [{ a: 'combine', x: 'a', y: 1 }, false],
    [{ a: 'deduce', x: 'a', y: 'b', z: 1 }, false],
    [{ a: 'choose', option: 'o' }, true],
    [{ a: 'choose', option: 1 }, false],
    [{ a: 'choose', option: 'o', x: 1 }, false],
    [{ a: 'travel', scene: 's' }, true],
    [{ a: 'travel', scene: 1 }, false],
    [{ a: 'travel', scene: 's', x: 1 }, false],
    [{ a: 'select', item: null }, true],
    [{ a: 'select', item: 'i' }, true],
    [{ a: 'select', item: 1 }, false],
    [{ a: 'select', item: null, x: 1 }, false],
    [{ a: 'hint', goal: 'g' }, true],
    [{ a: 'hint', goal: 1 }, false],
    [{ a: 'hint', goal: 'g', x: 1 }, false],
    [{ a: 'take', hs: 'x'.repeat(64) }, true],
    [{ a: 'take', hs: 'x'.repeat(65) }, false],
    [{ a: 'take', hs: '' }, false],
    [['a'], false]
  ])('%j → %s', (v, ok) => {
    expect(isActionShape(v)).toBe(ok);
  });
});

describe('compile: boundaries', () => {
  it.each<[string, Adventure, boolean]>([
    ['48-character id', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: 'a'.repeat(48) }] }, true],
    ['49-character id', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: 'a'.repeat(49) }] }, false],
    ['id starting with a hyphen', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: '-a' }] }, false],
    ['upper-case id', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: 'aB' }] }, false],
    ['single-character id', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: '7' }] }, true],
    ['content version 1', { ...WATCHTOWER, contentVersion: 1 }, true],
    ['content version 1.5', { ...WATCHTOWER, contentVersion: 1.5 }, false],
    ['flag max 1', { ...WATCHTOWER, flags: { ...WATCHTOWER.flags, x: { max: 1 } } }, true],
    ['flag max 1000', { ...WATCHTOWER, flags: { ...WATCHTOWER.flags, x: { max: 1000 } } }, true],
    ['flag max 1001', { ...WATCHTOWER, flags: { ...WATCHTOWER.flags, x: { max: 1001 } } }, false],
    ['flag max 2.5', { ...WATCHTOWER, flags: { ...WATCHTOWER.flags, x: { max: 2.5 } } }, false],
    ['bad flag id', { ...WATCHTOWER, flags: { ...WATCHTOWER.flags, X: { max: 1 } } }, false],
    ['compare with max', withYardHotspot({ visible: { flag: 'keeper-mood', eq: 3 } }), true],
    ['compare with 0', withYardHotspot({ visible: { flag: 'keeper-mood', lte: 0 } }), true],
    ['compare with -1', withYardHotspot({ visible: { flag: 'keeper-mood', gte: -1 } }), false],
    ['compare with 1.5', withYardHotspot({ visible: { flag: 'keeper-mood', eq: 1.5 } }), false],
    ['set to max', withYardHotspot({ on: { use: [{ then: [{ set: 'keeper-mood', to: 3 }] }] } }), true],
    ['set to 0', withYardHotspot({ on: { use: [{ then: [{ set: 'keeper-mood', to: 0 }] }] } }), true],
    ['set to -1', withYardHotspot({ on: { use: [{ then: [{ set: 'keeper-mood', to: -1 }] }] } }), false],
    ['set to 1.5', withYardHotspot({ on: { use: [{ then: [{ set: 'keeper-mood', to: 1.5 }] }] } }), false],
    ['add -max', withYardHotspot({ on: { use: [{ then: [{ add: 'keeper-mood', by: -3 }] }] } }), true],
    ['add more than max', withYardHotspot({ on: { use: [{ then: [{ add: 'keeper-mood', by: 4 }] }] } }), false],
    ['add 0.5', withYardHotspot({ on: { use: [{ then: [{ add: 'keeper-mood', by: 0.5 }] }] } }), false],
    ['set unknown flag', withYardHotspot({ on: { use: [{ then: [{ set: 'nope', to: 1 }] }] } }), false],
    ['take unknown item', withYardHotspot({ on: { use: [{ then: [{ take: 'sword' }] }] } }), false],
    ['learn unknown clue', withYardHotspot({ on: { use: [{ then: [{ learn: 'x' }] }] } }), false],
    ['unknown item in any', withYardHotspot({ visible: { any: [{ has: 'rope' }, { used: 'sword' }] } }), false],
    ['unknown scene in all', withYardHotspot({ visible: { all: [{ in: 'moon' }] } }), false],
    ['unknown item in not', withYardHotspot({ visible: { not: { has: 'sword' } } }), false],
    ['unknown flag in rule condition', withYardHotspot({ on: { use: [{ when: { flag: 'nope' } }] } }), false],
    ['start flag at max', { ...WATCHTOWER, start: { scene: 'yard', flags: { 'keeper-mood': 3 } } }, true],
    ['start flag -1', { ...WATCHTOWER, start: { scene: 'yard', flags: { 'keeper-mood': -1 } } }, false],
    ['start flag 1.5', { ...WATCHTOWER, start: { scene: 'yard', flags: { 'keeper-mood': 1.5 } } }, false],
    ['unknown start flag', { ...WATCHTOWER, start: { scene: 'yard', flags: { nope: 1 } } }, false],
    ['unknown condition in goal', { ...WATCHTOWER, goals: [{ id: 'g', active: { has: 'sword' }, done: { has: 'map' } }] }, false],
    ['unknown condition in goal done', { ...WATCHTOWER, goals: [{ id: 'g', active: { has: 'map' }, done: { has: 'sword' } }] }, false],
    ['unknown condition in chapter', { ...WATCHTOWER, chapters: [{ id: 'c', done: { has: 'sword' } }] }, false],
    ['unknown condition in ending', { ...WATCHTOWER, endings: [{ id: 'e', when: { has: 'sword' } }] }, false],
    ['unknown condition in onEnter', { ...WATCHTOWER, scenes: WATCHTOWER.scenes.map((s) => ({ ...s, onEnter: [{ when: { has: 'sword' } }] })) }, false],
    ['bad effect in combination', { ...WATCHTOWER, combinations: [{ items: ['rope', 'hook'], rules: [{ then: [{ give: 'sword' }] }] }] }, false],
    ['bad effect in deduction', { ...WATCHTOWER, deductions: [{ clues: ['shifts', 'ledger-dates'], rules: [{ then: [{ learn: 'x' }] }] }] }, false],
    ['bad option condition', { ...WATCHTOWER, dialogues: [...WATCHTOWER.dialogues, { id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: null }, { id: 'p', when: { has: 'sword' }, next: null }] }] }] }, false],
    ['bad option effect', { ...WATCHTOWER, dialogues: [...WATCHTOWER.dialogues, { id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: null, then: [{ give: 'sword' }] }] }] }] }, false],
    ['option starts a dialogue', { ...WATCHTOWER, dialogues: [...WATCHTOWER.dialogues, { id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: null, then: [{ dialogue: 'd' }] }] }] }] }, false],
    ['option set flag', { ...WATCHTOWER, dialogues: [...WATCHTOWER.dialogues, { id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: null, then: [{ set: 'keeper-mood', to: 1 }] }] }] }] }, true],
    ['duplicate option', { ...WATCHTOWER, dialogues: [...WATCHTOWER.dialogues, { id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: null }, { id: 'o', next: null }] }] }] }, false],
    ['duplicate node', { ...WATCHTOWER, dialogues: [...WATCHTOWER.dialogues, { id: 'd', nodes: [{ id: 'n', options: [{ id: 'o', next: null }] }, { id: 'n', options: [{ id: 'o', next: null }] }] }] }, false],
    ['bad scene id', { ...WATCHTOWER, scenes: [...WATCHTOWER.scenes, { id: 'Bad', region: 'r', hotspots: [] }] }, false]
  ])('%s → %s', (_, adv, ok) => {
    expect(errorOf(adv) === '').toBe(ok);
  });

  it.each(['scene', 'dialogue', 'goal', 'chapter', 'ending', 'clue'])('names the kind of a duplicate %s', (kind) => {
    const key = `${kind}s` as 'scenes';
    const list = WATCHTOWER[key] as readonly { id: string }[];
    const dup = { ...WATCHTOWER, [key]: [...list, list[0]] } as unknown as Adventure;
    expect(errorOf(dup)).toContain(`duplicate ${kind} id "${list[0]?.id}"`);
  });

  it('lists all problems, one per line', () => {
    const msg = errorOf({ ...WATCHTOWER, id: 'X', contentVersion: 0 });
    expect(msg).toBe('Invalid adventure "X":\n- adventure id "X" is not a valid id\n- contentVersion must be a positive integer');
  });
});

describe('isValidAdventureState: more cases', () => {
  const base = (): AdventureState => play(WALKTHROUGH.slice(0, 3));
  it('accepts dialogue keys in any order and a full log', () => {
    const s = base();
    expect(isValidAdventureState(C(), { ...s, dialogue: { node: s.dialogue?.node, id: s.dialogue?.id } })).toBe(true);
    expect(isValidAdventureState(C(), { ...s, log: Array.from({ length: 50 }, () => 'scene.yard.name') })).toBe(true);
  });

  it.each<[string, (s: AdventureState) => unknown]>([
    ['dialogue id not a string', (s) => ({ ...s, dialogue: { id: 1, node: 'hello' } })],
    ['dialogue not an object', (s) => ({ ...s, dialogue: 'keeper' })],
    ['a bad key after a good one', (s) => ({ ...s, log: ['scene.yard.name', '<b>'] })],
    ['key with a bad prefix', (s) => ({ ...s, log: ['<b>scene.yard.name'] })],
    ['key with a bad suffix', (s) => ({ ...s, log: ['scene.yard.name<b>'] })],
    ['non-string log entry', (s) => ({ ...s, log: [1] })],
    ['scene not a string', (s) => ({ ...s, scene: 1 })],
    ['flags not an object', (s) => ({ ...s, flags: [] })],
    ['hints not an object', (s) => ({ ...s, hints: null })],
    ['items not an array', (s) => ({ ...s, items: 'rope' })],
    ['too many visited', (s) => ({ ...s, visited: ['yard', 'cellar', 'tower', 'yard'] })],
    ['selected not a string', (s) => ({ ...s, selected: 1 })],
    ['ended not a string', (s) => ({ ...s, ended: 1, dialogue: null })]
  ])('rejects %s', (_, mutate) => {
    expect(isValidAdventureState(C(), mutate(base()))).toBe(false);
  });
});

describe('canonicalJson and stateHash: exact values', () => {
  it('sorts keys inside arrays and separates elements', () => {
    expect(canonicalJson([{ d: 2, c: 1 }, 'x'])).toBe('[{"c":1,"d":2},"x"]');
    expect(canonicalJson({ b: [1, 2], a: null })).toBe('{"a":null,"b":[1,2]}');
  });

  it('is FNV-1a over the canonical JSON', () => {
    expect(stateHash({} as AdventureState)).toBe(1415952421);
    expect(stateHash({ a: 1 } as unknown as AdventureState)).toBe(stateHash({ a: 1 } as unknown as AdventureState));
    expect(stateHash({ a: 1 } as unknown as AdventureState)).not.toBe(stateHash({ a: 2 } as unknown as AdventureState));
  });
});

describe('textKeys: exact order', () => {
  it('starts with the scenes and lists every kind of key', () => {
    const keys = textKeys(WATCHTOWER);
    expect(keys.slice(0, 6)).toEqual(['scene.yard.name', 'scene.yard.desc', 'scene.yard.enter.0', 'scene.yard.enter.1', 'hs.yard.rope.name', 'hs.yard.rope.desc']);
    for (const k of ['item.rope.name', 'item.rope.desc', 'clue.shifts', 'combo.hook.rope.0', 'deduce.ledger-dates.shifts.0', 'dlg.keeper.hello', 'dlg.keeper.hello.bye', 'goal.reach-window.title', 'goal.reach-window.hint.1', 'chapter.below', 'ending.map-found', 'hs.yard.keeper.clue.gate-unwatched.1', 'hs.yard.window.item.grapnel.0'])
      expect(keys).toContain(k);
    expect(keys).toHaveLength(new Set(keys).size);
  });
});
