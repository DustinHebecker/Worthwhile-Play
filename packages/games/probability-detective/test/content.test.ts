import { SUPPORTED_LOCALES } from '@wp/localization';
import { beforeAll, describe, expect, it } from 'vitest';
import { CONTENT_LOADERS, type ContentText } from '../src/content';
import { formatPercent, formatWholePercent, percentParts } from '../src/format';
import { messages } from '../src/messages';
import { CLUE_TEMPLATES } from '../src/templates';

const CONTENT: Record<string, ContentText> = {};
beforeAll(async () => {
  for (const [locale, load] of Object.entries(CONTENT_LOADERS)) CONTENT[locale] = await load();
});

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
/** Any decimal digit in any script (Latin, Arabic-Indic, Devanagari, full-width …). */
const DIGIT = /\p{Nd}/u;

describe('content (design § 17)', () => {
  it('has text for every template, hypothesis and clue in all 16 locales, without digits', () => {
    expect(Object.keys(CONTENT_LOADERS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    for (const locale of SUPPORTED_LOCALES) {
      const c = CONTENT[locale]!;
      expect(Object.keys(c.templates).sort(), locale).toEqual(CLUE_TEMPLATES.map((t) => t.id).sort());
      for (const t of CLUE_TEMPLATES) {
        const tx = c.templates[t.id]!;
        expect(Object.keys(tx.hyps).sort(), `${locale} ${t.id}`).toEqual([...t.hyps].sort());
        expect(Object.keys(tx.clues).sort(), `${locale} ${t.id}`).toEqual(t.clues.map((x) => x.id).sort());
        const texts = [tx.title, tx.story, tx.lead, ...Object.values(tx.hyps), ...Object.values(tx.clues).flatMap((x) => [x.label, x.seen, x.notSeen])];
        for (const s of texts) {
          expect(s.trim().length, `${locale} ${t.id}`).toBeGreaterThan(0);
          expect(DIGIT.test(s), `${locale} ${t.id}: ${s}`).toBe(false);
        }
        // Neutral and echo clues always show, so both sentences are the same.
        for (const spec of t.clues) if (spec.kind !== 'normal') expect(tx.clues[spec.id]!.seen).toBe(tx.clues[spec.id]!.notSeen);
      }
    }
  });
  it('the other locales are translations, not copies of English', () => {
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      expect(CONTENT[locale]!.templates['c-parcel']!.story, locale).not.toBe(CONTENT.en!.templates['c-parcel']!.story);
      expect(messages[locale]!.rules, locale).not.toBe(messages.en!.rules);
    }
  });
});

describe('UI messages', () => {
  it('every locale has the English keys with the same placeholders', () => {
    const en = messages.en!;
    for (const locale of SUPPORTED_LOCALES) {
      const m = messages[locale]!;
      expect(Object.keys(m).sort(), locale).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(en)) expect(placeholders(m[key]!), `${locale} ${key}`).toEqual(placeholders(value));
    }
  });
});

describe('number formatting', () => {
  it('whole percents, one decimal near 0 % and 100 %, and a "below" flag under 0.1 %', () => {
    expect(formatPercent(0.6, 'en')).toBe('60%');
    expect(formatPercent(0, 'en')).toBe('0%');
    expect(formatPercent(1, 'en')).toBe('100%');
    expect(percentParts(0.0013, 'en')).toEqual({ text: '0.1%', below: false });
    expect(percentParts(0.0004, 'en')).toEqual({ text: '0.1%', below: true });
    expect(formatPercent(0.0004, 'en', (p) => `less than ${p}`)).toBe('less than 0.1%');
    expect(formatPercent(0.9995, 'en')).toBe('99.9%');
    expect(formatPercent(0.995, 'en')).toBe('99.5%');
    expect(formatPercent(0.724, 'de')).toBe('72 %');
    expect(formatWholePercent(70, 'tr')).toBe('%70');
    for (const locale of SUPPORTED_LOCALES) expect(formatPercent(0.42, locale).length, locale).toBeGreaterThan(1);
  });
});
