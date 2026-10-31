import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// "Create with an AI" (guide link) and the direct link `/decks/import#deck=<base64url(JSON)>` (docs/content/deck-format.md).

const DECK = {
  schemaVersion: 1,
  id: 'fruit-es-en',
  title: { en: 'Fruit in Spanish', es: 'Frutas en español' },
  items: [
    { id: 'apple', front: { text: 'la manzana', lang: 'es', symbol: '🍎' }, back: { text: 'apple', lang: 'en' } },
    { id: 'pear', front: { text: 'la pera', lang: 'es', symbol: '🍐' }, back: { text: 'pear', lang: 'en' } },
    { id: 'lemon', front: { text: 'el limón', lang: 'es' }, back: { text: 'lemon', lang: 'en' }, tags: ['fruit'], difficulty: 3 }
  ]
};
const linkData = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

async function exported(page: Page): Promise<{ id: string } & Record<string, unknown>> {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export-deck').click()]);
  return JSON.parse(await readFile((await download.path()) as string, 'utf8')) as { id: string };
}

test('direct link: opens the preview, nothing is saved before confirming, then the deck is in the library', async ({ page }) => {
  const data = linkData(DECK);
  const sent: string[] = [];
  page.on('request', (request) => sent.push(request.url()));
  await page.goto(`/decks/import#deck=${data}`);
  await expect(page.getByTestId('import-from-link')).toBeVisible();
  await expect(page.getByTestId('deck-preview')).toContainText('la manzana');
  await expect(page.getByTestId('deck-preview')).toContainText('lemon');
  // The deck never left the device and does not linger in the address bar.
  expect(new URL(page.url()).hash).toBe('');
  expect(sent.filter((url) => url.includes(data.slice(0, 40)))).toEqual([]);

  // Not saved yet: the library is still empty.
  await page.goto('/decks');
  await expect(page.getByTestId('own-decks-empty')).toBeVisible();

  await page.goto(`/decks/import#deck=${data}`);
  await page.getByTestId('deck-save').click();
  await expect(page).toHaveURL(/\/decks\/user-[a-z0-9-]+$/);
  await expect(page.locator('h1')).toHaveText('Fruit in Spanish');
  await expect(page.getByTestId('deck-count')).toHaveText('3 cards');
  await page.goto('/decks');
  await expect(page.getByTestId('own-decks')).toContainText('Fruit in Spanish');
});

test('direct link: a cut-off link explains itself and suggests a JSON file', async ({ page }) => {
  await page.goto(`/decks/import#deck=${linkData(DECK).slice(0, 41)}`);
  await expect(page.getByTestId('import-link-error')).toContainText('JSON file');
  await expect(page.getByTestId('deck-save')).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe('');
});

test('copy the guide link: the guide is served as Markdown in the UI language', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/decks/import');
  const origin = new URL(page.url()).origin;
  await expect(page.getByTestId('ai-guide-url')).toHaveValue(`${origin}/ai/deck-guide.en.md`);
  await page.getByTestId('ai-guide-copy').click();
  await expect(page.getByTestId('ai-guide-status')).toHaveText('Link copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${origin}/ai/deck-guide.en.md`);

  const response = await page.request.get(`${origin}/ai/deck-guide.en.md`);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('text/markdown');
  expect(await response.text()).toContain('/decks/import#deck=<DATA>');

  // Another UI language: the guide link follows it.
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByTestId('ai-guide-url')).toHaveValue(`${origin}/ai/deck-guide.de.md`);
  await expect(page.getByTestId('ai-guide')).toContainText('Mit einer KI erstellen');
  expect(await (await page.request.get(`${origin}/ai/deck-guide.de.md`)).text()).toContain('# Anleitung für KIs');
});

test('the AI section fits narrow screens and right-to-left languages, with 44 px targets', async ({ page }) => {
  await page.goto('/decks/import');
  await page.getByTestId('language-menu').locator('summary').click();
  await page.getByTestId('header-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('ai-guide-url')).toHaveValue(/\/ai\/deck-guide\.ar\.md$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  for (const id of ['ai-guide-copy', 'ai-guide-url', 'ai-guide-open']) {
    const box = await page.getByTestId(id).boundingBox();
    expect(box?.height, id).toBeGreaterThanOrEqual(44);
  }
  await page.getByTestId('ai-guide-copy').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('ai-guide-status')).not.toBeEmpty();
});

test('the guide opens as a file, not as the app, also once the service worker controls the page', async ({ page }) => {
  await page.goto('/decks/import');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.goto('/ai/deck-guide.fr.md');
  await expect(page.locator('body')).toContainText('# Guide pour les IA');
  await expect(page.locator('#app')).toHaveCount(0);
});

test('save and upload manually: an exported deck re-imports identically from its file', async ({ page }) => {
  await page.goto(`/decks/import#deck=${linkData(DECK)}`);
  await page.getByTestId('deck-save').click();
  await expect(page).toHaveURL(/\/decks\/user-[a-z0-9-]+$/);
  const first = await exported(page);

  await page.goto('/decks/import');
  await page.getByTestId('deck-file').setInputFiles({ name: 'fruit.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(first, null, 2)) });
  await expect(page.getByTestId('deck-preview')).toContainText('la pera');
  await page.getByTestId('deck-save').click();
  await expect(page).toHaveURL(/\/decks\/user-[a-z0-9-]+$/);
  const second = await exported(page);
  expect(second.id).not.toBe(first.id);
  expect({ ...second, id: '' }).toEqual({ ...first, id: '' });

  // A CSV file works the same way.
  await page.goto('/decks/import');
  await page.getByTestId('deck-file').setInputFiles({ name: 'Pets.csv', mimeType: 'text/csv', buffer: Buffer.from('front_text,back_text,front_lang,back_lang\nHund,dog,de,en\nKatze,cat,de,en\n') });
  await expect(page.getByTestId('deck-preview')).toContainText('Katze');
  await page.getByTestId('deck-save').click();
  await expect(page.locator('h1')).toHaveText('Pets');
  await page.goto('/decks');
  await expect(page.getByTestId('own-decks').locator('li')).toHaveCount(3);
});
