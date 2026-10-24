import { seedFromString } from '@wp/game-core';
import { describe, expect, it } from 'vitest';
import { generateCase, eligible } from '../src/generate';
import { posteriorAfter, toNumber } from '../src/rules';
import { DIFFICULTIES } from '../src/templates';

/**
 * Calibration by construction (design § 6.3, § 19.3): over many generated cases (fixed seeds, so deterministic), the
 * truth comes true as often as the exact posterior says. Cases are binned by the posterior of each hypothesis; in each
 * bin the observed frequency lies within 4 standard errors of the mean posterior. Also: the fallback stays rare.
 */
describe('generator statistics (slow)', () => {
  it('the revealed truth is calibrated against the exact posterior', () => {
    const bins = Array.from({ length: 10 }, () => ({ n: 0, hits: 0, p: 0, v: 0 }));
    let fallbacks = 0;
    let cases = 0;
    for (const d of DIFFICULTIES)
      for (const t of eligible(d))
        for (let i = 0; i < 400; i++) {
          const c = generateCase(seedFromString(`cal:${d}:${t.id}:${i}`), t, d);
          cases++;
          if (c.attempts > 200) fallbacks++;
          posteriorAfter(c, c.clues.length).forEach((f, h) => {
            const p = toNumber(f);
            const b = bins[Math.min(9, Math.floor(p * 10))]!;
            b.n++;
            b.p += p;
            b.v += p * (1 - p);
            if (h === c.truth) b.hits++;
          });
        }
    for (const b of bins) {
      if (b.n < 50) continue;
      const se = Math.sqrt(b.v) / b.n;
      expect(Math.abs(b.hits / b.n - b.p / b.n)).toBeLessThanOrEqual(4 * se + 1e-9);
    }
    expect(fallbacks / cases).toBeLessThan(0.01);
  });
});
