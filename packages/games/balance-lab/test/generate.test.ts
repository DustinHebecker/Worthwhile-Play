import { createRng } from '@wp/game-core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { goalMet } from '../src/check';
import {
  benchOf,
  BUCKET_MIN_X,
  EASY_LEVEL_SHARE,
  buildPool,
  counterSavable,
  cubeClear,
  cubeSpots,
  DIFFICULTIES,
  freeCubeSpots,
  generateRound,
  generateTask,
  isPredict,
  predictNeeds,
  roundPlan,
  SIDES,
  STACK_ANSWERS,
  TASK_IDS,
  type BenchSetting,
  type Difficulty,
  type TaskId,
  type TasksSetting
} from '../src/generate';
import { naiveBar, naiveBeam, naiveStack } from '../src/naive';
import { beamAxleSolutions, beamHookSolutions, countHangSolutions } from '../src/solve';
import { moveBody } from '../src/rules';
import { barNet, beamVerdict, bodyRight, CUBE_WIDTH, mobileBars, sideOf, stackContactsOk, stackVerdict, type StackCube, type StackScene } from '../src/statics';

const diff = fc.constantFrom<Difficulty>(...DIFFICULTIES);
const seed = fc.integer({ min: 0, max: 0xffffffff });

describe('generation', () => {
  it('is deterministic and has the round length', () => {
    fc.assert(
      fc.property(seed, diff, fc.constantFrom<BenchSetting>('mixed', 'beam', 'mobile', 'stack'), fc.constantFrom<TasksSetting>('mixed', 'predict', 'build'), (s, d, b, t) => {
        const a = generateRound(createRng(s), b, t, d);
        expect(generateRound(createRng(s), b, t, d)).toEqual(a);
        expect(a).toHaveLength(6);
        if (b !== 'mixed') expect(a.every((x) => benchOf(x.id) === b)).toBe(true);
        if (t === 'predict') expect(a.every((x) => isPredict(x.id))).toBe(true);
        if (t === 'build') expect(a.some((x) => isPredict(x.id))).toBe(false);
      }),
      { numRuns: 40 }
    );
  });

  it('mixed rounds alternate benches and kinds, predict first', () => {
    expect(roundPlan(createRng(1), 'mixed', 'mixed', 'easy').map((id) => [benchOf(id), isPredict(id)])).toEqual([
      ['beam', true],
      ['stack', false],
      ['mobile', true],
      ['beam', false],
      ['stack', true],
      ['mobile', false]
    ]);
    // A bench's build pool is used up before a task id repeats.
    const ids = roundPlan(createRng(5), 'beam', 'build', 'hard');
    expect(new Set(ids.slice(0, 3)).size).toBe(3);
    expect(buildPool('beam', 'hard')).toContain('beam-axle');
  });

  it('every build task: the witness meets the goal, the start does not, unique tasks have one answer', () => {
    fc.assert(
      fc.property(seed, diff, fc.constantFrom(...TASK_IDS.filter((id) => !isPredict(id))), (s, d, id) => {
        const t = generateTask(createRng(s), id, d);
        expect(t.witness).not.toBeNull();
        expect(goalMet(t, t.witness!)).toBe(true);
        expect(goalMet(t, t.scene)).toBe(false);
        if (t.scene.bench === 'beam' && id === 'beam-hook') expect(beamHookSolutions(t.scene.s, t.tray[0]!)).toHaveLength(1);
        if (t.scene.bench === 'beam' && id === 'beam-axle') expect(beamAxleSolutions(t.scene.s)).toHaveLength(1);
        if (t.scene.bench === 'beam' && t.goal?.kind === 'choose') {
          const sc = t.scene.s;
          const hook = t.goal.hook;
          const fits = t.tray.filter((kg) => goalMet(t, { bench: 'beam', s: { ...sc, weights: [...sc.weights, { kg, hook, free: true }] } }));
          expect(fits).toHaveLength(1);
          expect(new Set(t.tray).size).toBe(t.tray.length);
        }
        if (t.scene.bench === 'mobile' && id === 'mobile-hang') expect(countHangSolutions(t.scene.s, t.tray)).toBe(1);
        if (t.witness!.bench === 'mobile' && id === 'mobile-string')
          for (const bar of mobileBars(t.witness!.s)) {
            const holes = Array.from({ length: bar.width + 1 }, (_, at) => at).filter((at) => bar.hooks.every((h) => h.pos !== at) && barNet({ ...bar, string: at }) === 0);
            expect(holes).toEqual([bar.string]);
          }
        if (t.scene.bench === 'stack') expect(stackContactsOk(t.witness!.s as never)).toBe(true);
        for (const kg of t.tray) expect(kg >= 1 && kg <= 9).toBe(true);
      }),
      { numRuns: 150 }
    );
  });

  it('predict answers agree with the statics; traps beat the naive rule; exact cases are exact', () => {
    fc.assert(
      fc.property(seed, diff, fc.constantFrom('beam-predict' as const, 'mobile-predict' as const, 'stack-predict' as const), fc.boolean(), fc.boolean(), (s, d, id, trap, exact) => {
        const t = generateTask(createRng(s), id, d, { trap, exact: exact && (d !== 'easy' || id !== 'stack-predict') });
        const sc = t.scene;
        // An exact lever or mobile item stays level but looks unbalanced (the kilograms per side differ), on every level.
        if (exact && sc.bench === 'beam') expect([beamVerdict(sc.s), naiveBeam(sc.s) === 'level']).toEqual(['level', false]);
        if (exact && sc.bench === 'mobile') expect([sideOf(barNet(mobileBars(sc.s)[t.marked!]!)), naiveBar(mobileBars(sc.s)[t.marked!]!) === 'level']).toEqual(['level', false]);
        if (sc.bench === 'beam') {
          expect(SIDES[t.answer!]).toBe(beamVerdict(sc.s));
          if (trap) expect(naiveBeam(sc.s)).not.toBe(beamVerdict(sc.s));
        } else if (sc.bench === 'mobile') {
          const bar = mobileBars(sc.s)[t.marked!]!;
          expect(SIDES[t.answer!]).toBe(sideOf(barNet(bar)));
          if (trap) expect(naiveBar(bar)).not.toBe(sideOf(barNet(bar)));
        } else {
          const v = stackVerdict(sc.s);
          expect(v.failing.length).toBeLessThanOrEqual(1);
          expect(STACK_ANSWERS[t.answer!]).toBe(v.stands ? 'stands' : v.failing[0]!.dir);
          if (trap) expect(naiveStack(sc.s)).not.toBe(STACK_ANSWERS[t.answer!]);
          expect(stackContactsOk(sc.s)).toBe(true);
        }
      }),
      { numRuns: 150 }
    );
  });

  it('trap shares and exact cases per round', () => {
    expect([0, 1, 2].map((p) => predictNeeds(p, 3, 'easy'))).toEqual([
      { trap: true, exact: false },
      { trap: false, exact: false },
      { trap: false, exact: false }
    ]);
    expect([0, 1, 2].map((p) => predictNeeds(p, 3, 'hard'))).toEqual([
      { trap: true, exact: false },
      { trap: false, exact: true },
      { trap: true, exact: false }
    ]);
  });
});

describe('cubes keep clear of each other (shapes and kg labels never overlap)', () => {
  /** Two cubes on one body either share a spot (and stack) or sit at least a cube's width apart. */
  const clearOfEachOther = (cubes: readonly StackCube[]) =>
    cubes.every((a, i) => cubes.every((b, j) => i === j || a.on !== b.on || a.x === b.x || Math.abs(a.x - b.x) >= CUBE_WIDTH));

  it('freeCubeSpots leaves out the spots closer to a cube than its width, but keeps its own spot', () => {
    const scene: StackScene = { bodies: [{ kind: 'plank', left: -30 }], cubes: [{ kg: 2, on: 0, x: 0, free: true }] };
    const free = freeCubeSpots(scene, 0);
    expect(cubeSpots(scene, 0)).toHaveLength(43);
    expect(free).toHaveLength(43 - 10);
    for (const x of [-5, -1, 1, 5]) expect(free, `x = ${x}`).not.toContain(x);
    for (const x of [-6, 0, 6, -27, 15]) expect(free, `x = ${x}`).toContain(x);
    // The moved cube itself is ignored; cubes on another body never matter.
    expect(freeCubeSpots(scene, 0, 0)).toEqual(cubeSpots(scene, 0));
    expect(cubeClear({ ...scene, cubes: [{ kg: 2, on: 1, x: 0 }] }, 0, 3)).toBe(true);
  });

  it('in every generated stack scene and witness', () => {
    fc.assert(
      fc.property(seed, diff, fc.constantFrom<TaskId>('stack-predict', 'stack-counter'), fc.boolean(), (s, d, id, trap) => {
        const task = generateTask(createRng(s), id, d, { trap, exact: false });
        for (const sc of [task.scene, task.witness]) if (sc?.bench === 'stack') expect(clearOfEachOther(sc.s.cubes), JSON.stringify(sc.s.cubes)).toBe(true);
      }),
      { numRuns: 300 }
    );
  });

  it('stacked cubes weigh like one cube of their total mass at that spot (the physics is unchanged)', () => {
    const plank: StackScene = { bodies: [{ kind: 'plank', left: -30 }], cubes: [], bucket: { kg: 3, on: 0, x: 16 } };
    const stacked = stackVerdict({ ...plank, cubes: [{ kg: 2, on: 0, x: -24 }, { kg: 2, on: 0, x: -24 }] });
    const one = stackVerdict({ ...plank, cubes: [{ kg: 4, on: 0, x: -24 }] });
    expect(stacked).toEqual(one);
  });
});

describe('hard stack-counter: the plank slides too (owner decision 2026-10-29)', () => {
  it('starts further out, where no placement of the cubes holds it; sliding it back to the witness works', () => {
    fc.assert(
      fc.property(seed, (s) => {
        const t = generateTask(createRng(s), 'stack-counter', 'hard');
        const start = t.scene.s as StackScene;
        const witness = t.witness!.s as StackScene;
        expect(t.tray).toHaveLength(3);
        expect(start.cubes).toEqual([]);
        expect(stackVerdict(start).stands).toBe(false);
        expect(counterSavable(start, t.tray)).toBe(false);
        expect(stackVerdict(witness).stands).toBe(true);
        expect(start.bodies[0]!.left).toBeGreaterThan(witness.bodies[0]!.left);
        expect(start.bodies[0]!.left).toBeLessThanOrEqual(-6);
        for (const sc of [start, witness]) {
          expect(sc.bucket!.x).toBe(bodyRight(sc.bodies[0]!) - 2);
          expect(sc.bucket!.x).toBeGreaterThanOrEqual(BUCKET_MIN_X);
        }
        // The plank can be slid from the start to the witness's place (with the bucket); the cubes then hold it.
        const slid = moveBody(start, 0, witness.bodies[0]!.left - start.bodies[0]!.left)!;
        expect(slid).not.toBeNull();
        expect({ ...slid, cubes: witness.cubes }).toEqual(witness);
      }),
      { numRuns: 120 }
    );
  });

  it('medium and easy keep the plank where it is (the witness only adds cubes)', () => {
    fc.assert(
      fc.property(seed, fc.constantFrom<Difficulty>('easy', 'medium'), (s, d) => {
        const t = generateTask(createRng(s), 'stack-counter', d);
        expect((t.witness!.s as StackScene).bodies).toEqual((t.scene.s as StackScene).bodies);
        expect((t.witness!.s as StackScene).bucket).toEqual((t.scene.s as StackScene).bucket);
      }),
      { numRuns: 60 }
    );
  });

  it('counterSavable: all cubes at the inner end of the plank is the best placement', () => {
    const scene: StackScene = { bodies: [{ kind: 'plank', left: -20 }], cubes: [], bucket: { kg: 2, on: 0, x: 26 } };
    // Plank 2 kg at 4, bucket 2 kg at 26: Σ m·x = 60; cubes at -17 hold it once they weigh at least 60 / 17 kg.
    expect(counterSavable(scene, [1, 2])).toBe(false);
    expect(counterSavable(scene, [2, 2])).toBe(true);
  });
});

describe('"Stays level" on easy (owner decision 2026-10-29)', () => {
  const label = (t: { id: TaskId; answer: number | null }) => (benchOf(t.id) === 'stack' ? STACK_ANSWERS[t.answer!]! : SIDES[t.answer!]!);

  it('about one in six easy lever and mobile predict items is an exact balance', () => {
    let lever = 0;
    let level = 0;
    for (let s = 0; s < 400; s++)
      for (const bench of ['beam', 'mobile', 'mixed'] as const)
        for (const t of generateRound(createRng(s * 7 + 1), bench, 'predict', 'easy'))
          if (benchOf(t.id) !== 'stack') {
            lever++;
            if (label(t) === 'level') level++;
          }
    const share = level / lever;
    expect(EASY_LEVEL_SHARE).toBeCloseTo(1 / 6, 9);
    // The balance rule below vetoes a few, so the share stays a little under one in six.
    expect(share).toBeGreaterThan(0.1);
    expect(share).toBeLessThan(1 / 6 + 0.03);
  });

  it('keeps the answer balance in every predict round: no option right for more than half, never three equal in a row', () => {
    fc.assert(
      fc.property(seed, diff, fc.constantFrom<BenchSetting>('mixed', 'beam', 'mobile', 'stack'), (s, d, b) => {
        const answers = generateRound(createRng(s), b, 'predict', d).map(label);
        for (const a of new Set(answers)) expect(answers.filter((x) => x === a).length, answers.join()).toBeLessThanOrEqual(answers.length / 2);
        for (let i = 2; i < answers.length; i++) expect(answers[i] === answers[i - 1] && answers[i] === answers[i - 2], answers.join()).toBe(false);
      }),
      { numRuns: 300 }
    );
  });

  it('an easy round with three lever items may now contain one "Stays level", never two', () => {
    let seen = false;
    for (let s = 0; s < 300; s++) {
      const answers = generateRound(createRng(s), 'beam', 'mixed', 'easy').filter((t) => isPredict(t.id)).map(label);
      expect(answers.filter((a) => a === 'level').length).toBeLessThanOrEqual(1);
      seen ||= answers.includes('level');
    }
    expect(seen).toBe(true);
  });
});
