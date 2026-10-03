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
          if (!db.objectStoreNames.contains('saves')) return resolve(undefined);
          const get = db.transaction('saves', 'readonly').objectStore('saves').get(id);
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
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
  await expect.poll(async () => JSON.stringify((await readSave(page, gameId) as { state?: unknown } | undefined)?.state ?? null)).not.toBe('null');
  const before = ((await readSave(page, gameId)) as { state: unknown }).state;

  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  const after = ((await readSave(page, gameId)) as { state: unknown }).state;
  expect(after).toEqual(before);
}
