/** Number formatting per locale (design § 17.3). Pure; digits and signs come from `Intl`. */
import { bcp47Tag } from '@wp/game-core';
import { toNumber, type Frac } from './rules';

const cache = new Map<string, Intl.NumberFormat>();
function nf(locale: string, key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const id = `${locale}|${key}`;
  let f = cache.get(id);
  if (!f) cache.set(id, (f = new Intl.NumberFormat(bcp47Tag(locale), options)));
  return f;
}

/** A share 0…1 as a percent: whole percent, one decimal just inside 0–1 % and 99–100 %, "below 0.1 %" as a flag. */
export function percentParts(value: number, locale: string): { text: string; below: boolean } {
  const v = Math.min(1, Math.max(0, value));
  if (v > 0 && v < 0.001) return { text: nf(locale, 'p1', { style: 'percent', maximumFractionDigits: 1 }).format(0.001), below: true };
  const fine = (v > 0 && v < 0.01) || (v > 0.99 && v < 1);
  const whole = Math.round(v * 100);
  // Never show 0 % or 100 % for a value that is not exactly 0 or 1.
  const digits = fine || (whole === 0 && v > 0) || (whole === 100 && v < 1) ? 1 : 0;
  const shown = digits === 1 ? Math.min(0.999, Math.max(0.001, Math.round(v * 1000) / 1000)) : v;
  return { text: nf(locale, `p${digits}`, { style: 'percent', maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(shown), below: false };
}

export const formatPercent = (value: Frac | number, locale: string, below: (p: string) => string = (p) => `< ${p}`): string => {
  const parts = percentParts(typeof value === 'number' ? value : toNumber(value), locale);
  return parts.below ? below(parts.text) : parts.text;
};

/** A whole percent 0…100 (beliefs). */
export const formatWholePercent = (pct: number, locale: string): string => nf(locale, 'p0', { style: 'percent', maximumFractionDigits: 0 }).format(pct / 100);

export const formatInt = (n: number | bigint, locale: string): string => nf(locale, 'int', { maximumFractionDigits: 0 }).format(n);

/** Fraction "210/350" with locale digits (used inside LTR formulas). */
export const formatRatio = (a: bigint | number, b: bigint | number, locale: string): string => `${formatInt(a, locale)}/${formatInt(b, locale)}`;

/** A decimal with up to two digits (formulas). */
export const formatDecimal = (v: number, locale: string): string => nf(locale, 'd2', { maximumFractionDigits: 3 }).format(v).replace('-', '−');
