/**
 * Brute-force reference implementations for the tests. They share no code with `src/rules.ts`:
 * connectivity is decided with a union–find over the surviving connections, bridges and
 * articulation points by removing each connection/point in turn, shortest routes by listing
 * every simple route, and minimum cuts by trying all sets of connections in order of size.
 * They are slow on purpose and only meant for small networks.
 */
// @ts-nocheck


export type OEdge = readonly [number, number, number];

/** Representative of every point after joining all connections not in `skipEdges` and not touching `skipNode`. */
function unionFind(n: number, edges: readonly OEdge[], skipEdges: ReadonlySet<number> = new Set(), skipNode = -1): number[] {
  const parent = Array.from({ length: n }, (_, i) => i);
  const top = (x: number): number => {
    while (parent[x] !== x) x = parent[x]!;
    return x;
  };
  edges.forEach(([a, b], i) => {
    if (skipEdges.has(i) || a === skipNode || b === skipNode) return;
    parent[top(a)] = top(b);
  });
  return parent.map((_, i) => top(i));
}

export function linked(n: number, edges: readonly OEdge[], s: number, t: number, skipEdges: ReadonlySet<number> = new Set(), skipNode = -1): boolean {
  const rep = unionFind(n, edges, skipEdges, skipNode);
  return rep[s] === rep[t];
}

function pieces(n: number, edges: readonly OEdge[], skipEdges: ReadonlySet<number> = new Set(), skipNode = -1): number {
  const rep = unionFind(n, edges, skipEdges, skipNode);
  return new Set(rep.filter((_, i) => i !== skipNode)).size;
}

export function oracleConnected(n: number, edges: readonly OEdge[]): boolean {
  return pieces(n, edges) <= 1;
}

/** Connections whose removal increases the number of pieces. */
export function oracleBridges(n: number, edges: readonly OEdge[]): number[] {
  const before = pieces(n, edges);
  return edges.flatMap((_, i) => (pieces(n, edges, new Set([i])) > before ? [i] : []));
}

/** Connections whose removal alone disconnects `s` from `t` (both must be linked before). */
export function oracleSeparating(n: number, edges: readonly OEdge[], s: number, t: number): number[] {
  if (s === t || !linked(n, edges, s, t)) return [];
  return edges.flatMap((_, i) => (linked(n, edges, s, t, new Set([i])) ? [] : [i]));
}

/** Points whose removal disconnects two other points that were linked. */
export function oracleArticulation(n: number, edges: readonly OEdge[]): number[] {
  const result: number[] = [];
  const before = unionFind(n, edges);
  for (let v = 0; v < n; v++) {
    const after = unionFind(n, edges, new Set(), v);
    let cut = false;
    for (let x = 0; x < n && !cut; x++) {
      for (let y = x + 1; y < n && !cut; y++) {
        if (x !== v && y !== v && before[x] === before[y] && after[x] !== after[y]) cut = true;
      }
    }
    if (cut) result.push(v);
  }
  return result;
}

export function oracleTwoEdgeConnected(n: number, edges: readonly OEdge[]): boolean {
  return oracleConnected(n, edges) && edges.every((_, i) => pieces(n, edges, new Set([i])) === 1);
}

/** All non-adjacent pairs whose extra connection makes the network two-edge-connected. */
export function oracleAugmentPairs(n: number, edges: readonly OEdge[]): string[] {
  const result: string[] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (edges.some(([a, b]) => a === u && b === v)) continue;
      if (oracleTwoEdgeConnected(n, [...edges, [u, v, 1]])) result.push(`${u}-${v}`);
    }
  }
  return result;
}

/** Every simple route from `s` to `t`, as sorted lists of connection indices. */
export function simpleRoutes(n: number, edges: readonly OEdge[], s: number, t: number): number[][] {
  const routes: number[][] = [];
  const visited = new Set<number>([s]);
  const walk = (at: number, used: number[]) => {
    if (at === t) {
      routes.push([...used].sort((a, b) => a - b));
      return;
    }
    edges.forEach(([a, b], i) => {
      const next = a === at ? b : b === at ? a : -1;
      if (next < 0 || visited.has(next)) return;
      visited.add(next);
      used.push(i);
      walk(next, used);
      used.pop();
      visited.delete(next);
    });
  };
  if (s !== t) walk(s, []);
  return routes;
}

export const routeWeight = (edges: readonly OEdge[], route: readonly number[]): number => route.reduce((sum, i) => sum + edges[i]![2], 0);

/** Shortest distance by listing all simple routes (`Infinity` when there is none, 0 for s = t). */
export function oracleDistance(n: number, edges: readonly OEdge[], s: number, t: number): number {
  if (s === t) return 0;
  return Math.min(Infinity, ...simpleRoutes(n, edges, s, t).map((r) => routeWeight(edges, r)));
}

function* subsets(m: number, k: number, start = 0, chosen: number[] = []): Generator<number[]> {
  if (chosen.length === k) {
    yield chosen;
    return;
  }
  for (let i = start; i < m; i++) yield* subsets(m, k, i + 1, [...chosen, i]);
}

/** Smallest number of connections whose removal disconnects `s` from `t` (0 if already apart). */
export function oracleMinCut(n: number, edges: readonly OEdge[], s: number, t: number): number {
  for (let k = 0; k <= edges.length; k++) {
    for (const set of subsets(edges.length, k)) if (!linked(n, edges, s, t, new Set(set))) return k;
  }
  return Infinity;
}
