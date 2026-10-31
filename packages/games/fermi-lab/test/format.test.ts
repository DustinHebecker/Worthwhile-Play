import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { bcp47Tag } from '@wp/game-core';
import { decade, fieldParts, fieldText, formatQuantity, normalizeDigits, parseLocaleNumber, roundSig, separators } from '../src/format';

const value = (text: string, locale = 'en'): number | null => {
  const r = parseLocaleNumber(text, locale);
  return r.ok ? r.value : null;
};

describe('parseLocaleNumber', () => {
  it('reads plain numbers with the locale’s separators', () => {
    expect(value('35000')).toBe(35000);
    expect(value('35,000', 'en')).toBe(35000);
    expect(value('35.000', 'de')).toBe(35000);
    expect(value('35 000', 'fr')).toBe(35000);
    expect(value('35 000', 'fr')).toBe(35000);
    expect(value('35 000,5', 'ru')).toBe(35000.5);
    expect(value("35'000", 'de')).toBe(35000);
    expect(value('1.234.567,8', 'de')).toBeCloseTo(1234567.8);
    expect(value('1,234,567.8', 'en')).toBeCloseTo(1234567.8);
  });

  it('resolves the ambiguous "1.000" and "1,000" by the locale, and short groups as decimals', () => {
    expect(value('1.000', 'de')).toBe(1000);
    expect(value('1.000', 'en')).toBe(1);
    expect(value('1,000', 'en')).toBe(1000);
    expect(value('1,000', 'de')).toBe(1);
    expect(value('3.5', 'de')).toBe(3.5);
    expect(value('3,5', 'en')).toBe(3.5);
    expect(value('0,25', 'ja')).toBe(0.25);
  });

  it('reads scientific forms and superscripts', () => {
    for (const text of ['3.5e4', '3.5E4', '3.5 × 10^4', '3.5×10⁴', '3.5*10^4', '3.5 x 10^4', '3.5·10^4', '3.5e+4']) expect(value(text), text).toBeCloseTo(35000);
    expect(value('3,5·10^4', 'de')).toBeCloseTo(35000);
    expect(value('10^9')).toBe(1e9);
    expect(value('10⁹')).toBe(1e9);
    expect(value('2.5e-3')).toBeCloseTo(0.0025);
    expect(value('2,5 × 10⁻³', 'de')).toBeCloseTo(0.0025);
    expect(value('5 × 10−3')).toBeNull(); // a minus without ^ is not an exponent
  });

  it('normalises the four other digit systems and full-width input', () => {
    expect(normalizeDigits('٣٥٠٠٠')).toBe('35000');
    expect(normalizeDigits('۳۵')).toBe('35');
    expect(normalizeDigits('३५')).toBe('35');
    expect(normalizeDigits('３５．５')).toBe('35.5');
    expect(value('٣٫٥', 'ar')).toBe(3.5);
    expect(value('٣٥٬٠٠٠', 'ar')).toBe(35000);
    expect(value('३५,०००', 'hi')).toBe(35000);
    expect(value('３．５ｅ４', 'ja')).toBeCloseTo(35000);
    expect(value('３５，０００', 'zh-Hans')).toBe(35000);
  });

  it('rejects zero, negatives, empty input and garbage without throwing', () => {
    expect(parseLocaleNumber('', 'en')).toEqual({ ok: false, reason: 'empty' });
    expect(parseLocaleNumber('   ', 'en')).toEqual({ ok: false, reason: 'empty' });
    expect(parseLocaleNumber('0', 'en')).toEqual({ ok: false, reason: 'notPositive' });
    expect(parseLocaleNumber('-5', 'en')).toEqual({ ok: false, reason: 'notPositive' });
    expect(parseLocaleNumber('−5', 'en')).toEqual({ ok: false, reason: 'notPositive' });
    for (const bad of ['abc', '1.2.3,4,5', '1,23,4', 'e5', '1e', '3..5', '1e999', '12a', 'NaN', 'Infinity']) expect(parseLocaleNumber(bad, 'en').ok, bad).toBe(false);
    expect(parseLocaleNumber(5 as unknown as string, 'en').ok).toBe(false);
    fc.assert(
      fc.property(fc.string({ maxLength: 50 }), fc.constantFrom(...SUPPORTED_LOCALES), (text, locale) => {
        const r = parseLocaleNumber(text, locale);
        if (r.ok) expect(r.value).toBeGreaterThan(0);
      }),
      { numRuns: 300 }
    );
  });

  it('round-trips the formatted field text in every locale (property)', () => {
    fc.assert(
      fc.property(fc.double({ min: 1e-6, max: 1e25, noNaN: true }), fc.constantFrom(...SUPPORTED_LOCALES), (v, locale) => {
        const parts = fieldParts(v, locale, 3);
        const back = value(parts.text, locale)! * 10 ** parts.exp;
        expect(back / v).toBeGreaterThan(0.994);
        expect(back / v).toBeLessThan(1.006);
        // The display form reads back as well (thousands separators of every locale).
        if (v >= 0.01 && v < 1e6) expect(value(formatQuantity(v, locale).text, locale)! / roundSig(v, 3)).toBeCloseTo(1, 9);
      }),
      { numRuns: 300 }
    );
  });

  it('knows each locale’s separators', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { group, decimal } = separators(locale);
      expect(group).not.toBe(decimal);
      const plain = new Intl.NumberFormat(bcp47Tag(locale)).format(1234567.8);
      expect(value(plain, locale), locale).toBeCloseTo(1234567.8);
    }
  });
});

describe('formatQuantity', () => {
  it('formats plain numbers with words and large or small numbers as powers of ten', () => {
    expect(formatQuantity(35000, 'en')).toMatchObject({ text: '35,000', exponent: null, words: '35 thousand' });
    expect(formatQuantity(42, 'en')).toMatchObject({ text: '42', words: null });
    expect(formatQuantity(1.3e9, 'en')).toMatchObject({ text: '1.3 × 10⁹', mantissa: '1.3', exponent: 9, words: '1.3 billion' });
    expect(formatQuantity(1.3e9, 'de').words).toBe('1,3 Milliarden');
    expect(formatQuantity(1.3e9, 'ja').words).toBe('13億');
    expect(formatQuantity(2e16, 'en')).toMatchObject({ exponent: 16, words: null });
    expect(formatQuantity(0.0025, 'en')).toMatchObject({ text: '2.5 × 10⁻³', exponent: -3 });
    expect(formatQuantity(9.996e8, 'en')).toMatchObject({ mantissa: '1', exponent: 9 });
  });

  it('gives field text without grouping and splits large values', () => {
    expect(fieldText(35000, 'en')).toBe('35000');
    expect(fieldText(3.5, 'de')).toBe('3,5');
    expect(fieldParts(35000, 'en')).toEqual({ text: '35000', exp: 0 });
    expect(fieldParts(2.8e9, 'en')).toEqual({ text: '2.8', exp: 9 });
    expect(fieldParts(9.97e6, 'en')).toEqual({ text: '1', exp: 7 });
    expect(fieldParts(0.0012, 'de')).toEqual({ text: '1,2', exp: -3 });
  });

  it('computes decades robustly', () => {
    expect(decade(1000)).toBe(3);
    expect(decade(999.999)).toBe(2);
    expect(decade(1e-3)).toBe(-3);
    fc.assert(
      fc.property(fc.integer({ min: -20, max: 30 }), (e) => {
        expect(decade(10 ** e)).toBe(e);
      })
    );
  });
});
