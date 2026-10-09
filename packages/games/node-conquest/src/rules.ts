import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { BOARD, getMap, INTRO_MAP, LAYOUTS, MAPS_PER_SET, NODE_TYPES, type FactionCount, type GameMap, type Layout, type NodeType } from './maps';

export { BOARD, getMap, INTRO_MAP, LAYOUTS, MAPS_PER_SET, NODE_TYPES };
export type { FactionCount, GameMap, Layout, NodeType };

/** Opponent intelligence, easiest first (the host's difficulty select). Every level plays by the same rules. */
export const DIFFICULTIES = ['beginner', 'advanced', 'strong', 'master'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const OPPONENT_COUNTS = [1, 2, 3] as const;
export type OpponentCount = (typeof OPPONENT_COUNTS)[number];

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
 * - Bastions (armoured nodes) take half damage: every hostile point that arrives first fills the
 *   bastion's armour bit (`half[v]` 0 → 1, no level change); the next hostile point empties it
 *   (1 → 0) and lowers the level by one (or converts the node at level 1). So 2 hostile points =
 *   1 level, a frigate (3 points) on an empty armour bit = 1 level and a filled bit. The bit is
 *   shared by all attackers, is untouched by own reinforcements and resets to 0 on conversion.
 *   Bastions produce drones, but slower than outposts.
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
export const PRODUCTION_INTERVAL: Record<NodeType, number> = { standard: 10, shipyard: 25, station: 0, bastion: 16 };
export const PRODUCED_KIND: Record<NodeType, UnitKind> = { standard: 0, shipyard: 1, station: 0, bastion: 0 };
/** History: one sample of node counts every HISTORY_EVERY ticks; above HISTORY_CAP samples every other one is dropped. */
export const HISTORY_EVERY = 50;
export const HISTORY_CAP = 120;
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

/** Compact match history for the post-game review: sample `i` was taken at tick `start + i * every`. */
export interface History {
  start: number;
  every: number;
  /** Node count per faction (player first). */
  rows: number[][];
}

export interface NcState {
  seed: number;
  difficulty: Difficulty;
  /** Number of opponents (the intro map always has one). */
  opponents: OpponentCount;
  /** Map index 0–6, or INTRO_MAP. */
  map: number;
  layout: Layout;
  tick: number;
  speed: 1 | 2;
  owner: number[];
  level: number[];
  /** Active outgoing paths per node, in activation order. */
  out: number[][];
  /** Production / firing charge per node. */
  charge: number[];
  /** Bastion armour bit per node (0 or 1; always 0 for other node types). */
  half: number[];
  units: Unit[];
  /** State of the opponents' shared PRNG. */
  rng: number;
  result: Result;
  stats: Stats;
  hist: History;
  /** [tick, faction] of the first conversion of the centre node, or []. */
  centre: number[];
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

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : 'beginner');
export const toOpponents = (value: unknown): OpponentCount => (isOneOf(value, OPPONENT_COUNTS) ? value : 1);
export const mapForSeed = (seed: number): number => (seed >>> 0) % MAPS_PER_SET;
export const mapOf = (state: Pick<NcState, 'opponents' | 'map' | 'layout'>): GameMap =>
  getMap((state.map === INTRO_MAP ? 2 : state.opponents + 1) as FactionCount, state.map, state.layout);

const emptyStats = (): Stats => ({ produced: 0, reinforced: 0, passed: 0, absorbed: 0, hits: 0, fought: 0, shot: 0, captured: 0 });

/** Node count per faction. */
export const countsOf = (s: Pick<NcState, 'owner'>, factions: number): number[] => {
  const counts = new Array<number>(factions).fill(0);
  for (const o of s.owner) if (o >= 0) counts[o]!++;
  return counts;
};

export interface GameOptions {
  difficulty?: Difficulty;
  /** Map index 0–6 or INTRO_MAP; default: chosen by the seed. */
  map?: number;
  opponents?: OpponentCount;
  layout?: Layout;
}

export function createGame(seed: number, options: GameOptions = {}): NcState {
  const mapIndex = options.map ?? mapForSeed(seed);
  const opponents: OpponentCount = mapIndex === INTRO_MAP ? 1 : (options.opponents ?? 1);
  const layout: Layout = mapIndex === INTRO_MAP ? 2 : (options.layout ?? 2);
  const map = getMap((opponents + 1) as FactionCount, mapIndex, layout);
  const owner = map.nodes.map((n) => n.owner);
  return {
    seed: seed >>> 0,
    difficulty: options.difficulty ?? 'beginner',
    opponents,
    map: mapIndex,
    layout,
    tick: 0,
    speed: 1,
    owner,
    level: map.nodes.map((n) => n.level),
    out: map.nodes.map(() => []),
    charge: map.nodes.map(() => 0),
    half: map.nodes.map(() => 0),
    units: [],
    rng: (seed ^ 0x9e3779b9) >>> 0,
    result: 'playing',
    stats: emptyStats(),
    hist: { start: 0, every: HISTORY_EVERY, rows: [countsOf({ owner }, map.factions)] },
    centre: []
  };
}

export const cloneState = (s: NcState): NcState => ({
  ...s,
  owner: [...s.owner],
  level: [...s.level],
  out: s.out.map((o) => [...o]),
  charge: [...s.charge],
  half: [...s.half],
  units: s.units.map((u) => ({ ...u })),
  stats: { ...s.stats },
  hist: { ...s.hist, rows: s.hist.rows.map((r) => [...r]) },
  centre: [...s.centre]
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

interface Scratch {
  /** Units per lane and direction (index 2 * lane + direction); always zero between calls. */
  count: Int32Array;
  /** Distance of the front-most unit per lane and direction; always zero between calls. */
  front: Int32Array;
  flag: Uint8Array;
  /** Flat lane index: `lane[a * n + b]`. */
  lane: Int32Array;
  /** Flat lane length: `length[a * n + b]` (0 without lane). */
  length: Int32Array;
  /** Per defence platform and lane: distance from the platform to the lane segment, rounded down. */
  near: Map<number, Float64Array>;
}
const scratches = new WeakMap<GameMap, Scratch>();

/** Reusable per-map buffers (performance only; results never depend on them). */
function scratchOf(map: GameMap): Scratch {
  let scratch = scratches.get(map);
  if (!scratch) {
    const near = new Map<number, Float64Array>();
    map.nodes.forEach((node, v) => {
      if (node.type !== 'station') return;
      near.set(
        v,
        Float64Array.from(map.lanes, ([a, b]) => {
          const A = map.nodes[a]!;
          const B = map.nodes[b]!;
          const [dx, dy] = [B.x - A.x, B.y - A.y];
          const t = Math.max(0, Math.min(1, ((node.x - A.x) * dx + (node.y - A.y) * dy) / (dx * dx + dy * dy || 1)));
          return Math.floor(Math.hypot(A.x + t * dx - node.x, A.y + t * dy - node.y));
        })
      );
    });
    const n = map.nodes.length;
    const lane = new Int32Array(n * n).fill(-1);
    const length = new Int32Array(n * n);
    map.lanes.forEach(([a, b, len], i) => {
      lane[a * n + b] = lane[b * n + a] = i;
      length[a * n + b] = length[b * n + a] = len;
    });
    scratch = { count: new Int32Array(2 * map.lanes.length), front: new Int32Array(2 * map.lanes.length), flag: new Uint8Array(map.lanes.length), lane, length, near };
    scratches.set(map, scratch);
  }
  return scratch;
}

/** Head-on fights between units of different factions travelling in opposite directions. */
function fight(s: NcState, map: GameMap): void {
  const { count, front, flag, lane: laneAt } = scratchOf(map);
  const n = map.nodes.length;
  // Pass 1: per lane and direction, how many units and how far the front-most one is.
  const touched: number[] = [];
  for (const u of s.units) {
    const lane = laneAt[u.a * n + u.b]!;
    const i = 2 * lane + (u.a < u.b ? 0 : 1);
    if (count[2 * lane]! + count[2 * lane + 1]! === 0) touched.push(lane);
    count[i]!++;
    if (u.d > front[i]!) front[i] = u.d;
  }
  // Only lanes where both directions are used and the front-most units have met can see fights.
  const meeting: number[] = [];
  for (const lane of touched) {
    if (count[2 * lane]! > 0 && count[2 * lane + 1]! > 0 && front[2 * lane]! + front[2 * lane + 1]! >= map.lanes[lane]![2]) {
      meeting.push(lane);
      flag[lane] = 1;
    }
    count[2 * lane] = count[2 * lane + 1] = front[2 * lane] = front[2 * lane + 1] = 0;
  }
  if (meeting.length === 0) return;
  const forward = new Map<number, Unit[]>();
  const backward = new Map<number, Unit[]>();
  for (const lane of meeting) {
    forward.set(lane, []);
    backward.set(lane, []);
  }
  for (const u of s.units) {
    const lane = laneAt[u.a * n + u.b]!;
    if (flag[lane] === 1) (u.a < u.b ? forward : backward).get(lane)!.push(u);
  }
  let died = false;
  for (const lane of meeting) {
    flag[lane] = 0;
    const len = map.lanes[lane]![2];
    const fw = forward.get(lane)!.sort((x, y) => y.d - x.d);
    const bw = backward.get(lane)!.sort((x, y) => y.d - x.d);
    // Destroyed units at the front are skipped by every later unit, so they are passed only once.
    let first = 0;
    for (const x of fw) {
      while (first < bw.length && bw[first]!.hp <= 0) first++;
      if (first === bw.length) break;
      for (let j = first; j < bw.length; j++) {
        const y = bw[j]!;
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
  }
  if (died) {
    const before = s.units.length;
    s.units = s.units.filter((u) => u.hp > 0);
    s.stats.fought += before - s.units.length;
  }
}

function defend(s: NcState, map: GameMap, events: StepEvents): void {
  let died = false;
  const { near, lane: laneAt } = scratchOf(map);
  const n = map.nodes.length;
  map.nodes.forEach((node, v) => {
    if (node.type !== 'station') return;
    const f = s.owner[v]!;
    if (f < 0) {
      s.charge[v] = 0;
      return;
    }
    if (s.charge[v]! < SHOT_INTERVAL) s.charge[v] = s.charge[v]! + 1;
    if (s.charge[v]! < SHOT_INTERVAL) return;
    const range = stationRange(s.level[v]!);
    const range2 = range ** 2;
    // Integer unit positions lie within 1.5 of the lane segment, so lanes further away are skipped.
    const laneDistance = near.get(v)!;
    let best: Unit | null = null;
    let bestD = Infinity;
    let bestPos: [number, number] = [0, 0];
    for (const u of s.units) {
      if (u.f === f || u.hp <= 0 || laneDistance[laneAt[u.a * n + u.b]!]! > range + 2) continue;
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

function capture(s: NcState, map: GameMap, v: number, f: number, events: StepEvents): void {
  events.captures.push([v, f, s.owner[v]!]);
  if (f === 0) s.stats.captured++;
  if (v === map.center && s.centre.length === 0) s.centre = [s.tick + 1, f];
  s.owner[v] = f;
  s.level[v] = 1;
  s.out[v] = [];
  s.charge[v] = 0;
  s.half[v] = 0;
}

function arrive(s: NcState, map: GameMap, events: StepEvents): void {
  const staying: Unit[] = [];
  const { length } = scratchOf(map);
  const n = map.nodes.length;
  for (const u of s.units) {
    if (u.d < length[u.a * n + u.b]!) {
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
    const armoured = map.nodes[v]!.type === 'bastion';
    for (let p = 0; p < UNIT_POWER[u.k]; p++) {
      if (s.owner[v] === u.f) s.level[v] = Math.min(MAX_LEVEL, s.level[v]! + 1);
      else if (armoured && s.half[v] === 0) s.half[v] = 1;
      else {
        if (armoured) s.half[v] = 0;
        if (s.level[v]! > 1) s.level[v] = s.level[v]! - 1;
        else capture(s, map, v, u.f, events);
      }
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

export function nodeCount(s: Pick<NcState, 'owner'>, faction: number): number {
  let count = 0;
  for (const o of s.owner) if (o === faction) count++;
  return count;
}

/** Records a history sample when one is due (after the tick counter advanced). */
function sample(s: NcState, map: GameMap): void {
  const h = s.hist;
  if (s.tick < h.start || (s.tick - h.start) % h.every !== 0) return;
  h.rows.push(countsOf(s, map.factions));
  if (h.rows.length > HISTORY_CAP) {
    h.rows = h.rows.filter((_, i) => i % 2 === 0);
    h.every *= 2;
  }
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
  sample(s, map);
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
  if (!isUint32(s.seed) || !isOneOf(s.difficulty, DIFFICULTIES) || !isOneOf(s.opponents, OPPONENT_COUNTS)) return false;
  if (!isInt(s.map, INTRO_MAP, MAPS_PER_SET - 1) || !isOneOf(s.layout, LAYOUTS)) return false;
  if (s.map === INTRO_MAP && (s.opponents !== 1 || s.layout !== 2)) return false;
  if (!isCount(s.tick) || !isOneOf(s.speed, [1, 2]) || !isUint32(s.rng) || !isOneOf(s.result, RESULTS)) return false;
  if (!isRecord(s.stats) || !STAT_KEYS.every((k) => isCount((s.stats as Record<string, unknown>)[k]))) return false;
  const map = mapOf(s as unknown as NcState);
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
  if (!isArrayOf(s.half, (b): b is number => isInt(b, 0, 1), n)) return false;
  for (let v = 0; v < n; v++) if (s.half[v] === 1 && map.nodes[v]!.type !== 'bastion') return false;
  if (!validHistory(s.hist, s.tick as number, f, n)) return false;
  if (!Array.isArray(s.centre)) return false;
  if (s.centre.length !== 0) {
    if (map.center < 0 || s.centre.length !== 2 || !isInt(s.centre[0], 1, s.tick as number) || !isInt(s.centre[1], 0, f - 1)) return false;
  }
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

function validHistory(value: unknown, tick: number, factions: number, n: number): value is History {
  if (!isRecord(value) || !isInt(value.start, 0, tick) || !isInt(value.every, HISTORY_EVERY, HISTORY_EVERY * 2 ** 20)) return false;
  if (!Array.isArray(value.rows) || value.rows.length > HISTORY_CAP) return false;
  if (value.rows.length > Math.floor((tick - value.start) / value.every) + 1) return false;
  for (const row of value.rows as unknown[]) {
    if (!isArrayOf(row, (c): c is number => isInt(c, 0, n), factions)) return false;
    if (row.reduce((a, b) => a + b, 0) > n) return false;
  }
  return true;
}

/* ---------- Saves from state version 1 ---------- */

/**
 * Version 1 stored `difficulty` easy/medium/hard, which fixed both the number of opponents (1/2/3)
 * and their behaviour. Mapping (closest behaviour of the old opponents):
 * easy → beginner + 1 opponent, medium → advanced + 2, hard → advanced + 3. The match keeps its
 * exact map (layout 1, no bastions), position, units, PRNG and statistics; bastion armour bits
 * start empty and the review history starts at the tick of the migration.
 */
export const V1_MAPPING: Record<string, [Difficulty, OpponentCount]> = {
  easy: ['beginner', 1],
  medium: ['advanced', 2],
  hard: ['advanced', 3]
};

export function migrateState(old: unknown, fromVersion: number): NcState | undefined {
  try {
    if (fromVersion !== 1 || !isRecord(old) || typeof old.difficulty !== 'string') return undefined;
    const mapping = Object.hasOwn(V1_MAPPING, old.difficulty) ? V1_MAPPING[old.difficulty] : undefined;
    if (!mapping || !Array.isArray(old.owner) || !isInt(old.tick, 0) || !isInt(old.map, 0, MAPS_PER_SET - 1)) return undefined;
    const [difficulty, opponents] = mapping;
    const factions = opponents + 1;
    const owner = old.owner as number[];
    const next = {
      ...old,
      difficulty,
      opponents,
      layout: 1,
      half: owner.map(() => 0),
      hist: { start: old.tick, every: HISTORY_EVERY, rows: [countsOf({ owner: owner.map((o) => (isInt(o, -1, factions - 1) ? o : -1)) }, factions)] },
      centre: []
    };
    return isValidState(next) ? next : undefined;
  } catch {
    return undefined;
  }
}
