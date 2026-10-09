/**
 * Strings of the "Items worth reviewing" parts of the deck pages (English: the reference catalogue; all other
 * locales must have exactly these keys). Loaded per locale with the UI messages (see ../index.ts).
 */
const en = {
  'review.title': 'Items worth reviewing',
  'review.intro': 'Cards you rated in Review come back after a break. Look at them whenever you feel like it; nothing is lost if you don’t.',
  'review.none': 'Nothing is waiting for review right now.',
  'review.due': '{count} worth reviewing',
  'review.action': 'Review',
  'review.actionLabel': 'Review {title}',
  'review.seen': 'Rated so far: {seen} of {total} cards',
  'review.howTitle': 'How the review schedule works',
  'review.howText': 'Each card you rate sits in one of seven boxes. “Knew it” moves it up one box, “Almost” keeps it in its box, “Not yet” puts it back into the first box. Box 1 is suggested again after 1 day, the next boxes after 2, 4, 8, 16, 32 and 64 days. Spacing reviews out like this tends to help people remember, but it is only a suggestion. The records stay on this device; there are no reminders, notifications or streaks.',
  'decks.review': 'Review with flash cards'
} as const;

export type LearningUiKey = keyof typeof en;
export type LearningCatalogue = Readonly<Record<LearningUiKey, string>>;
export default en satisfies LearningCatalogue;
