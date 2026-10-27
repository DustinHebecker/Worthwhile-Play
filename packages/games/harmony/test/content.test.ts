import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES, bcp47Tag } from '@wp/game-core';
import { CONTENT_LOADERS, type ContentText, type PluralForms } from '../src/content';
import { formatPlural } from '../src/format';
import { messages } from '../src/messages';
import { defaultSystem, noteLabel } from '../src/notes';
import { INTERVALS } from '../src/theory';

const CONTENT: Record<string, ContentText> = {};
beforeAll(async () => {
  for (const [locale, load] of Object.entries(CONTENT_LOADERS)) CONTENT[locale] = await load();
});

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/** Every string leaf of a value with its path. */
function leaves(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [];
}
const isPlural = (path: string) => /^(semitones|cents|waveRepeat)\./.test(path);

describe('content (design § 18.1)', () => {
  it('every locale has the same terms, tips and lines as English, with the same placeholders', () => {
    expect(Object.keys(CONTENT_LOADERS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    const en = new Map(leaves(CONTENT.en).filter(([p]) => !isPlural(p)));
    for (const locale of SUPPORTED_LOCALES) {
      const mine = new Map(leaves(CONTENT[locale]).filter(([p]) => !isPlural(p)));
      expect([...mine.keys()].sort(), locale).toEqual([...en.keys()].sort());
      for (const [path, text] of mine) {
        expect(text.trim().length, `${locale} ${path}`).toBeGreaterThan(0);
        expect(placeholders(text), `${locale} ${path}`).toEqual(placeholders(en.get(path)!));
      }
    }
  });

  it('has every plural category each locale uses, for whole semitones, waves and cents with one decimal', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const c = CONTENT[locale]!;
      const whole = new Intl.PluralRules(bcp47Tag(locale));
      const decimal = new Intl.PluralRules(bcp47Tag(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      const need = new Set<string>();
      for (let n = 0; n <= 200; n++) need.add(whole.select(n));
      for (let n = 0; n <= 200; n += 0.1) need.add(decimal.select(Math.round(n * 10) / 10));
      for (const forms of [c.semitones, c.cents, c.waveRepeat] as PluralForms[]) {
        for (const category of need) expect(forms[category as Intl.LDMLPluralRule] ?? (category === 'other' ? undefined : forms.other), `${locale} ${category}`).toBeDefined();
        for (const [category, form] of Object.entries(forms)) {
          // "one"/"two" may spell the number out (Arabic); every other form shows it.
          if (!['one', 'two'].includes(category)) expect(form, `${locale} ${category}`).toContain('{n}');
        }
      }
      expect(formatPlural(c.semitones, 4, locale)).toMatch(/\p{Nd}|\S/u);
    }
    // The wave caption counts 1…5 waves: "with every wave", "every 2 waves" (ru: 2 волны, 5 волн).
    expect(formatPlural(CONTENT.en!.waveRepeat, 1, 'en')).toBe('Sum of the fundamentals: repeats with every wave of the lower note.');
    expect(formatPlural(CONTENT.en!.waveRepeat, 4, 'en')).toContain('every 4 waves');
    expect(formatPlural(CONTENT.ru!.waveRepeat, 2, 'ru')).toContain('2 волны');
    expect(formatPlural(CONTENT.ru!.waveRepeat, 5, 'ru')).toContain('5 волн ');
    expect(formatPlural(CONTENT.pl!.waveRepeat, 3, 'pl')).toContain('3 fale');
  });

  it('never refers to songs (no song titles or "the first notes of …" tips; a heuristic)', () => {
    const FORBIDDEN = ['song', 'lied ', 'liedje', 'canción', 'chanson', 'canzone', 'canção', 'piosenk', 'şarkı', 'песн', 'пісн', 'أغنية', 'गाना', '歌曲', '曲名', '노래 제목'];
    for (const locale of SUPPORTED_LOCALES) {
      const texts = [...leaves(CONTENT[locale]).map(([, t]) => t), ...Object.values(messages[locale]!)].map((t) => t.toLowerCase());
      for (const word of FORBIDDEN) for (const t of texts) expect(t.includes(word), `${locale}: ${word} in ${t}`).toBe(false);
    }
  });

  it('uses the glossary terms of design Appendix B for en and de', () => {
    expect(INTERVALS.map((i) => CONTENT.en!.intervals[i])).toEqual(['minor second', 'major second', 'minor third', 'major third', 'perfect fourth', 'tritone', 'perfect fifth', 'minor sixth', 'major sixth', 'minor seventh', 'major seventh', 'octave']);
    expect(INTERVALS.map((i) => CONTENT.de!.intervals[i])).toEqual(['kleine Sekunde', 'große Sekunde', 'kleine Terz', 'große Terz', 'reine Quarte', 'Tritonus', 'reine Quinte', 'kleine Sexte', 'große Sexte', 'kleine Septime', 'große Septime', 'Oktave']);
    expect(CONTENT.de!.scales['natural-minor']).toBe('natürliches Moll');
    expect(CONTENT.de!.chords.dom7).toBe('Dominantseptakkord');
    expect(CONTENT.fr!.intervals.P5).toBe('quinte juste');
    expect(CONTENT.ru!.intervals.M3).toBe('большая терция');
  });

  it('step words of scale patterns never look like a note name of the locale (German and Polish G/H/C are notes)', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const own = new Set<string>();
      for (let l = 0; l < 7; l++) for (const a of [-1, 0, 1] as const) own.add(noteLabel({ l, a }, defaultSystem(locale), locale));
      for (const word of Object.values(CONTENT[locale]!.steps)) expect(own.has(word), `${locale}: ${word}`).toBe(false);
    }
  });

  it('Simplified Chinese has no traditional-only characters', () => {
    const TRADITIONAL = /[調聲終樂階協鍵號個這與從開輕銳減屬圖選擇譜節顯參點題級絃絕練習麼們處聽應問陣]/u;
    for (const text of [...leaves(CONTENT['zh-Hans']).map(([, t]) => t), ...Object.values(messages['zh-Hans']!)]) expect(TRADITIONAL.test(text), text).toBe(false);
  });
});
