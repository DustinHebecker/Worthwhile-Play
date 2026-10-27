/**
 * Pond & Meadow state and transitions (design § 14). Plain JSON; the simulation is never stored but replayed from a
 * preset or snapshot plus the action log, so a save is small and a model change is a new model id. Every transition is
 * pure: it returns a new state, or the same object when the move is not allowed.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed, type SettingValue } from '@wp/game-core';
import { cldOf } from './cld';
import { CHALLENGES, CHALLENGE_IDS, DIFFICULTIES, challengeOf, drawRound, preValue, runChallenge, seriesOf, type Challenge, type Difficulty, type Question } from './challenges';
import { BUDGET, GOAL_IDS, goalActions, goalOf, goalStatus, runGoal, toolAction, toolOf, type Goal, type GoalId, type GoalStatus } from './goals';
import { HABITATS, habitatDef, speciesIndex, type Habitat } from './habitats';
import {
  ACTION_KINDS,
  HABITAT_ACTIONS,
  ADD_LIMIT,
  MAX_ACTIONS,
  MAX_AMOUNT,
  MAX_TOTAL,
  MAX_WEEK,
  MODEL_IDS,
  MODEL_ID,
  SHARES,
  balanced,
  cloneSim,
  extendRun,
  rebaseWeek,
  runUntilSettled,
  sortActions,
  startRun,
  total,
  type Action,
  type Run,
  type Sim
} from './model';
import { PRESETS } from './presets';
import { levelBand, levelMarks, shapeMarks, sketchScore, type Band, type Marks } from './score';
import { classify, type Shape } from './shape';
import { PRESET_IDS, type PresetId } from './spinup';

export const MODES = ['predict', 'goal', 'explore'] as const;
export type Mode = (typeof MODES)[number];
export const STARTS = ['lively', 'simple', 'bare'] as const;
export type StartKind = (typeof STARTS)[number];
export const ROUND = 4;

export type Answer = { kind: 'level'; band: Band } | { kind: 'shape'; option: number } | { kind: 'sketch'; points: number[] };

export interface PredictItem {
  challenge: string;
  question: number;
  /** The current, uncommitted choice (survives a reload). */
  draft: Answer | null;
  answer: Answer | 'skip' | null;
  /** Stored at commit, so a later model change never flips a review. */
  marks: Marks | null;
  ran: boolean;
}

export interface Notebook {
  habitat: Habitat;
  start: { preset: PresetId } | { sim: Sim };
  log: Action[];
  week: number;
  weather: boolean;
}

export interface PredictState {
  v: 1;
  model: string;
  mode: 'predict';
  seed: number;
  difficulty: Difficulty;
  items: PredictItem[];
  index: number;
  reported: boolean;
}

export type GoalOutcome = { kind: 'reached' | 'failed' | 'shown'; week: number };

export interface GoalState {
  v: 1;
  model: string;
  mode: 'goal';
  seed: number;
  difficulty: Difficulty;
  goal: GoalId;
  notebook: Notebook;
  outcome: GoalOutcome | null;
  reported: boolean;
}

export interface ExploreState {
  v: 1;
  model: string;
  mode: 'explore';
  seed: number;
  habitat: Habitat;
  startPreset: StartKind;
  notebook: Notebook;
}

export type EcoState = PredictState | GoalState | ExploreState;

/* ---------- New games and settings ---------- */

export interface Choice {
  mode: Mode;
  difficulty: Difficulty;
  goal: GoalId;
  habitat: Habitat;
  start: StartKind;
  weather: boolean;
}

/** Start-screen settings from untrusted input (defaults for anything missing or invalid). */
export function choiceOf(difficulty: unknown, settings: Readonly<Record<string, unknown>> | undefined): Choice {
  const s = isRecord(settings) ? settings : {};
  return {
    mode: isOneOf(s.mode, MODES) ? s.mode : 'predict',
    difficulty: isOneOf(difficulty, DIFFICULTIES) ? difficulty : 'medium',
    goal: isOneOf(s.goal, GOAL_IDS) ? s.goal : 'save-pondweed',
    habitat: isOneOf(s.habitat, HABITATS) ? s.habitat : 'pond',
    start: isOneOf(s.start, STARTS) ? s.start : 'lively',
    weather: s.weather === true
  };
}

export const startPresetId = (habitat: Habitat, start: StartKind): PresetId =>
  start === 'lively' ? (habitat === 'pond' ? 'pond.lively' : 'meadow.lively') : start === 'simple' ? (habitat === 'pond' ? 'pond.plankton' : 'meadow.poor') : habitat === 'pond' ? 'pond.bare' : 'meadow.bare';

export function newGameState(seed: number, c: Choice): EcoState {
  const s = normalizeSeed(seed);
  if (c.mode === 'goal') {
    const g = goalOf(c.goal)!;
    return { v: 1, model: MODEL_ID, mode: 'goal', seed: s, difficulty: c.difficulty, goal: g.id, notebook: { habitat: g.habitat, start: { preset: g.preset }, log: [], week: 0, weather: false }, outcome: null, reported: false };
  }
  if (c.mode === 'explore') {
    return { v: 1, model: MODEL_ID, mode: 'explore', seed: s, habitat: c.habitat, startPreset: c.start, notebook: { habitat: c.habitat, start: { preset: startPresetId(c.habitat, c.start) }, log: [], week: 0, weather: c.weather } };
  }
  const items = drawRound(s, c.difficulty).map((x): PredictItem => ({ challenge: x.challenge, question: x.question, draft: null, answer: null, marks: null, ran: false }));
  return { v: 1, model: MODEL_ID, mode: 'predict', seed: s, difficulty: c.difficulty, items, index: 0, reported: false };
}

/** The start-screen settings a state was started with (ADR 0017). */
export function settingsOf(state: EcoState): Readonly<Record<string, SettingValue>> {
  if (state.mode === 'predict') return { mode: 'predict', difficulty: state.difficulty };
  if (state.mode === 'goal') return { mode: 'goal', goal: state.goal, difficulty: state.difficulty };
  return { mode: 'explore', habitat: state.habitat, start: state.startPreset, weather: state.notebook.weather };
}

/** The same round, goal or notebook from its start. */
export function restart(state: EcoState): EcoState {
  if (state.mode === 'predict') return newGameState(state.seed, { ...choiceOf(state.difficulty, {}), mode: 'predict' });
  if (state.mode === 'goal') return { ...state, notebook: { ...state.notebook, log: [], week: 0 }, outcome: null, reported: false };
  return { ...state, notebook: { ...state.notebook, log: [], week: 0 } };
}

/* ---------- Simulation of a notebook (cached; pure results) ---------- */

export const notebookStart = (nb: Notebook): Sim => ('preset' in nb.start ? PRESETS[nb.start.preset].sim : nb.start.sim);
export const notebookHistory = (nb: Notebook): readonly (readonly number[])[] => ('preset' in nb.start ? PRESETS[nb.start.preset].history : []);

/** All actions a notebook replays (goal script first). */
export function notebookActions(state: GoalState | ExploreState): Action[] {
  return state.mode === 'goal' ? goalActions(goalOf(state.goal)!, state.notebook.log) : sortActions(state.notebook.log);
}

const signature = (state: GoalState | ExploreState): string =>
  JSON.stringify([state.mode === 'goal' ? state.goal : '', state.notebook.start, state.notebook.weather, state.notebook.weather ? state.seed : 0, state.notebook.log]);

let memo: { key: string; run: Run } | null = null;

/** The run of a notebook up to `week` (default: its current week). Results are a pure function of the state. */
export function notebookRun(state: GoalState | ExploreState, week = state.notebook.week): Run {
  const key = signature(state);
  const hab = habitatDef(state.notebook.habitat);
  const actions = notebookActions(state);
  const opts = { seed: state.seed, weather: state.notebook.weather };
  if (!memo || memo.key !== key || memo.run.sim.week > week) memo = { key, run: startRun(cloneSim(notebookStart(state.notebook)), hab, actions) };
  extendRun(memo.run, hab, actions, week, opts);
  return memo.run;
}

/** A separate run (not cached) of a notebook with another log, e.g. "without my last change" or a reference plan. */
export function ghostRun(state: GoalState | ExploreState, log: readonly Action[], week: number): Run {
  const hab = habitatDef(state.notebook.habitat);
  const actions = state.mode === 'goal' ? goalActions(goalOf(state.goal)!, log) : sortActions(log);
  return extendRun(startRun(cloneSim(notebookStart(state.notebook)), hab, actions), hab, actions, week, { seed: state.seed, weather: state.notebook.weather });
}

/* ---------- Predict ---------- */

export const currentItem = (s: PredictState): PredictItem | undefined => s.items[s.index];
export const isSummary = (s: PredictState): boolean => s.index >= s.items.length;
export const questionOf = (s: PredictState, item: PredictItem): Question => challengeOf(item.challenge)!.questions[s.difficulty][item.question]!;

const withItem = (s: PredictState, item: PredictItem): PredictState => ({ ...s, items: s.items.map((x, i) => (i === s.index ? item : x)) });

/** Whether an answer fits a question (bands 0–2, option in range, six integer points in [0, max]). */
export function answerFits(q: Question, a: unknown): a is Answer {
  if (!isRecord(a)) return false;
  if (q.kind === 'level') return a.kind === 'level' && isInt(a.band, 0, 2) && Object.keys(a).length === 2;
  if (q.kind === 'shape') return a.kind === 'shape' && isInt(a.option, 0, q.options.length - 1) && Object.keys(a).length === 2;
  return a.kind === 'sketch' && isArrayOf(a.points, (p): p is number => isInt(p, 0, q.max), 6) && Object.keys(a).length === 2;
}

/** Sets the draft of the current question (before it is run). */
export function setDraft(s: PredictState, answer: Answer): PredictState {
  const item = currentItem(s);
  if (!item || item.ran || !answerFits(questionOf(s, item), answer)) return s;
  if (JSON.stringify(item.draft) === JSON.stringify(answer)) return s;
  return withItem(s, { ...item, draft: answer });
}

/** The flat sketch at the value before the change (what an untouched sketch means). */
export function flatSketch(c: Challenge, q: Question): number[] {
  const v0 = Math.min(q.kind === 'sketch' ? q.max : MAX_AMOUNT, preValue(c, q.species));
  return [v0, v0, v0, v0, v0, v0];
}

/** What the model did for a question: its series over the horizon. */
export function modelSeries(c: Challenge, q: Question): number[] {
  return seriesOf(c, runChallenge(c).samples, q.species);
}

/** The model's own answer: level band at week t, or shape class at p = 20 %. */
export function modelAnswer(q: Question, series: readonly number[]): { band: Band } | { shape: Shape } {
  if (q.kind === 'level') return { band: levelBand(series[0]!, series[q.week]!) };
  return { shape: classify(series) };
}

/** Marks of an answer against the model (§ 11.2). */
export function marksOf(c: Challenge, q: Question, a: Answer, series: readonly number[]): Marks {
  if (q.kind === 'level' && a.kind === 'level') return levelMarks(levelBand(series[0]!, series[q.week]!), a.band);
  if (q.kind === 'shape' && a.kind === 'shape') return shapeMarks(classify(series), q.options[a.option]!);
  if (q.kind === 'sketch' && a.kind === 'sketch') return sketchScore(a.points, series, c.horizon, q.max);
  return 0;
}

/** "Run H weeks": commits the draft (or, for a sketch, the flat line), runs the model and stores the marks. */
export function commit(s: PredictState): PredictState {
  const item = currentItem(s);
  if (!item || item.ran) return s;
  const c = challengeOf(item.challenge)!;
  const q = questionOf(s, item);
  const answer: Answer | null = item.draft ?? (q.kind === 'sketch' ? { kind: 'sketch', points: flatSketch(c, q) } : null);
  if (!answer) return s;
  return withItem(s, { ...item, answer, marks: marksOf(c, q, answer, modelSeries(c, q)), ran: true });
}

/** "Skip — just show me": runs without a prediction (not scored, not counted). */
export function skip(s: PredictState): PredictState {
  const item = currentItem(s);
  if (!item || item.ran) return s;
  return withItem(s, { ...item, answer: 'skip', marks: null, ran: true });
}

/** "Next" / "See summary" after a review. */
export function next(s: PredictState): PredictState {
  const item = currentItem(s);
  if (!item || !item.ran) return s;
  return { ...s, index: s.index + 1 };
}

export interface Summary {
  matched: number;
  close: number;
  partly: number;
  other: number;
  skipped: number;
  answered: number;
  /** Remark: 'delays' (a ○○○ in a challenge with a delay), 'allMatched', or the loop kind met most often. */
  remark: 'delays' | 'allMatched' | 'balancing' | 'reinforcing' | 'chains';
}

/** What explains a challenge: its highlighted loop's kind, or a chain (cascade) when no loop is highlighted. */
export function explainKind(challenge: string): 'balancing' | 'reinforcing' | 'chains' {
  const c = cldOf(challenge);
  if (!c || c.highlight === null) return 'chains';
  return c.highlight.startsWith('R') ? 'reinforcing' : 'balancing';
}

export function summarize(s: PredictState): Summary {
  const count = (m: Marks) => s.items.filter((i) => i.marks === m).length;
  const skipped = s.items.filter((i) => i.answer === 'skip').length;
  const answered = s.items.filter((i) => i.answer !== null && i.answer !== 'skip').length;
  const missedDelay = s.items.some((i) => i.marks === 0 && challengeOf(i.challenge)?.delay);
  const tally = { balancing: 0, reinforcing: 0, chains: 0 };
  for (const i of s.items) tally[explainKind(i.challenge)]++;
  const most = (Object.keys(tally) as (keyof typeof tally)[]).reduce((a, b) => (tally[b] > tally[a] ? b : a));
  const remark = missedDelay ? 'delays' : answered > 0 && count(3) === answered ? 'allMatched' : most;
  return { matched: count(3), close: count(2), partly: count(1), other: count(0), skipped, answered, remark };
}

export const markReported = <S extends PredictState | GoalState>(s: S): S => (s.reported ? s : { ...s, reported: true });

/* ---------- Goal ---------- */

export const goalSpec = (s: GoalState): Goal => goalOf(s.goal)!;
export const changesUsed = (s: GoalState): number => s.notebook.log.length;
export const budgetLeft = (s: GoalState): number => BUDGET[s.difficulty] - s.notebook.log.length;

/** Applies a tool at the current week (counts towards the budget). */
export function applyTool(s: GoalState, toolId: string): GoalState {
  const g = goalSpec(s);
  const tool = g.tools.find((t) => t.id === toolId);
  if (!tool || s.outcome || budgetLeft(s) <= 0 || s.notebook.log.length >= MAX_ACTIONS || s.notebook.week >= g.deadline) return s;
  return { ...s, notebook: { ...s.notebook, log: [...s.notebook.log, toolAction(tool, s.notebook.week)] } };
}

/** Runs the goal notebook on (`weeks`, or 'settle'); stops at a failure, at reaching, or at the deadline. */
export function runGoalWeeks(s: GoalState, weeks: number | 'settle'): { state: GoalState; settled: number } {
  const g = goalSpec(s);
  if (s.outcome || s.notebook.week >= g.deadline) return { state: s, settled: -1 };
  const run = notebookRun(s);
  let settled = -1;
  if (weeks === 'settle') {
    const hab = habitatDef(g.habitat);
    const actions = notebookActions(s);
    // Week by week so that a failure or success stops the run where it happens.
    const from = run.sim.week;
    let status: GoalStatus = goalStatus(g, run.samples);
    let streak = 0;
    while (status.kind === 'running' && run.sim.week < Math.min(g.deadline, from + 156)) {
      extendRun(run, hab, actions, run.sim.week + 1);
      status = goalStatus(g, run.samples);
      const w = run.sim.week;
      streak = calmAt(run, w, hab.species.length) ? streak + 1 : 0;
      if (streak >= 8 && w >= from + 8) {
        settled = w;
        break;
      }
    }
  } else runGoal(g, run, s.notebook.log, weeks);
  const status = goalStatus(g, run.samples);
  const week = status.kind === 'running' ? run.sim.week : Math.min(run.sim.week, status.week);
  const outcome: GoalOutcome | null = status.kind === 'running' ? null : { kind: status.kind, week: status.week };
  return { state: { ...s, notebook: { ...s.notebook, week }, outcome }, settled };
}

const calmAt = (run: Run, w: number, n: number): boolean => {
  const a = run.samples[w - 1]!;
  const c = run.samples[w]!;
  for (let i = 0; i < n; i++) if (Math.abs(c[i]! - a[i]!) * 100 > Math.max(c[i]!, 20_000)) return false;
  return true;
};

/** "Undo my last change": removes it and returns to its week (refunds the count). */
export function undoLast<S extends GoalState | ExploreState>(s: S): S {
  const log = s.notebook.log;
  if (log.length === 0 || (s.mode === 'goal' && (s as GoalState).reported)) return s;
  const last = log[log.length - 1]!;
  const out = { ...s, notebook: { ...s.notebook, log: log.slice(0, -1), week: last.week } };
  return (s.mode === 'goal' ? { ...out, outcome: null } : out) as S;
}

/** "Back to week …": returns to just before logged change `index` (it and every later change are removed). */
export function backTo<S extends GoalState | ExploreState>(s: S, index: number): S {
  const log = s.notebook.log;
  if (!isInt(index, 0, log.length - 1) || (s.mode === 'goal' && (s as GoalState).reported)) return s;
  const out = { ...s, notebook: { ...s.notebook, log: log.slice(0, index), week: log[index]!.week } };
  return (s.mode === 'goal' ? { ...out, outcome: null } : out) as S;
}

/** "Back to the start" of a goal (keeps nothing). */
export const backToStart = (s: GoalState): GoalState => (s.reported ? s : { ...s, notebook: { ...s.notebook, log: [], week: 0 }, outcome: null });

/** "Show me a way": the first reference plan is shown (as a ghost) and the goal ends as completed. */
export function showWay(s: GoalState): GoalState {
  if (s.outcome && s.outcome.kind !== 'failed') return s;
  return { ...s, outcome: { kind: 'shown', week: s.notebook.week } };
}

/* ---------- Explore ---------- */

/** Whether an action is allowed in a notebook of this habitat (kind, species, share, cuttings, condition level). */
export function actionFits(habitat: Habitat, a: unknown, week?: number): a is Action {
  if (!isRecord(a) || !isOneOf(a.kind, ACTION_KINDS) || !HABITAT_ACTIONS[habitat].includes(a.kind)) return false;
  if (!isInt(a.week, 0, MAX_WEEK) || (week !== undefined && a.week !== week)) return false;
  const hab = habitatDef(habitat);
  const keys = Object.keys(a).sort().join(',');
  switch (a.kind) {
    case 'add':
      return keys === 'kind,species,week' && typeof a.species === 'string' && speciesIndex(hab, a.species) >= 0;
    case 'remove':
      return keys === 'kind,share,species,week' && typeof a.species === 'string' && speciesIndex(hab, a.species) >= 0 && isOneOf(a.share, SHARES);
    case 'mow':
      return keys === 'cuttings,kind,week' && (a.cuttings === 'remove' || a.cuttings === 'leave');
    case 'set':
      return keys === 'cond,kind,level,week' && isInt(a.cond, 0, hab.conditions.length - 1) && isInt(a.level, 0, hab.conditions[a.cond]!.levels.length - 1);
    default:
      return keys === 'kind,week';
  }
}

/** Applies a change at the current week of an explore notebook (an "add" only while the total stays ≤ `ADD_LIMIT`). */
export function exploreApply(s: ExploreState, a: Action): ExploreState {
  if (s.notebook.log.length >= MAX_ACTIONS || s.notebook.week >= MAX_WEEK || !actionFits(s.habitat, a, s.notebook.week)) return s;
  if (a.kind === 'add') {
    const hab = habitatDef(s.habitat);
    if (total(notebookRun(s).sim) + hab.species[speciesIndex(hab, a.species!)]!.intro > ADD_LIMIT) return s;
  }
  return { ...s, notebook: { ...s.notebook, log: [...s.notebook.log, a] } };
}

/** Runs an explore notebook on by `weeks` or until it settles (≤ 156 weeks); never past week 520. */
export function exploreRun(s: ExploreState, weeks: number | 'settle'): { state: ExploreState; settled: number } {
  const nb = s.notebook;
  if (nb.week >= MAX_WEEK) return { state: s, settled: -1 };
  const run = notebookRun(s);
  let settled = -1;
  if (weeks === 'settle') {
    const r = runUntilSettled(run, habitatDef(nb.habitat), notebookActions(s), MAX_WEEK, { seed: s.seed, weather: nb.weather });
    settled = r.settled;
  } else extendRun(run, habitatDef(nb.habitat), notebookActions(s), Math.min(MAX_WEEK, nb.week + weeks), { seed: s.seed, weather: nb.weather });
  return { state: { ...s, notebook: { ...nb, week: run.sim.week } }, settled };
}

/** "Continue from here": the current state becomes the notebook's start (log cleared, balance kept). */
export function continueFromHere(s: ExploreState): ExploreState {
  const sim = rebaseWeek(notebookRun(s).sim);
  return { ...s, notebook: { ...s.notebook, start: { sim }, log: [], week: 0 } };
}

/* ---------- Validation (never throws) ---------- */

const isNat = (v: unknown, max = MAX_TOTAL): v is number => isInt(v, 0, max);

/** A snapshot `Sim` of this habitat: integer stocks in range, rings, conditions, week 0 and exact balances. */
export function isSim(x: unknown, habitat: Habitat): x is Sim {
  if (!isRecord(x)) return false;
  const hab = habitatDef(habitat);
  const n = hab.species.length;
  const amount = (v: unknown): v is number => isNat(v, MAX_AMOUNT);
  return (
    Object.keys(x).length === 12 &&
    x.week === 0 &&
    amount(x.n) &&
    amount(x.d) &&
    amount(x.w) &&
    (hab.meadow || x.w === 0) &&
    isArrayOf(x.b, amount, n) &&
    Array.isArray(x.j) &&
    x.j.length === n &&
    x.j.every((r, i) => isArrayOf(r, amount, hab.species[i]!.delay)) &&
    isArrayOf(x.seen, (v): v is number => v === 0 || v === 1, n) &&
    isNat(x.imp) &&
    isNat(x.exp) &&
    isNat(x.wimp) &&
    isNat(x.wexp) &&
    isArrayOf(x.cond, (c): c is number => isInt(c), hab.conditions.length) &&
    x.cond.every((c, k) => c >= 0 && c < hab.conditions[k]!.levels.length) &&
    balanced(x as unknown as Sim)
  );
}

function isNotebook(x: unknown, habitat: Habitat, maxWeek: number, fits: (a: unknown) => boolean): x is Notebook {
  if (!isRecord(x) || Object.keys(x).length !== 5 || x.habitat !== habitat || typeof x.weather !== 'boolean') return false;
  const st = x.start;
  if (!isRecord(st) || Object.keys(st).length !== 1) return false;
  if ('preset' in st) {
    if (!isOneOf(st.preset, PRESET_IDS) || PRESETS[st.preset].habitat !== habitat) return false;
  } else if (!isSim(st.sim, habitat)) return false;
  if (!isInt(x.week, 0, maxWeek) || !Array.isArray(x.log) || x.log.length > MAX_ACTIONS) return false;
  let prev = 0;
  for (const a of x.log) {
    if (!actionFits(habitat, a) || !fits(a) || a.week < prev || a.week > x.week) return false;
    prev = a.week;
  }
  return true;
}

function isItem(x: unknown, difficulty: Difficulty): x is PredictItem {
  if (!isRecord(x) || Object.keys(x).length !== 6) return false;
  const c = typeof x.challenge === 'string' ? challengeOf(x.challenge) : undefined;
  if (!c || !isInt(x.question, 0, c.questions[difficulty].length - 1)) return false;
  const q = c.questions[difficulty][x.question]!;
  if (x.draft !== null && !answerFits(q, x.draft)) return false;
  if (typeof x.ran !== 'boolean') return false;
  if (x.answer === null) return x.marks === null && x.ran === false;
  if (x.answer === 'skip') return x.marks === null && x.ran === true;
  return answerFits(q, x.answer) && isInt(x.marks, 0, 3) && x.ran === true;
}

const isBase = (x: Record<string, unknown>): boolean => x.v === 1 && isOneOf(x.model, MODEL_IDS) && isUint32(x.seed);

export function isEcoState(x: unknown): x is EcoState {
  try {
    if (!isRecord(x) || !isBase(x)) return false;
    if (x.mode === 'predict') {
      if (Object.keys(x).length !== 8 || !isOneOf(x.difficulty, DIFFICULTIES) || typeof x.reported !== 'boolean') return false;
      const d = x.difficulty;
      if (!Array.isArray(x.items) || x.items.length !== ROUND || !x.items.every((i) => isItem(i, d))) return false;
      const items = x.items as PredictItem[];
      if (new Set(items.map((i) => i.challenge)).size !== ROUND) return false;
      const index = x.index;
      if (!isInt(index, 0, ROUND)) return false;
      // Items before the current one have been run; later ones are untouched.
      if (!items.every((i, k) => (k < index ? i.ran : k > index ? i.answer === null && i.draft === null : true))) return false;
      return !x.reported || x.index === ROUND;
    }
    if (x.mode === 'goal') {
      if (Object.keys(x).length !== 9 || !isOneOf(x.difficulty, DIFFICULTIES) || !isOneOf(x.goal, GOAL_IDS) || typeof x.reported !== 'boolean') return false;
      const g = goalOf(x.goal)!;
      if (!isNotebook(x.notebook, g.habitat, g.deadline, (a) => toolOf(g, a as Action) !== undefined)) return false;
      const nb = x.notebook as Notebook;
      if (!('preset' in nb.start) || nb.start.preset !== g.preset || nb.weather) return false;
      const o = x.outcome;
      if (o !== null) {
        if (!isRecord(o) || Object.keys(o).length !== 2 || !isOneOf(o.kind, ['reached', 'failed', 'shown'] as const) || !isInt(o.week, 0, g.deadline)) return false;
      }
      return !x.reported || (o !== null && o.kind !== 'failed');
    }
    if (x.mode === 'explore') {
      if (Object.keys(x).length !== 7 || !isOneOf(x.habitat, HABITATS) || !isOneOf(x.startPreset, STARTS)) return false;
      return isNotebook(x.notebook, x.habitat, MAX_WEEK, () => true);
    }
    return false;
  } catch {
    return false;
  }
}

export { CHALLENGES, CHALLENGE_IDS };
