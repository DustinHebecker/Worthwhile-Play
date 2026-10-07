/**
 * Independent test oracle for Nonogram puzzles. Deliberately shares no code with
 * `src/rules.ts`: clues come from string splitting, line deduction from brute-force
 * enumeration, and solution counting from row-pattern enumeration / backtracking.
 */

/** Runs of '1' in a 0/1 line, computed by string splitting. */
export function runsOf(line: readonly number[]): number[] {
  return line
    .map((v) => (v === 1 ? '1' : '0'))
    .join('')
    .split('0')
    .filter((part) => part.length > 0)
    .map((part) => part.length);
}

const same = (a: readonly number[], b: readonly number[]) => JSON.stringify(a) === JSON.stringify(b);

/** All 0/1 lines of length n whose runs equal `clue` (enumerates all 2^n bit patterns). */
export function allLinesFor(clue: readonly number[], n: number): number[][] {
  const result: number[][] = [];
  for (let bits = 0; bits < 1 << n; bits++) {
    const line = Array.from({ length: n }, (_, i) => (bits >> i) & 1);
    if (same(runsOf(line), clue)) result.push(line);
  }
  return result;
}

/**
 * Brute-force single-line deduction: intersection of all placements of `clue` that agree
 * with the known cells (-1 unknown). `null` when none agree.
 */
export function bruteSolveLine(clue: readonly number[], known: readonly number[]): number[] | null {
  const n = known.length;
  const fits = allLinesFor(clue, n).filter((line) => line.every((v, i) => known[i] === -1 || known[i] === v));
  if (fits.length === 0) return null;
  return known.map((_, i) => (fits.every((line) => line[i] === fits[0]?.[i]) ? (fits[0]?.[i] as number) : -1));
}

export interface PuzzleClues {
  rows: readonly (readonly number[])[];
  cols: readonly (readonly number[])[];
}

export function cluesFromGrid(grid: readonly number[], size: number): PuzzleClues {
  const rows: number[][] = [];
  const cols: number[][] = [];
  for (let i = 0; i < size; i++) {
    rows.push(runsOf(grid.slice(i * size, (i + 1) * size)));
    cols.push(runsOf(Array.from({ length: size }, (_, r) => grid[r * size + i] as number)));
  }
  return { rows, cols };
}

/**
 * Exhaustive count (capped at `limit`) of grids matching the clues: every combination of
 * row patterns is checked against all column clues. Only feasible for small boards (5×5).
 */
export function countSolutionsExhaustive(clues: PuzzleClues, limit = 2): number {
  const size = clues.rows.length;
  const options = clues.rows.map((clue) => allLinesFor(clue, size));
  let count = 0;
  const chosen: number[][] = [];
  const visit = (r: number): void => {
    if (count >= limit) return;
    if (r === size) {
      const ok = clues.cols.every((clue, c) => same(runsOf(chosen.map((row) => row[c] as number)), clue));
      if (ok) count++;
      return;
    }
    for (const row of options[r] ?? []) {
      chosen.push(row);
      visit(r + 1);
      chosen.pop();
    }
  };
  visit(0);
  return count;
}

/** Whether a column prefix (top rows only) can still be extended to match `clue` within `size` rows. */
function prefixFeasible(prefix: readonly number[], clue: readonly number[], size: number): boolean {
  const runs = runsOf(prefix);
  const open = prefix.length > 0 && prefix[prefix.length - 1] === 1;
  const closed = open ? runs.slice(0, -1) : runs;
  if (closed.length > clue.length) return false;
  for (let i = 0; i < closed.length; i++) if (closed[i] !== clue[i]) return false;
  let remainingBlocks: number[];
  let rowsLeft = size - prefix.length;
  if (open) {
    const current = runs[runs.length - 1] as number;
    const target = clue[closed.length];
    if (target === undefined || current > target) return false;
    rowsLeft -= target - current;
    if (rowsLeft < 0) return false;
    remainingBlocks = clue.slice(closed.length + 1);
    if (remainingBlocks.length > 0) rowsLeft -= 1; // gap after the open run
  } else {
    remainingBlocks = clue.slice(closed.length);
  }
  const needed = remainingBlocks.reduce((sum, b) => sum + b, 0) + Math.max(0, remainingBlocks.length - 1);
  return needed <= rowsLeft;
}

/** Backtracking count (capped at `limit`) with column-prefix pruning; fine for 10×10. */
export function countSolutionsBacktracking(clues: PuzzleClues, limit = 2): number {
  const size = clues.rows.length;
  const options = clues.rows.map((clue) => allLinesFor(clue, size));
  let count = 0;
  const chosen: number[][] = [];
  const visit = (r: number): void => {
    if (count >= limit) return;
    if (r === size) {
      count++;
      return;
    }
    for (const row of options[r] ?? []) {
      chosen.push(row);
      const ok = clues.cols.every((clue, c) => {
        const prefix = chosen.map((line) => line[c] as number);
        return r === size - 1 ? same(runsOf(prefix), clue) : prefixFeasible(prefix, clue, size);
      });
      if (ok) visit(r + 1);
      chosen.pop();
    }
  };
  visit(0);
  return count;
}
