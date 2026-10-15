import type { ComputerMove } from './ai';
import { applyAction, trickWinners, type Seat, type SkatState } from './rules';

/**
 * Presentation pacing (owner feedback: "Skat is too fast"). The game state always advances and is saved at once;
 * this module only turns the already decided moves into a sequence of table pictures that the view reveals one
 * after another. Nothing here is needed for correctness: skipping, closing or reloading simply shows the real state.
 */

export const SPEEDS = ['normal', 'fast', 'instant'] as const;
export type Speed = (typeof SPEEDS)[number];
export const DEFAULT_SPEED: Speed = 'normal';

export interface Timing {
  /** Pause after a revealed play, bid or announcement before the next one (ms). */
  step: number;
  /** How long a completed trick stays in the middle before it is collected (ms). */
  hold: number;
  /** Duration of the collection slide toward the winner (ms); 0 when motion is reduced. */
  collect: number;
  /** Duration of a card's flight from its player to the trick (ms); 0 when motion is reduced. */
  flight: number;
}

const TIMINGS: Record<Exclude<Speed, 'instant'>, Timing> = {
  normal: { step: 700, hold: 1000, collect: 450, flight: 380 },
  fast: { step: 300, hold: 500, collect: 250, flight: 200 }
};

/**
 * Timings for a speed, or null for "instant" (no reveal queue). Reduced motion keeps the pauses (they pace the
 * information, like a person dealing a card) but has no movement: no flights and no collection slide.
 */
export function timing(speed: Speed, reducedMotion: boolean): Timing | null {
  if (speed === 'instant') return null;
  const base = TIMINGS[speed];
  return reducedMotion ? { ...base, collect: 0, flight: 0 } : base;
}

export interface RevealStep {
  /**
   * `move`: shows the table right after `move`; `collect`: the completed trick slides to `winner`
   * (the picture stays the same).
   */
  kind: 'move' | 'collect';
  /** The state the table shows during this step. */
  state: SkatState;
  move: ComputerMove | null;
  /** This move completed a trick: it is still shown in the middle (with its winner) instead of as "last trick". */
  hold: boolean;
  /** The trick's winner (set when `hold`, and on `collect`). */
  winner: Seat | null;
}

const trickCount = (s: SkatState) => s.deal?.tricks.length ?? 0;

/**
 * The reveal sequence for `moves` (the person's own move and/or the computers' moves) applied to `start`.
 * With `includeStart`, the first step shows `start` itself (e.g. a fresh deal before the computers bid).
 * Each completed trick yields its move step (held in the middle) plus a `collect` step.
 */
export function buildReveal(start: SkatState, moves: readonly ComputerMove[], includeStart: boolean): RevealStep[] {
  const steps: RevealStep[] = includeStart ? [{ kind: 'move', state: start, move: null, hold: false, winner: null }] : [];
  let current = start;
  for (const move of moves) {
    const next = applyAction(current, move.seat, move.action);
    if (!next) break; // cannot happen for decided moves; the view then simply shows the real state
    const completed = trickCount(next) > trickCount(current);
    const winner = completed && next.deal ? (trickWinners(next.deal)[trickCount(next) - 1] ?? null) : null;
    steps.push({ kind: 'move', state: next, move, hold: completed, winner });
    if (completed) steps.push({ kind: 'collect', state: next, move: null, hold: true, winner });
    current = next;
  }
  return steps;
}

/** Pause after showing `step` before the next one (or before the final picture). */
export function waitAfter(step: RevealStep, time: Timing): number {
  if (step.kind === 'collect') return time.collect;
  return step.hold ? time.hold : time.step;
}
