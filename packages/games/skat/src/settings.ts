import { isOneOf, isRecord, type NewGameOptions, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { DEFAULT_DIFFICULTY, DEFAULT_OPTIONS, SCORINGS, SERIES_LENGTHS, type Options, type SkatState } from './rules';

/** The series options older versions remembered in the game (preference `options`), used as start-screen defaults. */
export const OLD_OPTIONS_PREFERENCE = 'options';

/**
 * Start-screen settings (ADR 0017): the computers' strength (preselected: the game's own default), the length of
 * the series, the scoring and the Ramsch house rule. Card faces and the computers' speed are display preferences
 * and stay in the game. Until the start screen remembers its own choices, the defaults follow the options older
 * versions remembered.
 */
export function skatSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = env?.preferences?.get(OLD_OPTIONS_PREFERENCE);
  const defaults = optionsFrom(isRecord(old) ? (old as NewGameOptions['settings']) : undefined);
  return [
    { kind: 'difficulty', labelKey: 'setup.level', default: DEFAULT_DIFFICULTY },
    { kind: 'choice', id: 'series', labelKey: 'setup.series', valueKey: 'series', values: SERIES_LENGTHS, default: defaults.series },
    { kind: 'choice', id: 'scoring', labelKey: 'setup.scoring', valueKey: 'scoring', values: SCORINGS, default: defaults.scoring },
    { kind: 'toggle', id: 'ramsch', labelKey: 'setup.ramsch', default: defaults.ramsch }
  ];
}

/** The start-screen settings a series was started with (for saves from before the host kept them). */
export const skatSettingsOf = (state: SkatState): Record<string, SettingValue> => ({ difficulty: state.difficulty, ...state.options });

/** Series options from untrusted start-screen settings (invalid or missing values fall back to the defaults). */
export function optionsFrom(chosen: NewGameOptions['settings']): Options {
  const series = Number(chosen?.series);
  const scoring = chosen?.scoring;
  return {
    series: isOneOf(series, SERIES_LENGTHS) ? series : DEFAULT_OPTIONS.series,
    scoring: isOneOf(scoring, SCORINGS) ? scoring : DEFAULT_OPTIONS.scoring,
    ramsch: typeof chosen?.ramsch === 'boolean' ? chosen.ramsch : DEFAULT_OPTIONS.ramsch
  };
}
