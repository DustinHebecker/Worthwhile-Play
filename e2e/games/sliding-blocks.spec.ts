import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const movesValue = async (page: Page) => Number(await root(page).getByTestId('moves').getAttribute('data-value'));
/** Every block's id and current top-left cell. */
const positions = (page: Page) =>
  root(page)
    .locator('[data-testid^="block-"]')
    .evaluateAll((blocks) => blocks.map((b) => `${b.getAttribute('data-testid')}@${b.getAttribute('data-row')},${b.getAttribute('data-col')}`));

test('sliding-blocks: moves, a restart and its undo survive a reload', async ({ page }) => {
  let before: string[] = [];
  let moves = 0;
  await expectResumeAfterReload(page, 'sliding-blocks', async (p) => {
    // The puzzle depends on the random seed: select blocks in turn and try each slide button
    // until two blocks have moved.
    const blocks = root(p).locator('[data-testid^="block-"]');
    const count = await blocks.count();
    for (let i = 0; i < count && (await movesValue(p)) < 2; i++) {
      await blocks.nth(i).click();
      for (const dir of ['up', 'down', 'left', 'right']) {
        const button = root(p).getByTestId(`slide-${dir}`);
        if (await button.isDisabled()) continue;
        const previous = await movesValue(p);
        await button.click();
        if ((await movesValue(p)) > previous) break;
      }
    }
    expect(await movesValue(p)).toBeGreaterThan(0);
    const moved = await positions(p);
    await root(p).getByTestId('restart').click();
    await expect(root(p).getByTestId('moves')).toHaveAttribute('data-value', '0');
    await root(p).getByTestId('undo').click();
    await expect(root(p).getByTestId('moves')).not.toHaveAttribute('data-value', '0');
    expect(await positions(p)).toEqual(moved);
    before = moved;
    moves = await movesValue(p);
  });

  expect(await positions(page)).toEqual(before);
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', String(moves));
  await expect(root(page).getByTestId('block-0')).toHaveText('★');
});

test('sliding-blocks: fits a 360 px phone and is solved by keyboard, drag, tap and buttons', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  // Easy puzzle 1 (optimum 4):        ids: x = 0 (★), then a, b, c, … = 1, 2, 3, … by first appearance
  //   . a . . b b
  //   c a d d e f      solution: b (2) left 2, e (5) up 1, f (6) up 1, ★ right 2
  //   c g x x e f   →  exit on the right of row 3
  //   . g h h i i
  //   . j j j k k
  //   . . l l m m
  await page.goto('/games/sliding-blocks?seed=0&difficulty=easy');
  const board = root(page).getByTestId('sb-board');
  await expect(board).toBeVisible();

  // Layout: ≥ 48 px cells, the whole board on screen, no horizontal scrolling.
  const first = await root(page).getByTestId('cell-0-0').boundingBox();
  const last = await root(page).getByTestId('cell-5-5').boundingBox();
  const exit = await root(page).getByTestId('sb-exit').boundingBox();
  expect(first && last && exit).toBeTruthy();
  expect(first!.width).toBeGreaterThanOrEqual(48);
  expect(first!.height).toBeGreaterThanOrEqual(48);
  expect(first!.x).toBeGreaterThanOrEqual(0);
  expect(exit!.x + exit!.width).toBeLessThanOrEqual(360);
  expect(exit!.x).toBeGreaterThanOrEqual(last!.x + last!.width - 1);
  // The exit sits in the star block's row.
  const star = await root(page).getByTestId('block-0').boundingBox();
  expect(Math.abs(exit!.y + exit!.height / 2 - (star!.y + star!.height / 2))).toBeLessThan(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const dir of ['up', 'left', 'right', 'down']) {
    const box = await root(page).getByTestId(`slide-${dir}`).boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await expect(root(page).getByTestId('block-0')).toHaveAttribute('data-row', '2');
  await expect(root(page).getByTestId('block-0')).toHaveAttribute('data-col', '2');
  await expect(root(page).getByTestId('block-2')).toHaveAttribute('data-orient', 'h');
  await expect(root(page).getByTestId('block-5')).toHaveAttribute('data-orient', 'v');
  await expect(root(page).getByTestId('block-10')).toHaveAttribute('data-len', '3');

  // 1. Keyboard: arrow keys reach block b, Enter selects it, two presses slide it as one move.
  await root(page).getByTestId('block-0').focus();
  await page.keyboard.press('ArrowUp');
  await expect(root(page).getByTestId('block-4')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  await expect(root(page).getByTestId('block-2')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(root(page).getByTestId('block-2')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(root(page).getByTestId('block-2')).toHaveAttribute('data-col', '2');
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '1');
  await page.keyboard.press('Escape');

  // 2. Drag: block e one cell up.
  const e = (await root(page).getByTestId('block-5').boundingBox())!;
  await page.mouse.move(e.x + e.width / 2, e.y + e.height / 2);
  await page.mouse.down();
  await page.mouse.move(e.x + e.width / 2, e.y + e.height / 2 - first!.height / 2, { steps: 4 });
  await page.mouse.move(e.x + e.width / 2, e.y + e.height / 2 - first!.height, { steps: 4 });
  await page.mouse.up();
  await expect(root(page).getByTestId('block-5')).toHaveAttribute('data-row', '0');
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '2');

  // 3. Tap: block f, then the free square above it.
  await root(page).getByTestId('block-6').click();
  await root(page).getByTestId('cell-0-5').click();
  await expect(root(page).getByTestId('block-6')).toHaveAttribute('data-row', '0');
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '3');
  await expect(root(page).getByTestId('status')).toBeHidden();

  // 4. Buttons: the star block to the exit; moves vs optimum appear only now.
  await root(page).getByTestId('block-0').click();
  await root(page).getByTestId('slide-right').click();
  await root(page).getByTestId('slide-right').click();
  await expect(root(page).getByTestId('block-0')).toHaveAttribute('data-col', '4');
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '4');
  await expect(root(page).getByTestId('status')).toContainText('Your moves: 4. Fewest possible: 4.');
  await expect(page.getByTestId('finished')).toBeVisible();
});
