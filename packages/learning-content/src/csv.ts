import type { Deck, LearningItem } from './deck';
import { validateDeck } from './deck';

/**
 * Parses RFC-4180 CSV (comma separated, double-quote escaping, CRLF or LF).
 * Returns rows of fields. Never throws; an unterminated quote consumes the rest.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const text = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

const COLUMNS = ['front_text', 'back_text', 'front_lang', 'back_lang', 'front_image', 'back_image', 'front_audio', 'back_audio', 'category', 'tags', 'difficulty'] as const;

/**
 * Converts a CSV with a header row into a deck. Required columns: `front_text`,
 * `back_text` (or the image/audio equivalents). `tags` are separated by `;`.
 * Documented in docs/content/deck-format.md.
 */
export function deckFromCsv(csv: string, id: string, title: string): ReturnType<typeof validateDeck> {
  const [header, ...rows] = parseCsv(csv);
  if (!header) return { ok: false, issues: [{ path: 'csv', code: 'required' }] };
  const index = Object.fromEntries(COLUMNS.map((c) => [c, header.findIndex((h) => h.trim().toLowerCase() === c)]));
  const get = (row: string[], column: (typeof COLUMNS)[number]) => {
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
  const items: LearningItem[] = rows.map((row, i) => {
    const item: LearningItem = { id: `${id}-${i + 1}`, front: side(row, 'front'), back: side(row, 'back') };
    const category = get(row, 'category');
    if (category) item.category = category;
    const tags = get(row, 'tags');
    if (tags) item.tags = tags.split(';').map((t) => t.trim()).filter(Boolean);
    const difficulty = get(row, 'difficulty');
    if (difficulty) item.difficulty = Number(difficulty);
    return item;
  });
  const deck: Deck = { schemaVersion: 1, id, title: { en: title }, items };
  return validateDeck(deck);
}
