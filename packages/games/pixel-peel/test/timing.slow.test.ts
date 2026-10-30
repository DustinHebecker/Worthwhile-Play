import { describe, expect, it } from 'vitest';
import { childrenOf, engineOf, fullCells, launch, replayCursor } from '../src/engine';
import { createInitial } from '../src/generate';
import { hint } from '../src/hint';
import { MOTIFS } from '../src/motifs/index';
import { picker } from '../src/policies';
import { play, tableOfState, type PeelState } from '../src/rules';
import { loadAllArt } from '../src/catalogue';

// A game plays baked art loaded on demand (`prepare`); these tests start games directly.
await loadAllArt();

/**
 * Wall-clock sanity budgets (ADR 0021: `*.slow.test.ts`, never under Stryker, whose instrumentation slows code down).
 * Nothing in the game depends on time: generation, policies and the hint count launches and nodes, and those budgets
 * are asserted deterministically elsewhere. These tests only catch a gross slowdown, so they are robust to a loaded
 * machine: each case is timed as the fastest of a few repeats, and the bounds are several times the measured values.
 */

/** The fastest of `repeats` runs of `f`, in ms. */
function fastest(repeats: number, f: () => void): number {
  let best = Infinity;
  for (let k = 0; k < repeats; k++) {
    const t0 = performance.now();
    f();
    best = Math.min(best, performance.now() - t0);
  }
  return best;
}

const median = (xs: readonly number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1] as number;

/** Leaves the witness path with the first legal non-witness move, then follows the obvious play for `extra` moves. */
function offPath(state: PeelState, extra: number): PeelState {
  let s = state;
  for (const m of state.witness.slice(0, 3)) s = play(s, m);
  const legal = ['L0', 'L1', 'L2', 'L3', 'S0', 'S1', 'S2', 'S3', 'S4'].filter((m) => m !== s.witness[s.moves.length] && play(s, m) !== s);
  if (legal.length) s = play(s, legal[0]!);
  const table = tableOfState(s);
  for (let k = 0; k < extra; k++) {
    const children = childrenOf(table, replayCursor(table, s.moves)!);
    if (!children.length) break;
    s = play(s, picker('obvious').pick(children).move);
  }
  return s;
}

describe('timing budgets (sanity only)', () => {
  it('a launch at W = 48 takes microseconds (measured a few µs; bound 200 µs)', () => {
    const KEYS = 'abcdefghijklmnopqr';
    const w = 48;
    let row = '';
    const rows: string[] = [];
    for (let i = 0; i < w * w; i++) {
      row += KEYS[(Math.floor(i / 7) * 13 + i) % 18];
      if (row.length === w) {
        rows.push(row);
        row = '';
      }
    }
    const engine = engineOf({ w, h: w, rows, palette: KEYS.split('').map((key) => ({ key })) });
    let launches = 0;
    const ms = fastest(3, () => {
      const cur = fullCells(engine);
      launches = 0;
      for (let round = 0; round < 50 && cur.left > 0; round++) {
        for (let c = 1; c <= 18; c++) {
          launch(engine, cur, c, 20);
          launches++;
        }
      }
    });
    expect(ms / launches).toBeLessThan(0.2);
  });

  it('generation: median over every motif and difficulty under 60 ms, none over 400 ms (measured about 10 / 40 ms)', () => {
    const times: number[] = [];
    for (const d of ['easy', 'medium'] as const) for (const motif of MOTIFS) times.push(fastest(3, () => createInitial(1, d, motif.id)));
    expect(median(times), 'median generation (ms)').toBeLessThan(60);
    expect(Math.max(...times), 'slowest generation (ms)').toBeLessThan(400);
  });

  it('hard generation with the waiting horizon and the opening guard (design v3 § 2.6): average under 150 ms, none over 600 ms (measured about 48 / 155 ms)', () => {
    const times: number[] = [];
    for (const motif of MOTIFS) for (const seed of [1, 2, 3]) times.push(fastest(3, () => createInitial(seed, 'hard', motif.id)));
    expect(times.reduce((a, b) => a + b, 0) / times.length, 'average hard generation (ms)').toBeLessThan(150);
    expect(Math.max(...times), 'slowest hard generation (ms)').toBeLessThan(600);
  });

  it('hint on off-path hard positions: each under 800 ms (measured well under 80 ms)', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const s = offPath(createInitial(seed, 'hard', ['fjord', 'red-fox', 'winter-village', 'reading-nook'][seed % 4]!), seed * 3);
      expect(fastest(2, () => hint(s)), `seed ${seed}`).toBeLessThan(800);
    }
  });
});
