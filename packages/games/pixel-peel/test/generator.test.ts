import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { engineOf, parseMove, startCursor, step, tableOf } from '../src/engine';
import { accepts, construct, createInitial, generate, LEVELS, pictureFor, witnessSolves } from '../src/generate';
import { MOTIFS } from '../src/motifs/index';
import { POLICIES, runPolicy } from '../src/policies';
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
          expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(2);
          expect(witnessStats(picture, c.lanes, level.slots, c.witness).maxOccupied).toBeLessThanOrEqual(level.slots);
        }
      ),
      { numRuns: 200 }
    );
  });

  for (const motif of MOTIFS) {
    it(`${motif.id}: every difficulty × 2 seeds is valid, solved by its witness and within the bounds`, () => {
      for (const d of DIFFICULTIES) {
        for (const seed of [3, 4]) {
          const level = LEVELS[d];
          const g = generate(motif, d, createRng(seed), seed);
          const label = `${motif.id} ${d} ${seed}`;
          expect(witnessSolves(g.picture, g.lanes, g.slots, g.witness), label).toBe(true);
          expect(g.picture.w, label).toBe(level.width);
          expect(g.picture.h, label).toBe(motif.aspect === 'wide' ? (level.width * 3) / 4 : level.width);
          expect(g.slots).toBe(level.slots);
          expect(g.lanes).toHaveLength(4);
          const lengths = g.lanes.map((l) => l.length);
          expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(2);
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
   * The measurable level definitions (design v2 § 2.2) over every motif × 6 seeds. The thresholds below are the
   * measured values with a margin; the implementation notes record the measured numbers.
   */
  const rates = (d: Difficulty) => {
    let n = 0;
    let accepted = 0;
    let obviousFails = 0;
    let allFail = 0;
    let small = 0;
    let shooters = 0;
    let fullSlots = 0;
    let parked = 0;
    const slotEntries: number[] = [];
    let slowest = 0;
    let total = 0;
    for (const motif of MOTIFS) {
      for (let seed = 1; seed <= 6; seed++) {
        const t0 = performance.now();
        const g = generate(motif, d, createRng(seed * 7919), seed);
        const ms = performance.now() - t0;
        slowest = Math.max(slowest, ms);
        total += ms;
        n++;
        if (g.accepted) accepted++;
        const table = tableOf(engineOf(g.picture), g.lanes, g.slots);
        const results = POLICIES.map((p) => runPolicy(table, p, seed, { left: 1e9 }).result);
        if (results[0] !== 'solved') obviousFails++;
        if (results.every((r) => r !== 'solved')) allFail++;
        const w = witnessStats(g.picture, g.lanes, g.slots, g.witness);
        slotEntries.push(w.slotEntries);
        if (w.maxOccupied === g.slots) fullSlots++;
        if (w.zeroHitParks > 0) parked++;
        for (const s of g.lanes.flat()) {
          shooters++;
          if (s.n < 4) small++;
        }
      }
    }
    const median = [...slotEntries].sort((a, b) => a - b)[Math.floor(slotEntries.length / 2)] as number;
    return { accepted: accepted / n, obviousFails: obviousFails / n, allFail: allFail / n, small: small / shooters, fullSlots: fullSlots / n, parked: parked / n, median, slowest, average: total / n };
  };

  it('easy: ≥ 95 % accepted, almost never all policies fail, few slot entries', () => {
    const r = rates('easy');
    expect(r.accepted).toBeGreaterThanOrEqual(0.95);
    expect(r.allFail).toBeLessThanOrEqual(0.02);
    expect(r.median).toBeLessThanOrEqual(6);
    expect(r.small).toBeLessThanOrEqual(0.08);
    expect(r.average, 'average generation (ms)').toBeLessThan(120);
  });

  it('medium: ≥ 80 % accepted, the obvious play fails ≥ 75 %, all five fail ≤ 25 %', () => {
    const r = rates('medium');
    expect(r.accepted).toBeGreaterThanOrEqual(0.8);
    expect(r.obviousFails).toBeGreaterThanOrEqual(0.75);
    expect(r.allFail).toBeLessThanOrEqual(0.25);
    expect(r.median).toBeGreaterThanOrEqual(4);
    expect(r.small).toBeLessThanOrEqual(0.08);
    expect(r.average, 'average generation (ms)').toBeLessThan(120);
  });

  it('hard: ≥ 90 % accepted, all five policies fail ≥ 90 %, the witness fills every slot and parks on purpose', () => {
    const r = rates('hard');
    expect(r.accepted).toBeGreaterThanOrEqual(0.9);
    expect(r.obviousFails).toBeGreaterThanOrEqual(0.95);
    expect(r.allFail).toBeGreaterThanOrEqual(0.9);
    expect(r.median).toBeGreaterThanOrEqual(6);
    expect(r.fullSlots).toBeGreaterThanOrEqual(0.9);
    expect(r.parked).toBeGreaterThanOrEqual(0.6);
    expect(r.small).toBeLessThanOrEqual(0.08);
    expect(r.average, 'average generation (ms)').toBeLessThan(120);
  });

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
    const a = pictureFor(MOTIFS[0]!, LEVELS.hard);
    const b = pictureFor(MOTIFS[0]!, LEVELS.hard);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.w).toBe(48);
  });
});
