import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { decodeAtlas } from '../src/atlas';
import { DIFFICULTIES } from '../src/compare';
import { ATLAS_DATA } from '../src/data/atlas.gen';
import { createRound } from '../src/generate';
import { ROUTE_BANDS, bfs, drawRoute, graphOf, shortestRoute, validPath, type Graph } from '../src/route';
import { AREAS } from '../src/state';

const atlas = decodeAtlas(ATLAS_DATA);

/** Brute force: depth-first enumeration of simple paths up to `limit` crossings; shortest length and count. */
function bruteForce(g: Graph, from: string, to: string, limit: number): { dist: number; ways: number } | null {
  let best = Infinity;
  let ways = 0;
  const seen = new Set([from]);
  const walk = (u: string, d: number) => {
    if (d > Math.min(best, limit)) return;
    if (u === to) {
      if (d < best) {
        best = d;
        ways = 0;
      }
      if (d === best) ways++;
      return;
    }
    for (const v of g.get(u) ?? []) {
      if (seen.has(v)) continue;
      seen.add(v);
      walk(v, d + 1);
      seen.delete(v);
    }
  };
  walk(from, 0);
  return best === Infinity ? null : { dist: best, ways };
}

const smallGraph = fc
  .array(fc.tuple(fc.integer({ min: 0, max: 7 }), fc.integer({ min: 0, max: 7 })), { maxLength: 20 })
  .map((edges) => {
    const g = new Map<string, string[]>();
    for (let i = 0; i < 8; i++) g.set(`n${i}`, []);
    for (const [a, b] of edges) {
      if (a === b || g.get(`n${a}`)!.includes(`n${b}`)) continue;
      g.get(`n${a}`)!.push(`n${b}`);
      g.get(`n${b}`)!.push(`n${a}`);
    }
    for (const list of g.values()) list.sort();
    return g as Graph;
  });

describe('route graph', () => {
  it('BFS distances and route counts equal a brute-force search on random small graphs', () => {
    fc.assert(
      fc.property(smallGraph, fc.integer({ min: 0, max: 7 }), fc.integer({ min: 0, max: 7 }), (g, a, b) => {
        const r = bfs(g, `n${a}`).get(`n${b}`);
        const brute = bruteForce(g, `n${a}`, `n${b}`, 8);
        expect(r ?? null).toEqual(brute);
        const path = shortestRoute(g, `n${a}`, `n${b}`);
        if (brute) {
          expect(path).not.toBeNull();
          expect(path!.length - 1).toBe(brute.dist);
          expect(validPath(g, `n${a}`, path!)).toBe(true);
        } else expect(path).toBeNull();
      })
    );
  });

  it('agrees with brute force on the real graph for random pairs up to six crossings', () => {
    const g = graphOf(atlas);
    const rng = createRng(17);
    let checked = 0;
    for (let i = 0; checked < 100 && i < 2000; i++) {
      const a = rng.pick(atlas.countries).id;
      const reach = bfs(g, a);
      const near = [...reach].filter(([, r]) => r.dist >= 1 && r.dist <= 6);
      if (!near.length) continue;
      const [b, r] = rng.pick(near);
      expect(bruteForce(g, a, b, r.dist), `${a}→${b}`).toEqual(r);
      checked++;
    }
    expect(checked).toBe(100);
  });

  it('generates pairs inside the difficulty band, with the stored best and ways', () => {
    const g = graphOf(atlas);
    for (const d of DIFFICULTIES)
      for (const area of AREAS)
        for (let seed = 0; seed < 8; seed++) {
          const round = createRound(seed, d, 'route', area, atlas);
          for (const it of round.items) {
            if (it.kind !== 'route') continue;
            const [lo, hi] = ROUTE_BANDS[d];
            const r = bfs(g, it.from).get(it.to)!;
            expect(it.best).toBe(r.dist);
            expect(it.ways).toBe(r.ways);
            expect(it.best).toBeGreaterThanOrEqual(lo);
            expect(it.best).toBeLessThanOrEqual(hi);
            if (area !== 'oceania' && area !== 'world') expect(atlas.country(it.from)!.region).toBe(area);
          }
        }
  });

  it('draws worldwide pairs for Oceania and validates paths', () => {
    const r = drawRoute(createRng(2), atlas, 'oceania', 'easy', new Set());
    expect(r?.worldwide).toBe(true);
    const g = graphOf(atlas);
    expect(validPath(g, 'PT', ['PT', 'ES', 'FR'])).toBe(true);
    expect(validPath(g, 'PT', ['PT', 'FR'])).toBe(false);
    expect(validPath(g, 'PT', ['PT', 'ES', 'PT'])).toBe(false);
    expect(validPath(g, 'PT', ['ES'])).toBe(false);
    expect(shortestRoute(g, 'PT', 'PL')).toEqual(['PT', 'ES', 'FR', 'DE', 'PL']);
    expect(shortestRoute(g, 'PT', 'JP')).toBeNull();
  });
});
