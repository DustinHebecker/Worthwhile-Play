import { createRng, isInt, isRecord, isUint32 } from '@wp/game-core';
import {
  ACTIONS,
  DECISIONS,
  RIGHT_ACTION,
  RIGHT_DECISION,
  SITUATIONS,
  SLOTS,
  situationById,
  type ActionId,
  type CardDef,
  type DecisionId,
  type SituationDef,
  type Slot
} from './situations';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * `sort` place every card → `decide` (sorting checked) pick decision and next action →
 * `review` (choices checked) compare with the model briefing, optional notes and self-check → `done`.
 */
export const STEPS = ['sort', 'decide', 'review', 'done'] as const;
export type Step = (typeof STEPS)[number];

/** Self-check items (ADR 0010: recorded as self-assessment, never scored). */
export const SELF_CHECKS = 3;
export const MAX_NOTES = 2000;

export interface BriefingState {
  version: 1;
  seed: number;
  difficulty: Difficulty;
  situation: string;
  step: Step;
  /** Card ids shown in this game, in display order. */
  cards: string[];
  /** Slot chosen for each card (parallel to `cards`), `null` while unsorted. */
  placement: (Slot | null)[];
  /** Display order of the decision and next-action options (seeded). */
  decisionOrder: DecisionId[];
  actionOrder: ActionId[];
  decision: DecisionId | null;
  action: ActionId | null;
  /** Own notes or wording, never graded. */
  notes: string;
  checks: boolean[];
}

export const toDifficulty = (value: unknown): Difficulty => ((DIFFICULTIES as readonly unknown[]).includes(value) ? (value as Difficulty) : 'easy');

const MAX_LEVEL: Readonly<Record<Difficulty, number>> = { easy: 1, medium: 2, hard: 3 };

/** Cards shown on a difficulty, in definition order. */
export function cardIdsFor(def: SituationDef, difficulty: Difficulty): string[] {
  return def.cards.filter((c) => c.level <= MAX_LEVEL[difficulty]).map((c) => c.id);
}

export function situationOf(state: BriefingState): SituationDef {
  return situationById(state.situation) as SituationDef;
}

export function cardDef(def: SituationDef, cardId: string): CardDef | undefined {
  return def.cards.find((c) => c.id === cardId);
}

export function createInitialState(seed: number, difficulty: Difficulty = 'easy'): BriefingState {
  const normalized = seed >>> 0;
  const rng = createRng(normalized);
  const def = rng.pick(SITUATIONS);
  const cards = rng.shuffle(cardIdsFor(def, difficulty));
  return {
    version: 1,
    seed: normalized,
    difficulty,
    situation: def.id,
    step: 'sort',
    cards,
    placement: cards.map(() => null),
    decisionOrder: rng.shuffle(DECISIONS),
    actionOrder: rng.shuffle(ACTIONS),
    decision: null,
    action: null,
    notes: '',
    checks: Array<boolean>(SELF_CHECKS).fill(false)
  };
}

export const unsortedCount = (state: BriefingState): number => state.placement.filter((p) => p === null).length;

/** Puts a card into a slot (or back to unsorted with `null`). Only while sorting. */
export function placeCard(state: BriefingState, cardId: string, slot: Slot | null): BriefingState {
  if (state.step !== 'sort') return state;
  const index = state.cards.indexOf(cardId);
  if (index < 0) return state;
  if (slot !== null && !(SLOTS as readonly string[]).includes(slot)) return state;
  if (state.placement[index] === slot) return state;
  const placement = state.placement.slice();
  placement[index] = slot;
  return { ...state, placement };
}

/** Locks the sorting (every card must be placed); its feedback is shown from now on. */
export function checkSort(state: BriefingState): BriefingState {
  return state.step === 'sort' && unsortedCount(state) === 0 ? { ...state, step: 'decide' } : state;
}

export function chooseDecision(state: BriefingState, id: DecisionId): BriefingState {
  return state.step === 'decide' && state.decisionOrder.includes(id) && state.decision !== id ? { ...state, decision: id } : state;
}

export function chooseAction(state: BriefingState, id: ActionId): BriefingState {
  return state.step === 'decide' && state.actionOrder.includes(id) && state.action !== id ? { ...state, action: id } : state;
}

export function checkChoices(state: BriefingState): BriefingState {
  return state.step === 'decide' && state.decision !== null && state.action !== null ? { ...state, step: 'review' } : state;
}

export function setNotes(state: BriefingState, text: string): BriefingState {
  const notes = text.slice(0, MAX_NOTES);
  return state.step === 'review' && state.notes !== notes ? { ...state, notes } : state;
}

export function toggleCheck(state: BriefingState, index: number): BriefingState {
  if (state.step !== 'review' || !isInt(index, 0, SELF_CHECKS - 1)) return state;
  const checks = state.checks.slice();
  checks[index] = !checks[index];
  return { ...state, checks };
}

export function finish(state: BriefingState): BriefingState {
  return state.step === 'review' ? { ...state, step: 'done' } : state;
}

export const isFinished = (state: BriefingState): boolean => state.step === 'done';

// --- Scoring ------------------------------------------------------------------------------------

export interface CardVerdict {
  correct: boolean;
  /** Where the model briefing puts the card. */
  primary: Slot;
  /** Every accepted slot (primary first). */
  gold: readonly Slot[];
  placed: Slot | null;
}

export function verdictFor(def: SituationDef, cardId: string, placed: Slot | null): CardVerdict {
  const card = cardDef(def, cardId) as CardDef;
  return { correct: placed !== null && card.gold.includes(placed), primary: card.gold[0] as Slot, gold: card.gold, placed };
}

export interface Confusion {
  /** Primary gold slot of the mis-sorted cards. */
  from: Slot;
  /** Where the person put them (`null` = unsorted). */
  to: Slot | null;
  count: number;
}

export interface SortScore {
  total: number;
  correct: number;
  /** Per primary gold slot: how many cards belong there and how many of them were sorted acceptably. */
  bySlot: Record<Slot, { total: number; correct: number }>;
  /** Mis-sorting patterns, most frequent first (ties in slot order). */
  confusions: Confusion[];
}

const slotRank = (slot: Slot | null) => (slot === null ? SLOTS.length : SLOTS.indexOf(slot));

export function scoreSort(state: BriefingState): SortScore {
  const def = situationOf(state);
  const bySlot = Object.fromEntries(SLOTS.map((s) => [s, { total: 0, correct: 0 }])) as Record<Slot, { total: number; correct: number }>;
  const confusions: Confusion[] = [];
  let correct = 0;
  state.cards.forEach((cardId, i) => {
    const v = verdictFor(def, cardId, state.placement[i] ?? null);
    const bucket = bySlot[v.primary];
    bucket.total++;
    if (v.correct) {
      bucket.correct++;
      correct++;
      return;
    }
    const existing = confusions.find((c) => c.from === v.primary && c.to === v.placed);
    if (existing) existing.count++;
    else confusions.push({ from: v.primary, to: v.placed, count: 1 });
  });
  confusions.sort((a, b) => b.count - a.count || slotRank(a.from) - slotRank(b.from) || slotRank(a.to) - slotRank(b.to));
  return { total: state.cards.length, correct, bySlot, confusions };
}

export interface GameSummary extends SortScore {
  decisionCorrect: boolean;
  actionCorrect: boolean;
  /** Self-check boxes ticked (self-assessment, not a score). */
  checked: number;
}

export function summarize(state: BriefingState): GameSummary {
  return {
    ...scoreSort(state),
    decisionCorrect: state.decision === RIGHT_DECISION,
    actionCorrect: state.action === RIGHT_ACTION,
    checked: state.checks.filter(Boolean).length
  };
}

/** The briefing as the person sorted it: card ids per section (display order), without left-out cards. */
export function assembledBriefing(state: BriefingState): Record<Slot, string[]> {
  const out = Object.fromEntries(SLOTS.map((s) => [s, [] as string[]])) as Record<Slot, string[]>;
  state.cards.forEach((cardId, i) => {
    const slot = state.placement[i];
    if (slot) out[slot].push(cardId);
  });
  return out;
}

/** The model briefing: every shown card at its primary gold slot, in definition order. */
export function modelBriefing(state: BriefingState): Record<Slot, string[]> {
  const def = situationOf(state);
  const out = Object.fromEntries(SLOTS.map((s) => [s, [] as string[]])) as Record<Slot, string[]>;
  for (const card of def.cards) if (state.cards.includes(card.id)) out[card.gold[0] as Slot].push(card.id);
  return out;
}

// --- Validation ---------------------------------------------------------------------------------

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === 'string');
const sameMembers = (a: readonly string[], b: readonly string[]) => a.length === b.length && new Set(a).size === a.length && b.every((x) => a.includes(x));
const STEP_RANK: Readonly<Record<Step, number>> = { sort: 0, decide: 1, review: 2, done: 3 };

/** Thorough structural validation of untrusted saves. Never throws. */
export function isBriefingState(value: unknown): value is BriefingState {
  try {
    if (!isRecord(value)) return false;
    const { version, seed, difficulty, situation, step, cards, placement, decisionOrder, actionOrder, decision, action, notes, checks } = value;
    if (version !== 1 || !isUint32(seed)) return false;
    if (typeof difficulty !== 'string' || !(DIFFICULTIES as readonly string[]).includes(difficulty)) return false;
    if (typeof situation !== 'string') return false;
    const def = situationById(situation);
    if (!def) return false;
    if (typeof step !== 'string' || !(STEPS as readonly string[]).includes(step)) return false;
    const rank = STEP_RANK[step as Step];
    if (!isStringArray(cards) || !sameMembers(cards, cardIdsFor(def, difficulty as Difficulty))) return false;
    if (!Array.isArray(placement) || placement.length !== cards.length) return false;
    if (!placement.every((p) => p === null || (typeof p === 'string' && (SLOTS as readonly string[]).includes(p)))) return false;
    if (rank >= 1 && placement.includes(null)) return false;
    if (!isStringArray(decisionOrder) || !sameMembers(decisionOrder, DECISIONS)) return false;
    if (!isStringArray(actionOrder) || !sameMembers(actionOrder, ACTIONS)) return false;
    if (decision !== null && (typeof decision !== 'string' || !(DECISIONS as readonly string[]).includes(decision))) return false;
    if (action !== null && (typeof action !== 'string' || !(ACTIONS as readonly string[]).includes(action))) return false;
    if (rank < 1 && (decision !== null || action !== null)) return false;
    if (rank >= 2 && (decision === null || action === null)) return false;
    if (typeof notes !== 'string' || notes.length > MAX_NOTES) return false;
    if (!Array.isArray(checks) || checks.length !== SELF_CHECKS || !checks.every((c) => typeof c === 'boolean')) return false;
    if (rank < 2 && (notes !== '' || checks.some(Boolean))) return false;
    return true;
  } catch {
    return false;
  }
}
