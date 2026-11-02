import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ENEMIES } from '@wp/td-core';
import { expectedWave, planRound } from '../src/ai';
import { CROSSING, DUEL, mapForMode } from '../src/maps';
import {
  applyPlan,
  checkPlan,
  EXTERNAL_BOUNTY_PERCENT,
  EXTERNAL_WAVES,
  externalWave,
  isValidState,
  lockRound,
  BASE_CAPACITY,
  MAX_LEVY,
  MAX_PRESSURE,
  MAX_WAVE,
  MAX_WORKSHOPS,
  newGame,
  WORKSHOP_CAPACITY,
  resolveBattle,
  ROUNDS,
  stepBattle,
  type HoldState,
  type Planner
} from '../src/rules';

/** Hold the Line, mode External Small (docs/design/tower-defense.md § 17). */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const idle: Planner = () => [];
const fresh = (): HoldState => newGame(1, 'normal', CROSSING.id);
/** The same state at a later round (log long enough), for wave-table checks. */
const atRound = (s: HoldState, round: number, pressure = 0): HoldState => ({ ...s, round, pressure, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })) });

describe('External Small: setup', () => {
  it('each mode has its own map; the map decides the mode', () => {
    expect(mapForMode('vs-small')).toBe(DUEL);
    expect(mapForMode('external-small')).toBe(CROSSING);
    expect(newGame(1, 'easy').mode).toBe('vs-small');
    expect(newGame(1, 'easy').pressure).toBeUndefined();
    const s = fresh();
    expect(s.mode).toBe('external-small');
    expect(s.pressure).toBe(0);
    expect(isValidState(clone(s))).toBe(true);
  });

  it('the two halves of the force start on their own entry cells in the middle row', () => {
    const [a, b] = CROSSING.lanes.map((l) => l.points[0]!);
    expect(a![1]).toBe(CROSSING.split);
    expect(b![1]).toBe(CROSSING.split);
    expect(a).not.toEqual(b);
  });

  it('nobody buys units or workshops; towers and extractors work as in VS Small', () => {
    const s = fresh();
    for (const side of [0, 1]) {
      expect(checkPlan(s, side, { t: 'buy', kind: 'walker' })).toBe('mode');
      expect(checkPlan(s, side, { t: 'unbuy', index: 0 })).toBe('mode');
      expect(checkPlan(s, side, { t: 'workshop' })).toBe('mode');
    }
    expect(checkPlan(s, 0, { t: 'place', kind: 'gun', x: 2, y: 11 })).toBeNull();
    expect(checkPlan(s, 0, { t: 'extractor', x: 0, y: 16 })).toBeNull();
  });
});

describe('External Small: the outside force', () => {
  it('follows the round table, plus one Walker per unit that got through last round (capped)', () => {
    const s = fresh();
    for (let round = 0; round < ROUNDS; round++) {
      const base = EXTERNAL_WAVES[round]!.reduce((n, [, c]) => n + c, 0);
      expect(externalWave(atRound(s, round))).toHaveLength(base);
      expect(externalWave(atRound(s, round, 3))).toHaveLength(base + 3);
      expect(externalWave(atRound(s, round, 99))).toHaveLength(base + MAX_PRESSURE);
      expect(externalWave(atRound(s, round, 3)).slice(base)).toEqual(['walker', 'walker', 'walker']);
    }
    expect(externalWave(newGame(1, 'easy'))).toEqual([]);
  });

  it('at the lock both sides face exactly this round’s force', () => {
    const locked = lockRound(fresh(), idle);
    expect(locked.sides[0].wave).toEqual(externalWave(fresh()));
    expect(locked.sides[1].wave).toEqual(locked.sides[0].wave);
    expect(locked.run!.pending).toHaveLength(2 * locked.sides[0].wave.length);
  });

  it('what gets through on either side strengthens the next round; the defender earns half bounties', () => {
    // No defence: the whole first force gets through on both sides.
    const end = resolveBattle(lockRound(fresh(), idle)).state;
    const n = externalWave(fresh()).length;
    expect(end.phase).toBe('plan');
    expect(end.pressure).toBe(2 * n);
    expect(externalWave(end)).toHaveLength(EXTERNAL_WAVES[1]!.reduce((k, [, c]) => k + c, 0) + Math.min(MAX_PRESSURE, 2 * n));
    // With a gun beside the road, kills pay half the bounty.
    let s = applyPlan(fresh(), 0, { t: 'place', kind: 'gun', x: 3, y: 9 });
    const before = s.sides[0].credits;
    const battle = resolveBattle(lockRound(s, idle));
    s = battle.state;
    const kills = s.sides[0].stats.killed;
    expect(kills).toBeGreaterThan(0);
    const bounty = Math.floor((ENEMIES.walker.bounty * EXTERNAL_BOUNTY_PERCENT) / 100);
    expect(s.sides[0].credits - before).toBe(kills * bounty + 100 + Math.floor((before * 10) / 100));
  });

  it('the cores fall the same way when both sides do the same', () => {
    const end = resolveBattle(lockRound(fresh(), idle)).state;
    expect(end.sides[0].core).toBe(end.sides[1].core);
    expect(end.sides[0].core).toBeLessThan(30);
  });
});

describe('External Small: saves', () => {
  it('a battle saved at any tick is valid and continues exactly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 400 }), (at) => {
        const start = lockRound(applyPlan(fresh(), 0, { t: 'place', kind: 'gun', x: 3, y: 9 }), (v) => planRound(v));
        const mid = stepBattle(start, at).state;
        expect(isValidState(clone(mid))).toBe(true);
        expect(resolveBattle(clone(mid)).state).toEqual(resolveBattle(mid).state);
      }),
      { numRuns: 6 }
    );
  }, 60_000);

  it('rejects tampered External Small saves', () => {
    const plan = fresh();
    const battle = stepBattle(lockRound(fresh(), idle), 5).state;
    const bad: [HoldState, (t: HoldState) => void][] = [
      [plan, (t) => delete t.pressure],
      [plan, (t) => (t.pressure = -1)],
      [plan, (t) => (t.mode = 'vs-small')],
      [plan, (t) => (t.sides[0].wave = ['walker'])],
      [plan, (t) => (t.sides[0].workshops = 1)],
      [battle, (t) => (t.sides[0].wave = t.sides[0].wave.slice(1))],
      [battle, (t) => (t.sides[1].wave = [...t.sides[1].wave, 'crawler'])],
      [battle, (t) => (t.pressure = 5)]
    ];
    for (const [base, tamper] of bad) {
      const t = clone(base);
      tamper(t);
      expect(isValidState(t)).toBe(false);
    }
    // VS Small never has a pressure.
    expect(isValidState({ ...clone(newGame(1, 'easy')), pressure: 0 })).toBe(false);
  });
});

describe('wave bounds in saves (review of PR #104, L2)', () => {
  const withLast = (base: HoldState, side: 0 | 1, wave: string[]): HoldState => {
    const t = clone(base);
    t.sides[side].lastWave = wave as HoldState['sides'][0]['lastWave'];
    t.roundStart.sides[side].lastWave = wave as HoldState['sides'][0]['lastWave'];
    return t;
  };

  it('External Small: last round\'s force is real kinds, at most MAX_WAVE units', () => {
    const s = atRound(fresh(), 2);
    s.roundStart = clone(fresh().roundStart);
    for (const side of [0, 1] as const) {
      expect(isValidState(withLast(s, side, Array(MAX_WAVE).fill('brute'))), `side ${side}`).toBe(true);
      expect(isValidState(withLast(s, side, Array(MAX_WAVE + 1).fill('brute'))), `side ${side}`).toBe(false);
      expect(isValidState(withLast(s, side, ['brute', 'dragon'])), `side ${side}`).toBe(false);
      // The force may hold kinds that are not for sale (it is not bought).
      expect(isValidState(withLast(s, side, ['crawler', 'mender'])), `side ${side}`).toBe(true);
    }
  });

  it('Duel: a wave is bought kinds plus the levy, at most full capacity plus the full levy', () => {
    const most = BASE_CAPACITY + MAX_WORKSHOPS * WORKSHOP_CAPACITY + MAX_LEVY;
    const s = newGame(1, 'normal');
    expect(isValidState(withLast(s, 0, Array(most).fill('walker')))).toBe(true);
    expect(isValidState(withLast(s, 0, Array(most + 1).fill('walker')))).toBe(false);
    expect(isValidState(withLast(s, 0, ['walker', 'dragon']))).toBe(false);
    // Kinds that are not for sale cannot be in a bought wave, one bad unit is enough.
    const locked = lockRound(applyPlan(s, 0, { t: 'buy', kind: 'walker' }), idle);
    const bad = clone(locked);
    bad.sides[0].wave = ['walker', 'crawler'];
    expect(isValidState(bad)).toBe(false);
    const ok = clone(locked);
    expect(isValidState(ok)).toBe(true);
  });
});

describe('External Small: the computer', () => {
  it('expects this round’s known force and never tries to buy', () => {
    const s = fresh();
    expect(expectedWave(s, 0)).toEqual(externalWave(s));
    expect(expectedWave(s, 1)).toEqual(externalWave(s));
    for (const level of ['easy', 'normal', 'hard'] as const) {
      const plan = planRound(s, 1, level);
      expect(plan.some((c) => c.t === 'buy' || c.t === 'workshop'), level).toBe(false);
      let t = s;
      for (const cmd of plan) {
        expect(checkPlan(t, 1, cmd), level).toBeNull();
        t = applyPlan(t, 1, cmd);
      }
    }
  });

  it('defends: with its plan, less of the first force gets through than without', () => {
    const none = resolveBattle(lockRound(fresh(), idle)).state;
    const ai = resolveBattle(lockRound(fresh(), (v) => planRound(v, 1, 'normal'))).state;
    expect(ai.sides[1].core).toBeGreaterThan(none.sides[1].core);
  });
});
