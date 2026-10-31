import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame, type StartOptions } from '../../packages/testing/src/e2e';

const GAME = 'tic-tac-toe';

const marks = (page: Page, prefix: string, count: number) =>
  Promise.all(Array.from({ length: count }, (_, i) => page.getByTestId(`${prefix}-${i}`).getAttribute('data-mark')));

async function startNewGame(page: Page, settings: StartOptions['settings'] = {}, difficulty?: string) {
  await startGame(page, GAME, { settings, ...(difficulty ? { difficulty } : {}) });
  await expect(page.getByTestId('game-root')).toBeVisible();
  // The options live only on the host's start screen (ADR 0017).
  await expect(page.getByTestId('game-root').locator('select')).toHaveCount(0);
}

/** Every element matched is at least 44 × 44 CSS pixels. */
async function expectTouchTargets(page: Page, selector: string, count: number) {
  const boxes = await page.locator(selector).evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.width, r.height]));
  expect(boxes).toHaveLength(count);
  for (const [w, h] of boxes) {
    expect(w).toBeGreaterThanOrEqual(44);
    expect(h).toBeGreaterThanOrEqual(44);
  }
}

async function expectNoHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('resumes after reload with the same board', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('cell-4').click();
    // Default opponent is the computer: its reply is part of the same logical step.
    await expect(p.locator('[data-cell][data-mark="O"]')).toHaveCount(1);
    before = await marks(p, 'cell', 9);
  });
  await expect(page.getByTestId('cell-4')).toHaveAttribute('data-mark', 'X');
  await expect(page.locator('[data-cell][data-mark="O"]')).toHaveCount(1);
  expect(await marks(page, 'cell', 9)).toEqual(before);
});

test('two people can play to a win, shown by a highlighted line', async ({ page }) => {
  await startNewGame(page, { opponent: 'human' });
  for (const i of [0, 3, 1, 4, 2]) await page.getByTestId(`cell-${i}`).click();
  for (const i of [0, 1, 2]) await expect(page.getByTestId(`cell-${i}`)).toHaveAttribute('data-winning', '');
  await expect(page.getByTestId('strike')).toBeVisible();
  await expect(page.getByTestId('cell-8')).toHaveAttribute('aria-disabled', 'true');
});

test('the computer can open at the chosen strength', async ({ page }) => {
  await startNewGame(page, { opponent: 'computer', starter: 'computer' }, 'perfect');
  // The computer plays X and has already moved.
  await expect(page.locator('[data-cell][data-mark="X"]')).toHaveCount(1);
  await expect(page.locator('[data-cell][data-mark="O"]')).toHaveCount(0);
  await expect
    .poll(async () => ((await readSave(page, GAME)) as { state?: { difficulty: string; starter: string } } | undefined)?.state)
    .toMatchObject({ difficulty: 'perfect', starter: 'computer' });
});

test('is playable with the keyboard', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('cell-0').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cell-4')).toHaveAttribute('data-mark', 'X');
});

test.describe('board in board', () => {
  test('resumes after reload with the same 81 cells and forced board', async ({ page }) => {
    let before: (string | null)[] = [];
    let forced: string | null = null;
    await expectResumeAfterReload(
      page,
      GAME,
      async (p) => {
        await p.getByTestId('board-4').click();
        await p.getByTestId('zoom-cell-4').click();
        // X in the centre forces the computer into the centre board; its reply follows at once.
        await expect(p.locator('[data-testid^="mini-cell-"][data-mark="O"]')).toHaveCount(1);
        before = await marks(p, 'mini-cell', 81);
        forced = await p.getByTestId('zoom-board').getAttribute('data-board');
      },
      { settings: { variant: 'nested' } }
    );
    await expect(page.getByTestId('mini-cell-40')).toHaveAttribute('data-mark', 'X');
    expect(await marks(page, 'mini-cell', 81)).toEqual(before);
    await expect(page.getByTestId('zoom-board')).toHaveAttribute('data-board', forced ?? '');
    await expect(page.getByTestId(`board-${forced}`)).toHaveAttribute('data-target', '');
  });

  test('fits a 360 px phone: overview and zoomed cells are at least 44 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await startNewGame(page, { variant: 'nested' });
    await expectTouchTargets(page, '[data-testid^="board-"][data-board]', 9);
    await expectTouchTargets(page, '[data-testid^="zoom-cell-"]', 9);
    await expectNoHorizontalScroll(page);
  });

  test('is playable with the keyboard', async ({ page }) => {
    await startNewGame(page, { variant: 'nested', opponent: 'human' });
    await page.getByTestId('board-4').focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('zoom-board')).toHaveAttribute('data-board', '3');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('mini-cell-28')).toHaveAttribute('data-mark', 'X');
    // Cell 1 of board 3 sends O to board 1, which opens by itself.
    await expect(page.getByTestId('zoom-board')).toHaveAttribute('data-board', '1');
    await expect(page.getByTestId('status')).toContainText('row 1, column 2');
  });
});

test.describe('Order & Chaos', () => {
  test('resumes after reload with the same board, playing Chaos', async ({ page }) => {
    let before: (string | null)[] = [];
    await expectResumeAfterReload(
      page,
      GAME,
      async (p) => {
        // The computer (Order) opens; then the person places an O.
        await expect(p.locator('[data-testid^="oc-cell-"]:not([data-mark=""])')).toHaveCount(1);
        await p.getByTestId('symbol-O').click();
        const free = p.locator('[data-testid^="oc-cell-"][data-mark=""]').first();
        await free.click();
        await expect(p.locator('[data-testid^="oc-cell-"]:not([data-mark=""])')).toHaveCount(3);
        before = await marks(p, 'oc-cell', 36);
      },
      { settings: { variant: 'order-chaos', role: 'chaos' } }
    );
    await expect.poll(async () => ((await readSave(page, GAME)) as { state: { role?: string } }).state.role).toBe('chaos');
    expect(await marks(page, 'oc-cell', 36)).toEqual(before);
  });

  test('fits a 360 px phone with 44 px cells and symbol buttons', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await startNewGame(page, { variant: 'order-chaos' });
    await expectTouchTargets(page, '[data-testid^="oc-cell-"]', 36);
    await expectTouchTargets(page, '[data-testid^="symbol-"]', 2);
    await expectNoHorizontalScroll(page);
  });

  test('keyboard: X and O keys place that symbol', async ({ page }) => {
    await startNewGame(page, { variant: 'order-chaos', opponent: 'human' });
    await page.getByTestId('oc-cell-0').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('o');
    await expect(page.getByTestId('oc-cell-1')).toHaveAttribute('data-mark', 'O');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('oc-cell-7')).toHaveAttribute('data-mark', 'O');
  });
});
