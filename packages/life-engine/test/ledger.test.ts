import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { balanceOf, book, flowOf, isBalanced, isLedger, netWorth, openLedger, transfer, type Ledger } from '../src';

const accounts = ['cash', 'savings', 'broker', 'mortgage', 'etf:world'] as const;
const categories = ['salary', 'rent', 'tax', 'market-gain', 'food'] as const;
const cents = fc.integer({ min: -10_000_000_00, max: 10_000_000_00 });

type Op = { t: 'book'; a: string; c: number; k: string } | { t: 'move'; a: string; b: string; c: number };

const op: fc.Arbitrary<Op> = fc.oneof(
  fc.record({ t: fc.constant('book' as const), a: fc.constantFrom(...accounts), c: cents, k: fc.constantFrom(...categories) }),
  fc.record({ t: fc.constant('move' as const), a: fc.constantFrom(...accounts), b: fc.constantFrom(...accounts), c: cents })
);

function apply(l: Ledger, o: Op): Ledger {
  return o.t === 'book' ? book(l, o.a, o.c, o.k) : transfer(l, o.a, o.b, o.c);
}

describe('ledger', () => {
  it('books external flows and transfers', () => {
    let l = openLedger({ cash: 100_00 });
    l = book(l, 'cash', 2_500_00, 'salary');
    l = book(l, 'cash', -900_00, 'rent');
    l = transfer(l, 'cash', 'savings', 500_00);
    expect(balanceOf(l, 'cash')).toBe(1_200_00);
    expect(balanceOf(l, 'savings')).toBe(500_00);
    expect(balanceOf(l, 'broker')).toBe(0);
    expect(flowOf(l, 'salary')).toBe(2_500_00);
    expect(flowOf(l, 'rent')).toBe(-900_00);
    expect(netWorth(l)).toBe(1_700_00);
    expect(isBalanced(l)).toBe(true);
  });

  it('conserves money: net worth changes only by external flows (property)', () => {
    fc.assert(fc.property(fc.array(op, { maxLength: 60 }), (ops) => {
      const start = openLedger({ cash: 1_000_00, mortgage: -200_000_00 });
      const end = ops.reduce(apply, start);
      expect(isBalanced(end)).toBe(true);
      expect(isLedger(end)).toBe(true);
      const flows = Object.values(end.flows).reduce((a, b) => a + b, 0);
      expect(netWorth(end) - netWorth(start)).toBe(flows);
    }));
  });

  it('transfers never change net worth and never mutate the input', () => {
    fc.assert(fc.property(fc.constantFrom(...accounts), fc.constantFrom(...accounts), cents, (a, b, c) => {
      const l = openLedger({ cash: 5_00 });
      const snapshot = JSON.stringify(l);
      const next = transfer(l, a, b, c);
      expect(netWorth(next)).toBe(netWorth(l));
      expect(JSON.stringify(l)).toBe(snapshot);
    }));
  });

  it('rejects fractional cents and bad ids (logic errors)', () => {
    const l = openLedger();
    expect(() => book(l, 'cash', 1.5, 'salary')).toThrow(RangeError);
    expect(() => book(l, 'Cash', 1, 'salary')).toThrow(RangeError);
    expect(() => book(l, 'cash', 1, '__proto__')).toThrow(RangeError);
    expect(() => transfer(l, 'cash', 'savings', Number.NaN)).toThrow(RangeError);
    expect(() => openLedger({ cash: 0.1 })).toThrow(RangeError);
    expect(() => book(openLedger({ cash: Number.MAX_SAFE_INTEGER }), 'cash', 1, 'salary')).toThrow(RangeError);
  });

  it('validates untrusted ledgers without throwing', () => {
    expect(isLedger(openLedger({ cash: 1 }))).toBe(true);
    expect(isLedger({ balances: { cash: 1 }, flows: {}, opening: 0 })).toBe(false); // unbalanced
    expect(isLedger({ balances: { cash: 1.5 }, flows: {}, opening: 1.5 })).toBe(false);
    expect(isLedger({ balances: [], flows: {}, opening: 0 })).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => { isLedger(v); }));
  });
});
