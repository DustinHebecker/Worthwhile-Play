import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const factBoxes = (page: Page) => root(page).locator('input[data-testid^="as-fact-"]');

test('audience-switch: a checked selection for the first audience survives a reload', async ({ page }) => {
  let firstFact = '';
  await expectResumeAfterReload(page, 'audience-switch', async (p) => {
    // Tick the first two fact cards (whatever the seeded scenario is), continue, open with the first one and check.
    await expect(factBoxes(p).first()).toBeVisible();
    firstFact = ((await factBoxes(p).first().getAttribute('data-testid')) ?? '').replace('as-fact-', '');
    await factBoxes(p).nth(0).check();
    await factBoxes(p).nth(1).check();
    await expect(root(p).getByTestId('as-count')).toContainText('2');
    await root(p).getByTestId('as-continue').click();
    await root(p).getByTestId(`as-lead-${firstFact}`).check();
    await root(p).getByTestId('as-check-selection').click();
    await expect(root(p).getByTestId('as-round')).toHaveAttribute('data-step', 'message');
    await expect(root(p).getByTestId('as-feedback')).toBeVisible();
  });

  // After the reload the checked result is still shown, including the verdict for the opening fact.
  await expect(root(page).getByTestId('as-round')).toHaveAttribute('data-step', 'message');
  await expect(root(page).getByTestId('as-feedback')).toBeVisible();
  await expect(root(page).getByTestId(`as-verdict-${firstFact}`)).toHaveAttribute('data-verdict', /^(hit|extra|optional)$/);
  await expect(root(page).getByTestId('as-lead-result')).toBeVisible();
  await expect(root(page).locator('input[data-testid^="as-message-"]')).toHaveCount(3);
});

test('audience-switch: the whole first round works with the keyboard and the own version is kept', async ({ page }) => {
  await page.goto('/games/audience-switch');
  await page.getByTestId('new-game').click();
  const first = factBoxes(page).first();
  await first.focus();
  await page.keyboard.press('Space');
  await expect(first).toBeChecked();
  await root(page).getByTestId('as-continue').press('Enter');
  const lead = root(page).locator('input[data-testid^="as-lead-"]').first();
  await lead.focus();
  await page.keyboard.press('Space');
  await root(page).getByTestId('as-check-selection').press('Enter');
  const message = root(page).getByTestId('as-message-0');
  await message.focus();
  await page.keyboard.press('Space');
  await root(page).getByTestId('as-check-message').press('Enter');
  await expect(root(page).getByTestId('as-round')).toHaveAttribute('data-step', 'reflect');
  await root(page).getByTestId('as-draft').fill('My own short version.');
  await expect(root(page).getByTestId('as-model')).toBeVisible();
  // Wait until the autosave contains the draft before reloading.
  await expect.poll(async () => JSON.stringify(await readSave(page, 'audience-switch'))).toContain('My own short version.');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('as-draft')).toHaveValue('My own short version.');
});
