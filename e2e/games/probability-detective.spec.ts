import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { posteriorAfter, roundPercents, type PdState } from '../../packages/games/probability-detective/src/rules';

const ID = 'probability-detective';
const root = (page: Page) => page.getByTestId('game-root');

async function savedState(page: Page): Promise<PdState> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return ((await readSave(page, ID)) as { state: PdState }).state;
}

/** Sets the two-hypothesis range by keyboard: Home, then ArrowRight to the target. */
async function setRange(page: Page, value: number) {
  const range = root(page).getByTestId('pd-range');
  await range.focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < value; i++) await page.keyboard.press('ArrowRight');
  // The range commits on `change` (released key); blur as a user tabbing away would.
  await range.dispatchEvent('change');
}

test('probability-detective: exact estimates by keyboard are judged very close', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy' });
  const r = root(page);
  for (let k = 0; k < 2; k++) {
    const c = (await savedState(page)).cases[0]!;
    const target = roundPercents(posteriorAfter(c, k + 1))[0]!;
    await setRange(page, target);
    await expect.poll(async () => (await savedState(page)).cases[0]!.draft[0]).toBe(target);
    await r.getByTestId('pd-commit').click();
  }
  await expect(r.locator('#pd-review-heading')).toBeFocused();
  await expect(r.getByTestId('pd-verdict')).toHaveAttribute('data-band', 'spot');
  await expect(r.getByTestId('pd-truth')).toBeVisible();
  await expect(r.getByTestId('pd-ledger')).toBeVisible();
});

test('probability-detective: a changed draft and the revealed clues survive a reload', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('pd-commit').click();
      await expect(r.getByTestId('pd-clue-1')).toBeVisible();
      await r.getByTestId('pd-plus').click();
      await r.getByTestId('pd-plus').click();
      await expect.poll(async () => (await savedState(p)).cases[0]!.answers.length).toBe(1);
    },
    { difficulty: 'medium' }
  );
  const s = await savedState(page);
  await expect(root(page).getByTestId('pd-clue-1')).toBeVisible();
  await expect(root(page).getByTestId('pd-range')).toHaveValue(String(s.cases[0]!.draft[0]));
  expect(s.cases[0]!.draft[0]).toBe((s.cases[0]!.answers[0] as number[])[0]! + 2);
});

test('probability-detective: a whole round with the keyboard only, skipping, ends with a calm summary', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'hard' });
  const r = root(page);
  for (let i = 0; i < 5; i++) {
    const c = (await savedState(page)).cases[i]!;
    for (let k = 0; k < c.clues.length; k++) {
      await r.getByTestId('pd-skip').focus();
      await page.keyboard.press('Enter');
    }
    await expect(r.locator('#pd-review-heading')).toBeFocused();
    await r.getByTestId(i < 4 ? 'pd-next' : 'pd-summary-btn').focus();
    await page.keyboard.press('Enter');
  }
  await expect(r.getByTestId('pd-summary-list').locator('li')).toHaveCount(5);
  await expect(r.getByTestId('pd-tip')).toBeVisible();
  await expect(page.getByTestId('finished')).toBeVisible();
  expect((await savedState(page)).reported).toBe(true);
});

test('probability-detective: fits 360 px in Arabic (right to left, formulas left to right) with 44 px targets', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await startGame(page, ID, { difficulty: 'easy' });
  const r = root(page);
  await expect(r.locator('.wp-probability-detective')).toHaveAttribute('dir', 'rtl');
  for (const id of ['pd-minus', 'pd-plus', 'pd-commit', 'pd-skip']) {
    const box = (await r.getByTestId(id).boundingBox())!;
    expect(box.height, id).toBeGreaterThanOrEqual(44);
    expect(box.width, id).toBeGreaterThanOrEqual(44);
  }
  // The first hypothesis's segment starts at the inline start (the right edge in RTL).
  const bar = (await r.locator('.pd-panel .pd-split').boundingBox())!;
  const seg = (await r.locator('.pd-panel .pd-seg0').boundingBox())!;
  expect(Math.abs(seg.x + seg.width - (bar.x + bar.width))).toBeLessThanOrEqual(2);
  await r.getByTestId('pd-commit').click();
  await r.getByTestId('pd-commit').click();
  await expect(r.getByTestId('pd-review')).toBeVisible();
  await expect(r.locator('.pd-formula').first()).toHaveAttribute('dir', 'ltr');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
