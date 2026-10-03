# Design: Tower Defense and Strategy/TD hybrid modes

Status: **Draft for owner decision** (Phase 1 — no implementation yet). Open decisions are collected in [§ 14](#14-open-decisions).
Scope: game `tower-defense` (M7) and game `strategy-td-hybrid` with four modes (M7).
Binding inputs: [implementation brief](../spec/implementation-brief.md) (sections *Tower Defense*, *Shared Strategy / Tower Defense engine*, *Strategy / Tower Defense hybrid*, *Laser Circuit*, *Determinism*, *Universal resumability*, *Definition of Done*), [reference conversation](../product/reference-conversation.md) (Prompts 2–3), ADRs 0001–0007.

Ownership: the shared simulation (`packages/strategy-engine`) is designed and built in the *Strategy engine* context. This document defines what Tower Defense and the hybrid modes need from it ([§ 12](#12-requirements-for-the-shared-strategy-engine)) and everything that is TD-specific. Nothing here proposes a second engine.

---

## 1. Goals and non-goals

**Goals**

- A *planning* game: the interesting decisions are where to build, which branch to take, and how to spend a limited budget against a known threat — not reaction speed.
- Five strategically distinct tower families with branch upgrades that remove a capability as well as adding one ("not just el-td").
- Clear end points: a map is a fixed number of waves (default 12). No endless mode, no score chasing loop.
- Exact resumability at any moment, including in the middle of a wave.
- Fully deterministic: `map + seed + difficulty + commands` reproduces every state bit for bit.
- The same rules, towers and enemies power the four hybrid modes.

**Non-goals**

- Endless/survival mode, leaderboards, daily challenges, unlock grinding, currencies across sessions.
- Real-time micro-management or APM pressure.
- Any name, unit, map, art or sound from Command & Conquer (or other TD titles).
- Online multiplayer (all opponents are local AI; local two-player is an open decision, [D15](#14-open-decisions)).

---

## 2. Core loop and time model

### 2.1 Recommended model: phase-based "plan → lock → resolve"

```text
┌──────────────── BUILD PHASE (no clock) ────────────────┐
│ next wave fully previewed · build · upgrade · sell     │
│ change targeting · undo freely (nothing has happened)  │
└──────────────────────────┬─────────────────────────────┘
                           │ "Start wave" (= lock)
┌──────────────────────────▼─────────────────────────────┐
│ WAVE PHASE: deterministic simulation, fixed ticks       │
│ watch at 1× / 2× / 4×, pause any moment, or "resolve   │
│ instantly"; no build commands                           │
└──────────────────────────┬─────────────────────────────┘
                           │ last enemy killed or leaked
                    wave summary → next build phase … → after wave N: finished()
```

Why this over pausable real time:

| Criterion | Phase-based (recommended) | Pausable real time (build any time) |
|---|---|---|
| Product fit ("planning, not reflexes") | Pure planning; speed of play irrelevant | Rewards fast reactions unless player pauses constantly |
| Same structure as strategy engine (PLAN→LOCK→RESOLVE) and hybrid modes | Identical; hybrid = both sides lock simultaneously | Hybrid would need a second time model |
| Determinism & replay | Commands only at phase boundaries → trivially reproducible | Needs tick-stamped commands (still deterministic, more surface) |
| Accessibility (motor, screen reader, slow devices) | No time pressure at all | Pause button becomes mandatory crutch |
| "Never require timers for correctness" | Wave is a pure `step()` function; view only paces it | Same, but inputs interleave with the clock |
| Weakness | Waves are watched, not played; a misjudged wave cannot be corrected mid-way | More "lively" |

Mitigations for the weakness: waves are short (≈ 20–45 s at 1×), can be fast-forwarded or resolved instantly, the full composition is visible beforehand, and a lost map can be retried from the start of the failed wave ([D5](#14-open-decisions)).
A possible later extension — limited *tactical* commands while paused (retarget, trigger a one-shot ability) as tick-stamped commands — is kept compatible ([D1](#14-open-decisions), option c).

### 2.2 Simulation clock

- Fixed tick, **20 ticks per simulated second**. Playback speed only changes how many ticks the view advances per animation frame; it never changes results (property-tested: `step(a+b) ≡ step(a); step(b)`).
- "Resolve instantly" runs the remaining ticks synchronously (hard upper bound, see § 10).
- `pause()` stops the view's frame loop. The logical state is unchanged (contract test).

---

## 3. Map and path model

### 3.1 Recommended: coarse grid + fixed path graph (no mazing)

- Logical grid of **9 × 15 cells** (portrait). On landscape screens the view rotates the map by 90° — a pure view transform; rules never see it. At 360 px CSS width this yields ≈ 40 px cells; build cells get a ≥ 44 px hit area via the selection model (§ 9.3).
- Cell kinds: `path`, `build`, `blocked` (scenery), `core` (the defended site), `spawn`, optional `mirror-socket` (§ 5.3, Prism).
- **Paths are a directed graph of polylines** (spawn → … → core), authored per map. Towers never block paths (no mazing): mazing creates degenerate "maze length" optimisation, needs full-block validation and fights touch input ([D3](#14-open-decisions)).
- **Splits**: a node may have several outgoing edges with a deterministic routing rule — `roundRobin(weights)` (unit k of a group takes branch by weighted round robin) or `byKind` (e.g. heavy units take the bridge). No randomness at routing time → the preview can show exactly who goes where. Merges are plain graph joins.
- **Air lane**: flying enemies follow their own authored polyline (usually shorter and more direct), so ground-only towers cannot cover them by placement alone.
- Enemy position is **1-D progress along its polyline** (integer milli-tiles). World coordinates are derived; all range checks use squared integer distances. This makes movement exact, cheap and trivially serializable.

### 3.2 Map content (v1 proposal, [D7](#14-open-decisions))

| Map | Waves | Teaches |
|---|---|---|
| Training ground | 6 | placing, upgrading, branches, reading the preview |
| Fork | 12 | a split path; covering two lanes vs. one choke point |
| Long bend | 12 | Artillery/Howitzer coverage; Prism mirror sockets along straights |
| Twin approach | 12 | separate ground and air approaches; Support adjacency |

All maps are available from the start (no unlock gating). Maps are hand-authored data, validated by tests (connected graph, every spawn reaches the core, build cells not on paths, ≥ 1 winning reference strategy per difficulty — § 11).

---

## 4. Waves and enemies

### 4.1 Wave structure

- A map = fixed list of waves (default 12). Victory = all waves survived with core integrity > 0. Defeat = core integrity reaches 0.
- A wave = list of spawn groups `{ enemyKind, count, spacingTicks, startTick, spawnId }`.
- **The next wave is fully previewed** in the build phase: kinds, counts, which branch of each split they take, total threat ([D4](#14-open-decisions)). The game is about solving a known problem with limited means.
- Waves introduce archetypes progressively; waves 4, 8 and 12 are "mixed pressure" waves that punish a monoculture defence; wave 12 contains a final heavy unit.
- **Seed role** ([D8](#14-open-decisions)): each wave slot has 2–3 authored variants; the seed picks one per slot at `newGame`. Replays differ, everything stays authored and balanced. Procedural maps are out of scope for v1.

### 4.2 Enemy archetypes (original names, abstract constructs — no creatures, no gore)

| Archetype (working name) | Trait | Main counters | Weak counters |
|---|---|---|---|
| Walker | baseline | anything | — |
| Runner | fast, low HP | Gun/Gatling, slow fields | Artillery (shell flight time), Focus laser (ramp) |
| Swarm | many tiny units in tight groups | Mortar, Prism | Cannon, Focus |
| Brute | high HP, high armour, slow | Cannon, Focus laser, armour shred | Gatling (flat armour eats small hits) |
| Warden | regenerating shield | EMP, lasers (bonus vs shields), burst | slow-and-small damage that never breaks the shield |
| Mender | heals nearby enemies | focus fire, Cannon burst, Howitzer reach | spread-out low damage |
| Glider | flying, own air lane | Gun, Laser, Interceptor | Artillery and Cannon (ground only) |
| Colossus (final) | armour + shield + high HP | combined arms | any monoculture |

### 4.3 Damage model (provisional, tuned by simulation)

- Integer hit points. Damage types: `kinetic`, `explosive`, `energy`.
- **Armour** (flat, per hit): `dealt = max(raw − armour × k, ⌈raw × 20 %⌉)` with `k = 1` for kinetic, `0.5` for explosive, `0` for energy. Many small hits suffer, few large hits do not → Gatling vs Cannon is a real choice.
- **Shield**: absorbs all damage first; energy deals ×1.5 to shields; regenerates after `n` ticks without being hit; EMP removes it and blocks regeneration for a duration.
- **Status effects**: slow (strongest applies, no additive stacking), stun (with immunity window afterwards — prevents permanent lock and guarantees termination), armour shred (stacks up to a cap), shield-block, mark (bonus damage taken). All durations in ticks.
- **Leaks**: an enemy reaching the core removes its `threat` value from core integrity (Walker 1, Brute 3, Colossus 10 …) and is removed.

---

## 5. Towers

Every tower: **Level 1 (base) → Level 2 = choose branch A or B (permanent) → Level 3 (branch capstone)**. 5 families × (1 + 2 × 2) = 25 tower states — compact, but each branch *removes* something as well as adding something. Targeting priority (first / last / strongest / weakest / closest) is a free setting per tower.

Selling: full refund for anything bought in the current build phase (it is an undo — no time has passed); otherwise 70 % of invested credits ([D6](#14-open-decisions)).

Numbers below are starting points for the balance harness (§ 11.3), not final values. Costs in credits, range in tiles, 20 ticks = 1 s.

### 5.1 Gun — cheap all-rounder (kinetic, ground + air)

| | Role | Gains | Gives up |
|---|---|---|---|
| L1 Gun (100) | single target, range 3, 2 shots/s | — | — |
| A: Gatling (+120) | rate of fire ×3, small hits; L3 *spin-up*: fire rate rises while it stays on the same target, resets on retarget | best vs Runners, Swarm, shields | nearly useless vs armour (flat armour per hit) |
| B: Cannon (+150) | heavy shells, partial armour piercing; L3 full piercing | best vs Brute, Mender | **loses air targeting**; slow — overkill on small units |

### 5.2 Artillery — area damage with travel time (explosive, ground only)

Base has a **minimum range** (dead zone) and shells fly ~0.75 s to a predicted impact point; fast units can outrun the prediction at path corners (deterministic, visible).

| | Gains | Gives up |
|---|---|---|
| L1 Artillery (175) | range 4.5, min 1.5, small splash | — |
| A: Howitzer (+175) | range 7 → 9 (L3), covers several path segments from one spot | larger dead zone (2.5), small splash — weak vs Swarm |
| B: Mortar (+150) | big splash, shock slows hit units; L3 leaves a burning zone (damage over time) | range shrinks to 4; misses Runners at corners more often |

### 5.3 Laser — continuous beam (energy, ground + air), reuses Laser Circuit beam logic

Beams hit instantly and ignore armour; damage per tick is low until it **heats up** on the same target.

| | Gains | Gives up |
|---|---|---|
| L1 Laser (150) | single beam, heat ramp up to ×3 after ~3 s on one target | ramp lost on target switch |
| A: Focus (+175) | ramp to ×5, extra shield damage — the boss killer | worse than base vs groups and Runners (ramp never completes) |
| B: Prism (+175) | beam becomes a **line that pierces every enemy on it** and **reflects off mirror pylons** the player places on `mirror-socket` cells (45° reflectors). L3: beam splits at one pylon. | no heat ramp; damage depends entirely on geometry — strong on long straights, weak on twisty maps |

Prism is the deliberate reuse of the Laser Circuit mechanic: routing a beam along path segments is a small spatial puzzle inside the TD ([D11](#14-open-decisions)). Beam tracing (grid ray march, 45° mirrors, splitters, blockers) should be one shared module used by both games (§ 12, R-BEAM).

### 5.4 Support — no damage, changes other towers or enemies

| | Gains | Gives up |
|---|---|---|
| L1 Beacon (125) | aura: +15 % range for towers in radius 1.5; reveals hidden/marked effects | — |
| A: Stasis field (+150) | area slow 35 %; L3 periodic short stun (with immunity window) | no buff to towers |
| B: Amplifier (+175) | adjacent towers (8-neighbourhood) +25 % rate of fire; L3 +damage as well | no effect on enemies; rewards clustering → vulnerable to coverage gaps |

Placement puzzle: Amplifier wants dense clusters, Stasis wants long path exposure — they rarely share the best cell.
Later (hybrid / strategy): Support doubles as **command relay** for the command network ([D12](#14-open-decisions)).

### 5.5 Specialist — answers to specific threats

| | Gains | Gives up |
|---|---|---|
| L1 EMP (150) | periodic pulse: strips shields, blocks shield regeneration, short stun on mechanical units | negligible damage |
| A: Interceptor (+150) | missile salvos, very high damage **vs air only**, long range | **cannot hit ground** |
| B: Corroder (+150) | marks targets: armour shred + mark (+20 % damage taken from all sources) | loses the EMP pulse — shields come back |

### 5.6 Counter overview (design intent; verified by the balance harness)

| | Walker | Runner | Swarm | Brute | Warden | Mender | Glider |
|---|---|---|---|---|---|---|---|
| Gatling | ● | ●● | ● | ✕ | ● | ○ | ●● |
| Cannon | ● | ○ | ✕ | ●● | ● | ●● | ✕ |
| Howitzer | ● | ○ | ○ | ● | ○ | ●● | ✕ |
| Mortar | ● | ○ | ●● | ○ | ○ | ● | ✕ |
| Focus | ● | ✕ | ✕ | ●● | ●● | ● | ● |
| Prism | ● | ● | ●● | ○ | ● | ● | ● |
| Stasis | (support) | ●● | ● | ● | ○ | ○ | ● |
| Amplifier | (multiplies neighbours) | | | | | | |
| Interceptor | ✕ | ✕ | ✕ | ✕ | ✕ | ✕ | ●● |
| Corroder | ○ | ○ | ○ | ●● | ● | ○ | ○ |

●● strong · ● fine · ○ weak · ✕ cannot / near-useless.
Hard requirement checked in CI (§ 11.3): every branch is the best credit-efficiency choice against at least one archetype and among the worst against at least one.

---

## 6. Economy

- Start credits per map/difficulty; fixed **wave income** at the start of each build phase; small **kill bounty** per enemy.
- **No interest** on unspent credits in v1 ([D6](#14-open-decisions)): interest rewards hoarding and snowballing and makes early waves a gamble; a flat income keeps the decision "what is the best use of this budget for the known next wave".
- Spending decisions are fully reversible within a build phase (full-refund undo). After a wave, selling refunds 70 %.
- Credits are always integers; property: credits never negative, every credit change is attributable to a logged command or event.

---

## 7. Session length, pausability and resumability

- Typical session: one map of 12 waves ≈ **12–25 min** (`typicalMinutes: [10, 25]`); training map ≈ 5 min.
- `pauseable: true`. Closing at any moment is safe:
  - build phase: state = map, towers, credits, wave index, RNG state;
  - wave phase: additionally tick, enemies, projectiles, active effects, spawn cursor. The **exact tick** is serialized; nothing is rolled back.
- `requestSave()` after every build command, at wave start (lock), every 100 ticks (5 simulated seconds) during a wave, at wave end. The host additionally serializes on `visibilitychange`/`pagehide`. Correctness never depends on these saves being frequent — any snapshot is exact.
- **Command log** (build commands per wave) is part of the state. Together with `seed + difficulty + mapId` it is a complete bug-repro artefact and the input for golden replays.
- After a defeat the player may **restart from the beginning of the failed wave** (checkpoint = the state at the last lock; [D5](#14-open-decisions)). Retries are shown factually in the summary, never as shame.
- `finished()` once on victory/defeat; the summary shows factual values (core integrity left, credits spent per family, waves). No stars, no "come back tomorrow".

### Serialized state sketch (TD layer; engine state embedded)

```ts
interface TowerDefenseState {
  v: 1;
  mapId: string;
  difficulty: 'relaxed' | 'standard' | 'hard';
  seed: number;
  waveVariants: number[];           // chosen per wave slot at newGame
  phase: 'build' | 'wave' | 'won' | 'lost';
  wave: number;                     // 0-based index of the current/next wave
  checkpoint: unknown | null;       // state at the last lock (for "retry wave")
  log: BuildCommand[][];            // per wave
  sim: EngineState;                 // owned by @wp/strategy-engine: tick, rng, entities, credits, core …
}
```

---

## 8. Victory, difficulty, results

- Difficulties: **Relaxed** (more credits, core 30), **Standard** (core 20), **Hard** (fewer credits, +HP, core 10). No dynamic difficulty adjustment (it hides information and undermines planning).
- Victory: survive the last wave. Defeat: core integrity 0. Both call `finished()` exactly once.
- Results are descriptive only.

---

## 9. Rendering, input, accessibility

### 9.1 Rendering

- **Canvas 2D** for the map layer (cells, path, towers, enemies, projectiles, beams); **DOM** for HUD, build panel, wave preview, summaries (semantic, translatable, accessible). No external assets: everything is vector-drawn → no licence review, tiny chunk, crisp at every DPR.
- Visual style: abstract geometric "signal/construct" look ([D9](#14-open-decisions)). Every tower family and every enemy archetype has a **distinct silhouette plus a letter/glyph**; state (shielded, slowed, marked, branch) is shown by shape overlays and patterns, never by colour alone.
- The view interpolates between ticks for smooth motion; `reducedMotion` disables shake/flash, shortens trails and defaults playback to "resolve per segment".
- The map rotates 90° on landscape viewports (view-only).

### 9.2 Keyboard

Arrow keys move a cell cursor (respecting rotation and RTL), `1`–`5` choose a family, `Enter` build/confirm, `U` upgrade / branch choice, `S` sell, `T` cycle targeting, `Space` start wave / pause, `F` cycle speed, `I` resolve instantly, `Esc` cancel. All also reachable through visible buttons.

### 9.3 Touch / pointer

Tap a cell → it is highlighted and a bottom sheet (≥ 44 px buttons) offers the actions; a second tap is never required on a tiny target. Pinch-zoom is not needed at 9 × 15.

### 9.4 Screen readers — honest limitation

The wave playback is inherently visual. Provided anyway: the build phase is fully operable via the cell cursor with announced cell descriptions ("row 4, column 2, build cell, Gun level 2 Cannon, covers path segments 3–5"), the wave preview is a table, and every wave ends with an `aria-live` summary (kills, leaks, core integrity). The catalogue entry states that the game is primarily visual.

### 9.5 Localization

All texts in 16 locales via `messages.ts` (tower, branch and enemy names are translatable game terms, not proper names). Numbers via `Intl.NumberFormat`. RTL: HUD uses logical properties; the map itself is not mirrored (paths are spatial), but keyboard cursor semantics follow the map.

---

## 10. Determinism and simulation numerics

- All randomness via the engine's seeded RNG (`createRng` / serializable state). The TD layer itself only uses the seed to choose wave variants.
- **Integer arithmetic only** in the simulation: positions in milli-tiles, damage in integer HP, percentages in basis points, durations in ticks. No `Math.sin/cos/atan2/sqrt` in rules (cross-engine float differences); range checks via squared distances; beam geometry on the grid with 45° steps.
- Stable iteration order (entities sorted by deterministic id), deterministic id allocation, no `Map`/`Set` iteration that depends on insertion history across save/restore unless it is reconstructed identically.
- **Termination bound**: every wave ends within `T_max` ticks (e.g. 20 000 ≈ 16 min sim time); enemies always make progress outside stun, and stun has an immunity window. Property-tested.

---

## 11. Test strategy

### 11.1 Unit (TDD, Vitest)

Damage formula per type, armour/shield/regeneration, status-effect stacking and immunity, targeting priorities, upgrade-tree legality (branch exclusivity, costs, refunds), economy, wave-variant selection, map validators, phase machine (build ⇄ wave ⇄ won/lost), retry-from-checkpoint.

### 11.2 Properties (fast-check)

1. **Determinism**: same `map + seed + difficulty + commands` ⇒ identical state hash.
2. **Chunking invariance**: `step(a + b) ≡ step(a); step(b)` (playback speed cannot change results).
3. **Save/restore at any tick**: serialize at random tick k → JSON round trip → restore → continue ≡ uninterrupted run.
4. **Conservation**: `spawned = killed + leaked + alive` at every tick.
5. **Economy**: credits ≥ 0; illegal commands (unaffordable, occupied cell, path cell, invalid branch) are rejected without any state change.
6. **Termination**: every wave of every map ends within `T_max` under random legal builds.
7. **Validation**: `isValidState` never throws on arbitrary input; accepts every reachable state.

### 11.3 Balance harness (simulation-based, runs headless in CI on a small budget, full sweep locally)

Bots operate through the same command API:

| Bot | Purpose | Assertion |
|---|---|---|
| Reference planner (greedy + 1-wave look-ahead) | map is winnable | wins every map on every difficulty |
| Random legal | map is not trivial | loses Standard on every 12-wave map |
| Monoculture (one family / one branch only) | "not just el-td" | each monoculture loses Standard by wave ≤ 12 |
| No-Support / no-Specialist | utility towers matter | loses or ends with clearly less core integrity on maps that introduce Warden/Mender/Glider |

Plus a **credit-efficiency matrix**: for each branch × archetype, damage-to-kill per credit in a standard lane test → asserts the counter table of § 5.6 (each branch best vs ≥ 1 archetype, worst vs ≥ 1).

### 11.4 Golden replays

Recorded command logs with expected final state hash per map. A deliberate balance change updates the goldens in the same commit, which makes balance changes visible in review.

### 11.5 Contract, mutation, e2e

- `runGameContract` with an `interact` that places and upgrades a tower via the DOM.
- Stryker on TD rules and (in the engine context) on combat/simulation modules.
- `e2e/games/tower-defense.spec.ts`: open → build → start wave → reload mid-wave → identical tick resumes → resolve instantly → next wave → finish via a short test map; phone + desktop viewports; keyboard-only flow.
- Performance budget: one full wave of the heaviest map resolves headless in < 50 ms on CI hardware; game chunk size budget to be set with the orchestrator.

---

## 12. Requirements for the shared strategy engine

To be handed to the *Strategy engine* context. IDs are stable for discussion. "Must" = needed for TD v1; "Hybrid" = needed for the hybrid modes; "Should" = strongly preferred.

### Simulation core

- **R-SIM-1 (Must)** Fixed-tick, pure step function: `step(state, n)` advances n ticks; results independent of chunking.
- **R-SIM-2 (Must)** State is plain JSON (no classes, Maps, functions); includes RNG state, tick, id counter. `validate(state)` never throws.
- **R-SIM-3 (Must)** Integer-only arithmetic in rules (milli-tiles, integer HP, basis points, ticks). No transcendental `Math.*` in simulation code.
- **R-SIM-4 (Must)** Deterministic entity ids and stable iteration order.
- **R-SIM-5 (Must)** Commands as data (`{ side, kind, … }`), applied via `apply(state, command) → { ok } | { error }`; rejected commands leave state unchanged. Optional tick stamp for later tactical commands.
- **R-SIM-6 (Must)** Event output per step (spawned, fired, hit, killed, leaked, effect applied …) for rendering/announcements; events are *not* part of the persisted state.
- **R-SIM-7 (Must)** Cheap clone / fork for look-ahead (AI, balance bots) and a stable state hash.
- **R-SIM-8 (Must)** Guaranteed termination hooks (wave end condition, max-tick guard).

### Map, paths, movement

- **R-MAP-1 (Must)** Grid with cell kinds; map definitions as validated data.
- **R-MAP-2 (Must)** Directed path graph of polylines with splits (routing policies: weighted round robin, by unit kind) and merges; separate air lanes.
- **R-MAP-3 (Must)** Path-following movement as 1-D progress per unit; derived world position; speed modifiers.
- **R-MAP-4 (Hybrid)** Grid pathfinding (A*/flow field) for free-moving mobile units and for units leaving the lane graph (VS Large battle zone), deterministic tie-breaking.

### Combat

- **R-CMB-1 (Must)** Damage types (kinetic/explosive/energy), flat armour with per-type factor and minimum damage, shields with regeneration delay, integer HP.
- **R-CMB-2 (Must)** Weapon kinds: hitscan, projectile with travel time (homing or to predicted point), splash with radius, continuous beam with heat ramp, line beam (pierce), chain, periodic pulse, aura.
- **R-CMB-3 (Must)** Targeting: range (min/max), domain (ground/air), priority modes, deterministic tie-break.
- **R-CMB-4 (Must)** Status effects with explicit stacking rules (max / additive with cap / refresh), immunity windows, ability suppression; all durations in ticks.
- **R-CMB-5 (Must)** On-death behaviours (bounty, spawn children), healing auras, leak/threat value.
- **R-BEAM-1 (Must, shared with Laser Circuit)** Grid beam tracer: origin + direction, 45° mirrors, splitters, blockers, max length → list of traversed segments/cells. Pure, reusable by the Laser Circuit puzzle (M4); location decided by the orchestrator (engine or a small shared `optics` module).

### Towers, upgrades, economy

- **R-TWR-1 (Must)** Towers as entities placed on cells, with data-defined stats; footprint 1 cell.
- **R-TWR-2 (Must)** Upgrade trees as data: levels, exclusive branches, costs, stat deltas *and capability changes* (e.g. "loses air domain").
- **R-TWR-3 (Must)** Adjacency/aura buffs between own structures (Amplifier, Beacon).
- **R-TWR-4 (Must)** Player-placed passive structures (mirror pylons) that interact with beams.
- **R-ECO-1 (Must)** Per-side credits; costs, refunds (full refund within the same phase, fractional otherwise), bounties, periodic income; integer only.
- **R-WAV-1 (Must)** Wave scripts (spawn groups with timing, spawn point, routing) and a spawner; wave end detection; preview API (exact composition and routing without simulating).

### Multi-side (hybrid)

- **R-SIDE-1 (Hybrid)** ≥ 3 sides (player, opponent, external/neutral) with hostility matrix; per-side core integrity, credits, structures.
- **R-SIDE-2 (Hybrid)** Simultaneous lock: both sides' commands for a round are applied in a deterministic order independent of who locked first.
- **R-PRD-1 (Hybrid)** Production structures and queues that turn credits + capacity into wave units / mobile units per round; capacity as a resource.
- **R-UNIT-1 (Hybrid)** Mobile unit-vs-unit combat (same combat model), engagement rules for armies meeting (VS Large), survivors continuing on a route.
- **R-RES-1 (Hybrid, Should)** Small research/tech gates (e.g. unlocking branch L3 or unit tiers).
- **R-CMD-1 (Hybrid, Should)** Command-network coverage as a component Support towers can provide (relay), so hybrid and strategy share it.
- **R-AI-1 (Hybrid)** AI interface: `plan(state, side, budgetMs) → commands`, using only information visible to that side; deterministic for a given seed.

### Non-functional

- **R-NF-1 (Must)** No DOM; runs in Node (tests), browser main thread and a Worker.
- **R-NF-2 (Must)** Performance: 300 units + 50 towers at 20 ticks/s, a 60 s wave headless in < 50 ms on CI hardware.
- **R-NF-3 (Must)** Versioned data definitions and state; migration hook.
- **R-NF-4 (Must)** Rules and data separated: TD and hybrid supply *rulesets* (stats, trees, archetypes) as data; the engine contains no TD-specific numbers.

**Content location** ([D13](#14-open-decisions)): towers/enemies/upgrade trees must be shared by `tower-defense` and `strategy-td-hybrid`, but games may not import each other. Proposal: a data-only package (e.g. `packages/strategy-content` or `strategy-engine/rulesets/`) owned by the orchestrator, with this context as content author.

---

## 13. Strategy / TD hybrid (`strategy-td-hybrid`)

One game package with a mode selection (setup screen inside the game), same towers, enemies and rules as TD.

### 13.1 Common frame

- Two sides — **player** and **opponent (local AI)** — each with a base area (core + build cells) on a symmetric map; a third **external** side in the External modes.
- Rounds instead of waves: **PLAN (both sides, simultaneously, no clock) → LOCK → RESOLVE (deterministic)** — the same time model as TD and the strategy game.
- New per-side structures on build cells, competing with towers for space and credits:
  - **Extractor** — + income per round (economy vs. defence now);
  - **Workshop** — production capacity (how many/strong units per round);
  - Support towers may act as relays later (command network, R-CMD-1).
- Fixed round count (e.g. 10) with clear end: a core destroyed → loss for that side; otherwise after the last round the side with more core integrity wins (tie → draw). Typical session 15–30 min, resumable at every tick like TD.
- The opponent AI plays by the same rules and information: no hidden bonuses. Difficulty = planning depth (Easy: heuristic; Standard: greedy with 1-round simulation look-ahead; Hard: look-ahead over a candidate set incl. counter-composition against the visible enemy build).

### 13.2 Modes

**External Small** — towers only.
An external force spawns each round and splits at a junction toward both bases (authored split, e.g. 50 / 50, shown in the preview). Each side defends its branch with towers. *Indirect coupling* (recommended, [D14](#14-open-decisions)): the next external wave is reinforced by the total number of leaks of **both** sides → each side benefits when the other defends well (aligned incentive) while still competing on core integrity. Alternatives: spill-over of leakers to the other branch; adaptive split toward the weaker side.

**External Large** — towers + mobile defenders.
As External Small, plus each side sends a mobile defence force (size bounded by Workshop capacity) that meets the external force on the shared approach before the split. Both sides' defenders fight the common threat simultaneously but are not allies (they don't heal/buff each other). Surviving defenders return and are available next round; surviving external units continue to the split and the towers. Trade-off: towers (permanent, local) vs. mobile force (shared front, can be lost) vs. economy.

**VS Small** — mutual tower defence.
Each side plans an attack wave from its Workshops (composition chosen from the archetypes, cost and capacity limited) and defends with towers. The waves use separate lanes and never meet; both resolve in the same round (or sequentially, [D16](#14-open-decisions)). The preview shows the opponent's *towers* (visible) but not its next wave until the lock (simultaneous planning). Contest: economy vs. wave production vs. tower defence.

**VS Large** — armies meet first.
Both sides' waves travel toward each other on a shared central lane and fight; **only the surviving side's units continue** to the opposing towers. Investment triangle: production capacity vs. unit quality/composition vs. static defence, plus economy and (later) research/command network.

### 13.3 Hybrid AI

- Pure `ai.ts` (or engine AI module, R-AI-1), deterministic per seed, time-bounded (≤ 100 ms per plan on mid-range phones; runs in a Worker if needed).
- Candidate generation from templates (eco-heavy, defence-heavy, rush, counter-the-visible-towers), evaluated by forking the simulation one round ahead; Hard evaluates more candidates and two rounds.
- Tests: AI never issues illegal commands (property), is deterministic, Hard beats Easy in ≥ X % of seeded matches, no single template dominates (balance harness as in § 11.3).

### 13.4 Sequencing

TD first (uses the single-side subset of the engine). Then VS Small (simplest two-side mode, no unit-vs-unit combat), External Small, External Large, VS Large (needs R-UNIT-1, R-MAP-4).

---

## 14. Open decisions

Recommendation first. These need the owner's decision before implementation.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Time model | (a) phase-based plan → lock → resolve, no input during waves · (b) pausable real time, build any time · (c) (a) + limited tactical commands while paused | **(a)**, keep (c) possible later |
| D2 | Placement | free fine grid · coarse grid 9 × 15 · fixed build pads | **coarse grid 9 × 15**, view rotates on landscape |
| D3 | Paths | fixed path graph · mazing (towers block) | **fixed path graph** with splits |
| D4 | Wave information | full preview · kinds only · none | **full preview** (incl. routing) |
| D5 | After defeat | full restart only · retry from start of failed wave | **retry from wave checkpoint**, shown factually |
| D6 | Economy | flat income + bounty · + interest | **no interest**; full-refund undo in build phase, 70 % later |
| D7 | Content v1 | training + 3 maps · 1 map only · 6+ maps | **training + 3 maps**, 3 difficulties |
| D8 | Seed role | authored wave variants · procedural waves · procedural maps | **authored variants per wave slot** |
| D9 | Setting & style | abstract geometric constructs · sci-fi military · fantasy | **abstract geometric** (no assets, non-violent, IP-safe) |
| D10 | Display names | e.g. TD: "Holdline", "Waypoint", "Bastion Grid"; hybrid: "Crossfire", "Two Fronts" | owner's choice; ids stay `tower-defense`, `strategy-td-hybrid` |
| D11 | Prism mechanic | mirror pylons on sockets (Laser Circuit reuse) · simple chain lightning | **mirror pylons** |
| D12 | Power grid | none in TD v1 · Support provides power to Lasers | **none in v1**; relay/power only in hybrid/strategy if wanted |
| D13 | Shared ruleset data location | engine package `rulesets/` · separate data package · duplicated per game (forbidden-ish) | **separate data package, orchestrator-owned**, this context authors content |
| D14 | External Small coupling | shared threat escalation · spill-over · adaptive split | **shared threat escalation** |
| D15 | Opponents in hybrid | AI only · + local hot-seat (hidden planning via hand-over screen) | **AI only in v1** |
| D16 | VS Small resolution | both waves simultaneously · sequentially (yours, then theirs) | **simultaneously** (one resolve per round, shorter sessions) |
| D17 | Work while the engine API is not ready | (a) content data, pure formulas, balance model, engine-interface tests only · (b) TD sim prototype inside the game package, later upstreamed · (c) this context contributes TD modules to the engine via the engine context | **(a)**; switch to (c) by agreement if the engine is blocked — never (b) |

### Points to double-check (risks and assumptions)

- **Roadmap order**: M7 depends on stable M0–M2; M2 (puzzle core) has not started. Design now is fine; implementation competing with M2 for orchestrator capacity is a scheduling risk.
- **Ownership conflict**: `CLAUDE.md`/ADR 0006 say the orchestrator owns future shared engines; the task assigns `strategy-engine` to the strategy-engine context. Needs one explicit statement (ADR amendment) to avoid two owners.
- **Laser Circuit before or after Prism**: Laser Circuit is M4. If TD comes first, the beam tracer is designed here and Laser Circuit consumes it — the shared location (R-BEAM-1) must be decided early.
- **Watching vs. playing**: phase-based waves risk feeling passive. Mitigated by short waves, instant resolve and dense build decisions; to be checked in a playtest of the training map before producing more maps.
- **Balance is the main effort**, not code: the harness (§ 11.3) is the instrument that keeps "five distinct towers" true as numbers change.
- **Hybrid symmetry**: symmetric maps are fair but make AI mirroring strong; asymmetric maps need per-side balance tests.
