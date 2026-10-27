/**
 * State and pure transitions of Sense of Time (design § 14). The state is plain JSON holding ids and numbers only;
 * results that depend on the content (the order solution, the earlier event, the gap rung, the right option, band,
 * distance, pairs) are computed when the item is created or checked and stored, so a later content correction never
 * flips an old review or makes `isTimelineState` reject a save. Every transition returns the same object when nothing
 * changes.
 */
import { isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { CONTENT_IDS, CONTENT_ID, curatedPair, ev, evOf, isEventId } from './data';
import { DIFFICULTIES, MODES, ROUND_KINDS, SPANS, generateRound, type Difficulty, type RoundMode, type Span } from './generate';
import { bandOf, isGapLadder, isNice, kendallPairs, pairsTotal, scoreYear, type Band } from './score';
import { ENTRY_UNITS, Y_MAX, Y_MIN, type EntryUnit } from './time';

export type { Difficulty, Mode, RoundMode, Span } from './generate';

export interface WhenDraft {
  y: number | null;
  unit: EntryUnit;
  /** What the player typed (unparsed, ≤ 24 characters). */
  text: string;
}

export interface WhenItem {
  kind: 'when';
  event: string;
  anchors: string[];
  draft: WhenDraft;
  /** The checked year, or 'skip'. */
  answer: number | 'skip' | null;
  milli: number | null;
  band: Band | null;
}

export interface OrderItem {
  kind: 'order';
  /** The shown starting order. */
  events: string[];
  /** The current arrangement (a permutation of `events`), oldest first. */
  draft: string[];
  /** The right order (oldest first), stored when the round is generated. */
  solution: string[];
  answer: string[] | 'skip' | null;
  pairs: number | null;
}

export interface FirstItem {
  kind: 'first';
  a: string;
  b: string;
  pair: string | null;
  /** Which event is older, stored when the round is generated. */
  earlier: 'a' | 'b';
  /** Four gap rungs (years) or none; `gapIndex` is the right one (−1 without a gap question). */
  gaps: number[];
  gapIndex: number;
  draft: { first: 'a' | 'b' | null; gap: number | null };
  answer: { first: 'a' | 'b'; gap: number | null } | 'skip' | null;
}

export interface TogetherItem {
  kind: 'together';
  focus: string;
  tau: number;
  options: string[];
  correct: number;
  draft: number | null;
  answer: number | 'skip' | null;
}

export type Item = WhenItem | OrderItem | FirstItem | TogetherItem;

export interface TimelineState {
  v: 2;
  content: string;
  seed: number;
  difficulty: Difficulty;
  mode: RoundMode;
  span: Span;
  items: Item[];
  /** The current item; `items.length` = the summary. */
  index: number;
  /** `finished()` was called (never twice, also after a restore). */
  reported: boolean;
}

export const MAX_TEXT = 24;
/** The save format (`metadata.stateVersion`); version 1 had no stored solutions (`migrateState`). */
export const STATE_VERSION = 2;

/* ---------- Creation ---------- */

/** A fresh round (§ 6): all randomness is spent here. */
export function createRound(seed: number, difficulty: Difficulty, mode: RoundMode, span: Span): TimelineState {
  const s = seed >>> 0;
  const { items } = generateRound(s, difficulty, mode, span);
  return {
    v: 2,
    content: CONTENT_ID,
    seed: s,
    difficulty,
    mode,
    span,
    index: 0,
    reported: false,
    items: items.map((it): Item => {
      switch (it.kind) {
        case 'when':
          return { ...it, anchors: [...it.anchors], draft: { y: null, unit: 'ce', text: '' }, answer: null, milli: null, band: null };
        case 'order':
          return { ...it, events: [...it.events], draft: [...it.events], solution: correctOrder(it.events), answer: null, pairs: null };
        case 'first':
          return { ...it, earlier: earlierOf(it), gaps: [...it.gaps], draft: { first: null, gap: null }, answer: null };
        case 'together':
          return { ...it, options: [...it.options], draft: null, answer: null };
      }
    })
  };
}

/** The start-screen settings as a valid choice (untrusted input, § 13.1). */
export function startChoice(difficulty: unknown, settings: unknown): { difficulty: Difficulty; mode: RoundMode; span: Span } {
  const rec = isRecord(settings) ? settings : {};
  return {
    difficulty: isOneOf(difficulty, DIFFICULTIES) ? difficulty : 'easy',
    mode: isOneOf(rec.mode, MODES) ? rec.mode : 'mixed',
    span: isOneOf(rec.span, SPANS) ? rec.span : 'all'
  };
}

/** What a state tells about the settings it was started with (ADR 0017). */
export const settingsOf = (s: TimelineState): Record<string, string> => ({ mode: s.mode, span: s.span, difficulty: s.difficulty });

/** The same round from the start (`reset`). */
export const restartRound = (s: TimelineState): TimelineState => createRound(s.seed, s.difficulty, s.mode, s.span);

/* ---------- Reading ---------- */

export const isSummary = (s: TimelineState): boolean => s.index >= s.items.length;
export const currentItem = (s: TimelineState): Item | undefined => s.items[s.index];
export const inReview = (item: Item): boolean => item.answer !== null;
export const phase = (s: TimelineState): 'question' | 'review' | 'summary' => {
  const item = currentItem(s);
  return !item ? 'summary' : inReview(item) ? 'review' : 'question';
};

/** The events of an order set from oldest to most recent in the current content (stored as `solution` at creation). */
export const correctOrder = (events: readonly string[]): string[] => [...events].sort((p, q) => evOf(p).y - evOf(q).y);
/** Which of two events is older in the current content (stored as `earlier` at creation). */
export const earlierOf = (item: Pick<FirstItem, 'a' | 'b'>): 'a' | 'b' => (evOf(item.a).y < evOf(item.b).y ? 'a' : 'b');

/* ---------- Transitions ---------- */

function withItem<T extends Item>(s: TimelineState, kind: T['kind'], f: (item: T) => T | null): TimelineState {
  const item = currentItem(s);
  if (!item || item.kind !== kind || inReview(item)) return s;
  const next = f(item as T);
  if (!next || next === item) return s;
  const items = s.items.slice();
  items[s.index] = next;
  return { ...s, items };
}

const sameDraft = (p: WhenDraft, q: WhenDraft) => p.y === q.y && p.unit === q.unit && p.text === q.text;

/** Sets the "when" draft: the year (null keeps it unset), the unit and the typed text (§ 7.1: one value). */
export function setWhenDraft(s: TimelineState, draft: WhenDraft): TimelineState {
  if (draft.y !== null && !(isInt(draft.y, Y_MIN, Y_MAX))) return s;
  if (!isOneOf(draft.unit, ENTRY_UNITS) || typeof draft.text !== 'string') return s;
  const next: WhenDraft = { y: draft.y, unit: draft.unit, text: draft.text.slice(0, MAX_TEXT) };
  return withItem<WhenItem>(s, 'when', (it) => (sameDraft(it.draft, next) ? null : { ...it, draft: next }));
}

/** Checks a "when" item: the band and the distance are stored (§ 7.3). */
export function checkWhen(s: TimelineState): TimelineState {
  return withItem<WhenItem>(s, 'when', (it) => {
    if (it.draft.y === null) return null;
    const e = evOf(it.event);
    const r = scoreYear(it.draft.y, e.lo, e.hi);
    return { ...it, answer: it.draft.y, milli: r.milli, band: r.band };
  });
}

/** Moves the card at `from` to `to` in an order draft. */
export function move(s: TimelineState, from: number, to: number): TimelineState {
  return withItem<OrderItem>(s, 'order', (it) => {
    const n = it.draft.length;
    if (!isInt(from, 0, n - 1) || !isInt(to, 0, n - 1) || from === to) return null;
    const draft = it.draft.slice();
    const [card] = draft.splice(from, 1);
    draft.splice(to, 0, card!);
    return { ...it, draft };
  });
}

/** Checks an order item: the number of pairs in the right relative order (by the stored solution) is stored (§ 8.2). */
export function checkOrder(s: TimelineState): TimelineState {
  return withItem<OrderItem>(s, 'order', (it) => ({ ...it, answer: it.draft.slice(), pairs: kendallPairs(it.draft, (id) => it.solution.indexOf(id)) }));
}

export function chooseFirst(s: TimelineState, first: 'a' | 'b'): TimelineState {
  if (first !== 'a' && first !== 'b') return s;
  return withItem<FirstItem>(s, 'first', (it) => (it.draft.first === first ? null : { ...it, draft: { ...it.draft, first } }));
}

export function chooseGap(s: TimelineState, gap: number): TimelineState {
  return withItem<FirstItem>(s, 'first', (it) => (!it.gaps.includes(gap) || it.draft.gap === gap ? null : { ...it, draft: { ...it.draft, gap } }));
}

/** Checks a first item; needs the first answer, and the gap answer when the item asks for one. */
export function checkFirst(s: TimelineState): TimelineState {
  return withItem<FirstItem>(s, 'first', (it) => {
    if (it.draft.first === null || (it.gaps.length > 0 && it.draft.gap === null)) return null;
    return { ...it, answer: { first: it.draft.first, gap: it.gaps.length ? it.draft.gap : null } };
  });
}

export function chooseOption(s: TimelineState, option: number): TimelineState {
  return withItem<TogetherItem>(s, 'together', (it) => (!isInt(option, 0, it.options.length - 1) || it.draft === option ? null : { ...it, draft: option }));
}

export function checkTogether(s: TimelineState): TimelineState {
  return withItem<TogetherItem>(s, 'together', (it) => (it.draft === null ? null : { ...it, answer: it.draft }));
}

/** "Skip — just show me": the review without scoring. */
export function skip(s: TimelineState): TimelineState {
  const item = currentItem(s);
  if (!item || inReview(item)) return s;
  const items = s.items.slice();
  items[s.index] = { ...item, answer: 'skip' } as Item;
  return { ...s, items };
}

/** To the next item (or the summary) after a review. */
export function next(s: TimelineState): TimelineState {
  const item = currentItem(s);
  if (!item || !inReview(item)) return s;
  return { ...s, index: s.index + 1 };
}

/** Records that `finished()` was called. */
export const markReported = (s: TimelineState): TimelineState => (s.reported || !isSummary(s) ? s : { ...s, reported: true });

/* ---------- Results ---------- */

/** Whether a first item's answer was right (null when skipped or open). */
export function firstRight(item: FirstItem): boolean | null {
  return item.answer === null || item.answer === 'skip' ? null : item.answer.first === item.earlier;
}
/** Whether the gap answer was right, one step off or further (null without a gap answer). */
export function gapResult(item: FirstItem): 'right' | 'near' | 'far' | null {
  if (item.answer === null || item.answer === 'skip' || item.answer.gap === null || item.gapIndex < 0) return null;
  const i = item.gaps.indexOf(item.answer.gap);
  const d = Math.abs(i - item.gapIndex);
  return d === 0 ? 'right' : d === 1 ? 'near' : 'far';
}
export function togetherRight(item: TogetherItem): boolean | null {
  return item.answer === null || item.answer === 'skip' ? null : item.answer === item.correct;
}

export interface Summary {
  readonly items: number;
  /** Answered (not skipped) items. */
  readonly answered: number;
  /** "When" items at ●●○ or better, "first"/"together" right, order items with every pair right. */
  readonly closeOrBetter: number;
  readonly pairsRight: number;
  readonly pairsTotal: number;
  readonly firstAsked: number;
  readonly firstRight: number;
  readonly togetherAsked: number;
  readonly togetherRight: number;
  /** Mean signed log ratio of answered "when" items outside the range (null with fewer than 3 answered). */
  readonly tendency: number | null;
  /** Tip key (§ 13.2). */
  readonly tip: 'deep' | 'recent' | 'general';
}

/** The round's description for the summary (§ 13.2). */
export function summarize(s: TimelineState): Summary {
  let answered = 0;
  let close = 0;
  let pr = 0;
  let pt = 0;
  let fa = 0;
  let fr = 0;
  let ta = 0;
  let tr = 0;
  let whenAnswered = 0;
  const signed: number[] = [];
  let deepOff = false;
  let recentOff = false;
  for (const it of s.items) {
    if (it.answer === null || it.answer === 'skip') continue;
    answered++;
    switch (it.kind) {
      case 'when': {
        whenAnswered++;
        const e = ev(it.event);
        if (it.band !== null && it.band <= 2) close++;
        if (e && typeof it.answer === 'number' && it.band !== null && it.band > 0) {
          const r = scoreYear(it.answer, e.lo, e.hi);
          signed.push(r.signed);
          if (it.band >= 4 && e.era === 'deep') deepOff = true;
          if (it.band >= 3 && e.era === 'modern') recentOff = true;
        }
        break;
      }
      case 'order':
        pr += it.pairs ?? 0;
        pt += pairsTotal(it.events.length);
        if (it.pairs === pairsTotal(it.events.length)) close++;
        break;
      case 'first':
        fa++;
        if (firstRight(it)) {
          fr++;
          close++;
        }
        break;
      case 'together':
        ta++;
        if (togetherRight(it)) {
          tr++;
          close++;
        }
        break;
    }
  }
  const tendency = whenAnswered >= 3 ? (signed.length ? signed.reduce((p, q) => p + q, 0) / signed.length : 0) : null;
  return {
    items: s.items.length,
    answered,
    closeOrBetter: close,
    pairsRight: pr,
    pairsTotal: pt,
    firstAsked: fa,
    firstRight: fr,
    togetherAsked: ta,
    togetherRight: tr,
    tendency,
    tip: deepOff ? 'deep' : recentOff ? 'recent' : 'general'
  };
}

/** The tendency sentence key: further back, more recent, or none (threshold ±0.03 decades). */
export const tendencyKey = (t: number | null): 'back' | 'recent' | 'none' | null => (t === null ? null : t > 0.03 ? 'back' : t < -0.03 ? 'recent' : 'none');

/* ---------- Validation (never throws) ---------- */

const isIdList = (v: unknown, min: number, max: number): v is string[] =>
  Array.isArray(v) && v.length >= min && v.length <= max && v.every(isEventId) && new Set(v).size === v.length;

const isPermutation = (p: readonly string[], q: readonly string[]): boolean => p.length === q.length && q.every((x) => p.includes(x));

/** The band a stored distance allows (band 0 only with distance 0). */
function bandConsistent(band: unknown, milli: unknown): boolean {
  if (!isInt(milli, 0, 1_000_000) || !isInt(band, 0, 4)) return false;
  if (band === 0) return milli === 0;
  return bandOf(milli, false) === band;
}

function validWhen(it: Record<string, unknown>, d: Difficulty): boolean {
  if (!isEventId(it.event) || !isIdList(it.anchors, 0, 3) || (it.anchors as string[]).includes(it.event as string)) return false;
  if (d === 'hard' && (it.anchors as string[]).length) return false;
  const dr = it.draft;
  if (!isRecord(dr) || !(dr.y === null || isInt(dr.y, Y_MIN, Y_MAX)) || !isOneOf(dr.unit, ENTRY_UNITS)) return false;
  if (typeof dr.text !== 'string' || dr.text.length > MAX_TEXT) return false;
  if (it.answer === null || it.answer === 'skip') return it.milli === null && it.band === null;
  if (!isInt(it.answer, Y_MIN, Y_MAX) || !bandConsistent(it.band, it.milli)) return false;
  return true;
}

// Only the stored results are compared, never the current dates: a corrected date keeps old saves valid (§ 14).
function validOrder(it: Record<string, unknown>): boolean {
  if (!isIdList(it.events, 3, 6)) return false;
  const events = it.events;
  if (!isIdList(it.draft, 3, 6) || !isPermutation(events, it.draft)) return false;
  if (!isIdList(it.solution, 3, 6) || !isPermutation(events, it.solution)) return false;
  const solution = it.solution;
  if (it.answer === null || it.answer === 'skip') return it.pairs === null;
  if (!isIdList(it.answer, 3, 6) || !isPermutation(events, it.answer)) return false;
  return isInt(it.pairs, 0, pairsTotal(events.length)) && it.pairs === kendallPairs(it.answer, (id) => solution.indexOf(id));
}

function validFirst(it: Record<string, unknown>, d: Difficulty): boolean {
  if (!isEventId(it.a) || !isEventId(it.b) || it.a === it.b || !(it.earlier === 'a' || it.earlier === 'b')) return false;
  if (it.pair !== null) {
    const p = typeof it.pair === 'string' ? curatedPair(it.pair) : undefined;
    if (!p || !((p.older === it.a && p.newer === it.b) || (p.older === it.b && p.newer === it.a))) return false;
  }
  const gaps = it.gaps;
  if (!Array.isArray(gaps)) return false;
  if (gaps.length === 0) {
    if (it.gapIndex !== -1) return false;
  } else if (d === 'easy' || !isGapLadder(d, gaps) || !isInt(it.gapIndex, 0, 3)) return false;
  const dr = it.draft;
  if (!isRecord(dr) || !(dr.first === null || dr.first === 'a' || dr.first === 'b')) return false;
  if (!(dr.gap === null || (gaps as unknown[]).includes(dr.gap))) return false;
  const ans = it.answer;
  if (ans === null || ans === 'skip') return true;
  if (!isRecord(ans) || !(ans.first === 'a' || ans.first === 'b')) return false;
  return gaps.length ? (gaps as unknown[]).includes(ans.gap) : ans.gap === null;
}

function validTogether(it: Record<string, unknown>): boolean {
  if (!isEventId(it.focus) || !isNice(it.tau) || !isIdList(it.options, 3, 3)) return false;
  if ((it.options as string[]).includes(it.focus as string) || !isInt(it.correct, 0, 2)) return false;
  if (!(it.draft === null || isInt(it.draft, 0, 2))) return false;
  return it.answer === null || it.answer === 'skip' || isInt(it.answer, 0, 2);
}

/** Checks every type and bound of a save (§ 14). Never throws. */
export function isTimelineState(value: unknown): value is TimelineState {
  try {
    if (!isRecord(value) || value.v !== STATE_VERSION || !isOneOf(value.content, CONTENT_IDS) || !isUint32(value.seed)) return false;
    if (!isOneOf(value.difficulty, DIFFICULTIES) || !isOneOf(value.mode, MODES) || !isOneOf(value.span, SPANS)) return false;
    const d = value.difficulty;
    const kinds = ROUND_KINDS[value.mode];
    if (!Array.isArray(value.items) || value.items.length !== kinds.length) return false;
    if (!isInt(value.index, 0, kinds.length) || typeof value.reported !== 'boolean') return false;
    if (value.reported && value.index !== kinds.length) return false;
    const subjects = new Set<string>();
    for (let i = 0; i < kinds.length; i++) {
      const it: unknown = value.items[i];
      if (!isRecord(it)) return false;
      // Fallback (3) may turn any item into a "when" item.
      if (it.kind !== kinds[i] && it.kind !== 'when') return false;
      const ok = it.kind === 'when' ? validWhen(it, d) : it.kind === 'order' ? validOrder(it) : it.kind === 'first' ? validFirst(it, d) : it.kind === 'together' ? validTogether(it) : false;
      if (!ok) return false;
      // Items before the current one are answered; later ones are untouched.
      if (i < value.index && it.answer === null) return false;
      if (i > value.index && it.answer !== null) return false;
      for (const id of it.kind === 'when' ? [it.event] : it.kind === 'order' ? (it.events as string[]) : it.kind === 'first' ? [it.a, it.b] : [it.focus]) subjects.add(id as string);
    }
    return subjects.size > 0;
  } catch {
    return false;
  }
}

/**
 * Upgrades a version 1 save (§ 14): it had no stored solutions, so the order solution and the earlier event are
 * filled from the content at load. Every answer and stored result stays as it was; a save that does not validate
 * afterwards is refused (`undefined`). Never throws.
 */
export function migrateState(state: unknown, fromVersion: number): TimelineState | undefined {
  try {
    if (fromVersion !== 1 || !isRecord(state) || state.v !== 1 || !Array.isArray(state.items)) return undefined;
    const known = (ids: unknown): ids is string[] => Array.isArray(ids) && ids.every(isEventId);
    const items: unknown[] = [];
    for (const it of state.items) {
      if (isRecord(it) && it.kind === 'order' && it.solution === undefined) {
        if (!known(it.events)) return undefined;
        items.push({ ...it, solution: correctOrder(it.events) });
      } else if (isRecord(it) && it.kind === 'first' && it.earlier === undefined) {
        if (!isEventId(it.a) || !isEventId(it.b)) return undefined;
        items.push({ ...it, earlier: earlierOf({ a: it.a, b: it.b }) });
      } else items.push(it);
    }
    const next: unknown = { ...state, v: STATE_VERSION, items };
    return isTimelineState(next) ? next : undefined;
  } catch {
    return undefined;
  }
}
