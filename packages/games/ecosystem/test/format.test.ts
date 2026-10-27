import { describe, expect, it } from 'vitest';
import { bcp47Tag } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { formatAmount, formatInt, formatPlural, pluralCategory } from '../src/format';
import { glyphCount, ilog2 } from '../src/glyphs';

describe('format', () => {
  it('amounts in model units (thousands), "<1" for a present trace', () => {
    expect(formatAmount(58_400, 'en')).toBe('58');
    expect(formatAmount(1_908_600, 'en')).toBe('1,909');
    expect(formatAmount(1_908_600, 'de')).toBe('1.909');
    expect(formatAmount(0, 'en')).toBe('0');
    expect(formatAmount(120, 'en')).toBe('<1');
    expect(formatAmount(500, 'en')).toBe('1');
    expect(formatAmount(58_000, 'ar')).toBe(formatInt(58, 'ar'));
    for (const l of SUPPORTED_LOCALES) expect(formatAmount(327_000, l), l).toBe(new Intl.NumberFormat(bcp47Tag(l)).format(327));
  });

  it('plural forms by Intl.PluralRules', () => {
    const forms = { one: '{n} week', few: '{n} weeks (few)', other: '{n} weeks' };
    expect(formatPlural(forms, 1, 'en')).toBe('1 week');
    expect(formatPlural(forms, 26, 'en')).toBe('26 weeks');
    expect(pluralCategory(3, 'ru')).toBe('few');
    expect(formatPlural(forms, 3, 'ru')).toBe('3 weeks (few)');
    expect(formatPlural({ other: '{n} x' }, 5, 'ru')).toBe('5 x');
  });

  it('glyph counts grow with the logarithm, at least one while present, at most twelve', () => {
    expect(ilog2(1)).toBe(0);
    expect(ilog2(2)).toBe(1);
    expect(ilog2(1023)).toBe(9);
    expect(ilog2(1024)).toBe(10);
    expect(glyphCount('algae', 0)).toBe(0);
    expect(glyphCount('algae', 1)).toBe(1);
    expect(glyphCount('algae', 58_000)).toBe(5);
    expect(glyphCount('algae', 10_000_000)).toBe(12);
  });
});
