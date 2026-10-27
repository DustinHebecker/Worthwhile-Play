import { describe, expect, it } from 'vitest';
import {
  ALL_PARAMS, EVENTS_DE, PROFILE_DE, advanceUntilEvent, ageInYears, availableChoices, checkEvents, choose, isBalanced,
  isLifeState, lifeSystems, newLife, type LifeState
} from '../src';
import { testRngFor } from './helpers';

/** Whole-life simulations: a generous timeout so they stay reliable on loaded machines. */
const HEAVY = 120_000;

const systems = lifeSystems(PROFILE_DE);
const params = new Set(ALL_PARAMS.map((p) => p.id));

/** Plays a whole life with choices picked by `pick`; returns the final state and the events seen. */
function play(seed: number, pick: (options: number, eventId: string, ids: string[]) => number): { s: LifeState; seen: Map<string, number> } {
  const rngFor = testRngFor(seed);
  let s = newLife({ seed, profile: PROFILE_DE, rngFor });
  const seen = new Map<string, number>();
  for (let guard = 0; guard < 3000 && s.alive; guard++) {
    const r = advanceUntilEvent(s, EVENTS_DE, rngFor, 1200, systems);
    s = r.state;
    if (r.stop === 'limit') throw new Error('no progress');
    while (s.pending.length > 0) {
      const head = s.pending[0]!;
      seen.set(head.eventId, (seen.get(head.eventId) ?? 0) + 1);
      const options = availableChoices(EVENTS_DE, s, head.eventId);
      if (options.length === 0) throw new Error(`stuck at ${head.eventId}`);
      const c = choose(EVENTS_DE, s, head.eventId, options[pick(options.length, head.eventId, options.map((o) => o.id))]!.id, rngFor(s.month, `choice:${head.eventId}`));
      if (!c.ok) throw new Error(c.reason);
      s = c.state;
    }
  }
  return { s, seen };
}

describe('Germany event pack', () => {
  it('passes the content checker with sourced parameters', () => {
    expect(checkEvents(EVENTS_DE, params)).toEqual([]);
  });

  it('plays whole lives with random choices: never stuck, money balanced, valid saves', () => {
    for (let seed = 0; seed < 60; seed++) {
      let k = seed;
      const { s } = play(seed, (n) => (k = (k * 1103515245 + 12345) >>> 0) % n);
      expect(s.alive).toBe(false);
      expect(isBalanced(s.ledger)).toBe(true);
      expect(isLifeState(s)).toBe(true);
      expect(ageInYears(s.month)).toBeGreaterThanOrEqual(16);
    }
  }, HEAVY);

  it('reaches every event over many lives', () => {
    const all = new Map<string, number>();
    for (let seed = 0; seed < 150; seed++) {
      let k = seed * 7 + 1;
      for (const [id, n] of play(seed, (m) => (k = (k * 1103515245 + 12345) >>> 0) % m).seen) all.set(id, (all.get(id) ?? 0) + n);
    }
    const never = EVENTS_DE.map((e) => e.id).filter((id) => !all.has(id));
    // The work accident (≈ 20 ppm per month) is too rare to appear in 150 lives.
    expect(never.filter((id) => id !== 'health.work-accident')).toEqual([]);
  }, HEAVY);

  it('keeps university reachable without a recommendation (via the detour)', () => {
    const prefer = ['detour', 'study', 'exams', 'job', 'full-time', 'average', 'support', 'rehab'];
    let blocked = 0;
    let graduates = 0;
    for (let seed = 0; seed < 300; seed++) {
      const { s } = play(seed, (_n, _id, ids) => {
        const i = ids.findIndex((x) => prefer.includes(x));
        return i < 0 ? 0 : i;
      });
      if (!s.flags.includes('school.not-recommended')) continue;
      blocked++;
      if (s.flags.includes('qual.bachelor')) graduates++;
    }
    expect(blocked).toBeGreaterThan(100);
    // Without a recommendation the detour (+2 years) still leads to a degree in about 65 % of cases.
    expect(graduates / blocked).toBeGreaterThan(0.5);
    expect(graduates / blocked).toBeLessThan(0.8);
  }, HEAVY);
});
