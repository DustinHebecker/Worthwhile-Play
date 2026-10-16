import type { SettingSpec } from '@wp/game-core';
import { DEFAULT_OPPONENTS, MAX_OPPONENTS, MIN_OPPONENTS } from './rules';

export const OPPONENT_CHOICES: readonly number[] = Array.from({ length: MAX_OPPONENTS - MIN_OPPONENTS + 1 }, (_, i) => MIN_OPPONENTS + i);

/**
 * Start-screen settings (ADR 0017): the opponents' level and how many there are. The table itself (seats, chips,
 * blinds) follows from them; nothing else is chosen before play.
 */
export const settings: readonly SettingSpec[] = [
  { kind: 'difficulty', labelKey: 'setup.level' },
  { kind: 'choice', id: 'opponents', labelKey: 'setup.opponents', valueKey: 'opponents', values: OPPONENT_CHOICES, default: DEFAULT_OPPONENTS }
];
