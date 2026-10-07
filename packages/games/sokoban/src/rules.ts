/**
 * Crate Pusher (Sokoban-style) rules: pure, DOM-free logic and the serializable state.
 *
 * A level is a grid of walls and floor with goals, crates and one player. The player walks
 * one square at a time and pushes (never pulls) a single crate by walking into it, provided
 * the square behind the crate is free floor. The level is solved when every crate is on a goal.
 *
 * The saved state is the level identity plus the full action history, so the current
 * position is always derived by replaying it from the level's start. That gives unlimited
 * undo for free and makes restored saves exactly reproducible. History entries:
 *   - a run of LURD letters: lower case = a step, upper case = a step that pushed a crate
 *     (one keyboard/D-pad move is a one-letter entry, a tap-to-walk is one multi-letter entry);
 *   - `*` = "restart level". Restarting is recorded rather than erasing the history, so
 *     Undo right after a restart brings the previous attempt back.
 */
import { isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { LEVELS } from './levels';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const DIRECTIONS = ['u', 'd', 'l', 'r'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** History marker for "restart level". */
export const RESTART = '*';
/** Upper bound on the total history length (characters) — keeps untrusted saves small. */
export const MAX_HISTORY = 100_000;

export type Tile = 'wall' | 'floor' | 'outside';

export interface Level {
  readonly width: number;
  readonly height: number;
  /** Row-major. `outside` = floor glyphs outside the walls (not part of the room). */
  readonly tiles: readonly Tile[];
  /** Goal cells, ascending. */
  readonly goals: readonly number[];
  /** Starting crate cells, ascending. */
  readonly boxes: readonly number[];
  readonly player: number;
}

export interface Position {
  player: number;
  /** Crate cells, ascending. */
  boxes: number[];
}

export interface Progress {
  position: Position;
  /** Steps since the last restart. */
  moves: number;
  /** Pushes since the last restart. */
  pushes: number;
  solved: boolean;
}

export interface SokobanState {
  seed: number;
  difficulty: Difficulty;
  /** Index of the level within its difficulty. */
  level: number;
  history: string[];
}

export class LevelFormatError extends Error {
  override name = 'LevelFormatError';
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

const ascending = (a: number, b: number) => a - b;

/* ---------- Level parsing ---------- */

interface GlyphMeaning {
  wall?: true;
  goal?: true;
  box?: true;
  player?: true;
}

/** XSB glyphs. Short rows are padded with spaces. */
const GLYPHS: Readonly<Record<string, GlyphMeaning>> = {
  '#': { wall: true },
  ' ': {},
  '-': {},
  _: {},
  '.': { goal: true },
  $: { box: true },
  '*': { box: true, goal: true },
  '@': { player: true },
  '+': { player: true, goal: true }
};

/**
 * Parses an XSB-style level (`|`-separated rows) and validates it: exactly one player, at least
 * one crate, as many goals as crates, a room closed by walls, every crate and goal inside the
 * room and not already solved. Throws `LevelFormatError` with the reason otherwise.
 */
export function parseLevel(text: string): Level {
  const rows = text.split('|');
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  if (height < 3 || width < 3) throw new LevelFormatError('level is smaller than 3×3');
  const tiles: Tile[] = [];
  const goals: number[] = [];
  const boxes: number[] = [];
  const players: number[] = [];
  for (let r = 0; r < height; r++) {
    const row = rows[r] as string;
    for (let c = 0; c < width; c++) {
      const glyph = row[c] ?? ' ';
      const meaning = GLYPHS[glyph];
      if (!meaning) throw new LevelFormatError(`unknown glyph "${glyph}" at row ${r + 1}, column ${c + 1}`);
      const i = r * width + c;
      tiles.push(meaning.wall ? 'wall' : 'floor');
      if (meaning.goal) goals.push(i);
      if (meaning.box) boxes.push(i);
      if (meaning.player) players.push(i);
    }
  }
  if (players.length !== 1) throw new LevelFormatError(`expected exactly one player, found ${players.length}`);
  if (boxes.length === 0) throw new LevelFormatError('level has no crates');
  if (boxes.length !== goals.length) throw new LevelFormatError(`${boxes.length} crates but ${goals.length} goals`);
  const player = players[0] as number;

  // Flood fill the room from the player; reaching the border means the walls have a gap.
  const inside = new Array<boolean>(width * height).fill(false);
  inside[player] = true;
  const stack = [player];
  while (stack.length > 0) {
    const cell = stack.pop() as number;
    const r = Math.floor(cell / width);
    const c = cell % width;
    if (r === 0 || c === 0 || r === height - 1 || c === width - 1) throw new LevelFormatError('the room is not closed by walls');
    for (const next of [cell - width, cell + width, cell - 1, cell + 1]) {
      if (!inside[next] && tiles[next] === 'floor') {
        inside[next] = true;
        stack.push(next);
      }
    }
  }
  if (![...boxes, ...goals].every((cell) => inside[cell])) throw new LevelFormatError('a crate or goal lies outside the room');
  if (boxes.every((cell) => goals.includes(cell))) throw new LevelFormatError('level is already solved');
  return {
    width,
    height,
    tiles: tiles.map((tile, i) => (tile === 'floor' && !inside[i] ? 'outside' : tile)),
    goals,
    boxes,
    player
  };
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
    level = parseLevel(source.map);
    levelCache.set(key, level);
  }
  return level;
}

/** Fewest pushes that solve the level (verified by the test suite's independent solver). */
export const minPushesOf = (difficulty: Difficulty, index: number): number => {
  const source = LEVELS[difficulty][index];
  if (!source) throw new RangeError(`No level ${index} in ${difficulty}`);
  return source.minPushes;
};

/* ---------- Movement ---------- */

export function delta(width: number, direction: Direction): number {
  switch (direction) {
    case 'u':
      return -width;
    case 'd':
      return width;
    case 'l':
      return -1;
    case 'r':
      return 1;
  }
}

export const startPosition = (level: Level): Position => ({ player: level.player, boxes: [...level.boxes] });

const isFree = (level: Level, boxes: readonly number[], cell: number) => level.tiles[cell] === 'floor' && !boxes.includes(cell);

/** One step of the player. `null` when blocked by a wall or by a crate that cannot move. */
export function step(level: Level, position: Position, direction: Direction): { position: Position; pushed: boolean } | null {
  const d = delta(level.width, direction);
  const next = position.player + d;
  if (level.tiles[next] !== 'floor') return null;
  if (!position.boxes.includes(next)) return { position: { player: next, boxes: [...position.boxes] }, pushed: false };
  const target = next + d;
  if (!isFree(level, position.boxes, target)) return null;
  return { position: { player: next, boxes: position.boxes.map((b) => (b === next ? target : b)).sort(ascending) }, pushed: true };
}

export const isSolvedPosition = (level: Level, position: Position): boolean => position.boxes.every((b) => level.goals.includes(b));

export const boxesOnGoals = (level: Level, position: Position): number => position.boxes.filter((b) => level.goals.includes(b)).length;

/**
 * Replays a history from the level start. Returns `null` if the history is not one the rules
 * can produce: a blocked step, a letter whose case disagrees with whether it pushed, anything
 * after the level was solved, or a restart with nothing to restart.
 */
export function replay(level: Level, history: readonly string[]): Progress | null {
  let position = startPosition(level);
  let moves = 0;
  let pushes = 0;
  let solved = false;
  for (const entry of history) {
    if (solved) return null;
    if (entry === RESTART) {
      if (moves === 0) return null;
      position = startPosition(level);
      moves = 0;
      pushes = 0;
      continue;
    }
    if (!/^[udlrUDLR]+$/.test(entry)) return null;
    for (const letter of entry) {
      if (solved) return null;
      const direction = letter.toLowerCase() as Direction;
      const result = step(level, position, direction);
      if (!result || result.pushed !== (letter !== direction)) return null;
      position = result.position;
      moves++;
      if (result.pushed) pushes++;
      solved = isSolvedPosition(level, position);
    }
  }
  return { position, moves, pushes, solved };
}

/**
 * Shortest walk (no pushing) from the player to `target`, as lower-case LURD letters.
 * `''` when already there, `null` when the target is not reachable without pushing.
 * Neighbours are explored in u, d, l, r order, so the path is deterministic.
 */
export function pathTo(level: Level, position: Position, target: number): string | null {
  if (target === position.player) return '';
  // Breadth-first search; `from` records how each cell was first reached (the start points to itself).
  const from = new Map<number, [number, Direction]>([[position.player, [position.player, 'u']]]);
  const queue = [position.player];
  for (const cell of queue) {
    for (const direction of DIRECTIONS) {
      const next = cell + delta(level.width, direction);
      if (from.has(next) || !isFree(level, position.boxes, next)) continue;
      from.set(next, [cell, direction]);
      if (next === target) {
        let path = '';
        for (let at = target; at !== position.player; ) {
          const [previous, dir] = from.get(at) as [number, Direction];
          path = dir + path;
          at = previous;
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

/** Direction from `from` to an orthogonally adjacent `to`, else `null`. */
export function directionBetween(level: Level, from: number, to: number): Direction | null {
  for (const direction of DIRECTIONS) {
    if (from + delta(level.width, direction) !== to) continue;
    // Horizontal neighbours must share the row (no wrapping around the grid edge).
    if ((direction === 'l' || direction === 'r') && Math.floor(from / level.width) !== Math.floor(to / level.width)) continue;
    return direction;
  }
  return null;
}

/* ---------- Deadlock detection (advisory only) ---------- */

/** Cells from which a lone crate could still be pushed onto some goal (ignoring other crates). */
export function liveCells(level: Level): boolean[] {
  const live = new Array<boolean>(level.tiles.length).fill(false);
  const queue = [...level.goals];
  for (const goal of queue) live[goal] = true;
  for (const cell of queue) {
    for (const direction of DIRECTIONS) {
      const d = delta(level.width, direction);
      // A crate at `from` pushed by a player standing at `from - d` arrives at `cell`.
      const from = cell - d;
      if (live[from] || level.tiles[from] !== 'floor' || level.tiles[from - d] !== 'floor') continue;
      live[from] = true;
      queue.push(from);
    }
  }
  return live;
}

/**
 * Crates that can provably never reach a goal any more: a crate off goal on a dead cell, or
 * an off-goal crate in a 2×2 block made only of walls and crates (none of them can move).
 * Ascending. This is a simple, sound check — it does not find every deadlock.
 */
export function deadBoxes(level: Level, position: Position): number[] {
  const live = liveCells(level);
  const w = level.width;
  const solid = (cell: number) => level.tiles[cell] !== 'floor' || position.boxes.includes(cell);
  return position.boxes.filter((box) => {
    if (level.goals.includes(box)) return false;
    if (!live[box]) return true;
    // Each `corner` is the top-left cell of a 2×2 block containing `box`. Crates never stand
    // in the outer column of a parsed level (the room is closed), so no block wraps a row.
    for (const corner of [box, box - 1, box - w, box - w - 1]) {
      if (solid(corner) && solid(corner + 1) && solid(corner + w) && solid(corner + w + 1)) return true;
    }
    return false;
  });
}

/* ---------- Game state ---------- */

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): SokobanState {
  const normalized = normalizeSeed(seed);
  return { seed: normalized, difficulty, level: normalized % levelCount(difficulty), history: [] };
}

/** The seeded starting state again (the seed's level, empty history). */
export const resetState = (state: SokobanState): SokobanState => createInitialState(state.seed, state.difficulty);

export const levelOf = (state: SokobanState): Level => getLevel(state.difficulty, state.level);

/** Current progress of a valid state. Throws if the history cannot be replayed. */
export function progressOf(state: SokobanState): Progress {
  const progress = replay(levelOf(state), state.history);
  if (!progress) throw new Error('Invalid history');
  return progress;
}

export const historyLength = (history: readonly string[]): number => history.reduce((sum, entry) => sum + entry.length, 0);

/**
 * Appends an entry. If the history would exceed `limit` characters, the oldest attempts
 * (everything up to and including the earliest restart) are dropped; when there is no
 * restart to drop, the entry is refused and the same state is returned.
 */
export function appendEntry(state: SokobanState, entry: string, limit = MAX_HISTORY): SokobanState {
  const history = [...state.history, entry];
  while (historyLength(history) > limit) {
    const cut = history.indexOf(RESTART);
    if (cut < 0) return state;
    history.splice(0, cut + 1);
  }
  return { ...state, history };
}

/** One step in `direction` (pushing a crate if there is one). Same object when blocked or solved. */
export function move(state: SokobanState, direction: Direction): SokobanState {
  const level = levelOf(state);
  const progress = progressOf(state);
  if (progress.solved) return state;
  const result = step(level, progress.position, direction);
  if (!result) return state;
  return appendEntry(state, result.pushed ? direction.toUpperCase() : direction);
}

/** Walks to `target` along a shortest free path (one history entry). Same object if impossible. */
export function walkTo(state: SokobanState, target: number): SokobanState {
  const progress = progressOf(state);
  if (progress.solved) return state;
  const path = pathTo(levelOf(state), progress.position, target);
  return path ? appendEntry(state, path) : state;
}

/**
 * Tap/click on a cell: a crate next to the player is pushed away from the player; a free
 * reachable cell is walked to. Same object when nothing happens.
 */
export function tapCell(state: SokobanState, cell: number): SokobanState {
  const level = levelOf(state);
  // move() and walkTo() both refuse to act on a solved level.
  const { position } = progressOf(state);
  if (position.boxes.includes(cell)) {
    const direction = directionBetween(level, position.player, cell);
    return direction ? move(state, direction) : state;
  }
  return walkTo(state, cell);
}

export const canUndo = (state: SokobanState): boolean => state.history.length > 0 && !progressOf(state).solved;

/** Takes back the last entry (a step, a walk or a restart). Same object if nothing to undo or solved. */
export function undo(state: SokobanState): SokobanState {
  if (!canUndo(state)) return state;
  return { ...state, history: state.history.slice(0, -1) };
}

export function canRestart(state: SokobanState): boolean {
  const progress = progressOf(state);
  return progress.moves > 0 && !progress.solved;
}

/** Back to the level start; recorded in the history so it can be undone. */
export function restart(state: SokobanState): SokobanState {
  return canRestart(state) ? appendEntry(state, RESTART) : state;
}

/** Switches to level `index` of the same difficulty with a fresh history. */
export function chooseLevel(state: SokobanState, index: number): SokobanState {
  if (!isInt(index, 0, levelCount(state.difficulty) - 1)) return state;
  if (index === state.level && state.history.length === 0) return state;
  return { ...state, level: index, history: [] };
}

/* ---------- Validation ---------- */

/** Structural and cross-field validation of untrusted saved data. Never throws. */
export function isSokobanState(value: unknown): value is SokobanState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, level, history } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES)) return false;
    if (!isInt(level, 0, levelCount(difficulty) - 1)) return false;
    if (!Array.isArray(history)) return false;
    if (!history.every((entry): entry is string => typeof entry === 'string')) return false;
    if (historyLength(history) > MAX_HISTORY) return false;
    return replay(getLevel(difficulty, level), history) !== null;
  } catch {
    return false;
  }
}
