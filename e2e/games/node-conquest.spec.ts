import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedConquest {
  tick: number;
  owner: number[];
  level: number[];
  out: number[][];
  result: string;
}

const savedState = async (page: Page) => ((await readSave(page, 'node-conquest')) as { state: SavedConquest }).state;

/** The player's start node and one connected node, read from the rendered board. */
async function startAndNeighbour(page: Page): Promise<[number, number]> {
  const start = Number((await page.locator('[data-testid^="node-"][data-owner="0"]').first().getAttribute('data-testid'))!.slice(5));
  const lanes = await page.locator('[data-testid^="lane-"]').evaluateAll((els) => els.map((el) => el.getAttribute('data-testid')!));
  const pair = lanes.map((id) => id.split('-').slice(1).map(Number)).find((ends) => ends.includes(start))!;
  return [start, pair[0] === start ? pair[1]! : pair[0]!];
}

const laneId = (a: number, b: number) => `lane-${Math.min(a, b)}-${Math.max(a, b)}`;

test('node-conquest: a paused battle resumes exactly after a reload', async ({ page }) => {
  let from = -1;
  let to = -1;
  await expectResumeAfterReload(page, 'node-conquest', async (p) => {
    [from, to] = await startAndNeighbour(p);
    await p.getByTestId(`node-${from}`).click();
    await p.getByTestId(`node-${to}`).click();
    await expect(p.getByTestId(laneId(from, to))).toHaveAttribute('data-active', `${from}-${to}`);
    await p.getByTestId('nc-pause').click();
    await expect(p.getByTestId('nc-status')).toHaveAttribute('data-state', 'running');
    // Let some units fly, then pause mid-battle.
    await expect.poll(async () => p.locator('.nc-unit:visible').count(), { timeout: 5_000 }).toBeGreaterThan(0);
    await p.getByTestId('nc-pause').click();
    await expect(p.getByTestId('nc-status')).toHaveAttribute('data-state', 'paused');
  });

  // The restored board shows the saved state and stays paused.
  const state = await savedState(page);
  expect(state.tick).toBeGreaterThan(0);
  expect(state.out[from]).toContain(to);
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'paused');
  await expect(page.getByTestId(laneId(from, to))).toHaveAttribute('data-active', new RegExp(`${from}-${to}`));
  for (const [v, level] of state.level.entries()) {
    await expect(page.getByTestId(`node-${v}`)).toHaveAttribute('data-level', String(level));
    await expect(page.getByTestId(`node-${v}`)).toHaveAttribute('data-owner', state.owner[v]! < 0 ? 'neutral' : String(state.owner[v]));
  }
  await page.waitForTimeout(600);
  expect((await savedState(page)).tick).toBe(state.tick);

  // Resuming continues the same battle.
  await page.getByTestId('nc-pause').click();
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'running');
  await page.keyboard.press('p');
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'paused');
  await expect.poll(async () => (await savedState(page)).tick).toBeGreaterThan(state.tick);
});

test('node-conquest: dragging from node to node activates a path; Space pauses', async ({ page }) => {
  await page.goto('/games/node-conquest');
  await page.getByTestId('new-game').click();
  const [from, to] = await startAndNeighbour(page);
  const a = (await page.getByTestId(`node-${from}`).locator('.nc-body').boundingBox())!;
  const b = (await page.getByTestId(`node-${to}`).locator('.nc-body').boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId(laneId(from, to))).toHaveAttribute('data-active', `${from}-${to}`);
  await expect(page.getByTestId(`node-${from}`)).toHaveAttribute('data-owner', '0');

  await page.getByTestId('nc-pause').click();
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'running');
  await page.locator('body').press('Space');
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'paused');
  await expect.poll(async () => (await savedState(page))?.out[from] ?? []).toContain(to);
});
