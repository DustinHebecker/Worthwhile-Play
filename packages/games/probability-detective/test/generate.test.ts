import { describe, expect, it } from 'vitest';
import { acceptChecks, checkPairs, eligibleChecks, eligibleTraps, generateChecks, generateTrap } from '../src/generate';
import { analyseChecks, checkParams, cmp, decideNow, frac, isPdState, myopicValue, sub } from '../src/rules';
import { CHECK_TEMPLATES, DIFFICULTIES, optionsFor } from '../src/templates';

describe('checks generator (design § 7.2, content doc § 4)', () => {
  it('produces cases within the grids that pass the filters of their level', () => {
    for (const d of DIFFICULTIES)
      for (const t of eligibleChecks(d))
        for (let seed = 0; seed < 4; seed++) {
          const c = generateChecks(seed, t, d);
          expect(c.checks).toHaveLength(d === 'easy' ? 3 : 4);
          expect(c.options.map((o) => o.id)).toEqual(optionsFor(t, d).map((o) => o.id));
          expect(new Set(c.checks.map((k) => k.id)).size).toBe(c.checks.length);
          expect(c.prior[0]! + c.prior[1]!).toBe(c.priorDen);
          if (d === 'easy') expect([3, 4, 6, 7]).toContain(c.prior[0]);
          for (const k of c.checks) {
            const spec = t.checks.find((s) => s.id === k.id)!;
            if (d === 'easy') expect(k.cost).toBe(Math.min(...spec.cost));
            else expect(spec.cost).toContain(k.cost);
            const [fav, oth] = spec.fav === 0 ? k.num : [k.num[1]!, k.num[0]!];
            expect(fav! - oth!).toBeGreaterThanOrEqual(0);
          }
          for (const [i, o] of c.options.entries()) {
            const spec = optionsFor(t, d)[i]!;
            expect(spec.a).toContain(o.pay[0]);
            if (spec.b === 'same') expect(o.pay[1]).toBe(o.pay[0]);
            else expect(spec.b).toContain(o.pay[1]);
          }
          if (c.attempts <= 200) expect(acceptChecks(checkParams(c) as never, c.checks.map((k) => t.checks.find((s) => s.id === k.id)!.fav), d)).toBe(true);
          const p = checkParams(c);
          expect(cmp(sub(analyseChecks(p).value([]), decideNow(p, [])), frac(1, 2))).toBeGreaterThanOrEqual(0);
          if (d !== 'easy') expect(p.checks.some((_, i) => myopicValue(p, i).n < 0n)).toBe(true);
        }
  });
  it('the filter never sees results or the truth', () => {
    const c = generateChecks(1, CHECK_TEMPLATES[0]!, 'medium');
    expect(() => acceptChecks(c as never, [1, 1, 1, 1], 'medium')).toThrow();
    expect(() => acceptChecks({ ...checkParams(c), truth: 0 } as never, [1, 1, 1, 1], 'medium')).toThrow();
  });
  it('is deterministic by seed', () => {
    for (const t of CHECK_TEMPLATES) expect(generateChecks(9, t, 'hard')).toEqual(generateChecks(9, t, 'hard'));
  });
  it('the narrowing of a check class holds (content doc § 4)', () => {
    for (const t of CHECK_TEMPLATES)
      for (const spec of t.checks)
        for (const d of DIFFICULTIES) {
          const pairs = checkPairs(spec, d);
          expect(pairs.length, `${t.id} ${spec.id} ${d}`).toBeGreaterThan(0);
          const scale = d === 'easy' ? 10 : 1;
          for (const [f, o] of pairs) {
            if (spec.favMin !== undefined) expect(f * scale).toBeGreaterThanOrEqual(spec.favMin);
            if (spec.diffMax !== undefined) expect((f - o) * scale).toBeLessThanOrEqual(spec.diffMax);
            if (spec.cls === 'folk') expect((f - o) * scale).toBeLessThanOrEqual(10);
          }
        }
  });
});

describe('trap generator', () => {
  it('fresh trap cases have one empty draft per question and validate inside a round', () => {
    for (const d of DIFFICULTIES)
      for (const t of eligibleTraps(d)) {
        const c = generateTrap(3, t, d);
        expect(c.drafts).toEqual(t.questions(c.params).map(() => null));
        expect(c.answers).toBeNull();
      }
    expect(isPdState({ v: 1, seed: 1, difficulty: 'easy', mode: 'traps', cases: eligibleTraps('easy').slice(0, 5).map((t) => generateTrap(1, t, 'easy')), index: 0, reported: false })).toBe(true);
  });
});
