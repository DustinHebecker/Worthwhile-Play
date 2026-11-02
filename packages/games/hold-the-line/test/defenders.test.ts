import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isDefenderKind } from '@wp/td-core';
import { defenderResearch, expectedWave, leakage, planRound } from '../src/ai';
import { CROSSING, ownPad } from '../src/maps';
import {
  applyPlan,
  checkPlan,
  defendersOf,
  guardRoute,
  isValidState,
  lockRound,
  MAX_BATTLE_TICKS,
  MAX_DEFENDERS,
  newGame,
  resolveBattle,
  stepBattle,
  type HoldState,
  type PlanCommand,
  type Planner
} from '../src/rules';

/** Defenders against the outside force (owner 2026-11-01; design § 18.3). */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const idle: Planner = () => [];
const pads = (side: number): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < CROSSING.h; y++) for (let x = 0; x < CROSSING.w; x++) if (ownPad(CROSSING, side, x, y)) out.push([x, y]);
  return out;
};
/** An outside-force game where `side` has these buildings (far pads first) and plenty of credits. */
function built(kinds: readonly ('barracks' | 'garage' | 'hangar' | 'lab')[], options: { solo?: boolean } = {}, side = 0): HoldState {
  let s = clone(newGame(1, 'normal', CROSSING.id, options));
  s.sides[side]!.credits = 20_000;
  const free = pads(side).reverse();
  kinds.forEach((kind, i) => (s = applyPlan(s, side, { t: 'produce', kind, x: free[i]![0], y: free[i]![1] })));
  return s;
}

describe('defenders: what the buildings send', () => {
  it('Drill yards, Garages and Hangars send defenders against the outside force, with research as in the Duel', () => {
    const s = built(['barracks', 'garage', 'hangar']);
    expect(defendersOf(s, 0)).toEqual(['picket', 'picket', 'picket', 'scout', 'scout', 'skimmer']);
    const researched = clone(s);
    researched.sides[0].research = ['shields', 'repair', 'raiders', 'chassis', 'hangars', 'siege'];
    expect(defendersOf({ ...researched, round: 2 }, 0)).toEqual(['picket-shield', 'picket-shield', 'picket-shield', 'medic', 'gun-car', 'gun-car', 'bulwark', 'skimmer', 'skimmer', 'mortar-team']);
    expect(defendersOf({ ...researched, round: 0 }, 0)).not.toContain('mortar-team');
    // In the Duel buildings send attackers, never defenders.
    expect(defendersOf(newGame(1, 'normal'), 0)).toEqual([]);
  });

  it('they set off with the force on the road that comes for their side; without buildings nothing changes', () => {
    const plain = lockRound(newGame(1, 'normal', CROSSING.id), idle);
    expect(plain.run!.guards).toBeUndefined();
    const s = built(['barracks']);
    const locked = lockRound(s, idle);
    expect(locked.run!.guards).toEqual([0, 1, 2].map((i) => ({ at: 8 * i, kind: 'picket', route: guardRoute(0), side: 0 })));
    expect(isValidState(clone(locked))).toBe(true);
    // The waves are the outside force as before.
    expect(locked.sides[0].wave).toEqual(plain.sides[0].wave);
  });
});

describe('defenders: in battle', () => {
  it('exist within a battle only: never in a plan phase, the round start or the next round', () => {
    const s = built(['barracks', 'garage']);
    let saw = false;
    let t = lockRound(s, idle);
    while (t.phase === 'battle') {
      t = stepBattle(t, 25).state;
      saw ||= t.world.entities.some((e) => isDefenderKind(e.kind));
      expect(isValidState(clone(t))).toBe(true);
    }
    expect(saw).toBe(true);
    expect(t.world.entities.some((e) => isDefenderKind(e.kind))).toBe(false);
    expect(t.roundStart.world.entities.some((e) => isDefenderKind(e.kind))).toBe(false);
    expect(t.run).toBeNull();
  });

  it('they fight: with defenders less of the force gets through, and the defender side earns the bounties', () => {
    const without = resolveBattle(lockRound(built([]), idle)).state;
    const withThem = resolveBattle(lockRound(built(['barracks', 'barracks', 'garage']), idle)).state;
    expect(withThem.sides[0].core).toBeGreaterThan(without.sides[0].core);
    expect(withThem.sides[0].stats.killed).toBeGreaterThan(without.sides[0].stats.killed);
  });

  it('every battle ends well below MAX_BATTLE_TICKS, also with many defenders against a heavy force', () => {
    const s = built(['barracks', 'barracks', 'barracks', 'garage', 'garage', 'hangar', 'hangar', 'barracks']);
    for (const round of [0, 9, 20]) {
      const at = { ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })), roundStart: { ...s.roundStart, sides: clone(s.sides) } } as HoldState;
      at.sides[0].research = ['repair', 'chassis'];
      at.roundStart.sides[0].research = ['repair', 'chassis'];
      let t = lockRound(at, idle);
      let ticks = 0;
      while (t.phase === 'battle') {
        t = stepBattle(t, 50).state;
        ticks += 50;
      }
      expect(ticks, `round ${round + 1}`).toBeLessThan(MAX_BATTLE_TICKS / 2);
    }
  });

  it('a battle saved at any tick, defenders and all, continues exactly', () => {
    const start = lockRound(built(['barracks', 'garage', 'hangar']), idle);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 500 }), (at) => {
        const mid = stepBattle(start, at).state;
        expect(isValidState(clone(mid))).toBe(true);
        expect(resolveBattle(clone(mid)).state).toEqual(resolveBattle(mid).state);
      }),
      { numRuns: 8 }
    );
  }, 60_000);

  it('alone: only your buildings send defenders', () => {
    const locked = lockRound(built(['barracks'], { solo: true }), idle);
    expect(locked.run!.guards!.every((g) => g.side === 0)).toBe(true);
    expect(isValidState(clone(stepBattle(locked, 30).state))).toBe(true);
  });
});

describe('defenders: saves', () => {
  it('rejects defenders in the Duel, on the wrong road or side, or beyond the bound', () => {
    const locked = lockRound(built(['barracks']), idle);
    const mid = stepBattle(locked, 20).state;
    expect(mid.world.entities.some((e) => isDefenderKind(e.kind))).toBe(true);
    const bad: [HoldState, (t: HoldState) => void][] = [
      [locked, (t) => (t.run!.guards![0]!.route = 0)],
      [locked, (t) => (t.run!.guards![0]!.kind = 'walker' as never)],
      [locked, (t) => (t.run!.guards = Array.from({ length: MAX_DEFENDERS + 1 }, () => ({ at: 0, kind: 'picket', route: guardRoute(0), side: 0 })) as never)],
      [mid, (t) => (t.run!.walkers.find((x) => isDefenderKind(t.world.entities.find((e) => e.id === x.id)?.kind ?? ''))!.route = 0)],
      [mid, (t) => (t.world.entities.find((e) => isDefenderKind(e.kind))!.side = 1)]
    ];
    for (const [i, [base, tamper]] of bad.entries()) {
      const t = clone(base);
      tamper(t);
      expect(isValidState(t), `case ${i}`).toBe(false);
    }
    // Defenders in a Duel battle, or a guard list there.
    const duel = lockRound(newGame(1, 'normal'), (): PlanCommand[] => []);
    expect(isValidState({ ...clone(duel), run: { ...clone(duel.run!), guards: [{ at: 0, kind: 'picket', route: 2, side: 0 }] } })).toBe(false);
    // Alone, the other side has no defenders.
    const solo = lockRound(built(['barracks'], { solo: true }), idle);
    const other = clone(solo);
    other.run!.guards![0] = { ...other.run!.guards![0]!, side: 1, route: guardRoute(1) };
    expect(isValidState(other)).toBe(false);
  });

  it('isValidState never throws on tampered defender saves', () => {
    const mid = stepBattle(lockRound(built(['barracks', 'garage']), idle), 40).state;
    fc.assert(
      fc.property(fc.anything(), fc.constantFrom('guards', 'walkers', 'pending'), (junk, key) => {
        const t = clone(mid) as unknown as { run: Record<string, unknown> };
        t.run[key] = junk;
        expect(() => isValidState(t)).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });
});

describe('defenders: the computer', () => {
  const atRound = (s: HoldState, round: number): HoldState => ({ ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })), pressure: 0 });

  it('its leakage simulation includes the side’s defenders (a Hangar holds part of round 6’s force)', () => {
    const base = atRound(built([]), 5);
    const withHangar = atRound(built(['hangar']), 5);
    const wave = expectedWave(base, 0);
    expect(leakage(withHangar.world, withHangar, 0, wave)).toBeLessThan(leakage(base.world, base, 0, wave));
    // In the Duel no defenders take part.
    const duel = newGame(1, 'normal');
    expect(leakage(duel.world, duel, 1, ['walker'])).toBe(1);
  });

  it('considers defender buildings among its candidates; every command it gives is legal', () => {
    for (const level of ['normal', 'hard'] as const) {
      const s = atRound(built([], {}, 1), 5);
      s.sides[1].credits = 3000;
      s.roundStart = { ...s.roundStart, sides: clone(s.sides) };
      const plan = planRound(s, 1, level);
      let t = s;
      for (const c of plan) {
        expect(checkPlan(t, 1, c), `${level} ${JSON.stringify(c)}`).toBeNull();
        t = applyPlan(t, 1, c);
      }
    }
  });

  it('research for defenders: a Lab from three buildings on, then one item that helps a building it has', () => {
    expect(defenderResearch(built(['barracks', 'barracks'], {}, 1), 1)).toEqual([]);
    const three = built(['barracks', 'garage', 'garage'], {}, 1);
    expect(defenderResearch(three, 1)).toMatchObject([{ t: 'produce', kind: 'lab' }]);
    const lab = built(['barracks', 'garage', 'garage', 'lab'], {}, 1);
    expect(defenderResearch(lab, 1)).toEqual([{ t: 'research', id: 'shields' }]);
    const garages = built(['garage', 'garage', 'garage', 'lab'], {}, 1);
    expect(defenderResearch(garages, 1)).toEqual([{ t: 'research', id: 'chassis' }]);
    garages.sides[1].research = ['chassis', 'raiders'];
    expect(defenderResearch(garages, 1)).toEqual([{ t: 'research', id: 'siege' }]);
    garages.sides[1].researching = ['siege'];
    expect(defenderResearch(garages, 1)).toEqual([]);
  });
});
