// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, UserDeckSource } from '@wp/game-core';
import { countryName, findWord, type Deck } from '@wp/learning-content';
import { createMemoryStore, createSave, interpretSave } from '@wp/persistence';
import { createTestContext, type TestContextExtras } from '@wp/testing';
import game from '../src/index';
import { parseChoice, choiceOf, userDeck } from '../src/decks';
import { partnerOf, type MemoryState } from '../src/rules';
import { hasVoice, browserSpeech, type Speech } from '../src/speech';
import { createMemory } from '../src/view';

let running: GameInstance<MemoryState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

const OWN: Deck = {
  schemaVersion: 1,
  id: 'user-colours-ab12',
  title: { en: 'Colours', de: 'Farben' },
  items: [
    ['rot', 'red'], ['blau', 'blue'], ['grün', 'green'], ['gelb', 'yellow']
  ].map(([de, en], i) => ({ id: `c${i}`, front: { text: de as string, lang: 'de' }, back: { text: en as string, lang: 'en' } }))
};

const decks = (...list: Deck[]): UserDeckSource => ({
  list: () => list.map((d) => ({ id: d.id, title: d.title, itemCount: d.items.length })),
  get: (id) => list.find((d) => d.id === id)
});

const fakeSpeech = (voices: string[]): Speech & { spoken: [string, string][] } => {
  const spoken: [string, string][] = [];
  return { spoken, canSpeak: (lang) => hasVoice(voices.map((v) => ({ lang: v })), lang), speak: (text, lang) => void spoken.push([text, lang]), onVoicesChanged: () => () => undefined };
};

function setup(options: { locale?: 'en' | 'de' | 'ar'; extras?: TestContextExtras; prefs?: Record<string, unknown>; speech?: Speech; seed?: number; difficulty?: string } = {}) {
  const ctx = createTestContext(game as never, options.locale ?? 'en', document.createElement('div'), options.extras ?? {});
  for (const [k, v] of Object.entries(options.prefs ?? {})) ctx.preferences.set(k, v);
  const instance = createMemory(ctx.context, options.speech);
  running.push(instance);
  instance.newGame({ seed: options.seed ?? 11, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, instance, root: ctx.context.root };
}

const card = (root: HTMLElement, i: number) => root.querySelector<HTMLButtonElement>(`[data-testid="card-${i}"]`) as HTMLButtonElement;
const select = (root: HTMLElement) => root.querySelector<HTMLSelectElement>('[data-testid="memory-cards"]') as HTMLSelectElement;
const choose = (root: HTMLElement, value: string) => {
  select(root).value = value;
  select(root).dispatchEvent(new Event('change', { bubbles: true }));
};
const byId = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;

describe('card choice menu', () => {
  it('offers the built-in variants and the user decks, defaulting to picture pairs', () => {
    const { root, instance } = setup({ extras: { userDecks: decks(OWN, { ...OWN, id: 'user-tiny-1', title: { en: 'Tiny' }, items: OWN.items.slice(0, 1) }) } });
    const options = [...select(root).options].map((o) => [o.value, o.textContent, o.disabled]);
    expect(options).toEqual([
      ['symbols', 'Picture pairs', false],
      ['picture-word', 'Picture ↔ word', false],
      ['word-translation', 'Word ↔ translation', false],
      ['flag-country', 'Flag ↔ country', false],
      ['own:user-colours-ab12', 'Colours (4 cards)', false],
      ['own:user-tiny-1', 'Tiny (1 cards)', true]
    ]);
    expect(select(root).value).toBe('symbols');
    expect(root.querySelector('optgroup')?.getAttribute('label')).toBe('Your decks');
    expect(instance.serialize().variant).toBe('symbols');
    expect(byId(root, 'memory-languages').hidden).toBe(true);
  });

  it('starts a new game with the chosen cards (same seed) and remembers the choice', () => {
    const { root, instance, ctx } = setup({ extras: { contentLanguages: { learning: 'ja', translation: 'de' } } });
    card(root, 0).click();
    const saves = ctx.saveRequests();
    choose(root, 'word-translation');
    const s = instance.serialize();
    expect(s).toMatchObject({ seed: 11, variant: 'word-translation', deckId: 'first-words', languages: { front: 'ja', back: 'de' }, moves: 0, revealed: [] });
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(ctx.preferences.get('cards')).toBe('word-translation');
    expect(byId(root, 'memory-languages').textContent).toBe('Words in Japanese, translations in German');
    expect(document.activeElement).toBe(select(root));
    // A fresh game (host "New game") keeps the chosen cards.
    instance.newGame({ seed: 5 });
    expect(instance.serialize()).toMatchObject({ seed: 5, variant: 'word-translation' });
  });

  it('a remembered choice is used for the first new game', () => {
    const { instance, root } = setup({ prefs: { cards: 'flag-country' }, locale: 'de' });
    expect(instance.serialize()).toMatchObject({ variant: 'flag-country', deckId: 'flags', languages: { back: 'de' } });
    expect(select(root).value).toBe('flag-country');
  });

  it('ignores unusable remembered choices', () => {
    expect(parseChoice('own:')).toBeUndefined();
    expect(parseChoice(42)).toBeUndefined();
    expect(parseChoice('own:user-x-1')).toEqual({ variant: 'own', deckId: 'user-x-1' });
    const { instance } = setup({ prefs: { cards: 'nonsense' } });
    expect(instance.serialize().variant).toBe('symbols');
  });

  it('changing cards does not count as tapping the board (a pending mismatch stays until the new deal)', () => {
    const { root, instance } = setup();
    const s = instance.serialize();
    const other = s.cards.findIndex((_, i) => i > 0 && i !== partnerOf(s.cards, 0));
    card(root, 0).click();
    card(root, other).click();
    select(root).click();
    expect(instance.serialize().revealed).toHaveLength(2);
  });
});

describe('picture ↔ word', () => {
  it('shows the picture on one card and the word in the learning language on the other', () => {
    const { root, instance } = setup({ prefs: { cards: 'picture-word' }, extras: { contentLanguages: { learning: 'es' } } });
    const s = instance.serialize();
    expect(s.languages).toEqual({ back: 'es' });
    const front = s.cards.findIndex((c) => c.side === 'front');
    const back = partnerOf(s.cards, front);
    const word = findWord(s.cards[front]?.item ?? '');
    card(root, front).click();
    expect(card(root, front).querySelector('.wp-memory__symbol')?.textContent).toBe(word?.emoji);
    expect(card(root, front).getAttribute('aria-label')).toBe(`Card ${front + 1}: Picture: ${word?.words.en}`);
    card(root, back).click();
    const text = card(root, back).querySelector('.wp-memory__text');
    expect(text?.textContent).toBe(word?.words.es);
    expect(text?.getAttribute('lang')).toBe('es');
    expect(card(root, back).dataset.state).toBe('matched');
    expect(byId(root, 'memory-languages').textContent).toBe('Words in Spanish');
  });

  it('falls back to the UI language with a notice when the learning language has no words yet', () => {
    const { instance, root } = setup({ prefs: { cards: 'picture-word' }, extras: { contentLanguages: { learning: 'sv' } }, locale: 'de' });
    expect(instance.serialize().languages).toEqual({ back: 'de' });
    expect(byId(root, 'memory-notice').hidden).toBe(false);
    expect(byId(root, 'memory-notice').textContent).toBe('Für Schwedisch gibt es noch keine Wörter, daher wird eine andere Sprache verwendet.');
  });

  it('keeps the recorded languages on restore and reset, even if Settings changed', () => {
    const first = setup({ prefs: { cards: 'word-translation' }, extras: { contentLanguages: { learning: 'ko', translation: 'fr' } } });
    card(first.root, 0).click();
    const saved = first.instance.serialize();
    const initial = (() => {
      const fresh = setup({ prefs: { cards: 'word-translation' }, extras: { contentLanguages: { learning: 'ko', translation: 'fr' } } });
      return fresh.instance.serialize();
    })();
    const later = setup({ extras: { contentLanguages: { learning: 'pl', translation: 'it' } } });
    later.instance.restore(saved);
    expect(later.instance.serialize()).toEqual(saved);
    expect(card(later.root, 0).querySelector('.wp-memory__text')?.getAttribute('lang')).toBe(saved.cards[0]?.side === 'front' ? 'ko' : 'fr');
    later.instance.reset();
    expect(later.instance.serialize()).toEqual(initial);
  });
});

describe('flag ↔ country', () => {
  it('shows country names in the UI language when no learning language is set', () => {
    const { root, instance } = setup({ prefs: { cards: 'flag-country' }, locale: 'de', difficulty: 'large' });
    const s = instance.serialize();
    const back = s.cards.findIndex((c) => c.side === 'back');
    card(root, back).click();
    const code = (s.cards[back]?.item ?? '').toUpperCase();
    expect(card(root, back).textContent).toBe(countryName(code, 'de'));
    expect(byId(root, 'memory-languages').textContent).toBe('Ländernamen auf Deutsch');
    const front = partnerOf(s.cards, back);
    card(root, front).click();
    expect(card(root, front).getAttribute('aria-label')).toBe(`Karte ${front + 1}: Flagge: ${countryName(code, 'de')}, Paar gefunden`);
  });

  it('uses the learning language for country names when the platform knows it', () => {
    const { instance } = setup({ prefs: { cards: 'flag-country' }, extras: { contentLanguages: { learning: 'sv' } } });
    expect(instance.serialize().languages).toEqual({ back: 'sv' });
  });
});

describe('own decks', () => {
  it('plays front ↔ back of a user deck, smaller than the board if needed', () => {
    const { root, instance } = setup({ prefs: { cards: 'own:user-colours-ab12' }, extras: { userDecks: decks(OWN) } });
    const s = instance.serialize();
    expect(s).toMatchObject({ variant: 'own', deckId: 'user-colours-ab12', languages: {} });
    expect(s.itemIds).toHaveLength(4);
    expect(root.querySelectorAll('[data-testid^="card-"]')).toHaveLength(8);
    expect(select(root).value).toBe('own:user-colours-ab12');
    card(root, 0).click();
    expect(card(root, 0).textContent).toMatch(/^(rot|blau|grün|gelb|red|blue|green|yellow)$/);
    expect(game.isValidState(JSON.parse(JSON.stringify(instance.serialize())))).toBe(true);
  });

  it('falls back to picture pairs with a notice when the chosen deck is gone', () => {
    const { instance, root } = setup({ prefs: { cards: 'own:user-deleted-1' }, extras: { userDecks: decks(OWN) } });
    expect(instance.serialize().variant).toBe('symbols');
    expect(byId(root, 'memory-notice').textContent).toBe('That deck is no longer on this device, so picture pairs were dealt.');
  });

  it('restoring a game whose deck was deleted explains it and offers a new game', () => {
    const first = setup({ prefs: { cards: 'own:user-colours-ab12' }, extras: { userDecks: decks(OWN) } });
    card(first.root, 0).click();
    const saved = first.instance.serialize();
    const { root, instance, ctx } = setup({ extras: { userDecks: decks() } });
    instance.restore(saved);
    expect(instance.serialize()).toEqual(saved); // the save itself is untouched
    expect(byId(root, 'memory-missing').hidden).toBe(false);
    expect(byId(root, 'memory-board').hidden).toBe(true);
    expect(root.querySelectorAll('[data-testid^="card-"]')).toHaveLength(0);
    const saves = ctx.saveRequests();
    byId(root, 'memory-missing-new').click();
    expect(instance.serialize()).toMatchObject({ variant: 'symbols', seed: saved.seed, difficulty: saved.difficulty, moves: 0 });
    expect(byId(root, 'memory-missing').hidden).toBe(true);
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(ctx.preferences.get('cards')).toBe('symbols');
  });

  it('a deck that no longer contains the dealt items counts as missing; broken host data never throws', () => {
    const first = setup({ prefs: { cards: 'own:user-colours-ab12' }, extras: { userDecks: decks(OWN) } });
    const saved = first.instance.serialize();
    const changed = { ...OWN, items: OWN.items.map((item, i) => ({ ...item, id: `other${i}` })) };
    const { root, instance } = setup({ extras: { userDecks: decks(changed) } });
    instance.restore(saved);
    expect(byId(root, 'memory-missing').hidden).toBe(false);
    const throwing: UserDeckSource = { list: () => [], get: () => { throw new Error('boom'); } };
    expect(userDeck(throwing, 'x')).toBeUndefined();
    expect(userDeck(decks({ ...OWN, id: 'user-other-1' }), 'user-colours-ab12')).toBeUndefined();
    expect(userDeck({ list: () => [], get: () => ({ junk: true }) }, 'user-colours-ab12')).toBeUndefined();
  });

  it('choiceOf maps states back to menu values', () => {
    expect(choiceOf({ variant: 'own', deckId: 'user-a-1' })).toBe('own:user-a-1');
    expect(choiceOf({ variant: 'flag-country', deckId: 'flags' })).toBe('flag-country');
  });
});

describe('read aloud (best effort)', () => {
  it('appears for a revealed word with an installed voice and speaks it on request only', () => {
    const speech = fakeSpeech(['de-DE', 'en-US']);
    const { root, instance } = setup({ prefs: { cards: 'own:user-colours-ab12' }, extras: { userDecks: decks(OWN) }, speech });
    const speak = byId(root, 'memory-speak');
    expect(speak.hidden).toBe(true);
    card(root, 0).click();
    expect(speak.hidden).toBe(false);
    expect(speech.spoken).toEqual([]);
    const s = instance.serialize();
    const item = OWN.items.find((i) => i.id === s.cards[0]?.item);
    const side = item?.[s.cards[0]?.side ?? 'front'];
    expect(speak.getAttribute('aria-label')).toBe(`Read aloud: ${side?.text}`);
    speak.click();
    expect(speech.spoken).toEqual([[side?.text, side?.lang]]);
    // Clicking it never dismisses or reveals anything.
    expect(instance.serialize().revealed).toEqual([0]);
  });

  it('stays hidden without a voice for the language, for pictures and without speech support', () => {
    const none = setup({ prefs: { cards: 'own:user-colours-ab12' }, extras: { userDecks: decks(OWN) }, speech: fakeSpeech(['fr-FR']) });
    card(none.root, 0).click();
    expect(byId(none.root, 'memory-speak').hidden).toBe(true);
    const symbols = setup({ speech: fakeSpeech(['en-US']) });
    card(symbols.root, 0).click();
    expect(byId(symbols.root, 'memory-speak').hidden).toBe(true);
    const unsupported = setup({ prefs: { cards: 'own:user-colours-ab12' }, extras: { userDecks: decks(OWN) } });
    card(unsupported.root, 0).click();
    expect(byId(unsupported.root, 'memory-speak').hidden).toBe(true);
  });

  it('matches voices by exact tag or base language', () => {
    expect(hasVoice([{ lang: 'ja-JP' }], 'ja')).toBe(true);
    expect(hasVoice([{ lang: 'zh_CN' }], 'zh-Hans')).toBe(true);
    expect(hasVoice([{ lang: 'en-US' }], 'de')).toBe(false);
    expect(hasVoice([], 'en')).toBe(false);
  });

  it('wraps the browser API defensively', () => {
    expect(browserSpeech({})).toBeUndefined();
    const synth = { getVoices: vi.fn(() => [{ lang: 'de-DE' }]), speak: vi.fn(), cancel: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() };
    class Utterance {
      lang = '';
      constructor(public text: string) {}
    }
    const speech = browserSpeech({ speechSynthesis: synth, SpeechSynthesisUtterance: Utterance });
    expect(speech?.canSpeak('de')).toBe(true);
    speech?.speak('Hallo', 'de');
    expect(synth.cancel).toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hallo', lang: 'de' }));
    const off = speech?.onVoicesChanged(() => undefined);
    expect(synth.addEventListener).toHaveBeenCalledWith('voiceschanged', expect.any(Function));
    off?.();
    expect(synth.removeEventListener).toHaveBeenCalled();
    synth.getVoices.mockImplementation(() => {
      throw new Error('no');
    });
    expect(speech?.canSpeak('de')).toBe(false);
  });
});

describe('saves from the previous version (stateVersion 1)', () => {
  it('restore unchanged through the real persistence layer', async () => {
    const { instance, root } = setup({ seed: 77, difficulty: 'medium' });
    card(root, 0).click();
    const current = instance.serialize();
    const v1State = JSON.parse(JSON.stringify(current)) as Record<string, unknown>;
    delete v1State.variant;
    delete v1State.languages;
    const store = createMemoryStore();
    await store.write({ ...createSave(game, 77, v1State as never, 'medium'), stateVersion: 1 });
    const loaded = interpretSave(await store.read('memory'), game);
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migrated).toBe(true);
    expect(loaded.save.state).toEqual(current);
    const ctx = createTestContext(game as never);
    const restored = game.create(ctx.context);
    running.push(restored);
    restored.restore(loaded.save.state);
    expect(restored.serialize()).toEqual(current);
    expect(ctx.context.root.querySelector('[data-testid="card-0"]')?.getAttribute('data-state')).toBe('revealed');
  });
});
