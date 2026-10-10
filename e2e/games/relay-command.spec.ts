import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedRelay {
  phase: string;
  draft: { unit: number; order: { type: string } }[];
  world: { turn: number; entities: { id: number; side: number; kind: string; x: number; y: number }[] };
  result: string | null;
}

const saved = async (page: Page) => ((await readSave(page, 'relay-command')) as { state: SavedRelay } | undefined)?.state;
const firstRifle = (s: SavedRelay) => s.world.entities.find((e) => e.side === 0 && e.kind === 'rifles')!;

async function start(page: Page) {
  await page.goto('/games/relay-command');
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('rc-map')).toBeVisible();
  // The host saves the fresh game; positions are read from that save.
  await expect.poll(async () => (await saved(page))?.world.entities.length ?? 0).toBeGreaterThan(0);
}

test('relay-command: a planned but unlocked order survives a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'relay-command', async (p) => {
    await p.locator('[data-testid^="rc-unit-"]').nth(2).click();
    await p.getByTestId('rc-regroup').click();
    await expect(p.getByTestId('rc-status')).toHaveText('Planning: 1 new orders. Lock the turn when you are ready.');
  });
  const state = (await saved(page))!;
  expect(state.phase).toBe('plan');
  expect(state.draft).toHaveLength(1);
  expect(state.draft[0]!.order.type).toBe('regroup');
  await expect(page.getByTestId('rc-status')).toHaveText('Planning: 1 new orders. Lock the turn when you are ready.');
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
  await expect(page.getByTestId('rc-slots')).toHaveText('Orders this turn: 0 of 4.');
  const truck = (await saved(page))!.world.entities.find((e) => e.side === 0 && e.kind === 'mast-truck')!;
  await page.getByTestId(`rc-unit-${truck.id}`).click();
  await page.getByTestId('rc-deploy').click();
  await expect(page.getByTestId('rc-slots')).toHaveText('Orders this turn: 1 of 4.');
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
  await expect(page.getByTestId('rc-slots')).toHaveText('Orders this turn: 1 of 4.');
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

test('relay-command: the opponent level chosen before a new game is kept in the save', async ({ page }) => {
  await page.goto('/games/relay-command');
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
  await expect(page.getByTestId('rc-setup')).toBeHidden();
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
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 (220 after planned orders) · income 20 per turn');
});

test('relay-command: queueing a unit at the Muster Yard works on a phone and survives a reload', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await start(page);
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 · income 20 per turn');
  const yard = (await saved(page))!.world.entities.find((e) => e.side === 0 && e.kind === 'muster')!;
  await page.getByTestId(`rc-unit-${yard.id}`).click();
  await page.getByTestId('rc-job-rifles').click();
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 (260 after planned orders) · income 20 per turn');
  await expect.poll(async () => (await saved(page))?.draft[0]?.order.type).toBe('produce');
  // The production sheet fits the phone: no sideways scrolling.
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('rc-supply')).toHaveText('Supply 300 (260 after planned orders) · income 20 per turn');
  await page.getByTestId('rc-lock').click();
  await expect(page.getByTestId('rc-summary')).toContainText('Finished: Rifle Squad');
  await expect.poll(async () => (await saved(page))?.world.entities.filter((e) => e.side === 0 && e.kind === 'rifles').length).toBe(3);
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
