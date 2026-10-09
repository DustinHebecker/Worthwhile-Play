import { describe, expect, it } from 'vitest';
import {
  builtinDeck,
  builtinItemIds,
  CAPITAL_CODES,
  CAPITAL_EXCLUSIONS,
  CAPITALS,
  capitalName,
  capitalsDeck,
  COUNTRY_CODES,
  countryName,
  FIRST_WORDS,
  firstWordsDeck,
  flagEmoji,
  flagsDeck,
  hasCountryNames,
  isBuiltinDeckId,
  isCountryCode,
  learningDeckId,
  REVIEW_BUILTIN_DECK_IDS,
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

describe('Capitals', () => {
  it('covers every country of the flags deck exactly once: with a capital or as a documented exclusion', () => {
    expect(new Set(CAPITAL_CODES).size).toBe(CAPITAL_CODES.length);
    for (const code of CAPITAL_CODES) {
      expect(isCountryCode(code), code).toBe(true);
      expect(CAPITAL_EXCLUSIONS[code], code).toBeUndefined();
    }
    const excluded = Object.keys(CAPITAL_EXCLUSIONS);
    for (const code of excluded) {
      expect(isCountryCode(code), code).toBe(true);
      expect(CAPITAL_EXCLUSIONS[code as 'ZA']?.trim(), code).toBeTruthy();
    }
    expect(CAPITAL_CODES.length + excluded.length).toBe(COUNTRY_CODES.length);
    // Same order as the flags deck.
    expect([...CAPITAL_CODES]).toEqual(COUNTRY_CODES.filter((code) => !excluded.includes(code)));
    expect(CAPITAL_CODES.length).toBeGreaterThanOrEqual(50);
  });

  it('has a non-empty, trimmed capital in every supported language and no duplicates within a language', () => {
    for (const lang of VOCABULARY_LANGUAGES) {
      const names = CAPITALS.map((entry) => entry.names[lang]);
      for (const [i, name] of names.entries()) {
        const where = `${lang}/${CAPITALS[i]?.code}`;
        expect(typeof name, where).toBe('string');
        expect(name.trim(), where).not.toBe('');
        expect(name.trim(), where).toBe(name);
        expect(name, where).not.toMatch(/\s{2}/);
        expect(name.length, where).toBeLessThanOrEqual(24);
      }
      expect(new Set(names).size, lang).toBe(names.length);
    }
    for (const entry of CAPITALS) expect(Object.keys(entry.names).sort(), entry.code).toEqual([...VOCABULARY_LANGUAGES].sort());
  });

  it('uses the script of each language (no copy-paste slips between columns)', () => {
    const scripts: Partial<Record<string, RegExp>> = {
      ru: /^[\p{Script=Cyrillic} -]+$/u,
      uk: /^[\p{Script=Cyrillic} '-]+$/u,
      'zh-Hans': /^\p{Script=Han}+$/u,
      ja: /^[\p{Script=Katakana}\p{Script=Han}ー.D C]+$/u,
      ko: /^[\p{Script=Hangul} .DC]+$/u,
      ar: /^[\p{Script=Arabic} ]+$/u,
      hi: /^[\p{Script=Devanagari} .]+$/u
    };
    for (const [lang, pattern] of Object.entries(scripts)) {
      for (const entry of CAPITALS) expect(entry.names[lang as 'ru'], `${lang}/${entry.code}`).toMatch(pattern!);
    }
    for (const lang of ['de', 'en', 'nl', 'es', 'fr', 'pt', 'it', 'pl', 'tr'] as const) {
      for (const entry of CAPITALS) expect(entry.names[lang], `${lang}/${entry.code}`).toMatch(/^[\p{Script=Latin} .,()-]+$/u);
    }
  });

  it('spot checks: conventional exonyms per language', () => {
    expect(capitalName('PL', 'de')).toBe('Warschau');
    expect(capitalName('pl', 'fr')).toBe('Varsovie');
    expect(capitalName('PL', 'ja')).toBe('ワルシャワ');
    expect(capitalName('PL', 'pl')).toBe('Warszawa');
    expect(capitalName('CN', 'en')).toBe('Beijing');
    expect(capitalName('CN', 'de')).toBe('Peking');
    expect(capitalName('AT', 'ko')).toBe('빈');
    expect(capitalName('EG', 'ar')).toBe('القاهرة');
    expect(capitalName('ES', 'pt')).toBe('Madri');
    expect(capitalName('ZA', 'en')).toBeUndefined();
    expect(capitalName('XX', 'en')).toBeUndefined();
  });

  it('a capital never has the same name as its country (both cards of a pair stay distinguishable)', () => {
    for (const lang of VOCABULARY_LANGUAGES) {
      for (const entry of CAPITALS) {
        const country = countryName(entry.code, lang);
        expect(country, `${lang}/${entry.code}`).not.toBe(entry.code);
        expect(entry.names[lang].toLocaleLowerCase(lang), `${lang}/${entry.code}`).not.toBe(country.toLocaleLowerCase(lang));
      }
    }
  });

  it('builds a valid deck in every supported language: country name ↔ capital, ids as in the flags deck', () => {
    for (const lang of VOCABULARY_LANGUAGES) {
      const deck = capitalsDeck(lang);
      expect(validateDeck(deck).ok, lang).toBe(true);
      expect(deck.items).toHaveLength(CAPITALS.length);
      for (const item of deck.items) {
        expect(item.front.lang).toBe(lang);
        expect(item.back.lang).toBe(lang);
      }
    }
    expect(capitalsDeck('de').items.find((i) => i.id === 'fr')).toEqual({ id: 'fr', front: { text: 'Frankreich', lang: 'de' }, back: { text: 'Paris', lang: 'de' }, category: 'geography' });
    expect(capitalsDeck('ja').items.find((i) => i.id === 'pl')).toMatchObject({ front: { text: 'ポーランド' }, back: { text: 'ワルシャワ' } });
    const flagIds = new Set(builtinItemIds('flags'));
    for (const id of builtinItemIds('capitals') ?? []) expect(flagIds.has(id), id).toBe(true);
  });

  it('follows the learning language with the explicit fallbacks (UI language, then English)', () => {
    expect(builtinDeck('capitals', resolveContentLanguages({ learning: 'fr' }, 'de')).items[0]?.back.lang).toBe('fr');
    // A learning language without capital names: the UI language (country names follow, so both cards match).
    const swedish = resolveContentLanguages({ learning: 'sv' }, 'de');
    expect(swedish.learningFallback).toBe(true);
    expect(builtinDeck('capitals', swedish).items.find((i) => i.id === 'at')).toMatchObject({ front: { text: 'Österreich', lang: 'de' }, back: { text: 'Wien', lang: 'de' } });
    expect(builtinDeck('capitals', resolveContentLanguages({ learning: 'pt-BR' }, 'en')).items[0]?.back.lang).toBe('pt');
  });

  it('is reviewable and keeps one set of learning records for all languages (like flags)', () => {
    expect(REVIEW_BUILTIN_DECK_IDS).toContain('capitals');
    expect(learningDeckId('capitals', { learning: 'ja' })).toBe('capitals');
    expect(learningDeckId('capitals', { learning: 'de' })).toBe('capitals');
  });
});

describe('built-in deck registry', () => {
  it('lists item ids per deck independently of languages', () => {
    expect(builtinItemIds('symbols')).toEqual(SYMBOL_DECK.items.map((i) => i.id));
    expect(builtinItemIds('first-words')).toHaveLength(60);
    expect(builtinItemIds('flags')).toContain('de');
    expect(builtinItemIds('capitals')).toContain('de');
    expect(builtinItemIds('capitals')).not.toContain('za');
    expect(builtinItemIds('user-x')).toBeUndefined();
    expect(isBuiltinDeckId('flags')).toBe(true);
    expect(isBuiltinDeckId('capitals')).toBe(true);
    expect(isBuiltinDeckId('toString')).toBe(false);
  });

  it('builds each built-in deck with matching item ids', () => {
    const languages = resolveContentLanguages({ learning: 'es' }, 'en');
    for (const id of ['symbols', 'first-words', 'flags', 'capitals'] as const) {
      const deck = builtinDeck(id, languages);
      expect(deck.id).toBe(id);
      expect(deck.license).toBeTruthy();
      expect(deck.items.map((i) => i.id)).toEqual(builtinItemIds(id));
    }
  });
});
