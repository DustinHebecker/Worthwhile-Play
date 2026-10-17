import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, startGame } from '../../packages/testing/src/e2e';

const GAME = 'card-quest';

/** Phase and seat on turn as the page shows them (the autosave can lag the redraw, so tests read the DOM). */
interface Shown {
  phase: string;
  active: number;
}

const shown = async (page: Page): Promise<Shown> => {
  const root = page.getByTestId('card-quest');
  return { phase: (await root.getAttribute('data-phase')) ?? '', active: Number(await root.getAttribute('data-active')) };
};

/**
 * Chooses the number of computer players on the host's start screen (ADR 0017), then opens seed 11, which starts at
 * once with the remembered settings.
 */
async function start(page: Page, opponents = 3) {
  await startGame(page, GAME, { settings: { opponents } });
  await page.goto(`/games/${GAME}?seed=11`);
  await expect(page.getByTestId('players')).toBeVisible();
}

/** Clicks the main action button until the person is in the given phase (or the game is over). */
async function playUntil(page: Page, done: (s: Shown) => boolean, limit = 200) {
  for (let i = 0; i < limit; i++) {
    const s = await shown(page);
    if (done(s) || s.phase === 'over') return;
    const end = page.getByTestId('end');
    if ((await end.count()) > 0 && (await end.isDisabled())) {
      const tiles = page.locator('[data-testid="hand"] .cq-tile[aria-pressed="false"]');
      while (await end.isDisabled()) await tiles.first().click();
    }
    for (const id of ['open', 'rummage', 'pass', 'roll', 'end']) {
      const b = page.getByTestId(id);
      if ((await b.count()) > 0 && (await b.isEnabled())) {
        await b.click();
        break;
      }
    }
  }
}

test('card-quest: the start screen sets up the table; the game has no setup of its own', async ({ page }) => {
  await start(page, 5);
  await expect(page.locator('[data-testid^="player-"]')).toHaveCount(6);
  await expect(page.getByTestId('next')).toBeVisible();
});

test('card-quest: resumes in the middle of a fight after a reload', async ({ page }) => {
  await expectResumeAfterReload(page, GAME, async (p) => {
    await playUntil(p, (s) => s.phase === 'fight' && s.active === 0);
  });
  await expect(page.getByTestId('players')).toBeVisible();
});

test('card-quest: equipping an item from the hand raises the strength', async ({ page }) => {
  await start(page);
  await playUntil(page, (st) => st.phase === 'prepare' && st.active === 0);
  await expect(page.getByTestId('open')).toBeVisible();
  const item = page.locator('[data-testid="hand"] .cq-tile[data-type="item"]').filter({ hasNot: page.locator('.cq-tile-num', { hasText: '+0' }) }).first();
  test.skip((await item.count()) === 0, 'no item in this hand');
  const card = (await item.getAttribute('data-card'))!;
  const strength = page.getByTestId('player-0');
  const before = await strength.textContent();
  await item.click();
  await page.getByTestId('act-equip').click();
  await expect(page.getByTestId('mine').locator(`[data-card="${card}"]`)).toBeVisible();
  await expect(strength).not.toHaveText(before ?? '');
});

for (const locale of ['en', 'ar']) {
  test(`card-quest: fits a 360 px screen without horizontal scrolling (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.addInitScript((l) => localStorage.setItem('worthwhile-play:ui-locale', l), locale);
    await start(page, 5);
    await playUntil(page, (s) => s.phase === 'fight');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

const LOCALES = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh-Hans', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'];

test('card-quest: the start screen fits 360 px in all 16 languages', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const locale of LOCALES) {
    await page.addInitScript((l) => localStorage.setItem('worthwhile-play:ui-locale', l), locale);
    await page.goto(`/games/${GAME}`);
    await expect(page.getByTestId('setting-roundLimit')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, locale).toBeLessThanOrEqual(0);
  }
});

test('card-quest: after a main action the focus moves to the next main action', async ({ page }) => {
  await start(page);
  await playUntil(page, (st) => st.phase === 'prepare' && st.active === 0);
  await page.getByTestId('open').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.cq button.primary:focus, .cq .cq-next-text:focus')).toHaveCount(1);
});

test('card-quest: in the give-away step a card can be read and closed without giving anything away', async ({ page }) => {
  await start(page);
  // Play on until the person must give cards away (the end button waits for a choice).
  for (let i = 0; i < 400; i++) {
    const end = page.getByTestId('end');
    if ((await end.count()) > 0 && (await end.isDisabled())) break;
    const s = await shown(page);
    if (s.phase === 'over') break;
    for (const id of ['open', 'rummage', 'pass', 'roll', 'end']) {
      const b = page.getByTestId(id);
      if ((await b.count()) > 0 && (await b.isEnabled())) {
        await b.click();
        break;
      }
    }
  }
  // Seed 11 with three computer players reaches a give-away step; if that ever changes, the test must say so.
  await expect(page.getByTestId('end'), 'no give-away step in this game').toBeDisabled();
  const hand = page.locator('[data-testid="hand"] .cq-tile');
  const before = await hand.count();
  const info = page.locator('[data-testid="hand"] .cq-info').first();
  await info.click();
  await expect(page.getByTestId('detail')).toBeVisible();
  await page.getByTestId('detail-close').click();
  await expect(page.getByTestId('detail')).toHaveCount(0);
  await expect(info).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('detail')).toBeVisible();
  await expect(hand).toHaveCount(before);
  await expect(page.getByTestId('end')).toBeDisabled();
});
