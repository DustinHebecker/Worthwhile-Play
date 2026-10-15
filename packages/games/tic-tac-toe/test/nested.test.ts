import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  NESTED_CELLS,
  applyNestedMove,
  bigWin,
  boardOfCell,
  canUndoNested,
  cellOfCell,
  claimOf,
  createNestedRound,
  emptyNestedPosition,
  globalIndex,
  isNestedComputerTurn,
  isNestedLegal,
  isValidNestedState,
  nestedFromMoves,
  nestedLegalMoves,
  nestedOutcome,
  playNested,
  playableBoards,
  undoNested,
  type Claim,
  type NestedState
} from '../src/nested';
import type { Cell, Mark } from '../src/rules';

/* ---------- Independent oracle on a 9×9 coordinate grid ---------- */

interface Oracle {
  grid: (Mark | '')[][];
  /** Claim of each small board, keyed by "bigRow,bigCol". */
  claim: (br: number, bc: number) => Claim;
  legal: number[];
  winner: Mark | null;
  over: boolean;
}

const toGlobal = (R: number, C: number) => (Math.floor(R / 3) * 3 + Math.floor(C / 3)) * 9 + (R % 3) * 3 + (C % 3);

function oracle(moves: readonly number[]): Oracle {
  const grid: (Mark | '')[][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => '' as Mark | ''));
  const smallWinner = (br: number, bc: number): Mark | null => {
    const at = (r: number, c: number) => grid[br * 3 + r]![bc * 3 + c]!;
    for (const m of ['X', 'O'] as const) {
      for (let i = 0; i < 3; i++) {
        if ([0, 1, 2].every((j) => at(i, j) === m) || [0, 1, 2].every((j) => at(j, i) === m)) return m;
      }
      if ([0, 1, 2].every((i) => at(i, i) === m) || [0, 1, 2].every((i) => at(i, 2 - i) === m)) return m;
    }
    return null;
  };
  const full = (br: number, bc: number) => [0, 1, 2].every((r) => [0, 1, 2].every((c) => grid[br * 3 + r]![bc * 3 + c] !== ''));
  const claim = (br: number, bc: number): Claim => smallWinner(br, bc) ?? (full(br, bc) ? 'draw' : '');
  const bigWinner = (): Mark | null => {
    for (const m of ['X', 'O'] as const) {
      const at = (r: number, c: number) => claim(r, c) === m;
      for (let i = 0; i < 3; i++) if ([0, 1, 2].every((j) => at(i, j)) || [0, 1, 2].every((j) => at(j, i))) return m;
      if ([0, 1, 2].every((i) => at(i, i)) || [0, 1, 2].every((i) => at(i, 2 - i))) return m;
    }
    return null;
  };
  let last: [number, number] | null = null;
  moves.forEach((g, n) => {
    const b = Math.floor(g / 9);
    const c = g % 9;
    const R = Math.floor(b / 3) * 3 + Math.floor(c / 3);
    const C = (b % 3) * 3 + (c % 3);
    grid[R]![C] = n % 2 === 0 ? 'X' : 'O';
    last = [R, C];
  });
  const winner = bigWinner();
  const open: [number, number][] = [];
  for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) if (claim(br, bc) === '') open.push([br, bc]);
  const over = winner !== null || open.length === 0;
  let allowed = open;
  if (last) {
    const [R, C] = last as [number, number];
    const target: [number, number] = [R % 3, C % 3];
    if (claim(target[0], target[1]) === '') allowed = [target];
  }
  const legal: number[] = [];
  if (!over) {
    for (const [br, bc] of allowed) {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (grid[br * 3 + r]![bc * 3 + c] === '') legal.push(toGlobal(br * 3 + r, bc * 3 + c));
    }
  }
  return { grid, claim, legal: legal.sort((a, b) => a - b), winner, over };
}

/** Random legal game prefix: each number picks one of the legal moves. */
const arbGame = fc.array(fc.nat(), { maxLength: NESTED_CELLS }).map((choices) => {
  const moves: number[] = [];
  let position = emptyNestedPosition();
  for (const choice of choices) {
    const legal = nestedLegalMoves(position);
    if (legal.length === 0) break;
    const move = legal[choice % legal.length]!;
    moves.push(move);
    position = playNested(position, move);
  }
  return moves;
});

const state = (overrides: Partial<NestedState> = {}): NestedState => ({
  variant: 'nested',
  seed: 1,
  difficulty: 'medium',
  opponent: 'human',
  starter: 'human',
  moves: [],
  rng: 1,
  ...overrides
});

/** Cells 0, 1, 2 of small board b (its top row) — a claim for whoever plays them. */
const topRow = (b: number) => [globalIndex(b, 0), globalIndex(b, 1), globalIndex(b, 2)];

describe('nested board: addressing and basics', () => {
  it('maps global indices to small board and cell', () => {
    expect(boardOfCell(0)).toBe(0);
    expect(cellOfCell(0)).toBe(0);
    expect(boardOfCell(80)).toBe(8);
    expect(cellOfCell(80)).toBe(8);
    expect(boardOfCell(40)).toBe(4);
    expect(cellOfCell(40)).toBe(4);
    expect(globalIndex(3, 7)).toBe(34);
    for (let g = 0; g < NESTED_CELLS; g++) expect(globalIndex(boardOfCell(g), cellOfCell(g))).toBe(g);
  });

  it('starts empty with X to move and a free choice of all nine boards', () => {
    const p = emptyNestedPosition();
    expect(p.cells).toHaveLength(81);
    expect(p.cells.every((c) => c === '')).toBe(true);
    expect(p.claims).toEqual(Array(9).fill(''));
    expect(p.toMove).toBe('X');
    expect(p.forced).toBeNull();
    expect(p.ply).toBe(0);
    expect(playableBoards(p)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(nestedLegalMoves(p)).toHaveLength(81);
  });

  it('sends the opponent to the small board matching the cell played', () => {
    const p = playNested(emptyNestedPosition(), globalIndex(4, 2));
    expect(p.cells[globalIndex(4, 2)]).toBe('X');
    expect(p.toMove).toBe('O');
    expect(p.forced).toBe(2);
    expect(playableBoards(p)).toEqual([2]);
    expect(nestedLegalMoves(p)).toEqual([18, 19, 20, 21, 22, 23, 24, 25, 26]);
    expect(isNestedLegal(p, globalIndex(4, 0))).toBe(false);
    expect(isNestedLegal(p, globalIndex(2, 4))).toBe(true);
    expect(() => playNested(p, globalIndex(5, 0))).toThrow(RangeError);
  });

  it('a cell pointing at its own board keeps the opponent there', () => {
    const p = playNested(emptyNestedPosition(), globalIndex(4, 4));
    expect(p.forced).toBe(4);
    expect(isNestedLegal(p, globalIndex(4, 4))).toBe(false);
    expect(isNestedLegal(p, globalIndex(4, 0))).toBe(true);
  });

  it('rejects malformed indices', () => {
    const p = emptyNestedPosition();
    for (const g of [-1, 81, 1.5, Number.NaN]) expect(isNestedLegal(p, g)).toBe(false);
  });

  it('claims a small board with three in a row and closes it', () => {
    const moves = claimedThenReentered();
    const p = nestedFromMoves(moves.slice(0, -1));
    const claimer = p.claims[0];
    expect(claimer === 'X' || claimer === 'O').toBe(true);
    // The claiming move was the last one played, by the claimer, inside board 0.
    expect(boardOfCell(moves[moves.length - 2]!)).toBe(0);
    expect(claimer).toBe(p.toMove === 'X' ? 'O' : 'X');
    expect(playableBoards(p)).not.toContain(0);
    expect(isNestedLegal(p, moves[moves.length - 1]!)).toBe(false);
    for (let i = 0; i < 9; i++) expect(isNestedLegal(p, globalIndex(0, i))).toBe(false);
  });

  it('claimOf finds lines, full boards and open boards', () => {
    const cells: Cell[] = Array(81).fill('');
    expect(claimOf(cells, 3)).toBe('');
    for (const g of topRow(3)) cells[g] = 'O';
    expect(claimOf(cells, 3)).toBe('O');
    const draw = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'] as const;
    draw.forEach((m, i) => (cells[globalIndex(5, i)] = m));
    expect(claimOf(cells, 5)).toBe('draw');
    cells[globalIndex(5, 8)] = '';
    expect(claimOf(cells, 5)).toBe('');
  });

  it('bigWin needs three claims of one player in a line; draws count for nobody', () => {
    expect(bigWin(['X', 'X', 'X', '', '', '', '', '', ''])).toEqual({ mark: 'X', line: [0, 1, 2] });
    expect(bigWin(['O', '', '', 'O', '', '', 'O', '', ''])).toEqual({ mark: 'O', line: [0, 3, 6] });
    expect(bigWin(['', '', 'X', '', 'X', '', 'X', '', ''])).toEqual({ mark: 'X', line: [2, 4, 6] });
    expect(bigWin(['X', 'X', 'draw', '', '', '', '', '', ''])).toBeNull();
    expect(bigWin(['draw', 'draw', 'draw', '', '', '', '', '', ''])).toBeNull();
    expect(bigWin(['X', 'O', 'X', '', '', '', '', '', ''])).toBeNull();
  });
});

describe('nested board: properties against the coordinate oracle', () => {
  it('legal moves, claims, winner and end of game match the oracle after every move', () => {
    fc.assert(
      fc.property(arbGame, (moves) => {
        let p = emptyNestedPosition();
        for (let n = 0; n <= moves.length; n++) {
          const o = oracle(moves.slice(0, n));
          expect(nestedLegalMoves(p)).toEqual(o.legal);
          for (let b = 0; b < 9; b++) expect(p.claims[b]).toBe(o.claim(Math.floor(b / 3), b % 3));
          const outcome = nestedOutcome(p);
          expect(outcome.kind === 'won' ? outcome.mark : null).toBe(o.winner);
          expect(outcome.kind !== 'playing').toBe(o.over);
          if (n < moves.length) p = playNested(p, moves[n]!);
        }
      }),
      { numRuns: 150 }
    );
  });

  it('forced-board rule: the next board is the cell position unless that board is decided', () => {
    fc.assert(
      fc.property(arbGame, (moves) => {
        fc.pre(moves.length > 0);
        const p = nestedFromMoves(moves);
        fc.pre(nestedOutcome(p).kind === 'playing');
        const target = cellOfCell(moves[moves.length - 1]!);
        if (p.claims[target] === '') {
          expect(p.forced).toBe(target);
          expect(playableBoards(p)).toEqual([target]);
        } else {
          expect(p.forced).toBeNull();
          expect(playableBoards(p)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((b) => p.claims[b] === ''));
        }
      }),
      { numRuns: 300 }
    );
  });

  it('claims never change once made, and nobody plays in a decided board', () => {
    fc.assert(
      fc.property(arbGame, (moves) => {
        let p = emptyNestedPosition();
        for (const g of moves) {
          expect(p.claims[boardOfCell(g)]).toBe('');
          const next = playNested(p, g);
          p.claims.forEach((claim, b) => {
            if (claim !== '') expect(next.claims[b]).toBe(claim);
          });
          expect(next.cells.filter((c, i) => c !== p.cells[i])).toHaveLength(1);
          expect(next.ply).toBe(p.ply + 1);
          p = next;
        }
      }),
      { numRuns: 200 }
    );
  });

  it('a draw happens only when every small board is decided without a winning line', () => {
    fc.assert(
      fc.property(arbGame, (moves) => {
        const p = nestedFromMoves(moves);
        const outcome = nestedOutcome(p);
        if (outcome.kind === 'draw') {
          expect(p.claims.every((c) => c !== '')).toBe(true);
          expect(bigWin(p.claims)).toBeNull();
        }
        if (outcome.kind === 'playing') expect(nestedLegalMoves(p).length).toBeGreaterThan(0);
      }),
      { numRuns: 200 }
    );
  });
});

describe('nested state', () => {
  it('creates an empty round whose PRNG starts at the seed', () => {
    expect(createNestedRound({ seed: 9, difficulty: 'easy', opponent: 'computer', starter: 'computer' })).toEqual(
      state({ seed: 9, rng: 9, difficulty: 'easy', opponent: 'computer', starter: 'computer' })
    );
  });

  it('knows whose turn it is and applies moves immutably', () => {
    const s = state({ opponent: 'computer', starter: 'human' });
    expect(isNestedComputerTurn(s)).toBe(false);
    const next = applyNestedMove(s, 40);
    expect(s.moves).toEqual([]);
    expect(next.moves).toEqual([40]);
    expect(isNestedComputerTurn(next)).toBe(true);
    expect(isNestedComputerTurn(state({ opponent: 'human', moves: [40] }))).toBe(false);
    expect(isNestedComputerTurn(state({ opponent: 'computer', starter: 'computer' }))).toBe(true);
    expect(() => applyNestedMove(next, 0)).toThrow(RangeError);
  });

  it('undoes single moves between people and move pairs against the computer', () => {
    expect(canUndoNested(state())).toBe(false);
    const two = state({ moves: [40, 36] });
    expect(canUndoNested(two)).toBe(true);
    expect(undoNested(two).moves).toEqual([40]);
    const vs = state({ opponent: 'computer', starter: 'human', moves: [40, 36] });
    expect(undoNested(vs).moves).toEqual([]);
    const vsComputerFirst = state({ opponent: 'computer', starter: 'computer', moves: [40] });
    expect(canUndoNested(vsComputerFirst)).toBe(false);
    expect(undoNested(vsComputerFirst)).toBe(vsComputerFirst);
    const later = state({ opponent: 'computer', starter: 'computer', moves: [40, 36, 0] });
    expect(undoNested(later).moves).toEqual([40]);
  });

  it('accepts every state reached by legal play', () => {
    fc.assert(
      fc.property(arbGame, (moves) => {
        expect(isValidNestedState(state({ moves }))).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it.each([
    ['not an object', 7],
    ['wrong variant', { ...state(), variant: 'classic' }],
    ['extra field', { ...state(), forced: 3 }],
    ['missing field', (({ rng: _r, ...rest }) => rest)(state())],
    ['bad seed', state({ seed: -1 })],
    ['bad rng', state({ rng: 2 ** 32 })],
    ['unknown difficulty', { ...state(), difficulty: 'hard' }],
    ['unknown opponent', { ...state(), opponent: 'robot' }],
    ['unknown starter', { ...state(), starter: 'O' }],
    ['move out of range', state({ moves: [81] })],
    ['fractional move', state({ moves: [1.5] })],
    ['repeated cell', state({ moves: [40, 36, 4, 40] })],
    ['ignores the forced board', state({ moves: [40, 0] })],
    ['half a turn against the computer', state({ opponent: 'computer', starter: 'human', moves: [40] })],
    ['computer has not opened', state({ opponent: 'computer', starter: 'computer', moves: [] })]
  ])('rejects %s', (_label, value) => {
    expect(isValidNestedState(value)).toBe(false);
  });

  it('rejects a move into a claimed board', () => {
    expect(isValidNestedState(state({ moves: claimedThenReentered().slice(0, -1) }))).toBe(true);
    expect(isValidNestedState(state({ moves: claimedThenReentered() }))).toBe(false);
  });

  it('rejects moves after the game is over and never throws', () => {
    const won = findFinishedGame();
    expect(isValidNestedState(state({ moves: won }))).toBe(true);
    const extra = Array.from({ length: 81 }, (_, g) => g).find((g) => !won.includes(g))!;
    expect(isValidNestedState(state({ moves: [...won, extra] }))).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => void expect(() => isValidNestedState(v)).not.toThrow()), { numRuns: 200 });
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -2, max: 90 }), { maxLength: 90 }), (moves) => {
        expect(() => isValidNestedState(state({ moves }))).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });
});

/** X claims board 0 (top row) while O plays harmless cells; then a move into board 0 follows. */
function claimedThenReentered(): number[] {
  // X: (0,0) -> O to board 0? No: X plays cell 0 of board 0 => O goes to board 0.
  // Use a sequence found by search: first legal game where board 0 gets claimed, then append an illegal re-entry.
  let p = emptyNestedPosition();
  const moves: number[] = [];
  for (let step = 0; step < 81 && p.claims[0] === ''; step++) {
    const legal = nestedLegalMoves(p);
    const preferred = legal.find((g) => boardOfCell(g) === 0 && p.toMove === 'X') ?? legal[0]!;
    moves.push(preferred);
    p = playNested(p, preferred);
  }
  expect(p.claims[0]).not.toBe('');
  const reentry = Array.from({ length: 9 }, (_, i) => globalIndex(0, i)).find((g) => p.cells[g] === '');
  return [...moves, reentry ?? globalIndex(0, 0)];
}

/** The first game (lowest legal move each time) that ends. */
function findFinishedGame(): number[] {
  let p = emptyNestedPosition();
  const moves: number[] = [];
  while (nestedOutcome(p).kind === 'playing') {
    const g = nestedLegalMoves(p)[0]!;
    moves.push(g);
    p = playNested(p, g);
  }
  return moves;
}
