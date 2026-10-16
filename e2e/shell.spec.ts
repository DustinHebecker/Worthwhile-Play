import { expect, test } from '@playwright/test';
import { readSave, startGame } from '../packages/testing/src/e2e';

test.describe('app shell', () => {
  test('home lists games and explains the product', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('game-card-memory')).toBeVisible();
    await expect(page.getByTestId('legal-link')).toBeVisible();
  });

  for (const locale of ['en', 'ar']) {
    test(`home at 360 px (${locale}): every card shows its decorative preview, no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await page.addInitScript((l) => localStorage.setItem('worthwhile-play:ui-locale', l), locale);
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      const cards = page.locator('.game-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(40);
      await expect(page.locator('.game-card > svg.game-preview[aria-hidden="true"]')).toHaveCount(count);
      await expect(page.locator('.game-preview--generic')).toHaveCount(0);
      for (const id of ['relay-command', 'black-box', 'compression-challenge']) {
        const card = page.getByTestId(`game-card-${id}`);
        await card.scrollIntoViewIfNeeded();
        const preview = card.locator('svg.game-preview');
        await expect(preview).toBeVisible();
        const [cardBox, previewBox] = [await card.boundingBox(), await preview.boundingBox()];
        expect(previewBox!.width).toBeGreaterThan(80);
        expect(previewBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
        expect(previewBox!.x + previewBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
        // The preview is a band above the title.
        const titleBox = await card.locator('.game-card-title').boundingBox();
        expect(previewBox!.y + previewBox!.height).toBeLessThanOrEqual(titleBox!.y + 1);
        expect(previewBox!.height).toBeLessThanOrEqual(122);
        // The preview's glyphs (e.g. "3 ? 7" in Black Box) never become part of the link's name: it starts with the title.
        const title = (await card.locator('.game-card-title').innerText()).trim();
        await expect(card).toHaveAccessibleName(new RegExp(`^${title.slice(0, 4).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });
  }

  for (const locale of ['de', 'ru']) {
    test(`saved-game badge stays one unbroken pill at 360 px (${locale})`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await page.addInitScript((l) => localStorage.setItem('worthwhile-play:ui-locale', l), locale);
      await startGame(page, 'memory');
      await expect(page.getByTestId('game-root')).toBeVisible();
      await expect.poll(() => readSave(page, 'memory')).toBeTruthy();
      await page.goto('/');
      await page.reload();
      const badge = page.getByTestId('saved-memory');
      await expect(badge).toBeVisible();
      // Exactly one line box: the pill may move below the title as a whole, but never wraps inside.
      expect(await badge.evaluate((el) => el.getClientRects().length)).toBe(1);
      const [badgeBox, cardBox] = [await badge.boundingBox(), await page.getByTestId('game-card-memory').boundingBox()];
      expect(badgeBox!.height).toBeLessThan(30);
      expect(badgeBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
      expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
    });
  }

  test('skill filter narrows the catalogue and saved games are marked', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('filter-memory').click();
    await expect(page).toHaveURL(/\?skill=memory$/);
    await expect(page.getByTestId('game-card-memory')).toBeVisible();
    await expect(page.getByTestId('game-card-tic-tac-toe')).toBeHidden();
    await page.getByTestId('filter-all').click();
    await expect(page.getByTestId('game-card-tic-tac-toe')).toBeVisible();
    await startGame(page, 'memory');
    await expect(page.getByTestId('game-root')).toBeVisible();
    // Leave only once the new game is stored (the write is asynchronous).
    await expect.poll(() => readSave(page, 'memory')).toBeTruthy();
    await page.goto('/');
    await expect(page.getByTestId('saved-memory')).toBeVisible();
    await expect(page.getByTestId('saved-tic-tac-toe')).toBeHidden();
  });

  test('every game is reachable by direct URL', async ({ page }) => {
    for (const id of ['tic-tac-toe', 'mastermind', 'memory', 'connect-four', 'lights-out', 'nonogram', 'sequence-memory', 'black-box', 'sokoban', 'skyscrapers', 'laser-circuit', 'minesweeper', 'sliding-blocks', 'constraint-grid', 'river-crossing', 'bridges', 'graph-detective', 'minimal-proof', 'logic-path', 'spatial-memory', 'signal-watch', 'circuit-puzzle', 'systems-puzzle', 'distractor-control', 'rule-discovery', 'debug-system', 'node-conquest', 'slitherlink', 'chess', 'word-guess', 'stack-duel', 'n-back', 'visual-search', 'relay-command', 'prospective-memory', 'association']) {
      await page.goto(`/games/${id}`);
      // The start screen, or a game whose own setup is its first screen (ADR 0015).
      await expect(page.getByTestId('start-game').or(page.getByTestId('new-game')).first()).toBeVisible();
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
    await expect(page.getByTestId('ui-language')).toBeFocused();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#learning-language')).toHaveValue('ja');
  });

  test('the language switcher is visible in the header on every page', async ({ page }) => {
    await page.goto('/games/memory');
    const menu = page.getByTestId('language-menu');
    await expect(menu).toBeVisible();
    await expect(menu.locator('summary')).toContainText('English');
    await menu.locator('summary').click();
    await page.getByTestId('header-language').selectOption('de');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.getByTestId('language-menu').locator('summary')).toContainText('Deutsch');
    await expect(page.getByTestId('start-game')).toHaveText('Starten');
    await expect(page.getByTestId('start-form').locator('h2')).toHaveText('Neues Spiel');
    // The menu stays open with focus on the select, so a keyboard user can keep choosing.
    await expect(page.getByTestId('language-menu')).toHaveAttribute('open', '');
    await expect(page.getByTestId('header-language')).toBeFocused();
  });

  test('unknown routes show a not-found page', async ({ page }) => {
    await page.goto('/games/does-not-exist');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByTestId('new-game')).toHaveCount(0);
    await expect(page.getByTestId('start-game')).toHaveCount(0);
  });

  test('a corrupt save never breaks the app', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('worthwhile-play');
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
    await expect(page.getByTestId('continue')).toHaveCount(0);
    await page.getByTestId('start-game').click();
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
    await expect(page.getByTestId('start-game')).toBeVisible();
    await page.getByTestId('start-game').click();
    await expect(page.getByTestId('game-root')).toBeVisible();
    await context.setOffline(false);
  });

  test('switching to a language never loaded before works offline (all locale chunks are precached)', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.getByTestId('language-menu').locator('summary').click();
    await page.getByTestId('header-language').selectOption('uk');
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page.getByTestId('language-menu').locator('summary')).toContainText('Українська');
    await expect(page.getByTestId('game-card-memory')).not.toContainText('Memory');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await expect(page.getByTestId('game-card-memory')).toBeVisible();
    await context.setOffline(false);
  });
});
