import { describe, expect, it } from 'vitest';
import { FAMILIES } from '@wp/td-core';
import { MAPS } from '../src/maps';
import { play, planBuild, randomBuild } from './bots';

/**
 * Balance harness (docs/design/tower-defense.md § 11.3), a long suite: bots play whole maps through
 * the same build commands as a person. Thresholds are deliberately loose margins, not exact scores,
 * so that small balance changes do not flip them; a deliberate change shows up here first.
 */
const FULL = MAPS.filter((m) => m.waves.length === 20).map((m) => m.id);
const SEED = 7;
/** Whole games with a look-ahead planner take seconds each. */
const LONG = 300_000;

describe('balance: Tower Defense maps', () => {
  const mixed = new Map<string, number>();

  it.each(MAPS.map((m) => m.id))('%s is won on relaxed and standard by the mixed planner', (mapId) => {
    for (const difficulty of ['relaxed', 'standard'] as const) {
      const end = play(mapId, difficulty, SEED, (s) => planBuild(s));
      expect(end.phase, `${mapId} ${difficulty}`).toBe('won');
      if (difficulty === 'standard') {
        mixed.set(mapId, end.core);
        // Comfortably: at least half the core left.
        expect(end.core, mapId).toBeGreaterThanOrEqual(10);
      }
    }
  }, LONG);

  // Hard rewards planning beyond the next wave (owner, 2026-11-01): the one-wave planner need not win,
  // but it must hold at least the first fourteen of twenty waves, so Hard is not a wall early on.
  it.each(FULL)('%s on hard: the planner reaches wave 15 or wins', (mapId) => {
    const end = play(mapId, 'hard', SEED, (s) => planBuild(s));
    if (end.phase !== 'won') expect(end.wave + 1, `${mapId} hard ended in wave ${end.wave + 1}`).toBeGreaterThanOrEqual(15);
  }, LONG);

  it.each(FULL)('%s is lost by random building on standard', (mapId) => {
    expect(play(mapId, 'standard', SEED, (s, wave) => randomBuild(s, wave + 1)).phase).toBe('lost');
  }, LONG);

  // "Not just el-td": no single tower family holds every map nearly as well as a mix. On Long bend
  // lasers come close (its long straight runs suit beams); on the other full maps they fall far behind.
  it.each(FAMILIES)('only %s: clearly worse than the mixed defence on most full maps', (family) => {
    let worse = 0;
    for (const mapId of FULL) {
      const best = mixed.get(mapId) ?? play(mapId, 'standard', SEED, (s) => planBuild(s)).core;
      const end = play(mapId, 'standard', SEED, (s) => planBuild(s, { families: [family] }));
      const core = end.phase === 'won' ? end.core : 0;
      if (best - core >= 8) worse++;
    }
    expect(worse, `${family} held ${FULL.length - worse} of ${FULL.length} full maps nearly as well as a mix`).toBeGreaterThanOrEqual(FULL.length - 1);
  }, LONG);
});
