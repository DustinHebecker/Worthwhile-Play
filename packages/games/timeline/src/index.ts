import { defineGame, type SettingSpec } from '@wp/game-core';
import { preloadContent } from './content';
import { MODES, SPANS } from './generate';
import { metadata } from './metadata';
import { isTimelineState, migrateState, settingsOf, type TimelineState } from './rules';
import { createTimeline } from './view';

export type { TimelineState } from './rules';

/** The start screen (ADR 0017, design § 13.1): the mode, the time span and the difficulty. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: MODES, default: 'mixed', display: 'radio', hintKey: 'mode.hint' },
  { kind: 'choice', id: 'span', labelKey: 'span.label', valueKey: 'span', values: SPANS, default: 'all' },
  { kind: 'difficulty' }
];

export default defineGame<TimelineState>({
  metadata,
  settings,
  settingsOf,
  create: createTimeline,
  isValidState: isTimelineState,
  migrateState,
  // Titles, notes and insights of the UI locale (and the English fallback) load before a round starts (ADR 0011).
  preload: (locale: string) => preloadContent(locale)
});
