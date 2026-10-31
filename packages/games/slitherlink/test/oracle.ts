/**
 * Independent oracle for Loop (Slitherlink), sharing no code with `src/rules.ts`.
 *
 * Edges are named by key (`h-r-c`: dot (r, c) → (r, c + 1); `v-r-c`: dot (r, c) → (r + 1, c)).
 * `countSolutions` is an exhaustive frontier search: edges are decided row by row (each row of
 * horizontal edges, then the vertical edges below it); a dot or cell is checked exactly once
 * all its edges are decided, open path ends are paired (`mate`) so a loop is only accepted when
 * it is the whole solution, and partial states with the same future are memoised. It never
 * guesses wrongly and never prunes a real solution, so its count is exact (up to `limit`).
 */

interface OEdge {
  key: string;
  a: number;
  b: number;
  cells: number[];
}

/** Edges in decision order. Dots are `r * (n + 1) + c`, cells `r * n + c`. */
export function oracleEdges(n: number): OEdge[] {
  const list: OEdge[] = [];
  const dot = (r: number, c: number) => r * (n + 1) + c;
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c < n; c++) {
      const cells: number[] = [];
      if (r > 0) cells.push((r - 1) * n + c);
      if (r < n) cells.push(r * n + c);
      list.push({ key: `h-${r}-${c}`, a: dot(r, c), b: dot(r, c + 1), cells });
    }
    if (r === n) break;
    for (let c = 0; c <= n; c++) {
      const cells: number[] = [];
      if (c > 0) cells.push(r * n + c - 1);
      if (c < n) cells.push(r * n + c);
      list.push({ key: `v-${r}-${c}`, a: dot(r, c), b: dot(r + 1, c), cells });
    }
  }
  return list;
}

/** True when the edges named in `lines` form one simple closed loop. */
export function oracleIsLoop(n: number, lines: ReadonlySet<string>): boolean {
  const edges = oracleEdges(n).filter((e) => lines.has(e.key));
  if (edges.length === 0 || edges.length !== lines.size) return false;
  const adjacent = new Map<number, number[]>();
  for (const { a, b } of edges) {
    adjacent.set(a, [...(adjacent.get(a) ?? []), b]);
    adjacent.set(b, [...(adjacent.get(b) ?? []), a]);
  }
  for (const list of adjacent.values()) if (list.length !== 2) return false;
  const first = edges[0] as OEdge;
  const seen = new Set<number>([first.a]);
  const stack = [first.a];
  while (stack.length > 0) {
    for (const next of adjacent.get(stack.pop() as number) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return seen.size === adjacent.size;
}

/** True when `lines` is one loop and every clue (−1 = none) counts its cell's line sides. */
export function oracleIsSolution(n: number, clues: readonly number[], lines: ReadonlySet<string>): boolean {
  if (!oracleIsLoop(n, lines)) return false;
  const count = new Array<number>(n * n).fill(0);
  for (const e of oracleEdges(n)) if (lines.has(e.key)) for (const cell of e.cells) count[cell] = (count[cell] as number) + 1;
  return clues.every((k, i) => k < 0 || count[i] === k);
}

/** Number of loops satisfying the clues, counting stops at `limit`. */
export function countSolutions(n: number, clues: readonly number[], limit = 2): number {
  const edges = oracleEdges(n);
  const total = edges.length;
  const dots = (n + 1) * (n + 1);
  const firstOfDot = new Array<number>(dots).fill(total);
  const lastOfDot = new Array<number>(dots).fill(-1);
  const lastOfCell = new Array<number>(n * n).fill(-1);
  const firstOfCell = new Array<number>(n * n).fill(total);
  const cellEdgeIdx: number[][] = Array.from({ length: n * n }, () => []);
  edges.forEach((e, k) => {
    for (const d of [e.a, e.b]) {
      firstOfDot[d] = Math.min(firstOfDot[d] as number, k);
      lastOfDot[d] = k;
    }
    for (const cell of e.cells) {
      firstOfCell[cell] = Math.min(firstOfCell[cell] as number, k);
      lastOfCell[cell] = k;
      cellEdgeIdx[cell]?.push(k);
    }
  });
  // Dots and clue cells that are partly decided before edge k.
  const frontierDots: number[][] = [];
  const frontierCells: number[][] = [];
  const doneDots: number[][] = edges.map(() => []);
  const doneCells: number[][] = edges.map(() => []);
  for (let k = 0; k <= total; k++) {
    const fd: number[] = [];
    for (let d = 0; d < dots; d++) if ((firstOfDot[d] as number) < k && (lastOfDot[d] as number) >= k) fd.push(d);
    frontierDots.push(fd);
    const fc: number[] = [];
    for (let c = 0; c < n * n; c++) if ((clues[c] as number) >= 0 && (firstOfCell[c] as number) < k && (lastOfCell[c] as number) >= k) fc.push(c);
    frontierCells.push(fc);
  }
  lastOfDot.forEach((k, d) => doneDots[k]?.push(d));
  lastOfCell.forEach((k, c) => doneCells[k]?.push(c));

  const deg = new Array<number>(dots).fill(0);
  const mate = new Array<number>(dots).fill(-1);
  const cnt = new Array<number>(n * n).fill(0);
  const memo = new Map<string, number>();

  /** Cells touched by edge k stay reachable; completed dots and cells are exact. */
  const consistent = (k: number): boolean => {
    for (const d of doneDots[k] as number[]) if (deg[d] === 1) return false;
    for (const c of doneCells[k] as number[]) if ((clues[c] as number) >= 0 && cnt[c] !== clues[c]) return false;
    for (const c of (edges[k] as OEdge).cells) {
      const k2 = clues[c] as number;
      if (k2 < 0) continue;
      const remaining = (cellEdgeIdx[c] as number[]).filter((j) => j > k).length;
      if ((cnt[c] as number) > k2 || (cnt[c] as number) + remaining < k2) return false;
    }
    return true;
  };

  /** A loop just closed: it must be all lines, and every clue must already be met. */
  const closedIsSolution = (): boolean => {
    for (let d = 0; d < dots; d++) if (deg[d] === 1) return false;
    return clues.every((k, c) => k < 0 || cnt[c] === k);
  };

  const go = (k: number): number => {
    if (k === total) return 0;
    const key = `${k}|${(frontierDots[k] as number[]).map((d) => `${deg[d]}.${mate[d]}`).join(',')}|${(frontierCells[k] as number[]).map((c) => cnt[c]).join(',')}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let found = 0;
    const { a, b, cells } = edges[k] as OEdge;

    // Not a line.
    if (consistent(k)) found += go(k + 1);

    // A line.
    if (found < limit && (deg[a] as number) < 2 && (deg[b] as number) < 2) {
      const savedMate = [...mate];
      const da = deg[a] as number;
      const db = deg[b] as number;
      let closes = false;
      if (da === 0 && db === 0) {
        mate[a] = b;
        mate[b] = a;
      } else if (da === 1 && db === 0) {
        const ma = mate[a] as number;
        mate[ma] = b;
        mate[b] = ma;
        mate[a] = -1;
      } else if (da === 0 && db === 1) {
        const mb = mate[b] as number;
        mate[mb] = a;
        mate[a] = mb;
        mate[b] = -1;
      } else if (mate[a] === b) {
        closes = true;
        mate[a] = -1;
        mate[b] = -1;
      } else {
        const ma = mate[a] as number;
        const mb = mate[b] as number;
        mate[ma] = mb;
        mate[mb] = ma;
        mate[a] = -1;
        mate[b] = -1;
      }
      deg[a] = da + 1;
      deg[b] = db + 1;
      for (const c of cells) cnt[c] = (cnt[c] as number) + 1;
      if (closes) {
        if (closedIsSolution()) found++;
      } else if (consistent(k)) {
        found += go(k + 1);
      }
      for (const c of cells) cnt[c] = (cnt[c] as number) - 1;
      deg[a] = da;
      deg[b] = db;
      for (let d = 0; d < dots; d++) mate[d] = savedMate[d] as number;
    }
    found = Math.min(found, limit);
    memo.set(key, found);
    return found;
  };
  return go(0);
}
