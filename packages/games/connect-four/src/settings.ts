import { isOneOf, type NewGameOptions, type SettingSpec } from '@wp/game-core';
import { CONNECTS, DEFAULT_DIFFICULTY, DIFFICULTIES, OPPONENTS, SIZES, STANDARD_VARIANT, STARTERS, type RoundOptions } from './rules';

export const RULES = ['classic', 'pullOut'] as const;

/** Start-screen settings (ADR 0017): opponent, who starts, strength, board size, goal and pull-out rule. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'opponent', labelKey: 'opponent', valueKey: 'opponent', values: OPPONENTS, default: 'computer' },
  { kind: 'choice', id: 'starter', labelKey: 'starter', valueKey: 'starter', values: STARTERS, default: 'human', when: { opponent: ['computer'] } },
  { kind: 'difficulty', labelKey: 'strength', when: { opponent: ['computer'] } },
  { kind: 'choice', id: 'size', labelKey: 'size', valueKey: 'size', values: SIZES, default: STANDARD_VARIANT.size },
  { kind: 'choice', id: 'goal', labelKey: 'goal', valueKey: 'goal', values: CONNECTS, default: STANDARD_VARIANT.connect },
  { kind: 'choice', id: 'rule', labelKey: 'rule', valueKey: 'rule', values: RULES, default: 'classic' }
];

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
