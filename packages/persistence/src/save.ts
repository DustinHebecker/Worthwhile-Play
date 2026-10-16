import type { GameModule, SettingValue } from '@wp/game-core';
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
  /**
   * Optional (ADR 0017): the start-screen settings this game was started with (without the difficulty), so that
   * "Another round" repeats them. Untrusted like everything stored: the host re-validates it against the game's
   * declared settings before use.
   */
  settings?: Record<string, SettingValue>;
  state: S;
}

/** At most this many settings are kept in a save envelope (games declare a handful). */
const MAX_SETTINGS = 64;

function isSettingsRecord(value: unknown): value is Record<string, SettingValue> {
  if (!isRecord(value) || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_SETTINGS &&
    entries.every(([key, v]) => key.length <= 64 && (typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.length <= 200)))
  );
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
    (value.settings === undefined || isSettingsRecord(value.settings)) &&
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
  // Unreadable settings never cost the game itself: they are dropped and the host falls back to defaults.
  if (isRecord(raw) && raw.settings !== undefined && !isSettingsRecord(raw.settings)) {
    const { settings: _dropped, ...rest } = raw;
    raw = rest;
  }
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

/** What a game was started with, besides the seed (ADR 0017); a plain string is the difficulty (older callers). */
export type SaveSetup = string | { readonly difficulty?: string | undefined; readonly settings?: Readonly<Record<string, SettingValue>> | undefined } | undefined;

export function createSave<S>(module: GameModule<S>, seed: number, state: S, setup?: SaveSetup, now: Date = new Date()): GameSave<S> {
  const { difficulty, settings } = typeof setup === 'string' ? { difficulty: setup, settings: undefined } : (setup ?? {});
  const save: GameSave<S> = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gameId: module.metadata.id,
    stateVersion: module.metadata.stateVersion,
    updatedAt: now.toISOString(),
    seed: seed >>> 0,
    state
  };
  if (difficulty !== undefined) save.difficulty = difficulty;
  if (settings !== undefined && Object.keys(settings).length > 0) save.settings = { ...settings };
  return save;
}
