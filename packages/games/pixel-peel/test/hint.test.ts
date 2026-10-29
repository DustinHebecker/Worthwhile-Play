import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { childrenOf, replayCursor, startCursor } from '../src/engine';
import { createInitial } from '../src/generate';
import { commonPrefix, followPlan, hint, identitiesOf, safePointCandidates } from '../src/hint';
import { picker, POLICIES, run, runPolicy } from '../src/policies';
import { initialPosition, play, positionAt, tableOfState, type PeelState } from '../src/rules';
import { prove } from '../src/prove';
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
        // An undo target is verified: it lies on the witness, or "follow the plan" or the tidy rule solves from it.
        const k0 = commonPrefix(s.moves, s.witness);
        expect(h.k).toBeGreaterThanOrEqual(k0);
        expect(h.k).toBeLessThan(s.moves.length);
        const from = replayCursor(table, s.moves.slice(0, h.k))!;
        const ok = h.k === k0
          || run(table, followPlan(identitiesOf(table, s.witness), identitiesOf(table, s.moves.slice(0, h.k))), { left: 1e9 }, from).result === 'solved'
          || run(table, (c) => picker('tidy').pick(c), { left: 1e9 }, from).result === 'solved';
        expect(ok, `${motif} ${seed}: k=${h.k}`).toBe(true);
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

  it('safe points are tried 1, 2, 4, 8 … moves back, never at or below the witness prefix', () => {
    expect(safePointCandidates(20, 0)).toEqual([19, 18, 16, 12, 4]);
    expect(safePointCandidates(20, 15)).toEqual([19, 18, 16]);
    expect(safePointCandidates(5, 5)).toEqual([]);
  });

  it('after the obvious play gets stuck on hard, the undo target is usually far from the start, and it is true', () => {
    const ks: number[] = [];
    for (const motif of ['cherry-blossom', 'summer-meadow', 'winter-village', 'desert-dunes', 'koala', 'llama', 'tiger', 'polar-bear', 'emperor-penguin', 'market-stall']) {
      const state = createInitial(2, 'hard', motif);
      const table = tableOfState(state);
      const stuck = runPolicy(table, 'obvious', 0, { left: 1e9 });
      expect(stuck.result, motif).toBe('stuck');
      const s = { ...state, moves: stuck.moves };
      const h = hint(s);
      if (h.kind === 'move') continue;
      ks.push(h.k);
      // Never a lie: from move k, "follow the plan" or the tidy rule finishes the picture.
      const from = replayCursor(table, stuck.moves.slice(0, h.k))!;
      const ids = identitiesOf(table, state.witness);
      const ok = h.k <= commonPrefix(stuck.moves, state.witness)
        || run(table, followPlan(ids, identitiesOf(table, stuck.moves.slice(0, h.k))), { left: 1e9 }, from).result === 'solved'
        || run(table, (c) => picker('tidy').pick(c), { left: 1e9 }, from).result === 'solved';
      expect(ok, `${motif}: k=${h.k}`).toBe(true);
    }
    expect(ks.length).toBeGreaterThanOrEqual(8);
    expect(ks.filter((k) => k > 0).length / ks.length).toBeGreaterThanOrEqual(0.7);
    const sorted = [...ks].sort((a, b) => a - b);
    expect(sorted[Math.floor(sorted.length / 2)]).toBeGreaterThanOrEqual(5);
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
});

describe('the stuck card\'s way back (design v3 § 2.4)', () => {
  it('after a rule of thumb gets stuck on hard, the hint offers a move number from which the picture can be finished (checked by replay)', () => {
    let checked = 0;
    for (const [motif, seed] of [['red-fox', 31], ['winter-village', 32], ['tiger', 33], ['koala', 34]] as const) {
      let state = createInitial(seed, 'hard', motif);
      const table = tableOfState(state);
      const r = runPolicy(table, 'obvious', 1, { left: 1e8 });
      if (r.result !== 'stuck') continue;
      for (const m of r.moves) state = play(state, m);
      const h = hint(state);
      expect(h.kind).toBe('undo');
      if (h.kind !== 'undo') continue;
      expect(h.k).toBeLessThan(state.moves.length);
      const prefix = state.moves.slice(0, h.k);
      const from = replayCursor(table, prefix)!;
      const way = prove(table, from, identitiesOf(table, state.witness), identitiesOf(table, prefix), { left: 1e9 }, { rollouts: 40, nodes: 4000, seed: 1 });
      expect(way, `${motif} ${seed}: back to move ${h.k}`).not.toBeNull();
      expect(replayCursor(table, [...prefix, ...way!])?.cells.left).toBe(0);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(3);
  });
});
