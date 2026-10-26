/**
 * The decoded atlas (design § 11.3) and its pure queries: what lies under a point, distances to places, neighbours.
 * `decodeAtlas` runs once per page (a few milliseconds); rules functions take the `Atlas` as a parameter, so tests
 * can import the generated module directly.
 */
import { decodeInts } from './codec';
import type { AtlasData } from './data/types';
import { bbox, boundaryDistanceKm, distanceKm, pointInRings, type Flat } from './geo';

export const REGIONS = ['africa', 'americas', 'asia', 'europe', 'oceania'] as const;
export type Region = (typeof REGIONS)[number];
export type Tier = 1 | 2 | 3;
export type Box = readonly [minLon: number, minLat: number, maxLon: number, maxLat: number];

/** Bits of `Country.lines`. */
export const LINES = { equator: 1, cancer: 2, capricorn: 4, arctic: 8, antarctic: 16, meridian: 32 } as const;

export interface Shape {
  /** Closed rings, flat `[lon, lat, …]` in degrees. */
  readonly rings: readonly Float64Array[];
  readonly box: Box;
}

export interface Country extends Shape {
  readonly id: string;
  readonly tier: Tier;
  readonly region: Region;
  readonly sub: string;
  /** Natural Earth's label point ("centre"), degrees. */
  readonly label: readonly [number, number];
  /** Extent of the home territory outside hatched areas, degrees. */
  readonly home: Box;
  readonly pop: number;
  readonly popYear: number;
  /** Areas (km²) without / with the hatched areas touching the country (design § 12.3). */
  readonly areaCore: number;
  readonly areaMax: number;
  readonly lines: number;
  readonly coast: boolean;
  readonly island: boolean;
  /** No region clue (transcontinental, design § 8.2). */
  readonly noRegion: boolean;
  /** The region clue says "lies mostly in". */
  readonly mostly: boolean;
  readonly nb: readonly string[];
  /** Rivers and physical regions in its home territory. */
  readonly features: readonly string[];
  /** Hatched areas touching it. */
  readonly touching: readonly string[];
}

export interface Other extends Shape {
  readonly id: string;
  /** ISO code for a CLDR name, or ''. */
  readonly iso: string;
  readonly label: readonly [number, number];
}

export interface Disputed extends Shape {
  readonly id: string;
}

export const FEATURE_KINDS = ['river', 'lake', 'range', 'desert', 'plateau', 'basin'] as const;
export type FeatureKind = (typeof FEATURE_KINDS)[number];

export interface Feature extends Shape {
  readonly id: string;
  readonly kind: FeatureKind;
  readonly tier: Tier;
  /** Lines (rivers) instead of rings. */
  readonly lines: readonly Float64Array[];
  readonly label: readonly [number, number];
  /** km² for areas, km for rivers. */
  readonly size: number;
}

export interface City {
  readonly id: string;
  readonly country: string;
  readonly capital: boolean;
  readonly tier: Tier;
  readonly lon: number;
  readonly lat: number;
  /** Standard UTC offset (minutes, no daylight saving). */
  readonly tz: number;
}

export interface Sea {
  readonly id: string;
  readonly at: readonly (readonly [number, number])[];
}

export interface Atlas {
  readonly id: string;
  readonly countries: readonly Country[];
  readonly others: readonly Other[];
  readonly disputed: readonly Disputed[];
  readonly features: readonly Feature[];
  readonly cities: readonly City[];
  readonly seas: readonly Sea[];
  readonly pairs: Readonly<Record<string, readonly (readonly string[])[]>>;
  readonly retired: ReadonlySet<string>;
  country(id: string): Country | undefined;
  feature(id: string): Feature | undefined;
  city(id: string): City | undefined;
}

const toTier = (n: number): Tier => (n === 1 || n === 2 ? n : 3);
const pt = (a: readonly number[]): [number, number] => [a[0]! / 100, a[1]! / 100];
const words = (s: string) => (s ? s.split(' ') : []);

/** Decodes the arcs string into flat integer arrays. */
function decodeArcs(text: string): Int32Array[] {
  const v = decodeInts(text);
  const arcs: Int32Array[] = [];
  let k = 1;
  let x0 = 0;
  let y0 = 0;
  for (let a = 0; a < v[0]!; a++) {
    const n = v[k++]!;
    const arc = new Int32Array(2 * n);
    x0 += v[k++]!;
    y0 += v[k++]!;
    arc[0] = x0;
    arc[1] = y0;
    for (let i = 1; i < n; i++) {
      arc[2 * i] = arc[2 * i - 2]! + v[k++]!;
      arc[2 * i + 1] = arc[2 * i - 1]! + v[k++]!;
    }
    arcs.push(arc);
  }
  return arcs;
}

/** Assembles rings (arc references, delta-encoded) into flat degree arrays. */
function decodeRings(text: string, arcs: readonly Int32Array[], unit: number): Float64Array[] {
  const v = decodeInts(text);
  const rings: Float64Array[] = [];
  let k = 1;
  for (let r = 0; r < v[0]!; r++) {
    const count = v[k++]!;
    const pts: number[] = [];
    let prev = 0;
    for (let a = 0; a < count; a++) {
      const signed = prev + v[k++]!;
      prev = signed;
      const arc = arcs[signed < 0 ? -signed - 1 : signed]!;
      const n = arc.length / 2;
      for (let i = pts.length ? 1 : 0; i < n; i++) {
        const j = signed < 0 ? n - 1 - i : i;
        pts.push(arc[2 * j]! / unit, arc[2 * j + 1]! / unit);
      }
    }
    rings.push(Float64Array.from(pts));
  }
  return rings;
}

/** Decodes standalone paths (lakes, rivers, regions). */
function decodePaths(text: string, unit: number): Float64Array[] {
  const v = decodeInts(text);
  const out: Float64Array[] = [];
  let k = 1;
  for (let p = 0; p < v[0]!; p++) {
    const n = v[k++]!;
    const a = new Float64Array(2 * n);
    let x = v[k++]!;
    let y = v[k++]!;
    a[0] = x / unit;
    a[1] = y / unit;
    for (let i = 1; i < n; i++) {
      x += v[k++]!;
      y += v[k++]!;
      a[2 * i] = x / unit;
      a[2 * i + 1] = y / unit;
    }
    out.push(a);
  }
  return out;
}

const boxOf = (parts: readonly Flat[]): Box => (parts.length ? bbox(parts) : [0, 0, 0, 0]);

/** Decodes the generated data (pure; the result is cached by `src/data/index.ts`). */
export function decodeAtlas(data: AtlasData): Atlas {
  const arcs = decodeArcs(data.arcs);
  const unit = data.unit;
  const countries: Country[] = data.countries.map((c) => {
    const f = decodeInts(c.f);
    const rings = decodeRings(c.rings, arcs, unit);
    const flags = f[12]!;
    return {
      id: c.id,
      tier: toTier(f[0]!),
      region: (REGIONS as readonly string[]).includes(c.region) ? (c.region as Region) : 'africa',
      sub: c.sub,
      label: pt([f[1]!, f[2]!]),
      home: [f[3]! / 100, f[4]! / 100, f[5]! / 100, f[6]! / 100],
      pop: f[7]!,
      popYear: f[8]!,
      areaCore: f[9]!,
      areaMax: f[10]!,
      lines: f[11]!,
      coast: (flags & 1) !== 0,
      island: (flags & 2) !== 0,
      noRegion: (flags & 4) !== 0,
      mostly: (flags & 8) !== 0,
      nb: words(c.nb),
      features: words(c.ft),
      touching: words(c.dz),
      rings,
      box: boxOf(rings)
    };
  });
  const others: Other[] = data.others.map((o) => {
    const rings = decodeRings(o.rings, arcs, unit);
    return { id: o.id, iso: o.iso, label: pt(o.label), rings, box: boxOf(rings) };
  });
  const disputed: Disputed[] = data.disputed.map((d) => {
    const rings = decodeRings(d.rings, arcs, unit);
    return { id: d.id, rings, box: boxOf(rings) };
  });
  const features: Feature[] = [
    ...data.rivers.map((r) => {
      const lines = decodePaths(r.lines, unit);
      return { id: r.id, kind: 'river' as const, tier: toTier(r.tier), rings: [], lines, box: boxOf(lines), label: pt(r.label), size: r.km };
    }),
    ...data.lakes.map((l) => {
      const rings = decodePaths(l.rings, unit);
      return { id: l.id, kind: 'lake' as const, tier: toTier(l.tier), rings, lines: [], box: boxOf(rings), label: pt(l.label), size: l.area };
    }),
    ...data.regions.map((r) => {
      const rings = decodePaths(r.rings, unit);
      const kind = (FEATURE_KINDS as readonly string[]).includes(r.kind) ? (r.kind as FeatureKind) : 'range';
      return { id: r.id, kind, tier: toTier(r.tier), rings, lines: [], box: boxOf(rings), label: pt(r.label), size: r.area };
    })
  ];
  const cities: City[] = data.cities.map((c) => ({ id: c.id, country: c.country, capital: c.capital === true, tier: toTier(c.tier), lon: c.lon / 100, lat: c.lat / 100, tz: c.tz }));
  const byCountry = new Map(countries.map((c) => [c.id, c]));
  const byFeature = new Map(features.map((f) => [f.id, f]));
  const byCity = new Map(cities.map((c) => [c.id, c]));
  return {
    id: data.id,
    countries,
    others,
    disputed,
    features,
    cities,
    seas: data.seas.map((s) => ({ id: s.id, at: s.at.map(pt) })),
    pairs: data.pairs,
    retired: new Set(data.retired),
    country: (id) => byCountry.get(id),
    feature: (id) => byFeature.get(id),
    city: (id) => byCity.get(id)
  };
}

/* ---------- Queries ---------- */

const inBox = (b: Box, lon: number, lat: number, pad = 0) => lon >= b[0] - pad && lon <= b[2] + pad && lat >= b[1] - pad && lat <= b[3] + pad;

/** Whether a point lies inside a shape (bounding-box prefilter, then even–odd). */
export const inside = (s: Shape, lon: number, lat: number): boolean => inBox(s.box, lon, lat) && pointInRings(lon, lat, s.rings);

/** What lies under a point: a hatched area first (it belongs to no country), then a UN member, another entity, or the sea. */
export type PlaceAt = { readonly kind: 'disputed'; readonly id: string } | { readonly kind: 'country'; readonly id: string } | { readonly kind: 'other'; readonly id: string } | null;

export function placeAt(atlas: Atlas, lon: number, lat: number): PlaceAt {
  for (const d of atlas.disputed) if (inside(d, lon, lat)) return { kind: 'disputed', id: d.id };
  for (const c of atlas.countries) if (inside(c, lon, lat)) return { kind: 'country', id: c.id };
  for (const o of atlas.others) if (inside(o, lon, lat)) return { kind: 'other', id: o.id };
  return null;
}

/** The UN member under a point (never inside a hatched area), or null. */
export function countryAt(atlas: Atlas, lon: number, lat: number): string | null {
  const p = placeAt(atlas, lon, lat);
  return p?.kind === 'country' ? p.id : null;
}

/** Tolerance (km) added to every polygon test: covers the simplification error (design § 6.2). */
export const TOLERANCE_KM = 25;
/** A river counts as found within this distance of its line (km). */
export const RIVER_KM = 30;

/**
 * Distance (km) from a point to a country, for scoring: 0 inside it, inside a hatched area touching it, or within
 * the tolerance; else the distance to its boundary.
 */
export function countryDistanceKm(atlas: Atlas, c: Country, lon: number, lat: number): number {
  if (inside(c, lon, lat)) return 0;
  for (const id of c.touching) {
    const d = atlas.disputed.find((x) => x.id === id);
    if (d && inside(d, lon, lat)) return 0;
  }
  const km = boundaryDistanceKm(lon, lat, c.rings);
  return km <= TOLERANCE_KM ? 0 : km;
}

/** Distance (km) from a point to a feature: 0 inside (or near a river), else to its outline or line. */
export function featureDistanceKm(f: Feature, lon: number, lat: number): number {
  if (f.kind === 'river') {
    const km = boundaryDistanceKm(lon, lat, f.lines);
    return km <= RIVER_KM ? 0 : km;
  }
  if (inside(f, lon, lat)) return 0;
  const km = boundaryDistanceKm(lon, lat, f.rings);
  return km <= TOLERANCE_KM ? 0 : km;
}

/** The point used for directions to a place ("centre"): label point, city position or feature label. */
export const cityDistanceKm = (c: City, lon: number, lat: number): number => distanceKm(lon, lat, c.lon, c.lat);

/** Countries of a region (or all), optionally up to a tier. */
export function countriesOf(atlas: Atlas, region: Region | 'world', maxTier: Tier = 3): Country[] {
  return atlas.countries.filter((c) => (region === 'world' || c.region === region) && c.tier <= maxTier);
}

/** The region of a city (its country's). */
export const cityRegion = (atlas: Atlas, c: City): Region | null => atlas.country(c.country)?.region ?? null;

/** Nearest curated city to a point, optionally skipping some (e.g. the target and its country's cities). */
export function nearestCity(atlas: Atlas, lon: number, lat: number, skip: (c: City) => boolean = () => false): { city: City; km: number } | null {
  let best: { city: City; km: number } | null = null;
  for (const c of atlas.cities) {
    if (skip(c)) continue;
    const km = distanceKm(lon, lat, c.lon, c.lat);
    if (!best || km < best.km) best = { city: c, km };
  }
  return best;
}
