# Design: adventure engine and the two original adventures

Status: **Draft (2026-10-13), awaiting owner decisions** ([§ 13](#13-open-questions-for-the-owner)). Nothing here is implemented yet; numbers marked *(proposal)* are first guesses to be confirmed by the vertical slice.

Scope:

- `packages/adventure-engine` (`@wp/adventure-engine`) — the shared, deterministic point-and-click engine (spec: "Point-and-click adventure framework": scenes, hotspots, inventory, items, dialogue, flags/state, puzzle state, scene transitions, save/load, audio, localization), plus its **content checker**.
- Adventure A — original dark-fantasy exploration (spec: "Adventure A"), working id `adventure-a` until the name decision (Q9).
- Adventure B — original temporal science-fiction adventure (spec: "Adventure B"; the spec's example URL is `/games/temporal-adventure`), with the **time model** of [§ 4](#4-time-model-adventure-b).

Out of scope: an in-app adventure editor, player-made adventures, online anything, voice acting, combat systems.

References: implementation brief (binding: universal resumability, IP rule, adventure sections, Definition of Done), reference conversation (owner, Prompt 4: one adventure "leaning on" King's Quest VIII, one on TimeShift; "core elements should be problem solving, puzzles, combinatorics"; for the temporal one explicitly "travel, pause, fast forward, slow, backward"), ADR 0002 (GameModule contract), 0006 (roles), 0009 (precedent for an engine owned by its workstream), 0011 (per-locale content), 0012 (library), [strategy.md](strategy.md) (structure and level of rigour this document follows).

IP rule (spec, CLAUDE.md): the three reference titles describe *desired high-level experiences only*. Adventure A takes "a mysterious, interconnected world explored region by region"; Adventure B takes "time manipulation as the core verb set". Nothing else: no names, story, characters, places, lore, maps, art, sound, music, dialogue, items (in particular no masks, no knights-and-kingdom quest, no suit-based time powers, no occupied-city/alternate-dictatorship setting, no shooting). Every premise in [§ 9](#9-original-story-premises) is checked against this list; a final name/trademark check happens with Q9.

---

## 1. Goals, non-goals and honesty

Goals, in priority order:

1. **Thinking is the progress mechanism.** Every step forward comes from *observing* (noticing a detail in a picture or a sentence), *deducing* (combining clues into a conclusion), *planning* (ordering actions, carrying items to where they are needed) or, in B, *causal/temporal reasoning* (predicting what a process will do and where an intervention must happen). Never from reflexes, grinding, luck or pixel hunting.
2. **Fair puzzles, proven.** Every puzzle has its information available in the game before it is needed; every adventure is machine-checked to be completable from every reachable state (no dead ends) and to reach every scene ([§ 6.4](#64-content-checker)). This is the adventure equivalent of the repo's solver-verified puzzles (generator → independent solver).
3. **Closable at any moment, resumable exactly.** Saves are plain JSON of logical state, written after every action. Logic never depends on wall-clock time.
4. **One engine, two adventures.** A uses the core (scenes, hotspots, items, dialogue, clues, mechanisms); B adds the time module as an engine extension, not a second engine. A ships first (spec: "build the simpler fantasy adventure before the temporal adventure").
5. **Fully playable as text.** Every scene and hotspot has a text description; the whole adventure can be completed with a screen reader and keyboard only ([§ 8](#8-accessibility)).
6. **Finite and calm.** An adventure has an ending, chapters with natural stopping points, and no reason to come back once finished.

Non-goals: combat (A may have *danger* that is solved by thinking, never by fighting); death or game-over screens; timed sequences (A has none; B has only *simulated* time that advances when the player acts — [§ 4.2](#42-beats-time-advances-only-when-the-player-acts)); collectibles for their own sake, achievements, completion percentages as goals; procedurally generated stories; LLM-driven characters (M9 may add optional flavour later, never required for progress); a generic undo (rewind in B is a puzzle mechanic, spec).

**Why it is worthwhile play.** Adventures are the backlog's "long-form" exercise of the same skills the short games isolate: holding several open problems in mind, testing hypotheses against a world ("if the sluice drains this room, where does the water go?"), and connecting information from different places and people. **Honest claims** (product rule): the catalogue text says "an adventure to explore and puzzle through — practice in noticing details and reasoning about causes; active leisure". Never "improves your memory/brain/problem solving". Metadata skills: A `['deduction', 'spatial', 'planning']`, B `['systems', 'planning', 'deduction', 'hypothesis']`; `typicalMinutes` per sitting `[15, 45]`, and the rules text states the total length (≈ 3 h each, Q2).

---

## 2. Player experience and core loop

```text
LOOK      read the scene (picture + text), examine hotspots          (free: never costs anything)
THINK     journal: clues, open questions, people, places             (free)
ACT       take · use · use item on hotspot · combine items/clues · talk · go
          B only: apply a time power to a marked object · wait · travel between eras
RESULT    the world answers with text (+ picture change); new clues land in the journal
```

- **Verbs**: one context menu per hotspot listing only the verbs that apply (*Examine*, *Take*, *Use*, *Talk*, *Go*), plus *Use [selected item] on …*. No verb coin, no "use X on Y" for every pair — the menu shows the selected item as an option on every hotspot so that trying is cheap.
- **Refusals explain.** Trying something that does not work returns a reason or a generic but varied line ("That does not fit."); nothing is lost by trying.
- **No pixel hunting**: a "Show interactive places" toggle outlines every visible hotspot; the hotspot list ([§ 8](#8-accessibility)) always shows them.
- **Map**: visited places can be revisited directly from a map overview (no walking chores).
- **Chapters**: each region ends with a calm chapter screen ("Chapter 2 complete — continue or stop here"). It never auto-continues; continuing is a button. `finished({ outcome: 'completed', stats })` fires once at the true ending; stats are factual (hints used, optional discoveries found, actions taken), never a grade.
- **Hints** (Q6): per open goal three tiers (nudge → direction → solution), always available, never penalised or timed.

---

## 3. Engine model (`@wp/adventure-engine`)

### 3.1 Package and layers

```text
packages/adventure-engine/src/
  content/    content types (Adventure, Scene, Hotspot, Item, Dialogue, Clue, Mechanism…) — data only
  logic/      conditions, effects, step(), refusals, hints, journal         — pure, no DOM
  mechanisms/ reusable puzzle widgets: rules + solver per kind              — pure
  time/       processes, beats, powers, histories, eras (Adventure B)       — pure
  state/      AdventureState, isValidState(), migrate(), canonicalJson, stateHash
  check/      static checks, state-space explorer, report                   — test/CI only, tree-shaken
  view/       scene renderer (SVG), hotspot list, inventory, dialogue, journal, map, hint panel — DOM
```

Depends only on `@wp/game-core` (RNG, types) and `@wp/ui`. No third-party dependencies. Each adventure is a normal game package (`packages/games/<id>`) whose `rules.ts` is "the engine + this content" and whose `view.ts` mounts the engine view kit. Games never import each other; both import the engine. Ownership: Q8 (recommendation: a dedicated adventure workstream owns the engine, like ADR 0009). The engine API is recorded in a new **ADR 0014** with increment E1.

### 3.2 Content model (language-independent structure)

Content is **TypeScript data** (typed, compile-checked, tree-shakable), split into *structure* (ids, geometry, rules — bundled with the game chunk) and *text* (per locale, ADR 0011). The structure never contains user-visible strings.

```ts
interface Adventure {
  id: string; contentVersion: number;
  start: { scene: SceneId; era?: EraId; items?: ItemId[]; flags?: Record<FlagId, number> };
  scenes: Scene[]; items: Item[]; combinations: Combination[]; clues: Clue[]; deductions: Deduction[];
  dialogues: Dialogue[]; mechanisms: MechanismDef[]; goals: Goal[];        // goals drive hints + chapter ends
  params?: ParamDef[];                                                      // seeded puzzle parameters (§ 3.7)
  time?: TimeContent;                                                       // Adventure B only (§ 4)
}
interface Scene {
  id: SceneId; region: RegionId; art: ArtRef;            // art = id of a code-drawn picture (§ 7)
  hotspots: Hotspot[]; exits: Exit[];                    // exits are hotspots with a `go` effect + map link
  onEnter?: Rule[];
}
interface Hotspot {
  id: HotspotId; order: number;                          // reading order in the list (not spatial)
  shape: Polygon | Rect;                                 // scene units, viewBox 1600 × 900
  visible?: Cond;                                        // e.g. appears once the rope is cut
  interactions: Interaction[];                           // verb or item → rules
}
interface Interaction { verb: 'examine' | 'take' | 'use' | 'talk' | { item: ItemId } | { clue: ClueId }; rules: Rule[] }
interface Rule { when?: Cond; then: Effect[]; text: TextId }          // first matching rule wins; else refusal
```

Text ids are derived, not free-form: `scene.<id>.desc`, `hs.<scene>.<hotspot>.name|desc|<verb>.<n>`, `item.<id>.name|desc`, `clue.<id>`, `dlg.<id>.<node>`, `goal.<id>.hint.<1-3>`. The checker derives the full key set from the structure, so a missing translation is a test failure, not a runtime surprise.

### 3.3 Conditions and effects (a small, closed language)

Puzzle logic is **data, not code** so the checker can explore it and translators never touch it.

```ts
type Cond =
  | { all: Cond[] } | { any: Cond[] } | { not: Cond }
  | { flag: FlagId; eq?: number; gte?: number; lte?: number }    // flags are small integers (0 = unset)
  | { has: ItemId } | { knows: ClueId } | { visited: SceneId }
  | { mech: MechId; solved: true }
  | { era: EraId } | { obj: ObjId; state: string; era?: EraId }; // B only

type Effect =
  | { set: FlagId; to: number } | { add: FlagId; by: number }   // bounded by the flag's declared range
  | { give: ItemId } | { take: ItemId } | { learn: ClueId }
  | { go: SceneId } | { dialogue: DialogueId } | { goalDone: GoalId } | { end: EndingId }
  | { objSet: ObjId; state: string } | { grantPower: PowerId };  // B only
```

Flags declare their range (`0..max`, usually boolean `0..1`) so the state space is finite and `isValidState` can bound-check. No arithmetic beyond bounded add; no loops; no string flags. Anything more complex is a **mechanism** (§ 3.7).

### 3.4 Actions and `step`

```ts
type Action =
  | { a: 'examine' | 'take' | 'use' | 'talk'; hs: HotspotId }
  | { a: 'useItem'; item: ItemId; hs: HotspotId } | { a: 'combine'; x: ItemId; y: ItemId }
  | { a: 'deduce'; x: ClueId; y: ClueId } | { a: 'present'; clue: ClueId | ItemId; npc: HotspotId }
  | { a: 'choose'; option: string } | { a: 'go'; scene: SceneId }        // go = exit or map travel
  | { a: 'mech'; mech: MechId; move: MechMove } | { a: 'hint'; goal: GoalId }
  | { a: 'power'; power: PowerId; obj: ObjId; k?: number } | { a: 'release'; obj: ObjId }  // B
  | { a: 'wait'; beats: number } | { a: 'travel'; era: EraId };                            // B

step(content, state, action): { state; out: Outcome }   // pure; never throws
// Outcome = { ok: true; text: TextId[]; changed: Change[] } | { ok: false; refusal: Refusal; text: TextId }
```

`step` validates the action against the state (hotspot visible in the current scene, item held, …); an invalid action returns a refusal with an enum reason and the **unchanged** state. Rules are evaluated in authored order, first match wins; effects apply in order; then `onEnter` rules of a new scene; then the B time step (§ 4). `available(content, state): Action[]` lists every currently meaningful action (used by the view, the hotspot list, the checker and fuzzing).

### 3.5 Items and combinations

- Inventory is an ordered list of item ids (pickup order; stable for screen readers). No weight or slot limit (a limit adds chores, not thought).
- `Combination { x, y, when?, then, text }` is unordered (`x+y == y+x`, property-tested). Combinations are explicit; anything not listed refuses with a generic line.
- Items may carry a small `state` (e.g. lamp lit/unlit) as flags `item.<id>.*`, so no item variants explode the id space.

### 3.6 Dialogue, clues and deductions

- **Topic-based dialogue**, not deep trees: talking opens a list of topics (`Dialogue { nodes: { id, text, options: { id, when?, then, next? }[] }[] }`); options can *ask about* known clues or *present* items/clues ("show the torn ledger"). This is how NPC clue chains work: what you know changes what you can ask.
- **Clues** are first-class journal entries (`learn`), grouped by person, place and question. They are what the player reasons with, and they make resumption easy ("what was I doing?").
- **Deductions**: combining two clues in the journal (`deduce`) can yield a conclusion clue (e.g. *the gatekeeper's two shifts* + *the ledger's dates* → *nobody watched the gate on the flood night*). Wrong pairs say "these do not connect" — no penalty. It turns "talk to everyone" into actual deduction and keeps the logic language-independent.
- Dialogue never times out; every line stays readable in the journal's "conversation log" (last 50 lines).

### 3.7 Mechanisms (reusable puzzle widgets)

Logic puzzles that do not fit flags are **typed mechanisms** with their own pure rules, a solver and an accessible view, parameterised by content:

| Kind | Rules (examples) | Solver | Used for |
|---|---|---|---|
| `rings` | n concentric rings with m symbols each, rotate one ring (some rings are coupled) | BFS over rotations | locks, star charts |
| `network` | valves/sluices on a directed graph of basins with capacities; water flows by integer levels | BFS over valve settings and levels | A: sluice works |
| `balance` | place weights on a beam/scale; known and unknown weights | exhaustive (≤ 8 weights) | weighing deductions |
| `sequence` | press/arrange k elements in an order constrained by stated rules | constraint enumeration | inscriptions, rituals |
| `beam` | rotate mirrors/lenses on a small grid to light targets | reuse of the Laser Paths idea, own code | A: beacons |
| `tiles` | slide/rotate tiles to complete a path | BFS (bounded) | reliefs, circuits |

- Each mechanism state is a small integer vector in `state.mech[id]`; moves are `MechMove` data; `solved` is a pure predicate; solving fires the mechanism's effects once.
- **Seeded parameters** *(proposal)*: a few mechanisms draw their solution (e.g. the symbol order of a lock) from the seed at `newGame`, stored in `state.params`. A walkthrough then cannot replace finding the clue; the clue text shows the parameter via placeholders (`{symbol1}`, rendered as pictograms, not words). The checker verifies **every** parameter value (domains are small, ≤ 64).
- **Fair-clue rule**: a mechanism that needs information declares `needs: ClueId[]`; the checker proves those clues are obtainable before the mechanism can be required (guessing is still allowed, never needed).

### 3.8 Goals, hints and the journal

`Goal { id, chapter, active: Cond, done: Cond }` — authored milestones in story order. The hint panel offers the first active, unfinished goal(s) with three authored hint tiers. The journal shows: open questions (active goals' titles), clues, people, places, conversation log. Hints used are recorded only for the final factual summary.

### 3.9 No death, no dead ends

- Danger exists in the fiction (a collapsing floor, rising water), but an action that would harm the player character is **refused with the reason** ("The water would reach the stairs before you"). There is no failure state.
- **No softlocks**: from every reachable state, the ending is reachable — proven by the checker (§ 6.4). Consequently items are never destroyed while still needed, and one-way doors only close behind completed regions.
- Optional discoveries (lore, side paths) never gate the ending; the summary lists how many were found without percentages or rewards.

---

## 4. Time model (Adventure B)

### 4.1 Requirements recap (spec)

Pause (freeze systems while the player acts), slow (stretch a closing window), fast forward (accelerate growth/charging/weathering/reactions), rewind (reverse *selected objects or local scene states* — **not** a generic undo), time travel (eras; actions in one change another), combined chains (rewind → pause → move → fast-forward → release). "The system needs explicit causal rules so puzzles are understandable rather than arbitrary."

### 4.2 Beats: time advances only when the player acts

- Simulated time is an integer **beat** counter. It advances **only** through actions: physical actions (`take`, `use`, `useItem`, `power`, moving between hotspots that are marked as distant) cost 1 beat; `wait(n)` costs n beats (1 ≤ n ≤ 24); looking, examining, reading, talking, the journal, the inventory and hints cost **0 beats**. Reading is never under pressure.
- There is no wall-clock anywhere in the logic. An optional **"Play" presentation** (Q7) dispatches `wait(1)` every ~0.8 s for atmosphere; it is off by default, stops on `pause()`, on `visibilitychange`, under reduced motion it is not offered, and nothing requires it.
- "Slow a rapidly closing security system long enough to perform several actions" becomes exactly countable: the shutter closes in 2 beats; you need 3 actions; slowed (×½) it takes 4 beats.

### 4.3 Time objects and processes

A scene in B declares **time objects** — the only things time powers affect. Each has a finite integer state machine:

```ts
interface TimeObject {
  id: ObjId; hs: HotspotId;                       // its hotspot (marked with a visible tuner glyph)
  process: 'cycle' | 'counter' | 'mover' | 'door' | 'reaction';
  states: string[];                               // named states → text + picture; index = integer state
  next: TransitionTable;                          // state × sub-step → state (deterministic, total)
  rewindable: boolean; pausable: boolean; scalable: boolean;
  blocks?: Cond;                                   // e.g. "door closed" blocks the exit
  derivedFrom?: EraDerivation;                    // § 4.6
}
```

Scales are integer sub-steps per beat: **paused 0, slow 1, normal 2, fast 8** (fast = ×4, slow = ×½; content may give a counter its own fast factor up to ×16). No floats, so `fast(1 beat) ≡ normal(4 beats)` exactly.

**Order within one beat** (fixed, like strategy's systems):

1. apply the player's action (effects, powers, releases);
2. advance every non-paused time object in id order by its scale's sub-steps (each sub-step one transition);
3. evaluate scene rules to a bounded fixpoint (≤ 8 rounds; the checker fails content that does not settle);
4. safety check: if the new state would harm the player (e.g. standing in a closing door), the whole beat is rolled back and the action refused with the reason;
5. push rewindable objects' states to their history (§ 4.5).

### 4.4 Powers and the tuner's causal rules

The protagonist's device (generic name, e.g. *phase tuner*) applies one effect per object; effects persist until released. The rules are shown in-game on one card ("How the tuner works") and are the *only* time rules:

| # | Rule |
|---|---|
| T1 | Only **marked** objects can be affected (glyph + word "marked" in the description). Living beings and you are never affected. |
| T2 | **Pause**: the object's process stops and the object becomes rigid: it cannot be moved by other objects, and it holds what it holds (a paused piston blocks, a paused door stays open). You can still take marked loose parts from it. |
| T3 | **Slow / Fast**: the object's process runs at ½× / 4× (some objects say "up to 16×"). |
| T4 | **Rewind k**: the object returns to the exact state it had k beats ago, within what the tuner remembers *in this place* (24 beats, shown as a timeline). The in-between is forgotten; there is no "redo". A broken object can be rewound to whole if it broke within memory. A rewind that would put the object where something solid now is, is refused. |
| T5 | **Capacity**: the tuner holds at most *N* effects at once (N = 1 at the start, 2 later, 3 in the last chapter — introduced with the story; no recharge, no cost). Release is free. |
| T6 | **Locality**: time flows only near the tuner — when you leave a place, all effects there end and its processes stand still until you return; its memory (T4) is cleared. |
| T7 | **Eras**: changes flow only **forward** in time. What you do in an earlier era shows in later eras; nothing you do later changes the past. You carry items and knowledge between eras. |
| T8 | **Safety**: you are never harmed; the tuner refuses an action that would harm you and says why. |

T5 is a puzzle constraint inside the adventure (like a boat's capacity in River Crossing), not an energy system: there is no regeneration, purchase or waiting. T6 keeps saves bounded and makes every scene a closed puzzle.

### 4.5 Rewind representation: per-object snapshot rings

Options considered:

| Option | How | Verdict |
|---|---|---|
| Global snapshots per beat | copy the whole scene state each beat | rejected: is a generic undo in disguise; large saves |
| Event log + inverse application | record transitions, apply inverses | rejected: needs invertible transitions (merges like "two states → broken" are not invertible); bug-prone |
| Event log + re-simulation | replay from the scene-entry snapshot up to now−k with the object's history | possible, but couples the rewound object to every other object's past; hard to explain |
| **Per-object state ring** ★ | each rewindable object keeps its last H = 24 integer states (one per beat) | chosen: exact, O(1) rewind, trivially bounded, matches rule T4 |

- `history[obj]` is a ring of at most **H = 24** small integers (state index; objects with a position store `state * 64 + pos`). Pushed in step 5 of every beat; cleared on leaving the scene (T6). Rewind k sets the state to `history[now − k]` and truncates the ring to that point.
- Bound: ≤ 12 rewindable objects per scene × 24 integers ≈ 2 kB of JSON worst case.
- The timeline UI shows the object's remembered states as a row of discrete frames (text: "3 beats ago: lid closed, intact").

### 4.6 Eras and forward causality

- A **location** exists in 2–3 **eras** (e.g. *construction*, *operation*, *ruin*); `(location, era) → scene`. `travel(era)` is available only at *fold points* (scene-level hotspots).
- Each era scene stores its own object states (`state.time.eras[era][obj]`). Effects, histories and processes are per current scene only (T6).
- **Derived objects** in later eras declare `derivedFrom: { era, cond, state }[]`: their state is recomputed **from the stored states of earlier eras** whenever the player enters the later scene (a pure function; e.g. `planter.state == 'planted' in construction` ⇒ `tree = 'grown'` in operation, ⇒ `roots = 'bridge'` in ruin). Rewinding the planter in the past un-plants it, and the future follows. Derived objects cannot be changed directly in the later era unless their derivation allows it (checker-enforced: no write to a derived object without a declared override).
- Information travel (observe a historical event → use the knowledge now) is ordinary `learn` effects in the earlier era.
- Paradoxes are excluded by construction: T7 (no backward influence) and items carried keep their identity (an item cannot be in two eras at once; leaving an item in the past is only possible at declared drop points and is a derivation source like any object).

### 4.7 Combined chains

The spec's example chain is a sequence of ordinary actions on the same object set, e.g.: `power rewind (gear train, 6)` → gear whole again → `power pause (gear train)` → `take (gear)` from the rigid train → `power fast (charging cell)` → cell charged in 1 beat instead of 4 → `release (gear train)` → train turns the lift. The checker's shortest solution confirms that later chapters' puzzles indeed require combinations (a metric: "minimum distinct powers on the critical path" per chapter).

---

## 5. State, saves, determinism

### 5.1 State shape (plain JSON)

```ts
interface AdventureState {
  v: number;                       // engine state version (GameMetadata.stateVersion)
  adventure: string; content: number;     // adventure id + contentVersion
  seed: number; params: Record<string, number>;   // seeded puzzle parameters (§ 3.7)
  scene: SceneId; selected?: ItemId;
  flags: Record<FlagId, number>;   // only non-zero flags (sparse)
  items: ItemId[]; clues: ClueId[]; visited: SceneId[]; goalsDone: GoalId[];
  mech: Record<MechId, number[]>;  // only touched mechanisms
  dialogue?: { id: DialogueId; node: string };
  hints: Record<GoalId, number>;   // tiers revealed
  log: ConversationLine[];         // last 50 dialogue/result lines (display only)
  actions: number; recent: Action[];      // action count + last 200 actions (bug reports)
  ended?: EndingId;
  time?: {                         // Adventure B only
    era: EraId; beat: number; capacity: number;
    eras: Record<EraId, Record<ObjId, number>>;        // stored object states per era
    effects: { obj: ObjId; power: 'pause' | 'slow' | 'fast'; factor?: number }[];
    history: Record<ObjId, number[]>;                    // current scene only, ≤ 24 each
  };
}
```

Expected size: A ≤ 12 kB, B ≤ 20 kB (dominated by `recent`; the guard enforces hard caps on every array).

### 5.2 Versioning and content updates

- `stateVersion` (engine format) with `migrateState` as usual (ADR 0002).
- `content` (adventure content version): content ids are **append-only** — never renamed, removed or re-purposed (as for Deep Read). A content update that would invalidate saves ships a pure `contentMigrations[from]` (e.g. "flag X was split into X and Y: set Y if X ≥ 2"); `isValidState` accepts older `content` versions it can migrate.
- `isValidState` = structural guards **against the bundled structure** (every id known, flags within declared ranges, items/clues unique, histories ≤ 24, effects ≤ capacity, scene consistent with era) — synchronous (structure is in the game chunk, text is not needed), never throws, fuzzed by the contract suite.
- A state that is valid but unreachable (hand-edited) is tolerated: the engine never assumes reachability for safety, only for hints.

### 5.3 Determinism and replay invariants

- No `Math.random`, no `Date`, no floats in logic; RNG (`createRng(seed)`) is drawn **only** at `newGame` for `params`; the simulation itself draws nothing.
- `replay(content, seed, actions) → state` is the reference; `stateHash` = FNV-1a over canonical JSON (as `worldHash` in the strategy engine).
- Properties (fast-check, over random `available()` action sequences):

| # | Property |
|---|---|
| P1 | Determinism: same content + seed + actions ⇒ same `stateHash`. |
| P2 | Purity: `step` never mutates its inputs. |
| P3 | Resume anywhere: for any prefix, `restore(JSON.parse(JSON.stringify(s)))` then the rest ⇒ same hash as uninterrupted. |
| P4 | Totality: any action (also invalid/random) returns an outcome and never throws; a refusal leaves the state unchanged. |
| P5 | Validity: every reachable state passes `isValidState`; `isValidState(junk)` never throws. |
| P6 | Combination symmetry: `combine(x,y) ≡ combine(y,x)`; `deduce` likewise. |
| P7 | B pause neutrality: a paused object's state is unchanged by any number of beats. |
| P8 | B scale consistency: for an isolated object, `fast` for 1 beat ≡ normal for 4; `slow` for 2 ≡ normal for 1. |
| P9 | B rewind exactness: if nothing acted on X directly for k ≤ 24 beats, `rewind(X, k)` restores X's exact state k beats ago and changes no other object. |
| P10 | B forward causality: no action taken in era *e* changes any stored state of an era earlier than *e*. |
| P11 | B locality: leaving a scene clears its effects and histories; `wait(n)` ≡ n × `wait(1)`. |
| P12 | Bounds: every array within its cap; serialized size ≤ 32 kB. |

---

## 6. Content pipeline and localization

### 6.1 Layout per adventure package

```text
packages/games/<id>/src/
  structure/<region>.ts      scenes, hotspots, items, rules, mechanisms of one region (no strings)
  structure/index.ts         the Adventure object (merges regions), params, goals
  art/<scene>.ts             code-drawn pictures (§ 7)
  content/<locale>.ts        all texts of the adventure for one locale (ADR 0011 chunk)
  content/index.ts           CONTENT_LOADERS, preloadContent, contentFor
  glossary.ts                per-locale fixed names of people/places (+ translator notes)
  messages.ts                UI messages (16 locales, small): title, tagline, rules, verbs, panels
test/  walkthrough.ts (golden), checker.test.ts, rules.test.ts, contract.test.ts, view.test.ts
```

### 6.2 Text volume and chunk budgets *(proposal)*

Calibration from Deep Read: 7.8 k English words ≈ 49 kB of source; other locales 1.1–2.3× (Hindi largest).

| | Adventure A (~3 h) | Adventure B (~3 h) |
|---|---|---|
| Scenes / hotspots / items | 28–32 / ~170 / ~35 | 18 locations × 2–3 eras ≈ 40 scenes / ~200 / ~25 |
| Words (en): descriptions, responses, dialogue, clues, hints | ~18 k | ~16 k |
| Per-locale chunk (raw / gzip) | en ~115 kB / ~35 kB; hi ~260 kB / ~60 kB | similar |
| All 16 locales (raw) | ~2.4 MB precached | ~2.2 MB |

Budgets (CI-checked in the adventure's tests, like the strategy chunk budget): engine + view kit ≤ 70 kB gzip; game code + structure + art ≤ 250 kB gzip; each locale text chunk ≤ 80 kB gzip. If a locale chunk exceeds it, split per chapter (`content/<locale>/<chapter>.ts`, preloading the current chapter + English; chapter changes load the next chunk behind the chapter screen) — a step deferred until measured. One chunk per locale keeps the ADR 0011 contract unchanged.

Translation load: ~34 k words × 15 locales ≈ 0.5 M words, AI-assisted per existing policy, with native review flagged as a risk (§ 12).

### 6.3 Writing rules (translation-safe puzzles)

- **No language-dependent puzzles**: no wordplay, rhymes, anagrams, letter counts, alphabetical order, puns as clues. Puzzles use pictograms, numbers (shown as digits or tally marks), shapes, positions, quantities, causes.
- Names of people and places come from `glossary.ts`, invented to be pronounceable in all scripts; translators may inflect them (checker warns, not fails, if a glossary form is missing in a string that should mention it).
- Every placeholder (`{symbol1}`, `{count}`) must appear in every locale (existing placeholder test).
- Writers add a scene by: (1) structure entry in the region file; (2) art stub (outline + labelled shapes); (3) English text for every derived key; (4) `pnpm vitest run packages/games/<id>` → checker report (§ 6.4) lists missing keys, unreachable hotspots, unused items, new state-space numbers; (5) translations; (6) walkthrough update.

### 6.4 Content checker

Lives in `@wp/adventure-engine/check`, runs as a test in each adventure package (no new root script needed). Two parts:

**Static checks**: every id referenced exists and is unique; every derived text key exists in all 16 locales with matching placeholders; every hotspot has a name and description; every item has at least one successful use; every combination's items exist; flags are written somewhere and read somewhere; polygons lie inside the viewBox and their padded hit areas meet the size rule (§ 8); no derived object is written without an override; B: transition tables are total, ranges consistent.

**Dynamic exploration** (breadth-first over the *abstract state*: scene, era, flags, items, clues, mechanism-solved bits, B object states/effects; mechanism internals are replaced by their solver's "solvable from here?" verdict):

1. **Completable**: an ending is reachable from the start, for every parameter value.
2. **No softlocks**: from **every** reachable state an ending is reachable (reverse reachability on the explored graph).
3. **Coverage**: every scene, hotspot interaction, item, clue, deduction and optional discovery is reachable.
4. **Fair clues**: every mechanism's `needs` clues are reachable before the mechanism's solved state lies on any path to the ending.
5. **Metrics** for difficulty review: shortest solution length per chapter, branching (number of open goals over time), B: distinct powers on the critical path, maximum beats needed in one scene.
6. **Budgets**: ≤ 2 M abstract states per adventure, ≤ 200 k per B scene (scene-local exploration with the scene's entry states, then a chapter graph over scene outcomes). Exceeding the budget fails the check — it also signals a puzzle too complex to understand.

**Independence** (spec: no generator validating itself): the checker's condition/effect interpreter is a separate, minimal implementation (`check/interpret.ts`) and does not call `logic/`. A property test asserts that both agree on `available()` and on the resulting abstract state for random action sequences; the checker's shortest solution is replayed through the real `step` to the ending; a hand-written golden walkthrough is replayed too (end hash pinned, reviewed on change). Each mechanism solver is cross-checked against an exhaustive oracle in tests (as River Crossing's BFS oracle).

---

## 7. Art and audio

Constraint: no third-party asset without licence review; precache globs today cover `js, css, html, svg, png, ico` (raster formats like WebP would need a config change); every picture must have a text equivalent anyway.

| | (a) **Code-drawn vector dioramas** | (b) Text-first with illustrated vignettes | (c) Hand-made raster/pixel art |
|---|---|---|---|
| What | each scene an SVG built from TS data: 3–5 depth layers of flat shapes, limited palette per region, procedural detail (seeded hatching, stone/wood patterns) via shared drawing helpers; hotspot shapes are the drawn shapes | scene = text panel + hotspot buttons; one small code-drawn vignette (object close-up) per scene | 320×180 pixel art or painted backgrounds by an artist, PNG |
| Size | ~6–12 kB gzip per scene → ~0.3 MB per adventure | ~2–4 kB per vignette | 40–120 kB per scene → 2–4 MB |
| Cost | high per scene at first (~½ day of agent work), falling with the helper library; consistent quality reachable by an agent | lowest | needs a human artist (or owner-provided art) — the main blocker; AI-generated images raise provenance/licence questions |
| Accessibility | high-contrast and forced-colour themes possible (palette tokens), crisp at any zoom, hotspot outlines exact | best for screen readers, weak "point-and-click" feel (spec asks for point-and-click, observation of pictures) | fixed contrast; outlines approximate |
| Animation | SVG transforms; state changes swap layers; reduced motion trivial | minimal | sprite sheets (larger) |
| Fit | A: silhouettes, fog layers, candle-light gradients; B: clean technical line art, which also shows process states clearly | — | strongest atmosphere if an artist exists |

**Recommendation (Q1): (a)**, with the text layer of (b) always present (it is required for accessibility anyway). It is the only option an agent can produce end-to-end without new licences, keeps both adventures under ~1 MB precached including texts per locale, and matches the repo's practice (Faces & Names, Relay Command glyphs are drawn in code). The vertical slice (increment A1) is the proof: if three scenes do not reach the bar, fall back to (b) plus richer vignettes, or ask for (c).

**Audio (Q4)**: no puzzle requires sound. v1 is silent with optional **read aloud** (browser speech synthesis, best effort, as in Memory). Later, optional ambience and effects synthesised with Web Audio in code (no files, no licences), off by default, with a volume control. No voice acting (16 locales × ~34 k words is out of proportion).

---

## 8. Accessibility

- **Dual representation.** Every scene renders the picture *and* a structured text view: scene description; hotspot list in authored reading order (buttons: name + short state); exits; selected item. The list alone is sufficient to finish the adventure (e2e plays the slice keyboard-only through it).
- **Input**: pointer (click hotspot → context menu), touch (first tap selects and shows name + verbs, second action confirms — no accidental actions, no hover dependence), keyboard (Tab/Shift-Tab through hotspots in reading order, arrow keys move spatially between hotspots, Enter opens verbs, `I` inventory, `J` journal, `M` map, `H` hints, Esc closes; shortcuts are listed in the help and inactive while a text field has focus).
- **Targets ≥ 44 CSS px**: the scene never renders narrower than 640 CSS px (narrower viewports pan horizontally, as Relay Command's map does); at that width 44 px = 110 scene units, so every hotspot's padded hit area is ≥ 110 × 110 units and padded areas do not overlap — enforced by the checker. Buttons in panels are ≥ 44 px.
- **Screen readers**: `aria-live` announces each outcome text once; descriptions state position in words where it matters ("on the upper shelf, left of the lamp"); the picture has a role `img` with the scene description; dialogue options are a real list.
- **No colour-only information**: states are named in text and drawn with shape/pattern changes; mechanisms use pictograms with distinct outlines; B effects have distinct glyphs (pause ‖, slow ◁, fast ≫, rewind ↺) plus words.
- **RTL**: panels use logical properties; pictures are **not** mirrored (they depict a world), so descriptions avoid relying on reading direction; the hotspot list order is authored (semantic), identical in all locales.
- **Reduced motion**: no animated transitions; state changes are shown as instant swaps with a brief outline highlight; B's "Play" presentation is not offered.
- **Time**: A has no time mechanic at all. B's time advances only by actions (§ 4.2); every time object's state is shown as text ("Shutter: closing, 2 beats to closed at normal speed"); the timeline for rewind is a list of discrete frames; there is no input that must be performed within a real-time window.
- **Cognitive**: journal with open questions; "previously" recap on resume (last goal, last three outcomes); hints; no penalties.
- **Honest limitation** (spec): some puzzles (sightlines, beam routing) are spatial; their text form describes positions on a small labelled grid, which makes them operable but harder without sight. The rules text says so.

---

## 9. Original story premises

Two per adventure; one of each is chosen in Q5. Names below are placeholders; tone: melancholy and eerie, no gore, mild peril only.

### Adventure A — dark fantasy exploration

**A1 · The Drowned Archive** *(recommended)*
- *Setting*: a valley that was flooded on purpose a century ago to bury a monastery-library; a dry summer has lowered the reservoir and exposed terraces, sluice works and the archive's upper floors.
- *Protagonist*: a surveyor's apprentice sent to map the exposed ruins before the water returns (no fighter, no chosen one).
- *Core mystery*: who ordered the flooding, and why the sluice keepers' families still guard a gate that no longer holds water.
- *Regions with different puzzle styles*: lakeside village (dialogue, testimony), sluice works (systems: `network`), the archive (deduction: catalogues and indexes), the undercroft (spatial: sightlines and reliefs).
- *Sample puzzles*:
  1. **Draining order** (systems, cross-location): five basins linked by sluices; open and close gates so that the archive's reading room drains without flooding the stair the player needs later. The gate symbols are explained by a keeper's tally board in the village.
  2. **The shelf-mark system** (deduction): three water-damaged index cards each show part of the archive's numbering rule (room · case · shelf by pictogram). Infer the rule, then find the one book whose mark was scratched out.
  3. **Three towers** (spatial): a surveyor's notebook records the bearings from three bell towers to a buried vault; set the sighting instrument on each tower top (three scenes) and mark the intersection on the map to dig in the right place.

**A2 · The Unlit Beacons**
- *Setting*: a mountain pass with a chain of signal beacons and a glass-makers' town emptied after a grey winter.
- *Protagonist*: a lamp-mender returning home to relight the chain before the passes close.
- *Core mystery*: the beacons were put out deliberately; the few who stayed each tell a different story.
- *Sample puzzles*: (1) **mirrors and lenses** on a beacon's lamp room (`beam`) to send light down three valleys; (2) **contradicting testimony**: three townspeople's accounts of the night with the times of bells — find whose account cannot be true; (3) **counterweights**: lift a portcullis by balancing known stone weights that must be carried from two other places (`balance`, cross-location).

### Adventure B — temporal science fiction

**B1 · The Folded Station** *(recommended)*
- *Setting*: a tidal research station on a small island; an experiment in "local time shear" failed and left the station folded across three eras: *construction*, *operation* and *ruin* (centuries later, overgrown and flooded).
- *Protagonist*: the station's maintenance engineer, who wakes with the calibration device (the *tuner*) used to align the station's clocks.
- *Core mystery*: why the safety interlock failed — a design flaw nobody wanted to report, or deliberate? The answer is observed in the past, not told.
- *Sample puzzles*:
  1. **Lens at rest** (pause): the lighthouse lens turns too fast to read the pattern it projects; pause it at the facet that projects the dock's code — which facet is known only from the construction-era drawings.
  2. **Root bridge** (travel + fast forward): plant a mangrove seedling in the construction-era planter at the flooded pier; in the ruin era its roots form a walkway — but only if, in the operation era, the drain beside it was closed (else the roots grew elsewhere). Fast-forwarding the seedling tray in the past shows where roots will go before committing.
  3. **The broken interlock** (combined): rewind the shattered interlock panel 6 beats to whole, pause it, take the intact relay, fast-forward the backup cell to charged, insert the relay, release the pause — the panel's history shows who opened it.

**B2 · The Seed Vault Clock**
- *Setting*: a seed vault inside a mountain whose preservation field slows time for the stored seeds; the field has begun to drift.
- *Protagonist*: a botanist-archivist on a routine inspection, sealed in by an automatic lockdown.
- *Core mystery*: the founder's missing cultivar and a vault room that does not appear on any plan.
- *Sample puzzles*: (1) **germination tray** (fast forward): grow a vine that pushes a jammed vent open, but only after rotating the tray toward the vent (growth follows light); (2) **three valves, one cycle** (slow): the freezing cycle closes all valves after two beats; slow it to reset three valves in one cycle; (3) **founding day** (travel, information): observe the founder entering the hidden room's combination in the past, then use it in the present — the combination is a seeded parameter.

---

## 10. Testing strategy

| Level | What |
|---|---|
| **TDD unit** | condition evaluator (each operator), effects (each kind, ranges), rule order, refusals, combinations, dialogue options/conditions, deductions, goals/hints, scene enter rules; each mechanism kind's rules; B: every process kind, scales, pause rigidity, rewind/truncation, capacity, locality, derivations, safety rollback, fixpoint bound. |
| **Property (fast-check)** | P1–P12 of § 5.3 on fixture adventures and on the real adventures (random walks over `available()`). |
| **Checker** | fixture adventures that must pass and deliberately broken ones that must fail with the right reason (unreachable scene, softlock, missing clue, missing translation, hit-area overlap, budget exceeded); independence cross-check (§ 6.4). |
| **Golden** | per adventure: walkthrough replay to the ending (hash pinned); checker shortest path replayed through `step`. |
| **Contract** | `runGameContract` for each adventure (16 locales, preload, resume, pause, reset, dispose, junk rejection). |
| **Mutation (Stryker)** | `adventure-engine/src/{logic,time,state,mechanisms}` and `check/`; target ≥ 75 % (above the repo's 65 % break threshold). View code excluded. |
| **E2E (Playwright)** | per adventure: open `/games/<id>?seed=…`, play the prologue through the hotspot list (keyboard only) and once by pointer, reload mid-dialogue and mid-mechanism (`expectResumeAfterReload`), reach the first chapter screen; phone and desktop viewports; offline continuation in a second locale; B additionally: pause → reload → state unchanged, rewind timeline usable by keyboard. |
| **Size** | chunk budgets of § 6.2 asserted from the build output in CI. |

---

## 11. Increments (one PR each)

Sizes: S ≈ ≤ 1 k lines incl. tests, M ≈ 1–3 k, L ≈ 3–6 k (content PRs counted in English words; translations follow in the same PR).

| # | Increment | Acceptance tests | Size |
|---|---|---|---|
| E0 | Owner decisions (§ 13) recorded here; ADR 0014 *Proposed* (engine API, ownership) | — (docs) | S |
| E1 | **Engine core**: content types, conditions/effects, `step`, `available`, items/combinations, dialogue, clues/deductions, goals/hints, state + `isValidState` + hash; 3-scene fixture adventure | unit suite; P1–P6, P12; mutation ≥ 75 % on `logic/`; fixture walkthrough | M |
| E2 | **Checker**: static checks, BFS explorer, softlock/coverage/fair-clue/budget, metrics report, independent interpreter | broken-fixture suite (each failure reason), cross-check property, shortest-path replay | M |
| E3 | **Mechanisms**: `rings`, `network`, `balance`, `sequence` (+ `beam`, `tiles` when a premise needs them) with solvers and accessible views | per-kind unit + oracle tests; solver ≡ oracle on random instances; keyboard view tests | M |
| E4 | **View kit**: SVG scene renderer, hotspot list, context menu, inventory, journal, map, dialogue, hint panel, chapter screen; drawing helpers for art (a) | jsdom view tests; a11y checks (roles, labels, focus order); target-size checker rule | M |
| A1 | **Adventure A vertical slice**: prologue (4–6 scenes, ~2.5 k words), art in direction (a), 16 locales, registry entry, rules text with honest length and limitation note | contract; checker green; golden walkthrough; e2e keyboard + pointer + resume + offline locale; budgets | L |
| A2–A4 | **Regions 1–3** of A (one PR each, ~4–5 k words, 7–9 scenes, one new mechanism kind at most) | checker incl. cross-region puzzles; walkthrough extended; e2e unchanged (prologue) + chapter screen | L each |
| A5 | **Ending and polish**: finale, optional discoveries, hint review, summary, play-test fixes, native-review requests | checker metrics reviewed; full walkthrough; mutation re-run | M |
| T1 | **Time module**: beats, time objects, scales, powers, capacity, histories/rewind, locality, eras/derivations, safety rollback; checker extension (scene-local exploration) | P7–P11; unit per rule T1–T8; broken time fixtures; budget test | M–L |
| T2 | **Time views**: tuner panel, effect glyphs, rewind timeline, era switcher, state texts, optional Play presentation | view tests; reduced-motion behaviour; keyboard timeline | M |
| B1 | **Adventure B vertical slice**: prologue teaching pause and slow (3 locations × 1–2 eras) | as A1, plus e2e: pause → reload → unchanged; rewind via keyboard | L |
| B2–B4 | **Chapters** introducing fast forward, rewind, travel; then combined chains (capacity 2 → 3) | checker metric: later chapters' critical paths use ≥ 2 distinct powers | L each |
| B5 | Ending and polish (as A5) | as A5 | M |
| X1 | *Optional*: Web Audio ambience/effects in code (if Q4 = b) | audio off by default; no puzzle depends on it; pause/dispose stop sound | S |

Order: E1 → E2 → E3/E4 (parallel) → A1 → A2…A5; T1 may start after A1 (engine proven), B1 after T2. Each PR: tests in the same change, `pnpm check`, `pnpm build && pnpm e2e`, merge with green CI.

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Content volume** (~34 k words × 16 locales) dominates the effort; AI-assisted translations of narrative text can read flat or wrong. | Length decision Q2; region-by-region PRs; glossary; translation-safe writing rules (§ 6.3); native review listed per locale in the ROADMAP; English fallback stays a safety net only. |
| **Art quality** of code-drawn scenes falls short of "atmosphere". | Vertical slice A1 is the gate; fallback (b) or owner-provided art (c) decided after A1, not before. |
| **State-space explosion** in the checker (especially B). | Abstract states, mechanism internals replaced by solvers, scene-local exploration for B, hard budgets that double as a complexity limit for puzzles. |
| **Puzzle fairness** is more than solvability (obscure "adventure logic"). | Fair-clue rule; refusals that explain; deductions; three-tier hints; owner play-tests per region; metrics (branching, path length) reviewed per PR. |
| **Rewind confused with undo** / time rules feel arbitrary. | Eight explicit rules on one card; rewind only on marked objects within 24 beats in the current place; teaching chapter introduces one power at a time. |
| **Mobile usability** (small scenes, many hotspots). | 640 px minimum scene width with pan; hotspot list as the primary phone input; target-size check in the checker. |
| **IP proximity** to the references. | IP list at the top of this document; premises reviewed in Q5; name check in Q9; no reference titles in shipped text. |
| **Engine API churn** between A and B. | B's needs (time objects, eras) are designed now (§ 4) and the state shape reserves `time`; ADR 0014 records the API before A1. |
| **Save compatibility** across content updates. | Append-only ids, `contentVersion` + pure content migrations, tested with saves from every released content version (fixtures). |

---

## 13. Open questions for the owner

Each with options and my recommendation (★).

| # | Question | Options | Recommendation |
|---|---|---|---|
| **Q1** | Art direction | (a) code-drawn vector dioramas + text layer; (b) text-first with small vignettes; (c) hand-made raster/pixel art (needs an artist or owner-provided art) | ★ (a): producible by agents without new licences, ~0.3 MB per adventure, accessible; the A1 slice decides whether it is good enough. |
| **Q2** | Length per adventure | (a) ~1.5 h (≈ 15 scenes, ~9 k words); (b) ~3 h (≈ 30 scenes, ~17 k words); (c) 5 h+ | ★ (b): "substantial" (spec) yet translatable; built region by region, so it can stop at (a) if play-tests say so. |
| **Q3** | Which adventure first | (a) A first, B reuses the proven engine (spec order); (b) B first (more distinctive); (c) both in parallel after the engine | ★ (a): the spec asks for it, and T1 builds on a stable core. |
| **Q4** | Sound and voice | (a) silent + optional read-aloud (speech synthesis); (b) (a) + Web Audio ambience/effects generated in code, off by default; (c) recorded voice/music | ★ (a) for v1, (b) as optional increment X1; (c) no (cost × 16 locales, licences). |
| **Q5** | Premises | A: (a) A1 *Drowned Archive*, (b) A2 *Unlit Beacons*; B: (a) B1 *Folded Station*, (b) B2 *Seed Vault Clock*; or own ideas | ★ A1 + B1: most varied regions/puzzle styles in A; three eras of one place make B's causality easiest to read. |
| **Q6** | Hints | (a) three tiers per goal, always available, counted only in the final summary; (b) no hints; (c) hints unlocked after some time | ★ (a); (c) would add a timer and waiting, which the product rules exclude. |
| **Q7** | Time flow in Adventure B | (a) beats: time moves only when you act or wait, optional "Play" presentation; (b) real time with pause; (c) real time only | ★ (a): no time pressure, exact puzzles, deterministic saves; (b)/(c) conflict with accessibility and "no timers for correctness". |
| **Q8** | Ownership of `packages/adventure-engine` | (a) a dedicated adventure workstream owns it (like the strategy engine, ADR 0009); (b) orchestrator owns it, the adventure agent proposes changes | ★ (a): engine and content evolve together; API changes still go through ADR 0014. Changes CLAUDE.md roles → needs your confirmation. |
| **Q9** | Names and ids | (a) final titles now, ids from titles; (b) neutral ids now (`adventure-a`, `temporal-adventure` as in the spec), titles before release after a name check | ★ (b): ids are permanent (saves, URLs); titles can wait for the premise decision and a trademark search. |
| **Q10** | Delivery | (a) bundled and precached like every game (~1 MB per adventure for all locales); (b) "Additional Adventure" download pack with size shown first (spec's PWA example) | ★ (a): small enough with vector art; (b) only if art (c) is chosen. |
| **Q11** | Failure | (a) no death and no dead ends (checker-proven); (b) death with instant retry at the last scene | ★ (a): nothing to lose, consistent with "closing must never punish"; danger stays in the fiction. |
