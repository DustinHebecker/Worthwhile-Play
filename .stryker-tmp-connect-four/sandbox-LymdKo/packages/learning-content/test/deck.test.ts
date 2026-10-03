// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { deckFromCsv, parseCsv, pickText, SYMBOL_DECK, validateDeck } from '../src';

describe('validateDeck', () => {
  it('accepts the bundled symbol deck', () => {
    expect(validateDeck(SYMBOL_DECK).ok).toBe(true);
    expect(new Set(SYMBOL_DECK.items.map((i) => i.front.symbol)).size).toBe(SYMBOL_DECK.items.length);
  });

  it('reports structural problems with paths', () => {
    const result = validateDeck({
      schemaVersion: 2,
      id: '',
      title: {},
      items: [
        { id: 'a', front: { text: 'x', lang: 'not a tag' }, back: {} },
        { id: 'a', front: { text: 1 }, back: { text: 'y' }, difficulty: 9, tags: 'x', category: 3 },
        'nope'
      ]
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          { path: 'schemaVersion', code: 'required' },
          { path: 'id', code: 'required' },
          { path: 'title', code: 'required' },
          { path: 'items[0].front.lang', code: 'language-tag' },
          { path: 'items[0].back', code: 'empty-side' },
          { path: 'items[1].id', code: 'duplicate-id' },
          { path: 'items[1].front.text', code: 'type' },
          { path: 'items[1].difficulty', code: 'range' },
          { path: 'items[1].tags', code: 'type' },
          { path: 'items[1].category', code: 'type' },
          { path: 'items[2]', code: 'type' }
        ])
      );
    }
  });

  it('rejects empty decks and non-objects', () => {
    expect(validateDeck(null).ok).toBe(false);
    expect(validateDeck({ schemaVersion: 1, id: 'x', title: { en: 'x' }, items: [] }).ok).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.anything(), (v) => void validateDeck(v)));
  });
});

describe('csv', () => {
  it('parses quotes, escaped quotes, commas and CRLF', () => {
    expect(parseCsv('a,"b,c","say ""hi"""\r\n1,2,3\n')).toEqual([
      ['a', 'b,c', 'say "hi"'],
      ['1', '2', '3']
    ]);
    expect(parseCsv('\uFEFFx,y')).toEqual([['x', 'y']]);
    expect(parseCsv('\n\n')).toEqual([]);
  });

  it('builds a deck from CSV', () => {
    const result = deckFromCsv('front_text,back_text,front_lang,back_lang,tags,difficulty\nHund,dog,de,en,animals; basic,2\n', 'animals', 'Animals');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.deck.items[0]).toEqual({ id: 'animals-1', front: { text: 'Hund', lang: 'de' }, back: { text: 'dog', lang: 'en' }, tags: ['animals', 'basic'], difficulty: 2 });
    }
  });

  it('fails for empty or invalid CSV', () => {
    expect(deckFromCsv('', 'x', 'X').ok).toBe(false);
    expect(deckFromCsv('front_text,back_text\nonly-front,\n', 'x', 'X').ok).toBe(false);
  });

  it('parseCsv never throws and round-trips simple fields', () => {
    const field = fc.string().filter((s) => !/[",\r\n\uFEFF]/.test(s) && s.trim() !== '');
    fc.assert(
      fc.property(fc.array(fc.array(field, { minLength: 1, maxLength: 4 }), { maxLength: 5 }), (rows) => {
        expect(parseCsv(rows.map((r) => r.join(',')).join('\n'))).toEqual(rows);
      })
    );
  });
});

describe('pickText', () => {
  it('falls back exact → base → en → first', () => {
    expect(pickText({ 'pt-BR': 'BR', pt: 'PT', en: 'EN' }, 'pt-BR')).toBe('BR');
    expect(pickText({ pt: 'PT', en: 'EN' }, 'pt-PT')).toBe('PT');
    expect(pickText({ en: 'EN' }, 'ja')).toBe('EN');
    expect(pickText({ fr: 'FR' }, 'ja')).toBe('FR');
    expect(pickText({}, 'ja')).toBe('');
  });
});
