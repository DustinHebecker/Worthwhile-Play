/**
 * Slow geometry checks (design § 21.3): label points and the simplification error behind the 25 km tolerance.
 */
import { describe, expect, it } from 'vitest';
import { TOLERANCE_KM, decodeAtlas, inside } from '../src/atlas';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import { boundaryDistanceKm } from '../src/geo';
import samples from './fixtures/boundary-samples.json';

const atlas = decodeAtlas(ATLAS_DATA);

describe('geometry (slow)', () => {
  it('keeps each country’s label point inside it, or near its islands for archipelagos', () => {
    for (const c of atlas.countries) {
      if (inside(c, c.label[0], c.label[1])) continue;
      const km = boundaryDistanceKm(c.label[0], c.label[1], c.rings);
      if (km <= TOLERANCE_KM) continue;
      // Natural Earth puts the label of some island countries at sea between the islands (e.g. New Zealand).
      expect(c.rings.length, c.id).toBeGreaterThan(1);
      expect(km, c.id).toBeLessThan(100);
    }
  });

  it('draws every full-resolution boundary sample within the 25 km tolerance (design § 6.2)', () => {
    const table = samples as Record<string, number[][]>;
    expect(Object.keys(table)).toHaveLength(193);
    let worst = 0;
    for (const c of atlas.countries) {
      for (const [lon, lat] of table[c.id]!) {
        const km = boundaryDistanceKm(lon! / 100, lat! / 100, c.rings);
        worst = Math.max(worst, km);
        expect(km, `${c.id} ${lon},${lat}`).toBeLessThanOrEqual(TOLERANCE_KM);
      }
    }
    expect(worst).toBeGreaterThan(0);
  });
});
