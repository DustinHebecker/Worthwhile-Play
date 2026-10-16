import { isOneOf, isRecord, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { DEFAULT_DIFFICULTY, OPPONENTS, STARTERS, type Opponent, type Starter } from './rules';
import { ROLES, type Role } from './order-chaos';
import { VARIANTS, type TicTacToeState, type Variant } from './state';

export interface Setup {
  variant: Variant;
  opponent: Opponent;
  /** Who plays X in the classic and nested games against the computer. */
  starter: Starter;
  /** The person's role in Order & Chaos against the computer. */
  role: Role;
}

export const DEFAULT_SETUP: Setup = { variant: 'classic', opponent: 'computer', starter: 'human', role: 'order' };

/** The setup older versions remembered in the game (preference `setup`), used as start-screen defaults. */
export const OLD_SETUP_PREFERENCE = 'setup';

/** Reads untrusted start-screen settings (ADR 0017), accepting each valid field and ignoring anything else. */
export function readSetup(value: unknown): Setup {
  const setup = { ...DEFAULT_SETUP };
  if (!isRecord(value)) return setup;
  if (isOneOf(value.variant, VARIANTS)) setup.variant = value.variant;
  if (isOneOf(value.opponent, OPPONENTS)) setup.opponent = value.opponent;
  if (isOneOf(value.starter, STARTERS)) setup.starter = value.starter;
  if (isOneOf(value.role, ROLES)) setup.role = value.role;
  return setup;
}

/**
 * Start-screen settings (ADR 0017): variant, opponent, then — against the computer — who starts (classic and
 * board in board) or the person's role (Order & Chaos), and the computer's strength (preselected: the game's own
 * default). Until the start screen remembers its own choices, the defaults follow the setup older versions remembered.
 */
export function ticTacToeSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = readSetup(env?.preferences?.get(OLD_SETUP_PREFERENCE));
  return [
    { kind: 'choice', id: 'variant', labelKey: 'variant', valueKey: 'variant', values: VARIANTS, default: old.variant },
    { kind: 'choice', id: 'opponent', labelKey: 'opponent', valueKey: 'opponent', values: OPPONENTS, default: old.opponent },
    { kind: 'choice', id: 'starter', labelKey: 'starter', valueKey: 'starter', values: STARTERS, default: old.starter, when: { opponent: ['computer'], variant: ['classic', 'nested'] } },
    { kind: 'choice', id: 'role', labelKey: 'role', valueKey: 'role', values: ROLES, default: old.role, when: { opponent: ['computer'], variant: ['order-chaos'] } },
    { kind: 'difficulty', labelKey: 'strength', default: DEFAULT_DIFFICULTY, when: { opponent: ['computer'] } }
  ];
}

/** The start-screen settings a round was started with (for saves from before the host kept them). */
export function ticTacToeSettingsOf(state: TicTacToeState): Record<string, SettingValue> {
  const { variant, opponent, difficulty } = state;
  return { variant, opponent, difficulty, ...(state.variant === 'order-chaos' ? { role: state.role } : { starter: state.starter }) };
}
