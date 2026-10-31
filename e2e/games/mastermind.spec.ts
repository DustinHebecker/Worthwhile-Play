import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

/** The secret of the running game, read from its save (the new game is saved right after it starts). */
async function secretOf(page: Page): Promise<number[]> {
  let secret: number[] | undefined;
  await expect
    .poll(async () => {
      secret = ((await readSave(page, 'mastermind')) as { state?: { secret?: number[] } } | undefined)?.state?.secret;
      return Array.isArray(secret);
    })
    .toBe(true);
  return secret as number[];
}

let firstGuess: number[] = [];

test('mastermind: submitted guesses and an unfinished draft survive a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'mastermind', async (p) => {
    const slots = root(p).locator('[data-testid^="mm-slot-"]');
    const positions = await slots.count();
    // A complete guess using distinct symbols (valid on every difficulty) that is not the secret: a first guess
    // that happens to win (1 in 1296 on the default difficulty) would end the game and remove the palette.
    firstGuess = Array.from({ length: positions }, (_, i) => i);
    if ((await secretOf(p)).join(',') === firstGuess.join(',')) firstGuess = [1, 0, ...firstGuess.slice(2)];
    for (const symbol of firstGuess) await root(p).getByTestId(`mm-palette-${symbol}`).click();
    await root(p).getByTestId('mm-submit').click();
    await expect(root(p).getByTestId('mm-guess-0')).toBeVisible();
    // ... followed by a half-entered draft, which must not be lost when the app closes.
    await root(p).getByTestId('mm-palette-1').click();
    await root(p).getByTestId('mm-palette-2').click();
  });

  await expect(root(page).getByTestId('mm-guess-0')).toHaveAttribute('data-code', firstGuess.join(','));
  await expect(root(page).getByTestId('mm-slot-0')).toHaveAttribute('data-symbol', '1');
  await expect(root(page).getByTestId('mm-slot-1')).toHaveAttribute('data-symbol', '2');
  await expect(root(page).getByTestId('mm-slot-2')).toHaveAttribute('data-symbol', '');
});

test('mastermind: keyboard entry works and incomplete guesses are not submitted', async ({ page }) => {
  await startGame(page, 'mastermind');
  await root(page).getByTestId('mm-slot-0').focus();
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await expect(root(page).locator('[data-testid^="mm-guess-"]')).toHaveCount(0);
  await expect(root(page).getByTestId('mm-check-result')).toBeVisible();
  await page.keyboard.press('Backspace');
  await expect(root(page).getByTestId('mm-slot-0')).toHaveAttribute('data-symbol', '');
});
