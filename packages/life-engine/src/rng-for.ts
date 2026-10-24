import { createRng } from '@wp/game-core';
import type { RngFor } from './sim';

/**
 * Provisional keyed randomness: one independent seeded Rng per (seed, month, stream), from an
 * FNV-1a hash of the key (integer operations only). Replaced by `keyedRng` from @wp/finance-math
 * (ADR 0020) once that package is merged; saves keep only the seed, so the switch changes future
 * draws of new lives, not stored states.
 */
export function keyedRngFor(seed: number): RngFor {
  return (month, stream) => {
    let h = 0x811c9dc5;
    const key = `${seed >>> 0}|${month}|${stream}`;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return createRng(h);
  };
}
