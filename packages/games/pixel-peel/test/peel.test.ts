import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { PeelQueue, peelTimeline, shotsOf, SLOW_TIMING, TIMING, tokenAt, type PeelHit, type PeelLaunch } from '../src/peel';
import { parseMove, startCursor, step } from '../src/engine';
import { createInitial } from '../src/generate';
import { tableOfState } from '../src/rules';

/** Hits on a track of `stations` stations, with distinct cells (as a launch never hits a cell twice). */
const hitsArb = (stations: number, max = 90) =>
  fc.array(fc.integer({ min: 0, max: stations - 1 }), { maxLength: max }).map((ss) => ss.map((station, i) => ({ cell: i, station })));

const launchArb = (stations: number) =>
  fc.record({ hits: hitsArb(stations, 40), colour: fc.constantFrom('a', 'b', 'c'), usedUp: fc.boolean() }).map(({ hits, colour, usedUp }) => ({ hits, colour, shots: hits.length + (usedUp ? 0 : 3), usedUp }));

describe('peel timeline (design v3 § 3.3)', () => {
  it('a hit pauses, walking costs 3 ms per station: a worked example', () => {
    // 20 stations; hits at stations 2 and 5, then the token walks on to the corner.
    const t = peelTimeline([{ cell: 7, station: 2 }, { cell: 8, station: 5 }], 20, false);
    expect(t.hitAt).toEqual([7.5, 7.5 + 40 + 9]);
    expect(t.segments.map((s) => [s.from, s.to])).toEqual([[-0.5, 2], [2, 5], [5, 19.5]]);
    expect(t.segments[2]!.t1 - t.segments[2]!.t0).toBe(3 * 14.5);
    expect(t.total).toBe(Math.max(t.segments[2]!.t1, t.hitAt[1]! + TIMING.peel));
    // Used up: the token stops at its last hit; the cell's peel effect ends the launch.
    const u = peelTimeline([{ cell: 7, station: 2 }], 20, true);
    expect(u.segments).toHaveLength(1);
    expect(u.total).toBe(7.5 + TIMING.peel);
  });

  it('wraps into the next lap: a hit at an earlier or the same station is a lap later', () => {
    const t = peelTimeline([{ cell: 1, station: 5 }, { cell: 2, station: 5 }, { cell: 3, station: 1 }], 10, true);
    expect(t.segments.map((s) => s.to)).toEqual([5, 15, 21]);
  });

  it('long walks and empty laps are capped at 250 ms per segment; parking walks one lap in at most 700 ms', () => {
    const t = peelTimeline([{ cell: 1, station: 199 }], 224, true);
    expect(t.segments[0]!.t1).toBe(TIMING.segment);
    const park = peelTimeline([], 224, false);
    expect(park.total).toBe(Math.min(TIMING.park, 3 * 224));
    expect(peelTimeline([], 400, false).total).toBe(TIMING.park);
    expect(park.segments).toEqual([{ from: -0.5, to: 223.5, t0: 0, t1: park.total }]);
  });

  it('a long launch is scaled down to 3.5 s', () => {
    const hits = Array.from({ length: 90 }, (_, i) => ({ cell: i, station: (i * 37) % 200 }));
    const t = peelTimeline(hits, 200, true);
    expect(t.total).toBe(TIMING.launch);
  });

  it('durations ≥ 0 and monotone; hit times strictly increasing; total within the caps (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 256 }).chain((s) => fc.tuple(fc.constant(s), hitsArb(s), fc.boolean())), ([stations, hits, usedUp]) => {
        const t = peelTimeline(hits, stations, usedUp);
        let last = 0;
        for (const seg of t.segments) {
          expect(seg.t0).toBeGreaterThanOrEqual(last - 1e-9);
          expect(seg.t1).toBeGreaterThanOrEqual(seg.t0);
          expect(seg.to).toBeGreaterThanOrEqual(seg.from);
          if (hits.length > 0) expect(seg.t1 - seg.t0).toBeLessThanOrEqual(TIMING.segment + 1e-9);
          last = seg.t1;
        }
        expect(t.hitAt).toHaveLength(hits.length);
        for (let k = 1; k < t.hitAt.length; k++) expect(t.hitAt[k]!).toBeGreaterThan(t.hitAt[k - 1]!);
        for (const at of t.hitAt) expect(at).toBeLessThanOrEqual(t.total);
        expect(t.total).toBeLessThanOrEqual(hits.length === 0 ? TIMING.park : TIMING.launch);
        expect(t.total).toBeGreaterThan(0);
        // The token reaches each hit's station when the hit happens.
        t.hitAt.forEach((at, k) => expect(((Math.round(tokenAt(t, at)) % stations) + stations) % stations).toBe(hits[k]!.station));
      }),
      { numRuns: 300 }
    );
  });
});

describe('peel queue (design v3 § 3.2, § 3.4)', () => {
  const launch = (cells: number[], colour = 'a', usedUp = true): PeelLaunch => ({ hits: cells.map((cell, i) => ({ cell, station: i * 3 })), colour, shots: cells.length, usedUp });

  it('peels a launch in hit order and then the next one; finishAll ends everything', () => {
    const q = new PeelQueue(40);
    q.enqueue(launch([1, 2, 3]));
    q.enqueue(launch([4, 5], 'b'));
    expect(q.launches).toBe(2);
    expect(q.pending).toBe(5);
    expect(q.queued()).toEqual(['b']);
    expect(q.token()).toMatchObject({ colour: 'a', shots: 3 });
    const seen: number[] = [];
    seen.push(...q.advance(20));
    expect(seen).toEqual([1]);
    expect(q.token()!.shots).toBe(2);
    expect(q.effects().map((e) => e.cell)).toEqual([1]);
    expect(q.token()!.target).toBe(1);
    seen.push(...q.finishAll());
    expect(seen).toEqual([1, 2, 3, 4, 5]);
    expect(q.busy).toBe(false);
    expect(q.pending).toBe(0);
    expect(q.token()).toBeNull();
    expect(q.finishAll()).toEqual([]);
  });

  it('a parking launch takes its lap and peels nothing', () => {
    const q = new PeelQueue(40);
    q.enqueue({ hits: [], colour: 'a', shots: 5, usedUp: false });
    expect(q.busy).toBe(true);
    expect(q.advance(60)).toEqual([]);
    expect(q.token()!.distance).toBeGreaterThan(0);
    q.advance(1000);
    expect(q.busy).toBe(false);
  });

  it('a used-up token fades out where it stops', () => {
    const q = new PeelQueue(40);
    q.enqueue(launch([9]));
    q.advance(1 + 40);
    // It shoots first (the pause at its last hit), then fades.
    expect(q.token()!.fade).toBe(0);
    q.advance(20);
    expect(q.token()!.fade).toBeGreaterThan(0);
  });

  it('a backlog runs faster, so that everything queued ends within 6 s', () => {
    const q = new PeelQueue(200);
    const long = Array.from({ length: 60 }, (_, i) => i);
    for (let k = 0; k < 5; k++) q.enqueue({ hits: long.map((c) => ({ cell: c + 100 * k, station: (c * 37) % 200 })), colour: 'a', shots: 60, usedUp: true });
    expect(q.remaining()).toBeGreaterThan(TIMING.backlog);
    expect(q.remainingWall()).toBeCloseTo(TIMING.backlog, 6);
    let wall = 0;
    while (q.busy && wall < 10_000) {
      q.advance(16);
      wall += 16;
    }
    expect(wall).toBeLessThanOrEqual(TIMING.backlog + 32);
  });

  it('for any interleaving of enqueue, advance and finishAll: peeled ⊆ committed, hit order per launch, serial launches, backlog ≤ 6 s (property)', () => {
    const op = fc.oneof(
      { arbitrary: launchArb(48).map((l) => ({ kind: 'enqueue' as const, l })), weight: 3 },
      { arbitrary: fc.integer({ min: 0, max: 900 }).map((dt) => ({ kind: 'advance' as const, dt })), weight: 5 },
      { arbitrary: fc.constant({ kind: 'finish' as const }), weight: 1 }
    );
    fc.assert(
      fc.property(fc.array(op, { maxLength: 40 }), (ops) => {
        const q = new PeelQueue(48);
        let next = 0;
        const committed: number[] = [];
        /** Per launch: its cells in hit order. */
        const launches: number[][] = [];
        const peeled: number[] = [];
        for (const o of ops) {
          if (o.kind === 'enqueue') {
            const hits: PeelHit[] = o.l.hits.map((h) => ({ cell: next++, station: h.station }));
            launches.push(hits.map((h) => h.cell));
            committed.push(...hits.map((h) => h.cell));
            q.enqueue({ ...o.l, hits });
          } else if (o.kind === 'advance') peeled.push(...q.advance(o.dt));
          else peeled.push(...q.finishAll());
          // Shown as peeled: only committed cells, each once, in launch order and hit order (serial launches).
          expect(peeled).toEqual(committed.slice(0, peeled.length));
          expect(q.pending).toBe(committed.length - peeled.length);
          expect(q.remainingWall()).toBeLessThanOrEqual(TIMING.backlog + 1e-6);
        }
        peeled.push(...q.finishAll());
        expect(peeled).toEqual(committed);
        expect(launches.flat()).toEqual(committed);
      }),
      { numRuns: 300 }
    );
  });

  it('after enough time everything committed is peeled', () => {
    fc.assert(
      fc.property(fc.array(launchArb(64), { maxLength: 8 }), (ls) => {
        const q = new PeelQueue(64);
        let n = 0;
        let cell = 0;
        for (const l of ls) {
          const hits = l.hits.map((h) => ({ cell: cell++, station: h.station }));
          q.enqueue({ ...l, hits });
          n += hits.length;
        }
        const peeled: number[] = [];
        for (let k = 0; k < 400 && q.busy; k++) peeled.push(...q.advance(16));
        expect(q.busy).toBe(false);
        expect(peeled).toHaveLength(n);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Slow: line by line (owner feedback 2026-10-30)', () => {
  it('shots are the runs of consecutive hits at one station, in hit order; Quick keeps one hit per shot', () => {
    const hits = [{ cell: 1, station: 4 }, { cell: 2, station: 4 }, { cell: 3, station: 9 }, { cell: 4, station: 4 }, { cell: 5, station: 4 }, { cell: 6, station: 4 }];
    expect(shotsOf(hits, true).map((shot) => shot.map((x) => x.cell))).toEqual([[1, 2], [3], [4, 5, 6]]);
    expect(shotsOf(hits, false)).toHaveLength(6);
    const t = peelTimeline(hits, 20, true, SLOW_TIMING);
    expect(t.hitAt[0]).toBe(t.hitAt[1]);
    expect(t.hitAt[3]).toBe(t.hitAt[5]);
    expect(t.hitAt[2]!).toBeGreaterThan(t.hitAt[1]!);
    expect(t.hitAt[3]!).toBeGreaterThan(t.hitAt[2]!);
  });

  it('a worked example: 35 ms per station, 300 ms per shot', () => {
    const t = peelTimeline([{ cell: 7, station: 2 }, { cell: 8, station: 5 }], 20, true, SLOW_TIMING);
    expect(t.hitAt).toEqual([35 * 2.5, 35 * 2.5 + 300 + 35 * 3]);
    expect(t.pause).toBe(300);
    expect(t.total).toBe(t.hitAt[1]! + 300);
    // A long empty stretch is walked in at most 600 ms; parking walks a lap in at most 1.2 s.
    expect(peelTimeline([{ cell: 1, station: 150 }], 200, true, SLOW_TIMING).hitAt[0]).toBe(600);
    expect(peelTimeline([], 200, false, SLOW_TIMING).total).toBe(1200);
  });

  it('durations are bounded and shots strictly ordered (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 4, max: 256 }).chain((st) => fc.tuple(fc.constant(st), hitsArb(st), fc.boolean())), ([stations, hits, usedUp]) => {
        const t = peelTimeline(hits, stations, usedUp, SLOW_TIMING);
        expect(t.total).toBeLessThanOrEqual(hits.length === 0 ? SLOW_TIMING.park : SLOW_TIMING.launch);
        expect(t.pause).toBeLessThanOrEqual(SLOW_TIMING.hit);
        for (const seg of t.segments) expect(seg.t1 - seg.t0).toBeLessThanOrEqual(hits.length === 0 ? SLOW_TIMING.park : SLOW_TIMING.segment);
        const shots = shotsOf(hits, true);
        let k = 0;
        let last = -1;
        for (const shot of shots) {
          const at = t.hitAt[k]!;
          expect(at).toBeGreaterThan(last);
          for (let j = 0; j < shot.length; j++) expect(t.hitAt[k + j]).toBe(at);
          // The token stands at the shot's station.
          expect(((Math.round(tokenAt(t, at)) % stations) + stations) % stations).toBe(shot[0]!.station);
          last = at;
          k += shot.length;
        }
        expect(k).toBe(hits.length);
      }),
      { numRuns: 300 }
    );
  });

  it('on real games, under a fake clock, the pixels go per shot in exactly the rules\' order, and every launch ends within 7 s', () => {
    for (const [motif, seed] of [['red-fox', 1], ['winter-village', 2], ['koala', 3]] as const) {
      const state = createInitial(seed, 'hard', motif);
      const table = tableOfState(state);
      const cur = startCursor(table);
      const stations = 2 * state.picture.w + 2 * state.picture.h;
      for (const move of state.witness.slice(0, 25)) {
        const p = parseMove(move)!;
        const hits: PeelHit[] = [];
        const o = step(table, cur, p.kind, p.index, true, (cell, station) => hits.push({ cell, station }));
        const q = new PeelQueue(stations, SLOW_TIMING);
        q.enqueue({ hits, colour: 'a', shots: o.shooter!.n, usedUp: o.left === 0 });
        const popped: number[] = [];
        const batches: number[][] = [];
        let wall = 0;
        while (q.busy) {
          const batch = q.advance(16);
          wall += 16;
          if (batch.length) batches.push(batch);
          popped.push(...batch);
        }
        expect(popped, `${motif} ${move}`).toEqual(hits.map((x) => x.cell));
        expect(wall).toBeLessThanOrEqual(SLOW_TIMING.launch + 16);
        // A shot is never split over two frames: each frame's pixels are whole shots.
        const shotOf = new Map<number, number>();
        shotsOf(hits, true).forEach((shot, i) => shot.forEach((x) => shotOf.set(x.cell, i)));
        const seenShots = new Set<number>();
        for (const batch of batches) for (const shot of new Set(batch.map((c) => shotOf.get(c)!))) {
          expect(seenShots.has(shot)).toBe(false);
          seenShots.add(shot);
        }
      }
    }
  });

  it('a Slow backlog speeds up so that everything queued ends within 10 s', () => {
    const q = new PeelQueue(200, SLOW_TIMING);
    for (let k = 0; k < 4; k++) q.enqueue({ hits: Array.from({ length: 40 }, (_, i) => ({ cell: k * 100 + i, station: (i * 37) % 200 })), colour: 'a', shots: 40, usedUp: true });
    expect(q.remainingWall()).toBeLessThanOrEqual(SLOW_TIMING.backlog + 1e-6);
    let wall = 0;
    while (q.busy && wall < 20_000) {
      q.advance(16);
      wall += 16;
    }
    expect(wall).toBeLessThanOrEqual(SLOW_TIMING.backlog + 32);
  });
});
