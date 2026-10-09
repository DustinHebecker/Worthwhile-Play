// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameModule, UserDeckSource } from '@wp/game-core';
import { applyReview, builtinItemIds, countryName, createLearningRecords, type Deck, type LearningRecord, type Speech } from '@wp/learning-content';
import { createTestContext, type TestContextExtras } from '@wp/testing';
import game from '../src/index';
import { isValidReviewState, type ReviewState } from '../src/rules';
import { createReview, DECK_PREFERENCE, DIRECTION_PREFERENCE } from '../src/view';

const TODAY = '2026-03-10';
const OWN: Deck = {
  schemaVersion: 1,
  id: 'user-animals-ab12',
  title: { en: 'Animals' },
  items: [
    { id: 'dog', front: { text: 'Hund', lang: 'de' }, back: { text: 'dog', lang: 'en' } },
    { id: 'cat', front: { text: 'Katze', lang: 'de' }, back: { text: 'cat', lang: 'en' } },
    { id: 'bird', front: { text: 'Vogel', lang: 'de' }, back: { text: 'bird; fowl', lang: 'en' } }
  ]
};
const decks = (...list: Deck[]): UserDeckSource => ({
  list: () => list.map((d) => ({ id: d.id, title: d.title, itemCount: d.items.length })),
  get: (id) => list.find((d) => d.id === id)
});

let cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup.forEach((f) => f());
  cleanup = [];
  document.body.innerHTML = '';
});

function setup(options: { extras?: TestContextExtras; prefs?: Record<string, unknown>; seed?: number; locale?: 'en' | 'ar' | 'de'; speech?: Speech } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en', undefined, options.extras ?? {});
  for (const [key, value] of Object.entries(options.prefs ?? {})) ctx.preferences.set(key, value);
  const instance = createReview(ctx.context, options.speech);
  cleanup.push(() => instance.dispose());
  instance.newGame({ seed: options.seed ?? 11 });
  const root = ctx.context.root;
  const q = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`)!;
  const click = (id: string) => q(id).click();
  const reveal = (typed?: string) => {
    if (typed !== undefined) q<HTMLInputElement>('review-typed').value = typed;
    q<HTMLFormElement>('review-reveal').closest('form')!.requestSubmit();
  };
  return { ctx, instance, root, q, click, reveal };
}

const learningWith = (records: LearningRecord[] = [], persisted: LearningRecord[][] = []) => createLearningRecords(records, { today: () => TODAY, persist: (c) => persisted.push(c) });
const dueRecord = (deckId: string, itemId: string, direction: 'forward' | 'backward' = 'forward') =>
  applyReview(undefined, { deckId, itemId, direction, rating: 'hard', session: 'old', day: '2026-03-01' }) as LearningRecord;

describe('Review view', () => {
  it('without learning records it is practice only and says so', () => {
    const { q, instance } = setup();
    expect(q('review-practice-only').hidden).toBe(false);
    expect(q('review-mode').closest('div')!.hidden).toBe(true);
    const state = instance.serialize();
    expect(state).toMatchObject({ mode: 'practice', session: '', deckId: 'first-words' });
    expect(state.cards).toHaveLength(10);
  });

  it('nothing due: says so plainly, offers new cards or practice; learning new cards writes records once', () => {
    const persisted: LearningRecord[][] = [];
    const learning = learningWith([], persisted);
    const { q, click, reveal, instance, ctx } = setup({ extras: { learning } });
    expect(q('review-empty').hidden).toBe(false);
    expect(q('review-session').hidden).toBe(true);
    expect(q('review-learn-new').textContent).toBe('Learn new cards (60)');
    expect(q<HTMLSelectElement>('review-mode').value).toBe('review');
    expect(q('review-empty').hasAttribute('data-autofocus') || q('review-empty').querySelector('[data-autofocus]')).toBeTruthy();

    click('review-learn-new');
    expect(instance.serialize()).toMatchObject({ mode: 'new', index: 0 });
    expect(q('review-progress').textContent).toBe('Card 1 of 10');
    expect(q('review-answer').hidden).toBe(true);
    expect(q('review-answer').textContent).toBe('');
    reveal('wrong');
    expect(q('review-answer').hidden).toBe(false);
    expect(q('review-typed-result').textContent).toContain('Your answer: wrong');
    expect(q('review-typed-result').textContent).toContain('Differs from the card.');
    click('review-rate-good');
    expect(persisted).toHaveLength(1);
    expect(persisted[0]![0]).toMatchObject({ deckId: 'first-words:en', box: 2, due: '2026-03-12', reviews: 1 });
    expect(q('review-progress').textContent).toBe('Card 2 of 10');
    expect(ctx.saveRequests()).toBeGreaterThanOrEqual(3);
    expect(q<HTMLSelectElement>('review-mode').selectedOptions[0]!.textContent).toBe('Not seen yet (59)');
  });

  it('plays a full session, appends one repetition for "Not yet", calls finished once and shows a neutral summary', () => {
    const records = (builtinItemIds('flags') ?? []).slice(0, 3).map((id) => dueRecord('flags', id));
    const learning = learningWith(records);
    const { q, click, reveal, ctx, instance } = setup({ extras: { learning }, prefs: { [DECK_PREFERENCE]: 'flags' } });
    expect(instance.serialize().cards).toHaveLength(3);
    expect(q<HTMLSelectElement>('review-mode').selectedOptions[0]!.textContent).toBe('Worth reviewing (3)');
    for (const rating of ['again', 'good', 'hard']) {
      reveal();
      click(`review-rate-${rating}`);
    }
    expect(q('review-repeat').textContent).toBe('Once more');
    expect(q('review-progress').textContent).toContain('Card 4 of 4');
    reveal();
    click('review-rate-good');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { cards: 3, good: 1, hard: 1, again: 1 } }]);
    expect(q('review-summary').hidden).toBe(false);
    expect(q('review-summary-counts').textContent).toBe('3 cards: Knew it 1 · Almost 1 · Not yet 1');
    expect(q('review-summary').textContent).toContain('saved on this device');
    expect(learning.list('flags').map((r) => r.reviews)).toEqual([2, 2, 2]);
    // Restoring the finished session does not finish again or count again.
    const state = instance.serialize();
    const again = setup({ extras: { learning } });
    again.instance.restore(state);
    expect(again.ctx.results).toEqual([]);
    expect(learning.list('flags').map((r) => r.reviews)).toEqual([2, 2, 2]);
  });

  it('resumes at the same card after a reload and never double-counts, even if the page closed before a record was written', () => {
    const records = (builtinItemIds('first-words') ?? []).slice(0, 5).map((id) => dueRecord('first-words:en', id));
    const persisted: LearningRecord[][] = [];
    const learning = learningWith(records, persisted);
    const first = setup({ extras: { learning } });
    for (let i = 0; i < 3; i++) {
      first.reveal();
      first.click('review-rate-good');
    }
    first.reveal('half typed');
    const saved = JSON.parse(JSON.stringify(first.instance.serialize())) as ReviewState;
    expect(isValidReviewState(saved)).toBe(true);
    const prompt = first.q('review-prompt').textContent;
    first.instance.dispose();
    expect(persisted.flat()).toHaveLength(3);

    // Reload with the same records: the resumed session shows the same card, revealed, and counts nothing again.
    const second = setup({ extras: { learning } });
    second.instance.restore(saved);
    expect(second.instance.serialize()).toEqual(saved);
    expect(second.q('review-progress').textContent).toBe('Card 4 of 5');
    expect(second.q('review-prompt').textContent).toBe(prompt);
    expect(second.q('review-answer').hidden).toBe(false);
    expect(second.q('review-typed-result').textContent).toContain('half typed');
    expect(persisted.flat()).toHaveLength(3);
    expect(learning.list('first-words:en').filter((r) => r.reviews === 2)).toHaveLength(3);

    // Reload where the last write was lost: the resume completes it, exactly once.
    const lost = learningWith(records);
    lost.record(createLearningRecordsReviews(saved).slice(0, 2));
    const third = setup({ extras: { learning: lost } });
    third.instance.restore(saved);
    expect(lost.list('first-words:en').filter((r) => r.reviews === 2)).toHaveLength(3);
    third.instance.restore(saved);
    expect(lost.list('first-words:en').filter((r) => r.reviews === 2)).toHaveLength(3);
  });

  it('flags: the question never reveals the country; the answer is not in the DOM before revealing', () => {
    const { q, reveal, instance } = setup({ extras: { learning: learningWith(), contentLanguages: { learning: 'de' } }, prefs: { [DECK_PREFERENCE]: 'flags' } });
    // nothing due → practise anyway
    q('review-practice').click();
    const state = instance.serialize();
    expect(state).toMatchObject({ mode: 'practice', deckId: 'flags', languages: { countries: 'de' } });
    const code = state.cards[0]!.item.toUpperCase();
    const name = countryName(code, 'de');
    expect(q('review-prompt').querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Flag');
    expect(q('review-session').textContent).not.toContain(name);
    expect(q('review-typed').closest('.wp-review__typed')!.hasAttribute('hidden')).toBe(false);
    reveal(name.toLowerCase());
    expect(q('review-answer').textContent).toContain(name);
    expect(q('review-typed-result').textContent).toContain('Matches the card.');
    expect(q('review-languages').textContent).toBe('Country names in German');
  });

  it('first words: the picture is shown with the answer only; backward asks for the word in the learning language', () => {
    const { q, reveal, instance, root } = setup({ extras: { contentLanguages: { learning: 'es', translation: 'en' } }, prefs: { [DIRECTION_PREFERENCE]: 'backward' } });
    const state = instance.serialize();
    expect(state).toMatchObject({ direction: 'backward', languages: { learning: 'es', translation: 'en' } });
    expect(q('review-prompt').querySelector('[role="img"]')).toBeNull();
    expect(q('review-prompt').querySelector('[lang]')!.getAttribute('lang')).toBe('en');
    reveal();
    expect(q('review-answer').querySelector('[role="img"]')).not.toBeNull();
    expect(q('review-answer').querySelector('[lang]')!.getAttribute('lang')).toBe('es');
    expect(root.querySelector('[data-testid="review-languages"]')!.textContent).toBe('Words in Spanish, translations in English');
  });

  it('own decks: chosen in the menu, remembered, and resolved from the host snapshot; a deleted deck is explained', () => {
    const userDecks = decks(OWN);
    const { q, instance, ctx, reveal } = setup({ extras: { userDecks, learning: learningWith() } });
    const select = q<HTMLSelectElement>('review-deck');
    expect([...select.options].map((o) => o.value)).toEqual(['first-words', 'flags', OWN.id]);
    select.value = OWN.id;
    select.dispatchEvent(new Event('change'));
    expect(ctx.preferences.get(DECK_PREFERENCE)).toBe(OWN.id);
    expect(instance.serialize()).toMatchObject({ deckId: OWN.id, mode: 'review', cards: [] });
    q('review-learn-new').click();
    expect(instance.serialize().cards).toHaveLength(3);
    reveal('fowl');
    const saved = instance.serialize();

    const gone = setup({ extras: { userDecks: decks(), learning: learningWith() } });
    gone.instance.restore(saved);
    expect(gone.q('review-missing').hidden).toBe(false);
    expect(gone.q('review-session').hidden).toBe(true);
    gone.q('review-missing-new').click();
    expect(gone.instance.serialize()).toMatchObject({ deckId: 'first-words' });
    expect(gone.ctx.preferences.get(DECK_PREFERENCE)).toBe('first-words');
    // A remembered deck that is gone falls back to First words.
    const fallback = setup({ extras: { userDecks: decks() }, prefs: { [DECK_PREFERENCE]: OWN.id } });
    expect(fallback.instance.serialize().deckId).toBe('first-words');
  });

  it('a link with ?deck= opens that deck once and remembers it', () => {
    const { instance, ctx } = setup({ extras: { userDecks: decks(OWN), launch: { deck: OWN.id } } });
    expect(instance.serialize().deckId).toBe(OWN.id);
    expect(ctx.preferences.get(DECK_PREFERENCE)).toBe(OWN.id);
    ctx.preferences.set(DECK_PREFERENCE, 'flags');
    instance.newGame({ seed: 2 });
    expect(instance.serialize().deckId).toBe('flags');
    const unknown = setup({ extras: { launch: { deck: 'user-missing-1' } } });
    expect(unknown.instance.serialize().deckId).toBe('first-words');
  });

  it('direction and mode menus start a new session; direction is remembered', () => {
    const records = (builtinItemIds('first-words') ?? []).slice(0, 2).map((id) => dueRecord('first-words:en', id, 'backward'));
    const { q, instance, ctx } = setup({ extras: { learning: learningWith(records) } });
    // Nothing due front → back, but two cards back → front: a new session reviews both directions.
    expect(instance.serialize()).toMatchObject({ direction: 'mixed', mode: 'review' });
    expect(instance.serialize().cards).toHaveLength(2);
    expect(ctx.preferences.get(DIRECTION_PREFERENCE)).toBeUndefined();
    const direction = q<HTMLSelectElement>('review-direction');
    direction.value = 'forward';
    direction.dispatchEvent(new Event('change'));
    expect(instance.serialize()).toMatchObject({ direction: 'forward', cards: [] });
    direction.value = 'backward';
    direction.dispatchEvent(new Event('change'));
    expect(ctx.preferences.get(DIRECTION_PREFERENCE)).toBe('backward');
    expect(instance.serialize()).toMatchObject({ direction: 'backward', mode: 'review' });
    expect(instance.serialize().cards).toHaveLength(2);
    const mode = q<HTMLSelectElement>('review-mode');
    mode.value = 'practice';
    mode.dispatchEvent(new Event('change'));
    expect(instance.serialize()).toMatchObject({ mode: 'practice', session: '' });
  });

  it('pause blocks input; reset restarts the same session without recording again', () => {
    const records = (builtinItemIds('flags') ?? []).slice(0, 2).map((id) => dueRecord('flags', id));
    const persisted: LearningRecord[][] = [];
    const learning = learningWith(records, persisted);
    const { reveal, click, instance } = setup({ extras: { learning }, prefs: { [DECK_PREFERENCE]: 'flags' } });
    const initial = instance.serialize();
    instance.pause();
    reveal();
    expect(instance.serialize()).toEqual(initial);
    instance.resume();
    reveal();
    click('review-rate-good');
    expect(persisted).toHaveLength(1);
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    reveal();
    click('review-rate-again');
    expect(persisted).toHaveLength(1); // same session: the record keeps the first rating
  });

  it('works right-to-left in Arabic and reads aloud only on request', () => {
    const spoken: string[] = [];
    const speech: Speech = { canSpeak: (lang) => lang.startsWith('en'), speak: (text, lang) => void spoken.push(`${lang}:${text}`), onVoicesChanged: () => () => undefined };
    const { root, q, reveal } = setup({ locale: 'ar', speech, extras: { userDecks: decks(OWN) }, prefs: { [DECK_PREFERENCE]: OWN.id } });
    expect(root.querySelector('.wp-review')!.getAttribute('dir')).toBe('rtl');
    expect(q('review-reveal').textContent).toBe('إظهار الإجابة');
    expect(q('review-speak').hidden).toBe(true); // German prompt, no German voice
    reveal();
    expect(q('review-speak').hidden).toBe(false);
    expect(spoken).toEqual([]);
    q('review-speak').click();
    expect(spoken).toHaveLength(1);
    expect(spoken[0]).toMatch(/^en:/);
  });

  it('survives a learning capability that throws', () => {
    const broken = { today: () => { throw new Error('x'); }, list: () => { throw new Error('x'); }, record: () => { throw new Error('x'); } };
    const { instance, q } = setup({ extras: { learning: broken } });
    expect(instance.serialize().mode).toBe('practice');
    expect(q('review-session').hidden).toBe(false);
  });
});

/** The reviews a saved state would send (helper using the public rules). */
function createLearningRecordsReviews(state: ReviewState) {
  return state.answers.map((answer, i) => ({ deckId: 'first-words:en', itemId: state.cards[i]!.item, direction: state.cards[i]!.dir, rating: answer.rating, session: state.session, day: answer.day }));
}
