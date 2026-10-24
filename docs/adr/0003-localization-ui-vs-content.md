# 0003 — 16 UI locales, separate content languages

Status: Accepted (2026-10-03). Amended 2026-10-24: preview games may ship only some locales (see "Amendment" below).

## Context
Spec: same 16 locales as Home Workout, BCP-47, RTL; UI language and learning-content language strictly separated.

## Decision
- Locale registry and resolution in `@wp/localization` (stored → browser → English; simplified-Chinese variants → `zh-Hans`, traditional Chinese not mapped).
- Three catalogue namespaces: shell UI (typed per-locale files), shared game vocabulary `common.*`, per-game `metadata.messages`. Complete key sets and identical placeholders are enforced by tests; runtime English fallback is a reported safety net only.
- Content languages are separate localStorage preferences accepting any BCP-47 tag; decks carry `lang` per card side.
- Core game rules never depend on translated strings.

## Consequences
+ Changing the UI language never touches decks or saves.
− Each game must ship 16 translations; non-en/de translations are AI-assisted until reviewed by native speakers.

## Amendment (2026-10-24): preview games in some locales, English elsewhere
Owner decision (2026-10-21): the life sim ships early in English and German, marked "Work in progress"; the other 14 locales follow. Partial locales are **only for games released as preview by owner decision** — every other game keeps shipping all 16.
- **Metadata** (`packages/game-core`): `GameMetadata.locales?: readonly SupportedLocale[]` — the UI locales the game ships; absent = all 16 (every existing game unchanged). `GameMetadata.status?: 'preview'` — the catalogue card and the game page header show a "Work in progress" text badge (host UI key `game.preview`, 16 locales). `SUPPORTED_LOCALES`/`SupportedLocale` now live in `@wp/game-core` (re-exported unchanged by `@wp/localization`) so the metadata can name them.
- **Validation** (`validateMetadata`, `validateSettings`): `locales` must be a non-empty list of supported locales without duplicates that includes `en`, and fewer than 16 need `status: 'preview'`; messages (title, tagline, rules, difficulty and setting labels) are required only in the shipped locales. `runGameContract(module)` defaults its `locales` option to `metadata.locales` (an explicit option still wins); app tests check each registered game in `gameLocales(metadata)`.
- **Runtime**: `gameLocale(metadata, uiLocale)` is the UI locale when the game ships it, else `en`. The host builds the game's translator (catalogue card, page header, start-screen labels, toolbar summary, finished text and `GameContext.t`) and calls `preload` for that locale, so in an unshipped locale the whole game namespace is English — a declared fallback: no missing-key report, no blank text — and `context.t.locale` is `en` (`ltr`). The elements carrying those texts, the game root included, get `lang="en" dir="ltr"` (also on RTL pages); the game page adds a short host note that the game is shown in English for now (`game.shownInEnglish`). Games without `locales` keep the strict behaviour (a missing key falls back to English and is reported). Host sentences that interpolate a game title (e.g. the library list in Settings) show the English title without a `lang` mark.
- The shell's per-locale catalogue chunks simply lack a game in the locales it does not ship.
- When the remaining translations arrive, the game drops `locales` (or lists all 16) and, once finished, `status`.

Consequences: + a game can be released early without placeholder translations; + the fallback is explicit and tested, so real missing keys in shipped locales are still caught. − Players in the other 14 locales see an English game inside a translated shell until the translations ship.
