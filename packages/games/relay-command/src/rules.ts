import { isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import {
  archetypeOf,
  computeNetwork,
  createWorld,
  DEFAULT_DOCTRINE,
  initialIntel,
  isValidDoctrine,
  isValidOrder,
  isValidWorld,
  observe,
  observedCells,
  resolveTurn,
  STRATEGY_RULESET,
  validateCommand,
  type Command,
  type Doctrine,
  type Entity,
  type Order,
  type Report,
  type Ruleset,
  type SimEvent,
  type World
} from '@wp/strategy-engine';
import { DIFFICULTIES, planAi, type Difficulty } from './ai';
import { FIELD_EXERCISE, SCENARIOS, type ScenarioSpec } from './scenarios';

/** Strategy rules: orders and reports travel through the command network (coverage, order slots, fog). */
export const RULESET: Ruleset = STRATEGY_RULESET;
export const PLAYER = 0;
export const OPPONENT = 1;
const COMMAND_POST = 'command-post';
/** Weight of the Command Post in the end-of-game value comparison (it has no build cost). */
const COMMAND_POST_VALUE = 300;

export type Phase = 'plan' | 'finished';
export type Outcome = 'won' | 'lost' | 'draw';

export interface TurnLog {
  turn: number;
  plans: Command[][];
}

/**
 * Logical game state (plain JSON). `draft` holds the player's orders for the coming turn and
 * survives closing the game; `log` holds every locked plan so any game can be replayed exactly.
 */
/** Longest game: an open-ended game still running at this turn is decided on strength. */
export const MAX_TURNS = 1000;
/** Open end: this many turns in a row without any loss of strength on either side decide the game on strength. */
export const STALL_TURNS = 12;
/** Turn limits the player can choose before the first turn; `null` = open end (default). */
export const TURN_LIMITS: readonly (number | null)[] = [null, 12, 24];

/** Doctrine every mobile unit starts with: return into coverage after a turn without contact. */
export const PLAYER_DOCTRINE: Doctrine = { ...DEFAULT_DOCTRINE, lostContact: 'regroup' };

/** The scenario's world at the start of a game (both sides alike, so the start is symmetric). */
export function initialWorld(spec: ScenarioSpec, seed: number): World {
  const world = createWorld({ ...spec.scenario, seed }, RULESET);
  for (const e of world.entities) if ((archetypeOf(RULESET, e.kind)?.speed ?? 0) > 0) e.doctrine = PLAYER_DOCTRINE;
  return world;
}

export interface RcState {
  v: 5;
  seed: number;
  /** Strength of the scripted opponent (chosen when the game starts). */
  difficulty: Difficulty;
  scenario: string;
  /** `null`: open end, decided by the Command Posts, or on strength after STALL_TURNS turns without losses. */
  turnLimit: number | null;
  /** Turns in a row without any change of strength on either side (open end: see STALL_TURNS). */
  quiet: number;
  world: World;
  phase: Phase;
  draft: Command[];
  /** Events of the last resolved turn that reached the player (fog: only what was reported). */
  events: SimEvent[];
  log: TurnLog[];
  result: Outcome | null;
  conceded: boolean;
}

export const scenarioById = (id: string): ScenarioSpec | undefined => SCENARIOS.find((s) => s.id === id);

export function newGame(seed: number, spec: ScenarioSpec = FIELD_EXERCISE, difficulty: Difficulty = 'normal', turnLimit: number | null = spec.turnLimit): RcState {
  const world = initialWorld(spec, seed);
  return {
    v: 5,
    seed: normalizeSeed(seed),
    difficulty,
    scenario: spec.id,
    turnLimit,
    quiet: 0,
    world,
    phase: 'plan',
    draft: [],
    events: [],
    log: [],
    result: null,
    conceded: false
  };
}

export const unitById = (state: RcState, id: number): Entity | undefined => state.world.entities.find((e) => e.id === id);
export const draftFor = (state: RcState, id: number): Order | undefined => state.draft.find((c) => c.unit === id)?.order;

/** The doctrine a unit will follow after this turn's orders: the planned one, else its current one. */
export function doctrineFor(state: RcState, id: number): Doctrine {
  const planned = state.draft.find((c) => c.unit === id)?.doctrine;
  return planned ?? unitById(state, id)?.doctrine ?? PLAYER_DOCTRINE;
}

/** Orders the player may give this turn: the connected sources' order slots. */
export const orderSlots = (state: RcState): number => computeNetwork(state.world, RULESET, PLAYER).slots;

export type OrderRefusal =
  | 'finished'
  | 'no-slots'
  | 'unknown-unit'
  | 'not-yours'
  | 'out-of-contact'
  | 'immobile'
  | 'out-of-bounds'
  | 'impassable'
  | 'no-weapon'
  | 'bad-target'
  | 'not-visible'
  | 'bad-order';

/** Why an order cannot be planned, or `null` if it can (replacing a unit's planned order is free). */
export function orderRefusal(state: RcState, unit: number, order: Order, doctrine?: Doctrine): OrderRefusal | null {
  if (state.phase !== 'plan') return 'finished';
  const check = validateCommand(state.world, RULESET, doctrine ? { side: PLAYER, unit, order, doctrine } : { side: PLAYER, unit, order });
  if (!check.ok) return check.reason;
  const replaces = state.draft.some((c) => c.unit === unit);
  if (!replaces && state.draft.length >= orderSlots(state)) return 'no-slots';
  return null;
}

/**
 * Adds or replaces the player's order for one unit. A doctrine planned earlier in the same turn
 * is kept unless a new one is given. Returns `undefined` if the order is not allowed.
 */
export function planOrder(state: RcState, unit: number, order: Order, doctrine?: Doctrine): RcState | undefined {
  const keep = doctrine ?? state.draft.find((c) => c.unit === unit)?.doctrine;
  if (orderRefusal(state, unit, order, keep) !== null) return undefined;
  const command: Command = keep ? { side: PLAYER, unit, order, doctrine: keep } : { side: PLAYER, unit, order };
  const draft = state.draft.filter((c) => c.unit !== unit);
  draft.push(command);
  draft.sort((a, b) => a.unit - b.unit);
  return { ...state, draft };
}

/**
 * Plans a new doctrine for a unit. It travels with the unit's planned order, or with its current
 * standing order (re-issued unchanged), and uses one order slot like any other order.
 */
export function planDoctrine(state: RcState, unit: number, doctrine: Doctrine): RcState | undefined {
  const order = draftFor(state, unit) ?? unitById(state, unit)?.order;
  return order ? planOrder(state, unit, order, doctrine) : undefined;
}

/** Why a doctrine change cannot be planned, or `null` if it can. */
export function doctrineRefusal(state: RcState, unit: number, doctrine: Doctrine): OrderRefusal | null {
  const order = draftFor(state, unit) ?? unitById(state, unit)?.order;
  return order ? orderRefusal(state, unit, order, doctrine) : 'unknown-unit';
}

export function cancelOrder(state: RcState, unit: number): RcState {
  return { ...state, draft: state.draft.filter((c) => c.unit !== unit) };
}

/** Locks the player's plan, lets the opponent plan blind, and resolves both simultaneously. */
export function lockTurn(state: RcState): RcState {
  if (state.phase !== 'plan') return state;
  // The opponent plans from its own observation only (never the world or the player's draft).
  const plans = [state.draft, planAi(observe(state.world, RULESET, OPPONENT), RULESET, state.difficulty)];
  const { world, reported } = resolveTurn(state.world, RULESET, plans);
  const events = reported?.[PLAYER] ?? [];
  const changed = [PLAYER, OPPONENT].some((side) => sideValue(world, side) !== sideValue(state.world, side));
  const quiet = changed ? 0 : state.quiet + 1;
  const result = outcome(world, state.turnLimit, quiet);
  return {
    ...state,
    world,
    quiet,
    events,
    draft: [],
    log: [...state.log, { turn: state.world.turn, plans }],
    phase: result ? 'finished' : 'plan',
    result
  };
}

export function concede(state: RcState): RcState {
  if (state.phase !== 'plan') return state;
  return { ...state, phase: 'finished', result: 'lost', conceded: true, draft: [] };
}

/**
 * What the player knows (D7): own units in contact and spotted enemies as they are; everything
 * else as a ghost at its last reported position. Enemy orders and doctrines are never revealed.
 */
export interface Picture {
  /** The known world: same map and turn, entities as the player knows them. */
  world: World;
  /** Ids shown at their last reported position, with the tick of that report. */
  ghosts: ReadonlyMap<number, number>;
  /** Cells the player observes now (1 = observed). */
  observed: Uint8Array;
}

const pictureCache = new WeakMap<World, Picture>();

export function picture(world: World): Picture {
  const cached = pictureCache.get(world);
  if (cached) return cached;
  const reports: readonly Report[] = world.intel?.[PLAYER] ?? [];
  const ghosts = new Map<number, number>();
  const entities: Entity[] = [];
  for (const r of reports) {
    const actual = world.entities.find((e) => e.id === r.id);
    if (r.live && actual) {
      // Enemies: position, health and visible effects only.
      const { id, side, kind, x, y, hp, status } = actual;
      entities.push(r.side === PLAYER ? actual : { id, side, kind, x, y, hp, mp: 0, cooldown: 0, order: { type: 'hold' }, status, beam: null });
      continue;
    }
    ghosts.set(r.id, r.tick);
    entities.push({ id: r.id, side: r.side, kind: r.kind, x: r.x, y: r.y, hp: r.hp, mp: 0, cooldown: 0, order: { type: 'hold' }, status: [], beam: null });
  }
  const result: Picture = { world: { ...world, entities }, ghosts, observed: observedCells(world, RULESET, PLAYER) };
  pictureCache.set(world, result);
  return result;
}

/**
 * The last order the player sent to a unit (from the turn log), for units out of contact whose
 * current order the player cannot confirm. `undefined` if none was ever sent.
 */
export function lastSentOrder(state: RcState, id: number): Order | undefined {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const sent = state.log[i]?.plans[PLAYER]?.find((c) => c.unit === id);
    if (sent) return sent.order;
  }
  return undefined;
}

/** Turn (1-based, 0 = start) in which a report was made. */
export const reportTurn = (tick: number): number => Math.ceil(tick / RULESET.ticksPerTurn);

export const commandPost = (world: World, side: number): Entity | undefined =>
  world.entities.find((e) => e.side === side && e.kind === COMMAND_POST);

/** Remaining strength of a side: build value scaled by remaining health. */
export function sideValue(world: World, side: number): number {
  let total = 0;
  for (const e of world.entities) {
    if (e.side !== side) continue;
    const arch = archetypeOf(RULESET, e.kind);
    if (!arch) continue;
    const weight = e.kind === COMMAND_POST ? COMMAND_POST_VALUE : arch.cost;
    total += Math.floor((weight * e.hp) / arch.hp);
  }
  return total;
}

/**
 * Destroying the enemy Command Post wins at once. Otherwise remaining strength decides: at the
 * turn limit, or in an open-ended game after STALL_TURNS turns without any loss (`quiet`) or at
 * MAX_TURNS, so a game nobody can win any more still ends.
 */
export function outcome(world: World, turnLimit: number | null, quiet = 0): Outcome | null {
  const own = commandPost(world, PLAYER);
  const enemy = commandPost(world, OPPONENT);
  if (!own && !enemy) return 'draw';
  if (!enemy) return 'won';
  if (!own) return 'lost';
  const decided = turnLimit === null ? quiet >= STALL_TURNS || world.turn >= MAX_TURNS : world.turn >= turnLimit;
  if (!decided) return null;
  const diff = sideValue(world, PLAYER) - sideValue(world, OPPONENT);
  return diff > 0 ? 'won' : diff < 0 ? 'lost' : 'draw';
}

/** Re-runs the logged plans from the scenario start (bug reports, tests). */
export function replay(seed: number, log: readonly TurnLog[], spec: ScenarioSpec = FIELD_EXERCISE): World {
  let world = initialWorld(spec, seed);
  for (const entry of log) world = resolveTurn(world, RULESET, entry.plans).world;
  return world;
}

/**
 * Adds `lostContact: 'keep'` to every doctrine of an older save (draft, log, units) and to player
 * units without one: a resumed game plays on as it did (units do not start turning back
 * unannounced); 'regroup' is the default for new games only. Adds the stall counter.
 */
function withLostContact(state: Record<string, unknown>): Record<string, unknown> {
  const fix = (d: unknown): unknown => (isRecord(d) && d.lostContact === undefined ? { ...d, lostContact: 'keep' } : d);
  const fixCommand = (c: unknown): unknown => (isRecord(c) && c.doctrine !== undefined ? { ...c, doctrine: fix(c.doctrine) } : c);
  const draft = Array.isArray(state.draft) ? state.draft.map(fixCommand) : state.draft;
  const log = Array.isArray(state.log) ? state.log.map((t) => (isRecord(t) && Array.isArray(t.plans) ? { ...t, plans: t.plans.map((p) => (Array.isArray(p) ? p.map(fixCommand) : p)) } : t)) : state.log;
  const world = isRecord(state.world) && Array.isArray(state.world.entities)
    ? {
        ...state.world,
        entities: state.world.entities.map((e) =>
          isRecord(e)
            ? e.doctrine !== undefined
              ? { ...e, doctrine: fix(e.doctrine) }
              : e.side === PLAYER && (archetypeOf(RULESET, String(e.kind))?.speed ?? 0) > 0
                ? { ...e, doctrine: { ...PLAYER_DOCTRINE, lostContact: 'keep' } }
                : e
            : e
        )
      }
    : state.world;
  return { ...state, quiet: 0, draft, log, world };
}

/** A command whose order is structurally valid on a `w`×`h` map. */
const commandGuard =
  (w: number, h: number) =>
  (v: unknown): v is Command =>
    isRecord(v) && isInt(v.side, 0, 1) && isInt(v.unit, 1) && isValidOrder(v.order, w, h) && (v.doctrine === undefined || isValidDoctrine(v.doctrine));

const isTurnLog = (isCommand: (v: unknown) => v is Command) => (v: unknown): v is TurnLog =>
  isRecord(v) && isInt(v.turn, 0) && Array.isArray(v.plans) && v.plans.length === 2 && v.plans.every((p) => isArrayOf(p, isCommand));

/**
 * The world must belong to the saved scenario: same map and ruleset, only the scenario's unit
 * kinds and never more units than at the start. This keeps manipulated or foreign saves (huge
 * maps, hundreds of units) from freezing the tab.
 */
function matchesScenario(world: World, spec: ScenarioSpec): boolean {
  const { map, entities } = spec.scenario;
  if (world.ruleset !== RULESET.id || world.map.w !== map.w || world.map.h !== map.h || world.map.terrain !== map.terrain) return false;
  const kinds = new Set(entities.map((e) => e.kind));
  const n = entities.length;
  // No production yet: every entity id comes from the scenario, so reports are bounded by it too.
  // Projectiles also draw ids, at most one per unit and tick.
  const maxId = n * (1 + MAX_TURNS * RULESET.ticksPerTurn) + 1;
  if (world.turn > MAX_TURNS || world.nextId > maxId || world.entities.some((e) => e.id > n)) return false;
  if (world.intel?.some((reports) => reports.length > n || reports.some((r) => r.id > n))) return false;
  return world.entities.length <= n && world.entities.every((e) => kinds.has(e.kind)) && world.projectiles.length <= n * 4;
}

export function isValidState(value: unknown): value is RcState {
  if (!isRecord(value) || value.v !== 5 || !isUint32(value.seed) || typeof value.scenario !== 'string') return false;
  if (!isOneOf(value.difficulty, DIFFICULTIES)) return false;
  const spec = scenarioById(value.scenario);
  if (!spec || !(value.turnLimit === null || isInt(value.turnLimit, 1, MAX_TURNS)) || !isOneOf(value.phase, ['plan', 'finished'])) return false;
  if (!isInt(value.quiet, 0, MAX_TURNS)) return false;
  if (!isValidWorld(value.world, RULESET) || value.world.sides !== 2 || !matchesScenario(value.world, spec)) return false;
  const isCommand = commandGuard(value.world.map.w, value.world.map.h);
  if (!isArrayOf(value.draft, isCommand) || value.draft.some((c) => c.side !== PLAYER)) return false;
  // Bounded by the scenario (hostile saves must not freeze the tab): one command per unit and
  // plan, and at most a dozen events per unit and tick in the last turn's summary.
  const n = spec.scenario.entities.length;
  if (value.draft.length > n || !Array.isArray(value.events) || value.events.length > n * RULESET.ticksPerTurn * 12) return false;
  if (!Array.isArray(value.log) || value.log.some((t) => !isRecord(t) || !Array.isArray(t.plans) || t.plans.some((p) => !Array.isArray(p) || p.length > n))) return false;
  if (new Set(value.draft.map((c) => c.unit)).size !== value.draft.length) return false;
  if (!Array.isArray(value.events) || !value.events.every((e) => isRecord(e) && typeof e.t === 'string' && isInt(e.tick, 0))) return false;
  if (!isArrayOf(value.log, isTurnLog(isCommand)) || value.log.length !== value.world.turn) return false;
  if (typeof value.conceded !== 'boolean') return false;
  if (value.phase === 'plan') return value.result === null;
  return isOneOf(value.result, ['won', 'lost', 'draw']);
}

/**
 * Older saves continue under the current rules: version 1 (no command network) and version 2
 * (no fog) switch to the current ruleset; with fog, each side starts from what it observes now
 * plus its own units and all structures. Their logs replay exactly only up to the switch, which
 * is acceptable for an unfinished practice game. The last turn summary is dropped (it was not
 * filtered by what the player could know).
 */
export function migrateState(state: unknown, fromVersion: number): RcState | undefined {
  // Version 4 (before the lost-contact doctrine and open end): doctrines keep their old meaning
  // (carry on out of contact); player units without a doctrine get the current default.
  if (fromVersion === 4) {
    if (!isRecord(state) || state.v !== 4) return undefined;
    const migrated = withLostContact({ ...state, v: 5 });
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 3 (before difficulty levels) plays on at 'normal'.
  if (fromVersion === 3) {
    if (!isRecord(state) || state.v !== 3) return undefined;
    const migrated = withLostContact({ ...state, v: 5, difficulty: 'normal' });
    return isValidState(migrated) ? migrated : undefined;
  }
  if ((fromVersion !== 1 && fromVersion !== 2) || !isRecord(state) || state.v !== fromVersion || !isRecord(state.world)) return undefined;
  const world: Record<string, unknown> = { ...state.world, ruleset: RULESET.id };
  delete world.intel;
  if (!isValidWorld(world, { ...RULESET, fog: false })) return undefined;
  const migrated = withLostContact({ ...state, v: 5, difficulty: 'normal', events: [], world: { ...world, intel: initialIntel(world as unknown as World, RULESET) } });
  if (!isValidState(migrated)) return undefined;
  // Version 1 had no order limit or coverage: keep only the planned orders that are still allowed.
  let replanned: RcState = { ...migrated, draft: [] };
  for (const c of migrated.draft) replanned = planOrder(replanned, c.unit, c.order, c.doctrine) ?? replanned;
  return replanned;
}
