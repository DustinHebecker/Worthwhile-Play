import type { GamePreferences } from '@wp/game-core';

/** Minimal Storage surface (localStorage, or a stand-in in tests and private windows). */
export interface KeyValueStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PREFIX = 'wp:pref:';
/** Generous upper bound per value: preferences are small options, never game state. */
const MAX_LENGTH = 2000;

/**
 * Per-game preferences backed by a key-value storage (localStorage in the app). Every access is guarded:
 * storage can be missing or throw (private windows, blocked site data), and then preferences are simply
 * not remembered. Values are JSON; unreadable entries read as undefined.
 */
export function createPreferences(storage: KeyValueStorage | undefined, gameId: string): GamePreferences {
  const full = (key: string) => `${PREFIX}${gameId}:${key}`;
  return {
    get(key) {
      try {
        const raw = storage?.getItem(full(key));
        return raw === null || raw === undefined ? undefined : (JSON.parse(raw) as unknown);
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      try {
        if (value === undefined) {
          storage?.removeItem(full(key));
          return;
        }
        const raw = JSON.stringify(value);
        if (raw.length <= MAX_LENGTH) storage?.setItem(full(key), raw);
      } catch {
        /* not remembered */
      }
    }
  };
}

/** Removes every game preference (used together with "delete saved games"). Returns how many were removed. */
export function clearPreferences(storage: KeyValueStorage | undefined): number {
  if (!storage) return 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
    return keys.length;
  } catch {
    return 0;
  }
}
