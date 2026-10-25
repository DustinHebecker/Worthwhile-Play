import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { BLOCK_YEARS, commonYears, isEconomy, nextEconomyYear, startEconomy, type Economy, type Series } from '../src';

const cpi: Series = { id: 'x.cpi', sourceId: 's', region: 'XX', firstYear: 2000, values: [0.1, 0.2, 0.3, 0.4], status: 'verified' };
const wages: Series = { id: 'x.w', sourceId: 's', region: 'XX', firstYear: 2001, values: [0.01, 0.02, 0.03, 0.04, 0.05], status: 'verified' };

const valid: Economy = { histYear: 2001, blockLeft: 3, priceIndex: 1.5, wageIndex: 2, inflation: 0.02, realWageGrowth: -0.01 };

describe('economy details', () => {
  it('uses only the years every series covers', () => {
    expect(commonYears({ cpi })).toEqual([2000, 2001, 2002, 2003]);
    expect(commonYears({ cpi, realWages: wages })).toEqual([2001, 2002, 2003]);
  });

  it('reads the values of the drawn year; real wages are flat without a series', () => {
    const rng = createRng(1);
    for (let i = 0; i < 20; i++) {
      const e = startEconomy({ cpi }, rng);
      expect(e.inflation).toBe(cpi.values[e.histYear - 2000]);
      expect(e.realWageGrowth).toBe(0);
      expect(e).toMatchObject({ priceIndex: 1, wageIndex: 1, blockLeft: BLOCK_YEARS });
      const w = startEconomy({ cpi, realWages: wages }, rng);
      expect(w.realWageGrowth).toBe(wages.values[w.histYear - 2001]);
    }
  });

  it('compounds prices with inflation and wages with inflation and real growth', () => {
    const e = { ...valid, priceIndex: 2, wageIndex: 3, inflation: 0.1, realWageGrowth: 0.05 };
    const next = nextEconomyYear(e, { cpi, realWages: wages }, createRng(2));
    expect(next.priceIndex).toBe(2 * 1.1);
    expect(next.wageIndex).toBe(3 * 1.1 * 1.05);
  });

  it('continues a block year by year and starts a new block at its end or at the last year', () => {
    const series = { cpi };
    const inBlock = nextEconomyYear({ ...valid, histYear: 2001, blockLeft: 3 }, series, createRng(3));
    expect(inBlock).toMatchObject({ histYear: 2002, blockLeft: 2, inflation: 0.3 });
    const atLast = nextEconomyYear({ ...valid, histYear: 2003, blockLeft: 3 }, series, createRng(3));
    expect(atLast.blockLeft).toBe(BLOCK_YEARS);
    const ended = nextEconomyYear({ ...valid, histYear: 2001, blockLeft: 1 }, series, createRng(3));
    expect(ended.blockLeft).toBe(BLOCK_YEARS);
  });

  it('validates economies at their boundaries without throwing', () => {
    expect(isEconomy(valid)).toBe(true);
    const bad: unknown[] = [
      null, 'x', 1, [],
      { ...valid, histYear: 1799 }, { ...valid, histYear: 2101 }, { ...valid, histYear: 2000.5 },
      { ...valid, blockLeft: 0 }, { ...valid, blockLeft: BLOCK_YEARS + 1 }, { ...valid, blockLeft: 1.5 },
      { ...valid, priceIndex: 0 }, { ...valid, priceIndex: 1e6 }, { ...valid, priceIndex: Number.NaN }, { ...valid, priceIndex: '1' },
      { ...valid, wageIndex: -1 }, { ...valid, wageIndex: Number.POSITIVE_INFINITY },
      { ...valid, inflation: -0.5 }, { ...valid, inflation: 2 }, { ...valid, inflation: Number.NaN }, { ...valid, inflation: '0' },
      { ...valid, realWageGrowth: -0.6 }, { ...valid, realWageGrowth: 2.5 }
    ];
    for (const b of bad) expect(isEconomy(b)).toBe(false);
    expect(isEconomy({ ...valid, histYear: 1800, blockLeft: 1, priceIndex: 1e-9, inflation: -0.49, realWageGrowth: 1.99 })).toBe(true);
    expect(isEconomy({ ...valid, histYear: 2100, blockLeft: BLOCK_YEARS, wageIndex: 999_999 })).toBe(true);
  });
});
