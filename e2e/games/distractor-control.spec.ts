import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedDistractor {
  phase: string;
  index: number;
  answers: string[];
  captured: number[];
}

const savedState = async (page: Page) => ((await readSave(page, 'distractor-control')) as { state: SavedDistractor }).state;

test('distractor-control: a session resumes at the same number after a reload', async ({ page }) => {
  let shown = '';
  await expectResumeAfterReload(page, 'distractor-control', async (p) => {
    await expect(p.getByTestId('dc-length')).toContainText('40');
    await p.getByTestId('dc-start').click();
    await expect(p.getByTestId('dc-item')).toHaveAttribute('data-index', '0');
    await p.getByTestId('dc-answer-even').click();
    await p.getByTestId('dc-answer-odd').click();
    await p.getByTestId('dc-answer-even').click();
    await expect(p.getByTestId('dc-item')).toHaveAttribute('data-index', '3');
    shown = (await p.getByTestId('dc-item').textContent()) ?? '';
  });

  const state = await savedState(page);
  expect(state.phase).toBe('running');
  expect(state.index).toBe(3);
  expect(state.answers).toEqual(['even', 'odd', 'even']);
  await expect(page.getByTestId('dc-continue')).toBeVisible();
  await expect(page.getByTestId('dc-status')).toContainText('4');
  await page.getByTestId('dc-continue').click();
  const item = page.getByTestId('dc-item');
  await expect(item).toHaveAttribute('data-index', '3');
  await expect(item).toHaveText(shown);
  await page.getByTestId('dc-answer-odd').click();
  await expect(item).toHaveAttribute('data-index', '4');
});

test('distractor-control: tapping an extra is saved neutrally and the extra stays gone after reload', async ({ page }) => {
  await page.goto('/games/distractor-control');
  await page.getByTestId('difficulty').selectOption('busy');
  await page.getByTestId('new-game').click();
  await page.getByTestId('dc-start').click();
  const extra = page.getByTestId('dc-distractor');
  // Answer until the first extra appears (busy: half of the 40 numbers carry one).
  for (let i = 0; i < 40 && !(await extra.isVisible()); i++) await page.getByTestId('dc-answer-even').click();
  await expect(extra).toBeVisible();
  const index = Number(await extra.getAttribute('data-index'));
  await extra.click();
  await expect(extra).toHaveCount(0);
  await expect(page.getByTestId('dc-ack')).not.toBeEmpty();
  await expect.poll(async () => (await savedState(page))?.captured ?? []).toEqual([index]);

  await page.reload();
  await page.getByTestId('continue').click();
  await page.getByTestId('dc-continue').click();
  await expect(page.getByTestId('dc-item')).toHaveAttribute('data-index', String(index));
  await expect(page.getByTestId('dc-distractor')).toHaveCount(0);
});
