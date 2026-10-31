import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';

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

/** Waits until the autosave is stable, then reopens the game page and continues the saved game. */
async function reopen(page: Page) {
  let previous = '';
  await expect
    .poll(async () => {
      const current = JSON.stringify(((await readSave(page, GAME)) as { state?: unknown } | undefined)?.state ?? null);
      const stable = current !== 'null' && current === previous;
      previous = current;
      return stable;
    }, { intervals: [150] })
    .toBe(true);
  await page.goto(`/games/${GAME}`);
  await page.getByTestId('continue').click();
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
    for (const id of ['reveal-continue', 'open', 'rummage', 'pass', 'accept', 'roll', 'end']) {
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

test('card-quest: worlds are chosen on the start screen and mixed; a reload keeps them', async ({ page }) => {
  await startGame(page, GAME, { settings: { worlds: 'pick', 'world-kz': false, 'world-sl': true, 'world-of': true, opponents: 2 } });
  await expect(page.getByTestId('players')).toBeVisible();
  const worldsOf = async () => ((await readSave(page, GAME)) as { state?: { settings?: { worlds?: string[] } } } | undefined)?.state?.settings?.worlds;
  await expect.poll(worldsOf).toEqual(['sl', 'of']);
  // The seed is random: a computer player's curse may be shown first (the hand waits behind it), so continue it.
  const hand = page.locator('[data-testid="hand"] .cq-tile');
  await expect
    .poll(async () => {
      const next = page.getByTestId('reveal-continue');
      if (await next.isVisible()) await next.click();
      return hand.count();
    })
    .toBeGreaterThan(0);
  // Only cards of the chosen worlds are on the table, and their pictures arrive with the lazily loaded world chunks.
  const cards = await page.getByTestId('card-quest').locator('[data-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-card') ?? ''));
  for (const card of cards) expect(card).toMatch(/^(sl|of)\./);
  await expect(hand.first().locator('svg.cq-il')).toBeVisible();
  await reopen(page);
  expect(await worldsOf()).toEqual(['sl', 'of']);
});

test('card-quest: the worlds are random by default; their toggles appear only for "Choose"', async ({ page }) => {
  await page.goto(`/games/${GAME}`);
  await expect(page.getByTestId('setting-worlds')).toBeVisible();
  await expect(page.getByTestId('setting-world-kz')).toBeHidden();
  await page.getByTestId('setting-worlds').locator('input[value="pick"]').check();
  await expect(page.getByTestId('setting-world-kz')).toBeVisible();
  await page.getByTestId('setting-worlds').locator('input[value="random"]').check();
  await page.getByTestId('start-game').click();
  await expect(page.getByTestId('players')).toBeVisible();
  await expect
    .poll(async () => ((await readSave(page, GAME)) as { state?: { settings?: { randomWorlds?: boolean; worlds?: string[] } } } | undefined)?.state?.settings)
    .toMatchObject({ randomWorlds: true });
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
    for (const id of ['reveal-continue', 'open', 'rummage', 'pass', 'accept', 'roll', 'end']) {
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
  // Cancel returns to the normal mode (equip and sell are possible again); End turn asks again.
  await page.getByTestId('detail-close').click();
  await page.getByTestId('give-cancel').click();
  await expect(page.getByTestId('end')).toBeEnabled();
  await page.getByTestId('end').click();
  await expect(page.getByTestId('end')).toBeDisabled();
});

test('card-quest: in an own fight the person can ask another player for help', async ({ page }) => {
  await start(page);
  await playUntil(page, (st) => st.phase === 'fight' && st.active === 0);
  const ask = page.getByTestId('help-ask');
  await expect(ask, 'no help form in this fight').toBeVisible();
  await page.getByTestId('help-terms').selectOption({ index: 0 });
  await ask.click();
  await page.getByTestId('log').locator('summary').click();
  await expect(page.getByTestId('log')).toContainText(/You ask .* for help/);
  await expect(page.getByTestId('help-ask').or(page.getByTestId('pass')).or(page.getByTestId('roll')).first()).toBeVisible();
});

test('card-quest: coach tips switch with the keyboard, keep the focus and stay off after a reload', async ({ page }) => {
  await start(page);
  const box = page.getByTestId('coach');
  await expect(box).toBeChecked();
  await box.focus();
  await page.keyboard.press('Space');
  await expect(box).not.toBeChecked();
  await expect(box).toBeFocused();
  await expect(page.getByTestId('hint')).toHaveCount(0);
  await expect.poll(async () => ((await readSave(page, GAME)) as { state?: { settings?: { coach?: boolean } } } | undefined)?.state?.settings?.coach).toBe(false);
  await page.reload();
  await expect(page.getByTestId('coach')).not.toBeChecked();
});

test('card-quest: a trap shown around the corner survives a reload and stays gone after Continue', async ({ page }) => {
  let found = false;
  for (let seed = 1; seed <= 25 && !found; seed++) {
    await page.goto(`/games/${GAME}?seed=${seed}`);
    await expect(page.getByTestId('players')).toBeVisible();
    for (let i = 0; i < 40; i++) {
      if ((await page.getByTestId('reveal').count()) > 0) {
        found = true;
        break;
      }
      const end = page.getByTestId('end');
      if ((await end.count()) > 0 && (await end.isDisabled())) {
        const tiles = page.locator('[data-testid="hand"] .cq-tile[aria-pressed="false"]');
        while (await end.isDisabled()) await tiles.first().click();
      }
      let clicked = false;
      for (const id of ['open', 'rummage', 'pass', 'accept', 'roll', 'end']) {
        const b = page.getByTestId(id);
        if ((await b.count()) > 0 && (await b.isEnabled())) {
          await b.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) break;
    }
  }
  expect(found, 'no trap within the first seeds').toBe(true);
  const reveal = page.getByTestId('reveal');
  const title = (await reveal.locator('h3').textContent()) ?? '';
  expect(title.length).toBeGreaterThan(3);
  await expect(reveal.locator('svg.cq-il, .cq-rules li').first()).toBeVisible();
  // Reopen the saved game (a reload of the ?seed= link would start a new one): the same reveal is shown again.
  await reopen(page);
  await expect(page.getByTestId('reveal').locator('h3')).toHaveText(title);
  // Acknowledge every waiting reveal (it is saved), then reload: none comes back.
  while ((await page.getByTestId('reveal-continue').count()) > 0) await page.getByTestId('reveal-continue').click();
  await expect.poll(async () => ((await readSave(page, GAME)) as { state?: { revealed?: number } } | undefined)?.state?.revealed).toBeGreaterThan(0);
  await reopen(page);
  await expect(page.getByTestId('reveal')).toHaveCount(0);
});
