import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CHOICES,
  DIFFICULTIES,
  UNDO_LIMIT,
  addStop,
  check,
  clearPlan,
  createInitial,
  gapOf,
  isFeasible,
  isMoState,
  newTrip,
  removeStop,
  resetState,
  reveal,
  score,
  setQty,
  settingsOf,
  solve,
  tapStop,
  toggleLink,
  undo,
  violations,
  type MoState
} from '../src/rules';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** The state after entering a best plan by edits (whatever the kind). */
function withBestPlan(state: MoState): MoState {
  const best = solve(state.problem).plan;
  let s = state;
  if (s.problem.kind === 'network') for (const i of (best as { built: number[] }).built) s = toggleLink(s, i);
  else if (s.problem.kind === 'delivery') {
    (best as { trips: number[][] }).trips.forEach((trip, k) => {
      if (k > 0) s = newTrip(s);
      for (const stop of trip) s = addStop(s, stop);
    });
  } else (best as { qty: number[] }).qty.forEach((q, i) => (s = setQty(s, i, q)));
  return s;
}

/** A random edit of the current kind (indices may be out of range on purpose). */
const action = fc.oneof(
  fc.record({ type: fc.constant('link' as const), i: fc.integer({ min: -2, max: 25 }) }),
  fc.record({ type: fc.constant('stop' as const), i: fc.integer({ min: -2, max: 8 }) }),
  fc.record({ type: fc.constant('remove' as const), i: fc.integer({ min: -2, max: 8 }) }),
  fc.record({ type: fc.constant('trip' as const) }),
  fc.record({ type: fc.constant('qty' as const), i: fc.integer({ min: -1, max: 4 }), q: fc.integer({ min: -2, max: 7 }) }),
  fc.record({ type: fc.constant('undo' as const) }),
  fc.record({ type: fc.constant('clear' as const) }),
  fc.record({ type: fc.constant('check' as const) }),
  fc.record({ type: fc.constant('reveal' as const) })
);
type Action = typeof action extends fc.Arbitrary<infer A> ? A : never;

function apply(s: MoState, a: Action): MoState {
  switch (a.type) {
    case 'link':
      return toggleLink(s, a.i);
    case 'stop':
      return tapStop(s, a.i);
    case 'remove':
      return removeStop(s, a.i);
    case 'trip':
      return newTrip(s);
    case 'qty':
      return setQty(s, a.i, a.q);
    case 'undo':
      return undo(s);
    case 'clear':
      return clearPlan(s);
    case 'check':
      return check(s).state;
    case 'reveal':
      return reveal(s);
  }
}

describe('creation and settings', () => {
  it('is deterministic, valid, and remembers what the start screen said', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.constantFrom(...CHOICES), (seed, d, choice) => {
        const s = createInitial(seed, d, choice);
        expect(createInitial(seed, d, choice)).toEqual(s);
        expect(isMoState(clone(s))).toBe(true);
        expect(settingsOf(s)).toEqual({ problem: choice, difficulty: d });
        if (choice !== 'any') expect(s.problem.kind).toBe(choice);
        expect(s.phase).toBe('planning');
      }),
      { numRuns: 40 }
    );
  });

  it('"Surprise me" draws all three kinds over seeds', () => {
    const kinds = new Set(Array.from({ length: 30 }, (_, seed) => createInitial(seed, 'easy', 'any').problem.kind));
    expect(kinds).toEqual(new Set(['network', 'delivery', 'production']));
  });

  it('treats unknown settings as the defaults (network, easy)', () => {
    const s = createInitial(3, 'nightmare', 'chess');
    expect(s.difficulty).toBe('easy');
    expect(s.choice).toBe('network');
    expect(s.problem.kind).toBe('network');
    expect(createInitial(Number.NaN).seed).toBe(0);
  });
});

describe('actions', () => {
  it('edits return the same object when nothing changes, and each change can be undone', () => {
    const s = createInitial(4, 'medium', 'network');
    expect(toggleLink(s, -1)).toBe(s);
    expect(addStop(s, 0)).toBe(s);
    expect(setQty(s, 0, 1)).toBe(s);
    expect(clearPlan(s)).toBe(s);
    expect(undo(s)).toBe(s);
    const one = toggleLink(s, 0);
    expect(one.plan).toEqual({ built: [0] });
    expect(undo(one).plan).toEqual(s.plan);
    expect(toggleLink(one, 0).plan).toEqual({ built: [] });
  });

  it('keeps at most UNDO_LIMIT earlier plans', () => {
    let s = createInitial(4, 'easy', 'network');
    for (let k = 0; k < UNDO_LIMIT + 10; k++) s = toggleLink(s, 0);
    expect(s.undo).toHaveLength(UNDO_LIMIT);
    expect(isMoState(clone(s))).toBe(true);
  });

  it('checks only feasible plans; the first check is reported exactly once; edits return to planning', () => {
    for (const kind of ['network', 'delivery', 'production'] as const) {
      const start = createInitial(11, 'hard', kind);
      if (kind !== 'production') {
        expect(check(start)).toEqual({ state: start, first: false });
        expect(violations(start.problem, start.plan).length).toBeGreaterThan(0);
      }
      const ready = withBestPlan(start);
      expect(isFeasible(ready.problem, ready.plan)).toBe(true);
      const first = check(ready);
      expect(first.first).toBe(true);
      expect(first.state).toMatchObject({ checks: 1, phase: 'checked', reported: true, bestScore: solve(ready.problem).score });
      expect(check(first.state).state).toBe(first.state);
      const edited = undo(first.state);
      expect(edited.phase).toBe('planning');
      const again = check(withBestPlan(clearPlan(edited)));
      expect(again.first).toBe(false);
      expect(again.state.checks).toBe(2);
      expect(isMoState(clone(again.state))).toBe(true);
    }
  });

  it('keeps the best checked score and reveals only after a check, without changing the plan', () => {
    const s = createInitial(8, 'easy', 'production');
    expect(reveal(s)).toBe(s);
    const one = check(setQty(s, 0, 1)).state;
    const better = check(withBestPlan(clearPlan(one))).state;
    const worse = check(setQty(clearPlan(better), 0, 1)).state;
    expect(worse.bestScore).toBe(solve(s.problem).score);
    expect(worse.last?.score).toBe(score(s.problem, { qty: s.problem.kind === 'production' ? s.problem.products.map((_, i) => (i === 0 ? 1 : 0)) : [] }));
    const shown = reveal(worse);
    expect(shown.revealed).toBe(true);
    expect(shown.plan).toEqual(worse.plan);
    expect(reveal(shown)).toBe(shown);
  });

  it('reset keeps the problem and clears the plan and counters', () => {
    const s = createInitial(12, 'medium', 'delivery');
    const played = check(withBestPlan(s)).state;
    expect(resetState(played)).toEqual(s);
  });

  it('gap: absolute and percent, in the right direction for each kind', () => {
    expect(gapOf('network', 23, 20)).toEqual({ gap: 3, percent: 15 });
    expect(gapOf('production', 30, 40)).toEqual({ gap: 10, percent: 25 });
    expect(gapOf('delivery', 12, 12).gap).toBe(0);
  });

  it('arbitrary action sequences never throw and always keep a valid state', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.constantFrom(...CHOICES), fc.array(action, { maxLength: 40 }), (seed, d, choice, actions) => {
        let s = createInitial(seed, d, choice);
        let reported = 0;
        for (const a of actions) {
          if (a.type === 'check') {
            const r = check(s);
            if (r.first) reported++;
            s = r.state;
          } else s = apply(s, a);
          expect(isMoState(clone(s))).toBe(true);
        }
        expect(reported).toBe(s.checks > 0 ? 1 : 0);
      }),
      { numRuns: 60 }
    );
  });
});

describe('isMoState', () => {
  const base = check(withBestPlan(createInitial(21, 'medium', 'network'))).state;
  const delivery = createInitial(21, 'hard', 'delivery');

  it('accepts real states and rejects junk without throwing', () => {
    expect(isMoState(clone(base))).toBe(true);
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(isMoState(v)).toBe(false);
      }),
      { numRuns: 200 }
    );
    for (const junk of [null, 1, 'x', [], {}, { seed: 1 }]) expect(isMoState(junk)).toBe(false);
  });

  it('rejects mutated saves', () => {
    const mutate = (f: (s: Record<string, unknown> & MoState) => void, from: MoState = base) => {
      const s = clone(from) as Record<string, unknown> & MoState;
      f(s);
      return isMoState(s);
    };
    expect(mutate((s) => ((s.plan as { built: number[] }).built = [99]))).toBe(false);
    expect(mutate((s) => (s.choice = 'delivery'))).toBe(false);
    expect(mutate((s) => (s.difficulty = 'insane' as never))).toBe(false);
    expect(mutate((s) => (s.seed = -1))).toBe(false);
    expect(mutate((s) => (s.checks = 0))).toBe(false);
    expect(mutate((s) => (s.reported = false))).toBe(false);
    expect(mutate((s) => (s.last = { score: 1, plan: s.plan }))).toBe(false);
    expect(mutate((s) => (s.bestScore = (s.last?.score ?? 0) + 1))).toBe(false);
    expect(mutate((s) => (s.phase = 'unknown' as never))).toBe(false);
    expect(mutate((s) => (s.undo = [{ trips: [] }]))).toBe(false);
    expect(mutate((s) => (s.problem = { ...s.problem, links: [] } as never))).toBe(false);
    // A network whose candidate roads leave a town unreachable has no optimum.
    expect(mutate((s) => {
      if (s.problem.kind !== 'network') return;
      const lonely = s.problem.points.findIndex((q) => !q.junction);
      s.problem.links = s.problem.links.filter((l) => l.a !== lonely && l.b !== lonely);
      s.plan = { built: [] };
      s.undo = [];
      s.checks = 0;
      s.last = null;
      s.bestScore = null;
      s.phase = 'planning';
      s.reported = false;
      s.revealed = false;
    })).toBe(false);
    expect(mutate((s) => ((s.plan as { trips: number[][] }).trips = [[0], [0]]), delivery)).toBe(false);
    expect(mutate((s) => ((s.problem as { stops: unknown[] }).stops = []), delivery)).toBe(false);
    expect(mutate((s) => (s.revealed = true), delivery)).toBe(false);
  });
});
