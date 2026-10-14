import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedSignal {
  phase: string;
  index: number;
  responses: { index: number; rtMs: number }[];
}

const savedState = async (page: Page) => ((await readSave(page, 'signal-watch')) as { state: SavedSignal }).state;

/** Simulates the tab being hidden, so the host pauses the game (and flushes the save). */
async function hideTab(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

test('signal-watch: a paused session resumes at the same stimulus after a reload', async ({ page }) => {
  await expectResumeAfterReload(page, 'signal-watch', async (p) => {
    await expect(p.getByTestId('sw-length')).toContainText('2');
    await p.getByTestId('sw-start').click();
    await expect(p.getByTestId('sw-stimulus')).toHaveAttribute('data-index', '0');
    await expect(p.getByTestId('sw-stimulus')).toHaveAttribute('data-index', '1', { timeout: 5_000 });
    await p.getByTestId('sw-respond').click();
    await hideTab(p);
    await expect(p.getByTestId('sw-continue')).toBeVisible();
  });

  // The restored session waits at the saved stimulus, with the response kept.
  const state = await savedState(page);
  expect(state.phase).toBe('running');
  expect(state.responses[0]?.index).toBe(1);
  expect(state.index).toBeGreaterThanOrEqual(1);
  const stimulus = page.getByTestId('sw-stimulus');
  await expect(stimulus).toHaveAttribute('data-index', String(state.index));
  await expect(stimulus).toHaveAttribute('data-symbol', '');
  await expect(page.getByTestId('sw-status')).toContainText(String(state.index + 1));
  await expect(page.getByTestId('sw-continue')).toBeVisible();
  await expect(page.getByTestId('sw-respond')).toBeHidden();

  // Continuing re-presents that stimulus and the stream goes on from there.
  await page.getByTestId('sw-continue').click();
  await expect(stimulus).toHaveAttribute('data-index', String(state.index));
  await expect(stimulus).not.toHaveAttribute('data-symbol', '');
  await expect(stimulus).toHaveAttribute('data-index', String(state.index + 1), { timeout: 5_000 });
});

test('signal-watch: Space responds and is saved for the current stimulus', async ({ page }) => {
  await page.goto('/games/signal-watch');
  await page.getByTestId('new-game').click();
  await page.getByTestId('sw-start').click();
  await expect(page.getByTestId('sw-respond')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('sw-ack')).not.toBeEmpty();
  await hideTab(page);
  await expect.poll(async () => (await savedState(page))?.responses.length ?? 0).toBe(1);
  expect((await savedState(page)).responses[0]?.index).toBe(0);
});
