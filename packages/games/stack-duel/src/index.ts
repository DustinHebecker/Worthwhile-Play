import { defineGame, isOneOf, type SettingSpec, type SettingsEnv } from '@wp/game-core';
import { metadata } from './metadata';
import { DEFAULT_MODE, MODES, isValidState, type StackDuelState } from './rules';
import { createStackDuel } from './view';

export type { StackDuelState } from './rules';

/** The mode older versions remembered in the game (preference `mode`), used as the start screen's default. */
export const OLD_MODE_PREFERENCE = 'mode';

/**
 * Start-screen settings (ADR 0017): the mode, then the difficulty (piece mix; tower goal in solo). Until the start
 * screen remembers its own choices, the mode defaults to the one older versions remembered.
 */
export function stackDuelSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = env?.preferences?.get(OLD_MODE_PREFERENCE);
  return [{ kind: 'choice', id: 'mode', labelKey: 'mode', valueKey: 'mode', values: MODES, default: isOneOf(old, MODES) ? old : DEFAULT_MODE }, { kind: 'difficulty' }];
}

export default defineGame<StackDuelState>({
  metadata,
  settings: (env) => stackDuelSettings(env),
  settingsOf: (state) => ({ mode: state.mode, difficulty: state.difficulty }),
  create: createStackDuel,
  isValidState
});
