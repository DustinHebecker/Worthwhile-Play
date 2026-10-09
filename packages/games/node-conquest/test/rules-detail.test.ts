import { describe, expect, it } from 'vitest';
import { simulate } from '../src/ai';
import {
  cloneState,
  createGame,
  HISTORY_CAP,
  HISTORY_EVERY,
  INTRO_MAP,
  isActive,
  isValidState,
  mapOf,
  MAPS_PER_SET,
  MAX_UNITS,
  migrateState,
  PRODUCTION_INTERVAL,
  refusal,
  SHOT_INTERVAL,
  stationRange,
  stepMut,
  UNIT_HP,
  V1_MAPPING,
  type NcState,
  type NodeType
} from '../src/rules';
import { addUnit, makeMap, stateFor } from './fixtures';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Three nodes in a row, 200 apart: 0 (player) – 1 – 2 (opponent). */
const row = () =>
  makeMap(
    [
      { x: 100, y: 100, owner: 0, level: 10 },
      { x: 300, y: 100 },
      { x: 500, y: 100, owner: 1, level: 10 }
    ],
    [
      [0, 1],
      [1, 2]
    ]
  );

describe('rules in detail: setup and paths', () => {
  it('the introduction map always uses its own layout and one opponent', () => {
    const s = createGame(4, { map: INTRO_MAP, layout: 1, opponents: 3 });
    expect(s.layout).toBe(2);
    expect(s.opponents).toBe(1);
    expect(createGame(4, { map: 2, layout: 1 }).layout).toBe(1);
  });

  it('cloneState copies everything, including the centre record, without sharing arrays', () => {
    const s = createGame(4, { map: 0 });
    s.centre = [5, 1];
    const copy = cloneState(s);
    expect(copy).toEqual(s);
    expect(copy.centre).not.toBe(s.centre);
  });

  it('treats nodes outside the map as not adjacent and not active', () => {
    const map = row();
    const s = stateFor(map);
    expect(refusal(s, map, 0, 0, 3)).toBe('notAdjacent');
    expect(refusal(s, map, 0, 0, 2)).toBe('notAdjacent');
    expect(isActive(s, 9, 0)).toBe(false);
    s.out[0] = [1];
    expect(isActive(s, 0, 1)).toBe(true);
    expect(isActive(s, 1, 0)).toBe(false);
  });
});

describe('rules in detail: production timing', () => {
  it('charges only owned producers with an active path, and emits exactly at the interval', () => {
    for (const type of ['standard', 'shipyard', 'bastion'] as NodeType[]) {
      const map = makeMap(
        [
          { x: 100, y: 100, owner: 0, level: 10, type },
          { x: 900, y: 100, owner: 1, level: 10 },
          { x: 100, y: 900, owner: 0, level: 10, type }
        ],
        [
          [0, 1],
          [1, 2]
        ]
      );
      const s = stateFor(map);
      s.out[0] = [1];
      const interval = PRODUCTION_INTERVAL[type];
      for (let t = 1; t < interval; t++) {
        stepMut(s, map);
        expect(s.charge, `${type} tick ${t}`).toEqual([t, 0, 0]);
        expect(s.units).toEqual([]);
      }
      stepMut(s, map);
      expect(s.charge).toEqual([0, 0, 0]);
      expect(s.units).toHaveLength(1);
      expect(s.units[0]).toMatchObject({ f: 0, a: 0, b: 1, k: type === 'shipyard' ? 1 : 0 });
    }
  });
});

describe('rules in detail: head-on fights', () => {
  it('fights on every lane in both directions, whatever the order of the units', () => {
    // A path 0–1–2–3–4 with lanes of length 200; one head-on pair meets on every lane.
    const map = makeMap(
      [0, 1, 2, 3, 4].map((i) => ({ x: 100 + 200 * i, y: 100 })),
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4]
      ]
    );
    const s = stateFor(map);
    for (const lane of [3, 2, 1, 0]) {
      addUnit(s, { f: 0, a: lane, b: lane + 1, d: 98 });
      addUnit(s, { f: 1, a: lane + 1, b: lane, d: 98 });
    }
    stepMut(s, map);
    expect(s.units).toEqual([]);
    expect(s.stats.fought).toBe(8);
  });

  it('a frigate travelling forward survives a drone and stops fighting once it is destroyed', () => {
    const map = row();
    const s = stateFor(map);
    const frigate = addUnit(s, { f: 0, k: 1, a: 1, b: 2, d: 98 });
    addUnit(s, { f: 1, a: 2, b: 1, d: 98 });
    stepMut(s, map);
    expect(s.units).toEqual([frigate]);
    expect(frigate.hp).toBe(UNIT_HP[1] - 1);
    expect(s.stats.fought).toBe(1);
  });
});

describe('rules in detail: defence platforms', () => {
  /**
   * Station 2 (player, at 300/300) next to a horizontal lane 0–1 (y = 400, 100 below it) and a
   * diagonal lane 4–5 that passes it at about 89; lane 1–3 is far away.
   */
  const field = (level: number) =>
    makeMap(
      [
        { x: 100, y: 400, owner: 1, level: 10 },
        { x: 500, y: 400 },
        { x: 300, y: 300, owner: 0, level, type: 'station' },
        { x: 900, y: 900, owner: 0, level: 5 },
        { x: 100, y: 500, owner: 1, level: 10 },
        { x: 500, y: 300 }
      ],
      [
        [0, 1],
        [4, 5],
        [1, 3]
      ]
    );

  const shotsAt = (level: number, units: { a: number; b: number; d: number }[], charge = SHOT_INTERVAL) => {
    const map = field(level);
    const s = stateFor(map);
    s.charge[2] = charge;
    for (const u of units) addUnit(s, { f: 1, ...u });
    const events = stepMut(s, map);
    return { s, shots: events.shots };
  };

  it('hits a unit exactly at the edge of its range (lane closest point in the middle of the lane)', () => {
    expect(stationRange(10)).toBe(100);
    // After moving, the drone is at (300, 400): exactly 100 away.
    const { s, shots } = shotsAt(10, [{ a: 0, b: 1, d: 195 }]);
    expect(shots).toEqual([[2, 300, 400]]);
    expect(s.units).toEqual([]);
    expect(s.stats.shot).toBe(1);
    // One level lower the range is 97: no shot, and the charge is kept.
    const low = shotsAt(9, [{ a: 0, b: 1, d: 195 }]);
    expect(low.shots).toEqual([]);
    expect(low.s.charge[2]).toBe(SHOT_INTERVAL);
  });

  it('does not hit a unit on a nearby lane while it is still out of range', () => {
    // (250, 400) is about 112 away, although the lane passes at 100.
    const { s, shots } = shotsAt(10, [{ a: 0, b: 1, d: 145 }]);
    expect(shots).toEqual([]);
    expect(s.units).toHaveLength(1);
  });

  it('hits units on a diagonal lane that passes within range', () => {
    // Lane 4–5 (length 447): after moving to d = 268 the drone is at (339, 381), about 90 away.
    const { s, shots } = shotsAt(10, [{ a: 4, b: 5, d: 263 }]);
    expect(shots).toEqual([[2, 339, 381]]);
    expect(s.units).toEqual([]);
  });

  it('targets the nearest hostile unit, the first one on equal distance', () => {
    const near = shotsAt(20, [
      { a: 0, b: 1, d: 195 },
      { a: 0, b: 1, d: 255 }
    ]);
    expect(near.shots).toEqual([[2, 300, 400]]);
    expect(near.s.units.map((u) => u.d)).toEqual([260]);
    // (250, 400) and (350, 400) are equally far: the first one in the list is hit.
    const tie = shotsAt(20, [
      { a: 0, b: 1, d: 245 },
      { a: 0, b: 1, d: 145 }
    ]);
    expect(tie.shots).toEqual([[2, 350, 400]]);
  });

  it('keeps its charge at SHOT_INTERVAL while nothing is in range', () => {
    const map = field(10);
    const s = stateFor(map);
    for (let i = 0; i < 2 * SHOT_INTERVAL; i++) stepMut(s, map);
    expect(s.charge[2]).toBe(SHOT_INTERVAL);
  });

  it('a second platform does not waste its shot on a unit the first one destroyed', () => {
    const map = makeMap(
      [
        { x: 100, y: 400, owner: 1, level: 10 },
        { x: 500, y: 400 },
        { x: 300, y: 300, owner: 0, level: 20, type: 'station' },
        { x: 300, y: 500, owner: 0, level: 20, type: 'station' }
      ],
      [[0, 1]]
    );
    const s = stateFor(map);
    s.charge[2] = s.charge[3] = SHOT_INTERVAL;
    addUnit(s, { f: 1, a: 0, b: 1, d: 195 });
    addUnit(s, { f: 1, a: 0, b: 1, d: 275 });
    const events = stepMut(s, map);
    expect(events.shots).toEqual([
      [2, 300, 400],
      [3, 380, 400]
    ]);
    expect(s.units).toEqual([]);
    expect(s.stats.shot).toBe(2);
  });
});

describe('rules in detail: history and the end of a match', () => {
  it('samples on the grid of the history start, also when it is not a multiple of HISTORY_EVERY', () => {
    const map = row();
    const s = stateFor(map);
    s.tick = 30;
    s.hist = { start: 30, every: HISTORY_EVERY, rows: [[1, 1]] };
    for (let i = 0; i < HISTORY_EVERY - 1; i++) stepMut(s, map);
    expect(s.tick).toBe(79);
    expect(s.hist.rows).toHaveLength(1);
    stepMut(s, map);
    expect(s.hist.rows).toHaveLength(2);
  });

  it('keeps exactly HISTORY_CAP samples and halves only beyond', () => {
    const map = row();
    const s = stateFor(map);
    s.hist = { start: 0, every: HISTORY_EVERY, rows: Array.from({ length: HISTORY_CAP - 1 }, () => [1, 1]) };
    s.tick = HISTORY_EVERY - 1;
    stepMut(s, map);
    expect(s.hist.rows).toHaveLength(HISTORY_CAP);
    expect(s.hist.every).toBe(HISTORY_EVERY);
    s.tick = 2 * HISTORY_EVERY - 1;
    stepMut(s, map);
    expect(s.hist.rows).toHaveLength(HISTORY_CAP / 2 + 1);
    expect(s.hist.every).toBe(2 * HISTORY_EVERY);
  });

  it('does not ask the opponents to decide on the tick that ends the match', () => {
    const map = row();
    const s = stateFor(map);
    s.level[0] = 1;
    addUnit(s, { f: 1, a: 1, b: 0, d: 199 });
    s.owner[1] = 1;
    let calls = 0;
    stepMut(s, map, () => calls++);
    expect(s.result).toBe('lost');
    expect(calls).toBe(0);
    expect(s.tick).toBe(1);
    const running = stateFor(map);
    stepMut(running, map, () => calls++);
    expect(calls).toBe(1);
  });

  it('simulate stops reporting events once the match is over', () => {
    const won = createGame(2, { map: 0 });
    won.owner = won.owner.map((o) => (o > 0 ? -1 : o));
    won.result = 'won';
    let calls = 0;
    expect(simulate(won, 20, () => calls++)).toEqual(won);
    expect(calls).toBe(0);
    simulate(createGame(2, { map: 0 }), 20, () => calls++);
    expect(calls).toBe(20);
  });
});

describe('rules in detail: validation of saves', () => {
  const base = (): NcState & Record<string, unknown> => {
    const s = createGame(21);
    const start = s.owner.indexOf(0);
    s.out[start] = [mapOf(s).adjacent[start]![0]!];
    return clone(simulate(s, 60)) as NcState & Record<string, unknown>;
  };

  it('accepts the unmodified base state', () => {
    expect(isValidState(base())).toBe(true);
  });

  it('never throws, even when reading a field throws', () => {
    const s = base();
    Object.defineProperty(s, 'seed', {
      enumerable: true,
      get() {
        throw new Error('broken getter');
      }
    });
    expect(isValidState(s)).toBe(false);
  });

  it('rejects map indices beyond the set and an introduction map in another layout', () => {
    const beyond = clone(createGame(3, { map: MAPS_PER_SET }));
    expect(beyond.map).toBe(MAPS_PER_SET);
    expect(isValidState(beyond)).toBe(false);
    const intro = clone(createGame(3, { map: INTRO_MAP }));
    expect(isValidState(intro)).toBe(true);
    expect(isValidState({ ...intro, layout: 1 })).toBe(false);
  });

  it('rejects malformed paths', () => {
    const s = base();
    const n = s.owner.length;
    const v = s.owner.indexOf(0);
    const neighbour = mapOf(s).adjacent[v]![0]!;
    const cases: ((x: NcState & Record<string, unknown>) => void)[] = [
      (x) => (x.out = [...x.out, []]),
      (x) => (x.out[v] = [String(neighbour)] as unknown as number[]),
      (x) => (x.out[v] = [n]),
      (x) => (x.out[v] = [neighbour + 0.5])
    ];
    cases.forEach((change, i) => {
      const x = clone(s);
      x.out[v] = [];
      expect(isValidState(x), `control #${i}`).toBe(true);
      change(x);
      expect(isValidState(x), `case #${i}`).toBe(false);
    });
  });

  it('checks the centre record against the map', () => {
    const withCentre = clone(createGame(5, { map: 0 }));
    expect(mapOf(withCentre).center).toBeGreaterThan(0);
    withCentre.tick = 10;
    withCentre.hist.rows = [];
    expect(isValidState({ ...withCentre, centre: [5, 1] })).toBe(true);
    expect(isValidState({ ...withCentre, centre: [5, 2] })).toBe(false);
    expect(isValidState({ ...withCentre, centre: [5, 1, 0] })).toBe(false);
    expect(isValidState({ ...withCentre, centre: '' })).toBe(false);
    const without = clone(createGame(5, { map: 1 }));
    expect(mapOf(without).center).toBe(-1);
    without.tick = 10;
    expect(isValidState(without)).toBe(true);
    expect(isValidState({ ...without, centre: [5, 1] })).toBe(false);
  });

  it('accepts exactly MAX_UNITS units in flight', () => {
    const s = clone(createGame(21));
    const v = s.owner.indexOf(0);
    const w = mapOf(s).adjacent[v]![0]!;
    const fill = (count: number) => {
      const x = clone(s);
      x.units = Array.from({ length: count }, () => ({ f: 0, k: 0 as const, a: v, b: w, d: 0, hp: 1, h: 0 }));
      x.stats.produced = count;
      return x;
    };
    expect(isValidState(fill(MAX_UNITS))).toBe(true);
    expect(isValidState(fill(MAX_UNITS + 1))).toBe(false);
    expect(isValidState({ ...s, units: '' })).toBe(false);
  });

  it('rejects inconsistent histories', () => {
    const s = clone(createGame(21));
    s.tick = 80;
    const ok = (hist: unknown) => isValidState({ ...s, hist });
    expect(ok({ start: 30, every: HISTORY_EVERY, rows: [[1, 1], [1, 1]] })).toBe(true);
    expect(ok({ start: 30, every: HISTORY_EVERY, rows: [[1, 1], [1, 1], [1, 1]] })).toBe(false);
    expect(ok({ start: 80, every: HISTORY_EVERY, rows: [] })).toBe(true);
    expect(ok({ start: 81, every: HISTORY_EVERY, rows: [] })).toBe(false);
    expect(ok({ start: 30, every: HISTORY_EVERY, rows: '' })).toBe(false);
    const n = s.owner.length;
    expect(ok({ start: 30, every: HISTORY_EVERY, rows: [[n, 0]] })).toBe(true);
    expect(ok({ start: 30, every: HISTORY_EVERY, rows: [[n, 1]] })).toBe(false);
    const long = clone(s);
    long.tick = HISTORY_EVERY * (HISTORY_CAP + 1);
    const rows = (count: number) => Array.from({ length: count }, () => [1, 1]);
    expect(isValidState({ ...long, hist: { start: 0, every: HISTORY_EVERY, rows: rows(HISTORY_CAP) } })).toBe(true);
    expect(isValidState({ ...long, hist: { start: 0, every: HISTORY_EVERY, rows: rows(HISTORY_CAP + 1) } })).toBe(false);
  });

  it('migrates only string difficulties from version 1', () => {
    const played = simulate(createGame(9, { difficulty: 'beginner', opponents: 1, map: 3, layout: 1 }), 10);
    const { opponents: _o, layout: _l, half: _h, hist: _hi, centre: _c, ...rest } = clone(played);
    expect(V1_MAPPING.easy).toEqual(['beginner', 1]);
    expect(migrateState({ ...rest, difficulty: 'easy' }, 1)).toBeDefined();
    expect(migrateState({ ...rest, difficulty: ['easy'] }, 1)).toBeUndefined();
  });
});
