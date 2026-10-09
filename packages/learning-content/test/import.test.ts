import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  classifyMedia,
  csvToDeck,
  deckToCsv,
  deckToJson,
  detectFormat,
  importDeck,
  IMPORT_LIMITS,
  isUserDeckId,
  parseCsvRows,
  userDeckId,
  validateDeck,
  type Deck
} from '../src';

const PNG = `data:image/png;base64,${'iVBORw0KGgo='.repeat(4)}`;

describe('parseCsvRows', () => {
  it('reports the starting line of each record, also after quoted line breaks and blank lines', () => {
    const rows = parseCsvRows('a,b\n\n"multi\nline",x\r\nlast,y');
    expect(rows).toEqual([
      { fields: ['a', 'b'], line: 1 },
      { fields: ['multi\nline', 'x'], line: 3 },
      { fields: ['last', 'y'], line: 5 }
    ]);
  });
});

describe('csvToDeck', () => {
  it('reads named columns in any order and keeps source lines', () => {
    const built = csvToDeck('back_text,FRONT_TEXT\nyes,ja\n\nno,nein\n', 'd', 'D');
    expect(built?.headerless).toBe(false);
    expect(built?.deck.items.map((i) => [i.front.text, i.back.text])).toEqual([['ja', 'yes'], ['nein', 'no']]);
    expect(built?.lines).toEqual([2, 4]);
  });

  it('reads a CSV without a header as front,back', () => {
    const built = csvToDeck('Hund,dog\nKatze,cat', 'd', 'D');
    expect(built?.headerless).toBe(true);
    expect(built?.deck.items).toHaveLength(2);
    expect(built?.lines).toEqual([1, 2]);
    expect(csvToDeck('  \n', 'd', 'D')).toBeUndefined();
  });
});

describe('detectFormat', () => {
  it('treats text starting with { as JSON, everything else as CSV', () => {
    expect(detectFormat('\uFEFF  {"a":1}')).toBe('json');
    expect(detectFormat('front_text,back_text')).toBe('csv');
    expect(detectFormat('[1]')).toBe('csv');
  });
});

describe('classifyMedia', () => {
  it.each([
    ['https://example.com/a.png', 'remote'],
    ['http://example.com/a.png', 'remote'],
    ['//example.com/a.png', 'remote'],
    ['HTTPS://EXAMPLE.COM/A.PNG', 'remote'],
    ['ftp://example.com/a.png', 'remote'],
    ['javascript:alert(1)', 'unsupported'],
    ['blob:https://x/1', 'unsupported'],
    ['data:image/svg+xml;base64,PHN2Zz4=', 'unsupported'],
    ['data:text/html;base64,PGI+', 'unsupported'],
    ['../secret.png', 'unsupported'],
    ['C:\\pics\\cat.png', 'unsupported'],
    ['cat.webp', 'ok'],
    ['/decks/animals/cat.webp', 'ok'],
    [PNG, 'ok']
  ])('%s → %s', (url, verdict) => {
    expect(classifyMedia(url, 'image')).toBe(verdict);
  });

  it('rejects embedded audio and oversized images', () => {
    expect(classifyMedia('data:audio/mp3;base64,AAAA', 'audio')).toBe('unsupported');
    expect(classifyMedia('sound.mp3', 'audio')).toBe('ok');
    expect(classifyMedia(`data:image/png;base64,${'A'.repeat(IMPORT_LIMITS.maxImageChars)}`, 'image')).toBe('too-large');
  });
});

describe('importDeck (CSV)', () => {
  it('imports a valid CSV with a fresh id and the given title', () => {
    const result = importDeck('front_text,back_text,front_lang,back_lang\nHund,dog,de,en\nKatze,cat,de,en\n', { id: 'user-animals-1', title: ' Animals ' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.format).toBe('csv');
    expect(result.deck.id).toBe('user-animals-1');
    expect(result.deck.title).toEqual({ en: 'Animals' });
    expect(result.deck.items[1]).toEqual({ id: 'user-animals-1-2', front: { text: 'Katze', lang: 'de' }, back: { text: 'cat', lang: 'en' } });
    expect(result.warnings).toEqual([]);
  });

  it('reports row-level errors with card number, CSV line, side and field', () => {
    const result = importDeck('front_text,back_text,front_lang\nok,fine,de\nmissing,,de\nbad,lang,not a tag\n', { id: 'user-x-1', title: 'X' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      { code: 'empty-side', item: 2, line: 3, side: 'back' },
      { code: 'language-tag', item: 3, line: 4, side: 'front', field: 'lang' }
    ]);
  });

  it('removes remote images with a warning and fails when a side becomes empty', () => {
    const result = importDeck('front_text,back_image\ncat,https://example.com/cat.png\n', { id: 'user-x-1', title: 'X' });
    expect(result.ok).toBe(false);
    expect(result.warnings).toEqual([{ code: 'remote-url-removed', item: 1, line: 2, side: 'back', field: 'image' }]);
    if (!result.ok) expect(result.errors).toEqual([{ code: 'empty-side', item: 1, line: 2, side: 'back' }]);

    const kept = importDeck('front_text,back_text,back_image\ncat,Katze,https://example.com/cat.png\n', { id: 'user-x-1', title: 'X' });
    expect(kept.ok).toBe(true);
    if (kept.ok) expect(kept.deck.items[0]?.back).toEqual({ text: 'Katze' });
    expect(kept.warnings).toHaveLength(1);
  });

  it('warns when a CSV has no header row', () => {
    const result = importDeck('Hund,dog\n', { id: 'user-x-1', title: 'X' });
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([{ code: 'csv-no-header' }]);
  });

  it('fails for empty input and for CSV without data rows', () => {
    expect(importDeck('   ', { id: 'user-x-1' })).toMatchObject({ ok: false, errors: [{ code: 'empty' }] });
    expect(importDeck('front_text,back_text\n', { id: 'user-x-1' })).toMatchObject({ ok: false, errors: [{ code: 'no-items' }] });
  });
});

describe('importDeck limits', () => {
  it('rejects oversized input, too many cards, long texts and long titles', () => {
    expect(importDeck('a'.repeat(IMPORT_LIMITS.maxInputChars + 1), { id: 'user-x-1' })).toMatchObject({ ok: false, errors: [{ code: 'too-large' }] });
    const many = `front_text,back_text\n${'a,b\n'.repeat(IMPORT_LIMITS.maxItems + 1)}`;
    expect(importDeck(many, { id: 'user-x-1', title: 'X' })).toMatchObject({ ok: false, errors: [{ code: 'too-many-items' }] });
    const exactly = `front_text,back_text\n${'a,b\n'.repeat(IMPORT_LIMITS.maxItems)}`;
    expect(importDeck(exactly, { id: 'user-x-1', title: 'X' }).ok).toBe(true);
    const long = importDeck(`front_text,back_text\nok,${'x'.repeat(IMPORT_LIMITS.maxTextChars + 1)}\n`, { id: 'user-x-1', title: 'X' });
    expect(long).toMatchObject({ ok: false, errors: [{ code: 'text-too-long', item: 1, line: 2, side: 'back', field: 'text' }] });
    expect(importDeck('a,b', { id: 'user-x-1', title: 'T'.repeat(IMPORT_LIMITS.maxTitleChars + 1) })).toMatchObject({ ok: false, errors: [{ code: 'title-too-long' }] });
  });

  it('drops oversized embedded images with a warning', () => {
    const big = `data:image/png;base64,${'A'.repeat(IMPORT_LIMITS.maxImageChars)}`;
    const deck = { schemaVersion: 1, id: 'x', title: { en: 'X' }, items: [{ id: 'a', front: { text: 'a', image: big }, back: { text: 'b' } }] };
    const result = importDeck(JSON.stringify(deck), { id: 'user-x-1' });
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([{ code: 'image-too-large-removed', item: 1, side: 'front', field: 'image' }]);
  });
});

describe('importDeck (JSON)', () => {
  const deck = {
    schemaVersion: 1,
    id: 'animals',
    title: { en: 'Animals', de: 'Tiere' },
    description: { en: 'Some animals', de: 7 },
    license: 'CC0-1.0',
    items: [
      { id: 'cat', front: { image: PNG, alt: 'cat' }, back: { text: 'Katze', lang: 'de', audio: 'https://example.com/k.mp3' }, tags: ['pets'] },
      { id: 'dog', front: { symbol: '🐕' }, back: { text: 'Hund', lang: 'de' }, extra: 'kept by validation' }
    ]
  };

  it('keeps titles, licence, data images and item ids, assigns the new id and strips remote audio', () => {
    const result = importDeck(JSON.stringify(deck), { id: 'user-animals-2' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.format).toBe('json');
    expect(result.deck.id).toBe('user-animals-2');
    expect(result.deck.title).toEqual({ en: 'Animals', de: 'Tiere' });
    expect(result.deck.description).toEqual({ en: 'Some animals' });
    expect(result.deck.license).toBe('CC0-1.0');
    expect(result.deck.items.map((i) => i.id)).toEqual(['cat', 'dog']);
    expect(result.deck.items[0]?.front.image).toBe(PNG);
    expect(result.deck.items[0]?.back.audio).toBeUndefined();
    expect(result.warnings).toEqual([{ code: 'remote-url-removed', item: 1, side: 'back', field: 'audio' }]);
  });

  it('a given title overrides the JSON title', () => {
    const result = importDeck(JSON.stringify(deck), { id: 'user-a-1', title: 'Mine' });
    expect(result.ok && result.deck.title).toEqual({ en: 'Mine' });
  });

  it('maps validation issues to card numbers and reports syntax errors', () => {
    const bad = { ...deck, items: [{ id: 'a', front: {}, back: { text: 'x' } }, { id: 'a', front: { text: 'y' }, back: { text: 'z' }, difficulty: 8 }] };
    const result = importDeck(JSON.stringify(bad), { id: 'user-a-1' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(expect.arrayContaining([
        { code: 'empty-side', item: 1, side: 'front' },
        { code: 'duplicate-id', item: 2, field: 'id' },
        { code: 'range', item: 2, field: 'difficulty' }
      ]));
    }
    expect(importDeck('{"schemaVersion":', { id: 'user-a-1' })).toMatchObject({ ok: false, format: 'json', errors: [{ code: 'json-syntax' }] });
    expect(importDeck('{"items": 3}', { id: 'user-a-1' })).toMatchObject({ ok: false, errors: [{ code: 'no-items' }] });
    expect(importDeck('[]', { id: 'user-a-1', format: 'json' })).toMatchObject({ ok: false, errors: [{ code: 'type' }] });
  });

  it('never throws and only ever returns valid decks without remote URLs', () => {
    const side = fc.record({ text: fc.option(fc.string(), { nil: undefined }), image: fc.option(fc.oneof(fc.webUrl(), fc.string(), fc.constant(PNG)), { nil: undefined }) }, { requiredKeys: [] });
    const item = fc.record({ id: fc.string(), front: side, back: side });
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.json(), fc.record({ schemaVersion: fc.constant(1), title: fc.constant({ en: 'x' }), items: fc.array(item, { maxLength: 5 }) }).map((d) => JSON.stringify(d))), (text) => {
        const result = importDeck(text, { id: 'user-p-1', title: 'P' });
        if (result.ok) {
          expect(validateDeck(result.deck).ok).toBe(true);
          for (const it of result.deck.items) for (const s of [it.front, it.back]) if (s.image) expect(classifyMedia(s.image, 'image')).toBe('ok');
        }
      }),
      { numRuns: 300 }
    );
  });
});

describe('export round trips', () => {
  const deck: Deck = {
    schemaVersion: 1,
    id: 'user-mix-1',
    title: { en: 'Mix' },
    license: 'CC0-1.0',
    items: [
      { id: 'user-mix-1-1', front: { text: 'say "hi", friend', lang: 'en' }, back: { text: 'sag "hallo"\nFreund', lang: 'de' }, tags: ['a', 'b'], difficulty: 2, category: 'greetings' },
      { id: 'user-mix-1-2', front: { text: ' padded ' }, back: { image: 'img/x.png' } }
    ]
  };

  it('CSV → deck → CSV → deck is stable', () => {
    const csv = deckToCsv(deck);
    const first = importDeck(csv, { id: 'user-mix-1', title: 'Mix' });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.deck.items.map((i) => [i.front, i.back, i.tags, i.difficulty, i.category])).toEqual([
      [{ text: 'say "hi", friend', lang: 'en' }, { text: 'sag "hallo"\nFreund', lang: 'de' }, ['a', 'b'], 2, 'greetings'],
      [{ text: 'padded' }, { image: 'img/x.png' }, undefined, undefined, undefined]
    ]);
    const second = importDeck(deckToCsv(first.deck), { id: 'user-mix-1', title: 'Mix' });
    expect(second.ok && second.deck).toEqual(first.deck);
  });

  it('deck → JSON → deck is lossless and the JSON is re-importable', () => {
    const json = deckToJson(deck);
    expect(JSON.parse(json)).toEqual(deck);
    const again = importDeck(json, { id: deck.id });
    expect(again.ok && again.deck).toEqual(deck);
  });

  it('deckToJson drops unknown properties', () => {
    const messy = { ...deck, extra: 1, items: [{ ...deck.items[0], junk: true }] } as unknown as Deck;
    expect(JSON.parse(deckToJson(messy))).not.toHaveProperty('extra');
    expect(JSON.parse(deckToJson(messy)).items[0]).not.toHaveProperty('junk');
  });
});

describe('user deck ids', () => {
  it('builds safe, recognisable ids', () => {
    expect(userDeckId('Spanish verbs – Lesson 1!', 'A1B2C3D4')).toBe('user-spanish-verbs-lesson-1-a1b2c3d4');
    expect(userDeckId('日本語', 'ff00')).toBe('user-ff00');
    expect(userDeckId('x'.repeat(80), 'zz')).toBe(`user-${'x'.repeat(24)}-0`);
    expect(userDeckId('Ünïcödé deck', 'abc')).toBe('user-unicode-deck-abc');
    expect(isUserDeckId(userDeckId('Ünïcödé deck', 'abc'))).toBe(true);
    expect(isUserDeckId('symbols')).toBe(false);
    expect(isUserDeckId('user-')).toBe(false);
    expect(isUserDeckId(`user-${'a'.repeat(70)}`)).toBe(false);
  });
});
