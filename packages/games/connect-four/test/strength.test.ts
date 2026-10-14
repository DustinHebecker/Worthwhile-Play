/**
 * Statistical check that the levels are well graded (owner feedback: "easy" was far too
 * strong). Fixed seeds make every number deterministic; the bounds leave headroom so a
 * small tuning change does not need new numbers, but a level that drifts out of its band
 * fails. Matches alternate who starts.
 *
 * Baselines (scripted, not the search):
 *  - random: any legal column;
 *  - greedy: takes a win, blocks a single threat, otherwise any column that is not a gift;
 *  - casual: like greedy, but among the non-gift columns picks the best static evaluation
 *    (a fair model of an attentive casual player who thinks one move ahead).
 */
import { describe, expect, it } from 'vitest';
import { createRngFromState, type Rng } from '@wp/game-core';
import { chooseMove, evaluate, safeMoves } from '../src/ai';
import { drop, emptyBoard, findWin, legalMoves, other, outcomeOf, toMove, type Board, type Difficulty, type Player } from '../src/rules';

type Agent = (board: Board, rng: Rng) => number;

const winning = (board: Board, player: Player) => legalMoves(board).filter((col) => findWin(drop(board, col, player)) !== null);

const random: Agent = (board, rng) => rng.pick(legalMoves(board));

/** Shared part of greedy and casual: a win, else the single block, else the candidate non-gift columns. */
function tactical(board: Board, rng: Rng): number | number[] {
  const me = toMove(board);
  const wins = winning(board, me);
  if (wins.length > 0) return rng.pick(wins);
  const threats = winning(board, other(me));
  if (threats.length > 0) return rng.pick(threats);
  const safe = safeMoves(board);
  return safe.length > 0 ? safe : legalMoves(board);
}

const greedy: Agent = (board, rng) => {
  const choice = tactical(board, rng);
  return typeof choice === 'number' ? choice : rng.pick(choice);
};

const casual: Agent = (board, rng) => {
  const choice = tactical(board, rng);
  if (typeof choice === 'number') return choice;
  const me = toMove(board);
  const scores = choice.map((col) => evaluate(drop(board, col, me), me));
  const top = Math.max(...scores);
  return rng.pick(choice.filter((_, i) => scores[i] === top));
};

const level =
  (difficulty: Difficulty): Agent =>
  (board, rng) =>
    chooseMove(board, difficulty, rng);

interface Score {
  wins: number;
  draws: number;
  losses: number;
}

/** `games` games of `a` against `b`, alternating the starter; counts from a's point of view. */
function match(a: Agent, b: Agent, games: number, seed: number): Score {
  const score: Score = { wins: 0, draws: 0, losses: 0 };
  for (let game = 0; game < games; game++) {
    const rng = createRngFromState(seed + game * 7919);
    const aIs: Player = game % 2 === 0 ? 1 : 2;
    let board: Board = emptyBoard();
    for (let outcome = outcomeOf(board); outcome.kind === 'playing'; outcome = outcomeOf(board)) {
      const player = toMove(board);
      board = drop(board, (player === aIs ? a : b)(board, rng), player);
    }
    const outcome = outcomeOf(board);
    if (outcome.kind === 'draw') score.draws++;
    else if (outcome.kind === 'won' && outcome.win.player === aIs) score.wins++;
    else score.losses++;
  }
  return score;
}

describe('level grading (seeded matches)', () => {
  it('easy is beatable: it still beats random play, but loses often to simple attentive play', () => {
    expect(match(level('easy'), random, 30, 1).wins).toBeGreaterThanOrEqual(27);
    const vsGreedy = match(level('easy'), greedy, 40, 1);
    expect(vsGreedy.losses).toBeGreaterThanOrEqual(10);
    const vsCasual = match(level('easy'), casual, 40, 1);
    expect(vsCasual.losses).toBeGreaterThanOrEqual(24);
  }, 60_000);

  it('medium is clearly stronger than easy and than the scripted players', () => {
    const vsEasy = match(level('medium'), level('easy'), 30, 3);
    expect(vsEasy.wins).toBeGreaterThanOrEqual(24);
    const vsGreedy = match(level('medium'), greedy, 30, 1);
    expect(vsGreedy.wins).toBeGreaterThanOrEqual(24);
    const vsCasual = match(level('medium'), casual, 30, 1);
    expect(vsCasual.wins).toBeGreaterThan(vsCasual.losses + 5);
  }, 60_000);

  it('hard is clearly stronger than medium', () => {
    // About 0.5 s per game (depth 8 on both sides of many positions): kept small for CI coverage runs.
    const vsMedium = match(level('hard'), level('medium'), 12, 105);
    expect(vsMedium.wins).toBeGreaterThanOrEqual(vsMedium.losses + 5);
  }, 60_000);

  it('hard beats easy and the attentive scripted player', () => {
    expect(match(level('hard'), level('easy'), 8, 9).wins).toBeGreaterThanOrEqual(7);
    expect(match(level('hard'), casual, 6, 1)).toEqual({ wins: 6, draws: 0, losses: 0 });
  }, 60_000);
});
