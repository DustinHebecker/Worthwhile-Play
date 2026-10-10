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
  type CommandRefusal,
  type Doctrine,
  type Entity,
  type Order,
  type Report,
  type Ruleset,
  type SimEvent,
  type World,
  spawn
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
/**
 * Open end (stalemate rule): once the armies have met (the first hit) or from CONTACT_TURN on,
 * a game in which the trailing side has not closed the gap in strength by more than STALL_MARGIN
 * for STALL_TURNS turns in a row is decided on strength. Fights that change nothing (a unit sent
 * in and lost) do not keep a game going; a comeback does.
 */
export const STALL_TURNS = 12;
/** Turn from which the stalemate rule counts even if no shot has been fired. */
export const CONTACT_TURN = 30;
/** Change in the lead (strength points) below which a turn counts as no progress for the trailing side. */
export const STALL_MARGIN = 50;
/** Most units or sites one side can add per turn (one order slot each; the Command Post has four, a Field Post two). */
const PRODUCTION_PER_TURN = 6;
/** Bound for strength values in saves (Supply cap plus far more than any army). */
const MAX_STRENGTH = 10_000_000;
/** Turn limits the player can choose before the first turn; `null` = open end (default). */
export const TURN_LIMITS: readonly (number | null)[] = [null, 12, 24];

/** Doctrine every mobile unit starts with: return into coverage after a turn without contact. */
export const PLAYER_DOCTRINE: Doctrine = { ...DEFAULT_DOCTRINE, lostContact: 'regroup' };

/** The scenario's world at the start of a game (both sides alike, so the start is symmetric). */
export function initialWorld(spec: ScenarioSpec, seed: number): World {
  const world = createWorld({ ...spec.scenario, seed }, RULESET);
  // Mobile units follow it; yards carry it so the units they produce follow it too.
  for (const e of world.entities) {
    const arch = archetypeOf(RULESET, e.kind);
    if ((arch?.speed ?? 0) > 0 || arch?.production) e.doctrine = PLAYER_DOCTRINE;
  }
  return world;
}

export interface RcState {
  v: 6;
  seed: number;
  /** Strength of the scripted opponent (chosen when the game starts). */
  difficulty: Difficulty;
  scenario: string;
  /** `null`: open end, decided by the Command Posts, or on strength by the stalemate rule (STALL_TURNS). */
  turnLimit: number | null;
  /**
   * Stalemate record: the player's lead in strength at the end of each turn since the trailing
   * side last gained ground (empty until the stalemate rule counts; see STALL_TURNS).
   */
  lead: number[];
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
    v: 6,
    seed: normalizeSeed(seed),
    difficulty,
    scenario: spec.id,
    turnLimit,
    lead: [],
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
/** Production and placement are one-shot commands: a structure may give several per turn, each costs a slot. */
export const isOneShot = (order: Order): boolean => order.type === 'produce' || order.type === 'build';
/** The standing order planned for a unit this turn (one-shot commands are listed by `plannedJobs`). */
export const draftFor = (state: RcState, id: number): Order | undefined => state.draft.find((c) => c.unit === id && !isOneShot(c.order))?.order;
/** The one-shot commands (produce, build) planned for a structure this turn, in order. */
export const plannedJobs = (state: RcState, id: number): Command[] => state.draft.filter((c) => c.unit === id && isOneShot(c.order));

/** The doctrine a unit will follow after this turn's orders: the planned one, else its current one. */
export function doctrineFor(state: RcState, id: number): Doctrine {
  const planned = state.draft.find((c) => c.unit === id)?.doctrine;
  return planned ?? unitById(state, id)?.doctrine ?? PLAYER_DOCTRINE;
}

/** Orders the player may give this turn: the connected sources' order slots. */
export const orderSlots = (state: RcState): number => computeNetwork(state.world, RULESET, PLAYER).slots;

export type OrderRefusal = 'finished' | 'no-slots' | CommandRefusal;

/** Why an order cannot be planned, or `null` if it can (replacing a unit's planned order is free). */
export function orderRefusal(state: RcState, unit: number, order: Order, doctrine?: Doctrine): OrderRefusal | null {
  if (state.phase !== 'plan') return 'finished';
  // One-shot commands are checked against the world as the planned ones leave it (Supply spent,
  // queues filled), so the player cannot plan more than can be paid for.
  const world = isOneShot(order) ? afterJobs(state) : state.world;
  const check = validateCommand(world, RULESET, doctrine ? { side: PLAYER, unit, order, doctrine } : { side: PLAYER, unit, order });
  if (!check.ok) return check.reason;
  const replaces = !isOneShot(order) && state.draft.some((c) => c.unit === unit && !isOneShot(c.order));
  if (!replaces && state.draft.length >= orderSlots(state)) return 'no-slots';
  return null;
}

/** The world as the planned one-shot commands leave it: Supply paid and queues filled (sites are not placed: cells stay checked). */
function afterJobs(state: RcState): World {
  const world = structuredClone(state.world);
  for (const c of state.draft) {
    if (!isOneShot(c.order) || c.order.type === 'hold') continue;
    const arch = archetypeOf(RULESET, (c.order as { kind: string }).kind);
    if (world.supply) world.supply[PLAYER] = (world.supply[PLAYER] ?? 0) - (arch?.cost ?? 0);
    if (c.order.type === 'produce') {
      const yard = world.entities.find((e) => e.id === c.unit);
      if (yard) (yard.queue ??= []).push({ kind: c.order.kind, left: 1 });
    } else if (c.order.type === 'build' && arch) {
      // The planned site takes its cell, so a second placement there is refused while planning.
      const site = spawn(world.nextId++, PLAYER, arch, c.order.x, c.order.y);
      site.build = arch.buildTurns;
      world.entities.push(site);
      world.intel?.[PLAYER]?.push({ id: site.id, side: PLAYER, kind: site.kind, x: site.x, y: site.y, hp: site.hp, tick: world.tick, live: false });
    }
  }
  return world;
}

/** Supply left to plan with this turn: the side's Supply minus what the planned jobs cost. */
export const plannedSupply = (state: RcState): number => afterJobs(state).supply?.[PLAYER] ?? 0;

/**
 * Adds or replaces the player's order for one unit. A doctrine planned earlier in the same turn
 * is kept unless a new one is given. Returns `undefined` if the order is not allowed.
 */
export function planOrder(state: RcState, unit: number, order: Order, doctrine?: Doctrine): RcState | undefined {
  const oneShot = isOneShot(order);
  const keep = oneShot ? undefined : (doctrine ?? state.draft.find((c) => c.unit === unit && !isOneShot(c.order))?.doctrine);
  if (orderRefusal(state, unit, order, keep) !== null) return undefined;
  const command: Command = keep ? { side: PLAYER, unit, order, doctrine: keep } : { side: PLAYER, unit, order };
  // A standing order replaces the unit's planned one; a one-shot command is added (stable order).
  const draft = oneShot ? [...state.draft] : state.draft.filter((c) => c.unit !== unit || isOneShot(c.order));
  draft.push(command);
  draft.sort((a, b) => a.unit - b.unit);
  return { ...state, draft };
}

/** Removes the `index`-th planned one-shot command of a structure (production or placement). */
export function cancelJob(state: RcState, unit: number, index: number): RcState {
  const jobs = plannedJobs(state, unit);
  const job = jobs[index];
  return job ? { ...state, draft: state.draft.filter((c) => c !== job) } : state;
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
  const { world, events: all, reported } = resolveTurn(state.world, RULESET, plans);
  const events = reported?.[PLAYER] ?? [];
  // The stalemate rule exists only for open-ended games (a turn limit ends the others).
  const fought = all.some((e) => e.t === 'hit');
  const counting = state.turnLimit === null && (fought || state.lead.length > 0 || world.turn >= CONTACT_TURN);
  // Shelling the leader's Command Post is pressure even before it shows in the lead: count anew.
  const leader = Math.sign(state.lead.at(-1) ?? 0) > 0 ? PLAYER : Math.sign(state.lead.at(-1) ?? 0) < 0 ? OPPONENT : undefined;
  const leaderPost = leader === undefined ? undefined : commandPost(state.world, leader)?.id;
  const pressed = leaderPost !== undefined && all.some((e) => e.t === 'hit' && e.id === leaderPost);
  const lead = nextLead(pressed ? [] : state.lead, world, counting);
  const result = outcome(world, state.turnLimit, lead);
  return {
    ...state,
    world,
    lead,
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
/**
 * A side's strength: units and structures at cost scaled by health (the Command Post counts
 * COMMAND_POST_VALUE), plus banked Supply and what its yards have been paid for. Spending is
 * neutral (Supply turns into a unit or a site of the same value); income and losses are not.
 */
export function sideValue(world: World, side: number): number {
  let total = world.supply?.[side] ?? 0;
  for (const e of world.entities) {
    if (e.side !== side) continue;
    const arch = archetypeOf(RULESET, e.kind);
    if (!arch) continue;
    const weight = e.kind === COMMAND_POST ? COMMAND_POST_VALUE : arch.cost;
    total += Math.floor((weight * e.hp) / arch.hp);
    for (const q of e.queue ?? []) total += archetypeOf(RULESET, q.kind)?.cost ?? 0;
  }
  return total;
}

/** Whether a stretch from lead `from` to lead `to` brought the trailing side no real progress. */
export const stalled = (from: number, to: number): boolean =>
  Math.abs(to - from) <= STALL_MARGIN || (Math.sign(to) === Math.sign(from) && Math.abs(to) >= Math.abs(from));

/** The stalemate record after a turn: restarts whenever the trailing side gained ground. */
function nextLead(lead: readonly number[], world: World, counting: boolean): number[] {
  if (!counting) return [];
  const now = sideValue(world, PLAYER) - sideValue(world, OPPONENT);
  const start = lead[0];
  return start !== undefined && stalled(start, now) ? [...lead, now].slice(0, STALL_TURNS + 1) : [now];
}

/** Turns the stalemate rule has counted without progress (decides at STALL_TURNS). */
export const stalemateTurns = (state: Pick<RcState, 'lead'>): number => Math.max(0, state.lead.length - 1);

/**
 * Destroying the enemy Command Post wins at once. Otherwise strength decides: at the turn limit,
 * or in an open-ended game by the stalemate rule (`lead`, STALL_TURNS turns without the trailing
 * side gaining ground) or at MAX_TURNS, so a game nobody can win any more still ends.
 */
export function outcome(world: World, turnLimit: number | null, lead: readonly number[] = []): Outcome | null {
  const own = commandPost(world, PLAYER);
  const enemy = commandPost(world, OPPONENT);
  if (!own && !enemy) return 'draw';
  if (!enemy) return 'won';
  if (!own) return 'lost';
  const decided = turnLimit === null ? stalemateTurns({ lead: [...lead] }) >= STALL_TURNS || world.turn >= MAX_TURNS : world.turn >= turnLimit;
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

/** Switches an older save's world to the current ruleset and gives each side the starting Supply if it has none. */
function withEconomy(state: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(state.world)) return state;
  const sides = typeof state.world.sides === 'number' ? state.world.sides : 2;
  const supply = Array.isArray(state.world.supply) ? state.world.supply : Array.from({ length: sides }, () => RULESET.startSupply);
  // The old quiet count meant something else (turns without losses): the stalemate rule starts afresh.
  const { quiet: _quiet, ...rest } = state;
  void _quiet;
  return { ...rest, lead: [], world: { ...state.world, ruleset: RULESET.id, supply } };
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
  return { ...state, lead: [], draft, log, world };
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
  // Deposits: the scenario's cells (or none, for maps from before the economy), never fuller than at the start.
  const deposits = world.map.deposits ?? [];
  const start = map.deposits ?? [];
  if (deposits.length > 0 && (deposits.length !== start.length || deposits.some((d) => !start.some((o) => o.x === d.x && o.y === d.y && d.left <= o.left)))) return false;
  // Kinds: the scenario's, plus anything a yard produces or a source builds.
  const kinds = new Set([...entities.map((e) => e.kind), ...Object.values(RULESET.archetypes).filter((a) => a.buildTurns > 0).map((a) => a.id)]);
  // Entities: the scenario's plus what the economy can add — at most the order slots per side
  // and turn (each unit or site costs one order), so a hostile save cannot carry a horde.
  const n = entities.length + world.turn * world.sides * PRODUCTION_PER_TURN;
  // Entity ids are bounded by that too; projectiles draw ids as well, at most one per unit and tick.
  const maxId = n * (1 + MAX_TURNS * RULESET.ticksPerTurn) + 1;
  if (world.turn > MAX_TURNS || world.nextId > maxId || world.entities.some((e) => e.id > n)) return false;
  if (world.intel?.some((reports) => reports.length > n || reports.some((r) => r.id > n))) return false;
  return world.entities.length <= n && world.entities.every((e) => kinds.has(e.kind)) && world.projectiles.length <= n * 4;
}

export function isValidState(value: unknown): value is RcState {
  if (!isRecord(value) || value.v !== 6 || !isUint32(value.seed) || typeof value.scenario !== 'string') return false;
  if (!isOneOf(value.difficulty, DIFFICULTIES)) return false;
  const spec = scenarioById(value.scenario);
  if (!spec || !(value.turnLimit === null || isInt(value.turnLimit, 1, MAX_TURNS)) || !isOneOf(value.phase, ['plan', 'finished'])) return false;
  if (!isValidWorld(value.world, RULESET) || value.world.sides !== 2 || !matchesScenario(value.world, spec)) return false;
  // The stalemate record holds at most one entry per turn played and never more than decides a game.
  if (!isArrayOf(value.lead, (v) => isInt(v, -MAX_STRENGTH, MAX_STRENGTH)) || value.lead.length > Math.min(value.world.turn, STALL_TURNS + 1)) return false;
  if (value.turnLimit !== null && value.lead.length > 0) return false; // only open-ended games keep a stalemate record
  const isCommand = commandGuard(value.world.map.w, value.world.map.h);
  if (!isArrayOf(value.draft, isCommand) || value.draft.some((c) => c.side !== PLAYER)) return false;
  // Bounded by the scenario (hostile saves must not freeze the tab): one command per unit and
  // plan, and at most a dozen events per unit and tick in the last turn's summary.
  const n = spec.scenario.entities.length;
  if (value.draft.length > n || !Array.isArray(value.events) || value.events.length > n * RULESET.ticksPerTurn * 12) return false;
  if (!Array.isArray(value.log) || value.log.some((t) => !isRecord(t) || !Array.isArray(t.plans) || t.plans.some((p) => !Array.isArray(p) || p.length > n))) return false;
  const standing = value.draft.filter((c) => !isOneShot(c.order));
  if (new Set(standing.map((c) => c.unit)).size !== standing.length) return false;
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
  // Version 5 (before the economy): the world gets the starting Supply; its map has no deposits
  // and no yards, so the game plays on as it did (nothing to build on, posts still yield).
  if (fromVersion === 5) {
    if (!isRecord(state) || state.v !== 5) return undefined;
    const migrated = withEconomy({ ...state, v: 6 });
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 4 (before the lost-contact doctrine and open end): doctrines keep their old meaning
  // (carry on out of contact); player units without a doctrine get the current default.
  if (fromVersion === 4) {
    if (!isRecord(state) || state.v !== 4) return undefined;
    const migrated = withEconomy(withLostContact({ ...state, v: 6 }));
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 3 (before difficulty levels) plays on at 'normal'.
  if (fromVersion === 3) {
    if (!isRecord(state) || state.v !== 3) return undefined;
    const migrated = withEconomy(withLostContact({ ...state, v: 6, difficulty: 'normal' }));
    return isValidState(migrated) ? migrated : undefined;
  }
  if ((fromVersion !== 1 && fromVersion !== 2) || !isRecord(state) || state.v !== fromVersion || !isRecord(state.world)) return undefined;
  const world: Record<string, unknown> = { ...state.world, ruleset: RULESET.id };
  delete world.intel;
  delete world.supply;
  if (!isValidWorld(world, { ...RULESET, fog: false, economy: false })) return undefined;
  const migrated = withEconomy(withLostContact({ ...state, v: 6, difficulty: 'normal', events: [], world: { ...world, intel: initialIntel(world as unknown as World, RULESET) } }));
  if (!isValidState(migrated)) return undefined;
  // Version 1 had no order limit or coverage: keep only the planned orders that are still allowed.
  let replanned: RcState = { ...migrated, draft: [] };
  for (const c of migrated.draft) replanned = planOrder(replanned, c.unit, c.order, c.doctrine) ?? replanned;
  return replanned;
}
