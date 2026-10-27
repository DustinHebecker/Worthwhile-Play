/**
 * Weight & Balance state and transitions (design § 14). Pure: plain JSON in, plain JSON out. The view calls these
 * and then `requestSave()`.
 */
import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type SettingValue } from '@wp/game-core';
import { goalMet, outcomeOf, trayLeft, type Outcome } from './check';
import {
  BENCHES,
  DIFFICULTIES,
  generateRound,
  isPredict,
  benchOf,
  ROUND_LENGTH,
  SIDES,
  STACK_ANSWERS,
  TASK_IDS,
  cubeSpots,
  type Bench,
  type BenchSetting,
  type Difficulty,
  type Goal,
  type Scene,
  type TaskId,
  type TaskSpec,
  type TasksSetting
} from './generate';
import {
  barNet,
  beamVerdict,
  BODY_LENGTH,
  bodyRight,
  isBar,
  mobileBars,
  mobileDepth,
  sideOf,
  stackContactsOk,
  stackVerdict,
  type BeamScene,
  type BodyKind,
  type MobileNode,
  type StackScene
} from './statics';

export type Status = 'open' | 'solved' | 'solved-with-help' | 'shown' | 'matched' | 'different' | 'skipped';
export const HISTORY_LIMIT = 30;

export interface Item extends TaskSpec {
  draft: Scene;
  history: Scene[];
  /** Predict: the option chosen (not yet committed while `outcome` is null). */
  choice: number | null;
  outcome: Outcome | null;
  status: Status;
  /** Highest hint step used (1 tip, 2 explanations, 3 solution shown). */
  help: number;
}

export interface RoundState {
  v: 1;
  mode: 'round';
  bench: BenchSetting;
  tasks: TasksSetting;
  difficulty: Difficulty;
  seed: number;
  items: Item[];
  index: number;
  reported: boolean;
  whyOpen: boolean;
}

export interface FreeState {
  v: 1;
  mode: 'free';
  bench: Bench;
  seed: number;
  scene: Scene;
  history: Scene[];
  outcome: Outcome | null;
  whyOpen: boolean;
}

export type BalanceState = RoundState | FreeState;

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/* ---------------- Settings ---------------- */

export interface Settings {
  mode: 'round' | 'free';
  bench: BenchSetting;
  tasks: TasksSetting;
  freeBench: Bench;
  difficulty: Difficulty;
}

export function readSettings(settings: Readonly<Record<string, unknown>> | undefined, difficulty: unknown): Settings {
  const s = settings ?? {};
  return {
    mode: isOneOf(s.mode, ['round', 'free'] as const) ? s.mode : 'round',
    bench: isOneOf(s.bench, ['mixed', ...BENCHES] as const) ? s.bench : 'mixed',
    tasks: isOneOf(s.tasks, ['mixed', 'predict', 'build'] as const) ? s.tasks : 'mixed',
    freeBench: isOneOf(s.freeBench, BENCHES) ? s.freeBench : 'beam',
    difficulty: isOneOf(difficulty, DIFFICULTIES) ? difficulty : 'easy'
  };
}

export function settingsOf(state: BalanceState): Record<string, SettingValue> {
  if (state.mode === 'free') return { mode: 'free', freeBench: state.bench };
  return { mode: 'round', bench: state.bench, tasks: state.tasks, difficulty: state.difficulty };
}

/* ---------------- Creation ---------------- */

const toItem = (t: TaskSpec): Item => ({ ...t, draft: clone(t.scene), history: [], choice: null, outcome: null, status: 'open', help: 0 });

export const FREE_FRAMES = 3;

/** Empty scenes of the free bench. */
export function freeScene(bench: Bench): Scene {
  if (bench === 'beam') return { bench: 'beam', s: { half: 6, axle: 0, barKg: 0, weights: [] } };
  if (bench === 'mobile') {
    const sub: MobileNode = { bar: { width: 4, string: 2, hooks: [0, 1, 3, 4].map((pos) => ({ pos, child: null })) } };
    return { bench: 'mobile', s: { bar: { width: 6, string: 3, hooks: [{ pos: 0, child: null }, { pos: 1, child: null }, { pos: 2, child: null }, { pos: 4, child: null }, { pos: 6, child: sub }] } } };
  }
  return { bench: 'stack', s: { bodies: [{ kind: 'block', left: -30 }], cubes: [] } };
}

export function newState(seed: number, s: Settings): BalanceState {
  if (s.mode === 'free') return { v: 1, mode: 'free', bench: s.freeBench, seed, scene: freeScene(s.freeBench), history: [], outcome: null, whyOpen: true };
  const items = generateRound(createRng(seed), s.bench, s.tasks, s.difficulty).map(toItem);
  return { v: 1, mode: 'round', bench: s.bench, tasks: s.tasks, difficulty: s.difficulty, seed, items, index: 0, reported: false, whyOpen: s.difficulty === 'easy' };
}

/* ---------------- Scene edits (pure; return null when not allowed) ---------------- */

export function placeBeam(scene: BeamScene, kg: number, hook: number): BeamScene | null {
  if (!isInt(hook, -scene.half, scene.half) || scene.weights.filter((w) => w.hook === hook).length >= 3 || scene.weights.length >= 12) return null;
  return { ...scene, weights: [...scene.weights, { kg, hook, free: true }] };
}

/** Moves the i-th weight (a free one) to `hook`. */
export function moveBeam(scene: BeamScene, i: number, hook: number): BeamScene | null {
  const w = scene.weights[i];
  if (!w?.free || !isInt(hook, -scene.half, scene.half) || (hook !== w.hook && scene.weights.filter((x) => x.hook === hook).length >= 3)) return null;
  return { ...scene, weights: scene.weights.map((x, j) => (j === i ? { ...x, hook } : x)) };
}

export function unplaceBeam(scene: BeamScene, i: number): BeamScene | null {
  if (!scene.weights[i]?.free) return null;
  return { ...scene, weights: scene.weights.filter((_, j) => j !== i) };
}

export function setAxle(scene: BeamScene, axle: number): BeamScene | null {
  return isInt(axle, -scene.half, scene.half) ? { ...scene, axle } : null;
}

/** The hooks of a mobile, depth-first, with the bar index each belongs to. */
export function mobileHooks(node: MobileNode): { bar: number; hook: number; child: MobileNode | null }[] {
  const out: { bar: number; hook: number; child: MobileNode | null }[] = [];
  let barIndex = 0;
  const walk = (n: MobileNode) => {
    if (!isBar(n)) return;
    const me = barIndex++;
    n.bar.hooks.forEach((h, hook) => {
      out.push({ bar: me, hook, child: h.child });
      if (h.child) walk(h.child);
    });
  };
  walk(node);
  return out;
}

/** Sets the weight on the j-th hook (depth-first, `mobileHooks` order): kg, or null to clear. Only free or empty hooks. */
export function setMobileHook(node: MobileNode, j: number, kg: number | null): MobileNode | null {
  const target = mobileHooks(node)[j];
  if (!target) return null;
  if (target.child && (isBar(target.child) || !target.child.free)) return null;
  if (kg === null && target.child === null) return null;
  let k = 0;
  const walk = (n: MobileNode): MobileNode => {
    if (!isBar(n)) return n;
    return {
      bar: {
        ...n.bar,
        hooks: n.bar.hooks.map((h) => {
          const mine = k++ === j;
          if (mine) return { pos: h.pos, child: kg === null ? null : { kg, free: true } };
          return { pos: h.pos, child: h.child ? walk(h.child) : null };
        })
      }
    };
  };
  return walk(node);
}

/** Moves body k by dx cm; refused when any joint would have less than 1 cm of contact. */
export function moveBody(scene: StackScene, k: number, dx: number): StackScene | null {
  const b = scene.bodies[k];
  if (!b || dx === 0) return null;
  const next: StackScene = { ...scene, bodies: scene.bodies.map((x, i) => (i === k ? { ...x, left: x.left + dx } : x)), cubes: scene.cubes.map((c) => (c.on === k ? { ...c, x: c.x + dx } : c)) };
  if (!stackContactsOk(next) || next.cubes.some((c) => !cubeSpots(next, c.on).includes(c.x))) return null;
  return next;
}

export function placeCube(scene: StackScene, kg: number, on: number, x: number): StackScene | null {
  if (!cubeSpots(scene, on).includes(x) || scene.cubes.length >= 8) return null;
  return { ...scene, cubes: [...scene.cubes, { kg, on, x, free: true }] };
}

export function moveCube(scene: StackScene, i: number, x: number): StackScene | null {
  const c = scene.cubes[i];
  if (!c?.free || !cubeSpots(scene, c.on).includes(x)) return null;
  return { ...scene, cubes: scene.cubes.map((d, j) => (j === i ? { ...d, x } : d)) };
}

export function unplaceCube(scene: StackScene, i: number): StackScene | null {
  if (!scene.cubes[i]?.free) return null;
  return { ...scene, cubes: scene.cubes.filter((_, j) => j !== i) };
}

/** Free bench: a body on top of the stack (aligned with the top one). */
export function addBody(scene: StackScene, kind: BodyKind): StackScene | null {
  if (scene.bodies.length >= 6) return null;
  const top = scene.bodies[scene.bodies.length - 1];
  const left = top ? top.left + BODY_LENGTH[top.kind] / 2 - BODY_LENGTH[kind] / 2 : -30;
  const next = { ...scene, bodies: [...scene.bodies, { kind, left }] };
  return stackContactsOk(next) ? next : null;
}

/** Free bench: removes the top body (and anything on it). */
export function removeTop(scene: StackScene): StackScene | null {
  const k = scene.bodies.length - 1;
  if (k < 1) return null;
  return { ...scene, bodies: scene.bodies.slice(0, k), cubes: scene.cubes.filter((c) => c.on < k) };
}

/** Free and remaining tray parts: the kgs still to place. */
export function trayRemaining(item: Pick<Item, 'tray' | 'draft'>): number[] {
  const left = [...item.tray];
  const used: number[] =
    item.draft.bench === 'beam'
      ? item.draft.s.weights.filter((w) => w.free).map((w) => w.kg)
      : item.draft.bench === 'stack'
        ? item.draft.s.cubes.filter((c) => c.free).map((c) => c.kg)
        : mobileHooks(item.draft.s).flatMap((h) => (h.child && !isBar(h.child) && h.child.free ? [h.child.kg] : []));
  for (const kg of used) {
    const i = left.indexOf(kg);
    if (i >= 0) left.splice(i, 1);
  }
  return left;
}

/* ---------------- Round transitions ---------------- */

export const currentItem = (s: RoundState): Item | undefined => s.items[s.index];
export const isSummary = (s: RoundState): boolean => s.index >= s.items.length;

function withItem(s: RoundState, f: (it: Item) => Item | null): RoundState | null {
  const it = currentItem(s);
  if (!it) return null;
  const next = f(it);
  return next ? { ...s, items: s.items.map((x, i) => (i === s.index ? next : x)) } : null;
}

/** Applies a scene edit to the open build task's draft (undoable). */
export function editDraft(s: RoundState, scene: Scene | null): RoundState | null {
  return withItem(s, (it) => {
    if (it.status !== 'open' || it.outcome !== null || isPredict(it.id) || !scene || !isScene(scene) || same(scene, it.draft)) return null;
    return { ...it, draft: scene, history: [...it.history, it.draft].slice(-HISTORY_LIMIT) };
  });
}

export function undo(s: RoundState): RoundState | null {
  return withItem(s, (it) => {
    if (it.status !== 'open' || it.outcome !== null || it.history.length === 0) return null;
    return { ...it, draft: it.history[it.history.length - 1]!, history: it.history.slice(0, -1) };
  });
}

export function resetTask(s: RoundState): RoundState | null {
  const it = currentItem(s);
  return it ? editDraft(s, clone(it.scene)) : null;
}

export function choose(s: RoundState, choice: number): RoundState | null {
  return withItem(s, (it) => (isPredict(it.id) && it.status === 'open' && isInt(choice, 0, 2) ? { ...it, choice } : null));
}

/** "Let go": predict — commits the choice; build — evaluates the draft (refused while parts are in the tray). */
export function letGo(s: RoundState): RoundState | null {
  return withItem(s, (it) => {
    if (it.status !== 'open' || it.outcome !== null) return null;
    if (isPredict(it.id)) {
      if (it.choice === null) return null;
      return { ...it, outcome: outcomeOf(it.draft), status: it.choice === it.answer ? 'matched' : 'different' };
    }
    if (trayLeft(it, it.draft) > 0) return null;
    const outcome = outcomeOf(it.draft);
    const solved = goalMet(it, it.draft);
    return { ...it, outcome, status: solved ? (it.help >= 2 && s.difficulty !== 'easy' ? 'solved-with-help' : 'solved') : 'open' };
  });
}

export function tryAgain(s: RoundState): RoundState | null {
  return withItem(s, (it) => (it.status === 'open' && it.outcome !== null ? { ...it, outcome: null } : null));
}

export function skip(s: RoundState): RoundState | null {
  return withItem(s, (it) => (isPredict(it.id) && it.status === 'open' ? { ...it, outcome: outcomeOf(it.draft), status: 'skipped' } : null));
}

export function hint(s: RoundState, step: 1 | 2): RoundState | null {
  return withItem(s, (it) => (it.status === 'open' && it.help < step ? { ...it, help: step } : null));
}

export function showSolution(s: RoundState): RoundState | null {
  return withItem(s, (it) => {
    if (it.status !== 'open' || !it.witness) return null;
    return { ...it, draft: clone(it.witness), outcome: outcomeOf(it.witness), status: 'shown', help: 3 };
  });
}

export function next(s: RoundState): RoundState | null {
  const it = currentItem(s);
  if (!it || it.status === 'open') return null;
  return { ...s, index: s.index + 1 };
}

export function markReported(s: RoundState): RoundState | null {
  return isSummary(s) && !s.reported ? { ...s, reported: true } : null;
}

export const toggleWhy = <S extends BalanceState>(s: S, open: boolean): S | null => (s.whyOpen === open ? null : { ...s, whyOpen: open });

export interface Summary {
  predicted: number;
  matched: number;
  skipped: number;
  built: number;
  solved: number;
  withHelp: number;
  overhang: { cm: number; best: number } | null;
  benches: Bench[];
}

export function summarize(s: RoundState): Summary {
  const sum: Summary = { predicted: 0, matched: 0, skipped: 0, built: 0, solved: 0, withHelp: 0, overhang: null, benches: [] };
  for (const it of s.items) {
    if (!sum.benches.includes(benchOf(it.id))) sum.benches.push(benchOf(it.id));
    if (isPredict(it.id)) {
      sum.predicted++;
      if (it.status === 'matched') sum.matched++;
      if (it.status === 'skipped') sum.skipped++;
    } else {
      sum.built++;
      if (it.status === 'solved' || it.status === 'solved-with-help') sum.solved++;
      if (it.status === 'solved-with-help') sum.withHelp++;
      if (it.goal?.kind === 'overhang' && it.outcome?.bench === 'stack' && it.status !== 'shown') sum.overhang = { cm: it.outcome.overhang, best: it.goal.best };
    }
  }
  return sum;
}

/* ---------------- Free bench ---------------- */

export function freeEdit(s: FreeState, scene: Scene | null): FreeState | null {
  if (!scene || !isScene(scene) || same(scene, s.scene)) return null;
  return { ...s, scene, history: [...s.history, s.scene].slice(-HISTORY_LIMIT), outcome: null };
}

export function freeUndo(s: FreeState): FreeState | null {
  if (s.history.length === 0) return null;
  return { ...s, scene: s.history[s.history.length - 1]!, history: s.history.slice(0, -1), outcome: null };
}

export const freeLetGo = (s: FreeState): FreeState | null => (s.outcome ? null : { ...s, outcome: outcomeOf(s.scene) });
export const freeHold = (s: FreeState): FreeState | null => (s.outcome ? { ...s, outcome: null } : null);
export const freeClear = (s: FreeState): FreeState | null => freeEdit(s, freeScene(s.bench));

/* ---------------- Validation (never throws) ---------------- */

const isKg = (x: unknown, max = 9): x is number => isInt(x, 1, max);
const flag = (x: unknown) => x === undefined || x === true;

function isBeamScene(x: unknown): x is BeamScene {
  if (!isRecord(x) || !isOneOf(x.half, [4, 6] as const) || !isInt(x.axle, -x.half, x.half) || !isInt(x.barKg, 0, 8)) return false;
  const half = x.half;
  if (!isArrayOf(x.weights, (w): w is { kg: number; hook: number } => isRecord(w) && isKg(w.kg) && isInt(w.hook, -half, half) && flag(w.free)) || x.weights.length > 12) return false;
  const per = new Map<number, number>();
  for (const w of x.weights) per.set(w.hook, (per.get(w.hook) ?? 0) + 1);
  return [...per.values()].every((n) => n <= 3);
}

function isMobileNode(x: unknown, depth: number): x is MobileNode {
  if (!isRecord(x)) return false;
  if ('kg' in x) return isKg(x.kg) && flag(x.free) && Object.keys(x).every((k) => k === 'kg' || k === 'free');
  const bar = x.bar;
  if (depth >= 3 || !isRecord(bar) || !isInt(bar.width, 1, 8) || !isInt(bar.string, 0, bar.width)) return false;
  const width = bar.width;
  const string = bar.string;
  return (
    isArrayOf(bar.hooks, (h): h is { pos: number; child: MobileNode | null } => isRecord(h) && isInt(h.pos, 0, width) && h.pos !== string && (h.child === null || isMobileNode(h.child, depth + 1))) &&
    bar.hooks.length >= 1 &&
    bar.hooks.length <= 6
  );
}

function isMobile(x: unknown): x is MobileNode {
  if (!isMobileNode(x, 0) || !isBar(x)) return false;
  return mobileBars(x).length <= 3 && mobileHooks(x).filter((h) => h.child && !isBar(h.child)).length <= 8 && mobileDepth(x) <= 3;
}

function isStackScene(x: unknown): x is StackScene {
  if (!isRecord(x)) return false;
  if (!isArrayOf(x.bodies, (b): b is { kind: BodyKind; left: number } => isRecord(b) && isOneOf(b.kind, ['block', 'plank', 'stone'] as const) && isInt(b.left, -200, 200))) return false;
  if (x.bodies.length < 1 || x.bodies.length > 6) return false;
  const n = x.bodies.length;
  if (!isArrayOf(x.cubes, (c): c is { kg: number; on: number; x: number } => isRecord(c) && isKg(c.kg, 4) && isInt(c.on, 0, n - 1) && isInt(c.x, -300, 300) && flag(c.free)) || x.cubes.length > 8) return false;
  if (x.bucket !== undefined && !(isRecord(x.bucket) && isKg(x.bucket.kg, 4) && isInt(x.bucket.on, 0, n - 1) && isInt(x.bucket.x, -300, 300))) return false;
  const scene = x as unknown as StackScene;
  if (!stackContactsOk(scene)) return false;
  if (scene.bucket && scene.bucket.x !== bodyRight(scene.bodies[scene.bucket.on]!) - 2) return false;
  return scene.cubes.every((c) => cubeSpots(scene, c.on).includes(c.x));
}

export function isScene(x: unknown): x is Scene {
  if (!isRecord(x)) return false;
  if (x.bench === 'beam') return isBeamScene(x.s);
  if (x.bench === 'mobile') return isMobile(x.s);
  if (x.bench === 'stack') return isStackScene(x.s);
  return false;
}

/** The scene with every part the player placed taken away (and, for movable parts, compared loosely). */
function fixedPart(scene: Scene, id: TaskId): unknown {
  if (scene.bench === 'beam') return { ...scene.s, axle: id === 'beam-axle' ? 0 : scene.s.axle, weights: scene.s.weights.filter((w) => !w.free) };
  if (scene.bench === 'stack') return { ...scene.s, bodies: id === 'stack-overhang' ? scene.s.bodies.map((b) => b.kind) : scene.s.bodies, cubes: scene.s.cubes.filter((c) => !c.free) };
  const strip = (n: MobileNode): MobileNode => (isBar(n) ? { bar: { ...n.bar, string: id === 'mobile-string' ? 0 : n.bar.string, hooks: n.bar.hooks.map((h) => ({ pos: h.pos, child: h.child && !isBar(h.child) && h.child.free ? null : h.child ? strip(h.child) : null })) } } : n);
  return strip(scene.s);
}

const isGoal = (x: unknown): x is Goal =>
  isRecord(x) && (((x.kind === 'level' || x.kind === 'stand') && Object.keys(x).length === 1) || (x.kind === 'overhang' && isInt(x.cm, 1, 100) && isInt(x.best, 1, 100)) || (x.kind === 'choose' && isInt(x.hook, -6, 6) && x.hook !== 0));

const isOutcome = (x: unknown): boolean => isRecord(x);

function draftFits(it: Item): boolean {
  if (it.draft.bench !== it.scene.bench) return false;
  if (!same(fixedPart(it.draft, it.id), fixedPart(it.scene, it.id))) return false;
  const placed = it.tray.length - trayRemaining(it).length;
  // Every placed part came from the tray (no more parts than the tray holds, and of matching masses).
  const total = it.draft.bench === 'beam' ? it.draft.s.weights.filter((w) => w.free).length : it.draft.bench === 'stack' ? it.draft.s.cubes.filter((c) => c.free).length : mobileHooks(it.draft.s).filter((h) => h.child && !isBar(h.child) && h.child.free).length;
  return placed === total;
}

function isItem(x: unknown, difficulty: Difficulty): x is Item {
  if (!isRecord(x) || !isOneOf(x.id, TASK_IDS)) return false;
  const id = x.id;
  if (!isScene(x.scene) || !isScene(x.draft) || x.scene.bench !== benchOf(id)) return false;
  if (!isArrayOf(x.tray, (k): k is number => isKg(k)) || x.tray.length > 4) return false;
  if (!isArrayOf(x.history, isScene) || x.history.length > HISTORY_LIMIT) return false;
  if (!isInt(x.help, 0, 3) || !(x.choice === null || isInt(x.choice, 0, 2))) return false;
  if (!isOneOf(x.status, ['open', 'solved', 'solved-with-help', 'shown', 'matched', 'different', 'skipped'] as const)) return false;
  if (!(x.outcome === null || isOutcome(x.outcome))) return false;
  const it = x as unknown as Item;
  if (!draftFits(it) || !it.history.every((h) => draftFits({ ...it, draft: h }))) return false;
  if (it.outcome !== null && !same(it.outcome, outcomeOf(it.draft))) return false;
  if (isPredict(id)) {
    if (it.goal !== null || it.witness !== null || it.tray.length !== 0 || !isInt(it.answer, 0, 2) || !same(it.draft, it.scene)) return false;
    const expected = predictAnswer(it);
    if (expected !== it.answer) return false;
    if (it.status === 'open') return it.outcome === null;
    if (it.outcome === null) return false;
    if (it.status === 'skipped') return true;
    if (it.choice === null) return false;
    return it.status === (it.choice === it.answer ? 'matched' : 'different');
  }
  if (!isGoal(it.goal) || !isScene(it.witness) || it.answer !== null || it.marked !== null) return false;
  if (!same(fixedPart(it.witness, id), fixedPart(it.scene, id)) || !goalMet(it, it.witness)) return false;
  if (it.status === 'open') return it.outcome === null || !goalMet(it, it.draft);
  if (it.status === 'shown') return it.help === 3 && same(it.draft, it.witness);
  if (it.status === 'solved' || it.status === 'solved-with-help') {
    if (it.outcome === null || !goalMet(it, it.draft)) return false;
    return it.status === (it.help >= 2 && difficulty !== 'easy' ? 'solved-with-help' : 'solved');
  }
  return false;
}

function predictAnswer(it: Item): number {
  const sc = it.scene;
  if (sc.bench === 'beam') return it.marked === null ? SIDES.indexOf(beamVerdict(sc.s)) : -1;
  if (sc.bench === 'mobile') {
    const bar = it.marked === null ? undefined : mobileBars(sc.s)[it.marked];
    return bar ? SIDES.indexOf(sideOf(barNet(bar))) : -1;
  }
  if (it.marked !== null) return -1;
  const v = stackVerdict(sc.s);
  if (v.failing.length > 1) return -1;
  return STACK_ANSWERS.indexOf(v.stands ? 'stands' : v.failing[0]!.dir);
}

function isRoundState(x: Record<string, unknown>): boolean {
  if (!isOneOf(x.bench, ['mixed', ...BENCHES] as const) || !isOneOf(x.tasks, ['mixed', 'predict', 'build'] as const) || !isOneOf(x.difficulty, DIFFICULTIES)) return false;
  const d = x.difficulty;
  if (!isArrayOf(x.items, (i): i is Item => isItem(i, d)) || x.items.length !== ROUND_LENGTH) return false;
  if (!isInt(x.index, 0, x.items.length) || typeof x.reported !== 'boolean' || typeof x.whyOpen !== 'boolean') return false;
  if (x.reported && x.index !== x.items.length) return false;
  // Every task before the current one is done.
  return x.items.every((it, i) => i >= (x.index as number) || it.status !== 'open');
}

function isFreeState(x: Record<string, unknown>): boolean {
  if (!isOneOf(x.bench, BENCHES) || !isScene(x.scene) || x.scene.bench !== x.bench || typeof x.whyOpen !== 'boolean') return false;
  const bench = x.bench;
  if (!isArrayOf(x.history, (h): h is Scene => isScene(h) && h.bench === bench) || x.history.length > HISTORY_LIMIT) return false;
  return x.outcome === null || same(x.outcome, outcomeOf(x.scene));
}

export function isBalanceState(x: unknown): x is BalanceState {
  try {
    if (!isRecord(x) || x.v !== 1 || !isUint32(x.seed)) return false;
    if (x.mode === 'round') return isRoundState(x);
    if (x.mode === 'free') return isFreeState(x);
    return false;
  } catch {
    return false;
  }
}
