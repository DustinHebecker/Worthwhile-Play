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
export const MODEL_MODES = ['guided', 'free'] as const;
export type ModelMode = (typeof MODEL_MODES)[number];

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
  /** Reference factor id (guided rows and inserted constants) or null (a free row). */
  readonly ref: string | null;
  readonly unit: string;
  readonly power: Power;
  /** What the player typed (≤ 32 characters). */
  readonly text: string;
  /** The "× 10ⁿ" stepper. */
  readonly exp: number;
  /** `text` as parsed by the view in the UI locale (null while empty or unreadable). */
  readonly value: number | null;
  /** Free-mode name (≤ 40 characters), '' otherwise. */
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
  readonly v: 1;
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

/**
 * Five distinct tasks: the round's level first, then the neighbouring level(s) when the category has fewer than
 * five, in a shuffled order.
 */
export function selectTasks(rng: Rng, difficulty: Difficulty, category: CategoryChoice): Task[] {
  const pool = poolOf(category);
  const chosen: Task[] = [];
  for (const level of LEVEL_ORDER[difficulty]) {
    for (const task of rng.shuffle(pool.filter((t) => t.level === level))) {
      if (chosen.length < ROUND_LENGTH) chosen.push(task);
    }
  }
  return rng.shuffle(chosen);
}

/** The slider window's lower decade: the central value lies 2 to 7 decades above it, at a seeded offset. */
export const windowLoFor = (task: Task, rng: Rng): number => decade(task.answer.central) - 2 - rng.int(0, 5);

const freshQuestion = (task: Task, rng: Rng): QuestionState => ({
  taskId: task.id,
  windowLo: windowLoFor(task, rng),
  phase: 'estimate',
  draft: '',
  draftExp: 0,
  firstGuess: null,
  factors: [],
  modelUsed: false,
  answer: null
});

/** A new round. Untrusted choices fall back to the defaults (easy, all categories, guided). */
export function createInitial(seed: number, choices: StartChoices = {}): FermiState {
  const safeSeed = Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
  const difficulty = pick(DIFFICULTIES, choices.difficulty, 'easy');
  const category = pick(CATEGORY_CHOICES, choices.category, 'all');
  const model = pick(MODEL_MODES, choices.model, 'guided');
  const rng = createRng(safeSeed);
  const tasks = selectTasks(rng, difficulty, category);
  return { v: 1, seed: safeSeed, difficulty, category, model, questions: tasks.map((t) => freshQuestion(t, rng)), index: 0, finishedReported: false };
}

export const resetState = (state: FermiState): FermiState => createInitial(state.seed, state);

/* ---------------- Accessors ---------------- */

export const currentQuestion = (state: FermiState): QuestionState | undefined => state.questions[state.index];
export const taskOf = (q: QuestionState): Task => taskById(q.taskId)!;
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

const GENERIC_UNITS = ['1', '%', 'm', 'm²', 'm³', 'L', 'kg', 'g', 's', 'min', 'h', 'day', 'year', 'W', 'Wh', 'kWh', 'J'];
const PALETTE_SIZE = 16;

/** Units offered in the free builder: the reference units plus generic ones, sorted so none stands out. */
export function unitPalette(task: Task): string[] {
  const units = new Set(task.factors.filter((x) => !x.fixed).map((x) => x.unit));
  for (const u of GENERIC_UNITS) if (units.size < PALETTE_SIZE) units.add(u);
  return [...units].sort((a, b) => a.localeCompare(b, 'en'));
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

export type TipId = 'cube' | 'low' | 'high' | 'model' | 'general';

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
  /** Only when the model was used at least twice: geometric-mean distance factors with the model and of the first guesses. */
  readonly modelHelp: { readonly withModel: number; readonly firstGuesses: number } | null;
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
  const modelled = rows.filter((r) => r.modelUsed && r.guess);
  const modelHelp =
    modelled.length >= 2 ? { withModel: geoMean(modelled.map((r) => r.score.d)), firstGuesses: geoMean(modelled.map((r) => r.guess!.d)) } : null;
  const cubeMiss = answered.some((q) => taskOf(q).factors.some((x) => !x.fixed && Math.abs(x.power) >= 2) && score(q.answer!, taskOf(q)).d > 1);
  const logBias = Math.log10(bias);
  const tip: TipId = cubeMiss ? 'cube' : logBias < -BIAS_SAME ? 'low' : logBias > BIAS_SAME ? 'high' : modelled.length < 2 ? 'model' : 'general';
  return {
    rows,
    bias,
    modelHelp,
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

/** Commits the first guess and opens the (optional) model step. */
export function commitGuess(state: FermiState, value: number): FermiState {
  if (!validNumber(value)) return state;
  return replaceQuestion(state, (q) => {
    if (q.phase !== 'estimate') return q;
    return { ...q, phase: 'model', firstGuess: value, factors: state.model === 'guided' ? guidedRows(taskOf(q)) : [] };
  });
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

/** Free mode: changes a row's unit (from the palette) and power. */
export function setRowUnit(state: FermiState, i: number, unit: string, power: Power): FermiState {
  if (state.model !== 'free') return state;
  return replaceRow(state, i, (row, task) => {
    if (row.ref !== null || !unitPalette(task).includes(unit) || !POWERS.includes(power)) return row;
    return row.unit === unit && row.power === power ? row : { ...row, unit, power };
  });
}

/** Free mode: names a row. */
export function setRowLabel(state: FermiState, i: number, label: string): FermiState {
  if (state.model !== 'free') return state;
  return replaceRow(state, i, (row) => {
    const next = cut(label, LABEL_MAX);
    return next === row.label ? row : { ...row, label: next };
  });
}

/** Free mode: adds an empty row (up to five). */
export function addRow(state: FermiState): FermiState {
  if (state.model !== 'free') return state;
  return replaceQuestion(state, (q) => {
    if (q.phase !== 'model' || q.factors.length >= MAX_FACTORS) return q;
    const palette = unitPalette(taskOf(q));
    const unit = palette.includes('1') ? '1' : palette[0]!;
    return { ...q, factors: [...q.factors, { ref: null, unit, power: 1, text: '', exp: 0, value: null, label: '' }] };
  });
}

/** Free mode: inserts a given factor of the reference ("a known constant"). */
export function insertConstant(state: FermiState, factorId: string): FermiState {
  if (state.model !== 'free') return state;
  return replaceQuestion(state, (q) => {
    const factor = factorOf(taskOf(q), factorId);
    if (q.phase !== 'model' || q.factors.length >= MAX_FACTORS || !factor?.fixed || q.factors.some((r) => r.ref === factorId)) return q;
    return { ...q, factors: [...q.factors, { ref: factor.id, unit: factor.unit, power: factor.power, text: '', exp: 0, value: null, label: '' }] };
  });
}

/** Free mode: removes a row. */
export function removeRow(state: FermiState, i: number): FermiState {
  if (state.model !== 'free') return state;
  return replaceQuestion(state, (q) => (q.phase !== 'model' || !q.factors[i] ? q : { ...q, factors: q.factors.filter((_, k) => k !== i) }));
}

/** Ends the model step: the model's result (when it is complete and its units match) or the first guess. */
export function finishModel(state: FermiState, useModel: boolean): FermiState {
  return replaceQuestion(state, (q) => {
    if (q.phase !== 'model' || q.firstGuess === null) return q;
    if (useModel) {
      const result = modelResult(taskOf(q), q.factors);
      if (result.status !== 'ok') return q;
      return { ...q, phase: 'review', modelUsed: true, answer: result.value };
    }
    return { ...q, phase: 'review', modelUsed: false, answer: q.firstGuess };
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

function isFactorState(x: unknown, task: Task, model: ModelMode): boolean {
  if (!isObject(x)) return false;
  if (!(x.ref === null || typeof x.ref === 'string') || typeof x.unit !== 'string' || !POWERS.includes(x.power as Power)) return false;
  if (!isString(x.text, TEXT_MAX) || !isInt(x.exp) || x.exp < EXP_MIN || x.exp > EXP_MAX || !nullOrPositive(x.value) || !isString(x.label, LABEL_MAX)) return false;
  if (!parseUnit(x.unit)) return false;
  if (x.ref !== null) {
    const factor = factorOf(task, x.ref);
    if (!factor || factor.unit !== x.unit || factor.power !== x.power) return false;
    if (model === 'free' && !factor.fixed) return false;
  } else if (model === 'guided' || !unitPalette(task).includes(x.unit)) return false;
  return model === 'free' || x.label === '';
}

function isQuestionState(x: unknown, model: ModelMode): boolean {
  if (!isObject(x) || typeof x.taskId !== 'string') return false;
  const task = taskById(x.taskId);
  if (!task || !isInt(x.windowLo)) return false;
  const lo = decade(task.answer.central) - 7;
  if (x.windowLo < lo || x.windowLo > lo + 5) return false;
  if (!['estimate', 'model', 'review'].includes(x.phase as string)) return false;
  if (!isString(x.draft, TEXT_MAX) || !isInt(x.draftExp) || x.draftExp < EXP_MIN || x.draftExp > EXP_MAX) return false;
  if (!nullOrPositive(x.firstGuess) || !nullOrPositive(x.answer) || typeof x.modelUsed !== 'boolean') return false;
  if (!Array.isArray(x.factors) || x.factors.length > MAX_FACTORS || !x.factors.every((r) => isFactorState(r, task, model))) return false;
  const refs = (x.factors as FactorState[]).flatMap((r) => (r.ref === null ? [] : [r.ref]));
  if (new Set(refs).size !== refs.length) return false;
  if (model === 'guided' && x.phase !== 'estimate') {
    // Guided rows are exactly the reference factors, in order.
    const rows = x.factors as FactorState[];
    if (rows.length !== task.factors.length || rows.some((r, i) => r.ref !== task.factors[i]!.id)) return false;
  }
  switch (x.phase) {
    case 'estimate':
      return x.firstGuess === null && x.answer === null && x.factors.length === 0 && x.modelUsed === false;
    case 'model':
      return x.firstGuess !== null && x.answer === null && x.modelUsed === false;
    default:
      return x.firstGuess !== null && x.answer !== null;
  }
}

/** Structural validation of untrusted saved data. Never throws. */
export function isFermiState(value: unknown): value is FermiState {
  try {
    if (!isObject(value) || value.v !== 1) return false;
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
    const ok = (questions as QuestionState[]).every((q, i) => (i < (value.index as number) ? q.phase === 'review' : i > (value.index as number) ? q.phase === 'estimate' && q.draft === '' : true));
    if (!ok) return false;
    return value.finishedReported === false || value.index === ROUND_LENGTH;
  } catch {
    return false;
  }
}
export type { Category, Power, Task };
