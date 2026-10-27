import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { COMMON_MESSAGES, SUPPORTED_LOCALES, createTranslator, type SupportedLocale } from '@wp/localization';
import {
  compactLong, earthClock, earthSeconds, entryText, formatDuration, formatGap, formatRange, formatTick, formatWhen, formatYear, int, normalizeDigits,
  parseNumber, separators, yearNumber
} from '../src/format';
import { messages } from '../src/messages';
import { BP_YEAR, fromBce, fromBp } from '../src/time';

const tr = (locale: SupportedLocale) => {
  const missing: string[] = [];
  const t = createTranslator({ locale, sources: [messages, COMMON_MESSAGES], onMissing: (key) => missing.push(key) });
  return { t, missing };
};
const en = tr('en').t;
const de = tr('de').t;

describe('dates in the four display regimes (design § 5.3)', () => {
  it('writes English dates', () => {
    expect(formatYear(1969, en, 'en')).toBe('1969');
    expect(formatYear(1000, en, 'en')).toBe('1000');
    expect(formatYear(999, en, 'en')).toBe('999 CE');
    expect(formatYear(1, en, 'en')).toBe('1 CE');
    expect(formatYear(0, en, 'en')).toBe('1 BCE');
    expect(formatYear(fromBce(2560), en, 'en')).toBe('2560 BCE');
    expect(formatYear(fromBce(10_000), en, 'en')).toBe('10000 BCE');
    expect(formatYear(fromBce(10_001), en, 'en')).toBe('11,950 years ago');
    expect(formatYear(fromBp(14_400), en, 'en')).toBe('14,400 years ago');
    expect(formatYear(fromBp(999_900), en, 'en')).toBe('999,900 years ago');
    expect(formatYear(fromBp(66e6), en, 'en')).toBe('66 million years ago');
    expect(formatYear(fromBp(4.54e9), en, 'en')).toBe('4.54 billion years ago');
  });

  it('writes German dates with the owner’s era words', () => {
    expect(formatYear(1969, de, 'de')).toBe('1969');
    expect(formatYear(105, de, 'de')).toBe('105 u. Z.');
    expect(formatYear(fromBce(2560), de, 'de')).toBe('2560 v. u. Z.');
    expect(formatYear(fromBp(14_400), de, 'de')).toMatch(/^vor 14\.400 Jahren$/);
    expect(formatYear(fromBp(66e6), de, 'de')).toBe('vor 66 Millionen Jahren');
  });

  it('never groups calendar years, in any locale', () => {
    for (const l of SUPPORTED_LOCALES) {
      const { t, missing } = tr(l);
      for (const y of [1969, 1000, fromBce(2560), fromBce(9999)]) expect(formatYear(y, t, l), `${l}/${y}`).not.toMatch(/\d[,.  ٬]\d{3}/);
      expect(missing, l).toEqual([]);
    }
  });

  it('gives every regime a different, non-empty text in all 16 locales (no raw keys, no placeholders)', () => {
    const years = [2001, 105, fromBce(44), fromBp(14_400), fromBp(2.5e6), fromBp(4.54e9)];
    for (const l of SUPPORTED_LOCALES) {
      const { t, missing } = tr(l);
      const texts = years.map((y) => formatYear(y, t, l));
      expect(new Set(texts).size, l).toBe(texts.length);
      for (const s of texts) expect(s, l).not.toMatch(/\{|\}|date\./);
      expect(missing, l).toEqual([]);
    }
  });
});

describe('ranges and "about" (design § 5.3)', () => {
  it('shows the shared era word once and uses an en dash', () => {
    expect(formatRange(fromBce(2600), fromBce(2500), en, 'en')).toBe('2600–2500 BCE');
    expect(formatRange(1405, 1433, en, 'en')).toBe('1405–1433');
    expect(formatRange(170, 310, en, 'en')).toBe('170–310 CE');
    expect(formatRange(fromBp(31_000), fromBp(30_000), en, 'en')).toBe('31,000–30,000 years ago');
    expect(formatRange(fromBp(4.59e9), fromBp(4.49e9), en, 'en')).toBe('4.59–4.49 billion years ago');
    expect(formatRange(fromBce(2600), fromBce(2600), en, 'en')).toBe('2600 BCE');
  });

  it('writes both ends in full when the regimes differ', () => {
    expect(formatRange(fromBce(30), 14, en, 'en')).toBe('30 BCE–14 CE');
    expect(formatRange(950, 1050, en, 'en')).toBe('950 CE–1050');
    expect(formatRange(fromBp(1.2e6), fromBp(900_000), en, 'en')).toBe('1.2 million years ago–900,000 years ago');
    expect(formatRange(fromBp(1.5e9), fromBp(900e6), en, 'en')).toBe('1.5 billion years ago–900 million years ago');
  });

  it('formats an event by kind', () => {
    expect(formatWhen({ kind: 'point', y: 1969, lo: 1969, hi: 1969 }, en, 'en')).toBe('1969');
    expect(formatWhen({ kind: 'point', y: 1886, lo: 1885, hi: 1886 }, en, 'en')).toBe('about 1886');
    expect(formatWhen({ kind: 'span', y: 1419, lo: 1405, hi: 1433 }, en, 'en')).toBe('1405–1433');
  });

  it('never gives "–" between two numbers of different units', () => {
    fc.assert(
      fc.property(fc.integer({ min: -5e9, max: 2020 }), fc.integer({ min: 0, max: 1e9 }), (lo, d) => {
        const hi = Math.min(2020, lo + d);
        const s = formatRange(lo, hi, en, 'en');
        return s.length > 0 && !s.includes('{') && (lo === hi || s.includes('–'));
      })
    );
  });
});

describe('durations, gaps and ticks', () => {
  it('uses Intl plural forms below a million and the large-number word above', () => {
    expect(formatDuration(300, en, 'en')).toBe('300 years');
    expect(formatDuration(1, en, 'en')).toBe('1 year');
    expect(formatDuration(0, en, 'en')).toBe('1 year');
    expect(formatDuration(-2500, en, 'en')).toBe('2,500 years');
    expect(formatDuration(9.5e6, en, 'en')).toBe('9.5 million years');
    expect(formatDuration(1234, en, 'en', 1)).toBe('1,000 years');
    expect(formatDuration(300, de, 'de')).toBe('300 Jahre');
    expect(formatDuration(1, de, 'de')).toBe('1 Jahr');
    expect(formatGap(300, en, 'en')).toBe('about 300 years');
    expect(formatGap(3e8, en, 'en')).toBe('about 300 million years');
  });

  it('labels ticks: calendar years as dates, the deep past compactly', () => {
    expect(formatTick(1000, false, en, 'en')).toBe('1000');
    expect(formatTick(fromBce(3000), false, en, 'en')).toBe('3000 BCE');
    expect(formatTick(BP_YEAR - 1e5, true, en, 'en')).toBe('100K ago');
    expect(formatTick(BP_YEAR - 1e9, true, en, 'en')).toBe('1B ago');
    for (const l of SUPPORTED_LOCALES) {
      const { t, missing } = tr(l);
      expect(formatTick(BP_YEAR - 1e6, true, t, l).length, l).toBeLessThan(16);
      expect(missing, l).toEqual([]);
    }
  });

  it('formats numbers with the locale’s digits and grouping', () => {
    expect(int(14_400, 'en')).toBe('14,400');
    expect(int(14_400, 'de')).toBe('14.400');
    expect(yearNumber(14_400, 'en')).toBe('14400');
    expect(compactLong(66e6, 'en')).toBe('66 million');
    expect(compactLong(66e6, 'ja')).toBe('6600万');
  });
});

describe('the Earth-day clock (design § 7.5)', () => {
  it('puts the dinosaurs’ end at about 23:39', () => {
    const s = earthSeconds(fromBp(66e6));
    const clock = 86_400 - s;
    expect(Math.abs(clock - (23 * 3600 + 39 * 60 + 4))).toBeLessThan(60);
    expect(earthClock(fromBp(66e6), en, 'en')).toBe("If the Earth's 4.54 billion years were one day, this happened at 23:39.");
  });

  it('starts at 00:00 with the Earth itself', () => {
    expect(earthClock(fromBp(4.54e9), en, 'en')).toContain('00:00');
    expect(earthClock(fromBp(5e9), en, 'en')).toContain('00:00');
  });

  it('switches to seconds in the last minute and to "less than a thousandth" at the very end', () => {
    expect(earthClock(fromBp(300_000), en, 'en')).toContain('5.7 seconds before midnight');
    expect(earthClock(1969, en, 'en')).toContain('0.0012 seconds before midnight');
    expect(earthClock(2000, en, 'en')).toBe(en('clock.tiny'));
  });

  it('reads in every locale with a 24-hour time', () => {
    for (const l of SUPPORTED_LOCALES) {
      const { t, missing } = tr(l);
      const s = normalizeDigits(earthClock(fromBp(66e6), t, l));
      expect(s, l).toMatch(/23\D39/);
      expect(earthClock(fromBp(300_000), t, l), l).not.toMatch(/\{/);
      expect(missing, l).toEqual([]);
    }
  });
});

describe('typed numbers (design § 7.2)', () => {
  it('reads the locale’s separators and the other convention when unambiguous', () => {
    expect(parseNumber('2560', 'en')).toEqual({ ok: true, value: 2560 });
    expect(parseNumber('14,400', 'en')).toEqual({ ok: true, value: 14_400 });
    expect(parseNumber('14.400', 'de')).toEqual({ ok: true, value: 14_400 });
    expect(parseNumber('4,54', 'de')).toEqual({ ok: true, value: 4.54 });
    expect(parseNumber('4.54', 'de')).toEqual({ ok: true, value: 4.54 });
    expect(parseNumber('4.54', 'en')).toEqual({ ok: true, value: 4.54 });
    expect(parseNumber('1,234.5', 'de')).toEqual({ ok: true, value: 1234.5 });
    expect(parseNumber('1.234,5', 'en')).toEqual({ ok: true, value: 1234.5 });
    expect(parseNumber('14 400', 'fr')).toEqual({ ok: true, value: 14_400 });
    expect(parseNumber('1,00,000', 'hi')).toEqual({ ok: true, value: 100_000 });
    expect(parseNumber(' +66 ', 'en')).toEqual({ ok: true, value: 66 });
  });

  it('reads Arabic-Indic, Devanagari and full-width digits', () => {
    expect(parseNumber('١٩٦٩', 'ar')).toEqual({ ok: true, value: 1969 });
    expect(parseNumber('٤٫٥٤', 'ar')).toEqual({ ok: true, value: 4.54 });
    expect(parseNumber('१९६९', 'hi')).toEqual({ ok: true, value: 1969 });
    expect(parseNumber('１９６９', 'ja')).toEqual({ ok: true, value: 1969 });
    expect(normalizeDigits('۱۲۳')).toBe('123');
  });

  it('rejects empty, zero, negative and malformed input with a reason', () => {
    expect(parseNumber('', 'en')).toEqual({ ok: false, reason: 'empty' });
    expect(parseNumber('   ', 'en')).toEqual({ ok: false, reason: 'empty' });
    expect(parseNumber('0', 'en')).toEqual({ ok: false, reason: 'zero' });
    expect(parseNumber('-44', 'en')).toEqual({ ok: false, reason: 'zero' });
    for (const bad of ['abc', '1,2,3', '12.34.56', '1e5', '١٫٢٫٣', '-', '.', '9'.repeat(30)]) expect(parseNumber(bad, 'en').ok, bad).toBe(false);
    // A lone separator that cannot be grouping is read as a decimal point ("1,2345" → 1.2345).
    expect(parseNumber('1,2345', 'en')).toEqual({ ok: true, value: 1.2345 });
    expect(parseNumber(42 as unknown as string, 'en')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('never throws and round-trips its own formatting in every locale', () => {
    fc.assert(fc.property(fc.string(), (s) => typeof parseNumber(s, 'en').ok === 'boolean'));
    for (const l of SUPPORTED_LOCALES) {
      expect(separators(l).group.length, l).toBeGreaterThan(0);
      for (const n of [1969, 14_400, 250_000, 4.54])
        expect(parseNumber(entryText(n, n === 1969 ? 'ce' : 'ago', l), l), `${l}/${n}`).toEqual({ ok: true, value: n });
    }
  });
});
