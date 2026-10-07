import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

type Island = [number, number, number];
interface SavedBridges {
  size: number;
  islands: Island[];
  solution: number[];
  bridges: number[];
}

const root = (page: Page) => page.getByTestId('game-root');
const island = (page: Page, r: number, c: number) => root(page).getByTestId(`island-${r}-${c}`);
const saved = async (page: Page) => ((await readSave(page, 'bridges')) as { state: SavedBridges }).state;

/** Edges in the game's order: for each island (row-major), its right then its lower line-neighbour. */
function edgesOf(size: number, islands: readonly Island[]): [number, number][] {
  const at = new Map(islands.map(([r, c], i) => [r * size + c, i]));
  const edges: [number, number][] = [];
  islands.forEach(([r, c], a) => {
    for (let cc = c + 1; cc < size; cc++) {
      const b = at.get(r * size + cc);
      if (b !== undefined) {
        edges.push([a, b]);
        break;
      }
    }
    for (let rr = r + 1; rr < size; rr++) {
      const b = at.get(rr * size + c);
      if (b !== undefined) {
        edges.push([a, b]);
        break;
      }
    }
  });
  return edges;
}

/** Islands as rendered (coordinates from the test ids, numbers from data-need). */
async function renderedIslands(page: Page): Promise<Island[]> {
  const list = await root(page)
    .locator('[data-testid^="island-"]')
    .evaluateAll((els) => els.map((el) => [el.getAttribute('data-testid') ?? '', Number(el.getAttribute('data-need'))] as const));
  return list
    .map(([id, need]): Island => {
      const [, r, c] = id.split('-');
      return [Number(r), Number(c), need];
    })
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
}

/** Taps both ends of an edge (select, then the partner), which cycles its bridges. */
async function tapEdge(page: Page, islands: readonly Island[], [a, b]: [number, number]) {
  const [r1, c1] = islands[a] as Island;
  const [r2, c2] = islands[b] as Island;
  await island(page, r1, c1).click();
  await island(page, r2, c2).click();
}

const bridgeId = (islands: readonly Island[], [a, b]: [number, number]) => {
  const [r1, c1] = islands[a] as Island;
  const [r2, c2] = islands[b] as Island;
  return `bridge-${r1}-${c1}-${r2}-${c2}`;
};

test('bridges: built bridges survive a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'bridges', async (p) => {
    const islands = await renderedIslands(p);
    const [first, second] = edgesOf(7, islands);
    if (!first || !second) throw new Error('puzzle without two edges');
    for (const edge of [first, second]) {
      await tapEdge(p, islands, edge);
      await expect(root(p).getByTestId(bridgeId(islands, edge))).toHaveAttribute('data-count', '1');
    }
    // A second tap pair makes the first bridge double.
    await tapEdge(p, islands, first);
    await expect(root(p).getByTestId(bridgeId(islands, first))).toHaveAttribute('data-count', '2');
  });

  // The restored board visibly matches the saved logical state, bridge by bridge and island by island.
  const state = await saved(page);
  const edges = edgesOf(state.size, state.islands);
  expect(state.bridges.filter((k) => k > 0)).toHaveLength(2);
  for (let e = 0; e < edges.length; e++) {
    await expect(root(page).getByTestId(bridgeId(state.islands, edges[e] as [number, number]))).toHaveAttribute('data-count', String(state.bridges[e]));
  }
  const have = state.islands.map(() => 0);
  edges.forEach(([a, b], e) => {
    have[a] = (have[a] ?? 0) + (state.bridges[e] ?? 0);
    have[b] = (have[b] ?? 0) + (state.bridges[e] ?? 0);
  });
  for (const [i, [r, c, need]] of state.islands.entries()) {
    await expect(island(page, r, c)).toHaveAttribute('data-need', String(need));
    await expect(island(page, r, c)).toHaveAttribute('data-have', String(have[i]));
  }
});

test('bridges: keyboard play and completing the puzzle ends the game calmly', async ({ page }) => {
  await page.goto('/games/bridges?seed=1234&difficulty=easy');
  await page.getByTestId('new-game').click();
  const islands = await renderedIslands(page);
  const edges = edgesOf(7, islands);

  // Keyboard: Shift+arrow builds towards the line-neighbour of the focused island.
  const [a, b] = edges[0] as [number, number];
  const [r1, c1] = islands[a] as Island;
  const r2 = (islands[b] as Island)[0];
  const start = island(page, r1, c1);
  await start.focus();
  await page.keyboard.press(r1 === r2 ? 'Shift+ArrowRight' : 'Shift+ArrowDown');
  await expect(root(page).getByTestId(bridgeId(islands, [a, b]))).toHaveAttribute('data-count', '1');
  await page.keyboard.press('Control+z');
  await expect(root(page).getByTestId(bridgeId(islands, [a, b]))).toHaveAttribute('data-count', '0');
  // Plain arrows move the focus to another island.
  await page.keyboard.press(r1 === r2 ? 'ArrowRight' : 'ArrowDown');
  await expect(start).not.toBeFocused();
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? '')).toMatch(/^island-\d+-\d+$/);

  // Build the recorded solution with taps.
  await expect.poll(async () => (await readSave(page, 'bridges')) !== undefined).toBe(true);
  const state = await saved(page);
  for (let e = 0; e < edges.length; e++) {
    const edge = edges[e] as [number, number];
    const target = root(page).getByTestId(bridgeId(islands, edge));
    for (let k = 0; k < 3 && (await target.getAttribute('data-count')) !== String(state.solution[e]); k++) await tapEdge(page, islands, edge);
  }
  await expect(root(page).getByTestId('br-status')).toHaveAttribute('data-status', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('bridges: the 11×11 board fits a phone with non-overlapping 44 px island targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/bridges?seed=77&difficulty=hard');
  await page.getByTestId('new-game').click();
  const islands = await renderedIslands(page);
  expect(islands.length).toBeGreaterThanOrEqual(22);
  const last = islands[islands.length - 1] as Island;
  await expect(island(page, last[0], last[1])).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const boxes = await root(page)
    .locator('[data-testid^="island-"]')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as { x: number; y: number; width: number; height: number }));
  for (const box of boxes) {
    expect(box.width).toBeGreaterThanOrEqual(32);
    expect(box.height).toBeGreaterThanOrEqual(32);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const p = boxes[i] as (typeof boxes)[number];
      const q = boxes[j] as (typeof boxes)[number];
      const overlap = p.x < q.x + q.width - 0.5 && q.x < p.x + p.width - 0.5 && p.y < q.y + q.height - 0.5 && q.y < p.y + p.height - 0.5;
      expect(overlap, `islands ${i} and ${j} overlap`).toBe(false);
    }
  }
});
