import type { SettingSpec } from '@wp/game-core';
import { OPPONENTS, STARTERS } from './rules';
import { ROLES } from './order-chaos';
import { VARIANTS } from './state';
import { DEFAULT_SETUP } from './view';

/**
 * Start-screen settings (ADR 0017): variant, opponent, then — against the computer — who starts (classic and
 * board in board) or the person's role (Order & Chaos), and the computer's strength.
 */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'variant', labelKey: 'variant', valueKey: 'variant', values: VARIANTS, default: DEFAULT_SETUP.variant },
  { kind: 'choice', id: 'opponent', labelKey: 'opponent', valueKey: 'opponent', values: OPPONENTS, default: DEFAULT_SETUP.opponent },
  { kind: 'choice', id: 'starter', labelKey: 'starter', valueKey: 'starter', values: STARTERS, default: DEFAULT_SETUP.starter, when: { opponent: ['computer'], variant: ['classic', 'nested'] } },
  { kind: 'choice', id: 'role', labelKey: 'role', valueKey: 'role', values: ROLES, default: DEFAULT_SETUP.role, when: { opponent: ['computer'], variant: ['order-chaos'] } },
  { kind: 'difficulty', labelKey: 'strength', when: { opponent: ['computer'] } }
];
