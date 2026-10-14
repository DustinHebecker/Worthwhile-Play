import { IMPORT_LIMITS } from './import';

/**
 * Direct links to the import preview: `/decks/import#deck=<base64url(UTF-8 JSON)>`.
 *
 * The deck travels in the URL fragment, which browsers never send to a server; the app decodes it on the
 * device and opens the normal import preview (validation, confirmation). Documented in
 * docs/content/deck-format.md and in the guide for AIs (`./ai-guide.ts`).
 */
export const DECK_LINK_PATH = '/decks/import';
export const DECK_LINK_PARAM = 'deck';

/** Largest decoded deck a link may carry: the importer's input limit, counted in UTF-8 bytes (≥ characters). */
export const DECK_LINK_MAX_BYTES = IMPORT_LIMITS.maxInputChars;
/** Largest encoded payload (base64 of `DECK_LINK_MAX_BYTES`, plus optional padding). */
export const DECK_LINK_MAX_CHARS = Math.ceil(DECK_LINK_MAX_BYTES / 3) * 4;
/**
 * Longest link the guide recommends: longer links are often cut off by chat apps, e-mail or browsers,
 * so larger decks should be delivered as a JSON file.
 */
export const DECK_LINK_RECOMMENDED_MAX_CHARS = 8000;

/** Path of the guide for AIs in one UI locale (served as a static Markdown file). */
export const deckGuidePath = (locale: string): string => `/ai/deck-guide.${locale}.md`;

const BASE64URL = /^[A-Za-z0-9_-]*$/;

/** Base64url (RFC 4648 §5, no padding) of the UTF-8 bytes of `text`. */
export function encodeDeckLinkData(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Full direct link: `<origin>/decks/import#deck=<data>`. */
export function deckLink(origin: string, json: string): string {
  return `${origin.replace(/\/+$/, '')}${DECK_LINK_PATH}#${DECK_LINK_PARAM}=${encodeDeckLinkData(json)}`;
}

export type DeckLinkResult = { ok: true; text: string } | { ok: false; code: 'invalid' | 'too-large' };

/** The raw `deck=` value of a URL fragment (`#deck=…`, also `#a=b&deck=…`), or `undefined` if there is none. */
export function deckLinkData(hash: string): string | undefined {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  for (const part of fragment.split('&')) {
    if (part.startsWith(`${DECK_LINK_PARAM}=`)) return part.slice(DECK_LINK_PARAM.length + 1);
  }
  return undefined;
}

/**
 * Decodes the data of a direct link into text for the importer. Untrusted input: accepts base64url and
 * standard base64 (with or without padding, also percent-encoded padding), rejects anything else, enforces
 * the size limit before decoding and requires valid UTF-8. Never throws.
 */
export function decodeDeckLinkData(data: string): DeckLinkResult {
  let value = data.trim().replace(/%3D/gi, '=').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (value.length > DECK_LINK_MAX_CHARS) return { ok: false, code: 'too-large' };
  if (value === '' || !BASE64URL.test(value) || value.length % 4 === 1) return { ok: false, code: 'invalid' };
  value = value.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(value + '='.repeat((4 - (value.length % 4)) % 4));
    if (binary.length > DECK_LINK_MAX_BYTES) return { ok: false, code: 'too-large' };
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return text.trim() === '' ? { ok: false, code: 'invalid' } : { ok: true, text };
  } catch {
    return { ok: false, code: 'invalid' };
  }
}
