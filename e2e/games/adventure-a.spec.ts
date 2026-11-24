import { expect, test, type Page } from '@playwright/test';
import { expectResumeAfterReload, readSave, startGame } from '../../packages/testing/src/e2e';
import { en } from '../../packages/games/adventure-a/src/content/en';

const root = (page: Page) => page.getByTestId('game-root');
const id = (page: Page, testId: string) => root(page).getByTestId(testId);
/** Open a place in the text view and choose one of its actions. */
async function act(page: Page, hs: string, action: string): Promise<void> {
  await id(page, `hs-${hs}`).click();
  await id(page, `act-${action}-${hs}`).click();
}

interface SavedAdventure {
  scene: string;
  items: string[];
  selected: string | null;
  dialogue: { id: string; node: string } | null;
  ended: string | null;
}
const saved = async (page: Page) => ((await readSave(page, 'adventure-a')) as { state: SavedAdventure }).state;

test('adventure-a: an open conversation with a selected item survives a reload exactly', async ({ page }) => {
  await expectResumeAfterReload(page, 'adventure-a', async (p) => {
    await act(p, 'lamp', 'take');
    await id(p, 'item-lamp').click();
    await act(p, 'keeper', 'talk');
    await expect(id(p, 'opt-crossing')).toBeVisible();
  });
  const s = await saved(page);
  expect(s.dialogue).toEqual({ id: 'keeper', node: 'hello' });
  expect(s.selected).toBe('lamp');
  // The restored view shows the conversation, and the selected item once it ends.
  await expect(id(page, 'opt-crossing')).toBeVisible();
  await id(page, 'opt-bye').click();
  await expect(id(page, 'item-lamp')).toHaveAttribute('aria-pressed', 'true');
});

test('adventure-a: the whole prologue can be played with the keyboard only, through the text view', async ({ page }) => {
  await startGame(page, 'adventure-a');
  await expect(id(page, 'scene-name')).toHaveText(en['scene.jetty.name'] as string);
  const press = async (testId: string) => {
    await id(page, testId).focus();
    await page.keyboard.press('Enter');
  };
  const keyAct = async (hs: string, action: string) => {
    await press(`hs-${hs}`);
    await press(`act-${action}-${hs}`);
  };
  await keyAct('lamp', 'take');
  await keyAct('keeper', 'talk');
  await press('opt-crossing');
  await press('opt-bye');
  await keyAct('path', 'use');
  await expect(id(page, 'scene-name')).toHaveText(en['scene.square.name'] as string);
  await keyAct('board', 'examine');
  await expect(id(page, 'outcome')).toContainText(en['hs.square.board.examine.0'] as string);
  await id(page, 'journal').locator('summary').focus();
  await page.keyboard.press('Enter');
  await press('clue-ferry-rule');
  await press('clue-heron-notches');
  await press('connect');
  await keyAct('door', 'use');
  await keyAct('flask', 'take');
  await press('item-lamp');
  await press('item-oil');
  await press('item-lamp-filled');
  await keyAct('hearth', 'useItem');
  await id(page, 'map').locator('summary').focus();
  await page.keyboard.press('Enter');
  await press('travel-jetty');
  await press('item-lamp-lit');
  await keyAct('keeper', 'useItem');
  await keyAct('lock', 'use');
  await keyAct('boat', 'use');
  await expect(id(page, 'chapter-continue')).toBeVisible();
  expect((await saved(page)).ended).toBe('prologue-end');
});

test('adventure-a: a tap on the picture opens the place and brings its actions into view (phones)', async ({ page }) => {
  await startGame(page, 'adventure-a');
  await id(page, 'spot-path').click({ force: true });
  await expect(id(page, 'act-use-path')).toBeInViewport();
});

test('adventure-a: Arabic keeps the picture unmirrored and the text view right-to-left', async ({ page }) => {
  await startGame(page, 'adventure-a');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  // A language switch re-renders the game page; the saved game continues in Arabic.
  await page.getByTestId('continue').click();
  await expect(id(page, 'scene-name')).toBeVisible();
  await expect(root(page).locator('.wp-adv__figure')).toHaveCSS('direction', 'ltr');
  const width = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(width).toBeLessThanOrEqual(1);
});
