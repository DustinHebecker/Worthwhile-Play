import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { AI_PROFILES, FULL_BUDGET_PIECES, aiSeed, budgeted, chooseDrop, disturbance, evaluate, playTurn, sampleCursors, scoreOutcome, trapValue, type AiProfile } from '../src/ai';
import { kindById } from '../src/pieces';
import { DIFFICULTIES, PLATFORM_HALF, ROT_STEPS, X_LIMIT, angleOf, drop, newState, simulateDrop, snapX, type DropOutcome, type Placed, type StackDuelState } from '../src/rules';

const k = kindById('block');
const settledOutcome = (bodies: Placed[], settled = true): DropOutcome => ({ bodies, fallen: [], steps: 10, settled });

function midGame(seed: number, difficulty: StackDuelState['difficulty'], drops: number): StackDuelState {
  let s = newState(seed, difficulty, 'human');
  for (let i = 0; i < drops && s.result === null; i++) s = drop(s, chooseDrop(s))!.state;
  return s;
}

describe('scoring', () => {
  it('ranks any fall below every standing result, and more falls lower', () => {
    const standing = scoreOutcome([], { x: 0, rot: 0 }, settledOutcome([{ k, x: 0, y: 9, a: 2 }]));
    const fell1 = scoreOutcome([], { x: 0, rot: 0 }, { ...settledOutcome([{ k, x: 0, y: -9, a: 0 }]), fallen: [0] });
    const fell2 = scoreOutcome([], { x: 0, rot: 0 }, { ...settledOutcome([]), fallen: [0, 1] });
    expect(fell1).toBe(-1001);
    expect(fell2).toBe(-1002);
    expect(standing).toBeGreaterThan(fell1);
  });

  it('prefers low, undisturbed, untilted, central and settled results (goal low)', () => {
    const base = (p: Placed, settled = true) => scoreOutcome([], { x: 0, rot: 0 }, settledOutcome([p], settled));
    const flat = base({ k, x: 0, y: 0.5, a: 0 });
    expect(flat).toBeCloseTo(-1, 9);
    expect(base({ k, x: 0, y: 1.5, a: 0 })).toBeCloseTo(flat - 1, 9);
    expect(base({ k, x: 1, y: 0.5, a: 0 })).toBeCloseTo(flat - 0.3, 9);
    expect(base({ k, x: -1, y: 0.5, a: 0 })).toBeCloseTo(flat - 0.3, 9);
    expect(base({ k, x: 0, y: 0.5, a: 0 }, false)).toBeCloseTo(flat - 2, 9);
    // Tilt relative to the intended rotation (a square tilted by 0.1 also rises slightly).
    const tilted = scoreOutcome([], { x: 0, rot: 6 }, settledOutcome([{ k, x: 0, y: 0.5, a: angleOf(6) - 0.1 }]));
    expect(tilted).toBeLessThan(flat - 0.19);
    const turned = scoreOutcome([], { x: 0, rot: 6 }, settledOutcome([{ k, x: 0, y: 0.5, a: angleOf(6) }]));
    expect(turned).toBeCloseTo(flat, 9);
    const disturbed = scoreOutcome([{ k, x: 0, y: 0.5, a: 0 }], { x: 0, rot: 0 }, settledOutcome([{ k, x: 0.1, y: 0.5, a: 0 }, { k, x: 0, y: 1.5, a: 0 }]));
    const calm = scoreOutcome([{ k, x: 0, y: 0.5, a: 0 }], { x: 0, rot: 0 }, settledOutcome([{ k, x: 0, y: 0.5, a: 0 }, { k, x: 0, y: 1.5, a: 0 }]));
    expect(calm - disturbed).toBeCloseTo(0.4, 9);
  });

  it('prefers tall results when building upwards (goal high)', () => {
    const low = scoreOutcome([], { x: 0, rot: 0 }, settledOutcome([{ k, x: 0, y: 0.5, a: 0 }]), 'high');
    const high = scoreOutcome([], { x: 0, rot: 0 }, settledOutcome([{ k, x: 0, y: 1.5, a: 0 }]), 'high');
    expect(high - low).toBeCloseTo(2, 9);
  });

  it('sums how far settled stones moved', () => {
    expect(disturbance([{ k, x: 0, y: 0, a: 0 }], [{ k, x: 0.1, y: -0.2, a: 0.4 }])).toBeCloseTo(0.5, 12);
    expect(disturbance([], [{ k, x: 9, y: 9, a: 0 }])).toBe(0);
    expect(disturbance([{ k, x: 2, y: 3, a: 0 }], [{ k, x: 2, y: 3, a: 0 }])).toBe(0);
    expect(disturbance([{ k, x: 2, y: 3, a: 0 }], [{ k, x: 2.5, y: 3.25, a: 0 }])).toBeCloseTo(0.75, 12);
    expect(disturbance([{ k, x: 0, y: 0, a: 3.1 }], [{ k, x: 0, y: 0, a: -3.1 }])).toBeCloseTo(0.5 * (2 * Math.PI - 6.2), 9);
  });
});

describe('profiles', () => {
  it('get stronger with difficulty without adding time pressure', () => {
    const [e, m, h] = DIFFICULTIES.map((d) => AI_PROFILES[d]);
    expect(e!.candidates).toBeLessThan(m!.candidates);
    expect(m!.candidates).toBeLessThan(h!.candidates);
    expect(e!.tremor).toBeGreaterThan(m!.tremor);
    expect(h!.tremor).toBe(0);
    expect(e!.rotations).toEqual([0, 6, 12, 18]);
    expect(h!.rotations).toHaveLength(ROT_STEPS);
    expect(h!.trap).toBeGreaterThan(0);
    expect(e!.trap).toBe(0);
  });

  it('scales the look-ahead budget down on tall towers only', () => {
    const hard = AI_PROFILES.hard;
    expect(budgeted(hard, 0)).toEqual(hard);
    expect(budgeted(hard, FULL_BUDGET_PIECES)).toEqual(hard);
    const tall = budgeted(hard, 2 * FULL_BUDGET_PIECES);
    expect(tall.candidates).toBe(Math.round(hard.candidates / 2));
    expect(tall.robust).toBe(Math.round(hard.robust / 2));
    expect(tall.trapSamples).toBe(Math.max(2, Math.round(hard.trapSamples / 2)));
    expect(tall.trap).toBe(hard.trap);
    expect(tall.rotations).toBe(hard.rotations);
    const huge = budgeted(hard, 1000);
    expect(huge.candidates).toBe(4);
    expect(huge.trapSamples).toBe(2);
    expect(huge.robust).toBe(0);
    expect(budgeted(AI_PROFILES.easy, 1000).trapSamples).toBe(0);
  });

  it('derives a different, reproducible seed for every move', () => {
    const s = newState(10, 'easy', 'computer');
    expect(aiSeed(s)).toBe(aiSeed(s));
    const after = drop(s, { x: 0, rot: 0 })!.state;
    expect(aiSeed(after)).not.toBe(aiSeed(s));
    expect(aiSeed({ ...s, seed: 11 })).not.toBe(aiSeed(s));
    expect(aiSeed(s)).toBe((10 ^ Math.imul(1, 0x9e3779b1)) >>> 0);
  });
});

describe('choosing a drop', () => {
  it('evaluates the configured number of candidates, best first', () => {
    const s = midGame(3, 'medium', 2);
    const list = evaluate(s, AI_PROFILES.medium, createRng(1));
    expect(list).toHaveLength(AI_PROFILES.medium.candidates);
    for (let i = 1; i < list.length; i++) expect(list[i - 1]!.score).toBeGreaterThanOrEqual(list[i]!.score);
    // The first sampled candidate is the middle of the top stone, flat.
    const top = s.bodies.reduce((a, b) => (b.y > a.y ? b : a));
    expect(list.some((c) => c.cursor.rot === 0 && Math.abs(c.cursor.x - top.x) <= 0.025)).toBe(true);
    for (const c of list) {
      expect(AI_PROFILES.medium.rotations).toContain(c.cursor.rot);
      expect(c.fell).toBe(c.score <= -1000);
    }
  });

  it('starts at the platform middle on an empty platform', () => {
    const list = evaluate(newState(1, 'easy', 'computer'), AI_PROFILES.easy, createRng(5));
    expect(list.some((c) => c.cursor.x === 0 && c.cursor.rot === 0)).toBe(true);
  });

  it('always returns a legal, deterministic cursor (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.constantFrom(...DIFFICULTIES), fc.integer({ min: 0, max: 3 }), (seed, d, n) => {
        const s = midGame(seed, d, n);
        if (s.result !== null) return;
        const c = chooseDrop(s);
        expect(chooseDrop(s)).toEqual(c);
        expect(Math.abs(c.x)).toBeLessThanOrEqual(X_LIMIT);
        expect(Number.isInteger(c.rot)).toBe(true);
        expect(c.rot).toBeGreaterThanOrEqual(0);
        expect(c.rot).toBeLessThan(ROT_STEPS);
      }),
      { numRuns: 10 }
    );
  });

  it('never makes a stone fall on an empty platform', () => {
    for (const d of DIFFICULTIES) {
      for (const seed of [1, 2, 3, 4]) {
        const s = newState(seed, d, 'computer');
        expect(simulateDrop([], s.queue[0], chooseDrop(s)).fallen, `${d} ${seed}`).toEqual([]);
      }
    }
  });

  it('the precise (hard) opponent only drops safely when a safe candidate exists', () => {
    for (const seed of [21, 22, 23]) {
      const s = midGame(seed, 'hard', 3);
      if (s.result !== null) continue;
      const list = evaluate(s, AI_PROFILES.hard, createRng(aiSeed(s)));
      const c = chooseDrop(s);
      if (list.some((x) => !x.fell)) expect(simulateDrop(s.bodies, s.queue[0], c, { maxSteps: AI_PROFILES.hard.simSteps }).fallen).toEqual([]);
    }
  });

  it('builds higher with goal "high" than with goal "low"', () => {
    const s = midGame(8, 'easy', 2);
    const profile = AI_PROFILES.hard;
    const best = (goal: 'low' | 'high') => evaluate({ ...s, mode: 'solo' }, profile, createRng(3), goal)[0]!;
    const low = simulateDrop(s.bodies, s.queue[0], best('low').cursor);
    const high = simulateDrop(s.bodies, s.queue[0], best('high').cursor);
    const top = (o: DropOutcome) => Math.max(...o.bodies.map((b) => b.y));
    expect(top(high)).toBeGreaterThanOrEqual(top(low));
  });

  it('thinks within a small time budget, even on a taller tower', () => {
    const s = midGame(5, 'hard', 8);
    const t0 = performance.now();
    chooseDrop({ ...s, result: null });
    expect(performance.now() - t0).toBeLessThan(3000); // typically < 300 ms on a laptop
  });
});

describe('playing a turn', () => {
  it('adds the computer reply in the same step', () => {
    const s = newState(12, 'easy', 'computer');
    const turn = playTurn(s, { x: 0, rot: 0 })!;
    expect(turn.drops).toHaveLength(2);
    expect(turn.drops[0]!.by).toBe(0);
    expect(turn.drops[1]!.by).toBe(1);
    expect(turn.drops[0]!.kind).toBe(s.queue[0]);
    expect(turn.drops[1]!.kind).toBe(s.queue[1]);
    expect(turn.state.bodies).toHaveLength(2);
    expect(turn.drops[1]!.cursor).toEqual(chooseDrop(drop(s, { x: 0, rot: 0 })!.state));
    expect(turn.state).toEqual(drop(drop(s, { x: 0, rot: 0 })!.state, turn.drops[1]!.cursor)!.state);
    expect(turn.drops[0]!.outcome.frames).toBeUndefined();
    expect(playTurn(s, { x: 0, rot: 0 }, true)!.drops[1]!.outcome.frames!.length).toBeGreaterThan(0);
  });

  it('plays a single drop with two people or solo', () => {
    expect(playTurn(newState(12, 'easy', 'human'), { x: 0, rot: 0 })!.drops).toHaveLength(1);
    expect(playTurn(newState(12, 'easy', 'solo'), { x: 0, rot: 0 })!.drops).toHaveLength(1);
  });

  it('does not reply after the player lost, and does nothing once the round is over', () => {
    const turn = playTurn(newState(12, 'easy', 'computer'), { x: X_LIMIT, rot: 0 })!;
    expect(turn.drops).toHaveLength(1);
    expect(turn.state.result).toEqual({ kind: 'fell', by: 0 });
    expect(playTurn(turn.state, { x: 0, rot: 0 })).toBeUndefined();
  });
});

describe('look-ahead details (oracles built from public functions)', () => {
  const plain: AiProfile = { candidates: 8, rotations: [0, 6, 12, 18], robust: 0, trap: 0, trapSamples: 0, tremor: 0, simSteps: 300 };

  it('samples the top stone’s middle first, then spread-out legal cursors', () => {
    const s = midGame(14, 'easy', 3);
    const top = s.bodies.reduce((a, b) => (b.y > a.y ? b : a));
    const all: number[] = [];
    for (let seed = 0; seed < 25; seed++) {
      const list = sampleCursors(s, plain, createRng(seed));
      expect(list).toHaveLength(plain.candidates);
      expect(list[0]).toEqual({ x: snapX(top.x), rot: 0 });
      for (const c of list.slice(1)) {
        expect(Math.abs(c.x)).toBeLessThanOrEqual(PLATFORM_HALF - 0.4 + 0.025);
        expect(plain.rotations).toContain(c.rot);
        all.push(c.x);
      }
    }
    expect(Math.min(...all)).toBeLessThan(-1.5);
    expect(Math.max(...all)).toBeGreaterThan(1.5);
    expect(sampleCursors(newState(1, 'easy', 'human'), plain, createRng(1))[0]).toEqual({ x: 0, rot: 0 });
    // Equal heights: the first (lowest index) of the highest stones is used.
    const twin = { ...s, bodies: [{ k, x: -1, y: 0.5, a: 0 }, { k, x: 1, y: 0.5, a: 0 }] };
    expect(sampleCursors(twin, plain, createRng(1))[0]).toEqual({ x: -1, rot: 0 });
  });

  it('scores every candidate exactly by its simulated outcome', () => {
    const s = midGame(15, 'medium', 2);
    const list = evaluate(s, plain, createRng(4));
    const sampled = sampleCursors(s, plain, createRng(4));
    expect(list.map((c) => c.cursor).sort((a, b) => a.x - b.x || a.rot - b.rot)).toEqual([...sampled].sort((a, b) => a.x - b.x || a.rot - b.rot));
    for (const c of list) {
      const outcome = simulateDrop(s.bodies, s.queue[0], c.cursor, { maxSteps: plain.simSteps, stopOnFall: true });
      expect(c.score).toBe(scoreOutcome(s.bodies, c.cursor, outcome));
      expect(c.fell).toBe(outcome.fallen.length > 0);
    }
    const high = evaluate(s, plain, createRng(4), 'high');
    for (const c of high) expect(c.score).toBe(scoreOutcome(s.bodies, c.cursor, simulateDrop(s.bodies, s.queue[0], c.cursor, { maxSteps: 300, stopOnFall: true }), 'high'));
  });

  it('penalizes the best candidates whose ±0.1 neighbours would fall', () => {
    const k2 = kindById('bar');
    // A stone near the edge: some neighbours of good-looking drops fall off.
    const s: StackDuelState = { ...newState(3, 'easy', 'human'), bodies: [{ k: k2, x: 1.2, y: 0.25, a: 0 }], queue: [kindById('block'), 0] };
    const robust: AiProfile = { ...plain, candidates: 30, robust: 30, rotations: [0] };
    const list = evaluate(s, robust, createRng(9));
    let penalized = 0;
    for (const c of list) {
      const base = scoreOutcome(s.bodies, c.cursor, simulateDrop(s.bodies, s.queue[0], c.cursor, { maxSteps: 300, stopOnFall: true }));
      let expected = base;
      if (!c.fell) {
        for (const dx of [-0.1, 0.1]) {
          if (simulateDrop(s.bodies, s.queue[0], { x: snapX(c.cursor.x + dx), rot: 0 }, { maxSteps: 300, stopOnFall: true }).fallen.length > 0) expected -= 5;
        }
      }
      if (expected !== base) penalized++;
      expect(c.score).toBeCloseTo(expected, 9);
    }
    expect(penalized).toBeGreaterThan(0);
  });

  it('counts the opponent’s failing tries exactly (trap value)', () => {
    const bar = kindById('bar');
    // A bar standing on end: many drops onto it topple it.
    const bodies: Placed[] = [{ k: bar, x: 0, y: 1.4, a: Math.PI / 2 }];
    for (const seed of [1, 2, 3]) {
      const r = createRng(seed);
      let falls = 0;
      const samples = 6;
      for (let i = 0; i < samples; i++) {
        const cursor = { x: snapX((r.next() * 2 - 1) * (PLATFORM_HALF - 0.5)), rot: r.int(0, 3) * 6 };
        if (simulateDrop(bodies, kindById('plank'), cursor, { maxSteps: 300 }).fallen.length > 0) falls++;
      }
      const rng = createRng(seed);
      expect(trapValue(bodies, kindById('plank'), samples, 300, rng)).toBe(falls / samples);
      expect(rng.state()).toBe(r.state());
    }
    expect(trapValue([], kindById('block'), 4, 300, createRng(1))).toBe(0);
    const fractions = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => trapValue(bodies, kindById('plank'), 4, 300, createRng(seed)));
    expect(Math.max(...fractions)).toBeGreaterThan(0);
  });

  it('adds three times the trap value to the best duel candidates only', () => {
    const s = midGame(16, 'hard', 2);
    const trapping: AiProfile = { ...plain, trap: 3, trapSamples: 4 };
    const withTrap = evaluate(s, trapping, createRng(2));
    const without = evaluate(s, plain, createRng(2));
    const key = (c: { cursor: { x: number; rot: number } }) => `${c.cursor.x}/${c.cursor.rot}`;
    const base = new Map(without.map((c) => [key(c), c.score]));
    let changed = 0;
    for (const c of withTrap) {
      const diff = c.score - base.get(key(c))!;
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThanOrEqual(3 + 1e-9);
      expect((diff / 3) * trapping.trapSamples).toBeCloseTo(Math.round((diff / 3) * trapping.trapSamples), 9);
      if (diff > 0) {
        changed++;
        expect(c.fell).toBe(false);
      }
    }
    expect(changed).toBeLessThanOrEqual(trapping.trap);
    // Solo towers have no opponent to trap.
    const solo = { ...s, mode: 'solo' as const };
    expect(evaluate(solo, trapping, createRng(2)).map((c) => c.score)).toEqual(evaluate(solo, plain, createRng(2)).map((c) => c.score));
  });

  it('adds a seeded hand tremor to the planned position (easy, medium) but not on hard', () => {
    let deviated = 0;
    for (const seed of [1, 2, 3, 4, 5]) {
      for (const d of DIFFICULTIES) {
        const s = newState(seed, d, 'computer');
        const profile = budgeted(AI_PROFILES[d], 0);
        const rng = createRng(aiSeed(s));
        const best = evaluate(s, profile, rng)[0]!.cursor;
        const expected = profile.tremor === 0 ? best : { x: snapX(best.x + (rng.next() * 2 - 1) * profile.tremor), rot: best.rot };
        const chosen = chooseDrop(s);
        expect(chosen).toEqual(expected);
        if (chosen.x !== best.x) deviated++;
      }
    }
    expect(deviated).toBeGreaterThan(3);
  });
});
