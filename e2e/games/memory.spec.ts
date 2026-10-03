import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedMemory {
  cards: unknown[];
  matched: boolean[];
  revealed: number[];
  moves: number;
}

const card = (page: Page, position: number) => page.getByTestId(`card-${position}`);

test('memory: a game survives a reload exactly, including a pending mismatch', async ({ page }) => {
  await expectResumeAfterReload(page, 'memory', async (p) => {
    await card(p, 0).click();
    await card(p, 1).click();
    await expect(card(p, 1)).not.toHaveAttribute('data-state', 'hidden');
  });

  // The restored board visibly matches the saved logical state.
  const state = ((await readSave(page, 'memory')) as { state: SavedMemory }).state;
  expect(state.moves).toBe(1);
  for (let i = 0; i < state.cards.length; i++) {
    const expected = state.matched[i] ? 'matched' : state.revealed.includes(i) ? 'revealed' : 'hidden';
    await expect(card(page, i)).toHaveAttribute('data-state', expected);
  }
  await expect(card(page, 0)).not.toHaveAttribute('data-state', 'hidden');
  await expect(card(page, 2)).toHaveAttribute('data-state', 'hidden');
  await expect(card(page, 2)).toHaveAttribute('aria-label', /3/);
  // A pending mismatch keeps its Continue button after reload; a found pair does not.
  await expect(page.getByTestId('memory-continue')).toBeVisible({ visible: state.revealed.length === 2 });
});
