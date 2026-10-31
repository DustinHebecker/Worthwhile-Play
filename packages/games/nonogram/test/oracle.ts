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

/**
 * All 0/1 lines of length n whose runs equal `clue`, built constructively (choose the gap
 * before each block). Same result as `allLinesFor` without enumerating all 2^n patterns, so
 * 15-cell lines stay cheap; the self-check tests compare both.
 */
export function placementsFor(clue: readonly number[], n: number): number[][] {
  const result: number[][] = [];
  const build = (prefix: number[], block: number): void => {
    if (block === clue.length) {
      result.push([...prefix, ...new Array<number>(n - prefix.length).fill(0)]);
      return;
    }
    const len = clue[block] as number;
    const rest = clue.slice(block + 1).reduce((sum, b) => sum + b + 1, 0);
    const minGap = block === 0 ? 0 : 1;
    for (let gap = minGap; prefix.length + gap + len + rest <= n; gap++) {
      build([...prefix, ...new Array<number>(gap).fill(0), ...new Array<number>(len).fill(1)], block + 1);
    }
  };
  build([], 0);
  return result;
}

/**
 * Backtracking count (capped at `limit`) over row placements with incremental column checks:
 * each column tracks how many of its blocks are finished and the length of the open run, and a
 * branch is cut as soon as a column overshoots a block or cannot fit its remaining blocks in the
 * rows left. Fast enough for 15×15.
 */
export function countSolutionsBacktracking(clues: PuzzleClues, limit = 2): number {
  const size = clues.rows.length;
  const options = clues.rows.map((clue) => placementsFor(clue, size));
  // Per column: index of the current block and length of the open run (0 = no open run).
  const blockAt = new Array<number>(size).fill(0);
  const runLen = new Array<number>(size).fill(0);
  /** Rows a column still needs from its current state (blocks plus separating gaps). */
  const needed = (clue: readonly number[], b: number, run: number): number => {
    let total = 0;
    for (let i = b; i < clue.length; i++) total += (clue[i] as number) + (i > b ? 1 : 0);
    // An open run already covers part of block b; any later block also needs the gap after it.
    return total - run;
  };
  let count = 0;
  const visit = (r: number): void => {
    if (count >= limit) return;
    if (r === size) {
      // Every column must have closed all its blocks (an open run must be exactly the last block).
      const complete = clues.cols.every((clue, c) => {
        const b = blockAt[c] as number;
        const run = runLen[c] as number;
        return run === 0 ? b === clue.length : b === clue.length - 1 && run === clue[b];
      });
      if (complete) count++;
      return;
    }
    const rowsLeft = size - r - 1;
    for (const row of options[r] ?? []) {
      const savedBlock = [...blockAt];
      const savedRun = [...runLen];
      let ok = true;
      for (let c = 0; c < size && ok; c++) {
        const clue = clues.cols[c] as readonly number[];
        let b = blockAt[c] as number;
        let run = runLen[c] as number;
        if (row[c] === 1) {
          run++;
          if (b >= clue.length || run > (clue[b] as number)) ok = false;
        } else if (run > 0) {
          if (run !== clue[b]) ok = false;
          b++;
          run = 0;
        }
        if (ok && needed(clue, b, run) > rowsLeft) ok = false;
        blockAt[c] = b;
        runLen[c] = run;
      }
      if (ok) visit(r + 1);
      blockAt.splice(0, size, ...savedBlock);
      runLen.splice(0, size, ...savedRun);
    }
  };
  visit(0);
  return count;
}
