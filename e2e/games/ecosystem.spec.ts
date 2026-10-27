import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { challengeOf } from '../../packages/games/ecosystem/src/challenges';
import type { EcoState, GoalState, PredictState } from '../../packages/games/ecosystem/src/rules';

const ID = 'ecosystem';
const root = (page: Page) => page.getByTestId('game-root');

async function saved<S extends EcoState>(page: Page): Promise<S> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return ((await readSave(page, ID)) as { state: S }).state;
}

/** The saved predict state once the autosave has caught up with the item index. */
async function predictAt(page: Page, index: number): Promise<PredictState> {
  await expect.poll(async () => (await saved<PredictState>(page)).index).toBe(index);
  return saved<PredictState>(page);
}

test('ecosystem: a medium round — the model answer scores ●●●, skips, the summary and the host end screen', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { mode: 'predict' } });
  const r = root(page);
  const s = await predictAt(page, 0);
  const item = s.items[0]!;
  const q = challengeOf(item.challenge)!.questions.medium[item.question]!;
  await expect(r.getByTestId('eco-root')).toHaveAttribute('data-phase', 'question');
  if (q.kind === 'level') await r.getByTestId(`eco-band-${q.expect}`).check();
  else if (q.kind === 'shape') await r.getByTestId(`eco-opt-${q.expect}`).check();
  await r.getByTestId('eco-run').click();
  await expect(r.locator('#eco-review-heading')).toBeFocused();
  await expect(r.getByTestId('eco-verdict')).toHaveText('●●● Just like the model');
  await expect(r.getByTestId('eco-cld-list').locator('li').first()).toBeVisible();
  await expect(r.getByTestId('eco-explain')).not.toBeEmpty();
  for (let i = 1; i < 4; i++) {
    await r.getByTestId('eco-next').click();
    await predictAt(page, i);
    await r.getByTestId('eco-skip').click();
    await expect(r.getByTestId('eco-verdict')).toHaveText('Not predicted — here is what happened');
  }
  await r.getByTestId('eco-summary-btn').click();
  await expect(r.getByTestId('eco-summary-list').locator('li')).toHaveCount(4);
  // The marks stay visible as symbols; screen readers get the verdict words instead.
  const counts = r.getByTestId('eco-summary-counts');
  await expect(counts.locator('[aria-hidden="true"]')).toHaveText(['●●●', '●●○', '●○○', '○○○']);
  await expect(counts.locator('.sr-only')).toHaveText(['Just like the model', 'Close', 'Partly', 'The model went another way']);
  await expect(counts).toContainText('skipped 3');
  await expect(r.getByTestId('eco-summary-list').locator('li .sr-only')).toHaveText(['Just like the model']);
  await expect(page.getByTestId('finished')).toBeVisible();
  expect((await saved<PredictState>(page)).reported).toBe(true);
});

test('ecosystem: a chosen draft survives a reload without being committed', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      await root(p).locator('.eco-options input').first().check();
    },
    { difficulty: 'easy', settings: { mode: 'predict' } }
  );
  const s = await saved<PredictState>(page);
  expect(s.items[0]!.draft).not.toBeNull();
  expect(s.items[0]!.answer).toBeNull();
  await expect(root(page).locator('.eco-options input:checked')).toHaveCount(1);
});

test('ecosystem: goal "Keep the pondweed" — an early buffer strip reaches it; a late one fails; undo and back work', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'goal', goal: 'save-pondweed' } });
  const r = root(page);
  await r.getByTestId('eco-tool-buffer').click();
  for (let i = 0; i < 4; i++) await r.getByTestId('eco-run-26').click();
  await expect(r.getByTestId('eco-outcome')).toHaveText('Reached in week 104.');
  await expect(page.getByTestId('finished')).toBeVisible();
  // A second game: wait 20 weeks first, then the buffer strip comes too late.
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'goal', goal: 'save-pondweed' } });
  for (let i = 0; i < 5; i++) await r.getByTestId('eco-run-4').click();
  await expect(r.getByTestId('eco-status')).toHaveText(/^Week 20 · /);
  await r.getByTestId('eco-tool-buffer').click();
  await r.getByTestId('eco-run-settle').click();
  for (let i = 0; i < 4 && (await r.getByTestId('eco-root').getAttribute('data-phase')) === 'running'; i++) await r.getByTestId('eco-run-26').click();
  await expect(r.getByTestId('eco-outcome')).toHaveText(/^Pondweed fell below the line in week \d+\.$/);
  await expect(r.getByTestId('eco-undo')).toBeFocused();
  await r.getByTestId('eco-undo').click();
  await expect(r.getByTestId('eco-status')).toHaveText(/^Week 20 · /);
  await expect.poll(async () => (await saved<GoalState>(page)).notebook.log.length).toBe(0);
  await r.getByTestId('eco-back-start').click();
  await expect(r.getByTestId('eco-status')).toHaveText(/^Week 0 · /);
  // Resume in the middle of a goal: the log and the week survive a reload.
  await r.getByTestId('eco-tool-ditch').click();
  await r.getByTestId('eco-run-4').click();
  await expect.poll(async () => (await saved<GoalState>(page)).notebook.week).toBe(4);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(r.getByTestId('eco-status')).toHaveText(/^Week 4 · /);
  expect((await saved<GoalState>(page)).notebook.log).toEqual([{ week: 0, kind: 'set', cond: 1, level: 0 }]);
});

test('ecosystem: explore — add pike, run, the ghost line, the numbers; keyboard path to "4 weeks"', async ({ page }) => {
  await startGame(page, ID, { settings: { mode: 'explore', habitat: 'pond', start: 'lively' } });
  const r = root(page);
  await r.getByTestId('eco-species').selectOption('pike');
  await r.getByTestId('eco-add').click();
  await r.getByTestId('eco-run-26').click();
  await expect(r.getByTestId('eco-status')).toHaveText(/^Week 26 · Pond · Water: /);
  await r.getByTestId('eco-ghost').check();
  await expect(r.locator('.eco-focus .eco-line-ghost')).toHaveCount(1);
  await expect(r.getByTestId('eco-legend')).toContainText('without my last change');
  await expect(r.getByTestId('eco-compare')).toHaveText(/^Without your last change, Green algae would now be /);
  await r.getByTestId('eco-numbers').locator('summary').click();
  expect(await r.getByTestId('eco-table').locator('tbody tr').count()).toBeGreaterThan(3);
  await r.getByTestId('eco-tab-web').click();
  await expect(r.getByTestId('eco-web-list')).toContainText('Pike');
  // Keyboard only: from "1 week", Tab to "4 weeks" and press Enter.
  await r.getByTestId('eco-run-1').focus();
  await page.keyboard.press('Tab');
  await expect(r.getByTestId('eco-run-4')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(r.getByTestId('eco-announcer')).toHaveText('Ran 4 weeks. Now week 30.');
  await expect(r.getByTestId('eco-run-4')).toBeFocused();
});

test('ecosystem: hard — sketch with the keyboard, run, the sketch stays on the chart', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'hard', settings: { mode: 'predict' } });
  const r = root(page);
  // Find an item with a sketch question (most hard items are).
  for (let i = 0; i < 4; i++) {
    const s = await predictAt(page, i);
    const item = s.items[i]!;
    const q = challengeOf(item.challenge)!.questions.hard[item.question]!;
    if (q.kind === 'sketch') {
      const handle = r.getByTestId('eco-handle-2');
      await handle.focus();
      const before = Number(await handle.getAttribute('aria-valuenow'));
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('PageUp');
      await expect(handle).not.toHaveAttribute('aria-valuenow', String(before));
      await expect(r.getByTestId('eco-sketch-shape')).toHaveText(/^Your sketch: /);
      await expect.poll(async () => (await saved<PredictState>(page)).items[i]!.draft?.kind).toBe('sketch');
      await r.getByTestId('eco-run').click();
      await expect(r.getByTestId('eco-sketch-result')).toHaveText(/^Your sketch: .+ · The model: .+$/);
      await expect(r.getByTestId('eco-sketch-line')).toHaveCount(1);
      return;
    }
    await r.getByTestId('eco-skip').click();
    await r.getByTestId(i < 3 ? 'eco-next' : 'eco-summary-btn').click();
  }
  throw new Error('no sketch question in this round');
});

test('ecosystem: 360 px in Arabic — no horizontal scroll, 44 px targets, the chart runs left to right', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await startGame(page, ID, { settings: { mode: 'explore', habitat: 'meadow', start: 'lively' } });
  const r = root(page);
  await expect(r.getByTestId('eco-root')).toHaveAttribute('dir', 'rtl');
  await expect(r.getByTestId('eco-scene')).toHaveAttribute('dir', 'ltr');
  await r.getByTestId('eco-run-26').click();
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  for (const id of ['eco-run-1', 'eco-run-4', 'eco-run-26', 'eco-run-settle', 'eco-add', 'eco-species', 'eco-cond-rain', 'eco-tab-web', 'eco-focus-pick']) {
    const box = (await r.getByTestId(id).boundingBox())!;
    expect(box.height, id).toBeGreaterThanOrEqual(44);
    expect(box.width, id).toBeGreaterThanOrEqual(44);
  }
  // Week 0 lies left of week 26 in the chart, also in RTL.
  const x0 = (await r.locator('.eco-focus .eco-axis-text[data-week="0"]').boundingBox())!.x;
  const x26 = (await r.locator('.eco-focus .eco-axis-text[data-week="24"]').boundingBox())!.x;
  expect(x26).toBeGreaterThan(x0);
  // A predict question on the phone: the sticky bar does not cover the focused element.
  // (The start screen remembers explore; the difficulty shows once the mode is back on predict.)
  await startGame(page, ID, { settings: { mode: 'predict' } });
  const think = r.getByTestId('eco-think').locator('summary');
  await think.focus();
  const f = (await think.boundingBox())!;
  const bar = (await r.getByTestId('eco-bar').boundingBox())!;
  expect(f.y + f.height <= bar.y || f.y >= bar.y + bar.height).toBe(true);
  for (const id of ['eco-run', 'eco-skip']) expect((await r.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test('ecosystem: works offline after the first visit — open, reload, continue and run a goal', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  try {
    await startGame(page, ID, { difficulty: 'medium', settings: { mode: 'goal', goal: 'protect-flowers' } });
    const r = root(page);
    await r.getByTestId('eco-run-4').click();
    await expect.poll(async () => (await saved<GoalState>(page)).notebook.week).toBe(4);
    await page.reload();
    await page.getByTestId('continue').click();
    await expect(r.getByTestId('eco-status')).toHaveText(/^Week 4 · Meadow · /);
    await expect(r.getByTestId('eco-target')).toContainText('Wildflowers at least 60');
  } finally {
    await context.setOffline(false);
  }
});
