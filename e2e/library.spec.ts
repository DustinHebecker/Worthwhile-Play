import { expect, test, type Page } from '@playwright/test';
import { readLibrary, readSave } from '../packages/testing/src/e2e';

/**
 * Puts a row into the app's library store (ADR 0012) as a game would through `GameContext.library`. Only call it
 * once the app has opened (and so upgraded) the database, e.g. after the Settings page shows its library count.
 */
async function seedLibraryItem(page: Page, gameId: string, id: string, name: string): Promise<void> {
  await page.evaluate(
    ([gameId, id, name]) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('library', 'readwrite');
          const data = { cells: [0, 1, 2] };
          tx.objectStore('library').put({ gameId, id, name, updatedAt: new Date().toISOString(), size: JSON.stringify(data).length, data });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    [gameId, id, name] as const
  );
}

test('own creations: kept by "Delete all saved games", removed by "Delete my own content" after confirmation', async ({ page }) => {
  await page.goto('/games/memory');
  await page.getByTestId('new-game').click();
  await expect.poll(() => readSave(page, 'memory')).toBeTruthy();

  await page.goto('/settings');
  await expect(page.getByTestId('library-info')).toContainText(': 0');
  await expect(page.getByTestId('clear-library')).toBeDisabled();
  await seedLibraryItem(page, 'relay-command', 'ridge', 'Ridge');
  await seedLibraryItem(page, 'relay-command', 'valley', 'Valley');
  await page.reload();
  await expect(page.getByTestId('library-info')).toContainText(': 2');
  await expect(page.getByTestId('library-games')).toContainText('Relay Command');

  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('clear-saves').click();
  await expect.poll(() => readSave(page, 'memory')).toBeFalsy();
  await expect(page.getByTestId('library-info')).toContainText(': 2');
  expect((await readLibrary(page, 'relay-command')).map((row) => row.name).sort()).toEqual(['Ridge', 'Valley']);

  page.once('dialog', (dialog) => void dialog.dismiss());
  await page.getByTestId('clear-library').click();
  await expect(page.getByTestId('library-info')).toContainText(': 2');
  expect(await readLibrary(page, 'relay-command')).toHaveLength(2);

  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('clear-library').click();
  await expect(page.getByTestId('library-info')).toContainText(': 0');
  await expect(page.getByTestId('clear-library')).toBeDisabled();
  await expect(page.getByTestId('library-games')).toBeHidden();
  expect(await readLibrary(page, 'relay-command')).toEqual([]);
});
