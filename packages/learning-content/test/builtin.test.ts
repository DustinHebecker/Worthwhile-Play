import { describe, expect, it } from 'vitest';
import {
  builtinDeck,
  builtinItemIds,
  COUNTRY_CODES,
  countryName,
  FIRST_WORDS,
  firstWordsDeck,
  flagEmoji,
  flagsDeck,
  hasCountryNames,
  isBuiltinDeckId,
  isCountryCode,
  resolveContentLanguages,
  SYMBOL_DECK,
  toVocabularyLanguage,
  validateDeck,
  VOCABULARY_LANGUAGES
} from '../src';

const LOCALES = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh-Hans', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'];
const EMOJI = /\p{Extended_Pictographic}/u;

describe('First words vocabulary', () => {
  it('covers exactly the 16 UI languages', () => {
    expect([...VOCABULARY_LANGUAGES]).toEqual(LOCALES);
  });

  it('has about 60 items with unique ids and unique emoji pictures', () => {
    expect(FIRST_WORDS.length).toBe(60);
    expect(new Set(FIRST_WORDS.map((w) => w.id)).size).toBe(60);
    expect(new Set(FIRST_WORDS.map((w) => w.emoji)).size).toBe(60);
    for (const entry of FIRST_WORDS) {
      expect(entry.id).toMatch(/^[a-z]+$/);
      expect(entry.emoji, entry.id).toMatch(EMOJI);
    }
  });

  it('has a non-empty, trimmed word in every language and no duplicate words within a language', () => {
    for (const lang of VOCABULARY_LANGUAGES) {
      const words = FIRST_WORDS.map((w) => w.words[lang]);
      for (const word of words) {
        expect(word, lang).toBeTruthy();
        expect(word.trim(), lang).toBe(word);
        expect(word.length, `${lang}: ${word}`).toBeLessThanOrEqual(24);
      }
      expect(new Set(words).size, lang).toBe(words.length);
    }
  });

  it('follows the article convention: article in de/nl/es/fr/pt/it, bare noun elsewhere', () => {
    const articles: Record<string, RegExp> = {
      de: /^(der|die|das) /,
      nl: /^(de|het) /,
      es: /^(el|la|los|las) /,
      fr: /^(le |la |les |l')/,
      pt: /^(o|a|os|as) /,
      it: /^(il |lo |la |le |gli |l')/
    };
    for (const [lang, pattern] of Object.entries(articles)) {
      for (const entry of FIRST_WORDS) expect(entry.words[lang as 'de'], `${lang}: ${entry.id}`).toMatch(pattern);
    }
    for (const entry of FIRST_WORDS) expect(entry.words.en, entry.id).not.toMatch(/^(the|a|an) /);
    // English words are the item ids (keeps ids readable).
    expect(FIRST_WORDS.map((w) => w.words.en)).toEqual(FIRST_WORDS.map((w) => w.id));
  });

  it('builds a valid deck for any language pair', () => {
    for (const learning of VOCABULARY_LANGUAGES) {
      const deck = firstWordsDeck(learning, learning === 'en' ? 'de' : 'en');
      expect(validateDeck(deck).ok).toBe(true);
      expect(deck.items[0]?.front.lang).toBe(learning);
    }
    expect(firstWordsDeck('ja', 'de').items[0]).toMatchObject({ id: 'apple', front: { symbol: '🍎', text: 'りんご', lang: 'ja' }, back: { text: 'der Apfel', lang: 'de' } });
  });
});

describe('toVocabularyLanguage', () => {
  it.each([
    ['de', 'de'],
    ['pt-BR', 'pt'],
    ['en-GB', 'en'],
    ['zh', 'zh-Hans'],
    ['zh-CN', 'zh-Hans'],
    ['zh-Hans-SG', 'zh-Hans'],
    ['zh-Hant', undefined],
    ['zh-TW', undefined],
    ['sv', undefined],
    [undefined, undefined],
    ['', undefined]
  ])('%s → %s', (tag, expected) => {
    expect(toVocabularyLanguage(tag)).toBe(expected);
  });
});

describe('resolveContentLanguages (explicit fallbacks)', () => {
  it('uses the chosen languages when available', () => {
    expect(resolveContentLanguages({ learning: 'ja', translation: 'de' }, 'en')).toEqual({
      learning: 'ja', translation: 'de', countries: 'ja', learningFallback: false, translationFallback: false
    });
  });

  it('falls back to the UI language, then English, and never pairs a language with itself', () => {
    expect(resolveContentLanguages(undefined, 'fr')).toMatchObject({ learning: 'fr', translation: 'en', countries: 'fr', learningFallback: false });
    expect(resolveContentLanguages({}, 'en')).toMatchObject({ learning: 'en', translation: 'de' });
    expect(resolveContentLanguages({ learning: 'sv' }, 'de')).toMatchObject({ learning: 'de', translation: 'en', countries: 'sv', learningFallback: true });
    expect(resolveContentLanguages({ learning: 'es', translation: 'es' }, 'es')).toMatchObject({ learning: 'es', translation: 'en', translationFallback: true });
    expect(resolveContentLanguages({ learning: 'ja' }, 'ja')).toMatchObject({ learning: 'ja', translation: 'en', translationFallback: false });
    expect(resolveContentLanguages({ translation: 'ko' }, 'ko')).toMatchObject({ learning: 'ko', translation: 'en', translationFallback: true });
  });
});

describe('Flags & countries', () => {
  it('uses 60 unique, valid ISO 3166-1 alpha-2 codes known to CLDR', () => {
    expect(COUNTRY_CODES.length).toBe(60);
    expect(new Set(COUNTRY_CODES).size).toBe(60);
    const english = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
    for (const code of COUNTRY_CODES) {
      expect(code).toMatch(/^[A-Z]{2}$/);
      expect(english.of(code), code).toBeTruthy();
    }
    for (const disputed of ['TW', 'XK', 'PS', 'EH']) expect(isCountryCode(disputed)).toBe(false);
  });

  it('builds flag emoji from regional indicators', () => {
    expect(flagEmoji('DE')).toBe('🇩🇪');
    expect(flagEmoji('jp')).toBe('🇯🇵');
    expect([...flagEmoji('US')].map((c) => c.codePointAt(0))).toEqual([0x1f1fa, 0x1f1f8]);
  });

  it('has non-empty country names in all 16 UI languages (Node Intl / CLDR)', () => {
    for (const lang of LOCALES) {
      expect(hasCountryNames(lang), lang).toBe(true);
      const names = COUNTRY_CODES.map((code) => countryName(code, lang));
      for (const [i, name] of names.entries()) {
        expect(name.trim(), `${lang}/${COUNTRY_CODES[i]}`).not.toBe('');
        expect(name, `${lang}/${COUNTRY_CODES[i]}`).not.toBe(COUNTRY_CODES[i]);
      }
      expect(new Set(names).size, lang).toBe(names.length);
    }
    expect(countryName('DE', 'de')).toBe('Deutschland');
    expect(countryName('JP', 'ja')).toBe('日本');
  });

  it('falls back to the code for unusable languages', () => {
    expect(countryName('DE', 'not a language!')).toBe('DE');
    expect(hasCountryNames('not a language!')).toBe(false);
  });

  it('builds a valid deck with names in the requested language', () => {
    const deck = flagsDeck('de');
    expect(validateDeck(deck).ok).toBe(true);
    expect(deck.items.find((i) => i.id === 'fr')).toMatchObject({ front: { symbol: '🇫🇷', alt: 'Frankreich' }, back: { text: 'Frankreich', lang: 'de' } });
  });
});

describe('built-in deck registry', () => {
  it('lists item ids per deck independently of languages', () => {
    expect(builtinItemIds('symbols')).toEqual(SYMBOL_DECK.items.map((i) => i.id));
    expect(builtinItemIds('first-words')).toHaveLength(60);
    expect(builtinItemIds('flags')).toContain('de');
    expect(builtinItemIds('user-x')).toBeUndefined();
    expect(isBuiltinDeckId('flags')).toBe(true);
    expect(isBuiltinDeckId('toString')).toBe(false);
  });

  it('builds each built-in deck with matching item ids', () => {
    const languages = resolveContentLanguages({ learning: 'es' }, 'en');
    for (const id of ['symbols', 'first-words', 'flags'] as const) {
      const deck = builtinDeck(id, languages);
      expect(deck.id).toBe(id);
      expect(deck.license).toBeTruthy();
      expect(deck.items.map((i) => i.id)).toEqual(builtinItemIds(id));
    }
  });
});
