import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import type { KeyboardState, QuizState } from '../../packages/games/harmony/src/rules';
import { answerIndex, buildTargetPcs, type BuildSpec, type ChoiceSpec } from '../../packages/games/harmony/src/spec';
import { midiOf } from '../../packages/games/harmony/src/spelling';

const ID = 'harmony';
const root = (page: Page) => page.getByTestId('game-root');

async function savedState<S = QuizState>(page: Page): Promise<S> {
  await expect.poll(async () => Boolean(((await readSave(page, ID)) as { state?: unknown } | undefined)?.state)).toBe(true);
  return ((await readSave(page, ID)) as { state: S }).state;
}

/** Counts AudioContext constructions and resume() calls in the page (design § 9.5); keeps the real constructor. */
const countAudio = () => {
  const w = window as unknown as { AudioContext: new (o?: unknown) => AudioContext; __audio: { made: number; resumed: number } };
  const Real = w.AudioContext;
  w.__audio = { made: 0, resumed: 0 };
  w.AudioContext = class extends Real {
    constructor(options?: AudioContextOptions) {
      super(options);
      w.__audio.made++;
    }
    override resume() {
      w.__audio.resumed++;
      return super.resume();
    }
  } as unknown as typeof w.AudioContext;
};
const audioCount = (page: Page) => page.evaluate(() => (window as unknown as { __audio: { made: number; resumed: number } }).__audio);

test('harmony: a whole round by eye, without sound, ends with a calm summary', async ({ page }) => {
  await page.addInitScript(countAudio);
  await startGame(page, ID, { difficulty: 'easy', settings: { topic: 'intervals', senses: 'eye' } });
  const r = root(page);
  for (let i = 0; i < 10; i++) {
    await expect(r.getByTestId('hm-progress')).toContainText(`${i + 1}`);
    if (i % 3 === 2) {
      await r.getByTestId('hm-skip').click();
    } else {
      const s = await savedState(page);
      const right = answerIndex(s.items[i]!.spec as ChoiceSpec);
      // By eye the staff (and on easy the keyboard marks) is the question.
      await expect(r.getByTestId('hm-staff')).toBeVisible();
      await r.getByTestId(`hm-opt-${right}`).check();
      await r.getByTestId('hm-check').click();
      await expect(r.getByTestId('hm-verdict')).toHaveAttribute('data-matched', 'true');
      await expect(r.getByTestId('hm-verdict')).toContainText('That’s it');
    }
    await expect(r.locator('#hm-review-heading')).toBeFocused();
    await r.getByTestId(i < 9 ? 'hm-next' : 'hm-summary-btn').click();
  }
  await expect(r.getByTestId('hm-summary')).toBeVisible();
  await expect(r.getByTestId('hm-summary-matched')).toHaveText('Matched: 7 of 7');
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect(page.getByTestId('another-round')).toBeVisible();
  expect((await savedState(page)).reported).toBe(true);
  // Nothing played, so no audio context was ever made.
  expect((await audioCount(page)).made).toBe(0);
});

test('harmony: a chosen answer by ear survives a reload, unchecked and without the picture', async ({ page }) => {
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      await root(p).getByTestId('hm-opt-1').check();
      await expect.poll(async () => (await savedState(p)).items[0]!.draft).toEqual({ choice: 1 });
    },
    { difficulty: 'medium', settings: { topic: 'chords', senses: 'ear' } }
  );
  const s = await savedState(page);
  expect(s.items[0]!.answer).toBeNull();
  await expect(root(page).getByTestId('hm-opt-1')).toBeChecked();
  await expect(root(page).getByTestId('hm-staff')).toHaveCount(0);
  await expect(root(page).getByTestId('hm-show-picture')).toBeVisible();
});

test('harmony: sound only after a gesture — nothing on load, render or reload; Play creates and resumes one context', async ({ page }) => {
  await page.addInitScript(countAudio);
  await startGame(page, ID, { difficulty: 'easy', settings: { topic: 'melody', senses: 'ear' } });
  await expect(root(page).getByTestId('hm-play')).toBeVisible();
  expect((await audioCount(page)).made).toBe(0);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('hm-play')).toBeVisible();
  expect((await audioCount(page)).made).toBe(0);
  await root(page).getByTestId('hm-play').click();
  await expect.poll(async () => (await audioCount(page)).made).toBe(1);
  expect((await audioCount(page)).resumed).toBeGreaterThanOrEqual(1);
  await root(page).getByTestId('hm-slower').click();
  expect((await audioCount(page)).made).toBe(1);
});

test('harmony: mute persists across a reload and then nothing plays', async ({ page }) => {
  await page.addInitScript(countAudio);
  await startGame(page, ID, { difficulty: 'easy', settings: { topic: 'intervals', senses: 'ear' } });
  await root(page).getByTestId('hm-mute').click();
  await expect(root(page).getByTestId('hm-mute')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('hm-mute')).toHaveAttribute('aria-pressed', 'false');
  await expect(root(page).getByTestId('hm-play')).toHaveCount(0);
  // Check: while muted the review offers no listen buttons, and the keys stay silent.
  await root(page).getByTestId('hm-opt-0').check();
  await root(page).getByTestId('hm-check').click();
  await expect(root(page).getByTestId('hm-verdict')).toBeVisible();
  await expect(root(page).getByTestId('hm-answer')).toHaveCount(0);
  await root(page).locator('.hm-white').first().click();
  expect((await audioCount(page)).made).toBe(0);
});

test('harmony: without Web Audio, by-ear questions show their picture and stay answerable', async ({ page }) => {
  await page.addInitScript(() => {
    delete (window as unknown as Record<string, unknown>).AudioContext;
    delete (window as unknown as Record<string, unknown>).webkitAudioContext;
  });
  await startGame(page, ID, { difficulty: 'medium', settings: { topic: 'stability', senses: 'ear' } });
  const r = root(page);
  await expect(r.getByTestId('hm-no-sound')).toBeVisible();
  await expect(r.getByTestId('hm-picture')).toBeVisible();
  await expect(r.getByTestId('hm-play')).toHaveCount(0);
  await expect(r.getByTestId('hm-sound-status')).toBeVisible();
  const s = await savedState(page);
  expect(s.items[0]!.peeked).toBe('no-sound');
  await r.getByTestId(`hm-opt-${answerIndex(s.items[0]!.spec as ChoiceSpec)}`).check();
  await r.getByTestId('hm-check').click();
  await expect(r.getByTestId('hm-verdict')).toHaveAttribute('data-matched', 'true');
});

test('harmony: a chord built with the keyboard only (Tab, arrows, Space, Enter)', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'medium', settings: { topic: 'build' } });
  const r = root(page);
  const s = await savedState(page);
  const spec = s.items[0]!.spec as BuildSpec;
  const rootMidi = midiOf(spec.root);
  const pcs = buildTargetPcs(spec).filter((pc) => pc !== rootMidi % 12);
  // The nearest key above the root for each missing pitch class.
  const targets = pcs.map((pc) => rootMidi + ((pc - (rootMidi % 12) + 12) % 12)).sort((a, b) => a - b);
  // Tab into the keyboard: the root key holds the tab stop.
  await r.getByTestId('hm-skip').focus();
  let guard = 0;
  while (!(await page.evaluate(() => Boolean(document.activeElement?.closest('.hm-piano')))) && guard++ < 30) await page.keyboard.press('Tab');
  let at = Number(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.midi));
  for (const m of targets) {
    while (at < m) {
      await page.keyboard.press('ArrowRight');
      at++;
    }
    while (at > m) {
      await page.keyboard.press('ArrowLeft');
      at--;
    }
    await expect(r.getByTestId(`hm-key-${m}`)).toBeFocused();
    await page.keyboard.press('Space');
  }
  await expect.poll(async () => (await savedState(page)).items[0]!.draft).toEqual({ keys: targets });
  await r.getByTestId('hm-check').focus();
  await page.keyboard.press('Enter');
  await expect(r.getByTestId('hm-verdict')).toHaveAttribute('data-matched', 'true');
  // Marks are words in the keys' names (the visible octave on phones may not hold every key).
  await expect(r.locator('.hm-key[aria-label*="belongs"]').first()).toBeVisible();
});

test('harmony: the free keyboard names a held C major chord, shows its wave and switches to pure tuning', async ({ page }) => {
  await startGame(page, ID, { settings: { topic: 'keyboard' } });
  const r = root(page);
  for (const m of [60, 64, 67]) await r.getByTestId(`hm-key-${m}`).click();
  await expect(r.getByTestId('hm-free-name')).toHaveText('C major chord, root position');
  await expect(r.getByTestId('hm-wave-caption')).toContainText('4 waves');
  await r.getByTestId('hm-tuning-just').check();
  await expect.poll(async () => (await savedState<KeyboardState>(page)).tuning).toBe('just');
  expect((await savedState<KeyboardState>(page)).held).toEqual([60, 64, 67]);
  await r.getByTestId('hm-play-held').click();
});

test('harmony: fits 360 px — no horizontal scroll, 44 px targets, keys of one octave', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { difficulty: 'easy', settings: { topic: 'intervals', senses: 'eye' } });
  const r = root(page);
  for (const id of ['hm-check', 'hm-skip', 'hm-play', 'hm-mute']) {
    const box = (await r.getByTestId(id).boundingBox())!;
    expect(box.height, id).toBeGreaterThanOrEqual(44);
    expect(box.width, id).toBeGreaterThanOrEqual(44);
  }
  const option = (await r.locator('.hm-option').first().boundingBox())!;
  expect(option.height).toBeGreaterThanOrEqual(44);
  const whites = r.locator('.hm-white');
  await expect(whites).toHaveCount(7);
  for (let i = 0; i < 7; i++) expect((await whites.nth(i).boundingBox())!.width).toBeGreaterThanOrEqual(44);
  const black = (await r.locator('.hm-black').first().boundingBox())!;
  expect(black.height).toBeGreaterThanOrEqual(88);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  // The sticky action bar never covers the focused option.
  await r.getByTestId('hm-opt-3').focus();
  const focused = (await r.getByTestId('hm-opt-3').boundingBox())!;
  const bar = (await r.locator('.hm-card > .hm-actions').boundingBox())!;
  expect(focused.y + focused.height <= bar.y || focused.y >= bar.y + bar.height).toBe(true);
});

test('harmony: Arabic mirrors the panels but not the keyboard or the staff', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await startGame(page, ID, { difficulty: 'easy', settings: { topic: 'chords', senses: 'eye' } });
  const r = root(page);
  await expect(r.locator('.wp-harmony')).toHaveAttribute('dir', 'rtl');
  await expect(r.getByTestId('hm-keys')).toHaveAttribute('dir', 'ltr');
  await expect(r.getByTestId('hm-staff')).toHaveAttribute('dir', 'ltr');
  // The visible octave starts at the chord's lowest note, so it depends on the task: compare the
  // lowest visible white key with the next white key (C with D, or the first two whites shown).
  const keys = r.getByTestId('hm-keys').locator('[data-testid^="hm-key-"]');
  const midis = (await keys.evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-testid')!.slice(7))))).sort((a, b) => a - b);
  const whites = midis.filter((m) => [0, 2, 4, 5, 7, 9, 11].includes(m % 12));
  const c = (await r.getByTestId(`hm-key-${whites[0]}`).boundingBox())!;
  const d = (await r.getByTestId(`hm-key-${whites[1]}`).boundingBox())!;
  expect(c.x).toBeLessThan(d.x);
  // The question card starts at the inline start (right) edge.
  const card = (await r.locator('.hm-card').boundingBox())!;
  const layout = (await r.locator('.hm-layout').boundingBox())!;
  expect(Math.abs(card.x + card.width - (layout.x + layout.width))).toBeLessThanOrEqual(2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('harmony: German note names use H for B and B for B flat', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await startGame(page, ID, { settings: { topic: 'keyboard' } });
  const r = root(page);
  await expect(r.getByTestId('hm-key-71')).toHaveAttribute('aria-label', 'H 4');
  await expect(r.getByTestId('hm-key-71')).toContainText('H');
  await expect(r.getByTestId('hm-key-70')).toHaveAttribute('aria-label', 'B 4');
  await expect(r.getByTestId('hm-overlay-tonic').locator('option[value="10"]')).toHaveText('B');
  await expect(r.getByTestId('hm-overlay-tonic').locator('option[value="11"]')).toHaveText('H');
});

test('harmony: plays offline once cached (no network request on start or Play)', async ({ page, context }) => {
  await page.goto('/games/harmony');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  const offline = await context.newPage();
  const requests: string[] = [];
  offline.on('requestfailed', (req) => requests.push(req.url()));
  await startGame(offline, ID, { difficulty: 'easy', settings: { topic: 'rhythm', senses: 'ear' } });
  await root(offline).getByTestId('hm-play').click();
  await root(offline).getByTestId('hm-opt-0').check();
  await root(offline).getByTestId('hm-check').click();
  await expect(root(offline).getByTestId('hm-verdict')).toBeVisible();
  expect(requests).toEqual([]);
  await context.setOffline(false);
});
