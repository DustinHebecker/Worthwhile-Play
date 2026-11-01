import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { planRound } from '../src/ai';
import { applyPlan, DIFFICULTIES, lockRound, newGame, resolveBattle, type Difficulty, type HoldState, type Planner } from '../src/rules';
import { randomPlan } from './plans';

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

  it('the computer never issues a refused command', () => {
    const arb = fc.record({ seed: fc.integer({ min: 0, max: 2 ** 31 }), build: fc.integer({ min: 0, max: 1000 }), n: fc.integer({ min: 0, max: 10 }) });
    fc.assert(
      fc.property(arb, ({ seed, build, n }) => {
        let s = newGame(seed, 'hard');
        for (let r = 0; r < 3 && s.phase === 'plan'; r++) {
          // At the lock, after the player's own plan: every command of the computer is carried out.
          let planned = 0;
          const counting: Planner = (view) => {
            const cmds = planRound(view);
            planned = cmds.length;
            return cmds;
          };
          const locked = lockRound(randomPlan(s, build + r, n), counting);
          expect(locked.log[locked.round]!.ai).toHaveLength(planned);
          s = resolveBattle(locked).state;
        }
      }),
      { numRuns: 4 }
    );
  }, LONG);

});
