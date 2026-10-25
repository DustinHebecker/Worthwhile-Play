# Probability Detective (`probability-detective`) — design

Status: **Plan (2026-10-24)**, written by the planner of the new-games pipeline (game 3 of the owner's list). The implementer follows it, and the reviewer checks the work against it. Numbers marked *(calibrate)* are first estimates. The implementer may tune them within the stated bounds, never beyond the arithmetic bounds in § 9. Content: [probability-detective-content.md](probability-detective-content.md) (30 case templates with exact maths).

Scope for the implementer (feature agent, ADR 0006): `packages/games/probability-detective/` and `e2e/games/probability-detective.spec.ts`. The orchestrator creates `package.json`, the registry line (appended after the existing games), the dependency in `apps/web/package.json` and the preview in `apps/web/src/previews.ts` (§ 18). No new dependencies. No shared change is needed for the MVP; § 1.3 lists optional ones.

Binding inputs: `CLAUDE.md`, the implementation brief ("Core product principles", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"), ADR 0002 (contract), 0003 incl. the 2026-10-24 amendment (§ 17.6), 0006 (roles), 0010/0011 (per-locale content, `preload`), 0017 (start screen, `settings`, `settingsOf`, `begin`) and 0021 (mutation budget, `*.slow.test.ts`).

---

## 1. Survey: overlap and reuse

### 1.1 Overlap with the catalogue

No game asks for probabilities yet. The nearest neighbours:

| Game | Relation | Consequence |
|---|---|---|
| Rule Hunt (`rule-discovery`) | Choosing informative tests; afterwards it explains each test's information value. | Same spirit for "Choose the checks" (§ 7). Rule Hunt's tests are yes/no with certain answers. Here evidence is **uncertain**, and the question is *how much* to believe, not *which* rule. |
| Network Detective (`graph-detective`) | A "detective" that diagnoses a given structure; one right answer. | The family name fits: both diagnose rather than build. The title question is in § 22. |
| Estimation Lab (`fermi-lab`) | Number input with an interpretation line, review after commit, a 5-question round with a calm summary, per-locale content (ADR 0011), `format.ts`. | Same **round shape**, **content architecture** and number conventions (`Intl.NumberFormat` with `bcp47Tag`, `<bdi>`, numeric axes `direction: ltr`). Patterns are copied, not imported. |
| Best Plan (`mini-optimizer`) | An exact solver; the gap to the optimum shown after a check; "the idea" note. | Same honesty for expected value: the best plan is computed exactly (§ 7.3) and shown only after the decision. |
| Black Box (`black-box`) | Exact BigInt reference evaluator in tests; proper minus sign in `format.ts`. | Copy the BigInt-exactness and minus-sign patterns. |
| Poker, Skat (cards) | Chance appears, but as part of play. | Nothing here is a gamble: no stakes, no wagering metaphors, no random rewards (§ 4). |

### 1.2 What is reused

- `@wp/game-core`: `GameModule`, `defineGame`, `createRng`, `normalizeSeed`, `seedFromString`, guards (`isRecord`, `isInt`, `isUint32`, `isArrayOf`, `isOneOf`), `createLocaleContent`, `SettingSpec`, `bcp47Tag`.
- `@wp/ui`: `h`, `clear`, `announce`.
- `@wp/testing`: `runGameContract`, `startGame`, `chooseSetting`, `submitStart`, `expectResumeAfterReload`, `readSave`.
- **Patterns copied** (games never import other games): fermi-lab's `content/index.ts` loader table and `preloadContent`/`contentFor`; fermi-lab's review layout (verdict line, marks ●●○ plus words, stacked cards at 360 px) and its summary tone; black-box's minus sign; mini-optimizer's spinbutton stepper (`role="spinbutton"`, ArrowUp/Down, Home/End) for the three-hypothesis belief rows; mini-optimizer's sticky status box below 48 rem.

### 1.3 Optional shared changes (report to the orchestrator; not needed for the MVP)

1. **Mutation targets.** `stryker.config.json` mutates only `games/*/src/rules.ts` and `ai.ts`. The exact maths lives in `rules.ts` (§ 9). The generators (`generate.ts`) and the trap answer functions (`traps.ts`) are worth adding to `mutate` (two lines, orchestrator-owned).
2. **A shared `formatPercent`/`pluralForm` helper** in `@wp/localization`. Several games format numbers, and this is the first game that needs CLDR plural categories. The game ships its own pure copy first.
3. **Skill.** The `SKILLS` list has no "probability/numeracy". The game uses `hypothesis` and `deduction` (§ 2). A new skill would be a shared change plus translations.

---

## 2. Identity

| | |
|---|---|
| Package id | `probability-detective` (`@wp/game-probability-detective`). It stays neutral, so a later title change touches no saves. |
| English title | **Probability Detective** (recommended, owner question 1) |
| German title | **Wahrscheinlichkeits-Detektiv** (hyphenated like "Netzwerk-Detektiv", so it can break on narrow cards) |
| Other locales | nl Kansdetective · es Detective de probabilidades · fr Détective des probabilités · ru Детектив вероятностей · zh-Hans 概率侦探 · ko 확률 탐정 · ja 確率探偵 · ar محقق الاحتمالات · pt Detetive de Probabilidades · it Detective delle probabilità · pl Detektyw prawdopodobieństwa · tr Olasılık Dedektifi · uk Детектив імовірностей · hi प्रायिकता जासूस (each follows the locale's existing "Network Detective" wording) |
| Skills | `hypothesis` (updating beliefs on evidence), `deduction` (reasoning from stated numbers) |
| `typicalMinutes` | `[6, 15]` (one round) |
| `difficulties` | `['easy', 'medium', 'hard']` |
| Input | pointer, touch, keyboard |
| Capabilities | offline, no audio, no AI, no network, no WebGPU, pauseable |
| `stateVersion` | 1 |

The alternative title considered is "Odds Detective" / "Chancen-Detektiv": shorter, but "odds" is jargon in some languages and "Chancen" reads as "opportunities" in German.

---

## 3. Pitch and honest value

**Pitch.** A parcel arrives in blue paper. Which warehouse sent it? A sensor flags a street lamp — is it really faulty? Should the picnic go outdoors, and is it worth asking the farmer first? Each case gives you a few facts with numbers attached, and the evidence arrives one clue at a time. After each clue, you say how sure you are. When the case closes, you see what really happened. You also see how the numbers work out: a counting board ("imagine 1,000 parcels like this one"), the chain of evidence, and, if you want them, the formulas. Some cases are small thinking traps that catch almost everyone the first time.

**Claims we may make** (tagline, rules, catalogue):

- "Practice reasoning with probabilities: base rates, evidence and how much a clue should change your mind."
- "Practice deciding which evidence is worth gathering, and judging a decision by what you knew rather than by luck."
- "Practice spotting common traps: ignoring the base rate, the gambler's fallacy, the conjunction trap, Simpson's paradox."
- "See your own habits: whether you tend to move too little or too far when evidence arrives."

**Claims we never make:** "improves your brain/IQ/logic", "makes you rational", or any transfer claim. The game says "practice" and "exercise".

**Honesty inside the game:** the rules text and every case footer say *"The numbers in the cases are invented for practice."* No case states a real-world statistic as fact (§ 4), so no facts need sources. The maths is exact and can be checked: every answer follows from the numbers on screen, and the formulas are one tap away.

---

## 4. Content principles (binding for templates and translations)

1. **No people as suspects, no groups.** Hypotheses are things, places, animals or causes: a warehouse, a machine, an oven, a garden visitor, a weather cause. The game never uses base rates about groups of people (by origin, gender, age, job, health). This avoids teaching stereotypes through "base rates".
2. **No human medicine, no danger.** There are no diagnoses of people, no ice, fire or traffic risk decisions. Real tests in the stories are for lamps, seeds, ovens, laptops and similar. In checks mode the worst outcome is mild: a rained-out picnic, a bad melon.
3. **No gambling framing.** There are no bets, casinos, lotteries, raffles or stakes. Chance devices are neutral: a coin "found at the fair" (as an object), a spinner, dice, drawers. Points in checks mode are "points" that measure how well a plan turned out. They are not money and they do not accumulate.
4. **Neutral settings.** There are no culture-specific holidays or trivia, and no personal names (roles instead: "the baker", "the caretaker"). Places are generic ("Warehouse North").
5. **Own wording.** Classic problem *types* (base-rate test, three doors, birthday coincidence, the hospital sample-size problem, Simpson's paradox, the conjunction problem) appear only as structures. Story, wording and numbers are ours. No text or data set is copied from books, papers or puzzle collections (e.g. the content doc's Simpson numbers are generated, not the well-known kidney-stone data).
6. **Invented numbers, said so** (§ 3).

---

## 5. Round structure and the three modes

A round is a **fixed list of cases**, created at `newGame` and played one at a time. After each case comes its review. The next case starts only when the player presses "Next case". After the last review, "See summary" shows the round summary and the game calls `finished()` once. No timers. There is no feed: the host offers "Another round" only on a deliberate press (ADR 0017).

| Mode (`mode` setting) | Shown name (en) | Cases per round | One case |
|---|---|---|---|
| `clues` (default) | **Clue by clue** | 5 | Story, base rates, then 2–4 clues one at a time; after each clue the player sets their belief. The truth is revealed at the end. |
| `checks` | **Choose the checks** | 3 | Story, base rates and a decision with points; a menu of checks with costs. The player runs checks or decides, sets a belief, decides, and then sees the expected-value analysis and the outcome. |
| `traps` | **Thinking traps** | 5 | A short puzzle with one or two questions (a choice and/or a probability), then a visual explanation. |
| `mixed` | **A bit of everything** | 5 | In this order: clues, trap, checks, trap, clues. |

Why these sizes: one case takes about 1–3 minutes, so a round fits a break of 6–15 minutes. Five cases give enough material for a summary remark ("you tended to move less than the clues justified"). Checks cases take longer, so a checks round has three.

**Choosing the templates (pure, seeded).** `rng = createRng(seed)`. For each kind needed by the round, shuffle the ids of the eligible templates (kind matches, `levels` contains the difficulty, not `retired`; sorted by id before shuffling), then take them in order. A round therefore never repeats a template. Each case gets its own sub-seed, `seedFromString(`${seed}:${index}`)`, so the attempts of one case never shift another case. Across rounds there is no memory: with 12 clue templates, each with a pool of 5–6 clues, number grids, and drawn clue order and results, the same template gives a different case each time (§ 6.6 counts the combinations).

### 5.1 Avoiding the "school test" feeling

- The frame is a **case file**: paper-card look, "Case 2 of 5", a short story, "What we know", "Clue 1". The review opens with **what really happened**, then "How the numbers work out".
- **Estimates are hunches, not answers.** The prompt reads "How sure are you now?". The control starts at the player's previous belief, and the step is framed as moving it.
- Every estimate has a **"Skip — just show me"** option. A skipped step is simply not scored. There is no penalty and no counter of skips in the summary.
- **"How to think about it"** (`<details>`, closed by default) is a method hint without numbers ("Imagine 100 parcels. How many come from each warehouse? Of those, how many would be blue?"). Using it is not recorded.
- **No grades, points tallies, streaks or medals.** Feedback is words plus symbols ("very close ●●●"). There are never red crosses. A far-off estimate gets "This one surprises most people — see the counting board", never "wrong".
- The **forecast score** (§ 10.3) sits in a secondary line with a one-sentence explanation. It describes this case and is not summed into a running total.

---

## 6. Mode "Clue by clue"

### 6.1 Flow of one case

```
intro (story, hypotheses, base rates) ─▶ clue 1 + "How sure are you now?" ─Next clue─▶ clue 2 + belief ─▶ … ─Close the case─▶ review ─Next case─▶
                                           └── Skip — just show me ──────┘
```

1. **Intro and clue 1 together.** The intro is not a separate screen; it is the top of the case file. The story (2–3 sentences) sets the scene. "What we know" lists the hypotheses with their mark (● ■ ▲) and their base rate ("Parcels on this street come from — ● North: 3 in 10 · ■ South: 7 in 10"). Below it is clue 1 as a card: the observation sentence ("The parcel is wrapped in blue paper.") and the clue's frequency row ("Wrapped in blue paper — ● North: 7 in 10 · ■ South: 2 in 10").
2. **Belief panel** (§ 12) with the question "How sure are you now?". The draft starts at the belief from the previous step. Before clue 1 that is the base rate, rounded to whole percent (largest remainder). Buttons: "Next clue" (commits; on the last clue the label is "Close the case") and "Skip — just show me".
3. Each further clue is appended as a new card, and focus moves to its heading. Earlier clues and the player's earlier estimates stay visible (read-only), so the case file reads as a story.
4. **Review** (§ 10, § 11): what really happened, the counting board, the evidence chain with the player's estimates, a feedback line per step, the forecast score and the formulas (expandable).

Committed estimates cannot be changed (they are the honest record, as in Estimation Lab). The draft can be changed freely, and "Back to my last estimate" resets it. Nothing is revealed before the case closes, so nothing needs to be undone.

### 6.2 Case model

- Hypotheses `H = 2` or `3` (template-defined order; marks ● ■ ▲ by index).
- **Base rate**: integer weights `prior[h] ≥ 1`, `Σ prior = priorDen ∈ {10, 100, 1000}`.
- **Clues** `c = 1…n` (n = 2…4): integer `num[h] ∈ [0, den]`, `den ∈ {10, 100}`, meaning P(clue shows | h) = `num[h]/den`. Each clue has an observed `result ∈ {1 = shows, 0 = does not show}`. The likelihood used is `L[h] = num[h]` if result is 1, else `den − num[h]`. A "not seen" clue therefore teaches the complement: "Not wrapped in blue: North 3 in 10, South 8 in 10".
- Clues are **conditionally independent given the hypothesis** by construction of the story (stated in the rules: "Each clue is a separate observation"). The single exception is the hard-level **echo clue**: a clue that repeats earlier information ("The neighbour also says the parcel was blue — she saw the same parcel"). It is modelled exactly as a clue with equal likelihoods (`num[h] = den` for every h, result 1), so it changes nothing. That *is* the lesson: "the same evidence counted twice is still one piece of evidence". **Neutral clues** (equal `num[h]`, e.g. "it arrived on a Tuesday; both warehouses ship every weekday") work the same way.
- **Posterior after clue k** (exact): unnormalised weights `w_k[h] = prior[h] · Π_{j≤k} L_j[h]`, posterior `p_k[h] = w_k[h] / Σ_h w_k[h]`. This is a rational number, computed with BigInt fractions (§ 9).

### 6.3 Generator

Per case: `rng = createRng(caseSeed)`, and **attempts ≤ 200**:

1. Pick the base rate from the difficulty grid (§ 6.5, content doc § 2).
2. Pick `n` distinct clues from the template's pool. Hard includes exactly one neutral or echo clue (when the pool has one) at a random position other than first. Shuffle the order.
3. Per clue, draw `num[h]` from the grid while respecting the clue's **pattern**: which hypothesis it favours, its strength class, and for three hypotheses the order hi > mid > lo (content doc § 2).
4. **Draw the truth from the prior**: `truth = drawIndex(prior, rng)`.
5. **Draw each clue's result given the truth**: `result = drawIndex([den − num[truth], num[truth]], rng)`.
6. **Accept** if the filters (§ 6.4) hold. Otherwise start the next attempt from step 1 (the truth is redrawn too).
7. After 200 rejected attempts: the template's **fallback fixture** for this difficulty (frozen generator output stored in `templates.ts`, as Best Plan did). The fixture carries everything except the truth. The truth is then drawn from the fixture's exact posterior with `drawIndex(w_n, rng)`. A test keeps the fallback rate below 1 % over 500 seeds.

`drawIndex(weights, rng)` draws index i with probability `weights[i] / Σ weights` exactly (§ 9.2).

**Why the revealed truth is honest (calibration by construction).** The filters read only the base rates, the clue numbers and the **observed results**, never the truth (enforced by type: `accept(c: Omit<ClueCase, 'truth'>)`). For any evidence e that passes the filter, P(truth = h | e, accepted) = P(h, e)·A(e) / Σ_h' P(h', e)·A(e) = P(h | e), because A(e) is the same for every h and cancels. Attempts are independent, so the accepted attempt is a draw from the model conditioned on acceptance. Therefore, across many cases, explanations with an exact posterior of 70 % turn out true about 70 % of the time. The game can then say truthfully: "Cases like this go the other way about 28 times in 100." A slow statistical test checks this (§ 19.3).

### 6.4 Interest filters (read evidence, never the truth)

| | easy | medium | hard |
|---|---|---|---|
| Not settled too early | every step: max p_k ≤ 97 % | same | same |
| Final case not trivial | two hypotheses: max p_n ≥ 55 % | same | same; three hypotheses: max p_n ≥ 40 % |
| At least one informative step | some step moves the leading hypothesis by ≥ 15 pp | same | same |
| Base rate matters | — | some step where the likelihood-only answer (`normalise(L_k)`) differs from p_k by ≥ 10 pp (total variation) | same, ≥ 15 pp |
| Mixed evidence | — | — | at least one informative clue lowers the final leader, or the leader changes during the case |
| Counting board | step 1 integral at population ≤ 100 (always true for the easy grid) | step 1 integral at ≤ 10,000 | step 1 integral at ≤ 100,000 |

*(calibrate)*: the thresholds may be adjusted by ±5 pp if the fallback rate is too high.

### 6.5 Difficulty

| | easy | medium | hard |
|---|---|---|---|
| Hypotheses | 2 | 2 | 3 where the template has three (5 of 12 templates), else 2 |
| Clues | 2 | 3 | 3 (three hypotheses) or 4 (two), one of them neutral or echo |
| Base rates | tenths, 20–80 % ("3 in 10") | multiples of 5 %, 5–95 % | thousandths incl. rare 1–5 % ("1 in 50"); triples in multiples of 5 % (each ≥ 5 %) |
| Clue numbers | tenths ("7 in 10"); favoured 6–9, other 1–4 | multiples of 5 % | any whole percent 1–99 (decisive 0 or 100 allowed where the story is certain, e.g. a two-headed coin never shows tails) |
| Number style | natural frequencies "k in 10" | percent "70 %" | percent; rare base rates as "1 in 50" |

### 6.6 Variety

Easy binary, one template: 6 base rates × (4 × 4)² clue numbers × 30 ordered clue pairs from a pool of 6 × 4 result patterns ≈ 184,000 raw combinations before filtering. Medium and hard have many more. In practice cases repeat only as a template (story) with different numbers, and never within one round.

---

## 7. Mode "Choose the checks"

### 7.1 Flow of one case

```
intro (story, two hypotheses + base rate, the decision table, the menu of checks with costs and frequencies)
  ─▶ [Run a check ▸ result card] × 0…4 ─▶ "Ready to decide" ─▶ belief + choose an option ─Decide─▶ review
```

- **The decision table** (always visible): options × hypotheses with points, e.g. "Picnic outdoors: dry +16 · rain −12", "Book the hall: +6 either way". At most 3 options.
- **Checks** (3 on easy, 4 on medium/hard), each a card with its name, its cost ("costs 1 point"), and what it can show, with its frequencies ("Dark clouds by noon — dry days 3 in 10 · rainy days 8 in 10"). A "Run this check" button (44 px) opens the result card ("Dark clouds by noon: yes."). Each check can run once. Run checks stay listed with their result.
- **Spent so far**: "Checks so far: 2 · points spent: 3".
- **Ready to decide** shows the belief panel ("How likely is a dry day?", binary, § 12) and the options as radio buttons. "Decide" commits both. "Back to the checks" returns without committing (no information is gained by looking). Skipping the belief is allowed as in § 5.1.
- Running a check is not undoable (the information is known). Results are **pre-drawn** at case creation, so the order of running and reloading cannot change them (§ 7.2).

### 7.2 Case model and generator

- Two hypotheses (`prior` as in § 6.2).
- Checks `c = 0…m−1` (m = 3 or 4): `num[2]`, `den`, `cost ∈ 1…4`, and a pre-drawn `result`.
- Options `d = 0…D−1` (D = 2, or 3 on hard): integer `pay[d][h] ∈ [−30, 30]`.
- Generation: the template supplies a pool of 5 checks with patterns and cost ranges, the payoff grid and the base-rate grid (content doc § 4). Truth comes from `drawIndex(prior)`, and every check's result from `drawIndex([den − num[truth], num[truth]])`.
- **Filters read parameters only, never results or the truth.** This matters here: the player sees only the results of the checks they run, so a filter that read unseen results would bias the truth given what the player saw. Typed as `accept(params: CheckParams)`, where `CheckParams` holds the base rate, the checks' numbers and costs and the options, and no results or truth.

| Filter | easy | medium | hard |
|---|---|---|---|
| Information is worth something | V(∅) − max_d EV_d(∅) ≥ 0.5 points | same | same |
| Not every check is worth its cost | — | ≥ 1 check with myopic net value < 0 at the start | same |
| The "most reliable-sounding" check is not automatically best | — | — | the best first action is not the check with the highest P(shows ∣ the hypothesis it points to) |
| A decision exists | the best option differs between at least two reachable states (implied by the first row) | | |

### 7.3 Exact analysis (pure, `rules.ts`)

State `s` = the set of (check, result) observed. Weights `w_s[h] = prior[h] · Π_{(c,r)∈s} L_{c,r}[h]`, posterior `P(h|s) = w_s[h] / Σ w_s`.

- **Expected value of deciding now:** `EV_d(s) = Σ_h P(h|s) · pay[d][h]`, and `Decide(s) = max_d EV_d(s)`.
- **Result probability:** `P(r | s, c) = Σ_h w_s[h] · L_{c,r}[h] / (den_c · Σ_h w_s[h])`.
- **Best plan value** (expectimax over at most 3⁴ = 81 states):
  `V(s) = max( Decide(s), max_{c ∉ s} [ −cost_c + Σ_r P(r|s,c) · V(s ∪ {(c,r)}) ] )`.
  Results with probability 0 are skipped.
- **Value of an action** `Q(s, a)`: for "decide d", `EV_d(s)`; for "run c", the bracket above. The player's action at s loses `V(s) − Q(s,a) ≥ 0`. Zero means "a best choice" (ties: "one of the best choices").
- **Myopic net value of a check** (shown before the first step): `Σ_r P(r|∅,c) · Decide({(c,r)}) − Decide(∅) − cost_c`. Labels: "worth checking (+1.8)" / "not worth its cost (−0.4)".
- **Best first steps** (for the review): the policy tree of V(∅), cut at depth 2 for display (deeper steps as text).

All values are exact fractions and are displayed with at most two decimals (§ 17.3).

### 7.4 Review

1. **What really happened** ("It rained.") and **your result**: `pay[d][truth] − Σ costs` ("Outdoors in the rain: −12, checks −3: −15 points").
2. **Decision versus outcome** — one of four plain sentences:
   - best decision, good outcome: "A good decision, and it worked out."
   - best decision, bad outcome: "A good decision with an unlucky outcome: with what you knew, this was the better choice."
   - weaker decision, good outcome: "This worked out, but with what you knew the other option was better on average."
   - weaker decision, bad outcome: "With what you knew, the other option was better on average."

   "Best decision" means `EV_d(s_final) = Decide(s_final)`, the decision is judged at the state the player reached. A separate line covers the checks.
3. **Your investigation**: one row per step: what you did, the best possible action at that point, and the expected value of each ("Asked the farmer — best possible here (8.3)"; "Decided without more checks — 6.0; asking the farmer first: 8.3").
4. **What each check was worth** at the start (myopic bars, § 11.4) and **the best plan** from the start as a small tree.
5. **Your estimate** versus the exact posterior at your final state (gap, § 10.1) and the forecast score (§ 10.3).
6. **Formulas** (`<details>`): EV of each option at the final state, written out with the numbers.

"Expected value" is introduced once, gently: "The average result if you faced exactly this situation many times."

---

## 8. Mode "Thinking traps"

### 8.1 Flow

A short story and one or two questions on one screen, then "Check my answers" opens the review with the visual explanation, then "Next case". Answers stay editable until "Check my answers". The skip option exists as in § 5.1.

### 8.2 Question types

- `choice`: 2–4 options (radio buttons), exactly one correct by the exact maths (e.g. "more likely / less likely / just as likely").
- `prob`: a probability estimate with the binary belief slider (§ 12), "How likely is …?", scored by the gap (§ 10.1).
- `count`: a choice among 4 numbers (for "how many fewer per 1,000"); scored as `choice`.

### 8.3 Template interface (`src/traps.ts`, pure)

```ts
interface TrapTemplate {
  id: string;                       // 't-sensor', …
  levels: readonly Difficulty[];
  /** Integer parameters for one case, drawn from the difficulty grid; retries until `valid`. */
  draw(rng: Rng, difficulty: Difficulty): number[];
  valid(params: readonly number[]): boolean;          // also used by isValidState
  questions(params): readonly TrapQuestion[];          // kind + exact answer (Fraction | option index) + option ids
  explain(params): ExplainSpec;                        // visual data (§ 11), pure
  textParams(params): Record<string, NumberToken>;     // numbers for the story placeholders
}
```

Twelve templates are in the content doc § 5 (base-rate test, gambler's spinner, which sequence, conjunction, Simpson, the paw print, small bakery, three drawers, at least one rainy day, shared numbers, relative vs absolute change, dice sums). Each has an exact answer function and a **different** oracle in the tests (enumeration of the sample space, Pascal's triangle, brute-force counting), § 19.

---

## 9. Exact arithmetic

### 9.1 Fractions

`rules.ts` holds a tiny immutable `Frac` on **BigInt** (`{ n: bigint; d: bigint }`, always reduced, `d > 0`): `frac`, `add`, `sub`, `mul`, `div`, `cmp`, `toNumber`, `normalise(weights) → Frac[]`. BigInt is available (target ES2022, as black-box's tests use it). Fractions never enter the state: the state holds only integers (§ 14), and fractions are recomputed on demand (each in microseconds).

**Bounds (enforced by `isValidState`, so a tampered save cannot blow up the arithmetic):** `priorDen ≤ 1000`, `den ≤ 100`, ≤ 4 clues or checks → weights ≤ 1000 · 100⁴ = 10¹¹. Payoffs |pay| ≤ 30, costs ≤ 4. These are safe even as plain numbers, but BigInt removes the question altogether.

### 9.2 Exact draws

`drawIndex(weights: readonly number[], rng)`: `W = Σ weights` (integer ≤ 2⁵³). Draw a uniform integer `u ∈ [0, W)` by rejection: take 32-bit words `x = floor(rng.next() · 2³²)`. If `W ≤ 2³²`, use one word; otherwise use 21 + 32 bits, `x = hi · 2³² + lo`. Accept when `x < floor(2^k / W) · W` and return `x mod W`; else draw again. Then return the first i with `Σ_{j≤i} w_j > u`. Tests: exact frequencies over all 2¹⁶ inputs of a stub RNG for small W; no index with weight 0 is ever returned (property).

### 9.3 Display rounding

Exact values are shown rounded (§ 17.3). Comparisons and scores always use the exact fractions; only the displayed text rounds. When rounding hides a difference that matters (e.g. two options both "6.0" points), the text says "about the same (6.00 vs 5.98)" by showing two decimals.

---

## 10. Scoring and feedback (exact formulas)

Notation: the exact posterior is `p` (a vector of fractions). The player's belief is `b`, integer percents with `Σ b = 100`, read as `b_h / 100`. A skipped estimate has no `b` and gets no score.

### 10.1 Gap to the exact answer

`gap = 100 · ½ Σ_h |b_h/100 − p_h|`, in percentage points. For two hypotheses this is `|b_0 − 100·p_0|`. Bands (inclusive upper bounds):

| Band | Condition | Words (en) | Mark |
|---|---|---|---|
| `spot` | gap ≤ 5 | "Very close to the exact answer" | ●●● |
| `close` | gap ≤ 12 | "Close" | ●●○ |
| `off` | gap ≤ 25 | "Some way off" | ●○○ |
| `far` | gap > 25 | "Far from it — this one surprises most people" | ○○○ |

Each review line also shows both numbers ("You: 55 % · Exact: 60 %").

### 10.2 How far you moved (clue mode, per step k)

The comparison is with the update **from the player's own previous belief**, so an earlier error is not punished twice. `prev` = the player's committed belief at step k−1 (step 1: the exact base rate; after a skipped step: the exact posterior of that step).

- **What this clue justified from `prev`:** `t_k = normalise(prev_h · L_k[h])` (exact). Shown as: "From your 40 %, this clue justified about 70 %."
- **Two hypotheses — the movement ratio.** With `clamp(x) = min(max(x, 0.005), 0.995)` and `logit(x) = ln(x/(1−x))`: `m = logit(clamp(b_k)) − logit(clamp(prev))` and `J = ln(L_k[0] / L_k[1])`.
  - `L_k[0] = L_k[1]` (neutral or echo clue): "This clue fits both explanations equally, so it changes nothing" — plus "and you stayed put ✓" if `|b_k − prev| ≤ 2` pp, else "but you moved by X points".
  - one likelihood is 0 (decisive clue): "This clue rules out ■ South" — plus "✓" if the excluded hypothesis is ≤ 2 % in b_k.
  - otherwise `r = m / J`, classified as: `r < 0` "moved the other way"; `[0, 0.5)` "moved much less than the clue justified"; `[0.5, 0.8)` "moved a little less"; `[0.8, 1.25]` "about the right amount ✓"; `(1.25, 2]` "moved a little too far"; `> 2` "moved much too far". Floats are fine here: this is feedback text, never state.
- **Three hypotheses:** the gap between `b_k` and `t_k` (§ 10.1 bands) and the sentence "From your previous estimate this clue justified ● 20 % · ■ 50 % · ▲ 30 %".
- **Base-rate neglect flag (step 1).** With the likelihood-only answer `n = normalise(L_1)`: if `TV(n, p_1) ≥ 10 pp` and `TV(b_1, n) < TV(b_1, p_1)`, show: "Your estimate is close to what the clue alone suggests. The base rate (● North sends only 3 in 10 parcels) pulls the answer down — see the counting board."

### 10.3 Forecast score (outcome-based, final belief)

The final belief of a clue case (and the belief before deciding in a checks case) is a forecast of what really happened. With `o` = one-hot truth, the **Brier score** is `B = Σ_h (b_h/100 − o_h)²` (0 … 2), shown as the **forecast score** `S = round(100 · (1 − B/2))` (0 … 100, higher is better). For two hypotheses this equals `100 · (1 − (b_true/100 − 1)²)`.

- Shown next to it: the exact estimate's score on the same outcome, `S* = 100 · (1 − Σ_h (p_h − o_h)²/2)`, and the reference "Always saying 50 : 50 gives 75" (two hypotheses) or "Always saying a third each gives 67" (three; 66.7 rounded).
- The gentle explanation (one sentence, plus a `<details>` with the formula): "It rewards being sure when you are right and costs more the surer you were when wrong. Over many cases you get the best average by saying exactly how sure you are." This is the property of a **proper scoring rule**: `E_p[S(b)]` is maximised exactly at `b = p`. A property test checks this on a grid (§ 19.1).
- Why Brier and not the log score: Brier is bounded, so one confident miss does not dominate a round, and it is easier to explain. The log score would be infinite at 0 %.
- A single case can make a good estimate look bad. The review says so when `S < S*` would mislead: "Your estimate was close to the exact one; this case was one of the 28 in 100 that go the other way."

### 10.4 Checks mode

The decision loss is `V(s_final) − EV_{d_chosen}(s_final)` (0 = best), and the plan loss per step is `V(s) − Q(s,a)` (§ 7.3). Both are shown as points with up to two decimals, never as a grade.

### 10.5 Round summary

Shown once after the last review; calm and factual:

- One row per case: title, kind, the gap mark of the final estimate (clue/trap), "best decision ✓ / other option better on average" (checks), and the outcome.
- **Closeness:** "Final estimates very close: 3 of 4 · close: 1" (skips not counted, no mention of skips).
- **Movement habit** (≥ 3 informative binary steps): the median `r`. Below 0.8: "You tended to move less than the clues justified. That is a common pattern — evidence often deserves a bigger step." Above 1.25: "You tended to move further than the clues justified." Else: "Your steps were about the right size."
- **Base rates** (≥ 1 flag): "In 2 cases your first estimate followed the clue and left out the base rate."
- **Forecast:** "Average forecast score: 81 (exact estimates on the same cases: 84)". This appears only with ≥ 2 scored forecasts.
- **Checks:** "Best decision given what you knew: 2 of 3."
- **Traps:** "Matches the exact answer: 4 of 6 questions."
- One **tip** chosen by pattern (`baseRate` > `conservative` > `overreach` > `traps` > `general`), e.g. "Next time try the counting board in your head: imagine 100 cases first."

`finished({ outcome: 'completed', stats: { cases, scored, veryClose, close, forecastAvg, bestDecisions } })` — integers only.

---

## 11. Explanation visuals

All visuals are built in two layers: **pure spec builders** in `src/explain.ts` (`counting(case) → BoardSpec`, `ledger(case, beliefs) → LedgerSpec`, …), which are unit-tested; and **DOM/SVG renderers** in `src/visuals.ts`. Every visual has a visible caption sentence and a text equivalent (§ 16). Hypotheses are told apart by **mark and pattern** (● solid, ■ hatched, ▲ dotted) and by name. Colour is only a reinforcement.

### 11.1 Counting board (natural frequencies)

The core visual, after Gigerenzer-style natural frequencies: "Imagine 1,000 parcels like this one."

- **Population:** the smallest `M = 10^k ≤ 100,000` at which the counts of step 1 are integers (`M · prior[h]/priorDen · L_1[h]/den_1 ∈ ℤ` for every h). The board then extends to as many further steps as stay integral at the same M (easy: always all steps at M ≤ 1,000). The generator grids guarantee that step 1 is integral (§ 6.4).
- **Tree** (HTML, not SVG, so it wraps and reads in RTL): root "1,000 parcels" → one box per hypothesis ("● North: 300") → for each, the split by the observed clue: "blue: 210 ✓" (bold box, solid border) and "not blue: 90" (thin dashed box, text "does not fit the clue"). Only the boxes that fit continue to the next level. Last line: "Of the 350 parcels that fit everything, 210 are from North → 210 out of 350 = 60 %."
- **Icon array** (SVG) in addition when `M = 100` at step 1: 10 × 10 icons, each the hypothesis mark; icons that fit the clue are filled, the others are outlines. Icons are sorted into blocks per hypothesis, and each block is labelled with its count. `aria-label` = the same sentence as the caption.
- At 360 px the tree stacks vertically (one hypothesis per row with its two children side by side).

### 11.2 Evidence chain (the ledger; always shown, all steps)

One row per step (base rate, clue 1 … clue n):

```
                     ● North          ■ South
Base rate            3        :       7            ●●●▓▓▓▓▓▓▓   30 % · 70 %
Clue 1 blue          × 7      :     × 2   → 3 : 2   ●●●●●●▓▓▓▓   60 % · 40 %     You ◆ 55 %   (moved about the right amount ✓)
Clue 2 not brown     × 7      :     × 4   → 21 : 8  ●●●●●●●▓▓▓   72 % · 28 %     You ◆ 60 %   (moved a little less)
```

- Multipliers are the likelihoods of the observed result, reduced over the hypotheses by their gcd ("7 in 10 vs 2 in 10" → "× 7 : × 2"). The weights are reduced by their gcd after every step. These are always small exact integers. The method needs no formula: "Multiply each side by how often the clue happens there."
- A **split bar** per row (proportional, patterns per hypothesis). The player's estimate is a ◆ marker with a text label, the exact value a │ marker. The bar follows the reading direction (it shows a split, not a numeric axis).
- A neutral or echo row shows "× 1 : × 1 — nothing changes" and is highlighted with text, not colour.

### 11.3 Formulas (expandable `<details>`, closed by default)

- Bayes' rule with the case's numbers: `P(North | blue) = P(blue | North) · P(North) / P(blue) = 0.7 · 0.3 / (0.7 · 0.3 + 0.2 · 0.7) = 0.21 / 0.35 = 60 %`.
- The odds form: `posterior odds = prior odds × likelihood ratio: 3/7 × 7/2 = 3/2`.
- Formulas are `dir="ltr"` with `<bdi>` around translated names. `P(… | …)` notation is the same in every locale. Decimal separators come from `Intl`.

### 11.4 Checks visuals

- **What each check was worth** (start of the case): horizontal bars around a zero line, one per check, length = myopic net value. They are labelled with text ("+1.8 worth it", "−0.4 not worth its cost") and the bars have a pattern for negative values. This is a numeric axis, so `direction: ltr`.
- **Best plan tree**: HTML nested boxes: "Ask the farmer (−2) → says rain: book the hall · says dry: check the barometer → …", cut at depth 2.

### 11.5 Trap visuals (specs in `explain.ts`, one renderer each)

| Spec | Used by | Rendering |
|---|---|---|
| `board` | sensor, paw, drawers | the counting board of § 11.1 (population from the template) |
| `grid` | dice | 6 × 6 SVG grid of outcomes, matching cells marked with their sum and a fill (+ count text) |
| `table` | Simpson, conjunction | HTML table with group rows, bold winner per row, text "better" marks |
| `bars` | small bakery | two small bar charts of the exact distribution (share of rye loaves per day), threshold line, tail shaded with a hatch, numbers on the tail; `direction: ltr` |
| `sequence` | wheel, sequences | rows of outcome symbols (● ○ / ★ ·), each with its exact probability "1 in 64" |
| `product` | at least one, shared numbers, absolute | a step list "4/5 × 4/5 × … = 21 %" with a progress bar per step |

---

## 12. Belief input

### 12.1 Two hypotheses

```
How sure are you now?
● North  ███████████▓▓▓▓▓▓▓▓▓▓▓▓▓  ■ South
         42 %                  58 %
[ − ]  ────────◆──────────────  [ + ]        (before this clue: ◇ 30 %)
"42 in 100 North · 58 in 100 South"
```

- A native `<input type="range" min="0" max="100" step="1">`. Its value is the share of the **first** hypothesis: the first hypothesis's segment grows toward the inline end. The range follows the page direction (in RTL it flips with the layout, which keeps "segment grows with the thumb"). `aria-valuetext` = "North 42 percent, South 58 percent".
- "−" and "+" buttons (44 px) change the value by 1. The keyboard uses the range defaults: arrows ±1, PageUp/PageDown ±10, Home/End 0/100. The thumb has a 44 px hit area.
- A ghost marker ◇ shows the belief before this clue, so movement is visible.
- The natural-frequency line ("42 in 100") reinforces the frequency framing.

### 12.2 Three hypotheses

A stacked split bar (display only) and one row per hypothesis: mark, name, percent and a stepper "− 42 +" (`role="spinbutton"`, `aria-valuenow/min/max`, ArrowUp/Down ±1, PageUp/Down ±10, Home/End 0/100).

**Rebalancing rule** (pure `setShare(b, i, v)` in `rules.ts`): hypothesis i takes the value v ∈ [0, 100]. The remaining `R = 100 − v` is split among the others in proportion to their current values; if all of them are 0, it is split equally. Integer results come from largest remainders, ties going to the lower index. Properties: sum stays 100, all values ≥ 0, and the order of the others is kept. A "Spread evenly" button sets 34/33/33.

### 12.3 Saving

The draft is part of the state. `requestSave()` runs on `change` (range release, stepper press) and on blur, never on every `input` event. Nothing depends on timers.

---

## 13. Settings (start screen) and `settingsOf`

```ts
settings: [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode',
    values: ['clues', 'checks', 'traps', 'mixed'], default: 'clues', hintKey: 'mode.hint' },
  { kind: 'difficulty' }
]
settingsOf: (state) => ({ mode: state.mode, difficulty: state.difficulty })
```

- Four values → radio buttons. `mode.hint`: "Clue by clue: update your belief as evidence arrives. Choose the checks: decide what is worth finding out. Thinking traps: short puzzles. A bit of everything: all three."
- Difficulty labels: `difficulty.easy` "Easy (counts out of 10)", `difficulty.medium` "Medium (percentages)", `difficulty.hard` "Hard (rare cases, three explanations)".
- `newGame` treats `options.settings` as untrusted: an unknown mode → `clues`, an unknown difficulty → `easy`. `begin` has no effect (there is no intro screen). No `setupInGame`.
- **Display preferences inside the game** (per-device `preferences`): "Show the formulas open" (the `<details>` default). Nothing else.

---

## 14. State (plain JSON, `stateVersion: 1`) and migration

```ts
type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'clues' | 'checks' | 'traps' | 'mixed';
type Belief = number[];                       // whole percents, length = hypotheses, Σ = 100, each 0..100
type Answer = Belief | 'skip';

interface PdState {
  v: 1;
  seed: number;                               // uint32
  difficulty: Difficulty;
  mode: Mode;
  cases: CaseState[];                         // 5 (checks: 3); kinds follow the mode (§ 5; mixed: clues, trap, checks, trap, clues)
  index: number;                              // current case 0..len−1; len = summary
  reported: boolean;                          // finished() called (never twice, also after restore)
}

type CaseState = ClueCase | CheckCase | TrapCase;

interface ClueCase {
  kind: 'clues';
  template: string;                           // template id (kind 'clues')
  hyps: number;                               // 2 or 3 (the template's first hyps)
  priorDen: 10 | 100 | 1000;
  prior: number[];                            // length hyps, each ≥ 1, Σ = priorDen
  clues: { id: string; den: 10 | 100; num: number[]; result: 0 | 1 }[];   // 2..4, ids distinct, from the template pool; num[h] ∈ 0..den
  truth: number;                              // 0..hyps−1; weight under all results > 0
  answers: Answer[];                          // committed steps, 0..clues.length; revealed clues = min(answers.length + 1, n)
  draft: Belief;                              // belief being edited for the current step
}

interface CheckCase {
  kind: 'checks';
  template: string;
  priorDen: 10 | 100 | 1000;
  prior: [number, number];
  checks: { id: string; den: 10 | 100; num: [number, number]; cost: number; result: 0 | 1 }[];  // 3..4, cost 1..4
  options: { id: string; pay: [number, number] }[];   // 2..3, pay −30..30, ids from the template
  truth: 0 | 1;
  done: number[];                             // indices of checks run, in order, distinct
  deciding: boolean;                          // on the decision screen
  draft: Belief;
  answer: Answer | null;                      // committed with the decision
  decision: number | null;                    // option index; non-null ⇔ review
}

interface TrapCase {
  kind: 'trap';
  template: string;
  params: number[];                           // template-specific integers, ≤ 12 entries, checked by template.valid
  drafts: (number | null)[];                  // per question: option index or percent
  answers: (number | 'skip')[] | null;        // committed ⇔ review
}
```

- **Phase is derived, not stored:** a clue case is in review when `answers.length === clues.length`; a checks case when `decision !== null`; a trap case when `answers !== null`. This removes inconsistent combinations.
- **Everything numeric is stored** (base rates, clue numbers, payoffs, trap parameters), so later changes to template grids never alter a saved case. Saves hold template ids, never texts.
- `isValidState(x)` never throws. It checks every field's type and bound above, `cases.length` and kinds per mode, known template ids of the right kind, clue/check/option ids in the template, `Σ prior = priorDen`, every `num` within `0..den`, a truth with positive weight under the stored results (`prior[truth] · Π L[truth] > 0`), beliefs (length, 0..100, Σ 100), `done` distinct and in range, `decision ⇒ answer !== null`, `deciding` false once decided, trap `params` per `template.valid` and `drafts`/`answers` length = the template's question count, `index ≤ len`, and `reported ⇒ index === len`. Unknown or retired-and-removed template ids → invalid (the save is discarded with the host's calm message rather than crashing).
- The PRNG state is not stored: all randomness is spent in `newGame`.
- **Pure transitions** (`rules.ts`), each returning the same object when nothing changes (the view saves only real changes): `createRound(seed, difficulty, mode)`, `setDraft`, `setShare`, `resetDraft`, `commitStep(answer)`, `runCheck(c)`, `toDeciding(bool)`, `decide(option, answer)`, `setTrapDraft(q, v)`, `checkTrap(answers)`, `nextCase`, plus the derived `phase`, `posteriors`, `review(case)`, `summary(state)`.
- **Migration policy:** `stateVersion` stays 1 while changes are additive in content. Template ids are never reused or removed: a template that should no longer appear gets `retired: true` (kept in the tables and texts, excluded from selection), so old saves stay valid. An incompatible state change bumps `stateVersion` and adds `migrateState(state, 1)`; if a v1 save cannot be migrated, it is reported as corrupt. That is acceptable for a round of a few minutes and is stated in the migration.
- **End:** "See summary" sets `index = len`; the summary renders, `finished()` runs once (guarded by `reported`, which is saved), and the host shows its calm finished panel ("Another round" / "Change settings"). Reopening a finished save shows the summary again without a second `finished()`.
- `reset()` = the same seed's round from its start. `pause()` blocks input (there are no timers).
- **The truth never reaches the DOM before the review** (no data attributes, no hidden text); a view test asserts this.

---

## 15. UI layout

### 15.1 Desktop (≥ 48 rem): two columns (CSS grid, logical properties)

```
┌────────────────────────────── Case 2 of 5 · Clue by clue ─────────────────────────────┐
│ CASE FILE                                         │ HOW SURE ARE YOU NOW?  (sticky)    │
│ The blue parcel                                   │ ● North ████████▓▓▓▓▓▓▓▓ ■ South   │
│ A parcel without a sender…                        │   42 %               58 %          │
│ What we know                                      │ [−] ────◆─────────── [+]           │
│  Parcels here come from: ● North 3 in 10          │ before this clue ◇ 30 %            │
│                          ■ South 7 in 10          │ 42 in 100 North · 58 in 100 South  │
│ ┌ Clue 1 ───────────────────────────────────────┐ │ [ Next clue ]                      │
│ │ The parcel is wrapped in blue paper.           │ │ Skip — just show me               │
│ │ Wrapped in blue: ● North 7 in 10 · ■ South 2/10│ │ ▸ How to think about it           │
│ └────────────────────────────── you: 55 % ──────┘ │                                    │
│ ┌ Clue 2 ─ …                                    ┐ │                                    │
└───────────────────────────────────────────────────┴────────────────────────────────────┘
```

The review replaces the right column with the verdict and runs full width below: what really happened → counting board → evidence chain → forecast score → formulas → "Next case".

### 15.2 Phone (360 px): one column, belief panel sticky at the bottom

```
┌ Case 2 of 5 ───────────────┐
│ The blue parcel             │
│ story (2–3 lines)           │
│ What we know                │
│ ● North 3 in 10             │
│ ■ South 7 in 10             │
│ ┌ Clue 1 ────────────────┐ │
│ │ Wrapped in blue paper.  │ │
│ │ ● North 7 in 10         │ │
│ │ ■ South 2 in 10         │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤  ← sticky, ~150 px
│ ● 42 % ███████▓▓▓▓▓▓ 58 % ■ │
│ [−] ──────◆────────── [+]   │
│ [ Next clue ]   Skip        │
└─────────────────────────────┘
```

- Frequency rows wrap to one line per hypothesis. Checks are stacked cards with the cost and the "Run this check" button on their own line. The decision table becomes one card per option.
- The counting board stacks per hypothesis (§ 11.1). The ledger rows become cards (weights line, bar, "You / Exact" line).
- No horizontal page scroll (e2e check). The icon array scales by `viewBox`.

### 15.3 Checks and traps

Same frame. Checks: left the case file (story, decision table, check cards); right/sticky "Points spent: 3 · [Ready to decide]". The decision screen shows the belief panel plus option radios and "Decide". Traps: one column, the questions as fieldsets, "Check my answers".

---

## 16. Accessibility

- Semantic structure: case title `h2`; "What we know", "Clue n", "How sure are you now?", "What really happened", "How the numbers work out" as `h3`. After each commit, focus moves to the new clue's heading or to the review heading. The polite live region announces the new clue or result ("Clue 2: the label is not smudged.") once per action.
- Controls: a native range plus buttons (two hypotheses); spinbuttons (three); radio fieldsets for options and choices; all targets ≥ 44 px; visible focus. Enter on a focused range does nothing special (no accidental commit); the commit is a button.
- **No colour-only information:** marks ● ■ ▲, patterns (solid/hatched/dotted), words ("fits the clue", "ruled out", "best choice ✓"). The forced-colours mode uses system colours, and differences are carried by pattern and line style.
- **Text equivalents:** the counting board is HTML text; the icon array and charts have `aria-label` and a visible caption; the ledger is readable as text rows; the dice grid has a caption ("6 of 36 outcomes have the sum 7").
- Numbers in `<bdi>`; formulas `dir="ltr"`; numeric axes (`bars`, the check-value chart, the dice grid) `direction: ltr`; split bars and the slider follow the reading direction (§ 12.1).
- `reducedMotion`: no animation is needed. A clue card may fade in (150 ms) only when motion is allowed.
- Known limitation, stated in `rules`: the icon array is a visual aid; its content is always also given as text.

---

## 17. Localisation

### 17.1 Files

- `src/templates.ts` — language-neutral: template ids, kind, levels, hypothesis ids, clue/check/option ids with patterns, number grids, cost and payoff grids, fallback fixtures, `retired`. Transcribed from the content doc.
- `src/content/<locale>.ts` (16 files, ADR 0011, loaded by `preload`; `content/index.ts` = `CONTENT_LOADERS` + `preloadContent`/`contentFor`, as in fermi-lab): per template `title`, `story`, hypothesis names, the base-rate lead line, per clue `label`/`seen`/`notSeen`, per check `label`/`yes`/`no`, per option `label`, `truthLine` per hypothesis ("It was the parcel from North."), the counting-board noun in plural forms (§ 17.4), and trap stories/questions/options/explanations with `{placeholders}`.
- `src/messages.ts` + `src/locales/<locale>.ts` — UI strings (16 locales, typed against the English keys as in Best Plan): identity, settings, buttons, belief panel, bands, movement sentences, review headings, forecast explanation, decision/outcome sentences, summary phrases, tips, number templates.

Volume estimate: about 170 UI keys; content ≈ 12 clue templates × 24 + 6 checks × 26 + 12 traps × 9 ≈ 550 strings per locale (comparable to Estimation Lab's content plus UI).

### 17.2 Writing rules for translators (a note at the top of `content/en.ts`)

- Numbers never appear inside story sentences. They are filled in from placeholders (`{p0}`, `{k}`) or shown in structured rows ("Label — ● Name: 7 in 10").
- Count phrases use the template `freq` = "{k} in {n}" (de "{k} von {n}", fr "{k} sur {n}", ru "{k} из {n}", ja "{n}のうち{k}", ar "{k} من {n}"). It has no noun, so it needs no plural.
- Keep hypotheses neutral: no person names, no national stereotypes (§ 4).

### 17.3 Number formatting (`src/format.ts`, pure, tested)

- Percent: `Intl.NumberFormat(bcp47Tag(locale), { style: 'percent', maximumFractionDigits: 0 })`, which handles sign placement (tr "%70") and locale digits (ar). For exact values strictly between 0 and 1 % or 99 and 100 % it uses one decimal; for values below 0.1 % it uses the message `pct.below` "less than {p}" (so 0.13 % shows as "0.1 %" and 0.04 % as "less than 0.1 %"). Exactly 0 and 100 % are shown as such.
- Frequencies: `freq` with `Intl.NumberFormat` integers (grouping per locale).
- Points and expected values: `maximumFractionDigits: 2`, `signDisplay: 'exceptZero'`, with the proper minus sign U+2212 (black-box pattern).
- Fractions in formulas: "210/350" (digits via `Intl`), `dir="ltr"`.

### 17.4 Plurals (counting board only)

The board says "Imagine 1,000 parcels like this one" and "300 parcels from North". Each template's noun is given per locale as **plural-category forms containing `{n}`**, e.g. en `{ one: '{n} parcel', other: '{n} parcels' }`, ru `{ one: '{n} посылка', few: '{n} посылки', many: '{n} посылок', other: '{n} посылки' }`, ja `{ other: '{n}個の小包' }`, ar with all six categories. `countNoun(locale, n, forms)` selects `forms[new Intl.PluralRules(tag).select(n)] ?? forms.other`. A content test asserts that every noun has every category that `new Intl.PluralRules(tag).resolvedOptions().pluralCategories` reports for its locale. All other counts use "Label: {n}" or "{k} of {n}" phrasing, as in the rest of the repository.

### 17.5 RTL

Logical properties throughout. Split bars and the slider follow the reading direction. Numeric charts and formulas are LTR (repository precedent). The Arabic view is checked in the view test and in the e2e smoke test.

### 17.6 Preview locales (ADR 0003 amendment)

The plan ships **all 16 locales** (no `metadata.locales`, no `status`). Owner question 3 asks whether an early en + de preview is wanted instead.

---

## 18. Preview (catalogue SVG, for the orchestrator)

Decorative, `aria-hidden`, light/dark via `currentColor`. A case-file card outline (folded corner) at the top. Below it, a horizontal split bar (left part solid, right part hatched) with a diamond marker on the split. Below that, a tiny frequency tree: one root box → two boxes → each splitting into a bold box and a dashed box. No text, no digits (language-neutral), and symmetric enough for RTL.

---

## 19. Test plan

### 19.1 `test/rules.test.ts` (TDD + fast-check; fast, mutation-relevant)

- **Fractions:** field laws on random small integers (`add` commutative/associative, `mul` distributes, `div(mul(a,b),b) = a`); always reduced with `d > 0`; `cmp` total order consistent with `toNumber` on non-ties; `normalise` sums to exactly 1.
- **Bayes chain:** a property for random prior/clue integers: `posteriors` equals an **independent population oracle** (test helper: build an explicit integer population of size `priorDen · Π den`, filter by each clue result, count per hypothesis). Order independence: permuting the clues gives the same final posterior. A neutral clue leaves the posterior unchanged. A zero likelihood gives exactly 0.
- **drawIndex:** exactness on a stub RNG that returns chosen 32-bit words (including the rejection zone) for tiny W; weight-0 indices are never drawn; the result lies in range for W up to 2⁵³ (property).
- **Gap and bands:** boundaries exactly at 5, 12 and 25 pp (both sides); the binary case equals |b₀ − 100 p₀|; symmetry under swapping hypotheses.
- **Movement:** classification boundaries of `r` (0, 0.5, 0.8, 1.25, 2); neutral and decisive branches; the "justified from your previous" target `t_k` equals Bayes from `prev`; a skipped previous step uses the exact posterior.
- **Base-rate flag:** a hand-made positive case and a negative one.
- **Forecast score:** the formula on hand values (always 50:50 → 75; certain and right → 100; certain and wrong → 0); **properness** on a grid (for every p in 0, 0.05, …, 1, `E_p[S(b)]` over integer b ∈ 0..100 is maximised at b = round(100p)); three-hypothesis uniform → 66.7.
- **`setShare`:** Σ = 100, all values ≥ 0, the set value is kept exactly, the others keep their order (property).
- **Checks analysis:** `V(s) ≥ Decide(s)`; `V(∅) ≥` the value of every fixed check sequence; `Q(s,a) ≤ V(s)`; adding a check with `num[0] = num[1]` never raises V; the hand examples of the content doc § 4 (exact fractions, e.g. picnic V(∅) = 208/25).
- **Transitions:** random action sequences never throw and always satisfy `isValidState`; `commitStep` is a no-op in review; `runCheck` is a no-op for a check already run or after deciding; `decide` requires an option; the summary is reached only after all reviews; `reported` flips once.
- **`isValidState`:** `fc.anything()` never throws; every generated state is valid; tampered fields are rejected (Σ prior ≠ priorDen, num > den, unknown clue id, truth with zero weight, belief Σ ≠ 100, duplicate in `done`, decision without answer, wrong case kinds for the mode, oversize arrays, `reported` before the end).
- **`settingsOf`:** a round trip over all 4 × 3 settings.

### 19.2 `test/generate.test.ts`, `test/traps.test.ts`, `test/content.test.ts`, `test/format.test.ts`, `test/view.test.ts`

- **Generator** (small seed counts, fast): determinism (same seed → deep-equal round); distinct templates per round; kinds follow the mode; every accepted case satisfies its filters and the grid bounds; the counting board's step 1 is integral within the population limit; fallback fixtures pass the filters; `accept` cannot see the truth (a type test plus a runtime test that `accept` gets an object without `truth`, and for checks without `results`).
- **Traps:** per template, `answer(params)` equals its oracle on 50 random valid params (oracles: sample-space enumeration for dice/drawers/sequences/conjunction; Pascal's triangle for the binomial tail; brute force over all 100^g assignments for g ≤ 3 and a product formula cross-check for larger g; direct counts for Simpson; the population oracle for sensor/paw); `valid(draw(…))` always holds; the Simpson parameters always show the reversal; the choice options always contain exactly one correct option.
- **Content:** every template id in `templates.ts` has text in all 16 locales (through `CONTENT_LOADERS`); per-template placeholder sets are identical across locales; noun plural categories as in § 17.4; no digits in story/clue sentences (all numbers come from placeholders); every clue pattern is consistent with its grid (a favoured hypothesis always gets the larger number); every template has ≥ 5 clues/checks and exactly one neutral or echo clue where the content doc says so.
- **Format:** percent/frequency/points in all 16 locales (snapshot of `formatToParts` types, not glyphs); the "< 1 %" and "less than 0.1 %" rules; the minus sign; `countNoun` per locale category.
- **View** (jsdom): render each phase of each kind in `en`, `de`, `ar`, `ja`; RTL attribute; the truth is absent from the DOM before review; the range and spinbutton accessible names and values; the live region text after a clue; skip/hint controls present.

### 19.3 Slow tests (`*.slow.test.ts`, ADR 0021 — run by `pnpm test`/CI, left out of Stryker)

- `test/calibration.slow.test.ts`: 20,000 clue cases over fixed seeds (deterministic, so not flaky). Cases are grouped into ten posterior bins; in each bin the observed truth frequency lies within 4 standard errors of the mean exact posterior. The same for checks cases on the posterior at the empty state (truth versus prior).
- `test/generator.slow.test.ts`: 500 seeds × 4 modes × 3 difficulties: fallback rate < 1 % per template and difficulty, and the average generation time < 5 ms per case.
- `test/checks-oracle.slow.test.ts`: 300 random check instances: the DP `V(∅)` equals an independent **population expectimax** (integer counts of a population of size `priorDen · Π den`, recursive partition by results, values compared as integer sums) exactly.

Each slow file stays under 50 % of its timeout under parallel load (calibrate the counts on the CI runner; the reviewer reruns them).

### 19.4 Contract (`test/contract.test.ts`)

`runGameContract(game, { interact })`. The `interact` callback clicks the first `[data-act="plus"]` (belief +1) or, in a trap, the first option radio, then the primary commit button, so save/restore happens mid-round. Settings are sampled by the contract (4 × 3).

### 19.5 E2E (`e2e/games/probability-detective.spec.ts`)

Imports the pure posterior function from `packages/games/probability-detective/src/rules.ts` and uses `readSave`, as Best Plan's spec does.

1. `startGame` with `chooseSetting('mode', 'clues')`, easy. Set the belief with the keyboard (focus the range, press Home, then ArrowRight to the exact posterior read from the save), press "Next clue" and then "Close the case". The review shows "Very close" and "What really happened".
2. `expectResumeAfterReload` in the middle of a clue case with a changed draft (the draft and the revealed clues survive).
3. Checks mode: run one check, then "Ready to decide", choose an option, "Decide". The review shows the decision sentence and the investigation table.
4. Traps mode: answer, check, next.
5. Finish a whole `mixed` round with skips (fast path). The summary appears with the host's "Another round".
6. Keyboard-only clue case (Tab order, the range, buttons).
7. A 360 × 740 viewport: no horizontal scroll, interactive targets ≥ 44 px (bounding boxes), the sticky panel does not cover the focused clue.
8. `ar` RTL smoke: the split bar segment of the first hypothesis sits at inline-start, and the formulas are LTR.

---

## 20. Performance budget

| Item | Budget |
|---|---|
| Generate one case (incl. retries) | < 5 ms average, < 30 ms worst case on CI; a whole round < 50 ms |
| Checks DP (≤ 81 states, BigInt) | < 2 ms |
| Render one phase | < 16 ms on a mid-range phone (no layout thrash; the counting board ≤ 31 boxes) |
| Game code chunk (without content) | ≤ 70 kB minified (≈ 22 kB gzip) incl. English UI messages |
| Content per locale | ≤ 45 kB minified (≈ 14 kB gzip), loaded via `preload` |
| Saves | < 8 kB JSON per round |

---

## 21. Risks

| Risk | Mitigation |
|---|---|
| Feels like a maths test | Case-file framing, hunches not answers, skip without penalty, method hints, no grades/tallies, friendly wording (§ 5.1) |
| "I was right but lost points" (outcome luck) | The forecast score always appears next to the exact estimate's score on the same outcome, with the "28 in 100 go the other way" sentence; decision quality is judged by what was known (§ 7.4) |
| Base rates reinforcing stereotypes | Binding content principles: no people or groups as hypotheses (§ 4); review checklist in the content doc |
| Calibration claims becoming false through generator filters | Filters typed without the truth (and, for checks, without the results); a slow statistical test (§ 19.3) |
| Anchoring on the starting value of the slider | The start is the previous belief, which is the honest "update" framing; the ghost marker shows it; the movement feedback compares with the update from the player's own previous belief |
| Three-hypothesis input is fiddly on phones | Steppers with rebalancing and "Spread evenly"; three hypotheses only on hard |
| Translation volume (~550 content + ~170 UI strings × 15) | Short structured sentences, numbers only in placeholders, a shared `freq` template; owner question 3 offers a preview path |
| Plural forms wrong in some locales | Only the counting-board nouns need plurals, and a test checks every CLDR category per locale |
| Arithmetic overflow from tampered saves | Bounds in `isValidState`; BigInt fractions |
| Too many concepts for one game | Modes are separate on the start screen; the default "Clue by clue" teaches the core idea first; traps stand alone |

---

## 22. Open questions for the owner (max 3, each with a recommendation)

1. **Title.** Recommended: keep your name, **"Probability Detective" / "Wahrscheinlichkeits-Detektiv"**. It is clear about the content and forms a small family with "Network Detective". The alternative is the shorter "Odds Detective" / "Chancen-Detektiv" (§ 2). The id stays `probability-detective` either way.
2. **Calibration notebook across rounds.** Calibration ("do my 70 % cases come true 70 % of the time?") needs dozens of forecasts, more than one round gives. Option: keep the last 400 forecasts *on this device only* (`preferences`, cleared with saves) and show "Your calibration on this device" in the summary once there are ≥ 20 entries, with a "Clear" button. No goals, no reminders, and it is shown only in the summary. Recommended: **yes**. Without it, the summary describes only the current round. The implementation is § 23 step 9 (optional; skipped if the answer is no).
3. **Locales.** Ship all **16 locales** at once (recommended — the text volume is similar to Estimation Lab's, and the content is structured to be easy to translate) or release early as a **preview in English and German** (ADR 0003 amendment, "Work in progress" badge) and add the other 14 later?

---

## 23. Implementation steps (one implementer)

1. **Exact core (tests first):** `Frac`, `drawIndex`, the posterior chain, gap/movement/forecast functions, `setShare`, in `rules.ts`, with `test/rules.test.ts` and the population oracle.
2. **Templates:** `templates.ts` transcribed from the content doc (clue/check/option ids, patterns, grids, costs, payoffs, fallback slots) and `traps.ts` (12 trap templates with `draw`/`valid`/`questions`/`explain`), with `test/traps.test.ts` (oracles) and the arithmetic parts of `test/content.test.ts`.
3. **Generators** (`generate.ts`): clue and checks generators with the filters typed without the truth; round assembly; fallback fixtures (frozen output, then a test that they pass the filters); `test/generate.test.ts`, plus `generator.slow.test.ts` and `calibration.slow.test.ts`.
4. **Checks analysis:** expectimax `V`, `Q`, myopic values and the best-plan tree; `checks-oracle.slow.test.ts`.
5. **State and transitions:** `PdState`, `createRound`, all transitions, `isValidState`, `settingsOf`, `summary`; random action-sequence and fuzz tests.
6. **Text:** `content/en.ts` and `locales/en.ts` first, then `de`, then the other 14; `format.ts` with `countNoun`; `test/format.test.ts` and the locale parts of `test/content.test.ts`.
7. **View:** `explain.ts` (pure specs, unit-tested), `visuals.ts` (board, icon array, ledger, bars, grid, table, sequence, product, check-value chart, plan tree), `view.ts` (case file, belief panel, checks, traps, review, summary), `styles.css`; `index.ts` with `preload`, `settings` and `settingsOf`; `test/view.test.ts`.
8. **Contract and e2e:** `test/contract.test.ts` and `e2e/games/probability-detective.spec.ts`; run the full gate (`pnpm check`, `pnpm build`, the e2e command from the pipeline brief).
9. *(Only if owner question 2 is answered "yes")* the calibration notebook: a pure `notebookAdd`/`notebookBins` in `rules.ts` with tests; written once per case review (guard: the case is in review and its forecast has not been noted yet, tracked by a per-case `noted` flag — an additive optional field, still `stateVersion` 1); the summary section and the "Clear" button.
10. **Report to the orchestrator:** the registry line (append after the existing games), the dependency, the preview (§ 18), the ROADMAP row ("Reasoning — Probability Detective", skills hypothesis & deduction), the optional shared changes (§ 1.3, especially the two Stryker `mutate` lines), and an entry for `docs/third-party.md` stating "all case content is original, no third-party data".
