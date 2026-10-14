# Adventure engine and the two original adventures — design

Status: **Owner decisions recorded (2026-10-14)**; nothing implemented yet. This is the leading design document for roadmap milestone M8. It consolidates the adventure workstream's first draft and the orchestrator's draft (formerly `docs/design/adventure.md`, Q1–Q11), and records the owner's answers (section 0). Numbers marked *(calibrate)* are first estimates; the vertical slices confirm or correct them.

Scope:

- `packages/adventure-engine` (`@wp/adventure-engine`): shared, deterministic point-and-click engine (scenes, hotspots, inventory, items, combinations, dialogue, clues, flags/state, puzzle mechanisms, scene transitions, save/load, read-aloud/audio hooks, localization) and its **content checker**.
- Adventure A, game id **`adventure-a`** (`packages/games/adventure-a`): original historical dark-fantasy exploration.
- Adventure B, game id **`temporal-adventure`** (`packages/games/temporal-adventure`, the spec's example URL): original science-fiction adventure with time manipulation as the central puzzle system.

Binding inputs: implementation brief ("Point-and-click adventure framework", "Adventure A", "Adventure B", "Intellectual-property rule", "Universal resumability", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"); ADR 0002 (GameModule contract), 0006 (roles), 0009 (precedent: engine owned by its workstream), 0011 (per-locale content with `preload`).

**IP rule.** King's Quest VIII and TimeShift describe desired high-level experiences only: A takes "a mysterious, interconnected world explored region by region, with natural pauses between regions"; B takes "time manipulation as the core verb set". Nothing else is taken — no names, story, characters, places, lore, maps, art, sound, music, dialogue, items or layouts. Section 12 lists what we avoid in particular. All titles and names below are **working titles**; final titles come after a name/trademark check (Q9).

---

## 0. Owner decisions (2026-10-14)

| # | Topic | Decision | Consequence in this design |
|---|---|---|---|
| Q1 | Art | Start with **code-drawn vector graphics** (SVG); the owner reviews them. A later switch to agent-generated images may become necessary → **art layer must be swappable**. | § 7: `ArtProvider` interface; hotspot geometry lives in the structure, never in the art. |
| Q2 | Length | **≈ 3 h per adventure**, expandable later; **natural pauses** between regions/worlds. | § 10: 4–5 chapters per adventure, one region each, chapter screen as stopping point. |
| Q3 | Order | **A first**, B reuses the proven engine. | § 11 increments. |
| Q4 | Sound | **Silent + optional read-aloud** (speech synthesis). Generated ambience/effects later as an option, **off by default**. No recorded voice or music. | § 7.3. |
| Q5 | Stories | A: **historical fantasy** with **a village, an underworld**, etc. B: **sci-fi, preferably a (space) station**, **few long-term time travels**, **many short time effects** during play (delay, slow down, reverse); a **historical location on Earth** would be interesting. | § 10.1 premise A, § 10.2 premise B (two options for the Earth location, one open point). |
| Q6 | Hints | **Three tiers per goal, always available**, counted **only in the end summary**. | § 6.3. |
| Q7 | Time in B | Like classic point-and-click: **moving between environments, time does not run**. **Big time jumps happen through the story.** Short time manipulations happen **inside environments** (a room is a sub-minigame where time runs depending on your actions, in different directions and speeds). On failure: **reset, or leave and re-enter**, until the goal is reached; then the goal is saved and the room shows its finished state or a new task. | § 9: *time rooms* — closed, resettable puzzles; global time stands still; eras change only via story beats. |
| Q8 | Ownership | The **adventure workstream owns the engine and both adventures**; the orchestrator reviews PRs. | ADR 0014 (with E0) + CLAUDE.md role line, like ADR 0009. |
| Q9 | Ids/names | **Neutral ids now** (`adventure-a`, `temporal-adventure`), titles later after a name check. | Package dirs = ids (CLAUDE.md convention). |
| Q10 | Delivery | **Bundled and precached** at first; separate download later only if too large. | Per-locale text chunks via ADR 0011; budgets § 4.2. |
| Q11 | Failure | **No death, no dead ends**, proven by a content checker. | § 8.3. |

Remaining open points (do not block the engine work): see section 13.

---

## 1. Goals, non-goals and honesty

Goals, in priority order:

1. **Thinking is the progress mechanism**: observing, deducing, combining, planning and — in B — causal/temporal reasoning. Never reflexes, grinding, luck or pixel hunting.
2. **Fair and provably completable**: every adventure is machine-checked to be winnable, free of dead ends from every reachable state, and fair (clues obtainable before they are needed).
3. **Closable at every action, resumable exactly**: saves are plain JSON logical state written after every action; logic never depends on wall-clock time.
4. **One engine, two adventures**: B adds a time module, not a second engine.
5. **Fully playable as text**: screen reader + keyboard can finish both adventures (tested end to end).
6. **Finite and calm**: an ending, chapters with natural stopping points, no reason to return once finished.

Non-goals: combat (danger is solved by thinking), death or game-over, real-time sequences, collectibles for their own sake, completion percentages, achievements, procedural stories, LLM-driven characters, recorded voice/music, a generic undo, an in-app editor.

**Honest claims** (product rule): the catalogue text says "an adventure to explore and puzzle through — practice in noticing details and reasoning about causes; active leisure", never "improves your brain". Metadata: A `skills: ['deduction', 'spatial', 'planning']`, B `['systems', 'planning', 'deduction', 'hypothesis']`; `typicalMinutes: [15, 45]` per sitting; the rules text states the total length (≈ 3 h).

---

## 2. Player experience and core loop

```text
LOOK    read the scene (picture + text), examine hotspots                 never costs anything
THINK   journal: open questions, clues, people, places, conversation log  never costs anything
ACT     examine · take · use · use item on · combine items · deduce (clue + clue) · talk/present · go
        B, inside time rooms: apply a time power to a marked object · wait · reset room
RESULT  the world answers with text (+ picture change); clues land in the journal
```

- **Select-then-act**: tapping a hotspot opens a small menu with only the verbs that apply now (*Examine*, *Take*, *Use*, *Talk*, *Go*) and, when an item is selected, *Use ⟨item⟩ here* first. No verb bar, no exhaustive "use X on Y" matrices.
- **Refusals explain** ("The rope is too short to reach the ledge.") or use a varied generic line; trying never costs anything.
- **No pixel hunting**: a *Show interactive places* toggle outlines every visible hotspot; the hotspot list (§ 6) always lists them.
- **Map travel** between visited places — no walking chores.
- **Chapters** (Q2): each region ends with a calm chapter screen ("Chapter 2 complete — continue or stop here"); continuing is a button, never automatic. `finished({ outcome: 'completed', stats })` fires once at the true ending; stats are factual (hints used, optional discoveries found, actions), never a grade.

---

## 3. Engine model (`@wp/adventure-engine`)

### 3.1 Layers and key rule

```text
packages/adventure-engine/src/
  content/     content types (Adventure, Scene, Hotspot, Item, Dialogue, Clue, Mechanism, TimeRoom…)  data only
  logic/       conditions, effects, step(), available(), refusals, goals/hints, journal               pure
  mechanisms/  reusable puzzle widgets: rules + solver + text description per kind                    pure
  time/        time rooms, time objects, powers, histories, eras (Adventure B)                        pure
  state/       AdventureState, isValidState(), migrations, canonicalJson, stateHash                  pure
  check/       static checks, independent interpreter, state-space explorer, report            tests only
  view/        scene renderer + ArtProvider, hotspot list, menus, inventory, dialogue, journal,
               map, hints, chapter screen, read-aloud                                                 DOM
  define.ts    defineAdventureGame(structure, content, art) → GameModule
```

Depends only on `@wp/game-core` and `@wp/ui`; no third-party dependencies. Each adventure is a normal game package; `defineAdventureGame` returns a standard `GameModule` (with ADR 0011 `preload`), so shell, persistence, contract suite and e2e helper need no adventure-specific changes.

**Key rule: `available(content, state)` is the single source of truth** for what the player can do. The view renders exactly these actions; the checker and the fuzzers explore exactly these actions. What the checker can solve, the UI can solve.

### 3.2 Content model: structure (no strings) + text (per locale)

```ts
interface Adventure {
  id: string; contentVersion: number;
  start: { scene: SceneId; era?: EraId; items?: ItemId[]; flags?: Record<FlagId, number> };
  flags: Record<FlagId, { max: number }>;               // bounded integers, 0 = initial
  scenes: Scene[]; items: Item[]; combinations: Combination[];
  clues: Clue[]; deductions: Deduction[]; dialogues: Dialogue[];
  mechanisms: MechanismDef[]; goals: Goal[]; chapters: Chapter[]; endings: Ending[];
  time?: TimeContent;                                    // Adventure B only (§ 9)
}
interface Scene {
  id: SceneId; region: RegionId; art: ArtRef;            // art is resolved by the ArtProvider (§ 7)
  hotspots: Hotspot[];                                   // exits are hotspots with a `go` effect
  variants?: { when: Cond; art?: ArtRef }[];             // state-dependent picture
  onEnter?: Rule[]; timeRoom?: TimeRoomId;               // B: entering starts the room puzzle
}
interface Hotspot {
  id: HotspotId; order: number;                          // authored reading order (hotspot list, Tab)
  shape: Rect | Polygon;                                 // scene units, viewBox 1600 × 900
  visible?: Cond; interactions: Interaction[];
}
interface Interaction { verb: 'examine' | 'take' | 'use' | 'talk' | { item: ItemId }; rules: Rule[] }
interface Rule { when?: Cond; then: Effect[]; text: TextId }   // first matching rule wins, else refusal
```

**Text ids are derived from the structure** (`scene.<id>.desc`, `hs.<scene>.<hs>.name|desc|<verb>.<n>`, `item.<id>.name|desc`, `clue.<id>`, `dlg.<id>.<node>`, `goal.<id>.title|hint.1-3`, …). The checker derives the complete key set, so a missing translation is a test failure. The structure never contains user-visible strings.

### 3.3 Conditions and effects — a small closed language

Puzzle logic is **data, not code**, so the checker can explore it and translators never touch it.

```ts
type Cond =
  | { all: Cond[] } | { any: Cond[] } | { not: Cond }
  | { flag: FlagId; eq?: number; gte?: number; lte?: number }
  | { has: ItemId } | { knows: ClueId } | { visited: SceneId } | { mech: MechId; solved: true }
  | { era: EraId } | { room: TimeRoomId; solved: true };              // B

type Effect =
  | { set: FlagId; to: number } | { add: FlagId; by: number }        // clamped to the declared range
  | { give: ItemId } | { take: ItemId } | { learn: ClueId }
  | { go: SceneId } | { dialogue: DialogueId } | { goalDone: GoalId }
  | { chapterEnd: ChapterId } | { end: EndingId }
  | { travel: EraId } | { grantPower: PowerId };                      // B: story-driven only
```

No arithmetic beyond bounded add, no loops, no string flags. Anything richer is a **mechanism** (§ 3.6).

### 3.4 Actions and `step`

```ts
type Action =
  | { a: 'examine' | 'take' | 'use' | 'talk'; hs: HotspotId }
  | { a: 'useItem'; item: ItemId; hs: HotspotId } | { a: 'combine'; x: ItemId; y: ItemId }
  | { a: 'deduce'; x: ClueId; y: ClueId } | { a: 'present'; what: ClueId | ItemId; hs: HotspotId }
  | { a: 'choose'; option: string } | { a: 'go'; scene: SceneId }
  | { a: 'select'; item: ItemId | null } | { a: 'hint'; goal: GoalId }
  | { a: 'mech'; mech: MechId; move: MechMove }
  | { a: 'power'; power: PowerId; obj: ObjId; k?: number } | { a: 'release'; obj: ObjId }   // B, in rooms
  | { a: 'wait'; beats: number } | { a: 'resetRoom' };                                     // B, in rooms

step(content, state, action): { state: AdventureState; out: Outcome }   // pure, never throws
// Outcome = { ok: true; text: TextId[]; changes: Change[] } | { ok: false; refusal: RefusalReason; text: TextId }
```

Order inside `step`: validate against `available` (invalid → refusal, **state unchanged**) → effects of the first matching rule in order → `onEnter` rules of a newly entered scene → B: time-room step (§ 9.3) → goal/chapter/ending evaluation. The view renders the outcome, then calls `requestSave()`; `finished` fires exactly once at an ending.

### 3.5 Items, dialogue, clues and deductions

- **Items** exist exactly once: in the world, in the inventory (ordered by pickup, stable for screen readers) or consumed. No weight or slot limit. Item states (lamp lit) are flags `item.<id>.*`.
- **Combinations** are explicit and unordered (`x+y ≡ y+x`, property-tested); anything not listed refuses politely.
- **Topic-based dialogue** rather than deep trees: talking opens topics; options can *ask about* known clues or *present* items/clues ("show the torn ledger"). What you know changes what you can ask — this is how NPC clue chains work. Every line stays readable in the journal's conversation log (last 50 lines).
- **Clues** are first-class journal entries grouped by person, place and question. **Deductions** combine two clues into a conclusion (*the keeper's two shifts* + *the ledger's dates* → *nobody watched the gate on the flood night*); wrong pairs say "these do not connect", without penalty. This keeps NPC chains genuinely deductive and language-independent.

### 3.6 Mechanisms (reusable puzzle widgets)

Puzzles that do not fit flags are typed mechanisms with pure rules, an independent solver and an accessible text description:

| Kind | Rules | Solver | Planned use |
|---|---|---|---|
| `rings` | concentric rings of symbols, rotate one ring (some coupled) | BFS | locks, star charts |
| `network` | sluices on a directed graph of basins with integer levels | BFS | A: sluice works |
| `balance` | known and unknown weights on a beam | exhaustive (≤ 8) | weighing deductions |
| `sequence` | arrange/press k elements under stated rules | constraint enumeration | inscriptions, rites |
| `beam` | rotate mirrors on a small grid to light targets | BFS | A: beacons / lenses |
| `tiles` | slide/rotate tiles to complete a path | bounded BFS | reliefs, circuits |

- State: a small integer vector in `state.mech[id]`; moves are data; `solved` is a pure predicate; solving fires effects once. Every mechanism offers **reset** and has no losing state, so it cannot create a dead end.
- **Fair-clue rule**: a mechanism declares `needs: ClueId[]`; the checker proves those clues are obtainable before the mechanism is required (guessing stays possible, never necessary).
- Seeded puzzle parameters (e.g. a lock order drawn from the seed) are **not used in v1** — fixed puzzles keep hints and translations simple. The state reserves `params` so they can be added later; the checker would then verify every parameter value.
- Kinds are built when the first chapter needs them, not all upfront.

### 3.7 Goals, hints, journal

`Goal { id, chapter, active: Cond, done: Cond }` in story order. The journal shows open questions (active goals), clues, people, places and the conversation log; on resume a short "previously" recap (current goal + last three outcomes) appears.

---

## 4. Localization and text

### 4.1 Where text lives (ADR 0011)

| Namespace | Content | Loaded |
|---|---|---|
| `metadata.messages` | `title`, `tagline`, `rules`, verbs, panel labels, generic refusals, chapter screen, summary | with the catalogue (small, ~80 keys, 16 locales) |
| `src/content/<locale>.ts` | all scene/hotspot/item/clue/dialogue/goal/hint texts | per locale through `preload` → `createLocaleContent` (ADR 0011) |
| `src/glossary.ts` | fixed names of people and places per locale + translator notes | bundled (small) |

Saves contain ids only, so a game continues in another language. The UI language selects the content language (adventure text is UI-language text, not learning content).

### 4.2 Text volume and budgets *(calibrate)*

Per adventure (≈ 3 h): 25–32 scenes, ~170 hotspots, ~30 items, ~60 clues. English words: **target 10–12 k, hard cap 14 k** (asserted by a test on the `en` catalogue) — between the leaner first draft (7 k) and the orchestrator's estimate (17–18 k); the slice A1 calibrates words per minute of play. Means to stay lean: show rather than tell (pictorial clues), short looks, few but meaningful NPC lines, hints per goal rather than per state.

Sizes (calibration from Deep Read, ADR 0011): ~12 k words ≈ 75 kB raw / ~25 kB gzip for `en`, up to ~2.3× for Hindi. Budgets (CI-checked in the adventure's tests): engine + view ≤ 70 kB gzip; game code + structure + art ≤ 250 kB gzip; each locale chunk ≤ 80 kB gzip (else split per chapter). All locales of one adventure ≈ 1.5–2 MB raw precached — acceptable for Q10.

Translation load: ~24 k words × 15 locales ≈ 360 k words, AI-assisted per existing policy, flagged for native review (risk, § 14).

### 4.3 Writing rules (translation-safe; reviewed, partly checked)

1. **No concatenated sentences** ("You use {item} on {target}") — cases, gender and word order differ (de/ru/pl/uk cases, ar/hi agreement). Each response is an authored full sentence; generic refusals contain no item names.
2. **Protagonist without fixed name, gender or portrait**; second person in present tense or impersonal forms (past-tense second person is gendered in ru/pl/uk/hi; Arabic second person is gendered). Translator notes where ambiguity remains.
3. **No language-dependent puzzles**: no wordplay, rhymes, anagrams, letter counts, alphabetical order. Inscriptions use an invented pictogram set; numbers as digits or tally marks. Puzzle logic never depends on translated strings.
4. **RTL**: scene pictures are **not mirrored** (they depict a world and spatial puzzles depend on them); only panels mirror. Texts refer to landmarks ("the door beneath the bell"), not left/right.
5. Names come from `glossary.ts`, invented to be pronounceable in all scripts.
6. Every placeholder appears in every locale (existing audit).

---

## 5. State, saves, determinism

### 5.1 State shape (plain JSON)

```ts
interface AdventureState {
  v: number;                           // engine state version (= metadata.stateVersion)
  content: number;                     // contentVersion the save was written with
  seed: number; params: Record<string, number>;      // params unused in v1 (§ 3.6)
  scene: SceneId; selected: ItemId | null;
  flags: Record<FlagId, number>;       // non-zero only
  items: ItemId[]; consumed: ItemId[]; clues: ClueId[]; visited: SceneId[]; goalsDone: GoalId[];
  mech: Record<MechId, number[]>; openMech: MechId | null;
  dialogue: { id: DialogueId; node: string } | null;
  hints: Record<GoalId, 1 | 2 | 3>;    // tiers revealed — only shown in the end summary
  log: LogLine[];                      // last 50 outcome/dialogue lines (display only)
  actions: number; recent: Action[];   // action count + last 200 actions (bug reports)
  chapter: ChapterId; ended: EndingId | null;
  time?: {                             // Adventure B only
    era: EraId; powers: PowerId[]; roomsSolved: TimeRoomId[];
    room: null | {                     // present only while inside a time room
      id: TimeRoomId; stage: number; beat: number;
      objects: Record<ObjId, number>;  // integer state per time object
      effects: { obj: ObjId; power: 'hold' | 'slow' | 'fast' }[];
      history: Record<ObjId, number[]>;// ≤ 24 entries each
    };
  };
}
```

Size: ≤ 12 kB (A), ≤ 16 kB (B), hard caps on every array, asserted. Resuming restores exactly the open dialogue node, the open mechanism, the selected item and an in-progress time room.

### 5.2 Versioning and content updates

- `stateVersion` + `migrateState` as usual (ADR 0002).
- **Content ids are append-only** (never renamed, removed or repurposed after release). Incompatible content changes ship pure `contentMigrations[from]`; migration fixtures from every released content version are tested. `isValidState` checks structure against the bundled structure (every id known, flags in range, items unique, arrays within caps, room consistent) — synchronous, never throws, fuzzed by the contract suite.

### 5.3 Determinism and properties (fast-check over random `available()` walks)

| # | Property |
|---|---|
| P1 | Same content + seed + actions ⇒ same `stateHash` (FNV-1a over canonical JSON, as in the strategy engine). |
| P2 | `step` never mutates its inputs. |
| P3 | For any prefix: `restore(JSON round-trip)` then the rest ⇒ same hash as uninterrupted. |
| P4 | Any action, also invalid/random, returns an outcome and never throws; a refusal leaves the state unchanged. |
| P5 | Every reachable state passes `isValidState`; `isValidState(junk)` never throws. |
| P6 | Item conservation: each item is in exactly one place (world, inventory, consumed). |
| P7 | `combine` and `deduce` are symmetric. |
| P8 | Examine/journal/hint/select/map actions never change world state (only `hints`, `log`, `selected`). |
| P9 | B: a held object's state is unchanged by any number of beats. |
| P10 | B: for an isolated object, `fast` for 1 beat ≡ normal for 4; `slow` for 2 ≡ normal for 1. |
| P11 | B: if nothing acted on X for k ≤ 24 beats, `rewind(X, k)` restores X's exact state k beats ago and changes nothing else. |
| P12 | B: leaving a room or `resetRoom` restores the room's entry state (stage kept); global state is untouched by room-internal actions until the room is solved. |
| P13 | B: no action in era *e* changes anything derived for an earlier era. |
| P14 | Bounds: every array within its cap; serialized size ≤ 32 kB. |

No `Math.random`, no `Date`, no floats in logic.

---

## 6. Controls and accessibility

- **Dual representation**: every scene renders the picture *and* a structured text view (scene description, hotspot list in authored order, exits, selected item, time-object states). The list alone suffices to finish the adventure; e2e plays the slices keyboard-only through it.
- **Pointer**: click hotspot → verb menu. **Touch**: first tap shows name + verbs, second confirms (no accidental actions, no hover dependence); no drag-only interactions. **Keyboard**: Tab/Shift+Tab through hotspots in reading order, arrows move spatially, Enter opens verbs, `I`/`J`/`M`/`H` inventory/journal/map/hints, `R` reveal, Esc closes; shortcuts listed in help, never required.
- **Targets ≥ 44 CSS px**: the scene renders at ≥ 640 CSS px width (narrower viewports pan, as Relay Command's map); hence padded hit areas ≥ 110 × 110 scene units and non-overlapping — enforced by the checker.
- **Screen readers**: `aria-live` announces each outcome once; the picture is `role="img"` labelled with the scene description; dialogue options are a real list; mechanisms render their text description as labelled controls ("Ring 2 of 3: shows the heron pictogram. Turn forward / back").
- **No colour-only information**: states are named in text and drawn with shape/pattern changes; time powers use distinct glyphs (hold ‖, slow ◁, fast ≫, rewind ↺) plus words; eras have a badge with name and glyph.
- **Reduced motion**: no animated transitions; state changes are instant swaps with a brief outline highlight; B's optional auto-run (§ 9.3) is not offered.
- **Honest limitation** (spec): spatial puzzles (sightlines, beams) are described on a small labelled grid — operable without sight, but harder. The rules text says so.

### 6.3 Hints (Q6)

Per active goal three tiers — (1) where to look, (2) which rule/mechanism matters, (3) the concrete next step — always available, no cost, no timer, no confirmation shaming. The hint panel offers the earliest active goals. Hints used are recorded and shown **only in the end summary**. The checker verifies that every reachable non-final state has an active goal with hints and that tier 3 names an action on a shortest path to that goal.

---

## 7. Art, read-aloud and audio

### 7.1 Code-drawn vector dioramas (Q1)

Each scene is SVG built from TypeScript data: 3–5 depth layers of flat shapes, a restricted palette per region/era (tokens, so high-contrast/forced-colour themes work), procedural detail (hatching, stone/wood patterns, fog bands, light shafts) from a shared primitive kit (`arch`, `stair`, `column`, `waterPlane`, `gear`, `lever`, `door`, `tree`, `ruinWall`, `console`, `pipe`, `fogBand`, `figure`, …). Style for A: silhouettes, fog, candle-light gradients; for B: clean technical line art that shows process states clearly. Budget ≤ 400 nodes per scene, ~6–12 kB gzip; at most one blur layer, dropped under reduced motion. Motion only illustrates logical state changes; logic never waits for animation.

### 7.2 Swappable art layer

```ts
interface ArtProvider {
  render(ref: ArtRef, view: SceneView): SVGElement | HTMLElement;   // SceneView: scene id, variant, era, room stage, object states
}
```

- **Hotspot geometry, reading order and all logic live in the structure**, never in the art. The renderer draws the art, then overlays focusable hotspot shapes from the structure. Replacing the art therefore touches no logic, no saves and no texts.
- v1: `svgArtProvider` (code-drawn). A later `imageArtProvider` would map `ArtRef` → raster image plus per-state overlays; the checker keeps validating hotspot geometry against the 1600 × 900 viewBox. Prerequisites for raster art: **licence/provenance review** of generated images (`docs/third-party.md`), precache globs for `webp`/`avif` (orchestrator, PWA config) and the budget check (Q10's separate download if too large).
- The owner reviews the art at the A1 slice; if it does not reach the bar, the provider switch is the fallback.

### 7.3 Read-aloud and audio (Q4)

- v1 is silent. **Read aloud** (optional toggle): outcome texts and scene descriptions are spoken through browser speech synthesis in the UI locale, best effort (voices vary by device), stopped on `pause()`/`dispose()`; same approach as Memory.
- The engine emits `cue` events (door, water, ambience per region); later an optional Web-Audio adapter can synthesise ambience/effects in code (no files, no licences), **off by default**, with volume control. No puzzle depends on sound; every cue has a text/visual equivalent.

---

## 8. Test strategy

### 8.1 Unit (TDD)

Condition operators, every effect kind and range clamp, rule order and refusals, combinations, dialogue conditions, deductions, goals/hints, chapter ends, `onEnter`, each mechanism kind, B: every time-object process kind, scales, hold rigidity, rewind and history truncation, capacity, room reset/leave, stages, story era travel, derivations.

### 8.2 Property tests

P1–P14 (§ 5.3) on fixture adventures and on the real adventures.

### 8.3 Content checker (`@wp/adventure-engine/check`, runs as a test per adventure)

**Static**: referential integrity and uniqueness; every derived text key in all 16 locales with matching placeholders and no unused keys; word cap; every hotspot named and described; every item obtainable and used (unless marked keepsake); flags written and read; hit areas inside the viewBox, ≥ 110 units, non-overlapping; mechanism and time-room definitions total and consistent; dialogue nodes reachable with an exit path.

**Dynamic** — breadth-first over the abstract state (scene, era, flags, items, clues, mechanism-solved bits, rooms-solved bits); mechanism internals and time-room internals are replaced by their own solvers' verdicts:

1. **Completable**: an ending is reachable from the start.
2. **No dead ends**: from every reachable state an ending is reachable (reverse reachability). A failure prints the shortest path into the dead end.
3. **Coverage**: every scene, interaction, item, clue, deduction, mechanism, time room and optional discovery is reachable.
4. **Fair clues**: a mechanism's `needs` are obtainable before its solution is required.
5. **Hint correctness** (§ 6.3).
6. **Time rooms** (B): each room is solvable from its entry state for every global context in which it can be entered; every in-room state can still reach the goal or reset (reset always exists).
7. **Metrics** for review (not pass/fail): shortest solution per chapter, open goals over time, B: distinct powers on each room's shortest solution.
8. **Budgets**: ≤ 2 M abstract states per adventure, ≤ 200 k per time room — exceeding fails; it also signals a puzzle too complex to understand.

**Independence** (spec: no generator validating itself): the checker uses its own minimal interpreter (`check/interpret.ts`) that does not import `logic/`; a property test asserts both agree on `available()` and resulting abstract states for random walks; the checker's shortest solution is replayed through the real `step`; a hand-written golden walkthrough is replayed (end hash pinned). Each mechanism solver is cross-checked against an exhaustive oracle.

### 8.4 Contract, E2E, mutation, size

- `runGameContract` per adventure (16 locales with `preload`, resume, pause, reset, dispose, junk rejection).
- `e2e/games/<id>.spec.ts`: the slice played keyboard-only through the hotspot list and once by pointer; `expectResumeAfterReload` mid-dialogue, mid-mechanism, with a selected item and (B) mid-time-room; phone and desktop viewports; offline continuation in a second locale; Arabic RTL smoke; reduced motion. Full playthroughs run on demand/nightly if they exceed the CI budget.
- Stryker on `adventure-engine/src/{logic,mechanisms,time,state}` and `check/`, target ≥ 75 % (repo break threshold 65 %); views excluded.
- Chunk budgets (§ 4.2) asserted from the build output.

---

## 9. Time model (Adventure B) — time rooms

Owner decision Q7 shapes the model: **outside time rooms, time does not run**; **eras change only through story beats**; **short time manipulations are closed puzzles inside rooms**, resettable until solved.

### 9.1 Three levels of time

| Level | What | Who controls it |
|---|---|---|
| **Global** | no running time; navigating, talking, examining, inventory, journal never advance anything | — |
| **Era** (long-term travel) | 2–3 eras of the same places; travel happens **only through story beats** (`travel` effect at chapter turns), at most ~4 times per playthrough | story |
| **Room** (short-term) | inside a *time room*, time objects run in **beats**; the player holds, slows, hastens and rewinds marked objects | player |

### 9.2 Time rooms

- A scene may declare a `timeRoom`. Entering it starts the room from its **entry state** (or resumes the saved in-progress room). Inside, the room is a self-contained minigame: time objects, marked hotspots, a goal condition, optionally several **stages** (stage 2 is a new task in the same room after stage 1 is solved).
- **Failure is harmless**: e.g. the shutter closed before you got through. The room says so and offers **Reset room**; **leaving and re-entering** resets it too (owner Q7). There is no harm to the player and no global consequence.
- **Solving** sets the room's solved bit (and stage), applies its effects to the global state (items, clues, flags, opened exits) and from then on the room shows its **finished state** or its next stage. Solved stages never reset.
- This is not a generic undo: reset only affects the current room's time objects, and rewind (below) is a puzzle power under explicit rules.

### 9.3 Beats inside rooms

- Time inside a room is an integer **beat** counter that advances **only through the player's actions**: physical actions (take, use, use item, power) cost 1 beat; `wait(n)` costs n (1 ≤ n ≤ 24); examining, reading, journal, inventory, hints and releasing a power cost 0. Reading is never under pressure.
- Optional **auto-run** presentation (button "Let time run"): dispatches `wait(1)` at a steady pace for atmosphere; off by default, stops on any input, `pause()` and `visibilitychange`; not offered under reduced motion; nothing requires it (§ 13, O2).
- Integer scales, sub-steps per beat: **held 0, slow 1, normal 2, fast 8** (slow ×½, fast ×4); no floats, so `fast(1) ≡ normal(4)` exactly.
- Fixed order within one beat: (1) apply the action (effects, powers, releases) → (2) advance every non-held time object in id order by its sub-steps → (3) evaluate room rules to a bounded fixpoint (≤ 8 rounds; content that does not settle fails the checker) → (4) check room goal / failure → (5) push rewindable objects' states to their history.

### 9.4 Time objects and powers

```ts
interface TimeObject {
  id: ObjId; hs: HotspotId;                         // its hotspot, marked with a visible glyph
  process: 'cycle' | 'counter' | 'mover' | 'door' | 'growth' | 'reaction';
  states: string[];                                 // named states → text + picture
  next: TransitionTable;                            // state × sub-step → state; deterministic, total
  rest?: number[];                                  // resting states (targets of hasten/rewind)
  holdable: boolean; scalable: boolean; rewindable: boolean;
  trigger?: Cond;                                   // e.g. starts closing when the plate is released
}
```

Powers are granted by the story one at a time (hold → slow → hasten → rewind; combined in the last chapters). The **device rules** are shown in-game on one card and are the only time rules:

| # | Rule |
|---|---|
| T1 | Only **marked** objects react (glyph + the word "marked" in the description). People and you are never affected. |
| T2 | **Hold** (pause/delay): the object's process stops and it becomes rigid — a held piston blocks, a held door stays open. You can still take its loose parts or place things on it. |
| T3 | **Slow / Hasten**: the object runs at ½× / 4× (some objects say "up to 16×"). |
| T4 | **Rewind k**: the object returns to the exact state it had k beats ago, within what the device remembers *in this room* (24 beats, shown as a row of frames). A broken object can be rewound to whole if it broke within memory. Items you carry are never pulled back. A rewind into a place where something solid now is, is refused. |
| T5 | **Capacity**: at most N effects at once (N = 1 at first, 2 later, 3 in the last chapter, granted by the story; no recharge, no cost). Releasing is free. |
| T6 | **Locality**: powers work only inside time rooms; leaving a room ends its effects and clears its memory. |
| T7 | **Eras**: changes flow only **forward** in time: what was done in an earlier era shows in later ones, never the reverse. You carry items and knowledge across eras. |
| T8 | **Safety**: you are never harmed; an action that would harm you is refused with the reason. |

T5 is a puzzle constraint (like a boat's capacity in River Crossing), not an energy system.

### 9.5 Rewind representation

Per-object state ring: each rewindable object keeps its last **24** integer states (one per beat), pushed in step 5, cleared on leaving/reset. Rewind k sets the state to `history[now − k]` and truncates the ring there. Exact, O(1), bounded (≤ 12 rewindable objects × 24 ints per room). Rejected alternatives: global per-beat snapshots (a generic undo in disguise, large saves); event log with inverse transitions (merges like "intact + impact → broken" are not invertible).

### 9.6 Eras and forward causality (few, story-driven)

- A location may exist in 2–3 eras; `(location, era) → scene`. The story moves the player between eras at chapter turns; the player cannot travel freely (Q5/Q7: "few long-term time travels").
- Era links are **derived facts**: a later-era condition is computed from stored facts of earlier eras (`planted seedling in era 1` ⇒ `root bridge in era 3`). The validator rejects backward links and cycles and any link that could remove the player's location or an anchored item. Because travel is story-driven, the checker can enumerate the few era transitions exhaustively.
- Information travel (observe an event in the past, use the knowledge later) is ordinary `learn`.

### 9.7 Example time-room puzzles (original, illustrative)

1. **Fan duct (hold)**: a marked fan cycles through 4 phases, one beat each; only phase 2 leaves a gap. Hold it at phase 2 → crawl through. Held at 0 it blocks; release, wait, hold again.
2. **Security shutter (slow)**: releasing a pressure plate starts a shutter that closes in 2 beats; you need 3 actions (step off, take the sample, pass). Slow it → 4 beats. Failure → reset room.
3. **Battery and vine (hasten + rewind)**: a cell charges over 6 phases — hasten to charged. A seedling grows seed → sprout → vine (rest) → withered (rest): hastening twice overshoots; rewind returns it to *vine*.
4. **Projector lens (targeted rewind)**: rewinding the shattered lens makes it whole; rewinding the projector housing would also re-lock its cover (its history contains *locked*). Teaches: choose the target.
5. **Era link (story travel)**: in the earlier era, plant a seedling in the planter (room stage); after the story jump, its roots have cracked a sealed floor → new route.
6. **Combined (late chapter, spec example)**: rewind the broken lift mechanism to intact → hold it at the top (slot 1) → take the counterweight block from the rigid cage → hasten the resin vat until it sets into a wedge (slot 2) → wedge under the rails → release the hold → the cage stops level with the gallery.

---

## 10. The two adventures

Common: unnamed, ungendered protagonist; no combat; eerie and melancholic, no gore (≈ 12+); 4–5 chapters ≈ one region each, ≈ 35–45 min per chapter, chapter screen between them (Q2); optional discoveries add understanding, shown without counters during play and as a number in the summary only.

### 10.1 Adventure A — historical dark fantasy: *The Drowned Archive* (working title)

- **Setting**: a fictional valley in a pre-industrial, historical-feeling world. A century ago the valley was flooded on purpose to bury a monastery-library and the lower town. A dry summer lowers the reservoir, exposing terraces, sluice works, the archive's upper floors — and the way down into the **Undercroft**, the drowned under-city beneath the lake, where the town's echoes linger (the *underworld* of Q5: a place of memories, not a realm of the dead from any reference).
- **Protagonist**: a surveyor's apprentice sent to map the exposed ruins before the water returns (no fighter, no chosen one).
- **Core mystery**: who ordered the flooding, and why the sluice keepers' families still guard a gate that no longer holds water. Two endings in the last chapter (restore the water balance or let the lowest district drown to save the archive's heart), both reachable, neither "bad".
- **Chapters / regions and puzzle styles**:
  1. *Lakeside village* (prologue + chapter 1) — dialogue clue chains, testimony, item combinations.
  2. *Sluice works* — systems (`network`): basin levels change what is reachable in three places at once.
  3. *The archive* — deduction: catalogue and shelf-mark system from damaged index cards (pictograms).
  4. *The Undercroft* (underworld) — spatial: sightlines, reliefs (`beam`/`tiles`), echoes that replay a past night as clues.
  5. *The counterweight heart* (finale) — combines levels, light and the archive's knowledge.
- **Sample puzzles**: (1) *Draining order* — open/close sluices so the reading room drains without flooding the stair needed later; gate pictograms explained by a keeper's tally board in the village. (2) *Shelf marks* — infer the numbering rule from three partial index cards, find the book whose mark was scratched out. (3) *Three towers* — bearings from three bell towers (three scenes) intersect at the buried vault.
- **Scope**: 26–30 scenes, 20–24 puzzles (≈ 6 inventory/combination, 5 environmental/causal, 4–5 mechanisms, 3–4 dialogue/deduction, 2–3 cross-region), 3–5 optional discoveries, 10–12 k words, ≈ 3 h.

### 10.2 Adventure B — temporal science fiction: *The Folded Station* (working title)

- **Setting**: a research station in orbit, built to study "time shear". A failed calibration left it folded across eras of its own history. Around three story jumps lead to a **historical location on Earth** connected to the station's origin (open point O1):
  - **Option E1 (recommended)**: an 18th-century harbour town with a fictional clockmaker's workshop and observatory, where precise timekeeping for navigation was first worked out — thematically tied to the station's time instruments; mechanical clockwork makes beautiful hold/slow/rewind rooms; the station's founding blueprint traces back to the workshop's notebooks.
  - **Option E2**: a fictional Bronze-Age stone calendar site on a moor, whose solstice alignments the station's builders reused; strong atmosphere, but fewer mechanisms for time rooms.
- **Eras** (story-driven): *Station now* (damaged, dim) → *Earth, historical* (E1/E2) → *Station during construction* → *Station now* (changed by what you did). Forward causality only (T7).
- **Protagonist**: the station's maintenance technician, who wakes holding the calibration device ("the tuner", generic working name).
- **Core mystery**: why the safety interlock failed — a design flaw nobody reported, or deliberate? Answered by what you observe in the past, not told.
- **Chapters**: (1) station, *hold* and *slow* introduced in short rooms; (2) Earth location, *hasten* (clockwork, growth, curing); (3) station construction, *rewind*; (4) station now, combined rooms with capacity 2–3; (5) finale.
- **Scope**: ~7–8 locations × 1–3 eras ≈ 22–28 scenes, ~20–24 puzzles of which ~14–16 time rooms (many short time effects, Q5), 10–12 k words, ≈ 3 h.

---

## 11. Increments (one PR each, small, against `main`)

| # | Increment | Acceptance | Size |
|---|---|---|---|
| **E0** | This document + **ADR 0014** *Adventure engine API and ownership* (Proposed) + CLAUDE.md role line + ROADMAP M8 status; delete the superseded `docs/design/adventure.md` | docs review | S |
| **E1** | Engine core: content types, conditions/effects, `step`, `available`, items/combinations, dialogue, clues/deductions, goals/hints, chapters/endings, state + `isValidState` + hash, `defineAdventureGame` with `preload`; 3-scene fixture adventure | unit suite; P1–P8, P14; mutation ≥ 75 % on `logic/`; fixture walkthrough | M |
| **E2** | Checker: static checks, independent interpreter, BFS explorer (completable, no dead ends, coverage, fair clues, hints, budgets, metrics) | broken-fixture suite (one per failure reason); interpreter cross-check property; shortest-path replay | M |
| **E3** | View kit: renderer + `ArtProvider` + primitive kit, hotspot list, verb menu, inventory, dialogue, journal, map, hints, chapter screen, summary, read-aloud | jsdom view tests; roles/labels/focus order; target-size rule | M |
| **A1** | **Vertical slice of A**: 2–3 village scenes (pickup, combination, use-on, dialogue clue, one deduction, one small mechanism, transition), 16 locales, registry line + dependency, rules text | contract; checker green; golden walkthrough; e2e keyboard + pointer + resume (mid-dialogue, mid-mechanism) + offline locale; budgets; **owner reviews art** | M–L |
| A2–A5 | Chapters 1–4 of A (mechanism kinds added as needed, at most one new kind per PR) | checker incl. cross-region puzzles; walkthrough extended | L each |
| A6 | Finale, endings, summary, hint review, polish → Adventure A complete | full walkthrough; metrics reviewed; mutation re-run | M |
| T1 | Time module: time rooms, beats, objects, scales, powers, capacity, history/rewind, reset/leave, stages, story eras + derivations; checker extension | P9–P13; unit per rule T1–T8; broken time fixtures; room budgets | M–L |
| T2 | Time views: device panel, effect glyphs, rewind frames, room reset, era badge, optional auto-run | view tests; reduced motion; keyboard rewind | M |
| B1 | Vertical slice of B: 2–3 station scenes with hold and slow rooms | as A1, plus e2e reload mid-room | M–L |
| B2–B6 | Chapters and finale of B | checker: later rooms need ≥ 2 distinct powers | L each |
| X1 | *Optional*: Web-Audio ambience/effects in code, off by default | no puzzle depends on it; pause/dispose stop sound | S |

Every PR: tests in the same change, `pnpm check`, `pnpm build && pnpm e2e` (and `pnpm coverage` per the orchestrator's review gate), merged by the orchestrator after review with green CI.

Agent use (≤ 4 concurrent): engine/checker in this session; view kit and A1 content can run in parallel after E1; an independent QA agent reviews checker tests, mutation report and e2e per PR; translations as a batch task per chapter.

---

## 12. Intellectual-property guardrails

Deliberately avoided because they are characteristic of the references: masks or mask fragments as quest structure; a lone knight or kingdom-saving hero; townsfolk turned to stone; restoring a sun or a sun temple; a realm of the dead modelled on the reference's world; named realms/dimensions; armour or power suits granting time powers; an authoritarian alternate-history regime or occupied city; shooting or combat framing; any names, items, creatures or level layouts from either game. Each content PR is checked against this list; no reference title appears in shipped text.

---

## 13. Open points (none blocks E0–E3)

| # | Point | Options | Recommendation |
|---|---|---|---|
| O1 | Historical Earth location in B | E1 18th-century harbour town with clockmaker's workshop · E2 Bronze-Age stone calendar site · own idea | **E1** (clockwork suits time rooms; thematic link to precise timekeeping) — needed before B1 |
| O2 | "Time runs" inside rooms | beats only (time advances with your actions) + optional auto-run · real-time inside rooms | **beats + optional auto-run**: same feel of running time, no reflex pressure, exact saves; real time would contradict "never require timers for correctness" and accessibility. This is our reading of Q7 — please confirm. |
| O3 | Final titles | after premise lock-in and name check | before the first adventure leaves "preview" |

---

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Text volume (~24 k words × 16 locales) dominates effort; AI translation of narrative can read flat | word cap test, writing rules (§ 4.3), glossary, chapter-wise translation, native review listed in the ROADMAP |
| Code-drawn art misses the atmosphere | owner review at A1; swappable `ArtProvider` (§ 7.2) with licence-reviewed raster art as fallback |
| Checker state explosion | abstract states, solver verdicts for mechanisms and rooms, closed time rooms, budgets that double as complexity limits |
| Fair-but-obscure "adventure logic" | fair-clue rule, explaining refusals, deductions, three-tier hints, owner play-tests per chapter, metrics |
| Rewind perceived as undo / time rules arbitrary | eight rules on one card, marked objects only, room-local, one power introduced per chapter |
| Mobile usability with many hotspots | 640 px minimum scene width with pan, hotspot list as primary phone input, target-size check |
| Save compatibility across content updates | append-only ids, `contentVersion`, content migrations with fixtures |
| Engine API churn between A and B | B's needs designed now (§ 9), `time` reserved in state, API in ADR 0014 |
| IP proximity | § 12 checklist, name check (O3) |
