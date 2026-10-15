import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CONNECTS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  OPPONENTS,
  SIZES,
  STANDARD_VARIANT,
  STARTERS,
  advance,
  applyMove,
  applyToBoard,
  canPull,
  canUndo,
  cellIndex,
  colOf,
  completeLines,
  computerPlayer,
  createRound,
  dropMove,
  dropRow,
  emptyBoard,
  gameOf,
  geometryOf,
  hasGravity,
  humanPlayer,
  isComputerTurn,
  isLegalMove,
  isPull,
  isValidState,
  isValidVariant,
  legalMoves,
  migrateState,
  moveColumn,
  moveLimit,
  other,
  playerOfMove,
  positionKey,
  pullMove,
  replay,
  rowOf,
  sizeOf,
  startGame,
  undo,
  winAfter,
  type Board,
  type Cell,
  type ConnectFourState,
  type Geometry,
  type Move,
  type Player,
  type Variant
} from '../src/rules';

const V = (size: Variant['size'] = '7x6', connect: Variant['connect'] = 4, pullOut = false): Variant => ({ size, connect, pullOut });
const PULL = V('7x6', 4, true);
const ALL_VARIANTS: Variant[] = [];
for (const pullOut of [false, true]) for (const size of SIZES) for (const connect of CONNECTS) ALL_VARIANTS.push({ size, connect, pullOut });

/**
 * Builds a board from a picture of rows (top row first): '.' = empty, '1' / '2' = discs.
 * Whitespace is ignored; the picture must have exactly `cols * rows` cells.
 */
const B = (picture: string, geo: Geometry = geometryOf(STANDARD_VARIANT)): Cell[] => {
  const chars = [...picture.replace(/\s/g, '')];
  if (chars.length !== geo.cellCount) throw new Error(`picture has ${chars.length} cells`);
  return chars.map((c) => (c === '.' ? 0 : (Number(c) as Cell)));
};

/** A legal standard game that fills the board without any line of four. */
const DRAW_MOVES = [3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 6, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6];

/** Pull-out: two drops and two pulls bring back the empty board (filled to move). */
const CYCLE: Move[] = [0, 1, pullMove(0), pullMove(1)];

/**
 * Independent brute-force oracle: from every cell, walks `connect` cells in each of the 8
 * compass directions by (row, col) coordinates and reports each line once, as a sorted
 * key, together with its owner.
 */
function oracleLines(board: Board, cols: number, rows: number, connect: number): Map<string, Player> {
  const at = (r: number, c: number) => (r >= 0 && r < rows && c >= 0 && c < cols ? board[r * cols + c] : undefined);
  const found = new Map<string, Player>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const owner = at(r, c);
          if (owner !== 1 && owner !== 2) continue;
          const cells = Array.from({ length: connect }, (_, k) => [r + dr * k, c + dc * k] as const);
          if (cells.every(([rr, cc]) => at(rr, cc) === owner)) {
            found.set(
              cells
                .map(([rr, cc]) => rr * cols + cc)
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

/** All windows by brute force (every cell, 8 directions, deduplicated). */
function oracleWindows(cols: number, rows: number, connect: number): Set<string> {
  const windows = new Set<string>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const cells = Array.from({ length: connect }, (_, k) => [r + dr * k, c + dc * k] as const);
          if (cells.every(([rr, cc]) => rr >= 0 && rr < rows && cc >= 0 && cc < cols)) {
            windows.add(
              cells
                .map(([rr, cc]) => rr * cols + cc)
                .sort((a, b) => a - b)
                .join(',')
            );
          }
        }
      }
    }
  }
  return windows;
}

const lineKey = (line: readonly number[]) => [...line].sort((a, b) => a - b).join(',');

const arbVariant = fc.constantFrom(...ALL_VARIANTS);

/** A variant and an arbitrary board for it (not necessarily reachable, discs may float), biased to long runs. */
const arbVariantBoard = arbVariant.chain((variant) => {
  const { cellCount } = geometryOf(variant);
  return fc
    .array(fc.constantFrom<Cell>(1, 1, 2, 2, 0), { minLength: cellCount, maxLength: cellCount })
    .map((board) => ({ variant, board }));
});

/** A variant and a legal move sequence for it (stops when the game ends). */
const arbGame = (maxMoves = 80) =>
  fc.tuple(arbVariant, fc.array(fc.nat(), { maxLength: maxMoves })).map(([variant, choices]) => {
    let game = startGame(variant);
    const moves: Move[] = [];
    for (const choice of choices) {
      if (game.outcome.kind !== 'playing') break;
      const legal = legalMoves(variant, game.cells, game.turn);
      const move = legal[choice % legal.length] as Move;
      game = advance(game, move);
      moves.push(move);
    }
    return { variant, moves, game };
  });

const state = (overrides: Partial<ConnectFourState> = {}): ConnectFourState => ({
  seed: 1,
  difficulty: 'medium',
  opponent: 'human',
  starter: 'human',
  variant: { ...STANDARD_VARIANT },
  moves: [],
  rng: 1,
  ...overrides
});

describe('variants and geometry', () => {
  it('offers three sizes, two goals and the standard variant', () => {
    expect(SIZES).toEqual(['7x6', '8x7', '9x7']);
    expect(CONNECTS).toEqual([4, 5]);
    expect(STANDARD_VARIANT).toEqual({ size: '7x6', connect: 4, pullOut: false });
    expect(sizeOf('9x7')).toEqual({ cols: 9, rows: 7 });
    expect(sizeOf('8x7')).toEqual({ cols: 8, rows: 7 });
    const geo = geometryOf(V('9x7', 5));
    expect([geo.cols, geo.rows, geo.connect, geo.cellCount]).toEqual([9, 7, 5, 63]);
    // Cached and independent of the pull-out rule.
    expect(geometryOf(V('9x7', 5, true))).toBe(geo);
    expect(geometryOf(V('9x7', 4))).not.toBe(geo);
  });

  it('maps rows and columns to indices (row 0 at the top)', () => {
    const geo = geometryOf(V('9x7'));
    expect(cellIndex(geo, 0, 0)).toBe(0);
    expect(cellIndex(geo, 6, 8)).toBe(62);
    expect(cellIndex(geo, 1, 2)).toBe(11);
    expect(rowOf(geo, 11)).toBe(1);
    expect(colOf(geo, 11)).toBe(2);
    expect(rowOf(geo, 62)).toBe(6);
    expect(colOf(geo, 62)).toBe(8);
  });

  it('defines exactly the windows the brute-force oracle finds, for every size and goal', () => {
    const counts: Record<string, number> = {};
    for (const size of SIZES) {
      for (const connect of CONNECTS) {
        const geo = geometryOf({ size, connect });
        const { cols, rows } = sizeOf(size);
        const keys = geo.lines.map(lineKey);
        expect(new Set(keys).size).toBe(keys.length);
        expect(new Set(keys)).toEqual(oracleWindows(cols, rows, connect));
        for (const line of geo.lines) expect(line).toHaveLength(connect);
        counts[`${size}/${connect}`] = keys.length;
      }
    }
    expect(counts).toEqual({ '7x6/4': 69, '7x6/5': 44, '8x7/4': 107, '8x7/5': 76, '9x7/4': 126, '9x7/5': 92 });
  });

  it('lists lines in walking order: horizontal, vertical, then both diagonals', () => {
    const geo = geometryOf(STANDARD_VARIANT);
    expect(geo.lines[0]).toEqual([0, 1, 2, 3]);
    expect(geo.lines[24]).toEqual([0, 7, 14, 21]);
    expect(geo.lines[45]).toEqual([0, 8, 16, 24]);
    expect(geo.lines[57]).toEqual([3, 9, 15, 21]);
  });

  it('validates variants', () => {
    for (const variant of ALL_VARIANTS) expect(isValidVariant(variant)).toBe(true);
    expect(isValidVariant({ size: '10x7', connect: 4, pullOut: false })).toBe(false);
    expect(isValidVariant({ size: '7x6', connect: 3, pullOut: false })).toBe(false);
    expect(isValidVariant({ size: '7x6', connect: 4, pullOut: 'yes' })).toBe(false);
    expect(isValidVariant({ size: '7x6', connect: 4 })).toBe(false);
    expect(isValidVariant({ size: '7x6', connect: 4, pullOut: false, extra: 1 })).toBe(false);
    expect(isValidVariant(null)).toBe(false);
  });

  it('caps pull-out games at four times the number of cells', () => {
    expect(moveLimit(V('7x6', 4, true))).toBe(168);
    expect(moveLimit(V('9x7', 5, true))).toBe(252);
    expect(moveLimit(V('8x7', 4, false))).toBe(56);
  });
});

describe('players and move encoding', () => {
  it('alternates players, 1 first', () => {
    expect([0, 1, 2, 3].map(playerOfMove)).toEqual([1, 2, 1, 2]);
    expect(other(1)).toBe(2);
    expect(other(2)).toBe(1);
  });

  it('encodes drops as the column and pulls as -(column + 1)', () => {
    expect(dropMove(3)).toBe(3);
    expect(pullMove(0)).toBe(-1);
    expect(pullMove(8)).toBe(-9);
    expect(isPull(-1)).toBe(true);
    expect(isPull(0)).toBe(false);
    expect(moveColumn(-1)).toBe(0);
    expect(moveColumn(-9)).toBe(8);
    expect(moveColumn(5)).toBe(5);
  });
});

describe('gravity, drops and pull-outs', () => {
  const geo = geometryOf(STANDARD_VARIANT);
  const board = B(`
    .......
    .......
    .......
    ..2....
    ..1....
    .21...1`);

  it('drops into the lowest free row', () => {
    expect(dropRow(geo, board, 0)).toBe(5);
    expect(dropRow(geo, board, 1)).toBe(4);
    expect(dropRow(geo, board, 2)).toBe(2);
    expect(dropRow(geo, B('2......'.repeat(6)), 0)).toBe(-1);
    for (const col of [-1, 7, 1.5, NaN]) expect(dropRow(geo, board, col)).toBe(-1);
  });

  it('allows pulling only your own bottom disc, and only with the pull-out rule', () => {
    expect(canPull(geo, board, 2, 1)).toBe(true);
    expect(canPull(geo, board, 2, 2)).toBe(false);
    expect(canPull(geo, board, 1, 2)).toBe(true);
    expect(canPull(geo, board, 0, 1)).toBe(false);
    expect(canPull(geo, board, 0, 2)).toBe(false);
    for (const col of [-1, 7, 0.5]) expect(canPull(geo, board, col, 1)).toBe(false);
    expect(isLegalMove(PULL, board, pullMove(2), 1)).toBe(true);
    expect(isLegalMove(PULL, board, pullMove(1), 1)).toBe(false);
    expect(isLegalMove(STANDARD_VARIANT, board, pullMove(2), 1)).toBe(false);
    expect(isLegalMove(PULL, board, 2.5, 1)).toBe(false);
    expect(isLegalMove(PULL, board, 7, 1)).toBe(false);
  });

  it('lists drops by column, then pulls by column', () => {
    expect(legalMoves(STANDARD_VARIANT, board, 1)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(legalMoves(PULL, board, 1)).toEqual([0, 1, 2, 3, 4, 5, 6, -3, -7]);
    expect(legalMoves(PULL, board, 2)).toEqual([0, 1, 2, 3, 4, 5, 6, -2]);
    const full = B('1212121'.repeat(6));
    expect(legalMoves(STANDARD_VARIANT, full, 1)).toEqual([]);
    expect(legalMoves(PULL, full, 2)).toEqual([-2, -4, -6]);
  });

  it('drops and pulls on a copy; a pull lets everything above fall one cell', () => {
    const dropped = applyToBoard(PULL, board, 2, 2);
    expect(dropped[cellIndex(geo, 2, 2)]).toBe(2);
    expect(board[cellIndex(geo, 2, 2)]).toBe(0);
    const pulled = applyToBoard(PULL, board, pullMove(2), 1);
    expect(pulled).toEqual(
      B(`
      .......
      .......
      .......
      .......
      ..2....
      .21...1`)
    );
    expect(board[cellIndex(geo, 3, 2)]).toBe(2);
    // A full column empties its top cell.
    const tower = B('1......2......1......2......1......2......');
    expect(applyToBoard(PULL, tower, pullMove(0), 2)).toEqual(B('.......1......2......1......2......1......'));
    expect(applyToBoard(PULL, board, pullMove(6), 1)).toEqual(B('.'.repeat(39) + '1..').map((_, i) => (i === 41 ? 0 : board[i] as Cell)));
    expect(() => applyToBoard(PULL, board, pullMove(1), 1)).toThrow(RangeError);
    expect(() => applyToBoard(STANDARD_VARIANT, board, pullMove(2), 1)).toThrow(RangeError);
    expect(() => applyToBoard(PULL, tower, 0, 1)).toThrow(RangeError);
  });

  it('recognises floating discs', () => {
    expect(hasGravity(geo, board)).toBe(true);
    expect(hasGravity(geo, emptyBoard(geo))).toBe(true);
    expect(hasGravity(geo, B('1' + '.'.repeat(41)))).toBe(false);
    expect(hasGravity(geo, B('.'.repeat(28) + '1' + '.'.repeat(13)))).toBe(false);
    expect(hasGravity(geo, B('.'.repeat(34) + '1' + '.'.repeat(7)))).toBe(false);
    expect(hasGravity(geo, B('.'.repeat(34) + '1' + '.'.repeat(6) + '2'))).toBe(true);
    expect(hasGravity(geo, board.slice(1))).toBe(false);
  });

  it('property: discs never float, also after pull-outs, and every move changes exactly its column', () => {
    fc.assert(
      fc.property(arbGame(120), ({ variant, moves }) => {
        const g = geometryOf(variant);
        let game = startGame(variant);
        for (const move of moves) {
          const before = game.cells;
          const col = moveColumn(move);
          const mover = game.turn;
          game = advance(game, move);
          expect(hasGravity(g, game.cells)).toBe(true);
          for (let i = 0; i < g.cellCount; i++) if (i % g.cols !== col) expect(game.cells[i]).toBe(before[i]);
          const height = (b: Board) => b.filter((c, i) => c !== 0 && i % g.cols === col).length;
          if (isPull(move)) {
            expect(before[(g.rows - 1) * g.cols + col]).toBe(mover);
            expect(height(game.cells)).toBe(height(before) - 1);
          } else {
            expect(height(game.cells)).toBe(height(before) + 1);
            expect(game.cells[(g.rows - height(game.cells)) * g.cols + col]).toBe(mover);
          }
        }
      }),
      { numRuns: 150 }
    );
  });

  it('property: a pull is legal exactly for your own bottom disc under the pull-out rule', () => {
    fc.assert(
      fc.property(arbGame(60), fc.nat(8), fc.constantFrom<Player>(1, 2), ({ variant, game }, c, player) => {
        const g = geometryOf(variant);
        const col = c % g.cols;
        const own = game.cells[(g.rows - 1) * g.cols + col] === player;
        expect(isLegalMove(variant, game.cells, pullMove(col), player)).toBe(variant.pullOut && own);
        expect(legalMoves(variant, game.cells, player).includes(pullMove(col))).toBe(variant.pullOut && own);
      }),
      { numRuns: 200 }
    );
  });
});

describe('lines and winners', () => {
  const geo = geometryOf(STANDARD_VARIANT);

  it('finds lines of four and of five', () => {
    const board = B(`
      .......
      .......
      .......
      .......
      .......
      11111..`);
    expect(completeLines(geo, board).map((f) => f.line)).toEqual([
      [35, 36, 37, 38],
      [36, 37, 38, 39]
    ]);
    const five = geometryOf(V('7x6', 5));
    expect(completeLines(five, board)).toEqual([{ player: 1, line: [35, 36, 37, 38, 39] }]);
    expect(completeLines(five, B('.'.repeat(35) + '1111.11'))).toEqual([]);
  });

  it('lets the mover win when a move completes lines for both sides', () => {
    // Both players have a line (only a pull-out can do that).
    const both = B(`
      .......
      .......
      2......
      2......
      2......
      21111..`);
    expect(winAfter(geo, both, 1)).toEqual({ player: 1, cells: [36, 37, 38, 39] });
    expect(winAfter(geo, both, 2)).toEqual({ player: 2, cells: [14, 21, 28, 35] });
    // Only the opponent has a line: the opponent wins.
    const theirs = B('.'.repeat(35) + '2222111');
    expect(winAfter(geo, theirs, 1)?.player).toBe(2);
    expect(winAfter(geo, B('.'.repeat(42)), 1)).toBeNull();
  });

  it('reports all cells of every line of the winner (e.g. crossing lines)', () => {
    const board = B(`
      .......
      .......
      ...1...
      ...1...
      ...1...
      1111...`);
    expect(winAfter(geo, board, 1)?.cells).toEqual([17, 24, 31, 35, 36, 37, 38]);
  });

  it('property: line detection matches the brute-force oracle on every size and goal', () => {
    fc.assert(
      fc.property(arbVariantBoard, ({ variant, board }) => {
        const g = geometryOf(variant);
        const oracle = oracleLines(board, g.cols, g.rows, g.connect);
        const found = new Map(completeLines(g, board).map((f) => [lineKey(f.line), f.player] as const));
        expect(found).toEqual(oracle);
        for (const mover of [1, 2] as const) {
          const win = winAfter(g, board, mover);
          const owners = new Set(oracle.values());
          const expected = owners.has(mover) ? mover : owners.has(other(mover)) ? other(mover) : null;
          expect(win?.player ?? null).toBe(expected);
          if (win) {
            const cells = new Set<number>();
            for (const [key, owner] of oracle) if (owner === win.player) for (const i of key.split(',')) cells.add(Number(i));
            expect(win.cells).toEqual([...cells].sort((a, b) => a - b));
          }
        }
      }),
      { numRuns: 300 }
    );
  });
});

describe('playing a game', () => {
  it('starts empty with player 1 to move and the start position seen once', () => {
    const game = startGame(V('8x7'));
    expect(game.cells).toHaveLength(56);
    expect(game.cells.every((c) => c === 0)).toBe(true);
    expect(game.turn).toBe(1);
    expect(game.ply).toBe(0);
    expect(game.outcome).toEqual({ kind: 'playing' });
    expect([...game.seen.entries()]).toEqual([[positionKey(game.cells, 1), 1]]);
  });

  it('advances without touching the previous game (unless asked to reuse the history)', () => {
    const start = startGame(PULL);
    const next = advance(start, 3);
    expect(next.turn).toBe(2);
    expect(next.ply).toBe(1);
    expect(start.cells.every((c) => c === 0)).toBe(true);
    expect(start.seen.size).toBe(1);
    expect(next.seen.size).toBe(2);
    const reused = advance(start, 3, true);
    expect(reused.seen).toBe(start.seen);
    expect(start.seen.size).toBe(2);
    expect(() => advance(startGame(PULL), pullMove(0))).toThrow(RangeError);
  });

  it('ends a classic game with the board full as a draw', () => {
    const game = replay(STANDARD_VARIANT, DRAW_MOVES);
    expect(game.outcome).toEqual({ kind: 'draw', reason: 'full' });
    expect(() => advance(game, 0)).toThrow('already over');
  });

  it('does not end a pull-out game when the board is full', () => {
    const game = replay(PULL, DRAW_MOVES);
    expect(game.outcome).toEqual({ kind: 'playing' });
    expect(game.cells.every((c) => c !== 0)).toBe(true);
    expect(legalMoves(PULL, game.cells, game.turn).every((m) => isPull(m))).toBe(true);
    expect(legalMoves(PULL, game.cells, game.turn).length).toBeGreaterThan(0);
  });

  it('calls the third occurrence of a position a draw (repetition)', () => {
    const twice = replay(PULL, CYCLE);
    expect(twice.outcome).toEqual({ kind: 'playing' });
    expect(twice.seen.get(positionKey(twice.cells, 1))).toBe(2);
    const almost = replay(PULL, [...CYCLE, ...CYCLE.slice(0, 3)]);
    expect(almost.outcome).toEqual({ kind: 'playing' });
    expect(replay(PULL, [...CYCLE, ...CYCLE]).outcome).toEqual({ kind: 'draw', reason: 'repetition' });
  });

  it('a win on the third occurrence still counts as a win', () => {
    // The repetition check comes after the line check (a repeated position cannot hold a line, so this is about order only).
    const game = replay(PULL, [0, 1, 0, 1, 0, 1, 0]);
    expect(game.outcome.kind).toBe('won');
  });

  it('ends a pull-out game at the move limit (classic games end by the full board instead)', () => {
    const limit = moveLimit(PULL);
    const before = advance({ ...startGame(PULL), ply: limit - 2 }, 3);
    expect(before.outcome).toEqual({ kind: 'playing' });
    const last = advance(before, 3);
    expect(last.ply).toBe(limit);
    expect(last.outcome).toEqual({ kind: 'draw', reason: 'limit' });
    // A win on the last move still counts.
    const cells = B('.'.repeat(35) + '111....');
    expect(advance({ ...startGame(PULL), cells, ply: limit - 1 }, 3).outcome.kind).toBe('won');
    // Without the pull-out rule the move limit never applies.
    expect(advance({ ...startGame(STANDARD_VARIANT), ply: 500 }, 3).outcome).toEqual({ kind: 'playing' });
  });

  it('awards the win to the puller when a pull completes lines for both sides (Hasbro rule)', () => {
    const geo = geometryOf(STANDARD_VARIANT);
    const cells = B(`
      .......
      .......
      .......
      ....1..
      .1112..
      .2221..`);
    const game = advance({ ...startGame(PULL), cells, turn: 1 }, pullMove(4));
    expect(game.cells.slice(28)).toEqual(B('.'.repeat(28) + '.1111...2222..').slice(28));
    expect(new Set(completeLines(geo, game.cells).map((l) => l.player))).toEqual(new Set([1, 2]));
    expect(game.outcome).toEqual({ kind: 'won', win: { player: 1, cells: [29, 30, 31, 32] } });
  });

  it('hands the win to the opponent when a pull completes only their line', () => {
    const cells = B(`
      .......
      .......
      .......
      .......
      ....2..
      .2221..`);
    const game = advance({ ...startGame(PULL), cells, turn: 1 }, pullMove(4));
    expect(game.outcome).toEqual({ kind: 'won', win: { player: 2, cells: [36, 37, 38, 39] } });
  });

  it('property: replaying a game gives the same position as advancing it', () => {
    fc.assert(
      fc.property(arbGame(100), ({ variant, moves, game }) => {
        const again = replay(variant, moves);
        expect(again.cells).toEqual(game.cells);
        expect(again.turn).toBe(game.turn);
        expect(again.ply).toBe(moves.length);
        expect(again.outcome).toEqual(game.outcome);
        expect(again.turn).toBe(playerOfMove(moves.length));
      }),
      { numRuns: 120 }
    );
  });

  it('property: in classic games only the last mover can have a line, and a draw means a full board', () => {
    fc.assert(
      fc.property(arbGame(63), ({ variant, moves, game }) => {
        if (variant.pullOut) return;
        const lines = completeLines(game.geo, game.cells);
        if (moves.length > 0) for (const line of lines) expect(line.player).toBe(playerOfMove(moves.length - 1));
        if (game.outcome.kind === 'draw') expect(game.cells.every((c) => c !== 0)).toBe(true);
        expect(game.outcome.kind === 'won').toBe(lines.length > 0);
      }),
      { numRuns: 150 }
    );
  });
});

describe('game state transitions', () => {
  it('creates an empty round whose PRNG starts at the seed, with a copy of the variant', () => {
    const variant = V('9x7', 5, true);
    const round = createRound({ seed: 42, difficulty: 'hard', opponent: 'computer', starter: 'computer', variant });
    expect(round).toEqual({ seed: 42, difficulty: 'hard', opponent: 'computer', starter: 'computer', variant, moves: [], rng: 42 });
    expect(round.variant).not.toBe(variant);
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
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'computer' }))).toBe(true);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human' }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'human', moves: [3] }))).toBe(true);
    expect(isComputerTurn(state({ opponent: 'human', moves: [3] }))).toBe(false);
    expect(isComputerTurn(state({ opponent: 'computer', starter: 'computer', moves: [0, 1, 0, 1, 0, 1, 0] }))).toBe(false);
  });

  it('applies moves immutably and refuses illegal or post-game moves', () => {
    const s = state({ variant: PULL, moves: [3] });
    const next = applyMove(s, 4);
    expect(next.moves).toEqual([3, 4]);
    expect(s.moves).toEqual([3]);
    expect(applyMove(next, pullMove(3)).moves).toEqual([3, 4, -4]);
    expect(() => applyMove(next, pullMove(4))).toThrow(RangeError);
    expect(() => applyMove(state(), pullMove(0))).toThrow(RangeError);
    expect(() => applyMove(state({ moves: [0, 1, 0, 1, 0, 1, 0] }), 2)).toThrow(RangeError);
    expect(gameOf(next).cells[cellIndex(geometryOf(PULL), 5, 4)]).toBe(2);
  });

  it('undoes single moves between two people, including pulls', () => {
    const s = state({ variant: PULL, moves: [3, 4, pullMove(3)] });
    expect(canUndo(s)).toBe(true);
    expect(undo(s).moves).toEqual([3, 4]);
    expect(canUndo(state())).toBe(false);
    expect(undo(state())).toEqual(state());
  });

  it('undoes the person’s move together with the computer’s reply', () => {
    const vsComputer = state({ opponent: 'computer', starter: 'human', moves: [3, 3, 2, 2] });
    expect(undo(vsComputer).moves).toEqual([3, 3]);
    const computerFirst = state({ opponent: 'computer', starter: 'computer', moves: [3] });
    expect(canUndo(computerFirst)).toBe(false);
    const later = state({ opponent: 'computer', starter: 'computer', moves: [3, 2, 3] });
    expect(canUndo(later)).toBe(true);
    expect(undo(later).moves).toEqual([3]);
  });

  it('does not offer undo once the game is over', () => {
    expect(canUndo(state({ moves: [0, 1, 0, 1, 0, 1, 0] }))).toBe(false);
    expect(canUndo(state({ variant: PULL, moves: [...CYCLE, ...CYCLE] }))).toBe(false);
  });
});

describe('isValidState and migration', () => {
  it('accepts valid states of every variant', () => {
    expect(isValidState(state())).toBe(true);
    expect(isValidState(state({ variant: PULL, moves: [3, 4, pullMove(3)] }))).toBe(true);
    expect(isValidState(state({ variant: V('9x7', 5), moves: [8, 8, 0] }))).toBe(true);
    expect(isValidState(state({ moves: DRAW_MOVES }))).toBe(true);
    expect(isValidState(state({ variant: PULL, moves: [...CYCLE, ...CYCLE] }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'human', moves: [3, 3] }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'computer', moves: [3] }))).toBe(true);
    expect(isValidState(state({ opponent: 'computer', starter: 'human', moves: [0, 1, 0, 1, 0, 1, 0] }))).toBe(true);
  });

  it('rejects malformed fields', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState({ ...state(), extra: 1 })).toBe(false);
    const { variant: _variant, ...withoutVariant } = state();
    expect(isValidState(withoutVariant)).toBe(false);
    expect(isValidState(state({ seed: -1 }))).toBe(false);
    expect(isValidState(state({ rng: 2 ** 32 }))).toBe(false);
    expect(isValidState(state({ difficulty: 'expert' as never }))).toBe(false);
    expect(isValidState(state({ opponent: 'robot' as never }))).toBe(false);
    expect(isValidState(state({ starter: 'nobody' as never }))).toBe(false);
    expect(isValidState(state({ variant: { size: '7x7', connect: 4, pullOut: false } as never }))).toBe(false);
    expect(isValidState(state({ moves: [7] }))).toBe(false);
    expect(isValidState(state({ variant: V('8x7'), moves: [7] }))).toBe(true);
    expect(isValidState(state({ variant: V('8x7'), moves: [8] }))).toBe(false);
    expect(isValidState(state({ moves: [1.5] }))).toBe(false);
    expect(isValidState(state({ moves: 'x' as never }))).toBe(false);
  });

  it('rejects impossible move histories (gravity and pull legality)', () => {
    // Overflowing column.
    expect(isValidState(state({ moves: [0, 0, 0, 0, 0, 0, 0] }))).toBe(false);
    // Pulls need the pull-out rule, a disc and your own disc.
    expect(isValidState(state({ moves: [0, 1, pullMove(0)] }))).toBe(false);
    expect(isValidState(state({ variant: PULL, moves: [pullMove(0)] }))).toBe(false);
    expect(isValidState(state({ variant: PULL, moves: [0, pullMove(0)] }))).toBe(false);
    expect(isValidState(state({ variant: PULL, moves: [0, 1, pullMove(0)] }))).toBe(true);
    expect(isValidState(state({ variant: PULL, moves: [0, 1, -8] }))).toBe(false);
    // No move after the end (win or repetition).
    expect(isValidState(state({ moves: [0, 1, 0, 1, 0, 1, 0, 1] }))).toBe(false);
    expect(isValidState(state({ variant: PULL, moves: [...CYCLE, ...CYCLE, 0] }))).toBe(false);
    // More moves than the limit.
    expect(isValidState(state({ variant: PULL, moves: Array.from({ length: 169 }, () => 0) }))).toBe(false);
    // Half a turn against the computer.
    expect(isValidState(state({ opponent: 'computer', starter: 'human', moves: [3] }))).toBe(false);
    expect(isValidState(state({ opponent: 'computer', starter: 'computer', moves: [] }))).toBe(false);
  });

  it('migrates version-1 saves to the standard variant', () => {
    const v1 = { seed: 5, difficulty: 'easy', opponent: 'human', starter: 'human', moves: [3, 3, 4], rng: 5 };
    expect(migrateState(v1, 1)).toEqual({ ...v1, variant: { size: '7x6', connect: 4, pullOut: false } });
    expect(isValidState(migrateState(v1, 1))).toBe(true);
    expect(migrateState(v1, 2)).toBeUndefined();
    expect(migrateState({ ...v1, moves: [9] }, 1)).toBeUndefined();
    expect(migrateState({ ...v1, variant: STANDARD_VARIANT }, 1)).toBeUndefined();
    expect(migrateState('nope', 1)).toBeUndefined();
  });

  it('property: every state reached by legal play is valid', () => {
    fc.assert(
      fc.property(arbGame(100), ({ variant, moves }) => {
        expect(isValidState(state({ variant, moves }))).toBe(true);
      }),
      { numRuns: 120 }
    );
  });

  it('property: never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(typeof isValidState(value)).toBe('boolean');
        expect(() => migrateState(value, 1)).not.toThrow();
      })
    );
    fc.assert(
      fc.property(arbVariant, fc.array(fc.integer({ min: -10, max: 9 }), { maxLength: 60 }), (variant, moves) => {
        expect(typeof isValidState(state({ variant, moves }))).toBe('boolean');
      })
    );
  });
});
