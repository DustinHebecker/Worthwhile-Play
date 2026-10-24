import type { Rng } from '@wp/game-core';
import type { Series } from './params/series';

/**
 * The economic environment of one life (design § 5.1–5.2). Each calendar year replays a historical
 * year of the profile's series, in blocks of consecutive years (block bootstrap), so real
 * sequences such as an inflation spike with falling real wages stay together.
 *
 * Indices are plain doubles changed only by multiplication (exact IEEE operations), so a seed
 * reproduces them on every engine.
 */
export const BLOCK_YEARS = 5;

export interface Economy {
  /** Historical year whose values apply in the current calendar year. */
  histYear: number;
  /** Years left in the current block (including this one). */
  blockLeft: number;
  /** Consumer prices relative to the start of the life (1 = start). */
  priceIndex: number;
  /** Nominal wages relative to the start of the life (1 = start). */
  wageIndex: number;
  /** Inflation and real wage growth of the current year (fractions). */
  inflation: number;
  realWageGrowth: number;
}

export interface EconomySeries {
  cpi: Series;
  /** Optional; without it real wages are flat. */
  realWages?: Series;
}

/** Historical years for which every series of the profile has a value. */
export function commonYears(series: EconomySeries): number[] {
  const all = [series.cpi, ...(series.realWages ? [series.realWages] : [])];
  const first = Math.max(...all.map((s) => s.firstYear));
  const last = Math.min(...all.map((s) => s.firstYear + s.values.length - 1));
  const years: number[] = [];
  for (let y = first; y <= last; y++) years.push(y);
  return years;
}

function valuesOf(series: EconomySeries, year: number): { inflation: number; realWageGrowth: number } {
  const inflation = series.cpi.values[year - series.cpi.firstYear] ?? 0;
  const w = series.realWages;
  const realWageGrowth = w === undefined ? 0 : (w.values[year - w.firstYear] ?? 0);
  return { inflation, realWageGrowth };
}

/** The economy in the first year of a life: indices at 1, a fresh block. */
export function startEconomy(series: EconomySeries, rng: Rng): Economy {
  const years = commonYears(series);
  const histYear = rng.pick(years);
  return { histYear, blockLeft: BLOCK_YEARS, priceIndex: 1, wageIndex: 1, ...valuesOf(series, histYear) };
}

/**
 * Moves to the next calendar year: the indices grow by this year's inflation and wage growth, then
 * the next historical year is chosen (the following one inside a block, a random one at a new block).
 */
export function nextEconomyYear(economy: Economy, series: EconomySeries, rng: Rng): Economy {
  const years = commonYears(series);
  const priceIndex = economy.priceIndex * (1 + economy.inflation);
  const wageIndex = economy.wageIndex * (1 + economy.inflation) * (1 + economy.realWageGrowth);
  const last = years[years.length - 1] as number;
  const continueBlock = economy.blockLeft > 1 && economy.histYear < last;
  const histYear = continueBlock ? economy.histYear + 1 : rng.pick(years);
  const blockLeft = continueBlock ? economy.blockLeft - 1 : BLOCK_YEARS;
  return { histYear, blockLeft, priceIndex, wageIndex, ...valuesOf(series, histYear) };
}

export function isEconomy(value: unknown): value is Economy {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  const pos = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1e6;
  const rate = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > -0.5 && v < 2;
  return Number.isInteger(e.histYear) && (e.histYear as number) >= 1800 && (e.histYear as number) <= 2100
    && Number.isInteger(e.blockLeft) && (e.blockLeft as number) >= 1 && (e.blockLeft as number) <= BLOCK_YEARS
    && pos(e.priceIndex) && pos(e.wageIndex) && rate(e.inflation) && rate(e.realWageGrowth);
}
