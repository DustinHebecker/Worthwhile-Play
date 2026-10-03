# 0002 — GameModule contract, seeded determinism and save envelope

Status: Accepted (2026-10-03)

## Context
Spec requirements: universal resumability, direct URLs, determinism for bug reproduction and testing, robust handling of corrupt/old saves.

## Decision
- `GameModule { metadata, create(ctx), isValidState, migrateState? }` and `GameInstance { newGame, restore, serialize, pause, resume, reset, dispose }` (see `packages/game-core/src/types.ts`). The spec's `metadata()/initialize()` map to the `metadata` object and `create()`.
- The host owns persistence and timing of saves; games only call `requestSave()` after logical changes and `finished()` once.
- State is plain JSON logical state (no animation frames). PRNG = mulberry32 with a 32-bit serializable state.
- Save envelope `{ schemaVersion: 1, gameId, stateVersion, updatedAt, seed, difficulty?, state }`; `interpretSave` → `empty | ok | corrupt`, migrations via `migrateState`.
- Every game must pass the shared contract suite (`@wp/testing`), including in all 16 locales.

## Consequences
+ Uniform resume behavior and tests for every game; reproducible bugs via `?seed=`.
− Games must design explicit logical states (e.g. "pending mismatch" in Memory) instead of relying on timers.
