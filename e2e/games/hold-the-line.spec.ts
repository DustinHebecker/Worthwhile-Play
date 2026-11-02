import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';

const root = (page: Page) => page.getByTestId('game-root');
const game = (page: Page) => root(page).locator('.wp-hold-the-line');
/** The computer plans at the lock (in its Worker, within its work budget): on a loaded machine that takes a while. */
const PLANNING = { timeout: 20_000 };

test('hold-the-line: a plan and a paused battle survive a reload at the same tick', async ({ page }) => {
  let tick = '';
  await expectResumeAfterReload(page, 'hold-the-line', async (p) => {
    await root(p).getByTestId('cell-5-12').click();
    await root(p).getByTestId('build-gun').click();
    // The Duel produces by default: a Drill yard sends three Walkers at every lock.
    await root(p).getByTestId('cell-1-13').click();
    await root(p).getByTestId('build-barracks').click();
    await expect(root(p).getByTestId('credits')).toHaveAttribute('data-value', '50');
    await expect(root(p).getByTestId('production-wave')).toContainText('3 × Walker');
    await root(p).getByTestId('lock').click();
    await expect(game(p)).toHaveAttribute('data-phase', 'battle', PLANNING);
    await expect.poll(async () => Number(await game(p).getAttribute('data-tick'))).toBeGreaterThan(10);
    await root(p).getByTestId('play').click();
    tick = (await game(p).getAttribute('data-tick')) ?? '';
  });
  await expect(game(page)).toHaveAttribute('data-phase', 'battle');
  await expect(game(page)).toHaveAttribute('data-tick', tick);
  await root(page).getByTestId('instant').click();
  await expect(game(page)).toHaveAttribute('data-phase', 'plan');
  await expect(game(page)).toHaveAttribute('data-round', '1');
  // After the round both sides' last waves are known.
  await expect(root(page).getByTestId('intel-theirs')).toBeVisible();
});

test('hold-the-line: 44 px cells on a 360 px phone and locking by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startGame(page, 'hold-the-line');
  const first = await root(page).getByTestId('cell-0-0').boundingBox();
  const last = await root(page).getByTestId('cell-6-16').boundingBox();
  expect(first!.width).toBeGreaterThanOrEqual(44);
  expect(last!.x + last!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await root(page).getByTestId('cell-0-0').focus();
  await page.keyboard.press('ArrowDown');
  await expect(root(page).getByTestId('cell-0-1')).toBeFocused();
  await page.keyboard.press(' ');
  // The round is locked: the battle runs, or (nothing sent on either side) is already over.
  await expect
    .poll(async () => (await game(page).getAttribute('data-phase')) === 'battle' || (await game(page).getAttribute('data-round')) === '1', PLANNING)
    .toBe(true);
});

test('hold-the-line: a whole game ends calmly with a result', async ({ page }) => {
  // Several locks, each waiting for the computer's plan.
  test.setTimeout(120_000);
  // The shop variant (start-screen choice "Attack waves: Shop").
  await startGame(page, 'hold-the-line', { difficulty: 'easy', settings: { length: 'rounds', waves: 'shop' } });
  for (let round = 0; round < 10; round++) {
    if ((await game(page).getAttribute('data-phase')) !== 'plan') break;
    await root(page).getByTestId('buy-walker').click();
    await root(page).getByTestId('lock').click();
    await expect(game(page)).toHaveAttribute('data-phase', /battle|won|lost|draw/, PLANNING);
    if ((await game(page).getAttribute('data-phase')) === 'battle') await root(page).getByTestId('instant').click();
  }
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect(root(page).getByTestId('status')).toBeVisible();
  const saved = (await readSave(page, 'hold-the-line')) as { state: { phase: string } };
  expect(['won', 'lost', 'draw']).toContain(saved.state.phase);
});

test('hold-the-line: production buildings and research, in effect from the next round, survive a reload', async ({ page }) => {
  // Several locks, each waiting for the computer's plan.
  test.setTimeout(120_000);
  await startGame(page, 'hold-the-line', { difficulty: 'easy' });
  await root(page).getByTestId('cell-1-13').click();
  await root(page).getByTestId('build-lab').click();
  await root(page).getByTestId('research-shields').click();
  await expect(root(page).getByTestId('research-next')).toContainText('Armour plates');
  // Two rounds of income for a Drill yard (the Lab and the research took all 300 credits).
  for (const round of ['1', '2']) {
    await root(page).getByTestId('lock').click();
    // The battle runs, or (nothing sent) is already over.
    await expect.poll(async () => (await game(page).getAttribute('data-phase')) === 'battle' || (await game(page).getAttribute('data-round')) === round, PLANNING).toBe(true);
    if ((await game(page).getAttribute('data-phase')) === 'battle') await root(page).getByTestId('instant').click();
    await expect(game(page)).toHaveAttribute('data-round', round);
  }
  await expect(root(page).getByTestId('research-done')).toContainText('Armour plates');
  await root(page).getByTestId('cell-2-13').click();
  await root(page).getByTestId('build-barracks').click();
  await expect(root(page).getByTestId('production-wave')).toContainText('3 × Shield bearer');
  // Wait for the save that holds the Drill yard, then reload.
  await expect
    .poll(async () => {
      const saved = (await readSave(page, 'hold-the-line')) as { state?: { world?: { entities?: { kind: string; side: number }[] }; sides?: { research?: string[] }[] } } | undefined;
      return [saved?.state?.sides?.[0]?.research, saved?.state?.world?.entities?.some((e) => e.kind === 'barracks' && e.side === 0)];
    })
    .toEqual([['shields'], true]);
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(root(page).getByTestId('production-wave')).toContainText('3 × Shield bearer');
});

test('hold-the-line: Outside force is chosen on the start screen, needs no shop and survives a reload', async ({ page }) => {
  await startGame(page, 'hold-the-line', { settings: { mode: 'external-small' }, difficulty: 'easy' });
  await expect(root(page).getByTestId('outside-wave')).toBeVisible();
  // No shop: the panel of buildings sends defenders here (§ 18.3).
  await expect(root(page).getByTestId('buy-walker')).toHaveCount(0);
  await expect(root(page).getByTestId('production-wave')).toContainText('defenders');
  // The force comes in at the middle row: both entry cells are road.
  await expect(root(page).getByTestId('cell-2-8')).toHaveAttribute('aria-label', /road/);
  await expect(root(page).getByTestId('cell-4-8')).toHaveAttribute('aria-label', /road/);
  await root(page).getByTestId('cell-3-9').click();
  await root(page).getByTestId('build-gun').click();
  await root(page).getByTestId('lock').click();
  await expect(game(page)).toHaveAttribute('data-phase', 'battle', PLANNING);
  await root(page).getByTestId('instant').click();
  await expect(game(page)).toHaveAttribute('data-round', '1');
  // After a round, what got through is shown with the extra units it brings.
  await expect(root(page).getByTestId('outside-pressure')).toBeVisible();
  // Wait for the save of round 2's plan (the mode alone is already saved in round 1).
  await expect
    .poll(async () => {
      const saved = (await readSave(page, 'hold-the-line')) as { state?: { mode?: string; round?: number } } | undefined;
      return `${saved?.state?.mode}/${saved?.state?.round}`;
    })
    .toBe('external-small/1');
  await page.reload();
  await page.getByTestId('continue').click();
  await expect(game(page)).toHaveAttribute('data-round', '1');
  await expect(root(page).getByTestId('outside-wave')).toBeVisible();
  // No shop: the panel of buildings sends defenders here (§ 18.3).
  await expect(root(page).getByTestId('buy-walker')).toHaveCount(0);
  await expect(root(page).getByTestId('production-wave')).toContainText('defenders');
});

test('hold-the-line: alone against the outside force, endless until the core falls', async ({ page }) => {
  // Several locks, each waiting for the computer's plan.
  test.setTimeout(120_000);
  await startGame(page, 'hold-the-line', { settings: { mode: 'external-solo', length: 'endless' } });
  await expect(root(page).getByTestId('core-foe')).toBeHidden();
  await expect(root(page).getByTestId('round')).not.toContainText('10');
  // Alone, the panel speaks of you only.
  await expect(root(page).getByTestId('outside-wave')).toContainText('you face');
  // No defence at all: the core falls within a few rounds, and the game ends calmly.
  for (let round = 0; round < 10; round++) {
    if ((await game(page).getAttribute('data-phase')) !== 'plan') break;
    await root(page).getByTestId('lock').click();
    await expect(game(page)).toHaveAttribute('data-phase', /battle|lost/, PLANNING);
    if ((await game(page).getAttribute('data-phase')) === 'battle') await root(page).getByTestId('instant').click();
    await expect(game(page)).not.toHaveAttribute('data-phase', 'battle');
  }
  await expect(page.getByTestId('finished')).toBeVisible();
  // Its own end wording: there is no other side that held.
  await expect(page.getByTestId('finished')).toContainText('The outside force broke through your line.');
  const saved = (await readSave(page, 'hold-the-line')) as { state: { phase: string; solo?: boolean; length?: string } };
  expect(saved.state).toMatchObject({ phase: 'lost', solo: true, length: 'endless' });
});

test('hold-the-line: alone, a Drill yard sends defenders that meet the force; they leave when the battle ends', async ({ page }) => {
  test.setTimeout(120_000);
  await startGame(page, 'hold-the-line', { settings: { mode: 'external-solo', length: 'endless' } });
  await root(page).getByTestId('cell-0-16').click();
  await root(page).getByTestId('build-barracks').click();
  await expect(root(page).getByTestId('production-wave')).toContainText('3 × Picket');
  await root(page).getByTestId('lock').click();
  // The battle runs with the defenders on the road (or, if it is over at once, the next round has begun).
  await expect.poll(async () => (await game(page).getAttribute('data-phase')) === 'battle' || (await game(page).getAttribute('data-round')) === '1', PLANNING).toBe(true);
  if ((await game(page).getAttribute('data-phase')) === 'battle') {
    await expect
      .poll(async () => {
        const saved = (await readSave(page, 'hold-the-line')) as { state?: { world?: { entities?: { kind: string }[] }; run?: { guards?: unknown[] } | null } } | undefined;
        return (saved?.state?.run?.guards?.length ?? 0) + (saved?.state?.world?.entities?.filter((e) => e.kind === 'picket').length ?? 0);
      }, PLANNING)
      .toBeGreaterThan(0);
    await root(page).getByTestId('instant').click();
  }
  await expect(game(page)).not.toHaveAttribute('data-phase', 'battle', PLANNING);
  const after = (await readSave(page, 'hold-the-line')) as { state: { world: { entities: { kind: string }[] } } };
  expect(after.state.world.entities.some((e) => e.kind === 'picket')).toBe(false);
});
