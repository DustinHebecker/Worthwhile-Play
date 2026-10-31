import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { formatArea, formatClock, formatDegrees, formatDistance, formatDuration, formatPopulation, formatUtcOffset, roundDistance } from '../src/format';

describe('Atlas Explorer formatting', () => {
  it('rounds distances: two significant digits from 1,000, else to 10, never below 10', () => {
    expect(roundDistance(1449)).toBe(1400);
    expect(roundDistance(1450)).toBe(1500);
    expect(roundDistance(12_345)).toBe(12_000);
    expect(roundDistance(994)).toBe(990);
    expect(roundDistance(3)).toBe(10);
    expect(roundDistance(0)).toBe(0);
    expect(roundDistance(Number.NaN)).toBe(0);
    fc.assert(
      fc.property(fc.double({ min: 0.001, max: 40_000, noNaN: true }), (v) => {
        const r = roundDistance(v);
        expect(r).toBeGreaterThanOrEqual(10);
        expect(Math.abs(r - v)).toBeLessThanOrEqual(Math.max(10, v * 0.05));
      })
    );
  });

  it('is monotonic in the distance (a farther place never shows a smaller number)', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 40_000, noNaN: true }), fc.double({ min: 0, max: 40_000, noNaN: true }), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        expect(roundDistance(lo)).toBeLessThanOrEqual(roundDistance(hi));
      })
    );
  });

  it('formats distances in kilometres or miles with the locale’s digits and unit words', () => {
    expect(formatDistance(1449, 'en')).toBe('1,400 km');
    expect(formatDistance(1449, 'de')).toBe('1.400 km');
    expect(formatDistance(1609.344, 'en', 'mi')).toBe('1,000 mi');
    expect(formatDistance(5, 'en')).toBe('10 km');
  });

  it('formats areas, populations, durations and degrees', () => {
    expect(formatArea(357_022, 'en')).toBe('360,000');
    expect(formatPopulation(83_200_000, 'en')).toBe('83 million');
    expect(formatPopulation(83_200_000, 'de')).toBe('83 Millionen');
    expect(formatDuration(16.47, 'en')).toBe('16 hr 30 min');
    expect(formatDuration(24, 'en')).toBe('24 hr');
    expect(formatDuration(0.2, 'en')).toBe('10 min');
    expect(formatDegrees(-41.93, 'en')).toBe('41.9');
    expect(formatDegrees(12.5, 'de', 0)).toBe('13');
  });

  it('formats clock times (wrapping around midnight) and UTC offsets', () => {
    expect(formatClock(13 * 60 + 5, 'de')).toBe('13:05');
    expect(formatClock(-60, 'de')).toBe('23:00');
    expect(formatClock(1440 + 30, 'de')).toBe('0:30');
    expect(formatUtcOffset(0, 'en')).toBe('UTC');
    expect(formatUtcOffset(330, 'en')).toBe('UTC+5:30');
    expect(formatUtcOffset(-180, 'en')).toBe('UTC−3');
  });

  it('never throws for unusual locales', () => {
    for (const l of ['xx', 'zh-Hans', 'ar', 'hi', 'pt']) {
      expect(() => formatDistance(1234, l)).not.toThrow();
      expect(() => formatClock(600, l)).not.toThrow();
    }
  });
});
