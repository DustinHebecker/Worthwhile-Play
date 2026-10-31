import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  OC_CELLS,
  OC_LINES,
  applyOcMove,
  canUndoOc,
  createOcRound,
  emptyOcBoard,
  findFive,
  isOcCellFree,
  isOcComputerTurn,
  isValidOcState,
  ocBoardFromMoves,
  ocOutcome,
  otherRole,
  roleOfMove,
  undoOc,
  type OcMove,
  type OrderChaosState
} from '../src/order-chaos';
import type { Cell, Mark } from '../src/rules';

/** Board from a 6-line picture ('.' = empty). */
const B = (picture: string): Cell[] => [...picture.replace(/\s/g, '')].map((c) => (c === '.' ? '' : (c as Mark)));

/** Independent oracle: every start cell and direction, exactly five equal, the cells before and after differ. */
function oracleFives(board: readonly Cell[]): Set<Mark> {
  const at = (r: number, c: number): Cell | undefined => (r >= 0 && r < 6 && c >= 0 && c < 6 ? board[r * 6 + c] : undefined);
  const found = new Set<Mark>();
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
        const mark = at(r, c);
        if (!mark) continue;
        let k = 0;
        while (k < 5 && at(r + k * dr, c + k * dc) === mark) k++;
        if (k < 5) continue;
        if (at(r - dr, c - dc) === mark || at(r + 5 * dr, c + 5 * dc) === mark) continue;
        found.add(mark);
      }
    }
  }
  return found;
}

const state = (overrides: Partial<OrderChaosState> = {}): OrderChaosState => ({
  variant: 'order-chaos',
  seed: 1,
  difficulty: 'medium',
  opponent: 'human',
  role: 'order',
  moves: [],
  rng: 1,
  ...overrides
});

/** Random legal game prefix (stops at the end of the game). */
const arbMoves = fc.array(fc.tuple(fc.nat(), fc.boolean()), { maxLength: OC_CELLS }).map((choices) => {
  const moves: OcMove[] = [];
  const board = emptyOcBoard();
  for (const [choice, isX] of choices) {
    if (ocOutcome(board).kind !== 'playing') break;
    const free = board.flatMap((c, i) => (c === '' ? [i] : []));
    const cell = free[choice % free.length]!;
    const mark: Mark = isX ? 'X' : 'O';
    board[cell] = mark;
    moves.push({ cell, mark });
  }
  return moves;
});

describe('Order & Chaos lines', () => {
  it('has 18 straight lines of five or six cells covering every window of five', () => {
    expect(OC_LINES).toHaveLength(18);
    expect(OC_LINES.filter((l) => l.length === 6)).toHaveLength(14);
    expect(OC_LINES.filter((l) => l.length === 5)).toHaveLength(4);
    for (const line of OC_LINES) {
      const steps = new Set(line.slice(1).map((cell, i) => cell - line[i]!));
      expect(steps.size).toBe(1);
      expect([1, 6, 7, 5]).toContain([...steps][0]);
    }
    // Brute force: every run of five cells in any direction lies inside one listed line.
    const windows = new Set<string>();
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 6; c++)
        for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
          const cells = Array.from({ length: 5 }, (_, k) => [r + k * dr, c + k * dc] as const);
          if (cells.every(([a, b]) => a >= 0 && a < 6 && b >= 0 && b < 6)) windows.add(cells.map(([a, b]) => a * 6 + b).join());
        }
    expect(windows.size).toBe(32);
    for (const w of windows) expect(OC_LINES.some((line) => line.join().includes(w))).toBe(true);
  });

  it('roles alternate with Order first', () => {
    expect(roleOfMove(0)).toBe('order');
    expect(roleOfMove(1)).toBe('chaos');
    expect(roleOfMove(34)).toBe('order');
    expect(otherRole('order')).toBe('chaos');
    expect(otherRole('chaos')).toBe('order');
  });
});

describe('exact five detection', () => {
  it('finds five in a row, column and both diagonals', () => {
    expect(findFive(B('XXXXX. ...... ...... ...... ...... ......'))).toEqual({ mark: 'X', cells: [0, 1, 2, 3, 4] });
    expect(findFive(B('.OOOOO ...... ...... ...... ...... ......'))).toEqual({ mark: 'O', cells: [1, 2, 3, 4, 5] });
    expect(findFive(B('X..... X..... X..... X..... X..... ......'))?.cells).toEqual([0, 6, 12, 18, 24]);
    expect(findFive(B('O..... .O.... ..O... ...O.. ....O. ......'))?.cells).toEqual([0, 7, 14, 21, 28]);
    expect(findFive(B('.X.... ..X... ...X.. ....X. .....X ......'))?.cells).toEqual([1, 8, 15, 22, 29]);
    expect(findFive(B('.....O ....O. ...O.. ..O... .O.... ......'))?.cells).toEqual([5, 10, 15, 20, 25]);
    expect(findFive(B('...... .....X ....X. ...X.. ..X... .X....'))?.cells).toEqual([11, 16, 21, 26, 31]);
  });

  it('does not count six in a row, four in a row or mixed lines', () => {
    expect(findFive(B('XXXXXX ...... ...... ...... ...... ......'))).toBeNull();
    expect(findFive(B('O..... .O.... ..O... ...O.. ....O. .....O'))).toBeNull();
    expect(findFive(B('XXXX.X ...... ...... ...... ...... ......'))).toBeNull();
    expect(findFive(B('XXXXOX ...... ...... ...... ...... ......'))).toBeNull();
    expect(findFive(emptyOcBoard())).toBeNull();
  });

  it('counts five next to a different symbol', () => {
    expect(findFive(B('OXXXXX ...... ...... ...... ...... ......'))?.mark).toBe('X');
    expect(findFive(B('XXXXXO ...... ...... ...... ...... ......'))?.mark).toBe('X');
  });

  it('property: matches the independent oracle on arbitrary boards', () => {
    const arbBoard = fc.array(fc.constantFrom<Cell>('', 'X', 'X', 'X', 'O'), { minLength: 36, maxLength: 36 });
    fc.assert(
      fc.property(arbBoard, (board) => {
        const five = findFive(board);
        const fives = oracleFives(board);
        expect(five !== null).toBe(fives.size > 0);
        if (five) {
          expect(fives.has(five.mark)).toBe(true);
          expect(five.cells).toHaveLength(5);
          for (const c of five.cells) expect(board[c]).toBe(five.mark);
        }
      }),
      { numRuns: 2000 }
    );
  });

  it('outcomes: Order on a five, Chaos on a full board without one', () => {
    expect(ocOutcome(emptyOcBoard())).toEqual({ kind: 'playing' });
    const full = B('XXOOXX OOXXOO XXOOXX OOXXOO XXOOXX OOXXOO');
    expect(findFive(full)).toBeNull();
    expect(ocOutcome(full)).toEqual({ kind: 'chaos' });
    expect(ocOutcome(B('XXXXX. ...... ...... ...... ...... ......')).kind).toBe('order');
  });
});

describe('Order & Chaos state', () => {
  it('builds boards from moves and rejects reused cells', () => {
    expect(ocBoardFromMoves([{ cell: 3, mark: 'O' }])[3]).toBe('O');
    expect(() => ocBoardFromMoves([{ cell: 3, mark: 'O' }, { cell: 3, mark: 'X' }])).toThrow(RangeError);
    expect(isOcCellFree(emptyOcBoard(), 35)).toBe(true);
    for (const c of [-1, 36, 0.5]) expect(isOcCellFree(emptyOcBoard(), c)).toBe(false);
  });

  it('creates a round and knows the computer’s turn', () => {
    expect(createOcRound({ seed: 4, difficulty: 'easy', opponent: 'computer', role: 'chaos' })).toEqual(state({ seed: 4, rng: 4, difficulty: 'easy', opponent: 'computer', role: 'chaos' }));
    expect(isOcComputerTurn(state({ opponent: 'computer', role: 'chaos' }))).toBe(true);
    expect(isOcComputerTurn(state({ opponent: 'computer', role: 'order' }))).toBe(false);
    expect(isOcComputerTurn(state({ opponent: 'human' }))).toBe(false);
  });

  it('applies moves immutably and refuses illegal ones', () => {
    const s = state();
    const next = applyOcMove(s, { cell: 7, mark: 'O' });
    expect(s.moves).toEqual([]);
    expect(next.moves).toEqual([{ cell: 7, mark: 'O' }]);
    expect(() => applyOcMove(next, { cell: 7, mark: 'X' })).toThrow(RangeError);
    expect(() => applyOcMove(next, { cell: 8, mark: 'Z' as Mark })).toThrow(RangeError);
    const won = state({ moves: [0, 1, 2, 3, 4].flatMap((c, i) => [{ cell: c, mark: 'X' as Mark }, { cell: 30 + i, mark: 'O' as Mark }]).slice(0, 9) });
    expect(ocOutcome(ocBoardFromMoves(won.moves)).kind).toBe('order');
    expect(() => applyOcMove(won, { cell: 20, mark: 'X' })).toThrow(RangeError);
  });

  it('undo: single moves between people, move pairs against the computer', () => {
    const two = state({ moves: [{ cell: 0, mark: 'X' }, { cell: 1, mark: 'O' }] });
    expect(undoOc(two).moves).toEqual([{ cell: 0, mark: 'X' }]);
    expect(canUndoOc(state())).toBe(false);
    const vs = state({ opponent: 'computer', role: 'order', moves: two.moves });
    expect(undoOc(vs).moves).toEqual([]);
    const chaosFirst = state({ opponent: 'computer', role: 'chaos', moves: [{ cell: 0, mark: 'X' }] });
    expect(canUndoOc(chaosFirst)).toBe(false);
    expect(undoOc(chaosFirst)).toBe(chaosFirst);
    const chaosLater = state({ opponent: 'computer', role: 'chaos', moves: [...two.moves, { cell: 2, mark: 'X' }] });
    expect(undoOc(chaosLater).moves).toEqual([{ cell: 0, mark: 'X' }]);
  });

  it('accepts every state reached by legal play', () => {
    fc.assert(
      fc.property(arbMoves, (moves) => {
        expect(isValidOcState(state({ moves }))).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it.each([
    ['not an object', 'x'],
    ['wrong variant', { ...state(), variant: 'nested' }],
    ['extra field', { ...state(), symbol: 'X' }],
    ['missing field', (({ role: _r, ...rest }) => rest)(state())],
    ['bad seed', state({ seed: 1.5 })],
    ['unknown role', { ...state(), role: 'neutral' }],
    ['unknown difficulty', { ...state(), difficulty: 'hard' }],
    ['move not an object', { ...state(), moves: [3] }],
    ['move with extra field', { ...state(), moves: [{ cell: 3, mark: 'X', by: 'me' }] }],
    ['bad mark', { ...state(), moves: [{ cell: 3, mark: 'Y' }] }],
    ['cell out of range', { ...state(), moves: [{ cell: 36, mark: 'X' }] }],
    ['reused cell', state({ moves: [{ cell: 3, mark: 'X' }, { cell: 3, mark: 'O' }] })],
    ['half a turn against the computer', state({ opponent: 'computer', role: 'order', moves: [{ cell: 3, mark: 'X' }] })],
    ['computer has not opened', state({ opponent: 'computer', role: 'chaos', moves: [] })]
  ])('rejects %s', (_label, value) => {
    expect(isValidOcState(value)).toBe(false);
  });

  it('rejects moves after a five and never throws', () => {
    const five: OcMove[] = [0, 30, 1, 31, 2, 32, 3, 33, 4].map((cell, i) => ({ cell, mark: i % 2 === 0 ? 'X' : 'O' }));
    expect(isValidOcState(state({ moves: five }))).toBe(true);
    expect(isValidOcState(state({ moves: [...five, { cell: 20, mark: 'O' }] }))).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => void expect(() => isValidOcState(v)).not.toThrow()), { numRuns: 300 });
  });
});
