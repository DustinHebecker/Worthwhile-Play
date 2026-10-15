import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, type Rng } from '@wp/game-core';
import {
  EASY_SLIP,
  FastNested,
  NESTED_LEVELS,
  chooseNestedMove,
  gameWinningMoves,
  mctsVisits,
  nestedComputerReply,
  playNestedTurn,
  safeMoves,
  startNestedRound
} from '../src/nested-ai';
import {
  NESTED_CELLS,
  emptyNestedPosition,
  isValidNestedState,
  nestedFromMoves,
  nestedLegalMoves,
  nestedOutcome,
  playNested,
  type NestedPosition
} from '../src/nested';
import { DIFFICULTIES, type Difficulty, type Mark } from '../src/rules';

/** Plays `n` uniformly random legal moves from the empty board (seeded). */
function randomPosition(seed: number, n: number): NestedPosition {
  const rng = createRng(seed);
  let p = emptyNestedPosition();
  for (let i = 0; i < n && nestedOutcome(p).kind === 'playing'; i++) p = playNested(p, rng.pick(nestedLegalMoves(p)));
  return p;
}

const arbPosition = fc.tuple(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 70 })).map(([seed, n]) => randomPosition(seed, n));

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

describe('fast search position follows the rules exactly', () => {
  it('property: legal moves, claims, forced board and result agree with nested.ts along random games', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), (seed) => {
        const rng = createRng(seed);
        let p = emptyNestedPosition();
        const fast = FastNested.from(p);
        while (true) {
          const out: number[] = [];
          fast.legalMoves(out);
          expect(out).toEqual(nestedLegalMoves(p));
          expect(FastNested.from(p)).toEqual(fast);
          if (nestedOutcome(p).kind !== 'playing') break;
          const g = rng.pick(nestedLegalMoves(p));
          expect(fast.winsGame(g)).toBe(nestedOutcome(playNested(p, g)).kind === 'won');
          fast.play(g);
          p = playNested(p, g);
        }
      }),
      { numRuns: 60 }
    );
  }, 60_000);

  it('copyFrom makes an independent copy', () => {
    const a = FastNested.from(randomPosition(3, 10));
    const b = new FastNested();
    b.copyFrom(a);
    expect(b).toEqual(a);
    const out: number[] = [];
    b.legalMoves(out);
    b.play(out[0]!);
    expect(b).not.toEqual(a);
  });
});

describe('chooseNestedMove', () => {
  it('refuses to move when the game is over', () => {
    let p = emptyNestedPosition();
    while (nestedOutcome(p).kind === 'playing') p = playNested(p, nestedLegalMoves(p)[0]!);
    for (const d of DIFFICULTIES) expect(() => chooseNestedMove(p, d, createRng(1))).toThrow(RangeError);
  });

  it('property: every move is legal, at every level', () => {
    fc.assert(
      fc.property(arbPosition, fc.constantFrom<Difficulty>('easy', 'medium'), fc.integer({ min: 0, max: 0xffffffff }), (p, d, seed) => {
        fc.pre(nestedOutcome(p).kind === 'playing');
        expect(nestedLegalMoves(p)).toContain(chooseNestedMove(p, d, createRng(seed)));
      }),
      { numRuns: 120 }
    );
    for (const seed of [1, 2, 3]) {
      const p = randomPosition(seed, 20 + seed);
      expect(nestedLegalMoves(p)).toContain(chooseNestedMove(p, 'perfect', createRng(seed)));
    }
  }, 60_000);

  it('is deterministic for a given position and PRNG state', () => {
    for (const d of DIFFICULTIES) {
      const p = randomPosition(11, 12);
      const a = createRng(5);
      const b = createRng(5);
      expect(chooseNestedMove(p, d, a)).toBe(chooseNestedMove(p, d, b));
      expect(a.state()).toBe(b.state());
    }
  }, 60_000);

  it('medium and hard always take a game-winning move and otherwise avoid handing one over', () => {
    let wins = 0;
    let guarded = 0;
    for (let seed = 0; seed < 400 && (wins < 6 || guarded < 6); seed++) {
      const p = randomPosition(seed, 30 + (seed % 40));
      if (nestedOutcome(p).kind !== 'playing') continue;
      const winning = gameWinningMoves(p);
      const safe = safeMoves(p);
      const all = nestedLegalMoves(p);
      if (winning.length > 0) {
        wins++;
        expect(winning).toContain(chooseNestedMove(p, 'medium', createRng(seed)));
        expect(winning).toContain(chooseNestedMove(p, 'perfect', createRng(seed)));
      } else if (safe.length > 0 && safe.length < all.length) {
        guarded++;
        expect(safe).toContain(chooseNestedMove(p, 'medium', createRng(seed)));
      }
    }
    expect(wins).toBeGreaterThanOrEqual(6);
    expect(guarded).toBeGreaterThanOrEqual(6);
  }, 60_000);

  it('gameWinningMoves and safeMoves agree with a direct check', () => {
    for (let seed = 0; seed < 60; seed++) {
      const p = randomPosition(seed, 40);
      if (nestedOutcome(p).kind !== 'playing') continue;
      const all = nestedLegalMoves(p);
      expect(gameWinningMoves(p)).toEqual(all.filter((g) => nestedOutcome(playNested(p, g)).kind === 'won'));
      expect(safeMoves(p)).toEqual(
        all.filter((g) => {
          const q = playNested(p, g);
          return nestedOutcome(q).kind !== 'playing' || !nestedLegalMoves(q).some((h) => nestedOutcome(playNested(q, h)).kind === 'won');
        })
      );
    }
  });

  it('easy sometimes plays a random move; its slip rate and budgets are ordered by level', () => {
    expect(EASY_SLIP).toBeGreaterThan(0);
    expect(EASY_SLIP).toBeLessThan(0.5);
    expect(NESTED_LEVELS.easy.iterations).toBeLessThan(NESTED_LEVELS.medium.iterations);
    expect(NESTED_LEVELS.medium.iterations).toBeLessThan(NESTED_LEVELS.perfect.iterations);
    expect(NESTED_LEVELS.medium.slip).toBe(0);
    expect(NESTED_LEVELS.perfect.slip).toBe(0);
    expect(NESTED_LEVELS.easy.safety).toBe(false);
    expect(NESTED_LEVELS.medium.safety && NESTED_LEVELS.perfect.safety).toBe(true);
  });

  it('MCTS spends its whole budget on the given candidates only', () => {
    const p = randomPosition(8, 6);
    const candidates = nestedLegalMoves(p).slice(0, 3);
    const visits = mctsVisits(FastNested.from(p), candidates, 300, createRng(2));
    expect([...visits.keys()]).toEqual(candidates);
    expect([...visits.values()].reduce((a, b) => a + b, 0)).toBe(300);
  });

  it('MCTS finds a claim that wins the game when one exists', () => {
    for (let seed = 0, found = 0; seed < 300 && found < 3; seed++) {
      const p = randomPosition(seed, 35);
      if (nestedOutcome(p).kind !== 'playing') continue;
      const winning = gameWinningMoves(p);
      const all = nestedLegalMoves(p);
      if (winning.length === 0 || winning.length * 3 > all.length) continue;
      found++;
      const visits = mctsVisits(FastNested.from(p), all, 2000, createRng(seed));
      const best = Math.max(...visits.values());
      expect(winning.some((g) => visits.get(g) === best)).toBe(true);
    }
  }, 60_000);
});

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

describe('computer turns in the state', () => {
  it('opens when it starts and advances the stored PRNG', () => {
    const s = startNestedRound({ seed: 5, difficulty: 'easy', opponent: 'computer', starter: 'computer' });
    expect(s.moves).toHaveLength(1);
    expect(s.rng).not.toBe(5);
    expect(isValidNestedState(s)).toBe(true);
    expect(startNestedRound({ seed: 5, difficulty: 'easy', opponent: 'computer', starter: 'human' }).moves).toEqual([]);
    expect(startNestedRound({ seed: 5, difficulty: 'easy', opponent: 'human', starter: 'computer' }).moves).toEqual([]);
  });

  it('playNestedTurn adds the person’s move and the reply; replays reproduce the exact state', () => {
    const s = startNestedRound({ seed: 9, difficulty: 'easy', opponent: 'computer', starter: 'human' });
    const t1 = playNestedTurn(s, 40);
    expect(t1.moves[0]).toBe(40);
    expect(t1.moves).toHaveLength(2);
    expect(isValidNestedState(t1)).toBe(true);
    expect(playNestedTurn(s, 40)).toEqual(t1);
    expect(nestedComputerReply(t1)).toBe(t1);
    expect(() => playNestedTurn(t1, 0)).toThrow(RangeError);
    const computerFirst = startNestedRound({ seed: 9, difficulty: 'easy', opponent: 'computer', starter: 'computer' });
    expect(() => playNestedTurn({ ...computerFirst, moves: [] }, 40)).toThrow(RangeError);
  });

  it('property: full games against easy stay valid and never exceed 81 moves', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), (seed) => {
        let s = startNestedRound({ seed, difficulty: 'easy', opponent: 'computer', starter: seed % 2 === 0 ? 'human' : 'computer' });
        const rng = createRng(seed ^ 0x5a5a);
        while (nestedOutcome(nestedFromMoves(s.moves)).kind === 'playing') {
          s = playNestedTurn(s, rng.pick(nestedLegalMoves(nestedFromMoves(s.moves))));
          expect(isValidNestedState(s)).toBe(true);
        }
        expect(s.moves.length).toBeLessThanOrEqual(NESTED_CELLS);
      }),
      { numRuns: 15 }
    );
  }, 60_000);
});
