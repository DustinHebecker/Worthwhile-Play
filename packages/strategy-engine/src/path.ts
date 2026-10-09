import { AIR_COST, cellOf, dirsFor, minStepCost, passable, stepCost, terrainAt, xOf, yOf } from './grid';
import { TupleHeap } from './heap';
import type { GameMap, Layer, Ruleset } from './types';

export interface PathOptions {
  readonly layer: Layer;
  /** Side whose frame decides tie-breaks (keeps mirrored worlds mirrored). */
  readonly side: number;
  /** Cells that may not be entered (e.g. structures). The goal itself is always allowed. */
  readonly blocked?: ReadonlySet<number>;
  /** Give up on routes costing more than this (bounds the search; `undefined` if none is cheap enough). */
  readonly maxCost?: number;
}

/** Orthogonal step cost into each cell (-1 = impassable), cached per map object, ruleset and layer. */
const costGrids = new WeakMap<GameMap, Map<string, Int32Array>>();

export function costGrid(map: GameMap, ruleset: Ruleset, layer: Layer): Int32Array {
  let byKey = costGrids.get(map);
  if (!byKey) costGrids.set(map, (byKey = new Map()));
  const key = `${ruleset.id}:${layer}`;
  let grid = byKey.get(key);
  if (!grid) {
    grid = new Int32Array(map.w * map.h);
    for (let c = 0; c < grid.length; c++) {
      grid[c] = passable(map, ruleset, xOf(map, c), yOf(map, c), layer) ? orthogonalCost(map, ruleset, c, layer) : -1;
    }
    byKey.set(key, grid);
  }
  return grid;
}

const orthogonalCost = (map: GameMap, ruleset: Ruleset, c: number, layer: Layer): number =>
  layer === 'air' ? AIR_COST : (terrainAt(map, ruleset, xOf(map, c), yOf(map, c)).cost ?? -1);

/**
 * Packs the A* ordering key (f, h, frame index) into one exactly comparable number: frame
 * indices < 2^14 (maps up to 128×128), h < 2^20 and f < 2^19 keep it below 2^53.
 */
const H_SHIFT = 2 ** 14;
const F_SHIFT = 2 ** 34;

/**
 * Deterministic A* over integer step costs. Returns the cells to walk (excluding the start,
 * including the goal), `[]` if already there, or `undefined` if unreachable (or dearer than
 * `maxCost`). Ties: lower f, then lower h, then lower cell index in the side's frame.
 */
export function findPath(map: GameMap, ruleset: Ruleset, start: number, goal: number, options: PathOptions): number[] | undefined {
  if (start === goal) return [];
  const n = map.w * map.h;
  if (goal < 0 || goal >= n) return undefined;
  const { layer, side, blocked } = options;
  const maxCost = options.maxCost ?? Number.POSITIVE_INFINITY;
  const cost = costGrid(map, ruleset, layer);
  const w = map.w;
  const m = minStepCost(ruleset, layer);
  const gx = goal % w;
  const gy = Math.floor(goal / w);
  const h = (c: number): number => {
    const dx = Math.abs((c % w) - gx);
    const dy = Math.abs(Math.floor(c / w) - gy);
    return m * Math.max(dx, dy) + Math.floor((m * Math.min(dx, dy)) / 2);
  };
  const g = new Int32Array(n).fill(-1);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new NumberHeap();
  const mirrored = side === 1;
  const key = (f: number, hn: number, c: number): number => f * F_SHIFT + hn * H_SHIFT + (mirrored ? n - 1 - c : c);
  g[start] = 0;
  heap.push(key(h(start), h(start), start));
  const dirs = dirsFor(side);
  const air = layer === 'air';
  while (heap.size > 0) {
    const k = heap.pop();
    const frame = k % H_SHIFT;
    const c = mirrored ? n - 1 - frame : frame;
    if (closed[c]) continue;
    closed[c] = 1;
    if (c === goal) break;
    const cx = c % w;
    const cy = (c - cx) / w;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
      const nc = ny * w + nx;
      const base = cost[nc] as number;
      if (base < 0) continue;
      const diagonal = dx !== 0 && dy !== 0;
      // No corner cutting past impassable ground.
      if (diagonal && !air && ((cost[cy * w + nx] as number) < 0 || (cost[ny * w + cx] as number) < 0)) continue;
      if (closed[nc] || (nc !== goal && blocked?.has(nc))) continue;
      const ng = (g[c] as number) + (diagonal ? (base * 3) / 2 : base);
      const old = g[nc] as number;
      if (old !== -1 && ng >= old) continue;
      const hn = h(nc);
      if (ng + hn > maxCost) continue;
      g[nc] = ng;
      parent[nc] = c;
      heap.push(key(ng + hn, hn, nc));
    }
  }
  if (!closed[goal]) return undefined;
  const path: number[] = [];
  for (let c = goal; c !== start; c = parent[c] as number) path.push(c);
  return path.reverse();
}

/**
 * Connected regions for the movement rules of `layer` (8 neighbours, no corner cutting), with
 * `blocked` cells excluded: each passable, unblocked cell gets a region id ≥ 0, others -1.
 * One flood fill answers many "is there any way?" questions in O(1) (see `canReach`).
 */
export function regions(map: GameMap, ruleset: Ruleset, layer: Layer, blocked?: ReadonlySet<number>): Int32Array {
  const n = map.w * map.h;
  const cost = costGrid(map, ruleset, layer);
  const region = new Int32Array(n).fill(-1);
  const stack: number[] = [];
  let next = 0;
  for (let s0 = 0; s0 < n; s0++) {
    if (region[s0] !== -1 || (cost[s0] as number) < 0 || blocked?.has(s0)) continue;
    region[s0] = next;
    stack.push(s0);
    while (stack.length > 0) {
      const c = stack.pop() as number;
      for (const nb of neighbours(map, cost, layer, c)) {
        if (region[nb] !== -1 || blocked?.has(nb)) continue;
        region[nb] = next;
        stack.push(nb);
      }
    }
    next++;
  }
  return region;
}

/** Cells reachable in one step from `c` under the movement rules (terrain only). */
function neighbours(map: GameMap, cost: Int32Array, layer: Layer, c: number): number[] {
  const w = map.w;
  const cx = c % w;
  const cy = (c - cx) / w;
  const out: number[] = [];
  for (const [dx, dy] of dirsFor(0)) {
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= map.h) continue;
    const nc = ny * w + nx;
    if ((cost[nc] as number) < 0) continue;
    if (dx !== 0 && dy !== 0 && layer !== 'air' && ((cost[cy * w + nx] as number) < 0 || (cost[ny * w + cx] as number) < 0)) continue;
    out.push(nc);
  }
  return out;
}

/**
 * Whether `findPath` with the same `blocked` set can reach `goal` from `start` (the goal itself
 * may be blocked: it is entered from a neighbour in the start's region).
 */
export function canReach(map: GameMap, ruleset: Ruleset, layer: Layer, region: Int32Array, start: number, goal: number): boolean {
  if (start === goal) return true;
  const cost = costGrid(map, ruleset, layer);
  if ((cost[goal] as number) < 0) return false;
  const home = region[start] as number;
  // The start may itself be a blocked cell (a unit standing in a crowd): use its neighbours.
  const homes = home >= 0 ? [home] : neighbours(map, cost, layer, start).map((c) => region[c] as number).filter((r) => r >= 0);
  if (home < 0 && neighbours(map, cost, layer, start).includes(goal)) return true;
  if (homes.length === 0) return false;
  if ((region[goal] as number) >= 0) return homes.includes(region[goal] as number);
  return neighbours(map, cost, layer, goal).some((c) => homes.includes(region[c] as number) || c === start);
}

/** Binary min-heap of plain numbers (exact integers below 2^53). */
class NumberHeap {
  private readonly a: number[] = [];

  get size(): number {
    return this.a.length;
  }

  push(v: number): void {
    const a = this.a;
    let i = a.length;
    a.push(v);
    while (i > 0) {
      const p = (i - 1) >> 1;
      const pv = a[p] as number;
      if (pv <= v) break;
      a[i] = pv;
      i = p;
    }
    a[i] = v;
  }

  pop(): number {
    const a = this.a;
    const top = a[0] as number;
    const last = a.pop() as number;
    const len = a.length;
    if (len > 0) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= len) break;
        const r = l + 1;
        const child = r < len && (a[r] as number) < (a[l] as number) ? r : l;
        if ((a[child] as number) >= last) break;
        a[i] = a[child] as number;
        i = child;
      }
      a[i] = last;
    }
    return top;
  }
}

/**
 * Dijkstra distance field toward the nearest goal (Tower Defense waves, many units, one target).
 * `-1` marks unreachable cells. Derived data: never serialized, rebuilt when terrain/blockers change.
 */
export function flowField(map: GameMap, ruleset: Ruleset, goals: readonly number[], layer: Layer, blocked?: ReadonlySet<number>): Int32Array {
  const n = map.w * map.h;
  const dist = new Int32Array(n).fill(-1);
  const heap = new TupleHeap();
  for (const goal of goals) {
    if (goal < 0 || goal >= n || dist[goal] === 0) continue;
    dist[goal] = 0;
    heap.push([0, goal]);
  }
  const done = new Uint8Array(n);
  for (let item = heap.pop(); item; item = heap.pop()) {
    const c = item[1] as number;
    if (done[c]) continue;
    done[c] = 1;
    const cx = xOf(map, c);
    const cy = yOf(map, c);
    for (const [dx, dy] of dirsFor(0)) {
      const px = cx + dx;
      const py = cy + dy;
      // Reverse edge: cost of stepping from the neighbour into c (the neighbour must be standable).
      if (!passable(map, ruleset, px, py, layer)) continue;
      const cost = stepCost(map, ruleset, px, py, cx, cy, layer);
      if (cost === undefined) continue;
      const pc = cellOf(map, px, py);
      if (blocked?.has(pc)) continue;
      const nd = (dist[c] as number) + cost;
      const old = dist[pc] as number;
      if (old !== -1 && nd >= old) continue;
      dist[pc] = nd;
      heap.push([nd, pc]);
    }
  }
  return dist;
}

/** Best next cell along a flow field (ties broken in the side's frame), or `undefined` at a goal / when stuck. */
export function nextStep(map: GameMap, ruleset: Ruleset, field: Int32Array, cell: number, layer: Layer, side: number): number | undefined {
  const here = field[cell] ?? -1;
  if (here <= 0) return undefined;
  const cx = xOf(map, cell);
  const cy = yOf(map, cell);
  let best: number | undefined;
  let bestScore = Infinity;
  for (const [dx, dy] of dirsFor(side)) {
    const cost = stepCost(map, ruleset, cx, cy, cx + dx, cy + dy, layer);
    if (cost === undefined) continue;
    const nc = cellOf(map, cx + dx, cy + dy);
    const d = field[nc] ?? -1;
    if (d < 0) continue;
    const score = cost + d;
    if (score < bestScore) {
      bestScore = score;
      best = nc;
    }
  }
  return best;
}
