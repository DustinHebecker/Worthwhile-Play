import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRngFromState, type Rng } from '@wp/game-core';
import {
  CENTRE_WEIGHT,
  LEVEL_POLICY,
  SEARCH_DEPTH,
  THREE_WEIGHT,
  TWO_WEIGHT,
  WIN_SCORE,
  analyse,
  bestMoves,
  centreColumns,
  chooseMove,
  computerReply,
  evaluate,
  immediateWins,
  moveOrder,
  playTurn,
  safeMoves,
  searchDepth,
  startRound,
  type Position
} from '../src/ai';
import {
  CONNECTS,
  DIFFICULTIES,
  SIZES,
  STANDARD_VARIANT,
  advance,
  applyToBoard,
  createRound,
  gameOf,
  geometryOf,
  isLegalMove,
  isPull,
  isValidState,
  legalMoves,
  moveColumn,
  moveLimit,
  other,
  positionKey,
  pullMove,
  replay,
  startGame,
  winAfter,
  type Board,
  type Cell,
  type ConnectFourState,
  type Difficulty,
  type Move,
  type Player,
  type Variant
} from '../src/rules';

const V = (size: Variant['size'] = '7x6', connect: Variant['connect'] = 4, pullOut = false): Variant => ({ size, connect, pullOut });
const STD = STANDARD_VARIANT;
const PULL = V('7x6', 4, true);
const ALL_VARIANTS: Variant[] = [];
for (const pullOut of [false, true]) for (const size of SIZES) for (const connect of CONNECTS) ALL_VARIANTS.push({ size, connect, pullOut });

/** Rows (top first) of '.', '1', '2'; whitespace ignored. */
const B = (picture: string): Cell[] => [...picture.replace(/\s/g, '')].map((c) => (c === '.' ? 0 : (Number(c) as Cell)));
const at = (variant: Variant, cells: Board, turn: Player): Position => ({ variant, cells, turn });
const fromMoves = (variant: Variant, moves: Move[]): Position => replay(variant, moves);

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
 * Independent reference search: plain negamax WITHOUT pruning or shortcuts, on immutable
 * rules.ts boards (drops and pull-outs), with the same scoring conventions as ai.ts.
 */
function refValue(variant: Variant, board: Board, depth: number, player: Player): number {
  const geo = geometryOf(variant);
  const legal = legalMoves(variant, board, player);
  for (const move of legal) if (winAfter(geo, applyToBoard(variant, board, move, player), player)?.player === player) return WIN_SCORE + depth;
  if (legal.length === 0) return 0;
  if (depth === 0) return evaluate(variant, board, player);
  let best = -Infinity;
  for (const move of legal) {
    const next = applyToBoard(variant, board, move, player);
    const value = winAfter(geo, next, player) ? -(WIN_SCORE + depth) : -refValue(variant, next, depth - 1, other(player));
    best = Math.max(best, value);
  }
  return best;
}

function refRoot(position: Position, depth: number): { value: number; best: Move[] } {
  const { variant, cells, turn } = position;
  const geo = geometryOf(variant);
  const scored = legalMoves(variant, cells, turn).map((move) => {
    const next = applyToBoard(variant, cells, move, turn);
    const win = winAfter(geo, next, turn);
    return { move, value: z(win ? (win.player === turn ? WIN_SCORE + depth : -(WIN_SCORE + depth)) : -refValue(variant, next, depth - 1, other(turn))) };
  });
  const value = Math.max(...scored.map((s) => s.value));
  return { value, best: scored.filter((s) => s.value === value).map((s) => s.move).sort((a, b) => a - b) };
}

/** Arbitrary unfinished position of `variants` reached by legal play. */
const arbPosition = (variants: readonly Variant[] = [STD], maxMoves = 30) =>
  fc.tuple(fc.constantFrom(...variants), fc.array(fc.nat(), { maxLength: maxMoves })).map(([variant, choices]) => {
    let game = startGame(variant);
    for (const choice of choices) {
      const legal = legalMoves(variant, game.cells, game.turn);
      const next = advance(game, legal[choice % legal.length] as Move);
      if (next.outcome.kind !== 'playing') break;
      game = next;
    }
    return game;
  });

const winningMoves = (position: Position, player: Player) =>
  legalMoves(position.variant, position.cells, player).filter(
    (move) => winAfter(geometryOf(position.variant), applyToBoard(position.variant, position.cells, move, player), player)?.player === player
  );

const mirrorBoard = (variant: Variant, board: Board): Cell[] => {
  const { cols } = geometryOf(variant);
  return board.map((_, i) => board[i - (i % cols) + (cols - 1 - (i % cols))] as Cell);
};
const mirrorMove = (variant: Variant, move: Move): Move => {
  const { cols } = geometryOf(variant);
  const col = cols - 1 - moveColumn(move);
  return isPull(move) ? pullMove(col) : col;
};

describe('configuration', () => {
  it('searches 2 / 5 / 8 plies on the standard board, centre first', () => {
    expect(SEARCH_DEPTH).toEqual({ easy: 2, medium: 5, hard: 8 });
    expect(DIFFICULTIES.map((d) => searchDepth(STD, d))).toEqual([2, 5, 8]);
    expect(moveOrder(7)).toEqual([3, 2, 4, 1, 5, 0, 6]);
    expect(moveOrder(8)).toEqual([3, 4, 2, 5, 1, 6, 0, 7]);
    expect(moveOrder(9)).toEqual([4, 3, 5, 2, 6, 1, 7, 0, 8]);
    expect(centreColumns(7)).toEqual([3]);
    expect(centreColumns(8)).toEqual([3, 4]);
    expect(centreColumns(9)).toEqual([4]);
    expect(WIN_SCORE).toBe(1_000_000);
    expect([THREE_WEIGHT, TWO_WEIGHT, CENTRE_WEIGHT]).toEqual([50, 5, 3]);
  });

  it('caps the depth by board size and the pull-out rule', () => {
    const table = Object.fromEntries(
      ALL_VARIANTS.map((v) => [`${v.size}/${v.connect}/${v.pullOut ? 'pull' : 'drop'}`, DIFFICULTIES.map((d) => searchDepth(v, d)).join(' ')])
    );
    expect(table).toEqual({
      '7x6/4/drop': '2 5 8',
      '7x6/5/drop': '2 5 8',
      '8x7/4/drop': '2 5 8',
      '8x7/5/drop': '2 5 8',
      '9x7/4/drop': '2 5 7',
      '9x7/5/drop': '2 5 7',
      '7x6/4/pull': '2 5 7',
      '7x6/5/pull': '2 5 7',
      '8x7/4/pull': '2 4 7',
      '8x7/5/pull': '2 4 6',
      '9x7/4/pull': '2 4 6',
      '9x7/5/pull': '2 4 5'
    });
  });

  it('grades the levels: easy errs often, medium a little, hard never', () => {
    expect(LEVEL_POLICY).toEqual({
      easy: { missBlock: 0.4, loose: 0.5 },
      medium: { missBlock: 0, loose: 0.15 },
      hard: { missBlock: 0, loose: 0 }
    });
  });
});

describe('evaluate', () => {
  it('scores the empty board as even', () => {
    for (const v of ALL_VARIANTS) {
      expect(z(evaluate(v, startGame(v).cells, 1))).toBe(0);
      expect(z(evaluate(v, startGame(v).cells, 2))).toBe(0);
    }
  });

  it('rewards centre discs and open twos and threes, for the side asked about', () => {
    const centre = fromMoves(STD, [3]).cells;
    expect(evaluate(STD, centre, 1)).toBe(CENTRE_WEIGHT);
    expect(evaluate(STD, centre, 2)).toBe(-CENTRE_WEIGHT);
    expect(evaluate(STD, B('....... ....... ....... ....... ....... 1......'), 1)).toBe(0);
    const two = B('....... ....... ....... ....... ....... ..11...');
    expect(evaluate(STD, two, 1)).toBe(3 * TWO_WEIGHT + CENTRE_WEIGHT);
    expect(evaluate(STD, two, 2)).toBe(-(3 * TWO_WEIGHT + CENTRE_WEIGHT));
    const three = B('....... ....... ....... ....... ....... .111...');
    expect(evaluate(STD, three, 1)).toBe(2 * THREE_WEIGHT + TWO_WEIGHT + CENTRE_WEIGHT);
    const blocked = B('....... ....... ....... ....... ....... .1112..');
    expect(evaluate(STD, blocked, 1)).toBe(THREE_WEIGHT + CENTRE_WEIGHT);
    expect(evaluate(STD, blocked, 2)).toBe(-(THREE_WEIGHT + CENTRE_WEIGHT));
    const tower = B('....... ....... ....... 1...... 1...... 1......');
    expect(evaluate(STD, tower, 1)).toBe(THREE_WEIGHT + TWO_WEIGHT);
    expect(evaluate(STD, B('....... ....... ....... ....... ...2... ...1...'), 1)).toBe(0);
  });

  it('weighs windows one and two discs short of five on five-in-a-row boards', () => {
    const v = V('7x6', 5);
    // Four in a row on the bottom: windows [0..4] (four discs: one short), [1..5] (three: two short), [2..6] (two: nothing).
    const four = B('....... ....... ....... ....... ....... 1111...');
    expect(evaluate(v, four, 1)).toBe(THREE_WEIGHT + TWO_WEIGHT + CENTRE_WEIGHT);
    const three = B('....... ....... ....... ....... ....... 111....');
    expect(evaluate(v, three, 1)).toBe(TWO_WEIGHT);
  });

  it('counts both middle columns on an 8-wide board', () => {
    const v = V('8x7');
    const board = startGame(v).cells.slice();
    board[6 * 8 + 3] = 1;
    board[6 * 8 + 4] = 2;
    board[5 * 8 + 4] = 1;
    // Two own centre discs and one opposing (+3 +3 -3); one diagonal window holds both own discs.
    expect(evaluate(v, board, 1)).toBe(CENTRE_WEIGHT + TWO_WEIGHT);
  });

  it('property: is antisymmetric between the players and mirror-symmetric on every variant', () => {
    fc.assert(
      fc.property(arbPosition(ALL_VARIANTS, 50), (game) => {
        expect(z(evaluate(game.variant, game.cells, 1))).toBe(z(-evaluate(game.variant, game.cells, 2)));
        expect(evaluate(game.variant, mirrorBoard(game.variant, game.cells), 1)).toBe(evaluate(game.variant, game.cells, 1));
      }),
      { numRuns: 200 }
    );
  });
});

describe('search', () => {
  it('refuses finished games, positions without moves and bad depths', () => {
    expect(() => analyse(fromMoves(STD, [0, 0, 1, 1, 2, 2, 3]), 3)).toThrow(/over/);
    const full = replay(STD, [3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 6, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6]);
    expect(() => analyse(full, 3)).toThrow(/no legal move/);
    expect(() => analyse(startGame(STD), 0)).toThrow('Depth must be a positive integer');
    expect(() => analyse(startGame(STD), 1.5)).toThrow(RangeError);
  });

  it('prefers the centre on the empty board', () => {
    expect(bestMoves(startGame(STD), 'easy')).toEqual([3]);
    expect(bestMoves(startGame(STD), 'medium')).toEqual([2, 3, 4]);
    expect(bestMoves(startGame(STD), 'hard')).toEqual([3]);
    expect(analyse(startGame(STD), 1)).toEqual({ best: [3], value: CENTRE_WEIGHT, nodes: 8 });
    expect(analyse(startGame(V('9x7')), 1).best).toEqual([4]);
    expect(analyse(startGame(V('8x7')), 1).best).toEqual([3, 4]);
  });

  it('takes an immediate win at once and lists every winning move, pulls included', () => {
    const one = B('....... ....... ....... ....... 222.... 111....');
    expect(analyse(at(STD, one, 1), 5)).toEqual({ best: [3], value: WIN_SCORE + 5, nodes: 1 });
    const twoWays = B('....... ....... ....... ....... .222... .111...');
    expect(analyse(at(STD, twoWays, 1), 8)).toEqual({ best: [0, 4], value: WIN_SCORE + 8, nodes: 1 });
    // Pulling column 5 completes filled's line in row 5 from the top (and hollow's in the bottom row): the puller wins.
    const both = B(`
      .......
      .......
      .......
      ....1..
      .1112..
      .2221..`);
    expect(immediateWins(PULL, both, 1)).toEqual([pullMove(4)]);
    expect(analyse(at(PULL, both, 1), 3)).toEqual({ best: [pullMove(4)], value: WIN_SCORE + 3, nodes: 1 });
    expect(immediateWins(STD, both, 1)).toEqual([]);
  });

  it('never pulls out a disc that only completes the opponent’s line', () => {
    const gift = B(`
      .......
      .......
      .......
      .......
      ....2..
      12221..`);
    expect(immediateWins(PULL, gift, 2)).toEqual([]);
    expect(safeMoves(at(PULL, gift, 1))).not.toContain(pullMove(4));
    expect(safeMoves(at(PULL, gift, 1))).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 0; seed < 10; seed++) expect(chooseMove(at(PULL, gift, 1), difficulty, createRngFromState(seed))).not.toBe(pullMove(4));
    }
  });

  it('blocks a single threat and sees a lost position for what it is', () => {
    const threat = B('....... ....... ....... ....... 1.1.... 222.1..');
    for (const difficulty of DIFFICULTIES) expect(bestMoves(at(STD, threat, 1), difficulty)).toEqual([3]);
    const lost = B('....... ....... ....... ....... .111... .222...');
    expect(analyse(at(STD, lost, 1), 2).value).toBe(-(WIN_SCORE + 1));
    expect(analyse(at(STD, lost, 1), 5).value).toBe(-(WIN_SCORE + 4));
    expect(analyse(at(STD, lost, 1), 5).best).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('builds a double threat (open three) when one is available', () => {
    const board = B('....... ....... ....... ....... ..22... ..11...');
    for (const depth of [2, 5, 8]) {
      const result = analyse(at(STD, board, 1), depth);
      expect(result.best).toEqual([1, 4]);
      expect(result.value).toBe(WIN_SCORE + depth - 2);
    }
  });

  it('judges repetition and the move limit at the root when the history is given', () => {
    const position = fromMoves(PULL, [3, 0]);
    const [first] = analyse(position, 1).best as [Move];
    expect(analyse(position, 1).value).toBeGreaterThan(0);
    // Pretend the position after the best move has already occurred twice: it now only draws.
    const next = applyToBoard(PULL, position.cells, first, 1);
    const withHistory = analyse(position, 1, { seen: new Map([[positionKey(next, 2), 2]]), ply: 2 });
    expect(withHistory.best).not.toContain(first);
    expect(analyse(position, 1, { seen: new Map([[positionKey(next, 2), 1]]), ply: 2 }).best).toContain(first);
    // At the move limit every move that does not win is a draw.
    const atLimit = analyse(position, 1, { seen: new Map(), ply: moveLimit(PULL) - 1 });
    expect(z(atLimit.value)).toBe(0);
    expect(atLimit.best).toEqual(legalMoves(PULL, position.cells, 1).sort((a, b) => a - b));
  });

  const matchesReference = (variants: readonly Variant[], depth: number, numRuns: number) =>
    fc.assert(
      fc.property(arbPosition(variants), (game) => {
        const result = analyse(game, depth);
        const reference = refRoot(game, depth);
        expect(z(result.value)).toBe(reference.value);
        expect(result.best).toEqual(reference.best);
      }),
      { numRuns }
    );

  const DROP_VARIANTS = ALL_VARIANTS.filter((v) => !v.pullOut);
  const PULL_VARIANTS = ALL_VARIANTS.filter((v) => v.pullOut);

  it('property: alpha-beta returns the exact value and every optimal move of a plain minimax (drops only)', () => {
    matchesReference(DROP_VARIANTS, 1, 40);
    matchesReference(DROP_VARIANTS, 2, 40);
    matchesReference(DROP_VARIANTS, 3, 20);
    matchesReference([STD], 4, 5);
  }, 60_000);

  it('property: alpha-beta returns the exact value and every optimal move of a plain minimax (pull-out)', () => {
    matchesReference(PULL_VARIANTS, 1, 40);
    matchesReference(PULL_VARIANTS, 2, 30);
    matchesReference([PULL], 3, 8);
  }, 60_000);

  it('property: mirrored positions get mirrored answers', () => {
    fc.assert(
      fc.property(arbPosition(ALL_VARIANTS), (game) => {
        const depth = game.variant.pullOut ? 3 : 4;
        const a = analyse(game, depth);
        const b = analyse(at(game.variant, mirrorBoard(game.variant, game.cells), game.turn), depth);
        expect(z(b.value)).toBe(z(a.value));
        expect(b.best).toEqual(a.best.map((m) => mirrorMove(game.variant, m)).sort((x, y) => x - y));
      }),
      { numRuns: 30 }
    );
  }, 60_000);

  it('stays fast at the hard level on every variant (bounded node count)', () => {
    // Desktop: about 1 µs per node with drops only, about 3 µs with pull-outs (a pull
    // shifts a column); measured worst cases over whole games were 43–94 ms (drops) and
    // 116–230 ms (pull-out) per hard move, typically 7–50 ms. A node bound is
    // deterministic, unlike wall-clock time on a busy CI machine.
    const openings: Move[][] = [[], [3], [3, 3], [3, 2, 4, 4, 2], [0, 6, 1, 5, 2, 4], [3, 3, 3, 3, 2, 4, 2, 4, 1]];
    const bound = (v: Variant) => (v.pullOut ? 120_000 : 250_000);
    for (const variant of ALL_VARIANTS) {
      for (const moves of openings) {
        const game = replay(variant, moves);
        if (game.outcome.kind !== 'playing') continue;
        expect(analyse(game, searchDepth(variant, 'hard')).nodes).toBeLessThan(bound(variant));
      }
    }
    expect(analyse(startGame(STD), 2).nodes).toBeLessThan(analyse(startGame(STD), 5).nodes);
    expect(analyse(startGame(STD), 5).nodes).toBeLessThan(analyse(startGame(STD), 8).nodes);
  }, 60_000);
});

describe('chooseMove', () => {
  it('picks among the optimal moves with the PRNG', () => {
    const position = fromMoves(STD, [3, 3]);
    for (const difficulty of DIFFICULTIES) {
      const rng = stubRng(0.99);
      const move = chooseMove(position, difficulty, rng);
      const best = bestMoves(position, difficulty);
      expect(rng.offered).toEqual([best]);
      expect(move).toBe(best[best.length - 1]);
    }
  });

  it('property: never makes an illegal move, on every variant and level', () => {
    for (const difficulty of DIFFICULTIES) {
      fc.assert(
        fc.property(arbPosition(ALL_VARIANTS, 60), fc.integer({ min: 0, max: 0xffffffff }), (game, seed) => {
          const move = chooseMove(game, difficulty, createRngFromState(seed), game);
          expect(isLegalMove(game.variant, game.cells, move, game.turn)).toBe(true);
        }),
        { numRuns: difficulty === 'hard' ? 12 : 40 }
      );
    }
  }, 60_000);

  it('property: every level takes an immediate win; medium and hard always block a single drop threat', () => {
    let wins = 0;
    let blocks = 0;
    fc.assert(
      fc.property(arbPosition([STD, V('9x7', 5)], 36), fc.constantFrom<Difficulty>('easy', 'medium', 'hard'), fc.nat(), (game, difficulty, seed) => {
        const mine = winningMoves(game, game.turn);
        const theirs = winningMoves(game, other(game.turn));
        fc.pre(mine.length > 0 || (theirs.length === 1 && difficulty !== 'easy'));
        const move = chooseMove(game, difficulty, createRngFromState(seed));
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
  }, 60_000);

  it('easy sometimes overlooks a single threat, depending on the PRNG', () => {
    const threat = at(STD, B('....... ....... ....... ....... 1.1.... 222.1..'), 1);
    expect(chooseMove(threat, 'easy', stubRng(0.99))).toBe(3);
    expect(chooseMove(threat, 'easy', stubRng(0.39))).not.toBe(3);
    expect(chooseMove(threat, 'medium', stubRng(0))).toBe(3);
    expect(chooseMove(threat, 'hard', stubRng(0))).toBe(3);
    let blocked = 0;
    for (let seed = 0; seed < 200; seed++) if (chooseMove(threat, 'easy', createRngFromState(seed)) === 3) blocked++;
    expect(blocked).toBeGreaterThan(90);
    expect(blocked).toBeLessThan(160);
  });

  it('a casual move is any move that does not lose at once or hand over an immediate win', () => {
    expect(safeMoves(startGame(STD))).toEqual([0, 1, 2, 3, 4, 5, 6]);
    const board = B('....... ....... ....... ....... 222.... 121..11');
    const position = at(STD, board, 1);
    expect(safeMoves(position)).toEqual([0, 1, 2, 4, 5, 6]);
    const rng = stubRng(0);
    expect(chooseMove(position, 'easy', rng)).toBe(0);
    expect(rng.offered).toEqual([[0, 1, 2, 4, 5, 6]]);
    expect(chooseMove(position, 'easy', stubRng(0.99))).toBe(bestMoves(position, 'easy').at(-1));
    expect(chooseMove(position, 'hard', stubRng(0))).toBe(bestMoves(position, 'hard')[0]);
    expect(chooseMove(position, 'medium', stubRng(0.14))).toBe(0);
    expect(chooseMove(position, 'medium', stubRng(0.15))).toBe(bestMoves(position, 'medium')[0]);
    // With pull-outs, pulls of own bottom discs are candidates too.
    expect(safeMoves(at(V('7x6', 4, true), board, 1))).toEqual([-7, -6, -3, -1, 0, 1, 2, 4, 5, 6]);
  });

  it('property: medium and easy never hand over an immediate win when they can avoid it', () => {
    fc.assert(
      fc.property(arbPosition(ALL_VARIANTS, 36), fc.constantFrom<Difficulty>('easy', 'medium'), fc.nat(), (game, difficulty, seed) => {
        fc.pre(winningMoves(game, game.turn).length === 0 && winningMoves(game, other(game.turn)).length === 0);
        const safe = safeMoves(game);
        fc.pre(safe.length > 0);
        expect(safe).toContain(chooseMove(game, difficulty, createRngFromState(seed)));
      }),
      { numRuns: 80 }
    );
  }, 60_000);
});

describe('turns against the computer', () => {
  const options = { seed: 5, difficulty: 'medium' as const, opponent: 'computer' as const, variant: STD };

  it('opens the game when the computer starts and advances the PRNG', () => {
    const opened = startRound({ ...options, starter: 'computer' });
    const rng = createRngFromState(5);
    expect(opened.moves).toEqual([chooseMove(startGame(STD), 'medium', rng)]);
    expect(opened.rng).toBe(rng.state());
    expect(opened.rng).not.toBe(5);
    expect(isValidState(opened)).toBe(true);
    expect(startRound({ ...options, starter: 'human' })).toEqual(createRound({ ...options, starter: 'human' }));
  });

  it('returns the same state when it is not the computer’s turn', () => {
    const s = createRound({ ...options, starter: 'human' });
    expect(computerReply(s)).toBe(s);
    const human = createRound({ ...options, opponent: 'human', starter: 'computer' });
    expect(computerReply(human)).toBe(human);
  });

  it('replies to the person in the same step, and not after the game has ended', () => {
    const next = playTurn(startRound({ ...options, starter: 'human' }), 0);
    expect(next.moves).toHaveLength(2);
    expect(next.moves[0]).toBe(0);
    expect(isValidState(next)).toBe(true);
    const almost: ConnectFourState = { ...createRound({ ...options, starter: 'human' }), moves: [0, 0, 1, 1, 2, 2] };
    const won = playTurn(almost, 3);
    expect(won.moves).toEqual([0, 0, 1, 1, 2, 2, 3]);
    expect(won.rng).toBe(almost.rng);
    expect(gameOf(won).outcome.kind).toBe('won');
    expect(() => playTurn({ ...almost, moves: [0, 0, 1, 1, 2] }, 6)).toThrow(/computer/);
  });

  it('answers pull-outs and plays on large boards', () => {
    const pullOut = startRound({ ...options, variant: PULL, starter: 'human' });
    const afterDrop = playTurn(pullOut, 3);
    const afterPull = playTurn(afterDrop, pullMove(3));
    expect(afterPull.moves).toHaveLength(4);
    expect(afterPull.moves[2]).toBe(-4);
    expect(isValidState(afterPull)).toBe(true);
    const wide = startRound({ ...options, difficulty: 'hard', variant: V('9x7', 5), starter: 'computer' });
    expect(wide.moves).toEqual([4]);
  });

  it('property: the same seed and actions always give the same game, on every variant', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom<Difficulty>('easy', 'medium'),
        fc.constantFrom('human' as const, 'computer' as const),
        fc.constantFrom(...ALL_VARIANTS),
        fc.array(fc.nat(), { maxLength: 12 }),
        (seed, difficulty, starter, variant, choices) => {
          const play = () => {
            let s = startRound({ seed, difficulty, opponent: 'computer', starter, variant });
            const history: ConnectFourState[] = [s];
            for (const choice of choices) {
              const game = gameOf(s);
              if (game.outcome.kind !== 'playing') break;
              const legal = legalMoves(variant, game.cells, game.turn);
              s = playTurn(s, legal[choice % legal.length] as Move);
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
  }, 60_000);

  it('varies between seeds where moves are equally good', () => {
    const replies = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      let s = startRound({ seed, difficulty: 'easy', opponent: 'computer', starter: 'human', variant: STD });
      for (const col of [0, 6, 0]) if (gameOf(s).outcome.kind === 'playing') s = playTurn(s, col);
      replies.add(s.moves.join());
    }
    expect(replies.size).toBeGreaterThan(1);
  });

  it('plays complete games against itself on every variant without errors', () => {
    for (const variant of ALL_VARIANTS) {
      let game = startGame(variant);
      const rng = createRngFromState(11);
      while (game.outcome.kind === 'playing') game = advance(game, chooseMove(game, game.ply % 2 === 0 ? 'easy' : 'medium', rng, game), true);
      expect(game.outcome.kind).not.toBe('playing');
    }
  }, 60_000);
});
