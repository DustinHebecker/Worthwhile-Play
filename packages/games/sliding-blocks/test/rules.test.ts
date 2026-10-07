import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import { PUZZLES } from '../src/puzzles';
import {
  BANDS,
  CELLS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  EXIT_COL,
  LayoutError,
  MAX_BLOCKS,
  MAX_HISTORY,
  MAX_OPTIMUM,
  RESTART,
  SIZE,
  appendEntry,
  canRestart,
  canUndo,
  cellsOf,
  createInitialState,
  deltaToCell,
  entryOf,
  findSolution,
  isLayout,
  isSlidingBlocksState,
  isSolvedAt,
  layoutProblem,
  layoutString,
  legalMoves,
  mirrorLayout,
  move,
  occupancy,
  parseEntry,
  parseLayout,
  placeAt,
  progressOf,
  puzzleCount,
  puzzleFor,
  replay,
  resetState,
  restart,
  slide,
  slideRange,
  solve,
  startPositions,
  toDifficulty,
  undo,
  type Block,
  type Difficulty,
  type Positions,
  type SlidingBlocksState
} from '../src/rules';
import { oracleFlip, oracleNeighbours, oracleSlide, oracleSolve, oracleSolved } from './oracle';

/* ---------- Helpers ---------- */

const ALL = DIFFICULTIES.flatMap((difficulty) => PUZZLES[difficulty].map((source, index) => ({ difficulty, index, ...source })));

/*
 * A small hand-made layout used throughout:
 *   row 0: a a . . . b
 *   row 1: c . . . . b
 *   row 2: c x x d . b      ← star block, exit on the right
 *   row 3: c . . d . .
 *   row 4: . . . . e e
 *   row 5: f f f . . .
 */
const SAMPLE_ROWS = ['aa...b', 'c....b', 'cxxd.b', 'c..d..', '....ee', 'fff...'];
const SAMPLE_LAYOUT = SAMPLE_ROWS.join('');
const sampleBlocks = () => parseLayout(SAMPLE_LAYOUT);
const sampleState = (history: string[] = []): SlidingBlocksState => ({
  seed: 0,
  difficulty: 'easy',
  puzzle: { blocks: sampleBlocks(), optimum: solve(sampleBlocks()) as number },
  history
});
const letterOf = (id: number) => (id === 0 ? 'x' : 'abcdefghijklmnopqr'.charAt(id - 1));

/** Applies (id, delta) attempts, skipping illegal ones, like a player would. */
const playAll = (state: SlidingBlocksState, attempts: readonly [number, number][]) => attempts.reduce((s, [id, d]) => move(s, id, d), state);

const attemptArb = fc.array(fc.tuple(fc.integer({ min: 0, max: 15 }), fc.integer({ min: -5, max: 5 })), { maxLength: 40 });
const puzzleArb = fc.constantFrom(...ALL.map(({ layout }) => layout));

/* ---------- Configuration ---------- */

describe('configuration', () => {
  it('declares difficulties easy → hard with their move bands', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    expect(metadata.difficulties).toEqual(DIFFICULTIES);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(BANDS).toEqual({ easy: [4, 10], medium: [11, 20], hard: [21, MAX_OPTIMUM] });
    expect([SIZE, CELLS, EXIT_COL, MAX_BLOCKS, MAX_OPTIMUM, MAX_HISTORY, RESTART]).toEqual([6, 36, 4, 18, 200, 5000, '*']);
    expect(metadata.id).toBe('sliding-blocks');
    expect(metadata.skills).toEqual(['planning', 'spatial']);
    expect(metadata.typicalMinutes).toEqual([1, 10]);
    expect(metadata.capabilities.offline).toBe(true);
  });

  it('toDifficulty accepts known ids and falls back to easy', () => {
    expect(toDifficulty('easy')).toBe('easy');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('HARD')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(toDifficulty(1)).toBe('easy');
  });

  it('ships 30 distinct, canonical puzzles per difficulty, also distinct when flipped', () => {
    for (const d of DIFFICULTIES) expect(puzzleCount(d)).toBe(30);
    const all = ALL.map((p) => p.layout);
    const flipped = all.map(mirrorLayout);
    expect(new Set([...all, ...flipped]).size).toBe(all.length * 2);
    for (const { layout } of ALL) {
      expect(layoutString(parseLayout(layout))).toBe(layout);
      expect(parseLayout(layout)[0]?.row).toBe(2);
    }
  });

  it('every optimum lies in its difficulty band, sorted ascending', () => {
    for (const d of DIFFICULTIES) {
      const optima = PUZZLES[d].map((p) => p.optimum);
      expect([...optima].sort((a, b) => a - b)).toEqual(optima);
      for (const optimum of optima) {
        expect(optimum).toBeGreaterThanOrEqual(BANDS[d][0]);
        expect(optimum).toBeLessThanOrEqual(BANDS[d][1]);
      }
    }
  });
});

/* ---------- Solver proof ---------- */

describe('solver proof: every shipped puzzle needs exactly its recorded optimum', () => {
  it.each(ALL.map((p) => [`${p.difficulty} ${p.index + 1}`, p] as const))('%s', (_, { layout, optimum }) => {
    expect(oracleSolve(layout)).toBe(optimum);
    const blocks = parseLayout(layout);
    expect(solve(blocks)).toBe(optimum);
    // The solver's own path is legal for the oracle and frees the star block in `optimum` moves.
    const path = findSolution(blocks) as { id: number; delta: number }[];
    expect(path).toHaveLength(optimum);
    let grid: string | null = layout;
    for (const { id, delta } of path) grid = grid && oracleSlide(grid, letterOf(id), delta);
    expect(grid && oracleSolved(grid)).toBe(true);
  }, 60_000);

  it('the flipped boards have the same optimum (oracle, a sample per difficulty)', () => {
    for (const d of DIFFICULTIES) {
      for (const source of PUZZLES[d].filter((_, i) => i % 10 === 0)) {
        expect(oracleSolve(mirrorLayout(source.layout))).toBe(source.optimum);
        expect(oracleFlip(source.layout)).toBe(mirrorLayout(source.layout));
      }
    }
  }, 120_000);

  it('solutions played through the real rules solve the state with moves = optimum', () => {
    for (const d of DIFFICULTIES) {
      for (const seed of [0, 7, 31]) {
        const state = createInitialState(seed, d);
        const path = findSolution(state.puzzle.blocks) as { id: number; delta: number }[];
        const solved = path.reduce((s, m) => move(s, m.id, m.delta), state);
        const progress = progressOf(solved);
        expect(progress.solved).toBe(true);
        expect(progress.moves).toBe(state.puzzle.optimum);
        expect(solved.history).toEqual(path.map(entryOf));
        expect(isSlidingBlocksState(solved)).toBe(true);
      }
    }
  }, 60_000);
});

describe('solve / findSolution', () => {
  it('returns [] for a solved start and null for an unsolvable layout', () => {
    // Star block already at the exit (bypassing parseLayout's check).
    expect(findSolution([{ row: 2, col: 4, len: 2, orient: 'h' }])).toEqual([]);
    expect(solve([{ row: 2, col: 4, len: 2, orient: 'h' }])).toBe(0);
    // A vertical length-3 block in column 5 rows 0–2 and another in rows 3–5 seal the exit.
    const sealed: Block[] = [
      { row: 2, col: 0, len: 2, orient: 'h' },
      { row: 0, col: 5, len: 3, orient: 'v' },
      { row: 3, col: 5, len: 3, orient: 'v' }
    ];
    expect(findSolution(sealed)).toBeNull();
    expect(solve(sealed)).toBeNull();
  });

  it('a free star block needs one move; the sample needs the oracle’s count', () => {
    expect(findSolution([{ row: 2, col: 0, len: 2, orient: 'h' }])).toEqual([{ id: 0, delta: 4 }]);
    expect(solve(sampleBlocks())).toBe(oracleSolve(SAMPLE_LAYOUT));
  });

  it('gives up (null) when the search exceeds the position limit', () => {
    const blocks = parseLayout(PUZZLES.hard[0]!.layout);
    expect(solve(blocks, 5)).toBeNull();
    expect(solve(blocks)).toBe(PUZZLES.hard[0]!.optimum);
  });
});

/* ---------- Geometry ---------- */

describe('geometry', () => {
  it('startPositions, placeAt and cellsOf follow each block’s axis', () => {
    const blocks = sampleBlocks();
    expect(blocks[0]).toEqual({ row: 2, col: 1, len: 2, orient: 'h' });
    expect(startPositions(blocks)).toEqual([1, 0, 0, 1, 2, 4, 0]);
    const v = { row: 1, col: 3, len: 3, orient: 'v' } as const;
    expect(placeAt(v, 2)).toEqual({ row: 2, col: 3 });
    expect(cellsOf(v, 2)).toEqual([15, 21, 27]);
    const hb = { row: 4, col: 0, len: 2, orient: 'h' } as const;
    expect(placeAt(hb, 3)).toEqual({ row: 4, col: 3 });
    expect(cellsOf(hb, 3)).toEqual([27, 28]);
  });

  it('occupancy marks every block cell with its id', () => {
    const blocks = sampleBlocks();
    const grid = occupancy(blocks, startPositions(blocks));
    expect(grid.map((id) => (id < 0 ? '.' : letterOf(id))).join('')).toBe(SAMPLE_LAYOUT);
  });

  it('slideRange reports the free cells on both sides', () => {
    const blocks = sampleBlocks();
    const start = startPositions(blocks);
    expect(slideRange(blocks, start, 0)).toEqual({ min: 0, max: 0 }); // x: c on the left, d on the right
    expect(slideRange(blocks, start, 1)).toEqual({ min: 0, max: 3 }); // a: board edge, then free up to b
    expect(slideRange(blocks, start, 2)).toEqual({ min: 0, max: 1 }); // b: top edge, then e below row 3
    expect(slideRange(blocks, start, 3)).toEqual({ min: 0, max: 1 }); // c: a above, f below row 4
    expect(slideRange(blocks, start, 4)).toEqual({ min: -2, max: 2 }); // d: free column both ways
    expect(slideRange(blocks, start, 5)).toEqual({ min: -4, max: 0 }); // e: right edge
    expect(slideRange(blocks, start, 6)).toEqual({ min: 0, max: 3 }); // f: left edge
  });

  it('slide rejects zero, fractional, out-of-range and unknown moves', () => {
    const blocks = sampleBlocks();
    const start = startPositions(blocks);
    expect(slide(blocks, start, 1, 0)).toBeNull();
    expect(slide(blocks, start, 1, 0.5)).toBeNull();
    expect(slide(blocks, start, 1, 4)).toBeNull();
    expect(slide(blocks, start, 1, -1)).toBeNull();
    expect(slide(blocks, start, 4, -3)).toBeNull();
    expect(slide(blocks, start, 4, 3)).toBeNull();
    expect(slide(blocks, start, 4, -2)).toEqual([1, 0, 0, 1, 0, 4, 0]);
    expect(slide(blocks, start, 1, 3)).toEqual([1, 3, 0, 1, 2, 4, 0]);
    expect(slide(blocks, start, 7, 1)).toBeNull();
    expect(slide(blocks, start, -1, 1)).toBeNull();
    expect(slide(blocks, start, 1, 2)).toEqual([1, 2, 0, 1, 2, 4, 0]);
    expect(slide(blocks, start, 5, -4)).toEqual([1, 0, 0, 1, 2, 0, 0]);
    expect(start).toEqual([1, 0, 0, 1, 2, 4, 0]);
  });

  it('legalMoves lists every slide by id, then delta', () => {
    const blocks = sampleBlocks();
    const moves = legalMoves(blocks, startPositions(blocks));
    expect(moves).toEqual([
      { id: 1, delta: 1 },
      { id: 1, delta: 2 },
      { id: 1, delta: 3 },
      { id: 2, delta: 1 },
      { id: 3, delta: 1 },
      { id: 4, delta: -2 },
      { id: 4, delta: -1 },
      { id: 4, delta: 1 },
      { id: 4, delta: 2 },
      { id: 5, delta: -4 },
      { id: 5, delta: -3 },
      { id: 5, delta: -2 },
      { id: 5, delta: -1 },
      { id: 6, delta: 1 },
      { id: 6, delta: 2 },
      { id: 6, delta: 3 }
    ]);
    // Same set as the oracle's neighbours.
    const ours = moves.map(({ id, delta }) => layoutString(blocks, slide(blocks, startPositions(blocks), id, delta) as Positions)).sort();
    expect(ours).toEqual(oracleNeighbours(SAMPLE_LAYOUT).sort());
  });

  it('isSolvedAt checks the star block’s column only', () => {
    expect(isSolvedAt([4, 0])).toBe(true);
    expect(isSolvedAt([3, 4])).toBe(false);
    expect(isSolvedAt([5])).toBe(false);
  });
});

describe('move legality (property-based, against the oracle)', () => {
  it('slides agree with the oracle; blocks never overlap, leave the board or leave their axis', () => {
    fc.assert(
      fc.property(puzzleArb, attemptArb, (layout, attempts) => {
        const blocks = parseLayout(layout);
        let positions = startPositions(blocks);
        let grid = layout;
        for (const [rawId, delta] of attempts) {
          const id = rawId % blocks.length;
          const ours = slide(blocks, positions, id, delta);
          const theirs = oracleSlide(grid, letterOf(id), delta);
          expect(ours === null).toBe(theirs === null);
          if (!ours || !theirs) continue;
          positions = ours;
          grid = theirs;
          expect(layoutString(blocks, positions)).toBe(grid);
          const occupied = occupancy(blocks, positions).filter((c) => c >= 0).length;
          expect(occupied).toBe(blocks.reduce((sum, b) => sum + b.len, 0));
          blocks.forEach((block, i) => {
            const { row, col } = placeAt(block, positions[i] as number);
            expect(block.orient === 'h' ? row : col).toBe(block.orient === 'h' ? block.row : block.col);
            expect(Math.min(row, col)).toBeGreaterThanOrEqual(0);
            expect((block.orient === 'h' ? col : row) + block.len).toBeLessThanOrEqual(SIZE);
          });
        }
      }),
      { numRuns: 150 }
    );
  });
});

/* ---------- Layout format ---------- */

describe('parseLayout / layoutString / mirrorLayout', () => {
  it('numbers blocks by first appearance with the star block first', () => {
    const blocks = sampleBlocks();
    expect(blocks).toEqual([
      { row: 2, col: 1, len: 2, orient: 'h' },
      { row: 0, col: 0, len: 2, orient: 'h' },
      { row: 0, col: 5, len: 3, orient: 'v' },
      { row: 1, col: 0, len: 3, orient: 'v' },
      { row: 2, col: 3, len: 2, orient: 'v' },
      { row: 4, col: 4, len: 2, orient: 'h' },
      { row: 5, col: 0, len: 3, orient: 'h' }
    ]);
    expect(layoutString(blocks)).toBe(SAMPLE_LAYOUT);
    // Letters are renamed to the canonical order.
    expect(layoutString(parseLayout(SAMPLE_LAYOUT.replace(/a/g, 'q').replace(/b/g, 'r').replace(/c/g, 'p')))).toBe(SAMPLE_LAYOUT);
  });

  it('mirrors rows top to bottom (an involution)', () => {
    expect(mirrorLayout(SAMPLE_LAYOUT)).toBe([...SAMPLE_ROWS].reverse().join(''));
    expect(mirrorLayout(mirrorLayout(SAMPLE_LAYOUT))).toBe(SAMPLE_LAYOUT);
    expect(parseLayout(mirrorLayout(SAMPLE_LAYOUT))[0]).toEqual({ row: 3, col: 1, len: 2, orient: 'h' });
  });

  it.each([
    ['too short', 'xx', /36 cells, got 2/],
    ['unknown character', 'xx#' + '.'.repeat(33), /unknown character "#" at cell 2/],
    ['no star block', 'aa' + '.'.repeat(34), /no star block/],
    ['single cell', 'xx.a' + '.'.repeat(32), /"a" is not a straight piece/],
    ['too long', 'xx.aaaa' + '.'.repeat(29), /"a" is not a straight piece/],
    ['wraps a row', '....aa' + 'a.....' + 'xx' + '.'.repeat(22), /"a" is not a straight piece/],
    ['bent', 'aa....a.....xx' + '.'.repeat(22), /"a" is not a straight piece/],
    ['wrapping star', '.....x' + 'x.....' + '.'.repeat(24), /"x" is not a straight piece/],
    ['vertical star', 'x.....x.....' + '.'.repeat(24), /star block must be horizontal/],
    ['long star', 'xxx...' + '.'.repeat(30), /star block must be horizontal with length 2/],
    ['star at exit', '....xx' + '.'.repeat(30), /already at the exit/],
    ['exit row blocked', 'xx..aa' + '.'.repeat(30), /blocks the exit row/]
  ])('rejects %s', (_, text, message) => {
    expect(() => parseLayout(text)).toThrow(LayoutError);
    expect(() => parseLayout(text)).toThrow(expect.objectContaining({ name: 'LayoutError' }));
    expect(() => parseLayout(text)).toThrow(message);
  });

  it('accepts horizontal blocks left of the star block and vertical ones anywhere', () => {
    expect(() => parseLayout('aaxx.b' + '.....b' + '.'.repeat(24))).not.toThrow();
  });
});

describe('layoutProblem / isLayout', () => {
  const star: Block = { row: 2, col: 0, len: 2, orient: 'h' };
  it('accepts the sample and flags each problem', () => {
    expect(layoutProblem(sampleBlocks())).toBeNull();
    expect(isLayout(sampleBlocks())).toBe(true);
    expect(layoutProblem([])).toMatch(/1 to 18 blocks/);
    expect(layoutProblem(Array.from({ length: 19 }, () => star))).toMatch(/1 to 18 blocks/);
    expect(layoutProblem([{ ...star, len: 3 }])).toMatch(/star block/);
    expect(layoutProblem([{ ...star, orient: 'v' }])).toMatch(/star block/);
    expect(layoutProblem([{ ...star, col: 4 }])).toMatch(/already at the exit/);
    expect(layoutProblem([star, { row: 1, col: 1, len: 2, orient: 'v' }])).toMatch(/overlap/);
    expect(layoutProblem([star, { row: 2, col: 3, len: 2, orient: 'h' }])).toMatch(/exit row/);
    expect(layoutProblem([{ ...star, col: 2 }, { row: 2, col: 0, len: 2, orient: 'h' }])).toBeNull();
    expect(layoutProblem([star, { row: 2, col: 3, len: 2, orient: 'v' }])).toBeNull();
    expect(layoutProblem([star, { row: 3, col: 3, len: 2, orient: 'h' }])).toBeNull();
  });

  it('isLayout rejects malformed blocks', () => {
    expect(isLayout('x')).toBe(false);
    expect(isLayout([star, null])).toBe(false);
    expect(isLayout([{ ...star, row: 6 }])).toBe(false);
    expect(isLayout([{ ...star, row: -1 }])).toBe(false);
    expect(isLayout([{ ...star, col: 5 }])).toBe(false); // does not fit
    expect(isLayout([star, { row: 4, col: 5, len: 3, orient: 'v' }])).toBe(false); // does not fit
    expect(isLayout([star, { row: 3, col: 5, len: 3, orient: 'v' }])).toBe(true); // fits exactly
    expect(isLayout([star, { row: 0, col: 3, len: 3, orient: 'h' }])).toBe(true);
    expect(isLayout([star, { row: 0, col: 4, len: 3, orient: 'h' }])).toBe(false);
    expect(isLayout([{ ...star, len: 1 }])).toBe(false);
    expect(isLayout([star, { row: 0, col: 0, len: 4, orient: 'v' }])).toBe(false);
    expect(isLayout([star, { row: 0, col: 0, len: 2, orient: 'd' }])).toBe(false);
    expect(isLayout([star, { row: 0.5, col: 0, len: 2, orient: 'v' }])).toBe(false);
    expect(isLayout([star, { row: 0, col: '0', len: 2, orient: 'v' }])).toBe(false);
  });
});

/* ---------- History ---------- */

describe('history entries and replay', () => {
  it('parses and formats move entries', () => {
    expect(parseEntry('3:-2')).toEqual({ id: 3, delta: -2 });
    expect(parseEntry('12:4')).toEqual({ id: 12, delta: 4 });
    expect(parseEntry('*')).toBeNull();
    expect(parseEntry('3:0')).toBeNull();
    expect(parseEntry('3:6')).toBeNull();
    expect(parseEntry('3:+1')).toBeNull();
    expect(parseEntry('123:1')).toBeNull();
    expect(parseEntry(' 3:1')).toBeNull();
    expect(parseEntry('3:1 ')).toBeNull();
    expect(entryOf({ id: 5, delta: -3 })).toBe('5:-3');
  });

  it('progressOf throws on a history the rules cannot produce', () => {
    expect(() => progressOf(sampleState(['1:4']))).toThrow('Invalid history');
  });

  it('replays moves and restarts, counting moves since the last restart', () => {
    const blocks = sampleBlocks();
    expect(replay(blocks, [])).toEqual({ positions: [1, 0, 0, 1, 2, 4, 0], moves: 0, solved: false });
    expect(replay(blocks, ['1:2', '6:3'])).toEqual({ positions: [1, 2, 0, 1, 2, 4, 3], moves: 2, solved: false });
    expect(replay(blocks, ['1:2', '*', '5:-1'])).toEqual({ positions: [1, 0, 0, 1, 2, 3, 0], moves: 1, solved: false });
    expect(replay(blocks, ['1:2', '*', '1:1'])).toEqual({ positions: [1, 1, 0, 1, 2, 4, 0], moves: 1, solved: false });
  });

  it('rejects illegal, unmerged, malformed and post-solution entries', () => {
    const blocks = sampleBlocks();
    expect(replay(blocks, ['1:4'])).toBeNull();
    expect(replay(blocks, ['0:1'])).toBeNull();
    expect(replay(blocks, ['1:1', '1:1'])).toBeNull();
    expect(replay(blocks, ['9:1'])).toBeNull();
    expect(replay(blocks, ['x'])).toBeNull();
    expect(replay(blocks, ['*'])).toBeNull();
    expect(replay(blocks, ['1:1', '*', '*'])).toBeNull();
    const free: Block[] = [{ row: 2, col: 0, len: 2, orient: 'h' }];
    expect(replay(free, ['0:4'])).toEqual({ positions: [4], moves: 1, solved: true });
    expect(replay(free, ['0:4', '*'])).toBeNull();
    expect(replay(free, ['0:3'])).toEqual({ positions: [3], moves: 1, solved: false });
  });
});

/* ---------- Game state ---------- */

describe('createInitialState / puzzleFor (determinism)', () => {
  it('is deterministic and stores the puzzle with its optimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom<Difficulty>(...DIFFICULTIES), (seed, d) => {
        const a = createInitialState(seed, d);
        expect(createInitialState(seed, d)).toEqual(a);
        expect(a).toEqual({ seed, difficulty: d, puzzle: puzzleFor(seed, d), history: [] });
        expect(isSlidingBlocksState(a)).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('maps seeds to list index and orientation', () => {
    const n = puzzleCount('easy');
    const at = (i: number) => PUZZLES.easy[i]!;
    expect(layoutString(puzzleFor(0, 'easy').blocks)).toBe(at(0).layout);
    expect(layoutString(puzzleFor(3, 'easy').blocks)).toBe(at(3).layout);
    expect(layoutString(puzzleFor(n + 3, 'easy').blocks)).toBe(layoutString(parseLayout(mirrorLayout(at(3).layout))));
    expect(layoutString(puzzleFor(2 * n + 3, 'easy').blocks)).toBe(at(3).layout);
    expect(puzzleFor(n + 3, 'easy').optimum).toBe(at(3).optimum);
    expect(puzzleFor(5, 'hard').optimum).toBe(PUZZLES.hard[5]!.optimum);
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(9).difficulty).toBe('easy');
  });

  it('resetState returns to the seeded start without sharing objects', () => {
    const state = move(createInitialState(4, 'medium'), ...firstMove(createInitialState(4, 'medium')));
    const reset = resetState(state);
    expect(reset).toEqual(createInitialState(4, 'medium'));
    expect(reset.puzzle.blocks[0]).not.toBe(state.puzzle.blocks[0]);
  });
});

function firstMove(state: SlidingBlocksState): [number, number] {
  const m = legalMoves(state.puzzle.blocks, progressOf(state).positions)[0]!;
  return [m.id, m.delta];
}

describe('move', () => {
  it('appends a legal slide and leaves illegal ones as the same object', () => {
    const s = sampleState();
    const next = move(s, 1, 2);
    expect(next.history).toEqual(['1:2']);
    expect(s.history).toEqual([]);
    expect(move(s, 1, 4)).toBe(s);
    expect(move(s, 0, 1)).toBe(s);
    expect(move(s, 1, 0)).toBe(s);
    expect(move(s, 99, 1)).toBe(s);
  });

  it('merges consecutive slides of the same block into one move and drops a net-zero move', () => {
    let s = move(sampleState(), 1, 1);
    s = move(s, 1, 1);
    expect(s.history).toEqual(['1:2']);
    expect(progressOf(s).moves).toBe(1);
    s = move(s, 6, 2);
    s = move(s, 1, -1);
    expect(s.history).toEqual(['1:2', '6:2', '1:-1']);
    s = move(s, 1, 1);
    expect(s.history).toEqual(['1:2', '6:2']);
    s = move(s, 6, -2);
    expect(s.history).toEqual(['1:2']);
  });

  it('does not merge across a restart', () => {
    const s = move(restart(move(sampleState(), 1, 1)), 1, 1);
    expect(s.history).toEqual(['1:1', '*', '1:1']);
  });

  it('refuses moves once solved', () => {
    const free: SlidingBlocksState = { ...sampleState(), puzzle: { blocks: [{ row: 2, col: 0, len: 2, orient: 'h' }, { row: 0, col: 0, len: 2, orient: 'v' }], optimum: 1 } };
    const solved = move(free, 0, 4);
    expect(progressOf(solved)).toEqual({ positions: [4, 0], moves: 1, solved: true });
    expect(move(solved, 1, 1)).toBe(solved);
    expect(move(solved, 0, -1)).toBe(solved);
    expect(canUndo(solved)).toBe(false);
    expect(undo(solved)).toBe(solved);
    expect(canRestart(solved)).toBe(false);
    expect(restart(solved)).toBe(solved);
  });

  it('keeps every reachable state valid and replayable (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), fc.constantFrom<Difficulty>(...DIFFICULTIES), attemptArb, (seed, d, attempts) => {
        const state = playAll(createInitialState(seed, d), attempts);
        expect(isSlidingBlocksState(JSON.parse(JSON.stringify(state)))).toBe(true);
        const history = state.history;
        for (let i = 1; i < history.length; i++) {
          const a = parseEntry(history[i - 1]!);
          const b = parseEntry(history[i]!);
          if (a && b) expect(a.id).not.toBe(b.id);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('undo / restart', () => {
  it('undo inverts a move of a different block exactly (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), attemptArb, fc.nat(), (seed, attempts, pick) => {
        const s = playAll(createInitialState(seed, 'medium'), attempts);
        if (progressOf(s).solved) return;
        const last = parseEntry(s.history[s.history.length - 1] ?? '');
        const options = legalMoves(s.puzzle.blocks, progressOf(s).positions).filter((m) => m.id !== last?.id);
        if (options.length === 0) return;
        const m = options[pick % options.length]!;
        const next = move(s, m.id, m.delta);
        expect(progressOf(next).moves).toBe(progressOf(s).moves + 1);
        expect(undo(next)).toEqual(s);
      }),
      { numRuns: 100 }
    );
  });

  it('undoing everything returns to the start positions (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), attemptArb, (seed, attempts) => {
        const start = createInitialState(seed, 'easy');
        let s = playAll(start, attempts);
        if (progressOf(s).solved) return;
        while (canUndo(s)) s = undo(s);
        expect(s).toEqual(start);
        expect(undo(s)).toBe(s);
      }),
      { numRuns: 100 }
    );
  });

  it('restart is recorded and undoable; it needs a move since the last restart', () => {
    const s0 = sampleState();
    expect(canUndo(s0)).toBe(false);
    expect(canRestart(s0)).toBe(false);
    expect(restart(s0)).toBe(s0);
    const s1 = move(s0, 1, 2);
    expect(canUndo(s1)).toBe(true);
    expect(canRestart(s1)).toBe(true);
    const s2 = restart(s1);
    expect(s2.history).toEqual(['1:2', '*']);
    expect(progressOf(s2)).toEqual({ positions: startPositions(s0.puzzle.blocks), moves: 0, solved: false });
    expect(canRestart(s2)).toBe(false);
    expect(restart(s2)).toBe(s2);
    expect(canUndo(s2)).toBe(true);
    expect(undo(s2)).toEqual(s1);
    expect(undo(s1)).toEqual(s0);
  });

  it('appendEntry drops the oldest attempts beyond the limit, or refuses without a restart', () => {
    const s = sampleState(['1:1', '*', '1:2', '*', '6:1']);
    expect(appendEntry(s, '1:1', 10).history).toEqual([...s.history, '1:1']);
    expect(appendEntry(s, '1:1', 6).history).toEqual([...s.history, '1:1']);
    expect(appendEntry(s, '1:1', 5).history).toEqual(['1:2', '*', '6:1', '1:1']);
    expect(appendEntry(s, '1:1', 3).history).toEqual(['6:1', '1:1']);
    // A restart at the very front is dropped too.
    expect(appendEntry(sampleState(['*', '1:1']), '6:1', 2).history).toEqual(['1:1', '6:1']);
    const noRestart = sampleState(['1:1', '6:1']);
    expect(appendEntry(noRestart, '4:1', 2)).toBe(noRestart);
    expect(appendEntry(noRestart, '4:1').history).toEqual(['1:1', '6:1', '4:1']);
  });
});

describe('deltaToCell (tap a square on the block’s line)', () => {
  it('moves the far end onto cells ahead and the near end onto cells behind', () => {
    const blocks = sampleBlocks();
    const start = startPositions(blocks);
    expect(deltaToCell(blocks, start, 1, 0, 4)).toBe(3); // a (cols 0–1) → right end on col 4
    expect(deltaToCell(blocks, start, 1, 0, 2)).toBe(1);
    expect(deltaToCell(blocks, start, 5, 4, 0)).toBe(-4); // e (cols 4–5) → left end on col 0
    expect(deltaToCell(blocks, start, 5, 4, 3)).toBe(-1);
    expect(deltaToCell(blocks, start, 4, 1, 3)).toBe(-1); // d (rows 2–3) up one
    expect(deltaToCell(blocks, start, 4, 5, 3)).toBe(2);
    expect(deltaToCell(blocks, start, 4, 4, 3)).toBe(1);
  });

  it('returns null off the line, on the block itself, or for an unknown block', () => {
    const blocks = sampleBlocks();
    const start = startPositions(blocks);
    expect(deltaToCell(blocks, start, 1, 1, 3)).toBeNull();
    expect(deltaToCell(blocks, start, 4, 0, 2)).toBeNull();
    expect(deltaToCell(blocks, start, 4, 5, 4)).toBeNull();
    expect(deltaToCell(blocks, start, 4, 2, 2)).toBeNull();
    expect(deltaToCell(blocks, start, 1, 0, 0)).toBeNull();
    expect(deltaToCell(blocks, start, 1, 0, 1)).toBeNull();
    expect(deltaToCell(blocks, start, 4, 2, 3)).toBeNull();
    expect(deltaToCell(blocks, start, 4, 3, 3)).toBeNull();
    expect(deltaToCell(blocks, start, 42, 0, 0)).toBeNull();
  });
});

/* ---------- Validation ---------- */

/** A legal back-and-forth history of `n` entries for the sample. */
const cycle = (n: number) => Array.from({ length: n }, (_, i) => ['1:1', '6:1', '1:-1', '6:-1'][i % 4] as string);

describe('isSlidingBlocksState', () => {
  const valid = () => createInitialState(3, 'medium');
  it('accepts fresh, played and restarted states', () => {
    expect(isSlidingBlocksState(valid())).toBe(true);
    expect(isSlidingBlocksState(sampleState(['1:2', '*', '6:1']))).toBe(true);
  });

  // Values are built lazily inside the test (not while collecting), so mutation coverage is per test.
  it.each([
    ['null', () => null],
    ['array', () => []],
    ['missing seed', () => ({ ...sampleState(), seed: undefined })],
    ['negative seed', () => ({ ...sampleState(), seed: -1 })],
    ['too large seed', () => ({ ...sampleState(), seed: 2 ** 32 })],
    ['unknown difficulty', () => ({ ...sampleState(), difficulty: 'expert' })],
    ['missing puzzle', () => ({ ...sampleState(), puzzle: null })],
    ['optimum 0', () => ({ ...sampleState(), puzzle: { ...sampleState().puzzle, optimum: 0 } })],
    ['optimum too big', () => ({ ...sampleState(), puzzle: { ...sampleState().puzzle, optimum: MAX_OPTIMUM + 1 } })],
    ['optimum fraction', () => ({ ...sampleState(), puzzle: { ...sampleState().puzzle, optimum: 2.5 } })],
    ['blocks not an array', () => ({ ...sampleState(), puzzle: { ...sampleState().puzzle, blocks: {} } })],
    ['overlapping blocks', () => ({ ...sampleState(), puzzle: { ...sampleState().puzzle, blocks: [...sampleBlocks(), { row: 0, col: 0, len: 2, orient: 'v' }] } })],
    ['history not an array', () => sampleState('1:2' as unknown as string[])],
    ['non-string entry', () => sampleState([1 as unknown as string])],
    ['entry that only looks like a string', () => sampleState([{ toString: () => '1:1' } as unknown as string])],
    ['illegal entry', () => sampleState(['1:4'])],
    ['unmerged entries', () => sampleState(['1:1', '1:1'])],
    ['too long history', () => sampleState(cycle(MAX_HISTORY + 1))]
  ])('rejects %s', (_, value) => {
    expect(isSlidingBlocksState(value())).toBe(false);
  });

  it('accepts the maximum optimum and the smallest one', () => {
    expect(isSlidingBlocksState({ ...sampleState(), puzzle: { ...sampleState().puzzle, optimum: MAX_OPTIMUM } })).toBe(true);
    expect(isSlidingBlocksState({ ...sampleState(), puzzle: { ...sampleState().puzzle, optimum: 1 } })).toBe(true);
  });

  it('accepts a history of exactly the maximum length', () => {
    expect(isSlidingBlocksState(sampleState(cycle(MAX_HISTORY)))).toBe(true);
  });

  it('never throws on arbitrary data', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isSlidingBlocksState(value)).not.toThrow();
        expect(isSlidingBlocksState(value)).toBe(false);
      }),
      { numRuns: 300 }
    );
  });

  it('returns false instead of throwing on hostile getters', () => {
    const hostile = Object.defineProperty({}, 'seed', { get: () => { throw new Error('boom'); }, enumerable: true });
    expect(isSlidingBlocksState(hostile)).toBe(false);
  });
});
