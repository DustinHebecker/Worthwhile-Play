import { defineGame, type SettingSpec } from '@wp/game-core';
import { preloadContent } from './content';
import { QUIZ_TOPICS, SENSES, SENSE_TOPICS, TOPICS } from './levels';
import { metadata } from './metadata';
import { isHarmonyState, settingsOf, type HarmonyState } from './rules';
import { createHarmony } from './view';

export type { HarmonyState } from './rules';

/** The start screen (ADR 0017, design § 6): the topic, how the questions come, and the difficulty. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'topic', labelKey: 'topic.label', valueKey: 'topic', values: TOPICS, default: 'intervals', display: 'radio', hintKey: 'topic.hint' },
  { kind: 'choice', id: 'senses', labelKey: 'senses.label', valueKey: 'senses', values: SENSES, default: 'ear', display: 'radio', hintKey: 'senses.hint', when: { topic: SENSE_TOPICS } },
  { kind: 'difficulty', default: 'easy', when: { topic: QUIZ_TOPICS } }
];

export default defineGame<HarmonyState>({
  metadata,
  settings,
  settingsOf,
  create: createHarmony,
  isValidState: isHarmonyState,
  preload: preloadContent
});
