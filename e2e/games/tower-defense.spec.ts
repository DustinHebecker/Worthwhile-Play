import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, startGame } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const game = (page: Page) => root(page).locator('.wp-tower-defense');

test('tower-defense: a build and a paused wave survive a reload at the same tick', async ({ page }) => {
  let tick = '';
  await expectResumeAfterReload(page, 'tower-defense', async (p) => {
    await root(p).getByTestId('cell-2-2').click();
    await root(p).getByTestId('build-gun').click();
    await root(p).getByTestId('cell-2-4').click();
    await root(p).getByTestId('build-gun').click();
    await expect(root(p).getByTestId('credits')).toHaveAttribute('data-value', '100');
    await root(p).getByTestId('start').click();
    await expect(game(p)).toHaveAttribute('data-phase', 'wave');
    await expect.poll(async () => Number(await game(p).getAttribute('data-tick'))).toBeGreaterThan(10);
    await root(p).getByTestId('play').click();
    tick = (await game(p).getAttribute('data-tick')) ?? '';
  });
  await expect(game(page)).toHaveAttribute('data-phase', 'wave');
  await expect(game(page)).toHaveAttribute('data-tick', tick);
  // Resolve the rest at once: back in the build phase of wave 2 with bounties earned.
  await root(page).getByTestId('instant').click();
  await expect(game(page)).toHaveAttribute('data-phase', 'build');
  await expect(game(page)).toHaveAttribute('data-wave-index', '1');
  await expect(root(page).getByTestId('status')).toBeVisible();
  expect(Number(await root(page).getByTestId('credits').getAttribute('data-value'))).toBeGreaterThan(100);
});

test('tower-defense: 44 px cells on a 360 px phone, building and starting by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, 'tower-defense');
  const first = await root(page).getByTestId('cell-0-0').boundingBox();
  const last = await root(page).getByTestId('cell-6-12').boundingBox();
  expect(first!.width).toBeGreaterThanOrEqual(44);
  expect(first!.height).toBeGreaterThanOrEqual(44);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  await root(page).getByTestId('cell-0-0').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(root(page).getByTestId('cell-2-2')).toBeFocused();
  await page.keyboard.press('1');
  await expect(root(page).getByTestId('credits')).toHaveAttribute('data-value', '200');
  await page.keyboard.press(' ');
  await expect(game(page)).toHaveAttribute('data-phase', 'wave');
});

test('tower-defense: an undefended game is lost, can be retried, and ends calmly on request', async ({ page }) => {
  await startGame(page, 'tower-defense', { difficulty: 'hard' });
  for (let i = 0; i < 6; i++) {
    if ((await game(page).getAttribute('data-phase')) !== 'build') break;
    await root(page).getByTestId('start').click();
    await root(page).getByTestId('instant').click();
  }
  await expect(game(page)).toHaveAttribute('data-phase', 'lost');
  await root(page).getByTestId('retry').click();
  await expect(game(page)).toHaveAttribute('data-phase', 'build');
  await root(page).getByTestId('start').click();
  await root(page).getByTestId('instant').click();
  await expect(game(page)).toHaveAttribute('data-phase', 'lost');
  await root(page).getByTestId('give-up').click();
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('tower-defense: the map is chosen on the start screen and kept in the save', async ({ page }) => {
  await startGame(page, 'tower-defense', { settings: { map: 'twin' } });
  await expect(root(page).getByTestId('wave')).toContainText('12');
  // Two road entries on the twin map: both corner cells are road.
  await expect(root(page).getByTestId('cell-0-0')).toHaveAttribute('aria-label', /road/);
  await expect(root(page).getByTestId('cell-6-0')).toHaveAttribute('aria-label', /road/);
});
