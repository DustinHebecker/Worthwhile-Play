// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRngFromState, type Rng } from '@wp/game-core';
import {
  CENTRE_WEIGHT,
  MOVE_ORDER,
  SEARCH_DEPTH,
  THREE_WEIGHT,
  TWO_WEIGHT,
  WIN_SCORE,
  analyse,
  bestMoves,
  chooseMove,
  computerReply,
  evaluate,
  playTurn,
  startRound
} from '../src/ai';
import {
  CELL_COUNT,
  COLS,
  DIFFICULTIES,
  boardFromMoves,
  boardOf,
  createRound,
  drop,
  emptyBoard,
  findWin,
  isLegalMove,
  isValidState,
  legalMoves,
  other,
  outcomeOf,
  playerOfMove,
  toMove,
  type Board,
  type Cell,
  type ConnectFourState,
  type Difficulty,
  type Player
} from '../src/rules';

/** Six rows (top first) of seven characters: '.', '1', '2'. */
const B = (picture: string): Cell[] => [...picture.replace(/\s/g, '')].map((c) => (c === '.' ? 0 : (Number(c) as Cell)));

/** Rng stub with a fixed `next()` value that records what `pick` was offered. */
function stubRng(value: number): Rng & { offered: number[][] } {
  const offered: number[][] = [];
  const int = (min: number, max: number) => min + Math.floor(value * (max - min + 1));
  return {
    offered,
    next: () => value,
    int,
    pick: <T>(items: readonly T[]) => {
      offered.push([...(items as readonly number[])]);
      return items[int(0, items.length - 1)] as T;
    },
    shuffle: <T>(items: readonly T[]) => [...items],
    state: () => 0
  };
}

/** Normalises -0 to 0 so values compare with toEqual. */
const z = (n: number) => n + 0;

/**
 * Independent reference search: plain negamax WITHOUT pruning or forced-move shortcuts,
 * on immutable rules.ts boards, with the same scoring conventions as ai.ts.
 */
function refValue(board: Board, depth: number, player: Player): number {
  const legal = legalMoves(board);
  if (legal.length === 0) return 0;
  for (const col of legal) if (findWin(drop(board, col, player))) return WIN_SCORE + depth;
  if (depth === 0) return evaluate(board, player);
  let best = -Infinity;
  for (const col of legal) best = Math.max(best, -refValue(drop(board, col, player), depth - 1, other(player)));
  return best;
}

function refRoot(board: Board, depth: number): { value: number; best: number[] } {
  const player = toMove(board);
  const scored = legalMoves(board).map((col) => {
    const next = drop(board, col, player);
    return { col, value: z(findWin(next) ? WIN_SCORE + depth : -refValue(next, depth - 1, other(player))) };
  });
  const value = Math.max(...scored.map((s) => s.value));
  return { value, best: scored.filter((s) => s.value === value).map((s) => s.col) };
}

/** Arbitrary unfinished position reached by legal play. */
const arbPosition = (maxMoves = 30) =>
  fc
    .array(fc.nat(), { maxLength: maxMoves })
    .map((choices) => {
      const moves: number[] = [];
      let board = emptyBoard();
      for (const choice of choices) {
        const legal = legalMoves(board);
        const col = legal[choice % legal.length] as number;
        const next = drop(board, col, playerOfMove(moves.length));
        if (outcomeOf(next).kind !== 'playing') break;
        board = next;
        moves.push(col);
      }
      return board;
    });

const winningColumns = (board: Board, player: Player) => legalMoves(board).filter((col) => findWin(drop(board, col, player))?.player === player);

const mirror = (board: Board): Cell[] => board.map((_, i) => board[i - (i % COLS) + (COLS - 1 - (i % COLS))] as Cell);

describe('configuration', () => {
  it('searches 2 / 5 / 8 plies, centre first', () => {
    expect(SEARCH_DEPTH).toEqual({ easy: 2, medium: 5, hard: 8 });
    expect(MOVE_ORDER).toEqual([3, 2, 4, 1, 5, 0, 6]);
    expect(WIN_SCORE).toBe(1_000_000);
    expect([THREE_WEIGHT, TWO_WEIGHT, CENTRE_WEIGHT]).toEqual([50, 5, 3]);
  });
});

describe('evaluate', () => {
  it('scores the empty board as even', () => {
    expect(evaluate(emptyBoard(), 1)).toBe(0);
    expect(evaluate(emptyBoard(), 2)).toBe(0);
  });

  it('rewards centre discs and open twos and threes, for the side asked about', () => {
    const centre = boardFromMoves([3]);
    expect(evaluate(centre, 1)).toBe(CENTRE_WEIGHT);
    expect(evaluate(centre, 2)).toBe(-CENTRE_WEIGHT);
    // A lone disc off-centre is worth nothing.
    expect(evaluate(B('....... ....... ....... ....... ....... 1......'), 1)).toBe(0);
    // Two in a row on the bottom row: three windows contain both discs.
    const two = B('....... ....... ....... ....... ....... ..11...');
    expect(evaluate(two, 1)).toBe(3 * TWO_WEIGHT + CENTRE_WEIGHT);
    expect(evaluate(two, 2)).toBe(-(3 * TWO_WEIGHT + CENTRE_WEIGHT));
    // Three in a row: two windows with three, one with two.
    const three = B('....... ....... ....... ....... ....... .111...');
    expect(evaluate(three, 1)).toBe(2 * THREE_WEIGHT + TWO_WEIGHT + CENTRE_WEIGHT);
    // An opposing disc blocks every window it shares.
    const blocked = B('....... ....... ....... ....... ....... .1112..');
    expect(evaluate(blocked, 1)).toBe(THREE_WEIGHT + CENTRE_WEIGHT);
    expect(evaluate(blocked, 2)).toBe(-(THREE_WEIGHT + CENTRE_WEIGHT));
    // Vertical windows count too: three discs in column 0 lie in one window with three, one with two.
    const tower = B('....... ....... ....... 1...... 1...... 1......');
    expect(evaluate(tower, 1)).toBe(THREE_WEIGHT + TWO_WEIGHT);
    // Centre discs of the opponent count against.
    const theirs = B('....... ....... ....... ....... ...2... ...1...');
    expect(evaluate(theirs, 1)).toBe(0);
  });

  it('property: is antisymmetric between the players and mirror-symmetric', () => {
    fc.assert(
      fc.property(arbPosition(42), (board) => {
        expect(z(evaluate(board, 1))).toBe(z(-evaluate(board, 2)));
        expect(evaluate(mirror(board), 1)).toBe(evaluate(board, 1));
      }),
      { numRuns: 300 }
    );
  });
});

describe('search', () => {
  it('refuses finished games and bad depths', () => {
    expect(() => analyse(boardFromMoves([0, 0, 1, 1, 2, 2, 3]), 3)).toThrow(/over/);
    expect(() => analyse(emptyBoard(), 0)).toThrow(RangeError);
    expect(() => analyse(emptyBoard(), 1.5)).toThrow(RangeError);
    expect(() => chooseMove(boardFromMoves([0, 0, 1, 1, 2, 2, 3]), 'easy', stubRng(0))).toThrow(/over/);
  });

  it('prefers the centre on the empty board', () => {
    expect(bestMoves(emptyBoard(), 'easy')).toEqual([3]);
    // At five plies the heuristic sees the three central columns as equally good.
    expect(bestMoves(emptyBoard(), 'medium')).toEqual([2, 3, 4]);
    expect(bestMoves(emptyBoard(), 'hard')).toEqual([3]);
    expect(analyse(emptyBoard(), 1)).toEqual({ best: [3], value: CENTRE_WEIGHT, nodes: 8 });
  });

  it('takes an immediate win at once and lists every winning column', () => {
    const one = B('....... ....... ....... ....... 222.... 111....');
    expect(analyse(one, 5)).toEqual({ best: [3], value: WIN_SCORE + 5, nodes: 1 });
    const twoWays = B('....... ....... ....... ....... .222... .111...');
    expect(analyse(twoWays, 8)).toEqual({ best: [0, 4], value: WIN_SCORE + 8, nodes: 1 });
  });

  it('blocks a single threat and sees a lost position for what it is', () => {
    // Player 2 threatens column 3; player 1 has nothing better than blocking.
    const threat = B('....... ....... ....... ....... 1.1.... 222.1..');
    expect(toMove(threat)).toBe(1);
    for (const difficulty of DIFFICULTIES) expect(bestMoves(threat, difficulty)).toEqual([3]);
    // Two open ends: whatever player 1 does, player 2 wins next move.
    const lost = B('....... ....... ....... ....... .111... .222...');
    expect(analyse(lost, 2).value).toBe(-(WIN_SCORE + 1));
    expect(analyse(lost, 5).value).toBe(-(WIN_SCORE + 4));
    expect(analyse(lost, 5).best).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('builds a double threat (open three) when one is available', () => {
    const board = B('....... ....... ....... ....... ..22... ..11...');
    for (const depth of [2, 5, 8]) {
      const result = analyse(board, depth);
      expect(result.best).toEqual([1, 4]);
      expect(result.value).toBe(WIN_SCORE + depth - 2);
    }
  });

  const matchesReference = (depth: number, numRuns: number) =>
    fc.assert(
      fc.property(arbPosition(), (board) => {
        const result = analyse(board, depth);
        const reference = refRoot(board, depth);
        expect(z(result.value)).toBe(reference.value);
        expect(result.best).toEqual(reference.best);
      }),
      { numRuns }
    );

  it.each([
    [1, 50],
    [2, 50],
    [3, 30],
    [4, 6]
  ])('property: at depth %i alpha-beta returns the exact value and every optimal move of a plain minimax', (depth, numRuns) => {
    matchesReference(depth, numRuns);
  }, 30_000);

  it('property: mirrored positions get mirrored answers', () => {
    fc.assert(
      fc.property(arbPosition(), (board) => {
        const a = analyse(board, 5);
        const b = analyse(mirror(board), 5);
        expect(z(b.value)).toBe(z(a.value));
        expect(b.best).toEqual(a.best.map((c) => COLS - 1 - c).sort((x, y) => x - y));
      }),
      { numRuns: 40 }
    );
  }, 30_000);

  it('stays fast at the hard level (bounded node count)', () => {
    const positions = [[], [3], [3, 3], [3, 2, 4, 4, 2], [0, 6, 1, 5, 2, 4], [3, 3, 3, 3, 2, 4, 2, 4, 1]];
    for (const moves of positions) {
      // About 1 µs per node on a desktop (typically 5–40 ms per hard move); a node bound is
      // deterministic, unlike wall-clock time on a busy CI machine.
      expect(analyse(boardFromMoves(moves), SEARCH_DEPTH.hard).nodes).toBeLessThan(150_000);
    }
    expect(analyse(emptyBoard(), 2).nodes).toBeLessThan(analyse(emptyBoard(), 5).nodes);
    expect(analyse(emptyBoard(), 5).nodes).toBeLessThan(analyse(emptyBoard(), 8).nodes);
  }, 30_000);
});

describe('chooseMove', () => {
  it('picks among the optimal moves with the PRNG', () => {
    const board = boardFromMoves([3, 3]);
    for (const difficulty of DIFFICULTIES) {
      const rng = stubRng(0.99);
      const move = chooseMove(board, difficulty, rng);
      const best = bestMoves(board, difficulty);
      expect(rng.offered).toEqual([best]);
      expect(move).toBe(best[best.length - 1]);
    }
  });

  it('property: always returns a legal column', () => {
    for (const difficulty of DIFFICULTIES) {
      fc.assert(
        fc.property(arbPosition(), fc.integer({ min: 0, max: 0xffffffff }), (board, seed) => {
          expect(isLegalMove(board, chooseMove(board, difficulty, createRngFromState(seed)))).toBe(true);
        }),
        { numRuns: difficulty === 'hard' ? 15 : 40 }
      );
    }
  }, 30_000);

  it('property: takes an immediate win, otherwise blocks a single immediate threat (every level)', () => {
    let wins = 0;
    let blocks = 0;
    fc.assert(
      fc.property(arbPosition(36), fc.constantFrom<Difficulty>('easy', 'medium', 'hard'), fc.nat(), (board, difficulty, seed) => {
        const me = toMove(board);
        const mine = winningColumns(board, me);
        const theirs = winningColumns(board, other(me));
        fc.pre(mine.length > 0 || theirs.length === 1);
        const move = chooseMove(board, difficulty, createRngFromState(seed));
        if (mine.length > 0) {
          wins++;
          expect(mine).toContain(move);
        } else {
          blocks++;
          expect(move).toBe(theirs[0]);
        }
      }),
      { numRuns: 60 }
    );
    expect(wins).toBeGreaterThan(0);
    expect(blocks).toBeGreaterThan(0);
  }, 30_000);
});

describe('turns against the computer', () => {
  const options = { seed: 5, difficulty: 'medium' as const, opponent: 'computer' as const };

  it('opens the game when the computer starts and advances the PRNG', () => {
    const opened = startRound({ ...options, starter: 'computer' });
    const rng = createRngFromState(5);
    expect(opened.moves).toEqual([rng.pick(bestMoves(emptyBoard(), 'medium'))]);
    expect(opened.rng).toBe(rng.state());
    expect(opened.rng).not.toBe(5);
    expect(isValidState(opened)).toBe(true);
    const waiting = startRound({ ...options, starter: 'human' });
    expect(waiting).toEqual(createRound({ ...options, starter: 'human' }));
  });

  it('returns the same state when it is not the computer’s turn', () => {
    const s = createRound({ ...options, starter: 'human' });
    expect(computerReply(s)).toBe(s);
    const human = createRound({ ...options, opponent: 'human', starter: 'computer' });
    expect(computerReply(human)).toBe(human);
  });

  it('replies to the person in the same step, and not after the game has ended', () => {
    const s = startRound({ ...options, starter: 'human' });
    const next = playTurn(s, 0);
    expect(next.moves).toHaveLength(2);
    expect(next.moves[0]).toBe(0);
    expect(isValidState(next)).toBe(true);
    // The person completes four in a row: no reply follows.
    const almost: ConnectFourState = { ...createRound({ ...options, starter: 'human' }), moves: [0, 0, 1, 1, 2, 2] };
    const won = playTurn(almost, 3);
    expect(won.moves).toEqual([0, 0, 1, 1, 2, 2, 3]);
    expect(won.rng).toBe(almost.rng);
    expect(outcomeOf(boardOf(won)).kind).toBe('won');
    expect(() => playTurn({ ...almost, moves: [0, 0, 1, 1, 2] }, 6)).toThrow(/computer/);
  });

  it('property: the same seed and actions always give the same game', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom<Difficulty>('easy', 'medium'),
        fc.constantFrom('human' as const, 'computer' as const),
        fc.array(fc.nat(), { maxLength: 12 }),
        (seed, difficulty, starter, choices) => {
          const play = () => {
            let s = startRound({ seed, difficulty, opponent: 'computer', starter });
            const history: ConnectFourState[] = [s];
            for (const choice of choices) {
              const board = boardOf(s);
              if (outcomeOf(board).kind !== 'playing') break;
              const legal = legalMoves(board);
              s = playTurn(s, legal[choice % legal.length] as number);
              expect(isValidState(s)).toBe(true);
              history.push(s);
            }
            return history;
          };
          expect(play()).toEqual(play());
        }
      ),
      { numRuns: 40 }
    );
  }, 30_000);

  it('varies between seeds where moves are equally good', () => {
    const replies = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      let s = startRound({ seed, difficulty: 'easy', opponent: 'computer', starter: 'human' });
      for (const col of [0, 6, 0]) if (outcomeOf(boardOf(s)).kind === 'playing') s = playTurn(s, col);
      replies.add(s.moves.join());
    }
    expect(replies.size).toBeGreaterThan(1);
  });

  it('plays complete games against itself without errors', () => {
    let board = emptyBoard();
    const rng = createRngFromState(11);
    const levels: Difficulty[] = ['easy', 'medium'];
    for (let n = 0; n < CELL_COUNT && outcomeOf(board).kind === 'playing'; n++) {
      board = drop(board, chooseMove(board, levels[n % 2] as Difficulty, rng), toMove(board));
    }
    expect(outcomeOf(board).kind).not.toBe('playing');
  });
});
