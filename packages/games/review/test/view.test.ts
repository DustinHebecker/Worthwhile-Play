// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameModule, SettingValue, UserDeckSource } from '@wp/game-core';
import { aiTerm, applyReview, builtinItemIds, capitalName, countryName, createLearningRecords, type Deck, type LearningRecord, type Speech } from '@wp/learning-content';
import { createTestContext, type TestContextExtras } from '@wp/testing';
import game, { reviewSettings } from '../src/index';
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

function setup(options: { extras?: TestContextExtras; prefs?: Record<string, unknown>; settings?: Record<string, SettingValue>; seed?: number; locale?: 'en' | 'ar' | 'de'; speech?: Speech } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en', undefined, options.extras ?? {});
  for (const [key, value] of Object.entries(options.prefs ?? {})) ctx.preferences.set(key, value);
  const instance = createReview(ctx.context, options.speech);
  cleanup.push(() => instance.dispose());
  instance.newGame({ seed: options.seed ?? 11, ...(options.settings ? { settings: options.settings } : {}) });
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
    // Deck, direction and cards are chosen on the host's start screen only (ADR 0017).
    expect(q('review-deck')).toBeNull();
    expect(q('review-direction')).toBeNull();
    expect(q('review-mode')).toBeNull();
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
  });

  it('plays a full session, appends one repetition for "Not yet", calls finished once and shows a neutral summary', () => {
    const records = (builtinItemIds('flags') ?? []).slice(0, 3).map((id) => dueRecord('flags', id));
    const learning = learningWith(records);
    const { q, click, reveal, ctx, instance } = setup({ extras: { learning }, settings: { deck: 'flags' } });
    expect(instance.serialize().cards).toHaveLength(3);
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
    // Country names follow the UI language, not the learning language (Japanese here).
    const { q, reveal, instance } = setup({ locale: 'de', extras: { learning: learningWith(), contentLanguages: { learning: 'ja' } }, settings: { deck: 'flags' } });
    // nothing due → practise anyway
    q('review-practice').click();
    const state = instance.serialize();
    expect(state).toMatchObject({ mode: 'practice', deckId: 'flags', languages: { countries: 'de' } });
    const code = state.cards[0]!.item.toUpperCase();
    const name = countryName(code, 'de');
    expect(q('review-prompt').querySelector('[role="img"]')!.getAttribute('aria-label')).toBe('Flagge');
    expect(q('review-session').textContent).not.toContain(name);
    expect(q('review-typed').closest('.wp-review__typed')!.hasAttribute('hidden')).toBe(false);
    reveal(name.toLowerCase());
    expect(q('review-answer').textContent).toContain(name);
    expect(q('review-languages').textContent).toBe('Ländernamen auf Deutsch');
  });

  it('capitals: country → capital in the UI language (not the learning language); backward asks for the country', () => {
    const { q, reveal, instance } = setup({ extras: { learning: learningWith(), contentLanguages: { learning: 'it', translation: 'de' } }, settings: { deck: 'capitals', direction: 'forward' } });
    q('review-practice').click();
    const state = instance.serialize();
    expect(state).toMatchObject({ mode: 'practice', deckId: 'capitals', languages: { learning: 'en' }, direction: 'forward' });
    expect(isValidReviewState(JSON.parse(JSON.stringify(state)))).toBe(true);
    const code = state.cards[0]!.item.toUpperCase();
    const capital = capitalName(code, 'en')!;
    expect(q('review-prompt').textContent).toBe(countryName(code, 'en'));
    expect(q('review-prompt').querySelector('[lang]')!.getAttribute('lang')).toBe('en');
    expect(q('review-session').textContent).not.toContain(capital);
    reveal(capital.toUpperCase());
    expect(q('review-answer').textContent).toContain(capital);
    expect(q('review-typed-result').textContent).toContain('Matches the card.');
    expect(q('review-languages').textContent).toBe('Countries and capitals in English');

    const backward = setup({ locale: 'de', extras: { contentLanguages: { learning: 'ja' } }, settings: { deck: 'capitals', direction: 'backward' } });
    const s = backward.instance.serialize();
    const c = s.cards[0]!.item;
    expect(backward.q('review-prompt').textContent).toBe(capitalName(c, 'de'));
    backward.reveal();
    expect(backward.q('review-answer').textContent).toContain(countryName(c.toUpperCase(), 'de'));
  });

  it('capitals: a learning language without capital names needs no notice (the UI language is used anyway)', () => {
    const { q, instance } = setup({ locale: 'de', extras: { contentLanguages: { learning: 'sv' } }, settings: { deck: 'capitals' } });
    expect(instance.serialize()).toMatchObject({ deckId: 'capitals', languages: { learning: 'de' } });
    expect(q('review-notice').hidden).toBe(true);
    expect(q('review-languages').textContent).toBe('Länder und Hauptstädte auf Deutsch');
  });

  it('general-knowledge sessions saved in the learning language resume in the UI language; learning records keep their keys', () => {
    for (const deckId of ['capitals', 'ai-basics', 'flags'] as const) {
      const ids = (builtinItemIds(deckId) ?? []).slice(0, 2);
      const learning = learningWith([dueRecord(deckId, ids[0]!), dueRecord(deckId, ids[1]!)]);
      const first = setup({ locale: 'de', extras: { learning }, settings: { deck: deckId, direction: 'forward' } });
      // A save from before the fix recorded the learning language (Japanese).
      const saved: ReviewState = { ...first.instance.serialize(), languages: deckId === 'flags' ? { countries: 'ja' } : { learning: 'ja' } };
      expect(isValidReviewState(JSON.parse(JSON.stringify(saved)))).toBe(true);
      const later = setup({ locale: 'de', extras: { learning } });
      later.instance.restore(saved);
      const code = saved.cards[0]!.item;
      const expected = deckId === 'capitals' ? countryName(code.toUpperCase(), 'de') : deckId === 'ai-basics' ? aiTerm(code, 'de')!.term : undefined;
      if (expected) {
        expect(later.q('review-prompt').textContent, deckId).toBe(expected);
        expect(later.q('review-prompt').querySelector('[lang]')!.getAttribute('lang'), deckId).toBe('de');
      }
      later.reveal();
      if (deckId === 'flags') expect(later.q('review-answer').textContent).toContain(countryName(code.toUpperCase(), 'de'));
      expect(later.q('review-languages').textContent, deckId).toContain('Deutsch');
      later.click('review-rate-good');
      expect(learning.list(deckId).some((r) => r.reviews === 2), deckId).toBe(true);
    }
  });

  it('AI basics: term → definition in the UI language (not the learning language); backward shows the definition and asks for the term', () => {
    const { q, reveal, instance } = setup({ locale: 'de', extras: { learning: learningWith(), contentLanguages: { learning: 'fr', translation: 'en' } }, settings: { deck: 'ai-basics', direction: 'forward' } });
    q('review-practice').click();
    const state = instance.serialize();
    expect(state).toMatchObject({ mode: 'practice', deckId: 'ai-basics', languages: { learning: 'de' }, direction: 'forward' });
    expect(isValidReviewState(JSON.parse(JSON.stringify(state)))).toBe(true);
    const entry = aiTerm(state.cards[0]!.item, 'de')!;
    expect(q('review-prompt').textContent).toBe(entry.term);
    expect(q('review-prompt').querySelector('[lang]')!.getAttribute('lang')).toBe('de');
    expect(q('review-session').textContent).not.toContain(entry.definition);
    reveal();
    expect(q('review-answer').textContent).toContain(entry.definition);
    // The definition is long: set as a paragraph rather than a big bold word.
    expect(q('review-answer').querySelector('.wp-review__text--long')).not.toBeNull();
    expect(q('review-languages').textContent).toBe('KI-Begriffe und Definitionen auf Deutsch');

    const backward = setup({ extras: { contentLanguages: { learning: 'de' } }, settings: { deck: 'ai-basics', direction: 'backward' } });
    const s = backward.instance.serialize();
    const item = aiTerm(s.cards[0]!.item, 'en')!;
    expect(backward.q('review-prompt').textContent).toBe(item.definition);
    backward.reveal(item.term.toUpperCase());
    expect(backward.q('review-answer').textContent).toContain(item.term);
    expect(backward.q('review-typed-result').textContent).toContain('Matches the card.');
  });

  it('AI basics: items worth reviewing come from records kept under one deck key for all languages', () => {
    const ids = (builtinItemIds('ai-basics') ?? []).slice(0, 2);
    const learning = learningWith([dueRecord('ai-basics', ids[0]!), dueRecord('ai-basics', ids[1]!)]);
    const { click, reveal, instance } = setup({ extras: { learning, contentLanguages: { learning: 'ja' } }, settings: { deck: 'ai-basics' } });
    const state = instance.serialize();
    expect(state).toMatchObject({ mode: 'review', deckId: 'ai-basics', languages: { learning: 'en' } });
    expect(state.cards.map((c) => c.item).sort()).toEqual([...ids].sort());
    reveal();
    click('review-rate-good');
    expect(learning.list('ai-basics').some((r) => r.reviews === 2)).toBe(true);
  });

  it('AI basics: a learning language without AI terms needs no notice (the UI language is used anyway)', () => {
    const { q, instance } = setup({ locale: 'de', extras: { contentLanguages: { learning: 'sv' } }, settings: { deck: 'ai-basics' } });
    expect(instance.serialize()).toMatchObject({ deckId: 'ai-basics', languages: { learning: 'de' } });
    expect(q('review-notice').hidden).toBe(true);
    expect(q('review-languages').textContent).toBe('KI-Begriffe und Definitionen auf Deutsch');
  });

  it('first words: the picture is shown with the answer only; backward asks for the word in the learning language', () => {
    const { q, reveal, instance, root } = setup({ extras: { contentLanguages: { learning: 'es', translation: 'en' } }, settings: { direction: 'backward' } });
    const state = instance.serialize();
    expect(state).toMatchObject({ direction: 'backward', languages: { learning: 'es', translation: 'en' } });
    expect(q('review-prompt').querySelector('[role="img"]')).toBeNull();
    expect(q('review-prompt').querySelector('[lang]')!.getAttribute('lang')).toBe('en');
    reveal();
    expect(q('review-answer').querySelector('[role="img"]')).not.toBeNull();
    expect(q('review-answer').querySelector('[lang]')!.getAttribute('lang')).toBe('es');
    expect(root.querySelector('[data-testid="review-languages"]')!.textContent).toBe('Words in Spanish, translations in English');
  });

  it('own decks: chosen on the start screen and resolved from the host snapshot; a deleted deck is explained', () => {
    const userDecks = decks(OWN);
    const { instance, q } = setup({ extras: { userDecks, learning: learningWith() }, settings: { deck: OWN.id } });
    expect(instance.serialize()).toMatchObject({ deckId: OWN.id, mode: 'review', cards: [] });
    // "Learn new cards" on the "nothing to review" panel keeps the deck.
    q('review-learn-new').click();
    expect(instance.serialize()).toMatchObject({ deckId: OWN.id, mode: 'new' });
    const own = setup({ extras: { userDecks, learning: learningWith() }, settings: { deck: OWN.id, mode: 'new' } });
    expect(own.instance.serialize().cards).toHaveLength(3);
    own.reveal('fowl');
    const saved = own.instance.serialize();

    const gone = setup({ extras: { userDecks: decks(), learning: learningWith() } });
    gone.instance.restore(saved);
    expect(gone.q('review-missing').hidden).toBe(false);
    expect(gone.q('review-session').hidden).toBe(true);
    gone.q('review-missing-new').click();
    expect(gone.instance.serialize()).toMatchObject({ deckId: 'first-words' });
    // A chosen (or remembered) deck that is gone falls back to First words.
    expect(setup({ extras: { userDecks: decks() }, settings: { deck: OWN.id } }).instance.serialize().deckId).toBe('first-words');
    expect(setup({ extras: { userDecks: decks() }, prefs: { [DECK_PREFERENCE]: OWN.id } }).instance.serialize().deckId).toBe('first-words');
  });

  it('a link with ?deck= opens that deck once; later sessions use the start screen\'s deck', () => {
    const { instance } = setup({ extras: { userDecks: decks(OWN), launch: { deck: OWN.id } }, settings: { deck: 'capitals' } });
    expect(instance.serialize().deckId).toBe(OWN.id);
    instance.newGame({ seed: 2, settings: { deck: 'flags' } });
    expect(instance.serialize().deckId).toBe('flags');
    const unknown = setup({ extras: { launch: { deck: 'user-missing-1' } } });
    expect(unknown.instance.serialize().deckId).toBe('first-words');
  });

  it('direction and cards come from the start screen; without a chosen direction a review falls back to both directions', () => {
    const records = (builtinItemIds('first-words') ?? []).slice(0, 2).map((id) => dueRecord('first-words:en', id, 'backward'));
    const learning = learningWith(records);
    const { instance } = setup({ extras: { learning } });
    // No direction given (older hosts, tests): nothing due front → back, but two cards back → front.
    expect(instance.serialize()).toMatchObject({ direction: 'mixed', mode: 'review' });
    expect(instance.serialize().cards).toHaveLength(2);
    // A direction chosen on the start screen is kept as it is.
    instance.newGame({ seed: 3, settings: { direction: 'forward', mode: 'review' } });
    expect(instance.serialize()).toMatchObject({ direction: 'forward', cards: [] });
    instance.newGame({ seed: 4, settings: { direction: 'backward', mode: 'review' } });
    expect(instance.serialize()).toMatchObject({ direction: 'backward', mode: 'review' });
    expect(instance.serialize().cards).toHaveLength(2);
    instance.newGame({ seed: 5, settings: { direction: 'backward', mode: 'practice' } });
    expect(instance.serialize()).toMatchObject({ mode: 'practice', session: '' });
    instance.newGame({ seed: 6, settings: { direction: 'sideways', mode: 'later', deck: 7 } });
    expect(instance.serialize()).toMatchObject({ deckId: 'first-words', mode: 'review' });
  });

  it('declares deck (with the device\'s own decks), direction and, with learning records, the cards', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en', undefined, { userDecks: decks(OWN), learning: learningWith() });
    const specs = reviewSettings(ctx.settingsEnv);
    expect(specs.map((spec) => (spec.kind === 'choice' ? [spec.id, spec.default] : spec.kind))).toEqual([
      ['deck', 'first-words'],
      ['direction', 'forward'],
      ['mode', 'review']
    ]);
    const deck = specs[0]!;
    expect(deck.kind === 'choice' && deck.values).toEqual(['first-words', 'flags', 'capitals', 'ai-basics', OWN.id]);
    expect(deck.kind === 'choice' && deck.valueLabels).toMatchObject({ flags: 'Flags & countries', [OWN.id]: 'Animals (3 cards)' });
    // Without learning records there is nothing to choose about the cards.
    const plain = createTestContext(game as GameModule<unknown>, 'en');
    expect(reviewSettings(plain.settingsEnv).map((spec) => (spec.kind === 'choice' ? spec.id : spec.kind))).toEqual(['deck', 'direction']);
    // Defaults: a deck link first, else what older versions remembered.
    plain.preferences.set(DECK_PREFERENCE, 'capitals');
    plain.preferences.set(DIRECTION_PREFERENCE, 'backward');
    expect(reviewSettings(plain.settingsEnv).map((spec) => spec.kind === 'choice' && spec.default)).toEqual(['capitals', 'backward']);
    expect(reviewSettings({ ...plain.settingsEnv, launch: { deck: 'flags' } })[0]).toMatchObject({ default: 'flags' });
    plain.preferences.set(DECK_PREFERENCE, 'user-gone-1');
    expect(reviewSettings({ ...plain.settingsEnv, launch: { deck: 'user-gone-2' } })[0]).toMatchObject({ default: 'first-words' });
  });

  it('pause blocks input; reset restarts the same session without recording again', () => {
    const records = (builtinItemIds('flags') ?? []).slice(0, 2).map((id) => dueRecord('flags', id));
    const persisted: LearningRecord[][] = [];
    const learning = learningWith(records, persisted);
    const { reveal, click, instance } = setup({ extras: { learning }, settings: { deck: 'flags' } });
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
    const { root, q, reveal } = setup({ locale: 'ar', speech, extras: { userDecks: decks(OWN) }, settings: { deck: OWN.id } });
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
