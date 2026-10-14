import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { legalFromEnv, legalLines } from '../../../scripts/legal-env.mjs';

describe('legal notice environment parsing', () => {
  it('accepts pipe-separated values', () => {
    expect(legalFromEnv({ WP_LEGAL: 'Ada Example|Street 1|12345 City|Country' })).toEqual({ name: 'Ada Example', address: ['Street 1', '12345 City', 'Country'], email: '' });
  });

  it('accepts a value pasted from an .env file (KEY= prefix, quotes, newlines)', () => {
    const pasted = 'HW_LEGAL_ADDRESS="Ada Example\nStreet 1\n12345 City\nCountry"';
    expect(legalFromEnv({ WP_LEGAL: pasted })).toEqual({ name: 'Ada Example', address: ['Street 1', '12345 City', 'Country'], email: '' });
    expect(legalLines("'A\r\nB'")).toEqual(['A', 'B']);
    expect(legalLines('A\\nB')).toEqual(['A', 'B']);
  });

  it('prefers separate name/address variables and trims everything', () => {
    expect(legalFromEnv({ WP_LEGAL: 'X|Y|Z', WP_LEGAL_NAME: ' Ada ', WP_LEGAL_ADDRESS: 'S 1 | C', WP_LEGAL_EMAIL: ' a@b.c ' })).toEqual({ name: 'Ada', address: ['S 1', 'C'], email: 'a@b.c' });
  });

  it('returns empty values when nothing is configured and never throws', () => {
    expect(legalFromEnv({})).toEqual({ name: '', address: [], email: '' });
    fc.assert(fc.property(fc.string(), (s) => void legalFromEnv({ WP_LEGAL: s })));
  });
});
