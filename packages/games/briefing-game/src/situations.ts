/**
 * Language-independent situation data for Briefing Game (ADR 0010): card ids, gold sections,
 * the kind of reason shown after checking, and the difficulty level at which a card appears.
 * All wording lives in `content/<locale>.ts`, keyed by these ids, so a save stays valid when the
 * UI language changes.
 */

/** The six sections of an actionable briefing, in briefing order. */
export const SECTIONS = ['context', 'facts', 'uncertainty', 'risks', 'decision', 'next'] as const;
export type SectionId = (typeof SECTIONS)[number];

/** Where a card can be sorted: one of the six sections, or left out of the briefing. */
export const SLOTS = [...SECTIONS, 'leave'] as const;
export type Slot = (typeof SLOTS)[number];

/**
 * Why a card belongs where it belongs. Each kind has one short, translated explanation
 * (`reason.<kind>`), so feedback stays consistent across situations and locales.
 */
export const REASON_KINDS = [
  'background',
  'confirmed',
  'unknown',
  'hedged',
  'risk',
  'hiddenRisk',
  'riskOrUncertain',
  'deadline',
  'options',
  'step',
  'opinion',
  'irrelevant',
  'duplicate'
] as const;
export type ReasonKind = (typeof REASON_KINDS)[number];

/** 1 = every level, 2 = medium and hard, 3 = hard only (subtle wording or extra noise). */
export type Level = 1 | 2 | 3;

export interface CardDef {
  readonly id: string;
  /** Accepted slots; the first one is where the model briefing puts the card. */
  readonly gold: readonly Slot[];
  readonly kind: ReasonKind;
  readonly level: Level;
}

/** Step 2 options. Exactly one decision (`right`) and one next action (`concrete`) are correct. */
export const DECISIONS = ['right', 'notTheirs', 'premature'] as const;
export type DecisionId = (typeof DECISIONS)[number];
export const ACTIONS = ['concrete', 'vague', 'outOfScope'] as const;
export type ActionId = (typeof ACTIONS)[number];
export const RIGHT_DECISION: DecisionId = 'right';
export const RIGHT_ACTION: ActionId = 'concrete';

export interface SituationDef {
  readonly id: string;
  readonly cards: readonly CardDef[];
}

/** `gold` is written as `'risks'` or `'risks+uncertainty'` (primary slot first). */
function situation(id: string, cards: readonly (readonly [id: string, gold: string, kind: ReasonKind, level: Level])[]): SituationDef {
  return {
    id,
    cards: cards.map(([cardId, gold, kind, level]) => ({ id: cardId, gold: gold.split('+') as Slot[], kind, level }))
  };
}

/**
 * Every situation uses the same twelve card ids. Easy shows the seven level-1 cards (one per section plus
 * one clearly irrelevant card), medium adds a second fact and a duplicate, hard adds a hedged uncertainty
 * that reads like a fact, a risk hidden in a factual sentence and an opinion.
 */
export const SITUATIONS: readonly SituationDef[] = [
  situation('supplierDelay', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'facts', 'confirmed', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks', 'risk', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'deadline', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ]),
  situation('basement', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'facts', 'confirmed', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks+uncertainty', 'riskOrUncertain', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'deadline', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ]),
  situation('schoolTrip', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'decision+facts', 'options', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks', 'risk', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'deadline', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ]),
  situation('volunteers', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'facts', 'confirmed', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks', 'risk', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'options', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ]),
  situation('release', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'facts', 'confirmed', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks', 'risk', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'options', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ]),
  situation('careAppointment', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'facts', 'confirmed', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks', 'risk', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'deadline', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ]),
  situation('cafeFreezer', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'facts', 'confirmed', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks', 'risk', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'deadline', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ]),
  situation('tournament', [
    ['c1', 'context', 'background', 1],
    ['c2', 'facts', 'confirmed', 1],
    ['c3', 'facts+decision', 'options', 2],
    ['c4', 'uncertainty', 'unknown', 1],
    ['c5', 'uncertainty', 'hedged', 3],
    ['c6', 'risks', 'risk', 1],
    ['c7', 'risks', 'hiddenRisk', 3],
    ['c8', 'decision', 'deadline', 1],
    ['c9', 'next', 'step', 1],
    ['c10', 'leave', 'irrelevant', 1],
    ['c11', 'leave', 'duplicate', 2],
    ['c12', 'leave', 'opinion', 3]
  ])
];

export function situationById(id: string): SituationDef | undefined {
  return SITUATIONS.find((s) => s.id === id);
}
