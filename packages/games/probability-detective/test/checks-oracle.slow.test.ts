import { describe, expect, it } from 'vitest';
import { analyseChecks, frac, type CheckParams } from '../src/rules';
import { generateChecks, eligibleChecks } from '../src/generate';
import { DIFFICULTIES } from '../src/templates';
import { seedFromString } from '@wp/game-core';

/**
 * Independent population expectimax (design § 19.3): an explicit integer population of size priorDen · Π den, split
 * recursively by each check's result; values are integer point sums over the population, compared exactly.
 */
function populationValue(p: CheckParams): { sum: bigint; size: bigint } {
  // Each member: its hypothesis and, per check, a slot in 0..den−1 (shows yes when slot < num[h]).
  type Member = { h: number; slots: number[] };
  const members: Member[] = [];
  const dens = p.checks.map((c) => c.den);
  const total = dens.reduce((a, b) => a * b, 1);
  for (let h = 0; h < 2; h++)
    for (let k = 0; k < p.prior[h]!; k++)
      for (let x = 0; x < total; x++) {
        let rest = x;
        members.push({ h, slots: dens.map((d) => {
          const s = rest % d;
          rest = Math.floor(rest / d);
          return s;
        }) });
      }
  const best = (group: Member[], used: Set<number>): bigint => {
    let v: bigint | null = null;
    for (const o of p.options) {
      const s = group.reduce((a, m) => a + BigInt(o.pay[m.h]!), 0n);
      if (v === null || s > v) v = s;
    }
    for (let c = 0; c < p.checks.length; c++) {
      if (used.has(c)) continue;
      const yes = group.filter((m) => m.slots[c]! < p.checks[c]!.num[m.h]!);
      const no = group.filter((m) => !(m.slots[c]! < p.checks[c]!.num[m.h]!));
      const next = new Set(used).add(c);
      const s = -BigInt(p.checks[c]!.cost) * BigInt(group.length) + (yes.length ? best(yes, next) : 0n) + (no.length ? best(no, next) : 0n);
      if (s > v!) v = s;
    }
    return v!;
  };
  return { sum: best(members, new Set()), size: BigInt(members.length) };
}

describe('checks analysis against a population expectimax (slow)', () => {
  it('V(∅) equals the population value exactly on generated easy cases', () => {
    let n = 0;
    for (const t of eligibleChecks('easy'))
      for (let i = 0; i < 25; i++) {
        const c = generateChecks(seedFromString(`oracle:${t.id}:${i}`), t, 'easy');
        const p: CheckParams = { priorDen: c.priorDen, prior: c.prior, checks: c.checks, options: c.options };
        const { sum, size } = populationValue(p);
        expect(analyseChecks(p).value([])).toEqual(frac(sum, size));
        n++;
      }
    expect(n).toBe(150);
    expect(DIFFICULTIES).toContain('easy');
  });
});
