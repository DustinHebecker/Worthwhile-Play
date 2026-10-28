import { defineGame, type SettingSpec } from '@wp/game-core';
import { metadata } from './metadata';
import { isBalanceState, settingsOf, type BalanceState } from './rules';
import { createBalance } from './view';

export type { BalanceState } from './rules';

/** The start screen (ADR 0017, design § 7): puzzles or the free bench, which bench, which tasks, the difficulty. */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: ['round', 'free'], default: 'round', display: 'radio' },
  { kind: 'choice', id: 'bench', labelKey: 'bench.label', valueKey: 'bench', values: ['mixed', 'beam', 'mobile', 'stack'], default: 'mixed', display: 'radio', when: { mode: ['round'] } },
  { kind: 'choice', id: 'tasks', labelKey: 'tasks.label', valueKey: 'tasks', values: ['mixed', 'predict', 'build'], default: 'mixed', display: 'radio', hintKey: 'tasks.hint', when: { mode: ['round'] } },
  { kind: 'choice', id: 'freeBench', labelKey: 'freeBench.label', valueKey: 'bench', values: ['beam', 'mobile', 'stack'], default: 'beam', display: 'radio', when: { mode: ['free'] } },
  { kind: 'difficulty', default: 'easy', when: { mode: ['round'] } }
];

export default defineGame<BalanceState>({
  metadata,
  settings,
  settingsOf,
  create: createBalance,
  isValidState: isBalanceState
});
