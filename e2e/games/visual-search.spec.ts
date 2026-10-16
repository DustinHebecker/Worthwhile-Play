import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame, newGame } from '../../packages/testing/src/e2e';

interface SavedSearch {
  seed: number;
  difficulty: string;
  phase: string;
  answers: { pick: number; ms: number | null }[];
}

const savedState = async (page: Page) => ((await readSave(page, 'visual-search')) as { state: SavedSearch } | undefined)?.state;

/** Cell, features and jitter of every shape on the shown board: equal signatures mean an identical layout. */
const boardSignature = (page: Page) =>
  page
    .locator('[data-testid="vs-board"] [data-item]')
    .evaluateAll((items) =>
      items.map((el) => {
        const b = el as HTMLElement;
        return `${b.dataset.cell}:${b.dataset.shape}:${b.dataset.fill}:${b.dataset.tilt}:${b.querySelector('svg')?.getAttribute('style') ?? ''}`;
      })
    );

/** Index (reading order) of the shape matching the shown target, or -1 when it is not on the board. */
const targetIndex = (page: Page) =>
  page.evaluate(() => {
    const sample = document.querySelector<HTMLElement>('[data-testid="vs-find-sample"]');
    const items = [...document.querySelectorAll<HTMLElement>('[data-testid="vs-board"] [data-item]')];
    return items.findIndex(
      (b) => b.dataset.shape === sample?.dataset.shape && b.dataset.fill === sample?.dataset.fill && b.dataset.tilt === sample?.dataset.tilt
    );
  });

test('visual-search: a round resumes on the same board with the identical layout after a reload', async ({ page }) => {
  let layout: string[] = [];
  await expectResumeAfterReload(page, 'visual-search', async (p) => {
    await p.getByTestId('vs-start').click();
    await expect(p.getByTestId('vs-board')).toHaveAttribute('data-trial', '0');
    await p.getByTestId('vs-item-0').click();
    await expect(p.getByTestId('vs-feedback')).not.toBeEmpty();
    await p.getByTestId('vs-next').click();
    await expect(p.getByTestId('vs-board')).toHaveAttribute('data-trial', '1');
    layout = await boardSignature(p);
    expect(layout.length).toBeGreaterThan(0);
  });

  const state = await savedState(page);
  expect(state?.phase).toBe('running');
  expect(state?.answers).toHaveLength(1);
  expect(state?.answers[0]?.pick).toBe(0);
  await expect(page.getByTestId('vs-board')).toHaveAttribute('data-trial', '1');
  await expect(page.getByTestId('vs-status')).toContainText('2');
  expect(await boardSignature(page)).toEqual(layout);
});

test('visual-search: a board can be solved with the keyboard only', async ({ page }) => {
  await startGame(page, 'visual-search', { difficulty: 'conjunction' });
  await page.getByTestId('vs-start').focus();
  await page.keyboard.press('Enter');
  const first = page.getByTestId('vs-item-0');
  await expect(first).toBeFocused();

  const index = await targetIndex(page);
  if (index < 0) {
    await page.keyboard.press('n');
  } else {
    for (let i = 0; i < index; i++) await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId(`vs-item-${index}`)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId(`vs-item-${index}`)).toHaveAttribute('data-revealed', 'target');
  }
  await expect(page.getByTestId('vs-next')).toBeFocused();
  await expect.poll(async () => (await savedState(page))?.answers.length ?? 0).toBe(1);
  const state = await savedState(page);
  expect(state?.difficulty).toBe('conjunction');
  expect(state?.answers[0]?.pick).toBe(index);

  // Enter on "Next board" shows the next board with focus on its first shape.
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('vs-board')).toHaveAttribute('data-trial', '1');
  await expect(page.getByTestId('vs-item-0')).toBeFocused();
});

test('visual-search: an expert round (T among L shapes) resumes on the same board after a reload', async ({ page }) => {
  let layout: string[] = [];
  await expectResumeAfterReload(page, 'visual-search', async (p) => {
    await newGame(p, { difficulty: 'expert' });
    await p.getByTestId('vs-start').click();
    await expect(p.getByTestId('vs-board')).toHaveAttribute('data-trial', '0');
    await expect(p.getByTestId('vs-find-sample')).toHaveAttribute('data-tilt', 'any');
    await p.getByTestId('vs-not-there').click();
    await p.getByTestId('vs-next').click();
    await expect(p.getByTestId('vs-board')).toHaveAttribute('data-trial', '1');
    layout = await boardSignature(p);
    expect(layout.length).toBeGreaterThanOrEqual(12);
    expect(layout.every((s) => /:(tee|ell):solid:/.test(s))).toBe(true);
  });

  const state = await savedState(page);
  expect(state?.difficulty).toBe('expert');
  expect(state?.answers).toEqual([expect.objectContaining({ pick: -1 })]);
  await expect(page.getByTestId('vs-board')).toHaveAttribute('data-trial', '1');
  expect(await boardSignature(page)).toEqual(layout);
});

test('visual-search: the 6 × 6 expert board fits a 360 px phone in RTL with targets of at least 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/settings');
  await page.getByTestId('ui-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await startGame(page, 'visual-search', { difficulty: 'expert' });
  await page.getByTestId('vs-start').click();
  const board = page.getByTestId('vs-board');
  await expect(board).toBeVisible();
  await expect(board.locator('.wp-vs__cell')).toHaveCount(36);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const boxes = await board.locator('[data-item]').evaluateAll((items) =>
    items.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width, height: r.height };
    })
  );
  expect(boxes.length).toBeGreaterThanOrEqual(12);
  for (const b of boxes) {
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(360);
  }
  // RTL: the grid starts on the right.
  const first = await board.locator('.wp-vs__cell').first().boundingBox();
  const sixth = await board.locator('.wp-vs__cell').nth(5).boundingBox();
  expect(first?.x ?? 0).toBeGreaterThan(sixth?.x ?? 0);
  await expect(page.getByTestId('vs-not-there')).toBeVisible();
  if (process.env.VS_SCREENSHOT) await page.screenshot({ path: process.env.VS_SCREENSHOT, fullPage: true });
});
