import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const selects = (page: Page) => root(page).locator('select[data-testid^="bg-select-"]');

/** Sorts every card of the seeded inbox: the first two into "Relevant facts", the rest into "Leave out". */
async function sortAll(page: Page) {
  await expect(selects(page).first()).toBeVisible();
  const count = await selects(page).count();
  for (let i = 0; i < count; i++) await selects(page).nth(i).selectOption(i < 2 ? 'facts' : 'leave');
  await expect(root(page).getByTestId('bg-count')).toContainText(String(count));
}

test('briefing-game: a checked sorting survives a reload', async ({ page }) => {
  let firstCard = '';
  await expectResumeAfterReload(page, 'briefing-game', async (p) => {
    // An incomplete sorting is not checked yet.
    await expect(selects(p).first()).toBeVisible();
    firstCard = ((await selects(p).first().getAttribute('data-testid')) ?? '').replace('bg-select-', '');
    await selects(p).first().selectOption('facts');
    await root(p).getByTestId('bg-check-sort').click();
    await expect(root(p).getByTestId('bg-notice')).toBeVisible();
    await sortAll(p);
    await root(p).getByTestId('bg-check-sort').click();
    await expect(root(p).getByTestId('bg-step')).toHaveAttribute('data-step', 'decide');
    await expect(root(p).getByTestId('bg-feedback')).toBeVisible();
  });

  // After the reload the checked result is still shown, card by card.
  await expect(root(page).getByTestId('bg-step')).toHaveAttribute('data-step', 'decide');
  await expect(root(page).getByTestId('bg-feedback')).toBeVisible();
  await expect(root(page).getByTestId(`bg-verdict-${firstCard}`)).toHaveAttribute('data-verdict', /^(correct|wrong)$/);
  await expect(root(page).getByTestId('bg-feedback-summary')).toBeVisible();
  await expect(root(page).locator('input[data-testid^="bg-decision-"]')).toHaveCount(3);
});

test('briefing-game: decision, next action and own notes work with the keyboard and are kept', async ({ page }) => {
  await page.goto('/games/briefing-game');
  await page.getByTestId('new-game').click();
  await sortAll(page);
  await root(page).getByTestId('bg-check-sort').press('Enter');
  const decision = root(page).getByTestId('bg-decision-0');
  await decision.focus();
  await page.keyboard.press('Space');
  await expect(decision).toBeChecked();
  const action = root(page).getByTestId('bg-action-1');
  await action.focus();
  await page.keyboard.press('Space');
  await root(page).getByTestId('bg-check-choices').press('Enter');
  await expect(root(page).getByTestId('bg-step')).toHaveAttribute('data-step', 'review');
  await expect(root(page).getByTestId('bg-model')).toBeVisible();
  await expect(root(page).getByTestId('bg-yours')).toBeVisible();
  await root(page).getByTestId('bg-notes').fill('My own short briefing.');
  // Wait until the autosave contains the notes before reloading.
  await expect.poll(async () => JSON.stringify(await readSave(page, 'briefing-game'))).toContain('My own short briefing.');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('bg-notes')).toHaveValue('My own short briefing.');
  await root(page).getByTestId('bg-finish').click();
  await expect(root(page).getByTestId('bg-summary')).toBeVisible();
});
