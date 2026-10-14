import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import { LEVELS, type LevelSource } from '../src/levels';
import {
  BLUE,
  COLOUR_LETTERS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIRS,
  GREEN,
  LevelFormatError,
  MAX_MOVES,
  MAX_UNDO,
  PIECE_KINDS,
  PRIMARIES,
  RED,
  WHITE,
  boardOf,
  boardWith,
  canClear,
  canPlace,
  canUndo,
  chooseLevel,
  clearBoard,
  colourFromLetter,
  colourLetter,
  createInitialState,
  evaluate,
  evaluateState,
  exits,
  getLevel,
  isColour,
  isLaserState,
  isSolved,
  levelCount,
  levelOf,
  neighbour,
  opposite,
  parseLevel,
  parseToken,
  pieceAt,
  placePiece,
  reflect,
  remaining,
  removePiece,
  resetState,
  rotatePiece,
  toDifficulty,
  traceBeams,
  undo,
  type Board,
  type Difficulty,
  type Dir,
  type Element,
  type LaserState,
  type Orientation,
  type PieceKind
} from '../src/rules';
import { letterOf, oracleSolved, oracleTrace, parseSolution, readGrid, solveByLight, solveExhaustively } from './oracle';

/* ---------- Helpers ---------- */

const boardFrom = (rows: readonly string[]): Board => {
  const grid = rows.map((row) => row.trim().split(/\s+/));
  return { width: grid[0]!.length, height: grid.length, cells: grid.flat().map(parseToken) };
};
const litLetters = (board: Board) => traceBeams(board).lit.map(colourLetter);
const at = (board: Board, row: number, col: number) => row * board.width + col;

const ALL = DIFFICULTIES.flatMap((difficulty) => LEVELS[difficulty].map((source: LevelSource, index: number) => ({ difficulty, index, source })));

const stateOf = (difficulty: Difficulty, level: number): LaserState => ({ seed: level, difficulty, level, pieces: [], moves: 0, undo: [] });

/** Applies an oracle solution through the game's own actions. */
function applySolution(state: LaserState, solution: string): LaserState {
  let s = state;
  for (const { row, col, token } of parseSolution(solution)) {
    const cell = row * levelOf(s).width + col;
    const kind: PieceKind = token === '#' ? 'blocker' : token.startsWith('S') ? 'splitter' : 'mirror';
    const before = s;
    s = placePiece(s, cell, kind);
    expect(s).not.toBe(before);
    if (token.endsWith('\\')) s = rotatePiece(s, cell);
  }
  return s;
}

/** Rotates a board 90° clockwise (directions turn with it, mirrors flip between / and \). */
function rotateBoard(board: Board): Board {
  const { width, height } = board;
  const cells: Element[] = new Array<Element>(width * height);
  board.cells.forEach((element, cell) => {
    const r = Math.floor(cell / width);
    const c = cell % width;
    const target = c * height + (height - 1 - r);
    let turned: Element = element;
    if (element.kind === 'emitter') turned = { ...element, dir: ((element.dir + 1) % 4) as Dir };
    if (element.kind === 'mirror' || element.kind === 'splitter') turned = { ...element, orient: element.orient === 0 ? 1 : 0 };
    cells[target] = turned;
  });
  return { width: height, height: width, cells };
}

const TOKENS = ['.', '#', 'X', '/', '\\', 'S/', 'S\\', '^R', '>G', 'vB', '<W', '>Y', '^M', 'vC', 'FR', 'FG', 'FB', 'FY', 'FM', 'FC', 'TR', 'TG', 'TB', 'TY', 'TM', 'TC', 'TW'];
const tokenArb = fc.oneof(
  { weight: 6, arbitrary: fc.constant('.') },
  { weight: 3, arbitrary: fc.constantFrom('/', '\\', 'S/', 'S\\') },
  { weight: 2, arbitrary: fc.constantFrom(...TOKENS) }
);
const rowsArb = fc
  .tuple(fc.integer({ min: 1, max: 7 }), fc.integer({ min: 1, max: 7 }))
  .chain(([w, h]) => fc.array(fc.array(tokenArb, { minLength: w, maxLength: w }), { minLength: h, maxLength: h }))
  .map((grid) => grid.map((row) => row.join(' ')));

/* ---------- Colours ---------- */

describe('colours', () => {
  it('maps every mask to its letter and back', () => {
    expect(COLOUR_LETTERS).toEqual(['', 'R', 'G', 'Y', 'B', 'M', 'C', 'W']);
    expect([RED, GREEN, BLUE, WHITE]).toEqual([1, 2, 4, 7]);
    expect(PRIMARIES).toEqual([1, 2, 4]);
    for (let mask = 0; mask <= 7; mask++) expect(colourFromLetter(colourLetter(mask))).toBe(mask);
    expect(colourLetter(RED | BLUE)).toBe('M');
    expect(colourLetter(RED | GREEN)).toBe('Y');
    expect(colourLetter(GREEN | BLUE)).toBe('C');
    expect(colourLetter(8)).toBe('');
    expect(colourLetter(-1)).toBe('');
    expect(colourFromLetter('Q')).toBe(0);
    expect(colourFromLetter('')).toBe(0);
    expect(colourFromLetter('r')).toBe(0);
  });

  it('accepts only the seven non-empty colour masks', () => {
    expect([0, 1, 7, 8, 1.5, '1', null].map(isColour)).toEqual([false, true, true, false, false, false, false]);
  });
});

/* ---------- Geometry ---------- */

describe('directions and mirrors', () => {
  it('has opposite directions', () => {
    expect(DIRS.map(opposite)).toEqual([2, 3, 0, 1]);
  });

  it('finds neighbours without wrapping around the edges', () => {
    // 3 wide, 2 high: cells 0 1 2 / 3 4 5
    expect(DIRS.map((d) => neighbour(3, 2, 4, d))).toEqual([1, 5, -1, 3]);
    expect(DIRS.map((d) => neighbour(3, 2, 0, d))).toEqual([-1, 1, 3, -1]);
    expect(DIRS.map((d) => neighbour(3, 2, 2, d))).toEqual([-1, -1, 5, 1]);
    expect(DIRS.map((d) => neighbour(3, 2, 3, d))).toEqual([0, 4, -1, -1]);
  });

  it('reflects like real mirrors: / swaps up↔right and down↔left, \\ swaps up↔left and down↔right', () => {
    expect(DIRS.map((d) => reflect(d, 0))).toEqual([1, 0, 3, 2]);
    expect(DIRS.map((d) => reflect(d, 1))).toEqual([3, 2, 1, 0]);
  });

  it('reflection is an involution that always turns by 90° (property)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...DIRS), fc.constantFrom<Orientation>(0, 1), (dir, orient) => {
        const out = reflect(dir, orient);
        expect(reflect(out, orient)).toBe(dir);
        expect(out % 2).not.toBe(dir % 2);
        // The two orientations send a beam to opposite sides.
        expect(reflect(dir, orient === 0 ? 1 : 0)).toBe(opposite(out));
      })
    );
  });

  it('lists where light leaves each element', () => {
    expect(exits({ kind: 'empty' }, 1, 5)).toEqual([{ dir: 1, colour: 5 }]);
    expect(exits({ kind: 'mirror', orient: 0 }, 1, 2)).toEqual([{ dir: 0, colour: 2 }]);
    expect(exits({ kind: 'mirror', orient: 1 }, 1, 2)).toEqual([{ dir: 2, colour: 2 }]);
    expect(exits({ kind: 'splitter', orient: 1 }, 0, 7)).toEqual([{ dir: 0, colour: 7 }, { dir: 3, colour: 7 }]);
    expect(exits({ kind: 'filter', colour: RED | BLUE }, 2, WHITE)).toEqual([{ dir: 2, colour: RED | BLUE }]);
    expect(exits({ kind: 'filter', colour: RED }, 2, GREEN)).toEqual([]);
    for (const element of [{ kind: 'blocker' }, { kind: 'sensor' }, { kind: 'target', colour: 1 }, { kind: 'emitter', dir: 0, colour: 1 }] as Element[]) {
      expect(exits(element, 1, WHITE)).toEqual([]);
    }
  });
});

/* ---------- Beam tracing ---------- */

describe('traceBeams', () => {
  it('sends a laser in a straight line to the edge of the board', () => {
    const board = boardFrom(['>R . .', '. . .']);
    const trace = traceBeams(board);
    expect(trace.lit).toEqual([0, 1, 1, 0, 0, 0]);
    // Sides crossed: emitter right side, middle left+right, last left+right (leaves the board).
    expect(trace.sides.slice(0, 12)).toEqual([0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1]);
    expect(trace.sides.slice(12)).toEqual(new Array(12).fill(0));
    expect([trace.width, trace.height]).toEqual([3, 2]);
  });

  it('turns at mirrors and passes and turns at splitters', () => {
    const mirrored = boardFrom(['. . .', '>G / .', '. . .']);
    expect(litLetters(mirrored)).toEqual(['', 'G', '', '', 'G', '', '', '', '']);
    const down = boardFrom(['. . .', '>G \\ .', '. . .']);
    expect(litLetters(down)).toEqual(['', '', '', '', 'G', '', '', 'G', '']);
    const split = boardFrom(['. . .', '>B S/ .', '. . .']);
    expect(litLetters(split)).toEqual(['', 'B', '', '', 'B', 'B', '', '', '']);
  });

  it('is stopped by blockers, sensors, targets and other lasers, which still receive the light', () => {
    for (const stop of ['#', 'X', 'TR', '^G']) {
      const board = boardFrom([`>R ${stop} .`]);
      expect(traceBeams(board).lit).toEqual([0, 1, 0]);
    }
    // Two lasers facing each other light each other.
    expect(traceBeams(boardFrom(['>R <G'])).lit).toEqual([GREEN, RED]);
  });

  it('lets a filter pass only the colours it contains', () => {
    for (let colour = 1; colour <= 7; colour++) {
      for (let filter = 1; filter <= 6; filter++) {
        const board = boardFrom([`>${colourLetter(colour)} F${colourLetter(filter)} .`]);
        expect(traceBeams(board).lit).toEqual([0, colour, colour & filter]);
      }
    }
  });

  it('mixes light arriving at a target additively (complete colour table)', () => {
    for (let a = 1; a <= 7; a++) {
      for (let b = 1; b <= 7; b++) {
        const board = boardFrom([`>${colourLetter(a)} . TW . <${colourLetter(b)}`]);
        expect(traceBeams(board).lit[2]).toBe(a | b);
      }
    }
  });

  it('terminates on beams caught in a mirror loop', () => {
    // The splitter feeds a closed square of mirrors; light circles forever in the physical world.
    const board = boardFrom(['. / . \\', '>R S\\ . .', '. \\ . /']);
    const trace = traceBeams(board);
    expect(trace.lit[at(board, 0, 1)]).toBe(RED);
    expect(trace.lit[at(board, 2, 3)]).toBe(RED);
    expect(trace.lit.every((mask) => mask >= 0 && mask <= 7)).toBe(true);
  });

  it('only lasers create light (filters and targets carry a colour but emit nothing)', () => {
    expect(traceBeams(boardFrom(['FR TG', 'FB TW'])).lit).toEqual([0, 0, 0, 0]);
  });

  it('ignores a dark laser and is deterministic', () => {
    const dark: Board = { width: 2, height: 1, cells: [{ kind: 'emitter', dir: 1, colour: 0 }, { kind: 'empty' }] };
    expect(traceBeams(dark).lit).toEqual([0, 0]);
    const board = boardFrom(['vR . vB', '. . .', '>G . TW']);
    expect(traceBeams(board)).toEqual(traceBeams(board));
    expect(litLetters(board)).toEqual(['', '', '', 'R', '', 'B', 'R', 'G', 'C']);
  });

  it('agrees with the independent photon-walk oracle on random boards (property)', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const board = boardFrom(rows);
        const oracle = oracleTrace(readGrid(rows)).flat().map(letterOf);
        expect(litLetters(board)).toEqual(oracle);
        expect(evaluate(board).solved).toBe(oracleSolved(readGrid(rows)));
      }),
      { numRuns: 400 }
    );
  });

  it('always terminates with masks in range and consistent sides (property)', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const board = boardFrom(rows);
        const trace = traceBeams(board);
        expect(trace.lit).toHaveLength(board.cells.length);
        expect(trace.sides).toHaveLength(board.cells.length * 4);
        expect(trace.sides.every((mask) => mask >= 0 && mask <= 7)).toBe(true);
        // A side shared by two squares carries the same light on both of them.
        board.cells.forEach((_, cell) => {
          for (const dir of DIRS) {
            const next = neighbour(board.width, board.height, cell, dir);
            if (next >= 0) expect(trace.sides[cell * 4 + dir]).toBe(trace.sides[next * 4 + opposite(dir)]);
          }
        });
        // Light entering a square crossed one of its sides.
        trace.lit.forEach((mask, cell) => {
          const crossed = DIRS.reduce<number>((acc, dir) => acc | (trace.sides[cell * 4 + dir] ?? 0), 0);
          expect(mask & ~crossed).toBe(0);
        });
      }),
      { numRuns: 300 }
    );
  });

  it('is invariant under rotating the board by 90° (property)', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const board = boardFrom(rows);
        const rotated = rotateBoard(board);
        const before = traceBeams(board).lit;
        const after = traceBeams(rotated).lit;
        before.forEach((mask, cell) => {
          const r = Math.floor(cell / board.width);
          const c = cell % board.width;
          expect(after[c * board.height + (board.height - 1 - r)]).toBe(mask);
        });
      }),
      { numRuns: 200 }
    );
  });

  it('reflects a single beam by the mirror law and leaves the straight path dark (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom(...DIRS),
        fc.constantFrom<Orientation>(0, 1),
        fc.integer({ min: 1, max: 7 }),
        (row, col, dir, orient, colour) => {
          // A 7×7 board; the mirror sits at (row, col), the laser one step before it.
          const cells: Element[] = new Array<Element>(49).fill({ kind: 'empty' });
          const mirror = row * 7 + col;
          const laser = neighbour(7, 7, mirror, opposite(dir));
          cells[laser] = { kind: 'emitter', dir, colour };
          cells[mirror] = { kind: 'mirror', orient };
          const trace = traceBeams({ width: 7, height: 7, cells });
          const out = reflect(dir, orient);
          expect(trace.sides[mirror * 4 + out]).toBe(colour);
          expect(trace.sides[mirror * 4 + dir]).toBe(0);
          const turned = neighbour(7, 7, mirror, out);
          const straight = neighbour(7, 7, mirror, dir);
          expect(trace.lit[turned]).toBe(colour);
          expect(trace.lit[straight]).toBe(0);
        }
      )
    );
  });

  it('a splitter sends the full beam both straight on and sideways (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom(...DIRS),
        fc.constantFrom<Orientation>(0, 1),
        fc.integer({ min: 1, max: 7 }),
        (row, col, dir, orient, colour) => {
          const cells: Element[] = new Array<Element>(49).fill({ kind: 'empty' });
          const splitter = row * 7 + col;
          cells[neighbour(7, 7, splitter, opposite(dir))] = { kind: 'emitter', dir, colour };
          cells[splitter] = { kind: 'splitter', orient };
          const trace = traceBeams({ width: 7, height: 7, cells });
          const out = reflect(dir, orient);
          expect(trace.sides[splitter * 4 + dir]).toBe(colour);
          expect(trace.sides[splitter * 4 + out]).toBe(colour);
          expect(trace.sides[splitter * 4 + opposite(out)]).toBe(0);
          // Exactly two branches leave the splitter, each reaching the board edge.
          const branchCells = trace.lit.filter((mask, cell) => mask !== 0 && cell !== splitter).length;
          const length = (d: Dir) => {
            let n = 0;
            for (let c = neighbour(7, 7, splitter, d); c >= 0; c = neighbour(7, 7, c, d)) n++;
            return n;
          };
          expect(branchCells).toBe(length(dir) + length(out));
        }
      )
    );
  });
});

/* ---------- Evaluation ---------- */

describe('evaluate', () => {
  it('needs every target exactly right and every forbidden sensor dark', () => {
    const board = boardFrom(['>R TR', '>B TM']);
    const result = evaluate(board);
    expect(result.targets).toEqual([
      { cell: 1, need: RED, got: RED },
      { cell: 3, need: RED | BLUE, got: BLUE }
    ]);
    expect(result.correct).toBe(1);
    expect(result.solved).toBe(false);
    expect(evaluate(boardFrom(['>R TR', '>B TB'])).solved).toBe(true);
  });

  it('fails while a forbidden sensor receives light', () => {
    const lit = evaluate(boardFrom(['>R TR', '>B X']));
    expect(lit.litSensors).toEqual([3]);
    expect(lit.correct).toBe(1);
    expect(lit.solved).toBe(false);
    const dark = evaluate(boardFrom(['>R TR', '. X']));
    expect(dark.litSensors).toEqual([]);
    expect(dark.solved).toBe(true);
  });

  it('does not count too much light as correct, and needs at least one target', () => {
    expect(evaluate(boardFrom(['>R TY <G'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>W TY .'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R . .'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R . X'])).solved).toBe(false);
  });
});

/* ---------- Level format ---------- */

describe('parseToken and parseLevel', () => {
  it('reads every token', () => {
    expect(parseToken('.')).toEqual({ kind: 'empty' });
    expect(parseToken('#')).toEqual({ kind: 'blocker' });
    expect(parseToken('X')).toEqual({ kind: 'sensor' });
    expect(parseToken('/')).toEqual({ kind: 'mirror', orient: 0 });
    expect(parseToken('\\')).toEqual({ kind: 'mirror', orient: 1 });
    expect(parseToken('S/')).toEqual({ kind: 'splitter', orient: 0 });
    expect(parseToken('S\\')).toEqual({ kind: 'splitter', orient: 1 });
    expect(parseToken('^R')).toEqual({ kind: 'emitter', dir: 0, colour: RED });
    expect(parseToken('>G')).toEqual({ kind: 'emitter', dir: 1, colour: GREEN });
    expect(parseToken('vB')).toEqual({ kind: 'emitter', dir: 2, colour: BLUE });
    expect(parseToken('<W')).toEqual({ kind: 'emitter', dir: 3, colour: WHITE });
    expect(parseToken('FC')).toEqual({ kind: 'filter', colour: GREEN | BLUE });
    expect(parseToken('TM')).toEqual({ kind: 'target', colour: RED | BLUE });
  });

  it('rejects unknown tokens and a white filter', () => {
    for (const bad of ['', '?', 'S', 'S|', 'T', 'TQ', 'TRR', 'Q1', 'xR', '>', '>Z', 'F', 'R']) expect(() => parseToken(bad), bad).toThrow(LevelFormatError);
    expect(() => parseToken('FW')).toThrow(/white filter/);
    expect(() => parseToken('ZR')).toThrow(/unknown token "ZR"/);
    expect(() => parseToken('TQ')).toThrow(/unknown token "TQ"/);
    expect(new LevelFormatError('x').name).toBe('LevelFormatError');
  });

  const valid: LevelSource = { rows: ['>R . TR'], inventory: { mirror: 1 }, solutions: 1 };
  const withRows = (...rows: string[]): LevelSource => ({ ...valid, rows });

  it('parses a valid level with its inventory', () => {
    const level = parseLevel({ rows: ['>R . .', '. . TR'], inventory: { mirror: 1, splitter: 2 }, solutions: 1 });
    expect([level.width, level.height]).toEqual([3, 2]);
    expect(level.inventory).toEqual({ mirror: 1, splitter: 2, blocker: 0 });
    expect(level.cells[5]).toEqual({ kind: 'target', colour: RED });
  });

  it('rejects malformed levels', () => {
    expect(() => parseLevel(withRows('>R TR'))).toThrow(/between 2×2 and 7×7/);
    expect(() => parseLevel(withRows('>R', 'TR'))).toThrow(/between/);
    expect(() => parseLevel(withRows(...new Array(8).fill('>R . TR')))).toThrow(/between/);
    expect(() => parseLevel(withRows('>R . . . . . . TR', '. . . . . . . .'))).toThrow(/between/);
    expect(() => parseLevel(withRows('>R . .', '. TR'))).toThrow(/different lengths/);
    expect(() => parseLevel(withRows('. . .', '. . TR'))).toThrow(/no laser/);
    expect(() => parseLevel(withRows('>R . .', '. . X'))).toThrow(/no target/);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: {} })).toThrow(/inventory is empty/);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { mirror: 5 } })).toThrow(/bad mirror count/);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { blocker: -1 } })).toThrow(/bad blocker count/);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { splitter: 0.5 } })).toThrow(/bad splitter count/);
    expect(() => parseLevel(withRows('>R . TR', '. . .'))).toThrow(/solved without any piece/);
    expect(parseLevel(withRows('vR . .', '. . TR')).width).toBe(3);
    expect(parseLevel(withRows('  vR .  ', ' .   TR')).cells.map((c) => c.kind)).toEqual(['emitter', 'empty', 'empty', 'target']);
    expect(parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { blocker: 4 } }).inventory.blocker).toBe(4);
  });
});

/* ---------- The level set ---------- */

describe('level set', () => {
  it('has eight levels per difficulty and matches the metadata difficulties', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    for (const difficulty of DIFFICULTIES) expect(levelCount(difficulty)).toBe(8);
  });

  it('parses every level, fits a phone (≤ 7×7) and grows with difficulty', () => {
    const sizes: Record<string, number> = { easy: 5, medium: 6, hard: 7 };
    for (const { difficulty, index } of ALL) {
      const level = getLevel(difficulty, index);
      expect(level.width).toBe(sizes[difficulty]);
      expect(level.height).toBe(sizes[difficulty]);
      const pieces = PIECE_KINDS.reduce((sum, kind) => sum + level.inventory[kind], 0);
      expect(pieces).toBeLessThanOrEqual(4);
      expect(pieces).toBeGreaterThanOrEqual(difficulty === 'hard' ? 3 : 1);
      expect(getLevel(difficulty, index)).toBe(level);
    }
  });

  it('has no duplicate boards', () => {
    const keys = ALL.map(({ source }) => source.rows.join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('throws for a level index out of range', () => {
    expect(() => getLevel('easy', 8)).toThrow(RangeError);
    expect(() => getLevel('easy', -1)).toThrow(/No level -1 in easy/);
  });

  describe('every level is solvable and has the recorded number of solutions (independent oracle)', { timeout: 120_000 }, () => {
    for (const { difficulty, index, source } of ALL) {
      it(`${difficulty} ${index + 1}`, () => {
        const solutions = solveByLight(source.rows, source.inventory);
        expect(solutions.length).toBe(source.solutions);
        if (difficulty === 'hard') expect(solutions.length).toBe(1);
        else expect(solutions.length).toBeLessThanOrEqual(2);
        for (const solution of solutions) {
          // The solution needs the whole inventory: every piece matters.
          const used = parseSolution(solution);
          const total = PIECE_KINDS.reduce((sum, kind) => sum + (source.inventory[kind] ?? 0), 0);
          expect(used).toHaveLength(total);
          // Playing it with the game's own actions solves the level.
          const solved = applySolution(stateOf(difficulty, index), solution);
          expect(isSolved(solved)).toBe(true);
          expect(PIECE_KINDS.every((kind) => remaining(solved, kind) === 0)).toBe(true);
        }
        expect(isSolved(stateOf(difficulty, index))).toBe(false);
      });
    }
  });

  it('light-guided search finds exactly what exhaustive enumeration finds (easy and medium)', { timeout: 120_000 }, () => {
    for (const { source } of ALL.filter((l) => l.difficulty !== 'hard')) {
      expect(solveExhaustively(source.rows, source.inventory)).toEqual(solveByLight(source.rows, source.inventory));
    }
  });
});

/* ---------- Game state ---------- */

describe('game state', () => {
  it('chooses the level from the seed and difficulty', () => {
    expect(createInitialState(0)).toEqual({ seed: 0, difficulty: DEFAULT_DIFFICULTY, level: 0, pieces: [], moves: 0, undo: [] });
    expect(createInitialState(13, 'hard').level).toBe(5);
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(-1).level).toBe(0xffffffff % 8);
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('is deterministic for every seed (property)', () => {
    fc.assert(
      fc.property(fc.nat(), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        expect(createInitialState(seed, difficulty)).toEqual(createInitialState(seed, difficulty));
        expect(createInitialState(seed, difficulty).level).toBe(seed % 8);
      })
    );
  });

  // Easy level 1: '.  /  .  .  <R' / '.  .  .  .  #' / ... / 'TR . . . .' — one mirror.
  const easy1 = stateOf('easy', 0);
  const mirrorCell = 3 * 5 + 1;

  it('places a piece only on empty squares while the inventory lasts', () => {
    expect(remaining(easy1, 'mirror')).toBe(1);
    expect(remaining(easy1, 'splitter')).toBe(0);
    expect(canPlace(easy1, 4, 'mirror')).toBe(false); // the laser
    expect(canPlace(easy1, 1, 'mirror')).toBe(false); // a fixed mirror
    expect(canPlace(easy1, -1, 'mirror')).toBe(false);
    expect(canPlace(easy1, 25, 'mirror')).toBe(false);
    expect(canPlace(easy1, 2.5, 'mirror')).toBe(false);
    expect(canPlace(easy1, 0, 'splitter')).toBe(false);
    expect(placePiece(easy1, 4, 'mirror')).toBe(easy1);
    const placed = placePiece(easy1, 0, 'mirror');
    expect(placed.pieces).toEqual([{ cell: 0, kind: 'mirror', orient: 0 }]);
    expect(placed.moves).toBe(1);
    expect(placed.undo).toEqual([{ pieces: [], moves: 0 }]);
    expect(remaining(placed, 'mirror')).toBe(0);
    expect(canPlace(placed, 2, 'mirror')).toBe(false);
    expect(placePiece(placed, 2, 'mirror')).toBe(placed);
    expect(pieceAt(placed, 0)).toEqual({ cell: 0, kind: 'mirror', orient: 0 });
    expect(pieceAt(placed, 2)).toBeUndefined();
    expect(easy1.pieces).toEqual([]);
  });

  it('keeps pieces sorted, never on the same square twice', () => {
    let s = stateOf('hard', 7); // four splitters
    s = placePiece(s, 30, 'splitter');
    s = placePiece(s, 10, 'splitter');
    s = placePiece(s, 20, 'splitter');
    expect(s.pieces.map((p) => p.cell)).toEqual([10, 20, 30]);
    expect(placePiece(s, 20, 'splitter')).toBe(s);
    expect(remaining(s, 'splitter')).toBe(1);
  });

  it('turns mirrors and splitters, but not blockers', () => {
    const placed = placePiece(easy1, 0, 'mirror');
    const turned = rotatePiece(placed, 0);
    expect(pieceAt(turned, 0)?.orient).toBe(1);
    expect(turned.moves).toBe(2);
    expect(turned.undo).toEqual([{ pieces: [], moves: 0 }, { pieces: placed.pieces, moves: 1 }]);
    expect(rotatePiece(rotatePiece(turned, 0), 0)).toMatchObject({ pieces: turned.pieces, moves: 4 });
    expect(pieceAt(rotatePiece(turned, 0), 0)?.orient).toBe(0);
    expect(rotatePiece(placed, 2)).toBe(placed);
    const medium = placePiece(stateOf('medium', 5), 1, 'blocker'); // a level with a blocker
    expect(medium.pieces).toEqual([{ cell: 1, kind: 'blocker', orient: 0 }]);
    expect(rotatePiece(medium, 1)).toBe(medium);
  });

  it('solves easy level 1 with a mirror tilted like / and then locks the board', () => {
    const solved = placePiece(easy1, mirrorCell, 'mirror');
    expect(isSolved(solved)).toBe(true);
    expect(evaluateState(solved)).toMatchObject({ correct: 1, solved: true });
    expect(rotatePiece(solved, mirrorCell)).toBe(solved);
    expect(removePiece(solved, mirrorCell)).toBe(solved);
    expect(clearBoard(solved)).toBe(solved);
    expect(undo(solved)).toBe(solved);
    expect(canUndo(solved)).toBe(false);
    expect(canClear(solved)).toBe(false);
    expect(canPlace(stateOf('easy', 5), 0, 'mirror')).toBe(true);
    // Turning it the other way breaks the solution again.
    const wrong = rotatePiece(placePiece(easy1, mirrorCell + 1, 'mirror'), mirrorCell + 1);
    expect(isSolved(wrong)).toBe(false);
  });

  it('removes pieces back into the inventory', () => {
    const placed = placePiece(easy1, 0, 'mirror');
    const removed = removePiece(placed, 0);
    expect(removed.pieces).toEqual([]);
    expect(removed.moves).toBe(2);
    expect(remaining(removed, 'mirror')).toBe(1);
    expect(removePiece(removed, 0)).toBe(removed);
    expect(removePiece(placed, 1)).toBe(placed);
    const two = placePiece(placePiece(stateOf('easy', 7), 0, 'mirror'), 1, 'splitter');
    expect(removePiece(two, 0).pieces).toEqual([{ cell: 1, kind: 'splitter', orient: 0 }]);
  });

  it('clears the board and undoes step by step, including the clearing', () => {
    let s = stateOf('easy', 7); // mirror + splitter
    s = placePiece(s, 0, 'mirror');
    s = placePiece(s, 1, 'splitter');
    s = rotatePiece(s, 1);
    expect(canClear(s)).toBe(true);
    const cleared = clearBoard(s);
    expect(cleared.pieces).toEqual([]);
    expect(cleared.moves).toBe(0);
    expect(canClear(cleared)).toBe(false);
    expect(clearBoard(cleared)).toBe(cleared);
    const back = undo(cleared);
    expect(back.pieces).toEqual(s.pieces);
    expect(back.moves).toBe(3);
    const twice = undo(back);
    expect(twice.pieces).toEqual([{ cell: 0, kind: 'mirror', orient: 0 }, { cell: 1, kind: 'splitter', orient: 0 }]);
    expect(twice.moves).toBe(2);
    expect(undo(undo(twice))).toMatchObject({ pieces: [], moves: 0, undo: [] });
    expect(canUndo(stateOf('easy', 7))).toBe(false);
    expect(undo(easy1)).toBe(easy1);
  });

  it(`keeps at most ${MAX_UNDO} undo steps`, () => {
    let s = placePiece(stateOf('easy', 7), 0, 'mirror');
    for (let i = 0; i < MAX_UNDO + 5; i++) s = rotatePiece(s, 0);
    expect(s.undo).toHaveLength(MAX_UNDO);
    expect(s.moves).toBe(MAX_UNDO + 6);
    expect(s.undo[0]!.moves).toBe(6);
    expect(isLaserState(s)).toBe(true);
  });

  it('caps the move counter', () => {
    const s = { ...placePiece(stateOf('easy', 7), 0, 'mirror'), moves: MAX_MOVES };
    expect(rotatePiece(s, 0).moves).toBe(MAX_MOVES);
  });

  it('switches levels with an empty board and resets to the seeded level', () => {
    const s = placePiece(stateOf('medium', 2), 0, 'mirror');
    const other = chooseLevel(s, 5);
    expect(other).toEqual({ ...s, level: 5, pieces: [], moves: 0, undo: [] });
    expect(chooseLevel(other, 5)).toBe(other);
    expect(chooseLevel(s, 2)).toEqual({ ...s, pieces: [], moves: 0, undo: [] });
    expect(chooseLevel(s, 8)).toBe(s);
    expect(chooseLevel(s, -1)).toBe(s);
    expect(chooseLevel({ ...stateOf('easy', 1), moves: 3 }, 1).moves).toBe(0);
    expect(chooseLevel({ ...stateOf('easy', 1), pieces: [{ cell: 0, kind: 'mirror', orient: 0 }] }, 1).pieces).toEqual([]);
    expect(chooseLevel({ ...stateOf('easy', 1), undo: [{ pieces: [], moves: 0 }] }, 1).undo).toEqual([]);
    const seeded = createInitialState(11, 'hard');
    expect(resetState(chooseLevel(placePiece(seeded, 0, 'mirror'), 0))).toEqual(seeded);
  });

  it('builds the board with the pieces on it', () => {
    const s = rotatePiece(placePiece(placePiece(stateOf('medium', 5), 1, 'blocker'), 2, 'splitter'), 2);
    const board = boardOf(s);
    expect(board.cells[0]).toEqual({ kind: 'blocker' }); // a fixed blocker of the level
    expect(board.cells[1]).toEqual({ kind: 'blocker' });
    expect(board.cells[2]).toEqual({ kind: 'splitter', orient: 1 });
    expect(boardWith(levelOf(s), [])).toEqual({ width: 6, height: 6, cells: levelOf(s).cells });
    expect(levelOf(s).cells[1]).toEqual({ kind: 'empty' });
  });

  it('random play keeps the state valid and the inventory respected (property)', () => {
    const action = fc.record({
      type: fc.constantFrom('place', 'rotate', 'remove', 'clear', 'undo'),
      cell: fc.integer({ min: -1, max: 49 }),
      kind: fc.constantFrom(...PIECE_KINDS)
    });
    fc.assert(
      fc.property(fc.constantFrom(...DIFFICULTIES), fc.nat(), fc.array(action, { maxLength: 40 }), (difficulty, seed, actions) => {
        let s = createInitialState(seed, difficulty);
        for (const a of actions) {
          if (a.type === 'place') s = placePiece(s, a.cell, a.kind);
          else if (a.type === 'rotate') s = rotatePiece(s, a.cell);
          else if (a.type === 'remove') s = removePiece(s, a.cell);
          else if (a.type === 'clear') s = clearBoard(s);
          else s = undo(s);
          expect(isLaserState(JSON.parse(JSON.stringify(s)))).toBe(true);
          for (const kind of PIECE_KINDS) expect(remaining(s, kind)).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 150 }
    );
  });
});

/* ---------- Validation ---------- */

describe('isLaserState', () => {
  const base = (): LaserState => rotatePiece(placePiece(placePiece(stateOf('easy', 7), 0, 'mirror'), 1, 'splitter'), 1);

  it('accepts real states', () => {
    expect(isLaserState(base())).toBe(true);
    expect(isLaserState(createInitialState(99, 'hard'))).toBe(true);
    expect(isLaserState(placePiece(stateOf('medium', 5), 1, 'blocker'))).toBe(true);
  });

  it('rejects broken or tampered states', () => {
    const s = base();
    const bad: unknown[] = [
      null,
      [],
      'state',
      { ...s, seed: -1 },
      { ...s, seed: 2 ** 32 },
      { ...s, difficulty: 'extreme' },
      { ...s, level: 8 },
      { ...s, level: -1 },
      { ...s, level: 1.5 },
      { ...s, pieces: 'none' },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 0, extra: 1 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror' }] },
      { ...s, pieces: [null] },
      { ...s, pieces: [{ cell: 0, kind: 'laser', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 2 }] },
      { ...s, pieces: [{ cell: 25, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: -1, kind: 'mirror', orient: 0 }] },
      // Easy level 8, last row 'X  TR ^R .  .': cell 20 is a forbidden sensor.
      { ...s, pieces: [{ cell: 20, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: 1, kind: 'splitter', orient: 0 }, { cell: 0, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 0 }, { cell: 0, kind: 'splitter', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 0 }, { cell: 1, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'blocker', orient: 0 }] },
      { ...stateOf('medium', 5), pieces: [{ cell: 1, kind: 'blocker', orient: 1 }] },
      { ...s, moves: -1 },
      { ...s, moves: MAX_MOVES + 1 },
      { ...s, moves: '3' },
      { ...s, undo: 'none' },
      { ...s, undo: [null] },
      { ...s, undo: [{ pieces: [], moves: -1 }] },
      { ...s, undo: [{ pieces: [{ cell: 18, kind: 'mirror', orient: 0 }], moves: 1 }] },
      { ...s, undo: [{ moves: 1 }] },
      { ...s, undo: new Array(MAX_UNDO + 1).fill({ pieces: [], moves: 0 }) }
    ];
    for (const value of bad) expect(isLaserState(value), JSON.stringify(value)?.slice(0, 120)).toBe(false);
    const { moves: _moves, ...noMoves } = s;
    expect(isLaserState(noMoves)).toBe(false);
    expect(isLaserState({ ...s, undo: new Array(MAX_UNDO).fill({ pieces: [], moves: 0 }) })).toBe(true);
  });

  it('never throws on arbitrary data (property)', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isLaserState(value)).not.toThrow();
        expect(isLaserState(value)).toBe(false);
      }),
      { numRuns: 300 }
    );
    const throwing = { get seed(): number { throw new Error('boom'); } };
    expect(isLaserState(throwing)).toBe(false);
  });
});
