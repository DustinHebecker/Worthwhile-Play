// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const GAME = 'connect-four';

/** data-disc of all 42 cells, row 0 (top) first. */
const boardDiscs = (page: Page) =>
  Promise.all(Array.from({ length: 42 }, (_, i) => page.getByTestId(`cell-${Math.floor(i / 7)}-${i % 7}`).getAttribute('data-disc')));

const cells = (page: Page, disc: '1' | '2') => page.locator(`[data-testid^="cell-"][data-disc="${disc}"]`);

async function startNewGame(page: Page) {
  await page.goto(`/games/${GAME}`);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  await expect(page.getByTestId('column-3')).toBeVisible();
}

test('resumes after reload with the same board', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('column-3').click();
    // Default opponent is the computer: its reply is part of the same logical step.
    await expect(cells(p, '2')).toHaveCount(1);
    before = await boardDiscs(p);
  });
  await expect(page.getByTestId('cell-5-3')).toHaveAttribute('data-disc', '1');
  await expect(cells(page, '1')).toHaveCount(1);
  await expect(cells(page, '2')).toHaveCount(1);
  expect(await boardDiscs(page)).toEqual(before);
});

test('two people can play to a win, shown by highlighted discs', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('option-opponent').selectOption('human');
  for (const c of [0, 1, 0, 1, 0, 1, 0]) await page.getByTestId(`column-${c}`).click();
  for (const r of [2, 3, 4, 5]) await expect(page.getByTestId(`cell-${r}-0`)).toHaveAttribute('data-winning', '');
  await expect(page.getByTestId('cell-5-1')).not.toHaveAttribute('data-winning', '');
  await expect(page.getByTestId('column-4')).toHaveAttribute('aria-disabled', 'true');
});

test('is playable with the keyboard', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('column-3').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('column-4')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cell-5-4')).toHaveAttribute('data-disc', '1');
});

test('fits a 360px-wide phone without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startNewGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await page.getByTestId('column-0').boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
});
