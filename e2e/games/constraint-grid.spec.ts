// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedGrid {
  size: number;
  kinds: string[];
  solution: number[][];
  clues: unknown[];
  marks: number[];
  used: boolean[];
  autoExclude: boolean;
}

const MARKS = ['unknown', 'no', 'yes'];
const root = (page: Page) => page.getByTestId('game-root');
const saved = async (page: Page) => ((await readSave(page, 'constraint-grid')) as { state: SavedGrid }).state;
const cell = (page: Page, a: number, b: number, i: number, j: number) => root(page).getByTestId(`cell-${a}-${b}-${i}-${j}`);

/** Category pairs in block order, as the game stores its marks. */
const pairs = (k: number) => {
  const out: [number, number][] = [];
  for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) out.push([a, b]);
  return out;
};

test('constraint-grid: marks, ticked clues and options survive a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'constraint-grid', async (p) => {
    const yes = cell(p, 0, 1, 0, 0);
    await yes.click();
    await yes.click();
    await expect(yes).toHaveAttribute('data-mark', 'yes');
    await expect(cell(p, 0, 1, 0, 1)).toHaveAttribute('data-mark', 'no'); // auto-✗
    await cell(p, 0, 2, 1, 2).click();
    await expect(cell(p, 0, 2, 1, 2)).toHaveAttribute('data-mark', 'no');
    await root(p).getByTestId('clue-0').click();
    await expect(root(p).getByTestId('clue-0')).toHaveAttribute('data-used', 'true');
    await root(p).getByTestId('cg-auto').uncheck();
  });

  // The restored board visibly matches the saved logical state, cell by cell and clue by clue.
  const state = await saved(page);
  expect(state.autoExclude).toBe(false);
  await expect(root(page).getByTestId('cg-auto')).not.toBeChecked();
  const n = state.size;
  let k = 0;
  for (const [a, b] of pairs(state.kinds.length)) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        await expect(cell(page, a, b, i, j)).toHaveAttribute('data-mark', MARKS[state.marks[k] as number] as string);
        k++;
      }
    }
  }
  for (let c = 0; c < state.clues.length; c++) {
    await expect(root(page).getByTestId(`clue-${c}`)).toHaveAttribute('data-used', String(state.used[c]));
  }
});

test('constraint-grid: keyboard play and solving the puzzle ends the game calmly', async ({ page }) => {
  await page.goto('/games/constraint-grid?seed=4242&difficulty=easy');
  await page.getByTestId('new-game').click();
  const first = cell(page, 0, 1, 0, 0);
  await first.click();
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('data-mark', 'no');
  await page.keyboard.press('Delete');
  await expect(first).toHaveAttribute('data-mark', 'unknown');
  await page.keyboard.press('ArrowRight');
  const second = cell(page, 0, 1, 0, 1);
  await expect(second).toBeFocused();
  await page.keyboard.press('Space');
  await expect(second).toHaveAttribute('data-mark', 'no');
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('data-mark', 'yes');
  await root(page).getByTestId('cg-undo').click();
  await expect(second).toHaveAttribute('data-mark', 'no');
  await second.press('Delete');
  await expect(second).toHaveAttribute('data-mark', 'unknown');

  // Read the recorded puzzle from the save and confirm every true pair.
  await expect.poll(async () => (await readSave(page, 'constraint-grid')) !== undefined).toBe(true);
  const state = await saved(page);
  for (const [a, b] of pairs(state.kinds.length)) {
    for (let p = 0; p < state.size; p++) {
      const target = cell(page, a, b, state.solution[a]?.[p] as number, state.solution[b]?.[p] as number);
      for (let tries = 0; tries < 3 && (await target.getAttribute('data-mark')) !== 'yes'; tries++) await target.click();
      await expect(target).toHaveAttribute('data-mark', 'yes');
    }
  }
  await expect(root(page).getByTestId('cg-status')).toHaveAttribute('data-status', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('constraint-grid: the 4 × 5 puzzle fits a phone with 44 px cells', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/constraint-grid?difficulty=hard');
  await page.getByTestId('new-game').click();
  const last = cell(page, 2, 3, 4, 4);
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const target of [cell(page, 0, 1, 0, 0), last]) {
    const box = await target.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect((box?.x ?? -1) >= 0).toBe(true);
    expect((box?.x ?? 999) + (box?.width ?? 0)).toBeLessThanOrEqual(360);
  }
  const clue = await root(page).getByTestId('clue-0').boundingBox();
  expect(clue?.height ?? 0).toBeGreaterThanOrEqual(44);
});
