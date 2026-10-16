import type { SettingSpec, SettingsEnv } from '@wp/game-core';
import { pickText } from '@wp/learning-content';
import { BUILTIN_CHOICES, parseChoice, type CardChoice } from './decks';
import { MIN_PAIRS } from './rules';

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
  return [{ kind: 'choice', id: 'cards', labelKey: 'cards.label', values: Object.keys(labels), valueLabels: labels, default: DEFAULT_CHOICE, display: 'select' }];
}

/** The card choice from untrusted start-screen settings (a gone deck is handled when dealing). */
export function choiceFrom(chosen: Readonly<Record<string, unknown>> | undefined): CardChoice {
  const value = chosen?.cards;
  return parseChoice(value) ? (value as CardChoice) : DEFAULT_CHOICE;
}
