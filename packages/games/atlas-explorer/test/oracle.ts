/**
 * Independent oracles for the tests (design § 21.1): facts read straight from the generated data (not through
 * `decodeAtlas`), and the answers and clue predicates re-implemented with different code from `src/compare.ts` and
 * `src/clues.ts`.
 */
import { decodeInts } from '../src/codec';
import { ATLAS_DATA } from '../src/data/atlas.gen';

const R = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;

export interface RawCountry {
  id: string;
  region: string;
  sub: string;
  tier: number;
  home: [number, number, number, number];
  pop: number;
  areaCore: number;
  areaMax: number;
  lines: number;
  coast: boolean;
  island: boolean;
  noRegion: boolean;
  nb: string[];
  ft: string[];
}

export const RAW_COUNTRIES: Map<string, RawCountry> = new Map(
  ATLAS_DATA.countries.map((c) => {
    const f = decodeInts(c.f);
    return [
      c.id,
      {
        id: c.id,
        region: c.region,
        sub: c.sub,
        tier: f[0]!,
        home: [f[3]! / 100, f[4]! / 100, f[5]! / 100, f[6]! / 100],
        pop: f[7]!,
        areaCore: f[9]!,
        areaMax: f[10]!,
        lines: f[11]!,
        coast: (f[12]! & 1) === 1,
        island: (f[12]! & 2) === 2,
        noRegion: (f[12]! & 4) === 4,
        nb: c.nb ? c.nb.split(' ') : [],
        ft: c.ft ? c.ft.split(' ') : []
      }
    ];
  })
);

export const RAW_CITIES = new Map(ATLAS_DATA.cities.map((c) => [c.id, { ...c, lat: c.lat / 100, lon: c.lon / 100 }]));
export const FEATURE_KIND = new Map<string, string>([...ATLAS_DATA.rivers.map((r) => [r.id, 'river'] as const), ...ATLAS_DATA.lakes.map((l) => [l.id, 'lake'] as const), ...ATLAS_DATA.regions.map((r) => [r.id, r.kind] as const)]);

/** Spherical law of cosines (km). */
export const cosineKm = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) =>
  R * Math.acos(Math.min(1, Math.max(-1, Math.sin(rad(a.lat)) * Math.sin(rad(b.lat)) + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon)))));

/** Day length (hours) as 24 h minus the night, from the hour angle of sunset seen from the night side. */
export function dayHours(lat: number, month: number): number {
  const decl = rad(month === 6 ? 23.44 : -23.44);
  const x = (Math.sin(rad(0.833)) + Math.sin(rad(lat)) * Math.sin(decl)) / (Math.cos(rad(lat)) * Math.cos(decl));
  if (x >= 1) return 24;
  if (x <= -1) return 0;
  return 24 - (Math.acos(x) * 24) / Math.PI;
}

/** Longitude east of `a` to `b` (degrees, −180…180) by modular arithmetic. */
export const eastOf = (a: number, b: number) => ((((b - a + 540) % 360) + 360) % 360) - 180;

/** The answer (option id) of a compare item, recomputed from raw data. */
export function compareOracle(template: string, places: readonly string[], param: number): string {
  const city = (id: string) => RAW_CITIES.get(id)!;
  const country = (id: string) => RAW_COUNTRIES.get(id)!;
  const [a, b, c] = places as [string, string, string];
  switch (template) {
    case 'north':
      return city(a).lat > city(b).lat ? a : b;
    case 'south':
      return city(a).lat < city(b).lat ? a : b;
    // East and west as read off the map (centred on 0°): the larger longitude is further east.
    case 'east':
      return city(b).lon > city(a).lon ? b : a;
    case 'west':
      return city(b).lon > city(a).lon ? a : b;
    case 'closer':
      return cosineKm(city(a), city(b)) < cosineKm(city(a), city(c)) ? b : c;
    case 'larger':
      return country(a).areaCore + country(a).areaMax > country(b).areaCore + country(b).areaMax ? a : b;
    case 'people':
      return country(a).pop > country(b).pop ? a : b;
    case 'density':
      return country(a).pop / country(a).areaCore > country(b).pop / country(b).areaCore ? a : b;
    case 'daylight':
      return dayHours(city(a).lat, param) > dayHours(city(b).lat, param) ? a : b;
    case 'midnight':
      return dayHours(city(a).lat, 6) < 24 ? 'yes' : 'no';
    case 'season':
      return city(a).lat > 0 ? 'summer' : 'winter';
    case 'tropics':
      return places.find((p) => Math.abs(city(p).lat) < 23.44)!;
    case 'suntime': {
      // 4 minutes of sun time per degree of longitude, rounded to whole hours.
      const minutes = eastOf(city(a).lon, city(b).lon) * 4;
      return `h${Math.round(minutes / 60)}`;
    }
    case 'clock':
      return `h${(city(b).tz - city(a).tz) / 60}`;
  }
  throw new Error(`unknown template ${template}`);
}

/**
 * Whether a clue is consistent with a country (i.e. does not rule it out), re-implemented on raw facts. Comparisons
 * rule out only countries on the wrong side of the reference; a capital clue never rules out a country whose capital
 * is not listed.
 */
export function clueAllows(c: RawCountry, id: string, arg: string): boolean {
  const ref = arg.includes(':') ? arg.slice(arg.indexOf(':') + 1) : '';
  const dir = arg.includes(':') ? arg.slice(0, arg.indexOf(':')) : '';
  if (id === 'region') return !c.noRegion && c.region === arg;
  if (id === 'sub') return !c.noRegion && c.sub === arg;
  if (id === 'ns') return arg === 'n' ? c.home[1] > 0 : arg === 's' ? c.home[3] < 0 : (c.lines & 1) === 1;
  if (id === 'ew') {
    if (arg === 'pm') return (c.lines & 32) === 32;
    const dateLine = c.home[0] < -170 && c.home[2] > 170;
    return !dateLine && (arg === 'e' ? c.home[0] > 0 : c.home[2] < 0);
  }
  if (id === 'line') return (c.lines & ({ cancer: 2, capricorn: 4, arctic: 8, antarctic: 16 } as Record<string, number>)[arg]!) !== 0;
  if (id === 'coast') return c.coast === (arg === 'yes');
  if (id === 'island') return c.island;
  if (id === 'nbCount') return c.nb.length === Number(arg);
  if (id === 'nb') return c.nb.includes(arg);
  if (id === 'area') {
    const r = RAW_COUNTRIES.get(ref)!;
    if (r.id === c.id) return false;
    return dir === 'gt' ? c.areaMax > r.areaCore : c.areaCore < r.areaMax;
  }
  if (id === 'people') {
    const r = RAW_COUNTRIES.get(ref)!;
    if (r.id === c.id) return false;
    return dir === 'gt' ? c.pop > r.pop : c.pop < r.pop;
  }
  if (id === 'river' || id === 'range' || id === 'desert') return c.ft.includes(arg);
  if (id === 'capital') {
    const r = RAW_CITIES.get(ref)!;
    if (r.country === c.id) return false;
    const cap = [...RAW_CITIES.values()].find((x) => x.capital && x.country === c.id);
    if (!cap) return true;
    return dir === 'n' ? cap.lat > r.lat : cap.lat < r.lat;
  }
  throw new Error(`unknown clue ${id}`);
}
