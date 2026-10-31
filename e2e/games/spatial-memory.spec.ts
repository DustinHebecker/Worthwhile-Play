import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedPattern {
  presentation: string;
  phase: string;
  pattern: number[];
  marks: number[];
}

const savedState = async (page: Page) => ((await readSave(page, 'spatial-memory')) as { state: SavedPattern }).state;

/** Indices of the cells currently in the given data-state. */
async function cellsIn(page: Page, state: string): Promise<number[]> {
  const ids = await page.locator(`[data-state="${state}"]`).evaluateAll((els) => els.map((el) => el.getAttribute('data-testid') ?? ''));
  return ids.map((id) => Number(id.slice('cell-'.length)));
}

/** Switches to Step mode (no timer) and shows the pattern; returns its cells. */
async function showPattern(page: Page): Promise<number[]> {
  const step = page.getByTestId('pm-mode-step');
  if ((await step.getAttribute('aria-pressed')) !== 'true') await step.click();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('pm-show').click();
  await expect(page.locator('[data-state="shown"]')).toHaveCount(3);
  return cellsIn(page, 'shown');
}

test('spatial-memory: a partial selection survives a reload exactly', async ({ page }) => {
  let pattern: number[] = [];
  await expectResumeAfterReload(page, 'spatial-memory', async (p) => {
    pattern = await showPattern(p);
    await p.getByTestId('pm-memorised').click();
    await p.getByTestId(`cell-${pattern[0]}`).click();
    await expect(p.getByTestId(`cell-${pattern[0]}`)).toHaveAttribute('data-state', 'marked');
  });

  // The restored board visibly matches the saved logical state.
  const state = await savedState(page);
  expect(state).toMatchObject({ phase: 'recalling', presentation: 'step', pattern, marks: [pattern[0]] });
  await expect(page.getByTestId(`cell-${pattern[0]}`)).toHaveAttribute('data-state', 'marked');
  await expect(page.locator('[data-state="idle"]')).toHaveCount(15);
  await expect(page.getByTestId('pm-done')).toBeEnabled();
  await expect(page.getByTestId('pm-status')).toContainText('1');

  // Finishing the round after the reload works as usual.
  await page.getByTestId(`cell-${pattern[1]}`).click();
  await page.getByTestId(`cell-${pattern[2]}`).click();
  await page.getByTestId('pm-done').click();
  await expect(page.getByTestId('pm-next')).toBeVisible();
  await expect(page.locator('[data-state="hit"]')).toHaveCount(3);
});

test('spatial-memory: closing while the pattern is shown returns to the Show pattern button', async ({ page }) => {
  let pattern: number[] = [];
  await expectResumeAfterReload(page, 'spatial-memory', async (p) => {
    pattern = await showPattern(p);
  });

  const state = await savedState(page);
  expect(state.phase).toBe('showing');
  expect(state.pattern).toEqual(pattern);
  await expect(page.locator('[data-state="shown"]')).toHaveCount(0);
  await expect(page.getByTestId('pm-memorised')).toBeHidden();
  await page.getByTestId('pm-show').click();
  expect(await cellsIn(page, 'shown')).toEqual(pattern);
});
