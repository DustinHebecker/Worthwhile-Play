/**
 * Number, distance, area, population, duration, time and coordinate formatting (design § 13.4). Pure and DOM-free;
 * `Intl` provides each locale's digits, separators, unit words and large-number words. Every value shown is "about":
 * distances above 1,000 km and areas keep two significant digits, shorter distances are rounded to 10 km.
 */
import { bcp47Tag } from '@wp/game-core';

export type DistanceUnit = 'km' | 'mi';
export const KM_PER_MILE = 1.609344;

const cache = new Map<string, Intl.NumberFormat>();
function nf(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(bcp47Tag(locale), options);
    } catch {
      f = new Intl.NumberFormat('en', options);
    }
    cache.set(key, f);
  }
  return f;
}

/** Rounds a distance for display: two significant digits from 1,000 up, else to 10 (never below 10). */
export function roundDistance(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v >= 1000) {
    const mag = 10 ** (Math.floor(Math.log10(v)) - 1);
    return Math.round(v / mag) * mag;
  }
  return Math.max(10, Math.round(v / 10) * 10);
}

/** "1,400 km" / "870 mi" (rounded, unit words from Intl). */
export function formatDistance(km: number, locale: string, unit: DistanceUnit = 'km'): string {
  const v = roundDistance(unit === 'km' ? km : km / KM_PER_MILE);
  return nf(locale, { style: 'unit', unit: unit === 'km' ? 'kilometer' : 'mile', unitDisplay: 'short', maximumFractionDigits: 0 }).format(v);
}

/** A plain whole number with grouping ("1,234"). */
export const formatInt = (n: number, locale: string): string => nf(locale, { maximumFractionDigits: 0 }).format(n);

/** A number with up to one decimal ("41.9"). */
export const formatDecimal = (n: number, locale: string, digits = 1): string => nf(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);

/** An area rounded to two significant digits, as a number (the unit word comes from the messages). */
export function formatArea(km2: number, locale: string, unit: DistanceUnit = 'km'): string {
  const v = unit === 'km' ? km2 : km2 / (KM_PER_MILE * KM_PER_MILE);
  return nf(locale, { maximumSignificantDigits: 2 }).format(v);
}

/** A population in words ("214 million", "214 Millionen", "2.1 亿"…). */
export const formatPopulation = (n: number, locale: string): string => nf(locale, { notation: 'compact', compactDisplay: 'long', maximumSignificantDigits: 2 }).format(n);

/** People per km² (or per sq mi), two significant digits. */
export const formatDensity = (perKm2: number, locale: string, unit: DistanceUnit = 'km'): string =>
  nf(locale, { maximumSignificantDigits: 2 }).format(unit === 'km' ? perKm2 : perKm2 * KM_PER_MILE * KM_PER_MILE);

/** A duration in hours and minutes, rounded to 5 minutes ("18 hr 50 min"); whole hours alone ("24 hr"). */
export function formatDuration(hours: number, locale: string): string {
  const total = Math.round((hours * 60) / 5) * 5;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hs = nf(locale, { style: 'unit', unit: 'hour', unitDisplay: 'short' }).format(h);
  if (m === 0) return hs;
  const ms = nf(locale, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(m);
  return h === 0 ? ms : `${hs} ${ms}`;
}

/** A number of hours with sign ("+7 hr", "−3 hr"). */
export const formatHours = (h: number, locale: string): string => nf(locale, { style: 'unit', unit: 'hour', unitDisplay: 'short', signDisplay: 'exceptZero' }).format(h);

/** A time of day "hh:mm" in the locale's style, for minutes after midnight (wrapping around the day). */
export function formatClock(minutes: number, locale: string): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const date = new Date(Date.UTC(2026, 0, 1, Math.floor(m / 60), m % 60));
  try {
    return new Intl.DateTimeFormat(bcp47Tag(locale), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(date);
  } catch {
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }
}

/** A UTC offset ("UTC+5:30", "UTC−3", "UTC") with the locale's digits. */
export function formatUtcOffset(minutes: number, locale: string): string {
  if (minutes === 0) return 'UTC';
  const sign = minutes < 0 ? '−' : '+';
  const a = Math.abs(minutes);
  const h = nf(locale, { maximumFractionDigits: 0, useGrouping: false }).format(Math.floor(a / 60));
  const m = a % 60 ? `:${nf(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(a % 60)}` : '';
  return `UTC${sign}${h}${m}`;
}

/** The absolute value of a latitude or longitude, with up to `digits` decimals (the hemisphere word comes from the messages). */
export const formatDegrees = (deg: number, locale: string, digits = 1): string => nf(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(Math.abs(deg));
