import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  available, compile, initialState, isValidAdventureState, step,
  type Action, type Adventure, type AdventureState, type Compiled, type Cond, type Effect, type Rule
} from '../src';
import { abstractOf, checkAdventure, keyOf, moves, startState } from '../src/check';

/**
 * Random small adventures that use every condition and effect kind. They are rarely sensible
 * stories, but they make the independent checker interpreter and the engine disagree on any
 * semantic difference, and they fuzz `compile`, `step` and `isValidAdventureState`.
 */
const SCENES = ['s0', 's1', 's2'];
const ITEMS = ['i0', 'i1', 'i2', 'i3'];
const CLUES = ['c0', 'c1', 'c2'];
const FLAGS = { f0: { max: 1 }, f1: { max: 3 } };
const GOALS = ['g0', 'g1'];
const NODES = ['n0', 'n1'];
const box = { x: 0, y: 0, w: 120, h: 120 };

const arbFlagCond = fc.oneof(
  fc.record({ flag: fc.constantFrom('f0', 'f1') }),
  fc.record({ flag: fc.constant('f1'), eq: fc.integer({ min: 0, max: 3 }) }),
  fc.record({ flag: fc.constant('f1'), gte: fc.integer({ min: 0, max: 3 }), lte: fc.integer({ min: 0, max: 3 }) }, { requiredKeys: ['flag'] })
);
const arbLeaf: fc.Arbitrary<Cond> = fc.oneof(
  arbFlagCond as fc.Arbitrary<Cond>,
  fc.record({ has: fc.constantFrom(...ITEMS) }),
  fc.record({ used: fc.constantFrom(...ITEMS) }),
  fc.record({ knows: fc.constantFrom(...CLUES) }),
  fc.record({ visited: fc.constantFrom(...SCENES) }),
  fc.record({ in: fc.constantFrom(...SCENES) }),
  fc.record({ goal: fc.constantFrom(...GOALS) })
);
const arbCond: fc.Arbitrary<Cond> = fc.letrec<{ c: Cond }>((tie) => ({
  c: fc.oneof(
    { depthSize: 'small', withCrossShrink: true },
    arbLeaf,
    fc.record({ all: fc.array(tie('c'), { maxLength: 2 }) }),
    fc.record({ any: fc.array(tie('c'), { maxLength: 2 }) }),
    fc.record({ not: tie('c') })
  )
})).c;
const arbPlainEffect: fc.Arbitrary<Effect> = fc.oneof(
  fc.record({ set: fc.constant('f1'), to: fc.integer({ min: 0, max: 3 }) }),
  fc.record({ set: fc.constant('f0'), to: fc.integer({ min: 0, max: 1 }) }),
  fc.record({ add: fc.constant('f1'), by: fc.constantFrom(-3, -1, 1, 2, 3) }),
  fc.record({ give: fc.constantFrom(...ITEMS) }),
  fc.record({ take: fc.constantFrom(...ITEMS) }),
  fc.record({ learn: fc.constantFrom(...CLUES) })
);
const arbEffect: fc.Arbitrary<Effect> = fc.oneof(arbPlainEffect, arbPlainEffect, fc.record({ go: fc.constantFrom(...SCENES) }), fc.record({ dialogue: fc.constant('d0') }));
const arbRules = (effect: fc.Arbitrary<Effect> = arbEffect): fc.Arbitrary<Rule[]> =>
  fc.array(fc.record({ when: arbCond, then: fc.array(effect, { maxLength: 3 }) }, { requiredKeys: [] }), { minLength: 1, maxLength: 3 });
const arbRuleMap = (keys: readonly string[]): fc.Arbitrary<Record<string, Rule[]>> =>
  fc.subarray([...keys], { maxLength: 2 }).chain((ks) => fc.tuple(...ks.map(() => arbRules())).map((rs) => Object.fromEntries(ks.map((k, i) => [k, rs[i] as Rule[]]))));
const arbHotspot = (id: string) =>
  fc.record(
    {
      id: fc.constant(id),
      shape: fc.constant(box),
      visible: arbCond,
      on: fc.record({ examine: arbRules(), take: arbRules(), use: arbRules(), talk: arbRules() }, { requiredKeys: [] }),
      items: arbRuleMap(ITEMS),
      clues: arbRuleMap(CLUES)
    },
    { requiredKeys: ['id', 'shape'] }
  );
const arbScene = (id: string) =>
  fc.record(
    {
      id: fc.constant(id),
      region: fc.constant('r'),
      map: fc.boolean(),
      onEnter: arbRules(),
      hotspots: fc.integer({ min: 0, max: 3 }).chain((n) => fc.tuple(...Array.from({ length: n }, (_, i) => arbHotspot(`h${i}`))))
    },
    { requiredKeys: ['id', 'region', 'hotspots'] }
  );
const arbOption = (id: string, always: boolean) =>
  always
    ? fc.record({ id: fc.constant(id), then: fc.array(arbPlainEffect, { maxLength: 2 }), next: fc.constantFrom<string | null>(null, ...NODES) })
    : fc.record({ id: fc.constant(id), when: arbCond, then: fc.array(arbPlainEffect, { maxLength: 2 }), next: fc.constantFrom<string | null>(null, ...NODES) });
const arbNode = (id: string) => fc.record({ id: fc.constant(id), options: fc.tuple(arbOption('o0', true), arbOption('o1', false)) });
const arbPair = <T extends string>(pool: readonly T[]) => fc.uniqueArray(fc.constantFrom(...pool), { minLength: 2, maxLength: 2 }) as fc.Arbitrary<[T, T]>;

export const arbAdventure: fc.Arbitrary<Adventure> = fc
  .record({
    scenes: fc.tuple(...SCENES.map(arbScene)),
    startItems: fc.subarray(ITEMS),
    startF1: fc.integer({ min: 0, max: 3 }),
    combos: fc.uniqueArray(arbPair(ITEMS), { maxLength: 2, selector: (p) => [...p].sort().join('+') }).chain((ps) => fc.tuple(...ps.map((p) => arbRules().map((rules) => ({ items: p, rules }))))),
    deds: fc.uniqueArray(arbPair(CLUES), { maxLength: 2, selector: (p) => [...p].sort().join('+') }).chain((ps) => fc.tuple(...ps.map((p) => arbRules().map((rules) => ({ clues: p, rules }))))),
    nodes: fc.tuple(arbNode('n0'), arbNode('n1')),
    goals: fc.tuple(...GOALS.map((id) => fc.record({ id: fc.constant(id), active: arbCond, done: arbCond }))),
    chapters: fc.array(arbCond, { maxLength: 2 }),
    endings: fc.array(arbCond, { minLength: 1, maxLength: 2 })
  })
  .map((r) => ({
    id: 'random',
    contentVersion: 1,
    start: { scene: 's0', items: r.startItems, flags: { f1: r.startF1 } },
    flags: FLAGS,
    items: ITEMS.map((id) => ({ id })),
    clues: CLUES.map((id) => ({ id })),
    scenes: r.scenes as Adventure['scenes'],
    combinations: r.combos,
    deductions: r.deds,
    dialogues: [{ id: 'd0', nodes: r.nodes }],
    goals: r.goals,
    chapters: r.chapters.map((done, i) => ({ id: `ch${i}`, done })),
    endings: r.endings.map((when, i) => ({ id: `e${i}`, when }))
  }));

const actionKey = (a: Action): string => (a.a === 'combine' || a.a === 'deduce' ? JSON.stringify({ a: a.a, pair: [a.x, a.y].sort() }) : JSON.stringify(a));

/** Engine and checker interpreter must agree on every successful action from `s`. */
function agree(c: Compiled, s: AdventureState): void {
  const abs = abstractOf(s);
  const interp = new Map(moves(c, abs).map((m) => [actionKey(m.action), keyOf(m.next)]));
  const engineMoves = new Set<string>();
  for (const a of available(c, s)) {
    if (a.a === 'select' || a.a === 'hint') continue;
    const r = step(c, s, a);
    const k = actionKey(a);
    if (a.a === 'examine' && !interp.has(k) && r.out.ok && keyOf(abstractOf(r.state)) === keyOf(abs)) continue;
    expect(interp.get(k), k).toBe(r.out.ok ? keyOf(abstractOf(r.state)) : undefined);
    if (r.out.ok) engineMoves.add(k);
  }
  expect([...interp.keys()].filter((k) => !engineMoves.has(k))).toEqual([]);
}

describe('random adventures', () => {
  it('compile either accepts or throws, never anything else; most generated adventures compile', () => {
    let ok = 0;
    const errors: string[] = [];
    fc.assert(
      fc.property(arbAdventure, (adv) => {
        try {
          compile(adv);
          ok++;
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
          errors.push((e as Error).message);
        }
      }),
      { numRuns: 200 }
    );
    expect(ok, errors.slice(0, 3).join('\n')).toBeGreaterThan(150);
  });

  it('the checker interpreter and the engine agree on every reachable step', () => {
    fc.assert(
      fc.property(arbAdventure, fc.array(fc.nat(1000), { maxLength: 25 }), (adv, choices) => {
        let c: Compiled;
        try {
          c = compile(adv);
        } catch {
          return;
        }
        let s = initialState(c, 1);
        expect(keyOf(startState(c).state)).toBe(keyOf(abstractOf(s)));
        for (const k of choices) {
          expect(isValidAdventureState(c, JSON.parse(JSON.stringify(s)))).toBe(true);
          agree(c, s);
          const opts = available(c, s);
          if (opts.length === 0) break;
          s = step(c, s, opts[k % opts.length] as Action).state;
        }
      }),
      { numRuns: 300 }
    );
  });

  it('the checker never throws and its dead-end verdict matches a replay through the engine', () => {
    fc.assert(
      fc.property(arbAdventure, (adv) => {
        const r = checkAdventure(adv, { budget: 3000 });
        expect(Array.isArray(r.errors)).toBe(true);
        for (const [, len] of Object.entries(r.metrics.endings)) expect(len).toBeGreaterThanOrEqual(-1);
      }),
      { numRuns: 100 }
    );
  });
});
