// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, createRngFromState, normalizeSeed, randomSeed, seedFromString } from '../src/rng';

describe('seeded rng', () => {
  it('produces a known sequence (regression lock for saved games)', () => {
    const rng = createRng(42);
    expect([rng.next(), rng.next(), rng.next()].map((x) => x.toFixed(10))).toMatchInlineSnapshot(`
      [
        "0.6011037519",
        "0.4482905590",
        "0.8524657935",
      ]
    `);
  });

  it('continues identically from a saved state', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 50 }), (seed, skip) => {
        const a = createRng(seed);
        for (let i = 0; i < skip; i++) a.next();
        const b = createRngFromState(a.state());
        expect(Array.from({ length: 10 }, () => a.next())).toEqual(Array.from({ length: 10 }, () => b.next()));
      })
    );
  });

  it('next() stays in [0, 1)', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const rng = createRng(seed);
        for (let i = 0; i < 100; i++) {
          const x = rng.next();
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(1);
        }
      })
    );
  });

  it('int() respects inclusive bounds and hits both ends', () => {
    const rng = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(-2, 3);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2, 3]);
    expect(createRng(1).int(5, 5)).toBe(5);
  });

  it('int() rejects invalid bounds', () => {
    const rng = createRng(1);
    expect(() => rng.int(3, 2)).toThrow(RangeError);
    expect(() => rng.int(0.5, 2)).toThrow(RangeError);
  });

  it('shuffle() is a permutation and does not mutate the input', () => {
    fc.assert(
      fc.property(fc.integer(), fc.array(fc.integer(), { maxLength: 40 }), (seed, items) => {
        const copy = [...items];
        const shuffled = createRng(seed).shuffle(items);
        expect(items).toEqual(copy);
        expect([...shuffled].sort((a, b) => a - b)).toEqual([...items].sort((a, b) => a - b));
      })
    );
  });

  it('shuffle() actually reorders sometimes', () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const results = new Set(Array.from({ length: 20 }, (_, s) => createRng(s).shuffle(items).join(',')));
    expect(results.size).toBeGreaterThan(15);
  });

  it('pick() returns an element and rejects empty arrays', () => {
    const rng = createRng(3);
    expect(['a', 'b', 'c']).toContain(rng.pick(['a', 'b', 'c']));
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('normalizes seeds to uint32 and rejects non-finite seeds', () => {
    expect(normalizeSeed(-1)).toBe(0xffffffff);
    expect(normalizeSeed(2 ** 32 + 5)).toBe(5);
    expect(normalizeSeed(3.9)).toBe(3);
    expect(() => normalizeSeed(Number.NaN)).toThrow(RangeError);
    expect(() => normalizeSeed(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('derives stable seeds from strings', () => {
    expect(seedFromString('')).toBe(0x811c9dc5);
    expect(seedFromString('worthwhile')).toBe(seedFromString('worthwhile'));
    expect(seedFromString('a')).not.toBe(seedFromString('b'));
  });

  it('randomSeed() uses the injected entropy source', () => {
    expect(randomSeed({ getRandomValues: <T extends ArrayBufferView | null>(b: T) => { (b as unknown as Uint32Array)[0] = 123; return b; } })).toBe(123);
    expect(Number.isInteger(randomSeed())).toBe(true);
  });
});
