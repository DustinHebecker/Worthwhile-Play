import { describe, expect, it } from 'vitest';
import { defineGame, validateMetadata, type GameMetadata } from '../src';
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
    [{ inputMethods: [] }, 'input method']
  ])('reports %o', (patch, fragment) => {
    const problems = validateMetadata({ ...base, ...patch } as GameMetadata, ['en']);
    expect(problems.join('\n')).toContain(fragment);
  });

  it('reports missing locales and required keys', () => {
    expect(validateMetadata(base, ['en', 'de'])).toEqual(['missing messages for locale "de"']);
    const noRules = { ...base, messages: { en: { title: 'Demo', tagline: 'x', rules: ' ' } } };
    expect(validateMetadata(noRules, ['en'])).toEqual(['locale "en" lacks "rules"']);
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
