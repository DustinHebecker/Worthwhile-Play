import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { position, preview, type PeelState } from '../../packages/games/pixel-peel/src/rules';

const ID = 'pixel-peel';
const root = (page: Page) => page.getByTestId('game-root');
const saved = async (page: Page) => ((await readSave(page, ID)) as { state: PeelState }).state;

/** Waits until the autosave holds a game, then returns its state. */
async function savedState(page: Page): Promise<PeelState> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return saved(page);
}

const buttonFor = (page: Page, move: string) => root(page).getByTestId(move.startsWith('L') ? `pp-lane-${move.slice(1)}` : `pp-slot-${move.slice(1)}`);

test('pixel-peel: playing the stored solution through the buttons reveals the picture and ends calmly', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { motif: 'red-fox' } });
  const state = await savedState(page);
  expect(state.motif).toBe('red-fox');
  await expect(root(page).getByTestId('pp-title')).toHaveText('Red fox');
  for (const move of state.witness) await buttonFor(page, move).click();
  await expect(root(page).getByRole('heading', { name: 'Red fox' })).toBeVisible();
  await expect(root(page).getByTestId('pp-reveal-stats')).toContainText(`Peeled in ${state.witness.length} launches`);
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect.poll(async () => (await saved(page)).reported).toBe(true);
});

test('pixel-peel: a hard game is solved by its stored witness, including parking moves', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'winter-village' } });
  const state = await savedState(page);
  expect(state.slots).toBe(2);
  for (const move of state.witness) await buttonFor(page, move).click();
  await expect(root(page).getByTestId('pp-reveal')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('pixel-peel: moves, the position and undo survive a reload', async ({ page }) => {
  let witness: string[] = [];
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const state = await savedState(p);
      witness = state.witness;
      await buttonFor(p, witness[0]!).click();
      await buttonFor(p, witness[1]!).click();
      await expect.poll(async () => (await saved(p)).moves).toEqual(witness.slice(0, 2));
    },
    { difficulty: 'medium', settings: { motif: 'koala' } }
  );
  const state = await saved(page);
  expect(state.moves).toEqual(witness.slice(0, 2));
  // The restored board matches the replayed position.
  await expect(root(page).getByTestId('pp-left')).toHaveAttribute('data-left', String(position(state).cells.filter((c) => c !== '.').length));
  await root(page).getByTestId('pp-undo').click();
  await expect.poll(async () => (await saved(page)).moves).toEqual(witness.slice(0, 1));
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
  await expect(root(page).getByTestId('pp-status')).toContainText('waits in place');
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

test('pixel-peel: keyboard only — arrow keys choose a lane, Enter launches and the result is announced', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { motif: 'fjord' } });
  await savedState(page);
  await root(page).getByTestId('pp-lane-0').focus();
  await page.keyboard.press('ArrowRight');
  await expect(root(page).getByTestId('pp-lane-1')).toBeFocused();
  await expect(root(page).getByTestId('pp-status')).toContainText(/removes|finds nothing/);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await saved(page)).moves).toEqual(['L1']);
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
  await expect(root(page).getByTestId('pp-status')).toContainText('Hint: lane');
});

test('pixel-peel: at 360 × 740 nothing scrolls sideways, targets are large enough and the picture fits', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { difficulty: 'hard', settings: { motif: 'summer-meadow' } });
  await savedState(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const canvas = await root(page).getByTestId('pp-canvas').boundingBox();
  expect((canvas?.x ?? -1) >= 0 && (canvas?.x ?? 0) + (canvas?.width ?? 999) <= 360).toBe(true);
  for (const id of ['pp-lane-0', 'pp-lane-1', 'pp-lane-2', 'pp-undo', 'pp-restart', 'pp-hint']) {
    const box = await root(page).getByTestId(id).boundingBox();
    expect(box?.width ?? 0, id).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
  }
  for (const id of ['pp-colours', 'pp-options']) {
    const box = await root(page).getByTestId(id).locator('summary').boundingBox();
    expect(box?.height ?? 0, id).toBeGreaterThanOrEqual(44);
  }
  // A parked shooter's button is large enough too.
  const state = await saved(page);
  const pos = position(state);
  const park = pos.lanes.map((_, i) => `L${i}`).find((m) => preview(pos, m).legal && preview(pos, m).left > 0);
  if (park) {
    await root(page).getByTestId(`pp-lane-${park.slice(1)}`).click();
    const box = await root(page).getByTestId('pp-slot-0').boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
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
