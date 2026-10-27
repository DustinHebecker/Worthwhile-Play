/** Number and plural formatting per locale (design § 17.3). Pure; digits come from `Intl`. */
import { bcp47Tag } from '@wp/game-core';
import type { PluralForms } from './content/types';

const nfs = new Map<string, Intl.NumberFormat>();
const prs = new Map<string, Intl.PluralRules>();

const nf = (locale: string): Intl.NumberFormat => {
  let f = nfs.get(locale);
  if (!f) nfs.set(locale, (f = new Intl.NumberFormat(bcp47Tag(locale), { maximumFractionDigits: 0 })));
  return f;
};

export const formatInt = (n: number, locale: string): string => nf(locale).format(n);

/** An amount in u shown in model units (thousands): "58"; a present amount below 500 u reads "<1", none "0". */
export function formatAmount(u: number, locale: string): string {
  if (u > 0 && u < 500) return `<${formatInt(1, locale)}`;
  return formatInt(Math.round(u / 1000), locale);
}

/** The plural category of n in a locale (`other` when unsupported). */
export function pluralCategory(n: number, locale: string): Intl.LDMLPluralRule {
  let r = prs.get(locale);
  if (!r) prs.set(locale, (r = new Intl.PluralRules(bcp47Tag(locale))));
  return r.select(n);
}

/** "26 weeks": the locale's form for n with its digits. */
export function formatPlural(forms: PluralForms, n: number, locale: string): string {
  const form = forms[pluralCategory(n, locale)] ?? forms.other;
  return form.replace('{n}', formatInt(n, locale));
}
