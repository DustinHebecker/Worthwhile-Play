# Adventure engine and the two original adventures — design (Phase 1)

Status: **Draft for owner decision** (2026-10-03). Nothing here is implemented yet.
Scope: roadmap milestone M8 — `packages/adventure-engine`, `packages/games/adventure-fantasy` (Adventure A), `packages/games/adventure-temporal` (Adventure B).
Binding inputs: implementation brief sections "Point-and-click adventure framework", "Adventure A", "Adventure B", "Intellectual-property rule", "Universal resumability", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"; ADRs 0001–0006.

All names below (titles, places, characters, devices) are **working titles** and original to this project. King's Quest VIII and TimeShift are used only as references for the broad experience ("mysterious, exploratory fantasy world with mechanisms"; "time manipulation as the core mechanic"). No name, story beat, character, location, item, layout, art, sound or UI element is taken from them. Section 12 lists the things we deliberately avoid because they are characteristic of the references.

Open decisions are collected in **section 11**; everything else is a proposal that follows from the spec unless the owner objects.

---

## 1. Design goals and non-goals

Goals, in priority order:

1. **Fair problem solving.** Progress comes from observation, deduction, combination and understanding explicit world rules — never from pixel hunting, guessing verb/object pairs, reflexes or luck.
2. **Provably completable.** Every shipped adventure is machine-verified to be winnable from the start and to contain **no dead ends** from any reachable state (section 8). This removes the classic genre frustration and makes "close at any time" safe: there is no state you can be stuck in.
3. **Resumable at every action.** Every player action is a complete logical state transition and is autosaved. Closing mid-dialogue, mid-puzzle or mid-scene-transition restores exactly that state.
4. **Accessible.** Fully playable with mouse, touch or keyboard; a complete text mode lets screen-reader users play without the graphics (section 6).
5. **Translatable.** 16 UI locales at release, with a deliberate text budget and writing rules that survive translation into languages with grammatical gender, cases and RTL (section 4).
6. **Cheap, original visuals.** A vector style that needs no large asset production and no third-party art (section 5).
7. **Reusable.** Adventure B reuses everything proven by Adventure A; temporal mechanics are an engine extension, not a fork.

Non-goals: combat systems, real-time pressure, character death, collectibles that pressure completion, procedural story generation, voice acting, a scripting language.

---

## 2. Engine architecture (`packages/adventure-engine`)

### 2.1 Layering

```text
content (data, per game)          engine (pure, DOM-free)                 view (DOM, shared)
──────────────────────            ──────────────────────────              ─────────────────────
scenes, hotspots, items,  ──►     validate(content)                ◄──    scene renderer (SVG)
recipes, dialogues,               initialState(content, seed)             text mode (a11y)
puzzle widgets, goals,            availableActions(content, state)  ──►   inventory bar, dialogue panel,
hints, processes (B),             step(content, state, action)            journal, hint panel, map
eras/causal links (B),              → { state, events }                   audio adapter (optional)
text keys                         solver / hint oracle (tests + hints)
```

Key rule: **`availableActions` is the single source of truth** for what the player can do. The UI renders exactly these actions and the solver explores exactly these actions. A puzzle the solver can solve is therefore solvable in the UI, and vice versa.

### 2.2 Proposed package layout

```text
packages/adventure-engine/
  src/
    model.ts         content types (Scene, Hotspot, Item, Recipe, Dialogue, Rule, Goal, Hint, Process, Era …)
    state.ts         AdventureState, isValidAdventureState (never throws), migrations
    conditions.ts    pure condition evaluation
    effects.ts       pure effect application
    actions.ts       availableActions(): the action enumerator
    step.ts          step(): reducer, emits events (text, sound cue, transition, solved, finished)
    dialogue.ts      dialogue graph traversal
    widgets/         puzzle-widget interface + generic widgets (dials, sliders, switch grid, routing, ordering)
    temporal.ts      processes, temporal powers, eras, causal propagation (used by Adventure B)
    validate.ts      static content validation (referential integrity, text keys, geometry, a11y)
    solver.ts        state-space exploration: winnable, no dead ends, coverage, metrics
    hints.ts         goal tracking + hint selection (backed by the solver's distance oracle)
    text.ts          content-text catalogues, lazy per-locale loading, audit helpers
    view/            renderer, text mode, inventory, dialogue, journal, hints, map, focus management
    define.ts        defineAdventureGame(content, options) → GameModule (wires everything to game-core)
  test/
packages/games/adventure-fantasy/   (content + scene art + messages; almost no code)
packages/games/adventure-temporal/  (content + scene art + messages; enables temporal.ts)
```

`defineAdventureGame` produces a normal `GameModule`, so the shell, persistence, contract tests and e2e helper need no adventure-specific changes.

### 2.3 Content model (simplified TypeScript)

```ts
type Id = string;                          // kebab-case, unique per kind
type TextKey = string;                     // key into the content text catalogue

interface Adventure {
  id: Id; contentVersion: number;
  start: { scene: Id; inventory?: Id[]; flags?: Record<Id, number> };
  flags: Record<Id, { initial: number; max: number }>;   // small integer domains (bool = max 1)
  items: Record<Id, Item>;
  recipes: Recipe[];                       // inventory combinations
  scenes: Record<Id, Scene>;
  dialogues: Record<Id, Dialogue>;
  widgets: Record<Id, WidgetInstance>;     // embedded puzzles
  goals: Goal[];                           // drive journal + hints
  ending: Condition;                       // natural end → finished({ outcome: 'completed' })
  temporal?: TemporalContent;              // Adventure B only
}

interface Scene {
  name: TextKey; description: TextKey;     // description doubles as the text-mode scene text
  art: Id;                                 // SVG scene component id
  region: Id;                              // for map + chapter grouping
  hotspots: Hotspot[];
  exits: Exit[];                           // exits are hotspots with a target scene
  variants?: { when: Condition; art?: Id; description?: TextKey }[];  // state-dependent look
}

interface Hotspot {
  id: Id; label: TextKey;                  // accessible name, also shown on focus/hover
  shape: Rect | Polygon;                   // in scene units (1600×900 reference canvas)
  visibleWhen?: Condition;
  look: Response;                          // always available, never changes state except "seen" flags
  interactions: Interaction[];             // use / take / talk / use-item, each guarded
}

interface Interaction {
  verb: 'use' | 'take' | 'talk' | 'useItem' | 'enter' | 'temporal';
  item?: Id;                               // for useItem
  power?: TemporalPower;                   // for temporal
  when?: Condition;
  effects: Effect[];
  response: TextKey;                       // full authored sentence (see 4.3)
}

type Condition =
  | { flag: Id; eq?: number; gte?: number; lte?: number }
  | { has: Id } | { inScene: Id } | { widgetSolved: Id }
  | { era: Id } | { process: Id; phase?: number; mode?: ProcessMode }
  | { all: Condition[] } | { any: Condition[] } | { not: Condition };

type Effect =
  | { setFlag: Id; value: number } | { addFlag: Id; delta: number }
  | { give: Id } | { consume: Id } | { goTo: Id }
  | { startDialogue: Id } | { journal: Id } | { cue: Id }   // audio/visual cue, no logic
  | { process: Id; set?: number; mode?: ProcessMode };

interface Recipe { inputs: [Id, Id]; output: Id[]; response: TextKey; when?: Condition }

interface Dialogue { nodes: Record<Id, { line: TextKey; speaker: Id; options: DialogueOption[] }> }
interface DialogueOption { text: TextKey; when?: Condition; effects?: Effect[]; next: Id | 'end' }

interface Goal { id: Id; title: TextKey; activeWhen: Condition; doneWhen: Condition; hints: [TextKey, TextKey, TextKey] }
```

Design choices behind the model:

- **Declarative only, no embedded functions.** Conditions and effects are data. This keeps content serializable, statically checkable and fully explorable by the solver. Anything that cannot be expressed declaratively becomes a puzzle widget (typed, unit-tested, with its own solver).
- **Small integer flags.** Flags are bounded integers (`max`), not free-form values. That bounds the state space and lets the solver enumerate it.
- **Items exist exactly once.** An item is in the world (attached to a hotspot via flags), in the inventory, or consumed. This invariant is property-tested.
- **Responses are whole sentences**, never assembled from fragments (section 4.3).
- **Content is authored as typed TypeScript data** (`satisfies Adventure`) and additionally validated at runtime (`validate.ts`) in tests. No schema library is needed (avoids a license review and a dependency); JSON export of content for tooling is possible because it is plain data.

### 2.4 Puzzle widgets

Some puzzles are better as a focused interactive panel than as hotspot logic: rotating dials, a switch grid, a light-routing board, ordering tiles, a lever bank. A widget is a small pure module:

```ts
interface Widget<P, S> {
  init(params: P, seed: number): S;
  actions(params: P, state: S): WidgetAction[];
  apply(params: P, state: S, action: WidgetAction): S;
  isSolved(params: P, state: S): boolean;
  describe(params: P, state: S): DescribedPart[];   // text-mode / screen-reader description, no colour-only data
  solve(params: P, state: S): WidgetAction[] | null; // independent solver (BFS/constraint), used by tests and hints
  isValid(value: unknown): value is S;
}
```

Every widget offers "reset" and has no losing states, so it cannot create a dead end. The adventure-level solver treats a widget as a macro action ("solve widget X") whose availability is tested separately: the widget's own test proves `solve()` succeeds from every reachable widget state (exhaustive for small spaces, fast-check sampling for larger ones).

### 2.5 Runtime state (what is saved)

```ts
interface AdventureState {
  v: 1;                         // engine state version
  content: number;              // contentVersion the state was created with
  seed: number;                 // only for seeded puzzle parameters (decision D10)
  scene: Id;
  inventory: Id[];              // ordered as acquired
  selectedItem: Id | null;      // UI selection is logical state too (resume restores it)
  flags: Record<Id, number>;    // only non-initial values stored
  widgets: Record<Id, unknown>; // widget states (validated by each widget's isValid)
  openWidget: Id | null;
  dialogue: { id: Id; node: Id } | null;
  visited: Id[];
  journal: Id[];
  hintsShown: Record<Id, 1 | 2 | 3>;   // per goal; never penalised
  temporal?: TemporalState;     // Adventure B: process phases/modes, holds, era, histories
  finished: boolean;
}
```

Typical size: 1–4 KB of JSON. No timers, no animation state. Restoring any saved state renders the same screen (open dialogue node, open widget, selected item included).

**Content updates vs old saves:** `content` is stored. `isValidState` checks that every referenced id exists in the current content. When content changes incompatibly, the game ships a migration (id renames, flag remaps) via `migrateState`; if migration is impossible, the host's existing "corrupt save" path applies — but the policy is to never ship such a change after release without a migration (tested with saved fixtures from each released content version).

### 2.6 Interaction model (presentation of actions)

Recommended (decision D6): **select-then-act**, no verb bar.

- Pointer/touch: tap a hotspot → a small action menu next to it lists only the actions that make sense now: *Look*, plus the hotspot's available interactions (*Take*, *Open*, *Talk*, *Use*). If an inventory item is selected, the menu offers *Use ⟨item⟩ here* first.
- Inventory: tap item → select; tap another item → *Combine*; tap a hotspot → *Use on …*. Long-press / secondary click → *Look at item*.
- Exits are hotspots with a direction glyph and a label ("To the bell tower"), never just "go left" (RTL and screen readers; section 6).
- **Hotspot reveal** toggle (button and `Space` held / toggled) outlines all hotspots. Not a hint, not counted, always available — pixel hunting is not a skill this project wants to exercise.
- Failed attempts get one short generic but polite response per verb ("That doesn't seem to do anything here."), plus authored specific responses for plausible-but-wrong ideas (these are where the clues live).

### 2.7 Audio hooks

The engine emits `cue` events (`door-open`, `water-rising`, ambience per region). The view passes them to an optional `AudioAdapter`. v1 recommendation (decision D9): **no audio required**, metadata `audio: 'optional'` once cues are wired; every cue has a visual/text equivalent (journal or status line), so no information is audio-only. The spec's future `packages/audio` can implement the adapter later.

---

## 3. State machine and turn model

Each call to `step(content, state, action)`:

1. Checks the action is in `availableActions(state)` (otherwise returns state unchanged + `invalid` event — never throws).
2. Applies the guarded interaction's effects in order.
3. Adventure B: advances world time by the action's tick cost (section 9.2) and runs causal propagation if the era changed.
4. Evaluates goals (journal entries), checks `ending`.
5. Returns `{ state, events }`; the view renders events, then calls `requestSave()`; on `ending` it calls `finished({ outcome: 'completed', stats: { actions, hintsUsed? } })` exactly once.

```text
            ┌──────────── look / inventory / journal / hint / map (0 ticks, no world change)
            ▼
  [Exploring] ──talk──► [Dialogue(node)] ──end──► [Exploring]
       │  ▲                                         
       │  └──close─── [Widget(open)] ◄──open── hotspot
       │                   │ solved → effects
       ├──exit──► [Exploring @ other scene]  (transition is instantaneous logically; animation optional)
       └──ending──► [Finished]  (calm end screen; no autoplay)
```

All five states are serializable; "Exploring with a selected item" is a state, not a transient UI detail.

---

## 4. Content format, localization and text budget

### 4.1 Where text lives

Finding from the current code: `metadata.messages` is **bundled with the shell catalogue** (`apps/web/src/registry.ts` imports `@wp/game-*/metadata` eagerly). Story text must not go there. Proposal:

| Namespace | Content | Loaded |
|---|---|---|
| `metadata.messages` (game namespace) | `title`, `tagline`, `rules`, plus adventure UI chrome (Look, Use, Inventory, Journal, Hint, Map, generic responses, "Loading…") | with the catalogue (small, ~60 keys) |
| content text catalogue | scene/hotspot/item/dialogue/journal/hint texts | lazily, **one chunk per locale** inside the game package (`content/text/<locale>.ts`) |

The content catalogue uses the same flat `key → string` format and `{placeholder}` syntax as existing catalogues, so the existing `auditCatalogues` checks (complete keys, identical placeholders, no extra keys) apply unchanged. The UI language selects the content catalogue (adventure text is UI-language text, not "learning content").

Per-locale lazy loading is compatible with the current synchronous contract: `newGame`/`restore` render the scene immediately using chrome strings and a loading state, then fill in content text when the chunk resolves (in practice < 50 ms, chunks are precached by the PWA). The contract's "no missing keys" test covers chrome; a dedicated content test covers all content keys in all 16 locales. Alternative (decision D12): bundle all 16 locales in the game chunk — simpler, but each adventure chunk then carries ~16× its text.

### 4.2 Text budget (the main cost driver)

Rough model per adventure (English words):

| Text type | Count | Words each | Words |
|---|---|---|---|
| Scene descriptions (+ variants) | 20–25 | 30 | ~700 |
| Hotspot *look* + specific responses | 150–200 | 15–20 | ~3,000 |
| Items (name + description) | 25–35 | 15 | ~500 |
| Dialogue lines and options | 150–250 | 12–15 | ~2,500 |
| Goals + 3-tier hints | 25–35 goals | 45 | ~1,400 |
| Journal / lore fragments | 30–40 | 15–25 | ~700 |
| **Total** | | | **~8,000–9,000** |

Both adventures: ~17k English words → ~255k words across the 15 other locales. Consequences:

- Translations other than en/de will be AI-assisted and flagged "awaiting native review" (as today). Narrative text is far more sensitive to translation quality than UI strings.
- **Proposed hard budget: ≤ 7,000 English words per adventure** (decision D5), enforced by a test that counts words in the `en` catalogue. Mechanisms to stay within budget: show rather than tell (pictorial clues), short looks, NPCs with few but meaningful lines, hints written once per goal (not per state).
- Size: ~7k words ≈ 45 KB per locale per adventure uncompressed (~15 KB gzip); 16 locales ≈ 0.7 MB raw per adventure in the precache. Acceptable; per-locale chunks keep runtime memory small.

### 4.3 Writing rules for translatable text (enforced by review + lint where possible)

1. **No string concatenation.** Never "You use {item} on {target}." — case, gender and word order differ (de/ru/pl/uk cases, ar/hi verb agreement). Each interaction has a full authored sentence; generic fallbacks contain no item names.
2. **Gender-neutral protagonist address.** Second-person past tense is gendered in Russian, Polish, Ukrainian, Hindi; second-person forms are gendered in Arabic. Rule: write in present tense / impersonal constructions; translator notes per key where ambiguity remains. The protagonist has no fixed gender, name or portrait (decision D15).
3. **No language-dependent puzzles.** No wordplay, rhymes, anagrams, alphabet order, letter counting, or English-only inscriptions. Inscriptions use an **invented glyph set** (vector symbols) and Western digits. Puzzle logic never depends on translated strings (spec rule).
4. **No directional words that break under RTL**: refer to landmarks ("the door beneath the bell"), not "left/right". Scene art is **not mirrored** in RTL (spatial puzzles depend on it); only UI chrome mirrors.
5. Each key carries a short **translator note** (context, speaker, max length for UI-bound strings) in a sidecar `notes.ts` (English only, not shipped).

### 4.4 Validation (`validate.ts`)

Static checks run in each game's test suite via `runAdventureContentSuite(adventure)`:

- referential integrity (every id used exists; every exit target exists; recipes reference items);
- every flag is written somewhere and read somewhere; every item is obtainable and (unless marked `keepsake`) used;
- every text key exists in all 16 locales with matching placeholders; no unused keys; word budget;
- hotspot geometry inside the canvas; minimum target size ≥ 44 CSS px at the smallest supported viewport (360 px wide) — hotspots smaller than that get an enlarged invisible hit area; no overlapping hotspots without an explicit `z`;
- every hotspot has a label; every widget has a text description; no colour-only states (widgets must declare shape/pattern/label channels);
- dialogue graphs: all nodes reachable, every node has an exit path.

---

## 5. Rendering and asset strategy

Requirement: assets original or cleanly licensed, little production effort, sharp on all screens, small, themeable, accessible.

| Option | Pros | Cons |
|---|---|---|
| **A. Layered vector scenes (SVG) composed from an original primitive library** (recommended) | original by construction; tiny; resolution-independent; hotspots are real DOM nodes (focusable); state variants and era variants are parameter changes; dark-mode/high-contrast friendly; no license review | needs a coherent stylisation; less detail than painted art |
| B. Pixel art authored as code/data on `<canvas>` | strong retro mood; small | labour-intensive per scene; hotspots need a parallel DOM layer; scaling artefacts |
| C. AI-generated raster images | fast | unclear licensing/provenance, inconsistent style, large files, hard to vary per state → rejected |
| D. Commissioned illustration | best atmosphere | cost, coordination, every state variant multiplies work |

Proposed style for option A — **"paper diorama"**: 3–5 depth layers of flat silhouettes with soft gradients (fog, light shafts), a restricted palette per region/era, textures as SVG patterns (hatching, stipple) generated procedurally from the seed-independent scene definition. Interactive objects get a subtle rim light and, in reveal mode, an outline plus a glyph marker (shape-coded, not colour-coded). Motion (water rising, gears turning) is CSS/SMIL animation of logical state changes, disabled under `prefers-reduced-motion`; logic never waits for animation.

Implementation: each scene is a TypeScript function `art(state, t) → SVGElement` built from a shared primitive kit in the engine (`arch`, `stair`, `column`, `waterPlane`, `gear`, `lever`, `door`, `tree`, `ruinWall`, `console`, `pipe`, `fogBand`, `figure` …). Adventure B reuses the same scene geometry across eras with different primitives/palettes (era variants are cheap) — a strong argument for its recommended setting (section 10). Characters are stylised silhouettes with a distinctive shape language; portraits in dialogue are optional silhouettes.

Performance budget: ≤ 400 SVG nodes per scene, no filters heavier than one blur layer on mobile (feature-detected and dropped under reduced motion / low-power heuristics).

---

## 6. Controls and accessibility

**Pointer/touch:** as in 2.6; all targets ≥ 44 px (enlarged hit areas), no drag-only interactions (drag always has a tap alternative), no hover-only information.

**Keyboard:**

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | cycle hotspots and exits in reading order (top-to-bottom, then inline-start to inline-end), then inventory, then panels |
| `Enter` / `Space` | open action menu / activate |
| `1`–`9` | select inventory item; `Esc` deselects / closes menus, dialogue options stay open |
| `R` | toggle hotspot reveal |
| `J`, `H`, `M` | journal, hint panel, map |
| arrow keys | inside widgets and menus |

(Shortcuts are documented on the rules screen and never required.)

**Text mode (screen-reader alternative):** a toggle renders the scene as semantic HTML instead of (or alongside) the SVG: scene name (heading), description, "Things here" list of buttons (hotspots), "Ways out" list, inventory list, and the same action menus. Widgets render their `describe()` output as labelled controls (e.g. "Dial 2 of 4: shows the three-wave glyph. Turn clockwise / counter-clockwise"). Events are announced via the existing polite live region (`announce` in `@wp/ui`). The complete walkthrough e2e runs in text mode (section 8.5), so text-mode completeness is tested, not assumed.

Honest limitation statement (spec: "state that limitation clearly"): a few spatial puzzles (e.g. light routing) are harder without vision even with textual descriptions; their text descriptions are designed as grids with coordinates so they remain solvable. This is mentioned in the game's `rules` text.

**Not colour-only:** puzzle states use shape + pattern + label; era identity in B uses palette *and* a persistent era badge with name and glyph.

**Reduced motion:** all animations off; transitions become instant cross-fades or cuts.

---

## 7. Sessions, saving and hints

- **Session shape:** chapters of 15–40 minutes; metadata `typicalMinutes: [15, 40]`. Chapter ends are natural stopping points with a short, calm recap (no "next chapter" autoplay; continuing is an explicit button).
- **Saving:** `requestSave()` after every `step`. Nothing is lost on close; there are no "unsafe" moments.
- **Coming back after weeks:** "Where was I?" — the journal shows open goals and the last few discoveries (data-driven from `journal` and active goals); costs no extra text.
- **Hint system without frustration** (decision D8):
  - Always available, no cost, no timer, no cooldown, no score penalty, no "are you sure?" shaming.
  - Per active goal, three tiers: (1) *where to look*, (2) *which rule/mechanism matters*, (3) *the concrete next step*.
  - Tier selection is goal-based; the engine picks the active goal closest to progress using the solver's distance oracle (precomputed per chapter at build time or computed lazily on the small chapter state space).
  - Hints are verified by tests: every reachable non-final state has at least one active goal with hints, and tier 3 corresponds to an action on a shortest path to that goal (section 8.3).
  - Factual stat "hints used" may be shown on the end screen only if the owner wants it (default: not shown).
- **No death, no fail states** (decision D7). Danger is expressed narratively ("The ledge crumbles; you step back."). Nothing can be lost that is still needed (guaranteed by the dead-end check).

---

## 8. Test strategy

### 8.1 Engine unit tests (TDD)

Conditions, effects, the one-place-per-item invariant, recipes (order-independent), dialogue traversal, widget contracts, `isValidState` on fuzzed input (never throws), migrations, temporal semantics (9.2), event emission, `finished` exactly once.

### 8.2 Property tests (fast-check)

Generator: random sequences of actions drawn from `availableActions` (so they are always legal), for every adventure and for synthetic generated mini-adventures.

- `step` never throws; resulting state passes `isValidAdventureState`.
- `serialize → JSON → restore` is the identity at every point of the sequence.
- Determinism: same content + seed + actions ⇒ identical state and events.
- Item conservation: each item id is in exactly one place (world, inventory, consumed).
- Look/journal/hint/map actions never change world state.
- Temporal laws (B): paused process phase invariant under any non-temporal action sequence; slowed process advances exactly ⌊ticks/k⌋; rewind never moves a process beyond its recorded history or origin; anchored (inventory) items are never changed by temporal powers or era travel.

### 8.3 Solver and content verification (the core guarantee)

`solver.ts` explores the abstract state graph (scene, inventory, flags, widget-solved bits, temporal state) with breadth-first search, chapter by chapter (each chapter's start set = end states of the previous chapter, deduplicated by canonical hash):

- **Winnable:** `ending` reachable from the start.
- **No dead ends:** every reachable state can still reach `ending` (reverse reachability over the explored graph). A failure prints the shortest action path into the dead end.
- **No dead content:** every scene, hotspot interaction, recipe, dialogue node and widget is reachable/used on some path; optional content is reachable.
- **Fairness ("clue before need"):** puzzles declare their clue flags; on every shortest solution path the clue is obtainable before the solving action is required (warns where only brute force would work).
- **Hint coverage and correctness** (see 7).
- **Metrics snapshot** (reviewed, not pass/fail): shortest solution length, number of reachable states, branching factor per chapter, number of parallel open goals over time — a rough difficulty and "linearity" profile per chapter.

State-space control: bounded flag domains; look actions excluded from search (they never change state); dialogue nodes collapsed to their effects; widgets as macro actions; chapter decomposition. Budget: the full solver run per adventure < 30 s in CI (asserted by measuring state counts; if exceeded, the content is restructured rather than the check weakened).

### 8.4 Golden walkthrough

Each adventure ships `walkthrough.ts`: the canonical action list. Tests replay it (must reach `ending`), and the solver verifies it is consistent with its own shortest-path length (warn if the walkthrough is > 1.5× the shortest path — usually a content smell).

### 8.5 Contract and E2E

- `runGameContract` unchanged (interact = a few walkthrough steps through the DOM).
- `e2e/games/adventure-*.spec.ts`: `expectResumeAfterReload` mid-dialogue, mid-widget and with a selected item; full playthrough of the vertical slice/chapter 1 via the walkthrough **in text mode with keyboard only**; mobile viewport tap flow; Arabic (RTL) smoke test; reduced-motion run.
- Full-game e2e playthrough runs nightly/manually (not on every PR) if it exceeds the CI budget.

### 8.6 Mutation testing

Add `packages/adventure-engine/src/**/*.ts` (excluding `view/**`) and widget code to `stryker.config.json` `mutate` (root config — minimal change, see 13). Content files are data and are covered by the solver instead.

---

## 9. Temporal system (engine extension, used by Adventure B)

The spec demands *explicit causal rules so puzzles are understandable rather than arbitrary*. The rules below are stated to the player in-game ("Field notes on time", unlocked one law per power) and enforced by the engine exactly as written.

### 9.1 Concepts

- **Tick:** the world's unit of time. Time advances **only through player actions** — never in real time. *Move* and *interact* cost 1 tick; *look*, inventory, journal, hints, map, menus and selecting a power cost 0 ticks. This satisfies "never require timers for correctness" and removes reflex pressure: "fast" machines are fast in ticks, not in seconds.
- **Process:** a chrono-reactive object with a discrete phase sequence, either *cyclic* (fan blades: 0→1→2→3→0) or *progressive* (seed → sprout → sapling → tree; empty → charged), with a rate (phases per tick) and optional triggers (a shutter starts closing when a plate is released). Process phases are always visible: a segmented gauge with numbers and phase glyph next to the object, and textual in text mode ("Shutter: closes in 2 actions").
- **Chrono-marked targets:** only processes marked with the resonance glyph react to powers. Everything else is ordinary matter. No guessing which objects are affected.
- **Anchored matter:** the player and everything in the inventory are anchored — immune to powers and unchanged by era travel.

### 9.2 Laws

| # | Power | Law (player-facing) | Engine rule |
|---|---|---|---|
| L1 | **Pause** (*Hold*) | A held object stops completely. It stays solid and in place; you can still touch it, take loose parts from it or place things on it, but it exerts no motion or force until released. | `mode=held`: rate 0, ignores triggers; occupies one *hold slot* (1 slot early, 2 later). Release is a 0-tick action. |
| L2 | **Slow** (*Drag*) | A dragged object runs at one third of its speed. | advances one phase per 3 ticks (fractional counter stored); occupies a hold slot. |
| L3 | **Fast-forward** (*Hasten*) | Hastening pushes an object forward to its next resting phase at once. Everything that would happen to it on the way, happens. | jumps to the next phase flagged `rest`; runs the effects of every intermediate phase in order; costs 1 tick. |
| L4 | **Rewind** (*Recall*) | Recalling returns an object to an earlier state it actually had, at most a few steps back. It restores its form, not its location in your hands: pieces you carry stay with you. You cannot recall an object to before it existed. | each process records its last 8 phases (`history`); rewind steps back to the most recent `rest` phase in history; anchored items are never restored to the object; history before `origin` is empty. Rewinding is itself recorded (you can hasten forward again). |
| L5 | **Era travel** (*Crossing*) | At a crossing point you can step to the same place in another era. The later eras are the consequence of the earlier ones as you left them. | eras ordered `E1 < E2 < E3`; `causalLinks` map facts in an earlier era to facts in later eras (`plant seedling @E1 atrium ⇒ tree @E3 atrium, roots split floor`); propagation is recomputed deterministically on every crossing; changes never propagate backwards. |
| L6 | **Locality** | Powers act on one marked object you can see, never on whole rooms, people or yourself. | target = a single process in the current scene. |

Why this is not a generic undo (spec): rewind is limited to chrono-marked objects, to their own recorded history, to `rest` phases, and it never touches inventory, flags, dialogue, other objects or the player. There is no global undo button — the no-dead-end guarantee makes one unnecessary.

**Paradox policy:** the validator rejects causal links whose effect could remove a crossing point, the player's current location, or an anchored item, and rejects cycles. Travelling only happens at crossing points that exist in all eras, so the player never arrives "inside a wall".

### 9.3 Example puzzle chains (original, illustrative)

1. **Pause — the fan duct.** A chrono-marked ventilation fan spins (cyclic, 4 phases, 1 phase/tick); only in phase 2 is there a gap. *Hold* it when the gauge shows phase 2 → crawl through. Holding at phase 0 blocks the duct; release, wait one action, hold again. Teaches: phases are visible and held objects are solid.
2. **Slow — the security shutter.** Releasing a pressure plate starts a shutter that closes in 2 ticks; the player needs 3 actions (step off plate, take the sample, pass the shutter). *Drag* the shutter → 6 ticks available. Teaches: counting actions, not reacting.
3. **Fast-forward — the battery and the vine.** A solar cell charges over 6 phases; *Hasten* to `charged`. A seed in a hydroponic tray has phases seed → sprout → vine (`rest`) → withered (`rest`): hastening twice overshoots and the vine withers — *Recall* returns it to `vine`. Teaches: rest phases, and that powers combine.
4. **Rewind — the projector lens.** A shattered lens is chrono-marked; *Recall* makes it whole. The projector housing is also marked, and recalling it would also re-lock its cover (its history contains `locked`). Teaches: target the right object; the history is real history.
5. **Era travel — the atrium tree.** E1 (founding): an empty planter in the atrium; a seedling in the nursery. Plant it. E3 (abandonment): the tree's roots have split the sealed floor → route to the basement archive. Variant: in E1 the engineer enters a vault code while you watch; the scene is a recorded loop you can *Hold* and *Recall* to read the keypad → the code is used in E2.
6. **Combined (late game, mirrors the spec example).** A broken freight lift: *Recall* the lift mechanism to intact → *Hold* it at the top phase (slot 1) → take the counterweight block off the held cage (loose part, L1) → *Hasten* the resin vat so the resin sets into a wedge (process B) → place the wedge under the counterweight rails → release the hold → the cage descends against the wedge and stops level with the upper gallery.

Solver relevance: tick counting, hold slots and histories are part of the abstract state; their domains are small (phases ≤ 8, history ≤ 8, slots ≤ 2), so the search stays bounded.

---

## 10. The two adventures: settings, story, puzzle concepts, scope

### 10.1 Adventure A — dark fantasy exploration

Common to all variants: one protagonist without fixed gender/name, no combat, eerie and melancholic rather than gory (suitable from ~12 years), 4–5 regions with distinct puzzle styles around a hub, cross-region puzzles, NPC clue chains, optional discoveries that add understanding (not counters).

**A1 — "The Drowned Library" (recommended)**
- *Setting:* a valley reservoir that swallowed an old scholar-city whose towers still rise from the water. A sluice-and-counterweight system once controlled the levels of three basins; it has seized, and the water creeps upward each season. Fog, half-submerged reading halls, lens towers, ferry ropes.
- *Story:* you arrive as a hired surveyor to map the valley before it floods entirely. Remaining inhabitants (a ferry keeper, a lamp tender, a recluse who speaks only in the old glyphs, the city's last automaton clerk) each hold part of the reason the system failed. Ending: you restore the water balance — or choose to let the lowest district drown to save the archive's heart (two endings, both reachable, no "bad" ending).
- *Regions & styles:* Causeway village (dialogue clue chains, item combination) · Flooded stacks (water-level states across three linked rooms — spatial/causal) · Lens towers (light routing between towers — spatial widget) · Glyph cloister (deciphering an invented glyph script from pictorial context — deduction, language-neutral) · Counterweight heart (combines all: levels + light + glyphs).
- *Signature cross-location puzzle:* basin levels change what is reachable in three places at once (high water floats the boat to an upper gallery; low water exposes a floor passage); the player has to plan the order of sluice settings.
- *Strengths:* clear, explicit causal system (water levels) ideal for fair puzzles and the solver; glyph puzzles avoid translation issues; vector water/fog is cheap and atmospheric.

**A2 — "The Unrung Bell"**
- *Setting:* a mountain town of bell founders where all sound vanished overnight; ash-grey silence, frozen pendulums, cracked moulds.
- *Story:* you carry the town's last tuning fork (oddly still vibrating). Restore the great bell by understanding the founders' craft and their quarrel.
- *Styles:* resonance puzzles shown as visible ripples (not audio — deliberately accessible), alloy mixing (combinatorics with weights), mould assembly (spatial), founders' guild politics (dialogue deduction).
- *Strengths:* very original premise; audio-free by design. *Risk:* "resonance" rules are harder to make intuitive; fewer exploration-style regions.

**A3 — "Lantern Roads"**
- *Setting:* a forest of old waymarks where paths connect differently depending on which lanterns burn.
- *Story:* a courier must deliver a sealed letter to a hermit at the forest's centre; each lantern keeper guards a rule of the paths.
- *Styles:* graph/route puzzles, lantern logic (switch graph), mapping, trades between keepers.
- *Strengths:* strong spatial reasoning, very low art cost. *Risk:* can feel abstract/puzzle-box rather than "world"; less environmental storytelling.

**Scope proposal (A1):** 5 regions + hub, 18–22 scenes, 18–24 puzzles (≈6 inventory/combination, 5 environmental/causal, 4 widgets, 3–4 dialogue/deduction, 2–3 cross-region), 3–5 optional discoveries, ≤ 7,000 words, **2.5–4 h** total, 4 chapters.

### 10.2 Adventure B — temporal science fiction

Common: progression teaches one power at a time (Hold → Drag → Hasten → Recall → Crossing), the final chapter combines them (decision D13). No suits, no regime/war setting, no combat.

**B1 — "Stillwater Observatory" (recommended)**
- *Setting:* a research observatory carved into a glacier on a cold moon, built to study a natural time anomaly. An experiment split the station into three overlapping eras of the same building: **Founding** (under construction, crews, scaffolding), **Operation** (bright, busy, locked down) and **Afterglow** (abandoned, frozen, overgrown by the station's escaped greenhouse plants).
- *Story:* you are the station's maintenance technician who wakes up holding the experiment's handheld controller. To close the split you must find out what each era's team did and why; recorded "echo loops" of past events are both story delivery (few words, mostly visual) and puzzles (Hold/Recall them to read details).
- *Puzzle styles:* processes in machinery (fans, shutters, lifts), greenhouse growth across eras (plant in Founding → mature in Afterglow), echo-loop observation, power routing, combined chains (9.3).
- *Strengths:* **same map in three eras** → spatial reasoning across eras and cheap art (one geometry, three palettes/states); clean causality (one building, one timeline).

**B2 — "Seed Ark"**
- *Setting:* a generation ship's agricultural deck at launch, mid-voyage and arrival.
- *Story:* the ark's ecosystem collapsed in the middle era; fix the chain of causes.
- *Styles:* ecological cause-and-effect, growth, decay, water and light cycles.
- *Strengths:* very intuitive fast-forward/rewind puzzles; *risk:* narrow puzzle palette (mostly biology), weaker pause/slow use.

**B3 — "The Delta of Hours"**
- *Setting:* a river-delta city whose districts run at different time rates (a frozen quarter, a slow quarter, a racing quarter); flood marks act as crossings to other centuries.
- *Styles:* routing goods/people across districts with different rates, tide timetables, historical observation.
- *Strengths:* spatially distinctive; *risk:* conceptually complex (multiple simultaneous rates), larger art scope (many districts and centuries).

**Scope proposal (B1):** 3 eras × 6–7 locations (≈ 20 scene states from ~7 geometries), 20–26 puzzles (≈ 5 per power introduction, 6 era-causal, 4 combined), ≤ 7,000 words, **3–4.5 h**, 5 chapters.

### 10.3 Delivery plan after approval

1. Engine core with TDD (model, step, actions, validation, solver skeleton, text loading) — no UI.
2. **Vertical slice (2–3 scenes of A, chapter 0):** one pickup, one combination, one use-on, one dialogue with a clue, one widget, one transition, journal, hints, text mode, save/resume, solver green, e2e (text mode + keyboard, mobile, reload mid-dialogue). Shown to the owner before scaling up.
3. Adventure A chapter by chapter (each: content → solver green → 16 locales → e2e), then release.
4. Temporal extension (TDD against the laws in 9.2) + a temporal test slice, then Adventure B chapter by chapter.
Each step ends with `pnpm check` and `pnpm build && pnpm e2e`.

Proposed agent split (≤ 4 concurrent): (1) engine core + solver (this agent), (2) view/accessibility (renderer, text mode, controls), (3) content author per adventure (data + art + English text), (4) QA (independent review of solver checks, property tests, mutation report, e2e); translation runs as a separate batch task per chapter.

---

## 11. Open content decisions (owner input needed)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Setting Adventure A | A1 Drowned Library · A2 Unrung Bell · A3 Lantern Roads | **A1** — clearest causal system, language-neutral glyph puzzles, cheapest atmospheric art |
| D2 | Setting Adventure B | B1 Stillwater Observatory · B2 Seed Ark · B3 Delta of Hours | **B1** — same map in three eras (strong spatial puzzles, art reuse), covers all five mechanics; borrow B2's greenhouse ideas |
| D3 | Size / play time | small (A 1.5–2 h, B 2–2.5 h) · medium (A 2.5–4 h, B 3–4.5 h) · large (5 h+) | **medium**, released per chapter (chapter 1 first) |
| D4 | Visual style | SVG paper diorama · canvas pixel art · commissioned illustration | **SVG paper diorama** (original, small, accessible) |
| D5 | Text budget / translation | ≤ 7k words per adventure, all 16 locales at release (AI-assisted, review pending) · larger budget · release en/de first (would violate the spec's 16-locale rule and the contract) | **≤ 7k words, all 16 locales**, native review as follow-up |
| D6 | Interaction model | select-then-act menu · classic verb bar · single "smart" click | **select-then-act** (explicit, touch- and screen-reader-friendly) |
| D7 | Failure / death | none · soft setback (return to scene entrance) | **none** |
| D8 | Hints | always available, 3 tiers, no stats · same with "hints used" on end screen · off by default | **always available, no stats** |
| D9 | Audio in v1 | none · procedural Web Audio cues (original, no licensing) · CC0 sample packs (license review) | **none in v1**, hooks ready; procedural cues later |
| D10 | Seeded puzzle parameters | fixed puzzles · seed varies codes/arrangements where clues are generated mechanically | **fixed in v1** (simpler content/hints/translations); revisit for replays |
| D11 | Game ids / URLs (stable persistence keys) | `adventure-fantasy`/`adventure-temporal` (= package dirs) · `fantasy-adventure`/`temporal-adventure` (spec's URL example) · title-based ids | **`fantasy-adventure` / `temporal-adventure`** as ids and URLs, package dirs `adventure-fantasy`/`adventure-temporal` as briefed; *or* rename dirs to match ids (CLAUDE.md convention "packages/games/<id>") — needs your call |
| D12 | Content text loading | lazy per-locale chunks · all locales in the game chunk | **lazy per-locale chunks** |
| D13 | Temporal power progression | progressive (one per chapter, combined finale) · all from the start | **progressive** |
| D14 | Temporal limits | hold slots 1→2, rewind depth 8 · unlimited slots | **1→2 slots, depth 8** (creates planning without scarcity mechanics) |
| D15 | Protagonist | unnamed, ungendered "you" · chosen name/pronouns (multiplies translation variants) · fixed character | **unnamed, ungendered** |
| D16 | Endings | single ending · two endings both reachable from the last chapter (A1) | **two endings in A**, single in B |
| D17 | Optional discoveries | present without counters · with "3 of 9" counter | **without counters** (avoids completionism pressure) |
| D18 | Tone | eerie/melancholic, no gore, 12+ · darker horror elements | **eerie/melancholic, 12+** |

Final titles (replacing the working titles) should get a quick name/trademark search before release, as was done for "Code Breaker".

---

## 12. Intellectual-property guardrails

Deliberately avoided because they are characteristic of the references: masks or mask fragments as a quest structure; a lone knight/fighter hero; townsfolk turned to stone; a restored sun or a sun temple as goal; named realms/dimensions modelled on the reference's world; armour/power suits granting time powers; an authoritarian alternate-history regime; shooter/combat framing; any names, items, creatures or level layouts from either game. Reviewers check new content against this list.

---

## 13. Required changes outside the adventure packages (for the orchestrator)

Minimal and justified; nothing else in shared packages is needed for the current design:

1. `packages/adventure-engine` as a new shared package (owned by this workstream per the assignment).
2. Registry lines in `apps/web/src/registry.ts` + dependencies in `apps/web/package.json` (per game).
3. `stryker.config.json`: add `packages/adventure-engine/src/**/*.ts` (excluding `view/**`).
4. `docs/ROADMAP.md`: M8 status; `docs/architecture.md`: adventure engine paragraph; new **ADR 0008 — Adventure engine: declarative content, solver-verified completability, lazy content text** (proposed text derived from sections 2, 4 and 8).
5. No change to `GameModule`, `GameContext`, persistence or the contract suite is required. If later an audio service is added to `GameContext`, it is optional.

---

## 14. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Solver state explosion in large chapters | CI slow / check weakened | bounded flags, widget macros, chapter decomposition, state-count assertions; restructure content rather than skip checks |
| Narrative translation quality (AI-assisted, 15 locales) | awkward or wrong text, unclear clues | text budget, no concatenation, translator notes, puzzles independent of language, native review backlog item |
| Art coherence with procedural vector style | looks cheap | vertical slice reviewed by owner before scaling; restricted palettes and depth layering |
| Puzzles fair for the author but opaque for players | frustration | clue-before-need check, 3-tier hints, playtest notes per chapter, metrics snapshot |
| Screen-reader playability of spatial puzzles | exclusion | text mode with grid coordinates, honest limitation note, e2e in text mode |
| Content updates breaking saves | lost progress | `contentVersion`, migration fixtures per released version, never ship without migration |
| Scope creep (two large games) | never finished | chapter releases, word budget test, fixed puzzle counts per chapter |
| IP similarity by accident | legal/ethical | section 12 checklist in content review |
