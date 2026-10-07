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
 * Enumerates solutions (as arrays of rows) up to `limit`. "Generate every line, then
 * intersect": each row is taken from the permutations that already match its left/right
 * clues and givens, and every column must stay a prefix of some permutation that matches
 * its top/bottom clues and givens (which also rules out repeats). Every complete grid is
 * re-checked from scratch by `satisfies`.
 */
export function oracleSolutions(n: number, clues: OracleClues, givens: readonly number[], limit = 2): number[][][] {
  const perms = allPermutations(n);
  const matches = (p: readonly number[], start: number | undefined, end: number | undefined, given: (i: number) => number) =>
    (!start || seenFromStart(p) === start) && (!end || seenFromStart(reversed(p)) === end) && p.every((h, i) => !given(i) || given(i) === h);
  const rowOptions = Array.from({ length: n }, (_, r) => perms.filter((p) => matches(p, clues.left[r], clues.right[r], (i) => givens[r * n + i] ?? 0)));
  const columnPrefixes = Array.from({ length: n }, (_, c) => {
    const prefixes = new Set<string>();
    for (const p of perms) {
      if (!matches(p, clues.top[c], clues.bottom[c], (i) => givens[i * n + c] ?? 0)) continue;
      for (let k = 1; k <= n; k++) prefixes.add(p.slice(0, k).join(''));
    }
    return prefixes;
  });
  const found: number[][][] = [];
  const rows: number[][] = [];
  const columns: string[] = new Array<string>(n).fill('');
  const search = () => {
    if (rows.length === n) {
      if (satisfies(rows, clues, givens)) found.push(rows.map((row) => [...row]));
      return;
    }
    for (const option of rowOptions[rows.length] as number[][]) {
      if (!option.every((h, c) => columnPrefixes[c]?.has(columns[c] + String(h)))) continue;
      const saved = [...columns];
      option.forEach((h, c) => (columns[c] += String(h)));
      rows.push(option);
      search();
      rows.pop();
      columns.splice(0, n, ...saved);
      if (found.length >= limit) return;
    }
  };
  search();
  return found;
}

export function oracleCount(n: number, clues: OracleClues, givens: readonly number[], limit = 2): number {
  return oracleSolutions(n, clues, givens, limit).length;
}
