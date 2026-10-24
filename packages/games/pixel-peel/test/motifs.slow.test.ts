import { describe, expect, it } from 'vitest';
import { decodeRows } from '../src/art/bake';
import { rasteriseReport, type Tier } from '../src/art/raster';
import { ART_DIFFICULTIES, widthFor } from '../src/art/sizes';
import { BAKED } from '../src/motifs/baked';
import { MOTIFS } from '../src/motifs/index';

/**
 * The long part of the motif tests (ADR 0021: `*.slow.test.ts` runs in `pnpm test` and CI, not under Stryker): every
 * motif is rasterised again at every difficulty (supersampled, 50–400 ms each) and must equal its baked picture,
 * which motifs.test.ts checks against the authoring rules. So the vector motif stays the source of truth.
 */
const TIERS: Readonly<Record<(typeof ART_DIFFICULTIES)[number], Tier>> = { easy: 1, medium: 2, hard: 3 };

for (const motif of MOTIFS) {
  describe(`motif ${motif.id}`, () => {
    ART_DIFFICULTIES.forEach((d, k) => {
      const w = widthFor(motif, d);
      it(`${d} at ${w} cells: the baked picture equals the rasteriser; nothing merged away, no orphans, little despeckle`, () => {
        const r = rasteriseReport(motif, w, TIERS[d]);
        expect(decodeRows(BAKED[motif.id]![k]!), 'baked rows equal the rasteriser (run scripts/render-motifs.ts --bake)').toEqual(r.picture.rows);
        expect(r.mergedForSize).toEqual([]);
        expect(r.orphans).toEqual([]);
        expect(r.despeckled / (r.picture.w * r.picture.h)).toBeLessThanOrEqual(0.02);
      });
    });
  });
}
