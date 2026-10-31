import { describe, expect, it } from 'vitest';
import { decodeRows } from '../src/art/bake';
import { rasteriseReport } from '../src/art/raster';
import { ART_DIFFICULTIES, TIER_OF, widthFor } from '../src/art/sizes';
import { artOf, loadAllArt } from '../src/catalogue';
import { MOTIFS } from '../src/motifs/index';

/**
 * The long part of the motif tests (ADR 0021: `*.slow.test.ts` runs in `pnpm test` and CI's long job, not under
 * Stryker): every motif is rasterised again at every difficulty (supersampled, about 20–100 ms each) and must equal
 * its baked art, which motifs.test.ts checks against the authoring rules. So the vector motif stays the source of
 * truth.
 */
await loadAllArt();

for (const motif of MOTIFS) {
  describe(`motif ${motif.id}`, () => {
    it('every difficulty: the baked picture equals the rasteriser; nothing merged away, no orphans, little despeckle', () => {
      ART_DIFFICULTIES.forEach((d, k) => {
        const r = rasteriseReport(motif, widthFor(motif, d), TIER_OF[d]);
        expect(decodeRows(artOf(motif.id)!.rows[k]!), `${d}: baked rows equal the rasteriser (run scripts/render-motifs.ts --bake)`).toEqual(r.picture.rows);
        expect(r.mergedForSize, d).toEqual([]);
        expect(r.orphans, d).toEqual([]);
        expect(r.despeckled / (r.picture.w * r.picture.h), d).toBeLessThanOrEqual(0.02);
      });
    });
  });
}
