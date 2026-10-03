import { describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import {
  auditCatalogues,
  COMMON_MESSAGES,
  createTranslator,
  interpolate,
  isLanguageTag,
  LOCALE_DEFINITIONS,
  localeDirection,
  matchLocale,
  readContentLanguages,
  readUiLocale,
  resolveUiLocale,
  STORAGE_KEYS,
  SUPPORTED_LOCALES,
  writeContentLanguages,
  writeUiLocale
} from '../src';

const memoryStorage = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
};

describe('locales', () => {
  it('defines exactly the 16 Home Workout locales, only Arabic is RTL', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(16);
    expect(LOCALE_DEFINITIONS.map((d) => d.code)).toEqual([...SUPPORTED_LOCALES]);
    expect(SUPPORTED_LOCALES.filter((l) => localeDirection(l) === 'rtl')).toEqual(['ar']);
  });

  it.each([
    ['de-AT', 'de'],
    ['pt_BR', 'pt'],
    ['zh', 'zh-Hans'],
    ['zh-CN', 'zh-Hans'],
    ['zh-Hans-CN', 'zh-Hans'],
    ['zh-TW', undefined],
    ['zh-Hant', undefined],
    ['sv', undefined],
    ['', undefined],
    [null, undefined],
    ['ar-EG', 'ar'],
    ['EN-gb', 'en']
  ])('matchLocale(%s) = %s', (tag, expected) => {
    expect(matchLocale(tag)).toBe(expected);
  });

  it('resolves stored → browser → English', () => {
    expect(resolveUiLocale('ja', ['de'])).toBe('ja');
    expect(resolveUiLocale('xx', ['sv', 'fr-CA'])).toBe('fr');
    expect(resolveUiLocale(null, ['sv'])).toBe('en');
  });
});

describe('translator', () => {
  const sources = [{ en: { hello: 'Hello {name}', only: 'EN only' }, de: { hello: 'Hallo {name}' } }];

  it('interpolates parameters and keeps unknown placeholders', () => {
    expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
    expect(interpolate('plain')).toBe('plain');
  });

  it('translates, reports missing keys, falls back to English, then to the key', () => {
    const onMissing = vi.fn();
    const t = createTranslator({ locale: 'de', sources, onMissing });
    expect(t('hello', { name: 'Ada' })).toBe('Hallo Ada');
    expect(t('only')).toBe('EN only');
    expect(t('nothing')).toBe('nothing');
    expect(onMissing).toHaveBeenCalledWith('only', 'de');
    expect(t.locale).toBe('de');
    expect(createTranslator({ locale: 'ar', sources }).direction).toBe('rtl');
  });

  it('searches sources in order', () => {
    const t = createTranslator({ locale: 'en', sources: [{ en: { k: 'game' } }, { en: { k: 'common', c: 'common only' } }] });
    expect(t('k')).toBe('game');
    expect(t('c')).toBe('common only');
  });

  it('audits catalogues', () => {
    const problems = auditCatalogues({ en: { a: 'x {n}', b: 'y' }, de: { a: 'x', c: 'z' } }, ['en', 'de', 'fr']);
    expect(problems).toEqual(['de: placeholder mismatch in "a"', 'de: missing "b"', 'de: extra key "c"', 'fr: missing catalogue']);
    expect(auditCatalogues({}, ['en'])).toEqual(['reference locale "en" missing']);
  });

  it('common game vocabulary is complete in all 16 locales', () => {
    expect(auditCatalogues(COMMON_MESSAGES, SUPPORTED_LOCALES)).toEqual([]);
  });
});

describe('preferences keep UI and content languages separate', () => {
  it('stores the UI locale', () => {
    const storage = memoryStorage();
    expect(readUiLocale(storage, ['ko'])).toBe('ko');
    writeUiLocale(storage, 'ar');
    expect(readUiLocale(storage, ['ko'])).toBe('ar');
  });

  it('changing UI locale does not touch learning languages', () => {
    const storage = memoryStorage();
    writeContentLanguages(storage, { learning: 'ja', translation: 'en' });
    writeUiLocale(storage, 'de');
    expect(readContentLanguages(storage)).toEqual({ learning: 'ja', translation: 'en' });
    expect(storage.data.get(STORAGE_KEYS.uiLocale)).toBe('de');
  });

  it('accepts any BCP-47 content language (not limited to UI locales) and ignores junk', () => {
    const storage = memoryStorage();
    writeContentLanguages(storage, { learning: 'sv', translation: 'not a tag!' });
    expect(readContentLanguages(storage)).toEqual({ learning: 'sv', translation: undefined });
    fc.assert(fc.property(fc.string(), (s) => void isLanguageTag(s)));
  });

  it('survives throwing storage', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(readUiLocale(broken, ['fr'])).toBe('fr');
    expect(() => writeUiLocale(broken, 'de')).not.toThrow();
    expect(readContentLanguages(broken)).toEqual({ learning: undefined, translation: undefined });
  });
});
