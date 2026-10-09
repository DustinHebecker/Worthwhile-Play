# 0011 — Per-locale game content, loaded by an optional `preload` hook

Status: Accepted (2026-10-09; amends 0002 and the "Bounded size" point of 0010)

## Context
The text exercises of ADR 0010 bundled their content (texts, questions, explanations) for all 16 UI locales into the game chunk, so opening one of them loaded every language: Deep Read 978 kB raw / 282 kB gzip, Audience Switch 749 / 218 kB, Compression Challenge 531 / 144 kB, Briefing Game 364 / 118 kB, Ambiguity Detector 356 / 112 kB. Someone reading in one language needs one sixteenth of that. The shell already loads its own texts per locale (`apps/web/src/i18n`), and `newGame`/`restore` must stay synchronous (ADR 0002).

## Decision
- **Optional hook** `GameModule.preload?(locale: string): Promise<void>` (on the module, not on `metadata`: the catalogue never needs it). The host (`apps/web/src/pages/game.ts`) awaits `module.preload?.(app.locale)` right after `entry.load()` and before `create`/`restore`/`newGame`. A language switch re-renders the game page, so it runs again for the new locale before the saved game is continued. Games without `preload` are unchanged.
- **Contract of the hook.** It loads what the game needs to render in `locale` plus the English fallback, is idempotent and cached. It resolves as soon as the game can render: in `locale`, or in English if only `locale` failed (reported via `console.error`, like the shell's `loadLocale`); it rejects only when nothing can be loaded, and the host then shows its generic "could not be loaded" message.
- **Shared helper** `createLocaleContent(loaders, { fallback = 'en' })` in `@wp/game-core` implements this once: parallel load of the locale and the fallback, cache, retry after a failure, and a synchronous `get(locale)` (requested locale if loaded, else the fallback; throws if the host did not await `preload`).
- **Per game** (`src/content/index.ts`): content per locale stays in `src/content/<locale>.ts`; `CONTENT_LOADERS` is an explicit `Record<SupportedLocale, () => Promise<…>>` of dynamic imports (one chunk per locale, no bundler configuration; the `SupportedLocale` import is type-only, so it is exhaustive at compile time without a runtime dependency), exported as `preloadContent` (the module's `preload`) and `contentFor(locale)` for the view. No module of the game imports a locale file statically.
- **UI messages stay in `metadata.messages`** (complete for all locales, synchronous): the catalogue and the translator need them, and they were a small part of the problem (49–99 kB raw of the 356–978 kB). Moving them per locale is possible later with the same hook (a live `metadata.messages` that holds the catalogue keys statically and gets the remaining keys of a locale in `preload`) if their share matters.
- **Saves are unchanged**: they hold ids only (ADR 0010), so a game continues in another language.
- **Offline**: every per-locale chunk is emitted under `assets/` and therefore precached by the service worker (`globPatterns`), so a game can be continued offline in a language never opened before (e2e-tested with Deep Read).
- **Tests**: `runGameContract` awaits `preload('en')` before its suite and `preload(locale)` before rendering in each locale, and for games with `preload` checks that every locale loads without a reported fallback. View tests preload before creating instances; content parity tests load every locale through `CONTENT_LOADERS` in `beforeAll`.

## Consequences
+ Opening Deep Read in English loads 231 kB of JavaScript and CSS instead of 1 096 kB (75 kB instead of 327 kB gzip). The game chunks shrink to 68–117 kB; each locale's content is a 11–106 kB chunk.
+ The pattern scales to more content without touching the 2 MiB precache limit per file.
− One more request (two in a locale other than English) when a game is opened, and 80 more precache entries (the total precached size stays the same).
− `contentFor` throws if a host forgets to await `preload`; the contract suite and the host test (`apps/web/test/game-page.test.ts`) guard that.
