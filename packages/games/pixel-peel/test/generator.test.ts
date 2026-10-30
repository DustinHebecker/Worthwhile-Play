import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { engineOf, exposedCounts, parseMove, replayCursor, startCursor, step, tableOf } from '../src/engine';
import { accepts, construct, createInitial, generate, GUARD, GUARD_DEPTH, LEVELS, openingGuard, pictureFor, witnessSolves } from '../src/generate';
import { identitiesOf } from '../src/hint';
import { runPolicy } from '../src/policies';
import { prove } from '../src/prove';
import { findMotif } from '../src/motifs/index';
import { heightOf, widthFor } from '../src/art/sizes';
import { MOTIFS } from '../src/motifs/index';
import { apply, DIFFICULTIES, initialPosition, isPeelState, LIMITS, type Difficulty, type Move, type Picture, type Shooter } from '../src/rules';
import { oracleSolvable } from './oracle';
import { SAMPLE } from './sample';
import { loadAllArt } from '../src/catalogue';

// A game plays baked art loaded on demand (`prepare`); these tests start games directly.
await loadAllArt();

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

  // A fixed sample here (test/sample.ts); generator.slow.test.ts sweeps every motif (ADR 0021).
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

/** A random small picture for the construction properties. */
function randomPicture(w: number, h: number, colours: number, seed: number): Picture | undefined {
  const rng = createRng(seed);
  const keys = 'abcdef'.slice(0, colours);
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += rng.next() < 0.1 ? '.' : keys[rng.int(0, colours - 1)];
    rows.push(row);
  }
  if (!rows.join('').replace(/\./g, '')) return undefined;
  return { w, h, rows, backdrop: '#808080', palette: [...keys].map((key) => ({ key, hex: '#123456', name: 'black' })) };
}

describe('bounded waiting horizon and opening guard (design v3 § 2.2, § 2.3)', () => {
  it('replaying the witness: overdue shooters come back first, decoys only hit reachable colours, no decoy while one is overdue (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 12 }),
        fc.integer({ min: 4, max: 12 }),
        fc.integer({ min: 3, max: 6 }),
        fc.integer({ min: 2, max: 4 }),
        fc.integer({ min: 3, max: 10 }),
        fc.integer({ min: 0, max: 0xffff }),
        (w, h, colours, slots, horizon, seed) => {
          const picture = randomPicture(w, h, colours, seed);
          if (!picture) return;
          const level = { ...LEVELS.hard, slots, horizon, decoy: 0.5, decoyPack: [2, 6] as const, pack: [2, 8] as const };
          const engine = engineOf(picture);
          const c = construct(engine, level, createRng(seed + 1));
          expect(c.kinds).toHaveLength(c.witness.length);
          const table = tableOf(engine, c.lanes, slots);
          const cur = startCursor(table);
          const since: number[] = Array.from({ length: slots }, () => 0);
          c.witness.forEach((move, t) => {
            const exposed = exposedCounts(engine, cur.cells);
            const overdue = cur.slots.flatMap((s, j) => (s && t - (since[j] as number) >= horizon ? [j] : []));
            const overdueReady = overdue.filter((j) => (exposed[cur.slots[j]!.c] as number) > 0);
            // (a) An overdue shooter within reach is relaunched first.
            if (overdueReady.length > 0) {
              expect(c.kinds[t]).toBe('relaunch');
              expect(overdueReady.map((j) => `S${j}`)).toContain(move);
            }
            // (c) No decoy while a shooter is overdue.
            if (c.kinds[t] === 'decoy') expect(overdue).toEqual([]);
            const p = parseMove(move)!;
            const o = step(table, cur, p.kind, p.index, true);
            expect(o.legal).toBe(true);
            // (b) Decoys only of reachable colours: every launch from a lane hits something.
            if (p.kind === 'L') expect(o.hits).toBeGreaterThan(0);
            if (o.left > 0) since[o.slot] = t;
            // (d) The v2 invariant: never more shooters waiting than places.
            expect(cur.slots.filter((s) => s !== null).length).toBeLessThanOrEqual(slots);
          });
          expect(cur.cells.left).toBe(0);
          for (const key of 'abcdef'.slice(0, colours)) {
            const cells = picture.rows.join('').split(key).length - 1;
            expect(c.lanes.flat().filter((s) => s.c === key).reduce((n, s) => n + s.n, 0)).toBe(cells);
          }
        }
      ),
      { numRuns: 150 }
    );
  });

  it('the opening guard of every accepted hard game holds: each first move and each rule of thumb\'s first 5 moves can be finished (checked by replay)', () => {
    const games: [string, number][] = [['red-fox', 1], ['winter-village', 2], ['koala', 3], ['fjord', 4], ['tiger', 5], ['llama', 6], ['coral-reef', 7], ['market-stall', 8], ['aurora', 9], ['cherry-blossom', 10]];
    let accepted = 0;
    for (const [id, seed] of games) {
      const g = generate(findMotif(id)!, 'hard', createRng(seed), seed);
      if (!g.accepted) continue;
      accepted++;
      expect(g.guarded, `${id} ${seed}`).toBe(true);
      const table = tableOf(engineOf(g.picture), g.lanes, g.slots);
      const witnessIds = identitiesOf(table, g.witness);
      const openings: string[][] = [0, 1, 2, 3].map((i) => [`L${i}`]).filter((m) => m[0] !== g.witness[0]);
      for (const policy of ['obvious', 'tidy', 'slotsFirst', 'cautious'] as const) openings.push(runPolicy(table, policy, 0, { left: 1e9 }, undefined, GUARD_DEPTH).moves);
      for (const opening of openings) {
        const from = replayCursor(table, opening)!;
        const way = prove(table, from, witnessIds, identitiesOf(table, opening), { left: 1e9 }, { ...GUARD, seed: 1 }) ?? prove(table, from, witnessIds, identitiesOf(table, opening), { left: 1e9 }, { rollouts: 40, nodes: 4000, seed: 2 });
        expect(way, `${id} ${seed} ${opening.join(' ')}`).not.toBeNull();
        expect(replayCursor(table, [...opening, ...way!])?.cells.left, `${id} ${seed} ${opening.join(' ')}`).toBe(0);
      }
    }
    expect(accepted).toBeGreaterThanOrEqual(8);
  });

  it('the guard rejects a game whose first move leaves no way on (checked by breadth-first search)', () => {
    const picture: Picture = { w: 4, h: 3, rows: ['cbbb', 'baab', 'bbbb'], backdrop: '#808080', palette: ['a', 'b', 'c'].map((key) => ({ key, hex: '#123456', name: 'black' })) };
    const lanes: Shooter[][] = [[{ c: 'a', n: 1 }, { c: 'b', n: 8 }], [{ c: 'b', n: 1 }, { c: 'c', n: 1 }], [{ c: 'a', n: 1 }]];
    const witness = ['L1', 'L1', 'L0', 'L0', 'S0', 'L2'];
    expect(witnessSolves(picture, lanes, 1, witness)).toBe(true);
    const table = tableOf(engineOf(picture), lanes, 1);
    expect(openingGuard(table, witness, { left: 1e6 })).toBe(false);
    // L2 first is fatal: no way on from there, by exhaustive search.
    const start = initialPosition({ picture, lanes, slots: 1 });
    expect(oracleSolvable(apply(start, 'L2'))).toBe(false);
    // Out of budget nothing is proven.
    expect(openingGuard(table, witness, { left: 0 })).toBe(false);
  });

  it('easy and medium are unchanged by v3: the same states as before for fixed seeds', () => {
    const hash = (d: string, seed: number, motif: string) => createHash('sha256').update(JSON.stringify(createInitial(seed, d, motif))).digest('hex').slice(0, 16);
    // Explicit pictures only: which picture "Any picture" draws for a seed changes whenever motifs are added.
    expect([hash('easy', 12, 'koala'), hash('easy', 13, 'winter-village')]).toEqual(['feb09f7319092528', '2b4ed0911fd9af7f']);
    expect([hash('medium', 12, 'koala'), hash('medium', 13, 'winter-village')]).toEqual(['cf36bdd0c48fa1fd', 'b9f0dae92af354ad']);
    expect(LEVELS.easy.horizon).toBe(Infinity);
    expect(LEVELS.medium.horizon).toBe(Infinity);
    expect(LEVELS.hard.horizon).toBe(20);
  });
});
