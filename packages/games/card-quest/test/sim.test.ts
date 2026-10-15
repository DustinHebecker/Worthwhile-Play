import { describe, expect, it } from 'vitest';
import { isValidState } from '../src/rules';
import { selfPlay } from './harness';

describe('self-play', () => {
  it('finishes games with valid states', () => {
    const rounds: number[] = [];
    for (let seed = 1; seed <= 20; seed++) {
      const { state } = selfPlay(seed, { opponents: 1 + (seed % 5) });
      expect(isValidState(state)).toBe(true);
      expect(state.phase).toBe('over');
      rounds.push(state.round);
    }
    // Games end in a reasonable number of rounds (no stalemates).
    expect(Math.max(...rounds)).toBeLessThan(60);
  });
});
