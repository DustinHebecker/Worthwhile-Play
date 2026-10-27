/** Numbers, plurals and placeholders per locale (design § 18.4). Pure; digits come from `Intl`. */
import { bcp47Tag } from '@wp/game-core';
import type { PluralForms } from './content/types';

const formats = new Map<string, Intl.NumberFormat>();
const plurals = new Map<string, Intl.PluralRules>();

function nf(locale: string, digits: number): Intl.NumberFormat {
  const key = `${locale}|${digits}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(bcp47Tag(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false })));
  return f;
}

export const formatNumber = (n: number, locale: string, digits = 0): string => nf(locale, digits).format(n);

/** The plural category of n (with its shown fraction digits) in a locale. */
export function pluralCategory(n: number, locale: string, digits = 0): Intl.LDMLPluralRule {
  const key = `${locale}|${digits}`;
  let r = plurals.get(key);
  if (!r) plurals.set(key, (r = new Intl.PluralRules(bcp47Tag(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits })));
  return r.select(n);
}

/** "4 semitones", "13.7 cents": the locale's form for n with its digits. */
export function formatPlural(forms: PluralForms, n: number, locale: string, digits = 0): string {
  const form = forms[pluralCategory(n, locale, digits)] ?? forms.other;
  return form.replace('{n}', formatNumber(n, locale, digits));
}

/** Fills {placeholders} of a content template. */
export const fill = (template: string, params: Readonly<Record<string, string>>): string => template.replace(/\{(\w+)\}/g, (m, k: string) => params[k] ?? m);

/** "3 : 2" (always left to right; the view wraps it in a `bdi`). */
export const ratioText = (p: number, q: number, locale: string): string => `${formatNumber(p, locale)} : ${formatNumber(q, locale)}`;
