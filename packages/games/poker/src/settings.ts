import { isInt, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { DEFAULT_OPPONENTS, MAX_OPPONENTS, MIN_OPPONENTS, type PokerState } from './rules';

export const OPPONENT_CHOICES: readonly number[] = Array.from({ length: MAX_OPPONENTS - MIN_OPPONENTS + 1 }, (_, i) => MIN_OPPONENTS + i);

/** The number of opponents older versions remembered in the game (preference `opponents`), used as the default. */
export const OLD_OPPONENTS_PREFERENCE = 'opponents';

/**
 * Start-screen settings (ADR 0017): the opponents' level and how many there are. The table itself (seats, chips,
 * blinds) follows from them; nothing else is chosen before play. Until the start screen remembers its own
 * choices, the number defaults to the one older versions remembered.
 */
export function pokerSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = env?.preferences?.get(OLD_OPPONENTS_PREFERENCE);
  return [
    { kind: 'difficulty', labelKey: 'setup.level' },
    { kind: 'choice', id: 'opponents', labelKey: 'setup.opponents', valueKey: 'opponents', values: OPPONENT_CHOICES, default: isInt(old, MIN_OPPONENTS, MAX_OPPONENTS) ? old : DEFAULT_OPPONENTS }
  ];
}

/** The start-screen settings a table was started with (for saves from before the host kept them). */
export const pokerSettingsOf = (state: PokerState): Record<string, SettingValue> => ({ difficulty: state.difficulty, opponents: state.opponents });
