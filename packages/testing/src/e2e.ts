import { expect, type Page } from '@playwright/test';

/** Choices for the host's start screen (ADR 0017): the difficulty and declared settings by id. */
export interface StartOptions {
  difficulty?: string;
  settings?: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Sets one control of the start screen by its test id (`difficulty` or `setting-<id>`): a radio group (fieldset),
 * a select, a checkbox or a number input.
 */
export async function chooseSetting(page: Page, testId: string, value: string | number | boolean): Promise<void> {
  const control = page.getByTestId(testId);
  const kind = await control.evaluate((el) => (el instanceof HTMLInputElement ? el.type : el.tagName.toLowerCase()));
  if (kind === 'select') await control.selectOption(String(value));
  else if (kind === 'checkbox') await control.setChecked(value === true);
  else if (kind === 'number') await control.fill(String(value));
  else await control.locator(`input[value="${String(value)}"]`).check();
}

/** On the start screen: applies `options` and presses Start; resolves when the game is visible. */
export async function submitStart(page: Page, options: StartOptions = {}): Promise<void> {
  await expect(page.getByTestId('start-game')).toBeVisible();
  if (options.difficulty !== undefined) await chooseSetting(page, 'difficulty', options.difficulty);
  for (const [id, value] of Object.entries(options.settings ?? {})) await chooseSetting(page, `setting-${id}`, value);
  await page.getByTestId('start-game').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
}

/**
 * Opens `/games/<id>` (plus `query`, e.g. `?deck=flags`) and starts a new game through the start screen with
 * `options`, also when a save exists (the save is replaced). A game whose own setup is its first screen
 * (ADR 0015) starts by itself when there is no save; it takes no options then.
 */
export async function startGame(page: Page, gameId: string, options: StartOptions & { query?: string } = {}): Promise<void> {
  const { query = '', ...choices } = options;
  await page.goto(`/games/${gameId}${query}`);
  const start = page.getByTestId('start-game');
  await expect(start.or(page.locator('[data-testid="game-root"]:not([hidden])')).first()).toBeVisible();
  if (await start.isVisible()) await submitStart(page, choices);
  else if (choices.difficulty !== undefined || choices.settings) throw new Error(`${gameId} started without a start screen; it takes no start options`);
  await expect(page.getByTestId('game-root')).toBeVisible();
}

/** During play (or on the finished screen): "New game" → start screen → Start with `options`. */
export async function newGame(page: Page, options: StartOptions = {}): Promise<void> {
  await page.getByTestId('new-game').click();
  await submitStart(page, options);
}

/** Reads the raw persisted save for a game from the app's IndexedDB. */
export async function readSave(page: Page, gameId: string): Promise<unknown> {
  return page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          // Never hold the database open: the app's own (upgrading) open would be blocked by this connection.
          db.onversionchange = () => db.close();
          if (!db.objectStoreNames.contains('saves')) {
            db.close();
            return resolve(undefined);
          }
          const get = db.transaction('saves', 'readonly').objectStore('saves').get(id);
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
          get.onerror = () => {
            db.close();
            reject(get.error);
          };
        };
      }),
    gameId
  );
}

/** Raw library rows (ADR 0012) of one game, e.g. a game's saved maps, from the app's IndexedDB (sorted by id). */
export async function readLibrary(page: Page, gameId: string): Promise<{ gameId: string; id: string; name: string; updatedAt: string; size: number; data: unknown }[]> {
  return page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('worthwhile-play');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          db.onversionchange = () => db.close();
          if (!db.objectStoreNames.contains('library')) {
            db.close();
            return resolve([]);
          }
          const all = db.transaction('library', 'readonly').objectStore('library').index('byGame').getAll(id);
          all.onsuccess = () => {
            db.close();
            resolve(all.result);
          };
          all.onerror = () => {
            db.close();
            reject(all.error);
          };
        };
      }),
    gameId
  );
}

/**
 * Universal resume contract (spec: "every game must be closable at any time and resumable later").
 * Opens the game by direct URL, starts a new game through the start screen (with `options`), performs `act`,
 * reloads the page, continues, and asserts that the persisted logical state is unchanged.
 */
export async function expectResumeAfterReload(page: Page, gameId: string, act: (page: Page) => Promise<void>, options: StartOptions = {}): Promise<void> {
  await startGame(page, gameId, options);
  await act(page);
  // Wait until the autosave has caught up: the persisted state must be stable for a moment.
  let previous = '';
  await expect
    .poll(async () => {
      const current = JSON.stringify(((await readSave(page, gameId)) as { state?: unknown } | undefined)?.state ?? null);
      const stable = current !== 'null' && current === previous;
      previous = current;
      return stable;
    }, { intervals: [150] })
    .toBe(true);
  const before = ((await readSave(page, gameId)) as { state: unknown }).state;

  await page.reload();
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('game-root')).toBeVisible();
  const after = ((await readSave(page, gameId)) as { state: unknown }).state;
  expect(after).toEqual(before);
}
