import { createRng, type Rng } from '@wp/game-core';

/**
 * Original, seeded maps with exact rotational symmetry (fair starts).
 *
 * One "sector" of nodes is generated around the bottom of the board and copied to every
 * faction by rotation about the centre (180° for two factions, 120° for three, 90° for four).
 * Lanes are the Gabriel graph of all nodes (planar: no crossing lanes, no lane running
 * through a node), decided once per rotation orbit, so every faction sees exactly the same
 * topology and the same lane lengths. All arithmetic is integer (rotation uses a fixed
 * integer table), so maps are identical on every device.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const NODE_TYPES = ['standard', 'shipyard', 'station'] as const;
export type NodeType = (typeof NODE_TYPES)[number];

/** Board size in SVG units (square). */
export const BOARD = 640;
export const MAPS_PER_DIFFICULTY = 7;
export const MIN_NODE_DISTANCE = 100;
export const MAX_LANE_LENGTH = 270;

export interface MapNode {
  readonly x: number;
  readonly y: number;
  readonly type: NodeType;
  /** Starting level (1–30). */
  readonly level: number;
  /** Starting owner: faction index, or -1 for neutral. */
  readonly owner: number;
}

export interface GameMap {
  readonly difficulty: Difficulty;
  readonly index: number;
  /** Player (0) plus opponents. */
  readonly factions: number;
  readonly nodes: readonly MapNode[];
  /** Lanes as [a, b, length] with a < b. */
  readonly lanes: readonly (readonly [number, number, number])[];
  /** `laneOf[a][b]` = lane index or -1. */
  readonly laneOf: readonly (readonly number[])[];
  readonly adjacent: readonly (readonly number[])[];
}

interface Config {
  factions: number;
  perSector: readonly [number, number];
  neutralLevels: readonly [number, number];
  /** Wedge half-width: |x| * 100 <= wedge * y (sector-local, pointing down). */
  wedge: number;
}

const CONFIG: Record<Difficulty, Config> = {
  easy: { factions: 2, perSector: [5, 6], neutralLevels: [2, 8], wedge: 400 },
  medium: { factions: 3, perSector: [4, 5], neutralLevels: [3, 10], wedge: 150 },
  hard: { factions: 4, perSector: [4, 4], neutralLevels: [3, 12], wedge: 90 }
};

/** cos/sin × 10000 for the rotation angles in use (degrees, clockwise on screen). */
const ROTATION: Record<number, readonly [number, number]> = {
  0: [10000, 0],
  90: [0, 10000],
  120: [-5000, 8660],
  180: [-10000, 0],
  240: [-5000, -8660],
  270: [0, -10000]
};

export function rotate(x: number, y: number, degrees: number): [number, number] {
  const [c, s] = ROTATION[degrees] ?? [10000, 0];
  return [Math.round((x * c - y * s) / 10000), Math.round((x * s + y * c) / 10000)];
}

/** Integer square root (floor), exact for all safe integers used here. */
export function isqrt(n: number): number {
  if (n <= 0) return 0;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}

const d2 = (a: readonly [number, number], b: readonly [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

interface Draft {
  local: [number, number][];
  types: NodeType[];
  levels: number[];
  center: { type: NodeType; level: number } | null;
}

function draftSector(rng: Rng, config: Config, withCenter: boolean): Draft | null {
  const n = config.factions;
  const count = rng.int(config.perSector[0], config.perSector[1]);
  const step = 360 / n;
  const placed: [number, number][] = withCenter ? [[0, 0]] : [];
  const local: [number, number][] = [];
  const fits = (p: [number, number]) => {
    for (let k = 0; k < n; k++) {
      const q = rotate(p[0], p[1], k * step);
      if (k > 0 && d2(p, q) < MIN_NODE_DISTANCE ** 2) return false;
      for (const other of placed) if (d2(q, other) < MIN_NODE_DISTANCE ** 2) return false;
    }
    return true;
  };
  const add = (p: [number, number]) => {
    local.push(p);
    for (let k = 0; k < n; k++) placed.push(rotate(p[0], p[1], k * step));
  };
  // The start sits near the outer edge on the sector's axis.
  add([rng.int(-30, 30), rng.int(225, 260)]);
  for (let i = 1; i < count; i++) {
    let ok = false;
    for (let attempt = 0; attempt < 300 && !ok; attempt++) {
      const p: [number, number] = [rng.int(-270, 270), rng.int(20, 270)];
      const r2 = p[0] * p[0] + p[1] * p[1];
      if (r2 < 95 * 95 || r2 > 268 * 268) continue;
      if (Math.abs(p[0]) * 100 > config.wedge * p[1]) continue;
      if (!fits(p)) continue;
      add(p);
      ok = true;
    }
    if (!ok) return null;
  }
  const [lo, hi] = config.neutralLevels;
  const types: NodeType[] = ['standard'];
  const levels = [10];
  // The neutral closest to the start is always an easy first expansion.
  let nearest = 1;
  for (let i = 2; i < count; i++) if (d2(local[i]!, local[0]!) < d2(local[nearest]!, local[0]!)) nearest = i;
  for (let i = 1; i < count; i++) {
    const roll = rng.int(0, 9);
    types.push(i === nearest ? 'standard' : roll < 6 ? 'standard' : roll < 8 ? 'shipyard' : 'station');
    levels.push(i === nearest ? rng.int(2, 3) : rng.int(lo, hi));
  }
  const center = withCenter ? { type: NODE_TYPES[rng.int(0, 2)]!, level: rng.int(12, 18) } : null;
  return { local, types, levels, center };
}

function buildMap(difficulty: Difficulty, index: number, draft: Draft): GameMap | null {
  const config = CONFIG[difficulty];
  const n = config.factions;
  const k = draft.local.length;
  const step = 360 / n;
  const half = BOARD / 2;
  const pos: [number, number][] = [];
  const nodes: MapNode[] = [];
  for (let s = 0; s < n; s++) {
    for (let i = 0; i < k; i++) {
      const [x, y] = rotate(draft.local[i]![0], draft.local[i]![1], s * step);
      pos.push([x, y]);
      nodes.push({ x: x + half, y: y + half, type: draft.types[i]!, level: draft.levels[i]!, owner: i === 0 ? s : -1 });
    }
  }
  if (draft.center) {
    pos.push([0, 0]);
    nodes.push({ x: half, y: half, type: draft.center.type, level: draft.center.level, owner: -1 });
  }
  const total = nodes.length;
  const centerIndex = draft.center ? total - 1 : -1;
  const rot = (v: number, r: number) => (v === centerIndex ? v : ((Math.floor(v / k) + r) % n) * k + (v % k));

  const decided = new Set<string>();
  const laneSet = new Map<string, number>();
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  for (let a = 0; a < total; a++) {
    for (let b = a + 1; b < total; b++) {
      if (decided.has(key(a, b))) continue;
      const len2 = d2(pos[a]!, pos[b]!);
      let keep = len2 <= MAX_LANE_LENGTH ** 2;
      for (let c = 0; c < total && keep; c++) {
        if (c !== a && c !== b && d2(pos[a]!, pos[c]!) + d2(pos[b]!, pos[c]!) <= len2) keep = false;
      }
      const length = isqrt(len2);
      for (let r = 0; r < n; r++) {
        const ra = rot(a, r);
        const rb = rot(b, r);
        decided.add(key(ra, rb));
        if (keep) laneSet.set(key(ra, rb), length);
      }
    }
  }
  const lanes = [...laneSet.entries()]
    .map(([text, length]) => {
      const [a, b] = text.split('-').map(Number) as [number, number];
      return [a, b, length] as const;
    })
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const laneOf = nodes.map(() => nodes.map(() => -1));
  const adjacent: number[][] = nodes.map(() => []);
  lanes.forEach(([a, b], i) => {
    laneOf[a]![b] = i;
    laneOf[b]![a] = i;
    adjacent[a]!.push(b);
    adjacent[b]!.push(a);
  });
  for (const list of adjacent) list.sort((x, y) => x - y);
  const map: GameMap = { difficulty, index, factions: n, nodes, lanes, laneOf, adjacent };
  return isFairMap(map) ? map : null;
}

/** Graph distances from `start` (BFS); unreachable nodes get -1. */
export function hops(map: GameMap, start: number): number[] {
  const dist = map.nodes.map(() => -1);
  dist[start] = 0;
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const v = queue[q]!;
    for (const w of map.adjacent[v]!) {
      if (dist[w] === -1) {
        dist[w] = dist[v]! + 1;
        queue.push(w);
      }
    }
  }
  return dist;
}

/** Playability checks applied to every generated map (also asserted in tests). */
export function isFairMap(map: GameMap): boolean {
  const starts = map.nodes.map((node, i) => (node.owner >= 0 ? i : -1)).filter((i) => i >= 0);
  if (starts.length !== map.factions) return false;
  const dist = hops(map, starts[0]!);
  if (dist.some((d) => d < 0)) return false;
  if (map.adjacent.some((list) => list.length === 0)) return false;
  for (const s of starts) {
    if ((map.adjacent[s]?.length ?? 0) < 2) return false;
    const fromS = hops(map, s);
    for (const t of starts) if (t !== s && fromS[t]! < 3) return false;
  }
  return true;
}

function generate(difficulty: Difficulty, index: number): GameMap {
  const di = DIFFICULTIES.indexOf(difficulty);
  const rng = createRng(0x0c0ffee + di * 7919 + index * 104729);
  for (let attempt = 0; attempt < 500; attempt++) {
    const draft = draftSector(rng, CONFIG[difficulty], (index + attempt) % 3 !== 1);
    if (!draft) continue;
    const map = buildMap(difficulty, index, draft);
    if (map) return map;
  }
  /* c8 ignore next */
  throw new Error(`No fair map for ${difficulty} #${index}`);
}

const cache = new Map<string, GameMap>();

export function getMap(difficulty: Difficulty, index: number): GameMap {
  const id = `${difficulty}:${index}`;
  let map = cache.get(id);
  if (!map) {
    map = generate(difficulty, index);
    cache.set(id, map);
  }
  return map;
}
