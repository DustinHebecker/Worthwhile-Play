// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES, bcp47Tag } from '@wp/game-core';
import { COMMON_MESSAGES, createTranslator } from '@wp/localization';
import { CONTENT_LOADERS, preloadContent } from '../src/content';
import { createEnv, type Env } from '../src/env';
import { formatPlural } from '../src/format';
import { LEVELS } from '../src/levels';
import { metadata } from '../src/metadata';
import { gridText, itemPicture, notationText, rhythmGrid } from '../src/pictures';
import { allPatterns, slots, type RhythmGlyph, type Slot } from '../src/rhythm';

const GLYPHS: readonly RhythmGlyph[] = ['eighth', 'quarter', 'dotted-quarter', 'half', 'rest-eighth', 'rest-quarter', 'rest-half'];
/** What a value covers on the eighth grid. */
const SPAN: Readonly<Record<RhythmGlyph, Slot[]>> = {
  eighth: ['onset'],
  quarter: ['onset', 'held'],
  'dotted-quarter': ['onset', 'held', 'held'],
  half: ['onset', 'held', 'held', 'held'],
  'rest-eighth': ['silent'],
  'rest-quarter': ['silent', 'silent'],
  'rest-half': ['silent', 'silent', 'silent', 'silent']
};

const ENV: Record<string, Env> = {};
beforeAll(async () => {
  for (const locale of SUPPORTED_LOCALES) {
    await preloadContent(locale);
    ENV[locale] = createEnv(createTranslator({ locale, sources: [metadata.messages, COMMON_MESSAGES] }), 'auto');
  }
});

/** Every phrase a locale can say for a run of 1…8 equal values, mapped back to the value and count. */
function phrases(env: Env): Map<string, { glyph: RhythmGlyph; n: number }> {
  const out = new Map<string, { glyph: RhythmGlyph; n: number }>();
  for (const glyph of GLYPHS)
    for (let n = 1; n <= 8; n++) {
      const v = env.c.noteValues[glyph];
      const text = n === 1 ? v.single : formatPlural(v.count, n, env.locale);
      expect(out.has(text), `${env.locale}: "${text}" is ambiguous`).toBe(false);
      out.set(text, { glyph, n });
    }
  return out;
}

describe('rhythm notation read aloud (by eye, design § 7.5)', () => {
  it('describes every pattern of every level fully, in every locale: the note values rebuild the slot vector', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const env = ENV[locale]!;
      const known = phrases(env);
      for (const level of LEVELS)
        for (const pattern of allPatterns(level)) {
          const text = notationText(env, pattern);
          const rebuilt: Slot[] = [];
          for (const part of text.split(', ')) {
            const run = known.get(part);
            expect(run, `${locale} ${level} [${pattern.join()}]: "${part}" in "${text}"`).toBeDefined();
            for (let i = 0; i < run!.n; i++) rebuilt.push(...SPAN[run!.glyph]);
          }
          expect(rebuilt, `${locale} [${pattern.join()}] "${text}"`).toEqual(slots(pattern));
        }
    }
  });

  it('reads like notation in en and de (runs counted, dots, rests, half rest)', () => {
    const en = ENV.en!;
    const de = ENV.de!;
    expect(notationText(en, [2, 1, 1, -2, 2])).toBe('quarter note, 2 eighth notes, quarter rest, quarter note');
    expect(notationText(en, [3, 1, 4])).toBe('dotted quarter note, eighth note, half note');
    expect(notationText(en, [1, 1, 1, 1, 2, 2])).toBe('4 eighth notes, 2 quarter notes');
    expect(notationText(en, [-2, -2, 1, 2, 1])).toBe('half rest, eighth note, quarter note, eighth note');
    expect(notationText(en, [-1, 1, 2, 2, -2])).toBe('eighth rest, eighth note, 2 quarter notes, quarter rest');
    expect(notationText(de, [2, 1, 1, -2, 2])).toBe('Viertelnote, 2 Achtelnoten, Viertelpause, Viertelnote');
    expect(notationText(de, [3, 1, 4])).toBe('punktierte Viertelnote, Achtelnote, halbe Note');
    expect(notationText(de, [-2, -2, 2, 2])).toBe('halbe Pause, 2 Viertelnoten');
    expect(notationText(ENV.ru!, [1, 1, 1, 1, 1, 1, 2])).toBe('6 восьмых нот, четвертная нота');
    expect(notationText(ENV.ru!, [1, 1, 1, 1, 4])).toBe('4 восьмые ноты, половинная нота');
    expect(notationText(ENV.pl!, [2, 2, 2, 1, 1])).toBe('3 ćwierćnuty, 2 ósemki');
    expect(notationText(ENV.fr!, [-1, 1, -2, 4])).toBe('demi-soupir, croche, soupir, blanche');
  });

  it('never matches the options: no part of the notation text is a part of any grid text, at every level and locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const env = ENV[locale]!;
      for (const level of LEVELS) {
        const patterns = allPatterns(level);
        // The options' accessible names (the grid images); one is checked against the real element.
        const grids = patterns.map((p) => env.t('grid.name', { text: gridText(env, p) }));
        expect(rhythmGrid(env, patterns[0]!).getAttribute('aria-label')).toBe(grids[0]);
        const gridParts = new Set(patterns.flatMap((p) => gridText(env, p).split(', ')));
        for (const pattern of patterns) {
          const text = notationText(env, pattern);
          const label = env.t('staff.rhythm', { text });
          expect(text.split(', ').filter((part) => gridParts.has(part)), `${locale} ${level}`).toEqual([]);
          expect(grids.find((grid) => grid === label || grid.includes(text)), `${locale} [${pattern.join()}]`).toBeUndefined();
        }
        // The rendered notation carries exactly this name.
        const pattern = patterns[patterns.length - 1]!;
        const svg = itemPicture(env, { k: 'rhythm', options: [pattern], answer: 0 }, false).querySelector('[data-testid="hm-notation"]')!;
        expect(svg.getAttribute('aria-label')).toBe(env.t('staff.rhythm', { text: notationText(env, pattern) }));
      }
    }
  });

  it('every locale has the note values with the plural forms it needs for runs of 2…8', async () => {
    for (const locale of SUPPORTED_LOCALES) {
      const c = await CONTENT_LOADERS[locale]();
      const rules = new Intl.PluralRules(bcp47Tag(locale));
      expect(Object.keys(c.noteValues).sort(), locale).toEqual([...GLYPHS].sort());
      for (const glyph of GLYPHS) {
        const { single, count } = c.noteValues[glyph];
        expect(single.trim().length, `${locale} ${glyph}`).toBeGreaterThan(0);
        expect(single, `${locale} ${glyph}`).not.toContain('{');
        for (let n = 2; n <= 8; n++) expect(count[rules.select(n)], `${locale} ${glyph} ${rules.select(n)}`).toBeDefined();
        // "two" may spell the dual out (Arabic); every other form shows the number.
        for (const [category, form] of Object.entries(count)) if (category !== 'two') expect(form, `${locale} ${glyph} ${category}`).toContain('{n}');
      }
      // Distinct values never read the same.
      expect(new Set(GLYPHS.map((g) => c.noteValues[g].single)).size, locale).toBe(GLYPHS.length);
    }
  });
});
