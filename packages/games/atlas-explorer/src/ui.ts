/**
 * Shared view helpers of Atlas Explorer: names in the UI language (countries from CLDR, capitals from the *Capitals*
 * deck, everything else from the per-locale content), formatting bound to the locale and the distance unit, compass
 * words, bands and small DOM pieces. No game state.
 */
import type { Translator } from '@wp/game-core';
import { capitalName, countryName, hasCountryNames } from '@wp/learning-content';
import { h } from '@wp/ui';
import type { Atlas } from './atlas';
import type { ContentText } from './content';
import { formatArea, formatClock, formatDecimal, formatDegrees, formatDensity, formatDistance, formatDuration, formatInt, formatPopulation, formatUtcOffset, type DistanceUnit } from './format';
import { compassWord, crossesDateLine, distanceKm, mapBearing } from './geo';
import type { Place } from './state';

/** Marks of the find bands (design § 6.3), always shown with words. */
export const BAND_MARKS = ['●●●', '●●○', '●○○', '○○○'] as const;
/** Symbols of the places in a compare question (design § 7.1). */
export const PLACE_SYMBOLS = ['●', '■', '▲'] as const;

type Lang = Parameters<typeof capitalName>[1];

export interface Ui {
  readonly t: Translator;
  readonly locale: string;
  readonly atlas: Atlas;
  unit(): DistanceUnit;
  country(id: string): string;
  /** A non-UN map unit: its CLDR name when it has an ISO code, else a generic word. */
  other(id: string): string;
  city(id: string): string;
  feature(id: string): string;
  sea(id: string): string;
  sub(id: string): string;
  region(id: string): string;
  place(p: Place): string;
  insight(id: string): string | undefined;
  km(km: number): string;
  area(km2: number): string;
  pop(n: number): string;
  density(perKm2: number): string;
  dur(hours: number): string;
  clock(minutes: number): string;
  utc(minutes: number): string;
  int(n: number): string;
  dec(n: number, digits?: number): string;
  /** "41.9° N" (one decimal; whole degrees with `digits` 0). */
  lat(lat: number, digits?: number): string;
  lon(lon: number, digits?: number): string;
  /** "41.9° N, 12.5° E". */
  coord(lon: number, lat: number, digits?: number): string;
  /** Compass word from one point to another as read off this map (no wrapping at ±180°; 16 words, 8 on easy). */
  direction(fromLon: number, fromLat: number, toLon: number, toLat: number, sectors?: 8 | 16): string;
  /** "about 1,400 km north-west" from one point to another (great-circle distance, direction as on the map). */
  distanceAndDirection(fromLon: number, fromLat: number, toLon: number, toLat: number, sectors?: 8 | 16): string;
  /** The sentence that the shortest way crosses the date line (so it runs the other way round than the map
   *  direction), or '' when it does not. Shown next to every `distanceAndDirection`. */
  dateLine(fromLon: number, toLon: number): string;
  heading(tag: 'h2' | 'h3', id: string, text: string): HTMLElement;
  bdi(text: string, cls?: string): HTMLElement;
}

export function createUi(t: Translator, atlas: Atlas, content: () => ContentText, unit: () => DistanceUnit): Ui {
  const locale = t.locale;
  const cldr = hasCountryNames(locale) ? locale : 'en';
  const named = (id: string) => content().names[id] ?? id;
  const deg = (v: number, pos: string, neg: string, digits: number) => {
    const r = Number(v.toFixed(digits));
    if (r === 0) return t('coord.zero', { d: formatDegrees(0, locale, digits) });
    return t(r > 0 ? pos : neg, { d: formatDegrees(r, locale, digits) });
  };
  const ui: Ui = {
    t,
    locale,
    atlas,
    unit,
    country: (id) => countryName(id, cldr),
    other(id) {
      const o = atlas.others.find((x) => x.id === id);
      return o?.iso ? countryName(o.iso, cldr) : t('place.other');
    },
    city(id) {
      const c = atlas.city(id);
      const deck = c?.capital ? capitalName(c.country, locale as Lang) : undefined;
      return deck ?? named(id);
    },
    feature: named,
    sea: named,
    sub: (id) => content().subs[id] ?? id,
    region: (id) => t(`region.${id}`),
    place(p) {
      switch (p.t) {
        case 'country':
          return ui.country(p.id);
        case 'city':
          return ui.city(p.id);
        case 'feature':
          return ui.feature(p.id);
        case 'point':
          return ui.coord(p.at[0] / 100, p.at[1] / 100, 0);
      }
    },
    insight: (id) => content().insights[id],
    km: (km) => formatDistance(km, locale, unit()),
    area: (km2) => t(unit() === 'km' ? 'unit.km2' : 'unit.mi2', { n: formatArea(km2, locale, unit()) }),
    pop: (n) => formatPopulation(n, locale),
    density: (d) => t(unit() === 'km' ? 'unit.perKm2' : 'unit.perMi2', { n: formatDensity(d, locale, unit()) }),
    dur: (hours) => formatDuration(hours, locale),
    clock: (m) => formatClock(m, locale),
    utc: (m) => formatUtcOffset(m, locale),
    int: (n) => formatInt(n, locale),
    dec: (n, digits = 1) => formatDecimal(n, locale, digits),
    lat: (lat, digits = 1) => deg(lat, 'coord.n', 'coord.s', digits),
    lon: (lon, digits = 1) => deg(lon, 'coord.e', 'coord.w', digits),
    coord: (lon, lat, digits = 1) => t('coord.pair', { lat: ui.lat(lat, digits), lon: ui.lon(lon, digits) }),
    direction: (a, b, c, d, sectors = 16) => t(`dir.${compassWord(mapBearing(a, b, c, d), sectors)}`),
    distanceAndDirection(a, b, c, d, sectors = 16) {
      return t('feedback.offset', { km: ui.km(distanceKm(a, b, c, d)), dir: ui.direction(a, b, c, d, sectors) });
    },
    dateLine: (a, c) => (crossesDateLine(a, c) ? t('feedback.dateLine') : ''),
    heading: (tag, id, text) => h(tag, { id, tabindex: -1, class: 'ae-heading' }, text),
    bdi: (text, cls) => h('bdi', cls ? { class: cls } : {}, text)
  };
  return ui;
}
