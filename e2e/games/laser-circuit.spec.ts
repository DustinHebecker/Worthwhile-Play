import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const cells = (page: Page) =>
  root(page)
    .locator('[data-testid^="cell-"]')
    .evaluateAll((list) =>
      list.map((c) => [c.getAttribute('data-testid'), c.getAttribute('data-element'), c.getAttribute('data-lit'), c.getAttribute('data-orient'), c.getAttribute('data-placed')].join(':'))
    );

test('laser-circuit: placed and turned pieces survive a reload', async ({ page }) => {
  let before: string[] = [];
  let moves: string | null = null;
  await expectResumeAfterReload(page, 'laser-circuit', async (p) => {
    // The level depends on the random seed; every level has at least one piece and empty squares.
    await root(p).locator('[data-testid^="inv-"]').first().click();
    const empty = root(p).locator('[data-testid^="cell-"][data-element="empty"]').first();
    const id = (await empty.getAttribute('data-testid')) ?? '';
    await empty.click();
    await expect(root(p).getByTestId(id)).toHaveAttribute('data-placed', 'true');
    await root(p).getByTestId(id).click();
    await expect(root(p).getByTestId('moves')).not.toHaveAttribute('data-value', '0');
    moves = await root(p).getByTestId('moves').getAttribute('data-value');
    before = await cells(p);
  });

  expect(await cells(page)).toEqual(before);
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', moves ?? '');
  await expect(root(page).locator('[data-testid^="cell-"][data-placed="true"]')).toHaveCount(1);
});

test('laser-circuit: a 7×7 hard level fits a 360 px phone with 44 px squares and can be solved by tapping', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  // Hard level 8: four splitters; the unique solution is S\ at (2,3) and (3,4), S/ at (4,1) and (4,4).
  await page.goto('/games/laser-circuit?seed=7&difficulty=hard');
  await expect(root(page).getByTestId('level-status')).toHaveText('Level 8 of 8');
  const first = await root(page).getByTestId('cell-0-0').boundingBox();
  const last = await root(page).getByTestId('cell-6-6').boundingBox();
  expect(first && last).toBeTruthy();
  expect(first!.width).toBeGreaterThanOrEqual(44);
  expect(first!.height).toBeGreaterThanOrEqual(44);
  expect(first!.x).toBeGreaterThanOrEqual(0);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await expect(root(page).getByTestId('inv-splitter')).toHaveAttribute('data-count', '4');

  const tap = (r: number, c: number) => root(page).getByTestId(`cell-${r}-${c}`).click();
  await tap(1, 2);
  await tap(1, 2); // turn to \
  await tap(2, 3);
  await tap(2, 3);
  await tap(3, 0);
  await tap(3, 3);
  await expect(root(page).getByTestId('inv-splitter')).toHaveAttribute('data-count', '0');
  await expect(root(page).getByTestId('cell-2-5')).toHaveAttribute('data-lit', 'W');
  await expect(root(page).getByTestId('cell-6-0')).toHaveAttribute('data-lit', 'W');
  await expect(root(page).getByTestId('status')).toHaveAttribute('data-state', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('laser-circuit: keyboard play places, turns and takes back a piece', async ({ page }) => {
  // Easy level 1: a mirror / at row 4, column 2 sends the red beam onto the target.
  await page.goto('/games/laser-circuit?seed=0&difficulty=easy');
  await expect(root(page).getByTestId('level-status')).toHaveText('Level 1 of 8');
  await root(page).getByTestId('cell-0-0').focus();
  for (const key of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight']) await page.keyboard.press(key);
  await expect(root(page).getByTestId('cell-3-1')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('p');
  await expect(root(page).getByTestId('cell-2-1')).toHaveAttribute('data-element', 'mirror');
  await expect(root(page).getByTestId('cell-2-0')).toHaveAttribute('data-lit', 'R');
  await page.keyboard.press('r');
  await expect(root(page).getByTestId('cell-2-1')).toHaveAttribute('data-orient', '1');
  await page.keyboard.press('Delete');
  await expect(root(page).getByTestId('cell-2-1')).toHaveAttribute('data-element', 'empty');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('p');
  await expect(root(page).getByTestId('cell-3-0')).toHaveAttribute('data-lit', 'R');
  await expect(root(page).getByTestId('status')).toHaveAttribute('data-state', 'solved');
});
