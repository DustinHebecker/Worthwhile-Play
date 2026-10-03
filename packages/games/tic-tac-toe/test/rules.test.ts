import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CELL_COUNT,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  LINES,
  OPPONENTS,
  STARTERS,
  applyMove,
  boardFromMoves,
  boardOf,
  canUndo,
  computerMark,
  countMarks,
  createRound,
  emptyBoard,
  findWin,
  humanMark,
  isComputerTurn,
  isLegalMove,
  isValidState,
  legalMoves,
  markOfMove,
  other,
  outcomeOf,
  outcomeOfState,
  place,
  toMove,
  undo,
  type Board,
  type Cell,
  type Mark,
  type TicTacToeState
} from '../src/rules';

/** Builds a board from a 9-character picture such as 'XO.X.O...' ('.' = empty). */
const B = (picture: string): Cell[] => [...picture.replace(/\s/g, '')].map((c) => (c === '.' ? '' : (c as Mark)));

/** Independent win oracle: checks rows, columns and diagonals by coordinates. */
function oracleWinners(board: Board): Set<Mark> {
  const at = (r: number, c: number) => board[r * 3 + c];
  const winners = new Set<Mark>();
  for (const mark of ['X', 'O'] as const) {
    for (let r = 0; r < 3; r++) if ([0, 1, 2].every((c) => at(r, c) === mark)) winners.add(mark);
    for (let c = 0; c < 3; c++) if ([0, 1, 2].every((r) => at(r, c) === mark)) winners.add(mark);
    if ([0, 1, 2].every((i) => at(i, i) === mark)) winners.add(mark);
    if ([0, 1, 2].every((i) => at(i, 2 - i) === mark)) winners.add(mark);
  }
  return winners;
}

/** Arbitrary 9-cell board (not necessarily reachable). */
const arbBoard = fc.array(fc.constantFrom<Cell>('', 'X', 'O'), { minLength: 9, maxLength: 9 });

/** Arbitrary legal move sequence (stops when the game ends). */
const arbMoves = fc.array(fc.nat(), { maxLength: 9 }).map((choices) => {
  const moves: number[] = [];
  for (const choice of choices) {
    const board = boardFromMoves(moves);
    if (outcomeOf(board).kind !== 'playing') break;
    const legal = legalMoves(board);
    moves.push(legal[choice % legal.length] as number);
  }
  return moves;
});

const state = (overrides: Partial<TicTacToeState> = {}): TicTacToeState => ({
  seed: 1,
  difficulty: 'medium',
  opponent: 'human',
  starter: 'human',
  moves: [],
  rng: 1,
  ...overrides
});

describe('board basics', () => {
  it('starts with nine empty cells', () => {
    expect(emptyBoard()).toEqual(['', '', '', '', '', '', '', '', '']);
    expect(CELL_COUNT).toBe(9);
  });

  it('alternates marks, X first', () => {
    expect(other('X')).toBe('O');
    expect(other('O')).toBe('X');
    expect([0, 1, 2, 3, 8].map(markOfMove)).toEqual(['X', 'O', 'X', 'O', 'X']);
  });

  it('counts marks and determines the side to move', () => {
    expect(countMarks(B('XO. X.. ...'))).toEqual({ X: 2, O: 1 });
    expect(countMarks(emptyBoard())).toEqual({ X: 0, O: 0 });
    expect(countMarks(B('OOO ... ...'))).toEqual({ X: 0, O: 3 });
    expect(toMove(emptyBoard())).toBe('X');
    expect(toMove(B('X.. ... ...'))).toBe('O');
    expect(toMove(B('XO. ... ...'))).toBe('X');
  });

  it('lists legal moves in ascending order', () => {
    expect(legalMoves(emptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(legalMoves(B('XO. .X. ..O'))).toEqual([2, 3, 5, 6, 7]);
    expect(legalMoves(B('XOX OXO OXO'))).toEqual([]);
  });

  it('accepts only integer indices of empty cells', () => {
    const board = B('X.. ... ...');
    expect(isLegalMove(board, 1)).toBe(true);
    expect(isLegalMove(board, 8)).toBe(true);
    expect(isLegalMove(board, 0)).toBe(false);
    expect(isLegalMove(board, -1)).toBe(false);
    expect(isLegalMove(board, 9)).toBe(false);
    expect(isLegalMove(board, 1.5)).toBe(false);
    expect(isLegalMove(board, Number.NaN)).toBe(false);
  });

  it('places a mark on a copy and rejects illegal placements', () => {
    const board = emptyBoard();
    const next = place(board, 4, 'O');
    expect(next).toEqual(B('... .O. ...'));
    expect(board).toEqual(emptyBoard());
    expect(() => place(next, 4, 'X')).toThrow(RangeError);
    expect(() => place(next, 9, 'X')).toThrow(RangeError);
  });

  it('defines exactly the 8 lines of three on a 3×3 grid', () => {
    expect(LINES).toHaveLength(8);
    const keys = new Set(LINES.map((l) => [...l].sort().join()));
    expect(keys.size).toBe(8);
    // Each line wins according to the independent oracle and only lines do.
    for (const line of LINES) {
      const board = emptyBoard();
      for (const i of line) board[i] = 'X';
      expect(oracleWinners(board)).toEqual(new Set(['X']));
    }
  });

  it('replays move lists into boards and rejects repeated cells', () => {
    expect(boardFromMoves([])).toEqual(emptyBoard());
    expect(boardFromMoves([4, 0, 8])).toEqual(B('O.. .X. ..X'));
    expect(() => boardFromMoves([4, 4])).toThrow(RangeError);
  });
});

describe('win and draw detection', () => {
  it('detects every line for both marks', () => {
    for (const mark of ['X', 'O'] as const) {
      for (const line of LINES) {
        const board = emptyBoard();
        for (const i of line) board[i] = mark;
        expect(findWin(board)).toEqual({ mark, line });
      }
    }
  });

  it('does not report mixed or incomplete lines', () => {
    expect(findWin(emptyBoard())).toBeNull();
    expect(findWin(B('XXO ... ...'))).toBeNull();
    expect(findWin(B('XX. ... ...'))).toBeNull();
    expect(findWin(B('XOX OXO OXO'))).toBeNull();
    expect(findWin(B('X.. .O. ..X'))).toBeNull();
  });

  it('returns the first completed line in LINES order', () => {
    // Row 0 and column 0 are both complete for X.
    expect(findWin(B('XXX X.. X..'))).toEqual({ mark: 'X', line: [0, 1, 2] });
    expect(findWin(B('..O ..O OOO'))).toEqual({ mark: 'O', line: [6, 7, 8] });
  });

  it('classifies outcomes', () => {
    expect(outcomeOf(emptyBoard())).toEqual({ kind: 'playing' });
    expect(outcomeOf(B('XOX OXO OXO'))).toEqual({ kind: 'draw' });
    // A full board with a line is a win, not a draw.
    expect(outcomeOf(B('XXX OOX XOO'))).toEqual({ kind: 'won', win: { mark: 'X', line: [0, 1, 2] } });
    expect(outcomeOf(B('XO. XO. X..'))).toEqual({ kind: 'won', win: { mark: 'X', line: [0, 3, 6] } });
    expect(outcomeOf(B('XOX OXO OX.'))).toEqual({ kind: 'playing' });
  });

  it('property: win detection matches the independent oracle on arbitrary boards', () => {
    fc.assert(
      fc.property(arbBoard, (board) => {
        const winners = oracleWinners(board);
        const win = findWin(board);
        expect(win !== null).toBe(winners.size > 0);
        if (win) {
          expect(winners.has(win.mark)).toBe(true);
          for (const i of win.line) expect(board[i]).toBe(win.mark);
        }
      }),
      { numRuns: 2000 }
    );
  });

  it('property: outcome is draw exactly when the board is full and nobody has a line', () => {
    fc.assert(
      fc.property(arbBoard, (board) => {
        const full = board.every((c) => c !== '');
        const kind = outcomeOf(board).kind;
        expect(kind === 'draw').toBe(full && oracleWinners(board).size === 0);
        expect(kind === 'won').toBe(oracleWinners(board).size > 0);
      }),
      { numRuns: 1000 }
    );
  });

  it('property: a move changes exactly one cell, from empty to the mover’s mark', () => {
    fc.assert(
      fc.property(arbMoves, fc.nat(), (moves, choice) => {
        const board = boardFromMoves(moves);
        fc.pre(outcomeOf(board).kind === 'playing');
        const legal = legalMoves(board);
        const index = legal[choice % legal.length] as number;
        const mark = toMove(board);
        const next = place(board, index, mark);
        const changed = next.map((c, i) => (c !== board[i] ? i : -1)).filter((i) => i >= 0);
        expect(changed).toEqual([index]);
        expect(board[index]).toBe('');
        expect(next[index]).toBe(mark);
      }),
      { numRuns: 1000 }
    );
  });
});

describe('game state transitions', () => {
  it('creates an empty round whose PRNG starts at the seed', () => {
    expect(createRound({ seed: 77, difficulty: 'easy', opponent: 'computer', starter: 'computer' })).toEqual({
      seed: 77,
      difficulty: 'easy',
      opponent: 'computer',
      starter: 'computer',
      moves: [],
      rng: 77
    });
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'perfect']);
    expect(DEFAULT_DIFFICULTY).toBe('medium');
    expect(OPPONENTS).toEqual(['computer', 'human']);
    expect(STARTERS).toEqual(['human', 'computer']);
  });

  it('maps the starter to marks', () => {
    expect(humanMark('human')).toBe('X');
    expect(humanMark('computer')).toBe('O');
    expect(computerMark('human')).toBe('O');
    expect(computerMark('computer')).toBe('X');
  });

  it('knows when it is the computer’s turn', () => {
    expect(isComputerTurn(state({ opponent: 'human', moves: [] }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'human', moves: [4] }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human', moves: [] }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human', moves: [4] }))).toBe(true);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'computer', moves: [] }))).toBe(true);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'computer', moves: [4] }))).toBe(false);
    // X has won; even though O would be "to move", the game is over.
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human', moves: [0, 3, 1, 4, 2] }))).toBe(false);
  });

  it('applies moves immutably and refuses illegal or post-game moves', () => {
    const s = state({ moves: [4] });
    const next = applyMove(s, 0);
    expect(next.moves).toEqual([4, 0]);
    expect(s.moves).toEqual([4]);
    expect(boardOf(next)).toEqual(B('O.. .X. ...'));
    expect(() => applyMove(s, 4)).toThrow(RangeError);
    expect(() => applyMove(state({ moves: [0, 3, 1, 4, 2] }), 8)).toThrow(/over/);
    expect(outcomeOfState(state({ moves: [0, 3, 1, 4, 2] })).kind).toBe('won');
  });

  it('undoes single moves between two people', () => {
    expect(canUndo(state({ moves: [] }))).toBe(false);
    expect(canUndo(state({ moves: [4] }))).toBe(true);
    expect(undo(state({ moves: [4, 0, 8] })).moves).toEqual([4, 0]);
    expect(undo(state({ moves: [4] })).moves).toEqual([]);
    const empty = state({ moves: [] });
    expect(undo(empty)).toBe(empty);
  });

  it('undoes the person’s move together with the computer’s reply', () => {
    const personFirst = state({ opponent: 'computer', starter: 'human', moves: [4, 0, 8, 2], rng: 99 });
    expect(canUndo(personFirst)).toBe(true);
    const back = undo(personFirst);
    expect(back.moves).toEqual([4, 0]);
    expect(back.rng).toBe(99);
    expect(undo(back).moves).toEqual([]);
    expect(canUndo(state({ opponent: 'computer', starter: 'human', moves: [] }))).toBe(false);

    const computerFirst = state({ opponent: 'computer', starter: 'computer', moves: [4, 0, 8] });
    expect(canUndo(computerFirst)).toBe(true);
    expect(undo(computerFirst).moves).toEqual([4]);
    expect(canUndo(state({ opponent: 'computer', starter: 'computer', moves: [4] }))).toBe(false);
  });

  it('does not offer undo once the game is over', () => {
    const won = state({ moves: [0, 3, 1, 4, 2] });
    expect(canUndo(won)).toBe(false);
    expect(undo(won)).toBe(won);
    const drawn = state({ moves: [0, 1, 2, 4, 3, 5, 7, 6, 8] });
    expect(outcomeOfState(drawn).kind).toBe('draw');
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
    expect(isValidState(state({ moves: [0, 3, 1, 4, 2] }))).toBe(true);
    expect(isValidState(state({ moves: [0, 1, 2, 4, 3, 5, 7, 6, 8] }))).toBe(true);
    expect(isValidState(state({ seed: 0xffffffff, rng: 0 }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'human', moves: [4, 0] }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'computer', moves: [4] }))).toBe(true);
    // Finished games may end on either side's move.
    expect(isValidState(state({ opponent: 'computer', starter: 'human', moves: [0, 3, 1, 4, 2] }))).toBe(true);
    for (const difficulty of DIFFICULTIES) expect(isValidState(state({ difficulty }))).toBe(true);
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
    ['unknown difficulty', { ...state(), difficulty: 'hard' }],
    ['unknown opponent', { ...state(), opponent: 'robot' }],
    ['unknown starter', { ...state(), starter: 'X' }],
    ['moves not an array', { ...state(), moves: '012' }],
    ['move out of range', state({ moves: [9] })],
    ['negative move', state({ moves: [-1] })],
    ['fractional move', state({ moves: [1.5] })],
    ['repeated move', state({ moves: [4, 4] })],
    ['too many moves', state({ moves: [0, 1, 2, 3, 4, 5, 6, 7, 8, 0] })],
    ['move after a win', state({ moves: [0, 3, 1, 4, 2, 5] })],
    ['half a turn against the computer', state({ opponent: 'computer', starter: 'human', moves: [4] })],
    ['computer to open but has not', state({ opponent: 'computer', starter: 'computer', moves: [] })]
  ])('rejects %s', (_label, value) => {
    expect(isValidState(value)).toBe(false);
  });

  it('accepts an unfinished position with either side to move between two people', () => {
    expect(isValidState(state({ opponent: 'human', moves: [4] }))).toBe(true);
  });

  it('property: every state reached by legal play is valid', () => {
    fc.assert(
      fc.property(arbMoves, fc.constantFrom(...DIFFICULTIES), fc.integer({ min: 0, max: 0xffffffff }), (moves, difficulty, seed) => {
        expect(isValidState(state({ moves, difficulty, seed, rng: seed }))).toBe(true);
      })
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
      fc.property(fc.array(fc.integer({ min: -2, max: 10 }), { maxLength: 12 }), (moves) => {
        expect(() => isValidState(state({ moves }))).not.toThrow();
      })
    );
  });
});
