import type { Translator } from '@wp/game-core';
import { DEFAULT_LOCALE, localeDirection, type SupportedLocale } from './locales';

export type Catalogue = Readonly<Record<string, string>>;
export type LocalizedCatalogues = Readonly<Partial<Record<string, Catalogue>>>;

const PLACEHOLDER = /\{(\w+)\}/g;

export function interpolate(template: string, params?: Readonly<Record<string, string | number>>): string {
  if (!params) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => (name in params ? String(params[name]) : match));
}

export interface TranslatorOptions {
  locale: SupportedLocale;
  /** Searched in order. E.g. [gameMessages, commonMessages]. */
  sources: readonly LocalizedCatalogues[];
  /** Called when a key is missing in the active locale (tests turn this into a failure). */
  onMissing?: (key: string, locale: SupportedLocale) => void;
}

/**
 * Creates a translator. Supported catalogues are expected to be complete (enforced by
 * tests); the English fallback only prevents a blank UI if a key slips through, and
 * reports it via `onMissing`. If the key is missing everywhere, the key itself is shown.
 */
export function createTranslator({ locale, sources, onMissing }: TranslatorOptions): Translator {
  const lookup = (loc: string, key: string): string | undefined => {
    for (const source of sources) {
      const value = source[loc]?.[key];
      if (value !== undefined && value !== '') return value;
    }
    return undefined;
  };
  const t = ((key: string, params?: Readonly<Record<string, string | number>>) => {
    let value = lookup(locale, key);
    if (value === undefined) {
      onMissing?.(key, locale);
      value = locale === DEFAULT_LOCALE ? undefined : lookup(DEFAULT_LOCALE, key);
    }
    return interpolate(value ?? key, params);
  }) as Translator;
  Object.defineProperties(t, {
    locale: { value: locale, enumerable: true },
    direction: { value: localeDirection(locale), enumerable: true }
  });
  return t;
}

/** Returns problems with a set of catalogues: missing locales/keys, empty values, placeholder mismatches. */
export function auditCatalogues(catalogues: LocalizedCatalogues, locales: readonly string[], reference = DEFAULT_LOCALE): string[] {
  const problems: string[] = [];
  const ref = catalogues[reference];
  if (!ref) return [`reference locale "${reference}" missing`];
  const placeholders = (text: string) => [...text.matchAll(PLACEHOLDER)].map((m) => m[1]).sort().join(',');
  for (const locale of locales) {
    const cat = catalogues[locale];
    if (!cat) {
      problems.push(`${locale}: missing catalogue`);
      continue;
    }
    for (const key of Object.keys(ref)) {
      const value = cat[key];
      if (value === undefined || value.trim() === '') problems.push(`${locale}: missing "${key}"`);
      else if (placeholders(value) !== placeholders(ref[key] as string)) problems.push(`${locale}: placeholder mismatch in "${key}"`);
    }
    for (const key of Object.keys(cat)) if (!(key in ref)) problems.push(`${locale}: extra key "${key}"`);
  }
  return problems;
}
