import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  COMPASS,
  EARTH_RADIUS_KM,
  EE_X_MAX,
  EE_Y_MAX,
  bbox,
  bearing,
  boundaryDistanceKm,
  compassWord,
  dayLengthHours,
  distanceKm,
  greatCircle,
  mercatorFactor,
  pointInRings,
  polygonDistanceKm,
  rhumbBearing,
  project,
  segmentDistanceKm,
  sunTimeHours,
  unproject
} from '../src/geo';

const RAD = Math.PI / 180;
/** Oracle: the spherical law of cosines (a different formula from the haversine under test). */
const cosineLaw = (lon1: number, lat1: number, lon2: number, lat2: number) => {
  const c = Math.sin(lat1 * RAD) * Math.sin(lat2 * RAD) + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
  return EARTH_RADIUS_KM * Math.acos(Math.max(-1, Math.min(1, c)));
};

const lon = fc.double({ min: -180, max: 180, noNaN: true });
const lat = fc.double({ min: -89.9, max: 89.9, noNaN: true });

describe('Equal Earth projection', () => {
  it('has the published reference values', () => {
    expect(project(0, 0)).toEqual([0, 0]);
    expect(project(180, 0)[0]).toBeCloseTo(2.70663, 5);
    expect(project(0, 90)[1]).toBeCloseTo(1.31736, 5);
    expect(EE_X_MAX).toBeCloseTo(2.70663, 5);
    expect(EE_Y_MAX).toBeCloseTo(1.31736, 5);
    expect(project(-180, 0)[0]).toBeCloseTo(-2.70663, 5);
  });

  it('round-trips forward and inverse', () => {
    fc.assert(
      fc.property(lon, lat, (l, p) => {
        const [x, y] = project(l, p);
        const back = unproject(x, y)!;
        expect(Math.abs(back[0] - l) * RAD).toBeLessThan(1e-9);
        expect(Math.abs(back[1] - p) * RAD).toBeLessThan(1e-9);
      })
    );
  });

  it('is monotonic in longitude and latitude', () => {
    fc.assert(
      fc.property(lon, lon, lat, (a, b, p) => {
        fc.pre(b - a > 1e-9);
        expect(project(a, p)[0]).toBeLessThan(project(b, p)[0]);
      })
    );
    fc.assert(
      fc.property(lon, lat, lat, (l, a, b) => {
        fc.pre(b - a > 1e-9);
        expect(project(l, a)[1]).toBeLessThan(project(l, b)[1]);
      })
    );
  });

  it('keeps areas: small projected cells have the spherical area', () => {
    // Projected area of a 0.01° × 0.01° cell (unit sphere) vs its spherical area.
    fc.assert(
      fc.property(fc.double({ min: -179, max: 179, noNaN: true }), fc.double({ min: -80, max: 80, noNaN: true }), (l, p) => {
        const d = 0.01;
        const [x0, y0] = project(l, p);
        const [x1] = project(l + d, p);
        const [, y1] = project(l, p + d);
        const [x2, y2] = project(l + d, p + d);
        // The cell is a trapezoid in projected space (parallels are straight horizontal lines).
        const projected = (((x1 - x0 + (x2 - project(l, p + d)[0])) / 2) * (y1 - y0 + (y2 - y0)) / 2) as number;
        const spherical = d * RAD * (Math.sin((p + d) * RAD) - Math.sin(p * RAD));
        expect(Math.abs(projected / spherical - 1)).toBeLessThan(1e-4);
      })
    );
  });

  it('rejects points off the map', () => {
    expect(unproject(3, 0)).toBeNull();
    expect(unproject(0, 1.4)).toBeNull();
    expect(unproject(Number.NaN, 0)).toBeNull();
    expect(unproject(2.6, 1.2)).toBeNull();
  });
});

describe('distances', () => {
  it('is zero on identity, symmetric and positive', () => {
    fc.assert(
      fc.property(lon, lat, lon, lat, (a, b, c, d) => {
        expect(distanceKm(a, b, a, b)).toBe(0);
        expect(distanceKm(a, b, c, d)).toBeCloseTo(distanceKm(c, d, a, b), 6);
        expect(distanceKm(a, b, c, d)).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it('satisfies the triangle inequality', () => {
    fc.assert(
      fc.property(lon, lat, lon, lat, lon, lat, (a, b, c, d, e, f) => {
        expect(distanceKm(a, b, e, f)).toBeLessThanOrEqual(distanceKm(a, b, c, d) + distanceKm(c, d, e, f) + 1e-4);
      })
    );
  });

  it('puts antipodes half a circumference apart', () => {
    expect(distanceKm(0, 0, 180, 0)).toBeCloseTo(Math.PI * EARTH_RADIUS_KM, 6);
    expect(distanceKm(10, 45, -170, -45)).toBeCloseTo(Math.PI * EARTH_RADIUS_KM, 6);
  });

  it('agrees with the law-of-cosines oracle within 1 m above 1 km', () => {
    fc.assert(
      fc.property(lon, lat, lon, lat, (a, b, c, d) => {
        const km = distanceKm(a, b, c, d);
        fc.pre(km > 1);
        expect(Math.abs(km - cosineLaw(a, b, c, d))).toBeLessThan(0.001);
      })
    );
  });

  it('knows a few city distances (about)', () => {
    // Paris – New York ≈ 5,837 km; Sydney – Tokyo ≈ 7,800 km.
    expect(distanceKm(2.35, 48.86, -74.0, 40.71)).toBeGreaterThan(5800);
    expect(distanceKm(2.35, 48.86, -74.0, 40.71)).toBeLessThan(5870);
    expect(distanceKm(151.21, -33.87, 139.69, 35.69)).toBeGreaterThan(7750);
    expect(distanceKm(151.21, -33.87, 139.69, 35.69)).toBeLessThan(7850);
  });
});

describe('bearings and compass words', () => {
  it('points the right way', () => {
    expect(bearing(0, 0, 0, 10)).toBeCloseTo(0, 9);
    expect(bearing(0, 0, 10, 0)).toBeCloseTo(90, 9);
    expect(bearing(0, 10, 0, 0)).toBeCloseTo(180, 9);
    expect(bearing(10, 0, 0, 0)).toBeCloseTo(270, 9);
    fc.assert(
      fc.property(lon, lat, lon, lat, (a, b, c, d) => {
        const v = bearing(a, b, c, d);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(360);
      })
    );
  });

  it('has sector boundaries at 11.25° + k·22.5° on both sides', () => {
    for (let k = 0; k < 16; k++) {
      const edge = 11.25 + k * 22.5;
      expect(compassWord(edge - 1e-9)).toBe(COMPASS[k]);
      expect(compassWord(edge)).toBe(COMPASS[(k + 1) % 16]);
      expect(compassWord(k * 22.5)).toBe(COMPASS[k]);
    }
    expect(compassWord(359.99)).toBe('n');
    expect(compassWord(360)).toBe('n');
    expect(compassWord(-90)).toBe('w');
  });

  it('uses 8 words with boundaries at 22.5° + k·45°', () => {
    const eight = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    for (let k = 0; k < 8; k++) {
      expect(compassWord(22.5 + k * 45 - 1e-9, 8)).toBe(eight[k]);
      expect(compassWord(22.5 + k * 45, 8)).toBe(eight[(k + 1) % 8]);
    }
    fc.assert(
      fc.property(fc.double({ min: -720, max: 720, noNaN: true }), (b) => {
        expect(eight).toContain(compassWord(b, 8));
      })
    );
  });

  it('reads map directions along rhumb lines', () => {
    expect(rhumbBearing(0, 0, 0, 10)).toBeCloseTo(0, 9);
    expect(rhumbBearing(0, 0, 10, 0)).toBeCloseTo(90, 9);
    expect(rhumbBearing(0, 10, 0, 0)).toBeCloseTo(180, 9);
    // France → Papua New Guinea: east-south-east on the map, although the great circle starts north-east.
    expect(compassWord(rhumbBearing(2.5, 46.7, 145, -6))).toBe('ese');
    expect(compassWord(bearing(2.5, 46.7, 145, -6), 8)).toBe('ne');
    // Across the antimeridian the short way is taken.
    expect(rhumbBearing(170, 0, -170, 0)).toBeCloseTo(90, 9);
    expect(rhumbBearing(-170, 0, 170, 0)).toBeCloseTo(270, 9);
    fc.assert(
      fc.property(lon, lat, lon, lat, (a, b, c, d) => {
        const v = rhumbBearing(a, b, c, d);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(360);
      })
    );
  });

  it('draws great circles through both ends', () => {
    const arc = greatCircle(-74, 40.7, 2.35, 48.86, 20);
    expect(arc).toHaveLength(20);
    expect(arc[0]![0]).toBeCloseTo(-74, 9);
    expect(arc[19]![1]).toBeCloseTo(48.86, 9);
    // The shortest way from New York to Paris passes north of both ends.
    expect(Math.max(...arc.map((p) => p[1]))).toBeGreaterThan(50);
    expect(greatCircle(5, 5, 5, 5, 3)).toEqual([[5, 5], [5, 5], [5, 5]]);
  });
});

describe('polygons', () => {
  const square = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0];
  const hole = [4, 4, 4, 6, 6, 6, 6, 4, 4, 4];

  it('tests inside and outside with holes', () => {
    expect(pointInRings(5, 2, [square])).toBe(true);
    expect(pointInRings(5, 5, [square])).toBe(true);
    expect(pointInRings(5, 5, [square, hole])).toBe(false);
    expect(pointInRings(11, 5, [square])).toBe(false);
    expect(pointInRings(5, 5, [])).toBe(false);
  });

  it('handles rings split at the antimeridian', () => {
    const east = [170, -10, 180, -10, 180, 10, 170, 10, 170, -10];
    const west = [-180, -10, -170, -10, -170, 10, -180, 10, -180, -10];
    expect(pointInRings(179, 0, [east, west])).toBe(true);
    expect(pointInRings(-179, 0, [east, west])).toBe(true);
    expect(pointInRings(0, 0, [east, west])).toBe(false);
    // Across the line, the nearest boundary is only a few km away on the globe.
    expect(polygonDistanceKm(-169.9, 0, [east, west])).toBeLessThan(12);
  });

  it('measures zero inside and the cross-track distance outside', () => {
    expect(polygonDistanceKm(5, 5, [square])).toBe(0);
    // 1° north of the top edge's middle: a little under 111 km, as the great circle between the corners bulges north.
    expect(polygonDistanceKm(5, 11, [square])).toBeCloseTo(segmentDistanceKm(5, 11, 0, 10, 10, 10), 6);
    expect(polygonDistanceKm(5, 11, [square])).toBeGreaterThan(105);
    expect(polygonDistanceKm(5, 11, [square])).toBeLessThan(111.2);
    expect(polygonDistanceKm(5, -1, [square])).toBeGreaterThan(110);
    // Beyond a corner the distance is to the corner.
    expect(polygonDistanceKm(11, 11, [square])).toBeCloseTo(distanceKm(11, 11, 10, 10), 6);
  });

  it('clamps segment distances to the ends and never goes negative', () => {
    expect(segmentDistanceKm(-1, 0, 0, 0, 10, 0)).toBeCloseTo(distanceKm(-1, 0, 0, 0), 6);
    expect(segmentDistanceKm(5, 0, 0, 0, 10, 0)).toBeCloseTo(0, 6);
    expect(segmentDistanceKm(3, 3, 1, 1, 1, 1)).toBeCloseTo(distanceKm(3, 3, 1, 1), 6);
    fc.assert(
      fc.property(lon, lat, lon, lat, lon, lat, (a, b, c, d, e, f) => {
        const s = segmentDistanceKm(a, b, c, d, e, f);
        expect(s).toBeGreaterThanOrEqual(0);
        // Never further than the nearer end.
        expect(s).toBeLessThanOrEqual(Math.min(distanceKm(a, b, c, d), distanceKm(a, b, e, f)) + 0.01);
      })
    );
  });

  it('finds the nearest boundary point among all rings', () => {
    fc.assert(
      fc.property(fc.double({ min: -60, max: 60, noNaN: true }), fc.double({ min: -60, max: 60, noNaN: true }), (x, y) => {
        const d = boundaryDistanceKm(x, y, [square, hole]);
        const naive = Math.min(
          ...[square, hole].flatMap((r) => Array.from({ length: r.length / 2 - 1 }, (_, i) => segmentDistanceKm(x, y, r[2 * i]!, r[2 * i + 1]!, r[2 * i + 2]!, r[2 * i + 3]!)))
        );
        expect(d).toBeCloseTo(naive, 6);
      })
    );
    expect(boundaryDistanceKm(0, 0, [])).toBe(Infinity);
    expect(bbox([square, [20, -5, 21, 30]])).toEqual([0, -5, 21, 30]);
  });
});

describe('sun', () => {
  const minutes = (h: number) => Math.round(h * 60);

  it('gives about 12 h 7 min at the Equator on both solstices', () => {
    expect(minutes(dayLengthHours(0, 6))).toBe(727);
    expect(minutes(dayLengthHours(0, 12))).toBe(727);
  });

  it('gives about 18 h 50 min at 60° N in June', () => {
    expect(Math.abs(minutes(dayLengthHours(60, 6)) - (18 * 60 + 50))).toBeLessThanOrEqual(5);
  });

  it('knows the midnight sun and the polar night', () => {
    expect(dayLengthHours(70, 6)).toBe(24);
    expect(dayLengthHours(70, 12)).toBe(0);
    expect(dayLengthHours(-70, 12)).toBe(24);
    expect(dayLengthHours(64, 6)).toBeLessThan(24);
    expect(dayLengthHours(66.56, 6)).toBe(24);
  });

  it('is symmetric under (φ, June) ↔ (−φ, December)', () => {
    fc.assert(
      fc.property(lat, (p) => {
        expect(dayLengthHours(p, 6)).toBeCloseTo(dayLengthHours(-p, 12), 9);
      })
    );
    fc.assert(
      fc.property(fc.double({ min: 0, max: 89, noNaN: true }), (p) => {
        expect(dayLengthHours(p, 6)).toBeGreaterThanOrEqual(dayLengthHours(p, 12));
      })
    );
  });

  it('turns 15° per hour, east later', () => {
    expect(sunTimeHours(0, 15)).toBe(1);
    expect(sunTimeHours(30, 0)).toBe(-2);
    expect(sunTimeHours(-74, 139.7)).toBeCloseTo(14.2467, 4);
  });

  it('knows how much Mercator enlarges', () => {
    expect(mercatorFactor(0)).toBe(1);
    expect(mercatorFactor(60)).toBeCloseTo(4, 9);
  });
});
