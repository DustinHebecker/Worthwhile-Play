import { describe, expect, it } from 'vitest';
import { planRound } from '../src/ai';
import { applyPlan, DIFFICULTIES, lockRound, newGame, resolveBattle, type Difficulty, type HoldState, type Planner } from '../src/rules';

/**
 * Strength of the computer opponent (docs/design/tower-defense.md § 16.3), a long suite. The map is
 * symmetric and the planner deterministic, so one game per pairing says everything; the seed has no
 * effect on these games (nothing in them is random).
 */
const LONG = 300_000;

function match(player: Difficulty | 'passive', opponent: Difficulty): HoldState {
  const plan: Planner = (s) => planRound(s, 1, opponent);
  let s = newGame(1, opponent);
  while (s.phase === 'plan') {
    if (player !== 'passive') for (const cmd of planRound(s, 0, player)) s = applyPlan(s, 0, cmd);
    s = resolveBattle(lockRound(s, plan)).state;
  }
  return s;
}

describe('the computer opponent', () => {
  it.each(DIFFICULTIES)('mirror match at %s is a draw (both seats are equal)', (level) => {
    const end = match(level, level);
    expect(end.phase).toBe('draw');
    expect(end.sides[0].core).toBe(end.sides[1].core);
  }, LONG);

  it('hard beats normal, and both beat easy, from either seat', () => {
    expect(match('hard', 'normal').phase).toBe('won');
    expect(match('normal', 'hard').phase).toBe('lost');
    expect(match('normal', 'easy').phase).toBe('won');
    expect(match('easy', 'normal').phase).toBe('lost');
    expect(match('hard', 'easy').phase).toBe('won');
    expect(match('easy', 'hard').phase).toBe('lost');
  }, LONG);

  it.each(DIFFICULTIES)('a player who never plans loses against %s', (level) => {
    expect(match('passive', level).phase).toBe('lost');
  }, LONG);
});
