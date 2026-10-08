import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { BOARD, DIFFICULTIES, getMap, MAPS_PER_DIFFICULTY, NODE_TYPES, type Difficulty, type GameMap, type NodeType } from './maps';

export { BOARD, DIFFICULTIES, MAPS_PER_DIFFICULTY, NODE_TYPES, getMap };
export type { Difficulty, GameMap, NodeType };

/**
 * Orbit Links — deterministic fixed-step simulation (pure, DOM-free).
 *
 * Time advances in ticks (10 per second of game time). All quantities are integers, so the
 * same seed and the same commands at the same ticks give identical states on every device.
 *
 * Interpretations of the owner's rules (documented in tests):
 * - A unit's strength ("power": drone 1, frigate 3) counts as that many single units when it
 *   arrives: at an own node each point adds one level (capped at 30, the rest is lost); at a
 *   neutral or hostile node each point lowers the level by one while it is above 1, and the
 *   next point converts the node (level 1, no active paths). Points left after a conversion
 *   reinforce the new owner.
 * - A unit arriving at an own node that is already at level 30 travels on along one of that
 *   node's active paths (round robin); without active paths it is absorbed. A unit is passed
 *   on at most MAX_HOPS times (then absorbed), so loops of full nodes cannot pile up units.
 * - Producing units costs the node nothing. A node with no active path produces nothing.
 * - Defence platforms produce nothing, but may hold active paths: at level 30 they relay arriving
 *   units like any full node (otherwise a front held only by platforms could never attack).
 *   Only owned platforms fire.
 * - Units of different factions moving in opposite directions on one lane fight when they meet:
 *   both deal their attack at once until at least one is destroyed.
 */

export const TICKS_PER_SECOND = 10;
export const MAX_LEVEL = 30;
export const NEUTRAL = -1;
export const MAX_FACTIONS = 4;
export const MAX_UNITS = 6000;
export const MAX_HOPS = 4;

export const UNIT_KINDS = ['drone', 'frigate'] as const;
export type UnitKind = 0 | 1;
/** Lane distance per tick. */
export const UNIT_SPEED = [5, 3] as const;
export const UNIT_HP = [1, 3] as const;
/** Damage in head-on fights and level points on arrival. */
export const UNIT_POWER = [1, 3] as const;

/** Ticks between two emissions (one unit on every active path). */
export const PRODUCTION_INTERVAL: Record<NodeType, number> = { standard: 10, shipyard: 25, station: 0 };
export const PRODUCED_KIND: Record<NodeType, UnitKind> = { standard: 0, shipyard: 1, station: 0 };
/** A defence platform fires once every SHOT_INTERVAL ticks at the nearest hostile unit in range. */
export const SHOT_INTERVAL = 6;
export const SHOT_DAMAGE = 1;
export const RANGE_BASE = 70;
export const RANGE_PER_LEVEL = 3;

export const RESULTS = ['playing', 'won', 'lost'] as const;
export type Result = (typeof RESULTS)[number];

export interface Unit {
  /** Faction. */
  f: number;
  k: UnitKind;
  /** Source and target node of the lane it travels on. */
  a: number;
  b: number;
  /** Distance travelled from `a`. */
  d: number;
  hp: number;
  /** How often this unit has been passed on by full nodes. */
  h: number;
}

export interface Stats {
  produced: number;
  /** Units that raised the level of an own node. */
  reinforced: number;
  /** Units forwarded by a node at maximum level. */
  passed: number;
  absorbed: number;
  /** Units that hit a neutral or hostile node. */
  hits: number;
  /** Units destroyed in head-on fights. */
  fought: number;
  /** Units destroyed by defence platforms. */
  shot: number;
  /** Nodes the player converted. */
  captured: number;
}

export interface NcState {
  seed: number;
  difficulty: Difficulty;
  map: number;
  tick: number;
  speed: 1 | 2;
  owner: number[];
  level: number[];
  /** Active outgoing paths per node, in activation order. */
  out: number[][];
  /** Production / firing charge per node. */
  charge: number[];
  units: Unit[];
  /** State of the opponents' shared PRNG. */
  rng: number;
  result: Result;
  stats: Stats;
}

export type Refusal = 'finished' | 'notOwn' | 'notAdjacent' | 'limit' | 'reverse' | 'self';

export interface StepEvents {
  /** [node, new owner, previous owner] */
  captures: [number, number, number][];
  /** [station, x, y] of each shot fired. */
  shots: [number, number, number][];
}

/** Called on every tick after arrivals; used to plug in the opponents (see ai.ts). */
export type Controller = (state: NcState, map: GameMap) => void;

export const maxPaths = (level: number): number => (level >= 20 ? 3 : level >= 10 ? 2 : 1);
export const stationRange = (level: number): number => RANGE_BASE + RANGE_PER_LEVEL * level;

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : 'easy');
export const mapForSeed = (seed: number): number => (seed >>> 0) % MAPS_PER_DIFFICULTY;
export const mapOf = (state: Pick<NcState, 'difficulty' | 'map'>): GameMap => getMap(state.difficulty, state.map);

const emptyStats = (): Stats => ({ produced: 0, reinforced: 0, passed: 0, absorbed: 0, hits: 0, fought: 0, shot: 0, captured: 0 });

export function createGame(seed: number, difficulty: Difficulty = 'easy', mapIndex = mapForSeed(seed)): NcState {
  const map = getMap(difficulty, mapIndex);
  return {
    seed: seed >>> 0,
    difficulty,
    map: mapIndex,
    tick: 0,
    speed: 1,
    owner: map.nodes.map((n) => n.owner),
    level: map.nodes.map((n) => n.level),
    out: map.nodes.map(() => []),
    charge: map.nodes.map(() => 0),
    units: [],
    rng: (seed ^ 0x9e3779b9) >>> 0,
    result: 'playing',
    stats: emptyStats()
  };
}

export const cloneState = (s: NcState): NcState => ({
  ...s,
  owner: [...s.owner],
  level: [...s.level],
  out: s.out.map((o) => [...o]),
  charge: [...s.charge],
  units: s.units.map((u) => ({ ...u })),
  stats: { ...s.stats }
});

/** Why `faction` may not activate `from → to` right now (null = allowed). Deactivation is checked separately. */
export function refusal(s: NcState, map: GameMap, faction: number, from: number, to: number): Refusal | null {
  if (s.result !== 'playing') return 'finished';
  if (s.owner[from] !== faction) return 'notOwn';
  if (from === to) return 'self';
  if ((map.laneOf[from]?.[to] ?? -1) < 0) return 'notAdjacent';
  if (s.out[to]?.includes(from) && s.owner[to] === faction) return 'reverse';
  if (s.out[from]!.length >= maxPaths(s.level[from]!)) return 'limit';
  return null;
}

export const isActive = (s: NcState, from: number, to: number): boolean => s.out[from]?.includes(to) ?? false;

export interface ToggleResult {
  /** 'on' / 'off' when something changed, otherwise the refusal reason. */
  outcome: 'on' | 'off' | Refusal;
}

/** Starts or stops the path `from → to` for `faction`, mutating `s`. */
export function toggleMut(s: NcState, map: GameMap, faction: number, from: number, to: number): ToggleResult {
  if (s.result === 'playing' && s.owner[from] === faction && isActive(s, from, to)) {
    s.out[from] = s.out[from]!.filter((t) => t !== to);
    return { outcome: 'off' };
  }
  const why = refusal(s, map, faction, from, to);
  if (why) return { outcome: why };
  s.out[from]!.push(to);
  return { outcome: 'on' };
}

/** Pure variant of `toggleMut`. */
export function toggle(s: NcState, faction: number, from: number, to: number): { state: NcState } & ToggleResult {
  const next = cloneState(s);
  const result = toggleMut(next, mapOf(s), faction, from, to);
  return { state: result.outcome === 'on' || result.outcome === 'off' ? next : s, ...result };
}

/** Integer position of a unit on the board. */
export function unitPosition(map: GameMap, u: Unit): [number, number] {
  const a = map.nodes[u.a]!;
  const b = map.nodes[u.b]!;
  const len = map.lanes[map.laneOf[u.a]![u.b]!]![2];
  const d = Math.min(u.d, len);
  return [a.x + Math.trunc(((b.x - a.x) * d) / len), a.y + Math.trunc(((b.y - a.y) * d) / len)];
}

const laneLength = (map: GameMap, a: number, b: number) => map.lanes[map.laneOf[a]![b]!]![2];

function produce(s: NcState, map: GameMap): void {
  map.nodes.forEach((node, v) => {
    const f = s.owner[v]!;
    if (f < 0 || node.type === 'station') return;
    const paths = s.out[v]!;
    if (paths.length === 0) return;
    s.charge[v] = s.charge[v]! + 1;
    if (s.charge[v]! < PRODUCTION_INTERVAL[node.type]) return;
    s.charge[v] = 0;
    const k = PRODUCED_KIND[node.type];
    for (const to of paths) {
      s.units.push({ f, k, a: v, b: to, d: 0, hp: UNIT_HP[k], h: 0 });
      s.stats.produced++;
    }
  });
}

function move(s: NcState): void {
  for (const u of s.units) u.d += UNIT_SPEED[u.k];
}

/** Head-on fights between units of different factions travelling in opposite directions. */
function fight(s: NcState, map: GameMap): void {
  const forward: Unit[][] = map.lanes.map(() => []);
  const backward: Unit[][] = map.lanes.map(() => []);
  for (const u of s.units) {
    const lane = map.laneOf[u.a]![u.b]!;
    (u.a < u.b ? forward : backward)[lane]!.push(u);
  }
  let died = false;
  map.lanes.forEach(([, , len], lane) => {
    const fw = forward[lane]!;
    const bw = backward[lane]!;
    if (fw.length === 0 || bw.length === 0) return;
    fw.sort((x, y) => y.d - x.d);
    bw.sort((x, y) => y.d - x.d);
    for (const x of fw) {
      for (const y of bw) {
        if (x.hp <= 0) break;
        if (y.hp <= 0 || y.f === x.f) continue;
        if (x.d + y.d < len) break;
        while (x.hp > 0 && y.hp > 0) {
          const hitX = UNIT_POWER[y.k];
          y.hp -= UNIT_POWER[x.k];
          x.hp -= hitX;
        }
        died = true;
      }
    }
  });
  if (died) {
    const before = s.units.length;
    s.units = s.units.filter((u) => u.hp > 0);
    s.stats.fought += before - s.units.length;
  }
}

function defend(s: NcState, map: GameMap, events: StepEvents): void {
  let died = false;
  map.nodes.forEach((node, v) => {
    if (node.type !== 'station') return;
    const f = s.owner[v]!;
    if (f < 0) {
      s.charge[v] = 0;
      return;
    }
    if (s.charge[v]! < SHOT_INTERVAL) s.charge[v] = s.charge[v]! + 1;
    if (s.charge[v]! < SHOT_INTERVAL) return;
    const range2 = stationRange(s.level[v]!) ** 2;
    let best: Unit | null = null;
    let bestD = Infinity;
    let bestPos: [number, number] = [0, 0];
    for (const u of s.units) {
      if (u.f === f || u.hp <= 0) continue;
      const p = unitPosition(map, u);
      const dist = (p[0] - node.x) ** 2 + (p[1] - node.y) ** 2;
      if (dist <= range2 && dist < bestD) [best, bestD, bestPos] = [u, dist, p];
    }
    if (!best) return;
    s.charge[v] = 0;
    best.hp -= SHOT_DAMAGE;
    events.shots.push([v, bestPos[0], bestPos[1]]);
    if (best.hp <= 0) died = true;
  });
  if (died) {
    const before = s.units.length;
    s.units = s.units.filter((u) => u.hp > 0);
    s.stats.shot += before - s.units.length;
  }
}

function capture(s: NcState, v: number, f: number, events: StepEvents): void {
  events.captures.push([v, f, s.owner[v]!]);
  if (f === 0) s.stats.captured++;
  s.owner[v] = f;
  s.level[v] = 1;
  s.out[v] = [];
  s.charge[v] = 0;
}

function arrive(s: NcState, map: GameMap, events: StepEvents): void {
  const staying: Unit[] = [];
  for (const u of s.units) {
    if (u.d < laneLength(map, u.a, u.b)) {
      staying.push(u);
      continue;
    }
    const v = u.b;
    if (s.owner[v] === u.f) {
      if (s.level[v]! < MAX_LEVEL) {
        s.level[v] = Math.min(MAX_LEVEL, s.level[v]! + UNIT_POWER[u.k]);
        s.stats.reinforced++;
      } else if (s.out[v]!.length > 0 && u.h < MAX_HOPS) {
        const paths = s.out[v]!;
        u.a = v;
        u.b = paths[s.stats.passed % paths.length]!;
        u.d = 0;
        u.h++;
        s.stats.passed++;
        staying.push(u);
      } else s.stats.absorbed++;
      continue;
    }
    s.stats.hits++;
    for (let p = 0; p < UNIT_POWER[u.k]; p++) {
      if (s.owner[v] === u.f) s.level[v] = Math.min(MAX_LEVEL, s.level[v]! + 1);
      else if (s.level[v]! > 1) s.level[v] = s.level[v]! - 1;
      else capture(s, v, u.f, events);
    }
  }
  s.units = staying;
}

/** A lower level allows fewer paths: the most recently activated ones stop first. */
function trimPaths(s: NcState): void {
  s.out.forEach((paths, v) => {
    const max = maxPaths(s.level[v]!);
    if (paths.length > max) s.out[v] = paths.slice(0, max);
  });
}

export function nodeCount(s: NcState, faction: number): number {
  return s.owner.filter((o) => o === faction).length;
}

export function updateResult(s: NcState): void {
  if (s.result !== 'playing') return;
  if (nodeCount(s, 0) === 0) s.result = 'lost';
  else if (s.owner.every((o) => o <= 0)) s.result = 'won';
}

/** Advances one tick, mutating `s`. */
export function stepMut(s: NcState, map: GameMap = mapOf(s), controller?: Controller): StepEvents {
  const events: StepEvents = { captures: [], shots: [] };
  if (s.result !== 'playing') return events;
  produce(s, map);
  move(s);
  fight(s, map);
  defend(s, map, events);
  arrive(s, map, events);
  trimPaths(s);
  updateResult(s);
  if (s.result === 'playing' && controller) controller(s, map);
  s.tick++;
  return events;
}

/** Pure: `ticks` steps without opponents' decisions (see `simulate` in ai.ts for full games). */
export function step(s: NcState, ticks = 1, controller?: Controller): NcState {
  const next = cloneState(s);
  const map = mapOf(next);
  for (let i = 0; i < ticks && next.result === 'playing'; i++) stepMut(next, map, controller);
  return next;
}

/** Every unit ever produced is either still travelling or accounted for exactly once. */
export function accountedUnits(s: NcState): number {
  const st = s.stats;
  return s.units.length + st.reinforced + st.absorbed + st.hits + st.fought + st.shot;
}

export const seconds = (s: Pick<NcState, 'tick'>): number => Math.floor(s.tick / TICKS_PER_SECOND);

/* ---------- Validation of untrusted saves ---------- */

const STAT_KEYS: readonly (keyof Stats)[] = ['produced', 'reinforced', 'passed', 'absorbed', 'hits', 'fought', 'shot', 'captured'];
const isCount = (value: unknown): value is number => isInt(value, 0, Number.MAX_SAFE_INTEGER);

export function isValidState(value: unknown): value is NcState {
  try {
    return validate(value);
  } catch {
    return false;
  }
}

function validate(value: unknown): value is NcState {
  if (!isRecord(value)) return false;
  const s = value;
  if (!isUint32(s.seed) || !isOneOf(s.difficulty, DIFFICULTIES) || !isInt(s.map, 0, MAPS_PER_DIFFICULTY - 1)) return false;
  if (!isCount(s.tick) || !isOneOf(s.speed, [1, 2]) || !isUint32(s.rng) || !isOneOf(s.result, RESULTS)) return false;
  if (!isRecord(s.stats) || !STAT_KEYS.every((k) => isCount((s.stats as Record<string, unknown>)[k]))) return false;
  const map = getMap(s.difficulty, s.map);
  const n = map.nodes.length;
  const f = map.factions;
  if (!isArrayOf(s.owner, (o): o is number => isInt(o, NEUTRAL, f - 1), n)) return false;
  if (!isArrayOf(s.level, (l): l is number => isInt(l, 1, MAX_LEVEL), n)) return false;
  if (!isArrayOf(s.charge, (c): c is number => isInt(c, 0, PRODUCTION_INTERVAL.shipyard), n)) return false;
  if (!Array.isArray(s.out) || s.out.length !== n) return false;
  const owner = s.owner as number[];
  const level = s.level as number[];
  for (let v = 0; v < n; v++) {
    const paths: unknown = s.out[v];
    if (!isArrayOf(paths, (t): t is number => isInt(t, 0, n - 1))) return false;
    if (paths.length === 0) continue;
    if (owner[v]! < 0 || paths.length > maxPaths(level[v]!)) return false;
    if (new Set(paths).size !== paths.length) return false;
    for (const t of paths) if (map.laneOf[v]![t]! < 0) return false;
  }
  const out = s.out as number[][];
  for (let v = 0; v < n; v++) for (const t of out[v]!) if (owner[t] === owner[v] && out[t]!.includes(v)) return false;
  if (!Array.isArray(s.units) || s.units.length > MAX_UNITS) return false;
  for (const u of s.units as unknown[]) {
    if (!isRecord(u) || !isInt(u.f, 0, f - 1) || !isOneOf(u.k, [0, 1]) || !isInt(u.a, 0, n - 1) || !isInt(u.b, 0, n - 1)) return false;
    const lane = map.laneOf[u.a as number]![u.b as number]!;
    if (lane < 0 || !isInt(u.d, 0, map.lanes[lane]![2]) || !isInt(u.hp, 1, UNIT_HP[u.k as UnitKind]) || !isInt(u.h, 0, MAX_HOPS)) return false;
  }
  const state = s as unknown as NcState;
  if (accountedUnits(state) !== state.stats.produced) return false;
  const alive = owner.some((o) => o === 0);
  const rivals = owner.some((o) => o > 0);
  if (state.result === 'playing' && (!alive || !rivals)) return false;
  if (state.result === 'won' && rivals) return false;
  if (state.result === 'lost' && alive) return false;
  return true;
}
