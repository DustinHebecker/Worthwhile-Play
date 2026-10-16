import { expect, test, type Page } from '@playwright/test';
import { newGame, readSave, startGame, submitStart } from '../packages/testing/src/e2e';
import { wordList } from '../packages/games/word-guess/src/words';

/** One start screen for every game (ADR 0017). */

const saved = async (page: Page, id: string) => (await readSave(page, id)) as { seed: number; difficulty?: string; state: Record<string, unknown> } | undefined;

test('without a save: the start screen has the settings and Start (focused); Enter starts', async ({ page }) => {
  await page.goto('/games/lights-out');
  const start = page.getByTestId('start-game');
  await expect(start).toBeFocused();
  await expect(page.getByTestId('continue')).toHaveCount(0);
  await expect(page.getByTestId('start-form')).toHaveAccessibleName('New game');
  // Difficulty as radio buttons in a fieldset with a legend.
  const difficulty = page.getByTestId('difficulty');
  await expect(difficulty.locator('legend')).toHaveText('Difficulty');
  await expect(difficulty.locator('input[type="radio"]')).not.toHaveCount(0);
  await difficulty.locator('input[value="hard"]').check();
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('game-root')).toBeVisible();
  await expect.poll(async () => (await saved(page, 'lights-out'))?.difficulty).toBe('hard');
  // During play: only "New game" (and a summary), no difficulty control.
  await expect(page.getByTestId('new-game')).toBeVisible();
  await expect(page.getByTestId('difficulty')).toHaveCount(0);
  await expect(page.getByTestId('settings-summary')).toHaveText(/^Hard/);
});

test('with a save: Continue first (focused), the remembered settings below it', async ({ page }) => {
  await startGame(page, 'lights-out', { difficulty: 'hard' });
  await expect.poll(async () => (await saved(page, 'lights-out'))?.difficulty).toBe('hard');
  const before = (await saved(page, 'lights-out'))!.seed;
  await page.reload();
  await expect(page.getByTestId('continue')).toBeFocused();
  await expect(page.getByTestId('difficulty').locator('input[value="hard"]')).toBeChecked();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  expect((await saved(page, 'lights-out'))!.seed).toBe(before);
});

test('New game during play opens the start screen; Continue returns to the same game; Start begins a new one', async ({ page }) => {
  await startGame(page, 'lights-out', { difficulty: 'easy' });
  await expect.poll(async () => (await saved(page, 'lights-out'))?.difficulty).toBe('easy');
  const first = (await saved(page, 'lights-out'))!;
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeHidden();
  await expect(page.getByTestId('continue')).toBeFocused();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  expect(await saved(page, 'lights-out')).toMatchObject({ seed: first.seed, state: first.state });

  await newGame(page, { difficulty: 'hard' });
  await expect.poll(async () => (await saved(page, 'lights-out'))?.difficulty).toBe('hard');
  expect((await saved(page, 'lights-out'))!.seed).not.toBe(first.seed);
});

test('after a natural end: "Another round" repeats the settings, "Change settings" opens the start screen', async ({ page }) => {
  await startGame(page, 'word-guess', { difficulty: 'medium' });
  const root = page.getByTestId('game-root');
  await expect(root.getByTestId('wg-grid')).toBeVisible();
  await expect.poll(async () => (await saved(page, 'word-guess'))?.difficulty).toBe('medium');
  const win = async () => {
    const state = (await saved(page, 'word-guess'))!.state as { language: 'en' | 'de'; difficulty: string; answer: number };
    const answer = wordList(state.language, state.difficulty === 'hard' ? 6 : 5)[state.answer] ?? '';
    for (const letter of answer) await root.getByTestId(`wg-key-${letter}`).click();
    await root.getByTestId('wg-enter').click();
    await expect(page.getByTestId('finished')).toBeVisible();
  };
  await win();
  const seed = (await saved(page, 'word-guess'))!.seed;
  await page.getByTestId('another-round').click();
  await expect(page.getByTestId('finished')).toBeHidden();
  await expect.poll(async () => (await saved(page, 'word-guess'))?.seed).not.toBe(seed);
  expect((await saved(page, 'word-guess'))!.difficulty).toBe('medium');

  await win();
  await page.getByTestId('change-settings').click();
  await expect(page.getByTestId('start-game')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeHidden();
  await expect(page.getByTestId('difficulty').locator('input[value="medium"]')).toBeChecked();
  await submitStart(page, { difficulty: 'easy' });
  await expect.poll(async () => (await saved(page, 'word-guess'))?.difficulty).toBe('easy');
});

test('the start screen fits 360 px in an RTL locale with 44 px targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.addInitScript(() => localStorage.setItem('worthwhile-play:ui-locale', 'ar'));
  await page.goto('/games/laser-circuit');
  await expect(page.getByTestId('start-game')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  for (const target of await page.locator('[data-testid="start-screen"] label.setting-option, [data-testid="start-game"]').all()) {
    const box = (await target.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
});
