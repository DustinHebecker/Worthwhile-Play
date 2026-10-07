/**
 * Independent reference implementation for the tests. It shares no code with `src/rules.ts`:
 * it reads the level rows itself, traces every primary colour separately as a single "photon"
 * walk (instead of the game's combined colour-mask fixpoint), and counts solutions by search.
 *
 * Solutions are counted as *essential* placements: a set of placed pieces (any part of the
 * inventory) that solves the level and in which every placed piece receives light. A piece in a
 * dark square changes nothing, so it would only multiply the count without being a different idea.
 */

export type Grid = string[][];

const PRIMARIES = ['red', 'green', 'blue'] as const;
type Primary = (typeof PRIMARIES)[number];

/** Which primaries each colour letter contains. */
const CONTAINS: Readonly<Record<string, readonly Primary[]>> = {
  R: ['red'],
  G: ['green'],
  B: ['blue'],
  Y: ['red', 'green'],
  M: ['red', 'blue'],
  C: ['green', 'blue'],
  W: ['red', 'green', 'blue']
};

const HEADINGS: Readonly<Record<string, readonly [number, number]>> = { '^': [-1, 0], '>': [0, 1], v: [1, 0], '<': [0, -1] };

/** A set of primaries as the sorted letter it corresponds to ('' when empty). */
export function letterOf(primaries: ReadonlySet<Primary>): string {
  const has = (p: Primary) => primaries.has(p);
  for (const [letter, list] of Object.entries(CONTAINS)) {
    if (list.length === primaries.size && list.every(has)) return letter;
  }
  return '';
}

export function readGrid(rows: readonly string[]): Grid {
  return rows.map((row) => row.trim().split(/\s+/));
}

/** Primaries arriving at every square (light that enters it). */
export function oracleTrace(grid: Grid): Set<Primary>[][] {
  const h = grid.length;
  const w = grid[0]!.length;
  const arrived = grid.map((row) => row.map(() => new Set<Primary>()));
  for (const primary of PRIMARIES) {
    const visited = new Set<string>();
    const walkers: [number, number, number, number][] = [];
    grid.forEach((row, r) =>
      row.forEach((token, c) => {
        const heading = HEADINGS[token.charAt(0)];
        if (heading && token.length === 2 && CONTAINS[token.charAt(1)]?.includes(primary)) walkers.push([r, c, heading[0], heading[1]]);
      })
    );
    while (walkers.length > 0) {
      let [r, c, dr, dc] = walkers.shift()!;
      for (;;) {
        r += dr;
        c += dc;
        if (r < 0 || c < 0 || r >= h || c >= w) break;
        const key = `${r}:${c}:${dr}:${dc}`;
        if (visited.has(key)) break;
        visited.add(key);
        arrived[r]![c]!.add(primary);
        const token = grid[r]![c]!;
        if (token === '.') continue;
        if (token === '/' || token === 'S/') {
          if (token === 'S/') walkers.push([r, c, dr, dc]);
          [dr, dc] = [-dc, -dr];
          continue;
        }
        if (token === '\\' || token === 'S\\') {
          if (token === 'S\\') walkers.push([r, c, dr, dc]);
          [dr, dc] = [dc, dr];
          continue;
        }
        if (token.charAt(0) === 'F' && CONTAINS[token.charAt(1)]?.includes(primary)) continue;
        break; // blocker, target, sensor, laser, or a filter that stops this primary
      }
    }
  }
  return arrived;
}

export function oracleSolved(grid: Grid, arrived: Set<Primary>[][] = oracleTrace(grid)): boolean {
  let targets = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      const token = grid[r]![c]!;
      const got = letterOf(arrived[r]![c]!);
      if (token === 'X' && got !== '') return false;
      if (token.charAt(0) === 'T' && token.length === 2) {
        targets++;
        if (got !== token.charAt(1)) return false;
      }
    }
  }
  return targets > 0;
}

export interface Inventory {
  readonly mirror?: number;
  readonly splitter?: number;
  readonly blocker?: number;
}

/** Tokens a placed piece can take (each orientation is one token). */
const PIECE_TOKENS = { mirror: ['/', '\\'], splitter: ['S/', 'S\\'], blocker: ['#'] } as const;
type Kind = keyof typeof PIECE_TOKENS;
const KINDS = Object.keys(PIECE_TOKENS) as Kind[];

/** A placement as a canonical string: "r,c=token" entries sorted. */
type Placement = Map<string, string>;
const keyOf = (placement: Placement) => [...placement].map(([cell, token]) => `${cell}=${token}`).sort().join(' ');

function apply(grid: Grid, placement: Placement): Grid {
  const copy = grid.map((row) => [...row]);
  for (const [cell, token] of placement) {
    const [r, c] = cell.split(',').map(Number) as [number, number];
    copy[r]![c] = token;
  }
  return copy;
}

const kindOf = (token: string): Kind => (token === '#' ? 'blocker' : token.startsWith('S') ? 'splitter' : 'mirror');

function essential(grid: Grid, placement: Placement, arrived: Set<Primary>[][]): boolean {
  for (const cell of placement.keys()) {
    const [r, c] = cell.split(',').map(Number) as [number, number];
    if (arrived[r]![c]!.size === 0) return false;
  }
  return oracleSolved(grid, arrived);
}

/**
 * All essential solutions, found by searching placements one piece at a time where each new piece
 * goes on an empty square that currently receives light. (Every essential solution is reachable
 * this way: add its pieces in the order in which light first reaches them.)
 */
export function solveByLight(rows: readonly string[], inventory: Inventory): string[] {
  const grid = readGrid(rows);
  const found = new Set<string>();
  const explored = new Set<string>();
  const search = (placement: Placement) => {
    const key = keyOf(placement);
    if (explored.has(key)) return;
    explored.add(key);
    const board = apply(grid, placement);
    const arrived = oracleTrace(board);
    if (placement.size > 0 && essential(board, placement, arrived)) found.add(key);
    for (const kind of KINDS) {
      const used = [...placement.values()].filter((token) => kindOf(token) === kind).length;
      if (used >= (inventory[kind] ?? 0)) continue;
      board.forEach((row, r) =>
        row.forEach((token, c) => {
          if (token !== '.' || arrived[r]![c]!.size === 0) return;
          for (const piece of PIECE_TOKENS[kind]) search(new Map([...placement, [`${r},${c}`, piece]]));
        })
      );
    }
  };
  search(new Map());
  return [...found].sort();
}

/** All essential solutions by plain enumeration of every placement of every inventory subset (slow). */
export function solveExhaustively(rows: readonly string[], inventory: Inventory): string[] {
  const grid = readGrid(rows);
  const empties: string[] = [];
  grid.forEach((row, r) => row.forEach((token, c) => token === '.' && empties.push(`${r},${c}`)));
  const items = KINDS.flatMap((kind) => new Array<Kind>(inventory[kind] ?? 0).fill(kind));
  const found = new Set<string>();
  const place = (index: number, placement: Placement) => {
    if (index === items.length) {
      if (placement.size === 0) return;
      const board = apply(grid, placement);
      if (essential(board, placement, oracleTrace(board))) found.add(keyOf(placement));
      return;
    }
    place(index + 1, placement); // this item stays in the inventory
    for (const cell of empties) {
      if (placement.has(cell)) continue;
      for (const token of PIECE_TOKENS[items[index]!]) place(index + 1, new Map([...placement, [cell, token]]));
    }
  };
  place(0, new Map());
  return [...found].sort();
}

/** Turns an oracle solution string ("r,c=token ...") into placements. */
export function parseSolution(solution: string): { row: number; col: number; token: string }[] {
  return solution.split(' ').map((entry) => {
    const [cell = '', token = ''] = entry.split('=');
    const [row, col] = cell.split(',').map(Number) as [number, number];
    return { row, col, token };
  });
}
