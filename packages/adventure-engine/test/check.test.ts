import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { available, compile, initialState, step, textKeys, type Action, type Adventure, type AdventureState, type Scene } from '../src';
import { abstractOf, checkAdventure, explore, keyOf, moves, pathTo, startState } from '../src/check';
import { C, WALKTHROUGH, WATCHTOWER } from './fixture';

const errorsOf = (adv: Adventure, opts = {}): string[] => checkAdventure(adv, opts).errors;
const withScene = (id: string, patch: (s: Scene) => Scene): Adventure => ({ ...WATCHTOWER, scenes: WATCHTOWER.scenes.map((s) => (s.id === id ? patch(s) : s)) });
const texts = (locales: readonly string[]): Record<string, Record<string, string>> =>
  Object.fromEntries(locales.map((l) => [l, Object.fromEntries(textKeys(WATCHTOWER).map((k) => [k, `${l}:${k}`]))]));

describe('checkAdventure: the fixture', () => {
  it('passes with one warning; the golden walkthrough is a shortest solution', () => {
    const r = checkAdventure(WATCHTOWER, { texts: texts(['en', 'de']) });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual(['flag "keeper-mood" is never read']);
    expect(r.metrics).toMatchObject({ shortestSolution: WALKTHROUGH.length, endings: { 'map-found': WALKTHROUGH.length } });
    expect(r.metrics.states).toBeGreaterThan(100);
    expect(r.metrics.edges).toBeGreaterThan(r.metrics.states);
  });

  it("the checker's shortest solution replayed through the real engine reaches the ending", () => {
    const x = explore(C(), 200_000);
    const end = x.states.findIndex((s) => s.ended !== null);
    const final = pathTo(x, end).reduce((s, a) => {
      const r = step(C(), s, a);
      expect(r.out.ok, JSON.stringify(a)).toBe(true);
      return r.state;
    }, initialState(C(), 1));
    expect(final.ended).toBe('map-found');
  });
});

describe('checkAdventure: broken content is reported', () => {
  it.each<[string, Adventure, string]>([
    ['a dead end (tower without a way back)', withScene('tower', (s) => ({ ...s, hotspots: s.hotspots.filter((h) => h.id !== 'ladder') })), 'dead end: '],
    ['an unreachable ending', { ...WATCHTOWER, endings: [...WATCHTOWER.endings, { id: 'never', when: { all: [{ has: 'map' }, { used: 'map' }] } }] }, 'ending "never" is unreachable'],
    ['an unreachable scene', { ...WATCHTOWER, scenes: [...WATCHTOWER.scenes, { id: 'attic', region: 'r', hotspots: [] }] }, 'scene "attic" is unreachable'],
    ['an item that is never given', { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: 'coin' }] }, 'item "coin" is never given'],
    ['an item that can never be obtained', { ...withScene('cellar', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'coin', shape: { x: 0, y: 0, w: 120, h: 120 }, visible: { has: 'map' }, on: { take: [{ then: [{ give: 'coin' }] }] } }] })), items: [...WATCHTOWER.items, { id: 'coin' }] }, 'item "coin" can never be obtained'],
    ['a hotspot rule hidden behind the ending', withScene('cellar', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'coin', shape: { x: 0, y: 0, w: 120, h: 120 }, visible: { has: 'map' }, on: { take: [{}] } }] })), 'never shown: "hs.cellar.coin.take.0"'],
    ['a clue that is never learned', { ...WATCHTOWER, clues: [...WATCHTOWER.clues, { id: 'rumour' }] }, 'clue "rumour" is never learned'],
    ['a rule that can never fire', withScene('yard', (s) => ({ ...s, hotspots: s.hotspots.map((h) => (h.id === 'stair' ? { ...h, on: { use: [{}, { then: [{ go: 'cellar' }] }] } } : h)) })), 'never shown: "hs.yard.stair.use.1"'],
    ['a state without an open goal', { ...WATCHTOWER, goals: WATCHTOWER.goals.filter((g) => g.id !== 'explore') }, 'no open goal (so no hint) after: (start)'],
    ['a flag that is never set', { ...WATCHTOWER, flags: { ...WATCHTOWER.flags, unused: { max: 1 } } }, 'flag "unused" is never set'],
    ['a dialogue node that cannot be reached', { ...WATCHTOWER, dialogues: WATCHTOWER.dialogues.map((d) => ({ ...d, nodes: [...d.nodes, { id: 'orphan', options: [{ id: 'x', next: null }] }] })) }, 'dialogue keeper/orphan cannot be reached'],
    ['a hotspot outside the view box', withScene('yard', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'far', shape: { x: 1550, y: 0, w: 120, h: 120 }, on: { use: [{}] } }] })), 'hotspot yard/far: outside the 1600×900 view box'],
    ['a polygon with two points', withScene('yard', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'line', shape: { points: [[0, 0], [200, 200]] }, on: { use: [{}] } }] })), 'hotspot yard/line: a polygon needs at least 3 points'],
    ['invalid content', { ...WATCHTOWER, start: { scene: 'moon' } }, 'start scene "moon" is unknown']
  ])('%s', (_, adv, message) => {
    expect(errorsOf(adv).join('\n')).toContain(message);
  });

  it('reports the shortest way into a dead end', () => {
    const adv = withScene('tower', (s) => ({ ...s, hotspots: s.hotspots.filter((h) => h.id !== 'ladder') }));
    const dead = errorsOf(adv).find((e) => e.startsWith('dead end'));
    expect(dead).toContain('{"a":"use","hs":"window"}');
    expect(dead).not.toContain('chest-key');
  });

  it('stops at the state budget and says so (without claiming dead ends)', () => {
    const r = checkAdventure(WATCHTOWER, { budget: 20 });
    expect(r.errors[0]).toBe('state budget exceeded: more than 20 reachable states — split the content into chapters or simplify a puzzle');
    expect(r.errors.some((e) => e.startsWith('dead end'))).toBe(false);
    expect(r.metrics.states).toBe(20);
  });

  it('warns about tiny hotspots and unused items, without failing', () => {
    const adv = withScene('yard', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'pebble', shape: { x: 0, y: 0, w: 40, h: 300 }, on: { take: [{ then: [{ give: 'pebble' }] }] } }] }));
    const r = checkAdventure({ ...adv, items: [...adv.items, { id: 'pebble' }] });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toContain('hotspot yard/pebble: smaller than 110×110 (the renderer pads its hit area)');
    expect(r.warnings).toContain('item "pebble" is never used');
  });

  it('checks texts: missing, empty, unused and placeholder mismatches per locale', () => {
    const t = texts(['en', 'de']);
    t.en = { ...t.en, 'clue.shifts': 'Shift {n}' };
    t.de = { ...t.de, 'clue.shifts': 'Schicht {m}', 'item.rope.name': ' ', extra: 'x' };
    delete t.de['ending.map-found'];
    expect(errorsOf(WATCHTOWER, { texts: t })).toEqual([
      'de: missing text "item.rope.name"',
      'de: placeholders of "clue.shifts" differ from the reference',
      'de: missing text "ending.map-found"',
      'de: unused text "extra"'
    ]);
  });

  it('uses the first locale as reference when there is no English catalogue', () => {
    const t = { de: { ...texts(['de']).de, 'clue.shifts': 'Schicht {n}' }, fr: { ...texts(['fr']).fr, 'clue.shifts': 'Équipe' } };
    expect(errorsOf(WATCHTOWER, { texts: t })).toEqual(['fr: placeholders of "clue.shifts" differ from the reference']);
  });
});

describe('the independent interpreter agrees with the engine', () => {
  const pairKey = (a: Action): string =>
    a.a === 'combine' || a.a === 'deduce' ? JSON.stringify({ a: a.a, pair: [a.x, a.y].sort() }) : JSON.stringify(a);
  const agree = (s: AdventureState): void => {
    const abs = abstractOf(s);
    const interp = new Map(moves(C(), abs).map((m) => [pairKey(m.action), keyOf(m.next)]));
    const seen = new Set<string>();
    for (const a of available(C(), s)) {
      if (a.a === 'select' || a.a === 'hint') continue;
      const r = step(C(), s, a);
      const k = pairKey(a);
      const silentExamine = a.a === 'examine' && interp.get(k) === undefined && r.out.ok && keyOf(abstractOf(r.state)) === keyOf(abs);
      if (silentExamine) continue;
      expect(interp.get(k), `${k} in ${keyOf(abs)}`).toBe(r.out.ok ? keyOf(abstractOf(r.state)) : undefined);
      seen.add(k);
    }
    for (const k of interp.keys()) expect(seen.has(k), `interpreter-only move ${k}`).toBe(true);
  };

  it('on the start state', () => {
    expect(keyOf(startState(C()).state)).toBe(keyOf(abstractOf(initialState(C(), 1))));
    agree(initialState(C(), 1));
  });

  it('along the walkthrough', () => {
    WALKTHROUGH.reduce((s, a) => {
      agree(s);
      return step(C(), s, a).state;
    }, initialState(C(), 1));
  });

  it('on random walks', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(10_000), { maxLength: 30 }), (choices) => {
        let s = initialState(C(), 1);
        for (const k of choices) {
          agree(s);
          const opts = available(C(), s);
          if (opts.length === 0) break;
          s = step(C(), s, opts[k % opts.length] as Action).state;
        }
      }),
      { numRuns: 60 }
    );
  });

  it('on content with loops and multiple chapters', () => {
    const c = compile({
      ...withScene('cellar', (s) => ({ ...s, onEnter: [{ when: { not: { has: 'hook' } }, then: [{ go: 'yard' }] }, {}] })),
      chapters: [{ id: 'one', done: { visited: 'yard' } }, { id: 'two', done: { has: 'rope' } }, { id: 'three', done: { has: 'map' } }]
    });
    for (const s of [initialState(c, 1), step(c, initialState(c, 1), { a: 'take', hs: 'rope' }).state]) {
      expect(keyOf(abstractOf(s))).toBe(keyOf(abstractOf(s)));
      const interp = moves(c, abstractOf(s));
      for (const m of interp) {
        const r = step(c, s, m.action);
        expect(r.out.ok).toBe(true);
        expect(keyOf(abstractOf(r.state))).toBe(keyOf(m.next));
      }
    }
  });
});

describe('checkAdventure: exact boundaries', () => {
  const extra = (shape: object): Adventure => withScene('yard', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'probe', shape, on: { use: [{}] } } as Scene['hotspots'][number]] }));
  const geometry = (shape: object): { errors: string[]; warnings: string[] } => {
    const r = checkAdventure(extra(shape));
    return { errors: r.errors.filter((e) => e.includes('probe')), warnings: r.warnings.filter((w) => w.includes('probe')) };
  };

  it.each<[string, object, boolean, boolean]>([
    ['the whole view box', { x: 0, y: 0, w: 1600, h: 900 }, false, false],
    ['x below 0', { x: -1, y: 0, w: 200, h: 200 }, true, false],
    ['y below 0', { x: 0, y: -1, w: 200, h: 200 }, true, false],
    ['right edge beyond', { x: 1401, y: 0, w: 200, h: 200 }, true, false],
    ['bottom edge beyond', { x: 0, y: 701, w: 200, h: 200 }, true, false],
    ['exactly 110 × 110', { x: 500, y: 500, w: 110, h: 110 }, false, false],
    ['109 wide', { x: 500, y: 500, w: 109, h: 200 }, false, true],
    ['109 high', { x: 500, y: 500, w: 200, h: 109 }, false, true],
    ['polygon of 110 × 110', { points: [[500, 500], [610, 500], [500, 610]] }, false, false],
    ['narrow polygon', { points: [[500, 500], [600, 500], [500, 700]] }, false, true],
    ['polygon off to the right', { points: [[1500, 0], [1700, 0], [1600, 200]] }, true, false]
  ])('%s', (_, shape, isError, isWarning) => {
    const g = geometry(shape);
    expect(g.errors.length > 0).toBe(isError);
    expect(g.warnings.length > 0).toBe(isWarning);
  });

  it('flags written only by add, and read only inside not/any/all, count as used', () => {
    const adv: Adventure = {
      ...withScene('yard', (s) => ({
        ...s,
        hotspots: [
          ...s.hotspots,
          { id: 'probe', shape: { x: 0, y: 0, w: 200, h: 200 }, visible: { any: [{ not: { all: [{ flag: 'keeper-mood' }, { flag: 'only-added' }] } }] }, on: { use: [{ then: [{ add: 'only-added', by: 1 }] }] } }
        ]
      })),
      flags: { ...WATCHTOWER.flags, 'only-added': { max: 1 } }
    };
    const r = checkAdventure(adv);
    expect(r.errors.join('\n')).not.toContain('only-added');
    expect(r.warnings).toEqual([]);
  });

  it('items count as used through conditions, hotspot uses or combinations; start items need no giver', () => {
    const base = { ...WATCHTOWER, items: [...WATCHTOWER.items, { id: 'coin' }], start: { scene: 'yard', items: ['coin'] } };
    expect(checkAdventure(base).warnings).toContain('item "coin" is never used');
    const byCond = withScene('yard', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'probe', shape: { x: 0, y: 0, w: 200, h: 200 }, on: { use: [{ when: { used: 'coin' } }, {}] } }] }));
    expect(checkAdventure({ ...byCond, items: base.items, start: base.start }).warnings).not.toContain('item "coin" is never used');
    const byHotspot = withScene('yard', (s) => ({ ...s, hotspots: s.hotspots.map((h) => (h.id === 'keeper' ? { ...h, items: { coin: [{}] } } : h)) }));
    expect(checkAdventure({ ...byHotspot, items: base.items, start: base.start }).warnings).not.toContain('item "coin" is never used');
    const byCombo = { ...base, combinations: [...WATCHTOWER.combinations, { items: ['coin', 'map'] as [string, string], rules: [{}] }] };
    const r = checkAdventure(byCombo);
    expect(r.warnings).not.toContain('item "coin" is never used');
    expect(r.errors.join('\n')).not.toContain('"coin" is never given');
  });

  it('two endings: metrics report each path length and the shorter one as solution', () => {
    const adv: Adventure = { ...WATCHTOWER, endings: [{ id: 'early', when: { has: 'grapnel' } }, ...WATCHTOWER.endings] };
    const r = checkAdventure(adv);
    expect(r.metrics.endings).toEqual({ early: 4, 'map-found': -1 });
    expect(r.errors).toContain('ending "map-found" is unreachable');
    expect(r.metrics.shortestSolution).toBe(4);
  });

  it('the dead-end message names the number of stuck states and joins the path with arrows', () => {
    const adv = withScene('tower', (s) => ({ ...s, hotspots: s.hotspots.filter((h) => h.id !== 'ladder') }));
    const x = explore(compile(adv), 200_000);
    const stuck = x.states.filter((s) => s.ended === null && s.scene === 'tower' && !s.items.includes('chest-key')).length;
    const dead = errorsOf(adv).find((e) => e.startsWith('dead end')) ?? '';
    expect(dead).toMatch(new RegExp(`^dead end: ${stuck} reachable state\\(s\\) can no longer reach an ending; shortest way into one: \\{.*\\} → \\{`));
    expect(dead.endsWith('{"a":"use","hs":"window"}')).toBe(true);
  });

  it('reports clues that can never be learned and goals that are never done', () => {
    const adv: Adventure = {
      ...withScene('tower', (s) => ({ ...s, hotspots: [...s.hotspots, { id: 'note', shape: { x: 0, y: 0, w: 200, h: 200 }, visible: { has: 'map' }, on: { examine: [{ then: [{ learn: 'secret' }] }] } }] })),
      clues: [...WATCHTOWER.clues, { id: 'secret' }],
      goals: [...WATCHTOWER.goals, { id: 'never', active: { in: 'tower' }, done: { knows: 'secret' } }]
    };
    const r = checkAdventure(adv);
    expect(r.errors).toContain('clue "secret" can never be learned');
    expect(r.warnings).toContain('goal "never" is never done');
  });

  it('states inside a dialogue need no open goal', () => {
    const adv: Adventure = { ...WATCHTOWER, goals: WATCHTOWER.goals.map((g) => (g.id === 'explore' ? { ...g, active: { all: [{ not: { visited: 'cellar' } }, { not: { knows: 'shifts' } }] } } : g)) };
    const r = checkAdventure(adv);
    expect(r.errors.find((e) => e.startsWith('no open goal'))).toContain('{"a":"choose","option":"thanks"}');
  });

  it('texts: a key missing in the reference skips the placeholder comparison', () => {
    const t = texts(['en', 'de']);
    delete (t.en as Record<string, string>)['clue.shifts'];
    t.de = { ...t.de, 'clue.shifts': 'Schicht {n}' };
    expect(errorsOf(WATCHTOWER, { texts: t })).toEqual(['en: missing text "clue.shifts"']);
  });

  it('placeholders are compared as sets', () => {
    const t = texts(['en', 'de']);
    t.en = { ...t.en, 'clue.shifts': '{a} and {b}' };
    t.de = { ...t.de, 'clue.shifts': '{b} und {a}' };
    expect(errorsOf(WATCHTOWER, { texts: t })).toEqual([]);
    t.de = { ...t.de, 'clue.shifts': '{ab}' };
    expect(errorsOf(WATCHTOWER, { texts: t })).toEqual(['de: placeholders of "clue.shifts" differ from the reference']);
  });

  it('invalid content gives one error and empty metrics', () => {
    expect(checkAdventure({ ...WATCHTOWER, endings: [] })).toEqual({
      errors: ['Invalid adventure "watchtower":\n- an adventure needs at least one ending'],
      warnings: [],
      metrics: { states: 0, edges: 0, shortestSolution: -1, endings: {} }
    });
  });

  it('a scene key and a rule key that look alike are told apart (coverage of onEnter rules)', () => {
    const adv = withScene('cellar', (s) => ({ ...s, onEnter: [{ when: { has: 'map' } }, {}] }));
    expect(errorsOf(adv)).toContain('never shown: "scene.cellar.enter.0" (its rule, option or chapter can never fire)');
  });
});
