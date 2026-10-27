# Pond & Meadow (`ecosystem`) — design

Status: **Plan (2026-10-27)**, written by the planner of the new-games pipeline (game 6 of the owner's list, working title "Tiny Ecosystem"; done before it: Best Plan, Estimation Lab, Probability Detective, Atlas Explorer, Sense of Time). The implementer follows it, and the reviewer checks the work against it. The simulation was prototyped and calibrated for this plan (integer engine identical to § 7, both habitats, every challenge and goal; Appendix B). Numbers marked *(calibrate)* are first estimates; the implementer may tune them within the stated bounds, but every outcome listed in Appendix B must still hold (the slow tests of § 19.3 enforce it).

Scope for the implementer (feature agent, ADR 0006): `packages/games/ecosystem/` and `e2e/games/ecosystem.spec.ts`. The orchestrator creates `package.json` (dependencies `@wp/game-core`, `@wp/ui`), the registry line (appended after the existing games), the dependency in `apps/web/package.json`, the preview in `apps/web/src/previews.ts` (§ 18), the Stryker `mutate` lines (§ 1.3) and pastes Appendix A into `docs/third-party.md`. **No new npm dependency, no third-party data or art.** No shared change is needed for the MVP.

Binding inputs: `CLAUDE.md`, the implementation brief ("Core product principles", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"), ADR 0002 (contract), 0003 incl. the 2026-10-24 amendment (§ 17.5), 0006 (roles), 0011 (per-locale content, `preload`), 0017 (start screen, `settings`, `settingsOf`, `begin`), 0021 (mutation budget, `*.slow.test.ts`). The stack-duel physics note of the pipeline brief does not apply: no physics is reused.

---

## 1. Survey: overlap and reuse

### 1.1 Overlap with the catalogue

| Game | Relation | Consequence |
|---|---|---|
| Flow Lab (`systems-puzzle`) | Integer stock-and-flow simulation (tanks, pipes, delays), tick by tick, conserved quantity. | Same **engineering pattern** (integer flows, exact conservation, replay from an action log). Flow Lab is a *puzzle* with a designed solution in a machine; here the system is *alive*: growth, feedback loops, nonlinear thresholds and surprises. Flow Lab asks "how do I reach exactly 7 L"; this game asks "what will happen, and why". |
| Fix the Machine (`debug-system`), Robot Program | Discrete systems with exact rules. | No overlap; those are algorithmic. |
| Orbit Links (`node-conquest`) | Deterministic tick simulation; review chart with patterned lines per faction. | Copy the **chart pattern** (lines differ by dash pattern, not only colour; `role="img"` plus a text alternative). |
| Many Lives (`many-lives`) | Long deterministic simulation with fast-forward until an event. | Same "time moves only when you say so" principle; no code shared. |
| Probability Detective, Sense of Time | Predict, commit, review; marks ●●○ plus words; "Skip — just show me"; `reported` guard; per-locale content (ADR 0011). | Copied **round shape and review tone** (games never import each other). |
| Estimation Lab (`fermi-lab`) | Calm review with a chart, `format.ts` with `Intl`. | Number formatting patterns copied. |

No game in the catalogue models feedback loops, delays, carrying capacity, predator–prey cycles, nutrient cycles or tipping points. That is the gap this game fills.

### 1.2 What is reused

- `@wp/game-core`: `GameModule`, `defineGame`, `createRng`, `seedFromString`, `normalizeSeed`, guards (`isRecord`, `isInt`, `isArrayOf`, `isOneOf`, `isUint32`), `createLocaleContent`, `SettingSpec`, `bcp47Tag`.
- `@wp/ui`: `h`, `clear`, `announce`.
- `@wp/testing`: `runGameContract`, `startGame`, `chooseSetting`, `submitStart`, `expectResumeAfterReload`, `readSave`.
- **Patterns copied:** Flow Lab's replay-from-actions state; node-conquest's patterned review chart; probability-detective's review layout, skip semantics and `reported` guard; fermi-lab's `content/index.ts` loader table (`preloadContent`/`contentFor`); mini-optimizer's spinbutton stepper and sticky status box below 48 rem.

### 1.3 Optional shared changes (report to the orchestrator; not needed for the MVP)

1. **Mutation targets** (orchestrator-owned `stryker.config.json`): add `packages/games/ecosystem/src/model.ts`, `src/shape.ts`, `src/score.ts`, `src/goals.ts` and `src/cld.ts` (`rules.ts` is already covered by the glob). Never `src/presets.ts` (generated data).
2. **Skills.** The game uses `systems` and `hypothesis` (§ 2). No new skill is needed.

---

## 2. Identity

| | |
|---|---|
| Package id | `ecosystem` (`@wp/game-ecosystem`). Neutral, so a later title change touches no saves. |
| English title | **Pond & Meadow** (recommended, owner question 1) |
| German title | **Teich & Wiese** |
| Other locales (draft; translators may adjust) | nl Vijver & Weide · es Estanque y prado · fr Mare et prairie · ru Пруд и луг · zh-Hans 池塘与草地 · ko 연못과 초원 · ja 池と野原 · ar البركة والمرج · pt Lagoa e Prado · it Stagno e prato · pl Staw i łąka · tr Gölet ve Çayır · uk Ставок і луг · hi तालाब और घास का मैदान |
| Tagline (en) | "A small living pond and meadow: change one thing, predict what happens, and see the loops behind it." |
| Skills | `systems` (feedback loops, delays, stocks and flows), `hypothesis` (predict, run, compare) |
| `typicalMinutes` | `[8, 20]` |
| `difficulties` | `['easy', 'medium', 'hard']` |
| Input | pointer, touch, keyboard |
| Capabilities | offline, no audio, no AI, no network, no WebGPU, pauseable |
| `stateVersion` | 1 |

Titles considered: "Tiny Ecosystem" / "Kleines Ökosystem" (the working title; accurate but dry), "Ecosystem Lab" / "Ökosystem-Labor" (fits Flow Lab and Estimation Lab, but the catalogue already has two "Labs" and Balance Lab is next). "Pond & Meadow" names what the player sees, is warm, and is not the name of a known commercial game.

---

## 3. Pitch and honest value

**Pitch.** A garden pond and a small meadow live on your screen. Water fleas graze the algae, small fish hunt the water fleas, pondweed keeps the water clear; on the meadow, ladybirds eat aphids, foxes keep the rabbits in check, earthworms turn dead leaves back into food. You change one thing — a field upstream starts to drain into the pond, a neighbour sprays insecticide, the foxes disappear — and before anything runs, you say what you think will happen. Then you let the weeks pass, as fast or as slowly as you like, and compare. Every surprise comes with the loop that caused it, drawn as a small causal loop diagram.

**Claims we may make** (tagline, rules, catalogue):

- "Practise thinking in systems: feedback loops, delays, tipping points and side effects."
- "Practise predicting before you look, and comparing your prediction with the result."
- "Explore a simplified model of a pond and a meadow; see why a quick fix can backfire."

**Claims we never make:** "improves your brain/IQ", "teaches ecology", or that the model predicts real ponds. The rules text says, and every review footer repeats in one line: *"This is a simplified model. It shows the kind of behaviour real ponds and meadows can show, not what a particular pond will do. Numbers are model units, weeks are model weeks."*

---

## 4. Modelling and content principles (binding)

1. **Standard mechanisms only.** Every rule in the model is a textbook mechanism with a citation (Appendix D): logistic/space-limited growth, Monod nutrient limitation, Holling type II feeding, Lotka–Volterra/Rosenzweig–MacArthur predator–prey coupling, NPZD-style nutrient recycling with detritus, quadratic ("crowding") mortality, light shading, nitrogen fixation inhibited by soil nitrogen, prey refuges. No invented "magic" interactions.
2. **Behaviour, not numbers, is claimed.** Parameters are chosen so the model shows documented *qualitative* behaviour (trophic cascades, the paradox of enrichment, clear/turbid regime shifts, pest resurgence after spraying, delayed collapse). They are not fitted to field data, and the game never states a parameter as a real-world fact.
3. **Explanations say what the model leaves out.** Each challenge's explanation ends with one "In real ponds/meadows, also…" sentence (e.g. seasons, oxygen, many more species).
4. **Neutral, non-graphic.** Animals eat and die as numbers and as fewer glyphs; no blood, no death animations. Spraying, fishing, relocating rabbits and releasing foxes are described neutrally as management actions. No pest-control product names.
5. **No pressure.** Time advances only on the player's command. No timers, no real-time play, no streaks, no points tallies, no rewards. Goals can be rewound without limit.
6. **Own content.** Story lines, challenge texts, diagrams and art are written and drawn for the project. Published papers are cited for mechanisms only; no text, figure or data set is copied.

---

## 5. Core loop and modes

**Core loop (one challenge):** read the situation → see the pond/meadow and its recent history → a change happens (or you make it) → predict → let time run (1, 4, 26 weeks or "until it settles") → compare prediction and result → read the loop that explains it → next.

| Mode (`mode` setting) | Shown name (en) | One game |
|---|---|---|
| `predict` (default) | **Predict** | A round of **4 challenges** (§ 10.1), alternating pond and meadow. For each: a change happens, you predict, the model runs, you compare, the loop is explained. Then a calm round summary and `finished({ outcome: 'completed' })`. |
| `goal` | **Goals** | One **goal** (§ 10.2, chosen on the start screen): reach a target state with a few interventions before a deadline (e.g. "keep the pondweed alive for two years while the runoff continues"). Unlimited rewind. `finished({ outcome: 'won' })` when reached, `'completed'` after "Show me a way". |
| `explore` | **Explore** | A free notebook (sandbox) of one habitat: add and remove species, change light, runoff, water flow, rain or fertiliser, mow, spray, dredge; run as long as you like; compare with "without my last change"; view the food web. No natural end (no `finished()`); the host's "New game" starts a new notebook. |

Why 4 challenges per round: a challenge takes 2–4 minutes (reading, predicting, reviewing), so a round fits 8–16 minutes; four is enough for a summary remark, and alternating habitats shows that the same loops appear in different clothing.

### 5.1 Time and controls

- **Time unit:** one model *week* = 7 model days (the engine's integer substep is a day, § 7). The clock shows "Week 12".
- **Run controls:** "1 week", "4 weeks", "26 weeks", "Until it settles". In predict mode the run is fixed (the challenge's horizon, one press "Run 26 weeks"), after the prediction was committed or skipped.
- **"Until it settles"**: runs at most 156 weeks; stops at the first week *w* ≥ current + 8 where, for the last 8 weeks, every present species changed by at most max(1 % of its value, 200 u) per week; the status line then says "Settled after 37 weeks." Otherwise "Still changing after 156 weeks — it may keep swinging." Pure function of the state (§ 7.9).
- **Drawing the run** is cosmetic: the chart reveals the new weeks over at most 600 ms (`requestAnimationFrame`; instant with `reducedMotion`). The state already holds the result; closing the page mid-animation loses nothing.

### 5.2 Avoiding the "school test" feeling

- The frame is a **field notebook**: paper-card look, "Challenge 2 of 4", a short situation in plain words, "What will happen?".
- Predictions are hunches. Every question has **"Skip — just show me"** (not scored, not counted in the summary).
- Feedback is words plus symbols (●●● "Just like the model", ●●○ "Close", ●○○ "Partly", ○○○ "The model went another way"). Never red crosses or "wrong". Surprises are framed as the point: "This one surprises most people — here is the loop."
- **"Think about…"** (`<details>`, closed): a hint that names the stocks to watch without giving the answer ("Who eats the algae? What happens to them if the algae disappear?").

---

## 6. Settings (start screen) and `settingsOf`

```ts
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: ['predict', 'goal', 'explore'], default: 'predict', display: 'radio', hintKey: 'mode.hint' },
  { kind: 'choice', id: 'goal', labelKey: 'goal.label', valueKey: 'goal', values: GOAL_IDS, default: 'save-pondweed', display: 'radio', when: { mode: ['goal'] } },
  { kind: 'choice', id: 'habitat', labelKey: 'habitat.label', valueKey: 'habitat', values: ['pond', 'meadow'], default: 'pond', display: 'radio', when: { mode: ['explore'] } },
  { kind: 'choice', id: 'start', labelKey: 'start.label', valueKey: 'start', values: ['lively', 'simple', 'bare'], default: 'lively', display: 'radio', hintKey: 'start.hint', when: { mode: ['explore'] } },
  { kind: 'toggle', id: 'weather', labelKey: 'weather.label', default: false, hintKey: 'weather.hint', when: { mode: ['explore'] } },
  { kind: 'difficulty', default: 'medium', when: { mode: ['predict', 'goal'] } }
];
```

- `GOAL_IDS = ['save-pondweed', 'clear-pond', 'protect-flowers', 'bring-back-clover']` (≤ 4 → radio).
- Difficulty labels: easy "Easy — choose higher, same or lower; the loops are shown first", medium "Medium — choose the shape of the curve", hard "Hard — sketch the curve". In goal mode the same three mean: easy = unlimited interventions and the hint diagram, medium = at most 6 interventions, hard = at most 4 interventions and no hint (§ 10.2).
- `weather` (explore only): "Changeable weather — light and rain vary from week to week (from the game's seed)".
- `settingsOf(state)`: `{ mode, difficulty }` plus `goal` (goal mode) or `habitat`, `start`, `weather` (explore). The contract's "Another round with `settingsOf`" check holds because a new round is fully determined by seed + settings.
- `newGame` treats `settings` as untrusted (defaults for anything missing or invalid). `begin` is irrelevant (no intro screen).
- Display preferences that stay in the game (`context.preferences`): chart style (small multiples / one shared chart), "show numbers in the scene". Not settings.

---

## 7. The simulation model (pure, `src/model.ts`)

### 7.1 Units and numbers

- **Amounts** are integers in **u** ("nutrient units"): every living thing is counted by the nutrient it holds, as in nitrogen-based plankton models (Fasham et al. 1990). Displayed as `round(u / 1000)` ("58"), labelled "model units".
- **Water** (meadow only) is a separate integer stock in **w** units.
- **Rates** are integers in **ppm per day** (parts per million of the stock per model day). **Fractions and preferences** are integers in **‰**.
- **All arithmetic is integer**: `+`, `−`, `*` on integers below 2⁵³ and the exact floor division `idiv` (§ 7.8). No `Math.exp/log/pow/sin` and **no `**` operator** (ECMAScript leaves exponentiation implementation-approximated; squares are written `x * x`), no floats in the state. Bounds (§ 7.8) guarantee every intermediate product stays below 2⁵³, so results are bit-identical in every engine and a save replays identically.

### 7.2 State of one simulation (`Sim`, plain JSON)

```ts
interface Sim {
  week: number;              // weeks run since the notebook/challenge start, 0..520
  n: number;                 // dissolved/soil nutrients, u
  d: number;                 // dead matter (detritus, litter), u
  w: number;                 // soil water, w (0 in the pond)
  b: number[];               // adult amount per species, habitat order (§ 8), u
  j: number[][];             // juveniles per species with a maturation delay: ring of `delay` weekly slots, u ([] otherwise)
  imp: number; exp: number;  // nutrients imported / exported since start, u (mass-balance bookkeeping)
  wimp: number; wexp: number;// water in / out since start, w
  cond: number[];            // current condition levels (indices, § 8.3)
}
```

`pop(i) = b[i] + Σ j[i]` is what the chart and the scene show.

### 7.3 Conservation invariants (tested, § 19)

- **Nutrient balance:** `n + d + Σ b + Σ Σ j  =  N₀ + imp − exp` exactly, after every day and every action.
- **Water balance (meadow):** `w = W₀ + wimp − wexp` exactly.
- **Non-negativity:** every stock ≥ 0 after every day (guaranteed by the flux limiter, § 7.5).

### 7.4 One day (`stepDay`): flows computed from the start-of-day snapshot

All flows of a day are computed from the values at the start of the day, then limited per source (§ 7.5), then applied together. Notation: `pm(r, x) = idiv(r·x, 10⁶)`, `sat(x, k) = idiv(1000·x, k + x)` (‰; 0 if `k + x = 0`), `hill(x, k) = idiv(1000·q(x)², q(k)² + q(x)²)` with `q(v) = idiv(v, 1000)` (‰; 0 if both are 0), `L` = light level ‰ (§ 8.3) × weekly weather factor ‰ / 1000.

1. **Producers** (algae, plants), for each present producer *p* with amount `B`:
   - shade `S = Σ_s idiv(c_{s,p} · b_s, 1000)` over the species that shade *p* (`shadedBy`, coefficients ‰; may include *p* itself);
   - light factor `ℓ = min(1300, ℓ₀)` with `ℓ₀ = idiv(L · kL, kL + S)` (Monod) or, for species marked *Hill* in § 8 (pondweed, wildflowers, clover: a steep, threshold-like light response), `ℓ₀ = idiv(L · hill(kL, S), 1000)` where `hill(kL, S) = idiv(1000 · q(kL)·q(kL), q(kL)·q(kL) + q(S)·q(S))`;
   - growth rate `r = μ`; then `r = idiv(r · kI, kI + b_inh)` for each inhibitor (`inhibitedBy`: algae by pondweed); `r = idiv(r · ℓ, 1000)`; if the species uses space group *g*: `r = idiv(r · crowd_g, 1000)` with `crowd_g = max(0, 1000 − idiv(1000 · Σ_{q∈g} b_q, K_g))`; meadow: `r = idiv(r · water, 1000)` with `water = idiv(1000·q(w)², q(kW)² + q(w)²)` (steep: plants barely notice water until the soil dries);
   - nitrogen fixation (clover): `rFix = idiv(idiv(r · fix, 1000) · kFix, kFix + n)` (fixation is switched down by soil nitrogen);
   - soil uptake: `r_N = idiv(r · sat(n, kN), 1000)`; flow **n → b_p** of `pm(r_N, B)`; fixation flow **import → b_p** of `pm(rFix, B)`;
   - meadow transpiration: flow **w → out(water)** of `idiv((uptake + fixation) · water_p, 1000)`.
2. **Consumers** (animals; decomposers eat dead matter *d*), for each present consumer *c* with amount `C`:
   - for each food *j* with preference `π_j` ‰: available `x_j = d` for dead matter, else `max(0, b_j − hide_j)` (`hide`: a constant amount of prey that is always out of reach — Daphnia in the mud, snails under stones, rabbits in burrows); weighted `ω_j = idiv(π_j · x_j, 1000)`; with a refuge (`refuge`: water fleas hidden in pondweed from fish) `ω_j = idiv(ω_j · kR, kR + b_refuge)`;
   - `Ω = Σ ω_j`; if `Ω = 0` nothing is eaten;
   - Holling type II intake rate `g' = idiv(g · Ω, k + Ω)` ppm/day; total demand `Q = pm(g', C)`;
   - demand on food *j*: `q_j = idiv(Q · ω_j, Ω)`; flow **b_j (or d) → eaten_c** of `q_j`.
3. **Losses of every present species** *i* (amount `B`): respiration/excretion flow **b_i → n** of `pm(resp_i, B)`; death flow **b_i → d** of `pm(mort_i, B) + idiv(pm(m2_i, B) · B, 10⁶)` (linear plus quadratic "crowding" mortality, Steele & Henderson 1992); pond outflow for suspended species (`suspended`: algae, blue-green algae, water fleas) **b_i → out** of `pm(flow, B)`.
4. **Pools:** decomposition **d → n** of `pm(decay, d)`; burial in sediment **d → out** of `pm(burial, d)` (pond); outflow of dissolved nutrients **n → out** of `pm(flow, n)` (pond); leaching **n → out** of `pm(leach, n)` (meadow); evaporation **w → out(water)** of `pm(evap, w)` (meadow).
5. **Limit** every source (§ 7.5), then route what was eaten: for consumer *c*, `E = Σ` limited `q_j`; assimilated `A = idiv(E · assim_c, 1000)` goes to `b_c` (or, for species with a maturation delay, to the juvenile slot `j_c[week mod delay]`); the rest `E − A` (faeces) goes to **d**.
6. **Inputs:** runoff/fertiliser/deposition **import → n** of `idiv(input · weatherInput, 1000)` (§ 8.3; the input weather factor is always 1000 in v1); meadow rain **import(water) → w** of `idiv(rain · weatherRain, 1000)`.
7. **Apply** all deltas. Meadow: if `w > wMax`, the excess runs off (`wexp += w − wMax; w = wMax`).
8. **Local extinction:** for each species with `0 < b_i` and `pop(i) < min_i` (`min` = 100 or 200 u): move `b_i` to **d**, set `b_i = 0` (juveniles, if any, stay and may still mature). This is the model's answer to the "atto-fox" problem of continuous models: a population this small is gone.

### 7.5 Flux limiter (non-negativity with exact conservation)

For every source stock *X* (n, d, w, each b_i) collect its outflows `o₁…o_m` of the day (computed in a fixed order: producers, consumers, losses, pools — habitat species order inside each group). If `Σ o > X`, replace each by `o'_k = idiv(o_k · X, Σ o)`; then `Σ o' ≤ X`. The import source is unlimited. Because every flow is subtracted from exactly one stock and added to exactly one other (or to `imp`/`exp`), conservation is exact, and the floor remainders simply stay in the source.

### 7.6 One week (`stepWeek`)

1. **Arrivals:** every species of the habitat with `arrive > 0` gains `arrive` u (import) at the start of the week, *whether present or not* — propagules and visitors that come on their own (algae cells, duckweed on birds' feet, Daphnia resting eggs, seeds, flying aphids and ladybirds). Fish, pike, snails, pondweed, rabbits, foxes and earthworms never arrive by themselves; the player or a challenge adds them. **Exact semantics (calibrated, keep them):** the local-extinction step (§ 7.4 step 8) runs at the end of *every day*, so an arrival survives only if the species' amount is at least `min` at the end of the first day. In effect, arrivals top up existing populations (a small, steady trickle that keeps a shrinking population from vanishing on paper only), and they re-establish an absent species only where `arrive ≥ min` and it can grow (water fleas, `arrive = min = 100`). Species with `arrive < min` (algae, blue-green algae, duckweed, plants, aphids, ladybirds) do not return once gone; the player can add them. Without arrivals, every temporary crash became permanent in the prototype (Appendix B.4); with arrivals ≥ `min` for all species, the lively pond lost its delayed tipping point (under high runoff the pondweed collapsed by week 35 instead of ≈ 60 and no longer "looked fine" in week 20), so the values of § 8 are part of the calibration.
2. **Weather factors** (only with `weather: true` in explore; otherwise 1000): `wf(seed, week, stream) = 700 + (h mod 601)`, where `h` is the mulberry32 output of `(seed ^ imul(week+1, 0x9E3779B1) ^ imul(stream+1, 0x85EBCA6B)) >>> 0` (integer only). Stream 0 = light, 1 = rain. Common random numbers: the weather of week *w* never depends on what the player did.
3. **Seven days** (`stepDay` × 7).
4. **Maturation:** for each species with a delay *D*, the slot `(week + 1) mod D` (filled *D* weeks earlier) is added to `b` and cleared. Assimilation during week *t* matures at the end of week *t + D − 1*. `D ≥ 2` (validated).
5. `week += 1`; record the sample (§ 7.9).

### 7.7 Interventions (`applyAction`, between weeks)

Applied at the current week before running on; each is one entry in the action log (§ 14). Amount changes on adults and juveniles alike (`frac` of each slot, floored).

| Action | Effect (exact) | Pond / meadow |
|---|---|---|
| `add` species | `b += intro` (species table), import; creates the juvenile ring if needed | both |
| `remove` species, `share ∈ {50, 90, 100}` % | `share`% of `b` and of each juvenile slot → **export** (fishing, netting, weeding out, relocating) | both |
| `treat-algae` | 90 % of algae and blue-green algae → **d** (the dead algae stay in the water) | pond |
| `net-algae` | 80 % of algae, blue-green algae and duckweed → **export** | pond |
| `dredge` | 75 % of **d** → export (dredging the mud) | pond |
| `spray` | 90 % of aphids and ladybirds → **d** | meadow |
| `mow` (`cuttings: 'remove' \| 'leave'`) | 70 % of grass, wildflowers and clover → export (hay) or → **d** (mulch) | meadow |
| `set` condition, level | `cond[k] = level` (persists until changed) | both |

### 7.8 Exact integer division and bounds

```ts
/** ⌊a / b⌋ for integers 0 ≤ a < 2^53, 0 < b < 2^53; exact (corrects the rare double-rounding of a / b). */
export function idiv(a: number, b: number): number {
  let q = Math.floor(a / b);
  if (q * b > a) q -= 1;
  else if ((q + 1) * b <= a) q += 1;
  return q;
}
```

Bounds, validated in `isValidState` and kept by construction: every stock ≤ `MAX_AMOUNT = 20,000,000` u (presets ≤ 3 M; inputs ≤ 1,500 u/day × 7 × 520 weeks ≈ 5.5 M; additions ≤ 300 actions × 20,000 u = 6 M); rates ≤ 10⁶ ppm; preferences, coefficients ≤ 3,000 ‰. The largest product is `Q · ω_j ≤ 2·10⁷ · 6·10⁷ = 1.2·10¹⁵ < 2⁵³ ≈ 9.007·10¹⁵`; `hill` squares work in thousands (`q(v)²` ≤ 4·10⁹). A unit test asserts the bound analysis with the extreme values (§ 19.1).

### 7.9 Running, samples and "settled" (pure)

- `simulate(start: Sim, hab, log: Action[], toWeek, seed): { sim: Sim; samples: number[][] }` replays the log from `start`: before each week *w*, apply every action with `week === w` in log order; then `stepWeek`. `samples[w]` = `[pop(0…S−1), n, d, w]` after week *w* (`samples[0]` = the start, taken before any action of week 0).
- **Pre-intervention value:** for a challenge question, `v₀` is the asked species' amount *before* the challenge's scripted action (the chart shows 8 weeks of steady history before week 0, taken from the preset's spin-up tail, § 9).
- `settledAt(samples, from)`: the rule of § 5.1, integer only (`|v_w − v_{w−1}| · 100 ≤ max(v_w, 20,000)` for all present species in 8 consecutive weeks).

---

## 8. Species, habitats and conditions (`src/species.ts`, `src/habitats.ts`)

### 8.1 Pond (8 species; habitat order = this table; parameters calibrated 2026-10-27, Appendix B)

Rates ppm/day, half-saturations and amounts u, fractions ‰. "—" = not used.

| # | id (shown name en / de) | Glyph (§ 13) | Kind | μ or g | kN / k | Light (kL; shaded by ‰) | Other | resp | mort | m2 | delay | hide | arrive | intro | min |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | `algae` Green algae / Grünalgen | cloud of dots | producer, suspended | 800,000 | 20,000 | 600,000; algae 300, blue-green 500, duckweed 1,500 | inhibited by pondweed (kI 600,000) | 50,000 | 50,000 | — | — | — | 100 | 5,000 | 200 |
| 1 | `bluegreen` Blue-green algae / Blaualgen | short chains | producer, suspended | 500,000 | 300,000 | 900,000; duckweed 1,500 | — | 30,000 | 30,000 | — | — | — | 100 | 5,000 | 200 |
| 2 | `duckweed` Duckweed / Wasserlinsen | floating ovals | producer | 300,000 | 250,000 | none | space `surface` (K 300,000) | 20,000 | 25,000 | — | — | — | 100 | 5,000 | 200 |
| 3 | `pondweed` Pondweed / Laichkraut | wavy stems | producer | 140,000 | 8,000 | 145,000 (Hill); algae 1,000, blue-green 1,500, duckweed 3,000 | space `bottom` (K 450,000) | 10,000 | 15,000 | — | — | — | — | 20,000 | 200 |
| 4 | `fleas` Water fleas / Wasserflöhe | teardrop with antenna | consumer, suspended | 1,000,000 | 150,000 | — | eats algae 1,000, blue-green 100; assim 400 | 50,000 | 50,000 | 300,000 | — | 5,000 | 100 | 5,000 | 100 |
| 5 | `snails` Pond snails / Schlammschnecken | spiral shell | consumer | 150,000 | 60,000 | — | eats dead matter 1,000, algae 200; assim 300 | 15,000 | 8,000 | 100,000 | — | 8,000 | — | 5,000 | 100 |
| 6 | `minnows` Small fish / Kleinfische | small fish | consumer | 130,000 | 45,000 | — | eats water fleas 1,000 (refuge in pondweed, kR 20,000), snails 200, dead matter 20; assim 350 | 5,000 | 2,000 | 200,000 | 6 | — | — | 20,000 | 100 |
| 7 | `pike` Pike / Hecht | long striped fish | consumer | 90,000 | 30,000 | — | eats small fish 1,000; assim 300 | 4,000 | 1,000 | 200,000 | 20 | — | — | 5,000 | 100 |

Pond pools: `decay` 150,000 (dead algae and leaves break down within days to weeks in warm water), `burial` 300 (a little dead matter is buried in the sediment for good). Space groups: `surface` 300,000, `bottom` 450,000.

### 8.2 Meadow (8 species)

| # | id (en / de) | Glyph | Kind | μ or g | kN / k | Light (kL; shaded by ‰) | Other | resp | mort | m2 | delay | hide | arrive | intro | min |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | `grass` Grasses / Gräser | blades | producer | 100,000 | 50,000 | none (tallest) | space `ground` (K 600,000); kW 60,000; water use 100 | 8,000 | 12,000 | 200,000 | — | — | 100 | 5,000 | 200 |
| 1 | `flowers` Wildflowers / Wildblumen | five-petal disc | producer | 90,000 | 5,000 | 400,000 (Hill); grass 1,000 | ground; kW 50,000; water 100 | 6,000 | 10,000 | 60,000 | — | — | 100 | 5,000 | 200 |
| 2 | `clover` Clover / Klee | trefoil | producer, N-fixer | 70,000 | 30,000 | 150,000 (Hill); grass 1,000 | ground; kW 60,000; water 100; fix 800, kFix 30,000 | 6,000 | 10,000 | 30,000 | — | — | 100 | 5,000 | 200 |
| 3 | `aphids` Aphids / Blattläuse | small oval on a stem | consumer | 400,000 | 60,000 | — | eats wildflowers 1,000, clover 500, grasses 100; assim 400 | 60,000 | 30,000 | 300,000 | — | 2,000 | 50 | 2,000 | 100 |
| 4 | `ladybirds` Ladybirds / Marienkäfer | dome with spots | consumer | 700,000 | 40,000 | — | eats aphids 1,000; assim 350 | 30,000 | 20,000 | 1,000,000 | 3 | — | 20 | 3,000 | 100 |
| 5 | `rabbits` Rabbits / Kaninchen | rounded body, long ears | consumer | 60,000 | 60,000 | — | eats clover 1,000, wildflowers 700, grasses 400; assim 300 | 6,000 | 2,000 | 10,000 | 5 | 3,000 | — | 5,000 | 100 |
| 6 | `foxes` Foxes / Füchse | pointed ears, bushy tail | consumer | 90,000 | 15,000 | — | eats rabbits 1,000; assim 300 | 2,000 | 1,000 | 600,000 | 26 | — | — | 2,000 | 100 |
| 7 | `worms` Earthworms / Regenwürmer | wavy line in the soil | consumer (decomposer) | 100,000 | 80,000 | — | eats dead matter 1,000; assim 250 | 12,000 | 4,000 | 100,000 | — | — | — | 10,000 | 100 |

Meadow pools: `decay` 3,000 (litter breaks down slowly without soil animals), `leach` 4,000 (soil nutrients wash out with drainage water), deposition 80 u/day always (nitrogen from the air), `evap` 20,000, `wMax` 200,000. Space group `ground` 600,000.

16 species in total (≥ 12 required). Every species has a short "about" line in the content (what it eats, who eats it, what it does in the model), shown in the legend and the food web.

### 8.3 Conditions (`cond` levels; the first listed is the habitat default)

| Habitat | Condition | Levels (shown name → model value) |
|---|---|---|
| Pond | Light | full sun → 1,000 ‰ · partly shaded → 750 · shaded → 500 |
| Pond | Runoff (nutrients flowing in) | none → 0 u/day · low → 100 · medium → 300 · high → 600 · heavy → 1,500 |
| Pond | Water flow | still → 0 ppm/day · trickle → 5,000 · stream → 20,000 |
| Meadow | Rain | normal → 4,000 w/day · dry → 500 · wet → 6,000 |
| Meadow | Fertiliser | none → input 80 u/day (deposition only) · some → 300 · lots → 600 |

Explore offers every condition; challenges and goals offer the tools listed in § 10.

### 8.4 Why these mechanisms (one line each; references in Appendix D)

- Nutrient-limited growth (Monod) with a closed cycle through dead matter → **carrying capacity emerges from the nutrient budget**; enrichment raises it.
- Holling II grazing and predation, Rosenzweig–MacArthur coupling → **balancing loops, overshoot, predator–prey swings**, and the **paradox of enrichment** (more food can destabilise).
- Pondweed: steep light response (Hill), shaded by algae, suppresses algae, shelters water fleas from fish → a **reinforcing loop** between clear water and plants: **tipping points and hysteresis** in shallow lakes (Scheffer et al. 1993).
- Duckweed covers the surface at high nutrients and shades everything below (Scheffer et al. 2003).
- Blue-green algae: slow, poorly grazed, need rich water → **blooms after enrichment**.
- Maturation delays (fish 6, pike 20, ladybirds 3, rabbits 5, foxes 26 weeks) → **delays** in balancing loops (Gurney et al. 1980 style).
- Clover fixes nitrogen, less so on rich soil (Streeter 1988) → **facilitation** of neighbours through dead leaves (a delayed path).
- Grasses outgrow wildflowers on rich soil (light competition) → **fertilising the meadow costs clover and flowers** (Stevens et al. 2004).
- Spraying kills predator and prey → prey rebounds first → **pest resurgence**, Volterra's principle (Hardin et al. 1995).
- Earthworms speed decomposition (Edwards & Bohlen 1996) → removing them **locks nutrients in dead matter**.
- Prey refuges (`hide`) and quadratic mortality are standard stabilisers that keep small populations from vanishing on paper only.

---

## 9. Presets (`src/presets.ts`, generated data, never edited by hand)

A preset is a `Sim` snapshot (week 0) plus the 8 weekly samples before it (the "history" shown left of week 0). It is produced by `spinUp(rough start, conditions, 520 weeks)` and stored, so a challenge starts instantly from a near-steady state. `test/presets.slow.test.ts` recomputes every preset and fails with a ready-to-paste table if the stored data differ (`UPDATE_PRESETS=1` prints it). Rough starts (u):

| Preset | Habitat, conditions | Rough start → spun-up result (Appendix B) |
|---|---|---|
| `pond.lively` | pond, defaults | n 20,000, rest of 500,000 as d; algae 40,000, blue-green 1,000, duckweed 1,000, pondweed 250,000, water fleas 30,000, snails 15,000, small fish 30,000 → clear pond: pondweed 327, algae 58, water fleas 37, snails 42, small fish 10 (thousand u) |
| `pond.young` | pond | total 400,000; algae 60,000 → algae 250 (no grazers) |
| `pond.plankton` | pond | total 400,000; algae 60,000, water fleas 30,000 → algae 66, water fleas 75 |
| `pond.openfish` | pond | total 500,000; algae 60,000, water fleas 30,000, small fish 30,000 → algae 140, water fleas 33, small fish 98 |
| `pond.green` | = `pond.lively` + 104 weeks with runoff high | algae 151, blue-green 26, duckweed 87, pondweed 0, water fleas 99, snails 56, small fish 199 |
| `pond.bare` | pond (no spin-up) | n 30,000, d 100,000; green algae 5,000 only — "a new pond": add the rest yourself (water fleas also arrive on their own) |
| `meadow.lively` | meadow, defaults | n 20,000, d 150,000, w 150,000; grasses 100,000, wildflowers 80,000, clover 40,000, aphids 5,000, ladybirds 2,000, rabbits 15,000, foxes 2,000, earthworms 15,000 → grasses 68, wildflowers 106, clover 41, aphids 12, ladybirds 3, rabbits 8, foxes 3, earthworms 80 |
| `meadow.poor` | meadow, input 20 | grasses 60,000, wildflowers 60,000, earthworms 10,000 → wildflowers 92, grasses 1, earthworms 39 |
| `meadow.nofox` | = `meadow.lively`, foxes removed, + 156 weeks | rabbits 100, clover 1, wildflowers 70, grasses 67 |
| `meadow.bare` | meadow (no spin-up) | n 20,000, d 150,000, w 150,000; grasses, wildflowers and clover 5,000 each, no animals |

Explore `start` setting: `lively` → `*.lively`; `simple` → `pond.plankton` / `meadow.poor`; `bare` → `*.bare`.

---

## 10. Challenges (`src/challenges.ts` data; texts in `content/<locale>.ts`)

### 10.1 Prediction challenges (16)

A challenge = preset + scripted action(s) at week 0 (and possibly later) + horizon *H* + questions per difficulty + causal loop diagram (§ 12.2) + explanation. Question kinds (§ 11):

- `level` (3 options): "In week *t*, compared with just before the change, *species* will be: **lower / about the same / higher**."
- `shape` (3 or 4 options, each with a small sparkline and a name): from the classes of § 11.1.
- `sketch` (hard): drag 6 handles; the derived shape is compared too.

Easy uses the easy question and shows the diagram *before* predicting; medium and hard show it after. Where a challenge has two questions at a level, the round's seed picks one.

| # | id | Situation (en, short) | Preset → change | H | Easy | Medium (options; ✓ = model) | Hard |
|---|---|---|---|---|---|---|---|
| 1 | `fleas-arrive` | Water fleas reach a pond that has only algae. | young → add water fleas 5,000 | 26 | algae, week 26 → lower | algae: falls ✓, rises, steady, keeps swinging | sketch algae |
| 2 | `enrich-swings` | Heavy runoff starts to feed a pond of algae and water fleas. | plankton → runoff heavy | 78 | water fleas: settles higher / keeps swinging ✓ / dies out | water fleas: rises, rises then falls, swings that fade, keeps swinging ✓ | sketch water fleas |
| 3 | `fish-stocked` | Someone releases small fish into a fishless pond. | plankton → add small fish 20,000 | 52 | algae, week 52 → higher | algae: rises ✓, falls, steady, falls then recovers · *or* water fleas: falls ✓, … | sketch algae |
| 4 | `pike-return` | A few young pike are released into a pond full of small fish. | openfish → add pike 5,000 | 104 | algae, week 104 → lower | algae: falls ✓, rises, steady, rises then falls · *or* water fleas: rises ✓ | sketch algae |
| 5 | `algae-treatment` | The green water is treated: 90 % of the algae die (and stay in the water). | lively → treat-algae | 16 | algae, week 3 → higher | algae, week 3 → higher (level) | sketch algae |
| 6 | `slow-runoff` | A new field upstream drains into the clear pond. | lively → runoff high | 104 | pondweed, week 104 → lower | pondweed: disappears ✓, falls (●●○), steady, keeps swinging | sketch pondweed |
| 7 | `no-way-back` | Two years later the runoff is stopped completely. Will the pondweed come back? | green → runoff none | 104 | pondweed: comes back / stays gone ✓ / comes back, then fades | same 3 + keeps swinging | as medium |
| 8 | `shade` | A tree grows over the pond and shades it. | lively → light shaded | 52 | pondweed, week 52 → lower | pondweed: falls ✓, steady, rises, falls then recovers | sketch pondweed |
| 9 | `spray` | The meadow is sprayed against aphids: 90 % of aphids *and* ladybirds die. | meadow.lively → spray | 26 | aphids, week 16 → higher · *or* wildflowers, week 26 → lower | aphids, week 16 → higher (level) | sketch aphids |
| 10 | `no-foxes` | The foxes leave the meadow. | lively → remove foxes 100 % | 104 | rabbits, week 104 → higher · *or* clover → lower | rabbits: rises ✓, rises then falls, steady, keeps swinging | sketch rabbits |
| 11 | `fertilise` | The farmer spreads some fertiliser every week. | lively → fertiliser some | 104 | clover, week 104 → lower | clover: falls ✓, rises, steady, falls then recovers | sketch clover |
| 12 | `drought` | Twelve dry weeks, then normal rain again. | lively → rain dry; week 12: rain normal | 52 | grasses, week 13 → lower | grasses: falls then recovers ✓, falls, steady, rises then falls | sketch grasses |
| 13 | `clover-poor` | Clover is sown into a poor meadow of wildflowers. | poor → add clover 5,000 | 104 | wildflowers, week 104 → higher | wildflowers: rises ✓, falls, steady, rises then falls | sketch wildflowers |
| 14 | `worms-gone` | The earthworms disappear from the meadow. | lively → remove earthworms 100 % | 104 | clover, week 104 → higher | grasses: falls ✓, steady, rises, falls then recovers | sketch grasses |
| 15 | `foxes-return` | Foxes return to a meadow overrun by rabbits. | nofox → add foxes 2,000 | 156 | clover, week 156 → higher | clover: rises ✓, falls, steady, rises then falls · *or* rabbits: falls ✓ | sketch rabbits |
| 16 | `ladybirds-gone` | Most ladybirds are collected for a garden elsewhere. | lively → remove ladybirds 90 % | 26 | aphids, week 8 → higher | aphids: rises then falls ✓, rises, steady, falls | sketch aphids |

**Round draw (pure, seeded):** `rng = createRng(seed)`; shuffle the 8 pond and the 8 meadow challenges separately (sorted ids, then shuffle); take pond, meadow, pond, meadow (the first habitat from `rng.int(0, 1)`). Each item gets its question by `rng` among the questions of its difficulty. A round never repeats a challenge; across rounds there is no memory (16 challenges × up to 2 questions × 3 difficulties).

**Explanations** (content, en drafts; ≤ 4 sentences + the "In real ponds…" line), e.g.:

- *fleas-arrive*: "Water fleas multiply on the algae until they eat as fast as the algae grow. From then on the fleas, not the nutrients, set how much algae there is — a balancing loop (B1). In real ponds, fish and seasons usually keep this from being so neat."
- *slow-runoff*: "For months nothing seems to happen — the pondweed even looks fine in week 20. Meanwhile nutrients pile up in the water and the mud. When the algae finally win, a reinforcing loop takes over: more algae, more shade, less pondweed, fewer hiding places for water fleas, even more algae (R1). The flip is fast; the cause was slow."
- *spray*: "Spraying killed the aphids *and* the ladybirds that eat them. Aphids multiply much faster than ladybirds, so they came back first, with no one to stop them — and the flowers paid for it. Ecologists call this pest resurgence (B1 with a delay)."
- *worms-gone*: "Without earthworms, dead leaves pile up and their nutrients stay locked in. The grasses go hungry. Clover makes its own nitrogen, so it gains — a side effect few people expect."

### 10.2 Goals (4)

A goal = preset + continuing conditions + allowed tools + target + deadline + reference plans (tested) + known non-solutions (tested) + hint diagram. Interventions (`set`, `add`, `remove` …) count towards the budget (easy unlimited, medium 6, hard 4). **Rewind** ("Undo my last change", or tap an earlier change on the chart to return there) is always allowed and refunds the count.

| Goal | Start | Target and deadline | Tools | Reference plans (Appendix B) | Tested non-solutions |
|---|---|---|---|---|---|
| `save-pondweed` "Keep the pondweed" | `pond.lively`, runoff **high** from week 0 (a new field upstream) | pondweed ≥ 100,000 every week through week 104 | runoff: buffer strip (→ low) or ditch closed (→ none); net algae; dredge; remove small fish; add pike; water flow | buffer strip (runoff → low) at week ≤ 10 · runoff → none at week ≤ 10 · net algae every 10 weeks | doing nothing; buffer strip at week 20 (pondweed still looks fine, but it is too late); water flow (stream) for 10 weeks |
| `clear-pond` "Clear water again" | `pond.green`, runoff high continues | algae + blue-green ≤ 80,000 **and** pondweed ≥ 50,000 for 12 consecutive weeks, by week 156 | runoff → none; dredge; plant pondweed (add 20,000); remove small fish; add pike; treat algae; net algae; water flow | runoff → none + dredge + plant pondweed + remove small fish 90 % (all at week 0) · runoff → none + stream for 20 weeks + plant pondweed at week 20 | doing nothing; treat algae 3 × (weeks 0, 20, 40); plant pondweed only; remove fish + plant with runoff on; runoff → none alone |
| `protect-flowers` "Save the wildflowers" | `meadow.lively` right after a neighbour's spraying (aphids and ladybirds −90 %) | wildflowers ≥ 60,000 every week through week 52 | release ladybirds (add 3,000); spray again; mow (remove/leave) | release ladybirds in week 8–14 | doing nothing; spraying again in week 12; releasing ladybirds in week 0–6 (they starve: no aphids yet) or week ≥ 16 (too late) |
| `bring-back-clover` "Clover for the meadow" | `meadow.nofox` | clover ≥ 20,000 for 8 consecutive weeks, by week 208 (young foxes need 26 weeks to grow up) | release foxes (add 2,000); relocate rabbits (remove 50 / 90 %); sow clover (add 5,000) | foxes alone (reached ≈ week 154) · foxes + rabbits −50 % (≈ 135) · foxes + rabbits −80 % + clover (≈ 115) | doing nothing; relocating rabbits (50 % or 80 %) without foxes; rabbits −80 % + clover without foxes |

- **Fail and success states.** `save-pondweed`/`protect-flowers` fail at the first week below the line: the notebook says "The pondweed fell below the line in week 47." and offers "Undo my last change", "Back to week …" (each logged change is a return point), and "Show me a way". `clear-pond`/`bring-back-clover` fail at the deadline. On success: "Reached in week 53." → review (§ 12.4) → `finished({ outcome: 'won', stats: { week, changes } })`. "Show me a way" replays the first reference plan in the notebook (a ghost line) → review → `finished({ outcome: 'completed' })`.
- **"Does it hold?"** (clear-pond, bring-back-clover): the review runs the player's notebook 104 weeks past the week the goal was reached, without new changes, and says "It held." or "It slipped back 79 weeks later — the cause was still there." (fixes that only flush the pond slip back after 72–79 weeks; Appendix B.2).
- **Hints** (easy only, in the panel from the start; medium/hard behind "Show a hint", not recorded): the goal's loop diagram and one sentence ("Algae are a symptom. What feeds them?").

---

## 11. Prediction scoring and feedback (pure, `src/shape.ts`, `src/score.ts`)

### 11.1 Shape classes (zigzag with a relative threshold)

Input: integer series `v₀ … v_H` (`v₀` = before the change, § 7.9). `ref = max(v)`; if `ref = 0` → `steady`. Threshold `T = max(1, idiv(ref · p, 100))`, `p = 20` (the tests also check 15 and 25, § 19.3).

Legs (zigzag): start at pivot `v₀`, direction 0. For `i = 1…H`: while the direction is 0, a rise ≥ T from the pivot sets direction up, a fall ≥ T sets down; when moving up, track the running maximum; a fall of ≥ T from it closes an up-leg (size = max − pivot) and starts a down-leg from the maximum (symmetrically for down). At the end, an open leg is counted if its size ≥ T.

| Legs | Class (`id`) | Shown name (en) |
|---|---|---|
| `v₀ > 0` and `v_H = 0` | `vanishes` | disappears |
| none | `steady` | stays about the same (or "stays gone" when `v₀ = 0`) |
| up | `rises` | rises |
| down | `falls` | falls |
| up, down | `rise-fall` | rises, then falls |
| down, up | `fall-rise` | falls, then recovers |
| ≥ 3, last leg ≤ ½ first leg | `swings-fade` | swings that fade |
| ≥ 3, otherwise | `swings-last` | keeps swinging |

Families for "close" (●●○): up-first {`rises`, `rise-fall`}, down-first {`falls`, `fall-rise`, `vanishes`}, swings {`swings-fade`, `swings-last`}; `steady` has no family.

### 11.2 Marks

| Question | ●●● | ●●○ | ●○○ | ○○○ |
|---|---|---|---|---|
| `level` (bands on `ρ = v_t / v₀`: lower < 0.85 ≤ about the same ≤ 1.15 < higher; with `v₀ = 0`: higher iff `v_t ≥ 1,000`) | the model's band | — | the neighbouring band (same ↔ lower/higher) | the opposite band |
| `shape` | same class | same family | — | otherwise |
| `sketch` | `e ≤ 120 ‰` | `e ≤ 250 ‰` | `e ≤ 400 ‰` | otherwise |

Sketch error: handles `p₁…p₆` at weeks `t_k = idiv(k·H, 6)`, values on the sketch chart's fixed y scale `0…Y`, where `Y = sketchMax` is stored per challenge question: a round value (1, 2 or 5 × 10ᵏ thousand u) ≥ 1.5 × max(model series, `v₀`) and ≥ 2 × `v₀` (checked by `challenges.slow.test.ts`), so the scale is known before the run and hints only weakly at the answer; `e = idiv(1000 · Σ |p_k − v_{t_k}|, 6 · Y)` ‰ *(calibrate the band limits on the e2e's sample sketches)*. The sketch's own shape (classifier on `[v₀, p₁…p₆]`) is shown next to the model's ("Your sketch: rises, then falls · The pond: rises, then falls ✓").

**Fairness rule (tested, § 19.3):** every question's answer is unambiguous: `level` answers have `ρ ≤ 0.75` or `ρ ≥ 1.25` (or `0.95 ≤ ρ ≤ 1.05` for "about the same"); `shape` answers are the same class for `p` = 15, 20 and 25.

### 11.3 Review content

Verdict line (marks + words) → the chart: model curve (solid), prediction overlay (level band shaded with a hatched pattern, or the sketch as a dashed line with round handles), week *t* marked → "What happened" (one generated sentence from the legs: "Algae fell from 250 to 83 by week 4 and then stayed near 68.") → **the loop diagram** with the explaining loop highlighted → explanation → "In real ponds…" line → "Next".

### 11.4 Round summary (after the 4th review)

"Your predictions this round: ●●● 2 · ●●○ 1 · skipped 1." One remark chosen by rule: if any ○○○ was in a challenge with a delay, "Delays catch most people out: effects that appear weeks later are easy to miss."; else if all ●●●, "You read every loop. Try hard, where you sketch the curve."; else the loop most often met this round ("Balancing loops with a delay came up twice."). The four challenge titles with their marks; "Another round" / "Change settings" come from the host. `finished({ outcome: 'completed', stats: { matched: n●●●, close: n●●○, answered } })` once (`reported` guard).

---

## 12. Explanation visuals

### 12.1 Time-series chart (`src/chart-view.ts`, one SVG, `direction: ltr`)

- **Small multiples** (default): one row per present species (glyph, name, sparkline over the visible weeks, current value), each with its own y scale and a max label; nutrients and dead matter (and water) as thin grey rows at the bottom. The asked species (predict) or the goal species is the **focus chart** above: larger, with y-axis ticks, the goal line (dashed, labelled "goal: 100"), action markers (▼ with a number, listed below), history shaded left of week 0.
- **Shared chart** (preference): all species in one plot on a log₂-like scale (`y = log2(1 + u/1000)`, computed with an integer table, no `Math.log`), lines differ by dash pattern *and* glyph markers every 8 weeks, never colour alone.
- **Ghost** (goal, explore): "Without my last change" (dashed, lighter) = `simulate(start, log minus last action)`; in goal reviews also "If you had done nothing".
- **Cursor:** the chart is focusable (`role="group"`, `aria-roledescription` "chart"); ←/→ move a week cursor, Home/End; a polite live region reads "Week 14: algae 72, water fleas 40 …" (at most 6 species, then "…and 3 more in the table").
- **Text alternative** (§ 16): `<details>` "Show the numbers" with a table (every 4 weeks; all species), and the generated "What happened" sentences per species.

### 12.2 Causal loop diagrams (`src/cld.ts` data and layout, `src/cld-view.ts`)

- **Data per challenge and goal:** nodes (species ids or pools `nutrients`, `dead`, `water`, `light`, `runoff`), edges `{ from, to, sign: '+' | '−', delay?: true }`, loops `{ id: 'R1' | 'B1' …, path: node[], labelKey }`, and an optional highlighted **chain** (open path, e.g. the cascade pike → small fish → water fleas → algae).
- **Layout:** ≤ 7 nodes on a circle (order given in the data, so related nodes sit side by side), edges as gentle arcs with an arrowhead; sign as text "+" / "−" in a small disc next to the arrowhead (and in the accessible name: "more algae → more water fleas"); delays as two short strokes "‖" across the arc and the word "delay" in the description. Loop labels in the middle of their loop: "R1" with a circular arrow and "reinforcing", "B1" with "balancing". The highlighted loop is drawn with a thicker stroke *and* a dash pattern; others are thin. Nodes are rounded rectangles with the species glyph and name. The SVG is LTR and not mirrored in RTL (it is a diagram); labels inside use `<bdi>`.
- **Accessible form:** an ordered list below the SVG: "B1 (balancing): more algae → more water fleas → fewer algae." "R1 (reinforcing, with a delay): …".
- **Honesty check (tested, § 19.1):** (a) each loop's type equals the product of its edge signs (two minus signs make a reinforcing loop); (b) each edge's sign matches the model: at the challenge's start state, raising the source by 10 % (a condition node: one level up) changes the target's net flow over one day (or over `delay + 2` weeks for delay edges) in the stated direction.

Example (`slow-runoff`, R1): runoff →(+) nutrients →(+) algae; algae →(−) pondweed (shade); pondweed →(−) algae (competition, shelter for water fleas). Loop R1 = algae → pondweed → algae (− · − = +, reinforcing).

### 12.3 Food web (explore)

Auto-generated from the habitat's species table: rows by trophic level (producers at the bottom; pools in a band below), arrows from food to eater (thickness by preference: 3 widths), the nutrient cycle as a dashed loop (dead matter → nutrients → producers). Present species solid, absent ones outlined with "not here". Tapping a node opens its "about" line. Same accessible list form ("Water fleas eat: green algae (mostly), blue-green algae (a little). Eaten by: small fish.").

### 12.4 Goal review

Outcome line; the focus chart with the player's run, the "do nothing" ghost and the goal line; the list of changes with weeks; the loop diagram with the loop the plan used highlighted (each reference plan names its loop; the player's plan gets the diagram of the goal with the generic explanation); "Does it hold?" result (§ 10.2); the explanation.

---

## 13. Art direction (code-drawn SVG, calm)

- **Pond scene** (`src/scene-pond.ts`): a cross-section in a 16 : 9 viewBox: sky band, waterline with a soft ripple, water body, muddy bottom. Water tint = cosmetic mix of the theme's water colour with a green proportional to `algae + blue-green` (clamped), *plus* a text badge "Water: clear / cloudy / green" (thresholds 80 / 200 thousand u), so clarity is never colour-only. Duckweed ovals on the surface; pondweed stems rise from the bottom; dots and chains for algae in the water; fleas, snails on the bottom, fish shapes in the water.
- **Meadow scene** (`src/scene-meadow.ts`): sky, a soft hill line, soil band with a moisture texture (density of dots ∝ `w`, plus a "Soil: moist / dry" badge), plants as clusters of blades, five-petal discs, trefoils; aphids on stems, ladybirds, rabbits, a fox; worms in the soil.
- **Glyph counts:** `count_i = min(12, ilog2(1 + pop_i / scale_i))` with an integer `ilog2` and a per-species `scale` (data), so amounts spanning three orders of magnitude stay readable; positions are deterministic (a per-species list of 12 positions from `seedFromString(id)`), so the picture does not jump between weeks. Optional "show numbers in the scene" preference adds a small value tag per species.
- **Palette:** design tokens (`--wp-*`) for ink, panels, focus; a small game palette `--eco-water`, `--eco-algae`, `--eco-soil`, `--eco-plant`, `--eco-animal` with light/dark variants and forced-colours fallbacks (`CanvasText` strokes, no fills). Every species is identified by **shape + name** (legend), never by colour alone.
- **Motion:** none required. Cosmetic: glyphs fade between weeks (≤ 300 ms), the chart reveal (§ 5.1). Off with `reducedMotion`.

---

## 14. State (plain JSON, `stateVersion: 1`) and migration

```ts
type Habitat = 'pond' | 'meadow';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Action {                      // one logged change (≤ 300 per notebook)
  week: number;                         // 0..520, non-decreasing in the log
  kind: 'add' | 'remove' | 'treat-algae' | 'net-algae' | 'dredge' | 'spray' | 'mow' | 'set';
  species?: string;                     // add/remove: a species id of the habitat
  share?: 50 | 90 | 100;                // remove
  cuttings?: 'remove' | 'leave';        // mow
  cond?: number; level?: number;        // set: condition index and level index (§ 8.3)
}

interface Notebook {                    // a running simulation, replayed from start + log (§ 7.9)
  habitat: Habitat;
  start: { preset: PresetId } | { sim: Sim }; // a preset id, or a snapshot ("continue from here", explore)
  log: Action[];
  week: number;                         // weeks run so far (≥ last action week), ≤ 520
  weather: boolean;                     // explore only; seeds the weather from the game's seed
}

type Answer = { kind: 'level'; band: 0 | 1 | 2 } | { kind: 'shape'; option: number } | { kind: 'sketch'; points: number[] /* 6 integers, u */ };

interface PredictItem {
  challenge: ChallengeId; question: number;  // index into the challenge's questions
  draft: Answer | null;                       // the current, uncommitted choice (survives reload)
  answer: Answer | 'skip' | null;             // committed
  marks: 0 | 1 | 2 | 3 | null;                // stored at commit (a later model change never flips a review)
  ran: boolean;                               // the horizon was run (review shown)
}

type EcoState =
  | { v: 1; model: 'eco-1'; mode: 'predict'; seed: number; difficulty: Difficulty; items: PredictItem[]; index: number; reported: boolean }
  | { v: 1; model: 'eco-1'; mode: 'goal'; seed: number; difficulty: Difficulty; goal: GoalId; notebook: Notebook;
      outcome: null | { kind: 'reached' | 'failed' | 'shown'; week: number }; reported: boolean }
  | { v: 1; model: 'eco-1'; mode: 'explore'; seed: number; habitat: Habitat; startPreset: 'lively' | 'simple' | 'bare'; notebook: Notebook };
```

- **Derived, never stored:** the current `Sim`, samples, ghosts, verdicts of goals. The view keeps a cache (append-only while running; recomputed on restore, rewind and undo). Replay cost ≤ 520 weeks (§ 20).
- **Predict items** store only ids, answers and marks; the challenge's simulation is a pure function of the challenge spec. `index = items.length` means summary.
- `isValidState(x)` never throws. It checks: `v`, `model` (a known model id), `mode` and the union shape; ids known; `items.length === 4`, distinct challenges; answers well-formed (bands 0–2, option < options, 6 integer points in `[0, sketchMax]` of the question); `marks` consistent with `answer` (`null` ⇔ not committed or skip); `ran ⇒ answer !== null`; `index ≤ 4`; `reported ⇒ index === 4` (predict) or `outcome !== null` (goal); log length ≤ 300, weeks non-decreasing and ≤ `notebook.week ≤ 520`; actions valid for the habitat and (goal) in the goal's tools; a snapshot `Sim` with integer stocks in `[0, MAX_AMOUNT]`, `b.length` = habitat species, juvenile rings of the right lengths, `cond` levels in range, and **exact nutrient and water balance** (cheap: one sum). Goal budgets are *not* a validity rule (a save from easy stays valid); the view enforces them.
- **Determinism:** predict rounds from `seed`; goals and challenges are seed-free; explore weather from `seed` per week. `reset()` = the same round/goal/notebook from its start (log cleared, `week = 0`).
- **Migration policy:** `stateVersion` stays 1 while changes are additive. **The model id** (`'eco-1'`) names equations + parameters + presets. A recalibration (new id `'eco-2'`) keeps accepting `'eco-1'` saves: predict items keep their stored marks; goal and explore notebooks are replayed with the new model and the view shows one line "The model was refined since you started; this notebook was recalculated." Presets are versioned with the model (`presets['eco-1']` stays while saves may need it — only the ids referenced by saves, ≈ 10 snapshots). An incompatible state change bumps `stateVersion` with `migrateState`; an unmigratable save is reported as corrupt (acceptable: a round is minutes, a notebook can be restarted).
- **End:** predict — "See summary" sets `index = 4`, `finished()` once; goal — on reached/shown, `finished()` once; reopening a finished save shows the review/summary. `pause()` blocks input; no timers exist to stop (animations check `paused`).
- **No answer in the DOM before the review:** in predict mode, the challenge's future samples are not computed until the item is run (the view computes them on "Run"), and no element carries the model answer (view test).

---

## 15. UI layout

### 15.1 Desktop (≥ 48 rem): scene + chart (inline start, ≈ 3/5), notebook panel (inline end, ≈ 2/5, sticky)

```
┌──────────────────────────────────────────────┬─────────────────────────────────┐
│  Week 0 · Pond · Water: clear                 │  Challenge 2 of 4                │
│  ┌──────────────── scene (16:9) ───────────┐ │  A new field upstream drains     │
│  │  ~~~ ○○ duckweed ~~~~~~~~~~~~~~~~~~~~~  │ │  into the clear pond.            │
│  │   ·· ··   ⌒ fish    ⟡ fleas            │ │                                  │
│  │  ⌇ ⌇ pondweed ⌇ ⌇      @ snail         │ │  What will the pondweed do over  │
│  └─────────────────────────────────────────┘ │  the next 104 weeks?             │
│  Focus: Pondweed  ───────────────▏▼1         │  ( ) disappears  ( ) falls       │
│  ┌──────────── focus chart ────────────────┐ │  ( ) stays the same ( ) swings   │
│  │ ░history░│                               │ │  ▸ Think about…                 │
│  └──────────┴──────────────────────────────┘ │  [ Run 104 weeks ]  Skip — just  │
│  ▣ algae      ▁▂▂▂▂  58                       │                     show me      │
│  ⟡ fleas      ▂▂▂▂▂  37    (small multiples)  │  ── after the run ──             │
│  …                                            │  ●●○ Close — it disappeared      │
│  ▸ Show the numbers                           │  [loop diagram R1]  explanation  │
└──────────────────────────────────────────────┴─────────────────────────────────┘
```

Explore and goal: the panel holds tabs **Changes** (tool buttons grouped: species, conditions, actions; each opens a small sheet with the choice and "Apply at week 12"), **Food web** / **Loops** (hint diagram), **Log** (the list of changes, each with "Back to here"); the run controls sit under the chart: [1 week] [4 weeks] [26 weeks] [Until it settles] and the "Without my last change" toggle; goal status box ("Pondweed ≥ 100 until week 104 · now 312 · changes 1 of 4").

### 15.2 Phone (360 px): one column; scene (compact, 16 : 10), focus chart, small multiples; the panel below; a sticky bottom bar

```
┌──────────────────────────────┐
│ Week 26 · Pond · Water: clear │
│ [ scene ]                     │
│ [ focus chart ]               │
│ ▣ algae ▁▂▃ 70 … (rows)       │
│ ─ Challenge 2 of 4 ─          │
│ question / review card        │
├──────────────────────────────┤
│ [Run 104 weeks]  [Skip]       │  ← sticky (predict)
│ [+1] [+4] [+26] [Settle] [⚙]  │  ← sticky (explore/goal; ⚙ = Changes sheet)
└──────────────────────────────┘
```

All targets ≥ 44 × 44 px; no horizontal scroll at 360 px; the sticky bar never covers the focused element (`scroll-padding-block-end`). Sketch handles are 44 px circles; the sketch chart is at least 280 px tall on phones.

---

## 16. Accessibility

- Every control is a native `button`/`input`/`select` or an ARIA pattern with keyboard support: options as a radio group (arrows), sketch handles as `role="slider"` (↑/↓ by 1/50 of the scale, PageUp/PageDown by 1/10, Home/End; `aria-valuetext` "week 26: about 120"), the chart cursor (§ 12.1), tool sheets as dialogs with focus return.
- **Screen-reader path for charts:** the focus chart's accessible name summarises it ("Pondweed over 104 weeks: stayed near 330 until week 30, then fell to 0 by week 60."), generated from the legs (§ 11.1) via a template per class; "Show the numbers" table with `<th scope>`; the cursor's live region. The loop diagram's ordered list (§ 12.2). The scene has `role="img"` with a list summary ("In the pond: pondweed 327, algae 58 (clear water), water fleas 37 …").
- Announcements (polite): "Ran 26 weeks. Now week 26." · "Settled after 37 weeks." · "The pondweed fell below the line in week 47." · review verdicts.
- No colour-only information: species = glyph + name; lines = dash pattern + glyph markers; marks = symbols + words; water/soil state = badge text; the goal line labelled.
- After "Run", focus moves to the review heading; after a change, to the run controls.
- Forced colours: strokes in `CanvasText`, focus ring visible, patterns instead of fills.

---

## 17. Localisation

### 17.1 Files

- `src/messages.ts`: UI strings in 16 locales (`title`, `tagline`, `rules`, `difficulty.*`, setting labels and hints, mode/goal/habitat/start names, run controls, condition and level names, action names, shape names, mark words, status lines, announcement templates). ≈ 170 keys.
- `src/content/<locale>.ts` (ADR 0011, `CONTENT_LOADERS`, `preload`): species names and "about" lines (16 × 2), challenge texts (16 × title, situation, question stems, "think about", explanation, real-world line), goal texts (4 × title, story, target sentence, hint, plan explanations), loop labels (≈ 40), "what happened" sentence templates. ≈ 260 strings per locale, ≈ 25–35 KB.
- en and de written first by the implementer; the other 14 AI-assisted (existing project practice), with a translator note at the top of `content/en.ts`: plain words, no Latin names in the main text, "water fleas" not "Daphnia" (the "about" line may add "Daphnia").

### 17.2 Names

Common names only, chosen to be unambiguous in each language (e.g. de "Blaualgen" for cyanobacteria with "about": "eigentlich Cyanobakterien"; "Kleinfische"; "Laichkraut"; en "ladybirds" — the British form, matching the project's English). Species ids never appear in the UI.

### 17.3 Numbers (`src/format.ts`, pure, tested)

Amounts via `Intl.NumberFormat(bcp47Tag(locale), { maximumFractionDigits: 0 })` of `u / 1000`; `<bdi>` around numbers in RTL text. Week counts use "Week {n}", "Label: {n}" or "{k} of {n}" phrasing wherever possible. Where a count needs a noun ("26 weeks", "settled after 37 weeks"), the content gives **plural-category forms containing `{n}`** per locale (en `{ one: '{n} week', other: '{n} weeks' }`, ru with one/few/many/other, ar with all six), selected by `forms[new Intl.PluralRules(tag).select(n)] ?? forms.other` — the pattern of Probability Detective (its design § 17.4); a content test asserts every category the locale's `pluralCategories` reports.

### 17.4 RTL

Panels, text and tool sheets mirror (logical properties). The **chart, scene, sketch and loop diagram are not mirrored** (time runs left to right, as in Sense of Time), `dir="ltr"` on those SVG containers; their text labels use `<bdi>`.

### 17.5 Preview locales (ADR 0003 amendment)

Not planned: the game ships all 16 locales (owner question 3 offers an en+de preview release if translations lag).

---

## 18. Preview (catalogue SVG, for the orchestrator)

Decorative, `aria-hidden`, the shared 96 × 64 viewBox and classes, light/dark via the tokens: the left 60 % a pond cross-section (waterline, three wavy pondweed stems, two duckweed ovals on the surface, a small fish outline), the right 40 % a tiny chart with two lines (one solid, one dashed) crossing once, and a small circular arrow with "R" in the corner. No text other than the single letter, not mirrored in RTL.

---

## 19. Test plan

### 19.1 Fast tests (TDD + fast-check; mutation-relevant): `test/model.test.ts`, `test/shape.test.ts`, `test/score.test.ts`, `test/cld.test.ts`, `test/rules.test.ts`, `test/goals.test.ts`

- **Integer core:** `idiv` equals BigInt floor division for random `0 ≤ a < 2⁵³`, `0 < b < 2⁵³` (property); `sat`, `hill`, light/water factors in `[0, 1000]` and monotone (properties); the bound analysis with extreme values (§ 7.8) stays below 2⁵³.
- **Conservation (properties):** for random valid `Sim` (fast-check arbitrary within bounds), random conditions and random action sequences: after every day/week/action, nutrient balance and water balance hold *exactly*; no stock is negative; total outflow of each source ≤ its stock (limiter); extinction moves mass to dead matter; arrivals and inputs increase `imp` by exactly their amount; exports increase `exp` exactly.
- **Determinism:** `simulate` twice → identical; JSON round trip of the state → identical replay; the result of a 104-week run equals a golden checksum per preset (catches accidental float use or order changes).
- **Mechanism unit tests** (tiny hand-computed cases): Holling II intake for one prey; preference split; refuge reduces intake; `hide` keeps prey out of reach; maturation delay — assimilation in week *t* appears in `b` exactly at the end of week *t + D − 1*; shading reduces growth; fixation falls with soil nutrients; flux limiter scaling with three outflows; weather factor range 700–1300 and independence of the action log.
- **Shape classifier:** examples for every class; scale invariance (multiplying a series by k ≥ 1 keeps the class, property); mirror symmetry (`v ↦ max − v` maps rises↔falls, rise-fall↔fall-rise; property, ignoring `vanishes`); constant → `steady`; legs alternate in direction (property).
- **Scoring:** level bands at the exact boundaries 0.85/1.15 (integer comparison `100·v_t` vs `85·v₀`); family table; sketch error at 0, at the band limits, monotone in the distance (property).
- **CLD honesty:** loop type = product of edge signs for every loop of every challenge/goal; every loop path is a cycle of existing edges; nodes are known stocks; (sensitivity check of edge signs in § 19.3).
- **Transitions** (`rules.ts`): predict — draft, commit, skip, run, next, summary, `reported` once; goal — apply action (budget), run, fail detection, rewind refunds, show-a-way, reached; explore — apply, run, settle, "continue from here" (snapshot start, log cleared, balance kept); random action sequences never throw and keep `isValidState`; commits are no-ops in review.
- **`isValidState`:** `fc.anything()` never throws; generated states valid; tampered fields rejected (unknown ids, too-long log, decreasing weeks, out-of-range levels, negative stock, broken balance, juvenile ring length, `reported` too early, oversize arrays).
- **`settingsOf`:** round trip over all setting combinations.

### 19.2 `test/content.test.ts`, `test/format.test.ts`, `test/view.test.ts`

- **Content:** every species, challenge, goal and loop label has text in all 16 locales (through `CONTENT_LOADERS`); placeholders identical; no species id or Latin name in the main texts; challenge question stems mention the asked species' shown name; zh-Hans without traditional-only characters; Portuguese passes the Brazilian guard.
- **Format:** amounts and weeks in all 16 locales, plural selection, `<bdi>` in RTL strings.
- **View** (jsdom): each phase (predict question/review/summary, goal running/failed/reached, explore) in `en`, `de`, `ar`, `ja`; chart and diagram containers `dir="ltr"` in Arabic; no model answer in the DOM before the run; slider roles and value texts; tool sheet focus return; the scene's text summary; the "Show the numbers" table.

### 19.3 Slow tests (`*.slow.test.ts`, ADR 0021 — `pnpm test` and the CI `long` job, not Stryker)

- `test/presets.slow.test.ts`: every stored preset equals its spin-up (prints the table on mismatch); the lively presets contain the species of § 9 above 1,500 u and are steady (relative swing < 0.25 over 104 further weeks).
- `test/challenges.slow.test.ts`: **every row of Appendix B.1 holds**: each question's answer as stated, `shape` answers identical for p = 15/20/25, `level` ratios outside the margins of § 11.2; CLD edge signs match the model's sensitivity at the challenge's start state.
- `test/goals.slow.test.ts`: every reference plan reaches its goal within the hard budget (and its "does it hold" result as listed: the four-step `clear-pond` plan holds, the stream-only plans slip back within 104 weeks); every listed non-solution fails; "do nothing" fails.
- `test/engine.slow.test.ts`: 2,000 random action sequences over 520 weeks per habitat: balance exact, bounds kept, never throws; timing of 520 weeks reported (budget § 20).

Each slow file stays under 50 % of its timeout under parallel load (the reviewer reruns them).

### 19.4 Contract (`test/contract.test.ts`)

`runGameContract(game, { interact })`: `preload('en')`; `interact` picks the first option of the current question (predict) or presses "4 weeks" (goal/explore), so the state changes before save/restore. Settings are sampled by the contract.

### 19.5 E2E (`e2e/games/ecosystem.spec.ts`)

1. `startGame` predict/medium: answer the shape question with the option named in the challenge data (read the save's challenge id, import `challenges.ts`), "Run", the review shows "●●●"; next item by "Skip — just show me"; finish the round; the summary and the host's "Another round" appear.
2. `expectResumeAfterReload` in predict after choosing a draft option (the draft survives the reload, nothing is committed).
3. Goal `save-pondweed`, easy: apply "buffer strip" at week 0, "Until it settles" several times / "26 weeks" × 4, the outcome "Reached"; then a second game: wait 20 weeks first, apply it — the failure line appears; "Undo my last change" and "Back to week 0" work; resume after reload in the middle of a goal (log and week survive).
4. Explore: add pike, run 26 weeks, toggle "Without my last change" (the ghost appears), "Show the numbers" table has rows; keyboard-only: Tab to "4 weeks", Enter, the live region announces the week.
5. Hard predict: sketch with keyboard (focus a handle, arrows), commit, the sketch overlay and "Your sketch: …" appear.
6. 360 × 740 viewport: no horizontal scroll, targets ≥ 44 px, the sticky bar does not cover the focused element.
7. `ar` RTL smoke: panels mirrored, chart not mirrored (week 0 left of week 26), numbers read LTR.
8. Offline: after the first load, go offline, open the game in a new page and start a round (content chunk precached).

---

## 20. Performance and bundle budget

| Item | Budget |
|---|---|
| Engine: one week of one habitat (8 species, 7 days) | ≤ 0.05 ms on the CI runner (arrays, no Maps/strings in the hot loop; the prototype with Maps took ≈ 0.15 ms) |
| Replay on restore/rewind (≤ 520 weeks) | ≤ 30 ms; typical goal (≤ 156 weeks) ≤ 10 ms |
| "Until it settles" (≤ 156 weeks) | ≤ 10 ms |
| Ghost recompute | ≤ 10 ms, only when shown |
| Chart redraw | ≤ 8 ms (one SVG, ≤ 11 rows × ≤ 160 points per visible window; downsample to ≤ 2 points per pixel) |
| Game chunk (code, species, presets, challenge specs, en UI messages) | ≤ 120 KB minified (≈ 35 KB gzip) excluding the 16 UI catalogues, which ride along as in every game |
| Content per locale | ≤ 35 KB minified, via `preload` |
| Saves | < 4 KB (predict), < 20 KB (explore with 300 actions) |

---

## 21. Risks

| Risk | Mitigation |
|---|---|
| The model looks "made up" or contradicts what people know | Only textbook mechanisms with citations (Appendix D); explanations name the real-world phenomenon; "simplified model" line in rules and every review; parameters described as illustrative |
| A recalibration flips challenge answers | Answers are not stored as data but checked by `challenges.slow.test.ts` against the model; stored marks keep old reviews stable; model id versioning (§ 14) |
| Chaotic or fragile behaviour in explore (players combine extreme changes) | Flux limiter, refuges, crowding mortality and arrivals keep the system bounded and non-negative; "Until it settles" caps at 156 weeks and says when a system keeps swinging; the engine slow test fuzzes 2,000 sequences |
| Charts are hard on phones and for screen-reader users | Small multiples with own scales, focus chart, cursor with live region, "What happened" sentences, numbers table |
| Prediction feels like a test | Skip everywhere, words and symbols, "surprise is the point" framing, no totals across rounds |
| Translation volume (≈ 430 strings × 15) | Short sentences, templates for numbers; owner may choose an en+de preview (question 3) |
| Ecological sensitivity (killing animals, pesticides) | Neutral management wording, no product names, no gore; spraying is shown with its side effects, not recommended |
| Floating-point creeping in through a helper (e.g. `Math.round` of a ratio) | Lint rule review in the PR; golden checksums per preset; `isValidState` rejects non-integers |

---

## 22. Open questions for the owner (max 3, each with a recommendation)

1. **Title.** Recommended: **"Pond & Meadow" / "Teich & Wiese"**. Alternatives: "Tiny Ecosystem" / "Kleines Ökosystem" (working title), "Ecosystem Lab" / "Ökosystem-Labor".
2. **Scope of the first release.** Recommended: **both habitats at once** (16 challenges, 4 goals; the engine is shared, and seeing the same loops in a pond and a meadow is much of the value). Alternative: pond only first (8 challenges, 2 goals; about 35 % less content and translation), meadow in a follow-up.
3. **Translations.** Recommended: **ship all 16 locales** like the other games. Alternative: release early as a preview in en + de (ADR 0003 amendment) and add the other 14 later, if the ≈ 430 strings per locale delay the release.

---

## 23. Implementation steps (one implementer)

1. **Engine core (tests first):** `src/model.ts` (`idiv`, helpers, `Sim`, `stepDay`, `stepWeek`, `applyAction`, `simulate`, `settledAt`, weather) with `test/model.test.ts` (balance, bounds, determinism, mechanism cases). Port the reference step in Appendix C, but with arrays indexed by habitat species order.
2. **Data:** `src/species.ts`, `src/habitats.ts` (tables of § 8), `src/presets.ts` generated by `test/presets.slow.test.ts` (`UPDATE_PRESETS=1`), golden checksums.
3. **Classifier and scoring:** `src/shape.ts`, `src/score.ts` with tests.
4. **Challenges and goals:** `src/challenges.ts`, `src/goals.ts`, `src/cld.ts` (data + circle layout, pure) with `test/cld.test.ts`, `challenges.slow.test.ts`, `goals.slow.test.ts`; reproduce Appendix B and record any recalibration in § 24 (implementation notes) and Appendix B.
5. **State and transitions:** `src/rules.ts` (`EcoState`, `newRound`, transitions, `isValidState`, `settingsOf`, summary); random action-sequence and fuzz tests.
6. **Text:** `messages.ts` and `content/en.ts`, then `de`, then the other 14; `format.ts`; content and format tests.
7. **Views:** `scene-pond.ts`, `scene-meadow.ts`, `chart-view.ts`, `sketch-view.ts`, `cld-view.ts`, `foodweb-view.ts`, `view.ts` (predict, goal, explore panels, run controls, tool sheets, summary), `styles.css` (logical properties, forced colours, 360 px); `index.ts` with `settings`, `settingsOf`, `preload`; `test/view.test.ts`.
8. **Contract and e2e:** `test/contract.test.ts`, `e2e/games/ecosystem.spec.ts`; run the full gate (`pnpm check`, `pnpm build`, the e2e command of the pipeline brief).
9. **Report to the orchestrator:** registry line (append), dependency, preview (§ 18), ROADMAP row (new game; skills systems/hypothesis), Stryker `mutate` lines (§ 1.3), Appendix A for `docs/third-party.md`, measured engine timings and chunk sizes, and any recalibration.

---

## Appendix A — row for `docs/third-party.md` (ready to paste)

```markdown
| *Pond & Meadow* model, species parameters, presets, challenges, explanations and drawings (`packages/games/ecosystem/src/`) | Project license (written for Worthwhile Play; the model's mechanisms — Monod growth, Holling type II feeding, Lotka–Volterra / Rosenzweig–MacArthur coupling, NPZD-style recycling, light shading, nitrogen fixation — are standard textbook ecology cited by reference in `docs/design/ecosystem.md`; all parameters are illustrative and calibrated for the game; no third-party text, figure, code or data set copied; translations other than en/de AI-assisted) | Simulation, content and SVG art of *Pond & Meadow* |
```

---

## Appendix B — calibration evidence (planner, 2026-10-27)

Prototype: a Node script implementing § 7 exactly as specified (integer flows, flux limiter, arrivals, maturation rings, extinction), scratchpad only, not committed; Appendix C reproduces its day step. Parameters as in § 8; presets as in § 9 (spun up from the rough starts; the prototype's `pond.green` for the goal is `pond.lively` + 104 weeks of high runoff). Values are thousand u, rounded.

### B.1 Prediction challenges (answers checked for the classifier at p = 15 / 20 / 25 %)

| Challenge | Species | Shape (15/20/25 %) | Level at week t (v_t / v₀) | Values at 0, H/6 … H |
|---|---|---|---|---|
| fleas-arrive | algae | falls | week 26: 0.27 | 250, 83, 68, 68, 68, 68, 68 |
| fleas-arrive | water fleas | rises | week 26: 0 → 85 | 0, 78, 85, 85, 85, 85, 85 |
| enrich-swings | water fleas | swings-last | — | 75, 105, 129, 85, 76, 49, 97 |
| fish-stocked | algae | rises | week 52: 1.75 | 66, 78, 88, 102, 114, 117, 115 |
| fish-stocked | water fleas | falls | week 52: 0.35 | 75, 58, 46, 33, 26, 26, 26 |
| pike-return | algae | falls | week 104: 0.52 | 140, 125, 116, 105, 91, 79, 73 |
| pike-return | small fish | falls | week 104: 0.10 | 98, 92, 84, 75, 56, 29, 9 |
| pike-return | water fleas | rises | week 104: 2.72 | 33, 40, 44, 50, 62, 78, 90 |
| algae-treatment | algae | (3 legs: fall, rebound above, settle; classifier: swings-last, so no shape question) | week 3: 1.81 | 58, 105, 95, 52, 57, 58, 58 |
| slow-runoff | pondweed | vanishes | week 104: 0.00 · week 20: 1.03 (looks fine) | 327, 334, 324, 83, 7, 1, 0 |
| no-way-back | pondweed | steady (stays gone) | week 104: 0 | 0, 0, 0, 0, 0, 0, 0 |
| shade | pondweed | falls | week 52: 0.30 | 327, 222, 219, 215, 201, 170, 97 |
| spray | aphids | (3 legs: crash, resurgence above, fall; no shape question) | week 16: 2.28 | 12, 3, 9, 20, 28, 14, 6 |
| spray | wildflowers | rise-fall | week 26: 0.26 | 106, 162, 181, 145, 73, 24, 28 |
| no-foxes | rabbits | rises | week 104: 7.77 | 8, 12, 18, 25, 35, 48, 60 |
| no-foxes | clover | falls | week 104: 0.10 | 41, 39, 34, 28, 18, 9, 4 |
| fertilise | clover | falls | week 104: 0.54 | 41, 39, 35, 32, 28, 25, 22 |
| drought | grasses | fall-rise | week 13: 0.50 | 68, 47, 53, 83, 80, 109, 102 |
| clover-poor | wildflowers | rises | week 104: 2.06 | 92, 102, 123, 146, 166, 181, 190 |
| worms-gone | grasses | falls | week 104: 0.85 (too close to the band edge: not used as a level question) | 68, 57, 51, 49, 51, 53, 58 |
| worms-gone | clover | rises | week 104: 1.84 | 41, 45, 55, 67, 74, 76, 75 |
| foxes-return | rabbits | falls | week 156: 0.05 | 100, 98, 72, 16, 4, 5, 5 |
| foxes-return | clover | rises | week 156: 35 | 1, 1, 1, 2, 6, 12, 28 |
| ladybirds-gone | aphids | rise-fall | week 8: 1.51 · week 26: 0.62 | 12, 17, 17, 11, 7, 6, 7 |

Also measured: enrichment destabilises the plankton pond only above a threshold (fleas over 78 weeks: runoff low → steady, medium → rises, high → swings beginning, heavy → lasting swings: the paradox of enrichment); a 10 %/day outflow ("stream") flushes the water fleas out of the lively pond within 26 weeks (a side effect the explore mode shows).

### B.2 Goals

| Goal | Plan | Result |
|---|---|---|
| save-pondweed | nothing | lost (pondweed 0 by week ≈ 60) |
| | buffer strip (runoff → low) at week 10 / 20 / 30 / 40 | kept (min 143) / lost / lost / lost |
| | runoff → none at week 10 / 20 | kept (min 326) / lost (min 40) |
| | stream 10 weeks from week 10 / 20 / 30 | lost / lost / lost |
| | net algae every 10 weeks | kept (min 299) |
| | remove small fish at week 10 | lost |
| clear-pond (12-week window) | nothing · treat algae 3 × · runoff → none · runoff → none + plant · runoff → none + plant + fish out · runoff → none + dredge + plant · plant only · fish out + plant (runoff on) · runoff → none, wait 52 weeks, fish out + plant | not reached |
| | runoff → none + dredge + plant + remove small fish 90 % (week 0) | reached week 53; **holds** (pondweed 331, algae 59 at week 156) |
| | runoff → none + dredge + remove fish, plant at week 8 | reached week 47; holds |
| | runoff → none + stream 20 weeks + plant at week 20 | reached week 43; holds (pondweed 258) |
| | runoff → none + stream 10 weeks + plant at week 10 | reached week 40, **slipped back** 79 weeks later (pondweed 6 at week 156) — the "does it hold" case |
| | stream 20 weeks + plant at week 20, runoff still on | reached week 42, **slipped back** 72 weeks later (pondweed 0) — the cause was still there |
| protect-flowers | nothing · spray again at week 12 | not kept (min 23 · 15) |
| | ladybirds 3,000 released at week 0 / 2 / 4 / 6 | not kept (min 27 / 31 / 38 / 53: they starve before the aphids return) |
| | released at week 8 / 10 / 12 / 14 | kept (min 77 / 92 / 89 / 69) |
| | released at week 16 / 18 | not kept (min 52 / 37: too late) |
| | 1,500 ladybirds: kept only at week 10 / 12 (min 61 / 60) | the release size matters too |
| bring-back-clover (deadline 208) | nothing · rabbits −50 % · rabbits −80 % · rabbits −80 % + clover | not reached in 156 weeks (rabbits regrow; clover ≤ 1) |
| | foxes · foxes + clover · foxes + rabbits −50 % · foxes + rabbits −80 % + clover | reached week 154 · 155 · 135 · 115 |

### B.3 Engine properties measured

- Mass balance (nutrients and water) exact (error 0) over 1,040 weeks with random additions, removals, runoff and light changes in both habitats.
- Prototype speed (Maps, string keys): ≈ 0.15 ms per simulated week (1,040 weeks ≈ 150–170 ms); the array implementation should be 3–5 × faster (budget § 20).
- Spin-up of a preset (520 weeks) ≈ 150–190 ms in the prototype — hence stored presets (§ 9).

### B.4 How the parameters were found

Hand-built sub-systems first (algae alone → nutrient-limited carrying capacity; algae + water fleas → damped approach at low nutrients, lasting cycles at high: paradox of enrichment), then seeded random search and hill-climbing over ≈ 14 pond and ≈ 25 meadow parameters against explicit objectives (coexistence and calm of the lively presets, and the outcomes in B.1/B.2). Two structural additions were needed and are part of § 7: **arrivals** (without them every temporary crash became a permanent extinction and the pond could never turn green again) and **prey hiding places** (`hide`; without them fish drove water fleas to zero in turbid water). A sharp tipping point exists between total pond nutrients of ≈ 0.9 and 1.0 million u in an earlier parameter set; the final set shows the delayed collapse under runoff (B.1 slow-runoff) and the extinction-based "no way back" (pondweed has no seed bank in the model; replanting is needed, as in many real restorations).

---

## Appendix C — reference day step (prototype, JavaScript; port to typed arrays)

```js
const M = 1_000_000;
const pm = (rate, x) => idiv(rate * x, M);
const sat = (x, k) => (x + k === 0 ? 0 : idiv(1000 * x, k + x));
const q = (v) => idiv(v, 1000);
const hill = (x, k) => { const a = q(x) * q(x), b = q(k) * q(k); return a + b === 0 ? 0 : idiv(1000 * a, a + b); };

function stepDay(s, defs, env, wf) {           // s: { N, D, W, B: {id: u}, J: {id: u[]}, week, imp, exp, wimp, wexp }
  const out = new Map();                        // source -> [{ to, amt }]
  const add = (from, to, amt) => { if (amt > 0) (out.get(from) ?? out.set(from, []).get(from)).push({ to, amt }); };
  const stock = (k) => (k === 'N' ? s.N : k === 'D' ? s.D : k === 'W' ? s.W : s.B[k.slice(2)]);
  const L = idiv(env.light * wf.light, 1000);
  for (const [id, d] of Object.entries(defs)) {                       // 1. producers
    const b = s.B[id] ?? 0; if (b === 0 || d.kind !== 'producer') continue;
    let shade = 0; for (const [sid, c] of Object.entries(d.shadedBy ?? {})) shade += idiv(c * (s.B[sid] ?? 0), 1000);
    const lf = d.hill ? idiv(L * idiv(1000 * q(d.kL) * q(d.kL), q(d.kL) * q(d.kL) + q(shade) * q(shade)), 1000) : idiv(L * d.kL, d.kL + shade);
    let r = d.mu;
    for (const [iid, k] of Object.entries(d.inhibitedBy ?? {})) r = idiv(r * k, k + (s.B[iid] ?? 0));
    r = idiv(r * Math.min(lf, 1300), 1000);
    if (d.space) { let used = 0; for (const [q2, d2] of Object.entries(defs)) if (d2.space === d.space) used += s.B[q2] ?? 0;
      r = idiv(r * Math.max(0, 1000 - idiv(1000 * used, env.space[d.space])), 1000); }
    if (env.meadow) r = idiv(r * hill(s.W, d.kW), 1000);
    const rFix = d.fix ? idiv(idiv(r * d.fix, 1000) * d.kFix, d.kFix + s.N) : 0;
    r = idiv(r * sat(s.N, d.kN), 1000);
    const up = pm(r, b), fx = pm(rFix, b);
    add('N', 'B:' + id, up); add('in', 'B:' + id, fx);
    if (env.meadow) add('W', 'wout', idiv((up + fx) * d.water, 1000));
  }
  for (const [id, d] of Object.entries(defs)) {                       // 2. consumers
    const c = s.B[id] ?? 0; if (c === 0 || d.kind === 'producer') continue;
    const w = []; let W = 0;
    for (const [pid, pref] of Object.entries(d.prey)) {
      const x = pid === 'D' ? s.D : Math.max(0, (s.B[pid] ?? 0) - (defs[pid].hide ?? 0));
      let wi = idiv(pref * x, 1000);
      const rf = d.refuge?.[pid]; if (rf) wi = idiv(wi * rf.k, rf.k + (s.B[rf.by] ?? 0));
      w.push([pid, wi]); W += wi;
    }
    if (W === 0) continue;
    const Q = pm(idiv(d.g * W, d.k + W), c);
    for (const [pid, wi] of w) add(pid === 'D' ? 'D' : 'B:' + pid, 'eat:' + id, idiv(Q * wi, W));
  }
  for (const [id, d] of Object.entries(defs)) {                       // 3. losses
    const b = s.B[id] ?? 0; if (b === 0) continue;
    add('B:' + id, 'N', pm(d.resp, b));
    add('B:' + id, 'D', pm(d.mort, b) + (d.m2 ? idiv(pm(d.m2, b) * b, M) : 0));
    if (d.suspended && env.flow) add('B:' + id, 'out', pm(env.flow, b));
  }
  add('D', 'N', pm(env.decay, s.D)); add('D', 'out', pm(env.burial ?? 0, s.D));   // 4. pools
  add('N', 'out', pm(env.flow ?? 0, s.N)); add('N', 'out', pm(env.leach ?? 0, s.N));
  if (env.meadow) add('W', 'wout', pm(env.evap, s.W));
  const delta = new Map(), eaten = new Map(), bump = (k, v) => delta.set(k, (delta.get(k) ?? 0) + v);
  for (const [from, flows] of out) {                                  // 5. limit and route
    const sum = flows.reduce((a, f) => a + f.amt, 0), have = from === 'in' ? Infinity : stock(from);
    for (const f of flows) {
      const a = sum > have ? idiv(f.amt * have, sum) : f.amt;
      if (from === 'in') s.imp += a; else bump(from, -a);
      if (f.to === 'out') s.exp += a; else if (f.to === 'wout') s.wexp += a;
      else if (f.to.startsWith('eat:')) eaten.set(f.to.slice(4), (eaten.get(f.to.slice(4)) ?? 0) + a);
      else bump(f.to, a);
    }
  }
  for (const [id, e] of eaten) { const a = idiv(e * defs[id].assim, 1000); bump('D', e - a); bump(defs[id].delay ? 'J:' + id : 'B:' + id, a); }
  const inp = idiv(env.input * wf.input, 1000); if (inp) { bump('N', inp); s.imp += inp; }   // 6. inputs
  if (env.meadow) { const rain = idiv(env.rain * wf.rain, 1000); bump('W', rain); s.wimp += rain; }
  for (const [k, v] of delta) {                                       // 7. apply
    if (k === 'N') s.N += v; else if (k === 'D') s.D += v; else if (k === 'W') s.W += v;
    else if (k.startsWith('J:')) { const id = k.slice(2); s.J[id][s.week % defs[id].delay] += v; }
    else s.B[k.slice(2)] += v;
  }
  if (env.meadow && s.W > env.wmax) { s.wexp += s.W - env.wmax; s.W = env.wmax; }
  for (const id of Object.keys(s.B)) {                                // 8. local extinction
    const p = s.B[id] + (s.J[id] ?? []).reduce((a, b) => a + b, 0);
    if (s.B[id] > 0 && p < defs[id].min) { s.D += s.B[id]; s.B[id] = 0; }
  }
}
```

(Appendix B was produced with exactly this step, including the `q(v)` form of `hill` for light and water; an earlier variant without the pre-scaling gave the same answers within 2 %. Arrivals and the weekly maturation are in `stepWeek`, § 7.6.)

---

## Appendix D — scientific basis (references for mechanisms, not for numbers)

- Verhulst, P.-F. (1838). Notice sur la loi que la population suit dans son accroissement. *Correspondance mathématique et physique* 10, 113–121. — logistic growth, carrying capacity.
- Lotka, A. J. (1925). *Elements of Physical Biology.* Williams & Wilkins. Volterra, V. (1926). Fluctuations in the abundance of a species considered mathematically. *Nature* 118, 558–560. — predator–prey coupling; Volterra's principle (general killing favours the prey).
- Monod, J. (1949). The growth of bacterial cultures. *Annual Review of Microbiology* 3, 371–394. — nutrient-limited growth.
- Holling, C. S. (1959). Some characteristics of simple types of predation and parasitism. *The Canadian Entomologist* 91, 385–398. — type II functional response.
- Rosenzweig, M. L., & MacArthur, R. H. (1963). Graphical representation and stability conditions of predator–prey interactions. *The American Naturalist* 97, 209–223.
- Rosenzweig, M. L. (1971). Paradox of enrichment: destabilization of exploitation ecosystems in ecological time. *Science* 171, 385–387.
- Gurney, W. S. C., Blythe, S. P., & Nisbet, R. M. (1980). Nicholson's blowflies revisited. *Nature* 287, 17–21. — delays and cycles.
- Carpenter, S. R., Kitchell, J. F., & Hodgson, J. R. (1985). Cascading trophic interactions and lake productivity. *BioScience* 35, 634–639. — trophic cascades (fish → zooplankton → algae).
- Fasham, M. J. R., Ducklow, H. W., & McKelvie, S. M. (1990). A nitrogen-based model of plankton dynamics in the oceanic mixed layer. *Journal of Marine Research* 48, 591–639. — nutrient–plankton–detritus structure in nutrient units.
- Steele, J. H., & Henderson, E. W. (1992). The role of predation in plankton models. *Journal of Plankton Research* 14, 157–172. — quadratic mortality closure.
- Scheffer, M., Hosper, S. H., Meijer, M.-L., Moss, B., & Jeppesen, E. (1993). Alternative equilibria in shallow lakes. *Trends in Ecology & Evolution* 8, 275–279. — clear vs turbid states, vegetation feedback.
- Scheffer, M., et al. (2003). Floating plant dominance as a stable state. *PNAS* 100, 4040–4045. — duckweed cover.
- Søndergaard, M., Jeppesen, E., Lauridsen, T. L., et al. (2007). Lake restoration: successes, failures and long-term effects. *Journal of Applied Ecology* 44, 1095–1105. — delayed recovery after load reduction, biomanipulation.
- Hardin, M. R., Benrey, B., Coll, M., Lamp, W. O., Roderick, G. K., & Barbosa, P. (1995). Arthropod pest resurgence: an overview of potential mechanisms. *Crop Protection* 14, 3–18.
- Stevens, C. J., Dise, N. B., Mountford, J. O., & Gowing, D. J. (2004). Impact of nitrogen deposition on the species richness of grasslands. *Science* 303, 1876–1879.
- Streeter, J. (1988). Inhibition of legume nodule formation and N₂ fixation by nitrate. *Critical Reviews in Plant Sciences* 7, 1–23.
- Edwards, C. A., & Bohlen, P. J. (1996). *Biology and Ecology of Earthworms* (3rd ed.). Chapman & Hall. — earthworms and decomposition.
- Meadows, D. H. (2008). *Thinking in Systems: A Primer.* Chelsea Green. Sterman, J. D. (2000). *Business Dynamics.* McGraw-Hill. — stocks, flows, delays, causal loop diagram conventions (link polarity, R/B loops, delay marks).
