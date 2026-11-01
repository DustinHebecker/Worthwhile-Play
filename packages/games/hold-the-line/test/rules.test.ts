import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { worldHash } from '@wp/strategy-engine';
import { TOWERS } from '@wp/td-core';
import { planRound } from '../src/ai';
import { randomPlan } from './plans';
import { DUEL, MAPS, ownPad } from '../src/maps';
import {
  applyPlan,
  BASE_CAPACITY,
  capacityOf,
  checkPlan,
  EXTRACTOR_INCOME,
  EXTRACTOR_PRICE,
  incomeOf,
  interestOf,
  isValidState,
  lockRound,
  seenBy,
  MAX_WORKSHOPS,
  newGame,
  resolveBattle,
  ROUND_INCOME,
  ROUNDS,
  START_CORE,
  START_CREDITS,
  stepBattle,
  UNIT_PRICES,
  WORKSHOP_CAPACITY,
  WORKSHOP_PRICE,
  type HoldState,
  type Planner
} from '../src/rules';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const idle: Planner = () => [];
const ai: Planner = (s) => planRound(s);
const fresh = (): HoldState => newGame(1, 'normal');


describe('map', () => {
  it.each(MAPS.map((m) => m.id))('%s is point-symmetric, 7 wide, and every lane runs over road to the other core', (id) => {
    const map = MAPS.find((m) => m.id === id)!;
    expect(map.w).toBe(7);
    for (let y = 0; y < map.h; y++) expect(map.rows[y]).toBe([...map.rows[map.h - 1 - y]!].reverse().join(''));
    for (const [side, lane] of map.lanes.entries()) {
      for (const [x, y] of lane.points) expect(map.rows[y]![x], `${side} ${x},${y}`).toBe('=');
      const mirror = map.lanes[1 - side]!.points.map(([x, y]) => [map.w - 1 - x, map.h - 1 - y]);
      expect(lane.points).toEqual(mirror);
    }
  });

  it('each side builds only on pads of its own half', () => {
    expect(ownPad(DUEL, 0, 2, 14)).toBe(true);
    expect(ownPad(DUEL, 1, 2, 14)).toBe(false);
    expect(ownPad(DUEL, 1, 4, 2)).toBe(true);
    expect(ownPad(DUEL, 0, 1, DUEL.split)).toBe(false);
    expect(ownPad(DUEL, 1, 1, DUEL.split)).toBe(false);
    expect(ownPad(DUEL, 0, 0, 14)).toBe(false);
  });
});

describe('planning', () => {
  it('starts both sides equal; the computer plans at the lock from the round start only', () => {
    const s = newGame(5, 'normal');
    expect(s.phase).toBe('plan');
    expect(s.sides.map((x) => [x.credits, x.core])).toEqual([
      [START_CREDITS, START_CORE],
      [START_CREDITS, START_CORE]
    ]);
    expect(isValidState(clone(s))).toBe(true);
    // The player builds; the planner sees the map as the round began, without that tower.
    const planned = applyPlan(s, 0, { t: 'place', kind: 'gun', x: 2, y: 14 });
    let seen: HoldState | undefined;
    const locked = lockRound(planned, (view) => {
      seen = view;
      return planRound(view);
    });
    expect(seen!.world.entities).toHaveLength(0);
    expect(seen!.sides[0].credits).toBe(START_CREDITS);
    // Its plan is carried out at the lock and logged.
    expect(locked.log[0]!.ai.length).toBeGreaterThan(0);
    expect(locked.world.entities.some((e) => e.side === 1)).toBe(true);
  });

  it('the computer\'s upgrades of towers it builds this round reach those towers, also when the player built first (review S1)', () => {
    let s = { ...fresh(), sides: [fresh().sides[0], { ...fresh().sides[1], credits: 1500 }] as HoldState['sides'] };
    s = { ...s, roundStart: { world: s.world, sides: structuredClone(s.sides) } };
    // The player builds two towers this round: they take the next ids.
    s = applyPlan(applyPlan(s, 0, { t: 'place', kind: 'gun', x: 2, y: 14 }), 0, { t: 'place', kind: 'gun', x: 3, y: 14 });
    const planner: Planner = (view) => {
      const laser = view.world.nextId;
      const artillery = laser + 1;
      return [
        { t: 'place', kind: 'laser', x: 5, y: 3 },
        { t: 'place', kind: 'artillery', x: 4, y: 5 },
        { t: 'upgrade', id: laser, kind: 'pulse' },
        { t: 'upgrade', id: artillery, kind: 'howitzer' }
      ];
    };
    const locked = lockRound(s, planner);
    const foe = locked.world.entities.filter((e) => e.side === 1).map((e) => e.kind).sort();
    expect(foe).toEqual(['howitzer', 'pulse']);
    expect(locked.log[0]!.ai).toHaveLength(4);
    expect(locked.world.entities.filter((e) => e.side === 0).map((e) => e.kind)).toEqual(['gun', 'gun']);
    expect(locked.sides[1].credits).toBe(1500 - TOWERS.laser!.price - TOWERS.artillery!.price - TOWERS.pulse!.price - TOWERS.howitzer!.price);
  });

  it('buys and removes units within capacity and credits', () => {
    let s = fresh();
    s = applyPlan(s, 0, { t: 'buy', kind: 'walker' });
    expect(s.sides[0].wave).toEqual(['walker']);
    expect(s.sides[0].credits).toBe(START_CREDITS - UNIT_PRICES.walker!);
    expect(checkPlan(s, 0, { t: 'buy', kind: 'crawler' })).toBe('not-for-sale');
    s = applyPlan(s, 0, { t: 'unbuy', index: 0 });
    expect(s.sides[0].wave).toEqual([]);
    expect(s.sides[0].credits).toBe(START_CREDITS);
    expect(checkPlan(s, 0, { t: 'unbuy', index: 0 })).toBe('no-unit');
    for (let i = 0; i < BASE_CAPACITY; i++) s = applyPlan(s, 0, { t: 'buy', kind: 'swarm' });
    expect(checkPlan(s, 0, { t: 'buy', kind: 'swarm' })).toBe('capacity');
    const poor = { ...s, sides: [{ ...s.sides[0], credits: 10, wave: [] }, s.sides[1]] as HoldState['sides'] };
    expect(checkPlan(poor, 0, { t: 'buy', kind: 'brute' })).toBe('credits');
  });

  it('a workshop raises the capacity, up to the limit', () => {
    let s = { ...fresh(), sides: [{ ...fresh().sides[0], credits: 5000 }, fresh().sides[1]] as HoldState['sides'] };
    for (let i = 0; i < MAX_WORKSHOPS; i++) s = applyPlan(s, 0, { t: 'workshop' });
    expect(capacityOf(s.sides[0])).toBe(BASE_CAPACITY + MAX_WORKSHOPS * WORKSHOP_CAPACITY);
    expect(s.sides[0].credits).toBe(5000 - MAX_WORKSHOPS * WORKSHOP_PRICE);
    expect(checkPlan(s, 0, { t: 'workshop' })).toBe('workshops');
  });

  it('towers and extractors only on own pads; an extractor adds income', () => {
    let s = fresh();
    expect(checkPlan(s, 0, { t: 'place', kind: 'gun', x: 4, y: 2 })).toBe('not-a-pad');
    expect(checkPlan(s, 0, { t: 'extractor', x: 0, y: 14 })).toBe('not-a-pad');
    s = applyPlan(s, 0, { t: 'extractor', x: 2, y: 14 });
    expect(s.sides[0].credits).toBe(START_CREDITS - EXTRACTOR_PRICE);
    expect(incomeOf(s, 0)).toBe(ROUND_INCOME + EXTRACTOR_INCOME);
    expect(checkPlan(s, 0, { t: 'place', kind: 'gun', x: 2, y: 14 })).toBe('occupied');
    expect(checkPlan(s, 0, { t: 'upgrade', id: s.world.entities[0]!.id, kind: 'gatling' })).toBe('not-an-upgrade');
    // Sold in the same planning phase: everything back.
    expect(applyPlan(s, 0, { t: 'sell', id: s.world.entities[0]!.id }).sides[0].credits).toBe(START_CREDITS);
  });

  it('accepts no plan command during the battle', () => {
    const s = lockRound(fresh(), idle);
    expect(s.phase).toBe('battle');
    expect(checkPlan(s, 0, { t: 'buy', kind: 'walker' })).toBe('phase');
  });
});

describe('battle', () => {
  it('an undefended side loses core by the threat of every unit that reaches it; the attacker loses nothing', () => {
    let s = fresh();
    for (let i = 0; i < 4; i++) s = applyPlan(s, 0, { t: 'buy', kind: 'walker' });
    const end = resolveBattle(lockRound(s, idle)).state;
    expect(end.sides[1].core).toBe(START_CORE - 4);
    expect(end.sides[0].core).toBe(START_CORE);
    expect(end.sides[0].stats.leaked).toBe(4);
  });

  it('a defender earns bounties, and both sides get income plus interest on what they kept', () => {
    let s = fresh();
    s = applyPlan(s, 0, { t: 'place', kind: 'gun', x: 5, y: 12 });
    s = applyPlan(s, 0, { t: 'place', kind: 'gun', x: 5, y: 10 });
    s = applyPlan(s, 1, { t: 'buy', kind: 'walker' });
    const locked = lockRound(s, idle);
    const end = resolveBattle(locked).state;
    expect(end.phase).toBe('plan');
    expect(end.round).toBe(1);
    const killed = end.sides[0].stats.killed;
    expect(killed).toBe(1);
    expect(end.sides[0].credits).toBe(locked.sides[0].credits + 4 + ROUND_INCOME + interestOf(locked.unspent[0]));
    expect(end.sides[1].credits).toBe(locked.sides[1].credits + ROUND_INCOME + interestOf(locked.unspent[1]));
    expect(end.sides[1].lastWave).toEqual(['walker']);
    expect(end.sides[1].wave).toEqual([]);
  });

  it('the game ends after the last round or when a core falls; the higher core wins', () => {
    let s = fresh();
    for (let round = 0; round < ROUNDS && s.phase === 'plan'; round++) {
      s = applyPlan(s, 0, { t: 'buy', kind: 'walker' });
      s = resolveBattle(lockRound(s, idle)).state;
    }
    expect(s.phase).toBe('won');
    expect(s.round).toBe(ROUNDS - 1);
    expect(s.sides[1].core).toBe(START_CORE - ROUNDS);
    expect(isValidState(clone(s))).toBe(true);
    // Both silent: a draw.
    let quiet = fresh();
    while (quiet.phase === 'plan') quiet = resolveBattle(lockRound(quiet, idle)).state;
    expect(quiet.phase).toBe('draw');
  });

  it('a fallen core ends the game after that battle', () => {
    let s = { ...fresh(), sides: [{ ...fresh().sides[0], credits: 5000, workshops: 3 }, { ...fresh().sides[1], core: 2 }] as HoldState['sides'] };
    for (let i = 0; i < 3; i++) s = applyPlan(s, 0, { t: 'buy', kind: 'walker' });
    const end = resolveBattle(lockRound(s, idle)).state;
    expect(end.sides[1].core).toBe(0);
    expect(end.phase).toBe('won');
  });
});

describe('properties', () => {
  const arb = fc.record({ seed: fc.integer({ min: 0, max: 2 ** 31 }), build: fc.integer({ min: 0, max: 1000 }), n: fc.integer({ min: 0, max: 10 }) });

  it('determinism: the same plans give the same game', () => {
    fc.assert(
      fc.property(arb, ({ seed, build, n }) => {
        const a = resolveBattle(lockRound(randomPlan(newGame(seed, 'normal'), build, n), ai)).state;
        const b = resolveBattle(lockRound(randomPlan(newGame(seed, 'normal'), build, n), ai)).state;
        expect(worldHash(a.world)).toBe(worldHash(b.world));
        expect(a).toEqual(b);
      }),
      { numRuns: 4 }
    );
  }, 60_000);

  it('save and restore at any tick of a battle continues exactly; saves stay valid', () => {
    fc.assert(
      fc.property(arb, fc.integer({ min: 0, max: 300 }), ({ seed, build, n }, at) => {
        const start = lockRound(randomPlan(newGame(seed, 'normal'), build, n), ai);
        const mid = stepBattle(start, at).state;
        expect(isValidState(clone(mid))).toBe(true);
        expect(resolveBattle(clone(mid)).state).toEqual(resolveBattle(mid).state);
      }),
      { numRuns: 8 }
    );
  });

  it('credits never go negative and cores stay within range', () => {
    fc.assert(
      fc.property(arb, ({ seed, build, n }) => {
        let s = newGame(seed, 'normal');
        for (let r = 0; r < 3 && s.phase === 'plan'; r++) {
          s = randomPlan(s, build + r, n);
          for (const side of s.sides) expect(side.credits).toBeGreaterThanOrEqual(0);
          s = resolveBattle(lockRound(s, ai)).state;
          for (const side of s.sides) {
            expect(side.core).toBeGreaterThanOrEqual(0);
            expect(side.core).toBeLessThanOrEqual(START_CORE);
          }
        }
      }),
      { numRuns: 6 }
    );
  });

  it('a battle saved after a core reached 0 is valid and resumes exactly (orchestrator review)', () => {
    // A player who never plans: the computer's waves break the core while units still run.
    let s = newGame(2, 'hard');
    let mid: HoldState | null = null;
    while (s.phase === 'plan' && !mid) {
      s = lockRound(s, ai);
      while (s.phase === 'battle') {
        s = stepBattle(s, 1).state;
        if (s.phase === 'battle' && s.sides[0].core === 0) {
          mid = s;
          break;
        }
      }
    }
    expect(mid).not.toBeNull();
    const saved = clone(mid!);
    expect(isValidState(saved)).toBe(true);
    const end = resolveBattle(saved).state;
    expect(end).toEqual(resolveBattle(mid!).state);
    expect(end.phase).toBe('lost');
    // A plan phase with a broken core cannot happen.
    expect(isValidState({ ...clone(end), phase: 'plan' })).toBe(false);
  });

  it('a spawn that is not yet due cannot be dropped from a save (orchestrator nit)', () => {
    let s = fresh();
    for (const kind of ['walker', 'runner'] as const) s = applyPlan(s, 0, { t: 'buy', kind });
    const locked = lockRound(s, idle);
    expect(isValidState(clone(locked))).toBe(true);
    const dropped = clone(locked);
    dropped.run!.pending = dropped.run!.pending.filter((_p, i, all) => i !== all.findIndex((q) => q.side === 0));
    expect(isValidState(dropped)).toBe(false);
  });

  it('a running battle must be what the sides bought, in order (review S2)', () => {
    let s = fresh();
    for (const kind of ['walker', 'brute', 'runner'] as const) s = applyPlan(s, 0, { t: 'buy', kind });
    s = applyPlan(s, 1, { t: 'buy', kind: 'walker' });
    const mid = clone(stepBattle(lockRound(s, idle), 2).state);
    expect(isValidState(mid)).toBe(true);
    const bad: ((t: HoldState) => void)[] = [
      (t) => (t.run!.pending.find((p) => p.side === 0)!.kind = 'crawler'),
      (t) => (t.run!.pending.find((p) => p.side === 0)!.kind = 'swarm'),
      (t) => (t.run!.pending.find((p) => p.side === 0)!.at = 1e12),
      (t) => {
        for (const p of t.run!.pending) if (p.side === 0) Object.assign(p, { side: 1, route: 1 });
      },
      (t) => (t.world.entities.find((e) => e.side === 0 && !Object.hasOwn(TOWERS, e.kind))!.kind = 'brute'),
      (t) => (t.sides[0].wave = ['walker'])
    ];
    for (const tamper of bad) {
      const t = clone(mid);
      tamper(t);
      expect(isValidState(t)).toBe(false);
    }
  });

  it('rejects saves whose result, snapshot or log cannot happen', () => {
    const s = fresh();
    const bad: ((t: HoldState) => void)[] = [
      (t) => (t.phase = 'won'),
      (t) => (t.phase = 'draw'),
      (t) => (t.sides[0].core = 0),
      (t) => (t.sides[1].credits = 999_999),
      (t) => (t.sides[1].wave = ['walker']),
      (t) => (t.roundStart.sides[0].core = 5),
      (t) => (t.log[0]!.player = Array.from({ length: 1001 }, () => ({ t: 'workshop' }) as const)),
      (t) => (t.sides[0].lastWave = new Array(3) as never)
    ];
    for (const tamper of bad) {
      const t = clone(s);
      tamper(t);
      expect(isValidState(t)).toBe(false);
    }
    // A finished game at the last round with equal cores is a draw, and valid.
    const end = { ...clone(s), round: ROUNDS - 1, phase: 'draw' as const, log: Array.from({ length: ROUNDS }, () => ({ player: [], ai: [] })) };
    expect(isValidState(end)).toBe(true);
  });

  it('isValidState never throws and rejects junk and tampered saves', () => {
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isValidState(v)).not.toThrow();
      }),
      { numRuns: 300 }
    );
    const s = applyPlan(fresh(), 0, { t: 'place', kind: 'gun', x: 2, y: 14 });
    expect(isValidState(clone(s))).toBe(true);
    const bad: ((t: HoldState) => void)[] = [
      (t) => (t.sides[0].credits = -1),
      (t) => (t.sides[0].core = START_CORE + 1),
      (t) => (t.round = ROUNDS),
      (t) => (t.sides[0].towers = []),
      (t) => (t.world.entities[0]!.y = 2),
      (t) => (t.world.entities[0]!.side = 1),
      (t) => (t.sides[0].wave = ['crawler']),
      (t) => (t.log = []),
      (t) => (t.mode = 'vs-large' as never),
      (t) => (t.roundStart = { world: t.world, sides: [t.sides[0], { ...t.sides[1], core: -1 }] } as never)
    ];
    for (const tamper of bad) {
      const t = clone(s);
      tamper(t);
      expect(isValidState(t)).toBe(false);
    }
  });
});

describe('texts', () => {
  it('the Amplifier text says it also helps own units (its aura reaches every own entity nearby)', async () => {
    const { messages } = await import('../src/messages');
    const { UNIT_MESSAGES } = await import('@wp/td-core');
    for (const [locale, texts] of Object.entries(messages)) {
      expect(texts['about.amplifier'], locale).toBeTruthy();
      expect(texts['about.amplifier'], locale).not.toBe(UNIT_MESSAGES[locale]!['about.amplifier']);
    }
    expect(messages.en!['about.amplifier']).toMatch(/units/);
  });
});

describe('what the computer sees', () => {
  it('the round start only: no structures, credits, log or interest base of this round', () => {
    let s = fresh();
    s = applyPlan(s, 0, { t: 'place', kind: 'gun', x: 2, y: 14 });
    s = applyPlan(s, 0, { t: 'buy', kind: 'walker' });
    const seen = seenBy(s);
    expect(seen.world).toEqual(s.roundStart.world);
    expect(seen.sides).toEqual(s.roundStart.sides);
    expect(seen.world.entities).toHaveLength(0);
    expect(seen.sides[0].credits).toBe(START_CREDITS);
    expect(seen.sides[0].wave).toEqual([]);
    expect(seen.log).toEqual([{ player: [], ai: [] }]);
    expect(seen.unspent).toEqual([0, 0]);
    expect(seen.run).toBeNull();
    expect(seen.round).toBe(s.round);
    expect(seen.phase).toBe('plan');
    // The real state is untouched.
    expect(s.log[0]!.player).toHaveLength(2);
  });

  it('a planner that copies what it sees cannot learn the player’s plan', () => {
    let s = fresh();
    s = applyPlan(s, 0, { t: 'place', kind: 'gun', x: 2, y: 14 });
    let seenLog: unknown = null;
    lockRound(s, (v) => {
      seenLog = v.log;
      expect(v.world.entities.filter((e) => e.side === 0)).toHaveLength(0);
      return [];
    });
    expect(seenLog).toEqual([{ player: [], ai: [] }]);
  });
});
