# Best Plan (`mini-optimizer`) — design

Status: **Implemented (2026-10-17)**; deviations and calibrations are listed in § 17. Written by the planner of the new-games pipeline; the implementer follows it, the reviewer checks against it. Numbers marked *(calibrate)* are first estimates the implementer may tune within the stated bounds (never beyond the solver bounds in § 9).

Binding inputs: `CLAUDE.md`, implementation brief ("Core product principles", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"), ADR 0002 (contract), 0006 (roles), 0017 (host start screen, `settings`, `settingsOf`, `begin`).

## 1. Identity

| | |
|---|---|
| Game id | `mini-optimizer` (package `@wp/game-mini-optimizer`) |
| English name | **Best Plan** |
| German name | **Bester Plan** |
| Category / skills | Algorithms · `skills: ['algorithms', 'planning']` |
| Typical minutes | `[3, 12]` |
| Difficulties | `['easy', 'medium', 'hard']` (`metadata.difficulties`) |
| Input | pointer, touch, keyboard |
| Capabilities | offline, no audio, no network, no WebGPU, `aiOptional: false`, `pauseable: true` |

The id stays neutral (`mini-optimizer`), so a later rename of the display title touches no saves.

## 2. Pitch

Three small planning jobs — **lay a road network, plan delivery trips, choose a workshop's production** — each with a budget-like limit and one clear number to make as good as possible. Many plans work; some are cheaper or worth more. When you are happy with yours, check it: the game tells you the best value possible (computed exactly), how far you are from it, and — only if you ask — shows one best plan. Then you can stop, or try to improve, at your own pace.

## 3. Honest value claims

Allowed wording (tagline, rules, catalogue):

- "Practice comparing plans by one measurable number (cost, distance, value)."
- "Exercise in spotting when the obvious greedy choice is not the best one."
- "Practice with simple models: limits, capacities and trade-offs."

After each check a short, factual **"The idea"** note names the underlying idea (Kruskal's cheapest-link rule, nearest-stop heuristic, value per unit of the scarcest resource) — framed as background, not as a lesson the player has now "learnt". Never: "improves your maths / logic / brain", "trains you to think like an engineer".

## 4. Fit with the collection and reuse

| Existing game | What it does | Overlap? |
|---|---|---|
| Network Detective (`graph-detective`) | judge properties of a given network (bridges, shortest route, cut vertex, min cut); one right answer | No MST/Steiner and no "build the cheapest"; Best Plan *designs*, it does not *diagnose*. Shortest route is deliberately not a Best Plan type. |
| Circuit (`circuit-puzzle`) | rotate tiles into a spanning tree, no costs | No costs, no choice of edges. |
| Flow Lab (`systems-puzzle`) | tank/valve simulation over ticks | That is why **no min-cost flow** type here: it would read as a second Flow Lab. |
| Robot Program (`logic-path`) | shortest program | Different domain (programs). |
| Bridges, River Crossing, Laser Paths | logic puzzles with one solution | Best Plan has *many* valid solutions, ranked by a number. |

Reuse:

- **Shared packages** (imports): `@wp/game-core` (`createRng`, `normalizeSeed`, guards `isRecord/isInt/isArrayOf/isOneOf`, `defineGame`, setting types), `@wp/ui` (`h`, `clear`, `announce`), `@wp/testing` (`runGameContract`, `startGame`, `chooseSetting`, `expectResumeAfterReload`, `readSave`).
- **Patterns copied, not imported** (games never import other games): graph-detective's SVG helper (`svg(tag, attrs, …)`), its roving-focus keyboard handler over SVG items (arrows/Home/End, RTL-aware), its cost badges on edges (`gd-weight-box`) and its 360 px diagram CSS; logic-path's "first solve calls `finished`, further play continues" pattern.
- **Not reused**: strategy-engine pathfinding (`findPath`, `flowField`) — it is tied to the strategy map/ruleset/terrain model; our distances are closed-form (Manhattan / printed link costs), so a few lines of own code are simpler. No new dependency, no third-party data.
- **No shared change requested.** (If the reviewer finds the SVG graph helper now copied three times, a later orchestrator task may extract it to `@wp/ui`; not part of this game.)

## 5. The three problem types

Chosen to be distinct in *what the player manipulates* (links on a map, an order of stops, numbers in a table) and in *the optimisation idea* (cheapest connecting network, shortest capacitated tours, best mix under limits). All three are classic, intuitive, exactly solvable at our sizes, and none duplicates an existing game (§ 4). Min-cost flow was rejected (Flow Lab overlap, hard to explain on a phone); plain TSP is folded into Delivery's easy level.

Common terms: a **plan** is the player's current solution; **feasible** = satisfies every constraint; **score** = the type's single number; the **optimum** is the best score over all feasible plans, computed by the exact solver. Lower is better for Network and Delivery (cost, km), higher for Production (value).

**Gap** shown after a check (all integers, so exact):
- minimise: `gap = yours − optimum` (≥ 0), percent `100 · gap / optimum`;
- maximise: `gap = optimum − yours` (≥ 0), percent `100 · gap / optimum`;
- percent formatted with one decimal via `Intl.NumberFormat(t.locale)`; `gap = 0` is shown as "That is a best plan." No stars, bands or grades — numbers and one sentence only.

### 5.1 Network — "Connect the villages"

**Story:** A region wants all its villages connected by roads as cheaply as possible. Some candidate roads are possible, each with a printed building cost. On medium/hard there are also optional **junctions** (crossroads) that may be used as intermediate points.

**Rules**
- Points: `towns` (circles, labelled A, B, C …) and `junctions` (squares, labelled 1, 2, 3). Candidate links between pairs of points, each with an integer cost (badge on the link).
- The player builds or removes links (toggle). A junction counts as **used** when at least one built link touches it; on hard a used junction adds its **opening cost** (badge on the square).
- **Feasible** iff all towns lie in one connected group of built links. Junctions need not be used; extra links and cycles are allowed (they just cost more).
- **Score (cost)** = Σ cost of built links + Σ opening cost of used junctions. Minimise.

**Constraints shown live:** number of separate town groups ("2 separate groups: A B C | D E"), total cost.

**Generator** (seeded `createRng(seed)`; field 10 × 10 units, integer coordinates 1 … 9):

| | easy | medium | hard |
|---|---|---|---|
| towns | 6 | 7 | 8 |
| junctions | 0 | 2 (opening cost 0) | 3 (opening cost 1–3) |
| candidate links | 9–11 | 12–15 | 15–19 |
| rough links (+2 / +3) | none | ≤ 25 % of links, +2 | ≤ 25 %, +3 |

1. Place towns by rejection sampling with pairwise Euclidean distance ≥ 2.2 units (≈ 66 px apart at 360 px).
2. Junctions: for each junction except a decoy, pick three towns whose triangle has all angles < 120° and put the junction on the integer point nearest their Fermat point (if free and ≥ 2.2 from all points). Hard: the last junction is a **decoy** placed at random. This makes junctions sometimes worth it and sometimes not.
3. Candidate links: all pairs with length ≤ 5 units *(calibrate)*, sorted by length; add a pair if its segment crosses no added link and passes no third point closer than 0.8 units; stop at the target count. The drawing is therefore planar and readable.
4. Cost = `max(1, round(length))`, plus the rough surcharge on randomly chosen links (drawn with a "≈" marker and the label "rough ground +2").
5. **Solvable by construction check:** all towns connected through the candidate graph; otherwise retry.
6. **Interest filters:** medium/hard — the optimum uses ≥ 1 junction **and** the best plan without junctions (MST of towns only, if it exists) is strictly more expensive; hard — additionally, the plan that opens all junctions and takes their MST is strictly worse than the optimum (so the decoy matters).
7. Retry up to 200 attempts; then fall back to a hand-made instance per difficulty (fixtures in `rules.ts`, checked by tests to pass the same filters). The fallback rate must stay < 1 % over 500 seeds (test).

**Exact solver:** for every subset S of junctions (≤ 2³ = 8 subsets), Kruskal's MST on the subgraph induced by towns ∪ S (skip if disconnected); cost = MST + Σ opening(S) (the MST spans every vertex of the induced subgraph, so every junction in S is used; a subset with a useless leaf junction is simply never the minimum). Optimum = minimum over subsets. Correct because an optimal tree spans exactly towns ∪ (its junctions), and the MST of that set is no more expensive. **Bound:** 8 × O(m log m), m ≤ 24 → microseconds.

**Oracle (tests only):** enumerate all subsets of links (2^m, m ≤ 15 for easy/medium; hard instances checked on a fixed smaller sample with m ≤ 19 ≈ 524 k subsets), score feasible ones, compare minima.

### 5.2 Delivery — "Deliver the parcels"

**Story:** A van starts at the depot, carries at most a given number of parcels, and must bring every customer their parcels. It may return to the depot to reload as often as needed. Streets form a grid; distance is counted in blocks.

**Rules**
- A grid of streets; the depot **D** and customers **A … G**, each at an intersection, each with a parcel count (badge "2 parcels" with a parcel glyph).
- The plan is a list of **trips**; a trip leaves the depot, visits customers in the chosen order and returns to the depot. Each customer is visited exactly once (no split deliveries).
- **Feasible** iff every customer is in exactly one trip and every trip's load (Σ parcels) ≤ capacity.
- Distance between two points = Manhattan distance (blocks). **Score (km)** = Σ over trips of depot → first + consecutive legs + last → depot. Minimise.

**Constraints shown live:** per trip "load 5 of 6", over-capacity trips ("7 of 6 — 1 too many"), customers not yet visited, total km.

**Generator:**

| | easy | medium | hard |
|---|---|---|---|
| grid (intersections) | 7 × 7 | 9 × 9 | 9 × 9 |
| customers | 5 | 6 | 7 |
| parcels per customer | 1 | 1–3 | 1–4 |
| capacity | = total (one trip: a plain round tour) | between max(largest order, ⌈total/2⌉) and total − 1 (≥ 2 trips) | between max(largest order, ⌈total/3⌉) and ⌈total/2⌉ (≥ 2, usually 3 trips) |

1. Depot at the centre ± 1. Customers at random free intersections with Chebyshev distance ≥ 2 from each other and from the depot (keeps 44 px targets apart: 9 intersections on 328 px → 41 px pitch, so ≥ 82 px between stops).
2. **Solvable by construction:** every order ≤ capacity, so one trip per customer is always feasible.
3. **Interest filters:** medium/hard — the "nearest next stop that still fits, else return to depot" heuristic is strictly worse than the optimum. Easy — none (a round tour is already a nice first problem).
4. Retry ≤ 200, then a hand-made fallback per difficulty (same tests as Network).

**Exact solver:** Held–Karp over customer subsets: `tour[mask]` = shortest depot → mask → depot round trip (`dp[mask][last]`, O(2ⁿ n²) ≤ 128 · 49). Then partition DP: `best[mask] = min over sub ⊆ mask containing mask's lowest customer, load(sub) ≤ capacity: tour[sub] + best[mask \ sub]` (O(3ⁿ) ≤ 2 187). Reconstruct one optimal plan (trip order from the Held–Karp parents). **Bound:** n ≤ 7 → well under 1 ms.

**Oracle (tests only):** every permutation of customers (n! ≤ 5 040) × every set of "return to depot here" cut points (2ⁿ⁻¹ ≤ 64), capacity checked per trip → ≤ 322 560 evaluations for n = 7.

### 5.3 Production — "Plan the workshop"

**Story:** A small workshop makes a few kinds of products from limited stock. Each product needs some wood (and on higher levels fittings and work hours) and is worth a certain value. On hard, starting a product line at all costs a one-off setup. Choose how many of each to make.

**Rules**
- Products (from a fixed list: stool, chair, table, shelf, crate — localised) with: value per piece, use of each resource per piece, a maximum the customers will take ("up to 4"), and on hard a setup cost.
- Resources (wood; + work hours on medium; + wood, fittings, work hours on hard) with a stock.
- The plan is a quantity 0 … max per product.
- **Feasible** iff for every resource Σ use × quantity ≤ stock.
- **Score (value)** = Σ value × quantity − Σ setup of products with quantity > 0. Maximise.

**Constraints shown live:** one meter per resource ("Wood 18 of 16 — 2 too many"), total value, setup costs counted.

**Generator:**

| | easy | medium | hard |
|---|---|---|---|
| products | 3 | 3 | 4 |
| resources | 1 (wood) | 2 (wood, hours) | 3 (wood, fittings, hours) |
| use per piece | 1–4 | 1–4 | 0–4, each product uses ≥ 2 resources |
| max per product | 3–5 | 3–5 | 3–5 |
| setup cost | — | — | 2–5 |

1. Value = `round(Σ use × f)`, f uniform in 0.8 … 1.6 *(calibrate)*, min 2 — value loosely follows effort so no product is obviously dominant.
2. Stock per resource = `round(s × Σ_p use × max)`, s in 0.4 … 0.7, and ≥ the largest single use (so every product fits at least once).
3. **Solvable by construction:** the empty plan is always feasible; the filter below demands optimum > 0.
4. **Interest filters:** all levels — "only the single most valuable product, as many as fit" is not optimal; medium/hard — the greedy "add one piece of the product with the best value per unit of the currently scarcest resource, while it fits" is strictly worse than the optimum, and the optimum makes ≥ 2 different products.
5. Retry ≤ 200, fallback fixture per difficulty.

**Exact solver:** enumerate all quantity vectors, Π(max + 1) ≤ 6⁴ = 1 296, keep the best feasible. **Bound:** trivially fast.

**Oracle (tests only, independent method):** for each subset of products allowed to be used (≤ 2⁴), a bounded multi-dimensional knapsack DP over remaining stock (stock ≤ 30 per resource, ≤ 3 resources → ≤ 31³ states × ≤ 20 unit items), minus the subset's setup costs; maximum over subsets.

### 5.4 "Best possible" and the comparison

All instances are small enough that the solver gives the **proven optimum**; we never show a heuristic "best known" value, so the word used is "best possible". The solver runs on demand in `rules.ts` (memoised per instance in the view); the optimum is not stored in the state.

After a check the result panel shows: your score, the best possible score, the gap (absolute and %), the number of checks so far, and a **"Show a best plan"** button. Pressing it (deliberate, never automatic) switches the diagram/list to a two-state toggle **"Your plan | A best plan"**; the best plan is drawn with a distinct line style (double line for network links and routes, a "★ best" column in production) plus a text listing. The player's plan is not changed. Once revealed, `revealed: true` is kept and the result line says "(after looking at a best plan)" — factual, not punitive.

## 6. Difficulty levels (summary)

| | Network | Delivery | Production |
|---|---|---|---|
| easy | 6 towns, cheapest connections only (an MST) | 5 stops, one round tour | 3 products, wood only |
| medium | 7 towns + 2 free junctions, rough ground | 6 stops, 1–3 parcels, ≥ 2 trips | 3 products, wood + hours |
| hard | 8 towns + 3 junctions with opening cost (one decoy) | 7 stops, 1–4 parcels, usually 3 trips | 4 products, 3 resources, setup costs |

Difficulty labels stay generic (`difficulty.easy` = "Easy (small)", `difficulty.medium` = "Medium", `difficulty.hard` = "Hard (more trade-offs)"); a hint under the problem choice explains per type what grows.

No separate "instance size" setting: size is the main difficulty lever and is tied to the solver/oracle bounds; a free size would multiply combinations without adding a new idea.

## 7. Start-screen settings (ADR 0017)

```ts
settings: [
  { kind: 'choice', id: 'problem', labelKey: 'problem.label', valueKey: 'problem',
    values: ['network', 'delivery', 'production', 'any'], default: 'network', hintKey: 'problem.hint' },
  { kind: 'difficulty' }
]
settingsOf: (state) => ({ problem: state.choice, difficulty: state.difficulty })
```

- Four values → radio buttons. `any` = "Surprise me": the type is drawn from the seed (`rng.int(0, 2)` as the generator's first draw), so "Another round" with `any` gives a different type each time. Default `network` (the gentlest first problem).
- Untrusted input: unknown `problem` → `network`, unknown difficulty → `easy`.
- The state keeps `choice` (what the start screen said) separately from `problem.kind` (what was generated), so `settingsOf` is exact and "Another round" repeats the same choice.
- `begin` is irrelevant (no intro screen); the first screen is the problem itself with a one-line task text.
- No `setupInGame`.
- Display preference kept inside the game (per-device `preferences`): "list view open" (the `<details>` state) only.

## 8. State (JSON, `stateVersion: 1`)

```ts
type Kind = 'network' | 'delivery' | 'production';
type Choice = Kind | 'any';

interface MoState {
  seed: number;                 // uint32
  difficulty: 'easy' | 'medium' | 'hard';
  choice: Choice;               // start-screen value, for settingsOf
  problem: NetworkProblem | DeliveryProblem | ProductionProblem;   // stored in full (generator changes never break saves)
  plan: NetworkPlan | DeliveryPlan | ProductionPlan;               // same kind as problem
  undo: (NetworkPlan | DeliveryPlan | ProductionPlan)[];          // ≤ 40, oldest dropped
  checks: number;               // feasible plans checked
  last: { score: number; plan: Plan } | null;   // last checked plan
  bestScore: number | null;     // best score among checked plans
  phase: 'planning' | 'checked';   // 'checked' while the plan equals `last.plan`; any edit → 'planning'
  revealed: boolean;            // "Show a best plan" was used
  reported: boolean;            // finished() already called
}

interface NetworkProblem {
  kind: 'network';
  points: { x: number; y: number; junction: boolean; open: number }[];  // ≤ 11 points, ≤ 3 junctions, coords 0..10, open 0..5
  links: { a: number; b: number; cost: number; rough: boolean }[];      // ≤ 24, a < b, cost 1..20, no duplicates
}
interface NetworkPlan { built: number[] }               // sorted, unique link indices

interface DeliveryProblem {
  kind: 'delivery';
  size: number;                                         // intersections per side, 5..9
  depot: { x: number; y: number };
  stops: { x: number; y: number; parcels: number }[];   // 1..7 stops, parcels 1..9, distinct positions
  capacity: number;                                     // ≥ max parcels, ≤ 60
}
interface DeliveryPlan { trips: number[][] }            // each stop at most once overall; ≤ 7 trips; the last may be empty ("new trip" started)

interface ProductionProblem {
  kind: 'production';
  resources: { id: 'wood' | 'fittings' | 'hours'; stock: number }[];    // 1..3, distinct, stock 1..30
  products: { id: 'stool' | 'chair' | 'table' | 'shelf' | 'crate'; value: number; use: number[]; max: number; setup: number }[];
  // 1..4 distinct, value 1..40, use[r] 0..9 (length = resources), max 1..5, setup 0..9
}
interface ProductionPlan { qty: number[] }              // qty[p] in 0..max
```

`isValidState` never throws and checks every bound above — the bounds are what keeps the solver within § 9's limits for any loaded save — plus: plan kind = problem kind, indices in range, no duplicates, `last.plan` valid, `phase`/`reported` booleans consistent (`reported ⇒ checks ≥ 1`). Network: the candidate graph must connect all towns (else the optimum is undefined); Delivery: every order ≤ capacity. The PRNG state is not needed after generation (all randomness is spent in `createInitial`), so it is not stored.

Pure actions in `rules.ts` (each returns the same object when nothing changes, so the view only saves real changes): `createInitial(seed, difficulty, choice)`, `toggleLink`, `addStop(stop)` (appends to the last trip), `removeStop(stop)`, `newTrip` (closes the current trip; no-op if it is empty), `setQty(product, q)`, `undo`, `clearPlan`, `check` (only when feasible; returns `{ state, first: boolean }`), `reveal`, plus `score`, `violations`, `isFeasible`, `solve(problem) → { score, plan }`.

## 9. Solver bounds (worst case allowed by `isValidState`)

| Type | Solver | Worst case |
|---|---|---|
| Network | 2^J × Kruskal | J ≤ 3, m ≤ 24 → 8 × ~100 ops |
| Delivery | Held–Karp + subset partition | n ≤ 7 → 6 272 + 2 187 steps |
| Production | full enumeration | ≤ 6⁴ = 1 296 vectors × 3 resources |

All well under 1 ms; the view may call the solver synchronously on check. Generation (≤ 200 attempts, each solving once plus one heuristic) stays under ~20 ms *(test asserts < 100 ms per instance, and the whole generator property test < 50 % of its timeout)*.

## 10. UI

Common frame (all types), top to bottom at 360 px; at ≥ 48 rem the work area and the side panel sit side by side (CSS grid, logical properties):

1. **Task line** (one sentence per type and level, e.g. "Connect all villages as cheaply as possible.").
2. **Status bar** (`role="status"`-like region, also mirrored into a polite live region on change): the score ("Cost: 23"), and each constraint as a text item with a symbol: `✓ All villages connected` / `⚠ 2 separate groups: A B C | D E`. Symbols are paired with words; never colour alone.
3. **Work area** (diagram or table).
4. **Actions:** `Check plan` (primary), `Undo`, `Clear`, and type-specific actions. `Check plan` uses `aria-disabled` (stays focusable) while infeasible; pressing it then announces the missing points instead of checking.
5. **List view** `<details>` (open by default on Production, collapsed on Network/Delivery at < 48 rem, open beside the diagram on desktop): the full plan as accessible controls — the keyboard/screen-reader-first way to play.
6. **Result panel** after a check (§ 5.4) with "The idea" note and "Show a best plan".

All targets ≥ 44 px (SVG hit areas are invisible ≥ 44 px circles/rects over the visual marks). Diagrams use `direction: ltr` (map content, like graph-detective), surrounding text follows the locale (RTL-safe). Forced-colours: strokes use `currentColor`/system colours; differences are expressed by line style and thickness.

### 10.1 Network

- **Diagram:** towns = circles with letters; junctions = squares with numbers and (hard) an opening-cost badge "+2". Candidate link = thin **dashed** line with a cost badge at its midpoint; built link = thick **solid** line, badge filled and prefixed "✓". Rough links carry a "≈" marker next to the cost. When the towns form several groups, each town shows a small group number (1, 2 …) so the split is readable without colour.
- **Pointer/touch:** tap a link (its badge or the line; hit area 44 px badge + 24 px wide line stroke) to build/remove. No dragging needed (dragging between points was considered and rejected: imprecise at 360 px and redundant).
- **Keyboard:** the diagram is one tab stop with roving focus over the link badges in reading order of their midpoints; arrows move (RTL-aware), Home/End, Enter/Space toggle; visible focus ring. List view: one checkbox per link "A–C, cost 4 (rough ground)".
- **Live:** "Cost 23 · ⚠ 2 separate groups" / "Cost 21 · ✓ all 7 villages connected · junction 1 used (+2)".

### 10.2 Delivery

- **Diagram:** a street grid (thin lines; one block = one km); depot = house glyph "D"; customers = circles with letters and a parcel badge "▣ 2". The route is drawn as orthogonal paths (horizontal first, then vertical) with small step numbers at each stop ("1", "2" …) and the trip number as a prefix ("T2·1"); trips differ by line pattern (solid, long dash, dotted) and number, not by colour. The leg back to the depot is drawn dashed-thin ("return").
- **Pointer/touch:** tap a customer to add it to the current trip (it gets the next step number); tap a customer already planned to remove it from its trip (later stops move up). Tap the depot or the "Back to depot" button to close the trip and start a new one. Undo and Clear as usual.
- **Keyboard:** roving focus over depot and customers (reading order), Enter/Space = same as tap; the "Back to depot" button is in the action row. List view: one row per trip ("Trip 1: D → A → C → D · 5 of 6 parcels · 14 km") and one row per unplanned customer with an "Add to trip N" button; each planned customer has a "Remove" button.
- **Live:** "38 km · Trip 2: ⚠ 7 of 6 parcels (1 too many) · 2 customers not yet visited".

### 10.3 Production

- **Work area = table/cards** (no map): one card per product with name, value, per-resource use ("2 wood, 1 h"), max, setup (hard), and a stepper `−  3  +` (44 px buttons, quantity shown as text, `aria-label` "Chairs: 3 of at most 4"). At 360 px the cards stack; on desktop they form a table with one column per resource.
- **Resource meters:** a bar per resource with text "Wood 18 of 16"; when over, the bar shows a hatched overflow segment beyond a marked limit line plus "⚠ 2 too many" — readable without colour.
- **Keyboard:** Tab through steppers; while a quantity is focused, ArrowUp/ArrowDown (and +/−) change it (role `spinbutton` with `aria-valuenow/min/max`), Home/End = 0/max.
- **Live:** "Value 31 · setup −4 · ⚠ Wood 18 of 16 (2 too many)".

### 10.4 Announcements

Polite live region: each edit ("Link A–C built. Cost 23."), each check result, reveal. Never more than one announcement per action.

## 11. Flow and end condition

1. Start (host start screen) → the problem appears in `phase: 'planning'`.
2. The player edits; every logical edit calls `requestSave()` (state includes the plan and undo stack, so closing at any moment loses nothing).
3. **Check plan** (only when feasible): `checks += 1`, `last`, `bestScore` updated, `phase: 'checked'`, result panel shown. The **first** feasible check is the natural end: `finished({ outcome: 'completed', stats: { score, best, gap, checks } })` is called once (`reported: true`); the host shows its calm "finished" panel (Another round / Change settings / Back). No automatic next problem.
4. **Try to improve** (optional, no pressure, no limit, no timer): any further edit returns to `planning` (the host hides its finished panel on continued play, as with Robot Program). Later checks update `bestScore` and the result panel but never call `finished` again. The result text compares with the player's own best ("Your best so far: 23") only as information.
5. Reaching the optimum is acknowledged once in words ("That is a best plan.") — no fanfare, no reward.

`reset()` = same problem, empty plan, counters cleared. `pause()` blocks input; there are no timers.

## 12. Files the implementer creates

`packages/games/mini-optimizer/src/{metadata,messages,rules,network,delivery,production,view,index}.ts` and `styles.css` (splitting rules per type keeps files reviewable; `rules.ts` holds the shared state, validation and dispatch), `test/{rules,network,delivery,production,contract}.test.ts`, `e2e/games/mini-optimizer.spec.ts`. The orchestrator step (package.json, `apps/web/package.json`, registry line appended last, SVG preview in `apps/web/src/previews.ts` — a small network: 4 circles, 1 square, 2 solid and 3 dashed links with cost badges) is done per the pipeline brief.

## 13. Test plan

**Unit / property (`fast-check`, seeds × difficulty × kind):**
- Generator: deterministic (same seed/difficulty/choice → deep-equal state); `isValidState(createInitial(…))`; all bounds of § 8; feasible plans exist; every interest filter of § 5 holds; `any` yields all three kinds over seeds; fallback rate < 1 % over 500 seeds; generation < 100 ms.
- Solver vs **independent oracle** (§ 5.1–5.3): equal optimum on ≥ 60 instances per type at easy/medium and ≥ 15 at hard (hard network oracle limited to m ≤ 19); plus hand-made instances with known answers (e.g. a square of four towns with a centre junction where the junction saves cost; a delivery where nearest-neighbour fails; a knapsack where the greedy fails). The solver's returned plan is feasible and scores exactly its reported optimum.
- **No plan beats the optimum:** random feasible plans (random link sets that connect towns; random stop permutations + cut points that respect capacity; random quantity vectors) never score better than `solve`.
- Score/feasibility properties: building a link never lowers network cost; adding a stop never lowers km (Manhattan triangle inequality); raising a quantity never lowers resource use; `violations` empty ⇔ `isFeasible`.
- Actions: arbitrary action sequences never throw and always keep `isValidState`; `undo` restores the previous plan; `check` is a no-op when infeasible; `finished`-relevant `first` is true exactly once.
- `isValidState` never throws on `fc.anything()` and rejects mutated saves (index out of range, duplicate stop, kind mismatch, over-size instance, disconnected network).
- `settingsOf` round trip: `createInitial(seed, d, choice)` → `settingsOf` returns `{ problem: choice, difficulty: d }`.
- Heavy tests (oracles) stay < 50 % of their timeout under load; sizes are chosen accordingly.

**Contract (`runGameContract`):** `interact` = click the first link/stop/plus button in the DOM (whatever the generated kind), which triggers `requestSave`. Settings are sampled by the contract (all 4 × 3 combinations).

**E2E (`e2e/games/mini-optimizer.spec.ts`, imports pure solver from `packages/games/mini-optimizer/src/…` like deep-read, and `readSave`):**
- For each problem type: `startGame` with `chooseSetting(problem)`; read the save, compute the optimal plan with the solver, enter it via the UI (taps), check → result says "best plan", host finished panel appears.
- Infeasible check: `Check plan` announces the violation and does not finish.
- `expectResumeAfterReload` after a few edits (plan and undo survive).
- Keyboard-only round for Network (roving focus + Space) and Production (spinbutton arrows).
- 360 × 740 viewport: no horizontal scroll, all interactive targets ≥ 44 px (bounding boxes), the diagram fits.
- "Show a best plan" toggles views and leaves the player's plan unchanged; "Another round" with `any` starts a new problem.

## 14. Localisation scope

All 16 locales, game namespace only (no per-locale content files needed). About **120 keys** *(estimate)*:

- identity: `title`, `tagline`, `rules` (3);
- settings: `problem.label`, `problem.hint`, `problem.network|delivery|production|any`, `difficulty.easy|medium|hard` (9);
- per type: task line per level (9), short rules/intro (3), "The idea" (3), unit names (`unit.cost`, `unit.km`, `unit.value`) (3);
- entities: products (5), resources (3), labels "junction", "depot", "rough ground +{n}", "opening cost" (~6);
- status/violations with parameters: groups, unconnected, over capacity, unvisited, resource over, feasible lines (~15);
- actions and list view: check, undo, clear, back to depot, add/remove, show best plan, your plan / a best plan, list view (~14);
- result: score, best possible, gap (abs + %), is best plan, your best so far, checks, after reveal, `result.completed` (~10);
- accessible labels and announcements (link built/removed, stop added/removed, quantity, trip closed, checked, revealed, undone, cleared) (~25);
- plural-sensitive strings use separate keys or neutral phrasing ("Parcels: {n}") as the existing games do.

German title "Bester Plan"; product and resource words need natural translations (a translator-facing note in `messages.ts`).

## 15. Risks

| Risk | Mitigation |
|---|---|
| Generator filters reject too often (slow or fallback-heavy) | attempt cap 200, fallback fixtures, test on rejection/fallback rate and time |
| Crowded diagrams at 360 px (11 points, 19 links) | min point distance, planar links, 44 px badges; list view as a full alternative; e2e target-size check |
| Printed network costs not matching drawn lengths (rough ground) | rough links marked "≈ +3"; costs always printed, never inferred |
| Delivery routes overlap on the grid (orthogonal paths share streets) | step numbers on stops and the trip list are authoritative; paths offset by 3 px per trip |
| Knowing the optimum value is a hint for "try to improve" | intended; the plan itself is only shown on request |
| Steiner junctions are unfamiliar | one-line hint in the medium/hard task text ("Junctions are optional; use them only if they save cost") |
| Many ties (Manhattan, small costs) | any plan with the optimal score counts as a best plan; tests never expect a specific plan |
| Translation volume (~120 × 16) | concise strings; reuse `common.*` where possible |
| Solver bugs hidden by small sizes | independent oracles with different algorithms (subset enumeration, permutation brute force, knapsack DP) |
| Save trust | full instance validation with tight bounds before solving |

## 16. Open questions for the owner

1. **Title:** "Best Plan / Bester Plan" (descriptive, like "Flow Lab") or keep the concept name "Mini Optimizer / Mini-Optimierer"? The id stays `mini-optimizer` either way. → **Decided (orchestrator, 2026-10-17): "Best Plan" / "Bester Plan".**
2. **Default problem on the start screen:** `network` (gentlest) is chosen; would you prefer "Surprise me" as the default? → **Decided: Network.**

## 17. Implementation notes (2026-10-17)

What changed against the plan above, and why. Everything else is as designed.

- **Files.** As in § 12, plus `src/common.ts` (difficulties, union–find, labels) and the translations split into `src/locales/<locale>.ts` (each typed against the English keys; `messages.ts` assembles them). Tests: `test/{rules,network,delivery,production,view,contract}.test.ts` and `test/oracle.ts`.
- **Network generator calibration.** With planar, point-clear links and readable badges, 6 towns rarely allow 9 candidate links (≈ 5 % of attempts), and the medium/hard junction placement fails often too, so the fallback rate went above 1 %. Calibrated: candidate links **easy 8–10, medium 11–15, hard 14–19** (was 9–11 / 12–15 / 15–19), longest link **5.7** units (was 5; costs stay ≤ 6 + rough surcharge), and a new readability rule: two cost badges (link midpoints) are at least **1.25** units apart. Measured: 0 fallbacks in 500 seeds per level, about 0.2 / 2.3 / 3.6 ms per instance.
- **Reading order.** Towns (and customers) are sorted top-left first after placement, so labels A, B, C … read like a page.
- **Junction opening cost.** The "+n" badge is drawn beside the square on the side farthest from every road (below, above, right or left), on a filled box, so roads never run through it. The legend says "next to", not "below".
- **Fallback fixtures** are frozen generator output (seed 2026) instead of hand-drawn instances; tests check they pass the same validation and interest filters.
- **Production values.** `f` is drawn from 1.6 … 3.2 (the design's 0.8 … 1.6 doubled): with small integer uses, the original range gave many products worth the same 2–3 points, which made the easy level trivial. Bounds unchanged (value ≤ 40).
- **Delivery depot label.** Customers are A … G, which includes "D", so the depot is a house glyph and is named by the word "Depot" in texts ("Trip 1: Depot → A → C → Depot") instead of the letter D.
- **Delivery hit areas** are 62 SVG units wide (not 56) so they stay ≥ 44 px on a 360 px phone with the 9 × 9 grid.
- **Production layout.** No separate list view (the product cards already are the accessible controls); the cards form a responsive grid on desktop instead of a table. An empty production plan is feasible (value 0), so "Check plan" is available from the start there.
- **Status box while a best plan is shown** describes the plan on screen (the best plan), so the map, the meters and the score never disagree; the note above says the player's own plan is unchanged. A tap on the map while a best plan is shown switches back to "Your plan" instead of editing.
- **Difference line.** Cost and value differences are shown as plain numbers ("Difference: 6 (22.2 %)"); distances keep their unit ("24 km").
- **Wording "a best plan".** Several optimal plans can exist. In German, Spanish, French, Italian and Portuguese "a best plan" reads as "a better plan", so those locales say "an optimal plan" ("ein optimaler Plan"); the title stays "Bester Plan".
- **Generation time test** asserts the average over 500 instances (< 100 ms; measured ≈ 5 ms) rather than the slowest single one, which was flaky under parallel load.

