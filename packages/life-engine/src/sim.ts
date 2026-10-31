import type { Rng } from '@wp/game-core';
import type { EventDef } from './events';
import { drawEvents } from './events';
import type { LifeCore } from './state';

/**
 * Randomness for month `m` and a named stream. The engine asks for one Rng per (month, stream), so
 * an extra draw in one month or stream never shifts any other (common random numbers for
 * counterfactual replays, ADR 0020). Implemented with keyed draws from @wp/finance-math.
 */
export type RngFor = (month: number, stream: string) => Rng;

export type AdvanceRefusal = 'pending-events' | 'dead';

/** Monthly systems (economy, budget, mortality …) that run after the clock moves, before events. */
export type Systems<S extends LifeCore> = (state: S, rngFor: RngFor) => S;

/** One month passes: the clock moves on, the systems run, then this month's events are drawn. */
export function advanceMonth<S extends LifeCore>(state: S, defs: readonly EventDef[], rngFor: RngFor, systems?: Systems<S>):
  { ok: true; state: S } | { ok: false; reason: AdvanceRefusal } {
  if (!state.alive) return { ok: false, reason: 'dead' };
  if (state.pending.length > 0) return { ok: false, reason: 'pending-events' };
  let next: S = { ...state, month: state.month + 1 };
  if (systems !== undefined) next = systems(next, rngFor);
  if (!next.alive) return { ok: true, state: next };
  return { ok: true, state: drawEvents(defs, next, rngFor(next.month, 'events')) };
}

/**
 * Fast-forward (owner decision O2): months pass until an event is pending, the life ends, or
 * `maxMonths` have passed. Always started by the player; it never runs on its own.
 */
export function advanceUntilEvent<S extends LifeCore>(state: S, defs: readonly EventDef[], rngFor: RngFor, maxMonths: number, systems?: Systems<S>):
  { state: S; months: number; stop: 'event' | 'dead' | 'limit' | AdvanceRefusal } {
  let s = state;
  for (let i = 0; i < maxMonths; i++) {
    const r = advanceMonth(s, defs, rngFor, systems);
    if (!r.ok) return { state: s, months: i, stop: r.reason };
    s = r.state;
    if (!s.alive) return { state: s, months: i + 1, stop: 'dead' };
    if (s.pending.length > 0) return { state: s, months: i + 1, stop: 'event' };
  }
  return { state: s, months: maxMonths, stop: 'limit' };
}
