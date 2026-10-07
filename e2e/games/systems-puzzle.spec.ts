import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const levels = (page: Page) =>
  root(page)
    .locator('[data-testid^="tank-"]')
    .evaluateAll((tanks) => tanks.map((t) => `${t.getAttribute('data-testid')}=${t.getAttribute('data-level')}`));
const valves = (page: Page) =>
  root(page)
    .locator('[data-testid^="valve-"]')
    .evaluateAll((items) => items.map((v) => `${v.getAttribute('data-testid')}=${v.getAttribute('data-open')}`));

test('systems-puzzle: valves, ticks and tank levels survive a reload', async ({ page }) => {
  let beforeLevels: string[] = [];
  let beforeValves: string[] = [];
  let tick: string | null = null;
  await expectResumeAfterReload(page, 'systems-puzzle', async (p) => {
    // Every puzzle has a valve 1 whose source tank starts with water.
    await root(p).getByTestId('valve-1').click();
    await expect(root(p).getByTestId('valve-1')).toHaveAttribute('data-open', 'true');
    await root(p).getByTestId('fl-step').click();
    await expect(root(p).getByTestId('fl-tick')).toHaveAttribute('data-value', '1');
    beforeLevels = await levels(p);
    beforeValves = await valves(p);
    tick = await root(p).getByTestId('fl-tick').getAttribute('data-value');
  });

  expect(await levels(page)).toEqual(beforeLevels);
  expect(await valves(page)).toEqual(beforeValves);
  await expect(root(page).getByTestId('fl-tick')).toHaveAttribute('data-value', tick ?? '');
  await expect(root(page).getByTestId('valve-1')).toHaveAttribute('data-open', 'true');
});

test('systems-puzzle: fits a 360 px phone, explains overflow and solves easy puzzle 1', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  // Easy puzzle 1: A 6/8 → (1) B 0/3 → (2) C 0/8, B → (3) D 0/4. Goal: C exactly 5 L.
  await page.goto('/games/systems-puzzle?seed=0&difficulty=easy');
  await expect(root(page).getByTestId('fl-puzzle')).toContainText('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const id of ['valve-1', 'valve-2', 'valve-3', 'fl-step', 'fl-run', 'fl-reset']) {
    const box = await root(page).getByTestId(id).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  }

  // Only valve 1 open: B (3 L) overflows on the second tick, explained in words.
  await root(page).getByTestId('valve-1').click();
  await root(page).getByTestId('fl-step').click();
  await root(page).getByTestId('fl-step').click();
  await expect(root(page).getByTestId('tank-B')).toHaveAttribute('data-level', '3');
  await expect(root(page).getByTestId('fl-events')).toContainText('B');
  await expect(root(page).getByTestId('fl-status')).toHaveAttribute('data-state', 'info');

  // Start over: valves 1 and 2 open (keyboard for valve 2), run to the end.
  await root(page).getByTestId('fl-reset').click();
  await expect(root(page).getByTestId('fl-tick')).toHaveAttribute('data-value', '0');
  await root(page).getByTestId('valve-1').click();
  await root(page).getByTestId('valve-1').focus();
  await page.keyboard.press('2');
  await expect(root(page).getByTestId('valve-2')).toHaveAttribute('data-open', 'true');
  await root(page).getByTestId('fl-run').click();
  await expect(root(page).getByTestId('tank-C')).toHaveAttribute('data-level', '5');
  await expect(root(page).getByTestId('fl-status')).toHaveAttribute('data-state', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});
