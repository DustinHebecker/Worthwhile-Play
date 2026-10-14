# 0014 — Adventure engine (`@wp/adventure-engine`): declarative content, checker-proven completability

Status: Proposed (2026-10-14; becomes Accepted with engine increment E1). Design and owner decisions: [docs/design/adventures.md](../design/adventures.md).

## Context
The spec requires reusable point-and-click infrastructure (scenes, hotspots, inventory, items, dialogue, flags, puzzle state, transitions, save/load, audio, localization) for at least two substantial original adventures, the second built around time manipulation. Every game must be closable at any moment and resumable; the owner requires no death and no dead ends, proven by a content checker (Q11), and decided that the adventure workstream owns the engine and both adventures (Q8).

## Decision
- New package `packages/adventure-engine` (`@wp/adventure-engine`), depending only on `@wp/game-core` and `@wp/ui`, no third-party dependencies. Games (`adventure-a`, `temporal-adventure`) depend on it; it never imports games. **Owned by the adventure workstream** (deviation from ADR 0006's default, like ADR 0009); API changes amend this ADR.
- **Content is declarative data**: structure (ids, geometry, conditions, effects, mechanisms, time rooms) without strings, plus per-locale text chunks (ADR 0011 `preload`). Conditions and effects form a small closed language (bounded integer flags, items, clues, scenes); anything richer is a typed mechanism with its own solver.
- **Pure core API**: `step(content, state, action) → { state, out }` (never throws; refusals leave the state unchanged) and `available(content, state)` — the single source of truth for the view, the checker and the fuzzers. `defineAdventureGame(...)` returns a standard `GameModule`.
- **State** is plain JSON of logical state (ids only, bounded arrays), saved after every action; content ids are append-only, with `contentVersion` and pure content migrations.
- **Content checker** (test-time only) with its own minimal interpreter: completable, no dead ends from any reachable state, coverage, fair clues, hint correctness, translation completeness, hit-area sizes, state-space budgets.
- **Time (Adventure B)**: no running global time; eras change only through story beats; short time manipulations (hold, slow, hasten, rewind) happen in closed, resettable *time rooms* with integer beats that advance only through player actions. Rewind uses per-object 24-beat state rings and is not a generic undo.
- **Art** is resolved through a swappable `ArtProvider`; hotspot geometry and all logic live in the structure, so replacing code-drawn SVG with other art touches no logic or saves.

## Consequences
+ Both adventures share one tested core; completability and fairness are proven per content change, so "close at any time" can never strand a player.
+ Texts load per locale; saves survive language switches and content updates.
− Content authors work within a constrained data language; unusual puzzles need a new mechanism kind (with solver) in the engine.
− The checker adds CI time; state-space budgets constrain puzzle complexity (intended).
