/**
 * The serialized state of all three variants, its validation and the migration of older saves.
 * Pure and DOM-free.
 */
import { isRecord } from '@wp/game-core';
import { isValidClassicState, type ClassicState } from './rules';
import { isValidNestedState, type NestedState } from './nested';
import { isValidOcState, type OrderChaosState } from './order-chaos';

export const VARIANTS = ['classic', 'nested', 'order-chaos'] as const;
export type Variant = (typeof VARIANTS)[number];

/** Serialized logical state: one of the three variants, told apart by `variant`. Plain JSON. */
export type TicTacToeState = ClassicState | NestedState | OrderChaosState;

/** Thorough structural validation of untrusted data (any variant). Never throws. */
export function isValidState(value: unknown): value is TicTacToeState {
  if (!isRecord(value)) return false;
  switch (value.variant) {
    case 'classic':
      return isValidClassicState(value);
    case 'nested':
      return isValidNestedState(value);
    case 'order-chaos':
      return isValidOcState(value);
    default:
      return false;
  }
}

/**
 * Upgrades older saves. Version 1 only knew the classic game and had no `variant` field,
 * so such a save becomes a classic game with exactly the same moves.
 */
export function migrateState(state: unknown, fromVersion: number): TicTacToeState | undefined {
  if (fromVersion !== 1 || !isRecord(state) || 'variant' in state) return undefined;
  const migrated: unknown = { variant: 'classic', ...state };
  return isValidClassicState(migrated) ? migrated : undefined;
}
