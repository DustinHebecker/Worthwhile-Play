# 0002 — GameModule contract, seeded determinism and save envelope

Status: Accepted (2026-10-03)

## Context
Spec requirements: universal resumability, direct URLs, determinism for bug reproduction and testing, robust handling of corrupt/old saves.

## Decision
- `GameModule { metadata, create(ctx), isValidState, migrateState?, preload? }` and `GameInstance { newGame, restore, serialize, pause, resume, reset, dispose }` (see `packages/game-core/src/types.ts`). The spec's `metadata()/initialize()` map to the `metadata` object and `create()`.
- The host owns persistence and timing of saves; games only call `requestSave()` after logical changes and `finished()` once.
- State is plain JSON logical state (no animation frames). PRNG = mulberry32 with a 32-bit serializable state.
- Save envelope `{ schemaVersion: 1, gameId, stateVersion, updatedAt, seed, difficulty?, state }`; `interpretSave` → `empty | ok | corrupt`, migrations via `migrateState`.
- Every game must pass the shared contract suite (`@wp/testing`), including in all 16 locales.
- Amendment (ADR 0011): the optional `preload(locale)` lets a game load per-locale content before `create`; the host awaits it, so `newGame`/`restore` stay synchronous. The optional `prepare(options)` (ADR 0011 amendment 2026-10-30) loads what one new game needs; the host awaits it before `newGame`.
- Amendment (ADR 0017): the optional `GameModule.settings` declares the settings the host draws on the one start screen; `NewGameOptions` gains `settings` and `begin`; the save envelope gains an optional `settings`.
- Amendment (ADR 0003, 2026-10-24): optional `metadata.locales` (a preview game shipping only some UI locales; English elsewhere, the contract checks only those) and `metadata.status: 'preview'` ("Work in progress" badge).
- Amendment (ADR 0012): the optional, asynchronous `GameContext.library` stores things the player creates (e.g. maps), per game and bounded, separately from saves and preferences.

## Consequences
+ Uniform resume behavior and tests for every game; reproducible bugs via `?seed=`.
− Games must design explicit logical states (e.g. "pending mismatch" in Memory) instead of relying on timers.
