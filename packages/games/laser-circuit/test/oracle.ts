/**
 * Independent reference implementation for the tests. It shares no code with `src/rules.ts`:
 * it reads the level rows itself, traces every primary colour separately as single "photon"
 * walks (instead of the game's combined colour-mask fixpoint), and counts solutions by search
 * (`solveByLight`, `solveExhaustively`, and the much faster exact `solveByDecision` for the big
 * inventories of the later levels).
 *
 * Optics (the same physics as the game, written down independently): a photon walk carries a
 * polarisation (null = unpolarised, else the angle in degrees) and an intensity (a fraction of
 * a laser's). A polariser at θ lets through cos²(θ − φ) of light polarised at φ (computed with
 * `Math.cos` and rounded to quarters, exact for 45° steps) and ½ of unpolarised light; a
 * neutral-density filter and each output of a splitter carry ½. Intensities are not halved below
 * 1/64. A target's intensity is the sum, per colour component, over the distinct photon states
 * (direction, polarisation, intensity) that reach it.
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
/** Faintest intensity tracked; fainter light stays at this value. */
const FAINTEST = 1 / 64;

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

/** A target token's requirements, or undefined for any other token. */
export function readTarget(token: string): { letter: string; intensity?: number; angle?: number } | undefined {
  const match = /^T([RGBYMCW])(?:(\d+))?(?::(\d+))?$/.exec(token);
  if (!match) return undefined;
  return {
    letter: match[1]!,
    ...(match[2] === undefined ? {} : { intensity: 1 / Number(match[2]) }),
    ...(match[3] === undefined ? {} : { angle: Number(match[3]) })
  };
}

/** Light reaching one square: which primaries, and every distinct photon state per primary. */
export interface OracleCell {
  readonly primaries: Set<Primary>;
  /** Per primary: photon states "dr,dc|polarisation|intensity" that entered the square. */
  readonly photons: Map<Primary, Set<string>>;
}

/** Fraction of light a polariser at `angle` lets through (Malus's law), for unpolarised light (`null`) ½. */
export function malus(polarisation: number | null, angle: number): number {
  if (polarisation === null) return 0.5;
  return Math.round(Math.cos(((angle - polarisation) * Math.PI) / 180) ** 2 * 4) / 4;
}

/** Light arriving at every square, with polarisation and intensity. */
export function oracleLight(grid: Grid): OracleCell[][] {
  const h = grid.length;
  const w = grid[0]!.length;
  const cells: OracleCell[][] = grid.map((row) => row.map(() => ({ primaries: new Set<Primary>(), photons: new Map<Primary, Set<string>>() })));
  const arrive = (r: number, c: number, primary: Primary, state: string) => {
    const cell = cells[r]![c]!;
    cell.primaries.add(primary);
    let set = cell.photons.get(primary);
    if (!set) cell.photons.set(primary, (set = new Set()));
    set.add(state);
  };
  for (const primary of PRIMARIES) {
    const visited = new Set<string>();
    type Walker = [number, number, number, number, number | null, number];
    const walkers: Walker[] = [];
    grid.forEach((row, r) =>
      row.forEach((token, c) => {
        const heading = HEADINGS[token.charAt(0)];
        if (heading && token.length === 2 && CONTAINS[token.charAt(1)]?.includes(primary)) walkers.push([r, c, heading[0], heading[1], null, 1]);
      })
    );
    while (walkers.length > 0) {
      let [r, c, dr, dc, pol, intensity] = walkers.shift()!;
      for (;;) {
        r += dr;
        c += dc;
        if (r < 0 || c < 0 || r >= h || c >= w) break;
        const state = `${dr},${dc}|${pol ?? 'u'}|${intensity}`;
        const key = `${r}:${c}:${state}`;
        if (visited.has(key)) break;
        visited.add(key);
        arrive(r, c, primary, state);
        const token = grid[r]![c]!;
        if (token === '.') continue;
        if (token.startsWith('@')) {
          // Jump to the twin portal (scan the grid for the same token at another square).
          const twin = findTwin(grid, r, c);
          if (!twin) break;
          [r, c] = twin;
          arrive(r, c, primary, state);
          continue;
        }
        if (token.startsWith('D')) {
          const heading = HEADINGS[token.charAt(1)]!;
          if (heading[0] === dr && heading[1] === dc) continue;
          break;
        }
        if (token === '/' || token === 'S/' || token === '\\' || token === 'S\\') {
          if (token.startsWith('S')) {
            intensity = Math.max(FAINTEST, intensity / 2);
            walkers.push([r, c, dr, dc, pol, intensity]);
          }
          [dr, dc] = token.endsWith('/') ? [-dc, -dr] : [dc, dr];
          continue;
        }
        if (token === 'N') {
          intensity = Math.max(FAINTEST, intensity / 2);
          continue;
        }
        if (/^P\d+$/.test(token)) {
          const angle = Number(token.slice(1));
          const factor = malus(pol, angle);
          if (factor === 0) break;
          pol = angle;
          intensity = Math.max(FAINTEST, intensity * factor);
          continue;
        }
        if (token.charAt(0) === 'F' && CONTAINS[token.charAt(1)]?.includes(primary)) continue;
        if (token.charAt(0) === '-' && !CONTAINS[token.charAt(1)]?.includes(primary)) continue;
        break; // blocker, target, sensor, laser, or a filter that stops this primary
      }
    }
  }
  return cells;
}

/** Primaries arriving at every square (light that enters it). */
export function oracleTrace(grid: Grid): Set<Primary>[][] {
  return oracleLight(grid).map((row) => row.map((cell) => cell.primaries));
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

/** Whether a target token is satisfied by the light reaching its square. */
export function oracleTargetOk(token: string, cell: OracleCell): boolean {
  const target = readTarget(token);
  if (!target || letterOf(cell.primaries) !== target.letter) return false;
  for (const primary of CONTAINS[target.letter]!) {
    const states = [...(cell.photons.get(primary) ?? [])];
    if (target.intensity !== undefined && states.reduce((sum, state) => sum + Number(state.split('|')[2]), 0) !== target.intensity) return false;
    if (target.angle !== undefined && states.some((state) => state.split('|')[1] !== String(target.angle))) return false;
  }
  return true;
}

export function oracleSolved(grid: Grid, light: OracleCell[][] = oracleLight(grid)): boolean {
  let targets = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      const token = grid[r]![c]!;
      if (token === 'X' && light[r]![c]!.primaries.size > 0) return false;
      if (readTarget(token)) {
        targets++;
        if (!oracleTargetOk(token, light[r]![c]!)) return false;
      }
    }
  }
  return targets > 0;
}

/** Tokens a placed piece can take (each orientation is one token). */
export const PIECE_TOKENS = {
  mirror: ['/', '\\'],
  splitter: ['S/', 'S\\'],
  blocker: ['#'],
  polariser: ['P0', 'P45', 'P90', 'P135'],
  neutral: ['N'],
  filterR: ['FR'],
  filterG: ['FG'],
  filterB: ['FB'],
  minusR: ['-R'],
  minusG: ['-G'],
  minusB: ['-B']
} as const;
export type Kind = keyof typeof PIECE_TOKENS;
const KINDS = Object.keys(PIECE_TOKENS) as Kind[];
export type Inventory = { readonly [K in Kind]?: number };

/** The piece kind a placed token belongs to. */
export const kindOfToken = (token: string): Kind => KINDS.find((kind) => (PIECE_TOKENS[kind] as readonly string[]).includes(token))!;

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

function essential(grid: Grid, placement: Placement, light: OracleCell[][]): boolean {
  for (const cell of placement.keys()) {
    const [r, c] = cell.split(',').map(Number) as [number, number];
    if (light[r]![c]!.primaries.size === 0) return false;
  }
  return oracleSolved(grid, light);
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
    const light = oracleLight(board);
    if (placement.size > 0 && essential(board, placement, light)) found.add(key);
    for (const kind of KINDS) {
      const used = [...placement.values()].filter((token) => kindOfToken(token) === kind).length;
      if (used >= (inventory[kind] ?? 0)) continue;
      board.forEach((row, r) =>
        row.forEach((token, c) => {
          if (token !== '.' || light[r]![c]!.primaries.size === 0) return;
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
      if (essential(board, placement, oracleLight(board))) found.add(keyOf(placement));
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
const NEUTRAL = 7;
const FILTER = 10; // 10 + the colour bits it lets through (red 1, green 2, blue 4)
const GATE = 20; // 20 + its travel direction (0 up, 1 right, 2 down, 3 left)
const PORTAL = 30; // its twin is in `twin`
const POLARISER = 40; // 40 + angle / 45
const ABSORB = 50; // 50 + the colour bits it absorbs
const STEP_R = [-1, 0, 1, 0] as const;
const STEP_C = [0, 1, 0, -1] as const;
const TURN_SLASH = [1, 0, 3, 2] as const;
const TURN_BACKSLASH = [3, 2, 1, 0] as const;
const BITS: Readonly<Record<string, number>> = { R: 1, G: 2, B: 4, Y: 3, M: 5, C: 6, W: 7 };
const HEAD_DIR: Readonly<Record<string, number>> = { '^': 0, '>': 1, v: 2, '<': 3 };
const TOKEN_CODE: Readonly<Record<string, number>> = { '.': UNDECIDED, '/': SLASH, '\\': BACKSLASH, 'S/': HALF_SLASH, 'S\\': HALF_BACKSLASH, N: NEUTRAL };
/** Halving steps of intensity tracked (0 = full … 6 = 1/64 or fainter). */
const STEPS = 7;

/** The numeric code of a token (pieces included). */
function codeOf(token: string): number {
  if (token in TOKEN_CODE) return TOKEN_CODE[token]!;
  const head = token.charAt(0);
  const tail = token.slice(1);
  if (head === 'F') return FILTER + BITS[tail]!;
  if (head === '-') return ABSORB + BITS[tail]!;
  if (head === 'D') return GATE + HEAD_DIR[tail]!;
  if (head === '@') return PORTAL;
  if (/^P\d+$/.test(token)) return POLARISER + Number(tail) / 45;
  return STOP;
}

/**
 * Exact solver for bigger inventories. Every empty square starts *undecided* and absorbs light
 * meanwhile, so the light traced on a partial board is light that reaches its square in every
 * completion of that board (deciding a square only ever opens new paths, so light only grows). The
 * search repeatedly takes the first undecided square (in reading order) that this "certain" light
 * reaches and branches on its fate: it stays empty, or gets one of the pieces still in the
 * inventory, in each orientation. A branch is cut as soon as certain light reaches a forbidden
 * sensor, brings a target a primary colour it must not have, more intensity than it needs, or
 * light of a polarisation it must not get (all of these only grow). When no undecided square
 * receives light, the board is complete (dark squares stay empty) and is checked.
 *
 * Polarisation is only tracked when the level has polarisers or a target that needs one, and
 * intensity only when a target needs one (otherwise they cannot change the outcome).
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
  /** Intensity a target needs per colour component, in 64ths (-1: any). */
  const needIntensity = new Int32Array(size).fill(-1);
  /** Polarisation a target needs (1 + angle / 45; -1: any). */
  const needPol = new Int32Array(size).fill(-1);
  const lasers: [number, number, number][] = [];
  const portals = new Map<string, number>();
  grid.flat().forEach((token, cell) => {
    code[cell] = codeOf(token);
    const head = token.charAt(0);
    if (head === '@') {
      const other = portals.get(token);
      if (other === undefined) portals.set(token, cell);
      else if (twin[other] === -1) {
        twin[cell] = other;
        twin[other] = cell;
      }
    } else if (code[cell] === STOP) {
      const target = readTarget(token);
      if (token === 'X') need[cell] = 0;
      else if (target) {
        need[cell] = BITS[target.letter]!;
        if (target.intensity !== undefined) needIntensity[cell] = target.intensity * 64;
        if (target.angle !== undefined) needPol[cell] = 1 + target.angle / 45;
      } else if (head in HEAD_DIR) lasers.push([cell, HEAD_DIR[head]!, BITS[token.slice(1)]!]);
    }
  });
  const kinds = KINDS.filter((kind) => (inventory[kind] ?? 0) > 0);
  const trackPol = needPol.some((p) => p >= 0) || code.some((k) => k >= POLARISER && k < ABSORB) || (inventory.polariser ?? 0) > 0;
  const trackIntensity = needIntensity.some((i) => i >= 0);

  const arrived = new Int32Array(size);
  /** Per target and colour bit (index cell * 3 + bit index): received intensity in 64ths. */
  const received = new Int32Array(size * 3);
  const wrongPol = new Uint8Array(size);
  const visited = new Uint32Array(size * 4 * 5 * STEPS);
  let stamp = 0;
  const stack: number[] = [];
  /** Packs a photon state: ((cell * 4 + dir) * 5 + pol) * STEPS + step. */
  const pack = (cell: number, dir: number, pol: number, step: number) => ((cell * 4 + dir) * 5 + pol) * STEPS + step;
  const trace = () => {
    arrived.fill(0);
    received.fill(0);
    wrongPol.fill(0);
    for (let bitIndex = 0; bitIndex < 3; bitIndex++) {
      const bit = 1 << bitIndex;
      stamp++;
      for (const [cell, dir, bits] of lasers) if (bits & bit) stack.push(pack(cell, dir, 0, 0));
      while (stack.length > 0) {
        let state = stack.pop()!;
        let step = state % STEPS;
        state = (state - step) / STEPS;
        let pol = state % 5;
        state = (state - pol) / 5;
        let dir = state & 3;
        let cell = state >> 2;
        for (;;) {
          const r = Math.floor(cell / w) + STEP_R[dir as 0]!;
          const c = (cell % w) + STEP_C[dir as 0]!;
          if (r < 0 || c < 0 || r >= h || c >= w) break;
          cell = r * w + c;
          const key = pack(cell, dir, pol, step);
          if (visited[key] === stamp) break;
          visited[key] = stamp;
          arrived[cell]! |= bit;
          const k = code[cell]!;
          if (k === OPEN) continue;
          if (k === STOP) {
            if (need[cell]! > 0) {
              received[cell * 3 + bitIndex]! += 64 >> step;
              if (needPol[cell]! >= 0 && pol !== needPol[cell]) wrongPol[cell] = 1;
            }
            break;
          }
          if (k >= SLASH && k <= HALF_BACKSLASH) {
            if (k >= HALF_SLASH) {
              if (trackIntensity && step < STEPS - 1) step++;
              stack.push(pack(cell, dir, pol, step));
            }
            dir = (k === SLASH || k === HALF_SLASH ? TURN_SLASH : TURN_BACKSLASH)[dir as 0];
            continue;
          }
          if (k === NEUTRAL) {
            if (trackIntensity && step < STEPS - 1) step++;
            continue;
          }
          if (k > FILTER && k < GATE) {
            if ((k - FILTER) & bit) continue;
            break;
          }
          if (k > ABSORB) {
            if ((k - ABSORB) & bit) break;
            continue;
          }
          if (k >= POLARISER && k < ABSORB) {
            const angle = k - POLARISER;
            const factor = pol === 0 ? 0.5 : (pol - 1 - angle + 4) % 4 === 2 ? 0 : (pol - 1 - angle + 4) % 4 === 0 ? 1 : 0.5;
            if (factor === 0) break;
            if (factor === 0.5 && trackIntensity && step < STEPS - 1) step++;
            if (trackPol) pol = angle + 1;
            continue;
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

  const left: Record<string, number> = Object.fromEntries(kinds.map((kind) => [kind, inventory[kind] ?? 0]));
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
        if (wrongPol[cell]) return;
        const intensity = needIntensity[cell]!;
        if (intensity >= 0) {
          for (let bitIndex = 0; bitIndex < 3; bitIndex++) {
            if (!(wanted & (1 << bitIndex))) continue;
            const value = received[cell * 3 + bitIndex]!;
            if (value > intensity) return;
            if (value !== intensity) targetsOk = false;
          }
        }
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
    for (const kind of kinds) {
      if (left[kind] === 0) continue;
      left[kind]!--;
      for (const token of PIECE_TOKENS[kind]) {
        code[next] = codeOf(token);
        placed.set(next, token);
        search();
        placed.delete(next);
      }
      left[kind]!++;
    }
    code[next] = UNDECIDED;
  };
  search();
  return { solutions: [...solutions].sort(), nodes, complete: !stopped };
}
