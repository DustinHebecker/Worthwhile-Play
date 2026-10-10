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

/** Command-network role of an archetype (docs/design/strategy.md § 5). */
export interface CommsSpec {
  /** `source` originates command (HQ, field post); `relay` only extends a connected network. */
  readonly role: 'source' | 'relay';
  /** Link and coverage radius in cells (squared-distance comparison). */
  readonly radius: number;
  /** Orders per turn a connected source contributes (0 for relays). */
  readonly orderSlots: number;
  /** Mobile node that only works after a full turn of deploying in place. */
  readonly needsDeploy: boolean;
}

/** Electronic warfare role of an archetype (docs/design/strategy.md § 6). */
export interface EwSpec {
  /**
   * `jammer`: once set up, enemy network nodes within `radius` cannot relay and enemy units
   * there cannot receive orders; it is visible to the enemy as an emitter within
   * EMITTER_EXPOSURE. `tracer`: locates enemy emitters (active nodes and jammers) within
   * `radius`, and friendly links within `burnThrough` of it ignore jamming.
   */
  readonly role: 'jammer' | 'tracer';
  readonly radius: number;
  readonly burnThrough: number;
  /** Works only after a full turn of deploying in place (like a mast truck). */
  readonly needsDeploy: boolean;
}

export interface Archetype {
  readonly id: string;
  readonly hp: number;
  readonly armor: ArmorClass;
  readonly layer: Layer;
  /** Movement points gained per tick; 0 = static (structure / tower). */
  readonly speed: number;
  readonly vision: number;
  /** Supply it costs to produce or build (also its value in strength comparisons). */
  readonly cost: number;
  /** Turns to produce (units) or construct (structures); 0 = cannot be produced or built. */
  readonly buildTurns: number;
  /** Supply per turn while connected to the own network (economy rulesets, D8). */
  readonly income: number;
  /** Must stand on a deposit and draws its income from it (an Extractor). */
  readonly extractor: boolean;
  /** Archetype ids this structure can produce (`produce` order), or null. */
  readonly production: readonly string[] | null;
  readonly weapon: WeaponSpec | null;
  readonly comms: CommsSpec | null;
  readonly ew: EwSpec | null;
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
  /**
   * When true, orders reach only units inside their side's command coverage, and each side may
   * issue at most its connected sources' order slots per batch (strategy mode).
   */
  readonly commandNetwork: boolean;
  /** Extra radius for static relays standing on terrain with a range bonus (hills). */
  readonly relayHillBonus: number;
  /**
   * Information model D7: each side knows only what its reporting units see (with a command
   * network: units inside the own coverage). Out-of-sight entities are remembered at their last
   * reported position (`World.intel`), and weapons only engage targets that are spotted.
   */
  readonly fog: boolean;
  /**
   * Economy (D8): each side holds Supply, income arrives on the last tick of a turn from
   * connected posts and extractors on deposits, yards produce units and sources place structures.
   */
  readonly economy: boolean;
  /** Supply each side starts with (economy rulesets). */
  readonly startSupply: number;
}

/** A finite source of Supply on the map; an Extractor on it draws `left` down (D8). */
export interface Deposit {
  x: number;
  y: number;
  left: number;
}

export interface GameMap {
  readonly w: number;
  readonly h: number;
  /** Row-major, one terrain character per cell. */
  readonly terrain: string;
  /** Economy rulesets: deposits, sorted by cell (row-major); absent = none. */
  readonly deposits?: Deposit[];
}

export type Order =
  | { readonly type: 'hold' }
  | { readonly type: 'move'; readonly x: number; readonly y: number }
  | { readonly type: 'attack'; readonly target: number }
  /** Stay in place and set up as a network node (completes after one turn of ticks). */
  | { readonly type: 'deploy' }
  /** Stay within two cells of a friendly unit or structure and fight what comes near (escort / guard). */
  | { readonly type: 'escort'; readonly target: number }
  /** Walk to (x, y), then back to (rx, ry), and so on. */
  | { readonly type: 'patrol'; readonly x: number; readonly y: number; readonly rx: number; readonly ry: number }
  /** Return to the nearest cell inside the own command coverage, then hold. */
  | { readonly type: 'regroup' }
  /** Economy: a yard queues one unit of `kind` (paid at once; the standing order is unchanged). */
  | { readonly type: 'produce'; readonly kind: string }
  /** Economy: a command source places a structure of `kind` on a free covered cell (paid at once). */
  | { readonly type: 'build'; readonly kind: string; readonly x: number; readonly y: number };

export const TARGET_PRIORITIES = ['weakest', 'nearest', 'armor', 'infantry', 'structures', 'emitters'] as const;
export type TargetPriority = (typeof TARGET_PRIORITIES)[number];
export const RETREAT_THRESHOLDS = [0, 25, 50, 75] as const;
export type RetreatThreshold = (typeof RETREAT_THRESHOLDS)[number];

/**
 * Standing modifiers a unit follows on its own, also when out of contact (D6,
 * docs/design/strategy.md § 7).
 */
export interface Doctrine {
  /** Switch to `regroup` when health drops below this percentage (0 = never). */
  readonly retreatBelow: RetreatThreshold;
  /** Which enemy in range to shoot first. */
  readonly priority: TargetPriority;
  /** When not travelling, step onto an adjacent cover cell (forest, buildings). */
  readonly seekCover: boolean;
  /** Return fire only: shoot only after being hit within the last turn, or at an ordered target. */
  readonly holdFire: boolean;
  /**
   * What to do after a whole turn without radio contact: `regroup` (return into coverage) or
   * `keep` (carry on with the standing order, e.g. for a deliberate deep push).
   */
  readonly lostContact: LostContact;
}

export const LOST_CONTACT = ['regroup', 'keep'] as const;
export type LostContact = (typeof LOST_CONTACT)[number];

/** Engine default: a unit without a doctrine carries on out of contact (games may give their units another). */
export const DEFAULT_DOCTRINE: Doctrine = { retreatBelow: 0, priority: 'weakest', seekCover: false, holdFire: false, lostContact: 'keep' };

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
  /** Ticks spent deploying (nodes with `needsDeploy`); absent = 0. Active once it reaches ticksPerTurn. */
  deploy?: number;
  /** Standing modifiers; absent = DEFAULT_DOCTRINE. */
  doctrine?: Doctrine;
  /** Tick at which the unit last took damage (for return-fire doctrine). */
  hitAt?: number;
  /** Consecutive ticks the unit's move was blocked by other units (see DEADLOCK_TICKS). */
  bumps?: number;
  /** Consecutive ticks without any way to its goal (see UNREACHABLE_TICKS). */
  stuck?: number;
  /**
   * Progress towards the current movement goal: `goal` is its cell index, or for attacks the
   * cell count plus the target id; the lowest remaining route cost reached and the ticks since
   * it last fell (see STALL_TICKS).
   */
  stall?: { goal: number; best: number; ticks: number };
  /** Cell the unit left with its last step (it does not step straight back if it can help it). */
  prev?: number;
  /** Consecutive ticks outside the own command coverage (doctrine `lostContact`); absent = 0. */
  noContact?: number;
  /** Production queue of a yard: units in order, `left` turns each; at most MAX_QUEUE. */
  queue?: QueueItem[];
  /** Turns of construction left on a structure site (inactive until 0, then absent). */
  build?: number;
}

export interface QueueItem {
  kind: string;
  left: number;
}

/** Longest production queue of a yard. */
export const MAX_QUEUE = 2;

/** Most Supply a side can hold (income beyond it is lost; keeps every save valid). */
export const MAX_SUPPLY = 1_000_000;

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

/**
 * What one side last learned about an entity (own or enemy). `live` = observed in the latest
 * vision update; otherwise this is a ghost at the last reported position.
 */
export interface Report {
  id: number;
  side: number;
  kind: string;
  x: number;
  y: number;
  hp: number;
  /** Tick of the last observation. */
  tick: number;
  live: boolean;
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
  /** Economy rulesets only: Supply per side. */
  supply?: number[];
  /** Sorted by ascending id. */
  entities: Entity[];
  projectiles: Projectile[];
  nextId: number;
  /** Fog rulesets only: per side, the reports it holds, sorted by ascending id. */
  intel?: Report[][];
}

export interface Command {
  readonly side: number;
  readonly unit: number;
  readonly order: Order;
  /** Replaces the unit's doctrine together with the order (same order slot). */
  readonly doctrine?: Doctrine;
}

export type SimEvent =
  | { t: 'order'; tick: number; id: number }
  | { t: 'move'; tick: number; id: number; x: number; y: number }
  | { t: 'bump'; tick: number; id: number }
  | { t: 'fire'; tick: number; id: number; target: number }
  | { t: 'launch'; tick: number; id: number; x: number; y: number }
  | { t: 'land'; tick: number; x: number; y: number }
  | { t: 'hit'; tick: number; id: number; side: number; damage: number }
  | { t: 'destroyed'; tick: number; id: number; side: number; kind: string; x: number; y: number }
  /** A standing order changed without a command: why (never silently). */
  | { t: 'order-ended'; tick: number; id: number; reason: OrderEndReason }
  /** Economy: Supply that reached a side at the end of a turn (reported to that side only). */
  | { t: 'income'; tick: number; side: number; amount: number }
  /** A yard (`id`) queued a unit. */
  | { t: 'queued'; tick: number; id: number; kind: string }
  /** A yard (`by`) finished a unit, standing on (x, y). */
  | { t: 'produced'; tick: number; id: number; side: number; kind: string; x: number; y: number; by: number }
  /** A structure site was placed (`id`), or finished (`built`). */
  | { t: 'site'; tick: number; id: number; side: number; kind: string; x: number; y: number }
  | { t: 'built'; tick: number; id: number }
  /**
   * A placement the side's knowledge allowed but the cell turned out taken (a hidden unit, a
   * deposit run dry, or both sides placing on it in the same batch): refused unpaid, no slot used.
   * Reported to the placing side only.
   */
  | { t: 'site-blocked'; tick: number; side: number; kind: string; x: number; y: number };

/**
 * Why the engine replaced a unit's standing order on its own:
 * `arrived` (move done), `occupied` (destination held by a unit that will not leave),
 * `unreachable` (no way there for a whole turn), `blocked` (blocked by moving units for three
 * turns), `lost-target` (target or charge gone), `retreat` (doctrine), `regrouped` (back in coverage),
 * `outpaced` (an attacker could not close in on its target for three turns), `lost-contact` (a
 * whole turn without radio contact; the unit returns into coverage, doctrine).
 */
export type OrderEndReason = 'arrived' | 'occupied' | 'unreachable' | 'blocked' | 'lost-target' | 'retreat' | 'regrouped' | 'outpaced' | 'lost-contact';

export interface Scenario {
  readonly map: GameMap;
  readonly sides: number;
  readonly entities: readonly { side: number; kind: string; x: number; y: number; order?: Order }[];
  readonly seed: number;
  /** Economy rulesets: Supply per side at the start (default: the ruleset's `startSupply`). */
  readonly supply?: readonly number[];
}
