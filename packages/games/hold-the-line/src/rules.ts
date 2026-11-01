import { isRecord } from '@wp/game-core';
import { archetypeOf, createWorld, isValidWorld, spawn, TARGET_PRIORITIES, type SimEvent, type World } from '@wp/strategy-engine';
import {
  applyBuild,
  checkBuild,
  ENEMIES,
  ENEMY_KINDS,
  isEnemyKind,
  isStructureKind,
  refundOf,
  removeWalkers,
  settleAccount,
  STUN_BUDGET,
  TD_RULESET,
  tickLanes,
  TOWERS,
  type BuildCommand,
  type BuildRefusal,
  type EnemyKind,
  type LaneRun,
  type Leak,
  type PendingSpawn,
  type TowerRecord,
  type Walker
} from '@wp/td-core';
import { mapById, MAPS, ownPad, type DuelMap } from './maps';

/**
 * "Hold the Line", mode VS Small (docs/design/tower-defense.md § 13.2, § 16): two sides build towers
 * in their own half and buy an attack wave each round. PLAN (both sides, no clock) → LOCK → BATTLE:
 * both waves run at the same time on their own lanes and never meet; units that get through cost the
 * defender core integrity. After ROUNDS rounds the side with more core left wins.
 *
 * Side 0 is the player, side 1 the computer. The computer's plan is made at the lock, but from the
 * snapshot taken when the round started (`roundStart`: both sides as they stood then), so it never
 * knows the player's plan of that round (`ai.ts`). All functions are pure.
 */

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export const MODES = ['vs-small'] as const;
export type Mode = (typeof MODES)[number];

export const ROUNDS = 10;
export const START_CORE = 30;
export const START_CREDITS = 300;
export const ROUND_INCOME = 100;
export const INTEREST_PERCENT = 10;
export const EXTRACTOR_PRICE = 120;
export const EXTRACTOR_INCOME = 25;
/** Units a side may send per round, and what one workshop adds (at most MAX_WORKSHOPS). */
export const BASE_CAPACITY = 8;
export const WORKSHOP_CAPACITY = 4;
export const WORKSHOP_PRICE = 120;
export const MAX_WORKSHOPS = 3;
/** Safety bound of one battle. */
export const MAX_BATTLE_TICKS = 6000;

/** What a unit of the attack wave costs (the Siege crawler is not for sale). */
export const UNIT_PRICES: Readonly<Partial<Record<EnemyKind, number>>> = { walker: 20, runner: 25, swarm: 6, brute: 90, glider: 45, raider: 60 };
export const SHOP: readonly EnemyKind[] = ENEMY_KINDS.filter((k) => UNIT_PRICES[k] !== undefined);
/** Ticks between two units of the same kind leaving the spawn (swarms come close together). */
const SPACING = (kind: EnemyKind): number => (kind === 'swarm' ? 3 : 8);

export const interestOf = (unspent: number): number => Math.floor((Math.max(0, unspent) * INTEREST_PERCENT) / 100);

export interface SideState {
  credits: number;
  core: number;
  workshops: number;
  /** One record per tower or extractor the side paid for. */
  towers: TowerRecord[];
  /** The attack wave bought this round, in sending order. */
  wave: EnemyKind[];
  /** The wave this side sent last round (both sides saw it). */
  lastWave: EnemyKind[];
  stats: { killed: number; leaked: number; spent: number };
}

export type PlanCommand =
  | BuildCommand
  | { t: 'extractor'; x: number; y: number }
  | { t: 'buy'; kind: EnemyKind }
  | { t: 'unbuy'; index: number }
  | { t: 'workshop' };

export type Refusal = 'phase' | BuildRefusal | 'capacity' | 'not-for-sale' | 'no-unit' | 'workshops';

export type Phase = 'plan' | 'battle' | 'won' | 'lost' | 'draw';

export interface HoldState {
  v: 1;
  mode: Mode;
  mapId: string;
  difficulty: Difficulty;
  seed: number;
  round: number;
  phase: Phase;
  world: World;
  sides: [SideState, SideState];
  /** Both sides as the round started: all the computer may plan from (its plan is made at the lock). */
  roundStart: { world: World; sides: [SideState, SideState] };
  /** Credits each side left unspent at the lock of this round (interest base). */
  unspent: [number, number];
  run: LaneRun | null;
  /** Both plans per round (reproduction: seed + difficulty + log). */
  log: { player: PlanCommand[]; ai: PlanCommand[] }[];
}

export type Planner = (state: HoldState) => PlanCommand[];

export const mapOf = (s: Pick<HoldState, 'mapId'>): DuelMap => {
  const map = mapById(s.mapId);
  if (!map) throw new RangeError(`Unknown map ${s.mapId}`);
  return map;
};

const newSide = (): SideState => ({ credits: START_CREDITS, core: START_CORE, workshops: 0, towers: [], wave: [], lastWave: [], stats: { killed: 0, leaked: 0, spent: 0 } });

export const capacityOf = (side: Pick<SideState, 'workshops'>): number => BASE_CAPACITY + side.workshops * WORKSHOP_CAPACITY;
export const extractorsOf = (s: HoldState, side: number): number => s.world.entities.filter((e) => e.side === side && e.kind === 'extractor').length;
export const incomeOf = (s: HoldState, side: number): number => ROUND_INCOME + EXTRACTOR_INCOME * extractorsOf(s, side);

/** A new game. */
export function newGame(seed: number, difficulty: Difficulty, mapId: string = MAPS[0]!.id): HoldState {
  const map = mapById(mapId);
  if (!map) throw new RangeError(`Unknown map ${mapId}`);
  const world = createWorld({ map: { w: map.w, h: map.h, terrain: map.rows.join('') }, sides: 2, entities: [], seed }, TD_RULESET);
  const s: HoldState = {
    v: 1,
    mode: 'vs-small',
    mapId: map.id,
    difficulty,
    seed: world.rng,
    round: 0,
    phase: 'plan',
    world,
    sides: [newSide(), newSide()],
    roundStart: { world: structuredClone(world), sides: [newSide(), newSide()] },
    unspent: [0, 0],
    run: null,
    log: [{ player: [], ai: [] }]
  };
  return s;
}

/** Why `side` cannot do `cmd` now, or null. Never throws. */
export function checkPlan(s: HoldState, side: number, cmd: PlanCommand): Refusal | null {
  if (s.phase !== 'plan') return 'phase';
  const own = s.sides[side]!;
  const map = mapOf(s);
  switch (cmd.t) {
    case 'extractor':
      if (!ownPad(map, side, cmd.x, cmd.y)) return 'not-a-pad';
      if (s.world.entities.some((e) => e.x === cmd.x && e.y === cmd.y)) return 'occupied';
      return EXTRACTOR_PRICE > own.credits ? 'credits' : null;
    case 'buy': {
      const price = UNIT_PRICES[cmd.kind];
      if (price === undefined) return 'not-for-sale';
      if (own.wave.length >= capacityOf(own)) return 'capacity';
      return price > own.credits ? 'credits' : null;
    }
    case 'unbuy':
      return Number.isInteger(cmd.index) && cmd.index >= 0 && cmd.index < own.wave.length ? null : 'no-unit';
    case 'workshop':
      if (own.workshops >= MAX_WORKSHOPS) return 'workshops';
      return WORKSHOP_PRICE > own.credits ? 'credits' : null;
    default:
      return checkBuild(s.world, own, side, cmd, (x, y) => ownPad(map, side, x, y));
  }
}

/** Applies a plan command of `side` (the same state object when refused). */
export function applyPlan(s: HoldState, side: number, cmd: PlanCommand): HoldState {
  if (checkPlan(s, side, cmd) !== null) return s;
  const n = structuredClone(s);
  const own = n.sides[side]!;
  switch (cmd.t) {
    case 'extractor': {
      const id = n.world.nextId++;
      n.world.entities.push(spawn(id, side, archetypeOf(TD_RULESET, 'extractor')!, cmd.x, cmd.y));
      own.towers.push({ id, invested: EXTRACTOR_PRICE, fresh: EXTRACTOR_PRICE });
      own.credits -= EXTRACTOR_PRICE;
      own.stats.spent += EXTRACTOR_PRICE;
      break;
    }
    case 'buy': {
      const price = UNIT_PRICES[cmd.kind]!;
      own.wave.push(cmd.kind);
      own.credits -= price;
      own.stats.spent += price;
      break;
    }
    case 'unbuy': {
      const [kind] = own.wave.splice(cmd.index, 1);
      const price = UNIT_PRICES[kind!]!;
      own.credits += price;
      own.stats.spent -= price;
      break;
    }
    case 'workshop':
      own.workshops++;
      own.credits -= WORKSHOP_PRICE;
      own.stats.spent += WORKSHOP_PRICE;
      break;
    default: {
      // A tower command; a sale also covers extractors (refund like any structure).
      const built = applyBuild(n.world, own, side, cmd);
      n.world = built.world;
      own.credits = built.account.credits;
      own.towers = built.account.towers;
      own.stats.spent += built.spent;
    }
  }
  const entry = n.log[n.round]!;
  (side === 0 ? entry.player : entry.ai).push(cmd);
  return n;
}

/**
 * Lock the round: the computer plans from the round's start (`plan` never sees the player's plan of
 * this round), its plan is carried out, then both waves set off together.
 */
export function lockRound(s: HoldState, plan: Planner): HoldState {
  if (s.phase !== 'plan') return s;
  const seen: HoldState = { ...s, world: s.roundStart.world, sides: s.roundStart.sides };
  let n = s;
  for (const cmd of plan(seen)) n = applyPlan(n, 1, cmd);
  n = structuredClone(n);
  n.unspent = [n.sides[0].credits, n.sides[1].credits];
  const pending: PendingSpawn[] = [];
  n.sides.forEach((side, i) => {
    side.towers = settleAccount(side).towers;
    let at = 0;
    for (const kind of side.wave) {
      pending.push({ at, kind, route: i, side: i });
      at += SPACING(kind);
    }
  });
  n.run = { tick: 0, pending: pending.map((p, i) => ({ p, i })).sort((a, b) => a.p.at - b.p.at || a.i - b.i).map(({ p }) => p), walkers: [] };
  n.phase = 'battle';
  return n;
}

export interface BattleStep {
  state: HoldState;
  events: SimEvent[];
  leaks: Leak[];
}

/** Advance the battle by `ticks` ticks (or to its end). */
export function stepBattle(state: HoldState, ticks: number): BattleStep {
  if (state.phase !== 'battle' || !state.run) return { state, events: [], leaks: [] };
  const s = structuredClone(state);
  const events: SimEvent[] = [];
  const leaks: Leak[] = [];
  const map = mapOf(s);
  for (let i = 0; i < ticks && s.phase === 'battle'; i++) {
    const step = tickLanes(s.world, s.run!, map.lanes);
    s.world = step.world;
    s.run = step.run;
    take(s, step.leaks, leaks);
    for (const e of step.events) {
      events.push(e);
      if (e.t !== 'destroyed') continue;
      if (isEnemyKind(e.kind)) {
        // The defender (the other side) earns the bounty.
        const defender = s.sides[1 - e.side]!;
        defender.credits += ENEMIES[e.kind].bounty;
        defender.stats.killed++;
      } else {
        const owner = s.sides[e.side]!;
        owner.towers = owner.towers.filter((r) => r.id !== e.id);
      }
    }
    if (s.run!.tick >= MAX_BATTLE_TICKS) {
      const rest = removeWalkers(s.world, s.run!, new Set(s.run!.walkers.map((x) => x.id)));
      s.world = rest.world;
      s.run = rest.run;
      take(s, rest.leaks, leaks);
      for (const p of s.run.pending) take(s, [{ id: 0, kind: p.kind, hp: archetypeOf(TD_RULESET, p.kind)?.hp ?? 1, side: p.side ?? 1 }], leaks);
      s.run.pending = [];
    }
    if (s.run!.pending.length === 0 && s.run!.walkers.length === 0 && s.world.projectiles.length === 0) endRound(s);
  }
  return { state: s, events, leaks };
}

export const resolveBattle = (state: HoldState): BattleStep => stepBattle(state, MAX_BATTLE_TICKS + 1);

/** Units that got through cost the side they attacked core integrity by their threat. */
function take(s: HoldState, got: readonly Leak[], out: Leak[]): void {
  for (const l of got) {
    const target = s.sides[1 - l.side]!;
    target.core = Math.max(0, target.core - ENEMIES[l.kind].threat);
    s.sides[l.side]!.stats.leaked++;
    out.push(l);
  }
}

function endRound(s: HoldState): void {
  s.run = null;
  for (const e of s.world.entities) {
    e.cooldown = 0;
    e.beam = null;
    e.status = [];
  }
  const [a, b] = [s.sides[0].core, s.sides[1].core];
  const last = s.round >= ROUNDS - 1;
  if (a === 0 || b === 0 || last) {
    s.phase = a > b ? 'won' : a < b ? 'lost' : 'draw';
    return;
  }
  s.sides.forEach((side, i) => {
    side.credits += incomeOf(s, i) + interestOf(s.unspent[i as 0 | 1]);
    side.lastWave = side.wave;
    side.wave = [];
  });
  s.round++;
  s.phase = 'plan';
  s.log.push({ player: [], ai: [] });
  s.roundStart = { world: structuredClone(s.world), sides: structuredClone(s.sides) };
}

/** Refund of a structure (towers and extractors) right now. */
export const refundAt = (s: HoldState, side: number, id: number): number => {
  const record = s.sides[side]?.towers.find((r) => r.id === id);
  return record ? refundOf(record) : 0;
};

// ---------------------------------------------------------------------------------------------
// Validation of untrusted saves (never throws).

const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const isArrayOf = <T>(v: unknown, guard: (x: unknown) => x is T): v is T[] => Array.isArray(v) && v.every(guard);
const isKind = (v: unknown): v is EnemyKind => typeof v === 'string' && isEnemyKind(v);

export function isPlanCommand(v: unknown): v is PlanCommand {
  if (!isRecord(v)) return false;
  switch (v.t) {
    case 'place':
      return typeof v.kind === 'string' && isInt(v.x, 0, 255) && isInt(v.y, 0, 255);
    case 'extractor':
      return isInt(v.x, 0, 255) && isInt(v.y, 0, 255);
    case 'upgrade':
      return isInt(v.id, 1) && typeof v.kind === 'string';
    case 'sell':
      return isInt(v.id, 1);
    case 'target':
      return isInt(v.id, 1) && (TARGET_PRIORITIES as readonly unknown[]).includes(v.priority);
    case 'buy':
      return isKind(v.kind);
    case 'unbuy':
      return isInt(v.index, 0, 1000);
    case 'workshop':
      return true;
    default:
      return false;
  }
}

function isValidSide(v: unknown, s: { world: World; map: DuelMap }, index: number): v is SideState {
  if (!isRecord(v) || !isInt(v.credits, 0, 1_000_000) || !isInt(v.core, 0, START_CORE) || !isInt(v.workshops, 0, MAX_WORKSHOPS)) return false;
  if (!isArrayOf(v.wave, isKind) || v.wave.length > BASE_CAPACITY + MAX_WORKSHOPS * WORKSHOP_CAPACITY || v.wave.some((k) => UNIT_PRICES[k] === undefined)) return false;
  if (!isArrayOf(v.lastWave, isKind) || v.lastWave.length > BASE_CAPACITY + MAX_WORKSHOPS * WORKSHOP_CAPACITY) return false;
  if (!isRecord(v.stats) || !['killed', 'leaked', 'spent'].every((k) => isInt((v.stats as Record<string, unknown>)[k], -1_000_000, 1_000_000))) return false;
  const owned = s.world.entities.filter((e) => e.side === index && (Object.hasOwn(TOWERS, e.kind) || isStructureKind(e.kind)));
  if (owned.some((e) => !ownPad(s.map, index, e.x, e.y))) return false;
  return (
    isArrayOf(v.towers, (r): r is TowerRecord => isRecord(r) && isInt(r.id, 1) && isInt(r.invested, 0, 1_000_000) && isInt(r.fresh, 0, 1_000_000) && (r.fresh as number) <= (r.invested as number)) &&
    v.towers.length === owned.length &&
    new Set(v.towers.map((r) => r.id)).size === v.towers.length &&
    v.towers.every((r) => owned.some((e) => e.id === r.id))
  );
}

export function isValidState(v: unknown): v is HoldState {
  if (!isRecord(v) || v.v !== 1 || v.mode !== 'vs-small' || typeof v.mapId !== 'string') return false;
  const map = mapById(v.mapId);
  if (!map) return false;
  if (!(DIFFICULTIES as readonly unknown[]).includes(v.difficulty) || !isInt(v.seed, 0, 0xffffffff) || !isInt(v.round, 0, ROUNDS - 1)) return false;
  if (!['plan', 'battle', 'won', 'lost', 'draw'].includes(v.phase as string)) return false;
  if (!isValidWorld(v.world, TD_RULESET) || v.world.sides !== 2) return false;
  const world = v.world;
  if (world.map.w !== map.w || world.map.h !== map.h || world.map.terrain !== map.rows.join('')) return false;
  if (!Array.isArray(v.sides) || v.sides.length !== 2 || !v.sides.every((side, i) => isValidSide(side, { world, map }, i))) return false;
  // The round's start: the same map and valid sides on it (the computer plans from it).
  const start = v.roundStart;
  if (!isRecord(start) || !isValidWorld(start.world, TD_RULESET) || start.world.sides !== 2 || start.world.map.terrain !== world.map.terrain) return false;
  const startWorld = start.world;
  if (startWorld.entities.some((e) => !Object.hasOwn(TOWERS, e.kind) && !isStructureKind(e.kind)) || startWorld.projectiles.length > 0) return false;
  if (!Array.isArray(start.sides) || start.sides.length !== 2 || !start.sides.every((side, i) => isValidSide(side, { world: startWorld, map }, i))) return false;
  if (!isArrayOf(v.unspent, (x): x is number => isInt(x, 0, 1_000_000)) || v.unspent.length !== 2) return false;
  if (!isArrayOf(v.log, (e): e is HoldState['log'][number] => isRecord(e) && isArrayOf(e.player, isPlanCommand) && isArrayOf(e.ai, isPlanCommand)) || v.log.length !== (v.round as number) + 1) return false;
  const units = world.entities.filter((e) => !Object.hasOwn(TOWERS, e.kind) && !isStructureKind(e.kind));
  if (units.some((e) => !isEnemyKind(e.kind))) return false;
  if (v.phase === 'battle') {
    const run = v.run;
    if (!isRecord(run) || !isInt(run.tick, 0, MAX_BATTLE_TICKS)) return false;
    if (!isArrayOf(run.pending, (p): p is PendingSpawn => isRecord(p) && isInt(p.at, 0) && isKind(p.kind) && isInt(p.route, 0, 1) && p.side === p.route)) return false;
    if (!isArrayOf(run.walkers, (x): x is Walker => isRecord(x) && isInt(x.id, 1) && isInt(x.route, 0, 1) && isInt(x.leg, 1, map.lanes[x.route as number]!.points.length - 1) && (x.stun === undefined || isInt(x.stun, 1, STUN_BUDGET)))) return false;
    if (run.walkers.length !== units.length || units.some((e) => !(run.walkers as Walker[]).some((x) => x.id === e.id && x.route === e.side))) return false;
    if (new Set(run.walkers.map((x) => x.id)).size !== run.walkers.length) return false;
    const sent = (v.sides as SideState[]).reduce((sum, side) => sum + side.wave.length, 0);
    if (run.pending.length + run.walkers.length > sent) return false;
  } else if (v.run !== null || units.length > 0 || world.projectiles.length > 0) return false;
  return true;
}
