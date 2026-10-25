import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, newGame, readSave, startGame } from '../../packages/testing/src/e2e';
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

/** Guided: fills every open row of the current question with its reference value. */
async function fillReference(page: Page) {
  const r = root(page);
  const task = await currentTask(page);
  for (const [i, x] of task.factors.entries()) if (!x.fixed) await r.getByTestId(`fl-row-${i}-input`).fill(String(x.value));
}

test('fermi-lab: guided opens each question in the model; the reference values land within a factor of 2', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { category: 'everyday', model: 'guided' } });
  const r = root(page);
  await expect(r.locator('.wp-fermi-lab')).toHaveAttribute('data-phase', 'model');
  await expect(r.getByTestId('fl-est-input')).toHaveCount(0);
  for (let i = 0; i < 5; i++) {
    await fillReference(page);
    await expect(r.getByTestId('fl-product')).toHaveAttribute('data-status', 'ok');
    await r.getByTestId('fl-use-model').click();
    await expect(r.locator('#fl-review-heading')).toBeFocused();
    await expect(r.getByTestId('fl-verdict')).toHaveAttribute('data-band', 'x2');
    await expect(r.getByTestId('fl-compare')).toBeVisible();
    await expect(r.getByTestId('fl-sensitivity')).toBeVisible();
    await r.getByTestId(i < 4 ? 'fl-next' : 'fl-summary').click();
  }
  await expect(r.getByTestId('fl-summary-list').locator('li')).toHaveCount(5);
  await expect(page.getByTestId('finished')).toBeVisible();
  const state = await savedState(page);
  expect(state.questions.every((q) => q.modelUsed && q.firstGuess === null)).toBe(true);
});

test('fermi-lab: a free round goes from each estimate straight to the review', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { category: 'all', model: 'free' } });
  const r = root(page);
  for (let i = 0; i < 5; i++) {
    await expect(r.locator('.wp-fermi-lab')).toHaveAttribute('data-phase', 'estimate');
    // An English thousands separator is read as such.
    await r.getByTestId('fl-est-input').fill('35,000');
    await expect(r.getByTestId('fl-est-value')).toHaveAttribute('data-value', '35000');
    await r.getByTestId('fl-guess').click();
    await expect(r.locator('#fl-review-heading')).toBeFocused();
    await expect(r.getByTestId('fl-rows')).toHaveCount(0);
    await expect(r.getByTestId('fl-compare')).toBeVisible();
    await r.getByTestId(i < 4 ? 'fl-next' : 'fl-summary').click();
  }
  await expect(r.getByTestId('fl-tip')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeVisible();
  const state = await savedState(page);
  expect(state.questions.every((q) => !q.modelUsed && q.answer === q.firstGuess)).toBe(true);
});

test('fermi-lab: field, stepper, slider keys and ×2/÷2 stay in step and the same display comes back after a reload', async ({ page }) => {
  let before: string[] = [];
  const snapshot = async (p: Page) => {
    const r = root(p);
    return [
      await r.getByTestId('fl-est-input').inputValue(),
      (await r.getByTestId('fl-est-exp').textContent()) ?? '',
      await r.getByTestId('fl-est-slider').inputValue(),
      (await r.getByTestId('fl-est-value').getAttribute('data-value')) ?? ''
    ];
  };
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('fl-est-input').fill('3');
      for (let i = 0; i < 3; i++) await r.getByTestId('fl-est-exp-plus').click();
      await expect(r.getByTestId('fl-est-value')).toHaveAttribute('data-value', '3000');
      // Arrow keys on the slider move in 0.05-decade steps; the field and the stepper follow.
      const slider = r.getByTestId('fl-est-slider');
      const pos = Number(await slider.inputValue());
      expect(Math.abs(pos - Math.log10(3000))).toBeLessThanOrEqual(0.025);
      await slider.focus();
      await p.keyboard.press('ArrowRight');
      await p.keyboard.press('ArrowRight');
      const v = Number(await r.getByTestId('fl-est-value').getAttribute('data-value'));
      expect(Math.abs(Math.log10(v) - Number(await slider.inputValue()))).toBeLessThanOrEqual(0.025);
      await r.getByTestId('fl-est-mul2').click();
      await r.getByTestId('fl-est-div2').click();
      await expect(r.getByTestId('fl-est-value')).toHaveAttribute('data-value', String(v));
      const field = await r.getByTestId('fl-est-input').inputValue();
      await expect.poll(async () => (await savedState(p)).questions[0]?.draft).toBe(field);
      before = await snapshot(p);
    },
    { difficulty: 'medium', settings: { category: 'all', model: 'free' } }
  );
  expect(await snapshot(page)).toEqual(before);
});

test('fermi-lab: a half-built guided model survives a reload', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      const task = await currentTask(p);
      const open = task.factors.findIndex((x) => !x.fixed);
      await r.getByTestId(`fl-row-${open}-input`).fill('42');
      await r.getByTestId(`fl-row-${open}-exp-plus`).click();
      await expect.poll(async () => (await savedState(p)).questions[0]?.factors[open]?.exp).toBe(1);
    },
    { difficulty: 'medium', settings: { category: 'all', model: 'guided' } }
  );
  const state = await savedState(page);
  const open = taskById(state.questions[0]!.taskId)!.factors.findIndex((x) => !x.fixed);
  await expect(root(page).locator('.wp-fermi-lab')).toHaveAttribute('data-phase', 'model');
  await expect(root(page).getByTestId(`fl-row-${open}-input`)).toHaveValue('42');
  await expect(root(page).getByTestId(`fl-row-${open}-value`)).toHaveAttribute('data-value', '420');
});

test('fermi-lab: a whole guided round by keyboard ends with a calm summary', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'hard', settings: { category: 'space', model: 'guided' } });
  const r = root(page);
  for (let i = 0; i < 5; i++) {
    const task = await currentTask(page);
    const open = task.factors.flatMap((x, k) => (x.fixed ? [] : [k]));
    for (const k of open) {
      await r.getByTestId(`fl-row-${k}-input`).focus();
      await page.keyboard.type(String(task.factors[k]!.value));
    }
    await r.getByTestId('fl-use-model').focus();
    await page.keyboard.press('Enter');
    await expect(r.locator('#fl-review-heading')).toBeFocused();
    await r.getByTestId(i < 4 ? 'fl-next' : 'fl-summary').focus();
    await page.keyboard.press('Enter');
    if (i < 4) {
      // "Next" focuses the first open factor of the new question.
      const next = await currentTask(page);
      await expect(r.getByTestId(`fl-row-${next.factors.findIndex((x) => !x.fixed)}-input`)).toBeFocused();
    }
  }
  await expect(r.getByTestId('fl-summary-list').locator('li')).toHaveCount(5);
  await expect(r.getByTestId('fl-tip')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeVisible();
  expect((await savedState(page)).finishedReported).toBe(true);
});

test('fermi-lab: fits 360 px in Arabic (right to left, numeric axes left to right) with 44 px targets, both paths', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await startGame(page, ID, { difficulty: 'easy', settings: { category: 'all', model: 'free' } });
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
  await expect(r.getByTestId('fl-scale').locator('svg')).toHaveAttribute('direction', 'ltr');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await newGame(page, { difficulty: 'easy', settings: { category: 'all', model: 'guided' } });
  await expect(r.locator('.wp-fermi-lab')).toHaveAttribute('data-phase', 'model');
  for (const id of ['fl-use-model', 'fl-row-0-exp-plus']) {
    const el = r.getByTestId(id);
    if ((await el.count()) === 0) continue;
    const box = (await el.boundingBox())!;
    expect(box.height, id).toBeGreaterThanOrEqual(44);
  }
  expect(await overflow()).toBeLessThanOrEqual(0);
});
