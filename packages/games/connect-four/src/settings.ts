import { isOneOf, type NewGameOptions, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { CONNECTS, DEFAULT_DIFFICULTY, DIFFICULTIES, OPPONENTS, SIZES, STANDARD_VARIANT, STARTERS, isValidVariant, type ConnectFourState, type RoundOptions, type Variant } from './rules';

export const RULES = ['classic', 'pullOut'] as const;

/** The board variant older versions remembered in the game (preference `variant`), used as start-screen defaults. */
export const OLD_VARIANT_PREFERENCE = 'variant';

/**
 * Start-screen settings (ADR 0017): opponent, who starts, strength, board size, goal and pull-out rule. Until the
 * start screen remembers its own choices, the board defaults to the variant older versions remembered.
 */
export function connectFourSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old: unknown = env?.preferences?.get(OLD_VARIANT_PREFERENCE);
  const variant: Variant = isValidVariant(old) ? old : STANDARD_VARIANT;
  return [
    { kind: 'choice', id: 'opponent', labelKey: 'opponent', valueKey: 'opponent', values: OPPONENTS, default: 'computer' },
    { kind: 'choice', id: 'starter', labelKey: 'starter', valueKey: 'starter', values: STARTERS, default: 'human', when: { opponent: ['computer'] } },
    { kind: 'difficulty', labelKey: 'strength', when: { opponent: ['computer'] } },
    { kind: 'choice', id: 'size', labelKey: 'size', valueKey: 'size', values: SIZES, default: variant.size },
    { kind: 'choice', id: 'goal', labelKey: 'goal', valueKey: 'goal', values: CONNECTS, default: variant.connect },
    { kind: 'choice', id: 'rule', labelKey: 'rule', valueKey: 'rule', values: RULES, default: variant.pullOut ? 'pullOut' : 'classic' }
  ];
}

/** The start-screen settings a round was started with (for saves from before the host kept them). */
export function connectFourSettingsOf(state: ConnectFourState): Record<string, SettingValue> {
  const { opponent, starter, difficulty, variant } = state;
  return { opponent, starter, difficulty, size: variant.size, goal: variant.connect, rule: variant.pullOut ? 'pullOut' : 'classic' };
}

/** Round options from untrusted start options; anything missing or invalid falls back to the default. */
export function roundOptions(options: NewGameOptions, seed: number): RoundOptions {
  const s = options.settings ?? {};
  const connect = Number(s.goal);
  return {
    seed,
    difficulty: isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY,
    opponent: isOneOf(s.opponent, OPPONENTS) ? s.opponent : 'computer',
    starter: isOneOf(s.starter, STARTERS) ? s.starter : 'human',
    variant: {
      size: isOneOf(s.size, SIZES) ? s.size : STANDARD_VARIANT.size,
      connect: isOneOf(connect, CONNECTS) ? connect : STANDARD_VARIANT.connect,
      pullOut: s.rule === 'pullOut'
    }
  };
}
