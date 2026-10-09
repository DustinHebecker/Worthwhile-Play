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

test('a strength chosen in the menu becomes the host difficulty and the menu choice survives a reload', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('strength-strong').check({ force: true }); // visually hidden native radio inside a styled label
  await page.getByTestId('mode-human').check({ force: true }); // visually hidden native radio inside a styled label
  await page.getByTestId('mode-computer').check({ force: true }); // visually hidden native radio inside a styled label
  await page.getByTestId('start').click();
  await expect(page.locator('#difficulty')).toHaveValue('strong');
  await page.getByTestId('mode-human').check({ force: true }); // visually hidden native radio inside a styled label
  await page.getByTestId('start').click();
  if (await page.getByTestId('start-yes').isVisible()) await page.getByTestId('start-yes').click();
  await expect(page.getByTestId('current-human')).toBeVisible();
  // After a reload, a fresh "New game" starts the remembered kind of game (two players).
  await page.reload();
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('current-human')).toBeVisible();
});

test('a random colour is drawn at the start and shown', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('color-random').check({ force: true }); // visually hidden native radio inside a styled label
  await page.getByTestId('start').click();
  await expect(page.getByTestId('mode')).toContainText(/drawn at random/);
  const colour = (await page.getByTestId('mode').textContent())!.includes('White') ? 'w' : 'b';
  // The board is turned to the drawn colour; as Black the computer has already opened.
  await expect(page.locator('.wp-chess')).toHaveAttribute('data-orientation', colour);
  await expect(page.getByTestId('status')).toHaveText(`Your move — you play ${colour === 'w' ? 'White' : 'Black'}.`);
  if (colour === 'b') await expect(page.getByTestId('ply-0')).toBeVisible();
  // The choice "random" is remembered for the next game.
  await page.reload();
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('color-random')).toBeChecked();
  await expect(page.getByTestId('mode')).toContainText(/drawn at random/);
});

test('the variation board plays both sides without changing the game and survives a reload', async ({ page }) => {
  let before: (string | null)[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await tap(p, 'e2', 'e4');
    await expect(p.getByTestId('ply-1')).toBeVisible({ timeout: 10_000 });
    before = await boardPieces(p);
    await p.getByTestId('variation-open').click();
    await expect(p.getByTestId('var-board')).toBeVisible();
    await expect(p.getByTestId('var-board')).toHaveAttribute('aria-label', 'Variation board');
    for (const s of ['g1', 'f3']) await p.getByTestId(`var-sq-${s}`).click();
    await expect(p.getByTestId('var-sq-f3')).toHaveAttribute('data-piece', 'wN');
    // Black's reply on the variation board is the person's own choice: any black knight move.
    const knight = (await p.getByTestId('var-sq-b8').getAttribute('data-piece')) === 'bN' ? ['b8', 'a6'] : ['g8', 'h6'];
    for (const s of knight) await p.getByTestId(`var-sq-${s}`).click();
    await expect(p.getByTestId(`var-sq-${knight[1]}`)).toHaveAttribute('data-piece', 'bN');
    await expect(p.getByTestId('var-ply-1')).toBeVisible();
  });
  // After the reload the variation is open again, with its moves; the game itself is unchanged.
  await expect(page.getByTestId('var-board')).toBeVisible();
  await expect(page.getByTestId('var-sq-f3')).toHaveAttribute('data-piece', 'wN');
  await page.getByTestId('var-back').click();
  await expect(page.getByTestId('var-sq-f3')).toHaveAttribute('data-piece', 'wN');
  await page.getByTestId('var-back').click();
  await expect(page.getByTestId('var-sq-f3')).toHaveAttribute('data-piece', '');
  await page.getByTestId('var-close').click();
  await expect(page.getByTestId('variation')).toBeHidden();
  await expect(page.getByTestId('board')).toBeVisible();
  expect(await boardPieces(page)).toEqual(before);
  await expect(page.getByTestId('ply-2')).toHaveCount(0);
  await expect(page.getByTestId('variation-open')).toBeFocused();
});

test('on a 360px phone the variation board replaces the game view without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startNewGame(page);
  await page.getByTestId('variation-open').click();
  await expect(page.getByTestId('board')).toBeHidden();
  await expect(page.getByTestId('var-board')).toBeVisible();
  await expect(page.getByTestId('var-close')).toBeVisible();
  await expect(page.getByTestId('var-close')).toHaveText('Back to the game');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect((await page.getByTestId('var-sq-a1').boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(38);
  for (const id of ['var-close', 'var-back', 'var-forward', 'var-reset', 'var-flip', 'var-engine']) {
    expect((await page.getByTestId(id).boundingBox())?.height ?? 0, id).toBeGreaterThanOrEqual(44);
  }
  await page.getByTestId('var-close').click();
  await expect(page.getByTestId('board')).toBeVisible();
});

test('solves a multi-move "find the best move" puzzle with the help of the hint', async ({ page }) => {
  await startNewGame(page);
  await page.getByTestId('menu').getByText('Find the best move').click();
  await page.getByTestId('start').click();
  await expect(page.getByTestId('next-puzzle')).toBeVisible();
  // Go to the next puzzle whose line has two or more moves.
  for (let i = 0; i < 80 && !/Move 1 of [23]\./.test((await page.getByTestId('status').textContent()) ?? ''); i++) {
    await page.getByTestId('next-puzzle').click();
  }
  await expect(page.getByTestId('status')).toContainText(/Move 1 of [23]\./);
  const total = Number(/Move 1 of (\d)\./.exec((await page.getByTestId('status').textContent())!)![1]);
  for (let step = 1; step <= total; step++) {
    if (step > 1) await expect(page.getByTestId('status')).toContainText(`Move ${step} of ${total}.`, { timeout: 10_000 });
    await page.getByTestId('hint').click();
    await expect(page.locator('[data-testid^="sq-"][data-hint]')).toHaveCount(2);
    const turn = await page.locator('.wp-chess').getAttribute('data-turn');
    const squares = await page.locator('[data-testid^="sq-"][data-hint]').evaluateAll((els) => els.map((el) => [el.getAttribute('data-square'), el.getAttribute('data-piece')]));
    const from = squares.find(([, piece]) => piece?.startsWith(turn ?? 'w'))![0]!;
    const to = squares.find(([square]) => square !== from)![0]!;
    await tap(page, from, to);
    if (await page.getByTestId('promotion').isVisible()) {
      const hint = (await page.getByTestId('explanation').textContent()) ?? '';
      const piece = ({ '♕': 'q', '♖': 'r', '♗': 'b', '♘': 'n' } as Record<string, string>)[/=(.)/.exec(hint)?.[1] ?? '♕'] ?? 'q';
      await page.getByTestId(`promote-${piece}`).click();
    }
  }
  await expect(page.locator('.wp-chess')).toHaveAttribute('data-outcome', 'solved');
  await expect(page.getByTestId('status')).toHaveText('Solved — you found every move of the line.');
});
