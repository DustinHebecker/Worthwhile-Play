// @ts-nocheck
import { isRecord } from '@wp/game-core';

/**
 * Generic learning-item model shared by Memory, Faces & Names, vocabulary,
 * geography and user-imported decks. One side of a card may combine text,
 * image and audio. Language tags are BCP-47 and independent of the UI locale.
 */
export interface CardSide {
  text?: string;
  /** Image URL (relative to the deck or app) or a single emoji/symbol glyph via `symbol`. */
  image?: string;
  /** Language-neutral glyph (emoji/symbol) used by symbol decks. */
  symbol?: string;
  /** Audio URL. Bundled audio is the only guaranteed-offline audio source. */
  audio?: string;
  /** BCP-47 language of `text`/`audio`. Enables speech synthesis fallback. */
  lang?: string;
  /** Accessible description for image/symbol-only sides. */
  alt?: string;
}

export interface LearningItem {
  id: string;
  front: CardSide;
  back: CardSide;
  category?: string;
  /** 1 (easy) … 5 (hard). */
  difficulty?: number;
  tags?: string[];
}

/** Title in several languages; keyed by BCP-47 tag. */
export type LocalizedText = Readonly<Record<string, string>>;

export interface Deck {
  schemaVersion: 1;
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  /** SPDX identifier or free text for the content license. Required for bundled decks. */
  license?: string;
  source?: string;
  items: LearningItem[];
}

export interface DeckIssue {
  path: string;
  code: 'type' | 'required' | 'duplicate-id' | 'empty-side' | 'range' | 'language-tag';
}

const LANG = /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/;
const optString = (v: unknown) => v === undefined || typeof v === 'string';

function validateSide(side: unknown, path: string, issues: DeckIssue[]): void {
  if (!isRecord(side)) {
    issues.push({ path, code: 'type' });
    return;
  }
  for (const key of ['text', 'image', 'symbol', 'audio', 'lang', 'alt'] as const) {
    if (!optString(side[key])) issues.push({ path: `${path}.${key}`, code: 'type' });
  }
  const hasContent = ['text', 'image', 'symbol', 'audio'].some((k) => typeof side[k] === 'string' && (side[k] as string).trim() !== '');
  if (!hasContent) issues.push({ path, code: 'empty-side' });
  if (typeof side.lang === 'string' && !LANG.test(side.lang)) issues.push({ path: `${path}.lang`, code: 'language-tag' });
}

/** Validates untrusted deck data (e.g. a user import). Never throws. */
export function validateDeck(value: unknown): { ok: true; deck: Deck } | { ok: false; issues: DeckIssue[] } {
  const issues: DeckIssue[] = [];
  if (!isRecord(value)) return { ok: false, issues: [{ path: '', code: 'type' }] };
  if (value.schemaVersion !== 1) issues.push({ path: 'schemaVersion', code: 'required' });
  if (typeof value.id !== 'string' || value.id.trim() === '') issues.push({ path: 'id', code: 'required' });
  if (!isRecord(value.title) || Object.keys(value.title).length === 0) issues.push({ path: 'title', code: 'required' });
  if (!Array.isArray(value.items) || value.items.length === 0) {
    issues.push({ path: 'items', code: 'required' });
  } else {
    const seen = new Set<string>();
    value.items.forEach((item: unknown, i) => {
      const path = `items[${i}]`;
      if (!isRecord(item)) {
        issues.push({ path, code: 'type' });
        return;
      }
      if (typeof item.id !== 'string' || item.id === '') issues.push({ path: `${path}.id`, code: 'required' });
      else if (seen.has(item.id)) issues.push({ path: `${path}.id`, code: 'duplicate-id' });
      else seen.add(item.id);
      validateSide(item.front, `${path}.front`, issues);
      validateSide(item.back, `${path}.back`, issues);
      if (item.difficulty !== undefined && !(Number.isInteger(item.difficulty) && (item.difficulty as number) >= 1 && (item.difficulty as number) <= 5)) {
        issues.push({ path: `${path}.difficulty`, code: 'range' });
      }
      if (item.tags !== undefined && !(Array.isArray(item.tags) && item.tags.every((t) => typeof t === 'string'))) issues.push({ path: `${path}.tags`, code: 'type' });
      if (!optString(item.category)) issues.push({ path: `${path}.category`, code: 'type' });
    });
  }
  return issues.length === 0 ? { ok: true, deck: value as unknown as Deck } : { ok: false, issues };
}

/** Localized text lookup: exact tag → base language → English → first available. */
export function pickText(text: LocalizedText, locale: string): string {
  const base = locale.split('-')[0] ?? locale;
  return text[locale] ?? text[base] ?? text.en ?? Object.values(text)[0] ?? '';
}
