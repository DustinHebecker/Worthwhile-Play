import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import {
  ALL_PARAMS, EVENTS_DE, EVENTS_DE_FAMILY, PROFILE_DE, advanceUntilEvent, availableChoices, budget, checkEvents, childAges,
  choose, holds, isBalanced, isLifeState, lifeSystems, monthAtAge, newLife, type EventDef, type LifeState
} from '../src';
import { life, testRngFor } from './helpers';

const EVENTS: readonly EventDef[] = [...EVENTS_DE, ...EVENTS_DE_FAMILY];
const systems = lifeSystems(PROFILE_DE);
const params = new Set(ALL_PARAMS.map((p) => p.id));

type Picker = (eventId: string, ids: string[]) => number;

function play(seed: number, pick: Picker): { s: LifeState; seen: Map<string, number> } {
  const rngFor = testRngFor(seed);
  let s = newLife({ seed, profile: PROFILE_DE, rngFor });
  const seen = new Map<string, number>();
  for (let guard = 0; guard < 4000 && s.alive; guard++) {
    const r = advanceUntilEvent(s, EVENTS, rngFor, 1200, systems);
    s = r.state;
    if (r.stop === 'limit') throw new Error('no progress');
    while (s.pending.length > 0) {
      const head = s.pending[0]!;
      const def = EVENTS.find((d) => d.id === head.eventId)!;
      const key = def.textId ?? def.id;
      seen.set(key, (seen.get(key) ?? 0) + 1);
      const options = availableChoices(EVENTS, s, head.eventId);
      if (options.length === 0) throw new Error(`stuck at ${head.eventId}`);
      const c = choose(EVENTS, s, head.eventId, options[pick(head.eventId, options.map((o) => o.id))]!.id, rngFor(s.month, `choice:${head.eventId}`));
      if (!c.ok) throw new Error(c.reason);
      s = c.state;
    }
  }
  return { s, seen };
}

const random = (seed: number): Picker => {
  let k = seed * 9 + 7;
  return (_id, ids) => (k = (k * 1103515245 + 12345) >>> 0) % ids.length;
};

describe('Germany family and career pack', () => {
  it('passes the content checker together with the first pack', () => {
    expect(checkEvents(EVENTS, params)).toEqual([]);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
  });

  it('plays a few whole lives with random choices without getting stuck', () => {
    for (let seed = 0; seed < 6; seed++) {
      const { s } = play(seed, random(seed));
      expect(s.alive).toBe(false);
      expect(isBalanced(s.ledger)).toBe(true);
      expect(isLifeState(s)).toBe(true);
    }
  });
});

describe('family budget', () => {
  const base = (over: Partial<LifeState> = {}): LifeState => ({
    ...newLife({ seed: 1, profile: PROFILE_DE, householdId: 'middle', rngFor: testRngFor(1) }),
    calendar: { birthYear: 2026, birthMonth: 3 }, month: monthAtAge(32), flags: ['work.employed'], counters: { qual: 1 }, ...over
  });
  const item = (s: LifeState, c: string) => budget(s, PROFILE_DE).find((i) => i.category === c)?.cents;

  it('shares living costs and child costs with a partner; single parents carry them alone', () => {
    const single = base();
    const couple = base({ flags: ['work.employed', 'rel.partner', 'rel.cohabiting'] });
    expect(item(couple, 'living')).toBe(Math.round(item(single, 'living')! * PROFILE_DE.coupleLivingShare));
    const kid = { children: 1, 'child.1.born': monthAtAge(32) - 30, qual: 1 };
    expect(childAges(base({ counters: kid }))).toEqual([2]);
    expect(item(base({ counters: kid }), 'children')).toBe(-PROFILE_DE.childCost(2));
    expect(item(base({ counters: kid }), 'child-benefit')).toBe(PROFILE_DE.childBenefit());
    expect(item({ ...couple, counters: kid }, 'children')).toBe(-Math.round(PROFILE_DE.childCost(2) / 2));
    expect(item(base({ counters: kid, flags: ['work.employed', 'children.shared'] }), 'children')).toBe(-Math.round(PROFILE_DE.childCost(2) / 2));
    expect(item(base({ counters: kid, flags: ['work.employed', 'children.with-other'] }), 'child-support')).toBe(-PROFILE_DE.childSupport(2));
    expect(item(base({ counters: kid, flags: ['work.employed', 'children.with-other'] }), 'children')).toBeUndefined();
    // Adult children no longer count.
    expect(childAges(base({ counters: { children: 1, 'child.1.born': 0 } }))).toEqual([]);
  });

  it('pays parental allowance during the leave instead of pay, within its bounds', () => {
    const leave = base({ flags: ['work.employed', 'work.parental-leave'], counters: { qual: 1, 'leave.left': 3, 'work.last-net': 250_000 } });
    expect(item(leave, 'salary')).toBeUndefined();
    expect(item(leave, 'parental-allowance')).toBe(Math.round(250_000 * 0.65));
    expect(PROFILE_DE.parentalAllowance(10_000)).toBe(30_000);
    expect(PROFILE_DE.parentalAllowance(1_000_000)).toBe(180_000);
    const after = lifeSystems(PROFILE_DE)(leave, () => ({ ...createRng(1), next: () => 0.999 }));
    expect(after.counters['leave.left']).toBe(2);
    expect(item(base({ flags: ['work.employed', 'work.parental-leave'], counters: { qual: 1, 'leave.left': 0 } }), 'salary')).toBeGreaterThan(0);
  });

  it('a parent at home with a partner has no own income and gets no basic support', () => {
    const home = base({ flags: ['work.home-parent', 'rel.partner', 'rel.married'] });
    expect(budget(home, PROFILE_DE).map((i) => i.category)).toEqual(['living']);
    expect(budget(base({ flags: ['work.home-parent'] }), PROFILE_DE).map((i) => i.category)).toEqual(['basic-support', 'living']);
  });
});

describe('new conditions and effects', () => {
  it('since, mark and birth', () => {
    const s = life({ month: 100, counters: { x: 90 } });
    expect(holds(s, { since: 'x', min: 10, max: 10 })).toBe(true);
    expect(holds(s, { since: 'x', min: 11 })).toBe(false);
    expect(holds(s, { since: 'missing', min: 0 })).toBe(false);
    const defs: EventDef[] = [{ id: 'e', chancePpm: 0, choices: [{ id: 'go', effects: [{ mark: 'm' }, { birth: true }, { birth: true }] }] }];
    const r = choose(defs, life({ month: 100, pending: [{ eventId: 'e', month: 100 }] }), 'e', 'go', createRng(1));
    expect(r.ok && r.state.counters).toEqual({ m: 100, children: 2, 'child.1.born': 100, 'child.2.born': 100 });
    expect(checkEvents([{ id: 'b', textId: 'Bad Id', chancePpm: 0, choices: [{ id: 'ok', effects: [{ mark: 'Bad' }] }] }], params).map((i) => i.problem))
      .toEqual(['bad text id', 'bad counter effect']);
  });
});
