import { isRecord } from '@wp/game-core';
import type { Compiled } from './compile';
import { isValidAdventureState } from './state';
import type { AdventureState } from './types';

/**
 * Content migrations (docs/design/adventures.md § 5.2): `migrations[n]` turns a save written with content
 * version `n` into one for version `n + 1`. A step works on plain JSON and must not set `content` itself (the
 * engine does). Ids are append-only, so most steps are small: split a flag, map a renamed scene, drop a removed
 * clue. Every released version needs a step and a fixture test.
 */
export type ContentMigrations = Readonly<Record<number, (state: Record<string, unknown>) => Record<string, unknown>>>;

/**
 * Brings an untrusted save from content version `from` up to the adventure's current version. Returns
 * `undefined` (the host then treats the save as unusable) when a step is missing, throws, or the result is not
 * a valid state of the current content. Never throws.
 */
export function migrateAdventureState(c: Compiled, migrations: ContentMigrations, state: unknown, from: number): AdventureState | undefined {
  const target = c.adv.contentVersion;
  if (!Number.isInteger(from) || from < 1 || from >= target || !isRecord(state) || state.content !== from) return undefined;
  try {
    let s: Record<string, unknown> = structuredClone(state);
    for (let v = from; v < target; v++) {
      const step = Object.hasOwn(migrations, v) ? migrations[v] : undefined;
      if (!step) return undefined;
      s = { ...step(s), content: v + 1 };
    }
    return isValidAdventureState(c, s) ? s : undefined;
  } catch {
    return undefined;
  }
}
