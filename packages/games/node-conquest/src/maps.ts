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
 *
 * Maps from LEGACY_MAPS on are hand-built sector templates (BUILT): the same rotation scheme, but
 * explicit lanes that may cross each other (hostile streams meet and fight at the crossing point). Each spot's
 * sector-local position is rounded to integers once and then rotated with the integer table, so
 * these maps are exactly symmetric too.
 */

export const NODE_TYPES = ['standard', 'shipyard', 'station', 'bastion'] as const;
export type NodeType = (typeof NODE_TYPES)[number];

/** Board size in SVG units (square). */
export const BOARD = 640;
/** Maps 0–6: the seeded generator (planar). Saves rebuild them from the index, so they never change. */
export const LEGACY_MAPS = 7;
/** Maps 7 and up: hand-built topologies (BUILT below), appended after the generated ones. */
/** Map index of the hand-made introduction map (always one opponent). */
export const INTRO_MAP = -1;
/**
 * Map layouts. 1: the original generator (outposts, shipyards, platforms) — kept unchanged so
 * saves from state version 1 regenerate exactly. 2: the same geometry plus bastions.
 */
export const LAYOUTS = [1, 2] as const;
export type Layout = (typeof LAYOUTS)[number];
export const FACTION_COUNTS = [2, 3, 4] as const;
export type FactionCount = (typeof FACTION_COUNTS)[number];
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
  /** Map index (0 … MAPS_PER_SET − 1), or INTRO_MAP. */
  readonly index: number;
  readonly layout: Layout;
  /** Player (0) plus opponents. */
  readonly factions: number;
  readonly nodes: readonly MapNode[];
  /** Lanes as [a, b, length] with a < b. */
  readonly lanes: readonly (readonly [number, number, number])[];
  /** `laneOf[a][b]` = lane index or -1. */
  readonly laneOf: readonly (readonly number[])[];
  readonly adjacent: readonly (readonly number[])[];
  /** Index of the centre node, or -1. */
  readonly center: number;
}

interface Config {
  factions: number;
  perSector: readonly [number, number];
  neutralLevels: readonly [number, number];
  /** Wedge half-width: |x| * 100 <= wedge * y (sector-local, pointing down). */
  wedge: number;
}

/** Keyed by the number of factions (player + opponents). */
const CONFIG: Record<FactionCount, Config> = {
  2: { factions: 2, perSector: [5, 6], neutralLevels: [2, 8], wedge: 400 },
  3: { factions: 3, perSector: [4, 5], neutralLevels: [3, 10], wedge: 150 },
  4: { factions: 4, perSector: [4, 4], neutralLevels: [3, 12], wedge: 90 }
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

function buildMap(factions: FactionCount, index: number, draft: Draft): GameMap | null {
  const config = CONFIG[factions];
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
  const map: GameMap = { index, layout: 1, factions: n, nodes, lanes, laneOf, adjacent, center: centerIndex };
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

/** The original generator (layout 1). The seed formula is unchanged from state version 1. */
function generate(factions: FactionCount, index: number): GameMap {
  const rng = createRng(0x0c0ffee + (factions - 2) * 7919 + index * 104729);
  for (let attempt = 0; attempt < 500; attempt++) {
    const draft = draftSector(rng, CONFIG[factions], (index + attempt) % 3 !== 1);
    if (!draft) continue;
    const map = buildMap(factions, index, draft);
    if (map) return map;
  }
  /* c8 ignore next */
  throw new Error(`No fair map for ${factions} factions #${index}`);
}

/**
 * Layout 2: the layout-1 geometry with one outpost per sector turned into a bastion (never a start
 * and never the easy first expansion next to the start), copied to every sector, so the map stays
 * exactly symmetric. A standard centre node becomes a bastion on some maps. Uses its own PRNG
 * stream, so layout 1 is untouched.
 */
export function withBastions(base: GameMap): GameMap {
  const n = base.factions;
  const k = Math.floor((base.nodes.length - (base.center >= 0 ? 1 : 0)) / n);
  const rng = createRng(0xba5710 + n * 31 + base.index * 977);
  const dist = (i: number) => d2([base.nodes[i]!.x, base.nodes[i]!.y], [base.nodes[0]!.x, base.nodes[0]!.y]);
  let nearest = 1;
  for (let i = 2; i < k; i++) if (dist(i) < dist(nearest)) nearest = i;
  // Prefer turning an outpost into a bastion; take any other neutral when a sector has none.
  const candidates: number[] = [];
  for (let i = 1; i < k; i++) if (i !== nearest && base.nodes[i]!.type === 'standard') candidates.push(i);
  if (candidates.length === 0) for (let i = 1; i < k; i++) if (i !== nearest) candidates.push(i);
  const chosen = new Set<number>();
  if (candidates.length > 0) {
    const local = rng.pick(candidates);
    for (let s = 0; s < n; s++) chosen.add(s * k + local);
  }
  if (base.center >= 0 && base.nodes[base.center]!.type === 'standard' && rng.int(0, 2) === 0) chosen.add(base.center);
  const nodes = base.nodes.map((node, v): MapNode => (chosen.has(v) ? { ...node, type: 'bastion', level: Math.max(node.level, 4) } : node));
  return { ...base, layout: 2, nodes };
}

/** Small hand-made first map: one opponent, short lanes, one node of each kind that matters. */
function introMap(): GameMap {
  const spec: [number, number, NodeType, number, number][] = [
    [320, 570, 'standard', 10, 0],
    [180, 450, 'standard', 2, -1],
    [460, 450, 'shipyard', 5, -1],
    [320, 320, 'standard', 6, -1],
    [180, 190, 'bastion', 5, -1],
    [460, 190, 'standard', 4, 1],
    [320, 70, 'standard', 10, 1]
  ];
  const nodes = spec.map(([x, y, type, level, owner]): MapNode => ({ x, y, type, level, owner }));
  const pairs: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
    [4, 6],
    [5, 6]
  ];
  const lanes = pairs.map(([a, b]) => [a, b, isqrt(d2([nodes[a]!.x, nodes[a]!.y], [nodes[b]!.x, nodes[b]!.y]))] as const);
  const laneOf = nodes.map(() => nodes.map(() => -1));
  const adjacent: number[][] = nodes.map(() => []);
  lanes.forEach(([a, b], i) => {
    laneOf[a]![b] = i;
    laneOf[b]![a] = i;
    adjacent[a]!.push(b);
    adjacent[b]!.push(a);
  });
  for (const list of adjacent) list.sort((x, y) => x - y);
  return { index: INTRO_MAP, layout: 2, factions: 2, nodes, lanes, laneOf, adjacent, center: 3 };
}

/* ---------- Hand-built maps (index LEGACY_MAPS and up) ---------- */

/**
 * One node of a sector template in polar form: `r` from the centre, `a` the angle from the
 * sector's axis as a fraction of half the sector (−1 … 1; positive turns towards the next sector,
 * 1 = on the border, shared with nothing because the next sector's border is its own +1).
 */
interface Spot {
  readonly r: number;
  readonly a: number;
  readonly type: NodeType;
  readonly level: number;
  /** Only present for these faction counts (default: all). */
  readonly only?: readonly FactionCount[];
}

/** A lane of a template between two spots, optionally only for some faction counts. */
type Link = readonly [number, number] | readonly [number, number, readonly FactionCount[]];

/**
 * A sector template, copied to every faction by rotation. Spot 0 is the start. Lanes: `inner`
 * inside a sector, `next` from a spot of sector s to a spot of sector s + 1, `hub` from a spot to the
 * centre node. Lanes may cross (hostile streams fight at the crossing point); they never run through
 * a node.
 */
interface Template {
  readonly spots: readonly Spot[];
  readonly centre?: { readonly type: NodeType; readonly level: number };
  readonly inner: readonly Link[];
  readonly next: readonly Link[];
  readonly hub: readonly number[];
}

const spot = (r: number, a: number, type: NodeType, level: number, only?: readonly FactionCount[]): Spot => (only ? { r, a, type, level, only } : { r, a, type, level });

/** The hand-built maps, in index order from LEGACY_MAPS. */
const BUILT: readonly Template[] = [
  // 7 · Crossroads: two flanks per faction; the links between neighbours cross in an X.
  {
    spots: [spot(255, 0, 'standard', 10), spot(190, -0.5, 'standard', 3), spot(190, 0.5, 'shipyard', 7), spot(125, 0, 'standard', 9)],
    centre: { type: 'station', level: 14 },
    inner: [[0, 1], [0, 2], [1, 3], [2, 3]],
    next: [[3, 1], [2, 3]],
    hub: [3]
  },
  // 8 · Ring road: an outer ring through every start, spokes to a fortified centre.
  {
    spots: [
      spot(235, 0, 'standard', 10),
      spot(255, 0.5, 'standard', 5),
      spot(255, -0.5, 'standard', 3),
      spot(140, 0, 'shipyard', 8),
      spot(265, 1, 'station', 8, [2])
    ],
    centre: { type: 'bastion', level: 10 },
    inner: [[0, 1], [0, 2], [0, 3], [1, 3], [1, 4]],
    next: [[1, 2, [3, 4]], [4, 2]],
    hub: [3]
  },
  // 9 · Gates: every pair of neighbours meets at one shipyard gate on the border; an inner ring of shipyards behind.
  {
    spots: [spot(250, 0, 'standard', 10), spot(170, -0.35, 'standard', 3), spot(170, 0.35, 'standard', 6), spot(230, 1, 'shipyard', 6), spot(85, 0, 'shipyard', 8)],
    inner: [[0, 1], [0, 2], [1, 2], [2, 3], [1, 4], [2, 4]],
    next: [[3, 1], [4, 4]],
    hub: []
  },
  // 10 · Pinwheel: every sector turned the same way; the links to the next sector spiral.
  {
    spots: [spot(245, 0, 'standard', 10), spot(200, 0.55, 'standard', 3), spot(120, 0.2, 'shipyard', 7), spot(205, -0.6, 'station', 9)],
    centre: { type: 'standard', level: 14 },
    inner: [[0, 1], [0, 3], [1, 2], [3, 2]],
    next: [[1, 3], [2, 3]],
    hub: [2]
  },
  // 11 · Lattice: two pairs of crossing lanes in every sector (fewer in the narrow four-way sectors).
  {
    spots: [
      spot(255, 0, 'standard', 10),
      spot(195, -0.45, 'standard', 2),
      spot(195, 0.45, 'standard', 6),
      spot(100, -0.55, 'shipyard', 8, [2, 3]),
      spot(100, 0.55, 'station', 10, [2, 3]),
      spot(105, 0, 'bastion', 12, [4])
    ],
    inner: [[0, 1], [0, 2], [1, 3], [2, 4], [1, 4], [2, 3], [1, 5], [2, 5]],
    next: [[4, 3], [2, 1], [5, 1], [2, 5]],
    hub: []
  },
  // 12 · Spine: a long corridor from each start to a strong centre, and a loose outer ring.
  {
    spots: [spot(268, 0, 'standard', 10), spot(180, 0, 'standard', 3), spot(92, 0, 'station', 12), spot(235, 0.75, 'standard', 5), spot(235, -0.75, 'shipyard', 6)],
    centre: { type: 'shipyard', level: 20 },
    inner: [[0, 1], [1, 2], [0, 3], [0, 4], [1, 3], [1, 4]],
    next: [[3, 4]],
    hub: [2]
  }
];

export const MAPS_PER_SET = LEGACY_MAPS + BUILT.length;

/** Sector-local position of a spot (sector axis pointing down). */
function place(p: Spot, factions: number): [number, number] {
  const angle = (p.a * Math.PI) / factions;
  return [Math.round(-p.r * Math.sin(angle)), Math.round(p.r * Math.cos(angle))];
}

function buildTemplate(factions: FactionCount, index: number, template: Template): GameMap {
  const n = factions;
  const keep = template.spots.map((p) => !p.only || p.only.includes(n));
  const id: number[] = [];
  let k = 0;
  for (const kept of keep) id.push(kept ? k++ : -1);
  const spots = template.spots.filter((_, i) => keep[i]);
  const local = spots.map((p) => place(p, n));
  const half = BOARD / 2;
  const step = 360 / n;
  const nodes: MapNode[] = [];
  for (let s = 0; s < n; s++) {
    spots.forEach((p, i) => {
      const [x, y] = rotate(local[i]![0], local[i]![1], s * step);
      nodes.push({ x: x + half, y: y + half, type: p.type, level: p.level, owner: i === 0 ? s : -1 });
    });
  }
  const center = template.centre ? nodes.length : -1;
  if (template.centre) nodes.push({ x: half, y: half, type: template.centre.type, level: template.centre.level, owner: -1 });
  // Each lane orbit is measured once (in sector 0), so every faction gets exactly the same lengths.
  const laneSet = new Map<string, readonly [number, number, number]>();
  const addOrbit = (i: number, j: number, offset: number, toCentre: boolean) => {
    if (id[i]! < 0 || (!toCentre && id[j]! < 0)) return;
    const a0 = id[i]!;
    const b0 = toCentre ? center : (offset * k + id[j]!) % (n * k);
    const length = isqrt(d2([nodes[a0]!.x, nodes[a0]!.y], [nodes[b0]!.x, nodes[b0]!.y]));
    for (let s = 0; s < n; s++) {
      const a = s * k + a0;
      const b = toCentre ? center : (s * k + b0) % (n * k);
      const lane = (a < b ? [a, b, length] : [b, a, length]) as [number, number, number];
      laneSet.set(`${lane[0]}-${lane[1]}`, lane);
    }
  };
  for (const [i, j, only] of template.inner) if (!only || only.includes(n)) addOrbit(i, j, 0, false);
  for (const [i, j, only] of template.next) if (!only || only.includes(n)) addOrbit(i, j, 1, false);
  if (center >= 0) for (const i of template.hub) addOrbit(i, 0, 0, true);
  const lanes = [...laneSet.values()].sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const laneOf = nodes.map(() => nodes.map(() => -1));
  const adjacent: number[][] = nodes.map(() => []);
  lanes.forEach(([a, b], i) => {
    laneOf[a]![b] = i;
    laneOf[b]![a] = i;
    adjacent[a]!.push(b);
    adjacent[b]!.push(a);
  });
  for (const list of adjacent) list.sort((x, y) => x - y);
  return { index, layout: 2, factions: n, nodes, lanes, laneOf, adjacent, center };
}

/**
 * Where two lanes cross (both strictly inside), as fractions [t, u] of the way along lane `i` and
 * lane `j` (each from its lower node index), or null; lanes sharing a node never cross.
 */
export function laneCrossingParams(map: GameMap, i: number, j: number): [number, number] | null {
  const [a, b] = map.lanes[i]!;
  const [c, e] = map.lanes[j]!;
  if (a === c || a === e || b === c || b === e) return null;
  const P = map.nodes[a]!;
  const Q = map.nodes[b]!;
  const R = map.nodes[c]!;
  const S = map.nodes[e]!;
  const side = (o: MapNode, p: MapNode, q: MapNode) => Math.sign((p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x));
  if (side(R, S, P) * side(R, S, Q) >= 0 || side(P, Q, R) * side(P, Q, S) >= 0) return null;
  const denom = (Q.x - P.x) * (S.y - R.y) - (Q.y - P.y) * (S.x - R.x);
  const t = ((R.x - P.x) * (S.y - R.y) - (R.y - P.y) * (S.x - R.x)) / denom;
  const u = ((R.x - P.x) * (Q.y - P.y) - (R.y - P.y) * (Q.x - P.x)) / denom;
  return [t, u];
}

/** The point where two lanes cross (both strictly inside), or null; lanes sharing a node never cross. */
export function laneCrossing(map: GameMap, i: number, j: number): [number, number] | null {
  const params = laneCrossingParams(map, i, j);
  if (!params) return null;
  const P = map.nodes[map.lanes[i]![0]]!;
  const Q = map.nodes[map.lanes[i]![1]]!;
  const t = params[0];
  return [P.x + t * (Q.x - P.x), P.y + t * (Q.y - P.y)];
}

/**
 * Every pair of crossing lanes as [lane i, lane j, distance along i, distance along j] with i < j,
 * in the order of `crossings`. Distances are integers in lane units (as `Unit.d`), measured from
 * each lane's lower node index; they decide where streams on crossing lanes meet.
 */
export function crossingDistances(map: GameMap): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (let i = 0; i < map.lanes.length; i++) {
    for (let j = i + 1; j < map.lanes.length; j++) {
      const p = laneCrossingParams(map, i, j);
      if (p) out.push([i, j, Math.round(p[0] * map.lanes[i]![2]), Math.round(p[1] * map.lanes[j]![2])]);
    }
  }
  return out;
}

/** Every pair of crossing lanes as [lane, lane, x, y], lane indices ascending. */
export function crossings(map: GameMap): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (let i = 0; i < map.lanes.length; i++) {
    for (let j = i + 1; j < map.lanes.length; j++) {
      const p = laneCrossing(map, i, j);
      if (p) out.push([i, j, p[0], p[1]]);
    }
  }
  return out;
}

const cache = new Map<string, GameMap>();

/**
 * Map `index` (0 … MAPS_PER_SET − 1, or INTRO_MAP) for `factions` factions (player + opponents) in
 * `layout`. Hand-built maps exist in layout 2 only (layout 1 belongs to migrated version-1 saves,
 * which always have a map below LEGACY_MAPS); they ignore `layout`.
 */
export function getMap(factions: FactionCount, index: number, layout: Layout = 2): GameMap {
  const id = index === INTRO_MAP ? 'intro' : `${factions}:${index}:${layout}`;
  let map = cache.get(id);
  if (!map) {
    map =
      index === INTRO_MAP
        ? introMap()
        : index >= LEGACY_MAPS
          ? buildTemplate(factions, index, BUILT[index - LEGACY_MAPS]!)
          : layout === 1
            ? generate(factions, index)
            : withBastions(getMap(factions, index, 1));
    cache.set(id, map);
  }
  return map;
}
