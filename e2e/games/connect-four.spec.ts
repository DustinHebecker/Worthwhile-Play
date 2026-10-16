import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';

const GAME = 'connect-four';

/** data-disc of all 42 cells, row 0 (top) first. */
const boardDiscs = (page: Page) =>
  Promise.all(Array.from({ length: 42 }, (_, i) => page.getByTestId(`cell-${Math.floor(i / 7)}-${i % 7}`).getAttribute('data-disc')));

const cells = (page: Page, disc: '1' | '2') => page.locator(`[data-testid^="cell-"][data-disc="${disc}"]`);

const HUMAN = { settings: { opponent: 'human' } };

async function startNewGame(page: Page, options: Parameters<typeof startGame>[2] = {}) {
  await startGame(page, GAME, options);
  await expect(page.getByTestId('game-root')).toBeVisible();
  await expect(page.getByTestId('column-3')).toBeVisible();
}

test('resumes after reload with the same board', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('column-3').click();
    // Default opponent is the computer: its reply is part of the same logical step.
    await expect(cells(p, '2')).toHaveCount(1);
    before = await boardDiscs(p);
  });
  await expect(page.getByTestId('cell-5-3')).toHaveAttribute('data-disc', '1');
  await expect(cells(page, '1')).toHaveCount(1);
  await expect(cells(page, '2')).toHaveCount(1);
  expect(await boardDiscs(page)).toEqual(before);
});

test('two people can play to a win, shown by highlighted discs', async ({ page }) => {
  await startNewGame(page, HUMAN);
  await expect(page.getByTestId('option-opponent')).toHaveCount(0);
  for (const c of [0, 1, 0, 1, 0, 1, 0]) await page.getByTestId(`column-${c}`).click();
  for (const r of [2, 3, 4, 5]) await expect(page.getByTestId(`cell-${r}-0`)).toHaveAttribute('data-winning', '');
  await expect(page.getByTestId('cell-5-1')).not.toHaveAttribute('data-winning', '');
  await expect(page.getByTestId('column-4')).toHaveAttribute('aria-disabled', 'true');
});

test('is playable with the keyboard', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('column-3').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('column-4')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cell-5-4')).toHaveAttribute('data-disc', '1');
});

test('fits a 360px-wide phone without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startNewGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await page.getByTestId('column-0').boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
});

/** data-disc of all cells of a cols × rows board, row 0 (top) first. */
const discsOf = (page: Page, cols: number, rows: number) =>
  Promise.all(Array.from({ length: cols * rows }, (_, i) => page.getByTestId(`cell-${Math.floor(i / cols)}-${i % cols}`).getAttribute('data-disc')));

test('plays and resumes five in a row on a 9 × 7 board', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(
    page,
    GAME,
    async (p) => {
      await expect(p.locator('[data-testid^="cell-"]')).toHaveCount(63);
      for (const c of [0, 0, 1, 1, 2, 2, 3, 3]) await p.getByTestId(`column-${c}`).click();
      // Four in a row is not enough here.
      await expect(p.getByTestId('cell-6-3')).toHaveAttribute('data-disc', '1');
      await expect(p.locator('[data-winning]')).toHaveCount(0);
      before = await discsOf(p, 9, 7);
    },
    { settings: { opponent: 'human', size: '9x7', goal: 5 } }
  );
  await expect(page.locator('[data-testid^="cell-"]')).toHaveCount(63);
  expect(await discsOf(page, 9, 7)).toEqual(before);
  await page.getByTestId('column-4').click();
  for (const c of [0, 1, 2, 3, 4]) await expect(page.getByTestId(`cell-6-${c}`)).toHaveAttribute('data-winning', '');
});

test('plays and resumes a pull-out game', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(
    page,
    GAME,
    async (p) => {
      for (const c of [0, 0, 1, 2]) await p.getByTestId(`column-${c}`).click();
      // Filled pulls its bottom disc out of column 1: the hollow disc above falls down.
      await p.getByTestId('action-pull').check();
      await expect(p.getByTestId('cell-5-0')).toHaveAttribute('data-pullable', '');
      await p.getByTestId('column-0').click();
      await expect(p.getByTestId('cell-5-0')).toHaveAttribute('data-disc', '2');
      await expect(p.getByTestId('cell-4-0')).toHaveAttribute('data-disc', '');
      await expect(p.getByTestId('action-drop')).toBeChecked();
      before = await discsOf(p, 7, 6);
    },
    { settings: { opponent: 'human', rule: 'pullOut' } }
  );
  expect(await discsOf(page, 7, 6)).toEqual(before);
  await expect(page.getByTestId('cell-5-0')).toHaveAttribute('data-disc', '2');
  await expect(page.getByTestId('help')).toBeVisible();
});

test('a 9-column board fits a 360px-wide phone as touching full-height column strips', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startNewGame(page, { settings: { size: '9x7' } });
  await expect(page.locator('[data-column]')).toHaveCount(9);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const boxes = await Promise.all(Array.from({ length: 9 }, (_, c) => page.getByTestId(`column-${c}`).boundingBox()));
  boxes.forEach((box, c) => {
    // Narrower than 44 px (9 × 44 px cannot fit), but each column is a tall strip, and the
    // strips touch: a press anywhere on the board hits exactly one column.
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(32);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(5 * 44);
    const previous = boxes[c - 1];
    if (previous && box) expect(Math.abs(box.x - (previous.x + previous.width))).toBeLessThan(1);
  });
});

test('the computer can move first at the chosen strength; strength and starter are hidden for two people', async ({ page }) => {
  await startNewGame(page, { difficulty: 'hard', settings: { opponent: 'computer', starter: 'computer', size: '8x7' } });
  await expect(page.locator('[data-column]')).toHaveCount(8);
  // The computer plays the filled discs and has already moved.
  await expect(cells(page, '1')).toHaveCount(1);
  await expect(cells(page, '2')).toHaveCount(0);
  await expect.poll(async () => ((await readSave(page, GAME)) as { state?: { difficulty: string; starter: string } } | undefined)?.state).toMatchObject({ difficulty: 'hard', starter: 'computer' });
  await page.getByTestId('new-game').click();
  await page.getByTestId('setting-opponent').locator('input[value="human"]').check();
  await expect(page.getByTestId('setting-starter')).toBeHidden();
  await expect(page.getByTestId('difficulty')).toBeHidden();
});
