/**
 * Seeded level generator for the expert set (a design tool, not shipped with the game). Every
 * expert level in `src/levels.ts` notes the seed it came from; `generateExpertLevel(seed)` gives the
 * same level again.
 *
 * "Build the solution first":
 * 1. A 7×9 board gets one or two lasers on its edge and a few fixed elements (blockers, maybe a
 *    fixed polariser, filter or optical diode).
 * 2. The solution pieces (mirrors, maybe splitters, and at least two kinds of optical pieces:
 *    polarisers, neutral-density filters, colour filters, chromatic blockers) are placed one by one
 *    on squares that light reaches, each where it changes the light.
 * 3. Targets go on lit squares downstream of the optical pieces and ask for exactly the light that
 *    arrives there: colour, and intensity or polarisation whenever those differ from a plain laser.
 * 4. An optical piece on a single beam could slide along it, so the other empty squares of its beam
 *    segment get optical diodes pointing the way the light goes (they leave the light unchanged).
 *    Every piece must matter: removing any one must break the solution.
 * 5. Forbidden sensors go on dark squares. The exact solver (`solveByDecision` in `oracle.ts`, which
 *    shares no code with the game) then looks for another solution; while it finds one, a fixed
 *    element rules it out without changing the intended light: a sensor where only the other
 *    solution sends light or puts a piece, or an optical diode, colour filter or polariser that the
 *    intended light passes unchanged, or else an extra target. A level is kept only when its
 *    solution is unique and the solver's search tree is big enough.
 *
 * The generator uses the game's own tracer to lay out light; uniqueness is always proven by the
 * independent oracle.
 */
import { createRng, type Rng } from '@wp/game-core';
import type { LevelSource } from '../src/levels';
import {
  MAX_LEVEL,
  brightness,
  colourLetter,
  componentIntensity,
  evaluate,
  intensityOf,
  parseLevel,
  parseToken,
  PRIMARIES,
  traceBeams,
  type Board,
  type BeamTrace
} from '../src/rules';
import { PIECE_TOKENS, kindOfToken, parseSolution, solveByDecision, type Inventory } from './oracle';

export const WIDTH = 7;
export const HEIGHT = 9;

export interface GeneratorOptions {
  /** Fewest solver nodes a kept level needs. */
  readonly minNodes: number;
  /** Search budget of the solver per check (levels that need more are dropped). */
  readonly maxNodes: number;
  /** Piece count range. */
  readonly pieces: readonly [number, number];
}

export const EXPERT_OPTIONS: GeneratorOptions = { minNodes: 1_800_000, maxNodes: 6_000_000, pieces: [6, 8] };

export interface GeneratedLevel {
  readonly seed: number;
  readonly source: LevelSource;
  readonly solution: string;
  readonly nodes: number;
  readonly pieces: number;
}

const OPTICAL = ['polariser', 'neutral', 'filter', 'minus'] as const;
type Optical = (typeof OPTICAL)[number];

const boardOf = (grid: string[]): Board => ({ width: WIDTH, height: HEIGHT, cells: grid.map(parseToken) });
const rowsOf = (grid: string[]) => Array.from({ length: HEIGHT }, (_, r) => grid.slice(r * WIDTH, r * WIDTH + WIDTH).map((t) => t.padEnd(2)).join(' ').trimEnd());
const pieceCount = (inventory: Inventory) => Object.values(inventory).reduce((sum, n) => sum + (n ?? 0), 0);

/** A lit, empty square, chosen at random (undefined when there is none). */
function litEmpty(rng: Rng, grid: string[], trace: BeamTrace, avoid: ReadonlySet<number>): number | undefined {
  const options = grid.flatMap((token, cell) => (token === '.' && !avoid.has(cell) && (trace.lit[cell] ?? 0) !== 0 ? [cell] : []));
  return options.length === 0 ? undefined : rng.pick(options);
}

/**
 * True when light crosses `cell` both ways (two beams). An optical piece there acts on both beams
 * at once; anywhere else on a single beam it could usually slide along that beam (also around
 * mirrors) without changing anything, and every such square would be another solution.
 */
function crossing(trace: BeamTrace, cell: number): boolean {
  const arrivals = trace.arrivals[cell] ?? [];
  return arrivals.some((a) => a.dir % 2 === 0) && arrivals.some((a) => a.dir % 2 === 1);
}

/** The colours a laser of the level can provide. */
function lasersOf(grid: string[]): number[] {
  return grid.flatMap((token) => (/^[\^>v<][RGBYMCW]$/.test(token) ? [parseToken(token)] : [])).map((element) => (element.kind === 'emitter' ? element.colour : 0));
}

/** Why recent attempts failed (by source line), for tuning the generator. */
export const failures = new Map<string, number>();
const fail = (reason: string): undefined => {
  failures.set(reason, (failures.get(reason) ?? 0) + 1);
  return undefined;
};

/** One attempt with `seed`; undefined when the attempt does not give a good level. */
export function generateExpertLevel(seed: number, options: GeneratorOptions = EXPERT_OPTIONS): GeneratedLevel | undefined {
  const rng = createRng(seed);
  const grid: string[] = new Array<string>(WIDTH * HEIGHT).fill('.');
  const at = (r: number, c: number) => r * WIDTH + c;

  // 1. Lasers on the edge, pointing inwards.
  const laserCount = rng.int(1, 2);
  for (let i = 0; i < laserCount; i++) {
    const side = rng.int(0, 3);
    const colour = i === 0 ? rng.pick(['W', 'W', 'Y', 'M', 'C']) : rng.pick(['W', 'Y', 'M', 'C', 'R', 'G', 'B']);
    const cell =
      side === 0 ? at(0, rng.int(1, WIDTH - 2)) : side === 1 ? at(rng.int(1, HEIGHT - 2), WIDTH - 1) : side === 2 ? at(HEIGHT - 1, rng.int(1, WIDTH - 2)) : at(rng.int(1, HEIGHT - 2), 0);
    if (grid[cell] !== '.') return fail('laser clash');
    grid[cell] = `${['v', '<', '^', '>'][side]}${colour}`;
  }
  // Fixed elements.
  for (let i = rng.int(1, 3); i > 0; i--) {
    const cell = rng.int(0, grid.length - 1);
    if (grid[cell] === '.') grid[cell] = '#';
  }
  if (rng.next() < 0.3) {
    const cell = rng.int(0, grid.length - 1);
    if (grid[cell] === '.') grid[cell] = rng.pick(['P0', 'P45', 'P90', 'P135']);
  }
  if (rng.next() < 0.3) {
    const cell = rng.int(0, grid.length - 1);
    if (grid[cell] === '.') grid[cell] = rng.pick(['D^', 'D>', 'Dv', 'D<']);
  }

  // 2. The solution's pieces.
  const total = rng.int(options.pieces[0], options.pieces[1]);
  const opticalKinds = rng.shuffle(OPTICAL).slice(0, rng.int(2, 3));
  type Planned = 'mirror' | 'splitter' | Optical;
  const plan: Planned[] = [];
  for (const optical of opticalKinds) plan.push(...new Array<Planned>(optical === 'polariser' ? rng.int(1, 2) : 1).fill(optical));
  const splitters = rng.int(1, 2);
  while (plan.length < total) plan.push(plan.filter((k) => k === 'splitter').length < splitters && rng.next() < 0.4 ? 'splitter' : 'mirror');
  if (plan.length > total) return fail('plan too big');
  // Mirrors and splitters first: they make the crossings where the optical pieces go.
  const order = [...rng.shuffle(plan.filter((k) => k === 'mirror' || k === 'splitter')), ...rng.shuffle(plan.filter((k) => k !== 'mirror' && k !== 'splitter'))];

  const placed = new Map<number, string>();
  const solutionGrid = [...grid];
  for (const planned of order) {
    let done = false;
    for (let attempt = 0; attempt < 40 && !done; attempt++) {
      const before = traceBeams(boardOf(solutionGrid));
      const optical = planned !== 'mirror' && planned !== 'splitter';
      // Optical pieces prefer squares where two beams cross (they then act on both).
      const crossings = optical ? solutionGrid.flatMap((token, c) => (token === '.' && crossing(before, c) ? [c] : [])) : [];
      const cell = crossings.length > 0 && rng.next() < 0.7 ? rng.pick(crossings) : litEmpty(rng, solutionGrid, before, new Set());
      if (cell === undefined) continue;
      const colour = before.lit[cell] ?? 0;
      let token: string;
      if (planned === 'filter' || planned === 'minus') {
        // A filter must remove something and pass something: it needs light of two or more primaries.
        const primaries = PRIMARIES.filter((p) => (colour & p) !== 0);
        if (primaries.length < 2) continue;
        token = `${planned === 'filter' ? 'F' : '-'}${colourLetter(rng.pick(primaries))}`;
      } else {
        token = rng.pick(PIECE_TOKENS[planned] as readonly string[]);
      }
      solutionGrid[cell] = token;
      const after = traceBeams(boardOf(solutionGrid));
      if ([...placed.keys()].some((other) => (after.lit[other] ?? 0) === 0)) {
        solutionGrid[cell] = '.';
        continue;
      }
      placed.set(cell, token);
      done = true;
    }
    if (!done) return fail('piece without effect');
  }
  let trace = traceBeams(boardOf(solutionGrid));
  if ([...placed.keys()].some((cell) => (trace.lit[cell] ?? 0) === 0)) return fail('dark piece');

  // 3. Targets downstream of the optical pieces.
  const targetCount = rng.int(2, 4);
  const targets: number[] = [];
  for (let i = 0; i < targetCount * 12 && targets.length < targetCount; i++) {
    const cell = litEmpty(rng, solutionGrid, trace, new Set());
    if (cell === undefined) break;
    const arriving = trace.arrivals[cell] ?? [];
    const special = arriving.some((a) => a.pol !== 0 || a.level > 0) || !lasersOf(grid).includes(trace.lit[cell] ?? 0);
    if ((!special && rng.next() < 0.5) || !targetToken(trace, cell)) continue;
    solutionGrid[cell] = 'TW';
    const after = traceBeams(boardOf(solutionGrid));
    if ([...placed.keys()].some((other) => (after.lit[other] ?? 0) === 0) || targets.some((other) => !targetToken(after, other))) {
      solutionGrid[cell] = '.';
      continue;
    }
    targets.push(cell);
    trace = after;
  }
  if (targets.length < 2) return fail('too few targets');
  for (const cell of targets) {
    const token = targetToken(trace, cell);
    if (!token) return fail('target not writable');
    solutionGrid[cell] = token;
    grid[cell] = token;
  }
  trace = traceBeams(boardOf(solutionGrid));
  if (!evaluate(boardOf(solutionGrid), trace).solved) return fail('not solved');
  if ([...placed.keys()].some((cell) => (trace.lit[cell] ?? 0) === 0)) return fail('dark piece after targets');

  // An optical piece on a single beam could slide along it (also past mirrors) to any empty square
  // up to the next splitter, target or other element: those squares get optical diodes in the
  // beam's direction, which leave the light unchanged but leave no room to slide.
  for (const [cell, token] of placed) {
    if (/^[/\\]$|^S/.test(token) || crossing(trace, cell)) continue;
    for (const arrival of trace.arrivals[cell] ?? []) {
      for (const [start, travel] of [[cell, arrival.dir], [cell, (arrival.dir + 2) % 4]] as const) {
        let at = start;
        let dir: number = travel;
        for (let steps = 0; steps < WIDTH * HEIGHT; steps++) {
          const r = Math.floor(at / WIDTH) + [-1, 0, 1, 0][dir]!;
          const c = (at % WIDTH) + [0, 1, 0, -1][dir]!;
          if (r < 0 || c < 0 || r >= HEIGHT || c >= WIDTH) break;
          at = r * WIDTH + c;
          const here = solutionGrid[at]!;
          if (here === '/' || here === '\\') {
            dir = here === '/' ? dir ^ 1 : 3 - dir;
            continue;
          }
          // Two optical pieces on one beam could swap places: not a puzzle with one answer.
          if (placed.has(at) && !/^[/\\]$|^S/.test(here)) return fail('optical pieces on one beam');
          if (here !== '.') break;
          // The diode points the way the light travels (against the walk when walking backwards).
          const lightDir = travel === arrival.dir ? dir : (dir + 2) % 4;
          const diode = `D${['^', '>', 'v', '<'][lightDir]}`;
          solutionGrid[at] = diode;
          const after = traceBeams(boardOf(solutionGrid));
          if (JSON.stringify(after.arrivals) !== JSON.stringify(trace.arrivals)) {
            solutionGrid[at] = '.';
            break;
          }
          grid[at] = diode;
        }
      }
    }
  }
  trace = traceBeams(boardOf(solutionGrid));

  // Every piece must matter: without it the level is not solved.
  for (const cell of placed.keys()) {
    const without = [...solutionGrid];
    without[cell] = '.';
    if (evaluate(boardOf(without)).solved) return fail('redundant piece');
  }

  // 4. Sensors in the dark, then make the solution unique.
  const dark = () => grid.flatMap((token, cell) => (token === '.' && !placed.has(cell) && (trace.lit[cell] ?? 0) === 0 ? [cell] : []));
  for (let i = rng.int(4, 8); i > 0; i--) {
    const candidates = dark();
    if (candidates.length > 0) grid[rng.pick(candidates)] = 'X';
  }
  const inventory: Record<string, number> = {};
  for (const token of placed.values()) inventory[kindOfToken(token)] = (inventory[kindOfToken(token)] ?? 0) + 1;
  const solution = [...placed].map(([cell, token]) => `${Math.floor(cell / WIDTH)},${cell % WIDTH}=${token}`).sort().join(' ');

  for (let round = 0; round < 30; round++) {
    const search = solveByDecision(rowsOf(grid), inventory, 2, options.maxNodes);
    if (!search.complete && search.solutions.length < 2) return fail('search budget');
    const other = search.solutions.find((s) => s !== solution);
    if (!other) {
      if (!search.solutions.includes(solution)) return fail('solution lost');
      const full = solveByDecision(rowsOf(grid), inventory, Infinity, options.maxNodes);
      if (!full.complete || full.solutions.length !== 1 || full.nodes < options.minNodes) return fail('search too small');
      const source: LevelSource = { rows: rowsOf(grid), inventory, solutions: 1 };
      try {
        parseLevel(source);
      } catch {
        return fail('invalid level');
      }
      return { seed, source, solution, nodes: full.nodes, pieces: pieceCount(inventory) };
    }
    // Rule out the other solution with a fixed element that the intended light does not notice:
    const otherGrid = [...grid];
    for (const { row, col, token } of parseSolution(other)) otherGrid[at(row, col)] = token;
    const otherTrace = traceBeams(boardOf(otherGrid));
    const intendedGrid = () => {
      const g = [...grid];
      for (const [p, token] of placed) g[p] = token;
      return g;
    };
    const same = (a: BeamTrace, b: BeamTrace) => JSON.stringify(a.arrivals) === JSON.stringify(b.arrivals);
    const rulers: [number, string][] = [];
    grid.forEach((token, cell) => {
      if (token !== '.' || placed.has(cell)) return;
      const blocksOther = otherGrid[cell] !== '.';
      const arrivals = trace.arrivals[cell] ?? [];
      // A forbidden sensor in the dark where the other solution sends light or puts a piece …
      if (arrivals.length === 0) {
        if (blocksOther || (otherTrace.lit[cell] ?? 0) !== 0) rulers.push([cell, 'X']);
        return;
      }
      // … or, on the intended light, an element it passes unchanged: an optical diode in its
      // direction, a colour filter of its colour, a polariser at its polarisation.
      const dirs = new Set(arrivals.map((a) => a.dir));
      const pols = new Set(arrivals.map((a) => a.pol));
      const colour = trace.lit[cell] ?? 0;
      const transparent: string[] = [];
      if (dirs.size === 1) transparent.push(`D${['^', '>', 'v', '<'][[...dirs][0]!]}`);
      if (colour !== 7) transparent.push(`F${colourLetter(colour)}`);
      if (pols.size === 1 && [...pols][0]! > 0) transparent.push(`P${([...pols][0]! - 1) * 45}`);
      for (const element of transparent) {
        const mine = intendedGrid();
        mine[cell] = element;
        if (!same(traceBeams(boardOf(mine)), trace)) continue;
        if (!blocksOther) {
          const theirs = [...otherGrid];
          theirs[cell] = element;
          if (same(traceBeams(boardOf(theirs)), otherTrace)) continue;
        }
        rulers.push([cell, element]);
      }
    });
    // … or else a target where the two solutions send different light (if the intended one still works).
    let added = false;
    if (rulers.length > 0) {
      const [cell, element] = rng.pick(rulers);
      grid[cell] = element;
      added = true;
    }
    const differs = (cell: number) => JSON.stringify(trace.arrivals[cell]) !== JSON.stringify(otherTrace.arrivals[cell]);
    const free = (cell: number) => grid[cell] === '.' && otherGrid[cell] === '.' && !placed.has(cell);
    const targetCells = added ? [] : rng.shuffle(grid.flatMap((_, cell) => (free(cell) && (trace.lit[cell] ?? 0) !== 0 && differs(cell) ? [cell] : [])));
    for (const cell of targetCells) {
      const trial = intendedGrid();
      trial[cell] = 'TW';
      const trialTrace = traceBeams(boardOf(trial));
      const token = targetToken(trialTrace, cell);
      if (!token) continue;
      trial[cell] = token;
      if (!evaluate(boardOf(trial)).solved || [...placed.keys()].some((p) => (trialTrace.lit[p] ?? 0) === 0)) continue;
      grid[cell] = token;
      trace = traceBeams(boardOf(trial));
      added = true;
      break;
    }
    if (!added) return fail('nothing rules out another solution');
  }
  return fail('too many rounds');
}

/** The target token asking for exactly the light that arrives at `cell` (undefined if it cannot be written). */
function targetToken(trace: BeamTrace, cell: number): string | undefined {
  const colour = trace.lit[cell] ?? 0;
  const arrivals = trace.arrivals[cell] ?? [];
  if (colour === 0) return undefined;
  const intensities = PRIMARIES.filter((p) => (colour & p) !== 0).map((p) => componentIntensity(arrivals, p));
  const value = brightness(arrivals);
  if (intensities.some((i) => i !== value)) return undefined;
  const level = Math.log2(1 / value);
  if (!Number.isInteger(level) || level > MAX_LEVEL || intensityOf(level) !== value) return undefined;
  const pols = new Set(arrivals.map((a) => a.pol));
  const pol = pols.size === 1 ? [...pols][0]! : -1;
  let token = `T${colourLetter(colour)}`;
  if (level > 0) token += String(2 ** level);
  if (pol > 0) token += `:${(pol - 1) * 45}`;
  return token;
}
