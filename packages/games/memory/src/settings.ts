import type { SettingSpec, SettingValue, SettingsEnv } from '@wp/game-core';
import { pickText } from '@wp/learning-content';
import { BUILTIN_CHOICES, choiceOf, parseChoice, type CardChoice } from './decks';
import { MIN_PAIRS, type MemoryState } from './rules';

/** Message keys of the built-in card choices. */
export const CHOICE_LABEL: Readonly<Record<(typeof BUILTIN_CHOICES)[number], string>> = {
  symbols: 'cards.symbols',
  'picture-word': 'cards.pictureWord',
  'word-translation': 'cards.wordTranslation',
  'flag-country': 'cards.flags',
  'country-capital': 'cards.capitals',
  'ai-term-definition': 'cards.aiBasics'
};

export const DEFAULT_CHOICE: CardChoice = 'symbols';

/** The card choice older versions remembered in the game (preference `cards`), used as the start screen's default. */
export const OLD_CARDS_PREFERENCE = 'cards';

/**
 * Start-screen settings (ADR 0017): the cards — built-in variants plus the decks imported on this device that are
 * large enough (a device list, hence ready-made labels). The board size (difficulty) is added first by the host.
 */
export function settings(env: SettingsEnv): readonly SettingSpec[] {
  const labels: Record<string, string> = {};
  for (const choice of BUILTIN_CHOICES) labels[choice] = env.t(CHOICE_LABEL[choice]);
  const own = (() => {
    try {
      return env.userDecks?.list() ?? [];
    } catch {
      return [];
    }
  })();
  for (const deck of own) {
    if (deck.itemCount < MIN_PAIRS) continue;
    labels[`own:${deck.id}`] = `${env.t('cards.own')}: ${env.t('cards.ownItem', { title: pickText(deck.title, env.t.locale), count: deck.itemCount })}`;
  }
  // Until the start screen remembers its own choice: what older versions remembered, if it is still on offer.
  const old = env.preferences?.get(OLD_CARDS_PREFERENCE);
  const fallback = typeof old === 'string' && Object.hasOwn(labels, old) ? old : DEFAULT_CHOICE;
  return [{ kind: 'choice', id: 'cards', labelKey: 'cards.label', values: Object.keys(labels), valueLabels: labels, default: fallback, display: 'select' }];
}

/** The start-screen settings a game was dealt with (for saves from before the host kept them). */
export const memorySettingsOf = (state: MemoryState): Record<string, SettingValue> => ({ difficulty: state.difficulty, cards: choiceOf(state) });

/** The card choice from untrusted start-screen settings (a gone deck is handled when dealing). */
export function choiceFrom(chosen: Readonly<Record<string, unknown>> | undefined): CardChoice {
  const value = chosen?.cards;
  return parseChoice(value) ? (value as CardChoice) : DEFAULT_CHOICE;
}
