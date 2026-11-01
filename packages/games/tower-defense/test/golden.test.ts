import { describe, expect, it } from 'vitest';
import { canonicalJson, worldHash } from '@wp/strategy-engine';
import { seedFromString } from '@wp/game-core';
import { applyCommand, checkCommand, newGame, resolveWave, startWave, type BuildCommand, type TdState } from '../src/rules';

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

/** [phase, core, world hash, whole-state hash] at the end of the 12-wave game below. */
const GOLDEN_FULL: readonly [string, number, number, number] = ['won', 11, 576951089, 1260280912];

describe('golden replays', () => {
  it.each(Object.keys(BUILD))('%s', (mapId) => {
    const s = play(mapId);
    expect([worldHash(s.world), seedFromString(canonicalJson(s))]).toEqual(GOLDEN[mapId]);
  });
});

/**
 * A whole 12-wave game on Fork (seed 11, relaxed) with a fixed build order that uses every branch C:
 * before each wave the queue is worked off in order until a command is refused (usually: credits).
 * It reaches the last wave, so edits to the late waves (Shield bearers, Menders, the crawler) and to
 * the branch-C towers change this hash.
 */
/** Place a level-1 kind on a cell, or upgrade whatever stands there into `kind`. */
const FULL_QUEUE: readonly (readonly [string, number, number])[] = [
  ['gun', 3, 4],
  ['gun', 3, 6],
  ['gun', 2, 10],
  ['gun', 4, 10],
  ['laser', 3, 8],
  ['cannon', 3, 6],
  ['support', 2, 11],
  ['prism', 3, 8],
  ['gatling', 3, 4],
  ['specialist', 4, 11],
  ['amplifier', 2, 11],
  ['cannon', 2, 10],
  ['corroder', 4, 11],
  ['gatling', 4, 10],
  ['cannon-2', 3, 6],
  ['prism-2', 3, 8],
  ['amplifier-2', 2, 11],
  ['corroder-2', 4, 11],
  ['cannon-2', 2, 10],
  ['gatling-2', 3, 4],
  ['gatling-2', 4, 10]
];

const commandOf = (s: TdState, [kind, x, y]: readonly [string, number, number]): BuildCommand => {
  const there = s.world.entities.find((e) => e.x === x && e.y === y);
  return there ? { t: 'upgrade', id: there.id, kind } : { t: 'place', kind, x, y };
};

const playFull = (): { end: TdState; reached: number; bought: number } => {
  let s = newGame(11, 'relaxed', 'fork');
  let i = 0;
  let reached = 0;
  while (s.phase === 'build') {
    while (i < FULL_QUEUE.length && checkCommand(s, commandOf(s, FULL_QUEUE[i]!)) === null) s = applyCommand(s, commandOf(s, FULL_QUEUE[i++]!));
    reached = s.wave + 1;
    s = resolveWave(startWave(s)).state;
  }
  return { end: s, reached, bought: i };
};

describe('golden replay through all twelve waves', () => {
  it('fork, relaxed, branch C: reaches wave 12 with a known end state', () => {
    const { end, reached, bought } = playFull();
    expect(reached).toBe(12);
    // Every branch C reached level 2, Prism and Amplifier level 3 (the queue up to 'amplifier-2').
    expect(bought).toBeGreaterThanOrEqual(FULL_QUEUE.findIndex(([k]) => k === 'amplifier-2') + 1);
    expect([end.phase, end.core, worldHash(end.world), seedFromString(canonicalJson(end))]).toEqual(GOLDEN_FULL);
  });
});
