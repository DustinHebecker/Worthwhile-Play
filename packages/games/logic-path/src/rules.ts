/**
 * Robot Program (Logic Path) rules: pure, DOM-free logic and the serializable state.
 *
 * A level is a small grid (at most 7×7) with walls, one goal, optional stars and a robot
 * with a position and a facing. The player builds a program and runs it. The language:
 *
 *   F            forward one square. Moving into a wall or off the board is a crash.
 *   L / R        turn left / right on the spot.
 *   C            (hard) "if wall ahead: turn right, else forward". Never crashes.
 *   repeat n [b] (medium, hard) run the body `b` (0–4 simple commands, no nesting) n times,
 *                2 ≤ n ≤ 5.
 *
 * Program length = number of tokens: each simple command counts 1, a repeat block counts
 * 1 plus its body. Each level caps the length.
 *
 * Execution is a pure interpreter with a step limit (every executed simple command is one
 * step). It stops as soon as the robot stands on the goal with every star collected
 * (`goal`), on a crash (`crash`), when the step limit is reached (`limit`) or when the
 * program runs out (`ended`).
 *
 * The saved state is the level choice plus, per level, the program draft, its undo stack
 * and factual stats (runs, solved, best length). Execution is derived by re-running.
 */
import { isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { LEVELS, type LevelSource } from './levels';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const COMMANDS = ['F', 'L', 'R', 'C'] as const;
export type Cmd = (typeof COMMANDS)[number];
export interface Repeat {
  repeat: number;
  body: Cmd[];
}
export type Item = Cmd | Repeat;
export type PaletteEntry = Cmd | 'repeat';

export const MIN_TIMES = 2;
export const MAX_TIMES = 5;
export const MAX_BODY = 4;
/** Hard cap on executed simple commands per run (guards against runaway programs). */
export const MAX_STEPS = 100;
/** Maximum stored undo snapshots per level. */
export const MAX_UNDO = 100;
/** Absolute cap on any level's command limit (also bounds untrusted saves). */
export const MAX_LIMIT = 20;
export const MAX_SIZE = 7;

export const PALETTES: Readonly<Record<Difficulty, readonly PaletteEntry[]>> = {
  easy: ['F', 'L', 'R'],
  medium: ['F', 'L', 'R', 'repeat'],
  hard: ['F', 'L', 'R', 'C', 'repeat']
};

/** 0 = up (north), 1 = right (east), 2 = down (south), 3 = left (west). */
export type Dir = 0 | 1 | 2 | 3;
export const DIR_NAMES = ['up', 'right', 'down', 'left'] as const;
const DR = [-1, 0, 1, 0] as const;
const DC = [0, 1, 0, -1] as const;

export interface Robot {
  row: number;
  col: number;
  dir: Dir;
}

export interface Level {
  readonly width: number;
  readonly height: number;
  /** Row-major wall flags. */
  readonly walls: readonly boolean[];
  readonly goal: number;
  /** Star cells, ascending. */
  readonly stars: readonly number[];
  readonly start: Readonly<Robot>;
  readonly limit: number;
  readonly minimal: number;
}

export class LevelFormatError extends Error {
  override name = 'LevelFormatError';
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

/* ---------- Levels ---------- */

const ROBOT_GLYPHS = '^>v<';

/**
 * Parses a level map: `#` wall, `.` floor, `G` goal, `*` star, `^ > v <` robot (facing
 * up/right/down/left) on floor. Rows must be equally wide, at most 7×7.
 */
export function parseLevel(source: LevelSource): Level {
  const rows = source.map;
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  if (height < 1 || height > MAX_SIZE || width < 1 || width > MAX_SIZE) throw new LevelFormatError('size out of range');
  const walls: boolean[] = [];
  const stars: number[] = [];
  let goal = -1;
  let start: Robot | undefined;
  rows.forEach((row, r) => {
    if (row.length !== width) throw new LevelFormatError(`row ${r} has a different width`);
    [...row].forEach((glyph, c) => {
      const cell = r * width + c;
      walls.push(glyph === '#');
      if (glyph === 'G') {
        if (goal >= 0) throw new LevelFormatError('more than one goal');
        goal = cell;
      } else if (glyph === '*') stars.push(cell);
      else if (ROBOT_GLYPHS.includes(glyph)) {
        if (start) throw new LevelFormatError('more than one robot');
        start = { row: r, col: c, dir: ROBOT_GLYPHS.indexOf(glyph) as Dir };
      } else if (glyph !== '#' && glyph !== '.') throw new LevelFormatError(`unknown glyph "${glyph}"`);
    });
  });
  if (goal < 0) throw new LevelFormatError('no goal');
  if (!start) throw new LevelFormatError('no robot');
  if (!isInt(source.limit, 1, MAX_LIMIT) || !isInt(source.minimal, 1, source.limit)) throw new LevelFormatError('bad limit');
  return { width, height, walls, goal, stars, start, limit: source.limit, minimal: source.minimal };
}

const cache = new Map<string, Level>();

export const levelCount = (difficulty: Difficulty): number => LEVELS[difficulty].length;

export function getLevel(difficulty: Difficulty, index: number): Level {
  const key = `${difficulty}/${index}`;
  let level = cache.get(key);
  if (!level) {
    const source = LEVELS[difficulty][index];
    if (!source) throw new RangeError(`no level ${key}`);
    level = parseLevel(source);
    cache.set(key, level);
  }
  return level;
}

/* ---------- Programs ---------- */

export const isRepeat = (item: Item): item is Repeat => typeof item !== 'string';

export const itemLength = (item: Item): number => (isRepeat(item) ? 1 + item.body.length : 1);

export const programLength = (program: readonly Item[]): number => program.reduce((sum, item) => sum + itemLength(item), 0);

/** Flattens a program into the sequence of simple commands it executes (with source positions). */
export function* expand(program: readonly Item[]): Generator<{ cmd: Cmd; item: number; sub: number }> {
  for (let item = 0; item < program.length; item++) {
    const entry = program[item] as Item;
    if (!isRepeat(entry)) {
      yield { cmd: entry, item, sub: -1 };
      continue;
    }
    for (let k = 0; k < entry.repeat; k++) {
      for (let sub = 0; sub < entry.body.length; sub++) yield { cmd: entry.body[sub] as Cmd, item, sub };
    }
  }
}

/* ---------- Interpreter ---------- */

export type Outcome = 'goal' | 'crash' | 'ended' | 'limit';

export interface Frame extends Robot {
  /** Number of stars collected so far. */
  stars: number;
  /** Top-level program item and body index (-1 outside a block) that produced this frame. */
  item: number;
  sub: number;
}

export interface RunResult {
  outcome: Outcome;
  /** Executed simple commands (a crashing forward counts). */
  steps: number;
  /** Robot after each executed command (the crash frame keeps the robot in place). */
  frames: Frame[];
  /** Final robot. */
  robot: Robot;
  /** Collected star cells, ascending. */
  collected: number[];
}

export const turnLeft = (dir: Dir): Dir => ((dir + 3) % 4) as Dir;
export const turnRight = (dir: Dir): Dir => ((dir + 1) % 4) as Dir;

/** True when the square in front of the robot is a wall or off the board. */
export function wallAhead(level: Level, robot: Robot): boolean {
  const row = robot.row + DR[robot.dir];
  const col = robot.col + DC[robot.dir];
  if (row < 0 || row >= level.height || col < 0 || col >= level.width) return true;
  return level.walls[row * level.width + col] === true;
}

/** Applies one simple command. Returns `null` on a crash. */
export function step(level: Level, robot: Robot, cmd: Cmd): Robot | null {
  if (cmd === 'L') return { ...robot, dir: turnLeft(robot.dir) };
  if (cmd === 'R') return { ...robot, dir: turnRight(robot.dir) };
  const blocked = wallAhead(level, robot);
  if (cmd === 'C' && blocked) return { ...robot, dir: turnRight(robot.dir) };
  if (blocked) return null;
  return { row: robot.row + DR[robot.dir], col: robot.col + DC[robot.dir], dir: robot.dir };
}

/** Runs a program from the level's start. Pure and always terminates (≤ maxSteps commands). */
export function run(level: Level, program: readonly Item[], maxSteps = MAX_STEPS): RunResult {
  let robot: Robot = { ...level.start };
  const collected = new Set<number>();
  const frames: Frame[] = [];
  let steps = 0;
  const finish = (outcome: Outcome): RunResult => ({
    outcome,
    steps,
    frames,
    robot,
    collected: [...collected].sort((a, b) => a - b)
  });
  for (const { cmd, item, sub } of expand(program)) {
    if (steps >= maxSteps) return finish('limit');
    steps++;
    const next = step(level, robot, cmd);
    if (!next) {
      frames.push({ ...robot, stars: collected.size, item, sub });
      return finish('crash');
    }
    robot = next;
    const cell = robot.row * level.width + robot.col;
    if (level.stars.includes(cell)) collected.add(cell);
    frames.push({ ...robot, stars: collected.size, item, sub });
    if (cell === level.goal && collected.size === level.stars.length) return finish('goal');
  }
  return finish('ended');
}

/* ---------- Game state ---------- */

export interface Draft {
  program: Item[];
  /** The last item is a repeat block that still receives palette commands. */
  open: boolean;
}

export interface LevelProgress extends Draft {
  undo: Draft[];
  runs: number;
  solved: boolean;
  /** Shortest program length that reached the goal, 0 = none yet. */
  best: number;
  /** The current program has been run (its result is shown). */
  ran: boolean;
}

export interface LogicPathState {
  seed: number;
  difficulty: Difficulty;
  /** Index of the current level within the difficulty. */
  level: number;
  levels: LevelProgress[];
}

const emptyProgress = (): LevelProgress => ({ program: [], open: false, undo: [], runs: 0, solved: false, best: 0, ran: false });

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): LogicPathState {
  const normalized = normalizeSeed(seed);
  const count = levelCount(difficulty);
  return { seed: normalized, difficulty, level: normalized % count, levels: Array.from({ length: count }, emptyProgress) };
}

export const resetState = (state: LogicPathState): LogicPathState => createInitialState(state.seed, state.difficulty);

export const levelOf = (state: LogicPathState): Level => getLevel(state.difficulty, state.level);
export const progressOf = (state: LogicPathState): LevelProgress => state.levels[state.level] as LevelProgress;
export const paletteOf = (state: LogicPathState): readonly PaletteEntry[] => PALETTES[state.difficulty];

const cloneItem = (item: Item): Item => (isRepeat(item) ? { repeat: item.repeat, body: [...item.body] } : item);
const cloneDraft = (draft: Draft): Draft => ({ program: draft.program.map(cloneItem), open: draft.open });

export const cloneState = (state: LogicPathState): LogicPathState => ({
  ...state,
  levels: state.levels.map((p) => ({ ...p, ...cloneDraft(p), undo: p.undo.map(cloneDraft) }))
});

const withProgress = (state: LogicPathState, update: (p: LevelProgress) => LevelProgress): LogicPathState => ({
  ...state,
  levels: state.levels.map((p, i) => (i === state.level ? update(p) : p))
});

/** Replaces the current level's draft, remembering the old one for undo. */
const edit = (state: LogicPathState, draft: Draft): LogicPathState =>
  withProgress(state, (p) => ({
    ...p,
    program: draft.program,
    open: draft.open,
    ran: false,
    undo: [...p.undo, cloneDraft(p)].slice(-MAX_UNDO)
  }));

/** Room left before the level's command limit. */
export const remaining = (state: LogicPathState): number => levelOf(state).limit - programLength(progressOf(state).program);

/** Appends a palette entry (into the open repeat block when there is one). Unchanged state when not allowed. */
export function append(state: LogicPathState, entry: PaletteEntry): LogicPathState {
  if (!paletteOf(state).includes(entry) || remaining(state) < 1) return state;
  const { program, open } = progressOf(state);
  if (entry === 'repeat') {
    return edit(state, { program: [...program.map(cloneItem), { repeat: MIN_TIMES, body: [] }], open: true });
  }
  const last = program[program.length - 1];
  if (open && last && isRepeat(last)) {
    const body = [...last.body, entry];
    return edit(state, { program: [...program.slice(0, -1).map(cloneItem), { repeat: last.repeat, body }], open: body.length < MAX_BODY });
  }
  return edit(state, { program: [...program.map(cloneItem), entry], open: false });
}

/** Closes the open repeat block, so further commands go after it. */
export function closeBlock(state: LogicPathState): LogicPathState {
  const p = progressOf(state);
  if (!p.open) return state;
  return edit(state, { program: p.program.map(cloneItem), open: false });
}

/** Removes a top-level item (sub < 0) or one command inside a repeat block. */
export function removeAt(state: LogicPathState, index: number, sub = -1): LogicPathState {
  const { program, open } = progressOf(state);
  const item = program[index];
  if (item === undefined) return state;
  if (sub < 0) {
    const next = program.filter((_, i) => i !== index).map(cloneItem);
    return edit(state, { program: next, open: open && index !== program.length - 1 });
  }
  if (!isRepeat(item) || sub >= item.body.length) return state;
  const next = program.map(cloneItem);
  next[index] = { repeat: item.repeat, body: item.body.filter((_, j) => j !== sub) };
  return edit(state, { program: next, open });
}

/** Cycles a repeat block's count 2 → 3 → 4 → 5 → 2. */
export function cycleTimes(state: LogicPathState, index: number): LogicPathState {
  const { program, open } = progressOf(state);
  const item = program[index];
  if (item === undefined || !isRepeat(item)) return state;
  const next = program.map(cloneItem);
  next[index] = { repeat: item.repeat >= MAX_TIMES ? MIN_TIMES : item.repeat + 1, body: [...item.body] };
  return edit(state, { program: next, open });
}

export function clearProgram(state: LogicPathState): LogicPathState {
  if (progressOf(state).program.length === 0) return state;
  return edit(state, { program: [], open: false });
}

export const canUndo = (state: LogicPathState): boolean => progressOf(state).undo.length > 0;

export function undo(state: LogicPathState): LogicPathState {
  const p = progressOf(state);
  const previous = p.undo[p.undo.length - 1];
  if (!previous) return state;
  return withProgress(state, (q) => ({ ...q, ...cloneDraft(previous), undo: q.undo.slice(0, -1), ran: false }));
}

export function chooseLevel(state: LogicPathState, index: number): LogicPathState {
  if (!isInt(index, 0, levelCount(state.difficulty) - 1) || index === state.level) return state;
  return { ...state, level: index };
}

export interface RunOutcome {
  state: LogicPathState;
  result: RunResult;
  /** The level was solved for the first time by this run. */
  firstSolve: boolean;
}

/** Runs the current program and records the factual stats. */
export function runProgram(state: LogicPathState): RunOutcome {
  const level = levelOf(state);
  const p = progressOf(state);
  const result = run(level, p.program);
  const reached = result.outcome === 'goal';
  const length = programLength(p.program);
  const next = withProgress(state, (q) => ({
    ...q,
    runs: q.runs + 1,
    ran: true,
    solved: q.solved || reached,
    best: reached && (q.best === 0 || length < q.best) ? length : q.best
  }));
  return { state: next, result, firstSolve: reached && !p.solved };
}

/** The result currently on display (the last run of the current program), if any. */
export const shownResult = (state: LogicPathState): RunResult | null =>
  progressOf(state).ran ? run(levelOf(state), progressOf(state).program) : null;

/* ---------- Validation ---------- */

const isCmd = (value: unknown): value is Cmd => isOneOf(value, COMMANDS);

function isItem(value: unknown, palette: readonly PaletteEntry[]): value is Item {
  if (typeof value === 'string') return isCmd(value) && palette.includes(value);
  if (!isRecord(value) || !palette.includes('repeat')) return false;
  const keys = Object.keys(value);
  return (
    keys.length === 2 &&
    isInt(value.repeat, MIN_TIMES, MAX_TIMES) &&
    Array.isArray(value.body) &&
    value.body.length <= MAX_BODY &&
    value.body.every((cmd) => isCmd(cmd) && palette.includes(cmd))
  );
}

function isDraft(value: unknown, palette: readonly PaletteEntry[], limit: number): value is Draft {
  if (!isRecord(value) || typeof value.open !== 'boolean' || !Array.isArray(value.program)) return false;
  const program: unknown[] = value.program;
  if (!program.every((item) => isItem(item, palette))) return false;
  if (programLength(program as Item[]) > limit) return false;
  if (value.open) {
    const last = program[program.length - 1] as Item | undefined;
    if (last === undefined || !isRepeat(last) || last.body.length >= MAX_BODY) return false;
  }
  return true;
}

function isLevelProgress(value: unknown, palette: readonly PaletteEntry[], level: Level): value is LevelProgress {
  if (!isRecord(value) || !isDraft(value, palette, level.limit)) return false;
  const { undo: stack, runs, solved, best, ran } = value;
  if (!Array.isArray(stack) || stack.length > MAX_UNDO || !stack.every((d) => isDraft(d, palette, level.limit))) return false;
  if (!isInt(runs, 0) || typeof solved !== 'boolean' || typeof ran !== 'boolean') return false;
  if (solved ? !isInt(best, level.minimal, level.limit) || runs < 1 : best !== 0) return false;
  return true;
}

/** Structural and cross-field validation of untrusted saved data. Never throws. */
export function isLogicPathState(value: unknown): value is LogicPathState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, level, levels } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES)) return false;
    const count = levelCount(difficulty);
    if (!isInt(level, 0, count - 1) || !Array.isArray(levels) || levels.length !== count) return false;
    const palette = PALETTES[difficulty];
    return levels.every((p, i) => isLevelProgress(p, palette, getLevel(difficulty, i)));
  } catch {
    return false;
  }
}
