import { createRng, isInt, isRecord, isUint32 } from '@wp/game-core';
import {
  BULLETS,
  GOLD_BULLETS,
  PIECES,
  VERSIONS,
  pieceById,
  type BulletId,
  type PieceDef,
  type SentenceKind,
  type SummaryId,
  type VersionId
} from './pieces';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Steps of one game. Each scored step is first answered, then checked (feedback shown), then left with "next".
 * `core` tick core sentences → `bullets` pick three bullets → `sentence` pick one summary sentence (plus an
 * optional own sentence, never graded) → `details` tick what the one-liner needs → `expand` pick the best
 * expanded version → `done`.
 */
export const STEPS = ['core', 'bullets', 'sentence', 'details', 'expand', 'done'] as const;
export type Step = (typeof STEPS)[number];
export const SCORED_STEPS = STEPS.length - 1;

export const BULLET_PICKS = 3;
/** Self-check items for the own sentence (ADR 0010: recorded, never scored). */
export const SELF_CHECKS = 3;
export const MAX_DRAFT = 600;
/** Soft word target for the own sentence; only shown as a hint. */
export const WORD_TARGET = 25;

export interface CompressionState {
  version: 1;
  seed: number;
  difficulty: Difficulty;
  piece: string;
  /** Sentence ids that form the text on this difficulty, in text order. */
  sentences: string[];
  /** Candidate bullets, in display order (seeded). */
  bullets: BulletId[];
  /** Candidate summary sentences, in display order (seeded). */
  summaries: SummaryId[];
  /** Detail ids for the expansion step, in display order (seeded). */
  details: string[];
  /** Expanded versions, in display order (seeded). */
  versions: VersionId[];
  step: Step;
  /** The current step's answer has been checked and its feedback is shown. Always true when `done`. */
  checked: boolean;
  /** Ticked sentence ids, in the order they were ticked. */
  core: string[];
  /** Chosen bullet ids (at most three), in the order they were chosen. */
  picks: BulletId[];
  summary: SummaryId | null;
  /** Ticked detail ids, in the order they were ticked. */
  needs: string[];
  expanded: VersionId | null;
  /** Own one-sentence version, never graded. */
  draft: string;
  checks: boolean[];
}

export const toDifficulty = (value: unknown): Difficulty => ((DIFFICULTIES as readonly unknown[]).includes(value) ? (value as Difficulty) : 'easy');
const levelOf = (difficulty: Difficulty) => DIFFICULTIES.indexOf(difficulty);

/** Easy: the shortest text; medium adds details; hard adds subtler details and side remarks. */
export function sentenceIdsFor(def: PieceDef, difficulty: Difficulty): string[] {
  const level = levelOf(difficulty);
  return def.sentences.filter((s) => s.level <= level).map((s) => s.id);
}

/** Easy: 3 gold + minor + distortion; medium adds the vague repeat; hard adds the subtle near copy. */
export function bulletIdsFor(difficulty: Difficulty): BulletId[] {
  if (difficulty === 'easy') return ['gold1', 'gold2', 'gold3', 'minor', 'distort'];
  if (difficulty === 'medium') return ['gold1', 'gold2', 'gold3', 'minor', 'distort', 'dup'];
  return [...BULLETS];
}

/** Easy: faithful, vague, added claim. Medium: adds the one that drops the key fact. Hard: the vague one is replaced by a subtle distortion. */
export function summaryIdsFor(difficulty: Difficulty): SummaryId[] {
  if (difficulty === 'easy') return ['faithful', 'vague', 'adds'];
  if (difficulty === 'medium') return ['faithful', 'vague', 'drops', 'adds'];
  return ['faithful', 'drops', 'adds', 'subtle'];
}

export function kindOf(def: PieceDef, sentenceId: string): SentenceKind | undefined {
  return def.sentences.find((s) => s.id === sentenceId)?.kind;
}

export const isGoldBullet = (id: BulletId): boolean => GOLD_BULLETS.includes(id);

export function isNeededDetail(def: PieceDef, detailId: string): boolean {
  return def.details.some((d) => d.id === detailId && d.needed);
}

export function createInitialState(seed: number, difficulty: Difficulty = 'easy'): CompressionState {
  const normalized = seed >>> 0;
  const rng = createRng(normalized);
  const def = rng.pick(PIECES);
  return {
    version: 1,
    seed: normalized,
    difficulty,
    piece: def.id,
    sentences: sentenceIdsFor(def, difficulty),
    bullets: rng.shuffle(bulletIdsFor(difficulty)),
    summaries: rng.shuffle(summaryIdsFor(difficulty)),
    details: rng.shuffle(def.details.map((d) => d.id)),
    versions: rng.shuffle([...VERSIONS]),
    step: 'core',
    checked: false,
    core: [],
    picks: [],
    summary: null,
    needs: [],
    expanded: null,
    draft: '',
    checks: Array<boolean>(SELF_CHECKS).fill(false)
  };
}

export function pieceOf(state: CompressionState): PieceDef {
  return pieceById(state.piece) as PieceDef;
}

export const isFinished = (state: CompressionState): boolean => state.step === 'done';
export const stepIndex = (step: Step): number => STEPS.indexOf(step);

/** True while the player may still change the answer of `step`. */
const editable = (state: CompressionState, step: Step) => state.step === step && !state.checked;

const toggle = <T>(list: readonly T[], item: T): T[] => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export function toggleSentence(state: CompressionState, id: string): CompressionState {
  if (!editable(state, 'core') || !state.sentences.includes(id)) return state;
  return { ...state, core: toggle(state.core, id) };
}

/** Picks or unpicks a bullet; a fourth pick is refused (the state is returned unchanged). */
export function toggleBullet(state: CompressionState, id: BulletId): CompressionState {
  if (!editable(state, 'bullets') || !state.bullets.includes(id)) return state;
  if (!state.picks.includes(id) && state.picks.length >= BULLET_PICKS) return state;
  return { ...state, picks: toggle(state.picks, id) };
}

export function chooseSummary(state: CompressionState, id: SummaryId): CompressionState {
  if (!editable(state, 'sentence') || !state.summaries.includes(id) || state.summary === id) return state;
  return { ...state, summary: id };
}

export function toggleDetail(state: CompressionState, id: string): CompressionState {
  if (!editable(state, 'details') || !state.details.includes(id)) return state;
  return { ...state, needs: toggle(state.needs, id) };
}

export function chooseVersion(state: CompressionState, id: VersionId): CompressionState {
  if (!editable(state, 'expand') || !state.versions.includes(id) || state.expanded === id) return state;
  return { ...state, expanded: id };
}

/** Whether the current step's answer is complete enough to be checked. */
export function canCheck(state: CompressionState): boolean {
  if (state.checked) return false;
  switch (state.step) {
    case 'core':
      return state.core.length > 0;
    case 'bullets':
      return state.picks.length === BULLET_PICKS;
    case 'sentence':
      return state.summary !== null;
    case 'details':
      return state.needs.length > 0;
    case 'expand':
      return state.expanded !== null;
    default:
      return false;
  }
}

/** Locks the current answer; its feedback is shown from now on. */
export function check(state: CompressionState): CompressionState {
  return canCheck(state) ? { ...state, checked: true } : state;
}

/** Leaves a checked step; after the last step the game is finished. */
export function next(state: CompressionState): CompressionState {
  if (!state.checked || state.step === 'done') return state;
  const step = STEPS[stepIndex(state.step) + 1] as Step;
  return { ...state, step, checked: step === 'done' };
}

/** The own sentence can be written once the summary sentence is checked (and is kept afterwards). */
export const canWrite = (state: CompressionState): boolean => state.step === 'sentence' && state.checked;

export function setDraft(state: CompressionState, text: string): CompressionState {
  const draft = text.slice(0, MAX_DRAFT);
  return canWrite(state) && state.draft !== draft ? { ...state, draft } : state;
}

export function toggleCheck(state: CompressionState, index: number): CompressionState {
  if (!canWrite(state) || !isInt(index, 0, SELF_CHECKS - 1)) return state;
  const checks = state.checks.slice();
  checks[index] = !checks[index];
  return { ...state, checks };
}

// --- Scoring ---------------------------------------------------------------------------------------

export type Verdict = 'hit' | 'miss' | 'extra' | 'skipped';

/** Verdict for one tickable item: `gold` = it should be ticked. */
export function verdictOf(gold: boolean, ticked: boolean): Verdict {
  if (gold) return ticked ? 'hit' : 'miss';
  return ticked ? 'extra' : 'skipped';
}

export interface SetScore {
  /** Gold items shown. */
  gold: number;
  hits: number;
  /** Non-gold items ticked. */
  extras: number;
}

export function scoreCore(state: CompressionState): SetScore {
  const def = pieceOf(state);
  let gold = 0;
  let hits = 0;
  let extras = 0;
  for (const id of state.sentences) {
    const isCore = kindOf(def, id) === 'core';
    const ticked = state.core.includes(id);
    if (isCore) gold++;
    if (isCore && ticked) hits++;
    if (!isCore && ticked) extras++;
  }
  return { gold, hits, extras };
}

export function scoreBullets(state: CompressionState): SetScore {
  const hits = state.picks.filter(isGoldBullet).length;
  return { gold: GOLD_BULLETS.length, hits, extras: state.picks.length - hits };
}

export function scoreDetails(state: CompressionState): SetScore {
  const def = pieceOf(state);
  let gold = 0;
  let hits = 0;
  let extras = 0;
  for (const id of state.details) {
    const needed = isNeededDetail(def, id);
    const ticked = state.needs.includes(id);
    if (needed) gold++;
    if (needed && ticked) hits++;
    if (!needed && ticked) extras++;
  }
  return { gold, hits, extras };
}

/** Words in a text; uses word segmentation where available so it also works for Chinese and Japanese. */
export function countWords(text: string, locale = 'en'): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    let n = 0;
    for (const part of new Intl.Segmenter(locale, { granularity: 'word' }).segment(trimmed)) if (part.isWordLike) n++;
    return n;
  }
  return trimmed.split(/\s+/).length;
}

/** Whether a step's answer has been checked (and therefore counts). */
export function isChecked(state: CompressionState, step: Exclude<Step, 'done'>): boolean {
  const current = stepIndex(state.step);
  const target = stepIndex(step);
  return target < current || (target === current && state.checked);
}

export interface GameSummary {
  core: SetScore | null;
  bullets: SetScore | null;
  sentence: boolean | null;
  details: SetScore | null;
  version: boolean | null;
}

/** Scores of all checked steps; unchecked steps are `null`. */
export function summarize(state: CompressionState): GameSummary {
  return {
    core: isChecked(state, 'core') ? scoreCore(state) : null,
    bullets: isChecked(state, 'bullets') ? scoreBullets(state) : null,
    sentence: isChecked(state, 'sentence') ? state.summary === 'faithful' : null,
    details: isChecked(state, 'details') ? scoreDetails(state) : null,
    version: isChecked(state, 'expand') ? state.expanded === 'actionable' : null
  };
}

// --- Validation ------------------------------------------------------------------------------------

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === 'string');
const isPermutationOf = (value: unknown, expected: readonly string[]): boolean =>
  isStringArray(value) && value.length === expected.length && new Set(value).size === value.length && expected.every((x) => value.includes(x));
const isSubsetOf = (value: unknown, allowed: readonly string[]): value is string[] =>
  isStringArray(value) && new Set(value).size === value.length && value.every((x) => allowed.includes(x));
const sameOrder = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Thorough structural validation of untrusted saves. Never throws. */
export function isCompressionState(value: unknown): value is CompressionState {
  try {
    if (!isRecord(value)) return false;
    const v = value;
    if (v.version !== 1 || !isUint32(v.seed)) return false;
    if (typeof v.difficulty !== 'string' || !(DIFFICULTIES as readonly string[]).includes(v.difficulty)) return false;
    const difficulty = v.difficulty as Difficulty;
    if (typeof v.piece !== 'string') return false;
    const def = pieceById(v.piece);
    if (!def) return false;
    if (!isStringArray(v.sentences) || !sameOrder(v.sentences, sentenceIdsFor(def, difficulty))) return false;
    if (!isPermutationOf(v.bullets, bulletIdsFor(difficulty))) return false;
    if (!isPermutationOf(v.summaries, summaryIdsFor(difficulty))) return false;
    if (!isPermutationOf(v.details, def.details.map((d) => d.id))) return false;
    if (!isPermutationOf(v.versions, VERSIONS)) return false;
    if (typeof v.step !== 'string' || !(STEPS as readonly string[]).includes(v.step)) return false;
    if (typeof v.checked !== 'boolean') return false;
    const step = stepIndex(v.step as Step);
    if (v.step === 'done' && !v.checked) return false;
    /** 1 = this step is answered and locked, 0 = it is the open current step, -1 = it lies ahead. */
    const phase = (s: Step) => {
      const i = stepIndex(s);
      return i < step || (i === step && v.checked) ? 1 : i === step ? 0 : -1;
    };

    if (!isSubsetOf(v.core, v.sentences)) return false;
    if (phase('core') === 1 && v.core.length === 0) return false;

    if (!isSubsetOf(v.picks, v.bullets as string[]) || v.picks.length > BULLET_PICKS) return false;
    if (phase('bullets') === 1 ? v.picks.length !== BULLET_PICKS : phase('bullets') === -1 && v.picks.length > 0) return false;

    if (v.summary !== null && (typeof v.summary !== 'string' || !(v.summaries as string[]).includes(v.summary))) return false;
    if (phase('sentence') === 1 ? v.summary === null : phase('sentence') === -1 && v.summary !== null) return false;

    if (!isSubsetOf(v.needs, v.details as string[])) return false;
    if (phase('details') === 1 ? v.needs.length === 0 : phase('details') === -1 && v.needs.length > 0) return false;

    if (v.expanded !== null && (typeof v.expanded !== 'string' || !(v.versions as string[]).includes(v.expanded))) return false;
    if (phase('expand') === 1 ? v.expanded === null : phase('expand') === -1 && v.expanded !== null) return false;

    if (typeof v.draft !== 'string' || v.draft.length > MAX_DRAFT) return false;
    if (!Array.isArray(v.checks) || v.checks.length !== SELF_CHECKS || !v.checks.every((c) => typeof c === 'boolean')) return false;
    if (phase('sentence') !== 1 && (v.draft !== '' || v.checks.some(Boolean))) return false;
    return true;
  } catch {
    return false;
  }
}

