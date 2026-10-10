# Design: shared strategy engine and the original turn-based strategy game

Status: **Decided for the first implementation** (owner, 2026-10-07). All decisions in [§ 14](#14-open-decisions) were taken as recommended (option a) except D1 (name **Relay Command**). They hold for the first version and may be revised iteratively after play-testing.

Scope:

- `packages/strategy-engine` (`@wp/strategy-engine`) — the shared deterministic simulation used by the strategy game, Tower Defense and the four hybrid modes (spec: "Shared Strategy / Tower Defense engine").
- `packages/games/relay-command` — the original turn-based strategy game (spec: "Strategy engine"), titled **Relay Command** (D1).

Out of scope here: Tower Defense and hybrid **game rules** (owned by the TD workstream). This document only fixes what the engine must offer them; the engine API is recorded in [ADR 0009](../adr/0009-strategy-engine-api.md).

References: implementation brief (binding), reference conversation (intent: "Command Network + simultaneous turns", "information and communication become a resource itself", "C&C × Into the Breach × board game"), ADR 0001/0002/0006.

---

## 1. Design goals and non-goals

Goals, in priority order:

1. **Planning, not reflexes.** Every decision is made while the game waits. No timers, no APM. The interesting questions are allocation, positioning, prediction of the opponent and resilience of one's own command structure.
2. **Command as a resource.** Units do not obey magically. Coverage, relays and electronic warfare decide *who can be told what*, and units outside coverage act on their configured doctrine. This is the core differentiator from Command & Conquer–style RTS.
3. **Short, finite sessions.** A small match ends in roughly 10–20 minutes, always with a natural end (turn limit). Closable at any moment, including mid-plan, without loss.
4. **Readable simultaneity.** Both sides plan, lock, then resolve at once. The resolve is a deterministic, explainable replay (event log) — never "the dice said no".
5. **One engine, many modes.** Strategy, TD and hybrids are compositions of the same systems and data, not three implementations.
6. **Determinism and testability.** `seed + initial state + command log ⇒ bit-identical world` (integer-only simulation).

Non-goals: real-time play, online multiplayer (no backend — spec), campaigns/story, unit veterancy/XP grinding, unlocks between matches, any meta-progression. Nothing that rewards returning.

IP rule: no names, factions, units, maps, art, sounds or layouts from C&C (or any other game). In particular we avoid genre-iconic terms such as *Harvester*, *Construction Yard*, *MCV*, *Tiberium/Ore*, *Barracks/War Factory* naming patterns and any faction lore. All names below are generic military/technical vocabulary chosen for this project; a final name check (D1) happens before release.

---

## 2. Core loop

```text
┌──────────── one turn ────────────┐
│ BRIEF    see the result of the last resolve + what your network reports
│ PLAN     give orders to units in coverage, set doctrines, queue production,
│          place structures, choose research   (any number of edits, undoable)
│ LOCK     commit the plan (AI has already committed blind)
│ RESOLVE  both plans execute simultaneously over T ticks → event log
│ REVIEW   animated replay (skippable; instant with reduced motion)
└──────────────────────────────────┘   × N turns (turn limit) → result
```

A match: 1 human vs 1 AI (default) on a seeded, mirror-symmetric map. Optional pass-and-play hot-seat (D10).

### Phase details

| Phase | What happens | Persisted |
|---|---|---|
| PLAN | Draft orders are edited; nothing in the world changes. The draft is saved after every edit (closing mid-plan keeps the plan). | world + draft plan |
| LOCK | Draft is validated (each order re-checked against rules) and frozen. AI plan is computed **from the AI's own observation only** and frozen. | world + both locked plans |
| RESOLVE | `resolveTurn(world, plans)` runs T ticks synchronously (pure, < 20 ms target). Produces the new world and an event log. | new world (+ last event log for replay) |
| REVIEW | View animates the event log. Logically the turn is already complete; closing during the animation resumes at the next PLAN with a "replay last turn" button. | — |

There is no wall-clock anywhere in the logic. The resolve is not interactive — this is the point of simultaneous planning (commitment under uncertainty).

---

## 3. Turn and tick model

The engine's atomic unit is the **tick**. Modes differ in how many ticks they run between player inputs:

| Mode | Input points | Ticks between inputs |
|---|---|---|
| Strategy | every turn | `T = 6` *(proposal, D14)* |
| Tower Defense | between waves (build phase) | until the wave is resolved (bounded, e.g. ≤ 2 000) |
| Hybrids | per phase (build / deploy) | until the phase is resolved |

Within one tick, systems run in a **fixed order** (each a pure function over the working copy):

1. **Orders** — apply locked commands due at this tick (only to units commandable at plan time, see § 5).
2. **Intent** — every unit evaluates its standing order + doctrine → movement goal and fire intent.
3. **Movement** — simultaneous: all units compute their next cell; conflicts resolved symmetrically (§ 3.1).
4. **Targeting** — each ready weapon picks a target from the *start-of-tick* positions (after movement).
5. **Fire & projectiles** — instant weapons create hits; ballistic weapons spawn projectiles with integer flight time; projectiles due this tick land.
6. **Damage** — all hits of this tick are summed and applied at once (simultaneous: two units can destroy each other).
7. **Status effects** — durations tick down (slow, disabled/EMP, shielded, jammed …).
8. **Removal** — destroyed entities removed, events emitted.
9. **Economy / production / research** — only on the **last tick of a turn** in strategy mode (per-tick rates in TD).
10. **Network** — command graph and coverage recomputed (§ 5).
11. **Vision** — fog of war / last-reported positions updated (§ 7).
12. **Victory** — mode-specific check.

### 3.1 Movement and conflicts

- Square grid, 8-neighbour movement *(proposal, D2)*. Movement points (MP) are integers: each tick a unit gains `speed` MP; entering a cell costs the terrain cost (diagonal = ×1.5, kept integral by base costs of 4/6/8/12). Fractional speeds therefore need no floats, and TD gets smooth sub-cell progress for rendering.
- One ground unit per cell; air (drones) on a separate layer, one per cell.
- **Conflict rule** (D15, refined in I2): if units of *different* sides want the same free cell in the same tick, *none* enters (all "bump", event emitted) — symmetric between sides, which matters for the mirror property test (§ 13). Among contenders of the *same* side the lowest id enters and the others wait. Two units may not swap cells. Paths avoid cells of units that are not moving this tick (structures, holding or arrived units).
  *Why refined:* AI-vs-AI play in I2 showed that the original "everyone bumps" rule deadlocks friendly units heading the same way (two squads blocked each other for the rest of the game). Same-side priority by id keeps the rule deterministic and mirror-consistent (ids are preserved by the mirror).
- A unit whose target cell becomes free later in the same tick does not chain-move (single pass, order-independent).

### 3.2 Combat

- **Deterministic damage** *(proposal, D3)*: no hit rolls. `damage = weapon.base × vs[armorClass] / 100`, integer, minimum 1 if `vs > 0`. Randomness is used only for map generation and AI tie-breaking among equal options (seeded).
- Armor classes: `infantry`, `light`, `heavy`, `structure`, `air`. Each weapon has a percentage row against them (0 = cannot target, e.g. most ground weapons vs `air`).
- Weapons have `range` (squared integer distance), `cooldown` (ticks), optional `minRange`, and a delivery type:
  - `direct` — instant hit on a unit (counterplay: move out of range/line before it fires);
  - `ballistic` — fired at a **cell**, lands after `flight` ticks with optional splash radius (counterplay: predict and move; the core simultaneity puzzle);
  - `beam` — continuous, ramps up while staying on the same target (TD Laser; also usable in strategy).
- Target selection is doctrine-driven: priority class → in-range → lowest remaining HP → nearest → stable id among *enemy* candidates (tie-breaks never compare across sides).
- Terrain: forest/urban = cover (−25 % direct damage taken *(proposal)*), hill = +1 range for direct weapons and +vision, water/ridge impassable for ground.

---

## 4. Factions, units and structures

Both sides use the **same roster** (fairness, smaller content and translation load). Sides are distinguished by *shape and pattern* in addition to colour (§ 12).

Numbers are first balancing guesses; MP = movement points per tick, plain cell costs 4 (≈ cells/turn = MP × 6 / 4).

### 4.1 Units *(proposal — names provisional, D1)*

| Id | Name | Role | HP | Armor | Weapon (dmg / range / cd) | MP | Notes | Cost | Build (turns) |
|---|---|---|---|---|---|---|---|---|---|
| `rifles` | Rifle Squad | cheap line infantry, holds cover | 40 | infantry | 6 / 2 / 1, good vs infantry | 2 | gains cover bonus | 40 | 1 |
| `lancer` | Lancer Team | anti-armor infantry | 35 | infantry | 14 / 3 / 2, good vs heavy | 2 | slow fire | 60 | 1 |
| `outrider` | Outrider | fast scout car | 45 | light | 5 / 2 / 1 | 5 | vision 6, can see emitters | 50 | 1 |
| `warden` | Warden | heavy tank | 140 | heavy | 18 / 3 / 2 | 3 | expensive, slow on rough terrain | 150 | 2 |
| `howitzer` | Field Gun | artillery | 50 | light | 25 / 3–7 / 3, **ballistic**, splash 1 | 2 | must not move in the tick it fires | 120 | 2 |
| `sapper` | Sapper | engineer | 35 | infantry | — | 2 | builds field structures outside coverage, captures deposits, repairs | 50 | 1 |
| `mast-truck` | Mast Truck | mobile relay | 60 | light | — | 4 | **deploy** (1 turn) → relay radius 5; cannot move while deployed | 70 | 1 |
| `field-post` | Field Post | command vehicle | 90 | light | — | 3 | **command source** (like HQ, radius 4) + +2 order capacity (D4) | 160 | 2 |
| `kite` | Kite Drone | air scout / short-range relay | 20 | air | — | 6 | relay radius 3, endurance 4 turns, then returns to a pad automatically | 60 | 1 |
| `jammer` | Static Jammer | electronic warfare | 50 | light | — | 3 | **deploy** → jam field radius 3 (§ 6); visible to enemy while active | 100 | 2 |
| `tracer` | Tracer | signals / counter-EW | 45 | light | — | 3 | locates emitters within 8, **burn-through**: friendly links within 2 ignore jamming | 90 | 2 |

### 4.2 Structures

Strategy defences **are the TD tower archetypes** (shared engine content, § 10). Strategy mode uses the base towers and possibly one tier of branches; TD owns the full branch design.

| Id | Name | Function | HP | Cost |
|---|---|---|---|---|
| `command-post` | Command Post | HQ: command source radius 5, order capacity 4, produces Sappers/Mast Trucks; losing it = defeat (D9) | 400 | — |
| `muster` | Muster Yard | produces infantry | 200 | 100 |
| `motor-pool` | Motor Pool | produces vehicles and drones | 250 | 150 |
| `extractor` | Extractor | on a deposit: +income per turn **only while connected to the network** (D8) | 120 | 80 |
| `relay-mast` | Relay Mast | static relay radius 6 (+2 on hills) | 100 | 60 |
| `lab` | Signal Lab | enables research (§ 8.2) | 150 | 120 |
| `tower-gun` / `tower-artillery` / `tower-laser` / `tower-support` / `tower-specialist` | (TD archetypes) | static defence; Support can act as relay, Specialist as jammer/EMP/anti-drone | 120–200 | 60–140 |

Placement: a structure can be placed on any free buildable cell **inside own command coverage** (construction requires command). A Sapper may build `relay-mast`, `extractor` and `tower-*` outside coverage (frontier building), taking one extra turn.

---

## 5. Command network

### 5.1 Graph

- **Sources**: Command Post, deployed Field Post.
- **Relays**: Relay Mast, deployed Mast Truck, Kite Drone, Support tower (relay variant). Relays only work if they are themselves connected.
- **Link rule** *(proposal, D5)*: node *A* links to node *B* if `dist²(A,B) ≤ min(rA, rB)²` and neither end is jammed (or the link is protected by burn-through). Hills extend a static relay's radius by 2. No line-of-sight in v1 (simplicity; LoS is an option for later).
- **Connected set** = BFS from all sources over valid links. **Coverage** = union of discs of connected nodes.
- Computation: ≤ ~30 nodes per side ⇒ O(n²) link check per tick is negligible. Ordering is canonical (by id) so the result is independent of insertion order (property-tested).

### 5.2 Commandability

- Coverage is evaluated **at the start of PLAN** (end of the previous resolve) and shown to the player. A unit is **commandable this turn** if its cell is covered and it is not jammed.
- Commandable units may get a new standing order and doctrine; production, placement and research also require coverage (of the producing structure / target cell).
- Non-commandable units keep executing their **last standing order + doctrine** for the whole turn. The UI shows them as "out of contact" (icon + pattern, not colour only) and still lets the player inspect them.
- **Order capacity** *(proposal, D4)*: each source provides a number of *order slots* per turn (Command Post 4, Field Post 2, research +1). Changing a unit's order or doctrine costs one slot; production/placement/research do not. This turns command bandwidth into a resource without micromanagement overload and keeps turns short on mobile. Option: no limit.
- Orders take effect at tick 1 of the resolve. Mid-turn network changes do not cancel already delivered orders (they were received).

### 5.3 Information follows the network *(proposal, D7)*

Units outside coverage still see, but **their sightings are not reported**: the player sees enemy positions only through connected units/structures; out-of-contact units show their *last reported* position (ghost). Information and command thus share one infrastructure — the reference conversation's "information and communication become a resource".

---

## 6. Electronic warfare

| Mechanic | Rule *(proposal)* | Counterplay |
|---|---|---|
| **Jam field** | A deployed Static Jammer (or Specialist tower in jammer configuration) jams radius 3: enemy *nodes* inside cannot relay, enemy *units* inside are not commandable. | Destroy it, move relays out, burn-through, reroute through other relays. |
| **Emitter exposure** | An active jammer is visible to the enemy (as emitter, exact cell) within radius 8, even in fog. Jamming is never free intel-wise. | Jam briefly, relocate (deploy costs a turn). |
| **Direction finding** | Tracer reveals all enemy emitters (jammers, deployed relays, sources) within radius 8. | Keep relays out of tracer range; kill the tracer. |
| **Burn-through** | Friendly links with both ends within radius 2 of a Tracer ignore jamming. | Focus fire on the Tracer. |
| **EMP** (Specialist tower / research) | Ballistic pulse: units in radius 1 get `disabled` for 6 ticks (cannot move/fire/relay). | Spread out, shielded variants (Support). |

Not in v1 (possible later): spoofing/false orders, hacking units. They are hard to make readable and easily feel unfair.

---

## 7. Doctrines (standing orders)

Every unit always has a **standing order** plus **doctrine modifiers**; "giving an order" means replacing them. The same evaluator drives AI units and TD wave units (an attacking TD unit is just "advance along path, priority structures, never retreat").

Standing orders *(proposal, D6)*:

| Order | Behaviour |
|---|---|
| `hold` | Stay; fire at targets in range. |
| `advance(to)` | Path to cell/waypoint; fire while moving if the weapon allows. |
| `attack(target)` | Move into range of a specific enemy and engage it. |
| `escort(unit)` | Stay within 1–2 cells of a friendly unit; engage threats to it. |
| `guard(structure)` | Stay near a structure/relay; engage anything approaching it ("protect relay"). |
| `patrol(a,b)` | Move between two cells. |
| `regroup` | Move back toward the nearest coverage (re-establish contact). |

Modifiers (each optional, one value):

- **Retreat below X % HP** (25/50/75) → switch to `regroup`.
- **Target priority**: nearest / armor / infantry / structures / emitters.
- **Seek cover**: prefer cover cells when choosing among equal-cost paths/stops.
- **Fire discipline**: free / return fire only (stealth, e.g. scouts).

Rationale for a fixed menu rather than freely composable if/then rules ("gambits"): readability on a phone, small translation surface, exhaustive testing of all combinations; composability can be added later without changing the save format (doctrines are data).

---

## 8. Economy, production, research

### 8.1 Economy *(proposal, D8)*

- One resource: **Supply**. Start: 300.
- Income: Command Post +20/turn; each **connected** Extractor on a deposit +15/turn (disconnected extractors produce nothing — supply lines run through the command network, giving jammers and relays economic weight).
- Deposits are finite (e.g. 300 per deposit) so the map pushes expansion and the game toward an end.
- No harvester units (avoids the most iconic RTS loop and a lot of pathing micromanagement).
- Upkeep: none in v1.

### 8.2 Production and research

- Each production structure has a queue of length 2; units appear on an adjacent free cell at the end of the turn (blocked → waits).
- Research (requires Signal Lab, one project at a time, 2–3 turns each). Small tree, 3 tracks × 2 tiers *(proposal, D9)*:
  - **Signals**: relay radius +1 → order capacity +1 per source.
  - **Logistics**: extractor yield +5 → production time −1 for vehicles (min 1).
  - **Ordnance**: armor penetration (+20 % vs heavy) → unlock one tower branch per archetype.

Trade-off matrix the spec asks for — each spending choice competes with: economy (extractors), territory (frontier relays), production (yards), mobility (vehicles/drones), research (lab + time), intelligence (outriders, kites, tracers), communication (masts, field posts), static defence (towers), mobile power (warden, field gun).

---

## 9. Map, session length, victory

### 9.1 Maps

- Seeded procedural generator producing **mirror-symmetric** maps (point symmetry), validated by an independent checker (both HQs reachable, equal deposits per side, no unreachable deposits, minimum distance between HQs) — generator → validator, as the spec requires for puzzles.
- Terrain: plain, road, forest, hill, urban, swamp, water, ridge.
- Plus 2–3 hand-made scenarios (tutorial-like "Field Exercise" with a 6-turn limit; also used by e2e).

### 9.2 Size and duration *(proposal, D12)*

| Size | Grid | Turn limit | Typical duration |
|---|---|---|---|
| Small | 16 × 16 | 20 | 10–20 min |
| Medium | 22 × 22 | 30 | 20–35 min |

Difficulty = AI strength (easy / normal / hard), independent of map size.

### 9.3 Victory *(proposal, D11)*

1. Destroy the enemy Command Post → immediate win.
2. Otherwise at the turn limit: higher **control score** wins (connected extractors × 2 + covered cells / 10 + surviving value / 100); equal → draw.
3. Surrender is always available (outcome `lost`, no penalty of any kind).

The turn limit guarantees a natural end; no "one more turn" escalation.

---

## 10. Engine architecture (`@wp/strategy-engine`)

Dependencies: `@wp/game-core` only (RNG, types). No DOM. No third-party dependencies.

### 10.1 Modules

```text
packages/strategy-engine/src/
  math/        fixed-point helpers, int distance, canonical ordering
  map/         grid, terrain table, symmetric generator, validator
  path/        A* (single unit), Dijkstra flow fields (TD waves), deterministic tie-breaks
  entities/    entity records, archetype catalogue types, id allocation
  systems/     orders, intent (doctrine), movement, targeting, projectiles,
               damage, status, economy, production, research, network, vision
  sim/         tick(), runTicks(), resolveTurn(), event log
  modes/       ModeDefinition: system set, victory rules, phase structure
  ai/          observation(), planner (utility-based), difficulty profiles
  serialize/   isValidWorld(), migrate(), canonical hash
  content/     shared archetypes (units, towers incl. TD base types) — data only
```

### 10.2 Data model

- **World** = plain JSON: `{ v, tick, turn, rng, map: { w, h, terrain: string /* 1 char per cell */, deposits }, sides: [...], entities: Entity[] /* sorted by id */, projectiles: [...], nextId }`.
- **Entity** = flat record: `{ id, side, kind (archetype id), x, y, mp, hp, cooldown, order, doctrine, status: [...], deploy?, queue?, … }`. Archetype stats live in the **ruleset** (code/data), not in the save, keeping saves small and balancing changes possible (stateVersion + migration if semantics change).
- **Ruleset** = archetype catalogue + mode parameters; identified by `rulesetId` stored in the world. TD and hybrids ship their own rulesets on top of the shared archetypes.
- **Derived caches** (network graph, coverage bitmap, flow fields, spatial hash) are *never* serialized; they are rebuilt deterministically on restore and after changes.
- **Commands** = data: `{ side, unitId?, type, args }`, validated by the engine against the world (illegal → rejected with reason, never thrown).

### 10.3 Determinism

- Integer arithmetic only in the simulation (positions, MP, HP, damage, ranges as squared distances). No `Math.sin/cos/sqrt/pow` (not guaranteed bit-identical across engines); no `Map`/`Set` iteration order dependence for outcomes (or only insertion-ordered by sorted ids); no `Date`, no `Math.random` (lint).
- RNG: mulberry32 state from `@wp/game-core` stored in the world; separate derived streams for map generation and AI (`seed ^ constant`) so AI changes never alter map generation.
- `worldHash(world)` (FNV-1a over canonical JSON) for golden replays and tests.

### 10.4 Serialization and resumability

Game save (`StrategyState`, `stateVersion: 1`):

```ts
{
  world: World,                 // full simulation state incl. rng
  phase: 'plan' | 'review' | 'finished',
  draft: Command[],             // the player's unlocked plan — survives closing
  lastEvents?: SimEvent[],      // for "replay last turn" (optional, capped)
  log: { turn: number; plans: [Command[], Command[]] }[], // full command log: reproduction and bug reports
  settings: { size, difficulty, opponent }
}
```

The AI plan is computed at LOCK and immediately resolved, so no locked-but-unresolved state exists; closing at any moment loses nothing. Expected save size: small map ~10–25 kB, log ~1 kB/turn.

`isValidState` = hand-written structural guards (bounds, ids unique, enums, entity kinds known to the ruleset, cell indices in range) — never throws, fuzzed in the contract suite.

### 10.5 Performance budget (mid-range phone)

- Strategy: ≤ 150 entities; `resolveTurn` (6 ticks) ≤ 20 ms; AI plan ≤ 150 ms (iteration-bounded, not time-bounded, to stay deterministic).
- TD: ≤ 400 entities; ≥ 30 ticks/s with spatial hash for targeting and flow fields for paths.
- Engine works on a mutable working copy inside `resolveTurn` (one `structuredClone` per call) — the public API stays pure (input never mutated; property-tested).
- Chunk budget: engine + game ≤ 120 kB gzipped *(proposal)*, lazy-loaded with the game.

### 10.6 Mode composition (for TD and hybrids)

```ts
interface ModeDefinition {
  id: string;
  systems: readonly SystemId[];          // subset + order of § 3 systems
  phases: readonly PhaseDefinition[];    // e.g. strategy: plan→resolve(T); TD: build→wave(until clear)
  victory(world, ruleset): Outcome | undefined;
  spawns?(world, ruleset): SpawnInstruction[]; // waves, external forces (hybrids)
}
```

Hybrid needs map directly onto engine primitives: external force = scripted side with `advance` doctrine and a split path; "VS Large" = two wave sides meeting via normal combat, survivors continue their standing order to the enemy base. Details stay with the TD workstream; the API is in ADR 0009.

---

## 11. AI

- Deterministic, local, no ML. Works only on its **observation** (`observe(world, side)`: own entities + what its network reports + memory of last-seen enemies). It never reads the player's draft or locked plan; this is enforced structurally (the planner receives the observation, not the world) and property-tested.
- Two layers:
  1. **Strategic** (per turn): budget split between economy / network / army / defence / research by a utility function with difficulty-specific weights and simple build-order templates; places relays to keep its army in coverage; decides jamming when it sees an enemy relay chain.
  2. **Tactical** (per commandable unit): candidate orders scored by a 1-turn lookahead against a *predicted* enemy response (assume enemies continue current movement; score ballistic targets by likely positions), greedy with order-slot budget.
- Difficulty: easy (no lookahead, weaker economy weights, no EW), normal, hard (lookahead, EW use, better target prediction). No resource cheats at any level (honest opponent); fog applies to the AI as well.
- Tie-breaking uses the AI's own RNG stream → reproducible.

---

## 12. Rendering and input

*(proposal, D13)* **Canvas 2D for the map + DOM for everything else.**

- Canvas: terrain, units, coverage overlay (hatched), jam fields (dotted rings), projectile arcs, replay animation. Integer-cell layout, device-pixel-ratio aware, pan/zoom (pinch, wheel, buttons), min cell size 44 CSS px at default zoom on phones (map scrolls).
- DOM: top bar (turn x/N, Supply, order slots), selection panel (unit info, order and doctrine menus as real buttons), production/research sheets, plan list ("3 orders planned", undo per entry), Lock button, event summary after resolve.
- **Accessible alternative path**: a keyboard grid cursor (arrows/WASD, Enter select, Esc cancel) with an `aria-live` description of the cell ("Warden, yours, 120/140 HP, in contact, hill"), plus a DOM unit list from which every order can be given without the canvas. This also makes e2e tests robust (no pixel clicking).
- Not colour-only: own units = solid shapes, enemy = outlined shapes with a notch; out-of-contact = dashed outline + icon; jammed = zig-zag badge; coverage = hatching; each unit kind has a distinct glyph/letter.
- Reduced motion: replay skipped (or stepwise without interpolation), final state shown with an event list.
- Art: simple vector glyphs drawn in code (no third-party assets → no license review needed).
- Honest accessibility note (spec): the game relies on spatial vision; the text path makes it operable but not equivalent for screen-reader users. The rules text says so.

---

## 13. Testing strategy

| Level | What |
|---|---|
| **TDD unit** | every system in isolation with tiny hand-built worlds: movement costs, bump rule, cover, damage matrix, ballistic landing, splash, cooldowns, deploy, network BFS, jamming, burn-through, economy (connected/disconnected extractors), production queue, research effects, victory/turn limit, doctrine evaluator (each order × modifier). |
| **Property (fast-check)** | **(P1) determinism**: same seed + state + commands ⇒ identical `worldHash`. **(P2) purity**: `resolveTurn` never mutates its inputs. **(P3) save round-trip**: `restore(serialize(w))` continues identically for arbitrary command sequences. **(P4) mirror symmetry**: a point-mirrored world with mirrored commands yields the mirrored result (catches side bias / id-order bias). **(P5) invariants**: 0 < hp ≤ max, unique ids, ≤ 1 ground unit per cell, supply ≥ 0, entities inside map. **(P6) network monotonicity**: adding a relay never shrinks coverage; adding a jammer never grows it. **(P7) command gating**: orders to non-commandable units are always rejected. **(P8) AI fairness**: the AI plan is invariant under any change of the opponent's draft/locked plan and of unobserved enemy entities. **(P9) generator**: every generated map passes the independent validator and is symmetric. |
| **Fuzz** | random (valid and invalid) command streams over many turns never throw and keep invariants; `isValidState` on arbitrary data never throws (contract). |
| **Golden replays** | a few `seed + command log ⇒ hash` fixtures; intentional rule changes update them explicitly (reviewed diff). |
| **Contract** | `runGameContract` for `games/relay-command` (16 locales, resume, pause, reset, dispose). |
| **Mutation (Stryker)** | `strategy-engine/src/{systems/{damage,targeting,movement,network,economy},sim,serialize}` and `games/strategy/src/rules.ts`; target ≥ 75 % on combat and network (above the repo break threshold of 65 %). Presentation code excluded. |
| **AI** | AI vs AI smoke matches over many seeds: always terminate, no invalid commands, hard beats easy in ≥ 70 % *(statistical, seeded, so stable)*. |
| **E2E (Playwright)** | open `/games/strategy?seed=…`, start the Field Exercise, issue orders via the DOM unit list, lock, reload mid-plan (draft preserved — `expectResumeAfterReload`), finish within the turn limit; phone + desktop viewports; keyboard-only flow. |

---

## 14. Open decisions

**Outcome (2026-10-07):** D1 → **Relay Command**, id `relay-command`. D2–D17 → option (a) as recommended. D4, D6, D7, D9, D12 and D16 are explicitly provisional ("for now"); all decisions apply to the first implementation and may be revisited iteratively.

Each with options and my recommendation (**★**). Decisions marked **[blocks I1]** are needed before the engine core; the others can be confirmed later but shape the design.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1** | Game name / id | (a) **Relay Front**, id `relay-front`; (b) "Signal Line", id `signal-line`; (c) neutral "Command Grid" | ★ (a) — names the core mechanic. Package dir stays `packages/games/relay-command`? I'd rather use the id as dir (`packages/games/relay-front`) for consistency with other games. Trademark check is a web search, not a legal opinion. |
| **D2** | Grid geometry **[blocks I1]** | (a) **square, 8-neighbour, diagonal ×1.5**; (b) hex; (c) square 4-neighbour | ★ (a): simplest keyboard navigation and TD tower placement, integer costs; hex is prettier for ranges but awkward on keyboard and for TD paths; 4-neighbour feels artificial. |
| **D3** | Combat randomness **[blocks I1]** | (a) **fully deterministic**; (b) small bounded variance (±10 %, seeded); (c) hit chances | ★ (a): planning game, simultaneity already supplies uncertainty; best testability. (c) feels unfair under simultaneous resolution. |
| **D4** | Command limit | (a) **order slots per turn** (HQ 4, Field Post +2); (b) unlimited orders for covered units; (c) slots plus order delay by hop count | ★ (a): makes command bandwidth a resource and caps planning time per turn on mobile. (c) is deeper but hard to read. |
| **D5** | Link rule | (a) **radius only, `min(rA, rB)`, hills +2**; (b) radius + terrain line-of-sight; (c) radius of the transmitter only (directional) | ★ (a) for v1, LoS (b) later as research/terrain feature if play-testing shows the network is too easy. |
| **D6** | Doctrine model | (a) **fixed standing orders + 4 modifiers**; (b) freely composable if/then rules; (c) orders only, no modifiers | ★ (a): readable, testable, small translation surface; extensible later. |
| **D7** | Information model | (a) **fog + reports only via network (ghosts for out-of-contact units)**; (b) plain fog of war; (c) no fog | ★ (a): strongest expression of "information as a resource"; (c) would weaken scouts/EW. Risk: harder to learn → covered by Field Exercise. |
| **D8** | Economy | (a) **static Extractors on deposits, income only when connected**; (b) collector units (classic RTS loop); (c) income per covered territory | ★ (a): ties economy to the network, no harvesting micro, clearly distinct from C&C. |
| **D9** | Research in v1 | (a) **small tree: 3 tracks × 2 tiers**; (b) none in v1, add later; (c) larger tree | ★ (a) after the first playable map (increment 5), to cover the spec's research trade-off without bloat. |
| **D10** | Opponents | (a) AI only; (b) **AI + pass-and-play hot-seat** (plans hidden behind a hand-over screen); (c) AI + online (needs backend — excluded by spec) | ★ (b): hot-seat is cheap with simultaneous planning (same command format), but comes after the AI. |
| **D11** | Victory | (a) **Command Post destroyed, else control score at turn limit**; (b) only HQ destruction (risk of long games); (c) objective points held for K turns | ★ (a): natural end guaranteed; (c) is a candidate for a second scenario type. |
| **D12** | Map size / session | (a) **Small 16² / 20 turns, Medium 22² / 30 turns**; (b) single 20² size; (c) three sizes incl. 30² | ★ (a): small fits the "instead of scrolling" use case; 30² is too large for phones without heavy UI work. |
| **D13** | Rendering **[blocks I2]** | (a) **Canvas map + DOM panels + keyboard grid cursor**; (b) SVG (all DOM); (c) pure DOM grid of buttons | ★ (a): scales to TD entity counts; (b) is simpler for a11y/e2e but costly with hundreds of animated entities; (c) does not scale. |
| **D14** | Ticks per turn **[blocks I1]** | (a) **6**; (b) 4; (c) 10 | ★ (a): enough granularity for ballistic flight time and dodging, divisible for speeds 2/3. |
| **D15** | Movement conflict **[blocks I1]** | (a) **all contenders bump (symmetric)**; (b) priority by unit class (infantry yields to vehicles), then bump; (c) contested cell → instant melee | ★ (a): symmetric, predictable, mirror-testable. |
| **D16** | Ownership of tower content | (a) **shared archetypes in `strategy-engine/content` (base stats), TD workstream owns branches/balancing in its ruleset**; (b) each mode defines its own towers completely | ★ (a): one implementation of each tower mechanic (beam, ballistic, aura, jammer), consistent with "no separate TD implementation". Needs sign-off from the TD workstream. |
| **D17** | Shared-package ownership | (a) **this workstream owns `packages/strategy-engine`** (CLAUDE.md lists future engines under the orchestrator); (b) orchestrator owns it, this workstream proposes changes | ★ (a) as assigned in the task brief; I'd record it in ADR 0009 and update `CLAUDE.md` roles accordingly — needs your confirmation since it changes ADR 0006 practice. |

### Risks and assumptions

- **Translation load**: ~11 unit names, ~10 structures, ~11 orders/modifiers, EW terms, tutorial text × 16 locales (≈ 150–200 keys). Non-en/de translations are AI-assisted (existing policy); military/technical terms need careful wording.
- **Learnability**: network + doctrines + simultaneity is a lot. Mitigation: Field Exercise scenario, clear coverage overlay, "why didn't my unit obey?" explanation in the event log.
- **Balancing** is empirical: AI-vs-AI statistics plus your play-testing; numbers above are placeholders.
- **Mobile UI** is the main implementation risk (selection, map panning, 44 px targets on a 16² map). Assumption: the map scrolls; the DOM unit list is the fallback.
- **Parallel TD workstream**: the engine API must be stable early. Mitigation: ADR 0009 as *Proposed* now; engine core (I1) lands first with tower/projectile/flow-field primitives.

---

## 15. Implementation increments (after decisions)

| # | Increment | Deliverable / gate |
|---|---|---|
| I1 ✅ | Engine core (TDD) | grid, terrain, A*/flow field, entities, tick loop, movement + conflicts, damage/targeting/projectiles, status, serialization, hash; properties P1–P5; mutation on combat |
| I2 ✅ | Minimal playable map | `games/<id>`: canvas + DOM UI, plan→lock→resolve, Field Exercise, scripted dummy AI; contract + e2e; registry entry |
| I3 | Command network | **I3a ✅** sources/relays/coverage, commandability, order slots, deploying, P6/P7 · **I3b ✅** doctrines · **I3c ✅** information model (D7); mutation on network |
| I4 | Electronic warfare | **✅** jammer, emitters, tracer/burn-through, EMP status (already via the EMP tower's `disabled`), priority 'emitters' |
| I5 | AI | **✅** observation, tactical planner (one-turn lookahead), difficulties easy/normal/hard; P8; AI-vs-AI suite · strategic layer (economy) with I6 |
| I6 | Economy/research/maps + balancing | **I6a ✅** economy (Supply, deposits, Extractors, Muster Yard, Motor Pool, production queues, placement), spending and siege opponent · I6b research tree · I6c symmetric generator + validator (P9), medium map · I6d balancing pass · hot-seat only after D10 is confirmed |

UX round after I5 (owner feedback): structures are squares and set-up vehicles stand on a plate; a visible legend lists every terrain with move cost, cover and range bonus, plus the map shapes and overlays; a uniform stat card (health, armour, weapon with effect per armour class, fire rate, speed, vision, radio and EW roles) replaces text-only descriptions; unarmed units get their own hint and refusal; the turn limit is a pre-game choice (open end by default, 12 or 24 turns) together with the map; the second map Ridge Valley (20×14, 14 units per side incl. a Field Post and two Mast Trucks) is hand-made and point-symmetric; the player's units carry the doctrine "return into coverage after a turn without contact" by default (switchable per unit). Open-ended games end when a Command Post falls, or on strength after 12 turns in a row without any loss on either side (the turn line says so from the third quiet turn) or at turn 1000, so a game nobody can win any more still ends; saves cap the turn count there. Saves from before the doctrine keep `lostContact: 'keep'` for every unit (a resumed game plays on as it did); 'regroup' is the default for new games only.

I6a notes (economy, D8): one resource, Supply (start 300). The Command Post yields 20 per turn; an Extractor (80, 2 turns) on a deposit yields 15 per turn while it stands inside the own coverage, until the deposit (300) runs dry. Yards produce (Muster Yard 100 / 2 turns: Rifle Squad, Lancer Team; Motor Pool 150 / 3 turns: Outrider, Warden, Field Gun, Mast Truck, Field Post, Static Jammer, Tracer); a produced unit appears next to its yard at the end of the turn its build time is up (a boxed-in yard waits) and follows the yard's doctrine. The Command Post (or a set-up Field Post) places structures on free cells inside the own coverage; Extractors only on deposits. Production and placement are one-shot commands, paid at once, one order slot each; a structure may plan several per turn (the UI checks each against the Supply the planned ones leave). Both maps start with a Muster Yard per side and mirrored deposits (Field Exercise 2 per side incl. a contested road deposit; Ridge Valley 3 per side incl. one at the ford). Sites are hatched squares with the turns left; deposits carry a diamond mark; the turn line shows Supply and income. Open end: a quiet turn is now one without a fight (nothing hit or destroyed), since income and production alone would keep every game going. Saves v5 migrate (old maps have no deposits or yards and play on). No sapper, research or map generator yet (I6b/I6c). Opponent: Extractors on deposits out of reach of known enemy fighters first, a Motor Pool from turn 6 (or once two Extractors stand), units from a level template (normal: rifles, lancer, outrider, gun, rifles; hard: lancer, rifles, outrider, gun, warden, one more of each), saving up for the gun or scout it needs most unless the force is thin; easy only produces infantry with a cushion and never builds. Siege layer: with a gun in the force the post is besieged, not stormed — the gun attacks it from full range once it is reported, a spotter that sees farther than the post (an Outrider) keeps it in sight from a cell inside own coverage and beyond the known defenders' eyes and reach, the others guard the gun; no lone storms while yards reinforce (at least four orderable fighters, or no yard); the jammer joins storms only. Measured (24 turns, 2×10 mirrored openings; passive: unperturbed start and 8 mild openings per map and mode): a passive player loses every game at normal and hard on both maps, with a turn limit and open end (the quiet rule or the fall of the post ends them, longest 39 turns); hard–easy 10–2 / 12–0, normal–easy 12–0 / 12–0, hard–normal 20–0 on Field Exercise but 8–12 on Ridge Valley — no per-map ordering is claimed, only over both maps. Opponent time per locked turn (Node, incl. the resolve): about 4 ms on Field Exercise, 14 ms on Ridge Valley.

I5 notes: the opponent receives only `observe(world, ruleset, side)` (own units, its own radio net incl. the jamming it feels, enemies as reported; `nextId` derived from what it knows), so honesty is structural (P8, incl. hidden positions and projectiles). Easy engages the nearest spotted enemy it can hit or advances on a known position, never alone (company within 3 cells). Normal and hard add a strategic layer: fighters mass at a rally point 6 cells in front of the known enemy post, moved to the nearest cell inside the own coverage (they gather under radio cover and move up as the relay truck extends it; on the way a fighter that loses contact comes back, doctrine `regroup`), and once 80 % (normal) / 90 % (hard) of the *orderable* fighters are there, or from turn 6 whatever has gathered, or when the force is tiny, all of them storm the post — infantry onto it, artillery attacks it from its full range once the stormers report it, else moves to where it sees the post for itself (only a spotted target can be attacked; that cell may lie inside its minimum range, it backs off to a firing position once the post is spotted). Fighters with a spotted enemy in reach choose their order by a one-turn lookahead (candidates: hold, attack the nearest spotted enemies, advance with company, regroup when badly hurt), simulated with everything the side knows (ghosts included, assumed to hold), charging a share of the unit's value for ending where no own unit can see (ambush risk); a slot is spent only when a new order beats keeping the current one. Normal weighs own losses by 1.2, hard by 1.1 and looks at more fighters and targets, rewards focusing fire on a target others already attack, pulls an outweighed fighter back to the rally point, and sets its jammer up near a known enemy relay or post once the storm is on (only out of reach of known enemy fighters); the tracer and an idle jammer escort the relay truck. Relay trucks set up on the covered cell nearest the enemy post, up to 8 cells from the own post, that no known enemy fighter can reach (a relay lost early froze the advance). Measured over 2×10 mirrored random openings (24 turns): hard beats easy 20–0 (Field Exercise) / 20–0 (Ridge Valley), normal beats easy 16–4 / 18–2, hard vs normal 16–2 (2 draws) on Field Exercise but 8–10 (2 draws) on Ridge Valley — no strict hard > normal ordering is claimed. A passive player (never giving an order), 8 openings per map and mode (turn limit 24 and open end, which the stall rule ends): Field Exercise normal 6 lost / 2 won, hard 4 / 4 (the wins by a few points); Ridge Valley normal 5 / 2 / 1 draw, hard 4 / 3; easy stays passively beatable (documented, not a goal). These openings nudge units before turn 0; from the unperturbed Ridge Valley start, and when the nudges happen during a resolved first turn instead, a passive player beats normal on Ridge Valley and hard in most such games — Ridge Valley normal and hard can be beaten passively until the siege layer (I6). Attacking an intact static defence is costly in this engine (cover, focus, the defenders' artillery), so the opponent's edge against a turtle is small; outcomes are also sensitive to small changes (the engine draws no randomness), so the tests assert margins over many openings, not single games. The level is chosen in the app before a new game and restored from the save (`setDifficulty`). The strategic economy (budget split, build orders) comes with I6. Attacks that cannot close in for three turns end as `outpaced`.

I4 notes: a Static Jammer (`jammer`) works after a full turn set up; enemy nodes on jammed cells take no part in the network and jammed cells are never covered, so units there cannot receive orders. A jammer next to a Command Post silences that side's network (no slots) until it is destroyed, moved or burnt through. A Tracer (`tracer`) frees the cells within 2 of it from jamming (burn-through) and locates enemy emitters (working nodes and jammers) within 8, even out of sight; any reporting unit locates a working jammer within 8 (emitter exposure). Located emitters count as spotted, so artillery can fire on them. Target priority 'emitters' prefers them. Field Exercise gives each side one jammer and one tracer; the scripted opponent sets its jammer up within reach of a known enemy relay or post while staying in contact, and keeps its tracer with its relay truck. The map crosses cells where the player's own radio is jammed with a zigzag line.

I3c notes (D7): units in coverage report what they see (vision radius, no line of sight yet); everything else is remembered at its last reported position (ghosts). At the start each side knows its own units and all structures (the enemy Command Post gives the first goal). Enemy ghosts disappear once their cell is seen empty (no false certainty); own units out of contact stay as ghosts until they report again or their destruction is observed. Weapons fire only at spotted targets or what the shooter sees itself, so the Field Gun (range 7, vision 3, minimum range 3) needs a spotter in contact; attack orders need a spotted target. An attack follows only reports: a target out of sight is sought at its last reported cell (never at its true position) from a firing position the unit can see from, and the order ends when the cell is found empty. At the end of a game everything is revealed. The turn summary lists only events the player could know about; the map veils unobserved cells (wash plus dot) and draws ghosts faded with a dashed outline and a question mark. The opponent plans with its own side's reports only and advances on known positions when nothing is in sight. Saves move to state version 3 (ruleset `strategy-2`); older games continue with reports rebuilt from what each side sees at that moment.

I3b notes: standing orders escort/guard, patrol and regroup plus the four doctrine modifiers of § 7; a doctrine travels with an order and costs the same slot. Target priority adds 'weakest' (the previous default) to the § 7 list; 'emitters' follows with electronic warfare (I4). The opponent gives its fighters 'retreat below 25 %'. The map shows patrol (dashed, rings at both ends) and escort (dotted) lines; a click-mode switch picks what the next map click means.

I3a notes: `STRATEGY_RULESET` turns the network on (Tower Defense keeps `BASE_RULESET`); the engine enforces coverage and order slots for both sides, so the opponent obeys the same limits. Each side's Field Exercise force gains a Mast Truck. Saves of state version 1 are migrated to the network rules instead of being discarded.

I2 notes: the opponent is a scripted, deterministic AI (engage the nearest reachable enemy); the resolve is shown as the final state plus a text summary and markers for destroyed units (animated replay later); on phones the 12 × 12 map (44 px cells) scrolls inside its frame, pinch-zoom follows later. The end-of-game "control score" of § 9.3 is approximated by remaining strength (unit cost × health share, Command Post = 300) until extractors and coverage exist (I3/I6).

Each increment: tests in the same change, `pnpm check`, `pnpm build && pnpm e2e`, pushed to `feature/strategy-engine`, PR against `main`, merge only with green CI.
