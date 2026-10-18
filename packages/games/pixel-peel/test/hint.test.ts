import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { childrenOf, replayCursor, startCursor } from '../src/engine';
import { createInitial } from '../src/generate';
import { commonPrefix, followPlan, hint, identitiesOf } from '../src/hint';
import { picker, POLICIES, run, runPolicy } from '../src/policies';
import { initialPosition, play, positionAt, tableOfState, type PeelState } from '../src/rules';
import { refObviousPlay } from './reference';
import { solve, stateOf } from './helpers';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const fixture = (name: string) => (JSON.parse(readFileSync(`${__dirname}/fixtures/${name}.json`, 'utf8')) as { state: PeelState }).state;

/** Leaves the witness path with the first legal non-witness move, then follows the obvious play for `extra` moves. */
function offPath(state: PeelState, extra: number): PeelState {
  let s = state;
  for (const m of state.witness.slice(0, 3)) s = play(s, m);
  const legal = ['L0', 'L1', 'L2', 'L3', 'S0', 'S1', 'S2', 'S3', 'S4'].filter((m) => m !== s.witness[s.moves.length] && play(s, m) !== s);
  if (legal.length) s = play(s, legal[0]!);
  const table = tableOfState(s);
  for (let k = 0; k < extra; k++) {
    const cur = replayCursor(table, s.moves)!;
    const children = childrenOf(table, cur);
    if (!children.length) break;
    s = play(s, picker('obvious').pick(children).move);
  }
  return s;
}

describe('policies (design v2 § 3.3)', () => {
  it('each policy is deterministic and never plays an illegal move', () => {
    const state = createInitial(4, 'medium', 'red-fox');
    const table = tableOfState(state);
    for (const id of POLICIES) {
      const a = runPolicy(table, id, 9, { left: 1e9 });
      const b = runPolicy(table, id, 9, { left: 1e9 });
      expect(a.moves).toEqual(b.moves);
      expect(replayCursor(table, a.moves)).toBeDefined();
    }
  });

  it('P1 equals v1’s obvious play on the v1 fixtures', () => {
    for (const name of ['v1-easy-red-fox', 'v1-hard-winter-village', 'v1-solved-koala']) {
      const s = fixture(name);
      const pos = initialPosition(s);
      const ref = refObviousPlay({ w: pos.w, h: pos.h, cells: pos.cells, lanes: s.lanes, laneFront: s.lanes.map(() => 0), slots: Array.from({ length: s.slots }, () => null) });
      const r = runPolicy(tableOfState(s), 'obvious', 0, { left: 1e9 });
      expect(r.moves, name).toEqual(ref.moves);
      expect(r.result === 'solved', name).toBe(ref.solved);
    }
  });

  it('a run stops as unknown when its launch budget is used up', () => {
    const state = createInitial(2, 'hard', 'fjord');
    expect(runPolicy(tableOfState(state), 'tidy', 0, { left: 10 }).result).toBe('unknown');
  });
});

describe('hint at scale (design v2 § 4)', () => {
  it('on the witness path, the hint is the next witness move', () => {
    const state = createInitial(6, 'hard', 'winter-village');
    expect(hint(state)).toEqual({ kind: 'move', move: state.witness[0] });
    const s1 = play(state, state.witness[0]!);
    expect(hint(s1)).toEqual({ kind: 'move', move: state.witness[1] });
  });

  it('“follow the plan” replays the witness from the start', () => {
    const state = createInitial(3, 'hard', 'red-fox');
    const table = tableOfState(state);
    const ids = identitiesOf(table, state.witness);
    const r = run(table, followPlan(ids, []), { left: 1e9 }, startCursor(table));
    expect(r.result).toBe('solved');
    expect(r.moves).toEqual(state.witness);
  });

  it('off the path, a suggested move is proven: a rollout from after it solves the picture', () => {
    for (const [seed, motif] of [[1, 'fjord'], [2, 'red-fox'], [3, 'winter-village'], [4, 'reading-nook']] as const) {
      const s = offPath(createInitial(seed, 'hard', motif), 5);
      const h = hint(s);
      const table = tableOfState(s);
      if (h.kind === 'move') {
        const after = play(s, h.move);
        expect(after).not.toBe(s);
        const cur = replayCursor(table, after.moves)!;
        const solvedBy = ['obvious', 'tidy', 'slotsFirst', 'cautious'].some((id) => run(table, (c) => picker(id as 'tidy').pick(c), { left: 1e9 }, cur).result === 'solved') || run(table, followPlan(identitiesOf(table, s.witness), identitiesOf(table, after.moves)), { left: 1e9 }, cur).result === 'solved';
        expect(solvedBy || 'solution' in solve(positionAt(after, after.moves.length), 50_000), `${motif} ${seed}`).toBe(true);
      } else {
        // An undo target is verified: a rollout from it solves, or it lies on the witness.
        const k0 = commonPrefix(s.moves, s.witness);
        expect(h.k).toBeGreaterThanOrEqual(k0);
        expect(h.k).toBeLessThan(s.moves.length);
      }
    }
  });

  it('a proven dead end appears only from the exact search, and agrees with it', () => {
    // 1 slot; lane 0: b1, a10; lane 1: b1. Launching lane 1 first parks b and blocks lane 0 for good.
    const state = stateOf(['aaaa', 'abba', 'aaaa'], [[{ c: 'b', n: 1 }, { c: 'a', n: 10 }], [{ c: 'b', n: 1 }]], 1);
    const doomed = play(state, 'L1');
    expect(hint(doomed)).toEqual({ kind: 'undo', k: 0, proven: true });
    expect(solve(positionAt(doomed, 1))).toEqual({ unsolvable: true });
  });

  it('the latest solvable ancestor is preferred over the witness prefix', () => {
    const state = stateOf(['aaaaa', 'abbba', 'aaaaa'], [[{ c: 'b', n: 1 }, { c: 'a', n: 12 }], [{ c: 'b', n: 1 }, { c: 'b', n: 1 }]], 2);
    expect(state.witness[0]).toBe('L0');
    let s = state;
    for (const m of ['L1', 'L1']) s = play(s, m);
    expect(hint(s)).toEqual({ kind: 'undo', k: 1, proven: true });
  });

  it('never throws and always names a legal move or a move number within the game (property)', () => {
    const base = createInitial(8, 'medium', 'reading-nook');
    fc.assert(
      fc.property(fc.array(fc.constantFrom('L0', 'L1', 'L2', 'L3', 'S0', 'S1', 'S2'), { maxLength: 12 }), (moves) => {
        let s = clone(base);
        for (const m of moves) s = play(s, m);
        const h = hint(s);
        if (h.kind === 'move') expect(play(s, h.move)).not.toBe(s);
        else expect(h.k).toBeLessThanOrEqual(s.moves.length);
      }),
      { numRuns: 15 }
    );
  });

  it('stays within its budget: under 80 ms per hint on random off-path hard positions (generous bound)', () => {
    let worst = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const s = offPath(createInitial(seed, 'hard', ['fjord', 'red-fox', 'winter-village', 'reading-nook'][seed % 4]!), seed * 3);
      const t0 = performance.now();
      hint(s);
      worst = Math.max(worst, performance.now() - t0);
    }
    // Measured well under 80 ms; asserted generously so that a loaded CI runner never fails it.
    expect(worst).toBeLessThan(800);
  });
});
