import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const ready = (page: Page) => root(page).locator('[data-testid^="rule-"][data-applicable="true"]');
const knownFacts = (page: Page) =>
  root(page)
    .locator('[data-testid^="fact-"]')
    .evaluateAll((list) => list.map((el) => `${el.getAttribute('data-testid')}@${el.getAttribute('data-step')}`));

test('minimal-proof: applied steps and known statements survive a reload', async ({ page }) => {
  let facts: string[] = [];
  let status: string | null = null;
  await expectResumeAfterReload(page, 'minimal-proof', async (p) => {
    await ready(p).first().click();
    // One step only: every puzzle needs at least two, so the proof is still open
    // (with a random seed, two steps could already finish an easy puzzle).
    await expect(root(p).getByTestId('mp-status')).toHaveText('Steps so far: 1');
    facts = await knownFacts(p);
    status = await root(p).getByTestId('mp-status').textContent();
  });
  await expect(root(page).getByTestId('mp-status')).toHaveText(status ?? '');
  expect(await knownFacts(page)).toEqual(facts);
  await expect(root(page).getByTestId('mp-undo')).toBeEnabled();
});

test('minimal-proof: refusal, undo, keyboard play and a calm finish with the shortest length', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/minimal-proof?seed=5&difficulty=hard');
  await expect(root(page).getByTestId('mp-goal')).toHaveAttribute('data-reached', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);

  // A rule whose premises are unknown is refused with an explanation.
  await root(page).locator('[data-testid^="rule-"][data-state="missing"]').first().click();
  await expect(root(page).getByTestId('mp-feedback')).toContainText('Not yet.');
  await expect(root(page).getByTestId('mp-status')).toHaveText('Steps so far: 0');

  // Apply by keyboard, then undo.
  await ready(page).first().focus();
  await page.keyboard.press('Enter');
  await expect(root(page).getByTestId('mp-status')).toHaveText('Steps so far: 1');
  await root(page).getByTestId('mp-undo').click();
  await expect(root(page).getByTestId('mp-status')).toHaveText('Steps so far: 0');

  // Every rule button is a comfortable touch target.
  const heights = await root(page).locator('[data-testid^="rule-"]').evaluateAll((list) => list.map((el) => el.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);

  // Greedy forward chaining always reaches the goal.
  for (let i = 0; i < 12; i++) {
    if ((await root(page).getByTestId('mp-goal').getAttribute('data-reached')) === 'true') break;
    await ready(page).first().click();
  }
  await expect(root(page).getByTestId('mp-goal')).toHaveAttribute('data-reached', 'true');
  await expect(root(page).getByTestId('mp-status')).toHaveAttribute('data-state', 'solved');
  await expect(root(page).getByTestId('mp-status')).toContainText('Shortest possible:');
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect(root(page).getByTestId('mp-undo')).toBeHidden();
});
