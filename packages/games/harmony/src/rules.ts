/**
 * State and transitions of Tones & Chords (design § 13). Pure: plain JSON state, no DOM, no randomness beyond the
 * seeded generator. Every transition returns the same object when nothing changes, so the view saves only real changes.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed, type SettingValue } from '@wp/game-core';
import { generateRound } from './generate';
import {
  BASE_MAX,
  BASE_MIN,
  FREE_HIGH,
  FREE_LOW,
  KEYS_HIGH,
  KEYS_LOW,
  LEVELS,
  MAX_KEYS,
  QUIZ_TOPICS,
  ROUND_LENGTH,
  SENSES,
  SENSE_TOPICS,
  TOPICS,
  type Level,
  type QuizTopic,
  type Senses,
  type Topic
} from './levels';
import { CHANGED_POSITIONS, answerIndex, buildTargetPcs, contourOf, optionCount, specProblem, type BuildSpec, type ChoiceSpec, type Spec } from './spec';
import { midiOf } from './spelling';
import { SCALES, SEMITONES, classOf, pcSet, sameSet, type ScaleId } from './theory';

export type Answer = { readonly choice: number } | { readonly keys: readonly number[] };
export type Peeked = false | 'hint' | 'no-sound';

export interface Item {
  readonly spec: Spec;
  /** The current, uncommitted choice (survives a reload). */
  readonly draft: Answer | null;
  readonly answer: Answer | 'skip' | null;
  /** Stored at commit, so a later theory fix never flips an old review. */
  readonly matched: boolean | null;
  readonly peeked: Peeked;
}

export interface QuizState {
  readonly v: 1;
  readonly topic: QuizTopic;
  readonly senses: Senses;
  readonly difficulty: Level;
  readonly seed: number;
  readonly items: readonly Item[];
  /** `items.length` = the summary. */
  readonly index: number;
  readonly reported: boolean;
}

export interface Overlay {
  readonly tonic: number;
  readonly s: ScaleId;
}

export interface KeyboardState {
  readonly v: 1;
  readonly topic: 'keyboard';
  readonly seed: number;
  /** Held MIDI notes (hold mode), sorted, distinct, ≤ 12. */
  readonly held: readonly number[];
  /** The octave the visible keyboard starts at (2…5). */
  readonly base: number;
  readonly mode: 'play' | 'hold';
  readonly tuning: 'equal' | 'just';
  readonly overlay: Overlay | null;
}

export type HarmonyState = QuizState | KeyboardState;

export const isQuiz = (s: HarmonyState): s is QuizState => s.topic !== 'keyboard';

/* ---------- Settings (ADR 0017) ---------- */

export interface RoundSettings {
  readonly topic: Topic;
  readonly senses: Senses;
  readonly difficulty: Level;
}

/** Untrusted start-screen values → settings; anything missing or invalid falls back to the defaults (design § 6). */
export function readSettings(settings: Readonly<Record<string, SettingValue>> | undefined, difficulty: unknown): RoundSettings {
  const topic = isOneOf(settings?.topic, TOPICS) ? settings.topic : 'intervals';
  const senses = isOneOf(topic, SENSE_TOPICS) && isOneOf(settings?.senses, SENSES) ? settings.senses : 'ear';
  return { topic, senses, difficulty: isOneOf(difficulty, LEVELS) ? difficulty : 'easy' };
}

/** The start-screen settings a state was started with (only those the start screen shows for its topic). */
export function settingsOf(state: HarmonyState): Record<string, SettingValue> {
  if (!isQuiz(state)) return { topic: 'keyboard' };
  return {
    topic: state.topic,
    difficulty: state.difficulty,
    ...((SENSE_TOPICS as readonly string[]).includes(state.topic) ? { senses: state.senses } : {})
  };
}

/* ---------- New rounds ---------- */

export const emptyItem = (spec: Spec): Item => ({ spec, draft: null, answer: null, matched: null, peeked: false });

export function newKeyboard(seed: number): KeyboardState {
  return { v: 1, topic: 'keyboard', seed: normalizeSeed(seed), held: [], base: 4, mode: 'hold', tuning: 'equal', overlay: null };
}

export function newRound(seed: number, settings: RoundSettings): HarmonyState {
  const s = normalizeSeed(seed);
  if (settings.topic === 'keyboard') return newKeyboard(s);
  return {
    v: 1,
    topic: settings.topic,
    senses: settings.senses,
    difficulty: settings.difficulty,
    seed: s,
    items: generateRound(s, settings.topic, settings.difficulty).map(emptyItem),
    index: 0,
    reported: false
  };
}

/** The same round again with every answer cleared (`reset`). */
export function restart(state: HarmonyState): HarmonyState {
  return isQuiz(state) ? newRound(state.seed, state) : newKeyboard(state.seed);
}

/* ---------- Answers ---------- */

const isChoice = (a: Answer): a is { readonly choice: number } => 'choice' in a;

/** Whether an answer is right (design § 10): the choice index, the exact MIDI note or the pitch-class set. */
export function isMatch(spec: Spec, answer: Answer): boolean {
  if (spec.k !== 'build') return isChoice(answer) && answer.choice === answerIndex(spec);
  if (isChoice(answer)) return false;
  const root = midiOf(spec.root);
  if (spec.task === 'interval') return answer.keys.length === 1 && answer.keys[0] === root + SEMITONES[spec.target];
  return sameSet(pcSet([root, ...answer.keys]), buildTargetPcs(spec));
}

/** A well-formed answer for this spec (choice in range, or sorted distinct keys on the keyboard without the root). */
export function isAnswerFor(spec: Spec, value: unknown): value is Answer {
  if (!isRecord(value) || Object.keys(value).length !== 1) return false;
  if (spec.k !== 'build') return isInt(value.choice, 0, optionCount(spec) - 1);
  const keys = value.keys;
  if (!isArrayOf(keys, (k): k is number => isInt(k, KEYS_LOW, KEYS_HIGH)) || keys.length > MAX_KEYS) return false;
  if (keys.some((k, i) => i > 0 && k <= keys[i - 1]!)) return false;
  if (keys.includes(midiOf(spec.root))) return false;
  return spec.task !== 'interval' || keys.length <= 1;
}

export const currentItem = (state: QuizState): Item | undefined => state.items[state.index];
export const isSummary = (state: QuizState): boolean => state.index >= state.items.length;
export const isCommitted = (item: Item): boolean => item.answer !== null;

const withItem = (state: QuizState, item: Item): QuizState => ({ ...state, items: state.items.map((x, i) => (i === state.index ? item : x)) });

/** Sets the uncommitted choice (no-op after Check or for a malformed answer). */
export function setDraft(state: QuizState, answer: Answer): QuizState {
  const item = currentItem(state);
  if (!item || isCommitted(item) || !isAnswerFor(item.spec, answer)) return state;
  if (JSON.stringify(item.draft) === JSON.stringify(answer)) return state;
  return withItem(state, { ...item, draft: answer });
}

/** Toggles a key of a build task's draft (easy: the one chosen key). */
export function toggleBuildKey(state: QuizState, midi: number): QuizState {
  const item = currentItem(state);
  if (!item || isCommitted(item) || item.spec.k !== 'build') return state;
  const keys = item.draft && 'keys' in item.draft ? item.draft.keys : [];
  let next: number[];
  if (item.spec.task === 'interval') next = keys[0] === midi ? [] : [midi];
  else next = keys.includes(midi) ? keys.filter((k) => k !== midi) : [...keys, midi].sort((a, b) => a - b);
  return setDraft(state, { keys: next });
}

/** "Check": commits the draft and stores whether it matched. */
export function commit(state: QuizState): QuizState {
  const item = currentItem(state);
  if (!item || isCommitted(item) || !item.draft) return state;
  if (!isChoice(item.draft) && item.draft.keys.length === 0) return state;
  return withItem(state, { ...item, answer: item.draft, matched: isMatch(item.spec, item.draft) });
}

/** "Skip — just show me": the item is shown and not counted. */
export function skip(state: QuizState): QuizState {
  const item = currentItem(state);
  if (!item || isCommitted(item)) return state;
  return withItem(state, { ...item, answer: 'skip', matched: null });
}

/** "Show the picture" by ear or "Show on the keyboard" by eye (`hint`), or the automatic picture by ear when sound is unavailable (`no-sound`). */
export function peek(state: QuizState, kind: 'hint' | 'no-sound'): QuizState {
  const item = currentItem(state);
  if (!item || isCommitted(item) || item.peeked !== false || (kind === 'no-sound' && state.senses !== 'ear')) return state;
  return withItem(state, { ...item, peeked: kind });
}

/** To the next item (or the summary) after the current one was checked or skipped. */
export function next(state: QuizState): QuizState {
  const item = currentItem(state);
  if (!item || !isCommitted(item)) return state;
  return { ...state, index: state.index + 1 };
}

export function markReported(state: QuizState): QuizState {
  return isSummary(state) && !state.reported ? { ...state, reported: true } : state;
}

/* ---------- Summary (design § 10) ---------- */

export interface MixUp {
  /** What kind of item (for the tip). */
  readonly k: ChoiceSpec['k'];
  /** Option values: the right one and the chosen one (interval ids, chord ids, contours, positions …). */
  readonly answer: string;
  readonly choice: string;
  readonly count: number;
}

export interface Summary {
  readonly asked: number;
  readonly matched: number;
  readonly skipped: number;
  readonly hints: number;
  readonly noSound: number;
  readonly mixUps: readonly MixUp[];
}

/** The value of option `i` of a choice spec, as a stable string. */
export function optionValue(spec: ChoiceSpec, i: number): string {
  switch (spec.k) {
    case 'pair':
      return (i === 0 ? spec.first : spec.second).ivl;
    case 'changed':
      return String(CHANGED_POSITIONS[i]);
    case 'rhythm':
      return (spec.options[i] ?? []).join(',');
    default:
      return String(spec.options[i]);
  }
}

export function summarize(state: QuizState): Summary {
  let asked = 0;
  let matched = 0;
  let skipped = 0;
  let hints = 0;
  let noSound = 0;
  const mixes = new Map<string, { k: ChoiceSpec['k']; answer: string; choice: string; count: number; first: number }>();
  state.items.forEach((item, i) => {
    if (item.peeked === 'hint') hints++;
    if (item.peeked === 'no-sound') noSound++;
    if (item.answer === 'skip') skipped++;
    else if (item.answer !== null) {
      asked++;
      if (item.matched) matched++;
      else if (item.spec.k !== 'build' && isChoice(item.answer)) {
        const spec = item.spec;
        const answer = optionValue(spec, answerIndex(spec));
        const choice = optionValue(spec, item.answer.choice);
        const key = `${spec.k}|${answer}|${choice}`;
        const found = mixes.get(key);
        if (found) found.count++;
        else mixes.set(key, { k: spec.k, answer, choice, count: 1, first: i });
      }
    }
  });
  const mixUps = [...mixes.values()].sort((a, b) => b.count - a.count || a.first - b.first).slice(0, 3).map(({ first: _first, ...m }) => m);
  return { asked, matched, skipped, hints, noSound, mixUps };
}

/* ---------- Free keyboard (design § 7.7) ---------- */

const inFree = (m: unknown): m is number => isInt(m, FREE_LOW, FREE_HIGH);

export function toggleHeld(state: KeyboardState, midi: number): KeyboardState {
  if (state.mode !== 'hold' || !inFree(midi)) return state;
  if (state.held.includes(midi)) return { ...state, held: state.held.filter((m) => m !== midi) };
  if (state.held.length >= MAX_KEYS) return state;
  return { ...state, held: [...state.held, midi].sort((a, b) => a - b) };
}

export const clearHeld = (state: KeyboardState): KeyboardState => (state.held.length ? { ...state, held: [] } : state);

export const setBase = (state: KeyboardState, base: number): KeyboardState =>
  isInt(base, BASE_MIN, BASE_MAX) && base !== state.base ? { ...state, base } : state;

export const setMode = (state: KeyboardState, mode: 'play' | 'hold'): KeyboardState =>
  mode === state.mode ? state : { ...state, mode, held: mode === 'play' ? [] : state.held };

export const setTuning = (state: KeyboardState, tuning: 'equal' | 'just'): KeyboardState => (tuning === state.tuning ? state : { ...state, tuning });

export function setOverlay(state: KeyboardState, overlay: Overlay | null): KeyboardState {
  if (overlay && !isOverlay(overlay)) return state;
  if (JSON.stringify(overlay) === JSON.stringify(state.overlay)) return state;
  return { ...state, overlay };
}

/* ---------- Validation (never throws) ---------- */

const isOverlay = (v: unknown): v is Overlay => isRecord(v) && Object.keys(v).length === 2 && isInt(v.tonic, 0, 11) && isOneOf(v.s, SCALES);

const TOPIC_KINDS: Readonly<Record<QuizTopic, Readonly<Record<Level, readonly string[]>>>> = {
  intervals: { easy: ['interval'], medium: ['interval'], hard: ['interval'] },
  chords: { easy: ['chord'], medium: ['chord', 'scale'], hard: ['chord', 'scale'] },
  stability: { easy: ['pair'], medium: ['pair'], hard: ['pair', 'cadence'] },
  melody: { easy: ['contour'], medium: ['contour'], hard: ['changed'] },
  rhythm: { easy: ['rhythm'], medium: ['rhythm'], hard: ['rhythm'] },
  build: { easy: ['build'], medium: ['build'], hard: ['build'] }
};

function isValidItem(v: unknown, topic: QuizTopic, level: Level, senses: Senses): v is Item {
  if (!isRecord(v) || Object.keys(v).length !== 5) return false;
  if (!isRecord(v.spec) || !TOPIC_KINDS[topic][level].includes(v.spec.k as string) || specProblem(v.spec, level) !== undefined) return false;
  const spec = v.spec as unknown as Spec;
  if (v.draft !== null && !isAnswerFor(spec, v.draft)) return false;
  if (!(v.peeked === false || v.peeked === 'hint' || (v.peeked === 'no-sound' && senses === 'ear'))) return false;
  if (v.answer === null) return v.matched === null;
  if (v.answer === 'skip') return v.matched === null;
  if (!isAnswerFor(spec, v.answer)) return false;
  if (!isChoice(v.answer as Answer) && (v.answer as { keys: number[] }).keys.length === 0) return false;
  return v.matched === isMatch(spec, v.answer as Answer);
}

function isKeyboardState(v: Record<string, unknown>): boolean {
  return (
    Object.keys(v).length === 8 &&
    isUint32(v.seed) &&
    isArrayOf(v.held, inFree) &&
    (v.held as number[]).length <= MAX_KEYS &&
    (v.held as number[]).every((m, i, a) => i === 0 || m > a[i - 1]!) &&
    isInt(v.base, BASE_MIN, BASE_MAX) &&
    isOneOf(v.mode, ['play', 'hold'] as const) &&
    (v.mode === 'hold' || (v.held as number[]).length === 0) &&
    isOneOf(v.tuning, ['equal', 'just'] as const) &&
    (v.overlay === null || isOverlay(v.overlay))
  );
}

export function isHarmonyState(value: unknown): value is HarmonyState {
  try {
    if (!isRecord(value) || value.v !== 1) return false;
    if (value.topic === 'keyboard') return isKeyboardState(value);
    if (!isOneOf(value.topic, QUIZ_TOPICS) || !isOneOf(value.difficulty, LEVELS) || !isOneOf(value.senses, SENSES) || !isUint32(value.seed)) return false;
    if (Object.keys(value).length !== 8) return false;
    const { topic, difficulty, senses } = value;
    if (!(SENSE_TOPICS as readonly string[]).includes(topic) && senses !== 'ear') return false;
    if (!Array.isArray(value.items) || value.items.length !== ROUND_LENGTH[topic]) return false;
    if (!value.items.every((item) => isValidItem(item, topic, difficulty, senses))) return false;
    const items = value.items as Item[];
    if (!isInt(value.index, 0, items.length) || typeof value.reported !== 'boolean') return false;
    if (value.reported && value.index !== items.length) return false;
    // Items before the current one are answered; items after it are untouched.
    for (let i = 0; i < items.length; i++) {
      if (i < value.index && !isCommitted(items[i]!)) return false;
      if (i > value.index && (items[i]!.answer !== null || items[i]!.draft !== null || items[i]!.peeked !== false)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Facts the review shows next to a choice item (re-exported for the view). */
export { answerIndex, classOf, contourOf };
export type { BuildSpec, ChoiceSpec };
