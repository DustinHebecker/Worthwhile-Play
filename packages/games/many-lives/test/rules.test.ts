import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  LOG_LIMIT, ageOf, budgetOf, createState, currentEvent, decide, isManyLivesState, isOver, settingsOf, step, type ManyLivesState
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
    const a = createState({ seed: 7 });
    expect(createState({ seed: 7 })).toEqual(a);
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

  it('time waits for decisions and refuses unknown choices', () => {
    const s = createState({ seed: 9 });
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
