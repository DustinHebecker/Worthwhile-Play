import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { controllerFor, CROSS_PENALTY, crossFire, options, PROFILES } from '../src/ai';
import { crossingDistances, crossings, FACTION_COUNTS, getMap } from '../src/maps';
import {
  accountedUnits,
  cloneState,
  createGame,
  mapOf,
  CROSS_REACH,
  crossingsOf,
  inCrossingZone,
  isValidState,
  stepMut,
  UNIT_HP,
  UNIT_SPEED,
  type GameMap,
  type NcState,
  type Unit,
  type UnitKind
} from '../src/rules';
import { addUnit, makeMap, quiet, stateFor, stubRng } from './fixtures';
import { playMatch, quantile, type MatchResult } from './harness';

/*
 * Crossing lanes (hand-built maps): no bridges. Streams of different factions that pass the crossing
 * point at the same time fight there by the head-on rule; own streams fly past each other.
 */

/** Two lanes in an X: 0–1 (owner 0 at node 0) and 2–3 (owner 1 at node 3), crossing at (300, 300). */
const xMap = (): GameMap =>
  makeMap(
    [
      { x: 100, y: 100, owner: 0, level: 10 },
      { x: 500, y: 500 },
      { x: 100, y: 500 },
      { x: 500, y: 100, owner: 1, level: 10 }
    ],
    [
      [0, 1],
      [2, 3]
    ]
  );
// Both lanes are 565 long; the crossing lies at 283 from each lane's lower node (282 from the other end).
const LEN = 565;
const AT = 283;

describe('crossing points', () => {
  it('are precomputed per lane pair as integer distances along both lanes, in the order of `crossings`', () => {
    const map = xMap();
    expect(map.lanes.map((l) => l[2])).toEqual([LEN, LEN]);
    expect(crossingDistances(map)).toEqual([[0, 1, AT, AT]]);
    expect(crossingsOf(map)).toEqual([[0, 1, AT, AT]]);
    expect(crossingsOf(map)).toBe(crossingsOf(map));
    for (const f of FACTION_COUNTS) {
      for (let m = 0; m < 13; m++) {
        const real = getMap(f, m);
        const list = crossingDistances(real);
        expect(list.map(([i, j]) => [i, j])).toEqual(crossings(real).map(([i, j]) => [i, j]));
        // The distances lead to the same point on both lanes (within rounding).
        list.forEach(([i, j, di, dj], k) => {
          const [, , x, y] = crossings(real)[k]!;
          for (const [lane, d] of [
            [i, di],
            [j, dj]
          ] as const) {
            const [a, b, len] = real.lanes[lane]!;
            const A = real.nodes[a]!;
            const B = real.nodes[b]!;
            expect(Math.hypot(A.x + ((B.x - A.x) * d) / len - x, A.y + ((B.y - A.y) * d) / len - y)).toBeLessThan(2);
            // Zones never reach a node, so a unit fights there only while travelling.
            expect(d).toBeGreaterThan(CROSS_REACH + UNIT_SPEED[0]);
            expect(len - d).toBeGreaterThan(CROSS_REACH + UNIT_SPEED[0]);
          }
        });
        if (m < 7) expect(list).toEqual([]);
      }
    }
  });

  it('zone: the stretch a unit covered during the tick overlaps CROSS_REACH around the point, in its own direction', () => {
    const lane = [0, 1, LEN] as const;
    const drone = (a: number, b: number, d: number): Unit => ({ f: 0, k: 0, a, b, d, hp: 1, h: 0 });
    expect(CROSS_REACH).toBe(24);
    // Forward (from node 0): point at 283.
    expect(inCrossingZone(drone(0, 1, AT - CROSS_REACH), lane, AT)).toBe(true);
    expect(inCrossingZone(drone(0, 1, AT - CROSS_REACH - 1), lane, AT)).toBe(false);
    expect(inCrossingZone(drone(0, 1, AT + CROSS_REACH + 5), lane, AT)).toBe(true);
    expect(inCrossingZone(drone(0, 1, AT + CROSS_REACH + 6), lane, AT)).toBe(false);
    // Backward (from node 1): point at 565 − 283 = 282 from its start.
    expect(inCrossingZone(drone(1, 0, 282 - CROSS_REACH), lane, AT)).toBe(true);
    expect(inCrossingZone(drone(1, 0, 282 - CROSS_REACH - 1), lane, AT)).toBe(false);
    expect(inCrossingZone(drone(1, 0, 282 + CROSS_REACH + 5), lane, AT)).toBe(true);
    expect(inCrossingZone(drone(1, 0, 282 + CROSS_REACH + 6), lane, AT)).toBe(false);
    // Frigates move 3 per tick.
    expect(inCrossingZone({ ...drone(0, 1, AT + CROSS_REACH + 3), k: 1 }, lane, AT)).toBe(true);
    expect(inCrossingZone({ ...drone(0, 1, AT + CROSS_REACH + 4), k: 1 }, lane, AT)).toBe(false);
  });

  it('no unit can skip a crossing: whatever its start, it is in the zone on the tick it passes the point', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: LEN }), fc.constantFrom<UnitKind>(0, 1), fc.boolean(), fc.integer({ min: 30, max: LEN - 30 }), (d0, k, forward, at) => {
        const lane = [0, 1, LEN] as const;
        const point = forward ? at : LEN - at;
        const u: Unit = { f: 0, k, a: forward ? 0 : 1, b: forward ? 1 : 0, d: d0, hp: UNIT_HP[k], h: 0 };
        let ticksInZone = 0;
        while (u.d < LEN) {
          const before = u.d;
          u.d += UNIT_SPEED[k];
          const inZone = inCrossingZone(u, lane, at);
          if (before < point && u.d >= point) expect(inZone).toBe(true);
          if (inZone) ticksInZone++;
        }
        if (d0 < point - CROSS_REACH) expect(ticksInZone).toBeGreaterThanOrEqual(Math.floor((2 * CROSS_REACH) / UNIT_SPEED[k]));
      })
    );
  });
});

describe('fights at crossing points', () => {
  /** Drone of faction 0 on 0 → 1 and a unit of `f` on 3 → 2, each `before` lane units before the point after the move. */
  function scene(f: number, opts: { kind?: UnitKind; mine?: number; theirs?: number } = {}) {
    const map = xMap();
    const s = stateFor(map);
    const kind = opts.kind ?? 0;
    // After one tick: d + speed.
    const mine = addUnit(s, { f: 0, a: 0, b: 1, d: AT - 5 + (opts.mine ?? 0) });
    const theirs = addUnit(s, { f, k: kind, a: 3, b: 2, d: LEN - AT - UNIT_SPEED[kind] + (opts.theirs ?? 0) });
    return { map, s, mine, theirs };
  }

  it('hostile streams that meet at the point destroy each other like opposing streams on one lane', () => {
    const { map, s } = scene(1);
    stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.stats.fought).toBe(2);
    expect(accountedUnits(s)).toBe(s.stats.produced);
  });

  it('own streams fly past each other', () => {
    const { map, s, mine, theirs } = scene(0);
    stepMut(s, map);
    expect(s.units).toEqual([mine, theirs]);
    expect([mine.d, theirs.d]).toEqual([AT, LEN - AT]);
    expect(s.stats.fought).toBe(0);
  });

  it('a frigate takes a drone with one hit point lost, as on a lane', () => {
    const { map, s, theirs } = scene(1, { kind: 1 });
    stepMut(s, map);
    expect(s.units).toEqual([theirs]);
    expect(theirs.hp).toBe(2);
    expect(s.stats.fought).toBe(1);
  });

  it('units fight anywhere within the zone, not only exactly at the point; further apart they pass', () => {
    for (const [mine, theirs, fight] of [
      [-CROSS_REACH, 0, true],
      [0, CROSS_REACH + 5, true],
      [CROSS_REACH + 5, -CROSS_REACH, true],
      [-CROSS_REACH - 1, 0, false],
      [0, CROSS_REACH + 6, false],
      [0, -CROSS_REACH - 1, false]
    ] as const) {
      const { map, s } = scene(1, { mine, theirs });
      stepMut(s, map);
      expect([mine, theirs, s.units.length]).toEqual([mine, theirs, fight ? 0 : 2]);
    }
  });

  it('units that both jump across the point within one tick still meet', () => {
    // Before the tick both are short of the point, after it both are past it.
    const { map, s } = scene(1, { mine: 3, theirs: 2 });
    expect(s.units.map((u) => u.d)).toEqual([AT - 2, LEN - AT - 3]);
    stepMut(s, map);
    expect(s.units).toEqual([]);
  });

  it('a stream is met by a crossing stream whatever their timing (no gaps between the zones of a steady stream)', () => {
    // A steady drone stream (one unit per 10 ticks) crosses a hostile one; every unit that reaches the point is caught.
    const map = xMap();
    const s = stateFor(map);
    s.out[0] = [1];
    s.out[3] = [2];
    for (let i = 0; i < 400; i++) stepMut(s, map);
    expect(s.stats.produced).toBeGreaterThan(70);
    expect(s.stats.hits).toBe(0);
    expect(s.stats.fought).toBeGreaterThan(60);
    // Nothing gets past the crossing: every unit still in flight is short of the zone or inside it.
    for (const u of s.units) expect(u.d).toBeLessThanOrEqual(LEN - AT + CROSS_REACH + 5);
  });

  it('several crossings in one tick are resolved in the fixed order of the crossings', () => {
    // Lane 0–1 is crossed by 2–3 (at x 200) and 4–5 (at x 240): the zones overlap.
    const map = makeMap(
      [
        { x: 100, y: 300 },
        { x: 400, y: 300 },
        { x: 200, y: 100 },
        { x: 200, y: 500 },
        { x: 240, y: 100 },
        { x: 240, y: 500 }
      ],
      [
        [0, 1],
        [2, 3],
        [4, 5]
      ]
    );
    expect(crossingsOf(map)).toEqual([
      [0, 1, 100, 200],
      [0, 2, 140, 200]
    ]);
    const s = stateFor(map);
    const frigate = addUnit(s, { f: 0, k: 1, a: 0, b: 1, d: 117 });
    addUnit(s, { f: 1, a: 2, b: 3, d: 200 });
    addUnit(s, { f: 1, a: 4, b: 5, d: 200 });
    addUnit(s, { f: 0, a: 4, b: 5, d: 195 });
    stepMut(s, map);
    // The frigate (at 120, in both zones) takes the drone at the first crossing, then the hostile one at the second.
    expect(frigate.hp).toBe(1);
    expect(s.units.map((u) => [u.f, u.k, u.a, u.d, u.hp])).toEqual([
      [0, 1, 0, 120, 1],
      [0, 0, 4, 200, 1]
    ]);
  });

  it('results do not depend on the order of units, factions or lanes (fast-check, real crossing maps)', () => {
    const maps = FACTION_COUNTS.flatMap((f) => [getMap(f, 7), getMap(f, 11)]);
    const unitArb = fc.record({
      crossing: fc.nat(),
      side: fc.boolean(),
      f: fc.nat(),
      k: fc.constantFrom<UnitKind>(0, 1),
      offset: fc.integer({ min: -CROSS_REACH - 8, max: CROSS_REACH + 8 }),
      hp: fc.integer({ min: 1, max: 3 })
    });
    fc.assert(
      fc.property(
        fc.constantFrom(...maps.keys()),
        fc.array(fc.boolean(), { minLength: 64, maxLength: 64 }),
        fc.array(unitArb, { minLength: 2, maxLength: 24 }),
        fc.array(fc.nat(), { minLength: 24, maxLength: 24 }),
        (mapIndex, directions, specs, keys) => {
          const map = maps[mapIndex]!;
          const list = crossingsOf(map);
          const base = stateFor(map);
          for (const spec of specs) {
            const [i, j, di, dj] = list[spec.crossing % list.length]!;
            const lane = spec.side ? j : i;
            const at = spec.side ? dj : di;
            const [a, b, len] = map.lanes[lane]!;
            // One direction per lane, so lane fights (which have their own order rules) stay out of it.
            const forward = directions[lane % 64]!;
            const d = Math.max(0, (forward ? at : len - at) + spec.offset - UNIT_SPEED[spec.k]);
            addUnit(base, { f: spec.f % map.factions, k: spec.k, a: forward ? a : b, b: forward ? b : a, d, hp: Math.min(spec.hp, UNIT_HP[spec.k]) });
          }
          const run = (units: Unit[]): NcState => {
            const s: NcState = { ...base, units: units.map((u) => ({ ...u })), stats: { ...base.stats } };
            stepMut(s, map);
            return s;
          };
          const canon = (s: NcState) => ({ units: s.units.map((u) => JSON.stringify(u)).sort(), stats: s.stats });
          const permuted = base.units.map((u, i) => [keys[i % keys.length]! * 64 + i, u] as const).sort((x, y) => x[0] - y[0]).map(([, u]) => u);
          const one = run(base.units);
          expect(canon(run([...base.units].reverse()))).toEqual(canon(one));
          expect(canon(run(permuted))).toEqual(canon(one));
          expect(accountedUnits(one)).toBe(one.stats.produced);
        }
      ),
      { numRuns: 150 }
    );
  });
});

describe('saves on crossing maps', () => {
  it('need no new state: a save taken mid-match is valid and continues exactly like the running match', () => {
    for (const [map, opponents] of [
      [7, 1],
      [11, 3]
    ] as const) {
      const s = createGame(5, { map, opponents, difficulty: 'advanced' });
      const m = mapOf(s);
      const bots = controllerFor(Array.from({ length: m.factions }, () => PROFILES.advanced));
      const play = (x: NcState, ticks: number) => {
        for (let t = 0; t < ticks && x.result === 'playing'; t++) stepMut(x, m, bots);
        return x;
      };
      play(s, 500);
      expect(s.result).toBe('playing');
      expect(s.stats.fought).toBeGreaterThan(0);
      const saved: unknown = JSON.parse(JSON.stringify(s));
      expect(isValidState(saved)).toBe(true);
      expect(play(cloneState(saved as NcState), 500)).toEqual(play(s, 500));
    }
  }, 60_000);
});

describe('opponents see crossing streams', () => {
  /**
   * Faction 1 at V chooses between W1 and W2 (same level, same lane length). A stream of faction 0
   * from X to Y crosses the lane V–W2.
   */
  const scene = () => {
    const map = makeMap(
      [
        { x: 300, y: 100, owner: 1, level: 10 },
        { x: 150, y: 250 },
        { x: 450, y: 250 },
        { x: 450, y: 100, owner: 0, level: 10 },
        { x: 300, y: 250 }
      ],
      [
        [0, 1],
        [0, 2],
        [3, 4]
      ]
    );
    return { map, s: stateFor(map) };
  };

  it('crossFire counts hostile streams in either direction on lanes that cross, never own ones or idle lanes', () => {
    const { map, s } = scene();
    expect(crossingsOf(map)).toEqual([[1, 2, 106, 106]]);
    expect(crossFire(s, map, 1, 1)).toBe(0);
    s.out[3] = [4];
    expect(crossFire(s, map, 1, 1)).toBe(1);
    expect(crossFire(s, map, 1, 0)).toBe(0);
    // Its own stream is no threat to faction 0.
    expect(crossFire(s, map, 0, 1)).toBe(0);
    s.owner[4] = 2;
    s.out[4] = [3];
    s.out[3] = [];
    expect(crossFire(s, map, 1, 1)).toBe(1);
    s.out[3] = [4];
    expect(crossFire(s, map, 1, 1)).toBe(2);
    expect(crossFire(s, map, 2, 1)).toBe(1);
  });

  it('aware levels rate an attack across a hostile stream lower; unaware ones do not notice', () => {
    const { map, s } = scene();
    const score = (aware: boolean, to: number) => options(s, map, 1, { ...quiet, aware }, stubRng()).find((o) => o.cmds[0]!.to === to)!.score;
    expect(score(true, 2)).toBe(score(true, 1));
    s.out[3] = [4];
    expect(CROSS_PENALTY).toBe(12);
    expect(score(true, 1) - score(true, 2)).toBe(CROSS_PENALTY);
    expect(score(false, 2)).toBe(score(false, 1));
  });
});

describe('crossing combat keeps matches decisive (stall harness, fixed seeds)', () => {
  it('maps with crossings (8 and 12), one and two opponents: few standoffs, no trivial games', () => {
    const duels: MatchResult[] = [];
    const human: MatchResult[] = [];
    for (const m of [7, 11]) {
      for (const k of [1, 2] as const) {
        for (let i = 0; i < 6; i++) {
          duels.push(playMatch(i * 37 + 5, 'advanced', 'advanced', 9000, m, {}, k));
          human.push(playMatch(i * 37 + 5, 'human', 'advanced', 9000, m, {}, k));
        }
      }
    }
    // Measured (24 matches each): 1 standoff in bot duels, none with the human-like player; median 1916 / 2259 ticks.
    expect(duels.filter((r) => r.stalled).length).toBeLessThanOrEqual(2);
    expect(human.filter((r) => r.stalled).length).toBeLessThanOrEqual(1);
    const lengths = [...duels, ...human].map((r) => r.ticks);
    expect(Math.min(...lengths)).toBeGreaterThanOrEqual(900);
    expect(quantile(lengths, 0.5)).toBeLessThan(3000);
  }, 120_000);
});
