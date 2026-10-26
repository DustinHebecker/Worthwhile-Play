import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { EVENTS } from '../src/events';
import {
  AXIS_YEAR, BP_YEAR, EARTH_AGE, U_MAX, U_MIN, Y_MAX, Y_MIN, age, clampYear, entryToYear, eraOf, fromBce, fromBp, normalise, regimeOf, roundSig, sep,
  snapStep, snapYear, toBce, u, yearAtU, yearToEntry, yearsBetween
} from '../src/time';

describe('time model (design § 5)', () => {
  it('pins the constants', () => {
    expect([AXIS_YEAR, BP_YEAR, EARTH_AGE, Y_MAX, Y_MIN]).toEqual([2030, 1950, 4.54e9, 2020, 1950 - 5e9]);
    expect(U_MIN).toBe(1);
    expect(U_MAX).toBeCloseTo(Math.log10(5e9 + 80), 12);
  });

  it('converts n BCE ↔ 1 − n (round trip) and has no year 0', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 1e7 }), (n) => toBce(fromBce(n)) === n && fromBce(n) <= 0));
    expect(fromBce(1)).toBe(0);
    expect(fromBce(44)).toBe(-43);
    expect(yearsBetween(fromBce(1), 1)).toBe(1);
    expect(yearsBetween(fromBce(44), 14)).toBe(57);
  });

  it('counts "before present" from 1950', () => {
    expect(fromBp(0)).toBe(1950);
    expect(fromBp(14_400)).toBe(-12_450);
    expect(fromBp(66e6)).toBe(1950 - 66e6);
  });

  it('measures age and the log scale from 2030', () => {
    expect(age(2020)).toBe(10);
    expect(u(2020)).toBe(1);
    expect(u(1930)).toBe(2);
    fc.assert(fc.property(fc.integer({ min: Y_MIN, max: Y_MAX }), (y) => Math.abs(yearAtU(u(y)) - y) <= Math.max(1e-6, Math.abs(y) * 1e-12)));
  });

  it('normalises every event so that lo ≤ y ≤ hi', () => {
    for (const e of EVENTS) {
      const w = normalise(e);
      expect(w.lo, e.id).toBeLessThanOrEqual(w.y);
      expect(w.y, e.id).toBeLessThanOrEqual(w.hi);
      expect(Number.isInteger(w.y) && Number.isInteger(w.lo) && Number.isInteger(w.hi), e.id).toBe(true);
    }
    expect(normalise({ kind: 'span', unit: 'year', lo: -2599, hi: -1999 })).toEqual({ y: -2299, lo: -2599, hi: -1999 });
    expect(normalise({ kind: 'point', unit: 'ago', at: 14_400, lo: 14_600, hi: 14_200 })).toEqual({ y: -12_450, lo: -12_650, hi: -12_250 });
    // A span's midpoint is floored (−2.5 → −3).
    expect(normalise({ kind: 'span', unit: 'year', lo: -5, hi: 0 }).y).toBe(-3);
  });

  it('derives the era with exact boundaries', () => {
    expect(eraOf(1950 - 1_000_000)).toBe('deep');
    expect(eraOf(1950 - 999_999)).toBe('early');
    expect(eraOf(499)).toBe('early');
    expect(eraOf(500)).toBe('middle');
    expect(eraOf(1799)).toBe('middle');
    expect(eraOf(1800)).toBe('modern');
  });

  it('derives the display regime with exact boundaries', () => {
    expect(regimeOf(-10_000)).toBe('ago');
    expect(regimeOf(-9999)).toBe('bce');
    expect(regimeOf(0)).toBe('bce');
    expect(regimeOf(1)).toBe('ceEarly');
    expect(regimeOf(999)).toBe('ceEarly');
    expect(regimeOf(1000)).toBe('ce');
  });

  it('snaps to three significant digits of age, at least one year', () => {
    expect(snapStep(2020)).toBe(1);
    expect(snapStep(1931)).toBe(1);
    expect(snapStep(1930)).toBe(1);
    expect(snapStep(1029)).toBe(10);
    expect(snapStep(fromBp(66e6))).toBe(100_000);
    expect(snapYear(1969.4)).toBe(1969);
    expect(snapYear(1455)).toBe(1455);
    expect(snapYear(1029)).toBe(1030);
    expect(snapYear(fromBp(66_012_345))).toBe(AXIS_YEAR - 66_000_000);
    fc.assert(
      fc.property(fc.double({ min: Y_MIN - 1e6, max: Y_MAX + 100, noNaN: true }), (y) => {
        const s = snapYear(y);
        return Number.isInteger(s) && s >= Y_MIN && s <= Y_MAX && Math.abs(s - clampYear(y)) <= snapStep(clampYear(y)) / 2 + 1;
      })
    );
  });

  it('reads typed entries in every unit', () => {
    expect(entryToYear(1969, 'ce', 2026)).toEqual({ ok: true, y: 1969 });
    expect(entryToYear(2560, 'bce', 2026)).toEqual({ ok: true, y: -2559 });
    expect(entryToYear(1, 'bce', 2026)).toEqual({ ok: true, y: 0 });
    expect(entryToYear(57, 'ago', 2026)).toEqual({ ok: true, y: 1969 });
    expect(entryToYear(14.4, 'ka', 2026)).toEqual({ ok: true, y: 2026 - 14_400 });
    expect(entryToYear(66, 'ma', 2026)).toEqual({ ok: true, y: 2026 - 66e6 });
    expect(entryToYear(4.54, 'ga', 2026)).toEqual({ ok: true, y: 2026 - 4.54e9 });
    expect(entryToYear(2021, 'ce', 2026)).toEqual({ ok: false, reason: 'tooRecent' });
    expect(entryToYear(5, 'ago', 2026)).toEqual({ ok: false, reason: 'tooRecent' });
    expect(entryToYear(6, 'ga', 2026)).toEqual({ ok: false, reason: 'tooOld' });
    expect(entryToYear(0, 'ce', 2026)).toEqual({ ok: false, reason: 'zero' });
    expect(entryToYear(0.2, 'ce', 2026)).toEqual({ ok: false, reason: 'zero' });
    expect(entryToYear(Number.NaN, 'ce', 2026)).toEqual({ ok: false, reason: 'zero' });
  });

  it('shows axis years in the field in a fitting unit', () => {
    expect(yearToEntry(1969, 2026)).toEqual({ unit: 'ce', value: 1969 });
    expect(yearToEntry(0, 2026)).toEqual({ unit: 'bce', value: 1 });
    expect(yearToEntry(-9999, 2026)).toEqual({ unit: 'bce', value: 10_000 });
    expect(yearToEntry(-12_450, 2026)).toEqual({ unit: 'ago', value: 14_500 });
    expect(yearToEntry(2026 - 66e6, 2026)).toEqual({ unit: 'ma', value: 66 });
    expect(yearToEntry(2026 - 4.54e9, 2026)).toEqual({ unit: 'ga', value: 4.54 });
    // Typed back in its unit, the value lands within the snapping resolution.
    fc.assert(
      fc.property(fc.integer({ min: Y_MIN, max: Y_MAX }), (y) => {
        const e = yearToEntry(y, 2026);
        const r = entryToYear(e.value, e.unit, 2026);
        return r.ok && Math.abs(r.y - y) <= Math.max(1, (2026 - y) * 0.006);
      })
    );
  });

  it('separates ranges on the log scale (0 when they overlap)', () => {
    expect(sep({ lo: 1900, hi: 1950 }, { lo: 1940, hi: 2000 })).toBe(0);
    expect(sep({ lo: 1900, hi: 1930 }, { lo: 2020, hi: 2020 })).toBeCloseTo(1, 12);
    expect(sep({ lo: 2020, hi: 2020 }, { lo: 1900, hi: 1930 })).toBeCloseTo(1, 12);
    expect(roundSig(14_449, 3)).toBe(14_400);
  });
});
