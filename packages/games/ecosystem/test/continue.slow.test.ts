import { describe, expect, it } from 'vitest';
import { habitatDef, type Habitat } from '../src/habitats';
import { MAX_AMOUNT, MAX_TOTAL, MAX_WEEK, balanced, total, type Action } from '../src/model';
import { STARTS, choiceOf, continueFromHere, exploreApply, exploreRun, isEcoState, newGameState, notebookRun, type ExploreState, type StartKind } from '../src/rules';

/**
 * Long sessions in explore (design § 7.8, § 25): "continue from here" again and again with the heaviest input, for
 * 200 model years (10,400 weeks). Every weekly sample must keep each stock and the total at or below `MAX_AMOUNT`
 * (non-negative safe integers), the balances exact, the bookkeeping below `MAX_TOTAL`, and every saved state valid —
 * a save over the cap would be rejected on restore, i.e. lost.
 *
 * Two horizons: 50 × 26 weeks (the button pressed after every half year) and 20 × 520 weeks (a full notebook each
 * time) up to week 10,400. Besides every start with and without weather, adversarial notebooks add every species of
 * the habitat at each continue (the pond's blue-green algae are not light-limited) or shade the pond.
 */
const YEARS_200 = 20 * MAX_WEEK;

interface Scenario {
  habitat: Habitat;
  start: StartKind;
  weather: boolean;
  /** Extra changes at week 0 of every notebook (besides the heaviest input). */
  extra: 'none' | 'all-species' | 'shaded';
}

const SCENARIOS: Scenario[] = [
  ...(['pond', 'meadow'] as const).flatMap((habitat) => STARTS.flatMap((start) => [false, true].map((weather): Scenario => ({ habitat, start, weather, extra: 'none' })))),
  { habitat: 'pond', start: 'bare', weather: true, extra: 'all-species' },
  { habitat: 'pond', start: 'simple', weather: false, extra: 'shaded' },
  { habitat: 'meadow', start: 'bare', weather: true, extra: 'all-species' }
];

const name = (sc: Scenario) => `${sc.habitat}/${sc.start}${sc.weather ? '/weather' : ''}${sc.extra === 'none' ? '' : `/${sc.extra}`}`;

/** The changes made at week 0 of each notebook: the heaviest input, and the scenario's extra changes. */
function changes(sc: Scenario): Action[] {
  const hab = habitatDef(sc.habitat);
  const inputs = hab.conditions[hab.inputCond]!;
  const out: Action[] = [{ week: 0, kind: 'set', cond: hab.inputCond, level: inputs.levels.length - 1 }];
  if (sc.extra === 'shaded') out.push({ week: 0, kind: 'set', cond: hab.lightCond, level: hab.conditions[hab.lightCond]!.levels.length - 1 });
  if (sc.extra === 'all-species') for (const sp of hab.species) out.push({ week: 0, kind: 'add', species: sp.id });
  return out;
}

function longSession(sc: Scenario, weeks: number, notebooks: number): { maxTotal: number; maxStock: number } {
  let state = newGameState(5, choiceOf(undefined, { mode: 'explore', habitat: sc.habitat, start: sc.start, weather: sc.weather })) as ExploreState;
  let maxTotal = 0;
  let maxStock = 0;
  for (let k = 0; k < notebooks; k++) {
    for (const a of changes(sc)) state = exploreApply(state, a);
    state = exploreRun(state, weeks).state;
    const run = notebookRun(state);
    expect(run.sim.week).toBe(weeks);
    let bad = 0;
    for (const smp of run.samples) {
      let sum = 0;
      for (let i = 0; i < smp.length; i++) {
        const v = smp[i]!;
        if (!Number.isSafeInteger(v) || v < 0 || v > MAX_AMOUNT) bad++;
        if (i < smp.length - 1) sum += v; // species, nutrients and dead matter (not water)
        maxStock = Math.max(maxStock, v);
      }
      maxTotal = Math.max(maxTotal, sum);
    }
    expect(bad, `${name(sc)}: notebook ${k + 1}, stocks out of range`).toBe(0);
    expect(maxTotal, `${name(sc)}: notebook ${k + 1}, total`).toBeLessThanOrEqual(MAX_AMOUNT);
    expect(total(run.sim)).toBeLessThanOrEqual(MAX_AMOUNT);
    expect(balanced(run.sim)).toBe(true);
    expect(run.sim.imp).toBeLessThanOrEqual(MAX_TOTAL);
    expect(run.sim.exp).toBeLessThanOrEqual(MAX_TOTAL);
    state = continueFromHere(state);
    expect(state.notebook.week).toBe(0);
    expect(isEcoState(state), `${name(sc)}: notebook ${k + 1}, saved state valid`).toBe(true);
  }
  return { maxTotal, maxStock };
}

describe('"continue from here" with the heaviest input stays within the bounds for 200 years', () => {
  for (const sc of SCENARIOS) {
    it(`${name(sc)}: 50 × 26 weeks, then 20 × 520 weeks`, () => {
      const half = longSession(sc, 26, 50);
      const full = longSession(sc, MAX_WEEK, YEARS_200 / MAX_WEEK);
      process.stderr.write(`${name(sc)}: max total ${half.maxTotal} / ${full.maxTotal} u, max stock ${half.maxStock} / ${full.maxStock} u\n`);
    }, 60_000);
  }
});
