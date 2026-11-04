import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/maps';
import { ENDLESS_WAVES, isValidState, MAX_CREDITS, newGame, resolveWave, startWave, wavesHeld, type TdState } from '../src/rules';
import { planBuild } from './bots';

/**
 * Endless (design § 15.11): every game ends by wave ENDLESS_WAVES, whatever the defence, and every
 * save on the way is valid. The mixed planner shows how far a good defence gets.
 */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
function endless(mapId: string, rich: boolean): TdState {
  let s = newGame(7, 'standard', mapId, 'endless');
  if (rich) s = { ...s, credits: MAX_CREDITS };
  while (s.phase === 'build') {
    s = planBuild(s);
    expect(isValidState(clone(s))).toBe(true);
    s = resolveWave(startWave(s)).state;
    expect(isValidState(clone(s))).toBe(true);
  }
  return s;
}

describe('endless', () => {
  it.each(MAPS.map((m) => m.id))('%s: the mixed planner holds beyond the map’s waves, then the game ends, before wave 60', (mapId) => {
    const end = endless(mapId, false);
    console.log(`endless ${mapId}: ${end.phase}${end.worn ? ' (worn down)' : ''}, waves held ${wavesHeld(end)}`);
    expect(['lost', 'ended']).toContain(end.phase);
    expect(end.wave).toBeLessThan(ENDLESS_WAVES);
    expect(wavesHeld(end)).toBeGreaterThan(MAPS.find((m) => m.id === mapId)!.waves.length);
  }, 1_800_000);

  it('with every credit there is from the start, the defence still ends by the wear-down at the latest', () => {
    const end = endless('fork', true);
    console.log(`endless fork, rich: ${end.phase}${end.worn ? ' (worn down)' : ''}, waves held ${wavesHeld(end)}`);
    expect(['lost', 'ended']).toContain(end.phase);
    expect(end.wave).toBeLessThan(ENDLESS_WAVES);
  }, 1_800_000);
});
