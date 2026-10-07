import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const selected = (page: Page) =>
  root(page)
    .locator('[data-testid^="node-"], [data-testid^="edge-"]')
    .evaluateAll((list) => list.filter((el) => el.getAttribute('data-selected') === 'true').map((el) => el.getAttribute('data-testid')));

/** Selects something on the current task, whatever its type. */
async function selectSomething(page: Page) {
  const type = await root(page).getByTestId('gd-task').getAttribute('data-type');
  if (type === 'mincut') await root(page).getByTestId('gd-choice-2').click();
  // dispatchEvent: on some random layouts a length label overlaps the item's centre, so a
  // pointer click at that point would be intercepted. Real taps resolve to the nearest item anyway.
  else await root(page).locator('.gd-diagram [role="button"]').first().dispatchEvent('click');
  if (type === 'augment') await root(page).locator('.gd-diagram [role="button"]').nth(3).dispatchEvent('click');
}

test('graph-detective: a checked answer and a selection survive a reload', async ({ page }) => {
  let before: (string | null)[] = [];
  let task: string | null = null;
  let status: string | null = null;
  await expectResumeAfterReload(page, 'graph-detective', async (p) => {
    await selectSomething(p);
    const submit = root(p).getByTestId('gd-submit');
    if (await submit.isEnabled()) {
      await submit.click();
      await expect(root(p).getByTestId('gd-status')).not.toHaveAttribute('data-state', 'open');
    }
    task = await root(p).getByTestId('gd-task').textContent();
    status = await root(p).getByTestId('gd-status').textContent();
    before = await selected(p);
  });

  await expect(root(page).getByTestId('gd-task')).toHaveText(task ?? '');
  await expect(root(page).getByTestId('gd-status')).toHaveText(status ?? '');
  expect(await selected(page)).toEqual(before);
});

// Seed 11, hard: task 1 asks which single connection separates B from A. A–D, D–E and B–E all do;
// B–C is a bridge too, but it does not separate B from A.

test('graph-detective: a hard network fits a 360 px phone and connections are easy to tap', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/graph-detective?seed=11&difficulty=hard');
  await expect(root(page).getByTestId('gd-progress')).toHaveText('Task 1 of 6');
  await expect(root(page).getByTestId('gd-task')).toHaveAttribute('data-type', 'bridge');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  const diagram = await root(page).getByTestId('gd-diagram').boundingBox();
  expect(diagram!.x).toBeGreaterThanOrEqual(0);
  expect(diagram!.x + diagram!.width).toBeLessThanOrEqual(360);

  const centres = await root(page)
    .locator('[data-testid^="node-"] .gd-shape')
    .evaluateAll((list) => list.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.x + r.width / 2, r.y + r.height / 2] as [number, number];
    }));
  expect(centres).toHaveLength(12);
  for (let i = 0; i < centres.length; i++) {
    for (let j = i + 1; j < centres.length; j++) {
      expect(Math.hypot(centres[i]![0] - centres[j]![0], centres[i]![1] - centres[j]![1])).toBeGreaterThanOrEqual(44);
    }
  }

  // Tap 16 px beside the middle of A–D: the invisible hit area still picks that connection.
  const centre = async (label: string) => {
    const box = (await root(page).locator(`[data-testid="node-${label}"] .gd-shape`).boundingBox())!;
    return [box.x + box.width / 2, box.y + box.height / 2] as const;
  };
  const [ax, ay] = await centre('A');
  const [dx, dy] = await centre('D');
  const length = Math.hypot(dx - ax, dy - ay);
  await page.mouse.click((ax + dx) / 2 + ((dy - ay) / length) * 16, (ay + dy) / 2 - ((dx - ax) / length) * 16);
  await expect(root(page).getByTestId('edge-A-D')).toHaveAttribute('data-selected', 'true');
  await root(page).getByTestId('gd-submit').click();
  await expect(root(page).getByTestId('gd-status')).toHaveAttribute('data-state', 'correct');
  await expect(root(page).getByTestId('gd-next')).toBeVisible();
});

test('graph-detective: keyboard play, a visual hint for a wrong answer and a calm finish', async ({ page }) => {
  await page.goto('/games/graph-detective?seed=11&difficulty=hard');
  await expect(root(page).getByTestId('gd-task')).toHaveText('Which single connection, if cut, separates B from A?');
  // Connections are in alphabetical order: A–D first, then B–C.
  await root(page).getByTestId('edge-A-D').focus();
  await page.keyboard.press('ArrowRight');
  await expect(root(page).getByTestId('edge-B-C')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(root(page).getByTestId('edge-B-C')).toHaveAttribute('data-selected', 'true');
  await expect(root(page).getByTestId('edge-B-C')).toHaveAttribute('aria-pressed', 'true');
  await root(page).getByTestId('gd-submit').click();
  await expect(root(page).getByTestId('gd-status')).toHaveAttribute('data-state', 'wrong');
  // The dotted detour B–E–D–A shows that B and A are still linked.
  await expect(root(page).locator('.gd-edge.is-hint')).toHaveCount(3);
  await root(page).getByTestId('edge-B-C').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(root(page).getByTestId('edge-A-D')).toBeFocused();
  await page.keyboard.press(' ');
  await expect(root(page).getByTestId('edge-A-D')).toHaveAttribute('data-selected', 'true');
  await expect(root(page).getByTestId('edge-B-C')).toHaveAttribute('data-selected', 'false');
  await expect(root(page).locator('.gd-edge.is-hint')).toHaveCount(0);
  await root(page).getByTestId('gd-submit').click();
  await expect(root(page).getByTestId('gd-status')).toHaveAttribute('data-state', 'correct');
  await root(page).getByTestId('gd-next').click();

  // Tasks 2 and 3: new connections – reveal the solutions.
  for (let i = 0; i < 2; i++) {
    await expect(root(page).getByTestId('gd-task')).toHaveAttribute('data-type', 'augment');
    await root(page).getByTestId('gd-solution').click();
    await expect(root(page).getByTestId('gd-status')).toHaveAttribute('data-state', 'shown');
    await root(page).getByTestId('gd-next').click();
  }

  // Task 4: three connections separate B from J.
  await expect(root(page).getByTestId('gd-task')).toHaveAttribute('data-type', 'mincut');
  await root(page).getByTestId('gd-choice-3').click();
  await root(page).getByTestId('gd-submit').click();
  await expect(root(page).getByTestId('gd-status')).toHaveAttribute('data-state', 'correct');
  await expect(root(page).locator('.gd-edge[data-selected="true"]')).toHaveCount(3);
  await root(page).getByTestId('gd-next').click();

  // Task 5: shortest route C → A is C–F–E–A (3 + 1 + 3).
  await expect(root(page).getByTestId('gd-task')).toHaveAttribute('data-type', 'path');
  for (const id of ['edge-C-F', 'edge-E-F', 'edge-A-E']) await root(page).getByTestId(id).click();
  await root(page).getByTestId('gd-submit').click();
  await expect(root(page).getByTestId('gd-status')).toHaveAttribute('data-state', 'correct');
  await root(page).getByTestId('gd-next').click();

  // Task 6: I is the only single point of failure.
  await expect(root(page).getByTestId('gd-task')).toHaveAttribute('data-type', 'cutvertex');
  await root(page).getByTestId('node-I').click();
  await root(page).getByTestId('gd-submit').click();
  await expect(root(page).getByTestId('gd-status')).toHaveAttribute('data-state', 'correct');
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect(root(page).getByTestId('gd-summary')).toHaveText('All 6 tasks done. Answers checked: 5. Solutions shown: 2.');
  await expect(root(page).getByTestId('gd-next')).toBeHidden();
});
