/**
 * Data script only: Visvalingam–Whyatt simplification of one arc or line (design § 11.2). Points are integer lon/lat;
 * triangle areas are measured in the projected map (Equal Earth) in grid cells², so the threshold means the same
 * visual detail everywhere. The ends of an arc never move, no point is ever moved (the output is a subsequence of the
 * input), a closed arc keeps at least four points, and a point is never removed when that would make a segment longer
 * than `maxSpan` (so segments stay short enough for great-circle distance tests to follow the drawn line) or would
 * leave any original point further than `maxDeviation` cells from the simplified line (so the scoring tolerance of
 * design § 6.2 holds even for long, thin peninsulas whose triangles are small).
 */
import { project } from '../geo';

export interface SimplifyOptions {
  /** Minimum effective area (cells²) a point must have to survive. */
  readonly threshold: number;
  /** Projected units per grid cell (map width / grid size). */
  readonly cell: number;
  /** Integer units per degree of the input (e.g. 50). */
  readonly unit: number;
  /** Longest allowed segment in either coordinate, in input units. */
  readonly maxSpan: number;
  /** Largest allowed distance (cells) of any original point from the simplified line; default unlimited. */
  readonly maxDeviation?: number;
}

/** Simplifies flat integer points `[x0, y0, …]`; returns a new array (a subsequence of the input). */
export function simplify(pts: readonly number[], o: SimplifyOptions): number[] {
  const n = pts.length / 2;
  const closed = n >= 2 && pts[0] === pts[2 * n - 2] && pts[1] === pts[2 * n - 1];
  const minPoints = closed ? 4 : 2;
  if (n <= minPoints) return [...pts];
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [x, y] = project(pts[2 * i]! / o.unit, pts[2 * i + 1]! / o.unit);
    px[i] = x / o.cell;
    py[i] = y / o.cell;
  }
  const prev = new Int32Array(n);
  const next = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    prev[i] = i - 1;
    next[i] = i + 1;
  }
  const area = new Float64Array(n).fill(Infinity);
  const removed = new Uint8Array(n);
  const tooLong = (a: number, b: number) => Math.abs(pts[2 * a]! - pts[2 * b]!) > o.maxSpan || Math.abs(pts[2 * a + 1]! - pts[2 * b + 1]!) > o.maxSpan;
  const maxDev = o.maxDeviation ?? Infinity;
  /** Whether every original point strictly between a and b lies within maxDev of the segment a–b. */
  const close = (a: number, b: number) => {
    if (maxDev === Infinity) return true;
    const dx = px[b]! - px[a]!;
    const dy = py[b]! - py[a]!;
    const len2 = dx * dx + dy * dy;
    for (let k = a + 1; k < b; k++) {
      const t = len2 > 0 ? Math.max(0, Math.min(1, ((px[k]! - px[a]!) * dx + (py[k]! - py[a]!) * dy) / len2)) : 0;
      if (Math.hypot(px[k]! - px[a]! - t * dx, py[k]! - py[a]! - t * dy) > maxDev) return false;
    }
    return true;
  };
  const triangle = (i: number) => {
    const a = prev[i]!;
    const b = next[i]!;
    if (a < 0 || b >= n || tooLong(a, b) || !close(a, b)) return Infinity;
    return Math.abs((px[a]! - px[i]!) * (py[b]! - py[i]!) - (px[b]! - px[i]!) * (py[a]! - py[i]!)) / 2;
  };

  // Binary min-heap of [area, index, version] with lazy deletion.
  const version = new Int32Array(n);
  const heap: [number, number, number][] = [];
  const less = (a: [number, number, number], b: [number, number, number]) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const push = (item: [number, number, number]) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!less(heap[i]!, heap[p]!)) break;
      [heap[i], heap[p]] = [heap[p]!, heap[i]!];
      i = p;
    }
  };
  const pop = (): [number, number, number] | undefined => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length && last) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && less(heap[l]!, heap[m]!)) m = l;
        if (r < heap.length && less(heap[r]!, heap[m]!)) m = r;
        if (m === i) break;
        [heap[i], heap[m]] = [heap[m]!, heap[i]!];
        i = m;
      }
    }
    return top;
  };

  for (let i = 1; i < n - 1; i++) {
    area[i] = triangle(i);
    push([area[i]!, i, 0]);
  }
  let left = n;
  let floor = 0;
  for (;;) {
    const item = pop();
    if (!item) break;
    const [a, i, v] = item;
    if (removed[i] || v !== version[i]) continue;
    if (a >= o.threshold || a === Infinity || left <= minPoints) break;
    // Effective areas never decrease (standard VW): a neighbour inherits at least the removed point's area.
    floor = Math.max(floor, a);
    removed[i] = 1;
    left--;
    const p = prev[i]!;
    const q = next[i]!;
    next[p] = q;
    prev[q] = p;
    for (const j of [p, q]) {
      if (j <= 0 || j >= n - 1) continue;
      area[j] = Math.max(triangle(j), floor);
      version[j] = version[j]! + 1;
      push([area[j]!, j, version[j]!]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (!removed[i]) out.push(pts[2 * i]!, pts[2 * i + 1]!);
  return out;
}
