import { describe, expect, it } from 'vitest';
import { createRng, type Rng } from '@wp/game-core';
import { chooseNestedMove, gameWinningMoves, safeMoves } from '../src/nested-ai';
import { emptyNestedPosition, nestedLegalMoves, nestedOutcome, playNested, type NestedPosition } from '../src/nested';
import type { Difficulty, Mark } from '../src/rules';

// Level margins measured in whole seeded games (split from nested-ai.test.ts): seconds per match,
// so mutation testing leaves this *.slow.test.ts file out (ADR 0021); `pnpm test` and CI run it.

type Player = (p: NestedPosition, rng: Rng) => number;
const ai = (d: Difficulty): Player => (p, rng) => chooseNestedMove(p, d, rng);

/**
 * Scripted opponent: wins the game when it can, never hands over an immediate game win, claims a small board
 * when it can and otherwise avoids sending the opponent to a board the opponent can claim at once.
 */
const heuristic: Player = (p, rng) => {
  const wins = gameWinningMoves(p);
  if (wins.length > 0) return rng.pick(wins);
  const safe = safeMoves(p);
  const candidates = safe.length > 0 ? safe : nestedLegalMoves(p);
  const claims = candidates.filter((g) => playNested(p, g).claims[Math.floor(g / 9)] === p.toMove);
  if (claims.length > 0) return rng.pick(claims);
  const quiet = candidates.filter((g) => {
    const after = playNested(p, g);
    return !nestedLegalMoves(after).some((h) => playNested(after, h).claims[Math.floor(h / 9)] === after.toMove);
  });
  return rng.pick(quiet.length > 0 ? quiet : candidates);
};

/** Plays `games` games, A as X in even games; returns wins of A and B (draws are the rest). */
function match(a: Player, b: Player, games: number, seed: number): { a: number; b: number } {
  let aw = 0;
  let bw = 0;
  for (let g = 0; g < games; g++) {
    const rng = createRng(seed + g);
    const aMark: Mark = g % 2 === 0 ? 'X' : 'O';
    let p = emptyNestedPosition();
    while (nestedOutcome(p).kind === 'playing') p = playNested(p, (p.toMove === aMark ? a : b)(p, rng));
    const outcome = nestedOutcome(p);
    if (outcome.kind === 'won') {
      if (outcome.mark === aMark) aw++;
      else bw++;
    }
  }
  return { a: aw, b: bw };
}

describe('levels: measured margins with fixed seeds', () => {
  it('a simple scripted player beats easy', () => {
    const r = match(heuristic, ai('easy'), 10, 1000);
    expect(r.a).toBeGreaterThan(r.b);
  }, 60_000);

  it('medium beats easy', () => {
    const r = match(ai('medium'), ai('easy'), 4, 1000);
    expect(r.a).toBe(4);
  }, 60_000);

  it('hard beats medium', () => {
    const r = match(ai('perfect'), ai('medium'), 4, 1000);
    expect(r.a).toBeGreaterThan(r.b);
  }, 180_000);
});
