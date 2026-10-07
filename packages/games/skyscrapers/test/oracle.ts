/**
 * Independent brute-force oracle for Skyscrapers. Shares no code with `src/rules.ts`:
 * it enumerates complete rows (all permutations) and backtracks row by row, checking the
 * column rule and clues directly. Slow but obviously correct; used only in tests.
 */

export interface OracleClues {
  top: readonly number[];
  bottom: readonly number[];
  left: readonly number[];
  right: readonly number[];
}

/** Buildings visible from the start: those taller than every building before them. */
export function seenFromStart(line: readonly number[]): number {
  return line.filter((height, i) => line.slice(0, i).every((before) => before < height)).length;
}

/** All permutations of 1..n in lexicographic order (iterative next-permutation). */
export function allPermutations(n: number): number[][] {
  const p = Array.from({ length: n }, (_, i) => i + 1);
  const out: number[][] = [];
  for (;;) {
    out.push([...p]);
    let i = n - 2;
    while (i >= 0 && (p[i] as number) > (p[i + 1] as number)) i--;
    if (i < 0) return out;
    let j = n - 1;
    while ((p[j] as number) < (p[i] as number)) j--;
    [p[i], p[j]] = [p[j] as number, p[i] as number];
    for (let a = i + 1, b = n - 1; a < b; a++, b--) [p[a], p[b]] = [p[b] as number, p[a] as number];
  }
}

const reversed = (line: readonly number[]) => line.slice().reverse();

/** True when `grid` (array of rows) satisfies the Latin rule, every non-zero clue and every given. */
export function satisfies(grid: readonly (readonly number[])[], clues: OracleClues, givens: readonly number[]): boolean {
  const n = grid.length;
  const rows = grid;
  const cols = Array.from({ length: n }, (_, c) => rows.map((row) => row[c] as number));
  const isPerm = (line: readonly number[]) => [...line].sort((a, b) => a - b).join() === Array.from({ length: n }, (_, i) => i + 1).join();
  const clueOk = (clue: number | undefined, line: readonly number[]) => !clue || seenFromStart(line) === clue;
  for (let k = 0; k < n; k++) {
    const row = rows[k] as number[];
    const col = cols[k] as number[];
    if (!isPerm(row) || !isPerm(col)) return false;
    if (!clueOk(clues.left[k], row) || !clueOk(clues.right[k], reversed(row))) return false;
    if (!clueOk(clues.top[k], col) || !clueOk(clues.bottom[k], reversed(col))) return false;
  }
  return givens.every((g, i) => g === 0 || rows[Math.floor(i / n)]?.[i % n] === g);
}

/**
 * Enumerates solutions (as arrays of rows) up to `limit`. Rows are taken from the permutations
 * that already match their left/right clues and givens; columns are checked for repeats and
 * for the top clue (a partial column may never show more buildings than the clue, and must
 * still be able to reach it), the full check runs on every complete grid.
 */
export function oracleSolutions(n: number, clues: OracleClues, givens: readonly number[], limit = 2): number[][][] {
  const perms = allPermutations(n);
  const rowOptions = Array.from({ length: n }, (_, r) =>
    perms.filter(
      (p) =>
        (!clues.left[r] || seenFromStart(p) === clues.left[r]) &&
        (!clues.right[r] || seenFromStart(reversed(p)) === clues.right[r]) &&
        p.every((h, c) => !givens[r * n + c] || givens[r * n + c] === h)
    )
  );
  const found: number[][][] = [];
  const rows: number[][] = [];
  const columnOk = (c: number): boolean => {
    const col = rows.map((row) => row[c] as number);
    if (new Set(col).size !== col.length) return false;
    const top = clues.top[c];
    if (!top) return true;
    const seen = seenFromStart(col);
    const tallest = Math.max(...col);
    const left = n - col.length;
    // Heights that could still appear above the current tallest building.
    const higher = Array.from({ length: n - tallest }, (_, i) => tallest + 1 + i).filter((h) => !col.includes(h)).length;
    return seen <= top && seen + Math.min(left, higher) >= top;
  };
  const search = () => {
    if (found.length >= limit) return;
    if (rows.length === n) {
      if (satisfies(rows, clues, givens)) found.push(rows.map((row) => [...row]));
      return;
    }
    for (const option of rowOptions[rows.length] as number[][]) {
      rows.push(option);
      if (option.every((_, c) => columnOk(c))) search();
      rows.pop();
      if (found.length >= limit) return;
    }
  };
  search();
  return found;
}

export function oracleCount(n: number, clues: OracleClues, givens: readonly number[], limit = 2): number {
  return oracleSolutions(n, clues, givens, limit).length;
}
