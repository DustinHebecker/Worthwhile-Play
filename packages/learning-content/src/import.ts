import { isRecord } from '@wp/game-core';
import { csvToDeck } from './csv';
import { validateDeck, type CardSide, type Deck, type DeckIssue, type LearningItem } from './deck';

/**
 * Limits for user imports (documented in docs/content/deck-format.md). They keep a deck
 * small enough to be stored on the device, listed quickly and played offline.
 */
export const IMPORT_LIMITS = {
  /** Maximum size of the pasted text or file, in characters (≈ bytes for ASCII). */
  maxInputChars: 2_000_000,
  /** Maximum number of cards in one deck. */
  maxItems: 1000,
  /** Maximum length of one text, language tag, category or tag. */
  maxTextChars: 300,
  /** Maximum length of a deck title. */
  maxTitleChars: 120,
  /** Maximum length of an embedded `data:` image URL (≈ 75 KB of image data). */
  maxImageChars: 100_000,
  /** Maximum number of imported decks kept on one device. */
  maxDecks: 100
} as const;

export type ImportFormat = 'csv' | 'json';

/** Something that makes an import impossible. `item` is the 1-based card number, `line` the CSV line. */
export interface ImportError {
  code:
    | 'empty'
    | 'too-large'
    | 'too-many-items'
    | 'json-syntax'
    | 'no-items'
    | 'text-too-long'
    | 'title-too-long'
    | DeckIssue['code'];
  item?: number;
  line?: number;
  side?: 'front' | 'back';
  field?: string;
}

/** Something that was changed during the import (the deck can still be saved). */
export interface ImportWarning {
  code: 'remote-url-removed' | 'unsupported-media-removed' | 'image-too-large-removed' | 'csv-no-header';
  item?: number;
  line?: number;
  side?: 'front' | 'back';
  field?: string;
}

export type ImportResult =
  | { ok: true; deck: Deck; format: ImportFormat; warnings: ImportWarning[] }
  | { ok: false; format: ImportFormat | undefined; errors: ImportError[]; warnings: ImportWarning[] };

export interface ImportOptions {
  /** Id for the new deck (user decks get a fresh id so they never collide with built-in or other decks). */
  id: string;
  /** Title for CSV imports (and fallback for JSON decks without a usable title). */
  title?: string;
  /** Forces a format; otherwise text starting with `{` is JSON, everything else CSV. */
  format?: ImportFormat;
}

/** Detects the format of pasted text or a file: JSON objects start with `{`. */
export function detectFormat(text: string): ImportFormat {
  return text.replace(/^\uFEFF/, '').trimStart().startsWith('{') ? 'json' : 'csv';
}

const DATA_IMAGE = /^data:image\/(png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/=\s]+$/i;
/** A path relative to the app (bundled asset); no scheme, no protocol-relative `//host`, no backslashes. */
const RELATIVE_PATH = /^(?!\/\/)(?![a-z][a-z0-9+.-]*:)[A-Za-z0-9._~\-/%]+$/i;

export type MediaVerdict = 'ok' | 'remote' | 'unsupported' | 'too-large';

/**
 * Classifies an image/audio reference. Only bundled relative paths and (for images) small
 * embedded `data:` images are kept: anything that would make the browser contact another
 * server (http, https, protocol-relative, ftp …) is removed, so an imported deck can never
 * cause a network request or leak that it was opened.
 */
export function classifyMedia(url: string, kind: 'image' | 'audio'): MediaVerdict {
  const value = url.trim();
  if (/^data:/i.test(value)) {
    if (kind !== 'image' || !DATA_IMAGE.test(value)) return 'unsupported';
    return value.length > IMPORT_LIMITS.maxImageChars ? 'too-large' : 'ok';
  }
  if (RELATIVE_PATH.test(value) && !value.includes('..')) return 'ok';
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value) || /^(https?|ftp|ws|wss):/i.test(value)) return 'remote';
  return 'unsupported';
}

const SIDE_KEYS = ['text', 'image', 'symbol', 'audio', 'lang', 'alt'] as const;
const WARNING_FOR: Record<Exclude<MediaVerdict, 'ok'>, ImportWarning['code']> = {
  remote: 'remote-url-removed',
  unsupported: 'unsupported-media-removed',
  'too-large': 'image-too-large-removed'
};

/** Removes unsafe media from one side (copy). Non-string values are left for validation to report. */
function sanitizeSide(side: unknown, where: Omit<ImportWarning, 'code'>, warnings: ImportWarning[]): unknown {
  if (!isRecord(side)) return side;
  const out: Record<string, unknown> = {};
  for (const key of SIDE_KEYS) if (side[key] !== undefined) out[key] = side[key];
  for (const field of ['image', 'audio'] as const) {
    const value = out[field];
    if (typeof value !== 'string') continue;
    const verdict = classifyMedia(value, field);
    if (verdict !== 'ok') {
      delete out[field];
      warnings.push({ code: WARNING_FOR[verdict], ...where, field });
    }
  }
  return out;
}

const tooLong = (value: unknown) => typeof value === 'string' && value.length > IMPORT_LIMITS.maxTextChars;

function checkLengths(item: Record<string, unknown>, where: { item: number; line?: number }, errors: ImportError[]): void {
  for (const side of ['front', 'back'] as const) {
    const s = item[side];
    if (!isRecord(s)) continue;
    for (const field of ['text', 'symbol', 'lang', 'alt'] as const) {
      if (tooLong(s[field])) errors.push({ code: 'text-too-long', ...where, side, field });
    }
  }
  if (tooLong(item.category) || (Array.isArray(item.tags) && item.tags.some(tooLong))) errors.push({ code: 'text-too-long', ...where });
}

const ISSUE_PATH = /^items\[(\d+)\](?:\.(front|back))?(?:\.(\w+))?/;

function issueToError(issue: DeckIssue, lines: readonly number[] | undefined): ImportError {
  const match = ISSUE_PATH.exec(issue.path);
  if (!match) return issue.path ? { code: issue.code, field: issue.path } : { code: issue.code };
  const index = Number(match[1]);
  const error: ImportError = { code: issue.code, item: index + 1 };
  const line = lines?.[index];
  if (line !== undefined) error.line = line;
  if (match[2]) error.side = match[2] as 'front' | 'back';
  if (match[3]) error.field = match[3];
  return error;
}

const cleanTitle = (title: unknown): Record<string, string> | undefined => {
  if (!isRecord(title)) return undefined;
  const entries = Object.entries(title).filter((e): e is [string, string] => typeof e[1] === 'string' && e[1].trim() !== '');
  return entries.length ? Object.fromEntries(entries.map(([k, v]) => [k, v.trim()])) : undefined;
};

/**
 * Turns untrusted CSV or JSON text into a safe, validated deck: enforces size limits,
 * removes remote/unsupported media (with warnings), validates the structure and maps
 * every problem to a card number (and CSV line). Never throws.
 */
export function importDeck(text: string, options: ImportOptions): ImportResult {
  const warnings: ImportWarning[] = [];
  const format = options.format ?? (text.trim() === '' ? undefined : detectFormat(text));
  const fail = (...errors: ImportError[]): ImportResult => ({ ok: false, format, errors, warnings });
  if (text.trim() === '' || format === undefined) return fail({ code: 'empty' });
  if (text.length > IMPORT_LIMITS.maxInputChars) return fail({ code: 'too-large' });

  let raw: Record<string, unknown>;
  let lines: number[] | undefined;
  if (format === 'json') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
    } catch {
      return fail({ code: 'json-syntax' });
    }
    if (!isRecord(parsed)) return fail({ code: 'type' });
    raw = { ...parsed };
  } else {
    const built = csvToDeck(text, options.id, options.title?.trim() || 'Deck');
    if (!built || built.deck.items.length === 0) return fail({ code: 'no-items' });
    if (built.headerless) warnings.push({ code: 'csv-no-header' });
    raw = { ...built.deck };
    lines = built.lines;
  }

  const title = format === 'csv' ? { en: options.title?.trim() || 'Deck' } : options.title?.trim() ? { en: options.title.trim() } : (cleanTitle(raw.title) ?? { en: 'Deck' });
  if (Object.values(title).some((v) => v.length > IMPORT_LIMITS.maxTitleChars)) return fail({ code: 'title-too-long' });
  if (!Array.isArray(raw.items) || raw.items.length === 0) return fail({ code: 'no-items' });
  if (raw.items.length > IMPORT_LIMITS.maxItems) return fail({ code: 'too-many-items' });

  const errors: ImportError[] = [];
  const items = raw.items.map((item: unknown, i) => {
    if (!isRecord(item)) return item;
    const where: { item: number; line?: number } = { item: i + 1 };
    const line = lines?.[i];
    if (line !== undefined) where.line = line;
    checkLengths(item, where, errors);
    return { ...item, front: sanitizeSide(item.front, { ...where, side: 'front' }, warnings), back: sanitizeSide(item.back, { ...where, side: 'back' }, warnings) };
  });
  const candidate: Record<string, unknown> = { schemaVersion: 1, id: options.id, title, items };
  const description = cleanTitle(raw.description);
  if (description) candidate.description = description;
  for (const key of ['license', 'source'] as const) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim() !== '') candidate[key] = value.trim().slice(0, IMPORT_LIMITS.maxTextChars);
  }
  const validated = validateDeck(candidate);
  if (!validated.ok) errors.push(...validated.issues.map((issue) => issueToError(issue, lines)));
  if (errors.length > 0 || !validated.ok) return fail(...errors);
  return { ok: true, deck: validated.deck, format, warnings };
}

/** Pretty JSON export of a deck (the documented import format, re-importable). */
export function deckToJson(deck: Deck): string {
  const clean: Deck = {
    schemaVersion: 1,
    id: deck.id,
    title: deck.title,
    ...(deck.description ? { description: deck.description } : {}),
    ...(deck.license ? { license: deck.license } : {}),
    ...(deck.source ? { source: deck.source } : {}),
    items: deck.items.map((item): LearningItem => {
      const side = (s: CardSide): CardSide => Object.fromEntries(SIDE_KEYS.filter((k) => s[k] !== undefined).map((k) => [k, s[k]])) as CardSide;
      return {
        id: item.id,
        front: side(item.front),
        back: side(item.back),
        ...(item.category !== undefined ? { category: item.category } : {}),
        ...(item.difficulty !== undefined ? { difficulty: item.difficulty } : {}),
        ...(item.tags !== undefined ? { tags: [...item.tags] } : {})
      };
    })
  };
  return `${JSON.stringify(clean, null, 2)}\n`;
}

/** Id for an imported deck: `user-<slug>-<hex>`. The random hex is injected (tests; `Math.random` is banned). */
export function userDeckId(title: string, randomHex: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
    .replace(/-+$/g, '');
  const suffix = randomHex.toLowerCase().replace(/[^a-f0-9]/g, '').slice(0, 12) || '0';
  return slug ? `user-${slug}-${suffix}` : `user-${suffix}`;
}

/** Ids of decks imported by the user (as opposed to built-in decks). */
export const USER_DECK_ID = /^user-[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isUserDeckId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && USER_DECK_ID.test(value);
}
