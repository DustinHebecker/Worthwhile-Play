/**
 * Seeded, serializable pseudo-random number generator (mulberry32).
 *
 * All game logic must draw randomness from an `Rng` so that every game state is
 * reproducible from `seed + actions`. The full generator state is a single
 * unsigned 32-bit integer, which makes it trivial to persist inside a save.
 */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max] (both inclusive). */
  int(min: number, max: number): number;
  /** Returns one element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** Returns a new array with the elements in random order (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** Current internal state; pass to `createRngFromState` to continue the sequence. */
  state(): number;
}

const UINT32 = 0x1_0000_0000;

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) throw new RangeError('Seed must be a finite number.');
  return Math.trunc(seed) >>> 0;
}

export function createRng(seed: number): Rng {
  return createRngFromState(normalizeSeed(seed));
}

export function createRngFromState(initialState: number): Rng {
  let s = normalizeSeed(initialState);

  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max)) throw new RangeError('Bounds must be integers.');
    if (max < min) throw new RangeError('max must be >= min.');
    return min + Math.floor(next() * (max - min + 1));
  };

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new RangeError('Cannot pick from an empty array.');
      return items[int(0, items.length - 1)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = int(0, i);
        [result[i], result[j]] = [result[j] as T, result[i] as T];
      }
      return result;
    },
    state: () => s
  };
}

/** Stable 32-bit FNV-1a hash, e.g. to derive a seed from a shareable string. */
export function seedFromString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * The only sanctioned source of entropy: used by the app shell to pick a seed
 * for a new game. Game logic itself never calls this.
 */
export function randomSeed(source: Pick<Crypto, 'getRandomValues'> = globalThis.crypto): number {
  const buffer = new Uint32Array(1);
  source.getRandomValues(buffer);
  return buffer[0] as number;
}
