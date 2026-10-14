import { createRng, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Pure, DOM-free rules for Loop (the Slitherlink genre).
 *
 * Geometry: an n × n grid of cells has (n + 1) × (n + 1) points ("dots") and 2·n·(n + 1)
 * edges. Edges are numbered horizontal first (row-major, `r` 0…n, `c` 0…n−1), then vertical
 * (row-major, `r` 0…n−1, `c` 0…n). Dots are numbered `r · (n + 1) + c`.
 *
 * Generation pipeline: a seeded random region of cells is grown so that its boundary stays one
 * simple loop → every cell's clue is derived from that loop → clues are removed in a seeded
 * order as long as the propagation solver below (which never looks at the loop) still
 * determines every edge without guessing. A complete solve by sound deductions proves the
 * solution is unique; the tests re-check that with an independent backtracking oracle.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Cells per side per difficulty (square boards). */
export const SIZES: Readonly<Record<Difficulty, number>> = { easy: 5, medium: 7, hard: 10 };

/** Share of cells that keep their clue at least (easy puzzles stay generous). */
export const MIN_CLUE_SHARE: Readonly<Record<Difficulty, number>> = { easy: 0.5, medium: 0.35, hard: 0 };

/** Edge states (player marks and solver knowledge). */
export const UNKNOWN = 0;
export const LINE = 1;
export const CROSS = 2;
export type EdgeState = typeof UNKNOWN | typeof LINE | typeof CROSS;

/** Clue value of a cell without a number. */
export const NO_CLUE = -1;

/** Random regions tried before the fallback puzzle is used. */
export const MAX_ATTEMPTS = 200;
/** Upper bound for counters in untrusted saves. */
export const MAX_COUNTER = 1_000_000;
/** Undo entries kept in the save (oldest are dropped). */
export const MAX_HISTORY = 400;

export type Direction = 'up' | 'down' | 'left' | 'right';
export const DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right'];

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

// --- Geometry ------------------------------------------------------------------------------

export const edgeCount = (n: number): number => 2 * n * (n + 1);
export const dotCount = (n: number): number => (n + 1) * (n + 1);
/** Horizontal edge from dot (r, c) to dot (r, c + 1). */
export const hEdge = (n: number, r: number, c: number): number => r * n + c;
/** Vertical edge from dot (r, c) to dot (r + 1, c). */
export const vEdge = (n: number, r: number, c: number): number => n * (n + 1) + r * (n + 1) + c;
export const dotIndex = (n: number, r: number, c: number): number => r * (n + 1) + c;

export interface EdgeInfo {
  horizontal: boolean;
  /** Row and column of the edge's first dot (top or left end). */
  r: number;
  c: number;
  /** Dot indices of both ends. */
  a: number;
  b: number;
}

/** Orientation, position and end dots of an edge. */
export function edgeInfo(n: number, e: number): EdgeInfo {
  const horizontalCount = n * (n + 1);
  if (e < horizontalCount) {
    const r = Math.floor(e / n);
    const c = e % n;
    return { horizontal: true, r, c, a: dotIndex(n, r, c), b: dotIndex(n, r, c + 1) };
  }
  const k = e - horizontalCount;
  const r = Math.floor(k / (n + 1));
  const c = k % (n + 1);
  return { horizontal: false, r, c, a: dotIndex(n, r, c), b: dotIndex(n, r + 1, c) };
}

/** The four edges of cell (r, c): top, bottom, left, right. */
export function cellEdges(n: number, r: number, c: number): [number, number, number, number] {
  return [hEdge(n, r, c), hEdge(n, r + 1, c), vEdge(n, r, c), vEdge(n, r, c + 1)];
}

/** The edge leaving dot (r, c) in a direction, or -1 at the border. */
export function dotEdge(n: number, r: number, c: number, dir: Direction): number {
  if (dir === 'up') return r > 0 ? vEdge(n, r - 1, c) : -1;
  if (dir === 'down') return r < n ? vEdge(n, r, c) : -1;
  if (dir === 'left') return c > 0 ? hEdge(n, r, c - 1) : -1;
  return c < n ? hEdge(n, r, c) : -1;
}

/** Edges meeting at dot (r, c) (2 to 4). */
export function dotEdges(n: number, r: number, c: number): number[] {
  return DIRECTIONS.map((dir) => dotEdge(n, r, c, dir)).filter((e) => e >= 0);
}

interface Corner {
  /** The two edges of the cell that meet at this corner. */
  pair: [number, number];
  /** The other two edges of the cell. */
  rest: [number, number];
  /** Edges at the corner dot outside the cell (0–2). */
  outside: number[];
}

interface Geometry {
  n: number;
  edgeEnds: [number, number][];
  dots: number[][];
  cells: [number, number, number, number][];
  corners: Corner[][];
}

const geometryCache = new Map<number, Geometry>();

function geometry(n: number): Geometry {
  const cached = geometryCache.get(n);
  if (cached) return cached;
  const edgeEnds: [number, number][] = [];
  for (let e = 0; e < edgeCount(n); e++) {
    const info = edgeInfo(n, e);
    edgeEnds.push([info.a, info.b]);
  }
  const dots: number[][] = [];
  for (let r = 0; r <= n; r++) for (let c = 0; c <= n; c++) dots.push(dotEdges(n, r, c));
  const cells: [number, number, number, number][] = [];
  const corners: Corner[][] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const [top, bottom, left, right] = cellEdges(n, r, c);
      cells.push([top, bottom, left, right]);
      const list: [number, number, [number, number], [number, number]][] = [
        [r, c, [top, left], [bottom, right]],
        [r, c + 1, [top, right], [bottom, left]],
        [r + 1, c, [bottom, left], [top, right]],
        [r + 1, c + 1, [bottom, right], [top, left]]
      ];
      corners.push(
        list.map(([dr, dc, pair, rest]) => ({
          pair,
          rest,
          outside: (dots[dotIndex(n, dr, dc)] as number[]).filter((e) => e !== pair[0] && e !== pair[1])
        }))
      );
    }
  }
  const result: Geometry = { n, edgeEnds, dots, cells, corners };
  geometryCache.set(n, result);
  return result;
}

/** Line edges around each cell. */
export function cellLineCounts(n: number, edges: readonly number[]): number[] {
  return geometry(n).cells.map((list) => list.filter((e) => edges[e] === LINE).length);
}

/** True when the LINE edges form exactly one simple closed loop (crosses are ignored). */
export function isLoop(n: number, edges: readonly number[]): boolean {
  const { edgeEnds, dots } = geometry(n);
  if (edges.length !== edgeEnds.length) return false;
  let start = -1;
  let total = 0;
  for (let d = 0; d < dots.length; d++) {
    const degree = (dots[d] as number[]).filter((e) => edges[e] === LINE).length;
    if (degree !== 0 && degree !== 2) return false;
    if (degree === 2 && start < 0) start = d;
  }
  for (const v of edges) if (v === LINE) total++;
  if (start < 0) return false;
  // Walk the loop from `start`; it must use every line edge.
  let previous = -1;
  let at = start;
  let walked = 0;
  do {
    const next = (dots[at] as number[]).find((e) => edges[e] === LINE && e !== previous) as number;
    const [a, b] = edgeEnds[next] as [number, number];
    at = a === at ? b : a;
    previous = next;
    walked++;
  } while (at !== start && walked <= total);
  return walked === total;
}

/** True when the lines form one loop and every clue is met. */
export function isSolution(n: number, clues: readonly number[], edges: readonly number[]): boolean {
  if (clues.length !== n * n || !isLoop(n, edges)) return false;
  const counts = cellLineCounts(n, edges);
  return clues.every((k, i) => k === NO_CLUE || counts[i] === k);
}

// --- Logic solver --------------------------------------------------------------------------

export interface SolveResult {
  /** Edge knowledge after propagation (UNKNOWN, LINE or CROSS). */
  edges: number[];
  /** Every edge determined and the lines form a valid solution. */
  solved: boolean;
  /** The clues admit no solution (detected without guessing). */
  contradiction: boolean;
}

/**
 * Propagation solver (no guessing). Applies until nothing changes:
 *  - cell: a clue already met crosses the rest; a clue needing every open edge draws them;
 *  - dot: a dot has 0 or 2 lines, so 2 lines cross the rest, 1 line with one open edge
 *    continues there, 0 lines with one open edge crosses it;
 *  - corner: combines a clue with the dot at one of its corners (a dead-end corner makes a 1
 *    cross and a 3 draw both corner edges; a line entering a corner of a 3 means exactly one
 *    corner edge is used, so both far edges are lines, and so on);
 *  - loop: a line that would close a loop is crossed unless that loop would be the whole
 *    solution; once a loop is closed every other edge is crossed.
 * Each rule only removes options that occur in no solution, so a complete solve is unique.
 */
export function solve(n: number, clues: readonly number[], start?: readonly number[]): SolveResult {
  const geo = geometry(n);
  const { edgeEnds, dots, cells, corners } = geo;
  const edges = start ? [...start] : new Array<number>(edgeEnds.length).fill(UNKNOWN);
  let changed = false;
  let failed = false;
  const set = (e: number, value: number) => {
    const current = edges[e] as number;
    if (current === value) return;
    if (current !== UNKNOWN) {
      failed = true;
      return;
    }
    edges[e] = value;
    changed = true;
  };
  const lines = (list: readonly number[]) => list.filter((e) => edges[e] === LINE).length;
  const crosses = (list: readonly number[]) => list.filter((e) => edges[e] === CROSS).length;
  const fill = (list: readonly number[], value: number) => {
    for (const e of list) if (edges[e] === UNKNOWN) set(e, value);
  };
  const result = (): SolveResult => {
    if (failed) return { edges, solved: false, contradiction: true };
    const done = edges.every((v) => v !== UNKNOWN);
    const solved = done && isSolution(n, clues, edges);
    return { edges, solved, contradiction: done && !solved };
  };

  do {
    changed = false;

    // Cells.
    cells.forEach((list, i) => {
      const k = clues[i] as number;
      if (k === NO_CLUE) return;
      const l = lines(list);
      const x = crosses(list);
      if (l > k || 4 - x < k) failed = true;
      else if (l === k) fill(list, CROSS);
      else if (4 - x === k) fill(list, LINE);
    });

    // Dots.
    for (const list of dots) {
      const l = lines(list);
      const u = list.filter((e) => edges[e] === UNKNOWN);
      if (l > 2 || (l === 1 && u.length === 0)) failed = true;
      else if (l === 2) fill(list, CROSS);
      else if (u.length === 1) fill(u, l === 1 ? LINE : CROSS);
    }
    if (failed) return result();
    if (changed) continue;

    // Corners.
    corners.forEach((list, i) => {
      const k = clues[i] as number;
      if (k === NO_CLUE) return;
      for (const { pair, rest, outside } of list) {
        const outLines = lines(outside);
        const outCrosses = crosses(outside) + 2 - outside.length;
        // What the clue allows for the number of lines among `pair`.
        const pairLow = Math.max(0, k - (2 - crosses(rest)));
        const pairHigh = Math.min(2, k - lines(rest));
        const atMostOne = outLines >= 1 || pairHigh <= 1;
        const atLeastOne = (outLines === 1 && outCrosses === 1) || pairLow >= 1;
        if (outCrosses === 2) {
          // Dead-end corner: both pair edges are lines or both are crosses.
          if (pairHigh < 2) fill(pair, CROSS);
          if (pairLow > 0) fill(pair, LINE);
        } else if (atMostOne && atLeastOne) {
          // Exactly one pair edge is a line.
          const restSum = k - 1;
          if (restSum === 2) fill(rest, LINE);
          if (restSum === 0) fill(rest, CROSS);
          if (outLines === 1) fill(outside, CROSS);
          else if (outCrosses === 1) fill(outside, LINE);
        }
      }
    });
    if (failed) return result();
    if (changed) continue;

    // Loop: union–find over dots joined by lines.
    const parent = dots.map((_, d) => d);
    const find = (x: number): number => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x] as number] as number;
        x = parent[x] as number;
      }
      return x;
    };
    let total = 0;
    edgeEnds.forEach(([a, b], e) => {
      if (edges[e] !== LINE) return;
      total++;
      parent[find(a)] = find(b);
    });
    const compLines = new Array<number>(dots.length).fill(0);
    const compDots = new Array<number>(dots.length).fill(0);
    edgeEnds.forEach(([a], e) => {
      if (edges[e] === LINE) compLines[find(a)] = (compLines[find(a)] as number) + 1;
    });
    dots.forEach((list, d) => {
      if (lines(list) > 0) compDots[find(d)] = (compDots[find(d)] as number) + 1;
    });
    let closed = false;
    for (let d = 0; d < dots.length; d++) {
      if (find(d) !== d || compLines[d] === 0 || compLines[d] !== compDots[d]) continue;
      // A closed loop: it must be everything.
      if (compLines[d] !== total) failed = true;
      closed = true;
    }
    if (failed) return result();
    if (closed) {
      fill(edges.map((_, e) => e), CROSS);
      continue;
    }
    const counts = cellLineCounts(n, edges);
    edgeEnds.forEach(([a, b], e) => {
      if (edges[e] !== UNKNOWN || find(a) !== find(b)) return;
      const root = find(a);
      if (compLines[root] !== total) return set(e, CROSS);
      // Closing this loop ends the puzzle: every clue must already be met by it.
      const meets = clues.every((k, i) => {
        if (k === NO_CLUE) return true;
        const extra = (cells[i] as number[]).includes(e) ? 1 : 0;
        return (counts[i] as number) + extra === k;
      });
      if (!meets) set(e, CROSS);
    });
  } while (changed && !failed);
  return result();
}

/** True when the solver alone determines every edge. */
export const isLogicSolvable = (n: number, clues: readonly number[]): boolean => solve(n, clues).solved;

// --- Generation ----------------------------------------------------------------------------

/** murmur3 32-bit finaliser: a bijective avalanche mix. */
function fmix32(value: number): number {
  let h = value >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Deterministic per-attempt seed: the seed is mixed before the attempt number is added, so
 * neighbouring seeds do not share attempt sequences.
 */
export function attemptSeed(seed: number, attempt: number): number {
  return fmix32(fmix32(seed) + attempt + 1);
}

/** LINE where an edge separates an inside cell from an outside one (or the border). */
export function boundaryOf(n: number, inside: readonly boolean[]): number[] {
  const at = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && inside[r * n + c] === true;
  const edges = new Array<number>(edgeCount(n)).fill(CROSS);
  for (let r = 0; r <= n; r++) for (let c = 0; c < n; c++) if (at(r - 1, c) !== at(r, c)) edges[hEdge(n, r, c)] = LINE;
  for (let r = 0; r < n; r++) for (let c = 0; c <= n; c++) if (at(r, c - 1) !== at(r, c)) edges[vEdge(n, r, c)] = LINE;
  return edges;
}

/**
 * Grows a random region from one cell, adding neighbouring cells only while the region's
 * boundary stays a single simple loop (no holes, no corner pinches).
 */
export function growRegion(rng: Rng, n: number, target: number): boolean[] {
  const inside = new Array<boolean>(n * n).fill(false);
  inside[rng.int(0, n * n - 1)] = true;
  let size = 1;
  const insideNeighbours = (i: number) => {
    const r = Math.floor(i / n);
    const c = i % n;
    return [r > 0 && inside[i - n], r < n - 1 && inside[i + n], c > 0 && inside[i - 1], c < n - 1 && inside[i + 1]].filter(Boolean).length;
  };
  const budget = target * 30;
  for (let tries = 0; tries < budget && size < target; tries++) {
    const frontier: number[] = [];
    for (let i = 0; i < n * n; i++) {
      if (inside[i]) continue;
      const r = Math.floor(i / n);
      const c = i % n;
      if ((r > 0 && inside[i - n]) || (r < n - 1 && inside[i + n]) || (c > 0 && inside[i - 1]) || (c < n - 1 && inside[i + 1])) frontier.push(i);
    }
    if (frontier.length === 0) break;
    // Of two random frontier cells take the one with fewer inside neighbours: winding loops.
    const first = rng.pick(frontier);
    const second = rng.pick(frontier);
    const cell = insideNeighbours(second) < insideNeighbours(first) ? second : first;
    inside[cell] = true;
    if (isLoop(n, boundaryOf(n, inside))) size++;
    else inside[cell] = false;
  }
  return inside;
}

/** Lines per cell of a loop: the full clue grid. */
export function cluesOf(n: number, solution: readonly number[]): number[] {
  return cellLineCounts(n, solution);
}

export interface Puzzle {
  size: number;
  clues: number[];
  /** LINE (1) or CROSS (2) per edge. */
  solution: number[];
}

/**
 * Removes clues in a seeded order while the solver still determines everything, keeping at
 * least `minClues`.
 */
export function thinClues(rng: Rng, n: number, full: readonly number[], minClues: number): number[] {
  const clues = [...full];
  let count = clues.filter((k) => k !== NO_CLUE).length;
  for (const cell of rng.shuffle(clues.map((_, i) => i))) {
    if (count <= minClues) break;
    const saved = clues[cell] as number;
    clues[cell] = NO_CLUE;
    if (isLogicSolvable(n, clues)) count--;
    else clues[cell] = saved;
  }
  return clues;
}

/** One candidate for `seed`: a grown loop with thinned clues, or `null` if rejected. */
export function candidate(seed: number, difficulty: Difficulty): Puzzle | null {
  const n = SIZES[difficulty];
  const rng = createRng(seed);
  const cells = n * n;
  const inside = growRegion(rng, n, rng.int(Math.floor(cells * 0.35), Math.floor(cells * 0.55)));
  const solution = boundaryOf(n, inside);
  if (inside.filter(Boolean).length < 3 || !isLoop(n, solution)) return null;
  const full = cluesOf(n, solution);
  if (!isLogicSolvable(n, full)) return null;
  const clues = thinClues(rng, n, full, Math.ceil(cells * MIN_CLUE_SHARE[difficulty]));
  return { size: n, clues, solution };
}

/** A rectangle one cell inside the border with every clue: the never-expected fallback. */
export function fallbackPuzzle(difficulty: Difficulty): Puzzle {
  const n = SIZES[difficulty];
  const inside = Array.from({ length: n * n }, (_, i) => {
    const r = Math.floor(i / n);
    const c = i % n;
    return r > 0 && c > 0 && r < n - 1 && c < n - 1;
  });
  const solution = boundaryOf(n, inside);
  return { size: n, clues: cluesOf(n, solution), solution };
}

export interface Generated extends Puzzle {
  /** Attempt that succeeded, or -1 for the fallback. */
  attempt: number;
}

/** The seeded puzzle for a difficulty: unique and solvable without guessing. */
export function generatePuzzle(seed: number, difficulty: Difficulty, maxAttempts = MAX_ATTEMPTS): Generated {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const found = candidate(attemptSeed(seed >>> 0, attempt), difficulty);
    if (found) return { ...found, attempt };
  }
  return { ...fallbackPuzzle(difficulty), attempt: -1 };
}

// --- Game state ----------------------------------------------------------------------------

export interface SlitherlinkState {
  seed: number;
  difficulty: Difficulty;
  /** Cells per side. */
  size: number;
  /** Clue per cell (row-major), `NO_CLUE` for an empty cell. */
  clues: number[];
  /** The unique solution: LINE or CROSS per edge. */
  solution: number[];
  /** The player's marks per edge (UNKNOWN, LINE or CROSS). */
  edges: number[];
  /** Undo stack of `[edge, previousState]`. */
  history: [number, number][];
  /** Mark changes made (undo is not counted). */
  moves: number;
  /** Times "Check" was used. */
  checks: number;
  /** Wrong marks reported by the last check, or `null` once the board changed. */
  lastCheck: number | null;
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): SlitherlinkState {
  const puzzle = generatePuzzle(seed >>> 0, difficulty);
  return {
    seed: seed >>> 0,
    difficulty,
    size: puzzle.size,
    clues: puzzle.clues,
    solution: puzzle.solution,
    edges: new Array<number>(edgeCount(puzzle.size)).fill(UNKNOWN),
    history: [],
    moves: 0,
    checks: 0,
    lastCheck: null
  };
}

type Board = Pick<SlitherlinkState, 'size' | 'clues' | 'edges'>;

/** Solved when the lines form exactly one closed loop that meets every clue. */
export const isSolved = (state: Board): boolean => isSolution(state.size, state.clues, state.edges);

export type ClueStatus = 'none' | 'open' | 'done' | 'over';

/** Per cell: no clue, still open, exactly met (✓) or impossible (too many lines or crosses). */
export function clueStatuses(state: Board): ClueStatus[] {
  const { cells } = geometry(state.size);
  return state.clues.map((k, i) => {
    if (k === NO_CLUE) return 'none';
    const list = cells[i] as number[];
    const l = list.filter((e) => state.edges[e] === LINE).length;
    const x = list.filter((e) => state.edges[e] === CROSS).length;
    if (l > k || 4 - x < k) return 'over';
    return l === k ? 'done' : 'open';
  });
}

/** Clues currently met exactly. */
export const satisfiedCount = (state: Board): number => clueStatuses(state).filter((s) => s === 'done').length;
/** Cells with a clue. */
export const clueTotal = (state: Pick<SlitherlinkState, 'clues'>): number => state.clues.filter((k) => k !== NO_CLUE).length;

/** The next mark when tapping: unknown → line → cross → unknown. */
export const nextMark = (mark: number): number => (mark + 1) % 3;

/** Sets an edge to a mark. Returns the same object when nothing changes or the game is over. */
export function setEdge(state: SlitherlinkState, edge: number, mark: number): SlitherlinkState {
  if (!isInt(edge, 0, state.edges.length - 1) || !isInt(mark, UNKNOWN, CROSS)) return state;
  const previous = state.edges[edge] as number;
  if (previous === mark || isSolved(state)) return state;
  const edges = [...state.edges];
  edges[edge] = mark;
  const history: [number, number][] = [...state.history, [edge, previous]];
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  return { ...state, edges, history, moves: state.moves + 1, lastCheck: null };
}

/** Cycles an edge: unknown → line → cross → unknown. */
export const cycleEdge = (state: SlitherlinkState, edge: number): SlitherlinkState =>
  setEdge(state, edge, nextMark(state.edges[edge] ?? UNKNOWN));

/** Toggles a cross: cross ↔ unknown (a line becomes a cross). */
export const toggleCross = (state: SlitherlinkState, edge: number): SlitherlinkState =>
  setEdge(state, edge, state.edges[edge] === CROSS ? UNKNOWN : CROSS);

export const canUndo = (state: SlitherlinkState): boolean => state.history.length > 0 && !isSolved(state);

/** Reverts the latest mark change. */
export function undo(state: SlitherlinkState): SlitherlinkState {
  if (!canUndo(state)) return state;
  const [edge, previous] = state.history[state.history.length - 1] as [number, number];
  const edges = [...state.edges];
  edges[edge] = previous;
  return { ...state, edges, history: state.history.slice(0, -1), lastCheck: null };
}

/** Lines that are not part of the loop plus crosses on the loop. */
export function wrongMarks(state: Pick<SlitherlinkState, 'edges' | 'solution'>): number {
  return state.edges.filter((mark, e) => mark !== UNKNOWN && mark !== state.solution[e]).length;
}

/** Counts wrong marks without revealing where they are. */
export function check(state: SlitherlinkState): SlitherlinkState {
  if (isSolved(state)) return state;
  return { ...state, checks: state.checks + 1, lastCheck: wrongMarks(state) };
}

// --- Validation ----------------------------------------------------------------------------

const isCounter = (value: unknown): value is number => isInt(value, 0, MAX_COUNTER);
const isIntList = (value: unknown, length: number, min: number, max: number): value is number[] =>
  Array.isArray(value) && value.length === length && value.every((v) => isInt(v, min, max));

/** Structural validation of untrusted saves. Never throws. */
export function isSlitherlinkState(value: unknown): value is SlitherlinkState {
  try {
    if (!isRecord(value)) return false;
    const v = value;
    if (!isUint32(v.seed) || !isOneOf(v.difficulty, DIFFICULTIES)) return false;
    const n = SIZES[v.difficulty];
    const count = edgeCount(n);
    if (v.size !== n || !isIntList(v.clues, n * n, NO_CLUE, 4)) return false;
    if (!isIntList(v.solution, count, LINE, CROSS) || !isIntList(v.edges, count, UNKNOWN, CROSS)) return false;
    if (!Array.isArray(v.history) || v.history.length > MAX_HISTORY) return false;
    for (const entry of v.history as unknown[]) {
      if (!Array.isArray(entry) || entry.length !== 2 || !isInt(entry[0], 0, count - 1) || !isInt(entry[1], UNKNOWN, CROSS)) return false;
    }
    if (!isCounter(v.moves) || !isCounter(v.checks) || v.history.length > v.moves) return false;
    if (v.lastCheck !== null && !isInt(v.lastCheck, 0, count)) return false;
    const clues = v.clues as number[];
    const solution = v.solution as number[];
    if (!isSolution(n, clues, solution)) return false;
    const solved = solve(n, clues);
    return solved.solved && solved.edges.every((mark, e) => mark === solution[e]);
  } catch {
    return false;
  }
}
