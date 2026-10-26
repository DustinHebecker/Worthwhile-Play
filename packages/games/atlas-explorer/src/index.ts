import { defineGame, type SettingSpec } from '@wp/game-core';
import { preloadContent } from './content';
import { atlasLoaded, atlasSync, loadAtlas } from './data';
import { metadata } from './metadata';
import { isAtlasState, settingsOf, type AtlasState } from './rules';
import { AREAS, MODES } from './state';
import { createAtlasExplorer } from './view';

export type { AtlasState } from './rules';

/** The start screen (ADR 0017, design § 15): the mode, the region and the difficulty. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: MODES, default: 'mixed', display: 'radio', hintKey: 'mode.hint' },
  { kind: 'choice', id: 'region', labelKey: 'region.label', valueKey: 'region', values: AREAS, default: 'world', display: 'select' },
  { kind: 'difficulty' }
];

export default defineGame<AtlasState>({
  metadata,
  settings,
  settingsOf,
  create: createAtlasExplorer,
  // Saves are checked against the atlas, which `preload` loads before the host reads a save.
  isValidState: (value: unknown): value is AtlasState => atlasLoaded() && isAtlasState(value, atlasSync()),
  // The atlas chunk and the locale's content load in parallel (design § 11.3, ADR 0011).
  preload: async (locale: string) => {
    await Promise.all([loadAtlas(), preloadContent(locale)]);
  }
});
