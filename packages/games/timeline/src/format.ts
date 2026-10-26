/**
 * Dates, durations, the Earth-day clock and typed numbers per locale (design § 17.3). Pure and DOM-free. Era words
 * come from the game's message templates (Intl has no "BCE" and cannot show 4.5 billion years ago); digits,
 * separators, plural forms of "years" and the large-number words come from `Intl`.
 */
import { bcp47Tag } from '@wp/game-core';
import { AXIS_YEAR, BP_YEAR, EARTH_AGE, regimeOf, roundSig, toBce, type EntryUnit } from './time';

/** The translator shape the formatters need. */
export type T = (key: string, params?: Record<string, string | number>) => string;

const nfCache = new Map<string, Intl.NumberFormat>();
function nf(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = nfCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(bcp47Tag(locale), options);
    } catch {
      f = new Intl.NumberFormat('en', options);
    }
    nfCache.set(key, f);
  }
  return f;
}

/** A calendar year number without grouping ("1969", never "1,969"). */
export const yearNumber = (n: number, locale: string): string => nf(locale, { useGrouping: false, maximumFractionDigits: 0 }).format(n);
/** An integer with the locale's grouping. */
export const int = (n: number, locale: string): string => nf(locale, { maximumFractionDigits: 0 }).format(n);
/** A number with up to `digits` significant digits and grouping. */
export const sig = (n: number, locale: string, digits = 3): string => nf(locale, { maximumSignificantDigits: digits }).format(n);
/** Compact long form of a large number ("66 million", "66 Millionen", "6600万"), ≤ 4 significant digits. */
export const compactLong = (n: number, locale: string): string => nf(locale, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: 4 }).format(n);
/** Compact short form for tick labels ("100K", "1 Mio.", "10万"). */
export const compactShort = (n: number, locale: string): string => nf(locale, { notation: 'compact', compactDisplay: 'short', maximumSignificantDigits: 2 }).format(n);

/** Years before 1950 of a deep-past year, rounded for display: 4 significant digits, at least to tens. */
const agoOf = (y: number): number => roundSig(BP_YEAR - y, 4);

/** One year in its display regime (§ 5.3): "4.54 billion years ago", "14,400 years ago", "2560 BCE", "105 CE", "1969". */
export function formatYear(y: number, t: T, locale: string): string {
  switch (regimeOf(y)) {
    case 'ce':
      return t('date.ce', { year: yearNumber(y, locale) });
    case 'ceEarly':
      return t('date.ceEarly', { year: yearNumber(y, locale) });
    case 'bce':
      return t('date.bce', { year: yearNumber(toBce(y), locale) });
    case 'ago': {
      const a = agoOf(y);
      return a < 1e6 ? t('date.agoThousands', { n: int(a, locale) }) : t('date.agoMillions', { n: compactLong(a, locale) });
    }
  }
}

const NUMBER_PARTS = new Set(['integer', 'group', 'decimal', 'fraction', 'minusSign', 'plusSign']);

/** Two compact numbers sharing their word: "4.59–4.49 billion"; null when the words differ. */
function compactPair(a: number, b: number, locale: string): string | null {
  const f = nf(locale, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: 4 });
  const pa = f.formatToParts(a);
  const pb = f.formatToParts(b);
  const rest = (p: Intl.NumberFormatPart[]) => p.filter((x) => !NUMBER_PARTS.has(x.type)).map((x) => x.value).join('');
  if (rest(pa) !== rest(pb)) return null;
  const numA = pa.filter((x) => NUMBER_PARTS.has(x.type)).map((x) => x.value).join('');
  const numB = pb.filter((x) => NUMBER_PARTS.has(x.type)).map((x) => x.value).join('');
  let out = '';
  let done = false;
  for (const p of pb) {
    if (NUMBER_PARTS.has(p.type)) {
      if (!done) out += `${numA}–${numB}`;
      done = true;
    } else out += p.value;
  }
  return out;
}

/** A range or span of years, the era word shown once when both ends share it: "2600–2500 BCE", "1405–1433". */
export function formatRange(lo: number, hi: number, t: T, locale: string): string {
  if (lo === hi) return formatYear(lo, t, locale);
  const ra = regimeOf(lo);
  const rb = regimeOf(hi);
  if (ra === rb) {
    switch (ra) {
      case 'ce':
        return t('date.ce', { year: `${yearNumber(lo, locale)}–${yearNumber(hi, locale)}` });
      case 'ceEarly':
        return t('date.ceEarly', { year: `${yearNumber(lo, locale)}–${yearNumber(hi, locale)}` });
      case 'bce':
        return t('date.bce', { year: `${yearNumber(toBce(lo), locale)}–${yearNumber(toBce(hi), locale)}` });
      case 'ago': {
        const a = agoOf(lo);
        const b = agoOf(hi);
        if (a < 1e6 && b < 1e6) return t('date.agoThousands', { n: `${int(a, locale)}–${int(b, locale)}` });
        if (a >= 1e6 && b >= 1e6) {
          const pair = compactPair(a, b, locale);
          if (pair) return t('date.agoMillions', { n: pair });
        }
      }
    }
  }
  return `${formatYear(lo, t, locale)}–${formatYear(hi, t, locale)}`;
}

/** How an event's date reads: a span as its range, an exact year, or "about …" for a point with a range. */
export function formatWhen(e: { readonly y: number; readonly lo: number; readonly hi: number; readonly kind: 'point' | 'span' }, t: T, locale: string): string {
  if (e.kind === 'span') return formatRange(e.lo, e.hi, t, locale);
  if (e.lo === e.hi) return formatYear(e.y, t, locale);
  return t('date.about', { date: formatYear(e.y, t, locale) });
}

/** A duration in years: "about"-free; "300 years", "9.5 million years" (2 significant digits by default). */
export function formatDuration(years: number, t: T, locale: string, digits = 2): string {
  const v = roundSig(Math.max(1, Math.abs(years)), digits);
  if (v < 1e6) return nf(locale, { style: 'unit', unit: 'year', unitDisplay: 'long', maximumSignificantDigits: digits }).format(v);
  return t('duration.millions', { n: compactLong(v, locale) });
}

/** A rung of the gap ladder ("about 300 years"). */
export const formatGap = (years: number, t: T, locale: string): string => t('first.option', { duration: formatDuration(years, t, locale, 1) });

/** A tick label: calendar years as dates, deep-past ticks as compact "years ago". */
export function formatTick(y: number, ago: boolean, t: T, locale: string): string {
  if (!ago) return formatYear(y, t, locale);
  return t('tick.ago', { n: compactShort(BP_YEAR - y, locale) });
}

/* ---------- The Earth-day clock (§ 7.5) ---------- */

/** Seconds before midnight if the Earth's 4.54 billion years were one day. */
export const earthSeconds = (y: number): number => (86_400 * (AXIS_YEAR - y)) / EARTH_AGE;

export function earthClock(y: number, t: T, locale: string): string {
  const s = earthSeconds(y);
  if (s >= 60) {
    const at = Math.max(0, 86_400 - s);
    let time: string;
    try {
      time = new Intl.DateTimeFormat(bcp47Tag(locale), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(new Date(Math.floor(at) * 1000));
    } catch {
      const m = Math.floor(at / 60);
      time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    }
    return t('clock.time', { time });
  }
  if (s >= 0.001) return t('clock.seconds', { s: nf(locale, { style: 'unit', unit: 'second', unitDisplay: 'long', maximumSignificantDigits: 2 }).format(roundSig(s, 2)) });
  return t('clock.tiny');
}

/* ---------- Typed numbers (§ 7.2) ---------- */

const DIGIT_BLOCKS = [0x0660, 0x06f0, 0x0966, 0xff10];
const CHAR_MAP: Readonly<Record<string, string>> = { '．': '.', '，': ',', '٬': ',', '、': ',', '－': '-', '−': '-' };

/** Western digits for Arabic-Indic, Extended Arabic-Indic, Devanagari and full-width digits (Arabic decimal → `D`). */
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

const sepCache = new Map<string, { group: string; decimal: string }>();
/** The locale's group and decimal separators. */
export function separators(locale: string): { group: string; decimal: string } {
  const hit = sepCache.get(locale);
  if (hit) return hit;
  let group = ',';
  let decimal = '.';
  try {
    const parts = new Intl.NumberFormat(bcp47Tag(locale)).formatToParts(1234567.8);
    group = normalizeDigits(parts.find((p) => p.type === 'group')?.value ?? ',');
    decimal = normalizeDigits(parts.find((p) => p.type === 'decimal')?.value ?? '.');
  } catch {
    // English conventions.
  }
  const r = { group, decimal: decimal === 'D' ? '.' : decimal };
  sepCache.set(locale, r);
  return r;
}

export type ParseResult = { readonly ok: true; readonly value: number } | { readonly ok: false; readonly reason: 'empty' | 'invalid' | 'zero' };

/**
 * Reads a typed positive number with the locale's separators (the other convention when unambiguous) and the
 * digits of the common digit systems. Never throws.
 */
export function parseNumber(text: string, locale: string): ParseResult {
  if (typeof text !== 'string') return { ok: false, reason: 'invalid' };
  let s = normalizeDigits(text).replace(/[\s   '’]/g, '');
  if (s === '') return { ok: false, reason: 'empty' };
  if (s.length > 24) return { ok: false, reason: 'invalid' };
  if (s.startsWith('-')) return /\d/.test(s) ? { ok: false, reason: 'zero' } : { ok: false, reason: 'invalid' };
  if (s.startsWith('+')) s = s.slice(1);
  if (s.includes('D')) {
    if (s.split('D').length > 2) return { ok: false, reason: 'invalid' };
    s = s.replace(/[.,]/g, '').replace('D', '.');
  } else {
    const { decimal } = separators(locale);
    const dots = (s.match(/\./g) ?? []).length;
    const commas = (s.match(/,/g) ?? []).length;
    let dec: string | null = null;
    if (dots && commas) dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
    else if (dots + commas === 1) {
      const c = dots ? '.' : ',';
      dec = c === decimal || !/^\d{1,3}[.,]\d{3}$/.test(s) ? c : null;
    }
    const grp = dec ? (dec === '.' ? ',' : '.') : dots ? '.' : ',';
    const intPart = dec ? s.slice(0, s.lastIndexOf(dec)) : s;
    const g = `\\${grp}`;
    if (intPart.includes(grp) && !new RegExp(`^(\\d{1,3}(${g}\\d{3})+|\\d{1,2}(${g}\\d{2})*${g}\\d{3})$`).test(intPart)) return { ok: false, reason: 'invalid' };
    s = s.split(grp).join('');
    if (dec === ',') s = s.replace(',', '.');
  }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { ok: false, reason: 'invalid' };
  const v = Number(s);
  if (!Number.isFinite(v)) return { ok: false, reason: 'invalid' };
  if (v === 0) return { ok: false, reason: 'zero' };
  return { ok: true, value: v };
}

/** The text of the year field for a value in a unit (years without grouping, "years ago" with). */
export function entryText(value: number, unit: EntryUnit, locale: string): string {
  if (unit === 'ce' || unit === 'bce') return yearNumber(value, locale);
  return nf(locale, { maximumSignificantDigits: 3 }).format(value);
}
