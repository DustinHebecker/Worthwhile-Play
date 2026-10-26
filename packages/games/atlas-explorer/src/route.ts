/**
 * "Overland route" (design § 9): the land-border graph of the UN members (edges under the neutrality rule, § 12.3),
 * breadth-first distances with the number of shortest routes, one deterministic shortest route, and the pair
 * generator for each difficulty band.
 */
import type { Rng } from '@wp/game-core';
import type { Atlas, Country } from './atlas';
import { countryPool, type Area, type Difficulty } from './compare';

/** A neighbour list per node id. */
export type Graph = ReadonlyMap<string, readonly string[]>;

const graphs = new WeakMap<Atlas, Graph>();

/** Largest gap (degrees) between two countries' home territories for their border to be an overland step. */
export const OVERLAND_GAP_DEG = 2;

/**
 * Whether a land border between two neighbours can be walked from their home territories. A border that exists only
 * through an overseas part (France–Brazil and France–Suriname, via French Guiana) is no overland route: it would make
 * "Portugal → Spain → France → Brazil" a route "by land".
 */
export function overland(a: Country, b: Country): boolean {
  const gap = Math.max(a.home[0] - b.home[2], b.home[0] - a.home[2], a.home[1] - b.home[3], b.home[1] - a.home[3]);
  return gap <= OVERLAND_GAP_DEG;
}

/** The atlas's overland border graph (neighbour lists sorted, cached per atlas). */
export function graphOf(atlas: Atlas): Graph {
  let g = graphs.get(atlas);
  if (!g) {
    const steps = (c: Country) => c.nb.filter((n) => {
      const o = atlas.country(n);
      return o !== undefined && overland(c, o);
    });
    g = new Map(atlas.countries.map((c) => [c.id, steps(c).sort()]));
    graphs.set(atlas, g);
  }
  return g;
}

/** Cap for the number of shortest routes (stored in saves; far above any real count). */
export const WAYS_CAP = 1_000_000;

/** Breadth-first search: distance (crossings) and the number of shortest routes from `from` to every reachable node. */
export function bfs(g: Graph, from: string): Map<string, { dist: number; ways: number }> {
  const out = new Map<string, { dist: number; ways: number }>();
  if (!g.has(from)) return out;
  out.set(from, { dist: 0, ways: 1 });
  let frontier = [from];
  while (frontier.length) {
    const next: string[] = [];
    for (const u of frontier) {
      const du = out.get(u)!;
      for (const v of g.get(u) ?? []) {
        const dv = out.get(v);
        if (!dv) {
          out.set(v, { dist: du.dist + 1, ways: du.ways });
          next.push(v);
        } else if (dv.dist === du.dist + 1) dv.ways = Math.min(WAYS_CAP, dv.ways + du.ways);
      }
    }
    frontier = next;
  }
  return out;
}

/** One shortest route from `from` to `to` (alphabetically first at each step), or null if unreachable. */
export function shortestRoute(g: Graph, from: string, to: string): string[] | null {
  const back = bfs(g, to);
  if (!back.has(from)) return null;
  const path = [from];
  let cur = from;
  while (cur !== to) {
    const d = back.get(cur)!.dist;
    cur = (g.get(cur) ?? []).find((v) => back.get(v)?.dist === d - 1)!;
    path.push(cur);
  }
  return path;
}

/** Shortest-crossing band per difficulty (design § 9.2). */
export const ROUTE_BANDS: Readonly<Record<Difficulty, readonly [number, number]>> = { easy: [2, 3], medium: [4, 5], hard: [6, 8] };

export interface RouteDraw {
  readonly from: string;
  readonly to: string;
  readonly best: number;
  readonly ways: number;
  /** Both ends are drawn from the whole world (Oceania has almost no land borders). */
  readonly worldwide: boolean;
}

/** Draws a pair in the difficulty's band; at least the start lies in the area (except Oceania). */
export function drawRoute(rng: Rng, atlas: Atlas, area: Area, d: Difficulty, used: ReadonlySet<string>): RouteDraw | null {
  const g = graphOf(atlas);
  const worldwide = area === 'oceania';
  const scope: Area = worldwide ? 'world' : area;
  const [lo, hi] = ROUTE_BANDS[d];
  const starts = countryPool(atlas, scope, d).filter((c) => (g.get(c.id) ?? []).length > 0 && !used.has(`country:${c.id}`));
  const preferredTier = d === 'easy' ? 2 : 3;
  for (let attempt = 0; attempt < 60 && starts.length; attempt++) {
    const a = rng.pick(starts);
    const reach = bfs(g, a.id);
    const inBand = atlas.countries.filter((c) => {
      const r = reach.get(c.id);
      return r !== undefined && r.dist >= lo && r.dist <= hi && !used.has(`country:${c.id}`);
    });
    const known = (list: Country[]) => (list.some((c) => c.tier <= preferredTier) ? list.filter((c) => c.tier <= preferredTier) : list);
    const local = inBand.filter((c) => scope === 'world' || c.region === scope);
    const pool = known(local.length ? local : inBand);
    if (!pool.length) continue;
    const b = rng.pick(pool);
    const r = reach.get(b.id)!;
    return { from: a.id, to: b.id, best: r.dist, ways: r.ways, worldwide };
  }
  return null;
}

/** Whether `path` is a valid route so far: starts at `from`, each step a neighbour, no repeats. */
export function validPath(g: Graph, from: string, path: readonly string[]): boolean {
  if (path[0] !== from || new Set(path).size !== path.length) return false;
  for (let i = 1; i < path.length; i++) if (!(g.get(path[i - 1]!) ?? []).includes(path[i]!)) return false;
  return true;
}
