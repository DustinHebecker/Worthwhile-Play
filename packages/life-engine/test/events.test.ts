import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  PPM, advanceMonth, advanceUntilEvent, availableChoices, checkEvents, choose, drawEvents, eligible, holds,
  isLedger, isLifeCore, netWorth, STAT_MAX, type EventDef
} from '../src';
import { life, testRngFor } from './helpers';

const params = new Set(['de.labour.raise']);

const defs: EventDef[] = [
  {
    id: 'raise', chancePpm: 50_000, cooldownMonths: 12, params: ['de.labour.raise'],
    when: { all: [{ age: { min: 18, max: 66 } }, { flag: 'employed' }] },
    choices: [
      { id: 'accept', effects: [{ book: { account: 'cash', cents: 200_00, category: 'salary' } }, { stat: 'satisfaction', add: 20 }] },
      { id: 'negotiate', when: { stat: 'energy', min: 400 }, effects: [{ stat: 'energy', add: -50 }, { schedule: 'raise-answer', inMonths: 1 }] }
    ]
  },
  { id: 'raise-answer', chancePpm: 0, choices: [{ id: 'ok', effects: [{ book: { account: 'cash', cents: 300_00, category: 'salary' } }] }] },
  { id: 'first-job', chancePpm: PPM, once: true, params: ['de.labour.raise'], when: { not: { flag: 'employed' } }, choices: [{ id: 'take', effects: [{ set: 'employed' }] }] }
];

describe('conditions', () => {
  it('evaluates age, flags, stats, sex, balances and combinators', () => {
    const s = life({ flags: ['employed'] });
    expect(holds(s, { age: { min: 18, max: 18 } })).toBe(true);
    expect(holds(s, { age: { min: 19 } })).toBe(false);
    expect(holds(s, { flag: 'employed' })).toBe(true);
    expect(holds(s, { stat: 'health', min: 600 })).toBe(false);
    expect(holds(s, { sex: 'male' })).toBe(false);
    expect(holds(s, { balance: 'cash', min: 1_000_00 })).toBe(true);
    expect(holds(s, { counter: 'children', max: 0 })).toBe(true);
    expect(holds(s, { any: [{ flag: 'x' }, { profile: 'de' }] })).toBe(true);
    expect(holds(s, { not: { flag: 'employed' } })).toBe(false);
    expect(holds(s, { bogus: 1 } as never)).toBe(false);
  });

  it('never throws on junk conditions', () => {
    fc.assert(fc.property(fc.anything(), (c) => { holds(life(), c as never); }));
  });
});

describe('drawing and choosing', () => {
  it('respects once and cooldown', () => {
    const s = life({ flags: ['employed'], lastSeen: { raise: 210 } });
    expect(eligible(defs, s).map((d) => d.id)).not.toContain('raise');
    expect(eligible(defs, { ...s, month: 222 }).map((d) => d.id)).toContain('raise');
    expect(eligible(defs, life({ lastSeen: { 'first-job': 1 } })).map((d) => d.id)).not.toContain('first-job');
  });

  it('draws certain events and resolves choices in order', () => {
    const s = drawEvents(defs, life(), createRng(1));
    expect(s.pending).toEqual([{ eventId: 'first-job', month: 216 }]);
    expect(choose(defs, s, 'raise', 'accept')).toEqual({ ok: false, reason: 'not-pending' });
    expect(choose(defs, s, 'first-job', 'nope')).toEqual({ ok: false, reason: 'unknown-choice' });
    const r = choose(defs, s, 'first-job', 'take');
    expect(r.ok && r.state.flags).toEqual(['employed']);
    expect(r.ok && r.state.pending).toEqual([]);
  });

  it('hides choices whose condition fails and refuses them', () => {
    const tired = life({ flags: ['employed'], stats: { ...life().stats, energy: 100 }, pending: [{ eventId: 'raise', month: 216 }] });
    expect(availableChoices(defs, tired, 'raise').map((c) => c.id)).toEqual(['accept']);
    expect(choose(defs, tired, 'raise', 'negotiate')).toEqual({ ok: false, reason: 'not-available' });
  });

  it('runs scheduled follow-ups in their month', () => {
    const s = life({ flags: ['employed'], lastSeen: { 'first-job': 0 }, pending: [{ eventId: 'raise', month: 216 }] });
    const r = choose(defs, s, 'raise', 'negotiate');
    if (!r.ok) throw new Error('refused');
    expect(r.state.scheduled).toEqual([{ eventId: 'raise-answer', month: 217 }]);
    const after = advanceMonth(r.state, defs, testRngFor(3));
    expect(after.ok && after.state.pending.map((p) => p.eventId)).toContain('raise-answer');
    expect(after.ok && after.state.scheduled).toEqual([]);
  });

  it('advancing waits for pending events and stops at the next event', () => {
    const blocked = life({ pending: [{ eventId: 'first-job', month: 216 }] });
    expect(advanceMonth(blocked, defs, testRngFor(1))).toEqual({ ok: false, reason: 'pending-events' });
    const run = advanceUntilEvent(life({ flags: ['employed'], lastSeen: { raise: 216, 'first-job': 0 } }), defs, testRngFor(9), 600);
    expect(run.stop).toBe('event');
    expect(run.months).toBeGreaterThanOrEqual(12); // cooldown
    expect(run.state.pending[0]?.eventId).toBe('raise');
    expect(advanceMonth(life({ alive: false }), defs, testRngFor(1))).toEqual({ ok: false, reason: 'dead' });
  });

  it('is deterministic per seed and keeps every invariant (property)', () => {
    fc.assert(fc.property(fc.integer(), fc.array(fc.nat(), { maxLength: 40 }), (seed, picks) => {
      const play = () => {
        let s = life();
        for (const p of picks) {
          const r = advanceUntilEvent(s, defs, testRngFor(seed), 24);
          s = r.state;
          const head = s.pending[0];
          if (head !== undefined) {
            const options = availableChoices(defs, s, head.eventId);
            const c = choose(defs, s, head.eventId, options[p % options.length]!.id);
            if (c.ok) s = c.state;
          }
        }
        return s;
      };
      const a = play();
      expect(play()).toEqual(a);
      expect(isLifeCore(a)).toBe(true);
      expect(isLedger(a.ledger)).toBe(true);
      expect(Object.values(a.stats).every((v) => v >= 0 && v <= STAT_MAX)).toBe(true);
      expect(netWorth(a.ledger)).toBeGreaterThanOrEqual(1_000_00);
      expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    }));
  });

  it('chance per month matches its ppm (frequency)', () => {
    const one: EventDef[] = [{ id: 'x', chancePpm: 100_000, params: ['de.labour.raise'], choices: [{ id: 'ok', effects: [] }] }];
    const rng = createRng(7);
    let hits = 0;
    for (let i = 0; i < 20_000; i++) if (drawEvents(one, life(), rng).pending.length > 0) hits++;
    expect(hits / 20_000).toBeGreaterThan(0.09);
    expect(hits / 20_000).toBeLessThan(0.11);
  });
});

describe('content checker', () => {
  it('accepts the fixture and reports problems', () => {
    expect(checkEvents(defs, params)).toEqual([]);
    const bad: EventDef[] = [
      { id: 'a', chancePpm: 2 * PPM, choices: [{ id: 'c', when: { flag: 'x' }, effects: [{ schedule: 'missing', inMonths: 0 }] }] },
      { id: 'a', chancePpm: 10, params: ['nope'], choices: [] }
    ];
    const problems = checkEvents(bad, params).map((i) => i.problem);
    expect(problems).toEqual(expect.arrayContaining([
      'duplicate id', 'chance outside 0…1e6 ppm', 'random event without a source parameter', 'bad schedule missing',
      'no unconditional choice (could block the life)', 'unknown parameter nope', 'no choices'
    ]));
  });

  it('never throws on junk', () => {
    fc.assert(fc.property(fc.array(fc.anything()), (ds) => { checkEvents(ds as EventDef[], params); }));
  });
});

describe('state validation', () => {
  it('accepts a valid core and rejects broken ones without throwing', () => {
    expect(isLifeCore(life())).toBe(true);
    expect(isLifeCore(life({ flags: ['b', 'a'] }))).toBe(false);
    expect(isLifeCore({ ...life(), stats: { ...life().stats, health: 1001 } })).toBe(false);
    expect(isLifeCore({ ...life(), sex: 'x' })).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => { isLifeCore(v); }));
  });
});
