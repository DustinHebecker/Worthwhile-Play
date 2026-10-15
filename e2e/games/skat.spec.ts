import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const GAME = 'skat';

interface SavedDeal {
  hands: string[][];
  skat: string[];
  bids: unknown[];
  trick: string[];
  tricks: string[][];
  result: unknown;
}

/**
 * The save that belongs to what the page shows right now. The game redraws synchronously on every click, but the
 * host writes the save about 50 ms later (debounced autosave, then IndexedDB). A save read right after a click
 * can therefore still describe an earlier moment, e.g. before the computers played cards that the page already
 * shows in the trick. Waits until the save shows the same own hand, current and last trick, bidding log and
 * result as the DOM.
 */
async function synced(page: Page): Promise<SavedDeal> {
  let match: SavedDeal | undefined;
  await expect
    .poll(
      async () => {
        const dom = await page.evaluate(() => {
          const cards = (sel: string) => [...document.querySelectorAll(`${sel} [data-card]`)].map((e) => e.getAttribute('data-card') ?? '');
          return {
            hand: cards('[data-testid="my-hand"]').sort(),
            trick: cards('[data-testid="trick"]'),
            last: cards('[data-testid="last-trick"]'),
            bids: document.querySelectorAll('[data-testid="bidding-log"] li').length,
            hasLog: document.querySelector('[data-testid="bidding-log"]') !== null,
            result: document.querySelector('[data-testid="result"]') !== null
          };
        });
        const deal = ((await readSave(page, GAME)) as { state?: { deal?: SavedDeal } } | undefined)?.state?.deal;
        const same =
          deal !== undefined &&
          JSON.stringify([...(deal.hands[0] ?? [])].sort()) === JSON.stringify(dom.hand) &&
          JSON.stringify(deal.trick) === JSON.stringify(dom.trick) &&
          JSON.stringify(deal.tricks[deal.tricks.length - 1] ?? []) === JSON.stringify(dom.last) &&
          (!dom.hasLog || deal.bids.length === dom.bids) &&
          (deal.result !== null) === dom.result;
        match = same ? deal : undefined;
        return same;
      },
      { intervals: [50, 100, 200] }
    )
    .toBe(true);
  return match as SavedDeal;
}

/** Card ids of the person's hand in display order. */
const myCards = (page: Page) => page.getByTestId('my-hand').locator('[data-card]').evaluateAll((els) => els.map((el) => el.getAttribute('data-card')));

/** English accessible name of a card id ("AH" → "Ace of Hearts"). */
const englishLabel = (card: string) => {
  const ranks: Record<string, string> = { A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: '10' };
  const suits: Record<string, string> = { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' };
  return `${ranks[card[0] as string] ?? card[0]} of ${suits[card[1] as string]}`;
};

/**
 * The computers' moves are revealed one by one (presentation only; the state is already decided and saved).
 * Shows the rest at once via the skip control. In-page, so a reveal that ends by itself meanwhile is no problem.
 */
async function settle(page: Page) {
  await page.evaluate(() => document.querySelector<HTMLElement>('[data-testid="reveal-skip"]')?.click());
  await expect(page.getByTestId('reveal-skip')).toHaveCount(0);
}

async function startSeries(page: Page) {
  await page.goto(`/games/${GAME}`);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  await page.getByTestId('start').click();
  await expect(page.getByTestId('my-hand')).toBeVisible();
  await settle(page);
}

/** Passes in the bidding (if asked) and plays the first legal card (if it is the person's turn). */
async function passAndPlay(page: Page) {
  await settle(page);
  const pass = page.getByTestId('bid-pass');
  if (await pass.isVisible()) await pass.click();
  await settle(page);
  const card = page.locator('[data-testid="my-hand"] button:not([aria-disabled="true"])').first();
  if (await card.isVisible()) await card.click();
  await settle(page);
}

/** Card ids in the current trick, as shown. */
const shownTrick = (page: Page) => page.locator('[data-testid="trick"] [data-card]').evaluateAll((els) => els.map((el) => el.getAttribute('data-card')).join(' '));

test('bid, play a card, reload and resume the identical table', async ({ page }) => {
  let before: (string | null)[] = [];
  let trick = '';
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('start').click();
    await settle(p);
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
  // Compare with the save of exactly what is shown (not an older one; see `synced`).
  const deal = await synced(page);
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

test('computer moves are revealed one by one; Space or the skip control shows the rest at once', async ({ page }) => {
  await startSeries(page);
  const playable = page.locator('[data-testid="my-hand"] button:not([aria-disabled="true"])');
  // Pass through the bidding until the person may play a card (computers declare).
  for (let i = 0; i < 6 && !(await playable.first().isVisible()); i++) {
    const pass = page.getByTestId('bid-pass');
    if (await pass.isVisible()) await pass.click();
    else await page.getByTestId('panel').locator('button').first().click();
    await settle(page);
    if (await page.getByTestId('result').isVisible()) return; // everybody passed: no card play in this deal
  }
  await expect(playable.first()).toBeVisible();

  // Normal speed: the decided turn is shown step by step, without any input.
  await playable.first().click();
  await expect(page.getByTestId('reveal-skip')).toBeVisible();
  const first = await shownTrick(page);
  await expect.poll(() => shownTrick(page), { timeout: 5000 }).not.toBe(first);
  // Meanwhile nothing can be played on the earlier picture.
  if (await page.getByTestId('reveal-skip').isVisible()) await expect(playable).toHaveCount(0);
  await expect(page.getByTestId('reveal-skip')).toHaveCount(0, { timeout: 15_000 });
  await synced(page);

  // Skip with the keyboard right away: the real state appears at once.
  if (await page.getByTestId('result').isVisible()) return;
  await playable.first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('reveal-skip')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('reveal-skip')).toHaveCount(0, { timeout: 300 });
  await synced(page);

  // The skip control itself, and the speed preference: Instant needs no skipping.
  if (await page.getByTestId('result').isVisible()) return;
  await playable.first().click();
  await page.getByTestId('reveal-skip').click();
  await expect(page.getByTestId('reveal-skip')).toHaveCount(0);
  await page.getByTestId('option-speed').selectOption('instant');
  if (await page.getByTestId('result').isVisible()) return;
  await playable.first().click();
  await expect(page.getByTestId('reveal-skip')).toHaveCount(0);
  await synced(page);
});
