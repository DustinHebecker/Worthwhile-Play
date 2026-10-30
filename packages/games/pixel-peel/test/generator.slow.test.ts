import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { engineOf, parseMove, startCursor, step, tableOf } from '../src/engine';
import { createInitial, generate, LEVELS, witnessSolves } from '../src/generate';
import { heightOf, widthFor } from '../src/art/sizes';
import { MOTIFS } from '../src/motifs/index';
import { POLICIES, runPolicy } from '../src/policies';
import { DIFFICULTIES, isPeelState, LIMITS, tableOfState, type Difficulty, type Move, type Picture, type Shooter } from '../src/rules';
import { doomOf, QUICK_ORACLE } from './doom';
import { loadAllArt } from '../src/catalogue';

// A game plays baked art loaded on demand (`prepare`); these tests start games directly.
await loadAllArt();

/**
 * The long generator tests (ADR 0021: `*.slow.test.ts` runs in `pnpm test` and CI, not under Stryker): every motif at
 * every difficulty, and the measured level definitions of design v2 § 2.2 over every motif × 6 seeds. Counted
 * launches, never time: wall-clock budgets live in timing.slow.test.ts.
 */

/** Replays a witness and measures it (design v2 § 2.2). */
function witnessStats(picture: Picture, lanes: Shooter[][], slots: number, witness: readonly Move[]) {
  const table = tableOf(engineOf(picture), lanes, slots);
  const cur = startCursor(table);
  let slotEntries = 0;
  let zeroHitParks = 0;
  let maxOccupied = 0;
  for (const m of witness) {
    const p = parseMove(m)!;
    const o = step(table, cur, p.kind, p.index, true);
    if (!o.legal) throw new Error(`illegal witness move ${m}`);
    if (p.kind === 'L' && o.left > 0) slotEntries++;
    if (o.parks) zeroHitParks++;
    maxOccupied = Math.max(maxOccupied, cur.slots.filter((s) => s !== null).length);
  }
  return { slotEntries, zeroHitParks, maxOccupied, solved: cur.cells.left === 0 };
}

describe('generator over every motif (design v2 § 3)', () => {
  for (const motif of MOTIFS) {
    it(`${motif.id}: every difficulty × 2 seeds is valid, solved by its witness and within the bounds`, () => {
      for (const d of DIFFICULTIES) {
        for (const seed of [3, 4]) {
          const level = LEVELS[d];
          const g = generate(motif, d, createRng(seed), seed);
          const label = `${motif.id} ${d} ${seed}`;
          expect(witnessSolves(g.picture, g.lanes, g.slots, g.witness), label).toBe(true);
          const w = widthFor(motif, d);
          expect(g.picture.w, label).toBe(w);
          expect(g.picture.h, label).toBe(heightOf(motif, w));
          expect(g.slots).toBe(level.slots);
          expect(g.lanes).toHaveLength(4);
          const lengths = g.lanes.map((l) => l.length);
          expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(4);
          // Lanes interleave colours: never three of one colour in a row.
          for (const lane of g.lanes) for (let k = 2; k < lane.length; k++) expect(lane[k]!.c === lane[k - 1]!.c && lane[k]!.c === lane[k - 2]!.c, label).toBe(false);
          const shooters = g.lanes.flat();
          expect(shooters.length).toBeLessThanOrEqual(LIMITS.maxShooters);
          for (const s of shooters) expect(s.n >= 1 && s.n <= LIMITS.maxShots, label).toBe(true);
          expect(shooters.filter((s) => s.n < 4).length / shooters.length, label).toBeLessThanOrEqual(0.08);
          expect(g.witness.length).toBeLessThanOrEqual(LIMITS.maxMoves);
          for (const p of g.picture.palette) {
            const cells = g.picture.rows.join('').split(p.key).length - 1;
            expect(shooters.filter((s) => s.c === p.key).reduce((n, s) => n + s.n, 0), `${label} ${p.key}`).toBe(cells);
          }
          expect(g.launches, label).toBeLessThanOrEqual(level.budget + 2000);
          const state = createInitial(seed, d, motif.id);
          expect(isPeelState(JSON.parse(JSON.stringify(state))), label).toBe(true);
        }
      }
    });
  }

  /**
   * The measurable level definitions (design v2 § 2.2) over every motif × 6 seeds, gathered in chunks of 5 motifs
   * (each test stays short under load) and asserted once per level. The thresholds are the measured values with a
   * margin; the implementation notes record the measured numbers.
   */
  interface Tally {
    n: number;
    accepted: number;
    obviousFails: number;
    allFail: number;
    small: number;
    shooters: number;
    fullSlots: number;
    parked: number;
    slotEntries: number[];
    longestRun: number;
    pairs: number;
    samePairs: number;
    /** Accepted games whose opening guard did not pass (design v3 § 2.3; hard only). */
    unguarded: number;
  }
  const tally = (): Tally => ({ n: 0, accepted: 0, obviousFails: 0, allFail: 0, small: 0, shooters: 0, fullSlots: 0, parked: 0, slotEntries: [], longestRun: 0, pairs: 0, samePairs: 0, unguarded: 0 });
  const gather = (t: Tally, d: Difficulty, motifs: typeof MOTIFS) => {
    for (const motif of motifs) {
      for (let seed = 1; seed <= 6; seed++) {
        const g = generate(motif, d, createRng(seed * 7919), seed);
        t.n++;
        if (g.accepted) t.accepted++;
        if (g.accepted && LEVELS[d].guard && g.guarded !== true) t.unguarded++;
        const table = tableOf(engineOf(g.picture), g.lanes, g.slots);
        const results = POLICIES.map((p) => runPolicy(table, p, seed, { left: 1e9 }).result);
        if (results[0] !== 'solved') t.obviousFails++;
        if (results.every((r) => r !== 'solved')) t.allFail++;
        const w = witnessStats(g.picture, g.lanes, g.slots, g.witness);
        t.slotEntries.push(w.slotEntries);
        if (w.maxOccupied === g.slots) t.fullSlots++;
        if (w.zeroHitParks > 0) t.parked++;
        for (const lane of g.lanes) {
          let run = 1;
          lane.forEach((s, k) => {
            t.shooters++;
            if (s.n < 4) t.small++;
            if (k === 0) return;
            t.pairs++;
            if (s.c === lane[k - 1]!.c) {
              t.samePairs++;
              run++;
            } else run = 1;
            t.longestRun = Math.max(t.longestRun, run);
          });
        }
      }
    }
  };
  const summary = (t: Tally) => ({
    accepted: t.accepted / t.n,
    obviousFails: t.obviousFails / t.n,
    allFail: t.allFail / t.n,
    small: t.small / t.shooters,
    fullSlots: t.fullSlots / t.n,
    parked: t.parked / t.n,
    median: [...t.slotEntries].sort((a, b) => a - b)[Math.floor(t.slotEntries.length / 2)] as number,
    longestRun: t.longestRun,
    sameShare: t.samePairs / t.pairs,
    unguarded: t.unguarded
  });
  const CHUNK = 5;
  const checks: Record<Difficulty, (r: ReturnType<typeof summary>) => void> = {
    easy: (r) => {
      expect(r.accepted).toBeGreaterThanOrEqual(0.95);
      expect(r.allFail).toBeLessThanOrEqual(0.02);
      expect(r.median).toBeLessThanOrEqual(6);
    },
    medium: (r) => {
      expect(r.accepted).toBeGreaterThanOrEqual(0.8);
      expect(r.obviousFails).toBeGreaterThanOrEqual(0.75);
      expect(r.allFail).toBeLessThanOrEqual(0.25);
      expect(r.median).toBeGreaterThanOrEqual(4);
      // Never three shooters of one colour in a row in a lane (owner feedback 2026-10-18).
      expect(r.longestRun).toBeLessThanOrEqual(2);
      expect(r.sameShare).toBeLessThanOrEqual(0.02);
    },
    // Design v3 § 2.2: with the waiting horizon all K places are full at least once in ≥ 60 % (was ≥ 90 %), and
    // zero-hit parks in the witness are gone (decoys hit something first); the opening guard holds in every accepted
    // game.
    hard: (r) => {
      expect(r.accepted).toBeGreaterThanOrEqual(0.9);
      expect(r.obviousFails).toBeGreaterThanOrEqual(0.95);
      expect(r.allFail).toBeGreaterThanOrEqual(0.9);
      expect(r.median).toBeGreaterThanOrEqual(6);
      expect(r.fullSlots).toBeGreaterThanOrEqual(0.6);
      expect(r.unguarded).toBe(0);
      expect(r.longestRun).toBeLessThanOrEqual(2);
      // Two of one colour in a row only where it cannot be avoided.
      expect(r.sameShare).toBeLessThanOrEqual(0.01);
    }
  };
  for (const d of DIFFICULTIES) {
    describe(`${d}: the level definition over every motif × 6 seeds`, () => {
      const t = tally();
      for (let k = 0; k < MOTIFS.length; k += CHUNK) {
        it(`${d}: motifs ${k + 1}–${Math.min(MOTIFS.length, k + CHUNK)}`, () => gather(t, d, MOTIFS.slice(k, k + CHUNK)));
      }
      it(`${d}: the rates hold`, () => {
        expect(t.n).toBe(MOTIFS.length * 6);
        const r = summary(t);
        console.info(`pixel-peel ${d}:`, JSON.stringify(r));
        checks[d](r);
        expect(r.small).toBeLessThanOrEqual(0.08);
      });
    });
  }


  /**
   * The doom benchmark in small (design v3 § 6.1; the full one is scripts/doom-report.ts): on 4 fixed hard games the
   * obvious and the tidy rule get stuck; with the quick oracle the mistake shows within 25 moves each time.
   */
  it('hard: a wrong decision shows within 25 moves (4 games × 2 rules of thumb, quick oracle)', () => {
    for (const [motif, seed] of [['red-fox', 21], ['winter-village', 22], ['tiger', 23], ['fjord', 24]] as const) {
      const state = createInitial(seed, 'hard', motif);
      const table = tableOfState(state);
      for (const player of ['obvious', 'tidy'] as const) {
        const r = runPolicy(table, player, state.seed, { left: 1e8 });
        if (r.result !== 'stuck') continue;
        const d = doomOf(state, r.moves, QUICK_ORACLE);
        expect(d.delay, `${motif} ${seed} ${player}: fatal move ${d.fatal}`).toBeLessThanOrEqual(25);
        expect(d.fatal, `${motif} ${seed} ${player}`).toBeGreaterThan(5);
      }
    }
  });
});
