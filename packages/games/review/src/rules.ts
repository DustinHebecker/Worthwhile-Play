import { createRng, isInt, isOneOf, isRecord, isUint32, type LearningDirection, type LearningRating, type LearningRecordSummary, type LearningReview, type Rng } from '@wp/game-core';
import { builtinItemIds, isDay, isUserDeckId, isVocabularyLanguage } from '@wp/learning-content';

/**
 * Pure, DOM-free rules of "Review" (flash cards with optional spaced repetition).
 *
 * A session is a short, fixed queue of cards built once from the deck, the learning records and a seed:
 * - `review`: cards whose suggested day has arrived (most overdue first), at most 20;
 * - `new`: cards that were never rated, at most 10;
 * - `practice`: any cards, at most 10; ratings do not change the schedule.
 * The player reveals a card and rates it: "Not yet" (`again`), "Almost" (`hard`) or "Knew it" (`good`).
 * A card rated "Not yet" comes back once at the end of the session (that repetition is not recorded).
 *
 * Idempotency: every session has an id; the learning records accept one rating per card and session, so the
 * game can (and does) send all ratings of its state again after a resume without ever counting twice.
 */

export const MODES = ['review', 'new', 'practice'] as const;
export type Mode = (typeof MODES)[number];
export const DIRECTION_CHOICES = ['forward', 'backward', 'mixed'] as const;
export type DirectionChoice = (typeof DIRECTION_CHOICES)[number];
export const RATINGS: readonly LearningRating[] = ['again', 'hard', 'good'];

/** Session sizes: short and bounded. */
export const SESSION_LIMITS: Readonly<Record<Mode, number>> = { review: 20, new: 10, practice: 10 };
/** Built-in decks that can be reviewed (front and back differ). */
export const BUILTIN_REVIEW_DECKS = ['first-words', 'flags', 'capitals'] as const;
export const DEFAULT_DECK = 'first-words';
export const MAX_ITEM_ID_LENGTH = 200;
export const MAX_TYPED_LENGTH = 300;

export interface ReviewCard {
  item: string;
  dir: LearningDirection;
  /** Second look at a card rated "Not yet" in this session (not recorded). */
  repeat?: true;
}

export interface ReviewAnswer {
  rating: LearningRating;
  /** Local day of the rating (`YYYY-MM-DD`), or '' without learning records. */
  day: string;
}

/** Content languages fixed when the session started (built-in decks only), so a resumed session looks the same. */
export interface ReviewLanguages {
  /** "First words": language being learned (front). "Capitals": language of country and capital names. */
  learning?: string;
  /** "First words": translation language (back). */
  translation?: string;
  /** "Flags & countries": language of the country names. */
  countries?: string;
}

export interface ReviewState {
  seed: number;
  deckId: string;
  languages: ReviewLanguages;
  direction: DirectionChoice;
  mode: Mode;
  /** Session id for idempotent learning-record writes; '' in practice mode. */
  session: string;
  cards: ReviewCard[];
  /** Current card; `cards.length` once the session is complete. */
  index: number;
  revealed: boolean;
  /** What the player typed for the current card (kept once revealed), or null. */
  typed: string | null;
  /** One answer per card before `index`. */
  answers: ReviewAnswer[];
}

const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
};

export const directionsOf = (choice: DirectionChoice): readonly LearningDirection[] => (choice === 'mixed' ? ['forward', 'backward'] : [choice]);

/** Keeps the first card of each item (one direction per item and session). */
const firstPerItem = (cards: readonly ReviewCard[]): ReviewCard[] => {
  const seen = new Set<string>();
  return cards.filter((card) => !seen.has(card.item) && Boolean(seen.add(card.item)));
};

export interface SessionInput {
  seed: number;
  mode: Mode;
  direction: DirectionChoice;
  itemIds: readonly string[];
  /** Records of this deck (other decks' records are ignored by item id anyway). */
  records: readonly LearningRecordSummary[];
  today: string;
}

const recordMap = (records: readonly LearningRecordSummary[]) => new Map(records.map((r) => [`${r.direction}:${r.itemId}`, r]));

/** Builds the card queue of a new session. Deterministic for the same input. */
export function buildCards(input: SessionInput): ReviewCard[] {
  const rng = createRng(input.seed);
  const items = [...new Set(input.itemIds)];
  const allowed = directionsOf(input.direction);
  const limit = SESSION_LIMITS[input.mode];
  if (input.mode === 'practice') {
    return shuffle(items, rng)
      .slice(0, limit)
      .map((item) => ({ item, dir: input.direction === 'mixed' ? (rng.int(0, 1) === 0 ? 'forward' : 'backward') : input.direction }));
  }
  const byKey = recordMap(input.records);
  const pairs = items.flatMap((item) => allowed.map((dir) => ({ item, dir, record: byKey.get(`${dir}:${item}`) })));
  if (input.mode === 'new') {
    return firstPerItem(shuffle(pairs.filter((p) => !p.record).map(({ item, dir }) => ({ item, dir })), rng)).slice(0, limit);
  }
  const due = shuffle(pairs.filter((p) => p.record && p.record.due <= input.today), rng);
  // Most overdue first (stable sort keeps the seeded order among equal days).
  due.sort((a, b) => ((a.record?.due ?? '') < (b.record?.due ?? '') ? -1 : (a.record?.due ?? '') > (b.record?.due ?? '') ? 1 : 0));
  const chosen = firstPerItem(due.map(({ item, dir }) => ({ item, dir }))).slice(0, limit);
  return shuffle(chosen, rng);
}

/** How many items a `review` / `new` session could offer right now (before the session limit). */
export function availableCounts(itemIds: readonly string[], records: readonly LearningRecordSummary[], direction: DirectionChoice, today: string): { due: number; unseen: number } {
  const byKey = recordMap(records);
  let due = 0;
  let unseen = 0;
  for (const item of new Set(itemIds)) {
    const recs = directionsOf(direction).map((dir) => byKey.get(`${dir}:${item}`));
    if (recs.some((r) => r && r.due <= today)) due++;
    if (recs.some((r) => !r)) unseen++;
  }
  return { due, unseen };
}

/** Session id: start day and seed (unique per session in practice; the host draws seeds at random). */
export function sessionId(mode: Mode, seed: number, today: string | undefined): string {
  if (mode === 'practice' || !today || !isDay(today)) return '';
  return `${today.replace(/-/g, '')}-${seed.toString(36)}`;
}

export interface StartOptions extends SessionInput {
  deckId: string;
  languages: ReviewLanguages;
}

export function startSession(options: StartOptions): ReviewState {
  const mode = options.mode !== 'practice' && sessionId(options.mode, options.seed, options.today) === '' ? 'practice' : options.mode;
  return {
    seed: options.seed,
    deckId: options.deckId,
    languages: { ...options.languages },
    direction: options.direction,
    mode,
    session: sessionId(mode, options.seed, options.today),
    cards: buildCards({ ...options, mode }),
    index: 0,
    revealed: false,
    typed: null,
    answers: []
  };
}

export const isFinished = (state: ReviewState): boolean => state.cards.length > 0 && state.index >= state.cards.length;
export const currentCard = (state: ReviewState): ReviewCard | undefined => state.cards[state.index];

/** Shows the other side of the current card (with the typed answer, if any). */
export function reveal(state: ReviewState, typed?: string): ReviewState {
  if (state.revealed || !currentCard(state)) return state;
  const text = (typed ?? '').trim().slice(0, MAX_TYPED_LENGTH);
  return { ...state, revealed: true, typed: text === '' ? null : text };
}

/** The learning-record write for the card at `index`, if this session records ratings. */
function reviewAt(state: ReviewState, index: number, recordDeck: string): LearningReview | undefined {
  const card = state.cards[index];
  const answer = state.answers[index];
  if (!card || !answer || card.repeat || state.mode === 'practice' || state.session === '' || !isDay(answer.day)) return undefined;
  return { deckId: recordDeck, itemId: card.item, direction: card.dir, rating: answer.rating, session: state.session, day: answer.day };
}

/** Rates the revealed card and moves on. Returns the review to record (none in practice mode or for repeats). */
export function rate(state: ReviewState, rating: LearningRating, day: string, recordDeck: string): { state: ReviewState; review?: LearningReview } {
  const card = currentCard(state);
  if (!state.revealed || !card || !isOneOf(rating, RATINGS)) return { state };
  const cards = rating === 'again' && !card.repeat ? [...state.cards, { item: card.item, dir: card.dir, repeat: true as const }] : state.cards;
  const next: ReviewState = { ...state, cards, index: state.index + 1, revealed: false, typed: null, answers: [...state.answers, { rating, day: isDay(day) ? day : '' }] };
  const review = reviewAt(next, state.index, recordDeck);
  return review ? { state: next, review } : { state: next };
}

/** Every recordable rating of the session so far (sent again after a resume; the records ignore repeats). */
export function reviewsOf(state: ReviewState, recordDeck: string): LearningReview[] {
  return state.answers.map((_, i) => reviewAt(state, i, recordDeck)).filter((r): r is LearningReview => r !== undefined);
}

/** The same session from its first card (repetitions removed). */
export function restart(state: ReviewState): ReviewState {
  return { ...state, cards: state.cards.filter((card) => !card.repeat), index: 0, revealed: false, typed: null, answers: [] };
}

/** Ratings of the first look at each card (repetitions excluded). */
export function summary(state: ReviewState): Record<LearningRating, number> & { cards: number } {
  const counts = { again: 0, hard: 0, good: 0, cards: 0 };
  state.answers.forEach((answer, i) => {
    if (state.cards[i]?.repeat) return;
    counts[answer.rating]++;
    counts.cards++;
  });
  return counts;
}

/** Key of the learning records for a session's deck (`first-words:<learning language>`, `flags`, `capitals`, user deck id). */
export function recordDeckOf(state: Pick<ReviewState, 'deckId' | 'languages'>): string {
  return state.deckId === 'first-words' ? `first-words:${state.languages.learning ?? ''}` : state.deckId;
}

/**
 * Lenient comparison of a typed answer: ignores case, accents and other diacritics, punctuation and extra spaces,
 * and accepts any of several answers separated by `;`, `,` or `/` (text in parentheses is optional).
 */
export function matchesAnswer(typed: string, expected: string): boolean {
  const normalize = (text: string) =>
    text
      .normalize('NFKD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  const answer = normalize(typed);
  if (answer === '') return false;
  const variants = [expected, expected.replace(/\([^)]*\)/g, ' '), ...expected.split(/[;,/]/), ...expected.replace(/\([^)]*\)/g, ' ').split(/[;,/]/)];
  return variants.some((variant) => normalize(variant) === answer);
}

// --- Validation of untrusted saves ------------------------------------------------------------

const isDirection = (value: unknown): value is LearningDirection => value === 'forward' || value === 'backward';

function isValidLanguages(deckId: string, value: unknown): value is ReviewLanguages {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort().join(',');
  if (deckId === 'first-words') {
    return keys === 'learning,translation' && isVocabularyLanguage(value.learning) && isVocabularyLanguage(value.translation) && value.learning !== value.translation;
  }
  if (deckId === 'capitals') return keys === 'learning' && isVocabularyLanguage(value.learning);
  if (deckId === 'flags') return keys === 'countries' && typeof value.countries === 'string' && /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(value.countries);
  return keys === '';
}

function isCard(value: unknown, items: ReadonlySet<string> | undefined): value is ReviewCard {
  if (!isRecord(value) || typeof value.item !== 'string' || value.item === '' || value.item.length > MAX_ITEM_ID_LENGTH || !isDirection(value.dir)) return false;
  if (items && !items.has(value.item)) return false;
  const keys = Object.keys(value).length;
  return value.repeat === undefined ? keys === 2 : value.repeat === true && keys === 3;
}

const isAnswer = (value: unknown): value is ReviewAnswer =>
  isRecord(value) && isOneOf(value.rating, RATINGS) && (value.day === '' || isDay(value.day)) && Object.keys(value).length === 2;

/** Structural validation of untrusted saved state. Never throws. */
export function isValidReviewState(value: unknown): value is ReviewState {
  try {
    if (!isRecord(value)) return false;
    const { seed, deckId, languages, direction, mode, session, cards, index, revealed, typed, answers } = value;
    if (!isUint32(seed) || typeof deckId !== 'string') return false;
    const builtin = (BUILTIN_REVIEW_DECKS as readonly string[]).includes(deckId);
    if (!builtin && !isUserDeckId(deckId)) return false;
    if (!isValidLanguages(deckId, languages) || !isOneOf(direction, DIRECTION_CHOICES) || !isOneOf(mode, MODES)) return false;
    if (mode === 'practice' ? session !== '' : typeof session !== 'string' || !/^\d{8}-[0-9a-z]{1,7}$/.test(session)) return false;
    const items = builtin ? new Set(builtinItemIds(deckId)) : undefined;
    if (!Array.isArray(cards) || !cards.every((card) => isCard(card, items))) return false;
    const first = cards.filter((card) => !card.repeat);
    // Repetitions only follow the session's own cards.
    if (cards.findIndex((card) => card.repeat) !== -1 && cards.slice(first.length).some((card) => !card.repeat)) return false;
    if (first.length > SESSION_LIMITS[mode] || new Set(first.map((card) => card.item)).size !== first.length) return false;
    if (!first.every((card) => direction === 'mixed' || card.dir === direction)) return false;
    if (mode === 'practice' && first.length === 0) return false;
    if (!isInt(index, 0, cards.length) || !Array.isArray(answers) || answers.length !== index || !answers.every(isAnswer)) return false;
    // Each "Not yet" on a first look appended exactly one repetition of that card, in order.
    const expected = answers.flatMap((answer, i) => (answer.rating === 'again' && !cards[i]?.repeat ? [`${cards[i]?.item}:${cards[i]?.dir}`] : []));
    const repeats = cards.slice(first.length).map((card) => `${card.item}:${card.dir}`);
    if (expected.join('|') !== repeats.join('|')) return false;
    if (typeof revealed !== 'boolean' || (revealed && index >= cards.length)) return false;
    if (typed !== null && !(typeof typed === 'string' && revealed && typed.trim() !== '' && typed.length <= MAX_TYPED_LENGTH)) return false;
    return Object.keys(value).length === 11;
  } catch {
    return false;
  }
}
