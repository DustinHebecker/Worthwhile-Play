import { describe, expect, it } from 'vitest';
import { planRound } from '../src/ai';
import {
  applyPlan,
  conscriptsOf,
  EXTERNAL_WAVES,
  externalWave,
  isValidState,
  lastRound,
  lockRound,
  MAX_CONSCRIPTS,
  MAX_PRESSURE,
  MAX_ROUNDS,
  MAX_WAVE,
  newGame,
  resolveBattle,
  ROUNDS,
  START_CORE,
  stepBattle,
  type HoldState,
  type Planner
} from '../src/rules';

/** Endless games, conscripts and playing alone (owner 2026-11-01; design § 18). */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const idle: Planner = () => [];
const atRound = (s: HoldState, round: number): HoldState => ({ ...s, round, log: Array.from({ length: round + 1 }, () => ({ player: [], ai: [] })) });

describe('length', () => {
  it('new games are endless unless the short game is chosen; old saves count as short', () => {
    expect(newGame(1, 'normal').length).toBe('endless');
    expect(newGame(1, 'normal', 'duel', { length: 'rounds' }).length).toBe('rounds');
    expect(lastRound({ length: 'endless' })).toBe(MAX_ROUNDS - 1);
    expect(lastRound({ length: 'rounds' })).toBe(ROUNDS - 1);
    expect(lastRound({})).toBe(ROUNDS - 1);
    const old = clone(newGame(1, 'normal')) as Partial<HoldState>;
    delete old.length;
    expect(isValidState(old)).toBe(true);
    expect(isValidState({ ...clone(newGame(1, 'normal')), length: 'forever' })).toBe(false);
  });

  it('an endless game goes on past round ten while both cores stand', () => {
    let s = atRound(newGame(1, 'normal'), ROUNDS - 1);
    s = { ...s, roundStart: { ...s.roundStart, sides: s.sides } };
    const after = resolveBattle(lockRound(s, idle)).state;
    expect(after.phase).toBe('plan');
    expect(after.round).toBe(ROUNDS);
    expect(isValidState(clone(after))).toBe(true);
  });
});

describe('conscripts (endless duel)', () => {
  it('grow with the rounds, with every fourth a Brute, up to a cap; none in the short game or outside force', () => {
    const s = newGame(1, 'normal');
    expect(conscriptsOf({ ...s, round: 0 })).toEqual([]);
    expect(conscriptsOf({ ...s, round: 4 })).toEqual(['walker', 'walker']);
    expect(conscriptsOf({ ...s, round: 9 })).toHaveLength(4);
    expect(conscriptsOf({ ...s, round: 9 })[3]).toBe('brute');
    expect(conscriptsOf({ ...s, round: 12 })).toHaveLength(6 + 1);
    expect(conscriptsOf({ ...s, round: 900 })).toHaveLength(MAX_CONSCRIPTS);
    expect(conscriptsOf({ ...s, round: 9, length: 'rounds' })).toEqual([]);
    expect(conscriptsOf({ ...newGame(1, 'normal', 'crossing'), round: 9 })).toEqual([]);
  });

  it('join both waves at the lock, after what was bought; saves keep them valid', () => {
    let s = atRound(newGame(1, 'normal'), 6);
    s = { ...s, roundStart: { ...s.roundStart } };
    s = applyPlan(s, 0, { t: 'buy', kind: 'runner' });
    const locked = lockRound(s, idle);
    expect(locked.sides[0].wave).toEqual(['runner', ...conscriptsOf(s)]);
    expect(locked.sides[1].wave).toEqual(conscriptsOf(s));
    const mid = stepBattle(locked, 30).state;
    expect(isValidState(clone(mid))).toBe(true);
    // Without its conscripts the battle cannot have started this way.
    const bad = clone(mid);
    bad.sides[1].wave = [];
    expect(isValidState(bad)).toBe(false);
  });
});

describe('the outside force in an endless game', () => {
  it('keeps growing after the table, within the save bound', () => {
    const s = newGame(1, 'normal', 'crossing');
    const sizes = [EXTERNAL_WAVES.length, EXTERNAL_WAVES.length + 2, EXTERNAL_WAVES.length + 6].map((round) => externalWave({ ...s, round }).length);
    expect(sizes[1]).toBeGreaterThan(sizes[0]!);
    expect(sizes[2]).toBeGreaterThan(sizes[1]!);
    expect(externalWave({ ...s, round: EXTERNAL_WAVES.length + 3 })).toContain('crawler');
    expect(externalWave({ ...s, round: 500, pressure: 99 }).length).toBeLessThanOrEqual(MAX_WAVE);
    expect(externalWave({ ...s, round: 500, pressure: 99 }).slice(-MAX_PRESSURE)).toEqual(Array(MAX_PRESSURE).fill('walker'));
  });

  it('each round’s pressure is what got through in the round before only (review M2)', () => {
    const through = (t: HoldState) => t.sides[0].stats.leaked + t.sides[1].stats.leaked;
    let s = newGame(1, 'normal', 'crossing');
    const ai: Planner = (v) => planRound(v, 1, 'normal');
    let checked = 0;
    for (let round = 0; round < 4 && s.phase === 'plan'; round++) {
      const before = through(s);
      for (const cmd of planRound(s, 0, 'easy')) s = applyPlan(s, 0, cmd);
      s = resolveBattle(lockRound(s, ai)).state;
      if (s.phase !== 'plan') break;
      expect(s.pressure, `round ${round + 1}`).toBe(through(s) - before);
      if (round > 0 && before > 0) checked++;
    }
    // At least one later round where the total so far differs from that round's own count.
    expect(checked).toBeGreaterThan(0);
  }, 30_000);

  it('pressure is 0 before the first battle and at most both waves after it (review L1)', () => {
    const s = newGame(1, 'normal', 'crossing');
    expect(isValidState({ ...clone(s), pressure: 1 })).toBe(false);
    const later = { ...clone(atRound(s, 3)) };
    later.roundStart = clone(s.roundStart);
    expect(isValidState({ ...later, pressure: 2 * MAX_WAVE })).toBe(true);
    expect(isValidState({ ...later, pressure: 2 * MAX_WAVE + 1 })).toBe(false);
  });
});

describe('alone against the outside force', () => {
  const solo = (length: 'endless' | 'rounds' = 'endless') => newGame(1, 'normal', 'crossing', { solo: true, length });

  it('only the half that comes for you sets off; nobody plans for the other side', () => {
    let asked = false;
    const locked = lockRound(solo(), () => {
      asked = true;
      return [];
    });
    expect(asked).toBe(false);
    expect(locked.sides[0].wave).toEqual([]);
    expect(locked.sides[1].wave).toEqual(externalWave(locked));
    expect(isValidState(clone(stepBattle(locked, 40).state))).toBe(true);
    expect(newGame(1, 'normal', 'duel', { solo: true }).solo).toBeUndefined();
  });

  it('endless: ends when your core falls (lost); short: you win by holding ten rounds', () => {
    let s = solo();
    while (s.phase === 'plan') s = resolveBattle(lockRound(s, idle)).state;
    expect(s.phase).toBe('lost');
    expect(s.sides[0].core).toBe(0);
    expect(s.sides[1].core).toBe(START_CORE);
    expect(isValidState(clone(s))).toBe(true);
    let short = solo('rounds');
    while (short.phase === 'plan') {
      for (const cmd of planRound(short, 0, 'hard')) short = applyPlan(short, 0, cmd);
      short = resolveBattle(lockRound(short, idle)).state;
    }
    expect(['won', 'lost']).toContain(short.phase);
    expect(isValidState(clone(short))).toBe(true);
  }, 60_000);

  it('rejects solo saves that cannot happen', () => {
    const s = solo();
    expect(isValidState({ ...clone(s), solo: false })).toBe(false);
    expect(isValidState({ ...clone(newGame(1, 'normal')), solo: true })).toBe(false);
    const hit = clone(s);
    hit.sides[1].core = START_CORE - 1;
    expect(isValidState(hit)).toBe(false);
    expect(isValidState({ ...clone(s), phase: 'draw' })).toBe(false);
    expect(isValidState({ ...clone(s), phase: 'won' })).toBe(false);
    const locked = lockRound(s, idle);
    const tampered = clone(stepBattle(locked, 5).state);
    tampered.sides[0].wave = externalWave(locked);
    expect(isValidState(tampered)).toBe(false);
  });
});

describe('isValidState never throws (review L9)', () => {
  it('sparse arrays and odd objects are just invalid', () => {
    const s = clone(newGame(1, 'normal'));
    const sparse = { ...s, sides: [s.sides[0]] as unknown[] };
    (sparse.sides as unknown[]).length = 2;
    expect(isValidState(sparse)).toBe(false);
    const holes = clone(s);
    (holes.world.entities as unknown[]).length = 3;
    expect(() => isValidState(holes)).not.toThrow();
    expect(isValidState(holes)).toBe(false);
    const trap = { ...s, get sides(): never {
      throw new Error('boom');
    } };
    expect(isValidState(trap)).toBe(false);
  });
});
