// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('black-box: experiments and an open hypothesis test survive a reload', async ({ page }) => {
  // The default difficulty (easy) always uses a single whole number x from 0 to 20.
  await expectResumeAfterReload(page, 'black-box', async (p) => {
    await root(p).getByTestId('bb-input-0').fill('3');
    await root(p).getByTestId('bb-run').click();
    await expect(root(p).getByTestId('bb-log-row-0')).toHaveAttribute('data-input', '3');
    await root(p).getByTestId('bb-input-0').fill('5');
    await root(p).getByTestId('bb-run').click();
    await expect(root(p).getByTestId('bb-log-row-1')).toHaveAttribute('data-input', '5');
    await root(p).getByTestId('bb-test').click();
    await root(p).getByTestId('bb-predict-0').fill('1');
  });

  await expect(root(page).getByTestId('bb-log-row-0')).toHaveAttribute('data-input', '3');
  await expect(root(page).getByTestId('bb-log-row-1')).toHaveAttribute('data-input', '5');
  await expect(root(page).getByTestId('bb-status')).toHaveAttribute('data-phase', 'testing');
  await expect(root(page).getByTestId('bb-predict-0')).toHaveValue('1');
  await expect(root(page).getByTestId('bb-submit')).toBeVisible();
});

test('black-box: keyboard entry runs an experiment and repeated inputs are not logged twice', async ({ page }) => {
  await page.goto('/games/black-box');
  await page.getByTestId('new-game').click();
  const field = root(page).getByTestId('bb-input-0');
  await field.fill('7');
  await field.press('Enter');
  await expect(root(page).getByTestId('bb-log-row-0')).toHaveAttribute('data-input', '7');
  await field.press('Enter');
  await expect(root(page).locator('[data-testid^="bb-log-row-"]')).toHaveCount(1);
  await expect(root(page).getByTestId('bb-notice')).toBeVisible();
});
