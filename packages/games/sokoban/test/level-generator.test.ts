import { createRng } from '@wp/game-core';
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { DIFFICULTIES, parseLevel } from '../src/rules';
import { climbCandidates, generateCandidates, isNearDuplicate, TIERS } from './level-generator';
import { isSolved, play, readLevel, solve } from './oracle';

describe('offline level generator (test helper)', () => {
  it('produces verified, phone-sized easy levels without crates on goals', () => {
    const tier = { ...TIERS.easy, pushes: [6, 16] as const, minStates: 0 };
    const candidates = generateCandidates(tier, createRng(7), 3000);
    expect(candidates.length).toBeGreaterThan(0);
    for (const { map, crates, pushes, path } of candidates) {
      const level = parseLevel(map);
      expect(level.width).toBeLessThanOrEqual(7);
      expect(level.height).toBeLessThanOrEqual(9);
      expect(level.boxes).toHaveLength(crates);
      expect(level.boxes.some((b) => level.goals.includes(b))).toBe(false);
      expect(pushes).toBeGreaterThanOrEqual(6);
      expect(pushes).toBeLessThanOrEqual(TIERS.easy.pushes[1]);
      const oracle = readLevel(map);
      const end = play(oracle, path);
      expect(end?.pushes).toBe(pushes);
      expect(isSolved(oracle, end!.boxes)).toBe(true);
    }
    expect(new Set(candidates.map((c) => c.map)).size).toBe(candidates.length);
  }, 60_000);

  it('hill climbing returns verified levels whose push count only grew while climbing', () => {
    const tier = { ...TIERS.easy, pushes: [1, 99] as const, minStates: 0 };
    const climbed = climbCandidates(tier, createRng(3), 6, 25);
    expect(climbed.length).toBeGreaterThan(0);
    for (const { map, pushes, path } of climbed) {
      const oracle = readLevel(map);
      expect(solve(oracle)?.pushes).toBe(pushes);
      const end = play(oracle, path);
      expect(end?.pushes).toBe(pushes);
      expect(isSolved(oracle, end!.boxes)).toBe(true);
      expect(oracle.boxes.some((b) => oracle.goals.has(b))).toBe(false);
    }
  }, 60_000);

  it('is deterministic for a seed', () => {
    const a = generateCandidates(TIERS.easy, createRng(11), 400);
    const b = generateCandidates(TIERS.easy, createRng(11), 400);
    expect(a).toEqual(b);
  }, 60_000);

  it('isNearDuplicate compares wall and goal layout only', () => {
    const base = '#####|#@$.#|#####';
    expect(isNearDuplicate(base, '#####|# $+#|#####')).toBe(true);
    expect(isNearDuplicate(base, '######|#@$. #|######')).toBe(false);
    expect(isNearDuplicate('#######|#     #|#     #|#@$  .#|#######', '#######|# ### #|# ### #|#@$# .#|#######')).toBe(false);
    expect(isNearDuplicate('#######|#     #|#     #|#@$  .#|#######', '#######|# ### #|# ### #|#@$# .#|#######', 10)).toBe(true);
  });

  it('no two shipped levels are near-duplicates of each other', () => {
    const maps = DIFFICULTIES.flatMap((d) => LEVELS[d].map((l) => l.map));
    for (let i = 0; i < maps.length; i++) {
      for (let j = i + 1; j < maps.length; j++) expect(isNearDuplicate(maps[i]!, maps[j]!), `${maps[i]} vs ${maps[j]}`).toBe(false);
    }
  });
});
