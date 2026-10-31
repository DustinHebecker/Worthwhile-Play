import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { actorOf, isValidState, legalActions, step, type Action } from '../src/rules';
import { start } from './harness';

/*
 * The broad random-play property. Slow (seconds), so mutation testing skips this file (ADR 0021); CI runs it.
 */
describe('properties over random legal play (slow)', () => {
  const walk = (seed: number, picks: number[], opponents: number) => {
    let s = start(seed, { opponents });
    const states = [s];
    for (const p of picks) {
      if (s.phase === 'over') break;
      const actor = actorOf(s);
      const legal: Action[] = legalActions(s, actor);
      const action = legal[p % legal.length]!;
      const next = step(s, actor, action);
      expect(next, JSON.stringify(action)).not.toBeNull();
      s = next!;
      states.push(s);
    }
    return states;
  };

  it('every reachable state is valid (card conservation, slots, phases)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.array(fc.nat(), { minLength: 50, maxLength: 200 }), fc.integer({ min: 1, max: 5 }), (seed, picks, opp) => {
        for (const s of walk(seed, picks, opp)) expect(isValidState(s)).toBe(true);
      }),
      { numRuns: 25 }
    );
  });
});
