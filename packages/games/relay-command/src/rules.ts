import { isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import {
  archetypeOf,
  BASE_RULESET,
  createWorld,
  isValidOrder,
  isValidWorld,
  resolveTurn,
  validateCommand,
  type Command,
  type Entity,
  type Order,
  type Ruleset,
  type SimEvent,
  type World
} from '@wp/strategy-engine';
import { planAi } from './ai';
import { FIELD_EXERCISE, SCENARIOS, type ScenarioSpec } from './scenarios';

export const RULESET: Ruleset = BASE_RULESET;
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
export interface RcState {
  v: 1;
  seed: number;
  scenario: string;
  turnLimit: number;
  world: World;
  phase: Phase;
  draft: Command[];
  /** Events of the last resolved turn (shown as the turn summary). */
  events: SimEvent[];
  log: TurnLog[];
  result: Outcome | null;
  conceded: boolean;
}

export const scenarioById = (id: string): ScenarioSpec | undefined => SCENARIOS.find((s) => s.id === id);

export function newGame(seed: number, spec: ScenarioSpec = FIELD_EXERCISE): RcState {
  return {
    v: 1,
    seed: normalizeSeed(seed),
    scenario: spec.id,
    turnLimit: spec.turnLimit,
    world: createWorld({ ...spec.scenario, seed }, RULESET),
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

/** Adds or replaces the player's order for one unit. Returns `undefined` if the order is not allowed. */
export function planOrder(state: RcState, unit: number, order: Order): RcState | undefined {
  if (state.phase !== 'plan') return undefined;
  const command: Command = { side: PLAYER, unit, order };
  if (!validateCommand(state.world, RULESET, command).ok) return undefined;
  const draft = state.draft.filter((c) => c.unit !== unit);
  draft.push(command);
  draft.sort((a, b) => a.unit - b.unit);
  return { ...state, draft };
}

export function cancelOrder(state: RcState, unit: number): RcState {
  return { ...state, draft: state.draft.filter((c) => c.unit !== unit) };
}

/** Locks the player's plan, lets the opponent plan blind, and resolves both simultaneously. */
export function lockTurn(state: RcState): RcState {
  if (state.phase !== 'plan') return state;
  const plans = [state.draft, planAi(state.world, RULESET, OPPONENT)];
  const { world, events } = resolveTurn(state.world, RULESET, plans);
  const result = outcome(world, state.turnLimit);
  return {
    ...state,
    world,
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

/** Destroying the enemy Command Post wins at once; otherwise the turn limit compares remaining value. */
export function outcome(world: World, turnLimit: number): Outcome | null {
  const own = commandPost(world, PLAYER);
  const enemy = commandPost(world, OPPONENT);
  if (!own && !enemy) return 'draw';
  if (!enemy) return 'won';
  if (!own) return 'lost';
  if (world.turn < turnLimit) return null;
  const diff = sideValue(world, PLAYER) - sideValue(world, OPPONENT);
  return diff > 0 ? 'won' : diff < 0 ? 'lost' : 'draw';
}

/** Re-runs the logged plans from the scenario start (bug reports, tests). */
export function replay(seed: number, log: readonly TurnLog[], spec: ScenarioSpec = FIELD_EXERCISE): World {
  let world = createWorld({ ...spec.scenario, seed }, RULESET);
  for (const entry of log) world = resolveTurn(world, RULESET, entry.plans).world;
  return world;
}

/** A command whose order is structurally valid on a `w`×`h` map. */
const commandGuard =
  (w: number, h: number) =>
  (v: unknown): v is Command =>
    isRecord(v) && isInt(v.side, 0, 1) && isInt(v.unit, 1) && isValidOrder(v.order, w, h);

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
  return world.entities.length <= entities.length && world.entities.every((e) => kinds.has(e.kind)) && world.projectiles.length <= entities.length * 4;
}

export function isValidState(value: unknown): value is RcState {
  if (!isRecord(value) || value.v !== 1 || !isUint32(value.seed) || typeof value.scenario !== 'string') return false;
  const spec = scenarioById(value.scenario);
  if (!spec || !isInt(value.turnLimit, 1, 1000) || !isOneOf(value.phase, ['plan', 'finished'])) return false;
  if (!isValidWorld(value.world, RULESET) || value.world.sides !== 2 || !matchesScenario(value.world, spec)) return false;
  const isCommand = commandGuard(value.world.map.w, value.world.map.h);
  if (!isArrayOf(value.draft, isCommand) || value.draft.some((c) => c.side !== PLAYER)) return false;
  if (new Set(value.draft.map((c) => c.unit)).size !== value.draft.length) return false;
  if (!Array.isArray(value.events) || !value.events.every((e) => isRecord(e) && typeof e.t === 'string' && isInt(e.tick, 0))) return false;
  if (!isArrayOf(value.log, isTurnLog(isCommand)) || value.log.length !== value.world.turn) return false;
  if (typeof value.conceded !== 'boolean') return false;
  if (value.phase === 'plan') return value.result === null;
  return isOneOf(value.result, ['won', 'lost', 'draw']);
}
