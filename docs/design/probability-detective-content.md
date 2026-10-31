# Probability Detective — case templates and their maths

Companion to [probability-detective.md](probability-detective.md) (§ references point there). **30 templates**: 12 clue templates (§ 3), 6 checks templates (§ 4) and 12 trap templates (§ 5). All story text is original and given here in English. Translations go in `src/content/<locale>.ts`. **Every number is invented for practice**, and no template states a real-world statistic. Every worked example below was computed with exact rational arithmetic (BigInt); the implementer's tests recompute them.

Notation: hypotheses are numbered in template order and get the marks ● (0), ■ (1) and ▲ (2). A clue's numbers are P(the clue shows | hypothesis), as `num/den`. "Not seen" uses the complement `den − num`. Weights are shown reduced, as the evidence chain shows them (§ 11.2).

---

## 1. Content checklist (review every template against it)

1. Hypotheses are places, machines, animals, objects or causes. They are never people, groups of people, health conditions of people, or danger (design § 4).
2. There are no person names, holidays, currencies, brands or local trivia, and no gambling words (bet, stake, jackpot, casino, lottery).
3. Story sentences contain **no digits**. Numbers come from placeholders or structured rows (`content.test.ts` enforces this).
4. Each clue states one observation. Clues within a case are separate observations (conditionally independent given the hypothesis). The only allowed exceptions are the explicit echo clues, which the model treats as carrying no new information.
5. A clue's direction must make sense in the story. The `favours` column is binding for the generator: the favoured hypothesis always gets the larger number.
6. The noun for the counting board needs plural forms in every locale (design § 17.4).

---

## 2. Number grids and clue patterns (clue and checks templates)

### 2.1 Base rates (two hypotheses: the share of ●; ■ gets the rest)

| Level | `priorDen` | Values of ● (grid) | Shown as |
|---|---|---|---|
| easy | 10 | 2, 3, 4, 6, 7, 8 | "3 in 10" |
| medium | 100 | 5, 10, 15, …, 95 except 50 | "30 %" |
| hard | 1000 | 10, 20, 25, 40, 50, 100, 200, 300, 400, 600, 700, 800 (and the mirror for ■ when the template says either hypothesis may be rare) | values below 100 as "1 in 100", "1 in 50", "1 in 40", "1 in 25", "1 in 20"; others as percent |

**Three hypotheses (hard only):** triples of multiples of 5, each ≥ 5, sum 100 (`priorDen` 100), drawn uniformly from all such triples, unless the template restricts them.

A template may **override** the grid (e.g. the coin template keeps a two-headed coin rare). Overrides are listed with the template.

### 2.2 Clue numbers by strength class (two hypotheses)

"fav" = the favoured hypothesis's number, "oth" = the other's.

| Class | easy (den 10) | medium (den 100, steps of 5) | hard (den 100, steps of 1) |
|---|---|---|---|
| `strong` | fav ∈ {7, 8, 9}, oth ∈ {1, 2, 3} | fav ∈ [60, 95], oth ∈ [5, 30], fav ≥ 2.5 · oth | fav ∈ [55, 99], oth ∈ [1, 30], fav ≥ 2.5 · oth |
| `weak` | fav ∈ {5, 6, 7}, oth ∈ {2, 3, 4}, fav − oth ≥ 2 | fav ∈ [40, 80], oth ∈ [20, 60], fav − oth ∈ [15, 35] | fav ∈ [35, 85], oth ∈ [15, 65], fav − oth ∈ [10, 30] |
| `neutral` | equal ∈ {3, …, 7} | equal ∈ [20, 80] | equal ∈ [10, 90] |
| `rate` | (not used on easy) | each ∈ [5, 25], fav − oth ≥ 10 | each ∈ [1, 15], fav ≥ 2 · oth |
| `fixed` | the template gives exact numbers per level | | |
| `search` | P(found ∣ it is there) = d ∈ {6, 7, 8}/10 (medium/hard: d ∈ [50, 90]); 0 for every other hypothesis; generated only with result "not found" | | |

### 2.3 Three hypotheses (hard)

Each clue has a pattern of levels per hypothesis, e.g. (hi, lo, mid). Ranges (den 100): hi ∈ [55, 95], mid ∈ [25, 60], lo ∈ [2, 30], with hi ≥ mid + 10 and mid ≥ lo + 10. Two hypotheses may share `lo`. `neutral` and `search` work as in § 2.2. A `rate` clue with three hypotheses has each number in [1, 15], with the favoured one at least twice each other.

### 2.4 Echo clues

An echo clue repeats an earlier clue's information ("The neighbour also saw the blue paper — it was the same parcel"). It is stored as `num[h] = den` for every h with result 1, so its likelihood ratio is exactly 1. It appears only on hard, only after the clue it echoes, and only if that clue's result is "seen". If it was not seen, the generator uses the template's neutral clue instead.

---

## 3. Clue templates (mode "Clue by clue")

Each template lists: id, hypotheses, levels, the counting-board noun, the story, the base-rate lead line, and the clue pool (id, label, favours, class; plus the "seen"/"not seen" sentences). Each one ends with a worked example. Five templates have a third hypothesis (used on hard).

### C1 `c-parcel` — The blue parcel

- **Hypotheses:** ● Warehouse North · ■ Warehouse South · ▲ Warehouse East (hard)
- **Levels:** easy, medium, hard · **Noun:** parcel(s)
- **Story:** "A parcel without a sender has arrived at the corner shop. It must come from one of the warehouses that deliver to this street."
- **Base-rate lead:** "Parcels on this street come from:"

| Clue id | Label | Favours (3-hyp pattern) | Class | Seen / not seen |
|---|---|---|---|---|
| `blue` | Wrapped in blue paper | ● (hi, lo, mid) | strong | "The parcel is wrapped in blue paper." / "The parcel is not wrapped in blue paper." |
| `brown-tape` | Sealed with brown tape | ■ (lo, hi, mid) | weak | "It is sealed with brown tape." / "It is not sealed with brown tape." |
| `smudge` | Smudged label | ■ (lo, hi, mid) | weak | "The address label is smudged." / "The address label is clean." |
| `string` | Tied with string | ▲ (lo, lo, hi) (2-hyp: ●, weak) | weak | "It is tied with string." / "It is not tied with string." |
| `tuesday` | Arrived on a Tuesday | — | neutral | "It arrived on a Tuesday. Both warehouses deliver on every weekday." (always seen) |
| `echo-blue` | The neighbour saw it too | — | echo of `blue` | "The neighbour also says the parcel was blue — she saw the same parcel." |

**Worked example (easy):** base rate ● 3 in 10, ■ 7 in 10. `blue` (● 7 in 10, ■ 2 in 10) seen; `brown-tape` (● 3 in 10, ■ 6 in 10) **not** seen (● 7 in 10, ■ 4 in 10).
Chain: 3 : 7 → × 7 : × 2 → 3 : 2 (**60 %** ●) → × 7 : × 4 → 21 : 8 (**21/29 = 72.4 %** ●).
Counting board (M = 1,000): 300 North / 700 South → blue: 210 / 140 (350 fit; 210/350 = 60 %) → not brown: 147 / 56 (203 fit; 147/203 = 72.4 %).
Likelihood-only answer for clue 1: 7/(7+2) = 77.8 %. That is 17.8 pp from the correct 60 %, which is what the base-rate flag (design § 10.2) is built to catch.

**Worked example (hard, 3 hypotheses):** base rate 50 : 30 : 20 %. `blue` (60, 15, 30) seen → 20 : 3 : 4 (74.1 % · 11.1 % · 14.8 %). `smudge` (10, 55, 30) seen → 40 : 33 : 24 (40/97 = **41.2 %** · 33/97 = 34.0 % · 24/97 = 24.7 %). `tuesday` neutral → unchanged. The final leader ● lies within [40, 97] %. The leader is lowered by `smudge`, which satisfies "mixed evidence", and the neutral clue is present.

### C2 `c-garden` — The nibbled strawberries

- **Hypotheses:** ● birds · ■ snails · ▲ a hedgehog (hard)
- **Levels:** easy, medium, hard · **Noun:** night(s) ("Imagine 1,000 nights like this one")
- **Story:** "Someone has been at the strawberries overnight. In this garden, three kinds of visitors are known to snack on them."
- **Base-rate lead:** "On nights when strawberries get nibbled, the culprit is:"

| Clue | Label | Favours (pattern) | Class | Seen / not seen |
|---|---|---|---|---|
| `slime` | Shiny trail | ■ (lo, hi, mid) | strong | "There is a shiny trail on the path." / "There is no shiny trail." |
| `pecks` | Small peck marks | ● (hi, lo, lo) | strong | "The fruit has small peck marks." / "There are no peck marks." |
| `droppings` | Droppings under the hedge | ▲ (lo, lo, hi) (2-hyp: ■, weak) | weak | "There are droppings under the hedge." / "Nothing under the hedge." |
| `net-moved` | Net pushed aside | ● (hi, lo, mid) | weak | "The net over the bed is pushed aside." / "The net is still in place." |
| `rain` | It rained last night | — | neutral | "It rained last night — all of them come out in the rain." |
| `echo-slime` | Seen again in the morning | — | echo of `slime` | "Your neighbour points out the same shiny trail." |

**Worked example (hard, 3 hypotheses):** base rate 30 : 50 : 20. `slime` (5, 70, 40) seen → 3 : 70 : 16 (■ 78.7 %). `pecks` (60, 10, 5) not seen → 6 : 315 : 76 (■ 79.3 %). `droppings` (20, 20, 85) seen → 6 : 315 : 323, i.e. 3/322 = **0.9 %** · 45/92 = **48.9 %** · 323/644 = **50.2 %**. The leader changes from ■ to ▲ in the last step. This shows how a clue that looks small can still decide a close case.

### C3 `c-cups` — The cracked cup

- **Hypotheses:** ● machine A · ■ machine B · ▲ machine C (hard)
- **Levels:** medium, hard · **Noun:** cup(s)
- **Story:** "A customer returns a cup with a hairline crack. The workshop's machines all make the same cup, but each has its quirks."
- **Base-rate lead:** "The workshop's cups are made by:"

| Clue | Label | Favours (pattern) | Class | Seen / not seen |
|---|---|---|---|---|
| `crack` | Hairline crack | ■ (lo, lo, hi) | rate | "The cup has a hairline crack." (always the first clue, always seen) |
| `glaze` | Darker glaze | ■ (lo, hi, mid) | weak | "The glaze is a little darker than usual." / "The glaze looks normal." |
| `stamp` | Crisp stamp on the base | ● (hi, mid, lo) | strong | "The maker's stamp on the base is crisp." / "The stamp is blurred." |
| `handle` | Handle slightly off-centre | ▲ (lo, mid, hi) (2-hyp: ■, weak) | weak | "The handle is slightly off-centre." / "The handle is straight." |
| `box` | Packed in a grey box | — | neutral | "It came in the usual grey box — all machines' cups do." |

**Worked example (medium):** base rate ● 60 %, ■ 40 %. `crack` (● 5 %, ■ 20 %) → 3 : 8 (● 27.3 %). This is the classic first step: the machine that makes most cups is not the likely culprit. `stamp` (75, 30) seen → 15 : 16 (● 48.4 %). `handle` (● 45, ■ 75) **not** seen → × 55 : × 25 → 33 : 16 → **33/49 = 67.3 %** ●.

**Worked example (hard, 3 hypotheses):** base rate 50 : 35 : 15. `crack` (2, 4, 12) → 5 : 7 : 9 (23.8 · 33.3 · 42.9 %). `glaze` (30, 60, 50) seen → 5 : 14 : 15 (14.7 · 41.2 · 44.1 %). `stamp` (80, 50, 20) not seen → × 20 : × 50 : × 80 → 1 : 7 : 12 (**5 %** · **35 %** · **60 %**).

### C4 `c-key` — The missing key

- **Hypotheses:** ● in the coat · ■ in the car · ▲ at the office (hard)
- **Levels:** easy, medium, hard · **Noun:** morning(s)
- **Story:** "The spare key is missing again. It is almost always in one of the same few places."
- **Base-rate lead:** "When the key goes missing, it turns up:"

| Clue | Label | Favours (pattern) | Class | Seen / not seen |
|---|---|---|---|---|
| `search-coat` | Quick search of the coat | ● | search | — / "You check the coat pockets quickly: no key. (A quick search finds it {d} when it is there.)" |
| `search-car` | Quick look in the car | ■ | search | — / "You look in the car: no key." |
| `jingle` | A jingle in the hallway | ● (hi, lo, mid) | weak | "You remember a jingle as the coat was hung up." / "You don't remember any jingle." |
| `drove` | You drove yesterday | ■ (lo, hi, mid) | weak | "You drove yesterday." / "You did not drive yesterday." |
| `office-day` | You were at the office | ▲ (lo, lo, hi) (2-hyp: ●, weak) | weak | "You were at the office yesterday." / "You worked from home yesterday." |
| `weekday` | It is a weekday | — | neutral | "Today is a weekday — that doesn't change where keys end up." |

The search clues teach **negative evidence**: not finding something lowers that place, but does not rule it out.

**Worked example (easy, 2 hypotheses):** base rate ● coat 6 in 10, ■ car 4 in 10. `search-coat` (finds it 8 in 10 when it is there; ● 8, ■ 0) not found → × 2 : × 10 → 3 : 10 (● 23.1 %). `jingle` (7, 3) seen → 21 : 30 = 7 : 10 → **7/17 = 41.2 %** ●.

**Worked example (hard, 3 hypotheses):** base rate 50 : 30 : 20. `search-coat` (70, 0, 0) not found → × 30 : × 100 : × 100 → 3 : 6 : 4 (23.1 · 46.2 · 30.8 %). `search-car` (0, 80, 0) not found → 15 : 6 : 20 (36.6 · 14.6 · 48.8 %). `office-day` (20, 15, 60) seen → 10 : 3 : 40 (18.9 · 5.7 · **75.5 %** ▲). The leader changes twice (■ → ▲ → ▲ more strongly).

### C5 `c-coin` — The coin from the fair

- **Hypotheses:** ● an ordinary coin · ■ a weighted coin · ▲ a two-headed coin (hard)
- **Levels:** easy, medium, hard · **Noun:** coin(s)
- **Story:** "You found an old coin at a fair stall that sells trick props. You can't tell it apart from an ordinary coin by looking, so you toss it."
- **Base-rate lead:** "Coins in the stall's old-coin box are:"
- **Base-rate override:** ● ordinary ∈ {6, 7, 8}/10 (easy), {70, 75, 80, 85, 90} % (medium); hard triples: ● ∈ {80, 85, 90}, ▲ ∈ {1, 2, 3, 5}, ■ the rest (`priorDen` 100).
- **Clues:** `toss1` … `toss4`, label "Toss {n}", seen = "Heads." / not seen = "Tails." **Fixed numbers:** ordinary 1/2 (easy 5/10, else 50/100); weighted heads 9 in 10 (easy) or 75 % (medium/hard); two-headed 100 %. A single tails therefore rules out the two-headed coin, which teaches decisive evidence. No neutral clue; on hard the case has 4 tosses.

**Worked example (easy):** base rate 8 : 2. Heads (5 : 9) → 40 : 18 = 20 : 9 (● 69.0 %). Heads → 100 : 81 → **100/181 = 55.2 %** ●. Even two heads in a row leave the ordinary coin slightly ahead, because ordinary coins are common.

**Worked example (hard):** base rate 90 : 8 : 2. Heads, heads, heads (50 : 75 : 100 each) → 90 : 27 : 16 (67.7 · 20.3 · 12.0 %). Tails (50 : 25 : 0) → 20 : 3 : 0 → **20/23 = 87.0 %** · 13.0 % · **0 %**.

### C6 `c-rain` — Did it rain overnight?

- **Hypotheses:** ● it rained · ■ it stayed dry
- **Levels:** easy, medium, hard · **Noun:** night(s)
- **Story:** "You were away overnight and want to know whether the seedlings got rain or need watering now."
- **Base-rate lead:** "Nights at this time of year:"

| Clue | Label | Favours | Class | Seen / not seen |
|---|---|---|---|---|
| `wet-grass` | Wet grass | ● | weak | "The grass is wet." / "The grass is dry." (dew also wets grass) |
| `gauge` | Water in the rain gauge | ● | strong | "There is water in the rain gauge." / "The rain gauge is empty." |
| `puddle` | Puddle by the gate | ● | strong | "There is a puddle by the gate." / "No puddle by the gate." |
| `snails-out` | Snails on the path | ● | weak | "Snails are out on the path." / "No snails on the path." |
| `wind` | Leaves on the table | — | neutral | "Leaves have blown onto the table — it was windy either way." |

**Worked example (medium):** ● 30 %. `wet-grass` (80, 50) seen → 24 : 35 (● 40.7 %). `gauge` (90, 5) **not** seen → × 10 : × 95 → 48 : 665 (● 6.7 %). `wind` neutral → unchanged: **dry 665/713 = 93.3 %**.
**Hard (4 clues, `priorDen` 1000, ● 300):** the same three, then `snails-out` (60, 35) seen → 576 : 4655 → ● **576/5231 = 11.0 %**, ■ 89.0 %. Clues 1 and 4 lower the final leader, which gives mixed evidence.

### C7 `c-message` — The message from "the club"

- **Hypotheses:** ● a real message from the club · ■ a fake
- **Levels:** easy, medium, hard · **Noun:** message(s)
- **Story:** "A message says it comes from your sports club and asks you to confirm your membership."
- **Base-rate lead:** "Messages that say they are from the club are:"

| Clue | Label | Favours | Class | Seen / not seen |
|---|---|---|---|---|
| `link` | Contains a link | ■ | weak | "It contains a link." / "It has no link." |
| `sender` | Unknown sender address | ■ | strong | "The sender address is not the club's usual one." / "The sender address is the usual one." |
| `hurry` | Asks you to hurry | ■ | weak | "It says you must reply today." / "It sets no deadline." |
| `your-name` | Uses your name | ● | weak | "It greets you by your name." / "It just says 'Dear member'." |
| `evening` | Arrived in the evening | — | neutral | "It arrived in the evening — both kinds arrive at any time." |

**Worked example (medium):** ● 90 %. `link` (● 45, ■ 75) seen → 27 : 5 (● 84.4 %). `sender` (5, 60) seen → 9 : 20 (● 31.0 %). `your-name` (80, 50) seen → 18 : 25 → ● **18/43 = 41.9 %**, ■ 58.1 %. A strong base rate for "real" is overturned by one strong clue.

### C8 `c-bird` — Which bird was at the feeder?

- **Hypotheses:** ● a finch · ■ a sparrow
- **Levels:** easy, medium, hard · **Noun:** visit(s)
- **Story:** "You only caught a glimpse of a small brown bird at the feeder before it flew off."
- **Base-rate lead:** "Small brown visitors at this feeder are:"
- **Note:** the shares and clue frequencies are invented for this feeder; the explanation repeats that real numbers vary by place.

| Clue | Label | Favours | Class | Seen / not seen |
|---|---|---|---|---|
| `red-patch` | A flash of red | ● | strong | "You saw a flash of red on its head." / "You saw no red at all." |
| `ground` | Fed on the ground | ■ | weak | "It fed on the ground below the feeder." / "It fed on the feeder itself." |
| `song` | A twittering song | ● | weak | "It gave a twittering song." / "It only chirped." |
| `group` | Came with a group | ■ | weak | "It came with a small group." / "It came alone." |
| `morning` | In the morning | — | neutral | "It was early morning — both come at that time." |

**Worked example (easy):** ● 7 in 10. `ground` (● 2 in 10, ■ 7 in 10) seen → 2 : 3 (● 40 %). `song` (7, 3) seen → 14 : 9 → ● **14/23 = 60.9 %**.

### C9 `c-oven` — The burnt loaf

- **Hypotheses:** ● the old oven · ■ the new oven
- **Levels:** easy, medium, hard · **Noun:** loaf / loaves
- **Story:** "One loaf from this morning's batch came out burnt on one side. The bakery bakes in two ovens."
- **Base-rate lead:** "Loaves are baked in:"

| Clue | Label | Favours | Class | Seen / not seen |
|---|---|---|---|---|
| `burnt-side` | Burnt on one side | ● | rate (easy override: ● ∈ {2, 3}, ■ 1 in 10) | "It is burnt on one side." (always the first clue, seen) |
| `pale-top` | Pale top | ● | weak | "The top is pale." / "The top is evenly brown." |
| `tray-mark` | Pattern of the new trays | ■ | strong | "The bottom shows the pattern of the new trays." / "The bottom is smooth." |
| `early` | From the first batch | ● | weak | "It came from the first batch." / "It came from a later batch." |
| `seeds` | Seeds on top | — | neutral | "It has seeds on top — both ovens bake seeded loaves." |

**Worked example (easy):** ● 4 in 10. `burnt-side` (3, 1) → 2 : 1 (● 66.7 %). `early` (7, 2) **not** seen → × 3 : × 8 → 3 : 4 → ● **3/7 = 42.9 %**, ■ 57.1 %. A "not seen" clue that favours ● when seen points to ■ when it is absent.
**Medium:** ● 40 %. `burnt-side` (25, 10) → 5 : 3 (62.5 %). `early` (75, 45) not seen → × 25 : × 55 → 25 : 33 (43.1 %). `pale-top` (65, 35) seen → 325 : 231 → ● **325/556 = 58.5 %**.

### C10 `c-beep` — The faint beep on the radio

- **Hypotheses:** ● a signal from a small satellite · ■ ordinary interference
- **Levels:** medium, hard · **Noun:** beep(s)
- **Story:** "The radio club's receiver picked up a faint, regular beep. Most such beeps are interference, but a small satellite also passes overhead."
- **Base-rate lead:** "Faint regular beeps at this receiver are:" · **Base-rate override:** ● rare: medium ● ∈ {5, 10, 15, 20} %; hard ● ∈ {10, 20, 25, 40, 50}/1000.

| Clue | Label | Favours | Class | Seen / not seen |
|---|---|---|---|---|
| `pass-time` | During a satellite pass | ● | strong | "It came while the satellite was due overhead." / "It came when no pass was due." |
| `drift` | The tone drifts slowly | ● | strong | "The tone drifts slowly, as a moving source's would." / "The tone stays steady." |
| `fades` | Fades after ten minutes | ● | weak | "It fades out after about ten minutes." / "It keeps going." |
| `rhythm` | A steady rhythm | — | neutral | "It beeps in a steady rhythm — both do." |
| `other-receiver` | A second receiver hears it | ● | weak | "A club member across town hears it too." / "The receiver across town hears nothing." |

**Worked example (hard, 4 clues):** ● 40 in 1,000 (1 in 25). `pass-time` (90, 30) → 1 : 8 (● 11.1 %). `drift` (80, 10) → 1 : 1 (50 %). `rhythm` neutral → 1 : 1. `other-receiver` (80, 55) **not** seen → × 20 : × 45 → 4 : 9 → ● **4/13 = 30.8 %**, ■ 69.2 %. Two strong clues bring a rare cause up to even odds, and a failed confirmation brings it back down.

### C11 `c-plant` — The drooping houseplant

- **Hypotheses:** ● too much water · ■ too little light
- **Levels:** easy, medium, hard · **Noun:** plant(s)
- **Story:** "The office plant is drooping and has yellow leaves. In this office, it's usually one of two things."
- **Base-rate lead:** "When plants here droop, the cause is:"

| Clue | Label | Favours | Class | Seen / not seen |
|---|---|---|---|---|
| `wet-soil` | Wet soil | ● | weak | "The soil is still wet two days after watering." / "The soil is dry." |
| `leaning` | Leaning to the window | ■ | weak | "It leans towards the window." / "It stands straight." |
| `soft-stem` | Soft stem base | ● | strong | "The base of the stem is soft." / "The stem is firm." |
| `pale-new` | Pale new leaves | ■ | weak | "The new leaves are pale and small." / "The new leaves look healthy." |
| `pot-colour` | A blue pot | — | neutral | "It is in a blue pot — that changes nothing." |

**Worked example (medium):** ● 45 %. `wet-soil` (70, 40) seen → 63 : 44 (58.9 %). `leaning` (● 35, ■ 65) seen → 441 : 572 (43.5 %). `soft-stem` (60, 20) **not** seen → × 40 : × 80 → 441 : 1144 → ● **441/1585 = 27.8 %**, ■ 72.2 %.

### C12 `c-bus` — Why was the bus late?

- **Hypotheses:** ● a traffic jam · ■ a breakdown
- **Levels:** easy, medium, hard · **Noun:** late bus / late buses
- **Story:** "Your bus came forty minutes late this morning." ("forty minutes" is written in words; it is not part of the maths.)
- **Base-rate lead:** "When this bus is very late, the reason is:"

| Clue | Label | Favours | Class | Seen / not seen |
|---|---|---|---|---|
| `others-late` | Other buses late too | ● | strong | "Other buses on the same road were late too." / "Other buses on the road were on time." |
| `replacement` | A different bus came | ■ | strong | "A different bus than usual came." / "The usual bus came." |
| `announcement` | An announcement | ■ | weak | "The display said 'delay due to a technical fault'." / "The display gave no reason." |
| `rush-hour` | During rush hour | ● | weak | "It was rush hour." / "It was a quiet time of day." |
| `rain` | It was raining | — | neutral | "It was raining — at this stop that makes no difference." |

**Worked example (medium):** ● 85 %. `others-late` (70, 10) **not** seen → × 30 : × 90 → 17 : 9 (65.4 %). `replacement` (10, 90) seen → 17 : 81 (● 17.3 %). `rain` neutral → ● **17/98 = 17.3 %**, ■ 82.7 %.

### 3.1 Summary of clue templates

| Id | Hyps | Levels | Pool size | Neutral | Echo |
|---|---|---|---|---|---|
| c-parcel | 3 | e m h | 6 | ✓ | ✓ |
| c-garden | 3 | e m h | 6 | ✓ | ✓ |
| c-cups | 3 | m h | 5 | ✓ | — |
| c-key | 3 | e m h | 6 | ✓ | — |
| c-coin | 3 | e m h | 4 (fixed) | — | — |
| c-rain | 2 | e m h | 5 | ✓ | — |
| c-message | 2 | e m h | 5 | ✓ | — |
| c-bird | 2 | e m h | 5 | ✓ | — |
| c-oven | 2 | e m h | 5 | ✓ | — |
| c-beep | 2 | m h | 5 | ✓ | — |
| c-plant | 2 | e m h | 5 | ✓ | — |
| c-bus | 2 | e m h | 5 | ✓ | — |

Easy has 10 eligible templates, medium 12 and hard 12. That is enough for 5 distinct per round.

### 3.2 Fixed first clues

`c-cups/crack` and `c-oven/burnt-side` describe why the case exists, so the generator always places them first with result "seen". This does not affect calibration: the result is part of the observed evidence and is drawn given the truth. If the drawn result is "not seen", the attempt is rejected, which is a filter on the evidence alone.

---

## 4. Checks templates (mode "Choose the checks")

Each template has two hypotheses, 2 options (3 on hard), and a pool of 5 checks (pattern, class, cost). The generator takes 3 checks (easy) or 4 (medium/hard) from the pool, chosen at random (distinct). One check per template is a near-neutral "folk" check, so that "not every check is worth its cost" (the medium/hard filter) can hold. Base rates: easy ● ∈ {3, 4, 6, 7}/10, medium ● ∈ {20, 25, …, 80} %, hard ● ∈ [10, 90] % (any whole percent). Payoffs come from the grids per option; costs come from the listed sets (easy: the lowest value). The worked examples are exact (design § 7.3).

**Check number classes** (P(the check shows ∣ hypothesis); "fav" = the hypothesis it points to):

| Class | easy (den 10) | medium (steps of 5) / hard (steps of 1), den 100 |
|---|---|---|
| `weak` | fav ∈ {6, …, 9}, oth ∈ {1, …, 5}, fav − oth ≥ 2 | fav ∈ [55, 90], oth ∈ [10, 50], fav − oth ∈ [20, 50] |
| `strong` | fav ∈ {8, 9}, oth ∈ {1, 2} | fav ∈ [80, 95], oth ∈ [5, 20] |
| `folk` | fav − oth ∈ {0, 1} | 0 ≤ fav − oth ≤ 10 |

A template may narrow a class (noted per check).

### K1 `k-picnic` — Outdoors or in the hall?

- ● a dry afternoon · ■ rain. "The neighbourhood picnic is this afternoon. You can hold it on the green, or book the community hall."
- **Options:** `outdoors` (● {12, 14, 16, 18}, ■ {−8, −10, −12, −14}) · `hall` (both {4, 5, 6, 7}) · hard `tent` (● {8, 9, 10}, ■ {1, 2, 3}).
- **Checks:** `sky` "Dark clouds by noon" ■ weak, cost 1 · `barometer` "The barometer is falling" ■ weak, cost 1 · `farmer` "The farmer down the road expects rain" ■ strong, cost 2 · `service` "The weather service warns of rain" ■ strong (fav ≥ 85), cost 3 · folk `swallows` "Swallows fly low" (+ up to 10 for ■), cost 1.
- **Example (medium):** ● 60 %; outdoors +16/−12, hall +6. Checks sky (30, 80), barometer (20, 70), farmer (10, 85), swallows (45, 55). EV now: outdoors 24/5 = 4.8, hall **6**. **Best plan V(∅) = 208/25 = 8.32**, first step: ask the farmer. Myopic net values: sky +1.76, barometer +1.64, farmer +2.32, swallows **−0.94** (not worth its cost).
- **Example (hard):** the same with `tent` (+10/+2) added and checks sky, farmer, service (5, 90; cost 3), swallows. EV now: 4.8 / **6.8** (tent) / 6. V(∅) = **208/25**, first step: the farmer. The check that sounds most reliable (the service, 9 in 10) is not the best first step because it costs more. Myopic: +0.96, +1.52, +1.18, −1.00.

### K2 `k-bike` — Buy the second-hand bike?

- ● sound · ■ hidden damage. "A second-hand bike is for sale at a good price. Bikes like this are usually fine, but some have hidden damage."
- **Options:** `buy` (● {8, 10, 12}, ■ {−12, −16, −20}) · `skip` (0, 0) · hard `offer-less` (● {5, 6}, ■ {−6, −8}).
- **Checks:** `ride` "A test ride is smooth" ● weak, cost 1 · `chain` "The chain is rusty" ■ weak, cost 1 · `receipts` "The seller has repair receipts" ● weak (fav − oth ≤ 20), cost 1 · `mechanic` "A mechanic finds a problem" ■ strong (fav ≥ 90), cost {3, 4} · folk `seller-says` "The seller says it's fine" (+ up to 10 for ●), cost 1.
- **Example (easy, 3 checks):** ● 7 in 10; buy +12/−20. ride (9, 5), chain (3, 6), mechanic (1, 9; cost 3). EV now: buy **12/5 = 2.4**, skip 0. **V(∅) = 99/25 = 3.96**, first: the mechanic. Myopic: +1.16, +0.08, +1.56.
- **Example (medium):** ● 70 %; ride (90, 50), chain (30, 60), receipts (60, 40), mechanic (5, 95; cost 4). EV now 2.4. **V(∅) = 92/25 = 3.68**, first: the mechanic. Myopic: +1.16, +0.08, **−0.76**, +1.28.

### K3 `k-seeds` — Sow the old seeds?

- ● still good · ■ mostly dead. "A forgotten packet of seeds turned up in the shed. Sowing them takes a weekend; fresh seeds cost a little."
- **Options:** `sow` (● {10, 12, 14}, ■ {−6, −8, −10}) · `fresh` (both {3, 4, 5}).
- **Checks:** `float` "Most seeds sink in water" ● weak, cost 1 · `sprout` "At least seven of ten sprout on a damp towel" ● strong, cost 2 · `date` "The packet date is recent" ● weak, cost 1 · `shrivelled` "The seeds look shrivelled" ■ weak, cost 1 · folk `smell` "They smell fresh" (+ up to 10 for ●), cost 1.
- **Example (medium):** ● 50 %; sow +14/−8, fresh +4. float (70, 30), sprout (85, 15), date (60, 40), smell (90, 80). EV now: sow 3, fresh **4**. **V(∅) = 107/20 = 5.35**, first: the sprout test. Myopic: +0.70, +1.35, −0.40, −1.00.

### K4 `k-melon` — Buy this melon?

- ● ripe · ■ not ripe yet. "At the market, one melon is left at a good price."
- **Options:** `buy` (● {10, 12, 16}, ■ {−6, −8}) · `leave` (0, 0).
- **Checks:** `knock` "It sounds hollow when knocked" ● weak, cost 1 · `smell` "It smells sweet" ● weak, cost 1 · `soft-end` "The end gives a little when pressed" ● weak, cost 1 · `taste` "The stall lets you taste a slice from the same crate: sweet" ● strong (fav ≥ 90), cost 3 · folk `sticker` "It has a 'ripe' sticker", cost 1.
- **Example (easy, 3 checks):** ● 4 in 10; buy +16/−8. knock (7, 4), smell (6, 2), taste (9, 1; cost 3). EV now **8/5 = 1.6**. **V(∅) = 57/25 = 2.28**, first: the taste. Myopic: −0.04, +0.28, +0.68.
- **Example (medium):** ● 40 %; knock (70, 40), smell (60, 20), soft-end (60, 15), taste (95, 5; cost 3). **V(∅) = 71/25 = 2.84**, first: the taste. Myopic: **−0.04**, +0.28, +0.52, +1.24.
- **Example (medium, with the folk check instead of the taste):** knock, smell, soft-end, sticker (55, 50). **V(∅) = 11/5 = 2.2**, first: the soft end. Myopic: −0.04, +0.28, +0.52, **−1.00**.

### K5 `k-bread` — Bake extra for the market?

- ● a busy market day · ■ a quiet one. "Tomorrow is market day. Extra bread sells well on a busy day but goes stale on a quiet one."
- **Options:** `extra` (● {16, 18, 20}, ■ {−4, −6, −8}) · `normal` (both {5, 6, 7}) · hard `little-extra` (● {10, 12}, ■ {2, 3}).
- **Checks:** `calendar` "The town calendar lists an event" ● weak, cost 1 · `neighbour` "The cheese stall expects a crowd" ● weak, cost 1 · `sunny` "Sun is forecast" ● weak, cost 1 · `office` "The market office expects many visitors" ● strong (fav ≥ 80), cost 2 · folk `last-week` "Last week was busy" (+ up to 10 for ●), cost 1.
- **Example (medium):** ● 40 %; extra +20/−6, normal +6. calendar (70, 20), neighbour (60, 30), sunny (80, 50), last-week (50, 45). EV now: 22/5 = 4.4 / **6**. **V(∅) = 187/25 = 7.48**, first: the calendar. Myopic: +1.48, +0.20, **−0.12**, −1.00.

### K6 `k-laptop` — Repair it yourself?

- ● a minor fault · ■ a major fault. "The laptop shuts down at random. A repair at home is cheap if the fault is minor, but wasted effort if it is major."
- **Options:** `repair` (● {10, 12, 14}, ■ {−8, −10, −12}) · `shop` (both {2, 3, 4}) · hard `wait` (● {4, 5}, ■ {−2, −3}).
- **Checks:** `error-code` "An error code appears at restart" ■ weak, cost 1 · `diagnostics` "The diagnostic tool reports a fault" ■ strong, cost 2 · `cable` "It works after swapping the cable" ● weak, cost 1 · `fan` "The fan makes a grinding noise" ■ weak, cost 1 · folk `forum` "Others with this model say it was minor" (+ up to 10 for ●), cost 1.
- **Example (medium):** ● 60 %; repair +14/−12, shop +2. error-code (20, 70), diagnostics (10, 80), cable (60, 10), forum (55, 45). EV now: **18/5 = 3.6** / 2. **V(∅) = 134/25 = 5.36**, first: the diagnostics. Myopic: +1.48, +1.76, +1.16, **−1.00**.

### 4.1 Filters per level (design § 7.2)

Easy: V(∅) − Decide(∅) ≥ 0.5. Medium: the same and ≥ 1 check with negative myopic value. Hard: as medium, plus the best first action is not the check with the highest number for the hypothesis it points to. Every example above passes the filters of its level. *Implementer:* test them as fixtures.

---

## 5. Trap templates (mode "Thinking traps")

Each lists: the story (en, with `{placeholders}`), parameters and grids per level, the questions with exact answers, a worked example, the test oracle and the visual (design § 11.5).

### T1 `t-sensor` — The lamp sensor (base-rate neglect)

- **Story:** "The town checks its old street lamps with a sensor. {f} of the lamps are actually faulty. The sensor flags a faulty lamp {s} of the time, but it also flags {q} of working lamps by mistake. Lamp 214 has just been flagged." *(214 is a label, not a number in the maths — spelled as the placeholder `{lamp}`, from the rng.)*
- **Params:** `[fNum, fDen, sNum, qNum, den]`. Easy: f ∈ {1, 2}/10, s ∈ {8, 9}/10, q ∈ {1, 2}/10 (natural-frequency phrasing). Medium: f ∈ {2, 5, 10}/100, s ∈ {80, 90, 95} %, q ∈ {5, 10, 20} %. Hard: f ∈ {5, 10, 20}/1000, s ∈ [90, 99] %, q ∈ [2, 10] %.
- **Q1 (choice):** "Is the flagged lamp more likely faulty or working?" → by comparing `f·s` with `(1−f)·q`. **Q2 (prob):** "How likely is it that lamp {lamp} is faulty?" → `f·s / (f·s + (1−f)·q)`.
- **Example:** f = 2 %, s = 90 %, q = 5 % → 18 : 49 → **18/67 = 26.9 %** (Q1: working is more likely).
- **Oracle:** an integer population of `fDen · 100` lamps. **Visual:** `board` with 1,000 lamps: 20 faulty → 18 flagged; 980 working → 49 flagged; "18 of the 67 flagged lamps are faulty".

### T2 `t-wheel` — The spinner (gambler's fallacy)

- **Story:** "A fair spinner has {k} equal sections; {r} of them show a star. The last {s} spins all missed the star."
- **Params:** `[k, r, s]`, k ∈ {3, 4, 5, 6, 8}, 1 ≤ r < k, s ∈ {4, 5, 6, 7} (easy s ≤ 5).
- **Q1:** "On the next spin, a star is…" {more likely than usual, less likely than usual, **just as likely as always**}. **Q2:** "How likely is a star on the next spin?" → **r/k**.
- **Example:** k = 4, r = 1, s = 6 → **25 %**.
- **Oracle:** enumeration of all k^(s+1) sequences for small k, s, conditioning on the first s missing (the conditional frequency is r/k). **Visual:** `sequence` — the missed spins, then the next spin with its r/k, and the sentence "The spinner has no memory."

### T3 `t-sequence` — Which pattern is more likely? (representativeness)

- **Story:** "A fair coin is tossed {n} times. Which result is more likely?" Shown: A = a streak (all ●), B = a mixed-looking sequence drawn by the rng (with at least two changes and not alternating perfectly).
- **Params:** `[n, maskB]`, n ∈ {5, 6} (easy), {6, 8} (medium/hard); `maskB` = the bits of B.
- **Q1:** {A, B, **equally likely**}. **Q2:** "How likely is exactly sequence B?" → **1/2ⁿ** (n = 6: 1.6 %).
- **Oracle:** enumeration of all 2ⁿ sequences. **Visual:** `sequence` with "1 in 64" next to both rows, and the remark that "a streak" as a *kind* of result is rarer than "mixed" as a kind, but each exact sequence is equally likely.

### T4 `t-conjunction` — Rain and wind (conjunction trap)

- **Story:** "Tomorrow's forecast gives rain a {a} chance. On rainy days here, it is windy {b} of the time; on dry days, {w} of the time."
- **Params:** `[a, b, w]` in %, a ∈ {40, 50, 60, 70, 80}, b ∈ {30, 40, 50, 60, 70}, w ∈ {10, 20, 30, 40}.
- **Q1:** "Which is more likely tomorrow?" {**windy**, rainy and windy, both the same}. Because P(windy) = a·b + (1−a)·w > a·b whenever w > 0 (w ≥ 10 by the grid). **Q2:** "How likely is 'rainy and windy'?" → **a · b**.
- **Example:** a = 60, b = 50, w = 30 → rainy and windy **30 %**, windy 30 + 12 = **42 %**.
- **Oracle:** a 100-day table. **Visual:** `table` "Imagine 100 days": rainy 60 (windy 30, calm 30), dry 40 (windy 12, calm 28). The sentence: "Every 'rainy and windy' day is also a windy day, so 'rainy and windy' can never be more likely than 'windy'."

### T5 `t-simpson` — The two delivery services (Simpson's paradox)

- **Story:** "Two delivery services report how often they were on time last month, for short routes and for long routes."
- **Params:** `[aSn, aSk, aLn, aLk, bSn, bSk, bLn, bLk]` (n = deliveries, k = on time). **Generator:** aSn + aLn = bSn + bLn = 100. Service A mostly long routes: aSn ∈ {10, 20, 25}. B mostly short: bSn ∈ {75, 80, 90}. Then pick rates (whole numbers of deliveries) with A better on short **and** on long, but B better overall: `aSk/aSn > bSk/bSn`, `aLk/aLn > bLk/bLn`, `(aSk + aLk) < (bSk + bLk)`. Retry until all three hold (the generator test asserts success within 50 tries).
- **Q1:** "Which service is on time more often overall?" {A, **B**, the same}. **Q2:** "Your parcel goes on a long route. Which service has the better record for long routes?" {**A**, B, the same}.
- **Example:** A: short 18/20 (90 %), long 48/80 (60 %), overall 66/100. B: short 68/80 (85 %), long 11/20 (55 %), overall **79/100**. A is better in both groups, yet B is better overall, because B mostly does the easier short routes.
- **Oracle:** direct counting (the three comparisons). **Visual:** `table` with a group column and bold "better" per row, plus one line per service "mostly short routes / mostly long routes".

### T6 `t-paw` — The paw print in the flour (confusing the two directions)

- **Story:** "Someone walked through the flour on the bakery floor overnight. The paw print matches the neighbour's cat. Only {1/r} of cats have a print like this. About {N} cats live close enough to have come in."
- **Params:** `[N, r]`, N ∈ {100, 200, 400, 1000}, r ∈ {20, 50, 100, 200}, with r ≤ N/2, so the answer is ≤ 34 % and the trap bites.
- **Q1:** "Does 'only 1 in {r} cats' mean it is almost certainly the neighbour's cat?" {yes, about {1−1/r}; **no, much less sure**}. **Q2:** "How likely is it that it was the neighbour's cat?" (assuming each nearby cat was equally likely to come in) → **r / (r + N − 1)**.
- **Derivation:** prior 1/N for the neighbour's cat; if it came in, its print matches with probability 1; if another cat came in, the neighbour's cat matches the found print by chance with probability 1/r. So 1/N : (N−1)/(N·r) = r : (N − 1).
- **Example:** N = 400, r = 50 → **50/449 = 11.1 %**. About 8 other nearby cats would match too.
- **Oracle:** an explicit population (N cats, matches per cat). **Visual:** `board` "Of 400 cats, about 8 others share the pattern: 1 neighbour's cat + 8 others match".

### T7 `t-bakery` — The small and the large bakery (sample size)

- **Story:** "Two bakeries sell rye and wheat loaves; on average, half of the loaves sold are rye, and each loaf is a separate choice. The small bakery sells {n1} loaves a day, the large one {n2}. Which bakery has more days on which more than {t} of the loaves sold are rye?"
- **Params:** `[n1, n2, t]`, n1 ∈ {10, 12, 20}, n2 ∈ {40, 50, 100}, t ∈ {60, 70, 75} %. Levels: medium, hard.
- **Q1:** {**the small bakery**, the large bakery, about the same}. **Q2:** "On about what share of days does the small bakery sell more than {t} rye?" → `P(X > t·n1/100)`, X ~ Binomial(n1, 1/2), = `Σ_{k > t·n1/100} C(n1, k) / 2^n1`.
- **Example:** n1 = 10, n2 = 50, t = 70 % → small: P(X ≥ 8) = 56/1024 = **7/128 = 5.5 %**; large: P(X ≥ 36) = 366,223,075,089 / 2⁵⁰ ≈ **0.13 %**. With t = 60 %: 11/64 = 17.2 % versus 8,368,282,903,647 / 2⁴⁷ ≈ 5.9 %.
- **Oracle:** Pascal's triangle by addition (versus the multiplicative `C(n, k)` of the implementation), BigInt. **Visual:** `bars` — both distributions as shares of days, the threshold line, the tail hatched, and the tail share as text.

### T8 `t-drawers` — The helper who knows (three drawers)

- **Story:** "One of {n} closed drawers holds the key. You point to one drawer. The caretaker, who knows where the key is, then opens {n−2} of the other drawers, all empty, and asks: keep your drawer, or switch to the one other closed drawer?"
- **Params:** `[n]`, n ∈ {3} (easy is not used; medium {3, 4}; hard {3, 4, 5}). Rule stated in the story: the caretaker always opens empty drawers, never yours, and leaves exactly one other closed.
- **Q1:** {**switch**, keep, it makes no difference}. **Q2:** "How likely is the key in the other closed drawer?" → **(n − 1)/n** (n = 3: 66.7 %).
- **Oracle:** enumeration over key position × your choice × the caretaker's choices (uniform among allowed ones). **Visual:** `board` "Imagine {100·n} games: in 100 your first pick has the key → switching loses; in {100·(n−1)} it doesn't → the caretaker must leave the key's drawer closed → switching wins."

### T9 `t-week` — At least one rainy day (adding chances)

- **Story:** "You plan a trip of {m} days. Each day has a {q} chance of rain, separately from the other days."
- **Params:** `[m, q]`, easy m ∈ {2, 3}, q ∈ {10, 20, 50} %; medium/hard m ∈ {3, 5, 7, 10}, q ∈ {10, 20, 25, 30} %, with m·q > 100 % on at least half of the hard grid (so "just add them" visibly fails).
- **Q:** "How likely is at least one rainy day?" → **1 − (1 − q)^m**.
- **Example:** m = 7, q = 20 % → 1 − (4/5)⁷ = **61,741/78,125 = 79.0 %** (adding would give 140 %, which is impossible).
- **Oracle:** enumeration of all 2^m day patterns with their probabilities. **Visual:** `product` "no rain on day 1: 4/5 · … · day 7 → 21.0 % no rain at all → 79.0 % at least one".

### T10 `t-numbers` — Two people, same number (coincidence)

- **Story:** "Each of {g} people secretly picks a whole number from 1 to {R}, at random. How likely is it that at least two of them pick the same number?"
- **Params:** `[g, R]`. Medium R = 100, g ∈ {5, 8, 10, 12, 15}; hard R ∈ {100, 365}, g ∈ {10, 12, 15, 20, 23, 30}.
- **Q1:** "Your gut feeling first:" {less than 1 in 4, **about an even chance**, more than 3 in 4}. The correct option is the bin of the exact value (< 25 %, 25–75 %, > 75 %). Params whose value falls within 3 pp of a bin edge are excluded. **Q2:** the probability → **1 − Π_{i=0}^{g−1} (R − i)/R**.
- **Example:** g = 12, R = 100 → **49.7 %** (exact: 194,080,717,127,425,363 / 390,625,000,000,000,000). g = 20 → 87.0 %.
- **Oracle:** brute force over all R^g assignments for g ≤ 3 (and R ≤ 20), plus an independent recursion `P_noMatch(g) = P_noMatch(g−1) · (R−g+1)/R` versus the closed product. **Visual:** `product` with the running "all different so far" share and the sentence "with 12 people there are 66 pairs that could match".

### T11 `t-tyres` — Fewer punctures (relative versus absolute; the title stays neutral because hard levels cut by a quarter, not a half)

- **Story:** "A new kind of tyre halves the punctures: from {b} rides in 100 to {a} in 100." (or "cuts them by a quarter", per the parameters)
- **Params:** `[b, a]` with b ∈ {2, 4, 6, 8, 10}, a = b/2 (easy, medium) or a = 3b/4 (hard, b ∈ {4, 8}).
- **Q (count):** "Out of 1,000 rides, how many fewer punctures?" Options = {**(b − a)·10**, the relative reduction as a number (50 or 25), 1000 × relative (500 or 250), b − a}, deduplicated, shuffled, always 4 distinct values (the generator test asserts this).
- **Example:** b = 4, a = 2 → **20** fewer per 1,000 rides (a 50 % relative drop).
- **Oracle:** direct counting over 1,000 rides. **Visual:** `board` with two rows of 1,000 rides (icons in blocks of 10), 40 versus 20 marked.

### T12 `t-dice` — Two dice (counting outcomes)

- **Story:** "You roll two ordinary dice and add the numbers. Which sum is more likely: {s1} or {s2}?"
- **Params:** `[s1, s2]`, 2 ≤ s1 < s2 ≤ 12, with count c(s) = 6 − |s − 7|. Easy: |c(s1) − c(s2)| ≥ 2. Medium/hard also allow equal counts (e.g. 6 and 8), where the right answer is "equally likely".
- **Q1:** {{s1}, {s2}, equally likely}. **Q2:** "How likely is the sum {s1}?" → **c(s1)/36**.
- **Example:** 7 versus 10 → 6/36 = **16.7 %** versus 3/36 = 8.3 %.
- **Oracle:** enumeration of the 36 ordered pairs. **Visual:** `grid` 6 × 6 with both sums marked (different marks, and counts as text).

### 5.1 Levels of the trap templates

| Template | easy | medium | hard |
|---|---|---|---|
| t-sensor | ✓ | ✓ | ✓ |
| t-wheel | ✓ | ✓ | ✓ |
| t-sequence | ✓ | ✓ | ✓ |
| t-conjunction | ✓ | ✓ | ✓ |
| t-simpson | — | ✓ | ✓ |
| t-paw | — | ✓ | ✓ |
| t-bakery | — | ✓ | ✓ |
| t-drawers | — | ✓ | ✓ |
| t-week | ✓ | ✓ | ✓ |
| t-numbers | — | ✓ | ✓ |
| t-tyres | ✓ | ✓ | ✓ |
| t-dice | ✓ | ✓ | ✓ |

Easy has 7 eligible templates (5 per round, distinct). Medium and hard have 12.

---

## 6. Content tests derived from this document (`test/content.test.ts`)

1. Every template id here exists in `templates.ts` / `traps.ts` and vice versa; ids are unique; no template is retired at launch.
2. Every clue's grid respects its `favours` and class (the generator never produces a contradiction): a property over 1,000 draws per clue and level.
3. Every worked example in this document is a fixture: its chain, weights and percentages (clue templates), V(∅), first step and myopic values (checks templates), and exact answers (traps) match the implementation exactly as fractions.
4. Every echo clue references a clue of the same template, and every neutral clue has equal numbers.
5. Text: every template has all strings in all 16 locales with identical placeholder sets, story and clue sentences contain no digits, and the plural forms of the noun are complete per locale (design § 17.4).
6. The checklist in § 1 is part of the reviewer's manual check (it cannot be automated beyond items 3 and 5).
