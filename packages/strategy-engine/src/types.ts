/** Shared strategy / Tower Defense engine types. Everything in `World` is plain JSON (ADR 0009). */

export const ARMOR_CLASSES = ['infantry', 'light', 'heavy', 'structure', 'air'] as const;
export type ArmorClass = (typeof ARMOR_CLASSES)[number];

export const LAYERS = ['ground', 'air'] as const;
export type Layer = (typeof LAYERS)[number];

export const STATUS_KINDS = ['disabled', 'slowed'] as const;
export type StatusKind = (typeof STATUS_KINDS)[number];

export type Delivery = 'direct' | 'ballistic' | 'beam';

export interface StatusEffectSpec {
  readonly kind: StatusKind;
  /** Number of following ticks the effect is active. */
  readonly ticks: number;
}

export interface WeaponSpec {
  readonly damage: number;
  /** Maximum range in cells (compared as squared distance). */
  readonly range: number;
  readonly minRange: number;
  /** Ticks between shots (1 = every tick). */
  readonly cooldown: number;
  readonly delivery: Delivery;
  /** Ballistic only: ticks until the shell lands on the targeted cell. */
  readonly flight: number;
  /** Ballistic only: splash radius in cells (0 = target cell only). */
  readonly splash: number;
  /** Beam only: extra damage per consecutive tick on the same target, and the cap of stacks. */
  readonly beamRamp: number;
  readonly beamMaxStacks: number;
  /** Damage percentage per armor class; 0 = cannot engage that class. */
  readonly vs: Readonly<Record<ArmorClass, number>>;
  /** Cannot fire in a tick in which the unit moved. */
  readonly stationary: boolean;
  readonly effect: StatusEffectSpec | null;
}

export interface Archetype {
  readonly id: string;
  readonly hp: number;
  readonly armor: ArmorClass;
  readonly layer: Layer;
  /** Movement points gained per tick; 0 = static (structure / tower). */
  readonly speed: number;
  readonly vision: number;
  readonly cost: number;
  readonly weapon: WeaponSpec | null;
}

export interface TerrainSpec {
  /** Ground movement cost for an orthogonal step (even number); `null` = impassable for ground. */
  readonly cost: number | null;
  /** Percentage of direct/beam damage absorbed by a unit standing here. */
  readonly cover: number;
  /** Extra range (cells) for direct/beam weapons fired from here. */
  readonly rangeBonus: number;
}

export interface Ruleset {
  readonly id: string;
  readonly ticksPerTurn: number;
  /** Terrain by single-character code. */
  readonly terrain: Readonly<Record<string, TerrainSpec>>;
  readonly archetypes: Readonly<Record<string, Archetype>>;
}

export interface GameMap {
  readonly w: number;
  readonly h: number;
  /** Row-major, one terrain character per cell. */
  readonly terrain: string;
}

export type Order =
  | { readonly type: 'hold' }
  | { readonly type: 'move'; readonly x: number; readonly y: number }
  | { readonly type: 'attack'; readonly target: number };

export interface Status {
  kind: StatusKind;
  ticks: number;
}

export interface Entity {
  id: number;
  side: number;
  kind: string;
  x: number;
  y: number;
  hp: number;
  /** Accumulated movement points. */
  mp: number;
  /** Ticks until the weapon is ready (0 = ready). */
  cooldown: number;
  order: Order;
  status: Status[];
  /** Beam weapons: current target and consecutive-tick stacks. */
  beam: { target: number; stacks: number } | null;
}

export interface Projectile {
  id: number;
  side: number;
  /** Archetype id of the shooter (weapon stats come from the ruleset). */
  kind: string;
  x: number;
  y: number;
  /** Ticks until impact. */
  ticks: number;
}

export interface World {
  v: 1;
  ruleset: string;
  tick: number;
  turn: number;
  /** PRNG state (mulberry32); combat itself is deterministic and does not draw from it. */
  rng: number;
  map: GameMap;
  sides: number;
  /** Sorted by ascending id. */
  entities: Entity[];
  projectiles: Projectile[];
  nextId: number;
}

export interface Command {
  readonly side: number;
  readonly unit: number;
  readonly order: Order;
}

export type SimEvent =
  | { t: 'order'; tick: number; id: number }
  | { t: 'move'; tick: number; id: number; x: number; y: number }
  | { t: 'bump'; tick: number; id: number }
  | { t: 'fire'; tick: number; id: number; target: number }
  | { t: 'launch'; tick: number; id: number; x: number; y: number }
  | { t: 'land'; tick: number; x: number; y: number }
  | { t: 'hit'; tick: number; id: number; damage: number }
  | { t: 'destroyed'; tick: number; id: number };

export interface Scenario {
  readonly map: GameMap;
  readonly sides: number;
  readonly entities: readonly { side: number; kind: string; x: number; y: number; order?: Order }[];
  readonly seed: number;
}
