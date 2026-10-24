import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  BLOCK_YEARS, LIFE_TABLES, PROFILE_DE, advanceMonth, advanceUntilEvent, ageFactor, ageInYears, budget, commonYears,
  incomeTaxDe, isBalanced, isLifeState, lifeSystems, monthAtAge, mortalityPpm, newLife, nextEconomyYear, startEconomy,
  type LifeState
} from '../src';
import { testRngFor } from './helpers';

const de = PROFILE_DE;
const systems = lifeSystems(de);
const start = (seed: number, over: Partial<LifeState> = {}, householdId = 'middle'): LifeState =>
  ({ ...newLife({ seed, profile: de, householdId, rngFor: testRngFor(seed) }), ...over });

describe('economy (block bootstrap of historical years)', () => {
  it('replays consecutive historical years inside a block and compounds the indices', () => {
    const rng = createRng(3);
    let e = startEconomy(de.economy, rng);
    const years = commonYears(de.economy);
    expect(years[0]).toBe(2009);
    expect(years[years.length - 1]).toBe(2025);
    let price = 1;
    for (let i = 0; i < 40; i++) {
      const before = e;
      price *= 1 + before.inflation;
      e = nextEconomyYear(e, de.economy, rng);
      expect(e.priceIndex).toBe(price);
      if (before.blockLeft > 1 && before.histYear < 2025) expect(e.histYear).toBe(before.histYear + 1);
      expect(e.blockLeft).toBeGreaterThanOrEqual(1);
      expect(e.blockLeft).toBeLessThanOrEqual(BLOCK_YEARS);
    }
  });

  it('pairs inflation and real wages of the same historical year (2022: high inflation, falling real wages)', () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const e = startEconomy(de.economy, rng);
      if (e.histYear === 2022) {
        expect(e.inflation).toBeCloseTo(0.0687, 4);
        expect(e.realWageGrowth).toBeCloseTo(-0.04, 4);
        return;
      }
    }
    throw new Error('2022 never drawn');
  });
});

describe('Germany profile: pay and simplified taxes', () => {
  it('income tax is zero up to the allowance, rises monotonically and ends at the top rates', () => {
    expect(incomeTaxDe(12_000)).toBe(0);
    let prev = 0;
    for (let x = 12_400; x <= 400_000; x += 1_000) {
      const t = incomeTaxDe(x);
      expect(t).toBeGreaterThan(prev);
      prev = t;
    }
    const marginal = (x: number) => incomeTaxDe(x + 100) - incomeTaxDe(x);
    expect(marginal(12_500) / 100).toBeCloseTo(0.14, 1);
    expect(marginal(100_000) / 100).toBeCloseTo(0.42 * 1.055, 2);
    expect(marginal(300_000) / 100).toBeCloseTo(0.45 * 1.055, 2);
  });

  it('gives plausible net pay (simplified, tax class I)', () => {
    const gross = de.grossPay('vocational', 40, 'male', false);
    const net = de.netPay(gross);
    expect(net / gross).toBeGreaterThan(0.6);
    expect(net / gross).toBeLessThan(0.7);
    expect(de.netPay(0)).toBe(0);
  });

  it('pay grows with qualification and (up to 55) with age; part-time halves it', () => {
    expect(de.grossPay('none', 40, 'female', false)).toBeLessThan(de.grossPay('vocational', 40, 'female', false));
    expect(de.grossPay('vocational', 40, 'female', false)).toBeLessThan(de.grossPay('master', 40, 'female', false));
    expect(ageFactor(20)).toBeLessThan(ageFactor(35));
    expect(ageFactor(35)).toBeLessThan(ageFactor(60));
    expect(Math.abs(de.grossPay('bachelor', 40, 'male', true) - de.grossPay('bachelor', 40, 'male', false) / 2)).toBeLessThanOrEqual(1);
    // Adjusted gender gap of 6 %.
    expect(de.grossPay('master', 45, 'female', false) / de.grossPay('master', 45, 'male', false)).toBeCloseTo(0.94, 2);
  });
});

describe('a life', () => {
  it('starts deterministically at birth with a valid state', () => {
    const a = start(42);
    expect(start(42)).toEqual(a);
    expect(isLifeState(a)).toBe(true);
    expect(a.month).toBe(0);
    expect(a.flags).toContain('home.parents');
    expect(budget(a, de)).toEqual([]);
    expect(() => newLife({ seed: 1, profile: de, householdId: 'nope', rngFor: testRngFor(1) })).toThrow(RangeError);
    const low = start(42, {}, 'basic-support');
    expect(low.flags).toEqual(expect.arrayContaining(['parents.basic-support', 'parents.low-income']));
    expect(low.stats.security).toBe(300);
  });

  it('books the right budget for each situation', () => {
    const adult = start(5, { month: monthAtAge(30) });
    const cats = (s: LifeState) => budget(s, de).map((i) => i.category);
    expect(cats({ ...adult, flags: [...adult.flags, 'work.employed'].sort() })).toEqual(['salary', 'living']);
    expect(cats({ ...adult, flags: ['work.unemployed'], counters: { 'ui.left': 3, 'work.last-net': 200_000 } })).toEqual(['unemployment-insurance', 'living']);
    expect(budget({ ...adult, flags: ['work.unemployed'], counters: { 'ui.left': 3, 'work.last-net': 200_000 } }, de)[0]?.cents).toBe(120_000);
    expect(cats({ ...adult, flags: ['work.unemployed'], counters: { 'ui.left': 0 } })).toEqual(['basic-support', 'living']);
    expect(cats({ ...adult, flags: ['parents.low-income', 'work.study'] })).toEqual(['student-grant', 'living']);
    expect(cats({ ...adult, flags: ['work.study'] })).toEqual(['family-support', 'living']);
    // Living costs at the parents' are lower than on one's own.
    const own = budget({ ...adult, flags: [] }, de).find((i) => i.category === 'living')!.cents;
    const home = budget({ ...adult, flags: ['home.parents'] }, de).find((i) => i.category === 'living')!.cents;
    expect(home).toBeGreaterThan(own);
  });

  it('runs whole lives: money stays balanced, ages advance, every life ends (property)', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1e9 }), (seed) => {
      let s = start(seed, { flags: ['home.parents', 'work.employed'] });
      const rngFor = testRngFor(seed);
      for (let i = 0; i < 2000 && s.alive; i++) {
        const r = advanceMonth(s, [], rngFor, systems);
        if (!r.ok) throw new Error(r.reason);
        s = r.state;
      }
      expect(s.alive).toBe(false);
      expect(ageInYears(s.month)).toBeGreaterThanOrEqual(16);
      expect(isBalanced(s.ledger)).toBe(true);
      expect(isLifeState(s)).toBe(true);
    }), { numRuns: 20 });
  });

  it('reproduces the life table: mean age at death matches the conditional life expectancy at 16', () => {
    const row = LIFE_TABLES.DE!.female;
    let alive = 1;
    let expected = 0;
    for (let age = 16; age <= 100; age++) for (let m = 0; m < 12; m++) {
      const d = alive * ((row[age] as number) / 1e6);
      expected += d * (age + (m + 0.5) / 12);
      alive -= d;
    }
    let total = 0;
    const n = 400;
    for (let i = 0; i < n; i++) {
      let s: LifeState = { ...start(i), sex: 'female', month: monthAtAge(16) - 1 };
      const r = advanceUntilEvent(s, [], testRngFor(i), 2000, systems);
      s = r.state;
      expect(r.stop).toBe('dead');
      total += s.month / 12;
    }
    expect(total / n).toBeGreaterThan(expected - 1.5);
    expect(total / n).toBeLessThan(expected + 1.5);
  });

  it('the gentle setting prevents death before 70', () => {
    const s: LifeState = { ...start(9), month: monthAtAge(40), flags: ['content.gentle', 'home.parents'] };
    const certain = { ...de, region: 'XX' };
    expect(mortalityPpm(s, certain)).toBe(0);
    for (let i = 0; i < 50; i++) {
      const r = advanceUntilEvent({ ...s, seed: i }, [], testRngFor(i), 2000, systems);
      expect(ageInYears(r.state.month)).toBeGreaterThanOrEqual(70);
    }
  });
});
