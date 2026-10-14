/**
 * Independent reference implementation for the tests. It shares no code with `src/rules.ts`:
 * it reads the level rows itself, traces every primary colour separately as a single "photon"
 * walk (instead of the game's combined colour-mask fixpoint), and counts solutions by search
 * (`solveByLight`, `solveExhaustively`, and the much faster exact `solveByDecision` for the big
 * inventories of the later hard and the expert levels).
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
        if (token.startsWith('@')) {
          // Jump to the twin portal (scan the grid for the same token at another square).
          const twin = findTwin(grid, r, c);
          if (!twin) break;
          [r, c] = twin;
          arrived[r]![c]!.add(primary);
          continue;
        }
        if (token.startsWith('D')) {
          const heading = HEADINGS[token.charAt(1)]!;
          if (heading[0] === dr && heading[1] === dc) continue;
          break;
        }
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

/** The other portal of the same number; the first two in reading order form the pair, any further one has no twin. */
function findTwin(grid: Grid, row: number, col: number): [number, number] | undefined {
  const token = grid[row]![col]!;
  const same: [number, number][] = [];
  grid.forEach((cells, r) => cells.forEach((other, c) => other === token && same.push([r, c])));
  const pair = same.slice(0, 2);
  if (pair.length < 2) return undefined;
  if (pair[0]![0] === row && pair[0]![1] === col) return pair[1];
  if (pair[1]![0] === row && pair[1]![1] === col) return pair[0];
  return undefined;
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


export interface DecisionSearch {
  /** All essential solutions, canonical strings as in `solveByLight`. */
  readonly solutions: string[];
  /** Search-tree nodes visited: how many partial boards a careful, exact solver has to look at. */
  readonly nodes: number;
  /** False when the search stopped early (at `limit` solutions or `maxNodes` nodes). */
  readonly complete: boolean;
}

/* A compact numeric board for the decision search (still independent of the game's code). */
const OPEN = 0; // empty, or decided to stay empty
const UNDECIDED = 1; // an empty square whose fate is not decided yet: absorbs light meanwhile
const STOP = 2; // blocker, sensor, target, laser
const SLASH = 3;
const BACKSLASH = 4;
const HALF_SLASH = 5;
const HALF_BACKSLASH = 6;
const FILTER = 10; // 10 + the colour bits it lets through (red 1, green 2, blue 4)
const GATE = 20; // 20 + its travel direction (0 up, 1 right, 2 down, 3 left)
const PORTAL = 30; // its twin is in `twin`
const STEP_R = [-1, 0, 1, 0] as const;
const STEP_C = [0, 1, 0, -1] as const;
const TURN_SLASH = [1, 0, 3, 2] as const;
const TURN_BACKSLASH = [3, 2, 1, 0] as const;
const BITS: Readonly<Record<string, number>> = { R: 1, G: 2, B: 4, Y: 3, M: 5, C: 6, W: 7 };
const HEAD_DIR: Readonly<Record<string, number>> = { '^': 0, '>': 1, v: 2, '<': 3 };
const TOKEN_CODE: Readonly<Record<string, number>> = { '.': UNDECIDED, '/': SLASH, '\\': BACKSLASH, 'S/': HALF_SLASH, 'S\\': HALF_BACKSLASH };

/**
 * Exact solver for bigger inventories. Every empty square starts *undecided* and absorbs light
 * meanwhile, so the light traced on a partial board is light that reaches its square in every
 * completion of that board (deciding a square only ever opens new paths, so light only grows). The
 * search repeatedly takes the first undecided square (in reading order) that this "certain" light
 * reaches and branches on its fate: it stays empty, or gets one of the pieces still in the
 * inventory, in each orientation. A branch is cut as soon as certain light reaches a forbidden
 * sensor or brings a target a primary colour it must not have. When no undecided square receives
 * light, the board is complete (dark squares stay empty) and is checked.
 *
 * Every essential solution is found exactly once: when the search follows it, the first undecided
 * square on any of its light paths is reached by certain light, so all of its pieces get decided;
 * and the order of decisions is fixed by the board, so no solution is reached twice.
 * `limit` stops the search after that many solutions (e.g. 2 to test uniqueness), `maxNodes`
 * after that many nodes.
 */
export function solveByDecision(rows: readonly string[], inventory: Inventory, limit = Infinity, maxNodes = Infinity): DecisionSearch {
  const grid = readGrid(rows);
  const h = grid.length;
  const w = grid[0]!.length;
  const size = w * h;
  const code = new Int32Array(size);
  const twin = new Int32Array(size).fill(-1);
  /** Colour bits a target needs; 0 for a forbidden sensor; -1 for anything else. */
  const need = new Int32Array(size).fill(-1);
  const lasers: [number, number, number][] = [];
  const portals = new Map<string, number>();
  grid.flat().forEach((token, cell) => {
    const head = token.charAt(0);
    const tail = token.slice(1);
    if (token in TOKEN_CODE) code[cell] = TOKEN_CODE[token]!;
    else if (head === 'F') code[cell] = FILTER + BITS[tail]!;
    else if (head === 'D') code[cell] = GATE + HEAD_DIR[tail]!;
    else if (head === '@') {
      code[cell] = PORTAL;
      const other = portals.get(token);
      if (other === undefined) portals.set(token, cell);
      else if (twin[other] === -1) {
        twin[cell] = other;
        twin[other] = cell;
      }
    } else {
      code[cell] = STOP;
      if (token === 'X') need[cell] = 0;
      else if (head === 'T') need[cell] = BITS[tail]!;
      else if (head in HEAD_DIR) lasers.push([cell, HEAD_DIR[head]!, BITS[tail]!]);
    }
  });

  const arrived = new Int32Array(size);
  const visited = new Uint8Array(size * 4);
  const stack: number[] = [];
  const trace = () => {
    arrived.fill(0);
    for (let bit = 1; bit <= 4; bit <<= 1) {
      visited.fill(0);
      for (const [cell, dir, bits] of lasers) if (bits & bit) stack.push(cell * 4 + dir);
      while (stack.length > 0) {
        const item = stack.pop()!;
        let cell = item >> 2;
        let dir = item & 3;
        for (;;) {
          const r = Math.floor(cell / w) + STEP_R[dir as 0]!;
          const c = (cell % w) + STEP_C[dir as 0]!;
          if (r < 0 || c < 0 || r >= h || c >= w) break;
          cell = r * w + c;
          if (visited[cell * 4 + dir]) break;
          visited[cell * 4 + dir] = 1;
          arrived[cell]! |= bit;
          const k = code[cell]!;
          if (k === OPEN) continue;
          if (k >= SLASH && k <= HALF_BACKSLASH) {
            if (k >= HALF_SLASH) stack.push(cell * 4 + dir);
            dir = (k === SLASH || k === HALF_SLASH ? TURN_SLASH : TURN_BACKSLASH)[dir as 0];
            continue;
          }
          if (k > FILTER && k < GATE) {
            if ((k - FILTER) & bit) continue;
            break;
          }
          if (k >= GATE && k < PORTAL) {
            if (k - GATE === dir) continue;
            break;
          }
          if (k === PORTAL && twin[cell]! >= 0) {
            cell = twin[cell]!;
            arrived[cell]! |= bit;
            continue;
          }
          break;
        }
      }
    }
  };

  const pieceCodes: Record<Kind, readonly (readonly [number, string])[]> = {
    mirror: [[SLASH, '/'], [BACKSLASH, '\\']],
    splitter: [[HALF_SLASH, 'S/'], [HALF_BACKSLASH, 'S\\']],
    blocker: [[STOP, '#']]
  };
  const left: Record<Kind, number> = { mirror: inventory.mirror ?? 0, splitter: inventory.splitter ?? 0, blocker: inventory.blocker ?? 0 };
  const hasTarget = need.some((wanted) => wanted > 0);
  const placed = new Map<number, string>();
  const solutions = new Set<string>();
  let nodes = 0;
  let stopped = false;
  const search = () => {
    if (solutions.size >= limit || nodes >= maxNodes) {
      stopped = true;
      return;
    }
    nodes++;
    trace();
    let next = -1;
    let targetsOk = true;
    for (let cell = 0; cell < size; cell++) {
      const got = arrived[cell]!;
      const wanted = need[cell]!;
      if (wanted >= 0) {
        if (got & ~wanted) return; // light only grows, so this can never be undone
        if (got !== wanted) targetsOk = false;
      }
      if (next < 0 && code[cell] === UNDECIDED && got !== 0) next = cell;
    }
    if (next < 0) {
      if (targetsOk && hasTarget && placed.size > 0) {
        solutions.add([...placed].map(([cell, token]) => `${Math.floor(cell / w)},${cell % w}=${token}`).sort().join(' '));
      }
      return;
    }
    code[next] = OPEN;
    search();
    for (const kind of KINDS) {
      if (left[kind] === 0) continue;
      left[kind]--;
      for (const [pieceCode, token] of pieceCodes[kind]) {
        code[next] = pieceCode;
        placed.set(next, token);
        search();
        placed.delete(next);
      }
      left[kind]++;
    }
    code[next] = UNDECIDED;
  };
  search();
  return { solutions: [...solutions].sort(), nodes, complete: !stopped };
}
