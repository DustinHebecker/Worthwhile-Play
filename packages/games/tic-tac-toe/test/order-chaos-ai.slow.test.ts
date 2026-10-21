import { describe, expect, it } from 'vitest';
import { createRng, type Rng } from '@wp/game-core';
import { chooseOcMove, ocLegalMoves, scoreOcMoves } from '../src/order-chaos-ai';
import { emptyOcBoard, ocOutcome, roleOfMove, type OcMove, type Role } from '../src/order-chaos';
import type { Cell, Difficulty } from '../src/rules';

// Level margins measured in whole seeded games (split from order-chaos-ai.test.ts): seconds per
// match, so mutation testing leaves this *.slow.test.ts file out (ADR 0021); `pnpm test` and CI run it.

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
