import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const GAME = 'skat';

interface SavedDeal {
  hands: string[][];
  skat: string[];
  result: unknown;
}

/** Card ids of the person's hand in display order. */
const myCards = (page: Page) => page.getByTestId('my-hand').locator('[data-card]').evaluateAll((els) => els.map((el) => el.getAttribute('data-card')));

/** English accessible name of a card id ("AH" → "Ace of Hearts"). */
const englishLabel = (card: string) => {
  const ranks: Record<string, string> = { A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: '10' };
  const suits: Record<string, string> = { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' };
  return `${ranks[card[0] as string] ?? card[0]} of ${suits[card[1] as string]}`;
};

async function startSeries(page: Page) {
  await page.goto(`/games/${GAME}`);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page.getByTestId('my-hand')).toBeVisible();
}

/** Passes in the bidding (if asked) and plays the first legal card (if it is the person's turn). */
async function passAndPlay(page: Page) {
  const pass = page.getByTestId('bid-pass');
  if (await pass.isVisible()) await pass.click();
  const card = page.locator('[data-testid="my-hand"] button:not([aria-disabled="true"])').first();
  if (await card.isVisible()) await card.click();
}

test('bid, play a card, reload and resume the identical table', async ({ page }) => {
  let before: (string | null)[] = [];
  let trick = '';
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('start').click();
    await passAndPlay(p);
    await passAndPlay(p);
    before = await myCards(p);
    trick = (await p.getByTestId('panel').textContent()) ?? '';
  });
  await expect(page.getByTestId('my-hand')).toBeVisible();
  expect(await myCards(page)).toEqual(before);
  expect((await page.getByTestId('panel').textContent()) ?? '').toEqual(trick);
});

test('opponents’ cards and the Skat never reach the DOM', async ({ page }) => {
  await startSeries(page);
  await passAndPlay(page);
  await expect.poll(async () => ((await readSave(page, GAME)) as { state?: unknown } | undefined)?.state !== undefined).toBe(true);
  const deal = ((await readSave(page, GAME)) as { state: { deal: SavedDeal } }).state.deal;
  if (deal.result) return; // the game already ended: everything may be shown
  const html = await page.content();
  for (const card of [...(deal.hands[1] ?? []), ...(deal.hands[2] ?? []), ...deal.skat]) {
    expect(html).not.toContain(`data-card="${card}"`);
    expect(html).not.toContain(englishLabel(card));
  }
});

test('fits a 360px phone: ten cards in two rows, no horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await startSeries(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const tops = await page.getByTestId('my-hand').locator('.wp-hand-card').evaluateAll((els) => [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().top)))]);
  expect(tops.length).toBe(2);
  const pass = page.getByTestId('bid-pass');
  if (await pass.isVisible()) {
    const box = await pass.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test('is playable with the keyboard', async ({ page }) => {
  await startSeries(page);
  const pass = page.getByTestId('bid-pass');
  if (await pass.isVisible()) {
    await pass.focus();
    await page.keyboard.press('Enter');
  }
  const first = page.locator('[data-testid="my-hand"] button').first();
  if (await first.isVisible()) {
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="my-hand"] button').nth(1)).toBeFocused();
  }
});
