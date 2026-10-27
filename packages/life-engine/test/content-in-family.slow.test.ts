import { describe, expect, it } from 'vitest';
import {
  EVENTS_IN, EVENTS_IN_FAMILY, PROFILE_IN, advanceUntilEvent, availableChoices, choose, isBalanced, isLifeState, lifeSystems, newLife,
  type LifeState
} from '../src';
import { testRngFor } from './helpers';

/** Whole-life simulations: a generous timeout so they stay reliable on loaded machines. */
const HEAVY = 120_000;

const EVENTS = [...EVENTS_IN, ...EVENTS_IN_FAMILY];
const systems = lifeSystems(PROFILE_IN);

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

describe('India family pack (calibration)', () => {
  it('plays family lives: most marry and have children, fertility about 2, separation rare', () => {
    let married = 0;
    let parents = 0;
    let children = 0;
    let separated = 0;
    let allDone = 0;
    const n = 300;
    for (let seed = 0; seed < n; seed++) {
      const s = play(seed, ['street', 'upper-middle', 'wealthy'][seed % 3]!, prefer(FAMILY));
      expect(isBalanced(s.ledger)).toBe(true);
      expect(isLifeState(s)).toBe(true);
      if (s.counters['rel.married-since'] !== undefined) married++;
      const k = s.counters.children ?? 0;
      if (k > 0) parents++;
      children += k;
      if (s.flags.includes('rel.separated')) separated++;
      if (s.counters['parents.lost'] === 2) allDone++;
    }
    expect(married / n).toBeGreaterThan(0.85);
    expect(parents / n).toBeGreaterThan(0.75);
    // Always trying for another child: at most four, about 3.5–4 on average.
    expect(children / n).toBeGreaterThan(3);
    expect(children / n).toBeLessThanOrEqual(4);
    expect(separated / n).toBeLessThan(0.05);
    expect(allDone / n).toBeGreaterThan(0.5);
  }, HEAVY);

  it('a family that wants two children has about two (biology, marriage timing and mortality in between)', () => {
    let children = 0;
    const n = 300;
    const base = prefer(FAMILY);
    for (let seed = 0; seed < n; seed++) {
      const s = play(seed, ['street', 'upper-middle', 'wealthy'][seed % 3]!, (ids, st) =>
        ids.includes('no-children') && (st.counters.children ?? 0) >= 2 ? ids.indexOf('no-children') : base(ids));
      children += s.counters.children ?? 0;
    }
    expect(children / n).toBeGreaterThan(1.6);
    expect(children / n).toBeLessThanOrEqual(2);
  }, HEAVY);

  it('offers maternity leave only with social security and lets women choose to keep working', () => {
    let leaves = 0;
    let kept = 0;
    for (let seed = 0; seed < 200; seed++) {
      const s = play(seed, 'upper-middle', prefer(['private', 'stay', 'science', 'residential', 'sit', 'private-college', 'next', 'job', 'take', 'agree', 'continue', 'try', 'happy', 'maternity', 'maternity-short', 'welcome', 'return', 'insurance', 'pay']));
      if (s.sex === 'female' && (s.counters.children ?? 0) > 0 && s.flags.includes('work.social-security')) leaves++;
      if (s.sex === 'female' && !s.flags.includes('work.home-parent')) kept++;
    }
    expect(leaves).toBeGreaterThan(5);
    expect(kept).toBeGreaterThan(50);
  }, HEAVY);
});
