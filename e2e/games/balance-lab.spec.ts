import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame, submitStart } from '../../packages/testing/src/e2e';
import { content as en } from '../../packages/games/balance-lab/src/content/en';
import { content as uk } from '../../packages/games/balance-lab/src/content/uk';
import type { FreeState, RoundState } from '../../packages/games/balance-lab/src/rules';

const ID = 'balance-lab';
const root = (page: Page) => page.getByTestId('game-root');

async function savedState<S = RoundState>(page: Page): Promise<S> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return ((await readSave(page, ID)) as { state: S }).state;
}

/** The hook of the free weight in the witness (beam-hook and easy beam-weights hang one weight). */
async function witnessHook(page: Page, index: number): Promise<number> {
  const s = await savedState(page);
  const w = s.items[index]!.witness!;
  if (w.bench !== 'beam') throw new Error('not a beam task');
  return w.s.weights.find((x) => x.free)!.hook;
}

test('balance-lab: predict a lever, then build one with the keyboard only', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'round', bench: 'beam', tasks: 'mixed' } });
  const r = root(page);
  await expect(r.getByTestId('bl-progress')).toContainText('1');
  // Predict: nothing in the page tells the answer before "Let go".
  await expect(r.getByTestId('bl-outcome')).toHaveCount(0);
  const s = await savedState(page);
  await r.getByTestId(`bl-opt-${s.items[0]!.answer}`).check();
  await r.getByTestId('bl-letgo').click();
  await expect(r.getByTestId('bl-outcome')).toHaveAttribute('data-matched', 'true');
  await expect(r.getByTestId('bl-why')).toHaveAttribute('open', '');
  await r.getByTestId('bl-next').click();
  // Build with the keyboard: the scene is one tab stop; arrows move the cursor, Enter places.
  const hook = await witnessHook(page, 1);
  const scene = r.getByTestId('bl-scene-wrap');
  await scene.focus();
  for (let i = 0; i < Math.abs(hook); i++) await page.keyboard.press(hook < 0 ? 'ArrowLeft' : 'ArrowRight');
  await page.keyboard.press('Enter');
  await r.getByTestId('bl-letgo').focus();
  await page.keyboard.press('Enter');
  await expect(r.getByTestId('bl-outcome')).toHaveAttribute('data-status', 'solved');
});

test('balance-lab: a placed weight survives a reload (resumable)', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('bl-skip').click();
      await r.getByTestId('bl-next').click();
      await r.getByTestId('bl-tray-0').click();
      await r.getByTestId('bl-place').click();
      await expect(r.locator('[data-testid^="bl-placed-"]').first()).toBeVisible();
    },
    { difficulty: 'easy', settings: { mode: 'round', bench: 'beam', tasks: 'mixed' } }
  );
  const s = await savedState(page);
  const draft = s.items[1]!.draft;
  expect(draft.bench === 'beam' && draft.s.weights.some((w) => w.free)).toBe(true);
});

test('balance-lab: the best overhang with the step buttons on a phone, no page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'round', bench: 'stack', tasks: 'build' } });
  const r = root(page);
  let s = await savedState(page);
  let i = s.items.findIndex((it) => it.id === 'stack-overhang');
  // Show the solution of tasks before it (any other build task) to reach the overhang task.
  for (let k = 0; k < i; k++) {
    await r.getByTestId('bl-solution').click();
    await r.getByTestId('bl-next').click();
  }
  // The save is written after the last "Next"; wait for it instead of reading a stale one.
  const want = i;
  await expect.poll(async () => (await savedState(page)).index).toBe(want);
  s = await savedState(page);
  i = s.index;
  const item = s.items[i]!;
  expect(item.id).toBe('stack-overhang');
  const target = item.witness!.s as { bodies: { left: number }[] };
  // Move the bottom block first, then the ones above, with the ±1 / ±4 cm buttons.
  for (let k = 0; k < target.bodies.length; k++) {
    await r.getByTestId(`bl-body-${k}`).click();
    let current = ((await savedState(page)).items[i]!.draft.s as { bodies: { left: number }[] }).bodies[k]!.left;
    const goal = target.bodies[k]!.left;
    while (current !== goal) {
      const diff = goal - current;
      await r.getByTestId(Math.abs(diff) >= 4 ? (diff > 0 ? 'bl-step-right4' : 'bl-step-left4') : diff > 0 ? 'bl-step-right' : 'bl-step-left').click();
      const next = ((await savedState(page)).items[i]!.draft.s as { bodies: { left: number }[] }).bodies[k]!.left;
      if (next === current) break;
      current = next;
    }
  }
  await r.getByTestId('bl-letgo').click();
  await expect(r.getByTestId('bl-outcome')).toBeVisible();
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(scroll).toBeLessThanOrEqual(0);
});

test('balance-lab: the free bench lets go, holds again and resumes', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('bl-step-left').click();
      await r.getByTestId('bl-step-left').click();
      await r.getByTestId('bl-place').click();
      await r.getByTestId('bl-letgo').click();
      await expect(r.getByTestId('bl-outcome')).toContainText('left');
      await r.getByTestId('bl-hold').click();
      await r.getByTestId('bl-letgo').click();
    },
    { settings: { mode: 'free', freeBench: 'beam' } }
  );
  const s = await savedState<FreeState>(page);
  expect(s.outcome).not.toBeNull();
  await expect(root(page).getByTestId('bl-hold')).toBeVisible();
});

test('balance-lab: in Arabic the scene is not mirrored and "Let go" works', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('worthwhile-play:ui-locale', 'ar'));
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'round', bench: 'mixed', tasks: 'mixed' } });
  const r = root(page);
  await expect(r.getByTestId('bl-scene-wrap')).toHaveAttribute('dir', 'ltr');
  await r.getByTestId('bl-opt-1').check();
  await r.getByTestId('bl-letgo').click();
  await expect(r.getByTestId('bl-outcome')).toBeVisible();
});

test('balance-lab: on the free mobile every tap on an empty hook in the picture hangs a weight (phone width)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { settings: { mode: 'free', freeBench: 'mobile' } });
  const r = root(page);
  const slots = r.locator('.bl-slot');
  const empty = await slots.count();
  // Pointer taps on the drawn hooks (the picture is framed to its content, so this checks the tap mapping too).
  await slots.last().click({ force: true });
  await expect(slots).toHaveCount(empty - 1);
  await slots.first().click({ force: true });
  await expect(slots).toHaveCount(empty - 2);
  await expect(r.locator('.bl-kg')).toHaveCount(2);
});

type Point = { x: number; y: number };

/** Drags from one viewport point to another: with the mouse on desktop, with a finger (real touch input) on a phone. */
async function drag(page: Page, from: Point, to: Point, touch: boolean): Promise<void> {
  const steps = 12;
  if (!touch) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps });
    await page.mouse.up();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', p?: Point) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p.x, y: p.y }] : [] });
  await send('touchStart', from);
  for (let i = 1; i <= steps; i++) await send('touchMove', { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps });
  await send('touchEnd');
  await cdp.detach();
}

const centre = async (l: ReturnType<Page['locator']>): Promise<Point> => {
  const b = (await l.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

test('balance-lab: drag a weight from the tray onto a hook, then drag it to the hook that levels the bar (mouse or touch)', async ({ page, isMobile }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'round', bench: 'beam', tasks: 'build' } });
  const r = root(page);
  const hook = await witnessHook(page, 0);
  const s0 = await savedState(page);
  const half = (s0.items[0]!.scene.s as { half: number }).half;
  const first = hook > 0 ? -half : half;
  // Scene and tray in view together (the scene is first in the column).
  await r.getByTestId('bl-scene').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  const hookAt = async (h: number) => {
    const c = await centre(r.locator('.bl-hook').nth(h + half));
    return { x: c.x, y: c.y + 24 };
  };
  await drag(page, await centre(r.getByTestId('bl-tray-0')), await hookAt(first), isMobile);
  await expect.poll(async () => (((await savedState(page)).items[0]!.draft.s as { weights: { free?: boolean }[] }).weights.filter((w) => w.free).length)).toBe(1);
  // The page did not scroll while the finger moved over it.
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  const placed = (await savedState(page)).items[0]!.draft.s as { weights: { hook: number; free?: boolean }[] };
  const at = placed.weights.find((w) => w.free)!.hook;
  expect(Math.abs(at - first)).toBeLessThanOrEqual(1);
  // A tap on the placed weight would not move it; a drag does.
  await drag(page, await centre(r.locator('[data-drag^="weight:"] .bl-mass')), await hookAt(hook), isMobile);
  await expect.poll(async () => ((await savedState(page)).items[0]!.draft.s as { weights: { hook: number; free?: boolean }[] }).weights.find((w) => w.free)?.hook).toBe(hook);
  await r.getByTestId('bl-letgo').click();
  await expect(r.getByTestId('bl-outcome')).toHaveAttribute('data-status', 'solved');
});

/** Switches the UI language through the header menu (re-renders the current page). */
async function switchLanguage(page: Page, locale: string): Promise<void> {
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption(locale);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

test('balance-lab: the texts of a language never loaded before are available offline (precached)', async ({ page, context }) => {
  await page.goto(`/games/${ID}`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await submitStart(page, { settings: { mode: 'free', freeBench: 'beam' } });
  await expect(root(page).getByTestId('bl-letgo')).toHaveText(en['btn.letGo']);
  await context.setOffline(true);
  // The game page re-renders in Ukrainian; its in-game texts come from a chunk that was never requested before.
  await switchLanguage(page, 'uk');
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('bl-letgo')).toHaveText(uk['btn.letGo']);
  await root(page).getByTestId('bl-place').click();
  await root(page).getByTestId('bl-letgo').click();
  await expect(root(page).getByTestId('bl-hold')).toHaveText(uk['free.hold']);
  await context.setOffline(false);
});
