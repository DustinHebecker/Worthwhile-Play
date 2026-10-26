/**
 * "Mystery country" clues (design § 8.2–8.3): the catalogue, the strict truth test for the target, the fair
 * elimination test for candidates (a candidate is ruled out only when the clue is clearly false for it), and the
 * greedy clue order. Pure; facts come from the atlas (computed at full resolution by the data script). No clue ever
 * mentions a hatched area or a non-UN entity.
 */
import type { Rng } from '@wp/game-core';
import { LINES, type Atlas, type City, type Country } from './atlas';
import { countryPool, type Area, type Difficulty } from './compare';

export const CLUE_IDS = ['region', 'sub', 'ns', 'ew', 'line', 'coast', 'island', 'nbCount', 'nb', 'area', 'people', 'river', 'range', 'desert', 'capital'] as const;
export type ClueId = (typeof CLUE_IDS)[number];

export interface Clue {
  readonly id: ClueId;
  /** The clue's value: a region or sub-region id, `n`/`s`/`eq`, `e`/`w`/`pm`, a line, `yes`/`no`, a count, a country,
   *  feature or `gt:`/`lt:` reference, `n:`/`s:` + city id, or '' (island). */
  readonly arg: string;
}

/** Clues in the order players meet them: broad first (design § 8.3). */
const STAGES: readonly (readonly ClueId[])[] = [
  ['region', 'ns', 'ew', 'coast', 'island'],
  ['sub', 'line', 'nbCount', 'area', 'people'],
  ['nb', 'river', 'range', 'desert', 'capital']
];
const stageOf = (id: ClueId) => STAGES.findIndex((s) => s.includes(id));

export const AREA_RATIO = 1.3;
export const PEOPLE_RATIO = 1.5;
export const CAPITAL_DLAT = 1;

const LINE_ARGS = { cancer: LINES.cancer, capricorn: LINES.capricorn, arctic: LINES.arctic, antarctic: LINES.antarctic } as const;
type LineArg = keyof typeof LINE_ARGS;

/** Whether a country's home territory crosses the antimeridian (east/west clues are then not defined). */
const acrossDateLine = (c: Country) => c.home[0] < -170 && c.home[2] > 170;

/** The curated capital of a country, if any. */
export const capitalOf = (atlas: Atlas, id: string): City | undefined => atlas.cities.find((c) => c.capital && c.country === id);

const RANGE_KINDS = ['range', 'plateau', 'basin'];

/**
 * Countries a river also flows through or along that its facts do not list: the map's river lines (Natural Earth
 * 1:50m) miss part of some courses (the Blue Nile, the Mekong and Brahmaputra in China, the upper Euphrates and
 * Tigris), border reaches count for neither side, and the Indus in Ladakh lies in a hatched area. A river clue never
 * rules these countries out, so the mystery never relies on a fact a player can rightly dispute.
 */
export const RIVER_ALSO: Readonly<Record<string, readonly string[]>> = {
  nile: ['ET', 'RW', 'BI', 'TZ', 'KE', 'CD'],
  amazon: ['CO'],
  danube: ['HR', 'UA', 'MD'],
  rhine: ['FR', 'AT', 'LI'],
  indus: ['CN', 'IN'],
  brahmaputra: ['CN'],
  mekong: ['CN', 'MM'],
  congo: ['AO'],
  euphrates: ['TR', 'SY'],
  tigris: ['TR', 'SY']
};

/** Whether a clue is clearly true for a country (the target must satisfy this). */
export function clueTrue(atlas: Atlas, c: Country, clue: Clue): boolean {
  const { id, arg } = clue;
  switch (id) {
    case 'region':
      return !c.noRegion && c.region === arg;
    case 'sub':
      return !c.noRegion && c.sub === arg;
    case 'ns':
      return arg === 'n' ? c.home[1] > 0 : arg === 's' ? c.home[3] < 0 : arg === 'eq' && (c.lines & LINES.equator) !== 0;
    case 'ew':
      return arg === 'pm' ? (c.lines & LINES.meridian) !== 0 : !acrossDateLine(c) && (arg === 'e' ? c.home[0] > 0 : arg === 'w' && c.home[2] < 0);
    case 'line':
      return Object.hasOwn(LINE_ARGS, arg) && (c.lines & LINE_ARGS[arg as LineArg]) !== 0;
    case 'coast':
      return c.coast === (arg === 'yes');
    case 'island':
      return c.island;
    case 'nbCount':
      return /^\d+$/.test(arg) && c.nb.length === Number(arg);
    case 'nb':
      return c.nb.includes(arg);
    case 'area':
    case 'people': {
      const [dir, ref] = arg.split(':');
      const r = atlas.country(ref ?? '');
      if (!r || r.id === c.id) return false;
      if (id === 'area') return dir === 'gt' ? c.areaCore >= AREA_RATIO * r.areaMax : dir === 'lt' && r.areaCore >= AREA_RATIO * c.areaMax;
      return dir === 'gt' ? c.pop >= PEOPLE_RATIO * r.pop : dir === 'lt' && r.pop >= PEOPLE_RATIO * c.pop;
    }
    case 'river':
    case 'range':
    case 'desert': {
      const f = atlas.feature(arg);
      if (!f || !c.features.includes(arg)) return false;
      return id === 'river' ? f.kind === 'river' : id === 'desert' ? f.kind === 'desert' : RANGE_KINDS.includes(f.kind);
    }
    case 'capital': {
      const [dir, ref] = arg.split(':');
      const cap = capitalOf(atlas, c.id);
      const r = atlas.city(ref ?? '');
      if (!cap || !r || r.country === c.id) return false;
      return dir === 'n' ? cap.lat >= r.lat + CAPITAL_DLAT : dir === 's' && cap.lat <= r.lat - CAPITAL_DLAT;
    }
  }
}

/**
 * Whether a clue rules a candidate out: clearly false for it. Comparisons with a margin only rule out candidates on
 * the wrong side of the reference itself (a country "a little larger than France" stays a candidate for "larger than
 * France"), and a capital clue cannot rule out a country whose capital is not in the atlas.
 */
export function clueExcludes(atlas: Atlas, c: Country, clue: Clue): boolean {
  const { id, arg } = clue;
  if (id === 'area' || id === 'people') {
    const [dir, ref] = arg.split(':');
    const r = atlas.country(ref ?? '');
    if (!r) return false;
    if (r.id === c.id) return true;
    if (id === 'area') return dir === 'gt' ? c.areaMax <= r.areaCore : c.areaCore >= r.areaMax;
    return dir === 'gt' ? c.pop <= r.pop : c.pop >= r.pop;
  }
  if (id === 'capital') {
    const [dir, ref] = arg.split(':');
    const cap = capitalOf(atlas, c.id);
    const r = atlas.city(ref ?? '');
    if (!r) return false;
    if (r.country === c.id) return true;
    if (!cap) return false;
    return dir === 'n' ? cap.lat <= r.lat : cap.lat >= r.lat;
  }
  if (id === 'river' && RIVER_ALSO[arg]?.includes(c.id)) return false;
  return !clueTrue(atlas, c, clue);
}

/** Candidates (UN members) left after some clues. */
export function candidatesAfter(atlas: Atlas, clues: readonly Clue[]): Country[] {
  return atlas.countries.filter((c) => !clues.some((k) => clueExcludes(atlas, c, k)));
}

/** Every true clue of a target, with its concrete parameters (design § 8.3 step 2). */
export function trueClues(rng: Rng, atlas: Atlas, t: Country): Clue[] {
  const out: Clue[] = [];
  const add = (id: ClueId, arg: string) => {
    const k = { id, arg };
    if (clueTrue(atlas, t, k)) out.push(k);
  };
  add('region', t.region);
  add('sub', t.sub);
  for (const a of ['n', 's', 'eq']) add('ns', a);
  for (const a of ['e', 'w', 'pm']) add('ew', a);
  for (const a of Object.keys(LINE_ARGS)) add('line', a);
  add('coast', t.coast ? 'yes' : 'no');
  add('island', '');
  add('nbCount', String(t.nb.length));
  for (const n of t.nb) add('nb', n);
  const refs = rng.shuffle(atlas.countries.filter((c) => c.tier === 1 && c.id !== t.id));
  // A few comparison references (well-known countries), each clue clearly true for the target.
  for (const id of ['area', 'people'] as const) {
    let n = 0;
    for (const r of refs)
      for (const dir of ['gt', 'lt']) {
        const k = { id, arg: `${dir}:${r.id}` };
        if (n < 4 && clueTrue(atlas, t, k)) {
          out.push(k);
          n++;
        }
      }
  }
  for (const f of t.features) {
    // A retired feature (e.g. the St. Lawrence, of which the data has only 106 km) is never a clue.
    if (atlas.retired.has(f)) continue;
    const kind = atlas.feature(f)?.kind;
    add(kind === 'river' ? 'river' : kind === 'desert' ? 'desert' : 'range', f);
  }
  if (capitalOf(atlas, t.id)) {
    const cities = rng.shuffle(atlas.cities.filter((c) => c.tier === 1 && c.country !== t.id)).slice(0, 12);
    let n = 0;
    for (const r of cities)
      for (const dir of ['n', 's'])
        if (n < 3 && clueTrue(atlas, t, { id: 'capital', arg: `${dir}:${r.id}` })) {
          out.push({ id: 'capital', arg: `${dir}:${r.id}` });
          n++;
        }
  }
  return out;
}

export interface ClueLimits {
  readonly min: number;
  readonly max: number;
  /** Candidates the first clue must leave. */
  readonly firstLeaves: number;
}

export const clueLimits = (d: Difficulty): ClueLimits => (d === 'easy' ? { min: 3, max: 5, firstLeaves: 6 } : { min: 4, max: 7, firstLeaves: 12 });

/**
 * Orders clues greedily (design § 8.3 step 3): each clue removes at least one candidate, broad clues first, the
 * first clue leaves enough candidates, and the clues end with exactly the target. Null when this attempt fails.
 */
export function orderClues(rng: Rng, atlas: Atlas, t: Country, clues: readonly Clue[], limits: ClueLimits): Clue[] | null {
  let cands: Country[] = [...atlas.countries];
  const chosen: Clue[] = [];
  const used = new Set<number>();
  while (cands.length > 1 && chosen.length < limits.max) {
    let picked: { i: number; left: Country[] } | null = null;
    for (let stage = 0; stage < STAGES.length && !picked; stage++) {
      const options: { i: number; left: Country[] }[] = [];
      clues.forEach((k, i) => {
        if (used.has(i) || stageOf(k.id) > stage) return;
        const left = cands.filter((c) => !clueExcludes(atlas, c, k));
        if (left.length === cands.length) return;
        if (chosen.length === 0 && left.length < limits.firstLeaves) return;
        // Ending before the minimum would make the item too short.
        if (left.length === 1 && chosen.length + 1 < limits.min) return;
        options.push({ i, left });
      });
      if (options.length) picked = rng.pick(options);
    }
    if (!picked) return null;
    used.add(picked.i);
    chosen.push(clues[picked.i]!);
    cands = picked.left;
  }
  return cands.length === 1 && cands[0]!.id === t.id && chosen.length >= limits.min ? chosen : null;
}

export interface MysteryDraw {
  readonly target: string;
  readonly clues: Clue[];
}

/** Draws a target and its clues (≤ 50 targets, a few orders each); null only if every attempt failed. */
export function drawMystery(rng: Rng, atlas: Atlas, area: Area, d: Difficulty, used: ReadonlySet<string>): MysteryDraw | null {
  const pool = countryPool(atlas, area, d).filter((c) => !used.has(`country:${c.id}`));
  if (!pool.length) return null;
  const limits = clueLimits(d);
  for (let attempt = 0; attempt < 50; attempt++) {
    const t = rng.pick(pool);
    const all = trueClues(rng, atlas, t);
    for (let k = 0; k < 6; k++) {
      const order = orderClues(rng, atlas, t, all, limits);
      if (order) return { target: t.id, clues: order };
    }
  }
  return null;
}

/** Whether a clue is well-formed for the atlas (ids exist, values known): for `isValidState`. */
export function clueKnown(atlas: Atlas, clue: unknown): clue is Clue {
  if (typeof clue !== 'object' || clue === null) return false;
  const { id, arg } = clue as { id?: unknown; arg?: unknown };
  if (typeof id !== 'string' || typeof arg !== 'string' || !(CLUE_IDS as readonly string[]).includes(id)) return false;
  switch (id as ClueId) {
    case 'region':
      return atlas.countries.some((c) => c.region === arg);
    case 'sub':
      return atlas.countries.some((c) => c.sub === arg);
    case 'ns':
      return ['n', 's', 'eq'].includes(arg);
    case 'ew':
      return ['e', 'w', 'pm'].includes(arg);
    case 'line':
      return Object.hasOwn(LINE_ARGS, arg);
    case 'coast':
      return arg === 'yes' || arg === 'no';
    case 'island':
      return arg === '';
    case 'nbCount':
      return /^\d{1,2}$/.test(arg);
    case 'nb':
      return atlas.country(arg) !== undefined;
    case 'area':
    case 'people': {
      const m = /^(gt|lt):([A-Z]{2})$/.exec(arg);
      return m !== null && atlas.country(m[2]!) !== undefined;
    }
    case 'river':
    case 'range':
    case 'desert':
      return atlas.feature(arg) !== undefined;
    case 'capital': {
      const m = /^([ns]):([a-z-]+)$/.exec(arg);
      return m !== null && atlas.city(m[2]!) !== undefined;
    }
  }
}
