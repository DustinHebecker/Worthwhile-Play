import { VOCABULARY_LANGUAGES, type VocabularyLanguage } from './builtin/first-words';
import { IMPORT_LIMITS } from './import';
import { DECK_GUIDE_TEXT, type DeckGuideText } from './ai-guide-text';
import { DECK_LINK_MAX_BYTES, DECK_LINK_PATH, DECK_LINK_RECOMMENDED_MAX_CHARS, deckGuidePath, deckLink } from './link';

/**
 * The guide for AIs ("Create a deck with an AI"), one Markdown file per UI locale, served by the app at
 * `/ai/deck-guide.<locale>.md` (generated at build time by apps/web/ai-guide-plugin.ts; never committed, so it
 * cannot drift from the importer). The prose is translated (`./ai-guide-text.ts`); the technical reference is
 * English and identical in every locale and is built from `IMPORT_LIMITS` and the link constants, so the
 * limits it states are always the importer's. Tests import the example of every guide with `importDeck`.
 *
 * The app itself never contacts an AI service: the person copies the guide link into an AI of their choice.
 */
export const DECK_GUIDE_LOCALES: readonly VocabularyLanguage[] = VOCABULARY_LANGUAGES;
export { DECK_GUIDE_TEXT, type DeckGuideText };

/** Production origin named in the guides (the files are static, so they cannot know where they are served). */
export const DEFAULT_GUIDE_ORIGIN = 'https://worthwhile-play.pages.dev';

/** The complete, valid example deck of every guide (JSON input as the importer accepts it). */
export const DECK_GUIDE_EXAMPLE = {
  schemaVersion: 1,
  id: 'fruit-es-en',
  title: { en: 'Fruit in Spanish', es: 'Frutas en español', de: 'Obst auf Spanisch' },
  description: { en: 'Six fruits: Spanish word with a picture → English word.' },
  source: 'Written with an AI assistant',
  items: [
    { id: 'apple', front: { text: 'la manzana', lang: 'es', symbol: '🍎' }, back: { text: 'apple', lang: 'en' }, tags: ['fruit'], difficulty: 1 },
    { id: 'orange', front: { text: 'la naranja', lang: 'es', symbol: '🍊' }, back: { text: 'orange', lang: 'en' }, tags: ['fruit'], difficulty: 1 },
    { id: 'strawberry', front: { text: 'la fresa', lang: 'es', symbol: '🍓' }, back: { text: 'strawberry', lang: 'en' }, tags: ['fruit'], difficulty: 2 },
    { id: 'grapes', front: { text: 'las uvas', lang: 'es', symbol: '🍇' }, back: { text: 'grapes', lang: 'en' }, tags: ['fruit'], difficulty: 2 },
    { id: 'pear', front: { text: 'la pera', lang: 'es', symbol: '🍐' }, back: { text: 'pear', lang: 'en' }, tags: ['fruit'] },
    { id: 'lemon', front: { text: 'el limón', lang: 'es', symbol: '🍋' }, back: { text: 'lemon', lang: 'en' }, category: 'fruit', difficulty: 3 }
  ]
} as const;

const n = (value: number) => value.toLocaleString('en-US');
const L = IMPORT_LIMITS;

/** English technical reference, identical in every locale (built from the importer's limits). */
function technicalReference(origin: string): string {
  return `### JSON format

One JSON object, UTF-8. Fields not listed here are ignored. Every text below may have at most ${n(L.maxTextChars)} characters.

| Field | Required | Value |
|---|---|---|
| \`schemaVersion\` | recommended | the number \`1\` |
| \`id\` | optional | short text; the app replaces it with its own id on import |
| \`title\` | recommended | object: language tag → deck name (at most ${n(L.maxTitleChars)} characters each), e.g. \`{"en": "Fruit", "es": "Frutas"}\`; without a title the deck is called "Deck" |
| \`description\` | optional | object: language tag → one-sentence description |
| \`license\` | optional | text, e.g. \`CC0-1.0\` |
| \`source\` | optional | text, e.g. \`Written with an AI assistant\` |
| \`items\` | required | array of 1 to ${n(L.maxItems)} cards |

Card (each entry of \`items\`):

| Field | Required | Value |
|---|---|---|
| \`id\` | required | text, unique within the deck, e.g. \`apple\`; keep ids stable when you revise a deck |
| \`front\` | required | side (see below): the prompt |
| \`back\` | required | side (see below): the answer |
| \`category\` | optional | text |
| \`tags\` | optional | array of texts |
| \`difficulty\` | optional | whole number from 1 (easy) to 5 (hard) |

Side (\`front\`, \`back\`): at least one of \`text\`, \`symbol\` or \`image\` must be present and not empty.

| Field | Value |
|---|---|
| \`text\` | the text of the side; a line break is written as \`\\n\` |
| \`lang\` | BCP-47 language tag of \`text\`, matching \`^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$\`, e.g. \`en\`, \`de\`, \`pt-BR\`, \`zh-Hans\` |
| \`symbol\` | one emoji or other character used as a picture, e.g. \`🍎\` |
| \`alt\` | short description of a side that has only a \`symbol\` or an \`image\` |
| \`image\` | only an embedded image \`data:image/png;base64,…\` (png, jpeg, gif, webp or avif) of at most ${n(L.maxImageChars)} characters; links (\`http:\`, \`https:\`, \`//\`) and other schemes are removed. Prefer \`symbol\`. |
| \`audio\` | do not use: only audio files bundled with the app work |

Whole deck: at most ${n(L.maxInputChars)} characters of JSON. A device keeps at most ${n(L.maxDecks)} imported decks.

### Direct link

\`\`\`text
${origin}${DECK_LINK_PATH}#deck=<DATA>
\`\`\`

- \`DATA\` is base64url (RFC 4648 §5: \`A–Z a–z 0–9 - _\`, no \`=\` padding) of the UTF-8 bytes of the deck JSON. Use compact JSON (no indentation).
- The part after \`#\` is never sent to a server: the app decodes it in the browser, checks the deck and shows the import preview. Nothing is saved until the person confirms.
- The app accepts at most ${n(DECK_LINK_MAX_BYTES)} bytes of JSON in a link, but links longer than ${n(DECK_LINK_RECOMMENDED_MAX_CHARS)} characters are often cut off by chat apps, e-mail or browsers. Above ${n(DECK_LINK_RECOMMENDED_MAX_CHARS)} characters, deliver a JSON file instead.
- Encode with a tool, never by hand. Python: \`base64.urlsafe_b64encode(json.dumps(deck, ensure_ascii=False, separators=(",", ":")).encode("utf-8")).decode("ascii").rstrip("=")\`. JavaScript (Node.js): \`Buffer.from(JSON.stringify(deck), "utf8").toString("base64url")\`.
- Check the link: decode \`DATA\` again and compare it with your JSON. Show the complete link; do not shorten it or put it behind a link shortener.

### JSON file

Save the deck as a \`.json\` file (UTF-8). Indentation is allowed. The person selects it on the import page (${origin}${DECK_LINK_PATH}); pasting the JSON text there works too.`;
}

/** The example as readable JSON: deck fields on their own lines, one card per line. */
function exampleJson(): string {
  const { items, ...head } = DECK_GUIDE_EXAMPLE;
  const fields = Object.entries(head).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  const cards = items.map((item, i) => `    ${JSON.stringify(item)}${i < items.length - 1 ? ',' : ''}`);
  return ['{', ...fields, '  "items": [', ...cards, '  ]', '}'].join('\n');
}

const bullets = (lines: readonly string[]) => lines.map((line) => `- ${line}`).join('\n');
const fill = (text: string, params: Readonly<Record<string, string>>) => text.replace(/\{(\w+)\}/g, (match, key: string) => params[key] ?? match);

/** The guide for AIs in `locale` (one of the 16 UI locales), naming links on `origin`. */
export function deckGuideMarkdown(locale: VocabularyLanguage, origin: string = DEFAULT_GUIDE_ORIGIN): string {
  const t = DECK_GUIDE_TEXT[locale];
  const base = origin.replace(/\/+$/, '');
  const params = { max: n(DECK_LINK_RECOMMENDED_MAX_CHARS), importUrl: `${base}${DECK_LINK_PATH}` };
  const json = exampleJson();
  const others = DECK_GUIDE_LOCALES.filter((l) => l !== locale).map((l) => `[${l}](${base}${deckGuidePath(l)})`).join(' · ');
  return `# ${t.title}

${t.intro}

${t.language}

## ${t.deliveryTitle}

1. ${t.deliveryLink}
2. ${fill(t.deliveryFile, params)}

${t.deliveryConfirm}

## ${t.contentTitle}

${bullets(t.rules)}

## ${t.sidesTitle}

${t.sides}

## ${t.exampleTitle}

${t.exampleIntro}

\`\`\`json
${json}
\`\`\`

${t.exampleLink}

\`\`\`text
${deckLink(base, JSON.stringify(DECK_GUIDE_EXAMPLE))}
\`\`\`

## ${t.checklistTitle}

${bullets(t.checklist)}

## ${t.referenceTitle}

${t.referenceNote}

${technicalReference(base)}

---

${others}
`;
}

/** All guide files: published path (no leading slash) → Markdown. */
export function deckGuideFiles(origin: string = DEFAULT_GUIDE_ORIGIN): Record<string, string> {
  return Object.fromEntries(DECK_GUIDE_LOCALES.map((locale) => [deckGuidePath(locale).slice(1), deckGuideMarkdown(locale, origin)]));
}
