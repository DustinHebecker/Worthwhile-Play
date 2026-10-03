import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('mastermind: submitted guesses and an unfinished draft survive a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'mastermind', async (p) => {
    const slots = root(p).locator('[data-testid^="mm-slot-"]');
    const positions = await slots.count();
    // A complete guess using distinct symbols (valid on every difficulty) ...
    for (let i = 0; i < positions; i++) await root(p).getByTestId(`mm-palette-${i}`).click();
    await root(p).getByTestId('mm-submit').click();
    await expect(root(p).getByTestId('mm-guess-0')).toBeVisible();
    // ... followed by a half-entered draft, which must not be lost when the app closes.
    await root(p).getByTestId('mm-palette-1').click();
    await root(p).getByTestId('mm-palette-2').click();
  });

  const positions = await root(page).locator('[data-testid^="mm-slot-"]').count();
  const firstGuess = Array.from({ length: positions }, (_, i) => i).join(',');
  await expect(root(page).getByTestId('mm-guess-0')).toHaveAttribute('data-code', firstGuess);
  await expect(root(page).getByTestId('mm-slot-0')).toHaveAttribute('data-symbol', '1');
  await expect(root(page).getByTestId('mm-slot-1')).toHaveAttribute('data-symbol', '2');
  await expect(root(page).getByTestId('mm-slot-2')).toHaveAttribute('data-symbol', '');
});

test('mastermind: keyboard entry works and incomplete guesses are not submitted', async ({ page }) => {
  await page.goto('/games/mastermind');
  await page.getByTestId('new-game').click();
  await root(page).getByTestId('mm-slot-0').focus();
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await expect(root(page).locator('[data-testid^="mm-guess-"]')).toHaveCount(0);
  await expect(root(page).getByTestId('mm-check-result')).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(root(page).getByTestId('mm-slot-0')).toHaveAttribute('data-symbol', '');
});
