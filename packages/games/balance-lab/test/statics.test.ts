import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { naiveBeam, naiveStack } from '../src/naive';
import {
  barNet,
  beamNet,
  beamSides,
  beamVerdict,
  bestOverhang,
  BODY_LENGTH,
  BODY_MASS,
  bodyCentre,
  mobileBars,
  mobileLevel,
  mobileMass,
  mobileVerdicts,
  stackJoints,
  stackVerdict,
  type BeamScene,
  type MobileNode,
  type StackScene
} from '../src/statics';

const beam = (weights: [number, number][], axle = 0, barKg = 0, half = 6): BeamScene => ({ half, axle, barKg, weights: weights.map(([kg, hook]) => ({ kg, hook })) });
const bar = (string: number, hooks: [number, MobileNode | null][]): MobileNode => ({ bar: { width: Math.max(string, ...hooks.map((h) => h[0])), string, hooks: hooks.map(([pos, child]) => ({ pos, child })) } });
const w = (kg: number): MobileNode => ({ kg });

const beamArb = fc.record({
  half: fc.constantFrom(4, 6),
  axle: fc.integer({ min: -2, max: 2 }),
  barKg: fc.integer({ min: 0, max: 8 }),
  weights: fc.array(fc.record({ kg: fc.integer({ min: 1, max: 9 }), hook: fc.integer({ min: -6, max: 6 }) }), { maxLength: 8 })
});

describe('beam statics', () => {
  it('decides hand-computed beams', () => {
    expect(beamNet(beam([[3, -4], [4, 3]]))).toBe(0);
    expect(beamVerdict(beam([[3, -4], [4, 3]]))).toBe('level');
    expect(beamVerdict(beam([[2, -3], [2, -3], [3, 4]]))).toBe('level');
    expect(beamVerdict(beam([[1, -4], [2, 1]]))).toBe('left-down');
    expect(beamVerdict(beam([[5, -1], [1, 6]]))).toBe('right-down');
    // The bar's own weight with an off-centre axle: axle at 2, bar 4 kg at 0 → 4·(0−2) = −8; 2 kg at 6 → 2·4 = 8.
    expect(beamNet(beam([[2, 6]], 2, 4))).toBe(0);
    expect(beamVerdict(beam([[1, 6]], 2, 4))).toBe('left-down');
    expect(beamSides(beam([[3, -2], [1, -4], [2, 3]]))).toEqual({ left: 10, right: 6 });
  });

  it('mirror symmetry swaps the sides', () => {
    fc.assert(
      fc.property(beamArb, (s) => {
        const m: BeamScene = { ...s, axle: -s.axle, weights: s.weights.map((x) => ({ kg: x.kg, hook: -x.hook })) };
        const flip = { 'left-down': 'right-down', level: 'level', 'right-down': 'left-down' } as const;
        expect(beamVerdict(m)).toBe(flip[beamVerdict(s)]);
      })
    );
  });

  it('scaling masses or distances keeps the verdict; superposition; weights at the axle change nothing', () => {
    fc.assert(
      fc.property(beamArb, beamArb, fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 9 }), (a, b, k, kg) => {
        const scaled = { ...a, barKg: a.barKg * k, weights: a.weights.map((x) => ({ ...x, kg: x.kg * k })) };
        expect(beamVerdict(scaled)).toBe(beamVerdict(a));
        const stretched = { ...a, axle: a.axle * k, weights: a.weights.map((x) => ({ ...x, hook: x.hook * k })) };
        expect(beamVerdict(stretched)).toBe(beamVerdict(a));
        const union = { ...a, barKg: 0, weights: [...a.weights, ...b.weights] };
        expect(beamNet(union)).toBe(beamNet({ ...a, barKg: 0 }) + beamNet({ ...b, axle: a.axle, barKg: 0 }));
        expect(beamVerdict({ ...a, weights: [...a.weights, { kg, hook: a.axle }] })).toBe(beamVerdict(a));
      })
    );
  });

  it('the swap rule balances: m kg at d left against d kg at m right', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 6 }), fc.integer({ min: 1, max: 6 }), (m, d) => {
        expect(beamVerdict(beam([[m, -d], [d, m]]))).toBe('level');
      })
    );
  });

  it('moving a weight further out on the side that goes down never levels it', () => {
    fc.assert(
      fc.property(beamArb, (s) => {
        fc.pre(s.axle === 0 && s.weights.length > 0);
        const v = beamVerdict(s);
        fc.pre(v !== 'level');
        const i = s.weights.findIndex((x) => (v === 'right-down' ? x.hook > 0 : x.hook < 0));
        fc.pre(i >= 0);
        const moved = { ...s, weights: s.weights.map((x, j) => (j === i ? { ...x, hook: x.hook + (v === 'right-down' ? 1 : -1) } : x)) };
        expect(beamVerdict(moved)).toBe(v);
      })
    );
  });

  it('the naive rule ignores distances', () => {
    expect(naiveBeam(beam([[3, -4], [4, 3]]))).toBe('right-down');
    expect(naiveBeam(beam([[3, 0], [1, 2]]))).toBe('right-down');
  });
});

describe('mobile statics', () => {
  it('decides one, two and three levels', () => {
    expect(mobileVerdicts(bar(2, [[0, w(3)], [5, w(3)]]))).toEqual(['right-down']);
    expect(mobileVerdicts(bar(2, [[0, w(3)], [4, w(3)]]))).toEqual(['level']);
    const two = bar(1, [[0, w(4)], [3, bar(2, [[0, w(1)], [3, w(2)]])]]);
    // Bottom: 1·(−2) + 2·1 = 0; top: 4·(−1) + 3·2 = 2 → right down.
    expect(mobileVerdicts(two)).toEqual(['right-down', 'level']);
    expect(mobileMass(two)).toBe(7);
    const three = bar(2, [[0, bar(1, [[0, w(2)], [2, w(2)]])], [3, bar(1, [[0, bar(1, [[0, w(2)], [3, w(1)]]), null], [2, null]])]]);
    expect(mobileBars(three)).toHaveLength(4);
    expect(mobileLevel(bar(1, [[0, w(6)], [3, bar(2, [[0, w(1)], [3, w(2)]])]]))).toBe(true);
  });

  it('replacing a level sub-mobile by its total mass changes nothing above', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 4 }), fc.integer({ min: 1, max: 4 }), fc.integer({ min: 1, max: 9 }), fc.integer({ min: 1, max: 3 }), fc.integer({ min: 1, max: 3 }), (a, b, k, l, r) => {
        const sub = bar(a, [[0, w(b * k)], [a + b, w(a * k)]]);
        expect(barNet((sub as { bar: never }).bar)).toBe(0);
        const top = bar(l, [[0, w(3)], [l + r, sub]]);
        const flat = bar(l, [[0, w(3)], [l + r, w(mobileMass(sub))]]);
        expect(mobileVerdicts(top)[0]).toBe(mobileVerdicts(flat)[0]);
      })
    );
  });
});

const stackArb = fc
  .array(fc.record({ kind: fc.constantFrom('block' as const, 'plank' as const, 'stone' as const), shift: fc.integer({ min: -20, max: 20 }) }), { minLength: 1, maxLength: 5 })
  .map((parts) => {
    const bodies = [];
    let prevLeft = -30;
    let prevLen = 24;
    for (const p of parts) {
      const len = BODY_LENGTH[p.kind];
      let left = prevLeft + p.shift;
      left = Math.min(Math.max(left, prevLeft - len + 1), prevLeft + prevLen - 1);
      bodies.push({ kind: p.kind, left });
      prevLeft = left;
      prevLen = len;
    }
    if (bodies[0]!.left > -1) bodies[0]!.left = -1;
    return { bodies, cubes: [] } as StackScene;
  });

describe('stack statics', () => {
  it('decides hand-computed stacks', () => {
    const blocks = (...lefts: number[]): StackScene => ({ bodies: lefts.map((left) => ({ kind: 'block' as const, left })), cubes: [] });
    expect(stackVerdict(blocks(-24, -24)).stands).toBe(true);
    // Edge-exact: one block with its centre exactly at the table edge.
    expect(stackVerdict(blocks(-12))).toMatchObject({ stands: true, edge: true });
    expect(stackVerdict(blocks(-11))).toMatchObject({ stands: false, failing: [{ joint: 0, dir: 'right' }] });
    // Two blocks: the top one's centre 1 cm past the lower one's right end.
    expect(stackVerdict(blocks(-24, -11)).failing).toEqual([{ joint: 1, dir: 'right' }]);
    // Falls left off the lower block.
    expect(stackVerdict(blocks(-20, -33)).failing).toEqual([{ joint: 1, dir: 'left' }]);
    // Two failing joints.
    expect(stackVerdict(blocks(-6, 8)).failing.map((f) => f.joint)).toEqual([0, 1]);
    // The classic greedy stack of four.
    expect(stackVerdict(blocks(...bestOverhang(4).lefts))).toMatchObject({ stands: true, overhang: 25 });
    // A cube saves a stack: block at −10 alone tips right; a 2 kg cube at −20 on it pulls the centre back.
    expect(stackVerdict(blocks(-10)).stands).toBe(false);
    expect(stackVerdict({ ...blocks(-10), cubes: [{ kg: 2, on: 0, x: -7 }] }).stands).toBe(true);
    // A plank with a bucket on its tip and a counterweight.
    const plank: StackScene = { bodies: [{ kind: 'plank', left: -30 }], cubes: [], bucket: { kg: 1, on: 0, x: 17 } };
    expect(stackVerdict(plank).stands).toBe(false);
    expect(stackVerdict({ ...plank, cubes: [{ kg: 2, on: 0, x: -27 }] }).stands).toBe(true);
  });

  it('bestOverhang is 12, 18, 22, 25 and stays below the continuous bound', () => {
    expect([1, 2, 3, 4].map((n) => bestOverhang(n).overhang)).toEqual([12, 18, 22, 25]);
    let h = 0;
    for (let n = 1; n <= 8; n++) {
      h += 1 / n;
      const best = bestOverhang(n);
      expect(best.overhang).toBeLessThanOrEqual(Math.floor(12 * h) + 1);
      expect(stackVerdict({ bodies: best.lefts.map((left) => ({ kind: 'block' as const, left })), cubes: [] }).stands).toBe(true);
    }
  });

  it('two formulations agree, the centre lies within the parts, translation is invariant', () => {
    fc.assert(
      fc.property(stackArb, (s) => {
        for (const j of stackJoints(s)) {
          let a = 0;
          let b = 0;
          const xs: number[] = [];
          for (let i = j.k; i < s.bodies.length; i++) {
            const body = s.bodies[i]!;
            const m = BODY_MASS[body.kind];
            a += m * (bodyCentre(body) - j.lo);
            b += m * (bodyCentre(body) - j.hi);
            xs.push(bodyCentre(body));
          }
          expect(a >= 0 && b <= 0).toBe(j.holds);
          expect(j.S).toBeGreaterThanOrEqual(Math.min(...xs) * j.M);
          expect(j.S).toBeLessThanOrEqual(Math.max(...xs) * j.M);
        }
        const v = stackVerdict(s);
        expect(v.stands).toBe(stackJoints(s).every((j) => j.holds));
      })
    );
  });

  it('every-body-centred stacks stand', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom('block' as const, 'stone' as const), { minLength: 1, maxLength: 5 }), (kinds) => {
        expect(stackVerdict({ bodies: kinds.map((kind) => ({ kind, left: -30 })), cubes: [] }).stands).toBe(true);
      })
    );
  });

  it('the naive stack rule looks only locally', () => {
    expect(naiveStack({ bodies: [{ kind: 'block', left: -14 }, { kind: 'block', left: -4 }], cubes: [] })).toBe('stands');
    expect(stackVerdict({ bodies: [{ kind: 'block', left: -14 }, { kind: 'block', left: -4 }], cubes: [] }).stands).toBe(false);
    expect(naiveStack({ bodies: [{ kind: 'block', left: -21 }, { kind: 'block', left: -17 }, { kind: 'block', left: -11 }, { kind: 'block', left: 1 }], cubes: [] })).toBe('right');
  });
});
