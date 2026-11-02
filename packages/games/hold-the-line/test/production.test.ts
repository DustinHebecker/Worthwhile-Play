import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { planRound } from '../src/ai';
import { ownPad, DUEL } from '../src/maps';
import { randomPlan } from './plans';
import {
  applyPlan,
  checkPlan,
  isValidState,
  levyOf,
  lockRound,
  MAX_CREDITS,
  MAX_PRODUCERS,
  MAX_WAVE,
  MOST_PRODUCED,
  newGame,
  PRODUCERS,
  productionOf,
  RESEARCH,
  RESEARCH_IDS,
  resolveBattle,
  sendsOf,
  SIEGE_EVERY,
  stepBattle,
  type HoldState,
  type PlanCommand,
  type Planner
} from '../src/rules';

/** The Duel with production buildings and research (owner 2026-11-01; design § 18.2). */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const idle: Planner = () => [];
const fresh = (): HoldState => newGame(1, 'normal');
const rich = (s: HoldState, credits = 5000): HoldState => {
  const t = clone(s);
  t.sides[0].credits = credits;
  return t;
};
/** Own free pads, in a fixed order. */
const pads = (side = 0): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < DUEL.h; y++) for (let x = 0; x < DUEL.w; x++) if (ownPad(DUEL, side, x, y)) out.push([x, y]);
  return out;
};
const play = (s: HoldState, cmds: PlanCommand[], side = 0): HoldState => cmds.reduce((t, c) => {
  expect(checkPlan(t, side, c), JSON.stringify(c)).toBeNull();
  return applyPlan(t, side, c);
}, s);

describe('production: setup', () => {
  it('a new Duel produces by default; the shop is a choice; the outside force has neither', () => {
    expect(fresh().waves).toBe('production');
    expect(fresh().sides[0].research).toEqual([]);
    expect(newGame(1, 'normal', 'duel', { waves: 'shop' }).waves).toBe('shop');
    expect(newGame(1, 'normal', 'duel', { waves: 'shop' }).sides[0].research).toBeUndefined();
    expect(newGame(1, 'normal', 'crossing').waves).toBeUndefined();
    expect(isValidState(clone(fresh()))).toBe(true);
  });

  it('buying units and workshops belongs to the shop; buildings and research to production', () => {
    const shop = newGame(1, 'normal', 'duel', { waves: 'shop' });
    const [x, y] = pads()[0]!;
    for (const cmd of [{ t: 'buy', kind: 'walker' }, { t: 'unbuy', index: 0 }, { t: 'workshop' }] as PlanCommand[]) expect(checkPlan(fresh(), 0, cmd)).toBe('mode');
    expect(checkPlan(shop, 0, { t: 'produce', kind: 'barracks', x, y })).toBe('mode');
    expect(checkPlan(shop, 0, { t: 'research', id: 'shields' })).toBe('mode');
    expect(checkPlan(newGame(1, 'normal', 'crossing'), 0, { t: 'produce', kind: 'barracks', x: 0, y: 16 })).toBe('mode');
  });
});

describe('production: buildings', () => {
  it('take an own free pad and cost their price; refunded like any structure', () => {
    const [x, y] = pads()[0]!;
    const s = play(fresh(), [{ t: 'produce', kind: 'barracks', x, y }]);
    expect(s.sides[0].credits).toBe(300 - PRODUCERS.barracks);
    expect(s.sides[0].stats.spent).toBe(PRODUCERS.barracks);
    expect(s.world.entities.find((e) => e.x === x && e.y === y)?.kind).toBe('barracks');
    expect(checkPlan(s, 0, { t: 'produce', kind: 'garage', x, y })).toBe('occupied');
    expect(checkPlan(s, 0, { t: 'produce', kind: 'garage', x: 0, y: 0 })).toBe('not-a-pad');
    expect(checkPlan(s, 0, { t: 'produce', kind: 'lab', x: pads()[1]![0], y: pads()[1]![1] })).toBeNull();
    const poor = applyPlan(s, 0, { t: 'produce', kind: 'lab', x: pads()[1]![0], y: pads()[1]![1] });
    expect(poor.sides[0].credits).toBeLessThan(PRODUCERS.barracks);
    expect(checkPlan(poor, 0, { t: 'produce', kind: 'barracks', x: pads()[2]![0], y: pads()[2]![1] })).toBe('credits');
    const id = s.sides[0].towers[0]!.id;
    const sold = applyPlan(s, 0, { t: 'sell', id });
    expect(sold.sides[0].credits).toBe(300);
    expect(sold.world.entities.some((e) => e.id === id)).toBe(false);
    expect(isValidState(clone(s))).toBe(true);
  });

  it('at most MAX_PRODUCERS production buildings and one Lab', () => {
    let s = rich(fresh(), 50_000);
    const free = pads();
    for (let i = 0; i < MAX_PRODUCERS; i++) s = play(s, [{ t: 'produce', kind: 'barracks', x: free[i]![0], y: free[i]![1] }]);
    const [x, y] = free[MAX_PRODUCERS]!;
    expect(checkPlan(s, 0, { t: 'produce', kind: 'garage', x, y })).toBe('producers');
    s = play(s, [{ t: 'produce', kind: 'lab', x, y }]);
    const [x2, y2] = free[MAX_PRODUCERS + 1]!;
    expect(checkPlan(s, 0, { t: 'produce', kind: 'lab', x: x2, y: y2 })).toBe('lab');
    expect(isValidState(clone(s))).toBe(true);
  });
});

describe('production: research', () => {
  it('needs a Lab, is paid once, and changes what buildings send', () => {
    const free = pads();
    const [[bx, by], [gx, gy], [hx, hy], [lx, ly]] = [free[0]!, free[1]!, free[2]!, free[3]!];
    let s = rich(fresh());
    expect(checkPlan(s, 0, { t: 'research', id: 'shields' })).toBe('lab');
    s = play(s, [
      { t: 'produce', kind: 'barracks', x: bx, y: by },
      { t: 'produce', kind: 'garage', x: gx, y: gy },
      { t: 'produce', kind: 'hangar', x: hx, y: hy },
      { t: 'produce', kind: 'lab', x: lx, y: ly }
    ]);
    expect(productionOf(s, 0)).toEqual(['walker', 'walker', 'walker', 'runner', 'runner', 'glider']);
    const before = s.sides[0].credits;
    s = play(s, RESEARCH_IDS.map((id) => ({ t: 'research', id }) as PlanCommand));
    expect(before - s.sides[0].credits).toBe(Object.values(RESEARCH).reduce((a, b) => a + b, 0));
    expect(checkPlan(s, 0, { t: 'research', id: 'shields' })).toBe('researched');
    // Paid now, in effect from the next round.
    expect(s.sides[0].researching).toEqual(RESEARCH_IDS);
    expect(productionOf(s, 0)).toEqual(['walker', 'walker', 'walker', 'runner', 'runner', 'glider']);
    expect(isValidState(clone(s))).toBe(true);
    s = resolveBattle(lockRound(s, idle)).state;
    expect(s.sides[0].research).toEqual(RESEARCH_IDS);
    expect(s.sides[0].researching).toEqual([]);
    expect(productionOf({ ...s, round: 0 }, 0)).toEqual(['shielder', 'shielder', 'shielder', 'mender', 'raider', 'raider', 'brute', 'glider', 'glider']);
    // The Siege crawler: every third round only.
    for (let round = 0; round < 9; round++) expect(productionOf({ ...s, round }, 0).includes('crawler'), `round ${round + 1}`).toBe((round + 1) % SIEGE_EVERY === 0);
    expect(isValidState(clone(s))).toBe(true);
  });

  it('what one building sends, for every research combination, is at most four units of produced kinds', () => {
    fc.assert(
      fc.property(fc.subarray(RESEARCH_IDS), (done) => {
        for (const kind of ['barracks', 'garage', 'hangar', 'lab'] as const) expect(sendsOf(kind, done).length).toBeLessThanOrEqual(4);
        expect(sendsOf('lab', done)).toEqual([]);
      })
    );
  });
});

describe('production: the lock and the battle', () => {
  it('at the lock each side sends what its buildings make, then the levy; saves stay valid', () => {
    const [bx, by] = pads()[0]!;
    const [ox, oy] = pads(1)[0]!;
    let s = play(fresh(), [{ t: 'produce', kind: 'barracks', x: bx, y: by }]);
    s = { ...s, round: 12, log: Array.from({ length: 13 }, () => ({ player: [], ai: [] })) };
    s.log[12] = { player: [{ t: 'produce', kind: 'barracks', x: bx, y: by }], ai: [] };
    const locked = lockRound(s, () => [{ t: 'produce', kind: 'garage', x: ox, y: oy }]);
    expect(locked.sides[0].wave).toEqual(['walker', 'walker', 'walker', ...levyOf(locked)]);
    expect(locked.sides[1].wave).toEqual(['runner', 'runner', ...levyOf(locked)]);
    for (const at of [0, 40, 200]) expect(isValidState(clone(stepBattle(locked, at).state)), `tick ${at}`).toBe(true);
    const end = resolveBattle(locked).state;
    expect(end.phase).toBe('plan');
    expect(end.sides[0].wave).toEqual([]);
    expect(end.sides[0].lastWave).toEqual(locked.sides[0].wave);
    expect(isValidState(clone(end))).toBe(true);
  });

  it('buildings bought this round send at this lock; nothing to send means only the levy', () => {
    const locked = lockRound(fresh(), idle);
    expect(locked.sides[0].wave).toEqual(levyOf(fresh()));
  });
});

describe('production: saves', () => {
  it('rejects saves that mix production and shop, or go past the bounds', () => {
    const [x, y] = pads()[0]!;
    const s = play(fresh(), [{ t: 'produce', kind: 'barracks', x, y }]);
    const locked = lockRound(s, idle);
    const bad: [HoldState, (t: HoldState) => void][] = [
      [s, (t) => (t.waves = 'market' as never)],
      [s, (t) => delete t.sides[0].research],
      [s, (t) => (t.sides[0].research = ['shields', 'shields'])],
      [s, (t) => ((t.sides[0].research = ['shields']), (t.sides[0].researching = ['shields']))],
      [s, (t) => delete t.sides[0].researching],
      [s, (t) => (t.roundStart.sides[0].researching = ['siege'])],
      [s, (t) => (t.sides[0].research = ['teleport' as never])],
      [s, (t) => (t.sides[0].workshops = 1)],
      [s, (t) => (t.sides[0].wave = ['walker'])],
      [locked, (t) => (t.sides[0].wave = [...t.sides[0].wave.slice(0, -1), 'swarm'])],
      [locked, (t) => (t.sides[0].wave = Array(MOST_PRODUCED + 1).fill('walker'))],
      [s, (t) => (t.waves = 'shop')],
      [newGame(1, 'normal', 'crossing'), (t) => (t.waves = 'production')],
      [newGame(1, 'normal', 'duel', { waves: 'shop' }), (t) => (t.sides[0].research = [])],
      [newGame(1, 'normal', 'duel', { waves: 'shop' }), (t) => (t.sides[0].researching = [])]
    ];
    for (const [i, [base, tamper]] of bad.entries()) {
      const t = clone(base);
      tamper(t);
      expect(isValidState(t), `case ${i}`).toBe(false);
    }
  });

  it('saves from before the choice (no `waves`) are Duels with the shop', () => {
    const old = clone(newGame(1, 'normal', 'duel', { waves: 'shop' })) as Partial<HoldState>;
    delete old.waves;
    expect(isValidState(old)).toBe(true);
    expect(checkPlan(old as HoldState, 0, { t: 'buy', kind: 'walker' })).toBeNull();
  });
});

describe('production: bounds and fuzz', () => {
  it('the largest possible produced wave (every building at its most, the Siege crawler, the full levy) fits the save bound', () => {
    const free = pads();
    let s = rich(fresh(), MAX_CREDITS);
    s = play(s, [{ t: 'produce', kind: 'lab', x: free[0]![0], y: free[0]![1] }, ...RESEARCH_IDS.map((id) => ({ t: 'research', id }) as PlanCommand)]);
    for (let i = 1; i <= MAX_PRODUCERS; i++) s = play(s, [{ t: 'produce', kind: 'barracks', x: free[i]![0], y: free[i]![1] }]);
    // As if a round had passed (the research in effect), in a Siege round late in an endless game: the levy is full.
    s = clone(s);
    s.sides[0].research = s.sides[0].researching!;
    s.sides[0].researching = [];
    s = { ...s, round: 44, log: Array.from({ length: 45 }, () => ({ player: [], ai: [] })), roundStart: { world: clone(s.world), sides: clone(s.sides) } };
    const locked = lockRound(s, idle);
    expect(locked.sides[0].wave).toHaveLength(MOST_PRODUCED);
    expect(MOST_PRODUCED).toBeLessThanOrEqual(MAX_WAVE);
    for (const at of [0, 100, 600]) expect(isValidState(clone(stepBattle(locked, at).state)), `tick ${at}`).toBe(true);
  });

  it('random plans on both sides keep every save valid, and the computer is never refused', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.integer({ min: 0, max: 14 }), (seed, n) => {
        let s = rich(newGame(seed, 'normal'), 2000);
        for (let r = 0; r < 3 && s.phase === 'plan'; r++) {
          s = randomPlan(s, seed + r, n);
          expect(isValidState(clone(s))).toBe(true);
          let planned = 0;
          const locked = lockRound(s, (view) => {
            const cmds = planRound(view);
            planned = cmds.length;
            return cmds;
          });
          expect(locked.log[locked.round]!.ai).toHaveLength(planned);
          expect(isValidState(clone(stepBattle(locked, 60).state))).toBe(true);
          s = resolveBattle(locked).state;
          expect(isValidState(clone(s))).toBe(true);
        }
      }),
      { numRuns: 8 }
    );
  }, 120_000);
});

