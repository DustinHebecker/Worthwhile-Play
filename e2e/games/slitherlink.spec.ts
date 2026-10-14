import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedLoop {
  size: number;
  clues: number[];
  solution: number[];
  edges: number[];
}

const MARKS = ['unknown', 'line', 'cross'];
const root = (page: Page) => page.getByTestId('game-root');
const byId = (page: Page, id: string) => root(page).getByTestId(id);
const saved = async (page: Page) => ((await readSave(page, 'slitherlink')) as { state: SavedLoop }).state;

/** Test id of an edge in the game's order: horizontal edges row by row, then vertical ones. */
function edgeId(n: number, e: number): string {
  const horizontal = n * (n + 1);
  if (e < horizontal) return `edge-h-${Math.floor(e / n)}-${e % n}`;
  const k = e - horizontal;
  return `edge-v-${Math.floor(k / (n + 1))}-${k % (n + 1)}`;
}

test('slitherlink: marks survive a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'slitherlink', async (p) => {
    await byId(p, 'edge-h-0-0').click();
    await expect(byId(p, 'edge-h-0-0')).toHaveAttribute('data-state', 'line');
    await byId(p, 'edge-v-1-2').click();
    await byId(p, 'edge-v-1-2').click();
    await expect(byId(p, 'edge-v-1-2')).toHaveAttribute('data-state', 'cross');
  });

  // The restored board visibly matches the saved logical state, edge by edge and clue by clue.
  const state = await saved(page);
  expect(state.edges.filter((m) => m !== 0)).toHaveLength(2);
  for (let e = 0; e < state.edges.length; e++) {
    await expect(byId(page, edgeId(state.size, e))).toHaveAttribute('data-state', MARKS[state.edges[e] ?? 0] as string);
  }
  for (const [i, k] of state.clues.entries()) {
    if (k < 0) continue;
    await expect(byId(page, `clue-${Math.floor(i / state.size)}-${i % state.size}`)).toHaveAttribute('data-value', String(k));
  }
});

test('slitherlink: keyboard play and closing the loop ends the game calmly', async ({ page }) => {
  await page.goto('/games/slitherlink?seed=1234&difficulty=easy');
  await page.getByTestId('new-game').click();

  // Keyboard: Shift+arrow cycles the line leaving the focused point; Ctrl+Z undoes.
  const dot = byId(page, 'dot-0-0');
  await dot.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(byId(page, 'edge-h-0-0')).toHaveAttribute('data-state', 'line');
  await page.keyboard.press('Control+z');
  await expect(byId(page, 'edge-h-0-0')).toHaveAttribute('data-state', 'unknown');
  // Plain arrows move the focus to the next point.
  await page.keyboard.press('ArrowRight');
  await expect(byId(page, 'dot-0-1')).toBeFocused();

  // Draw the recorded solution with taps.
  await expect.poll(async () => (await readSave(page, 'slitherlink')) !== undefined).toBe(true);
  const state = await saved(page);
  for (let e = 0; e < state.solution.length; e++) {
    if (state.solution[e] === 1) await byId(page, edgeId(state.size, e)).click();
  }
  await expect(byId(page, 'sl-status')).toHaveAttribute('data-status', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('slitherlink: the 10×10 board fits a phone and taps near a line hit that line', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/slitherlink?seed=77&difficulty=hard');
  await page.getByTestId('new-game').click();
  await expect(byId(page, 'edge-h-10-9')).toBeAttached();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const centre = async (id: string) => {
    const box = await byId(page, id).boundingBox();
    if (!box) throw new Error(`no box for ${id}`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  // The board can extend below the fold on a phone; bring the tapped area into view first.
  await byId(page, 'dot-4-4').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const a = await centre('dot-4-4');
  const b = await centre('dot-4-5');
  const c = await centre('dot-5-4');
  const cell = Math.abs(b.x - a.x);
  expect(cell).toBeGreaterThanOrEqual(26);
  // A tap a quarter cell below the middle of a horizontal line, and beside a vertical one.
  await page.mouse.click((a.x + b.x) / 2, a.y + cell / 4);
  await expect(byId(page, 'edge-h-4-4')).toHaveAttribute('data-state', 'line');
  await page.mouse.click(a.x + cell / 4, (a.y + c.y) / 2);
  await expect(byId(page, 'edge-v-4-4')).toHaveAttribute('data-state', 'line');
  // The clue cells never swallow taps: even next to a cell's centre (where the four sides' targets meet) a side is hit.
  const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x as number, y as number)?.closest('[data-testid^="edge-"]')?.getAttribute('data-testid') ?? '', [(a.x + b.x) / 2, a.y + cell * 0.45]);
  expect(['edge-h-4-4', 'edge-h-5-4', 'edge-v-4-4', 'edge-v-4-5']).toContain(hit);
});
