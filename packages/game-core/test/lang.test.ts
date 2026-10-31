import { describe, expect, it } from 'vitest';
import { bcp47Tag } from '../src/lang';

describe('bcp47Tag', () => {
  it('declares Portuguese as Brazilian (pt-BR) and leaves every other tag unchanged', () => {
    expect(bcp47Tag('pt')).toBe('pt-BR');
    expect(bcp47Tag('PT')).toBe('pt-BR');
    expect(bcp47Tag('pt-PT')).toBe('pt-PT');
    expect(bcp47Tag('pt-BR')).toBe('pt-BR');
    expect(bcp47Tag('zh-Hans')).toBe('zh-Hans');
    for (const code of ['de', 'en', 'nl', 'es', 'fr', 'ru', 'ko', 'ja', 'ar', 'it', 'pl', 'tr', 'uk', 'hi', 'sv']) expect(bcp47Tag(code)).toBe(code);
    expect(bcp47Tag('')).toBe('');
  });
});
