/**
 * Species and habitat tables of Pond & Meadow (design § 8; calibrated 2026-10-27, Appendix B). Pure data, integers only.
 *
 * Units: amounts in u (nutrient units), water in w; rates in ppm per model day; fractions, preferences and shading
 * coefficients in ‰. The order of each species list is the habitat order used by every array of the model.
 */

export type Habitat = 'pond' | 'meadow';
export const HABITATS: readonly Habitat[] = ['pond', 'meadow'];

/** A food source of a consumer: a species index, or `DEAD` for dead matter. */
export const DEAD = -1;

export interface SpeciesDef {
  readonly id: string;
  readonly producer: boolean;
  /** Producers: maximum growth rate (ppm/day); consumers: maximum intake rate (ppm/day). */
  readonly mu: number;
  /** Producers: nutrient half-saturation (u); consumers: food half-saturation (u). */
  readonly k: number;
  /** Light half-saturation (u of shade); 0 = never light-limited ("none"). */
  readonly kL: number;
  /** Steep (Hill) light response instead of Monod. */
  readonly hill: boolean;
  /** [species index, coefficient ‰] of the species whose amount shades this one. */
  readonly shadedBy: readonly (readonly [number, number])[];
  /** [species index, kI] of species that slow this one's growth (algae by pondweed). */
  readonly inhibitedBy: readonly (readonly [number, number])[];
  /** Index of the space group (habitat `space`), or -1. */
  readonly space: number;
  /** Meadow: soil-water half-saturation (w) and water use per unit of uptake (‰). */
  readonly kW: number;
  readonly water: number;
  /** Nitrogen fixation (‰ of growth) and its switch-off half-saturation by soil nutrients (u). */
  readonly fix: number;
  readonly kFix: number;
  /** Consumers: [food (species index or DEAD), preference ‰]. */
  readonly eats: readonly (readonly [number, number])[];
  /** Consumers: a refuge [prey index, sheltering species index, kR]. */
  readonly refuge: readonly [number, number, number] | null;
  /** Consumers: assimilated share of what is eaten (‰); the rest becomes dead matter. */
  readonly assim: number;
  readonly resp: number;
  readonly mort: number;
  /** Quadratic ("crowding") mortality (ppm/day per 10⁶ u). */
  readonly m2: number;
  /** Maturation delay in weeks (0 = none, else ≥ 2). */
  readonly delay: number;
  /** Amount of this species that predators can never reach (u). */
  readonly hide: number;
  /** Suspended in the water: washed out by the pond's water flow. */
  readonly suspended: boolean;
  /** Amount arriving by itself every week once the species has lived here (u). */
  readonly arrive: number;
  /** Amount added by the "add" action (u). */
  readonly intro: number;
  /** Below this total amount (adults and juveniles) the species is locally extinct (u). */
  readonly min: number;
}

export interface ConditionDef {
  readonly id: string;
  /** Level ids (message keys `level.<cond>.<level>`); the first is the habitat default. */
  readonly levels: readonly string[];
  /** Model value per level. */
  readonly values: readonly number[];
}

export interface HabitatDef {
  readonly id: Habitat;
  readonly species: readonly SpeciesDef[];
  readonly conditions: readonly ConditionDef[];
  /** Index of the light, input (runoff/fertiliser), flow and rain conditions (-1 = fixed). */
  readonly lightCond: number;
  readonly inputCond: number;
  readonly flowCond: number;
  readonly rainCond: number;
  readonly decay: number;
  readonly burial: number;
  readonly leach: number;
  readonly evap: number;
  /** Soil water capacity (w); 0 in the pond (no water stock). */
  readonly wMax: number;
  /** Capacity of each space group (u). */
  readonly space: readonly number[];
  readonly meadow: boolean;
}

const base = {
  kL: 0,
  hill: false,
  shadedBy: [],
  inhibitedBy: [],
  space: -1,
  kW: 0,
  water: 0,
  fix: 0,
  kFix: 0,
  eats: [],
  refuge: null,
  assim: 0,
  m2: 0,
  delay: 0,
  hide: 0,
  suspended: false,
  arrive: 0
} as const;

const POND_SPECIES: readonly SpeciesDef[] = [
  { ...base, id: 'algae', producer: true, suspended: true, mu: 800_000, k: 20_000, kL: 600_000, shadedBy: [[0, 300], [1, 500], [2, 1500]], inhibitedBy: [[3, 600_000]], resp: 50_000, mort: 50_000, arrive: 100, intro: 5_000, min: 200 },
  { ...base, id: 'bluegreen', producer: true, suspended: true, mu: 500_000, k: 300_000, kL: 900_000, shadedBy: [[2, 1500]], resp: 30_000, mort: 30_000, arrive: 100, intro: 5_000, min: 200 },
  { ...base, id: 'duckweed', producer: true, mu: 300_000, k: 250_000, space: 0, resp: 20_000, mort: 25_000, arrive: 100, intro: 5_000, min: 200 },
  { ...base, id: 'pondweed', producer: true, mu: 140_000, k: 8_000, kL: 145_000, hill: true, shadedBy: [[0, 1000], [1, 1500], [2, 3000]], space: 1, resp: 10_000, mort: 15_000, intro: 20_000, min: 200 },
  { ...base, id: 'fleas', producer: false, suspended: true, mu: 1_000_000, k: 150_000, eats: [[0, 1000], [1, 100]], assim: 400, resp: 50_000, mort: 50_000, m2: 300_000, hide: 5_000, arrive: 100, intro: 5_000, min: 100 },
  { ...base, id: 'snails', producer: false, mu: 150_000, k: 60_000, eats: [[DEAD, 1000], [0, 200]], assim: 300, resp: 15_000, mort: 8_000, m2: 100_000, hide: 8_000, intro: 5_000, min: 100 },
  { ...base, id: 'minnows', producer: false, mu: 130_000, k: 45_000, eats: [[4, 1000], [5, 200], [DEAD, 20]], refuge: [4, 3, 20_000], assim: 350, resp: 5_000, mort: 2_000, m2: 200_000, delay: 6, intro: 20_000, min: 100 },
  { ...base, id: 'pike', producer: false, mu: 90_000, k: 30_000, eats: [[6, 1000]], assim: 300, resp: 4_000, mort: 1_000, m2: 200_000, delay: 20, intro: 5_000, min: 100 }
];

const MEADOW_SPECIES: readonly SpeciesDef[] = [
  { ...base, id: 'grass', producer: true, mu: 100_000, k: 50_000, space: 0, kW: 60_000, water: 100, resp: 8_000, mort: 12_000, m2: 200_000, arrive: 100, intro: 5_000, min: 200 },
  { ...base, id: 'flowers', producer: true, mu: 90_000, k: 5_000, kL: 400_000, hill: true, shadedBy: [[0, 1000]], space: 0, kW: 50_000, water: 100, resp: 6_000, mort: 10_000, m2: 60_000, arrive: 100, intro: 5_000, min: 200 },
  { ...base, id: 'clover', producer: true, mu: 70_000, k: 30_000, kL: 150_000, hill: true, shadedBy: [[0, 1000]], space: 0, kW: 60_000, water: 100, fix: 800, kFix: 30_000, resp: 6_000, mort: 10_000, m2: 30_000, arrive: 100, intro: 5_000, min: 200 },
  { ...base, id: 'aphids', producer: false, mu: 400_000, k: 60_000, eats: [[1, 1000], [2, 500], [0, 100]], assim: 400, resp: 60_000, mort: 30_000, m2: 300_000, hide: 2_000, arrive: 50, intro: 2_000, min: 100 },
  { ...base, id: 'ladybirds', producer: false, mu: 700_000, k: 40_000, eats: [[3, 1000]], assim: 350, resp: 30_000, mort: 20_000, m2: 1_000_000, delay: 3, arrive: 20, intro: 3_000, min: 100 },
  { ...base, id: 'rabbits', producer: false, mu: 60_000, k: 60_000, eats: [[2, 1000], [1, 700], [0, 400]], assim: 300, resp: 6_000, mort: 2_000, m2: 10_000, delay: 5, hide: 3_000, intro: 5_000, min: 100 },
  { ...base, id: 'foxes', producer: false, mu: 90_000, k: 15_000, eats: [[5, 1000]], assim: 300, resp: 2_000, mort: 1_000, m2: 600_000, delay: 26, intro: 2_000, min: 100 },
  { ...base, id: 'worms', producer: false, mu: 100_000, k: 80_000, eats: [[DEAD, 1000]], assim: 250, resp: 12_000, mort: 4_000, m2: 100_000, intro: 10_000, min: 100 }
];

export const POND: HabitatDef = {
  id: 'pond',
  species: POND_SPECIES,
  conditions: [
    { id: 'light', levels: ['full', 'partly', 'shaded'], values: [1000, 750, 500] },
    { id: 'runoff', levels: ['none', 'low', 'medium', 'high', 'heavy'], values: [0, 100, 300, 600, 1500] },
    { id: 'flow', levels: ['still', 'trickle', 'stream'], values: [0, 5_000, 20_000] }
  ],
  lightCond: 0,
  inputCond: 1,
  flowCond: 2,
  rainCond: -1,
  decay: 150_000,
  burial: 300,
  leach: 0,
  evap: 0,
  wMax: 0,
  space: [300_000, 450_000],
  meadow: false
};

export const MEADOW: HabitatDef = {
  id: 'meadow',
  species: MEADOW_SPECIES,
  conditions: [
    { id: 'rain', levels: ['normal', 'dry', 'wet'], values: [4_000, 500, 6_000] },
    { id: 'fertiliser', levels: ['none', 'some', 'lots'], values: [80, 300, 600] }
  ],
  lightCond: -1,
  inputCond: 1,
  flowCond: -1,
  rainCond: 0,
  decay: 3_000,
  burial: 0,
  leach: 4_000,
  evap: 20_000,
  wMax: 200_000,
  space: [600_000],
  meadow: true
};

export const habitatDef = (h: Habitat): HabitatDef => (h === 'pond' ? POND : MEADOW);

/** Index of a species id in its habitat, or -1. */
export const speciesIndex = (hab: HabitatDef, id: string): number => hab.species.findIndex((s) => s.id === id);

/** Every species id of both habitats (16). */
export const ALL_SPECIES: readonly string[] = [...POND_SPECIES, ...MEADOW_SPECIES].map((s) => s.id);
