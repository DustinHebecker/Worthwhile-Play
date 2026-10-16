import { normalizeSeed, type NewGameOptions, type SettingSpec } from '@wp/game-core';
import { INTRO_MAP, MAPS_PER_SET } from './maps';
import { OPPONENT_COUNTS, mapForSeed, toDifficulty, toOpponents, type GameOptions } from './rules';

/** Map choices: "any" (picked by the game number), the introduction, or a numbered map (1-based). */
export const MAP_CHOICES: readonly string[] = ['random', 'intro', ...Array.from({ length: MAPS_PER_SET }, (_, i) => String(i + 1))];
const MATCH_MAPS = MAP_CHOICES.filter((choice) => choice !== 'intro');

/**
 * Start-screen settings (ADR 0017): the map and, except for the introduction (always one opponent), the number of
 * opponents. The host puts the difficulty (opponent intelligence) first. The speed stays in the game (pacing).
 */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'map', labelKey: 'map.label', valueKey: 'map', values: MAP_CHOICES, default: 'random' },
  { kind: 'choice', id: 'opponents', labelKey: 'opponents.label', valueKey: 'opponents', values: OPPONENT_COUNTS, default: 1, when: { map: MATCH_MAPS } }
];

/** Seed and game options from untrusted start options (invalid or missing values fall back to the defaults). */
export function matchOptions(options: Pick<NewGameOptions, 'seed' | 'difficulty' | 'settings'>): { seed: number; options: GameOptions } {
  const seed = normalizeSeed(options.seed);
  const chosen = options.settings ?? {};
  const choice = typeof chosen.map === 'string' || typeof chosen.map === 'number' ? String(chosen.map) : 'random';
  const numbered = Number(choice);
  const map = choice === 'intro' ? INTRO_MAP : Number.isInteger(numbered) && numbered >= 1 && numbered <= MAPS_PER_SET ? numbered - 1 : mapForSeed(seed);
  const count = Number(chosen.opponents);
  return { seed, options: { difficulty: toDifficulty(options.difficulty), map, opponents: toOpponents(count) } };
}
