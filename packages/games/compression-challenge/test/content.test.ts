import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT_LOADERS, contentFor, preloadContent, type PieceText, type ContentText } from '../src/content';
import { BULLETS, NOTED_BULLETS, NOTED_SUMMARIES, PIECES, SUMMARIES, VERSIONS } from '../src/pieces';
import { countWords, sentenceIdsFor } from '../src/rules';

/** Every locale's content, loaded through the per-locale loaders (ADR 0011: one chunk per locale). */
const CONTENT: Record<string, ContentText> = {};
beforeAll(async () => {
  for (const [locale, load] of Object.entries(CONTENT_LOADERS)) CONTENT[locale] = await load();
});

const sorted = (keys: Iterable<string>) => [...keys].sort();
const PLACEHOLDER = /\{(\w+)\}/g;

function allStrings(text: PieceText): string[] {
  return [
    text.title,
    text.context,
    text.task,
    text.oneLiner,
    text.versionNote,
    ...Object.values(text.sentences),
    ...Object.values(text.bullets),
    ...Object.values(text.bulletNotes),
    ...Object.values(text.summaries),
    ...Object.values(text.summaryNotes),
    ...Object.values(text.details),
    ...Object.values(text.versions)
  ];
}

/** Numbers of 10 or more, with thousands separators removed (single digits may be spelled out). */
function numbers(s: string): number[] {
  const joined = s.replace(/(\d)[\s.,\u00a0\u202f'’](?=\d{3}\b)/g, '$1');
  return (joined.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 10).sort((a, b) => a - b);
}

describe('piece content', () => {
  it('exists for all 16 UI locales and nothing else', () => {
    expect(sorted(Object.keys(CONTENT))).toEqual(sorted(SUPPORTED_LOCALES));
  });

  it('falls back to English for an unknown locale', async () => {
    await preloadContent('de');
    expect(contentFor('xx')).toBe(CONTENT.en);
    expect(contentFor('de')).toBe(CONTENT.de);
    // Only the requested locale and English were loaded; anything else falls back to English.
    expect(contentFor('ja')).toBe(CONTENT.en);
  });

  it('has the same piece ids and keys in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const content = CONTENT[locale]!;
      expect(sorted(Object.keys(content)), locale).toEqual(sorted(PIECES.map((p) => p.id)));
      for (const def of PIECES) {
        const text = content[def.id]!;
        const where = `${locale}/${def.id}`;
        expect(sorted(Object.keys(text.sentences)), `${where} sentences`).toEqual(sorted(def.sentences.map((s) => s.id)));
        expect(sorted(Object.keys(text.bullets)), `${where} bullets`).toEqual(sorted(BULLETS));
        expect(sorted(Object.keys(text.bulletNotes)), `${where} bulletNotes`).toEqual(sorted(NOTED_BULLETS));
        expect(sorted(Object.keys(text.summaries)), `${where} summaries`).toEqual(sorted(SUMMARIES));
        expect(sorted(Object.keys(text.summaryNotes)), `${where} summaryNotes`).toEqual(sorted(NOTED_SUMMARIES));
        expect(sorted(Object.keys(text.details)), `${where} details`).toEqual(sorted(def.details.map((d) => d.id)));
        expect(sorted(Object.keys(text.versions)), `${where} versions`).toEqual(sorted(VERSIONS));
      }
    }
  });

  it('has no empty or untrimmed strings, no placeholders and no duplicate options', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of PIECES) {
        const text = CONTENT[locale]![def.id]!;
        const where = `${locale}/${def.id}`;
        for (const value of allStrings(text)) {
          expect(value.trim(), where).not.toBe('');
          expect(value, where).toBe(value.trim());
          expect(value.match(PLACEHOLDER), `${where}: ${value}`).toBeNull();
        }
        // Every option must be distinguishable from the others.
        for (const group of [text.sentences, text.bullets, text.summaries, text.details, text.versions]) {
          const values = Object.values(group);
          expect(new Set(values).size, `${where}: ${values.join(' | ')}`).toBe(values.length);
        }
      }
    }
  });

  it('is not an untranslated copy of English', () => {
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      for (const def of PIECES) {
        const text = CONTENT[locale]![def.id]!;
        const en = CONTENT.en![def.id]!;
        const where = `${locale}/${def.id}`;
        expect(Object.keys(en.sentences).filter((k) => text.sentences[k] === en.sentences[k]), where).toEqual([]);
        expect(Object.keys(en.summaries).filter((k) => text.summaries[k as keyof typeof en.summaries] === en.summaries[k as keyof typeof en.summaries]), where).toEqual([]);
        expect(text.oneLiner, where).not.toBe(en.oneLiner);
      }
    }
  });

  it('keeps every number in every translation (numbers carry the key facts and the subtle distortions)', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of PIECES) {
        const text = CONTENT[locale]![def.id]!;
        const en = CONTENT.en![def.id]!;
        const pairs: [string, string | undefined, string][] = [
          ...Object.entries(en.sentences).map(([k, v]): [string, string | undefined, string] => [`sentences.${k}`, text.sentences[k], v]),
          ...Object.entries(en.bullets).map(([k, v]): [string, string | undefined, string] => [`bullets.${k}`, text.bullets[k as keyof typeof en.bullets], v]),
          ...Object.entries(en.summaries).map(([k, v]): [string, string | undefined, string] => [`summaries.${k}`, text.summaries[k as keyof typeof en.summaries], v]),
          ...Object.entries(en.details).map(([k, v]): [string, string | undefined, string] => [`details.${k}`, text.details[k], v]),
          ...Object.entries(en.versions).map(([k, v]): [string, string | undefined, string] => [`versions.${k}`, text.versions[k as keyof typeof en.versions], v])
        ];
        for (const [key, translated, reference] of pairs) expect(numbers(translated ?? ''), `${locale}/${def.id}/${key}`).toEqual(numbers(reference));
      }
    }
  });
});

describe('English reference content', () => {
  it('keeps the source texts at a moderate length that grows with the difficulty', () => {
    for (const def of PIECES) {
      const text = CONTENT.en![def.id]!;
      const length = (d: 'easy' | 'medium' | 'hard') => countWords(sentenceIdsFor(def, d).map((id) => text.sentences[id]).join(' '));
      expect(length('easy'), def.id).toBeGreaterThanOrEqual(80);
      expect(length('easy'), def.id).toBeLessThan(length('medium'));
      expect(length('medium'), def.id).toBeLessThan(length('hard'));
      expect(length('hard'), def.id).toBeLessThanOrEqual(260);
    }
  });

  it('makes the faithful sentence a single sentence near the word target, and the one-liner short', () => {
    for (const def of PIECES) {
      const text = CONTENT.en![def.id]!;
      expect(countWords(text.summaries.faithful), def.id).toBeLessThanOrEqual(32);
      expect(text.summaries.faithful.replace(/\.$/, '').includes('. '), def.id).toBe(false);
      expect(countWords(text.oneLiner), def.id).toBeLessThanOrEqual(10);
      // The expansion really expands.
      expect(countWords(text.versions.actionable), def.id).toBeGreaterThan(3 * countWords(text.oneLiner));
    }
  });

  it('writes the subtle distortions as near copies that differ in a number or a few words', () => {
    for (const def of PIECES) {
      const text = CONTENT.en![def.id]!;
      expect(text.bullets.subtle, def.id).not.toBe(text.bullets.gold1);
      expect(text.summaries.subtle, def.id).not.toBe(text.summaries.faithful);
      // Each subtle bullet shares most of its words with a gold bullet or with a sentence of the text.
      const share = (a: string, b: string) => {
        const wa = new Set(a.toLowerCase().match(/[\p{L}\d]+/gu));
        const wb = b.toLowerCase().match(/[\p{L}\d]+/gu) ?? [];
        return wb.filter((w) => wa.has(w)).length / wb.length;
      };
      const sources = [text.bullets.gold1, text.bullets.gold2, text.bullets.gold3, ...Object.values(text.sentences)];
      const best = Math.max(...sources.map((source) => share(source, text.bullets.subtle)));
      expect(best, def.id).toBeGreaterThanOrEqual(0.5);
      expect(share(text.summaries.faithful, text.summaries.subtle), def.id).toBeGreaterThanOrEqual(0.5);
    }
  });
});
