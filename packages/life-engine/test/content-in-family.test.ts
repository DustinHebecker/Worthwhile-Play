import { describe, expect, it } from 'vitest';
import {
  ALL_PARAMS, EVENTS_IN, EVENTS_IN_FAMILY, LIFE_TABLES, PARENT_DEATH_IN, PROFILE_IN, advanceUntilEvent, availableChoices, budget, checkEvents,
  choose, isBalanced, isLifeState, lifeSystems, monthAtAge, newLife, type LifeState
} from '../src';
import { testRngFor } from './helpers';

/** Whole-life simulations: a generous timeout so they stay reliable on loaded machines. */
const HEAVY = 120_000;

const EVENTS = [...EVENTS_IN, ...EVENTS_IN_FAMILY];
const systems = lifeSystems(PROFILE_IN);
const params = new Set(ALL_PARAMS.map((p) => p.id));

function play(seed: number, householdId: string, pick: (ids: string[], s: LifeState) => number): LifeState {
  const rngFor = testRngFor(seed);
  let s = newLife({ seed, profile: PROFILE_IN, householdId, rngFor });
  for (let guard = 0; guard < 4000 && s.alive; guard++) {
    s = advanceUntilEvent(s, EVENTS, rngFor, 1200, systems).state;
    while (s.pending.length > 0) {
      const head = s.pending[0]!;
      const ids = availableChoices(EVENTS, s, head.eventId).map((c) => c.id);
      if (ids.length === 0) throw new Error(`stuck at ${head.eventId}`);
      const c = choose(EVENTS, s, head.eventId, ids[pick(ids, s)]!, rngFor(s.month, `choice:${head.eventId}`));
      if (!c.ok) throw new Error(c.reason);
      s = c.state;
    }
  }
  return s;
}
const prefer = (order: string[]) => (ids: string[]) => {
  for (const o of order) { const i = ids.indexOf(o); if (i >= 0) return i; }
  return 0;
};
const FAMILY = ['government', 'private', 'stay', 'commerce-arts', 'college', 'job', 'take', 'agree', 'try', 'happy', 'keep-trying', 'maternity', 'maternity-short', 'welcome', 'return', 'average', 'pay', 'family'];

describe('India family pack', () => {
  it('passes the content checker together with the first pack', () => {
    expect(checkEvents(EVENTS, params)).toEqual([]);
  });

  it('derives parent deaths from the life table (exact for the first band)', () => {
    const t = LIFE_TABLES.IN!;
    let both = 0;
    for (let a = 16; a <= 29; a++) both += t.female[a + 22]! + t.male[a + 27]!;
    expect(PARENT_DEATH_IN[0]).toEqual([16, 29, Math.round(both / 14), Math.round(both / 28)]);
    for (const [, , b, o] of PARENT_DEATH_IN) {
      expect(b).toBeGreaterThanOrEqual(o);
      expect(b).toBeLessThanOrEqual(1_000_000);
    }
    expect(PARENT_DEATH_IN.map((r) => r[2])).toEqual([...PARENT_DEATH_IN.map((r) => r[2])].sort((x, y) => x - y));
  });

  it('pays the maternity benefit at the last net pay', () => {
    const s = newLife({ seed: 1, profile: PROFILE_IN, householdId: 'upper-middle', rngFor: testRngFor(1) });
    const leave: LifeState = { ...s, month: monthAtAge(28), flags: ['rel.married', 'work.employed', 'work.parental-leave'], counters: { 'leave.left': 3, 'work.last-net': 4_000_000 } };
    expect(budget(leave, PROFILE_IN)[0]).toEqual({ category: 'parental-allowance', cents: 4_000_000 });
    expect(PROFILE_IN.parentalLeaveMonths).toBe(6);
  });

  it('plays a few whole family lives without getting stuck', () => {
    for (let seed = 0; seed < 12; seed++) {
      const s = play(seed, ['street', 'upper-middle', 'wealthy'][seed % 3]!, prefer(FAMILY));
      expect(s.alive).toBe(false);
      expect(isBalanced(s.ledger)).toBe(true);
      expect(isLifeState(s)).toBe(true);
    }
  }, HEAVY);
});
