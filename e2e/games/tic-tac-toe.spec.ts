// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const GAME = 'tic-tac-toe';

const boardMarks = (page: Page) =>
  Promise.all(Array.from({ length: 9 }, (_, i) => page.getByTestId(`cell-${i}`).getAttribute('data-mark')));

async function startNewGame(page: Page) {
  await page.goto(`/games/${GAME}`);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  await expect(page.getByTestId('cell-0')).toBeVisible();
}

test('resumes after reload with the same board', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('cell-4').click();
    // Default opponent is the computer: its reply is part of the same logical step.
    await expect(p.locator('[data-cell][data-mark="O"]')).toHaveCount(1);
    before = await boardMarks(p);
  });
  await expect(page.getByTestId('cell-4')).toHaveAttribute('data-mark', 'X');
  await expect(page.locator('[data-cell][data-mark="O"]')).toHaveCount(1);
  expect(await boardMarks(page)).toEqual(before);
});

test('two people can play to a win, shown by a highlighted line', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('option-opponent').selectOption('human');
  for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`cell-${i}`).click();
  for (const i of [0, 1, 2]) await expect(page.getByTestId(`cell-${i}`)).toHaveAttribute('data-winning', '');
  await expect(page.getByTestId('strike')).toBeVisible();
  await expect(page.getByTestId('cell-8')).toHaveAttribute('aria-disabled', 'true');
});

test('is playable with the keyboard', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('cell-0').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cell-4')).toHaveAttribute('data-mark', 'X');
});
