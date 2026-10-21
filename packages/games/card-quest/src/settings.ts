import { createRng, isOneOf, isRecord, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { DEFAULT_SETTINGS, DIFFICULTIES, MAX_OPPONENTS, ROUND_LIMITS, type CardQuestState, type Settings } from './rules';
import { WORLD_IDS, type WorldId } from './worlds';

/** `context.preferences` key under which versions before the start screen (ADR 0017) remembered the setup. */
export const OLD_SETUP_PREFERENCE = 'setup';

/** `context.preferences` key of the in-game coach switch (a display preference, not a start-screen setting). */
export const COACH_PREFERENCE = 'coach';

/** Start-screen toggle id of a world (`world-kz`). */
export const worldSetting = (world: WorldId): string => `world-${world}`;

/** Start-screen choice `worlds`: drawn at random (default, owner 2026-10-21) or picked with the toggles. */
export const WORLD_MODES = ['random', 'pick'] as const;

/**
 * The worlds of a "Random" game, drawn from the seed (so a seed always deals the same game): one world or a mix of
 * two, each half of the time, every world and every pair equally likely. Uses its own generator, not the deal's.
 */
export function randomWorlds(seed: number): WorldId[] {
  const rng = createRng((seed ^ 0x5eedfeed) >>> 0);
  const single = rng.next() < 0.5;
  const drawn = rng.shuffle(WORLD_IDS).slice(0, single ? 1 : 2);
  return WORLD_IDS.filter((w) => drawn.includes(w));
}

export const OPPONENT_COUNTS = Array.from({ length: MAX_OPPONENTS }, (_, i) => i + 1);

/**
 * Reads untrusted settings (start screen or a remembered preference), keeping each valid field and the default
 * otherwise. Worlds: `worlds: 'pick'` with the ticked toggles (`world-kz: true`), or an old list (`worlds: ['kz']`);
 * "Random", no settings at all, or nothing ticked draws them from the seed (without a seed: the default world).
 */
export function readSettings(value: unknown, difficulty?: unknown, seed?: number): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS, worlds: [...DEFAULT_SETTINGS.worlds] };
  const record = isRecord(value) ? value : {};
  const listed = Array.isArray(record.worlds) ? record.worlds : [];
  const picked = record.worlds === 'random' ? [] : WORLD_IDS.filter((w) => record[worldSetting(w)] === true || listed.includes(w));
  if (picked.length > 0) s.worlds = picked;
  else if (seed !== undefined) Object.assign(s, { worlds: randomWorlds(seed), randomWorlds: true });
  if (isRecord(value)) {
    if (isOneOf(value.opponents, OPPONENT_COUNTS)) s.opponents = value.opponents;
    if (isOneOf(value.roundLimit, ROUND_LIMITS)) s.roundLimit = value.roundLimit;
    if (typeof value.coach === 'boolean') s.coach = value.coach;
  }
  if (isOneOf(difficulty, DIFFICULTIES)) s.difficulty = difficulty;
  return s;
}

/**
 * Start-screen settings (ADR 0017): which worlds are shuffled together ("Random" by default, or one toggle each), how
 * cunning the computer players are, how many there are and an optional round limit (coach tips are switched in the
 * game). The target is always level 10 (owner decision 2026-10-17; older saves keep theirs). The host remembers the
 * last choice; the defaults here follow the setup older versions remembered in the game.
 */
export function cardQuestSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = readSettings(env?.preferences?.get(OLD_SETUP_PREFERENCE));
  return [
    { kind: 'choice', id: 'worlds', labelKey: 'setup.worlds', valueKey: 'setup.worldModes', values: WORLD_MODES, default: 'random', display: 'radio', hintKey: 'setup.worlds.random' },
    ...WORLD_IDS.map((w, i): SettingSpec => ({
      kind: 'toggle',
      id: worldSetting(w),
      labelKey: `world.${w}`,
      default: old.worlds.includes(w),
      when: { worlds: ['pick'] },
      ...(i === WORLD_IDS.length - 1 ? { hintKey: 'setup.worlds.hint' } : {})
    })),
    { kind: 'difficulty', default: DEFAULT_SETTINGS.difficulty },
    { kind: 'choice', id: 'opponents', labelKey: 'setup.opponents', valueKey: 'setup.opponentCount', values: OPPONENT_COUNTS, default: old.opponents, display: 'radio' },
    { kind: 'choice', id: 'roundLimit', labelKey: 'setup.roundLimit', valueKey: 'setup.roundLimits', values: ROUND_LIMITS, default: old.roundLimit, hintKey: 'setup.roundLimit.hint' }
  ];
}

/** The start-screen settings a game was started with. */
export function cardQuestSettingsOf(state: CardQuestState): Record<string, SettingValue> {
  const { worlds, randomWorlds: random, difficulty, opponents, roundLimit } = state.settings;
  const chosen = random ? { worlds: 'random' } : { worlds: 'pick', ...Object.fromEntries(WORLD_IDS.map((w) => [worldSetting(w), worlds.includes(w)])) };
  return { ...chosen, difficulty, opponents, roundLimit };
}
