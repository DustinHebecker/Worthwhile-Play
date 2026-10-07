import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedCircuit {
  size: number;
  source: number;
  solution: number[];
  masks: number[];
  locked: boolean[];
  moves: number;
}

const root = (page: Page) => page.getByTestId('game-root');
const tile = (page: Page, r: number, c: number) => root(page).getByTestId(`tile-${r}-${c}`);
const saved = async (page: Page) => ((await readSave(page, 'circuit-puzzle')) as { state: SavedCircuit }).state;

test('circuit: turned tiles survive a reload exactly', async ({ page }) => {
  let rotAfter = '';
  await expectResumeAfterReload(page, 'circuit-puzzle', async (p) => {
    const before = await tile(p, 0, 0).getAttribute('data-mask');
    await tile(p, 0, 0).click();
    await expect(tile(p, 0, 0)).not.toHaveAttribute('data-mask', before ?? '');
    await tile(p, 1, 1).click({ button: 'right' });
    rotAfter = (await tile(p, 0, 0).getAttribute('data-rot')) ?? '';
  });

  // The restored board visibly matches the saved logical state, tile by tile.
  const state = await saved(page);
  expect(state.moves).toBe(2);
  await expect(tile(page, 0, 0)).toHaveAttribute('data-rot', rotAfter);
  for (let i = 0; i < state.masks.length; i++) {
    const [r, c] = [Math.floor(i / state.size), i % state.size];
    await expect(tile(page, r, c)).toHaveAttribute('data-mask', String(state.masks[i]));
  }
  const [sr, sc] = [Math.floor(state.source / state.size), state.source % state.size];
  await expect(tile(page, sr, sc)).toHaveAttribute('data-powered', 'true');
});

test('circuit: keyboard play and completing the circuit ends the game calmly', async ({ page }) => {
  await page.goto('/games/circuit-puzzle?seed=1234&difficulty=easy');
  await page.getByTestId('new-game').click();
  const first = tile(page, 0, 0);
  await first.focus();
  const m0 = await first.getAttribute('data-mask');
  await page.keyboard.press('Space');
  await page.keyboard.press('Shift+Space');
  await expect(first).toHaveAttribute('data-mask', m0 ?? '');
  await page.keyboard.press('ArrowRight');
  await expect(tile(page, 0, 1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await readSave(page, 'circuit-puzzle')) !== undefined).toBe(true);

  // Turn every tile to the recorded target configuration.
  const state = await saved(page);
  for (let i = 0; i < state.solution.length; i++) {
    const [r, c] = [Math.floor(i / state.size), i % state.size];
    for (let k = 0; k < 4; k++) {
      if ((await tile(page, r, c).getAttribute('data-mask')) === String(state.solution[i])) break;
      if ((await root(page).getByTestId('cp-status').getAttribute('data-status')) === 'solved') break;
      await tile(page, r, c).click();
    }
  }
  await expect(root(page).getByTestId('cp-status')).toHaveAttribute('data-status', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('circuit: the 9×9 board fits a phone with tiles of at least 36 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/circuit-puzzle?difficulty=hard');
  await page.getByTestId('new-game').click();
  await expect(tile(page, 8, 8)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await tile(page, 8, 8).boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(36);
});
