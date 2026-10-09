/**
 * Computer opponent for Stack Duel (pure, deterministic).
 *
 * It samples candidate placements (x, rotation), simulates each with the same physics the
 * game uses and scores the settled result: nothing may fall; a low tower, little
 * disturbance of the existing pieces, a piece that kept its intended angle and stays near
 * the middle are preferred. Promising candidates are re-checked with a small sideways
 * jitter (robustness). The hard opponent also tries the human's known next piece on the
 * resulting tower and prefers towers where many of those tries fail.
 *
 * Difficulty = skill, never pressure: fewer candidates, coarser rotations and a less
 * precise "hand" (the executed position deviates from the planned one) on easy.
 * All randomness comes from a PRNG seeded by the game seed and the move number.
 */
import { createRng, type Rng } from '@wp/game-core';
import {
  PLATFORM_HALF,
  ROT_STEPS,
  angleOf,
  drop,
  normalizeAngle,
  playerToMove,
  snapX,
  simulateDrop,
  towerHeight,
  wrapRot,
  type Cursor,
  type Difficulty,
  type DropOutcome,
  type Placed,
  type StackDuelState
} from './rules';

export interface AiProfile {
  /** Number of sampled placements. */
  readonly candidates: number;
  /** Allowed rotation steps (multiples of 15°). */
  readonly rotations: readonly number[];
  /** How many of the best candidates are re-checked with a sideways jitter. */
  readonly robust: number;
  /** How many of the best candidates are scored by trying the opponent's next piece. */
  readonly trap: number;
  readonly trapSamples: number;
  /** Maximal deviation (world units) of the executed from the planned position. */
  readonly tremor: number;
  /** Physics step cap for the AI's own look-ahead simulations. */
  readonly simSteps: number;
}

const every = (step: number) => Array.from({ length: ROT_STEPS / step }, (_, i) => i * step);

export const AI_PROFILES: Readonly<Record<Difficulty, AiProfile>> = {
  easy: { candidates: 6, rotations: every(6), robust: 0, trap: 0, trapSamples: 0, tremor: 0.35, simSteps: 240 },
  medium: { candidates: 12, rotations: every(3), robust: 3, trap: 0, trapSamples: 0, tremor: 0.1, simSteps: 300 },
  hard: { candidates: 16, rotations: every(1), robust: 4, trap: 3, trapSamples: 5, tremor: 0, simSteps: 300 }
};

/** Tower size up to which the full sampling budget is used. */
export const FULL_BUDGET_PIECES = 12;

/**
 * Scales the number of look-ahead simulations down on tall towers (each simulation costs
 * more there), so thinking time stays roughly constant. Depends only on the state, never
 * on wall-clock time, so the choice stays deterministic.
 */
export function budgeted(profile: AiProfile, pieces: number): AiProfile {
  const f = Math.min(1, FULL_BUDGET_PIECES / Math.max(1, pieces));
  return {
    ...profile,
    candidates: Math.max(4, Math.round(profile.candidates * f)),
    robust: Math.round(profile.robust * f),
    trapSamples: profile.trap > 0 ? Math.max(2, Math.round(profile.trapSamples * f)) : 0
  };
}

/** Seed of the AI's PRNG for the move about to be made (no extra state needs saving). */
export const aiSeed = (state: StackDuelState): number => (state.seed ^ Math.imul(state.bodies.length + 1, 0x9e3779b1)) >>> 0;

export interface Candidate {
  cursor: Cursor;
  score: number;
  fell: boolean;
}

/** Sum of how far the previously settled pieces moved (a measure of how shaky the drop was). */
export function disturbance(before: readonly Placed[], after: readonly Placed[]): number {
  let total = 0;
  for (let i = 0; i < before.length; i++) {
    const a = before[i]!;
    const b = after[i]!;
    total += Math.abs(b.x - a.x) + Math.abs(b.y - a.y) + 0.5 * Math.abs(normalizeAngle(b.a - a.a));
  }
  return total;
}

export type Goal = 'low' | 'high';

/** Score of a simulated drop; higher is better. Any fallen piece is far below every standing result. */
export function scoreOutcome(before: readonly Placed[], cursor: Cursor, outcome: DropOutcome, goal: Goal = 'low'): number {
  if (outcome.fallen.length > 0) return -1000 - outcome.fallen.length;
  const placed = outcome.bodies[outcome.bodies.length - 1]!;
  const tilt = Math.abs(normalizeAngle(placed.a - angleOf(cursor.rot)));
  const height = towerHeight(outcome.bodies);
  const heightTerm = goal === 'low' ? -height : 2 * height;
  return heightTerm - 4 * disturbance(before, outcome.bodies) - 2 * tilt - 0.3 * Math.abs(placed.x) - (outcome.settled ? 0 : 2);
}

function sampleCursors(state: StackDuelState, profile: AiProfile, rng: Rng): Cursor[] {
  const cursors: Cursor[] = [];
  const reach = PLATFORM_HALF - 0.4;
  // Always consider the middle of the current top piece, flat.
  const top = state.bodies.reduce<Placed | undefined>((best, b) => (best === undefined || b.y > best.y ? b : best), undefined);
  cursors.push({ x: snapX(top ? top.x : 0), rot: 0 });
  while (cursors.length < profile.candidates) {
    const x = snapX((rng.next() * 2 - 1) * reach);
    cursors.push({ x, rot: rng.pick(profile.rotations) });
  }
  return cursors;
}

/** Fraction of sampled placements of the opponent's next piece that would make something fall. */
function trapValue(bodies: readonly Placed[], kind: number, samples: number, steps: number, rng: Rng): number {
  let falls = 0;
  for (let i = 0; i < samples; i++) {
    const cursor = { x: snapX((rng.next() * 2 - 1) * (PLATFORM_HALF - 0.5)), rot: rng.int(0, 3) * 6 };
    if (simulateDrop(bodies, kind, cursor, { maxSteps: steps, stopOnFall: true }).fallen.length > 0) falls++;
  }
  return falls / samples;
}

/**
 * Evaluates candidates and returns them best first (stable order for equal scores).
 * `goal: 'high'` builds upwards (used for the solo challenge balance tests).
 */
export function evaluate(state: StackDuelState, profile: AiProfile, rng: Rng, goal: Goal = 'low'): Candidate[] {
  const kind = state.queue[0];
  const scored = sampleCursors(state, profile, rng).map((cursor, index) => {
    const outcome = simulateDrop(state.bodies, kind, cursor, { maxSteps: profile.simSteps, stopOnFall: true });
    return { cursor, score: scoreOutcome(state.bodies, cursor, outcome, goal), fell: outcome.fallen.length > 0, index, outcome };
  });
  const order = (list: typeof scored) => list.sort((a, b) => b.score - a.score || a.index - b.index);
  order(scored);
  for (const c of scored.slice(0, profile.robust)) {
    if (c.fell) continue;
    for (const dx of [-0.1, 0.1]) {
      const jittered = { x: snapX(c.cursor.x + dx), rot: c.cursor.rot };
      if (simulateDrop(state.bodies, kind, jittered, { maxSteps: profile.simSteps, stopOnFall: true }).fallen.length > 0) c.score -= 5;
    }
  }
  if (profile.trap > 0 && state.mode !== 'solo') {
    order(scored);
    for (const c of scored.slice(0, profile.trap)) {
      if (c.fell) continue;
      c.score += 3 * trapValue(c.outcome.bodies, state.queue[1], profile.trapSamples, profile.simSteps, rng);
    }
  }
  order(scored);
  return scored.map(({ cursor, score, fell }) => ({ cursor, score, fell }));
}

/** The computer's placement for the current state (deterministic for a given state). */
export function chooseDrop(state: StackDuelState, goal: Goal = 'low'): Cursor {
  const profile = budgeted(AI_PROFILES[state.difficulty], state.bodies.length);
  const rng = createRng(aiSeed(state));
  const best = evaluate(state, profile, rng, goal)[0]!.cursor;
  if (profile.tremor === 0) return best;
  // An imprecise hand: the executed position deviates a little from the plan.
  const shaken = best.x + (rng.next() * 2 - 1) * profile.tremor;
  return { x: snapX(shaken), rot: wrapRot(best.rot) };
}

export interface TurnResult {
  state: StackDuelState;
  /** The drops that happened (the player's, then possibly the computer's), with outcomes. */
  drops: { by: 0 | 1; kind: number; cursor: Cursor; outcome: DropOutcome }[];
}

/**
 * Plays the current player's drop and, in a game against the computer, the computer's
 * reply as part of the same logical step (so a save never waits for the computer).
 */
export function playTurn(state: StackDuelState, cursor: Cursor, record = false): TurnResult | undefined {
  const first = drop(state, cursor, { record });
  if (!first) return undefined;
  const drops: TurnResult['drops'] = [{ by: playerToMove(state), kind: state.queue[0], cursor: { ...cursor }, outcome: first.outcome }];
  let next = first.state;
  if (next.mode === 'computer' && next.result === null && playerToMove(next) === 1) {
    const reply = chooseDrop(next);
    const second = drop(next, reply, { record })!;
    drops.push({ by: 1, kind: next.queue[0], cursor: reply, outcome: second.outcome });
    next = second.state;
  }
  return { state: next, drops };
}
