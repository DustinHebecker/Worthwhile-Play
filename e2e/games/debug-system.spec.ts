import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('debug-system: step position, suspected rule and chosen fix survive a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'debug-system', async (p) => {
    await root(p).getByTestId('ds-step').click();
    await root(p).getByTestId('ds-step').click();
    await expect(root(p).getByTestId('ds-position')).toHaveAttribute('data-cursor', '2');
    await root(p).getByTestId('ds-rule-0').click();
    await root(p).getByTestId('ds-fix-1').click();
    await expect(root(p).getByTestId('ds-fix-1')).toHaveAttribute('aria-pressed', 'true');
  });

  await expect(root(page).getByTestId('ds-position')).toHaveAttribute('data-cursor', '2');
  await expect(root(page).getByTestId('ds-rule-0')).toHaveAttribute('aria-pressed', 'true');
  await expect(root(page).getByTestId('ds-fix-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(root(page).getByTestId('ds-status')).toHaveAttribute('data-phase', 'choose');
});

test('debug-system: trying fixes eventually repairs the machine and all tests pass', async ({ page }) => {
  await page.goto('/games/debug-system');
  await page.getByTestId('new-game').click();
  const r = root(page);
  await expect(r.getByTestId('ds-test-0')).toHaveAttribute('data-pass', 'false');
  const ruleCount = await r.locator('[data-testid^="ds-rule-"]').count();
  let solved = false;
  for (let i = 0; i < ruleCount && !solved; i++) {
    for (let j = 0; j < 4 && !solved; j++) {
      await r.getByTestId(`ds-rule-${i}`).click();
      await r.getByTestId(`ds-fix-${j}`).click();
      await r.getByTestId('ds-check').click();
      solved = (await r.getByTestId('ds-status').getAttribute('data-phase')) === 'solved';
    }
  }
  expect(solved).toBe(true);
  await expect(r.getByTestId('ds-test-0')).toHaveAttribute('data-pass', 'true');
});
