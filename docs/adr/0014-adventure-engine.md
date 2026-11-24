# 0014 — Adventure engine (`@wp/adventure-engine`): declarative content, checker-proven completability

Status: Accepted (2026-11-23, with engine increment E1; proposed 2026-10-14). Design and owner decisions: [docs/design/adventures.md](../design/adventures.md).

## Context
The spec requires reusable point-and-click infrastructure (scenes, hotspots, inventory, items, dialogue, flags, puzzle state, transitions, save/load, audio, localization) for at least two substantial original adventures, the second built around time manipulation. Every game must be closable at any moment and resumable; the owner requires no death and no dead ends, proven by a content checker (Q11), and decided that the adventure workstream owns the engine and both adventures (Q8).

## Decision
- New package `packages/adventure-engine` (`@wp/adventure-engine`), depending only on `@wp/game-core` and `@wp/ui`, no third-party dependencies. Games (`adventure-a`, `temporal-adventure`) depend on it; it never imports games. **Owned by the adventure workstream** (deviation from ADR 0006's default, like ADR 0009); API changes amend this ADR.
- **Content is declarative data**: structure (ids, geometry, conditions, effects, mechanisms, time rooms) without strings, plus per-locale text chunks (ADR 0011 `preload`). Conditions and effects form a small closed language (bounded integer flags, items, clues, scenes); anything richer is a typed mechanism with its own solver.
- **Pure core API** (implemented in E1; inputs never mutated):

```ts
compile(adventure: Adventure): Compiled                     // indexes content; throws on invalid authored content
initialState(c: Compiled, seed): AdventureState             // enters the start scene
available(c, state): Action[]                               // single source of truth: view, checker, fuzzers
step(c, state, action): { state, out }                      // never throws; refusals (enum reason) leave the state unchanged
holds(cond, state): boolean · activeGoals(c, state) · visibleHotspots(c, state)
isValidAdventureState(c, value): value is AdventureState    // untrusted saves; never throws
isActionShape(value): value is Action                       // untrusted actions; never throws
canonicalJson(value) · stateHash(state)                     // FNV-1a over canonical JSON
textKeys(adventure): string[]                               // every derived text key (translation completeness)
```

  Content checker (E2, subpath `@wp/adventure-engine/check`, test-time only):

```ts
checkAdventure(adventure, { texts?, budget? }): { errors, warnings, metrics }
explore(c, budget) · canFinish(exploration) · pathTo(exploration, i)   // BFS over abstract states
moves(c, abstractState) · startState(c) · abstractOf(state) · keyOf(abstractState)  // independent interpreter
```

  View kit (E3):

```ts
defineAdventureGame({ metadata, adventure, art, content, speech? }): GameModule<AdventureState>
                                         // compile once; isValidState = isValidAdventureState; preload = content.preload
createAdventureView(context, { compiled, art, texts, speech? }): GameInstance<AdventureState>
ArtProvider { render(scene, state): SVGElement } · plainArt   // swappable art (owner decision Q1)
ADVENTURE_UI_MESSAGES · withAdventureMessages(own)            // shared interface texts, 16 locales
```

  `metadata.stateVersion` equals the adventure's `contentVersion`, so a content change that breaks saves also
  bumps the version the host uses for `migrateState`.
- **State** is plain JSON of logical state (ids only, bounded arrays), saved after every action; content ids are append-only, with `contentVersion` and pure content migrations.
- **Content checker** (test-time only) with its own minimal interpreter: completable, no dead ends from any reachable state, coverage, fair clues, hint correctness, translation completeness, hit-area sizes, state-space budgets.
- **Time (Adventure B)**: no running global time; eras change only through story beats; short time manipulations (hold, slow, hasten, rewind) happen in closed, resettable *time rooms* with integer beats that advance only through player actions. Rewind uses per-object 24-beat state rings and is not a generic undo.
- **Art** is resolved through a swappable `ArtProvider`; hotspot geometry and all logic live in the structure, so replacing code-drawn SVG with other art touches no logic or saves.

## Consequences
+ Both adventures share one tested core; completability and fairness are proven per content change, so "close at any time" can never strand a player.
+ Texts load per locale; saves survive language switches and content updates.
− Content authors work within a constrained data language; unusual puzzles need a new mechanism kind (with solver) in the engine.
− The checker adds CI time; state-space budgets constrain puzzle complexity (intended).
