import { isOneOf, type NewGameOptions, type SettingSpec } from '@wp/game-core';
import { DEFAULT_OPTIONS, SCORINGS, SERIES_LENGTHS, type Options } from './rules';

/**
 * Start-screen settings (ADR 0017): the computers' strength, the length of the series, the scoring and the
 * Ramsch house rule. Card faces and the computers' speed are display preferences and stay in the game.
 */
export const settings: readonly SettingSpec[] = [
  { kind: 'difficulty', labelKey: 'setup.level' },
  { kind: 'choice', id: 'series', labelKey: 'setup.series', valueKey: 'series', values: SERIES_LENGTHS, default: DEFAULT_OPTIONS.series },
  { kind: 'choice', id: 'scoring', labelKey: 'setup.scoring', valueKey: 'scoring', values: SCORINGS, default: DEFAULT_OPTIONS.scoring },
  { kind: 'toggle', id: 'ramsch', labelKey: 'setup.ramsch', default: DEFAULT_OPTIONS.ramsch }
];

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
