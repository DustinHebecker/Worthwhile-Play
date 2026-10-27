/**
 * Task generation (design §§ 9–10): pure functions of the rng, the difficulty and the task id. Build tasks are made
 * solution-first and their witness is checked by the statics core; unique-answer tasks are checked by `solve.ts`.
 */
import type { Rng } from '@wp/game-core';
import { naiveBar, naiveBeam, naiveStack, type StackAnswer } from './naive';
import { beamAxleSolutions, beamHookSolutions, countHangSolutions, fillSlots } from './solve';
import {
  barNet,
  beamMoments,
  beamNet,
  beamVerdict,
  bestOverhang,
  BODY_LENGTH,
  bodyRight,
  CUBE_WIDTH,
  isBar,
  mobileBars,
  mobileMass,
  sideOf,
  stackContactsOk,
  stackJoints,
  stackVerdict,
  type BeamScene,
  type BodyKind,
  type MobileNode,
  type Side,
  type StackBody,
  type StackCube,
  type StackScene
} from './statics';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Bench = 'beam' | 'mobile' | 'stack';
export const BENCHES: readonly Bench[] = ['beam', 'mobile', 'stack'];
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export const TASK_IDS = ['beam-predict', 'beam-hook', 'beam-weights', 'beam-axle', 'mobile-predict', 'mobile-hang', 'stack-predict', 'stack-overhang', 'stack-counter'] as const;
export type TaskId = (typeof TASK_IDS)[number];

export type Scene = { bench: 'beam'; s: BeamScene } | { bench: 'mobile'; s: MobileNode } | { bench: 'stack'; s: StackScene };
export type Goal = { kind: 'level' } | { kind: 'stand' } | { kind: 'overhang'; cm: number; best: number };

export interface TaskSpec {
  id: TaskId;
  scene: Scene;
  /** kg of the parts to place (weights or cubes). */
  tray: number[];
  /** Build tasks: what "solved" means; predict tasks: null. */
  goal: Goal | null;
  /** Build tasks: one valid solution. */
  witness: Scene | null;
  /** Predict: the index of the right option (beam/mobile: left-down, level, right-down; stack: stands, left, right). */
  answer: number | null;
  /** mobile-predict: the bar asked about (depth-first index). */
  marked: number | null;
}

export const benchOf = (id: TaskId): Bench => id.split('-')[0] as Bench;
export const isPredict = (id: TaskId): boolean => id.endsWith('-predict');

export const SIDES: readonly Side[] = ['left-down', 'level', 'right-down'];
export const STACK_ANSWERS: readonly StackAnswer[] = ['stands', 'left', 'right'];

/** Build pools per bench and difficulty (design § 10.3; `beam-choose` and `mobile-string` not built yet). */
export function buildPool(bench: Bench, difficulty: Difficulty): TaskId[] {
  if (bench === 'beam') return difficulty === 'hard' ? ['beam-hook', 'beam-weights', 'beam-axle'] : ['beam-hook', 'beam-weights'];
  if (bench === 'mobile') return ['mobile-hang'];
  return ['stack-overhang', 'stack-counter'];
}

export const ROUND_LENGTH = 6;
const TRIES = 200;

const P = {
  easy: { half: 4, weights: [2, 3], maxKg: 4, margin: 0.25, mobileKg: 6, stackBodies: [2, 3], cubes: 1, stackMargin: 0.2 },
  medium: { half: 6, weights: [3, 5], maxKg: 6, margin: 0.08, mobileKg: 6, stackBodies: [3, 4], cubes: 2, stackMargin: 0.05 },
  hard: { half: 6, weights: [4, 7], maxKg: 9, margin: 0, mobileKg: 9, stackBodies: [4, 5], cubes: 3, stackMargin: 0 }
} as const;

export interface PredictNeeds {
  /** A naive rule must give the wrong answer. */
  trap: boolean;
  /** An exact balance (beam/mobile) or an edge case (stack). */
  exact: boolean;
}

/* ---------------- Beam ---------------- */

function randomBeamWeights(rng: Rng, half: number, count: number, maxKg: number, axle = 0): { kg: number; hook: number }[] {
  const out: { kg: number; hook: number }[] = [];
  while (out.length < count) {
    const hook = rng.int(-half, half);
    if (hook === axle || out.filter((w) => w.hook === hook).length >= 3) continue;
    out.push({ kg: rng.int(1, maxKg), hook });
  }
  return out;
}

export function beamMargin(scene: BeamScene): number {
  const m = beamMoments(scene);
  const total = [...m.weights, m.bar].reduce((a, b) => a + Math.abs(b), 0);
  return total === 0 ? 0 : Math.abs(beamNet(scene)) / total;
}

const FALLBACK_BEAM: BeamScene = { half: 4, axle: 0, barKg: 0, weights: [{ kg: 3, hook: -4 }, { kg: 4, hook: 3 }] };

export function beamPredict(rng: Rng, d: Difficulty, needs: PredictNeeds): TaskSpec {
  const p = P[d];
  for (let i = 0; i < TRIES * 2; i++) {
    const hard = d === 'hard' && rng.next() < 0.5;
    const axle = hard ? rng.int(-2, 2) : 0;
    const count = rng.int(p.weights[0], p.weights[1]);
    const scene: BeamScene = { half: p.half, axle, barKg: hard ? rng.int(2, 6) : 0, weights: randomBeamWeights(rng, p.half, needs.exact ? count - 1 : count, p.maxKg, axle) };
    if (needs.exact) {
      // Exact balances are rare among random scenes: complete the scene with one weight that levels it.
      const net = beamNet(scene);
      const options: { kg: number; hook: number }[] = [];
      for (let hook = -p.half; hook <= p.half; hook++) {
        const d = hook - axle;
        if (d === 0 || scene.weights.filter((w) => w.hook === hook).length >= 3) continue;
        if ((-net) % d === 0 && -net / d >= 1 && -net / d <= p.maxKg) options.push({ kg: -net / d, hook });
      }
      if (options.length === 0) continue;
      scene.weights.push(rng.pick(options));
    }
    const v = beamVerdict(scene);
    if (needs.exact !== (v === 'level')) continue;
    if (!needs.exact && beamMargin(scene) < p.margin) continue;
    if (needs.trap && naiveBeam(scene) === v) continue;
    return predictTask('beam-predict', { bench: 'beam', s: scene }, SIDES.indexOf(v), null);
  }
  return predictTask('beam-predict', { bench: 'beam', s: { ...FALLBACK_BEAM, half: p.half } }, 1, null);
}

const predictTask = (id: TaskId, scene: Scene, answer: number, marked: number | null): TaskSpec => ({ id, scene, tray: [], goal: null, witness: null, answer, marked });

export function beamHook(rng: Rng, d: Difficulty): TaskSpec {
  const p = P[d];
  for (let i = 0; i < TRIES; i++) {
    const kg = rng.int(1, p.maxKg);
    const scene: BeamScene = { half: p.half, axle: 0, barKg: 0, weights: randomBeamWeights(rng, p.half, rng.int(p.weights[0], p.weights[1]), p.maxKg) };
    if (beamNet(scene) === 0) continue;
    const sols = beamHookSolutions(scene, kg);
    if (sols.length !== 1) continue;
    return buildTask('beam-hook', { bench: 'beam', s: scene }, [kg], { bench: 'beam', s: { ...scene, weights: [...scene.weights, { kg, hook: sols[0]!, free: true }] } });
  }
  const scene: BeamScene = { half: p.half, axle: 0, barKg: 0, weights: [{ kg: 2, hook: -4 }] };
  return buildTask('beam-hook', { bench: 'beam', s: scene }, [2], { bench: 'beam', s: { ...scene, weights: [...scene.weights, { kg: 2, hook: 4, free: true }] } });
}

const buildTask = (id: TaskId, scene: Scene, tray: number[], witness: Scene, goal: Goal = { kind: 'level' }): TaskSpec => ({ id, scene, tray, goal, witness, answer: null, marked: null });

export function beamWeights(rng: Rng, d: Difficulty): TaskSpec {
  const p = P[d];
  const k = d === 'easy' ? 1 : d === 'medium' ? 2 : 3;
  const n = d === 'easy' ? 3 : d === 'medium' ? 5 : 6;
  for (let i = 0; i < TRIES; i++) {
    const ws = randomBeamWeights(rng, p.half, n - 1, p.maxKg);
    const net = beamNet({ half: p.half, axle: 0, barKg: 0, weights: ws });
    const options: { kg: number; hook: number }[] = [];
    for (let hook = -p.half; hook <= p.half; hook++) {
      if (hook === 0 || ws.filter((w) => w.hook === hook).length >= 3) continue;
      if ((-net) % hook === 0 && -net / hook >= 1 && -net / hook <= p.maxKg) options.push({ kg: -net / hook, hook });
    }
    if (options.length === 0) continue;
    const all = rng.shuffle([...ws, rng.pick(options)]);
    const fixed = all.slice(k);
    const scene: BeamScene = { half: p.half, axle: 0, barKg: 0, weights: fixed };
    if (beamNet(scene) === 0) continue;
    const moved = all.slice(0, k);
    return buildTask('beam-weights', { bench: 'beam', s: scene }, moved.map((w) => w.kg).sort((a, b) => a - b), { bench: 'beam', s: { ...scene, weights: [...fixed, ...moved.map((w) => ({ ...w, free: true }))] } });
  }
  return beamHook(rng, d);
}

export function beamAxle(rng: Rng, d: Difficulty): TaskSpec {
  const p = P[d];
  for (let i = 0; i < TRIES; i++) {
    const scene: BeamScene = { half: p.half, axle: 0, barKg: rng.int(2, 8), weights: randomBeamWeights(rng, p.half, rng.int(3, 5), p.maxKg, Number.NaN) };
    const sols = beamAxleSolutions(scene);
    if (sols.length !== 1 || sols[0] === 0 || Math.abs(sols[0]!) > p.half - 1) continue;
    if (scene.weights.some((w) => w.hook === sols[0])) continue;
    return { ...buildTask('beam-axle', { bench: 'beam', s: scene }, [], { bench: 'beam', s: { ...scene, axle: sols[0]! } }) };
  }
  const scene: BeamScene = { half: p.half, axle: 0, barKg: 4, weights: [{ kg: 2, hook: 6 }] };
  return buildTask('beam-axle', { bench: 'beam', s: scene }, [], { bench: 'beam', s: { ...scene, axle: 2 } });
}

/* ---------------- Mobile ---------------- */

type Shape = 'w' | [Shape, Shape];
const SHAPES: Record<Difficulty, Shape[]> = {
  easy: [['w', 'w'], ['w', ['w', 'w']], [['w', 'w'], 'w']],
  medium: [['w', ['w', 'w']], [['w', 'w'], 'w']],
  hard: [[['w', 'w'], ['w', 'w']], ['w', ['w', ['w', 'w']]], [[['w', 'w'], 'w'], 'w'], ['w', [['w', 'w'], 'w']]]
};

/** A level mobile of the given shape and total mass, or null (non-integer or out-of-range masses). */
function balancedMobile(rng: Rng, shape: Shape, total: number, maxKg: number, distinctArms: boolean): MobileNode | null {
  if (shape === 'w') return total >= 1 && total <= maxKg ? { kg: total } : null;
  const a = rng.int(1, 3);
  let b = rng.int(1, 3);
  if (distinctArms) while (b === a) b = rng.int(1, 3);
  if ((total * b) % (a + b) !== 0) return null;
  const left = balancedMobile(rng, shape[0], (total * b) / (a + b), maxKg, distinctArms);
  const right = balancedMobile(rng, shape[1], (total * a) / (a + b), maxKg, distinctArms);
  if (!left || !right) return null;
  return { bar: { width: a + b, string: a, hooks: [{ pos: 0, child: left }, { pos: a + b, child: right }] } };
}

function randomMobile(rng: Rng, shape: Shape, maxKg: number): MobileNode {
  if (shape === 'w') return { kg: rng.int(1, maxKg) };
  const a = rng.int(1, 3);
  const b = rng.int(1, 3);
  return { bar: { width: a + b, string: a, hooks: [{ pos: 0, child: randomMobile(rng, shape[0], maxKg) }, { pos: a + b, child: randomMobile(rng, shape[1], maxKg) }] } };
}

function leaves(node: MobileNode): number[] {
  if (!isBar(node)) return [node.kg];
  return node.bar.hooks.flatMap((h) => (h.child ? leaves(h.child) : []));
}

/** The mobile with every weight removed (empty hooks). */
export function emptied(node: MobileNode): MobileNode {
  if (!isBar(node)) return node;
  return { bar: { ...node.bar, hooks: node.bar.hooks.map((h) => ({ pos: h.pos, child: h.child === null || !isBar(h.child) ? null : emptied(h.child) })) } };
}

export function barMargin(node: MobileNode, index: number): number {
  const bar = mobileBars(node)[index];
  if (!bar) return 0;
  const total = bar.hooks.reduce((s, h) => s + Math.abs(mobileMass(h.child) * (h.pos - bar.string)), 0);
  return total === 0 ? 0 : Math.abs(barNet(bar)) / total;
}

export function mobileHang(rng: Rng, d: Difficulty): TaskSpec {
  const p = P[d];
  for (let i = 0; i < TRIES; i++) {
    const shape = rng.pick(SHAPES[d]);
    const mobile = balancedMobile(rng, shape, rng.int(4, p.mobileKg * 3), p.mobileKg, d === 'hard');
    if (!mobile) continue;
    const kgs = leaves(mobile);
    if (new Set(kgs).size < Math.min(d === 'easy' ? 2 : 3, kgs.length)) continue;
    const empty = emptied(mobile);
    const tray = [...kgs].sort((a, b) => a - b);
    if (countHangSolutions(empty, tray) !== 1) continue;
    return buildTask('mobile-hang', { bench: 'mobile', s: empty }, tray, { bench: 'mobile', s: fillSlots(empty, kgs) });
  }
  const empty: MobileNode = { bar: { width: 3, string: 1, hooks: [{ pos: 0, child: null }, { pos: 3, child: null }] } };
  return buildTask('mobile-hang', { bench: 'mobile', s: empty }, [2, 4], { bench: 'mobile', s: fillSlots(empty, [4, 2]) });
}

export function mobilePredict(rng: Rng, d: Difficulty, needs: PredictNeeds): TaskSpec {
  const p = P[d];
  for (let i = 0; i < TRIES * 2; i++) {
    const shape = rng.pick(SHAPES[d]);
    const mobile = needs.exact ? balancedMobile(rng, shape, rng.int(4, p.mobileKg * 3), p.mobileKg, false) : randomMobile(rng, shape, p.mobileKg);
    if (!mobile) continue;
    const bars = mobileBars(mobile);
    const marked = d === 'easy' ? 0 : rng.int(0, bars.length - 1);
    const bar = bars[marked]!;
    const v = sideOf(barNet(bar));
    if (needs.exact !== (v === 'level')) continue;
    if (!needs.exact && barMargin(mobile, marked) < p.margin) continue;
    if (needs.trap && naiveBar(bar) === v) continue;
    return predictTask('mobile-predict', { bench: 'mobile', s: mobile }, SIDES.indexOf(v), marked);
  }
  const m: MobileNode = { bar: { width: 3, string: 1, hooks: [{ pos: 0, child: { kg: 4 } }, { pos: 3, child: { kg: 2 } }] } };
  return predictTask('mobile-predict', { bench: 'mobile', s: m }, 1, 0);
}

/* ---------------- Stack ---------------- */

/** The positions (cube centres) where a cube fits on body `on`: inside its top and clear of the body above. */
export function cubeSpots(scene: StackScene, on: number): number[] {
  const b = scene.bodies[on];
  if (!b) return [];
  const above = scene.bodies[on + 1];
  const out: number[] = [];
  for (let x = b.left + CUBE_WIDTH / 2; x <= bodyRight(b) - CUBE_WIDTH / 2; x++) {
    if (above && x + CUBE_WIDTH / 2 > above.left && x - CUBE_WIDTH / 2 < bodyRight(above)) continue;
    out.push(x);
  }
  return out;
}

/** Margin of a stack: the smallest distance of a centre of mass from the nearer contact edge, relative to its width. */
export function stackMargin(scene: StackScene): number {
  let min = Number.POSITIVE_INFINITY;
  for (const j of stackJoints(scene)) {
    const d = Math.min(Math.abs(j.S - j.lo * j.M), Math.abs(j.hi * j.M - j.S)) / j.M;
    min = Math.min(min, d / (j.hi - j.lo));
  }
  return min === Number.POSITIVE_INFINITY ? 0 : min;
}

function randomStack(rng: Rng, d: Difficulty): StackScene {
  const p = P[d];
  const n = rng.int(p.stackBodies[0], p.stackBodies[1]);
  const kinds: BodyKind[] = d === 'easy' ? ['block'] : d === 'medium' ? ['block', 'block', 'plank'] : ['block', 'plank', 'stone'];
  const bodies: StackBody[] = [];
  for (let k = 0; k < n; k++) {
    const kind = rng.pick(kinds);
    const len = BODY_LENGTH[kind];
    if (k === 0) bodies.push({ kind, left: rng.int(-len - 8, -6) });
    else {
      const below = bodies[k - 1]!;
      const centre = below.left + BODY_LENGTH[below.kind] / 2 + rng.int(-14, 14);
      bodies.push({ kind, left: centre - len / 2 });
    }
  }
  const scene: StackScene = { bodies, cubes: [] };
  const cubes = rng.int(0, p.cubes);
  for (let c = 0; c < cubes; c++) {
    const on = rng.int(0, n - 1);
    const spots = cubeSpots(scene, on);
    if (spots.length) scene.cubes.push({ kg: rng.int(1, 4), on, x: rng.pick(spots) });
  }
  return scene;
}

const stackAnswer = (v: { stands: boolean; failing: { dir: 'left' | 'right' }[] }): StackAnswer => (v.stands ? 'stands' : v.failing[0]!.dir);

export function stackPredict(rng: Rng, d: Difficulty, needs: PredictNeeds): TaskSpec {
  const p = P[d];
  for (let i = 0; i < TRIES * 3; i++) {
    const scene = randomStack(rng, d);
    if (needs.exact) {
      // Move the top body so its centre lies exactly over an edge of the body below (no cubes on it).
      const k = scene.bodies.length - 1;
      if (k < 1 || scene.cubes.some((c) => c.on === k)) continue;
      const below = scene.bodies[k - 1]!;
      const top = scene.bodies[k]!;
      const edgeX = rng.next() < 0.5 ? bodyRight(below) : below.left;
      top.left = edgeX - BODY_LENGTH[top.kind] / 2;
      scene.cubes = scene.cubes.filter((c) => cubeSpots(scene, c.on).includes(c.x));
    }
    if (!stackContactsOk(scene)) continue;
    const v = stackVerdict(scene);
    if (v.failing.length > 1) continue;
    if (needs.exact !== v.edge) continue;
    if (!needs.exact && (v.edge || stackMargin(scene) < p.stackMargin)) continue;
    const answer = stackAnswer(v);
    if (needs.trap && naiveStack(scene) === answer) continue;
    return predictTask('stack-predict', { bench: 'stack', s: scene }, STACK_ANSWERS.indexOf(answer), null);
  }
  const scene: StackScene = { bodies: [{ kind: 'block', left: -14 }, { kind: 'block', left: -4 }], cubes: [] };
  return predictTask('stack-predict', { bench: 'stack', s: scene }, 2, null);
}

export const OVERHANG_TARGET: Readonly<Record<Difficulty, number>> = { easy: 15, medium: 20, hard: 25 };
export const OVERHANG_BLOCKS: Readonly<Record<Difficulty, number>> = { easy: 2, medium: 3, hard: 4 };

export function stackOverhang(_rng: Rng, d: Difficulty): TaskSpec {
  const n = OVERHANG_BLOCKS[d];
  const best = bestOverhang(n);
  const scene: StackScene = { bodies: Array.from({ length: n }, () => ({ kind: 'block' as const, left: -36 })), cubes: [] };
  return buildTask('stack-overhang', { bench: 'stack', s: scene }, [], { bench: 'stack', s: { bodies: best.lefts.map((left) => ({ kind: 'block' as const, left })), cubes: [] } }, {
    kind: 'overhang',
    cm: OVERHANG_TARGET[d],
    best: best.overhang
  });
}

export function stackCounter(rng: Rng, d: Difficulty): TaskSpec {
  const k = d === 'easy' ? 1 : d === 'medium' ? 2 : 3;
  for (let i = 0; i < TRIES; i++) {
    const left = rng.int(-40, -22);
    const plank: StackBody = { kind: 'plank', left };
    const scene: StackScene = { bodies: [plank], cubes: [], bucket: { kg: rng.int(1, d === 'easy' ? 2 : 4), on: 0, x: bodyRight(plank) - 2 } };
    if (stackVerdict(scene).stands) continue;
    const spots = cubeSpots(scene, 0);
    const cubes: StackCube[] = Array.from({ length: k }, () => ({ kg: rng.int(1, 4), on: 0, x: rng.pick(spots), free: true }));
    const witness: StackScene = { ...scene, cubes };
    if (!stackVerdict(witness).stands) continue;
    // Not too easy: the cubes placed in the middle of the plank must not already hold it.
    const lazy: StackScene = { ...scene, cubes: cubes.map((c) => ({ ...c, x: plank.left + 24 })) };
    if (stackVerdict(lazy).stands && rng.next() < 0.7) continue;
    return buildTask('stack-counter', { bench: 'stack', s: scene }, cubes.map((c) => c.kg).sort((a, b) => a - b), { bench: 'stack', s: witness }, { kind: 'stand' });
  }
  const scene: StackScene = { bodies: [{ kind: 'plank', left: -30 }], cubes: [], bucket: { kg: 1, on: 0, x: 16 } };
  return buildTask('stack-counter', { bench: 'stack', s: scene }, [2], { bench: 'stack', s: { ...scene, cubes: [{ kg: 2, on: 0, x: -27, free: true }] } }, { kind: 'stand' });
}

/* ---------------- Round ---------------- */

export type TasksSetting = 'mixed' | 'predict' | 'build';
export type BenchSetting = 'mixed' | Bench;

export function generateTask(rng: Rng, id: TaskId, d: Difficulty, needs: PredictNeeds = { trap: false, exact: false }): TaskSpec {
  switch (id) {
    case 'beam-predict':
      return beamPredict(rng, d, needs);
    case 'beam-hook':
      return beamHook(rng, d);
    case 'beam-weights':
      return beamWeights(rng, d);
    case 'beam-axle':
      return beamAxle(rng, d);
    case 'mobile-predict':
      return mobilePredict(rng, d, needs);
    case 'mobile-hang':
      return mobileHang(rng, d);
    case 'stack-predict':
      return stackPredict(rng, d, needs);
    case 'stack-overhang':
      return stackOverhang(rng, d);
    case 'stack-counter':
      return stackCounter(rng, d);
  }
}

/** The task ids of a round (design § 6): benches cycle beam, stack, mobile; mixed tasks alternate, predict first. */
export function roundPlan(rng: Rng, bench: BenchSetting, tasks: TasksSetting, d: Difficulty): TaskId[] {
  const order: Bench[] = bench === 'mixed' ? ['beam', 'stack', 'mobile'] : [bench];
  const pools = new Map<Bench, TaskId[]>();
  const ids: TaskId[] = [];
  for (let i = 0; i < ROUND_LENGTH; i++) {
    const b = order[i % order.length]!;
    const predict = tasks === 'predict' || (tasks === 'mixed' && i % 2 === 0);
    if (predict) {
      ids.push(`${b}-predict` as TaskId);
      continue;
    }
    let pool = pools.get(b);
    if (!pool || pool.length === 0) {
      pool = rng.shuffle(buildPool(b, d));
      pools.set(b, pool);
    }
    ids.push(pool.shift()!);
  }
  return ids;
}

/** Trap and exact-case needs of the p-th predict item of a round (design § 10.2). */
export function predictNeeds(p: number, predictCount: number, d: Difficulty): PredictNeeds {
  return { trap: d === 'easy' ? p % 3 === 0 : p % 2 === 0, exact: d !== 'easy' && predictCount >= 2 && p === 1 };
}

export function generateRound(rng: Rng, bench: BenchSetting, tasks: TasksSetting, d: Difficulty): TaskSpec[] {
  const ids = roundPlan(rng, bench, tasks, d);
  const predictCount = ids.filter(isPredict).length;
  let p = 0;
  return ids.map((id) => generateTask(rng, id, d, isPredict(id) ? predictNeeds(p++, predictCount, d) : undefined));
}
