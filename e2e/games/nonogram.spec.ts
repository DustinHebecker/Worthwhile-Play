import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame, newGame } from '../../packages/testing/src/e2e';

interface SavedNonogram {
  size: number;
  solution: number[];
  cells: number[];
  mode: 'fill' | 'cross';
}

const STATES = ['unknown', 'filled', 'crossed'] as const;
const root = (page: Page) => page.getByTestId('game-root');
const cell = (page: Page, r: number, c: number) => root(page).getByTestId(`cell-${r}-${c}`);
const saved = async (page: Page) => ((await readSave(page, 'nonogram')) as { state: SavedNonogram }).state;

test('nonogram: filled and crossed cells survive a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'nonogram', async (p) => {
    await cell(p, 0, 0).click();
    await expect(cell(p, 0, 0)).toHaveAttribute('data-state', 'filled');
    await root(p).getByTestId('ng-mode-cross').click();
    await cell(p, 1, 2).click();
    await expect(cell(p, 1, 2)).toHaveAttribute('data-state', 'crossed');
  });

  // The restored board visibly matches the saved logical state, cell by cell.
  const state = await saved(page);
  expect(state.mode).toBe('cross');
  await expect(cell(page, 0, 0)).toHaveAttribute('data-state', 'filled');
  await expect(cell(page, 1, 2)).toHaveAttribute('data-state', 'crossed');
  for (let i = 0; i < state.cells.length; i++) {
    const [r, c] = [Math.floor(i / state.size), i % state.size];
    await expect(cell(page, r, c)).toHaveAttribute('data-state', STATES[state.cells[i] as number] as string);
  }
  await expect(root(page).getByTestId('row-clue-0')).toBeVisible();
  await expect(root(page).getByTestId(`col-clue-${state.size - 1}`)).toBeVisible();
  await expect(root(page).getByTestId('ng-mode-cross')).toHaveAttribute('aria-pressed', 'true');
});

test('nonogram: keyboard play and solving the puzzle ends the game calmly', async ({ page }) => {
  await startGame(page, 'nonogram', { difficulty: 'easy' });
  const first = cell(page, 0, 0);
  await first.focus();
  await page.keyboard.press('x');
  await expect(first).toHaveAttribute('data-state', 'crossed');
  await page.keyboard.press('Backspace');
  await expect(first).toHaveAttribute('data-state', 'unknown');
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 0, 1)).toBeFocused();

  // Fill one cell so a save exists, then read the recorded puzzle and complete it.
  await page.keyboard.press('Space');
  await expect(cell(page, 0, 1)).toHaveAttribute('data-state', 'filled');
  await expect.poll(async () => (await readSave(page, 'nonogram')) !== undefined).toBe(true);
  const state = await saved(page);
  for (let i = 0; i < state.solution.length; i++) {
    const [r, c] = [Math.floor(i / state.size), i % state.size];
    const filled = (await cell(page, r, c).getAttribute('data-state')) === 'filled';
    if ((state.solution[i] === 1) !== filled) await cell(page, r, c).click();
  }
  await expect(root(page).getByTestId('ng-status')).toHaveAttribute('data-status', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('nonogram: the 10×10 board fits a phone without page-level horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, 'nonogram', { difficulty: 'hard' });
  await expect(cell(page, 9, 9)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await cell(page, 9, 9).boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
});

test('nonogram: an expert 15×15 game survives a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'nonogram', async (p) => {
    await newGame(p, { difficulty: 'expert' });
    await expect(cell(p, 14, 14)).toBeVisible();
    await cell(p, 14, 14).click();
    await expect(cell(p, 14, 14)).toHaveAttribute('data-state', 'filled');
    await cell(p, 7, 3).click({ button: 'right' });
    await expect(cell(p, 7, 3)).toHaveAttribute('data-state', 'crossed');
  });

  const state = await saved(page);
  expect(state.size).toBe(15);
  expect(state.cells).toHaveLength(225);
  await expect(root(page).getByTestId('ng-board')).toHaveAttribute('data-size', '15');
  await expect(cell(page, 14, 14)).toHaveAttribute('data-state', 'filled');
  await expect(cell(page, 7, 3)).toHaveAttribute('data-state', 'crossed');
  for (let i = 0; i < state.cells.length; i++) {
    const [r, c] = [Math.floor(i / state.size), i % state.size];
    await expect(cell(page, r, c)).toHaveAttribute('data-state', STATES[state.cells[i] as number] as string);
  }
  await expect(root(page).getByTestId('col-clue-14')).toBeVisible();
  await expect(root(page).getByTestId('row-clue-14')).toBeVisible();
});

test('nonogram: the 15×15 board fits a phone and offers larger, scrollable cells', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, 'nonogram', { difficulty: 'expert' });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const scroller = root(page).getByTestId('ng-scroll');

  // Fitted: the whole board is visible without any horizontal scrolling.
  await expect(cell(page, 14, 14)).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  expect(await scroller.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  const last = await cell(page, 0, 14).boundingBox();
  expect((last?.x ?? 0) + (last?.width ?? 0)).toBeLessThanOrEqual(360);
  expect(last?.width ?? 0).toBeGreaterThanOrEqual(15);

  // Larger cells: touch-sized cells scroll inside the frame, never the page; the row clues stay in view.
  const zoom = root(page).getByTestId('ng-zoom');
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-pressed', 'true');
  expect((await cell(page, 0, 0).boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(await overflow()).toBeLessThanOrEqual(0);
  expect(await scroller.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0);

  // Keyboard navigation scrolls the focused cell into view.
  await cell(page, 3, 0).focus();
  for (let c = 0; c < 14; c++) await page.keyboard.press('ArrowRight');
  await expect(cell(page, 3, 14)).toBeFocused();
  await expect(cell(page, 3, 14)).toBeInViewport();
  await expect(root(page).getByTestId('row-clue-3')).toBeInViewport();

  // The choice is remembered for the next game.
  await newGame(page);
  await expect(root(page).getByTestId('ng-zoom')).toHaveAttribute('aria-pressed', 'true');
});
