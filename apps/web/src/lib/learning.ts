import type { GameLearningRecords } from '@wp/game-core';
import { createLearningRecords, localDay, toLearningRecord, type LearningRecord } from '@wp/learning-content';
import type { LearningStore } from '@wp/persistence';

/** All valid learning records on this device. Unreadable records are skipped (never crash a page). */
export async function loadLearningRecords(store: Promise<LearningStore> | LearningStore): Promise<LearningRecord[]> {
  try {
    const rows = await (await store).list();
    return rows.map(toLearningRecord).filter((r): r is LearningRecord => r !== undefined);
  } catch {
    return [];
  }
}

export interface HostLearning extends GameLearningRecords {
  /** Resolves when every write handed to the store so far has finished (or failed). */
  flush(): Promise<void>;
}

/**
 * `GameContext.learning` for a game page: the records loaded once, ratings applied idempotently in memory and
 * written to the store in order. "Today" is the device's local calendar day at the moment of asking.
 */
export function hostLearning(records: readonly LearningRecord[], store: LearningStore, today: () => string = () => localDay()): HostLearning {
  let pending: Promise<void> = Promise.resolve();
  const learning = createLearningRecords(records, {
    today,
    persist: (changed) => {
      pending = pending.then(() => store.putMany(changed)).catch((error: unknown) => console.error('learning records not saved', error));
    }
  });
  return {
    today: learning.today,
    list: learning.list,
    record: learning.record,
    flush: () => pending
  };
}

/** Deletes the records of imported decks that no longer exist (after "Delete my imported decks"). */
export async function removeUserDeckRecords(store: LearningStore): Promise<void> {
  const decks = new Set((await loadLearningRecords(store)).map((r) => r.deckId).filter((id) => id.startsWith('user-')));
  for (const id of decks) await store.removeDeck(id);
}
