/**
 * Independent brute-force oracle for small boards. Shares no code with src/rules.ts:
 * it enumerates every placement of the mines over the covered cells, keeps those that
 * agree with all revealed numbers, and calls a cell forced when it has the same value
 * in all of them.
 */

export function oracleNeighbours(rows: number, cols: number, index: number): number[] {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const out: number[] = [];
  for (let rr = Math.max(0, r - 1); rr <= Math.min(rows - 1, r + 1); rr++) {
    for (let cc = Math.max(0, c - 1); cc <= Math.min(cols - 1, c + 1); cc++) {
      if (rr !== r || cc !== c) out.push(rr * cols + cc);
    }
  }
  return out;
}

export function oracleCount(rows: number, cols: number, mines: ReadonlySet<number>, index: number): number {
  return oracleNeighbours(rows, cols, index).filter((n) => mines.has(n)).length;
}

/** Breadth-first opening of `start`, expanding through cells with no adjacent mines. */
export function oracleFlood(rows: number, cols: number, mines: ReadonlySet<number>, start: number, alreadyOpen: ReadonlySet<number> = new Set()): Set<number> {
  const open = new Set<number>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const cell = queue.shift() as number;
    if (oracleCount(rows, cols, mines, cell) > 0) continue;
    for (const n of oracleNeighbours(rows, cols, cell)) {
      if (!open.has(n) && !alreadyOpen.has(n)) {
        open.add(n);
        queue.push(n);
      }
    }
  }
  return open;
}

/** Calls `visit` with every k-subset of `items`. */
function combinations(items: readonly number[], k: number, visit: (chosen: number[]) => void): void {
  const chosen: number[] = [];
  const rec = (start: number) => {
    if (chosen.length === k) {
      visit(chosen);
      return;
    }
    for (let i = start; i <= items.length - (k - chosen.length); i++) {
      chosen.push(items[i] as number);
      rec(i + 1);
      chosen.pop();
    }
  };
  rec(0);
}

export interface Forced {
  safe: Set<number>;
  mines: Set<number>;
  layouts: number;
}

/** Cells whose value is the same in every layout consistent with the revealed numbers. */
export function forcedCells(rows: number, cols: number, mineCount: number, revealed: ReadonlyMap<number, number>): Forced {
  const covered: number[] = [];
  for (let i = 0; i < rows * cols; i++) if (!revealed.has(i)) covered.push(i);
  const mineIn = new Map<number, number>(covered.map((c) => [c, 0]));
  let layouts = 0;
  combinations(covered, mineCount, (chosen) => {
    const set = new Set(chosen);
    for (const [cell, value] of revealed) if (oracleCount(rows, cols, set, cell) !== value) return;
    layouts++;
    for (const c of chosen) mineIn.set(c, (mineIn.get(c) as number) + 1);
  });
  const safe = new Set<number>();
  const mines = new Set<number>();
  for (const [cell, k] of mineIn) {
    if (k === 0) safe.add(cell);
    if (k === layouts) mines.add(cell);
  }
  return { safe, mines, layouts };
}

/** Revealed map (cell → number) for a set of open cells under the true layout. */
export function numbersOf(rows: number, cols: number, mines: ReadonlySet<number>, open: Iterable<number>): Map<number, number> {
  const map = new Map<number, number>();
  for (const cell of open) map.set(cell, oracleCount(rows, cols, mines, cell));
  return map;
}

/** Plays the board from `first` revealing only oracle-forced safe cells; true if it clears it. */
export function oracleSolvable(rows: number, cols: number, mineList: readonly number[], first: number): boolean {
  const mines = new Set(mineList);
  if (mines.has(first)) return false;
  const open = oracleFlood(rows, cols, mines, first);
  const safeTotal = rows * cols - mines.size;
  while (open.size < safeTotal) {
    const { safe } = forcedCells(rows, cols, mines.size, numbersOf(rows, cols, mines, open));
    if (safe.size === 0) return false;
    for (const cell of safe) for (const opened of oracleFlood(rows, cols, mines, cell, open)) open.add(opened);
  }
  return true;
}
