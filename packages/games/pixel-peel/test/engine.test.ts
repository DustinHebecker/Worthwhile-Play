import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { childrenOf, cloneCells, createFrontIndex, engineOf, exposedOf, exposureOf, frontOf, fullCells, hitsOf, indexFronts, launch, replayCursor, startCursor, stationLines, step, tableOf, updateExposure } from '../src/engine';
import { EMPTY, exposedCells, launch as refLaunch, refApply, type RefPosition } from './reference';

const KEYS = 'abcdefghijklmnopqrst';

/** Random grids up to 12 × 12 with up to 20 colours and some holes. */
const gridArb = fc
  .record({ w: fc.integer({ min: 1, max: 12 }), h: fc.integer({ min: 1, max: 12 }), colours: fc.integer({ min: 1, max: 20 }) })
  .chain(({ w, h, colours }) =>
    fc.array(fc.oneof(fc.constant('.'), fc.constantFrom(...KEYS.slice(0, colours).split(''))), { minLength: w * h, maxLength: w * h }).map((cells) => ({ w, h, cells, colours }))
  );

const pictureOf = (w: number, h: number, cells: string[], colours: number) => {
  const rows: string[] = [];
  for (let y = 0; y < h; y++) rows.push(cells.slice(y * w, (y + 1) * w).join(''));
  return { w, h, rows, palette: KEYS.slice(0, colours).split('').map((key) => ({ key })) };
};

describe('engine equals the v1 reference (design v2 § 3.1)', () => {
  it('a sequence of launches: same hits in the same order, same cells, same leftover shots', () => {
    fc.assert(
      fc.property(gridArb, fc.array(fc.record({ k: fc.integer({ min: 0, max: 19 }), n: fc.integer({ min: 1, max: 40 }) }), { minLength: 1, maxLength: 12 }), ({ w, h, cells, colours }, shots) => {
        const engine = engineOf(pictureOf(w, h, cells, colours));
        const fast = fullCells(engine);
        let ref = cells.slice();
        for (const { k, n } of shots) {
          const key = KEYS[k % colours] as string;
          const order: [number, number][] = [];
          const hits = launch(engine, fast, k % colours + 1, n, (cell, station) => order.push([cell, station]));
          const r = refLaunch(ref, w, h, { c: key, n });
          expect(order).toEqual(r.hits.map((x) => [x.cell, x.station]));
          expect(hits).toBe(r.hits.length);
          expect(n - hits).toBe(r.left);
          ref = r.cells;
          expect(Array.from(fast.present)).toEqual(ref.map((c) => (c === EMPTY ? 0 : 1)));
          expect(fast.left).toBe(ref.filter((c) => c !== EMPTY).length);
        }
        // Pointers: each station's pointer is at its true front (brute force).
        const lines = stationLines(w, h);
        lines.forEach((line, i) => {
          const truth = line.findIndex((c) => ref[c] !== EMPTY);
          expect(frontOf(engine, fast, i)).toBe(truth < 0 ? -1 : line[truth]);
        });
        expect(exposedOf(engine, fast)).toEqual(exposedCells(ref, w, h));
      }),
      { numRuns: 300 }
    );
  });

  it('lanes, slots and moves: random move sequences agree with the reference moves', () => {
    fc.assert(
      fc.property(
        gridArb,
        fc.array(fc.array(fc.record({ k: fc.integer({ min: 0, max: 19 }), n: fc.integer({ min: 1, max: 12 }) }), { maxLength: 6 }), { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 1, max: 6 }),
        fc.array(fc.tuple(fc.constantFrom('L', 'S'), fc.integer({ min: 0, max: 5 })), { maxLength: 20 }),
        ({ w, h, cells, colours }, rawLanes, slots, moves) => {
          const lanes = rawLanes.map((lane) => lane.map(({ k, n }) => ({ c: KEYS[k % colours] as string, n })));
          const engine = engineOf(pictureOf(w, h, cells, colours));
          const table = tableOf(engine, lanes, slots);
          const cur = startCursor(table);
          let ref: RefPosition = { w, h, cells: cells.slice(), lanes, laneFront: lanes.map(() => 0), slots: Array.from({ length: slots }, () => null) };
          for (const [kind, i] of moves) {
            const move = `${kind}${i}`;
            const next = refApply(ref, move);
            const legal = replayCursor(table, [move], cur) !== undefined;
            expect(legal, move).toBe(next !== ref);
            ref = next;
            expect(Array.from(cur.cells.present)).toEqual(ref.cells.map((c) => (c === EMPTY ? 0 : 1)));
            expect(Array.from(cur.laneFront)).toEqual(ref.laneFront);
            expect(cur.slots.map((s) => (s ? { c: KEYS[s.c - 1], n: s.n, lane: s.lane, index: s.index } : null))).toEqual(ref.slots);
          }
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('index of the fronts (start time on phones)', () => {
  it('trials and launches from an index give the same hits in the same order as walking the track (property)', () => {
    fc.assert(
      fc.property(gridArb, fc.array(fc.record({ k: fc.integer({ min: 0, max: 19 }), n: fc.integer({ min: 1, max: 40 }) }), { minLength: 1, maxLength: 12 }), ({ w, h, cells, colours }, shots) => {
        const engine = engineOf(pictureOf(w, h, cells, colours));
        const cur = fullCells(engine);
        const index = createFrontIndex();
        for (const { k, n } of shots) {
          const c = (k % colours) + 1;
          indexFronts(engine, cur, index);
          const walked: [number, number][] = [];
          const plain = cloneCells(cur);
          launch(engine, plain, c, n, (cell, station) => walked.push([cell, station]));
          // A trial leaves the cells (and so the index) as they were.
          const before = Array.from(cur.present);
          expect(hitsOf(engine, cur, c, n, index)).toBe(walked.length);
          expect(Array.from(cur.present)).toEqual(before);
          const indexed: [number, number][] = [];
          launch(engine, cur, c, n, (cell, station) => indexed.push([cell, station]), index);
          expect(indexed).toEqual(walked);
          expect(Array.from(cur.present)).toEqual(Array.from(plain.present));
          expect(cur.left).toBe(plain.left);
        }
      }),
      { numRuns: 300 }
    );
  });

  it('childrenOf lists exactly the legal moves with the hits a step makes (property)', () => {
    fc.assert(
      fc.property(
        gridArb,
        fc.array(fc.array(fc.record({ k: fc.integer({ min: 0, max: 19 }), n: fc.integer({ min: 1, max: 12 }) }), { maxLength: 6 }), { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 1, max: 3 }),
        fc.array(fc.integer({ min: 0, max: 20 }), { maxLength: 15 }),
        ({ w, h, cells, colours }, rawLanes, slots, picks) => {
          const lanes = rawLanes.map((lane) => lane.map(({ k, n }) => ({ c: KEYS[k % colours] as string, n })));
          const table = tableOf(engineOf(pictureOf(w, h, cells, colours)), lanes, slots);
          const cur = startCursor(table);
          for (const p of picks) {
            const children = childrenOf(table, cur);
            const legal = ['S0', 'S1', 'S2', 'L0', 'L1', 'L2', 'L3']
              .map((m) => ({ m, o: step(table, cur, m[0] as 'L' | 'S', Number(m[1]), false) }))
              .filter((x) => x.o.legal);
            expect(children.map((c) => [c.move, c.hits])).toEqual(legal.map((x) => [x.m, x.o.hits]));
            if (children.length === 0) break;
            const child = children[p % children.length]!;
            const after = child.cursor;
            step(table, cur, child.slotMove ? 'S' : 'L', child.index, true);
            expect(Array.from(cur.cells.present)).toEqual(Array.from(after.cells.present));
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('incremental exposed set', () => {
  it('equals a full rescan after any sequence of launches', () => {
    fc.assert(
      fc.property(gridArb, fc.array(fc.record({ k: fc.integer({ min: 0, max: 19 }), n: fc.integer({ min: 1, max: 30 }) }), { maxLength: 10 }), ({ w, h, cells, colours }, shots) => {
        const engine = engineOf(pictureOf(w, h, cells, colours));
        const cur = fullCells(engine);
        const exposure = exposureOf(engine, cloneCells(cur));
        for (const { k, n } of shots) {
          const removed: number[] = [];
          launch(engine, cur, k % colours + 1, n, (cell) => removed.push(cell));
          updateExposure(engine, cur, exposure, removed);
          const full = exposureOf(engine, cloneCells(cur));
          expect(Array.from(exposure.front)).toEqual(Array.from(full.front));
          expect(Array.from(exposure.seenBy)).toEqual(Array.from(full.seenBy));
        }
      }),
      { numRuns: 200 }
    );
  });
});

describe('engine basics', () => {
  it('a corner cell is the front of two stations; unknown keys are transparent', () => {
    const engine = engineOf({ w: 2, h: 2, rows: ['ab', 'cz'], palette: [{ key: 'a' }, { key: 'b' }, { key: 'c' }] });
    expect(engine.filled).toBe(3);
    expect(Array.from(engine.colour)).toEqual([1, 2, 3, 0]);
    const ex = exposureOf(engine, fullCells(engine));
    expect(ex.seenBy[0]).toBe(2);
  });

  it('a shooter without shots or colour hits nothing', () => {
    const engine = engineOf({ w: 1, h: 1, rows: ['a'], palette: [{ key: 'a' }] });
    expect(launch(engine, fullCells(engine), 1, 0)).toBe(0);
    expect(launch(engine, fullCells(engine), 0, 5)).toBe(0);
  });

  it('launches about 10 µs each at W = 48 (budget sanity, generous bound)', () => {
    const w = 48;
    const cells: string[] = [];
    for (let i = 0; i < w * w; i++) cells.push(KEYS[(Math.floor(i / 7) * 13 + i) % 18] as string);
    const engine = engineOf(pictureOf(w, w, cells, 18));
    const cur = fullCells(engine);
    const t0 = performance.now();
    let launches = 0;
    for (let round = 0; round < 50 && cur.left > 0; round++) {
      for (let c = 1; c <= 18; c++) {
        launch(engine, cur, c, 20);
        launches++;
      }
    }
    const per = (performance.now() - t0) / launches;
    // Measured ~10 µs; asserted < 200 µs so that a loaded CI runner never fails it.
    expect(per).toBeLessThan(0.2);
  });
});
