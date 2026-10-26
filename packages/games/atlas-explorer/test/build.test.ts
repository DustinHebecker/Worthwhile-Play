import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { decodeInts, encodeInts } from '../src/codec';
import { EE_X_MAX } from '../src/geo';
import { readCollection, str, num, type Path } from '../src/build/geojson';
import { areNeighbours, dropSmallParts, interiorPoint, lengthInsideKm, lineLengthKm, linesCrossed, LINE_BITS, makeLocator, polygonAreaKm2, ringAreaKm2, sampledAreaKm2, segmentHatched, unhatchedLengthKm } from '../src/build/facts';
import { compareViews, makeGrid, rasterize } from '../src/build/raster';
import { simplify } from '../src/build/simplify';
import { arcUsers, buildTopology, dissolve, quantizeRing, ringPoints } from '../src/build/topology';

const sq = (x0: number, y0: number, x1: number, y1: number): Path => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
  [x0, y0]
];

describe('encoding', () => {
  it('round-trips integers below 2^51, including large jumps and negatives', () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.integer({ min: -100, max: 100 }), fc.integer(), fc.constant(2 ** 51 - 1), fc.constant(1 - 2 ** 51))), (xs) => {
        expect(decodeInts(encodeInts(xs))).toEqual(xs);
      })
    );
  });

  it('writes only URL-safe characters, one per small value', () => {
    const s = encodeInts([0, -1, 1, -16, 15, 1_000_000]);
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeInts([0, -1, 1, 15])).toHaveLength(4);
    expect(() => decodeInts('ab"')).toThrow();
    expect(() => decodeInts('g')).toThrow(/truncated/);
    expect(() => encodeInts([0.5])).toThrow();
    expect(() => encodeInts([2 ** 51])).toThrow();
  });
});

describe('GeoJSON reading', () => {
  it('reads polygons, multipolygons and lines and rejects junk', () => {
    const fs = readCollection({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { NAME: ' A ', N: 3 }, geometry: { type: 'Polygon', coordinates: [sq(0, 0, 1, 1)] } },
        { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [[sq(0, 0, 1, 1)], [sq(2, 2, 3, 3)]] } },
        { type: 'Feature', properties: null, geometry: { type: 'MultiLineString', coordinates: [[[0, 0], [1, 1]]] } },
        { type: 'Feature', properties: {}, geometry: null },
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [5, 6] } }
      ]
    });
    expect(fs.map((f) => [f.polygons.length, f.lines.length, f.points.length])).toEqual([[1, 0, 0], [2, 0, 0], [0, 1, 0], [0, 0, 0], [0, 0, 1]]);
    expect(fs[4]!.points[0]).toEqual([5, 6]);
    expect(str(fs[0]!.props, 'NAME')).toBe('A');
    expect(num(fs[0]!.props, 'N')).toBe(3);
    expect(num(fs[0]!.props, 'X')).toBeNaN();
    expect(() => readCollection({ type: 'Feature' })).toThrow();
    expect(() => readCollection({ type: 'FeatureCollection', features: [{ geometry: { type: 'GeometryCollection', coordinates: [] } }] })).toThrow();
    expect(() => readCollection({ type: 'FeatureCollection', features: [{ geometry: { type: 'LineString', coordinates: [[0, 'x']] } }] })).toThrow();
  });
});

describe('topology', () => {
  it('quantises, closes and densifies rings the same way in both directions', () => {
    const r = quantizeRing([[0, 0], [3, 0], [3, 1]], 50, 50)!;
    expect(r.slice(0, 2)).toEqual([0, 0]);
    expect(r.slice(-2)).toEqual([0, 0]);
    // 3° edge split into 1° steps.
    expect(r.slice(0, 8)).toEqual([0, 0, 50, 0, 100, 0, 150, 0]);
    const back = quantizeRing([[3, 1], [3, 0], [0, 0]], 50, 40)!;
    const fwd = quantizeRing([[0, 0], [3, 0], [3, 1]], 50, 40)!;
    const pts = (a: number[]) => new Set(a.map((_, i) => (i % 2 ? '' : `${a[i]},${a[i + 1]}`)).filter(Boolean));
    expect(pts(back)).toEqual(pts(fwd));
    expect(quantizeRing([[0, 0], [0.001, 0], [0, 0.001]], 50, 50)).toBeNull();
  });

  it('turns two squares sharing an edge into one shared arc and two rings', () => {
    const topo = buildTopology(
      [
        { owner: 0, rings: [sq(0, 0, 1, 1)] },
        { owner: 1, rings: [sq(1, 0, 2, 1)] }
      ],
      50,
      1000
    );
    expect(topo.rings).toHaveLength(2);
    const users = arcUsers(topo);
    const shared = users.filter((u) => u.length === 2);
    expect(shared).toHaveLength(1);
    // Used once in each direction.
    expect(shared[0]!.map(([, rev]) => rev).sort()).toEqual([false, true]);
    // Every ring closes and has its four corners.
    for (const ring of topo.rings) {
      const p = ringPoints(topo.arcs, ring.arcs);
      expect(p.slice(0, 2)).toEqual(p.slice(-2));
      expect(p.length / 2 - 1).toBe(4);
    }
  });

  it('shares a border traced with different vertices on each side (noding)', () => {
    // Both squares share x = 1, but the left one has an extra vertex on it and the right one another.
    const left: Path = [[0, 0], [1, 0], [1, 0.3], [1, 1], [0, 1], [0, 0]];
    const right: Path = [[1, 0], [2, 0], [2, 1], [1, 1], [1, 0.7], [1, 0]];
    const topo = buildTopology([{ owner: 0, rings: [left] }, { owner: 1, rings: [right] }], 50, 1000);
    const users = arcUsers(topo);
    const shared = users.filter((u) => u.length === 2);
    expect(shared).toHaveLength(1);
    const arc = topo.arcs[users.indexOf(shared[0]!)]!;
    // The shared arc holds both extra vertices.
    expect(arc.length / 2).toBe(4);
  });

  it('finds junctions at large coordinates (point keys do not overflow)', () => {
    // Two countries far from (0, 0) sharing one edge, as Kenya and Tanzania do.
    const a: Path = [[36, -3], [37, -3], [37, -2], [36, -2], [36, -3]];
    const b: Path = [[37, -3], [38, -3], [38, -2], [37, -2], [37, -3]];
    const topo = buildTopology([{ owner: 0, rings: [a] }, { owner: 1, rings: [b] }], 50, 1000);
    expect(arcUsers(topo).filter((u) => u.length === 2)).toHaveLength(1);
  });

  it('stores identical rings (e.g. an overlay equal to a country) once', () => {
    const topo = buildTopology(
      [
        { owner: 0, rings: [sq(0, 0, 1, 1)] },
        { owner: 1, rings: [[...sq(0, 0, 1, 1)].reverse()] }
      ],
      50,
      1000
    );
    expect(topo.arcs).toHaveLength(1);
    expect(topo.rings.map((r) => r.arcs.length)).toEqual([1, 1]);
  });

  it('dissolves the internal border of two units of one country', () => {
    const topo = buildTopology(
      [
        { owner: 0, rings: [sq(0, 0, 1, 1)] },
        { owner: 1, rings: [sq(1, 0, 2, 1)] },
        { owner: 2, rings: [sq(2, 0, 3, 1)] }
      ],
      50,
      1000
    );
    const merged = dissolve(topo, (o) => (o === 2 ? 1 : 0));
    const g0 = merged.rings.filter((r) => r.owner === 0);
    expect(g0).toHaveLength(1);
    const pts = ringPoints(merged.arcs, g0[0]!.arcs);
    // The outline of the 2 × 1 rectangle: the internal edge at x = 1 is gone.
    const xs = new Set<number>();
    for (let i = 0; i < pts.length; i += 2) xs.add(pts[i]!);
    expect([...xs].sort((a, b) => a - b)).toEqual([0, 50, 100]);
    expect(pts.slice(0, 2)).toEqual(pts.slice(-2));
    expect(ringAreaKm2(Array.from({ length: pts.length / 2 }, (_, i) => [pts[2 * i]! / 50, pts[2 * i + 1]! / 50]))).toBeCloseTo(2 * ringAreaKm2(sq(0, 0, 1, 1)), 0);
  });

  it('keeps a group untouched when its owner is not grouped', () => {
    const topo = buildTopology([{ owner: 5, rings: [sq(0, 0, 1, 1)] }], 50, 1000);
    expect(dissolve(topo, () => null).rings).toEqual(topo.rings);
  });
});

describe('simplification', () => {
  const cell = (2 * EE_X_MAX) / 16384;
  const opts = { threshold: 36, cell, unit: 50, maxSpan: 150 };

  it('keeps the ends, never moves a point and keeps closed rings at four points', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: -200, max: 200 }), fc.integer({ min: -200, max: 200 })), { minLength: 2, maxLength: 60 }), (raw) => {
        const pts = raw.flat();
        const out = simplify(pts, opts);
        expect(out.slice(0, 2)).toEqual(pts.slice(0, 2));
        expect(out.slice(-2)).toEqual(pts.slice(-2));
        // Subsequence of the input points.
        let j = 0;
        for (let i = 0; i < pts.length && j < out.length; i += 2) if (pts[i] === out[j] && pts[i + 1] === out[j + 1]) j += 2;
        expect(j).toBe(out.length);
      })
    );
    const ring = [0, 0, 1, 0, 2, 0, 2, 1, 2, 2, 1, 2, 0, 2, 0, 1, 0, 0];
    const s = simplify(ring, { ...opts, threshold: 1e12 });
    expect(s.length / 2).toBe(4);
    expect(s.slice(0, 2)).toEqual(s.slice(-2));
  });

  it('removes collinear points but never makes a segment longer than the limit', () => {
    const line: number[] = [];
    for (let x = 0; x <= 1000; x += 10) line.push(x, 0);
    const s = simplify(line, opts);
    for (let i = 2; i < s.length; i += 2) expect(s[i]! - s[i - 2]!).toBeLessThanOrEqual(150);
    expect(s.length).toBeLessThan(line.length);
  });

  it('keeps a long thin spike when its tip would move too far', () => {
    // A 1-unit wide spike 400 units (8°) long: a tiny triangle, but far from the base line.
    const spike = [0, 0, 100, 0, 100, 400, 101, 400, 101, 0, 200, 0];
    expect(simplify(spike, { ...opts, threshold: 1000, maxSpan: 1000 })).not.toContain(400);
    expect(simplify(spike, { ...opts, threshold: 1000, maxSpan: 1000, maxDeviation: 5 })).toContain(400);
  });

  it('keeps a sharp detail above the threshold', () => {
    const spike = [0, 0, 100, 0, 101, 300, 102, 0, 200, 0];
    expect(simplify(spike, opts)).toContain(300);
  });
});

describe('facts', () => {
  it('measures spherical areas', () => {
    // A 1° × 1° cell at the Equator: about 12,364 km².
    expect(ringAreaKm2(sq(0, 0, 1, 1))).toBeGreaterThan(12_300);
    expect(ringAreaKm2(sq(0, 0, 1, 1))).toBeLessThan(12_400);
    expect(polygonAreaKm2([sq(0, 0, 2, 2), sq(0.5, 0.5, 1.5, 1.5)])).toBeCloseTo(ringAreaKm2(sq(0, 0, 2, 2)) - ringAreaKm2(sq(0.5, 0.5, 1.5, 1.5)), 3);
    // Sampling agrees with the formula.
    const inside = makeLocator([[sq(0, 0, 1, 1).flat()]]);
    expect(sampledAreaKm2([0, 0, 1, 1], 0.05, (x, y) => inside(x, y) >= 0) / ringAreaKm2(sq(0, 0, 1, 1))).toBeCloseTo(1, 2);
  });

  it('drops small islands but keeps the largest part', () => {
    const big = [sq(0, 0, 1, 1)];
    const small = [sq(5, 5, 5.01, 5.01)];
    expect(dropSmallParts([big, small], 100)).toEqual([big]);
    expect(dropSmallParts([small], 100)).toEqual([small]);
    expect(dropSmallParts([], 100)).toEqual([]);
  });

  it('applies the neighbour rule: 5 km of border outside hatched areas, either side', () => {
    const hatch = makeLocator([[sq(0, 0.5, 1, 1).flat()]]);
    const inHatch = (x: number, y: number) => hatch(x, y) >= 0;
    // A border along x = 1 from y = 0 to 1: the upper half has the hatch on its west side.
    const border = [1, 0, 1, 0.25, 1, 0.5, 1, 0.75, 1, 1];
    expect(unhatchedLengthKm(border, inHatch)).toBeCloseTo(lineLengthKm(border) / 2, 3);
    expect(segmentHatched(1, 0.6, 1, 0.7, inHatch)).toBe(true);
    expect(segmentHatched(1, 0.1, 1, 0.2, inHatch)).toBe(false);
    // A hatch on the east side counts too.
    const east = makeLocator([[sq(1, 0, 2, 1).flat()]]);
    expect(segmentHatched(1, 0.1, 1, 0.2, (x, y) => east(x, y) >= 0)).toBe(true);
    // A segment whose middle lies next to a hatched area counts too (e.g. a border's last segment at a coast).
    expect(unhatchedLengthKm([1, 0, 1, 0.25], () => false, [1.5], () => true)).toBe(0);
    expect(areNeighbours(5)).toBe(true);
    expect(areNeighbours(4.99)).toBe(false);
  });

  it('measures lines inside a territory and the special lines crossed', () => {
    const inside = makeLocator([[sq(0, 0, 1, 1).flat()]]);
    const line: number[] = [];
    for (let i = 0; i <= 30; i++) line.push(-1 + i / 10, 0.5);
    // One degree of the line lies inside: about 111 km.
    expect(lengthInsideKm([line], (x, y) => inside(x, y) >= 0)).toBeCloseTo(lineLengthKm(line) / 3, 0);
    expect(lengthInsideKm([[5, 5, 6, 6]], (x, y) => inside(x, y) >= 0)).toBe(0);
  });

  it('knows which lines cross a territory', () => {
    expect(linesCrossed([[sq(-5, -5, 5, 30)]])).toBe(LINE_BITS.equator | LINE_BITS.cancer | LINE_BITS.meridian);
    expect(linesCrossed([[sq(10, -30, 20, -20)]])).toBe(LINE_BITS.capricorn);
    expect(linesCrossed([[sq(10, 60, 20, 70)]])).toBe(LINE_BITS.arctic);
    expect(linesCrossed([[sq(10, 1, 20, 2)], [sq(10, -2, 20, -1)]])).toBe(0);
    expect(interiorPoint([sq(0, 0, 2, 2)])).toEqual([1, 1]);
  });
});

describe('worldview raster', () => {
  it('paints polygons with holes and reports disagreements outside the mask', () => {
    const g = makeGrid(1);
    const a = rasterize(g, [[[sq(0, 0, 10, 10), sq(2, 2, 4, 4)]], [[sq(20, 0, 30, 10)]]]);
    expect(a[(90 - 5) * g.w + 185]).toBe(1);
    expect(a[(90 - 3) * g.w + 183]).toBe(0);
    expect(a[(90 - 5) * g.w + 205]).toBe(2);
    const b = rasterize(g, [[[sq(0, 0, 10, 10)]], [[sq(20, 0, 25, 10)]]]);
    const mask = new Uint8Array(g.w * g.h);
    const d = compareViews(g, a, ['AAA', 'BBB'], b, ['AAA', 'BBB'], mask);
    expect(d.map((x) => `${x.from}>${x.to}:${x.cells}`).sort()).toEqual(['>AAA:4', 'BBB>:50']);
    // Masking the hole hides its disagreement.
    for (let j = 86; j < 88; j++) for (let i = 182; i < 184; i++) mask[j * g.w + i] = 1;
    expect(compareViews(g, a, ['AAA', 'BBB'], b, ['AAA', 'BBB'], mask).map((x) => x.from + '>' + x.to)).toEqual(['BBB>']);
  });
});
