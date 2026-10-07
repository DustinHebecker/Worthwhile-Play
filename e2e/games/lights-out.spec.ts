// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const lights = (page: Page) => root(page).locator('[data-testid^="cell-"]').evaluateAll((cells) => cells.map((c) => c.getAttribute('data-on')));

test('lights-out: presses, an undo and a hint survive a reload', async ({ page }) => {
  let before: (string | null)[] = [];
  let hinted: string | null = null;
  await expectResumeAfterReload(page, 'lights-out', async (p) => {
    await root(p).getByTestId('cell-0-0').click();
    await root(p).getByTestId('cell-1-1').click();
    await root(p).getByTestId('undo').click();
    await root(p).getByTestId('cell-2-1').click();
    await root(p).getByTestId('hint').click();
    await expect(root(p).locator('[data-hint="true"]')).toHaveCount(1);
    hinted = await root(p).locator('[data-hint="true"]').getAttribute('data-testid');
    before = await lights(p);
  });

  expect(await lights(page)).toEqual(before);
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '2');
  await expect(root(page).locator('[data-hint="true"]')).toHaveCount(1);
  await expect(root(page).locator('[data-hint="true"]')).toHaveAttribute('data-testid', hinted ?? '');
  await expect(root(page).getByTestId('hints-used')).toContainText('1');
});

test('lights-out: the 7×7 board fits a 360 px phone with 44 px cells and works by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/lights-out');
  await page.getByTestId('difficulty').selectOption('hard');
  await page.getByTestId('new-game').click();
  const cells = root(page).locator('[data-testid^="cell-"]');
  await expect(cells).toHaveCount(49);

  const last = await root(page).getByTestId('cell-6-6').boundingBox();
  const first = await root(page).getByTestId('cell-0-0').boundingBox();
  expect(first && last).toBeTruthy();
  expect(first!.width).toBeGreaterThanOrEqual(44);
  expect(first!.height).toBeGreaterThanOrEqual(44);
  expect(first!.x).toBeGreaterThanOrEqual(0);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  // Keyboard: move right and press with Enter, which toggles the cell.
  const target = root(page).getByTestId('cell-0-1');
  const was = await target.getAttribute('data-on');
  await root(page).getByTestId('cell-0-0').focus();
  await page.keyboard.press('ArrowRight');
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(target).toHaveAttribute('data-on', was === 'true' ? 'false' : 'true');
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '1');
});
