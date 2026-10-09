import { cellOf, dirsFor, frameIndex, minStepCost, passable, stepCost, xOf, yOf } from './grid';
import { TupleHeap } from './heap';
import type { GameMap, Layer, Ruleset } from './types';

export interface PathOptions {
  readonly layer: Layer;
  /** Side whose frame decides tie-breaks (keeps mirrored worlds mirrored). */
  readonly side: number;
  /** Cells that may not be entered (e.g. structures). The goal itself is always allowed. */
  readonly blocked?: ReadonlySet<number>;
}

/**
 * Deterministic A* over integer step costs. Returns the cells to walk (excluding the start,
 * including the goal), `[]` if already there, or `undefined` if unreachable.
 */
export function findPath(map: GameMap, ruleset: Ruleset, start: number, goal: number, options: PathOptions): number[] | undefined {
  if (start === goal) return [];
  const n = map.w * map.h;
  if (goal < 0 || goal >= n) return undefined;
  const { layer, side, blocked } = options;
  const m = minStepCost(ruleset, layer);
  const gx = xOf(map, goal);
  const gy = yOf(map, goal);
  const h = (c: number): number => {
    const dx = Math.abs(xOf(map, c) - gx);
    const dy = Math.abs(yOf(map, c) - gy);
    return m * Math.max(dx, dy) + Math.floor((m * Math.min(dx, dy)) / 2);
  };
  const g = new Int32Array(n).fill(-1);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new TupleHeap();
  g[start] = 0;
  heap.push([h(start), h(start), frameIndex(start, side, n), start]);
  const dirs = dirsFor(side);
  for (let item = heap.pop(); item; item = heap.pop()) {
    const c = item[3] as number;
    if (closed[c]) continue;
    closed[c] = 1;
    if (c === goal) break;
    const cx = xOf(map, c);
    const cy = yOf(map, c);
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      const cost = stepCost(map, ruleset, cx, cy, nx, ny, layer);
      if (cost === undefined) continue;
      const nc = cellOf(map, nx, ny);
      if (closed[nc] || (nc !== goal && blocked?.has(nc))) continue;
      const ng = (g[c] as number) + cost;
      const old = g[nc] as number;
      if (old !== -1 && ng >= old) continue;
      g[nc] = ng;
      parent[nc] = c;
      const hn = h(nc);
      heap.push([ng + hn, hn, frameIndex(nc, side, n), nc]);
    }
  }
  if (!closed[goal]) return undefined;
  const path: number[] = [];
  for (let c = goal; c !== start; c = parent[c] as number) path.push(c);
  return path.reverse();
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
