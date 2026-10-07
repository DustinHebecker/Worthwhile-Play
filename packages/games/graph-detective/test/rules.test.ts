import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { metadata } from '../src/metadata';
import {
  CELL,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  EXTRA_TASK,
  LAYOUT,
  MAX_CHOICE,
  PROFILES,
  TASKS_PER_SESSION,
  TASK_TYPES,
  angleAt,
  articulationPoints,
  augmentingPairs,
  canAdvance,
  canDraw,
  canSubmit,
  chooseValue,
  clearSelection,
  components,
  createInitialState,
  currentProgress,
  currentTask,
  disjointRoutes,
  distancesFrom,
  edgeIndex,
  findBridges,
  generateTask,
  hasEdge,
  isConnected,
  isFinished,
  isGdState,
  isOpen,
  isTwoEdgeConnected,
  judge,
  maxFlow,
  nextTask,
  nodeLabel,
  pointSegmentDistance,
  resetState,
  routeLength,
  segmentsIntersect,
  selectionComplete,
  separatingBridges,
  shortestRoute,
  showSolution,
  solutionOf,
  submit,
  suitablePairs,
  taskMix,
  toDifficulty,
  toggleEdge,
  toggleNode,
  totals,
  usesEndpoints,
  type Difficulty,
  type Edge,
  type GdState,
  type Selection,
  type Task,
  type TaskType
} from '../src/rules';
import {
  linked,
  oracleArticulation,
  oracleAugmentPairs,
  oracleBridges,
  oracleConnected,
  oracleDistance,
  oracleMinCut,
  oracleSeparating,
  oracleTwoEdgeConnected,
  routeWeight,
  simpleRoutes
} from './oracle';

/* ---------- Helpers ---------- */

const L = (s: string) => s.charCodeAt(0) - 65;
/** Edges from a compact list like "AB AC:3 BD" (optional :weight), sorted like the generator does. */
const net = (spec: string): Edge[] =>
  spec
    .split(/\s+/)
    .filter(Boolean)
    .map((token): Edge => {
      const [pair, w] = token.split(':');
      const a = L(pair!.charAt(0));
      const b = L(pair!.charAt(1));
      return [Math.min(a, b), Math.max(a, b), w ? Number(w) : 1];
    })
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
const idx = (edges: readonly Edge[], pair: string) => edgeIndex(edges, L(pair.charAt(0)), L(pair.charAt(1)));
const idxs = (edges: readonly Edge[], pairs: string) => pairs.split(' ').map((p) => idx(edges, p)).sort((a, b) => a - b);

/** A hand-made task: points on a 4-wide grid, so the layout is valid for any n ≤ 16. */
function taskOf(type: TaskType, n: number, edges: Edge[], from = -1, to = -1): Task {
  const weighted = edges.some((e) => e[2] > 1);
  return {
    type,
    n,
    edges,
    pos: Array.from({ length: n }, (_, i): [number, number] => [(i % 4) * CELL + 50, Math.floor(i / 4) * CELL + 50]),
    width: 4 * CELL,
    height: Math.ceil(n / 4) * CELL,
    weighted,
    from,
    to
  };
}

const sel = (edges: number[] = [], nodes: number[] = [], value = -1): Selection => ({ edges, nodes, value });

/** A state whose first task is `task` (the other five come from a generated session). */
function stateWith(task: Task, seed = 1): GdState {
  const base = createInitialState(seed, 'easy');
  return { ...base, tasks: [task, ...base.tasks.slice(1)] };
}

// Barbell: triangles ABC and DEF joined by the bridge CD.
const BARBELL = 'AB AC BC CD DE DF EF';
// Weighted: A–B–C is shorter (2) than the direct A–C (3).
const TRIANGLE_W = 'AB:1 BC:1 AC:3 CD:2';

/* ---------- Arbitraries ---------- */

const allPairs = (n: number): [number, number][] => {
  const result: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) result.push([a, b]);
  return result;
};

interface G {
  n: number;
  edges: Edge[];
}

/** Any simple graph (possibly disconnected) with 2…maxN points and weights 1…maxW. */
const graphArb = (maxN = 7, maxW = 1): fc.Arbitrary<G> =>
  fc
    .integer({ min: 2, max: maxN })
    .chain((n) => {
      const pairs = allPairs(n);
      return fc.tuple(fc.constant(n), fc.subarray(pairs), fc.array(fc.integer({ min: 1, max: maxW }), { minLength: pairs.length, maxLength: pairs.length }));
    })
    .map(([n, chosen, weights]) => ({ n, edges: chosen.map(([a, b], i): Edge => [a, b, weights[i]!]) }));

/** A connected graph: a random tree plus random extra connections. */
const connectedArb = (maxN = 7, maxW = 1, maxExtra = 6): fc.Arbitrary<G> =>
  fc
    .integer({ min: 2, max: maxN })
    .chain((n) =>
      fc.tuple(
        fc.constant(n),
        fc.tuple(...Array.from({ length: n - 1 }, (_, i) => fc.integer({ min: 0, max: i }))),
        fc.array(fc.tuple(fc.integer({ min: 0, max: n - 1 }), fc.integer({ min: 0, max: n - 1 })), { maxLength: maxExtra }),
        fc.array(fc.integer({ min: 1, max: maxW }), { minLength: (n * (n - 1)) / 2, maxLength: (n * (n - 1)) / 2 })
      )
    )
    .map(([n, parents, extra, weights]) => {
      const keys = new Set<string>();
      const edges: Edge[] = [];
      const add = (u: number, v: number) => {
        const a = Math.min(u, v);
        const b = Math.max(u, v);
        if (a === b || keys.has(`${a}-${b}`)) return;
        keys.add(`${a}-${b}`);
        edges.push([a, b, weights[edges.length]!]);
      };
      parents.forEach((p, i) => add(p, i + 1));
      for (const [u, v] of extra) add(u, v);
      return { n, edges: edges.sort((x, y) => x[0] - y[0] || x[1] - y[1]) };
    });

const withPair = (arb: fc.Arbitrary<G>) =>
  arb.chain((g) => fc.tuple(fc.constant(g), fc.integer({ min: 0, max: g.n - 1 }), fc.integer({ min: 0, max: g.n - 1 })));

/* ---------- Basics ---------- */

describe('basics', () => {
  it('labels points with capital letters', () => {
    expect([0, 1, 12].map(nodeLabel)).toEqual(['A', 'B', 'M']);
  });

  it('maps unknown difficulties to the default', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nope')).toBe(DEFAULT_DIFFICULTY);
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('knows which task types name two points', () => {
    expect(TASK_TYPES.filter(usesEndpoints)).toEqual(['bridge', 'path', 'mincut']);
  });

  it('declares the difficulties in easy → hard order, matching the rules', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(metadata.id).toBe('graph-detective');
  });

  it('finds connections in either direction', () => {
    const edges = net(BARBELL);
    expect(edgeIndex(edges, L('C'), L('D'))).toBe(idx(edges, 'CD'));
    expect(edgeIndex(edges, L('D'), L('C'))).toBe(3);
    expect(edgeIndex(edges, L('A'), L('F'))).toBe(-1);
    expect(hasEdge(edges, L('B'), L('A'))).toBe(true);
    expect(hasEdge(edges, L('A'), L('D'))).toBe(false);
  });

  it('computes components while skipping a connection or a point', () => {
    const edges = net(BARBELL);
    expect(components(6, edges)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(components(6, edges, idx(edges, 'CD'))).toEqual([0, 0, 0, 1, 1, 1]);
    expect(components(6, edges, -1, L('C'))).toEqual([0, 0, -1, 1, 1, 1]);
    expect(components(4, net('AB CD'))).toEqual([0, 0, 1, 1]);
    expect(isConnected(6, edges)).toBe(true);
    expect(isConnected(6, edges, idx(edges, 'CD'))).toBe(false);
    expect(isConnected(6, edges, idx(edges, 'AB'))).toBe(true);
    expect(isConnected(6, edges, -1, L('A'))).toBe(true);
    expect(isConnected(6, edges, -1, L('D'))).toBe(false);
  });
});

/* ---------- Algorithms on hand-made networks ---------- */

describe('bridges and articulation points (examples)', () => {
  it('finds the single bridge and its two ends in a barbell', () => {
    const edges = net(BARBELL);
    expect(findBridges(6, edges)).toEqual([idx(edges, 'CD')]);
    expect(articulationPoints(6, edges)).toEqual([L('C'), L('D')]);
  });

  it('treats every connection of a chain as a bridge and inner points as articulation points', () => {
    const edges = net('AB BC CD');
    expect(findBridges(4, edges)).toEqual([0, 1, 2]);
    expect(articulationPoints(4, edges)).toEqual([1, 2]);
  });

  it('finds nothing in a ring', () => {
    const edges = net('AB BC CD AD');
    expect(findBridges(4, edges)).toEqual([]);
    expect(articulationPoints(4, edges)).toEqual([]);
    expect(isTwoEdgeConnected(4, edges)).toBe(true);
  });

  it('marks the centre of a star (a DFS root with several children)', () => {
    expect(articulationPoints(4, net('AB AC AD'))).toEqual([0]);
    expect(articulationPoints(4, net('AD BD CD'))).toEqual([3]);
    // The root A has only one child here, so it is not a cut point.
    expect(articulationPoints(3, net('AB BC'))).toEqual([1]);
  });

  it('handles two rings sharing a point (articulation point but no bridge)', () => {
    const edges = net('AB BC AC CD DE CE');
    expect(findBridges(5, edges)).toEqual([]);
    expect(articulationPoints(5, edges)).toEqual([L('C')]);
  });

  it('handles empty and disconnected networks', () => {
    expect(findBridges(0, [])).toEqual([]);
    expect(articulationPoints(0, [])).toEqual([]);
    const edges = net('AB CD DE');
    expect(findBridges(5, edges)).toEqual([0, 1, 2]);
    expect(articulationPoints(5, edges)).toEqual([L('D')]);
  });

  it('separates two points only by the bridges between them', () => {
    const edges = net(BARBELL + ' FG');
    expect(separatingBridges(7, edges, L('A'), L('G'))).toEqual(idxs(edges, 'CD FG'));
    expect(separatingBridges(7, edges, L('G'), L('A'))).toEqual(idxs(edges, 'CD FG'));
    expect(separatingBridges(7, edges, L('A'), L('E'))).toEqual(idxs(edges, 'CD'));
    expect(separatingBridges(7, edges, L('D'), L('G'))).toEqual(idxs(edges, 'FG'));
    expect(separatingBridges(7, edges, L('A'), L('B'))).toEqual([]);
    expect(separatingBridges(7, edges, L('C'), L('C'))).toEqual([]);
  });

  it('returns no separating bridge for points that are already apart', () => {
    expect(separatingBridges(4, net('AB CD'), 0, 3)).toEqual([]);
  });

  it('lists the pairs that make a network two-edge-connected', () => {
    expect(augmentingPairs(4, net('AB BC CD'))).toEqual([[0, 3]]);
    const barbell = augmentingPairs(6, net(BARBELL));
    expect(barbell).toHaveLength(8);
    expect(barbell).toContainEqual([L('A'), L('E')]);
    expect(barbell).not.toContainEqual([L('C'), L('D')]);
    // A star with three leaves needs two new connections.
    expect(augmentingPairs(4, net('AB AC AD'))).toEqual([]);
    expect(isTwoEdgeConnected(4, net('AB BC AC'))).toBe(false);
    expect(isTwoEdgeConnected(3, net('AB BC AC'))).toBe(true);
  });
});

describe('shortest routes (examples)', () => {
  it('prefers a longer chain of short connections over a long direct one', () => {
    const edges = net(TRIANGLE_W);
    expect(distancesFrom(4, edges, 0)).toEqual([0, 1, 2, 4]);
    expect(shortestRoute(4, edges, 0, 3)).toEqual([idx(edges, 'AB'), idx(edges, 'BC'), idx(edges, 'CD')]);
    expect(shortestRoute(4, edges, 0, 0)).toEqual([]);
  });

  it('can count connections instead of lengths and block connections', () => {
    const edges = net(TRIANGLE_W);
    expect(distancesFrom(4, edges, 0, () => 1)).toEqual([0, 1, 1, 2]);
    expect(shortestRoute(4, edges, 0, 2, () => 1)).toEqual([idx(edges, 'AC')]);
    const ac = idx(edges, 'AC');
    expect(shortestRoute(4, edges, 0, 2, (i) => (i === ac ? Infinity : 1))).toEqual(idxs(edges, 'AB BC'));
  });

  it('reports unreachable points', () => {
    expect(distancesFrom(4, net('AB CD'), 0)).toEqual([0, 1, Infinity, Infinity]);
    expect(shortestRoute(4, net('AB CD'), 0, 3)).toBeNull();
  });

  it('breaks ties by the lowest connection index', () => {
    const edges = net('AB BD AC CD');
    expect(shortestRoute(4, edges, 0, 3)).toEqual(idxs(edges, 'AB BD'));
  });

  it('measures exactly one simple route between the two points', () => {
    const edges = net(TRIANGLE_W);
    expect(routeLength(4, edges, idxs(edges, 'AB BC CD'), 0, 3)).toBe(4);
    expect(routeLength(4, edges, idxs(edges, 'CD BC AB'), 0, 3)).toBe(4);
    expect(routeLength(4, edges, idxs(edges, 'AC CD'), 3, 0)).toBe(5);
    expect(routeLength(4, edges, idxs(edges, 'AC'), 0, 2)).toBe(3);
  });

  it('rejects selections that are not one simple route', () => {
    const edges = net(TRIANGLE_W);
    expect(routeLength(4, edges, [], 0, 3)).toBe(-1);
    expect(routeLength(4, edges, idxs(edges, 'AB BC'), 0, 3), 'does not reach D').toBe(-1);
    expect(routeLength(4, edges, idxs(edges, 'AB BC AC CD'), 0, 3), 'branches at A and C').toBe(-1);
    expect(routeLength(4, edges, idxs(edges, 'AB'), 0, 0), 'start = goal').toBe(-1);
    expect(routeLength(4, edges, [0, 0], 0, 1), 'repeated connection').toBe(-1);
    expect(routeLength(4, edges, [99], 0, 1), 'unknown connection').toBe(-1);
    // A route plus a separate loop: every degree looks fine, but the walk does not use the loop.
    const loop = net('AB CD DE CE');
    expect(routeLength(5, loop, [0, 1, 2, 3], 0, 1)).toBe(-1);
    expect(routeLength(5, loop, [0], 0, 1)).toBe(1);
    // A dangling extra connection at the goal.
    expect(routeLength(4, net('AB BC CD'), [0, 1, 2], 0, 2)).toBe(-1);
  });
});

describe('minimum cut (examples)', () => {
  it('counts connection-disjoint routes and returns a matching cut', () => {
    const edges = net('AB AC AD BE CE DE');
    const result = maxFlow(5, edges, L('A'), L('E'));
    expect(result.value).toBe(3);
    expect(result.cut).toHaveLength(3);
    expect(linked(5, edges, L('A'), L('E'), new Set(result.cut))).toBe(false);
    const routes = disjointRoutes(edges, result, L('A'), L('E'));
    expect(routes).toHaveLength(3);
    expect(new Set(routes.flat()).size).toBe(6);
  });

  it('finds a bottleneck in the middle', () => {
    const edges = net(BARBELL);
    const result = maxFlow(6, edges, L('A'), L('F'));
    expect(result.value).toBe(1);
    expect(result.cut).toEqual([idx(edges, 'CD')]);
    expect(disjointRoutes(edges, result, L('A'), L('F'))).toEqual([idxs(edges, 'AC CD DF')]);
  });

  it('records the flow direction per connection', () => {
    const edges = net('AB BC');
    expect(maxFlow(3, edges, 0, 2).flow).toEqual([1, 1]);
    expect(maxFlow(3, edges, 2, 0).flow).toEqual([-1, -1]);
  });

  it('is zero for points that are apart, with an empty cut', () => {
    const result = maxFlow(4, net('AB CD'), 0, 3);
    expect(result.value).toBe(0);
    expect(result.cut).toEqual([]);
  });

  it('uses residual capacity in both directions of a connection', () => {
    // The first augmenting route A–C–D–F blocks the second unless C–D can be undone.
    const edges = net('AB AC BD CD CE DF EF');
    expect(maxFlow(6, edges, L('A'), L('F')).value).toBe(2);
  });
});

/* ---------- Algorithms against the brute-force oracle ---------- */

describe('algorithms agree with the brute-force oracle', { timeout: 120_000 }, () => {
  it('bridges', () => {
    fc.assert(
      fc.property(graphArb(8), ({ n, edges }) => {
        expect(findBridges(n, edges)).toEqual(oracleBridges(n, edges));
      }),
      { numRuns: 300 }
    );
  });

  it('articulation points', () => {
    fc.assert(
      fc.property(graphArb(8), ({ n, edges }) => {
        expect(articulationPoints(n, edges)).toEqual(oracleArticulation(n, edges));
      }),
      { numRuns: 300 }
    );
  });

  it('bridges that separate two points', () => {
    fc.assert(
      fc.property(withPair(graphArb(8)), ([{ n, edges }, s, t]) => {
        expect(separatingBridges(n, edges, s, t)).toEqual(oracleSeparating(n, edges, s, t));
      }),
      { numRuns: 300 }
    );
  });

  it('two-edge-connectivity and the augmenting pairs', () => {
    fc.assert(
      fc.property(graphArb(7), ({ n, edges }) => {
        expect(isTwoEdgeConnected(n, edges)).toBe(oracleTwoEdgeConnected(n, edges));
        expect(augmentingPairs(n, edges).map(([u, v]) => `${u}-${v}`)).toEqual(oracleAugmentPairs(n, edges));
        expect(isConnected(n, edges)).toBe(oracleConnected(n, edges));
      }),
      { numRuns: 200 }
    );
  });

  it('shortest distances and routes (weighted)', () => {
    fc.assert(
      fc.property(withPair(graphArb(7, 9)), ([{ n, edges }, s, t]) => {
        const dist = distancesFrom(n, edges, s);
        for (let v = 0; v < n; v++) expect(dist[v]).toBe(oracleDistance(n, edges, s, v));
        const route = shortestRoute(n, edges, s, t);
        if (dist[t] === Infinity) expect(route).toBeNull();
        else {
          expect(route).not.toBeNull();
          expect(routeWeight(edges, route!)).toBe(dist[t]);
          if (s !== t) expect(routeLength(n, edges, route!, s, t)).toBe(dist[t]);
        }
      }),
      { numRuns: 300 }
    );
  });

  it('routeLength accepts exactly the simple routes', () => {
    fc.assert(
      fc.property(
        withPair(graphArb(6, 9)).chain(([g, s, t]) => fc.tuple(fc.constant(g), fc.constant(s), fc.constant(t), fc.subarray(g.edges.map((_, i) => i)))),
        ([{ n, edges }, s, t, chosen]) => {
          const routes = simpleRoutes(n, edges, s, t).map((r) => r.join());
          const length = routeLength(n, edges, chosen, s, t);
          expect(length >= 0).toBe(routes.includes([...chosen].sort((a, b) => a - b).join()));
          if (length >= 0) expect(length).toBe(routeWeight(edges, chosen));
        }
      ),
      { numRuns: 400 }
    );
  });

  it('minimum cut, the cut itself and the disjoint routes', () => {
    fc.assert(
      fc.property(withPair(graphArb(7)), ([{ n, edges }, s, t]) => {
        fc.pre(s !== t);
        const result = maxFlow(n, edges, s, t);
        expect(result.value).toBe(oracleMinCut(n, edges, s, t));
        expect(result.cut).toHaveLength(result.value);
        expect(linked(n, edges, s, t, new Set(result.cut))).toBe(false);
        const routes = disjointRoutes(edges, result, s, t);
        expect(routes).toHaveLength(result.value);
        expect(new Set(routes.flat()).size).toBe(routes.flat().length);
        for (const route of routes) {
          // Each route is a walk from s to t.
          let at = s;
          for (const e of route) {
            const [a, b] = edges[e]!;
            expect([a, b]).toContain(at);
            at = a === at ? b : a;
          }
          expect(at).toBe(t);
        }
      }),
      { numRuns: 300 }
    );
  });
});

/* ---------- Judging answers ---------- */

describe('judging answers', { timeout: 120_000 }, () => {
  it('bridge: accepts exactly the separating bridges and shows a detour otherwise', () => {
    fc.assert(
      fc.property(withPair(connectedArb(7)), ([{ n, edges }, s, t]) => {
        fc.pre(s !== t);
        const task = taskOf('bridge', n, edges, s, t);
        const good = oracleSeparating(n, edges, s, t);
        edges.forEach((_, e) => {
          const verdict = judge(task, sel([e]));
          expect(verdict.correct).toBe(good.includes(e));
          if (verdict.correct) expect(verdict.feedback).toBeNull();
          else {
            expect(verdict.feedback?.code).toBe('bridge.connected');
            const detour = verdict.feedback!.edges;
            expect(detour).not.toContain(e);
            expect(simpleRoutes(n, edges, s, t).map((r) => r.join())).toContain([...detour].sort((a, b) => a - b).join());
          }
        });
      }),
      { numRuns: 150 }
    );
  });

  it('cutvertex: accepts exactly the articulation points', () => {
    fc.assert(
      fc.property(connectedArb(7), ({ n, edges }) => {
        const task = taskOf('cutvertex', n, edges);
        const good = oracleArticulation(n, edges);
        for (let v = 0; v < n; v++) {
          const verdict = judge(task, sel([], [v]));
          expect(verdict.correct).toBe(good.includes(v));
          expect(verdict.feedback).toEqual(verdict.correct ? null : { code: 'cutvertex.connected', edges: [], nodes: [v], value: 0 });
        }
      }),
      { numRuns: 150 }
    );
  });

  it('augment: accepts exactly the pairs that remove every bridge and dots the rest', () => {
    fc.assert(
      fc.property(connectedArb(6, 1, 4), ({ n, edges }) => {
        const task = taskOf('augment', n, edges);
        const good = oracleAugmentPairs(n, edges);
        for (let u = 0; u < n; u++) {
          for (let v = 0; v < n; v++) {
            if (u === v || hasEdge(edges, u, v)) continue;
            const verdict = judge(task, sel([], [u, v]));
            expect(verdict.correct).toBe(good.includes(`${Math.min(u, v)}-${Math.max(u, v)}`));
            if (!verdict.correct) {
              expect(verdict.feedback?.code).toBe('augment.weak');
              expect(verdict.feedback?.edges).toEqual(oracleBridges(n, [...edges, [Math.min(u, v), Math.max(u, v), 1]]));
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('path: accepts every shortest route and reports the length of longer ones', () => {
    fc.assert(
      fc.property(withPair(connectedArb(6, 5)), ([{ n, edges }, s, t]) => {
        fc.pre(s !== t);
        const task = taskOf('path', n, edges, s, t);
        const best = oracleDistance(n, edges, s, t);
        for (const route of simpleRoutes(n, edges, s, t)) {
          const weight = routeWeight(edges, route);
          const verdict = judge(task, sel(route));
          expect(verdict.correct).toBe(weight === best);
          if (!verdict.correct) expect(verdict.feedback).toEqual({ code: 'path.long', edges: [], nodes: [], value: weight });
        }
      }),
      { numRuns: 150 }
    );
  });

  it('path: explains selections that are not a route', () => {
    const edges = net(TRIANGLE_W);
    const task = taskOf('path', 4, edges, 0, 3);
    expect(judge(task, sel(idxs(edges, 'AB BC')))).toEqual({ correct: false, feedback: { code: 'path.invalid', edges: [], nodes: [], value: 0 } });
    expect(judge(task, sel(idxs(edges, 'AB BC CD'))).correct).toBe(true);
    expect(judge(task, sel(idxs(edges, 'AC CD')))).toEqual({ correct: false, feedback: { code: 'path.long', edges: [], nodes: [], value: 5 } });
  });

  it('mincut: accepts only the right number and proves "too few" with disjoint routes', () => {
    fc.assert(
      fc.property(withPair(connectedArb(6)), ([{ n, edges }, s, t]) => {
        fc.pre(s !== t);
        const task = taskOf('mincut', n, edges, s, t);
        const best = oracleMinCut(n, edges, s, t);
        for (let k = 1; k <= MAX_CHOICE; k++) {
          const verdict = judge(task, sel([], [], k));
          expect(verdict.correct).toBe(k === best);
          if (k > best) expect(verdict.feedback).toEqual({ code: 'mincut.high', edges: [], nodes: [], value: k });
          if (k < best) {
            expect(verdict.feedback?.code).toBe('mincut.low');
            expect(verdict.feedback?.value).toBe(k + 1);
            // The dotted routes must survive any k cuts: removing k of their connections keeps s and t linked.
            const dotted = verdict.feedback!.edges;
            expect([...dotted].sort((a, b) => a - b)).toEqual(dotted);
            expect(oracleMinCut(n, dotted.map((e) => edges[e]!), s, t)).toBe(k + 1);
          }
        }
      }),
      { numRuns: 120 }
    );
  });

  it('solutions are always judged correct', () => {
    fc.assert(
      fc.property(withPair(connectedArb(7, 4)), fc.constantFrom(...TASK_TYPES), ([{ n, edges }, s, t], type) => {
        fc.pre(s !== t);
        const task = taskOf(type, n, edges, usesEndpoints(type) ? s : -1, usesEndpoints(type) ? t : -1);
        const solution = solutionOf(task);
        if (!solution) return;
        expect(selectionComplete(task, solution)).toBe(true);
        expect(judge(task, solution).correct).toBe(true);
      }),
      { numRuns: 300 }
    );
  });

  it('has no solution where none exists', () => {
    const ring = net('AB BC CD AD');
    expect(solutionOf(taskOf('bridge', 4, ring, 0, 2))).toBeNull();
    expect(solutionOf(taskOf('cutvertex', 4, ring))).toBeNull();
    expect(solutionOf(taskOf('augment', 4, net('AB AC AD')))).toBeNull();
    expect(solutionOf(taskOf('path', 4, net('AB CD'), 0, 3))).toBeNull();
    expect(solutionOf(taskOf('mincut', 4, net('AB CD'), 0, 3)), 'already apart').toBeNull();
    const k6 = net('AB AC AD AE AF AG BG CG DG EG FG');
    expect(solutionOf(taskOf('mincut', 7, k6, 0, 6)), 'more than MAX_CHOICE cuts').toBeNull();
    expect(solutionOf(taskOf('mincut', 7, k6.slice(1), 0, 6))).toEqual({ edges: expect.any(Array), nodes: [], value: MAX_CHOICE });
  });

  it('gives concrete solutions on examples', () => {
    const edges = net(BARBELL);
    expect(solutionOf(taskOf('bridge', 6, edges, 0, 5))).toEqual(sel([idx(edges, 'CD')]));
    expect(solutionOf(taskOf('cutvertex', 6, edges))).toEqual(sel([], [L('C')]));
    expect(solutionOf(taskOf('augment', 6, edges))).toEqual(sel([], [L('A'), L('D')]));
    const w = net(TRIANGLE_W);
    expect(solutionOf(taskOf('path', 4, w, 0, 3))).toEqual(sel(idxs(w, 'AB BC CD')));
    expect(solutionOf(taskOf('mincut', 6, edges, 0, 5))).toEqual(sel([idx(edges, 'CD')], [], 1));
  });

  it('knows when a selection is complete', () => {
    const edges = net(BARBELL);
    expect(selectionComplete(taskOf('bridge', 6, edges, 0, 5), sel([1]))).toBe(true);
    expect(selectionComplete(taskOf('bridge', 6, edges, 0, 5), sel([]))).toBe(false);
    expect(selectionComplete(taskOf('bridge', 6, edges, 0, 5), sel([1, 2]))).toBe(false);
    expect(selectionComplete(taskOf('path', 6, edges, 0, 5), sel([1, 2]))).toBe(true);
    expect(selectionComplete(taskOf('path', 6, edges, 0, 5), sel([]))).toBe(false);
    expect(selectionComplete(taskOf('augment', 6, edges), sel([], [0, 4]))).toBe(true);
    expect(selectionComplete(taskOf('augment', 6, edges), sel([], [0, 1])), 'already connected').toBe(false);
    expect(selectionComplete(taskOf('augment', 6, edges), sel([], [0]))).toBe(false);
    expect(selectionComplete(taskOf('cutvertex', 6, edges), sel([], [2]))).toBe(true);
    expect(selectionComplete(taskOf('cutvertex', 6, edges), sel([], []))).toBe(false);
    expect(selectionComplete(taskOf('mincut', 6, edges, 0, 5), sel([], [], 1))).toBe(true);
    expect(selectionComplete(taskOf('mincut', 6, edges, 0, 5), sel([], [], -1))).toBe(false);
  });
});

/* ---------- Geometry ---------- */

describe('layout geometry', () => {
  it('detects crossing, touching and separate segments', () => {
    expect(segmentsIntersect([0, 0], [10, 10], [0, 10], [10, 0])).toBe(true);
    expect(segmentsIntersect([0, 0], [10, 0], [0, 5], [10, 5]), 'parallel').toBe(false);
    expect(segmentsIntersect([0, 0], [10, 0], [5, 0], [5, 10]), 'T-junction').toBe(true);
    expect(segmentsIntersect([5, 0], [5, 10], [0, 0], [10, 0]), 'T-junction, other order').toBe(true);
    expect(segmentsIntersect([0, 0], [10, 0], [5, 1], [5, 10]), 'stops short').toBe(false);
    expect(segmentsIntersect([0, 0], [10, 0], [5, 0], [20, 0]), 'collinear overlap').toBe(true);
    expect(segmentsIntersect([0, 0], [10, 0], [11, 0], [20, 0]), 'collinear apart').toBe(false);
    expect(segmentsIntersect([0, 0], [4, 4], [6, 6], [10, 0]), 'lines cross outside').toBe(false);
    expect(segmentsIntersect([0, 0], [10, 10], [10, 0], [6, 4]), 'one side only').toBe(false);
    expect(segmentsIntersect([0, 0], [0, 10], [-5, 5], [5, 5])).toBe(true);
    expect(segmentsIntersect([3, 3], [3, 3], [0, 0], [10, 10]), 'point on segment').toBe(true);
    expect(segmentsIntersect([0, 0], [10, 10], [3, 3], [3, 3]), 'segment through point').toBe(true);
    expect(segmentsIntersect([0, 0], [10, 0], [-5, -5], [-1, 0]), 'collinear end outside box').toBe(false);
    expect(segmentsIntersect([0, 0], [10, 0], [5, -5], [5, -1]), 'below').toBe(false);
  });

  it('measures the distance from a point to a segment', () => {
    expect(pointSegmentDistance([5, 5], [0, 0], [10, 0])).toBe(5);
    expect(pointSegmentDistance([-3, 4], [0, 0], [10, 0])).toBe(5);
    expect(pointSegmentDistance([13, 4], [0, 0], [10, 0])).toBe(5);
    expect(pointSegmentDistance([3, 4], [0, 0], [0, 0])).toBe(5);
    expect(pointSegmentDistance([0, 7], [0, 0], [0, 10])).toBe(0);
    expect(pointSegmentDistance([4, 0], [0, 0], [0, 10])).toBe(4);
  });

  it('measures angles between two rays', () => {
    expect(angleAt([0, 0], [10, 0], [0, 10])).toBeCloseTo(90);
    expect(angleAt([0, 0], [10, 0], [-10, 0])).toBeCloseTo(180);
    expect(angleAt([0, 0], [10, 0], [10, 10])).toBeCloseTo(45);
    expect(angleAt([0, 0], [10, -1], [10, 1])).toBeCloseTo(11.42, 1);
    expect(angleAt([0, 0], [-10, -1], [-10, 1]), 'wraps around ±180°').toBeCloseTo(11.42, 1);
    expect(angleAt([5, 5], [5, 0], [5, 0])).toBe(0);
  });

  it('only draws short, uncluttered, non-crossing connections', () => {
    const pos: [number, number][] = [
      [50, 50],
      [150, 50],
      [50, 150],
      [150, 150],
      [250, 50],
      [100, 52]
    ];
    expect(canDraw(pos.slice(0, 5), [], 0, 1)).toBe(true);
    expect(canDraw(pos.slice(0, 5), [[0, 3, 1]], 1, 2), 'crosses the diagonal').toBe(false);
    expect(canDraw(pos.slice(0, 5), [[0, 1, 1]], 0, 1), 'already drawn').toBe(false);
    expect(canDraw(pos.slice(0, 5), [[1, 0, 1]], 0, 1), 'already drawn, reversed').toBe(false);
    expect(canDraw(pos.slice(0, 5), [[0, 1, 1]], 0, 3), 'only 45° apart at A').toBe(true);
    expect(canDraw(pos.slice(0, 5), [[0, 1, 1]], 0, 4), 'runs through B').toBe(false);
    expect(canDraw(pos, [], 0, 1), 'passes too close to point F').toBe(false);
    expect(canDraw([[0, 0], [LAYOUT.maxLength + 1, 0]], [], 0, 1), 'too long').toBe(false);
    expect(canDraw([[0, 0], [LAYOUT.maxLength, 0]], [], 0, 1), 'just short enough').toBe(true);
    // Two connections at one point that are almost parallel.
    const fan: [number, number][] = [[0, 0], [100, 0], [100, 40]];
    expect(canDraw(fan, [[0, 1, 1]], 0, 2)).toBe(false);
    expect(canDraw(fan, [[0, 1, 1]], 2, 0)).toBe(false);
    expect(canDraw([[0, 0], [100, 0], [100, 70]], [[0, 1, 1]], 0, 2)).toBe(true);
    expect(canDraw([[0, 0], [100, 0], [0, 40]], [[1, 0, 1]], 2, 1), 'shared end is the second point').toBe(false);
    expect(angleAt([0, 0], [100, 0], [100, 40])).toBeLessThan(LAYOUT.minAngle);
  });
});

/* ---------- Generator ---------- */

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 3);

function checkLayout(task: Task, difficulty: Difficulty) {
  const profile = PROFILES[difficulty];
  expect(task.n).toBeGreaterThanOrEqual(profile.nodes[0]);
  expect(task.n).toBeLessThanOrEqual(profile.nodes[1]);
  expect(task.width).toBe(profile.cols * CELL);
  expect(task.height).toBe(profile.rows * CELL);
  expect(task.pos).toHaveLength(task.n);
  task.pos.forEach(([x, y], i) => {
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);
    expect(Math.abs(x - (col * CELL + 50))).toBeLessThanOrEqual(LAYOUT.jitter);
    expect(Math.abs(y - (row * CELL + 50))).toBeLessThanOrEqual(LAYOUT.jitter);
    if (i > 0) {
      // Reading order: each point lies in a later cell than the previous one.
      const [px, py] = task.pos[i - 1]!;
      expect(row * profile.cols + col).toBeGreaterThan(Math.floor(py / CELL) * profile.cols + Math.floor(px / CELL));
    }
  });
  // Every connection is drawable next to all the others, the network is connected and simple.
  task.edges.forEach(([a, b], i) => {
    expect(a).toBeLessThan(b);
    const others = task.edges.filter((_, j) => j !== i);
    expect(canDraw(task.pos, others, a, b)).toBe(true);
    if (i > 0) expect(task.edges[i - 1]![0] * 100 + task.edges[i - 1]![1]).toBeLessThan(a * 100 + b);
  });
  expect(oracleConnected(task.n, task.edges)).toBe(true);
  const weighted = task.type === 'path' && difficulty !== 'easy';
  expect(task.weighted).toBe(weighted);
  for (const [, , w] of task.edges) {
    expect(w).toBeGreaterThanOrEqual(1);
    expect(w).toBeLessThanOrEqual(weighted ? profile.maxWeight : 1);
  }
  if (usesEndpoints(task.type)) {
    expect(task.from).not.toBe(task.to);
    expect(task.from).toBeGreaterThanOrEqual(0);
    expect(task.to).toBeGreaterThanOrEqual(0);
  } else expect([task.from, task.to]).toEqual([-1, -1]);
}

const hops = (task: Task) => oracleDistance(task.n, task.edges.map(([a, b]) => [a, b, 1] as const), task.from, task.to);
const degree = (task: Task, v: number) => task.edges.filter(([a, b]) => a === v || b === v).length;

function checkGuarantees(task: Task, difficulty: Difficulty) {
  const { n, edges, from, to } = task;
  const extra = edges.length - (n - 1);
  switch (task.type) {
    case 'bridge':
      expect(oracleSeparating(n, edges, from, to).length).toBeGreaterThan(0);
      expect(hops(task)).toBeGreaterThanOrEqual(3);
      expect(extra).toBeGreaterThanOrEqual(2);
      break;
    case 'augment':
      expect(oracleAugmentPairs(n, edges).length).toBeGreaterThan(0);
      expect(oracleBridges(n, edges).length).toBeGreaterThanOrEqual(difficulty === 'easy' ? 1 : 2);
      expect(extra).toBeGreaterThanOrEqual(1);
      break;
    case 'path': {
      expect(hops(task)).toBeGreaterThanOrEqual(difficulty === 'easy' ? 3 : 2);
      expect(extra).toBeGreaterThanOrEqual(2);
      if (difficulty !== 'easy') {
        // The route with the fewest connections is never already the shortest one.
        const fewest = Math.min(...simpleRoutes(n, edges, from, to).map((r) => r.length));
        const best = oracleDistance(n, edges, from, to);
        const shortestFew = Math.min(...simpleRoutes(n, edges, from, to).filter((r) => r.length === fewest).map((r) => routeWeight(edges, r)));
        expect(shortestFew).toBeGreaterThan(best);
      }
      break;
    }
    case 'cutvertex': {
      const points = oracleArticulation(n, edges).length;
      const leaves = Array.from({ length: n }, (_, v) => v).filter((v) => degree(task, v) === 1).length;
      expect(points).toBeGreaterThanOrEqual(1);
      expect(points).toBeLessThanOrEqual(difficulty === 'hard' ? 1 : 2);
      expect(leaves).toBeLessThanOrEqual({ easy: 2, medium: 1, hard: 0 }[difficulty]);
      expect(extra).toBeGreaterThanOrEqual(2);
      break;
    }
    case 'mincut': {
      const cut = oracleMinCut(n, edges, from, to);
      expect(cut).toBeGreaterThanOrEqual(2);
      expect(cut).toBeLessThanOrEqual(difficulty === 'easy' ? 3 : 4);
      expect(hasEdge(edges, from, to)).toBe(false);
      if (difficulty !== 'easy') expect(cut).toBeLessThan(Math.min(degree(task, from), degree(task, to)));
      break;
    }
  }
}

describe('generator', { timeout: 300_000 }, () => {
  for (const difficulty of DIFFICULTIES) {
    it(`builds valid ${difficulty} sessions with every guarantee`, () => {
      for (const seed of SEEDS.slice(0, 25)) {
        const state = createInitialState(seed, difficulty);
        expect(state.seed).toBe(seed);
        expect(state.difficulty).toBe(difficulty);
        expect(state.index).toBe(0);
        expect(state.tasks).toHaveLength(TASKS_PER_SESSION);
        expect(state.tasks.map((t) => t.type).sort()).toEqual([...TASK_TYPES, EXTRA_TASK[difficulty]].sort());
        for (const task of state.tasks) {
          checkLayout(task, difficulty);
          checkGuarantees(task, difficulty);
        }
        expect(state.progress.every((p) => p.status === 'open' && p.attempts === 0 && p.feedback === null && p.value === -1)).toBe(true);
        expect(isGdState(state)).toBe(true);
      }
    });
  }

  it('generates every task type on its own with its guarantee', () => {
    for (const difficulty of DIFFICULTIES) {
      for (const type of TASK_TYPES) {
        for (const seed of SEEDS.slice(0, 8)) {
          const task = generateTask(createRng(seed), type, difficulty);
          expect(task.type).toBe(type);
          checkLayout(task, difficulty);
          checkGuarantees(task, difficulty);
        }
      }
    }
  });

  it('is deterministic per seed and differs between seeds', () => {
    expect(createInitialState(99, 'medium')).toEqual(createInitialState(99, 'medium'));
    expect(createInitialState(99, 'medium')).not.toEqual(createInitialState(100, 'medium'));
    expect(createInitialState(99, 'easy')).not.toEqual(createInitialState(99, 'hard'));
    expect(createInitialState(2 ** 32 + 5)).toEqual(createInitialState(5));
    expect(createInitialState(7).difficulty).toBe('easy');
  });

  it('mixes all five task types plus one per difficulty, in seeded order', () => {
    expect(EXTRA_TASK).toEqual({ easy: 'bridge', medium: 'path', hard: 'augment' });
    const orders = new Set<string>();
    for (const seed of SEEDS) {
      const mix = taskMix(createRng(seed), 'hard');
      expect([...mix].sort()).toEqual([...TASK_TYPES, 'augment'].sort());
      orders.add(mix.join());
    }
    expect(orders.size).toBeGreaterThan(10);
  });

  it('scales the network size with the difficulty', () => {
    expect(PROFILES.easy.nodes).toEqual([6, 7]);
    expect(PROFILES.medium.nodes).toEqual([8, 10]);
    expect(PROFILES.hard.nodes).toEqual([11, 13]);
    const sizes = (d: Difficulty) => new Set(SEEDS.flatMap((seed) => createInitialState(seed, d).tasks.map((t) => t.n)));
    expect([...sizes('easy')].sort()).toEqual([6, 7]);
    expect([...sizes('medium')].sort()).toEqual([10, 8, 9]);
    expect([...sizes('hard')].sort()).toEqual([11, 12, 13]);
  });

  it('rejects networks that do not suit a task type', () => {
    const chain = net('AB BC CD DE EF');
    expect(suitablePairs('bridge', 'easy', 6, chain), 'no loop at all').toBeNull();
    expect(suitablePairs('path', 'easy', 6, chain)).toBeNull();
    expect(suitablePairs('cutvertex', 'easy', 6, chain)).toBeNull();
    expect(suitablePairs('augment', 'easy', 6, chain), 'needs at least one extra connection').toBeNull();
    const ring = net('AB BC CD DE EF AF AC');
    expect(suitablePairs('augment', 'easy', 6, ring), 'no bridge').toBeNull();
    expect(suitablePairs('mincut', 'easy', 6, ring)).toEqual([[0, 3], [0, 4], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 5]]);
    expect(suitablePairs('mincut', 'medium', 6, ring), 'cut equals a degree everywhere').toEqual([]);
    const barbell = net(BARBELL + ' AE');
    expect(suitablePairs('augment', 'easy', 6, barbell)).toBeNull();
    const twoBridges = net('AB BC AC CD DE EF DF FG');
    expect(suitablePairs('augment', 'easy', 7, twoBridges)).toEqual([[-1, -1]]);
    expect(suitablePairs('augment', 'medium', 7, twoBridges)).toEqual([[-1, -1]]);
    expect(suitablePairs('augment', 'medium', 6, net(BARBELL))).toBeNull();
    // Cut points: C and D (two) – fine for easy/medium, too many for hard.
    expect(suitablePairs('cutvertex', 'easy', 6, net(BARBELL))).toEqual([[-1, -1]]);
    expect(suitablePairs('cutvertex', 'medium', 6, net(BARBELL))).toEqual([[-1, -1]]);
    expect(suitablePairs('cutvertex', 'hard', 6, net(BARBELL))).toBeNull();
    const oneCut = net('AB BC AC CD DE CE');
    expect(suitablePairs('cutvertex', 'hard', 5, oneCut)).toEqual([[-1, -1]]);
    expect(suitablePairs('cutvertex', 'medium', 6, net('AB BC AC CD DE CE EF'))).toEqual([[-1, -1]]);
    expect(suitablePairs('cutvertex', 'hard', 6, net('AB BC AC CD DE CE EF')), 'a leaf').toBeNull();
    expect(suitablePairs('cutvertex', 'medium', 7, net('AB BC AC CD DE CE EF CG')), 'two leaves').toBeNull();
    expect(suitablePairs('cutvertex', 'easy', 4, net('AB BC CD AD')), 'no cut point').toBeNull();
  });

  it('picks bridge pairs that are far apart and separated', () => {
    const edges = net('AB BC AC CD DE EF DF FG');
    const pairs = suitablePairs('bridge', 'easy', 7, edges)!;
    expect(pairs.length).toBeGreaterThan(0);
    for (const [s, t] of pairs) {
      expect(oracleSeparating(7, edges, s, t).length).toBeGreaterThan(0);
      expect(hops(taskOf('bridge', 7, edges, s, t))).toBeGreaterThanOrEqual(3);
    }
    expect(pairs).toContainEqual([0, 6]);
    expect(pairs).not.toContainEqual([0, 3]);
  });

  it('picks weighted path pairs where the fewest connections are not the shortest', () => {
    const edges = net('AB:5 AC:1 CD:1 BD:1 DE:1 BE:4');
    const pairs = suitablePairs('path', 'medium', 5, edges)!;
    // A–E: the only two-connection route A–B–E has length 9, but A–C–D–E has length 3.
    // Not A–B (directly connected), not A–D (A–C–D is both fewest and shortest) and not
    // B–C (C–A–B has length 6, but C–D–B with as few connections has length 2).
    expect(pairs).toEqual([[0, 4]]);
    for (const [s, t] of pairs) checkGuarantees(taskOf('path', 5, edges, s, t), 'medium');
    expect(suitablePairs('path', 'easy', 5, edges)).toEqual(allPairs(5).filter(([s, t]) => hops(taskOf('path', 5, edges, s, t)) >= 3));
  });
});

/* ---------- State transitions ---------- */

describe('state transitions', () => {
  const bridgeTask = () => taskOf('bridge', 6, net(BARBELL), L('A'), L('F'));
  const pathTask = () => taskOf('path', 4, net(TRIANGLE_W), 0, 3);
  const augmentTask = () => taskOf('augment', 6, net(BARBELL));
  const cutTask = () => taskOf('cutvertex', 6, net(BARBELL));
  const mincutTask = () => taskOf('mincut', 6, net(BARBELL), L('A'), L('F'));

  it('starts open on the first task', () => {
    const state = createInitialState(4, 'medium');
    expect(currentTask(state)).toBe(state.tasks[0]);
    expect(currentProgress(state)).toBe(state.progress[0]);
    expect(isOpen(state)).toBe(true);
    expect(isFinished(state)).toBe(false);
    expect(canSubmit(state)).toBe(false);
    expect(canAdvance(state)).toBe(false);
    expect(totals(state)).toEqual({ tasks: 0, attempts: 0, solutionsShown: 0 });
  });

  it('bridge: one connection at a time; tapping it again deselects it', () => {
    let s = stateWith(bridgeTask());
    s = toggleEdge(s, 0);
    expect(currentProgress(s).edges).toEqual([0]);
    expect(canSubmit(s)).toBe(true);
    s = toggleEdge(s, 3);
    expect(currentProgress(s).edges).toEqual([3]);
    s = toggleEdge(s, 3);
    expect(currentProgress(s).edges).toEqual([]);
    expect(toggleNode(s, 0)).toBe(s);
    expect(toggleEdge(s, -1)).toBe(s);
    expect(toggleEdge(s, 7)).toBe(s);
    expect(toggleEdge(s, 6)).not.toBe(s);
    expect(chooseValue(s, 1)).toBe(s);
  });

  it('path: toggles connections in a sorted set', () => {
    let s = stateWith(pathTask());
    s = toggleEdge(toggleEdge(toggleEdge(s, 3), 0), 2);
    expect(currentProgress(s).edges).toEqual([0, 2, 3]);
    s = toggleEdge(s, 2);
    expect(currentProgress(s).edges).toEqual([0, 3]);
    expect(toggleNode(s, 1)).toBe(s);
  });

  it('augment: two points in tap order; a third replaces the older one', () => {
    let s = stateWith(augmentTask());
    expect(toggleEdge(s, 0)).toBe(s);
    s = toggleNode(s, 0);
    expect(canSubmit(s)).toBe(false);
    s = toggleNode(s, 4);
    expect(currentProgress(s).nodes).toEqual([0, 4]);
    expect(canSubmit(s)).toBe(true);
    s = toggleNode(s, 5);
    expect(currentProgress(s).nodes).toEqual([4, 5]);
    s = toggleNode(s, 4);
    expect(currentProgress(s).nodes).toEqual([5]);
    s = toggleNode(toggleNode(s, 3), 3);
    expect(currentProgress(s).nodes).toEqual([5]);
    // An existing connection cannot be added again.
    s = toggleNode(s, 3);
    expect(currentProgress(s).nodes).toEqual([5, 3]);
    expect(canSubmit(s)).toBe(false);
    expect(submit(s)).toBe(s);
    expect(toggleNode(s, 6)).toBe(s);
    expect(toggleNode(s, -1)).toBe(s);
  });

  it('cutvertex: one point at a time', () => {
    let s = stateWith(cutTask());
    s = toggleNode(s, 1);
    expect(currentProgress(s).nodes).toEqual([1]);
    s = toggleNode(s, 2);
    expect(currentProgress(s).nodes).toEqual([2]);
    s = toggleNode(s, 2);
    expect(currentProgress(s).nodes).toEqual([]);
    expect(toggleEdge(s, 0)).toBe(s);
  });

  it('mincut: chooses a number from 1 to MAX_CHOICE', () => {
    let s = stateWith(mincutTask());
    expect(chooseValue(s, 0)).toBe(s);
    expect(chooseValue(s, MAX_CHOICE + 1)).toBe(s);
    expect(chooseValue(s, 1.5)).toBe(s);
    s = chooseValue(s, MAX_CHOICE);
    expect(currentProgress(s).value).toBe(MAX_CHOICE);
    expect(chooseValue(s, MAX_CHOICE)).toBe(s);
    s = chooseValue(s, 1);
    expect(currentProgress(s).value).toBe(1);
    expect(toggleEdge(s, 0)).toBe(s);
    expect(toggleNode(s, 0)).toBe(s);
  });

  it('a wrong answer counts, keeps the selection and explains; a new selection clears the explanation', () => {
    let s = stateWith(bridgeTask());
    s = submit(toggleEdge(s, 0));
    const p = currentProgress(s);
    expect(p.status).toBe('open');
    expect(p.attempts).toBe(1);
    expect(p.edges).toEqual([0]);
    expect(p.feedback?.code).toBe('bridge.connected');
    expect(canSubmit(s)).toBe(true);
    s = submit(s);
    expect(currentProgress(s).attempts).toBe(2);
    s = toggleEdge(s, 0);
    expect(currentProgress(s).feedback).toBeNull();
    s = toggleEdge(s, idx(net(BARBELL), 'CD'));
    s = submit(s);
    expect(currentProgress(s)).toMatchObject({ status: 'solved', attempts: 3, feedback: null, edges: [3] });
    expect(isOpen(s)).toBe(false);
    expect(canSubmit(s)).toBe(false);
    expect(totals(s)).toEqual({ tasks: 1, attempts: 3, solutionsShown: 0 });
  });

  it('selection changes clear feedback for every kind of task', () => {
    const wrongPath = submit(toggleEdge(stateWith(pathTask()), 0));
    expect(currentProgress(wrongPath).feedback).not.toBeNull();
    expect(currentProgress(toggleEdge(wrongPath, 1)).feedback).toBeNull();
    const wrongCut = submit(toggleNode(stateWith(cutTask()), 0));
    expect(currentProgress(wrongCut).feedback?.code).toBe('cutvertex.connected');
    expect(currentProgress(toggleNode(wrongCut, 1)).feedback).toBeNull();
    const rightAugment = submit(toggleNode(toggleNode(stateWith(augmentTask()), 0), 4));
    expect(currentProgress(rightAugment).status).toBe('solved');
    const weak = submit(toggleNode(toggleNode(stateWith(taskOf('augment', 7, net('AB BC AC CD DE EF DF FG'))), 0), 5));
    expect(currentProgress(weak).feedback).toEqual({ code: 'augment.weak', edges: [idx(net('AB BC AC CD DE EF DF FG'), 'FG')], nodes: [], value: 0 });
    expect(currentProgress(toggleNode(weak, 6)).feedback).toBeNull();
    const wrongValue = submit(chooseValue(stateWith(mincutTask()), 2));
    expect(currentProgress(wrongValue).feedback?.code).toBe('mincut.high');
    expect(currentProgress(chooseValue(wrongValue, 1)).feedback).toBeNull();
  });

  it('a correct minimum cut shows one matching cut', () => {
    const s = submit(chooseValue(stateWith(mincutTask()), 1));
    expect(currentProgress(s)).toMatchObject({ status: 'solved', value: 1, edges: [3], attempts: 1 });
  });

  it('cannot check an incomplete answer', () => {
    const s = stateWith(bridgeTask());
    expect(submit(s)).toBe(s);
    const m = stateWith(mincutTask());
    expect(submit(m)).toBe(m);
  });

  it('clears the selection and explanation', () => {
    const s = stateWith(bridgeTask());
    expect(clearSelection(s)).toBe(s);
    const wrong = submit(toggleEdge(s, 0));
    const cleared = clearSelection(wrong);
    expect(currentProgress(cleared)).toMatchObject({ edges: [], nodes: [], value: -1, feedback: null, attempts: 1 });
    expect(clearSelection(cleared)).toBe(cleared);
    expect(currentProgress(clearSelection(toggleNode(stateWith(cutTask()), 1))).nodes).toEqual([]);
    expect(currentProgress(clearSelection(chooseValue(stateWith(mincutTask()), 3))).value).toBe(-1);
    const fbOnly = { ...s, progress: s.progress.map((p, i) => (i === 0 ? { ...p, feedback: { code: 'bridge.connected' as const, edges: [], nodes: [], value: 0 } } : p)) };
    expect(currentProgress(clearSelection(fbOnly)).feedback).toBeNull();
    const solved = submit(toggleEdge(s, 3));
    expect(clearSelection(solved)).toBe(solved);
  });

  it('shows a solution without counting it as an attempt, then locks the task', () => {
    let s = submit(toggleEdge(stateWith(bridgeTask()), 0));
    s = showSolution(s);
    expect(currentProgress(s)).toEqual({ status: 'shown', attempts: 1, edges: [3], nodes: [], value: -1, feedback: null });
    expect(showSolution(s)).toBe(s);
    expect(toggleEdge(s, 0)).toBe(s);
    expect(submit(s)).toBe(s);
    expect(totals(s)).toEqual({ tasks: 1, attempts: 1, solutionsShown: 1 });
  });

  it('moves on only after the current task is answered and stops at the last one', () => {
    let s = createInitialState(12, 'easy');
    expect(nextTask(s)).toBe(s);
    for (let i = 0; i < TASKS_PER_SESSION; i++) {
      expect(s.index).toBe(i);
      s = showSolution(s);
      expect(isFinished(s)).toBe(i === TASKS_PER_SESSION - 1);
      if (i < TASKS_PER_SESSION - 1) {
        expect(canAdvance(s)).toBe(true);
        s = nextTask(s);
        expect(isOpen(s)).toBe(true);
      }
    }
    expect(canAdvance(s)).toBe(false);
    expect(nextTask(s)).toBe(s);
    expect(totals(s)).toEqual({ tasks: 6, attempts: 0, solutionsShown: 6 });
    expect(isGdState(s)).toBe(true);
  });

  it('solving every task by its solution through submit finishes the session', () => {
    let s = createInitialState(21, 'hard');
    for (let i = 0; i < TASKS_PER_SESSION; i++) {
      const solution = solutionOf(currentTask(s))!;
      s = { ...s, progress: s.progress.map((p, j) => (j === s.index ? { ...p, ...solution, edges: currentTask(s).type === 'mincut' ? [] : solution.edges } : p)) };
      s = submit(s);
      expect(currentProgress(s).status).toBe('solved');
      expect(isGdState(s)).toBe(true);
      s = nextTask(s);
    }
    expect(isFinished(s)).toBe(true);
    expect(totals(s)).toEqual({ tasks: 6, attempts: 6, solutionsShown: 0 });
  });

  it('resets to the seeded start', () => {
    const start = createInitialState(33, 'medium');
    const played = nextTask(showSolution(start));
    expect(resetState(played)).toEqual(start);
  });

  it('never mutates the previous state', () => {
    const start = createInitialState(8, 'easy');
    const copy = JSON.parse(JSON.stringify(start));
    showSolution(submit(toggleEdge(toggleNode(chooseValue(start, 2), 0), 0)));
    expect(start).toEqual(copy);
  });
});

/* ---------- Validation ---------- */

describe('isGdState', { timeout: 60_000 }, () => {
  const base = () => createInitialState(5, 'medium');
  const mutate = (change: (s: GdState) => void) => {
    const s = JSON.parse(JSON.stringify(base())) as GdState;
    change(s);
    return s;
  };
  const firstOf = (type: TaskType) => base().tasks.findIndex((t) => t.type === type);

  it('accepts generated, played and JSON-copied states', () => {
    expect(isGdState(base())).toBe(true);
    const played = submit(toggleEdge(toggleNode(chooseValue(base(), 2), 0), 0));
    expect(isGdState(JSON.parse(JSON.stringify(played)))).toBe(true);
  });

  it('rejects broken top-level fields', () => {
    expect(isGdState(null)).toBe(false);
    expect(isGdState([])).toBe(false);
    expect(isGdState(mutate((s) => (s.seed = -1)))).toBe(false);
    expect(isGdState(mutate((s) => (s.seed = 2 ** 32)))).toBe(false);
    expect(isGdState(mutate((s) => ((s as { difficulty: string }).difficulty = 'extreme')))).toBe(false);
    expect(isGdState(mutate((s) => (s.index = -1)))).toBe(false);
    expect(isGdState(mutate((s) => (s.index = 6)))).toBe(false);
    expect(isGdState(mutate((s) => (s.index = 1.5)))).toBe(false);
    expect(isGdState(mutate((s) => s.tasks.pop()))).toBe(false);
    expect(isGdState(mutate((s) => s.progress.pop()))).toBe(false);
    expect(isGdState(mutate((s) => ((s as { tasks: unknown }).tasks = {})))).toBe(false);
    expect(isGdState(mutate((s) => ((s as { progress: unknown }).progress = 'x')))).toBe(false);
  });

  it('rejects broken tasks', () => {
    const p = firstOf('path');
    const b = firstOf('bridge');
    const a = firstOf('augment');
    const c = firstOf('cutvertex');
    const m = firstOf('mincut');
    expect(isGdState(mutate((s) => ((s.tasks[0] as { type: string }).type = 'maze')))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.n = 1)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.n = 17)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.n += 1)))).toBe(false);
    expect(isGdState(mutate((s) => s.tasks[0]!.pos.pop()))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.pos[0] = [-1, 50])))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.pos[0] = [50, 9999])))).toBe(false);
    expect(isGdState(mutate((s) => ((s.tasks[0]!.pos as unknown[])[0] = [50])))).toBe(false);
    expect(isGdState(mutate((s) => ((s.tasks[0]!.pos as unknown[])[0] = 'x')))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.width = 50)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.height = 9000)))).toBe(false);
    expect(isGdState(mutate((s) => ((s.tasks[0] as { weighted: unknown }).weighted = 1)))).toBe(false);
    expect(isGdState(mutate((s) => ((s.tasks[0] as { edges: unknown }).edges = 'x')))).toBe(false);
    expect(isGdState(mutate((s) => s.tasks[0]!.edges.push([...s.tasks[0]!.edges[0]!] as Edge)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.edges[0] = [s.tasks[0]!.edges[0]![1], s.tasks[0]!.edges[0]![0], 1])))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0]!.edges[0]![1] = s.tasks[0]!.n)))).toBe(false);
    expect(isGdState(mutate((s) => ((s.tasks[0]!.edges as unknown[])[0] = [0, 1])))).toBe(false);
    expect(isGdState(mutate((s) => ((s.tasks[0]!.edges as unknown[])[0] = 'AB')))).toBe(false);
    // Lengths: only weighted tasks may use lengths above 1, at most MAX_WEIGHT.
    expect(isGdState(mutate((s) => (s.tasks[b]!.edges[0]![2] = 2)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[p]!.edges[0]![2] = 9)))).toBe(true);
    expect(isGdState(mutate((s) => (s.tasks[p]!.edges[0]![2] = 10)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[p]!.edges[0]![2] = 0)))).toBe(false);
    // Named points.
    expect(isGdState(mutate((s) => (s.tasks[b]!.to = s.tasks[b]!.from)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[b]!.from = -1)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[m]!.to = s.tasks[m]!.n)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[a]!.from = 0)))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[c]!.to = 0)))).toBe(false);
    // A task without any answer.
    expect(isGdState(mutate((s) => (s.tasks[c]!.edges = net('AB BC CD AD'))))).toBe(false);
    expect(isGdState(mutate((s) => (s.tasks[0] = 7 as unknown as Task)))).toBe(false);
  });

  it('rejects inconsistent progress', () => {
    const b = firstOf('bridge');
    const a = firstOf('augment');
    const m = firstOf('mincut');
    const c = firstOf('cutvertex');
    const p = firstOf('path');
    const at = (s: GdState, i: number) => s.progress[i]!;
    expect(isGdState(mutate((s) => ((at(s, 0) as { status: string }).status = 'done')))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, 0).attempts = -1)))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, 0).attempts = 100_001)))).toBe(false);
    expect(isGdState(mutate((s) => (s.progress[0] = null as unknown as GdState['progress'][0])))).toBe(false);
    // Later tasks must be untouched.
    expect(isGdState(mutate((s) => (at(s, 5).attempts = 1)))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, 5).status = 'shown')))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, 5).value = s.tasks[5]!.type === 'mincut' ? 2 : 0)))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, 3).feedback = null)))).toBe(true);
    // Earlier tasks must be answered.
    expect(isGdState(mutate((s) => (s.index = 1)))).toBe(false);
    // Selection shapes per task type.
    expect(isGdState(mutate((s) => (at(s, b).edges = [0, 1])))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, c).edges = [0])))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, a).nodes = [0, 1, 2])))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, 0).nodes = [0, 0])))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, 0).edges = [9999])))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, p).nodes = [0])))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, b).value = 1)))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, m).value = 0)))).toBe(false);
    expect(isGdState(mutate((s) => (at(s, m).value = MAX_CHOICE + 1)))).toBe(false);
  });

  it('checks answered tasks and explanations', () => {
    const start = base();
    const t0 = start.tasks[0]!;
    const shown = showSolution(start);
    expect(isGdState(shown)).toBe(true);
    const solvedBySubmit = submit({ ...start, progress: start.progress.map((p, i) => (i === 0 ? { ...p, ...solutionOf(t0)!, edges: t0.type === 'mincut' ? [] : solutionOf(t0)!.edges } : p)) });
    expect(isGdState(solvedBySubmit)).toBe(true);
    expect(isGdState({ ...solvedBySubmit, progress: solvedBySubmit.progress.map((p, i) => (i === 0 ? { ...p, attempts: 0 } : p)) }), 'solved without a check').toBe(false);
    expect(isGdState({ ...shown, progress: shown.progress.map((p, i) => (i === 0 ? { ...p, attempts: 0 } : p)) })).toBe(true);
    expect(isGdState({ ...shown, progress: shown.progress.map((p, i) => (i === 0 ? { ...p, edges: [], nodes: [], value: -1 } : p)) }), 'answered without an answer').toBe(false);
    const fb = { code: 'cutvertex.connected' as const, edges: [], nodes: [0], value: 0 };
    expect(isGdState({ ...shown, progress: shown.progress.map((p, i) => (i === 0 ? { ...p, feedback: fb } : p)) }), 'answered with an explanation').toBe(false);
    // A wrong answer marked as solved.
    const cut = createInitialState(5, 'medium');
    const ci = cut.tasks.findIndex((t) => t.type === 'cutvertex');
    const ct = cut.tasks[ci]!;
    const notCut = Array.from({ length: ct.n }, (_, v) => v).find((v) => !articulationPoints(ct.n, ct.edges).includes(v))!;
    const fake = JSON.parse(JSON.stringify(cut)) as GdState;
    fake.index = ci;
    for (let i = 0; i < ci; i++) fake.progress[i] = { ...showSolution({ ...cut, index: i }).progress[i]! };
    expect(isGdState(fake)).toBe(true);
    fake.progress[ci] = { status: 'solved', attempts: 1, edges: [], nodes: [notCut], value: -1, feedback: null };
    expect(isGdState(fake)).toBe(false);
    fake.progress[ci] = { status: 'open', attempts: 1, edges: [], nodes: [notCut], value: -1, feedback: { code: 'cutvertex.connected', edges: [], nodes: [notCut], value: 0 } };
    expect(isGdState(fake)).toBe(true);
    fake.progress[ci]!.feedback = { code: 'bridge.connected', edges: [], nodes: [], value: 0 };
    expect(isGdState(fake), 'explanation of another task type').toBe(false);
    fake.progress[ci]!.feedback = { code: 'cutvertex.connected', edges: [], nodes: [0, 1], value: 0 };
    expect(isGdState(fake)).toBe(false);
    fake.progress[ci]!.feedback = { code: 'cutvertex.connected', edges: [999], nodes: [0], value: 0 };
    expect(isGdState(fake)).toBe(false);
    fake.progress[ci]!.feedback = { code: 'cutvertex.connected', edges: [], nodes: [0], value: -1 };
    expect(isGdState(fake)).toBe(false);
    (fake.progress[ci] as { feedback: unknown }).feedback = 'oops';
    expect(isGdState(fake)).toBe(false);
  });

  it('never throws on arbitrary data', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isGdState(value)).not.toThrow();
      }),
      { numRuns: 300 }
    );
    const s = base() as unknown as Record<string, unknown>;
    fc.assert(
      fc.property(fc.constantFrom('seed', 'difficulty', 'index', 'tasks', 'progress'), fc.anything(), (key, value) => {
        expect(() => isGdState({ ...s, [key]: value })).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });
});
