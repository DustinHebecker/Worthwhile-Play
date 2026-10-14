import { expect, test, type Page } from '@playwright/test';
import { readSave } from '../packages/testing/src/e2e';

const CSV = ['front_text,back_text,front_lang,back_lang', 'Hund,dog,de,en', 'Katze,cat,de,en', 'Maus,mouse,de,en', 'Vogel,bird,de,en', 'Fisch,fish,de,en', 'Pferd,horse,de,en', 'Kuh,cow,de,en'].join('\n');
const WORDS = ['Hund', 'dog', 'Katze', 'cat', 'Maus', 'mouse', 'Vogel', 'bird', 'Fisch', 'fish', 'Pferd', 'horse', 'Kuh', 'cow'];

async function importCsv(page: Page, name: string, csv = CSV): Promise<string> {
  await page.goto('/decks');
  await page.getByTestId('import-deck').click();
  await expect(page).toHaveURL(/\/decks\/import$/);
  await page.getByTestId('deck-text').fill(csv);
  await page.getByTestId('deck-name').fill(name);
  await page.getByTestId('deck-check').click();
  await expect(page.getByTestId('deck-preview')).toBeVisible();
  await page.getByTestId('deck-save').click();
  await expect(page).toHaveURL(/\/decks\/user-[a-z0-9-]+$/);
  return new URL(page.url()).pathname.split('/').pop() as string;
}

test('import a CSV deck, find it in the library, play Memory with it and resume after a reload', async ({ page }) => {
  const id = await importCsv(page, 'Animals DE-EN');
  await expect(page.locator('h1')).toHaveText('Animals DE-EN');
  await expect(page.getByTestId('deck-count')).toHaveText('7 cards');
  await expect(page.getByTestId('deck-preview')).toContainText('Katze');

  await page.goto('/decks');
  await expect(page.getByTestId(`deck-card-${id}`)).toContainText('Animals DE-EN');
  await expect(page.getByTestId('builtin-decks')).toContainText('First words');
  await page.getByTestId(`deck-card-${id}`).click();

  await page.getByTestId(`play-own-${id}`).click();
  await expect(page).toHaveURL(/\/games\/memory$/);
  await expect(page.getByTestId('memory-cards')).toHaveValue(`own:${id}`);
  await expect(page.getByTestId('card-11')).toBeVisible(); // small board: 6 of the 7 cards → 12 cards
  await page.getByTestId('card-0').click();
  await expect(page.getByTestId('card-0')).toHaveAttribute('data-state', 'revealed');
  const word = (await page.getByTestId('card-0').textContent())?.trim();
  expect(WORDS).toContain(word);

  let before = '';
  await expect.poll(async () => {
    const save = (await readSave(page, 'memory')) as { state?: { revealed?: number[] } } | undefined;
    return save?.state?.revealed?.length ?? 0;
  }).toBe(1);
  before = JSON.stringify(((await readSave(page, 'memory')) as { state: unknown }).state);

  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('card-0')).toHaveAttribute('data-state', 'revealed');
  await expect(page.getByTestId('card-0')).toHaveText(word as string);
  const after = (await readSave(page, 'memory')) as { state: { variant: string; deckId: string } };
  expect(JSON.stringify(after.state)).toBe(before);
  expect(after.state).toMatchObject({ variant: 'own', deckId: id });
});

test('import shows translated row-level errors and strips remote images without contacting other servers', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://localhost')) remote.push(request.url());
  });
  await page.goto('/decks/import');
  await page.getByTestId('deck-text').fill('front_text,back_text\nok,fine\nmissing,\n');
  await page.getByTestId('deck-check').click();
  await expect(page.getByTestId('import-errors')).toContainText('Line 3 (card 2): The back is empty.');
  await expect(page.getByTestId('deck-save')).toHaveCount(0);

  await page.getByTestId('deck-text').fill('front_text,back_text,back_image\ncat,Katze,https://example.com/cat.png\ndog,Hund,\n');
  await page.getByTestId('deck-check').click();
  await expect(page.getByTestId('import-warnings')).toContainText('A link to another website was removed');
  await expect(page.getByTestId('deck-preview')).toBeVisible();
  await expect(page.locator('img[src^="http"]')).toHaveCount(0);
  expect(remote).toEqual([]);
});

test('Flags & countries in German shows German country names in the library and in Memory', async ({ page }) => {
  await page.goto('/settings');
  await page.getByTestId('ui-language').selectOption('de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.goto('/decks/flags');
  await expect(page.locator('h1')).toHaveText('Flaggen & Länder');
  await expect(page.getByTestId('deck-preview')).toContainText('Deutschland');
  await expect(page.getByTestId('deck-preview')).toContainText('Frankreich');
  await page.getByTestId('play-flag-country').click();
  await expect(page).toHaveURL(/\/games\/memory$/);
  await expect(page.getByTestId('memory-languages')).toHaveText('Ländernamen auf Deutsch');
  const state = await expect
    .poll(async () => ((await readSave(page, 'memory')) as { state?: { variant?: string } } | undefined)?.state?.variant)
    .toBe('flag-country');
  void state;
  const save = (await readSave(page, 'memory')) as { state: { cards: { item: string; side: string }[] } };
  const back = save.state.cards.findIndex((c) => c.side === 'back');
  await page.getByTestId(`card-${back}`).click();
  const code = save.state.cards[back]?.item.toUpperCase() as string;
  const expected = await page.evaluate((c) => new Intl.DisplayNames(['de'], { type: 'region' }).of(c), code);
  await expect(page.getByTestId(`card-${back}`)).toHaveText(expected as string);
});

test('deleting an own deck: confirmed, gone from the library, a saved game explains it', async ({ page }) => {
  const id = await importCsv(page, 'Short-lived');
  await page.getByTestId(`play-own-${id}`).click();
  await page.getByTestId('card-0').click();
  await expect.poll(async () => ((await readSave(page, 'memory')) as { state?: { deckId?: string } } | undefined)?.state?.deckId).toBe(id);

  await page.goto(`/decks/${id}`);
  page.once('dialog', (dialog) => void dialog.dismiss());
  await page.getByTestId('delete-deck').click();
  await expect(page).toHaveURL(new RegExp(`/decks/${id}$`)); // cancelled: nothing happens
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('delete-deck').click();
  await expect(page).toHaveURL(/\/decks$/);
  await expect(page.getByTestId('own-decks-empty')).toBeVisible();
  await expect(page.getByTestId(`deck-card-${id}`)).toHaveCount(0);

  await page.goto(`/decks/${id}`);
  await expect(page.getByTestId('deck-not-found')).toBeVisible();

  await page.goto('/games/memory');
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('memory-missing')).toBeVisible();
  await page.getByTestId('memory-missing-new').click();
  await expect(page.getByTestId('memory-missing')).toBeHidden();
  await expect(page.getByTestId('card-0')).toBeVisible();
  await expect(page.getByTestId('memory-cards')).toHaveValue('symbols');
});

test('"Delete all saved games" keeps decks; "Delete my imported decks" removes them after confirmation', async ({ page }) => {
  const id = await importCsv(page, 'Keep me');
  await page.goto('/games/memory');
  await page.getByTestId('new-game').click();
  await expect.poll(() => readSave(page, 'memory')).toBeTruthy();

  await page.goto('/settings');
  await expect(page.getByTestId('decks-info')).toContainText('1');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('clear-saves').click();
  await expect.poll(() => readSave(page, 'memory')).toBeFalsy();
  await expect(page.getByTestId('decks-info')).toContainText('1');
  await page.goto('/decks');
  await expect(page.getByTestId(`deck-card-${id}`)).toBeVisible();

  await page.goto('/settings');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('clear-decks').click();
  await expect(page.getByTestId('decks-info')).toContainText('0');
  await expect(page.getByTestId('clear-decks')).toBeDisabled();
  await page.goto('/decks');
  await expect(page.getByTestId('own-decks-empty')).toBeVisible();
});

test('picture ↔ word uses the learning language from Settings', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('#learning-language').selectOption('es');
  await page.goto('/games/memory');
  await page.getByTestId('new-game').click();
  await page.getByTestId('memory-cards').selectOption('picture-word');
  await expect(page.getByTestId('memory-languages')).toHaveText('Words in Spanish');
  const save = await expect.poll(async () => ((await readSave(page, 'memory')) as { state?: { variant?: string } } | undefined)?.state?.variant).toBe('picture-word');
  void save;
  const state = ((await readSave(page, 'memory')) as { state: { cards: { side: string }[]; languages: unknown } }).state;
  expect(state.languages).toEqual({ back: 'es' });
  const back = state.cards.findIndex((c) => c.side === 'back');
  await page.getByTestId(`card-${back}`).click();
  await expect(page.getByTestId(`card-${back}`).locator('[lang="es"]')).toBeVisible();
});

/** Raw learning records ("Items worth reviewing") from the app's IndexedDB. */
async function readLearning(page: Page): Promise<{ deckId: string; itemId: string; reviews: number; due: string }[]> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains('learning')) return resolve([]);
          const all = db.transaction('learning', 'readonly').objectStore('learning').getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      })
  );
}

async function rateCard(page: Page, rating: 'again' | 'hard' | 'good'): Promise<void> {
  await page.getByTestId('review-reveal').click();
  await expect(page.getByTestId('review-answer')).toBeVisible();
  await page.getByTestId(`review-rate-${rating}`).click();
}

test('Review: learn an imported deck, reload mid-session, resume at the same card, finish; the library counts it later; records can be deleted', async ({ page }) => {
  const id = await importCsv(page, 'Animals to review');
  await page.getByTestId('review-deck').click();
  await expect(page).toHaveURL(/\/games\/review$/);
  await expect(page.getByTestId('review-deck')).toHaveValue(id);
  // Nothing rated yet: nothing is due, new cards are offered.
  await expect(page.getByTestId('review-empty')).toContainText('Nothing to review right now');
  await page.getByTestId('review-learn-new').click();
  await expect(page.getByTestId('review-progress')).toHaveText('Card 1 of 7');

  await rateCard(page, 'good');
  await rateCard(page, 'good');
  await page.getByTestId('review-typed').fill('something');
  await rateCard(page, 'good');
  await expect(page.getByTestId('review-progress')).toHaveText('Card 4 of 7');
  const prompt = await page.getByTestId('review-prompt').textContent();
  await expect.poll(async () => ((await readSave(page, 'review')) as { state?: { index?: number } } | undefined)?.state?.index).toBe(3);
  await expect.poll(async () => (await readLearning(page)).length).toBe(3);

  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('review-progress')).toHaveText('Card 4 of 7');
  await expect(page.getByTestId('review-prompt')).toHaveText(prompt as string);
  // The resume does not count the first three cards again.
  expect((await readLearning(page)).map((r) => r.reviews)).toEqual([1, 1, 1]);

  for (let i = 0; i < 4; i++) await rateCard(page, 'good');
  await expect(page.getByTestId('review-summary-counts')).toHaveText('7 cards: Knew it 7 · Almost 0 · Not yet 0');
  await expect(page.getByTestId('finished')).toBeVisible();
  await expect.poll(async () => (await readLearning(page)).length).toBe(7);
  expect((await readLearning(page)).every((r) => r.reviews === 1 && r.deckId === id)).toBe(true);

  // Today nothing is due yet; three days later all seven cards are worth reviewing (no reminder was sent meanwhile).
  await page.goto('/decks');
  await expect(page.getByTestId('review-none')).toBeVisible();
  await page.clock.setFixedTime(new Date(Date.now() + 3 * 86_400_000));
  await page.goto('/decks');
  await expect(page.getByTestId(`review-item-${id}`)).toContainText('7 worth reviewing');
  await expect(page.getByTestId(`deck-card-${id}`).getByTestId('deck-due')).toHaveText('7 worth reviewing');
  await page.getByTestId(`review-${id}`).click();
  await expect(page).toHaveURL(/\/games\/review$/);
  await expect(page.getByTestId('review-progress')).toHaveText('Card 1 of 7');
  await expect(page.getByTestId('review-mode')).toHaveValue('review');

  await page.goto('/settings');
  await expect(page.getByTestId('learning-info')).toHaveText('Learning records on this device: 7');
  page.once('dialog', (dialog) => void dialog.dismiss());
  await page.getByTestId('clear-learning').click();
  await expect(page.getByTestId('learning-info')).toHaveText('Learning records on this device: 7');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByTestId('clear-learning').click();
  await expect(page.getByTestId('learning-info')).toHaveText('Learning records on this device: 0');
  await expect(page.getByTestId('clear-learning')).toBeDisabled();
  expect(await readLearning(page)).toEqual([]);
  // Decks are kept.
  await page.goto('/decks');
  await expect(page.getByTestId(`deck-card-${id}`)).toBeVisible();
  await expect(page.getByTestId('review-none')).toBeVisible();
});
