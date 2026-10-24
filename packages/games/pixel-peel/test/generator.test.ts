import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { engineOf, parseMove, startCursor, step, tableOf } from '../src/engine';
import { accepts, construct, createInitial, generate, LEVELS, pictureFor, witnessSolves } from '../src/generate';
import { widthFor } from '../src/art/sizes';
import { MOTIFS } from '../src/motifs/index';
import { DIFFICULTIES, isPeelState, LIMITS, type Difficulty, type Move, type Picture, type Shooter } from '../src/rules';

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

/** One motif of each group (season, landscape, animal, scene). */
const SAMPLE = MOTIFS.filter((m, i) => MOTIFS.findIndex((x) => x.group === m.group) === i);

describe('generator (design v2 § 3)', () => {
  it('is deterministic: the same seed, difficulty and choice give a deep-equal state', () => {
    for (const d of DIFFICULTIES) for (const choice of ['any', 'koala', 'market-stall']) expect(createInitial(99, d, choice)).toEqual(createInitial(99, d, choice));
  });

  it('"Any picture" covers every motif over 300 seeds', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 300 && seen.size < MOTIFS.length; seed++) seen.add(createInitial(seed, 'easy', 'any').motif);
    expect(seen.size).toBe(MOTIFS.length);
  });

  it('construction keeps its invariants on small random pictures and always terminates with a solving witness (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 9 }),
        fc.integer({ min: 4, max: 9 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 0, max: 0xffff }),
        fc.constantFrom<Difficulty>('easy', 'medium', 'hard'),
        (w, h, colours, seed, d) => {
          const rng = createRng(seed);
          const keys = 'abcde'.slice(0, colours);
          const rows: string[] = [];
          for (let y = 0; y < h; y++) {
            let row = '';
            for (let x = 0; x < w; x++) row += rng.next() < 0.1 ? '.' : keys[rng.int(0, colours - 1)];
            rows.push(row);
          }
          if (!rows.join('').replace(/\./g, '')) return;
          const picture: Picture = { w, h, rows, backdrop: '#808080', palette: [...keys].map((key) => ({ key, hex: '#123456', name: 'black' })) };
          const level = { ...LEVELS[d], decoyPack: [2, 6] as const, pack: [2, 8] as const };
          const c = construct(engineOf(picture), level, createRng(seed + 1));
          expect(witnessSolves(picture, c.lanes, level.slots, c.witness)).toBe(true);
          // Per colour, the shots equal the cells.
          for (const key of keys) {
            const cells = rows.join('').split(key).length - 1;
            expect(c.lanes.flat().filter((s) => s.c === key).reduce((n, s) => n + s.n, 0)).toBe(cells);
          }
          const lengths = c.lanes.map((l) => l.length);
          expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(4);
          expect(witnessStats(picture, c.lanes, level.slots, c.witness).maxOccupied).toBeLessThanOrEqual(level.slots);
        }
      ),
      { numRuns: 200 }
    );
  });

  // One motif per group here; generator.slow.test.ts sweeps every motif (ADR 0021).
  for (const motif of SAMPLE) {
    it(`${motif.id}: every difficulty × 2 seeds is valid, solved by its witness and within the bounds`, () => {
      for (const d of DIFFICULTIES) {
        for (const seed of [3, 4]) {
          const level = LEVELS[d];
          const g = generate(motif, d, createRng(seed), seed);
          const label = `${motif.id} ${d} ${seed}`;
          expect(witnessSolves(g.picture, g.lanes, g.slots, g.witness), label).toBe(true);
          const w = widthFor(motif, d);
          expect(g.picture.w, label).toBe(w);
          expect(g.picture.h, label).toBe(motif.aspect === 'wide' ? (w * 3) / 4 : w);
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

  it('accept rules (design v2 § 2.1)', () => {
    expect(accepts('hard', { obvious: 'stuck', tidy: 'stuck', slotsFirst: 'stuck', cautious: 'stuck', noisyTidy: 'stuck' })).toBe(true);
    expect(accepts('hard', { obvious: 'stuck', tidy: 'solved' })).toBe(false);
    expect(accepts('hard', { obvious: 'stuck', tidy: 'unknown' })).toBe(false);
    expect(accepts('medium', { obvious: 'stuck', tidy: 'solved' })).toBe(true);
    expect(accepts('medium', { obvious: 'solved' })).toBe(false);
    expect(accepts('easy', { obvious: 'solved', tidy: 'solved', slotsFirst: 'solved' })).toBe(true);
    expect(accepts('easy', { obvious: 'solved', tidy: 'stuck', slotsFirst: 'stuck', cautious: 'stuck', noisyTidy: 'solved' })).toBe(false);
  });

  it('pictureFor gives the level resolution and a fresh copy', () => {
    const a = pictureFor(MOTIFS[0]!, 'hard');
    const b = pictureFor(MOTIFS[0]!, 'hard');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.w).toBe(widthFor(MOTIFS[0]!, 'hard'));
  });
});
