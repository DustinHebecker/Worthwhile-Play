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
  retire,
  STRATEGY_RULESET,
  validateCommand,
  NEUTRAL,
  isOneShotOrder,
  repairPrice,
  sellRefund,
  type Command,
  type CommandRefusal,
  type Deposit,
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
import { FIELD_EXERCISE, opponentCounts, SCENARIOS, scenarioFor, type ScenarioSpec } from './scenarios';
import { customSpec, isValidMap, mapIssues, MAP_SLOTS, type EditMap } from './maps';

/** Strategy rules: orders and reports travel through the command network (coverage, order slots, fog). */
export const RULESET: Ruleset = STRATEGY_RULESET;
/**
 * Several sides (docs/design/strategy.md § 9.4): the same rules plus capture and elimination —
 * Command Posts change hands, and a side without one is out. Used when a game has more than one
 * opponent or a neutral post; the two-side game keeps RULESET (its measured behaviour).
 */
export const SIDES_RULESET: Ruleset = { ...STRATEGY_RULESET, id: `${STRATEGY_RULESET.id}-sides`, capture: true };
export const PLAYER = 0;
/** The opponent of a two-side game (with several opponents: sides 1…n). */
export const OPPONENT = 1;
/** Most opponents a game can have (the engine's eight sides). */
export const MAX_OPPONENTS = 7;
const COMMAND_POST = 'command-post';
/** Weight of the Command Post in the end-of-game value comparison (it has no build cost). */
const COMMAND_POST_VALUE = 300;

export type Phase = 'plan' | 'finished';
export type Outcome = 'won' | 'lost' | 'draw';

export interface TurnLog {
  turn: number;
  plans: Command[][];
  /** Sides that gave up (hot-seat) before this turn was resolved: retired first on replay. */
  retired?: number[];
}

/** Who plays a side: a person at this device (hot-seat) or the computer. */
export type Seat = 'person' | 'computer';
export const SEATS: readonly Seat[] = ['person', 'computer'];

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

/** The rules of a game: capture and elimination once there are several opponents or a neutral post. */
export const rulesetFor = (spec: ScenarioSpec, opponents: number): Ruleset =>
  opponents > 1 || (scenarioFor(spec, opponents)?.entities.some((e) => e.side === NEUTRAL) ?? false) ? SIDES_RULESET : RULESET;
/** The rules of a running game. */
export const rulesOf = (state: Pick<RcState, 'scenario' | 'map' | 'opponents'>): Ruleset => {
  const spec = specOf(state);
  return spec ? rulesetFor(spec, state.opponents) : RULESET;
};

/** The scenario's world at the start of a game (every side alike, so the start is fair); `endless`: no deposit runs dry. */
export function initialWorld(spec: ScenarioSpec, seed: number, opponents = 1, endless = false): World {
  const scenario = scenarioFor(spec, opponents);
  if (!scenario) throw new RangeError(`${spec.id} has no layout for ${opponents} opponents.`);
  const rules = rulesetFor(spec, opponents);
  const map = endless && scenario.map.deposits ? { ...scenario.map, deposits: scenario.map.deposits.map((d) => ({ ...d, endless: true as const })) } : scenario.map;
  const world = createWorld({ ...scenario, map, seed }, rules);
  // Mobile units follow it; yards carry it so the units they produce follow it too.
  for (const e of world.entities) {
    const arch = archetypeOf(RULESET, e.kind);
    if ((arch?.speed ?? 0) > 0 || arch?.production) e.doctrine = PLAYER_DOCTRINE;
  }
  return world;
}

/** A generated map's recipe (I6c): the same size and seed always give the same map. */
export interface RandomMap {
  w: number;
  h: number;
  seed: number;
}

/** Sizes offered for a random map in the setup (small to the largest the editor allows). */
export const RANDOM_SIZES: readonly (readonly [number, number])[] = [
  [12, 10],
  [16, 12],
  [20, 14],
  [24, 16]
];

/** Opponent counts offered for a random map: one plays a two-side map, two or three a map with four bases. */
export const RANDOM_OPPONENTS: readonly number[] = [1, 2, 3];

export interface RcState {
  v: 12;
  seed: number;
  /** Number of computer opponents (sides 1…n; 1 for two-side maps). */
  opponents: number;
  /** Strength of the scripted opponent (chosen when the game starts). */
  difficulty: Difficulty;
  scenario: string;
  /** `null`: open end, decided by the Command Posts (or giving up); see also `quick`. */
  turnLimit: number | null;
  /** Quick match (open end only): the stalemate rule also decides on strength (STALL_TURNS). */
  quick: boolean;
  /** Game option (owner decision 2026-10-14): no deposit runs dry in this game. */
  endless: boolean;
  /** The recipe (size, map number) the map of this game was generated from, or null; a label: `map` is authoritative. */
  random: RandomMap | null;
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
  /** The player ended a stalled open-ended game on strength (`settle`). */
  settled: boolean;
  /** The player-made map this game runs on (`scenario` is then 'custom'), or null for a built-in one. */
  map: EditMap | null;
  /** The map editor's open draft (kept in the save, so editing can be closed and resumed), or null. */
  edit: MapDraft | null;
  /**
   * Hot-seat (docs/design/strategy.md § 9.4): who plays each side. Side 0 is always a person;
   * with one person this is the single-player game, unchanged.
   */
  seats: Seat[];
  /** The person side whose plan is open (`draft` is its plan, `events` its summary); 0 with one person. */
  planning: number;
  /** Hot-seat: the device is to be passed to the `planning` side; nothing of any side is shown until it confirms. */
  handover: boolean;
  /** Hot-seat: plans already locked this turn (final for that person), per side; empty for the others. */
  locked: Command[][];
  /** Hot-seat: the last turn's summary of each person still to plan this turn (shown when it is their turn). */
  inbox: SimEvent[][];
  /** Hot-seat: sides that gave up this turn; logged with the turn so a replay retires them first. */
  retired: number[];
  /** Hot-seat: the side that won, or null (draw, or a single-player game: see `result`). */
  winner: number | null;
}

/** A map being edited: the map, the library slot it came from (null = not saved yet), and mirror mode. */
export interface MapDraft {
  map: EditMap;
  slot: number | null;
  mirror: boolean;
}

export const scenarioById = (id: string): ScenarioSpec | undefined => SCENARIOS.find((s) => s.id === id);

/** The scenario a game runs on: its player-made map, else the built-in one. */
export const specOf = (state: Pick<RcState, 'scenario' | 'map'>): ScenarioSpec | undefined => (state.map ? customSpec(state.map) : scenarioById(state.scenario));

export function newGame(seed: number, base: ScenarioSpec = FIELD_EXERCISE, difficulty: Difficulty = 'normal', turnLimit: number | null = base.turnLimit, quick = false, map: EditMap | null = null, opponents = 1, seats: readonly Seat[] = [], endless = false, random: RandomMap | null = null): RcState {
  const spec = map ? customSpec(map) : base;
  // Only the counts the map declares (two-side maps and player-made ones: one).
  const count = opponentCounts(spec).includes(opponents) ? opponents : 1;
  const world = initialWorld(spec, seed, count, endless);
  // Side 0 is always a person; seats not given are the computer's.
  const seating: Seat[] = Array.from({ length: count + 1 }, (_, side) => (side === PLAYER ? 'person' : seats[side] === 'person' ? 'person' : 'computer'));
  const several = seating.filter((x) => x === 'person').length > 1;
  return {
    v: 12,
    seed: normalizeSeed(seed),
    opponents: count,
    difficulty,
    scenario: spec.id,
    turnLimit,
    // Hot-seat has no quick match: an open end is decided by the posts or giving up.
    quick: turnLimit === null && quick && !several,
    endless,
    random: map && random ? { ...random } : null,
    lead: [],
    world,
    phase: 'plan',
    draft: [],
    events: [],
    log: [],
    result: null,
    conceded: false,
    settled: false,
    map,
    edit: null,
    seats: seating,
    planning: PLAYER,
    handover: false,
    locked: seating.map(() => []),
    inbox: seating.map(() => []),
    retired: [],
    winner: null
  };
}

/** Whether a game has several persons at one device (hot-seat): a fixed property of the game. */
export const isHotSeat = (state: Pick<RcState, 'seats'>): boolean => state.seats.filter((x) => x === 'person').length > 1;

/** The person sides still in the game, in side order. */
export const personsLeft = (state: Pick<RcState, 'seats' | 'world'>): number[] =>
  state.seats.flatMap((seat, side) => (seat === 'person' && !state.world.out?.includes(side) && commandPost(state.world, side) !== undefined ? [side] : []));

/** Hot-seat: the person who has the device now confirms it is them; their plan and summary show. */
export function confirmHandover(state: RcState): RcState {
  return state.handover ? { ...state, handover: false } : state;
}

export const unitById = (state: RcState, id: number): Entity | undefined => state.world.entities.find((e) => e.id === id);
/** Production, placement, repair and sale are one-shot commands: a structure may give several per turn, each costs a slot. */
export const isOneShot = (order: Order): boolean => isOneShotOrder(order);
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
export const orderSlots = (state: RcState): number => computeNetwork(state.world, RULESET, state.planning).slots;

export type OrderRefusal = 'finished' | 'no-slots' | CommandRefusal;

/** Why an order cannot be planned, or `null` if it can (replacing a unit's planned order is free). */
export function orderRefusal(state: RcState, unit: number, order: Order, doctrine?: Doctrine): OrderRefusal | null {
  if (state.phase !== 'plan' || state.handover) return 'finished';
  // One-shot commands are checked against the world as the planned ones leave it (Supply spent,
  // queues filled), so the player cannot plan more than can be paid for.
  // A structure planned for sale takes no more jobs (it is torn down when the turn is carried out).
  if (isOneShot(order) && state.draft.some((c) => c.unit === unit && c.order.type === 'sell')) return SALE_PLANNED[order.type] ?? 'bad-order';
  const world = isOneShot(order) ? afterJobs(state) : state.world;
  const side = state.planning;
  const check = validateCommand(world, RULESET, doctrine ? { side, unit, order, doctrine } : { side, unit, order });
  if (!check.ok) return check.reason;
  const replaces = !isOneShot(order) && state.draft.some((c) => c.unit === unit && !isOneShot(c.order));
  if (!replaces && state.draft.length >= orderSlots(state)) return 'no-slots';
  return null;
}

/** The refusal for a job on a structure already planned for sale, by the kind of job. */
const SALE_PLANNED: Partial<Record<Order['type'], CommandRefusal>> = { produce: 'cannot-produce', build: 'cannot-build', repair: 'cannot-repair', sell: 'cannot-sell' };

/**
 * The world as the planned one-shot commands leave it: Supply paid, queues filled, planned sites
 * placed, planned repairs done. A structure planned for sale stays as it is: it still holds its
 * cell and works in the network, as in the engine, which tears it down after the whole batch
 * (no more jobs for it: see `orderRefusal`).
 * A sale's refund is not counted: it arrives when the turn is carried out.
 */
function afterJobs(state: RcState): World {
  const world = structuredClone(state.world);
  const me = state.planning;
  for (const c of state.draft) {
    if (!isOneShot(c.order) || c.order.type === 'hold') continue;
    if (c.order.type === 'repair') {
      const target = world.entities.find((e) => e.id === (c.order as { target: number }).target);
      const arch = target && archetypeOf(RULESET, target.kind);
      if (target && arch) {
        if (world.supply) world.supply[me] = (world.supply[me] ?? 0) - repairPrice(arch, target.hp);
        target.hp = arch.hp;
      }
      continue;
    }
    if (c.order.type === 'sell') continue;
    const arch = archetypeOf(RULESET, (c.order as { kind: string }).kind);
    if (world.supply) world.supply[me] = (world.supply[me] ?? 0) - (arch?.cost ?? 0);
    if (c.order.type === 'produce') {
      const yard = world.entities.find((e) => e.id === c.unit);
      if (yard) (yard.queue ??= []).push({ kind: c.order.kind, left: 1 });
    } else if (c.order.type === 'build' && arch) {
      // The planned site takes its cell, so a second placement there is refused while planning.
      const site = spawn(world.nextId++, me, arch, c.order.x, c.order.y);
      site.build = arch.buildTurns;
      world.entities.push(site);
      world.intel?.[me]?.push({ id: site.id, side: me, kind: site.kind, x: site.x, y: site.y, hp: site.hp, tick: world.tick, live: false });
    }
  }
  return world;
}

/** Supply the planned sale of `id` will bring: half its remaining value plus its queue, planned production included. */
export function plannedSaleRefund(state: RcState, id: number): number {
  const structure = unitById(state, id);
  if (!structure) return 0;
  const planned = state.draft.filter((c) => c.unit === id && c.order.type === 'produce').reduce((sum, c) => sum + (archetypeOf(RULESET, (c.order as { kind: string }).kind)?.cost ?? 0), 0);
  return sellRefund(RULESET, structure) + planned;
}

/** Supply left to plan with this turn: the side's Supply minus what the planned jobs cost. */
export const plannedSupply = (state: RcState): number => afterJobs(state).supply?.[state.planning] ?? 0;

/**
 * Adds or replaces the player's order for one unit. A doctrine planned earlier in the same turn
 * is kept unless a new one is given. Returns `undefined` if the order is not allowed.
 */
export function planOrder(state: RcState, unit: number, order: Order, doctrine?: Doctrine): RcState | undefined {
  const oneShot = isOneShot(order);
  const keep = oneShot ? undefined : (doctrine ?? state.draft.find((c) => c.unit === unit && !isOneShot(c.order))?.doctrine);
  if (orderRefusal(state, unit, order, keep) !== null) return undefined;
  const side = state.planning;
  const command: Command = keep ? { side, unit, order, doctrine: keep } : { side, unit, order };
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

/**
 * Locks the plan of the person planning. With one person (or the last person of a hot-seat turn)
 * the computer sides plan blind and all plans are resolved simultaneously. In a hot-seat game an
 * earlier person's lock hands the device on: the lock is final for that person this turn (no
 * take-back), and the next person plans after confirming it is them (`confirmHandover`).
 */
export function lockTurn(state: RcState): RcState {
  if (state.phase !== 'plan' || state.handover) return state;
  const next = personsLeft(state).find((side) => side > state.planning);
  if (next !== undefined) {
    return {
      ...state,
      locked: state.locked.map((plan, side) => (side === state.planning ? state.draft : plan)),
      inbox: state.inbox.map((events, side) => (side === next ? [] : events)),
      events: state.inbox[next] ?? [],
      draft: [],
      planning: next,
      handover: true
    };
  }
  return resolveAll(state);
}

/** Resolves the turn: persons' locked plans (and the open one), the computers' plans, all at once. */
function resolveAll(state: RcState): RcState {
  // Each computer side plans from its own observation only (never the world, a person's plan or
  // another side's plan); a side that is out plans nothing.
  const rules = rulesOf(state);
  const out = new Set(state.world.out ?? []);
  const plans = Array.from({ length: state.world.sides }, (_, side): Command[] => {
    if (out.has(side)) return [];
    if (state.seats[side] === 'person') return side === state.planning ? state.draft : (state.locked[side] ?? []);
    return planAi(observe(state.world, rules, side), rules, state.difficulty);
  });
  const { world, events: all, reported } = resolveTurn(state.world, rules, plans);
  const entry: TurnLog = state.retired.length > 0 ? { turn: state.world.turn, plans, retired: state.retired } : { turn: state.world.turn, plans };
  const cleared = { locked: state.seats.map((): Command[] => []), inbox: state.seats.map((): SimEvent[] => []), retired: [], draft: [], log: [...state.log, entry] };
  if (isHotSeat(state)) {
    const after = { ...state, world };
    const winner = hotSeatEnd(after);
    if (winner !== undefined) return finishHotSeat({ ...after, ...cleared }, winner);
    // Every person sees their own summary (what was reported to their side), the first one now;
    // sides that gave up this turn are told with it.
    const left = personsLeft(after);
    const first = left[0] ?? PLAYER;
    const told = (side: number): SimEvent[] => [...state.retired.map((gone): SimEvent => ({ t: 'eliminated', tick: state.world.tick, side: gone })), ...(reported?.[side] ?? [])];
    return {
      ...after,
      ...cleared,
      events: told(first),
      inbox: state.seats.map((_, side) => (side !== first && left.includes(side) ? told(side) : [])),
      planning: first,
      handover: left.length > 1
    };
  }
  const events = reported?.[PLAYER] ?? [];
  // The stalemate record is kept in open-ended games (a turn limit ends the others): a quick
  // match is decided by it, a plain open end only offers the player to end on strength.
  const fought = all.some((e) => e.t === 'hit');
  const counting = state.turnLimit === null && (fought || state.lead.length > 0 || world.turn >= CONTACT_TURN);
  // Shelling the leader's Command Post is pressure even before it shows in the lead: count anew.
  const leader = Math.sign(state.lead.at(-1) ?? 0) > 0 ? PLAYER : Math.sign(state.lead.at(-1) ?? 0) < 0 ? strongestOpponent(state.world) : undefined;
  const leaderPost = leader === undefined ? undefined : commandPost(state.world, leader)?.id;
  const pressed = leaderPost !== undefined && all.some((e) => e.t === 'hit' && e.id === leaderPost);
  const lead = nextLead(pressed ? [] : state.lead, world, counting);
  const result = outcome(world, state.turnLimit, lead, state.quick);
  return {
    ...state,
    ...cleared,
    world,
    lead,
    events,
    phase: result ? 'finished' : 'plan',
    result
  };
}

/** Sides still in the game: not out, holding a Command Post. */
const sidesLeft = (world: World): number[] =>
  Array.from({ length: world.sides }, (_, side) => side).filter((side) => !world.out?.includes(side) && commandPost(world, side) !== undefined);

/** The strongest of `sides`, or null when two share the top (or none is given). */
function strongest(world: World, sides: readonly number[]): number | null {
  let best: number | null = null;
  let top = -Infinity;
  let tie = false;
  for (const side of sides) {
    const v = sideValue(world, side);
    if (v > top) [best, top, tie] = [side, v, false];
    else if (v === top) tie = true;
  }
  return tie ? null : best;
}

/**
 * Hot-seat end of the game (docs/design/strategy.md § 9.4): when at most one side is left, or no
 * person is (computers do not play on alone), or at the turn limit (open end: MAX_TURNS) — then
 * the strongest side left wins, a tie is a draw (null). `undefined`: the game goes on.
 */
function hotSeatEnd(state: Pick<RcState, 'seats' | 'world' | 'turnLimit'>): number | null | undefined {
  const { world } = state;
  const left = sidesLeft(world);
  if (left.length <= 1) return left[0] ?? null;
  const decided = personsLeft(state).length === 0 || world.turn >= (state.turnLimit ?? MAX_TURNS);
  return decided ? strongest(world, left) : undefined;
}

/**
 * A finished hot-seat game: the winner (null: draw), and for the record of side 0 its outcome.
 * Nothing of any side is left to show: no plan, no summary (the result names only the winner and
 * the sides that are out, which every side was told).
 */
function finishHotSeat(state: RcState, winner: number | null): RcState {
  return {
    ...state,
    phase: 'finished',
    winner,
    result: winner === null ? 'draw' : winner === PLAYER ? 'won' : 'lost',
    events: [],
    draft: [],
    handover: false,
    locked: state.seats.map(() => []),
    inbox: state.seats.map(() => [])
  };
}

/**
 * Plain open end: once no side has gained ground for STALL_TURNS turns (the quick match's rule),
 * the player may end the game on strength instead of playing on (or giving up). Nothing forces it.
 */
export const canSettle = (state: RcState): boolean =>
  state.phase === 'plan' &&
  !isHotSeat(state) && state.turnLimit === null && !state.quick && stalemateTurns(state) >= STALL_TURNS;

/** The result `settle` would give now (strength as in every decision on strength). */
export function settleResult(state: RcState): Outcome {
  const diff = sideValue(state.world, PLAYER) - opponentValue(state.world);
  return diff > 0 ? 'won' : diff < 0 ? 'lost' : 'draw';
}

export function settle(state: RcState): RcState {
  if (!canSettle(state)) return state;
  return { ...state, phase: 'finished', result: settleResult(state), settled: true, draft: [] };
}

/**
 * The player gives up. Hot-seat: the person planning gives up (after confirming the hand-over);
 * only that side is out (`retire`, the elimination step) and the others play on — unless that
 * leaves at most one side or no person, which ends the game. Its plan is discarded.
 */
export function concede(state: RcState): RcState {
  if (state.phase !== 'plan') return state;
  if (!isHotSeat(state)) return { ...state, phase: 'finished', result: 'lost', conceded: true, draft: [] };
  if (state.handover) return state;
  const side = state.planning;
  const rest = sidesLeft(state.world).filter((x) => x !== side);
  const people = personsLeft(state).filter((x) => x !== side);
  if (rest.length <= 1 || people.length === 0 || !rulesOf(state).capture) {
    const winner = rest.length <= 1 ? (rest[0] ?? null) : strongest(state.world, rest);
    return finishHotSeat({ ...state, conceded: true }, winner);
  }
  const gone: RcState = {
    ...state,
    world: retire(state.world, side).world,
    retired: [...state.retired, side],
    locked: state.locked.map((plan, x) => (x === side ? [] : plan)),
    inbox: state.inbox.map((events, x) => (x === side ? [] : events)),
    draft: [],
    events: []
  };
  // The next person in this turn plans; when the one giving up was the last, the turn is resolved.
  const next = personsLeft(gone).find((x) => x > side);
  if (next === undefined) return resolveAll(gone);
  return { ...gone, events: gone.inbox[next] ?? [], inbox: gone.inbox.map((events, x) => (x === next ? [] : events)), planning: next, handover: true };
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

const pictureCache = new WeakMap<World, Map<number, Picture>>();

/** What `side` knows of the world (the player's side unless given; hot-seat: the person planning). */
export function picture(world: World, side: number = PLAYER): Picture {
  const cached = pictureCache.get(world)?.get(side);
  if (cached) return cached;
  const reports: readonly Report[] = world.intel?.[side] ?? [];
  const ghosts = new Map<number, number>();
  const entities: Entity[] = [];
  for (const r of reports) {
    const actual = world.entities.find((e) => e.id === r.id);
    if (r.live && actual) {
      // Enemies: position, health and visible effects only.
      const { id, kind, x, y, hp, status } = actual;
      entities.push(r.side === side ? actual : { id, side: actual.side, kind, x, y, hp, mp: 0, cooldown: 0, order: { type: 'hold' }, status, beam: null });
      continue;
    }
    ghosts.set(r.id, r.tick);
    entities.push({ id: r.id, side: r.side, kind: r.kind, x: r.x, y: r.y, hp: r.hp, mp: 0, cooldown: 0, order: { type: 'hold' }, status: [], beam: null });
  }
  const result: Picture = { world: { ...world, entities }, ghosts, observed: observedCells(world, RULESET, side) };
  const perSide = pictureCache.get(world) ?? new Map<number, Picture>();
  perSide.set(side, result);
  pictureCache.set(world, perSide);
  return result;
}

/**
 * The last order the player sent to a unit (from the turn log), for units out of contact whose
 * current order the player cannot confirm. `undefined` if none was ever sent.
 */
export function lastSentOrder(state: RcState, id: number): Order | undefined {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const sent = state.log[i]?.plans[state.planning]?.find((c) => c.unit === id);
    if (sent) return sent.order;
  }
  return undefined;
}

/** Turn (1-based, 0 = start) in which a report was made. */
export const reportTurn = (tick: number): number => Math.ceil(tick / RULESET.ticksPerTurn);

export const commandPost = (world: World, side: number): Entity | undefined =>
  world.entities.find((e) => e.side === side && e.kind === COMMAND_POST);

/** The opponents still in the game (they hold a Command Post). */
export const opponentsLeft = (world: World): number[] =>
  Array.from({ length: world.sides - 1 }, (_, i) => i + 1).filter((side) => !world.out?.includes(side) && commandPost(world, side) !== undefined);

/** The strongest opponent still in the game (ties: the lowest side), or OPPONENT when none is left. */
export function strongestOpponent(world: World): number {
  let best: number | undefined;
  for (const side of opponentsLeft(world)) if (best === undefined || sideValue(world, side) > sideValue(world, best)) best = side;
  return best ?? OPPONENT;
}

/**
 * The strength the player is measured against: the strongest opponent still in the game. With
 * several opponents the player wins on strength only when ahead of every one of them.
 */
export const opponentValue = (world: World): number => {
  const left = opponentsLeft(world);
  return left.length === 0 ? 0 : Math.max(...left.map((side) => sideValue(world, side)));
};

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
  const now = sideValue(world, PLAYER) - opponentValue(world);
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
export function outcome(world: World, turnLimit: number | null, lead: readonly number[] = [], quick = true): Outcome | null {
  // The player is out without a Command Post; it wins when no opponent holds one any more.
  const own = commandPost(world, PLAYER) !== undefined && !world.out?.includes(PLAYER);
  const enemies = opponentsLeft(world).length > 0;
  if (!own && !enemies) return 'draw';
  if (!enemies) return 'won';
  if (!own) return 'lost';
  const decided = turnLimit === null ? (quick && stalemateTurns({ lead: [...lead] }) >= STALL_TURNS) || world.turn >= MAX_TURNS : world.turn >= turnLimit;
  if (!decided) return null;
  const diff = sideValue(world, PLAYER) - opponentValue(world);
  return diff > 0 ? 'won' : diff < 0 ? 'lost' : 'draw';
}

/** Re-runs the logged plans from the scenario start (bug reports, tests). */
export function replay(seed: number, log: readonly TurnLog[], spec: ScenarioSpec = FIELD_EXERCISE, opponents = 1, endless = false): World {
  let world = initialWorld(spec, seed, opponents, endless);
  const rules = rulesetFor(spec, opponents);
  for (const entry of log) {
    for (const side of entry.retired ?? []) world = retire(world, side).world;
    world = resolveTurn(world, rules, entry.plans).world;
  }
  return world;
}

/** Adds the hot-seat fields of a single-player game (v10) to an older save: side 0 the only person. */
function withSeats(state: Record<string, unknown>): Record<string, unknown> {
  const sides = typeof state.opponents === 'number' && Number.isInteger(state.opponents) && state.opponents >= 1 && state.opponents <= MAX_OPPONENTS ? state.opponents + 1 : 2;
  const seats: Seat[] = Array.from({ length: sides }, (_, side) => (side === PLAYER ? 'person' : 'computer'));
  return { ...state, seats, planning: PLAYER, handover: false, locked: seats.map(() => []), inbox: seats.map(() => []), retired: [], winner: null, endless: false, random: null };
}

/** Switches an older save's world to the current ruleset and gives each side the starting Supply if it has none. */
function withEconomy(state: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(state.world)) return state;
  const sides = typeof state.world.sides === 'number' ? state.world.sides : 2;
  const supply = Array.isArray(state.world.supply) ? state.world.supply : Array.from({ length: sides }, () => RULESET.startSupply);
  // The old quiet count meant something else (turns without losses): the stalemate rule starts afresh.
  const { quiet: _quiet, ...rest } = state;
  void _quiet;
  return { ...rest, lead: [], quick: false, settled: false, map: null, edit: null, world: { ...state.world, ruleset: RULESET.id, supply } };
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
  (w: number, h: number, sides: number) =>
  (v: unknown): v is Command =>
    isRecord(v) && isInt(v.side, 0, sides - 1) && isInt(v.unit, 1) && isValidOrder(v.order, w, h) && (v.doctrine === undefined || isValidDoctrine(v.doctrine));

const isTurnLog = (isCommand: (v: unknown) => v is Command, sides: number) => (v: unknown): v is TurnLog =>
  isRecord(v) && isInt(v.turn, 0) && Array.isArray(v.plans) && v.plans.length === sides && v.plans.every((p) => isArrayOf(p, isCommand)) &&
  (v.retired === undefined || (isArrayOf(v.retired, (x) => isInt(x, 0, sides - 1)) && v.retired.length > 0));

/**
 * The world must belong to the saved scenario: same map and ruleset, only the scenario's unit
 * kinds and never more units than at the start. This keeps manipulated or foreign saves (huge
 * maps, hundreds of units) from freezing the tab.
 */
function matchesScenario(world: World, spec: ScenarioSpec, opponents: number, endless: boolean): boolean {
  const scenario = scenarioFor(spec, opponents);
  if (!scenario) return false;
  const { map, entities } = scenario;
  if (world.ruleset !== rulesetFor(spec, opponents).id || world.map.w !== map.w || world.map.h !== map.h || world.map.terrain !== map.terrain) return false;
  // Deposits: the scenario's cells (or none, for maps from before the economy), never fuller than at the start.
  const deposits = world.map.deposits ?? [];
  const start = map.deposits ?? [];
  // An endless deposit (the map's, or every one with the game option) stays as it started.
  const fits = (d: Deposit, o: Deposit): boolean => o.x === d.x && o.y === d.y && (o.endless || endless ? d.endless === true && d.left === o.left : d.endless === undefined && d.left <= o.left);
  if (deposits.length > 0 && (deposits.length !== start.length || deposits.some((d) => !start.some((o) => fits(d, o))))) return false;
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

/** Bound for one plan or one summary (see `isValidState`): one command per unit of the scenario, a dozen events per unit and tick. */
const n0 = (scenario: { entities: readonly unknown[] }): number => scenario.entities.length;

/**
 * Hot-seat fields (docs/design/strategy.md § 9.4): side 0 a person; one person means the
 * single-player game (planning side 0, no hand-over, nothing locked or waiting); several persons
 * have no quick match or stalemate record. Locked plans only for persons before the one planning,
 * waiting summaries only for persons after it, never for a side that is out (its plan is
 * discarded); sides given up this turn are out; a finished hot-seat game shows nothing of any side.
 */
function isValidSeating(value: Record<string, unknown>, n: number, isCommand: (v: unknown) => v is Command): boolean {
  const w = value.world as World;
  const sides = w.sides;
  const out = new Set(w.out ?? []);
  const { seats, planning, handover, locked, inbox, retired, winner, phase } = value;
  if (!isArrayOf(seats, (x): x is Seat => isOneOf(x, SEATS)) || seats.length !== sides || seats[0] !== 'person') return false;
  if (!isInt(planning, 0, sides - 1) || seats[planning] !== 'person' || typeof handover !== 'boolean') return false;
  const hot = seats.filter((x) => x === 'person').length > 1;
  if (!hot && (planning !== PLAYER || handover)) return false;
  if (hot && (value.quick === true || (Array.isArray(value.lead) && value.lead.length > 0))) return false;
  const playing = phase === 'plan';
  if (handover && !playing) return false;
  if (playing && hot && out.has(planning)) return false;
  const isEvent = (e: unknown) => isRecord(e) && typeof e.t === 'string' && isInt(e.tick, 0);
  if (!Array.isArray(locked) || locked.length !== sides) return false;
  for (let side = 0; side < sides; side++) {
    const plan: unknown = locked[side];
    if (!isArrayOf(plan, isCommand) || plan.length > n || plan.some((c) => c.side !== side)) return false;
    if (plan.length > 0 && !(playing && seats[side] === 'person' && side < planning && !out.has(side))) return false;
  }
  if (!Array.isArray(inbox) || inbox.length !== sides) return false;
  for (let side = 0; side < sides; side++) {
    const events: unknown = inbox[side];
    if (!Array.isArray(events) || events.length > n * RULESET.ticksPerTurn * 12 || !events.every(isEvent)) return false;
    if (events.length > 0 && !(playing && seats[side] === 'person' && side > planning && !out.has(side))) return false;
  }
  if (!isArrayOf(retired, (x): x is number => isInt(x, 0, sides - 1)) || new Set(retired).size !== retired.length) return false;
  if (retired.some((x) => !hot || !out.has(x) || seats[x] !== 'person')) return false;
  if (!(winner === null || (isInt(winner, 0, sides - 1) && hot && !playing))) return false;
  if (hot && !playing && ((Array.isArray(value.draft) && value.draft.length > 0) || (Array.isArray(value.events) && value.events.length > 0))) return false;
  return true;
}

const isValidDraft = (v: unknown): v is MapDraft | null =>
  v === null || (isRecord(v) && isValidMap(v.map) && v.map.seats === undefined && (v.slot === null || isInt(v.slot, 0, MAP_SLOTS - 1)) && typeof v.mirror === 'boolean');

/**
 * A random map's recipe: a size offered in the setup and a 32-bit seed, on a game with a map of
 * that size. The recipe is a label: the stored map is what the game runs on (it is checked like any
 * player-made map), so a later change of the generator never invalidates a save (review of PR #48).
 */
function isValidRandom(random: unknown, map: unknown): boolean {
  if (random === null) return true;
  if (!isRecord(random) || !isUint32(random.seed) || !RANDOM_SIZES.some(([w, h]) => w === random.w && h === random.h)) return false;
  return isRecord(map) && map.w === random.w && map.h === random.h;
}

export function isValidState(value: unknown): value is RcState {
  if (!isRecord(value) || value.v !== 12 || typeof value.endless !== 'boolean' || !isValidRandom(value.random, value.map) || !isUint32(value.seed) || typeof value.scenario !== 'string' || !isInt(value.opponents, 1, MAX_OPPONENTS)) return false;
  if (!isOneOf(value.difficulty, DIFFICULTIES)) return false;
  // A player-made map: well-formed and playable, and then the scenario is 'custom'.
  if (value.map !== null && (!isValidMap(value.map) || mapIssues(value.map).length > 0)) return false;
  if ((value.map !== null) !== (value.scenario === 'custom')) return false;
  if (!isValidDraft(value.edit)) return false;
  const spec = value.map ? customSpec(value.map) : scenarioById(value.scenario);
  if (!spec || !(value.turnLimit === null || isInt(value.turnLimit, 1, MAX_TURNS)) || !isOneOf(value.phase, ['plan', 'finished'])) return false;
  // The opponent count must be one the map offers, and the world must be set up for it: its sides,
  // frames and rules (capture only with several sides or a neutral post), no teams (free-for-all).
  const opponents = value.opponents;
  const scenario = opponentCounts(spec).includes(opponents) ? scenarioFor(spec, opponents) : undefined;
  if (!scenario) return false;
  const rules = rulesetFor(spec, opponents);
  if (!isValidWorld(value.world, rules) || value.world.sides !== opponents + 1 || !matchesScenario(value.world, spec, opponents, value.endless)) return false;
  // A crafted save must not turn a side's post neutral, add teams or change how a side sees the map.
  const w = value.world;
  if (w.teams !== undefined || JSON.stringify(w.frames ?? null) !== JSON.stringify(scenario.frames ?? null)) return false;
  if (rules.capture ? false : w.out !== undefined) return false;
  const neutralIds = new Set(scenario.entities.flatMap((e, i) => (e.side === NEUTRAL ? [i + 1] : [])));
  if (w.entities.some((e) => e.side === NEUTRAL && !neutralIds.has(e.id))) return false;
  if ((w.intel ?? []).some((list) => list.some((r) => r.side === NEUTRAL && !neutralIds.has(r.id)))) return false;
  // The stalemate record holds at most one entry per turn played and never more than decides a game.
  if (!isArrayOf(value.lead, (v) => isInt(v, -MAX_STRENGTH, MAX_STRENGTH)) || value.lead.length > Math.min(value.world.turn, STALL_TURNS + 1)) return false;
  if (typeof value.quick !== 'boolean' || (value.quick && value.turnLimit !== null)) return false;
  if (value.turnLimit !== null && value.lead.length > 0) return false; // only open-ended games keep a stalemate record
  const isCommand = commandGuard(value.world.map.w, value.world.map.h, value.world.sides);
  if (!isValidSeating(value, n0(scenario), isCommand)) return false;
  if (!isArrayOf(value.draft, isCommand) || value.draft.some((c) => c.side !== value.planning)) return false;
  // Bounded by the scenario (hostile saves must not freeze the tab): one command per unit and
  // plan, and at most a dozen events per unit and tick in the last turn's summary.
  const n = scenario.entities.length;
  if (value.draft.length > n || !Array.isArray(value.events) || value.events.length > n * RULESET.ticksPerTurn * 12) return false;
  if (!Array.isArray(value.log) || value.log.some((t) => !isRecord(t) || !Array.isArray(t.plans) || t.plans.some((p) => !Array.isArray(p) || p.length > n))) return false;
  const standing = value.draft.filter((c) => !isOneShot(c.order));
  if (new Set(standing.map((c) => c.unit)).size !== standing.length) return false;
  if (!Array.isArray(value.events) || !value.events.every((e) => isRecord(e) && typeof e.t === 'string' && isInt(e.tick, 0))) return false;
  if (!isArrayOf(value.log, isTurnLog(isCommand, value.world.sides)) || value.log.length !== value.world.turn) return false;
  if (typeof value.conceded !== 'boolean' || typeof value.settled !== 'boolean') return false;
  // Only a finished plain open end can have been settled (and never also conceded).
  if (value.settled && (value.phase !== 'finished' || value.turnLimit !== null || value.quick || value.conceded || value.lead.length <= STALL_TURNS)) return false;
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
  // Version 6 (open end always had the stalemate rule): plays on as a plain open end; the
  // stalemate rule is now the separate quick match.
  // Version 11 (before random maps): no generated map.
  if (fromVersion === 11) {
    if (!isRecord(state) || state.v !== 11) return undefined;
    const migrated = { ...state, v: 12, random: null };
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 10 (before endless deposits): deposits run dry as they did.
  if (fromVersion === 10) {
    if (!isRecord(state) || state.v !== 10) return undefined;
    const migrated = { ...state, v: 12, endless: false, random: null };
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 9 (before hot-seat): every opponent is the computer's; side 0 plans, nothing waits.
  if (fromVersion === 9) {
    if (!isRecord(state) || state.v !== 9) return undefined;
    const migrated = withSeats({ ...state, v: 12 });
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 8 (two sides only): one opponent; everything else carries over.
  if (fromVersion === 8) {
    if (!isRecord(state) || state.v !== 8) return undefined;
    const migrated = withSeats({ ...state, v: 12, opponents: 1 });
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 7 (before the map editor): no player-made map, no draft.
  if (fromVersion === 7) {
    if (!isRecord(state) || state.v !== 7) return undefined;
    const migrated = withSeats({ ...state, v: 12, opponents: 1, map: null, edit: null });
    return isValidState(migrated) ? migrated : undefined;
  }
  if (fromVersion === 6) {
    if (!isRecord(state) || state.v !== 6) return undefined;
    const migrated = withSeats({ ...state, v: 12, opponents: 1, quick: false, settled: false, lead: [], map: null, edit: null });
    return isValidState(migrated) ? migrated : undefined;
  }
  if (fromVersion === 5) {
    if (!isRecord(state) || state.v !== 5) return undefined;
    const migrated = withSeats(withEconomy({ ...state, v: 12, opponents: 1 }));
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 4 (before the lost-contact doctrine and open end): doctrines keep their old meaning
  // (carry on out of contact); player units without a doctrine get the current default.
  if (fromVersion === 4) {
    if (!isRecord(state) || state.v !== 4) return undefined;
    const migrated = withSeats(withEconomy(withLostContact({ ...state, v: 12, opponents: 1 })));
    return isValidState(migrated) ? migrated : undefined;
  }
  // Version 3 (before difficulty levels) plays on at 'normal'.
  if (fromVersion === 3) {
    if (!isRecord(state) || state.v !== 3) return undefined;
    const migrated = withSeats(withEconomy(withLostContact({ ...state, v: 12, opponents: 1, difficulty: 'normal' })));
    return isValidState(migrated) ? migrated : undefined;
  }
  if ((fromVersion !== 1 && fromVersion !== 2) || !isRecord(state) || state.v !== fromVersion || !isRecord(state.world)) return undefined;
  const world: Record<string, unknown> = { ...state.world, ruleset: RULESET.id };
  delete world.intel;
  delete world.supply;
  if (!isValidWorld(world, { ...RULESET, fog: false, economy: false })) return undefined;
  const migrated = withSeats(withEconomy(withLostContact({ ...state, v: 12, opponents: 1, difficulty: 'normal', events: [], world: { ...world, intel: initialIntel(world as unknown as World, RULESET) } })));
  if (!isValidState(migrated)) return undefined;
  // Version 1 had no order limit or coverage: keep only the planned orders that are still allowed.
  let replanned: RcState = { ...migrated, draft: [] };
  for (const c of migrated.draft) replanned = planOrder(replanned, c.unit, c.order, c.doctrine) ?? replanned;
  return replanned;
}
