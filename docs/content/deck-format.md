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

Header row with any of: `front_text, back_text, front_lang, back_lang, front_image, back_image, front_audio, back_audio, category, tags, difficulty`. RFC-4180 quoting; `tags` separated by `;`.

```csv
front_text,back_text,front_lang,back_lang,tags
Hund,dog,de,en,animals
"Opportunity cost","Value of the best alternative not chosen",en,en,business; economics
```

Validation never throws; it returns a list of issues with paths (e.g. `items[3].front.lang: language-tag`).

## Audio

Only bundled audio is guaranteed offline. Browser speech synthesis is a best-effort fallback whose voices vary by device.
