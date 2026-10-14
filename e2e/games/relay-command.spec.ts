import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedRelay {
  phase: string;
  draft: { unit: number; order: { type: string } }[];
  world: { turn: number; entities: { id: number; side: number; kind: string; x: number; y: number }[] };
  result: string | null;
  endless: boolean;
}

const saved = async (page: Page) => ((await readSave(page, 'relay-command')) as { state: SavedRelay } | undefined)?.state;
const firstRifle = (s: SavedRelay) => s.world.entities.find((e) => e.side === 0 && e.kind === 'rifles')!;

async function start(page: Page) {
  // No save: the game starts at once and its setup is the first screen (ADR 0015).
  await page.goto('/games/relay-command');
  await expect(page.getByTestId('rc-map')).toBeVisible();
  // The host saves the fresh game; positions are read from that save.
  await expect.poll(async () => (await saved(page))?.world.entities.length ?? 0).toBeGreaterThan(0);
}

test('relay-command: a planned but unlocked order survives a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'relay-command', async (p) => {
    await p.locator('[data-testid^="rc-unit-"]').nth(2).click();
    await p.getByTestId('rc-regroup').click();
    await expect(p.getByTestId('rc-slots')).toHaveText('Planning: 1/4');
  });
  const state = (await saved(page))!;
  expect(state.phase).toBe('plan');
  expect(state.draft).toHaveLength(1);
  expect(state.draft[0]!.order.type).toBe('regroup');
  await expect(page.getByTestId('rc-slots')).toHaveText('Planning: 1/4');
});

test('relay-command: fog of war — only reported enemies are shown; a ghost takes a move order', async ({ page }) => {
  await start(page);
  // At the start only the enemy structures (Command Post, Muster Yard) are known, from before the battle.
  const enemies = page.getByTestId('rc-enemy').locator('li');
  await expect(enemies).toHaveCount(2);
  await expect(enemies.first()).toContainText('Position known from before the battle');
  const state = (await saved(page))!;
  const rifle = firstRifle(state);
  const post = state.world.entities.find((e) => e.side === 1 && e.kind === 'command-post')!;
  await page.getByTestId(`rc-unit-${rifle.id}`).click();
  // Nothing is in sight, so nothing can be attacked yet.
  await expect(page.locator('[data-testid^="rc-attack-"]')).toHaveCount(0);
  const map = page.getByTestId('rc-map');
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  const cell = box.width / 12;
  await map.click({ position: { x: post.x * cell + cell / 2, y: post.y * cell + cell / 2 } });
  await expect.poll(async () => (await saved(page))?.draft[0]?.order).toEqual({ type: 'move', x: post.x, y: post.y });
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2');
});

test('relay-command: canvas clicks select a unit and plan a move; locking resolves the turn', async ({ page }) => {
  await start(page);
  const map = page.getByTestId('rc-map');
  const rifle = firstRifle((await saved(page))!);
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  const cell = box.width / 12;
  await map.click({ position: { x: rifle.x * cell + cell / 2, y: rifle.y * cell + cell / 2 } });
  await expect(page.getByTestId(`rc-unit-${rifle.id}`)).toHaveAttribute('aria-pressed', 'true');
  await map.click({ position: { x: (rifle.x + 1) * cell + cell / 2, y: (rifle.y - 3) * cell + cell / 2 } });
  await expect.poll(async () => (await saved(page))?.draft[0]?.order.type).toBe('move');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2');
  await expect.poll(async () => (await saved(page))?.world.turn).toBe(1);
  await expect(page.getByTestId('rc-summary')).toContainText('Damage dealt');
});

test('relay-command: keyboard-only orders, then playing to the natural end', async ({ page }) => {
  await start(page);
  const map = page.getByTestId('rc-map');
  // After "New game" the host focuses the map (data-autofocus); the cursor starts on the own Command Post.
  await expect(map).toBeFocused();
  // A 12-turn game guarantees a natural end below; the map is re-focused afterwards.
  await page.getByTestId('rc-turn-limit').selectOption('12');
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 1 of 12');
  await map.focus();
  const state = (await saved(page))!;
  const post = state.world.entities.find((e) => e.side === 0 && e.kind === 'command-post')!;
  const rifle = firstRifle(state);
  // Walk the cursor from the Command Post to the rifle squad, select it with Enter.
  for (let i = 0; i < Math.abs(rifle.x - post.x); i++) await page.keyboard.press(rifle.x > post.x ? 'ArrowRight' : 'ArrowLeft');
  for (let i = 0; i < Math.abs(rifle.y - post.y); i++) await page.keyboard.press(rifle.y > post.y ? 'ArrowDown' : 'ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId(`rc-unit-${rifle.id}`)).toHaveAttribute('aria-pressed', 'true');
  // One cell up and right (a free hill cell), then Enter: a move order for that cell.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await saved(page))?.draft).toEqual([{ side: 0, unit: rifle.id, order: { type: 'move', x: rifle.x + 1, y: rifle.y - 1 } }]);
  // H replaces it with "hold".
  await page.keyboard.press('h');
  await expect.poll(async () => (await saved(page))?.draft[0]?.order.type).toBe('hold');

  // Lock every turn until the game ends (turn limit 12 guarantees a natural end).
  for (let turn = 0; turn < 12; turn++) {
    if (await page.getByTestId('rc-lock').isDisabled()) break;
    await page.getByTestId('rc-lock').click();
  }
  await expect(page.getByTestId('rc-status')).toHaveAttribute('data-phase', 'finished');
  await expect(page.getByTestId('rc-lock')).toBeDisabled();
  await expect.poll(async () => (await saved(page))?.result).not.toBeNull();
});

test('relay-command: setting up the Mast Truck spends an order and activates the relay', async ({ page }) => {
  await start(page);
  await expect(page.getByTestId('rc-slots')).toHaveText('Planning: 0/4');
  const truck = (await saved(page))!.world.entities.find((e) => e.side === 0 && e.kind === 'mast-truck')!;
  await page.getByTestId(`rc-unit-${truck.id}`).click();
  await page.getByTestId('rc-deploy').click();
  await expect(page.getByTestId('rc-slots')).toHaveText('Planning: 1/4');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId(`rc-unit-${truck.id}`)).toContainText('Relay active.');
  await expect.poll(async () => (await saved(page))?.world.entities.find((e) => e.id === truck.id) as unknown).toMatchObject({ deploy: 6 });
});

test('relay-command: a doctrine and a patrol survive a reload and are carried out', async ({ page }) => {
  await start(page);
  const rifle = firstRifle((await saved(page))!);
  await page.getByTestId(`rc-unit-${rifle.id}`).click();
  await page.getByTestId('rc-doctrine-retreat').selectOption('50');
  await page.getByTestId('rc-mode-patrol').click();
  const map = page.getByTestId('rc-map');
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  const cell = box.width / 12;
  await map.click({ position: { x: (rifle.x + 1) * cell + cell / 2, y: (rifle.y - 3) * cell + cell / 2 } });
  const expected = {
    side: 0,
    unit: rifle.id,
    order: { type: 'patrol', x: rifle.x + 1, y: rifle.y - 3, rx: rifle.x, ry: rifle.y },
    doctrine: { retreatBelow: 50, priority: 'weakest', seekCover: false, holdFire: false, lostContact: 'regroup' }
  };
  await expect.poll(async () => (await saved(page))?.draft).toEqual([expected]);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-slots')).toHaveText('Planning: 1/4');
  await page.getByTestId('rc-lock').click();
  await expect.poll(async () => (await saved(page))?.world.entities.find((e) => e.id === rifle.id) as unknown).toMatchObject({
    order: { type: 'patrol' },
    doctrine: expected.doctrine
  });
});

test('relay-command: giving up asks first', async ({ page }) => {
  await start(page);
  await page.getByTestId('rc-concede').click();
  await page.getByTestId('rc-concede-no').click();
  await expect(page.getByTestId('rc-status')).toHaveAttribute('data-phase', 'plan');
  await page.getByTestId('rc-concede').click();
  await page.getByTestId('rc-concede-yes').click();
  await expect(page.getByTestId('rc-status')).toHaveAttribute('data-phase', 'finished');
  await expect(page.getByTestId('rc-status')).toBeFocused();
  await expect.poll(async () => (await saved(page))?.result).toBe('lost');
});

test('relay-command: a Static Jammer is set up in one turn and stays set up across a reload', async ({ page }) => {
  await start(page);
  const jammer = (await saved(page))!.world.entities.find((e) => e.side === 0 && e.kind === 'jammer')!;
  await page.getByTestId(`rc-unit-${jammer.id}`).click();
  await expect(page.getByTestId('rc-deploy')).toHaveText('Set up jammer');
  await page.getByTestId('rc-deploy').click();
  await expect.poll(async () => (await saved(page))?.draft[0]?.order.type).toBe('deploy');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2');
  await expect.poll(async () => (await saved(page))?.world.turn).toBe(1);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId(`rc-unit-${jammer.id}`)).toContainText('Jammer active');
});

test('opening relay-command with no save shows the map setup directly, without a start panel (ADR 0015)', async ({ page }) => {
  await page.goto('/games/relay-command');
  await expect(page.getByTestId('rc-setup')).toBeVisible();
  await expect(page.getByTestId('rc-scenario')).toBeEnabled();
  await expect(page.getByTestId('rc-map')).toBeVisible();
  await expect(page.getByTestId('continue')).toHaveCount(0);
  // The map is chosen right away, before any turn; the game is saved and resumes on reload.
  await page.getByTestId('rc-scenario').selectOption('ridge-valley');
  await expect(page.getByTestId('rc-map')).toHaveAttribute('data-cols', '20');
  await expect.poll(async () => (await saved(page))?.world.entities.length).toBe(30);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-map')).toHaveAttribute('data-cols', '20');
});

test('relay-command: the opponent level chosen before a new game is kept in the save', async ({ page }) => {
  // The game opens at once (ADR 0015); the level is chosen in the toolbar and New game starts afresh with it.
  await page.goto('/games/relay-command');
  await expect(page.getByTestId('rc-map')).toBeVisible();
  await page.getByTestId('difficulty').selectOption('hard');
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('rc-map')).toBeVisible();
  await expect.poll(async () => ((await readSave(page, 'relay-command')) as { state: { difficulty: string } } | undefined)?.state.difficulty).toBe('hard');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2');
});

test('relay-command: map and length chosen before the first turn survive a reload', async ({ page }) => {
  await start(page);
  await page.getByTestId('rc-turn-limit').selectOption('12');
  await page.getByTestId('rc-scenario').selectOption('ridge-valley');
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 1 of 12');
  await expect.poll(async () => (await saved(page))?.world.entities.length).toBe(30);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-map')).toHaveAttribute('data-cols', '20');
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 1 of 12');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2 of 12');
  // The setup stays in place (the map does not jump) but can no longer be changed.
  await expect(page.getByTestId('rc-scenario')).toBeDisabled();
  await expect(page.getByTestId('rc-turn-limit')).toBeDisabled();
});

test('relay-command: "Deposits never run dry" chosen before the first turn survives a reload and stays locked after it', async ({ page }) => {
  await start(page);
  const box = page.getByTestId('rc-endless');
  await expect(box).not.toBeChecked();
  // The label is the touch target (44 px), not only the small box.
  await page.getByTestId('rc-setup').getByText('Deposits never run dry', { exact: true }).click();
  await expect(box).toBeChecked();
  await expect.poll(async () => (await saved(page))?.endless).toBe(true);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-endless')).toBeChecked();
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-endless')).toBeDisabled();
  await expect(page.getByTestId('rc-setup-summary')).toContainText('endless deposits');
});

test('relay-command: the Command Post places an Extractor on a deposit by tapping the map', async ({ page, isMobile }) => {
  await start(page);
  const s = (await saved(page))!;
  const post = s.world.entities.find((e) => e.side === 0 && e.kind === 'command-post')!;
  await page.getByTestId(`rc-unit-${post.id}`).click();
  await page.getByTestId('rc-job-extractor').click();
  await expect(page.getByTestId('rc-placing')).toHaveText('Choose a deposit inside your coverage for the Extractor.');
  // The deposit behind the player's post on Field Exercise lies at (4, 10).
  const map = page.getByTestId('rc-map');
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  const cell = box.width / 12;
  const position = { x: 4 * cell + cell / 2, y: 10 * cell + cell / 2 };
  if (isMobile) await map.tap({ position });
  else await map.click({ position });
  await expect.poll(async () => (await saved(page))?.draft[0]?.order).toEqual({ type: 'build', kind: 'extractor', x: 4, y: 10 });
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 → 220 (+20)');
});

test('relay-command: queueing a unit at the Muster Yard works on a phone and survives a reload', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await start(page);
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 (+20)');
  const yard = (await saved(page))!.world.entities.find((e) => e.side === 0 && e.kind === 'muster')!;
  await page.getByTestId(`rc-unit-${yard.id}`).click();
  await page.getByTestId('rc-job-rifles').click();
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 → 260 (+20)');
  await expect.poll(async () => (await saved(page))?.draft[0]?.order.type).toBe('produce');
  // The production sheet fits the phone: no sideways scrolling.
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 → 260 (+20)');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-summary')).toContainText('Finished: Rifle Squad');
  await expect.poll(async () => (await saved(page))?.world.entities.filter((e) => e.side === 0 && e.kind === 'rifles').length).toBe(3);
});

test('relay-command: the map and the top bar stay in place between turns and when a unit is selected', async ({ page }) => {
  await start(page);
  const where = () =>
    page.evaluate(() => {
      const box = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
      return { map: Math.round(box('rc-map').top + window.scrollY), mapX: Math.round(box('rc-map').left), lock: Math.round(box('rc-lock').top + window.scrollY), side: Math.round(box('rc-selection').width) };
    });
  // The first lock folds the game setup into one line (once); from then on nothing moves.
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2');
  const first = await where();
  await page.locator('[data-testid^="rc-unit-"]').nth(2).click();
  expect(await where()).toEqual(first);
  // Planning a production job changes the Supply line ("300 → 260"): it must not wrap.
  const yard = (await saved(page))!.world.entities.find((e) => e.side === 0 && e.kind === 'muster')!;
  await page.getByTestId(`rc-unit-${yard.id}`).click();
  await page.getByTestId('rc-job-rifles').click();
  await expect(page.getByTestId('rc-supply')).toContainText('→');
  expect(await where()).toEqual(first);
  for (let turn = 3; turn <= 4; turn++) {
    await page.getByTestId('rc-lock').click();
    await expect(page.getByTestId('rc-turn')).toHaveText(`Turn ${turn}`);
    expect(await where()).toEqual(first);
  }
});

test('relay-command: the game setup never scrolls sideways on a 360 px phone (a wide option once broke the layout viewport)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await start(page);
  await expect(page.getByTestId('rc-setup')).toBeVisible();
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  // Every setup control fits inside the viewport too.
  for (const id of ['rc-scenario', 'rc-turn-limit']) {
    const box = (await page.getByTestId(id).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(360);
  }
});

test('relay-command: selling a building takes two taps, survives a reload and pays out when the turn is locked', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await start(page);
  const yard = (await saved(page))!.world.entities.find((e) => e.side === 0 && e.kind === 'muster')!;
  await page.getByTestId(`rc-unit-${yard.id}`).click();
  await expect(page.getByTestId('rc-sell')).toHaveText('Sell (+50 Supply)');
  await page.getByTestId('rc-sell').click();
  await expect(page.getByTestId('rc-sell')).toHaveText('Press again to sell (+50 Supply)');
  // A second tap within 400 ms is taken for a double tap (unit-tested); a deliberate one sells.
  await page.waitForTimeout(450);
  await page.getByTestId('rc-sell').click();
  await expect.poll(async () => (await saved(page))?.draft.map((c) => c.order.type)).toEqual(['sell']);
  await page.reload();
  await page.getByTestId('continue').click();
  await page.getByTestId(`rc-unit-${yard.id}`).click();
  await expect(page.getByTestId('rc-jobs')).toContainText('Planned: sell (+50 Supply)');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-summary')).toContainText('sold (+50 Supply)');
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 370 (+20)');
  await expect.poll(async () => (await saved(page))?.world.entities.some((e) => e.id === yard.id)).toBe(false);
});

test('relay-command: the map editor on a phone — paint with taps, save, resume after a reload, play the map', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await start(page);
  await page.getByTestId('rc-editor-open').click();
  await expect(page.getByTestId('rc-editor')).toBeVisible();
  await expect(page.getByTestId('rc-map')).toBeHidden();
  const map = page.getByTestId('ed-map');
  // Taps at a cell (the map scrolls into view first: on a phone the palette sits below it).
  const tap = async (x: number, y: number) => {
    const box = (await map.boundingBox())!;
    await map.click({ position: { x: ((x + 0.5) * box.width) / 16, y: ((y + 0.5) * box.height) / 12 } });
  };
  await page.getByTestId('ed-tool-command-post').click();
  await tap(1, 9);
  await page.getByTestId('ed-tool-rifles').click();
  await tap(3, 9);
  await page.getByTestId('ed-tool-t6').click(); // water
  await tap(7, 5);
  await expect(page.getByTestId('ed-ok')).toHaveText('Ready to play.');
  await page.getByTestId('ed-name').fill('Lake');
  await page.getByTestId('ed-name').press('Tab');
  await page.getByTestId('ed-save').click();
  await expect(page.getByTestId('ed-notice')).toHaveText('Saved: Lake.');
  // Nothing scrolls sideways on the phone.
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-editor')).toBeVisible();
  await expect(page.getByTestId('ed-library')).toContainText('Lake (16×12)');
  await page.getByTestId('ed-play').click();
  await expect(page.getByTestId('rc-editor')).toBeHidden();
  await expect(page.getByTestId('rc-map')).toBeVisible();
  await expect.poll(async () => ((await saved(page)) as unknown as { scenario: string } | undefined)?.scenario).toBe('custom');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2');
});

test('relay-command: a saved map is the player\'s own content — Settings counts it, "Delete all saved games" keeps it, "Delete my own content" removes it', async ({ page }) => {
  await start(page);
  await page.getByTestId('rc-editor-open').click();
  const map = page.getByTestId('ed-map');
  const tap = async (x: number, y: number) => {
    const box = (await map.boundingBox())!;
    await map.click({ position: { x: ((x + 0.5) * box.width) / 16, y: ((y + 0.5) * box.height) / 12 } });
  };
  await page.getByTestId('ed-tool-command-post').click();
  await tap(1, 9);
  await page.getByTestId('ed-tool-rifles').click();
  await tap(3, 9);
  await page.getByTestId('ed-name').fill('Kept');
  await page.getByTestId('ed-name').press('Tab');
  await page.getByTestId('ed-save').click();
  await expect(page.getByTestId('ed-notice')).toHaveText('Saved: Kept.');

  await page.goto('/settings');
  await expect(page.getByTestId('library-info')).toContainText(': 1');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('clear-saves').click();
  await expect.poll(() => saved(page)).toBeFalsy();
  await expect(page.getByTestId('library-info')).toContainText(': 1');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('clear-library').click();
  await expect(page.getByTestId('library-info')).toContainText(': 0');

  // Back in the game: the map is gone from the device's maps.
  await start(page);
  await page.getByTestId('rc-editor-open').click();
  await expect(page.getByTestId('ed-library')).toContainText('No saved maps yet.');
});

test('relay-command: a game against two opponents (four bases) shows side letters and resumes after a reload', async ({ page }) => {
  await start(page);
  // Only the four-base map offers more than one opponent.
  await expect(page.getByTestId('rc-opponents-label')).toBeHidden();
  await page.getByTestId('rc-scenario').selectOption('four-corners');
  await expect(page.getByTestId('rc-opponents-label')).toBeVisible();
  await page.getByTestId('rc-opponents').selectOption('2');
  await expect.poll(async () => ((await saved(page)) as unknown as { opponents?: number } | undefined)?.opponents).toBe(2);
  // The opponents' known structures carry their letters (colour is never the only cue).
  await expect(page.locator('[data-testid^="rc-mark-"]').first()).toBeVisible();
  await expect(page.getByTestId('rc-enemy')).toContainText('B');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-turn')).toContainText('Turn 2');
  await expect.poll(async () => (await saved(page))?.world.turn).toBe(1);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-map')).toHaveAttribute('data-cols', '16');
  await expect(page.getByTestId('rc-turn')).toContainText('Turn 2');
  await expect(page.getByTestId('rc-opponents')).toBeDisabled();
  await expect(page.getByTestId('rc-opponents')).toHaveValue('2');
  const state = (await saved(page)) as unknown as { opponents: number; world: { sides: number } };
  expect(state).toMatchObject({ opponents: 2, world: { sides: 3 } });
});

test('relay-command: infantry next to the neutral post takes it over, and the turn summary says so', async ({ page }) => {
  await start(page);
  await page.getByTestId('rc-scenario').selectOption('four-corners');
  await page.getByTestId('rc-opponents').selectOption('2');
  await expect.poll(async () => ((await saved(page)) as unknown as { opponents?: number } | undefined)?.opponents).toBe(2);
  // Put the player's first Rifle Squad next to the neutral post (the empty fourth base) in the save.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          db.onversionchange = () => db.close();
          const store = db.transaction('saves', 'readwrite').objectStore('saves');
          const get = store.get('relay-command');
          get.onsuccess = () => {
            const record = get.result as { state: { world: { entities: { id: number; side: number; kind: string; x: number; y: number }[]; intel: { id: number; x: number; y: number; live: boolean }[][] } } };
            const world = record.state.world;
            const post = world.entities.find((e) => e.side === -1)!;
            const rifle = world.entities.find((e) => e.side === 0 && e.kind === 'rifles')!;
            const free = [[-1, 0], [0, -1], [-1, -1], [1, 0], [0, 1]].map(([dx, dy]) => [post.x + dx!, post.y + dy!]).find(([x, y]) => x! >= 0 && y! >= 0 && x! < 16 && y! < 16 && !world.entities.some((e) => e.x === x && e.y === y))!;
            rifle.x = free[0]!;
            rifle.y = free[1]!;
            for (const list of world.intel) for (const r of list) if (r.id === rifle.id) Object.assign(r, { x: rifle.x, y: rifle.y, live: false });
            const put = store.put(record);
            put.onsuccess = () => {
              db.close();
              resolve();
            };
            put.onerror = () => reject(put.error);
          };
          get.onerror = () => reject(get.error);
        };
      })
  );
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-map')).toHaveAttribute('data-cols', '16');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-summary')).toContainText('You captured Command Post');
  const state = (await saved(page))!;
  expect(state.world.entities.filter((e) => e.kind === 'command-post' && e.side === 0)).toHaveLength(2);
});

test('relay-command: hot-seat on a 360 px phone — two people and a computer, a hand-over that hides everything and survives a reload', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await start(page);
  await page.getByTestId('rc-scenario').selectOption('four-corners');
  await page.getByTestId('rc-opponents').selectOption('2');
  await page.getByTestId('rc-seat-1-person').check();
  await expect.poll(async () => ((await saved(page)) as unknown as { seats?: string[] } | undefined)?.seats).toEqual(['person', 'person', 'computer']);
  await expect(page.getByTestId('rc-hotseat-hint')).toBeVisible();
  // The setup with its seat rows never scrolls sideways.
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  // Player A plans one order and hands over.
  await page.locator('[data-testid^="rc-unit-"]').nth(2).click();
  await page.getByTestId('rc-regroup').click();
  await expect(page.getByTestId('rc-slots')).toHaveText('Planning: 1/4');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-handover')).toContainText('Pass the device to Player B');
  await expect(page.getByTestId('rc-map')).toHaveCount(0);
  await expect(page.getByTestId('rc-handover-confirm')).toBeFocused();
  // Reload at the hand-over: it opens at the hand-over again, nothing of A is shown.
  await expect.poll(async () => ((await saved(page)) as unknown as { planning?: number } | undefined)?.planning).toBe(1);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-handover')).toContainText('Player B');
  await expect(page.getByTestId('rc-map')).toHaveCount(0);
  // Keyboard only: the confirm button takes Enter; B sees an empty plan of its own.
  await page.getByTestId('rc-handover-confirm').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('rc-seat')).toContainText('Player B plans');
  await expect(page.getByTestId('rc-slots')).toHaveText('Planning: 0/4');
  await page.getByTestId('rc-lock').click();
  // The turn is carried out; the device goes back to A, whose order was carried out.
  await expect(page.getByTestId('rc-handover')).toContainText('Player A');
  await expect.poll(async () => (await saved(page))?.world.turn).toBe(1);
  await page.getByTestId('rc-handover-confirm').click();
  await expect(page.getByTestId('rc-turn')).toContainText('Turn 2');
  const widthsAfter = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widthsAfter.page).toBeLessThanOrEqual(widthsAfter.viewport);
});

test('relay-command: in Arabic on a 360 px phone the doctrine choices of a selected unit never widen the page', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/settings');
  await page.getByTestId('ui-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.goto('/games/relay-command');
  await page.locator('[data-testid^="rc-unit-"]').nth(2).click();
  await expect(page.getByTestId('rc-doctrine-lostcontact')).toBeVisible();
  await expect(page.getByTestId('rc-doctrine-lostcontact').locator('option')).toHaveCount(3);
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
});

test('relay-command: the unit card (meter list) fits a 360 px phone in en, de, ru and ar with "More" open; no label breaks inside a word', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  for (const lang of ['en', 'de', 'ru', 'ar'] as const) {
    if (lang !== 'en') {
      await page.goto('/settings');
      await page.getByTestId('ui-language').selectOption(lang);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await page.goto('/games/relay-command');
      await page.getByTestId('continue').click();
    } else await start(page);
    await page.locator('[data-testid^="rc-unit-"]').nth(2).click();
    await expect(page.getByTestId('rc-card-meters')).toBeVisible();
    await page.getByTestId('rc-card-more').locator('summary').click();
    await expect(page.getByTestId('rc-card-vs')).toBeVisible();
    const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    expect(widths.page, lang).toBeLessThanOrEqual(widths.viewport);
    for (const id of ['rc-card-meters', 'rc-card-vs']) {
      const box = (await page.getByTestId(id).boundingBox())!;
      expect(box.x, `${lang} ${id}`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${lang} ${id}`).toBeLessThanOrEqual(360);
    }
    // Every meter label and every armour word of the table stays on one line (review of PR #30).
    const lines = await page.locator('[data-testid="rc-card-meters"] dt span, [data-testid="rc-card-vs"] th span').evaluateAll((spans) => spans.map((el) => [el.textContent, el.getClientRects().length] as const));
    expect(lines.length, lang).toBeGreaterThan(5);
    for (const [text, rects] of lines) expect(rects, `${lang} "${text}"`).toBe(1);
    // Every bar has the same width, so the segments read on one scale (review of PR #30).
    const bars = await page.locator('[data-testid="rc-card-meters"] .rc-seg').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
    expect(new Set(bars).size, `${lang} bar widths ${bars.join(',')}`).toBe(1);
  }
});
