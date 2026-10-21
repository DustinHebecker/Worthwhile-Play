/**
 * Level grading by seeded matches (all numbers deterministic). Heads-up matches are "duplicate": every deal is
 * played twice with the seats swapped. Results in big blinds per 100 hands (bb/100) for the first player.
 * Bounds leave headroom so small tuning changes do not need new numbers, but a level that drifts out of its
 * band fails. Larger runs (4,000 hands heads-up, 3,000 hands 6-max) are reported in the agent report.
 */
import { describe, expect, it } from 'vitest';
import { callingStation, duplicateMatch, level, randomPlayer, ringMatch, tightPassive } from './sim';

describe('level grading (seeded matches)', () => {
  it('every level beats the scripted players heads-up', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(duplicateMatch(level(difficulty), callingStation, 150, 11).bb100).toBeGreaterThan(50);
      expect(duplicateMatch(level(difficulty), tightPassive, 150, 11).bb100).toBeGreaterThan(10);
      expect(duplicateMatch(level(difficulty), randomPlayer, 150, 11).bb100).toBeGreaterThan(100);
    }
  }, 60_000);

  it('medium beats easy and hard beats both heads-up', () => {
    expect(duplicateMatch(level('medium'), level('easy'), 400, 12).bb100).toBeGreaterThan(10);
    expect(duplicateMatch(level('hard'), level('easy'), 400, 12).bb100).toBeGreaterThan(30);
    expect(duplicateMatch(level('hard'), level('medium'), 400, 12).bb100).toBeGreaterThan(10);
  }, 60_000);

  it('at a full table, hard wins against easy players and calling stations', () => {
    expect(ringMatch(level('hard'), level('easy'), 6, 120, 13).bb100).toBeGreaterThan(0);
    expect(ringMatch(level('hard'), callingStation, 6, 40, 14).bb100).toBeGreaterThan(100);
  }, 60_000);
});
