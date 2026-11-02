import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isDefenderKind } from '@wp/td-core';
import { CROSSING, ownPad } from '../src/maps';
import { applyPlan, isValidState, lockRound, MAX_BATTLE_TICKS, MAX_PRODUCERS, newGame, RESEARCH_IDS, stepBattle, type HoldState } from '../src/rules';

/**
 * No stall (design § 18.3, orchestrator's condition 3): whatever buildings and research both sides
 * have, in any round, every battle against the outside force ends well below MAX_BATTLE_TICKS, and
 * every save on the way is valid. At the bound itself (not reached here), what is still on the road
 * or yet to come counts as through, as for the computer's leakage rule; defenders never count.
 */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const KINDS = ['barracks', 'garage', 'hangar'] as const;

function setup(round: number, kinds: readonly [readonly number[], readonly number[]], research: readonly [readonly string[], readonly string[]], solo: boolean): HoldState {
  let s = clone(newGame(3, 'normal', CROSSING.id, { solo }));
  for (const side of solo ? [0] : [0, 1]) {
    s.sides[side]!.credits = 50_000;
    const free: [number, number][] = [];
    for (let y = 0; y < CROSSING.h; y++) for (let x = 0; x < CROSSING.w; x++) if (ownPad(CROSSING, side, x, y)) free.push([x, y]);
    kinds[side]!.forEach((k, i) => (s = applyPlan(s, side, { t: 'produce', kind: KINDS[k]!, x: free[i]![0], y: free[i]![1] })));
    s.sides[side]!.research = [...research[side]!] as never;
  }
  s.round = round;
  s.log = Array.from({ length: round + 1 }, () => ({ player: [], ai: [] }));
  s.pressure = round === 0 ? 0 : 12;
  s.roundStart = { world: clone(s.world), sides: clone(s.sides) };
  return s;
}

describe('defenders never stall a battle', () => {
  it('random buildings and research on both sides, any round: every battle ends well below the bound, every save valid', () => {
    const side = fc.array(fc.integer({ min: 0, max: 2 }), { maxLength: MAX_PRODUCERS });
    const research = fc.subarray(RESEARCH_IDS as string[]);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 46 }), side, side, research, research, fc.boolean(), (round, a, b, ra, rb, solo) => {
        const s = setup(round, [a, solo ? [] : b], [ra, solo ? [] : rb], solo);
        expect(isValidState(clone(s))).toBe(true);
        let t = lockRound(s, () => []);
        let sawDefenders = false;
        while (t.phase === 'battle') {
          t = stepBattle(t, 100).state;
          sawDefenders ||= t.world.entities.some((e) => isDefenderKind(e.kind));
          expect(isValidState(clone(t))).toBe(true);
          if (t.phase === 'battle') expect(t.run!.tick).toBeLessThan(MAX_BATTLE_TICKS / 2);
        }
        expect(sawDefenders || a.length + (solo ? 0 : b.length) === 0).toBe(true);
      }),
      { numRuns: 60 }
    );
  }, 900_000);
});
