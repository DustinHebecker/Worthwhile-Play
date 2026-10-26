import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { posteriorAfter, roundPercents, type CheckCase, type ClueCase, type PdState, type TrapCase } from '../../packages/games/probability-detective/src/rules';

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
    const c = ((await savedState(page)).cases[0] as ClueCase);
    const target = roundPercents(posteriorAfter(c, k + 1))[0]!;
    await setRange(page, target);
    await expect.poll(async () => ((await savedState(page)).cases[0] as ClueCase).draft[0]).toBe(target);
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
      await expect.poll(async () => ((await savedState(p)).cases[0] as ClueCase).answers.length).toBe(1);
    },
    { difficulty: 'medium' }
  );
  const s = await savedState(page);
  const c0 = s.cases[0] as ClueCase;
  await expect(root(page).getByTestId('pd-clue-1')).toBeVisible();
  await expect(root(page).getByTestId('pd-range')).toHaveValue(String(c0.draft[0]));
  expect(c0.draft[0]).toBe((c0.answers[0] as number[])[0]! + 2);
});

test('probability-detective: a whole round with the keyboard only, skipping, ends with a calm summary', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'hard' });
  const r = root(page);
  for (let i = 0; i < 5; i++) {
    const c = ((await savedState(page)).cases[i] as ClueCase);
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

/** Answers every trap question: the first option of a choice, or one step up for a probability. */
async function answerTrap(page: Page, c: TrapCase) {
  const r = root(page);
  for (let qi = 0; qi < c.drafts.length; qi++) {
    const first = r.getByTestId(`pd-q${qi}-o0`);
    if ((await first.count()) > 0) await first.check();
    else await r.getByTestId(`pd-q${qi}-plus`).click();
    await expect.poll(async () => ((await savedState(page)).cases[(await savedState(page)).index] as TrapCase).drafts[qi]).not.toBeNull();
  }
}

test('probability-detective: a check run and a chosen option survive a reload, then the decision is reviewed', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      const r = root(p);
      await r.getByTestId('pd-run-0').click();
      await expect(r.getByTestId('pd-result-0')).toBeVisible();
      await expect.poll(async () => ((await savedState(p)).cases[0] as CheckCase).done).toEqual([0]);
      await r.getByTestId('pd-ready').click();
      await expect(r.locator('#pd-decide-h')).toBeFocused();
      await r.getByTestId('pd-choice-0').check();
      await expect.poll(async () => ((await savedState(p)).cases[0] as CheckCase).choice).toBe(0);
    },
    { difficulty: 'easy', settings: { mode: 'checks' } }
  );
  const r = root(page);
  await expect(r.getByTestId('pd-result-0')).toBeVisible();
  await expect(r.getByTestId('pd-choice-0')).toBeChecked();
  await r.getByTestId('pd-decide').click();
  await expect(r.locator('#pd-review-heading')).toBeFocused();
  await expect(r.getByTestId('pd-truth')).toBeVisible();
  await expect(r.getByTestId('pd-decision')).toBeVisible();
  // One row per action: the check that was run, then the decision.
  await expect(r.getByTestId('pd-investigation').locator('li')).toHaveCount(2);
  await expect.poll(async () => ((await savedState(page)).cases[0] as CheckCase).decision).toBe(0);
});

test('probability-detective: a trap round of five, answered and checked, ends with a summary', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { mode: 'traps' } });
  const r = root(page);
  for (let i = 0; i < 5; i++) {
    await expect.poll(async () => (await savedState(page)).index).toBe(i);
    const c = (await savedState(page)).cases[i] as TrapCase;
    expect(c.kind).toBe('trap');
    await expect(r.getByTestId('pd-trap-story')).toBeVisible();
    await answerTrap(page, c);
    await r.getByTestId('pd-trap-check').click();
    await expect(r.locator('#pd-review-heading')).toBeFocused();
    await expect(r.getByTestId('pd-explain')).toBeVisible();
    for (let qi = 0; qi < c.drafts.length; qi++) await expect(r.getByTestId(`pd-q${qi}-exact`)).toBeVisible();
    await r.getByTestId(i < 4 ? 'pd-next' : 'pd-summary-btn').click();
  }
  await expect(r.getByTestId('pd-summary-list').locator('li')).toHaveCount(5);
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('probability-detective: a mixed round runs clues, trap, checks, trap, clues in that order', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'mixed' } });
  const r = root(page);
  const kinds = ((await savedState(page)).cases).map((c) => c.kind);
  expect(kinds).toEqual(['clues', 'trap', 'checks', 'trap', 'clues']);
  for (let i = 0; i < 5; i++) {
    await expect.poll(async () => (await savedState(page)).index).toBe(i);
    const c = (await savedState(page)).cases[i]!;
    if (c.kind === 'clues') {
      for (let k = 0; k < c.clues.length; k++) await r.getByTestId('pd-skip').click();
    } else if (c.kind === 'trap') {
      await r.getByTestId('pd-skip').click();
    } else {
      await r.getByTestId('pd-ready').click();
      await r.getByTestId('pd-choice-1').check();
      await r.getByTestId('pd-decide-skip').click();
    }
    await expect(r.locator('#pd-review-heading')).toBeFocused();
    await r.getByTestId(i < 4 ? 'pd-next' : 'pd-summary-btn').click();
  }
  await expect(r.getByTestId('pd-summary-list').locator('li')).toHaveCount(5);
  await expect(page.getByTestId('finished')).toBeVisible();
  expect((await savedState(page)).reported).toBe(true);
});
