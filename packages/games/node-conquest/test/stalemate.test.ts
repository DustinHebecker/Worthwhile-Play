import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { decide, focusCommands, focusTarget, FOCUS_CHOICES, FOCUS_ROTATION, PROFILES, type AiProfile } from '../src/ai';
import {
  cloneState,
  createGame,
  isStandoff,
  isValidState,
  migrateState,
  quietTicks,
  SHOT_INTERVAL,
  STANDOFF_TICKS,
  stepMut,
  toggleMut
} from '../src/rules';
import { addUnit, makeMap, quiet, stateFor } from './fixtures';
import { playMatch, quantile, STALL_TICKS, type MatchResult, type Side } from './harness';

/*
 * Standoffs ("stalemates"): matches where no node changes owner for minutes. Measured with the
 * headless harness (seeded, deterministic), fixed by opponents that concentrate their front on one
 * target after a quiet stretch, plus defence platforms that fire every 9 ticks instead of every 6
 * (a single stream into a full platform could never get through before).
 */

describe('standoffs: the last change of ownership', () => {
  it('records the tick after which a node changed owner; quiet ticks count from there', () => {
    const map = makeMap(
      [
        { x: 100, y: 100, owner: 0, level: 10 },
        { x: 300, y: 100, level: 1 },
        { x: 500, y: 100, owner: 1, level: 10 }
      ],
      [
        [0, 1],
        [1, 2]
      ]
    );
    const s = stateFor(map);
    s.tick = 40;
    addUnit(s, { f: 0, a: 0, b: 1, d: 199 });
    stepMut(s, map);
    expect(s.owner[1]).toBe(0);
    expect(s.moved).toBe(41);
    expect(s.tick).toBe(41);
    expect(quietTicks(s)).toBe(0);
    for (let i = 0; i < 9; i++) stepMut(s, map);
    expect(quietTicks(s)).toBe(9);
  });

  it('names a standoff only while playing and from STANDOFF_TICKS quiet ticks on', () => {
    expect(STANDOFF_TICKS).toBe(3000);
    const s = createGame(3);
    expect(isStandoff({ ...s, tick: 2999, moved: 0 })).toBe(false);
    expect(isStandoff({ ...s, tick: 3000, moved: 0 })).toBe(true);
    expect(isStandoff({ ...s, tick: 3500, moved: 501 })).toBe(false);
    expect(isStandoff({ ...s, tick: 3500, moved: 500 })).toBe(true);
    expect(isStandoff({ ...s, tick: 9000, moved: 0, result: 'won' })).toBe(false);
  });

  it('validates the field: an integer from 0 to the current tick', () => {
    const s = createGame(5);
    s.tick = 100;
    expect(isValidState({ ...s, moved: 0 })).toBe(true);
    expect(isValidState({ ...s, moved: 100 })).toBe(true);
    expect(isValidState({ ...s, moved: 101 })).toBe(false);
    expect(isValidState({ ...s, moved: -1 })).toBe(false);
    expect(isValidState({ ...s, moved: 1.5 })).toBe(false);
    const { moved: _m, ...old } = s;
    expect(isValidState(old)).toBe(false);
  });

  it('migrates saves of state version 2 with moved = 0 (a resumed standoff is recognised at once)', () => {
    const s = createGame(6);
    s.tick = 4000;
    s.hist.rows = [s.hist.rows[0]!];
    const { moved: _m, ...old } = cloneState(s);
    expect(migrateState(old, 2)).toEqual({ ...s, moved: 0 });
    expect(isStandoff(migrateState(old, 2)!)).toBe(true);
    expect(migrateState({ ...old, tick: -1 }, 2)).toBeUndefined();
    expect(migrateState(null, 2)).toBeUndefined();
    expect(migrateState(old, 4)).toBeUndefined();
  });

  it('defence platforms fire every 9 ticks', () => {
    expect(SHOT_INTERVAL).toBe(9);
  });
});

/** Player (0) front: 0 and 1 next to the opponent's nodes 3, 4 and 5; 2 is the player's interior. */
const front = () =>
  makeMap(
    [
      { x: 200, y: 200, owner: 0, level: 30 },
      { x: 200, y: 400, owner: 0, level: 30 },
      { x: 50, y: 300, owner: 0, level: 30 },
      { x: 400, y: 100, owner: 1, level: 30 },
      { x: 400, y: 300, owner: 1, level: 12 },
      { x: 400, y: 500, owner: 1, level: 30, type: 'station' },
      { x: 600, y: 300, owner: 1, level: 30 }
    ],
    [
      [0, 1],
      [0, 2],
      [1, 2],
      [0, 3],
      [0, 4],
      [1, 4],
      [1, 5],
      [3, 6],
      [4, 6],
      [5, 6]
    ]
  );

describe('standoffs: choosing the focus target', () => {
  it('ranks by level + 10 per hostile helper + 15 per platform − 20 per own sending neighbour', () => {
    const map = front();
    const s = stateFor(map);
    // 4: 12 + 10 (helper 6) − 40 = −18; 3: 30 + 10 − 20 = 20; 5: 30 + 10 + 15 − 20 = 35.
    expect([0, 1, 2, 3].map((r) => focusTarget(s, map, 0, r))).toEqual([4, 3, 5, 4]);
    expect(FOCUS_CHOICES).toBe(3);
    // The opponent's view: 0 and 1 both cost 30 + 20 (two helpers) − 40; the lower index first.
    expect([0, 1].map((r) => focusTarget(s, map, 1, r))).toEqual([0, 1]);
    // Neutral targets have no helpers or platforms.
    const neutral = cloneState(s);
    neutral.owner[5] = -1;
    expect(focusTarget(neutral, map, 0, 1)).toBe(5);
  });

  it('cycles only through the cheapest targets, ties broken by the lower index', () => {
    const map = makeMap(
      [
        { x: 300, y: 300, owner: 0, level: 30 },
        { x: 300, y: 100, owner: 1, level: 5 },
        { x: 500, y: 300, owner: 1, level: 5 },
        { x: 300, y: 500, owner: 1, level: 5 },
        { x: 100, y: 300, owner: 1, level: 5 }
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4]
      ]
    );
    const s = stateFor(map);
    expect([0, 1, 2, 3, 4].map((r) => focusTarget(s, map, 0, r))).toEqual([1, 2, 3, 1, 2]);
  });

  it('finds nothing without a sending node next to a non-own node (platforms send only at level 30)', () => {
    const map = makeMap(
      [
        { x: 100, y: 100, owner: 0, level: 29, type: 'station' },
        { x: 300, y: 100, owner: 1, level: 5 }
      ],
      [[0, 1]]
    );
    const s = stateFor(map);
    expect(focusTarget(s, map, 0)).toBe(-1);
    s.level[0] = 30;
    expect(focusTarget(s, map, 0)).toBe(1);
  });
});

describe('standoffs: focus commands', () => {
  it('turns the neighbours of the target into single streams towards it and feeds them from the interior', () => {
    const map = front();
    const s = stateFor(map);
    s.out[0] = [3, 1];
    s.out[1] = [5];
    const cmds = focusCommands(s, map, 0, 4);
    expect(cmds).toEqual([
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 5 },
      { from: 1, to: 4 },
      { from: 2, to: 0 },
      { from: 2, to: 1 }
    ]);
    for (const c of cmds) expect(['on', 'off']).toContain(toggleMut(s, map, 0, c.from, c.to).outcome);
    expect(s.out).toEqual([[1, 4], [4], [0, 1], [], [], [], []]);
  });

  it('frees a slot by stopping the newest path into an own node when the limit is reached', () => {
    const map = front();
    const s = stateFor(map);
    s.level[1] = 5;
    s.out[1] = [2];
    expect(focusCommands(s, map, 0, 4).filter((c) => c.from === 1)).toEqual([
      { from: 1, to: 2 },
      { from: 1, to: 4 }
    ]);
  });

  it('keeps an existing stream to the target and never feeds against a reverse path', () => {
    const map = front();
    const s = stateFor(map);
    s.out[0] = [4];
    s.out[1] = [4];
    s.out[0]!.push(2);
    expect(focusCommands(s, map, 0, 4)).toEqual([{ from: 2, to: 1 }]);
  });
});

describe('standoffs: decisions', () => {
  const calm: AiProfile = { ...quiet, actions: 2, aware: true, focus: 600 };
  const stalled = () => {
    const map = front();
    const s = stateFor(map);
    s.out[0] = [3];
    s.out[1] = [5];
    // Quiet for 1800 ticks: 1200 beyond `focus`, so rank 2 + 1 (faction 0 in a duel) = 3 → the cheapest target, 4.
    s.tick = 1900;
    s.moved = 100;
    return { map, s };
  };

  it('after `focus` quiet ticks the faction concentrates (within its action budget)', () => {
    const { map, s } = stalled();
    expect(decide(s, map, 0, calm, createRng(1))).toEqual([
      { from: 0, to: 3 },
      { from: 0, to: 4 }
    ]);
    expect(decide(s, map, 0, { ...calm, actions: 4 }, createRng(1))).toEqual([
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 1, to: 5 },
      { from: 1, to: 4 }
    ]);
  });

  it('decides as before when the quiet stretch is shorter or focus is off', () => {
    const { map, s } = stalled();
    const before = decide(s, map, 0, { ...calm, focus: 0 }, createRng(1));
    expect(decide(s, map, 0, { ...calm, focus: 1801 }, createRng(1))).toEqual(before);
    expect(decide(s, map, 0, { ...calm, focus: 1800 }, createRng(1))).not.toEqual(before);
  });

  it('keeps defence while focusing, and drops expansion that would open another front', () => {
    const { map, s } = stalled();
    s.level[1] = 3;
    s.out[1] = [];
    for (let i = 0; i < 4; i++) addUnit(s, { f: 1, a: 5, b: 1, d: 10 * i });
    const cmds = decide(s, map, 0, { ...calm, defend: true, actions: 6 }, createRng(1));
    expect(cmds).toContainEqual({ from: 2, to: 1 });
    expect(cmds.filter((c) => c.to === 3 || c.to === 5)).toEqual([{ from: 0, to: 3 }]);
  });

  it('moves on to the next target every FOCUS_ROTATION quiet ticks; rivals start one rank apart', () => {
    expect(FOCUS_ROTATION).toBe(600);
    const { map, s } = stalled();
    const wide = { ...calm, actions: 20 };
    for (const tick of [700, 1299, 1300, 1900, 2500, 3100]) {
      s.tick = tick;
      const rank = Math.floor((tick - 100 - 600) / FOCUS_ROTATION) + 1;
      expect(decide(s, map, 0, wide, createRng(1))).toEqual(focusCommands(s, map, 0, focusTarget(s, map, 0, rank)));
    }
    s.tick = 700;
    expect(decide(s, map, 1, wide, createRng(1))).toEqual(focusCommands(s, map, 1, focusTarget(s, map, 1, 0)));
  });

  it('every level concentrates after a quiet stretch; stronger levels sooner', () => {
    const f = (d: keyof typeof PROFILES) => PROFILES[d].focus;
    expect([f('beginner'), f('advanced'), f('strong'), f('master')]).toEqual([1200, 900, 600, 450]);
  });
});

/* ---------- Measurements (seeded, deterministic) ---------- */

/** One match per map and seed offset; `per` matches per map. */
function series(player: Side, opponent: keyof typeof PROFILES, per: number, cap = 9000, override?: Partial<AiProfile>): MatchResult[] {
  const results: MatchResult[] = [];
  for (let i = 0; i < 7 * per; i++) results.push(playMatch(i * 101 + 108, player, opponent, cap, i % 7, override));
  return results;
}
const stalls = (rs: MatchResult[]) => rs.filter((r) => r.stalled).length;
const wins = (rs: MatchResult[], side: number) => rs.filter((r) => r.winner === side).length;

describe('standoffs: measured with a human-like proxy player and bot matches', () => {
  it('human-like play against advanced and strong opponents ends without long standoffs', () => {
    const advanced = series('human', 'advanced', 2);
    const strong = series('human', 'strong', 2);
    expect(STALL_TICKS).toBe(3000);
    expect(stalls(advanced) + stalls(strong)).toBeLessThanOrEqual(2);
    const lengths = [...advanced, ...strong].map((r) => r.ticks);
    expect(quantile(lengths, 0.5)).toBeLessThan(3000);
    // The proxy wins some and loses some: neither level is a pushover or a wall.
    expect(wins(advanced, 0)).toBeGreaterThanOrEqual(3);
    expect(wins(strong, 1)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('concentrating opponents stall less than the same opponents without focus', () => {
    // 28 matches each against the strong level (measured: 0 standoffs with focus, 4 without).
    const withFocus = series('human', 'strong', 4);
    const without = series('human', 'strong', 4, 9000, { focus: 0 });
    expect(stalls(withFocus)).toBeLessThanOrEqual(1);
    expect(stalls(without)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('stronger levels still beat weaker ones', () => {
    const ab = series('advanced', 'beginner', 2);
    expect(wins(ab, 0)).toBeGreaterThanOrEqual(wins(ab, 1) + 6);
    const ms = series('master', 'strong', 1);
    expect(wins(ms, 0)).toBeGreaterThan(wins(ms, 1));
  }, 60_000);
});
