import { isRecord, isUint32 } from '@wp/game-core';
import { COLOUR_NAMES } from './motifs/types';

/**
 * Pixel Peel rules (design § 4), pure and DOM-free. A picture of coloured cells is peeled from the outside in by
 * shooters that run around its edge and remove only exposed cells of their own colour. The state stores the whole
 * instance (picture, lanes, witness) and the list of moves; the current position is a replay of the moves.
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

/** A shooter waiting in a slot; `lane`/`index` say where it came from (the solver's position key uses them). */
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
export const LIMITS = { minSide: 4, maxSide: 24, maxPalette: 8, maxLanes: 4, maxSlots: 5, maxShooters: 120, maxShots: 99, maxMoves: 700 } as const;

const MOVE = /^([LS])([0-4])$/;
const HEX = /^#[0-9a-f]{6}$/i;
const KEY = /^[a-z]$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toDifficulty = (value: unknown): Difficulty => ((DIFFICULTIES as readonly unknown[]).includes(value) ? (value as Difficulty) : 'easy');

// --- Track and fronts (design § 4.2) ---------------------------------------------------------------------------

const lineCache = new Map<string, number[][]>();

/**
 * The cell indices each station looks into, in scan order. Stations run from the bottom-left corner: right along
 * the bottom (columns, scanning upwards), up the right side (rows, scanning leftwards), left along the top (columns,
 * scanning downwards) and down the left side (rows, scanning rightwards).
 */
export function stationLines(w: number, h: number): number[][] {
  const key = `${w}x${h}`;
  const cached = lineCache.get(key);
  if (cached) return cached;
  const lines: number[][] = [];
  for (let i = 0; i < 2 * w + 2 * h; i++) {
    const line: number[] = [];
    if (i < w) for (let y = h - 1; y >= 0; y--) line.push(y * w + i);
    else if (i < w + h) {
      const y = h - 1 - (i - w);
      for (let x = w - 1; x >= 0; x--) line.push(y * w + x);
    } else if (i < 2 * w + h) {
      const x = w - 1 - (i - w - h);
      for (let y = 0; y < h; y++) line.push(y * w + x);
    } else {
      const y = i - 2 * w - h;
      for (let x = 0; x < w; x++) line.push(y * w + x);
    }
    lines.push(line);
  }
  lineCache.set(key, lines);
  return lines;
}

/** The front of a station: the first present cell of its line, or -1. */
export function front(cells: readonly string[], line: readonly number[]): number {
  for (const index of line) if (cells[index] !== EMPTY) return index;
  return -1;
}

/** Exposed cells: the front of at least one station, in ascending index order. */
export function exposedCells(cells: readonly string[], w: number, h: number): number[] {
  const set = new Set<number>();
  for (const line of stationLines(w, h)) {
    const f = front(cells, line);
    if (f >= 0) set.add(f);
  }
  return [...set].sort((a, b) => a - b);
}

export const exposed = (pos: Position): number[] => exposedCells(pos.cells, pos.w, pos.h);

// --- One launch (design § 4.3) ---------------------------------------------------------------------------------

export interface Hit {
  cell: number;
  station: number;
}

export interface LaunchResult {
  cells: string[];
  hits: Hit[];
  left: number;
}

/**
 * The reference launch: laps of the track while a lap hits something and shots are left. Each station fires at most
 * once per lap, at its front at the moment the shooter passes. Returns a new cells array.
 */
export function launch(cells: readonly string[], w: number, h: number, shooter: Shooter): LaunchResult {
  const out = cells.slice();
  const hits: Hit[] = [];
  let left = shooter.n;
  if (left <= 0) return { cells: out, hits, left: Math.max(0, left) };
  const lines = stationLines(w, h);
  for (;;) {
    let lapHits = 0;
    for (let i = 0; i < lines.length; i++) {
      const f = front(out, lines[i] as number[]);
      if (f >= 0 && out[f] === shooter.c) {
        out[f] = EMPTY;
        hits.push({ cell: f, station: i });
        left -= 1;
        lapHits += 1;
        if (left === 0) return { cells: out, hits, left };
      }
    }
    if (lapHits === 0) return { cells: out, hits, left };
  }
}

// --- Positions and moves (design § 4.4, § 4.5) -----------------------------------------------------------------

export function initialPosition(state: Pick<PeelState, 'picture' | 'lanes' | 'slots'>): Position {
  const { w, h, rows } = state.picture;
  const cells: string[] = [];
  for (const row of rows) for (const ch of row) cells.push(ch);
  return {
    w,
    h,
    cells,
    lanes: state.lanes,
    laneFront: state.lanes.map(() => 0),
    slots: Array.from({ length: state.slots }, () => null),
    launches: 0,
    parks: 0
  };
}

export type Reason = 'invalid' | 'empty' | 'noSlot' | 'nothing';

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
  /** Cells after the launch. */
  cells: string[];
}

export const parseMove = (move: unknown): { kind: 'L' | 'S'; index: number } | undefined => {
  if (typeof move !== 'string') return undefined;
  const m = MOVE.exec(move);
  return m ? { kind: m[1] as 'L' | 'S', index: Number(m[2]) } : undefined;
};

export const freeSlot = (pos: Position): number => pos.slots.indexOf(null);

/** What a move would do from `pos` (never throws; illegal moves say why). */
export function preview(pos: Position, move: Move): Preview {
  const none = (reason: Reason, shooter: Shooter | null = null, hits: Hit[] = [], left = 0): Preview => ({ move, legal: false, reason, shooter, hits, left, slot: -1, parks: false, cells: pos.cells });
  const parsed = parseMove(move);
  if (!parsed) return none('invalid');
  if (parsed.kind === 'L') {
    const lane = pos.lanes[parsed.index];
    if (!lane) return none('invalid');
    const shooter = lane[pos.laneFront[parsed.index] ?? lane.length];
    if (!shooter) return none('empty');
    const result = launch(pos.cells, pos.w, pos.h, shooter);
    const slot = result.left > 0 ? freeSlot(pos) : -1;
    if (result.left > 0 && slot < 0) return none('noSlot', shooter, result.hits, result.left);
    return { move, legal: true, reason: null, shooter, hits: result.hits, left: result.left, slot, parks: result.hits.length === 0, cells: result.cells };
  }
  if (parsed.index >= pos.slots.length) return none('invalid');
  const parked = pos.slots[parsed.index];
  if (!parked) return none('empty');
  const result = launch(pos.cells, pos.w, pos.h, parked);
  if (result.hits.length === 0) return none('nothing', parked, [], parked.n);
  return { move, legal: true, reason: null, shooter: parked, hits: result.hits, left: result.left, slot: result.left > 0 ? parsed.index : -1, parks: false, cells: result.cells };
}

/** Applies a move; returns `pos` itself when the move is illegal. */
export function apply(pos: Position, move: Move): Position {
  const p = preview(pos, move);
  if (!p.legal || !p.shooter) return pos;
  const parsed = parseMove(move)!;
  const slots = pos.slots.slice();
  const laneFront = pos.laneFront.slice();
  if (parsed.kind === 'L') {
    const index = laneFront[parsed.index] as number;
    laneFront[parsed.index] = index + 1;
    if (p.left > 0) slots[p.slot] = { c: p.shooter.c, n: p.left, lane: parsed.index, index };
  } else {
    const parked = slots[parsed.index] as Parked;
    slots[parsed.index] = p.left > 0 ? { ...parked, n: p.left } : null;
  }
  return { ...pos, cells: p.cells, laneFront, slots, launches: pos.launches + 1, parks: pos.parks + (p.parks ? 1 : 0) };
}

/** All moves that can be listed for a position (lanes first, then slots). */
export const candidateMoves = (pos: Position): Move[] => [...pos.lanes.map((_, i) => `L${i}`), ...pos.slots.map((_, j) => `S${j}`)];

export const legalMoves = (pos: Position): Move[] => candidateMoves(pos).filter((m) => preview(pos, m).legal);

export const isSolved = (pos: Position): boolean => pos.cells.every((c) => c === EMPTY);

/** Not solved and no legal move (design § 4.5): a calm dead end, never a loss. */
export const isStuck = (pos: Position): boolean => !isSolved(pos) && legalMoves(pos).length === 0;

/** Replays `moves` from `start`; undefined when one is illegal or there are too many. */
export function replay(start: Position, moves: readonly Move[]): Position | undefined {
  if (moves.length > LIMITS.maxMoves) return undefined;
  let pos = start;
  for (const move of moves) {
    const next = apply(pos, move);
    if (next === pos) return undefined;
    pos = next;
  }
  return pos;
}

/** The current position of a (valid) state. */
export function position(state: PeelState): Position {
  return replay(initialPosition(state), state.moves) ?? initialPosition(state);
}

/** The position after the first `k` moves. */
export const positionAt = (state: PeelState, k: number): Position => replay(initialPosition(state), state.moves.slice(0, Math.max(0, k))) ?? initialPosition(state);

// --- State changes (design § 4.6) ------------------------------------------------------------------------------

/** Plays a move; returns the same object when it is illegal. Any move discards `restartUndo`. */
export function play(state: PeelState, move: Move): PeelState {
  const pos = position(state);
  if (!preview(pos, move).legal) return state;
  return { ...state, moves: [...state.moves, move], restartUndo: null };
}

export const canUndo = (state: PeelState): boolean => !isSolved(position(state)) && (state.moves.length > 0 || (state.restartUndo?.length ?? 0) > 0);

/** One step back; right after a Restart, Undo brings the whole game back. Not offered once solved. */
export function undo(state: PeelState): PeelState {
  if (!canUndo(state)) return state;
  if (state.moves.length > 0) return { ...state, moves: state.moves.slice(0, -1), restartUndo: null };
  return { ...state, moves: state.restartUndo ?? [], restartUndo: null };
}

/** "Start this picture again": no moves, the old ones kept for one Undo. */
export function restart(state: PeelState): PeelState {
  if (state.moves.length === 0 || isSolved(position(state))) return state;
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

// --- Counting helpers for the view -----------------------------------------------------------------------------

export const filledCount = (picture: Picture): number => picture.rows.join('').replace(/\./g, '').length;
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
  for (const ch of picture.rows.join('')) if (ch !== EMPTY) need.set(ch, (need.get(ch) ?? 0) + 1);
  const have = new Map<string, number>();
  for (const lane of s.lanes) for (const sh of lane) have.set(sh.c, (have.get(sh.c) ?? 0) + sh.n);
  for (const key of keys) if ((need.get(key) ?? 0) !== (have.get(key) ?? 0)) return false;
  if (!isMoveList(s.witness) || !isMoveList(s.moves)) return false;
  if (s.restartUndo !== null && !(isMoveList(s.restartUndo) && s.restartUndo.length > 0 && s.moves.length === 0)) return false;
  const start = initialPosition({ picture, lanes: s.lanes, slots: s.slots as number });
  const solvedBy = replay(start, s.witness);
  if (!solvedBy || !isSolved(solvedBy)) return false;
  const now = replay(start, s.moves);
  if (!now) return false;
  if (s.restartUndo !== null && !replay(start, s.restartUndo)) return false;
  if (s.reported && !isSolved(now)) return false;
  return true;
}

export function isPeelState(value: unknown): value is PeelState {
  try {
    return check(value);
  } catch {
    return false;
  }
}
