import { controllerFor, effectiveLevel, frontierDistance, PROFILES, type AiProfile } from '../src/ai';
import { createGame, mapOf, MAX_LEVEL, maxPaths, refusal, stepMut, toggleMut, type Controller, type Difficulty, type OpponentCount, type GameMap, type NcState } from '../src/rules';

/*
 * Headless match harness for stalemate measurements: plays full seeded matches between two
 * controllers and records how and when they end.
 */

/** A match counts as stalled when no node changed owner for this many ticks (5 minutes of game time). */
export const STALL_TICKS = 3000;

export interface MatchResult {
  /** 0 = the player side won, 1 = the opponent won, -1 = still running at the cap. */
  winner: number;
  ticks: number;
  /** Longest stretch without any change of node ownership. */
  quiet: number;
  stalled: boolean;
}

/**
 * Human-like scripted player: decides every `period` ticks (a person's pace), up to two path
 * changes; attacks the weakest neighbouring non-own node, stops feeding full nodes, lets interior
 * nodes supply the front. No simulation, no defence logic.
 */
export function humanProxy(period = 30, actions = 2): Controller {
  return (s: NcState, map: GameMap): void => {
    if (s.tick % period !== 3 && s.tick !== 0) return;
    const f = 0;
    let done = 0;
    const frontier = frontierDistance(s, map, f);
    const own = s.owner.flatMap((o, v) => (o === f ? [v] : []));
    for (const v of own) {
      for (const t of [...s.out[v]!]) if (s.owner[t] === f && s.level[t] === MAX_LEVEL && s.out[t]!.length === 0 && done < actions) {
        toggleMut(s, map, f, v, t);
        done++;
      }
    }
    for (const v of own) {
      if (done >= actions) return;
      if (s.out[v]!.length >= maxPaths(s.level[v]!) || (map.nodes[v]!.type === 'station' && s.level[v]! < MAX_LEVEL)) continue;
      let best = -1;
      for (const w of map.adjacent[v]!) {
        if (s.owner[w] === f || s.out[v]!.includes(w) || refusal(s, map, f, v, w)) continue;
        if (best < 0 || effectiveLevel(map, s, w) < effectiveLevel(map, s, best)) best = w;
      }
      if (best < 0 && s.out[v]!.length === 0 && frontier[v]! > 1) {
        best = map.adjacent[v]!.find((w) => s.owner[w] === f && frontier[w]! < frontier[v]! && !refusal(s, map, f, v, w)) ?? -1;
      }
      if (best >= 0) {
        toggleMut(s, map, f, v, best);
        done++;
      }
    }
  };
}

export type Side = Difficulty | 'human';

const sideProfile = (side: Side, override: Partial<AiProfile>): AiProfile | null =>
  side === 'human' ? null : { ...PROFILES[side], ...override };

/**
 * Plays a match on `map` (layout 2) until it ends or `cap` ticks have passed; `override` adjusts all
 * bots. One opponent by default (1-vs-1); with more, they all play at the `opponent` level.
 */
export function playMatch(
  seed: number,
  player: Side,
  opponent: Difficulty,
  cap: number,
  map = seed % 7,
  override: Partial<AiProfile> = {},
  opponents: OpponentCount = 1
): MatchResult {
  const s = createGame(seed, { map, difficulty: opponent, opponents });
  const m = mapOf(s);
  const bots = controllerFor([sideProfile(player, override), ...Array.from({ length: opponents }, () => sideProfile(opponent, override))]);
  const human = player === 'human' ? humanProxy() : null;
  const control: Controller = (x, mm) => {
    human?.(x, mm);
    bots(x, mm);
  };
  let last = 0;
  let quiet = 0;
  while (s.result === 'playing' && s.tick < cap) {
    const events = stepMut(s, m, control);
    if (events.captures.length > 0) last = s.tick;
    quiet = Math.max(quiet, s.tick - last);
  }
  const winner = s.result === 'won' ? 0 : s.result === 'lost' ? 1 : -1;
  return { winner, ticks: s.tick, quiet, stalled: winner < 0 || quiet >= STALL_TICKS };
}

export const quantile = (values: readonly number[], q: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
};
