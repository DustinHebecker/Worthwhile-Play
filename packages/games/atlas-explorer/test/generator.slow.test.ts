/**
 * Slow generator checks (design § 21.3): every setting generates valid rounds, fallbacks stay rare, and generation is
 * fast. Counts are sized to stay well under half of the 20 s timeout under parallel load.
 */
import { describe, expect, it } from 'vitest';
import { createRng, seedFromString } from '@wp/game-core';
import { decodeAtlas } from '../src/atlas';
import { drawMystery } from '../src/clues';
import { DIFFICULTIES, TEMPLATES, drawTemplate, templateAllowed } from '../src/compare';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import { createRound, isAtlasState } from '../src/rules';
import { drawRoute } from '../src/route';
import { AREAS, MODES } from '../src/state';

const atlas = decodeAtlas(ATLAS_DATA);

describe('generator (slow)', () => {
  it('generates valid rounds for every mode, region and difficulty, quickly', () => {
    let items = 0;
    const start = performance.now();
    for (const mode of MODES)
      for (const area of AREAS)
        for (const d of DIFFICULTIES)
          for (let seed = 0; seed < 20; seed++) {
            const s = createRound(seed * 2654435761, d, mode, area, atlas);
            items += s.items.length;
            expect(isAtlasState(JSON.parse(JSON.stringify(s)), atlas)).toBe(true);
          }
    expect((performance.now() - start) / items).toBeLessThan(10);
  });

  it('rarely needs another compare template (< 0.5 % where a template can be drawn at all)', () => {
    for (const area of AREAS)
      for (const d of DIFFICULTIES)
        for (const t of TEMPLATES) {
          if (!templateAllowed(t, d)) continue;
          let nulls = 0;
          const n = 300;
          for (let seed = 0; seed < n; seed++) if (!drawTemplate(createRng(seedFromString(`${t}:${area}:${d}:${seed}`)), t, { atlas, area, difficulty: d })) nulls++;
          // Some templates cannot exist in a region (no Arctic city in Africa): those are never drawn there.
          if (nulls < n) expect(nulls / n, `${t} ${area} ${d}`).toBeLessThan(0.005);
        }
  });

  it('finds a mystery country and a route in every region and difficulty (< 1 % redraws)', () => {
    for (const area of AREAS)
      for (const d of DIFFICULTIES) {
        let misses = 0;
        for (let seed = 0; seed < 80; seed++) if (!drawMystery(createRng(seedFromString(`m:${area}:${d}:${seed}`)), atlas, area, d, new Set())) misses++;
        expect(misses / 80, `mystery ${area} ${d}`).toBeLessThan(0.01);
        for (let seed = 0; seed < 20; seed++) expect(drawRoute(createRng(seed), atlas, area, d, new Set()), `route ${area} ${d}`).not.toBeNull();
      }
  });
});
