import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

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
  await page.goto('/games/visual-search');
  await page.getByTestId('difficulty').selectOption('conjunction');
  await page.getByTestId('new-game').click();
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
