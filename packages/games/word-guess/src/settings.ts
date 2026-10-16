import { isRecord, type NewGameOptions, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import type { KeyboardLayout, Options, WordGuessState } from './rules';
import { WORD_LANGUAGES, defaultLanguage, isWordLanguage } from './words';

/** The game's own preferences (`options`); older versions also kept the word language and strict mode there. */
export const OPTIONS_PREFERENCE = 'options';

/**
 * Start-screen settings (ADR 0017): the word language (default: the UI language when there are words for it)
 * and strict mode. The difficulty is added first by the host. The keyboard layout is a display preference and
 * stays in the game. Until the start screen remembers its own choices, the defaults follow what older versions
 * remembered.
 */
export function settings(env: SettingsEnv): readonly SettingSpec[] {
  const stored = env.preferences?.get(OPTIONS_PREFERENCE);
  const old = isRecord(stored) ? stored : {};
  return [
    { kind: 'choice', id: 'language', labelKey: 'language.label', valueKey: 'language', values: WORD_LANGUAGES, default: isWordLanguage(old.language) ? old.language : defaultLanguage(env.t.locale) },
    { kind: 'toggle', id: 'strict', labelKey: 'strict.label', default: old.strict === true }
  ];
}

/** The start-screen settings a game was started with (for saves from before the host kept them). */
export const wordGuessSettingsOf = (state: WordGuessState): Record<string, SettingValue> => ({ difficulty: state.difficulty, language: state.language, strict: state.strict });

/** Game options from untrusted start-screen settings; a missing or invalid language falls back to the UI language. */
export function optionsFrom(chosen: NewGameOptions['settings'], uiLocale: string, layout: KeyboardLayout): Options {
  const language = chosen?.language;
  return { language: isWordLanguage(language) ? language : defaultLanguage(uiLocale), strict: chosen?.strict === true, layout };
}
