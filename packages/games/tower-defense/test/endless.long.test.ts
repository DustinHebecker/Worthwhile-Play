import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/maps';
import { ENDLESS_WAVES, isValidState, newGame, resolveWave, startWave, wavesHeld, type TdState } from '../src/rules';
import { planBuild } from './bots';

/**
 * Endless (design § 15.11): every game ends before ENDLESS_WAVES and every save on the way is valid.
 * Played with little effort (two build actions per wave), which the owner expects to reach about
 * wave 20. The balance for good and very good play (50+, 80–100) is measured in § 15.11; those
 * games run 50 waves and more and are too slow for this suite.
 */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
function endless(mapId: string): TdState {
  let s = newGame(7, 'standard', mapId, 'endless');
  while (s.phase === 'build') {
    s = planBuild(s, { steps: 2, pads: 2 });
    expect(isValidState(clone(s))).toBe(true);
    s = resolveWave(startWave(s)).state;
    expect(isValidState(clone(s))).toBe(true);
  }
  return s;
}

describe('endless with little effort', () => {
  it.each(MAPS.map((m) => m.id))('%s: about 20 waves, then the game ends, every save valid', (mapId) => {
    const end = endless(mapId);
    console.log(`endless ${mapId}, little effort: ${end.phase}, waves held ${wavesHeld(end)}`);
    expect(['lost', 'ended']).toContain(end.phase);
    expect(end.wave).toBeLessThan(ENDLESS_WAVES);
    expect(wavesHeld(end)).toBeGreaterThanOrEqual(mapId === 'training' ? 8 : 15);
  }, 1_800_000);
});
