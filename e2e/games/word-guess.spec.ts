import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';
import { wordList } from '../../packages/games/word-guess/src/words';

interface SavedWordGuess {
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'de';
  answer: number;
  guesses: string[];
  input: string;
}

const root = (page: Page) => page.getByTestId('game-root');
const tile = (page: Page, r: number, c: number) => root(page).getByTestId(`wg-tile-${r}-${c}`);
const saved = async (page: Page) => ((await readSave(page, 'word-guess')) as { state: SavedWordGuess }).state;

test('word-guess: a submitted guess and a half-typed word survive a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'word-guess', async (p) => {
    // Physical keyboard: letters, Enter, then an unfinished word.
    await p.keyboard.type('qzqzq');
    await p.keyboard.press('Enter');
    await expect(tile(p, 0, 0)).not.toHaveAttribute('data-mark', '');
    await p.keyboard.type('ab');
    await expect(tile(p, 1, 1)).toHaveAttribute('data-letter', 'b');
  });

  const state = await saved(page);
  expect(state.guesses).toEqual(['qzqzq']);
  expect(state.input).toBe('ab');
  for (const [c, letter] of [...'qzqzq'].entries()) {
    await expect(tile(page, 0, c)).toHaveAttribute('data-letter', letter);
    await expect(tile(page, 0, c)).toHaveAttribute('data-mark', /^(hit|near|miss)$/);
  }
  await expect(tile(page, 1, 0)).toHaveAttribute('data-letter', 'a');
  await expect(tile(page, 1, 1)).toHaveAttribute('data-letter', 'b');
  await expect(tile(page, 1, 2)).toHaveAttribute('data-letter', '');
});

test('word-guess: typing the answer of a known game number wins calmly', async ({ page }) => {
  await page.goto('/games/word-guess?seed=4242&difficulty=medium');
  await expect(root(page).getByTestId('wg-grid')).toBeVisible();
  await expect.poll(async () => (await readSave(page, 'word-guess')) !== undefined).toBe(true);
  const state = await saved(page);
  const answer = wordList(state.language, state.difficulty === 'hard' ? 6 : 5)[state.answer] ?? '';
  expect(answer).toHaveLength(5);

  // A short guess is explained, not counted.
  await root(page).getByTestId('wg-grid').focus();
  await page.keyboard.type(answer.slice(0, 3));
  await page.keyboard.press('Enter');
  await expect(root(page).getByTestId('wg-message')).toBeVisible();
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  // On-screen keys work too.
  for (const letter of answer) await root(page).getByTestId(`wg-key-${letter}`).click();
  await root(page).getByTestId('wg-enter').click();
  for (let c = 0; c < 5; c++) await expect(tile(page, 0, c)).toHaveAttribute('data-mark', 'hit');
  await expect(root(page).getByTestId('wg-answer')).toHaveAttribute('data-word', answer);
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('word-guess: the keyboard fits a 360 px phone; the large layout keeps 44 px keys', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/games/word-guess?seed=7&difficulty=hard');
  await expect(root(page).getByTestId('wg-keyboard')).toBeVisible();
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  const boxes = () =>
    root(page)
      .locator('[data-testid^="wg-key-"], [data-testid="wg-enter"], [data-testid="wg-back"]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as { x: number; width: number; height: number }));
  for (const box of await boxes()) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }

  await root(page).getByTestId('wg-layout').selectOption('large');
  await expect(root(page).getByTestId('wg-keyboard')).toHaveClass(/wg-layout-large/);
  expect(await overflow()).toBeLessThanOrEqual(0);
  for (const box of await boxes()) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
});
