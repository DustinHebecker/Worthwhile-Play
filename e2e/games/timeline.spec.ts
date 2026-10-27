import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { ev } from '../../packages/games/timeline/src/data';
import { type FirstItem, type OrderItem, type TimelineState, type TogetherItem, type WhenItem } from '../../packages/games/timeline/src/rules';

const ID = 'timeline';
const root = (page: Page) => page.getByTestId('game-root');

/** The autosaved state once it holds a game. */
async function savedState(page: Page): Promise<TimelineState> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return ((await readSave(page, ID)) as { state: TimelineState }).state;
}

/** The saved state once the autosave has caught up with the current item index. */
async function stateAt(page: Page, index: number): Promise<TimelineState> {
  await expect.poll(async () => (await savedState(page)).index).toBe(index);
  return savedState(page);
}

const current = <T>(s: TimelineState) => s.items[s.index] as T;

test('timeline: "When was it?" — a typed year inside the range, the slider by keyboard, the review', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'when', span: 'modern' } });
  const r = root(page);
  await expect(r.getByTestId('tl-root')).toHaveAttribute('data-phase', 'when-question');
  // The slider moves by keyboard and the typed field follows.
  await r.getByTestId('tl-slider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(r.getByTestId('tl-means')).toHaveText(/^= /);
  await expect(r.getByTestId('tl-slider')).not.toHaveAttribute('aria-valuetext', 'No answer yet.');
  await expect(r.getByTestId('tl-axis-live')).toHaveText(/^Your answer: /);
  for (let i = 0; i < 2; i++) {
    const item = current<WhenItem>(await stateAt(page, i));
    const e = ev(item.event)!;
    // The slider set the unit to "years ago" on the first item; years are typed as CE years.
    await r.getByTestId('tl-unit').selectOption('ce');
    await r.getByTestId('tl-year').fill(String(e.y));
    await expect(r.getByTestId('tl-means')).toHaveText(`= ${e.y}`);
    await r.getByTestId('tl-check').click();
    await expect(r.locator('#tl-review-heading')).toBeFocused();
    await expect(r.getByTestId('tl-verdict')).toHaveText('●●● Within the accepted range');
    await expect(r.getByTestId('tl-mark-target')).toBeVisible();
    await expect(r.getByTestId('tl-about')).toContainText('Sources');
    await r.getByTestId('tl-next').click();
  }
});

test('timeline: "Put in order" resumes after a reload, then by keyboard and buttons into the right order', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('tl-down-0').click();
      await r.getByTestId('tl-down-1').click();
    },
    { difficulty: 'easy', settings: { mode: 'order', span: 'all' } }
  );
  const r = root(page);
  await expect(r.getByTestId('tl-order').locator('li')).toHaveCount(4);
  // Keyboard pick-up: Space, ArrowDown, Space moves the first card one place down.
  const before = current<OrderItem>(await savedState(page)).draft;
  await r.getByTestId('tl-handle-0').focus();
  await page.keyboard.press('Space');
  await expect(r.getByTestId('tl-announcer')).toHaveText(/^Picked up/);
  await page.keyboard.press('ArrowDown');
  await expect(r.getByTestId('tl-handle-1')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(r.getByTestId('tl-announcer')).toHaveText(/placed at position 2 of 4/);
  await expect.poll(async () => current<OrderItem>(await savedState(page)).draft[1]).toBe(before[0]);
  // Now sort with the buttons, using the dates.
  const item = current<OrderItem>(await savedState(page));
  const order = item.solution;
  const draft = [...item.draft];
  for (let target = 0; target < order.length; target++) {
    let at = draft.indexOf(order[target]!);
    while (at > target) {
      await r.getByTestId(`tl-up-${at}`).click();
      [draft[at - 1], draft[at]] = [draft[at]!, draft[at - 1]!];
      at--;
    }
  }
  await r.getByTestId('tl-check').click();
  await expect(r.getByTestId('tl-verdict')).toHaveText('●●● All in the right order');
  await expect(r.getByTestId('tl-order-correct').locator('li')).toHaveCount(4);
  await expect(r.getByTestId('tl-gap-large')).toContainText('Largest gap');
});

test('timeline: "Which came first?" on medium asks the gap and explains it', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { mode: 'first', span: 'all' } });
  const r = root(page);
  let sawGap = false;
  for (let i = 0; i < 3; i++) {
    const item = current<FirstItem>(await stateAt(page, i));
    await r.getByTestId(`tl-first-${item.earlier}`).check();
    if (item.gaps.length) {
      sawGap = true;
      await r.getByTestId(`tl-gap-${item.gapIndex}`).check();
    }
    await r.getByTestId('tl-check').click();
    await expect(r.getByTestId('tl-verdict')).toHaveText(/^●●● Right: /);
    await expect(r.getByTestId('tl-between')).toHaveText(/^Between them lie about /);
    if (item.gaps.length) await expect(r.getByTestId('tl-gap-result')).toHaveText('●●● Your estimate of the gap was right.');
    await r.getByTestId('tl-next').click();
  }
  expect(sawGap).toBe(true);
});

test('timeline: "Same time?" shows the window and every option in words', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'together', span: 'all' } });
  const r = root(page);
  const item = current<TogetherItem>(await stateAt(page, 0));
  await r.getByTestId(`tl-opt-${item.correct}`).check();
  await r.getByTestId('tl-check').click();
  await expect(r.getByTestId('tl-verdict')).toHaveText(/^●●● Right: /);
  await expect(r.getByTestId('tl-window-line')).toHaveText(/^The window: /);
  await expect(r.getByTestId('tl-option-lines').locator('li')).toHaveCount(3);
  await expect(r.getByTestId('tl-window')).toHaveCount(1);
});

test('timeline: a mixed round with skips ends in the summary and is finished', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { mode: 'mixed', span: 'all' } });
  const r = root(page);
  for (let i = 0; i < 6; i++) {
    await r.getByTestId('tl-skip').click();
    await expect(r.locator('#tl-review-heading')).toBeFocused();
    await r.getByTestId(i < 5 ? 'tl-next' : 'tl-summary-btn').click();
  }
  await expect(r.getByTestId('tl-summary-list').locator('li')).toHaveCount(6);
  await expect(r.getByTestId('tl-tip')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeVisible();
  expect((await savedState(page)).reported).toBe(true);
});

test('timeline: fits 360 px in Arabic; the timeline stays left to right; 44 px targets; zoom works', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'when', span: 'all' } });
  const r = root(page);
  await expect(r.getByTestId('tl-root')).toHaveAttribute('dir', 'rtl');
  await expect(r.getByTestId('tl-axis')).toHaveAttribute('dir', 'ltr');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  for (const id of ['tl-check', 'tl-skip', 'tl-zoom-in', 'tl-zoom-out', 'tl-fit', 'tl-slider', 'tl-year', 'tl-unit']) {
    const box = (await r.getByTestId(id).boundingBox())!;
    expect(box.height, id).toBeGreaterThanOrEqual(44);
    expect(box.width, id).toBeGreaterThanOrEqual(44);
  }
  // Older ticks lie further left, as in every locale.
  const ticks = await r.locator('.tl-tick-label').evaluateAll((els) => els.map((el) => ({ y: Number(el.getAttribute('data-y')), x: el.getBoundingClientRect().x })));
  expect(ticks.length).toBeGreaterThanOrEqual(2);
  const sorted = [...ticks].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) expect(sorted[i]!.x).toBeGreaterThan(sorted[i - 1]!.x);
  // Zooming changes what is shown.
  const shown = await r.getByTestId('tl-axis-shows').textContent();
  await r.getByTestId('tl-zoom-in').click();
  await expect(r.getByTestId('tl-axis-shows')).not.toHaveText(shown!);
  // Arabic-Indic digits are read; the check button becomes available.
  await r.getByTestId('tl-year').fill('١٩٦٩');
  await expect(r.getByTestId('tl-check')).toHaveAttribute('aria-disabled', 'false');
  await expect(r.getByTestId('tl-means')).toHaveAttribute('data-state', 'ok');
  await r.getByTestId('tl-check').click();
  await expect(r.locator('#tl-review-heading')).toBeFocused();
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test('timeline: works offline after the first visit — open, reload, continue and play an item', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // let the service worker control the page
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  try {
    await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'first', span: 'all' } });
    const item = current<FirstItem>(await stateAt(page, 0));
    await page.reload();
    await page.getByTestId('continue').click();
    const r = root(page);
    await expect(r.getByTestId('tl-root')).toHaveAttribute('data-phase', 'first-question');
    await r.getByTestId(`tl-first-${item.earlier}`).check();
    await r.getByTestId('tl-check').click();
    await expect(r.getByTestId('tl-verdict')).toHaveText(/^●●● Right: /);
    await expect(r.getByTestId('tl-about')).toContainText('Sources');
  } finally {
    await context.setOffline(false);
  }
});
