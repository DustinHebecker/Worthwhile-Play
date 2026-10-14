import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

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
  await page.goto('/games/nonogram?seed=1234&difficulty=easy');
  await page.getByTestId('new-game').click();
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
  await page.goto('/games/nonogram?difficulty=hard');
  await page.getByTestId('new-game').click();
  await expect(cell(page, 9, 9)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await cell(page, 9, 9).boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(24);
});
