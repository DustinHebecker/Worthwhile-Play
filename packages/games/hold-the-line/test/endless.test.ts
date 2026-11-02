import { describe, expect, it } from 'vitest';
import { ENEMIES, type EnemyKind } from '@wp/td-core';
import { planRound } from '../src/ai';
import {
  applyPlan,
  EXTERNAL_WAVES,
  externalWave,
  isValidState,
  lastRound,
  levyOf,
  lockRound,
  MAX_CREDITS,
  MAX_LEVY,
  MAX_PRESSURE,
  MAX_ROUNDS,
  MAX_WAVE,
  newGame,
  resolveBattle,
  ROUNDS,
  START_CORE,
  START_CREDITS,
  stepBattle,
  wearOf,
  WEAR_FROM,
  type HoldState,
  type Planner
} from '../src/rules';

/** Endless games, the levy, the wear-down and playing alone (owner 2026-11-01; design § 18). */
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

const threatOf = (wave: readonly EnemyKind[]): number => wave.reduce((n, k) => n + ENEMIES[k].threat, 0);
const count = (wave: readonly EnemyKind[], kind: EnemyKind): number => wave.filter((k) => k === kind).length;

describe('the levy (endless duel)', () => {
  it('grows with the rounds, with every fourth a Brute, up to a cap; none in the short game or outside force', () => {
    const s = newGame(1, 'normal');
    expect(levyOf({ ...s, round: 0 })).toEqual([]);
    expect(levyOf({ ...s, round: 4 })).toEqual(['walker', 'walker']);
    expect(levyOf({ ...s, round: 9 })).toHaveLength(4);
    expect(levyOf({ ...s, round: 9 })[3]).toBe('brute');
    expect(levyOf({ ...s, round: 12 })).toHaveLength(6 + 1);
    expect(levyOf({ ...s, round: 33 })).toHaveLength(MAX_LEVY - 2);
    expect(levyOf({ ...s, round: 34 })).toHaveLength(MAX_LEVY);
    expect(levyOf({ ...s, round: -1 })).toEqual([]);
    expect(levyOf({ ...s, round: 9, length: 'rounds' })).toEqual([]);
    expect(levyOf({ ...newGame(1, 'normal', 'crossing'), round: 9 })).toEqual([]);
  });

  it('once full, it grows heavier every round: two more Walkers become Brutes (review of PR #107)', () => {
    const s = newGame(1, 'normal');
    expect(count(levyOf({ ...s, round: 34 }), 'brute')).toBe(MAX_LEVY / 4);
    for (let round = 35; round < MAX_ROUNDS; round++) {
      const [before, now] = [levyOf({ ...s, round: round - 1 }), levyOf({ ...s, round })];
      expect(now, `round ${round}`).toHaveLength(MAX_LEVY);
      expect(count(now, 'brute'), `round ${round}`).toBe(Math.min(MAX_LEVY, count(before, 'brute') + 2));
    }
    // The pattern of the first rounds stays (every fourth a Brute); converted Walkers come from the back.
    expect(levyOf({ ...s, round: 35 }).slice(0, 4)).toEqual(['walker', 'walker', 'walker', 'brute']);
    expect(levyOf({ ...s, round: 35 }).slice(-2)).toEqual(['brute', 'brute']);
  });

  it('join both waves at the lock, after what was bought; saves keep them valid', () => {
    let s = atRound(newGame(1, 'normal'), 6);
    s = { ...s, roundStart: { ...s.roundStart } };
    s = applyPlan(s, 0, { t: 'buy', kind: 'runner' });
    const locked = lockRound(s, idle);
    expect(locked.sides[0].wave).toEqual(['runner', ...levyOf(s)]);
    expect(locked.sides[1].wave).toEqual(levyOf(s));
    const mid = stepBattle(locked, 30).state;
    expect(isValidState(clone(mid))).toBe(true);
    // Without its levy the battle cannot have started this way.
    const bad = clone(mid);
    bad.sides[1].wave = [];
    expect(isValidState(bad)).toBe(false);
  });
});

describe('the outside force in an endless game', () => {
  it('gets stronger every round after the table, to the last round, within the save bound (review of PR #107)', () => {
    const s = newGame(1, 'normal', 'crossing');
    for (let round = EXTERNAL_WAVES.length; round < MAX_ROUNDS; round++) {
      const [before, now] = [externalWave({ ...s, round: round - 1 }), externalWave({ ...s, round })];
      expect(now.length, `round ${round}`).toBeLessThanOrEqual(MAX_WAVE - MAX_PRESSURE);
      expect(now.length, `round ${round}`).toBeGreaterThanOrEqual(before.length);
      // One more Siege crawler every round, and never a weaker force.
      expect(count(now, 'crawler'), `round ${round}`).toBe(count(before, 'crawler') + 1);
      expect(threatOf(now), `round ${round}`).toBeGreaterThan(threatOf(before));
    }
    // Past the size limit the lightest units give way first: by the last round the Gliders are gone, the Brutes are not.
    const last = externalWave({ ...s, round: MAX_ROUNDS - 1 });
    expect(last).toHaveLength(MAX_WAVE - MAX_PRESSURE);
    expect(count(last, 'glider')).toBe(0);
    expect(count(last, 'brute')).toBeGreaterThan(0);
    expect(count(last, 'crawler')).toBe(MAX_ROUNDS - EXTERNAL_WAVES.length);
    expect(externalWave({ ...s, round: MAX_ROUNDS - 1, pressure: 99 })).toHaveLength(MAX_WAVE);
    expect(externalWave({ ...s, round: MAX_ROUNDS - 1, pressure: 99 }).slice(-MAX_PRESSURE)).toEqual(Array(MAX_PRESSURE).fill('walker'));
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
    // The other side never builds, plans or earns (review of PR #107).
    const rich = clone(s);
    rich.sides[1].credits += 100;
    rich.roundStart.sides[1].credits += 100;
    expect(isValidState(rich)).toBe(false);
    const planned = clone(s);
    planned.log[0]!.ai.push({ t: 'workshop' });
    expect(isValidState(planned)).toBe(false);
    const towered = clone(s);
    towered.sides[1].towers.push({ id: 99, invested: 100, fresh: 100 });
    expect(isValidState(towered)).toBe(false);
    // Alone, only one wave can get through: the pressure bound is one wave.
    const later = clone(atRound(s, 3));
    expect(isValidState({ ...later, pressure: MAX_WAVE })).toBe(true);
    expect(isValidState({ ...later, pressure: MAX_WAVE + 1 })).toBe(false);
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

describe('the wear-down (endless)', () => {
  /** A round of `s` at `round` whose battle has nothing left to run: it ends on the next tick. */
  const emptyBattle = (s: HoldState, round: number): HoldState => {
    const at = atRound(s, round);
    const locked = lockRound({ ...at, roundStart: { ...at.roundStart, sides: at.sides } }, idle);
    return { ...locked, run: { ...locked.run!, pending: [] } };
  };

  it('starts at round WEAR_FROM + 1 and takes one more each round; none in the short game', () => {
    const s = newGame(1, 'normal');
    expect(wearOf({ ...s, round: WEAR_FROM - 1 })).toBe(0);
    expect(wearOf({ ...s, round: WEAR_FROM })).toBe(1);
    expect(wearOf({ ...s, round: WEAR_FROM + 3 })).toBe(4);
    expect(wearOf({ ...s, round: WEAR_FROM + 3, length: 'rounds' })).toBe(0);
    expect(wearOf({ round: 60 })).toBe(0);
  });

  it('wears down a full core within the round bound, so every endless game ends by round MAX_ROUNDS', () => {
    let total = 0;
    for (let round = WEAR_FROM; round < MAX_ROUNDS; round++) total += wearOf({ round, length: 'endless' });
    expect(total).toBeGreaterThanOrEqual(START_CORE);
    // One round fewer would not be enough: the bound is tight.
    expect(total - wearOf({ round: MAX_ROUNDS - 1, length: 'endless' })).toBeLessThan(START_CORE);
    expect(lastRound({ length: 'endless' })).toBe(MAX_ROUNDS - 1);
  });

  it('takes from every standing core at the end of the round; alone, only from yours', () => {
    for (const [mapId, options] of [['duel', {}], ['crossing', {}], ['crossing', { solo: true }]] as const) {
      const s = newGame(1, 'normal', mapId, options);
      expect(stepBattle(emptyBattle(s, WEAR_FROM - 1), 1).state.sides.map((x) => x.core), mapId).toEqual([START_CORE, START_CORE]);
      const after = stepBattle(emptyBattle(s, WEAR_FROM + 2), 1).state;
      expect(after.phase, mapId).toBe('plan');
      expect(after.sides[0].core, mapId).toBe(START_CORE - 3);
      expect(after.sides[1].core, mapId).toBe('solo' in options ? START_CORE : START_CORE - 3);
      expect(isValidState(clone(after)), mapId).toBe(true);
    }
  });

  it('a core worn down to nothing ends the game; equal cores make a draw', () => {
    const s = newGame(1, 'normal');
    const low = emptyBattle(s, WEAR_FROM + 4);
    low.sides[0].core = 5;
    low.sides[1].core = 6;
    const end = stepBattle(low, 1).state;
    expect(end.phase).toBe('lost');
    expect(end.sides.map((x) => x.core)).toEqual([0, 1]);
    const even = emptyBattle(s, WEAR_FROM + 4);
    even.sides[0].core = 4;
    even.sides[1].core = 4;
    expect(stepBattle(even, 1).state.phase).toBe('draw');
  });
});

describe('credits stay within what a save may hold (review of PR #107)', () => {
  it('income, interest and bounties stop at MAX_CREDITS', () => {
    const s = newGame(1, 'normal');
    const rich = { ...s, sides: [{ ...s.sides[0], credits: MAX_CREDITS - 10 }, { ...s.sides[1], credits: MAX_CREDITS }] as HoldState['sides'] };
    rich.roundStart = { ...rich.roundStart, sides: rich.sides };
    const end = resolveBattle(lockRound(rich, idle)).state;
    expect(end.phase).toBe('plan');
    expect(end.sides.map((x) => x.credits)).toEqual([MAX_CREDITS, MAX_CREDITS]);
    expect(isValidState(clone(end))).toBe(true);
    expect(isValidState({ ...clone(end), sides: [{ ...clone(end.sides[0]), credits: MAX_CREDITS + 1 }, clone(end.sides[1])] })).toBe(false);
  });

  it('a sale at the limit keeps the credits at the limit', () => {
    let s = applyPlan(newGame(1, 'normal'), 0, { t: 'place', kind: 'gun', x: 3, y: 9 });
    const id = s.sides[0].towers[0]!.id;
    s = { ...s, sides: [{ ...s.sides[0], credits: MAX_CREDITS }, s.sides[1]] };
    expect(applyPlan(s, 0, { t: 'sell', id }).sides[0].credits).toBe(MAX_CREDITS);
  });

  it('alone, the other side earns nothing: its credits never change', () => {
    let s = newGame(1, 'normal', 'crossing', { solo: true });
    for (let round = 0; round < 3 && s.phase === 'plan'; round++) {
      for (const cmd of planRound(s, 0, 'normal')) s = applyPlan(s, 0, cmd);
      s = resolveBattle(lockRound(s, idle)).state;
      expect(s.sides[1].credits).toBe(START_CREDITS);
    }
  }, 30_000);
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
