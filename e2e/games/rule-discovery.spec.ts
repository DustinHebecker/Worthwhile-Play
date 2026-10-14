import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

const testTriple = async (page: Page, values: [string, string, string]) => {
  for (const [i, v] of values.entries()) await root(page).getByTestId(`rd-input-${i}`).fill(v);
  await root(page).getByTestId('rd-test').click();
};

test('rule-discovery: tests and an edited draft survive a reload', async ({ page }) => {
  let example = '';
  await expectResumeAfterReload(page, 'rule-discovery', async (p) => {
    example = (await root(p).getByTestId('rd-example').getAttribute('data-triple')) ?? '';
    await testTriple(p, ['20', '20', '19']);
    await expect(root(p).getByTestId('rd-log-row-0')).toHaveAttribute('data-triple', '20,20,19');
    await testTriple(p, ['1', '2', '3']);
    await expect(root(p).getByTestId('rd-log-row-1')).toHaveAttribute('data-triple', '1,2,3');
    await root(p).getByTestId('rd-input-0').fill('5');
  });

  await expect(root(page).getByTestId('rd-example')).toHaveAttribute('data-triple', example);
  await expect(root(page).getByTestId('rd-log-row-0')).toHaveAttribute('data-triple', '20,20,19');
  await expect(root(page).getByTestId('rd-log-row-1')).toHaveAttribute('data-triple', '1,2,3');
  await expect(root(page).getByTestId('rd-log-row-0')).toHaveAttribute('data-fits', /^(true|false)$/);
  await expect(root(page).getByTestId('rd-input-0')).toHaveValue('5');
  await expect(root(page).getByTestId('rd-status')).toHaveAttribute('data-phase', 'playing');
  await expect(root(page).getByTestId('rd-candidate-0')).toBeEnabled();
});

test('rule-discovery: Enter runs a test and repeated triples are not logged twice', async ({ page }) => {
  await page.goto('/games/rule-discovery');
  await page.getByTestId('new-game').click();
  const field = root(page).getByTestId('rd-input-2');
  await root(page).getByTestId('rd-input-0').fill('7');
  await root(page).getByTestId('rd-input-1').fill('7');
  await field.fill('7');
  await field.press('Enter');
  await expect(root(page).getByTestId('rd-log-row-0')).toHaveAttribute('data-triple', '7,7,7');
  await field.press('Enter');
  await expect(root(page).locator('[data-testid^="rd-log-row-"]')).toHaveCount(1);
  await expect(root(page).getByTestId('rd-notice')).toBeVisible();
});
