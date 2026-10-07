// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedMines {
  rows: number;
  cols: number;
  mines: number[] | null;
  marks: number[];
  exploded: number | null;
}

const MARK_STATES = ['hidden', 'revealed', 'flagged'] as const;
const root = (page: Page) => page.getByTestId('game-root');
const cell = (page: Page, r: number, c: number) => root(page).getByTestId(`cell-${r}-${c}`);
const saved = async (page: Page) => ((await readSave(page, 'minesweeper')) as { state: SavedMines } | undefined)?.state;

function countAround(s: SavedMines, i: number): number {
  const mines = s.mines ?? [];
  const r = Math.floor(i / s.cols);
  const c = i % s.cols;
  let n = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if ((dr || dc) && rr >= 0 && rr < s.rows && cc >= 0 && cc < s.cols && mines.includes(rr * s.cols + cc)) n++;
    }
  }
  return n;
}

test('mine logic: opened and flagged cells survive a reload exactly', async ({ page }) => {
  let flaggedId = '';
  await expectResumeAfterReload(page, 'minesweeper', async (p) => {
    await cell(p, 0, 0).click();
    await expect(cell(p, 0, 0)).toHaveAttribute('data-state', 'revealed');
    const hidden = root(p).locator('[data-cell][data-state="hidden"]').first();
    flaggedId = (await hidden.getAttribute('data-testid')) ?? '';
    await hidden.click({ button: 'right' });
    await expect(root(p).getByTestId(flaggedId)).toHaveAttribute('data-state', 'flagged');
  });

  // The restored board visibly matches the saved logical state, cell by cell.
  const state = (await saved(page)) as SavedMines;
  expect(state.mines).not.toBeNull();
  await expect(root(page).getByTestId(flaggedId)).toHaveAttribute('data-state', 'flagged');
  for (let i = 0; i < state.marks.length; i++) {
    const el = cell(page, Math.floor(i / state.cols), i % state.cols);
    const expected = MARK_STATES[state.marks[i] as number] as string;
    await expect(el).toHaveAttribute('data-state', expected);
    if (expected === 'revealed') await expect(el).toHaveAttribute('data-count', String(countAround(state, i)));
  }
  await expect(root(page).getByTestId('ms-flags')).toContainText('1');
});

test('mine logic: keyboard start, an undone mistake, and clearing the board ends calmly', async ({ page }) => {
  await page.goto('/games/minesweeper?seed=4321&difficulty=easy');
  const first = cell(page, 0, 0);
  await expect(first).toBeVisible();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 0, 1)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(cell(page, 0, 1)).toHaveAttribute('data-state', 'revealed');
  await expect.poll(async () => (await saved(page))?.mines?.length ?? 0).toBe(10);
  const state = (await saved(page)) as SavedMines;
  const mines = state.mines as number[];
  const at = (i: number) => cell(page, Math.floor(i / state.cols), i % state.cols);

  // A mistaken reveal is shown calmly and can be undone.
  await at(mines[0] as number).click();
  await expect(at(mines[0] as number)).toHaveAttribute('data-state', 'mine');
  await expect(root(page).getByTestId('ms-status')).toHaveAttribute('data-status', 'mistake');
  await root(page).getByTestId('ms-undo').click();
  await expect(at(mines[0] as number)).toHaveAttribute('data-state', 'hidden');

  for (let i = 0; i < state.marks.length; i++) {
    if (mines.includes(i)) continue;
    if ((await at(i).getAttribute('data-state')) === 'hidden') await at(i).click();
  }
  await expect(root(page).getByTestId('ms-status')).toHaveAttribute('data-status', 'won');
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect.poll(async () => ((await readSave(page, 'minesweeper')) as { state: { undos: number } }).state.undos).toBe(1);
});

test('mine logic: the hard board fits a 360 px phone without horizontal page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/minesweeper?seed=77&difficulty=hard');
  await expect(cell(page, 14, 9)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await cell(page, 14, 9).boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(28);
  // The mode toggle buttons are full-size touch targets.
  const toggle = await root(page).getByTestId('ms-mode-flag').boundingBox();
  expect(toggle?.height ?? 0).toBeGreaterThanOrEqual(44);
});
