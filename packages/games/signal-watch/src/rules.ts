import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

/**
 * Signal Watch: a calm stream of symbols, one at a time; respond only to the target.
 *
 * The whole stream (symbols and the jittered interval of each stimulus) is derived from
 * the seed, so the logical state only stores the seed, the current stimulus index and the
 * responses given so far. Timers in the view merely drive the presentation.
 */

export const DIFFICULTIES = ['short', 'medium', 'long'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'short';

/** Explicit session lengths (shown before the start): minutes and number of stimuli. */
export const SESSIONS: Readonly<Record<Difficulty, { readonly minutes: number; readonly count: number }>> = {
  short: { minutes: 2, count: 80 },
  medium: { minutes: 4, count: 160 },
  long: { minutes: 6, count: 240 }
};

export const MIN_INTERVAL_MS = 1200;
export const MAX_INTERVAL_MS = 1800;
export const INTERVAL_STEP_MS = 50;
/** One target in eight stimuli (12.5 %), exactly. */
export const TARGET_RATE = 0.125;
/** The first stimuli are never targets, so the player can settle in. */
export const LEAD_IN = 2;
/** Minimum distance between two targets (two non-targets at least between them). */
export const MIN_TARGET_GAP = 3;
/** Share of non-target stimuli drawn from the similar-looking distractors (medium/long). */
export const LOOKALIKE_RATE = 0.25;

export const SYMBOLS = ['up', 'down', 'hollowUp', 'circle', 'square', 'diamond', 'star'] as const;
export type SymbolId = (typeof SYMBOLS)[number];
export const TARGET: SymbolId = 'up';
export const NEUTRAL: readonly SymbolId[] = ['circle', 'square', 'diamond', 'star'];
export const LOOKALIKES: Readonly<Record<Difficulty, readonly SymbolId[]>> = {
  short: [],
  medium: ['down'],
  long: ['down', 'hollowUp']
};
/** Text-presentation glyphs (shape carries the meaning, never colour). */
export const GLYPHS: Readonly<Record<SymbolId, string>> = {
  up: '▲',
  down: '▼',
  hollowUp: '△',
  circle: '●',
  square: '■',
  diamond: '◆',
  star: '★'
};

export interface Stimulus {
  readonly symbol: SymbolId;
  readonly target: boolean;
  /** Time from this stimulus' onset to the next one (the response window). */
  readonly intervalMs: number;
}

export const PHASES = ['ready', 'running', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface SignalResponse {
  /** Stimulus index the response belongs to. */
  index: number;
  /** Reaction time from the stimulus onset, in whole milliseconds. */
  rtMs: number;
}

export interface SignalState {
  seed: number;
  difficulty: Difficulty;
  phase: Phase;
  /** Current stimulus while running; 0 when ready; the stimulus count when finished. */
  index: number;
  /** At most one response per stimulus, in increasing index order. */
  responses: SignalResponse[];
}

export interface SignalScore {
  targets: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  /** Mean reaction time on hits (rounded), `null` when there was no hit. */
  meanRtMs: number | null;
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const stimulusCount = (difficulty: Difficulty): number => SESSIONS[difficulty].count;

export const targetCount = (count: number): number => Math.round(count * TARGET_RATE);

/** Deterministically generates the complete stimulus stream for a seed and difficulty. */
export function generateSequence(seed: number, difficulty: Difficulty): Stimulus[] {
  const rng = createRng(seed);
  const count = stimulusCount(difficulty);
  const wanted = targetCount(count);

  // Target positions: greedy over a shuffled candidate list, keeping the minimum gap.
  const candidates = rng.shuffle(Array.from({ length: count - LEAD_IN }, (_, i) => i + LEAD_IN));
  const targets = new Set<number>();
  for (const position of candidates) {
    if (targets.size === wanted) break;
    let free = true;
    for (let d = 1; d < MIN_TARGET_GAP; d++) if (targets.has(position - d) || targets.has(position + d)) free = false;
    if (free) targets.add(position);
  }

  const lookalikes = LOOKALIKES[difficulty];
  const steps = (MAX_INTERVAL_MS - MIN_INTERVAL_MS) / INTERVAL_STEP_MS;
  const sequence: Stimulus[] = [];
  let previous: SymbolId | undefined;
  for (let i = 0; i < count; i++) {
    const intervalMs = MIN_INTERVAL_MS + rng.int(0, steps) * INTERVAL_STEP_MS;
    let symbol: SymbolId;
    if (targets.has(i)) symbol = TARGET;
    else {
      const similar = lookalikes.filter((s) => s !== previous);
      const useSimilar = rng.next() < LOOKALIKE_RATE && similar.length > 0;
      symbol = rng.pick(useSimilar ? similar : NEUTRAL.filter((s) => s !== previous));
    }
    sequence.push({ symbol, target: symbol === TARGET, intervalMs });
    previous = symbol;
  }
  return sequence;
}

export function newSession(seed: number, difficulty: Difficulty): SignalState {
  return { seed: seed >>> 0, difficulty, phase: 'ready', index: 0, responses: [] };
}

/** Starts the session at the first stimulus. */
export function startSession(state: SignalState): SignalState {
  if (state.phase !== 'ready') return state;
  return { ...state, phase: 'running', index: 0 };
}

export const responseFor = (state: SignalState, index: number): SignalResponse | undefined => state.responses.find((r) => r.index === index);

/**
 * Records a response to the current stimulus. Ignored (same state returned) unless the
 * session is running and the current stimulus has no response yet. The reaction time is
 * clamped to the stimulus' response window.
 */
export function respond(state: SignalState, sequence: readonly Stimulus[], rtMs: number): SignalState {
  if (state.phase !== 'running' || responseFor(state, state.index)) return state;
  const window = sequence[state.index]?.intervalMs ?? MAX_INTERVAL_MS;
  const rt = Number.isFinite(rtMs) ? Math.min(window, Math.max(0, Math.round(rtMs))) : 0;
  return { ...state, responses: [...state.responses, { index: state.index, rtMs: rt }] };
}

/** Closes the current stimulus and moves to the next one (or finishes the session). */
export function advance(state: SignalState, sequence: readonly Stimulus[]): SignalState {
  if (state.phase !== 'running') return state;
  const index = state.index + 1;
  return { ...state, index, phase: index >= sequence.length ? 'finished' : 'running' };
}

/** Number of stimuli whose response window has closed. */
export const closedCount = (state: SignalState): number => state.index;

/** Factual summary of a (partial or complete) session. */
export function score(state: SignalState, sequence: readonly Stimulus[]): SignalScore {
  const closed = closedCount(state);
  let targets = 0;
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let rtSum = 0;
  const responded = new Map(state.responses.map((r) => [r.index, r.rtMs]));
  sequence.forEach((stimulus, i) => {
    const rt = responded.get(i);
    if (stimulus.target) {
      if (i < closed) targets++;
      if (rt !== undefined) {
        hits++;
        rtSum += rt;
      } else if (i < closed) misses++;
    } else if (rt !== undefined) falseAlarms++;
  });
  return { targets, hits, misses, falseAlarms, meanRtMs: hits > 0 ? Math.round(rtSum / hits) : null };
}

const isResponse = (value: unknown): value is SignalResponse =>
  isRecord(value) && isInt(value.index, 0) && isInt(value.rtMs, 0, MAX_INTERVAL_MS);

/** Structural validation of untrusted persisted data. Never throws. */
export function isValidSignalState(value: unknown): value is SignalState {
  if (!isRecord(value)) return false;
  if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || !isOneOf(value.phase, PHASES)) return false;
  const count = stimulusCount(value.difficulty);
  if (!isInt(value.index, 0, count) || !isArrayOf(value.responses, isResponse)) return false;
  const { index, phase, responses } = value;
  if (phase === 'ready' && (index !== 0 || responses.length > 0)) return false;
  if (phase === 'running' && index >= count) return false;
  if (phase === 'finished' && index !== count) return false;
  let last = -1;
  for (const response of responses) {
    if (response.index <= last || response.index >= count || response.index > index) return false;
    last = response.index;
  }
  return true;
}
