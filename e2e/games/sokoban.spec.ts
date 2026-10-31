import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const kinds = (page: Page) => root(page).locator('[data-testid^="tile-"]').evaluateAll((tiles) => tiles.map((t) => `${t.getAttribute('data-testid')}=${t.getAttribute('data-kind')}`));

test('sokoban: steps, a restart and its undo survive a reload', async ({ page }) => {
  let before: string[] = [];
  let moves: string | null = null;
  await expectResumeAfterReload(page, 'sokoban', async (p) => {
    // The level depends on the random seed, so try every direction: at least one step is always free.
    for (const direction of ['up', 'right', 'down', 'left', 'down', 'up']) await root(p).getByTestId(`move-${direction}`).click();
    await expect(root(p).getByTestId('moves')).not.toHaveAttribute('data-value', '0');
    await root(p).getByTestId('restart').click();
    await expect(root(p).getByTestId('moves')).toHaveAttribute('data-value', '0');
    await root(p).getByTestId('undo').click();
    await expect(root(p).getByTestId('moves')).not.toHaveAttribute('data-value', '0');
    moves = await root(p).getByTestId('moves').getAttribute('data-value');
    before = await kinds(p);
  });

  expect(await kinds(page)).toEqual(before);
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', moves ?? '');
  await expect(root(page).locator('[data-testid^="tile-"][data-kind="player"], [data-testid^="tile-"][data-kind="player-on-goal"]')).toHaveCount(1);
});

test('sokoban: a 7-wide hard level fits a 360 px phone with 44 px tiles and plays by keyboard and tap', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  // Hard level 6: ' ######|##.   #|#  $. #|#.$@#.#|# $#  #|# $   #|#  # ##|######' (player at row 4, column 4).
  await page.goto('/games/sokoban?seed=6&difficulty=hard');
  await expect(root(page).getByTestId('level-status')).toHaveText('Level 7 of 16');
  const first = await root(page).getByTestId('tile-0-0').boundingBox();
  const last = await root(page).getByTestId('tile-7-6').boundingBox();
  expect(first && last).toBeTruthy();
  expect(first!.width).toBeGreaterThanOrEqual(44);
  expect(first!.height).toBeGreaterThanOrEqual(44);
  expect(first!.x).toBeGreaterThanOrEqual(0);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const dpad = await root(page).getByTestId('move-up').boundingBox();
  expect(dpad!.width).toBeGreaterThanOrEqual(44);
  expect(dpad!.height).toBeGreaterThanOrEqual(44);

  // Keyboard: pushing the crate above the player.
  await expect(root(page).getByTestId('tile-3-3')).toHaveAttribute('data-kind', 'player');
  await root(page).getByTestId('board').focus();
  await page.keyboard.press('ArrowUp');
  await expect(root(page).getByTestId('tile-2-3')).toHaveAttribute('data-kind', 'player');
  await expect(root(page).getByTestId('tile-1-3')).toHaveAttribute('data-kind', 'box');
  await expect(root(page).getByTestId('pushes')).toHaveAttribute('data-value', '1');

  // Tap-to-walk to a free square, then undo the walk in one step.
  await root(page).getByTestId('tile-2-1').click();
  await expect(root(page).getByTestId('tile-2-1')).toHaveAttribute('data-kind', 'player');
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '3');
  await root(page).getByTestId('undo').click();
  await expect(root(page).getByTestId('tile-2-3')).toHaveAttribute('data-kind', 'player');
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', '1');
});

test('sokoban: a newly added level, chosen from the level list, resumes after a reload', async ({ page }) => {
  let before: string[] = [];
  await expectResumeAfterReload(page, 'sokoban', async (p) => {
    await root(p).getByTestId('level-select').selectOption('15');
    await root(p).getByTestId('level-play').click();
    await expect(root(p).getByTestId('level-status')).toHaveText('Level 16 of 16');
    for (const direction of ['up', 'right', 'down', 'left', 'down', 'up']) await root(p).getByTestId(`move-${direction}`).click();
    await expect(root(p).getByTestId('moves')).not.toHaveAttribute('data-value', '0');
    before = await kinds(p);
  });

  await expect(root(page).getByTestId('level-status')).toHaveText('Level 16 of 16');
  expect(await kinds(page)).toEqual(before);
});

/** Seed of expert level 1, whose board is 7 × 9 tiles — the largest size any level uses. */
const TALL_EXPERT = 0;

test('sokoban: the tallest expert level fits a 360 px phone in Arabic with 44 px tiles, and the board stays left-to-right', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/settings');
  await page.getByTestId('ui-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.goto(`/games/sokoban?seed=${TALL_EXPERT}&difficulty=expert`);
  await expect(root(page).getByTestId('board')).toHaveAttribute('dir', 'ltr');
  const tiles = root(page).locator('[data-testid^="tile-"]');
  await expect(tiles.last()).toHaveAttribute('data-testid', /^tile-8-/);
  const first = await tiles.first().boundingBox();
  const last = await tiles.last().boundingBox();
  expect(first && last).toBeTruthy();
  expect(first!.width).toBeGreaterThanOrEqual(44);
  expect(first!.height).toBeGreaterThanOrEqual(44);
  expect(first!.x).toBeGreaterThanOrEqual(0);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  // Row 0 starts at the left edge even though the page is right-to-left.
  expect(first!.x).toBeLessThan(last!.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const direction of ['up', 'right', 'down', 'left']) await root(page).getByTestId(`move-${direction}`).click();
  await expect(root(page).getByTestId('moves')).not.toHaveAttribute('data-value', '0');
});
