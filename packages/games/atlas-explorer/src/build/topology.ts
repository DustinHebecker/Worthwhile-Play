/**
 * Data script only: shared-border topology (design § 11.3). Rings are quantised to integer lon/lat (1/`unit`
 * degree), densified so that no segment is longer than `maxStep` units, cut at junctions into arcs, and identical
 * arcs (forward or reversed) are stored once. A ring is a list of arc references (`i`, or `~i` for arc i reversed).
 * `dissolve` then removes the arcs between rings of the same group (e.g. England and Scotland) and stitches the rest.
 *
 * Junctions are points shared by *different* rings with different neighbours (a point repeated within one ring is
 * not a junction: detecting those produced thousands of spurious arcs in the planner's prototype).
 */
import type { Path } from './geojson';

export interface TopoRing {
  /** Index of the shape (map unit, overlay…) the ring came from, or the group after `dissolve`. */
  readonly owner: number;
  /** Arc references: `i` or `~i` (reversed). */
  readonly arcs: number[];
}

export interface Topology {
  /** Each arc as flat integer coordinates `[x0, y0, x1, y1, …]` (1/unit degree). */
  readonly arcs: number[][];
  readonly rings: TopoRing[];
}

export interface Shape {
  readonly owner: number;
  readonly rings: readonly Path[];
}

const OFF = 1 << 15;
/** A unique number per integer point (coordinates within ±16384). */
export const pointKey = (x: number, y: number): number => (x + OFF) * 65536 + (y + OFF);

/**
 * Quantises a ring to integer lon/lat, removes repeated points, closes it and inserts points so that no segment is
 * longer than `maxStep` in x or y. Intermediate points are computed from the canonically ordered end points, so two
 * rings sharing a segment get the same points in either direction. Returns `null` for a degenerate ring.
 */
export function quantizeRing(ring: Path, unit: number, maxStep: number): number[] | null {
  const pts: number[] = [];
  const push = (x: number, y: number) => {
    const n = pts.length;
    if (n >= 2 && pts[n - 2] === x && pts[n - 1] === y) return;
    pts.push(x, y);
  };
  let prev: [number, number] | null = null;
  const all = [...ring];
  if (all.length && (all[0]![0] !== all[all.length - 1]![0] || all[0]![1] !== all[all.length - 1]![1])) all.push(all[0]!);
  for (const [lon, lat] of all) {
    const x = Math.round(lon * unit);
    const y = Math.round(lat * unit);
    if (prev) {
      const [px, py]: [number, number] = prev;
      const steps = Math.ceil(Math.max(Math.abs(x - px), Math.abs(y - py)) / maxStep);
      if (steps > 1) {
        // Canonical order: interpolate from the lexicographically smaller end.
        const forward = px < x || (px === x && py <= y);
        const [ax, ay, bx, by] = forward ? [px, py, x, y] : [x, y, px, py];
        const mids: [number, number][] = [];
        for (let k = 1; k < steps; k++) mids.push([Math.round(ax + ((bx - ax) * k) / steps), Math.round(ay + ((by - ay) * k) / steps)]);
        if (!forward) mids.reverse();
        for (const [mx, my] of mids) push(mx, my);
      }
    }
    push(x, y);
    prev = [x, y];
  }
  // Closed ring with at least three distinct points.
  if (pts.length < 8) return null;
  if (pts[0] !== pts[pts.length - 2] || pts[1] !== pts[pts.length - 1]) pts.push(pts[0]!, pts[1]!);
  return pts;
}

/**
 * Inserts into every segment the points of *other* rings that lie on it (within `tol` units), so two rings that
 * trace the same border with different vertices (e.g. Egypt and Libya along 25° E) get identical point sequences
 * there and share one arc. Points are never moved; a ring only gains points.
 */
export function nodeRings(rings: readonly number[][], tol = 0.5): number[][] {
  const CELL = 64;
  const cellKey = (cx: number, cy: number) => cx * 100_000 + cy;
  const grid = new Map<number, { x: number; y: number; ring: number }[]>();
  const seen = new Set<string>();
  rings.forEach((p, ri) => {
    for (let i = 0; i + 1 < p.length; i += 2) {
      const x = p[i]!;
      const y = p[i + 1]!;
      const id = `${x},${y},${ri}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const k = cellKey(Math.floor(x / CELL), Math.floor(y / CELL));
      const list = grid.get(k) ?? [];
      list.push({ x, y, ring: ri });
      grid.set(k, list);
    }
  });
  return rings.map((p, ri) => {
    const out: number[] = [p[0]!, p[1]!];
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2]!;
      const ay = p[i - 1]!;
      const bx = p[i]!;
      const by = p[i + 1]!;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const found = new Map<string, { t: number; x: number; y: number }>();
      if (len2 > 0) {
        for (let cx = Math.floor((Math.min(ax, bx) - tol) / CELL); cx <= Math.floor((Math.max(ax, bx) + tol) / CELL); cx++)
          for (let cy = Math.floor((Math.min(ay, by) - tol) / CELL); cy <= Math.floor((Math.max(ay, by) + tol) / CELL); cy++)
            for (const q of grid.get(cellKey(cx, cy)) ?? []) {
              if (q.ring === ri || (q.x === ax && q.y === ay) || (q.x === bx && q.y === by)) continue;
              const t = ((q.x - ax) * dx + (q.y - ay) * dy) / len2;
              if (t <= 0 || t >= 1) continue;
              const cross = Math.abs((q.x - ax) * dy - (q.y - ay) * dx) / Math.sqrt(len2);
              if (cross <= tol) found.set(`${q.x},${q.y}`, { t, x: q.x, y: q.y });
            }
      }
      for (const q of [...found.values()].sort((a, b) => a.t - b.t)) {
        if (out[out.length - 2] === q.x && out[out.length - 1] === q.y) continue;
        out.push(q.x, q.y);
      }
      if (!(out[out.length - 2] === bx && out[out.length - 1] === by)) out.push(bx, by);
    }
    return out;
  });
}

/** Builds the topology of all rings of all shapes (quantised, densified and noded). */
export function buildTopology(shapes: readonly Shape[], unit: number, maxStep: number): Topology {
  const quantised: { owner: number; pts: number[] }[] = [];
  for (const s of shapes)
    for (const r of s.rings) {
      const pts = quantizeRing(r, unit, maxStep);
      if (pts) quantised.push({ owner: s.owner, pts });
    }
  const noded = nodeRings(quantised.map((r) => r.pts));
  const rings = quantised.map((r, i) => ({ owner: r.owner, pts: noded[i]! }));

  // Occurrences of each point: ring, previous and next point (rings are closed: the last point repeats the first).
  const firstRing = new Map<number, number>();
  const neighbours = new Map<number, string>(); // key → canonical neighbour pair of the first occurrence ('' = ambiguous)
  const junctions = new Set<number>();
  // A string, not a number: two 32-bit point keys do not fit into one exact double.
  const pairHash = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
  rings.forEach((ring, ri) => {
    const p = ring.pts;
    const n = p.length / 2 - 1; // distinct points
    for (let i = 0; i < n; i++) {
      const k = pointKey(p[2 * i]!, p[2 * i + 1]!);
      const j = (i + n - 1) % n;
      const l = (i + 1) % n;
      const pair = pairHash(pointKey(p[2 * j]!, p[2 * j + 1]!), pointKey(p[2 * l]!, p[2 * l + 1]!));
      const seen = firstRing.get(k);
      if (seen === undefined) {
        firstRing.set(k, ri);
        neighbours.set(k, pair);
      } else if (seen !== ri) {
        if (neighbours.get(k) !== pair) junctions.add(k);
        // A point seen in two rings with the same neighbours stays a candidate; a third ring may still differ.
      } else if (neighbours.get(k) !== pair) {
        // Repeated within the same ring (a pinch): ignore, but remember that the point is ambiguous for later rings.
        neighbours.set(k, '');
      }
    }
  });
  // A point shared by rings that all agree is not a junction; a point marked ambiguous ('') by a pinch becomes one
  // only if another ring also uses it.
  rings.forEach((ring, ri) => {
    const p = ring.pts;
    for (let i = 0; i < p.length / 2 - 1; i++) {
      const k = pointKey(p[2 * i]!, p[2 * i + 1]!);
      if (neighbours.get(k) === '' && firstRing.get(k) !== ri) junctions.add(k);
    }
  });

  const arcs: number[][] = [];
  const index = new Map<string, number>();
  const addArc = (pts: number[]): number => {
    const fwd = pts.join(',');
    const known = index.get(fwd);
    if (known !== undefined) return known;
    const rev: number[] = [];
    for (let i = pts.length - 2; i >= 0; i -= 2) rev.push(pts[i]!, pts[i + 1]!);
    const back = index.get(rev.join(','));
    if (back !== undefined) return ~back;
    arcs.push(pts);
    index.set(fwd, arcs.length - 1);
    return arcs.length - 1;
  };

  const out: TopoRing[] = [];
  for (const ring of rings) {
    const p = ring.pts;
    const n = p.length / 2 - 1;
    const cuts: number[] = [];
    for (let i = 0; i < n; i++) if (junctions.has(pointKey(p[2 * i]!, p[2 * i + 1]!))) cuts.push(i);
    if (cuts.length === 0) {
      // A ring without junctions is one closed arc; rotate it to its smallest point so identical rings match.
      let best = 0;
      for (let i = 1; i < n; i++) if (p[2 * i]! < p[2 * best]! || (p[2 * i] === p[2 * best] && p[2 * i + 1]! < p[2 * best + 1]!)) best = i;
      const rot: number[] = [];
      for (let i = 0; i <= n; i++) rot.push(p[2 * ((best + i) % n)]!, p[2 * ((best + i) % n) + 1]!);
      out.push({ owner: ring.owner, arcs: [addArc(rot)] });
      continue;
    }
    const refs: number[] = [];
    for (let c = 0; c < cuts.length; c++) {
      const from = cuts[c]!;
      const to = c + 1 < cuts.length ? cuts[c + 1]! : cuts[0]! + n;
      const seg: number[] = [];
      for (let i = from; i <= to; i++) seg.push(p[2 * (i % n)]!, p[2 * (i % n) + 1]!);
      refs.push(addArc(seg));
    }
    out.push({ owner: ring.owner, arcs: refs });
  }
  return { arcs, rings: out };
}

/** End points of a directed arc reference. */
function ends(arcs: readonly number[][], ref: number): [start: number, end: number] {
  const a = arcs[ref < 0 ? ~ref : ref]!;
  const s = pointKey(a[0]!, a[1]!);
  const e = pointKey(a[a.length - 2]!, a[a.length - 1]!);
  return ref < 0 ? [e, s] : [s, e];
}

/**
 * Merges the rings of each group: arcs used by two rings of the same group in opposite directions (internal
 * borders) are dropped, the remaining directed arcs are stitched into closed rings. `groupOf(owner)` returns the
 * group, or `null` to keep the owner's rings unchanged (e.g. overlays, which may coincide with a country).
 */
export function dissolve(topo: Topology, groupOf: (owner: number) => number | null): Topology {
  const kept: TopoRing[] = [];
  const byGroup = new Map<number, number[]>();
  for (const ring of topo.rings) {
    const g = groupOf(ring.owner);
    if (g === null) {
      kept.push(ring);
      continue;
    }
    const list = byGroup.get(g) ?? [];
    list.push(...ring.arcs);
    byGroup.set(g, list);
  }
  for (const [group, refs] of byGroup) {
    // Cancel opposite pairs (an internal border is used once in each direction).
    const fwd = new Map<number, number>();
    const rev = new Map<number, number>();
    const order: number[] = [];
    for (const r of refs) {
      const i = r < 0 ? ~r : r;
      if (!fwd.has(i) && !rev.has(i)) order.push(i);
      const m = r < 0 ? rev : fwd;
      m.set(i, (m.get(i) ?? 0) + 1);
      if (!(r < 0 ? fwd : rev).has(i)) (r < 0 ? fwd : rev).set(i, 0);
    }
    const directed: number[] = [];
    for (const i of order) {
      const f = fwd.get(i)!;
      const b = rev.get(i)!;
      const m = Math.min(f, b);
      for (let k = m; k < f; k++) directed.push(i);
      for (let k = m; k < b; k++) directed.push(~i);
    }
    // Stitch: follow arcs end to start until the ring closes.
    const starts = new Map<number, number[]>();
    directed.forEach((r, i) => {
      const [s] = ends(topo.arcs, r);
      const list = starts.get(s) ?? [];
      list.push(i);
      starts.set(s, list);
    });
    const used = new Array<boolean>(directed.length).fill(false);
    for (let i = 0; i < directed.length; i++) {
      if (used[i]) continue;
      const ring: number[] = [];
      const [start] = ends(topo.arcs, directed[i]!);
      let cur = i;
      for (let guard = 0; guard <= directed.length; guard++) {
        used[cur] = true;
        ring.push(directed[cur]!);
        const [, e] = ends(topo.arcs, directed[cur]!);
        if (e === start) break;
        const next = (starts.get(e) ?? []).find((j) => !used[j]);
        if (next === undefined) break; // open chain (should not happen for closed input): keep what we have
        cur = next;
      }
      kept.push({ owner: group, arcs: ring });
    }
  }
  return { arcs: topo.arcs, rings: kept };
}

/** The flat integer points of a ring (arcs concatenated, shared junction points once, closed). */
export function ringPoints(arcs: readonly number[][], ring: readonly number[]): number[] {
  const out: number[] = [];
  for (const ref of ring) {
    const a = arcs[ref < 0 ? ~ref : ref]!;
    const pts: number[] = [];
    if (ref < 0) for (let i = a.length - 2; i >= 0; i -= 2) pts.push(a[i]!, a[i + 1]!);
    else pts.push(...a);
    const skip = out.length ? 2 : 0;
    for (let i = skip; i < pts.length; i++) out.push(pts[i]!);
  }
  return out;
}

/** Which rings (by index) use each arc, with the direction: for arc i, a list of `[ringIndex, reversed]`. */
export function arcUsers(topo: Topology): [ring: number, reversed: boolean][][] {
  const users: [number, boolean][][] = topo.arcs.map(() => []);
  topo.rings.forEach((ring, ri) => {
    for (const ref of ring.arcs) users[ref < 0 ? ~ref : ref]!.push([ri, ref < 0]);
  });
  return users;
}
