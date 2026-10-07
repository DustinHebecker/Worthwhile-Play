// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { TARGET_ROW, exploreCluster, generatePuzzle, layoutAt, randomPlacement } from '../src/generator';
import { BANDS, isLayout, layoutString, parseLayout, solve, startPositions } from '../src/rules';
import { oracleSolve } from './oracle';

const ROWS = ['aa...b', 'c....b', 'cxxd.b', 'c..d..', '....ee', 'fff...'];
const SAMPLE = ROWS.join('');

describe('generator', () => {
  it('random placements are valid layouts with the star block in the third row', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), (seed) => {
        const blocks = randomPlacement(createRng(seed));
        expect(isLayout(blocks)).toBe(true);
        expect(blocks[0]?.row).toBe(TARGET_ROW);
        expect(blocks.length).toBeGreaterThanOrEqual(2);
        expect(blocks.length).toBeLessThanOrEqual(15);
      }),
      { numRuns: 200 }
    );
  });

  it('cluster distances match the oracle for sampled positions', () => {
    const blocks = parseLayout(SAMPLE);
    const cluster = exploreCluster(blocks);
    expect(cluster).not.toBeNull();
    const { positions, distance } = cluster!;
    expect(positions[0]).toEqual(startPositions(blocks));
    expect(distance[0]).toBe(solve(blocks));
    for (let i = 0; i < positions.length; i += Math.max(1, Math.floor(positions.length / 25))) {
      expect(oracleSolve(layoutString(blocks, positions[i]!))).toBe(distance[i] === -1 ? null : distance[i]);
    }
    expect(exploreCluster(blocks, 3)).toBeNull();
  });

  it('layoutAt renumbers blocks canonically', () => {
    const blocks = parseLayout(SAMPLE);
    const moved = [...startPositions(blocks)];
    moved[1] = 3;
    expect(layoutAt(blocks, moved)).toBe(['...aab', ...ROWS.slice(1)].join(''));
    // Block d moved up to the first row is renamed b (letters follow first appearance).
    const lifted = [...startPositions(blocks)];
    lifted[4] = 0;
    expect(layoutAt(blocks, lifted)).toBe(['aa.b.c', 'd..b.c', 'dxx..c', 'd.....', '....ee', 'fff...'].join(''));
    expect(layoutString(parseLayout(layoutAt(blocks, moved)))).toBe(layoutAt(blocks, moved));
  });

  it('generates deterministic easy puzzles whose optimum is in the band and confirmed by the oracle', () => {
    for (const seed of [1, 2, 3]) {
      const puzzle = generatePuzzle(seed, 'easy');
      expect(puzzle).not.toBeNull();
      expect(generatePuzzle(seed, 'easy')).toEqual(puzzle);
      expect(oracleSolve(puzzle!.layout)).toBe(puzzle!.optimum);
      expect(puzzle!.optimum).toBeGreaterThanOrEqual(BANDS.easy[0]);
      expect(puzzle!.optimum).toBeLessThanOrEqual(BANDS.easy[1]);
    }
  }, 60_000);

  it('gives up after the allowed number of attempts', () => {
    expect(generatePuzzle(1, 'hard', 0)).toBeNull();
  });
});
