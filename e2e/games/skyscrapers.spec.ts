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

async function expectTower(page: Page, r: number, c: number, value: number, size: number) {
  const tower = root(page).getByTestId(`tower-${r}-${c}`);
  await expect(tower).toBeVisible();
  await expect(cell(page, r, c).locator('.sk-value')).toHaveText(String(value));
  await expect(cell(page, r, c)).toHaveAttribute('aria-label', new RegExp(`^Row ${r + 1}, column ${c + 1}: height ${value}`));
  const cellBox = await cell(page, r, c).boundingBox();
  const towerBox = await tower.boundingBox();
  if (!cellBox || !towerBox) throw new Error('missing boxes');
  // Rises from the bottom, stays inside the cell, height proportional to value/N.
  expect(towerBox.y + towerBox.height).toBeGreaterThan(cellBox.y + cellBox.height - 6);
  expect(towerBox.y + towerBox.height).toBeLessThanOrEqual(cellBox.y + cellBox.height + 0.5);
  expect(towerBox.y).toBeGreaterThanOrEqual(cellBox.y - 0.5);
  expect(towerBox.x).toBeGreaterThanOrEqual(cellBox.x);
  expect(towerBox.x + towerBox.width).toBeLessThanOrEqual(cellBox.x + cellBox.width + 0.5);
  // The tower is bold (about 60 % of the cell wide) and value/N × 82 % of the cell's inner height.
  const inner = await cell(page, r, c).evaluate((el) => ({ w: el.clientWidth, h: el.clientHeight }));
  expect(Math.abs(towerBox.width - 0.6 * inner.w)).toBeLessThan(1.5);
  expect(Math.abs(towerBox.height - (value / size) * 0.82 * inner.h)).toBeLessThan(1.5);
}

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
  // Placed heights come back as towers (height value/N from the cell bottom) with the digit still shown.
  const placed = state.cells.findIndex((v, i) => v !== 0 && state.givens[i] === 0);
  expect(placed).toBeGreaterThanOrEqual(0);
  const [pr, pc] = [Math.floor(placed / state.size), placed % state.size];
  await expectTower(page, pr, pc, state.cells[placed] as number, state.size);
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
  // A full-height tower and its digit fit the smallest cell.
  const open = openCells(page).nth(0);
  const testId = (await open.getAttribute('data-testid')) ?? '';
  const [, r, c] = /cell-(\d)-(\d)/.exec(testId)?.map(Number) ?? [];
  await open.click();
  await root(page).getByTestId('sk-pad-6').click();
  await expectTower(page, r as number, c as number, 6, 6);
  await expect(root(page).getByTestId('sk-towers')).toHaveAttribute('aria-pressed', 'true');
  const pad = await root(page).getByTestId('sk-pad-6').boundingBox();
  expect(pad?.height ?? 0).toBeGreaterThanOrEqual(44);
});
