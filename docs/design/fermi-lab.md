# Estimation Lab (`fermi-lab`) — design

Status: **Implemented, 2026-10-17; two paths since 2026-10-25** (plan by the planner; owner decisions and implementation notes in § 18; the change of 2026-10-25 in § 19 supersedes §§ 4.1, 6.2, 7.2–7.3 and 10 where they differ). Content: [fermi-lab-content.md](fermi-lab-content.md) (46 researched tasks, internationalised).

Scope for the implementer (feature agent, ADR 0006): `packages/games/fermi-lab/` and `e2e/games/fermi-lab.spec.ts`. The orchestrator creates `package.json`, the registry line, the dependency in `apps/web/package.json` and the preview in `apps/web/src/previews.ts` (§ 13 describes it). No new dependencies, no shared-package changes needed for the MVP (§ 1.3 lists optional ones).

Binding inputs: implementation brief (core principles, resumability, determinism, localisation, accessibility, Definition of Done), ADR 0002 (contract), 0006 (roles), 0010/0011 (per-locale content, `preload`), 0017 (start screen, `settings`, `settingsOf`, `begin`).

---

## 1. Survey: overlap and reuse

### 1.1 Overlap

No existing game asks for numbers. The nearest neighbours:

| Game | Relation | Consequence |
|---|---|---|
| `review` / `@wp/learning-content` | Flash cards of facts, spaced repetition. | Estimation Lab is **not** a fact quiz: the answer is reasoned, not remembered, and scored by order of magnitude. Learning records are not written (like Memory: play stays play). A later "estimation facts" deck is possible but is not part of this game. |
| `compression-challenge`, `deep-read`, `briefing-game` | Self-paced text exercises with explanations after answering, per-locale content (ADR 0010/0011). | Same **content architecture**: language-neutral structure + `src/content/<locale>.ts` loaded via `preload`. Same calm "explanation after the answer" pattern. |
| `black-box` | Own number formatting (`format.ts`: proper minus sign, `normalizeDigits`) and a formula parser without `eval`. | Copy the *pattern* (games never import other games): a pure `format.ts` with a parser and a formatter, unit-tested. |
| `rule-discovery` | After solving, explains the information value of each test. | Same spirit for the sensitivity view: show *why*, not just *whether*. |
| `n-back`, `node-conquest` | `Intl.NumberFormat` in the view; small inline SVG charts with `direction: ltr`. | Reuse both conventions for numbers and the scale bars. |

### 1.2 What is reused

- `@wp/game-core`: `GameModule`, `createRng(seed)`, `createLocaleContent` (ADR 0011), `SettingSpec`, `bcp47Tag`.
- `@wp/testing`: `runGameContract`, `startGame`, `expectResumeAfterReload`, `submitStart`, `chooseSetting`.
- `@wp/ui` primitives already used by the text games (buttons, focus handling, live region) — whatever compression-challenge uses.

### 1.3 Optional shared changes (report to the orchestrator; not needed for the MVP)

1. A shared `formatQuantity` / `parseLocaleNumber` in `@wp/localization` (black-box, n-back and this game each format numbers). The game ships its own pure copy first.
2. A skill for quantitative reasoning. The skill list has no "numeracy"; the game uses `systems` and `hypothesis` (§ 2). If the owner wants the catalogue filter to show "estimation / numeracy", the orchestrator would add a skill (shared change + translations).

---

## 2. Identity

| | |
|---|---|
| Package id | `fermi-lab` (`@wp/game-fermi-lab`) — kept neutral so a rename touches no saves |
| English title | **Estimation Lab** (owner decision, § 18) |
| German title | **Schätzlabor** |
| Other locales | the language's own words for "estimation lab": Labo d’estimation, Laboratorio de estimación, Laboratorio di stima, Laboratório de estimativas, Schattingslab, Laboratorium szacowania, Лаборатория оценок, Лабораторія оцінок, Tahmin Laboratuvarı, 見積もりラボ, 估算实验室, 어림 실험실, مختبر التقدير, अनुमान प्रयोगशाला |
| Skills | `systems` (building a model from parts), `hypothesis` (stating and checking assumptions) |
| `typicalMinutes` | `[8, 15]` (one round of 5 questions) |
| `difficulties` | `['easy', 'medium', 'hard']` |
| Capabilities | offline, no audio, no AI, no network, pauseable |

**Why not "Fermi Lab" as the shown title** (the owner chose "Estimation Lab", which avoids the issue as well): "Fermilab" is the common name of the Fermi National Accelerator Laboratory, a real institution. A game titled "Fermi Lab" could look like it belongs to it. "Fermi Questions" names the method (estimation problems in Enrico Fermi's style, a generic educational term) and impersonates nobody. The id stays `fermi-lab` because the pipeline already uses it; ids are never shown. (Owner may choose another title, § 16.)

---

## 3. Pitch and honest value

**Pitch.** How many litres of rain fall on a roof in a year? How heavy is the air in your living room? Nobody knows these by heart, but almost anyone can get within a factor of three by breaking the question into pieces they *can* guess. Estimation Lab gives you one such question at a time. You make a quick gut estimate, then — if you like — build the answer as a product of a few factors with units. Afterwards the game shows a reference calculation, where your assumptions differed, and which assumption moved the result most.

**What it exercises (claims we may make):**
- practice in breaking a quantity into estimable factors (modelling);
- practice in handling large and small numbers, powers of ten and units;
- practice in checking whether a number is plausible;
- seeing your own estimation habits: whether you tend to guess too high or too low, and whether building a model helps you.

**Claims we never make:** no "improves your maths/brain/IQ", no transfer claims, no "learn the facts". The facts in the explanations are a bonus, not the goal.

**Sources and honesty in the game itself:** every task says whether its reference value is *measured* (statistics, physics) or a *model* answer (no official figure exists, e.g. piano tuners), and shows its sources after answering.

---

## 4. Round structure

**A round is 5 questions, one at a time.** After each question its review appears; the next question comes only when the player presses "Next question". After the fifth review, "See summary" shows the round summary; the game calls `finished()` once there.

Why 5 and one at a time:
- **Natural end, no feed.** A fixed, short round ends calmly (8–15 minutes) and the host offers "Another round" only on a deliberate press (ADR 0017). An endless stream of questions would be an infinite feed.
- **Feedback while it matters.** Seeing the reference decomposition right after your own model is where the learning happens; batching five answers before any feedback would separate them.
- **Enough for a pattern.** Five answers are the minimum for a meaningful "you tended to estimate too low" remark in the summary; more would make a round too long for a phone break.
- Questions are independent, so leaving mid-round loses nothing (state saves after every step).

**Choosing the 5 questions (pure, seeded).** From the pool filtered by category (§ 9), sorted by id, pick with `createRng(seed)`: questions of the round's level first, then from the neighbouring level(s) if the filtered pool has fewer than 5 (e.g. *space* + *easy* has 2 level-1 tasks, so 3 level-2 tasks fill up). No repeats within a round. Order: shuffled, but never two tasks with the same answer unit category back to back if avoidable (cosmetic; optional).

Level mapping: easy → level 1 (fill with 2); medium → level 2 (fill with 1, then 3); hard → level 3 (fill with 2).

**Recently shown tasks (change 2026-10-29).** The device remembers the ids of the last **7** tasks shown, in the game's preference `recent` (`context.preferences`, ADR 0017; never in the save; a missing or broken value reads as "none", unknown ids are dropped). A question counts as shown when it is displayed. When a round is chosen, every unseen task of the filtered pool comes before any remembered one (each group in the level order above, shuffled within a level as before); remembered tasks fill up only when fewer than 5 unseen remain, the one seen longest ago first. The random draws do not depend on the memory, so the same seed and the same memory give the same round, an empty memory gives exactly the old round, and "restart" repeats the round it began with. Why 7: about half of the smallest level pool of "All topics" (14 hard tasks), so an "All topics" round never has to leave its level to avoid a recent task, while the window still covers the whole previous round plus two; in a single topic (8–11 tasks) it covers most of the pool, so rounds rotate through the topic.

### 4.1 Per-question phases

```
estimate ──Commit──▶ model (optional) ──Commit──▶ review ──Next──▶ (next question: estimate) … ──▶ summary
          └──"Skip the model, check my estimate"──────▶ review
```

1. **Estimate.** Question text, the answer unit (fixed by the task; the player never chooses the unit of the answer) and the number input (§ 5). Button "This is my first guess". A short hint line: "Rough is fine — you are scored by powers of ten."
2. **Model (optional).** The builder (§ 6). The first guess stays visible, read-only, above it. The live product shows the model's result in the answer unit. Buttons: "Use my model's result" (the model result becomes the final answer), "Keep my first guess" (final = first guess; the model is still compared). Both lead to review. The player may also edit the final value by hand before committing ("Answer: [ value ]", pre-filled with the model result).
3. **Review.** The verdict (§ 7), the scale bar with the player's first guess, final answer, the reference value and plausible range; the reference decomposition next to the player's model (§ 6.4); the sensitivity chart (§ 8); the explanation and sources. Button "Next question" (or "See summary" after the fifth).
4. **Summary** (§ 7.3).

No timers anywhere. Nothing is revealed before commit. A committed answer cannot be changed (it is the honest record), but nothing is punished either.

---

## 5. Number input UX

Large and small numbers are the core interaction, so the input gets three equivalent controls bound to one value:

```
How many grains of rice are in a 1 kg bag?
┌──────────────────────────────────────────────┐
│ Your estimate  [  3,5          ] × 10^ [−][ 4 ][+]   grains │
│ = 35,000 (35 thousand)                                       │
│ 10⁰ ─────────────────●─────────────────────── 10⁹  (slider)  │
│  [÷10] [÷2]                              [×2] [×10]          │
└──────────────────────────────────────────────┘
```

- **Number field** (`inputmode="decimal"`, labelled "Your estimate"): accepts plain numbers in the UI locale ("35000", "35 000", "35.000" in German, "35,000" in English), a decimal separator, and scientific forms `3.5e4`, `3.5E4`, `3,5·10^4`, `3.5×10^4`, `3.5*10^4`, `3.5 x 10^4`, and superscript exponents (`10⁴`). Digits are normalised from Arabic-Indic (U+0660–0669), Extended Arabic-Indic (U+06F0–06F9), Devanagari (U+0966–096F) and full-width (U+FF10–FF19, typed by Japanese/Chinese IMEs). Group and decimal separators come from `Intl.NumberFormat(locale).formatToParts(1234567.8)`; a narrow no-break space, no-break space and apostrophe are always accepted as group separators. A value is valid when it is finite and > 0; zero and negatives get a calm inline message ("Enter a positive number"). The field never rewrites what the player types; the interpretation appears below it.
- **Exponent stepper** "× 10^n" (n from −6 to 30, default 0; buttons − and +, 44 px). The effective value is `field × 10^n`. People who think in powers of ten type "3.5" and press + four times; others ignore it.
- **Interpretation line** (`aria-live="polite"`, updated after a short pause or on blur): the value formatted per § 11.3, e.g. "= 35,000 (35 thousand)" / "= 3.5 × 10⁹ (3.5 billion)". This removes every separator ambiguity: the player sees what the game understood.
- **Log slider** (`<input type="range">`, 0.05-decade steps, `aria-valuetext` = the formatted value with unit). Its window is **10 decades, placed by the seeded RNG** so that the reference value lies at least 2 decades from either end but at an unpredictable position (lower end = `floor(log10(central)) − 2 − r`, `r ∈ {0…5}` from the round's RNG, stored in the state). The slider therefore never hints at the answer. Moving the slider sets the field to a rounded value (2 significant digits) and n = 0 for values below 10⁶, otherwise mantissa + exponent.
- **Step buttons** ÷10, ÷2, ×2, ×10 (44 px): the quick way to say "more like double that".

Keyboard: Tab order field → stepper → slider → step buttons → commit. Enter in the field commits the step. Arrow keys on the slider move by ×1.12; PageUp/PageDown by the browser default; Home/End to the window ends. Touch: all targets ≥ 44 px; the slider thumb has a 44 px hit area. At **360 px** the row wraps: field (full width), stepper and unit on the second line, slider full width, step buttons as a 4-column grid.

**RTL:** text, labels and layout use logical properties. The slider and the scale bars are **numeric axes and keep `direction: ltr`** (small values left), following the repository precedent for charts and formulas (node-conquest chart, proof chain formulas); the numbers themselves are wrapped in `<bdi>`. The unit label stays next to the number on the inline-end side.

---

## 6. The model builder

### 6.1 Shape

A model is a **product of 2–5 factors**. Each factor row has:

- an operator: **×** or **÷** (and, in the free builder, **×²**, **×³**, **÷²** via a small select, needed for volumes and E = mc²);
- the player's value (the same number field + "× 10^n" stepper as § 5, without slider to keep rows compact);
- a unit (§ 6.3);
- a name: given in guided mode, optional free text (≤ 40 characters, stays on the device) in free mode.

Below the rows, the **live product**: `= 2.9 × 10⁴ person` and, when the units reduce to the answer unit, `= 29,000 people ✓ units match`; otherwise "Units left over: m² — check a factor" (no colour-only: an icon plus text).

### 6.2 Two modes (start-screen setting `model`, § 9)

- **Guided** (default): the rows are the **reference factors' names and units, without values** ("Roof area seen from above — m²", "Yearly rainfall — m/year", "Litres in a cubic metre — L/m³ = 1000, given"). Fixed factors (constants, conversions, values in the question) are pre-filled and marked "given". The player fills the open values. This teaches *how* to decompose; it is the right default for most people.
- **Free**: an empty builder with "Add factor" (up to 5). Each new row picks a unit from the task's **unit palette**: the units of the reference factors plus generic ones (1, %, m, m², m³, L, kg, g, s, min, h, day, year, W, Wh, kWh, J) — at most ~14 entries, sorted, so a reference unit does not stand out. Constants of the reference (fixed factors) are offered as "Insert a known constant" chips (e.g. "Seconds in a day = 86,400 s/day") because nobody is expected to estimate the speed of light.

In both modes the model step is optional ("Skip the model").

### 6.3 Units and the live product

Units are data, not free text. `src/units.ts` (pure) holds a table `unitId → { scale, dims }` over base dimensions m, kg, s, K, mol (the table in the content file's checker: mm, cm, m, km, ha, L, mL, µL, g, kg, t, s, min, h, day, year = 365 days, J, kJ, Wh, kWh, kcal, W, Pa, K, mol, 1, %). Compound units in content (`L/(person·day)`, `kWh/(m²·year)`) are parsed once by a small, tested parser (tokens separated by `·`, one `/`, optional parentheses, ² ³). **Count words** (`person`, `piano`, `grain`…) are labels: dimensionless for the algebra, kept for display. The live product multiplies `value × scale` per factor with its power, adds dimension exponents, and converts to the answer unit when the dimensions agree. Pure, deterministic, unit-tested with fast-check (§ 14).

Why not free unit typing: unit parsing across 16 languages is a project of its own and invites frustration. A fixed palette keeps it reliable and still makes the dimensional check meaningful.

### 6.4 Comparison after answering

The review shows the reference decomposition as a table (stacked cards at 360 px):

| Factor | Your value | Reference (plausible range) | Effect on the result |
|---|---|---|---|
| Roof area seen from above | 150 m² | 100 m² (60–200) | ×1.5 too high |
| Yearly rainfall | 0.3 m/year | 0.58 m/year (0.53–0.62) | ÷1.9 too low |
| Litres in a cubic metre | 1000 L/m³ | 1000 (given) | — |

"Effect" = `(your value ÷ reference value)^power`, shown as "×1.5 too high", "÷1.9 too low", "about right" (within ×1.1). The row with the largest |log| effect gets the label "Biggest difference" (text + icon). Guided mode matches rows one to one. In free mode rows are matched to reference factors only when a player row has the same unit *and* power as exactly one reference factor; unmatched rows are listed as "Your other factors" with their combined effect; nothing is graded beyond that.

---

## 7. Scoring and feedback

### 7.1 Rule

Distance in decades: `d = |log10(answer ÷ central)|`. Bands (inclusive upper bounds):

| Band | Condition | Label (en) | Mark |
|---|---|---|---|
| `x2` | d ≤ log10 2 ≈ 0.301 | "Within a factor of 2 — a very good estimate" | ●●● |
| `x3` | d ≤ log10 3 ≈ 0.477 | "Within a factor of 3 — a good Fermi estimate" | ●●○ |
| `x10` | d ≤ 1 | "Right order of magnitude (within a factor of 10)" | ●○○ |
| `x100` | d ≤ 2 | "Within a factor of 100" | ○○○ |
| `far` | d > 2 | "More than a factor of 100 away" | ○○○ |

Plus a direction ("too high"/"too low", or none when d ≤ 0.05) and the factor itself ("You were 2.4 times too low"). If the answer lies inside the task's plausible range, an additional line says so ("Inside the plausible range of 30,000–120,000 L/year") — for tasks with wide real variation (roof sizes, crowds) this matters more than the distance to one central value.

The first guess and, if a model was used, the final answer are both scored; the review shows both on the scale bar.

No points, no streaks, no medals, no "perfect round". The marks are symbols plus text, never colour alone. The tone is factual and friendly; a far-off answer gets "This one is hard to picture — see which factor made the difference", never "wrong".

### 7.2 Scale bar (review)

An inline SVG, `direction: ltr`, decades as ticks across the task's slider window. Markers: first guess (◇, label "First guess"), final answer (◆, "Your answer"), reference (│ with label "Reference"), plausible range as a hatched band (pattern + outline, not colour only). Each marker has a text label; the whole bar has an `aria-label` summarising the three values.

### 7.3 Round summary

Calm and factual, shown once after the fifth review:

- per question: title, band mark, factor and direction (a 5-row list);
- **bias**: geometric mean of `answer ÷ central` over the round, phrased as "On average your answers were 1.8 times too low" (or "close to the reference on average" when within ×1.25) — the one insight people usually do not know about themselves;
- **did modelling help?** only when the model was used at least twice: "With a model your answers were on average closer (×1.6 instead of ×3.1 away)" or "… not closer this time". Neutral either way;
- a tip line chosen by the pattern (e.g. far-off answers on volume questions → "Volumes grow with the cube: doubling a length means eight times the volume").

`finished({ outcome: 'completed', stats: { questions: 5, withinFactor3, withinFactor10, modelsUsed } })`.

---

## 8. Sensitivity display

For a product, every factor's *elasticity* equals its power: a 10 % error in any factor is a 10 % error in the result (30 % for a cubed one). So "which assumption moves the result most" is a question of **how uncertain each factor is**, and the content provides a plausible `low`/`high` per factor.

**Tornado chart** (review, below the comparison): one bar per non-fixed reference factor, sorted by width; the bar spans the result when that factor alone goes from `low` to `high` (others at reference), i.e. `central × (low/value)^power … central × (high/value)^power`, on the same log axis as the scale bar. Text beside each bar: "Grain diameter: 1.1 million – 73 million (factor 64)". Heading: "Which assumption matters most". The widest bar gets the line "This assumption moves the result most." Fixed factors are listed below as "Given / constants (no uncertainty)".

For the player's model (guided mode), each row also shows its own contribution (§ 6.4). The two views answer different questions — "where was *I* off" and "where is the *problem* uncertain" — and the review keeps them separate and labelled.

Pure function in `rules.ts`: `sensitivity(task) → [{ factorId, lo, hi, spanDecades }]`, tested.

---

## 9. Settings (start screen) and `settingsOf`

| id | kind | values | default | notes |
|---|---|---|---|---|
| `difficulty` | difficulty | easy, medium, hard | easy | level 1/2/3 with fill-up (§ 4) |
| `category` | choice | `all`, `everyday`, `nature`, `technology`, `society`, `space` | `all` | > 4 values → host draws a select; labels `category.<value>` |
| `model` | choice | `guided`, `free` | `guided` | `hintKey`: "Guided shows the factors to estimate; free starts with an empty model." |

No round-length setting (fixed at 5, § 4). Display preferences stay in the game: none needed for the MVP.

`settingsOf(state) = { difficulty: state.difficulty, category: state.category, model: state.model }`. `newGame` treats `options.settings` as untrusted and falls back to defaults. `begin` has no effect (there is no intro screen; the first question is the first screen).

---

## 10. State

Plain JSON, `stateVersion: 1`:

```ts
interface FermiState {
  v: 1;
  seed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'all' | 'everyday' | 'nature' | 'technology' | 'society' | 'space';
  model: 'guided' | 'free';
  questions: QuestionState[];      // exactly 5, fixed at newGame
  index: number;                   // 0–4: current question; 5 = summary
  finishedReported: boolean;       // finished() was called (never twice, also after restore)
}

interface QuestionState {
  taskId: string;                  // content id
  windowLo: number;                // integer decade of the slider window (§ 5); window = [windowLo, windowLo + 10]
  phase: 'estimate' | 'model' | 'review';
  draft: string;                   // unsent text of the active number field (≤ 32 chars), restored on resume
  draftExp: number;                // its × 10^n stepper (−6…30)
  firstGuess: number | null;       // committed, finite, > 0
  factors: FactorState[];          // player model (≤ 5), [] if skipped
  modelUsed: boolean;
  answer: number | null;           // committed final answer (finite, > 0)
}

interface FactorState {
  ref: string | null;              // reference factor id (guided) or null (free)
  unit: string;                    // unit id from the palette
  power: -2 | -1 | 1 | 2 | 3;
  text: string;                    // raw input (≤ 32 chars)
  exp: number;                     // × 10^n
  label: string;                   // free-mode name (≤ 40 chars), '' otherwise
}
```

- `newGame({ seed, difficulty, settings })`: resolves settings, selects 5 tasks (§ 4), computes `windowLo` per task from the RNG, sets `index 0`, phase `estimate`.
- Every logical change — commit, phase change, factor added/removed/edited (on change/blur, not every keystroke), draft edited (debounced in the view, saved on blur) — calls `requestSave()`.
- `isValidState(x)`: never throws; checks every field's type and bounds, `questions.length === 5`, unique known `taskId`s (unknown id → invalid, so a save from a future content version is discarded rather than crashing), phases consistent with the committed values (`review` requires `answer`), numbers finite and > 0 where present, string lengths.
- **End of a round:** after the fifth review, "See summary" sets `index = 5`; the summary renders, `finished()` is called once (guarded by `finishedReported`, which is saved), and the host's calm finished screen offers "Another round" / "Change settings". Reopening a finished save shows the summary again, without a second `finished()`.
- **Resume anywhere:** every phase renders from the state alone (including a half-typed estimate and a half-built model). Nothing depends on timers.

---

## 11. Content and localisation

### 11.1 Files

- `src/tasks.ts` — language-neutral: ids, category, level, kind, answer (`central`, `low`, `high`, `unit`), factors (`id`, `value`, `low`, `high`, `unit`, `power`, `fixed`), source URLs/references, confidence. Transcribed from the content document.
- `src/content/<locale>.ts` (16 files, ADR 0011, loaded by `preload`): per task `question`, `answerNoun` (the counted thing for display, e.g. "grains"), per factor `name`, `explain`, and the source descriptions in prose (URLs stay in `tasks.ts`). The English file is the reference text in the content document.
- `src/messages.ts` — UI strings (16 locales): buttons, labels, band texts, summary phrases, category names, unit labels (§ 11.4), the number-reading template for screen readers.

Volume estimate: 46 tasks × ~9 strings ≈ 420 strings per locale (comparable to compression-challenge's content), loaded per locale.

### 11.2 Regional framing

Most tasks are place-neutral or world-wide by design. Five keep an **explicit place** because the number depends on it and the place is part of the question: Berlin (rain-roof), the Rhine at the Dutch border (rhine-day), Germany (solar-panel, city-water) and Frankfurt–New York (airliner-fuel). Translations keep these places and use the language's exonym (Berlin, Rhein/Rhine/Rin/Рейн/ライン川; Frankfurt, New York). The explanations say how the figure differs elsewhere (e.g. US water use). The classic "piano tuners in Berlin" becomes "a city of one million people", which works everywhere. Translators must not localise places ("rain in Tokyo") — that changes the answer.

### 11.3 Number formatting

`src/format.ts` (pure, tested):

- `formatQuantity(value, locale)`: for 0.01 ≤ v < 10⁶ → `Intl.NumberFormat(bcp47Tag(locale), { maximumSignificantDigits: 3 })` (locale grouping and decimal sign, locale digits). For v ≥ 10⁶ or v < 0.01 → mantissa (same formatter, 2–3 significant digits) `× 10` + superscript exponent, followed by the long compact form in parentheses where `Intl.NumberFormat(…, { notation: 'compact', compactDisplay: 'long' })` gives a word form (en "35 thousand", "1.3 billion"; de "1,3 Milliarden"; ja "130万"; zh "13亿"; hi "13 लाख"/"करोड़"), only up to 10¹⁵ (beyond that, compact forms get odd) — so each language gets its own large-number words (lakh/crore, 万/億) for free.
- Superscript exponent: rendered as `<sup>` in HTML (digits via the same formatter so Arabic-Indic digits stay consistent); the accessible name comes from a message template `number.scientific` = "{mantissa} times 10 to the power of {exponent}".
- `parseLocaleNumber(text, locale)` as in § 5. Unit tests cover every locale's separators with `formatToParts`, and a round-trip property: `parse(format(x)) ≈ x` within 3 significant digits.
- The proper minus sign is never needed (all values > 0, exponents may be negative: "10⁻³" uses U+207B).

### 11.4 Units in the UI

Every unit id used in `tasks.ts` (≈ 45 distinct strings, including compound ones) gets a message key `unit.<id>` in all 16 locales, e.g. `unit.L/day` = "L/day", de "L/Tag", ja "L/日", ar "لتر/يوم". SI symbols (m, kg, W, Wh, kWh, J, Pa) stay symbols in every language; words (day, year, h, L in some scripts, count nouns like "people per household") are translated. A test asserts that every unit and count label used by any task has a key in all locales. Metric units only (SI is the international standard and every source is metric); no imperial conversion in the MVP.

---

## 12. View and accessibility

- One column, max ~40 rem, logical properties throughout. At 360 px: question card, input block, model rows as cards (operator + value + unit on one line, name above), review tables as stacked cards. No horizontal page scroll; the scale bar and tornado chart scale to the width (SVG `viewBox`, labels below the bar on narrow screens).
- Headings: question as `h2`; "Your model", "Comparison", "Which assumption matters most", "Explanation", "Sources" as `h3`.
- Focus: after each commit, focus moves to the heading of the new phase; the verdict is announced via the live region.
- All markers and bands have text; colours only reinforce (bands use filled/empty dots plus words; scale-bar markers differ in shape).
- Sources: names as text, URLs as ordinary links (`target="_blank" rel="noopener noreferrer"`); the game works fully offline, links simply need a network.
- `reducedMotion`: no animation needed at all (values update instantly).

---

## 13. Preview (catalogue SVG, for the orchestrator)

Decorative, `aria-hidden`, light/dark via `currentColor`: a question card outline at the top, below it a horizontal log axis with 5 decade ticks, a hatched plausible-range band, a diamond (guess) and a vertical line (reference) close to each other, and underneath three small factor boxes joined by "×" signs. No text, no digits (language-neutral), RTL-neutral (symmetric enough; the axis stays LTR as in the game).

---

## 14. Test plan

**`test/rules.test.ts` (TDD + fast-check)**
- Scoring: band boundaries exactly at ×2, ×3, ×10, ×100 (both directions); symmetry `score(c·k) = score(c/k)`; monotonicity in `|log|`; direction; plausible-range flag; property: for random positive `a`, `c`, `d` equals `|log10(a/c)|`.
- Units: parser on every unit string in `tasks.ts`; property: `dims(u·v) = dims(u)+dims(v)`, `scale` multiplicative; conversion identity (`1 kWh = 3.6e6 J`, `1 year = 365 day`).
- Live product: property for random factor values/powers: equals `Π(value·scale)^power ÷ answerScale`; unit mismatch detected; > 5 factors rejected.
- Comparison and sensitivity: effect ratios, "biggest difference" choice, tornado spans (`hi/lo = (high/low)^|power|`), fixed factors excluded; free-mode matching only on unique unit+power.
- Selection: 5 distinct tasks for every difficulty × category × 200 seeds; fill-up order; determinism (same seed → same round); slider window contains `central` with ≥ 2 decades margin, `r` covers all 6 offsets over seeds.
- Summary: geometric-mean bias, "modelling helped" only with ≥ 2 models.
- `isValidState`: fast-check junk never throws; every state reachable by random action sequences is valid; tampered fields (unknown task id, NaN, negative, too-long strings, wrong phase) are rejected.
- Number parsing/formatting (`format.ts`): all 16 locales' separators, scientific forms, superscripts, the four digit systems, ambiguous inputs ("1.000" in de vs en), rejects 0/negative/empty/garbage without throwing; round-trip property.

**`test/content.test.ts`** — the checks of the content document as code: unique ids; ≥ 8 tasks per category, every level present per category; for every task the reference product converted to the answer unit is within 0.05 decades of `central`, dimensions match, `low ≤ value ≤ high` and `low ≤ central ≤ high`; at least one non-fixed factor; 2–5 factors; every task has text, factor names, explanation and ≥ 1 source in all 16 locales (loaded through `CONTENT_LOADERS`); question texts contain no digits of the central value (no accidental give-away; numbers *in* the question such as "1 kg" or "300 passengers" are allowed when they are fixed factors — the test compares against `central` only); every unit and count label has a message key.

**`test/contract.test.ts`** — `runGameContract(game, { interact })` with an `interact` that types a number and commits (exercises save/restore mid-question). Settings sampled by the contract (ADR 0017).

**`test/view.test.ts`** (jsdom, as other text games): render each phase in `en`, `de`, `ar`, `ja`; RTL attribute; 44 px targets via computed class sizes where the repo's existing view tests do so; screen-reader names of number displays.

**`e2e/games/fermi-lab.spec.ts`** — `startGame` with `difficulty=easy`, category everyday; type an estimate with a locale separator, commit; guided model: fill factors, see "units match", commit; review shows verdict and comparison; `expectResumeAfterReload` in the *model* phase with a half-filled factor (draft restored); finish a round (5 questions via quick commits) and see the summary + host "Another round"; keyboard-only path for one question; viewport 360 px no horizontal scroll; one RTL (`ar`) smoke check.

Heavy property tests stay well under 50 % of their timeout (≤ 200 runs; selection test over 200 seeds is cheap).

---

## 15. Risks

| Risk | Mitigation |
|---|---|
| Facts wrong or outdated | Sources per factor, `kind`/`confidence` per task, content test on arithmetic, yearly review list (content doc). Prefer physical constants; the drifting values are listed. |
| Translation volume (≈ 420 content strings × 15 locales) and unit wording | Same per-locale pipeline as the text games; unit keys centralised and tested; native-speaker review remains a project-wide item. |
| Number entry confusion (1.000 vs 1,000; IME digits) | Interpretation line always visible; parser per UI locale; digit normalisation; tests per locale. |
| The slider gives the answer away | Seeded, offset 10-decade window (§ 5), tested. |
| "Order of magnitude" feels arbitrary for tasks with big real variation | Show the plausible range and say when the answer falls inside it; explanations name the varying factor. |
| Free-mode units frustrate | Palette instead of typing; guided is the default; the model is optional. |
| Name confusion with Fermilab | Shown title "Estimation Lab" / "Schätzlabor" (§ 2). |
| Chunk size | Content per locale (ADR 0011); `tasks.ts` numbers are small (~15 kB). |
| Feels like a test | No points, no timers, friendly wording, the first guess is explicitly "rough is fine"; explanations focus on method. |

---

## 16. Open questions for the owner (answered, see § 18)

1. **Title.** "Fermi Questions" / "Fermi-Fragen" (recommended; avoids looking like Fermilab, the US laboratory) — or another title such as "Estimation Lab" / "Schätzlabor"?
2. **Places in the questions.** Five tasks name a place (Berlin rain, the Rhine, two about Germany, Frankfurt–New York). Keep them (recommended: real, sourced numbers, and the place is stated in every language), or replace them with world-wide questions for a less German-centred set?

---

## 17. Work breakdown (implementer)

1. `units.ts`, `format.ts` (parser/formatter) with tests first.
2. `tasks.ts` transcribed from the content document + `content.test.ts` (arithmetic and dimension checks must pass before any view work).
3. `rules.ts`: selection, windows, scoring, comparison, sensitivity, summary, state transitions, `isValidState`, `settingsOf`; `rules.test.ts`.
4. `content/en.ts`, then the other 15 locales; `messages.ts` (16 locales) including unit keys.
5. `view.ts` + `styles.css` (§ 5–8, § 12); `index.ts` with `preload`, `settings`, `settingsOf`.
6. `contract.test.ts`, view tests, `e2e/games/fermi-lab.spec.ts`.
7. Report to the orchestrator: registry line, dependency, preview (§ 13), ROADMAP row ("Numeracy/Science — Estimation Lab", milestone M4-adjacent, systems & hypothesis), optional shared changes (§ 1.3).

---

## 18. Owner decisions and implementation notes (2026-10-17)

### 18.1 Owner decisions

1. **Title:** "Estimation Lab" (en) and "Schätzlabor" (de), with native equivalents in the other 14 locales (§ 2). The id stays `fermi-lab`.
2. **Places:** keep a place only when it is known worldwide and the question makes sense in Japan or Brazil; replace German-specific tasks with internationally relevant ones or reframe them with world or OECD data. Result (sources in the content document):

| Task | Before | After |
|---|---|---|
| `rain-roof` | Berlin (581 mm) | **London** (Kew 1991–2020: 627.5 mm; central 63,000 L, range 35,000–140,000). London is a world city and its "rainy" reputation makes a good surprise (about half of New York's rain). |
| `rhine-day` → **`amazon-day`** | the Rhine at the Dutch border | the **Amazon** into the Atlantic: about 206,000 m³/s (Callède et al. 2010) → central 1.8 × 10¹⁰ m³/day; model at the Óbidos narrows (width 2,300 m, depth 45 m, speed 2.0 m/s, illustrative). |
| `solar-panel` | 1 m² in Germany (DWD irradiation) | reframed to **the world average of new solar farms**: rated sunlight 1,000 W/m² × efficiency 0.21 × capacity factor 0.16 (IRENA 2023: 16.2 %) × 8,760 h → 290 kWh/year. |
| `city-water` → **`teachers-city`** | tap water of a German city | **teachers for a city of one million**: share of 6–17-year-olds 0.14 (OECD 0–14 share 17 %, world 25 %) ÷ 14 pupils per teacher (OECD Education at a Glance 2024) → 10,000. |
| `airliner-fuel` | Frankfurt–New York | **London–New York** (great circle LHR–JFK ≈ 5,540 km, computed from the airport coordinates) → 50,000 L. |
| `piano-tuners` | household size from Germany (2.0) | household size 2.5 with a world range of 2–5 (UN DESA household size data), 800 tunings per tuner a year → 25 tuners. |

All other tasks were already place-neutral or worldwide. § 11.2 is superseded by this table.

### 18.2 Implementation decisions and deviations

- **Parsed values in the state.** `FactorState` also stores `value` (the number as parsed in the UI locale), so the rules stay locale-free and a save opened in another UI language computes the same product. The estimate keeps only `draft`/`draftExp` as designed (it is parsed again on render).
- **No hand-edited final answer.** The model step ends with "Use my model’s result" (only when complete and the units match) or "Keep my first guess"; a different answer is reached by editing the model. One honest number per path, fewer controls on a phone.
- **Factor names are shared across tasks** (`content/<locale>.ts` has one `factors` dictionary keyed by factor id plus `tasks[id] = { title, question, explain }`). Ids such as `lifetime`, `worldPopulation`, `secondsPerDay` mean the same everywhere, which cut the translation volume by about a third.
- **Citations are not translated.** A source line is "factor name: source type — citation (link)". The factor name and the source type (`cited`, `standard`, `assumption`, `approximate`, `derived`) are translated; the citation itself is bibliographic data (author, title, publisher, figure) and stays in its original language (`lang="en"`), like a reference list.
- **Units:** count words have a per-unit form (`u.grain`, "g/grain") and a count form (`n.grain`, "40,000 grains"); `day` and `year` also have a count form ("160 days"). SI symbols are never translated. Free rows start with the dimensionless unit.
- **Scale bar zoomed to the values.** The review's axis spans the values shown (answer, first guess, reference, range) with at least four decades, not the slider's ten-decade window, so markers stay readable at 360 px; marker names are an HTML legend below the SVG instead of SVG labels. The tornado chart uses its own relative axis (at least half a decade) so bar widths compare well.
- **Comparison cards:** given factors show only their value; unfilled guided rows count as "no model" (the reference model is shown instead). Ranges with `low = high` are not printed.
- **Selection fill-up** goes through all levels in order of distance (easy 1→2→3, medium 2→1→3, hard 3→2→1), because *space* has only two level-1 and two level-2 tasks.
- **Tips** in the summary: `cube` (a task with a squared or cubed factor answered more than ×10 off), else `low`/`high` (bias beyond ×1.25), else `model` (fewer than two models), else `general`.
- Not built from § 14: none; the view tests cover en, de, ar and ja as planned. The optional shared changes of § 1.3 were not needed.

## 19. Change 2026-10-25: two paths chosen on the start screen

Owner feedback: the second step (the optional model after a first guess) was superfluous and annoying; at the start one should choose either free estimating or a guided path with help.

- **Setting `model`** (start screen, still `guided` | `free`, relabelled "How to estimate": "Guided, with help" / "Free estimate"; de "Geführt mit Hilfen" / "Frei schätzen"). Default `guided`: the guided factor model is the game's learning value (§ 3) and works at every difficulty; one default keeps the start screen simple.
- **Free estimate:** estimate → review. No model step. The estimate is the answer (`firstGuess = answer`, `modelUsed = false`).
- **Guided:** each question opens directly in the guided model (rows = the reference factors, given values pre-filled, hints as before); "Use my model’s result" (complete, units match) commits it and opens the review. No first-guess step, no "keep my first guess".
- **The free model builder is removed** (empty model, unit palette, add/remove rows, constants) with its texts. `compare` still matches free rows by unit and power, only so that questions reviewed in old saves render.
- **Review:** the scale shows the answer, the reference and the range (no first-guess marker). Guided: "Your model and the reference" with your value and effect per factor. Free: the reference model ("This is how the reference answer is put together from factors"). Sensitivity, explanation and sources as before for both paths.
- **Summary:** no "with a model vs. first guess" comparison and no model count. Tips: `cube`, `low`, `high`, then `guided` (free path: "Try the guided path next time …") or `general`.
- **State v2** (`stateVersion` 2, `v: 2`). Untouched guided questions are in phase `model` with empty rows; free ones in `estimate`. `migrateState` from v1: guided question in `estimate` → guided `model` (the unsent draft is dropped); guided `model` → stays, typed values kept, the first guess is dropped; free `model` (old builder) → finished with its first guess (`review`, rows dropped); `review` and the summary unchanged (old reviewed questions keep their first guess and rows). Remembered choices keep their ids: old `free` (builder) becomes the free estimate. Fixtures written by the v1 code are in `test/fixtures/`.

## 20. Change 2026-10-25b: number input

Owner feedback: using the slider, the number field and the multipliers (÷2/×2, × 10ⁿ) together could produce inconsistencies; look into it and optimise the input methods.

**Design: one value per input.** The value is `field × 10^stepper` (unchanged save format: `draft`/`draftExp`, rows `text`/`exp`/`value`, so no state version bump). Every control writes through one function (`write` in `view.ts`), and every view (field, stepper, "Understood as", slider position and `aria-valuetext`, disabled states) is derived from that value alone (`show`). Generated values (slider, ÷2/×2) use one canonical form: plain from 0.01 to below 10⁶, otherwise mantissa and stepper. A reload therefore restores exactly the same display.

Inconsistencies found (each has a test in `test/input.test.ts`, written failing first):

1. ÷2/×2 rounded to 3 significant digits and drifted (999 → ÷2 → ×2 gave 1000). Now exact (12 significant digits): any typed value comes back unchanged.
2. Clearing the field left the slider at the old position. Now an empty or unreadable value puts the thumb in the middle, dimmed (`data-empty`).
3. Moving the slider while the game was paused moved the thumb but not the value. Now it springs back.
4. A readable field whose product with the stepper overflows (`1e300` × 10¹⁰) left the interpretation blank; it now shows the "cannot read" message.
5. Values outside the 10-decade window (the field and stepper allow 10⁻⁶…10³⁰) pinned the thumb silently. The thumb is still pinned to the end, but dimmed and marked (`data-out`), and the window's ends are labelled (10ⁿ, numbers only, `aria-hidden`; the interpretation line remains the value label).
6. A guided row typed in one language ("1,500" in English) was re-read differently after switching to another ("1,5" in German): the row showed 1.5 while the model multiplied 1500. The saved value now wins: the field is rewritten to the saved value in the current language's form.
7. The slider position after a drag was the raw position while a reload put it at `log10` of the rounded value; the position is now always derived (`log10(value)` snapped to 0.05 decades, clamped to the window).

A fast-check property drives random sequences of typing, stepper, ÷10/÷2/×2/×10 and slider moves in en/de/ar and checks after every action that field = saved draft, stepper = `draftExp`, interpretation = parsed draft × 10ⁿ, slider = its derived position, and that a restore shows the same field, stepper, slider and interpretation. The e2e test drives the slider with arrow keys and reloads.

**Input-method decisions.**
- The parser already accepts `3e9`, `3×10^9`, `3·10⁹`, `10^9` in the field; the stepper stays as the visible place for the power of ten (it is the only "large number" aid in guided rows). Words such as "3 Mrd" are not parsed: 16 locales' abbreviations would make the field ambiguous; the interpretation line shows the words instead.
- ÷10/×10 stay (shortcuts for the stepper, next to the halving and doubling nudges); all four are disabled only when the step is impossible (stepper limits), never because the field is empty — then they say what is missing.
- Field: `inputmode="decimal"`, `enterkeyhint` (done in the estimate), `dir="ltr"` for the number (RTL layouts keep their order; numbers read left to right like the slider axis). Enter commits the estimate; arrow keys on the slider move by × 1.12 (0.05 decades).
- No new texts: the end labels are numbers.
