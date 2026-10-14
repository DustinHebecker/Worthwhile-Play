import { beforeAll, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { LEVELS, type LevelSource } from '../src/levels';
import {
  append,
  canUndo,
  chooseLevel,
  clearProgram,
  closeBlock,
  cloneState,
  createInitialState,
  cycleTimes,
  DIFFICULTIES,
  expand,
  getLevel,
  isLogicPathState,
  itemLength,
  LevelFormatError,
  levelCount,
  levelOf,
  MAX_BODY,
  MAX_STEPS,
  MAX_TIMES,
  MAX_UNDO,
  paletteOf,
  parseLevel,
  programLength,
  progressOf,
  remaining,
  removeAt,
  resetState,
  run,
  runProgram,
  shownResult,
  step,
  toDifficulty,
  turnLeft,
  turnRight,
  undo,
  wallAhead,
  type Cmd,
  type Dir,
  type Item,
  type Level,
  type LogicPathState
} from '../src/rules';
import { simulate, solve, type OracleItem } from './oracle';

const lvl = (map: string[], limit = 10, minimal = 1): Level => parseLevel({ map, limit, minimal });

/* A small open test board: robot at (1,1) facing up, goal at (0,3), star at (2,2), wall at (2,0). */
const OPEN = ['...G', '.^..', '#.*.'];

const cmdArb = fc.constantFrom<Cmd>('F', 'L', 'R', 'C');
const itemArb: fc.Arbitrary<Item> = fc.oneof(
  cmdArb,
  fc.record({ repeat: fc.integer({ min: 2, max: MAX_TIMES }), body: fc.array(cmdArb, { maxLength: MAX_BODY }) })
);
const programArb = fc.array(itemArb, { maxLength: 30 });
const levelArb = fc.constantFrom(...DIFFICULTIES).chain((d) => fc.integer({ min: 0, max: 7 }).map((i) => ({ d, i })));

describe('parseLevel', () => {
  it('reads size, walls, goal, stars, robot and limits', () => {
    const level = lvl(OPEN, 9, 4);
    expect(level.width).toBe(4);
    expect(level.height).toBe(3);
    expect(level.goal).toBe(3);
    expect(level.stars).toEqual([10]);
    expect(level.start).toEqual({ row: 1, col: 1, dir: 0 });
    expect(level.walls.filter(Boolean)).toHaveLength(1);
    expect(level.walls[8]).toBe(true);
    expect(level.walls[9]).toBe(false);
    expect(level.limit).toBe(9);
    expect(level.minimal).toBe(4);
  });

  it('reads every robot facing', () => {
    expect(lvl(['>G']).start.dir).toBe(1);
    expect(lvl(['vG']).start.dir).toBe(2);
    expect(lvl(['<G']).start.dir).toBe(3);
    expect(lvl(['^G']).start.dir).toBe(0);
  });

  it('accepts 7×7 and rejects bigger, empty or ragged maps', () => {
    const row = '.......';
    expect(lvl(['^.....G', row, row, row, row, row, row]).width).toBe(7);
    expect(() => lvl(['^......G'])).toThrow(LevelFormatError);
    expect(() => lvl(['^G', ...Array.from({ length: 7 }, () => '..')])).toThrow(LevelFormatError);
    expect(() => lvl([])).toThrow(LevelFormatError);
    expect(() => lvl([''])).toThrow(LevelFormatError);
    expect(() => lvl(['^G', '.'])).toThrow(/width/);
  });

  it('rejects missing or duplicate goal/robot and unknown glyphs', () => {
    expect(() => lvl(['^..'])).toThrow(/no goal/);
    expect(() => lvl(['G..'])).toThrow(/no robot/);
    expect(() => lvl(['^GG'])).toThrow(/more than one goal/);
    expect(() => lvl(['^>G'])).toThrow(/more than one robot/);
    expect(() => lvl(['^xG'])).toThrow(/unknown glyph/);
    expect(() => lvl(['^ G'])).toThrow(/unknown glyph/);
    try {
      lvl(['^']);
    } catch (error) {
      expect(error).toBeInstanceOf(LevelFormatError);
      expect((error as Error).name).toBe('LevelFormatError');
    }
    expect.assertions(8);
  });

  it('rejects inconsistent limits', () => {
    expect(() => lvl(['^G'], 0, 1)).toThrow(/bad limit/);
    expect(() => lvl(['^G'], 21, 1)).toThrow(/bad limit/);
    expect(() => lvl(['^G'], 5, 6)).toThrow(/bad limit/);
    expect(() => lvl(['^G'], 5, 0)).toThrow(/bad limit/);
    expect(lvl(['^G'], 20, 20).limit).toBe(20);
  });
});

describe('levels', () => {
  it('has 8 levels per difficulty, all parseable, at most 7×7, distinct', () => {
    for (const d of DIFFICULTIES) {
      expect(levelCount(d)).toBe(8);
      const maps = new Set<string>();
      for (let i = 0; i < 8; i++) {
        const level = getLevel(d, i);
        expect(level.width).toBeLessThanOrEqual(7);
        expect(level.height).toBeLessThanOrEqual(7);
        expect(getLevel(d, i)).toBe(level);
        maps.add((LEVELS[d][i] as LevelSource).map.join('|'));
      }
      expect(maps.size).toBe(8);
    }
    expect(() => getLevel('easy', 8)).toThrow(/no level easy\/8/);
    expect(() => getLevel('hard', -1)).toThrow(RangeError);
  });

  it('no program within a level limit can reach the step limit', () => {
    // Most steps per token: a full repeat block, MAX_TIMES × MAX_BODY steps for 1 + MAX_BODY tokens.
    const perToken = (MAX_TIMES * MAX_BODY) / (1 + MAX_BODY);
    for (const d of DIFFICULTIES) for (let i = 0; i < 8; i++) expect(getLevel(d, i).limit * perToken).toBeLessThan(MAX_STEPS);
  });

  describe('oracle: every level is solvable within its limit with the recorded minimal length', { timeout: 120_000 }, () => {
    const commandsOf = { easy: ['F', 'L', 'R'], medium: ['F', 'L', 'R'], hard: ['F', 'L', 'R', 'C'] } as const;
    for (const d of DIFFICULTIES) {
      for (let i = 0; i < 8; i++) {
        it(`${d} ${i + 1}`, () => {
          const source = LEVELS[d][i] as LevelSource;
          const answer = solve(source.map, { commands: commandsOf[d], repeat: d !== 'easy', maxLength: source.limit });
          expect(answer.minimal).toBe(source.minimal);
          expect(answer.minimal).toBeLessThanOrEqual(source.limit);
          // The witness also solves the level in the game's own interpreter.
          const level = getLevel(d, i);
          const program = answer.program as Item[];
          expect(programLength(program)).toBe(source.minimal);
          expect(run(level, program).outcome).toBe('goal');
          // Each tier needs its new concept: without it, the limit is not enough.
          if (d === 'medium') expect(solve(source.map, { commands: ['F', 'L', 'R'], repeat: false, maxLength: source.limit }).minimal).toBeNull();
          if (d === 'hard') expect(solve(source.map, { commands: ['F', 'L', 'R'], repeat: true, maxLength: source.limit }).minimal).toBeNull();
        });
      }
    }
  });
});

describe('programs', () => {
  it('counts tokens: simple 1, repeat 1 + body', () => {
    expect(itemLength('F')).toBe(1);
    expect(itemLength({ repeat: 3, body: ['F', 'L'] })).toBe(3);
    expect(itemLength({ repeat: 5, body: [] })).toBe(1);
    expect(programLength([])).toBe(0);
    expect(programLength(['F', { repeat: 2, body: ['R', 'F', 'F'] }, 'L'])).toBe(6);
  });

  it('expands repeat blocks with source positions', () => {
    expect([...expand(['L', { repeat: 2, body: ['F', 'R'] }, 'C'])]).toEqual([
      { cmd: 'L', item: 0, sub: -1 },
      { cmd: 'F', item: 1, sub: 0 },
      { cmd: 'R', item: 1, sub: 1 },
      { cmd: 'F', item: 1, sub: 0 },
      { cmd: 'R', item: 1, sub: 1 },
      { cmd: 'C', item: 2, sub: -1 }
    ]);
    expect([...expand([{ repeat: 4, body: [] }])]).toEqual([]);
  });
});

describe('interpreter', () => {
  // Built in beforeAll (not at collection time) so mutation testing can attribute coverage.
  let level: Level;
  beforeAll(() => {
    level = lvl(OPEN);
  });

  it('turns left and right', () => {
    expect(turnLeft(0)).toBe(3);
    expect(turnLeft(3)).toBe(2);
    expect(turnRight(3)).toBe(0);
    expect(turnRight(1)).toBe(2);
    expect(step(level, { row: 1, col: 1, dir: 0 }, 'L')).toEqual({ row: 1, col: 1, dir: 3 });
    expect(step(level, { row: 1, col: 1, dir: 0 }, 'R')).toEqual({ row: 1, col: 1, dir: 1 });
  });

  it('moves forward in every direction', () => {
    expect(step(level, { row: 1, col: 1, dir: 0 }, 'F')).toEqual({ row: 0, col: 1, dir: 0 });
    expect(step(level, { row: 1, col: 1, dir: 1 }, 'F')).toEqual({ row: 1, col: 2, dir: 1 });
    expect(step(level, { row: 1, col: 1, dir: 2 }, 'F')).toEqual({ row: 2, col: 1, dir: 2 });
    expect(step(level, { row: 1, col: 1, dir: 3 }, 'F')).toEqual({ row: 1, col: 0, dir: 3 });
  });

  it('treats walls and every board edge as blocking', () => {
    expect(wallAhead(level, { row: 1, col: 0, dir: 2 })).toBe(true); // wall at (2,0)
    expect(wallAhead(level, { row: 0, col: 1, dir: 0 })).toBe(true);
    expect(wallAhead(level, { row: 1, col: 3, dir: 1 })).toBe(true);
    expect(wallAhead(level, { row: 2, col: 1, dir: 2 })).toBe(true);
    expect(wallAhead(level, { row: 1, col: 0, dir: 3 })).toBe(true);
    expect(wallAhead(level, { row: 1, col: 1, dir: 0 })).toBe(false);
    expect(wallAhead(level, { row: 1, col: 2, dir: 1 })).toBe(false);
    expect(wallAhead(level, { row: 1, col: 1, dir: 2 })).toBe(false);
    expect(wallAhead(level, { row: 1, col: 1, dir: 3 })).toBe(false);
    expect(step(level, { row: 1, col: 0, dir: 2 }, 'F')).toBeNull();
    expect(step(level, { row: 0, col: 0, dir: 0 }, 'F')).toBeNull();
  });

  it('conditional: turns right at a wall, moves forward otherwise', () => {
    expect(step(level, { row: 1, col: 0, dir: 2 }, 'C')).toEqual({ row: 1, col: 0, dir: 3 });
    expect(step(level, { row: 0, col: 0, dir: 3 }, 'C')).toEqual({ row: 0, col: 0, dir: 0 });
    expect(step(level, { row: 1, col: 1, dir: 1 }, 'C')).toEqual({ row: 1, col: 2, dir: 1 });
  });

  it('crashes into a wall: stops there, counting the failed step', () => {
    const result = run(level, ['F', 'F', 'R', 'R']);
    expect(result.outcome).toBe('crash');
    expect(result.steps).toBe(2);
    expect(result.robot).toEqual({ row: 0, col: 1, dir: 0 });
    expect(result.frames).toHaveLength(2);
    expect(result.frames[1]).toMatchObject({ row: 0, col: 1, item: 1, sub: -1 });
  });

  it('needs every star before the goal counts and stops at the goal', () => {
    // Straight to the goal without the star: passes over it and ends.
    const direct = run(level, ['F', 'R', 'F', 'F']);
    expect(direct.outcome).toBe('ended');
    expect(direct.robot).toEqual({ row: 0, col: 3, dir: 1 });
    expect(direct.collected).toEqual([]);
    // Star first, then the goal; trailing commands are never executed.
    const program: Item[] = ['R', 'F', 'R', 'F', 'L', 'L', 'F', 'F', 'R', 'F', 'L', 'L', 'L'];
    const solved = run(level, program);
    expect(solved.outcome).toBe('goal');
    expect(solved.collected).toEqual([10]);
    expect(solved.steps).toBe(10);
    expect(solved.robot).toEqual({ row: 0, col: 3, dir: 1 });
    expect(solved.frames.map((f) => f.stars)).toEqual([0, 0, 0, 1, 1, 1, 1, 1, 1, 1]);
  });

  it('stops at the step limit', () => {
    const spin: Item[] = [{ repeat: 5, body: ['L', 'L', 'L', 'L'] }, { repeat: 5, body: ['R'] }];
    expect(run(level, spin).outcome).toBe('ended');
    expect(run(level, spin).steps).toBe(25);
    const limited = run(level, spin, 7);
    expect(limited.outcome).toBe('limit');
    expect(limited.steps).toBe(7);
    expect(limited.frames).toHaveLength(7);
    expect(run(level, ['L'], 0)).toMatchObject({ outcome: 'limit', steps: 0 });
    expect(run(level, [], 0)).toMatchObject({ outcome: 'ended', steps: 0 });
    expect(run(level, ['L'], 1)).toMatchObject({ outcome: 'ended', steps: 1 });
  });

  it('lists collected stars in ascending cell order', () => {
    // Stars at cells 5 and 1; the robot collects cell 5 first.
    const result = run(lvl(['G*.', '.^*']), ['R', 'F', 'L', 'F', 'L', 'F', 'F']);
    expect(result.outcome).toBe('goal');
    expect(result.collected).toEqual([1, 5]);
  });

  it('records the program position of each frame inside repeat blocks', () => {
    const result = run(level, ['R', { repeat: 2, body: ['L', 'R'] }]);
    expect(result.frames.map((f) => `${f.item}/${f.sub}`)).toEqual(['0/-1', '1/0', '1/1', '1/0', '1/1']);
  });

  it('property: always terminates within the step limit with one frame per step', () => {
    fc.assert(
      fc.property(levelArb, programArb, fc.integer({ min: 0, max: 150 }), ({ d, i }, program, max) => {
        const result = run(getLevel(d, i), program, max);
        expect(result.steps).toBeLessThanOrEqual(max);
        expect(result.frames).toHaveLength(result.steps);
        if (result.outcome === 'limit') expect(result.steps).toBe(max);
        const total = [...expand(program)].length;
        if (result.outcome === 'ended') expect(result.steps).toBe(total);
        else expect(result.steps).toBeLessThanOrEqual(total);
      }),
      { numRuns: 300 }
    );
  });

  it('property: turning four times (either way) or left-then-right is the identity', () => {
    fc.assert(
      fc.property(levelArb, fc.integer({ min: 0, max: 3 }), ({ d, i }, dir) => {
        const level = getLevel(d, i);
        const start = { ...level.start, dir: dir as Dir };
        let left = start;
        let right = start;
        for (let k = 0; k < 4; k++) {
          left = step(level, left, 'L') ?? left;
          right = step(level, right, 'R') ?? right;
        }
        expect(left).toEqual(start);
        expect(right).toEqual(start);
        expect(step(level, step(level, start, 'L') ?? start, 'R')).toEqual(start);
        const spun = run(level, [{ repeat: 4, body: ['R'] }]);
        expect(spun.robot).toEqual(level.start);
      })
    );
  });

  it('property: walls block — the robot never stands on a wall or leaves the board', () => {
    fc.assert(
      fc.property(levelArb, programArb, ({ d, i }, program) => {
        const level = getLevel(d, i);
        const result = run(level, program);
        for (const frame of [...result.frames, result.robot]) {
          expect(frame.row).toBeGreaterThanOrEqual(0);
          expect(frame.row).toBeLessThan(level.height);
          expect(frame.col).toBeGreaterThanOrEqual(0);
          expect(frame.col).toBeLessThan(level.width);
          expect(level.walls[frame.row * level.width + frame.col]).toBe(false);
        }
        // A crash happens exactly when the robot faced a wall on a plain forward.
        if (result.outcome === 'crash') expect(wallAhead(level, result.robot)).toBe(true);
      }),
      { numRuns: 300 }
    );
  });

  it('property: agrees with the independent reference interpreter', () => {
    fc.assert(
      fc.property(levelArb, programArb, fc.integer({ min: 0, max: 120 }), ({ d, i }, program, max) => {
        const source = LEVELS[d][i] as LevelSource;
        const mine = run(getLevel(d, i), program, max);
        const ref = simulate(source.map, program as OracleItem[], max);
        expect({ outcome: mine.outcome, r: mine.robot.row, c: mine.robot.col, d: mine.robot.dir, steps: mine.steps }).toEqual(ref);
      }),
      { numRuns: 400 }
    );
  });

  it('is deterministic', () => {
    fc.assert(
      fc.property(levelArb, programArb, ({ d, i }, program) => {
        expect(run(getLevel(d, i), program)).toEqual(run(getLevel(d, i), program));
      }),
      { numRuns: 50 }
    );
  });
});

/* ---------- Game state ---------- */

const build = (state: LogicPathState, ...entries: Parameters<typeof append>[1][]) => entries.reduce((s, e) => append(s, e), state);

describe('game state', () => {
  it('picks the level from the seed and starts empty', () => {
    const state = createInitialState(13, 'medium');
    expect(state).toEqual({
      seed: 13,
      difficulty: 'medium',
      level: 5,
      levels: Array.from({ length: 8 }, () => ({ program: [], open: false, undo: [], runs: 0, solved: false, best: 0, ran: false }))
    });
    expect(createInitialState(8).level).toBe(0);
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(5).difficulty).toBe('easy');
    expect(createInitialState(42, 'hard')).toEqual(createInitialState(42, 'hard'));
    expect(levelOf(createInitialState(3, 'hard'))).toBe(getLevel('hard', 3));
  });

  it('maps unknown difficulties to easy and gives each tier its palette', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(paletteOf(createInitialState(0, 'easy'))).toEqual(['F', 'L', 'R']);
    expect(paletteOf(createInitialState(0, 'medium'))).toEqual(['F', 'L', 'R', 'repeat']);
    expect(paletteOf(createInitialState(0, 'hard'))).toEqual(['F', 'L', 'R', 'C', 'repeat']);
  });

  it('appends simple commands and refuses entries outside the palette', () => {
    const easy = createInitialState(0, 'easy');
    const s = build(easy, 'F', 'R', 'F');
    expect(progressOf(s).program).toEqual(['F', 'R', 'F']);
    expect(progressOf(s).undo).toHaveLength(3);
    expect(append(easy, 'repeat')).toBe(easy);
    expect(append(easy, 'C')).toBe(easy);
    expect(append(createInitialState(0, 'medium'), 'C').levels[0]?.program).toEqual([]);
    expect(progressOf(append(createInitialState(0, 'hard'), 'C')).program).toEqual(['C']);
  });

  it('fills an open repeat block, closing it automatically after 4 commands', () => {
    let s = build(createInitialState(4, 'hard'), 'F', 'repeat');
    expect(progressOf(s)).toMatchObject({ program: ['F', { repeat: 2, body: [] }], open: true });
    s = build(s, 'F', 'L', 'C');
    expect(progressOf(s)).toMatchObject({ program: ['F', { repeat: 2, body: ['F', 'L', 'C'] }], open: true });
    s = append(s, 'R');
    expect(progressOf(s)).toMatchObject({ program: ['F', { repeat: 2, body: ['F', 'L', 'C', 'R'] }], open: false });
    s = append(s, 'F');
    expect(progressOf(s).program).toEqual(['F', { repeat: 2, body: ['F', 'L', 'C', 'R'] }, 'F']);
  });

  it('closes a block on request so later commands go after it', () => {
    let s = build(createInitialState(4, 'medium'), 'repeat', 'F');
    expect(closeBlock(build(createInitialState(4, 'medium'), 'F'))).toEqual(build(createInitialState(4, 'medium'), 'F'));
    s = closeBlock(s);
    expect(progressOf(s).open).toBe(false);
    expect(progressOf(s).undo).toHaveLength(3);
    s = append(s, 'L');
    expect(progressOf(s).program).toEqual([{ repeat: 2, body: ['F'] }, 'L']);
  });

  it('respects the command limit', () => {
    // Medium level 1 has limit 5.
    let s = createInitialState(0, 'medium');
    expect(levelOf(s).limit).toBe(5);
    expect(remaining(s)).toBe(5);
    s = build(s, 'F', 'F', 'F', 'F');
    expect(remaining(s)).toBe(1);
    const withRepeat = append(s, 'repeat');
    expect(programLength(progressOf(withRepeat).program)).toBe(5);
    expect(append(withRepeat, 'F')).toBe(withRepeat);
    const full = append(s, 'L');
    expect(remaining(full)).toBe(0);
    expect(append(full, 'F')).toBe(full);
    expect(append(full, 'repeat')).toBe(full);
  });

  it('removes top-level items and commands inside blocks', () => {
    const s = build(createInitialState(4, 'medium'), 'F', 'repeat', 'L', 'R');
    expect(progressOf(removeAt(s, 0)).program).toEqual([{ repeat: 2, body: ['L', 'R'] }]);
    expect(progressOf(removeAt(s, 0)).open).toBe(true);
    expect(progressOf(removeAt(s, 1, 0))).toMatchObject({ program: ['F', { repeat: 2, body: ['R'] }], open: true });
    expect(progressOf(removeAt(s, 1, 1)).program).toEqual(['F', { repeat: 2, body: ['L'] }]);
    // Removing the open block itself closes it.
    expect(progressOf(removeAt(s, 1))).toMatchObject({ program: ['F'], open: false });
    expect(removeAt(s, 2)).toBe(s);
    expect(removeAt(s, -1)).toBe(s);
    expect(removeAt(s, 1, 2)).toBe(s);
    expect(removeAt(s, 0, 0)).toBe(s);
    expect(progressOf(removeAt(s, 0)).undo).toHaveLength(5);
  });

  it('removing an earlier item keeps a later block open; closed blocks stay closed', () => {
    const closed = closeBlock(build(createInitialState(4, 'medium'), 'repeat', 'F'));
    const s = append(closed, 'L');
    expect(progressOf(removeAt(s, 1)).open).toBe(false);
  });

  it('cycles repeat counts 2 → 3 → 4 → 5 → 2', () => {
    let s = build(createInitialState(4, 'medium'), 'F', 'repeat', 'F');
    const counts: number[] = [];
    for (let k = 0; k < 5; k++) {
      s = cycleTimes(s, 1);
      const item = progressOf(s).program[1] as { repeat: number; body: Cmd[] };
      counts.push(item.repeat);
      expect(item.body).toEqual(['F']);
    }
    expect(counts).toEqual([3, 4, 5, 2, 3]);
    expect(progressOf(s).open).toBe(true);
    expect(cycleTimes(s, 0)).toBe(s);
    expect(cycleTimes(s, 2)).toBe(s);
  });

  it('clears and undoes edits one at a time', () => {
    const empty = createInitialState(2, 'easy');
    expect(canUndo(empty)).toBe(false);
    expect(undo(empty)).toBe(empty);
    expect(clearProgram(empty)).toBe(empty);
    const s = build(empty, 'F', 'L');
    const cleared = clearProgram(s);
    expect(progressOf(cleared)).toMatchObject({ program: [], open: false });
    expect(canUndo(cleared)).toBe(true);
    const back = undo(cleared);
    expect(progressOf(back).program).toEqual(['F', 'L']);
    expect(progressOf(undo(back)).program).toEqual(['F']);
    expect(undo(undo(undo(back)))).toEqual(empty);
  });

  it('undo restores an open block state', () => {
    const s = build(createInitialState(4, 'medium'), 'repeat', 'F');
    const closed = closeBlock(s);
    expect(progressOf(undo(closed)).open).toBe(true);
  });

  it('keeps at most MAX_UNDO snapshots', () => {
    let s = createInitialState(4, 'easy'); // limit 12
    for (let k = 0; k < 60; k++) s = removeAt(append(s, 'F'), 0);
    expect(progressOf(s).undo).toHaveLength(MAX_UNDO);
    expect(isLogicPathState(s)).toBe(true);
  });

  it('keeps a separate draft per level when switching', () => {
    const s = build(createInitialState(1, 'easy'), 'F', 'F');
    expect(chooseLevel(s, 1)).toBe(s);
    expect(chooseLevel(s, 8)).toBe(s);
    expect(chooseLevel(s, -1)).toBe(s);
    expect(chooseLevel(s, 1.5)).toBe(s);
    const other = chooseLevel(s, 3);
    expect(other.level).toBe(3);
    expect(progressOf(other).program).toEqual([]);
    expect(progressOf(chooseLevel(other, 1)).program).toEqual(['F', 'F']);
  });

  it('records runs, the first solve and the best length; edits hide the result', () => {
    // Easy level 1: ['.....', '>...G', '.....'], minimal 4, limit 6.
    let s = createInitialState(0, 'easy');
    expect(shownResult(s)).toBeNull();
    s = build(s, 'F', 'F');
    let out = runProgram(s);
    expect(out.result.outcome).toBe('ended');
    expect(out.firstSolve).toBe(false);
    expect(progressOf(out.state)).toMatchObject({ runs: 1, solved: false, best: 0, ran: true });
    expect(shownResult(out.state)?.outcome).toBe('ended');
    s = build(out.state, 'L', 'R', 'F', 'F');
    expect(progressOf(s).ran).toBe(false);
    out = runProgram(s);
    expect(out.result.outcome).toBe('goal');
    expect(out.firstSolve).toBe(true);
    expect(progressOf(out.state)).toMatchObject({ runs: 2, solved: true, best: 6 });
    // Shorter solution improves best; solving again is not a first solve.
    s = removeAt(removeAt(out.state, 2), 2);
    out = runProgram(s);
    expect(out.firstSolve).toBe(false);
    expect(progressOf(out.state)).toMatchObject({ runs: 3, solved: true, best: 4 });
    // A longer one does not worsen it; a failing run keeps solved.
    out = runProgram(build(out.state, 'L', 'L'));
    expect(progressOf(out.state).best).toBe(4);
    out = runProgram(append(clearProgram(out.state), 'F'));
    expect(out.result.outcome).toBe('ended');
    expect(progressOf(out.state)).toMatchObject({ runs: 5, solved: true, best: 4 });
    expect(isLogicPathState(out.state)).toBe(true);
    // Undo hides the shown result as well.
    expect(progressOf(undo(out.state)).ran).toBe(false);
  });

  it('reset returns to the seeded start; cloneState is deep', () => {
    const s = build(createInitialState(7, 'medium'), 'repeat', 'F');
    expect(resetState(s)).toEqual(createInitialState(7, 'medium'));
    const copy = cloneState(s);
    expect(copy).toEqual(s);
    ((copy.levels[7] as { program: Item[] }).program[0] as { body: Cmd[] }).body.push('L');
    (copy.levels[7] as { undo: unknown[] }).undo.pop();
    expect(progressOf(s).program).toEqual([{ repeat: 2, body: ['F'] }]);
    expect(progressOf(s).undo).toHaveLength(2);
  });
});

describe('isLogicPathState', () => {
  const valid = () => {
    const s = build(createInitialState(9, 'hard'), 'C', 'repeat', 'F');
    return JSON.parse(JSON.stringify(runProgram(s).state)) as LogicPathState & Record<string, unknown>;
  };
  const mutate = (change: (s: Record<string, unknown> & { levels: Record<string, unknown>[] }) => void) => {
    const s = valid() as unknown as Record<string, unknown> & { levels: Record<string, unknown>[] };
    change(s);
    return isLogicPathState(s);
  };
  const cur = (s: { levels: Record<string, unknown>[] }) => s.levels[1] as Record<string, unknown> & { program: unknown[]; undo: unknown[] };

  it('accepts real states', () => {
    expect(isLogicPathState(valid())).toBe(true);
    expect(isLogicPathState(createInitialState(0))).toBe(true);
    expect(valid().level).toBe(1);
  });

  it('rejects broken top-level fields', () => {
    expect(isLogicPathState(null)).toBe(false);
    expect(isLogicPathState([])).toBe(false);
    expect(mutate((s) => (s.seed = -1))).toBe(false);
    expect(mutate((s) => (s.seed = 2 ** 32))).toBe(false);
    expect(mutate((s) => (s.difficulty = 'extreme'))).toBe(false);
    expect(mutate((s) => (s.level = 8))).toBe(false);
    expect(mutate((s) => (s.level = -1))).toBe(false);
    expect(mutate((s) => s.levels.pop())).toBe(false);
    expect(mutate((s) => (s.levels = {} as never))).toBe(false);
    expect(mutate((s) => (s.levels[0] = null as never))).toBe(false);
  });

  it('rejects programs outside the language, the palette or the limit', () => {
    expect(mutate((s) => (s.difficulty = 'easy'))).toBe(false); // C and repeat not in the easy palette
    expect(mutate((s) => (s.difficulty = 'medium'))).toBe(false); // C not in the medium palette
    expect(mutate((s) => cur(s).program.push('X'))).toBe(false);
    expect(mutate((s) => cur(s).program.push(5))).toBe(false);
    expect(mutate((s) => (cur(s).program[1] = { repeat: 1, body: ['F'] }))).toBe(false);
    expect(mutate((s) => (cur(s).program[1] = { repeat: 6, body: ['F'] }))).toBe(false);
    expect(mutate((s) => Object.assign(cur(s), { open: false, program: [{ repeat: 2, body: ['F', 'F', 'F', 'F', 'F'] }] }))).toBe(false);
    expect(mutate((s) => Object.assign(cur(s), { open: false, program: [{ repeat: 2, body: ['F', 'F', 'F', 'F'] }] }))).toBe(true);
    expect(mutate((s) => (cur(s).program[1] = { repeat: 2, body: ['Q'] }))).toBe(false);
    expect(mutate((s) => (cur(s).program[1] = { repeat: 2, body: 'F' }))).toBe(false);
    expect(mutate((s) => (cur(s).program[1] = { repeat: 2, body: [], x: 1 }))).toBe(false);
    expect(mutate((s) => (cur(s).program[1] = { repeat: 2, body: [] }))).toBe(true);
    expect(mutate((s) => Object.assign(cur(s), { open: false, program: Array.from({ length: 9 }, () => 'F') }))).toBe(false); // limit 8
    expect(mutate((s) => Object.assign(cur(s), { open: false, program: Array.from({ length: 8 }, () => 'F') }))).toBe(true);
    expect(mutate((s) => (cur(s).program = 'F' as never))).toBe(false);
  });

  it('checks repeat blocks against the palette', () => {
    const easy = createInitialState(0, 'easy') as unknown as { levels: Record<string, unknown>[] };
    (easy.levels[0] as Record<string, unknown>).program = [{ repeat: 2, body: ['F'] }];
    expect(isLogicPathState(easy)).toBe(false);
    const medium = createInitialState(0, 'medium') as unknown as { levels: Record<string, unknown>[] };
    (medium.levels[0] as Record<string, unknown>).program = [{ repeat: 2, body: ['C'] }];
    expect(isLogicPathState(medium)).toBe(false);
    (medium.levels[0] as Record<string, unknown>).program = [{ repeat: 2, body: ['R'] }];
    expect(isLogicPathState(medium)).toBe(true);
    (medium.levels[0] as Record<string, unknown>).program = [null];
    expect(isLogicPathState(medium)).toBe(false);
  });

  it('returns false when reading the data throws', () => {
    const hostile = Object.defineProperty({}, 'seed', {
      enumerable: true,
      get() {
        throw new Error('boom');
      }
    });
    expect(isLogicPathState(hostile)).toBe(false);
  });

  it('checks the open flag against the last item', () => {
    expect(mutate((s) => (cur(s).open = 'yes'))).toBe(false);
    expect(mutate((s) => cur(s).program.push('F'))).toBe(false); // open but last is a command
    expect(mutate((s) => (cur(s).program = []))).toBe(false);
    expect(mutate((s) => (cur(s).program[1] = { repeat: 2, body: ['F', 'F', 'F', 'F'] }))).toBe(false); // open but full
    expect(mutate((s) => (cur(s).program[1] = { repeat: 2, body: ['F', 'F', 'F'] }))).toBe(true);
    expect(mutate((s) => ((cur(s).open = false), cur(s).program.push('F')))).toBe(true);
  });

  it('checks undo stack and stats', () => {
    expect(mutate((s) => (cur(s).undo = {} as never))).toBe(false);
    expect(mutate((s) => cur(s).undo.push({ program: ['X'], open: false }))).toBe(false);
    expect(mutate((s) => cur(s).undo.push({ program: [], open: false }))).toBe(true);
    expect(mutate((s) => (cur(s).undo = Array.from({ length: MAX_UNDO + 1 }, () => ({ program: [], open: false }))))).toBe(false);
    expect(mutate((s) => (cur(s).undo = Array.from({ length: MAX_UNDO }, () => ({ program: [], open: false }))))).toBe(true);
    expect(mutate((s) => (cur(s).runs = -1))).toBe(false);
    expect(mutate((s) => (cur(s).runs = 1.5))).toBe(false);
    expect(mutate((s) => (cur(s).ran = 1))).toBe(false);
    expect(mutate((s) => (cur(s).solved = 'no'))).toBe(false);
    expect(mutate((s) => Object.assign(cur(s), { solved: 1, best: 6 }))).toBe(false);
    expect(mutate((s) => (cur(s).best = 3))).toBe(false); // unsolved with a best
    // Solved needs a best within [minimal, limit] (hard 2: minimal 6, limit 8) and at least one run.
    expect(mutate((s) => Object.assign(cur(s), { solved: true, best: 6 }))).toBe(true);
    expect(mutate((s) => Object.assign(cur(s), { solved: true, best: 8 }))).toBe(true);
    expect(mutate((s) => Object.assign(cur(s), { solved: true, best: 5 }))).toBe(false);
    expect(mutate((s) => Object.assign(cur(s), { solved: true, best: 9 }))).toBe(false);
    expect(mutate((s) => Object.assign(cur(s), { solved: true, best: 0 }))).toBe(false);
    expect(mutate((s) => Object.assign(cur(s), { solved: true, best: 6, runs: 0 }))).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isLogicPathState(value)).not.toThrow();
      }),
      { numRuns: 500 }
    );
  });
});
