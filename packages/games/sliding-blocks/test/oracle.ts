/**
 * Independent reference implementation for the tests. It deliberately shares no code with
 * `src/`: positions are plain 36-character board strings (row-major, `.` = free, `x` = star
 * block, other letters = blocks), and blocks are moved one cell at a time by rewriting the
 * string. A move (one block slid any distance) is every string reachable by repeating one
 * single-cell shift of the same letter in the same direction.
 */
const W = 6;

const cellsOfLetter = (grid: string, letter: string): number[] => {
  const cells: number[] = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === letter) cells.push(i);
  return cells;
};

const isHorizontal = (cells: readonly number[]): boolean => cells.length > 1 && cells[1] === (cells[0] as number) + 1;

/** One-cell shift of `letter` by `dir` (-1 = left/up, +1 = right/down), or `null` if blocked. */
function shiftOnce(grid: string, letter: string, dir: -1 | 1): string | null {
  const cells = cellsOfLetter(grid, letter);
  if (cells.length === 0) return null;
  const horizontal = isHorizontal(cells);
  const step = horizontal ? 1 : W;
  const lead = dir === 1 ? (cells[cells.length - 1] as number) + step : (cells[0] as number) - step;
  const tail = dir === 1 ? (cells[0] as number) : (cells[cells.length - 1] as number);
  if (horizontal) {
    const row = Math.floor((cells[0] as number) / W);
    if (lead < 0 || Math.floor(lead / W) !== row) return null;
  } else if (lead < 0 || lead >= W * W) {
    return null;
  }
  if (grid[lead] !== '.') return null;
  const chars = grid.split('');
  chars[lead] = letter;
  chars[tail] = '.';
  return chars.join('');
}

/** Slides `letter` by `delta` cells (positive = right/down), or `null` if any step is blocked. */
export function oracleSlide(grid: string, letter: string, delta: number): string | null {
  if (!Number.isInteger(delta) || delta === 0) return null;
  let current: string | null = grid;
  for (let i = 0; i < Math.abs(delta) && current; i++) current = shiftOnce(current, letter, delta > 0 ? 1 : -1);
  return current;
}

/** The star block occupies the last two cells of its row. */
export function oracleSolved(grid: string): boolean {
  const cells = cellsOfLetter(grid, 'x');
  return cells.length === 2 && (cells[1] as number) % W === W - 1 && cells[1] === (cells[0] as number) + 1;
}

/** All positions one move away. */
export function oracleNeighbours(grid: string): string[] {
  const letters = [...new Set(grid.replace(/\./g, ''))];
  const result: string[] = [];
  for (const letter of letters) {
    for (const dir of [-1, 1] as const) {
      for (let next = shiftOnce(grid, letter, dir); next; next = shiftOnce(next, letter, dir)) result.push(next);
    }
  }
  return result;
}

/** Fewest moves to free the star block (level-by-level BFS), or `null` if impossible. */
export function oracleSolve(grid: string): number | null {
  if (oracleSolved(grid)) return 0;
  const seen = new Set<string>([grid]);
  let frontier = [grid];
  for (let depth = 1; frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const position of frontier) {
      for (const neighbour of oracleNeighbours(position)) {
        if (seen.has(neighbour)) continue;
        if (oracleSolved(neighbour)) return depth;
        seen.add(neighbour);
        next.push(neighbour);
      }
    }
    frontier = next;
  }
  return null;
}

/** The board upside down. */
export const oracleFlip = (grid: string): string =>
  Array.from({ length: W }, (_, r) => grid.slice((W - 1 - r) * W, (W - r) * W)).join('');
