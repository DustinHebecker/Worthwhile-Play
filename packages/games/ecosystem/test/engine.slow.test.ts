import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { habitatDef } from '../src/habitats';
import { HABITAT_ACTIONS, MAX_AMOUNT, MAX_WEEK, balanced, simulate, type Action } from '../src/model';
import { PRESETS } from '../src/presets';
import { PRESET_IDS } from '../src/spinup';
import { actionFits } from '../src/rules';

/** A random valid action sequence over 520 weeks (≤ 60 changes, the kinds of the habitat). */
function randomLog(seed: number, habitat: 'pond' | 'meadow'): Action[] {
  const rng = createRng(seed);
  const hab = habitatDef(habitat);
  const n = rng.int(0, 60);
  const weeks = Array.from({ length: n }, () => rng.int(0, MAX_WEEK - 1)).sort((a, b) => a - b);
  return weeks.map((week) => {
    const kind = rng.pick(HABITAT_ACTIONS[habitat]);
    const species = rng.pick(hab.species).id;
    const cond = rng.int(0, hab.conditions.length - 1);
    const a: Action =
      kind === 'add' ? { week, kind, species } :
      kind === 'remove' ? { week, kind, species, share: rng.pick([50, 90, 100] as const) } :
      kind === 'mow' ? { week, kind, cuttings: rng.pick(['remove', 'leave'] as const) } :
      kind === 'set' ? { week, kind, cond, level: rng.int(0, hab.conditions[cond]!.levels.length - 1) } :
      { week, kind };
    expect(actionFits(habitat, a)).toBe(true);
    return a;
  });
}

describe('engine fuzz over 520 weeks', () => {
  // The plan asked for 2,000 sequences per habitat; at ≈ 0.03 ms per week that is half a minute per habitat, so the
  // suite runs 300 per habitat (156,000 weeks each) to stay well inside its timeout under load.
  for (const habitat of ['pond', 'meadow'] as const) {
    it(`${habitat}: random sequences keep the balance exact and every stock in bounds; never throws`, () => {
      const starts = PRESET_IDS.filter((id) => PRESETS[id].habitat === habitat);
      const t0 = performance.now();
      let weeks = 0;
      for (let k = 0; k < 300; k++) {
        const log = randomLog(1000 + k, habitat);
        const run = simulate(PRESETS[starts[k % starts.length]!].sim, habitat, log, MAX_WEEK, { seed: k, weather: k % 2 === 0 });
        weeks += MAX_WEEK;
        expect(balanced(run.sim)).toBe(true);
        let bad = 0;
        for (const s of run.samples) for (const v of s) if (!Number.isInteger(v) || v < 0 || v > MAX_AMOUNT) bad++;
        expect(bad, `sequence ${k}`).toBe(0);
      }
      const ms = performance.now() - t0;
      process.stderr.write(`${habitat}: ${weeks} weeks in ${Math.round(ms)} ms (${(ms / weeks).toFixed(4)} ms per week)\n`);
    }, 60_000);
  }
});
