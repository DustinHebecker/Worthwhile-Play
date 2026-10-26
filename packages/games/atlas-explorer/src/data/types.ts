/**
 * Shape of the generated atlas module (`atlas.gen.ts`, written by scripts/build-atlas.ts; design § 11.3). Plain data
 * only; geometry and packed facts are encoded strings (src/codec.ts), decoded once by `decodeAtlas` (src/atlas.ts).
 */
export interface AtlasData {
  /** Source version / pipeline version, stored in saves. */
  readonly id: string;
  /** Arc coordinates are integers in 1/unit degree. */
  readonly unit: number;
  /** All border and coast arcs (count, then per arc: points, first point relative to the previous arc's, deltas). */
  readonly arcs: string;
  /** The 193 UN member states, sorted by code. */
  readonly countries: readonly {
    readonly id: string;
    readonly region: string;
    readonly sub: string;
    /** Packed numbers: tier, label lon/lat, home extent ×4, population, year, area core/max, lines, flags. */
    readonly f: string;
    /** Neighbours (space-separated codes). */
    readonly nb: string;
    /** Rivers and physical regions in the home territory (space-separated ids). */
    readonly ft: string;
    /** Physical regions that reach in only a little (below the share threshold, design § 8.2; space-separated ids;
     *  omitted when none). */
    readonly fm?: string;
    /** Hatched areas touching the country (space-separated ids). */
    readonly dz: string;
    /** Rings as arc references. */
    readonly rings: string;
  }[];
  /** Map units that are not UN members (never asked about). */
  readonly others: readonly { readonly id: string; readonly iso: string; readonly label: readonly number[]; readonly rings: string }[];
  /** Areas with a disputed status (policy A, design § 12.2): no names. */
  readonly disputed: readonly { readonly id: string; readonly rings: string }[];
  readonly lakes: readonly { readonly id: string; readonly tier: number; readonly rings: string; readonly label: readonly number[]; readonly area: number }[];
  readonly rivers: readonly { readonly id: string; readonly tier: number; readonly lines: string; readonly label: readonly number[]; readonly km: number }[];
  readonly regions: readonly { readonly id: string; readonly kind: string; readonly tier: number; readonly rings: string; readonly label: readonly number[]; readonly area: number }[];
  readonly cities: readonly {
    readonly id: string;
    readonly country: string;
    readonly capital?: boolean;
    readonly tier: number;
    readonly lon: number;
    readonly lat: number;
    /** Standard UTC offset in minutes (no daylight saving). */
    readonly tz: number;
  }[];
  readonly seas: readonly { readonly id: string; readonly at: readonly (readonly number[])[] }[];
  /** Curated "insight pairs" per compare template (city ids). */
  readonly pairs: Readonly<Record<string, readonly (readonly string[])[]>>;
  /** Ids kept for old saves but never drawn by the generator. */
  readonly retired: readonly string[];
}
