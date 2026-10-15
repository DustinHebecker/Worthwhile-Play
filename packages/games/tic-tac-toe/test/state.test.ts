import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isValidState, migrateState } from '../src/state';
import { createRound } from '../src/rules';
import { createNestedRound } from '../src/nested';
import { createOcRound } from '../src/order-chaos';
import { readSetup } from '../src/view';

describe('state of all variants', () => {
  it('accepts a fresh round of each variant and rejects unknown variants', () => {
    const base = { seed: 3, difficulty: 'easy', opponent: 'human' } as const;
    expect(isValidState(createRound({ ...base, starter: 'human' }))).toBe(true);
    expect(isValidState(createNestedRound({ ...base, starter: 'human' }))).toBe(true);
    expect(isValidState(createOcRound({ ...base, role: 'chaos' }))).toBe(true);
    expect(isValidState({ ...createRound({ ...base, starter: 'human' }), variant: 'ultimate' })).toBe(false);
    expect(isValidState({ ...createOcRound({ ...base, role: 'order' }), variant: 'classic' })).toBe(false);
    expect(isValidState(null)).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.anything(), (v) => void expect(() => isValidState(v)).not.toThrow()), { numRuns: 300 });
    fc.assert(
      fc.property(fc.constantFrom('classic', 'nested', 'order-chaos'), fc.anything(), (variant, moves) => {
        expect(() => isValidState({ variant, seed: 1, difficulty: 'easy', opponent: 'human', starter: 'human', role: 'order', moves, rng: 1 })).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });
});

describe('migration of version 1 saves', () => {
  const v1 = { seed: 5, difficulty: 'perfect', opponent: 'computer', starter: 'human', moves: [4, 0], rng: 77 };

  it('turns a classic save without a variant into the classic variant with the same moves', () => {
    const migrated = migrateState(v1, 1);
    expect(migrated).toEqual({ variant: 'classic', ...v1 });
    expect(isValidState(migrated)).toBe(true);
  });

  it('refuses invalid or unexpected input', () => {
    expect(migrateState({ ...v1, moves: [4] }, 1)).toBeUndefined();
    expect(migrateState({ ...v1, variant: 'classic' }, 1)).toBeUndefined();
    expect(migrateState(v1, 2)).toBeUndefined();
    expect(migrateState('junk', 1)).toBeUndefined();
    fc.assert(fc.property(fc.anything(), (v) => void expect(() => migrateState(v, 1)).not.toThrow()), { numRuns: 200 });
  });
});

describe('remembered options', () => {
  it('reads valid fields and ignores the rest', () => {
    expect(readSetup(undefined)).toEqual({ variant: 'classic', opponent: 'computer', starter: 'human', role: 'order' });
    expect(readSetup({ variant: 'nested', opponent: 'human', starter: 'computer', role: 'chaos' })).toEqual({
      variant: 'nested',
      opponent: 'human',
      starter: 'computer',
      role: 'chaos'
    });
    expect(readSetup({ variant: 'ultimate', opponent: 7, role: 'chaos' })).toEqual({ variant: 'classic', opponent: 'computer', starter: 'human', role: 'chaos' });
    expect(readSetup('nested')).toEqual(readSetup(undefined));
  });
});
