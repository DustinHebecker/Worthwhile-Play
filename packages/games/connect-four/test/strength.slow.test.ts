/**
 * Statistical check that the levels are well graded (owner feedback: "easy" was far too
 * strong), on the standard board and on every variant. Fixed seeds make every number
 * deterministic; the bounds leave headroom so a small tuning change does not need new
 * numbers, but a level that drifts out of its band fails. Matches alternate who starts.
 *
 * Baselines (scripted, not the search):
 *  - random: any legal move;
 *  - greedy: takes a win, blocks a single threat by dropping, otherwise any move that is
 *    not a gift;
 *  - casual: like greedy, but among the non-gift moves picks the best static evaluation
 *    (a fair model of an attentive casual player who thinks one move ahead).
 *
 * Measured on the variants (wins/draws/losses of the first-named side; 16 / 12 / 8 games):
 *
 *   variant                 easy–casual  medium–easy  hard–medium
 *   7×6 five                 3/5/8        9/3/0        6/2/0
 *   8×7 four                 2/0/14      12/0/0        6/0/2
 *   8×7 five                 5/0/11      10/2/0        3/5/0   (five in a row is drawish)
 *   9×7 four                 1/0/15      12/0/0        8/0/0
 *   9×7 five                 3/0/13      11/0/1        6/2/0
 *   7×6 four, pull-out       3/0/13      10/0/2        8/0/0
 *   7×6 five, pull-out       0/0/16      12/0/0        8/0/0
 *   8×7 four, pull-out       3/1/12      12/0/0        8/0/0
 *   8×7 five, pull-out       3/0/13      12/0/0        7/0/1
 *   9×7 four, pull-out       2/0/14      12/0/0        7/0/1
 *   9×7 five, pull-out       1/0/15      12/0/0        8/0/0
 */
import { describe, expect, it } from 'vitest';
import { createRngFromState, type Rng } from '@wp/game-core';
import { chooseMove, evaluate, immediateWins, safeMoves } from '../src/ai';
import {
  STANDARD_VARIANT,
  advance,
  applyToBoard,
  legalMoves,
  other,
  startGame,
  type Difficulty,
  type Game,
  type Move,
  type Player,
  type Variant
} from '../src/rules';

type Agent = (game: Game, rng: Rng) => Move;

const random: Agent = (game, rng) => rng.pick(legalMoves(game.variant, game.cells, game.turn));

/** Shared part of greedy and casual: a win, else the single drop block, else the candidate non-gift moves. */
function tactical(game: Game, rng: Rng): Move | Move[] {
  const { variant, cells, turn } = game;
  const wins = immediateWins(variant, cells, turn);
  if (wins.length > 0) return rng.pick(wins);
  const legal = legalMoves(variant, cells, turn);
  const blocks = immediateWins(variant, cells, other(turn)).filter((move) => move >= 0 && legal.includes(move));
  if (blocks.length > 0) return rng.pick(blocks);
  const safe = safeMoves(game);
  return safe.length > 0 ? safe : legal;
}

const greedy: Agent = (game, rng) => {
  const choice = tactical(game, rng);
  return typeof choice === 'number' ? choice : rng.pick(choice);
};

const casual: Agent = (game, rng) => {
  const choice = tactical(game, rng);
  if (typeof choice === 'number') return choice;
  const scores = choice.map((move) => evaluate(game.variant, applyToBoard(game.variant, game.cells, move, game.turn), game.turn));
  const top = Math.max(...scores);
  return rng.pick(choice.filter((_, i) => scores[i] === top));
};

const level =
  (difficulty: Difficulty): Agent =>
  (game, rng) =>
    chooseMove(game, difficulty, rng, game);

interface Score {
  wins: number;
  draws: number;
  losses: number;
}

/** `games` games of `a` against `b`, alternating the starter; counts from a's point of view. */
function match(variant: Variant, a: Agent, b: Agent, games: number, seed: number): Score {
  const score: Score = { wins: 0, draws: 0, losses: 0 };
  for (let n = 0; n < games; n++) {
    const rng = createRngFromState(seed + n * 7919);
    const aIs: Player = n % 2 === 0 ? 1 : 2;
    let game = startGame(variant);
    while (game.outcome.kind === 'playing') game = advance(game, (game.turn === aIs ? a : b)(game, rng), true);
    const outcome = game.outcome;
    if (outcome.kind === 'draw') score.draws++;
    else if (outcome.kind === 'won' && outcome.win.player === aIs) score.wins++;
    else score.losses++;
  }
  return score;
}

describe('level grading on the standard board (seeded matches)', () => {
  const v = STANDARD_VARIANT;

  it('easy is beatable: it still beats random play, but loses often to simple attentive play', () => {
    expect(match(v, level('easy'), random, 30, 1).wins).toBeGreaterThanOrEqual(27);
    const vsGreedy = match(v, level('easy'), greedy, 40, 1);
    expect(vsGreedy.losses).toBeGreaterThanOrEqual(10);
    const vsCasual = match(v, level('easy'), casual, 40, 1);
    expect(vsCasual.losses).toBeGreaterThanOrEqual(24);
  }, 60_000);

  it('medium is clearly stronger than easy and than the scripted players', () => {
    const vsEasy = match(v, level('medium'), level('easy'), 30, 3);
    expect(vsEasy.wins).toBeGreaterThanOrEqual(24);
    const vsGreedy = match(v, level('medium'), greedy, 30, 1);
    expect(vsGreedy.wins).toBeGreaterThanOrEqual(24);
    const vsCasual = match(v, level('medium'), casual, 30, 1);
    expect(vsCasual.wins).toBeGreaterThan(vsCasual.losses + 5);
  }, 60_000);

  it('hard is clearly stronger than medium', () => {
    // About 0.5 s per game (depth 8 on both sides of many positions): kept small for CI coverage runs.
    const vsMedium = match(v, level('hard'), level('medium'), 12, 105);
    expect(vsMedium.wins).toBeGreaterThanOrEqual(vsMedium.losses + 5);
  }, 60_000);

  it('hard beats easy and the attentive scripted player', () => {
    expect(match(v, level('hard'), level('easy'), 8, 9).wins).toBeGreaterThanOrEqual(7);
    expect(match(v, level('hard'), casual, 6, 1)).toEqual({ wins: 6, draws: 0, losses: 0 });
  }, 60_000);
});

/**
 * Per variant: easy loses most games to the casual player, medium beats easy, hard beats
 * medium. Small fixed-seed samples; the measured results are in the table at the top of this file.
 * CI runs these under coverage on a shared runner, where they took 11–63 s each (2026-10-15, one timed
 * out at 60 s). The hard-vs-medium match is the expensive part, so it runs on two representative
 * variants only (one without and one with pull-out); the table above records it for all of them.
 */
const VARIANT_CASES: { variant: Variant; name: string; hard?: true }[] = [
  { variant: { size: '7x6', connect: 5, pullOut: false }, name: '7 × 6, five in a row' },
  { variant: { size: '8x7', connect: 4, pullOut: false }, name: '8 × 7, four in a row', hard: true },
  { variant: { size: '8x7', connect: 5, pullOut: false }, name: '8 × 7, five in a row' },
  { variant: { size: '9x7', connect: 4, pullOut: false }, name: '9 × 7, four in a row' },
  { variant: { size: '9x7', connect: 5, pullOut: false }, name: '9 × 7, five in a row' },
  { variant: { size: '7x6', connect: 4, pullOut: true }, name: '7 × 6, four in a row, pull-out' },
  { variant: { size: '7x6', connect: 5, pullOut: true }, name: '7 × 6, five in a row, pull-out' },
  { variant: { size: '8x7', connect: 4, pullOut: true }, name: '8 × 7, four in a row, pull-out' },
  { variant: { size: '8x7', connect: 5, pullOut: true }, name: '8 × 7, five in a row, pull-out' },
  { variant: { size: '9x7', connect: 4, pullOut: true }, name: '9 × 7, four in a row, pull-out', hard: true },
  { variant: { size: '9x7', connect: 5, pullOut: true }, name: '9 × 7, five in a row, pull-out' }
];

describe('level grading on every variant (seeded matches)', () => {
  for (const { variant, name, hard } of VARIANT_CASES) {
    it(`${name}: easy < casual player, easy < medium${hard ? ' < hard' : ''}`, () => {
      const easyVsCasual = match(variant, level('easy'), casual, 16, 1);
      expect(easyVsCasual.losses).toBeGreaterThanOrEqual(easyVsCasual.wins + 4);
      const mediumVsEasy = match(variant, level('medium'), level('easy'), 12, 3);
      expect(mediumVsEasy.wins).toBeGreaterThanOrEqual(mediumVsEasy.losses + 6);
      if (!hard) return;
      const hardVsMedium = match(variant, level('hard'), level('medium'), 8, 105);
      expect(hardVsMedium.wins).toBeGreaterThanOrEqual(hardVsMedium.losses + 3);
    }, 150_000);
  }
});
