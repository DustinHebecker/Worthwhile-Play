/**
 * Network — "Connect the villages": build candidate roads so that all towns are connected as cheaply as possible;
 * optional junctions (Steiner points) may be used as crossroads. Pure logic: generator, score, solver.
 */
import { isArrayOf, isInt, isRecord, type Rng } from '@wp/game-core';
import { MAX_ATTEMPTS, letter, unionFind, type Difficulty } from './common';

export interface NetPoint {
  x: number;
  y: number;
  junction: boolean;
  /** Opening cost of a junction (0 for towns and free junctions). */
  open: number;
}
export interface NetLink {
  a: number;
  b: number;
  cost: number;
  rough: boolean;
}
export interface NetworkProblem {
  kind: 'network';
  points: NetPoint[];
  links: NetLink[];
}
export interface NetworkPlan {
  /** Sorted, unique link indices. */
  built: number[];
}

/* ---------- Bounds (keep the solver within its limits for any loaded save) ---------- */

export const NET_MAX_POINTS = 11;
export const NET_MAX_JUNCTIONS = 3;
export const NET_MAX_LINKS = 24;
export const NET_FIELD = 10;

const isPoint = (v: unknown): v is NetPoint =>
  isRecord(v) && isInt(v.x, 0, NET_FIELD) && isInt(v.y, 0, NET_FIELD) && typeof v.junction === 'boolean' && isInt(v.open, 0, 5) && (v.junction || v.open === 0);
const isLink = (v: unknown): v is NetLink => isRecord(v) && isInt(v.a, 0, NET_MAX_POINTS - 1) && isInt(v.b, 0, NET_MAX_POINTS - 1) && isInt(v.cost, 1, 20) && typeof v.rough === 'boolean';

export const townIndices = (p: NetworkProblem): number[] => p.points.flatMap((q, i) => (q.junction ? [] : [i]));
export const junctionIndices = (p: NetworkProblem): number[] => p.points.flatMap((q, i) => (q.junction ? [i] : []));

export function isNetworkProblem(v: unknown): v is NetworkProblem {
  if (!isRecord(v) || v.kind !== 'network') return false;
  if (!isArrayOf(v.points, isPoint) || v.points.length > NET_MAX_POINTS) return false;
  if (!isArrayOf(v.links, isLink) || v.links.length < 1 || v.links.length > NET_MAX_LINKS) return false;
  const p = v as unknown as NetworkProblem;
  const towns = townIndices(p).length;
  if (towns < 2 || p.points.length - towns > NET_MAX_JUNCTIONS) return false;
  const seen = new Set<string>();
  for (const q of p.points) {
    const key = `${q.x},${q.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  const pairs = new Set<number>();
  for (const l of p.links) {
    if (l.a >= l.b || l.b >= p.points.length || pairs.has(l.a * 64 + l.b)) return false;
    pairs.add(l.a * 64 + l.b);
  }
  // The optimum must exist: the candidate links connect every town.
  return groupsOf(p, p.links.map((_, i) => i)).length === 1;
}

export const isNetworkPlan = (v: unknown, p: NetworkProblem): v is NetworkPlan =>
  isRecord(v) && isArrayOf(v.built, (i): i is number => isInt(i, 0, p.links.length - 1)) && v.built.every((x, i, all) => i === 0 || all[i - 1]! < x);

export const emptyNetworkPlan = (): NetworkPlan => ({ built: [] });

/* ---------- Score and constraints ---------- */

/** Label of a point: towns A, B, C …; junctions 1, 2, 3. */
export function pointLabel(p: NetworkProblem, i: number): string {
  let towns = 0;
  let junctions = 0;
  for (let k = 0; k < i; k++) if (p.points[k]!.junction) junctions++;
  else towns++;
  return p.points[i]?.junction ? String(junctions + 1) : letter(towns);
}

/** Junctions touched by a built link (in index order). */
export function usedJunctions(p: NetworkProblem, built: readonly number[]): number[] {
  const used = new Set<number>();
  for (const i of built) {
    const l = p.links[i]!;
    for (const v of [l.a, l.b]) if (p.points[v]!.junction) used.add(v);
  }
  return [...used].sort((a, b) => a - b);
}

export function networkCost(p: NetworkProblem, plan: NetworkPlan): number {
  let cost = 0;
  for (const i of plan.built) cost += p.links[i]!.cost;
  for (const j of usedJunctions(p, plan.built)) cost += p.points[j]!.open;
  return cost;
}

/** The towns grouped by the built links (each group sorted, groups by their first town). */
export function groupsOf(p: NetworkProblem, built: readonly number[]): number[][] {
  const uf = unionFind(p.points.length);
  for (const i of built) uf.union(p.links[i]!.a, p.links[i]!.b);
  const groups = new Map<number, number[]>();
  for (const t of townIndices(p)) {
    const r = uf.find(t);
    groups.set(r, [...(groups.get(r) ?? []), t]);
  }
  return [...groups.values()];
}

export const networkFeasible = (p: NetworkProblem, plan: NetworkPlan): boolean => groupsOf(p, plan.built).length === 1;

/* ---------- Exact solver ---------- */

/**
 * Kruskal's minimum spanning tree over `vertices` (only links with both ends inside), or null when they are not
 * connected. Ties are broken by link index, so the result is deterministic.
 */
export function spanningTree(p: NetworkProblem, vertices: ReadonlySet<number>): { cost: number; built: number[] } | null {
  const order = p.links.map((_, i) => i).filter((i) => vertices.has(p.links[i]!.a) && vertices.has(p.links[i]!.b));
  order.sort((x, y) => p.links[x]!.cost - p.links[y]!.cost || x - y);
  const uf = unionFind(p.points.length);
  const built: number[] = [];
  let cost = 0;
  for (const i of order) {
    if (uf.union(p.links[i]!.a, p.links[i]!.b)) {
      built.push(i);
      cost += p.links[i]!.cost;
    }
  }
  if (built.length !== vertices.size - 1) return null;
  return { cost, built: built.sort((a, b) => a - b) };
}

/** Cheapest plan that opens exactly the junction subset `mask` (bits over `junctionIndices`), or null. */
function withJunctions(p: NetworkProblem, junctions: readonly number[], mask: number): { score: number; plan: NetworkPlan } | null {
  const vertices = new Set(townIndices(p));
  let open = 0;
  junctions.forEach((j, k) => {
    if (mask & (1 << k)) {
      vertices.add(j);
      open += p.points[j]!.open;
    }
  });
  const tree = spanningTree(p, vertices);
  return tree ? { score: tree.cost + open, plan: { built: tree.built } } : null;
}

/**
 * The proven optimum: for every subset of junctions (≤ 2³), the MST of towns ∪ subset plus the subset's opening
 * costs. An optimal network is a tree spanning the towns and the junctions it uses, and the MST of exactly that
 * vertex set costs no more, so the minimum over subsets is the optimum.
 */
export function solveNetwork(p: NetworkProblem): { score: number; plan: NetworkPlan } {
  const junctions = junctionIndices(p);
  let best: { score: number; plan: NetworkPlan } | null = null;
  for (let mask = 0; mask < 1 << junctions.length; mask++) {
    const option = withJunctions(p, junctions, mask);
    if (option && (!best || option.score < best.score)) best = option;
  }
  // isNetworkProblem guarantees that all candidate links connect the towns, so some subset works.
  return best ?? { score: 0, plan: { built: [] } };
}

/* ---------- Generator ---------- */

interface NetLevel {
  towns: number;
  junctions: number;
  decoy: boolean;
  links: [number, number];
  rough: number;
  open: [number, number];
}
const LEVELS: Record<Difficulty, NetLevel> = {
  easy: { towns: 6, junctions: 0, decoy: false, links: [8, 10], rough: 0, open: [0, 0] },
  medium: { towns: 7, junctions: 2, decoy: false, links: [11, 15], rough: 2, open: [0, 0] },
  hard: { towns: 8, junctions: 3, decoy: true, links: [14, 19], rough: 3, open: [1, 3] }
};

/** Minimum distance between points, the longest candidate link, and clearances (all in field units). */
const MIN_POINT_GAP = 2.2;
const MAX_LINK = 5.7;
const POINT_CLEARANCE = 0.8;
const BADGE_GAP = 1.25;

type XY = readonly [number, number];
const dist = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pointSegmentDistance(p: XY, a: XY, b: XY): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const s = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + s * dx), p[1] - (a[1] + s * dy));
}

const orient = (a: XY, b: XY, c: XY) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));

/** Do two segments cross in their interiors (shared endpoints do not count)? */
export function segmentsCross(a: XY, b: XY, c: XY, d: XY): boolean {
  const same = (u: XY, v: XY) => u[0] === v[0] && u[1] === v[1];
  if (same(a, c) || same(a, d) || same(b, c) || same(b, d)) {
    // Sharing an endpoint: they overlap only when collinear and pointing the same way.
    const [shared, p, q] = same(a, c) ? [a, b, d] : same(a, d) ? [a, b, c] : same(b, c) ? [b, a, d] : [b, a, c];
    return orient(shared, p, q) === 0 && (p[0] - shared[0]) * (q[0] - shared[0]) + (p[1] - shared[1]) * (q[1] - shared[1]) > 0;
  }
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  const on = (p: XY, q: XY, r: XY) => Math.min(p[0], r[0]) <= q[0] && q[0] <= Math.max(p[0], r[0]) && Math.min(p[1], r[1]) <= q[1] && q[1] <= Math.max(p[1], r[1]);
  return (o1 === 0 && on(a, c, b)) || (o2 === 0 && on(a, d, b)) || (o3 === 0 && on(c, a, d)) || (o4 === 0 && on(c, b, d));
}

/** All angles of the triangle below 120°: then its Fermat point lies strictly inside and saves length. */
function anglesBelow120(a: XY, b: XY, c: XY): boolean {
  const ab = dist(a, b);
  const bc = dist(b, c);
  const ca = dist(c, a);
  const cosAt = (x: number, y: number, opposite: number) => (x * x + y * y - opposite * opposite) / (2 * x * y);
  return cosAt(ab, ca, bc) > -0.5 && cosAt(ab, bc, ca) > -0.5 && cosAt(bc, ca, ab) > -0.5;
}

/** Fermat point (minimal total distance to three points) by Weiszfeld's iteration. */
export function fermatPoint(a: XY, b: XY, c: XY): [number, number] {
  let x = (a[0] + b[0] + c[0]) / 3;
  let y = (a[1] + b[1] + c[1]) / 3;
  for (let k = 0; k < 100; k++) {
    let wx = 0;
    let wy = 0;
    let w = 0;
    for (const p of [a, b, c]) {
      const d = Math.max(1e-9, Math.hypot(p[0] - x, p[1] - y));
      wx += p[0] / d;
      wy += p[1] / d;
      w += 1 / d;
    }
    x = wx / w;
    y = wy / w;
  }
  return [x, y];
}

const far = (p: XY, points: readonly NetPoint[], gap: number) => points.every((q) => dist(p, [q.x, q.y]) >= gap);

function attemptNetwork(rng: Rng, level: NetLevel): NetworkProblem | null {
  const points: NetPoint[] = [];
  for (let tries = 0; points.length < level.towns; tries++) {
    if (tries > 400) return null;
    const p: XY = [rng.int(1, NET_FIELD - 1), rng.int(1, NET_FIELD - 1)];
    if (far(p, points, MIN_POINT_GAP)) points.push({ x: p[0], y: p[1], junction: false, open: 0 });
  }
  // Labels follow reading order (A top left), so the map reads like a page.
  const byReading = (u: NetPoint, v: NetPoint) => u.y - v.y || u.x - v.x;
  points.sort(byReading);
  const real = level.junctions - (level.decoy ? 1 : 0);
  const towns = points.slice();
  const triples: [number, number, number][] = [];
  for (let i = 0; i < towns.length; i++)
    for (let j = i + 1; j < towns.length; j++)
      for (let k = j + 1; k < towns.length; k++) {
        const [a, b, c] = [towns[i]!, towns[j]!, towns[k]!].map((q) => [q.x, q.y] as XY) as [XY, XY, XY];
        if (Math.max(dist(a, b), dist(b, c), dist(c, a)) <= MAX_LINK + 1 && anglesBelow120(a, b, c)) triples.push([i, j, k]);
      }
  for (const [i, j, k] of rng.shuffle(triples)) {
    if (points.length - level.towns >= real) break;
    const [a, b, c] = [towns[i]!, towns[j]!, towns[k]!].map((q) => [q.x, q.y] as XY) as [XY, XY, XY];
    const f = fermatPoint(a, b, c);
    const p: XY = [Math.round(f[0]), Math.round(f[1])];
    if (p[0] < 1 || p[1] < 1 || p[0] > NET_FIELD - 1 || p[1] > NET_FIELD - 1 || !far(p, points, MIN_POINT_GAP)) continue;
    points.push({ x: p[0], y: p[1], junction: true, open: rng.int(level.open[0], level.open[1]) });
  }
  if (points.length - level.towns < real) return null;
  if (level.decoy) {
    for (let tries = 0; points.length < level.towns + level.junctions; tries++) {
      if (tries > 200) return null;
      const p: XY = [rng.int(1, NET_FIELD - 1), rng.int(1, NET_FIELD - 1)];
      if (far(p, points, MIN_POINT_GAP)) points.push({ x: p[0], y: p[1], junction: true, open: rng.int(level.open[0], level.open[1]) });
    }
  }

  points.splice(level.towns, points.length - level.towns, ...points.slice(level.towns).sort(byReading));
  // Candidate links: short pairs first, each drawn without crossings, without running past a point and with its
  // cost badge clear of the other badges.
  const xy = points.map((q) => [q.x, q.y] as XY);
  const pairs: [number, number, number][] = [];
  for (let a = 0; a < xy.length; a++)
    for (let b = a + 1; b < xy.length; b++) {
      const d = dist(xy[a]!, xy[b]!);
      if (d <= MAX_LINK && !(points[a]!.junction && points[b]!.junction)) pairs.push([a, b, d]);
    }
  // Equal lengths in random order, so the drawing is not biased to one corner.
  const ordered = rng.shuffle(pairs).sort((u, v) => u[2] - v[2]);
  const target = rng.int(level.links[0], level.links[1]);
  const chosen: [number, number, number][] = [];
  const mid = (a: number, b: number): XY => [(xy[a]![0] + xy[b]![0]) / 2, (xy[a]![1] + xy[b]![1]) / 2];
  for (const [a, b, d] of ordered) {
    if (chosen.length >= target) break;
    if (chosen.some(([c, e]) => segmentsCross(xy[a]!, xy[b]!, xy[c]!, xy[e]!))) continue;
    if (xy.some((q, v) => v !== a && v !== b && pointSegmentDistance(q, xy[a]!, xy[b]!) < POINT_CLEARANCE)) continue;
    const m = mid(a, b);
    if (chosen.some(([c, e]) => dist(m, mid(c, e)) < BADGE_GAP)) continue;
    chosen.push([a, b, d]);
  }
  if (chosen.length < level.links[0]) return null;
  chosen.sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  const links: NetLink[] = chosen.map(([a, b, d]) => ({ a, b, cost: Math.max(1, Math.round(d)), rough: false }));
  if (level.rough > 0) {
    const count = rng.int(1, Math.floor(links.length / 4));
    for (const i of rng.shuffle(links.map((_, k) => k)).slice(0, count)) {
      links[i]!.rough = true;
      links[i]!.cost += level.rough;
    }
  }
  const problem: NetworkProblem = { kind: 'network', points, links };
  // Every junction must be reachable, or it is clutter.
  for (const j of junctionIndices(problem)) if (!links.some((l) => l.a === j || l.b === j)) return null;
  return isNetworkProblem(problem) ? problem : null;
}

/**
 * The interest filters of the design (§ 5.1): on medium/hard the optimum uses a junction and the towns-only MST (if
 * any) is strictly dearer; on hard also opening every junction is strictly dearer than the optimum.
 */
export function networkIsInteresting(p: NetworkProblem, difficulty: Difficulty): boolean {
  if (difficulty === 'easy') return true;
  const best = solveNetwork(p);
  if (usedJunctions(p, best.plan.built).length === 0) return false;
  const junctions = junctionIndices(p);
  const townsOnly = withJunctions(p, junctions, 0);
  if (townsOnly && townsOnly.score <= best.score) return false;
  if (difficulty === 'hard') {
    const all = withJunctions(p, junctions, (1 << junctions.length) - 1);
    if (!all || all.score <= best.score) return false;
  }
  return true;
}

/** Fixed instances (frozen generator output, seed 2026) for the rare case that 200 attempts find nothing; tests check them. */
export const NETWORK_FALLBACK: Record<Difficulty, NetworkProblem> = {
  easy: {
    kind: 'network',
    points: [
      { x: 2, y: 2, junction: false, open: 0 },
      { x: 5, y: 3, junction: false, open: 0 },
      { x: 1, y: 6, junction: false, open: 0 },
      { x: 6, y: 6, junction: false, open: 0 },
      { x: 7, y: 8, junction: false, open: 0 },
      { x: 4, y: 9, junction: false, open: 0 }
    ],
    links: [
      { a: 0, b: 1, cost: 3, rough: false },
      { a: 0, b: 2, cost: 4, rough: false },
      { a: 1, b: 2, cost: 5, rough: false },
      { a: 1, b: 3, cost: 3, rough: false },
      { a: 2, b: 3, cost: 5, rough: false },
      { a: 2, b: 5, cost: 4, rough: false },
      { a: 3, b: 4, cost: 2, rough: false },
      { a: 4, b: 5, cost: 3, rough: false }
    ]
  },
  medium: {
    kind: 'network',
    points: [
      { x: 9, y: 1, junction: false, open: 0 },
      { x: 1, y: 3, junction: false, open: 0 },
      { x: 8, y: 3, junction: false, open: 0 },
      { x: 6, y: 5, junction: false, open: 0 },
      { x: 9, y: 6, junction: false, open: 0 },
      { x: 3, y: 9, junction: false, open: 0 },
      { x: 8, y: 9, junction: false, open: 0 },
      { x: 4, y: 6, junction: true, open: 0 },
      { x: 6, y: 8, junction: true, open: 0 }
    ],
    links: [
      { a: 0, b: 2, cost: 2, rough: false },
      { a: 1, b: 7, cost: 4, rough: false },
      { a: 2, b: 3, cost: 3, rough: false },
      { a: 2, b: 4, cost: 3, rough: false },
      { a: 3, b: 4, cost: 5, rough: true },
      { a: 3, b: 7, cost: 4, rough: true },
      { a: 3, b: 8, cost: 3, rough: false },
      { a: 4, b: 6, cost: 3, rough: false },
      { a: 5, b: 7, cost: 3, rough: false },
      { a: 5, b: 8, cost: 3, rough: false },
      { a: 6, b: 8, cost: 2, rough: false }
    ]
  },
  hard: {
    kind: 'network',
    points: [
      { x: 9, y: 1, junction: false, open: 0 },
      { x: 3, y: 2, junction: false, open: 0 },
      { x: 1, y: 4, junction: false, open: 0 },
      { x: 9, y: 4, junction: false, open: 0 },
      { x: 3, y: 5, junction: false, open: 0 },
      { x: 8, y: 6, junction: false, open: 0 },
      { x: 1, y: 9, junction: false, open: 0 },
      { x: 4, y: 9, junction: false, open: 0 },
      { x: 7, y: 3, junction: true, open: 2 },
      { x: 5, y: 7, junction: true, open: 2 },
      { x: 9, y: 8, junction: true, open: 3 }
    ],
    links: [
      { a: 0, b: 8, cost: 3, rough: false },
      { a: 1, b: 2, cost: 3, rough: false },
      { a: 1, b: 8, cost: 4, rough: false },
      { a: 2, b: 4, cost: 2, rough: false },
      { a: 3, b: 5, cost: 2, rough: false },
      { a: 3, b: 8, cost: 2, rough: false },
      { a: 4, b: 6, cost: 4, rough: false },
      { a: 4, b: 8, cost: 4, rough: false },
      { a: 4, b: 9, cost: 6, rough: true },
      { a: 5, b: 9, cost: 3, rough: false },
      { a: 5, b: 10, cost: 2, rough: false },
      { a: 6, b: 7, cost: 3, rough: false },
      { a: 7, b: 9, cost: 2, rough: false },
      { a: 7, b: 10, cost: 8, rough: true }
    ]
  }
};

export function generateNetwork(rng: Rng, difficulty: Difficulty): { problem: NetworkProblem; fallback: boolean } {
  const level = LEVELS[difficulty];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const problem = attemptNetwork(rng, level);
    if (problem && networkIsInteresting(problem, difficulty)) return { problem, fallback: false };
  }
  return { problem: structuredClone(NETWORK_FALLBACK[difficulty]), fallback: true };
}
