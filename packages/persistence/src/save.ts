import type { GameModule } from '@wp/game-core';
import { isRecord, isUint32 } from '@wp/game-core';

export const SAVE_SCHEMA_VERSION = 1;

/** Envelope around a game's logical state. The envelope format is shared by all games. */
export interface GameSave<S = unknown> {
  schemaVersion: typeof SAVE_SCHEMA_VERSION;
  gameId: string;
  /** `metadata.stateVersion` of the game that wrote `state`. */
  stateVersion: number;
  /** ISO-8601 timestamp of the last write. */
  updatedAt: string;
  seed: number;
  difficulty?: string;
  state: S;
}

export function isGameSave(value: unknown): value is GameSave {
  return (
    isRecord(value) &&
    value.schemaVersion === SAVE_SCHEMA_VERSION &&
    typeof value.gameId === 'string' &&
    Number.isInteger(value.stateVersion) &&
    typeof value.updatedAt === 'string' &&
    isUint32(value.seed) &&
    (value.difficulty === undefined || typeof value.difficulty === 'string') &&
    'state' in value
  );
}

export type LoadResult<S> =
  | { status: 'empty' }
  | { status: 'ok'; save: GameSave<S>; migrated: boolean }
  /** Present but unusable. The host offers a fresh start; it never crashes. */
  | { status: 'corrupt'; reason: string };

/**
 * Validates and, if needed, migrates an untrusted stored value for a specific game.
 * Pure function: never throws, never touches storage.
 */
export function interpretSave<S>(raw: unknown, module: GameModule<S>): LoadResult<S> {
  if (raw === undefined || raw === null) return { status: 'empty' };
  if (!isGameSave(raw)) return { status: 'corrupt', reason: 'invalid-envelope' };
  const { metadata } = module;
  if (raw.gameId !== metadata.id) return { status: 'corrupt', reason: 'game-mismatch' };
  if (raw.stateVersion > metadata.stateVersion) return { status: 'corrupt', reason: 'newer-version' };

  let state: unknown = raw.state;
  let migrated = false;
  if (raw.stateVersion < metadata.stateVersion) {
    try {
      state = module.migrateState?.(raw.state, raw.stateVersion);
    } catch {
      state = undefined;
    }
    if (state === undefined) return { status: 'corrupt', reason: 'migration-failed' };
    migrated = true;
  }

  let valid = false;
  try {
    valid = module.isValidState(state);
  } catch {
    valid = false;
  }
  if (!valid) return { status: 'corrupt', reason: 'invalid-state' };
  return { status: 'ok', migrated, save: { ...raw, stateVersion: metadata.stateVersion, state: state as S } };
}

export function createSave<S>(module: GameModule<S>, seed: number, state: S, difficulty?: string, now: Date = new Date()): GameSave<S> {
  const save: GameSave<S> = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gameId: module.metadata.id,
    stateVersion: module.metadata.stateVersion,
    updatedAt: now.toISOString(),
    seed: seed >>> 0,
    state
  };
  if (difficulty !== undefined) save.difficulty = difficulty;
  return save;
}
