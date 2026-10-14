import { createRng, isInt, isRecord, isUint32 } from '@wp/game-core';
import { SCENARIOS, scenarioById, type AudienceId, type MessageId, type ScenarioDef, type Tag } from './scenarios';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Steps of one audience round:
 * `select` tick facts → `lead` pick the opening fact → `message` (selection checked) pick a message →
 * `reflect` (message checked) optional own version → `done`.
 */
export const STEPS = ['select', 'lead', 'message', 'reflect', 'done'] as const;
export type Step = (typeof STEPS)[number];

/** Self-check items for the own version (ADR 0010: recorded, never scored). */
export const SELF_CHECKS = 3;
export const MAX_DRAFT = 2000;

export interface RoundState {
  step: Step;
  /** Ticked fact ids, in the order they were ticked. */
  selected: string[];
  /** Fact chosen to come first (one of `selected`). */
  lead: string | null;
  /** Display order of the three messages (seeded). */
  order: MessageId[];
  chosen: MessageId | null;
  /** Own version, never graded. */
  draft: string;
  checks: boolean[];
}

export interface AudienceSwitchState {
  version: 1;
  seed: number;
  difficulty: Difficulty;
  scenario: string;
  audiences: AudienceId[];
  /** Fact ids shown in this game, in display order. */
  facts: string[];
  /** Index of the current round; equals `audiences.length` when the game is finished. */
  round: number;
  rounds: RoundState[];
}

export type Verdict = 'hit' | 'miss' | 'extra' | 'skipped' | 'optional';

export interface RoundScore {
  /** Number of `must` facts shown. */
  needed: number;
  hits: number;
  misses: number;
  /** `leave` facts that were ticked. */
  extras: number;
  leadCorrect: boolean;
  messageCorrect: boolean;
}

export const toDifficulty = (value: unknown): Difficulty => ((DIFFICULTIES as readonly unknown[]).includes(value) ? (value as Difficulty) : 'easy');

/** Easy: the two far-apart audiences. Medium and hard: all three (two of them close). */
export function audiencesFor(def: ScenarioDef, difficulty: Difficulty): AudienceId[] {
  return difficulty === 'easy' ? def.audiences.filter((a) => def.far.includes(a)) : [...def.audiences];
}

/** Easy and medium leave out the subtle cards; hard shows all of them. */
export function factIdsFor(def: ScenarioDef, difficulty: Difficulty): string[] {
  return def.facts.filter((f) => difficulty === 'hard' || !f.subtle).map((f) => f.id);
}

export function messageIdsFor(def: ScenarioDef, audience: AudienceId): MessageId[] {
  const flaws = def.flaws[audience];
  return flaws ? ['fit', ...flaws] : ['fit'];
}

export function tagOf(def: ScenarioDef, factId: string, audience: AudienceId): Tag {
  return def.facts.find((f) => f.id === factId)?.tags[audience] ?? 'optional';
}

const emptyRound = (order: MessageId[]): RoundState => ({
  step: 'select',
  selected: [],
  lead: null,
  order,
  chosen: null,
  draft: '',
  checks: Array<boolean>(SELF_CHECKS).fill(false)
});

export function createInitialState(seed: number, difficulty: Difficulty = 'easy'): AudienceSwitchState {
  const normalized = seed >>> 0;
  const rng = createRng(normalized);
  const def = rng.pick(SCENARIOS);
  const audiences = audiencesFor(def, difficulty);
  const facts = rng.shuffle(factIdsFor(def, difficulty));
  const rounds = audiences.map((a) => emptyRound(rng.shuffle(messageIdsFor(def, a))));
  return { version: 1, seed: normalized, difficulty, scenario: def.id, audiences, facts, round: 0, rounds };
}

export function scenarioOf(state: AudienceSwitchState): ScenarioDef {
  return scenarioById(state.scenario) as ScenarioDef;
}

export const isFinished = (state: AudienceSwitchState): boolean => state.round >= state.audiences.length;

export function currentRound(state: AudienceSwitchState): RoundState | undefined {
  return state.rounds[state.round];
}

/** Replaces the current round, or returns `state` unchanged when `update` returns undefined. */
function withRound(state: AudienceSwitchState, update: (round: RoundState) => RoundState | undefined): AudienceSwitchState {
  const round = currentRound(state);
  if (!round) return state;
  const next = update(round);
  if (!next) return state;
  const rounds = state.rounds.slice();
  rounds[state.round] = next;
  return { ...state, rounds };
}

export function toggleFact(state: AudienceSwitchState, factId: string): AudienceSwitchState {
  if (!state.facts.includes(factId)) return state;
  return withRound(state, (r) => {
    if (r.step !== 'select') return undefined;
    const has = r.selected.includes(factId);
    const selected = has ? r.selected.filter((id) => id !== factId) : [...r.selected, factId];
    return { ...r, selected, lead: has && r.lead === factId ? null : r.lead };
  });
}

export function goToLead(state: AudienceSwitchState): AudienceSwitchState {
  return withRound(state, (r) => (r.step === 'select' && r.selected.length > 0 ? { ...r, step: 'lead' } : undefined));
}

export function backToSelect(state: AudienceSwitchState): AudienceSwitchState {
  return withRound(state, (r) => (r.step === 'lead' ? { ...r, step: 'select' } : undefined));
}

export function chooseLead(state: AudienceSwitchState, factId: string): AudienceSwitchState {
  return withRound(state, (r) => (r.step === 'lead' && r.selected.includes(factId) && r.lead !== factId ? { ...r, lead: factId } : undefined));
}

/** Locks selection and opening; their feedback is shown from now on. */
export function checkSelection(state: AudienceSwitchState): AudienceSwitchState {
  return withRound(state, (r) => (r.step === 'lead' && r.lead !== null ? { ...r, step: 'message' } : undefined));
}

export function chooseMessage(state: AudienceSwitchState, id: MessageId): AudienceSwitchState {
  return withRound(state, (r) => (r.step === 'message' && r.order.includes(id) && r.chosen !== id ? { ...r, chosen: id } : undefined));
}

export function checkMessage(state: AudienceSwitchState): AudienceSwitchState {
  return withRound(state, (r) => (r.step === 'message' && r.chosen !== null ? { ...r, step: 'reflect' } : undefined));
}

export function setDraft(state: AudienceSwitchState, text: string): AudienceSwitchState {
  const draft = text.slice(0, MAX_DRAFT);
  return withRound(state, (r) => (r.step === 'reflect' && r.draft !== draft ? { ...r, draft } : undefined));
}

export function toggleCheck(state: AudienceSwitchState, index: number): AudienceSwitchState {
  return withRound(state, (r) => {
    if (r.step !== 'reflect' || !isInt(index, 0, SELF_CHECKS - 1)) return undefined;
    const checks = r.checks.slice();
    checks[index] = !checks[index];
    return { ...r, checks };
  });
}

/** Closes the current round and moves on (after the last round the game is finished). */
export function nextRound(state: AudienceSwitchState): AudienceSwitchState {
  const round = currentRound(state);
  if (round?.step !== 'reflect') return state;
  const next = withRound(state, (r) => ({ ...r, step: 'done' }));
  return { ...next, round: state.round + 1 };
}

export function verdictOf(tag: Tag, selected: boolean): Verdict {
  if (tag === 'must') return selected ? 'hit' : 'miss';
  if (tag === 'leave') return selected ? 'extra' : 'skipped';
  return 'optional';
}

export function scoreRound(state: AudienceSwitchState, index: number): RoundScore {
  const def = scenarioOf(state);
  const audience = state.audiences[index] as AudienceId;
  const round = state.rounds[index] as RoundState;
  let needed = 0;
  let hits = 0;
  let extras = 0;
  for (const factId of state.facts) {
    const tag = tagOf(def, factId, audience);
    const ticked = round.selected.includes(factId);
    if (tag === 'must') {
      needed++;
      if (ticked) hits++;
    } else if (tag === 'leave' && ticked) extras++;
  }
  return {
    needed,
    hits,
    misses: needed - hits,
    extras,
    leadCorrect: round.lead !== null && round.lead === def.lead[audience],
    messageCorrect: round.chosen === 'fit'
  };
}

export interface GameSummary {
  needed: number;
  hits: number;
  extras: number;
  leads: number;
  messages: number;
}

export function summarize(state: AudienceSwitchState): GameSummary {
  const total: GameSummary = { needed: 0, hits: 0, extras: 0, leads: 0, messages: 0 };
  state.rounds.forEach((round, i) => {
    if (round.step !== 'reflect' && round.step !== 'done') return;
    const s = scoreRound(state, i);
    total.needed += s.needed;
    total.hits += s.hits;
    total.extras += s.extras;
    if (s.leadCorrect) total.leads++;
    if (s.messageCorrect) total.messages++;
  });
  return total;
}

// --- Validation ---------------------------------------------------------------------------------

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((v) => typeof v === 'string');
const sameMembers = (a: readonly string[], b: readonly string[]) => a.length === b.length && new Set(a).size === a.length && b.every((x) => a.includes(x));
const STEP_RANK: Readonly<Record<Step, number>> = { select: 0, lead: 1, message: 2, reflect: 3, done: 4 };

function isValidRound(value: unknown, facts: readonly string[], messages: readonly string[], position: 'past' | 'current' | 'future'): boolean {
  if (!isRecord(value)) return false;
  const { step, selected, lead, order, chosen, draft, checks } = value;
  if (typeof step !== 'string' || !(STEPS as readonly string[]).includes(step)) return false;
  const rank = STEP_RANK[step as Step];
  if (position === 'past' ? step !== 'done' : position === 'future' ? step !== 'select' : step === 'done') return false;
  if (!isStringArray(selected) || new Set(selected).size !== selected.length || !selected.every((id) => facts.includes(id))) return false;
  if (rank >= 1 && selected.length === 0) return false;
  if (lead !== null && (typeof lead !== 'string' || !selected.includes(lead))) return false;
  if (rank >= 2 && lead === null) return false;
  if (!isStringArray(order) || !sameMembers(order, messages)) return false;
  if (chosen !== null && (typeof chosen !== 'string' || !order.includes(chosen))) return false;
  if (rank < 2 && chosen !== null) return false;
  if (rank >= 3 && chosen === null) return false;
  if (typeof draft !== 'string' || draft.length > MAX_DRAFT) return false;
  if (!Array.isArray(checks) || checks.length !== SELF_CHECKS || !checks.every((c) => typeof c === 'boolean')) return false;
  if (rank < 3 && (draft !== '' || checks.some(Boolean))) return false;
  if (position === 'future' && (selected.length > 0 || lead !== null)) return false;
  return true;
}

/** Thorough structural validation of untrusted saves. Never throws. */
export function isAudienceSwitchState(value: unknown): value is AudienceSwitchState {
  try {
    if (!isRecord(value)) return false;
    const { version, seed, difficulty, scenario, audiences, facts, round, rounds } = value;
    if (version !== 1 || !isUint32(seed)) return false;
    if (typeof difficulty !== 'string' || !(DIFFICULTIES as readonly string[]).includes(difficulty)) return false;
    if (typeof scenario !== 'string') return false;
    const def = scenarioById(scenario);
    if (!def) return false;
    const expectedAudiences = audiencesFor(def, difficulty as Difficulty);
    if (!isStringArray(audiences) || audiences.length !== expectedAudiences.length || audiences.some((a, i) => a !== expectedAudiences[i])) return false;
    if (!isStringArray(facts) || !sameMembers(facts, factIdsFor(def, difficulty as Difficulty))) return false;
    if (!isInt(round, 0, audiences.length)) return false;
    if (!Array.isArray(rounds) || rounds.length !== audiences.length) return false;
    return rounds.every((r, i) =>
      isValidRound(r, facts, messageIdsFor(def, audiences[i] as AudienceId), i < round ? 'past' : i === round ? 'current' : 'future')
    );
  } catch {
    return false;
  }
}
