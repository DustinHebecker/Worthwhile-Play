/**
 * Independent reference implementation for the circuit checker. It deliberately shares
 * no code with `src/rules.ts`: it works on explicit (row, col) coordinates, literal bit
 * values, a fixed-point flood fill and a union-find cycle check.
 */

const UP = 1;
const RIGHT = 2;
const DOWN = 4;
const LEFT = 8;

interface Edge {
  a: number;
  b: number;
}

/** All matched connections between horizontally and vertically adjacent tiles. */
export function oracleEdges(masks: readonly number[], size: number): Edge[] {
  const edges: Edge[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const here = masks[r * size + c] ?? 0;
      if (c + 1 < size && here & RIGHT && (masks[r * size + c + 1] ?? 0) & LEFT) edges.push({ a: r * size + c, b: r * size + c + 1 });
      if (r + 1 < size && here & DOWN && (masks[(r + 1) * size + c] ?? 0) & UP) edges.push({ a: r * size + c, b: (r + 1) * size + c });
    }
  }
  return edges;
}

/** Powered tiles by repeated relaxation until nothing changes. */
export function oraclePowered(masks: readonly number[], size: number, source: number): boolean[] {
  const on = masks.map((_, i) => i === source);
  const edges = oracleEdges(masks, size);
  let changed = true;
  while (changed) {
    changed = false;
    for (const { a, b } of edges) {
      if (on[a] !== on[b]) {
        on[a] = true;
        on[b] = true;
        changed = true;
      }
    }
  }
  return on;
}

/** Number of wire stubs without a partner (off-board or unmatched). */
export function oracleLooseCount(masks: readonly number[], size: number): number {
  let stubs = 0;
  for (const m of masks) for (const bit of [UP, RIGHT, DOWN, LEFT]) if (m & bit) stubs++;
  return stubs - 2 * oracleEdges(masks, size).length;
}

export function oracleHasCycle(masks: readonly number[], size: number): boolean {
  const parent = masks.map((_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) x = parent[x] as number;
    return x;
  };
  for (const { a, b } of oracleEdges(masks, size)) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return true;
    parent[ra] = rb;
  }
  return false;
}

export function oracleSolved(masks: readonly number[], size: number, source: number): boolean {
  return oraclePowered(masks, size, source).every(Boolean) && oracleLooseCount(masks, size) === 0 && !oracleHasCycle(masks, size);
}

/** Clockwise quarter turn written as a lookup over the four sides. */
export function oracleTurn(mask: number): number {
  return (mask & UP ? RIGHT : 0) | (mask & RIGHT ? DOWN : 0) | (mask & DOWN ? LEFT : 0) | (mask & LEFT ? UP : 0);
}

/** Counts rotation assignments that complete the circuit (exhaustive; tiny boards only). */
export function oracleCountSolutions(masks: readonly number[], size: number, source: number): number {
  let count = 0;
  const current = [...masks];
  const visit = (i: number) => {
    if (i === current.length) {
      if (oracleSolved(current, size, source)) count++;
      return;
    }
    const seen = new Set<number>();
    let m = masks[i] as number;
    for (let k = 0; k < 4; k++) {
      if (!seen.has(m)) {
        seen.add(m);
        current[i] = m;
        visit(i + 1);
      }
      m = oracleTurn(m);
    }
    current[i] = masks[i] as number;
  };
  visit(0);
  return count;
}

/** Spanning tree from Kruskal over the given edge weights (independent of the game generator). */
export function oracleKruskalTree(size: number, weights: readonly number[]): number[] {
  const candidates: { a: number; b: number; bitA: number; bitB: number; w: number }[] = [];
  let k = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size) candidates.push({ a: r * size + c, b: r * size + c + 1, bitA: RIGHT, bitB: LEFT, w: weights[k++ % weights.length] ?? 0 });
      if (r + 1 < size) candidates.push({ a: r * size + c, b: (r + 1) * size + c, bitA: DOWN, bitB: UP, w: weights[k++ % weights.length] ?? 0 });
    }
  }
  candidates.sort((x, y) => x.w - y.w);
  const parent = Array.from({ length: size * size }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) x = parent[x] as number;
    return x;
  };
  const masks = new Array<number>(size * size).fill(0);
  for (const e of candidates) {
    const ra = find(e.a);
    const rb = find(e.b);
    if (ra === rb) continue;
    parent[ra] = rb;
    masks[e.a] = (masks[e.a] as number) | e.bitA;
    masks[e.b] = (masks[e.b] as number) | e.bitB;
  }
  return masks;
}
