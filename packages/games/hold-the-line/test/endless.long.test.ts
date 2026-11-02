import { describe, expect, it } from 'vitest';
import { applyPlan, isValidState, lockRound, MAX_CREDITS, MAX_ROUNDS, newGame, stepBattle, type GameOptions, type HoldState, type Planner } from '../src/rules';
import { turtlePlan } from './turtle';

/**
 * Every endless game ends (review of PR #107, blocker B1): even the strongest plain defence, every
 * pad filled and upgraded with as many credits as a side can hold, falls by round MAX_ROUNDS, in every
 * mode; and every save on the way, between the steps of each plan and during each battle, is valid.
 */
const LONG = 900_000;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function turtleGame(mapId: string, options: GameOptions, mix: readonly string[]): { end: HoldState; rounds: number } {
  let s = newGame(5, 'normal', mapId, options);
  // As rich as a side can be, from the start.
  for (const side of s.solo ? [0] : [0, 1]) {
    s.sides[side]!.credits = MAX_CREDITS;
    s.roundStart.sides[side]!.credits = MAX_CREDITS;
  }
  expect(isValidState(clone(s))).toBe(true);
  const other: Planner = (seen) => turtlePlan(seen, 1, mix);
  while (s.phase === 'plan') {
    for (const cmd of turtlePlan(s, 0, mix)) {
      s = applyPlan(s, 0, cmd);
      expect(isValidState(clone(s)), `round ${s.round + 1}, planning`).toBe(true);
    }
    s = lockRound(s, other);
    while (s.phase === 'battle') {
      s = stepBattle(s, 150).state;
      expect(isValidState(clone(s)), `round ${s.round + 1}, tick ${s.run?.tick ?? 'end'}`).toBe(true);
    }
  }
  return { end: s, rounds: s.round + 1 };
}

/**
 * The strongest of these defences in a sweep of every level-3 kind alone and two mixes (2026-11-02):
 * Focus lasers alone against the outside force (round 23 alone), and the mix of guns, lasers and
 * amplifiers in the Duel (held until the wear-down, round 47).
 */
const MIXES: readonly (readonly string[])[] = [['focus-2'], ['gatling-2', 'focus-2', 'amplifier-2', 'cannon-2']];
const MODES = [
  ['alone against the outside force', 'crossing', { solo: true }],
  ['outside force', 'crossing', {}],
  ['duel', 'duel', {}]
] as const;

describe('every endless game ends, whatever the defence', () => {
  it.each(MODES.flatMap(([name, mapId, options]) => MIXES.map((mix) => [name, mix.join(' + '), mapId, options, mix] as const)))(
    '%s, %s everywhere: a full-pad, max-credit defence falls by round MAX_ROUNDS, and every save is valid',
    (name, label, mapId, options, mix) => {
      const { end, rounds } = turtleGame(mapId, options, mix);
      expect(['won', 'lost', 'draw']).toContain(end.phase);
      expect(end.sides[0].core === 0 || end.sides[1].core === 0).toBe(true);
      expect(rounds).toBeLessThanOrEqual(MAX_ROUNDS);
      console.info(`${name}, ${label}: ended in round ${rounds} (${end.phase}, cores ${end.sides[0].core}/${end.sides[1].core})`);
    },
    LONG
  );
});
