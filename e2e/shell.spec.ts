import { expect, test } from '@playwright/test';

test.describe('app shell', () => {
  test('home lists games and explains the product', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('game-card-memory')).toBeVisible();
    await expect(page.getByTestId('legal-link')).toBeVisible();
  });

  test('every game is reachable by direct URL', async ({ page }) => {
    for (const id of ['tic-tac-toe', 'mastermind', 'memory']) {
      await page.goto(`/games/${id}`);
      await expect(page.getByTestId('new-game')).toBeVisible();
    }
  });

  test('legal notice is reachable from a game page and renders without provider data in CI', async ({ page }) => {
    await page.goto('/games/memory');
    await page.getByTestId('legal-link').click();
    await expect(page).toHaveURL(/\/legal$/);
    await expect(page.getByTestId('legal-provider').or(page.getByTestId('legal-missing'))).toBeVisible();
  });

  test('switching to Arabic applies RTL, persists, and leaves content preferences alone', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('#learning-language').selectOption('ja');
    await page.getByTestId('ui-language').selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#learning-language')).toHaveValue('ja');
  });

  test('unknown routes show a not-found page', async ({ page }) => {
    await page.goto('/games/does-not-exist');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('new-game')).toHaveCount(0);
  });

  test('a corrupt save never breaks the app', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('worthwhile-play', 1);
          open.onupgradeneeded = () => open.result.createObjectStore('saves', { keyPath: 'gameId' });
          open.onsuccess = () => {
            const tx = open.result.transaction('saves', 'readwrite');
            tx.objectStore('saves').put({ gameId: 'memory', garbage: true });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          };
        })
    );
    await page.goto('/games/memory');
    await expect(page.getByTestId('save-corrupt')).toBeVisible();
    await page.getByTestId('new-game').click();
    await expect(page.getByTestId('game-root')).toBeVisible();
  });
});

test.describe('offline', () => {
  test('the installed app works offline after the first visit', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload(); // let the service worker control the page
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.goto('/games/mastermind');
    await expect(page.getByTestId('new-game')).toBeVisible();
    await page.getByTestId('new-game').click();
    await expect(page.getByTestId('game-root')).toBeVisible();
    await context.setOffline(false);
  });
});
