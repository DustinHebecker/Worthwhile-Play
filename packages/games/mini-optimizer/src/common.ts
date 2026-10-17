/** Shared vocabulary of the three problem types (no DOM, no state). */
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Attempts a generator makes before it falls back to its hand-made instance. */
export const MAX_ATTEMPTS = 200;

/** Labels of towns and customers: A, B, C … (names, the same in every language, like map labels). */
export const letter = (i: number): string => String.fromCharCode(65 + i);

/** Union–find over 0 … n − 1 (path halving); `find` returns the group's representative. */
export function unionFind(n: number) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (v: number): number => {
    let x = v;
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  };
  const union = (a: number, b: number): boolean => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[ra] = rb;
    return true;
  };
  return { find, union };
}

/** Same values in the same order (plans are small arrays of integers). */
export const sameNumbers = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);
