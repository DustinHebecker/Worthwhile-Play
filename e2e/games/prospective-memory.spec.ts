import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave } from '../../packages/testing/src/e2e';

interface SavedProspective {
  difficulty: string;
  phase: string;
  index: number;
  answers: string[];
  checkIns: number[];
}

const savedState = async (page: Page) => ((await readSave(page, 'prospective-memory')) as { state: SavedProspective } | undefined)?.state;

/** What the person currently sees: item number, shape and the dot cue. */
async function visibleItem(page: Page) {
  const item = page.getByTestId('pm-item');
  return {
    index: await item.getAttribute('data-index'),
    shape: await item.getAttribute('data-shape'),
    dot: await item.getAttribute('data-dot'),
    label: await item.getAttribute('aria-label')
  };
}

test('prospective-memory: a block resumes at the same shape after a reload (keyboard answers)', async ({ page }) => {
  let before: Awaited<ReturnType<typeof visibleItem>> | undefined;
  await expectResumeAfterReload(page, 'prospective-memory', async (p) => {
    await expect(p.getByTestId('pm-intentions')).toContainText('★');
    await p.getByTestId('pm-start').click();
    await expect(p.getByTestId('pm-item')).toHaveAttribute('data-index', '0');
    await expect(p.getByTestId('pm-round')).toBeFocused();
    await p.keyboard.press('f');
    await expect(p.getByTestId('pm-item')).toHaveAttribute('data-index', '1');
    await p.keyboard.press('j');
    await expect(p.getByTestId('pm-item')).toHaveAttribute('data-index', '2');
    await p.keyboard.press('f');
    await expect(p.getByTestId('pm-item')).toHaveAttribute('data-index', '3');
    await expect.poll(async () => (await savedState(p))?.index).toBe(3);
    before = await visibleItem(p);
  });

  const state = await savedState(page);
  expect(state).toMatchObject({ difficulty: 'easy', phase: 'running', index: 3, answers: ['round', 'angular', 'round'], checkIns: [] });
  // The restored block waits behind Continue and shows the intentions again.
  await expect(page.getByTestId('pm-continue')).toBeVisible();
  await expect(page.getByTestId('pm-reminder')).toContainText('★');
  await expect(page.getByTestId('pm-status')).toContainText('4');
  await page.getByTestId('pm-continue').click();
  expect(await visibleItem(page)).toEqual(before);
  await page.getByTestId('pm-angular').click();
  await expect(page.getByTestId('pm-item')).toHaveAttribute('data-index', '4');
});

test('prospective-memory: responding to the star cue with the N key records a note', async ({ page }) => {
  await page.goto('/games/prospective-memory');
  await page.getByTestId('difficulty').selectOption('easy');
  await page.getByTestId('new-game').click();
  await page.getByTestId('pm-start').click();
  const item = page.getByTestId('pm-item');
  // Sort shapes with the keyboard until the first star appears (never within the first 4 shapes).
  for (let i = 0; i < 40 && (await item.getAttribute('data-shape')) !== 'star'; i++) {
    const shape = await item.getAttribute('data-shape');
    await page.keyboard.press(shape === 'circle' || shape === 'oval' ? 'f' : 'j');
    await expect(item).toHaveAttribute('data-index', String(i + 1));
  }
  await expect(item).toHaveAttribute('data-shape', 'star');
  await expect(item).toHaveAttribute('aria-label', 'Star');
  const index = Number(await item.getAttribute('data-index'));
  expect(index).toBeGreaterThanOrEqual(4);
  await page.keyboard.press('n');
  await expect(item).toHaveAttribute('data-index', String(index + 1));
  await expect(page.getByTestId('pm-ack')).toHaveText('Note recorded.');
  await expect.poll(async () => (await savedState(page))?.answers[index]).toBe('note');

  await page.reload();
  await page.getByTestId('continue').click();
  await page.getByTestId('pm-continue').click();
  await expect(page.getByTestId('pm-item')).toHaveAttribute('data-index', String(index + 1));
});

test('prospective-memory: hard offers Check in by keyboard (C) and keeps it across a reload', async ({ page }) => {
  await page.goto('/games/prospective-memory');
  await page.getByTestId('difficulty').selectOption('hard');
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('pm-intentions')).toContainText('20');
  await page.getByTestId('pm-start').click();
  await expect(page.getByTestId('pm-checkIn')).toBeVisible();
  await page.keyboard.press('f');
  await page.keyboard.press('c');
  await expect(page.getByTestId('pm-ack')).toHaveText('Check-in recorded.');
  await expect(page.getByTestId('pm-item')).toHaveAttribute('data-index', '1');
  await expect.poll(async () => (await savedState(page))?.checkIns).toEqual([1]);
  await page.reload();
  await page.getByTestId('continue').click();
  await page.getByTestId('pm-continue').click();
  await expect(page.getByTestId('pm-item')).toHaveAttribute('data-index', '1');
  expect((await savedState(page))?.checkIns).toEqual([1]);
});
