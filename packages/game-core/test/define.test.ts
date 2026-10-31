import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES, defineGame, gameLocale, gameLocales, validateMetadata, validateSettings, type GameMetadata } from '../src';
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '../src/guards';

const base: GameMetadata = {
  id: 'demo-game',
  stateVersion: 1,
  skills: ['planning'],
  typicalMinutes: [1, 5],
  inputMethods: ['pointer'],
  capabilities: { offline: true, audio: 'none', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
  messages: { en: { title: 'Demo', tagline: 'A demo', rules: 'Rules' } }
};

describe('validateMetadata', () => {
  it('accepts valid metadata', () => {
    expect(validateMetadata(base, ['en'])).toEqual([]);
  });

  it.each([
    [{ id: 'Bad_Id' }, 'kebab-case'],
    [{ stateVersion: 0 }, 'stateVersion'],
    [{ skills: [] }, 'skill'],
    [{ skills: ['telepathy'] as never }, 'unknown skill'],
    [{ typicalMinutes: [5, 1] as const }, 'typicalMinutes'],
    [{ typicalMinutes: [0, 1] as const }, 'typicalMinutes'],
    [{ inputMethods: [] }, 'input method'],
    [{ setupInGame: 'yes' as never }, 'setupInGame']
  ])('reports %o', (patch, fragment) => {
    const problems = validateMetadata({ ...base, ...patch } as GameMetadata, ['en']);
    expect(problems.join('\n')).toContain(fragment);
  });

  it('accepts the optional setupInGame flag', () => {
    expect(validateMetadata({ ...base, setupInGame: true }, ['en'])).toEqual([]);
    expect(validateMetadata({ ...base, setupInGame: false }, ['en'])).toEqual([]);
  });

  it('reports missing locales and required keys', () => {
    expect(validateMetadata(base, ['en', 'de'])).toEqual(['missing messages for locale "de"']);
    const noRules = { ...base, messages: { en: { title: 'Demo', tagline: 'x', rules: ' ' } } };
    expect(validateMetadata(noRules, ['en'])).toEqual(['locale "en" lacks "rules"']);
  });

  describe('partial locales and preview status (ADR 0003 amendment 2026-10-24)', () => {
    const preview: GameMetadata = { ...base, status: 'preview', locales: ['en', 'de'], messages: { ...base.messages, de: { title: 'Demo', tagline: 'Ein Demo', rules: 'Regeln' } } };

    it('requires messages only for the declared locales', () => {
      expect(validateMetadata(preview, SUPPORTED_LOCALES)).toEqual([]);
      expect(validateMetadata(preview, ['en', 'de', 'fr', 'ar'])).toEqual([]);
      const { de: _de, ...onlyEn } = preview.messages;
      expect(validateMetadata({ ...preview, messages: onlyEn }, SUPPORTED_LOCALES)).toEqual(['missing messages for locale "de"']);
    });

    it.each([
      [[], 'non-empty'],
      ['en' as never, 'non-empty'],
      [['de'], 'must include "en"'],
      [['en', 'de', 'en'], 'twice'],
      [['en', 'xx'], 'unknown locale "xx"'],
      [['en', 'pt-BR'], 'unknown locale "pt-BR"']
    ])('reports locales %o', (locales, fragment) => {
      expect(validateMetadata({ ...preview, locales: locales as unknown as GameMetadata['locales'] & object }, ['en']).join('\n')).toContain(fragment);
    });

    it('accepts all 16 locales without the preview status, but fewer only as a preview', () => {
      expect(validateMetadata({ ...base, locales: SUPPORTED_LOCALES }, ['en'])).toEqual([]);
      const { status: _status, ...noStatus } = preview;
      expect(validateMetadata(noStatus, ['en'])).toEqual(['a game shipping only some locales must be released as status "preview"']);
      expect(validateMetadata({ ...base, status: 'preview' }, ['en'])).toEqual([]);
      expect(validateMetadata({ ...base, status: 'beta' as never }, ['en']).join('\n')).toContain('status must be "preview"');
    });

    it('checks setting keys only in the declared locales', () => {
      const module = { metadata: { ...preview, messages: { en: { ...preview.messages.en, size: 'Size' }, de: { ...preview.messages.de, size: 'Größe' } } }, settings: [{ kind: 'toggle', id: 'size', labelKey: 'size', default: false }] as const };
      expect(validateSettings(module, SUPPORTED_LOCALES)).toEqual([]);
      const noGerman = { ...module, metadata: { ...module.metadata, messages: { ...module.metadata.messages, de: preview.messages.de! } } };
      expect(validateSettings(noGerman, SUPPORTED_LOCALES)).toEqual(['locale "de" lacks setting key "size"']);
    });

    it('shows a game in the UI locale when it ships it, else in English', () => {
      expect(gameLocales(base)).toBe(SUPPORTED_LOCALES);
      expect(gameLocales(preview)).toEqual(['en', 'de']);
      expect(gameLocales({ locales: 'de' as never })).toBe(SUPPORTED_LOCALES);
      expect(gameLocale(base, 'ar')).toBe('ar');
      expect(gameLocale(preview, 'de')).toBe('de');
      expect(gameLocale(preview, 'fr')).toBe('en');
      expect(gameLocale(preview, 'ar')).toBe('en');
    });
  });

  it('defineGame is an identity helper', () => {
    const module = { metadata: base, create: () => { throw new Error('unused'); }, isValidState: (v: unknown): v is number => v === 1 };
    expect(defineGame(module)).toBe(module);
  });
});

describe('guards', () => {
  it('isRecord', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
  });
  it('isInt / isUint32', () => {
    expect(isInt(3, 0, 3)).toBe(true);
    expect(isInt(4, 0, 3)).toBe(false);
    expect(isInt(-1, 0)).toBe(false);
    expect(isInt(1.5)).toBe(false);
    expect(isUint32(0xffffffff)).toBe(true);
    expect(isUint32(2 ** 32)).toBe(false);
  });
  it('isArrayOf / isOneOf', () => {
    const isNum = (v: unknown): v is number => typeof v === 'number';
    expect(isArrayOf([1, 2], isNum)).toBe(true);
    expect(isArrayOf([1, '2'], isNum)).toBe(false);
    expect(isArrayOf([1, 2], isNum, 3)).toBe(false);
    expect(isArrayOf('12', isNum)).toBe(false);
    expect(isOneOf('a', ['a', 'b'])).toBe(true);
    expect(isOneOf('c', ['a', 'b'])).toBe(false);
  });
});
