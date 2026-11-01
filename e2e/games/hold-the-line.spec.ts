import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const game = (page: Page) => root(page).locator('.wp-hold-the-line');

test('hold-the-line: a plan and a paused battle survive a reload at the same tick', async ({ page }) => {
  let tick = '';
  await expectResumeAfterReload(page, 'hold-the-line', async (p) => {
    await root(p).getByTestId('cell-5-12').click();
    await root(p).getByTestId('build-gun').click();
    await root(p).getByTestId('buy-walker').click();
    await root(p).getByTestId('buy-walker').click();
    await expect(root(p).getByTestId('credits')).toHaveAttribute('data-value', '160');
    await root(p).getByTestId('lock').click();
    await expect(game(p)).toHaveAttribute('data-phase', 'battle');
    await expect.poll(async () => Number(await game(p).getAttribute('data-tick'))).toBeGreaterThan(10);
    await root(p).getByTestId('play').click();
    tick = (await game(p).getAttribute('data-tick')) ?? '';
  });
  await expect(game(page)).toHaveAttribute('data-phase', 'battle');
  await expect(game(page)).toHaveAttribute('data-tick', tick);
  await root(page).getByTestId('instant').click();
  await expect(game(page)).toHaveAttribute('data-phase', 'plan');
  await expect(game(page)).toHaveAttribute('data-round', '1');
  // After the round both sides' last waves are known.
  await expect(root(page).getByTestId('intel-theirs')).toBeVisible();
});

test('hold-the-line: 44 px cells on a 360 px phone and locking by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, 'hold-the-line');
  const first = await root(page).getByTestId('cell-0-0').boundingBox();
  const last = await root(page).getByTestId('cell-6-16').boundingBox();
  expect(first!.width).toBeGreaterThanOrEqual(44);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await root(page).getByTestId('cell-0-0').focus();
  await page.keyboard.press('ArrowDown');
  await expect(root(page).getByTestId('cell-0-1')).toBeFocused();
  await page.keyboard.press(' ');
  await expect(game(page)).toHaveAttribute('data-phase', 'battle');
});

test('hold-the-line: a whole game ends calmly with a result', async ({ page }) => {
  await startGame(page, 'hold-the-line', { difficulty: 'easy' });
  for (let round = 0; round < 10; round++) {
    if ((await game(page).getAttribute('data-phase')) !== 'plan') break;
    await root(page).getByTestId('buy-walker').click();
    await root(page).getByTestId('lock').click();
    await root(page).getByTestId('instant').click();
  }
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect(root(page).getByTestId('status')).toBeVisible();
  const saved = (await readSave(page, 'hold-the-line')) as { state: { phase: string } };
  expect(['won', 'lost', 'draw']).toContain(saved.state.phase);
});

test('hold-the-line: Outside force is chosen on the start screen, needs no shop and survives a reload', async ({ page }) => {
  await startGame(page, 'hold-the-line', { settings: { mode: 'external-small' }, difficulty: 'easy' });
  await expect(root(page).getByTestId('outside-wave')).toBeVisible();
  await expect(root(page).getByTestId('shop')).toBeHidden();
  // The force comes in at the middle row: both entry cells are road.
  await expect(root(page).getByTestId('cell-2-8')).toHaveAttribute('aria-label', /road/);
  await expect(root(page).getByTestId('cell-4-8')).toHaveAttribute('aria-label', /road/);
  await root(page).getByTestId('cell-3-9').click();
  await root(page).getByTestId('build-gun').click();
  await root(page).getByTestId('lock').click();
  await expect(game(page)).toHaveAttribute('data-phase', 'battle');
  await root(page).getByTestId('instant').click();
  await expect(game(page)).toHaveAttribute('data-round', '1');
  // After a round, what got through is shown with the extra units it brings.
  await expect(root(page).getByTestId('outside-pressure')).toBeVisible();
  await expect.poll(async () => ((await readSave(page, 'hold-the-line')) as { state?: { mode?: string } } | undefined)?.state?.mode).toBe('external-small');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(game(page)).toHaveAttribute('data-round', '1');
  await expect(root(page).getByTestId('outside-wave')).toBeVisible();
  await expect(root(page).getByTestId('shop')).toBeHidden();
});
