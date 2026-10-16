import { isOneOf, isRecord, normalizeSeed, type NewGameOptions, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { INTRO_MAP, MAPS_PER_SET } from './maps';
import { OPPONENT_COUNTS, mapForSeed, toDifficulty, toOpponents, type GameOptions, type NcState } from './rules';

/** Map choices: "any" (picked by the game number), the introduction, or a numbered map (1-based). */
export const MAP_CHOICES: readonly string[] = ['random', 'intro', ...Array.from({ length: MAPS_PER_SET }, (_, i) => String(i + 1))];
const MATCH_MAPS = MAP_CHOICES.filter((choice) => choice !== 'intro');

/** The opponent count older versions remembered in the game (preference `setup`), used as the start screen's default. */
export const OLD_SETUP_PREFERENCE = 'setup';

/**
 * Start-screen settings (ADR 0017): the map and, except for the introduction (always one opponent), the number of
 * opponents. The host puts the difficulty (opponent intelligence) first. The speed stays in the game (pacing).
 * Until the start screen remembers its own choices, the count defaults to the one older versions remembered.
 */
export function nodeConquestSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = env?.preferences?.get(OLD_SETUP_PREFERENCE);
  const opponents = isRecord(old) && isOneOf(old.opponents, OPPONENT_COUNTS) ? old.opponents : 1;
  return [
    { kind: 'choice', id: 'map', labelKey: 'map.label', valueKey: 'map', values: MAP_CHOICES, default: 'random', hintKey: 'map.hint' },
    { kind: 'choice', id: 'opponents', labelKey: 'opponents.label', valueKey: 'opponents', values: OPPONENT_COUNTS, default: opponents, when: { map: MATCH_MAPS } }
  ];
}

/**
 * The start-screen settings a match was started with (for saves from before the host kept them). The state keeps
 * the map, not how it was chosen: the map the game number picks counts as "any map" (the default).
 */
export function nodeConquestSettingsOf(state: NcState): Record<string, SettingValue> {
  const map = state.map === INTRO_MAP ? 'intro' : state.map === mapForSeed(state.seed) ? 'random' : String(state.map + 1);
  return { difficulty: state.difficulty, map, opponents: state.opponents };
}

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
