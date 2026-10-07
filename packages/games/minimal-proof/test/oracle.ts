/**
 * Brute-force reference for the tests. It shares no code with `src/rules.ts`: it tries every
 * sequence of rule applications (iterative deepening, no memoisation) and reports the length
 * of the first sequence after which the target statement is known.
 */
export interface ORule {
  op: 'imp' | 'and' | 'or';
  premises: readonly number[];
  conclusion: number;
}

function usable(rule: ORule, known: readonly boolean[]): boolean {
  if (known[rule.conclusion]) return false;
  let count = 0;
  for (const p of rule.premises) if (known[p]) count++;
  return rule.op === 'or' ? count >= 1 : count === rule.premises.length;
}

/** Shortest number of applications that makes `target` known, or null if none within `bound`. */
export function oracleMinimal(atomCount: number, rules: readonly ORule[], facts: readonly number[], target: number, bound: number): number | null {
  const start: boolean[] = new Array<boolean>(atomCount).fill(false);
  for (const f of facts) start[f] = true;
  if (start[target]) return 0;
  const search = (known: boolean[], left: number): boolean => {
    if (left === 0) return false;
    for (const rule of rules) {
      if (!usable(rule, known)) continue;
      if (rule.conclusion === target) return true;
      const next = known.slice();
      next[rule.conclusion] = true;
      if (search(next, left - 1)) return true;
    }
    return false;
  };
  for (let depth = 1; depth <= bound; depth++) if (search(start, depth)) return depth;
  return null;
}

/** Every statement reachable by some sequence (plain repeated sweeps). */
export function oracleReachable(atomCount: number, rules: readonly ORule[], facts: readonly number[]): boolean[] {
  const known: boolean[] = new Array<boolean>(atomCount).fill(false);
  for (const f of facts) known[f] = true;
  for (let sweep = 0; sweep <= rules.length; sweep++) for (const rule of rules) if (usable(rule, known)) known[rule.conclusion] = true;
  return known;
}
