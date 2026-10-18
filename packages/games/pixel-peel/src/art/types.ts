/**
 * The data format of a Pixel Peel motif (design v2 § 1.2). A motif is a list of layered vector shapes in a fixed
 * coordinate space (100 units wide; 100 high for `square`, 75 for `wide`), rasterised deterministically by
 * `raster.ts` at the difficulty's resolution (32, 40 or 48 cells wide) with the motif's fixed palette. Motif files
 * are pure data and import only types, so the render script can load them directly.
 */

/** The 16 UI locales (same list and order as `@wp/localization`; games depend only on `@wp/game-core`). */
export const LOCALES = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh-Hans', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

/** A text in every UI locale; a missing locale is a compile error. */
export type Localized = Readonly<Record<Locale, string>>;

/**
 * The fixed colour vocabulary (44 names), translated once in the message catalogues (`colour.<name>`). The first 24
 * are v1's, so v1 saves still validate. Reusing a name is a data-only change; a new name needs every locale.
 */
export const COLOUR_NAMES = [
  'white', 'cream', 'yellow', 'gold', 'orange', 'red', 'darkRed', 'pink', 'lightPink', 'purple', 'lightBlue', 'blue',
  'navy', 'teal', 'lightGreen', 'green', 'darkGreen', 'olive', 'tan', 'brown', 'darkBrown', 'grey', 'darkGrey', 'black',
  'lightGrey', 'charcoal', 'skyBlue', 'turquoise', 'mint', 'lime', 'darkTeal', 'lightYellow', 'peach', 'coral', 'rust',
  'maroon', 'magenta', 'lavender', 'violet', 'beige', 'ochre', 'lightBrown', 'darkPurple', 'ivory'
] as const;
export type ColourName = (typeof COLOUR_NAMES)[number];

export type MotifGroup = 'season' | 'landscape' | 'animal' | 'scene';
export const GROUPS: readonly MotifGroup[] = ['season', 'landscape', 'animal', 'scene'];

/** `[hex, colour name, tier, merge target]`. Tier 1 = played at every difficulty, 2 = from medium, 3 = hard only. */
export type PaletteSpec = readonly [hex: string, name: ColourName, tier: 1 | 2 | 3, merge?: string];

export type Point = readonly [number, number];

export type Shape =
  | { readonly rect: readonly [x: number, y: number, w: number, h: number]; readonly round?: number }
  | { readonly ellipse: readonly [cx: number, cy: number, rx: number, ry: number]; readonly rot?: number }
  | { readonly poly: readonly Point[]; readonly smooth?: 1 | 2 }
  | { readonly star: readonly [cx: number, cy: number, outer: number, inner: number, points: number]; readonly rot?: number }
  | { readonly line: readonly Point[]; readonly width: number }
  | { readonly all: true };

export type Fill =
  /** A palette key, or `.` to erase to transparent. */
  | string
  | { readonly gradient: readonly string[]; readonly from: Point; readonly to: Point; readonly soft?: number }
  | { readonly stripes: readonly string[]; readonly width: number; readonly angle?: number }
  /** Sparse cells of one key; the rest stay untouched. */
  | { readonly scatter: string; readonly density: number; readonly salt: number };

export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface Shade {
  /** Palette key on the lit rim. */
  readonly light?: string;
  /** Palette key on the shadow rim. */
  readonly dark?: string;
  /** Where the light comes from. */
  readonly dir: Direction;
  /** Rim width in cells at W = 48; scaled by W/48, at least 1. */
  readonly width?: 1 | 2 | 3;
  readonly mode?: 'rim' | 'band';
  /** `band` only: share of the shape's extent along `dir` (0.1–0.5). */
  readonly amount?: number;
}

export interface Layer {
  /** Only needed when another layer clips to it. */
  readonly name?: string;
  readonly shape: Shape;
  readonly fill: Fill;
  readonly shade?: Shade;
  /** A 1-cell inner outline in this key, at every resolution. */
  readonly outline?: string;
  /** Paint only where the named earlier layer's mask is set. */
  readonly clip?: string;
  /** Never vanishes: an empty mask gets the cell under the shape's anchor. */
  readonly keep?: boolean;
  /** Level of detail: drawn only at W ≥ min. */
  readonly min?: 40 | 48;
}

export interface Motif {
  /** `[a-z0-9-]{2,32}`, unique, never `any`. Saves keep a full copy of the picture, so renaming loses only the title. */
  readonly id: string;
  readonly group: MotifGroup;
  /** Shown in the start-screen list and on the reveal (at most 32 characters). */
  readonly title: Localized;
  /** One factual line on the reveal: where this is found (broad terms for animals' native ranges). */
  readonly place: Localized;
  readonly aspect: 'square' | 'wide';
  /** `#rrggbb` behind transparent and removed cells. */
  readonly backdrop: string;
  /** Keys are single lowercase letters; insertion order = symbol order. */
  readonly palette: Readonly<Record<string, PaletteSpec>>;
  /** Painted in order: later layers cover earlier ones. */
  readonly layers: readonly Layer[];
  /** Optional 1-cell outline around all non-transparent cells. */
  readonly silhouette?: string;
}
