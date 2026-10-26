/**
 * "Compare places" templates (design § 7.2): pure question generators with fairness thresholds, so rounding, data
 * age or the definition of a border cannot flip an answer. Each template draws its places with the item's rng and
 * returns the question with its options (ids) in shown order and the index of the correct one, or null when no fair
 * question was found within the attempt budget.
 */
import type { Rng } from '@wp/game-core';
import { cityRegion, type Atlas, type City, type Country, type Region, type Tier } from './atlas';
import { dayLengthHours, distanceKm } from './geo';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Area = Region | 'world';

export const TEMPLATES = ['north', 'south', 'east', 'west', 'closer', 'larger', 'people', 'density', 'daylight', 'midnight', 'season', 'tropics', 'suntime', 'clock'] as const;
export type TemplateId = (typeof TEMPLATES)[number];

export interface CompareQuestion {
  readonly template: TemplateId;
  /** City or country ids the question names (1–3). */
  readonly places: string[];
  /** Template parameter: the month for daylight (6 or 12), 0 otherwise. */
  readonly param: number;
  /** Option ids in shown order: place ids, `yes`/`no`, `summer`/`winter`, or `h<hours>` (sun time, clock time). */
  readonly options: string[];
  readonly correct: number;
}

/** Template groups and their weights (design § 7.2, calibrate). */
export const TEMPLATE_GROUPS: readonly { readonly weight: number; readonly templates: readonly TemplateId[] }[] = [
  { weight: 3, templates: ['north', 'south', 'east', 'west'] },
  { weight: 2, templates: ['closer'] },
  { weight: 2, templates: ['larger', 'people', 'density'] },
  { weight: 3, templates: ['daylight', 'midnight', 'season', 'tropics', 'suntime', 'clock'] }
];

const ALLOWED: Readonly<Record<TemplateId, readonly Difficulty[]>> = {
  north: DIFFICULTIES,
  south: DIFFICULTIES,
  east: DIFFICULTIES,
  west: DIFFICULTIES,
  closer: DIFFICULTIES,
  larger: DIFFICULTIES,
  people: DIFFICULTIES,
  density: ['hard'],
  daylight: DIFFICULTIES,
  midnight: ['medium', 'hard'],
  season: ['easy', 'medium'],
  tropics: DIFFICULTIES,
  suntime: ['medium', 'hard'],
  clock: ['hard']
};
export const templateAllowed = (t: TemplateId, d: Difficulty): boolean => ALLOWED[t].includes(d);

const LEVEL: Readonly<Record<Difficulty, number>> = { easy: 0, medium: 1, hard: 2 };
/** Fairness thresholds per difficulty (easy, medium, hard). */
export const THRESHOLDS = {
  lat: [6, 3, 1],
  lon: [10, 5, 2],
  closer: [1.6, 1.3, 1.12],
  larger: [1.6, 1.3, 1.3],
  people: [2, 1.5, 1.5],
  density: [2, 2, 2],
  daylightHours: [3, 1.5, 0.75]
} as const;
export const threshold = (key: keyof typeof THRESHOLDS, d: Difficulty): number => THRESHOLDS[key][LEVEL[d]]!;

export const maxTier = (d: Difficulty): Tier => (d === 'easy' ? 1 : d === 'medium' ? 2 : 3);

const ATTEMPTS = 200;

/** Cities of the area up to the tier; all cities of the area when that leaves fewer than `min`. */
export function cityPool(atlas: Atlas, area: Area, d: Difficulty, min = 6): City[] {
  const inArea = atlas.cities.filter((c) => !atlas.retired.has(c.id) && (area === 'world' || cityRegion(atlas, c) === area));
  const tiered = inArea.filter((c) => c.tier <= maxTier(d));
  return tiered.length >= min ? tiered : inArea;
}

/** UN members of the area up to the tier; all of the area when that leaves fewer than `min`. */
export function countryPool(atlas: Atlas, area: Area, d: Difficulty, min = 6): Country[] {
  const inArea = atlas.countries.filter((c) => !atlas.retired.has(c.id) && (area === 'world' || c.region === area));
  const tiered = inArea.filter((c) => c.tier <= maxTier(d));
  return tiered.length >= min ? tiered : inArea;
}

/** Longitude difference b − a normalised to (−180, 180]. */
export const lonDelta = (a: number, b: number): number => {
  let d = (((b - a) % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
};

const two = <T>(rng: Rng, pool: readonly T[]): [T, T] | null => {
  if (pool.length < 2) return null;
  const a = rng.pick(pool);
  let b = rng.pick(pool);
  for (let i = 0; i < 8 && b === a; i++) b = rng.pick(pool);
  return a === b ? null : [a, b];
};

/** Hour options around the correct one: ±1, ±2 and the opposite sign, within ±11 h, three distractors. */
function hourOptions(rng: Rng, correct: number, extra: readonly number[] = []): { options: string[]; correct: number } | null {
  const pool = [...extra, correct + 1, correct - 1, correct + 2, correct - 2, -correct].filter((h, i, all) => h !== correct && Math.abs(h) <= 11 && all.indexOf(h) === i);
  if (pool.length < 3) return null;
  const picked = [correct, ...rng.shuffle(pool).slice(0, 3)];
  const shown = rng.shuffle(picked);
  return { options: shown.map((h) => `h${h}`), correct: shown.indexOf(correct) };
}

/** Builds a two-option question from two places, the correct one first; the order is shuffled. */
function pair(rng: Rng, template: TemplateId, places: string[], right: string, wrong: string, param = 0): CompareQuestion {
  const options = rng.shuffle([right, wrong]);
  return { template, places, param, options, correct: options.indexOf(right) };
}

export interface DrawContext {
  readonly atlas: Atlas;
  readonly area: Area;
  readonly difficulty: Difficulty;
  /** Curated insight pair to try first (city ids), if any. */
  readonly insight?: readonly string[] | undefined;
}

/** Draws one fair question of a template, or null (design § 7.2). */
export function drawTemplate(rng: Rng, template: TemplateId, ctx: DrawContext): CompareQuestion | null {
  const { atlas, area, difficulty: d } = ctx;
  if (!templateAllowed(template, d)) return null;
  const cities = cityPool(atlas, area, d);
  const countries = countryPool(atlas, area, d);
  const fromInsight = (n: number): City[] | null => {
    if (!ctx.insight || ctx.insight.length !== n) return null;
    const cs = ctx.insight.map((id) => atlas.city(id));
    if (cs.some((c) => !c || (area !== 'world' && cityRegion(atlas, c) !== area))) return null;
    return cs as City[];
  };
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const curated = attempt === 0 ? fromInsight(template === 'closer' ? 3 : 2) : null;
    switch (template) {
      case 'north':
      case 'south': {
        const p = curated ?? two(rng, cities);
        if (!p) return null;
        const [a, b] = p as [City, City];
        if (Math.abs(a.lat - b.lat) < threshold('lat', d)) continue;
        const northern = a.lat > b.lat ? a : b;
        const southern = northern === a ? b : a;
        return template === 'north' ? pair(rng, template, [a.id, b.id], northern.id, southern.id) : pair(rng, template, [a.id, b.id], southern.id, northern.id);
      }
      case 'east':
      case 'west': {
        const p = curated ?? two(rng, cities);
        if (!p) return null;
        const [a, b] = p as [City, City];
        // The plain longitude difference, as read off the map (centred on 0°): pairs more than 150° apart are left out,
        // so the shorter way round never crosses the date line (New Delhi and Honolulu would otherwise make Honolulu
        // "further east", the opposite of the map).
        const dl = b.lon - a.lon; // > 0: b is east of a
        if (Math.abs(dl) > 150 || Math.abs(dl) < threshold('lon', d)) continue;
        const eastern = dl > 0 ? b : a;
        const western = eastern === a ? b : a;
        return template === 'east' ? pair(rng, template, [a.id, b.id], eastern.id, western.id) : pair(rng, template, [a.id, b.id], western.id, eastern.id);
      }
      case 'closer': {
        let trio = curated;
        if (!trio) {
          if (cities.length < 3) return null;
          const s = rng.shuffle(cities).slice(0, 3);
          trio = s;
        }
        const [a, b, c] = trio as [City, City, City];
        const db = distanceKm(a.lon, a.lat, b.lon, b.lat);
        const dc = distanceKm(a.lon, a.lat, c.lon, c.lat);
        if (Math.max(db, dc) / Math.max(1, Math.min(db, dc)) < threshold('closer', d)) continue;
        return pair(rng, template, [a.id, b.id, c.id], db < dc ? b.id : c.id, db < dc ? c.id : b.id);
      }
      case 'larger': {
        const p = two(rng, countries);
        if (!p) return null;
        const [a, b] = p;
        const r = threshold('larger', d);
        // The larger one must win by the ratio even against the other's largest variant (design § 7.2).
        const big = a.areaCore >= r * b.areaMax ? a : b.areaCore >= r * a.areaMax ? b : null;
        if (!big) continue;
        return pair(rng, template, [a.id, b.id], big.id, big === a ? b.id : a.id);
      }
      case 'people': {
        const p = two(rng, countries);
        if (!p) return null;
        const [a, b] = p;
        const r = threshold('people', d);
        const more = a.pop >= r * b.pop ? a : b.pop >= r * a.pop ? b : null;
        if (!more) continue;
        return pair(rng, template, [a.id, b.id], more.id, more === a ? b.id : a.id);
      }
      case 'density': {
        const p = two(rng, countries);
        if (!p) return null;
        const [a, b] = p;
        const r = threshold('density', d);
        // Denser by the ratio with every area variant: the smallest density of one against the largest of the other.
        const minDensity = (c: Country) => c.pop / Math.max(1, c.areaMax);
        const maxDensity = (c: Country) => c.pop / Math.max(1, c.areaCore);
        const denser = minDensity(a) >= r * maxDensity(b) ? a : minDensity(b) >= r * maxDensity(a) ? b : null;
        if (!denser) continue;
        return pair(rng, template, [a.id, b.id], denser.id, denser === a ? b.id : a.id);
      }
      case 'daylight': {
        const p = two(rng, cities);
        if (!p) return null;
        const [a, b] = p;
        const month = rng.next() < 0.5 ? 6 : 12;
        const ha = dayLengthHours(a.lat, month);
        const hb = dayLengthHours(b.lat, month);
        if (Math.abs(ha - hb) < threshold('daylightHours', d)) continue;
        return pair(rng, template, [a.id, b.id], ha > hb ? a.id : b.id, ha > hb ? b.id : a.id, month);
      }
      case 'midnight': {
        // Choose the answer first, so both answers occur; cities stay clear of the refraction margin (≤ 64° or ≥ 68°).
        // Arctic cities are few, so they are taken from every tier of the area.
        const noSet = atlas.cities.filter((c) => c.lat >= 68 && (area === 'world' || cityRegion(atlas, c) === area));
        const yesSet = cities.filter((c) => Math.abs(c.lat) <= 64);
        if (!noSet.length || !yesSet.length) return null;
        const polar = rng.next() < 0.5;
        const c = rng.pick(polar ? noSet : yesSet);
        const options = ['yes', 'no'];
        return { template, places: [c.id], param: 6, options, correct: polar ? 1 : 0 };
      }
      case 'season': {
        const north = cities.filter((c) => c.lat >= 30);
        const south = cities.filter((c) => c.lat <= -30);
        if (!north.length || !south.length) return null;
        const southern = rng.next() < 0.5;
        const c = rng.pick(southern ? south : north);
        const options = ['summer', 'winter'];
        return { template, places: [c.id], param: 7, options, correct: southern ? 1 : 0 };
      }
      case 'tropics': {
        const tropical = cities.filter((c) => Math.abs(c.lat) <= 21.4);
        const outside = cities.filter((c) => Math.abs(c.lat) >= 25.4);
        if (!tropical.length || outside.length < 2) return null;
        const t = rng.pick(tropical);
        const others = rng.shuffle(outside).slice(0, 2);
        const options = rng.shuffle([t.id, ...others.map((c) => c.id)]);
        return { template, places: [...options], param: 0, options, correct: options.indexOf(t.id) };
      }
      case 'suntime': {
        const p = two(rng, cities);
        if (!p) return null;
        const [a, b] = p;
        const h = lonDelta(a.lon, b.lon) / 15;
        const whole = Math.round(h);
        if (Math.abs(lonDelta(a.lon, b.lon)) < 30 || Math.abs(h - whole) > 0.3 || Math.abs(whole) > 11) continue;
        const o = hourOptions(rng, whole);
        if (!o) continue;
        return { template, places: [a.id, b.id], param: 0, ...o };
      }
      case 'clock': {
        const p = two(rng, cities);
        if (!p) return null;
        const [a, b] = p;
        const diff = (b.tz - a.tz) / 60;
        if (diff === 0 || !Number.isInteger(diff) || Math.abs(diff) > 11) continue;
        const sun = Math.round(lonDelta(a.lon, b.lon) / 15);
        const o = hourOptions(rng, diff, sun !== diff && Math.abs(sun) <= 11 ? [sun] : []);
        if (!o) continue;
        return { template, places: [a.id, b.id], param: 0, ...o };
      }
    }
  }
  return null;
}

/** The answer of a question recomputed from the atlas (used by the review; the item stores `correct`). */
export function answerOf(q: CompareQuestion): string | undefined {
  return q.options[q.correct];
}

/** Template group of a template (for the "at most twice per round" rule and weights). */
export const groupOf = (t: TemplateId): number => TEMPLATE_GROUPS.findIndex((g) => g.templates.includes(t));
