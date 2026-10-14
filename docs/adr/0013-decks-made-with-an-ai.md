# 0013 — Decks made with an AI: a guide link and direct import links

Status: Accepted (2026-10-14).

## Context
People want learning decks on topics the built-in decks do not cover, and many already use a chat AI. The owner's other app offers "Create with AI": a link to a guide written for AIs, which the person gives to an AI of their choice, and an import of the result. Worthwhile Play must stay local-first: no AI service is called by the app, no tracking, nothing uploaded (spec "Privacy": AI functionality must say clearly whether a local model or a remote service is used). The guide must never drift from what the importer accepts.

## Decision
- **No AI in the app.** The app shows a link to a guide and imports what the person brings back. Which AI they use, and what they tell it, is their choice and happens outside the app. The texts say so, and that a deck is checked only technically, not for correctness.
- **Guides for AIs**: static Markdown files, one per UI locale, at `/ai/deck-guide.<locale>.md` (for example `/ai/deck-guide.de.md`). They are generated at build time from one TypeScript source, `packages/learning-content/src/ai-guide.ts` (prose in `ai-guide-text.ts`), by `apps/web/ai-guide-plugin.ts`, and never committed. The prose is translated; the technical reference (fields, limits, link format) is English and identical in every locale and is built from `IMPORT_LIMITS` and the link constants. Tests import the example of every guide with the real importer. The guides name the production origin (`WP_SITE_ORIGIN` overrides it for other deployments). They are not precached, and the service worker does not answer them with the app shell (`navigateFallbackDenylist`). Cloudflare serves them as `text/markdown` with `Access-Control-Allow-Origin: *` (`_headers`).
- **Direct links**: `<origin>/decks/import#deck=<DATA>`, `DATA` = base64url (RFC 4648 §5, no padding) of the UTF-8 bytes of the deck JSON. The fragment is never sent to a server. The import page decodes it as untrusted input (base64url or base64, size cap before decoding at the importer's input limit, counted in bytes; strict UTF-8), removes the fragment from the address bar and history entry immediately, and opens the existing import preview with its validation (JSON only). Nothing is saved until the person chooses "Save deck". Unreadable or too large links show a translated message that suggests a JSON file. The guide recommends links of at most 8 000 characters and a JSON file above that, because longer links are often cut off.
- **JSON file**: the fallback (and the format of "Export as JSON"); selected under "File" on the import page as before.

## Consequences
+ People can create decks on any topic with the AI they already use; the app stays free of AI services, accounts and tracking.
+ The guide's limits and example are generated from and tested against the importer, so an AI that follows the guide produces a deck that imports.
+ `#deck=` and `/ai/deck-guide.<locale>.md` are public contracts: AIs and people will keep old links. Changing the encoding or the paths needs a new ADR and should stay backwards compatible.
− The content of an AI-made deck can be wrong; the app can only check its form. The page says so; the person reviews the cards.
− Long links may be truncated by the tools in between; the guide and the error message point to the JSON file.
