# 0009 — Shared strategy engine (`@wp/strategy-engine`) and its API

Status: Accepted (2026-10-09, with engine increment I1; proposed 2026-10-03). Design and owner decisions: [docs/design/strategy.md](../design/strategy.md).

## Context
The spec requires one shared deterministic engine for the turn-based strategy game, Tower Defense and the four hybrid modes ("Do not build separate implementations for TD and strategy"). Strategy and TD are developed by parallel workstreams; TD needs a stable API early.

## Decision
- New package `packages/strategy-engine` (`@wp/strategy-engine`), pure TypeScript, no DOM, depends only on `@wp/game-core`. Games depend on it; it never imports games. Owned by the strategy workstream (owner decision D17, deviating from ADR 0006's default that future engines belong to the orchestrator); API changes go through this ADR (amend + note in the PR).
- **Integer-only, tick-based simulation.** One fixed system order per tick (orders → intent → movement → targeting → fire/projectiles → damage → status → removal → economy/production/research → network → vision → victory). Modes choose the system subset and how many ticks run between player inputs (strategy: fixed ticks per turn; TD: until a wave is resolved).
- **Data, not classes.** `World` is plain JSON (entities sorted by id, RNG state inside). Archetype stats live in a `Ruleset` referenced by id, not in saves. Derived caches (network graph, coverage, flow fields, spatial hash) are rebuilt, never serialized.
- **Pure public API** (inputs never mutated). Implemented in increment I1:

```ts
createWorld(scenario: Scenario, ruleset: Ruleset): World            // throws on invalid authored content
validateCommand(world, ruleset, cmd: Command): CommandCheck         // never throws; reasons are enum strings
runTicks(world, ruleset, commands: readonly Command[], ticks): { world: World; events: SimEvent[] }
resolveTurn(world, ruleset, plans: readonly (readonly Command[])[]): { world; events } // ticksPerTurn ticks, turn + 1
findPath(map, ruleset, start, goal, { layer, side, blocked? }): number[] | undefined
flowField(map, ruleset, goals, layer, blocked?): Int32Array          // TD waves; nextStep(...) follows it
computeDamage(base, weapon, targetArchetype, cover): number
isValidWorld(value: unknown, ruleset?): value is World               // never throws
canonicalJson(value) / worldHash(world): number                     // FNV-1a over canonical JSON
BASE_RULESET, BASE_TERRAIN, BASE_ARCHETYPES                          // shared content (D16)
archetypeOf(ruleset, kind): Archetype | undefined                    // own-property lookup (untrusted kinds)
// Command network (I3a):
computeNetwork(world, ruleset, side): { nodes, coverage: Uint8Array, slots }
isCommandable(world, ruleset, unit, network?): boolean               // always true without commandNetwork
STRATEGY_RULESET                                                     // BASE_RULESET + commandNetwork: true
```

  Rulesets carry `commandNetwork` (orders only reach units in coverage, at most the connected sources' order slots per side and batch; rejected commands report `out-of-contact`) and `relayHillBonus`. Archetypes carry `comms: { role: 'source' | 'relay', radius, orderSlots, needsDeploy } | null`; the `deploy` order sets a `needsDeploy` node up in one turn (`entity.deploy` counts ticks). Tower Defense can ignore all of this by using `BASE_RULESET` (`commandNetwork: false`), or use relay/support towers as network nodes.

  Planned (I3–I5), names provisional: `ModeDefinition { id, systems, phases, victory, spawns? }` passed to `runTicks`; `coverage(world, ruleset, side)`; `observe(world, ruleset, side)`; `planAi(observation, ruleset, profile)`; production/economy commands.
- **Mirror-consistent tie-breaking**: path and neighbour ties are broken in each side's own frame (side 1 = point-mirrored), the movement conflict rule is symmetric between sides (contenders of different sides all bump; within one side the lowest id enters, so friendly units cannot deadlock), damage is applied simultaneously. Property P4 checks that a point-mirrored world with swapped sides evolves as the exact mirror image.
- **Extension points for TD/hybrids**: `ModeDefinition { id, systems, phases, victory, spawns? }`; archetype components `weapon` (`direct` | `ballistic` | `beam`), `armor`, `mobility` (ground/air), `sensor`, `comms` (source/relay/jammer), `aura` (support effects: slow, repair, targeting bonus, shield, power), `production`, `upgrades` (branch tree: each branch replaces/extends components). Waves and external forces are entities with standing orders (`advance` along a path, priority, no retreat) spawned by `spawns`.
- **Content split**: shared base archetypes (incl. the five TD tower families) live in `strategy-engine/src/content`; each mode/game ships its own ruleset (numbers, branches, availability). TD owns TD balancing and branch design.

## Consequences
+ One implementation per mechanic; determinism and save/restore are guaranteed once, for all modes; TD can start against the documented API.
+ Property tests (determinism, purity, mirror symmetry, round-trip) cover every mode.
− The engine is a coordination point between two workstreams; changes need ADR amendments.
− Integer-only math constrains effects (no trigonometry) — acceptable for a grid game; rendering may use floats freely.
