import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const cells = (page: Page) =>
  root(page)
    .locator('[data-testid^="cell-"]')
    .evaluateAll((list) =>
      list.map((c) => [c.getAttribute('data-testid'), c.getAttribute('data-element'), c.getAttribute('data-lit'), c.getAttribute('data-orient'), c.getAttribute('data-placed')].join(':'))
    );

/** Expects every square of the board to be at least 44 px and the page not to scroll sideways at 360 px. */
async function expectFitsPhone(page: Page, last: string) {
  for (const id of ['cell-0-0', last]) {
    const box = await root(page).getByTestId(id).boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
}

test('laser-circuit: offers four difficulties, from easy (the old medium) to the new expert', async ({ page }) => {
  await page.goto('/games/laser-circuit');
  const options = page.getByTestId('difficulty').locator('option');
  await expect(options).toHaveText([/^Easy \(6×6, 2–3 pieces\)$/, /^Medium \(7×7, 3–6 pieces\)$/, /^Hard \(7×9, 7–8 pieces\)$/, /^Expert \(7×9, \d–\d pieces, filters and polarisers\)$/]);
});

test('laser-circuit: placed and turned pieces survive a reload', async ({ page }) => {
  let before: string[] = [];
  let moves: string | null = null;
  await expectResumeAfterReload(page, 'laser-circuit', async (p) => {
    // The level depends on the random seed; every level has at least one piece and empty squares.
    await root(p).locator('[data-testid^="inv-"]').first().click();
    const empty = root(p).locator('[data-testid^="cell-"][data-element="empty"]').first();
    const id = (await empty.getAttribute('data-testid')) ?? '';
    await empty.click();
    await expect(root(p).getByTestId(id)).toHaveAttribute('data-placed', 'true');
    await root(p).getByTestId(id).click();
    await expect(root(p).getByTestId('moves')).not.toHaveAttribute('data-value', '0');
    moves = await root(p).getByTestId('moves').getAttribute('data-value');
    before = await cells(p);
  });

  expect(await cells(page)).toEqual(before);
  await expect(root(page).getByTestId('moves')).toHaveAttribute('data-value', moves ?? '');
  await expect(root(page).locator('[data-testid^="cell-"][data-placed="true"]')).toHaveCount(1);
});

test('laser-circuit: a 7×7 medium level fits a 360 px phone with 44 px squares and can be solved by tapping', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  // Medium level 8: four splitters; the unique solution is S\ at (2,3) and (3,4), S/ at (4,1) and (4,4).
  await page.goto('/games/laser-circuit?seed=7&difficulty=medium');
  await expect(root(page).getByTestId('level-status')).toHaveText('Level 8 of 12');
  await expectFitsPhone(page, 'cell-6-6');
  await expect(root(page).getByTestId('inv-splitter')).toHaveAttribute('data-count', '4');

  const tap = (r: number, c: number) => root(page).getByTestId(`cell-${r}-${c}`).click();
  await tap(1, 2);
  await tap(1, 2); // turn to \
  await tap(2, 3);
  await tap(2, 3);
  await tap(3, 0);
  await tap(3, 3);
  await expect(root(page).getByTestId('inv-splitter')).toHaveAttribute('data-count', '0');
  await expect(root(page).getByTestId('cell-2-5')).toHaveAttribute('data-lit', 'W');
  await expect(root(page).getByTestId('cell-6-0')).toHaveAttribute('data-lit', 'W');
  await expect(root(page).getByTestId('status')).toHaveAttribute('data-state', 'solved');
  await expect(page.getByTestId('finished')).toBeVisible();
});

test('laser-circuit: a hard level shows its optical diodes, named and explained in the legend, at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/games/laser-circuit?seed=0&difficulty=hard');
  await expect(root(page).getByTestId('level-status')).toHaveText('Level 1 of 8');
  await expectFitsPhone(page, 'cell-8-6');
  const legend = root(page).getByTestId('legend');
  await expect(legend).toBeVisible();
  await expect(legend.locator('[data-kind="gate"]')).toContainText('Optical diode');
  await expect(root(page).locator('[data-element="gate"]').first()).toHaveAttribute('aria-label', /optical diode/);
});

test('laser-circuit: an expert level with optical pieces resumes after a reload, polariser angle included', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  let before: string[] = [];
  let level: string | null = null;
  let polariser = '';
  await expectResumeAfterReload(page, 'laser-circuit', async (p) => {
    await p.getByTestId('difficulty').selectOption('expert');
    await p.getByTestId('new-game').click();
    await expect(root(p).locator('[data-testid^="cell-"]')).toHaveCount(63);
    await expectFitsPhone(p, 'cell-8-6');
    // Go to the first expert level with a polariser in its inventory.
    const select = root(p).getByTestId('level-select');
    const count = await select.locator('option').count();
    for (let i = 0; i < count && (await root(p).getByTestId('inv-polariser').count()) === 0; i++) {
      await select.selectOption(String(i));
      await root(p).getByTestId('level-play').click();
    }
    await expect(root(p).getByTestId('legend').locator('[data-kind="polariser"]')).toContainText('Malus');
    await expect(root(p).getByTestId('legend').locator('[data-kind="optics"]')).toBeVisible();
    // Place a polariser and turn it twice: 0° → 45° → 90°.
    await root(p).getByTestId('inv-polariser').click();
    const empty = root(p).locator('[data-testid^="cell-"][data-element="empty"]');
    polariser = (await empty.nth(0).getAttribute('data-testid')) ?? '';
    await root(p).getByTestId(polariser).click();
    await expect(root(p).getByTestId(polariser)).toHaveAttribute('data-element', 'polariser');
    await expect(root(p).getByTestId(polariser)).toContainText('0°');
    await root(p).getByTestId(polariser).click();
    await root(p).getByTestId(polariser).click();
    await expect(root(p).getByTestId(polariser)).toHaveAttribute('data-orient', '2');
    await expect(root(p).getByTestId(polariser)).toContainText('90°');
    // And one more piece of another kind.
    await root(p).locator('[data-testid^="inv-"]:not([data-kind="polariser"])').first().click();
    const second = (await empty.nth(3).getAttribute('data-testid')) ?? '';
    await root(p).getByTestId(second).click();
    await expect(root(p).locator('[data-placed="true"]')).toHaveCount(2);
    level = await root(p).getByTestId('level-status').textContent();
    before = await cells(p);
  });

  expect(level).toMatch(/ of \d+$/);
  await expect(root(page).getByTestId('level-status')).toHaveText(level ?? '');
  expect(await cells(page)).toEqual(before);
  await expect(root(page).getByTestId(polariser)).toHaveAttribute('aria-label', /your polariser, axis at 90°/);
  await expect(page.getByTestId('difficulty')).toHaveValue('expert');
});

test('laser-circuit: a save from before the difficulty shift (an old easy level) still continues', async ({ page }) => {
  await page.goto('/games/laser-circuit');
  await expect(page.getByTestId('new-game')).toBeVisible();
  // Old "easy" level 1 with a mirror / at row 4, column 2: solved. Written as state version 1.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const put = db.transaction('saves', 'readwrite').objectStore('saves').put({
            schemaVersion: 1,
            gameId: 'laser-circuit',
            stateVersion: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            seed: 0,
            difficulty: 'easy',
            state: { seed: 0, difficulty: 'easy', level: 0, pieces: [{ cell: 16, kind: 'mirror', orient: 0 }], moves: 1, undo: [{ pieces: [], moves: 0 }] }
          });
          put.onsuccess = () => {
            db.close();
            resolve();
          };
          put.onerror = () => reject(put.error);
        };
      })
  );
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('level-status')).toHaveText('Introductory level 1 of 8');
  await expect(root(page).getByTestId('cell-3-1')).toHaveAttribute('data-placed', 'true');
  await expect(root(page).getByTestId('cell-3-0')).toHaveAttribute('data-lit', 'R');
  await expect(root(page).getByTestId('status')).toHaveAttribute('data-state', 'solved');
});

test('laser-circuit: keyboard play places, turns and takes back a piece', async ({ page }) => {
  // Easy level 1: white light through a red filter; a mirror / at row 2, column 1 and a mirror \ at row 2, column 3 bring it to the target.
  await page.goto('/games/laser-circuit?seed=0&difficulty=easy');
  await expect(root(page).getByTestId('level-status')).toHaveText('Level 1 of 8');
  await root(page).getByTestId('cell-0-0').focus();
  await page.keyboard.press('ArrowDown');
  await expect(root(page).getByTestId('cell-1-0')).toBeFocused();
  await page.keyboard.press('p');
  await expect(root(page).getByTestId('cell-1-0')).toHaveAttribute('data-element', 'mirror');
  await expect(root(page).getByTestId('cell-1-1')).toHaveAttribute('data-lit', 'R');
  await page.keyboard.press('r');
  await expect(root(page).getByTestId('cell-1-0')).toHaveAttribute('data-orient', '1');
  await page.keyboard.press('Delete');
  await expect(root(page).getByTestId('cell-1-0')).toHaveAttribute('data-element', 'empty');
  await page.keyboard.press('p');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('p');
  await page.keyboard.press('r');
  await expect(root(page).getByTestId('cell-3-2')).toHaveAttribute('data-lit', 'R');
  await expect(root(page).getByTestId('status')).toHaveAttribute('data-state', 'solved');
  expect(((await readSave(page, 'laser-circuit')) as { stateVersion: number }).stateVersion).toBe(2);
});
