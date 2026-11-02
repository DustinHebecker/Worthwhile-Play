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
import { mapById, mapForMode, ownPad, type DuelMap } from './maps';

/**
 * "Hold the Line" (docs/design/tower-defense.md § 13.2, §§ 16–17). Mode VS Small: two sides build
 * towers in their own half and buy an attack wave each round. Mode External Small: nobody buys
 * units; an outside force comes every round and splits evenly towards both cores, and whatever gets
 * through (on either side) strengthens its next wave. In both modes: PLAN (both sides, no clock) → LOCK → BATTLE:
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

export const MODES = ['vs-small', 'external-small'] as const;
export type Mode = (typeof MODES)[number];

/** Length of a game (owner 2026-11-01: endless by default; ten rounds on points as the short game). */
export const LENGTHS = ['endless', 'rounds'] as const;
export type Length = (typeof LENGTHS)[number];
export const DEFAULT_LENGTH: Length = 'endless';
/** Rounds of the short game. */
export const ROUNDS = 10;
/** Most rounds a game can last (escalation ends every endless game long before). */
export const MAX_ROUNDS = 999;
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

/**
 * External Small: the outside force per round (each half; both sides get the same half). Rounds
 * bring the unit kinds in the order Tower Defense introduces them; the last rounds mix them.
 */
export const EXTERNAL_WAVES: readonly (readonly (readonly [EnemyKind, number])[])[] = [
  [['walker', 8]],
  [['walker', 6], ['runner', 6]],
  [['swarm', 16], ['walker', 4]],
  [['brute', 3], ['runner', 6], ['walker', 4]],
  [['glider', 6], ['walker', 6], ['runner', 6]],
  [['raider', 6], ['swarm', 12], ['brute', 4]],
  [['shielder', 8], ['runner', 8], ['glider', 6]],
  [['brute', 10], ['raider', 6], ['swarm', 12]],
  [['mender', 4], ['brute', 10], ['shielder', 6], ['glider', 8]],
  [['brute', 14], ['shielder', 10], ['raider', 6], ['glider', 8]]
];
/** Units that got through last round (both sides together) come back as this many extra Walkers, at most. */
export const MAX_PRESSURE = 12;
/** External Small pays this share of the bounty (its waves are large; full bounties outgrew them). */
export const EXTERNAL_BOUNTY_PERCENT = 50;
/** Longest wave a side can send or face (bounds what a save may hold). */
export const MAX_WAVE = 120;

/**
 * Endless: the outside force after the table's last round. Every round past it adds Brutes,
 * Shield bearers, Raiders and Gliders, and from the second one a Siege crawler every other round,
 * so even the best defence falls in the end.
 */
function lateForce(k: number): (readonly [EnemyKind, number])[] {
  return [
    ['brute', 14 + 2 * k],
    ['shielder', 10 + k],
    ['raider', 6 + k],
    ['glider', 8 + k],
    ['crawler', Math.floor(k / 2)]
  ];
}

/**
 * Endless, VS Small: conscripts every side sends on top of what it bought, more each round (so a
 * game between two careful sides still ends): a Walker every second round, from round 12 one more per
 * round, and every fourth of them a Brute.
 */
export function conscriptsOf(s: Pick<HoldState, 'mode' | 'round' | 'length'>): EnemyKind[] {
  if (s.mode !== 'vs-small' || (s.length ?? 'rounds') !== 'endless') return [];
  const n = Math.min(MAX_CONSCRIPTS, Math.floor(s.round / 2) + Math.max(0, s.round - 11));
  return Array.from({ length: n }, (_, i) => (i % 4 === 3 ? 'brute' : 'walker'));
}
export const MAX_CONSCRIPTS = 40;

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

export type Refusal = 'phase' | BuildRefusal | 'capacity' | 'not-for-sale' | 'no-unit' | 'workshops' | 'mode';

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
  /** External Small: units that got through last round, on both sides (they strengthen this round's force). */
  pressure?: number;
  /** Endless or ten rounds (absent in saves from before the choice: ten rounds). */
  length?: Length;
  /** External Small alone against the force: no opponent (side 1 only stands in for the other road's end). */
  solo?: boolean;
}

/** The last round of a game (endless: the safety bound). */
export const lastRound = (s: Pick<HoldState, 'length'>): number => ((s.length ?? 'rounds') === 'endless' ? MAX_ROUNDS - 1 : ROUNDS - 1);

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

/** The outside force of this round, as each side meets it (External Small; empty in VS Small). */
export function externalWave(s: Pick<HoldState, 'mode' | 'round' | 'pressure'>): EnemyKind[] {
  if (s.mode !== 'external-small') return [];
  const wave: EnemyKind[] = [];
  const row = s.round < EXTERNAL_WAVES.length ? EXTERNAL_WAVES[s.round]! : lateForce(s.round - EXTERNAL_WAVES.length + 1);
  for (const [kind, n] of row) for (let i = 0; i < n && wave.length < MAX_WAVE - MAX_PRESSURE; i++) wave.push(kind);
  for (let i = 0; i < Math.min(MAX_PRESSURE, s.pressure ?? 0); i++) wave.push('walker');
  return wave;
}

/** A new game; the map decides the mode (`mapForMode` gives each mode's map). */
export interface GameOptions {
  /** Endless (default) or ten rounds on points. */
  length?: Length;
  /** External Small only: alone against the outside force, without an opponent. */
  solo?: boolean;
}

export function newGame(seed: number, difficulty: Difficulty, mapId: string = mapForMode('vs-small').id, options: GameOptions = {}): HoldState {
  const map = mapById(mapId);
  if (!map) throw new RangeError(`Unknown map ${mapId}`);
  const world = createWorld({ map: { w: map.w, h: map.h, terrain: map.rows.join('') }, sides: 2, entities: [], seed }, TD_RULESET);
  const s: HoldState = {
    v: 1,
    mode: map.mode,
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
    log: [{ player: [], ai: [] }],
    ...(map.mode === 'external-small' && { pressure: 0 }),
    length: options.length ?? DEFAULT_LENGTH,
    ...(options.solo && map.mode === 'external-small' && { solo: true })
  };
  return s;
}

/** Why `side` cannot do `cmd` now, or null. Never throws. */
export function checkPlan(s: HoldState, side: number, cmd: PlanCommand): Refusal | null {
  if (s.phase !== 'plan') return 'phase';
  const own = s.sides[side]!;
  const map = mapOf(s);
  // External Small: the waves come from outside; nobody buys units or workshops.
  if (s.mode === 'external-small' && (cmd.t === 'buy' || cmd.t === 'unbuy' || cmd.t === 'workshop')) return 'mode';
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
/** What the computer may see when it plans: the round's start, without this round's log or interest base. */
export const seenBy = (s: HoldState): HoldState => ({ ...s, world: s.roundStart.world, sides: s.roundStart.sides, log: s.log.map(() => ({ player: [], ai: [] })), unspent: [0, 0], run: null });

export function lockRound(s: HoldState, plan: Planner): HoldState {
  if (s.phase !== 'plan') return s;
  let seen = seenBy(s);
  // Its plan names its new structures by the ids they get on that snapshot; the player's builds of
  // this round have taken other ids by now, so those ids are translated when the plan is applied.
  const ids = new Map<number, number>();
  let n = s;
  // Alone against the outside force: nobody plans for the other side.
  for (const cmd of s.solo ? [] : plan(seen)) {
    const real = 'id' in cmd ? { ...cmd, id: ids.get(cmd.id) ?? cmd.id } : cmd;
    const [shadowId, realId] = [seen.world.nextId, n.world.nextId];
    seen = applyPlan(seen, 1, cmd);
    n = applyPlan(n, 1, real);
    if (cmd.t === 'place' || cmd.t === 'extractor') ids.set(shadowId, realId);
  }
  n = structuredClone(n);
  if (n.mode === 'external-small') {
    // Both sides face the same force; alone, only the half that comes for you sets off.
    n.sides[1].wave = externalWave(n);
    n.sides[0].wave = n.solo ? [] : externalWave(n);
  } else for (const side of n.sides) side.wave = [...side.wave, ...conscriptsOf(n)];
  n.unspent = [n.sides[0].credits, n.sides[1].credits];
  for (const side of n.sides) side.towers = settleAccount(side).towers;
  n.run = { tick: 0, pending: scheduleOf(n.sides), walkers: [] };
  n.phase = 'battle';
  return n;
}

/** Both sides' waves as spawns, in sending order with their spacing (merged by time, side 0 first on ties). */
export function scheduleOf(sides: readonly Pick<SideState, 'wave'>[]): PendingSpawn[] {
  const pending: PendingSpawn[] = [];
  sides.forEach((side, i) => {
    let at = 0;
    for (const kind of side.wave) {
      pending.push({ at, kind, route: i, side: i });
      at += SPACING(kind);
    }
  });
  return pending.map((p, i) => ({ p, i })).sort((a, b) => a.p.at - b.p.at || a.i - b.i).map(({ p }) => p);
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
        // The defender (the other side) earns the bounty (half of it against the large outside force).
        const defender = s.sides[1 - e.side]!;
        defender.credits += s.mode === 'external-small' ? Math.floor((ENEMIES[e.kind].bounty * EXTERNAL_BOUNTY_PERCENT) / 100) : ENEMIES[e.kind].bounty;
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
  const last = s.round >= lastRound(s);
  if (s.solo) {
    // Alone: you win by holding to the end of a short game; in an endless one you hold as long as you can.
    if (a === 0 || last) {
      s.phase = a > 0 ? 'won' : 'lost';
      return;
    }
  } else if (a === 0 || b === 0 || last) {
    s.phase = a > b ? 'won' : a < b ? 'lost' : 'draw';
    return;
  }
  if (s.mode === 'external-small') {
    const through = (sides: readonly SideState[]) => sides[0]!.stats.leaked + sides[1]!.stats.leaked;
    s.pressure = through(s.sides) - through(s.roundStart.sides);
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
/** Every element passes `guard` (holes in sparse arrays count as `undefined`, so they fail). */
const isArrayOf = <T>(v: unknown, guard: (x: unknown) => x is T): v is T[] => Array.isArray(v) && Array.from(v).every(guard);
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
  const external = s.map.mode === 'external-small';
  if (!isRecord(v) || !isInt(v.credits, 0, 1_000_000) || !isInt(v.core, 0, START_CORE) || !isInt(v.workshops, 0, external ? 0 : MAX_WORKSHOPS)) return false;
  const most = external ? MAX_WAVE : BASE_CAPACITY + MAX_WORKSHOPS * WORKSHOP_CAPACITY + MAX_CONSCRIPTS;
  if (!isArrayOf(v.wave, isKind) || v.wave.length > most || (!external && v.wave.some((k) => UNIT_PRICES[k] === undefined))) return false;
  if (!isArrayOf(v.lastWave, isKind) || v.lastWave.length > most) return false;
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
  // Never throws, also on hand-made input (sparse arrays, getters): anything unexpected is invalid.
  try {
    return checkState(v);
  } catch {
    return false;
  }
}

function checkState(v: unknown): v is HoldState {
  if (!isRecord(v) || v.v !== 1 || typeof v.mapId !== 'string') return false;
  const map = mapById(v.mapId);
  if (!map || v.mode !== map.mode) return false;
  // Endless or ten rounds (absent: a save from before the choice); alone only against the outside force.
  if (v.length !== undefined && !(LENGTHS as readonly unknown[]).includes(v.length)) return false;
  if (v.solo !== undefined && (v.solo !== true || map.mode !== 'external-small')) return false;
  const solo = v.solo === true;
  const last = lastRound(v as Pick<HoldState, 'length'>);
  // External Small keeps the pressure (none before the first battle; at most both waves got through); VS Small has none.
  if (map.mode === 'external-small' ? !isInt(v.pressure, 0, v.round === 0 ? 0 : 2 * MAX_WAVE) : v.pressure !== undefined) return false;
  if (!(DIFFICULTIES as readonly unknown[]).includes(v.difficulty) || !isInt(v.seed, 0, 0xffffffff) || !isInt(v.round, 0, last)) return false;
  if (!['plan', 'battle', 'won', 'lost', 'draw'].includes(v.phase as string)) return false;
  if (!isValidWorld(v.world, TD_RULESET) || v.world.sides !== 2) return false;
  const world = v.world;
  if (world.map.w !== map.w || world.map.h !== map.h || world.map.terrain !== map.rows.join('')) return false;
  if (!Array.isArray(v.sides) || v.sides.length !== 2 || !Array.from(v.sides).every((side, i) => isValidSide(side, { world, map }, i))) return false;
  // The round's start: the same map and valid sides on it (the computer plans from it).
  const start = v.roundStart;
  if (!isRecord(start) || !isValidWorld(start.world, TD_RULESET) || start.world.sides !== 2 || start.world.map.terrain !== world.map.terrain) return false;
  const startWorld = start.world;
  if (startWorld.entities.some((e) => !Object.hasOwn(TOWERS, e.kind) && !isStructureKind(e.kind)) || startWorld.projectiles.length > 0) return false;
  if (!Array.isArray(start.sides) || start.sides.length !== 2 || !Array.from(start.sides).every((side, i) => isValidSide(side, { world: startWorld, map }, i))) return false;
  if (!isArrayOf(v.unspent, (x): x is number => isInt(x, 0, 1_000_000)) || v.unspent.length !== 2) return false;
  const isPlanList = (l: unknown): l is PlanCommand[] => isArrayOf(l, isPlanCommand) && l.length <= 1000;
  if (!isArrayOf(v.log, (e): e is HoldState['log'][number] => isRecord(e) && isPlanList(e.player) && isPlanList(e.ai)) || v.log.length !== (v.round as number) + 1) return false;
  const units = world.entities.filter((e) => !Object.hasOwn(TOWERS, e.kind) && !isStructureKind(e.kind));
  if (units.some((e) => !isEnemyKind(e.kind))) return false;
  const [own, foe] = v.sides as [SideState, SideState];
  // Results match the cores; a game in progress has its cores standing. Alone, only your core counts:
  // the other side is never attacked.
  const over = v.phase === 'won' || v.phase === 'lost' || v.phase === 'draw';
  const fallen = solo ? own.core === 0 : Math.min(own.core, foe.core) === 0;
  if (solo) {
    if (foe.core !== START_CORE || v.phase === 'draw' || (v.phase === 'won' && own.core === 0) || (v.phase === 'lost' && own.core > 0)) return false;
  } else {
    if (v.phase === 'won' && !(own.core > foe.core)) return false;
    if (v.phase === 'lost' && !(own.core < foe.core)) return false;
    if (v.phase === 'draw' && own.core !== foe.core) return false;
  }
  if (over && v.round !== last && !fallen) return false;
  // A battle runs on after a core reaches 0 (until its units are gone), and is saved meanwhile; a
  // plan phase only follows a round in which the cores held.
  if (v.phase === 'plan' && fallen) return false;
  if (v.phase === 'plan') {
    // While planning, the computer has done nothing yet: it stands exactly as the round began.
    const startSides = start.sides as [SideState, SideState];
    if (JSON.stringify(foe) !== JSON.stringify(startSides[1]) || foe.wave.length > 0 || own.core !== startSides[0].core) return false;
    if (map.mode === 'external-small' && own.wave.length > 0) return false;
    const foeAt = (w: World) => JSON.stringify(w.entities.filter((e) => e.side === 1).map((e) => [e.id, e.kind, e.x, e.y, e.hp]));
    if (foeAt(world) !== foeAt(startWorld)) return false;
  }
  if (v.phase === 'battle') {
    const run = v.run;
    if (!isRecord(run) || !isInt(run.tick, 0, MAX_BATTLE_TICKS)) return false;
    if (!isArrayOf(run.pending, (p): p is PendingSpawn => isRecord(p) && isInt(p.at, 0) && isKind(p.kind) && isInt(p.route, 0, 1) && p.side === p.route)) return false;
    if (!isArrayOf(run.walkers, (x): x is Walker => isRecord(x) && isInt(x.id, 1) && isInt(x.route, 0, 1) && isInt(x.leg, 1, map.lanes[x.route as number]!.points.length - 1) && (x.stun === undefined || isInt(x.stun, 1, STUN_BUDGET)))) return false;
    if (run.walkers.length !== units.length || units.some((e) => !(run.walkers as Walker[]).some((x) => x.id === e.id && x.route === e.side))) return false;
    if (new Set(run.walkers.map((x) => x.id)).size !== run.walkers.length) return false;
    // What is still to come is the tail of each side's bought wave, in order; what runs is of the bought kinds.
    const sides = v.sides as SideState[];
    // External Small: both sides face exactly this round's outside force (alone: only you).
    if (map.mode === 'external-small') {
      const force = JSON.stringify(externalWave(v as unknown as HoldState));
      if (JSON.stringify(sides[1]!.wave) !== force || JSON.stringify(sides[0]!.wave) !== (solo ? '[]' : force)) return false;
    } else {
      // VS Small: what a side bought, then this round's conscripts (endless).
      const tail = JSON.stringify(conscriptsOf(v as unknown as HoldState));
      if (sides.some((side) => JSON.stringify(side.wave.slice(side.wave.length - conscriptsOf(v as unknown as HoldState).length)) !== tail)) return false;
    }
    for (const [i, side] of sides.entries()) {
      const schedule = scheduleOf([i === 0 ? side : { wave: [] }, i === 1 ? side : { wave: [] }]);
      const rest = run.pending.filter((p) => p.side === i);
      const tail = schedule.slice(schedule.length - rest.length);
      if (rest.length > schedule.length || rest.some((p, k) => p.at !== tail[k]!.at || p.kind !== tail[k]!.kind)) return false;
      // Spawns are made at their tick or later, never earlier: whatever is not yet due is still pending.
      if (rest.length < schedule.filter((p) => p.at >= (run.tick as number)).length) return false;
      const sent = side.wave.slice(0, side.wave.length - rest.length);
      const running = units.filter((e) => e.side === i);
      if (running.length > sent.length) return false;
      const left = [...sent];
      for (const e of running) {
        const k = left.indexOf(e.kind as EnemyKind);
        if (k < 0) return false;
        left.splice(k, 1);
      }
    }
  } else if (v.run !== null || units.length > 0 || world.projectiles.length > 0) return false;
  return true;
}
