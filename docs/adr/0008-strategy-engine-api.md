# 0008 — Shared strategy engine (`@wp/strategy-engine`) and its API

Status: **Proposed** (2026-10-03) — open points in [docs/design/strategy.md § 14](../design/strategy.md#14-open-decisions). Becomes *Accepted* with engine increment I1.

## Context
The spec requires one shared deterministic engine for the turn-based strategy game, Tower Defense and the four hybrid modes ("Do not build separate implementations for TD and strategy"). Strategy and TD are developed by parallel workstreams; TD needs a stable API early.

## Decision
- New package `packages/strategy-engine` (`@wp/strategy-engine`), pure TypeScript, no DOM, depends only on `@wp/game-core`. Games depend on it; it never imports games. Owned by the strategy workstream; API changes go through this ADR (amend + note in the PR).
- **Integer-only, tick-based simulation.** One fixed system order per tick (orders → intent → movement → targeting → fire/projectiles → damage → status → removal → economy/production/research → network → vision → victory). Modes choose the system subset and how many ticks run between player inputs (strategy: fixed ticks per turn; TD: until a wave is resolved).
- **Data, not classes.** `World` is plain JSON (entities sorted by id, RNG state inside). Archetype stats live in a `Ruleset` referenced by id, not in saves. Derived caches (network graph, coverage, flow fields, spatial hash) are rebuilt, never serialized.
- **Pure public API** (inputs never mutated):

```ts
createWorld(scenario: Scenario, ruleset: Ruleset, seed: number): World
validateCommand(world, ruleset, cmd: Command): { ok: true } | { ok: false; reason: string }
runTicks(world, ruleset, mode: ModeDefinition, commands: readonly Command[], ticks: number):
  { world: World; events: SimEvent[] }
resolveTurn(world, ruleset, mode, plans: readonly (readonly Command[])[]): { world; events }
observe(world, ruleset, side): Observation           // fog/network-filtered view (AI, UI)
planAi(observation, ruleset, profile): Command[]      // deterministic, iteration-bounded
coverage(world, ruleset, side): CoverageMap           // command network query
flowField(world, ruleset, goal): FlowField            // cached per terrain hash (TD paths)
isValidWorld(value: unknown): value is World          // never throws
worldHash(world): number                              // FNV-1a over canonical JSON
```

- **Extension points for TD/hybrids**: `ModeDefinition { id, systems, phases, victory, spawns? }`; archetype components `weapon` (`direct` | `ballistic` | `beam`), `armor`, `mobility` (ground/air), `sensor`, `comms` (source/relay/jammer), `aura` (support effects: slow, repair, targeting bonus, shield, power), `production`, `upgrades` (branch tree: each branch replaces/extends components). Waves and external forces are entities with standing orders (`advance` along a path, priority, no retreat) spawned by `spawns`.
- **Content split**: shared base archetypes (incl. the five TD tower families) live in `strategy-engine/src/content`; each mode/game ships its own ruleset (numbers, branches, availability). TD owns TD balancing and branch design.

## Consequences
+ One implementation per mechanic; determinism and save/restore are guaranteed once, for all modes; TD can start against the documented API.
+ Property tests (determinism, purity, mirror symmetry, round-trip) cover every mode.
− The engine is a coordination point between two workstreams; changes need ADR amendments.
− Integer-only math constrains effects (no trigonometry) — acceptable for a grid game; rendering may use floats freely.
