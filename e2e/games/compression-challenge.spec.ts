import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const sentenceBoxes = (page: Page) => root(page).locator('input[data-testid^="cc-sentence-"]');

test('compression-challenge: a checked first step survives a reload with its feedback', async ({ page }) => {
  let firstSentence = '';
  await expectResumeAfterReload(page, 'compression-challenge', async (p) => {
    // Tick the first two sentences (whatever the seeded piece is) and check step 1.
    await expect(sentenceBoxes(p).first()).toBeVisible();
    firstSentence = ((await sentenceBoxes(p).nth(1).getAttribute('data-testid')) ?? '').replace('cc-sentence-', '');
    await sentenceBoxes(p).nth(0).check();
    await sentenceBoxes(p).nth(1).check();
    await expect(root(p).getByTestId('cc-count')).toContainText('2');
    await root(p).getByTestId('cc-check').click();
    await expect(root(p).getByTestId('cc-step')).toHaveAttribute('data-checked', 'true');
    await expect(root(p).getByTestId('cc-core-feedback')).toBeVisible();
  });

  // After the reload the checked result is still shown, including the verdict for a ticked sentence.
  await expect(root(page).getByTestId('cc-step')).toHaveAttribute('data-step', 'core');
  await expect(root(page).getByTestId('cc-step')).toHaveAttribute('data-checked', 'true');
  await expect(root(page).getByTestId('cc-core-result')).toBeVisible();
  await expect(root(page).getByTestId(`cc-verdict-${firstSentence}`)).toHaveAttribute('data-verdict', /^(hit|extra)$/);
  await expect(root(page).getByTestId('cc-next')).toBeVisible();
});

test('compression-challenge: steps 1–3 work with the keyboard and the own sentence is kept', async ({ page }) => {
  await page.goto('/games/compression-challenge');
  await page.getByTestId('new-game').click();
  const first = sentenceBoxes(page).first();
  await first.focus();
  await page.keyboard.press('Space');
  await expect(first).toBeChecked();
  await root(page).getByTestId('cc-check').press('Enter');
  await root(page).getByTestId('cc-next').press('Enter');
  await expect(root(page).getByTestId('cc-step')).toHaveAttribute('data-step', 'bullets');
  for (const i of [0, 1, 2]) {
    const bullet = root(page).getByTestId(`cc-bullet-${i}`);
    await bullet.focus();
    await page.keyboard.press('Space');
    await expect(root(page).getByTestId(`cc-bullet-${i}`)).toBeChecked();
  }
  await root(page).getByTestId('cc-check').press('Enter');
  await root(page).getByTestId('cc-next').press('Enter');
  const option = root(page).getByTestId('cc-summary-0');
  await option.focus();
  await page.keyboard.press('Space');
  await root(page).getByTestId('cc-check').press('Enter');
  await expect(root(page).getByTestId('cc-model')).toBeVisible();
  await root(page).getByTestId('cc-draft').fill('My own short version.');
  await expect(root(page).getByTestId('cc-draft-count')).toContainText('4');
  await expect.poll(async () => JSON.stringify(await readSave(page, 'compression-challenge'))).toContain('My own short version.');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('cc-draft')).toHaveValue('My own short version.');
});
