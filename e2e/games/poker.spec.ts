import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const GAME = 'poker';

interface SavedSeat {
  hole: string[];
  stack: number;
  folded: boolean;
}
interface SavedPoker {
  phase: string;
  handNumber: number;
  board: string[];
  seats: SavedSeat[];
  log: unknown[];
  result: { shown: number[] } | null;
}

const saved = async (page: Page) => ((await readSave(page, GAME)) as { state: SavedPoker } | undefined)?.state;

/**
 * The save that belongs to what the page shows right now. The game renders synchronously, but the host writes
 * the save about 50 ms later (debounced autosave, then IndexedDB), so a save read right after a click can still
 * describe the previous moment (e.g. the betting state while the page already shows that hand's showdown).
 * Waits until the save shows the same hand, phase, board and own cards as the DOM.
 */
async function synced(page: Page): Promise<SavedPoker> {
  let match: SavedPoker | undefined;
  await expect
    .poll(
      async () => {
        const dom = await page.evaluate(() => {
          const root = document.querySelector<HTMLElement>('.wp-poker');
          const cards = (sel: string) => [...document.querySelectorAll(`${sel} [data-card]`)].map((e) => e.getAttribute('data-card'));
          return { hand: Number(root?.dataset.hand ?? -1), phase: root?.dataset.phase ?? '', board: cards('[data-testid="pk-board"]'), hole: cards('[data-testid="pk-hole"]') };
        });
        const state = await saved(page);
        const same =
          state !== undefined &&
          state.handNumber === dom.hand &&
          state.phase === dom.phase &&
          JSON.stringify(state.board) === JSON.stringify(dom.board) &&
          JSON.stringify(state.seats[0]?.hole ?? []) === JSON.stringify(dom.hole);
        match = same ? state : undefined;
        return same;
      },
      { intervals: [50, 100, 200] }
    )
    .toBe(true);
  return match as SavedPoker;
}

/** One calm step: next hand, check, or call. */
async function step(page: Page) {
  for (const id of ['pk-next', 'pk-check', 'pk-call']) {
    const button = page.getByTestId(id);
    if (await button.count()) {
      await button.click();
      return;
    }
  }
}

async function sitDown(page: Page, opponents = '3') {
  // No save: the game opens on its own setup (ADR 0015).
  await page.goto(`/games/${GAME}`);
  await expect(page.getByTestId('pk-setup')).toBeVisible();
  await page.getByTestId('pk-opponents').selectOption(opponents);
  await page.getByTestId('pk-start').click();
  await expect(page.getByTestId('pk-board')).toBeVisible();
}

/** Opponents' hole cards that have not been shown at a showdown. */
const hiddenCards = (state: SavedPoker) =>
  state.seats.flatMap((seat, i) => (i === 0 || (state.phase !== 'betting' && state.result?.shown.includes(i)) ? [] : seat.hole));

async function expectNoHiddenCardsInDom(page: Page) {
  const state = await synced(page);
  for (const card of hiddenCards(state)) await expect(page.locator(`[data-card="${card}"]`)).toHaveCount(0);
  // Accessible names and text never mention a hidden card either.
  const text = await page.evaluate(() => {
    const parts = [document.title, document.body.innerText];
    for (const el of document.querySelectorAll('[aria-label], [title]')) parts.push(el.getAttribute('aria-label') ?? '', el.getAttribute('title') ?? '');
    return parts.join('\n');
  });
  const ranks: Record<string, string> = { T: '10', J: 'Jack', Q: 'Queen', K: 'King', A: 'Ace' };
  const suits: Record<string, string> = { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' };
  for (const card of hiddenCards(state)) {
    const name = `${ranks[card[0]!] ?? card[0]} of ${suits[card[1]!]}`;
    expect(text.includes(name), `${name} must stay hidden`).toBe(false);
  }
}

test('resumes mid-hand after a reload with the identical table', async ({ page }) => {
  let board: (string | null)[] = [];
  let hole: (string | null)[] = [];
  await expectResumeAfterReload(page, GAME, async (p) => {
    await p.getByTestId('pk-start').click();
    // Play until a flop is out and it is the player's turn (still mid-hand).
    for (let i = 0; i < 40; i++) {
      const s = await synced(p);
      if (s && s.phase === 'betting' && s.board.length >= 3) break;
      await step(p);
    }
    await expect(p.getByTestId('pk-actions')).toBeVisible();
    board = await p.locator('[data-testid="pk-board"] [data-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card')));
    hole = await p.locator('[data-testid="pk-hole"] [data-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card')));
  });
  const state = await synced(page);
  expect(state.phase).toBe('betting');
  await expect(page.getByTestId('pk-actions')).toBeVisible();
  expect(await page.locator('[data-testid="pk-board"] [data-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card')))).toEqual(board);
  expect(await page.locator('[data-testid="pk-hole"] [data-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card')))).toEqual(hole);
  expect(hole).toEqual(state.seats[0]!.hole);
  await expect(page.getByTestId('pk-stack-0')).toContainText(String(state.seats[0]!.stack));
});

test('opponents’ cards are never in the page before a showdown', async ({ page }) => {
  await sitDown(page, '5');
  let showdown = false;
  for (let i = 0; i < 60 && !showdown; i++) {
    await expectNoHiddenCardsInDom(page);
    const state = await synced(page);
    showdown = state.phase !== 'betting' && (state.result?.shown.some((s) => s !== 0) ?? false);
    if (!showdown) await step(page);
  }
  expect(showdown).toBe(true);
  // At the showdown the shown hands are visible with their names.
  await expect(page.locator('[data-testid^="pk-seat-hand-"]').first()).toBeVisible();
});

test('a bet with an exact amount via the keyboard', async ({ page }) => {
  await sitDown(page, '1');
  await expect(page.getByTestId('pk-amount')).toBeVisible();
  const min = Number(await page.getByTestId('pk-amount').getAttribute('min'));
  await page.getByTestId('pk-amount').fill(String(min + 1));
  await page.getByTestId('pk-amount').press('Enter');
  await expect.poll(async () => (await saved(page))?.log.length ?? 0).toBeGreaterThan(2);
  const state = (await saved(page))!;
  expect(JSON.stringify(state.log)).toContain(`"seat":0`);
});

test('fits a 360px-wide phone with six seats and the player can end the table', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await sitDown(page, '5');
  await expect(page.locator('[data-testid^="pk-seat-"]:not([data-testid^="pk-seat-hand"])')).toHaveCount(6);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const id of ['pk-fold', 'pk-check', 'pk-call', 'pk-raise', 'pk-preset-min']) {
    const button = page.getByTestId(id);
    if (await button.count()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByTestId('pk-end').click();
  await page.getByTestId('pk-end-yes').click();
  await expect(page.getByTestId('pk-summary')).toBeVisible();
  await expect.poll(async () => (await saved(page))?.phase).toBe('finished');
});
