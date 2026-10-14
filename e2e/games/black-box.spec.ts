import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');

test('black-box: experiments and an open hypothesis test survive a reload', async ({ page }) => {
  // The default difficulty (easy) always uses a single whole number x from 0 to 20.
  await expectResumeAfterReload(page, 'black-box', async (p) => {
    await root(p).getByTestId('bb-input-0').fill('3');
    await root(p).getByTestId('bb-run').click();
    await expect(root(p).getByTestId('bb-log-row-0')).toHaveAttribute('data-input', '3');
    await root(p).getByTestId('bb-input-0').fill('5');
    await root(p).getByTestId('bb-run').click();
    await expect(root(p).getByTestId('bb-log-row-1')).toHaveAttribute('data-input', '5');
    await root(p).getByTestId('bb-test').click();
    await root(p).getByTestId('bb-predict-0').fill('1');
  });

  await expect(root(page).getByTestId('bb-log-row-0')).toHaveAttribute('data-input', '3');
  await expect(root(page).getByTestId('bb-log-row-1')).toHaveAttribute('data-input', '5');
  await expect(root(page).getByTestId('bb-status')).toHaveAttribute('data-phase', 'testing');
  await expect(root(page).getByTestId('bb-predict-0')).toHaveValue('1');
  await expect(root(page).getByTestId('bb-submit')).toBeVisible();
});

test('black-box: keyboard entry runs an experiment and repeated inputs are not logged twice', async ({ page }) => {
  await page.goto('/games/black-box');
  await page.getByTestId('new-game').click();
  const field = root(page).getByTestId('bb-input-0');
  await field.fill('7');
  await field.press('Enter');
  await expect(root(page).getByTestId('bb-log-row-0')).toHaveAttribute('data-input', '7');
  await field.press('Enter');
  await expect(root(page).locator('[data-testid^="bb-log-row-"]')).toHaveCount(1);
  await expect(root(page).getByTestId('bb-notice')).toBeVisible();
});

/** The defining formula of an easy rule, written in the player syntax. */
function easyFormula(family: string, p: number[]): string {
  switch (family) {
    case 'linear':
      return `${p[0]}x + ${p[1]}`;
    case 'square':
      return `x^2 + ${p[0]}`;
    case 'mod':
      return `x mod ${p[0]}`;
    default:
      return `x >= ${p[0]} ? ${p[2]} : ${p[1]}`;
  }
}

test('black-box: a wrong formula reveals a counterexample, the right one solves the rule', async ({ page }) => {
  await page.goto('/games/black-box?seed=4242&difficulty=easy');
  await page.getByTestId('new-game').click();
  await root(page).getByTestId('bb-test').click();
  await root(page).getByTestId('bb-proof-formula').check();
  const field = root(page).getByTestId('bb-formula');
  await expect(field).toBeVisible();

  // A parse error is explained and not counted.
  await field.fill('x +');
  await field.press('Enter');
  await expect(root(page).getByTestId('bb-formula-error')).toBeVisible();
  await expect(root(page).getByTestId('bb-stats')).toHaveAttribute('data-tests', '0');

  // A wrong formula: one counterexample lands in the log and counts as a test.
  await field.fill('x + 1000');
  await root(page).getByTestId('bb-check-formula').click();
  await expect(root(page).getByTestId('bb-formula-result')).toBeVisible();
  await expect(root(page).getByTestId('bb-log-row-0')).toHaveAttribute('data-source', 'test');
  await expect(root(page).getByTestId('bb-stats')).toHaveAttribute('data-tests', '1');

  const saved = (await readSave(page, 'black-box')) as { state: { family: string; params: number[] } };
  const formula = easyFormula(saved.state.family, saved.state.params);
  await field.fill(formula);
  await field.press('Enter');
  await expect(root(page).getByTestId('bb-status')).toHaveAttribute('data-phase', 'solved');
  await expect(root(page).getByTestId('bb-solved-formula')).toContainText(formula);
});

test('black-box: a typed formula and the chosen proof survive a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'black-box', async (p) => {
    await root(p).getByTestId('bb-test').click();
    await root(p).getByTestId('bb-proof-formula').check();
    await root(p).getByTestId('bb-formula').fill('3*x - (');
  });
  await expect(root(page).getByTestId('bb-status')).toHaveAttribute('data-phase', 'testing');
  await expect(root(page).getByTestId('bb-proof-formula')).toBeChecked();
  await expect(root(page).getByTestId('bb-formula')).toHaveValue('3*x - (');
  await expect(root(page).getByTestId('bb-check-formula')).toBeVisible();
});
