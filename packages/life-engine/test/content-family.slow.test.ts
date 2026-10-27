import { describe, expect, it } from 'vitest';
import {
  EVENTS_DE, EVENTS_DE_FAMILY, PROFILE_DE, advanceUntilEvent, availableChoices, choose, isBalanced, isLifeState, lifeSystems,
  newLife, type EventDef, type LifeState
} from '../src';
import { testRngFor } from './helpers';

const EVENTS: readonly EventDef[] = [...EVENTS_DE, ...EVENTS_DE_FAMILY];
const systems = lifeSystems(PROFILE_DE);

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
/** A "family" strategy: start relationships, move in, marry, try for children, take leave. */
const family: Picker = (_id, ids) => {
  const prefer = ['together', 'move-in', 'marry', 'try', 'keep-trying', 'leave-12', 'part-time', 'full-time', 'study', 'stay', 'average', 'exams', 'job'];
  for (const p of prefer) { const i = ids.indexOf(p); if (i >= 0) return i; }
  return 0;
};

describe('Germany family and career pack (whole-life runs)', () => {
  it('plays whole lives with random choices: never stuck, money balanced, valid saves', () => {
    for (let seed = 0; seed < 80; seed++) {
      const { s } = play(seed, random(seed));
      expect(s.alive).toBe(false);
      expect(isBalanced(s.ledger)).toBe(true);
      expect(isLifeState(s)).toBe(true);
    }
  });

  it('reaches every family event text over many lives', () => {
    const all = new Map<string, number>();
    for (let seed = 0; seed < 120; seed++) {
      for (const [k, n] of play(seed, seed % 2 === 0 ? family : random(seed)).seen) all.set(k, (all.get(k) ?? 0) + n);
    }
    const texts = new Set(EVENTS_DE_FAMILY.map((e) => e.textId ?? e.id));
    expect([...texts].filter((t) => !all.has(t))).toEqual([]);
  });

  it('family lives: most have children; about a third of marriages end in divorce (calibration, wide bands)', () => {
    let married = 0;
    let divorced = 0;
    let parents = 0;
    const n = 200;
    for (let seed = 0; seed < n; seed++) {
      const { s, seen } = play(seed, family);
      if ((seen.get('rel.marry') ?? 0) > 0 && s.counters['rel.married-since'] !== undefined) married++;
      if ((seen.get('rel.divorce') ?? 0) + (seen.get('rel.divorce-kids') ?? 0) > 0) divorced++;
      if ((s.counters.children ?? 0) > 0) parents++;
    }
    expect(parents / n).toBeGreaterThan(0.6);
    expect(married / n).toBeGreaterThan(0.5);
    // Lifetime divorce risk ≈ 33 % of marriages (family.md § 2a); a wide band for a game simulation.
    expect(divorced / married).toBeGreaterThan(0.15);
    expect(divorced / married).toBeLessThan(0.5);
  });
});

