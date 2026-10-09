import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const GAME = 'stack-duel';

const settled = (page: Page) => expect(page.locator('.wp-stack-duel')).toHaveAttribute('data-animating', 'false', { timeout: 20_000 });

/** Kind and pose ("x,y,angle") of every placed stone, in drop order. */
const poses = (page: Page) =>
  page.locator('[data-testid^="piece-"]').evaluateAll((els) => els.map((el) => `${el.getAttribute('data-kind')}@${el.getAttribute('data-pose')}`));

async function startNewGame(page: Page) {
  await page.goto(`/games/${GAME}`);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  await expect(page.getByTestId('board')).toBeVisible();
  // The board, not the mode select, gets focus, so arrow keys move the stone right away.
  await expect(page.getByTestId('board')).toBeFocused();
}

test('resumes after reload with every stone in the same place', async ({ page }) => {
  let before: string[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('drop').click();
    // Default opponent is the computer: its reply is part of the same logical step.
    await settled(p);
    await expect(p.locator('[data-testid^="piece-"]')).toHaveCount(2);
    // Keyboard instead of a button: harmless even if the computer's reply already ended the round.
    await p.getByTestId('board').focus();
    await p.keyboard.press('ArrowLeft');
    before = await poses(p);
  });
  await settled(page);
  await expect(page.locator('[data-testid^="piece-"]')).toHaveCount(2);
  expect(await poses(page)).toEqual(before);
  await expect(page.getByTestId('board')).toHaveAttribute('aria-label', /from the middle/);
});

test('is playable with the keyboard', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('board').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('q');
  await expect(page.getByTestId('board')).toHaveAttribute('aria-label', /-0[.,]25 .*15°/);
  await page.keyboard.press('Enter');
  await settled(page);
  await expect(page.locator('[data-testid^="piece-"]')).toHaveCount(2);
});

test('two people can play until a stone falls', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('option-mode').selectOption('human');
  await page.getByTestId('drop').click();
  await settled(page);
  await expect(page.getByTestId('status')).toContainText('Player 2');
  await page.getByTestId('board').focus();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await settled(page);
  await expect(page.getByTestId('status')).toContainText('player 1 wins');
  await expect(page.getByTestId('drop')).toBeDisabled();
});

test('fits a 360px-wide phone without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startNewGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const id of ['move-left', 'rotate-ccw', 'drop', 'rotate-cw', 'move-right']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
