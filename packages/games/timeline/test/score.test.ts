import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  BAND_LIMITS, bandOf, fairRung, gapOptions, isGapLadder, isNice, kendallPairs, ladder, nice, orderMark, pairsTotal, rungOf, rungValue, scoreYear, tauFor
} from '../src/score';
import { AXIS_YEAR, Y_MAX, Y_MIN } from '../src/time';

/** The year whose distance from `y*` (on the older side) is exactly `m` milli-decades. */
const olderBy = (yStar: number, m: number) => AXIS_YEAR - (AXIS_YEAR - yStar) * 10 ** (m / 1000);

describe('scoring a "when" guess (design § 7.3)', () => {
  it('pins the band limits', () => {
    expect(BAND_LIMITS).toEqual([20, 60, 150]);
  });

  it('is 0 / band 0 for every guess inside the range', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1e6, max: 2000 }), fc.integer({ min: 0, max: 1000 }), fc.double({ min: 0, max: 1, noNaN: true }), (lo, w, f) => {
        const g = Math.round(lo + f * w);
        const r = scoreYear(g, lo, lo + w);
        return r.milli === 0 && r.band === 0 && r.off === 0 && r.signed === 0;
      })
    );
  });

  it('places the band boundaries exactly at 20, 60 and 150 milli-decades', () => {
    expect(bandOf(0, true)).toBe(0);
    expect(bandOf(0, false)).toBe(1);
    expect(bandOf(20, false)).toBe(1);
    expect(bandOf(21, false)).toBe(2);
    expect(bandOf(60, false)).toBe(2);
    expect(bandOf(61, false)).toBe(3);
    expect(bandOf(150, false)).toBe(3);
    expect(bandOf(151, false)).toBe(4);
  });

  it('scores both sides symmetrically on the log scale', () => {
    // Great Pyramid: 2600–2500 BCE.
    const lo = -2599;
    const hi = -2499;
    const older = scoreYear(Math.round(olderBy(lo, 100)), lo, hi);
    const newer = scoreYear(Math.round(AXIS_YEAR - (AXIS_YEAR - hi) / 10 ** 0.1), lo, hi);
    expect(older.milli).toBe(100);
    expect(newer.milli).toBe(100);
    expect(older.band).toBe(3);
    expect(older.signed).toBeGreaterThan(0);
    expect(newer.signed).toBeLessThan(0);
    expect(older.off).toBe(-2599 - Math.round(olderBy(lo, 100)));
  });

  it('matches the worked table of the design (Moon landing about ±2–3 years spot on)', () => {
    expect(scoreYear(1967, 1969, 1969).band).toBe(1);
    expect(scoreYear(1971, 1969, 1969).band).toBe(1);
    expect(scoreYear(1972, 1969, 1969).band).toBe(2);
    expect(scoreYear(1960, 1969, 1969).band).toBe(2);
    expect(scoreYear(1950, 1969, 1969).band).toBe(3);
    expect(scoreYear(1900, 1969, 1969).band).toBe(4);
  });

  it('grows with the distance outside the range (monotone)', () => {
    fc.assert(
      fc.property(fc.integer({ min: Y_MIN, max: 1900 }), fc.integer({ min: 1, max: 1e8 }), fc.integer({ min: 1, max: 1e8 }), (y, a, b) => {
        const [near, far] = a < b ? [a, b] : [b, a];
        const g1 = Math.max(Y_MIN, y - near);
        const g2 = Math.max(Y_MIN, y - far);
        return scoreYear(g1, y, y).milli <= scoreYear(g2, y, y).milli;
      })
    );
  });

  it('is scale-free: age·k and age/k give the same distance', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 1e8 }), fc.double({ min: 1.01, max: 5, noNaN: true }), (a, k) => {
        const y = AXIS_YEAR - a;
        const g1 = AXIS_YEAR - a * k;
        const g2 = AXIS_YEAR - a / k;
        return Math.abs(scoreYear(g1, y, y).signed + scoreYear(g2, y, y).signed) < 1e-9;
      })
    );
  });
});

describe('order, gaps and windows', () => {
  it('counts concordant pairs (Kendall agreement)', () => {
    const rank = (id: string) => ['a', 'b', 'c', 'd'].indexOf(id);
    expect(kendallPairs(['a', 'b', 'c', 'd'], rank)).toBe(6);
    expect(kendallPairs(['d', 'c', 'b', 'a'], rank)).toBe(0);
    expect(kendallPairs(['b', 'a', 'c', 'd'], rank)).toBe(5);
    expect(pairsTotal(6)).toBe(15);
    expect([orderMark(10, 10), orderMark(8, 10), orderMark(5, 10), orderMark(4, 10)]).toEqual([0, 2, 3, 4]);
    expect(orderMark(7, 10)).toBe(3);
  });

  it('builds the ladders with one significant digit', () => {
    expect(ladder('medium')).toEqual([10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9]);
    expect(ladder('hard').slice(0, 5)).toEqual([10, 30, 100, 300, 1000]);
    expect(ladder('hard').at(-1)).toBe(3e9);
    expect(rungValue('hard', 3)).toBe(30);
  });

  it('puts gaps on rungs with boundaries at half steps', () => {
    expect(rungOf('medium', 31)).toBe(1);
    expect(rungOf('medium', 32)).toBe(2);
    expect(rungOf('medium', 3)).toBeNull();
    expect(rungOf('medium', 0)).toBeNull();
    expect(rungOf('hard', 17)).toBe(2);
    expect(rungOf('hard', 18)).toBe(3);
    expect(rungOf('hard', 5e9)).toBe(19);
    expect(rungOf('hard', 1e10)).toBeNull();
  });

  it('asks the gap only when the shortest and the longest gap share a rung', () => {
    // Great Pyramid → last mammoths: 300 to 700 years (rungs 100 and 1000): unfair.
    expect(fairRung('medium', { lo: -2599, hi: -2499 }, { lo: -2199, hi: -1899 })).toBeNull();
    expect(fairRung('hard', { lo: -2599, hi: -2499 }, { lo: -2199, hi: -1899 })).toBeNull();
    expect(fairRung('medium', { lo: -2599, hi: -2499 }, { lo: 1969, hi: 1969 })).toBe(4);
    expect(fairRung('medium', { lo: 1900, hi: 1910 }, { lo: 1950, hi: 1960 })).toBe(2);
    // 1843 → 1876: 33 years — between rungs 10 and 100 (boundary 31.6) but fair: both ends give 33.
    expect(fairRung('medium', { lo: 1843, hi: 1843 }, { lo: 1876, hi: 1876 })).toBe(2);
    // Shortest 20 (rung 10) and longest 60 (rung 100): unfair.
    expect(fairRung('medium', { lo: 1900, hi: 1920 }, { lo: 1940, hi: 1960 })).toBeNull();
  });

  it('offers four consecutive rungs containing the right one, clamped at the ends', () => {
    fc.assert(
      fc.property(fc.constantFrom<'medium' | 'hard'>('medium', 'hard'), fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 3 }), (level, k0, pos) => {
        const [min, max] = level === 'medium' ? [1, 9] : [2, 19];
        const k = min + (k0 % (max - min + 1));
        const o = gapOptions(level, k, pos);
        return isGapLadder(level, o.values) && o.values[o.index] === rungValue(level, k) && o.index >= 0 && o.index <= 3;
      })
    );
    expect(gapOptions('medium', 1, 3)).toEqual({ values: [10, 100, 1000, 1e4], index: 0 });
    expect(gapOptions('medium', 9, 0)).toEqual({ values: [1e6, 1e7, 1e8, 1e9], index: 3 });
    expect(isGapLadder('medium', [10, 100, 1000])).toBe(false);
    expect(isGapLadder('medium', [10, 1000, 100, 1e4])).toBe(false);
  });

  it('rounds the window to 1, 2, 5 × 10^k', () => {
    expect(tauFor(1450)).toBe(50);
    expect(tauFor(-2559)).toBe(500);
    expect(tauFor(1950 - 66e6)).toBe(5e6);
    expect(tauFor(2019)).toBe(10);
    expect(nice(58)).toBe(50);
    expect(nice(75)).toBe(100);
    expect(isNice(50)).toBe(true);
    expect(isNice(30)).toBe(false);
    expect(isNice(5)).toBe(false);
    expect(isNice('50')).toBe(false);
  });
});
