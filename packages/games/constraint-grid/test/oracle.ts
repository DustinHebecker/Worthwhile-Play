/**
 * Independent brute-force oracle for Constraint Grid. Shares no code with `src/rules.ts`:
 * it enumerates every permutation for each category (backtracking category by category) and
 * evaluates each clue literally on the complete assignment of the categories it mentions.
 * Slow but obviously correct; used only in tests. Category 0 is the people themselves and
 * category 1 the floors (0 = lowest), as documented for the save format.
 */

export interface OracleRef {
  cat: number;
  item: number;
}

export interface OracleClue {
  type: string;
  a: OracleRef;
  b: OracleRef;
  c?: OracleRef;
}

const FLOORS = 1;

/** All permutations of 0..n-1 (recursive, lexicographic). */
export function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (const rest of permutations(n - 1)) {
    for (let at = 0; at <= rest.length; at++) out.push([...rest.slice(0, at), n - 1, ...rest.slice(at)]);
  }
  return out.sort((x, y) => x.join() < y.join() ? -1 : 1);
}

/** `assignment[c][p]` = item of category c held by person p (category 0 ignored). */
function personWith(assignment: readonly (readonly number[])[], ref: OracleRef): number {
  if (ref.cat === 0) return ref.item;
  return (assignment[ref.cat] as readonly number[]).indexOf(ref.item);
}

/** Literal meaning of each clue type. */
export function oracleHolds(clue: OracleClue, assignment: readonly (readonly number[])[]): boolean {
  const pa = personWith(assignment, clue.a);
  const pb = personWith(assignment, clue.b);
  const floor = (p: number) => (assignment[FLOORS] as readonly number[])[p] as number;
  switch (clue.type) {
    case 'same':
      return pa === pb;
    case 'notSame':
      return pa !== pb;
    case 'eitherOr':
      return clue.c !== undefined && (pa === pb || pa === personWith(assignment, clue.c));
    case 'directlyAbove':
      return floor(pa) - floor(pb) === 1;
    case 'above':
      return floor(pa) > floor(pb);
    case 'nextTo':
      return floor(pa) - floor(pb) === 1 || floor(pb) - floor(pa) === 1;
    default:
      throw new Error(`unknown clue type ${clue.type}`);
  }
}

const mentioned = (clue: OracleClue): number[] => {
  const cats = [clue.a.cat, clue.b.cat];
  if (clue.c) cats.push(clue.c.cat);
  if (clue.type === 'directlyAbove' || clue.type === 'above' || clue.type === 'nextTo') cats.push(FLOORS);
  return cats;
};

/** All complete assignments satisfying every clue (stops after `limit`). */
export function oracleSolutions(categories: number, size: number, clues: readonly OracleClue[], limit = 2): number[][][] {
  const perms = permutations(size);
  const assignment: number[][] = [Array.from({ length: size }, (_, p) => p)];
  const found: number[][][] = [];
  const step = (cat: number) => {
    if (found.length >= limit) return;
    if (cat === categories) {
      found.push(assignment.map((row) => [...row]));
      return;
    }
    for (const perm of perms) {
      assignment[cat] = perm;
      const ready = clues.filter((clue) => Math.max(...mentioned(clue)) === cat);
      if (ready.every((clue) => oracleHolds(clue, assignment))) step(cat + 1);
      if (found.length >= limit) return;
    }
    assignment.length = cat;
  };
  step(1);
  return found;
}

export const oracleCount = (categories: number, size: number, clues: readonly OracleClue[], limit = 2): number =>
  oracleSolutions(categories, size, clues, limit).length;
