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
validateCommand(world, ruleset, cmd: Command, networks?): CommandCheck // never throws; reasons are enum strings;
                                                                     // `networks` (by side) = coverage snapshot of the batch start
runTicks(world, ruleset, commands: readonly Command[], ticks): { world: World; events: SimEvent[] }
resolveTurn(world, ruleset, plans: readonly (readonly Command[])[]): { world; events } // ticksPerTurn ticks, turn + 1
findPath(map, ruleset, start, goal, { layer, side, blocked?, maxCost? }): number[] | undefined
regions(map, ruleset, layer, blocked?) / canReach(map, ruleset, layer, regions, start, goal)   // O(1) "any way?" checks
flowField(map, ruleset, goals, layer, blocked?): Int32Array          // TD waves; nextStep(...) follows it
computeDamage(base, weapon, targetArchetype, cover): number
isValidWorld(value: unknown, ruleset?): value is World               // never throws
canonicalJson(value) / worldHash(world): number                     // FNV-1a over canonical JSON
BASE_RULESET, BASE_TERRAIN, BASE_ARCHETYPES                          // shared content (D16)
archetypeOf(ruleset, kind): Archetype | undefined                    // own-property lookup (untrusted kinds)
// Command network (I3a):
computeNetwork(world, ruleset, side): { nodes, coverage: Uint8Array, slots }
isCommandable(world, ruleset, unit, network?): boolean               // always true without commandNetwork
STRATEGY_RULESET                                                     // BASE_RULESET + commandNetwork + fog ('strategy-2')
// Doctrines (I3b):
DEFAULT_DOCTRINE, isValidDoctrine(v), TARGET_PRIORITIES, RETREAT_THRESHOLDS
// Electronic warfare (I4):
jammedCells(world, ruleset, side): Uint8Array                        // enemy jam discs minus own burn-through
isActiveEw(ruleset, e) / isEmitter(ruleset, e)                       // working EW unit / node-or-jammer
revealedEmitters(world, ruleset, side, network?): Set<number>        // located without sight (EMITTER_EXPOSURE, tracers)
needsDeploy(archetype)                                               // comms or EW units that work only when set up
// Information model (I3c, D7):
observedCells(world, ruleset, side, network?): Uint8Array            // vision discs of reporting units
reportingUnits(world, ruleset, side, network?): Entity[]             // units in coverage (all without a network)
initialIntel(world, ruleset): Report[][]                             // start: observed + own units + all structures
isSpotted(world, ruleset, side, id): boolean                         // live report (always true without fog)
resolveTurn/runTicks(...).reported?: SimEvent[][]                    // fog: per-side filtered events
```

  Orders: `hold`, `move`, `attack`, `deploy`, `escort {target}` (stay within 2 cells of a friendly unit/structure), `patrol {x, y, rx, ry}`, `regroup` (nearest covered cell, then hold). A `Command` may carry a `doctrine` (`retreatBelow`, `priority`, `seekCover`, `holdFire`) that replaces the unit's doctrine with the same order slot; units keep following it out of contact. Tower Defense waves can use doctrines for target priority and return fire.

  Movement never ends an order silently: walls are terrain, structures and units that will not leave (holding or deploying); a unit follows its route and, when a cell of that route is taken, routes around the units in the way if that costs at most a small detour (bounded search), otherwise it waits behind them. A move ends as `occupied` after `OCCUPIED_BUMPS` bumps against its taken destination, or when its destination is held and there is no way; a patrol turns before an end taken by any unit; a new order resets the bump, dead-end and progress counters; an order whose remaining route cost (past walls) has not fallen for `STALL_TICKS` route searches ends as `blocked` (patrols and escorts excepted), for attackers progress is counted per target (not per firing cell or the cell it stands on, so attackers pacing in step around each other end too); a route that gets longer by more than the detour limit (a unit settled in a gap) starts a new record, so walking the forced detour counts as progress; a unit does not step straight back onto the cell it just left when another way within the detour limit exists that avoids what the chosen route avoided (units, if it was going around them) (two routes freed in turn by a patrol made units pace); a unit already holding inside its coverage does not retreat again. Performance: costs per cell are cached per map, A* keys are packed numbers, an unreachable goal is detected by a per-tick region flood fill, and units without enough movement points for any step skip the search (32×32 with 120 units: about 40 ms per tick in Node). The engine replaces a standing order on its own only with an `order-ended` event and a reason (`arrived`, `occupied`, `unreachable` after `UNREACHABLE_TICKS` without any way, `blocked` after `DEADLOCK_TICKS` of mutual blocking, `lost-target`, `retreat`, `regrouped`).

  Rulesets carry `commandNetwork` (orders only reach units in coverage as it was at the start of the batch, at most the connected sources' order slots per side and batch; rejected commands report `out-of-contact`) and `relayHillBonus`. Archetypes carry `comms: { role: 'source' | 'relay', radius, orderSlots, needsDeploy } | null`; the `deploy` order sets a `needsDeploy` node up in one turn (`entity.deploy` counts ticks); `hold` keeps it set up, moving packs it up. `computeNetwork` is O(nodes²) — fine for strategy maps; Tower Defense/hybrids with many relays should add spatial buckets first. Tower Defense can ignore all of this by using `BASE_RULESET` (`commandNetwork: false`), or use relay/support towers as network nodes.

  EW (I4): archetypes carry `ew: { role: 'jammer' | 'tracer', radius, burnThrough, needsDeploy } | null`. `computeNetwork` drops nodes on jammed cells and never covers jammed cells; jamming applies only to the enemy of the jammer's side. Located emitters get live reports like observed entities (so they can be targeted). P6 extended: an enemy jammer never grows coverage, an own tracer never shrinks it.

  Fog (`ruleset.fog`, D7): `World.intel[side]` holds `Report { id, side, kind, x, y, hp, tick, live }`, sorted by id, refreshed in system 11 (vision) at the end of every tick. Only units in the own coverage report; their vision discs are the observed cells. Observed entities get a `live` report; other reports stay as ghosts at the last reported position: an enemy ghost is dropped once its cell is observed empty, an own unit is never forgotten until its destruction is observed. Weapons engage only targets their side has spotted or that the shooter sees itself (artillery needs spotters), and `attack` commands need a spotted target (`not-visible`). Events are filtered per side (`reported`): an event is known if it involves an observed entity or an observed cell. `isValidWorld` checks that intel exists exactly for fog rulesets, that live reports match their entity and that every own unit is known. An attacker further than `FIRING_SEARCH` cells beyond its range heads straight for the target (one A*) when the target's cell can be reached at all (otherwise, e.g. a post ringed by holding units or across a river, it searches a firing position at once); closer, it searches for a firing position. An attacking unit uses only what its side reports or what it sees itself: a target in sight is engaged from the nearest firing position (at least the weapon's minimum range away, within its range, and without a spotter also within the unit's own sight); a target out of sight is sought at its last reported cell, and the order ends as `lost-target` once the unit sees that cell without it, or when its side holds no report at all. Attack commands on ids the side does not see are always refused as `not-visible` (whether or not they still exist). A side always learns of losing its own command sources. Shots are reported only when the shooter is observed. Known gap (N1): path finding still treats unseen units that hold as walls, so a detour can hint at a hidden unit; a fog-aware path search is planned. `observe(...)` from the plan below is covered by `World.intel` plus the game's own picture.

  Planned (I3–I5), names provisional: `ModeDefinition { id, systems, phases, victory, spawns? }` passed to `runTicks`; `coverage(world, ruleset, side)`; `observe(world, ruleset, side)`; `planAi(observation, ruleset, profile)`; production/economy commands.
- **Mirror-consistent tie-breaking**: path and neighbour ties are broken in each side's own frame (side 1 = point-mirrored), the movement conflict rule is symmetric between sides (contenders of different sides all bump; within one side the lowest id enters, so friendly units cannot deadlock), damage is applied simultaneously. Property P4 checks that a point-mirrored world with swapped sides evolves as the exact mirror image.
- **Extension points for TD/hybrids**: `ModeDefinition { id, systems, phases, victory, spawns? }`; archetype components `weapon` (`direct` | `ballistic` | `beam`), `armor`, `mobility` (ground/air), `sensor`, `comms` (source/relay/jammer), `aura` (support effects: slow, repair, targeting bonus, shield, power), `production`, `upgrades` (branch tree: each branch replaces/extends components). Waves and external forces are entities with standing orders (`advance` along a path, priority, no retreat) spawned by `spawns`.
- **Content split**: shared base archetypes (incl. the five TD tower families) live in `strategy-engine/src/content`; each mode/game ships its own ruleset (numbers, branches, availability). TD owns TD balancing and branch design.

## Consequences
+ One implementation per mechanic; determinism and save/restore are guaranteed once, for all modes; TD can start against the documented API.
+ Property tests (determinism, purity, mirror symmetry, round-trip) cover every mode.
− The engine is a coordination point between two workstreams; changes need ADR amendments.
− Integer-only math constrains effects (no trigonometry) — acceptable for a grid game; rendering may use floats freely.
