import { describe, expect, it } from 'vitest';
import { habitatDef } from '../src/habitats';
import { MAX_AMOUNT, MAX_TOTAL, balanced, total } from '../src/model';
import { STARTS, choiceOf, continueFromHere, exploreApply, exploreRun, isEcoState, newGameState, notebookRun, type ExploreState } from '../src/rules';

/**
 * Design § 25: explore "continue from here" with heavy input keeps growing (towards an equilibrium near 14 M u total
 * for the lively pond). This checks a long session: 50 × (26 weeks, then "continue from here") = 1,300 weeks, with
 * the input at its highest level. The total must stay below `MAX_AMOUNT`, every stock non-negative, integer and far
 * below 2^53, the balance exact, and every saved state valid (a save over the cap would be rejected on restore).
 *
 * Known beyond this horizon (reported, model unchanged): the simple and bare ponds at heavy runoff and still water
 * have no equilibrium; their dissolved nutrients grow linearly and the total passes `MAX_AMOUNT` after about
 * 3,100 (simple) and 5,200 (bare) weeks of continuing.
 */
const CYCLES = 50;
const WEEKS = 26;

const SCENARIOS = [
  ...STARTS.flatMap((start) => [false, true].map((weather) => ({ habitat: 'pond' as const, start, weather, input: 'runoff', level: 'heavy' }))),
  ...STARTS.map((start) => ({ habitat: 'meadow' as const, start, weather: false, input: 'fertiliser', level: 'lots' }))
];

describe('"continue from here" with the heaviest input stays bounded', () => {
  for (const sc of SCENARIOS) {
    it(`${sc.habitat}/${sc.start}${sc.weather ? '/weather' : ''}: ${CYCLES} × ${WEEKS} weeks at ${sc.input} ${sc.level}`, () => {
      const hab = habitatDef(sc.habitat);
      const cond = hab.conditions.findIndex((c) => c.id === sc.input);
      const level = hab.conditions[cond]!.levels.indexOf(sc.level);
      expect(cond).toBeGreaterThanOrEqual(0);
      expect(level).toBe(hab.conditions[cond]!.levels.length - 1);
      const start = newGameState(5, choiceOf(undefined, { mode: 'explore', habitat: sc.habitat, start: sc.start, weather: sc.weather })) as ExploreState;
      let state = exploreApply(start, { week: 0, kind: 'set', cond, level });
      expect(state.notebook.log).toHaveLength(1);
      let maxTotal = 0;
      let maxStock = 0;
      for (let k = 0; k < CYCLES; k++) {
        state = exploreRun(state, WEEKS).state;
        const run = notebookRun(state);
        expect(run.sim.cond[cond]).toBe(level);
        for (const smp of run.samples) {
          let sum = 0;
          for (let i = 0; i < smp.length; i++) {
            const v = smp[i]!;
            expect(Number.isSafeInteger(v) && v >= 0, `cycle ${k}: value ${v}`).toBe(true);
            if (i < smp.length - 1) sum += v; // species, nutrients and dead matter (not water)
            maxStock = Math.max(maxStock, v);
          }
          maxTotal = Math.max(maxTotal, sum);
        }
        expect(total(run.sim)).toBeLessThan(MAX_AMOUNT);
        expect(balanced(run.sim)).toBe(true);
        expect(run.sim.imp).toBeLessThanOrEqual(MAX_TOTAL);
        expect(run.sim.exp).toBeLessThanOrEqual(MAX_TOTAL);
        state = continueFromHere(state);
        expect(isEcoState(state), `cycle ${k}: saved state valid`).toBe(true);
      }
      expect(maxTotal).toBeLessThan(MAX_AMOUNT);
      expect(maxStock).toBeLessThan(MAX_AMOUNT);
      process.stderr.write(`${sc.habitat}/${sc.start}${sc.weather ? '/weather' : ''}: max total ${maxTotal} u, max stock ${maxStock} u over ${CYCLES * WEEKS} weeks\n`);
    }, 60_000);
  }
});
