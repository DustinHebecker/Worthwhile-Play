import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const GAME = 'chess';
const SQUARES = Array.from({ length: 64 }, (_, i) => 'abcdefgh'[i % 8]! + String(Math.floor(i / 8) + 1));

/** data-piece of all 64 squares, a1 first. */
const boardPieces = (page: Page) => Promise.all(SQUARES.map((s) => page.getByTestId(`sq-${s}`).getAttribute('data-piece')));
const tap = async (page: Page, ...squares: string[]) => {
  for (const s of squares) await page.getByTestId(`sq-${s}`).click();
};

async function startNewGame(page: Page) {
  await page.goto(`/games/${GAME}`);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  await expect(page.getByTestId('sq-e2')).toHaveAttribute('data-piece', 'wP');
}

test('resumes after reload with the same position and move list', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await tap(p, 'e2', 'e4');
    // Default opponent is the computer: its reply belongs to the same logical step.
    await expect(p.getByTestId('ply-1')).toBeVisible({ timeout: 10_000 });
    before = await boardPieces(p);
  });
  await expect(page.getByTestId('sq-e4')).toHaveAttribute('data-piece', 'wP');
  await expect(page.getByTestId('ply-1')).toBeVisible();
  expect(await boardPieces(page)).toEqual(before);
});

test('two people can play a short game to checkmate', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('menu').getByText('Two players').click();
  await page.getByTestId('start').click();
  await expect(page.getByTestId('current-human')).toBeVisible();
  await tap(page, 'f2', 'f3', 'e7', 'e5', 'g2', 'g4', 'd8', 'h4');
  await expect(page.locator('.wp-chess')).toHaveAttribute('data-outcome', 'checkmate');
  await expect(page.getByTestId('sq-e1')).toHaveAttribute('data-check', '');
  await expect(page.getByTestId('ply-3')).toHaveText('♕h4#');
});

test('is playable with the keyboard', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('sq-e2').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('sq-e4')).toHaveAttribute('data-target', 'move');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(page.getByTestId('sq-e4')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('sq-e4')).toHaveAttribute('data-piece', 'wP');
});

test('solves a mate-in-one puzzle with the help of the hint', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('menu').getByText('Mate in N').click();
  await page.getByTestId('menu-mate').getByText('1', { exact: true }).click();
  await page.getByTestId('start').click();
  await expect(page.getByTestId('next-puzzle')).toBeVisible();
  await page.getByTestId('hint').click();
  await expect(page.locator('[data-hint]')).toHaveCount(2);
  const turn = await page.locator('.wp-chess').getAttribute('data-turn');
  const squares = await page.locator('[data-hint]').evaluateAll((els) => els.map((el) => [el.getAttribute('data-square'), el.getAttribute('data-piece')]));
  const from = squares.find(([, piece]) => piece?.startsWith(turn ?? 'w'))![0]!;
  const to = squares.find(([square]) => square !== from)![0]!;
  await tap(page, from, to);
  if (await page.getByTestId('promotion').isVisible()) {
    // The hint names the piece in figurine notation, e.g. "e8=♘#".
    const hint = (await page.getByTestId('explanation').textContent()) ?? '';
    const piece = ({ '♕': 'q', '♖': 'r', '♗': 'b', '♘': 'n' } as Record<string, string>)[/=(.)/.exec(hint)?.[1] ?? '♕'] ?? 'q';
    await page.getByTestId(`promote-${piece}`).click();
  }
  await expect(page.locator('.wp-chess')).toHaveAttribute('data-outcome', 'checkmate');
});

test('the menu above the board is keyboard operable and asks before replacing a running game', async ({ page }) => {
  await startNewGame(page);
  const menu = page.getByTestId('menu');
  const board = page.getByTestId('board');
  expect((await menu.boundingBox())!.y).toBeLessThan((await board.boundingBox())!.y);
  await tap(page, 'e2', 'e4');
  await expect(page.getByTestId('ply-1')).toBeVisible({ timeout: 10_000 });
  // Arrow keys move the choice within the radio group; nothing starts until "Start".
  await page.getByTestId('mode-computer').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('mode-human')).toBeChecked();
  await expect(page.getByTestId('mode-human')).toBeFocused();
  await expect(page.getByTestId('menu-strength')).toBeHidden();
  await expect(page.getByTestId('current-computer')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('start')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('start-confirm')).toBeVisible();
  await expect(page.getByTestId('start-yes')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('start-confirm')).toBeHidden();
  await expect(page.getByTestId('ply-1')).toBeVisible();
  await page.getByTestId('start').click();
  await page.getByTestId('start-yes').click();
  await expect(page.getByTestId('current-human')).toBeVisible();
  await expect(page.getByTestId('ply-0')).toHaveCount(0);
});

test('fits a 360px-wide phone without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startNewGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await page.getByTestId('sq-a1').boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(38);
  // Menu entries keep 44px touch targets.
  for (const id of ['mode-computer', 'mode-human', 'mode-best', 'mode-mate']) {
    const option = await page.getByTestId(id).locator('xpath=..').boundingBox();
    expect(option?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});
