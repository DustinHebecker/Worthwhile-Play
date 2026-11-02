# Design: Tower Defense and Strategy/TD hybrid modes

Status: **In implementation** (owner 2026-10-31: "start TD and the hybrid on top of the strategy game"). The recommendations of [§ 14](#14-open-decisions) are the working defaults until the owner changes one. [§ 15](#15-revision-2026-10-31-building-on-the-shipped-engine) maps this design onto the engine as shipped (ADR 0009) and **supersedes** the parts of §§ 3–5 and 12 it names.
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
| Siege crawler (final) | armour + shield + high HP | combined arms | any monoculture |

### 4.3 Damage model (provisional, tuned by simulation)

- Integer hit points. Damage types: `kinetic`, `explosive`, `energy`.
- **Armour** (flat, per hit): `dealt = max(raw − armour × k, ⌈raw × 20 %⌉)` with `k = 1` for kinetic, `0.5` for explosive, `0` for energy. Many small hits suffer, few large hits do not → Gatling vs Cannon is a real choice.
- **Shield**: absorbs all damage first; energy deals ×1.5 to shields; regenerates after `n` ticks without being hit; EMP removes it and blocks regeneration for a duration.
- **Status effects**: slow (strongest applies, no additive stacking), stun (with immunity window afterwards — prevents permanent lock and guarantees termination), armour shred (stacks up to a cap), shield-block, mark (bonus damage taken). All durations in ticks.
- **Leaks**: an enemy reaching the core removes its `threat` value from core integrity (Walker 1, Brute 3, Siege crawler 10 …) and is removed.

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
Design intent, **not yet a CI check** (§ 15.7 has what the harness asserts today): every branch is the best credit-efficiency choice against at least one archetype and among the worst against at least one. A per-branch credit-efficiency matrix test is planned.

---

## 6. Economy

- Start credits per map/difficulty; fixed **wave income** at the start of each build phase; small **kill bounty** per enemy.
- **Interest** (owner, 2026-10-31, [D6](#14-open-decisions)): credits left unspent when a wave starts earn **10 %** at its end (not after the last wave), on top of the flat wave income and bounties. Kept low so that saving is a modest reward and hoarding does not become the strategy; the balance harness checks that a hoarding bot does not beat a spending one.
- Spending decisions are fully reversible within a build phase (full-refund undo). After a wave, selling refunds 70 %.
- Credits are always integers; property: credits never negative, every credit change is attributable to a logged command or event.

---

## 7. Session length, pausability and resumability

- Typical session: one map of 12 waves ≈ **12–25 min** (`typicalMinutes: [10, 25]`); training map ≈ 5 min.
- `pauseable: true`. Closing at any moment is safe:
  - build phase: state = map, towers, credits, wave index, RNG state;
  - wave phase: additionally tick, enemies, projectiles, active effects, spawn cursor. The **exact tick** is serialized; nothing is rolled back.
- `requestSave()` after every build command, at wave start (lock), every 40 ticks (5 simulated seconds at 8 ticks per second) during a wave, at wave end. The host additionally serializes on `visibilitychange`/`pagehide`. Correctness never depends on these saves being frequent — any snapshot is exact.
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

- Difficulties: **Relaxed** (more credits, core 30), **Standard** (core 20), **Hard** (credits ×0.9, units ×1.2, core 12; § 15.7). No dynamic difficulty adjustment (it hides information and undermines planning).
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
| D6 | Economy | flat income + bounty · + interest | **Decided (owner 2026-10-31):** flat income + bounty + **10 % interest** on credits unspent at wave start; full-refund undo in build phase, 70 % later |
| D7 | Content v1 | training + 3 maps · 1 map only · 6+ maps | **training + 3 maps**, 3 difficulties |
| D8 | Seed role | authored wave variants · procedural waves · procedural maps | **authored variants per wave slot** |
| D9 | Setting & style | abstract geometric constructs · sci-fi military · fantasy | **Decided (owner 2026-10-31):** modelled on the strategy game Relay Command (its map look, unit/structure icon style and palette roles), without copying its code (games never import games) |
| D10 | Display names | e.g. TD: "Holdline", "Waypoint", "Bastion Grid"; hybrid: "Crossfire", "Two Fronts" | **Decided (owner 2026-10-31):** "Tower Defense"; "Hold the Line" for the hybrid. Ids stay `tower-defense`, `strategy-td-hybrid` |
| D11 | Prism mechanic | mirror pylons on sockets (Laser Circuit reuse) · simple chain lightning | **mirror pylons** |
| D12 | Power grid | none in TD v1 · Support provides power to Lasers | **none in v1**; relay/power only in hybrid/strategy if wanted |
| D13 | Shared ruleset data location | engine package `rulesets/` · separate data package · duplicated per game (forbidden-ish) | **separate data package, orchestrator-owned**, this context authors content |
| D14 | External Small coupling | shared threat escalation · spill-over · adaptive split | **shared threat escalation** |
| D15 | Opponents in hybrid | AI only · + local hot-seat (hidden planning via hand-over screen) | **Decided (owner 2026-10-31):** AI only in v1; **hot-seat goes to the backlog** |
| D16 | VS Small resolution | both waves simultaneously · sequentially (yours, then theirs) | **simultaneously** (one resolve per round, shorter sessions) |
| D17 | Work while the engine API is not ready | (a) content data, pure formulas, balance model, engine-interface tests only · (b) TD sim prototype inside the game package, later upstreamed · (c) this context contributes TD modules to the engine via the engine context | **(a)**; switch to (c) by agreement if the engine is blocked — never (b) |

### Points to double-check (risks and assumptions)

- **Roadmap order**: M7 depends on stable M0–M2; M2 (puzzle core) has not started. Design now is fine; implementation competing with M2 for orchestrator capacity is a scheduling risk.
- **Ownership conflict**: `CLAUDE.md`/ADR 0006 say the orchestrator owns future shared engines; the task assigns `strategy-engine` to the strategy-engine context. Needs one explicit statement (ADR amendment) to avoid two owners.
- **Laser Circuit before or after Prism**: Laser Circuit is M4. If TD comes first, the beam tracer is designed here and Laser Circuit consumes it — the shared location (R-BEAM-1) must be decided early.
- **Watching vs. playing**: phase-based waves risk feeling passive. Mitigated by short waves, instant resolve and dense build decisions; to be checked in a playtest of the training map before producing more maps.
- **Balance is the main effort**, not code: the harness (§ 11.3) is the instrument that keeps "five distinct towers" true as numbers change.
- **Hybrid symmetry**: symmetric maps are fair but make AI mirroring strong; asymmetric maps need per-side balance tests.

---

## 15. Revision 2026-10-31: building on the shipped engine

The strategy engine (`@wp/strategy-engine`, ADR 0009) shipped with Relay Command. It differs from what §§ 3–5 and 12 assumed. TD and the hybrids use it as it is and ask only for small, generic extensions (§ 15.5).

### 15.1 Working defaults

The owner asked to start without answering D1–D17 one by one. The recommendations of § 14 are therefore the working defaults. **D2 and D3 change form** because of the engine (§ 15.2), and **D12 and D13 are settled by ADR 0009**: there is no power grid in TD, and the shared base towers live in `strategy-engine/src/content`, while TD ships its own ruleset with its numbers and branches.

Catalogue position (owner, 2026-10-31): **Tower Defense at place 4, the hybrid at place 7** of the overall list (`apps/web/src/registry.ts`). The owner did not say which game goes to which place; TD comes first because the hybrid builds on it.

### 15.2 Map and movement on the engine grid (replaces § 3.1)

- The engine moves units cell by cell (8 neighbours, integer movement points, A* with deterministic tie-breaks). There is no polyline progress; smooth motion is interpolated in the view from `move` events (`fx, fy → x, y`).
- **Fixed paths without engine changes:** the TD ruleset has its own terrain table. `=` *road* has cost 2. `b` *build pad* is passable (so a tower can stand there) but costs 200 per step, so a unit never leaves the road while the road is open (the engine's detour limit is far below it). Scenery is impassable (`^`, `~`). Towers may only be placed on pads, so the road is never blocked → no mazing, and no full-block check is needed.
- **Splits:** a wave group carries a route (list of waypoints). The TD layer gives each unit `move` to its next waypoint and the following one on its `order-ended: arrived` event. Routing by weighted round robin stays deterministic and shows in the preview.
- **Air:** air units ignore terrain cost (`AIR_COST`) and fly straight to their waypoints; air routes are authored as their own waypoint lists.
- **Leak:** a unit reaching the core's goal cell is removed by the TD layer, and core integrity drops by its threat value. The core itself is not an engine entity in TD (no HP fight).

### 15.3 Waves on the engine (replaces § 12 R-WAV-1 for now)

A wave runs as `runTicks(world, ruleset, commands, 1)` per tick. Between ticks the TD layer spawns due units on free spawn cells (`spawn()` with `world.nextId`) and removes leaked units. If the spawn cell is taken, the unit waits and is shown as queued.

**Measured** (Node, vitest, 2026-10-31): a 15 × 40 corridor with 18 towers and 200 heavy units (60 alive at once) over 2 000 ticks took 0.15 ms per tick, 0.3 s for the whole wave. "Resolve instantly" is therefore synchronous, and 1×/2×/4× playback costs nothing. The structured clone per `runTicks` call is included in that figure.

### 15.4 Tower and enemy roster on engine primitives (replaces §§ 4.3 and 5 where they differ)

The engine damage model is a **percentage per armour class** (`vs`: infantry, light, heavy, structure, air) with a minimum of 1, not flat armour. The trade-offs of § 5 are expressed through that table. For example, Gatling deals 25 % against heavy, Cannon 130 % against heavy but 0 against air.

| Family | L1 (engine features) | Branch A | Branch B | Engine support |
|---|---|---|---|---|
| Gun | `direct` | Gatling: cooldown 1, small damage, weak vs heavy | Cannon: big hits, strong vs heavy, **no air** | ✓ |
| Artillery | `ballistic`, flight, splash, `minRange` | Howitzer: long range, bigger dead zone | Mortar: splash 2 + `slowed` | ✓ |
| Laser | `beam` with ramp | Focus: higher ramp and more stacks | Prism: line beam piercing every enemy on it (+ mirrors later) | Focus ✓ · Prism needs **E1** |
| Support | `ballistic` slow pulse, 1 damage, splash (Stasis base) | Stasis field: bigger, longer slow | Amplifier: neighbours fire faster / Repair: heals towers | A ✓ · B needs **E2** |
| Specialist | EMP: `disabled` pulse | Interceptor: high damage, **air only** | Blackout: wider, longer EMP, no damage | ✓ |

An upgrade replaces the tower entity's `kind` with the branch archetype in the TD ruleset. The entity keeps its id and cell, and its health is scaled to the new maximum. Targeting priority uses the engine doctrine (`weakest`, `nearest`, `armor`).

Enemies are engine archetypes in the TD ruleset:
- unarmed ground units: Walker (infantry), Runner (light, fast), Swarm (infantry, tiny), Brute (heavy, slow);
- Glider (air);
- **Raider**, armed: it fires at towers in passing, so tower health and repair matter;
- Siege crawler (heavy, armed, final wave).

**Built on E1–E3 (2026-11-01, § 15.9):** Shield bearer (shields), Mender (repairs units around it), and the branch-C towers Prism, Amplifier and Corroder. Armour shred is not built (no engine support; the mark alone carries the Corroder).

### 15.5 Requests to the strategy engine (replaces the long list of § 12)

Everything else in § 12 already exists (determinism, plain JSON, integer math, events, `worldHash`, `isValidWorld`, splash, beam ramp, `minRange`, status effects, armour table, layers, sides and teams, economy, production, AI observation). Still missing, smallest first:

| Id | Request | Needed for | Interim |
|---|---|---|---|
| E0 | `spawnUnits(world, ruleset, specs)` and `removeEntities(world, ids)`, pure and validated (or `ModeDefinition.spawns`) | waves, leaks | **done** (2026-11-01): `strategy-engine/src/spawn.ts`, ADR 0009 amendment "Tower Defense extensions" |
| E1 | Beam option `pierce`: a beam hits every hostile unit on the grid line from the tower through its target up to its range (later: 45° mirror entities) | Prism | **done** (2026-11-01): `WeaponSpec.pierce`, `sim.ts` fire system, `lineCells` in `effects.ts`; mirrors not yet |
| E2 | Archetype `aura`: friendly structures within radius get −x % cooldown, or heal y HP per n ticks | Amplifier / Repair | **done** (2026-11-01): `Archetype.aura { radius, cooldownPct?, heal? }`, status system in `sim.ts`, `auraEffects`/`coolDown` in `effects.ts` |
| E3 | Status kinds `marked` (+x % damage taken) and `shielded` (absorbs first n damage, regenerates) | Corroder, Warden enemy | **done** (2026-11-01): status `marked` with `amount`, `Archetype.shield { hp, regenDelay }` + `Entity.shield`, damage system in `sim.ts`, `absorb` in `effects.ts` |
| E4 | `runTicks` hook for per-tick spawns (avoids one clone per tick) | performance on large hybrid maps | measured fine without it |

The owner relays these to the strategy context (engine owner, ADR 0009). If preferred, this context implements E0–E3 as an engine PR reviewed by the strategy context. Owner decision 2026-11-01: this context built E0–E3 (opt-in archetype data only; Relay Command unchanged), described in the ADR 0009 amendment "Tower Defense extensions".

### 15.6 Map size and title (2026-10-31)

- Maps are **7 cells wide** (training ground 7 × 13): 7 × 44 px fits a 360 px phone with its page margins, so every cell keeps the 44 px touch target without zoom or rotation. Wider maps would need a zoomed view; the 12-wave maps keep 7 columns and grow in height.
- Title (owner, 2026-10-31): **"Tower Defense"** (genre name; transliterated or translated in non-Latin scripts). **"Hold the Line"** is the candidate name for the hybrid game.
- Translations of all 16 locales are AI-assisted; the subagents' notes on wording to check (gendered announcements, target phrases, invented unit names) are kept for a native-speaker review.

### 15.7 Maps, pace and the first balance pass (2026-10-31)

- **Maps:** Training ground (7 × 13, 6 waves; 8 since § 15.10), Fork (two lanes around a rocky middle), Long bend (one long serpentine, 30 % more units), Twin approach (two entries, two air routes, 50 more start credits). Every 12-wave map (20 waves since § 15.10) uses the same wave plan; its second variant per wave sends each group to the other lane, so the seed changes where the pressure comes from, never how much. The map is chosen on the start screen (ADR 0017 setting `map`).
- **Pace:** road cost 16, so a Walker moves one cell per second at 1× (8 ticks per second) and slowed units half that. The first numbers (3 cells per second) gave towers too little time.
- **Economy:** start 300 credits (Twin 350), wave income 65–120, bounties, **10 % interest** on credits unspent at wave start (D6).
- **Balance harness** (`test/balance.long.test.ts`, CI long job, about 2½ minutes). A planner bot looks one wave ahead: before each wave it tries every family on the best pads and every upgrade, and keeps the action that saves the most threat per credit. It grades leaks by threat × health kept, so wearing a Siege crawler down counts. Asserted:
  - the mixed planner wins every map on Relaxed and Standard with at least half the core left;
  - random building loses every 12-wave map on Standard;
  - every single-family defence ends Standard at least 8 core points worse than the mix, or loses.
- **Measured** (seed 7):

  | Bot | Result |
  |---|---|
  | Mixed planner, Standard | wins Fork, Long bend and Twin with 20/20 core |
  | Gun only | wins with 10/20 |
  | Laser only | wins with 3–9, or loses Twin |
  | Artillery, Support or Specialist only | loses by wave 2–7 |
  | Mixed planner, Hard | loses Fork and Twin approach in wave 12, wins Long bend with 1 core left |

  The planner is greedy, so Hard is meant for players who plan ahead of the next wave. Owner (2026-11-01): Hard need not be winnable by this bot; the harness asserts that it reaches at least wave 10 on every 12-wave map.
- **Stop budget:** a unit can be stopped (EMP) for at most 48 ticks (6 s at 1×) per wave; afterwards it shakes off further stops. Stop-only builds could otherwise stall a wave up to the safety bound (review of PR #97).
- **Seed on one-lane maps:** Long bend's second variant per wave reverses the order in which the groups start, so the seed matters there too.
- **Known limit:** 7 cells of 44 px need a viewport of about 340 px (page margins included); below that (e.g. 320 px phones) cells shrink to about 41 px.
- **Changed during tuning:**
  - Laser beams fire every second tick and ramp up to 3 stacks. Before, a Laser was worth about three Guns per credit.
  - Gatling and Cannon damage is lower, and the base Gun deals 50 % against air.
  - Hard: core 12, credits ×0.9, units ×1.2.

### 15.8 Increments

1. **TD core:** ruleset, the training map (6 waves), the build/wave phase machine on the engine, upgrades and branches, economy, leaks, victory and defeat, the checkpoint retry; unit and property tests (determinism, chunking invariance, save/restore at any tick, conservation, termination).
2. **TD view:** canvas map, HUD, keyboard/touch, 16 locales, contract and e2e tests; three 12-wave maps; balance harness; catalogue place 4.
3. **Engine extensions** E0–E3 (built here, reviewed by the strategy context), then Prism, Amplifier/Repair, Corroder, Shield bearer, Mender (§ 15.9).
4. **Hybrid** `strategy-td-hybrid`: VS Small → External Small → External Large → VS Large on the engine economy (`produce`, yards, Supply), catalogue place 7.

### 15.9 Branch C towers and the new units (2026-11-01)

**Third branch instead of replacing branch B.** The design's B branches (Prism, Amplifier, Corroder) arrived after Pulse, Snare and Blackout had shipped as interim B branches. Replacing them would invalidate saves that hold those towers and remove choices players know, so each of the three families gains a **branch C**; Gun and Artillery keep two branches. The branch choice stays exclusive and final. In the view, level pips are filled dots (A), hollow dots (B) and squares (C).

| Family | Branch C (level 2, level 3) | Engine | Price |
|---|---|---|---|
| Laser | **Prism**: beam without heat-up that runs on through its target and hits every unit on the line up to its range (`pierce`); 2/3 damage, range 4/5, weak vs heavy (60 %) | E1 | 175 / 250 |
| Support | **Amplifier**: no weapon; own towers within radius 2 reload 25 %/50 % faster; level 3 also repairs 2 health per second | E2 | 150 / 220 |
| Specialist | **Corroder**: small hits that mark a unit for 3/4 s; marked units take +25 %/+40 % damage from every tower | E3 | 150 / 220 |

New units (12-wave maps; the Training ground is unchanged):
- **Shield bearer** (light, 60 health, shield 80 that returns after 3 s without a hit; beams hit the shield ×1.5; an EMP strips it): threat 2, bounty 10; waves 7, 10 and 12. Drawn with a hexagon while the shield lasts.
- **Mender** (infantry, 50 health, repairs units within radius 2 by 3 health per second, never itself): threat 1, bounty 8; waves 9 and 11. **Not in wave 12:** beside the Siege crawler it decided the game on its own (the mixed planner lost 10 core on Fork).
- Shield bearers in wave 12 start after the crawler has passed for the same reason (on Long bend the planner lost the crawler fight with them alongside).
- A marked unit shows a diamond.

Saves stay valid: no kind was removed; a running wave is only bounded by its schedule length, which grew. **But a 12-wave game in progress plays the new waves from wave 7 on**: the waves are read from the map when a wave starts, so this also holds for a checkpoint retry and for replaying a log recorded before the change (the retried or replayed wave brings the new units). Only a wave already running in the save keeps its old schedule.

Review follow-ups (orchestrator, PR #102):
- **Amplifier in Hold the Line:** its aura reaches every own entity nearby (engine E2: same side), so there it also speeds up and (level 3) repairs **your own attack units** passing it. **Kept, text fixed** rather than restricting the aura to structures: a restriction would need a new engine field (ADR 0009) for one game, and helping your outgoing wave near your own lane is a readable, deliberate tactic in a duel. Hold the Line overrides the shared text ("your towers and your own units close by"); in Tower Defense the player has no units, so "towers close by" stays exact.
- **Pips** are 0.15 of a cell (6.6 px at 44 px) on a halo in the surface colour, so they stand out from the picture.
- **Silhouettes:** the Mender uses the mast-truck picture, the Shield bearer the tracer (they no longer look alike once the shield is gone).
- **Golden replay through wave 12** (`golden.test.ts`): a fixed build order on Fork (relaxed) that buys every branch C and wins wave 12, so edits to waves 7–12 or to the branch-C towers change a hash.
- **Names:** no further names close to commercial strategy games; "Prism" stays (the spec names it, the mechanic differs).

**Balance (seed 7, standard; core left of 20):** mixed planner Fork 20, Long bend 20, Twin 20 (relaxed 30/20/30); Hard: Fork and Long bend won with 1 left, Twin lost in wave 12; random building loses all three; single families: Gun 8–10, Laser ≤ 9, the rest lose. **The look-ahead planner never picks a branch-C tower**: their value (lines of units, clusters, focus fire) builds up over more than one wave, which its one-wave look-ahead cannot see. Unit tests prove each one does what its text says (`td-core/test/ruleset.test.ts`); whether they are worth their price is a playtest question. The hybrid's computer opponent sees them as upgrade candidates but, for the same reason, has not chosen them in its measured games.

### 15.10 Owner playtest of Tower Defense (2026-11-01)

The owner played TD and reported four things; all are addressed:

1. **Clicks on the second map hit other cells** (lower part). Cause: "New game" reuses the game instance, and the canvas buffer was resized only when the width changed. All maps are 7 wide, so Fork after Training kept a 13-row buffer stretched over 15 rows. Fixed in TD and Hold the Line (PR #105), e2e reproduces it.
2. **Movement looked turn-based; units should look better.** The engine still moves whole cells. The view now glides every step over the time the unit takes for a cell (`td-core/src/motion.ts`; the picture trails the simulation by up to a cell, nothing in the rules depends on it), with a small hop per step, facing the walking direction and a spark when hit; beams run between where shooter and target are drawn. Every unit kind has its own picture (`td-core/src/units.ts`): biped Walker, long-legged Runner, beetle-like Swarm unit, armoured Brute, delta-wing Glider, armed buggy Raider, tracked Siege crawler, Shield bearer behind its plate, hovering Mender with a cross; legs, wheels and treads move with the step. Reduced motion keeps units on their cells.
3. **Too few waves, climbing too fast.** Full maps now have **20 waves**, the Training ground **8**. New kinds come one at a time and few at first (Runners 3, Swarms 5, a Brute 7, Gliders 8, Raiders 11, Shield bearers 12, Menders 14, the Siege crawler 20); waves 1–10 stay gentle, and from wave 11 every wave brings 15 % more units than authored (`LATE_PERCENT`; wave 20: 2.5 ×). Income climbs steadily (70 + 5 per wave). Long bend keeps 130 % of the units but has less money (250 start, 30 less per wave): with more units its long road only paid out more bounty.
   - **Balance (seed 7):** the mixed planner wins every map on Relaxed and Standard with the full core; on Hard it wins Twin (12 left) and reaches wave 20 on Fork and Long bend; random building loses all three full maps; a single family ends ≥ 8 core behind the mix on at least two of three full maps (Gun 10/7/10 left, Laser 10/18/9: on Long bend's straights lasers come close), the others lose. The balance suite asserts exactly these (Hard: reaches wave 15 or wins).
   - **Saves:** state version 2. Version-1 saves are migrated (`migrateState`): wave choices kept where the new slot has them, a running wave restarts from its lock (its units came from the old plan); the game goes on with the new waves.
   - The golden replays are updated deliberately; the full replay now buys every branch C and wins all 20 waves on Fork (relaxed) with 18 core.
4. **The card picture was too poor.** The card now shows a picture drawn by the game itself (like Relay Command's): an arranged 6 × 4 scene of the real map and unit renderer, light and dark, 288 × 192 WebP (`apps/web/public/previews/tower-defense-*.webp`).

---

## 16. Hold the Line (strategy/TD hybrid), mode VS Small — as built (2026-11-01)

Owner, 2026-11-01: start the hybrid with VS Small. It is a game of its own, `packages/games/hold-the-line` (id `hold-the-line`, title "Hold the Line", catalogue place 7). It is built on the shared TD core `@wp/td-core`, which holds the ruleset, wave lanes, tower commands, map drawing and the shared tower and unit texts. Tower Defense uses the same core, and its golden replays are unchanged.

### 16.1 Rules

- **Two sides, one point-symmetric map** (`duel`, 7 × 17). You are side 0 at the bottom; the computer is side 1 at the top. Each side builds only on pads of its own half. Each side's attack wave uses its own road along the map edge to the other core; the waves never meet, and towers fire only at the other side's units.
- **Rounds:** PLAN (no clock) → LOCK → BATTLE (both waves at the same time, deterministic, pausable, 1×/2×/4× or at once). 10 rounds. A core that falls ends the game after that battle; otherwise the higher core after round 10 wins, and equal cores are a draw.
- **Planning:**
  - towers with the full TD branch tree (full refund within the same planning phase, 70 % later);
  - **Extractors** (120 credits, +25 income per round, can be shot by armed units);
  - **the attack wave**: units from a shop (Walker 20, Runner 25, Swarm unit 6, Brute 90, Glider 45, Raider 60; the Siege crawler is not for sale), up to the capacity of 8 units;
  - **Workshops** (120 credits, +4 capacity, at most 3).
- **Economy:** 300 credits at the start, 100 per round plus extractors, the defender's bounty for every unit destroyed, and **10 % interest** on what was unspent at the lock (as in TD). Core integrity starts at 30; a unit that gets through costs its threat.
- **Fairness and information:** the state keeps a snapshot of both sides as the round started (`roundStart`). The computer plans at the lock, but only from that snapshot: both sides' structures and the waves both sides sent last round. It never sees the player's plan of the round; its new structures appear at the lock. It uses the same rules and prices. (Planning at the lock rather than at round start keeps starting a game instant.)

### 16.2 Engine use

- One engine world holds both sides. The lanes are TD lanes with a side per unit. Leaks and bounties go to the right side.
- A round's battle runs `tickLanes` until no unit, spawn or shell is left, with the TD safety bound and stop budget.
- Saves hold the exact tick. Validation checks:
  - every structure stands on its owner's pads, with one record per structure;
  - what is still to come is the exact tail of each side's bought wave, and what runs is of the bought kinds;
  - while planning, the computer stands exactly as the round began;
  - results match the cores;
  - the plan log is bounded.
- The computer's plan names its new structures by the ids they get on the round-start snapshot; at the lock those ids are translated to the real ones (review of PR #100).

### 16.3 Computer opponent (`ai.ts`)

Deterministic, same rules, never cheating. It plans at the lock. Planning time is bounded by a fixed number of wave simulations per round (Normal 30, Hard 55). Measured in Node with 3000 credits, the worst case: about 0.3 s (Normal) and 0.7 s (Hard). On slow phones it can be several times that, so the view first shows "thinking" and plans afterwards (no silent freeze). A Web Worker would move it off the main thread if needed.

| Level | Defence | Attack |
|---|---|---|
| Easy | one Gun beside the incoming lane | plain Walkers and Runners |
| Normal | an Extractor early, on its own pad least exposed to the incoming lane (fewest lane cells within 3); towers chosen greedily, each tried against the wave it expects (the other side's last wave) | the two unit kinds whose threat per credit is highest against the visible towers, mixed |
| Hard | as Normal, with more placements tried | tries every single-kind and two-kind wave against the visible towers and sends the one that gets the most threat through; keeps the base wave size (workshops did not pay off in measurement) |

Long suite `ai.long.test.ts`:
- mirror matches are draws, on every level (both seats are equal);
- Hard beats Normal and both beat Easy, from either seat;
- a player who never plans loses to every level.

### 16.4 Next

- **Modes:** External Small (built, § 17) → External Large → VS Large (mobile units fighting each other; that needs engine unit combat between lanes).
- **Hot-seat** play is in the backlog (owner D15).
- **Balance:** the human-facing balance of VS Small still needs a playtest. The bots only show that the levels are ordered and the seats fair.

---

## 17. Hold the Line, mode External Small ("Outside force") — as built (2026-11-01)

Owner, 2026-11-01: "carry on with the next steps". The mode is chosen on the start screen (ADR 0017 setting `mode`: "Duel" = VS Small, "Outside force" = External Small); the map belongs to the mode, so a save's `mapId` decides its mode.

### 17.1 Rules

- **Map `crossing`** (7 × 17, point-symmetric). An outside force enters in the middle row and splits evenly: one half winds down to your core at the bottom, the mirrored half up to the opponent's core. The halves have their own entry cells (2, 8) and (4, 8), so they never wait for each other.
- **Nobody buys units or workshops** (refusal `mode`). Each round both sides face the same force: the round's row of `EXTERNAL_WAVES` (Walkers first, then Runners, Swarms, Brutes, Gliders, Raiders, Shield bearers, Menders, as in Tower Defense; up to 38 units per half in round 10), shown before the lock ("This round, each side faces: …").
- **Shared pressure (D14 "shared threat escalation"):** every unit that got through last round, on either side, comes back as one extra Walker in this round's force (at most 12). Each side therefore gains when the other side defends well, while the two still compete on core integrity. The state keeps it as `pressure`.
- **Economy:** as VS Small (300 start, 100 per round, extractors, 10 % interest), but destroyed units pay **half** their bounty: with full bounties the defence outgrew every later wave (both computer levels ended rounds 5–10 with over 1000 unspent credits and nothing getting through).
- **Engine mapping:** the half that attacks side *k* is owned by side *1 − k* (lane *i* carries side *i*'s units), so VS Small's battle, leak, bounty and validation code is reused unchanged; only the drawing shows all units alike, in ink (`Frame.neutralUnits`), so they read as one outside force.
- **Validation:** `pressure` is required in External Small and forbidden in VS Small; the mode must match the map; while planning no side has a wave; during a battle both waves equal this round's force exactly.

### 17.2 Computer opponent

It only defends (and builds an Extractor early): the wave it expects is the known force of this round, and all but its kept share of credits may go to defence. Hard has no attack to probe, so it spends 1.5 × its simulation budget on defence instead.

Measured (Node, seed 1; long suite `ai.long.test.ts`):
- mirror matches are draws on every level;
- Hard beats Normal and both beat Easy, from either seat;
- in self-play Hard lasts longer or keeps more core than Normal, and Normal more than Easy (Hard 19 core after 10 rounds; Normal falls in round 9, Easy in round 7);
- a player who never builds loses to every level.

A Hard planner that also looked one round ahead (the next force is known) did worse: it bought for the next force at the cost of the current one.

**Planning time.** The planner's simulations now skip the per-tick copy in `tickLanes` (`owned`) and stop a candidate as soon as it can no longer be chosen (the bound is exact, so decisions are unchanged). Measured worst per round in a game: Normal 0.9 s, Hard 0.5 s. With 3000 credits in round 10 (not reached in measured games): Normal 1.7 s, Hard 5 s. The view shows "thinking" first. A Web Worker, or the engine hook E4 (one copy per wave instead of two per tick), are the next steps if this matters on phones.

### 17.3 Next

External Large (mobile defenders meet the outside force before the split) needs unit-versus-unit combat on a shared approach; VS Large needs the same between the two sides' waves.

---

## 18. Hold the Line, revision after the owner's playtest (2026-11-01) — decided, not yet built

Owner playtest of VS Small and the owner's answers (2026-11-01):

1. **Duel: automatic waves from production and research (decided).** You build **production buildings** on your own pads (e.g. Barracks → Walkers, Garage → Runners/Brutes, Hangar → Gliders); each sends its units automatically every round. A **research** building unlocks stronger tiers (e.g. Walker → Shield bearer, Brute → Siege crawler) and upgrades (+health, +speed). Buying the wave per round (the VS Small shop as built, § 16) stays only as a **game option**.
2. **Endless is the default (decided).** The game ends when a core falls; you win by bringing the opponent's core down, not on points. Attackers get automatically stronger every round, so every game ends. "10 rounds on points" stays as the short-game option.
3. **Outside force (§ 17) is the intended mode (confirmed)**, extended:
   - **Endless** here too (the force keeps growing until a core falls).
   - **Solo**: alone against the outside force, like Tower Defense, without an opponent.
   - **Produced units help**: your production buildings send defenders that move out on the road and fight the outside force every round. This needs unit-versus-unit combat on the road (the "External Large" step of § 13.2).

Order of work: Tower Defense polish from the same playtest first (smooth movement and better unit pictures, which Hold the Line shares; more waves with a gentler ramp; the card picture), then Duel with production and research and Endless, then Outside force with Solo, Endless and defenders.

### 18.1 Step A as built: Endless, the short game, playing alone

- **Start screen:** *Mode* — Duel, Outside force, Outside force alone; *Length* — Endless (default), Ten rounds. Saves from before the choice have no `length` and stay ten-round games.
- **Endless:** a game ends only when a core falls (both in the same battle: a draw); `MAX_ROUNDS` (999) is only a safety bound for saves. Escalation makes every game end:
  - **Duel:** *conscripts* — each side sends, on top of what it bought, a Walker every second round and from round 12 one more per round, every fourth a Brute (at most 40). Measured (long suite): Hard–Hard and Hard–Normal end with a fallen core well before round 60.
  - **Outside force:** after the table's ten rounds the force keeps growing (more Brutes, Shield bearers, Raiders and Gliders each round, a Siege crawler every other round), within the save bound of 120 units per half.
- **Alone (Outside force only):** only the half that comes for you sets off; nobody plans for the other side, its core is never attacked and is hidden. Endless: you hold as long as you can (the game is lost when your core falls; the end text says in which round). Ten rounds: you win if your core still stands after round 10.
- **Review items from PR #104 folded in:** pressure is 0 before the first battle and at most 2 × `MAX_WAVE` (L1); each round's pressure is pinned to that round's leaks (M2); `isValidState` never throws, also on sparse arrays or throwing getters (L9).

Still to come: Step B (Duel with production buildings and research; buying the wave as an option) and Step C (your own defenders against the outside force).

### 18.2 Step B, planned: the Duel with production and research

Default for the Duel; "buy the wave each round" (§ 16) becomes the start-screen option *Waves: Production / Shop*.

- **Production buildings** on your own pads (like the Extractor: they take a pad, can be shot by armed units, sell for the usual refund). Each sends its units automatically at every lock:

  | Building | Price | Sends every round |
  |---|---|---|
  | Barracks | 100 | 3 Walkers |
  | Garage | 150 | 2 Runners |
  | Hangar | 175 | 1 Glider |
  | Lab | 150 (one per side) | nothing; allows research |

- **Research** (needs a Lab; each item once, paid when chosen, in effect from the next lock; shown to both sides like the buildings):

  | Research | Price | Effect |
  |---|---|---|
  | Shield plates | 150 | Barracks send Shield bearers instead of Walkers |
  | Field repair | 150 | every Barracks also sends a Mender |
  | Armed raiders | 175 | Garages send Raiders instead of Runners |
  | Heavy chassis | 200 | every Garage also sends a Brute |
  | Twin hangars | 200 | every Hangar sends 2 Gliders |
  | Siege works | 300 | a Siege crawler every third round |

- The wave = what the buildings send (in a fixed order) + the endless conscripts. Workshops and capacity go away in this variant: the buildings are the limit.
- **Computer:** builds production in the kinds that get furthest against your visible towers (the scoring it already uses to buy), researches in the order that adds most threat per credit, and keeps the defence share it has now; Hard checks its wave against your towers with the wave simulation, as its probe does.
- **Balance targets** (long suite, as for VS Small): mirror matches are draws; Hard beats Normal beats Easy from either seat; endless games end before round 60; a player who never builds loses.
