import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { bcp47Tag } from '@wp/game-core';
import { CONTENT_LOADERS, contentFor, preloadContent, type ContentText } from '../src/content';
import { messages } from '../src/messages';
import { referenceProduct } from '../src/rules';
import { CATEGORIES, TASKS } from '../src/tasks';
import { pluralCategory, pluralForm } from '../src/format';
import { COUNTED_UNITS, COUNTED_WORDS, COUNT_WORDS, WORD_UNITS, isCountWord, multiply, parseUnit, sameDims, unitTokens } from '../src/units';

/** Every locale's content, loaded through the per-locale loaders (ADR 0011: one chunk per locale). */
const CONTENT: Record<string, ContentText> = {};
beforeAll(async () => {
  for (const [locale, load] of Object.entries(CONTENT_LOADERS)) CONTENT[locale] = await load();
});

const sorted = (keys: Iterable<string>) => [...new Set(keys)].sort();
const FACTOR_IDS = sorted(TASKS.flatMap((t) => t.factors.map((f) => f.id)));

describe('task data (the checks of docs/design/fermi-lab-content.md)', () => {
  it('has unique ids, 2–5 factors with unique ids, at least one open factor, and sources about known things', () => {
    expect(new Set(TASKS.map((t) => t.id)).size).toBe(TASKS.length);
    for (const t of TASKS) {
      expect(t.factors.length, t.id).toBeGreaterThanOrEqual(2);
      expect(t.factors.length, t.id).toBeLessThanOrEqual(5);
      expect(new Set(t.factors.map((f) => f.id)).size, t.id).toBe(t.factors.length);
      expect(t.factors.some((f) => !f.fixed), t.id).toBe(true);
      expect(t.sources.length, t.id).toBeGreaterThan(0);
      for (const s of t.sources) {
        expect(s.about === 'answer' || t.factors.some((f) => f.id === s.about), `${t.id}: ${s.about}`).toBe(true);
        if (s.url) expect(s.url, t.id).toMatch(/^https:\/\/[^\s]+$/);
      }
    }
  });

  it('covers every category with at least 8 tasks and every level, and 14–17 tasks per level', () => {
    for (const c of CATEGORIES) {
      const tasks = TASKS.filter((t) => t.category === c);
      expect(tasks.length, c).toBeGreaterThanOrEqual(8);
      for (const level of [1, 2, 3]) expect(tasks.some((t) => t.level === level), `${c} level ${level}`).toBe(true);
    }
    for (const level of [1, 2, 3]) {
      const n = TASKS.filter((t) => t.level === level).length;
      expect(n, `level ${level}`).toBeGreaterThanOrEqual(14);
      expect(n, `level ${level}`).toBeLessThanOrEqual(17);
    }
  });

  it('has ranges around the values: low ≤ value ≤ high and low ≤ central ≤ high', () => {
    for (const t of TASKS) {
      const a = t.answer;
      expect(a.low <= a.central && a.central <= a.high && a.low > 0, t.id).toBe(true);
      for (const f of t.factors) {
        expect(f.low <= f.value && f.value <= f.high && f.low > 0, `${t.id}/${f.id}`).toBe(true);
        if (f.fixed) expect(f.low === f.value && f.high === f.value, `${t.id}/${f.id}`).toBe(true);
      }
    }
  });

  it('reference models cancel to the answer unit and lie within 0.05 decades of the central value', () => {
    for (const t of TASKS) {
      const product = multiply(t.factors.map((f) => ({ value: f.value, unit: f.unit, power: f.power })));
      expect(product, t.id).not.toBeNull();
      expect(sameDims(product!.dims, parseUnit(t.answer.unit)!.dims), `${t.id}: units`).toBe(true);
      const d = Math.abs(Math.log10(referenceProduct(t)! / t.answer.central));
      expect(d, `${t.id}: ${referenceProduct(t)} vs ${t.answer.central}`).toBeLessThanOrEqual(0.05);
    }
  });
});

describe('task wording', () => {
  it('exists for all 16 UI locales and falls back to English', async () => {
    expect(sorted(Object.keys(CONTENT))).toEqual(sorted(SUPPORTED_LOCALES));
    await preloadContent('de');
    expect(contentFor('xx')).toBe(CONTENT.en);
    expect(contentFor('de')).toBe(CONTENT.de);
  });

  it('has a title, question and explanation for every task and a name for every factor, in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const c = CONTENT[locale]!;
      expect(sorted(Object.keys(c.tasks)), locale).toEqual(sorted(TASKS.map((t) => t.id)));
      expect(sorted(Object.keys(c.factors)), locale).toEqual(FACTOR_IDS);
      for (const [id, text] of Object.entries(c.tasks)) {
        for (const field of ['title', 'question', 'explain'] as const) {
          expect(text[field].trim().length, `${locale}/${id}.${field}`).toBeGreaterThan(field === 'explain' ? 50 : 1);
          expect(text[field], `${locale}/${id}.${field}`).not.toMatch(/\{\w+\}|TODO/);
        }
        expect(text.question.length, `${locale}/${id}`).toBeLessThan(220);
      }
      for (const [id, name] of Object.entries(c.factors)) expect(name.trim().length, `${locale}/${id}`).toBeGreaterThan(1);
    }
  });

  it('is translated: no locale other than English repeats the English explanations', () => {
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== 'en')) {
      const same = TASKS.filter((t) => CONTENT[locale]!.tasks[t.id]!.explain === CONTENT.en!.tasks[t.id]!.explain);
      expect(same.map((t) => t.id), locale).toEqual([]);
    }
  });

  it('never gives the answer away in the question', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const t of TASKS) {
        if (t.answer.central < 10) continue;
        const q = CONTENT[locale]!.tasks[t.id]!.question;
        const forms = [
          new Intl.NumberFormat('en', { maximumSignificantDigits: 2, useGrouping: false }).format(t.answer.central),
          new Intl.NumberFormat(bcp47Tag(locale), { maximumSignificantDigits: 2 }).format(t.answer.central),
          new Intl.NumberFormat(bcp47Tag(locale), { maximumSignificantDigits: 2, notation: 'compact', compactDisplay: 'long' }).format(t.answer.central)
        ];
        for (const form of forms) expect(q.includes(form), `${locale}/${t.id}: "${form}"`).toBe(false);
      }
    }
  });

  it('every unit word and count word used by a task has its words in all locales', () => {
    const tokens = sorted(TASKS.flatMap((t) => [t.answer.unit, ...t.factors.map((f) => f.unit)].flatMap(unitTokens)));
    for (const locale of SUPPORTED_LOCALES) {
      const m = messages[locale]!;
      for (const token of tokens) {
        if (isCountWord(token)) {
          expect(m[`u.${token}`], `${locale} u.${token}`).toBeTruthy();
          expect(CONTENT[locale]!.counts[token]?.other, `${locale} counts.${token}`).toBeTruthy();
        } else if ((WORD_UNITS as readonly string[]).includes(token)) expect(m[`u.${token}`], `${locale} u.${token}`).toBeTruthy();
      }
    }
    // Every declared count word is used (no dead keys).
    for (const word of COUNT_WORDS) expect(tokens, word).toContain(word);
  });
});

describe('plural forms (counts after a number, "times too high/low")', () => {
  /** The numbers the brief names, plus the edges of the Slavic and Arabic categories and a large number. */
  const NUMBERS = [0, 1, 2, 5, 21, 1.5, 3, 11, 22, 100, 101, 1e6, 3.5e9];
  const ratioKeys = ['high', 'low', 'rowHigh', 'rowLow', 'biasHigh', 'biasLow'] as const;

  it('has a form for every plural category of every locale (no fallback to "other")', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const c = CONTENT[locale]!;
      const categories = new Intl.PluralRules(bcp47Tag(locale)).resolvedOptions().pluralCategories;
      expect(sorted(Object.keys(c.counts)), locale).toEqual(sorted(COUNTED_WORDS));
      const all = [...COUNTED_WORDS.map((w) => [`counts.${w}`, c.counts[w]] as const), ...ratioKeys.map((k) => [`ratios.${k}`, c.ratios[k]] as const)];
      for (const [name, forms] of all) {
        // Exactly the locale's categories: a missing one would silently fall back, an extra one is dead text.
        expect(sorted(Object.keys(forms)), `${locale} ${name}`).toEqual(sorted(categories));
        for (const cat of categories) expect(forms[cat]?.trim(), `${locale} ${name} ${cat}`).toBeTruthy();
      }
    }
  });

  it('renders every count word and ratio sentence for 0, 1, 2, 5, 21 and 1.5 (and more) in all 16 locales', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const c = CONTENT[locale]!;
      for (const n of NUMBERS) {
        const cat = pluralCategory(n, locale);
        for (const w of COUNTED_WORDS) {
          const form = c.counts[w][cat];
          expect(form, `${locale} counts.${w} has no "${cat}" form (n = ${n})`).toBeDefined();
          expect(form, `${locale} counts.${w}`).not.toMatch(/[{}]/);
        }
        for (const k of ratioKeys) {
          const form = c.ratios[k][cat];
          expect(form, `${locale} ratios.${k} has no "${cat}" form (n = ${n})`).toBeDefined();
          // "one" and "two" may spell the number out ("بمرتين"); every other form shows it.
          if (cat !== 'one' && cat !== 'two') expect(form, `${locale} ratios.${k} ${cat}`).toContain('{n}');
          const text = pluralForm(c.ratios[k], n, locale).replace('{n}', new Intl.NumberFormat(bcp47Tag(locale)).format(n));
          expect(text, `${locale} ratios.${k} n = ${n}`).not.toMatch(/[{}]/);
        }
      }
    }
  });

  it('chooses the right forms in the languages with several plural forms', () => {
    const word = (locale: string, w: (typeof COUNTED_WORDS)[number], n: number) => pluralForm(CONTENT[locale]!.counts[w], n, locale);
    const days = (locale: string) => [1, 2, 5, 21, 1.5].map((n) => word(locale, 'year', n));
    expect([1, 2, 5, 1.5].map((n) => word('en', 'day', n))).toEqual(['day', 'days', 'days', 'days']);
    expect(days('ru')).toEqual(['год', 'года', 'лет', 'год', 'года']);
    expect(days('uk')).toEqual(['рік', 'роки', 'років', 'рік', 'року']);
    expect(days('pl')).toEqual(['rok', 'lata', 'lat', 'lat', 'roku']);
    expect([0, 1, 2, 5, 11, 100].map((n) => word('ar', 'day', n))).toEqual(['يوم', 'يوم', 'يومان', 'أيام', 'يومًا', 'يوم']);
    expect([1, 1.5, 2].map((n) => word('fr', 'day', n))).toEqual(['jour', 'jour', 'jours']);
    expect([1, 2].map((n) => word('de', 'grain', n))).toEqual(['Korn', 'Körner']);
    const times = (locale: string, n: number) => pluralForm(CONTENT[locale]!.ratios.high, n, locale).replace('{n}', String(n));
    expect([2, 5, 21, 1.5].map((n) => times('ru', n))).toEqual(['В 2 раза больше.', 'В 5 раз больше.', 'В 21 раз больше.', 'В 1.5 раза больше.']);
    expect([2, 5, 1.5].map((n) => times('uk', n))).toEqual(['У 2 рази більше.', 'У 5 разів більше.', 'У 1.5 раза більше.']);
    expect([2, 5, 1.5].map((n) => times('pl', n))).toEqual(['2 razy za wysoko.', '5 razy za wysoko.', '1.5 raza za wysoko.']);
    expect([1, 2].map((n) => times('es', n))).toEqual(['1 vez demasiado alto.', '2 veces demasiado alto.']);
    expect([2, 3, 11].map((n) => times('ar', n))).toEqual(['أعلى بمرتين.', 'أعلى بـ 3 مرات.', 'أعلى بـ 11 مرة.']);
  });

  it('keeps the per-unit form in the catalogue for every counted word and no count forms there', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const m = messages[locale]!;
      for (const w of [...COUNT_WORDS, ...COUNTED_UNITS]) expect(m[`u.${w}`], `${locale} u.${w}`).toBeTruthy();
      expect(Object.keys(m).filter((k) => k.startsWith('n.')), locale).toEqual([]);
    }
  });
});
