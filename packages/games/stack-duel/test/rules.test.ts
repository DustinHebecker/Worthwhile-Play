import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, createRngFromState } from '@wp/game-core';
import { KIND_COUNT, PIECE_KINDS, PIECE_WEIGHTS, kindById, rotatePoint } from '../src/pieces';
import {
  DIFFICULTIES,
  DROP_GAP,
  FALL_Y,
  MAX_DUEL_PIECES,
  MAX_STEPS,
  MODES,
  PLATFORM_HALF,
  RECORD_EVERY,
  ROT_STEPS,
  SOLO_GOALS,
  TAIL_STEPS,
  VERIFY_STEPS,
  VERIFY_TOLERANCE,
  X_LIMIT,
  angleOf,
  buildWorld,
  cloneState,
  drawKind,
  drop,
  hasFallen,
  isOver,
  isValidState,
  maxDisplacement,
  newState,
  normalizeAngle,
  outlineOf,
  piecesLeft,
  playerToMove,
  simulateDrop,
  snapX,
  spawnPose,
  towerHeight,
  withCursor,
  wrapRot,
  type Cursor,
  type Placed,
  type StackDuelState
} from '../src/rules';

const json = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Plays a fixed list of cursors (stops early when the round ends). */
function playAll(state: StackDuelState, cursors: readonly Cursor[]): StackDuelState {
  let s = state;
  for (const c of cursors) {
    const r = drop(s, c);
    if (!r) break;
    s = r.state;
  }
  return s;
}

/** A neat, stable 39-tile wall (for draw / performance tests). */
function tileWall(count: number): Placed[] {
  const tile = kindById('tile');
  const perRow = 7;
  return Array.from({ length: count }, (_, i) => ({ k: tile, x: -2.1 + 0.7 * (i % perRow), y: 0.35 + 0.7 * Math.floor(i / perRow), a: 0 }));
}

const cursorArb = fc.record({ x: fc.double({ min: -1.2, max: 1.2, noNaN: true }), rot: fc.integer({ min: 0, max: ROT_STEPS - 1 }) });

describe('piece sequence', () => {
  it('starts a round with two seeded pieces and an empty platform', () => {
    const s = newState(42, 'medium', 'computer');
    expect(s.bodies).toEqual([]);
    expect(s.cursor).toEqual({ x: 0, rot: 0 });
    expect(s.result).toBeNull();
    expect(s.seed).toBe(42);
    expect(s.mode).toBe('computer');
    expect(s.difficulty).toBe('medium');
    const rng = createRng(42);
    expect(s.queue).toEqual([drawKind(rng, 'medium'), drawKind(rng, 'medium')]);
    expect(s.rng).toBe(rng.state());
    expect(isValidState(s)).toBe(true);
  });

  it('normalizes the seed to an unsigned 32-bit integer', () => {
    expect(newState(-1, 'easy', 'solo').seed).toBe(0xffffffff);
  });

  it('draws kinds by the difficulty weights (zero weight = never)', () => {
    const rng = createRng(7);
    const counts = new Array<number>(KIND_COUNT).fill(0);
    for (let i = 0; i < 4000; i++) counts[drawKind(rng, 'easy')]!++;
    PIECE_WEIGHTS.easy.forEach((w, k) => {
      if (w === 0) expect(counts[k], PIECE_KINDS[k]!.id).toBe(0);
      else expect(counts[k], PIECE_KINDS[k]!.id).toBeGreaterThan(0);
    });
    const total = PIECE_WEIGHTS.easy.reduce((a, b) => a + b, 0);
    // The most common kind appears roughly in proportion to its weight.
    expect(counts[0]! / 4000).toBeGreaterThan((PIECE_WEIGHTS.easy[0]! / total) * 0.8);
    expect(counts[0]! / 4000).toBeLessThan((PIECE_WEIGHTS.easy[0]! / total) * 1.2);
  });

  it('maps the full rng range onto valid kinds', () => {
    const fake = (value: number) => ({ ...createRng(1), next: () => value });
    expect(drawKind(fake(0), 'hard')).toBe(0);
    expect(drawKind(fake(0.9999999999), 'hard')).toBe(KIND_COUNT - 1);
    expect(drawKind(fake(0.9999999999), 'easy')).toBe(KIND_COUNT - 1);
    expect(drawKind(fake(0), 'easy')).toBe(0);
    const easyTotal = PIECE_WEIGHTS.easy.reduce((a, b) => a + b, 0);
    // Just past the first bucket falls into the second.
    expect(drawKind(fake(PIECE_WEIGHTS.easy[0]! / easyTotal + 1e-9), 'easy')).toBe(1);
    expect(drawKind(fake(PIECE_WEIGHTS.easy[0]! / easyTotal - 1e-9), 'easy')).toBe(0);
  });

  it('gives hard rounds more pointed and rolling stones than easy rounds', () => {
    const irregular = ['triangle', 'wedge', 'pentagon', 'diamond', 'slant'].map(kindById);
    const share = (d: 'easy' | 'hard') => {
      const w = PIECE_WEIGHTS[d];
      const total = w.reduce((a, b) => a + b, 0);
      return irregular.reduce((a, k) => a + w[k]!, 0) / total;
    };
    expect(share('easy')).toBe(0);
    expect(share('hard')).toBeGreaterThan(0.3);
    for (const d of DIFFICULTIES) expect(PIECE_WEIGHTS[d]).toHaveLength(KIND_COUNT);
  });
});

describe('geometry helpers', () => {
  it('converts rotation steps to angles and wraps them', () => {
    expect(angleOf(0)).toBe(0);
    expect(angleOf(6)).toBeCloseTo(Math.PI / 2, 12);
    expect(angleOf(12)).toBeCloseTo(Math.PI, 12);
    expect(wrapRot(24)).toBe(0);
    expect(wrapRot(-1)).toBe(23);
    expect(wrapRot(25)).toBe(1);
    expect(wrapRot(5.6)).toBe(6);
    expect(wrapRot(-25)).toBe(23);
  });

  it('normalizes angles into [-π, π)', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(-Math.PI, 12);
    expect(normalizeAngle(3 * Math.PI + 0.5)).toBeCloseTo(-Math.PI + 0.5, 12);
    expect(normalizeAngle(-0.5)).toBeCloseTo(-0.5, 12);
    expect(normalizeAngle(2 * Math.PI + 0.25)).toBeCloseTo(0.25, 12);
    fc.assert(
      fc.property(fc.double({ min: -100, max: 100, noNaN: true }), (a) => {
        const n = normalizeAngle(a);
        expect(n).toBeGreaterThanOrEqual(-Math.PI);
        expect(n).toBeLessThan(Math.PI);
        expect(Math.cos(n)).toBeCloseTo(Math.cos(a), 9);
        expect(Math.sin(n)).toBeCloseTo(Math.sin(a), 9);
      })
    );
  });

  it('snaps and clamps positions to the 0.05 grid', () => {
    expect(snapX(0.123)).toBe(0.1);
    expect(snapX(0.126)).toBe(0.15);
    expect(snapX(-0.126)).toBe(-0.15);
    expect(snapX(99)).toBe(X_LIMIT);
    expect(snapX(-99)).toBe(-X_LIMIT);
    expect(snapX(X_LIMIT)).toBe(X_LIMIT);
    fc.assert(
      fc.property(fc.double({ min: -10, max: 10, noNaN: true }), (x) => {
        const s = snapX(x);
        expect(Math.abs(s)).toBeLessThanOrEqual(X_LIMIT);
        expect(Math.round(s * 20)).toBeCloseTo(s * 20, 9);
      })
    );
  });

  it('places outlines by position and angle', () => {
    const k = kindById('block');
    const outline = outlineOf({ k, x: 1, y: 2, a: Math.PI / 2 });
    const expected = PIECE_KINDS[k]!.outline.map((p) => {
      const [x, y] = rotatePoint(p, Math.PI / 2);
      return [1 + x, 2 + y];
    });
    outline.forEach((p, i) => {
      expect(p[0]).toBeCloseTo(expected[i]![0]!, 12);
      expect(p[1]).toBeCloseTo(expected[i]![1]!, 12);
    });
  });

  it('measures the tower top and ignores fallen stones', () => {
    const k = kindById('block');
    expect(towerHeight([])).toBe(0);
    expect(towerHeight([{ k, x: 0, y: 0.5, a: 0 }])).toBeCloseTo(1, 12);
    expect(towerHeight([{ k, x: 0, y: 0.5, a: 0 }, { k, x: 0, y: 1.5, a: 0 }])).toBeCloseTo(2, 12);
    expect(towerHeight([{ k, x: 0, y: 0.5, a: 0 }, { k, x: 4, y: -5, a: 0 }])).toBeCloseTo(1, 12);
    // A fallen stone below the platform never counts, even as the only one.
    expect(towerHeight([{ k, x: 4, y: -5, a: 0 }])).toBe(0);
    expect(hasFallen({ k, x: 0, y: FALL_Y - 0.01, a: 0 })).toBe(true);
    expect(hasFallen({ k, x: 0, y: FALL_Y, a: 0 })).toBe(false);
  });

  it('hangs the held stone DROP_GAP above the tower top', () => {
    const k = kindById('bar');
    const bodies: Placed[] = [{ k: kindById('block'), x: 0, y: 0.5, a: 0 }];
    for (const rot of [0, 3, 6, 9]) {
      const pose = spawnPose(bodies, k, { x: 0.33, rot });
      expect(pose.x).toBe(0.35);
      expect(pose.a).toBeCloseTo(angleOf(rot), 12);
      const low = Math.min(...outlineOf(pose).map(([, y]) => y));
      expect(low).toBeCloseTo(1 + DROP_GAP, 9);
    }
    expect(spawnPose([], k, { x: 0, rot: 30 }).a).toBeCloseTo(angleOf(6), 12);
  });
});

describe('dropping', () => {
  it('a single stone dropped near the middle never falls (property, all kinds and rotations)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: KIND_COUNT - 1 }), fc.integer({ min: 0, max: ROT_STEPS - 1 }), fc.double({ min: -0.5, max: 0.5, noNaN: true }), (k, rot, x) => {
        const out = simulateDrop([], k, { x, rot });
        expect(out.fallen).toEqual([]);
        expect(out.settled).toBe(true);
        expect(out.bodies).toHaveLength(1);
        expect(out.bodies[0]!.y).toBeGreaterThan(0);
        expect(out.bodies[0]!.y).toBeLessThan(2);
      }),
      { numRuns: 60 }
    );
  });

  it('a stone dropped mostly beside the platform falls', () => {
    const out = simulateDrop([], kindById('block'), { x: X_LIMIT, rot: 0 });
    expect(out.fallen).toEqual([0]);
    expect(out.settled).toBe(true);
    expect(out.bodies[0]!.y).toBeLessThan(FALL_Y);
  });

  it('records animation frames ending in the stored poses', () => {
    const out = simulateDrop([], kindById('plank'), { x: 0.5, rot: 2 }, { record: true });
    const frames = out.frames!;
    expect(frames.length).toBeGreaterThan(5);
    expect(frames.length).toBeLessThanOrEqual(Math.ceil(out.steps / RECORD_EVERY) + 2);
    expect(frames[0]!).toHaveLength(3);
    const last = frames[frames.length - 1]!;
    expect(last).toEqual([out.bodies[0]!.x, out.bodies[0]!.y, out.bodies[0]!.a]);
    const pose = spawnPose([], kindById('plank'), { x: 0.5, rot: 2 });
    expect(frames[0]).toEqual([pose.x, pose.y, pose.a]);
    expect(simulateDrop([], kindById('plank'), { x: 0.5, rot: 2 }).frames).toBeUndefined();
  });

  it('stops a falling drop after the animation tail, or immediately with stopOnFall', () => {
    const full = simulateDrop([], kindById('block'), { x: X_LIMIT, rot: 0 });
    const quick = simulateDrop([], kindById('block'), { x: X_LIMIT, rot: 0 }, { stopOnFall: true });
    expect(full.steps - quick.steps).toBe(TAIL_STEPS);
    expect(quick.fallen).toEqual([0]);
  });

  it('respects the step cap and reports an unsettled snapshot', () => {
    const out = simulateDrop([], kindById('block'), { x: 0, rot: 0 }, { maxSteps: 5 });
    expect(out.steps).toBe(5);
    expect(out.settled).toBe(false);
    expect(out.fallen).toEqual([]);
  });

  it('is deterministic for the same seed and moves (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.array(cursorArb, { minLength: 1, maxLength: 4 }), (seed, cursors) => {
        const a = playAll(newState(seed, 'medium', 'human'), cursors);
        const b = playAll(newState(seed, 'medium', 'human'), cursors);
        expect(a).toEqual(b);
        expect(isValidState(json(a))).toBe(true);
      }),
      { numRuns: 12 }
    );
  });

  it('continues identically from a JSON round trip (live vs restored)', () => {
    const cursors = [
      { x: 0, rot: 0 },
      { x: 0.2, rot: 0 },
      { x: -0.2, rot: 0 }
    ];
    const live = playAll(newState(11, 'easy', 'human'), cursors);
    expect(live.result).toBeNull();
    expect(live.bodies).toHaveLength(3);
    const restored = json(live);
    const next = { x: 0.1, rot: 3 };
    expect(drop(restored, next)!.state).toEqual(drop(live, next)!.state);
  });

  it('settled towers stay put when woken cold, and stones never deeply interpenetrate (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.array(cursorArb, { minLength: 2, maxLength: 6 }), (seed, cursors) => {
        let s = newState(seed, 'hard', 'human');
        let settled = true;
        for (const c of cursors) {
          const r = drop(s, c);
          if (!r) break;
          s = r.state;
          settled = r.outcome.settled;
        }
        if (s.result !== null) return;
        // One cold restart (all awake, zero velocity, primed contacts) is what the next stone meets.
        const world = buildWorld(s.bodies, true);
        expect(world.maxPenetration()).toBeLessThan(0.03);
        let steps = 0;
        while (steps < VERIFY_STEPS && !world.allAsleep()) {
          world.step();
          steps++;
        }
        const woken = s.bodies.map((b, i) => ({ ...b, x: world.bodies[i + 1]!.x, y: world.bodies[i + 1]!.y, a: world.bodies[i + 1]!.a }));
        expect(woken.some(hasFallen)).toBe(false);
        // A settled snapshot is guaranteed to come back to rest at once, practically unmoved. Only a drop
        // that hit the step cap (slow sway on tall towers) may still drift a little.
        if (settled) {
          expect(world.allAsleep()).toBe(true);
          expect(maxDisplacement(s.bodies, woken)).toBeLessThanOrEqual(VERIFY_TOLERANCE);
        } else expect(maxDisplacement(s.bodies, woken)).toBeLessThan(10 * VERIFY_TOLERANCE);
      }),
      { numRuns: 15 }
    );
  });

  it('keeps a restored, asleep tower exactly in place while a stone falls elsewhere', () => {
    const s = playAll(newState(5, 'easy', 'human'), [
      { x: -1.6, rot: 0 },
      { x: -1.6, rot: 0 }
    ]);
    expect(s.result).toBeNull();
    const out = simulateDrop(s.bodies, kindById('tile'), { x: 1.9, rot: 0 });
    const left = s.bodies.filter((b) => b.x < 0);
    expect(left.length).toBeGreaterThan(0);
    s.bodies.forEach((b, i) => {
      if (b.x < 0) expect(out.bodies[i]).toEqual(b);
    });
  });

  it('measures the largest displacement between snapshots', () => {
    const k = 0;
    expect(maxDisplacement([{ k, x: 0, y: 0, a: 0 }], [{ k, x: 0.1, y: -0.3, a: 0.2 }])).toBeCloseTo(0.3, 12);
    expect(maxDisplacement([{ k, x: 0, y: 0, a: 3.1 }], [{ k, x: 0, y: 0, a: -3.1 }])).toBeCloseTo(2 * Math.PI - 6.2, 9);
    expect(maxDisplacement([], [])).toBe(0);
  });

  it('resolves a drop onto a 39-stone wall quickly (performance)', () => {
    const wall = tileWall(39);
    const t0 = performance.now();
    const out = simulateDrop(wall, kindById('plank'), { x: 0, rot: 0 });
    const ms = performance.now() - t0;
    expect(out.fallen).toEqual([]);
    expect(out.settled).toBe(true);
    expect(out.steps).toBeLessThan(MAX_STEPS);
    expect(ms).toBeLessThan(1500); // generous for CI; typically ~20–60 ms on a laptop
  });
});

describe('turns and results', () => {
  it('alternates players in a duel and keeps player 0 in solo', () => {
    let s = newState(3, 'easy', 'human');
    expect(playerToMove(s)).toBe(0);
    s = drop(s, { x: 0, rot: 0 })!.state;
    expect(playerToMove(s)).toBe(1);
    const solo = drop(newState(3, 'easy', 'solo'), { x: 0, rot: 0 })!.state;
    expect(playerToMove(solo)).toBe(0);
  });

  it('advances the queue, the rng and resets the cursor', () => {
    const s = newState(9, 'medium', 'human');
    const r = drop(s, { x: 0.42, rot: 26 }, { record: true })!;
    const rng = createRngFromState(s.rng);
    expect(r.state.queue).toEqual([s.queue[1], drawKind(rng, 'medium')]);
    expect(r.state.rng).toBe(rng.state());
    expect(r.state.cursor).toEqual({ x: 0, rot: 0 });
    expect(r.state.bodies).toHaveLength(1);
    expect(r.state.bodies[0]!.k).toBe(s.queue[0]);
    expect(r.outcome.bodies).toBe(r.state.bodies);
    // Cursor was cleaned: snapped x and wrapped rotation.
    expect(r.outcome.frames![0]![0]).toBe(0.4);
    expect(r.outcome.frames![0]![2]).toBeCloseTo(angleOf(2), 12);
    expect(s.bodies).toHaveLength(0); // input not mutated
  });

  it('uses the stored cursor when none is given', () => {
    const s = withCursor(newState(9, 'medium', 'human'), { x: 0.7, rot: 0 });
    expect(drop(s)!.state).toEqual(drop(s, { x: 0.7, rot: 0 })!.state);
  });

  it('blames the player whose drop made a stone fall', () => {
    let s = newState(4, 'easy', 'human');
    s = drop(s, { x: 0, rot: 0 })!.state;
    const r = drop(s, { x: X_LIMIT, rot: 0 })!;
    expect(r.state.result).toEqual({ kind: 'fell', by: 1 });
    expect(isOver(r.state)).toBe(true);
    expect(drop(r.state, { x: 0, rot: 0 })).toBeUndefined();
    expect(isValidState(json(r.state))).toBe(true);
    const first = drop(newState(4, 'easy', 'computer'), { x: -X_LIMIT, rot: 0 })!;
    expect(first.state.result).toEqual({ kind: 'fell', by: 0 });
  });

  it('ends the solo challenge when the target height is reached', () => {
    const s: StackDuelState = { ...newState(1, 'easy', 'solo') };
    const goal = SOLO_GOALS.easy;
    // A neat column of tiles just below the goal; one more stone reaches it.
    const tile = kindById('tile');
    const rows = Math.ceil(goal.height / 0.7) - 1;
    const column: Placed[] = Array.from({ length: rows }, (_, i) => ({ k: tile, x: 0, y: 0.35 + 0.7 * i, a: 0 }));
    const r = drop({ ...s, bodies: column, queue: [kindById('block'), tile] }, { x: 0, rot: 0 })!;
    expect(towerHeight(r.state.bodies)).toBeGreaterThanOrEqual(goal.height);
    expect(r.state.result).toEqual({ kind: 'height' });
  });

  it('ends the solo challenge when the stones run out below the target', () => {
    const goal = SOLO_GOALS.medium;
    const wall = tileWall(goal.pieces - 1);
    expect(towerHeight(wall)).toBeLessThan(goal.height);
    const s = { ...newState(1, 'medium', 'solo'), bodies: wall };
    expect(piecesLeft(s)).toBe(1);
    const r = drop(s, { x: 0, rot: 0 })!;
    expect(r.state.result).toEqual({ kind: 'short' });
    const notYet = drop({ ...s, bodies: wall.slice(0, 5) }, { x: 0, rot: 0 })!;
    expect(notYet.state.result).toBeNull();
  });

  it('declares a draw when the duel tower reaches the stone limit', () => {
    const s = { ...newState(1, 'easy', 'human'), bodies: tileWall(MAX_DUEL_PIECES - 1), queue: [kindById('plank'), 0] as [number, number] };
    expect(piecesLeft(s)).toBe(1);
    const r = drop(s, { x: 0, rot: 0 })!;
    expect(r.state.result).toEqual({ kind: 'full' });
    const fewer = drop({ ...s, bodies: tileWall(10) }, { x: 0, rot: 0 })!;
    expect(fewer.state.result).toBeNull();
  });

  it('clamps cursors and clones states deeply', () => {
    const s = newState(2, 'easy', 'computer');
    expect(withCursor(s, { x: 7, rot: -2 }).cursor).toEqual({ x: X_LIMIT, rot: 22 });
    const after = drop(s, { x: 0, rot: 0 })!.state;
    const finished = { ...after, result: { kind: 'fell' as const, by: 0 as const } };
    const c = cloneState(finished);
    expect(c).toEqual(finished);
    expect(c.bodies).not.toBe(finished.bodies);
    expect(c.bodies[0]).not.toBe(finished.bodies[0]);
    expect(c.queue).not.toBe(finished.queue);
    expect(c.cursor).not.toBe(finished.cursor);
    expect(c.result).not.toBe(finished.result);
    expect(cloneState(s).result).toBeNull();
  });
});

describe('isValidState', () => {
  const played = () => playAll(newState(77, 'easy', 'human'), [
    { x: 0, rot: 0 },
    { x: 0.3, rot: 0 }
  ]);

  it('accepts fresh and played states of every mode and difficulty', () => {
    for (const mode of MODES) for (const d of DIFFICULTIES) expect(isValidState(json(newState(5, d, mode))), `${mode} ${d}`).toBe(true);
    expect(isValidState(json(played()))).toBe(true);
  });

  it('rejects tampered states', () => {
    const s = played();
    const bad: unknown[] = [
      { ...s, seed: -1 },
      { ...s, seed: 1.5 },
      { ...s, seed: s.seed + 1 },
      { ...s, difficulty: 'expert' },
      { ...s, mode: 'online' },
      { ...s, rng: s.rng + 1 },
      { ...s, rng: 'x' },
      { ...s, queue: [s.queue[0]] },
      { ...s, queue: [s.queue[1], s.queue[0] === 0 ? 1 : 0] },
      { ...s, queue: [s.queue[0], (s.queue[1] + 1) % KIND_COUNT] },
      { ...s, queue: [KIND_COUNT, 0] },
      { ...s, cursor: { x: X_LIMIT + 0.1, rot: 0 } },
      { ...s, cursor: { x: 0, rot: ROT_STEPS } },
      { ...s, cursor: { x: 0, rot: 1.5 } },
      { ...s, cursor: null },
      { ...s, bodies: s.bodies.slice(1) },
      { ...s, bodies: [{ ...s.bodies[0]!, k: (s.bodies[0]!.k + 1) % KIND_COUNT }, s.bodies[1]] },
      { ...s, bodies: [{ ...s.bodies[0]!, x: Number.NaN }, s.bodies[1]] },
      { ...s, bodies: [{ ...s.bodies[0]!, a: 4 }, s.bodies[1]] },
      { ...s, bodies: [{ ...s.bodies[0]!, extra: 1 }, s.bodies[1]] },
      { ...s, bodies: [{ ...s.bodies[0]!, y: 2000 }, s.bodies[1]] },
      { ...s, bodies: 'none' },
      { ...s, result: { kind: 'fell', by: 1 } },
      { ...s, result: { kind: 'height' } },
      { ...s, result: { kind: 'full' } },
      { ...s, result: { kind: 'short' } },
      { ...s, result: { kind: 'won' } },
      { ...s, result: { kind: 'full', extra: true } },
      { ...s, bodies: [s.bodies[0], { ...s.bodies[1]!, y: -5 }] }
    ];
    bad.forEach((b, i) => expect(isValidState(json(b)), `case ${i}`).toBe(false));
  });

  it('checks result consistency', () => {
    let s = newState(4, 'easy', 'human');
    s = drop(s, { x: 0, rot: 0 })!.state;
    const fell = drop(s, { x: X_LIMIT, rot: 0 })!.state;
    expect(isValidState(json(fell))).toBe(true);
    expect(isValidState(json({ ...fell, result: { kind: 'fell', by: 0 } }))).toBe(false);
    expect(isValidState(json({ ...fell, result: null }))).toBe(false);
    expect(isValidState(json({ ...fell, result: { kind: 'full' } }))).toBe(false);
    expect(isValidState(json({ ...fell, mode: 'solo' }))).toBe(false);
    const soloFell = drop(newState(4, 'easy', 'solo'), { x: X_LIMIT, rot: 0 })!.state;
    expect(soloFell.result).toEqual({ kind: 'fell', by: 0 });
    expect(isValidState(json(soloFell))).toBe(true);
    expect(isValidState(json({ ...soloFell, result: { kind: 'fell', by: 1 } }))).toBe(false);
    expect(isValidState(json({ ...soloFell, result: { kind: 'short' } }))).toBe(false);
  });

  it('validates real solo endings and duel draws only with consistent counts and heights', () => {
    // Build real sequences by replaying the seed's pieces as neat tiles is impossible (kinds are fixed),
    // so check the consistency rules on hand-made states that bypass the sequence check.
    const s = newState(1, 'easy', 'solo');
    const heightState = { ...s, result: { kind: 'height' as const } };
    expect(isValidState(json(heightState))).toBe(false); // empty tower is below the goal
    const tooMany = { ...newState(1, 'easy', 'solo'), bodies: tileWall(SOLO_GOALS.easy.pieces + 1) };
    expect(isValidState(json(tooMany))).toBe(false);
    const duelTooMany = { ...newState(1, 'easy', 'human'), bodies: tileWall(MAX_DUEL_PIECES + 1) };
    expect(isValidState(json(duelTooMany))).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isValidState(v)).not.toThrow();
        expect(isValidState(v)).toBe(false);
      }),
      { numRuns: 300 }
    );
    const s = played();
    fc.assert(
      fc.property(fc.constantFrom('seed', 'difficulty', 'mode', 'bodies', 'queue', 'rng', 'cursor', 'result'), fc.anything(), (key, value) => {
        const mutated = { ...json(s), [key]: value };
        expect(() => isValidState(mutated)).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });

  it('rejects a getter that throws', () => {
    const evil = { ...json(newState(1, 'easy', 'solo')) };
    Object.defineProperty(evil, 'bodies', {
      enumerable: true,
      get() {
        throw new Error('boom');
      }
    });
    expect(isValidState(evil)).toBe(false);
    expect(PLATFORM_HALF).toBeGreaterThan(2);
  });
});
