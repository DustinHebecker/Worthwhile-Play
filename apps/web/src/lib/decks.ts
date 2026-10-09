import type { UserDeckSource } from '@wp/game-core';
import { isRecord } from '@wp/game-core';
import { isUserDeckId, userDeckId, validateDeck, type Deck, type ImportError, type ImportWarning, IMPORT_LIMITS } from '@wp/learning-content';
import type { DeckStore } from '@wp/persistence';
import type { UiKey } from '../i18n';

/** What the app stores per imported deck (IndexedDB `decks`, keyed by `id`). */
export interface StoredDeck {
  id: string;
  /** ISO-8601 time of the import. */
  importedAt: string;
  deck: Deck;
}

/** Validates a stored record (untrusted: storage may hold anything). */
export function toStoredDeck(value: unknown): StoredDeck | undefined {
  if (!isRecord(value) || !isUserDeckId(value.id) || typeof value.importedAt !== 'string') return undefined;
  const result = validateDeck(value.deck);
  if (!result.ok || result.deck.id !== value.id) return undefined;
  return { id: value.id, importedAt: value.importedAt, deck: result.deck };
}

/** All valid imported decks, newest first. Unreadable records are skipped (never crash the library). */
export async function loadUserDecks(store: Promise<DeckStore> | DeckStore): Promise<StoredDeck[]> {
  try {
    const records = await (await store).list();
    return records
      .map(toStoredDeck)
      .filter((d): d is StoredDeck => d !== undefined)
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt) || a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}

/** Read-only, synchronous snapshot for games (`GameContext.userDecks`). */
export function userDeckSource(decks: readonly StoredDeck[]): UserDeckSource {
  const byId = new Map(decks.map((d) => [d.id, d.deck]));
  return {
    list: () => decks.map((d) => ({ id: d.id, title: d.deck.title, itemCount: d.deck.items.length })),
    get: (id) => byId.get(id)
  };
}

/** Fresh id for an imported deck (random suffix from the platform CSPRNG; `Math.random` is banned). */
export function newDeckId(title: string, randomBytes: () => ArrayLike<number> = () => crypto.getRandomValues(new Uint8Array(4))): string {
  const hex = Array.from(randomBytes(), (b) => b.toString(16).padStart(2, '0')).join('');
  return userDeckId(title, hex);
}

/** Distinct language tags of a deck's fronts and backs (in order of appearance). */
export function deckLanguages(deck: Deck): { front: string[]; back: string[]; pictures: { front: boolean; back: boolean } } {
  const collect = (side: 'front' | 'back') => [...new Set(deck.items.map((i) => i[side].lang).filter((l): l is string => Boolean(l)))];
  const pictures = (side: 'front' | 'back') => deck.items.some((i) => (i[side].symbol || i[side].image) && !i[side].text);
  return { front: collect('front'), back: collect('back'), pictures: { front: pictures('front'), back: pictures('back') } };
}

type T = (key: UiKey, params?: Readonly<Record<string, string | number>>) => string;

const ERROR_KEYS: Readonly<Record<ImportError['code'], UiKey>> = {
  empty: 'import.error.empty',
  'too-large': 'import.error.tooLarge',
  'too-many-items': 'import.error.tooManyItems',
  'json-syntax': 'import.error.jsonSyntax',
  'no-items': 'import.error.noItems',
  'text-too-long': 'import.error.textTooLong',
  'title-too-long': 'import.error.titleTooLong',
  type: 'import.error.type',
  required: 'import.error.required',
  'duplicate-id': 'import.error.duplicateId',
  'empty-side': 'import.error.emptyFront',
  range: 'import.error.range',
  'language-tag': 'import.error.languageTag'
};

const WARNING_KEYS: Readonly<Record<ImportWarning['code'], UiKey>> = {
  'remote-url-removed': 'import.warning.remote',
  'unsupported-media-removed': 'import.warning.unsupported',
  'image-too-large-removed': 'import.warning.imageTooLarge',
  'csv-no-header': 'import.warning.noHeader'
};

const limitParams = {
  size: Math.round(IMPORT_LIMITS.maxInputChars / 1_000_000),
  max: 0,
  image: Math.round(IMPORT_LIMITS.maxImageChars / 1000)
};

function located(t: T, where: { item?: number | undefined; line?: number | undefined }, message: string): string {
  if (where.line !== undefined) return t('import.at', { where: t('import.where.line', { line: where.line, n: where.item ?? 0 }), message });
  if (where.item !== undefined) return t('import.at', { where: t('import.where.card', { n: where.item }), message });
  return message;
}

/** Translated, located message for an import error ("Line 4 (card 3): The back side is empty."). */
export function importErrorText(t: T, error: ImportError): string {
  const key = error.code === 'empty-side' && error.side === 'back' ? 'import.error.emptyBack' : ERROR_KEYS[error.code];
  const max = error.code === 'too-many-items' ? IMPORT_LIMITS.maxItems : error.code === 'title-too-long' ? IMPORT_LIMITS.maxTitleChars : IMPORT_LIMITS.maxTextChars;
  return located(t, error, t(key, { ...limitParams, max }));
}

export function importWarningText(t: T, warning: ImportWarning): string {
  return located(t, warning, t(WARNING_KEYS[warning.code], { ...limitParams, max: limitParams.image }));
}
