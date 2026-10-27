import { defineGame, type SettingSpec } from '@wp/game-core';
import { preloadContent } from './content';
import { GOAL_IDS } from './goals';
import { HABITATS } from './habitats';
import { metadata } from './metadata';
import { MODES, STARTS, isEcoState, settingsOf, type EcoState } from './rules';
import { createEcosystem } from './view';

export type { EcoState } from './rules';

/** The start screen (ADR 0017, design § 6): mode; the goal (goals); habitat, start and weather (explore); difficulty. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: MODES, default: 'predict', display: 'radio', hintKey: 'mode.hint' },
  { kind: 'choice', id: 'goal', labelKey: 'goal.label', valueKey: 'goal', values: GOAL_IDS, default: 'save-pondweed', display: 'radio', when: { mode: ['goal'] } },
  { kind: 'choice', id: 'habitat', labelKey: 'habitat.label', valueKey: 'habitat', values: HABITATS, default: 'pond', display: 'radio', when: { mode: ['explore'] } },
  { kind: 'choice', id: 'start', labelKey: 'start.label', valueKey: 'start', values: STARTS, default: 'lively', display: 'radio', hintKey: 'start.hint', when: { mode: ['explore'] } },
  { kind: 'toggle', id: 'weather', labelKey: 'weather.label', default: false, hintKey: 'weather.hint', when: { mode: ['explore'] } },
  { kind: 'difficulty', default: 'medium', when: { mode: ['predict', 'goal'] } }
];

export default defineGame<EcoState>({
  metadata,
  settings,
  settingsOf,
  create: createEcosystem,
  isValidState: isEcoState,
  // Species, challenge and goal wording of the UI locale (and the English fallback) load before a game starts (ADR 0011).
  preload: (locale: string) => preloadContent(locale)
});
