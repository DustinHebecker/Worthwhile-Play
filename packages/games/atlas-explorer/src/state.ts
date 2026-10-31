/**
 * The saved state of Atlas Explorer (design § 16): plain JSON, ids and integers only. Results that depend on geometry
 * or the graph (km, band, best, ways, correct) are stored when created or committed, so a data update never changes an
 * old review.
 */
import type { Clue } from './clues';
import type { Area, Difficulty, TemplateId } from './compare';

export const MODES = ['find', 'compare', 'mystery', 'route', 'mixed'] as const;
export type Mode = (typeof MODES)[number];
export type ItemKind = Exclude<Mode, 'mixed'>;
export const AREAS = ['world', 'africa', 'americas', 'asia', 'europe', 'oceania'] as const;

/** Integer hundredths of a degree: lon −18000…18000, lat −9000…9000. */
export type LonLat = [lon: number, lat: number];

export type Place = { readonly t: 'country' | 'city' | 'feature'; readonly id: string } | { readonly t: 'point'; readonly at: LonLat };

export interface FindItem {
  readonly kind: 'find';
  readonly target: Place;
  /** The marker being placed (movable until Check). */
  readonly draft: LonLat | null;
  /** Committed ⇔ review. */
  readonly answer: LonLat | 'skip' | null;
  readonly km: number | null;
  /** 0 on target · 1 close · 2 on the right track · 3 further away. */
  readonly band: 0 | 1 | 2 | 3 | null;
}

export interface CompareItem {
  readonly kind: 'compare';
  readonly template: TemplateId;
  readonly places: string[];
  readonly param: number;
  readonly options: string[];
  readonly correct: number;
  readonly draft: number | null;
  readonly answer: number | 'skip' | null;
}

export interface MysteryItem {
  readonly kind: 'mystery';
  readonly target: string;
  readonly clues: Clue[];
  /** Clues shown so far (1…clues.length). */
  readonly shown: number;
  /** Distinct UN member codes guessed, in order. */
  readonly guesses: string[];
  readonly draft: string | null;
  readonly end: 'solved' | 'shown' | null;
}

export interface RouteItem {
  readonly kind: 'route';
  readonly from: string;
  readonly to: string;
  /** Shortest number of border crossings and number of shortest routes, at generation. */
  readonly best: number;
  readonly ways: number;
  readonly path: string[];
  readonly end: 'arrived' | 'shown' | null;
}

export type Item = FindItem | CompareItem | MysteryItem | RouteItem;

export interface AtlasState {
  readonly v: 1;
  /** `ATLAS_DATA.id` at creation. */
  readonly data: string;
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly mode: Mode;
  readonly region: Area;
  readonly items: Item[];
  /** Current item; `items.length` = the summary. */
  readonly index: number;
  /** `finished()` was called (never twice, also after a restore). */
  readonly reported: boolean;
}

/** Items per mode (design § 5). */
export const ITEM_COUNT: Readonly<Record<Mode, number>> = { find: 8, compare: 8, mystery: 4, route: 4, mixed: 6 };

/** The kinds of a round, in order (mixed: find, compare, mystery, find, compare, route; Oceania: the route becomes find). */
export function kindsOf(mode: Mode, area: Area): ItemKind[] {
  if (mode !== 'mixed') return Array.from({ length: ITEM_COUNT[mode] }, () => mode);
  return ['find', 'compare', 'mystery', 'find', 'compare', area === 'oceania' ? 'find' : 'route'];
}

/** Distance bands (inclusive upper bounds, km) per target kind (design § 6.3). */
export const BANDS: Readonly<Record<Place['t'], readonly [number, number, number]>> = {
  country: [0, 300, 1000],
  feature: [0, 300, 1000],
  city: [100, 400, 1200],
  point: [150, 500, 1500]
};

export const bandOf = (t: Place['t'], km: number): 0 | 1 | 2 | 3 => {
  const [a, b, c] = BANDS[t];
  return km <= a ? 0 : km <= b ? 1 : km <= c ? 2 : 3;
};

/** Grid of point targets: whole multiples of 30° on easy, else 10° (design § 6.2). */
export const pointStep = (d: Difficulty): number => (d === 'easy' ? 3000 : 1000);
export const POINT_MAX_LAT = 7000;

/** Whether the item has been committed (its review is showing). */
export function inReview(item: Item): boolean {
  switch (item.kind) {
    case 'find':
    case 'compare':
      return item.answer !== null;
    case 'mystery':
    case 'route':
      return item.end !== null;
  }
}

export const MAX_PATH = 60;
