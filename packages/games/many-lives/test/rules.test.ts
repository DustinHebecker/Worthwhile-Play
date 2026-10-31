import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  HOUSEHOLDS, LOG_LIMIT, ageOf, budgetOf, profileOf, createState, currentEvent, decide, isManyLivesState, isOver, settingsOf, step, type ManyLivesState
} from '../src/rules';

/** Plays to the end, always taking the choice at `pick(n)`. */
function playOut(s: ManyLivesState, pick: (n: number) => number = () => 0): ManyLivesState {
  for (let guard = 0; guard < 5000 && !isOver(s); guard++) {
    const ev = currentEvent(s);
    s = ev === undefined ? step(s, 'event') : decide(s, ev.choices[pick(ev.choices.length)]!.id);
  }
  return s;
}

describe('Many Lives rules', () => {
  it('starts deterministically with the first childhood scene', () => {
    const a = createState({ seed: 7, settings: { household: 'de' } });
    expect(createState({ seed: 7, settings: { household: 'de' } })).toEqual(a);
    expect(currentEvent(a)?.def.id).toBe('child.first-day');
    expect(ageOf(a)).toBe(6);
    expect(isManyLivesState(a)).toBe(true);
    expect(a.log.map((e) => e.key)).toEqual(['event.child.first-day.title']);
  });

  it('honours the household and content settings', () => {
    const low = createState({ seed: 3, settings: { household: 'basic-support', content: 'gentle' } });
    expect(low.life.householdId).toBe('basic-support');
    expect(low.life.flags).toContain('content.gentle');
    expect(settingsOf(low)).toEqual({ household: 'basic-support', content: 'gentle' });
    const junk = createState({ seed: 3, settings: { household: 'castle', content: 42 } });
    expect(junk.household).toBe('random');
    expect(junk.content).toBe('show');
  });

  it('starts lives in both regions: by region, by household or by chance', () => {
    const street = createState({ seed: 4, settings: { household: 'street' } });
    expect(street.life.profileId).toBe('in');
    expect(street.life.householdId).toBe('street');
    expect(currentEvent(street)?.def.id).toBe('school.start-in');
    expect(currentEvent(street)?.choices.map((c) => c.id)).toEqual(['government']);
    expect(profileOf(street).currency).toBe('INR');
    const india = createState({ seed: 4, settings: { household: 'in' } });
    expect(india.life.profileId).toBe('in');
    expect(['street', 'upper-middle', 'wealthy']).toContain(india.life.householdId);
    expect(createState({ seed: 4, settings: { household: 'de' } }).life.profileId).toBe('de');
    const regions = new Set<string>();
    for (let seed = 0; seed < 40; seed++) regions.add(createState({ seed }).life.profileId);
    expect([...regions].sort()).toEqual(['de', 'in']);
    expect(HOUSEHOLDS).toEqual(['random', 'de', 'basic-support', 'middle', 'in', 'street', 'upper-middle', 'wealthy']);
  });

  it('keeps the events of each region apart', () => {
    const india = createState({ seed: 4, settings: { household: 'wealthy' } });
    expect(isManyLivesState(india)).toBe(true);
    expect(isManyLivesState({ ...india, life: { ...india.life, profileId: 'de' } })).toBe(false);
    expect(isManyLivesState({ ...india, life: { ...india.life, profileId: 'xx' } })).toBe(false);
    const de = createState({ seed: 4, settings: { household: 'middle' } });
    expect(isManyLivesState({ ...de, life: { ...de.life, pending: [{ eventId: 'school.start-in', month: de.life.month }] } })).toBe(false);
    expect(decide(india, 'curious')).toBe(india);
    expect(decide(india, 'private').life.flags).toContain('school.private');
  });

  it('plays whole Indian lives to their natural end with valid states', () => {
    for (const household of ['street', 'upper-middle', 'wealthy']) {
      const end = playOut(createState({ seed: 11, settings: { household } }), (n) => n - 1);
      expect(isOver(end)).toBe(true);
      expect(isManyLivesState(end)).toBe(true);
      expect(end.life.profileId).toBe('in');
    }
  });

  it('time waits for decisions and refuses unknown choices', () => {
    const s = createState({ seed: 9, settings: { household: 'middle' } });
    expect(step(s, 'month')).toBe(s);
    expect(decide(s, 'nope')).toBe(s);
    const after = decide(s, 'curious');
    expect(after.life.flags).toContain('trait.curious');
    expect(currentEvent(after)).toBeUndefined();
    const month = step(after, 'month');
    expect(month.life.month).toBe(after.life.month + 1);
    expect(month.lastStep).toBe(1);
    const year = step(after, 'year');
    expect(year.life.month - after.life.month).toBeLessThanOrEqual(12);
  });

  it('plays whole lives to their natural end with valid states (property)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.integer({ min: 0, max: 3 }), (seed, k) => {
      const end = playOut(createState({ seed }), (n) => k % n);
      expect(isOver(end)).toBe(true);
      expect(ageOf(end)).toBeGreaterThanOrEqual(16);
      expect(isManyLivesState(end)).toBe(true);
      expect(end.log.length).toBeLessThanOrEqual(LOG_LIMIT);
      expect(JSON.parse(JSON.stringify(end))).toEqual(end);
    }), { numRuns: 15 });
  });

  it('the gentle setting keeps the character alive until 70', () => {
    for (let seed = 0; seed < 15; seed++) {
      expect(ageOf(playOut(createState({ seed, settings: { content: 'gentle' } })))).toBeGreaterThanOrEqual(70);
    }
  });

  it('shows a budget only once there are own finances', () => {
    const child = createState({ seed: 2 });
    expect(budgetOf(child)).toEqual([]);
  });

  it('rejects junk and tampered saves without throwing', () => {
    const s = createState({ seed: 5 });
    expect(isManyLivesState({ ...s, household: 'castle' })).toBe(false);
    expect(isManyLivesState({ ...s, appearance: { skin: 9, hair: 0, style: 0 } })).toBe(false);
    expect(isManyLivesState({ ...s, life: { ...s.life, pending: [{ eventId: 'unknown.event', month: 1 }] } })).toBe(false);
    expect(isManyLivesState({ ...s, log: Array.from({ length: LOG_LIMIT + 1 }, () => ({ month: 0, key: 'x' })) })).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => { isManyLivesState(v); }));
  });
});

describe('event texts', () => {
  it('every event and choice has its texts in English and German', async () => {
    const { REGIONS, textIdOf } = await import('../src/rules');
    const EVENTS = Object.values(REGIONS).flatMap((r) => r.events);
    const { messages } = await import('../src/messages');
    const missing: string[] = [];
    for (const locale of ['en', 'de']) {
      const m = messages[locale]!;
      for (const def of EVENTS) {
        const id = textIdOf(def);
        for (const key of [`event.${id}.title`, `event.${id}.text`, ...def.choices.map((c) => `choice.${id}.${c.id}`)]) {
          if (m[key] === undefined) missing.push(`${locale}:${key}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
