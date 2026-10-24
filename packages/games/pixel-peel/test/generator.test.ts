import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { createInitial, generate, LEVELS, quality } from '../src/generate';
import { MOTIFS } from '../src/motifs/index';
import { DIFFICULTIES, initialPosition, isPeelState, isSolved, LIMITS, replay } from '../src/rules';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
/** Per-generation limit (design § 9.5: target < 60 ms on CI; asserted < 150 ms). */
const MAX_MS = 150;

describe('generator (design § 9.2)', () => {
  it('is deterministic: the same seed, difficulty and choice give a deep-equal state', () => {
    for (const d of DIFFICULTIES) for (const choice of ['any', 'koala']) expect(createInitial(99, d, choice)).toEqual(createInitial(99, d, choice));
  });

  it('"Any picture" covers every motif over 200 seeds', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 200; seed++) seen.add(createInitial(seed, 'easy', 'any').motif);
    expect(seen.size).toBe(MOTIFS.length);
  });

  it('every motif × difficulty × 8 seeds is valid, proven solvable by its witness and within the bounds', () => {
    const quality2: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
    let slowest = 0;
    let total = 0;
    let count = 0;
    for (const motif of MOTIFS) {
      for (const d of DIFFICULTIES) {
        for (const seed of SEEDS) {
          const t0 = performance.now();
          const g = generate(motif, d, createRng(seed));
          const ms = performance.now() - t0;
          slowest = Math.max(slowest, ms);
          total += ms;
          count++;
          const level = LEVELS[d];
          const start = initialPosition(g);
          const end = replay(start, g.witness);
          expect(end && isSolved(end), `${motif.id} ${d} ${seed}`).toBe(true);
          // Bounds of § 9.5.
          const shooters = g.lanes.flat();
          expect(shooters.length).toBeLessThanOrEqual(LIMITS.maxShooters);
          for (const s of shooters) expect(s.n).toBeGreaterThanOrEqual(1);
          for (const s of shooters) expect(s.n).toBeLessThanOrEqual(LIMITS.maxShots);
          expect(g.witness.length).toBeLessThanOrEqual(LIMITS.maxMoves);
          expect(g.lanes).toHaveLength(level.lanes);
          expect(g.slots).toBe(level.slots);
          // Balanced deal (perturbation only reorders inside a lane).
          const lengths = g.lanes.map((l) => l.length);
          expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(2);
          // Invariant: per colour, shots = filled cells.
          for (const p of g.picture.palette) {
            const cells = g.picture.rows.join('').split('').filter((c) => c === p.key).length;
            expect(shooters.filter((s) => s.c === p.key).reduce((a, s) => a + s.n, 0)).toBe(cells);
          }
          expect(g.quality).toBe(quality(g.picture, g.lanes, g.slots, g.witness));
          if (d === 'easy') {
            // Easy: the base deal, used up launch by launch, no parking.
            expect(end!.parks).toBe(0);
            expect(g.perturbed).toBe(false);
          } else expect(g.perturbed, `${motif.id} ${d} ${seed} perturbed`).toBe(true);
          if (g.quality === 2) quality2[d] = (quality2[d] ?? 0) + 1;
        }
      }
    }
    const runs = MOTIFS.length * SEEDS.length;
    // Measured (implementation notes): hard ≈ 60 %, medium ≈ 30 % of seeds need more than the obvious play.
    expect(quality2.hard! / runs).toBeGreaterThanOrEqual(0.5);
    expect(quality2.medium! / runs).toBeGreaterThanOrEqual(0.15);
    expect(slowest, 'slowest generation (ms)').toBeLessThan(MAX_MS);
    expect(total / count, 'average generation (ms)').toBeLessThan(60);
  });

  it('createInitial gives a valid save for every motif and difficulty', () => {
    for (const motif of MOTIFS) {
      for (const d of DIFFICULTIES) {
        const s = createInitial(17, d, motif.id);
        expect(isPeelState(JSON.parse(JSON.stringify(s)))).toBe(true);
        expect(s.motif).toBe(motif.id);
        expect(s.moves).toEqual([]);
      }
    }
  });
});
