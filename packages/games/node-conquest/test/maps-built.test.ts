import { describe, expect, it } from 'vitest';
import { BOARD, crossings, FACTION_COUNTS, getMap, hops, isFairMap, laneCrossing, LEGACY_MAPS, MAPS_PER_SET, rotate, type GameMap, type MapNode } from '../src/maps';
import { createGame, isValidState, mapForSeed, migrateState } from '../src/rules';
import { makeMap } from './fixtures';
import { playMatch, quantile, type MatchResult } from './harness';

/* Hand-built maps (index 7 and up): crossing lanes allowed, exact rotational symmetry, fair starts. */

const built = () => Array.from({ length: MAPS_PER_SET - LEGACY_MAPS }, (_, i) => LEGACY_MAPS + i);
const each = (fn: (map: GameMap, f: number, m: number) => void) => {
  for (const m of built()) for (const f of FACTION_COUNTS) fn(getMap(f, m), f, m);
};
const dist = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);

/** Independent oracle: proper crossing of two segments (strict orientation test). */
function segmentsCross(p1: MapNode, p2: MapNode, q1: MapNode, q2: MapNode): boolean {
  const cross = (a: MapNode, b: MapNode, c: MapNode) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return cross(q1, q2, p1) * cross(q1, q2, p2) < 0 && cross(p1, p2, q1) * cross(p1, p2, q2) < 0;
}

function distanceToSegment(p: MapNode, a: MapNode, b: MapNode): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
}

describe('hand-built maps: structure', () => {
  it('six maps follow the seven generated ones, for 1, 2 and 3 opponents, always in layout 2', () => {
    expect(built()).toEqual([7, 8, 9, 10, 11, 12]);
    each((map, f, m) => {
      expect(map.index).toBe(m);
      expect(map.factions).toBe(f);
      expect(map.layout).toBe(2);
      // The layout argument does not apply (layout 1 exists only for migrated maps 0–6).
      expect(getMap(f as 2, m, 1)).toEqual(map);
      expect(getMap(f as 2, m)).toBe(map);
    });
  });

  it('are fair: starts at level 10, at least three hops apart, every node reachable, an easy first expansion', () => {
    each((map) => {
      expect(isFairMap(map)).toBe(true);
      const starts = map.nodes.flatMap((n, v) => (n.owner >= 0 ? [v] : []));
      expect(starts.map((v) => map.nodes[v]!.owner)).toEqual([...Array(map.factions).keys()]);
      for (const s of starts) {
        expect(map.nodes[s]!.level).toBe(10);
        expect(hops(map, s).every((d) => d >= 0)).toBe(true);
        expect(map.adjacent[s]!.some((w) => map.nodes[w]!.type === 'standard' && map.nodes[w]!.level <= 3 && map.nodes[w]!.owner < 0)).toBe(true);
      }
      expect(map.nodes[starts[0]!]!.y).toBeGreaterThan(BOARD / 2 + 150);
    });
  });

  it('are exactly rotationally symmetric: positions (±1), types, levels, lanes and lane lengths', () => {
    each((map) => {
      const n = map.factions;
      const sectors = map.center >= 0 ? map.nodes.length - 1 : map.nodes.length;
      const k = sectors / n;
      expect(Number.isInteger(k)).toBe(true);
      if (map.center >= 0) expect(map.nodes[map.center]).toMatchObject({ x: BOARD / 2, y: BOARD / 2, owner: -1 });
      const rot = (v: number) => (v >= sectors ? v : (v + k) % sectors);
      map.nodes.forEach((node, v) => {
        const twin = map.nodes[rot(v)]!;
        expect([twin.type, twin.level, twin.owner < 0 ? -1 : (node.owner + 1) % n]).toEqual([node.type, node.level, twin.owner]);
        const [x, y] = rotate(node.x - BOARD / 2, node.y - BOARD / 2, 360 / n);
        expect(Math.abs(twin.x - BOARD / 2 - x)).toBeLessThanOrEqual(1);
        expect(Math.abs(twin.y - BOARD / 2 - y)).toBeLessThanOrEqual(1);
      });
      const lanes = new Map(map.lanes.map(([a, b, len]) => [`${a}-${b}`, len]));
      for (const [a, b, len] of map.lanes) {
        const [ra, rb] = [rot(a), rot(b)].sort((x, y) => x - y) as [number, number];
        expect(lanes.get(`${ra}-${rb}`)).toBe(len);
      }
    });
  });

  it('are clean on a 640 board: inside the margins, nodes ≥ 86 apart (hit circles never overlap), no lane runs through or grazes a node', () => {
    each((map) => {
      const { nodes, lanes } = map;
      expect(nodes.length).toBeGreaterThanOrEqual(9);
      expect(nodes.length).toBeLessThanOrEqual(21);
      for (const n of nodes) for (const c of [n.x, n.y]) expect(c >= 50 && c <= BOARD - 50).toBe(true);
      for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) expect(dist(nodes[a]!, nodes[b]!)).toBeGreaterThanOrEqual(86);
      for (const [a, b, len] of lanes) {
        expect(a).toBeLessThan(b);
        expect(len).toBeLessThanOrEqual(300);
        expect(Math.abs(len - dist(nodes[a]!, nodes[b]!))).toBeLessThan(3);
        nodes.forEach((n, v) => {
          if (v !== a && v !== b) expect(distanceToSegment(n, nodes[a]!, nodes[b]!)).toBeGreaterThan(45);
        });
      }
      // laneOf / adjacent agree with the lane list.
      map.lanes.forEach(([a, b], i) => {
        expect(map.laneOf[a]![b]).toBe(i);
        expect(map.laneOf[b]![a]).toBe(i);
        expect(map.adjacent[a]).toContain(b);
      });
      expect(map.adjacent.reduce((sum, list) => sum + list.length, 0)).toBe(2 * map.lanes.length);
    });
  });
});

describe('hand-built maps: crossing lanes', () => {
  it('finds exactly the crossings an independent segment test finds', () => {
    let total = 0;
    each((map) => {
      const found = new Set(crossings(map).map(([i, j]) => `${i}-${j}`));
      const { nodes, lanes } = map;
      for (let i = 0; i < lanes.length; i++) {
        for (let j = i + 1; j < lanes.length; j++) {
          const [a, b] = lanes[i]!;
          const [c, e] = lanes[j]!;
          const expected = new Set([a, b, c, e]).size === 4 && segmentsCross(nodes[a]!, nodes[b]!, nodes[c]!, nodes[e]!);
          expect(found.has(`${i}-${j}`)).toBe(expected);
        }
      }
      total += found.size;
    });
    expect(total).toBeGreaterThan(10);
  });

  it('crossing points lie on both lanes and well away from every node (room for the crossing marker and a fight zone)', () => {
    each((map) => {
      for (const [i, j, x, y] of crossings(map)) {
        for (const lane of [i, j]) {
          const [a, b] = map.lanes[lane]!;
          expect(distanceToSegment({ x, y, type: 'standard', level: 1, owner: -1 }, map.nodes[a]!, map.nodes[b]!)).toBeLessThan(0.01);
        }
        for (const node of map.nodes) expect(dist(node, { x, y })).toBeGreaterThan(48);
      }
    });
  });

  it('maps 8 (Crossroads) and 12 (Lattice) have crossings for every number of opponents, symmetric per faction', () => {
    for (const m of [7, 11]) {
      for (const f of FACTION_COUNTS) {
        const count = crossings(getMap(f, m)).length;
        expect(count).toBeGreaterThan(0);
        expect(count % f).toBe(0);
      }
    }
  });

  it('laneCrossing: shared ends, parallel and touching lanes do not cross; an X does', () => {
    const map = makeMap(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 100, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 100 },
        { x: 50, y: 50 }
      ],
      [
        [0, 1],
        [2, 3],
        [3, 4],
        [4, 5],
        [1, 5],
        [2, 6]
      ]
    );
    expect(laneCrossing(map, 0, 1)).toEqual([50, 50]);
    expect(laneCrossing(map, 1, 0)).toEqual([50, 50]);
    expect(laneCrossing(map, 1, 2)).toBeNull();
    expect(laneCrossing(map, 0, 3)).toBeNull();
    expect(laneCrossing(map, 2, 4)).toBeNull();
    // Lane 2–6 ends exactly on lane 0–1 (touching is not a crossing).
    expect(laneCrossing(map, 0, 5)).toBeNull();
    expect(crossings(map)).toEqual([[0, 1, 50, 50]]);
  });
});

describe('hand-built maps: saves and selection', () => {
  it('new games pick among all 13 maps by seed; every index is a valid save', () => {
    expect(new Set(Array.from({ length: 26 }, (_, s) => mapForSeed(s))).size).toBe(MAPS_PER_SET);
    for (const m of built()) {
      for (const opponents of [1, 2, 3] as const) {
        const s = createGame(m * 31, { map: m, opponents });
        expect(s.map).toBe(m);
        expect(s.layout).toBe(2);
        expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
      }
    }
  });

  it('saves from older versions never point at the new maps', () => {
    const s = createGame(7, { map: 9 });
    const { moved: _m, ...v2 } = s;
    expect(migrateState(v2, 2)).toEqual({ ...s, moved: 0 });
    expect(migrateState({ ...v2, layout: 1 }, 2)).toBeUndefined();
    // Version 1 had maps 0–6 only.
    const { opponents: _o, layout: _l, half: _h, hist: _x, centre: _c, ...v1 } = createGame(7, { map: LEGACY_MAPS });
    expect(migrateState({ ...v1, difficulty: 'easy' }, 1)).toBeUndefined();
    const { opponents: _o2, layout: _l2, half: _h2, hist: _x2, centre: _c2, ...old } = createGame(7, { map: LEGACY_MAPS - 1, layout: 1 });
    expect(migrateState({ ...old, difficulty: 'easy' }, 1)).toMatchObject({ map: LEGACY_MAPS - 1, layout: 1 });
  });
});

/* ---------- Measured with the stall harness (seeded, deterministic) ---------- */

describe('hand-built maps: no long standoffs, no trivial games', () => {
  const stalls = (rs: MatchResult[]) => rs.filter((r) => r.stalled).length;

  it('bot duels (advanced) and human-like play stay decisive on every new map', () => {
    const duels: MatchResult[] = [];
    const human: MatchResult[] = [];
    for (const m of built()) {
      for (let i = 0; i < 8; i++) {
        duels.push(playMatch(i * 101 + 108, 'advanced', 'advanced', 9000, m));
        human.push(playMatch(i * 101 + 108, 'human', 'advanced', 9000, m));
      }
    }
    // 48 matches each (8 seeds × 6 maps); measured: 2 standoffs in bot duels, 1 with the human-like player
    // (over 20 seeds per map: at most 2 in 20 per map in duels, at most 1 in 20 with the proxy).
    expect(stalls(duels)).toBeLessThanOrEqual(3);
    expect(stalls(human)).toBeLessThanOrEqual(2);
    const lengths = [...duels, ...human].map((r) => r.ticks);
    // Not trivially short (90 s of game time at least) and usually decided within 5 minutes.
    expect(Math.min(...lengths)).toBeGreaterThanOrEqual(900);
    expect(quantile(lengths, 0.5)).toBeLessThan(3000);
  }, 120_000);
});
