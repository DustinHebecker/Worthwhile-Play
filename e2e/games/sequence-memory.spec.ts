import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedSequence {
  presentation: string;
  phase: string;
  sequence: number[];
  input: number[];
}

const savedState = async (page: Page) => ((await readSave(page, 'sequence-memory')) as { state: SavedSequence }).state;

/** Index of the currently highlighted tile (exactly one is lit while a tile is shown). */
const litTile = async (page: Page) => Number((await page.locator('[data-state="lit"]').getAttribute('data-testid'))?.slice('tile-'.length));

/** Switches to Step mode and watches the whole sequence; returns it in presentation order. */
async function watchSequence(page: Page): Promise<number[]> {
  const step = page.getByTestId('seq-mode-step');
  if ((await step.getAttribute('aria-pressed')) !== 'true') await step.click();
  await expect(step).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('seq-start').click();
  const seen: number[] = [];
  const next = page.getByTestId('seq-next');
  while (await next.isVisible()) {
    await expect(page.locator('[data-state="lit"]')).toHaveCount(1);
    seen.push(await litTile(page));
    await next.click();
  }
  return seen;
}

test('sequence-memory: partial recall survives a reload exactly', async ({ page }) => {
  let sequence: number[] = [];
  await expectResumeAfterReload(page, 'sequence-memory', async (p) => {
    sequence = await watchSequence(p);
    expect(sequence).toHaveLength(3);
    await p.getByTestId(`tile-${sequence[0]}`).click();
    await expect(p.getByTestId(`tile-${sequence[0]}`)).toHaveAttribute('data-state', 'entered');
  });

  // The restored board visibly matches the saved logical state.
  const state = await savedState(page);
  expect(state).toMatchObject({ phase: 'recalling', presentation: 'step', sequence, input: [sequence[0]] });
  await expect(page.getByTestId(`tile-${sequence[0]}`)).toHaveAttribute('data-state', 'entered');
  await expect(page.getByTestId(`tile-${sequence[0]}`)).toHaveText('1');
  await expect(page.locator('[data-state="idle"]')).toHaveCount(8);
  await expect(page.getByTestId('seq-undo')).toBeVisible();
  await expect(page.getByTestId('seq-status')).toContainText('1');

  // Finishing the round after the reload works as usual.
  await page.getByTestId(`tile-${sequence[1]}`).click();
  await page.getByTestId(`tile-${sequence[2]}`).click();
  await expect(page.getByTestId('seq-continue')).toBeVisible();
  await expect(page.locator('[data-state="ok"]')).toHaveCount(3);
});

test('sequence-memory: closing during the presentation restarts it from the first tile', async ({ page }) => {
  let first = -1;
  await expectResumeAfterReload(page, 'sequence-memory', async (p) => {
    const step = p.getByTestId('seq-mode-step');
    if ((await step.getAttribute('aria-pressed')) !== 'true') await step.click();
    await p.getByTestId('seq-start').click();
    first = await litTile(p);
    await p.getByTestId('seq-next').click();
  });

  const state = await savedState(page);
  expect(state.phase).toBe('showing');
  expect(state.sequence[0]).toBe(first);
  await expect(page.locator('[data-state="lit"]')).toHaveCount(0);
  await expect(page.getByTestId('seq-next')).toBeHidden();
  await page.getByTestId('seq-start').click();
  await expect(page.getByTestId(`tile-${first}`)).toHaveAttribute('data-state', 'lit');
});
