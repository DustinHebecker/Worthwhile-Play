import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame, submitStart, type StartOptions } from '../../packages/testing/src/e2e';

const GAME = 'chess';
const SQUARES = Array.from({ length: 64 }, (_, i) => 'abcdefgh'[i % 8]! + String(Math.floor(i / 8) + 1));

/** data-piece of all 64 squares, a1 first. */
const boardPieces = (page: Page) => Promise.all(SQUARES.map((s) => page.getByTestId(`sq-${s}`).getAttribute('data-piece')));
const tap = async (page: Page, ...squares: string[]) => {
  for (const s of squares) await page.getByTestId(`sq-${s}`).click();
};

async function startNewGame(page: Page, options: StartOptions = {}) {
  await startGame(page, GAME, options);
  await expect(page.getByTestId('game-root')).toBeVisible();
  await expect(page.getByTestId('sq-a1')).toBeVisible();
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
  await startNewGame(page, { settings: { game: 'human' } });
  await expect(page.getByTestId('mode')).toHaveText('Two players on this device.');
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
  await startNewGame(page, { settings: { game: 'mate', mateN: 1 } });
  await expect(page.getByTestId('mode')).toContainText('Mate in (moves): 1');
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

test('the start screen shows colour and strength only against the computer, the mate length only for mate in N', async ({ page }) => {
  await page.goto(`/games/${GAME}`);
  await expect(page.getByTestId('start-game')).toBeVisible();
  const visible = async (color: boolean, strength: boolean, mate: boolean) => {
    await expect(page.getByTestId('setting-color')).toBeVisible({ visible: color });
    await expect(page.getByTestId('difficulty')).toBeVisible({ visible: strength });
    await expect(page.getByTestId('setting-mateN')).toBeVisible({ visible: mate });
  };
  await visible(true, true, false);
  await page.getByTestId('setting-game').locator('input[value="human"]').check();
  await visible(false, false, false);
  await page.getByTestId('setting-game').locator('input[value="mate"]').check();
  await visible(false, false, true);
  await page.getByTestId('setting-mateN').locator('input[value="2"]').check();
  await page.getByTestId('start-game').click();
  await expect(page.getByTestId('mode')).toContainText('Mate in (moves): 2');
  // No menu inside the game any more (ADR 0017).
  await expect(page.getByTestId('menu')).toHaveCount(0);
  await expect(page.getByTestId('game-root').locator('input[type="radio"]')).toHaveCount(0);
});

test('fits a 360px-wide phone without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startNewGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await page.getByTestId('sq-a1').boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(38);
});

test('the strength chosen on the start screen is the game\'s difficulty and is offered again after a reload', async ({ page }) => {
  await startNewGame(page, { difficulty: 'strong', settings: { game: 'computer', color: 'b' } });
  await expect(page.getByTestId('settings-summary')).toContainText('Strong');
  await expect(page.getByTestId('mode')).toHaveText('You play Black against the computer (Strong).');
  // As Black the computer has already opened.
  await expect(page.getByTestId('ply-0')).toBeVisible();
  await expect.poll(async () => ((await readSave(page, GAME)) as { state?: { difficulty: string; humanColor: string } } | undefined)?.state).toMatchObject({ difficulty: 'strong', humanColor: 'b' });
  await page.reload();
  await expect(page.getByTestId('difficulty').locator('input[value="strong"]')).toBeChecked();
  await expect(page.getByTestId('setting-color').locator('input[value="b"]')).toBeChecked();
});

test('a random colour is drawn at the start and shown', async ({ page }) => {
  await startNewGame(page, { settings: { color: 'random' } });
  await expect(page.getByTestId('mode')).toContainText(/drawn at random/);
  const colour = (await page.getByTestId('mode').textContent())!.includes('White') ? 'w' : 'b';
  // The board is turned to the drawn colour; as Black the computer has already opened.
  await expect(page.locator('.wp-chess')).toHaveAttribute('data-orientation', colour);
  await expect(page.getByTestId('status')).toHaveText(`Your move — you play ${colour === 'w' ? 'White' : 'Black'}.`);
  if (colour === 'b') await expect(page.getByTestId('ply-0')).toBeVisible();
  // The choice "random" is remembered for the next game.
  await page.reload();
  await expect(page.getByTestId('setting-color').locator('input[value="random"]')).toBeChecked();
  await submitStart(page);
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
    // Black's reply on the variation board is the person's own choice: any black knight move to a
    // free square (the computer's random first reply may have moved a knight or a pawn).
    const candidates = [['b8', 'a6'], ['b8', 'c6'], ['g8', 'h6'], ['g8', 'f6']];
    let knight = candidates[0]!;
    for (const [from, to] of candidates) {
      const fromPiece = await p.getByTestId(`var-sq-${from}`).getAttribute('data-piece');
      const toPiece = await p.getByTestId(`var-sq-${to}`).getAttribute('data-piece');
      if (fromPiece === 'bN' && !toPiece) {
        knight = [from!, to!];
        break;
      }
    }
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
  await startNewGame(page, { settings: { game: 'best' } });
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
