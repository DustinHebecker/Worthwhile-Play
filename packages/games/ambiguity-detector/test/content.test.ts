import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT_LOADERS, contentFor, preloadContent } from '../src/content';
import { ITEMS, type LocaleContent } from '../src/content/items';

/** Every locale's content, loaded through the per-locale loaders (ADR 0011: one chunk per locale). */
const CONTENT: Record<string, LocaleContent> = {};
beforeAll(async () => {
  for (const [locale, load] of Object.entries(CONTENT_LOADERS)) CONTENT[locale] = await load();
});

const sorted = (keys: Iterable<string>) => [...keys].sort();

describe('content parity across the 16 UI locales', () => {
  it('has content for exactly the supported locales', () => {
    expect(sorted(Object.keys(CONTENT))).toEqual(sorted(SUPPORTED_LOCALES));
  });

  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: every item has complete, non-empty texts matching its gold answer`, () => {
      const texts = CONTENT[locale];
      expect(texts).toBeDefined();
      expect(sorted(Object.keys(texts ?? {}))).toEqual(sorted(ITEMS.map((item) => item.id)));
      for (const item of ITEMS) {
        const text = texts?.[item.id];
        expect(text, `${locale}/${item.id}`).toBeDefined();
        if (!text) continue;
        const where = `${locale}/${item.id}`;
        expect(text.context.trim(), where).not.toBe('');
        expect(text.text.trim(), where).not.toBe('');
        expect(sorted(Object.keys(text.ask)), `${where} ask`).toEqual(sorted(item.missing));
        expect(sorted(Object.keys(text.given)), `${where} given`).toEqual(sorted(item.given));
        expect(sorted(Object.keys(text.replies)), `${where} replies`).toEqual(sorted(['clear', 'vague', item.third]));
        const strings = [text.context, text.text, ...Object.values(text.ask), ...Object.values(text.given), ...Object.values(text.replies)];
        for (const s of strings) {
          expect(typeof s, where).toBe('string');
          expect((s as string).trim(), where).not.toBe('');
          expect(s, `${where} must not contain placeholders`).not.toMatch(/\{\w+\}/);
        }
        const replies = Object.values(text.replies);
        expect(new Set(replies).size, `${where} replies differ`).toBe(replies.length);
      }
    });
  }

  it('translates rather than copies English (most texts differ from English)', () => {
    const en = CONTENT.en!;
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      const same = ITEMS.filter((item) => CONTENT[locale]?.[item.id]?.text === en[item.id]?.text).length;
      expect(same, locale).toBe(0);
    }
  });

  it('falls back to English for unknown locales', async () => {
    await preloadContent('de');
    expect(contentFor('xx')).toBe(CONTENT.en);
    expect(contentFor('de')).toBe(CONTENT.de);
    // Only the requested locale and English were loaded; anything else falls back to English.
    expect(contentFor('ja')).toBe(CONTENT.en);
  });
});
