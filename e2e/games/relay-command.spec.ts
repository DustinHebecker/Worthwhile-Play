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
    await p.locator('[data-testid^="rc-attack-"]').first().click();
    await expect(p.getByTestId('rc-status')).toContainText('1');
  });
  const state = (await saved(page))!;
  expect(state.phase).toBe('plan');
  expect(state.draft).toHaveLength(1);
  expect(state.draft[0]!.order.type).toBe('attack');
  await expect(page.getByTestId('rc-status')).toContainText('1');
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
  await expect(page.getByTestId('rc-turn')).toHaveText('Turn 2 of 12');
  await expect.poll(async () => (await saved(page))?.world.turn).toBe(1);
  await expect(page.getByTestId('rc-summary')).toContainText('Damage dealt');
});

test('relay-command: keyboard-only orders and playing to the natural end', async ({ page }) => {
  await start(page);
  const map = page.getByTestId('rc-map');
  await map.focus();
  // The cursor starts on the own Command Post; Enter there selects it (it cannot move).
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('rc-selection-text')).toContainText('Command Post');
  await page.keyboard.press('Escape');
  // Lock every turn until the game ends (turn limit 12 guarantees a natural end).
  for (let turn = 0; turn < 12; turn++) {
    if (await page.getByTestId('rc-lock').isDisabled()) break;
    await page.getByTestId('rc-lock').click();
  }
  await expect(page.getByTestId('rc-status')).toHaveAttribute('data-phase', 'finished');
  await expect(page.getByTestId('rc-lock')).toBeDisabled();
  await expect.poll(async () => (await saved(page))?.result).not.toBeNull();
});

test('relay-command: giving up asks first', async ({ page }) => {
  await start(page);
  await page.getByTestId('rc-concede').click();
  await page.getByTestId('rc-concede-no').click();
  await expect(page.getByTestId('rc-status')).toHaveAttribute('data-phase', 'plan');
  await page.getByTestId('rc-concede').click();
  await page.getByTestId('rc-concede-yes').click();
  await expect(page.getByTestId('rc-status')).toHaveAttribute('data-phase', 'finished');
  await expect.poll(async () => (await saved(page))?.result).toBe('lost');
});
