import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, MODES, SPANS, generateRound, subjects } from '../src/generate';
import { checkItem } from './check-item';

/**
 * Generator simulation (design § 20.3, ADR 0021): 1,000 seeds × 5 modes × 5 spans × 3 difficulties. Generation never
 * fails, the fallbacks stay rare, the gap question is usually fair, and a round takes well under 10 ms. Every 10th
 * round is also checked item by item against the oracle (the fast suite checks 40 seeds in full).
 */
describe('generator simulation', () => {
  it('generates every round, rarely falls back and stays fast', () => {
    const SEEDS = 1000;
    let rounds = 0;
    let withFallback1 = 0;
    let withFallback23 = 0;
    let firstItems = 0;
    let withGap = 0;
    let ms = 0;
    const perCell: string[] = [];
    for (const span of SPANS)
      for (const d of DIFFICULTIES)
        for (const mode of MODES) {
          let f1 = 0;
          for (let seed = 0; seed < SEEDS; seed++) {
            const s = seed * 104_729 + 7;
            const t0 = performance.now();
            const g = generateRound(s, d, mode, span);
            ms += performance.now() - t0;
            rounds++;
            expect(g.items.length).toBeGreaterThan(0);
            if (g.fallbacks.some((f) => f.level === 1)) {
              withFallback1++;
              f1++;
            }
            if (g.fallbacks.some((f) => f.level > 1)) withFallback23++;
            for (const item of g.items)
              if (item.kind === 'first' && d !== 'easy') {
                firstItems++;
                if (item.gaps.length) withGap++;
              }
            if (seed % 10 === 0) {
              for (const item of g.items) checkItem(item, span, d);
              if (!g.fallbacks.length) {
                const all = g.items.flatMap(subjects);
                expect(new Set(all).size).toBe(all.length);
              }
            }
          }
          if (f1) perCell.push(`${span}/${d}/${mode}: ${((100 * f1) / SEEDS).toFixed(1)} %`);
        }
    const rate1 = withFallback1 / rounds;
    const rate23 = withFallback23 / rounds;
    const gapShare = withGap / firstItems;
    const avg = ms / rounds;
    // Printed for the PR description (design § 21 step 3).
    console.info(
      `generator: ${rounds} rounds; fallback (1) ${(100 * rate1).toFixed(2)} %, (2)/(3) ${(100 * rate23).toFixed(2)} %; gap question in ${(100 * gapShare).toFixed(1)} % of medium/hard "first" items; ${avg.toFixed(3)} ms per round${perCell.length ? `\n  fallback (1) by cell: ${perCell.join('; ')}` : ''}`
    );
    expect(rate1).toBeLessThanOrEqual(0.05);
    expect(rate23).toBeLessThanOrEqual(0.005);
    expect(gapShare).toBeGreaterThanOrEqual(0.75);
    expect(avg).toBeLessThan(10);
  }, 600_000);
});
