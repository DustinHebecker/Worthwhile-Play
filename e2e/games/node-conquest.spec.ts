import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedConquest {
  map: number;
  opponents: number;
  difficulty: string;
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

/** Scrolls a node into view (the map may extend below the fold), then clicks it. */
async function clickNode(page: Page, v: number) {
  const node = page.getByTestId(`node-${v}`);
  await node.scrollIntoViewIfNeeded();
  await node.click();
}

/** Rewrites the stored save into the state-version-1 format (difficulty easy/medium/hard, no opponents field). */
async function downgradeSave(page: Page, difficulty: 'easy' | 'medium' | 'hard') {
  await page.evaluate(
    (d) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const store = open.result.transaction('saves', 'readwrite').objectStore('saves');
          const get = store.get('node-conquest');
          get.onsuccess = () => {
            const save = get.result as { stateVersion: number; difficulty?: string; state: Record<string, unknown> };
            for (const key of ['opponents', 'layout', 'half', 'hist', 'centre']) delete save.state[key];
            save.state.difficulty = d;
            save.stateVersion = 1;
            save.difficulty = d;
            const put = store.put(save);
            put.onsuccess = () => resolve();
            put.onerror = () => reject(put.error);
          };
          get.onerror = () => reject(get.error);
        };
      }),
    difficulty
  );
}

test('node-conquest: a paused battle resumes exactly after a reload', async ({ page }) => {
  let from = -1;
  let to = -1;
  await expectResumeAfterReload(page, 'node-conquest', async (p) => {
    [from, to] = await startAndNeighbour(p);
    await clickNode(p, from);
    await clickNode(p, to);
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
  const pausedText = await page.getByTestId('nc-status').textContent();
  await page.getByTestId('nc-pause').click();
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'running');
  // Let at least one displayed second of game time pass (rAF can be slow on a loaded machine).
  await expect.poll(async () => /(\d+):(\d+)/.exec((await page.getByTestId('nc-status').textContent())!)![0], { timeout: 10_000 }).not.toBe(/(\d+):(\d+)/.exec(pausedText!)![0]);
  await page.keyboard.press('p');
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'paused');
  await expect.poll(async () => (await savedState(page)).tick).toBeGreaterThan(state.tick);
});

test('node-conquest: a match on a hand-built map with crossing lanes resumes after a reload', async ({ page }) => {
  let marks = 0;
  let from = -1;
  let to = -1;
  await expectResumeAfterReload(page, 'node-conquest', async (p) => {
    // Map 8 (index 7): neighbouring factions are linked by lanes that cross (marked crossing points, no bridges).
    await p.getByTestId('nc-map-select').selectOption('7');
    await expect.poll(async () => (await savedState(p))?.map).toBe(7);
    marks = await p.locator('[data-testid^="crossing-"]').count();
    expect(marks).toBeGreaterThan(0);
    await expect(p.locator('[data-testid^="bridge-"], [data-testid^="gap-"]')).toHaveCount(0);
    [from, to] = await startAndNeighbour(p);
    await clickNode(p, from);
    await clickNode(p, to);
    await expect(p.getByTestId(laneId(from, to))).toHaveAttribute('data-active', `${from}-${to}`);
  });
  const state = await savedState(page);
  expect(state.map).toBe(7);
  expect(state.out[from]).toContain(to);
  await expect(page.getByTestId('nc-map-select')).toHaveValue('7');
  await expect(page.locator('[data-testid^="crossing-"]')).toHaveCount(marks);
  await expect(page.getByTestId(laneId(from, to))).toHaveAttribute('data-active', new RegExp(`${from}-${to}`));
});

test('node-conquest: dragging from node to node activates a path; Space pauses', async ({ page }) => {
  await page.goto('/games/node-conquest');
  await page.getByTestId('new-game').click();
  const [from, to] = await startAndNeighbour(page);
  // The map is seeded randomly, so the start node may lie below the fold: centre the pair first.
  await page.evaluate(([f, t]) => {
    const box = (id: string) => document.querySelector(`[data-testid="${id}"] .nc-body`)!.getBoundingClientRect();
    const [p, q] = [box(`node-${f}`), box(`node-${t}`)];
    window.scrollBy(0, (p.top + q.bottom) / 2 - window.innerHeight / 2);
  }, [from, to]);
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

test('node-conquest: changing the opponent count or map asks first during a match', async ({ page }) => {
  await page.goto('/games/node-conquest');
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('nc-opponents')).toHaveValue('1');
  // Untouched: switches at once.
  await page.getByTestId('nc-opponents').selectOption('2');
  await expect(page.getByTestId('nc-confirm')).toBeHidden();
  await expect(page.locator('.nc-legend li[data-faction]')).toHaveCount(3);
  await expect.poll(async () => (await savedState(page))?.opponents).toBe(2);

  // Under way: asks, and No keeps the match.
  const [from, to] = await startAndNeighbour(page);
  await clickNode(page, from);
  await clickNode(page, to);
  await expect(page.getByTestId(laneId(from, to))).toHaveAttribute('data-active', `${from}-${to}`);
  const map = (await savedState(page))!.map;
  const other = String((map + 1) % 13);
  await page.getByTestId('nc-map-select').selectOption(other);
  await expect(page.getByTestId('nc-confirm')).toBeVisible();
  await page.getByTestId('nc-confirm-no').click();
  await expect(page.getByTestId('nc-confirm')).toBeHidden();
  await expect(page.getByTestId('nc-map-select')).toHaveValue(String(map));
  await expect(page.getByTestId(laneId(from, to))).toHaveAttribute('data-active', `${from}-${to}`);

  // Yes starts the new setup.
  await page.getByTestId('nc-map-select').selectOption(other);
  await page.getByTestId('nc-confirm-yes').click();
  await expect(page.getByTestId('nc-confirm')).toBeHidden();
  await expect.poll(async () => (await savedState(page))?.map).toBe(Number(other));
  expect((await savedState(page))!.opponents).toBe(2);
  expect((await savedState(page))!.out.every((o) => o.length === 0)).toBe(true);

  // The opponent count is remembered on this device: after a reload a fresh new match keeps it.
  await page.reload();
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('nc-opponents')).toHaveValue('2');
  await expect(page.locator('.nc-legend li[data-faction]')).toHaveCount(3);
  await expect.poll(async () => (await savedState(page))?.opponents).toBe(2);
});

test('node-conquest: the introduction guides step by step; zoom buttons work', async ({ page }) => {
  await page.goto('/games/node-conquest');
  await page.getByTestId('new-game').click();
  await page.getByTestId('nc-map-select').selectOption('-1');
  await expect(page.getByTestId('nc-hint')).toContainText('1');
  await expect(page.getByTestId('nc-opponents')).toBeDisabled();
  await clickNode(page, 0);
  await expect(page.getByTestId('nc-hint')).toContainText('2');
  await clickNode(page, 1);
  await expect(page.getByTestId(laneId(0, 1))).toHaveAttribute('data-active', '0-1');
  await expect(page.getByTestId('nc-hint')).toContainText('3');

  const board = page.getByTestId('nc-board');
  await page.getByTestId('nc-zoom-in').click();
  await expect(board).toHaveAttribute('data-zoom', '1.50');
  await page.getByTestId('nc-zoom-fit').click();
  await expect(board).toHaveAttribute('data-zoom', '1.00');
  expect((await savedState(page))!.map).toBe(-1);
});

test('node-conquest: a save from the previous version continues as an equivalent match', async ({ page }) => {
  await page.goto('/games/node-conquest');
  await page.getByTestId('new-game').click();
  // Version-1 saves only ever had the generated maps 0–6 (the seed may pick a newer, hand-built one).
  await page.getByTestId('nc-map-select').selectOption('2');
  await expect.poll(async () => (await savedState(page))?.map).toBe(2);
  await page.getByTestId('nc-opponents').selectOption('3');
  await expect.poll(async () => (await savedState(page))?.opponents).toBe(3);
  await downgradeSave(page, 'hard');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('nc-board')).toBeVisible();
  await expect(page.getByTestId('save-corrupt')).toHaveCount(0);
  await expect(page.getByTestId('nc-opponents')).toHaveValue('3');
  await expect(page.locator('.nc-legend li[data-faction]')).toHaveCount(4);
  await expect(page.getByTestId('nc-status')).toHaveAttribute('data-state', 'paused');
});

test('node-conquest: touch taps on nodes select and target (no page scroll from nodes)', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'touch devices only');
  await page.goto('/games/node-conquest');
  await page.getByTestId('new-game').click();
  await page.getByTestId('nc-map-select').selectOption('-1');
  const tap = async (v: number) => {
    const body = page.getByTestId(`node-${v}`).locator('.nc-body');
    await body.scrollIntoViewIfNeeded();
    const box = (await body.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  };
  await tap(0);
  await expect(page.getByTestId('node-0')).toHaveAttribute('aria-pressed', 'true');
  await tap(2);
  await expect(page.getByTestId(laneId(0, 2))).toHaveAttribute('data-active', '0-2');
  await expect(page.getByTestId('nc-board')).toHaveCSS('touch-action', 'pan-y');
});

test.describe('node-conquest at 360 px', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  /** Every node's hit circle and the closest pair of node centres, in CSS px. */
  const measure = (page: Page) =>
    page.locator('.nc-node .nc-hit').evaluateAll((els) => {
      const boxes = els.map((el) => el.getBoundingClientRect());
      const centres = boxes.map((b) => [b.x + b.width / 2, b.y + b.height / 2] as const);
      let minDistance = Infinity;
      for (let i = 0; i < centres.length; i++)
        for (let j = i + 1; j < centres.length; j++) minDistance = Math.min(minDistance, Math.hypot(centres[i]![0] - centres[j]![0], centres[i]![1] - centres[j]![1]));
      return { minSide: Math.min(...boxes.map((b) => Math.min(b.width, b.height))), minDistance, board: document.querySelector('.nc-board')!.getBoundingClientRect().width };
    });

  test('node-conquest: every node has a ≥ 44 × 44 px hit target on all maps and opponent counts', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'phone viewport only');
    await page.goto('/games/node-conquest');
    await page.getByTestId('new-game').click();
    const rows: string[] = [];
    for (const opponents of ['1', '2', '3']) {
      await page.getByTestId('nc-opponents').selectOption(opponents);
      for (let map = 0; map < 13; map++) {
        await page.getByTestId('nc-map-select').selectOption(String(map));
        await expect.poll(async () => (await savedState(page))?.map).toBe(map);
        await expect(page.locator('.nc-legend li[data-faction]')).toHaveCount(Number(opponents) + 1);
        const m = await measure(page);
        rows.push(`${Number(opponents) + 1}f map ${map}: hit ${m.minSide.toFixed(1)} px, closest centres ${m.minDistance.toFixed(1)} px (board ${m.board.toFixed(1)} px)`);
        expect(m.minSide, rows.at(-1)).toBeGreaterThanOrEqual(44);
        // Half the closest spacing (the area that only ever picks one node) is itself ≥ 44 px wide.
        expect(m.minDistance, rows.at(-1)).toBeGreaterThanOrEqual(44);
      }
    }
    testInfo.annotations.push({ type: 'measurements', description: rows.join('\n') });
  });

  test('node-conquest: taps near the edge of a hit target pick that node, also on a dense map', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'touch devices only');
    await page.goto('/games/node-conquest');
    await page.getByTestId('new-game').click();
    const centre = async (v: number) => {
      const box = (await page.getByTestId(`node-${v}`).locator('.nc-hit').boundingBox())!;
      return [box.x + box.width / 2, box.y + box.height / 2] as const;
    };
    /** Taps 21 px from node v's centre, towards node w (inside v's own 22 px half-spacing). */
    const tapToward = async (v: number, w: number) => {
      await page.getByTestId(`node-${v}`).scrollIntoViewIfNeeded();
      const [a, b] = [await centre(v), await centre(w)];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      await page.touchscreen.tap(a[0] + ((b[0] - a[0]) / len) * 21, a[1] + ((b[1] - a[1]) / len) * 21);
    };
    for (const [opponents, map] of [
      ['2', '12'],
      ['3', '7'],
      ['1', '0']
    ] as const) {
      await page.getByTestId('nc-opponents').selectOption(opponents);
      await page.getByTestId('nc-map-select').selectOption(map);
      if (await page.getByTestId('nc-confirm').isVisible()) await page.getByTestId('nc-confirm-yes').click();
      await expect.poll(async () => (await savedState(page))?.map).toBe(Number(map));
      await expect.poll(async () => (await savedState(page))?.opponents).toBe(Number(opponents));
      const [from, to] = await startAndNeighbour(page);
      await tapToward(from, to);
      await expect(page.getByTestId(`node-${from}`)).toHaveAttribute('aria-pressed', 'true');
      await tapToward(to, from);
      await expect(page.getByTestId(laneId(from, to))).toHaveAttribute('data-active', `${from}-${to}`);
    }
  });
});
