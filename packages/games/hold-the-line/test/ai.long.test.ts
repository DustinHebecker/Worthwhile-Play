import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { planRound } from '../src/ai';
import { applyPlan, DIFFICULTIES, lockRound, newGame, resolveBattle, type Difficulty, type HoldState, type Length, type Planner } from '../src/rules';
import { randomPlan } from './plans';

/**
 * Strength of the computer opponent (docs/design/tower-defense.md § 16.3), a long suite. The map is
 * symmetric and the planner deterministic, so one game per pairing says everything; the seed has no
 * effect on these games (nothing in them is random).
 */
const LONG = 300_000;

function match(player: Difficulty | 'passive', opponent: Difficulty, mapId = 'duel', length: Length = 'rounds'): HoldState {
  const plan: Planner = (s) => planRound(s, 1, opponent);
  let s = newGame(1, opponent, mapId, { length });
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

// External Small (§ 17): both sides only defend against the same outside force, so strength shows as
// core kept; Hard keeps more than Normal, which keeps more than Easy, and wins from either seat.
describe('the computer opponent in External Small', () => {
  it.each(DIFFICULTIES)('mirror match at %s is a draw', (level) => {
    const end = match(level, level, 'crossing');
    expect(end.phase).toBe('draw');
  }, LONG);

  it('hard beats normal, and both beat easy, from either seat', () => {
    expect(match('hard', 'normal', 'crossing').phase).toBe('won');
    expect(match('normal', 'hard', 'crossing').phase).toBe('lost');
    expect(match('normal', 'easy', 'crossing').phase).toBe('won');
    expect(match('easy', 'normal', 'crossing').phase).toBe('lost');
    expect(match('hard', 'easy', 'crossing').phase).toBe('won');
    expect(match('easy', 'hard', 'crossing').phase).toBe('lost');
  }, LONG);

  it('in self-play hard lasts longer or keeps more core than normal, normal than easy', () => {
    // The shared pressure can break both cores in the same round: how far a side got counts first.
    const kept = (level: Difficulty) => {
      const end = match(level, level, 'crossing');
      return end.round * 100 + end.sides[0].core;
    };
    expect(kept('hard')).toBeGreaterThan(kept('normal'));
    expect(kept('normal')).toBeGreaterThan(kept('easy'));
  }, LONG);

  it.each(DIFFICULTIES)('a player who never builds loses against %s', (level) => {
    expect(match('passive', level, 'crossing').phase).toBe('lost');
  }, LONG);
});

// Endless (owner 2026-11-01): every game ends, by a fallen core, well before the safety bound.
describe('endless games end', () => {
  it.each(['duel', 'crossing'])('%s: hard mirror and hard against normal end with a fallen core', (mapId) => {
    for (const [a, b] of [['hard', 'hard'], ['hard', 'normal']] as const) {
      const end = match(a, b, mapId, 'endless');
      expect(['won', 'lost', 'draw'], `${mapId} ${a}-${b}`).toContain(end.phase);
      expect(Math.min(end.sides[0].core, end.sides[1].core), `${mapId} ${a}-${b}`).toBe(0);
      expect(end.round, `${mapId} ${a}-${b}`).toBeLessThan(60);
    }
  }, LONG);

  it('alone against the outside force, Hard planning for you holds for a while and then falls', () => {
    let s = newGame(1, 'hard', 'crossing', { solo: true });
    while (s.phase === 'plan') {
      for (const cmd of planRound(s, 0, 'hard')) s = applyPlan(s, 0, cmd);
      s = resolveBattle(lockRound(s, () => [])).state;
    }
    expect(s.phase).toBe('lost');
    expect(s.round).toBeGreaterThanOrEqual(9);
    expect(s.round).toBeLessThan(60);
  }, LONG);
});
