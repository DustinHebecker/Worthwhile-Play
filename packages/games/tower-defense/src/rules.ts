import { createRng, isRecord } from '@wp/game-core';
import {
  archetypeOf,
  createWorld,
  DEFAULT_DOCTRINE,
  isValidWorld,
  runTicks,
  spawn,
  TARGET_PRIORITIES,
  type Command,
  type Entity,
  type SimEvent,
  type TargetPriority,
  type World
} from '@wp/strategy-engine';
import { mapById, MAPS, type TdMap } from './maps';
import { BASE_TOWERS, ENEMIES, isEnemyKind, TD_RULESET, TOWERS, type EnemyKind } from './ruleset';

/**
 * Tower Defense rules on the shared engine (docs/design/tower-defense.md § 15).
 *
 * Side 0 = the player's towers, side 1 = the waves. Build phase: place, upgrade, sell, retarget
 * (no clock). "Start wave" locks the build; the wave is a deterministic simulation advanced by
 * `stepWave` one tick at a time (the view only paces it). All functions are pure.
 */

export const DIFFICULTIES = ['relaxed', 'standard', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'standard';

/** Targeting choices offered for towers (engine doctrine priorities that make sense here). */
export const TOWER_PRIORITIES = ['weakest', 'nearest', 'armor'] as const satisfies readonly TargetPriority[];
export type TowerPriority = (typeof TOWER_PRIORITIES)[number];

/** Refund share of credits invested before the current build phase. */
export const SELL_PERCENT = 70;
/**
 * Interest (owner, 2026-10-31): credits left unspent when a wave starts earn this share at its end,
 * a modest reward for not needing everything; kept low so hoarding does not become the strategy.
 */
export const INTEREST_PERCENT = 10;
export const interestOf = (unspent: number): number => Math.floor((Math.max(0, unspent) * INTEREST_PERCENT) / 100);
/** Wave income after surviving wave `wave` (difficulty applied). */
export const incomeAfter = (state: Pick<TdCore, 'mapId' | 'difficulty'>, wave: number): number => {
  const raw = mapOf(state).income[wave];
  return raw === undefined ? 0 : scaled(raw, CREDIT_PERCENT[state.difficulty]);
};

/** Safety bound: a wave never runs longer (whatever is left then counts as leaked). */
export const MAX_WAVE_TICKS = 6000;

export interface TowerRecord {
  id: number;
  /** All credits put into this tower. */
  invested: number;
  /** Credits put in during the current build phase (refunded in full: nothing has happened yet). */
  fresh: number;
}

export interface PendingSpawn {
  at: number;
  kind: EnemyKind;
  route: number;
}

/** A wave unit and the index of the route point it is heading for. */
export interface Walker {
  id: number;
  route: number;
  leg: number;
}

export interface WaveRun {
  tick: number;
  /** Not yet spawned, by `at` (ties keep authoring order). */
  pending: PendingSpawn[];
  walkers: Walker[];
}

/** `lost`: the core fell (the wave can be retried); `ended`: the player ended the game after a loss (final). */
export type Phase = 'build' | 'wave' | 'won' | 'lost' | 'ended';

export interface Stats {
  killed: number;
  leaked: number;
  spent: number;
  retries: number;
}

export interface TdCore {
  mapId: string;
  difficulty: Difficulty;
  seed: number;
  /** Chosen variant per wave slot (from the seed). */
  variants: number[];
  phase: Phase;
  /** Index of the current (wave phase) or next (build phase) wave. */
  wave: number;
  credits: number;
  core: number;
  world: World;
  towers: TowerRecord[];
  run: WaveRun | null;
  stats: Stats;
}

export interface TdState extends TdCore {
  v: 1;
  /** State at the last "Start wave" (to retry a lost wave). */
  checkpoint: TdCore | null;
  /** Build commands per wave (reproduction: map + seed + difficulty + log). */
  log: BuildCommand[][];
}

export type BuildCommand =
  | { t: 'place'; kind: string; x: number; y: number }
  | { t: 'upgrade'; id: number; kind: string }
  | { t: 'sell'; id: number }
  | { t: 'target'; id: number; priority: TowerPriority };

export type Refusal = 'phase' | 'unknown-kind' | 'not-a-pad' | 'occupied' | 'credits' | 'no-tower' | 'not-an-upgrade' | 'priority';

const CORE: Record<Difficulty, number> = { relaxed: 30, standard: 20, hard: 12 };
const CREDIT_PERCENT: Record<Difficulty, number> = { relaxed: 125, standard: 100, hard: 90 };
const COUNT_PERCENT: Record<Difficulty, number> = { relaxed: 80, standard: 100, hard: 120 };

const scaled = (value: number, percent: number): number => Math.max(1, Math.floor((value * percent) / 100));

export function mapOf(state: Pick<TdCore, 'mapId'>): TdMap {
  const map = mapById(state.mapId);
  if (!map) throw new RangeError(`Unknown map ${state.mapId}`);
  return map;
}

export function newGame(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY, mapId: string = (MAPS[0] as TdMap).id): TdState {
  const map = mapById(mapId);
  if (!map) throw new RangeError(`Unknown map ${mapId}`);
  const rng = createRng(seed);
  const variants = map.waves.map((slot) => (slot.length > 1 ? rng.int(0, slot.length - 1) : 0));
  const world = createWorld({ map: { w: map.w, h: map.h, terrain: map.rows.join('') }, sides: 2, entities: [], seed }, TD_RULESET);
  return {
    v: 1,
    mapId: map.id,
    difficulty,
    seed: world.rng,
    variants,
    phase: 'build',
    wave: 0,
    credits: scaled(map.startCredits, CREDIT_PERCENT[difficulty]),
    core: CORE[difficulty],
    world,
    towers: [],
    run: null,
    stats: { killed: 0, leaked: 0, spent: 0, retries: 0 },
    checkpoint: null,
    log: [[]]
  };
}

export const waveCount = (state: Pick<TdCore, 'mapId'>): number => mapOf(state).waves.length;

/** The spawn schedule of a wave as the player sees it in the preview (difficulty applied). */
export function waveSchedule(state: Pick<TdCore, 'mapId' | 'variants' | 'difficulty'>, wave: number): PendingSpawn[] {
  const map = mapOf(state);
  const def = map.waves[wave]?.[state.variants[wave] ?? 0];
  if (!def) return [];
  const list: PendingSpawn[] = [];
  for (const group of def.groups) {
    const count = Math.max(1, Math.ceil((group.count * COUNT_PERCENT[state.difficulty]) / 100));
    for (let i = 0; i < count; i++) list.push({ at: group.at + i * group.every, kind: group.kind, route: group.route });
  }
  // Stable: equal times keep the authored order.
  return list.map((s, i) => ({ s, i })).sort((a, b) => a.s.at - b.s.at || a.i - b.i).map(({ s }) => s);
}

/** Counts per enemy kind and route for the preview. */
export function wavePreview(state: Pick<TdCore, 'mapId' | 'variants' | 'difficulty'>, wave: number): { kind: EnemyKind; route: number; count: number }[] {
  const out: { kind: EnemyKind; route: number; count: number }[] = [];
  for (const s of waveSchedule(state, wave)) {
    const row = out.find((r) => r.kind === s.kind && r.route === s.route);
    if (row) row.count++;
    else out.push({ kind: s.kind, route: s.route, count: 1 });
  }
  return out;
}

export const towerAt = (world: World, x: number, y: number): Entity | undefined => world.entities.find((e) => e.side === 0 && e.x === x && e.y === y);

export const isPad = (state: Pick<TdCore, 'world'>, x: number, y: number): boolean =>
  x >= 0 && y >= 0 && x < state.world.map.w && y < state.world.map.h && state.world.map.terrain[y * state.world.map.w + x] === 'b';

/** Credits a sale would return now. */
export const refundOf = (record: TowerRecord): number => record.fresh + Math.floor(((record.invested - record.fresh) * SELL_PERCENT) / 100);

/** Why a build command cannot be applied now, or `null` if it can. Never throws. */
export function checkCommand(state: TdState, cmd: BuildCommand): Refusal | null {
  if (state.phase !== 'build') return 'phase';
  if (cmd.t === 'place') {
    if (!BASE_TOWERS.includes(cmd.kind)) return 'unknown-kind';
    if (!isPad(state, cmd.x, cmd.y)) return 'not-a-pad';
    if (state.world.entities.some((e) => e.x === cmd.x && e.y === cmd.y)) return 'occupied';
    return (TOWERS[cmd.kind]?.price ?? Infinity) > state.credits ? 'credits' : null;
  }
  const tower = state.world.entities.find((e) => e.id === cmd.id && e.side === 0);
  if (!tower) return 'no-tower';
  if (cmd.t === 'upgrade') {
    const next = TOWERS[tower.kind]?.next ?? [];
    if (!next.includes(cmd.kind)) return 'not-an-upgrade';
    return (TOWERS[cmd.kind]?.price ?? Infinity) > state.credits ? 'credits' : null;
  }
  if (cmd.t === 'target') return (TOWER_PRIORITIES as readonly string[]).includes(cmd.priority) ? null : 'priority';
  return null;
}

/** Apply a build command; returns the same state object when it is refused. */
export function applyCommand(state: TdState, cmd: BuildCommand): TdState {
  if (checkCommand(state, cmd) !== null) return state;
  const s = structuredClone(state);
  const w = s.world;
  if (cmd.t === 'place') {
    const def = TOWERS[cmd.kind]!;
    const id = w.nextId++;
    w.entities.push(spawn(id, 0, archetypeOf(TD_RULESET, cmd.kind)!, cmd.x, cmd.y));
    s.towers.push({ id, invested: def.price, fresh: def.price });
    s.credits -= def.price;
    s.stats.spent += def.price;
  } else {
    const tower = w.entities.find((e) => e.id === cmd.id)!;
    const record = s.towers.find((r) => r.id === cmd.id)!;
    if (cmd.t === 'upgrade') {
      const price = TOWERS[cmd.kind]!.price;
      const from = archetypeOf(TD_RULESET, tower.kind)!;
      const to = archetypeOf(TD_RULESET, cmd.kind)!;
      tower.kind = cmd.kind;
      tower.hp = Math.max(1, Math.floor((tower.hp * to.hp) / from.hp));
      tower.cooldown = 0;
      tower.beam = null;
      record.invested += price;
      record.fresh += price;
      s.credits -= price;
      s.stats.spent += price;
    } else if (cmd.t === 'sell') {
      s.credits += refundOf(record);
      s.stats.spent -= record.fresh;
      w.entities = w.entities.filter((e) => e.id !== cmd.id);
      s.towers = s.towers.filter((r) => r.id !== cmd.id);
    } else {
      tower.doctrine = { ...DEFAULT_DOCTRINE, priority: cmd.priority };
    }
  }
  s.log[s.wave]!.push(cmd);
  return s;
}

const coreOf = (s: TdState): TdCore => {
  const { v: _v, checkpoint: _c, log: _l, ...core } = s;
  return structuredClone(core);
};

/** Lock the build and start the next wave. */
export function startWave(state: TdState): TdState {
  if (state.phase !== 'build') return state;
  const s = structuredClone(state);
  s.checkpoint = coreOf(state);
  for (const r of s.towers) r.fresh = 0;
  s.phase = 'wave';
  s.run = { tick: 0, pending: waveSchedule(s, s.wave), walkers: [] };
  return s;
}

const chebyshev = (ax: number, ay: number, bx: number, by: number): number => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

/** Advance the running wave by `ticks` ticks (or until it ends). */
/** A unit that got through: its kind and the health it still had (for summaries and grading). */
export interface Leak {
  id: number;
  kind: EnemyKind;
  hp: number;
}

export interface WaveStep {
  state: TdState;
  events: SimEvent[];
  leaks: Leak[];
}

export function stepWave(state: TdState, ticks = 1): WaveStep {
  if (state.phase !== 'wave' || !state.run) return { state, events: [], leaks: [] };
  let s = structuredClone(state);
  const events: SimEvent[] = [];
  const leaks: Leak[] = [];
  for (let i = 0; i < ticks && s.phase === 'wave'; i++) s = tickWave(s, events, leaks);
  return { state: s, events, leaks };
}

/** Run the current wave to its end. */
export function resolveWave(state: TdState): WaveStep {
  return stepWave(state, MAX_WAVE_TICKS + 1);
}

function tickWave(s: TdState, events: SimEvent[], leaks: Leak[]): TdState {
  const map = mapOf(s);
  const run = s.run!;
  let w = s.world;
  // 1. Spawns that are due and whose spawn cell is free on their layer.
  const waiting: PendingSpawn[] = [];
  for (const p of run.pending) {
    const route = map.routes[p.route]!;
    const [x, y] = route.points[0]!;
    const arch = archetypeOf(TD_RULESET, p.kind)!;
    const blocked = w.entities.some((e) => e.x === x && e.y === y && archetypeOf(TD_RULESET, e.kind)?.layer === arch.layer);
    if (p.at > run.tick || blocked || waiting.some((q) => q.route === p.route && q.at <= run.tick)) {
      waiting.push(p);
      continue;
    }
    const id = w.nextId++;
    w.entities.push(spawn(id, 1, arch, x, y));
    run.walkers.push({ id, route: p.route, leg: 1 });
  }
  run.pending = waiting;
  // 2. Route following: a unit within one cell of its waypoint heads for the next; at the goal it leaks.
  const commands: Command[] = [];
  const leaked = new Set<number>();
  for (const walker of run.walkers) {
    const unit = w.entities.find((e) => e.id === walker.id);
    if (!unit) continue;
    const points = map.routes[walker.route]!.points;
    while (walker.leg < points.length - 1 && chebyshev(unit.x, unit.y, ...points[walker.leg]!) <= 1) walker.leg++;
    const [gx, gy] = points[walker.leg]!;
    if (walker.leg === points.length - 1 && chebyshev(unit.x, unit.y, gx, gy) <= 1) {
      leaked.add(unit.id);
      continue;
    }
    if (unit.order.type !== 'move' || unit.order.x !== gx || unit.order.y !== gy) commands.push({ side: 1, unit: unit.id, order: { type: 'move', x: gx, y: gy } });
  }
  if (leaked.size > 0) leak(s, w, leaked, leaks);
  // 3. One engine tick.
  const result = runTicks(w, TD_RULESET, commands, 1);
  w = result.world;
  s.world = w;
  for (const e of result.events) {
    events.push(e);
    if (e.t !== 'destroyed') continue;
    if (e.side === 1 && isEnemyKind(e.kind)) {
      s.credits += ENEMIES[e.kind].bounty;
      s.stats.killed++;
    } else if (e.side === 0) {
      s.towers = s.towers.filter((r) => r.id !== e.id);
    }
  }
  const alive = new Set(w.entities.map((e) => e.id));
  run.walkers = run.walkers.filter((x) => alive.has(x.id));
  run.tick++;
  // 4. Safety bound, then the end of the wave.
  if (run.tick >= MAX_WAVE_TICKS) {
    leak(s, w, new Set(run.walkers.map((x) => x.id)), leaks);
    for (const p of run.pending) {
      s.core -= ENEMIES[p.kind].threat;
      leaks.push({ id: 0, kind: p.kind, hp: archetypeOf(TD_RULESET, p.kind)?.hp ?? 1 });
    }
    s.stats.leaked += run.pending.length;
    run.pending = [];
  }
  if (s.core <= 0) {
    // The wave is over: what is left of it leaves the map (a lost state holds no running wave).
    s.core = 0;
    s.phase = 'lost';
    s.run = null;
    s.world.entities = s.world.entities.filter((e) => e.side !== 1);
    s.world.projectiles = [];
    return s;
  }
  if (run.pending.length === 0 && run.walkers.length === 0 && w.projectiles.length === 0) endWave(s);
  return s;
}

function leak(s: TdState, w: World, ids: ReadonlySet<number>, out: Leak[]): void {
  for (const e of w.entities) {
    if (!ids.has(e.id) || !isEnemyKind(e.kind)) continue;
    out.push({ id: e.id, kind: e.kind, hp: e.hp });
    s.core -= ENEMIES[e.kind].threat;
    s.stats.leaked++;
  }
  w.entities = w.entities.filter((e) => !ids.has(e.id));
  if (s.run) s.run.walkers = s.run.walkers.filter((x) => !ids.has(x.id));
}

function endWave(s: TdState): void {
  const map = mapOf(s);
  s.run = null;
  // Towers keep their damage; cooldowns and beams reset between waves.
  for (const e of s.world.entities) {
    e.cooldown = 0;
    e.beam = null;
    e.status = [];
  }
  if (s.wave >= map.waves.length - 1) {
    s.phase = 'won';
    return;
  }
  // Income plus interest on what was left unspent when the wave started (the checkpoint is that moment).
  s.credits += incomeAfter(s, s.wave) + interestOf(s.checkpoint?.credits ?? 0);
  s.wave++;
  s.phase = 'build';
  s.log.push([]);
}

/** After a defeat the player may end the game instead of retrying: final, no retry afterwards. */
export function endGame(state: TdState): TdState {
  return state.phase === 'lost' ? { ...structuredClone(state), phase: 'ended' } : state;
}

/** After a defeat: back to the build phase of the lost wave, exactly as it was locked. */
export function retryWave(state: TdState): TdState {
  if (state.phase !== 'lost' || !state.checkpoint) return state;
  const core = structuredClone(state.checkpoint);
  return { ...core, v: 1, checkpoint: null, log: structuredClone(state.log.slice(0, core.wave + 1)), stats: { ...core.stats, retries: state.stats.retries + 1 } };
}

/** Replays a game from its log (reproduction and tests). */
export function replay(seed: number, difficulty: Difficulty, mapId: string, log: readonly (readonly BuildCommand[])[]): TdState {
  let s = newGame(seed, difficulty, mapId);
  for (let wave = 0; wave < log.length; wave++) {
    for (const cmd of log[wave]!) s = applyCommand(s, cmd);
    if (wave < log.length - 1) s = resolveWave(startWave(s)).state;
  }
  return s;
}

// ---------------------------------------------------------------------------------------------
// Validation of untrusted saves (never throws).

const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const isArrayOf = <T>(v: unknown, guard: (x: unknown) => x is T): v is T[] => Array.isArray(v) && v.every(guard);

const isCommand = (v: unknown): v is BuildCommand => {
  if (!isRecord(v)) return false;
  switch (v.t) {
    case 'place':
      return typeof v.kind === 'string' && isInt(v.x, 0, 255) && isInt(v.y, 0, 255);
    case 'upgrade':
      return isInt(v.id, 1) && typeof v.kind === 'string';
    case 'sell':
      return isInt(v.id, 1);
    case 'target':
      return isInt(v.id, 1) && (TARGET_PRIORITIES as readonly unknown[]).includes(v.priority);
    default:
      return false;
  }
};

function isValidCore(v: unknown): v is TdCore {
  if (!isRecord(v) || typeof v.mapId !== 'string') return false;
  const map = mapById(v.mapId);
  if (!map) return false;
  if (!(DIFFICULTIES as readonly unknown[]).includes(v.difficulty) || !isInt(v.seed, 0, 0xffffffff)) return false;
  if (!isArrayOf(v.variants, (x): x is number => isInt(x)) || v.variants.length !== map.waves.length || v.variants.some((x, i) => x >= (map.waves[i]?.length ?? 0))) return false;
  if (!['build', 'wave', 'won', 'lost', 'ended'].includes(v.phase as string) || !isInt(v.wave, 0, map.waves.length - 1)) return false;
  if (!isInt(v.credits, 0, 1_000_000) || !isInt(v.core, 0, 1000)) return false;
  if (!isValidWorld(v.world, TD_RULESET) || v.world.sides !== 2) return false;
  const world = v.world;
  if (world.map.w !== map.w || world.map.h !== map.h || world.map.terrain !== map.rows.join('')) return false;
  if (!isRecord(v.stats) || !['killed', 'leaked', 'spent', 'retries'].every((k) => isInt((v.stats as Record<string, unknown>)[k], -1_000_000, 1_000_000))) return false;
  const towers = world.entities.filter((e) => e.side === 0);
  // Towers only of known kinds and only on build pads.
  if (towers.some((e) => !Object.hasOwn(TOWERS, e.kind) || map.rows[e.y]?.[e.x] !== 'b') || world.entities.some((e) => e.side === 1 && !isEnemyKind(e.kind))) return false;
  // Exactly one record per tower (commands look records up by tower id).
  if (
    !isArrayOf(v.towers, (r): r is TowerRecord => isRecord(r) && isInt(r.id, 1) && isInt(r.invested, 0, 1_000_000) && isInt(r.fresh, 0, 1_000_000) && (r.fresh as number) <= (r.invested as number)) ||
    v.towers.length !== towers.length ||
    new Set(v.towers.map((r) => r.id)).size !== v.towers.length ||
    v.towers.some((r) => !towers.some((e) => e.id === r.id))
  )
    return false;
  const enemies = world.entities.filter((e) => e.side === 1);
  if (v.phase === 'wave') {
    const run = v.run;
    if (!isRecord(run) || !isInt(run.tick, 0, MAX_WAVE_TICKS)) return false;
    if (!isArrayOf(run.pending, (p): p is PendingSpawn => isRecord(p) && isInt(p.at, 0) && typeof p.kind === 'string' && isEnemyKind(p.kind) && isInt(p.route, 0, map.routes.length - 1))) return false;
    if (!isArrayOf(run.walkers, (x): x is Walker => isRecord(x) && isInt(x.id, 1) && isInt(x.route, 0, map.routes.length - 1) && isInt(x.leg, 1, (map.routes[x.route as number]?.points.length ?? 1) - 1))) return false;
    if (run.walkers.length !== enemies.length || enemies.some((e) => !(run.walkers as Walker[]).some((x) => x.id === e.id))) return false;
    // A wave never holds more units than its schedule (bounds the work a crafted save can cause).
    const scheduled = waveSchedule(v as unknown as TdCore, v.wave as number).length;
    if (run.pending.length + run.walkers.length > scheduled) return false;
  } else if (v.run !== null || enemies.length > 0 || world.projectiles.length > 0) return false;
  return true;
}

export function isValidState(v: unknown): v is TdState {
  if (!isRecord(v) || v.v !== 1 || !isValidCore(v)) return false;
  if (v.checkpoint !== null) {
    // The checkpoint is this game at the lock of its current (or, between waves, its last) wave.
    const c = v.checkpoint;
    if (!isValidCore(c) || c.phase !== 'build' || c.mapId !== v.mapId || c.difficulty !== v.difficulty || c.seed !== v.seed) return false;
    if (JSON.stringify(c.variants) !== JSON.stringify(v.variants) || (c.wave !== v.wave && c.wave !== (v.wave as number) - 1)) return false;
  }
  if (!isArrayOf(v.log, (l): l is BuildCommand[] => isArrayOf(l, isCommand)) || v.log.length !== (v.wave as number) + 1) return false;
  return true;
}
