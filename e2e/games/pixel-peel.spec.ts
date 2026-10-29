import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { position, presentCount, preview, type PeelState } from '../../packages/games/pixel-peel/src/rules';

const ID = 'pixel-peel';
const root = (page: Page) => page.getByTestId('game-root');
const saved = async (page: Page) => ((await readSave(page, ID)) as { state: PeelState }).state;

/** Waits until the autosave holds a game, then returns its state. */
async function savedState(page: Page): Promise<PeelState> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return saved(page);
}

// Most tests launch with one press: "Confirm before launch" (on by default for touch screens) is switched off here.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wp:pref:pixel-peel:display', JSON.stringify({ confirm: false })));
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
  // Upright phone: the picture sticks to the top and takes at most half the height.
  await page.setViewportSize({ width: 360, height: 640 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'tiger' } });
  await savedState(page);
  const board = root(page).getByTestId('pp-board');
  expect(await board.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
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
