import { describe, expect, it } from 'vitest';
import {
  ALL_PARAMS, EVENTS_IN, HOSPITAL_BILL_PAISE, PROFILE_IN, advanceUntilEvent, ageInYears, availableChoices, checkEvents, choose,
  flowOf, isBalanced, isLifeState, lifeSystems, newLife, type LifeState
} from '../src';
import { testRngFor } from './helpers';

/** Whole-life simulations: a generous timeout so they stay reliable on loaded machines. */
const HEAVY = 120_000;

const systems = lifeSystems(PROFILE_IN);
const params = new Set(ALL_PARAMS.map((p) => p.id));

function play(seed: number, householdId: string | undefined, pick: (ids: string[], eventId: string) => number): { s: LifeState; seen: Map<string, number> } {
  const rngFor = testRngFor(seed);
  let s = newLife({ seed, profile: PROFILE_IN, rngFor, ...(householdId === undefined ? {} : { householdId }) });
  const seen = new Map<string, number>();
  for (let guard = 0; guard < 3000 && s.alive; guard++) {
    const r = advanceUntilEvent(s, EVENTS_IN, rngFor, 1200, systems);
    s = r.state;
    if (r.stop === 'limit') throw new Error('no progress');
    while (s.pending.length > 0) {
      const head = s.pending[0]!;
      seen.set(head.eventId, (seen.get(head.eventId) ?? 0) + 1);
      const ids = availableChoices(EVENTS_IN, s, head.eventId).map((c) => c.id);
      if (ids.length === 0) throw new Error(`stuck at ${head.eventId}`);
      const c = choose(EVENTS_IN, s, head.eventId, ids[pick(ids, head.eventId)]!, rngFor(s.month, `choice:${head.eventId}`));
      if (!c.ok) throw new Error(c.reason);
      s = c.state;
    }
  }
  return { s, seen };
}

const random = (seed: number) => {
  let k = seed * 7 + 3;
  return (ids: string[]) => ((k = (k * 1103515245 + 12345) >>> 0) >>> 16) % ids.length;
};
/** Prefers the listed choices in order, else the first. */
const prefer = (order: string[]) => (ids: string[]) => {
  for (const o of order) { const i = ids.indexOf(o); if (i >= 0) return i; }
  return 0;
};

describe('India event pack', () => {
  it('passes the content checker with sourced parameters', () => {
    expect(checkEvents(EVENTS_IN, params)).toEqual([]);
  });

  it('plays whole lives with random choices in every household: never stuck, balanced, valid', () => {
    for (let seed = 0; seed < 45; seed++) {
      const household = PROFILE_IN.households[seed % 3]!.id;
      const { s } = play(seed, household, random(seed));
      expect(s.alive).toBe(false);
      expect(s.profileId).toBe('in');
      expect(isBalanced(s.ledger)).toBe(true);
      expect(isLifeState(s)).toBe(true);
      expect(ageInYears(s.month)).toBeGreaterThanOrEqual(16);
    }
  }, HEAVY);

  it('reaches every event over many lives', () => {
    const all = new Map<string, number>();
    for (let seed = 0; seed < 150; seed++) {
      for (const [id, n] of play(seed, undefined, random(seed)).seen) all.set(id, (all.get(id) ?? 0) + n);
    }
    expect(EVENTS_IN.map((e) => e.id).filter((id) => !all.has(id))).toEqual([]);
  }, HEAVY);

  it('keeps the elite seat rare and coaching helpful, and gives a degree without it', () => {
    let seats = 0;
    let graduates = 0;
    const n = 400;
    for (let seed = 0; seed < n; seed++) {
      const { s } = play(seed, 'upper-middle', prefer(['private', 'stay', 'science', 'residential', 'sit', 'drop-year', 'college', 'next', 'job', 'take', 'insurance']));
      if (s.flags.includes('study.elite')) seats++;
      if (s.flags.includes('qual.bachelor')) graduates++;
    }
    // Coached twice (with the drop year): about 1 − (1 − 0.0234)² ≈ 4.6 %.
    expect(seats / n).toBeGreaterThan(0.015);
    expect(seats / n).toBeLessThan(0.09);
    expect(graduates / n).toBeGreaterThan(0.9);
  }, HEAVY);

  it('lets the street household reach regular work and a room', () => {
    let rooms = 0;
    let qualified = 0;
    const n = 200;
    for (let seed = 0; seed < n; seed++) {
      const { s } = play(seed, 'street', prefer(['government', 'rent', 'stay', 'commerce-arts', 'college', 'job', 'take', 'pay']));
      if (!s.flags.includes('home.street')) rooms++;
      if (s.flags.includes('qual.bachelor')) qualified++;
    }
    expect(rooms / n).toBeGreaterThan(0.8);
    expect(qualified / n).toBeGreaterThan(0.6);
  }, HEAVY);

  it('books hospital bills in start prices scaled by inflation', () => {
    let bills = 0;
    for (let seed = 0; seed < 40 && bills === 0; seed++) {
      const { s } = play(seed, 'upper-middle', prefer(['pay', 'job', 'take', 'frugal', 'average']));
      const spent = -flowOf(s.ledger, 'health');
      if (spent > 0) {
        bills++;
        expect(spent).toBeGreaterThanOrEqual(HOSPITAL_BILL_PAISE);
      }
    }
    expect(bills).toBe(1);
  }, HEAVY);
});
