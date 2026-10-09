import type { Rng } from '@wp/game-core';
import { isqrt, type MapNode } from '../src/maps';
import { HISTORY_EVERY, UNIT_HP, type GameMap, type NcState, type NodeType, type Unit } from '../src/rules';
import type { AiProfile } from '../src/ai';

/* Small hand-made maps and helpers for precise rule and opponent tests. */

export interface NodeSpec {
  x: number;
  y: number;
  type?: NodeType;
  level?: number;
  owner?: number;
}

/** A map from node specs (default: neutral standard node at level 5) and lanes in the given order. */
export function makeMap(specs: NodeSpec[], pairs: [number, number][], factions = 2, center = -1): GameMap {
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
  return { index: 0, layout: 2, factions, nodes, lanes, laneOf, adjacent, center };
}

/** A running match on `map` at tick 0 with the map's owners and levels. */
export function stateFor(map: GameMap): NcState {
  return {
    seed: 1,
    difficulty: 'beginner',
    opponents: 1,
    map: 0,
    layout: 2,
    tick: 0,
    speed: 1,
    owner: map.nodes.map((n) => n.owner),
    level: map.nodes.map((n) => n.level),
    out: map.nodes.map(() => []),
    charge: map.nodes.map(() => 0),
    half: map.nodes.map(() => 0),
    units: [],
    rng: 7,
    result: 'playing',
    stats: { produced: 0, reinforced: 0, passed: 0, absorbed: 0, hits: 0, fought: 0, shot: 0, captured: 0 },
    hist: { start: 0, every: HISTORY_EVERY, rows: [] },
    centre: []
  };
}

/** Adds an in-flight unit and counts it as produced (keeps the accounting invariant). */
export function addUnit(s: NcState, unit: Partial<Unit> & Pick<Unit, 'f' | 'a' | 'b'>): Unit {
  const k = unit.k ?? 0;
  const u: Unit = { k, d: 0, hp: UNIT_HP[k], h: 0, ...unit };
  s.units.push(u);
  s.stats.produced++;
  return u;
}

/** A plain opponent profile: no defence, no counters, no randomness, no lookahead. */
export const quiet: AiProfile = {
  period: 1,
  actions: 3,
  hesitation: 0,
  attackLevel: 10,
  counter: false,
  defend: false,
  frontierOnly: false,
  impulsive: 0,
  aware: false,
  lookahead: null,
  weakest: false,
  passive: false
};

export interface StubRng extends Rng {
  /** Number of `next()` calls (directly or through int/pick/shuffle). */
  draws: number;
}

/**
 * A predictable stand-in for the PRNG: `next()` always returns `value`, `int(min, max)` returns
 * `max` (so the noise term of target scores is exactly +3), `pick` takes the first element and
 * `shuffle` keeps the order. Counts the draws a real PRNG would make.
 */
export function stubRng(value = 0.5): StubRng {
  const rng: StubRng = {
    draws: 0,
    next: () => {
      rng.draws++;
      return value;
    },
    int: (_min: number, max: number) => {
      rng.draws++;
      return max;
    },
    pick: <T>(items: readonly T[]): T => {
      rng.draws++;
      return items[0]!;
    },
    shuffle: <T>(items: readonly T[]): T[] => {
      rng.draws += Math.max(0, items.length - 1);
      return [...items];
    },
    state: () => 0
  };
  return rng;
}
