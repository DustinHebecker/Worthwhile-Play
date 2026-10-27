import { describe, expect, it } from 'vitest';
import {
  ALL_PARAMS, PROFILE_IN, ageFactorIn, budget, choose, incomeTaxIn, monthAtAge, newLife, balanceOf, type EventDef, type LifeState
} from '../src';
import { testRngFor } from './helpers';
import { createRng } from '@wp/game-core';

const india = PROFILE_IN;
const base = (over: Partial<LifeState> = {}): LifeState => ({
  ...newLife({ seed: 1, profile: india, householdId: 'upper-middle', rngFor: testRngFor(1) }),
  calendar: { birthYear: 2026, birthMonth: 3 },
  month: monthAtAge(30),
  flags: [],
  counters: {},
  ...over
});
const categories = (s: LifeState) => budget(s, india).map((i) => i.category);

describe('India profile', () => {
  it('uses only known parameters and the Indian price series', () => {
    const ids = new Set(ALL_PARAMS.map((p) => p.id));
    for (const h of india.households) for (const p of h.params) expect(ids.has(p)).toBe(true);
    expect(india.economy.cpi.id).toBe('in.macro.cpi-annual');
    expect(india.economy.realWages).toBeUndefined();
    expect(india.households.map((h) => [h.id, h.incomePercentile])).toEqual([['street', 1], ['upper-middle', 92], ['wealthy', 99]]);
  });

  it('computes the new-regime income tax with rebate, marginal relief and cess', () => {
    expect(incomeTaxIn(0)).toBe(0);
    expect(incomeTaxIn(1_275_000)).toBe(0);
    expect(incomeTaxIn(1_285_000)).toBeCloseTo(10_400, 6);
    expect(incomeTaxIn(1_375_000)).toBeCloseTo(78_000, 6);
    expect(incomeTaxIn(3_075_000)).toBeCloseTo(499_200, 6);
    expect(india.netPay(0)).toBe(0);
    expect(india.netPay(10_000_000)).toBe(10_000_000);
    expect(india.netPay(25_625_000)).toBe(25_625_000 - 4_160_000);
  });

  it('shapes pay by age: rising to 47, flat afterwards, mean 1 over working ages', () => {
    const a = 38 / 50.75;
    expect(ageFactorIn(10)).toBeCloseTo(0.6 * a, 12);
    expect(ageFactorIn(16)).toBeCloseTo(0.6 * a, 12);
    expect(ageFactorIn(19)).toBeCloseTo(0.8 * a, 12);
    expect(ageFactorIn(22)).toBeCloseTo(a, 12);
    expect(ageFactorIn(34.5)).toBeCloseTo(1.25 * a, 12);
    expect(ageFactorIn(47)).toBeCloseTo(1.5 * a, 12);
    expect(ageFactorIn(70)).toBeCloseTo(1.5 * a, 12);
    let sum = 0;
    for (let x = 22; x < 60; x += 0.001) sum += ageFactorIn(x) * 0.001;
    expect(sum / 38).toBeCloseTo(1, 2);
  });

  it('pays casual work without a qualification and salaries with one (exact values)', () => {
    expect(india.grossPay('bachelor', 47, 'male', false)).toBe(4_397_985);
    expect(india.grossPay('none', 16, 'female', false)).toBe(261_650);
    expect(india.grossPay('vocational', 22, 'female', true)).toBe(496_159);
    expect(india.grossPay('master', 30, 'male', false)).toBeGreaterThan(india.grossPay('bachelor', 30, 'male', false));
    expect(india.grossPay('none', 30, 'male', false)).toBeLessThan(india.grossPay('vocational', 30, 'male', false));
  });

  it('derives living and child costs from per-person spending (exact values)', () => {
    expect(india.livingCost('parents')).toBe(349_800);
    expect(india.livingCost('frugal')).toBe(785_143);
    expect(india.livingCost('average')).toBe(1_332_571);
    expect(india.livingCost('comfortable')).toBe(2_089_288);
    expect(india.childCost(3)).toBe(399_771);
    expect(india.childCost(8)).toBe(504_991);
    expect(india.childSupport(8)).toBe(252_496);
    expect(india.childBenefit()).toBe(0);
    expect(india.parentalAllowance(1_000_00)).toBe(0);
    expect(india.basicSupport(true)).toBe(0);
    expect(india.educationSupport(true)).toEqual({ cents: 0, category: 'family-support' });
  });

  it('books no zero items: no benefit without work, no support while studying, the family carries costs at home', () => {
    expect(categories(base())).toEqual(['living']);
    expect(budget(base({ flags: ['home.parents'] }), india)).toEqual([]);
    expect(budget(base({ flags: ['home.parents', 'work.study'] }), india)).toEqual([]);
    expect(budget(base({ flags: ['home.parents', 'work.unemployed'], counters: { 'ui.left': 3, 'work.last-net': 100 } }), india)).toEqual([]);
    expect(categories(base({ flags: ['work.employed', 'home.parents'] }))).toEqual(['salary', 'living']);
    const kids = base({ counters: { children: 1, 'child.1.born': monthAtAge(30) - 12 * 8 } });
    expect(categories(kids)).toEqual(['children', 'living']);
  });

  it('starts lives in each household with their flags', () => {
    const street = newLife({ seed: 2, profile: india, householdId: 'street', rngFor: testRngFor(2) });
    expect(street.flags).toEqual(['home.parents', 'home.street', 'parents.houseless', 'parents.low-income', 'parents.no-degree']);
    expect(street.stats.security).toBe(200);
    expect(street.profileId).toBe('in');
    expect(newLife({ seed: 2, profile: india, householdId: 'wealthy', rngFor: testRngFor(2) }).stats.security).toBe(800);
  });
});

describe('real-price bookings', () => {
  const defs: EventDef[] = [{ id: 'bill', chancePpm: 0, choices: [
    { id: 'real', effects: [{ book: { account: 'cash', cents: -1000, category: 'health', real: true } }] },
    { id: 'nominal', effects: [{ book: { account: 'cash', cents: -1000, category: 'health' } }] }
  ] }];
  const pendingBill = (priceIndex: number): LifeState => {
    const s = base({ pending: [{ eventId: 'bill', month: 0 }] });
    return { ...s, economy: { ...s.economy, priceIndex } };
  };
  const cash = (s: LifeState, choice: string): number => {
    const r = choose(defs, s, 'bill', choice, createRng(1));
    if (!r.ok) throw new Error(r.reason);
    return balanceOf(r.state.ledger, 'cash');
  };

  it('scales real amounts by the price index and leaves nominal ones', () => {
    expect(cash(pendingBill(2.5), 'real')).toBe(-2500);
    expect(cash(pendingBill(2.5), 'nominal')).toBe(-1000);
    expect(cash(pendingBill(1.0006), 'real')).toBe(-1001);
  });

  it('treats a state without a valid economy as start prices', () => {
    for (const economy of [undefined, { priceIndex: 0 }, { priceIndex: Number.NaN }, { priceIndex: '2' }]) {
      const s = { ...pendingBill(1), economy } as unknown as LifeState;
      expect(cash(s, 'real')).toBe(-1000);
    }
  });
});
