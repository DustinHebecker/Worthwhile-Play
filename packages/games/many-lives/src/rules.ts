import type { NewGameOptions, SettingSpec, SettingValue } from '@wp/game-core';
import { createRng, isRecord } from '@wp/game-core';
import {
  EVENTS_DE, PROFILE_DE, advanceUntilEvent, ageInYears, availableChoices, budget, choose, isLifeState, keyedRngFor,
  lifeSystems, newLife, qualificationOf, type BudgetItem, type Choice, type EventDef, type LifeState, type Profile
} from '@wp/life-engine';

/** The only profile of this first version (owner decision O25: Germany first, India next). */
export const PROFILE: Profile = PROFILE_DE;
export const EVENTS: readonly EventDef[] = EVENTS_DE;
const SYSTEMS = lifeSystems(PROFILE);

export const HOUSEHOLDS = ['random', ...PROFILE.households.map((h) => h.id)] as const;
export const CONTENT = ['show', 'gentle'] as const;

export const SETTINGS: readonly SettingSpec[] = [
  { kind: 'choice', id: 'household', labelKey: 'setting.household', valueKey: 'household', values: HOUSEHOLDS, default: 'random', display: 'radio' },
  { kind: 'choice', id: 'content', labelKey: 'setting.content', valueKey: 'content', values: CONTENT, default: 'show', hintKey: 'hint.content' }
];

/** Appearance given at birth (owner decision O20); hairstyle and clothes become choices later. */
export interface Appearance {
  /** 0–5: a palette of skin tones, drawn independently of the region (no stereotypes). */
  skin: number;
  /** 0–5: hair colours. */
  hair: number;
  /** 0 short, 1 long – independent of sex; becomes the player's choice later. */
  style: number;
}

export interface LogEntry {
  month: number;
  /** Message key of what happened (an event title or an outcome). */
  key: string;
}

export interface ManyLivesState {
  life: LifeState;
  appearance: Appearance;
  household: string;
  content: 'show' | 'gentle';
  /** Newest last, at most LOG_LIMIT entries. */
  log: LogEntry[];
  /** Months that passed with the last time step (for the announcement). */
  lastStep: number;
  /** The natural end has been reported to the host. */
  reported: boolean;
}

export const LOG_LIMIT = 30;
export const MAX_FAST_FORWARD_MONTHS = 12 * 120;
/** Flags whose appearance is told to the player as an outcome (`outcome.<flag>`). */
export const OUTCOME_FLAGS = ['school.recommended', 'school.not-recommended', 'study.dropped-out', 'qual.vocational', 'qual.bachelor', 'qual.master', 'died.natural'] as const;

const rngFor = (s: ManyLivesState) => keyedRngFor(s.life.seed);

function pushLog(log: LogEntry[], entries: LogEntry[]): LogEntry[] {
  return [...log, ...entries].slice(-LOG_LIMIT);
}

function outcomes(before: LifeState, after: LifeState): LogEntry[] {
  return OUTCOME_FLAGS.filter((f) => after.flags.includes(f) && !before.flags.includes(f)).map((f) => ({ month: after.month, key: `outcome.${f}` }));
}

export function settingsOf(state: ManyLivesState): Record<string, SettingValue> {
  return { household: state.household, content: state.content };
}

export function createState(options: NewGameOptions): ManyLivesState {
  const chosen = options.settings ?? {};
  const household = typeof chosen.household === 'string' && (HOUSEHOLDS as readonly string[]).includes(chosen.household) ? chosen.household : 'random';
  const content = chosen.content === 'gentle' ? 'gentle' : 'show';
  const seed = options.seed >>> 0;
  const life = newLife({
    seed, profile: PROFILE, gentle: content === 'gentle', rngFor: keyedRngFor(seed),
    ...(household === 'random' ? {} : { householdId: household })
  });
  const rng = createRng(seed ^ 0x5bd1e995);
  const appearance = { skin: rng.int(0, 5), hair: rng.int(0, 5), style: rng.int(0, 1) };
  const state: ManyLivesState = { life, appearance, household, content, log: [], lastStep: 0, reported: false };
  // The first scenes of childhood come by themselves; the life starts with the first event.
  return step(state, 'event');
}

export type StepKind = 'month' | 'year' | 'event';

/** Lets time pass: one month, up to a year, or until the next event (always stops at an event). */
export function step(state: ManyLivesState, kind: StepKind): ManyLivesState {
  if (!state.life.alive || state.life.pending.length > 0) return state;
  const max = kind === 'month' ? 1 : kind === 'year' ? 12 : MAX_FAST_FORWARD_MONTHS;
  const r = advanceUntilEvent(state.life, EVENTS, rngFor(state), max, SYSTEMS);
  const drawn = r.state.pending.map((p) => ({ month: p.month, key: `event.${p.eventId}.title` }));
  return { ...state, life: r.state, lastStep: r.months, log: pushLog(state.log, [...outcomes(state.life, r.state), ...drawn]) };
}

/** The pending event the player decides now. */
export function currentEvent(state: ManyLivesState): { def: EventDef; choices: Choice[] } | undefined {
  const head = state.life.pending[0];
  if (head === undefined) return undefined;
  const def = EVENTS.find((d) => d.id === head.eventId);
  return def === undefined ? undefined : { def, choices: availableChoices(EVENTS, state.life, def.id) };
}

/** Decides the pending event. Unknown or unavailable choices leave the state unchanged. */
export function decide(state: ManyLivesState, choiceId: string): ManyLivesState {
  const head = state.life.pending[0];
  if (head === undefined) return state;
  const r = choose(EVENTS, state.life, head.eventId, choiceId, rngFor(state)(state.life.month, `choice:${head.eventId}`));
  if (!r.ok) return state;
  return { ...state, life: r.state, lastStep: 0, log: pushLog(state.log, outcomes(state.life, r.state)) };
}

export function budgetOf(state: ManyLivesState): BudgetItem[] {
  return budget(state.life, PROFILE);
}

export const ageOf = (state: ManyLivesState): number => ageInYears(state.life.month);
export const qualification = (state: ManyLivesState): string => qualificationOf(state.life);
export const isOver = (state: ManyLivesState): boolean => !state.life.alive;

export function isManyLivesState(value: unknown): value is ManyLivesState {
  try {
    if (!isRecord(value)) return false;
    const s = value;
    if (!isLifeState(s.life) || s.life.profileId !== PROFILE.id) return false;
    if (!isRecord(s.appearance) || !isDigit(s.appearance.skin) || !isDigit(s.appearance.hair) || (s.appearance.style !== 0 && s.appearance.style !== 1)) return false;
    if (typeof s.household !== 'string' || !(HOUSEHOLDS as readonly string[]).includes(s.household)) return false;
    if (s.content !== 'show' && s.content !== 'gentle') return false;
    if (!Array.isArray(s.log) || s.log.length > LOG_LIMIT) return false;
    if (!s.log.every((e) => isRecord(e) && Number.isInteger(e.month) && typeof e.key === 'string' && e.key.length < 120)) return false;
    if (!Number.isInteger(s.lastStep) || (s.lastStep as number) < 0 || typeof s.reported !== 'boolean') return false;
    for (const p of s.life.pending) if (!EVENTS.some((d) => d.id === p.eventId)) return false;
    return true;
  } catch {
    return false;
  }
}

const isDigit = (v: unknown): boolean => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 5;
