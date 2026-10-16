import { defineGame, type SettingSpec, type SettingsEnv, type UserDeckSummary } from '@wp/game-core';
import { pickText } from '@wp/learning-content';
import { isBuiltinReviewDeck } from './decks';
import { metadata } from './metadata';
import { BUILTIN_REVIEW_DECKS, DEFAULT_DECK, DIRECTION_CHOICES, isValidReviewState, MODES, type ReviewState } from './rules';
import { createReview, DECK_LABEL, DECK_PREFERENCE, DIRECTION_PREFERENCE } from './view';

export type { ReviewState } from './rules';

const ownDecks = (env: SettingsEnv): readonly UserDeckSummary[] => {
  try {
    return env.userDecks?.list() ?? [];
  } catch {
    return [];
  }
};

/**
 * Start-screen settings (ADR 0017): the deck (built-in decks and the decks imported on this device, so labelled
 * from the device), the direction and, where learning records exist, which cards. Defaults follow a deck link
 * (`?deck=`), else what older versions remembered in the game's own preferences.
 */
export function reviewSettings(env: SettingsEnv): readonly SettingSpec[] {
  const own = ownDecks(env).filter((deck) => !isBuiltinReviewDeck(deck.id));
  const decks = [...BUILTIN_REVIEW_DECKS, ...own.map((deck) => deck.id)];
  const valueLabels: Record<string, string> = {};
  for (const id of BUILTIN_REVIEW_DECKS) valueLabels[id] = env.t(DECK_LABEL[id]);
  for (const deck of own) valueLabels[deck.id] = env.t('deck.ownItem', { title: pickText(deck.title, env.t.locale), count: deck.itemCount });
  const known = (value: unknown): value is string => typeof value === 'string' && decks.includes(value);
  const oldDeck = env.preferences?.get(DECK_PREFERENCE);
  const deck = known(env.launch?.deck) ? env.launch.deck : known(oldDeck) ? oldDeck : DEFAULT_DECK;
  const oldDirection = env.preferences?.get(DIRECTION_PREFERENCE);
  const direction = DIRECTION_CHOICES.find((d) => d === oldDirection) ?? 'forward';
  return [
    { kind: 'choice', id: 'deck', labelKey: 'options.deck', values: decks, valueLabels, default: deck, display: 'select', hintKey: 'options.hint' },
    { kind: 'choice', id: 'direction', labelKey: 'options.direction', values: DIRECTION_CHOICES, valueKey: 'direction', default: direction },
    // Without learning records every session is practice, so there is nothing to choose.
    ...(env.learning ? [{ kind: 'choice', id: 'mode', labelKey: 'options.mode', values: MODES, valueKey: 'modeChoice', default: 'review' } as const] : [])
  ];
}

export default defineGame<ReviewState>({
  metadata,
  create: (context) => createReview(context),
  isValidState: (value: unknown): value is ReviewState => isValidReviewState(value),
  settings: reviewSettings
});
