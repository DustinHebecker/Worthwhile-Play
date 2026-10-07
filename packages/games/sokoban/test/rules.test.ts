// @ts-nocheck
import { beforeEach, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import { LEVELS } from '../src/levels';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIRECTIONS,
  LevelFormatError,
  MAX_HISTORY,
  RESTART,
  appendEntry,
  boxesOnGoals,
  canRestart,
  canUndo,
  chooseLevel,
  createInitialState,
  deadBoxes,
  delta,
  directionBetween,
  getLevel,
  historyLength,
  isSokobanState,
  isSolvedPosition,
  levelCount,
  levelOf,
  liveCells,
  minPushesOf,
  move,
  parseLevel,
  pathTo,
  progressOf,
  replay,
  resetState,
  restart,
  startPosition,
  step,
  tapCell,
  toDifficulty,
  undo,
  walkTo,
  type Difficulty,
  type Direction,
  type Level,
  type Position,
  type SokobanState
} from '../src/rules';
import { isSolved as oracleSolved, play, readLevel, solve, walkDistance } from './oracle';
import { SOLUTIONS } from './solutions';

/* ---------- Helpers ---------- */

const ALL = DIFFICULTIES.flatMap((difficulty) => LEVELS[difficulty].map((source, index) => ({ difficulty, index, ...source })));
const cell = (level: Level, row: number, col: number) => row * level.width + col;
const stateOf = (difficulty: Difficulty, level: number, history: string[] = []): SokobanState => ({ seed: level, difficulty, level, history });
const solution = (difficulty: Difficulty, index: number): string => SOLUTIONS[difficulty][index] as string;

/** Applies moves one by one, skipping blocked ones (as a player pressing keys would). */
const playMoves = (state: SokobanState, directions: readonly Direction[]) => directions.reduce((s, d) => move(s, d), state);

const difficultyArb = fc.constantFrom<Difficulty>(...DIFFICULTIES);
const directionArb = fc.constantFrom<Direction>(...DIRECTIONS);
const walkArb = fc.record({
  difficulty: difficultyArb,
  level: fc.integer({ min: 0, max: 7 }),
  directions: fc.array(directionArb, { maxLength: 60 })
});

/* ---------- Configuration and level set ---------- */

describe('configuration', () => {
  it('declares difficulties easy → hard and 8 levels each', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(metadata.difficulties).toEqual(DIFFICULTIES);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    for (const d of DIFFICULTIES) expect(levelCount(d)).toBe(8);
    expect(DIRECTIONS).toEqual(['u', 'd', 'l', 'r']);
    expect(RESTART).toBe('*');
    expect(MAX_HISTORY).toBe(100_000);
  });

  it('toDifficulty accepts known ids and falls back to easy', () => {
    expect(toDifficulty('easy')).toBe('easy');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('HARD')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(toDifficulty(2)).toBe('easy');
  });

  it('has distinct levels that fit a phone (≤ 7 × 9) with growing crate counts', () => {
    const crates: Record<Difficulty, [number, number]> = { easy: [1, 2], medium: [2, 3], hard: [3, 5] };
    expect(new Set(ALL.map((l) => l.map)).size).toBe(ALL.length);
    for (const { difficulty, index } of ALL) {
      const level = getLevel(difficulty, index);
      expect(level.width).toBeLessThanOrEqual(7);
      expect(level.height).toBeLessThanOrEqual(9);
      const [lo, hi] = crates[difficulty];
      expect(level.boxes.length).toBeGreaterThanOrEqual(lo);
      expect(level.boxes.length).toBeLessThanOrEqual(hi);
    }
  });

  it('orders levels by their optimal push count within each difficulty, within bounds', () => {
    const bounds: Record<Difficulty, [number, number]> = { easy: [2, 12], medium: [12, 17], hard: [19, 29] };
    for (const d of DIFFICULTIES) {
      const pushes = LEVELS[d].map((l) => l.minPushes);
      expect([...pushes].sort((a, b) => a - b)).toEqual(pushes);
      expect(Math.min(...pushes)).toBe(bounds[d][0]);
      expect(Math.max(...pushes)).toBe(bounds[d][1]);
      pushes.forEach((p, i) => expect(minPushesOf(d, i)).toBe(p));
    }
  });

  it('getLevel caches, and both lookups reject unknown indices', () => {
    expect(getLevel('easy', 3)).toBe(getLevel('easy', 3));
    expect(() => getLevel('easy', 8)).toThrow(RangeError);
    expect(() => getLevel('hard', -1)).toThrow(RangeError);
    expect(() => getLevel('hard', 9)).toThrow('No level 9 in hard');
    expect(() => minPushesOf('medium', 8)).toThrow(RangeError);
    expect(() => minPushesOf('medium', -1)).toThrow(/No level -1 in medium/);
  });
});

describe('solver proof: every level is solvable in exactly its recorded minimum of pushes', () => {
  it.each(ALL.map((l) => [`${l.difficulty} ${l.index + 1}`, l] as const))('%s', (_, { difficulty, index, map, minPushes }) => {
    const level = readLevel(map);
    // Easy and medium are also searched without dead-square pruning, which cross-checks the pruning.
    const result = solve(level, level, { prune: difficulty === 'hard' });
    expect(result?.pushes).toBe(minPushes);
    const end = play(level, result!.path);
    expect(end && oracleSolved(level, end.boxes)).toBe(true);
    // The stored fixture is a valid, optimal solution according to the oracle as well.
    const fixture = play(level, solution(difficulty, index));
    expect(fixture?.pushes).toBe(minPushes);
    expect(oracleSolved(level, fixture!.boxes)).toBe(true);
  }, 30_000);

  it('the stored solutions solve every level through the real rules, one key press at a time', () => {
    for (const { difficulty, index, minPushes } of ALL) {
      const letters = [...solution(difficulty, index)].map((ch) => ch.toLowerCase() as Direction);
      const solved = playMoves(stateOf(difficulty, index), letters);
      const progress = progressOf(solved);
      expect(progress.solved).toBe(true);
      expect(progress.pushes).toBe(minPushes);
      expect(progress.moves).toBe(letters.length);
      expect(solved.history.join('')).toBe(solution(difficulty, index));
      expect(isSokobanState(solved)).toBe(true);
    }
  });
});

/* ---------- Parsing ---------- */

describe('parseLevel', () => {
  it('reads walls, floor, goals, crates and the player', () => {
    const level = parseLevel('#####|#@$.#|#####');
    expect(level.width).toBe(5);
    expect(level.height).toBe(3);
    expect(level.tiles).toEqual([...Array(5).fill('wall'), 'wall', 'floor', 'floor', 'floor', 'wall', ...Array(5).fill('wall')]);
    expect(level.goals).toEqual([8]);
    expect(level.boxes).toEqual([7]);
    expect(level.player).toBe(6);
  });

  it('supports crate/player on goal, alternative floor glyphs and marks space outside the walls', () => {
    const level = parseLevel('  ####|###-_#|#+$_*#|######');
    expect(level.width).toBe(6);
    expect(level.tiles.slice(0, 3)).toEqual(['outside', 'outside', 'wall']);
    expect(level.tiles[cell(level, 1, 3)]).toBe('floor');
    expect(level.tiles[cell(level, 1, 4)]).toBe('floor');
    expect(level.tiles[cell(level, 2, 3)]).toBe('floor');
    expect(level.goals).toEqual([cell(level, 2, 1), cell(level, 2, 4)]);
    expect(level.boxes).toEqual([cell(level, 2, 2), cell(level, 2, 4)]);
    expect(level.player).toBe(cell(level, 2, 1));
  });

  it('accepts the smallest closed rooms (3 wide or 3 high)', () => {
    expect(parseLevel('###|#@#|#$#|#.#|###').width).toBe(3);
    expect(parseLevel('#####|#@$.#|#####').height).toBe(3);
  });

  it('pads short rows: missing cells count as outside floor', () => {
    const level = parseLevel('####|#@$.#|######');
    expect(level.width).toBe(6);
    expect(level.tiles[4]).toBe('outside');
    expect(level.tiles[5]).toBe('outside');
    expect(level.tiles[cell(level, 1, 5)]).toBe('outside');
  });

  it.each([
    ['too small', '###|#@#', /smaller than 3×3/],
    ['too narrow', '##|@$|##', /smaller than 3×3/],
    ['unknown glyph', '#####|#@$x#|#####', /unknown glyph "x" at row 2, column 4/],
    ['no player', '#####|# $.#|#####', /exactly one player, found 0/],
    ['two players', '#######|#@$.@ #|#######', /exactly one player, found 2/],
    ['no crates', '#####|#@ .#|#####', /no crates/],
    ['more crates than goals', '######|#@$$.#|######', /2 crates but 1 goals/],
    ['more goals than crates', '######|#@$..#|######', /1 crates but 2 goals/],
    ['open side', '#####|#@$. |#####', /not closed/],
    ['open bottom', '#####|#@$.#|## ##', /not closed/],
    ['open top', '## ##|#@$.#|#####', /not closed/],
    ['open left', '#####| @$.#|#####', /not closed/],
    ['crate in a separate room', '#########|#@$.#$ .#|#########', /outside the room/],
    ['goal in a separate room', '#########|#@$.# $.#|#########', /outside the room/],
    ['already solved', '#####|#@* #|#####', /already solved/]
  ])('rejects a level with %s', (_, text, message) => {
    expect(() => parseLevel(text)).toThrow(LevelFormatError);
    expect(() => parseLevel(text)).toThrow(message);
  });

  it('LevelFormatError is a named Error', () => {
    const error = new LevelFormatError('x');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('LevelFormatError');
  });

  it('reads every level exactly like the independent oracle reader', () => {
    for (const { map } of ALL) {
      const level = parseLevel(map);
      const oracle = readLevel(map);
      expect(level.width).toBe(oracle.w);
      expect(level.height).toBe(oracle.h);
      expect(level.tiles.map((t) => t === 'wall')).toEqual(oracle.blocked);
      expect(level.goals).toEqual([...oracle.goals].sort((a, b) => a - b));
      expect(level.boxes).toEqual(oracle.boxes);
      expect(level.player).toBe(oracle.player);
    }
  });
});

/* ---------- Movement ---------- */

describe('movement primitives', () => {
  // Built per test (not at collection time) so mutation testing attributes the coverage to tests.
  let level: Level;
  let start: Position;
  beforeEach(() => {
    level = parseLevel('#######|#  #  #|# @$  #|# $.. #|#######');
    start = startPosition(level);
  });

  it('delta maps directions to cell offsets', () => {
    expect(delta(7, 'u')).toBe(-7);
    expect(delta(7, 'd')).toBe(7);
    expect(delta(7, 'l')).toBe(-1);
    expect(delta(7, 'r')).toBe(1);
  });

  it('startPosition copies the level start', () => {
    expect(start).toEqual({ player: cell(level, 2, 2), boxes: [cell(level, 2, 3), cell(level, 3, 2)] });
    expect(start.boxes).not.toBe(level.boxes);
  });

  it('walks onto free floor without moving crates', () => {
    expect(step(level, start, 'u')).toEqual({ position: { player: cell(level, 1, 2), boxes: start.boxes }, pushed: false });
    expect(step(level, start, 'l')).toEqual({ position: { player: cell(level, 2, 1), boxes: start.boxes }, pushed: false });
  });

  it('pushes a crate onto free floor or a goal', () => {
    expect(step(level, start, 'r')).toEqual({ position: { player: cell(level, 2, 3), boxes: [cell(level, 2, 4), cell(level, 3, 2)] }, pushed: true });
    const below = { player: cell(level, 1, 4), boxes: [cell(level, 2, 4)] };
    expect(step(level, below, 'd')).toEqual({ position: { player: cell(level, 2, 4), boxes: [cell(level, 3, 4)] }, pushed: true });
  });

  it('keeps crates sorted after a push', () => {
    const position = { player: cell(level, 2, 5), boxes: [cell(level, 2, 3), cell(level, 2, 4)] };
    expect(step(level, position, 'l')).toBeNull();
    const p2 = { player: cell(level, 2, 1), boxes: [cell(level, 2, 2), cell(level, 3, 4)] };
    expect(step(level, p2, 'r')?.position.boxes).toEqual([cell(level, 2, 3), cell(level, 3, 4)]);
    const p3 = { player: cell(level, 3, 5), boxes: [cell(level, 2, 2), cell(level, 3, 4)] };
    expect(step(level, p3, 'l')?.position.boxes).toEqual([cell(level, 2, 2), cell(level, 3, 3)]);
  });

  it('is blocked by walls, by a crate against a wall and by two crates in a row', () => {
    expect(step(level, start, 'd')).toBeNull(); // crate below is against the bottom wall
    expect(step(level, { player: cell(level, 1, 1), boxes: start.boxes }, 'u')).toBeNull();
    expect(step(level, { player: cell(level, 1, 2), boxes: start.boxes }, 'r')).toBeNull();
    expect(step(level, { player: cell(level, 2, 1), boxes: [cell(level, 2, 2), cell(level, 2, 3)] }, 'r')).toBeNull();
  });

  it('treats outside cells as blocked', () => {
    const custom: Level = { width: 3, height: 1, tiles: ['floor', 'floor', 'outside'], goals: [1], boxes: [1], player: 0 };
    expect(step(custom, { player: 0, boxes: [1] }, 'r')).toBeNull();
    expect(step(custom, { player: 1, boxes: [] }, 'r')).toBeNull();
    expect(step(custom, { player: 1, boxes: [] }, 'l')).toEqual({ position: { player: 0, boxes: [] }, pushed: false });
  });

  it('isSolvedPosition and boxesOnGoals', () => {
    expect(isSolvedPosition(level, start)).toBe(false);
    expect(boxesOnGoals(level, start)).toBe(0);
    const half = { player: cell(level, 1, 1), boxes: [cell(level, 2, 3), cell(level, 3, 3)] };
    expect(boxesOnGoals(level, half)).toBe(1);
    expect(isSolvedPosition(level, half)).toBe(false);
    const done = { player: cell(level, 1, 1), boxes: [cell(level, 3, 3), cell(level, 3, 4)] };
    expect(boxesOnGoals(level, done)).toBe(2);
    expect(isSolvedPosition(level, done)).toBe(true);
  });

  it('directionBetween finds orthogonal neighbours only, without wrapping rows', () => {
    const grid: Level = { width: 5, height: 3, tiles: Array(15).fill('floor'), goals: [], boxes: [], player: 0 };
    expect(directionBetween(grid, 7, 2)).toBe('u');
    expect(directionBetween(grid, 7, 12)).toBe('d');
    expect(directionBetween(grid, 7, 6)).toBe('l');
    expect(directionBetween(grid, 7, 8)).toBe('r');
    expect(directionBetween(grid, 4, 5)).toBeNull();
    expect(directionBetween(grid, 5, 4)).toBeNull();
    expect(directionBetween(grid, 7, 9)).toBeNull();
    expect(directionBetween(grid, 7, 7)).toBeNull();
    expect(directionBetween(grid, 7, 13)).toBeNull();
  });
});

describe('pathTo', () => {
  let level: Level;
  let start: Position;
  beforeEach(() => {
    level = parseLevel('#######|#@ #  #|#  $  #|# ## .#|#######');
    start = startPosition(level);
  });

  it('finds a shortest walk around obstacles in u, d, l, r preference order', () => {
    expect(pathTo(level, start, start.player)).toBe('');
    expect(pathTo(level, start, cell(level, 1, 2))).toBe('r');
    expect(pathTo(level, start, cell(level, 3, 1))).toBe('dd');
    expect(pathTo(level, start, cell(level, 2, 2))).toBe('dr');
  });

  it('returns null for walls, crates and cells cut off by crates', () => {
    expect(pathTo(level, start, cell(level, 0, 0))).toBeNull();
    expect(pathTo(level, start, cell(level, 1, 3))).toBeNull();
    expect(pathTo(level, start, cell(level, 2, 3))).toBeNull();
    expect(pathTo(level, start, cell(level, 1, 4))).toBeNull(); // behind the crate
    expect(pathTo(level, start, cell(level, 3, 5))).toBeNull();
    const walledIn = { player: start.player, boxes: [cell(level, 1, 2), cell(level, 2, 1)] };
    expect(pathTo(level, walledIn, cell(level, 2, 2))).toBeNull();
  });

  it('agrees with the oracle on every free cell of every level start (length and endpoint)', () => {
    for (const { map } of ALL) {
      const lvl = parseLevel(map);
      const oracle = readLevel(map);
      const pos = startPosition(lvl);
      lvl.tiles.forEach((tile, target) => {
        if (tile !== 'floor') return;
        const path = pathTo(lvl, pos, target);
        const expected = pos.boxes.includes(target) ? null : walkDistance(oracle, pos.player, target, pos.boxes);
        expect(path === null ? null : path.length).toBe(expected);
        if (path !== null) {
          expect(path).toMatch(/^[udlr]*$/);
          const end = play(oracle, path);
          expect(end?.player).toBe(target);
          expect(end?.pushes).toBe(0);
        }
      });
    }
  });
});

/* ---------- Deadlocks ---------- */

describe('deadlock detection', () => {
  it('liveCells contains every goal and excludes cells along a goal-less wall', () => {
    const level = parseLevel('######|#@   #|#  $ #|# .  #|######');
    const live = liveCells(level);
    for (const goal of level.goals) expect(live[goal]).toBe(true);
    // Corners and the goal-less top and side rows can never deliver a crate to the goal.
    const dead = [[1, 1], [1, 2], [1, 3], [1, 4], [2, 1], [2, 4], [3, 1], [3, 4]];
    for (const [r, c] of dead) expect(live[cell(level, r!, c!)], `${r},${c}`).toBe(false);
    for (const [r, c] of [[2, 2], [2, 3], [3, 2], [3, 3]]) expect(live[cell(level, r!, c!)], `${r},${c}`).toBe(true);
    expect(live.filter(Boolean)).toHaveLength(4);
    expect(live[0]).toBe(false);
  });

  it('a goal in a corner is live even though no crate can be pulled out of it', () => {
    const level = parseLevel('#####|#.  #|# $ #|#@  #|#####');
    expect(liveCells(level)[cell(level, 1, 1)]).toBe(true);
    expect(deadBoxes(level, { player: cell(level, 3, 1), boxes: [cell(level, 1, 1)] })).toEqual([]);
  });

  it('only floor cells are ever live, in every level', () => {
    for (const { difficulty, index } of ALL) {
      const level = getLevel(difficulty, index);
      const live = liveCells(level);
      expect(live).toHaveLength(level.tiles.length);
      live.forEach((isLive, i) => {
        if (isLive) expect(level.tiles[i]).toBe('floor');
      });
      for (const goal of level.goals) expect(live[goal]).toBe(true);
    }
  });

  it('flags a crate pushed into a dead corner, but not a crate on a goal', () => {
    const level = parseLevel('######|#@   #|#  $ #|# .  #|######');
    expect(deadBoxes(level, startPosition(level))).toEqual([]);
    expect(deadBoxes(level, { player: cell(level, 2, 3), boxes: [cell(level, 2, 4)] })).toEqual([cell(level, 2, 4)]);
    expect(deadBoxes(level, { player: cell(level, 2, 3), boxes: [cell(level, 3, 2)] })).toEqual([]);
  });

  it('flags crates frozen in a 2×2 block of crates and walls', () => {
    const level = parseLevel('#######|#@    #|# ##  #|# $$  #|#     #|# ..  #|#######');
    const frozen = { player: cell(level, 1, 1), boxes: [cell(level, 3, 2), cell(level, 3, 3)] };
    expect(liveCells(level)[cell(level, 3, 2)]).toBe(true);
    expect(deadBoxes(level, frozen)).toEqual([cell(level, 3, 2), cell(level, 3, 3)]);
    expect(deadBoxes(level, { player: cell(level, 1, 1), boxes: [cell(level, 3, 3), cell(level, 3, 4)] })).toEqual([]);
    expect(deadBoxes(level, { player: cell(level, 1, 1), boxes: [cell(level, 4, 2), cell(level, 4, 3)] })).toEqual([]);
  });

  it('flags a 2×2 block of four crates in open floor; a goal crate inside it is not flagged', () => {
    const level = parseLevel('########|#@     #|# $$   #|# $$   #|#      #|# .... #|########');
    const block = [cell(level, 2, 2), cell(level, 2, 3), cell(level, 3, 2), cell(level, 3, 3)];
    expect(deadBoxes(level, { player: level.player, boxes: block })).toEqual(block);
    const withGoal = parseLevel('########|#@     #|# $$   #|# *$   #|#      #|# ...  #|########');
    const p = startPosition(withGoal);
    expect(deadBoxes(withGoal, p)).toEqual([cell(withGoal, 2, 2), cell(withGoal, 2, 3), cell(withGoal, 3, 3)]);
  });

  it('no level starts with a flagged crate, and no position along an optimal solution is flagged', () => {
    for (const { difficulty, index } of ALL) {
      let state = stateOf(difficulty, index);
      const level = levelOf(state);
      expect(deadBoxes(level, startPosition(level))).toEqual([]);
      for (const ch of solution(difficulty, index)) {
        state = move(state, ch.toLowerCase() as Direction);
        expect(deadBoxes(level, progressOf(state).position)).toEqual([]);
      }
    }
  });

  it('is sound: whenever it flags a crate, the oracle confirms the position is unsolvable', () => {
    fc.assert(
      fc.property(fc.constantFrom<Difficulty>('easy', 'medium'), fc.integer({ min: 0, max: 7 }), fc.array(directionArb, { maxLength: 40 }), (difficulty, index, directions) => {
        const state = playMoves(stateOf(difficulty, index), directions);
        const { position, solved } = progressOf(state);
        if (solved) return;
        const level = levelOf(state);
        if (deadBoxes(level, position).length === 0) return;
        expect(solve(readLevel(LEVELS[difficulty][index]!.map), position, { prune: false })).toBeNull();
      }),
      { numRuns: 150 }
    );
  });
});

/* ---------- Replay ---------- */

describe('replay', () => {
  let level: Level; // easy 1: '#######|#   # #|# # $@#|#  .# #|##    #| ######'
  beforeEach(() => {
    level = getLevel('easy', 0);
  });

  it('starts at the level start', () => {
    expect(replay(level, [])).toEqual({ position: startPosition(level), moves: 0, pushes: 0, solved: false });
  });

  it('counts moves and pushes per attempt; a restart resets them', () => {
    const p = replay(level, ['L', 'r', 'dd']);
    expect(p).toMatchObject({ moves: 4, pushes: 1, solved: false });
    expect(p?.position.player).toBe(cell(level, 4, 5));
    expect(p?.position.boxes).toEqual([cell(level, 2, 3)]);
    const restarted = replay(level, ['L', 'r', RESTART, 'd']);
    expect(restarted).toMatchObject({ moves: 1, pushes: 0, solved: false });
    expect(restarted?.position).toEqual({ player: cell(level, 3, 5), boxes: [cell(level, 2, 4)] });
  });

  it('marks the solved position', () => {
    const p = replay(level, [solution('easy', 0)]);
    expect(p).toMatchObject({ moves: 14, pushes: 2, solved: true });
  });

  it.each([
    ['a step into a wall', ['u', 'u']],
    ['a walk letter that pushes', ['l']],
    ['a push letter that only walks', ['D']],
    ['a restart before any move', [RESTART]],
    ['two restarts in a row', ['d', RESTART, RESTART]],
    ['an empty entry', ['']],
    ['an unknown letter', ['x']],
    ['mixed junk', ['d1']],
    ['junk before a letter', ['xd']],
    ['junk after a letter', ['dx']],
    ['a step after solving', [solution('easy', 0), 'u']],
    ['a step after solving inside the same entry', [`${solution('easy', 0)}u`]],
    ['a restart after solving', [solution('easy', 0), RESTART]]
  ])('rejects %s', (_, history) => {
    expect(replay(level, history)).toBeNull();
  });
});

/* ---------- Game state ---------- */

describe('game state', () => {
  it('createInitialState picks the level from the seed and is deterministic', () => {
    expect(createInitialState(0)).toEqual({ seed: 0, difficulty: 'easy', level: 0, history: [] });
    expect(createInitialState(13, 'hard')).toEqual({ seed: 13, difficulty: 'hard', level: 5, history: [] });
    expect(createInitialState(-1, 'medium')).toEqual({ seed: 0xffff_ffff, difficulty: 'medium', level: 7, history: [] });
    expect(createInitialState(9.9).level).toBe(1);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), difficultyArb, (seed, difficulty) => {
        const a = createInitialState(seed, difficulty);
        expect(a).toEqual(createInitialState(seed, difficulty));
        expect(a.level).toBe(seed % 8);
        expect(isSokobanState(a)).toBe(true);
      })
    );
  });

  it('move appends one letter (upper case for a push) and returns the same object when blocked', () => {
    const s0 = stateOf('easy', 0);
    expect(move(s0, 'r')).toBe(s0);
    expect(move(s0, 'u').history).toEqual(['u']);
    const s1 = move(s0, 'd');
    expect(s1.history).toEqual(['d']);
    expect(s0.history).toEqual([]);
    const s2 = move(move(s1, 'u'), 'l');
    expect(s2.history).toEqual(['d', 'u', 'L']);
    expect(progressOf(s2)).toMatchObject({ moves: 3, pushes: 1 });
  });

  it('walkTo records the whole walk as one entry', () => {
    const s0 = stateOf('easy', 0);
    const level = levelOf(s0);
    const s1 = walkTo(s0, cell(level, 4, 2));
    expect(s1.history).toEqual(['ddlll']);
    expect(progressOf(s1).position.player).toBe(cell(level, 4, 2));
    expect(walkTo(s0, level.player)).toBe(s0);
    expect(walkTo(s0, cell(level, 0, 0))).toBe(s0);
    expect(walkTo(s0, cell(level, 2, 4))).toBe(s0);
  });

  it('tapCell pushes an adjacent crate, walks to a free cell, and ignores everything else', () => {
    const s0 = stateOf('easy', 0);
    const level = levelOf(s0);
    expect(tapCell(s0, cell(level, 2, 4)).history).toEqual(['L']);
    expect(tapCell(s0, cell(level, 1, 5)).history).toEqual(['u']);
    expect(tapCell(s0, cell(level, 4, 2)).history).toEqual(['ddlll']);
    expect(tapCell(s0, cell(level, 0, 0))).toBe(s0);
    expect(tapCell(s0, level.player)).toBe(s0);
    const away = walkTo(s0, cell(level, 4, 5));
    expect(tapCell(away, cell(level, 2, 4))).toBe(away);
    // A crate next to the player that cannot move is not pushed.
    const lvl2 = getLevel('easy', 4); // '######|#  ..#|#@$  #|## #$#|#    #|######'
    const t0 = stateOf('easy', 4);
    const blocked = walkTo(t0, cell(lvl2, 4, 4));
    expect(tapCell(blocked, cell(lvl2, 3, 4))).toBe(blocked);
  });

  it('undo removes the last entry; nothing to undo or a solved level returns the same object', () => {
    const s0 = stateOf('easy', 0);
    expect(canUndo(s0)).toBe(false);
    expect(undo(s0)).toBe(s0);
    const s1 = walkTo(move(s0, 'd'), cell(levelOf(s0), 4, 2));
    expect(canUndo(s1)).toBe(true);
    expect(undo(s1).history).toEqual(['d']);
    expect(undo(undo(s1)).history).toEqual([]);
    const solved = stateOf('easy', 0, [solution('easy', 0)]);
    expect(canUndo(solved)).toBe(false);
    expect(undo(solved)).toBe(solved);
    expect(move(solved, 'u')).toBe(solved);
    expect(walkTo(solved, cell(levelOf(solved), 4, 2))).toBe(solved);
    expect(tapCell(solved, cell(levelOf(solved), 4, 2))).toBe(solved);
  });

  it('restart is recorded and can be undone', () => {
    const s0 = stateOf('easy', 0);
    expect(canRestart(s0)).toBe(false);
    expect(restart(s0)).toBe(s0);
    const s1 = move(move(s0, 'l'), 'r');
    expect(canRestart(s1)).toBe(true);
    const s2 = restart(s1);
    expect(s2.history).toEqual(['L', 'r', RESTART]);
    expect(progressOf(s2)).toEqual({ position: startPosition(levelOf(s0)), moves: 0, pushes: 0, solved: false });
    expect(canRestart(s2)).toBe(false);
    expect(restart(s2)).toBe(s2);
    expect(canUndo(s2)).toBe(true);
    expect(progressOf(undo(s2))).toEqual(progressOf(s1));
    const solved = stateOf('easy', 0, [solution('easy', 0)]);
    expect(canRestart(solved)).toBe(false);
    expect(restart(solved)).toBe(solved);
  });

  it('chooseLevel switches level with a fresh history; invalid choices are ignored', () => {
    const s0 = stateOf('medium', 2, ['u']);
    const s1 = chooseLevel(s0, 5);
    expect(s1).toEqual({ seed: 2, difficulty: 'medium', level: 5, history: [] });
    expect(chooseLevel(s1, 5)).toBe(s1);
    expect(chooseLevel(s0, 2)).toEqual({ ...s0, history: [] });
    expect(chooseLevel(s0, 7).level).toBe(7);
    expect(chooseLevel(s0, 0).level).toBe(0);
    for (const bad of [-1, 8, 1.5, Number.NaN]) expect(chooseLevel(s0, bad)).toBe(s0);
    expect(chooseLevel(stateOf('hard', 1), 4)).toEqual({ seed: 1, difficulty: 'hard', level: 4, history: [] });
    const solved = stateOf('easy', 0, [solution('easy', 0)]);
    expect(chooseLevel(solved, 0).history).toEqual([]);
  });

  it('resetState returns to the seeded level with no history', () => {
    const s = chooseLevel(move(createInitialState(11, 'hard'), 'd'), 1);
    expect(resetState(s)).toEqual(createInitialState(11, 'hard'));
  });

  it('progressOf throws for a history the rules cannot produce', () => {
    expect(() => progressOf(stateOf('easy', 0, ['r']))).toThrow('Invalid history');
  });

  it('historyLength sums entry lengths', () => {
    expect(historyLength([])).toBe(0);
    expect(historyLength(['ud', RESTART, 'L'])).toBe(4);
  });

  it('appendEntry drops the oldest attempts when over the limit, or refuses without a restart', () => {
    const s = stateOf('easy', 0, ['u', 'd', RESTART, 'l', RESTART, 'r']);
    expect(appendEntry(s, 'x', 7).history).toEqual([...s.history, 'x']);
    expect(appendEntry(s, 'x', 6).history).toEqual(['l', RESTART, 'r', 'x']);
    expect(appendEntry(s, 'xx', 3).history).toEqual(['r', 'xx']);
    expect(appendEntry(s, 'xxxx', 3)).toBe(s);
    expect(appendEntry(stateOf('easy', 0, [RESTART, 'ud']), 'x', 3).history).toEqual(['ud', 'x']);
    const noRestart = stateOf('easy', 0, ['ud', 'ud']);
    expect(appendEntry(noRestart, 'u', 4)).toBe(noRestart);
    expect(appendEntry(noRestart, 'u', 5).history).toEqual(['ud', 'ud', 'u']);
    expect(appendEntry(noRestart, 'u').history).toHaveLength(3);
  });

  it('a long session keeps working at the history limit (old attempts are dropped)', () => {
    let state = stateOf('easy', 0, ['ud'.repeat(MAX_HISTORY / 4), RESTART, 'ud'.repeat(MAX_HISTORY / 4 - 1)]);
    expect(isSokobanState(state)).toBe(true);
    state = move(state, 'u');
    expect(historyLength(state.history)).toBe(MAX_HISTORY);
    state = move(state, 'd');
    expect(state.history[0]).toBe('ud'.repeat(MAX_HISTORY / 4 - 1));
    expect(state.history.slice(1)).toEqual(['u', 'd']);
    expect(historyLength(state.history)).toBe(MAX_HISTORY / 2);
    expect(isSokobanState(state)).toBe(true);
  });
});

/* ---------- Validation ---------- */

describe('isSokobanState', () => {
  const valid = stateOf('medium', 3, ['d', RESTART, 'dd']);

  it('accepts fresh, in-progress and solved states', () => {
    expect(isSokobanState(createInitialState(5, 'hard'))).toBe(true);
    expect(isSokobanState(valid)).toBe(true);
    expect(isSokobanState(stateOf('hard', 7, [solution('hard', 7)]))).toBe(true);
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'x'],
    ['a missing history', { seed: 1, difficulty: 'easy', level: 1 }],
    ['a negative seed', { ...valid, seed: -1 }],
    ['a seed above 32 bits', { ...valid, seed: 0x1_0000_0000 }],
    ['a fractional seed', { ...valid, seed: 1.5 }],
    ['an unknown difficulty', { ...valid, difficulty: 'expert' }],
    ['a negative level', { ...valid, level: -1 }],
    ['a level past the end', { ...valid, level: 8 }],
    ['a fractional level', { ...valid, level: 1.5 }],
    ['a level given as text', { ...valid, level: '3' }],
    ['a history object', { ...valid, history: { 0: 'u' } }],
    ['a non-string history entry', { ...valid, history: [['d']] }],
    ['a history of empty entries', { ...valid, history: ['', ''] }],
    ['a numeric history entry', { ...valid, history: [1] }],
    ['an illegal history', { ...valid, history: ['l'] }],
    ['a history that is too long', { ...valid, history: ['ud'.repeat(MAX_HISTORY / 2), 'u'] }],
    ['too many history entries', { ...valid, history: Array.from({ length: MAX_HISTORY + 1 }, () => 'u') }]
  ])('rejects %s', (_, value) => {
    expect(isSokobanState(value)).toBe(false);
  });

  it('accepts a history of exactly the maximum length', () => {
    expect(isSokobanState({ ...valid, level: 0, difficulty: 'easy', history: ['ud'.repeat(MAX_HISTORY / 2)] })).toBe(true);
  });

  it('never throws, even for hostile objects', () => {
    const hostile = new Proxy({}, { get: () => { throw new Error('boom'); } });
    expect(isSokobanState(hostile)).toBe(false);
    fc.assert(fc.property(fc.anything(), (value) => {
      expect(() => isSokobanState(value)).not.toThrow();
    }));
    fc.assert(fc.property(fc.record({ seed: fc.anything(), difficulty: fc.constantFrom('easy', 'hard', 'x'), level: fc.integer({ min: -2, max: 9 }), history: fc.array(fc.string({ maxLength: 5 }), { maxLength: 5 }) }), (value) => {
      expect(typeof isSokobanState(value)).toBe('boolean');
    }));
  });
});

/* ---------- Properties ---------- */

describe('properties of legal play', () => {
  it('a legal move never creates or destroys crates or the player, nor enters walls; goal count changes only by pushing', () => {
    fc.assert(
      fc.property(walkArb, ({ difficulty, level: index, directions }) => {
        let state = stateOf(difficulty, index);
        const level = levelOf(state);
        let before = progressOf(state);
        for (const direction of directions) {
          const next = move(state, direction);
          if (next === state) continue;
          const after = progressOf(next);
          const { position: p0 } = before;
          const { position: p1 } = after;
          // Exactly one player, on floor, never on a crate; crate count and distinctness preserved.
          expect(level.tiles[p1.player]).toBe('floor');
          expect(p1.boxes).not.toContain(p1.player);
          expect(p1.boxes).toHaveLength(level.boxes.length);
          expect(new Set(p1.boxes).size).toBe(p1.boxes.length);
          for (const b of p1.boxes) expect(level.tiles[b]).toBe('floor');
          // The player moved exactly one square in the chosen direction.
          expect(p1.player - p0.player).toBe(delta(level.width, direction));
          const pushed = after.pushes === before.pushes + 1;
          expect(after.moves).toBe(before.moves + 1);
          if (pushed) {
            // Exactly one crate moved, from the player's new square one step further.
            expect(p0.boxes.filter((b) => !p1.boxes.includes(b))).toEqual([p1.player]);
            expect(p1.boxes.filter((b) => !p0.boxes.includes(b))).toEqual([p1.player + delta(level.width, direction)]);
          } else {
            expect(after.pushes).toBe(before.pushes);
            expect(p1.boxes).toEqual(p0.boxes);
            expect(boxesOnGoals(level, p1)).toBe(boxesOnGoals(level, p0));
          }
          state = next;
          before = after;
        }
        expect(isSokobanState(state)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('undo exactly inverts any move, walk or restart', () => {
    fc.assert(
      fc.property(walkArb, directionArb, fc.integer({ min: 0, max: 80 }), ({ difficulty, level, directions }, direction, target) => {
        const state = playMoves(stateOf(difficulty, level), directions);
        for (const next of [move(state, direction), walkTo(state, target), tapCell(state, target), restart(state)]) {
          if (next === state) continue;
          expect(undo(next)).toEqual(state);
          expect(progressOf(undo(next))).toEqual(progressOf(state));
        }
      }),
      { numRuns: 200 }
    );
  });

  it('the rules agree with the independent oracle on where every move sequence ends', () => {
    fc.assert(
      fc.property(walkArb, ({ difficulty, level, directions }) => {
        const state = playMoves(stateOf(difficulty, level), directions);
        const oracleEnd = play(readLevel(LEVELS[difficulty][level]!.map), state.history.join(''));
        const { position, pushes } = progressOf(state);
        expect(oracleEnd).toEqual({ player: position.player, boxes: position.boxes, pushes });
      }),
      { numRuns: 200 }
    );
  });

  it('flipping the case of any history letter makes the save invalid', () => {
    fc.assert(
      fc.property(walkArb, fc.nat(), ({ difficulty, level, directions }, pick) => {
        const state = playMoves(stateOf(difficulty, level), directions);
        const joined = state.history.join('');
        if (joined.length === 0) return;
        const i = pick % joined.length;
        const ch = joined[i]!;
        const flipped = joined.slice(0, i) + (ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase()) + joined.slice(i + 1);
        expect(isSokobanState({ ...state, history: [flipped] })).toBe(false);
        expect(isSokobanState({ ...state, history: [joined] })).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('the solved flag matches crates-on-goals and the level stays locked afterwards', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL), directionArb, ({ difficulty, index }, direction) => {
        const solved = stateOf(difficulty, index, [solution(difficulty, index)]);
        const { position } = progressOf(solved);
        const level = levelOf(solved);
        expect(isSolvedPosition(level, position)).toBe(true);
        expect(boxesOnGoals(level, position)).toBe(level.goals.length);
        expect(move(solved, direction)).toBe(solved);
      })
    );
  });

  it('positions are plain data that survive JSON round trips', () => {
    fc.assert(
      fc.property(walkArb, ({ difficulty, level, directions }) => {
        const state = playMoves(stateOf(difficulty, level), directions);
        const copy = JSON.parse(JSON.stringify(state)) as SokobanState;
        expect(copy).toEqual(state);
        expect(isSokobanState(copy)).toBe(true);
        const p: Position = progressOf(copy).position;
        expect(p).toEqual(progressOf(state).position);
      }),
      { numRuns: 100 }
    );
  });
});
