import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { solve, type DeliveryPlan, type Kind, type MoState, type NetworkPlan, type ProductionPlan } from '../../packages/games/mini-optimizer/src/rules';

const ID = 'mini-optimizer';
const root = (page: Page) => page.getByTestId('game-root');
const saved = async (page: Page) => ((await readSave(page, ID)) as { state: MoState }).state;

/** Waits until the autosave holds a game, then returns its state. */
async function savedState(page: Page): Promise<MoState> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return saved(page);
}

/** Enters a plan through the UI (taps on roads, customers, the depot and + buttons). */
async function enterPlan(page: Page, state: MoState, plan: MoState['plan']) {
  const r = root(page);
  if (state.problem.kind === 'network') {
    // force: the game picks the road nearest to the tap, so a neighbouring hit area may overlap the badge centre.
    for (const i of (plan as NetworkPlan).built) await r.getByTestId(`link-${i}`).click({ force: true });
  } else if (state.problem.kind === 'delivery') {
    const trips = (plan as DeliveryPlan).trips;
    for (const [k, trip] of trips.entries()) {
      for (const s of trip) await r.getByTestId(`stop-${String.fromCharCode(65 + s)}`).click();
      if (k < trips.length - 1) await r.getByTestId('depot').click();
    }
  } else {
    for (const [i, q] of (plan as ProductionPlan).qty.entries()) for (let k = 0; k < q; k++) await r.getByTestId(`plus-${i}`).click();
  }
}

for (const kind of ['network', 'delivery', 'production'] as const satisfies readonly Kind[]) {
  test(`mini-optimizer: entering a best ${kind} plan by taps checks as a best plan and ends the game calmly`, async ({ page }) => {
    await startGame(page, ID, { difficulty: 'medium', settings: { problem: kind } });
    const state = await savedState(page);
    expect(state.problem.kind).toBe(kind);
    const best = solve(state.problem);
    await enterPlan(page, state, best.plan);
    await expect(root(page).getByTestId('mo-score')).toHaveAttribute('data-value', String(best.score));
    await root(page).getByTestId('mo-check').click();
    await expect(root(page).getByTestId('mo-result-gap')).toHaveAttribute('data-value', '0');
    await expect(root(page).getByTestId('mo-result-best')).toHaveAttribute('data-value', String(best.score));
    await expect(page.getByTestId('finished')).toBeVisible();
    await expect.poll(async () => (await saved(page)).checks).toBe(1);
  });
}

test('mini-optimizer: an incomplete plan is not checked; the missing points are announced', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { problem: 'network' } });
  const check = root(page).getByTestId('mo-check');
  await expect(check).toHaveAttribute('aria-disabled', 'true');
  await check.click({ force: true });
  await expect(root(page).getByTestId('mo-announcer')).toContainText('Not ready to check');
  await expect(root(page).getByTestId('mo-result')).toBeHidden();
  await expect(page.getByTestId('finished')).toBeHidden();
  expect((await savedState(page)).checks).toBe(0);
});

test('mini-optimizer: the plan and its undo history survive a reload', async ({ page }) => {
  let plan: unknown;
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('stop-A').click();
      await r.getByTestId('stop-B').click();
      await r.getByTestId('depot').click();
      await r.getByTestId('stop-C').click();
      await r.getByTestId('mo-undo').click();
      await expect(r.getByTestId('mo-undo')).toBeEnabled();
      // The autosave lags the redraw: wait for the exact state after the undo — trip 1 with A and B, and the
      // empty trip 2 started at the depot (an earlier save, before the depot press, also holds just A and B).
      await expect.poll(async () => ((await savedState(p)).plan as DeliveryPlan).trips).toEqual([[0, 1], []]);
      plan = (await savedState(p)).plan;
    },
    { difficulty: 'hard', settings: { problem: 'delivery' } }
  );
  await expect.poll(async () => (await saved(page)).plan).toEqual(plan);
  await expect(root(page).getByTestId('stop-A')).toHaveAttribute('data-trip', '1');
  await expect(root(page).getByTestId('mo-undo')).toBeEnabled();
});

test('mini-optimizer: keyboard only — roads by arrow keys and Space, quantities by arrow keys', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { problem: 'network' } });
  const r = root(page);
  const focusable = r.locator('.mo-link[tabindex="0"]');
  await focusable.focus();
  await page.keyboard.press('ArrowRight');
  const second = r.locator('.mo-link:focus');
  const id = await second.getAttribute('data-testid');
  await page.keyboard.press('Space');
  await expect(r.getByTestId(id!)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(r.getByTestId(id!)).toHaveAttribute('aria-pressed', 'false');

  await startGame(page, ID, { difficulty: 'easy', settings: { problem: 'production' } });
  const qty = root(page).getByTestId('qty-0');
  await qty.focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(qty).toHaveAttribute('aria-valuenow', '2');
  await page.keyboard.press('ArrowDown');
  await expect(qty).toHaveAttribute('aria-valuenow', '1');
  await page.keyboard.press('End');
  await expect(qty).toHaveAttribute('aria-valuenow', await qty.getAttribute('aria-valuemax') ?? '');
  await page.keyboard.press('Home');
  await expect(qty).toHaveAttribute('aria-valuenow', '0');
});

test('mini-optimizer: "Show a best plan" switches the view and keeps the player\'s plan', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { problem: 'production' } });
  const r = root(page);
  // One piece of the first product always fits (stock ≥ the largest use per piece).
  await r.getByTestId('plus-0').click();
  const q = 1;
  await r.getByTestId('mo-check').click();
  await expect(r.getByTestId('mo-result')).toBeVisible();
  const before = (await saved(page)).plan;
  await r.getByTestId('mo-reveal').click();
  await expect(r.getByTestId('mo-view-best')).toHaveAttribute('aria-pressed', 'true');
  await expect(r.getByTestId('bestqty-0')).toBeVisible();
  await expect(r.getByTestId('mo-best-note')).toBeVisible();
  await r.getByTestId('mo-view-yours').click();
  await expect(r.getByTestId('bestqty-0')).toBeHidden();
  await expect(r.getByTestId('qty-0')).toHaveAttribute('aria-valuenow', String(q));
  await expect.poll(async () => (await saved(page)).revealed).toBe(true);
  expect((await saved(page)).plan).toEqual(before);
});

test('mini-optimizer: "Another round" with "Surprise me" starts a new problem', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { problem: 'any' } });
  const first = await savedState(page);
  await enterPlan(page, first, solve(first.problem).plan);
  await root(page).getByTestId('mo-check').click();
  await page.getByTestId('another-round').click();
  await expect.poll(async () => (await saved(page)).seed).not.toBe(first.seed);
  const second = await saved(page);
  expect(second.choice).toBe('any');
  expect(second.checks).toBe(0);
});

for (const kind of ['network', 'delivery', 'production'] as const) {
  test(`mini-optimizer: the hard ${kind} problem fits a 360 px phone with 44 px targets`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await startGame(page, ID, { difficulty: 'hard', settings: { problem: kind } });
    const r = root(page);
    await expect(r.getByTestId('mo-task')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    // Roads, customers and the depot are hit through their invisible hit areas (.mo-hit); the visible marks are smaller.
    const targets = r.locator('[data-link] .mo-hit, [data-stop] .mo-hit, [data-depot] .mo-hit, .mo-stepper button, .mo-actions button:visible, .mo-qty');
    const count = await targets.count();
    expect(count).toBeGreaterThan(3);
    for (let i = 0; i < count; i++) {
      const box = await targets.nth(i).boundingBox();
      expect(box, `target ${i}`).toBeTruthy();
      expect(box!.width, `target ${i} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `target ${i} height`).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(360.5);
    }
  });
}
