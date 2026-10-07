/**
 * Network Detective rules: pure, DOM-free logic and the serializable state.
 *
 * A session is six short reasoning tasks, each on its own small seeded network of points
 * (nodes, labelled A, B, C…) and connections (undirected edges, optionally with a length):
 *
 *  - `bridge`:    which single connection, if cut, separates `from` and `to`?
 *  - `augment`:   add one new connection so that no single cut can split the network;
 *  - `path`:      mark a shortest route from `from` to `to`;
 *  - `cutvertex`: which point is a single point of failure?
 *  - `mincut`:    the smallest number of connections whose removal separates `from` and `to`.
 *
 * Answers are judged by the graph algorithms below (DFS lowlink for bridges and articulation
 * points, Dijkstra for shortest routes, unit-capacity max-flow for minimum cuts). Every correct
 * answer is accepted when several exist. A wrong answer leaves the task open with a short,
 * visual explanation; there are no lives, timers or scores.
 *
 * Graphs are drawn on a jittered grid (100 units per cell) with short, non-crossing straight
 * connections, so every layout is deterministic, readable and stored in the state.
 */
// @ts-nocheck

import { createRng, isInt, isOneOf, isRecord, isUint32, normalizeSeed, type Rng } from '@wp/game-core';

/* ---------- Constants and types ---------- */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';
export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const TASK_TYPES = ['bridge', 'augment', 'path', 'cutvertex', 'mincut'] as const;
export type TaskType = (typeof TASK_TYPES)[number];
/** Task types that name two points (`from`, `to`). */
export const usesEndpoints = (type: TaskType): boolean => type === 'bridge' || type === 'path' || type === 'mincut';

export const TASKS_PER_SESSION = 6;
/** Largest network accepted from a save (the generator uses at most 13 points). */
export const MAX_NODES = 16;
export const MAX_WEIGHT = 9;
/** The minimum-cut answer is chosen from 1…MAX_CHOICE. */
export const MAX_CHOICE = 5;
export const MAX_ATTEMPTS = 100_000;
/** Size of one layout cell in SVG units. */
export const CELL = 100;

/** Undirected connection `[a, b, length]` with `a < b`. Unweighted networks use length 1. */
export type Edge = [number, number, number];
export type Point = [number, number];

export interface Task {
  type: TaskType;
  /** Number of points. */
  n: number;
  /** Sorted by (a, b); the index into this list identifies a connection. */
  edges: Edge[];
  /** Drawing position of every point, in SVG units inside `width` × `height`. */
  pos: Point[];
  width: number;
  height: number;
  /** Whether lengths are shown and used (shortest-route tasks on medium/hard). */
  weighted: boolean;
  /** Named points for `bridge`, `path` and `mincut`; -1 otherwise. */
  from: number;
  to: number;
}

export const FEEDBACK_CODES = ['bridge.connected', 'augment.weak', 'path.invalid', 'path.long', 'cutvertex.connected', 'mincut.low', 'mincut.high'] as const;
export type FeedbackCode = (typeof FEEDBACK_CODES)[number];

/** Explanation of a wrong answer: which connections/points to highlight and one number for the text. */
export interface Feedback {
  code: FeedbackCode;
  edges: number[];
  nodes: number[];
  value: number;
}

export const TASK_STATUSES = ['open', 'solved', 'shown'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Progress {
  status: TaskStatus;
  /** Number of answers checked for this task. */
  attempts: number;
  /** Selected connections (bridge: at most one; path: the marked route; mincut: a cut shown after the answer). */
  edges: number[];
  /** Selected points (augment: at most two, in tap order; cutvertex: at most one). */
  nodes: number[];
  /** Chosen number for `mincut`, else -1. */
  value: number;
  feedback: Feedback | null;
}

export interface GdState {
  seed: number;
  difficulty: Difficulty;
  /** Current task, 0…5. It stays on the last task once that is answered. */
  index: number;
  tasks: Task[];
  progress: Progress[];
}

export interface Selection {
  edges: number[];
  nodes: number[];
  value: number;
}

export const nodeLabel = (index: number): string => String.fromCharCode(65 + index);

/* ---------- Graph basics ---------- */

type Adjacency = [number, number][][];

/** Neighbours of every point as `[neighbour, edgeIndex]`. */
function adjacency(n: number, edges: readonly Edge[]): Adjacency {
  const adj: Adjacency = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], i) => {
    adj[a]!.push([b, i]);
    adj[b]!.push([a, i]);
  });
  return adj;
}

export const hasEdge = (edges: readonly Edge[], u: number, v: number): boolean => edgeIndex(edges, u, v) >= 0;

/** Index of the connection between `u` and `v`, or -1. */
export function edgeIndex(edges: readonly Edge[], u: number, v: number): number {
  const a = Math.min(u, v);
  const b = Math.max(u, v);
  return edges.findIndex(([x, y]) => x === a && y === b);
}

/** Component id of every point, ignoring the connection `skipEdge` and the point `skipNode` (-1 for skipped points). */
export function components(n: number, edges: readonly Edge[], skipEdge = -1, skipNode = -1): number[] {
  const adj = adjacency(n, edges);
  const comp = new Array<number>(n).fill(-1);
  let next = 0;
  for (let start = 0; start < n; start++) {
    if (start === skipNode || comp[start] !== -1) continue;
    comp[start] = next;
    const queue = [start];
    for (let head = 0; head < queue.length; head++) {
      for (const [v, e] of adj[queue[head]!]!) {
        if (e === skipEdge || v === skipNode || comp[v] !== -1) continue;
        comp[v] = next;
        queue.push(v);
      }
    }
    next++;
  }
  return comp;
}

/** Whether all points (except `skipNode`) are linked, without the connection `skipEdge`. */
export function isConnected(n: number, edges: readonly Edge[], skipEdge = -1, skipNode = -1): boolean {
  return components(n, edges, skipEdge, skipNode).every((c) => c <= 0);
}

/* ---------- DFS lowlink: bridges and articulation points ---------- */

interface DfsInfo {
  tin: number[];
  tout: number[];
  low: number[];
  parent: number[];
  parentEdge: number[];
  children: number[];
}

/** Depth-first search over all components, starting with `first`. Entry/exit times share one clock. */
function dfs(n: number, edges: readonly Edge[], first: number): DfsInfo {
  const adj = adjacency(n, edges);
  const info: DfsInfo = {
    tin: new Array<number>(n).fill(-1),
    tout: new Array<number>(n).fill(-1),
    low: new Array<number>(n).fill(-1),
    parent: new Array<number>(n).fill(-1),
    parentEdge: new Array<number>(n).fill(-1),
    children: new Array<number>(n).fill(0)
  };
  const { tin, tout, low, parent, parentEdge, children } = info;
  let clock = 0;
  const visit = (u: number): void => {
    tin[u] = clock;
    low[u] = clock;
    clock++;
    for (const [v, e] of adj[u]!) {
      if (e === parentEdge[u]) continue;
      if (tin[v] === -1) {
        parent[v] = u;
        parentEdge[v] = e;
        children[u] = children[u]! + 1;
        visit(v);
        low[u] = Math.min(low[u]!, low[v]!);
      } else {
        low[u] = Math.min(low[u]!, tin[v]!);
      }
    }
    tout[u] = clock;
    clock++;
  };
  visit(first);
  for (let u = 0; u < n; u++) if (tin[u] === -1) visit(u);
  return info;
}

/** Child endpoints `v` whose tree connection (`parentEdge[v]`) is a bridge. */
function bridgeChildren(info: DfsInfo): number[] {
  const result: number[] = [];
  info.parent.forEach((p, v) => {
    if (p >= 0 && info.low[v]! > info.tin[p]!) result.push(v);
  });
  return result;
}

/** Indices (ascending) of all connections whose removal disconnects their two ends. */
export function findBridges(n: number, edges: readonly Edge[]): number[] {
  if (n === 0) return [];
  const info = dfs(n, edges, 0);
  return bridgeChildren(info)
    .map((v) => info.parentEdge[v]!)
    .sort((a, b) => a - b);
}

/** Points (ascending) whose removal splits their component. */
export function articulationPoints(n: number, edges: readonly Edge[]): number[] {
  if (n === 0) return [];
  const info = dfs(n, edges, 0);
  const cut = new Array<boolean>(n).fill(false);
  info.parent.forEach((p, v) => {
    if (p < 0) return;
    if (info.parent[p] === -1) cut[p] = info.children[p]! >= 2;
    else if (info.low[v]! >= info.tin[p]!) cut[p] = true;
  });
  return cut.flatMap((isCut, v) => (isCut ? [v] : []));
}

/**
 * Bridges whose removal separates `s` from `t` (ascending): exactly the bridges on the DFS-tree
 * path from `s` to `t`. Empty when `s` and `t` are not linked at all (nothing left to separate).
 */
export function separatingBridges(n: number, edges: readonly Edge[], s: number, t: number): number[] {
  const info = dfs(n, edges, s);
  const inSubtree = (root: number, x: number) => info.tin[root]! <= info.tin[x]! && info.tout[x]! <= info.tout[root]!;
  if (s === t || !inSubtree(s, t)) return [];
  return bridgeChildren(info)
    .filter((v) => inSubtree(v, t))
    .map((v) => info.parentEdge[v]!)
    .sort((a, b) => a - b);
}

/** Connected and without bridges: no single cut can split the network. */
export function isTwoEdgeConnected(n: number, edges: readonly Edge[]): boolean {
  return isConnected(n, edges) && findBridges(n, edges).length === 0;
}

/** Non-adjacent pairs `[u, v]` (u < v, ascending) whose new connection makes the network two-edge-connected. */
export function augmentingPairs(n: number, edges: readonly Edge[]): [number, number][] {
  const result: [number, number][] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (!hasEdge(edges, u, v) && isTwoEdgeConnected(n, [...edges, [u, v, 1]])) result.push([u, v]);
    }
  }
  return result;
}

/* ---------- Shortest routes (Dijkstra) ---------- */

/** Length of every connection as used by the task (`Infinity` blocks a connection). */
export type WeightFn = (edgeIndex: number) => number;

/** Shortest distances from `s` (Dijkstra, O(n²)); `Infinity` for unreachable points. */
export function distancesFrom(n: number, edges: readonly Edge[], s: number, weight: WeightFn = (i) => edges[i]![2]): number[] {
  const adj = adjacency(n, edges);
  const dist = new Array<number>(n).fill(Infinity);
  const done = new Array<boolean>(n).fill(false);
  dist[s] = 0;
  for (;;) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!done[v] && dist[v]! < Infinity && (u < 0 || dist[v]! < dist[u]!)) u = v;
    if (u < 0) return dist;
    done[u] = true;
    for (const [v, e] of adj[u]!) {
      const d = dist[u]! + weight(e);
      if (d < dist[v]!) dist[v] = d;
    }
  }
}

/** One shortest route from `s` to `t` as connection indices in travel order, or null when unreachable. */
export function shortestRoute(n: number, edges: readonly Edge[], s: number, t: number, weight: WeightFn = (i) => edges[i]![2]): number[] | null {
  const dist = distancesFrom(n, edges, s, weight);
  if (dist[t] === Infinity) return null;
  const adj = adjacency(n, edges);
  const route: number[] = [];
  let cur = t;
  while (cur !== s) {
    const step = adj[cur]!.filter(([v, e]) => dist[v]! + weight(e) === dist[cur]!).sort((x, y) => x[1] - y[1])[0]!;
    route.push(step[1]);
    cur = step[0];
  }
  return route.reverse();
}

/** Total length of `selected` if it is exactly one simple route from `s` to `t`, else -1. */
export function routeLength(n: number, edges: readonly Edge[], selected: readonly number[], s: number, t: number): number {
  if (s === t || selected.length === 0 || new Set(selected).size !== selected.length) return -1;
  const degree = new Array<number>(n).fill(0);
  for (const e of selected) {
    const edge = edges[e];
    if (!edge) return -1;
    degree[edge[0]] = degree[edge[0]]! + 1;
    degree[edge[1]] = degree[edge[1]]! + 1;
  }
  for (let v = 0; v < n; v++) {
    const expected = v === s || v === t ? 1 : degree[v] === 0 ? 0 : 2;
    if (degree[v] !== expected) return -1;
  }
  // Every degree fits a path; walking from s must now use all selected connections (no separate loop).
  const remaining = new Set(selected);
  let cur = s;
  let length = 0;
  while (cur !== t) {
    const e = [...remaining].find((i) => edges[i]![0] === cur || edges[i]![1] === cur);
    if (e === undefined) return -1;
    remaining.delete(e);
    const [a, b, w] = edges[e]!;
    cur = a === cur ? b : a;
    length += w;
  }
  return remaining.size === 0 ? length : -1;
}

/* ---------- Minimum cut (unit-capacity max-flow) ---------- */

export interface FlowResult {
  /** Maximum number of connection-disjoint routes = minimum number of cuts. */
  value: number;
  /** Per connection: +1 flows a→b, -1 flows b→a, 0 unused. */
  flow: number[];
  /** Connections of one minimum cut (ascending). */
  cut: number[];
}

/** Edmonds–Karp on the undirected network where every connection carries one unit in either direction. */
export function maxFlow(n: number, edges: readonly Edge[], s: number, t: number): FlowResult {
  const adj = adjacency(n, edges);
  const flow = new Array<number>(edges.length).fill(0);
  let value = 0;
  for (;;) {
    const via = new Array<number>(n).fill(-2);
    via[s] = -1;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head]!;
      for (const [v, e] of adj[u]!) {
        const residual = edges[e]![0] === u ? 1 - flow[e]! : 1 + flow[e]!;
        if (via[v] === -2 && residual > 0) {
          via[v] = e;
          queue.push(v);
        }
      }
    }
    if (s === t || via[t] === -2) {
      const reached = via.map((x) => x !== -2);
      const cut = edges.flatMap(([a, b], i) => (reached[a] !== reached[b] ? [i] : []));
      return { value, flow, cut };
    }
    for (let v = t; v !== s; ) {
      const e = via[v]!;
      const [a, b] = edges[e]!;
      if (b === v) {
        flow[e] = flow[e]! + 1;
        v = a;
      } else {
        flow[e] = flow[e]! - 1;
        v = b;
      }
    }
    value++;
  }
}

/** Splits a flow into `value` connection-disjoint routes from `s` to `t` (each a list of connection indices). */
export function disjointRoutes(edges: readonly Edge[], result: FlowResult, s: number, t: number): number[][] {
  const used = new Set<number>();
  const routes: number[][] = [];
  for (let k = 0; k < result.value; k++) {
    const route: number[] = [];
    let cur = s;
    while (cur !== t) {
      const e = result.flow.findIndex((f, i) => !used.has(i) && ((f === 1 && edges[i]![0] === cur) || (f === -1 && edges[i]![1] === cur)));
      used.add(e);
      route.push(e);
      const [a, b] = edges[e]!;
      cur = a === cur ? b : a;
    }
    routes.push(route);
  }
  return routes;
}

/* ---------- Answers ---------- */

/** Whether the current selection is complete enough to be checked. */
export function selectionComplete(task: Task, sel: Selection): boolean {
  switch (task.type) {
    case 'bridge':
      return sel.edges.length === 1;
    case 'path':
      return sel.edges.length > 0;
    case 'augment':
      return sel.nodes.length === 2 && !hasEdge(task.edges, sel.nodes[0]!, sel.nodes[1]!);
    case 'cutvertex':
      return sel.nodes.length === 1;
    case 'mincut':
      return sel.value >= 1;
  }
}

export interface Verdict {
  correct: boolean;
  feedback: Feedback | null;
}

const wrong = (code: FeedbackCode, edges: number[] = [], nodes: number[] = [], value = 0): Verdict => ({ correct: false, feedback: { code, edges, nodes, value } });
const RIGHT: Verdict = { correct: true, feedback: null };

/** Judges a complete selection and explains a wrong one. */
export function judge(task: Task, sel: Selection): Verdict {
  const { n, edges, from, to } = task;
  switch (task.type) {
    case 'bridge': {
      const e = sel.edges[0]!;
      if (separatingBridges(n, edges, from, to).includes(e)) return RIGHT;
      const detour = shortestRoute(n, edges, from, to, (i) => (i === e ? Infinity : 1)) ?? [];
      return wrong('bridge.connected', detour);
    }
    case 'augment': {
      const [u, v] = sel.nodes as [number, number];
      const weak = findBridges(n, [...edges, [Math.min(u, v), Math.max(u, v), 1]]);
      return weak.length === 0 ? RIGHT : wrong('augment.weak', weak);
    }
    case 'path': {
      const length = routeLength(n, edges, sel.edges, from, to);
      if (length < 0) return wrong('path.invalid');
      return length === distancesFrom(n, edges, from)[to] ? RIGHT : wrong('path.long', [], [], length);
    }
    case 'cutvertex': {
      const v = sel.nodes[0]!;
      return articulationPoints(n, edges).includes(v) ? RIGHT : wrong('cutvertex.connected', [], [v]);
    }
    case 'mincut': {
      const result = maxFlow(n, edges, from, to);
      if (sel.value === result.value) return RIGHT;
      if (sel.value > result.value) return wrong('mincut.high', [], [], sel.value);
      return wrong('mincut.low', disjointRoutes(edges, result, from, to).slice(0, sel.value + 1).flat().sort((a, b) => a - b), [], sel.value + 1);
    }
  }
}

/** One correct answer (for "Show solution"), or null when the task has none (only possible for crafted data). */
export function solutionOf(task: Task): Selection | null {
  const { n, edges, from, to } = task;
  const none: Selection = { edges: [], nodes: [], value: -1 };
  switch (task.type) {
    case 'bridge': {
      const first = separatingBridges(n, edges, from, to)[0];
      return first === undefined ? null : { ...none, edges: [first] };
    }
    case 'augment': {
      const pair = augmentingPairs(n, edges)[0];
      return pair ? { ...none, nodes: [...pair] } : null;
    }
    case 'path': {
      const route = shortestRoute(n, edges, from, to);
      return route ? { ...none, edges: route.sort((a, b) => a - b) } : null;
    }
    case 'cutvertex': {
      const first = articulationPoints(n, edges)[0];
      return first === undefined ? null : { ...none, nodes: [first] };
    }
    case 'mincut': {
      const result = maxFlow(n, edges, from, to);
      return result.value >= 1 && result.value <= MAX_CHOICE ? { ...none, edges: result.cut, value: result.value } : null;
    }
  }
}

/* ---------- Layout geometry ---------- */

const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Whether segments p1p2 and p3p4 intersect or touch (callers handle segments sharing an endpoint separately). */
export function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  const onSegment = (a: Point, b: Point, p: Point) => Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]);
  return (d1 === 0 && onSegment(p3, p4, p1)) || (d2 === 0 && onSegment(p3, p4, p2)) || (d3 === 0 && onSegment(p1, p2, p3)) || (d4 === 0 && onSegment(p1, p2, p4));
}

/** Euclidean distance from point `p` to the segment `ab`. */
export function pointSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  const k = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));
  return Math.hypot(p[0] - (a[0] + k * dx), p[1] - (a[1] + k * dy));
}

/** Angle in degrees between the rays from `o` to `a` and from `o` to `b`. */
export function angleAt(o: Point, a: Point, b: Point): number {
  const v1 = Math.atan2(a[1] - o[1], a[0] - o[0]);
  const v2 = Math.atan2(b[1] - o[1], b[0] - o[0]);
  const diff = Math.abs(v1 - v2) * (180 / Math.PI);
  return diff > 180 ? 360 - diff : diff;
}

/** Readability limits for drawn connections. */
export const LAYOUT = {
  /** Positions are jittered by up to this much inside their cell. */
  jitter: 12,
  /** Longest connection (a little more than a diagonal neighbour or two cells in a row). */
  maxLength: 215,
  /** No connection passes closer than this to a point it does not join. */
  clearance: 34,
  /** Two connections at one point are at least this many degrees apart. */
  minAngle: 30
} as const;

/** Whether connection `[u, v]` can be drawn next to the already drawn `edges` without clutter. */
export function canDraw(pos: readonly Point[], edges: readonly (readonly [number, number, ...number[]])[], u: number, v: number): boolean {
  const pu = pos[u]!;
  const pv = pos[v]!;
  if (Math.hypot(pu[0] - pv[0], pu[1] - pv[1]) > LAYOUT.maxLength) return false;
  for (let w = 0; w < pos.length; w++) if (w !== u && w !== v && pointSegmentDistance(pos[w]!, pu, pv) < LAYOUT.clearance) return false;
  for (const [a, b] of edges) {
    if ((a === u && b === v) || (a === v && b === u)) return false;
    const shared = a === u || a === v ? a : b === u || b === v ? b : -1;
    if (shared >= 0) {
      const other = shared === a ? b : a;
      const mine = shared === u ? v : u;
      if (angleAt(pos[shared]!, pos[other]!, pos[mine]!) < LAYOUT.minAngle) return false;
    } else if (segmentsIntersect(pu, pv, pos[a]!, pos[b]!)) return false;
  }
  return true;
}

/* ---------- Generator ---------- */

interface Profile {
  nodes: readonly [number, number];
  cols: number;
  rows: number;
  maxWeight: number;
}

export const PROFILES: Readonly<Record<Difficulty, Profile>> = {
  easy: { nodes: [6, 7], cols: 3, rows: 3, maxWeight: 1 },
  medium: { nodes: [8, 10], cols: 4, rows: 3, maxWeight: 5 },
  hard: { nodes: [11, 13], cols: 4, rows: 4, maxWeight: 7 }
};

/** Each session has every task type once plus one more that depends on the difficulty. */
export const EXTRA_TASK: Readonly<Record<Difficulty, TaskType>> = { easy: 'bridge', medium: 'path', hard: 'augment' };

/** Extra connections beyond a spanning tree, as fractions of the number of points. */
const EXTRA_EDGES: Readonly<Record<TaskType, readonly [number, number]>> = {
  bridge: [0.2, 0.45],
  augment: [0.15, 0.45],
  path: [0.45, 0.8],
  cutvertex: [0.3, 0.6],
  mincut: [0.7, 1.2]
};

const MAX_TRIES = 5000;

/** Random points on distinct cells of the grid, in reading order. */
function placePoints(rng: Rng, n: number, profile: Profile): Point[] {
  // Labels follow reading order (top-left first), which makes a named point quick to find.
  const cells = rng
    .shuffle(Array.from({ length: profile.cols * profile.rows }, (_, i) => i))
    .slice(0, n)
    .sort((a, b) => a - b);
  return cells.map((cell): Point => [
    (cell % profile.cols) * CELL + CELL / 2 + rng.int(-LAYOUT.jitter, LAYOUT.jitter),
    Math.floor(cell / profile.cols) * CELL + CELL / 2 + rng.int(-LAYOUT.jitter, LAYOUT.jitter)
  ]);
}

/** A random drawable network: a spanning tree of short connections plus `extra` more; null when the points cannot be linked. */
function randomNetwork(rng: Rng, pos: readonly Point[], extra: number): Edge[] | null {
  const n = pos.length;
  const candidates: [number, number, number][] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      const length = Math.hypot(pos[u]![0] - pos[v]![0], pos[u]![1] - pos[v]![1]);
      if (canDraw(pos, [], u, v)) candidates.push([u, v, length * (0.7 + 0.6 * rng.next())]);
    }
  }
  candidates.sort((x, y) => x[2] - y[2]);
  const root = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (root[x] === x ? x : (root[x] = find(root[x]!)));
  const chosen: Edge[] = [];
  const rest: [number, number][] = [];
  for (const [u, v] of candidates) {
    if (find(u) !== find(v) && canDraw(pos, chosen, u, v)) {
      root[find(u)] = find(v);
      chosen.push([u, v, 1]);
    } else rest.push([u, v]);
  }
  if (chosen.length !== n - 1) return null;
  let added = 0;
  for (const [u, v] of rng.shuffle(rest)) {
    if (added >= extra) break;
    if (canDraw(pos, chosen, u, v)) {
      chosen.push([u, v, 1]);
      added++;
    }
  }
  return chosen.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
}

const hops = (n: number, edges: readonly Edge[], s: number) => distancesFrom(n, edges, s, () => 1);

const pairs = (n: number): [number, number][] => {
  const result: [number, number][] = [];
  for (let u = 0; u < n; u++) for (let v = u + 1; v < n; v++) result.push([u, v]);
  return result;
};

/** Endpoint pairs that make a good task of `type`, or null when the network does not suit that type at all. */
export function suitablePairs(type: TaskType, difficulty: Difficulty, n: number, edges: readonly Edge[]): [number, number][] | null {
  const extra = edges.length - (n - 1);
  const degree = (v: number) => edges.filter(([a, b]) => a === v || b === v).length;
  switch (type) {
    case 'bridge': {
      if (extra < 2) return null;
      return pairs(n).filter(([s, t]) => hops(n, edges, s)[t]! >= 3 && separatingBridges(n, edges, s, t).length > 0);
    }
    case 'path': {
      if (extra < 2) return null;
      return pairs(n).filter(([s, t]) => {
        if (hops(n, edges, s)[t]! < (difficulty === 'easy' ? 3 : 2)) return false;
        if (difficulty === 'easy') return true;
        // Weighted: no route with the fewest connections is already a shortest one. Costs of
        // length × 1000 + 1 rank routes by length first, then by their number of connections.
        const best = distancesFrom(n, edges, s, (i) => edges[i]![2] * 1000 + 1)[t]!;
        return best % 1000 > hops(n, edges, s)[t]!;
      });
    }
    case 'mincut': {
      const [low, high] = difficulty === 'easy' ? [2, 3] : [2, 4];
      return pairs(n).filter(([s, t]) => {
        if (hasEdge(edges, s, t) || hops(n, edges, s)[t]! < 2) return false;
        const value = maxFlow(n, edges, s, t).value;
        // Medium/hard: counting the connections at one of the two points is not enough.
        return value >= low && value <= high && (difficulty === 'easy' || value < Math.min(degree(s), degree(t)));
      });
    }
    case 'augment': {
      const bridges = findBridges(n, edges).length;
      if (bridges < (difficulty === 'easy' ? 1 : 2) || extra < 1 || augmentingPairs(n, edges).length === 0) return null;
      return [[-1, -1]];
    }
    case 'cutvertex': {
      const points = articulationPoints(n, edges).length;
      const leaves = Array.from({ length: n }, (_, v) => v).filter((v) => degree(v) === 1).length;
      const maxPoints = difficulty === 'hard' ? 1 : 2;
      const maxLeaves = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
      if (extra < 2 || points < 1 || points > maxPoints || leaves > maxLeaves) return null;
      return [[-1, -1]];
    }
  }
}

/** A seeded task of `type` whose network is guaranteed to have an answer of that type. */
export function generateTask(rng: Rng, type: TaskType, difficulty: Difficulty): Task {
  const profile = PROFILES[difficulty];
  const weighted = type === 'path' && profile.maxWeight > 1;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const n = rng.int(profile.nodes[0], profile.nodes[1]);
    const pos = placePoints(rng, n, profile);
    const [lo, hi] = EXTRA_EDGES[type];
    const edges = randomNetwork(rng, pos, rng.int(Math.round(n * lo), Math.round(n * hi)));
    if (!edges) continue;
    if (weighted) for (const edge of edges) edge[2] = rng.int(1, profile.maxWeight);
    const candidates = suitablePairs(type, difficulty, n, edges);
    if (!candidates || candidates.length === 0) continue;
    const pair = rng.pick(candidates);
    const [from, to] = rng.next() < 0.5 ? pair : [pair[1], pair[0]];
    return { type, n, edges, pos, width: profile.cols * CELL, height: profile.rows * CELL, weighted, from, to };
  }
  /* c8 ignore next */
  throw new Error(`Could not generate a ${type} task`);
}

/** The six task types of a session, in seeded order. */
export function taskMix(rng: Rng, difficulty: Difficulty): TaskType[] {
  return rng.shuffle([...TASK_TYPES, EXTRA_TASK[difficulty]]);
}

const emptyProgress = (): Progress => ({ status: 'open', attempts: 0, edges: [], nodes: [], value: -1, feedback: null });

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): GdState {
  const normalized = normalizeSeed(seed);
  const rng = createRng(normalized);
  const tasks = taskMix(rng, difficulty).map((type) => generateTask(rng, type, difficulty));
  return { seed: normalized, difficulty, index: 0, tasks, progress: tasks.map(emptyProgress) };
}

export const resetState = (state: GdState): GdState => createInitialState(state.seed, state.difficulty);

/* ---------- State transitions ---------- */

export const currentTask = (state: GdState): Task => state.tasks[state.index]!;
export const currentProgress = (state: GdState): Progress => state.progress[state.index]!;
export const isOpen = (state: GdState): boolean => currentProgress(state).status === 'open';
export const isFinished = (state: GdState): boolean => state.progress.every((p) => p.status !== 'open');
export const canSubmit = (state: GdState): boolean => isOpen(state) && selectionComplete(currentTask(state), currentProgress(state));
export const canAdvance = (state: GdState): boolean => !isOpen(state) && state.index < state.tasks.length - 1;

export interface Totals {
  tasks: number;
  attempts: number;
  solutionsShown: number;
}

export function totals(state: GdState): Totals {
  return {
    tasks: state.progress.filter((p) => p.status !== 'open').length,
    attempts: state.progress.reduce((sum, p) => sum + p.attempts, 0),
    solutionsShown: state.progress.filter((p) => p.status === 'shown').length
  };
}

const withCurrent = (state: GdState, change: Partial<Progress>): GdState => ({
  ...state,
  progress: state.progress.map((p, i) => (i === state.index ? { ...p, ...change } : p))
});

const toggle = (list: readonly number[], x: number) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x].sort((a, b) => a - b));

/** Tap on a connection: choose it (bridge) or add/remove it from the route (path). Unchanged state when not applicable. */
export function toggleEdge(state: GdState, e: number): GdState {
  const task = currentTask(state);
  if (!isOpen(state) || !isInt(e, 0, task.edges.length - 1)) return state;
  const { edges } = currentProgress(state);
  if (task.type === 'bridge') return withCurrent(state, { edges: edges[0] === e ? [] : [e], feedback: null });
  if (task.type === 'path') return withCurrent(state, { edges: toggle(edges, e), feedback: null });
  return state;
}

/** Tap on a point: choose it (cutvertex) or one of the two ends of the new connection (augment). */
export function toggleNode(state: GdState, v: number): GdState {
  const task = currentTask(state);
  if (!isOpen(state) || !isInt(v, 0, task.n - 1)) return state;
  const { nodes } = currentProgress(state);
  if (task.type === 'cutvertex') return withCurrent(state, { nodes: nodes[0] === v ? [] : [v], feedback: null });
  if (task.type !== 'augment') return state;
  // Tap order is kept; a third point replaces the older of the two.
  const next = nodes.includes(v) ? nodes.filter((x) => x !== v) : nodes.length < 2 ? [...nodes, v] : [nodes[1]!, v];
  return withCurrent(state, { nodes: next, feedback: null });
}

/** Choose the answer of a minimum-cut task. */
export function chooseValue(state: GdState, value: number): GdState {
  if (!isOpen(state) || currentTask(state).type !== 'mincut' || !isInt(value, 1, MAX_CHOICE) || currentProgress(state).value === value) return state;
  return withCurrent(state, { value, feedback: null });
}

export function clearSelection(state: GdState): GdState {
  const p = currentProgress(state);
  if (!isOpen(state) || (p.edges.length === 0 && p.nodes.length === 0 && p.value === -1 && p.feedback === null)) return state;
  return withCurrent(state, { edges: [], nodes: [], value: -1, feedback: null });
}

/** Check the current answer. A wrong answer keeps the selection and adds an explanation. */
export function submit(state: GdState): GdState {
  if (!canSubmit(state)) return state;
  const task = currentTask(state);
  const progress = currentProgress(state);
  const verdict = judge(task, progress);
  const attempts = progress.attempts + 1;
  if (!verdict.correct) return withCurrent(state, { attempts, feedback: verdict.feedback });
  // A correct minimum-cut number is illustrated with one matching cut.
  const edges = task.type === 'mincut' ? maxFlow(task.n, task.edges, task.from, task.to).cut : progress.edges;
  return withCurrent(state, { status: 'solved', attempts, edges, feedback: null });
}

/** Reveal one solution of the current task (counted in the summary). */
export function showSolution(state: GdState): GdState {
  const solution = isOpen(state) ? solutionOf(currentTask(state)) : null;
  if (!solution) return state;
  return withCurrent(state, { status: 'shown', ...solution, feedback: null });
}

/** Move on to the next task after the current one is answered. */
export function nextTask(state: GdState): GdState {
  return canAdvance(state) ? { ...state, index: state.index + 1 } : state;
}

/* ---------- Validation of untrusted saves ---------- */

const isIndexList = (value: unknown, size: number, max: number): value is number[] =>
  Array.isArray(value) && value.length <= max && new Set(value).size === value.length && value.every((x) => isInt(x, 0, size - 1));

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;
  const { type, n, edges, pos, width, height, weighted, from, to } = value;
  if (!isOneOf(type, TASK_TYPES) || !isInt(n, 2, MAX_NODES) || typeof weighted !== 'boolean') return false;
  if (!isInt(width, CELL, CELL * 8) || !isInt(height, CELL, CELL * 8)) return false;
  if (!Array.isArray(pos) || pos.length !== n) return false;
  if (!pos.every((p) => Array.isArray(p) && p.length === 2 && isInt(p[0], 0, width) && isInt(p[1], 0, height))) return false;
  if (!Array.isArray(edges) || edges.length > (n * (n - 1)) / 2) return false;
  const seen = new Set<number>();
  for (const edge of edges as unknown[]) {
    if (!Array.isArray(edge) || edge.length !== 3) return false;
    const [a, b, w] = edge as unknown[];
    if (!isInt(a, 0, n - 1) || !isInt(b, a + 1, n - 1) || !isInt(w, 1, weighted ? MAX_WEIGHT : 1)) return false;
    if (seen.has(a * MAX_NODES + b)) return false;
    seen.add(a * MAX_NODES + b);
  }
  if (usesEndpoints(type)) {
    if (!isInt(from, 0, n - 1) || !isInt(to, 0, n - 1) || from === to) return false;
  } else if (from !== -1 || to !== -1) return false;
  return solutionOf(value as unknown as Task) !== null;
}

function isFeedback(value: unknown, task: Task): value is Feedback {
  if (!isRecord(value)) return false;
  const { code, edges, nodes, value: number } = value;
  return (
    isOneOf(code, FEEDBACK_CODES) &&
    code.startsWith(`${task.type}.`) &&
    isIndexList(edges, task.edges.length, task.edges.length) &&
    isIndexList(nodes, task.n, 1) &&
    isInt(number, 0, MAX_ATTEMPTS)
  );
}

function isProgress(value: unknown, task: Task): value is Progress {
  if (!isRecord(value)) return false;
  const { status, attempts, edges, nodes, value: chosen, feedback } = value;
  if (!isOneOf(status, TASK_STATUSES) || !isInt(attempts, 0, MAX_ATTEMPTS)) return false;
  const maxEdges = task.type === 'bridge' ? 1 : task.type === 'path' || task.type === 'mincut' ? task.edges.length : 0;
  const maxNodes = task.type === 'augment' ? 2 : task.type === 'cutvertex' ? 1 : 0;
  if (!isIndexList(edges, task.edges.length, maxEdges) || !isIndexList(nodes, task.n, maxNodes)) return false;
  if (task.type === 'mincut' ? chosen !== -1 && !isInt(chosen, 1, MAX_CHOICE) : chosen !== -1) return false;
  if (feedback !== null && !isFeedback(feedback, task)) return false;
  if (status === 'open') return true;
  // Answered tasks hold a correct answer and no explanation of a wrong one.
  const sel = { edges, nodes, value: chosen } as Selection;
  return feedback === null && (status === 'shown' || attempts >= 1) && selectionComplete(task, sel) && judge(task, sel).correct;
}

export function isGdState(value: unknown): value is GdState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, index, tasks, progress } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES) || !isInt(index, 0, TASKS_PER_SESSION - 1)) return false;
    if (!Array.isArray(tasks) || tasks.length !== TASKS_PER_SESSION || !tasks.every(isTask)) return false;
    if (!Array.isArray(progress) || progress.length !== TASKS_PER_SESSION) return false;
    return progress.every((p: unknown, i) => {
      if (!isProgress(p, tasks[i] as Task)) return false;
      if (i < index) return p.status !== 'open';
      if (i > index) return p.status === 'open' && p.attempts === 0 && p.edges.length === 0 && p.nodes.length === 0 && p.value === -1 && p.feedback === null;
      return true;
    });
  } catch {
    return false;
  }
}
