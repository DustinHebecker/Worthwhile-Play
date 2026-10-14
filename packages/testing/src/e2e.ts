import { expect, type Page } from '@playwright/test';

/** Reads the raw persisted save for a game from the app's IndexedDB. */
export async function readSave(page: Page, gameId: string): Promise<unknown> {
  return page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          // Never hold the database open: the app's own (upgrading) open would be blocked by this connection.
          db.onversionchange = () => db.close();
          if (!db.objectStoreNames.contains('saves')) {
            db.close();
            return resolve(undefined);
          }
          const get = db.transaction('saves', 'readonly').objectStore('saves').get(id);
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
          get.onerror = () => {
            db.close();
            reject(get.error);
          };
        };
      }),
    gameId
  );
}

/** Raw library rows (ADR 0012) of one game, e.g. a game's saved maps, from the app's IndexedDB (sorted by id). */
export async function readLibrary(page: Page, gameId: string): Promise<{ gameId: string; id: string; name: string; updatedAt: string; size: number; data: unknown }[]> {
  return page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          db.onversionchange = () => db.close();
          if (!db.objectStoreNames.contains('library')) {
            db.close();
            return resolve([]);
          }
          const all = db.transaction('library', 'readonly').objectStore('library').index('byGame').getAll(id);
          all.onsuccess = () => {
            db.close();
            resolve(all.result);
          };
          all.onerror = () => {
            db.close();
            reject(all.error);
          };
        };
      }),
    gameId
  );
}

/**
 * Universal resume contract (spec: "every game must be closable at any time and resumable later").
 * Opens the game by direct URL, starts a new game, performs `act`, reloads the page,
 * continues, and asserts that the persisted logical state is unchanged.
 */
export async function expectResumeAfterReload(page: Page, gameId: string, act: (page: Page) => Promise<void>): Promise<void> {
  await page.goto(`/games/${gameId}`);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  await act(page);
  // Wait until the autosave has caught up: the persisted state must be stable for a moment.
  let previous = '';
  await expect
    .poll(async () => {
      const current = JSON.stringify(((await readSave(page, gameId)) as { state?: unknown } | undefined)?.state ?? null);
      const stable = current !== 'null' && current === previous;
      previous = current;
      return stable;
    }, { intervals: [150] })
    .toBe(true);
  const before = ((await readSave(page, gameId)) as { state: unknown }).state;

  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  const after = ((await readSave(page, gameId)) as { state: unknown }).state;
  expect(after).toEqual(before);
}
