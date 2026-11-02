import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/maps';
import { newGame } from '../src/rules';
import { play, planBuild, randomBuild } from './bots';

/**
 * Balance harness (docs/design/tower-defense.md § 11.3, § 15.10), a long suite: bots play whole
 * maps through the same build commands as a person. Thresholds are deliberately loose margins, not
 * exact scores, so that small balance changes do not flip them; a deliberate change shows up here
 * first. One game per test, so no test runs near its time limit; the single-family games are in
 * balance-families.long.test.ts (a file of their own runs in parallel with this one).
 */
const FULL = MAPS.filter((m) => m.waves.length === 20).map((m) => m.id);
const SEED = 7;
/** One whole game with the look-ahead planner takes up to about a minute. */
const LONG = 300_000;

describe('balance: Tower Defense maps', () => {
  it.each(MAPS.map((m) => m.id))('%s is won on relaxed by the mixed planner', (mapId) => {
    expect(play(mapId, 'relaxed', SEED, (s) => planBuild(s)).phase).toBe('won');
  }, LONG);

  // Standard: the mix holds the whole core or nearly (measured: all of it on every map); the
  // single-family games compare against that.
  it.each(MAPS.map((m) => m.id))('%s is won on standard by the mixed planner with nearly the whole core', (mapId) => {
    const end = play(mapId, 'standard', SEED, (s) => planBuild(s));
    expect(end.phase).toBe('won');
    expect(end.core).toBeGreaterThanOrEqual(newGame(SEED, 'standard', mapId).core - 2);
  }, LONG);

  // Hard rewards planning beyond the next wave (owner, 2026-11-01): the one-wave planner need not win,
  // but it must hold at least the first fourteen of twenty waves, so Hard is not a wall early on.
  it.each(FULL)('%s on hard: the planner reaches wave 15 or wins', (mapId) => {
    // Decided once the build phase of wave 15 is reached: the rest is not played.
    const end = play(mapId, 'hard', SEED, (s) => planBuild(s), (s) => s.wave >= 14);
    if (end.phase !== 'won') expect(end.wave + 1, `${mapId} hard ended in wave ${end.wave + 1}`).toBeGreaterThanOrEqual(15);
  }, LONG);

  it.each(FULL)('%s is lost by random building on standard', (mapId) => {
    expect(play(mapId, 'standard', SEED, (s, wave) => randomBuild(s, wave + 1)).phase).toBe('lost');
  }, LONG);
});
