// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CELL_COUNT,
  COLS,
  CONNECT,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  LINES,
  OPPONENTS,
  ROWS,
  STARTERS,
  applyMove,
  boardFromMoves,
  boardOf,
  canUndo,
  cellIndex,
  colOf,
  computerPlayer,
  countDiscs,
  createRound,
  drop,
  dropRow,
  emptyBoard,
  findWin,
  fours,
  humanPlayer,
  isComputerTurn,
  isLegalMove,
  isValidState,
  legalMoves,
  other,
  outcomeOf,
  outcomeOfState,
  playerOfMove,
  rowOf,
  toMove,
  undo,
  type Board,
  type Cell,
  type ConnectFourState,
  type Player
} from '../src/rules';

/**
 * Builds a board from a picture of six rows (top row first), seven characters each:
 * '.' = empty, '1' / '2' = discs. Whitespace is ignored.
 */
const B = (picture: string): Cell[] => {
  const chars = [...picture.replace(/\s/g, '')];
  if (chars.length !== CELL_COUNT) throw new Error(`picture has ${chars.length} cells`);
  return chars.map((c) => (c === '.' ? 0 : (Number(c) as Cell)));
};

/** A legal game that fills the board without any line of four. */
const DRAW_MOVES = [3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 6, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6];

/**
 * Independent brute-force oracle: from every cell, walks 4 cells in each of the 8
 * compass directions by (row, col) coordinates and reports each line once, as a
 * sorted key, together with its owner.
 */
function oracleLines(board: Board): Map<string, Player> {
  const at = (r: number, c: number) => (r >= 0 && r < 6 && c >= 0 && c < 7 ? board[r * 7 + c] : undefined);
  const found = new Map<string, Player>();
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const owner = at(r, c);
          if (owner !== 1 && owner !== 2) continue;
          const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k] as const);
          if (cells.every(([rr, cc]) => at(rr, cc) === owner)) {
            found.set(
              cells
                .map(([rr, cc]) => rr * 7 + cc)
                .sort((a, b) => a - b)
                .join(','),
              owner
            );
          }
        }
      }
    }
  }
  return found;
}

const lineKey = (line: readonly number[]) => [...line].sort((a, b) => a - b).join(',');

/** Arbitrary 42-cell board (not necessarily reachable, discs may float). */
const arbBoard = fc.array(fc.constantFrom<Cell>(0, 1, 2), { minLength: CELL_COUNT, maxLength: CELL_COUNT });

/** Arbitrary 42-cell board biased towards long same-coloured runs. */
const arbDenseBoard = fc.array(fc.constantFrom<Cell>(1, 1, 2, 0), { minLength: CELL_COUNT, maxLength: CELL_COUNT });

/** Arbitrary legal move sequence (stops when the game ends). */
const arbMoves = fc.array(fc.nat(), { maxLength: CELL_COUNT }).map((choices) => {
  const moves: number[] = [];
  let board = emptyBoard();
  for (const choice of choices) {
    if (outcomeOf(board).kind !== 'playing') break;
    const legal = legalMoves(board);
    const col = legal[choice % legal.length] as number;
    board = drop(board, col, playerOfMove(moves.length));
    moves.push(col);
  }
  return moves;
});

const state = (overrides: Partial<ConnectFourState> = {}): ConnectFourState => ({
  seed: 1,
  difficulty: 'medium',
  opponent: 'human',
  starter: 'human',
  moves: [],
  rng: 1,
  ...overrides
});

describe('board geometry', () => {
  it('has 7 columns, 6 rows and needs four in a line', () => {
    expect([COLS, ROWS, CELL_COUNT, CONNECT]).toEqual([7, 6, 42, 4]);
    expect(emptyBoard()).toEqual(Array(42).fill(0));
  });

  it('maps rows and columns to indices (row 0 at the top)', () => {
    expect(cellIndex(0, 0)).toBe(0);
    expect(cellIndex(0, 6)).toBe(6);
    expect(cellIndex(1, 0)).toBe(7);
    expect(cellIndex(5, 3)).toBe(38);
    expect(rowOf(38)).toBe(5);
    expect(colOf(38)).toBe(3);
    expect(rowOf(6)).toBe(0);
    expect(colOf(7)).toBe(0);
  });

  it('defines exactly the 69 distinct lines of four that the oracle accepts', () => {
    expect(LINES).toHaveLength(69);
    expect(new Set(LINES.map(lineKey)).size).toBe(69);
    const all = new Set<string>();
    for (const line of LINES) {
      const board = emptyBoard();
      for (const i of line) board[i] = 1;
      const lines = oracleLines(board);
      expect([...lines.keys()]).toEqual([lineKey(line)]);
      all.add(lineKey(line));
    }
    // 24 horizontal, 21 vertical and 12 + 12 diagonal windows, in that order.
    expect(LINES.slice(0, 24).every((l) => rowOf(l[0]) === rowOf(l[3]))).toBe(true);
    expect(LINES.slice(24, 45).every((l) => colOf(l[0]) === colOf(l[3]))).toBe(true);
    expect(LINES.slice(45, 57).every((l) => colOf(l[3]) - colOf(l[0]) === 3 && rowOf(l[3]) - rowOf(l[0]) === 3)).toBe(true);
    expect(LINES.slice(57).every((l) => colOf(l[0]) - colOf(l[3]) === 3 && rowOf(l[3]) - rowOf(l[0]) === 3)).toBe(true);
    expect(LINES[0]).toEqual([0, 1, 2, 3]);
    expect(LINES[24]).toEqual([0, 7, 14, 21]);
    expect(LINES[45]).toEqual([0, 8, 16, 24]);
    expect(LINES[57]).toEqual([3, 9, 15, 21]);
    expect(LINES[68]).toEqual([20, 26, 32, 38]);
  });
});

describe('players and turns', () => {
  it('alternates players, 1 first', () => {
    expect(other(1)).toBe(2);
    expect(other(2)).toBe(1);
    expect([0, 1, 2, 3, 41].map(playerOfMove)).toEqual([1, 2, 1, 2, 2]);
  });

  it('counts discs and determines the side to move', () => {
    expect(countDiscs(emptyBoard())).toEqual({ 1: 0, 2: 0 });
    const b = boardFromMoves([3, 3, 4]);
    expect(countDiscs(b)).toEqual({ 1: 2, 2: 1 });
    expect(countDiscs(boardFromMoves([0, 0]))).toEqual({ 1: 1, 2: 1 });
    expect(toMove(emptyBoard())).toBe(1);
    expect(toMove(boardFromMoves([3]))).toBe(2);
    expect(toMove(b)).toBe(2);
    expect(toMove(boardFromMoves([3, 3]))).toBe(1);
  });
});

describe('gravity and legal moves', () => {
  it('drops into the lowest free row', () => {
    const board = emptyBoard();
    expect(dropRow(board, 0)).toBe(5);
    expect(dropRow(board, 6)).toBe(5);
    expect(dropRow(boardFromMoves([2]), 2)).toBe(4);
    expect(dropRow(boardFromMoves([2, 2, 2, 2, 2]), 2)).toBe(0);
    expect(dropRow(boardFromMoves([2, 2, 2, 2, 2, 2]), 2)).toBe(-1);
  });

  it('rejects columns that do not exist', () => {
    const board = emptyBoard();
    for (const col of [-1, 7, 1.5, Number.NaN, Infinity]) {
      expect(dropRow(board, col)).toBe(-1);
      expect(isLegalMove(board, col)).toBe(false);
    }
    expect(isLegalMove(board, 0)).toBe(true);
    expect(isLegalMove(board, 6)).toBe(true);
  });

  it('lists non-full columns in ascending order', () => {
    expect(legalMoves(emptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(legalMoves(boardFromMoves([1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5]))).toEqual([0, 2, 3, 4, 6]);
    expect(legalMoves(boardFromMoves(DRAW_MOVES))).toEqual([]);
  });

  it('drops on a copy and throws on a full or missing column', () => {
    const board = emptyBoard();
    const next = drop(board, 3, 1);
    expect(next[cellIndex(5, 3)]).toBe(1);
    expect(next.filter((c) => c !== 0)).toHaveLength(1);
    expect(board).toEqual(emptyBoard());
    expect(drop(next, 3, 2)[cellIndex(4, 3)]).toBe(2);
    const full = boardFromMoves([0, 0, 0, 0, 0, 0]);
    expect(() => drop(full, 0, 1)).toThrow(RangeError);
    expect(() => drop(board, 7, 1)).toThrow(RangeError);
    expect(() => drop(board, -1, 1)).toThrow(RangeError);
  });

  it('replays move lists and rejects overflowing columns', () => {
    expect(boardFromMoves([])).toEqual(emptyBoard());
    expect(boardFromMoves([3, 3, 0])).toEqual(
      B(`
        .......
        .......
        .......
        .......
        ...2...
        1..1...`)
    );
    expect(() => boardFromMoves([4, 4, 4, 4, 4, 4, 4])).toThrow(RangeError);
  });

  it('property: discs never float and each move fills exactly the lowest empty cell of its column', () => {
    fc.assert(
      fc.property(arbMoves, fc.nat(), (moves, choice) => {
        const board = boardFromMoves(moves);
        // Gravity invariant: every disc rests on the floor or on another disc.
        for (let row = 0; row < ROWS - 1; row++) {
          for (let col = 0; col < COLS; col++) {
            if (board[cellIndex(row, col)] !== 0) expect(board[cellIndex(row + 1, col)]).not.toBe(0);
          }
        }
        fc.pre(outcomeOf(board).kind === 'playing');
        const legal = legalMoves(board);
        const col = legal[choice % legal.length] as number;
        const player = toMove(board);
        const next = drop(board, col, player);
        const changed = next.map((c, i) => (c !== board[i] ? i : -1)).filter((i) => i >= 0);
        expect(changed).toHaveLength(1);
        const index = changed[0] as number;
        expect(colOf(index)).toBe(col);
        expect(next[index]).toBe(player);
        // Lowest empty cell: everything below is occupied, the cell itself was empty.
        expect(board[index]).toBe(0);
        for (let row = rowOf(index) + 1; row < ROWS; row++) expect(board[cellIndex(row, col)]).not.toBe(0);
      }),
      { numRuns: 500 }
    );
  });
});

describe('win and draw detection', () => {
  it('detects every line for both players', () => {
    for (const player of [1, 2] as const) {
      for (const line of LINES) {
        const board = emptyBoard();
        for (const i of line) board[i] = player;
        expect(fours(board)).toEqual([{ player, line }]);
        expect(findWin(board)).toEqual({ player, cells: [...line].sort((a, b) => a - b) });
      }
    }
  });

  it('finds horizontal, vertical and both diagonal fours in real games', () => {
    // Horizontal on the bottom row.
    expect(findWin(boardFromMoves([0, 0, 1, 1, 2, 2, 3]))).toEqual({ player: 1, cells: [35, 36, 37, 38] });
    // Vertical in column 6 by player 2.
    expect(findWin(boardFromMoves([0, 6, 1, 6, 0, 6, 1, 6]))).toEqual({ player: 2, cells: [20, 27, 34, 41] });
    // Rising diagonal (bottom-left to top-right).
    const rising = B(`
      .......
      .......
      ...1...
      ..12...
      .122...
      1222...`);
    expect(findWin(rising)).toEqual({ player: 1, cells: [17, 23, 29, 35] });
    // Falling diagonal.
    const falling = B(`
      .......
      .......
      2......
      12.....
      112....
      1112...`);
    expect(findWin(falling)).toEqual({ player: 2, cells: [14, 22, 30, 38] });
  });

  it('does not report mixed or incomplete lines', () => {
    expect(findWin(emptyBoard())).toBeNull();
    expect(fours(emptyBoard())).toEqual([]);
    expect(findWin(boardFromMoves([0, 0, 1, 1, 2, 2]))).toBeNull();
    expect(findWin(boardFromMoves([0, 0, 1, 1, 2, 2, 4]))).toBeNull();
    expect(findWin(boardFromMoves(DRAW_MOVES))).toBeNull();
    const broken = B(`
      .......
      .......
      .......
      .......
      .......
      1112111`);
    expect(findWin(broken)).toBeNull();
  });

  it('reports all cells of every line of the winner (e.g. five in a row, crossing lines)', () => {
    const five = B(`
      .......
      .......
      .......
      .......
      .......
      .11111.`);
    expect(fours(five)).toHaveLength(2);
    expect(findWin(five)).toEqual({ player: 1, cells: [36, 37, 38, 39, 40] });
    const cross = B(`
      .......
      .......
      ...1...
      ...1...
      ...1...
      1111...`);
    expect(findWin(cross)?.cells).toEqual([17, 24, 31, 35, 36, 37, 38]);
  });

  it('reports the owner of the first line when both players have one (unreachable boards)', () => {
    const both = B(`
      .......
      .......
      .......
      .......
      2222...
      1111...`);
    expect(findWin(both)).toEqual({ player: 2, cells: [28, 29, 30, 31] });
    expect(fours(both).map((f) => f.player)).toEqual([2, 1]);
  });

  it('classifies outcomes', () => {
    expect(outcomeOf(emptyBoard())).toEqual({ kind: 'playing' });
    expect(outcomeOf(boardFromMoves(DRAW_MOVES))).toEqual({ kind: 'draw' });
    expect(outcomeOf(boardFromMoves(DRAW_MOVES.slice(0, -1)))).toEqual({ kind: 'playing' });
    expect(outcomeOf(boardFromMoves([0, 0, 1, 1, 2, 2, 3]))).toEqual({ kind: 'won', win: { player: 1, cells: [35, 36, 37, 38] } });
    // A full board with a line is a win, not a draw.
    const fullWin = boardFromMoves(DRAW_MOVES);
    for (let col = 0; col < 4; col++) fullWin[cellIndex(0, col)] = 1;
    expect(outcomeOf(fullWin).kind).toBe('won');
  });

  it('property: line detection matches the independent brute-force oracle on arbitrary boards', () => {
    fc.assert(
      fc.property(fc.oneof(arbBoard, arbDenseBoard), (board) => {
        const oracle = oracleLines(board);
        const found = fours(board);
        expect(new Map(found.map(({ player, line }) => [lineKey(line), player]))).toEqual(oracle);
        const win = findWin(board);
        expect(win !== null).toBe(oracle.size > 0);
        if (win) {
          const cells = new Set<number>();
          for (const [key, owner] of oracle) if (owner === win.player) for (const i of key.split(',')) cells.add(Number(i));
          expect(win.cells).toEqual([...cells].sort((a, b) => a - b));
        }
      }),
      { numRuns: 1500 }
    );
  });

  it('property: on reachable boards only the last mover can have a line, and draw means full without a line', () => {
    fc.assert(
      fc.property(arbMoves, (moves) => {
        const board = boardFromMoves(moves);
        const owners = new Set(oracleLines(board).values());
        const outcome = outcomeOf(board);
        if (outcome.kind === 'won') expect([...owners]).toEqual([playerOfMove(moves.length - 1)]);
        else expect(owners.size).toBe(0);
        expect(outcome.kind === 'draw').toBe(moves.length === CELL_COUNT && owners.size === 0);
      }),
      { numRuns: 500 }
    );
  });
});

describe('game state transitions', () => {
  it('creates an empty round whose PRNG starts at the seed', () => {
    expect(createRound({ seed: 77, difficulty: 'hard', opponent: 'computer', starter: 'computer' })).toEqual({
      seed: 77,
      difficulty: 'hard',
      opponent: 'computer',
      starter: 'computer',
      moves: [],
      rng: 77
    });
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(OPPONENTS).toEqual(['computer', 'human']);
    expect(STARTERS).toEqual(['human', 'computer']);
  });

  it('maps the starter to players', () => {
    expect(humanPlayer('human')).toBe(1);
    expect(humanPlayer('computer')).toBe(2);
    expect(computerPlayer('human')).toBe(2);
    expect(computerPlayer('computer')).toBe(1);
  });

  it('knows when it is the computer’s turn', () => {
    expect(isComputerTurn(state({ opponent: 'human', moves: [] }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'human', moves: [3] }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human', moves: [] }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human', moves: [3] }))).toBe(true);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'computer', moves: [] }))).toBe(true);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'computer', moves: [3] }))).toBe(false);
    // Player 1 has won; even though player 2 would be "to move", the game is over.
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human', moves: [0, 0, 1, 1, 2, 2, 3] }))).toBe(false);
  });

  it('applies moves immutably and refuses illegal or post-game moves', () => {
    const s = state({ moves: [3] });
    const next = applyMove(s, 3);
    expect(next.moves).toEqual([3, 3]);
    expect(s.moves).toEqual([3]);
    expect(boardOf(next)[cellIndex(4, 3)]).toBe(2);
    expect(() => applyMove(state({ moves: [0, 0, 0, 0, 0, 0] }), 0)).toThrow(RangeError);
    expect(() => applyMove(s, 7)).toThrow(RangeError);
    expect(() => applyMove(state({ moves: [0, 0, 1, 1, 2, 2, 3] }), 4)).toThrow(/over/);
    expect(() => applyMove(state({ moves: DRAW_MOVES }), 0)).toThrow(/over/);
    expect(outcomeOfState(state({ moves: [0, 0, 1, 1, 2, 2, 3] })).kind).toBe('won');
  });

  it('undoes single moves between two people', () => {
    expect(canUndo(state({ moves: [] }))).toBe(false);
    expect(canUndo(state({ moves: [3] }))).toBe(true);
    expect(undo(state({ moves: [3, 0, 6] })).moves).toEqual([3, 0]);
    expect(undo(state({ moves: [3] })).moves).toEqual([]);
    const empty = state({ moves: [] });
    expect(undo(empty)).toBe(empty);
  });

  it('undoes the person’s move together with the computer’s reply', () => {
    const personFirst = state({ opponent: 'computer', starter: 'human', moves: [3, 3, 2, 4], rng: 99 });
    expect(canUndo(personFirst)).toBe(true);
    const back = undo(personFirst);
    expect(back.moves).toEqual([3, 3]);
    expect(back.rng).toBe(99);
    expect(undo(back).moves).toEqual([]);
    expect(canUndo(state({ opponent: 'computer', starter: 'human', moves: [] }))).toBe(false);

    const computerFirst = state({ opponent: 'computer', starter: 'computer', moves: [3, 2, 3] });
    expect(canUndo(computerFirst)).toBe(true);
    expect(undo(computerFirst).moves).toEqual([3]);
    expect(canUndo(state({ opponent: 'computer', starter: 'computer', moves: [3] }))).toBe(false);
  });

  it('does not offer undo once the game is over', () => {
    const won = state({ moves: [0, 0, 1, 1, 2, 2, 3] });
    expect(canUndo(won)).toBe(false);
    expect(undo(won)).toBe(won);
    const drawn = state({ moves: DRAW_MOVES });
    expect(canUndo(drawn)).toBe(false);
  });

  it('property: undo in human-vs-human removes exactly the last move', () => {
    fc.assert(
      fc.property(arbMoves, (moves) => {
        const s = state({ moves });
        if (!canUndo(s)) return;
        expect(undo(s).moves).toEqual(moves.slice(0, -1));
      })
    );
  });
});

describe('isValidState', () => {
  it('accepts valid states', () => {
    expect(isValidState(state())).toBe(true);
    expect(isValidState(state({ moves: [0, 0, 1, 1, 2, 2, 3] }))).toBe(true);
    expect(isValidState(state({ moves: DRAW_MOVES }))).toBe(true);
    expect(isValidState(state({ seed: 0xffffffff, rng: 0 }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'human', moves: [3, 3] }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'computer', moves: [3] }))).toBe(true);
    // Finished games may end on either side's move.
    expect(isValidState(state({ opponent: 'computer', starter: 'human', moves: [0, 0, 1, 1, 2, 2, 3] }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'computer', moves: [0, 0, 1, 1, 2, 2, 3] }))).toBe(true);
    for (const difficulty of DIFFICULTIES) expect(isValidState(state({ difficulty }))).toBe(true);
    // Unfinished position with either side to move between two people.
    expect(isValidState(state({ opponent: 'human', moves: [3] }))).toBe(true);
  });

  it.each([
    ['not an object', 42],
    ['an array', []],
    ['null', null],
    ['missing field', (({ rng: _rng, ...rest }) => rest)(state())],
    ['extra field', { ...state(), board: [] }],
    ['negative seed', state({ seed: -1 })],
    ['seed above uint32', state({ seed: 2 ** 32 })],
    ['fractional seed', state({ seed: 1.5 })],
    ['string seed', { ...state(), seed: '1' }],
    ['bad rng', state({ rng: -5 })],
    ['rng above uint32', state({ rng: 2 ** 32 })],
    ['unknown difficulty', { ...state(), difficulty: 'perfect' }],
    ['unknown opponent', { ...state(), opponent: 'robot' }],
    ['unknown starter', { ...state(), starter: 1 }],
    ['moves not an array', { ...state(), moves: '012' }],
    ['column out of range', state({ moves: [7] })],
    ['negative column', state({ moves: [-1] })],
    ['fractional column', state({ moves: [1.5] })],
    ['string column', { ...state(), moves: ['3'] }],
    ['overflowing column', state({ moves: [2, 2, 2, 2, 2, 2, 2] })],
    ['too many moves', state({ moves: [...DRAW_MOVES, 0] })],
    ['move after a win', state({ moves: [0, 0, 1, 1, 2, 2, 3, 4] })],
    ['half a turn against the computer', state({ opponent: 'computer', starter: 'human', moves: [3] })],
    ['computer to open but has not', state({ opponent: 'computer', starter: 'computer', moves: [] })]
  ])('rejects %s', (_label, value) => {
    expect(isValidState(value)).toBe(false);
  });

  it('property: every state reached by legal play is valid', () => {
    fc.assert(
      fc.property(arbMoves, fc.constantFrom(...DIFFICULTIES), fc.integer({ min: 0, max: 0xffffffff }), (moves, difficulty, seed) => {
        expect(isValidState(state({ moves, difficulty, seed, rng: seed }))).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('property: never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidState(value)).not.toThrow();
      }),
      { numRuns: 500 }
    );
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -2, max: 9 }), { maxLength: 50 }), (moves) => {
        expect(() => isValidState(state({ moves }))).not.toThrow();
      })
    );
  });
});
