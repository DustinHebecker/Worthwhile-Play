import { describe, expect, it } from 'vitest';
import { canonicalJson, worldHash } from '@wp/strategy-engine';
import { seedFromString } from '@wp/game-core';
import { applyCommand, newGame, resolveWave, startWave, type BuildCommand, type TdState } from '../src/rules';

/**
 * Golden replays (docs/design/tower-defense.md § 11.4): fixed builds on every map with a known end
 * state. A deliberate rules or balance change updates these hashes in the same commit, so such
 * changes are visible in review; an accidental one fails here.
 */
const BUILD: Record<string, BuildCommand[][]> = {
  training: [[{ t: 'place', kind: 'gun', x: 2, y: 2 }, { t: 'place', kind: 'gun', x: 2, y: 4 }], [{ t: 'place', kind: 'laser', x: 2, y: 5 }], [{ t: 'upgrade', id: 1, kind: 'cannon' }]],
  fork: [[{ t: 'place', kind: 'gun', x: 3, y: 4 }, { t: 'place', kind: 'support', x: 3, y: 6 }], [{ t: 'place', kind: 'artillery', x: 3, y: 8 }]],
  bend: [[{ t: 'place', kind: 'laser', x: 1, y: 3 }, { t: 'place', kind: 'gun', x: 5, y: 1 }], [{ t: 'place', kind: 'specialist', x: 3, y: 7 }]],
  twin: [[{ t: 'place', kind: 'gun', x: 1, y: 1 }, { t: 'place', kind: 'gun', x: 5, y: 1 }], [{ t: 'upgrade', id: 1, kind: 'gatling' }]]
};

const play = (mapId: string): TdState => {
  let s = newGame(11, 'standard', mapId);
  for (const wave of BUILD[mapId]!) {
    for (const cmd of wave) s = applyCommand(s, cmd);
    if (s.phase === 'build') s = resolveWave(startWave(s)).state;
  }
  return s;
};

/** [world hash, whole-state hash] after the build above (seed 11, standard). */
const GOLDEN: Record<string, readonly [number, number]> = {
  training: [1603014977, 3405912542],
  fork: [5831435, 3890373243],
  bend: [3748166587, 2253083412],
  twin: [3798847199, 2127180923]
};

describe('golden replays', () => {
  it.each(Object.keys(BUILD))('%s', (mapId) => {
    const s = play(mapId);
    expect([worldHash(s.world), seedFromString(canonicalJson(s))]).toEqual(GOLDEN[mapId]);
  });
});
