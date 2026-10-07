/**
 * Laser Paths rules: pure, DOM-free logic and the serializable state.
 *
 * The board is a small grid. Fixed elements (lasers, mirrors, splitters, colour filters,
 * blockers, targets and forbidden sensors) come from the level; the player places pieces from
 * a limited inventory (mirrors, splitters, blockers) on empty squares and turns them. The level
 * is solved when every target receives exactly the colour it asks for and no forbidden sensor
 * receives any light.
 *
 * Light is modelled with additive RGB colour masks (red = 1, green = 2, blue = 4), so mixing is
 * a bitwise OR (red + blue = magenta = 5) and a filter is a bitwise AND. `traceBeams` is a
 * generic, reusable beam tracer: it only needs a `Board` and knows nothing about levels,
 * inventory or game state.
 */
// @ts-nocheck

import { isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { LEVELS, type LevelSource } from './levels';

/* ---------- Colours ---------- */

export const RED = 1;
export const GREEN = 2;
export const BLUE = 4;
export const WHITE = RED | GREEN | BLUE;
/** The three primary colours, in mask order. */
export const PRIMARIES = [RED, GREEN, BLUE] as const;

/** Letter for each colour mask 0–7 ('' = no light). Letters are shown on the board in every language. */
export const COLOUR_LETTERS = ['', 'R', 'G', 'Y', 'B', 'M', 'C', 'W'] as const;
export type ColourLetter = Exclude<(typeof COLOUR_LETTERS)[number], ''>;

/** `'R'` for 1, `'M'` for 5, `''` for 0 (no light). */
export const colourLetter = (mask: number): string => COLOUR_LETTERS[mask] ?? '';

/** Mask for a colour letter, or 0 for anything else. */
export const colourFromLetter = (letter: string): number => Math.max(0, COLOUR_LETTERS.indexOf(letter as ColourLetter));

export const isColour = (value: unknown): value is number => isInt(value, 1, WHITE);

/* ---------- Directions and geometry ---------- */

/** Travel directions: 0 = up (north), 1 = right (east), 2 = down (south), 3 = left (west). */
export type Dir = 0 | 1 | 2 | 3;
export const DIRS: readonly Dir[] = [0, 1, 2, 3];
const ROW_STEP = [-1, 0, 1, 0] as const;
const COL_STEP = [0, 1, 0, -1] as const;

export const opposite = (dir: Dir): Dir => ((dir + 2) % 4) as Dir;

/** Orientation of a mirror or splitter: 0 = `/`, 1 = `\`. */
export type Orientation = 0 | 1;

/**
 * Direction of a beam travelling `dir` after bouncing off a mirror.
 * `/` swaps up↔right and down↔left; `\` swaps up↔left and down↔right.
 */
export function reflect(dir: Dir, orient: Orientation): Dir {
  return (orient === 0 ? dir ^ 1 : 3 - dir) as Dir;
}

/** The neighbouring cell index in `dir`, or -1 when that leaves the board. */
export function neighbour(width: number, height: number, cell: number, dir: Dir): number {
  const row = Math.floor(cell / width) + ROW_STEP[dir];
  const col = (cell % width) + COL_STEP[dir];
  if (row < 0 || row >= height || col < 0 || col >= width) return -1;
  return row * width + col;
}

/* ---------- Board elements and the beam tracer ---------- */

export type Element =
  | { readonly kind: 'empty' }
  /** Light source: sends light of `colour` out of its square in `dir`. Absorbs light that hits it. */
  | { readonly kind: 'emitter'; readonly dir: Dir; readonly colour: number }
  /** Turns the beam by 90°. */
  | { readonly kind: 'mirror'; readonly orient: Orientation }
  /** Half-silvered mirror: the beam continues straight on and is also reflected. */
  | { readonly kind: 'splitter'; readonly orient: Orientation }
  /** Lets through only the parts of the light contained in `colour`, in any direction. */
  | { readonly kind: 'filter'; readonly colour: number }
  /** Absorbs all light. */
  | { readonly kind: 'blocker' }
  /** Absorbs light; must end up receiving exactly `colour`. */
  | { readonly kind: 'target'; readonly colour: number }
  /** Absorbs light; must receive none. */
  | { readonly kind: 'sensor' };

export type ElementKind = Element['kind'];

export interface Board {
  readonly width: number;
  readonly height: number;
  /** Row-major, `width * height` entries. */
  readonly cells: readonly Element[];
}

export interface BeamTrace {
  readonly width: number;
  readonly height: number;
  /**
   * Light crossing each side of each square: `sides[cell * 4 + dir]` is the colour mask of all
   * light that passes through the side of `cell` facing `dir` (in either direction). Drawing a
   * line from the square's centre to every lit side draws all beams.
   */
  readonly sides: number[];
  /** Colour mask of all light that enters each square (mixed additively). */
  readonly lit: number[];
}

/**
 * Directions in which light travelling `dir` leaves an element it has entered, together with the
 * colour mask that survives. Absorbing elements return no exits.
 */
export function exits(element: Element, dir: Dir, colour: number): { dir: Dir; colour: number }[] {
  switch (element.kind) {
    case 'empty':
      return [{ dir, colour }];
    case 'mirror':
      return [{ dir: reflect(dir, element.orient), colour }];
    case 'splitter':
      return [{ dir, colour }, { dir: reflect(dir, element.orient), colour }];
    case 'filter': {
      const passed = colour & element.colour;
      return passed === 0 ? [] : [{ dir, colour: passed }];
    }
    default:
      return [];
  }
}

/**
 * Traces all laser beams on a board and returns which light reaches which square.
 *
 * Beams travel orthogonally, one square at a time, from every emitter. Each square's element
 * decides where entering light goes next (see `exits`). Light of several colours travelling the
 * same way is handled together as one colour mask, and light arriving at a square from several
 * beams mixes additively (bitwise OR).
 *
 * The tracer is a work-list fixpoint over (square, travel direction): it remembers which colours
 * have already travelled each way through each square and only propagates colours that are new.
 * Since a mask has only three bits, every (square, direction) pair is expanded at most three
 * times, so tracing always terminates — also for beams caught in mirror loops — in
 * O(width × height) steps. The result does not depend on the order of the emitters.
 */
export function traceBeams(board: Board): BeamTrace {
  const { width, height, cells } = board;
  const size = width * height;
  const sides = new Array<number>(size * 4).fill(0);
  const lit = new Array<number>(size).fill(0);
  /** Colours already propagated into each square while travelling each direction. */
  const seen = new Array<number>(size * 4).fill(0);
  /** Pending light: [square entered, direction of travel, colour mask]. */
  const queue: [number, Dir, number][] = [];
  const mix = (masks: number[], index: number, colour: number) => {
    masks[index] = (masks[index] ?? 0) | colour;
  };

  /** Light of `colour` leaves `cell` through its `dir` side. */
  const leave = (cell: number, dir: Dir, colour: number) => {
    mix(sides, cell * 4 + dir, colour);
    const next = neighbour(width, height, cell, dir);
    if (next >= 0) queue.push([next, dir, colour]);
  };

  cells.forEach((element, cell) => {
    if (element.kind === 'emitter' && element.colour > 0) leave(cell, element.dir, element.colour & WHITE);
  });

  while (queue.length > 0) {
    const [cell, dir, colour] = queue.pop() as [number, Dir, number];
    const fresh = colour & ~(seen[cell * 4 + dir] ?? 0);
    if (fresh === 0) continue;
    mix(seen, cell * 4 + dir, fresh);
    mix(sides, cell * 4 + opposite(dir), fresh);
    mix(lit, cell, fresh);
    for (const out of exits(cells[cell] as Element, dir, fresh)) leave(cell, out.dir, out.colour);
  }
  return { width, height, sides, lit };
}

export interface TargetStatus {
  readonly cell: number;
  /** Required colour mask. */
  readonly need: number;
  /** Received colour mask (0 = dark). */
  readonly got: number;
}

export interface Evaluation {
  readonly targets: readonly TargetStatus[];
  /** Number of targets receiving exactly their colour. */
  readonly correct: number;
  /** Forbidden sensors that receive light. */
  readonly litSensors: readonly number[];
  /** Every target correct, no forbidden sensor lit, and at least one target on the board. */
  readonly solved: boolean;
}

export function evaluate(board: Board, trace: BeamTrace = traceBeams(board)): Evaluation {
  const targets: TargetStatus[] = [];
  const litSensors: number[] = [];
  board.cells.forEach((element, cell) => {
    const got = trace.lit[cell] ?? 0;
    if (element.kind === 'target') targets.push({ cell, need: element.colour, got });
    else if (element.kind === 'sensor' && got !== 0) litSensors.push(cell);
  });
  const correct = targets.filter((target) => target.got === target.need).length;
  return { targets, correct, litSensors, solved: targets.length > 0 && correct === targets.length && litSensors.length === 0 };
}

/* ---------- Levels ---------- */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';
export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

/** Pieces the player can place. */
export const PIECE_KINDS = ['mirror', 'splitter', 'blocker'] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];

/** Largest supported board side (7 squares of 44 px fit a 360 px phone). */
export const MAX_SIDE = 7;

export interface Level {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly Element[];
  readonly inventory: Readonly<Record<PieceKind, number>>;
}

export class LevelFormatError extends Error {
  override name = 'LevelFormatError';
}

const ARROWS: Readonly<Record<string, Dir>> = { '^': 0, '>': 1, v: 2, '<': 3 };

/**
 * Reads one level token:
 * `.` empty · `#` blocker · `/` `\` mirror · `S/` `S\` splitter · `X` forbidden sensor ·
 * `^R` `>G` `vB` `<W` laser (arrow + colour letter) · `FR` filter · `TM` target (+ colour letter).
 */
export function parseToken(token: string): Element {
  switch (token) {
    case '.':
      return { kind: 'empty' };
    case '#':
      return { kind: 'blocker' };
    case 'X':
      return { kind: 'sensor' };
    case '/':
    case '\\':
      return { kind: 'mirror', orient: token === '/' ? 0 : 1 };
    case 'S/':
    case 'S\\':
      return { kind: 'splitter', orient: token === 'S/' ? 0 : 1 };
  }
  const [head = '', letter = '', ...rest] = token;
  const colour = colourFromLetter(letter);
  if (rest.length > 0 || colour === 0) throw new LevelFormatError(`unknown token "${token}"`);
  const dir = ARROWS[head];
  if (dir !== undefined) return { kind: 'emitter', dir, colour };
  if (head === 'F') {
    if (colour === WHITE) throw new LevelFormatError('a white filter would let everything through');
    return { kind: 'filter', colour };
  }
  if (head === 'T') return { kind: 'target', colour };
  throw new LevelFormatError(`unknown token "${token}"`);
}

/**
 * Parses and validates a level: a rectangle of at most 7×7 whitespace-separated tokens with at
 * least one laser, at least one target and a non-empty inventory, not already solved without pieces.
 */
export function parseLevel(source: LevelSource): Level {
  const grid = source.rows.map((row) => row.trim().split(/\s+/));
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (height < 2 || width < 2 || height > MAX_SIDE || width > MAX_SIDE) throw new LevelFormatError('board must be between 2×2 and 7×7');
  if (grid.some((row) => row.length !== width)) throw new LevelFormatError('rows have different lengths');
  const cells = grid.flat().map(parseToken);
  if (!cells.some((cell) => cell.kind === 'emitter')) throw new LevelFormatError('level has no laser');
  if (!cells.some((cell) => cell.kind === 'target')) throw new LevelFormatError('level has no target');
  const inventory = { mirror: 0, splitter: 0, blocker: 0 };
  for (const kind of PIECE_KINDS) {
    const count = source.inventory[kind] ?? 0;
    if (!isInt(count, 0, 4)) throw new LevelFormatError(`bad ${kind} count`);
    inventory[kind] = count;
  }
  if (PIECE_KINDS.every((kind) => inventory[kind] === 0)) throw new LevelFormatError('inventory is empty');
  const level: Level = { width, height, cells, inventory };
  if (evaluate(level).solved) throw new LevelFormatError('level is solved without any piece');
  return level;
}

const levelCache = new Map<string, Level>();

export const levelCount = (difficulty: Difficulty): number => LEVELS[difficulty].length;

/** The parsed level `index` of a difficulty (cached). Throws for an index out of range. */
export function getLevel(difficulty: Difficulty, index: number): Level {
  const source = LEVELS[difficulty][index];
  if (!source) throw new RangeError(`No level ${index} in ${difficulty}`);
  const key = `${difficulty}/${index}`;
  let level = levelCache.get(key);
  if (!level) {
    level = parseLevel(source);
    levelCache.set(key, level);
  }
  return level;
}

/* ---------- Game state ---------- */

export interface Piece {
  cell: number;
  kind: PieceKind;
  /** Always 0 for blockers. */
  orient: Orientation;
}

/** A previous position, restored by Undo. */
export interface Snapshot {
  /** Sorted by cell. */
  pieces: Piece[];
  moves: number;
}

export interface LaserState {
  seed: number;
  difficulty: Difficulty;
  /** Index of the level within its difficulty. */
  level: number;
  /** Placed pieces, sorted by cell. */
  pieces: Piece[];
  /** Placements, turns and removals since the level (or the last "clear board") started. */
  moves: number;
  /** Earlier positions, oldest first. */
  undo: Snapshot[];
}

/** Undo depth kept in a save (older steps are dropped). */
export const MAX_UNDO = 300;
export const MAX_MOVES = 1_000_000;

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): LaserState {
  const normalized = normalizeSeed(seed);
  return { seed: normalized, difficulty, level: normalized % levelCount(difficulty), pieces: [], moves: 0, undo: [] };
}

/** The seeded starting state again (the seed's level, empty board). */
export const resetState = (state: LaserState): LaserState => createInitialState(state.seed, state.difficulty);

export const levelOf = (state: LaserState): Level => getLevel(state.difficulty, state.level);

/** The level with the placed pieces put on it. */
export function boardWith(level: Level, pieces: readonly Piece[]): Board {
  const cells = [...level.cells];
  for (const piece of pieces) cells[piece.cell] = piece.kind === 'blocker' ? { kind: 'blocker' } : { kind: piece.kind, orient: piece.orient };
  return { width: level.width, height: level.height, cells };
}

export const boardOf = (state: LaserState): Board => boardWith(levelOf(state), state.pieces);

export const evaluateState = (state: LaserState): Evaluation => evaluate(boardOf(state));

export const isSolved = (state: LaserState): boolean => evaluateState(state).solved;

export const pieceAt = (state: LaserState, cell: number): Piece | undefined => state.pieces.find((piece) => piece.cell === cell);

/** Pieces of `kind` still in the inventory. */
export const remaining = (state: LaserState, kind: PieceKind): number =>
  levelOf(state).inventory[kind] - state.pieces.filter((piece) => piece.kind === kind).length;

/** Records the current position for Undo and applies `pieces`/`moves`. */
function commit(state: LaserState, pieces: Piece[], moves: number): LaserState {
  const undo = [...state.undo, { pieces: state.pieces, moves: state.moves }].slice(-MAX_UNDO);
  return { ...state, pieces: [...pieces].sort((a, b) => a.cell - b.cell), moves: Math.min(moves, MAX_MOVES), undo };
}

/** True when a piece of `kind` can be placed on `cell` right now. */
export function canPlace(state: LaserState, cell: number, kind: PieceKind): boolean {
  const level = levelOf(state);
  return (
    level.cells[cell]?.kind === 'empty' &&
    !pieceAt(state, cell) &&
    remaining(state, kind) > 0 &&
    !isSolved(state)
  );
}

/** Places a piece of `kind` (turned `/`) on an empty square. Same object when not possible. */
export function placePiece(state: LaserState, cell: number, kind: PieceKind): LaserState {
  if (!canPlace(state, cell, kind)) return state;
  return commit(state, [...state.pieces, { cell, kind, orient: 0 }], state.moves + 1);
}

/** Turns the placed mirror or splitter on `cell` (`/` ↔ `\`). Same object when not possible. */
export function rotatePiece(state: LaserState, cell: number): LaserState {
  const piece = pieceAt(state, cell);
  if (!piece || piece.kind === 'blocker' || isSolved(state)) return state;
  const turned: Piece = { ...piece, orient: piece.orient === 0 ? 1 : 0 };
  return commit(state, state.pieces.map((p) => (p === piece ? turned : p)), state.moves + 1);
}

/** Takes the placed piece on `cell` back into the inventory. Same object when not possible. */
export function removePiece(state: LaserState, cell: number): LaserState {
  const piece = pieceAt(state, cell);
  if (!piece || isSolved(state)) return state;
  return commit(state, state.pieces.filter((p) => p !== piece), state.moves + 1);
}

export const canClear = (state: LaserState): boolean => state.pieces.length > 0 && !isSolved(state);

/** Takes every piece back and starts counting moves afresh; Undo brings the pieces back. */
export function clearBoard(state: LaserState): LaserState {
  return canClear(state) ? commit(state, [], 0) : state;
}

export const canUndo = (state: LaserState): boolean => state.undo.length > 0 && !isSolved(state);

export function undo(state: LaserState): LaserState {
  if (!canUndo(state)) return state;
  const previous = state.undo[state.undo.length - 1] as Snapshot;
  return { ...state, pieces: previous.pieces, moves: previous.moves, undo: state.undo.slice(0, -1) };
}

/** Switches to level `index` of the same difficulty with an empty board. */
export function chooseLevel(state: LaserState, index: number): LaserState {
  if (!isInt(index, 0, levelCount(state.difficulty) - 1)) return state;
  if (index === state.level && state.pieces.length === 0 && state.undo.length === 0 && state.moves === 0) return state;
  return { ...state, level: index, pieces: [], moves: 0, undo: [] };
}

/* ---------- Validation ---------- */

function isPieceList(value: unknown, level: Level): value is Piece[] {
  if (!Array.isArray(value)) return false;
  const used = { mirror: 0, splitter: 0, blocker: 0 };
  let previous = -1;
  for (const item of value as unknown[]) {
    if (!isRecord(item) || Object.keys(item).length !== 3) return false;
    const { cell, kind, orient } = item;
    if (!isInt(cell, previous + 1, level.cells.length - 1) || level.cells[cell]!.kind !== 'empty') return false;
    if (!isOneOf(kind, PIECE_KINDS) || !isOneOf(orient, [0, 1] as const)) return false;
    if (kind === 'blocker' && orient !== 0) return false;
    used[kind]++;
    previous = cell;
  }
  return PIECE_KINDS.every((kind) => used[kind] <= level.inventory[kind]);
}

/** Structural and cross-field validation of untrusted saved data. Never throws. */
export function isLaserState(value: unknown): value is LaserState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, level, pieces, moves, undo: history } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES)) return false;
    if (!isInt(level, 0, levelCount(difficulty) - 1)) return false;
    const parsed = getLevel(difficulty, level);
    if (!isPieceList(pieces, parsed) || !isInt(moves, 0, MAX_MOVES)) return false;
    if (!Array.isArray(history) || history.length > MAX_UNDO) return false;
    return history.every(
      (snapshot: unknown) => isRecord(snapshot) && isPieceList(snapshot.pieces, parsed) && isInt(snapshot.moves, 0, MAX_MOVES)
    );
  } catch {
    return false;
  }
}
