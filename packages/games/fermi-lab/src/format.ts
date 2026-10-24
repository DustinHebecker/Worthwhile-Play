/**
 * Number entry and display (design § 5 and § 11.3). Pure and DOM-free; `Intl.NumberFormat` provides each locale's
 * separators, digits and large-number words (thousand, Milliarde, 万, lakh…).
 *
 * Parsing accepts the UI locale's separators, the other common separator convention when it is unambiguous,
 * scientific forms (`3.5e4`, `3,5·10^4`, `3.5 × 10⁴`, `10^4`) and the digits of the Arabic-Indic, Extended
 * Arabic-Indic, Devanagari and full-width systems. It never throws.
 */
import { bcp47Tag } from '@wp/game-core';

const DIGIT_BLOCKS = [0x0660, 0x06f0, 0x0966, 0xff10];

const CHAR_MAP: Readonly<Record<string, string>> = {
  '．': '.',
  '，': ',',
  '٬': ',',
  '、': ',',
  '－': '-',
  '−': '-',
  '＋': '+',
  'ｅ': 'e',
  'Ｅ': 'e',
  'ｘ': 'x',
  'Ｘ': 'x',
  '＊': '*',
  '＾': '^',
  '⋅': '·',
  '∙': '·',
  '•': '·'
};

/** Western digits for the four other digit systems and full-width punctuation (the Arabic decimal sign becomes `D`). */
export function normalizeDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    const block = DIGIT_BLOCKS.find((start) => code >= start && code <= start + 9);
    if (block !== undefined) out += String(code - block);
    else if (ch === '٫') out += 'D';
    else out += CHAR_MAP[ch] ?? ch;
  }
  return out;
}

export interface Separators {
  readonly group: string;
  readonly decimal: string;
}

const sepCache = new Map<string, Separators>();

/** The locale's group and decimal separators (from `formatToParts`). */
export function separators(locale: string): Separators {
  const hit = sepCache.get(locale);
  if (hit) return hit;
  let group = ',';
  let decimal = '.';
  try {
    const parts = new Intl.NumberFormat(bcp47Tag(locale)).formatToParts(1234567.8);
    group = normalizeDigits(parts.find((p) => p.type === 'group')?.value ?? ',');
    decimal = normalizeDigits(parts.find((p) => p.type === 'decimal')?.value ?? '.');
  } catch {
    // Unknown locale: English conventions.
  }
  const result = { group, decimal: decimal === 'D' ? '.' : decimal };
  sepCache.set(locale, result);
  return result;
}

export type ParseResult = { readonly ok: true; readonly value: number } | { readonly ok: false; readonly reason: 'empty' | 'invalid' | 'notPositive' };

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const fromSuperscript = (s: string): string =>
  s
    .split('')
    .map((c) => (c === '⁻' ? '-' : c === '⁺' ? '+' : String(SUPERSCRIPTS.indexOf(c))))
    .join('');

const EXP_TAIL = /^(.*?)(?:[x*·×]10(?:\^([+-]?\d{1,3})|([⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]{1,3}))|e([+-]?\d{1,3}))$/;
const POWER_ONLY = /^10(?:\^([+-]?\d{1,3})|([⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]{1,3}))$/;

/** Reads a plain decimal mantissa (no exponent) with the locale's conventions; NaN when malformed. */
function parseMantissa(raw: string, locale: string): number {
  let s = raw;
  if (s.startsWith('+')) s = s.slice(1);
  if (s.includes('D')) {
    if (s.split('D').length > 2) return Number.NaN;
    s = s.replace(/[.,]/g, '').replace('D', '.');
  } else {
    const { decimal } = separators(locale);
    const dots = (s.match(/\./g) ?? []).length;
    const commas = (s.match(/,/g) ?? []).length;
    let dec: string | null = null;
    if (dots && commas) dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    else if (dots + commas === 1) {
      const c = dots ? '.' : ',';
      // The locale's decimal sign is a decimal sign; the other one is a group separator only before exactly 3 digits.
      dec = c === decimal || !/^\d{1,3}[.,]\d{3}$/.test(s) ? c : null;
    }
    const grp = dec ? (dec === '.' ? ',' : '.') : dots ? '.' : ',';
    // Group separators sit between groups of three digits (or of two before the last three, as in 12,34,567).
    const intPart = dec ? s.slice(0, s.lastIndexOf(dec)) : s;
    const g = `\\${grp}`;
    if (intPart.includes(grp) && !new RegExp(`^(\\d{1,3}(${g}\\d{3})+|\\d{1,2}(${g}\\d{2})*${g}\\d{3})$`).test(intPart)) return Number.NaN;
    s = s.split(grp).join('');
    if (dec === ',') s = s.replace(',', '.');
  }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return Number.NaN;
  return Number(s);
}

/**
 * Parses what a player typed. `empty` for blank input, `notPositive` for zero or a minus sign, `invalid` for
 * anything else that is not a finite positive number.
 */
export function parseLocaleNumber(text: string, locale: string): ParseResult {
  if (typeof text !== 'string') return { ok: false, reason: 'invalid' };
  const s = normalizeDigits(text)
    .replace(/[\s\u00a0\u202f\u2009'\u2019]/g, '')
    .replace(/E/g, 'e')
    .replace(/X/g, 'x');
  if (s === '') return { ok: false, reason: 'empty' };
  if (s.length > 40) return { ok: false, reason: 'invalid' };
  if (s.startsWith('-')) return /\d/.test(s) ? { ok: false, reason: 'notPositive' } : { ok: false, reason: 'invalid' };
  let mantissaText = s;
  let exponent = 0;
  const power = POWER_ONLY.exec(s);
  if (power) {
    mantissaText = '1';
    exponent = Number(power[1] ?? fromSuperscript(power[2]!));
  } else {
    const tail = EXP_TAIL.exec(s);
    if (tail) {
      mantissaText = tail[1]!;
      exponent = Number(tail[2] ?? (tail[3] !== undefined ? fromSuperscript(tail[3]) : tail[4]));
    }
  }
  if (mantissaText.startsWith('-')) return { ok: false, reason: 'notPositive' };
  const mantissa = parseMantissa(mantissaText, locale);
  if (!Number.isFinite(mantissa) || !Number.isFinite(exponent)) return { ok: false, reason: 'invalid' };
  const value = mantissa * 10 ** exponent;
  if (value === 0 && mantissa === 0) return { ok: false, reason: 'notPositive' };
  if (!Number.isFinite(value) || value <= 0) return { ok: false, reason: 'invalid' };
  return { ok: true, value };
}

/** `x` rounded to `n` significant digits. */
export const roundSig = (x: number, n: number): number => (x > 0 && Number.isFinite(x) ? Number(x.toPrecision(n)) : x);

/** Decade of a positive number, robust against floating-point (`floor(log10(1000)) = 3`). */
export function decade(x: number): number {
  let e = Math.floor(Math.log10(x));
  if (10 ** (e + 1) <= x) e += 1;
  else if (10 ** e > x) e -= 1;
  return e;
}

const nf = (locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat => {
  try {
    return new Intl.NumberFormat(bcp47Tag(locale), options);
  } catch {
    return new Intl.NumberFormat('en', options);
  }
};

/** A positive quantity for display: `mantissa × 10^exponent` (exponent null for plain numbers), optional words. */
export interface Quantity {
  /** The plain number or the mantissa, in the locale's digits and separators. */
  readonly mantissa: string;
  readonly exponent: number | null;
  /** The exponent in the locale's digits (for `<sup>`). */
  readonly exponentText: string;
  /** The long compact form ("35 thousand", "1,3 Milliarden", "13億") or null. */
  readonly words: string | null;
  /** One-line text, e.g. `35,000` or `3.5 × 10⁹`. */
  readonly text: string;
}

const SUP = (n: number) =>
  String(n)
    .split('')
    .map((c) => (c === '-' ? '⁻' : SUPERSCRIPTS[Number(c)]))
    .join('');

/**
 * Formats a positive value: 0.01 ≤ v < 10⁶ as a plain number with 3 significant digits, otherwise as mantissa × 10ⁿ.
 * Values from 10⁴ up to 10¹⁵ also get the locale's large-number words.
 */
export function formatQuantity(value: number, locale: string, digits = 3): Quantity {
  const plain = nf(locale, { maximumSignificantDigits: digits });
  let words: string | null = null;
  if (value >= 1e4 && value < 1e15) {
    try {
      words = nf(locale, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: digits }).format(value);
    } catch {
      words = null;
    }
  }
  if (!(value > 0) || !Number.isFinite(value)) return { mantissa: plain.format(value), exponent: null, exponentText: '', words: null, text: plain.format(value) };
  if (value >= 0.01 && value < 1e6) {
    const text = plain.format(value);
    return { mantissa: text, exponent: null, exponentText: '', words: words === text ? null : words, text };
  }
  let e = decade(value);
  let m = roundSig(value / 10 ** e, digits);
  if (m >= 10) {
    e += 1;
    m = roundSig(m / 10, digits);
  }
  const mantissa = plain.format(m);
  return { mantissa, exponent: e, exponentText: nf(locale, { useGrouping: false }).format(e), words, text: `${mantissa} × 10${SUP(e)}` };
}

/** Text for a number field (no grouping) with `digits` significant digits. */
export function fieldText(value: number, locale: string, digits = 2): string {
  return nf(locale, { maximumSignificantDigits: digits, useGrouping: false }).format(value);
}

/**
 * Splits a value into what the number field and its "× 10ⁿ" stepper show: plain below 10⁶ (and from 0.01),
 * otherwise a mantissa with 2 significant digits and an exponent.
 */
export function fieldParts(value: number, locale: string, digits = 2): { text: string; exp: number } {
  if (value >= 0.01 && value < 1e6) return { text: fieldText(roundSig(value, digits), locale, digits), exp: 0 };
  let e = decade(value);
  let m = roundSig(value / 10 ** e, digits);
  if (m >= 10) {
    e += 1;
    m = roundSig(m / 10, digits);
  }
  return { text: fieldText(m, locale, digits), exp: e };
}
