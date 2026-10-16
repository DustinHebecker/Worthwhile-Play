import { defineGame, isRecord, type SettingSpec, type SettingsEnv } from '@wp/game-core';
import { metadata } from './metadata';
import { DEFAULT_PACE, DEFAULT_VARIANT, isValidNBackState, PACES, toPace, toVariant, VARIANTS, type NBackState } from './rules';
import { createNBack, PREFERENCES_KEY } from './view';

export type { NBackState } from './rules';

/**
 * Start-screen settings (ADR 0017): what to compare and the pace, after the host's difficulty (N).
 * The defaults follow what older versions remembered in the game's own preferences.
 */
export function nBackSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = env?.preferences?.get(PREFERENCES_KEY);
  const remembered = isRecord(old) ? old : {};
  return [
    { kind: 'choice', id: 'variant', labelKey: 'variant.label', values: VARIANTS, valueKey: 'variant', default: remembered.variant === undefined ? DEFAULT_VARIANT : toVariant(remembered.variant) },
    { kind: 'choice', id: 'pace', labelKey: 'pace.label', values: PACES, valueKey: 'pace', default: remembered.pace === undefined ? DEFAULT_PACE : toPace(remembered.pace) }
  ];
}

export default defineGame<NBackState>({
  metadata,
  create: createNBack,
  isValidState: isValidNBackState,
  settings: (env) => nBackSettings(env),
  // For saves from before the host kept the settings (ADR 0017).
  settingsOf: (state) => ({ difficulty: state.difficulty, variant: state.variant, pace: state.pace })
});
