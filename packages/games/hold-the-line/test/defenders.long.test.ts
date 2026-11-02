import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isDefenderKind } from '@wp/td-core';
import { CROSSING, ownPad } from '../src/maps';
import { applyPlan, defendersOf, isValidState, lockRound, MAX_BATTLE_TICKS, MAX_PRODUCERS, newGame, RESEARCH_IDS, stepBattle, type HoldState } from '../src/rules';

/**
 * No stall (design § 18.3, orchestrator's condition 3): whatever buildings and research both sides
 * have, in any round, every battle against the outside force ends well below MAX_BATTLE_TICKS, and
 * every save on the way is valid. At the bound itself (not reached here), what is still on the road
 * or yet to come counts as through, as for the computer's leakage rule; defenders never count.
 */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const KINDS = ['barracks', 'garage', 'hangar'] as const;

function setup(round: number, kinds: readonly [readonly number[], readonly number[]], research: readonly [readonly string[], readonly string[]], solo: boolean, far = false): HoldState {
  let s = clone(newGame(3, 'normal', CROSSING.id, { solo, length: 'endless' }));
  for (const side of solo ? [0] : [0, 1]) {
    s.sides[side]!.credits = 50_000;
    const free: [number, number][] = [];
    for (let y = 0; y < CROSSING.h; y++) for (let x = 0; x < CROSSING.w; x++) if (ownPad(CROSSING, side, x, y)) free.push([x, y]);
    // Far pads: those nearest the middle of the map first (where the force comes in).
    if (far) free.sort((p, q) => Math.abs(p[1] - 8) - Math.abs(q[1] - 8));
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
        // Every building's defenders set off at the lock (they may fall before a sample below sees them).
        const sent = (t.run!.guards ?? []).length;
        expect(sent).toBe(defendersOf(s, 0).length + (solo ? 0 : defendersOf(s, 1).length));
        // Buildings always send some (Siege works alone may send a Mortar team in its rounds).
        if (a.length + (solo ? 0 : b.length) > 0) expect(sent).toBeGreaterThan(0);
        while (t.phase === 'battle') {
          t = stepBattle(t, 100).state;
          expect(isValidState(clone(t))).toBe(true);
          if (t.phase === 'battle') expect(t.run!.tick).toBeLessThan(MAX_BATTLE_TICKS / 2);
        }
        expect(t.world.entities.some((e) => isDefenderKind(e.kind))).toBe(false);
      }),
      // CI failures on PR #111 among the runs: a sampling assertion (since replaced); a Skimmer holding
      // on the force's spawn cell (since fixed in td-core); Siege works without buildings.
      {
        numRuns: 60,
        examples: [
          [7, [1], [], [], [], false],
          [6, [1, 2, 2, 0], [], ['raiders', 'hangars'], [], false],
          [44, [], [], ['siege'], [], false],
          [11, [], [], ['siege'], [], false],
          // Stalls found while fixing the re-review (CLOSE along the road at a bend; a unit waiting out of contact).
          [9, [0, 0, 0, 0, 0], [], [], [], false],
          [16, [0, 0, 1], [], ['shields', 'chassis'], [], false],
          [11, [], [0, 0], [], ['repair', 'siege'], false],
          [40, [1, 1, 2, 2, 2, 1, 1, 0], [], ['raiders'], [], false]
        ]
      }
    );
  }, 900_000);

  /**
   * Steps a battle to its end and returns the ticks it took (re-reviews of PR #111, B1 and B1');
   * with `every`, checks that the save is valid every that many ticks (M1: nothing shares a cell).
   */
  const ticksOf = (s: HoldState, every = 100): number => {
    let t = lockRound(s, () => []);
    let ticks = 0;
    while (t.phase === 'battle') {
      ticks = t.run!.tick;
      t = stepBattle(t, every).state;
      expect(isValidState(clone(t)), `tick ${t.run?.tick}`).toBe(true);
    }
    return ticks;
  };
  const HANGAR = 2;

  it('B1: Hangars against a force with Gliders never park a Skimmer on the entry cell; every battle ends within 2000 ticks', () => {
    const cases: [round: number, hangars: number, twin: boolean, solo: boolean][] = [
      [6, 10, false, true],
      ...[6, 8, 10].flatMap((n) => [[6, n, true, true], [6, n, true, false]] as [number, number, boolean, boolean][]),
      ...[9, 10, 12, 20].map((r) => [r, 8, true, false] as [number, number, boolean, boolean]),
      [12, 10, false, false],
      [20, 10, false, false]
    ];
    for (const [round, n, twin, solo] of cases) {
      // Alone only your side builds; otherwise both sides the same (B1': Skimmers of one side landed on the other half's entry).
      const s = setup(round, [Array(n).fill(HANGAR), solo ? [] : Array(n).fill(HANGAR)], [twin ? ['hangars'] : [], solo ? [] : twin ? ['hangars'] : []], solo, true);
      expect(ticksOf(s), `round ${round + 1}, ${n} Hangars${twin ? ' (twin)' : ''}${solo ? ', alone' : ', both sides'}`).toBeLessThanOrEqual(2000);
    }
  }, 900_000);

  it("B1': 2 to 10 Hangars with and without Twin hangars on both sides, rounds 1 to 47 sampled: every battle ends within 2000 ticks, every save valid", () => {
    for (const n of [2, 4, 6, 8, 10]) {
      for (const twin of [false, true]) {
        for (const round of [0, 3, 6, 9, 10, 12, 16, 20, 25, 31, 38, 46]) {
          const research = twin ? ['hangars'] : [];
          const s = setup(round, [Array(n).fill(HANGAR), Array(n).fill(HANGAR)], [research, research], false, true);
          expect(ticksOf(s, 50), `round ${round + 1}, ${n} Hangars each${twin ? ' (twin)' : ''}`).toBeLessThanOrEqual(2000);
        }
      }
    }
  }, 1_800_000);

  it('M1: saves taken every tick while defenders crowd the entries stay valid (nothing ever shares a cell)', () => {
    for (const [round, kinds] of [
      [6, [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]],
      [9, [0, 0, 0, 0, 0, 1, 1, 1, 2, 2]],
      [20, [1, 1, 1, 1, 1, 0, 0, 0, 0, 0]]
    ] as const) {
      const s = setup(round, [kinds, kinds], [['hangars', 'shields', 'chassis'], ['hangars', 'shields', 'chassis']], false, true);
      expect(ticksOf(s, 1)).toBeLessThanOrEqual(2000);
    }
  }, 1_800_000);
});

