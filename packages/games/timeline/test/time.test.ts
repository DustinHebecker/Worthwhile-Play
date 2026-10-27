import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ALL } from '../src/data';
import { EVENTS } from '../src/events';
import { scoreYear } from '../src/score';
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
    // Recent "years ago" count back from the current year …
    expect(entryToYear(57, 'ago', 2026)).toEqual({ ok: true, y: 1969 });
    expect(entryToYear(57, 'ago', 2030)).toEqual({ ok: true, y: 1973 });
    expect(entryToYear(11_949, 'ago', 2026)).toEqual({ ok: true, y: 2026 - 11_949 });
    // … dates older than 10,000 BCE from 1950, as they are shown (§ 5.1).
    expect(entryToYear(11_950, 'ago', 2026)).toEqual({ ok: true, y: -10_000 });
    expect(entryToYear(12_800, 'ago', 2026)).toEqual({ ok: true, y: 1950 - 12_800 });
    expect(entryToYear(12_800, 'ago', 2100)).toEqual({ ok: true, y: 1950 - 12_800 });
    expect(entryToYear(14.4, 'ka', 2026)).toEqual({ ok: true, y: 1950 - 14_400 });
    expect(entryToYear(66, 'ma', 2026)).toEqual({ ok: true, y: 1950 - 66e6 });
    expect(entryToYear(4.54, 'ga', 2026)).toEqual({ ok: true, y: 1950 - 4.54e9 });
    expect(entryToYear(2021, 'ce', 2026)).toEqual({ ok: false, reason: 'tooRecent' });
    expect(entryToYear(5, 'ago', 2026)).toEqual({ ok: false, reason: 'tooRecent' });
    expect(entryToYear(5, 'ga', 2026)).toEqual({ ok: true, y: Y_MIN });
    expect(entryToYear(5.001, 'ga', 2026)).toEqual({ ok: false, reason: 'tooOld' });
    expect(entryToYear(0, 'ce', 2026)).toEqual({ ok: false, reason: 'zero' });
    expect(entryToYear(0.2, 'ce', 2026)).toEqual({ ok: false, reason: 'zero' });
    expect(entryToYear(Number.NaN, 'ce', 2026)).toEqual({ ok: false, reason: 'zero' });
  });

  it('shows axis years in the field in a fitting unit, deep-past years ago from 1950', () => {
    expect(yearToEntry(1969)).toEqual({ unit: 'ce', value: 1969 });
    expect(yearToEntry(0)).toEqual({ unit: 'bce', value: 1 });
    expect(yearToEntry(-9999)).toEqual({ unit: 'bce', value: 10_000 });
    expect(yearToEntry(-10_000)).toEqual({ unit: 'ago', value: 12_000 });
    expect(yearToEntry(-12_450)).toEqual({ unit: 'ago', value: 14_400 });
    expect(yearToEntry(1950 - 66e6)).toEqual({ unit: 'ma', value: 66 });
    expect(yearToEntry(1950 - 4.54e9)).toEqual({ unit: 'ga', value: 4.54 });
    // Typed back in its unit (in any current year), the value lands within the snapping resolution.
    fc.assert(
      fc.property(fc.integer({ min: Y_MIN, max: Y_MAX }), fc.integer({ min: 2026, max: 2100 }), (y, now) => {
        const e = yearToEntry(y);
        const r = entryToYear(e.value, e.unit, now);
        return r.ok && Math.abs(r.y - y) <= Math.max(1, (AXIS_YEAR - y) * 0.006);
      })
    );
  });

  it('scores any year inside an event\'s shown range, typed in the shown unit, as within the range', () => {
    // The shown "years ago" numbers: years before 1950 with at most 4 significant digits (format.ts, § 5.3).
    const shownAgo = (y: number) => roundSig(BP_YEAR - y, 4);
    const typed = (n: number): [number, 'ago' | 'ma' | 'ga'] => (n < 1e6 ? [n, 'ago'] : n < 1e9 ? [n / 1e6, 'ma'] : [n / 1e9, 'ga']);
    /** Every shown unit's part of the range scores band 0 for the value at fraction `f` between its shown ends. */
    const inside = (e: (typeof ALL)[number], f: number, now: number): boolean => {
      const bands: number[] = [];
      if (regimeOf(e.lo) === 'ago') {
        // The "years ago" part of the shown range (up to 10,000 BCE when the range reaches into BCE years).
        const older = shownAgo(e.lo);
        const newer = regimeOf(e.hi) === 'ago' ? shownAgo(e.hi) : BP_YEAR + 10_000;
        const [value, unit] = typed(Math.round(newer + f * (older - newer)));
        const r = entryToYear(value, unit, now);
        if (!r.ok) return false;
        bands.push(scoreYear(r.y, e.lo, e.hi).band);
      }
      if (regimeOf(e.hi) !== 'ago') {
        const lo = Math.max(e.lo, -9999);
        const y = Math.round(lo + f * (e.hi - lo));
        const r = y >= 1 ? entryToYear(y, 'ce', now) : entryToYear(toBce(y), 'bce', now);
        if (!r.ok) return false;
        bands.push(scoreYear(r.y, e.lo, e.hi).band);
      }
      return bands.length > 0 && bands.every((b) => b === 0);
    };
    for (const e of ALL) for (const f of [0, 0.5, 1]) expect(inside(e, f, 2026), `${e.id} at ${f}`).toBe(true);
    fc.assert(
      fc.property(fc.constantFrom(...ALL), fc.double({ min: 0, max: 1, noNaN: true }), fc.integer({ min: 2026, max: 2100 }), inside),
      { numRuns: 2000 }
    );
    // The report that started it: Clovis, shown as 13,050–12,750 years ago, typed as 12,800.
    const clovis = ALL.find((e) => e.id === 'clovis')!;
    const r = entryToYear(12_800, 'ago', 2026);
    expect(r.ok && scoreYear(r.y, clovis.lo, clovis.hi).band).toBe(0);
  });

  it('separates ranges on the log scale (0 when they overlap)', () => {
    expect(sep({ lo: 1900, hi: 1950 }, { lo: 1940, hi: 2000 })).toBe(0);
    expect(sep({ lo: 1900, hi: 1930 }, { lo: 2020, hi: 2020 })).toBeCloseTo(1, 12);
    expect(sep({ lo: 2020, hi: 2020 }, { lo: 1900, hi: 1930 })).toBeCloseTo(1, 12);
    expect(roundSig(14_449, 3)).toBe(14_400);
  });
});
