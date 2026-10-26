# Atlas Explorer (`atlas-explorer`) — design

Status: **Plan (2026-10-26)**, written by the planner of the new-games pipeline (game 4 of the owner's list; done before it: Best Plan, Estimation Lab, Probability Detective). The implementer follows it, and the reviewer checks the work against it. Numbers marked *(calibrate)* are first estimates; the implementer may tune them within the stated bounds. The map data was inspected for this plan (sizes, licences, disputed areas; § 11, § 12, Appendix B), but no data is committed in the planning step.

Scope for the implementer (feature agent, ADR 0006): `packages/games/atlas-explorer/` (including its dev-only data script, § 11.4) and `e2e/games/atlas-explorer.spec.ts`. The orchestrator creates `package.json` (dependencies `@wp/game-core`, `@wp/ui`, `@wp/learning-content`), the registry line (appended after the existing games), the dependency in `apps/web/package.json` and the preview in `apps/web/src/previews.ts` (§ 20), and pastes Appendix A into `docs/third-party.md`. **No new npm dependency** (the data pipeline is a self-written Node script, § 11.4). No shared change is needed for the MVP; § 1.3 lists optional ones.

Binding inputs: `CLAUDE.md`, the implementation brief ("Core product principles", "Geography", "Determinism", "Localization", "Accessibility", "PWA", "Testing philosophy", "Definition of Done"), ADR 0002 (contract), 0003 incl. the 2026-10-24 amendment, 0006 (roles), 0011 (per-locale content, `preload`), 0017 (start screen, `settings`, `settingsOf`, `begin`), 0021 (mutation budget, `*.slow.test.ts`), `docs/third-party.md` and `scripts/check-licenses.mjs`.

---

## 1. Survey: overlap and reuse

### 1.1 Overlap with the catalogue

| Game / deck | Relation | Consequence |
|---|---|---|
| Memory (flag ↔ country, country ↔ capital), *Flags & countries* and *Capitals* decks | Geography as **paired facts** (memorisation). | Atlas Explorer is about the **map**: positions, distances, directions, neighbours, latitude effects. It never asks "capital of X?" or flags. It reuses the decks' **names** (CLDR country names, the curated capital names) so the same city is spelled the same everywhere. |
| Review (spaced repetition) | Learning records for decks. | Not used (decision § 1.4). |
| Network Detective (`graph-detective`), Best Plan (`mini-optimizer`) | Shortest paths, exact optimum shown after a check. | The route mode (§ 9) uses the same honesty: the exact shortest route is computed (BFS) and shown only after the player's own route. |
| Estimation Lab (`fermi-lab`) | Number input, review after commit, calm summary, per-locale content (ADR 0011), `format.ts` with `Intl`. | Same **round shape** and content architecture; numbers via `Intl.NumberFormat` with `bcp47Tag`, `<bdi>`. Atlas Explorer asks no free numeric estimates (that is Estimation Lab's job); distances appear as choices or as feedback. |
| Probability Detective | Marks ●●○ plus words, "Skip — just show me", no grades, `reported` guard, retired-id policy. | Copied patterns (games never import each other). |
| Pattern Memory (`spatial-memory`) | "Spatial" skill, but abstract grids. | No overlap in content. |

No game shows a map yet. Nothing in the catalogue covers latitude, scale, great-circle distance, daylight or time zones.

### 1.2 What is reused

- `@wp/game-core`: `GameModule`, `defineGame`, `createRng`, `seedFromString`, `normalizeSeed`, guards (`isRecord`, `isInt`, `isArrayOf`, `isOneOf`), `createLocaleContent`, `SettingSpec`, `bcp47Tag`.
- `@wp/learning-content`: `countryName(code, locale)` (CLDR via `Intl.DisplayNames`) and `capitalName(code, lang)` / `CAPITALS` (56 curated capitals × 16 languages, incl. the Kyiv/Kyjiw policy). The package has `sideEffects: false`, so only these tables enter the chunk.
- `@wp/ui`: `h`, `clear`, `announce`.
- `@wp/testing`: `runGameContract`, `startGame`, `chooseSetting`, `submitStart`, `expectResumeAfterReload`, `readSave`.
- **Patterns copied:** fermi-lab's `content/index.ts` loader table and `preloadContent`/`contentFor`; probability-detective's review layout (verdict line, marks plus words, stacked cards at 360 px), skip semantics, `reported` guard and retired-id policy; mini-optimizer's sticky status box below 48 rem.

### 1.3 Optional shared changes (report to the orchestrator; not needed for the MVP)

1. **Mutation targets.** `stryker.config.json` mutates only `games/*/src/rules.ts` and `ai.ts`. The important logic here lives in `src/geo.ts`, `src/atlas.ts`, `src/compare.ts`, `src/clues.ts`, `src/route.ts`, `src/generate.ts` and `src/build/*.ts` (four to seven `mutate` lines, orchestrator-owned). Never `src/data/atlas.gen.ts`.
2. **A shared atlas package later.** The spec says geographic content "should be data-driven and reusable by multiple games". The MVP keeps the data in the game package, but `src/data/`, `src/geo.ts`, `src/atlas.ts` and `src/build/` import nothing game-specific, so they can move verbatim to an orchestrator-owned `@wp/atlas` when a second consumer appears (e.g. Memory "country → map position", spec § Geography).
3. **Skills.** The game uses `spatial`, `learning` and `deduction` (§ 2). No new skill is needed.

### 1.4 Spaced repetition: deliberately not used

Learning records would turn located places into "cards" and invite a daily habit. Memory made the same choice (L2 decision: play stays play; *Review* is the intentional learning step). Atlas Explorer is calm practice in rounds, with no memory across rounds. A later "World map" deck for *Review* (country → map position) would be a shared change in `@wp/learning-content` and is out of scope.

---

## 2. Identity

| | |
|---|---|
| Package id | `atlas-explorer` (`@wp/game-atlas-explorer`). It stays neutral, so a later title change touches no saves. |
| English title | **Atlas Explorer** (recommended, owner question 3) |
| German title | **Atlas-Entdecker** (hyphenated like "Netzwerk-Detektiv"; alternative in owner question 3: "Atlas-Expedition") |
| Other locales (draft; translators may adjust) | nl Atlasontdekker · es Explorador del atlas · fr Explorateur d'atlas · ru Исследователь атласа · zh-Hans 地图探索 · ko 지도 탐험 · ja 地図たんけん · ar مستكشف الأطلس · pt Explorador de Atlas · it Esploratore dell'atlante · pl Odkrywca atlasu · tr Atlas Kâşifi · uk Дослідник атласу · hi एटलस खोजी |
| Skills | `spatial` (reading positions, distances, directions), `learning` (geography), `deduction` (mystery country, routes) |
| `typicalMinutes` | `[6, 15]` (one round) |
| `difficulties` | `['easy', 'medium', 'hard']` |
| Input | pointer, touch, keyboard |
| Capabilities | offline, no audio, no AI, no network, no WebGPU, pauseable |
| `stateVersion` | 1 |

---

## 3. Pitch and honest value

**Pitch.** Is Rome further north than New York? Which is closer to Tokyo, Sydney or Paris? When the sun stands highest over Cairo, what does the sun say in Tokyo? Where on the map is the Atacama, and why do so many deserts sit near the tropics? Atlas Explorer is a calm world atlas with questions. You tap the map, compare places, find a country from clues, or travel overland from one country to another across as few borders as possible. After each answer the map opens up: it shows where the place really is, how far you were, the latitude lines, the shortest route on the globe — and you can look around before you go on.

**Claims we may make** (tagline, rules, catalogue):

- "Practice reading a world map: where places lie relative to each other, how far apart they are, and in which direction."
- "Practice reasoning with latitude and longitude: daylight, seasons and sun time."
- "Explore countries, neighbours, rivers, mountains and deserts at your own pace."

**Claims we never make:** "improves your brain/memory/IQ", "makes you a geography expert", any transfer claim. The game says "practice" and "explore".

**Honesty inside the game:**

- Every number is labelled as what it is: "great-circle distance, about 1,420 km", "area as drawn on this map, about", "population estimate 2019 (World Bank, via Natural Earth)", "day length on 21 June, about, calculated from latitude".
- A footer line in the rules and the summary: "Map data: Natural Earth (public domain), version 5.1.2 (2022). Borders show the situation in that data; areas with a disputed status are hatched (§ 12)."

---

## 4. Content principles (binding)

1. **Understanding over trivia.** Every question can be answered by reading or reasoning about the map (or is a well-known anchor place on easy). After each answer the map explains *why* (latitude lines, the great circle, the equal-area comparison).
2. **Politically neutral** (§ 12): disputed areas are marked and belong to no country in the game; they are never the subject of a question; only UN member states are question targets or answer options.
3. **No people, no flags, no rankings of nations** ("richest", "best"). Facts used: position, area, population estimate, neighbours, coast, physical features, daylight, sun time, standard time offset.
4. **Fair numbers.** Comparisons are asked only when the difference is clear (thresholds § 7.2), so rounding, data age or the definition of a border cannot flip the answer.
5. **Sourced, marked as approximate.** Every fact comes from the pinned data (§ 11) or from formulas (§ 10); approximate values say so.
6. **No time pressure, no lives.** Unlimited guesses in the mystery mode; "Skip — just show me" everywhere; nothing is counted against the player.

---

## 5. Round structure and modes

A round is a **fixed list of items**, created at `newGame` and played one at a time. After each item comes its review, with the map free to explore. The next item starts only on "Next". After the last review, "See summary" shows the round summary and the game calls `finished()` once. There are no timers and no feed; the host offers "Another round" only on a deliberate press (ADR 0017).

| Mode (`mode` setting) | Shown name (en) | Items | One item |
|---|---|---|---|
| `find` | **Find it on the map** | 8 | Tap where a country, city, physical feature or coordinate is; see the distance and direction to the real place. |
| `compare` | **Compare places** | 8 | Two or three places and a question (further north, closer, larger, more people, longer day, sun time…); answer, then see the map explain it. |
| `mystery` | **Mystery country** | 4 | Clues arrive one at a time; guess a country by tapping or from the list; each guess tells you how far and in which direction the target lies. |
| `route` | **Overland route** | 4 | Travel from country A to country B one land border at a time; compare with the shortest route. |
| `mixed` (default) | **A bit of everything** | 6 | In this order: find, compare, mystery, find, compare, route. |

A round takes about 1–2 minutes per item (mystery and route items 2–3), so it fits 6–15 minutes.

**Choosing items (pure, seeded).** `rng = createRng(seed)`; each item gets its own sub-seed `seedFromString(`${seed}:${index}`)`, so retries inside one item never shift another. Within a round no place is the main target twice (a set of used place ids), and no compare template appears more than twice. Across rounds there is no memory.

**Region** (`region` setting, § 15): `world`, `africa`, `americas`, `asia`, `europe`, `oceania`. It filters targets (UN M49 region from the data, `REGION_UN`) and sets the initial map view. Oceania has almost no land borders, so route items in Oceania use the whole world (the item header says so, `route.worldwide`); `mixed` in Oceania replaces its route item by a find item.

### 5.1 Avoiding the "school test" feeling

- The frame is an **atlas page**: the map is always the centre; questions sit in a compact card beside or below it.
- **Feedback is distance and direction, not right/wrong**: "About 340 km north-west of the real place ●●○". Marks plus words, never red crosses.
- "**Skip — just show me**" on every item; a skipped item is not scored and not mentioned in the summary.
- **After each answer the map is free to explore**: tap anything to see its name, the distance to the answer, the latitude. This is where much of the learning happens, and it is never scored.
- **No grades, totals, streaks or medals.** The summary describes the round (§ 10.5).

---

## 6. Mode "Find it on the map"

### 6.1 Flow

```
question card ("Where is Nairobi?") ─▶ tap / keyboard cursor sets the marker ◆ (movable) ─Check─▶ review ─Next─▶
                                          └── Skip — just show me ──────────────┘
```

The marker can be moved freely until "Check" (draft in the state). Placing it never reveals anything.

### 6.2 Targets

| Kind | Example prompt | Pool | Distance used |
|---|---|---|---|
| `country` | "Find Kenya." | UN member states of the region, by tier (§ 6.4) | 0 inside the country (or inside a disputed area touching it, § 12.3); else great-circle distance to its nearest boundary point |
| `city` | "Where is Nairobi (Kenya)?" | curated cities (§ 11.3) | great-circle distance to the city point |
| `feature` | "Where is the Atacama Desert?" / "… the Danube?" / "… Lake Baikal?" | curated rivers, lakes, ranges, deserts, plateaus, basins | 0 inside the polygon or within 30 km of the river line; else distance to the feature |
| `point` | "Put the marker at 30° S, 120° E." | generated: whole multiples of 10° (easy: of 30°), on land or sea, |lat| ≤ 70 | great-circle distance to the point |

A tolerance of **25 km** is added to every polygon test (it covers the simplification error, § 11.2, checked by a slow test).

### 6.3 Bands (inclusive upper bounds, km)

| Band | country / feature | city | point | Words (en) | Mark |
|---|---|---|---|---|---|
| `spot` | on target (0) | ≤ 100 | ≤ 150 | "On target" | ●●● |
| `close` | ≤ 300 | ≤ 400 | ≤ 500 | "Close" | ●●○ |
| `near` | ≤ 1,000 | ≤ 1,200 | ≤ 1,500 | "On the right track" | ●○○ |
| `far` | > 1,000 | > 1,200 | > 1,500 | "Further away — see where it is" | ○○○ |

*(calibrate)* within ±30 %. The km value and the band are computed once at "Check" and **stored** (§ 16), so a later data update never changes an old review.

### 6.4 Difficulty

| | easy | medium | hard |
|---|---|---|---|
| Targets | tier 1 countries and cities, major features | tiers 1–2 | all tiers; all UN members |
| Map aids | country borders; for a city, its country is outlined and named in the prompt; graticule every 30° with labels | borders; graticule 30° | coastlines only for city and feature targets (borders hidden); graticule 30° without labels except the Equator |
| Point targets | multiples of 30° | multiples of 10° | multiples of 10° |

**Tiers** come from the data: Natural Earth's cartographic `LABELRANK` (countries: 2 → tier 1, 3–4 → tier 2, ≥ 5 → tier 3; cities and features: their `SCALERANK`/`LABELRANK` likewise), adjusted by a short override list in the data config (§ 11.4) after the implementer prints the lists for review *(calibrate)*.

No country labels are shown while a question is open (that would give the answer); the review shows the labels of the target, the guess and their neighbours.

### 6.5 Review

1. Verdict line: mark + words + "about 340 km north-west of the real place" (16-point compass words, § 10.3).
2. The map zooms to fit both the marker and the target; a dashed great-circle line connects them, labelled with the distance; the target is outlined and patterned, its name shown.
3. One **insight sentence** per target where the content has one (e.g. Atacama: "One of the driest places on Earth; it lies in the rain shadow of the Andes and near a cold ocean current."). Insights are short, factual, optional content (§ 13.3).
4. "Look around": tapping any place shows its name, its distance from the target and its latitude.

---

## 7. Mode "Compare places"

### 7.1 Flow

A question card with two (or three) places, each shown with a symbol (● ■ ▲) on the map and in the options. The map shows the places' markers **without** latitude labels until the answer is committed (on easy, the graticule is visible; it is the tool, not the answer). Options are radio buttons; "Check" commits. The review draws the explanation on the map.

### 7.2 Templates (pure, `src/compare.ts`)

Each template has `draw(rng, pool, difficulty) → params | null`, `answer(params, atlas) → option index`, an **independent oracle** in the tests (§ 21) and an explanation spec. The thresholds make the answer robust (principle 4).

| Id | Question (en) | Places | Fairness threshold easy / medium / hard | Explanation on the map |
|---|---|---|---|---|
| `north` / `south` | "Which is further north?" | 2 cities | Δlat ≥ 6° / 3° / 1° | latitude lines through both, labelled ("41.9° N", "40.7° N") |
| `east` / `west` | "Which is further east?" | 2 cities with |Δlon| ≤ 150° (no date-line ambiguity) | Δlon ≥ 10° / 5° / 2° | meridians through both |
| `closer` | "Which is closer to A: B or C?" | 3 cities | distance ratio ≥ 1.6 / 1.3 / 1.12 | the two great-circle arcs with km; a note when an arc looks curved: "the shortest way on a globe often looks curved on a flat map" |
| `larger` | "Which country is larger?" | 2 UN members | area ratio ≥ 1.6 / 1.3 / 1.3, holding for both `areaCore` and `areaMax` (§ 11.3) | both outlined; areas "about 2.4 million km²"; the equal-area note (below) |
| `people` | "Where do more people live?" | 2 UN members | population ratio ≥ 2 / 1.5 / 1.5 | the two estimates with year and source |
| `density` | "Where do people live closer together (more people per km²)?" | 2 UN members (hard only) | density ratio ≥ 2 for both area variants | people per km², "about" |
| `daylight` | "Around 21 June, where is the day longer?" (or 21 December) | 2 cities | day-length difference ≥ 3 h / 1.5 h / 45 min | day lengths "about 18 h 50 min" and the tilt sentence ("In June the northern half of the Earth leans towards the sun") |
| `midnight` | "Around 21 June, does the sun set in A?" (yes/no) | 1 city, |lat| ≥ 68° or ≤ 64° (none in between) | medium/hard | the Arctic/Antarctic Circle drawn and named |
| `season` | "In July, is it summer or winter in A?" | 1 city, |lat| ≥ 30° | easy/medium | the Equator and the hemisphere |
| `tropics` | "Which of these cities lies in the tropics?" | 3 cities, one with |lat| ≤ 21.4°, two with |lat| ≥ 25.4° | all | the Tropics of Cancer and Capricorn (23.44°) |
| `suntime` | "When the sun stands highest in A, about what time does the sun say in B?" | 2 cities, |Δlon| ≥ 30°, Δlon/15 within 0.3 of a whole hour | medium/hard; options: the right whole hour and three distractors (±1 h, ±2 h, opposite sign) | "The Earth turns 15° every hour: 109° east is about 7 hours later"; meridians drawn |
| `clock` | "If it is 12:00 standard time in A, what time is it in B (standard time, ignoring daylight saving)?" | 2 cities with stored standard offsets that differ by whole hours | hard | the two offsets ("UTC+2", "UTC+9") and, where it differs from sun time, a sentence ("All of China uses one time zone") |

**Pools.** City templates draw from the curated cities of the region (both inside the region; `world` = all) and the difficulty's tiers; country templates from UN members. A `curated` list of **insight pairs** in the data config (e.g. Paris–Montreal, Rome–New York, Berlin–Edmonton for `north`; Lagos–London for `east`) is used for at most one item per round, only where it passes the threshold of the difficulty.

**The equal-area note** (in `larger` reviews and in the rules): "This map keeps areas true. On many wall maps (Mercator projection) countries far from the Equator look much larger than they are." On hard, when one country is at |lat| ≥ 50° and the other near the Equator, the review adds the factor by which a Mercator map would exaggerate it (`1/cos²(lat)` at its label point, rounded, "about ×4").

**Generator.** Per item: pick a template allowed at the difficulty (weights *(calibrate)*: position 3, distance 2, size/people 2, sun and seasons 3), then draw places until the threshold holds (≤ 200 attempts; a test keeps failures below 0.5 % over 500 seeds per region and difficulty; on failure another template is drawn). Option order is shuffled with the item rng.

---

## 8. Mode "Mystery country"

### 8.1 Flow

```
clue 1 ─▶ [guess (tap or list) ▸ feedback card] × n  ─▶ … ─▶ "Next clue" (any time) … ─▶ solved / "Show me" ─▶ review
```

- The first clue is shown at once. "Next clue" reveals the next one at any time; guesses are unlimited; there is no penalty for either.
- **Guessing:** tap a country on the map (tap → the country under the finger, or a disambiguation popup for several small countries within 22 px, 44 px buttons) and confirm with "Guess", or type in the **country search** (a combobox of the UN members in the UI language, `Intl.Collator` base sensitivity, accent- and case-insensitive prefix/substring match) and press "Guess".
- **Feedback per wrong guess** (a card, newest first, and on the map the guess hatched with an arrow towards the target): "Not Peru. The country's centre lies about 1,900 km south-east of Peru's centre." Plus "Peru borders it ✓" when they are neighbours. Centres are Natural Earth's label points (`LABEL_X/Y`); the sentence says "centre" so it is honest about what is measured.
- **Solved** when the guess is the target. "Show me" ends the item without solving.

### 8.2 Clue catalogue (facts precomputed by the data script, § 11.3; predicates pure in `src/clues.ts`)

| Clue id | Text (en) | Fact |
|---|---|---|
| `region` / `subregion` | "It lies in Africa." / "… in Western Africa." | UN M49 region and sub-region (Natural Earth `REGION_UN`, `SUBREGION`); transcontinental countries say "lies mostly in" (flag in the config) |
| `ns` | "Its main territory lies entirely north of the Equator." / "… south …" / "The Equator crosses it." | home territory (§ 11.3) latitude extent |
| `ew` | "… east of the Prime Meridian." / "… west …" / "The Prime Meridian crosses it." | longitude extent |
| `line` | "The Tropic of Cancer crosses it." (Capricorn, Arctic Circle) | extent vs 23.44°, 66.56° |
| `coast` | "It has no sea coast." / "It has a sea coast." | landlocked flag |
| `island` | "It lies only on islands." | no home part on a continental landmass |
| `nbCount` | "On this map it shares a land border with 4 countries." | neighbour count (UN members, § 12.3) |
| `nb` | "One of its neighbours is Brazil." | a neighbour, preferring a lower tier |
| `area` | "It is larger than France." / "smaller than …" | ratio ≥ 1.3 against a reference country |
| `people` | "More people live there than in Canada." / "fewer …" | ratio ≥ 1.5 |
| `river` | "The Danube flows through it." | river line inside the home territory ≥ 50 km |
| `range` / `desert` | "Part of the Andes lies in it." / "… the Sahara …" | the feature covers ≥ 10 % of the home territory, or ≥ 5 % of the feature lies in it (a big feature's fuzzy edge — the Sahara reaches 2–9 % into countries of the Sahel — is no fact to rely on); a country it reaches only a little is never ruled out by the clue |
| `capital` | "Its capital lies further north than Madrid." | only for countries whose capital is among the curated cities, Δlat ≥ 1° |

### 8.3 Clue order and fairness

Candidates are **all UN members** (a player may know a country outside the tier). The generator, per item:

1. Picks the target from the region and tier pool.
2. Computes every true clue of the target (each clue with its concrete parameter: which neighbour, which reference country).
3. Builds the order greedily with the item rng: the first clue must leave ≥ 12 candidates (easy ≥ 6), each further clue must remove at least one candidate, and the clues must end with **exactly one candidate**, the target. 4–7 clues (easy 3–5). Broad clues come first (region, hemispheres, coast), specific ones later (neighbour, river, capital).
4. Rejects and redraws the target if no such order exists (≤ 50 attempts; a test keeps failures below 1 %).

A test proves with an **independent filter** (the clue predicates re-implemented on the raw facts, without the generator's code) that after all clues exactly the target remains (§ 21.1).

### 8.4 Review

The target outlined, all guesses with their arrows, the clues each checked against the target on the map (e.g. the Equator drawn, the river highlighted, the neighbours labelled). A line: "Found after 4 clues and 2 guesses." — descriptive, never compared with a par.

---

## 9. Mode "Overland route"

### 9.1 Flow

"Travel by land from Portugal to Poland, crossing as few borders as possible." The current country is outlined (bold) and its neighbours are highlighted with a dotted pattern and listed as buttons (names in the UI language, sorted with `Intl.Collator`). Tapping a highlighted neighbour on the map or pressing its button moves there; the path is drawn as a line between label points with numbered steps. "Back" removes the last step (unlimited). The item ends when the goal is reached or with "Show a shortest route".

### 9.2 Graph and generator

- Nodes: UN members; edges: land borders under the neutrality rule (§ 12.3: at least 5 km of shared border outside disputed areas). Bridges, tunnels and ferries do not count; the rules say so ("land borders as drawn on this map").
- The pair (A, B) is drawn so that the shortest number of crossings `best` is 2–3 (easy), 4–5 (medium), 6–8 (hard), both in the same connected component, and at least one of them in the region (unless Oceania, § 5).
- `best` and the number of shortest routes are computed by BFS at generation and **stored** (§ 16).
- On easy a small compass shows the direction from the current country to the goal (bearing between label points).

### 9.3 Review

"You crossed 5 borders; the shortest routes cross 4 (there are 3 of them). One of them: Portugal → Spain → France → Germany → Poland." The shortest route is drawn dashed next to the player's. If the player found a shortest route: "One of the shortest routes ✓".

---

## 10. Geometry and formulas (pure, `src/geo.ts`)

All functions are pure, deterministic and unit-tested; floats are fine (no state depends on float rounding except the stored, integer-rounded results of § 16).

### 10.1 Projection: Equal Earth

Equal Earth (Šavrič, Patterson & Jenny, *International Journal of Geographical Information Science*, 2019; a published formula, own implementation): equal-area, so area comparisons on the map are honest (§ 7.2), and pleasant for world maps.

```
θ = asin(√3/2 · sin φ)
x = 2√3 · λ · cos θ / (3 · (9 A4 θ⁸ + 7 A3 θ⁶ + 3 A2 θ² + A1))
y = A4 θ⁹ + A3 θ⁷ + A2 θ³ + A1 θ          A1 = 1.340264, A2 = −0.081106, A3 = 0.000893, A4 = 0.003796
```

The inverse (for taps) solves `y(θ)` by Newton's method (≤ 8 iterations, |Δθ| < 1e-12), then `φ = asin(2 sin θ / √3)`, `λ = 3x(9A4θ⁸ + 7A3θ⁶ + 3A2θ² + A1) / (2√3 cos θ)`. Points outside the outline (|λ| > π) are rejected ("off the map"). The map is centred on 0° (Natural Earth already splits polygons at ±180°).

### 10.2 Distances and areas

- **Great-circle distance:** haversine on a sphere of radius 6,371.0088 km (mean Earth radius). Displayed rounded to 2 significant digits above 1,000 km ("about 1,400 km") and to 10 km below. The rules say "on a sphere, about"; the error versus the ellipsoid (≤ 0.5 %) is far below every threshold.
- **Point to polygon:** inside test (even–odd on the decoded lon/lat rings with the antimeridian split), else the minimum over boundary segments of the spherical cross-track distance (clamped to the segment ends), with a bounding-box prefilter.
- **Areas** are not computed at runtime; the data script computes spherical polygon areas from the full-resolution data (§ 11.3).

### 10.3 Directions

Initial bearing from A to B, mapped to 16 compass words (N, NNE, NE, …; sector boundaries at 11.25° + k·22.5°), shown as words ("north-west"), never as arrows alone. Feedback sentences use 8 words on easy and 16 on medium/hard. For the guess feedback the bearing is from the guess (marker or centre) to the target.

### 10.4 Daylight and seasons

Solar declination δ = +23.44° on 21 June, −23.44° on 21 December. Day length from the sunrise equation with the standard altitude −0.833° (refraction and the sun's disk): `cos ω₀ = (sin(−0.833°) − sin φ sin δ) / (cos φ cos δ)`; day length `= 2ω₀ / 15°` hours; `cos ω₀ < −1` → "the sun does not set", `> 1` → "the sun does not rise". The rules say "calculated from latitude, about". With refraction, the midnight-sun boundary on 21 June lies near 65.7° (not exactly at the Arctic Circle, 66.56°); the `midnight` template keeps cities at least 1.7° away from it (≤ 64° or ≥ 68°, § 7.2), so the simplified model cannot flip the answer, and the review names both lines.

### 10.5 Sun time and clock time

Sun time difference = Δλ / 15° hours (4 minutes per degree), east = later. Standard clock offsets per city are stored (§ 11.3). Both are explained side by side in `clock` reviews.

---

## 11. Map data: source, licence, pipeline, budget

### 11.1 Source and licence

**Natural Earth**, vector data **version 5.1.2** (release 2022-05-13, the latest release at the time of writing; the repository's master is `5.2.0-pre`), from the official repository `nvkelso/natural-earth-vector`, tag `v5.1.2`, GeoJSON folder. Terms of use (naturalearthdata.com/about/terms-of-use): *"All versions of Natural Earth raster + vector map data found on this website are in the public domain. You may use the maps in any manner, including modifying the content and design, electronic dissemination, and offset printing. […] No permission is needed to use Natural Earth. Crediting the authors is unnecessary."* We credit voluntarily ("Made with Natural Earth").

Why not the alternatives: **GeoNames** is CC BY 4.0 (attribution duties on every copy; not needed, since Natural Earth's place names already come from Wikidata, CC0); **OpenStreetMap** is ODbL (share-alike database obligations; far more detail than a world atlas needs). **Natural Earth's own name fields** come from Wikidata (CC0) and are only a draft for our curated names (§ 13).

Layers used (all at tag v5.1.2; SHA-256 observed on 2026-10-26, to be re-verified by the script):

| File | Use | SHA-256 |
|---|---|---|
| `ne_10m_admin_0_map_units.geojson` | countries (split into map units, so overseas parts can be told apart: `HOMEPART`) | `57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862` |
| `ne_10m_admin_0_countries.geojson` | country attributes (ISO codes, `LABELRANK`, `POP_EST`, `POP_YEAR`, `REGION_UN`, `SUBREGION`, label points) | `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255` |
| `ne_10m_admin_0_disputed_areas.geojson` | disputed-area overlay (§ 12) | `9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5` |
| `ne_10m_admin_0_countries_<pov>.geojson` (32 point-of-view files) | **build-time check only** (§ 12.4), never shipped | recorded by the script |
| `ne_50m_lakes.geojson` | lakes | `d350b75978b26fe839b797c2c529b2fb8f47fb3983c03f4964e36d5df9378a52` |
| `ne_50m_rivers_lake_centerlines.geojson` | rivers (selected) | `f286e0ce978fde999ca2d7a78c764be08542e19b63cded52b05c12d5173ccc51` |
| `ne_50m_geography_regions_polys.geojson` | ranges, deserts, plateaus, basins (selected) | `33396643d8f0eed408e80bf5ca43dcdb7993f790fdc4eadae311660f8b91fe76` |
| `ne_50m_populated_places.geojson` | city coordinates and draft names (selected) | `da4662b7bbfeb897d02f228c5839131dce27acff5717630f91ccff4f67828ee7` |
| `ne_10m_land.geojson` | continental landmasses (for the `island` fact) | recorded by the script |

Further sources, all facts or public domain:
- **IANA Time Zone Database** (public domain), read at build time through Node's built-in ICU (`Intl.DateTimeFormat` with `timeZone`) to derive each curated city's standard UTC offset; the tz version (`process.versions.tz`) goes into the manifest. Natural Earth's `TIMEZONE` field is not used directly (it is missing for Moscow and uses the deprecated `Asia/Harbin` for Beijing); the config names each city's IANA zone.
- **UN member states** (193, un.org list; facts) in `src/data/un-members.ts`.
- **Test oracles only, not shipped:** land-border and landlocked facts transcribed from the *CIA World Factbook* (US government work, public domain) for a sample (§ 21.3).

### 11.2 What the prototype measured (2026-10-26, Python on the downloaded files; Appendix B)

Countries from 10m, projected (Equal Earth), quantised to a 16,384-cell grid across the map width (1 cell ≈ 2.1 km), shared borders stored once (topology), Visvalingam–Whyatt simplification per border arc with fixed arc ends, islands below a minimum area dropped (except each country's largest part):

| Variant | Islands kept | Simplification (cells²) | Vertices | Packed | ≈ ASCII in JS | ≈ gzip |
|---|---|---|---|---|---|---|
| **detailed (recommended)** | ≥ 100 km² | 36 | ~24,600 | 60 KB | ~80 KB | ~55 KB |
| medium | ≥ 100 km² | 100 | ~16,900 | 45 KB | ~60 KB | ~42 KB |
| light | ≥ 1,000 km² | 300 | ~7,600 | 22 KB | ~29 KB | ~20 KB |
| (for reference: Natural Earth 1:110m countries 10,654 vertices, 1:50m 99,613, 1:10m 548,471) | | | | | | |

Other layers (detailed settings): disputed overlay ~2.5 KB packed, lakes ~6–8 KB, selected rivers ~6 KB, selected physical regions (~30, stronger simplification) ~8 KB, cities and facts ~10 KB.

**Recommended budget (owner question 2): the detailed variant.** At a 1,000 px wide map, one pixel is 16 cells; the detailed threshold (36 cells²) stays below about 0.15 px² at the world view and still looks smooth at 4× zoom; at 8× it starts to look angular, which is acceptable for an atlas of countries. The simplification error is far below the 25 km scoring tolerance (§ 6.2; checked by a slow test).

### 11.3 Data model (generated module)

`src/data/atlas.gen.ts` (generated, header "Generated by scripts/build-atlas — do not edit", plus the manifest hash) exports plain data only:

```ts
export const ATLAS_DATA = {
  id: 'ne-5.1.2/1',                 // source version / our pipeline version; stored in saves (§ 16)
  arcUnit: 50,                      // arc coordinates: integer lon/lat in 1/50 degree
  arcs: '…',                        // all border/coast arcs, delta + zigzag + 5-bit printable encoding (one string)
  countries: [ { id: 'KE', iso: 'KE', un: true, tier: 1, region: 'africa', sub: 'eastern-africa',
                 rings: '…',        // arc references per ring (signed: reversed), encoded
                 home: [/* ring indices of the home territory */], label: [3786, 38], // points: lon/lat in 1/100 degree
                 pop: 0, popYear: 2019, areaCore: 0, areaMax: 0,  // from the data (people; km², rounded)
                 nb: ['ET', 'SO', 'SS', 'TZ', 'UG'], coast: true, island: false,
                 rivers: [], ranges: [], deserts: [], lines: 0b0001 /* equator… */ } , … ],
  others: [ /* non-UN map units (e.g. Greenland, New Caledonia, Antarctica): id, rings, label; never asked */ ],
  disputed: [ { id: 'd17', rings: '…' } ],      // overlay polygons (§ 12), no names
  dots: [ { id: 'MC', lon: 742, lat: 4374 } ],  // countries too small to draw at world view (drawn as circles)
  lakes, rivers, regions: [ { id: 'atacama', kind: 'desert', tier: 1, rings | lines: '…', label: […] } ],
  cities: [ { id: 'nairobi', country: 'KE', capital: true, tier: 1, lon: 3681, lat: -128, tz: 180 /* min */ } ]
} as const;
```

- **Encoding.** Arc coordinates are stored as integer lon/lat in **1/50 degree** (≤ 1.1 km; projection-independent, so geodesic maths needs no inverse projection); points (cities, label points, dots) and the state use **1/100 degree**. Topology and simplification run on the projected 16,384-cell grid (§ 11.2) before the coordinates are written as lon/lat. Arcs are delta-encoded, zigzag, written as 5-bit groups with a continuation bit in printable ASCII (the well-known "encoded polyline" idea, own code) inside a JSON string literal (the script writes it with `JSON.stringify`, so `\` and quotes are escaped). Decoding all arcs takes a few milliseconds (budget § 22).
- **Topology.** Shared borders are one arc used by two countries (one reversed); rings are lists of arc references. Simplifying arcs with fixed ends keeps neighbours gap-free. Arcs between map units of the same country are dropped (dissolve), so e.g. England/Scotland are one United Kingdom.
- **Facts are computed at full resolution in the script**, not from the simplified geometry: neighbours (§ 12.3), coast (an arc of the home territory that borders no other polygon and is not a lake shore), `island`, the latitude lines crossed by the home territory, rivers/ranges/deserts inside it, `areaCore` (spherical area excluding disputed overlays) and `areaMax` (including every overlay that touches the country), standard UTC offsets (min of the offsets on 15 January and 15 July 2026, i.e. without daylight saving).
- **Home territory** = the map units with Natural Earth's `HOMEPART = 1` (e.g. France without French Guiana and Réunion), used for the clue facts; scoring uses all parts of a country.
- **Ids are stable and never reused or removed** (a feature that should no longer appear gets `retired: true` in the config and stays in the data), so saves stay valid (§ 16).

`src/data/index.ts` exposes `loadAtlas(): Promise<Atlas>` (one dynamic `import('./atlas.gen')`, decoded once and cached) and `atlasSync(): Atlas` (throws if not loaded, like `contentFor`). The module's `preload(locale)` awaits `loadAtlas()` and the locale content in parallel (ADR 0011). Rules functions take the decoded `Atlas` as a parameter, so tests import the generated module directly.

### 11.4 Build pipeline (dev-only, no dependencies)

- `packages/games/atlas-explorer/scripts/build-atlas.ts`, a thin CLI run with Node ≥ 22 (`node --experimental-strip-types …`; if that proves awkward with the repository's TypeScript settings, an `.mjs` file with `// @ts-check` and JSDoc types is acceptable). The pure steps live in `src/build/*.ts` (typechecked and unit-tested, never imported by runtime code, so never bundled): `geojson.ts` (reading), `project.ts`, `topology.ts` (quantise, junctions, arcs, dissolve), `simplify.ts` (Visvalingam–Whyatt with a heap; arc ends fixed; rings keep ≥ 4 points), `facts.ts`, `encode.ts`, `raster.ts` (§ 12.4).
- `scripts/atlas-config.json`: source URLs and expected SHA-256 per file, the parameters (grid, thresholds, minimum island area), the selection of cities, rivers, lakes and regions (by Natural Earth `NE_ID`, plus the IANA zone per city), tier overrides, the `retired` list, the insight pairs and the documented exceptions of § 12.
- Steps: `--download` (optional; fetches the pinned URLs into `packages/games/atlas-explorer/.cache/natural-earth-5.1.2/`, ignored by a package-local `.gitignore`) → verify SHA-256 (abort on mismatch) → build → write `src/data/atlas.gen.ts` and `src/data/manifest.json` (sources, versions, hashes, parameters, Node and tz versions, counts, output SHA-256) → print a report (sizes, tier lists, neighbour changes against the previous manifest, the worldview check of § 12.4).
- **CI never downloads.** The generated module and the manifest are committed; a fast test checks the output hash against the manifest and the budget (§ 21.2). Updating the data (e.g. a new Natural Earth release) is a deliberate change: run the script, review the report, commit.
- Raw downloads are never committed (≈ 430 MB including the 32 worldview files).

### 11.5 Offline and loading

The generated module is one lazily loaded chunk (`assets/atlas.gen-*.js`), precached by the service worker like every other chunk (`globPatterns` covers `.js`); no runtime network, no CSP change. It loads on the first opening of the game (in `preload`), never on the home page.

---

## 12. Disputed areas and neutrality (owner question 1)

### 12.1 Findings

- Natural Earth's default view is **de facto** ("We show who actually controls the situation on the ground"). In 5.1.2 the default countries layer, for example, puts **Crimea inside Russia** and the Moroccan-administered part of Western Sahara inside Morocco; the 1:110m layer even puts Transnistria into Ukraine (a generalisation artefact).
- The data is from May 2022: it does not reflect later changes of control (e.g. Nagorno-Karabakh 2023, areas of Ukraine occupied since 2022).
- Natural Earth ships a **disputed-areas layer** (10m: 99 features; 79 of type *Disputed*, *Indeterminate* or *Breakaway*; the rest are leases, overlays and administrative sub-units) and **32 point-of-view variants** of the countries layer (31 governments' official views plus ISO).
- The planner rasterised all 33 views at 0.2° (Appendix B): **outside the disputed-areas layer, all views agree**, except (a) the Republic of China view, which assigns mainland China to Taiwan; (b) leases, overlays and sub-units (Baikonur, Guantánamo, the Korean DMZ, Ceuta in Morocco's view, the South Sandwich Islands in Argentina's view, Dhekelia); and (c) one coding artefact near Barbados. Inside the layer is everything usually called disputed (Kashmir, Aksai Chin, Arunachal Pradesh, Western Sahara, Crimea, the 2014 Donbas areas, Abkhazia, South Ossetia, Transnistria, Nagorno-Karabakh, Kosovo, Taiwan, Somaliland, Northern Cyprus, the Golan Heights, the West Bank and Gaza, the Kuril Islands dispute, the Falklands/Malvinas, Essequibo, the Halaib Triangle, Bir Tawil and smaller ones).
- One feature of the layer covers **the whole of Israel** (non-recognition by some states, not a border dispute); another three cover all of Kosovo, Taiwan and Somaliland respectively.

### 12.2 Recommended policy: "mark, don't decide"

1. Draw the Natural Earth default linework (simplified).
2. Draw every feature of the disputed-areas layer of type *Disputed*, *Indeterminate* or *Breakaway* on top, **opaque, with a neutral hatch** (grey diagonal cross-hatch, dashed outline) and the generic label "Area with a disputed status" — **no claimant names, not coloured as any country**. The underlying de facto assignment is therefore never visible.
3. **Exception:** a feature that covers ≥ 90 % of a UN member state is not drawn (it expresses non-recognition of a member state, not a border dispute). In 5.1.2 this is only the feature covering Israel. The rule is computed by the script and listed in the manifest.
4. **Only UN member states** are targets or answer options. Other entities (Taiwan, Kosovo, Western Sahara, Palestine, Somaliland, Northern Cyprus, dependencies, Antarctica) are drawn, can be explored in reviews (with CLDR names where CLDR has one and the disputed label where hatched) and are never asked about.
5. **No manual edits** to the data: every hand-made border change would be our own political judgement. The rules state the data date. When Natural Earth publishes a new release, the data is updated (§ 11.4).
6. Rules text (en): "Borders follow Natural Earth (public-domain map data, 2022). Areas whose status is disputed are hatched and belong to no country in this game. This is not a statement about any claim."

### 12.3 Consequences in the rules

- **Scoring:** a tap inside a hatched area that touches the target country counts as on target (the game neither confirms nor denies that the area belongs to it).
- **Neighbours:** two countries are neighbours when they share **at least 5 km of border outside hatched areas** (a border segment counts as hatched when either side of it lies in a hatched area). Measured in the prototype: this removes, among others, China–Pakistan (whole border in Pakistani-administered Kashmir) and Somalia–Djibouti (only via Somaliland); Morocco–Mauritania and India–Afghanistan share no border outside disputed areas in the data at all. It keeps Russia–Ukraine, India–China, Morocco–Algeria, Armenia–Azerbaijan and Guyana–Brazil (70 of 1,082 km outside the hatched Essequibo area). Clue texts say "on this map" (§ 8.2).
- **Areas:** comparisons use both `areaCore` and `areaMax` (§ 7.2), so no answer depends on who owns a disputed area.
- **Facts never mention** a disputed area (no clue "it borders Western Sahara").

### 12.4 Build check

The script rasterises the 32 point-of-view files and the default view at 0.2° and reports every cell outside the hatched areas where views disagree. The run fails unless all disagreements fall under the documented exceptions in the config (the ROC view of mainland China; leases, overlays and sub-units by Natural Earth type; the Israel whole-state feature; cells smaller than 5,000 km² in total per pair, as artefacts). This makes the neutrality claim checkable on every data update.

### 12.5 Alternatives for the owner

| | Policy | For | Against |
|---|---|---|---|
| **A (recommended)** | Mark, don't decide (§ 12.2) | Consistent, explainable, checkable against all 32 worldviews; no one's map is adopted | Large hatched areas (Kashmir, Western Sahara, Essequibo, Taiwan); a few neighbour relations disappear |
| B | Natural Earth default (de facto) without marks | Simplest | Shows e.g. Crimea as Russian without any note; stale since 2022 |
| C | One government's view, e.g. Germany's (`deu`) | Matches one official position (Crimea in Ukraine, Kosovo a country, Taiwan separate…) | Adopts one country's politics for a worldwide, 16-language audience |
| D | A, plus manual updates since 2022 (Nagorno-Karabakh, occupied areas of Ukraine) | More current | Each edit is our own political judgement; needs ongoing maintenance |

---

## 13. Names and localisation strategy

### 13.1 Countries

`countryName(code, locale)` from `@wp/learning-content` (CLDR via the browser's `Intl.DisplayNames`), exactly as the *Flags & countries* deck: correct, complete and maintained in every UI language, nothing bundled. If the browser has no region names for the locale (`hasCountryNames` false), the English CLDR name is used and marked `lang="en"`; if even that fails, the code (never blank). The search list (§ 8.1) uses the same names.

### 13.2 Cities and physical features

CLDR has no city, river or mountain names. **Curated per-locale names**, as for the *Capitals* deck: the conventional exonym of each language, written for the project, for every curated feature in all 16 locales (no shipped fallback; a test requires every name). Sources and conventions:

- The 56 capitals of the *Capitals* deck come from `capitalName` (one source of truth, incl. the Kyiv/Kyjiw policy and "Meksyk (miasto)").
- All other names are **drafted by the script from Natural Earth's `NAME_xx` fields** (public domain, derived from Wikidata, CC0) into a review file, then **edited** into `src/content/<locale>.ts`. The draft is not shippable as-is (checked on 2026-10-26): Portuguese is European ("Moscovo", "Teerão", "Nova Iorque" → Brazilian "Moscou", "Teerã", "Nova York"), `NAME_ZH` mixes traditional characters ("鄂畢河" → "鄂毕河"), Japanese adds "市" ("北京市"), German has "Kiew" (project: "Kyjiw"), Hindi adds "नगर"/"नदी" inconsistently.
- Conventions: everyday short names ("Danube", "Donau", "Dunaj"), no official long forms; generic terms only where the language always uses them ("Lake Baikal", "Baikalsee", "贝加尔湖"); Brazilian Portuguese; Simplified Chinese; the same disambiguation rule as the capitals deck where a city and its country share a name.
- Volume: ≈ 64 non-capital cities + 56 capitals (from the deck) + ~25 rivers + ~12 lakes + ~30 regions + ~10 seas/oceans for labels ≈ **140 new names × 16 locales** (≈ 2,240 strings), similar to the *Capitals* deck × 2.5.

**Selection** (in the config, reviewed by the owner with the tier lists): cities — the 56 capitals of the deck (e.g. Mexico City, Lima, Reykjavik) plus ≈ 64 further cities spread over all regions and latitudes (e.g. New York, Los Angeles, Toronto, Vancouver, Edmonton, Montreal, São Paulo, Rio de Janeiro, Manaus, Lagos, Johannesburg, Cape Town, Addis Ababa, Kinshasa, Istanbul, Mumbai, Kolkata, Karachi, Shanghai, Hong Kong, Osaka, Sydney, Melbourne, Perth, Auckland, Tromsø, Murmansk; capitals among them are flagged), so the daylight and midnight-sun templates have cities on both sides of their margins; rivers — Nile, Amazon, Yangtze, Mississippi, Missouri, Ob, Yenisey, Lena, Amur, Congo, Niger, Zambezi, Mekong, Ganges, Indus, Brahmaputra, Huang He, Danube, Volga, Rhine, Paraná, Orinoco, Murray, Mackenzie, St. Lawrence, Euphrates, Tigris (where present in the 50m layer); lakes — Caspian Sea, Superior, Victoria, Huron, Michigan, Tanganyika, Baikal, Great Bear, Malawi/Nyasa, Titicaca, Ladoga, Balkhash; regions — Alps, Andes, Himalayas, Rocky Mountains, Appalachians, Ural, Caucasus, Atlas, Carpathians, Pyrenees, Scandinavian Mountains, Great Dividing Range, Tian Shan, Hindu Kush, Ethiopian Highlands, Drakensberg, Sahara, Gobi, Kalahari, Namib, Atacama, Rub' al Khali, Taklamakan (if present), Thar, Great Victoria, Great Sandy, Karakum, Tibetan Plateau, Deccan Plateau, Amazon basin, Congo basin. *(calibrate)*: the implementer may drop features whose Natural Earth geometry is too coarse to answer fairly.

Names that would be contested are avoided as features (e.g. no sea whose name differs by country, such as the Sea of Japan/East Sea or the Persian/Arabian Gulf, is a question target; such seas get no label at all).

### 13.3 Texts

- `src/messages.ts` + `src/locales/<locale>.ts` — UI strings (≈ 160 keys): identity, settings, buttons, bands, compass words (16), coordinate formats, template questions, feedback sentences, summary phrases, the rules and the data note.
- `src/content/<locale>.ts` (ADR 0011, loaded by `preload`): feature names (§ 13.2), sub-region names (UN M49, 22), clue sentences, insight sentences (≈ 40, one or two lines each, factual, e.g. "Most large hot deserts lie near the tropics, around 20–30° from the Equator, where dry air sinks."), the explanation sentences of the templates.
- Volume estimate per locale: ≈ 160 UI + ≈ 140 names + ≈ 120 content sentences.

### 13.4 Number and coordinate formatting (`src/format.ts`, pure, tested)

- Distances: `Intl.NumberFormat(bcp47Tag(locale), { style: 'unit', unit: 'kilometer', maximumSignificantDigits: 2 })` above 1,000 km (rounded to 10 km below); in-game display preference "miles" (`unit: 'mile'`).
- Areas: `{n} km²` with `Intl` grouping, 2 significant digits; populations: `notation: 'compact', compactDisplay: 'long'` ("214 million", "214 Millionen") with "about".
- Durations: `Intl.NumberFormat` with `unit: 'hour'`/`'minute'`, `unitDisplay: 'long'` ("7 hours"), so no own plural rules are needed.
- Coordinates: message templates `coord.n` "{d}° N", `coord.s`, `coord.e`, `coord.w` per locale (e.g. de "{d}° N", fr "{d}° N", ru "{d}° с. ш."), digits via `Intl`; shown in `<bdi>`.
- Compass words per locale (`dir.n`, `dir.nne`, …).

---

## 14. Map rendering and interaction (`src/map-view.ts`)

### 14.1 Rendering

- **One SVG**, `viewBox` in projected units, built once per game page (countries ≈ 250 paths, overlay, lakes, rivers, regions, graticule, markers). Zoom and pan change only the `viewBox`; strokes use `vector-effect: non-scaling-stroke`, markers are counter-scaled, so nothing is rebuilt while zooming.
- Layers (bottom → top): ocean background; land (countries, neutral land colour with thin borders); lakes; rivers; regions (only in their own questions and in reviews, as outlined, patterned areas); disputed overlay (opaque, cross-hatch); graticule (30° or 10°) with the Equator, tropics and polar circles as distinct line styles (solid, dashed, dotted) and labels; question markers; answer layer (target outline + pattern, guess marker, great-circle lines).
- **No colour-only information:** target = bold outline + diagonal stripes; guess = dotted outline + ◆ marker with a text label; neighbours (route) = dotted fill + names in the list; disputed = cross-hatch + label; places in compare = ● ■ ▲ markers with names. Forced-colours mode uses system colours; patterns and line styles carry the differences.
- Labels appear in reviews and while exploring, never during an open question (except the places a question names). Labels use logical text anchors and `<bdi>`; the map itself is never mirrored in RTL (geography has its own direction; repository precedent: boards are not mirrored).
- Small countries without a drawable shape at the current zoom are drawn as dots with a minimum radius (non-scaling).

### 14.2 Pointer and touch

- One-finger drag pans (pointer capture); pinch zooms (two pointers); mouse wheel zooms around the pointer when the map has focus or is hovered; zoom 1×–8×, pan clamped to the world outline.
- A **tap** (movement < 8 px) sets the marker in find mode, selects a country in mystery/route mode, or shows a place while exploring. Moving the marker is a new tap; nothing is committed without the "Check"/"Guess" button, so a mis-tap costs nothing.
- Buttons (44 px): zoom in, zoom out, "Fit" (back to the region view). At 360 px they sit in the map's corner (inline-end, logical properties).

### 14.3 Keyboard (the map element is focusable, `role="application"`, `aria-roledescription` "map")

- Arrow keys move a **crosshair cursor** by 2 % of the view (Shift: 10 %); the view follows the cursor. `+`/`-` zoom around the cursor, `0` fits the view.
- Enter sets the marker (find) or selects the country under the cursor (mystery/route); then Tab reaches "Check"/"Guess".
- A polite live region announces, after the key is released (not on every repeat): "Cursor at 41° N, 12° E · land" — plus, in reviews and exploring, the place under the cursor and its distance from the target. During find questions, the nearest **curated city that is not the target and not in the target country** is added ("nearest listed city: Bern, 600 km north-west"), so keyboard and screen-reader players can orient themselves.
- All other controls are ordinary buttons, radios and the combobox, in a logical Tab order: question card → map → map buttons → answer controls.

---

## 15. Settings (start screen) and `settingsOf`

```ts
settings: [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode',
    values: ['find', 'compare', 'mystery', 'route', 'mixed'], default: 'mixed', display: 'radio', hintKey: 'mode.hint' },
  { kind: 'choice', id: 'region', labelKey: 'region.label', valueKey: 'region',
    values: ['world', 'africa', 'americas', 'asia', 'europe', 'oceania'], default: 'world' },
  { kind: 'difficulty' }
]
settingsOf: (state) => ({ mode: state.mode, region: state.region, difficulty: state.difficulty })
```

- Five modes as radio buttons (`display: 'radio'`, they are the main choice); six regions as a labelled select.
- Difficulty labels: `difficulty.easy` "Easy (well-known places, more help on the map)", `difficulty.medium` "Medium", `difficulty.hard` "Hard (all countries, less help)".
- `newGame` treats `options.settings` as untrusted (unknown mode → `mixed`, region → `world`, difficulty → `easy`). `begin` has no effect (no intro screen). No `setupInGame`.
- **Display preferences inside the game** (`preferences`): distance unit (km / miles), label size (normal / large). Nothing else.

---

## 16. State (plain JSON, `stateVersion: 1`) and migration

```ts
type Mode = 'find' | 'compare' | 'mystery' | 'route';
type LonLat = [lon: number, lat: number];          // integers, hundredths of a degree; lon −18000..18000, lat −9000..9000
type Place =
  | { t: 'country' | 'city' | 'feature'; id: string }
  | { t: 'point'; at: LonLat };

interface AtlasState {
  v: 1;
  data: string;                                    // ATLAS_DATA.id at creation ('ne-5.1.2/1')
  seed: number;                                    // uint32
  difficulty: 'easy' | 'medium' | 'hard';
  mode: Mode | 'mixed';
  region: 'world' | 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  items: Item[];                                   // 8 / 8 / 4 / 4 / 6 by mode (§ 5)
  index: number;                                   // current item 0..len−1; len = summary
  reported: boolean;                               // finished() called (never twice, also after restore)
}

type Item = FindItem | CompareItem | MysteryItem | RouteItem;

interface FindItem { kind: 'find'; target: Place;
  draft: LonLat | null;                            // marker being placed
  answer: LonLat | 'skip' | null;                  // committed ⇔ review
  km: number | null; band: 0 | 1 | 2 | 3 | null; } // stored at commit (integers), so reviews never change

interface CompareItem { kind: 'compare'; template: string; places: string[];   // 1..3 place ids
  param: number;                                   // template-specific integer (month 6|12, reference index…), 0 if none
  options: string[];                               // option ids in shown order (place ids or template option ids)
  correct: number;                                 // index into options, computed at generation
  draft: number | null; answer: number | 'skip' | null; }

interface MysteryItem { kind: 'mystery'; target: string;
  clues: { id: string; arg: string }[];            // 3..7, in order; arg = neighbour/reference/feature id or ''
  shown: number;                                   // 1..clues.length
  guesses: string[];                               // distinct UN member codes, ≤ 193
  draft: string | null;
  end: 'solved' | 'shown' | null; }

interface RouteItem { kind: 'route'; from: string; to: string;
  best: number; ways: number;                      // shortest crossings and number of shortest routes, at generation
  path: string[];                                  // starts with from; each step a neighbour of the previous; no repeats; ≤ 60
  end: 'arrived' | 'shown' | null; }
```

- **Phase is derived:** find/compare in review when `answer !== null`; mystery when `end !== null`; route when `end !== null`.
- **Saves hold ids and integers only**, never names or geometry; results that depend on geometry or the graph (km, band, best, ways, correct) are stored at creation or commit.
- `isValidState(x)` never throws. It checks every type and bound above; `data` is a known data id (the current one; older ones once data updates exist, see below); every id exists in the data (and is a UN member where required) and is not retired-and-removed (ids are never removed, § 11.3); `items.length` and kinds per mode; a find `point` on the grid of its difficulty; `band` consistent with `km` and the target kind; compare `correct` in range and `options.length` 2–4; mystery clue ids known and `shown ≤ clues.length`, guesses distinct, `end === 'solved' ⇔ guesses` contains the target as last entry; route `path[0] === from`, consecutive entries neighbours in the data, no repeats, `end === 'arrived' ⇔ last === to`; `index ≤ len`; `reported ⇒ index === len`. Guesses and route steps are re-checked against the current graph (cheap: ≤ 193 lookups).
- The PRNG state is not stored: all randomness is spent in `newGame`.
- **Pure transitions** (`rules.ts`), each returning the same object when nothing changes: `createRound(seed, difficulty, mode, region, atlas)`, `setMarker`, `checkFind`, `chooseOption`, `checkCompare`, `nextClue`, `setGuessDraft`, `guess`, `showMystery`, `step`, `back`, `showRoute`, `skip`, `next`, plus derived `phase`, `review(item)`, `summary(state)`.
- **Migration policy:** `stateVersion` stays 1 while changes are additive. A **data update** gets a new `ATLAS_DATA.id`; saves from the previous data id stay valid as long as their ids exist (they always do, ids are never removed) and their stored results are used unchanged; a route whose stored path is no longer valid under the new graph is shown as it was (the review uses the stored `best`), and the validator accepts paths of older data ids structurally. An incompatible state change bumps `stateVersion` with `migrateState`; an unmigratable save is reported as corrupt (acceptable for a round of a few minutes).
- **End:** "See summary" sets `index = len`; `finished()` runs once (guarded by `reported`); reopening a finished save shows the summary again. `reset()` = the same seed's round from the start. `pause()` blocks input (no timers).
- **The answer never reaches the DOM before the review**: country paths carry no target flag, a city target is not marked, compare options carry no correctness attribute (a view test asserts this).

---

## 17. UI layout

### 17.1 Desktop (≥ 48 rem): map left (≈ 2/3), card right (sticky), CSS grid with logical properties

```
┌──────────────────────────── Item 3 of 8 · Find it on the map ─────────────────────────────┐
│ ┌─────────────────────────────── map ──────────────────────────┐ │ WHERE IS NAIROBI?       │
│ │  ·  ·  ·  graticule 30°  ·  ·  ·                      [+]   │ │ (Kenya)                 │
│ │        ▒▒  ▓▓ countries  ░ lakes  ~ rivers            [−]   │ │ Tap the map or use the  │
│ │                   ◆ your marker                       [Fit] │ │ arrow keys, then Check. │
│ │  ─────────── Equator ───────────                            │ │ [ Check ]               │
│ │  - - - - - - Tropic of Capricorn - - - -                     │ │ Skip — just show me     │
│ └──────────────────────────────────────────────────────────────┘ │                         │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

The review keeps the map and replaces the card by the verdict, the distance sentence, the insight and "Next". Mystery: the card holds the clue list, the search combobox, the guess cards. Route: the card holds "From → To", the step list and the neighbour buttons.

### 17.2 Phone (360 px): one column; map ≈ 55 vh, card below, primary button sticky at the bottom

```
┌ Item 3 of 8 ─────────────────┐
│ Where is Nairobi? (Kenya)    │
├──────────────────────────────┤
│            map               │
│      (pinch, drag, tap)  [+] │
│                          [−] │
│                        [Fit] │
├──────────────────────────────┤  ← sticky
│ [ Check ]        Skip        │
└──────────────────────────────┘
```

- The map never captures vertical page scrolling outside itself; inside it, one-finger drag pans (`touch-action: none` on the map only). The card scrolls with the page.
- Route neighbour buttons wrap; the mystery guess list collapses to the last three cards with "Show all".
- No horizontal page scroll (e2e check); every target ≥ 44 px.

---

## 18. Accessibility

- Semantic structure: item title `h2`; "Clues", "Your guesses", "Route so far", "What the map shows" as `h3`. After each commit, focus moves to the review heading; after "Next", to the new item's heading. One polite announcement per action ("About 340 km north-west of Nairobi. Close.").
- Controls: native buttons, radio fieldsets, the combobox (`role="combobox"` + listbox, ARIA 1.2 pattern), the map element of § 14.3; all ≥ 44 px; visible focus.
- **Screen-reader alternative to the map:** compare, mystery and route are fully playable without seeing the map (choices, the country search, neighbour buttons; the review explanations are sentences). Find mode is map-based by nature; it works with the keyboard cursor and its coordinate and nearest-city announcements, and the rules state this limitation honestly: "Finding places is a visual task. With a screen reader, the keyboard cursor announces coordinates and nearby cities; the other modes need no map."
- The SVG has `role="img"` on decorative layers and an `aria-label` summary per review ("Map: Nairobi and your marker, 340 km apart"); every visual explanation has a visible text equivalent.
- Numbers in `<bdi>`; coordinates and formulas `dir="ltr"`; the map is not mirrored in RTL (§ 14.1).
- `reducedMotion`: no animated zoom (the view jumps); otherwise a 200 ms zoom-to-fit in reviews.

---

## 19. Localisation summary

All 16 locales at once (no `metadata.locales`, no `status`); texts as in § 13.3, names as in § 13.1–13.2. Translations other than en/de are AI-assisted (as everywhere). Arabic RTL is checked in the view test and in the e2e smoke test. Portuguese is Brazilian (the repository's `pt-brazilian` test runs over the game's strings).

---

## 20. Preview (catalogue SVG, for the orchestrator)

Decorative, `aria-hidden`, the shared 96×64 viewBox and classes. A simplified world outline is not needed; instead: a rounded "map" panel with two curved graticule lines (Equator solid, a tropic dashed), three abstract land blobs (filled, one with the target stripes), a ◆ marker and a dashed great-circle arc from the marker to the striped blob. No text, no digits, no real country shapes (language- and politics-neutral). Not mirrored in RTL.

---

## 21. Test plan

### 21.1 `test/rules.test.ts`, `test/geo.test.ts`, `test/compare.test.ts`, `test/clues.test.ts`, `test/route.test.ts` (TDD + fast-check; fast, mutation-relevant)

- **Projection:** forward/inverse round trip (property, |φ| ≤ 89.9°, error < 1e-9 rad); known values (0,0) → (0,0), (180°, 0) → x ≈ 2.70663, (0, 90°) → y ≈ 1.31736; monotonic in λ and φ; equal-area property: the projected area of random small lon/lat cells equals the spherical area (relative error < 1e-6).
- **Haversine:** symmetry, zero on identity, triangle inequality, antipodes ≈ π R; **oracle:** spherical law of cosines for distances > 1 km (agreement < 1 m).
- **Bearing and compass words:** sector boundaries exactly at 11.25° + k·22.5° (both sides), wrap at 360°.
- **Point in polygon / distance:** hand-made squares and a ring with a hole; across the antimeridian; distance 0 inside, positive outside, equals the cross-track formula for a single segment; never negative (property).
- **Day length:** equator ≈ 12 h 7 min on both solstices; 60° N on 21 June ≈ 18 h 50 min (± 5 min); 70° N on 21 June → no sunset; 70° N on 21 December → no sunrise; symmetric under (φ, June) ↔ (−φ, December) (property).
- **Sun time:** 15° → 1 h, sign by direction.
- **Bands:** boundaries exactly at the km limits of § 6.3 for each target kind.
- **Compare templates:** for 500 seeds × difficulty × region, every generated item satisfies its threshold, has exactly one correct option, and `correct` equals an **independent oracle** (re-computing the answer from raw data with different code: latitude/longitude comparisons on the raw city numbers; distances with the law-of-cosines oracle; areas and populations from the raw facts; daylight with a separate implementation of the hour-angle formula; sun time by direct minutes-per-degree arithmetic).
- **Clues:** every clue of every generated mystery is true for the target (predicate on raw facts); after all clues exactly one UN member remains, found by an **independent filter**; the first clue leaves at least the minimum number of candidates; no clue mentions a disputed area or a non-UN entity.
- **Route:** BFS `best` and `ways` equal a brute-force DFS on random small graphs (property) and on the real graph for 100 random pairs within distance ≤ 6; every generated pair lies in its distance band; `step` accepts only neighbours, `back` undoes exactly one step, no repeats.
- **Transitions:** random action sequences never throw and always satisfy `isValidState`; commits are no-ops in review; `reported` flips once; `next` is blocked before a review.
- **`isValidState`:** `fc.anything()` never throws; generated states are valid; tampered fields are rejected (unknown id, non-UN target, point off its grid, band inconsistent with km, guesses with duplicates, `end: 'solved'` without the target, a route step that is not a neighbour, `reported` before the end, oversize arrays).
- **`settingsOf`:** round trip over 5 × 6 × 3 settings.

### 21.2 `test/data.test.ts`, `test/build.test.ts`, `test/content.test.ts`, `test/format.test.ts`, `test/view.test.ts`

- **Data (fast):** the generated module decodes; the SHA-256 of `atlas.gen.ts` equals the manifest's output hash; **size budget** (raw source of `atlas.gen.ts` ≤ 150 KB, § 22); all 193 UN members present exactly once; ids unique; every ring references existing arcs and closes; neighbour relation symmetric and irreflexive, never involving a non-UN entity; every curated city lies inside its country in the simplified geometry or within the 25 km tolerance (120 point tests); every feature id used by content and config exists; no `retired` id is used by the generator.
- **Build (fast, on tiny synthetic GeoJSON fixtures):** topology — two squares sharing an edge produce one shared arc and two rings; dissolve removes the internal arc of two units of one country; simplification keeps arc ends, keeps rings ≥ 4 points, and never moves a point (subset property); encode/decode round trip (property over random integer sequences, including large jumps and negatives); the overlay exception rule (≥ 90 % of a member state); the neighbour rule (5 km outside hatched areas, both-sides test).
- **Content:** every feature id has a non-empty name in all 16 locales (through `CONTENT_LOADERS`); capitals come from `capitalName` and are not duplicated; placeholder sets identical across locales; no digits in clue and insight sentences (numbers via placeholders); zh-Hans names contain none of a list of traditional-only characters (畢 爾 蘭 薩 灣 島 亞 魯 遜 …); Portuguese passes the repository's Brazilian-Portuguese guard.
- **Format:** distances, areas, populations, durations, coordinates in all 16 locales (`formatToParts` types, not glyphs); km/mile switch; the "about" rounding rules.
- **View** (jsdom): each phase of each kind in `en`, `de`, `ar`, `ja`; RTL attributes on text but not on the map; the target is absent from the DOM before review; the map element's role, accessible name and live-region text after a cursor move; the combobox filters with `Intl.Collator`; patterns exist for target, guess, neighbour and disputed.

### 21.3 Slow tests (`*.slow.test.ts`, ADR 0021 — run by `pnpm test` and the CI `long` job, left out of Stryker)

- `test/data-facts.slow.test.ts`: **landlocked** flags equal a curated oracle list of landlocked UN members (transcribed from the CIA World Factbook, with the neutrality deviations documented in the test); **neighbours** of 40 sample countries equal Factbook land boundaries minus the documented neutrality deviations (§ 12.3); **areas** (`areaCore`) of 30 countries within 8 % of Factbook total areas (inland water explains the gap); **standard offsets** of all curated cities equal the min of the January/July offsets from Node's `Intl` (fails with "tzdata changed: re-run scripts/build-atlas" if Node's tz data moved a city).
- `test/geometry.slow.test.ts`: the simplified home territory of every UN member contains its label point; for every UN member, sampled points of the full-resolution boundary (from a committed, small, per-country sample of 20 boundary points generated by the script into `test/fixtures/boundary-samples.json`) lie within 25 km of the simplified boundary (the tolerance claim of § 6.2).
- `test/generator.slow.test.ts`: 500 seeds × 5 modes × 6 regions × 3 difficulties: generation never fails, fallback rates below the limits of §§ 7–9, average generation < 10 ms per item.

Each slow file stays under 50 % of its timeout under parallel load (calibrate counts on the CI runner; the reviewer reruns them).

### 21.4 Contract (`test/contract.test.ts`)

`runGameContract(game, { interact })`: `preload('en')` loads the atlas and content; `interact` presses "Skip — just show me" on the first item and then "Next" (or chooses the first option and "Check" in a compare item), so save/restore happens mid-round. Settings are sampled by the contract (5 × 6 × 3).

### 21.5 E2E (`e2e/games/atlas-explorer.spec.ts`)

Imports the pure projection from `packages/games/atlas-explorer/src/geo.ts` and uses `readSave`, as Best Plan's spec does.

1. `startGame` with `chooseSetting('mode', 'find')`, easy, world. Read the target from the save; compute its screen position via the projection and the SVG's `getScreenCTM()`; tap there; "Check"; the review shows "On target".
2. Keyboard-only find item: focus the map, move the cursor with arrow keys, Enter, Tab to "Check"; the live region announced coordinates; the review appears.
3. `expectResumeAfterReload` in the middle of a mystery item with two clues shown and one wrong guess (clues, guess card and draft survive).
4. Compare mode: choose an option, "Check"; the review shows the explanation sentence.
5. Route mode: step through neighbours via the buttons until the goal (path read from the save's `best` route computed in the test with the imported BFS), then the review shows "One of the shortest routes ✓".
6. Finish a whole `mixed` round with skips (fast path); the summary appears with the host's "Another round".
7. A 360 × 740 viewport: no horizontal scroll, interactive targets ≥ 44 px (bounding boxes), the sticky bar does not cover the focused element, pinch-free zoom via the buttons works.
8. `ar` RTL smoke: the card is on the inline start side, the map is not mirrored (the label of a western country is left of an eastern one), coordinates read LTR.
9. Offline: after the first load, go offline, open the game in a new page, start a round (the atlas chunk is precached).

---

## 22. Performance and bundle budget

| Item | Budget |
|---|---|
| Atlas chunk (`atlas.gen`) | ≤ 150 KB minified (detailed variant measured ≈ 110–130 KB), ≈ 75–90 KB gzip; test-enforced raw size ≤ 150 KB |
| Game code chunk (without atlas and content) | ≤ 90 KB minified (≈ 28 KB gzip) incl. English UI messages and the capitals table |
| Content per locale | ≤ 30 KB minified (≈ 10 KB gzip), loaded via `preload` |
| Decode the atlas | < 15 ms on a mid-range phone (≈ 40,000 coordinates) |
| First map render | < 60 ms (≈ 250 paths built once); zoom/pan by `viewBox` only, 60 fps on desktop |
| Point → country lookup on tap | < 5 ms (bounding-box prefilter) |
| Generate a round | < 50 ms (mystery clue search included) |
| Saves | < 6 KB JSON per round |
| Precache increase | ≈ 150 KB + 16 × 30 KB ≈ 0.6 MB in total (one-time, offline) |

---

## 23. Risks

| Risk | Mitigation |
|---|---|
| Political offence through borders | Policy A (§ 12) with a build check against all 32 Natural Earth worldviews; only UN members asked; no manual edits; data date stated; owner decision |
| Stale data (2022) | Stated in the rules; data update procedure (§ 11.4); neutral hatching means few visible facts depend on later events |
| Map too heavy for phones | Measured budget (§ 11.2, § 22); one SVG, zoom by `viewBox`, no re-render on zoom |
| Mis-taps on touch, tiny countries | Marker + explicit "Check"; disambiguation popup; country search list; distance-based scoring with tolerance |
| "Trivia" feeling | Every review explains with the map; compare questions are reasoning (latitude, sun, equal area); exploration after each answer |
| Facts wrong (neighbours, landlocked, areas, time zones) | Computed at full resolution; slow tests against public-domain oracles (Factbook, Node tz data); comparison thresholds |
| Names wrong or inconsistent across languages | Countries from CLDR; capitals shared with the deck; curated names with tests (completeness, zh-Hans, pt-BR); native-speaker review later as everywhere |
| Translation volume (~420 strings × 15) | Short structured sentences, numbers via `Intl`, names table shared with the selection; owner may still choose an en+de preview (ADR 0003 amendment) if translations lag |
| Screen-reader users and find mode | Stated limitation; keyboard cursor with coordinate and nearby-city announcements; three other modes need no map |
| Generated file confuses reviewers or tools | Header, manifest hash test, single-line strings; excluded from mutation |

---

## 24. Open questions for the owner (max 3, each with a recommendation)

1. **Disputed borders.** Recommended: **policy A "mark, don't decide"** (§ 12.2): Natural Earth linework; every disputed, indeterminate or breakaway area of Natural Earth's disputed-areas layer drawn hatched with a neutral label and assigned to no country; the one feature covering a whole UN member state (Israel) not drawn; only UN member states are asked about; no manual edits; the data date stated. Alternatives B (de facto, unmarked), C (one government's view, e.g. Germany's) and D (A plus manual updates since 2022, e.g. Nagorno-Karabakh, occupied areas of Ukraine) are compared in § 12.5.
2. **Map detail and size.** Recommended: the **detailed** map (from 1:10m, simplified; ≈ 80–90 KB gzip once, cached for offline use; islands from 100 km², smooth up to 4× zoom). The alternative is a **light** map (≈ 40 KB gzip in total, comparable to 1:110m; small countries and coasts coarse, only islands from 1,000 km²). Both are public domain, from the same pipeline; only two parameters differ.
3. **Title.** Recommended: keep your name, **"Atlas Explorer" / "Atlas-Entdecker"**. The alternative is **"Atlas Expedition" / "Atlas-Expedition"** (the same word in both languages and gender-neutral in German). The id stays `atlas-explorer` either way.

---

## 25. Implementation steps (one implementer)

1. **Geometry core (tests first):** `src/geo.ts` (Equal Earth forward/inverse, haversine, bearing and compass, point-in-polygon and distance, day length, sun time) with `test/geo.test.ts`.
2. **Build library:** `src/build/{geojson,project,topology,simplify,encode,facts,raster}.ts` with `test/build.test.ts` on synthetic fixtures.
3. **Data script and data:** `scripts/build-atlas.ts`, `scripts/atlas-config.json` (sources with SHA-256, parameters, selection, tiers, exceptions), `.gitignore` for `.cache/`; run with `--download`; review the report (sizes, tier lists, neighbour list, worldview check); commit `src/data/atlas.gen.ts`, `src/data/manifest.json`, `src/data/un-members.ts`, `test/fixtures/boundary-samples.json`; `src/data/index.ts` (`loadAtlas`, `atlasSync`) and `src/atlas.ts` (decoded model and queries); `test/data.test.ts`, `data-facts.slow.test.ts`, `geometry.slow.test.ts`. Print the tier lists and the selection for the owner's review in the PR description.
4. **Templates and generators:** `src/compare.ts`, `src/clues.ts`, `src/route.ts`, `src/generate.ts` with their tests and oracles, and `generator.slow.test.ts`.
5. **State and transitions:** `src/rules.ts` (`AtlasState`, `createRound`, transitions, `isValidState`, `settingsOf`, `summary`); random action-sequence and fuzz tests.
6. **Text:** `locales/en.ts` and `content/en.ts` first (UI, clue and insight sentences, feature names drafted from the script's review file and edited), then `de`, then the other 14; `format.ts`; `test/content.test.ts`, `test/format.test.ts`.
7. **Map view:** `src/map-view.ts` (layers, patterns, `viewBox` zoom/pan, pointer/touch/keyboard, cursor announcements, explore mode in reviews), then `view.ts` with `view-find.ts`, `view-compare.ts`, `view-mystery.ts`, `view-route.ts`, the summary, `styles.css` (logical properties, forced colours); `index.ts` with `preload`, `settings`, `settingsOf`; `test/view.test.ts`.
8. **Contract and e2e:** `test/contract.test.ts`, `e2e/games/atlas-explorer.spec.ts`; run the full gate (`pnpm check`, `pnpm build`, the e2e command from the pipeline brief).
9. **Report to the orchestrator:** the registry line (append after the existing games), the dependency, the preview (§ 20), the ROADMAP rows (new game, skills spatial/learning/deduction; the M1 "maps/neighbours" note), the Stryker `mutate` lines (§ 1.3), Appendix A for `docs/third-party.md`, and the measured chunk sizes.

---

## Appendix A — section for `docs/third-party.md` (ready to paste)

Rows for the "Shipped to users" table:

```markdown
| *Atlas Explorer* map data: Natural Earth vector data, version 5.1.2 (2022-05-13), layers `ne_10m_admin_0_map_units`, `ne_10m_admin_0_countries` (attributes), `ne_10m_admin_0_disputed_areas`, `ne_10m_land`, `ne_50m_lakes`, `ne_50m_rivers_lake_centerlines`, `ne_50m_geography_regions_polys`, `ne_50m_populated_places` (selection), from the official repository `nvkelso/natural-earth-vector`, tag `v5.1.2`; projected, simplified and encoded by the project's own script (`packages/games/atlas-explorer/scripts/build-atlas.ts`; sources, SHA-256 hashes and parameters in `src/data/manifest.json`) | Public domain (naturalearthdata.com/about/terms-of-use: "All versions of Natural Earth raster + vector map data … are in the public domain"; credit not required, given voluntarily: "Made with Natural Earth") | Countries, disputed-area overlay, lakes, rivers, physical regions, city positions, country population estimates (2019, World Bank figures as included in Natural Earth) and the facts derived from them (neighbours, coasts, areas) in *Atlas Explorer* |
| *Atlas Explorer* place names (cities, rivers, lakes, mountain ranges, deserts and other features × 16 languages, `packages/games/atlas-explorer/src/content/`) | Project license (written for Worthwhile Play: the conventional exonym in each language; drafted from Natural Earth's public-domain name fields, which come from Wikidata (CC0), and edited; capitals shared with the *Capitals* deck; non-en/de AI-assisted) | Labels, questions and explanations of *Atlas Explorer*; country names come from CLDR via the browser, as for *Flags & countries* |
| Standard time offsets of the *Atlas Explorer* cities | IANA Time Zone Database (public domain), read at data build time through Node.js's built-in ICU; only the resulting offsets are stored | The "clock time" questions of *Atlas Explorer* |
| Equal Earth map projection (Šavrič, Patterson & Jenny, 2019) | Published formula; own implementation, no code copied | The world map of *Atlas Explorer* |
```

And extend the existing CLDR row's "Use" column with: "; country names in *Atlas Explorer*".

Sentence for the "Build and test tooling" paragraph:

```markdown
The *Atlas Explorer* data script downloads Natural Earth files only when run by hand with `--download` (never in CI or at runtime), verifies their SHA-256 hashes and keeps them out of git. Its build check also reads Natural Earth's 32 point-of-view variants of the countries layer (public domain); they are not shipped. Land-border, landlocked and area figures used as test oracles were transcribed from the CIA World Factbook (US government work, public domain); they are not shipped.
```

---

## Appendix B — data findings (planner, 2026-10-26)

Downloaded for inspection only into the session scratchpad (untrusted data, not committed): the Natural Earth v5.1.2 GeoJSON files listed in § 11.1, the 32 point-of-view variants, and the terms-of-use page.

**Vertex counts (raw):** countries 1:110m 10,654 (177 features), 1:50m 99,613 (242), 1:10m 548,471 (258); map units 1:10m 298 features; disputed areas 1:10m 99 features (14,795 vertices); populated places 1:110m 243, 1:50m 1,251; rivers 1:110m 13 features, 1:50m 462; lakes 1:50m 412; geography regions 1:50m 522.

**Name fields:** countries, populated places, lakes, regions and the 1:110m rivers carry `NAME_xx` for all 16 UI languages (ar, de, en, es, fr, hi, it, ja, ko, nl, pl, pt, ru, tr, uk, zh); the 1:50m rivers carry only `name_en` (names come from our table anyway).

**Simplification prototype:** see § 11.2 (Equal Earth, 16,384-cell grid, shared arcs, Visvalingam–Whyatt, island filter, zigzag varint; gzip sizes measured with gzip -9). Note for the implementer: junctions must be detected only between *different* rings; detecting them within one ring after quantisation produced thousands of spurious arcs in the first prototype.

**Worldview analysis:** rasterised at 0.2° (1,800 × 900 cells) the default view and the 32 point-of-view files. Disagreements total ≈ 10.5 million km² before the overlay, of which ≈ 9.37 million km² is the Republic of China view's claim to mainland China. After removing all cells inside disputed-area features of types *Disputed*, *Indeterminate* and *Breakaway*, the remaining disagreements are: CHN/TWN (ROC view), Baikonur (lease), South Sandwich Islands (Argentina's view; type *Geo subunit*), ≈ 3,300 km² in Georgia left unassigned by two views, the Korean DMZ (overlay), ≈ 480 km² near Barbados (coding artefact), Guantánamo (lease), Dhekelia, Ceuta (Morocco's view; type *Geo subunit*).

**Largest overlay features (km², spherical):** Morocco-administered Western Sahara 178,000; Somaliland 168,000; Essequibo (Guyana, claimed by Venezuela) 143,000; Indian-administered Kashmir 105,000; Polisario-administered Western Sahara 91,000; Arunachal Pradesh 68,000; Pakistani-administered Kashmir 65,000; Sabah (claimed by the Philippines) 39,000; Taiwan 36,000; Aksai Chin 31,000; Crimea 27,000; Israel (whole state, not drawn under policy A) 21,000; Halaib 18,000; Kosovo 11,000; the 2014 Donbas areas 9,400 + 8,300; Abkhazia 8,600; Nagorno-Karabakh 3,100; Northern Cyprus 3,300; Transnistria 3,000.

**Neighbour rule measurement** (1:10m default, border segments tested on both sides against the overlay): 342 neighbouring pairs in the raw data; with the 5 km rule, pairs such as China–Pakistan and Somalia–Djibouti and those of non-UN entities disappear; Russia–Ukraine (1,667 km shared, ≈ 470 km along hatched areas), India–China, Armenia–Azerbaijan and Guyana–Brazil remain. Without the whole-state exception, all of Israel's borders would disappear — hence rule 3 of § 12.2.

**Name draft quality (spot check):** `NAME_PT` European Portuguese ("Moscovo", "Teerão", "Nova Iorque", "Varsóvia"); `NAME_ZH` partly traditional ("鄂畢河" for the Ob); `NAME_JA` with "市" ("北京市", "台北市"); `NAME_DE` "Kiew"; `TIMEZONE` missing for Moscow, deprecated `Asia/Harbin` for Beijing. Hence the curated names (§ 13.2) and the configured IANA zones (§ 11.1).
