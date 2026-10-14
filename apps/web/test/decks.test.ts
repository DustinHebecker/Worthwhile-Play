import { describe, expect, it } from 'vitest';
import { createTranslator, SUPPORTED_LOCALES } from '@wp/localization';
import { importDeck, IMPORT_LIMITS, type Deck, type ImportError, type ImportWarning } from '@wp/learning-content';
import { createMemoryDeckStore } from '@wp/persistence';
import { UI_MESSAGES } from '../src/i18n';
import { deckLanguages, importErrorText, importWarningText, loadUserDecks, newDeckId, toStoredDeck, userDeckSource } from '../src/lib/decks';
import { loadAllLocales } from './locales';

await loadAllLocales();

const deck = (id: string, extra: Partial<Deck> = {}): Deck => ({
  schemaVersion: 1,
  id,
  title: { en: id },
  items: [
    { id: 'a', front: { text: 'Hund', lang: 'de' }, back: { text: 'dog', lang: 'en' } },
    { id: 'b', front: { symbol: '🐈' }, back: { text: 'Katze', lang: 'de' } }
  ],
  ...extra
});

describe('stored decks', () => {
  it('accepts only valid records whose id matches the deck', () => {
    expect(toStoredDeck({ id: 'user-a-1', importedAt: '2026-01-01T00:00:00Z', deck: deck('user-a-1') })).toMatchObject({ id: 'user-a-1' });
    expect(toStoredDeck({ id: 'user-a-1', importedAt: '2026-01-01T00:00:00Z', deck: deck('user-b-1') })).toBeUndefined();
    expect(toStoredDeck({ id: 'symbols', importedAt: 'x', deck: deck('symbols') })).toBeUndefined();
    expect(toStoredDeck({ id: 'user-a-1', deck: deck('user-a-1') })).toBeUndefined();
    expect(toStoredDeck({ id: 'user-a-1', importedAt: 'x', deck: { ...deck('user-a-1'), items: [] } })).toBeUndefined();
    expect(toStoredDeck(null)).toBeUndefined();
  });

  it('loads valid decks newest first and skips broken records', async () => {
    const store = createMemoryDeckStore();
    await store.put({ id: 'user-old-1', importedAt: '2026-01-01T00:00:00Z', deck: deck('user-old-1') });
    await store.put({ id: 'user-new-1', importedAt: '2026-02-01T00:00:00Z', deck: deck('user-new-1') });
    await store.put({ id: 'user-bad-1', importedAt: '2026-03-01T00:00:00Z', deck: { junk: true } });
    expect((await loadUserDecks(store)).map((d) => d.id)).toEqual(['user-new-1', 'user-old-1']);
    const failing = { ...store, list: async () => { throw new Error('boom'); } };
    expect(await loadUserDecks(failing)).toEqual([]);
  });

  it('provides a synchronous snapshot for games', async () => {
    const store = createMemoryDeckStore();
    await store.put({ id: 'user-a-1', importedAt: '2026-01-01T00:00:00Z', deck: deck('user-a-1', { title: { en: 'A', de: 'Ä' } }) });
    const source = userDeckSource(await loadUserDecks(store));
    expect(source.list()).toEqual([{ id: 'user-a-1', title: { en: 'A', de: 'Ä' }, itemCount: 2 }]);
    expect((source.get('user-a-1') as Deck).items).toHaveLength(2);
    expect(source.get('user-x-1')).toBeUndefined();
  });

  it('creates fresh user deck ids from random bytes', () => {
    expect(newDeckId('Spanish verbs', () => [0, 15, 255, 16])).toBe('user-spanish-verbs-000fff10');
    expect(newDeckId('x')).toMatch(/^user-x-[0-9a-f]{8}$/);
    expect(newDeckId('x')).not.toBe(newDeckId('x'));
  });

  it('lists the languages of both sides and detects picture fronts', () => {
    expect(deckLanguages(deck('user-a-1'))).toEqual({ front: ['de'], back: ['en', 'de'], pictures: { front: true, back: false } });
    expect(deckLanguages({ ...deck('user-a-1'), items: deck('user-a-1').items.slice(0, 1) }).pictures).toEqual({ front: false, back: false });
    expect(deckLanguages({ ...deck('user-a-1'), items: [{ id: 'x', front: { symbol: '🐈' }, back: { text: 'cat' } }] })).toEqual({ front: [], back: [], pictures: { front: true, back: false } });
  });
});

describe('import messages', () => {
  const t = createTranslator({ locale: 'en', sources: [UI_MESSAGES] }) as never;

  it('locates errors by line and card and picks the side-specific text', () => {
    const result = importDeck('front_text,back_text\nok,\n', { id: 'user-x-1', title: 'X' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((e) => importErrorText(t, e))).toEqual(['Line 2 (card 1): The back is empty.']);
    expect(importErrorText(t, { code: 'empty-side', item: 3, side: 'front' })).toBe('Card 3: The front is empty.');
    expect(importErrorText(t, { code: 'too-many-items' })).toBe(`The deck has more than ${IMPORT_LIMITS.maxItems} cards.`);
    expect(importErrorText(t, { code: 'too-large' })).toBe('The text is larger than 2 MB.');
    expect(importWarningText(t, { code: 'image-too-large-removed', item: 1, side: 'front', field: 'image' })).toBe('Card 1: An embedded image larger than 100 KB was removed.');
  });

  it('has a translated message for every error and warning code in every locale', () => {
    const errors: ImportError['code'][] = ['empty', 'too-large', 'too-many-items', 'json-syntax', 'no-items', 'text-too-long', 'title-too-long', 'type', 'required', 'duplicate-id', 'empty-side', 'range', 'language-tag'];
    const warnings: ImportWarning['code'][] = ['remote-url-removed', 'unsupported-media-removed', 'image-too-large-removed', 'csv-no-header'];
    for (const locale of SUPPORTED_LOCALES) {
      const missing: string[] = [];
      const tl = createTranslator({ locale, sources: [UI_MESSAGES], onMissing: (key) => missing.push(key) }) as never;
      for (const code of errors) expect(importErrorText(tl, { code, item: 2, line: 3 })).not.toMatch(/import\.[a-z]|\{/);
      for (const code of warnings) expect(importWarningText(tl, { code })).not.toMatch(/import\.[a-z]|\{/);
      expect(missing, locale).toEqual([]);
    }
  });
});
