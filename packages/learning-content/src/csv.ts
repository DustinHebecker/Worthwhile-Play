import type { Deck, LearningItem } from './deck';
import { validateDeck } from './deck';

/** One parsed CSV record with the 1-based line number where it starts (for error messages). */
export interface CsvRow {
  fields: string[];
  line: number;
}

/**
 * Parses RFC-4180 CSV (comma separated, double-quote escaping, CRLF or LF) and keeps
 * the starting line of each record. Blank records are dropped. Never throws; an
 * unterminated quote consumes the rest of the input.
 */
export function parseCsvRows(input: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  const text = input.replace(/^﻿/, '');
  const endRow = () => {
    row.push(field);
    rows.push({ fields: row, line: rowLine });
    row = [];
    field = '';
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else {
        if (c === '\n' || (c === '\r' && text[i + 1] !== '\n')) line++;
        field += c;
      }
    } else if (c === '"' && field === '') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      endRow();
      line++;
      rowLine = line;
    } else field += c;
  }
  if (field !== '' || row.length > 0) endRow();
  return rows.filter((r) => r.fields.some((f) => f.trim() !== ''));
}

/** Parses RFC-4180 CSV into rows of fields (see `parseCsvRows`). Never throws. */
export function parseCsv(input: string): string[][] {
  return parseCsvRows(input).map((r) => r.fields);
}

export const CSV_COLUMNS = ['front_text', 'back_text', 'front_lang', 'back_lang', 'front_image', 'back_image', 'front_audio', 'back_audio', 'category', 'tags', 'difficulty'] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];

export interface CsvDeckResult {
  /** The unvalidated deck built from the CSV (validate it before trusting it). */
  deck: Deck;
  /** Source line of each item, parallel to `deck.items`. */
  lines: number[];
  /** True when the first row contained no known column name and was read as data (`front_text,back_text`). */
  headerless: boolean;
}

/**
 * Builds an (unvalidated) deck from CSV. With a header row, columns are matched by
 * name (case-insensitive, any order); without one (no known column in the first row),
 * the first two columns are read as `front_text` and `back_text`.
 */
export function csvToDeck(csv: string, id: string, title: string): CsvDeckResult | undefined {
  const rows = parseCsvRows(csv);
  const [header] = rows;
  if (!header) return undefined;
  const names = header.fields.map((h) => h.trim().toLowerCase());
  const headerless = !names.some((n) => (CSV_COLUMNS as readonly string[]).includes(n));
  const index: Record<string, number> = headerless
    ? { front_text: 0, back_text: 1 }
    : Object.fromEntries(CSV_COLUMNS.map((c) => [c, names.indexOf(c)]));
  const dataRows = headerless ? rows : rows.slice(1);
  const get = (row: string[], column: CsvColumn) => {
    const i = index[column] ?? -1;
    const value = i >= 0 ? row[i]?.trim() : undefined;
    return value === '' ? undefined : value;
  };
  const side = (row: string[], prefix: 'front' | 'back') => {
    const s: Record<string, string> = {};
    for (const key of ['text', 'lang', 'image', 'audio'] as const) {
      const value = get(row, `${prefix}_${key}`);
      if (value !== undefined) s[key] = value;
    }
    return s;
  };
  const items: LearningItem[] = dataRows.map(({ fields: row }, i) => {
    const item: LearningItem = { id: `${id}-${i + 1}`, front: side(row, 'front'), back: side(row, 'back') };
    const category = get(row, 'category');
    if (category) item.category = category;
    const tags = get(row, 'tags');
    if (tags) item.tags = tags.split(';').map((t) => t.trim()).filter(Boolean);
    const difficulty = get(row, 'difficulty');
    if (difficulty) item.difficulty = Number(difficulty);
    return item;
  });
  return { deck: { schemaVersion: 1, id, title: { en: title }, items }, lines: dataRows.map((r) => r.line), headerless };
}

/**
 * Converts a CSV with a header row into a validated deck. Required columns: `front_text`,
 * `back_text` (or the image/audio equivalents). `tags` are separated by `;`.
 * Documented in docs/content/deck-format.md.
 */
export function deckFromCsv(csv: string, id: string, title: string): ReturnType<typeof validateDeck> {
  const built = csvToDeck(csv, id, title);
  if (!built) return { ok: false, issues: [{ path: 'csv', code: 'required' }] };
  return validateDeck(built.deck);
}

const csvField = (value: string | number | undefined): string => {
  const text = value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Serializes a deck as CSV with a header row (only the columns the format supports;
 * `symbol`/`alt` have no CSV column and are omitted). Inverse of `csvToDeck` for
 * text/language/image/audio/category/tags/difficulty.
 */
export function deckToCsv(deck: Deck): string {
  const lines = [CSV_COLUMNS.join(',')];
  for (const item of deck.items) {
    const values: Record<CsvColumn, string | number | undefined> = {
      front_text: item.front.text,
      back_text: item.back.text,
      front_lang: item.front.lang,
      back_lang: item.back.lang,
      front_image: item.front.image,
      back_image: item.back.image,
      front_audio: item.front.audio,
      back_audio: item.back.audio,
      category: item.category,
      tags: item.tags?.join('; '),
      difficulty: item.difficulty
    };
    lines.push(CSV_COLUMNS.map((c) => csvField(values[c])).join(','));
  }
  return `${lines.join('\r\n')}\r\n`;
}
