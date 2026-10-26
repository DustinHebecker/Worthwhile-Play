import { SUPPORTED_LOCALES } from '@wp/localization';
import { beforeAll, describe, expect, it } from 'vitest';
import { CONTENT_LOADERS, type ContentText } from '../src/content';
import { formatPercent, formatPoints, formatWholePercent, percentParts, sharePhrase } from '../src/format';
import { messages } from '../src/messages';
import { CHECK_TEMPLATES, CLUE_TEMPLATES } from '../src/templates';
import { TRAP_TEMPLATES } from '../src/traps';
import { createRng } from '@wp/game-core';

const CONTENT: Record<string, ContentText> = {};
beforeAll(async () => {
  for (const [locale, load] of Object.entries(CONTENT_LOADERS)) CONTENT[locale] = await load();
});

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
/** Any decimal digit in any script (Latin, Arabic-Indic, Devanagari, full-width …). */
const DIGIT = /\p{Nd}/u;

describe('content (design § 17)', () => {
  it('has text for every clue template, hypothesis and clue in all 16 locales, without digits', () => {
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
        for (const spec of t.clues) if (spec.kind === 'neutral' || spec.kind === 'echo') expect(tx.clues[spec.id]!.seen).toBe(tx.clues[spec.id]!.notSeen);
      }
    }
  });
  it('has text for every checks template, option and check in all 16 locales, without digits', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const c = CONTENT[locale]!;
      expect(Object.keys(c.checks).sort(), locale).toEqual(CHECK_TEMPLATES.map((t) => t.id).sort());
      for (const t of CHECK_TEMPLATES) {
        const tx = c.checks[t.id]!;
        expect(Object.keys(tx.hyps).sort(), `${locale} ${t.id}`).toEqual([...t.hyps].sort());
        expect(Object.keys(tx.options).sort(), `${locale} ${t.id}`).toEqual(t.options.map((o) => o.id).sort());
        expect(Object.keys(tx.checks).sort(), `${locale} ${t.id}`).toEqual(t.checks.map((k) => k.id).sort());
        const texts = [tx.title, tx.story, tx.lead, tx.question, ...Object.values(tx.hyps), ...Object.values(tx.options), ...Object.values(tx.checks).flatMap((x) => [x.label, x.yes, x.no])];
        for (const s of texts) {
          expect(s.trim().length, `${locale} ${t.id}`).toBeGreaterThan(0);
          expect(DIGIT.test(s), `${locale} ${t.id}: ${s}`).toBe(false);
        }
      }
    }
  });
  it('has text for every trap template in all 16 locales, numbers only as placeholders the template fills', () => {
    for (const t of TRAP_TEMPLATES) {
      const d = t.levels[t.levels.length - 1]!;
      const p = t.draw(createRng(1), d);
      const known = new Set([...Object.keys(t.tokens(p)), ...Object.keys(t.explainTokens(p)), 'n']);
      const ids = new Set(t.questions(p).map((q) => q.id));
      const optionIds = new Set(t.questions(p).flatMap((q) => (q.kind === 'choice' ? q.options : [])));
      for (const locale of SUPPORTED_LOCALES) {
        const tx = CONTENT[locale]!.traps[t.id]!;
        expect(tx, `${locale} ${t.id}`).toBeDefined();
        expect(new Set(Object.keys(tx.questions)), `${locale} ${t.id}`).toEqual(ids);
        expect(new Set(Object.keys(tx.options)), `${locale} ${t.id}`).toEqual(optionIds);
        expect(Object.keys(tx.labels).sort(), `${locale} ${t.id}`).toEqual(Object.keys(CONTENT.en!.traps[t.id]!.labels).sort());
        const texts = [tx.title, tx.story, tx.explain, ...Object.values(tx.questions), ...Object.values(tx.options), ...Object.values(tx.labels)];
        for (const s of texts) {
          expect(DIGIT.test(s.replace(/\{\w+\}/g, '')), `${locale} ${t.id}: ${s}`).toBe(false);
          for (const name of placeholders(s)) expect(known.has(name!), `${locale} ${t.id}: {${name}}`).toBe(true);
        }
        // The same placeholders as English in every string.
        const en = CONTENT.en!.traps[t.id]!;
        expect(placeholders(tx.story), `${locale} ${t.id} story`).toEqual(placeholders(en.story));
        expect(placeholders(tx.explain), `${locale} ${t.id} explain`).toEqual(placeholders(en.explain));
        for (const [k, v] of Object.entries(en.questions)) expect(placeholders(tx.questions[k]!), `${locale} ${t.id} ${k}`).toEqual(placeholders(v));
      }
    }
  });
  it('the other locales are translations, not copies of English', () => {
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      expect(CONTENT[locale]!.templates['c-parcel']!.story, locale).not.toBe(CONTENT.en!.templates['c-parcel']!.story);
      expect(CONTENT[locale]!.checks['k-picnic']!.story, locale).not.toBe(CONTENT.en!.checks['k-picnic']!.story);
      expect(CONTENT[locale]!.traps['t-sensor']!.story, locale).not.toBe(CONTENT.en!.traps['t-sensor']!.story);
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
  it('points carry a sign and the proper minus sign; shares read as "k in n" or a percent', () => {
    expect(formatPoints(-12, 'en')).toBe('\u221212');
    expect(formatPoints(1.756, 'en')).toBe('+1.76');
    expect(formatPoints(0, 'en')).toBe('0');
    expect(formatPoints(-0.001, 'en')).toBe('0');
    for (const locale of SUPPORTED_LOCALES) expect(formatPoints(-3.5, locale), locale).toContain('\u2212');
    const f = (k: string, n: string) => `${k} in ${n}`;
    expect(sharePhrase(3, 10, 'en', f)).toBe('3 in 10');
    expect(sharePhrase(1, 50, 'en', f)).toBe('1 in 50');
    expect(sharePhrase(5, 1000, 'en', f)).toBe('1 in 200');
    expect(sharePhrase(40, 100, 'en', f)).toBe('40%');
    expect(sharePhrase(975, 1000, 'en', f)).toBe('97.5%');
  });
});
