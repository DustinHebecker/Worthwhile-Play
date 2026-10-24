import { describe, expect, it } from 'vitest';
import { createRng, type Rng } from '@wp/game-core';
import {
  BLOCK_YEARS, GENTLE_MIN_DEATH_AGE, LIFE_TABLES, MORTALITY_FROM_AGE, OWN_FINANCES_AGE, PROFILE_DE, balanceOf, budget,
  flowOf, isLifeState, lifeSystems, monthAtAge, mortalityPpm, newLife, type LifeState, type Profile, type RngFor
} from '../src';
import { testRngFor } from './helpers';

const de = PROFILE_DE;
/** An Rng whose next() always returns `u` (to force or block chance draws). */
const fixed = (u: number): Rng => ({ ...createRng(1), next: () => u });
const always = (u: number): RngFor => () => fixed(u);
const base = (over: Partial<LifeState> = {}): LifeState => ({
  ...newLife({ seed: 1, profile: de, householdId: 'middle', rngFor: testRngFor(1) }),
  // Born in March, so whole years of age never fall on a January (no economy step in these tests).
  calendar: { birthYear: 2026, birthMonth: 3 },
  month: monthAtAge(30),
  flags: [],
  counters: {},
  ...over
});
const withPrices = (s: LifeState, priceIndex: number, wageIndex = priceIndex): LifeState => ({ ...s, economy: { ...s.economy, priceIndex, wageIndex } });
const item = (s: LifeState, category: string) => budget(s, de).find((i) => i.category === category)?.cents;

describe('newLife details', () => {
  it('draws both sexes, starts at the parents with an average lifestyle, and adds the gentle flag on request', () => {
    const sexes = new Set(Array.from({ length: 30 }, (_, seed) => newLife({ seed, profile: de, rngFor: testRngFor(seed) }).sex));
    expect(sexes).toEqual(new Set(['female', 'male']));
    const s = newLife({ seed: 3, profile: de, householdId: 'middle', gentle: true, rngFor: testRngFor(3) });
    expect(s.flags).toEqual(['content.gentle', 'home.parents', 'parents.vocational']);
    expect(s.counters).toEqual({ lifestyle: 1 });
    expect(newLife({ seed: 3, profile: de, householdId: 'middle', rngFor: testRngFor(3) }).flags).not.toContain('content.gentle');
    expect(() => newLife({ seed: 1, profile: de, householdId: 'x', rngFor: testRngFor(1) })).toThrow('Unknown household: x');
  });

  it('asks the economy stream for month 0', () => {
    const asked: string[] = [];
    newLife({ seed: 1, profile: de, householdId: 'middle', rngFor: (m, stream) => { asked.push(`${m}:${stream}`); return createRng(1); } });
    expect(asked).toEqual(['0:economy']);
  });
});

describe('budget details', () => {
  it('starts at the own-finances age and stops at death', () => {
    const employed = base({ flags: ['work.employed'] });
    expect(budget({ ...employed, month: monthAtAge(OWN_FINANCES_AGE) - 1 }, de)).toEqual([]);
    expect(budget({ ...employed, month: monthAtAge(OWN_FINANCES_AGE) }, de).length).toBe(2);
    expect(budget({ ...employed, alive: false }, de)).toEqual([]);
  });

  it('scales pay with the wage index, personal raises and prices (taxes at start prices)', () => {
    const s = base({ flags: ['work.employed'], sex: 'male', counters: { qual: 1 } });
    const gross = de.grossPay('vocational', 30, 'male', false);
    expect(item(s, 'salary')).toBe(de.netPay(gross));
    expect(item({ ...s, counters: { qual: 1, 'work.raise-permille': 100 } }, 'salary')).toBe(de.netPay(Math.round(gross * 1.1)));
    const doubled = withPrices(s, 2, 2);
    expect(item(doubled, 'salary')).toBe(Math.round(de.netPay(gross) * 2));
    const realRaise = withPrices(s, 1, 1.5);
    expect(item(realRaise, 'salary')).toBe(de.netPay(Math.round(gross * 1.5)));
    expect(item({ ...s, flags: ['work.employed', 'work.part-time'] }, 'salary')).toBeLessThan(item(s, 'salary')!);
  });

  it('scales support and living costs with prices', () => {
    const study = withPrices(base({ flags: ['work.study'], counters: { lifestyle: 1 } }), 2);
    expect(item(study, 'family-support')).toBe(2 * de.educationSupport(false).cents);
    expect(item(study, 'living')).toBe(-2 * de.livingCost('average'));
    const support = withPrices(base(), 1.5);
    expect(item(support, 'basic-support')).toBe(Math.round(1.5 * de.basicSupport(false)));
    expect(item(withPrices(base({ flags: ['home.parents'] }), 1.5), 'basic-support')).toBe(Math.round(1.5 * de.basicSupport(true)));
    expect(item(base({ counters: { lifestyle: 0 } }), 'living')).toBe(-de.livingCost('frugal'));
    expect(item(base({ counters: { lifestyle: 2 } }), 'living')).toBe(-de.livingCost('comfortable'));
    expect(item(base({ counters: { lifestyle: 9 } }), 'living')).toBe(-de.livingCost('comfortable'));
  });

  it('pays basic support from 18 only, never in retirement; at the parents without income nothing is booked', () => {
    expect(item(base({ month: monthAtAge(18) }), 'basic-support')).toBeGreaterThan(0);
    expect(budget(base({ month: monthAtAge(17), flags: [] }), de).map((i) => i.category)).toEqual(['living']);
    expect(budget(base({ month: monthAtAge(17), flags: ['home.parents'] }), de)).toEqual([]);
    expect(budget(base({ flags: ['work.retired'] }), de).map((i) => i.category)).toEqual(['living']);
    expect(budget(base({ flags: ['work.training', 'home.parents', 'parents.low-income'] }), de).map((i) => i.category)).toEqual(['student-grant', 'living']);
    expect(item(base({ flags: ['work.training', 'home.parents'] }), 'living')).toBe(-de.livingCost('parents'));
  });
});

describe('mortality details', () => {
  it('uses the row of the sex and closes the table at the last age', () => {
    const t = LIFE_TABLES.DE!;
    expect(mortalityPpm(base({ sex: 'female', month: monthAtAge(80) }), de)).toBe(t.female[80]);
    expect(mortalityPpm(base({ sex: 'male', month: monthAtAge(80) }), de)).toBe(t.male[80]);
    expect(mortalityPpm(base({ sex: 'male', month: monthAtAge(130) }), de)).toBe(1_000_000);
    expect(mortalityPpm(base(), { ...de, region: 'XX' } as Profile)).toBe(0);
  });

  it('draws death from the mortality age, not before; gentle protects until its age; the draw is strict', () => {
    const sys = lifeSystems(de);
    const at = (age: number, flags: string[] = []) => base({ month: monthAtAge(age), flags });
    expect(sys(at(MORTALITY_FROM_AGE - 1), always(0)).alive).toBe(true);
    expect(sys(at(MORTALITY_FROM_AGE), always(0)).alive).toBe(false);
    expect(sys(at(MORTALITY_FROM_AGE), always(0)).flags).toContain('died.natural');
    expect(sys(at(GENTLE_MIN_DEATH_AGE - 1, ['content.gentle']), always(0)).alive).toBe(true);
    expect(sys(at(GENTLE_MIN_DEATH_AGE, ['content.gentle']), always(0)).alive).toBe(false);
    // u · 1e6 equal to the hazard does not kill (strict <).
    const s = at(40);
    const ppm = mortalityPpm(s, de);
    expect(sys(s, always(ppm / 1e6)).alive).toBe(true);
    expect(sys(s, always((ppm - 1) / 1e6)).alive).toBe(false);
  });
});

describe('monthly systems details', () => {
  const sys = lifeSystems(de);
  it('moves the economy on in January of every year after birth only', () => {
    const birthJan = base({ calendar: { birthYear: 2026, birthMonth: 1 } });
    const asked: string[] = [];
    const spy: RngFor = (_m, stream) => { asked.push(stream); return fixed(0.99); };
    const jan = sys({ ...birthJan, month: 12 }, spy);
    expect(asked).toContain('economy');
    expect(jan.economy.priceIndex).not.toBe(birthJan.economy.priceIndex);
    asked.length = 0;
    const feb = sys({ ...birthJan, month: 13 }, spy);
    expect(asked).not.toContain('economy');
    expect(feb.economy).toEqual(birthJan.economy);
    asked.length = 0;
    expect(sys({ ...birthJan, month: 0 }, spy).economy).toEqual(birthJan.economy);
    expect(asked).not.toContain('economy');
    expect(BLOCK_YEARS).toBe(5);
  });

  it('books the budget to cash, remembers the last net pay and counts unemployment benefit down', () => {
    const employed = base({ flags: ['work.employed'], counters: { qual: 1 } });
    const after = sys(employed, always(0.99));
    const net = budget(employed, de).find((i) => i.category === 'salary')!.cents;
    expect(after.counters['work.last-net']).toBe(net);
    expect(flowOf(after.ledger, 'salary')).toBe(net);
    expect(balanceOf(after.ledger, 'cash')).toBe(budget(employed, de).reduce((a, i) => a + i.cents, 0));
    const unemployed = base({ flags: ['work.unemployed'], counters: { 'ui.left': 2, 'work.last-net': 100_000 } });
    const u1 = sys(unemployed, always(0.99));
    expect(u1.counters['ui.left']).toBe(1);
    expect(u1.counters['work.last-net']).toBe(100_000);
    expect(sys({ ...unemployed, counters: { 'ui.left': 0 } }, always(0.99)).counters['ui.left']).toBe(0);
    expect(sys(base({ counters: { 'ui.left': 3 } }), always(0.99)).counters['ui.left']).toBe(3);
    // Nothing is booked for an empty budget.
    expect(sys(base({ month: monthAtAge(10) }), always(0.99)).ledger.flows).toEqual({});
  });
});

describe('isLifeState details', () => {
  it('requires the seed, a household id and a valid economy', () => {
    const s = base();
    expect(isLifeState(s)).toBe(true);
    expect(isLifeState({ ...s, seed: 1.5 })).toBe(false);
    expect(isLifeState({ ...s, householdId: 7 })).toBe(false);
    expect(isLifeState({ ...s, householdId: '' })).toBe(false);
    expect(isLifeState({ ...s, householdId: 'Bad Id' })).toBe(false);
    expect(isLifeState({ ...s, householdId: 'x'.repeat(41) })).toBe(false);
    expect(isLifeState({ ...s, householdId: 'ok!' })).toBe(false);
    expect(isLifeState({ ...s, householdId: '!ok' })).toBe(false);
    expect(isLifeState({ ...s, economy: { ...s.economy, blockLeft: 0 } })).toBe(false);
    expect(isLifeState({ ...s, month: -1 })).toBe(false);
  });
});
