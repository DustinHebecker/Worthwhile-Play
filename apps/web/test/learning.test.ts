// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTranslator } from '@wp/localization';
import { createMemoryDeckStore, createMemoryLearningStore, createMemoryStore, type LearningStore } from '@wp/persistence';
import type { AppContext } from '../src/app';
import { UI_MESSAGES } from '../src/i18n/ui';
import { hostLearning, loadLearningRecords, removeUserDeckRecords } from '../src/lib/learning';
import { renderSettings } from '../src/pages/settings';

vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});

const flush = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};
const review = (itemId: string, session = 's1', deckId = 'flags') => ({ deckId, itemId, direction: 'forward' as const, rating: 'good' as const, session, day: '2026-03-10' });

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('host learning records', () => {
  it('applies ratings idempotently, writes changes in order and can be flushed', async () => {
    const store = createMemoryLearningStore();
    const learning = hostLearning([], store, () => '2026-03-10');
    expect(learning.today()).toBe('2026-03-10');
    learning.record([review('de'), review('fr')]);
    learning.record([review('de')]); // resumed session: ignored
    learning.record([review('de', 's2')]);
    await learning.flush();
    const stored = await loadLearningRecords(store);
    expect(stored.map((r) => [r.itemId, r.reviews, r.box])).toEqual([
      ['de', 2, 3],
      ['fr', 1, 2]
    ]);
    expect(learning.list('flags')).toHaveLength(2);
    // A fresh page load continues from the stored records.
    const reloaded = hostLearning(stored, store, () => '2026-03-12');
    reloaded.record([review('de', 's2')]);
    await reloaded.flush();
    expect((await loadLearningRecords(store)).find((r) => r.itemId === 'de')?.reviews).toBe(2);
  });

  it('keeps working when the store fails, and skips unreadable stored records', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken: LearningStore = { ...createMemoryLearningStore(), putMany: () => Promise.reject(new Error('quota')) };
    const learning = hostLearning([], broken, () => '2026-03-10');
    learning.record([review('de')]);
    await learning.flush();
    expect(error).toHaveBeenCalled();
    expect(learning.list('flags')).toHaveLength(1);
    const store = createMemoryLearningStore();
    await store.putMany([{ deckId: 'flags', itemId: 'x', direction: 'forward' }]);
    expect(await loadLearningRecords(store)).toEqual([]);
    expect(await loadLearningRecords(Promise.reject(new Error('no')))).toEqual([]);
  });

  it('removes the records of imported decks only', async () => {
    const store = createMemoryLearningStore();
    const learning = hostLearning([], store, () => '2026-03-10');
    learning.record([review('a', 's', 'user-x-1'), review('b', 's', 'user-y-2'), review('de')]);
    await learning.flush();
    await removeUserDeckRecords(store);
    expect((await loadLearningRecords(store)).map((r) => r.deckId)).toEqual(['flags']);
  });
});

describe('settings: delete learning records', () => {
  it('shows the count and deletes only after confirmation, separately from saves and decks', async () => {
    const learningStore = createMemoryLearningStore();
    const learning = hostLearning([], learningStore, () => '2026-03-10');
    learning.record([review('de'), review('fr')]);
    await learning.flush();
    const decks = createMemoryDeckStore();
    await decks.put({ id: 'user-keep-1' });
    const context: AppContext = {
      locale: 'en',
      t: createTranslator({ locale: 'en', sources: [UI_MESSAGES] }) as AppContext['t'],
      store: Promise.resolve(Object.assign(createMemoryStore(), { persistent: true })),
      decks: Promise.resolve(decks),
      learning: Promise.resolve(learningStore),
      navigate: vi.fn(),
      setLocale: vi.fn(),
      announce: vi.fn()
    };
    const main = document.createElement('main');
    document.body.append(main);
    renderSettings(main, context);
    await flush();
    const info = main.querySelector('[data-testid="learning-info"]');
    const button = main.querySelector<HTMLButtonElement>('[data-testid="clear-learning"]')!;
    expect(info?.textContent).toBe('Learning records on this device: 2');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    button.click();
    await flush();
    expect(await learningStore.list()).toHaveLength(2);
    button.click();
    await flush();
    expect(confirm).toHaveBeenLastCalledWith('Delete all learning records (the review schedule) on this device? Decks and saved games are not affected. This cannot be undone.');
    expect(await learningStore.list()).toEqual([]);
    expect(info?.textContent).toBe('Learning records on this device: 0');
    expect(button.disabled).toBe(true);
    expect(context.announce).toHaveBeenCalledWith('Learning records deleted.');
    expect(await decks.list()).toHaveLength(1);
  });
});
