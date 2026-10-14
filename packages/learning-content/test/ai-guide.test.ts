import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DECK_GUIDE_EXAMPLE, DECK_GUIDE_LOCALES, DECK_GUIDE_TEXT, DEFAULT_GUIDE_ORIGIN, deckGuideFiles, deckGuideMarkdown } from '../src/ai-guide';
import {
  DECK_LINK_MAX_BYTES,
  DECK_LINK_MAX_CHARS,
  DECK_LINK_RECOMMENDED_MAX_CHARS,
  decodeDeckLinkData,
  deckGuidePath,
  deckLink,
  deckLinkData,
  deckToJson,
  encodeDeckLinkData,
  IMPORT_LIMITS,
  importDeck,
  VOCABULARY_LANGUAGES
} from '../src';

const jsonBlocks = (markdown: string) => [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map((m) => m[1] as string);
const textBlocks = (markdown: string) => [...markdown.matchAll(/```text\n([\s\S]*?)\n```/g)].map((m) => m[1] as string);

describe('direct deck links', () => {
  it('round-trips any text through base64url (UTF-8, no padding, URL-safe alphabet)', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme', maxLength: 200 }), (text) => {
        const data = encodeDeckLinkData(text);
        expect(data).toMatch(/^[A-Za-z0-9_-]*$/);
        const decoded = decodeDeckLinkData(data);
        if (text.replace(/^\uFEFF/, '').trim() === '') expect(decoded.ok).toBe(false);
        else expect(decoded).toEqual({ ok: true, text: text.replace(/^\uFEFF/, '') });
      })
    );
  });

  it('builds the documented link and finds the data in a fragment', () => {
    const link = deckLink('https://example.org/', '{"a":"ü"}');
    expect(link).toBe(`https://example.org/decks/import#deck=${encodeDeckLinkData('{"a":"ü"}')}`);
    expect(deckLinkData(new URL(link).hash)).toBe(encodeDeckLinkData('{"a":"ü"}'));
    expect(deckLinkData('#x=1&deck=abc')).toBe('abc');
    expect(deckLinkData('deck=abc')).toBe('abc');
    expect(deckLinkData('#decks=abc')).toBeUndefined();
    expect(deckLinkData('')).toBeUndefined();
  });

  it('also accepts standard base64 with (percent-encoded) padding', () => {
    const text = '{"x":"??>>"}';
    const standard = btoa(text);
    expect(standard).toMatch(/[+/=]/);
    expect(decodeDeckLinkData(standard)).toEqual({ ok: true, text });
    expect(decodeDeckLinkData(standard.replace(/=/g, '%3D'))).toEqual({ ok: true, text });
  });

  it('rejects anything that is not base64 or not UTF-8, and empty data', () => {
    for (const bad of ['', '   ', 'abc!', '<script>', 'a', '%%%', 'deck=', '////_-', btoa('ÿþý')]) {
      expect(decodeDeckLinkData(bad), bad).toMatchObject({ ok: false });
    }
    expect(decodeDeckLinkData('ICAg')).toEqual({ ok: false, code: 'invalid' }); // three spaces
  });

  it('caps the decoded size at the importer limit, before decoding', () => {
    expect(DECK_LINK_MAX_BYTES).toBe(IMPORT_LIMITS.maxInputChars);
    expect(decodeDeckLinkData('A'.repeat(DECK_LINK_MAX_CHARS + 4))).toEqual({ ok: false, code: 'too-large' });
    const justFits = encodeDeckLinkData(`{${' '.repeat(DECK_LINK_MAX_BYTES - 2)}}`);
    expect(decodeDeckLinkData(justFits).ok).toBe(true);
    const tooBig = encodeDeckLinkData(`{${' '.repeat(DECK_LINK_MAX_BYTES - 1)}}`);
    expect(decodeDeckLinkData(tooBig)).toEqual({ ok: false, code: 'too-large' });
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 300 }), (data) => {
        const result = decodeDeckLinkData(data);
        expect(typeof result.ok).toBe('boolean');
      })
    );
  });

  it('an exported deck travels through a link and re-imports identically (apart from the new id)', () => {
    const imported = importDeck(JSON.stringify(DECK_GUIDE_EXAMPLE), { id: 'user-fruit-1' });
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    const decoded = decodeDeckLinkData(deckLinkData(new URL(deckLink('https://x.test', deckToJson(imported.deck))).hash) ?? '');
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    const again = importDeck(decoded.text, { id: 'user-fruit-2', format: 'json' });
    expect(again.ok && again.deck).toEqual({ ...imported.deck, id: 'user-fruit-2' });
  });
});

describe('guide for AIs', () => {
  it('exists for every one of the 16 UI locales, at /ai/deck-guide.<locale>.md', () => {
    expect([...DECK_GUIDE_LOCALES].sort()).toEqual([...VOCABULARY_LANGUAGES].sort());
    expect(Object.keys(DECK_GUIDE_TEXT).sort()).toEqual([...VOCABULARY_LANGUAGES].sort());
    const files = deckGuideFiles();
    expect(Object.keys(files).sort()).toEqual(VOCABULARY_LANGUAGES.map((l) => `ai/deck-guide.${l}.md`).sort());
    expect(deckGuidePath('zh-Hans')).toBe('/ai/deck-guide.zh-Hans.md');
  });

  it('translates the prose: no locale reuses the English text, every text is filled', () => {
    const en = DECK_GUIDE_TEXT.en;
    for (const locale of DECK_GUIDE_LOCALES) {
      const t = DECK_GUIDE_TEXT[locale];
      expect(t.rules, locale).toHaveLength(en.rules.length);
      expect(t.checklist, locale).toHaveLength(en.checklist.length);
      for (const [key, value] of Object.entries(t)) {
        for (const text of [value].flat() as string[]) expect(text.trim(), `${locale}.${key}`).not.toBe('');
        if (locale !== 'en' && key !== 'exampleTitle') expect(value, `${locale}.${key}`).not.toEqual(en[key as keyof typeof en]);
      }
      expect(t.deliveryFile, locale).toContain('{max}');
      expect(t.deliveryFile, locale).toContain('{importUrl}');
    }
  });

  it.each(DECK_GUIDE_LOCALES)('the %s guide: its example imports without errors or warnings via the real importer', (locale) => {
    const markdown = deckGuideMarkdown(locale);
    const [example, ...more] = jsonBlocks(markdown);
    expect(more).toEqual([]);
    const result = importDeck(example as string, { id: 'user-example-1' });
    expect(result).toMatchObject({ ok: true, format: 'json', warnings: [] });
    if (!result.ok) return;
    expect(result.deck.items).toHaveLength(DECK_GUIDE_EXAMPLE.items.length);
    expect(result.deck.title).toEqual(DECK_GUIDE_EXAMPLE.title);

    // The example link opens exactly that deck.
    const link = textBlocks(markdown).find((block) => block.startsWith(`${DEFAULT_GUIDE_ORIGIN}/decks/import#deck=`)) as string;
    expect(link.length).toBeLessThanOrEqual(DECK_LINK_RECOMMENDED_MAX_CHARS);
    const decoded = decodeDeckLinkData(deckLinkData(new URL(link).hash) ?? '');
    expect(decoded.ok && importDeck(decoded.text, { id: 'user-example-1' })).toEqual(result);
  });

  it('states the importer limits and the link format in every locale (identical technical reference)', () => {
    const reference = (markdown: string) => markdown.slice(markdown.indexOf('### JSON format'), markdown.lastIndexOf('\n---\n'));
    const en = reference(deckGuideMarkdown('en'));
    for (const value of [IMPORT_LIMITS.maxItems, IMPORT_LIMITS.maxTextChars, IMPORT_LIMITS.maxTitleChars, IMPORT_LIMITS.maxImageChars, IMPORT_LIMITS.maxInputChars, IMPORT_LIMITS.maxDecks, DECK_LINK_RECOMMENDED_MAX_CHARS]) {
      expect(en).toContain(value.toLocaleString('en-US'));
    }
    expect(en).toContain(`${DEFAULT_GUIDE_ORIGIN}/decks/import#deck=<DATA>`);
    expect(en).toContain('base64url');
    for (const locale of DECK_GUIDE_LOCALES) {
      const markdown = deckGuideMarkdown(locale);
      expect(reference(markdown), locale).toBe(en);
      expect(markdown, locale).not.toMatch(/\{(max|importUrl)\}/);
      expect(markdown, locale).toContain(`${DEFAULT_GUIDE_ORIGIN}/decks/import`);
      expect(markdown, locale).toContain(DECK_GUIDE_TEXT[locale].title);
    }
  });

  it('uses the given origin for every link', () => {
    const markdown = deckGuideMarkdown('de', 'http://localhost:4173/');
    expect(markdown).toContain('http://localhost:4173/decks/import#deck=');
    expect(markdown).toContain('(http://localhost:4173/ai/deck-guide.en.md)');
    expect(markdown).not.toContain(DEFAULT_GUIDE_ORIGIN);
  });
});
