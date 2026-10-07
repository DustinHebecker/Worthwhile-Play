// @ts-nocheck
import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const token = (page: Page, id: string) => root(page).getByTestId(`entity-${id}`);
const sides = (page: Page) =>
  root(page)
    .locator('[data-testid^="entity-"]')
    .evaluateAll((tokens) => tokens.map((t) => `${t.getAttribute('data-testid')}=${t.getAttribute('data-side')}`).sort());

test('river-crossing: boat load and crossings survive a reload', async ({ page }) => {
  let before: string[] = [];
  let crossings: string | null = null;
  await expectResumeAfterReload(page, 'river-crossing', async (p) => {
    // The puzzle depends on the random seed. The first figure of every easy puzzle can row.
    const first = root(p).locator('[data-testid^="entity-"][data-side="left"]').first();
    await first.click();
    await expect(first).toHaveAttribute('data-side', 'boat');
    // Some puzzles forbid crossing alone: then the reason is shown and nothing changes.
    await root(p).getByTestId('rc-cross').click();
    await expect(root(p).getByTestId('rc-status')).not.toBeEmpty();
    before = await sides(p);
    crossings = await root(p).getByTestId('rc-crossings').getAttribute('data-value');
  });

  expect(await sides(page)).toEqual(before);
  await expect(root(page).getByTestId('rc-crossings')).toHaveAttribute('data-value', crossings ?? '');
  await expect(root(page).locator('[data-testid^="entity-"][data-side="boat"]')).toHaveCount(1);
});

test('river-crossing: fits a 360 px phone, explains a broken rule and plays by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  // Easy puzzle 7 "Garden ferry": gardener (rows), dog, goose, seeds.
  await page.goto('/games/river-crossing?seed=6&difficulty=easy');
  await expect(root(page).getByTestId('rc-puzzle')).toContainText('7');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const id of ['gardener', 'dog', 'goose', 'seeds']) {
    const box = await token(page, id).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  }

  // The gardener alone would leave the goose with the dog: not carried out, explained.
  await token(page, 'gardener').click();
  await root(page).getByTestId('rc-cross').click();
  await expect(root(page).getByTestId('rc-status')).toHaveAttribute('data-state', 'blocked');
  await expect(root(page).getByTestId('rc-crossings')).toHaveAttribute('data-value', '0');
  await expect(token(page, 'goose')).toHaveAttribute('data-side', 'left');

  // Keyboard: Enter boards the goose, C crosses, U undoes.
  await token(page, 'goose').focus();
  await page.keyboard.press('Enter');
  await expect(token(page, 'goose')).toHaveAttribute('data-side', 'boat');
  await page.keyboard.press('c');
  await expect(root(page).getByTestId('rc-crossings')).toHaveAttribute('data-value', '1');
  await expect(root(page).getByTestId('rc-scene')).toHaveAttribute('data-boat', 'right');
  await page.keyboard.press('u');
  await expect(root(page).getByTestId('rc-crossings')).toHaveAttribute('data-value', '0');
  await expect(root(page).getByTestId('rc-scene')).toHaveAttribute('data-boat', 'left');
});

test('river-crossing: solving shows the optimum', async ({ page }) => {
  await page.goto('/games/river-crossing?seed=6&difficulty=easy');
  const plan = [['gardener', 'goose'], ['gardener'], ['gardener', 'dog'], ['gardener', 'goose'], ['gardener', 'seeds'], ['gardener'], ['gardener', 'goose']];
  for (const group of plan) {
    for (const id of ['gardener', 'dog', 'goose', 'seeds']) {
      const inBoat = (await token(page, id).getAttribute('data-side')) === 'boat';
      if (inBoat !== group.includes(id)) await token(page, id).click();
    }
    await root(page).getByTestId('rc-cross').click();
  }
  await expect(root(page).getByTestId('rc-status')).toHaveAttribute('data-state', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect(root(page).getByTestId('rc-status')).toContainText('7');
  for (const id of ['gardener', 'dog', 'goose', 'seeds']) await expect(token(page, id)).not.toHaveAttribute('data-side', 'left');
});
