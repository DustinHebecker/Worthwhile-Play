import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('deep-read: an answered question and its explanation survive a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'deep-read', async (p) => {
    await expect(root(p).getByTestId('dr-reading')).toBeVisible();
    await root(p).getByTestId('dr-done-reading').click();
    await root(p).getByTestId('dr-option-a').click();
    await root(p).getByTestId('dr-check').click();
    await expect(root(p).getByTestId('dr-feedback')).toHaveAttribute('data-answer', 'a');
  });

  // The restored game shows the same answered question with its feedback and explanations.
  const feedback = root(page).getByTestId('dr-feedback');
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveAttribute('data-answer', 'a');
  await expect(root(page).getByTestId('dr-question')).toHaveAttribute('data-question', 'q1');
  await expect(root(page).getByTestId('dr-explain-a')).toHaveAttribute('data-chosen', 'true');
  await expect(root(page).locator('[data-gold="true"]')).toHaveCount(1);
  await expect(root(page).getByTestId('dr-see')).toBeVisible();
  await expect(root(page).getByTestId('dr-next')).toBeVisible();
});

test('deep-read: the text can be re-opened while answering and is noted as looked back', async ({ page }) => {
  await page.goto('/games/deep-read');
  await page.getByTestId('new-game').click();
  await root(page).getByTestId('dr-done-reading').click();
  await expect(root(page).getByTestId('dr-text')).toHaveCount(0);
  await root(page).getByTestId('dr-toggle-text').click();
  await expect(root(page).getByTestId('dr-text')).toBeVisible();
  await root(page).getByTestId('dr-option-b').click();
  await root(page).getByTestId('dr-check').click();
  await expect(root(page).getByTestId('dr-looked-back')).toBeVisible();
});
