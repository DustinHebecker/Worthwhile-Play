import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { FIT_MARGIN, fitCell, MAX_CELL, MIN_CELL } from '../src/layout';

describe('fitCell (design v3 § 4.2)', () => {
  it('the phone budgets of the plan: 360 × 640 and 390 × 664 with about 305 px of chrome; desktop', () => {
    // Square 48: 6 px cells (300 px) at 360 × 640, 7 px at 390 × 664; wide 64 × 48: 5 px (252 px).
    expect(fitCell({ availW: 344, availH: 640, w: 48, h: 48, track: 6, chrome: 305 })).toBe(6);
    expect(fitCell({ availW: 344, availH: 640, w: 64, h: 48, track: 6, chrome: 305 })).toBe(5);
    expect(fitCell({ availW: 374, availH: 664, w: 48, h: 48, track: 6, chrome: 305 })).toBe(7);
    // Desktop: limited by the width, or by the height.
    expect(fitCell({ availW: 700, availH: 800, w: 32, h: 32, track: 6, chrome: 40 })).toBe(21);
    expect(fitCell({ availW: 900, availH: 600, w: 32, h: 32, track: 6, chrome: 40 })).toBe(16);
  });

  it('never below 5 or above 24; 0 while the width is unknown', () => {
    expect(fitCell({ availW: 2000, availH: 4000, w: 8, h: 8, track: 6, chrome: 0 })).toBe(MAX_CELL);
    expect(fitCell({ availW: 100, availH: 100, w: 64, h: 48, track: 6, chrome: 400 })).toBe(MIN_CELL);
    expect(fitCell({ availW: 0, availH: 800, w: 32, h: 32, track: 6, chrome: 0 })).toBe(0);
    expect(fitCell({ availW: Number.NaN, availH: 800, w: 32, h: 32, track: 6, chrome: 0 })).toBe(0);
    // An unknown height limits by the width only.
    expect(fitCell({ availW: 344, availH: 0, w: 32, h: 32, track: 6, chrome: 300 })).toBe(10);
  });

  const input = fc.record({
    availW: fc.integer({ min: 1, max: 2000 }),
    availH: fc.integer({ min: 1, max: 2000 }),
    w: fc.integer({ min: 4, max: 64 }),
    h: fc.integer({ min: 4, max: 64 }),
    track: fc.integer({ min: 0, max: 10 }),
    chrome: fc.integer({ min: 0, max: 900 })
  });

  it('bounded, monotone in the height and the width, and the unit fits whenever a cell of 5 fits (property)', () => {
    fc.assert(
      fc.property(input, fc.integer({ min: 0, max: 500 }), (x, more) => {
        const cell = fitCell(x);
        expect(cell).toBeGreaterThanOrEqual(MIN_CELL);
        expect(cell).toBeLessThanOrEqual(MAX_CELL);
        expect(fitCell({ ...x, availH: x.availH + more })).toBeGreaterThanOrEqual(cell);
        expect(fitCell({ ...x, availW: x.availW + more })).toBeGreaterThanOrEqual(cell);
        expect(fitCell({ ...x, chrome: x.chrome + more })).toBeLessThanOrEqual(cell);
        if (cell > MIN_CELL) {
          expect(x.chrome + 2 * x.track + x.h * cell + FIT_MARGIN).toBeLessThanOrEqual(x.availH);
          expect(2 * x.track + x.w * cell).toBeLessThanOrEqual(x.availW);
        }
        if (x.chrome + 2 * x.track + x.h * MIN_CELL + FIT_MARGIN <= x.availH && 2 * x.track + x.w * MIN_CELL <= x.availW) {
          expect(x.chrome + 2 * x.track + x.h * cell + FIT_MARGIN).toBeLessThanOrEqual(x.availH);
        }
      }),
      { numRuns: 500 }
    );
  });
});
