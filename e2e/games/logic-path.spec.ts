import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const robot = async (page: Page) => {
  const el = root(page).getByTestId('lp-robot');
  return [await el.getAttribute('data-row'), await el.getAttribute('data-col'), await el.getAttribute('data-dir')].join(',');
};
const programText = (page: Page) => root(page).locator('[data-testid^="prog-"]').evaluateAll((els) => els.map((e) => `${e.getAttribute('data-testid')}=${e.textContent}`));

test('logic-path: a built program, its undo history and the shown run survive a reload', async ({ page }) => {
  let before: string[] = [];
  let robotBefore = '';
  let statusBefore: string | null = null;
  await expectResumeAfterReload(page, 'logic-path', async (p) => {
    await root(p).getByTestId('cmd-forward').click();
    await root(p).getByTestId('cmd-right').click();
    await root(p).getByTestId('cmd-forward').click();
    await root(p).getByTestId('prog-2').click();
    await root(p).getByTestId('lp-undo').click();
    await expect(root(p).getByTestId('lp-count')).toHaveAttribute('data-value', '3');
    await root(p).getByTestId('lp-run').click();
    // Wait for the (optional) animation to finish; the outcome depends on the random level.
    await expect(root(p).getByTestId('lp-status')).not.toHaveAttribute('data-state', /running|idle/);
    before = await programText(p);
    robotBefore = await robot(p);
    statusBefore = await root(p).getByTestId('lp-status').getAttribute('data-state');
  });

  expect(await programText(page)).toEqual(before);
  expect(await robot(page)).toBe(robotBefore);
  await expect(root(page).getByTestId('lp-status')).toHaveAttribute('data-state', statusBefore ?? '');
  await expect(root(page).getByTestId('lp-runs')).toHaveAttribute('data-value', '1');
});

test('logic-path: a 7×7 level fits a 360 px phone with 44 px controls', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/logic-path?seed=7&difficulty=hard');
  await expect(root(page).getByTestId('lp-level')).toHaveText('Level 8 of 8');
  const first = await root(page).getByTestId('cell-0-0').boundingBox();
  const last = await root(page).getByTestId('cell-6-6').boundingBox();
  expect(first && last).toBeTruthy();
  expect(first!.x).toBeGreaterThanOrEqual(0);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const id of ['cmd-forward', 'cmd-if', 'cmd-repeat', 'lp-run']) {
    const box = await root(page).getByTestId(id).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  await expect(root(page).getByTestId('cell-0-0')).toHaveAttribute('data-kind', 'star');
});

test('logic-path: a level can be solved by tapping commands and running', async ({ page }) => {
  // Easy level 1: ['.....', '>...G', '.....'] — four forwards reach the flag.
  await page.goto('/games/logic-path?seed=0&difficulty=easy');
  await expect(root(page).getByTestId('lp-robot')).toHaveAttribute('data-col', '0');
  for (let k = 0; k < 4; k++) await root(page).getByTestId('cmd-forward').click();
  await root(page).getByTestId('lp-run').click();
  await expect(root(page).getByTestId('lp-status')).toHaveAttribute('data-state', 'goal');
  await expect(root(page).getByTestId('lp-robot')).toHaveAttribute('data-col', '4');
  await expect(root(page).getByTestId('lp-robot')).toHaveAttribute('data-dir', 'right');
});
