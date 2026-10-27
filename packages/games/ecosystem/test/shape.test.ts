import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { SHAPES, classify, family, legSize, legs, type Shape } from '../src/shape';
import { MARK_SYMBOLS, SKETCH_LIMITS, levelBand, levelMarks, shapeMarks, sketchCap, sketchError, sketchMarks, sketchScore, sketchWeeks } from '../src/score';

describe('shape classes (§ 11.1)', () => {
  const cases: [number[], Shape][] = [
    [[100, 100, 101, 99, 100], 'steady'],
    [[0, 0, 0, 0], 'steady'],
    [[50, 70, 90, 100, 100], 'rises'],
    [[100, 80, 60, 50, 50], 'falls'],
    [[50, 90, 100, 60, 55], 'rise-fall'],
    [[100, 50, 40, 80, 95], 'fall-rise'],
    [[50, 100, 30, 90, 30, 90], 'swings-last'],
    [[20, 100, 30, 60, 45, 52], 'swings-fade'],
    [[100, 60, 20, 5, 0], 'vanishes'],
    [[100, 120, 100, 0], 'vanishes'],
    [[0, 5, 10, 20], 'rises']
  ];
  for (const [v, s] of cases) it(`${JSON.stringify(v)} → ${s}`, () => expect(classify(v)).toBe(s));

  it('the threshold is relative and exact: a move of exactly p % of the maximum counts', () => {
    expect(classify([80, 100])).toBe('rises'); // 20 = 20 % of 100
    expect(classify([81, 100])).toBe('steady');
    expect(classify([100, 85], 15)).toBe('falls');
    expect(classify([100, 86], 15)).toBe('steady');
    expect(classify([100, 76], 25)).toBe('steady');
    expect(classify([])).toBe('steady');
  });

  it('legs alternate in direction, each at least the threshold, and chain end to start', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 1_000_000 }), { minLength: 1, maxLength: 60 }), fc.constantFrom(15, 20, 25), (v, p) => {
        const L = legs(v, p);
        const ref = Math.max(...v);
        for (let k = 0; k < L.length; k++) {
          const l = L[k]!;
          expect(100 * legSize(l)).toBeGreaterThanOrEqual(ref * p);
          expect(Math.sign(l.to - l.from)).toBe(l.dir);
          expect(v[l.toWeek]).toBe(l.to);
          expect(v[l.fromWeek]).toBe(l.from);
          if (k > 0) {
            expect(l.dir).toBe(-L[k - 1]!.dir as 1 | -1);
            expect(l.fromWeek).toBe(L[k - 1]!.toWeek);
          }
        }
      })
    );
  });

  it('scale invariance: multiplying a series by a whole number keeps its class', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 100_000 }), { minLength: 1, maxLength: 40 }), fc.integer({ min: 1, max: 50 }), fc.constantFrom(15, 20, 25), (v, k, p) => {
        expect(classify(v.map((x) => x * k), p)).toBe(classify(v, p));
      })
    );
  });

  it('mirror symmetry: v ↦ max − v swaps rises/falls and rise-fall/fall-rise (series reaching 0, ignoring vanishes)', () => {
    const swap: Partial<Record<Shape, Shape>> = { rises: 'falls', falls: 'rises', 'rise-fall': 'fall-rise', 'fall-rise': 'rise-fall', steady: 'steady', 'swings-fade': 'swings-fade', 'swings-last': 'swings-last' };
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 10_000 }), { minLength: 2, maxLength: 40 }), fc.nat(39), (raw, at) => {
        const v = [...raw];
        v[at % v.length] = 0; // the minimum is 0, so both series share the same maximum
        const max = Math.max(...v);
        const m = v.map((x) => max - x);
        const a = classify(v);
        const b = classify(m);
        fc.pre(a !== 'vanishes' && b !== 'vanishes');
        expect(b).toBe(swap[a]);
      })
    );
  });

  it('constant series are steady; families group the "close" answers', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e7 }), fc.integer({ min: 1, max: 50 }), (x, n) => {
        expect(classify(new Array<number>(n).fill(x))).toBe('steady');
      })
    );
    expect(SHAPES.map(family)).toEqual([null, 'up', 'down', 'up', 'down', 'swings', 'swings', 'down']);
  });
});

describe('scoring (§ 11.2)', () => {
  it('level bands at the exact boundaries 0.85 and 1.15; v₀ = 0 uses the 1,000 u rule', () => {
    expect(levelBand(100, 84)).toBe(0);
    expect(levelBand(100, 85)).toBe(1);
    expect(levelBand(100, 115)).toBe(1);
    expect(levelBand(100, 116)).toBe(2);
    expect(levelBand(20, 17)).toBe(1); // 85 · 20 = 1700 = 100 · 17
    expect(levelBand(0, 999)).toBe(1);
    expect(levelBand(0, 1000)).toBe(2);
  });

  it('level marks: same band ●●●, neighbour ●○○, opposite ○○○', () => {
    expect(levelMarks(0, 0)).toBe(3);
    expect(levelMarks(0, 1)).toBe(1);
    expect(levelMarks(1, 2)).toBe(1);
    expect(levelMarks(2, 0)).toBe(0);
    expect(levelMarks(0, 2)).toBe(0);
  });

  it('shape marks: same class ●●●, same family ●●○, otherwise ○○○; steady has no family', () => {
    expect(shapeMarks('falls', 'falls')).toBe(3);
    expect(shapeMarks('vanishes', 'falls')).toBe(2);
    expect(shapeMarks('rises', 'rise-fall')).toBe(2);
    expect(shapeMarks('swings-last', 'swings-fade')).toBe(2);
    expect(shapeMarks('steady', 'rises')).toBe(0);
    expect(shapeMarks('rises', 'steady')).toBe(0);
    expect(shapeMarks('rises', 'falls')).toBe(0);
  });

  it('sketch handles sit at ⌊k·H/6⌋; the error is 0 on the model, at the band limits, and grows with distance', () => {
    expect(sketchWeeks(26)).toEqual([4, 8, 13, 17, 21, 26]);
    const H = 12;
    const series = Array.from({ length: H + 1 }, (_, w) => 1000 * w);
    const exact = sketchWeeks(H).map((w) => series[w]!);
    expect(sketchError(exact, series, H, 10_000)).toBe(0);
    expect(sketchMarks(0)).toBe(3);
    for (const [k, lim] of SKETCH_LIMITS.entries()) {
      expect(sketchMarks(lim)).toBe(3 - k);
      expect(sketchMarks(lim + 1)).toBe(2 - k);
    }
    // Shifting every handle by d raises the error to d / Y (‰), monotone in d.
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), fc.integer({ min: 0, max: 5000 }), (d1, d2) => {
        const [lo, hi] = d1 <= d2 ? [d1, d2] : [d2, d1];
        const e = (d: number) => sketchError(exact.map((x) => x + d), series, H, 10_000);
        expect(e(lo)).toBeLessThanOrEqual(e(hi));
        expect(e(lo)).toBe(Math.floor((1000 * lo) / 10_000));
      })
    );
    expect(MARK_SYMBOLS[3]).toBe('●●●');
    expect(MARK_SYMBOLS[0]).toBe('○○○');
  });

  it('a sketch of another shape is capped: ●●○ in the same family, ●○○ otherwise, however close it lies', () => {
    const H = 12;
    // Falls from 100 to 60 thousand: a flat sketch at 100 is within 120 ‰ of a 500-thousand scale, but not its shape.
    const falling = Array.from({ length: H + 1 }, (_, w) => 100_000 - 3_000 * w - (w > 0 ? 4_000 : 0));
    const at = sketchWeeks(H).map((w) => falling[w]!);
    const flat = at.map(() => 100_000);
    expect(sketchMarks(sketchError(flat, falling, H, 500_000))).toBe(3);
    expect(sketchCap(flat, falling, H)).toBe(1);
    expect(sketchScore(flat, falling, H, 500_000)).toBe(1);
    expect(sketchScore(at, falling, H, 500_000)).toBe(3);
    // Falls, then recovers a little: the same family as "falls".
    const dip = [...at.slice(0, 4), 50_000, 75_000];
    expect(sketchCap(dip, falling, H)).toBe(2);
    // The cap never raises the marks of the distance.
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 500_000 }), { minLength: 6, maxLength: 6 }), (pts) => {
        const score = sketchScore(pts, falling, H, 500_000);
        expect(score).toBeLessThanOrEqual(sketchMarks(sketchError(pts, falling, H, 500_000)));
        expect(score).toBeLessThanOrEqual(sketchCap(pts, falling, H));
      })
    );
  });
});
