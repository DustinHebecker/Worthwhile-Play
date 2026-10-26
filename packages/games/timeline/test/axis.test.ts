import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { FULL, TICK_CATALOGUE, minWidthAt, chooseTicks, clampWindow, fitYears, generatedTicks, layoutLabels, pan, windowYears, xOf, yearAt, zoomAt, type AxisView, type Tick, type Window } from '../src/axis';
import { COMMON_MESSAGES, createTranslator } from '@wp/localization';
import { formatTick } from '../src/format';
import { messages } from '../src/messages';
import { U_MAX, U_MIN, u } from '../src/time';

const views: AxisView[] = ['log', 'linear'];
const windowArb = fc
  .tuple(fc.double({ min: U_MIN, max: U_MAX, noNaN: true }), fc.double({ min: U_MIN, max: U_MAX, noNaN: true }))
  .map(([a, b]): Window => clampWindow({ lo: Math.min(a, b), hi: Math.max(a, b) }));
const label = (t: Tick) => (t.ago ? `${(1950 - t.y) / 1e6}M ago` : String(t.y));
const width = (s: string) => s.length * 6.6;

describe('axis mapping (design § 12.1)', () => {
  it('puts the past on the left and today on the right', () => {
    expect(xOf(-4.5e9, FULL, 'log')).toBeLessThan(xOf(1969, FULL, 'log'));
    expect(xOf(2020, FULL, 'log')).toBeCloseTo(1, 12);
    expect(xOf(1950 - 5e9, FULL, 'log')).toBeCloseTo(0, 9);
    expect(xOf(-4.5e9, FULL, 'linear')).toBeLessThan(xOf(1969, FULL, 'linear'));
    // In the even view all of recorded history is a sliver at the right edge.
    expect(xOf(-3000, FULL, 'linear')).toBeGreaterThan(0.999);
  });

  it('round-trips x ↔ year in both views', () => {
    fc.assert(
      fc.property(windowArb, fc.double({ min: 0, max: 1, noNaN: true }), fc.constantFrom(...views), (w, x, v) => {
        const y = yearAt(x, w, v);
        return Math.abs(xOf(y, w, v) - x) < 1e-6;
      })
    );
  });

  it('keeps the point under the pointer fixed when zooming', () => {
    fc.assert(
      fc.property(windowArb, fc.double({ min: 0.05, max: 0.95, noNaN: true }), fc.double({ min: 1.1, max: 4, noNaN: true }), fc.constantFrom(...views), (w, x, f, v) => {
        const y = yearAt(x, w, v);
        const z = zoomAt(w, x, f, v);
        const atMin = z.hi - z.lo <= minWidthAt(z.lo) + 1e-9;
        const narrowed = z.hi - z.lo < w.hi - w.lo || atMin;
        // Fixed point (unless the window had to be shifted back into the scale at an end or hit the minimum width).
        const fixed = Math.abs(xOf(y, z, v) - x) < 1e-6 || z.lo <= U_MIN + 1e-9 || z.hi >= U_MAX - 1e-9 || atMin;
        return narrowed && fixed;
      })
    );
  });

  it('clamps windows into the scale and to the minimum width', () => {
    fc.assert(
      fc.property(fc.double({ min: -50, max: 50, noNaN: true }), fc.double({ min: -50, max: 50, noNaN: true }), (a, b) => {
        const w = clampWindow({ lo: a, hi: b });
        return w.lo >= U_MIN - 1e-9 && w.hi <= U_MAX + 1e-9 && w.hi - w.lo >= minWidthAt(w.lo) - 1e-9 && 10 ** w.hi - 10 ** w.lo >= 20 - 1e-6;
      })
    );
    expect(clampWindow({ lo: -Infinity, hi: Infinity })).toEqual(FULL);
    expect(zoomAt(FULL, 0.5, 1 / 3, 'log')).toEqual(FULL);
    expect(zoomAt(FULL, 0.5, Number.NaN, 'log')).toBe(FULL);
  });

  it('pans towards the present and back, staying in the scale', () => {
    const w = clampWindow({ lo: 2, hi: 3 });
    const right = pan(w, 0.5, 'log');
    expect(right.lo).toBeCloseTo(1.5, 9);
    expect(pan(right, -0.5, 'log').lo).toBeCloseTo(2, 9);
    expect(pan(clampWindow({ lo: 1, hi: 2 }), 1, 'log').lo).toBe(U_MIN);
    const lin = pan(w, 0.25, 'linear');
    expect(windowYears(lin)[1]).toBeGreaterThan(windowYears(w)[1]);
    expect(pan(w, Number.NaN, 'log')).toBe(w);
  });

  it('fits a pair of years with padding', () => {
    const w = fitYears(-2599, -1899);
    expect(xOf(-2599, w, 'log')).toBeGreaterThan(0);
    expect(xOf(-1899, w, 'log')).toBeLessThan(1);
    expect(w.hi - w.lo).toBeGreaterThan(u(-2599) - u(-1899));
  });
});

describe('ticks (design § 12.2)', () => {
  it('keeps chosen ticks at least 56 px apart and shows at least two', () => {
    fc.assert(
      fc.property(windowArb, fc.constantFrom(...views), fc.integer({ min: 300, max: 1200 }), (w, v, px) => {
        const ticks = chooseTicks(w, v, px, label, width);
        const xs = ticks.map((t) => xOf(t.y, w, v) * px);
        return ticks.length >= 2 && xs.every((x, i) => i === 0 || x - xs[i - 1]! >= 56 - 1e-6);
      }),
      { numRuns: 300 }
    );
  });

  it('starts from the catalogue on the whole axis', () => {
    const ticks = chooseTicks(FULL, 'log', 360, label, width);
    expect(ticks.every((t) => TICK_CATALOGUE.includes(t))).toBe(true);
    expect(ticks.some((t) => t.ago && 1950 - t.y >= 1e9)).toBe(true);
    expect(ticks.some((t) => t.y === 2000)).toBe(true);
  });

  it('generates round ticks when zoomed in', () => {
    const w = clampWindow({ lo: u(1500), hi: u(1400) });
    const ticks = generatedTicks(w, 'log', 600, label, width);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    // Roundest values first: on a century at 600 px, every tick is a multiple of ten years.
    expect(ticks.every((t) => t.y % 10 === 0 && !t.ago)).toBe(true);
    expect(ticks.some((t) => t.y === 1500 || t.y === 1400)).toBe(true);
    // Never an odd value next to round ones (a review window 1560–1940 showed "1876").
    const review = generatedTicks(clampWindow({ lo: u(1940), hi: u(1560) }), 'log', 625, label, width);
    expect(review.every((t) => t.y % 10 === 0)).toBe(true);
    const deep = generatedTicks(clampWindow({ lo: u(1950 - 70e6), hi: u(1950 - 60e6) }), 'log', 600, label, width);
    expect(deep.every((t) => t.ago)).toBe(true);
  });

  it('counts years ago only before 10,000 BCE and never repeats a label (real formatter, regime boundary)', () => {
    const t = createTranslator({ locale: 'en', sources: [messages, COMMON_MESSAGES] });
    const real = (tk: Tick) => formatTick(tk.y, tk.ago, t, 'en');
    const across = clampWindow({ lo: u(1950 - 13_000), hi: u(-8000) });
    const ticks = chooseTicks(across, 'log', 640, real, width);
    expect(ticks.every((tk) => tk.ago === tk.y < -9999)).toBe(true);
    fc.assert(
      fc.property(windowArb, fc.constantFrom(...views), fc.integer({ min: 300, max: 1200 }), (w, v, px) => {
        const labels = chooseTicks(w, v, px, real, width).map(real);
        return new Set(labels).size === labels.length;
      }),
      { numRuns: 300 }
    );
  });
});

describe('labels (design § 12.3)', () => {
  it('stacks overlapping labels into up to three rows and leaves the rest for the legend', () => {
    expect(layoutLabels([{ x: 100, width: 50 }, { x: 300, width: 50 }], 400)).toEqual([0, 0]);
    expect(layoutLabels([{ x: 100, width: 80 }, { x: 110, width: 80 }, { x: 120, width: 80 }, { x: 130, width: 80 }], 400)).toEqual([0, 1, 2, null]);
    fc.assert(
      fc.property(fc.array(fc.record({ x: fc.double({ min: 0, max: 360, noNaN: true }), width: fc.double({ min: 10, max: 200, noNaN: true }) }), { maxLength: 12 }), (labels) => {
        const rows = layoutLabels(labels, 360);
        for (let r = 0; r < 3; r++) {
          const spans = labels
            .map((l, i) => ({ l, row: rows[i] }))
            .filter((p) => p.row === r)
            .map(({ l }) => {
              const a = Math.max(0, Math.min(360 - l.width, l.x - l.width / 2));
              return [a, a + l.width] as const;
            })
            .sort((p, q) => p[0] - q[0]);
          if (!spans.every((s, i) => i === 0 || s[0] >= spans[i - 1]![1])) return false;
        }
        return true;
      })
    );
  });
});
