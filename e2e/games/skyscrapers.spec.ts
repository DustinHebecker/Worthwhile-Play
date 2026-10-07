// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedSkyscrapers {
  size: number;
  solution: number[];
  givens: number[];
  cells: number[];
  notes: number[];
  pencil: boolean;
  clues: Record<'top' | 'bottom' | 'left' | 'right', number[]>;
}

const root = (page: Page) => page.getByTestId('game-root');
const cell = (page: Page, r: number, c: number) => root(page).getByTestId(`cell-${r}-${c}`);
const saved = async (page: Page) => ((await readSave(page, 'skyscrapers')) as { state: SavedSkyscrapers }).state;
const openCells = (page: Page) => root(page).locator('[data-cell][data-given="false"]');

const noteList = (mask: number) => [1, 2, 3, 4, 5, 6].filter((d) => mask & (1 << d)).join(',');

test('skyscrapers: heights, notes and notes mode survive a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'skyscrapers', async (p) => {
    const first = openCells(p).nth(0);
    await first.click();
    await root(p).getByTestId('sk-pad-2').click();
    await expect(first).toHaveAttribute('data-value', '2');
    await root(p).getByTestId('sk-notes').click();
    const second = openCells(p).nth(1);
    await second.click();
    await root(p).getByTestId('sk-pad-1').click();
    await root(p).getByTestId('sk-pad-3').click();
    await expect(second).toHaveAttribute('data-notes', '1,3');
  });

  // The restored board visibly matches the saved logical state, cell by cell and clue by clue.
  const state = await saved(page);
  expect(state.pencil).toBe(true);
  await expect(root(page).getByTestId('sk-notes')).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < state.cells.length; i++) {
    const [r, c] = [Math.floor(i / state.size), i % state.size];
    await expect(cell(page, r, c)).toHaveAttribute('data-value', String(state.cells[i]));
    await expect(cell(page, r, c)).toHaveAttribute('data-notes', noteList(state.notes[i] as number));
  }
  for (const side of ['top', 'bottom', 'left', 'right'] as const) {
    for (let i = 0; i < state.size; i++) {
      await expect(root(page).getByTestId(`clue-${side}-${i}`)).toHaveAttribute('data-value', String(state.clues[side][i]));
    }
  }
});

test('skyscrapers: keyboard play and solving the puzzle ends the game calmly', async ({ page }) => {
  await page.goto('/games/skyscrapers?seed=1234&difficulty=easy');
  await page.getByTestId('new-game').click();
  const first = openCells(page).nth(0);
  await first.click();
  await expect(first).toBeFocused();
  await page.keyboard.press('3');
  await expect(first).toHaveAttribute('data-value', '3');
  await page.keyboard.press('Backspace');
  await expect(first).toHaveAttribute('data-value', '0');
  await page.keyboard.press('n');
  await page.keyboard.press('2');
  await expect(first).toHaveAttribute('data-notes', '2');
  await page.keyboard.press('n');
  await expect(root(page).getByTestId('sk-notes')).toHaveAttribute('aria-pressed', 'false');

  // Read the recorded puzzle from the save and complete it with the pad.
  await expect.poll(async () => (await readSave(page, 'skyscrapers')) !== undefined).toBe(true);
  const state = await saved(page);
  for (let i = 0; i < state.solution.length; i++) {
    if (state.givens[i] !== 0) continue;
    const [r, c] = [Math.floor(i / state.size), i % state.size];
    await cell(page, r, c).click();
    await root(page).getByTestId(`sk-pad-${state.solution[i]}`).click();
  }
  await expect(root(page).getByTestId('sk-status')).toHaveAttribute('data-status', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('skyscrapers: the 6×6 board with clues on all sides fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/skyscrapers?difficulty=hard');
  await page.getByTestId('new-game').click();
  await expect(cell(page, 5, 5)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await cell(page, 5, 5).boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
  const left = await root(page).getByTestId('clue-left-0').boundingBox();
  const right = await root(page).getByTestId('clue-right-0').boundingBox();
  expect((left?.x ?? -1) >= 0).toBe(true);
  expect((right?.x ?? 999) + (right?.width ?? 0)).toBeLessThanOrEqual(360);
  const pad = await root(page).getByTestId('sk-pad-6').boundingBox();
  expect(pad?.height ?? 0).toBeGreaterThanOrEqual(44);
});
