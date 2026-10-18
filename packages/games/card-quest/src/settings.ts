import { isOneOf, isRecord, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { DEFAULT_SETTINGS, DIFFICULTIES, MAX_OPPONENTS, ROUND_LIMITS, type CardQuestState, type Settings } from './rules';
import { WORLD_IDS, type WorldId } from './worlds';

/** `context.preferences` key under which versions before the start screen (ADR 0017) remembered the setup. */
export const OLD_SETUP_PREFERENCE = 'setup';

/** `context.preferences` key of the in-game coach switch (a display preference, not a start-screen setting). */
export const COACH_PREFERENCE = 'coach';

/** Start-screen toggle id of a world (`world-kz`). */
export const worldSetting = (world: WorldId): string => `world-${world}`;

export const OPPONENT_COUNTS = Array.from({ length: MAX_OPPONENTS }, (_, i) => i + 1);

/**
 * Reads untrusted settings (start screen or a remembered preference), keeping each valid field and the default
 * otherwise. Worlds come as start-screen toggles (`world-kz: true`) or as a list (`worlds: ['kz']`); no world
 * chosen means the default world.
 */
export function readSettings(value: unknown, difficulty?: unknown): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS, worlds: [...DEFAULT_SETTINGS.worlds] };
  if (isRecord(value)) {
    const listed = Array.isArray(value.worlds) ? value.worlds : [];
    const worlds = WORLD_IDS.filter((w) => value[worldSetting(w)] === true || listed.includes(w));
    if (worlds.length > 0) s.worlds = worlds;
    if (isOneOf(value.opponents, OPPONENT_COUNTS)) s.opponents = value.opponents;
    if (isOneOf(value.roundLimit, ROUND_LIMITS)) s.roundLimit = value.roundLimit;
    if (typeof value.coach === 'boolean') s.coach = value.coach;
  }
  if (isOneOf(difficulty, DIFFICULTIES)) s.difficulty = difficulty;
  return s;
}

/**
 * Start-screen settings (ADR 0017): which worlds are shuffled together (one toggle each; none = Kampfzwerge), how
 * cunning the computer players are, how many there are and an optional round limit (coach tips are switched in the
 * game). The target is always level 10 (owner decision 2026-10-17; older saves keep theirs). The host remembers the
 * last choice; the defaults here follow the setup older versions remembered in the game.
 */
export function cardQuestSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = readSettings(env?.preferences?.get(OLD_SETUP_PREFERENCE));
  return [
    ...WORLD_IDS.map((w, i): SettingSpec => ({
      kind: 'toggle',
      id: worldSetting(w),
      labelKey: `world.${w}`,
      default: old.worlds.includes(w),
      ...(i === WORLD_IDS.length - 1 ? { hintKey: 'setup.worlds.hint' } : {})
    })),
    { kind: 'difficulty', default: DEFAULT_SETTINGS.difficulty },
    { kind: 'choice', id: 'opponents', labelKey: 'setup.opponents', valueKey: 'setup.opponentCount', values: OPPONENT_COUNTS, default: old.opponents, display: 'radio' },
    { kind: 'choice', id: 'roundLimit', labelKey: 'setup.roundLimit', valueKey: 'setup.roundLimits', values: ROUND_LIMITS, default: old.roundLimit, hintKey: 'setup.roundLimit.hint' }
  ];
}

/** The start-screen settings a game was started with. */
export function cardQuestSettingsOf(state: CardQuestState): Record<string, SettingValue> {
  const { worlds, difficulty, opponents, roundLimit } = state.settings;
  return { ...Object.fromEntries(WORLD_IDS.map((w) => [worldSetting(w), worlds.includes(w)])), difficulty, opponents, roundLimit };
}
