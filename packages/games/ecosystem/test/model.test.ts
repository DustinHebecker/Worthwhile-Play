import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { seedFromString } from '@wp/game-core';
import { DEAD, MEADOW, POND, habitatDef, type HabitatDef, type Habitat, type SpeciesDef } from '../src/habitats';
import {
  HABITAT_ACTIONS,
  MAX_AMOUNT,
  applyAction,
  balanced,
  calmWeek,
  cloneSim,
  envOf,
  extendRun,
  hill,
  idiv,
  makeSim,
  pm,
  pop,
  q,
  rebaseWeek,
  runUntilSettled,
  sample,
  sat,
  settledAt,
  simulate,
  sortActions,
  startRun,
  stepDay,
  stepWeek,
  total,
  weatherFactor,
  type Action,
  type Sim
} from '../src/model';
import { PRESETS } from '../src/presets';
import { PRESET_IDS } from '../src/spinup';

const BIG = 2 ** 53;

describe('integer core', () => {
  it('idiv equals BigInt floor division for 0 ≤ a < 2^53, 0 < b < 2^53', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }), (a, b) => {
        expect(idiv(a, b)).toBe(Number(BigInt(a) / BigInt(b)));
      }),
      { numRuns: 2000 }
    );
    // Cases where a / b rounds up to the next integer in floating point.
    for (const [a, b] of [[BIG - 1, BIG - 2], [BIG - 2, BIG - 1], [9007199254740991, 3], [4503599627370497, 2], [7, 7], [0, 5]] as const) {
      expect(idiv(a, b)).toBe(Number(BigInt(a) / BigInt(b)));
    }
  });

  it('pm, sat and hill stay in range and are monotone', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MAX_AMOUNT }), fc.integer({ min: 0, max: MAX_AMOUNT }), fc.integer({ min: 1, max: MAX_AMOUNT }), (x, y, k) => {
        expect(sat(x, k)).toBeGreaterThanOrEqual(0);
        expect(sat(x, k)).toBeLessThanOrEqual(1000);
        expect(hill(x, k)).toBeGreaterThanOrEqual(0);
        expect(hill(x, k)).toBeLessThanOrEqual(1000);
        const [lo, hi] = x <= y ? [x, y] : [y, x];
        expect(sat(lo, k)).toBeLessThanOrEqual(sat(hi, k));
        expect(hill(lo, k)).toBeLessThanOrEqual(hill(hi, k));
        expect(pm(1_000_000, x)).toBe(x);
        expect(pm(500_000, lo)).toBeLessThanOrEqual(pm(500_000, hi));
      })
    );
    expect(sat(0, 0)).toBe(0);
    expect(hill(0, 0)).toBe(0);
    expect(hill(500, 900)).toBe(0); // both below a thousand: q() = 0
    expect(q(1999)).toBe(1);
    expect(sat(10, 10)).toBe(500);
    expect(hill(2000, 2000)).toBe(500);
  });

  it('the bound analysis of § 7.8: the largest intermediate products stay below 2^53', () => {
    const maxRate = 1_000_000;
    const maxPref = 3_000;
    const omega = idiv(maxPref * MAX_AMOUNT, 1000); // a weighted food amount
    const products = [
      MAX_AMOUNT * maxRate, // pm(rate, amount)
      idiv(maxRate * MAX_AMOUNT, 1_000_000) * MAX_AMOUNT, // quadratic mortality pm(m2, B) · B
      MAX_AMOUNT * 2 * omega, // Q · ω_j with Q ≤ amount and two foods
      maxRate * 3 * omega, // g · Ω
      1000 * q(MAX_AMOUNT) * q(MAX_AMOUNT), // hill numerator on thousands
      1000 * 8 * MAX_AMOUNT, // crowding 1000 · Σ space
      MAX_AMOUNT * MAX_AMOUNT // limiter o_k · X
    ];
    for (const p of products) expect(p).toBeLessThan(BIG);
  });
});

/* ---------- Arbitrary states and actions ---------- */

const arbSim = (habitat: Habitat): fc.Arbitrary<Sim> => {
  const hab = habitatDef(habitat);
  const n = hab.species.length;
  const amount = fc.integer({ min: 0, max: 2_000_000 });
  return fc
    .record({
      n: amount,
      d: amount,
      w: hab.meadow ? fc.integer({ min: 0, max: hab.wMax }) : fc.constant(0),
      b: fc.array(fc.oneof(fc.constant(0), fc.integer({ min: 0, max: 400_000 })), { minLength: n, maxLength: n }),
      j: fc.tuple(...hab.species.map((sp) => fc.array(fc.integer({ min: 0, max: 50_000 }), { minLength: sp.delay, maxLength: sp.delay }))),
      seen: fc.array(fc.constantFrom(0, 1), { minLength: n, maxLength: n }),
      cond: fc.tuple(...hab.conditions.map((c) => fc.integer({ min: 0, max: c.levels.length - 1 })))
    })
    .map((r) => {
      const s: Sim = { week: 0, n: r.n, d: r.d, w: r.w, b: r.b, j: r.j as number[][], seen: r.seen, imp: 0, exp: 0, wimp: r.w, wexp: 0, cond: r.cond as number[] };
      s.imp = total(s);
      return s;
    });
};

const arbAction = (habitat: Habitat): fc.Arbitrary<Omit<Action, 'week'>> => {
  const hab = habitatDef(habitat);
  const ids = hab.species.map((s) => s.id);
  const kinds = HABITAT_ACTIONS[habitat];
  return fc.constantFrom(...kinds).chain((kind): fc.Arbitrary<Omit<Action, 'week'>> => {
    switch (kind) {
      case 'add':
        return fc.constantFrom(...ids).map((species) => ({ kind, species }));
      case 'remove':
        return fc.record({ species: fc.constantFrom(...ids), share: fc.constantFrom(50 as const, 90 as const, 100 as const) }).map((r) => ({ kind, ...r }));
      case 'mow':
        return fc.constantFrom('remove' as const, 'leave' as const).map((cuttings) => ({ kind, cuttings }));
      case 'set':
        return fc.integer({ min: 0, max: hab.conditions.length - 1 }).chain((cond) => fc.integer({ min: 0, max: hab.conditions[cond]!.levels.length - 1 }).map((level) => ({ kind, cond, level })));
      default:
        return fc.constant({ kind });
    }
  });
};

const nonNegative = (s: Sim) => s.n >= 0 && s.d >= 0 && s.w >= 0 && s.b.every((v) => v >= 0) && s.j.every((r) => r.every((v) => v >= 0));
const integral = (s: Sim) => [s.n, s.d, s.w, s.imp, s.exp, s.wimp, s.wexp, ...s.b, ...s.j.flat()].every(Number.isInteger);

describe('conservation and non-negativity (properties)', () => {
  for (const habitat of ['pond', 'meadow'] as const) {
    it(`${habitat}: nutrient and water balance hold exactly after every day, week and action; no stock is negative`, () => {
      const hab = habitatDef(habitat);
      fc.assert(
        fc.property(arbSim(habitat), fc.array(fc.tuple(arbAction(habitat), fc.integer({ min: 0, max: 3 })), { maxLength: 6 }), fc.boolean(), fc.integer(), (start, steps, weather, seed) => {
          const s = cloneSim(start);
          expect(balanced(s)).toBe(true);
          for (const [a, weeks] of steps) {
            applyAction(s, hab, { week: s.week, ...a });
            expect(balanced(s)).toBe(true);
            expect(nonNegative(s)).toBe(true);
            // One day by hand, then whole weeks.
            const env = envOf(hab, s);
            stepDay(s, hab, env);
            expect(balanced(s)).toBe(true);
            expect(nonNegative(s)).toBe(true);
            for (let w = 0; w < weeks; w++) {
              stepWeek(s, hab, { seed, weather });
              expect(balanced(s)).toBe(true);
              expect(nonNegative(s)).toBe(true);
              expect(integral(s)).toBe(true);
            }
          }
        }),
        { numRuns: 60 }
      );
    });
  }

  it('extinction moves the adults to dead matter (balance kept)', () => {
    const s = makeSim('pond', { n: 0, d: 0, b: { fleas: 150 } });
    s.b[4] = 90; // below min 100 after a day of losses
    s.imp = total(s);
    stepDay(s, POND, envOf(POND, s));
    expect(s.b[4]).toBe(0);
    expect(s.d).toBeGreaterThan(0);
    expect(balanced(s)).toBe(true);
  });

  it('arrivals and inputs raise imp by exactly their amount; exports raise exp exactly', () => {
    const s = cloneSim(PRESETS['pond.lively'].sim);
    s.cond[1] = 2; // runoff medium: 300 u/day
    const before = { imp: s.imp, exp: s.exp };
    const seenArrivals = POND.species.reduce((sum, sp, i) => sum + (s.seen[i] ? sp.arrive : 0), 0);
    // Count the fixed inputs: arrivals once, runoff 7 days (no fixation in the pond).
    stepWeek(s, POND);
    expect(s.imp - before.imp).toBe(seenArrivals + 7 * 300);
    const e0 = s.exp;
    const d0 = s.d;
    applyAction(s, POND, { week: 1, kind: 'dredge' });
    expect(s.exp - e0).toBe(d0 - s.d);
    expect(s.exp - e0).toBe(idiv(d0 * 75, 100));
  });
});

describe('determinism', () => {
  it('simulate twice is identical; a JSON round trip of the start replays identically', () => {
    const start = PRESETS['meadow.lively'].sim;
    const log: Action[] = [{ week: 0, kind: 'spray' }, { week: 5, kind: 'add', species: 'ladybirds' }, { week: 9, kind: 'set', cond: 0, level: 1 }];
    const a = simulate(start, 'meadow', log, 40);
    const b = simulate(JSON.parse(JSON.stringify(start)) as Sim, 'meadow', JSON.parse(JSON.stringify(log)) as Action[], 40);
    expect(b.samples).toEqual(a.samples);
    expect(b.sim).toEqual(a.sim);
  });

  it('extending a run in pieces equals one run', () => {
    const start = PRESETS['pond.lively'].sim;
    const log = sortActions([{ week: 3, kind: 'set', cond: 1, level: 3 }, { week: 0, kind: 'add', species: 'pike' }]);
    const whole = simulate(start, 'pond', log, 30, { seed: 5, weather: true });
    const run = startRun(start, POND, log);
    for (const to of [1, 3, 4, 17, 30]) extendRun(run, POND, log, to, { seed: 5, weather: true });
    expect(run.samples).toEqual(whole.samples);
  });

  it('104-week runs of every preset match their golden checksums (catches float use or order changes)', () => {
    const sums: Record<string, number> = {};
    for (const id of PRESET_IDS) {
      const r = simulate(PRESETS[id].sim, PRESETS[id].habitat, [], 104);
      sums[id] = seedFromString(JSON.stringify(r.samples));
    }
    expect(sums).toEqual(GOLDEN);
  });
});

/* ---------- Mechanisms on tiny habitats ---------- */

const sp = (over: Partial<SpeciesDef> & { id: string; producer: boolean }): SpeciesDef => ({
  mu: 0,
  k: 1,
  kL: 0,
  hill: false,
  shadedBy: [],
  inhibitedBy: [],
  space: -1,
  kW: 0,
  water: 0,
  fix: 0,
  kFix: 0,
  eats: [],
  refuge: null,
  assim: 0,
  resp: 0,
  mort: 0,
  m2: 0,
  delay: 0,
  hide: 0,
  suspended: false,
  arrive: 0,
  intro: 1000,
  min: 0,
  ...over
});

const tiny = (species: SpeciesDef[], over: Partial<HabitatDef> = {}): HabitatDef => ({
  id: 'pond',
  species,
  conditions: [],
  lightCond: -1,
  inputCond: -1,
  flowCond: -1,
  rainCond: -1,
  decay: 0,
  burial: 0,
  leach: 0,
  evap: 0,
  wMax: 0,
  space: [1_000_000],
  meadow: false,
  ...over
});

const simOf = (b: number[], j: number[][] = b.map(() => []), n = 0, d = 0): Sim => {
  const s: Sim = { week: 0, n, d, w: 0, b, j, seen: b.map(() => 0), imp: 0, exp: 0, wimp: 0, wexp: 0, cond: [] };
  s.imp = total(s);
  return s;
};
const ENV = { light: 1000, input: 0, flow: 0, rain: 0 };

describe('mechanisms (hand-computed)', () => {
  it('Holling II intake for one prey; assimilation to the eater, the rest to dead matter', () => {
    const hab = tiny([sp({ id: 'prey', producer: true }), sp({ id: 'eater', producer: false, mu: 400_000, k: 60_000, eats: [[0, 1000]], assim: 300 })]);
    const s = simOf([40_000, 10_000]);
    stepDay(s, hab, ENV);
    const g = idiv(400_000 * 40_000, 60_000 + 40_000); // 160,000 ppm/day
    const Q = pm(g, 10_000); // 1,600
    expect(s.b[0]).toBe(40_000 - Q);
    expect(s.b[1]).toBe(10_000 + idiv(Q * 300, 1000));
    expect(s.d).toBe(Q - idiv(Q * 300, 1000));
    expect(balanced(s)).toBe(true);
  });

  it('splits the demand by preference-weighted availability; hiding places keep prey out of reach', () => {
    const hab = tiny([
      sp({ id: 'a', producer: true }),
      sp({ id: 'b', producer: true, hide: 5_000 }),
      sp({ id: 'c', producer: false, mu: 1_000_000, k: 100_000, eats: [[0, 1000], [1, 500], [DEAD, 0]], assim: 1000 })
    ]);
    const s = simOf([30_000, 25_000, 10_000], [[], [], []], 0, 7_000);
    stepDay(s, hab, ENV);
    const wA = 30_000;
    const wB = idiv(500 * (25_000 - 5_000), 1000); // 10,000
    const W = wA + wB;
    const Q = pm(idiv(1_000_000 * W, 100_000 + W), 10_000);
    expect(30_000 - s.b[0]!).toBe(idiv(Q * wA, W));
    expect(25_000 - s.b[1]!).toBe(idiv(Q * wB, W));
    expect(s.d).toBe(7_000); // no preference for dead matter: untouched
    // All prey hidden: nothing is eaten.
    const t = simOf([0, 5_000, 10_000]);
    stepDay(t, hab, ENV);
    expect(t.b).toEqual([0, 5_000, 10_000]);
  });

  it('a refuge reduces the intake of sheltered prey', () => {
    const mk = (shelter: number) => {
      const hab = tiny([sp({ id: 'prey', producer: false }), sp({ id: 'plant', producer: true }), sp({ id: 'fish', producer: false, mu: 500_000, k: 50_000, eats: [[0, 1000]], refuge: [0, 1, 20_000], assim: 0 })]);
      const s = simOf([40_000, shelter, 5_000]);
      stepDay(s, hab, ENV);
      return 40_000 - s.b[0]!;
    };
    const open = mk(0);
    const sheltered = mk(60_000);
    expect(sheltered).toBeLessThan(open);
    const w = idiv(40_000 * 20_000, 20_000 + 60_000);
    expect(sheltered).toBe(pm(idiv(500_000 * w, 50_000 + w), 5_000));
  });

  it('maturation delay: what is assimilated in week t joins the adults exactly at the end of week t + D − 1', () => {
    const D = 4;
    const hab = tiny([sp({ id: 'food', producer: false }), sp({ id: 'young', producer: false, mu: 100_000, k: 10_000, eats: [[0, 1000]], assim: 1000, delay: D })]);
    const s = simOf([1_000_000, 50_000], [[], new Array<number>(D).fill(0)]);
    // Week 0: assimilation goes to slot 0; it must stay juvenile through weeks 0…2 and mature at the end of week 3.
    stepWeek(s, hab);
    const fed = s.j[1]![0]!;
    expect(fed).toBeGreaterThan(0);
    expect(s.b[1]).toBe(50_000);
    s.exp += s.b[0]!; // no more food (taken away): later slots stay empty
    s.b[0] = 0;
    stepWeek(s, hab);
    stepWeek(s, hab);
    expect(s.b[1]).toBe(50_000);
    expect(s.j[1]![0]).toBe(fed);
    stepWeek(s, hab);
    expect(s.b[1]).toBe(50_000 + fed);
    expect(s.j[1]![0]).toBe(0);
    expect(balanced(s)).toBe(true);
  });

  it('shading reduces growth (Monod and steep Hill light responses)', () => {
    for (const hillish of [false, true]) {
      const grow = (shade: number) => {
        const hab = tiny([sp({ id: 'p', producer: true, mu: 500_000, k: 10_000, kL: 200_000, hill: hillish, shadedBy: [[1, 1000]] }), sp({ id: 's', producer: true })]);
        const s = simOf([10_000, shade], [[], []], 100_000);
        stepDay(s, hab, ENV);
        return s.b[0]! - 10_000;
      };
      expect(grow(400_000)).toBeLessThan(grow(100_000));
      expect(grow(100_000)).toBeLessThanOrEqual(grow(0));
    }
  });

  it('nitrogen fixation falls as soil nutrients rise and is imported', () => {
    const fixed = (n: number) => {
      const hab = tiny([sp({ id: 'clover', producer: true, mu: 100_000, k: 1_000_000_000, fix: 800, kFix: 30_000 })]);
      const s = simOf([10_000], [[]], n);
      const imp = s.imp;
      stepDay(s, hab, ENV);
      return s.imp - imp;
    };
    expect(fixed(0)).toBeGreaterThan(fixed(30_000));
    expect(fixed(30_000)).toBeGreaterThan(fixed(300_000));
    expect(fixed(0)).toBe(pm(idiv(idiv(100_000 * 800, 1000) * 30_000, 30_000), 10_000));
  });

  it('the flux limiter scales three outflows of an exhausted source to what is there', () => {
    // Nutrient source n = 1,000 drained by two producers and an outflow: the three demands exceed it.
    const hab = tiny([sp({ id: 'a', producer: true, mu: 1_000_000, k: 1 }), sp({ id: 'b', producer: true, mu: 1_000_000, k: 1 })]);
    const s = simOf([3_000, 2_000], [[], []], 1_000);
    const env = { ...ENV, flow: 500_000 };
    const wa = pm(idiv(1_000_000 * sat(1_000, 1), 1000), 3_000);
    const wb = pm(idiv(1_000_000 * sat(1_000, 1), 1000), 2_000);
    const wo = pm(500_000, 1_000);
    const sum = wa + wb + wo;
    expect(sum).toBeGreaterThan(1_000);
    stepDay(s, hab, env);
    expect(s.b[0]).toBe(3_000 + idiv(wa * 1_000, sum));
    expect(s.b[1]).toBe(2_000 + idiv(wb * 1_000, sum));
    expect(s.n).toBe(1_000 - idiv(wa * 1_000, sum) - idiv(wb * 1_000, sum) - idiv(wo * 1_000, sum));
    expect(s.n).toBeGreaterThanOrEqual(0);
    expect(balanced(s)).toBe(true);
  });

  it('weather factors lie in 700–1300, depend only on seed, week and stream, and never on the log', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 520 }), fc.constantFrom(0, 1), (seed, week, stream) => {
        const f = weatherFactor(seed, week, stream);
        expect(Number.isInteger(f)).toBe(true);
        expect(f).toBeGreaterThanOrEqual(700);
        expect(f).toBeLessThanOrEqual(1300);
        expect(weatherFactor(seed, week, stream)).toBe(f);
      })
    );
    const a = simulate(PRESETS['meadow.lively'].sim, 'meadow', [], 30, { seed: 7, weather: true });
    const b = simulate(PRESETS['meadow.lively'].sim, 'meadow', [{ week: 10, kind: 'mow', cuttings: 'leave' }], 30, { seed: 7, weather: true });
    // Same weather before the change; the runs differ only after it.
    expect(b.samples.slice(0, 11)).toEqual(a.samples.slice(0, 11));
    expect(b.samples[11]).not.toEqual(a.samples[11]);
    const calm = simulate(PRESETS['meadow.lively'].sim, 'meadow', [], 30);
    expect(calm.samples).not.toEqual(a.samples);
  });
});

describe('interventions', () => {
  it('add creates the species (seen from then on), remove takes the share of adults and juveniles', () => {
    const s = cloneSim(PRESETS['pond.openfish'].sim);
    applyAction(s, POND, { week: 0, kind: 'add', species: 'pike' });
    expect(s.b[7]).toBe(POND.species[7]!.intro);
    expect(s.seen[7]).toBe(1);
    s.j[6] = [100, 200, 300, 400, 500, 600];
    s.imp = total(s) + s.exp;
    const fish = s.b[6]!;
    const exp = s.exp;
    applyAction(s, POND, { week: 0, kind: 'remove', species: 'minnows', share: 50 });
    expect(s.b[6]).toBe(fish - idiv(fish * 50, 100));
    expect(s.j[6]).toEqual([50, 100, 150, 200, 250, 300]);
    expect(s.exp - exp).toBe(idiv(fish * 50, 100) + 1050);
    expect(balanced(s)).toBe(true);
  });

  it('treat-algae kills 90 % into dead matter; net-algae removes 80 % (with duckweed); spray and mow act on the meadow only', () => {
    const p = cloneSim(PRESETS['pond.lively'].sim);
    const d0 = p.d;
    const a0 = p.b[0]!;
    applyAction(p, POND, { week: 0, kind: 'treat-algae' });
    expect(p.b[0]).toBe(a0 - idiv(a0 * 90, 100));
    expect(p.d - d0).toBe(idiv(a0 * 90, 100) + idiv(PRESETS['pond.lively'].sim.b[1]! * 90, 100));
    const before = cloneSim(p);
    applyAction(p, POND, { week: 0, kind: 'spray' });
    applyAction(p, POND, { week: 0, kind: 'mow', cuttings: 'leave' });
    expect(p).toEqual(before);
    const m = cloneSim(PRESETS['meadow.lively'].sim);
    const g0 = m.b[0]!;
    const e0 = m.exp;
    applyAction(m, MEADOW, { week: 0, kind: 'mow', cuttings: 'remove' });
    expect(m.b[0]).toBe(g0 - idiv(g0 * 70, 100));
    expect(m.exp).toBeGreaterThan(e0);
    const m2 = cloneSim(m);
    applyAction(m2, MEADOW, { week: 0, kind: 'dredge' });
    applyAction(m2, MEADOW, { week: 0, kind: 'net-algae' });
    applyAction(m2, MEADOW, { week: 0, kind: 'treat-algae' });
    expect(m2).toEqual(m);
    expect(balanced(m)).toBe(true);
  });

  it('set changes a condition level only within range', () => {
    const s = cloneSim(PRESETS['pond.lively'].sim);
    applyAction(s, POND, { week: 0, kind: 'set', cond: 1, level: 4 });
    expect(envOf(POND, s).input).toBe(1500);
    applyAction(s, POND, { week: 0, kind: 'set', cond: 1, level: 9 });
    applyAction(s, POND, { week: 0, kind: 'set', cond: 7, level: 0 });
    expect(s.cond).toEqual([0, 4, 0]);
  });
});

describe('runs, samples and settling', () => {
  it('samples[0] is taken before the actions of week 0; actions apply before their week runs', () => {
    const start = PRESETS['pond.lively'].sim;
    const r = simulate(start, 'pond', [{ week: 0, kind: 'treat-algae' }], 2);
    expect(r.samples[0]).toEqual(sample(start));
    expect(r.samples.length).toBe(3);
    const late = simulate(start, 'pond', [{ week: 2, kind: 'treat-algae' }], 2);
    // An action at the last week is applied to the returned state, not to the samples.
    expect(late.sim.b[0]).toBeLessThan(late.samples[2]![0]!);
  });

  it('settledAt and runUntilSettled agree; a still system settles after 8 weeks, a swinging one does not', () => {
    const calm = runUntilSettled(startRun(PRESETS['pond.lively'].sim, POND, []), POND, [], 520);
    expect(calm.settled).toBe(8);
    expect(settledAt(calm.run.samples, 0, 8)).toBe(8);
    const swing = runUntilSettled(startRun(PRESETS['pond.plankton'].sim, POND, [{ week: 0, kind: 'set', cond: 1, level: 4 }]), POND, [{ week: 0, kind: 'set', cond: 1, level: 4 }], 520);
    expect(swing.settled).toBe(-1);
    expect(swing.run.sim.week).toBe(156);
    expect(calmWeek([[100_000], [100_999]], 1, 1)).toBe(true);
    expect(calmWeek([[100_000], [101_011]], 1, 1)).toBe(false);
    expect(calmWeek([[0], [200]], 1, 1)).toBe(true);
    expect(calmWeek([[0], [201]], 1, 1)).toBe(false);
  });

  it('rebaseWeek keeps when juveniles mature', () => {
    const r = simulate(PRESETS['pond.openfish'].sim, 'pond', [{ week: 0, kind: 'add', species: 'pike' }], 13);
    const a = cloneSim(r.sim);
    const b = rebaseWeek(r.sim);
    expect(b.week).toBe(0);
    for (let w = 0; w < 30; w++) {
      stepWeek(a, POND);
      stepWeek(b, POND);
      expect(b.b).toEqual(a.b);
      expect(POND.species.map((_, i) => pop(b, i))).toEqual(POND.species.map((_, i) => pop(a, i)));
    }
  });
});

describe('integer-only model code (§ 7.1)', () => {
  it('uses no exponentiation operator and no floating-point Math functions', () => {
    for (const file of ['model.ts', 'habitats.ts', 'shape.ts', 'score.ts', 'goals.ts', 'challenges.ts', 'spinup.ts']) {
      // Comments may mention them; code may not.
      const code = readFileSync(join(__dirname, '../src', file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      expect(code, file).not.toMatch(/\*\*|Math\.(exp|log|log2|pow|sqrt|cbrt|round|sin|cos|tan|atan2|hypot|random)\b/);
    }
  });
});

// Checksums (FNV-1a of the JSON samples) of 104 weeks from every preset, model eco-1.
const GOLDEN: Record<string, number> = {
  'meadow.bare': 3548208892,
  'meadow.lively': 113100980,
  'meadow.nofox': 1523638937,
  'meadow.poor': 3051514573,
  'pond.bare': 784004465,
  'pond.green': 251631397,
  'pond.lively': 739621043,
  'pond.openfish': 3057551512,
  'pond.plankton': 2783180416,
  'pond.young': 1096650283
};
