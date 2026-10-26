# Timeline (`timeline`) — design

Status: **Plan (2026-10-26)**, written by the planner of the new-games pipeline (game 5 of the owner's list; done before it: Best Plan, Estimation Lab, Probability Detective, Atlas Explorer). The implementer follows it, and the reviewer checks the work against it. Numbers marked *(calibrate)* are first estimates; the implementer may tune them within the stated bounds. Content: [timeline-content.md](timeline-content.md) (170 sourced events, 12 curated pairs). The generator thresholds in § 11 were simulated on that content (Appendix B).

Scope for the implementer (feature agent, ADR 0006): `packages/games/timeline/` and `e2e/games/timeline.spec.ts`. The orchestrator creates `package.json` (dependencies `@wp/game-core`, `@wp/ui`), the registry line (appended after the existing games), the dependency in `apps/web/package.json` and the preview in `apps/web/src/previews.ts` (§ 19), and pastes Appendix A into `docs/third-party.md`. **No new npm dependency, no shared change needed for the MVP** (§ 1.3 lists optional ones).

Binding inputs: `CLAUDE.md`, the implementation brief ("Core product principles", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"), ADR 0002 (contract), 0003 incl. the 2026-10-24 amendment, 0006 (roles), 0011 (per-locale content, `preload`), 0017 (start screen, `settings`, `settingsOf`, `begin`), 0021 (mutation budget, `*.slow.test.ts`), `docs/third-party.md`, and the owner's content rules for this game (sourced facts, approximate dates marked with a range, consistent BCE/CE and "years ago", calendar nuances explained, international and balanced, no war/politics or religious claims as content, own wording, 16 locales).

---

## 1. Survey: overlap and reuse

### 1.1 Overlap with the catalogue

| Game | Relation | Consequence |
|---|---|---|
| Estimation Lab (`fermi-lab`) | Numbers across many powers of ten, scored by the distance in decades; locale number parser; log slider with `direction: ltr`. | The same idea for **time**: deep time is scored on a logarithmic scale of age (§ 7.3). Copy the patterns (games never import each other): one-value input (fermi-lab § 20), `parseLocaleNumber` with digit normalisation, numeric axes LTR. |
| Atlas Explorer (`atlas-explorer`) | Round of fixed items, marks ●●○ plus words, "Skip — just show me", review that explains, `reported` guard, stored verdicts, ids never removed, sub-seeds per item, per-locale names. | Same round shape and review style; the **time axis** plays the role of the map (zoomable, keyboard cursor, explore after answering). |
| Probability Detective | Calm summary with a bias insight, no grades. | Same summary tone; the "you tend to place things too far back / too recent" insight (§ 13.2). |
| Memory, Review (decks) | Facts as flash cards. | Not a fact quiz: every review places the answer on the axis and explains the scale. No learning records (play stays play, as in Memory and Atlas). |
| Rule Discovery, Network Detective | Reasoning puzzles. | "Which came first?" and "Same time?" ask for reasoning from what one knows ("printing needs paper"), but the game never pretends dates can be deduced. |

No game deals with time, chronology or historical scale yet. The catalogue has no history content at all; this game adds it in the calm, international way of Atlas Explorer.

### 1.2 What is reused

- `@wp/game-core`: `defineGame`, `createRng`, `seedFromString`, `normalizeSeed`, guards (`isRecord`, `isInt`, `isArrayOf`, `isOneOf`), `createLocaleContent`, `SettingSpec`, `bcp47Tag`.
- `@wp/ui`: `h`, `clear`, `announce`.
- `@wp/testing`: `runGameContract`, `startGame`, `chooseSetting`, `submitStart`, `expectResumeAfterReload`, `readSave`.
- **Patterns copied:** fermi-lab's `content/index.ts` loader table, `format.ts` (number parsing, digit normalisation) and the one-value input rule; atlas-explorer's review layout, marks, skip semantics, `reported` guard, retired-id policy, sticky action bar below 48 rem, keyboard cursor with a polite live region.

### 1.3 Optional shared changes (report to the orchestrator; not needed for the MVP)

1. **Mutation targets.** `stryker.config.json` mutates `games/*/src/rules.ts` and `ai.ts` only. The important logic lives in `src/time.ts`, `src/score.ts`, `src/generate.ts`, `src/axis.ts` (pure mapping and ticks) and `src/rules.ts`; four `mutate` lines (orchestrator-owned). Never `src/events.ts` (data).
2. **Skills.** `learning` (history and science facts) and `deduction` (ordering from known anchors and reasoning about before/after). No new skill.

---

## 2. Identity

| | |
|---|---|
| Package id | `timeline` (`@wp/game-timeline`). Neutral, never shown except in the URL; a title change touches no saves. |
| English title | **Sense of Time** (recommended, owner question 1) |
| German title | **Zeitgefühl** |
| Other locales (draft; translators may adjust) | nl Tijdsbesef · es Sentido del tiempo · fr Le sens du temps · ru Чувство времени · zh-Hans 时间感 · ko 시간 감각 · ja 時間の感覚 · ar حسّ الزمن · pt Noção do tempo · it Senso del tempo · pl Wyczucie czasu · tr Zaman Algısı · uk Відчуття часу · hi समय की समझ |
| Why not "Timeline" as the shown title | "Timeline" is the name of a well-known commercial card game series (designer Frédéric Henry; Asmodee/Zygomatic, since about 2010) whose core is placing events in chronological order. Our game shares the topic, not its rules, but a shared title would look like a copy or an official version. Like Estimation Lab (not "Fermi Lab"), the shown title stays distinct. German "Zeitstrahl" would not have this problem (alternative in question 1). |
| Skills | `learning`, `deduction` |
| `typicalMinutes` | `[6, 14]` (one round) |
| `difficulties` | `['easy', 'medium', 'hard']` |
| Input | pointer, touch, keyboard |
| Capabilities | offline, no audio, no AI, no network, no WebGPU, pauseable |
| `stateVersion` | 1 |

---

## 3. Pitch and honest value

**Pitch.** Which is older, the pyramids at Giza or the last woolly mammoths? How long ago did the dinosaurs die out — and how long did they live before that? Was anyone printing books in China when the Vikings reached America? Sense of Time puts events from the formation of the Earth to the first image of a black hole on one zoomable timeline. You estimate when something happened, put a few events in order, decide which came first, or find what else was happening at the same time. After each answer the timeline opens up: where the event really sits, how far you were — measured fairly for the deep past and for last century — and a sentence about why it matters.

**Claims we may make** (tagline, rules, catalogue):

- "Practice ordering events and estimating when they happened, from the formation of the Earth to today."
- "Practice a sense of scale for time: centuries, millennia and the millions of years of the deep past."
- "Explore discoveries, inventions, art and journeys from every continent."

**Claims we never make:** "improves your memory/brain/IQ", "learn history", any transfer claim, "the most important events". The game says "practice" and "explore", and the event list is "a selection".

**Honesty inside the game:**

- Every date is shown with its uncertainty: "about 2560 BCE (2600–2500 BCE)", "at least 50,000 years ago (perhaps 65,000)". A guess inside the accepted range counts as exact.
- Every event shows its source after answering (bibliographic reference, as in Estimation Lab).
- The rules state how the scale works ("the further back, the more room") and the calendar conventions (§ 5.2).

---

## 4. Content principles (binding)

1. **Sourced and hedged** (content § 1, § 5): every date has a source; approximate dates have a range; records say "oldest known"; debated dates carry a deliberately wide range.
2. **International and balanced**: events from every continent and six fields (Earth and life, science and medicine, technology, culture, journeys, everyday life). Of the 142 human-history events, Europe has 23 %, Asia 34 %, the Americas 18 %, Africa 13 %, Oceania 5 %, global 8 % (content § 2).
3. **Neutral**: no wars, conquests, political or religious claims as subjects; rulers only where a monument or a famous comparison needs them; no living person's controversies (owner question 3 covers named people).
4. **Fair questions**: two events are compared only when their ranges do not overlap and the gap is clear for the difficulty (§ 11). A date inside the event's range is never "wrong".
5. **No time pressure, no lives, no streaks**: "Skip — just show me" everywhere; nothing is counted against the player.
6. **Own wording** in all 16 languages; titles never give away their date (test).

---

## 5. The time model (pure, `src/time.ts`)

### 5.1 Canonical values

- **Astronomical year** `y` (integer): 1 CE = 1, 1 BCE = 0, 2 BCE = −1, so *n* BCE = 1 − *n*. Arithmetic across the era boundary is then plain subtraction (from 44 BCE to 14 CE is 14 − (−43) = 57 years).
- **"Years ago"** values from the sources (geology, radiocarbon, luminescence) count from **1950** ("before present", BP — the scientific convention). `y = 1950 − ago`. They are used only for dates older than 10,000 BCE, where 1950 versus today is far below every uncertainty and the display rounds to at most four significant digits.
- `events.ts` stores each date **as the source states it** (`unit: 'year' | 'ago'`, `at`, `lo`, `hi`); `normalise()` converts to `{ y, lo, hi }` astronomical years once at module load (`lo ≤ y ≤ hi`, `lo` older). For a span (`kind: 'span'`) `lo`/`hi` are its start and end and its position is the midpoint.
- Numbers up to 4.6 × 10⁹ are exact integers in a double; no big-number code is needed.

### 5.2 Calendar conventions (stated in the rules)

- Years only — never days or months — so the Julian/Gregorian difference (at most 13 days) never changes an answer. Years before 1582 are given as the sources give them (Julian years). One note says so explicitly: Isaac Newton was born on 25 December 1642 in the Julian calendar then used in England, 4 January 1643 in today's calendar (content: `newton`).
- **There is no year 0**: 1 BCE is followed by 1 CE. The rules say so, and gaps are computed correctly (tests).
- Dates from other calendars (Chinese reign years, the Hijri calendar, the Maya Long Count) are converted to Common Era years by the cited sources; the game names the calendar only where the event is about it (`long-count`).
- Era labels: English **BCE / CE** (recommended, owner question 2); every locale has its own template (§ 17.3).

### 5.3 Display regimes (`formatDate`, § 17.3)

| Range | Shown as | Examples (en) |
|---|---|---|
| `y < −9999` (older than 10,000 BCE) | years ago, ≤ 4 significant digits; ≥ 1 million in words (`Intl` compact long) | "about 14,400 years ago", "66 million years ago", "4.54 billion years ago" |
| `−9999 ≤ y ≤ 0` | year BCE | "2560 BCE" |
| `1 ≤ y ≤ 999` | year CE (with the marker) | "105 CE" |
| `y ≥ 1000` | the year alone | "1969" |

Approximate points: "about {date}" plus the range "(2600–2500 BCE)" in reviews. Spans: "1405–1433", "246–208 BCE", "500 BCE–500 CE". Ranges and spans that share an era marker show it once.

### 5.4 Scale: age and the anchor year

The axis, the scoring and the fairness rules all use the **age** of a year, `age(y) = 2030 − y`, and mostly its logarithm `u(y) = log10(age(y))`.

- **Why an anchor instead of "today"?** Saves must score the same tomorrow and in ten years, and rules may not read the clock (determinism). 2030 is a fixed point a decade after the newest event (2019), so the most recent events still have a scale of about ten years instead of a vanishing one. The rules call it "measured from about now".
- Guesses are limited to `y ≤ 2020` and `age ≤ 5 × 10⁹` (the axis range: `u ∈ [1, 9.7]`).
- Constants: `AXIS_YEAR = 2030`, `BP_YEAR = 1950`, `EARTH_AGE = 4.54e9`, `Y_MIN = 1950 − 5e9`, `Y_MAX = 2020`; exported and tested.

### 5.5 Eras and the `span` setting

Derived from the event's position `y`: `deep` (1,000,000 years ago or older), `early` (to 499 CE), `middle` (500–1799), `modern` (1800 and later). Content: deep 28, early 44, middle 44, modern 54 events.

---

## 6. Round structure and modes

A round is a **fixed list of items** created at `newGame`, played one at a time. After each item comes its review; the next item starts only on "Next". After the last review, "See summary" shows the summary and the game calls `finished()` once. No timers, no feed; "Another round" only on a deliberate press (ADR 0017).

| Mode (`mode` setting) | Shown name (en) | Items | One item |
|---|---|---|---|
| `when` | **When was it?** | 8 | Place one event on the timeline or type its year; see how far you were. |
| `order` | **Put in order** | 4 | Arrange 4 / 5 / 6 events from oldest to most recent. |
| `first` | **Which came first?** | 8 | Two events: which is older, and (medium/hard) about how much time lies between them. |
| `together` | **Same time?** | 6 | One event with its date; which of three others happened at about the same time? |
| `mixed` (default) | **A bit of everything** | 6 | In this order: when, first, order, together, when, first. |

About 1 minute per item (order items 2), so a round fits 6–14 minutes.

**Choosing items (pure, seeded):** each item gets its own sub-seed `seedFromString(`${seed}:${index}`)`, so retries inside one item never shift another. Within a round no event is the subject of two items (`when` event, `order` members, `first` pair members, `together` focus); `together` options and `when` anchors may repeat. Across rounds there is no memory.

### 6.1 Avoiding the "school test" feeling

- The timeline is always the centre; feedback is **distance and direction** ("about 120 years too recent ●●○"), never red crosses.
- "**Skip — just show me**" on every item; a skipped item is not scored and not counted in the summary.
- Every review explains with the axis and one sentence; the axis can be explored (zoom, tap any marked event).
- **No grades, totals, streaks or medals.** The summary describes the round (§ 13).

---

## 7. Mode "When was it?"

### 7.1 Flow

```
event card (title only) ─▶ place the marker on the axis ◆ and/or type the year ─Check─▶ review ─Next─▶
                           └── Skip — just show me ─────────────────────────────┘
```

The marker and the field are two views of **one value** (fermi-lab § 20 lesson): every input writes `draft.y`; the field text, the marker and the slider's `aria-valuetext` are derived from it. Nothing is revealed before "Check". For a span the prompt says "When did this happen? Any year within it counts."

### 7.2 Input

- **Axis** (§ 12): tap or drag sets the marker; arrow keys move it; values snap to 3 significant digits of age (`res = max(1, 10^(floor(log10 age) − 2))` years; `y = 2030 − round(age / res) · res`), so a drag in the deep past moves by 100,000 years and near today by 1 year.
- **Typed**: a number field (`inputmode="decimal"`, locale parser with digit normalisation as in fermi-lab) and a **unit select**: "CE", "BCE", "years ago", "thousand years ago", "million years ago", "billion years ago". The select starts on "CE"; switching the unit re-reads the typed number (it does not convert it), so "66" + "million years ago" is 66 Ma. The interpretation line below ("= 66 million years ago") shows what the game understood; invalid input ("CE year after 2020", "0", empty) shows a calm message and keeps the last valid marker.
- Typed values are kept unsnapped (to the year), so an exact "1969" stays exact.

### 7.3 Scoring (pure, `src/score.ts`)

Let `[lo, hi]` be the event's range (or span) and `g` the guess. The nearest accepted year is `y* = clamp(g, lo, hi)`.

```
d = | log10( age(g) / age(y*) ) |        age(y) = 2030 − y        (d = 0 inside the range)
```

| Band | Condition | Words (en) | Mark |
|---|---|---|---|
| 0 `range` | g ∈ [lo, hi] | "Within the accepted range" | ●●● |
| 1 `spot` | 0 < d ≤ 0.02 | "Spot on" | ●●● |
| 2 `close` | d ≤ 0.06 | "Close" | ●●○ |
| 3 `track` | d ≤ 0.15 | "On the right track" | ●○○ |
| 4 `far` | d > 0.15 | "Further away — see where it fits" | ○○○ |

Plus the direction and the distance in years: "about 120 years too recent" / "about 9 million years too long ago" (duration with 2 significant digits, § 17.3). *(calibrate)*: the three limits within ±30 %.

What the bands mean in years (older side / newer side of the true date):

| True date | ●●● spot | ●●○ close | ●○○ on the right track |
|---|---|---|---|
| 2007 | ±1 year | +3 / −3 years | +9 / −7 years |
| 1969 | ±3 years | +9 / −8 years | +25 / −18 years |
| 1455 | ±26 years | +85 / −74 years | +240 / −170 years |
| 2560 BCE | ±210 years | +680 / −590 years | +1,900 / −1,300 years |
| 12,000 years ago | ±560 years | +1,800 / −1,600 years | +5,000 / −3,500 years |
| 66 million years ago | ±3 million | +10 / −9 million | +27 / −19 million |
| 4.54 billion years ago | ±0.2 billion | +0.67 / −0.59 billion | +1.9 / −1.3 billion |

This is the "scale-aware" fairness the owner asked for: the further back, the more room, in the same proportion everywhere. The rules say: "The further back an event lies, the more room you get: being 10 years off for the Moon landing counts like being 1,000 years off for the first cities." `d` is stored as integer milli-decades (`milli = round(1000 d)`) with the band at "Check" (§ 14), so a later content correction never changes an old review.

### 7.4 Aids by difficulty

| | easy | medium | hard |
|---|---|---|---|
| Events | tier 1 (fill tier 2, § 11.1) | tiers 1–2 (fill tier 3) | all tiers |
| Anchors on the axis | 3 labelled anchor events (tier 1, not the target): the nearest older and newer one in `u`, plus one far one | 1 anchor (the nearest in `u`) | none |
| Axis start view | the whole axis, log scale | the whole axis | the whole axis |

Anchors show title and date ("▲ Great Pyramid, about 2560 BCE"); they are reference points, not hints about the answer (they are chosen around the true date but their selection is symmetric in `u`, and on easy the third is random, so their positions do not pin the answer).

### 7.5 Review

1. Verdict: mark + words + direction and distance; "The accepted range is 2600–2500 BCE."
2. The axis zooms to fit guess and range; the true range is a hatched band with a bold outline and its date label; the guess is ◆ with "Your answer"; anchors stay.
3. The note (one sentence) and the source(s) (`lang="en"` citations, links only where the content has one).
4. **Earth-day clock** (one line): "If the Earth's 4.54 billion years were one day, this happened at 23:39" (66 million years ago) / "… 0.087 seconds before midnight" (the Great Pyramid). `s = 86,400 × age(y) / 4.54e9`; `s ≥ 60` → clock time of `86,400 − s` (`Intl.DateTimeFormat` with `timeZone: 'UTC'`, hour and minute); `0.001 ≤ s < 60` → seconds with 2 significant digits (`Intl` unit `second`); smaller → "less than a thousandth of a second before midnight". Honest and the strongest picture of deep time.
5. "See it to scale" toggle (§ 12.2) switches the axis between the squeezed (log) and the even (linear) view.

---

## 8. Mode "Put in order"

### 8.1 Flow

A list of 4 / 5 / 6 cards (easy / medium / hard) in a seeded order that is never already sorted. The list is **vertical**: the label "Oldest" above it, "Most recent" below (text, not colour). Each card shows the title, a position number and controls:

- "Move up" / "Move down" buttons (44 px, ▲▼ with accessible names "Move ‘…’ up");
- pointer and touch: drag by the handle (pointer capture, an insertion line, auto-scroll near the edges); a tap without movement does nothing;
- keyboard: the handle is a button — Space picks the card up ("Picked up ‘…’, position 3 of 5"), arrows move it, Space drops, Escape returns it; every move is announced politely.

The arrangement is the draft (saved after each move). "Check" commits.

### 8.2 Scoring

`pairs` = the number of the `n(n−1)/2` pairs in the right relative order (Kendall agreement; unambiguous because the generator only picks events whose ranges do not overlap, § 11). Marks: all pairs ●●● "All in the right order"; ≥ 80 % ●●○; ≥ 50 % ●○○; else ○○○. Stored at commit.

### 8.3 Review

- The correct order with each event's date; each card says "✓ in the right place" or "belongs at position 2" (text).
- A strip of the axis covering the set (padded by 10 % of its `u` range) with numbered markers; the log/linear toggle shows how uneven the gaps are.
- Two gap sentences: the largest and the smallest gap ("Between the Great Pyramid and the Terracotta Army: about 2,300 years. Between the telegraph and the telephone: about 30 years.").
- The notes and sources in a collapsible list ("About these events").

---

## 9. Mode "Which came first?"

### 9.1 Flow

Two cards A and B (seeded sides). **Question 1** (radio): "Which happened first?" **Question 2** (medium and hard, only when fair, § 9.2): "About how much time lies between them?" with four options. One "Check" for both.

### 9.2 The gap question (pure)

- Gap range: `Gmin = max(1, later.lo − earlier.hi)`, `Gmax = later.hi − earlier.lo`; the shown gap `G` = difference of the positions.
- **Buckets** on a log scale: medium `10^k` years (`k = 1…9`; labels "about 10 years", "about 100 years", …, "about 1 billion years"), boundaries at `10^(k ± 0.5)`; hard `10^(k/2)` (`k = 2…19`; labels rounded to one significant digit: 10, 30, 100, 300, …), boundaries at `10^(k/2 ± 0.25)`.
- **Fair** only if `Gmin` and `Gmax` fall in the same bucket; otherwise the item has no question 2 (`gaps: []`). Simulated: 82–99 % of pairs get the question (Appendix B).
- Options: four consecutive buckets containing the right one at a seeded position (clamped at the ends of the ladder).
- Marks: right bucket ●●● "Right"; neighbouring bucket ●○○ "One step off"; else ○○○.

### 9.3 Curated surprising pairs

Twelve pairs in the content (content § 4: Cleopatra and the Moon landing, the Great Pyramid and the last mammoths, Stegosaurus and T. rex, sharks and trees, bread and farming, …). Per round, at most two items use a curated pair, when both events are in the pool (span, tier with fill-up) and the pair passes the difficulty's separation; the choice is seeded. Their review adds the insight sentence. Each insight is re-computed from the data by a test (content § 4, last column).

### 9.4 Review

"The Great Pyramid came first: about 2560 BCE. The last mammoths: about 2050 BCE. About 500 years lie between them." Both on an axis strip; the curated insight if any; notes and sources.

---

## 10. Mode "Same time?"

### 10.1 Flow

A focus card **with its date** ("About 1450: the first reliable records of coffee drinking come from Yemen" — for a focus the date is given, it is the reference) and the question "Which of these happened within about {τ} years of it?" with three option cards (radio). "Check" commits.

### 10.2 Window and options (pure)

- `τ = nice(max(10, 0.1 · age(F)))`, where `nice` rounds to the nearest of 1, 2, 5 × 10ᵏ in `log10` (1450: age 580 → 50 years; 2560 BCE → 500 years; 66 Ma → 5 million years). τ is shown, so the question is exact.
- Window `W = [F.lo − τ, F.hi + τ]`. The **right option** overlaps `W`; each of the two **other options** lies at least `δ` away from `W` on the log scale (`δ = width(span) / k`, `k` = 8 / 16 / 32 for easy / medium / hard, § 11.2) and on either side as the seed decides.
- Options from the span's pool at the difficulty's tiers (plus the first fill tier); no option equals the focus.

### 10.3 Review

The axis with the focus, the window as a bracket labelled "±τ" (here ±50 years), and the three options marked ● ■ ▲ with dates; a sentence per option ("The Gutenberg Bible: about 5 years later — inside the window"; "Al-Khwarizmi's algebra: about 630 years earlier — outside"; "The Taj Mahal: about 180 years later — outside"). Notes and sources.

---

## 11. Fairness and the generator (`src/generate.ts`, pure)

### 11.1 Pools

- Pool = events of the `span` (all for `all`), not retired. **Tier** pool by difficulty: easy {1}, medium {1, 2}, hard {1, 2, 3}. **Fill-up**: when the unused tier pool is too small, or after 100 failed attempts, the next tiers (easy: 2, then 3; medium: 3) join (as in Estimation Lab).
- Content per span and tier (content § 2.3): deep has only 5 tier-1 events, so easy deep-time rounds fill from tier 2 by design.

### 11.2 Separation (the core fairness rule)

For two events E, F with non-overlapping ranges, `sep(E, F) = u(older.hi) − u(newer.lo)` (in decades of age); overlapping ranges have `sep = 0` and are never compared. The required separation is **relative to the span's width** on the log axis, `width(span) = u(oldest lo) − u(newest hi)` (all 8.6, deep 3.7, early 2.4, middle 0.80, modern 1.32 decades):

| | easy | medium | hard |
|---|---|---|---|
| `order` and `first`: every compared pair `sep ≥` | width / 8 | width / 16 | width / 48 |
| `together`: distractors `sep(option, W) ≥` | width / 8 | width / 16 | width / 32 |

Examples: with all of time on easy, every pair is at least a factor 12 apart in age (dinosaurs, first farmers, printing, Moon landing); in 1800-to-today on hard, 1969 and 1961 can be paired (`sep` ≈ 0.05 ≥ 0.0275). A fixed threshold for all spans failed in simulation (easy order sets in 500–1799 are impossible with a fixed 0.25 decades; Appendix B).

### 11.3 Procedure and fallbacks

Per item, up to 300 seeded attempts: draw from the unused pool; test the rule; on success stop. Fallbacks, in this order, each only after 300 failed attempts: (1) allow events already used in this round; (2) `order` only: one card fewer (minimum 3); (3) a `when` item instead (always possible). Simulation over 300 seeds × 5 spans × 3 difficulties (Appendix B): order sets need fallback (1) in ≤ 3 % of rounds, `first` and `together` never; fallback (2) and (3) never occurred. The slow test pins these rates (§ 20.3).

### 11.4 Independent oracle (tests)

The generator's results are checked by code that does not share its implementation: `test/oracle.ts` re-implements `u`, `sep`, the window, the gap buckets and the order of a set directly from the raw `events.ts` literals (`year`/`ago` without `normalise`), and the tests compare for every generated item: the correct order, the earlier event, the bucket, the right option and that the two others are outside `W + δ`.

---

## 12. The time axis (`src/axis.ts` pure mapping and ticks; `src/axis-view.ts` DOM)

### 12.1 Mapping

- A horizontal axis, **past on the left, present on the right, always LTR** (`dir="ltr"`, also in Arabic — like the numeric axes of Estimation Lab and the map of Atlas Explorer; the text around it stays RTL).
- **Squeezed view (log, default):** `x = (u_max − u(y)) / (u_max − u_min)` over the visible window `[u_min, u_max] ⊆ [1, 9.7]`. Each step to the left is "ten times further back". Whole axis at 360 px: about 38 px per decade; 1900–2020 takes about 45 px — zooming is part of the game.
- **Even view (linear):** `x` proportional to `y` within the same window (window ends converted to years). At full zoom-out all of human history is one pixel at the right edge — the lesson of the "See it to scale" toggle (review and toolbar; a display preference, not saved in the state).
- **Zoom** changes only the window (`u` width from 8.7 down to 0.01 decades, i.e. about 25 years across the axis around 1500): buttons +/− (44 px) around the marker or the centre, "Fit" (whole axis), pinch, wheel when focused or hovered; drag on the empty axis pans. Each zoom keeps the point under the pointer fixed (pure function, tested).

### 12.2 Ticks (pure)

A fixed catalogue with importance levels, drawn greedily from level 0 down while ticks stay ≥ 56 px apart:

- calendar years: 2000 (0), 1900 (1), 1800 (1), 1500 (1), 1000 (0), 500 (1), 1 CE (0), 500 BCE (2), 1000 BCE (1), 2000 BCE (1), 3000 BCE (0), 5000 BCE (1), 10,000 BCE (1);
- years ago: 20,000 (2), 50,000 (2), 100,000 (0), 300,000 (2), 1 million (0), 3 million (2), 10 million (1), 30 million (2), 100 million (0), 300 million (1), 1 billion (0), 2 billion (2), 3 billion (2), 4 billion (1).

When fewer than three catalogue ticks are visible (zoomed in), generated ticks at multiples of 1, 2, 5 × 10ᵏ years are added (calendar years where `y ≥ −9999`, else years ago). Labels use § 17.3 formatting in `<bdi>`.

### 12.3 Layers

Axis line and ticks; era bands as thin labelled strips under the axis in the squeezed view ("Earth and life", "Early humans", "Writing", …) with a pattern per band (not colour only) *(calibrate: may be dropped if cluttered at 360 px)*; anchors ▲ with labels; the guess ◆ with "Your answer"; in reviews the true range (hatched band, bold outline, label); window brackets (together); numbered markers (order). Labels never overlap: collisions are resolved by stacking labels in up to three rows and abbreviating to the marker symbol plus a legend list below the axis at 360 px.

### 12.4 Keyboard and screen readers

- The marker is a focusable **slider** (`role="slider"`, `aria-valuemin/max` as the window's `u` range, `aria-valuenow` = `u`, `aria-valuetext` = the formatted date: "about 1450", "66 million years ago"). Arrows move by 1 % of the window (snapped), Page Up/Down by 10 %, Home/End to the window ends, `+`/`-` zoom around the marker, `0` fits. A polite live region repeats the value after the key is released (not on every repeat).
- The typed field is the primary non-visual input; the rules say: "The timeline is a picture of time; everything can also be done with the year field and the lists."
- Reviews describe the axis in text (dates, gaps, the window), so nothing is visual-only.

---

## 13. Settings, summary and finish

### 13.1 Settings (start screen) and `settingsOf`

```ts
settings: [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode',
    values: ['when', 'order', 'first', 'together', 'mixed'], default: 'mixed', display: 'radio', hintKey: 'mode.hint' },
  { kind: 'choice', id: 'span', labelKey: 'span.label', valueKey: 'span',
    values: ['all', 'deep', 'early', 'middle', 'modern'], default: 'all' },
  { kind: 'difficulty' }
]
settingsOf: (state) => ({ mode: state.mode, span: state.span, difficulty: state.difficulty })
```

- Labels (en): mode as § 6; span "All of time" / "Earth and life (before 1 million years ago)" / "Early humans and the ancient world (to 500 CE)" / "500 to 1800" / "1800 to today"; difficulty "Easy (well-known events, more help)" / "Medium" / "Hard (all events, closer calls)".
- `newGame` treats `options.settings` as untrusted (unknown → `mixed`, `all`, `easy`). `begin` has no effect (no intro screen). No `setupInGame`.
- **Display preferences inside the game** (`preferences`): axis view (squeezed / even) only.

### 13.2 Summary (after "See summary")

Calm and descriptive:

- Per item: mark, title(s) and the short result ("about 40 years too recent", "4 of 6 pairs").
- "When was it?" items (≥ 3 answered, not skipped): **tendency** = mean of `log10(age(g) / age(y*))` over items outside the range: `> +0.03` → "You tended to place events further back than they were."; `< −0.03` → "… more recent than they were."; else "No clear tendency in your estimates."
- Order: "x of y pairs in the right order". First/together: "x of y".
- One tip by pattern: deep-time items off by more than band 3 → "The deep past is vast: the dinosaurs died out 66 million years ago, but lived for about 165 million years before that."; recent items off → "For the last few centuries, a known anchor helps: …"; else a general tip.

`finished({ outcome: 'completed', stats: { items, answered, closeOrBetter, pairsRight, pairsTotal } })` once, guarded by `reported`.

---

## 14. State (plain JSON, `stateVersion: 1`) and migration

```ts
type Mode = 'when' | 'order' | 'first' | 'together';
type EntryUnit = 'ce' | 'bce' | 'ago' | 'ka' | 'ma' | 'ga';

interface TimelineState {
  v: 1;
  content: string;                       // CONTENT_ID at creation, 'events-1'
  seed: number;                          // uint32
  difficulty: 'easy' | 'medium' | 'hard';
  mode: Mode | 'mixed';
  span: 'all' | 'deep' | 'early' | 'middle' | 'modern';
  items: Item[];                         // 8 / 4 / 8 / 6 / 6 by mode (§ 6)
  index: number;                         // current item 0..len−1; len = summary
  reported: boolean;                     // finished() called (never twice, also after restore)
}

type Item = WhenItem | OrderItem | FirstItem | TogetherItem;

interface WhenItem { kind: 'when'; event: string; anchors: string[];         // 0..3 event ids
  draft: { y: number | null; unit: EntryUnit; text: string };                  // text ≤ 24 chars (unparsed typing)
  answer: number | 'skip' | null;                                              // astronomical year, Y_MIN..Y_MAX
  milli: number | null; band: 0 | 1 | 2 | 3 | 4 | null; }                      // stored at Check

interface OrderItem { kind: 'order'; events: string[];                       // 3..6, the shown starting order
  draft: string[];                                                             // a permutation of events
  answer: string[] | 'skip' | null; pairs: number | null; }

interface FirstItem { kind: 'first'; a: string; b: string; pair: string | null; // curated pair id
  gaps: number[]; gapIndex: number;                                            // 0 or 4 bucket values (years); index of the right one, −1 if none
  draft: { first: 'a' | 'b' | null; gap: number | null };
  answer: { first: 'a' | 'b'; gap: number | null } | 'skip' | null; }

interface TogetherItem { kind: 'together'; focus: string; tau: number;       // years, a 1/2/5 × 10^k value
  options: string[]; correct: number;                                          // 3 ids; index of the right one
  draft: number | null; answer: number | 'skip' | null; }
```

- **Phase is derived:** review when `answer !== null`.
- **Saves hold ids and numbers only**, never texts. Results that depend on content (order solution, earlier event, gap bucket, right option, band, pairs) are computed at creation or commit and **stored**, so a corrected date never flips an old review (the review then shows the current date and note; acceptable, as in Atlas).
- `isValidState(x)` never throws. It checks every type and bound above; `content` is a known content id; every event id exists (retired ids stay valid, they are never removed); `items.length` and kinds per mode; ids distinct within an order set and between `a`/`b`; `draft` of an order item is a permutation of `events`; `answer` years within `[Y_MIN, Y_MAX]`; `band` consistent with `milli` (`band 0 ⇔ milli 0` and the band limits of § 7.3); `pairs ≤ n(n−1)/2` and consistent with the stored arrangement; `gaps` length 0 or 4, increasing, `gapIndex` in range (or −1 with no gaps); `answer.gap` null when there are no gaps; `options.length === 3`, `correct` 0–2; `tau` in the 1/2/5 × 10ᵏ set; `index ≤ len`; `reported ⇒ index === len`.
- The PRNG state is not stored: all randomness is spent in `newGame`.
- **Pure transitions** (`rules.ts`), each returning the same object when nothing changes: `createRound(seed, difficulty, mode, span)`, `setDraftYear`, `setDraftText`, `setUnit`, `checkWhen`, `move(from, to)`, `checkOrder`, `chooseFirst`, `chooseGap`, `checkFirst`, `chooseOption`, `checkTogether`, `skip`, `next`, plus derived `phase`, `review(item)`, `summary(state)`.
- **Migration policy:** `stateVersion` stays 1 while changes are additive. Content updates add events or correct dates; ids are never removed (`retired: true` keeps them valid and out of new rounds), so `CONTENT_ID` changes only when ids would have to change meaning; then `isValidState` keeps accepting the previous id. An incompatible state change bumps `stateVersion` with `migrateState`; an unmigratable save is reported as corrupt (acceptable for a round of a few minutes).
- **End:** "See summary" sets `index = len`; `finished()` once; reopening a finished save shows the summary. `reset()` = the same seed's round from the start. `pause()` blocks input (no timers).
- **No answer in the DOM before the review**: cards carry no date, position or correctness attribute; the axis has no target element (a view test asserts this).

---

## 15. UI layout

### 15.1 Desktop (≥ 48 rem): card column (inline start, ≈ 1/3) and the axis panel (≈ 2/3), CSS grid with logical properties

```
┌──────────────────────── Item 3 of 8 · When was it? ────────────────────────┐
│ ┌ card ──────────────────────┐ ┌ timeline ─────────────────────────────────┐│
│ │ WHEN WAS IT?               │ │  4 billion   100 million   1 million  10,000 BCE  1 CE  2000 │
│ │ Bi Sheng invents movable   │ │  ├────────────┼────────────┼──────────┼──────────┼─────┤ │
│ │ type made of baked clay    │ │                                           ▲ Great Pyramid   │
│ │ [ 1200    ] [ CE      ▾]   │ │                                                   ◆        │
│ │ = 1200                     │ │  [−] [+] [Fit]   View: (•) squeezed ( ) even              │
│ │ [ Check ]  Skip — show me  │ └──────────────────────────────────────────┘│
│ └────────────────────────────┘                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Order: the card column holds the list; the axis panel shows only the scale (no positions) until the review. First/together: cards and radios in the card column; the axis is filled in the review.

### 15.2 Phone (360 px): one column; card, then the axis (full width), action bar sticky at the bottom

```
┌ Item 3 of 8 ─────────────────┐
│ Bi Sheng invents movable type│
│ made of baked clay           │
│ [ 1200 ][ CE ▾ ]  = 1200     │
├──────────────────────────────┤
│ 1 million  10,000 BCE  1 CE 2000│
│ ├────────┼─────────┼────┤ │
│              ◆               │
│ [−] [+] [Fit]  squeezed/even │
├──────────────────────────────┤ ← sticky
│ [ Check ]          Skip      │
└──────────────────────────────┘
```

- `touch-action: none` only on the axis (the page still scrolls); order cards scroll with the page, dragging auto-scrolls.
- No horizontal page scroll (e2e check); every target ≥ 44 px; labels on the axis stack or fall back to a legend (§ 12.3).

---

## 16. Accessibility

- Item title `h2`; "Your answer", "Where it fits", "About these events", "Sources" as `h3`. After each commit focus moves to the review heading; after "Next" to the new item's heading. One polite announcement per action ("About 40 years too recent. Close.").
- Native buttons, radio fieldsets, the select and the number field; the axis slider (§ 12.4); the reorder list with buttons and the keyboard pick-up pattern (§ 8.1); all ≥ 44 px; visible focus.
- **Screen-reader path:** every mode is fully playable without the axis: the year field and unit select (when), the list with move buttons (order), radios (first, together). Reviews state everything in text.
- No colour-only information: marks are ●/○ plus words; ranges are hatched with an outline; window brackets have a "±τ" label; option symbols ● ■ ▲ plus names; era bands have patterns and text.
- `reducedMotion`: no animated zoom (the view jumps); otherwise a 200 ms zoom-to-fit in reviews.
- Forced colours: system colours; patterns and line styles carry the meaning.

---

## 17. Localisation

### 17.1 Files

- `src/messages.ts` + `src/locales/<locale>.ts` — UI strings (≈ 150 keys): identity, settings, buttons, bands, directions, date templates (§ 17.3), unit select labels, prompts, summary phrases, tips, the rules (incl. scale and calendar notes).
- `src/content/<locale>.ts` (ADR 0011, loaded by `preload`): per event `title` and `note` (170 × 2), per curated pair the insight (12), era band names (≈ 8) — ≈ 360 strings per locale.
- `src/events.ts` — language-neutral data: ids, dates as stated by the source, category, region, tier, kind, sources (citations stay in their original language, shown with `lang="en"` like Estimation Lab), check date, `retired`.

All 16 locales at once (no `metadata.locales`, no `status`), as in Atlas Explorer (≈ 510 strings per locale). Translations other than en/de are AI-assisted (as everywhere); Portuguese is Brazilian (the repository's `pt-brazilian` test covers the game's strings).

### 17.2 Names

People are written in the conventional form of each language (transliterated where the script differs); places use the language's exonym; the content's wording rules (content § 5) are copied as a comment at the top of `content/en.ts` for translators.

### 17.3 Dates, numbers and durations (`src/format.ts`, pure, tested)

`Intl` cannot be used for era labels: `Intl.DateTimeFormat` with `era` gives only BC/AD-type forms in some languages ("BC", "AD" in Korean), has no "BCE" in English, and `Date` cannot represent 4.5 billion years ago. Measured with Node 22 / ICU 77 on 2026-10-26: compact numbers combined with `style: 'unit'` produce ungrammatical text in Romance languages ("66 millones años", "66 millions ans"). Therefore:

- **Year numbers**: `Intl.NumberFormat(bcp47Tag(locale), { useGrouping: false })` below 10,000 ("1969", never "1,969"); locale digits come from `Intl` (all 16 locales currently use Latin digits by default; the code does not assume it).
- **Era templates** (messages, per locale): `date.ce` "{year}" (≥ 1000), `date.ceEarly` "{year} CE" (1–999), `date.bce` "{year} BCE", `date.agoThousands` "{n} years ago" (10,000 ≤ ago < 1 million, `n` with grouping, 2–4 significant digits, always ending in zeros — so one plural form fits every language: ru "лет", pl "lat", ar "سنة"), `date.agoMillions` "{n} years ago" with `n` = `Intl` compact long ("66 million", de "66 Millionen", ja "6600万", hi "6.6 करोड़"); translators write the grammar around it (es "hace {n} de años", fr "il y a {n} d'années", de "vor {n} Jahren"). Word order is free: ja `date.bce` "紀元前{year}年", ko "기원전 {year}년", zh "公元前{year}年", ar "{year} ق.م".
- `date.about` "about {date}", `date.range` "{from}–{to}" (en dash), `date.atLeast` "at least {date}" (for minimum ages such as `sulawesi-art`, flag `minimum` in the data).
- **Durations** ("about 300 years", gaps, distances): below 1 million `Intl.NumberFormat` with `style: 'unit', unit: 'year', unitDisplay: 'long'` (correct plurals in every locale) inside sentences where the duration is in the nominative ("Between them lie about {duration}."; de "Dazwischen liegen etwa {duration}."); from 1 million the template `duration.millions` "{n} years" with compact `n` (es "{n} de años").
- Every number and date in `<bdi>`; formulas and the axis `dir="ltr"`.
- **Era words per locale** (recommended, owner question 2): en BCE/CE; de v. Chr./n. Chr.; nl v.Chr./n.Chr.; es a. C./d. C.; fr av. J.-C./apr. J.-C.; it a.C./d.C.; pt a.C./d.C.; pl p.n.e./n.e.; ru до н. э./н. э.; uk до н. е./н. е.; tr MÖ/MS; ar ق.م/م; hi ई.पू./ई.; zh-Hans 公元前/公元; ja 紀元前/西暦; ko 기원전/서기. CE markers appear only below 1000 CE.
- **Tests** render every event's date, range, every gap bucket label and every τ in all 16 locales and check: placeholders filled, no "NaN"/"undefined", digits only from `Intl`, en dash in ranges, `formatToParts` types (not glyphs).

### 17.4 RTL

Text and layout use logical properties; Arabic pages mirror the card column and the controls. The timeline itself is **not mirrored** (past left, present right), like numeric axes elsewhere in the repository; the rules sentence "earlier is to the left" is part of the rules in every locale. The order list is vertical, so it needs no mirroring.

---

## 18. Content and licence

- 170 events (content § 2): deep 28, early 44, middle 44, modern 54; regions and categories balanced as in § 4; tiers 38 / 97 / 35; 136 points and 34 spans; 12 curated pairs.
- **Verification:** 44 dates were checked on the web by the planner on 2026-10-26 (marked ✓ with the source used); 126 are standard reference dates from the cited works (○) and are re-checked by the implementer before release (content § 6). Records ("oldest known …") are on a yearly re-check list.
- Rejected during research: Monte Verde (a 2026 study challenges its age), the Ishango bone (age disputed), White Sands footprints (still debated).
- **Licence:** dates are facts; citations are bibliographic data; all wording is our own (project licence; non-en/de AI-assisted). Row for `docs/third-party.md`: Appendix A.

---

## 19. Preview (catalogue SVG, for the orchestrator)

Decorative, `aria-hidden`, the shared 96×64 viewBox and classes, light/dark via `currentColor`: a horizontal axis line with five ticks spaced unevenly (closer towards the right, suggesting the log scale), a hatched range band near the middle with a bold outline, a ◆ marker just left of it, and above the axis three small stacked cards with a short ▲▼ handle each (the order mode). No text, no digits, not mirrored in RTL.

---

## 20. Test plan

### 20.1 `test/time.test.ts`, `test/score.test.ts`, `test/axis.test.ts`, `test/generate.test.ts`, `test/rules.test.ts` (TDD + fast-check; fast, mutation-relevant)

- **Time:** `n BCE ↔ 1 − n` round trip (property); no year 0 (`gap(1 BCE, 1 CE) = 1`); `ago → year` with 1950; `normalise` keeps `lo ≤ y ≤ hi` for every event; era boundaries exactly at 1,000,000 years ago, 500 and 1800; display regime boundaries at −9999/−10000, 0/1, 999/1000.
- **Score:** band boundaries exactly at 0, 20, 60, 150 milli-decades on both sides; `d = 0` for every guess in `[lo, hi]` (property); `d` symmetric in the sense `score(age·k) = score(age/k)`; monotone in the distance outside the range (property); direction words; the snapping resolution (3 significant digits of age, ≥ 1 year).
- **Axis:** `x(u)` and its inverse round trip (property, log and linear); zoom keeps the anchor point fixed (property); window clamped to `[1, 9.7]` and to the minimum width; the greedy tick choice keeps ≥ 56 px spacing and always shows ≥ 2 ticks; generated ticks are 1/2/5 × 10ᵏ.
- **Generator:** for 200 seeds × 5 modes × 5 spans × 3 difficulties: every item satisfies its rule (§ 11.2) checked by the **independent oracle** (`test/oracle.ts`, § 11.4); no event is the subject twice in a round unless fallback (1) was used (and then the generator reports it); order start arrangement never sorted; gap question present only when fair, with the right bucket among 4 consecutive options; together: exactly one option overlaps the window; curated pairs ≤ 2 per round and only when eligible; determinism (same seed → same round).
- **Transitions:** random action sequences never throw and keep `isValidState`; commits are no-ops in review; `next` blocked before a review; `reported` flips once; `move` keeps a permutation; `pairs` equals the oracle's Kendall count.
- **`isValidState`:** `fc.anything()` never throws; generated states valid; tampered fields rejected (unknown id, duplicate in an order set, draft not a permutation, band inconsistent with milli, year outside the axis, gaps not increasing, `gapIndex` out of range, `tau` not a nice value, `reported` before the end, oversize arrays/strings).
- **`settingsOf`:** round trip over 5 × 5 × 3 settings.

### 20.2 `test/content.test.ts`, `test/format.test.ts`, `test/view.test.ts`

- **Content:** ids unique and kebab-case; `lo ≤ at ≤ hi` (in the source's unit); spans have `lo < hi`; every event has a title and note in all 16 locales (through `CONTENT_LOADERS`) and ≥ 1 source; **no title contains its own year** (digits of `y`, `lo`, `hi` in Latin and the locale's digits, for calendar years) or the words of `date.bce`/`date.ce` templates; the statistics of content § 2 (≥ 120 events; every region of § 2.1 ≥ 7; Europe ≤ 30 % of human-history events; every era ≥ 25; every span × tier combination non-empty after fill-up); curated pairs: both ids exist, ranges do not overlap, and the insight's claim holds (content § 4, computed); no retired id in curated pairs; zh-Hans without a list of traditional-only characters; Portuguese passes the Brazilian guard.
- **Format:** every display regime and boundary in all 16 locales (§ 17.3), `formatToParts` types, no grouping in years below 10,000, compact long from 1 million, the Earth-day clock (23:39 for 66 Ma ± 1 min; seconds and sub-millisecond branches).
- **View** (jsdom): each phase of each kind in `en`, `de`, `ar`, `ja`; RTL on text but `dir="ltr"` on the axis; no date or correctness attribute in the DOM before review; the slider's role, value text and live region after a key; the order list's buttons and keyboard pick-up announcements; the unit select re-reads the field; the year field shows the interpretation line.

### 20.3 Slow tests (`*.slow.test.ts`, ADR 0021 — `pnpm test` and the CI `long` job, not Stryker)

- `test/generator.slow.test.ts`: 1,000 seeds × 5 modes × 5 spans × 3 difficulties: generation never fails; fallback (1) ≤ 5 % of rounds, fallbacks (2) and (3) ≤ 0.5 % *(calibrate on the CI runner)*; gap question present in ≥ 75 % of medium/hard `first` items; average generation < 10 ms per round.
- `test/content-dates.slow.test.ts`: renders every event × locale through the full review text (title, date, range, note, sources, Earth-day clock) and checks for missing placeholders — heavy only because of 170 × 16 renders.

Each slow file stays under 50 % of its timeout under parallel load (the reviewer reruns them).

### 20.4 Contract (`test/contract.test.ts`)

`runGameContract(game, { interact })`: `preload('en')`; `interact` presses "Skip — just show me" on the first item and then "Next" (or, in an order item, presses one "Move down" so the draft changes before the save). Settings are sampled by the contract (5 × 5 × 3).

### 20.5 E2E (`e2e/games/timeline.spec.ts`)

1. `startGame` with `chooseSetting('mode', 'when')`, easy, all: type the event's year read from the save (`readSave` + the imported `events.ts`), choose the unit, "Check"; the review shows "Within the accepted range".
2. Keyboard-only when item: focus the axis slider, arrows and `+`, Tab to "Check"; the live region announced a date; the review appears.
3. Order mode: `expectResumeAfterReload` after two moves (the draft order survives); finish with the move buttons into the correct order (computed in the test from the save and the data); the review shows "All in the right order".
4. First mode (medium): answer both questions; the review shows the gap sentence.
5. Same-time mode: choose an option, "Check"; the review shows the window sentence.
6. Finish a whole `mixed` round with skips; the summary appears with the host's "Another round".
7. 360 × 740 viewport: no horizontal scroll, interactive targets ≥ 44 px, the sticky bar does not cover the focused element, zoom buttons work.
8. `ar` RTL smoke: card column on the inline start side, the axis not mirrored (a 1000 BCE tick is left of a 2000 tick), dates read LTR.
9. Offline: after the first load, go offline, open the game in a new page and start a round (content chunk precached).

---

## 21. Performance and bundle budget

| Item | Budget |
|---|---|
| Game code chunk incl. `events.ts` and English UI messages | ≤ 80 KB minified (≈ 26 KB gzip); `events.ts` with sources ≈ 45 KB raw |
| Content per locale | ≤ 40 KB minified (≈ 14 KB gzip), via `preload` |
| Generate a round | < 10 ms (≤ 300 attempts per item over ≤ 170 events) |
| Axis redraw on zoom/pan | < 4 ms (one SVG, ≤ 40 ticks and ≤ 12 markers; text measured once per label) |
| Saves | < 3 KB JSON per round |
| Precache increase | ≈ 80 KB + 16 × 40 KB ≈ 0.7 MB (one-time, offline) |

*(calibrate)* If `events.ts` grows past the chunk budget, the sources move into the per-locale content chunk's English fallback (they are not translated anyway).

---

## 22. Risks

| Risk | Mitigation |
|---|---|
| A date is wrong or outdated | Sources per event, ✓/○ marking, re-check list before release and yearly for records (content § 6), wide ranges for debated dates, stored verdicts |
| Bias towards Europe or towards "great men" | Balance statistics enforced by a content test (§ 20.2); many events about everyday life, places and anonymous makers |
| Political or religious offence | No wars or politics as subjects; religious buildings as architecture only; neutral era labels as recommended (question 2) |
| Deep time feels arbitrary | Log scoring with the same proportion everywhere, shown in the rules; the Earth-day clock and the even view explain the scale |
| The axis is too small on phones | Zoom, typed input, legend fallback for labels; whole modes work without the axis |
| Translation volume (≈ 510 strings × 15) | Short sentences, dates via templates and `Intl`; owner may still choose an en+de preview (ADR 0003 amendment) if translations lag |
| Name confusion with the card game "Timeline" | Distinct shown title (question 1) |
| Ordering by drag is fiddly on touch | Move buttons on every card; drag only by the handle |

---

## 23. Open questions for the owner (max 3, each with a recommendation)

1. **Title.** Recommended: **"Sense of Time" / "Zeitgefühl"** — it names the skill and avoids "Timeline", the title of a well-known commercial card game about ordering events (§ 2). Alternatives: "Time Scales" / "Zeitskalen", or "Timeline" / "Zeitstrahl" if you accept the resemblance in English. The id stays `timeline` either way.
2. **Era labels.** Recommended: English **BCE / CE** (neutral, standard in science and international education) and in German **v. Chr. / n. Chr.** (the form German schools and media use); the other languages use their usual school forms (§ 17.3; Russian, Ukrainian, Polish, Chinese, Japanese and Korean are already neutral). Alternatives: English BC / AD; German "v. u. Z. / u. Z." (neutral, but less familiar).
3. **Named people.** Recommended: keep **named people** where they make the event concrete (about 60 titles name a scientist, artist, writer, inventor or traveller such as Ibn Battuta, Hanaoka Seishū, Marie Curie, Frida Kahlo or Ramanujan; 9 events are lifetimes, which make good "same time?" questions) and only **four rulers**, each tied to a monument or a famous comparison (Cleopatra, the first Qin emperor, King Sejong, Ulugh Beg) — no religious founders, no war leaders, no living people as subjects. Alternative: no named individuals (the 9 lifetimes dropped and about 50 titles reworded anonymously, e.g. "Movable type made of baked clay is invented in China"), which is more neutral but less vivid and loses the lifetime comparisons.

---

## 24. Implementation steps (one implementer)

1. **Time core (tests first):** `src/time.ts` (conversions, normalise, eras, display regimes as data), `src/score.ts`, `src/axis.ts` (mapping, zoom, ticks) with their tests.
2. **Data:** `src/events.ts` transcribed from the content document (one-off script allowed; commit only the result), `CONTENT_ID`; re-check the ○ dates against their sources and mark the check date (content § 6); `test/content.test.ts` for the data rules.
3. **Generator:** `src/generate.ts` with `test/oracle.ts`, `test/generate.test.ts` and `generator.slow.test.ts`; print the fallback rates for the PR description.
4. **State and transitions:** `src/rules.ts` (`TimelineState`, `createRound`, transitions, `isValidState`, `settingsOf`, `summary`); random action-sequence and fuzz tests.
5. **Text:** `locales/en.ts` and `content/en.ts` first (titles, notes, insights, era band names), then `de`, then the other 14; `format.ts`; `test/format.test.ts`, the rest of `content.test.ts`, `content-dates.slow.test.ts`.
6. **Views:** `src/axis-view.ts` (SVG axis, marker slider, zoom, ticks, labels, review layers), then `view.ts` with `view-when.ts`, `view-order.ts`, `view-first.ts`, `view-together.ts`, the summary, `styles.css` (logical properties, forced colours, 360 px); `index.ts` with `preload`, `settings`, `settingsOf`; `test/view.test.ts`.
7. **Contract and e2e:** `test/contract.test.ts`, `e2e/games/timeline.spec.ts`; run the full gate (`pnpm check`, `pnpm build`, the e2e command of the pipeline brief).
8. **Report to the orchestrator:** the registry line (append after the existing games), the dependency, the preview (§ 19), the ROADMAP row (new game, skills learning/deduction), the Stryker `mutate` lines (§ 1.3), Appendix A for `docs/third-party.md`, the measured chunk sizes, and the list of re-checked ○ dates.

---

## Appendix A — row for `docs/third-party.md` (ready to paste)

```markdown
| *Sense of Time* events (170 dated events with ranges, categories and sources × 16 languages, `packages/games/timeline/src/events.ts` and `src/content/`) | Project license (written for Worthwhile Play; the dates are facts from the published sources cited per event — journal articles, museum and UNESCO pages, standard references; citations are bibliographic data; no third-party text, table or dataset file copied; non-en/de AI-assisted) | Events, notes, comparisons and source lists of *Sense of Time* |
```

(The title in the row follows the owner's decision on question 1.)

---

## Appendix B — generator calibration (planner, 2026-10-26)

Python prototype over the content's 170 events (scratchpad, not committed), 300 seeds per cell, items per round as in § 6, rules of § 11 with fill-up and without fallbacks:

| Span | width (decades) | easy pool (tier 1 + fill) | order: rounds needing fallback (1) | first / together failures | gap question fair (medium / hard) |
|---|---|---|---|---|---|
| all | 8.62 | 38 + 132 | 1.3 % | 0 / 0 | 97 % / 93 % |
| deep | 3.71 | 5 + 23 | 0 / 2.3 % / 1.7 % (e/m/h) | 0 / 0 | 98 % / 92 % |
| early | 2.36 | 10 + 34 | 3.0 % / 1.7 % / 0 | 0 / 0 | 86 % / 83 % |
| middle | 0.80 | 9 + 35 | 0 | 0 / 0 | 91 % / 82 % |
| modern | 1.32 | 14 + 40 | 0 | 0 / 0 | 99 % / 94 % |

With a fixed separation (0.25 / 0.10 / 0.03 decades for all spans) instead of the span-relative rule, easy order sets were impossible in `early`, `middle` and `modern` (100 % failures) — hence § 11.2.

Locale formatting probe (Node 22.22, ICU 77.1): `Intl.DateTimeFormat` with `era: 'short'` gives "2560 BC" (en), "2560 v. Chr." (de), "BC 2560년" (ko), "2560 г. до н. э." (ru); `Intl.NumberFormat` compact long gives "66 million", "66 Millionen", "6600万", "6.6 करोड़"; compact + `unit: 'year'` gives "66 millones años" (es) and "66 millions ans" (fr) — ungrammatical, hence the templates of § 17.3. All 16 locales use Latin digits by default in this ICU version.
