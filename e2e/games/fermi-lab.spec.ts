import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import type { FermiState } from '../../packages/games/fermi-lab/src/rules';
import { taskById } from '../../packages/games/fermi-lab/src/tasks';

const ID = 'fermi-lab';
const root = (page: Page) => page.getByTestId('game-root');

/** Waits until the autosave holds a game, then returns its state. */
async function savedState(page: Page): Promise<FermiState> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return ((await readSave(page, ID)) as { state: FermiState }).state;
}

const currentTask = async (page: Page) => {
  const taskId = await root(page).getByTestId('fl-question').getAttribute('data-task');
  return taskById(taskId!)!;
};

test('fermi-lab: a guided model filled with the reference values lands within a factor of 2', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { category: 'everyday', model: 'guided' } });
  const r = root(page);
  const task = await currentTask(page);
  // An English thousands separator is read as such.
  await r.getByTestId('fl-est-input').fill('35,000');
  await expect(r.getByTestId('fl-est-value')).toHaveAttribute('data-value', '35000');
  await r.getByTestId('fl-guess').click();
  await expect(r.locator('#fl-model-heading')).toBeFocused();
  for (const [i, x] of task.factors.entries()) if (!x.fixed) await r.getByTestId(`fl-row-${i}-input`).fill(String(x.value));
  await expect(r.getByTestId('fl-product')).toHaveAttribute('data-status', 'ok');
  await r.getByTestId('fl-use-model').click();
  await expect(r.getByTestId('fl-verdict')).toHaveAttribute('data-band', 'x2');
  await expect(r.getByTestId('fl-compare')).toBeVisible();
  await expect(r.getByTestId('fl-sensitivity')).toBeVisible();
  await expect.poll(async () => (await savedState(page)).questions[0]!.modelUsed).toBe(true);
});

test('fermi-lab: a half-built model survives a reload', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('fl-est-input').fill('2.5');
      await r.getByTestId('fl-est-exp-plus').click();
      await r.getByTestId('fl-guess').click();
      const task = await currentTask(p);
      const open = task.factors.findIndex((x) => !x.fixed);
      await r.getByTestId(`fl-row-${open}-input`).fill('42');
      await expect.poll(async () => (await savedState(p)).questions[0]?.factors[open]?.text).toBe('42');
    },
    { difficulty: 'medium', settings: { category: 'all', model: 'guided' } }
  );
  const state = await savedState(page);
  const open = taskById(state.questions[0]!.taskId)!.factors.findIndex((x) => !x.fixed);
  await expect(root(page).getByTestId(`fl-row-${open}-input`)).toHaveValue('42');
  await expect(root(page).getByTestId('fl-first-guess')).toHaveAttribute('data-value', '25');
});

test('fermi-lab: a whole round by keyboard ends with a calm summary', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'hard', settings: { category: 'space', model: 'free' } });
  const r = root(page);
  for (let i = 0; i < 5; i++) {
    const field = r.getByTestId('fl-est-input');
    await field.focus();
    await page.keyboard.type('1e6');
    await page.keyboard.press('Enter');
    await expect(r.locator('#fl-model-heading')).toBeFocused();
    await r.getByTestId('fl-keep-guess').focus();
    await page.keyboard.press('Enter');
    await expect(r.locator('#fl-review-heading')).toBeFocused();
    await r.getByTestId(i < 4 ? 'fl-next' : 'fl-summary').focus();
    await page.keyboard.press('Enter');
  }
  await expect(r.getByTestId('fl-summary-list').locator('li')).toHaveCount(5);
  await expect(r.getByTestId('fl-tip')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeVisible();
  expect((await savedState(page)).finishedReported).toBe(true);
});

test('fermi-lab: fits 360 px in Arabic (right to left, numeric axes left to right) with 44 px targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await startGame(page, ID, { difficulty: 'easy' });
  const r = root(page);
  await expect(r.locator('.wp-fermi-lab')).toHaveAttribute('dir', 'rtl');
  await r.getByTestId('fl-est-input').fill('٣٥٠٠٠');
  await expect(r.getByTestId('fl-est-value')).toHaveAttribute('data-value', '35000');
  for (const id of ['fl-est-exp-plus', 'fl-est-mul2', 'fl-guess']) {
    const box = (await r.getByTestId(id).boundingBox())!;
    expect(box.height, id).toBeGreaterThanOrEqual(44);
    expect(box.width, id).toBeGreaterThanOrEqual(44);
  }
  await r.getByTestId('fl-guess').click();
  await r.getByTestId('fl-keep-guess').click();
  await expect(r.getByTestId('fl-scale').locator('svg')).toHaveAttribute('direction', 'ltr');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
