# Architecture

## Principles (from the spec)

1. **Every game is closable at any moment and resumable later.** Logical state is serialized after every meaningful change and on `visibilitychange`/`pagehide`.
2. **Determinism.** All randomness comes from a seeded, serializable PRNG. `game + seed + difficulty + actions` reproduces any state.
3. **Modularity.** Games implement one contract, never import each other, and are lazy-loaded chunks with their own direct URL.
4. **Local-first.** No backend is required for play. Saves live in IndexedDB on the device.
5. **UI language ≠ content language.** Interface strings and learning content use separate catalogues and preferences.
6. **No engagement dark patterns** — enforced by review and by the host design (no autoplay, calm "Finished" screen, informational play-time note only).

## Layers

```text
apps/web (shell)  ──uses──►  game-core · persistence · localization · ui · learning-content
     │ lazy import()
     ▼
packages/games/<id>  ──uses──►  game-core · ui · (learning-content | puzzle-core | strategy-engine | adventure-engine …)
```

Future shared engines (`puzzle-core`, `strategy-engine`, `adventure-engine`, `ai`, `audio`) are separate packages owned by the orchestrator.

## The GameModule contract

`packages/game-core/src/types.ts`:

```ts
interface GameModule<S> {
  metadata: GameMetadata;            // id, stateVersion, skills, typicalMinutes, inputMethods, capabilities, messages, difficulties
  create(ctx: GameContext): GameInstance<S>;
  isValidState(value: unknown): value is S;     // validates untrusted saves, never throws
  migrateState?(state: unknown, fromVersion: number): S | undefined;
}
interface GameInstance<S> {
  newGame({ seed, difficulty }): void;
  restore(state: S): void;
  serialize(): S;                    // plain JSON, includes PRNG state if randomness is drawn later
  pause(): void; resume(): void; reset(): void; dispose(): void;
}
interface GameContext {
  root: HTMLElement; t: Translator; reducedMotion: boolean;
  requestSave(): void;               // after each logical change
  finished(result: GameResult): void;// once, on natural end
  setDifficulty?(id: string): void;  // optional: in-game difficulty change → host select, next round, save
  preferences?: { get(key): unknown; set(key, value): void }; // optional: per-device options (localStorage, cleared with saves)
  contentLanguages?: { learning?: string; translation?: string }; // optional: learning languages from Settings (any BCP-47 tag)
  userDecks?: { list(): UserDeckSummary[]; get(id): unknown };    // optional: snapshot of imported decks (metadata.usesUserDecks)
  learning?: { today(): string; list(deckId): LearningRecordSummary[]; record(reviews: LearningReview[]): void }; // optional (metadata.usesLearningRecords)
  launch?: { deck?: string };       // optional: parameters of the opening link (`?deck=<id>`), for the first newGame only
}
```

`contentLanguages` is independent of the UI language (`t.locale`); either entry may be missing and games must fall back explicitly (see `resolveContentLanguages` in `@wp/learning-content`). `userDecks` is a synchronous, read-only snapshot the host loads before creating a game whose metadata sets `usesUserDecks: true`, so `newGame`/`restore` stay synchronous. Decks can be deleted between sessions; a game must handle a saved game whose deck is gone (Memory shows an explanation and a "new game" button).

`learning` is the minimal capability for spaced repetition (see "Learning records" below). The host provides it only to games whose metadata sets `usesLearningRecords: true`: a synchronous snapshot of the records loaded before the game is created, `today()` (the device's local calendar day, `YYYY-MM-DD`) and `record(reviews)`, which applies self-ratings in memory immediately and writes them to IndexedDB in order. `record` is idempotent per (card, session), so a game may send the same ratings again at any time (Review does so on every `restore`, which also completes writes lost when the page closed before they reached the store). Games without the capability keep working (Review then runs as practice without a schedule). `launch.deck` comes from `/games/<id>?deck=<id>` (which also starts a fresh game and is then removed from the URL); a game uses it for its first `newGame` and remembers it in its preferences.

The spec's `metadata()`/`initialize()` are expressed as the `metadata` object and `create()`. Every game package has:

```text
src/metadata.ts   light: metadata + messages (bundled with the catalogue)
src/messages.ts   16 locales; keys `title`, `tagline`, `rules`, `difficulty.<id>` …
src/rules.ts      pure logic (DOM-free) — unit, property and mutation tested
src/ai.ts         optional pure opponent logic
src/view.ts       DOM rendering, keyboard/touch/pointer, aria-live announcements
src/index.ts      export default defineGame({...})
test/rules.test.ts, test/contract.test.ts (runGameContract), e2e/games/<id>.spec.ts
```

The home page and the game page header need every game's metadata, but only a few of its messages. `apps/web/catalogue-plugin.ts` therefore generates `virtual:wp-catalogue` at build time: each game's metadata with only the catalogue keys (`title`, `tagline`, `rules`, `difficulty.*`). The registry (`apps/web/src/registry.ts`) lists game ids and lazy loaders; a game's complete messages arrive with its own chunk, so the main bundle does not grow with every game's translations.

After "New game" the host moves focus into the game: to the element marked `data-autofocus` (usually the board), otherwise to the first control.

### Shared contract suite

`runGameContract(module, { interact })` (`packages/testing`) checks for every game: valid metadata and complete translations in all 16 locales, determinism per seed, JSON-serializable state accepted by `isValidState`, rejection of arbitrary junk (fuzzed with fast-check), exact restore through the real persistence layer after interaction, pause/resume invariance, `reset()` to the seeded start, no missing translation keys when rendering in each locale, and DOM cleanup on `dispose()`. The e2e helper `expectResumeAfterReload` verifies the same across a real browser reload.

## Persistence

IndexedDB database `worthwhile-play`, schema version 3. Upgrades are additive (`upgradeDatabase` only creates missing stores; tested with real version-1 and version-2 databases, whose saves and decks survive): 1 → `saves`, 2 → `decks`, 3 → `learning` (key path `[deckId, itemId, direction]`). A connection closes itself on `versionchange`, so a newer app version in another tab can upgrade; if an *older* tab blocks the upgrade for more than 4 s, the app falls back to in-memory storage and says so (it never hangs).

`GameSave { schemaVersion, gameId, stateVersion, updatedAt, seed, difficulty?, state }` in `saves` (one active save per game). `interpretSave` validates and migrates untrusted data and returns `empty | ok | corrupt` — a corrupt save is reported and discarded, never crashes the app. If IndexedDB is unavailable, an in-memory store is used and the user is told that progress will not persist.

## Learning content and deck library

`@wp/learning-content` holds the generic card model (`Deck`, `LearningItem`, `CardSide`; format in [content/deck-format.md](content/deck-format.md)), CSV/JSON import and export, and the built-in decks:

- **Symbols** (24 emoji, classic Memory), **First words** (60 everyday nouns with an emoji picture, authored in all 16 UI languages), **Flags & countries** (60 ISO codes; names from the browser's CLDR data via `Intl.DisplayNames`, flags from regional-indicator emoji). Built-in decks are generated in code and never stored.
- `resolveContentLanguages(choice, uiLocale)` is the single, tested place for content-language fallbacks: learning → UI language → English; translation → UI language → English → German, never equal to the learning language; country names in the learning language if the platform knows it, else the UI language.
- `importDeck(text, { id, title })` turns untrusted CSV/JSON into a validated deck: size limits (`IMPORT_LIMITS`), removal of every media reference that could cause a network request (http(s), protocol-relative, other schemes; only bundled relative paths and small `data:image/png|jpeg|gif|webp|avif` are kept, matching the CSP `img-src 'self' data: blob:`), and errors/warnings with card number and CSV line for translated messages.

**Imported decks** are stored only on the device in the `decks` store (`{ id: 'user-…', importedAt, deck }`), independent of saves: "Delete all saved games" keeps them, "Delete my imported decks" (Settings, confirmed) removes them. The app validates every record on read and skips broken ones. Pages: `/decks` (library), `/decks/<id>` (preview, play, export JSON, delete), `/decks/import` (file or paste → check → preview → save). The deck pages are a lazily loaded chunk.

**Memory** uses the deck system with five variants (symbols, picture ↔ word, word ↔ translation, flag ↔ country, own deck front ↔ back). Its state stores only the variant, deck id, item ids and the content languages fixed at deal time (never deck contents), so a resumed game looks exactly as before even if Settings changed. Saves from state version 1 are migrated (`variant: 'symbols'`). A saved game whose own deck was deleted stays valid (validation is structural, `isValidState` is pure); the view explains that the deck is gone and offers a new game. "Read aloud" uses the browser's speech synthesis only when the player presses the button and a voice exists for the language (best effort; hidden otherwise).

## Learning records ("Items worth reviewing")

Optional spaced repetition without engagement mechanics (spec "Spaced repetition"): no streaks, daily goals, reminders, notifications, badges or guilt messages; nothing happens unless the person opens the library or the *Review* game.

- **Model** (`packages/learning-content/src/schedule.ts`): Leitner boxes with whole days. One record per (learning deck, item, direction): `box` (1–7), `due` (local calendar day), `lastDay`, `last` rating, `reviews`, `lapses`, `session`. Ratings are "Not yet" (`again` → box 1, due tomorrow), "Almost" (`hard` → same box, half its interval, at least one day) and "Knew it" (`good` → next box). Box n is suggested again after 1, 2, 4, 8, 16, 32, 64 days; a never-rated card counts as box 1. The due day is always after the rating day. Three buttons instead of four (no "Easy"): fewer decisions, and the scale stays explainable in one sentence; "Knew it" on a new card already skips box 1.
- **Dates**: only the device's local calendar day is used, and only to decide what is due. No timers, no time of day; tests inject "today".
- **Idempotency**: every session has an id (start day + seed). A record accepts at most one rating per session, so resending ratings (reload, resume, lost write) never counts twice. Consequence: re-rating a card in the same session (e.g. after `reset()`) keeps the first rating.
- **Keys**: "First words" is learned per learning language (`first-words:<lang>`); flags are language-independent (`flags`); imported decks use their unique id. Deleting an imported deck deletes its records.
- **Storage**: IndexedDB store `learning`, separate from saves and decks; "Delete all saved games" keeps it, Settings has its own confirmed "Delete learning records". Records are validated on read (`toLearningRecord`); broken ones are skipped.
- **Library**: `/decks` shows a neutral "Items worth reviewing" overview (decks with cards whose day has arrived, counted per card in any direction) with a "Review" link each, a per-deck badge, and a short explanation of the schedule ("tends to help people remember … only a suggestion"). The strings of these parts live in `apps/web/src/i18n/learning.ts`, imported only by the lazily loaded deck pages, so they do not grow the main bundle.
- **Review game** (`packages/games/review`): a session is a fixed queue built once — due cards (most overdue first, at most 20), new cards (at most 10) or practice (any 10 cards, schedule unchanged). "Not yet" brings a card back once at the end of the session (not recorded). The state stores deck id, content languages fixed at start, the queue, the index and the answers (rating + day), never card contents. Memory does not write records (L2 decision: keeps Memory a game rather than an assessment).

## Localization

- 16 UI locales (`packages/localization/src/locales.ts`), BCP-47, Arabic RTL (`<html dir>`; CSS uses logical properties).
- Resolution: stored choice → first matching browser language → English. Traditional Chinese is *not* mapped to `zh-Hans`.
- Catalogues: shell (`apps/web/src/i18n/ui/<locale>.ts`, type-checked key sets), shared game vocabulary (`common.*`), and one namespace per game (`metadata.messages`). Tests enforce complete key sets and identical placeholders; the English fallback exists only as a safety net and is reported.
- Content languages (learning/translation) are separate preferences that accept any BCP-47 tag.
- Translations other than en/de are AI-assisted and await native-speaker review.

## PWA and offline

`vite-plugin-pwa` (Workbox `generateSW`) precaches the shell and all bundled game chunks. Updates: a new release is applied automatically (reload) whenever no game page is open; on a game page it waits and is offered via "Update now", and is applied on the next navigation away — a running game is never interrupted. Open tabs check for updates hourly. Large optional content (audio packs, AI models) will use separate caches downloaded only on explicit request with the size shown first.

## Deployment

Cloudflare Pages (SPA fallback for deep links, ADR 0008). Security headers via `public/_headers`. See [deployment.md](deployment.md).

## Determinism and randomness

`createRng(seed)` (mulberry32, 32-bit state). `Math.random()` is banned by lint. The shell picks new seeds via `crypto.getRandomValues` (`randomSeed`) and accepts `?seed=` for reproduction.

## Testing strategy

| Level | Tool | Scope |
|---|---|---|
| Unit / TDD | Vitest | rules, core packages, router, catalogues |
| Property / fuzz | fast-check | invariants (legal moves, permutations, parsers never throw, determinism) |
| Contract | `@wp/testing` | every game, every locale |
| Mutation | Stryker | core packages, `games/*/src/rules.ts`, `ai.ts` (break threshold 65 %). Vitest is pinned to 4.1.x: with Vitest 5, `@stryker-mutator/vitest-runner` 10 does not activate mutants (every mutant "survives"). Re-check before upgrading. |
| E2E | Playwright | shell, direct URLs, RTL, corrupt saves, offline, per-game resume; desktop + mobile viewports |
