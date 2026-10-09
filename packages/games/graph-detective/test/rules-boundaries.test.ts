/**
 * Exact boundaries and validation details that the broader tests in rules.test.ts do not pin
 * down (found by mutation testing): one change per case, on a state that is otherwise valid.
 */
import { describe, expect, it } from 'vitest';
import {
  CELL,
  DIFFICULTIES,
  MAX_CHOICE,
  canDraw,
  clearSelection,
  createInitialState,
  currentProgress,
  isGdState,
  judge,
  maxFlow,
  nextTask,
  routeLength,
  segmentsIntersect,
  showSolution,
  solutionOf,
  suitablePairs,
  toggleEdge,
  type Edge,
  type GdState,
  type Point,
  type Progress,
  type Task,
  type TaskType
} from '../src/rules';

/* ---------- Helpers (same conventions as rules.test.ts) ---------- */

const L = (s: string) => s.charCodeAt(0) - 65;
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

function taskOf(type: TaskType, n: number, edges: Edge[], from = -1, to = -1): Task {
  return {
    type,
    n,
    edges,
    pos: Array.from({ length: n }, (_, i): [number, number] => [(i % 4) * CELL + 50, Math.floor(i / 4) * CELL + 50]),
    width: 4 * CELL,
    height: Math.ceil(n / 4) * CELL,
    weighted: edges.some((e) => e[2] > 1),
    from,
    to
  };
}

const BARBELL = 'AB AC BC CD DE DF EF';
const TRIANGLE_W = 'AB:1 BC:1 AC:3 CD:2';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const fnv = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16);
};

/** A medium session whose current task is the first of `type`; every earlier task is answered via "show solution". */
function at(type: TaskType, seed = 5): { state: GdState; i: number } {
  let state = createInitialState(seed, 'medium');
  const i = state.tasks.findIndex((t) => t.type === type);
  while (state.index < i) state = nextTask(showSolution(state));
  return { state: clone(state), i };
}

/** The state with the current task's progress changed. */
const withProgress = (state: GdState, i: number, change: Partial<Progress>): GdState => ({
  ...state,
  progress: state.progress.map((p, j) => (j === i ? { ...p, ...change } : p))
});

/** A fresh medium session whose first task (open, untouched) is replaced by `task`. */
const withTask = (task: Task): GdState => {
  const base = createInitialState(5, 'medium');
  return { ...base, tasks: [task, ...base.tasks.slice(1)] };
};

/* ---------- Algorithms ---------- */

describe('algorithm boundaries', () => {
  it('routeLength rejects a trail that passes a point twice even if it uses every connection', () => {
    // A–B, then B–C–D–B (a loop through B), then B–E: the walk reaches E using all five
    // connections, but B has four selected connections, so this is not a simple route.
    const edges = net('AB BC BD BE CD');
    expect(routeLength(5, edges, [0, 1, 2, 3, 4], 0, 4)).toBe(-1);
    expect(judge(taskOf('path', 5, edges, 0, 4), { edges: [0, 1, 2, 3, 4], nodes: [], value: -1 }).feedback?.code).toBe('path.invalid');
    expect(routeLength(5, edges, [0, 3], 0, 4)).toBe(2);
  });

  it('maxFlow from a point to itself is empty instead of looping', () => {
    expect(maxFlow(3, net('AB BC'), 1, 1)).toEqual({ value: 0, flow: [0, 0], cut: [] });
  });

  it('explains a wrong bridge without a detour when the two points are not linked at all', () => {
    expect(judge(taskOf('bridge', 4, net('AB CD'), 0, 3), { edges: [0], nodes: [], value: -1 })).toEqual({
      correct: false,
      feedback: { code: 'bridge.connected', edges: [], nodes: [], value: 0 }
    });
  });

  it('a too-low minimum cut highlights routes, never points', () => {
    const ring = net('AB BC CD DE EF AF');
    expect(judge(taskOf('mincut', 6, ring, 0, 3), { edges: [], nodes: [], value: 1 })).toEqual({
      correct: false,
      feedback: { code: 'mincut.low', edges: [0, 1, 2, 3, 4, 5], nodes: [], value: 2 }
    });
  });

  it('lists a shown shortest route in ascending connection order, not travel order', () => {
    const w = net(TRIANGLE_W);
    // From D back to A the route travels CD, BC, AB (indices 3, 2, 0).
    expect(solutionOf(taskOf('path', 4, w, L('D'), L('A')))?.edges).toEqual([0, 2, 3]);
  });
});

/* ---------- Geometry ---------- */

describe('geometry boundaries', () => {
  const cases: [Point, Point, Point, Point][] = [
    [[0, 0], [10, 10], [0, 10], [10, 0]],
    [[0, 0], [10, 0], [0, 5], [10, 5]],
    [[0, 0], [10, 0], [5, 0], [5, 10]],
    [[0, 0], [10, 0], [5, 1], [5, 10]],
    [[0, 0], [10, 0], [5, 0], [20, 0]],
    [[0, 0], [10, 0], [11, 0], [20, 0]],
    [[0, 0], [10, 0], [10, 0], [10, 5]],
    [[0, 0], [4, 4], [6, 6], [10, 0]],
    [[0, 0], [10, 10], [10, 0], [6, 4]],
    [[3, 3], [3, 3], [0, 0], [10, 10]],
    [[0, 0], [10, 0], [-5, -5], [-1, 0]],
    [[0, 0], [10, 0], [5, -5], [5, -1]],
    [[0, 0], [0, 10], [0, 5], [10, 5]],
    [[0, 0], [10, 0], [12, 0], [12, 5]]
  ];
  const expected = [true, false, true, false, true, false, true, false, false, true, false, false, true, false];

  it('does not depend on translation, axis swap, endpoint order or segment order', () => {
    const move = ([x, y]: Point): Point => [x + 37, y + 53];
    const swap = ([x, y]: Point): Point => [y, x];
    cases.forEach(([p1, p2, p3, p4], k) => {
      const want = expected[k];
      const variants: [Point, Point, Point, Point][] = [
        [p1, p2, p3, p4],
        [p2, p1, p4, p3],
        [p3, p4, p1, p2],
        [p4, p3, p2, p1]
      ];
      for (const [a, b, c, d] of variants) {
        expect(segmentsIntersect(a, b, c, d), `case ${k}`).toBe(want);
        expect(segmentsIntersect(move(a), move(b), move(c), move(d)), `case ${k} moved`).toBe(want);
        expect(segmentsIntersect(swap(a), swap(b), swap(c), swap(d)), `case ${k} swapped`).toBe(want);
        expect(segmentsIntersect(move(swap(a)), move(swap(b)), move(swap(c)), move(swap(d))), `case ${k} swapped and moved`).toBe(want);
      }
    });
  });

  it('keeps exactly the clearance distance from other points', () => {
    expect(canDraw([[0, 0], [200, 0], [100, 34]], [], 0, 1), 'exactly the clearance').toBe(true);
    expect(canDraw([[0, 0], [200, 0], [100, 33]], [], 0, 1)).toBe(false);
    expect(canDraw([[10, 20], [10, 220], [44, 120]], [], 0, 1), 'vertical, exactly the clearance').toBe(true);
  });
});

/* ---------- Generator: task suitability ---------- */

describe('suitability boundaries', () => {
  it('bridge pairs may be exactly three connections apart', () => {
    const pairs = suitablePairs('bridge', 'easy', 7, net('AB BC AC CD DE EF DF FG'))!;
    expect(pairs).toContainEqual([L('A'), L('E')]);
  });

  it('allows a minimum cut of 4 only above easy', () => {
    // Two six-point cliques joined by four connections: A and G (one in each) need 4 cuts,
    // fewer than the 5 connections at either of them.
    const clique = (letters: string) => [...letters].flatMap((a, i) => [...letters.slice(i + 1)].map((b) => a + b));
    const edges = net([...clique('ABCDEF'), ...clique('GHIJKL'), 'BH', 'CI', 'DJ', 'EK'].join(' '));
    expect(maxFlow(12, edges, L('A'), L('G')).value).toBe(4);
    expect(suitablePairs('mincut', 'easy', 12, edges)).not.toContainEqual([L('A'), L('G')]);
    expect(suitablePairs('mincut', 'medium', 12, edges)).toContainEqual([L('A'), L('G')]);
    expect(suitablePairs('mincut', 'hard', 12, edges)).toContainEqual([L('A'), L('G')]);
  });

  it('augment: one bridge is enough on easy; one extra connection is enough', () => {
    expect(suitablePairs('augment', 'easy', 6, net(BARBELL))).toEqual([[-1, -1]]);
    expect(suitablePairs('augment', 'medium', 5, net('AB BC AC CD DE'))).toEqual([[-1, -1]]);
  });

  it('cutvertex: two leaves are fine on easy only; one extra connection is too few', () => {
    const twoLeaves = net('AB AC AD BC BD CD AE AF');
    expect(suitablePairs('cutvertex', 'easy', 6, twoLeaves)).toEqual([[-1, -1]]);
    expect(suitablePairs('cutvertex', 'medium', 6, twoLeaves)).toBeNull();
    expect(suitablePairs('cutvertex', 'easy', 5, net('AB BC CD AD AE')), 'only one extra connection').toBeNull();
  });

  it('generates the same sessions as before for fixed seeds (save and share stability)', () => {
    const fingerprints = Object.fromEntries(DIFFICULTIES.map((d) => [d, [1, 2024].map((seed) => fnv(JSON.stringify(createInitialState(seed, d))))]));
    expect(fingerprints).toEqual({ easy: ['6aef215e', '4b37ea57'], medium: ['e3a48dd4', 'bb21e98a'], hard: ['58edb555', 'de4f299b'] });
  });
});

/* ---------- State transitions ---------- */

describe('selection boundaries', () => {
  it('clears a selection that consists of connections only', () => {
    const s = toggleEdge(withTask(taskOf('bridge', 6, net(BARBELL), 0, 5)), 2);
    expect(currentProgress(s).edges).toEqual([2]);
    expect(currentProgress(clearSelection(s)).edges).toEqual([]);
  });
});

/* ---------- Validation ---------- */

describe('isGdState boundaries', () => {
  it('rejects unknown task types even without named points', () => {
    const task = taskOf('cutvertex', 6, net(BARBELL));
    expect(isGdState(withTask(task))).toBe(true);
    expect(isGdState(withTask({ ...task, type: 'maze' as TaskType }))).toBe(false);
  });

  it('accepts up to MAX_NODES points', () => {
    const chain = (n: number) => net(Array.from({ length: n - 1 }, (_, i) => String.fromCharCode(65 + i, 66 + i)).join(' '));
    expect(isGdState(withTask(taskOf('cutvertex', 16, chain(16))))).toBe(true);
    expect(isGdState(withTask(taskOf('cutvertex', 17, chain(17))))).toBe(false);
  });

  it('checks the shape of every position', () => {
    const task = taskOf('cutvertex', 6, net(BARBELL));
    const bad = (p: unknown) => isGdState(withTask({ ...task, pos: [p as Point, ...task.pos.slice(1)] }));
    expect(bad([50, 50])).toBe(true);
    expect(bad([50, 50, 7])).toBe(false);
    expect(bad({ 0: 50, 1: 50, length: 2 })).toBe(false);
  });

  it('accepts a complete network and checks the shape of every connection', () => {
    expect(isGdState(withTask(taskOf('mincut', 4, net('AB AC AD BC BD CD'), 0, 3)))).toBe(true);
    const task = taskOf('cutvertex', 6, net(BARBELL));
    expect(isGdState(withTask({ ...task, edges: [[0, 1, 1, 5] as unknown as Edge, ...task.edges.slice(1)] }))).toBe(false);
  });

  it('rejects a route task from a point to itself', () => {
    expect(isGdState(withTask(taskOf('path', 4, net(TRIANGLE_W), 0, 3)))).toBe(true);
    expect(isGdState(withTask(taskOf('path', 4, net(TRIANGLE_W), 0, 0)))).toBe(false);
  });

  it('checks the selection shape of the current task', () => {
    const cut = at('cutvertex');
    expect(isGdState(cut.state)).toBe(true);
    expect(isGdState(withProgress(cut.state, cut.i, { edges: [0] }))).toBe(false);
    const aug = at('augment');
    expect(isGdState(withProgress(aug.state, aug.i, { edges: [0] }))).toBe(false);
    const path = at('path');
    const pathEdges = path.state.tasks[path.i]!.edges.length;
    expect(isGdState(withProgress(path.state, path.i, { edges: [0, pathEdges - 1] }))).toBe(true);
    expect(isGdState(withProgress(path.state, path.i, { edges: [0, 0] }))).toBe(false);
    expect(isGdState(withProgress(path.state, path.i, { edges: [pathEdges] }))).toBe(false);
  });

  it('allows a chosen number only for the current minimum-cut task', () => {
    const bridge = at('bridge');
    expect(isGdState(withProgress(bridge.state, bridge.i, { value: 1 }))).toBe(false);
    const m = at('mincut');
    expect(isGdState(withProgress(m.state, m.i, { value: -1 }))).toBe(true);
    expect(isGdState(withProgress(m.state, m.i, { value: 1 }))).toBe(true);
    expect(isGdState(withProgress(m.state, m.i, { value: MAX_CHOICE }))).toBe(true);
    expect(isGdState(withProgress(m.state, m.i, { value: 0 }))).toBe(false);
    expect(isGdState(withProgress(m.state, m.i, { value: MAX_CHOICE + 1 }))).toBe(false);
  });

  it('rejects an answered task that still carries an explanation of its own type', () => {
    const { state, i } = at('cutvertex');
    const shown = showSolution(state);
    expect(isGdState(shown)).toBe(true);
    expect(isGdState(withProgress(shown, i, { feedback: { code: 'cutvertex.connected', edges: [], nodes: [0], value: 0 } }))).toBe(false);
  });

  it('keeps later tasks untouched', () => {
    // A session where both a route and a cut-point task come after the first task.
    let seed = 1;
    const later = (s: GdState, type: TaskType) => s.tasks.findIndex((t, i) => i > 0 && t.type === type);
    while (later(createInitialState(seed, 'medium'), 'cutvertex') < 0 || later(createInitialState(seed, 'medium'), 'path') < 0) seed++;
    const base = createInitialState(seed, 'medium');
    const p = later(base, 'path');
    const c = later(base, 'cutvertex');
    expect(isGdState(base)).toBe(true);
    expect(isGdState(withProgress(base, p, { edges: [0] }))).toBe(false);
    expect(isGdState(withProgress(base, c, { nodes: [0] }))).toBe(false);
    expect(isGdState(withProgress(base, c, { feedback: { code: 'cutvertex.connected', edges: [], nodes: [0], value: 0 } }))).toBe(false);
  });

  it('checks the number of tasks and the index of a finished session', () => {
    let done = createInitialState(5, 'medium');
    for (let i = 0; i < 6; i++) done = nextTask(showSolution(done));
    expect(done.index).toBe(5);
    expect(isGdState(done)).toBe(true);
    expect(isGdState({ ...done, index: 6 })).toBe(false);
    const base = createInitialState(5, 'medium');
    expect(isGdState({ ...base, tasks: [...base.tasks, base.tasks[0]!] })).toBe(false);
  });
});
