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
      // The catalogue renders after the locale has loaded: wait for the cards before counting them.
      await expect.poll(() => cards.count()).toBeGreaterThan(40);
      const count = await cards.count();
      // A drawing (inline SVG) or a photo (<picture> without a box of its own) per card, always decorative.
      await expect(page.locator('.game-card > svg.game-preview[aria-hidden="true"], .game-card > picture > img.game-preview[aria-hidden="true"][alt=""]')).toHaveCount(count);
      await expect(page.locator('.game-preview--generic')).toHaveCount(0);
      for (const id of ['relay-command', 'black-box', 'compression-challenge']) {
        const card = page.getByTestId(`game-card-${id}`);
        await card.scrollIntoViewIfNeeded();
        const preview = card.locator('.game-preview');
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

  for (const scheme of ['light', 'dark'] as const) {
    test(`Relay Command's card shows the game's own picture (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      const card = page.getByTestId('game-card-relay-command');
      await card.scrollIntoViewIfNeeded();
      const img = card.locator('picture > img.game-preview--photo');
      await expect(img).toBeVisible();
      // Loaded (lazy images load once near the viewport), the matching file for the colour scheme, at full resolution.
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBe(288);
      expect(await img.evaluate((el: HTMLImageElement) => new URL(el.currentSrc).pathname)).toBe(`/previews/relay-command-${scheme}.webp`);
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalHeight)).toBe(192);
      // Fills the band above the title like the drawings do.
      const [box, titleBox] = [await img.boundingBox(), await card.locator('.game-card-title').boundingBox()];
      expect(box!.width).toBeGreaterThan(80);
      expect(box!.y + box!.height).toBeLessThanOrEqual(titleBox!.y + 1);
      expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');
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

  test('the preview photos are precached and show offline in both colour schemes', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    // In the precache, not only in the HTTP cache: never shown before going offline.
    for (const scheme of ['light', 'dark']) {
      expect(await page.evaluate(async (url) => Boolean(await caches.match(url, { ignoreSearch: true })), `/previews/relay-command-${scheme}.webp`)).toBe(true);
    }
    await context.setOffline(true);
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.reload();
      const img = page.getByTestId('game-card-relay-command').locator('img.game-preview--photo');
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBe(288);
      expect(await img.evaluate((el: HTMLImageElement) => new URL(el.currentSrc).pathname)).toBe(`/previews/relay-command-${scheme}.webp`);
    }
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
