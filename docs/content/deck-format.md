# Deck format

Learning content (Memory variants, vocabulary, geography, Faces & Names, user imports) uses one generic model, defined in `packages/learning-content/src/deck.ts`.

## JSON

```json
{
  "schemaVersion": 1,
  "id": "animals-de-en",
  "title": { "en": "Animals (German → English)", "de": "Tiere (Deutsch → Englisch)" },
  "license": "CC0-1.0",
  "items": [
    { "id": "dog", "front": { "text": "Hund", "lang": "de" }, "back": { "text": "dog", "lang": "en" }, "tags": ["animals"], "difficulty": 1 },
    { "id": "cat", "front": { "image": "cat.webp", "alt": "cat" }, "back": { "text": "Katze", "lang": "de", "audio": "katze.mp3" } }
  ]
}
```

- A card side may combine `text`, `image`, `symbol` (emoji/glyph), `audio`; at least one is required. `alt` describes image/symbol-only sides.
- `lang` is any BCP-47 tag. Content languages are independent of the UI language.
- `difficulty` is 1–5; `tags` are free strings; `category` is a free string.
- Bundled decks must declare a `license`.

## CSV

Header row with any of: `front_text, back_text, front_lang, back_lang, front_image, back_image, front_audio, back_audio, category, tags, difficulty` (case-insensitive, any order). RFC-4180 quoting; `tags` separated by `;`. If the first row contains none of these names, the file is read without a header: column 1 is the front text, column 2 the back text (the import says so). CSV has no column for `symbol`/`alt`; use JSON for those.

```csv
front_text,back_text,front_lang,back_lang,tags
Hund,dog,de,en,animals
"Opportunity cost","Value of the best alternative not chosen",en,en,business; economics
```

Validation never throws; it returns a list of issues with paths (e.g. `items[3].front.lang: language-tag`).

## Audio

Only bundled audio is guaranteed offline. Browser speech synthesis is a best-effort fallback whose voices vary by device.

## Importing your own decks (`/decks/import`)

Import and storage are **local only**: the file is read in the browser, checked, previewed and stored in IndexedDB on this device. Nothing is uploaded and there is no telemetry. Export (`/decks/<id>` → "Export as JSON") produces the JSON format above and re-imports identically (only the deck id is new; item ids, titles, descriptions, licence, source, tags, categories and difficulties are kept; tested).

The importer (`importDeck` in `packages/learning-content/src/import.ts`):

- detects the format (text starting with `{` is JSON, anything else CSV) and always assigns a fresh id `user-<name>-<random hex>`, so imports never collide with built-in or earlier decks; item ids from JSON are kept;
- reports every problem with the card number and, for CSV, the line (e.g. "Line 4 (card 3): The back is empty."), translated in all 16 UI languages;
- shows a preview of the first 20 cards before anything is saved.

### Create with an AI (ADR 0013)

The import page has a section "Create with an AI": the person copies a link to a **guide for AIs** in the UI language and gives it, with a description of the deck they want, to an AI of their choice. The app itself never calls an AI service.

- Guides: `/ai/deck-guide.<locale>.md` for the 16 UI locales (e.g. `https://worthwhile-play.pages.dev/ai/deck-guide.de.md`), Markdown, generated at build time from `packages/learning-content/src/ai-guide.ts` (prose per locale in `ai-guide-text.ts`; the technical reference is English, identical in all locales and built from `IMPORT_LIMITS`). Never edit the generated files; a test imports the example of every guide with `importDeck`.
- The guide asks the AI for original content in its own words, checked facts, short sides, unique fronts and backs, language tags and no personal data, and to deliver either a direct link or a JSON file.
- **Direct link**: `https://worthwhile-play.pages.dev/decks/import#deck=<DATA>`, where `DATA` is base64url (RFC 4648 §5, no padding; standard base64 is accepted too) of the UTF-8 bytes of the deck JSON (`deckLink`, `decodeDeckLinkData` in `packages/learning-content/src/link.ts`). The fragment is never sent to a server. The page decodes it on the device (at most 2,000,000 bytes, checked before decoding; strict UTF-8), removes it from the address bar at once and opens the normal preview with all checks above (JSON only). Nothing is saved before "Save deck". An unreadable or too large link shows a message suggesting a JSON file. The guide recommends links of at most 8,000 characters, because longer links are often cut off by chat apps and browsers.
- **JSON file**: the fallback; selected under "File" like any other file.

### Privacy: images and audio

The app's Content Security Policy only allows images from the app itself, `data:` and `blob:` URLs. The importer enforces the same rule *before* storing a deck, so opening a deck can never contact another server:

| Reference | Result |
|---|---|
| `http://…`, `https://…`, `//host/…`, `ftp://…` | removed, with the warning "A link to another website was removed" |
| `data:image/…;base64,…` (png, jpeg, gif, webp or avif) up to the size limit | kept (embedded image) |
| larger embedded images | removed with a warning |
| other schemes (`javascript:`, `blob:`, `data:image/svg+xml`, `data:audio/…`), Windows paths, `..` | removed with a warning |
| relative paths of bundled files (`img/cat.webp`, `/decks/x.png`) | kept |

If removing a reference leaves a card side empty, that card is reported as an error.

### Limits

| Limit | Value |
|---|---|
| Size of the pasted text or file | 2,000,000 characters (≈ 2 MB) |
| Cards per deck | 1,000 |
| Length of one text, language tag, category or tag | 300 characters |
| Deck name | 120 characters |
| One embedded image (`data:` URL length) | 100,000 characters (≈ 75 KB of image data) |
| Imported decks per device | 100 |

Constants: `IMPORT_LIMITS` in `packages/learning-content/src/import.ts`.

## Built-in decks

| Deck | Content | Languages |
|---|---|---|
| Symbols (`symbols`) | 24 emoji pictures, same picture on both sides | language-neutral; names translated in Memory |
| First words (`first-words`) | 60 everyday concrete nouns with an emoji picture | all 16 UI languages; front = picture + word in the learning language, back = word in the translation language |
| Flags & countries (`flags`) | 60 widely recognised, undisputed countries (ISO 3166-1 alpha-2) | names from the browser's CLDR data (`Intl.DisplayNames`) in the learning language (or the UI language); flags are regional-indicator emoji |
| Capitals (`capitals`) | 56 of the flags countries with an unambiguous capital (South Africa, Indonesia, Tunisia and Mongolia left out, reasons in `CAPITAL_EXCLUSIONS`) | country names from CLDR, capital names written for the project in the 16 UI languages; learning language → UI language → English |
| AI basics (`ai-basics`) | 40 terms people meet when reading about AI (model, token, context window, hallucination, …), each with a short definition; front = term, back = definition | term and definition written for the project in the 16 UI languages, both in the learning language → UI language → English |

*Capitals* conventions (`packages/learning-content/src/builtin/capitals.ts`): the everyday exonym of each language; Portuguese follows Brazilian usage, Chinese is Simplified. Ukraine's capital uses the current standard form of each language: Kyiv (en, fr, nl), Kyjiw (de), Київ (uk), Киев (ru), Kijów (pl), Kiev (es per RAE, it, pt, tr), كييف (ar), कीव (hi), キーウ (ja, official since 2022), 키이우 (ko), 基辅 (zh-Hans).

*First words* conventions: singular, the most common everyday word; German, Dutch, Spanish, French, Portuguese and Italian include the definite article ("der Apfel", "de appel", "la manzana", "la pomme", "a maçã", "la mela") because the gender belongs to the word; other languages show the bare noun. Portuguese is Brazilian Portuguese (pt-BR, like the whole UI: the locale `pt` means pt-BR), Chinese is Simplified. Translations other than en/de are AI-assisted and await native-speaker review (like the UI).

*AI basics* conventions (`packages/learning-content/src/builtin/ai-basics.ts`): the term is the established technical term of each language, often a loanword ("Token", "トークン"), with a common alternative or abbreviation in brackets ("Künstliche Intelligenz (KI)", "Überanpassung (Overfitting)"). Each definition is one neutral, factual sentence (English at most 140 characters) that describes what a system does without claiming it thinks or understands, and names no brand or product. So that every definition card in Memory matches exactly one term, tests check per language that terms and definitions are unique and that no definition contains its own term or its bracketed alternative (from a word start; anywhere in Japanese and Chinese). Written for the project, no glossary or other third-party text used; en and de written first, the other 14 languages are AI-assisted translations awaiting native-speaker review. Memory lays boards with long texts (wider than 40 characters, CJK characters counting double) out in at most 3 columns with taller cards; *Review* sets long texts smaller and in normal weight.

Language fallbacks (`resolveContentLanguages`): learning language → UI language → English; translation language → UI language → English → German (never the same as the learning language); country names in the learning language if the browser has CLDR names for it, else the UI language. Flags depend on the system emoji font (Windows shows two letters instead of a flag).


## Learning records

Reviewing a deck in the *Review* game stores small learning records on the device (IndexedDB store `learning`, never uploaded): per card and direction a Leitner box, the next suggested day and a few counts — see [architecture.md](../architecture.md#learning-records-items-worth-reviewing). Records refer to item ids, so keep `id`s stable when you edit and re-import a JSON deck if you want to keep them (a re-import gets a new deck id; records of the old deck are deleted with it). The *Symbols* deck is not reviewable (both sides are the same).
