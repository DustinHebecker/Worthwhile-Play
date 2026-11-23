import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { available, canonicalJson, initialState, isValidAdventureState, stateHash, step, type Action, type AdventureState } from '../src';
import { C, WALKTHROUGH } from './fixture';

/**
 * Random walks over `available()` (docs/design/adventures.md § 5.3). A walk is a list of choice
 * indices; each picks one of the actions available at that point, so every walk is legal.
 */
const arbWalk = fc.array(fc.nat(10_000), { maxLength: 40 });
const walk = (choices: readonly number[], seed = 1): { states: AdventureState[]; actions: Action[] } => {
  let s = initialState(C(), seed);
  const states = [s];
  const actions: Action[] = [];
  for (const k of choices) {
    const opts = available(C(), s);
    if (opts.length === 0) break;
    const a = opts[k % opts.length] as Action;
    actions.push(a);
    s = step(C(), s, a).state;
    states.push(s);
  }
  return { states, actions };
};
const replay = (actions: readonly Action[], s: AdventureState): AdventureState => actions.reduce((st, a) => step(C(), st, a).state, s);
/** The state without display-only fields: what P8 calls the world. */
const world = (s: AdventureState): string => canonicalJson({ ...s, log: [], actions: 0, hints: {}, selected: null });
const RUNS = { numRuns: 200 };
const arbJunkAction = fc.oneof(
  fc.anything(),
  fc.record({ a: fc.constantFrom('examine', 'take', 'use', 'talk', 'useItem', 'present', 'combine', 'deduce', 'choose', 'travel', 'select', 'hint'), hs: fc.string(), item: fc.option(fc.string()), x: fc.string(), y: fc.string() }, { requiredKeys: ['a'] })
);

describe('engine properties', () => {
  it('P1 determinism: same content + seed + actions ⇒ same hash', () => {
    fc.assert(
      fc.property(arbWalk, fc.nat(), (choices, seed) => {
        const { states, actions } = walk(choices, seed);
        expect(stateHash(replay(actions, initialState(C(), seed)))).toBe(stateHash(states.at(-1) as AdventureState));
      }),
      RUNS
    );
  });

  it('P2 purity: step never mutates its input state', () => {
    fc.assert(
      fc.property(arbWalk, fc.nat(10_000), (choices, k) => {
        const s = walk(choices).states.at(-1) as AdventureState;
        const before = canonicalJson(s);
        const opts = available(C(), s);
        if (opts.length > 0) step(C(), s, opts[k % opts.length] as Action);
        expect(canonicalJson(s)).toBe(before);
      }),
      RUNS
    );
  });

  it('P3 resume anywhere: continuing from a JSON copy equals continuing in memory', () => {
    fc.assert(
      fc.property(arbWalk, fc.nat(40), (choices, split) => {
        const { states, actions } = walk(choices);
        const cut = Math.min(split, actions.length);
        const restored = JSON.parse(JSON.stringify(states[cut])) as unknown;
        expect(isValidAdventureState(C(), restored)).toBe(true);
        expect(stateHash(replay(actions.slice(cut), restored as AdventureState))).toBe(stateHash(states.at(-1) as AdventureState));
      }),
      RUNS
    );
  });

  it('P4 totality: any input action returns an outcome; a refusal leaves the state unchanged', () => {
    fc.assert(
      fc.property(arbWalk, arbJunkAction, (choices, junk) => {
        const s = walk(choices).states.at(-1) as AdventureState;
        const r = step(C(), s, junk as Action);
        if (!r.out.ok) expect(r.state).toBe(s);
      }),
      RUNS
    );
  });

  it('P5 validity: every reachable state is valid; junk never throws', () => {
    fc.assert(
      fc.property(arbWalk, (choices) => {
        for (const s of walk(choices).states) expect(isValidAdventureState(C(), JSON.parse(JSON.stringify(s)))).toBe(true);
      }),
      RUNS
    );
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(isValidAdventureState(C(), v)).toBe(false);
      }),
      { numRuns: 300 }
    );
  });

  it('P6 item conservation: every item is in at most one place, used items never return', () => {
    fc.assert(
      fc.property(arbWalk, (choices) => {
        const { states } = walk(choices);
        for (let i = 0; i < states.length; i++) {
          const s = states[i] as AdventureState;
          expect(new Set([...s.items, ...s.used]).size).toBe(s.items.length + s.used.length);
          if (i > 0) for (const u of (states[i - 1] as AdventureState).used) expect(s.used).toContain(u);
        }
      }),
      RUNS
    );
  });

  it('P7 symmetry: combine and deduce do not depend on the order of the pair', () => {
    fc.assert(
      fc.property(arbWalk, (choices) => {
        const s = walk(choices).states.at(-1) as AdventureState;
        for (const a of available(C(), s)) {
          if (a.a !== 'combine' && a.a !== 'deduce') continue;
          const swapped = { ...a, x: a.y, y: a.x };
          expect(canonicalJson(step(C(), s, swapped).state)).toBe(canonicalJson(step(C(), s, a).state));
        }
      }),
      { numRuns: 100 }
    );
  });

  it('P8 free actions: select and hint never change the world', () => {
    fc.assert(
      fc.property(arbWalk, (choices) => {
        const s = walk(choices).states.at(-1) as AdventureState;
        for (const a of available(C(), s)) if (a.a === 'select' || a.a === 'hint') expect(world(step(C(), s, a).state)).toBe(world(s));
      }),
      RUNS
    );
  });

  it('P14 bounds: log capped, serialized state small', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(10_000), { maxLength: 120 }), (choices) => {
        const s = walk(choices).states.at(-1) as AdventureState;
        expect(s.log.length).toBeLessThanOrEqual(50);
        expect(JSON.stringify(s).length).toBeLessThan(32 * 1024);
      }),
      { numRuns: 50 }
    );
  });
});

describe('isValidAdventureState', () => {
  it('accepts reachable states (start, mid-dialogue, ended)', () => {
    const end = WALKTHROUGH.reduce((s, a) => step(C(), s, a).state, initialState(C(), 1));
    const mid = WALKTHROUGH.slice(0, 3).reduce((s, a) => step(C(), s, a).state, initialState(C(), 1));
    for (const s of [initialState(C(), 1), mid, end]) expect(isValidAdventureState(C(), s)).toBe(true);
    expect(mid.dialogue).not.toBeNull();
  });

  it.each<[string, (s: AdventureState) => unknown]>([
    ['missing key', ({ log: _log, ...rest }) => rest],
    ['extra key', (s) => ({ ...s, extra: 1 })],
    ['version', (s) => ({ ...s, v: 2 })],
    ['content version', (s) => ({ ...s, content: 2 })],
    ['seed', (s) => ({ ...s, seed: -1 })],
    ['unknown scene', (s) => ({ ...s, scene: 'moon' })],
    ['scene not visited', (s) => ({ ...s, scene: 'tower' })],
    ['unknown item', (s) => ({ ...s, items: ['sword'] })],
    ['duplicate item', (s) => ({ ...s, items: ['rope', 'rope'] })],
    ['item held and used', (s) => ({ ...s, items: ['rope'], used: ['rope'] })],
    ['selected not held', (s) => ({ ...s, selected: 'rope' })],
    ['unknown clue', (s) => ({ ...s, clues: ['x'] })],
    ['unknown flag', (s) => ({ ...s, flags: { nope: 1 } })],
    ['flag zero stored', (s) => ({ ...s, flags: { 'keeper-mood': 0 } })],
    ['flag above max', (s) => ({ ...s, flags: { 'keeper-mood': 4 } })],
    ['unknown goal done', (s) => ({ ...s, goalsDone: ['win'] })],
    ['hint tier 4', (s) => ({ ...s, hints: { 'reach-window': 4 } })],
    ['hint for unknown goal', (s) => ({ ...s, hints: { win: 1 } })],
    ['unknown dialogue node', (s) => ({ ...s, dialogue: { id: 'keeper', node: 'nope' } })],
    ['dialogue extra key', (s) => ({ ...s, dialogue: { id: 'keeper', node: 'hello', x: 1 } })],
    ['chapter out of range', (s) => ({ ...s, chapter: 3 })],
    ['negative actions', (s) => ({ ...s, actions: -1 })],
    ['unknown ending', (s) => ({ ...s, ended: 'nope' })],
    ['ended in dialogue', (s) => ({ ...s, ended: 'map-found', dialogue: { id: 'keeper', node: 'hello' } })],
    ['log too long', (s) => ({ ...s, log: Array.from({ length: 51 }, () => 'scene.yard.name') })],
    ['log junk', (s) => ({ ...s, log: ['<script>'] })]
  ])('rejects %s', (_, mutate) => {
    expect(isValidAdventureState(C(), mutate(initialState(C(), 1)))).toBe(false);
  });

  it('survives hostile getters', () => {
    const s = { ...initialState(C(), 1) } as Record<string, unknown>;
    Object.defineProperty(s, 'items', { enumerable: true, get: () => { throw new Error('boom'); } });
    expect(isValidAdventureState(C(), s)).toBe(false);
  });
});

describe('canonicalJson / stateHash', () => {
  it('does not depend on key order and distinguishes states', () => {
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: undefined }] })).toBe('{"a":[{"d":2}],"b":1}');
    const s = initialState(C(), 1);
    expect(stateHash(s)).toBe(stateHash(JSON.parse(JSON.stringify(s)) as AdventureState));
    expect(stateHash(s)).not.toBe(stateHash(initialState(C(), 2)));
  });
});
