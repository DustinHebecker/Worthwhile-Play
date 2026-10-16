import type { NewGameOptions, SettingSpec, SettingsEnv } from '@wp/game-core';
import type { KeyboardLayout, Options } from './rules';
import { WORD_LANGUAGES, defaultLanguage, isWordLanguage } from './words';

/**
 * Start-screen settings (ADR 0017): the word language (default: the UI language when there are words for it)
 * and strict mode. The difficulty is added first by the host. The keyboard layout is a display preference and
 * stays in the game.
 */
export const settings = (env: SettingsEnv): readonly SettingSpec[] => [
  { kind: 'choice', id: 'language', labelKey: 'language.label', valueKey: 'language', values: WORD_LANGUAGES, default: defaultLanguage(env.t.locale) },
  { kind: 'toggle', id: 'strict', labelKey: 'strict.label', default: false }
];

/** Game options from untrusted start-screen settings; a missing or invalid language falls back to the UI language. */
export function optionsFrom(chosen: NewGameOptions['settings'], uiLocale: string, layout: KeyboardLayout): Options {
  const language = chosen?.language;
  return { language: isWordLanguage(language) ? language : defaultLanguage(uiLocale), strict: chosen?.strict === true, layout };
}
