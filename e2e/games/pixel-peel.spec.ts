import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame, submitStart } from '../../packages/testing/src/e2e';
import { position, presentCount, preview, tableOfState, type PeelState } from '../../packages/games/pixel-peel/src/rules';
import { runPolicy } from '../../packages/games/pixel-peel/src/policies';
import { CATALOGUES as messages } from '../../packages/games/pixel-peel/src/locales/index';
import { COMMON_MESSAGES } from '../../packages/localization/src/common-messages';

const ID = 'pixel-peel';
const root = (page: Page) => page.getByTestId('game-root');
const saved = async (page: Page) => ((await readSave(page, ID)) as { state: PeelState }).state;

/** Waits until the autosave holds a game, then returns its state. */
async function savedState(page: Page): Promise<PeelState> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return saved(page);
}

// Most tests launch with one press: "Confirm before launch" (on by default for touch screens) is switched off here,
// and Peeling is Off (the tests of slow peeling switch it on). Only on the first load of a test: after a reload the
// game reads back what it stored.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('pp-test-prefs')) return;
    sessionStorage.setItem('pp-test-prefs', '1');
    localStorage.setItem('wp:pref:pixel-peel:display', JSON.stringify({ confirm: false, peeling: 'off' }));
  });
});

const buttonFor = (page: Page, move: string) => root(page).getByTestId(move.startsWith('L') ? `pp-lane-${move.slice(1)}` : `pp-slot-${move.slice(1)}`);

/** Plays the witness from move `from` to `to` (exclusive) through the buttons and waits for the save. */
async function playWitness(page: Page, state: PeelState, from: number, to: number): Promise<void> {
  for (const move of state.witness.slice(from, to)) await buttonFor(page, move).click();
  await expect.poll(async () => (await saved(page)).moves.length).toBe(to);
}

/** The witness prefix length after which a shooter waits in a waiting place for the first time (≥ `atLeast`). */
function prefixWithPark(state: PeelState, atLeast: number): number {
  for (let k = 1; k <= state.witness.length; k++) {
    if (k < atLeast) continue;
    const pos = position({ ...state, moves: state.witness.slice(0, k) });
    if (pos.slots.some((s) => s !== null)) return k;
  }
  return -1;
}

test('pixel-peel: playing the stored solution through the buttons reveals the picture and ends calmly', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { motif: 'red-fox' } });
  const state = await savedState(page);
  expect(state.motif).toBe('red-fox');
  expect(state.picture.w).toBe(32);
  await expect(root(page).getByTestId('pp-title')).toHaveText(`Red fox · ${state.picture.palette.length} colours`);
  for (const move of state.witness) await buttonFor(page, move).click();
  await expect(root(page).getByRole('heading', { name: 'Red fox' })).toBeVisible();
  await expect(root(page).getByTestId('pp-reveal-stats')).toContainText(`Peeled in ${state.witness.length} launches`);
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect.poll(async () => (await saved(page)).reported).toBe(true);
});

test('pixel-peel: a hard game (64 wide, 4 waiting places) is solved by its stored witness through the UI', async ({ page }) => {
  test.setTimeout(120_000);
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'winter-village' } });
  const state = await savedState(page);
  expect(state.slots).toBe(4);
  expect(state.picture.w).toBe(64);
  expect(prefixWithPark(state, 1), 'the hard witness parks a shooter').toBeGreaterThan(0);
  for (const move of state.witness) await buttonFor(page, move).click();
  await expect(root(page).getByTestId('pp-reveal')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect.poll(async () => (await saved(page)).reported).toBe(true);
});

test('pixel-peel: ten or more hard moves, including a shooter in a waiting place, survive a reload', async ({ page }) => {
  let state: PeelState | undefined;
  let k = 0;
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      state = await savedState(p);
      k = prefixWithPark(state, 10);
      expect(k).toBeGreaterThan(0);
      await playWitness(p, state, 0, k);
    },
    { difficulty: 'hard', settings: { motif: 'winter-village' } }
  );
  const after = await saved(page);
  expect(after.moves).toEqual(state!.witness.slice(0, k));
  // The restored board matches the replayed position, with the parked shooter in its place.
  const pos = position(after);
  await expect(root(page).getByTestId('pp-left')).toHaveAttribute('data-left', String(presentCount(pos)));
  const parked = pos.slots.findIndex((s) => s !== null);
  await expect(root(page).getByTestId(`pp-slot-${parked}`)).toBeVisible();
  await root(page).getByTestId('pp-undo').click();
  await expect.poll(async () => (await saved(page)).moves).toEqual(state!.witness.slice(0, k - 1));
});

test('pixel-peel: undo after a shooter went to a waiting place restores the lane; restart, then undo, brings the moves back', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'tiger' } });
  let state = await savedState(page);
  // Follow the witness until some lane front would end up in a waiting place (shots left), then launch it.
  let park: string | undefined;
  for (let k = 0; k < state.witness.length && !park; k++) {
    const pos = position(state);
    park = pos.lanes.map((_, i) => `L${i}`).find((m) => preview(pos, m).legal && preview(pos, m).left > 0);
    if (!park) {
      await buttonFor(page, state.witness[k]!).click();
      await expect.poll(async () => (await saved(page)).moves.length).toBe(k + 1);
      state = await saved(page);
    }
  }
  expect(park, 'a move into a waiting place exists on hard').toBeDefined();
  const before = state.moves;
  const lane = root(page).getByTestId(`pp-lane-${park!.slice(1)}`);
  const label = await lane.getAttribute('aria-label');
  await lane.click();
  await expect(root(page).getByTestId('pp-status')).toContainText('waits in');
  await expect.poll(async () => (await saved(page)).moves).toEqual([...before, park]);
  await root(page).getByTestId('pp-undo').click();
  await expect(lane).toHaveAttribute('aria-label', label!);
  await expect.poll(async () => (await saved(page)).moves).toEqual(before);

  if (before.length > 0) {
    await root(page).getByTestId('pp-restart').click();
    await expect.poll(async () => (await saved(page)).moves).toEqual([]);
    await root(page).getByTestId('pp-undo').click();
    await expect.poll(async () => (await saved(page)).moves).toEqual(before);
  }
});

test('pixel-peel: keyboard only — arrow keys choose a lane, the spotlight follows, Enter launches', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { motif: 'fjord' } });
  const state = await savedState(page);
  const legal = position(state).lanes.map((_, i) => `L${i}`).filter((m) => preview(position(state), m).hits.length > 0);
  const target = Number(legal[0]!.slice(1));
  await root(page).getByTestId('pp-lane-0').focus();
  for (let i = 0; i < target; i++) await page.keyboard.press('ArrowRight');
  const lane = root(page).getByTestId(`pp-lane-${target}`);
  await expect(lane).toBeFocused();
  await expect(root(page).getByTestId('pp-status')).toContainText(/removes/);
  await expect(root(page).getByTestId('pp-canvas')).toHaveAttribute('data-spotlight', (await lane.getAttribute('data-colour'))!);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await saved(page)).moves).toEqual([`L${target}`]);
  await expect(root(page).getByTestId('pp-live')).toContainText(/removed|waits/);
  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await saved(page)).moves).toEqual([]);
});

test('pixel-peel: the hint marks a shooter', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { motif: 'elephant' } });
  await savedState(page);
  await root(page).getByTestId('pp-hint').click();
  await expect(root(page).locator('[data-hint="true"]')).toHaveCount(1);
  await expect(root(page).locator('[data-hint="true"]')).toContainText('Hint');
  await expect(root(page).getByTestId('pp-status')).toContainText('Hint: ');
});

test('pixel-peel: at 360 × 740 a 64-wide picture fits, nothing scrolls sideways and targets are large enough', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'summer-meadow' } });
  const state = await savedState(page);
  expect(state.picture.w).toBe(64);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const canvas = await root(page).getByTestId('pp-canvas').boundingBox();
  expect((canvas?.x ?? -1) >= 0 && (canvas?.x ?? 0) + (canvas?.width ?? 999) <= 360).toBe(true);
  // Small cells: no symbols on the picture; the spotlight carries the preview.
  await expect(root(page).getByTestId('pp-canvas')).toHaveAttribute('data-symbols', 'none');
  for (const id of ['pp-lane-0', 'pp-lane-1', 'pp-lane-2', 'pp-lane-3', 'pp-undo', 'pp-restart', 'pp-hint', 'pp-lanes-toggle']) {
    const box = await root(page).getByTestId(id).boundingBox();
    expect(box?.width ?? 0, id).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
  }
  for (const id of ['pp-colours', 'pp-options']) {
    const box = await root(page).getByTestId(id).locator('summary').boundingBox();
    expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
  }
  // Compact lanes on a phone; "Show whole lanes" shows every shooter.
  const toggle = root(page).getByTestId('pp-lanes-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const all = state.lanes.reduce((n, lane) => n + lane.length - 1, 0);
  expect(await root(page).locator('.pp-chip:visible').count()).toBeLessThan(all);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(root(page).locator('.pp-chip:visible')).toHaveCount(all);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  // A parked shooter's button is large enough too.
  const pos = position(state);
  const park = pos.lanes.map((_, i) => `L${i}`).find((m) => preview(pos, m).legal && preview(pos, m).left > 0);
  if (park) {
    await root(page).getByTestId(`pp-lane-${park.slice(1)}`).click();
    const box = await root(page).getByTestId('pp-slot-0').boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

/**
 * Held sideways (or on a wide screen) the picture and the lanes sit side by side: with the play area scrolled to the
 * top, the whole picture and every lane front are on screen at once, nothing covers a lane, nothing scrolls sideways.
 */
async function expectSideBySide(page: Page, rtl = false): Promise<void> {
  const viewport = page.viewportSize()!;
  await root(page).locator('.pp-main').evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY));
  const canvas = (await root(page).getByTestId('pp-canvas').boundingBox())!;
  expect(canvas.y).toBeGreaterThanOrEqual(-1);
  expect(canvas.y + canvas.height).toBeLessThanOrEqual(viewport.height + 1);
  for (let i = 0; i < 4; i++) {
    const lane = (await root(page).getByTestId(`pp-lane-${i}`).boundingBox())!;
    // Beside the picture (on the inline-end side), not below it.
    if (rtl) expect(lane.x + lane.width, `lane ${i}`).toBeLessThanOrEqual(canvas.x);
    else expect(lane.x, `lane ${i}`).toBeGreaterThanOrEqual(canvas.x + canvas.width);
    expect(lane.y, `lane ${i}`).toBeGreaterThanOrEqual(0);
    expect(lane.y + lane.height, `lane ${i}`).toBeLessThanOrEqual(viewport.height);
    expect(lane.width, `lane ${i}`).toBeGreaterThanOrEqual(44);
    expect(lane.height, `lane ${i}`).toBeGreaterThanOrEqual(44);
    const hit = await page.evaluate(([x, y]) => (document.elementFromPoint(x!, y!) as HTMLElement | null)?.closest('[data-testid]')?.getAttribute('data-testid'), [lane.x + lane.width / 2, lane.y + lane.height / 2]);
    expect(hit, `lane ${i} is not covered`).toBe(`pp-lane-${i}`);
  }
  await expect(root(page).getByTestId('pp-status')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
}

test('pixel-peel: the picture fits the screen height; held sideways it sits beside the lanes', async ({ page }) => {
  // Upright phone: the picture sticks to the top and leaves room for the rest of the play unit.
  await page.setViewportSize({ width: 360, height: 640 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'tiger' } });
  await savedState(page);
  const frame = root(page).getByTestId('pp-frame');
  expect(await frame.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
  expect((await root(page).getByTestId('pp-canvas').boundingBox())?.height ?? 999).toBeLessThanOrEqual(320);
  // Sideways (740 × 360): the picture fits the height and moves beside the lanes.
  await page.setViewportSize({ width: 740, height: 360 });
  await expect.poll(async () => (await root(page).getByTestId('pp-canvas').boundingBox())?.height ?? 999).toBeLessThanOrEqual(0.9 * 360);
  await expectSideBySide(page);
  // Scrolling on to the buttons below the lanes keeps the picture in view beside them.
  const undo = root(page).getByTestId('pp-undo');
  await undo.scrollIntoViewIfNeeded();
  await expect(undo).toBeInViewport();
  await expect(root(page).getByTestId('pp-canvas')).toBeInViewport({ ratio: 0.99 });
});

for (const [width, height, motif] of [[844, 390, 'summer-meadow'], [640, 360, 'red-fox']] as const) {
  test(`pixel-peel: at ${width} × ${height} the picture and the lanes are side by side and both in view`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await startGame(page, ID, { difficulty: motif === 'red-fox' ? 'easy' : 'hard', settings: { motif } });
    await savedState(page);
    await expectSideBySide(page);
  });
}

test('pixel-peel: held sideways in Arabic the lanes sit on the inline-end side of the picture', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('worthwhile-play:ui-locale', 'ar'));
  await page.setViewportSize({ width: 740, height: 360 });
  await startGame(page, ID, { difficulty: 'medium', settings: { motif: 'llama' } });
  await savedState(page);
  await expectSideBySide(page, true);
});

test('pixel-peel: Large view scrolls inside its region, pans with the arrow keys and shows symbols', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'koala' } });
  await savedState(page);
  await root(page).getByTestId('pp-options').locator('summary').click();
  await root(page).getByTestId('pp-option-large').check();
  const board = root(page).getByTestId('pp-board');
  await expect(board).toHaveAttribute('role', 'region');
  await expect(root(page).getByTestId('pp-canvas')).toHaveAttribute('data-cell', '14');
  await expect(root(page).getByTestId('pp-canvas')).toHaveAttribute('data-symbols', 'edge');
  expect(await board.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await board.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => board.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test('pixel-peel: on a touch screen the first tap previews with the spotlight and the picture stays in view; the second tap launches', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'touch default');
  await page.addInitScript(() => localStorage.removeItem('wp:pref:pixel-peel:display'));
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'llama' } });
  const state = await savedState(page);
  const move = state.witness[0]!;
  const button = buttonFor(page, move);
  await button.scrollIntoViewIfNeeded();
  await button.tap();
  await expect(button).toHaveClass(/is-selected/);
  await expect(root(page).getByTestId('pp-canvas')).not.toHaveAttribute('data-spotlight', '');
  // The picture is sticky: still on screen while the lanes are in view.
  const canvas = await root(page).getByTestId('pp-canvas').boundingBox();
  const viewport = page.viewportSize()!;
  expect(canvas!.y).toBeGreaterThanOrEqual(-1);
  expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect((await saved(page)).moves).toEqual([]);
  await button.tap();
  await expect.poll(async () => (await saved(page)).moves).toEqual([move]);
  await expect(root(page).getByTestId('pp-options').locator('summary')).toBeVisible();
});

test('pixel-peel: a chosen picture is not remembered — the next start screen offers any picture again', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { motif: 'red-fox' } });
  await savedState(page);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('start-game')).toBeVisible();
  await expect(page.getByTestId('setting-motif')).toHaveValue('any');
  await expect(page.getByTestId('difficulty').locator('input[value="easy"]')).toBeChecked();
});

test('pixel-peel: the picture select groups the pictures by kind, each group starting with "Any …"; "Any animal" plays an animal', async ({ page }) => {
  await page.goto(`/games/${ID}`);
  const select = page.getByTestId('setting-motif');
  await expect(select).toBeVisible();
  const parts = await select.evaluate((el) =>
    [...el.children].map((child) =>
      child.tagName === 'OPTGROUP' ? { group: (child as HTMLOptGroupElement).label, values: [...child.children].map((o) => (o as HTMLOptionElement).value) } : { option: (child as HTMLOptionElement).value }
    )
  );
  expect(parts[0]).toEqual({ option: 'any' });
  const groups = parts.slice(1) as { group: string; values: string[] }[];
  expect(groups.slice(0, 4).map((g) => g.group)).toEqual(['Seasons', 'Landscapes', 'Animals', 'Everyday scenes']);
  for (const g of groups) expect(g.values[0], g.group).toMatch(/^any-/);
  await expect(select).toHaveValue('any');
  const animals = groups[2]!.values.slice(1);
  expect(animals).toContain('red-fox');
  await submitStart(page, { difficulty: 'easy', settings: { motif: 'any-animal' } });
  const state = await savedState(page);
  expect(state.choice).toBe('any-animal');
  expect(animals).toContain(state.motif);
});

test('pixel-peel: offline, a picture whose art was never loaded starts (every art chunk is precached)', async ({ page, context }) => {
  await page.goto(`/games/${ID}`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(page.getByTestId('start-game')).toBeVisible();
  // The art of each picture is a chunk of its own, loaded only when a game with it starts.
  const loadedArt = () => page.evaluate(() => performance.getEntriesByType('resource').some((e) => /\/lighthouse-[^/]*\.js$/.test(e.name)));
  expect(await loadedArt()).toBe(false);
  await context.setOffline(true);
  await submitStart(page, { difficulty: 'hard', settings: { motif: 'lighthouse' } });
  const state = await savedState(page);
  expect([state.motif, state.picture.w, state.picture.h]).toEqual(['lighthouse', 45, 60]);
  await expect(root(page).getByTestId('pp-title')).toContainText('Lighthouse');
  expect(await loadedArt()).toBe(true);
  await context.setOffline(false);
});

test('pixel-peel: in Arabic the lanes start at inline-start and the picture is not mirrored', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('worthwhile-play:ui-locale', 'ar'));
  await startGame(page, ID, { difficulty: 'medium', settings: { motif: 'llama' } });
  await savedState(page);
  await expect(root(page).locator('.wp-pixel-peel')).toHaveAttribute('dir', 'rtl');
  await expect(root(page).getByTestId('pp-canvas').locator('..')).toHaveAttribute('dir', 'ltr');
  const first = await root(page).getByTestId('pp-lane-box-0').boundingBox();
  const second = await root(page).getByTestId('pp-lane-box-1').boundingBox();
  expect((first?.x ?? 0) > (second?.x ?? 0)).toBe(true);
  await root(page).getByTestId('pp-lane-0').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(root(page).getByTestId('pp-lane-1')).toBeFocused();
});

// --- Design v3 § 4: one screen of play on a phone held upright -------------------------------------------------------

/** The play unit's parts that must be on screen together (owner, 2026-10-29), plus the title line and the actions. */
const UNIT = ['pp-title', 'pp-canvas', 'pp-status', 'pp-actions'] as const;

async function unitBoxes(page: Page): Promise<Record<string, { top: number; bottom: number; left: number; right: number }>> {
  return root(page).locator('.wp-pixel-peel').evaluate((el) => {
    const out: Record<string, { top: number; bottom: number; left: number; right: number }> = {};
    const add = (name: string, node: Element | null) => {
      if (!node) return;
      const r = node.getBoundingClientRect();
      out[name] = { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
    };
    for (const id of ['pp-title', 'pp-canvas', 'pp-status', 'pp-actions']) add(id, el.querySelector(`[data-testid="${id}"]`));
    el.querySelectorAll('.pp-slot-cell').forEach((cell, j) => add(`slot-${j}`, cell));
    el.querySelectorAll('.pp-front-cell').forEach((cell, i) => add(`front-${i}`, cell));
    el.querySelectorAll('.pp-chips').forEach((list, i) => add(`chips-${i}`, list));
    return out;
  });
}

function expectInViewport(boxes: Record<string, { top: number; bottom: number; left: number; right: number }>, width: number, height: number, label: string): void {
  for (const [name, b] of Object.entries(boxes)) {
    expect(b.top, `${label}: ${name} top`).toBeGreaterThanOrEqual(-0.5);
    expect(b.bottom, `${label}: ${name} bottom`).toBeLessThanOrEqual(height + 0.5);
    expect(b.left, `${label}: ${name} left`).toBeGreaterThanOrEqual(-0.5);
    expect(b.right, `${label}: ${name} right`).toBeLessThanOrEqual(width + 0.5);
  }
  // In order, without overlap: title, picture, status, waiting places, lane fronts (with their chips), actions.
  const order = ['pp-title', 'pp-canvas', 'pp-status', 'slot-0', 'front-0', 'chips-0', 'pp-actions'];
  for (let k = 1; k < order.length; k++) expect(boxes[order[k]!]!.top, `${label}: ${order[k]} below ${order[k - 1]}`).toBeGreaterThanOrEqual(boxes[order[k - 1]!]!.bottom - 0.5);
}

for (const [width, height] of [[360, 640], [360, 740], [390, 844], [412, 915]] as const) {
  // The smallest phone also gets the tallest (45 × 60) and the widest (64 × 32) pictures of the new aspects.
  for (const motif of width === 360 && height === 640 ? ['winter-village', 'red-fox', 'lighthouse', 'lavender-fields'] : ['winter-village', 'red-fox']) {
    test(`pixel-peel: at ${width} × ${height} (${motif}) picture, status, waiting places and lane fronts fit one screen through 10 moves`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'viewport sizes are set explicitly');
      await page.setViewportSize({ width, height });
      await startGame(page, ID, { difficulty: 'hard', settings: { motif } });
      const state = await savedState(page);
      // After Start the unit is scrolled into view once (next frame).
      await expect.poll(async () => {
        const b = await unitBoxes(page);
        return b['pp-title']!.top >= -0.5 && b['pp-actions']!.bottom <= height + 0.5;
      }).toBe(true);
      const first = await unitBoxes(page);
      expectInViewport(first, width, height, 'start');
      const scrollY = await page.evaluate(() => window.scrollY);
      // Ten moves of the stored solution, at least up to its first shooter in a waiting place.
      const n = Math.max(10, prefixWithPark(state, 1));
      for (let k = 0; k < n; k++) {
        await buttonFor(page, state.witness[k]!).click();
        await expect.poll(async () => (await saved(page)).moves.length).toBe(k + 1);
        const now = await unitBoxes(page);
        expectInViewport(now, width, height, `after move ${k + 1}`);
        for (const id of [...UNIT, 'slot-0', 'front-0', 'front-3']) {
          expect(Math.abs(now[id]!.top - first[id]!.top), `${id} stays put after move ${k + 1}`).toBeLessThanOrEqual(1);
        }
        expect(await page.evaluate(() => window.scrollY), `no scrolling after move ${k + 1}`).toBe(scrollY);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      for (const id of ['pp-lane-0', 'pp-lane-1', 'pp-lane-2', 'pp-lane-3', 'pp-undo', 'pp-hint', 'pp-display']) {
        const box = (await root(page).getByTestId(id).boundingBox())!;
        expect(box.width, id).toBeGreaterThanOrEqual(44);
        expect(box.height, id).toBeGreaterThanOrEqual(44);
      }
    });
  }
}

test('pixel-peel: on a phone the stuck notice is a card over the picture; the lanes do not move', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'viewport sizes are set explicitly');
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 360, height: 640 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'red-fox' } });
  const state = await savedState(page);
  // The obvious play (most hits first) gets stuck on hard; play it through the buttons.
  const run = runPolicy(tableOfState(state), 'obvious', 1, { left: 1e8 });
  expect(run.result).toBe('stuck');
  const before = await unitBoxes(page);
  for (const move of run.moves) await buttonFor(page, move).click();
  await expect.poll(async () => (await saved(page)).moves.length).toBe(run.moves.length);
  const card = root(page).getByTestId('pp-stuck');
  await expect(card).toBeVisible();
  const after = await unitBoxes(page);
  for (const id of ['pp-status', 'slot-0', 'front-0', 'pp-actions']) expect(Math.abs(after[id]!.top - before[id]!.top), id).toBeLessThanOrEqual(1);
  const frame = (await root(page).getByTestId('pp-frame').boundingBox())!;
  // The card lies in the notice layer over the picture (it scrolls inside when it is taller).
  const box = (await root(page).locator('.pp-notices').boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(frame.y - 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(640);
  // Esc closes it; nothing else changes.
  await root(page).getByTestId('pp-stuck-close').click();
  await expect(card).toBeHidden();
  expect((await saved(page)).moves).toHaveLength(run.moves.length);
});

/**
 * Fonts differ between devices (and between this container and CI). The status and the action row fit themselves
 * (steps down to 0.75 rem); the tests check that behaviour with the normal font and with a wider one (letter-spacing
 * 0.05 em), so they catch real-device variance instead of depending on exact font metrics.
 */
const WIDER_FONT = '.wp-pixel-peel, .wp-pixel-peel * { letter-spacing: 0.05em !important; }';

test('pixel-peel: the status fits its box with the longest result and preview texts of every locale at 360 px, also with a wider font', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'viewport sizes are set explicitly');
  await page.setViewportSize({ width: 360, height: 640 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'red-fox' } });
  await savedState(page);
  const status = root(page).getByTestId('pp-status');
  const box = (await status.boundingBox())!;
  for (const wider of [false, true]) {
    if (wider) await page.addStyleTag({ content: WIDER_FONT });
    for (const [locale, cat] of Object.entries(messages as Record<string, Record<string, string>>)) {
      const colour = Object.entries(cat).filter(([k]) => k.startsWith('colour.')).map(([, v]) => v).reduce((a, b) => (b.length > a.length ? b : a));
      const fill = (text: string, extra: Record<string, string> = {}) =>
        text.replace(/\{(\w+)\}/g, (_, k: string) => extra[k] ?? ({ shooter: `${colour} 88`, n: '88', left: '88', slot: '4', lane: '4', k: '188' } as Record<string, string>)[k] ?? '88');
      const reason = [cat['reason.noSlot']!, cat['reason.nothing']!].map((r) => fill(r)).reduce((a, b) => (b.length > a.length ? b : a));
      const texts = Object.entries(cat)
        .filter(([k]) => k.startsWith('preview.') || k.startsWith('result.') || k === 'hint.lane' || k === 'status.startShort')
        .map(([k, v]) => fill(v, { reason }) + (k.startsWith('preview.') ? ` ${cat['confirm.again'] ?? ''}` : ''));
      const problems = await status.evaluate(async (el, list) => {
        const bad: string[] = [];
        for (const text of list) {
          el.textContent = text;
          // The view fits the text after each change (a mutation observer, before the next frame).
          await new Promise((r) => requestAnimationFrame(r));
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (el.scrollHeight > el.clientHeight + 1) bad.push(`overflows at ${size} px: ${text}`);
          if (size < 12) bad.push(`font ${size} px below 0.75 rem: ${text}`);
        }
        return bad;
      }, texts);
      expect(problems, `${locale}${wider ? ', wider font' : ''}`).toEqual([]);
      // The box itself never changes: nothing below it moves.
      const now = (await status.boundingBox())!;
      expect(Math.abs(now.height - box.height) + Math.abs(now.y - box.y)).toBeLessThanOrEqual(1);
    }
  }
});

test('pixel-peel: the action row holds Undo, Hint, Display and Finish peeling of every locale in one row at 360 px, also with a wider font', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'viewport sizes are set explicitly');
  await page.addInitScript(() => localStorage.setItem('wp:pref:pixel-peel:display', JSON.stringify({ confirm: false, peeling: 'quick' })));
  await page.setViewportSize({ width: 360, height: 640 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'red-fox' } });
  const state = await savedState(page);
  const height = (await root(page).getByTestId('pp-actions').boundingBox())!.height;
  for (const move of state.witness.slice(0, 4)) await buttonFor(page, move).click();
  await expect(root(page).getByTestId('pp-finish-peeling')).toBeVisible();
  for (const wider of [false, true]) {
    if (wider) await page.addStyleTag({ content: WIDER_FONT });
    for (const [locale, cat] of Object.entries(messages as Record<string, Record<string, string>>)) {
      const common = (COMMON_MESSAGES as Record<string, Record<string, string>>)[locale]!;
      const labels = [common['common.undo']!, common['common.hint']!, cat['action.display']!, cat['action.finishPeeling']!];
      const problems = await root(page).locator('.wp-pixel-peel').evaluate(async (el, [lang, list]) => {
        el.setAttribute('lang', lang as string);
        const out: string[] = [];
        const row = el.querySelector('[data-testid="pp-actions"]') as HTMLElement;
        const buttons = ['pp-undo', 'pp-hint', 'pp-display', 'pp-finish-peeling'].map((id) => el.querySelector(`[data-testid="${id}"]`) as HTMLElement);
        buttons.forEach((b, i) => (b.querySelector('.pp-label')!.textContent = (list as string[])[i]!));
        // The view fits the row after each change (a mutation observer, before the next frame).
        await new Promise((r) => requestAnimationFrame(r));
        const r = row.getBoundingClientRect();
        for (const b of buttons) {
          const box = b.getBoundingClientRect();
          if (box.left < r.left - 0.5 || box.right > r.right + 0.5) out.push(`${b.dataset.testid} outside the row`);
          if (box.width < 44 || box.height < 44) out.push(`${b.dataset.testid} smaller than 44 px`);
          const size = parseFloat(getComputedStyle(b).fontSize);
          if (size < 12) out.push(`${b.dataset.testid}: font ${size} px below 0.75 rem`);
          const range = document.createRange();
          range.selectNodeContents(b.querySelector('.pp-label')!);
          const rects = [...range.getClientRects()];
          if (rects.some((x) => x.left < box.left - 0.5 || x.right > box.right + 0.5 || x.top < box.top - 0.5 || x.bottom > box.bottom + 0.5)) out.push(`${b.dataset.testid}: "${b.textContent}" spills out at ${size} px`);
        }
        return { out, height: r.height, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      }, [locale, labels] as const);
      expect(problems.out, `${locale}${wider ? ', wider font' : ''}`).toEqual([]);
      // Finish peeling comes and goes during play: the row (and so the play unit) keeps its height in every locale.
      expect(problems.height, locale).toBeLessThanOrEqual(height + 0.5);
      expect(problems.scroll, locale).toBeLessThanOrEqual(0);
    }
  }
});

// --- Design v3 § 3 and § 12.9: peeling (Slow shoots line by line, Quick peels pixel by pixel) -------------------------

const withPeeling = async (page: Page, mode: 'slow' | 'quick') =>
  page.addInitScript((m) => {
    if (sessionStorage.getItem('pp-test-peeling')) return;
    sessionStorage.setItem('pp-test-peeling', '1');
    localStorage.setItem('wp:pref:pixel-peel:display', JSON.stringify({ confirm: false, peeling: m }));
  }, mode);
const slowPeeling = async (page: Page) => withPeeling(page, 'quick');
const board = (page: Page) => root(page).getByTestId('pp-board');
const peelingCount = async (page: Page) => Number(await board(page).getAttribute('data-peeling'));

for (const mode of ['quick', 'slow'] as const) {
test(`pixel-peel: peeling ${mode} — fast launches are saved at once and queue; Finish peeling ends the queue`, async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'viewport sizes are set explicitly');
  await withPeeling(page, mode);
  await page.setViewportSize({ width: 360, height: 640 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'winter-village' } });
  const state = await savedState(page);
  await expect(root(page).getByTestId(`pp-option-peel-${mode}`)).toBeChecked();
  const actions = (await root(page).getByTestId('pp-actions').boundingBox())!;
  for (const move of state.witness.slice(0, 3)) await buttonFor(page, move).click();
  await expect.poll(async () => (await saved(page)).moves).toEqual(state.witness.slice(0, 3));
  expect(await peelingCount(page)).toBeGreaterThan(0);
  const finish = root(page).getByTestId('pp-finish-peeling');
  await expect(finish).toBeVisible();
  // The Finish peeling button joins the action row without moving anything.
  const during = (await root(page).getByTestId('pp-actions').boundingBox())!;
  expect(Math.abs(during.y - actions.y) + Math.abs(during.height - actions.height)).toBeLessThanOrEqual(1);
  const box = (await finish.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  await finish.click();
  await expect(board(page)).toHaveAttribute('data-peeling', '0');
  await expect(board(page)).toHaveAttribute('data-pending', '0');
  await expect(finish).toBeHidden();
  const pos = position(await saved(page));
  await expect(root(page).getByTestId('pp-left')).toHaveAttribute('data-left', String(presentCount(pos)));
});

test(`pixel-peel: peeling ${mode} — a reload in the middle of peeling loses nothing and replays nothing`, async ({ page }) => {
  await withPeeling(page, mode);
  let state: PeelState | undefined;
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      state = await savedState(p);
      for (const move of state.witness.slice(0, 3)) await buttonFor(p, move).click();
      expect(await peelingCount(p)).toBeGreaterThan(0);
    },
    { difficulty: 'hard', settings: { motif: 'winter-village' } }
  );
  const after = await saved(page);
  expect(after.moves).toEqual(state!.witness.slice(0, 3));
  await expect(board(page)).toHaveAttribute('data-pending', '0');
  await expect(board(page)).toHaveAttribute('data-peeling', '0');
  await expect(root(page).getByTestId('pp-left')).toHaveAttribute('data-left', String(presentCount(position(after))));
});
}

test('pixel-peel: peeling slow — the shooter shoots line by line: the pixels go in steps, one shot after another', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one is enough');
  await withPeeling(page, 'slow');
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'red-fox' } });
  const state = await savedState(page);
  await buttonFor(page, state.witness[0]!).click();
  const pending = async () => Number(await board(page).getAttribute('data-pending'));
  const start = await pending();
  expect(start).toBeGreaterThan(1);
  const seen = new Set<number>([start]);
  for (let k = 0; k < 40 && (await pending()) > 0; k++) {
    seen.add(await pending());
    await page.waitForTimeout(100);
  }
  // Several distinct steps: shots, not one pop; and it ends by itself.
  expect(seen.size).toBeGreaterThan(2);
  await expect(board(page)).toHaveAttribute('data-peeling', '0', { timeout: 10_000 });
});

test('pixel-peel: the Display button opens the options mid-game; Quick → Off finishes the queue at once and is remembered', async ({ page, isMobile }) => {
  await slowPeeling(page);
  // On the phone, a small one: the panel is taller than the room under the sticky picture.
  if (isMobile) await page.setViewportSize({ width: 360, height: 640 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'red-fox' } });
  const state = await savedState(page);
  for (const move of state.witness.slice(0, 2)) await buttonFor(page, move).click();
  expect(await peelingCount(page)).toBeGreaterThan(0);
  const display = root(page).getByTestId('pp-display');
  await display.click();
  await expect(display).toHaveAttribute('aria-expanded', 'true');
  // Its heading (which closes it again) is on screen, not under the picture that sticks to the top on a phone.
  const heading = root(page).getByTestId('pp-options').locator('summary');
  await expect(heading).toBeInViewport();
  const [h, pic] = [(await heading.boundingBox())!, (await root(page).getByTestId('pp-frame').boundingBox())!];
  if (h.x < pic.x + pic.width && pic.x < h.x + h.width) expect(h.y).toBeGreaterThanOrEqual(pic.y + pic.height - 1);
  const off = root(page).getByTestId('pp-option-peel-off');
  await expect(off).toBeInViewport();
  await off.check();
  await expect(board(page)).toHaveAttribute('data-peeling', '0');
  await expect(board(page)).toHaveAttribute('data-pending', '0');
  // Off: the next launch draws at once.
  await buttonFor(page, state.witness[2]!).click();
  await expect.poll(async () => (await saved(page)).moves.length).toBe(3);
  expect(await peelingCount(page)).toBe(0);
  await display.click();
  await expect(display).toHaveAttribute('aria-expanded', 'false');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('pp-option-peel-off')).toBeChecked();
});

test('pixel-peel: with reduced motion there is no peeling animation and Peeling shows Off', async ({ page }) => {
  await slowPeeling(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'red-fox' } });
  const state = await savedState(page);
  await buttonFor(page, state.witness[0]!).click();
  await expect.poll(async () => (await saved(page)).moves.length).toBe(1);
  expect(await peelingCount(page)).toBe(0);
  await expect(root(page).getByTestId('pp-finish-peeling')).toBeHidden();
  await expect(root(page).getByTestId('pp-option-peel-off')).toBeChecked();
  await expect(root(page).getByTestId('pp-option-peel-slow')).toBeDisabled();
});

test('pixel-peel: at 1280 × 800 the play area is scrolled into view once, with the whole picture and every lane front on screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'viewport sizes are set explicitly');
  await page.setViewportSize({ width: 1280, height: 800 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'red-fox' } });
  await savedState(page);
  await expect(root(page).getByTestId('pp-canvas')).toBeInViewport({ ratio: 1 });
  for (let i = 0; i < 4; i++) await expect(root(page).getByTestId(`pp-lane-${i}`)).toBeInViewport({ ratio: 1 });
  await expect(root(page).getByTestId('pp-status')).toBeInViewport({ ratio: 1 });
  await expect(root(page).locator('.pp-slots')).toBeInViewport({ ratio: 1 });
});
