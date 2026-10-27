import { describe, expect, it } from 'vitest';
import { CHALLENGES, DIFFICULTIES, preValue, runChallenge, seriesOf, type Question } from '../src/challenges';
import { cldOf } from '../src/cld';
import { GOALS } from '../src/goals';
import { habitatDef } from '../src/habitats';
import { applyAction, cloneSim } from '../src/model';
import { PRESETS } from '../src/presets';
import { levelBand, sketchScore, sketchWeeks } from '../src/score';
import { classify } from '../src/shape';
import { edgeEffect } from './sensitivity';

/** 1, 2 or 5 × 10^k thousand u. */
const roundScale = (v: number) => {
  let x = v / 1000;
  while (x >= 10) x /= 10;
  return v % 1000 === 0 && [1, 2, 5].includes(Math.round(x * 1e9) / 1e9);
};

describe('prediction challenges against the model (Appendix B.1)', () => {
  for (const c of CHALLENGES) {
    it(`${c.id}: every question's stated answer holds and is unambiguous`, () => {
      const run = runChallenge(c);
      expect(run.samples.length).toBe(c.horizon + 1);
      const questions = new Set<Question>(DIFFICULTIES.flatMap((d) => c.questions[d]));
      for (const q of questions) {
        const v = seriesOf(c, run.samples, q.species);
        expect(v[0], `${c.id} ${q.species}: samples[0] is the value before the change`).toBe(preValue(c, q.species));
        if (q.kind === 'level') {
          expect(levelBand(v[0]!, v[q.week]!), `${c.id} ${q.species} week ${q.week}`).toBe(q.expect);
          // Fairness: clear of the band edges.
          if (v[0] === 0) expect(v[q.week]!).toBeGreaterThanOrEqual(q.expect === 2 ? 1500 : 0);
          else if (q.expect === 1) expect(Math.abs(100 * v[q.week]! - 100 * v[0]!)).toBeLessThanOrEqual(5 * v[0]!);
          else expect(q.expect === 0 ? 100 * v[q.week]! <= 75 * v[0]! : 100 * v[q.week]! >= 125 * v[0]!, `${c.id} ${q.species} ratio ${v[q.week]! / v[0]!}`).toBe(true);
        } else if (q.kind === 'shape') {
          for (const p of [15, 20, 25]) expect(classify(v, p), `${c.id} ${q.species} p=${p}`).toBe(q.expect);
          expect(q.options).toContain(q.expect);
          expect(new Set(q.options).size).toBe(q.options.length);
        } else {
          expect(classify(v), `${c.id} sketch ${q.species}`).toBe(q.expect);
          const top = Math.max(...v);
          expect(q.max, `${c.id} sketch scale`).toBeGreaterThanOrEqual(1.5 * top);
          expect(q.max).toBeGreaterThanOrEqual(2 * v[0]!);
          expect(roundScale(q.max), `${c.id} ${q.max}`).toBe(true);
          // Fair marks: the model's own values at the handles match; an untouched (flat) sketch never does.
          expect(sketchScore(sketchWeeks(c.horizon).map((w) => v[w]!), v, c.horizon, q.max), `${c.id} perfect sketch`).toBe(3);
          expect(sketchScore(sketchWeeks(c.horizon).map(() => v[0]!), v, c.horizon, q.max), `${c.id} flat sketch`).toBeLessThanOrEqual(1);
        }
      }
    });
  }
});

describe('causal loop diagrams against the model (§ 12.2 b)', () => {
  const cases = [
    ...CHALLENGES.map((c) => ({ id: c.id, habitat: c.habitat, preset: c.preset, actions: c.actions.filter((a) => a.week === 0) })),
    ...GOALS.map((g) => ({ id: g.id, habitat: g.habitat, preset: g.preset, actions: g.script.filter((a) => a.week === 0) }))
  ];
  for (const k of cases) {
    it(`${k.id}: every edge sign matches the model's sensitivity`, () => {
      const before = cloneSim(PRESETS[k.preset].sim);
      const after = cloneSim(before);
      for (const a of k.actions) applyAction(after, habitatDef(k.habitat), a);
      const cld = cldOf(k.id)!;
      for (const e of cld.edges) {
        // At the start (the preset, before the change) the model moves the target the stated way; after the change it
        // never moves it the other way (it may not move at all, e.g. when sprayed aphids hide out of reach).
        expect(edgeEffect(before, k.habitat, e), `${k.id}: ${e.from} → ${e.to}`).toBe(e.sign);
        expect(edgeEffect(after, k.habitat, e), `${k.id} after the change: ${e.from} → ${e.to}`).not.toBe(-e.sign);
      }
    });
  }
});
