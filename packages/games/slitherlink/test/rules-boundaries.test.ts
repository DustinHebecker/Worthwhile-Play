/**
 * Exact values and boundaries that the property tests in rules.test.ts leave open (found by
 * mutation testing): fixed generator output per seed, the loop rule on its own, and save
 * validation with one change per case on an otherwise valid state.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import {
  CROSS,
  DIFFICULTIES,
  LINE,
  MAX_HISTORY,
  NO_CLUE,
  UNKNOWN,
  attemptSeed,
  boundaryOf,
  cellEdges,
  check,
  clueTotal,
  cluesOf,
  createInitialState,
  cycleEdge,
  edgeCount,
  fallbackPuzzle,
  generatePuzzle,
  growRegion,
  isLoop,
  isSlitherlinkState,
  isSolution,
  setEdge,
  solve,
  thinClues,
  undo,
  type SlitherlinkState
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const fnv = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16);
};
/** Edge marks with LINE on the listed edges and UNKNOWN elsewhere. */
const withLines = (n: number, list: readonly number[]) => {
  const edges = new Array<number>(edgeCount(n)).fill(UNKNOWN);
  for (const e of list) edges[e] = LINE;
  return edges;
};

describe('generator output is fixed per seed', () => {
  it('derives the documented attempt seeds', () => {
    expect(attemptSeed(1, 0)).toBe(2726825882);
    expect(attemptSeed(0xdeadbeef, 3)).toBe(3450986135);
  });

  it('grows the same region for a seed', () => {
    const inside = growRegion(createRng(3), 6, 10);
    expect(inside.flatMap((cell, i) => (cell ? [i] : []))).toEqual([6, 12, 13, 14, 18, 19, 20, 21, 25, 27]);
  });

  it('generates the same puzzles as before (save and share stability)', { timeout: 60_000 }, () => {
    const fingerprints = Object.fromEntries(DIFFICULTIES.map((d) => [d, [1, 2024].map((seed) => fnv(JSON.stringify(generatePuzzle(seed, d))))]));
    expect(fingerprints).toEqual({ easy: ['13e51d61', '272b56e'], medium: ['22caf42', '5050af0f'], hard: ['e6bfa07', 'd3905479'] });
  });

  it('uses a ring one cell inside the border as the fallback', () => {
    // prettier-ignore
    expect(fallbackPuzzle('easy').clues).toEqual([
      0, 1, 1, 1, 0,
      1, 2, 1, 2, 1,
      1, 1, 0, 1, 1,
      1, 2, 1, 2, 1,
      0, 1, 1, 1, 0
    ]);
  });

  it('counts only real clues when thinning', () => {
    // A 3 × 3 board around the 2 × 2 block at the top left, already thinned to 7 clues.
    const n = 3;
    const full = cluesOf(n, boundaryOf(n, [true, true, false, true, true, false, false, false, false]));
    const seven = thinClues(createRng(1), n, full, 7);
    expect(clueTotal({ clues: seven })).toBe(7);
    expect(clueTotal({ clues: thinClues(createRng(2), n, seven, 6) })).toBe(6);
  });
});

describe('solver boundaries', () => {
  const n = 4;
  const none = () => new Array<number>(n * n).fill(NO_CLUE);
  const [t, b, l, r] = cellEdges(n, 1, 1);

  it('crosses a closing line when a far-away clue would stay unmet (loop rule alone)', () => {
    const far = none();
    far[15] = 2;
    expect(solve(n, far, withLines(n, [t, l, b])).edges[r]).toBe(CROSS);
    expect(solve(n, none(), withLines(n, [t, l, b])).edges[r]).toBe(UNKNOWN);
  });

  it('keeps a closing line open when it is the side that meets a neighbouring clue', () => {
    const near = none();
    near[6] = 1; // cell (1, 2), whose left side is the closing line
    expect(solve(n, near, withLines(n, [t, l, b])).edges[r]).toBe(UNKNOWN);
  });

  it('detects a clue with too many crossed sides', () => {
    const clues = new Array<number>(9).fill(NO_CLUE);
    clues[4] = 3;
    const start = new Array<number>(edgeCount(3)).fill(UNKNOWN);
    const [top, , left] = cellEdges(3, 1, 1);
    start[top] = CROSS;
    start[left] = CROSS;
    expect(solve(3, clues, start).contradiction).toBe(true);
  });

  it('rejects edge lists and clue lists of the wrong length', () => {
    expect(isLoop(1, [LINE, LINE, LINE, LINE, CROSS])).toBe(false);
    expect(isSolution(1, [4, NO_CLUE], [LINE, LINE, LINE, LINE])).toBe(false);
    expect(isSolution(1, [4], [LINE, LINE, LINE, LINE])).toBe(true);
  });
});

describe('state boundaries', () => {
  it('undo removes exactly the latest history entry', () => {
    let s = createInitialState(12, 'easy');
    s = setEdge(setEdge(setEdge(s, 0, LINE), 1, LINE), 2, CROSS);
    expect(s.history).toHaveLength(3);
    expect(undo(s).history).toEqual([
      [0, UNKNOWN],
      [1, UNKNOWN]
    ]);
  });

  it('validates history entries and their count', () => {
    const played = check(cycleEdge(cycleEdge(createInitialState(12, 'easy'), 0), 7));
    const bad = (patch: (s: SlitherlinkState) => void) => {
      const s = clone(played);
      s.moves = MAX_HISTORY + 10; // enough moves for any history below
      patch(s);
      return isSlitherlinkState(s);
    };
    expect(bad(() => undefined)).toBe(true);
    expect(bad((s) => (s.history = Array.from({ length: MAX_HISTORY }, () => [0, 0] as [number, number])))).toBe(true);
    expect(bad((s) => (s.history = Array.from({ length: MAX_HISTORY + 1 }, () => [0, 0] as [number, number])))).toBe(false);
    expect(bad((s) => s.history.push([0] as never))).toBe(false);
    expect(bad((s) => s.history.push([0, 0, 0] as never))).toBe(false);
    expect(bad((s) => s.history.push('ab' as never))).toBe(false);
    expect(bad((s) => s.history.push([edgeCount(5) - 1, CROSS]))).toBe(true);
    expect(bad((s) => s.history.push([edgeCount(5), 0]))).toBe(false);
    expect(bad((s) => s.history.push([0, 3]))).toBe(false);
    expect(bad((s) => s.history.push([-1, 0]))).toBe(false);
  });
});
