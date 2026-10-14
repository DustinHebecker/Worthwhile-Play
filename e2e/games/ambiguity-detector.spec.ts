import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('ambiguity-detector: a checked message keeps its result after a reload', async ({ page }) => {
  // The default difficulty (easy) offers the five everyday dimensions.
  let item = '';
  await expectResumeAfterReload(page, 'ambiguity-detector', async (p) => {
    item = (await root(p).getByTestId('ad-message').getAttribute('data-item')) ?? '';
    await root(p).getByTestId('ad-dim-what').check();
    await root(p).getByTestId('ad-dim-when').check();
    await root(p).getByTestId('ad-note').fill('Which one do you mean?');
    await root(p).getByTestId('ad-check').click();
    await expect(root(p).getByTestId('ad-feedback')).toBeVisible();
  });

  await expect(root(page).getByTestId('ad-message')).toHaveAttribute('data-item', item);
  await expect(root(page).getByTestId('ad-progress')).toHaveAttribute('data-index', '0');
  await expect(root(page).getByTestId('ad-feedback')).toBeVisible();
  await expect(root(page).getByTestId('ad-row-what')).toHaveAttribute('data-verdict', /^(hit|extra)$/);
  await expect(root(page).getByTestId('ad-row-when')).toHaveAttribute('data-verdict', /^(hit|extra)$/);
  await expect(root(page).getByTestId('ad-dim-what')).toBeChecked();
  await expect(root(page).getByTestId('ad-dim-what')).toBeDisabled();
  await expect(root(page).getByTestId('ad-yours')).toContainText('Which one do you mean?');
  await expect(root(page).getByTestId('ad-reply-clear')).toBeVisible();
});

test('ambiguity-detector: choosing a reply reveals the best one and moves on by keyboard', async ({ page }) => {
  await page.goto('/games/ambiguity-detector');
  await page.getByTestId('new-game').click();
  const first = root(page).getByTestId('ad-dim-what');
  await first.focus();
  await page.keyboard.press('Space');
  await expect(first).toBeChecked();
  await root(page).getByTestId('ad-check').click();
  await root(page).getByTestId('ad-reply-vague').click();
  await expect(root(page).getByTestId('ad-reply-vague')).toHaveAttribute('data-chosen', 'true');
  await expect(root(page).getByTestId('ad-reply-clear')).toContainText('✓');
  await expect(root(page).getByTestId('ad-next')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(root(page).getByTestId('ad-progress')).toHaveAttribute('data-index', '1');
});
