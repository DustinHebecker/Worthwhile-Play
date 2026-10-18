import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { engineOf, parseMove, startCursor, step, tableOf } from '../src/engine';
import { accepts, construct, createInitial, generate, LEVELS, pictureFor, witnessSolves } from '../src/generate';
import { widthFor } from '../src/art/sizes';
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
          expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(4);
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
    total: number;
    longestRun: number;
    pairs: number;
    samePairs: number;
  }
  const tally = (): Tally => ({ n: 0, accepted: 0, obviousFails: 0, allFail: 0, small: 0, shooters: 0, fullSlots: 0, parked: 0, slotEntries: [], total: 0, longestRun: 0, pairs: 0, samePairs: 0 });
  const gather = (t: Tally, d: Difficulty, motifs: typeof MOTIFS) => {
    for (const motif of motifs) {
      for (let seed = 1; seed <= 6; seed++) {
        const t0 = performance.now();
        const g = generate(motif, d, createRng(seed * 7919), seed);
        t.total += performance.now() - t0;
        t.n++;
        if (g.accepted) t.accepted++;
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
    average: t.total / t.n,
    longestRun: t.longestRun,
    sameShare: t.samePairs / t.pairs
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
    hard: (r) => {
      expect(r.accepted).toBeGreaterThanOrEqual(0.9);
      expect(r.obviousFails).toBeGreaterThanOrEqual(0.95);
      expect(r.allFail).toBeGreaterThanOrEqual(0.9);
      expect(r.median).toBeGreaterThanOrEqual(6);
      expect(r.fullSlots).toBeGreaterThanOrEqual(0.9);
      expect(r.parked).toBeGreaterThanOrEqual(0.6);
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
        checks[d](r);
        expect(r.small).toBeLessThanOrEqual(0.08);
        expect(r.average, 'average generation (ms)').toBeLessThan(120);
      });
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
