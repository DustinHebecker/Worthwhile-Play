import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { habitatDef, speciesIndex } from '../src/habitats';
import { balanced, simulate } from '../src/model';
import { PRESETS } from '../src/presets';
import { PRESET_IDS, buildPresets, presetsSource } from '../src/spinup';

describe('stored presets (§ 9)', () => {
  it('every stored preset equals its spin-up (UPDATE_PRESETS=1 rewrites src/presets.ts)', () => {
    const built = buildPresets();
    const source = presetsSource(built);
    if (process.env.UPDATE_PRESETS === '1') writeFileSync(fileURLToPath(new URL('../src/presets.ts', import.meta.url)), source);
    for (const id of PRESET_IDS) {
      expect(PRESETS[id], `${id} differs from its spin-up; run with UPDATE_PRESETS=1 and record the recalibration (new model id)`).toEqual(built[id]);
      expect(balanced(PRESETS[id].sim)).toBe(true);
      expect(PRESETS[id].sim.week).toBe(0);
    }
  }, 20_000);

  it('the lively presets hold their species above 1,500 u and are steady over 104 further weeks', () => {
    const want = { 'pond.lively': ['algae', 'pondweed', 'fleas', 'snails', 'minnows'], 'meadow.lively': ['grass', 'flowers', 'clover', 'aphids', 'ladybirds', 'rabbits', 'foxes', 'worms'] } as const;
    for (const [id, species] of Object.entries(want) as [keyof typeof want, readonly string[]][]) {
      const p = PRESETS[id];
      const hab = habitatDef(p.habitat);
      const run = simulate(p.sim, p.habitat, [], 104);
      for (const s of species) {
        const i = speciesIndex(hab, s);
        const v = run.samples.map((x) => x[i]!);
        const mean = v.reduce((a, b) => a + b, 0) / v.length;
        expect(v[0], `${id} ${s}`).toBeGreaterThan(1500);
        expect((Math.max(...v) - Math.min(...v)) / mean, `${id} ${s} swing`).toBeLessThan(0.25);
      }
    }
  });

  it('the history before week 0 has 8 weekly samples (none for the bare starts)', () => {
    for (const id of PRESET_IDS) expect(PRESETS[id].history.length, id).toBe(id.endsWith('.bare') ? 0 : 8);
  });
});
