import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { decodeAtlas } from '../../packages/games/atlas-explorer/src/atlas';
import { ATLAS_DATA } from '../../packages/games/atlas-explorer/src/data/atlas.gen';
import { content as en } from '../../packages/games/atlas-explorer/src/content/en';
import { content as uk } from '../../packages/games/atlas-explorer/src/content/uk';
import { project } from '../../packages/games/atlas-explorer/src/geo';
import { createRound } from '../../packages/games/atlas-explorer/src/rules';
import type { AtlasState, FindItem, MysteryItem, RouteItem } from '../../packages/games/atlas-explorer/src/state';

const ID = 'atlas-explorer';
const atlas = decodeAtlas(ATLAS_DATA);

const saved = async (page: Page) => ((await readSave(page, ID)) as { state: AtlasState } | undefined)?.state;
const current = async <T>(page: Page): Promise<T> => {
  const s = (await saved(page))!;
  return s.items[s.index] as T;
};
/** Waits until the save reflects `pred` (the host saves after each change). */
const savedWhere = (page: Page, pred: (s: AtlasState) => boolean) => expect.poll(async () => pred((await saved(page))!)).toBe(true);

/** The point a player would tap for a find target: a city or point itself, else the label point of the area. */
function targetPoint(item: FindItem): [number, number] {
  const t = item.target;
  if (t.t === 'point') return [t.at[0] / 100, t.at[1] / 100];
  if (t.t === 'city') {
    const c = atlas.city(t.id)!;
    return [c.lon, c.lat];
  }
  const s = t.t === 'country' ? atlas.country(t.id)! : atlas.feature(t.id)!;
  return [s.label[0], s.label[1]];
}

/** Client coordinates of a longitude/latitude on the map (Equal Earth → SVG user units → screen, via getScreenCTM). */
async function clientPoint(page: Page, lon: number, lat: number): Promise<{ x: number; y: number }> {
  // The map's SVG user units: Equal Earth × 1000, y pointing down (map-view.ts `toSvg`).
  const [px, py] = project(lon, lat);
  const [x, y] = [px * 1000, -py * 1000];
  return page.getByTestId('ae-map').locator('svg').first().evaluate(
    (el, p) => {
      const svg = el as SVGSVGElement;
      const pt = svg.createSVGPoint();
      pt.x = p.x;
      pt.y = p.y;
      const r = pt.matrixTransform(svg.getScreenCTM()!);
      return { x: r.x, y: r.y };
    },
    { x, y }
  );
}

/**
 * Whether two countries' home territories touch (within 2°) and their border is more than a small exclave's: borders
 * via overseas parts or only via an exclave across the sea (Spain–Morocco via Ceuta and Melilla) are no overland steps.
 */
function homesTouch(a: string, b: string): boolean {
  const [p, q] = [atlas.country(a)!.home, atlas.country(b)!.home];
  if (atlas.country(a)!.nbExclave.includes(b)) return false;
  return p[0] - q[2] <= 2 && q[0] - p[2] <= 2 && p[1] - q[3] <= 2 && q[1] - p[3] <= 2;
}

/** Breadth-first shortest route over the overland border graph of the atlas (independent of the game's route module). */
function shortest(from: string, to: string): string[] {
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    if (id === to) break;
    for (const n of atlas.country(id)?.nb ?? [])
      if (!prev.has(n) && homesTouch(id, n)) {
        prev.set(n, id);
        queue.push(n);
      }
  }
  const path: string[] = [];
  for (let at: string | null | undefined = to; at; at = prev.get(at)) path.unshift(at);
  return path;
}

test('atlas-explorer: tapping the target on the map is "On target"; the review explains', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'find', region: 'world' } });
  await expect(page.getByTestId('ae-root')).toHaveAttribute('data-phase', 'find-question');
  const item = await current<FindItem>(page);
  const [lon, lat] = targetPoint(item);
  await page.getByTestId('ae-map').scrollIntoViewIfNeeded();
  // Under load the page can still settle (layout, scroll) between measuring and clicking: measure again
  // and click again until the marker is placed and saved.
  let p = await clientPoint(page, lon, lat);
  await expect(async () => {
    p = await clientPoint(page, lon, lat);
    await page.mouse.click(p.x, p.y);
    await expect.poll(async () => ((await saved(page))!.items[(await saved(page))!.index] as FindItem).draft !== null, { timeout: 3000 }).toBe(true);
  }).toPass({ timeout: 20_000 });
  await page.getByTestId('ae-check').click();
  await expect(page.getByTestId('ae-root')).toHaveAttribute('data-phase', 'find-review');
  const done = await current<FindItem>(page);
  expect(done.band).not.toBeNull();
  // A river's label point can lie a little off the line; everything else is hit exactly — up to the
  // click's pixel rounding, which can land a tiny country's label point just outside its border.
  const east = await clientPoint(page, lon + 1, lat);
  const kmPerPixel = (111.32 * Math.cos((lat * Math.PI) / 180)) / Math.hypot(east.x - p.x, east.y - p.y);
  const pixelMiss = done.band === 1 && done.km! <= 2 * kmPerPixel;
  expect(done.band!).toBeLessThanOrEqual(item.target.t === 'feature' || pixelMiss ? 1 : 0);
  await expect(page.getByTestId('ae-verdict')).toContainText(done.band === 0 ? 'On target' : 'Close');
  await expect(page.locator('#ae-review-heading')).toBeFocused();
});

test('atlas-explorer: keyboard only — cursor, Enter, Tab to Check', async ({ page }) => {
  await startGame(page, ID, { settings: { mode: 'find' } });
  const map = page.getByTestId('ae-map');
  await map.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByTestId('ae-map-live')).toContainText('°');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('ae-marker-status')).toContainText('Your marker:');
  for (let i = 0; i < 12; i++) {
    if (await page.getByTestId('ae-check').evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(page.getByTestId('ae-check')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('ae-root')).toHaveAttribute('data-phase', 'find-review');
  await expect(page.getByTestId('ae-announcer')).not.toBeEmpty();
});

test('atlas-explorer: a mystery country with two clues and one wrong guess survives a reload', async ({ page }) => {
  let wrong = '';
  await expectResumeAfterReload(
    page,
    ID,
    async (p) => {
      await p.getByTestId('ae-next-clue').click();
      await savedWhere(p, (s) => (s.items[s.index] as MysteryItem).shown === 2);
      const m = await current<MysteryItem>(p);
      wrong = m.target === 'FR' ? 'DE' : 'FR';
      await p.getByTestId('ae-search').fill(wrong === 'FR' ? 'Fran' : 'Germ');
      await p.getByTestId(`ae-listopt-${wrong}`).click();
      await p.getByTestId('ae-guess').click();
      await savedWhere(p, (s) => (s.items[s.index] as MysteryItem).guesses.length === 1);
    },
    { settings: { mode: 'mystery' } }
  );
  const m = await current<MysteryItem>(page);
  expect(m.shown).toBe(2);
  expect(m.guesses).toEqual([wrong]);
  await expect(page.getByTestId('ae-root')).toHaveAttribute('data-phase', 'mystery-question');
  await expect(page.getByTestId('ae-guesses')).toContainText(wrong === 'FR' ? 'Not France.' : 'Not Germany.');
  await expect(page.getByTestId('ae-clues').locator('[data-testid^="ae-clue-"]')).toHaveCount(2);
});

test('atlas-explorer: compare — choose, check, explanation', async ({ page }) => {
  await startGame(page, ID, { settings: { mode: 'compare' } });
  await page.getByTestId('ae-opt-0').check();
  await page.getByTestId('ae-check').click();
  await expect(page.getByTestId('ae-root')).toHaveAttribute('data-phase', 'compare-review');
  await expect(page.getByTestId('ae-verdict')).toContainText(/matches the map|The map says/);
  await expect(page.getByTestId('ae-explain').first()).not.toBeEmpty();
});

test('atlas-explorer: overland route along a shortest path is "One of the shortest routes"', async ({ page }) => {
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'route' } });
  const r = await current<RouteItem>(page);
  const path = shortest(r.from, r.to);
  expect(path.length - 1).toBe(r.best);
  for (const id of path.slice(1)) await page.getByTestId(`ae-nb-${id}`).click();
  await expect(page.getByTestId('ae-root')).toHaveAttribute('data-phase', 'route-review');
  await expect(page.getByTestId('ae-card')).toContainText('One of the shortest routes ✓');
});

test('atlas-explorer: a mixed round ends in a summary and the finished screen', async ({ page }) => {
  await startGame(page, ID, { settings: { mode: 'mixed' } });
  for (let i = 0; i < 6; i++) {
    await page.getByTestId('ae-skip').click();
    await page.getByTestId(i === 5 ? 'ae-summary-btn' : 'ae-next').click();
  }
  await expect(page.getByTestId('ae-root')).toHaveAttribute('data-phase', 'summary');
  await expect(page.getByTestId('ae-summary-list').locator('li')).toHaveCount(6);
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('atlas-explorer: at 360 px — no sideways scrolling, 44 px targets, working zoom buttons', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { settings: { mode: 'mixed' } });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  for (const id of ['ae-zoom-in', 'ae-zoom-out', 'ae-fit', 'ae-skip']) {
    const box = (await page.getByTestId(id).boundingBox())!;
    expect(box.height, id).toBeGreaterThanOrEqual(44);
    expect(box.width, id).toBeGreaterThanOrEqual(44);
  }
  const svg = page.getByTestId('ae-map').locator('svg').first();
  const before = await svg.getAttribute('viewBox');
  await page.getByTestId('ae-zoom-in').click();
  await expect.poll(() => svg.getAttribute('viewBox')).not.toBe(before);
});

test('atlas-explorer: Arabic is right-to-left, the map is not mirrored', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('worthwhile-play:ui-locale', 'ar'));
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, ID, { settings: { mode: 'find' } });
  await expect(page.getByTestId('ae-root')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('ae-map')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByTestId('ae-check')).toHaveText('تحقّق');
  // West is on the left: a point at 100° W lies left of a point at 100° E.
  const w = await clientPoint(page, -100, 0);
  const e = await clientPoint(page, 100, 0);
  expect(w.x).toBeLessThan(e.x);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

/** Switches the UI language through the header menu (re-renders the current page). */
async function switchLanguage(page: Page, locale: string): Promise<void> {
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption(locale);
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

test('atlas-explorer: the texts and names of a language never loaded before are available offline (precached)', async ({ page, context }) => {
  // A seed whose first item asks for a river, lake, range… (named by the per-locale content, not by CLDR or a deck).
  const seed = Array.from({ length: 500 }, (_, i) => i + 1).find((n) => (createRound(n, 'easy', 'find', 'world', atlas).items[0] as FindItem).target.t === 'feature')!;
  const target = (createRound(seed, 'easy', 'find', 'world', atlas).items[0] as FindItem).target as { t: 'feature'; id: string };
  const kind = `kindOf.${atlas.feature(target.id)!.kind}` as keyof typeof en.text;
  const title = (c: typeof en) => c.text['find.title'].replace('{kind}', c.text[kind]).replace('{name}', c.names[target.id]!);
  expect(uk.names[target.id]).not.toBe(en.names[target.id]);

  await page.goto(`/games/${ID}`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  // Start once to remember the settings, then the seed's round by its link; reopen the page without the link.
  await startGame(page, ID, { difficulty: 'easy', settings: { mode: 'find', region: 'world' } });
  await page.goto(`/games/${ID}?seed=${seed}`);
  await expect(page.locator('#ae-item-heading')).toHaveText(title(en));
  await page.goto(`/games/${ID}`);
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('ae-skip')).toHaveText(en.text['action.skip']);

  await context.setOffline(true);
  // The game page re-renders in Ukrainian; its texts and names come from a chunk that was never requested before.
  await switchLanguage(page, 'uk');
  await page.getByTestId('continue').click();
  await expect(page.locator('#ae-item-heading')).toHaveText(title(uk));
  await expect(page.getByTestId('ae-skip')).toHaveText(uk.text['action.skip']);
  await page.getByTestId('ae-skip').click();
  await expect(page.getByTestId('ae-next')).toHaveText(uk.text['action.next']);
  await context.setOffline(false);
});
