/**
 * Atlas Explorer rules (design § 16): pure state transitions (each returns the same object when nothing changes),
 * scoring at commit, validation of untrusted saves, the start-screen settings and the round summary.
 */
import { isInt, isOneOf, isRecord, type SettingValue } from '@wp/game-core';
import { countryDistanceKm, featureDistanceKm, cityDistanceKm, type Atlas } from './atlas';
import { clueKnown } from './clues';
import { DIFFICULTIES, TEMPLATES, type Area, type Difficulty } from './compare';
import { createRound } from './generate';
import { distanceKm } from './geo';
import { graphOf, validPath } from './route';
import {
  AREAS,
  MAX_PATH,
  MODES,
  POINT_MAX_LAT,
  bandOf,
  inReview,
  kindsOf,
  pointStep,
  type AtlasState,
  type CompareItem,
  type FindItem,
  type Item,
  type LonLat,
  type Mode,
  type MysteryItem,
  type Place,
  type RouteItem
} from './state';

export { createRound };

/* ---------- Helpers ---------- */

export const currentItem = (s: AtlasState): Item | undefined => s.items[s.index];
export const isSummary = (s: AtlasState): boolean => s.index >= s.items.length;

function withItem(s: AtlasState, item: Item): AtlasState {
  const items = s.items.slice();
  items[s.index] = item;
  return { ...s, items };
}

/** The current item if it has the kind and is still open (not in review), else undefined. */
function open<K extends Item['kind']>(s: AtlasState, kind: K): Extract<Item, { kind: K }> | undefined {
  const item = currentItem(s);
  return item && item.kind === kind && !inReview(item) ? (item as Extract<Item, { kind: K }>) : undefined;
}

const isLonLat = (v: unknown): v is LonLat => Array.isArray(v) && v.length === 2 && isInt(v[0], -18000, 18000) && isInt(v[1], -9000, 9000);

/** Distance (km) from a point (degrees) to a find target. */
export function targetDistanceKm(atlas: Atlas, target: Place, lon: number, lat: number): number {
  switch (target.t) {
    case 'country': {
      const c = atlas.country(target.id);
      return c ? countryDistanceKm(atlas, c, lon, lat) : Infinity;
    }
    case 'city': {
      const c = atlas.city(target.id);
      return c ? cityDistanceKm(c, lon, lat) : Infinity;
    }
    case 'feature': {
      const f = atlas.feature(target.id);
      return f ? featureDistanceKm(f, lon, lat) : Infinity;
    }
    case 'point':
      return distanceKm(lon, lat, target.at[0] / 100, target.at[1] / 100);
  }
}

/* ---------- Find ---------- */

/** Places (or moves) the marker. Never reveals anything. */
export function setMarker(s: AtlasState, at: LonLat): AtlasState {
  const item = open(s, 'find');
  if (!item || !isLonLat(at) || (item.draft && item.draft[0] === at[0] && item.draft[1] === at[1])) return s;
  return withItem(s, { ...item, draft: [at[0], at[1]] });
}

/** Commits the marker: the distance and band are computed now and stored (design § 6.3). */
export function checkFind(s: AtlasState, atlas: Atlas): AtlasState {
  const item = open(s, 'find');
  if (!item || !item.draft) return s;
  const raw = targetDistanceKm(atlas, item.target, item.draft[0] / 100, item.draft[1] / 100);
  const km = Number.isFinite(raw) ? Math.round(raw) : 20_000;
  return withItem(s, { ...item, answer: [item.draft[0], item.draft[1]], km, band: bandOf(item.target.t, km) });
}

/* ---------- Compare ---------- */

export function chooseOption(s: AtlasState, i: number): AtlasState {
  const item = open(s, 'compare');
  if (!item || !isInt(i, 0, item.options.length - 1) || item.draft === i) return s;
  return withItem(s, { ...item, draft: i });
}

export function checkCompare(s: AtlasState): AtlasState {
  const item = open(s, 'compare');
  if (!item || item.draft === null) return s;
  return withItem(s, { ...item, answer: item.draft });
}

/* ---------- Mystery ---------- */

export function nextClue(s: AtlasState): AtlasState {
  const item = open(s, 'mystery');
  if (!item || item.shown >= item.clues.length) return s;
  return withItem(s, { ...item, shown: item.shown + 1 });
}

export function setGuessDraft(s: AtlasState, id: string | null, atlas: Atlas): AtlasState {
  const item = open(s, 'mystery');
  if (!item || item.draft === id || (id !== null && (!atlas.country(id) || item.guesses.includes(id)))) return s;
  return withItem(s, { ...item, draft: id });
}

/** Guesses the drafted country: solved when it is the target (unlimited guesses, no penalty). */
export function guess(s: AtlasState): AtlasState {
  const item = open(s, 'mystery');
  if (!item || item.draft === null || item.guesses.includes(item.draft)) return s;
  const guesses = [...item.guesses, item.draft];
  return withItem(s, { ...item, guesses, draft: null, end: item.draft === item.target ? 'solved' : null });
}

export function showMystery(s: AtlasState): AtlasState {
  const item = open(s, 'mystery');
  return item ? withItem(s, { ...item, draft: null, end: 'shown' }) : s;
}

/* ---------- Route ---------- */

/** Moves to a neighbour of the current country (no repeats); arriving ends the item. */
export function step(s: AtlasState, id: string, atlas: Atlas): AtlasState {
  const item = open(s, 'route');
  if (!item || item.path.includes(id) || item.path.length >= MAX_PATH) return s;
  const last = item.path[item.path.length - 1]!;
  if (!(graphOf(atlas).get(last) ?? []).includes(id)) return s;
  const path = [...item.path, id];
  return withItem(s, { ...item, path, end: id === item.to ? 'arrived' : null });
}

/** Removes the last step (unlimited). */
export function back(s: AtlasState): AtlasState {
  const item = open(s, 'route');
  if (!item || item.path.length <= 1) return s;
  return withItem(s, { ...item, path: item.path.slice(0, -1) });
}

export function showRoute(s: AtlasState): AtlasState {
  const item = open(s, 'route');
  return item ? withItem(s, { ...item, end: 'shown' }) : s;
}

/* ---------- Any item ---------- */

/** "Skip — just show me": not scored, not mentioned in the summary. */
export function skip(s: AtlasState): AtlasState {
  const item = currentItem(s);
  if (!item || inReview(item)) return s;
  switch (item.kind) {
    case 'find':
      return withItem(s, { ...item, draft: null, answer: 'skip', km: null, band: null });
    case 'compare':
      return withItem(s, { ...item, draft: null, answer: 'skip' });
    case 'mystery':
      return showMystery(s);
    case 'route':
      return showRoute(s);
  }
}

/** "Next" (or "See summary" after the last item): only from a review. */
export function next(s: AtlasState): AtlasState {
  const item = currentItem(s);
  if (!item || !inReview(item)) return s;
  return { ...s, index: s.index + 1 };
}

/** Marks that `finished()` was called for this round. */
export function markReported(s: AtlasState): AtlasState {
  return isSummary(s) && !s.reported ? { ...s, reported: true } : s;
}

/** The same round from the start (`reset`). */
export const restartRound = (s: AtlasState, atlas: Atlas): AtlasState => createRound(s.seed, s.difficulty, s.mode, s.region, atlas);

/* ---------- Settings (ADR 0017) ---------- */

export interface StartChoice {
  readonly mode: Mode;
  readonly region: Area;
  readonly difficulty: Difficulty;
}

/** Untrusted start-screen choices → valid ones (unknown mode → mixed, region → world, difficulty → easy). */
export function startChoice(difficulty: unknown, settings: Readonly<Record<string, SettingValue>> | undefined): StartChoice {
  const mode = settings?.mode;
  const region = settings?.region;
  return {
    mode: isOneOf(mode, MODES) ? mode : 'mixed',
    region: isOneOf(region, AREAS) ? region : 'world',
    difficulty: isOneOf(difficulty, DIFFICULTIES) ? difficulty : 'easy'
  };
}

export const settingsOf = (s: AtlasState): Readonly<Record<string, SettingValue>> => ({ mode: s.mode, region: s.region, difficulty: s.difficulty });

/* ---------- Validation (never throws) ---------- */

const isPlace = (v: unknown, atlas: Atlas, d: Difficulty): v is Place => {
  if (!isRecord(v)) return false;
  if (v.t === 'point') {
    const at = v.at;
    const step = pointStep(d);
    return isLonLat(at) && at[0] % step === 0 && at[1] % step === 0 && Math.abs(at[1]) <= POINT_MAX_LAT && at[0] < 18000 && Object.keys(v).length === 2;
  }
  if (typeof v.id !== 'string' || Object.keys(v).length !== 2) return false;
  if (v.t === 'country') return atlas.country(v.id) !== undefined;
  if (v.t === 'city') return atlas.city(v.id) !== undefined;
  if (v.t === 'feature') return atlas.feature(v.id) !== undefined;
  return false;
};

function validFind(v: Record<string, unknown>, atlas: Atlas, d: Difficulty): boolean {
  if (!isPlace(v.target, atlas, d)) return false;
  if (!(v.draft === null || isLonLat(v.draft))) return false;
  const { answer, km, band } = v;
  if (answer === null || answer === 'skip') return km === null && band === null && (answer === null || v.draft === null);
  if (!isLonLat(answer) || !isInt(km, 0, 20_100)) return false;
  return band === bandOf((v.target as Place).t, km);
}

const OPTION_SETS: Readonly<Record<string, readonly string[]>> = { midnight: ['yes', 'no'], season: ['summer', 'winter'] };

function validCompare(v: Record<string, unknown>, atlas: Atlas): boolean {
  const { template, places, options, param, correct, draft, answer } = v;
  if (!isOneOf(template, TEMPLATES) || !Array.isArray(places) || !Array.isArray(options)) return false;
  if (places.length < 1 || places.length > 3 || options.length < 2 || options.length > 4) return false;
  if (!places.every((p) => typeof p === 'string') || !options.every((o) => typeof o === 'string') || new Set(options).size !== options.length) return false;
  const countryTemplate = template === 'larger' || template === 'people' || template === 'density';
  if (!places.every((p) => (countryTemplate ? atlas.country(p as string) : atlas.city(p as string)) !== undefined)) return false;
  const set = OPTION_SETS[template];
  if (set) {
    if (!options.every((o) => set.includes(o as string))) return false;
  } else if (template === 'suntime' || template === 'clock') {
    if (!options.every((o) => /^h-?(?:[0-9]|1[01])$/.test(o as string))) return false;
  } else if (!options.every((o) => places.includes(o))) return false;
  if (!(template === 'daylight' ? param === 6 || param === 12 : template === 'midnight' ? param === 6 : template === 'season' ? param === 7 : param === 0)) return false;
  if (!isInt(correct, 0, options.length - 1)) return false;
  if (!(draft === null || isInt(draft, 0, options.length - 1))) return false;
  return answer === null || answer === 'skip' || isInt(answer, 0, options.length - 1);
}

function validMystery(v: Record<string, unknown>, atlas: Atlas): boolean {
  const { target, clues, shown, guesses, draft, end } = v;
  if (typeof target !== 'string' || !atlas.country(target)) return false;
  if (!Array.isArray(clues) || clues.length < 3 || clues.length > 7 || !clues.every((k) => clueKnown(atlas, k) && Object.keys(k as object).length === 2)) return false;
  if (!isInt(shown, 1, clues.length)) return false;
  if (!Array.isArray(guesses) || guesses.length > atlas.countries.length || !guesses.every((g) => typeof g === 'string' && atlas.country(g) !== undefined) || new Set(guesses).size !== guesses.length) return false;
  if (!(draft === null || (typeof draft === 'string' && atlas.country(draft) !== undefined && !guesses.includes(draft)))) return false;
  if (!(end === null || end === 'solved' || end === 'shown')) return false;
  const found = guesses.indexOf(target);
  // Solved ⇔ the target is the last guess; open or shown items never contain the target.
  if (end === 'solved') return found === guesses.length - 1 && draft === null;
  return found === -1 && (end === null || draft === null);
}

function validRoute(v: Record<string, unknown>, atlas: Atlas, current: boolean): boolean {
  const { from, to, best, ways, path, end } = v;
  if (typeof from !== 'string' || typeof to !== 'string' || from === to || !atlas.country(from) || !atlas.country(to)) return false;
  if (!isInt(best, 1, MAX_PATH) || !isInt(ways, 1, 1_000_000)) return false;
  if (!Array.isArray(path) || path.length < 1 || path.length > MAX_PATH || !path.every((p) => typeof p === 'string' && atlas.country(p) !== undefined)) return false;
  if (path[0] !== from || new Set(path).size !== path.length) return false;
  // Steps are re-checked against the graph of the current data; a route from an older data id is shown as it was.
  if (current && !validPath(graphOf(atlas), from, path as string[])) return false;
  if (!(end === null || end === 'arrived' || end === 'shown')) return false;
  return (end === 'arrived') === (path[path.length - 1] === to);
}

const ITEM_KEYS: Readonly<Record<Item['kind'], number>> = { find: 6, compare: 8, mystery: 7, route: 7 };

/** Structural and semantic validation of an untrusted save against the atlas (design § 16). Never throws. */
export function isAtlasState(x: unknown, atlas: Atlas): x is AtlasState {
  try {
    if (!isRecord(x) || x.v !== 1 || typeof x.data !== 'string' || !isInt(x.seed, 0, 0xffff_ffff)) return false;
    // Known data ids: the current one (older ones once data updates exist, design § 16).
    if (x.data !== atlas.id) return false;
    if (!isOneOf(x.difficulty, DIFFICULTIES) || !isOneOf(x.mode, MODES) || !isOneOf(x.region, AREAS) || typeof x.reported !== 'boolean') return false;
    const kinds = kindsOf(x.mode, x.region);
    const items = x.items;
    if (!Array.isArray(items) || items.length !== kinds.length || !isInt(x.index, 0, items.length)) return false;
    const current = x.data === atlas.id;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!isRecord(it) || it.kind !== kinds[i] || Object.keys(it).length !== ITEM_KEYS[it.kind as Item['kind']]) return false;
      const ok =
        it.kind === 'find'
          ? validFind(it, atlas, x.difficulty)
          : it.kind === 'compare'
            ? validCompare(it, atlas)
            : it.kind === 'mystery'
              ? validMystery(it, atlas)
              : validRoute(it, atlas, current);
      if (!ok) return false;
      const reviewed = inReview(it as unknown as Item);
      // Items before the current one are committed; later ones are untouched.
      if (i < x.index && !reviewed) return false;
      if (i > x.index && (reviewed || !untouched(it as unknown as Item))) return false;
    }
    return !x.reported || x.index === items.length;
  } catch {
    return false;
  }
}

function untouched(item: Item): boolean {
  switch (item.kind) {
    case 'find':
      return item.draft === null;
    case 'compare':
      return item.draft === null;
    case 'mystery':
      return item.shown === 1 && item.guesses.length === 0 && item.draft === null;
    case 'route':
      return item.path.length === 1;
  }
}

/* ---------- Summary (descriptive; no grades) ---------- */

export interface RoundSummary {
  /** Find items answered, per band (0…3). */
  readonly bands: [number, number, number, number];
  readonly finds: number;
  /** Compare items answered and how many of them matched the map. */
  readonly compared: number;
  readonly matched: number;
  /** Mystery items solved / looked up; clues and guesses used in the solved ones. */
  readonly solved: number;
  readonly mysteries: number;
  /** Route items reached on foot / reached by a shortest route. */
  readonly arrived: number;
  readonly shortest: number;
  readonly routes: number;
  /** Items skipped or looked up (not scored). */
  readonly skipped: number;
}

export function summarize(s: AtlasState): RoundSummary {
  const bands: [number, number, number, number] = [0, 0, 0, 0];
  let finds = 0;
  let compared = 0;
  let matched = 0;
  let solved = 0;
  let mysteries = 0;
  let arrived = 0;
  let shortest = 0;
  let routes = 0;
  let skipped = 0;
  for (const it of s.items) {
    switch (it.kind) {
      case 'find':
        if (it.band !== null) {
          bands[it.band] += 1;
          finds++;
        } else if (it.answer === 'skip') skipped++;
        break;
      case 'compare':
        if (typeof it.answer === 'number') {
          compared++;
          if (it.answer === it.correct) matched++;
        } else if (it.answer === 'skip') skipped++;
        break;
      case 'mystery':
        mysteries++;
        if (it.end === 'solved') solved++;
        else if (it.end === 'shown') skipped++;
        break;
      case 'route':
        routes++;
        if (it.end === 'arrived') {
          arrived++;
          if (it.path.length - 1 === it.best) shortest++;
        } else if (it.end === 'shown') skipped++;
        break;
    }
  }
  return { bands, finds, compared, matched, solved, mysteries, arrived, shortest, routes, skipped };
}

/** Re-exports for views and tests. */
export type { AtlasState, CompareItem, FindItem, Item, MysteryItem, RouteItem };
