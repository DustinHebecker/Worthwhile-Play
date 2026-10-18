import { isRecord, isUint32 } from '@wp/game-core';
import { COLOUR_NAMES } from './art/types';
import { cloneCursor, engineOf, exposedOf, parseMove as parseEngineMove, replayCursor, startCursor, step, tableOf, type Cursor, type Reason, type Table } from './engine';

/**
 * Pixel Peel rules (design v1 § 4, unchanged in v2), pure and DOM-free. A picture of coloured cells is peeled from
 * the outside in by shooters that run around its edge and remove only exposed cells of their own colour. The state
 * stores the whole instance (picture, lanes, witness) and the list of moves; the current position is a replay of the
 * moves through the fast engine (`engine.ts`).
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** `"L<i>"` launches the front of lane i, `"S<j>"` relaunches the shooter parked in slot j. */
export type Move = string;

export interface PaletteEntry {
  key: string;
  hex: string;
  name: string;
}

export interface Picture {
  w: number;
  h: number;
  rows: string[];
  palette: PaletteEntry[];
  backdrop: string;
}

export interface Shooter {
  c: string;
  n: number;
}

export interface PeelState {
  seed: number;
  difficulty: Difficulty;
  /** What the start screen said: `any` or a motif id. */
  choice: string;
  /** Id of the drawn motif (title and place lookup). */
  motif: string;
  picture: Picture;
  /** Initial lanes, front first. */
  lanes: Shooter[][];
  /** Number of waiting slots. */
  slots: number;
  /** A move list that solves the initial position (never shown; backs the hint). */
  witness: Move[];
  moves: Move[];
  /** Moves before the last Restart, until the next move. */
  restartUndo: Move[] | null;
  /** `finished()` already called. */
  reported: boolean;
}

/** A shooter waiting in a slot; `lane`/`index` say where it came from. */
export interface Parked extends Shooter {
  lane: number;
  index: number;
}

export interface Position {
  w: number;
  h: number;
  /** Row-major, palette key or `.` (transparent or removed). */
  cells: string[];
  lanes: Shooter[][];
  /** Index of the next shooter in each lane (`lanes[i].length` when the lane is empty). */
  laneFront: number[];
  slots: (Parked | null)[];
  launches: number;
  parks: number;
}

export const EMPTY = '.';
/** Bounds of a valid state (design v2 § 7). */
export const LIMITS = { minSide: 4, maxSide: 48, maxPalette: 20, maxLanes: 4, maxSlots: 6, maxShooters: 160, maxShots: 99, maxMoves: 2500 } as const;

const MOVE = /^([LS])([0-5])$/;
const HEX = /^#[0-9a-f]{6}$/i;
const KEY = /^[a-z]$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toDifficulty = (value: unknown): Difficulty => ((DIFFICULTIES as readonly unknown[]).includes(value) ? (value as Difficulty) : 'easy');

export { stationLines } from './engine';
export type { Reason } from './engine';

// --- Positions: plain views of an engine cursor ----------------------------------------------------------------

interface Backing {
  table: Table;
  cursor: Cursor;
}

/** The engine cursor behind each position (positions are plain data; the cursor is never exposed). */
const backing = new WeakMap<Position, Backing>();

const tableCache = new WeakMap<object, Map<number, Table>>();

/** The engine table of a state's picture and lanes (memoised per lanes array and slot count). */
export function tableOfState(state: Pick<PeelState, 'picture' | 'lanes' | 'slots'>): Table {
  let bySlots = tableCache.get(state.lanes);
  if (!bySlots) {
    bySlots = new Map();
    tableCache.set(state.lanes, bySlots);
  }
  const cached = bySlots.get(state.slots);
  if (cached && cached.engine === engineOf(state.picture)) return cached;
  const table = tableOf(engineOf(state.picture), state.lanes, state.slots);
  bySlots.set(state.slots, table);
  return table;
}

/** Builds the plain position of a cursor. */
export function positionOf(table: Table, lanes: Shooter[][], cursor: Cursor): Position {
  const { engine } = table;
  const cells: string[] = new Array<string>(engine.colour.length);
  for (let i = 0; i < cells.length; i++) cells[i] = cursor.cells.present[i] ? (engine.keys[(engine.colour[i] as number) - 1] as string) : EMPTY;
  const pos: Position = {
    w: engine.w,
    h: engine.h,
    cells,
    lanes,
    laneFront: Array.from(cursor.laneFront),
    slots: cursor.slots.map((s) => (s ? { c: engine.keys[s.c - 1] as string, n: s.n, lane: s.lane, index: s.index } : null)),
    launches: cursor.launches,
    parks: cursor.parks
  };
  backing.set(pos, { table, cursor });
  return pos;
}

/** The engine table and a private copy of the cursor behind a position. */
export function cursorOf(pos: Position): Backing {
  const b = backing.get(pos);
  if (b) return { table: b.table, cursor: cloneCursor(b.cursor) };
  // A hand-made position (tests): its current cells become the picture.
  const keys = [...new Set([...pos.cells.filter((c) => c !== EMPTY), ...pos.lanes.flat().map((s) => s.c), ...pos.slots.flatMap((s) => (s ? [s.c] : []))])];
  const rows: string[] = [];
  for (let y = 0; y < pos.h; y++) rows.push(pos.cells.slice(y * pos.w, (y + 1) * pos.w).join(''));
  const table = tableOf(engineOf({ w: pos.w, h: pos.h, rows, palette: keys.map((key) => ({ key })) }), pos.lanes, pos.slots.length);
  const cursor = startCursor(table);
  pos.laneFront.forEach((k, i) => (cursor.laneFront[i] = k));
  cursor.slots = pos.slots.map((s) => (s ? { c: table.engine.codes.get(s.c) ?? 0, n: s.n, lane: s.lane, index: s.index } : null));
  cursor.launches = pos.launches;
  cursor.parks = pos.parks;
  return { table, cursor };
}

export function initialPosition(state: Pick<PeelState, 'picture' | 'lanes' | 'slots'>): Position {
  const table = tableOfState(state);
  return positionOf(table, state.lanes, startCursor(table));
}

export interface Hit {
  cell: number;
  station: number;
}

export interface Preview {
  move: Move;
  legal: boolean;
  /** Why the move is not legal (null when legal). */
  reason: Reason | null;
  /** The shooter this move launches (null for an empty lane or slot). */
  shooter: Shooter | null;
  /** Cells removed, in hit order. */
  hits: Hit[];
  /** Shots left after the launch. */
  left: number;
  /** Slot the shooter waits in afterwards (-1 when used up or illegal). */
  slot: number;
  /** A lane launch that hits nothing (moving a shooter aside). */
  parks: boolean;
}

export const parseMove = (move: unknown): { kind: 'L' | 'S'; index: number } | undefined => (typeof move === 'string' && MOVE.test(move) ? parseEngineMove(move) : undefined);

export const freeSlot = (pos: Position): number => pos.slots.indexOf(null);

/** What a move would do from `pos` (never throws; illegal moves say why). */
export function preview(pos: Position, move: Move): Preview {
  const parsed = parseMove(move);
  if (!parsed) return { move, legal: false, reason: 'invalid', shooter: null, hits: [], left: 0, slot: -1, parks: false };
  const { table, cursor } = cursorOf(pos);
  const hits: Hit[] = [];
  const o = step(table, cursor, parsed.kind, parsed.index, false, (cell, station) => hits.push({ cell, station }));
  const shooter = o.shooter ? { c: table.engine.keys[o.shooter.c - 1] as string, n: o.shooter.n } : null;
  return { move, legal: o.legal, reason: o.reason, shooter, hits: o.reason === 'nothing' ? [] : hits, left: o.left, slot: o.slot, parks: o.parks };
}

/** Applies a move; returns `pos` itself when the move is illegal. */
export function apply(pos: Position, move: Move): Position {
  const parsed = parseMove(move);
  if (!parsed) return pos;
  const { table, cursor } = cursorOf(pos);
  if (!step(table, cursor, parsed.kind, parsed.index, true).legal) return pos;
  return positionOf(table, pos.lanes, cursor);
}

/** All moves that can be listed for a position (lanes first, then slots). */
export const candidateMoves = (pos: Position): Move[] => [...pos.lanes.map((_, i) => `L${i}`), ...pos.slots.map((_, j) => `S${j}`)];

export const legalMoves = (pos: Position): Move[] => candidateMoves(pos).filter((m) => preview(pos, m).legal);

export const isSolved = (pos: Position): boolean => {
  const b = backing.get(pos);
  return b ? b.cursor.cells.left === 0 : pos.cells.every((c) => c === EMPTY);
};

/** Not solved and no legal move (design § 4.5): a calm dead end, never a loss. */
export const isStuck = (pos: Position): boolean => !isSolved(pos) && legalMoves(pos).length === 0;

/** Replays `moves` from `start`; undefined when one is illegal or there are too many. */
export function replay(start: Position, moves: readonly Move[]): Position | undefined {
  if (moves.length > LIMITS.maxMoves) return undefined;
  if (moves.some((m) => !parseMove(m))) return undefined;
  const { table, cursor } = cursorOf(start);
  const end = replayCursor(table, moves, cursor);
  return end ? positionOf(table, start.lanes, end) : undefined;
}

/** The engine cursor after `moves` from the start of `state` (undefined when one is illegal). */
export function cursorAfter(state: Pick<PeelState, 'picture' | 'lanes' | 'slots'>, moves: readonly Move[]): { table: Table; cursor: Cursor } | undefined {
  if (moves.length > LIMITS.maxMoves || moves.some((m) => !parseMove(m))) return undefined;
  const table = tableOfState(state);
  const cursor = replayCursor(table, moves);
  return cursor ? { table, cursor } : undefined;
}

/** The current position of a (valid) state. */
export function position(state: PeelState): Position {
  return replay(initialPosition(state), state.moves) ?? initialPosition(state);
}

/** The position after the first `k` moves. */
export const positionAt = (state: PeelState, k: number): Position => replay(initialPosition(state), state.moves.slice(0, Math.max(0, k))) ?? initialPosition(state);

export const exposed = (pos: Position): number[] => {
  const { table, cursor } = cursorOf(pos);
  return exposedOf(table.engine, cursor.cells);
};

// --- State changes (design § 4.6) ------------------------------------------------------------------------------

const solvedAfter = (state: PeelState, moves: readonly Move[]): boolean => cursorAfter(state, moves)?.cursor.cells.left === 0;

/** Plays a move; returns the same object when it is illegal. Any move discards `restartUndo`. */
export function play(state: PeelState, move: Move): PeelState {
  const now = cursorAfter(state, state.moves);
  const parsed = parseMove(move);
  if (!now || !parsed || !step(now.table, now.cursor, parsed.kind, parsed.index, false).legal) return state;
  return { ...state, moves: [...state.moves, move], restartUndo: null };
}

export const canUndo = (state: PeelState): boolean => !solvedAfter(state, state.moves) && (state.moves.length > 0 || (state.restartUndo?.length ?? 0) > 0);

/** One step back; right after a Restart, Undo brings the whole game back. Not offered once solved. */
export function undo(state: PeelState): PeelState {
  if (!canUndo(state)) return state;
  if (state.moves.length > 0) return { ...state, moves: state.moves.slice(0, -1), restartUndo: null };
  return { ...state, moves: state.restartUndo ?? [], restartUndo: null };
}

/** "Start this picture again": no moves, the old ones kept for one Undo. */
export function restart(state: PeelState): PeelState {
  if (state.moves.length === 0 || solvedAfter(state, state.moves)) return state;
  return { ...state, moves: [], restartUndo: state.moves };
}

/** Back to the position after the first `k` moves (the hint's undo target). */
export function undoTo(state: PeelState, k: number): PeelState {
  if (!Number.isInteger(k) || k < 0 || k >= state.moves.length) return state;
  return { ...state, moves: state.moves.slice(0, k), restartUndo: null };
}

/** `GameInstance.reset()`: the same picture and lanes, no moves. */
export const resetState = (state: PeelState): PeelState => ({ ...state, moves: [], restartUndo: null, reported: false });

export const settingsOf = (state: PeelState): { difficulty: Difficulty; motif: string } => ({ difficulty: state.difficulty, motif: state.choice });

// --- Counting helpers ------------------------------------------------------------------------------------------

export const filledCount = (picture: Picture): number => engineOf(picture).filled;
export const presentCount = (pos: Position): number => pos.cells.reduce((n, c) => n + (c === EMPTY ? 0 : 1), 0);

/** Shooters still to play (lanes and slots) of one colour. */
export function shootersOf(pos: Position, c: string): number {
  let n = 0;
  pos.lanes.forEach((lane, i) => {
    for (let k = pos.laneFront[i] as number; k < lane.length; k++) if ((lane[k] as Shooter).c === c) n++;
  });
  for (const s of pos.slots) if (s?.c === c) n++;
  return n;
}

// --- Validation (never throws) ---------------------------------------------------------------------------------

const isStringArray = (v: unknown, max: number): v is string[] => Array.isArray(v) && v.length <= max && v.every((x) => typeof x === 'string');

function isPicture(v: unknown): v is Picture {
  if (!isRecord(v)) return false;
  const { w, h, rows, palette, backdrop } = v;
  if (!Number.isInteger(w) || !Number.isInteger(h)) return false;
  if ((w as number) < LIMITS.minSide || (w as number) > LIMITS.maxSide || (h as number) < LIMITS.minSide || (h as number) > LIMITS.maxSide) return false;
  if (typeof backdrop !== 'string' || !HEX.test(backdrop)) return false;
  if (!Array.isArray(palette) || palette.length < 1 || palette.length > LIMITS.maxPalette) return false;
  const keys = new Set<string>();
  for (const entry of palette) {
    if (!isRecord(entry)) return false;
    if (typeof entry.key !== 'string' || !KEY.test(entry.key) || keys.has(entry.key)) return false;
    if (typeof entry.hex !== 'string' || !HEX.test(entry.hex)) return false;
    if (!(COLOUR_NAMES as readonly unknown[]).includes(entry.name)) return false;
    keys.add(entry.key);
  }
  if (!isStringArray(rows, LIMITS.maxSide) || rows.length !== h) return false;
  let filled = 0;
  for (const row of rows) {
    if (row.length !== w) return false;
    for (const ch of row) {
      if (ch === EMPTY) continue;
      if (!keys.has(ch)) return false;
      filled++;
    }
  }
  return filled > 0;
}

function isLanes(v: unknown, keys: Set<string>): v is Shooter[][] {
  if (!Array.isArray(v) || v.length < 1 || v.length > LIMITS.maxLanes) return false;
  let total = 0;
  for (const lane of v) {
    if (!Array.isArray(lane)) return false;
    for (const s of lane) {
      if (!isRecord(s) || typeof s.c !== 'string' || !keys.has(s.c)) return false;
      if (!Number.isInteger(s.n) || (s.n as number) < 1 || (s.n as number) > LIMITS.maxShots) return false;
      total++;
    }
  }
  return total >= 1 && total <= LIMITS.maxShooters;
}

const isMoveList = (v: unknown): v is Move[] => Array.isArray(v) && v.length <= LIMITS.maxMoves && v.every((m) => parseMove(m) !== undefined);

function check(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const s = value;
  if (!isUint32(s.seed)) return false;
  if (!(DIFFICULTIES as readonly unknown[]).includes(s.difficulty)) return false;
  if (typeof s.choice !== 'string' || s.choice.length > 32 || !ID.test(s.choice)) return false;
  if (typeof s.motif !== 'string' || s.motif.length > 32 || !ID.test(s.motif)) return false;
  if (!isPicture(s.picture)) return false;
  const picture = s.picture;
  const keys = new Set(picture.palette.map((p) => p.key));
  if (!isLanes(s.lanes, keys)) return false;
  if (!Number.isInteger(s.slots) || (s.slots as number) < 1 || (s.slots as number) > LIMITS.maxSlots) return false;
  if (typeof s.reported !== 'boolean') return false;
  // Invariant: per colour, the shots of all shooters equal the filled cells of that colour.
  const need = new Map<string, number>();
  for (const row of picture.rows) for (const ch of row) if (ch !== EMPTY) need.set(ch, (need.get(ch) ?? 0) + 1);
  const have = new Map<string, number>();
  for (const lane of s.lanes) for (const sh of lane) have.set(sh.c, (have.get(sh.c) ?? 0) + sh.n);
  for (const key of keys) if ((need.get(key) ?? 0) !== (have.get(key) ?? 0)) return false;
  if (!isMoveList(s.witness) || !isMoveList(s.moves)) return false;
  if (s.restartUndo !== null && !(isMoveList(s.restartUndo) && s.restartUndo.length > 0 && s.moves.length === 0)) return false;
  // A fresh table: the validated object is not yet a trusted state, so nothing is memoised for it.
  const table = tableOf(engineOf({ ...picture }), s.lanes, s.slots as number);
  const solvedBy = replayCursor(table, s.witness);
  if (!solvedBy || solvedBy.cells.left !== 0) return false;
  const now = replayCursor(table, s.moves);
  if (!now) return false;
  if (s.restartUndo !== null && !replayCursor(table, s.restartUndo)) return false;
  if (s.reported && now.cells.left !== 0) return false;
  return true;
}

export function isPeelState(value: unknown): value is PeelState {
  try {
    return check(value);
  } catch {
    return false;
  }
}

/**
 * v1 → v2 (design v2 § 8): identity. Every v1 state lies inside the v2 bounds, the rules are unchanged and the colour
 * vocabulary is a superset, so a v1 save replays identically. Anything else is unknown.
 */
export function migrateState(state: unknown, from: number): PeelState | undefined {
  return from === 1 ? (state as PeelState) : undefined;
}
