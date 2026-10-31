/**
 * Estimation Lab (`fermi-lab`) — pure game logic (design §§ 4–10): round selection, the slider window, scoring by
 * order of magnitude, the model builder's live product, the comparison with the reference model, the sensitivity
 * ("tornado") data, the round summary, state transitions and validation. No DOM, no locale: numbers typed by the
 * player arrive here already parsed (the view parses them with the UI locale).
 */
import { createRng, type Rng, type SettingValue } from '@wp/game-core';
import { decade } from './format';
import { CATEGORIES, POWERS, TASKS, taskById, type Category, type Factor, type Level, type Power, type Task } from './tasks';
import { convertTo, leftover, multiply, parseUnit, type Dims } from './units';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const CATEGORY_CHOICES = ['all', ...CATEGORIES] as const;
export type CategoryChoice = (typeof CATEGORY_CHOICES)[number];
/**
 * The two paths (start screen, change 2026-10-25): `guided` opens each question in the guided factor model, `free`
 * asks for one estimate and goes straight to the review. (Before stateVersion 2, `free` meant an empty model builder
 * after a first guess; its saves and remembered choices map to the free estimate.)
 */
export const MODEL_MODES = ['guided', 'free'] as const;
export type ModelMode = (typeof MODEL_MODES)[number];
export const STATE_VERSION = 2;

export const ROUND_LENGTH = 5;
export const EXP_MIN = -6;
export const EXP_MAX = 30;
export const TEXT_MAX = 32;
export const LABEL_MAX = 40;
export const MAX_FACTORS = 5;
/** Width of the slider window in decades. */
export const WINDOW_DECADES = 10;

export type Phase = 'estimate' | 'model' | 'review';

export interface FactorState {
  /** Reference factor id, or null (a free row: only in questions reviewed before stateVersion 2). */
  readonly ref: string | null;
  readonly unit: string;
  readonly power: Power;
  /** What the player typed (≤ 32 characters). */
  readonly text: string;
  /** The "× 10ⁿ" stepper. */
  readonly exp: number;
  /** `text` as parsed by the view in the UI locale (null while empty or unreadable). */
  readonly value: number | null;
  /** Name of a free row (≤ 40 characters, before stateVersion 2), '' otherwise. */
  readonly label: string;
}

export interface QuestionState {
  readonly taskId: string;
  /** Lower decade of the slider window [windowLo, windowLo + 10]. */
  readonly windowLo: number;
  readonly phase: Phase;
  /** Unsent text of the estimate field and its stepper, restored on resume. */
  readonly draft: string;
  readonly draftExp: number;
  readonly firstGuess: number | null;
  readonly factors: readonly FactorState[];
  readonly modelUsed: boolean;
  readonly answer: number | null;
}

export interface FermiState {
  readonly v: 2;
  readonly seed: number;
  readonly difficulty: Difficulty;
  readonly category: CategoryChoice;
  readonly model: ModelMode;
  readonly questions: readonly QuestionState[];
  /** 0–4: the current question; 5: the summary. */
  readonly index: number;
  /** `finished()` was called (saved, so a restored summary never reports twice). */
  readonly finishedReported: boolean;
}

/* ---------------- Settings ---------------- */

const pick = <T extends string>(values: readonly T[], value: unknown, fallback: T): T => (values.includes(value as T) ? (value as T) : fallback);

export interface StartChoices {
  readonly difficulty?: unknown;
  readonly category?: unknown;
  readonly model?: unknown;
}

/** The start-screen settings a state was started with (ADR 0017). */
export function settingsOf(state: FermiState): Record<string, SettingValue> {
  return { difficulty: state.difficulty, category: state.category, model: state.model };
}

/* ---------------- Round selection ---------------- */

const LEVEL_ORDER: Readonly<Record<Difficulty, readonly Level[]>> = { easy: [1, 2, 3], medium: [2, 1, 3], hard: [3, 2, 1] };

/** The tasks of a category (all for `all`), sorted by id. */
export const poolOf = (category: CategoryChoice): Task[] =>
  TASKS.filter((t) => category === 'all' || t.category === category)
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : 1));

/* ---------------- Recently shown tasks (per device, never in the save) ---------------- */

/** Key of the per-device preference (`context.preferences`) that lists the recently shown task ids. */
export const RECENT_KEY = 'recent';

/**
 * How many recently shown tasks the next rounds avoid: 7, about half of the smallest level pool of "All topics"
 * (14 hard tasks; 15 easy, 17 medium). So an "All topics" round never has to leave its level to avoid a recent
 * task (at least 7 unseen tasks remain on every level), and the window still covers the whole previous round (5)
 * plus two. A single topic has only 8–11 tasks: there the window covers most of the pool, and a round takes its
 * unseen tasks first (the neighbouring levels included) and repeats the ones seen longest ago only when needed.
 */
export const RECENT_SIZE = 7;

/** The remembered ids from an untrusted preference value: known task ids, no duplicates, the last `RECENT_SIZE`. */
export function readRecent(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const id of value.slice(-100)) {
    if (typeof id !== 'string' || !taskById(id)) continue;
    const at = ids.indexOf(id);
    if (at >= 0) ids.splice(at, 1);
    ids.push(id);
  }
  return ids.slice(-RECENT_SIZE);
}

/** The memory after `id` was shown: `id` moves to the end (most recent), the oldest falls out beyond the window. */
export function rememberTask(recent: readonly string[], id: string): string[] {
  return [...recent.filter((x) => x !== id), id].slice(-RECENT_SIZE);
}

/**
 * Five distinct tasks: the round's level first, then the neighbouring level(s) when the category has fewer than
 * five, in a shuffled order. Tasks in `recent` (most recent last) come after every unseen task of the category and
 * among themselves the one seen longest ago first. The random draws do not depend on `recent`, and with no memory
 * the result is the same as without one.
 */
export function selectTasks(rng: Rng, difficulty: Difficulty, category: CategoryChoice, recent: readonly string[] = []): Task[] {
  const pool = poolOf(category);
  const seenAt = new Map(recent.map((id, i) => [id, i]));
  const unseen: Task[] = [];
  const seen: Task[] = [];
  for (const level of LEVEL_ORDER[difficulty]) {
    const shuffled = rng.shuffle(pool.filter((t) => t.level === level));
    unseen.push(...shuffled.filter((t) => !seenAt.has(t.id)));
    seen.push(...shuffled.filter((t) => seenAt.has(t.id)).sort((a, b) => seenAt.get(a.id)! - seenAt.get(b.id)!));
  }
  return rng.shuffle([...unseen, ...seen].slice(0, ROUND_LENGTH));
}

/** The slider window's lower decade: the central value lies 2 to 7 decades above it, at a seeded offset. */
export const windowLoFor = (task: Task, rng: Rng): number => decade(task.answer.central) - 2 - rng.int(0, 5);

/** An untouched question: guided ones open in the model with the given values pre-filled, free ones in the estimate. */
const freshQuestion = (task: Task, rng: Rng, model: ModelMode): QuestionState => ({
  taskId: task.id,
  windowLo: windowLoFor(task, rng),
  phase: model === 'guided' ? 'model' : 'estimate',
  draft: '',
  draftExp: 0,
  firstGuess: null,
  factors: model === 'guided' ? guidedRows(task) : [],
  modelUsed: false,
  answer: null
});

/**
 * A new round. Untrusted choices fall back to the defaults (easy, all categories, guided); `recent` is the device's
 * memory of recently shown tasks (`readRecent`). Same seed, choices and memory: same round.
 */
export function createInitial(seed: number, choices: StartChoices = {}, recent: readonly string[] = []): FermiState {
  const safeSeed = Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
  const difficulty = pick(DIFFICULTIES, choices.difficulty, 'easy');
  const category = pick(CATEGORY_CHOICES, choices.category, 'all');
  const model = pick(MODEL_MODES, choices.model, 'guided');
  const rng = createRng(safeSeed);
  const tasks = selectTasks(rng, difficulty, category, recent);
  return { v: 2, seed: safeSeed, difficulty, category, model, questions: tasks.map((t) => freshQuestion(t, rng, model)), index: 0, finishedReported: false };
}

/**
 * The round from its start: the same tasks (whatever the memory was then) with the same slider windows, since the
 * draws of `selectTasks` do not depend on the memory.
 */
export function resetState(state: FermiState): FermiState {
  const rng = createRng(state.seed);
  selectTasks(rng, state.difficulty, state.category);
  return { ...createInitial(state.seed, state), questions: state.questions.map((q) => freshQuestion(taskOf(q), rng, state.model)) };
}

/* ---------------- Accessors ---------------- */

export const currentQuestion = (state: FermiState): QuestionState | undefined => state.questions[state.index];
export function taskOf(q: QuestionState): Task {
  return taskById(q.taskId)!;
}

export const isSummary = (state: FermiState): boolean => state.index >= ROUND_LENGTH;

const replaceQuestion = (state: FermiState, update: (q: QuestionState) => QuestionState): FermiState => {
  const q = currentQuestion(state);
  if (!q) return state;
  const next = update(q);
  if (next === q) return state;
  return { ...state, questions: state.questions.map((x, i) => (i === state.index ? next : x)) };
};

const clampExp = (exp: number): number => (Number.isFinite(exp) ? Math.max(EXP_MIN, Math.min(EXP_MAX, Math.round(exp))) : 0);
const validNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/* ---------------- Scoring ---------------- */

export const BANDS = ['x2', 'x3', 'x10', 'x100', 'far'] as const;
export type Band = (typeof BANDS)[number];
const BAND_LIMITS: readonly [Band, number][] = [
  ['x2', Math.log10(2)],
  ['x3', Math.log10(3)],
  ['x10', 1],
  ['x100', 2]
];
/** Below this distance (0.05 decades, about 12 %) an answer has no direction. */
export const SAME = 0.05;

export interface Score {
  /** Distance in decades, |log10(answer ÷ central)|. */
  readonly d: number;
  readonly band: Band;
  readonly direction: 'high' | 'low' | 'none';
  /** 10^d: how many times too high or too low. */
  readonly factor: number;
  readonly inRange: boolean;
}

export function bandOf(d: number): Band {
  for (const [band, limit] of BAND_LIMITS) if (d <= limit + 1e-12) return band;
  return 'far';
}

export function score(answer: number, task: Task): Score {
  const log = Math.log10(answer / task.answer.central);
  const d = Math.abs(log);
  return {
    d,
    band: bandOf(d),
    direction: d <= SAME ? 'none' : log > 0 ? 'high' : 'low',
    factor: 10 ** d,
    inRange: answer >= task.answer.low && answer <= task.answer.high
  };
}

/** Number of filled marks (●) of a band: 3, 2, 1, 0, 0. */
export const marksOf = (band: Band): number => ({ x2: 3, x3: 2, x10: 1, x100: 0, far: 0 })[band];

/* ---------------- The model ---------------- */

export const factorOf = (task: Task, id: string | null): Factor | undefined => (id === null ? undefined : task.factors.find((x) => x.id === id));

/** A row's effective value (a given factor's own value; otherwise the typed value × 10ⁿ), or null. */
export function rowValue(task: Task, row: FactorState): number | null {
  const ref = factorOf(task, row.ref);
  if (ref?.fixed) return ref.value;
  if (row.value === null) return null;
  const v = row.value * 10 ** row.exp;
  return Number.isFinite(v) && v > 0 ? v : null;
}

export const isGivenRow = (task: Task, row: FactorState): boolean => factorOf(task, row.ref)?.fixed === true;

export type ModelResult =
  | { readonly status: 'empty' }
  | { readonly status: 'incomplete' }
  | { readonly status: 'units'; readonly leftover: Dims; readonly si: number }
  | { readonly status: 'ok'; readonly value: number };

/** The live product of the player's model in the answer unit (design § 6.3). */
export function modelResult(task: Task, rows: readonly FactorState[]): ModelResult {
  if (rows.length === 0) return { status: 'empty' };
  const values = rows.map((row) => rowValue(task, row));
  if (values.some((v) => v === null)) return { status: 'incomplete' };
  const product = multiply(rows.map((row, i) => ({ value: values[i]!, unit: row.unit, power: row.power })));
  if (!product) return { status: 'incomplete' };
  const value = convertTo(product, task.answer.unit);
  if (value === null || !Number.isFinite(value) || value <= 0) return { status: 'units', leftover: leftover(product, task.answer.unit), si: product.si };
  return { status: 'ok', value };
}

/** The reference model's product in the answer unit (null if its units do not cancel; content tests forbid that). */
export function referenceProduct(task: Task): number | null {
  const product = multiply(task.factors.map((x) => ({ value: x.value, unit: x.unit, power: x.power })));
  return product ? convertTo(product, task.answer.unit) : null;
}

/** Rows of the guided builder: one per reference factor, given ones pre-filled. */
export const guidedRows = (task: Task): FactorState[] =>
  task.factors.map((x) => ({ ref: x.id, unit: x.unit, power: x.power, text: '', exp: 0, value: null, label: '' }));

/* ---------------- Comparison and sensitivity ---------------- */

export interface ComparisonRow {
  readonly factor: Factor;
  /** The player's value (null when no row matches). */
  readonly yours: number | null;
  /** (yours ÷ reference)^power, null for given factors or without a match. */
  readonly effect: number | null;
  readonly biggest: boolean;
}

export interface Comparison {
  readonly rows: readonly ComparisonRow[];
  /** Free rows matched to no reference factor. */
  readonly others: readonly FactorState[];
  /** Combined effect of the unmatched rows and reference factors (null when nothing to say). */
  readonly othersEffect: number | null;
}

/** About right: effects within ×1.1 either way. */
export const ABOUT_RIGHT = Math.log10(1.1);

/**
 * Matches the player's rows to the reference factors (design § 6.4): by reference id (guided rows, constants), or —
 * for free rows — by unit and power when exactly one non-given reference factor has that unit and power.
 */
export function compare(task: Task, rows: readonly FactorState[]): Comparison {
  const matched = new Map<string, FactorState>();
  const others: FactorState[] = [];
  for (const row of rows) {
    let id = row.ref;
    if (id === null) {
      const candidates = task.factors.filter((x) => !x.fixed && x.unit === row.unit && x.power === row.power);
      id = candidates.length === 1 ? candidates[0]!.id : null;
    }
    if (id !== null && factorOf(task, id) && !matched.has(id)) matched.set(id, row);
    else others.push(row);
  }
  let biggestId: string | null = null;
  let biggestLog = ABOUT_RIGHT;
  const base = task.factors.map((factor) => {
    const row = matched.get(factor.id);
    const yours = row ? rowValue(task, row) : null;
    const effect = yours !== null && !factor.fixed ? (yours / factor.value) ** factor.power : null;
    if (effect !== null && Math.abs(Math.log10(effect)) > biggestLog) {
      biggestLog = Math.abs(Math.log10(effect));
      biggestId = factor.id;
    }
    return { factor, yours, effect };
  });
  let othersEffect: number | null = null;
  const result = modelResult(task, rows);
  if (result.status === 'ok' && (others.length > 0 || base.some((r) => r.yours === null))) {
    const explained = base.reduce((acc, r) => acc * (r.effect ?? 1), 1);
    othersEffect = result.value / task.answer.central / explained;
  }
  return { rows: base.map((r) => ({ ...r, biggest: r.factor.id === biggestId })), others, othersEffect };
}

export interface SensitivityBar {
  readonly factorId: string;
  /** The result when this factor alone goes over its plausible range (others at their reference values). */
  readonly lo: number;
  readonly hi: number;
  readonly spanDecades: number;
}

/** Tornado data (design § 8): one bar per non-given factor, widest first. */
export function sensitivity(task: Task): SensitivityBar[] {
  const c = task.answer.central;
  return task.factors
    .filter((x) => !x.fixed)
    .map((x) => {
      const a = c * (x.low / x.value) ** x.power;
      const b = c * (x.high / x.value) ** x.power;
      return { factorId: x.id, lo: Math.min(a, b), hi: Math.max(a, b), spanDecades: Math.abs(x.power) * Math.log10(x.high / x.low) };
    })
    .sort((a, b) => b.spanDecades - a.spanDecades || (a.factorId < b.factorId ? -1 : 1));
}

/* ---------------- Summary ---------------- */

/** `guided`: a free-estimate round suggests the guided path, which breaks questions into factors. */
export type TipId = 'cube' | 'low' | 'high' | 'guided' | 'general';

export interface SummaryRow {
  readonly taskId: string;
  readonly score: Score;
  readonly guess: Score | null;
  readonly modelUsed: boolean;
}

export interface Summary {
  readonly rows: readonly SummaryRow[];
  /** Geometric mean of answer ÷ central. */
  readonly bias: number;
  readonly tip: TipId;
  readonly withinFactor3: number;
  readonly withinFactor10: number;
  readonly modelsUsed: number;
}

/** "About right on average": a bias within ×1.25. */
export const BIAS_SAME = Math.log10(1.25);

const geoMean = (logs: readonly number[]): number => 10 ** (logs.reduce((a, b) => a + b, 0) / Math.max(1, logs.length));

export function summarize(state: FermiState): Summary {
  const answered = state.questions.filter((q) => q.answer !== null);
  const rows = answered.map((q) => {
    const task = taskOf(q);
    return { taskId: q.taskId, score: score(q.answer!, task), guess: q.firstGuess === null ? null : score(q.firstGuess, task), modelUsed: q.modelUsed };
  });
  const logs = answered.map((q) => Math.log10(q.answer! / taskOf(q).answer.central));
  const bias = geoMean(logs);
  const cubeMiss = answered.some((q) => taskOf(q).factors.some((x) => !x.fixed && Math.abs(x.power) >= 2) && score(q.answer!, taskOf(q)).d > 1);
  const logBias = Math.log10(bias);
  const tip: TipId = cubeMiss ? 'cube' : logBias < -BIAS_SAME ? 'low' : logBias > BIAS_SAME ? 'high' : state.model === 'free' ? 'guided' : 'general';
  return {
    rows,
    bias,
    tip,
    withinFactor3: rows.filter((r) => r.score.d <= Math.log10(3) + 1e-12).length,
    withinFactor10: rows.filter((r) => r.score.d <= 1 + 1e-12).length,
    modelsUsed: rows.filter((r) => r.modelUsed).length
  };
}

/* ---------------- Transitions (each returns the same object when nothing changes) ---------------- */

const cut = (text: string, max: number): string => [...String(text)].slice(0, max).join('');

/** Edits the estimate field (text and stepper). */
export function setDraft(state: FermiState, text: string, exp: number): FermiState {
  return replaceQuestion(state, (q) => {
    if (q.phase !== 'estimate') return q;
    const draft = cut(text, TEXT_MAX);
    const draftExp = clampExp(exp);
    return draft === q.draft && draftExp === q.draftExp ? q : { ...q, draft, draftExp };
  });
}

/** Free estimate: commits the estimate and opens the review. */
export function commitGuess(state: FermiState, value: number): FermiState {
  if (!validNumber(value)) return state;
  return replaceQuestion(state, (q) => (q.phase !== 'estimate' ? q : { ...q, phase: 'review', firstGuess: value, answer: value }));
}

const replaceRow = (state: FermiState, i: number, update: (row: FactorState, task: Task) => FactorState): FermiState =>
  replaceQuestion(state, (q) => {
    const row = q.factors[i];
    if (q.phase !== 'model' || !row) return q;
    const next = update(row, taskOf(q));
    return next === row ? q : { ...q, factors: q.factors.map((r, k) => (k === i ? next : r)) };
  });

/** Edits a row's number (text, stepper and the parsed value). Given rows cannot be edited. */
export function setRowNumber(state: FermiState, i: number, text: string, exp: number, value: number | null): FermiState {
  return replaceRow(state, i, (row, task) => {
    if (isGivenRow(task, row)) return row;
    const next = { ...row, text: cut(text, TEXT_MAX), exp: clampExp(exp), value: validNumber(value) ? value : null };
    return next.text === row.text && next.exp === row.exp && next.value === row.value ? row : next;
  });
}

/** Guided: commits the model (when it is complete and its units match) and opens the review. */
export function finishModel(state: FermiState): FermiState {
  return replaceQuestion(state, (q) => {
    if (q.phase !== 'model') return q;
    const result = modelResult(taskOf(q), q.factors);
    return result.status !== 'ok' ? q : { ...q, phase: 'review', modelUsed: true, answer: result.value };
  });
}

/** After a review: the next question, or the summary after the fifth. */
export function next(state: FermiState): FermiState {
  const q = currentQuestion(state);
  if (!q || q.phase !== 'review') return state;
  return { ...state, index: state.index + 1 };
}

export const markFinished = (state: FermiState): FermiState => (state.finishedReported ? state : { ...state, finishedReported: true });

/* ---------------- Validation ---------------- */

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);
const isString = (x: unknown, max: number): x is string => typeof x === 'string' && [...x].length <= max;
const nullOrPositive = (x: unknown): boolean => x === null || validNumber(x);

/** A factor row. Free rows (ref null) and inserted constants only appear in free questions reviewed before v2. */
function isFactorState(x: unknown, task: Task, model: ModelMode): boolean {
  if (!isObject(x)) return false;
  if (!(x.ref === null || typeof x.ref === 'string') || typeof x.unit !== 'string' || !POWERS.includes(x.power as Power)) return false;
  if (!isString(x.text, TEXT_MAX) || !isInt(x.exp) || x.exp < EXP_MIN || x.exp > EXP_MAX || !nullOrPositive(x.value) || !isString(x.label, LABEL_MAX)) return false;
  if (!parseUnit(x.unit)) return false;
  if (x.ref !== null) {
    const factor = factorOf(task, x.ref);
    if (!factor || factor.unit !== x.unit || factor.power !== x.power) return false;
    if (model === 'free' && !factor.fixed) return false;
  } else if (model === 'guided') return false;
  return model === 'free' || x.label === '';
}

const isUntouchedRow = (r: FactorState): boolean => r.text === '' && r.exp === 0 && r.value === null;

function isQuestionState(x: unknown, model: ModelMode): boolean {
  if (!isObject(x) || typeof x.taskId !== 'string') return false;
  const task = taskById(x.taskId);
  if (!task || !isInt(x.windowLo)) return false;
  const lo = decade(task.answer.central) - 7;
  if (x.windowLo < lo || x.windowLo > lo + 5) return false;
  // Guided questions are in the model or reviewed; free ones in the estimate or reviewed.
  if (![model === 'guided' ? 'model' : 'estimate', 'review'].includes(x.phase as string)) return false;
  if (!isString(x.draft, TEXT_MAX) || !isInt(x.draftExp) || x.draftExp < EXP_MIN || x.draftExp > EXP_MAX) return false;
  if (!nullOrPositive(x.firstGuess) || !nullOrPositive(x.answer) || typeof x.modelUsed !== 'boolean') return false;
  if (!Array.isArray(x.factors) || x.factors.length > MAX_FACTORS || !x.factors.every((r) => isFactorState(r, task, model))) return false;
  const refs = (x.factors as FactorState[]).flatMap((r) => (r.ref === null ? [] : [r.ref]));
  if (new Set(refs).size !== refs.length) return false;
  if (model === 'guided') {
    // Guided rows are exactly the reference factors, in order.
    const rows = x.factors as FactorState[];
    if (rows.length !== task.factors.length || rows.some((r, i) => r.ref !== task.factors[i]!.id)) return false;
  }
  switch (x.phase) {
    case 'estimate':
      return x.firstGuess === null && x.answer === null && x.factors.length === 0 && x.modelUsed === false;
    case 'model':
      return x.firstGuess === null && x.answer === null && x.modelUsed === false && x.draft === '';
    default:
      // A free review has its estimate; a guided one its model (or, from v1, a kept first guess).
      return x.answer !== null && (model === 'guided' ? x.modelUsed || x.firstGuess !== null : x.firstGuess !== null);
  }
}

/** Structural validation of untrusted saved data. Never throws. */
export function isFermiState(value: unknown): value is FermiState {
  try {
    if (!isObject(value) || value.v !== STATE_VERSION) return false;
    if (!isInt(value.seed) || value.seed < 0 || value.seed > 0xffffffff) return false;
    if (!DIFFICULTIES.includes(value.difficulty as Difficulty) || !CATEGORY_CHOICES.includes(value.category as CategoryChoice) || !MODEL_MODES.includes(value.model as ModelMode)) return false;
    if (!isInt(value.index) || value.index < 0 || value.index > ROUND_LENGTH || typeof value.finishedReported !== 'boolean') return false;
    const questions = value.questions;
    if (!Array.isArray(questions) || questions.length !== ROUND_LENGTH) return false;
    if (!questions.every((q) => isQuestionState(q, value.model as ModelMode))) return false;
    const ids = (questions as QuestionState[]).map((q) => q.taskId);
    if (new Set(ids).size !== ids.length) return false;
    if (value.category !== 'all' && (questions as QuestionState[]).some((q) => taskOf(q).category !== value.category)) return false;
    // Earlier questions are reviewed, later ones untouched.
    const untouched = (q: QuestionState): boolean => q.phase !== 'review' && q.draft === '' && q.factors.every(isUntouchedRow);
    const ok = (questions as QuestionState[]).every((q, i) => (i < (value.index as number) ? q.phase === 'review' : i > (value.index as number) ? untouched(q) : true));
    if (!ok) return false;
    return value.finishedReported === false || value.index === ROUND_LENGTH;
  } catch {
    return false;
  }
}

/* ---------------- Migration ---------------- */

/** v1 → v2 for one question (design "Change 2026-10-25"). Reviews are kept as they were. */
function migrateQuestion(q: Record<string, unknown>, model: ModelMode): Record<string, unknown> {
  const task = typeof q.taskId === 'string' ? taskById(q.taskId) : undefined;
  if (!task) return q;
  if (model === 'guided' && q.phase === 'estimate') {
    // The first-guess step is gone: the question opens in the guided model (an unsent draft is dropped).
    return { ...q, phase: 'model', draft: '', draftExp: 0, firstGuess: null, factors: guidedRows(task), modelUsed: false, answer: null };
  }
  if (model === 'guided' && q.phase === 'model') return { ...q, draft: '', draftExp: 0, firstGuess: null };
  if (model === 'free' && q.phase === 'model') {
    // The free model builder is gone: the question is finished with its first guess.
    return { ...q, phase: 'review', factors: [], modelUsed: false, answer: q.firstGuess };
  }
  return q;
}

/** Upgrades a save of an older stateVersion; undefined when that is impossible (the host then validates the result). */
export function migrateState(state: unknown, fromVersion: number): FermiState | undefined {
  try {
    if (fromVersion !== 1 || !isObject(state) || state.v !== 1 || !Array.isArray(state.questions)) return undefined;
    const model = state.model as ModelMode;
    if (!MODEL_MODES.includes(model)) return undefined;
    const questions = state.questions.map((q) => (isObject(q) ? migrateQuestion(q, model) : q));
    const next = { ...state, v: STATE_VERSION, questions };
    return isFermiState(next) ? next : undefined;
  } catch {
    return undefined;
  }
}

export type { Category, Power, Task };
