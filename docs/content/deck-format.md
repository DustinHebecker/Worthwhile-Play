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

Import and storage are **local only**: the file is read in the browser, checked, previewed and stored in IndexedDB on this device. Nothing is uploaded and there is no telemetry. Export (`/decks/<id>` → "Export as JSON") produces the JSON format above and can be re-imported.

The importer (`importDeck` in `packages/learning-content/src/import.ts`):

- detects the format (text starting with `{` is JSON, anything else CSV) and always assigns a fresh id `user-<name>-<random hex>`, so imports never collide with built-in or earlier decks; item ids from JSON are kept;
- reports every problem with the card number and, for CSV, the line (e.g. "Line 4 (card 3): The back is empty."), translated in all 16 UI languages;
- shows a preview of the first 20 cards before anything is saved.

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

*First words* conventions: singular, the most common everyday word; German, Dutch, Spanish, French, Portuguese and Italian include the definite article ("der Apfel", "de appel", "la manzana", "la pomme", "a maçã", "la mela") because the gender belongs to the word; other languages show the bare noun. Portuguese follows Brazilian usage (like the UI), Chinese is Simplified. Translations other than en/de are AI-assisted and await native-speaker review (like the UI).

Language fallbacks (`resolveContentLanguages`): learning language → UI language → English; translation language → UI language → English → German (never the same as the learning language); country names in the learning language if the browser has CLDR names for it, else the UI language. Flags depend on the system emoji font (Windows shows two letters instead of a flag).

