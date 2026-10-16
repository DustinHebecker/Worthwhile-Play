import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame, submitStart } from '../../packages/testing/src/e2e';

interface SavedNBack {
  variant: string;
  pace: string;
  phase: string;
  index: number;
  answers: number[];
  pending: number;
}

const savedState = async (page: Page) => ((await readSave(page, 'n-back')) as { state: SavedNBack } | undefined)?.state;

/** What the person currently sees: item number/description and the marked cell. */
async function visibleItem(page: Page) {
  const item = page.getByTestId('nb-item');
  return {
    index: await item.getAttribute('data-index'),
    position: await item.getAttribute('data-position'),
    text: await item.textContent(),
    marked: await page.locator('[data-state="active"]').getAttribute('data-testid')
  };
}

test('n-back: a self-paced block resumes at the same item after a reload (keyboard answers)', async ({ page }) => {
  let before: Awaited<ReturnType<typeof visibleItem>> | undefined;
  await expectResumeAfterReload(page, 'n-back', async (p) => {
    // Start on the host's start screen begins the block at once (no second "Start block").
    await expect(p.getByTestId('nb-intro')).toBeHidden();
    await expect(p.getByTestId('nb-item')).toHaveAttribute('data-index', '0');
    // Item 1 cannot be compared yet: Enter on the focused "Next" button moves on.
    await expect(p.getByTestId('nb-next')).toBeFocused();
    await p.keyboard.press('Enter');
    await expect(p.getByTestId('nb-item')).toHaveAttribute('data-index', '1');
    await p.keyboard.press('m');
    await expect(p.getByTestId('nb-item')).toHaveAttribute('data-index', '2');
    await p.keyboard.press('j');
    await expect(p.getByTestId('nb-item')).toHaveAttribute('data-index', '3');
    await expect.poll(async () => (await savedState(p))?.index).toBe(3);
    before = await visibleItem(p);
  });

  const state = await savedState(page);
  expect(state).toMatchObject({ phase: 'running', index: 3, answers: [0, 1, 0], variant: 'position', pace: 'self' });
  // The restored block shows the very same item, ready for an answer.
  expect(await visibleItem(page)).toEqual(before);
  await expect(page.getByTestId('nb-status')).toContainText('4');
  await expect(page.getByTestId('nb-match')).toBeVisible();
  await expect(page.getByTestId('nb-no-match')).toBeVisible();
  await page.getByTestId('nb-no-match').click();
  await expect(page.getByTestId('nb-item')).toHaveAttribute('data-index', '4');
});

test('n-back: variant, pace and N are chosen on the start screen; dual answers with A / L / Enter', async ({ page }) => {
  await startGame(page, 'n-back', { difficulty: 'n1', settings: { variant: 'dual', pace: 'self' } });
  // The options live only on the start screen now.
  await expect(page.locator('[data-testid^="nb-variant-"]')).toHaveCount(0);
  await expect(page.getByTestId('nb-item')).toHaveAttribute('data-index', '0');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('nb-same-position')).toBeVisible();
  await page.keyboard.press('a');
  await expect(page.getByTestId('nb-same-position')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('l');
  await page.keyboard.press('a');
  await page.getByTestId('nb-next').click();
  await expect(page.getByTestId('nb-item')).toHaveAttribute('data-index', '2');
  await expect.poll(async () => (await savedState(page))?.answers).toEqual([0, 2]);
  await expect(page.getByTestId('settings-summary')).toContainText('Both (dual)');

  // The start screen remembers the choices; a new game keeps them.
  await page.reload();
  await expect(page.getByTestId('setting-variant').locator('input[value="dual"]')).toBeChecked();
  await submitStart(page);
  await expect.poll(async () => (await savedState(page))?.variant).toBe('dual');
});

test('n-back: the calm timed pace from the start screen closes an unanswered item by itself', async ({ page }) => {
  await startGame(page, 'n-back', { difficulty: 'n2', settings: { variant: 'symbol', pace: 'timed' } });
  await expect(page.getByTestId('nb-shape')).toBeVisible();
  await expect.poll(async () => await savedState(page)).toMatchObject({ variant: 'symbol', pace: 'timed', phase: 'running' });
  // Nothing pressed: after about 3 s the item counts as answered and the next one appears.
  await expect(page.getByTestId('nb-item')).toHaveAttribute('data-index', '1', { timeout: 8000 });
  const save = (await readSave(page, 'n-back')) as { difficulty: string; settings: Record<string, unknown> };
  expect(save).toMatchObject({ difficulty: 'n2', settings: { variant: 'symbol', pace: 'timed' } });
});
