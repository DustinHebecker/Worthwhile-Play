/**
 * Exact arithmetic for Probability Detective (design § 9): BigInt fractions and exact weighted draws. Pure; shared by
 * the rules, the generators and the trap templates.
 */
import type { Rng } from '@wp/game-core';

/* ---------- Exact fractions (BigInt, always reduced, d > 0) ---------- */

export interface Frac {
  readonly n: bigint;
  readonly d: bigint;
}

const babs = (x: bigint): bigint => (x < 0n ? -x : x);
export const gcd = (a: bigint, b: bigint): bigint => {
  let x = babs(a);
  let y = babs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

export function frac(n: bigint | number, d: bigint | number = 1n): Frac {
  let nn = BigInt(n);
  let dd = BigInt(d);
  if (dd === 0n) throw new RangeError('zero denominator');
  if (dd < 0n) {
    nn = -nn;
    dd = -dd;
  }
  const g = gcd(nn, dd) || 1n;
  return { n: nn / g, d: dd / g };
}

export const add = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac): Frac => frac(a.n * b.d, a.d * b.n);
export const cmp = (a: Frac, b: Frac): number => {
  const x = a.n * b.d - b.n * a.d;
  return x < 0n ? -1 : x > 0n ? 1 : 0;
};
export const toNumber = (a: Frac): number => Number(a.n) / Number(a.d);
export const ZERO = frac(0);
export const ONE = frac(1);

/** Weights → exact probabilities summing to exactly 1 (all-zero weights give an even split). */
export function normalise(weights: readonly (bigint | number)[]): Frac[] {
  const w = weights.map((x) => BigInt(x));
  const total = w.reduce((s, x) => s + x, 0n);
  if (total === 0n) return w.map(() => frac(1, w.length));
  return w.map((x) => frac(x, total));
}

/* ---------- Exact draws (design § 9.2) ---------- */

const TWO32 = 0x1_0000_0000;
const word = (rng: Rng): number => Math.floor(rng.next() * TWO32) >>> 0;

/** A uniform integer in [0, total) by rejection sampling on 32-bit words (53 bits above 2³²). */
export function uniformBelow(total: number, rng: Rng): number {
  if (!Number.isSafeInteger(total) || total < 1) throw new RangeError('total must be a positive safe integer');
  if (total <= TWO32) {
    const limit = Math.floor(TWO32 / total) * total;
    for (;;) {
      const x = word(rng);
      if (x < limit) return x % total;
    }
  }
  const span = 2 ** 53;
  const limit = Math.floor(span / total) * total;
  for (;;) {
    const x = (word(rng) & 0x1f_ffff) * TWO32 + word(rng);
    if (x < limit) return x % total;
  }
}

/** Index i with probability weights[i] / Σ weights, exactly. Weights are non-negative integers, not all 0. */
export function drawIndex(weights: readonly number[], rng: Rng): number {
  const total = weights.reduce((s, x) => s + x, 0);
  const u = uniformBelow(total, rng);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (u < acc) return i;
  }
  return weights.length - 1;
}
