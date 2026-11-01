import { describe, expect, it } from 'vitest';
import { FAMILIES } from '@wp/td-core';
import { MAPS } from '../src/maps';
import { newGame } from '../src/rules';
import { play, planBuild } from './bots';

/**
 * "Not just el-td" (docs/design/tower-defense.md § 15.10): no single tower family holds every full
 * map nearly as well as a mix. The mixed planner keeps (nearly) the whole core on Standard
 * (balance.long.test.ts), so "clearly worse" is at least 8 core below a full core. On Long bend
 * lasers come close (its long straights suit beams); on the other full maps they fall far behind.
 * One game per test; the verdict per family comes after its three games.
 */
const FULL = MAPS.filter((m) => m.waves.length === 20).map((m) => m.id);
const SEED = 7;
const LONG = 300_000;

describe('balance: single-family defences', () => {
  const kept = new Map<string, number>();
  const cases = FAMILIES.flatMap((family) => FULL.map((mapId) => [family, mapId] as const));

  it.each(cases)('only %s on %s (standard)', (family, mapId) => {
    const end = play(mapId, 'standard', SEED, (s) => planBuild(s, { families: [family] }));
    kept.set(`${family}/${mapId}`, end.phase === 'won' ? end.core : 0);
  }, LONG);

  it.each(FAMILIES)('only %s: clearly worse than a full hold on most full maps', (family) => {
    const worse = FULL.filter((mapId) => newGame(SEED, 'standard', mapId).core - kept.get(`${family}/${mapId}`)! >= 8).length;
    expect(
      worse,
      `${family} kept ${FULL.map((m) => kept.get(`${family}/${m}`)).join('/')} of ${newGame(SEED, 'standard', FULL[0]!).core}`
    ).toBeGreaterThanOrEqual(FULL.length - 1);
  });
});
