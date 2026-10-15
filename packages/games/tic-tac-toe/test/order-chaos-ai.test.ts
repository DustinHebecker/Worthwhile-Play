import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, type Rng } from '@wp/game-core';
import {
  DOUBLE_THREAT,
  OC_EASY_SLIP,
  OC_LEVELS,
  THREAT_TO_MOVE,
  WIN,
  chooseOcMove,
  chooseOcMoveWith,
  evaluate,
  fiveThrough,
  lastScans,
  ocComputerReply,
  ocLegalMoves,
  playOcTurn,
  scoreOcMoves,
  startOcRound,
  toCodes
} from '../src/order-chaos-ai';
import { OC_CELLS, emptyOcBoard, findFive, isValidOcState, ocBoardFromMoves, ocOutcome, roleOfMove, type OcMove, type Role } from '../src/order-chaos';
import { DIFFICULTIES, type Cell, type Difficulty, type Mark } from '../src/rules';

const B = (picture: string): Cell[] => [...picture.replace(/\s/g, '')].map((c) => (c === '.' ? '' : (c as Mark)));
const swap = (board: readonly Cell[]): Cell[] => board.map((c) => (c === 'X' ? 'O' : c === 'O' ? 'X' : ''));

function randomBoard(seed: number, n: number): Cell[] {
  const rng = createRng(seed);
  const board = emptyOcBoard();
  for (let i = 0; i < n && ocOutcome(board).kind === 'playing'; i++) {
    const m = rng.pick(ocLegalMoves(board));
    board[m.cell] = m.mark;
  }
  return board;
}
const arbBoard = fc.tuple(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 35 })).map(([s, n]) => randomBoard(s, n));

type Player = (board: Cell[], role: Role, rng: Rng) => OcMove;
const ai = (d: Difficulty): Player => (b, role, rng) => chooseOcMove(b, role, d, rng);
/** Scripted player: one-ply greedy on the evaluation (ties by PRNG). */
const greedy: Player = (b, role, rng) => {
  const scores = scoreOcMoves(b, role, 1);
  const values = [...scores.values()];
  const best = role === 'order' ? Math.max(...values) : Math.min(...values);
  const m = rng.pick([...scores].filter(([, v]) => v === best).map(([k]) => k));
  return { cell: m >> 1, mark: m & 1 ? 'O' : 'X' };
};

/** Random opening moves per game, so that games between deterministic players differ. */
const OPENING = 4;

/** Number of games won by Order. */
function orderWins(order: Player, chaos: Player, games: number, seed: number): number {
  let wins = 0;
  for (let g = 0; g < games; g++) {
    const rng = createRng(seed + g);
    const board = emptyOcBoard();
    for (let ply = 0; ocOutcome(board).kind === 'playing'; ply++) {
      const role = roleOfMove(ply);
      const m = ply < OPENING ? rng.pick(ocLegalMoves(board)) : (role === 'order' ? order : chaos)(board, role, rng);
      expect(board[m.cell]).toBe('');
      board[m.cell] = m.mark;
    }
    if (ocOutcome(board).kind === 'order') wins++;
  }
  return wins;
}

describe('evaluation', () => {
  it('is symmetric in X and O', () => {
    fc.assert(
      fc.property(arbBoard, fc.boolean(), (board, orderToMove) => {
        expect(evaluate(toCodes(swap(board)), orderToMove)).toBe(evaluate(toCodes(board), orderToMove));
      }),
      { numRuns: 200 }
    );
  });

  it('values aligned symbols above scattered ones', () => {
    expect(evaluate(toCodes(emptyOcBoard()), false)).toBe(32 * 2);
    const aligned = evaluate(toCodes(B('XXX... ...... ...... ...... ...... ......')), false);
    const scattered = evaluate(toCodes(B('X..... ...... ...X.. ...... .X.... ......')), false);
    expect(aligned).toBeGreaterThan(scattered);
  });

  it('a four that can still become exactly five is a win for Order to move', () => {
    const four = toCodes(B('XXXX.. ...... ...... ...... ...... ......'));
    expect(evaluate(four, true)).toBeGreaterThanOrEqual(THREAT_TO_MOVE);
    // Chaos to move can block it (O at 4, or X at 4 would make five — so O).
    expect(evaluate(four, false)).toBeLessThan(DOUBLE_THREAT);
  });

  it('two threats that one move cannot both stop are nearly decisive with Chaos to move', () => {
    // Open four in a row of six: X at 0 or 5 both make exactly five.
    const open = toCodes(B('.XXXX. ...... ...... ...... ...... ......'));
    expect(evaluate(open, false)).toBeGreaterThanOrEqual(DOUBLE_THREAT);
    // A six-making extension is dead: X at 5 next to X X X X X would be six.
    const dead = toCodes(B('XXXX.X ...... ...... ...... ...... ......'));
    expect(evaluate(dead, true)).toBeLessThan(THREAT_TO_MOVE);
  });

  it('fiveThrough agrees with findFive for the lines through the changed cell', () => {
    fc.assert(
      fc.property(arbBoard, fc.integer({ min: 0, max: OC_CELLS - 1 }), fc.constantFrom<Mark>('X', 'O'), (board, cell, mark) => {
        fc.pre(board[cell] === '' && findFive(board) === null);
        const next = [...board];
        next[cell] = mark;
        expect(fiveThrough(toCodes(next), cell)).toBe(findFive(next) !== null);
      }),
      { numRuns: 500 }
    );
  });
});

describe('chooseOcMove', () => {
  it('refuses to move in a finished game', () => {
    for (const d of DIFFICULTIES) expect(() => chooseOcMove(B('XXXXX. ...... ...... ...... ...... ......'), 'chaos', d, createRng(1))).toThrow(RangeError);
  });

  it('property: every move is legal, for both roles and every level', () => {
    fc.assert(
      fc.property(arbBoard, fc.constantFrom<Difficulty>('easy', 'medium'), fc.integer({ min: 0, max: 0xffffffff }), (board, d, seed) => {
        fc.pre(ocOutcome(board).kind === 'playing');
        for (const role of ['order', 'chaos'] as const) {
          const m = chooseOcMove(board, role, d, createRng(seed));
          expect(board[m.cell]).toBe('');
          expect(['X', 'O']).toContain(m.mark);
        }
      }),
      { numRuns: 60 }
    );
    const board = randomBoard(4, 12);
    for (const role of ['order', 'chaos'] as const) expect(board[chooseOcMove(board, role, 'perfect', createRng(4)).cell]).toBe('');
  }, 60_000);

  /** A level's search without its random slips. */
  const searched = (d: Difficulty, role: Role) => ({ ...OC_LEVELS[d][role], slip: 0 });

  it('Order completes a five at once (searching levels)', () => {
    const board = B('XXXX.O ...... ..O... ...... ...... ......');
    for (const d of DIFFICULTIES) expect(chooseOcMoveWith(board, 'order', searched(d, 'order'), createRng(3))).toEqual({ cell: 4, mark: 'X' });
  });

  it('Chaos blocks a single threat and never completes five itself (searching levels)', () => {
    const board = B('XXXX.O ...... ..O... ...... ...... ......');
    for (const d of DIFFICULTIES) expect(chooseOcMoveWith(board, 'chaos', searched(d, 'chaos'), createRng(3))).toEqual({ cell: 4, mark: 'O' });
  });

  it('caps the work per move by a deterministic scan budget', () => {
    for (let seed = 0; seed < 6; seed++) {
      const board = randomBoard(seed, 6 + seed * 3);
      if (ocOutcome(board).kind !== 'playing') continue;
      for (const role of ['order', 'chaos'] as const) {
        const level = OC_LEVELS.perfect[role];
        chooseOcMoveWith(board, role, level, createRng(seed));
        // One root move's share may overrun by the replies it is already searching.
        expect(lastScans()).toBeLessThanOrEqual(level.nodes * 1.2);
        const tight = { ...level, nodes: 2_000 };
        const m = chooseOcMoveWith(board, role, tight, createRng(seed));
        expect(board[m.cell]).toBe('');
        expect(lastScans()).toBeLessThanOrEqual(2_000 + 3_000);
      }
    }
  }, 60_000);

  it('Chaos avoids moves that let Order build an unstoppable double threat (medium)', () => {
    // Order threatens to make .XXXX. by playing X at 1; Chaos should prevent it.
    const board = B('..XXX. ...... ...... ...... ...... ......');
    const m = chooseOcMove(board, 'chaos', 'medium', createRng(1));
    const after = [...board];
    after[m.cell] = m.mark;
    const reply = scoreOcMoves(after, 'order', 1);
    expect(Math.max(...reply.values())).toBeLessThan(DOUBLE_THREAT);
  });

  it('scores decided moves as wins and losses', () => {
    const scores = scoreOcMoves(B('XXXX.O ...... ..O... ...... ...... ......'), 'order', 1);
    expect(scores.get(4 * 2)).toBeGreaterThan(WIN);
    const almostFull = B('XXOOXX OOXXOO XXOOXX OOXXOO XXOOXX OOXXO.');
    const last = scoreOcMoves(almostFull, 'chaos', 1);
    expect([...last.keys()]).toEqual([35 * 2, 35 * 2 + 1]);
    expect(last.get(35 * 2)).toBeLessThan(-WIN);
  });

  it('is deterministic for a given PRNG state', () => {
    for (const d of DIFFICULTIES) {
      const board = randomBoard(21, 8);
      const a = createRng(9);
      const b = createRng(9);
      expect(chooseOcMove(board, 'chaos', d, a)).toEqual(chooseOcMove(board, 'chaos', d, b));
      expect(a.state()).toBe(b.state());
    }
  }, 60_000);

  it('levels grow per role: deeper search, fewer slips, larger budgets; hard never slips', () => {
    expect(OC_EASY_SLIP).toBeGreaterThan(0);
    expect(OC_EASY_SLIP).toBeLessThan(0.5);
    for (const role of ['order', 'chaos'] as const) {
      const [easy, medium, hard] = (['easy', 'medium', 'perfect'] as const).map((d) => OC_LEVELS[d][role]);
      expect(easy!.depth).toBeLessThan(medium!.depth);
      expect(medium!.depth).toBeLessThan(hard!.depth);
      expect(easy!.slip).toBeGreaterThan(medium!.slip);
      expect(hard!.slip).toBe(0);
      expect(medium!.nodes).toBeLessThanOrEqual(hard!.nodes);
    }
    // Order is favoured, so the computer's Chaos gets the deeper search at the same level.
    expect(OC_LEVELS.medium.chaos.depth).toBeGreaterThan(OC_LEVELS.medium.order.depth);
  });
});

describe('levels: measured margins with fixed seeds (four random opening moves per game)', () => {
  it('a one-ply scripted player beats easy in both roles', () => {
    expect(orderWins(greedy, ai('easy'), 8, 5000)).toBeGreaterThanOrEqual(6);
    expect(orderWins(ai('easy'), greedy, 8, 5000)).toBeLessThanOrEqual(2);
  }, 60_000);

  it('equal levels are roughly balanced at easy and medium', () => {
    // Measured over 60 games: easy vs easy 50 %, medium vs medium 53 % Order wins.
    const easy = orderWins(ai('easy'), ai('easy'), 10, 5000);
    expect(easy).toBeGreaterThanOrEqual(2);
    expect(easy).toBeLessThanOrEqual(8);
    const medium = orderWins(ai('medium'), ai('medium'), 10, 5000);
    expect(medium).toBeGreaterThanOrEqual(2);
    expect(medium).toBeLessThanOrEqual(8);
  }, 90_000);

  it('medium beats easy in both roles', () => {
    expect(orderWins(ai('medium'), ai('easy'), 8, 5000)).toBeGreaterThanOrEqual(6);
    expect(orderWins(ai('easy'), ai('medium'), 8, 5000)).toBeLessThanOrEqual(2);
  }, 60_000);

  it('hard is at least as strong as medium in both roles', () => {
    // Measured over 60 games: hard Order vs medium Chaos 97 %; medium Order vs hard Chaos 45 % (medium vs medium 53 %).
    expect(orderWins(ai('perfect'), ai('medium'), 6, 5000)).toBeGreaterThanOrEqual(5);
    expect(orderWins(ai('medium'), ai('perfect'), 6, 5000)).toBeLessThanOrEqual(4);
  }, 120_000);
});

describe('computer turns in the state', () => {
  it('opens as Order when the person plays Chaos', () => {
    const s = startOcRound({ seed: 3, difficulty: 'easy', opponent: 'computer', role: 'chaos' });
    expect(s.moves).toHaveLength(1);
    expect(isValidOcState(s)).toBe(true);
    expect(startOcRound({ seed: 3, difficulty: 'easy', opponent: 'computer', role: 'order' }).moves).toEqual([]);
  });

  it('playOcTurn adds the person’s move and the reply; refuses the computer’s turn', () => {
    const s = startOcRound({ seed: 3, difficulty: 'medium', opponent: 'computer', role: 'order' });
    const next = playOcTurn(s, { cell: 14, mark: 'O' });
    expect(next.moves[0]).toEqual({ cell: 14, mark: 'O' });
    expect(next.moves).toHaveLength(2);
    expect(next.rng).not.toBe(s.rng);
    expect(playOcTurn(s, { cell: 14, mark: 'O' })).toEqual(next);
    expect(ocComputerReply(next)).toBe(next);
    expect(() => playOcTurn({ ...next, role: 'chaos' }, { cell: 0, mark: 'X' })).toThrow(RangeError);
  });

  it('property: full games against easy stay valid', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom<Role>('order', 'chaos'), (seed, role) => {
        let s = startOcRound({ seed, difficulty: 'easy', opponent: 'computer', role });
        const rng = createRng(seed ^ 0x77);
        while (ocOutcome(ocBoardFromMoves(s.moves)).kind === 'playing') {
          s = playOcTurn(s, rng.pick(ocLegalMoves(ocBoardFromMoves(s.moves))));
          expect(isValidOcState(s)).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  }, 60_000);
});
