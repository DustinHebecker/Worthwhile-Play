import { isOneOf, isRecord, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { DEFAULT_SETTINGS, DIFFICULTIES, MAX_OPPONENTS, ROUND_LIMITS, TARGETS, type CardQuestState, type Settings } from './rules';

/** `context.preferences` key under which versions before the start screen (ADR 0017) remembered the setup. */
export const OLD_SETUP_PREFERENCE = 'setup';

/** `context.preferences` key of the in-game coach switch (a display preference, not a start-screen setting). */
export const COACH_PREFERENCE = 'coach';

export const OPPONENT_COUNTS = Array.from({ length: MAX_OPPONENTS }, (_, i) => i + 1);

/** Reads untrusted settings (start screen or old preference), keeping each valid field and the default otherwise. */
export function readSettings(value: unknown, difficulty?: unknown): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS, worlds: [...DEFAULT_SETTINGS.worlds] };
  if (isRecord(value)) {
    if (isOneOf(value.opponents, OPPONENT_COUNTS)) s.opponents = value.opponents;
    if (isOneOf(value.target, TARGETS)) s.target = value.target;
    if (isOneOf(value.roundLimit, ROUND_LIMITS)) s.roundLimit = value.roundLimit;
    if (typeof value.coach === 'boolean') s.coach = value.coach;
  }
  if (isOneOf(difficulty, DIFFICULTIES)) s.difficulty = difficulty;
  return s;
}

/**
 * Start-screen settings (ADR 0017): how cunning the computer players are, how many there are, the target level and an
 * optional round limit (coach tips are switched in the game). Until the start screen remembers its own choices, the defaults follow the
 * setup older versions remembered in the game.
 */
export function cardQuestSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = readSettings(env?.preferences?.get(OLD_SETUP_PREFERENCE));
  return [
    { kind: 'difficulty', default: DEFAULT_SETTINGS.difficulty },
    { kind: 'choice', id: 'opponents', labelKey: 'setup.opponents', valueKey: 'setup.opponentCount', values: OPPONENT_COUNTS, default: old.opponents, display: 'radio' },
    { kind: 'choice', id: 'target', labelKey: 'setup.target', valueKey: 'setup.targetLevels', values: TARGETS, default: old.target },
    { kind: 'choice', id: 'roundLimit', labelKey: 'setup.roundLimit', valueKey: 'setup.roundLimits', values: ROUND_LIMITS, default: old.roundLimit, hintKey: 'setup.roundLimit.hint' }
  ];
}

/** The start-screen settings a game was started with. */
export function cardQuestSettingsOf(state: CardQuestState): Record<string, SettingValue> {
  const { difficulty, opponents, target, roundLimit } = state.settings;
  return { difficulty, opponents, target, roundLimit };
}
