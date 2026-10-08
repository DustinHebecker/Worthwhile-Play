import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { BOARD, hops, isFairMap, isqrt, MAX_LANE_LENGTH, MIN_NODE_DISTANCE, rotate, type MapNode } from '../src/maps';
import {
  accountedUnits,
  cloneState,
  createGame,
  DIFFICULTIES,
  getMap,
  isValidState,
  mapForSeed,
  mapOf,
  MAPS_PER_DIFFICULTY,
  MAX_HOPS,
  MAX_LEVEL,
  MAX_UNITS,
  maxPaths,
  nodeCount,
  PRODUCTION_INTERVAL,
  RANGE_BASE,
  RANGE_PER_LEVEL,
  refusal,
  seconds,
  SHOT_INTERVAL,
  stationRange,
  step,
  stepMut,
  toDifficulty,
  toggle,
  toggleMut,
  UNIT_HP,
  UNIT_SPEED,
  unitPosition,
  updateResult,
  type Difficulty,
  type GameMap,
  type NcState,
  type NodeType,
  type Unit
} from '../src/rules';
import { decide, frontierDistance, incomingThreat, isDecisionTick, opponents, PROFILES, simulate, type AiProfile } from '../src/ai';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/* ---------- Small hand-made maps for precise rule tests ---------- */

interface NodeSpec {
  x: number;
  y: number;
  type?: NodeType;
  level?: number;
  owner?: number;
}

function makeMap(specs: NodeSpec[], pairs: [number, number][], factions = 2): GameMap {
  const nodes: MapNode[] = specs.map((n) => ({ type: 'standard', level: 5, owner: -1, ...n }));
  const lanes = pairs.map(([p, q]) => {
    const [a, b] = p < q ? [p, q] : [q, p];
    const length = isqrt((nodes[a]!.x - nodes[b]!.x) ** 2 + (nodes[a]!.y - nodes[b]!.y) ** 2);
    return [a, b, length] as const;
  });
  const laneOf = nodes.map(() => nodes.map(() => -1));
  const adjacent: number[][] = nodes.map(() => []);
  lanes.forEach(([a, b], i) => {
    laneOf[a]![b] = i;
    laneOf[b]![a] = i;
    adjacent[a]!.push(b);
    adjacent[b]!.push(a);
  });
  return { difficulty: 'easy', index: 0, factions, nodes, lanes, laneOf, adjacent };
}

function stateFor(map: GameMap): NcState {
  return {
    seed: 1,
    difficulty: 'easy',
    map: 0,
    tick: 0,
    speed: 1,
    owner: map.nodes.map((n) => n.owner),
    level: map.nodes.map((n) => n.level),
    out: map.nodes.map(() => []),
    charge: map.nodes.map(() => 0),
    units: [],
    rng: 7,
    result: 'playing',
    stats: { produced: 0, reinforced: 0, passed: 0, absorbed: 0, hits: 0, fought: 0, shot: 0, captured: 0 }
  };
}

/** Adds an in-flight unit and counts it as produced (keeps the accounting invariant). */
function addUnit(s: NcState, unit: Partial<Unit> & Pick<Unit, 'f' | 'a' | 'b'>): Unit {
  const k = unit.k ?? 0;
  const u: Unit = { k, d: 0, hp: UNIT_HP[k], h: 0, ...unit };
  s.units.push(u);
  s.stats.produced++;
  return u;
}

/** Three nodes in a row, 200 apart: 0 (player) – 1 – 2 (opponent). */
const row = (middle: Partial<NodeSpec> = {}) =>
  makeMap(
    [
      { x: 100, y: 100, owner: 0, level: 10 },
      { x: 300, y: 100, ...middle },
      { x: 500, y: 100, owner: 1, level: 10 }
    ],
    [
      [0, 1],
      [1, 2]
    ]
  );

const quiet: AiProfile = { period: 1, actions: 3, hesitation: 0, attackLevel: 10, counter: false, defend: false };

/* ---------- Constants and thresholds ---------- */

describe('levels and limits', () => {
  it('allows 1 path at levels 1–9, 2 at 10–19 and 3 at 20–30', () => {
    expect([1, 9, 10, 19, 20, 30].map(maxPaths)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it('grows the defence range with the level', () => {
    expect(stationRange(1)).toBe(RANGE_BASE + RANGE_PER_LEVEL);
    expect(stationRange(30)).toBe(RANGE_BASE + 30 * RANGE_PER_LEVEL);
    for (let level = 1; level < MAX_LEVEL; level++) expect(stationRange(level + 1)).toBeGreaterThan(stationRange(level));
  });

  it('uses slower, tougher frigates than drones', () => {
    expect(UNIT_SPEED[1]).toBeLessThan(UNIT_SPEED[0]);
    expect(UNIT_HP[1]).toBeGreaterThan(UNIT_HP[0]);
    expect(PRODUCTION_INTERVAL.shipyard).toBeGreaterThan(PRODUCTION_INTERVAL.standard);
  });

  it('keeps metadata difficulties in sync and maps unknown difficulties to easy', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('nope')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('computes exact integer square roots', () => {
    expect([0, 1, 3, 4, 99, 100, 101].map(isqrt)).toEqual([0, 1, 1, 2, 9, 10, 10]);
    expect(isqrt(-5)).toBe(0);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2_000_000 }), (n) => {
        const r = isqrt(n);
        expect(r * r).toBeLessThanOrEqual(n);
        expect((r + 1) * (r + 1)).toBeGreaterThan(n);
      })
    );
  });

  it('rotates with an exact integer table', () => {
    expect(rotate(10, 0, 90)).toEqual([0, 10]);
    expect(rotate(10, 20, 180)).toEqual([-10, -20]);
    expect(rotate(0, 200, 120)).toEqual([-173, -100]);
    expect(rotate(0, 200, 240)).toEqual([173, -100]);
    expect(rotate(7, 3, 0)).toEqual([7, 3]);
  });
});

/* ---------- Maps ---------- */

function segmentsCross(p1: MapNode, p2: MapNode, q1: MapNode, q2: MapNode): boolean {
  const cross = (a: MapNode, b: MapNode, c: MapNode) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = cross(q1, q2, p1);
  const d2 = cross(q1, q2, p2);
  const d3 = cross(p1, p2, q1);
  const d4 = cross(p1, p2, q2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function distanceToSegment(p: MapNode, a: MapNode, b: MapNode): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
}

describe('maps', () => {
  it('offers seven original maps per difficulty with 1, 2 or 3 opponents', () => {
    expect(MAPS_PER_DIFFICULTY).toBe(7);
    DIFFICULTIES.forEach((d, i) => {
      for (let m = 0; m < MAPS_PER_DIFFICULTY; m++) {
        const map = getMap(d, m);
        expect(map.factions).toBe(i + 2);
        expect(map.index).toBe(m);
        expect(map.difficulty).toBe(d);
      }
    });
  });

  it('are geometrically clean: inside the board, spaced, planar, no lane through a node', () => {
    for (const d of DIFFICULTIES) {
      for (let m = 0; m < MAPS_PER_DIFFICULTY; m++) {
        const { nodes, lanes } = getMap(d, m);
        expect(nodes.length).toBeGreaterThanOrEqual(10);
        expect(nodes.length).toBeLessThanOrEqual(17);
        for (const n of nodes) {
          expect(n.x).toBeGreaterThanOrEqual(40);
          expect(n.x).toBeLessThanOrEqual(BOARD - 40);
          expect(n.y).toBeGreaterThanOrEqual(40);
          expect(n.y).toBeLessThanOrEqual(BOARD - 40);
        }
        for (let a = 0; a < nodes.length; a++) {
          for (let b = a + 1; b < nodes.length; b++) {
            expect(Math.hypot(nodes[a]!.x - nodes[b]!.x, nodes[a]!.y - nodes[b]!.y)).toBeGreaterThanOrEqual(MIN_NODE_DISTANCE - 2);
          }
        }
        for (const [a, b, len] of lanes) {
          expect(a).toBeLessThan(b);
          expect(len).toBeLessThanOrEqual(MAX_LANE_LENGTH);
          expect(Math.abs(len - Math.hypot(nodes[a]!.x - nodes[b]!.x, nodes[a]!.y - nodes[b]!.y))).toBeLessThan(3);
          nodes.forEach((n, v) => {
            if (v !== a && v !== b) expect(distanceToSegment(n, nodes[a]!, nodes[b]!)).toBeGreaterThan(30);
          });
        }
        for (let i = 0; i < lanes.length; i++) {
          for (let j = i + 1; j < lanes.length; j++) {
            const [a, b] = lanes[i]!;
            const [c, e] = lanes[j]!;
            if (new Set([a, b, c, e]).size === 4) expect(segmentsCross(nodes[a]!, nodes[b]!, nodes[c]!, nodes[e]!)).toBe(false);
          }
        }
      }
    }
  });

  it('are fair: rotationally symmetric starts, topology and lane lengths', () => {
    for (const d of DIFFICULTIES) {
      for (let m = 0; m < MAPS_PER_DIFFICULTY; m++) {
        const map = getMap(d, m);
        expect(isFairMap(map)).toBe(true);
        const n = map.factions;
        const starts = map.nodes.flatMap((node, v) => (node.owner >= 0 ? [v] : []));
        expect(starts.map((v) => map.nodes[v]!.owner)).toEqual([...Array(n).keys()]);
        const k = starts[1]! - starts[0]!;
        const sectors = n * k;
        const rot = (v: number) => (v >= sectors ? v : (v + k) % sectors);
        const lanes = new Map(map.lanes.map(([a, b, len]) => [`${a}-${b}`, len]));
        for (const [a, b, len] of map.lanes) {
          const [ra, rb] = [rot(a), rot(b)].sort((x, y) => x - y) as [number, number];
          expect(lanes.get(`${ra}-${rb}`)).toBe(len);
        }
        map.nodes.forEach((node, v) => {
          const twin = map.nodes[rot(v)]!;
          expect(twin.type).toBe(node.type);
          expect(twin.level).toBe(node.level);
          const [x, y] = rotate(node.x - BOARD / 2, node.y - BOARD / 2, 360 / n);
          expect(Math.abs(twin.x - BOARD / 2 - x)).toBeLessThanOrEqual(1);
          expect(Math.abs(twin.y - BOARD / 2 - y)).toBeLessThanOrEqual(1);
        });
        // The player starts at the bottom, every start at level 10.
        expect(map.nodes[starts[0]!]!.y).toBeGreaterThan(BOARD / 2 + 150);
        for (const v of starts) expect(map.nodes[v]!.level).toBe(10);
      }
    }
  });

  it('rejects unfair maps', () => {
    const map = makeMap(
      [
        { x: 0, y: 0, owner: 0 },
        { x: 100, y: 0, owner: 1 },
        { x: 200, y: 0 }
      ],
      [
        [0, 1],
        [1, 2]
      ]
    );
    expect(isFairMap(map)).toBe(false);
    expect(hops(map, 0)).toEqual([0, 1, 2]);
    const apart = makeMap([{ x: 0, y: 0, owner: 0 }, { x: 100, y: 0 }, { x: 0, y: 0, owner: 1 }], [[0, 1]]);
    expect(hops(apart, 0)).toEqual([0, 1, -1]);
    expect(isFairMap(apart)).toBe(false);
  });

  it('selects the map by seed and generates identical maps every time', () => {
    expect(mapForSeed(0)).toBe(0);
    expect(mapForSeed(15)).toBe(1);
    expect(mapForSeed(-1)).toBe(0xffffffff % 7);
    expect(getMap('medium', 3)).toBe(getMap('medium', 3));
    expect(clone(getMap('hard', 2).lanes)).toMatchSnapshot();
  });
});

/* ---------- New game ---------- */

describe('createGame', () => {
  it('starts paused at tick 0 with the map’s owners and levels', () => {
    const s = createGame(42, 'medium');
    const map = mapOf(s);
    expect(s.map).toBe(42 % 7);
    expect(s.tick).toBe(0);
    expect(s.speed).toBe(1);
    expect(s.result).toBe('playing');
    expect(s.owner).toEqual(map.nodes.map((n) => n.owner));
    expect(s.level).toEqual(map.nodes.map((n) => n.level));
    expect(s.out.every((o) => o.length === 0)).toBe(true);
    expect(s.units).toEqual([]);
    expect(nodeCount(s, 0)).toBe(1);
    expect(nodeCount(s, 2)).toBe(1);
    expect(isValidState(s)).toBe(true);
    expect(createGame(42, 'medium')).toEqual(s);
    expect(createGame(42, 'medium', 5).map).toBe(5);
  });
});

/* ---------- Commands ---------- */

describe('activating and stopping paths', () => {
  it('explains every refusal', () => {
    const map = row();
    const s = stateFor(map);
    expect(refusal(s, map, 0, 1, 2)).toBe('notOwn');
    expect(refusal(s, map, 0, 0, 0)).toBe('self');
    expect(refusal(s, map, 0, 0, 2)).toBe('notAdjacent');
    expect(refusal(s, map, 0, 0, 1)).toBeNull();
    expect(refusal({ ...s, result: 'won' }, map, 0, 0, 1)).toBe('finished');
  });

  it('enforces the path limit at the 9/10 and 19/20 thresholds', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 0, level: 9 }, { x: 100, y: 300 }, { x: 500, y: 300 }, { x: 300, y: 100 }, { x: 300, y: 500 }],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4]
      ]
    );
    const s = stateFor(map);
    expect(toggleMut(s, map, 0, 0, 1).outcome).toBe('on');
    expect(toggleMut(s, map, 0, 0, 2).outcome).toBe('limit');
    s.level[0] = 10;
    expect(toggleMut(s, map, 0, 0, 2).outcome).toBe('on');
    expect(toggleMut(s, map, 0, 0, 3).outcome).toBe('limit');
    s.level[0] = 19;
    expect(toggleMut(s, map, 0, 0, 3).outcome).toBe('limit');
    s.level[0] = 20;
    expect(toggleMut(s, map, 0, 0, 3).outcome).toBe('on');
    s.level[0] = 30;
    expect(toggleMut(s, map, 0, 0, 4).outcome).toBe('limit');
    expect(s.out[0]).toEqual([1, 2, 3]);
    expect(toggleMut(s, map, 0, 0, 2).outcome).toBe('off');
    expect(s.out[0]).toEqual([1, 3]);
  });

  it('allows only one direction between two own nodes, but head-on paths against other factions', () => {
    const map = row({ owner: 0, level: 10 });
    const s = stateFor(map);
    expect(toggleMut(s, map, 0, 0, 1).outcome).toBe('on');
    expect(toggleMut(s, map, 0, 1, 0).outcome).toBe('reverse');
    expect(refusal(s, map, 0, 1, 2)).toBeNull();
    expect(toggleMut(s, map, 1, 2, 1).outcome).toBe('on');
    expect(toggleMut(s, map, 0, 1, 2).outcome).toBe('on');
    expect(s.out[1]).toEqual([2]);
    expect(s.out[2]).toEqual([1]);
    // After stopping the first direction, the reverse is fine.
    expect(toggleMut(s, map, 0, 0, 1).outcome).toBe('off');
    s.level[1] = 1;
    s.out[1] = [];
    expect(toggleMut(s, map, 0, 1, 0).outcome).toBe('on');
  });

  it('only lets the owner stop a path, and nothing after the end', () => {
    const map = row();
    const s = stateFor(map);
    s.out[2] = [1];
    expect(toggleMut(s, map, 0, 2, 1).outcome).toBe('notOwn');
    expect(s.out[2]).toEqual([1]);
    s.result = 'lost';
    expect(toggleMut(s, map, 1, 2, 1).outcome).toBe('finished');
    expect(s.out[2]).toEqual([1]);
  });

  it('toggle is pure and returns the unchanged state on refusal', () => {
    const s = createGame(3, 'easy');
    const map = mapOf(s);
    const start = s.owner.indexOf(0);
    const target = map.adjacent[start]![0]!;
    const before = clone(s);
    const on = toggle(s, 0, start, target);
    expect(on.outcome).toBe('on');
    expect(on.state.out[start]).toEqual([target]);
    expect(s).toEqual(before);
    const off = toggle(on.state, 0, start, target);
    expect(off.outcome).toBe('off');
    expect(off.state.out[start]).toEqual([]);
    const refused = toggle(s, 0, target, start);
    expect(refused.outcome).toBe('notOwn');
    expect(refused.state).toBe(s);
  });
});

/* ---------- Simulation ---------- */

describe('production', () => {
  it('emits one drone per active path every interval, nothing without paths or owner', () => {
    const map = row({ owner: 0, level: 10 });
    const s = stateFor(map);
    s.level[0] = 10;
    for (let i = 0; i < 30; i++) stepMut(s, map);
    expect(s.units).toEqual([]);
    s.out[0] = [1];
    for (let i = 0; i < PRODUCTION_INTERVAL.standard - 1; i++) stepMut(s, map);
    expect(s.units).toHaveLength(0);
    stepMut(s, map);
    expect(s.units).toEqual([{ f: 0, k: 0, a: 0, b: 1, d: UNIT_SPEED[0], hp: 1, h: 0 }]);
    expect(s.stats.produced).toBe(1);
    expect(s.charge[0]).toBe(0);
  });

  it('sends on every active path at once', () => {
    const map = makeMap([{ x: 300, y: 300, owner: 0, level: 10 }, { x: 100, y: 300 }, { x: 500, y: 300 }], [
      [0, 1],
      [0, 2]
    ]);
    const s = stateFor(map);
    s.out[0] = [1, 2];
    s.charge[0] = PRODUCTION_INTERVAL.standard - 1;
    stepMut(s, map);
    expect(s.units.map((u) => u.b)).toEqual([1, 2]);
  });

  it('lets shipyards build frigates and defence platforms build nothing', () => {
    const map = makeMap(
      [
        { x: 100, y: 100, owner: 0, level: 10, type: 'shipyard' },
        { x: 300, y: 100 },
        { x: 300, y: 300, owner: 0, level: 10, type: 'station' },
        { x: 500, y: 100, owner: 1 }
      ],
      [
        [0, 1],
        [1, 2],
        [1, 3]
      ]
    );
    const s = stateFor(map);
    s.out[0] = [1];
    s.out[2] = [1];
    for (let i = 0; i < PRODUCTION_INTERVAL.shipyard - 1; i++) stepMut(s, map);
    expect(s.units).toHaveLength(0);
    stepMut(s, map);
    expect(s.units).toEqual([{ f: 0, k: 1, a: 0, b: 1, d: UNIT_SPEED[1], hp: UNIT_HP[1], h: 0 }]);
    for (let i = 0; i < 100; i++) stepMut(s, map);
    expect(s.units.every((u) => u.a === 0)).toBe(true);
  });

  it('neutral nodes never produce', () => {
    const map = row();
    const s = stateFor(map);
    s.out[1] = [2];
    s.charge[1] = 9;
    stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.charge[1]).toBe(9);
  });
});

describe('arrivals', () => {
  it('moves units by their speed and raises the level of an own node', () => {
    const map = row({ owner: 0, level: 4 });
    const s = stateFor(map);
    const u = addUnit(s, { f: 0, a: 0, b: 1, d: 190 });
    stepMut(s, map);
    expect(u.d).toBe(195);
    expect(s.level[1]).toBe(4);
    stepMut(s, map);
    expect(s.units).toHaveLength(0);
    expect(s.level[1]).toBe(5);
    expect(s.stats.reinforced).toBe(1);
  });

  it('counts a frigate three times, capped at level 30', () => {
    const map = row({ owner: 0, level: 5 });
    const s = stateFor(map);
    addUnit(s, { f: 0, k: 1, a: 0, b: 1, d: 199 });
    stepMut(s, map);
    expect(s.level[1]).toBe(8);
    s.level[1] = 29;
    addUnit(s, { f: 0, k: 1, a: 0, b: 1, d: 199 });
    stepMut(s, map);
    expect(s.level[1]).toBe(30);
  });

  it('passes units on at maximum level along the node’s active paths', () => {
    const map = row({ owner: 0, level: MAX_LEVEL });
    const s = stateFor(map);
    s.out[1] = [2];
    addUnit(s, { f: 0, a: 0, b: 1, d: 199 });
    stepMut(s, map);
    expect(s.level[1]).toBe(MAX_LEVEL);
    expect(s.units).toEqual([{ f: 0, k: 0, a: 1, b: 2, d: 0, hp: 1, h: 1 }]);
    expect(s.stats.passed).toBe(1);
    expect(accountedUnits(s)).toBe(s.stats.produced);
  });

  it('spreads passed units round robin over several paths', () => {
    const map = makeMap(
      [{ x: 100, y: 300, owner: 0, level: 10 }, { x: 300, y: 300, owner: 0, level: 30 }, { x: 500, y: 200 }, { x: 500, y: 400 }],
      [
        [0, 1],
        [1, 2],
        [1, 3]
      ]
    );
    const s = stateFor(map);
    s.out[1] = [2, 3];
    addUnit(s, { f: 0, a: 0, b: 1, d: 199 });
    addUnit(s, { f: 0, a: 0, b: 1, d: 198 });
    stepMut(s, map);
    expect(s.units.map((u) => u.b)).toEqual([2, 3]);
  });

  it('absorbs units at a full node without paths, and after MAX_HOPS forwards', () => {
    const map = row({ owner: 0, level: MAX_LEVEL });
    const s = stateFor(map);
    addUnit(s, { f: 0, a: 0, b: 1, d: 199 });
    stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.stats.absorbed).toBe(1);
    s.out[1] = [2];
    addUnit(s, { f: 0, a: 0, b: 1, d: 199, h: MAX_HOPS });
    stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.stats.absorbed).toBe(2);
    addUnit(s, { f: 0, a: 0, b: 1, d: 199, h: MAX_HOPS - 1 });
    stepMut(s, map);
    expect(s.units[0]?.h).toBe(MAX_HOPS);
  });

  it('lowers a neutral node to level 1, then the next unit converts it', () => {
    const map = row({ level: 2 });
    const s = stateFor(map);
    addUnit(s, { f: 0, a: 0, b: 1, d: 199 });
    let events = stepMut(s, map);
    expect(s.level[1]).toBe(1);
    expect(s.owner[1]).toBe(-1);
    expect(events.captures).toEqual([]);
    addUnit(s, { f: 0, a: 0, b: 1, d: 199 });
    events = stepMut(s, map);
    expect(s.owner[1]).toBe(0);
    expect(s.level[1]).toBe(1);
    expect(events.captures).toEqual([[1, 0, -1]]);
    expect(s.stats.captured).toBe(1);
    expect(s.stats.hits).toBe(2);
  });

  it('applies a frigate’s points one by one; leftovers reinforce the new owner', () => {
    const map = row({ level: 2 });
    const s = stateFor(map);
    addUnit(s, { f: 0, k: 1, a: 0, b: 1, d: 199 });
    stepMut(s, map);
    expect(s.owner[1]).toBe(0);
    expect(s.level[1]).toBe(2);
  });

  it('captures enemy nodes the same way and clears their paths', () => {
    const map = row({ owner: 1, level: 1 });
    const s = stateFor(map);
    s.out[1] = [0];
    s.charge[1] = 5;
    addUnit(s, { f: 0, a: 0, b: 1, d: 199 });
    stepMut(s, map);
    expect(s.owner[1]).toBe(0);
    expect(s.out[1]).toEqual([]);
    expect(s.charge[1]).toBe(0);
    // An opponent's capture does not count as the player's.
    addUnit(s, { f: 1, a: 2, b: 1, d: 199 });
    const events = stepMut(s, map);
    expect(events.captures).toEqual([[1, 1, 0]]);
    expect(s.stats.captured).toBe(1);
  });

  it('stops the newest paths when the level drops below a threshold', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 0, level: 10 }, { x: 100, y: 300, owner: 1, level: 5 }, { x: 500, y: 300 }],
      [
        [0, 1],
        [0, 2]
      ]
    );
    const s = stateFor(map);
    s.out[0] = [2, 1];
    addUnit(s, { f: 1, a: 1, b: 0, d: 199 });
    stepMut(s, map);
    expect(s.level[0]).toBe(9);
    expect(s.out[0]).toEqual([2]);
  });
});

describe('head-on fights', () => {
  it('annihilates opposing drones where they meet mid-lane', () => {
    const map = row();
    const s = stateFor(map);
    addUnit(s, { f: 0, a: 0, b: 1, d: 95 });
    addUnit(s, { f: 1, a: 1, b: 0, d: 95 });
    stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.stats.fought).toBe(2);
  });

  it('does not fight before the units meet', () => {
    const map = row();
    const s = stateFor(map);
    addUnit(s, { f: 0, a: 0, b: 1, d: 90 });
    addUnit(s, { f: 1, a: 1, b: 0, d: 90 });
    stepMut(s, map);
    expect(s.units).toHaveLength(2);
    stepMut(s, map);
    expect(s.units).toHaveLength(0);
  });

  it('lets units of the same faction pass each other', () => {
    const map = row({ owner: 0, level: 10 });
    const s = stateFor(map);
    addUnit(s, { f: 0, a: 0, b: 1, d: 100 });
    addUnit(s, { f: 0, a: 1, b: 0, d: 100 });
    stepMut(s, map);
    expect(s.units).toHaveLength(2);
  });

  it('a frigate survives a drone with reduced armour, and drone streams wear it down', () => {
    const map = row();
    const s = stateFor(map);
    const frigate = addUnit(s, { f: 1, k: 1, a: 1, b: 0, d: 100 });
    addUnit(s, { f: 0, a: 0, b: 1, d: 100 });
    const second = addUnit(s, { f: 0, a: 0, b: 1, d: 88 });
    stepMut(s, map);
    expect(s.units).toEqual([frigate, second]);
    expect(frigate.hp).toBe(UNIT_HP[1] - 1);
    stepMut(s, map);
    expect(s.units).toEqual([frigate]);
    expect(frigate.hp).toBe(UNIT_HP[1] - 2);
    expect(s.stats.fought).toBe(2);
  });

  it('matches the front-most units first, whatever their order in the list', () => {
    const map = row();
    const s = stateFor(map);
    addUnit(s, { f: 1, a: 1, b: 0, d: 50 });
    const front = addUnit(s, { f: 1, a: 1, b: 0, d: 100 });
    const behind = addUnit(s, { f: 0, a: 0, b: 1, d: 95 });
    const lead = addUnit(s, { f: 0, a: 0, b: 1, d: 100 });
    stepMut(s, map);
    expect(s.units).not.toContain(front);
    expect(s.units).not.toContain(lead);
    expect(s.units).toContain(behind);
    expect(s.units).toHaveLength(2);
  });

  it('fights opposing frigates to mutual destruction', () => {
    const map = row();
    const s = stateFor(map);
    addUnit(s, { f: 0, k: 1, a: 0, b: 1, d: 100 });
    addUnit(s, { f: 1, k: 1, a: 1, b: 0, d: 100 });
    stepMut(s, map);
    expect(s.units).toEqual([]);
  });
});

describe('defence platforms', () => {
  /** Station 3 (player) sits 80 below the middle of the lane 1–2. */
  const guarded = (level: number, owner = 0) =>
    makeMap(
      [{ x: 100, y: 100, owner: 0, level: 10 }, { x: 300, y: 100 }, { x: 500, y: 100, owner: 1, level: 10 }, { x: 295, y: 180, type: 'station', owner, level }],
      [
        [0, 1],
        [1, 2],
        [1, 3]
      ]
    );

  it('shoots the nearest hostile unit in range every SHOT_INTERVAL ticks', () => {
    const map = guarded(10);
    const s = stateFor(map);
    s.charge[3] = SHOT_INTERVAL - 1;
    addUnit(s, { f: 1, a: 1, b: 2, d: 0 });
    const events = stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.stats.shot).toBe(1);
    expect(events.shots).toEqual([[3, 305, 100]]);
    expect(s.charge[3]).toBe(0);
  });

  it('waits for its charge and ignores own units', () => {
    const map = guarded(10);
    const s = stateFor(map);
    s.charge[3] = SHOT_INTERVAL - 2;
    addUnit(s, { f: 1, a: 1, b: 2, d: 0 });
    addUnit(s, { f: 0, a: 1, b: 2, d: 5 });
    stepMut(s, map);
    expect(s.units).toHaveLength(2);
    stepMut(s, map);
    expect(s.units.map((u) => u.f)).toEqual([0]);
  });

  it('never targets own units even when they are closest', () => {
    const map = guarded(10);
    const s = stateFor(map);
    s.charge[3] = SHOT_INTERVAL;
    const own = addUnit(s, { f: 0, a: 1, b: 2, d: 0 });
    addUnit(s, { f: 1, a: 1, b: 2, d: 15 });
    stepMut(s, map);
    expect(s.units).toEqual([own]);
  });

  it('reaches further at higher level', () => {
    const near = stateFor(guarded(1));
    near.charge[3] = SHOT_INTERVAL;
    addUnit(near, { f: 1, a: 1, b: 2, d: 0 });
    stepMut(near, guarded(1));
    expect(near.units).toHaveLength(1);
    const map = guarded(10);
    const far = stateFor(map);
    far.charge[3] = SHOT_INTERVAL;
    addUnit(far, { f: 1, a: 1, b: 2, d: 0 });
    stepMut(far, map);
    expect(far.units).toHaveLength(0);
  });

  it('needs several hits for a frigate and does nothing while neutral', () => {
    const map = guarded(10);
    const s = stateFor(map);
    s.charge[3] = SHOT_INTERVAL;
    const frigate = addUnit(s, { f: 1, k: 1, a: 1, b: 2, d: 0 });
    stepMut(s, map);
    expect(frigate.hp).toBe(UNIT_HP[1] - 1);
    const neutral = stateFor(guarded(10, -1));
    neutral.charge[3] = SHOT_INTERVAL;
    addUnit(neutral, { f: 1, a: 1, b: 2, d: 0 });
    stepMut(neutral, guarded(10, -1));
    expect(neutral.units).toHaveLength(1);
    expect(neutral.charge[3]).toBe(0);
  });

  it('can relay arriving units at level 30', () => {
    const map = guarded(MAX_LEVEL);
    const s = stateFor(map);
    s.owner[1] = 0;
    s.level[1] = 10;
    expect(toggleMut(s, map, 0, 3, 1).outcome).toBe('on');
    for (let i = 0; i < 40; i++) stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.stats.produced).toBe(0);
  });
});

describe('positions, results and time', () => {
  it('interpolates integer positions along the lane', () => {
    const map = row();
    expect(unitPosition(map, { f: 0, k: 0, a: 0, b: 1, d: 50, hp: 1, h: 0 })).toEqual([150, 100]);
    expect(unitPosition(map, { f: 0, k: 0, a: 1, b: 0, d: 50, hp: 1, h: 0 })).toEqual([250, 100]);
    expect(unitPosition(map, { f: 0, k: 0, a: 0, b: 1, d: 250, hp: 1, h: 0 })).toEqual([300, 100]);
    const diagonal = makeMap([{ x: 0, y: 0 }, { x: 300, y: 400 }], [[0, 1]]);
    expect(unitPosition(diagonal, { f: 0, k: 0, a: 0, b: 1, d: 250, hp: 1, h: 0 })).toEqual([150, 200]);
    expect(unitPosition(diagonal, { f: 0, k: 0, a: 1, b: 0, d: 100, hp: 1, h: 0 })).toEqual([240, 320]);
  });

  it('ends with a loss when the player has no nodes and a win when no opponent has any', () => {
    const map = row();
    const s = stateFor(map);
    s.owner = [1, -1, 1];
    updateResult(s);
    expect(s.result).toBe('lost');
    const w = stateFor(map);
    w.owner = [0, -1, -1];
    updateResult(w);
    expect(w.result).toBe('won');
    const p = stateFor(map);
    updateResult(p);
    expect(p.result).toBe('playing');
    // No further change once decided.
    s.owner = [0, -1, -1];
    updateResult(s);
    expect(s.result).toBe('lost');
  });

  it('wins by capturing the last opponent node and then stops', () => {
    const map = row({ owner: 0, level: 10 });
    const s = stateFor(map);
    s.level[2] = 1;
    addUnit(s, { f: 0, a: 1, b: 2, d: 199 });
    stepMut(s, map);
    expect(s.result).toBe('won');
    const tick = s.tick;
    const after = stepMut(s, map);
    expect(s.tick).toBe(tick);
    expect(after).toEqual({ captures: [], shots: [] });
  });

  it('counts whole seconds of game time', () => {
    expect(seconds({ tick: 0 })).toBe(0);
    expect(seconds({ tick: 19 })).toBe(1);
    expect(seconds({ tick: 600 })).toBe(60);
  });

  it('pure step leaves its input untouched', () => {
    const s = createGame(9, 'easy');
    const start = s.owner.indexOf(0);
    s.out[start] = [mapOf(s).adjacent[start]![0]!];
    const before = clone(s);
    const next = step(s, 25);
    expect(s).toEqual(before);
    expect(next.tick).toBe(25);
    expect(next.units.length).toBeGreaterThan(0);
  });
});

/* ---------- Opponents ---------- */

describe('opponent heuristics', () => {
  it('expands to the weakest reachable neutral', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 1, level: 5 }, { x: 100, y: 300, level: 9 }, { x: 500, y: 300, level: 2 }, { x: 300, y: 500, owner: 0, level: 5 }],
      [
        [0, 1],
        [0, 2],
        [1, 3]
      ]
    );
    expect(decide(stateFor(map), map, 1, quiet, createRng(1))).toEqual([{ from: 0, to: 2 }]);
  });

  it('answers a head-on attack when it counters, otherwise expands', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 1, level: 5 }, { x: 100, y: 300, owner: 0, level: 25 }, { x: 500, y: 300, level: 2 }],
      [
        [0, 1],
        [0, 2]
      ]
    );
    const s = stateFor(map);
    s.out[1] = [0];
    expect(decide(s, map, 1, { ...quiet, counter: true }, createRng(1))).toEqual([{ from: 0, to: 1 }]);
    expect(decide(s, map, 1, quiet, createRng(1))).toEqual([{ from: 0, to: 2 }]);
  });

  it('reinforces a node that is about to fall', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 1, level: 12 }, { x: 100, y: 300, owner: 1, level: 3 }, { x: 100, y: 100, owner: 0, level: 5 }],
      [
        [0, 1],
        [1, 2]
      ]
    );
    const s = stateFor(map);
    for (let i = 0; i < 3; i++) addUnit(s, { f: 0, a: 2, b: 1, d: 10 * i });
    expect(incomingThreat(s, 1)).toEqual([0, 3, 0]);
    expect(decide(s, map, 1, { ...quiet, defend: true, actions: 1 }, createRng(1))).toEqual([{ from: 0, to: 1 }]);
  });

  it('stops feeding a full node that passes nothing on', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 1, level: 5 }, { x: 100, y: 300, owner: 1, level: MAX_LEVEL }, { x: 100, y: 100, owner: 0, level: 5 }],
      [
        [0, 1],
        [1, 2]
      ]
    );
    const s = stateFor(map);
    s.out[0] = [1];
    const commands = decide(s, map, 1, quiet, createRng(1));
    expect(commands[0]).toEqual({ from: 0, to: 1 });
    expect(s.out[0]).toEqual([1]);
  });

  it('supplies the frontier from interior nodes', () => {
    const map = makeMap(
      [{ x: 100, y: 300, owner: 1, level: 5 }, { x: 300, y: 300, owner: 1, level: 25 }, { x: 500, y: 300, owner: 0, level: 29 }],
      [
        [0, 1],
        [1, 2]
      ]
    );
    const s = stateFor(map);
    s.out[1] = [2];
    expect(frontierDistance(s, map, 1)).toEqual([2, 1, 0]);
    expect(decide(s, map, 1, { ...quiet, actions: 1 }, createRng(2))).toEqual([{ from: 0, to: 1 }]);
  });

  it('respects the action budget, hesitation and elimination', () => {
    const s = createGame(5, 'hard');
    const map = mapOf(s);
    expect(decide(s, map, 1, { ...PROFILES.hard, actions: 1 }, createRng(3)).length).toBeLessThanOrEqual(1);
    expect(decide(s, map, 1, { ...PROFILES.hard, hesitation: 1 }, createRng(3))).toEqual([]);
    const gone = { ...s, owner: s.owner.map((o) => (o === 2 ? -1 : o)) };
    expect(decide(gone, map, 2, PROFILES.hard, createRng(3))).toEqual([]);
  });

  it('decides on a staggered schedule, harder opponents more often', () => {
    expect(PROFILES.easy.period).toBeGreaterThan(PROFILES.medium.period);
    expect(PROFILES.medium.period).toBeGreaterThan(PROFILES.hard.period);
    expect(isDecisionTick(7, 1, PROFILES.hard)).toBe(true);
    expect(isDecisionTick(8, 1, PROFILES.hard)).toBe(false);
    expect(isDecisionTick(14, 2, PROFILES.hard)).toBe(true);
    expect(isDecisionTick(0, 0, { ...PROFILES.hard, period: 1 })).toBe(false);
  });

  it('never issues an illegal command and stays deterministic (all difficulties)', () => {
    for (const d of DIFFICULTIES) {
      const outcomes: string[] = [];
      const a = simulate(createGame(11, d), 900, undefined, (_f, _c, outcome) => outcomes.push(outcome));
      expect(outcomes.length).toBeGreaterThan(5);
      expect(outcomes.every((o) => o === 'on' || o === 'off')).toBe(true);
      expect(simulate(createGame(11, d), 900)).toEqual(a);
      expect(isValidState(clone(a))).toBe(true);
    }
  }, 60_000);

  it('opponents fight each other too', () => {
    const s = createGame(4, 'hard');
    let rivalCaptures = 0;
    simulate(s, 3000, (events) => {
      for (const [, now, before] of events.captures) if (now > 0 && before > 0) rivalCaptures++;
    });
    expect(rivalCaptures).toBeGreaterThan(0);
  }, 60_000);
});

/* ---------- Properties ---------- */

interface Script {
  seed: number;
  difficulty: Difficulty;
  moves: { wait: number; pick: number; target: number }[];
}

const scriptArb: fc.Arbitrary<Script> = fc.record({
  seed: fc.integer({ min: 0, max: 0xffff_ffff }),
  difficulty: fc.constantFrom(...DIFFICULTIES),
  moves: fc.array(fc.record({ wait: fc.integer({ min: 0, max: 80 }), pick: fc.nat(), target: fc.nat() }), { maxLength: 12 })
});

/** Plays a script: waits, then has the player toggle a path from one of its nodes. */
function play(script: Script, check?: (s: NcState) => void): NcState {
  let s = createGame(script.seed, script.difficulty);
  for (const move of script.moves) {
    s = simulate(s, move.wait);
    check?.(s);
    const own = s.owner.flatMap((o, v) => (o === 0 ? [v] : []));
    if (own.length === 0 || s.result !== 'playing') break;
    const from = own[move.pick % own.length]!;
    const adjacent = mapOf(s).adjacent[from]!;
    s = toggle(s, 0, from, adjacent[move.target % adjacent.length]!).state;
  }
  return simulate(s, 50);
}

describe('properties', () => {
  it('same seed and same commands give the same state', () => {
    fc.assert(
      fc.property(scriptArb, (script) => {
        expect(play(script)).toEqual(play(script));
      }),
      { numRuns: 25 }
    );
  }, 60_000);

  it('accounts for every unit, keeps levels in 1–30 and states valid', () => {
    fc.assert(
      fc.property(scriptArb, (script) => {
        const check = (s: NcState) => {
          expect(accountedUnits(s)).toBe(s.stats.produced);
          expect(s.level.every((l) => l >= 1 && l <= MAX_LEVEL)).toBe(true);
          expect(s.units.every((u) => u.hp > 0 && u.d >= 0)).toBe(true);
          s.out.forEach((paths, v) => expect(paths.length).toBeLessThanOrEqual(maxPaths(s.level[v]!)));
          expect(isValidState(clone(s))).toBe(true);
        };
        check(play(script, check));
      }),
      { numRuns: 25 }
    );
  }, 60_000);

  it('restores mid-battle exactly from a JSON save', () => {
    const script: Script = { seed: 77, difficulty: 'medium', moves: [{ wait: 0, pick: 0, target: 0 }, { wait: 150, pick: 0, target: 1 }] };
    const mid = play(script);
    expect(mid.units.length).toBeGreaterThan(0);
    const saved = clone(mid);
    expect(isValidState(saved)).toBe(true);
    expect(saved).toEqual(mid);
    expect(simulate(saved, 400)).toEqual(simulate(mid, 400));
    expect(cloneState(mid)).toEqual(mid);
  }, 30_000);
});

/* ---------- Validation ---------- */

describe('isValidState', () => {
  const base = () => {
    const s = createGame(21, 'easy');
    const start = s.owner.indexOf(0);
    s.out[start] = [mapOf(s).adjacent[start]![0]!];
    return simulate(s, 60);
  };

  it('accepts real states', () => {
    expect(isValidState(base())).toBe(true);
  });

  it('rejects tampered data', () => {
    const tamper: ((s: NcState & Record<string, unknown>) => void)[] = [
      (s) => (s.seed = -1),
      (s) => (s.difficulty = 'extreme' as Difficulty),
      (s) => (s.map = MAPS_PER_DIFFICULTY),
      (s) => (s.tick = -1),
      (s) => (s.speed = 3 as 1),
      (s) => (s.rng = 1.5),
      (s) => (s.result = 'draw' as 'won'),
      (s) => (s.stats = { ...s.stats, shot: -1 }),
      (s) => (s.stats = { ...s.stats, captured: -1 }),
      (s) => (s.stats = { ...s.stats, passed: 0.5 }),
      (s) => (s.owner = [...s.owner, 0]),
      (s) => (s.owner[1] = 5),
      (s) => (s.owner[s.owner.indexOf(-1)] = mapOf(s).factions),
      (s) => {
        const v = s.owner.indexOf(-1);
        s.out[v] = [mapOf(s).adjacent[v]![0]!];
      },
      (s) => {
        const v = s.owner.indexOf(0);
        const far = s.owner.findIndex((_, w) => w !== v && mapOf(s).laneOf[v]![w]! < 0);
        s.out[v] = [far];
      },
      (s) => (s.units[0]!.f = mapOf(s).factions),
      (s) => (s.level[0] = 0),
      (s) => (s.level[0] = MAX_LEVEL + 1),
      (s) => (s.charge[0] = 99),
      (s) => (s.out = s.out.slice(1)),
      (s) => (s.out[s.owner.indexOf(-1)] = [0]),
      (s) => (s.out[s.owner.indexOf(0)] = [s.owner.indexOf(0)]),
      (s) => {
        const v = s.owner.indexOf(0);
        s.out[v] = [s.out[v]![0]!, s.out[v]![0]!];
      },
      (s) => {
        const v = s.owner.indexOf(0);
        s.level[v] = 9;
        s.out[v] = [...mapOf(s).adjacent[v]!.slice(0, 2)];
      },
      (s) => {
        const v = s.owner.indexOf(0);
        const w = s.out[v]![0]!;
        s.owner[w] = 0;
        s.out[w] = [v];
      },
      (s) => (s.units = [{ f: 0, k: 0, a: 0, b: 0, d: 0, hp: 1, h: 0 }]),
      (s) => (s.units[0]!.hp = 2),
      (s) => (s.units[0]!.h = MAX_HOPS + 1),
      (s) => (s.units[0]!.d = 9999),
      (s) => (s.units[0]!.f = 7),
      (s) => (s.units[0]!.k = 2 as 0),
      (s) => s.units.push({ ...s.units[0]! }),
      (s) => (s.units = Array.from({ length: MAX_UNITS + 1 }, () => s.units[0]!)),
      (s) => (s.result = 'won'),
      (s) => (s.result = 'lost'),
      (s) => (s.owner = s.owner.map((o) => (o > 0 ? -1 : o))),
      (s) => (s.units = 'none' as unknown as Unit[]),
      (s) => (s.out = {} as unknown as number[][])
    ];
    tamper.forEach((change, i) => {
      const s = clone(base()) as NcState & Record<string, unknown>;
      change(s);
      expect(isValidState(s), `tamper #${i}`).toBe(false);
    });
  });

  it('rejects a running match without player or without opponents', () => {
    const lost = createGame(21, 'easy');
    lost.owner[lost.owner.indexOf(0)] = -1;
    expect(isValidState(lost)).toBe(false);
    const won = createGame(21, 'easy');
    won.owner = won.owner.map((o) => (o > 0 ? -1 : o));
    expect(isValidState(won)).toBe(false);
  });

  it('accepts finished states that are consistent', () => {
    const map = mapOf(createGame(21, 'easy'));
    const s = createGame(21, 'easy');
    s.owner = map.nodes.map((n) => (n.owner > 0 ? 0 : n.owner));
    s.result = 'won';
    expect(isValidState(s)).toBe(true);
    s.owner = map.nodes.map((n) => (n.owner === 0 ? 1 : n.owner));
    s.result = 'lost';
    expect(isValidState(s)).toBe(true);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidState(value)).not.toThrow();
      }),
      { numRuns: 300 }
    );
    expect(isValidState({ ...createGame(1), stats: null })).toBe(false);
  });
});

describe('opponents controller', () => {
  it('persists the PRNG only when an opponent decided', () => {
    const s = createGame(6, 'easy');
    const map = mapOf(s);
    const control = opponents();
    s.tick = 1;
    control(s, map);
    expect(s.rng).toBe(createGame(6, 'easy').rng);
    s.tick = 7;
    control(s, map);
    expect(s.rng).not.toBe(createGame(6, 'easy').rng);
  });
});

describe('opponent heuristics in detail', () => {
  /** Star: centre 0 (faction 1) with four neighbours 1–4. */
  const star = (specs: Partial<NodeSpec>[], centre: Partial<NodeSpec> = {}) =>
    makeMap(
      [
        { x: 300, y: 300, owner: 1, level: 5, ...centre },
        { x: 100, y: 300, ...specs[0] },
        { x: 500, y: 300, ...specs[1] },
        { x: 300, y: 100, ...specs[2] },
        { x: 300, y: 500, owner: 0, level: 30, ...specs[3] }
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4]
      ]
    );

  it('counts only hostile strength heading for own nodes', () => {
    const map = row({ owner: 1, level: 5 });
    const s = stateFor(map);
    addUnit(s, { f: 0, a: 0, b: 1 });
    addUnit(s, { f: 0, k: 1, a: 0, b: 1 });
    addUnit(s, { f: 1, a: 2, b: 1 });
    addUnit(s, { f: 1, a: 1, b: 0 });
    expect(incomingThreat(s, 1)).toEqual([0, 4, 0]);
    expect(incomingThreat(s, 0)).toEqual([1, 0, 0]);
  });

  it('prefers shipyards, then platforms, among equally weak neutrals', () => {
    const map = star([{ level: 4 }, { level: 4, type: 'shipyard' }, { level: 4, type: 'station' }]);
    expect(decide(stateFor(map), map, 1, { ...quiet, actions: 1 }, createRng(1))).toEqual([{ from: 0, to: 2 }]);
    const noYard = star([{ level: 4 }, { level: 4 }, { level: 4, type: 'station' }]);
    expect(decide(stateFor(noYard), noYard, 1, { ...quiet, actions: 1 }, createRng(1))).toEqual([{ from: 0, to: 3 }]);
  });

  it('avoids strong hostile nodes while weaker targets exist, but never idles', () => {
    const map = star([{ level: 9 }, { owner: 0, level: 12 }, { owner: 0, level: 3 }]);
    const s = stateFor(map);
    expect(decide(s, map, 1, { ...quiet, actions: 1 }, createRng(1))).toEqual([{ from: 0, to: 3 }]);
    const strong = star([{ owner: 0, level: 25 }, { owner: 0, level: 25 }, { owner: 0, level: 25 }]);
    expect(decide(stateFor(strong), strong, 1, { ...quiet, actions: 1 }, createRng(1))).toHaveLength(1);
  });

  it('joins an attack other own nodes already make', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 1, level: 5 }, { x: 100, y: 300, level: 6 }, { x: 500, y: 300, level: 5 }, { x: 100, y: 100, owner: 1, level: 5 }, { x: 100, y: 500, owner: 0 }],
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4]
      ]
    );
    const s = stateFor(map);
    s.out[3] = [1];
    const commands = decide(s, map, 1, { ...quiet, actions: 1 }, createRng(1));
    expect(commands).toEqual([{ from: 0, to: 1 }]);
  });

  it('skips targets it already sends to and uses platforms only at full level', () => {
    const map = star([{ level: 2 }, { level: 3 }, { level: 9 }], { level: 10 });
    const s = stateFor(map);
    s.out[0] = [1];
    expect(decide(s, map, 1, { ...quiet, actions: 1 }, createRng(1))).toEqual([{ from: 0, to: 2 }]);
    const platform = star([{ level: 2 }, { level: 3 }, { level: 9 }], { type: 'station', level: 29 });
    expect(decide(stateFor(platform), platform, 1, quiet, createRng(1))).toEqual([]);
    const full = star([{ level: 2 }, { level: 3 }, { level: 9 }], { type: 'station', level: MAX_LEVEL });
    expect(decide(stateFor(full), full, 1, { ...quiet, actions: 1 }, createRng(1))).toEqual([{ from: 0, to: 1 }]);
  });

  it('counters the weakest attacker, never neutrals, and only with free capacity', () => {
    const map = star([{ owner: 0, level: 8 }, { owner: 0, level: 4 }, { level: 2 }]);
    const s = stateFor(map);
    s.out[1] = [0];
    s.out[2] = [0];
    const profile = { ...quiet, counter: true, actions: 1 };
    expect(decide(s, map, 1, profile, createRng(1))).toEqual([{ from: 0, to: 2 }]);
    const busy = cloneState(s);
    busy.out[0] = [3];
    expect(decide(busy, map, 1, profile, createRng(1))).toEqual([]);
    const neutralOnly = stateFor(map);
    neutralOnly.out[3] = [0];
    neutralOnly.owner[3] = -1;
    expect(decide(neutralOnly, map, 1, profile, createRng(1))).toEqual([{ from: 0, to: 3 }]);
  });

  it('defends the node in most danger with an own neighbour', () => {
    const map = makeMap(
      [
        { x: 300, y: 300, owner: 1, level: 12 },
        { x: 100, y: 300, owner: 1, level: 3 },
        { x: 500, y: 300, owner: 1, level: 2 },
        { x: 100, y: 100, owner: 0, level: 5 },
        { x: 500, y: 100, owner: 0, level: 5 }
      ],
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 4]
      ]
    );
    const s = stateFor(map);
    addUnit(s, { f: 0, a: 3, b: 1 });
    addUnit(s, { f: 0, a: 3, b: 1 });
    addUnit(s, { f: 0, a: 3, b: 1 });
    addUnit(s, { f: 0, k: 1, a: 4, b: 2 });
    addUnit(s, { f: 0, k: 1, a: 4, b: 2 });
    const profile = { ...quiet, defend: true, actions: 1 };
    expect(decide(s, map, 1, profile, createRng(1))).toEqual([{ from: 0, to: 2 }]);
    expect(decide(s, map, 1, { ...profile, actions: 2 }, createRng(1))).toEqual([
      { from: 0, to: 2 },
      { from: 0, to: 1 }
    ]);
    const calm = stateFor(map);
    addUnit(calm, { f: 0, a: 3, b: 1 });
    expect(decide(calm, map, 1, { ...profile, actions: 1 }, createRng(1))).not.toEqual([{ from: 0, to: 1 }]);
  });

  it('keeps feeding full nodes that pass units on, and own nodes that are not full', () => {
    const map = makeMap(
      [{ x: 300, y: 300, owner: 1, level: 5 }, { x: 100, y: 300, owner: 1, level: MAX_LEVEL }, { x: 500, y: 300, owner: 1, level: 29 }, { x: 100, y: 100, owner: 0, level: 5 }],
      [
        [0, 1],
        [0, 2],
        [1, 3]
      ]
    );
    const s = stateFor(map);
    s.out[1] = [3];
    s.out[0] = [1];
    s.level[0] = 10;
    s.out[0] = [1, 2];
    expect(decide(s, map, 1, quiet, createRng(1)).filter((c) => c.from === 0)).toEqual([]);
  });

  it('does not supply full dead ends or nodes further from the front', () => {
    const map = makeMap(
      [{ x: 100, y: 300, owner: 1, level: 5 }, { x: 300, y: 300, owner: 1, level: MAX_LEVEL }, { x: 500, y: 300, owner: 0, level: 29 }],
      [
        [0, 1],
        [1, 2]
      ]
    );
    const s = stateFor(map);
    s.out[1] = [2];
    s.level[1] = MAX_LEVEL;
    const dead = cloneState(s);
    dead.out[1] = [];
    expect(decide(dead, map, 1, { ...quiet, actions: 3 }, createRng(1)).some((c) => c.from === 0)).toBe(false);
    expect(decide(s, map, 1, { ...quiet, actions: 3 }, createRng(1))).toContainEqual({ from: 0, to: 1 });
  });

  it('does nothing in a finished match and honours the per-decision budget exactly', () => {
    const map = makeMap(
      [
        { x: 100, y: 300, owner: 1 },
        { x: 300, y: 300, owner: 1 },
        { x: 500, y: 300, owner: 1 },
        { x: 100, y: 100 },
        { x: 300, y: 100 },
        { x: 500, y: 100 },
        { x: 300, y: 500, owner: 0 }
      ],
      [
        [0, 3],
        [1, 4],
        [2, 5],
        [1, 6]
      ]
    );
    expect(decide({ ...stateFor(map), result: 'won' }, map, 1, quiet, createRng(1))).toEqual([]);
    expect(decide(stateFor(map), map, 1, { ...quiet, actions: 2 }, createRng(1))).toHaveLength(2);
    // One new path per node and decision: three own nodes give at most three changes.
    expect(decide(stateFor(map), map, 1, { ...quiet, actions: 5 }, createRng(1))).toHaveLength(3);
  });

  it('configures easy as slow and passive, medium and hard as reactive', () => {
    expect(PROFILES.easy).toMatchObject({ counter: false, defend: false, actions: 1 });
    expect(PROFILES.medium).toMatchObject({ counter: true, defend: true, actions: 2 });
    expect(PROFILES.hard).toMatchObject({ counter: true, defend: true, actions: 3, hesitation: 0 });
    expect(PROFILES.easy.attackLevel).toBeLessThan(PROFILES.hard.attackLevel);
  });

  it('simulates exactly the requested number of ticks', () => {
    expect(simulate(createGame(1, 'easy'), 37).tick).toBe(37);
    expect(simulate(createGame(1, 'easy'), 0)).toEqual(createGame(1, 'easy'));
  });
});
