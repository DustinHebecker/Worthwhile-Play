# Weight & Balance (`balance-lab`) — design

Status: **Plan (2026-10-27), owner decisions recorded in § 24 (all recommendations accepted)**, written by the planner of the new-games pipeline (game 8 of the owner's list, working title "Balance Lab"; done before it: Best Plan, Estimation Lab, Probability Detective, Atlas Explorer, Sense of Time, Pond & Meadow, Tones & Chords). The implementer follows it, and the reviewer checks the work against it. The statics core, the overhang optimum and the beam and mobile generators were prototyped for this plan (Appendix C). Numbers marked *(calibrate)* are first estimates; the implementer may tune them within the stated bounds. **The physics rules of § 8 are not tunable**: they are exact and tested.

Scope for the implementer (feature agent, ADR 0006): `packages/games/balance-lab/` and `e2e/games/balance-lab.spec.ts`. The orchestrator creates `package.json` (dependencies `@wp/game-core`, `@wp/ui`; dev `@wp/testing`), adds the registry line (appended after the existing games), adds the dependency in `apps/web/package.json`, draws the preview in `apps/web/src/previews.ts` (§ 18), adds the Stryker `mutate` lines (§ 19.2) and pastes Appendix A into `docs/third-party.md`. **No new npm dependency, no third-party data, art or font. No shared package is needed**, and the stack-duel physics is deliberately **not** reused (§ 1.2).

Binding inputs: `CLAUDE.md`; the implementation brief ("Core product principles", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"); ADR 0002 (contract); ADR 0003 including the 2026-10-24 amendment (§ 17.5); ADR 0006 (roles); ADR 0011 (per-locale content, `preload`); ADR 0017 (start screen, `settings`, `settingsOf`, `begin`); ADR 0021 (mutation budget, `*.slow.test.ts`).

---

## 1. Survey: overlap and reuse

### 1.1 Overlap with the catalogue and outside it

| Game | Relation | Consequence |
|---|---|---|
| Stack Duel (`stack-duel`) | Dropping pieces onto a tower; a real-time-stepped rigid-body simulation decides whether it stands. A dexterity and tactics duel. | Different skill. Here nothing is dropped and nothing is simulated: the player **reasons** about turning effects and centre of mass, and an **exact** rule gives the verdict, with the reason drawn. No code is shared (§ 1.2). |
| Best Plan (`mini-optimizer`) | Optimise one number; show the exact best value afterwards. | Only the overhang task (§ 9.3) optimises, and it borrows the calm "your value / best possible" review. No code shared. |
| Laser Paths, Circuit, Flow Lab | Exact deterministic puzzles about a physical idea (optics, electricity, flows). | Same family ("a small lab with exact rules"). No game in the catalogue is about levers, torque, mobiles or centre of mass. That is the gap. |
| Probability Detective, Pond & Meadow | Predict, commit, then see and understand. | Copy the **round shape**: predict items, "Skip — just show me", calm marks, a `reported` guard, a short summary. |
| Estimation Lab | `format.ts` with `Intl` units. | Number and unit formatting pattern copied. |
| PhET "Balancing Act" (University of Colorado; outside the catalogue) | A free educational simulation of a plank on a fulcrum. One of its screens is called "Balance Lab"; its game screen asks to add an object to balance, to predict the tilt, and to find a mystery mass. | The nearest existing product. **We copy nothing**: no names, screens, layouts, art, objects or level texts. Our levers hang weights from hooks (a school lever kit, not a plank with bricks and people), we add mobiles and stacks, and there is no star scoring. Because "Balance Lab" is literally a PhET screen name, this plan proposes another title (§ 2, owner question 1). |

### 1.2 What is reused, and why not the stack-duel physics

**Reused:** `@wp/game-core` (`defineGame`, `createRng`, `seedFromString`, guards `isRecord`/`isInt`/`isArrayOf`/`isOneOf`/`isUint32`, `createLocaleContent`, `SettingSpec`, `bcp47Tag`); `@wp/ui` (`h`, `clear`, `announce`); `@wp/testing` (`runGameContract`, `startGame`, `chooseSetting`, `submitStart`, `expectResumeAfterReload`, `readSave`). Patterns copied (games never import each other): probability-detective's predict/review flow and `reported` guard; ecosystem's `content/index.ts` loader table; fermi-lab's `format.ts`; mini-optimizer's sticky status box below 48 rem.

**Stack-duel's physics, examined** (`packages/games/stack-duel/src/physics.ts`, 645 lines): a Box2D-Lite-style engine written from scratch: convex polygon compounds, fixed step 1/60 s, sequential impulses, Coulomb friction with **one constant μ = 0.6 for every contact**, restitution 0, linear damping 0.1/s and **angular damping 1/s**, split-impulse penetration recovery (slop 0.005, Baumgarte 0.2), warm starting and island sleeping. A drop is resolved by stepping until everything sleeps or 600 steps pass. It is deterministic within one JS engine and right for a dexterity game.

Why the owner's note fits: μ = 0.6 is high for wood on wood under a solver that also warm-starts friction impulses, and the angular damping of 1/s takes rotation energy out quickly, so pieces "stick" and stop turning early.

Why it is **not** reused here, even with lower friction:

1. **The verdict must be exact.** A stack whose centre of mass lies exactly over an edge, or a lever with 3 kg × 4 against 4 kg × 3, must give one well-defined answer, the same on every device. A time-stepped solver with slop, damping and an iteration count gives an approximation. Near the boundary — where the interesting puzzles are — it can say "stands" for a configuration that should tip, or the other way round.
2. **The explanation must match the verdict.** We draw the turning effects and the centre of mass and say "12 against 10, so the left side goes down". That sentence must be the same computation that decided the outcome.
3. **Friction plays no part in this game's physics.** In every scene here, gravity is the only external force and every contact face is horizontal, so no contact ever has to resist a sideways push. Whether something stands is decided by moments alone. Friction only affects how a falling piece moves *after* it starts to tip — which is cosmetic here (§ 8.6).
4. **Sharing would need a new shared package.** Games never import other games. Reusing the engine would mean the orchestrator extracting it into, say, `packages/physics-2d` with a configurable friction. That is only worth it for a later "drop and watch" sandbox (owner question 4, option c). This plan does not recommend it.

### 1.3 Shared changes

None needed. Report to the orchestrator: the Stryker lines (§ 19.2) and the skills used (`spatial`, `hypothesis` — both exist).

---

## 2. Identity

| | |
|---|---|
| Package id | `balance-lab` (`@wp/game-balance-lab`), the working title as a neutral id. A later title change touches no saves. |
| English title | **Weight & Balance** (recommended, owner question 1) |
| German title | **Gewicht & Gleichgewicht** |
| Other locales (draft; translators may adjust) | nl Gewicht & evenwicht · es Peso y equilibrio · fr Poids et équilibre · ru Вес и равновесие · zh-Hans 重量与平衡 · ko 무게와 균형 · ja 重さとつり合い · ar الوزن والتوازن · pt Peso e equilíbrio · it Peso ed equilibrio · pl Ciężar i równowaga · tr Ağırlık ve Denge · uk Вага і рівновага · hi भार और संतुलन |
| Tagline (en) | "Levers, mobiles and stacks: predict whether it tips, build it so it balances, and see why." |
| Skills | `spatial` (positions, distances, centre of mass), `hypothesis` (predict, then check) |
| `typicalMinutes` | `[5, 15]` |
| `difficulties` | `['easy', 'medium', 'hard']` |
| Input | pointer, touch, keyboard |
| Capabilities | `offline: true`, `audio: 'none'`, `aiOptional: false`, `webgpu: 'none'`, `network: 'none'`, `pauseable: true` |
| `stateVersion` | 1 |

Titles considered: "Balance Lab" / "Gleichgewichtslabor" (the working title; fits Flow Lab / Flusslabor and Estimation Lab / Schätzlabor, but "Balance Lab" is the name of a screen in PhET's well-known balance simulation, whose game asks very similar questions, so the same name would look like a copy). "Tipping Point" / "Kipppunkt" (a common phrase, but also a well-known book title and a UK TV quiz show). "Weight & Balance" names what the player works with and matches the catalogue's plain "X & Y" titles (Pond & Meadow, Tones & Chords). In aviation, "weight and balance" is a generic technical term, not a product name.

---

## 3. Concept variants and the recommendation

The original description of "Balance Lab" is lost; only the name survives. Three readings were considered.

| Variant | What you do | Strengths | Weaknesses |
|---|---|---|---|
| **A. Three workbenches, one rule (recommended)** | **Beam** (a lever on an axle, weights on hooks), **Mobile** (bars hanging from bars), **Stack** (blocks and planks over a table edge). Each bench has *predict* tasks ("which way will it go?") and *build* tasks ("make it balance"). All three are decided by the same idea: the turning effects about a support cancel, or the centre of mass lies over the support. | Variety without new rules; the player sees the same principle in three costumes (lever → mobile = levers on levers → stack = centre of mass over the support). Stacks give the famous surprise that four blocks can reach past the table edge. Visual, tactile, calm. | Three scene types to draw and make accessible; the largest variant. |
| B. Levers only | Beam and mobile puzzles. | Smaller (about 35 % less work); exact integer arithmetic throughout. | Repetitive after a few rounds; misses centre of mass, which is the more general idea. |
| C. Weighing detective | A two-pan balance: find the odd coin in the fewest weighings, order weights by comparison. | A classic puzzle with real reasoning value. | It is **logic**, not physics: the balance is only a comparison oracle. It overlaps Mastermind, Black Box and Probability Detective. Not "balance" in the physical sense. |

**Recommendation: A.** It is the most interesting, gives honest practice of one transferable idea (turning effect and centre of mass), and fills a real gap. Variant C could become a fourth bench later (owner question 2), but it is not part of this plan.

---

## 4. Pitch and honest value

**Pitch.** A small workshop with three benches. On the first, a bar turns on an axle, and you hang weights on its hooks: will it stay level? Where must the 2 kg weight go to hold the 3 kg one? On the second, a mobile hangs from the ceiling: which weight goes on which hook so every bar hangs level, and where do you tie the string? On the third, you slide blocks over the edge of a table: how far can the top one reach before the stack tips — and can it reach past the edge completely? You predict or build at your own pace. When you let go, the game shows what happens and why: the turning effect of every weight as a labelled bar, the centre of mass as a plumb line over its support.

**Claims we may make** (tagline, rules, catalogue):

- "Practise your intuition for levers: a weight twice as far out turns twice as hard."
- "Practise finding the centre of mass, and seeing when it is over the support."
- "Predict first, then check — and see the reason drawn."

**Claims we never make:** "improves your brain/IQ", "teaches physics", "makes you an engineer". The rules text states the model in one line: *"A simplified model: rigid parts, weights hang exactly at the hooks, bars and strings weigh nothing unless a weight is shown, no wind and no bending."*

Physics honesty, in the rules help (one paragraph): *"Strictly, a turning effect (torque) is force × distance. Every weight here is pulled by the same gravity, so comparing kilograms × distance gives the same answer."*

---

## 5. Principles (binding)

1. **Exact statics decides; motion only illustrates.** Every verdict is an integer comparison (§ 8). Any motion after "Let go" is computed *from* the verdict and never feeds back into it.
2. **No tolerance, no luck.** There is no "almost balanced". The arithmetic is exact, and the edge case is defined (§ 8.5). There is no randomness after `newGame`.
3. **The reason is always available.** Every outcome has its explanation (§ 12), in pictures and in words, also for screen readers.
4. **Calm.** No timers, no move limits, unlimited "Let go" tries in build tasks, undo, "Skip — just show me" on every predict task. No points, stars, streaks or comparisons with earlier rounds. Nothing is stored across rounds.
5. **Left and right are the picture's left and right**, in every locale (§ 17.4).
6. **Own content.** Scenes, texts and pictures are made for the project. Sources are cited for facts only (Appendix D).

---

## 6. Core loop and modes

**Core loop (one task):** look at the scene (weights, distances, blocks) → predict or build while a pin or your hand holds everything still → "Let go" → see the outcome and the reason → "Next".

| Mode (`mode` setting) | Shown name (en) | One game |
|---|---|---|
| `round` (default) | **Puzzles** | A round of **6 tasks** *(calibrate 5–8)* from the chosen benches and task kinds (§ 7). Then a calm summary and `finished({ outcome: 'completed' })`. |
| `free` | **Free bench** | A sandbox on one bench: an unlimited tray of weights (or blocks, planks and cubes), live explanations on request, "Let go" / "Hold again", undo. No natural end (no `finished()`); the host's "New game" starts a new bench. |

Round composition: with `bench: 'mixed'`, the order is beam, stack, mobile, beam, stack, mobile. With `tasks: 'mixed'`, predict and build alternate, starting with predict (a prediction first primes the intuition the build task then uses).

**Holding and letting go.** While you build, the lever is held level by a pin, the mobile's bars are held by a clip, and the stack is held by your hand. Nothing moves until "Let go". This makes the scene a calm puzzle instead of a reflex task, and it is honest: real lever kits have exactly such a pin.

---

## 7. Settings (start screen) and `settingsOf`

```ts
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'mode', labelKey: 'mode.label', valueKey: 'mode', values: ['round', 'free'], default: 'round', display: 'radio' },
  { kind: 'choice', id: 'bench', labelKey: 'bench.label', valueKey: 'bench', values: ['mixed', 'beam', 'mobile', 'stack'], default: 'mixed', display: 'radio', when: { mode: ['round'] } },
  { kind: 'choice', id: 'tasks', labelKey: 'tasks.label', valueKey: 'tasks', values: ['mixed', 'predict', 'build'], default: 'mixed', display: 'radio', hintKey: 'tasks.hint', when: { mode: ['round'] } },
  { kind: 'choice', id: 'freeBench', labelKey: 'freeBench.label', valueKey: 'bench', values: ['beam', 'mobile', 'stack'], default: 'beam', display: 'radio', when: { mode: ['free'] } },
  { kind: 'difficulty', default: 'easy', when: { mode: ['round'] } }
];
```

- Difficulty labels: easy "Easy — small numbers; the turning effects are shown while you build", medium "Medium — more weights, deeper mobiles; explanations on request", hard "Hard — bars with their own weight, near-balances, the best possible overhang". Default `easy`: the idea is new to many people.
- `tasks.hint`: "Predict: say what will happen. Build: make it balance."
- `settingsOf(state)`: `{ mode, difficulty, bench, tasks }` for a round, `{ mode, freeBench }` for the free bench. A new round is fully determined by seed + settings, so the contract's "Another round with `settingsOf`" check holds.
- `newGame` treats `settings` as untrusted (defaults for anything missing or invalid). `begin` is irrelevant (no intro screen).
- Display preferences that stay in the game (`context.preferences`, per device, never in state): "Show numbers on the scene" (default on), "Show the grid" (stack bench; default on).

---

## 8. The physics model (pure, `src/statics.ts`)

### 8.1 Units and numbers

- **Masses** are positive integers in kg (weights 1–9 kg; block 1 kg; plank 2 kg; stone block 2 kg; beam 2–8 kg on hard).
- **Lengths** are integers: on the beam and mobile benches in *steps* (hook spacing); on the stack bench in *cm* (a block is 24 cm long, a plank 48 cm, a cube 6 cm wide).
- **Moments** are mass × signed distance, in kg·step or kg·cm, positive = clockwise = the right side goes down.
- Every value stays far below 2^31 (max ≈ 12 items × 9 kg × 96 cm), so plain JS numbers are exact; no BigInt, no fractions in the decision. A centre of mass is kept as the exact pair `(S, M)` (sum of mass × position, total mass) and only divided for display.
- Gravity cancels everywhere and never appears in code.

### 8.2 Beam (lever on an axle)

The bar has hooks at integer positions `p ∈ [−B, B]` measured from the bar's middle (B = 4 easy, 6 medium/hard). The axle passes through hole `a` (always 0 on easy and medium; any hole on hard). Weights hang from hooks; up to 3 weights per hook (drawn as a chain). The bar's own mass `m_b` acts at its middle (position 0).

```
net(beam) = Σ_i m_i · (p_i − a)  +  m_b · (0 − a)
verdict   = net < 0 → 'left-down' · net = 0 → 'level' · net > 0 → 'right-down'
```

The axle goes through the bar's centre line and the weights hang below it, so a balanced lever is in neutral equilibrium: it stays level after the pin is pulled. This is how school lever kits behave, and it is why "level" is a clean outcome. On easy and medium the bar's own weight is shown ("bar 3 kg") but, with the axle in the middle, its moment is 0 — the explanation says so once ("the bar's weight acts at its middle, right at the axle").

### 8.3 Mobile (bars hanging from bars)

A mobile is a tree of at most 3 bars (easy 1–2, medium 2, hard 3) and at most 6 weights. Each bar has hooks at integer positions `0…W` (W ≤ 6) and is hung by a string tied at hole `s` (a position that carries no hook). Each hook carries a weight or another bar. **Bars and strings weigh nothing** (rules text).

```
M(weight) = its mass;  M(bar) = Σ M(child)
net(bar)  = Σ_child M(child) · (pos_child − s)
level(bar) ⇔ net(bar) = 0;   level(mobile) ⇔ every bar is level
```

A bar's verdict uses only the *total* mass hanging below each hook — this is the insight the bench practises (a whole sub-mobile acts like one weight at its hook).

### 8.4 Stack (centre of mass over the support)

The table top ends at x = 0 (table for x ≤ 0). Bodies are blocks (24 cm, 1 kg), planks (48 cm, 2 kg) and, on hard, stone blocks (24 cm, 2 kg, shown with a stone pattern and "2 kg"). **Single column:** body 0 lies on the table, body k lies on body k − 1, and every body rests on exactly one thing. Cubes (1–4 kg, 6 cm wide, point masses at their centre) may sit on the exposed top of any body: the cube's 6 cm footprint must lie inside the body's top face and outside the footprint of the body above; cubes on the same spot stack.

For each joint k (k = 0: body 0 on the table; k ≥ 1: body k on body k − 1):

```
above(k)   = body k, every body above it, and every cube on those bodies
(S_k, M_k) = (Σ m·x, Σ m) over above(k), x = centre of each body or cube
contact_k  = [lo_k, hi_k] = overlap of body k's bottom with its support's top
             (table: (−∞, 0] ∩ body 0)
holds(k)   ⇔ lo_k · M_k ≤ S_k ≤ hi_k · M_k
stands     ⇔ holds(k) for every k
```

Positions are on a 1 cm grid; body centres are integers because all lengths are even. The UI never lets a body be put down with less than 1 cm of contact (`hi_k − lo_k ≥ 1`), so `contact_k` is never empty.

This is the standard tipping criterion: a rigid part resting on a flat horizontal support stays put if and only if the vertical line through its centre of mass passes through the contact region. Applied at every joint to the part above it, with each body resting on exactly one support, the condition is **necessary and sufficient** for a static equilibrium with non-negative contact forces (no statically indeterminate cases arise — one reason the single-column rule is binding).

A failing joint also has a direction: `S_k > hi_k · M_k` → the part above tips to the **right** about the right edge; `S_k < lo_k · M_k` → to the **left**.

### 8.5 What counts as balanced, and the edge case

- **Beam and mobile:** level ⇔ net moment exactly 0. Integer arithmetic, no tolerance.
- **Stack:** the closed interval counts. A centre of mass exactly over an edge (`S_k = lo_k·M_k` or `= hi_k·M_k`) **stands**, and the outcome says *"Balanced on the edge — in real life the slightest nudge would tip it."* (outcome `edge`, a kind of `stands`). This is the mathematically exact limiting case. It is also where the classic best overhang lies (§ 9.3), so excluding it would make the best-known stacks impossible. The explanation marks such joints with a knife-edge symbol and the word "edge".

### 8.6 Motion after "Let go" (cosmetic only)

- **Beam:** tips to its stop (an end touches the stand; a fixed angle per bench layout, about 12°) with an ease-in over ≤ 500 ms; a level beam gives one small settle wiggle (≤ 2°, damped, 400 ms) to show it was released.
- **Mobile:** each unbalanced bar swings down on its heavier side to a stop at 25°, from the top bar down. The rules help says: *"A real straight bar would swing down further; here it stops at a slant so you can still see everything."*
- **Stack:** the part above the **lowest** failing joint rotates rigidly about the contact edge, then drops out of the scene (≤ 700 ms). If other joints fail too, the outcome text names all of them.
- All motion is computed from the verdict and the geometry (pure keyframes in `src/motion.ts`), never from a simulation. With `context.reducedMotion`, the final pose appears at once. The state holds only the verdict; closing during an animation and restoring shows the final pose.

### 8.7 Model limits stated in the help

Rigid parts (no bending), no wind, weights hang exactly below their hooks, bars and strings weigh nothing unless a weight is shown, friction is never needed (nothing pushes sideways), blocks are uniform (centre of mass at the middle), one support per block.

---

## 9. Task types (pure generation in `src/generate.ts`; data in state)

Every task stores its **scene** (fixed parts), its **tray** (parts to place, build tasks), its **goal**, and for build tasks a **witness** — one valid solution, built first and checked by the statics core. `isValidState` re-checks the witness (§ 14).

### 9.1 Beam

| Id | Kind | Task text (en) | Construction | Answer |
|---|---|---|---|---|
| `beam-predict` | predict | "When the pin is pulled, what happens?" Options: Left side down · Stays level · Right side down | Random weights on hooks, accepted by the trap and margin rules (§ 10.2). | verdict |
| `beam-hook` | build | "Hang the 2 kg weight so the bar stays level." | Fixed weights with net = −m·d for a free hook d in range; tray = one weight m. | unique hook (by construction; solver-checked) |
| `beam-weights` | build | "Hang all the weights from the tray so the bar stays level." (medium 2, hard 3 weights) | A balanced configuration is drawn, then k weights are moved to the tray; the start must not be level. | any placement with net = 0 |
| `beam-choose` | build (medium+) | "Which weight belongs on the marked hook?" Tray of 3–4 weights, exactly one fits. | Solver-checked uniqueness. | unique weight |
| `beam-axle` | build (hard) | "Move the axle so the bar stays level." The bar has its own weight; the axle can go through any hole. | Constructed with a ≠ 0, so the bar's own weight matters. | unique hole |

### 9.2 Mobile

| Id | Kind | Task text (en) | Construction | Answer |
|---|---|---|---|---|
| `mobile-predict` | predict | "Which way does the marked bar dip?" (easy: the top bar; medium/hard: any bar) Options as for the beam. | Random mobile, trap and margin rules. The marked bar's verdict uses the full masses of its sub-mobiles. | verdict of the marked bar |
| `mobile-hang` | build | "Hang every weight on a hook so all bars hang level." | Bottom-up: arms `a, b ∈ 1…3` for each two-hook bar; the masses below split as `b : a` of the total (§ 10.1). Tray = all weights. | assignment; unique up to equal masses (prototype: 100 %, Appendix C) |
| `mobile-string` | build (medium+) | "Tie each string so its bar hangs level." Weights already hang; each bar's string hole can be moved. | Constructed; each bar has one hole that balances it. The player discovers that the bottom bar must be solved first, because its total weight acts on the bar above. | unique hole per bar |

### 9.3 Stack

| Id | Kind | Task text (en) | Construction | Answer |
|---|---|---|---|---|
| `stack-predict` | predict | "When you let go, does it stand?" Options: Stands · Falls to the left · Falls to the right. Hard adds: "Which joint gives way?" (tap or choose a joint). | Random single-column stacks with cubes; **at most one failing joint** (so "which joint" and the direction are well defined); trap and margin rules. | verdict (+ joint on hard) |
| `stack-overhang` | build | "Slide the blocks so the top one reaches as far past the table edge as you can — at least to the flag." | n blocks (easy 2, medium 3, hard 4); flag = target (below). | overhang ≥ target and stands |
| `stack-counter` | build | "The bucket hangs from the plank's tip. Put the cubes on the plank so it holds." (medium 2, hard 3 cubes; on hard the plank's position is free too.) | A holding configuration is drawn, then the cubes go to the tray; the start must fall. | any placement that stands |

**Overhang targets** (block 24 cm; the best possible on the 1 cm grid, by the top-down greedy rule and confirmed by exhaustive search, Appendix C):

| Blocks | Best on the grid | Continuous best (L/2 · Hₙ) | Target |
|---|---|---|---|
| 2 (easy) | 18 cm | 18 cm | **15 cm** *(calibrate 14–18)* |
| 3 (medium) | 22 cm | 22 cm | **20 cm** *(calibrate 19–22)* |
| 4 (hard) | 25 cm | 25 cm | **25 cm** — the top block lies entirely beyond the table edge |

The review always shows "Your overhang: 23 cm. Best possible with 4 blocks: 25 cm." The best-possible value comes from `bestOverhang(n)` (pure, tested). After a hard overhang task, the explanation adds the one-line fact (Appendix D): with more blocks the reach grows without limit — but very slowly — and with blocks side by side, much further.

---

## 10. Generation and calibration

### 10.1 Constructive generation with guaranteed solvability

All generators are pure functions of `(rng, difficulty, taskId)`; `generateRound(seed, settings)` draws the task list from `createRng(seed)` and stores the tasks in state, so a later generator change never alters a save.

- **Build tasks are generated solution-first**: a valid final configuration (the witness) is made, then parts are moved to the tray or the axle/string/blocks are moved away. The witness is checked by `statics.ts`; a failed check is a bug (the generator throws in tests, retries in production).
- **Unique-answer tasks** (`beam-hook`, `beam-choose`, `beam-axle`, `mobile-hang`, `mobile-string`) are checked by `solve.ts` (brute force: beam ≤ 13 hooks^3 placements with multiset de-duplication; mobile ≤ 6! assignments × string holes; all well under 5 ms). A candidate with a second solution is rejected and redrawn.
- **"Any solution" tasks** (`beam-weights`, `stack-overhang`, `stack-counter`) need only the witness. The check accepts any placement that meets the goal.
- **Mobile masses**: for a bar with arms `a` (left) and `b` (right) from the string and a total `T` below it, the left side carries `T·b/(a+b)` and the right `T·a/(a+b)`; a candidate with non-integer or out-of-range masses (outside 1–9 kg) is redrawn. Additional rule: at least 2 distinct masses on easy, 3 on medium and hard, and no bar with `a = b` on hard (otherwise the task degenerates into "equal weights on equal arms").
- **Overhang**: no generation beyond n; the flag sits at the target.
- **Retry bound**: at most 200 candidates per task *(calibrate)*; after that a fixed fallback task per (taskId, difficulty) from a small hand-made table (`src/fallbacks.ts`, checked by tests). The slow test records the fallback rate (must be < 1 %).

### 10.2 Predict calibration: traps and margins

Random scenes are mostly easy to guess, and a naive rule is often right by luck. The prototype measured that "the side with more kilograms goes down" gives the wrong answer for only about 16 % of random beams, and exact balances occur in about 1–4 % (Appendix C). Predict items are therefore **selected**, not just drawn:

- **Naive rules** (`src/naive.ts`, pure, tested): beam/mobile — compare total kilograms per side, ignoring distances; stack — "it stands if every block's middle is over the block below" (a local check that ignores what rests on top), and "a block entirely past the table edge must fall".
- **Trap share:** in a round, at least ⌈1/3⌉ of the predict items on easy and ⌈1/2⌉ on medium and hard are items where a naive rule gives the wrong answer.
- **Exact cases:** on medium and hard, a round with ≥ 2 predict items contains at least one exact balance (beam/mobile) or edge case (stack) that *looks* unbalanced (e.g. 3 kg at 4 against 4 kg at 3; 2 kg + 2 kg at 3 against 3 kg at 4).
- **Margin** = |net| / Σ|individual moments| (stack: distance of the centre of mass from the nearer contact edge, relative to the contact width). Easy ≥ 0.25, medium ≥ 0.08, hard any (0 included) *(calibrate)*.
- **Balance of answers:** over a round, no answer option is the correct one for more than half of the predict items; never three equal answers in a row.

### 10.3 Difficulty table

| Lever | easy | medium | hard |
|---|---|---|---|
| Beam hooks | ±4 | ±6 | ±6, axle may be off-centre, bar weight counts |
| Weights per scene | 2–3, 1–4 kg | 3–5, 1–6 kg | 4–7, 1–9 kg |
| Mobile | 1–2 bars, ≤ 3 weights | 2 bars, ≤ 4 weights | 3 bars (incl. 3 levels deep), ≤ 6 weights, no equal arms |
| Stack | 2–3 bodies, ≤ 1 cube | 3–4 bodies, ≤ 2 cubes, planks | 4–5 bodies, ≤ 3 cubes, stone blocks, edge cases |
| Predict margin | ≥ 0.25 | ≥ 0.08 | any |
| Live turning-effect bars / centre-of-mass markers while building | always on | on request (hint step 2) | on request (hint step 2) |
| Joint question in stack-predict | — | — | yes |
| Task pool | predict, `beam-hook`, `beam-weights` (1 weight), `mobile-hang`, `stack-overhang`, `stack-counter` (1 cube) | + `beam-choose`, `mobile-string` | + `beam-axle` |

A round's task kinds come from the pool of the chosen benches; within a bench, the generator cycles through the pool so a round does not repeat a task id until the pool is used up.

---

## 11. Hints, checking, scoring and finish

### 11.1 Hints (graduated; each step is a button, never automatic)

1. **"Think about…"** — a short tip for the task (content, e.g. "A weight twice as far from the axle turns twice as hard." / "Which bar must you balance first?" / "Where is the middle of everything above this joint?").
2. **"Show the turning effects"** (beam, mobile) / **"Show the centres of mass"** (stack) — the live explanation layer of § 12 while building (always on in easy, so no hint is counted there).
3. **"Show me a solution"** — the witness moves into place (animated, or instantly with reduced motion); the task counts as *shown*.

Predict tasks have step 1 and "Skip — just show me".

### 11.2 Checking

- **Build:** "Let go" evaluates the current arrangement. If the goal is met, the task is *solved*. If not, the outcome and its reason are shown; "Try again" puts everything back where it was before letting go (the draft is kept). Tries are unlimited and **not counted**.
- Build tasks that require all tray parts keep "Let go" enabled anyway; letting go with parts left in the tray says "Some weights are still in the tray" and is not evaluated (no outcome shown).
- **Predict:** choosing an option and pressing "Let go" commits it; the outcome animation and the explanation follow. Matched or not, the explanation is the same.

### 11.3 Marks and summary

- Per task: build — `solved` · `solved-with-help` (hint step 2 used on medium or hard; step 1, "Think about…", is free) · `shown`; predict — `matched` · `different` · `skipped`.
- Shown as words plus symbols: ●●● "Solved", ●●○ "Solved with help", ●○○ "Shown"; predict "Just as you said" / "It went another way" / "Skipped". Never red crosses or "wrong".
- **Summary** after the last task: "Predicted 2 of 3 (1 skipped)", "Built 3 of 3, 1 with help", the overhang line if there was one ("23 cm of a possible 25 cm"), and one neutral closing remark per bench from the content (e.g. "Levers: the side with the larger kilograms × steps goes down — not the side with more kilograms."). No comparisons with earlier rounds; nothing is stored across rounds.
- `finished({ outcome: 'completed', stats: { predicted, matched, built, solved } })` once (`reported` guard). Reopening a finished save shows the summary. The host offers "Another round" or "Change settings"; the game never starts the next round itself.

---

## 12. Explanations (pure data in `src/explain.ts`; SVG in `src/explain-view.ts`)

The explanation panel is a `<details>` "Why?" that opens automatically after "Let go" (and stays as the player leaves it for the rest of the round — a per-round view flag in state). Formulas are inside a second, closed `<details>` "The formula".

- **Beam — turning-effect bars.** Below the bar, a horizontal bar chart centred on the axle: each weight is one segment, drawn on its side, length ∝ its moment, labelled "3 kg × 2 = 6". Left segments carry a diagonal hatch, right segments a dot pattern, and the side is also written ("Left 12 · Right 10"). The verdict sentence: "Left 12, right 10: the left side wins by 2 and goes down." The bar's own weight, when it counts, is a segment of its own ("bar 4 kg × 1 = 4"). Formula: `Σ m·d (left) = Σ m·d (right)`.
- **Mobile.** The same bars per bar, small, beside each bar; sub-mobiles are labelled with their total ("this part: 6 kg"). The sentence names the bar ("Bottom bar: 2 × 3 = 6 left, 3 × 2 = 6 right — level. Top bar: …").
- **Stack — centres of mass.** For each joint: a ⊕ marker at the centre of mass of everything above it, a dashed plumb line down to the joint, and the contact segment marked with brackets ⟦ ⟧. A failing joint gets a "✕ tips" label with an arrow showing the direction; an edge joint a knife-edge symbol and "edge". The sentence: "The top two blocks have their centre of mass 3 cm beyond the edge of the block below, so they tip to the right." Formula: `x_centre = Σ m·x / Σ m`, with the numbers filled in (one decimal).
- **Overhang review.** The best stack is drawn faintly behind the player's (on request, "Show the best stack"), with the reach of each.
- **Text equivalent** of every picture (`src/describe.ts`, pure): the same numbers as a list, used as the SVG's accessible description and as the screen-reader route (§ 16).

---

## 13. Input and interaction

### 13.1 Pointer and touch

- **Drag and drop:** drag a weight from the tray to a hook (beam, mobile) or a cube to a body top; drag a block or plank sideways (stack). Pointer events with pointer capture; a 6 px threshold separates a tap from a drag; the drop snaps to the nearest valid place, previewed while dragging (ghost weight + label "hook 3 right").
- **Tap, then tap:** tap a tray weight (it is selected, `aria-pressed`), then tap a hook. The whole bar strip (≥ 44 px tall) is the target and snaps to the nearest hook, so narrow hook spacing is never a small target.
- **Step buttons** under the scene (each ≥ 44 × 44 px): ◀ / ▶ move the selected weight one hook (or the selected block 1 cm; ◀◀ / ▶▶ 4 cm), "Place", "Back to tray". These alone can do every build action, so every action has a ≥ 44 px route at 360 px width.
- **Placed parts** are also listed as chips under the scene ("3 kg · hook 2 right"), each ≥ 44 px, to select a part in a crowded scene.

### 13.2 Keyboard

- The scene is one tab stop (roving focus inside): ←/→ move between hooks (or bodies' positions), ↑/↓ between bars (mobile) or bodies (stack). Enter/Space picks up or places; Esc cancels a pick-up; Delete/Backspace sends a placed part back to the tray. Stack: ←/→ move the focused body 1 cm, Shift+←/→ 4 cm.
- The tray, the step buttons, "Let go", hints, undo (also Ctrl+Z / Cmd+Z), "Next" are ordinary buttons in reading order. No letter shortcuts (they do not localise well).
- Arrow keys move in the picture's direction in every locale (the scene is not mirrored, § 17.4).

### 13.3 Undo

Every placement change is undoable within the task (`history`, at most 30 entries, oldest dropped). "Reset task" returns to the task's start (also undoable). Undo never reverts a committed prediction or a solved task.

---

## 14. State (plain JSON, `stateVersion: 1`) and migration

```ts
type Side = 'left-down' | 'level' | 'right-down';

type BeamScene = { half: 4 | 6; axle: number; barKg: number; weights: { kg: number; hook: number }[] };
type MobileNode = { kg: number } | { bar: { width: number; string: number; hooks: { pos: number; child: MobileNode | null }[] } };
type StackBody = { kind: 'block' | 'plank' | 'stone'; left: number /* cm */ };
type StackScene = { bodies: StackBody[]; cubes: { kg: number; on: number /* body index */; x: number /* cm */ }[]; bucket?: { kg: number; x: number } };

type Scene = { bench: 'beam'; s: BeamScene } | { bench: 'mobile'; s: MobileNode } | { bench: 'stack'; s: StackScene };

type Outcome =
  | { bench: 'beam' | 'mobile'; sides: Side[] /* per bar, depth-first; beam: one entry */ }
  | { bench: 'stack'; stands: boolean; edge: boolean; failing: { joint: number; dir: 'left' | 'right' }[]; overhang: number };

interface Task {
  id: TaskId;                      // e.g. 'beam-hook'
  scene: Scene;                    // the start, fixed parts in place
  tray: number[];                  // kg of parts to place (stack: cube kg)
  goal: Goal;                      // e.g. { kind: 'level' } | { kind: 'overhang', cm } | { kind: 'stand' } | { kind: 'unique-weight', hook }
  witness: Scene | null;           // build tasks: one valid solution
  draft: Scene;                    // current arrangement (survives reload)
  history: Scene[];                // ≤ 30
  prediction: { choice: number; joint?: number } | 'skip' | null;
  outcome: Outcome | null;         // last "Let go", recomputed and compared in isValidState
  status: 'open' | 'solved' | 'solved-with-help' | 'shown' | 'matched' | 'different' | 'skipped';
  help: 0 | 1 | 2 | 3;             // highest hint step used
}

type BalanceState =
  | { v: 1; mode: 'round'; bench: 'mixed' | 'beam' | 'mobile' | 'stack'; tasks: 'mixed' | 'predict' | 'build';
      difficulty: 'easy' | 'medium' | 'hard'; seed: number; items: Task[]; index: number; reported: boolean; whyOpen: boolean }
  | { v: 1; mode: 'free'; bench: 'beam' | 'mobile' | 'stack'; seed: number; frame: number /* mobile template 0–3 */;
      scene: Scene; history: Scene[]; held: boolean; outcome: Outcome | null; whyOpen: boolean };
```

- `index === items.length` means the summary.
- **`isValidState(x)` never throws.** It checks: the union shape and known ids; all bounds (hooks within ±half, axle a hole, masses 1–9, ≤ 3 weights per hook, ≤ 12 weights, mobile ≤ 3 bars / ≤ 6 weights / depth ≤ 3 / no hook at the string hole, stack ≤ 6 bodies and ≤ 8 cubes, contact ≥ 1 cm at every joint, cubes on exposed tops); `history.length ≤ 30`; the draft uses exactly the scene's fixed parts plus a sub-multiset of the tray; the witness meets the goal (statics re-check, cheap); a stored `outcome` equals the outcome recomputed from the draft; `status` consistent with `prediction`/`outcome`/`help`; `index ≤ items.length`; `reported ⇒ index === items.length`; `items.length` equals the round length.
- **Determinism:** `generateRound(seed, settings)` is pure; `reset()` regenerates the same round. The free bench draws nothing (seed kept for the contract).
- **Transitions** (`rules.ts`, pure): `pick`, `place`, `move`, `unplace`, `undo`, `resetTask`, `predict`, `skip`, `letGo`, `tryAgain`, `hint`, `showSolution`, `next`, `toSummary`, `markReported`, `toggleWhy`; free bench: the same placement moves plus `addPart`, `hold`, `setFrame`, `clear`. `requestSave()` after each.
- **Migration:** additive changes keep version 1; an incompatible change bumps it with `migrateState`. An unmigratable save is reported as corrupt, which is acceptable: a round takes minutes.
- `pause()` cancels a running animation (jumping to the final pose) and blocks input. Nothing runs on a timer that matters for correctness.

---

## 15. UI layout

### 15.1 Desktop (≥ 48 rem)

Two columns: the **scene** (inline start, ≈ 3/5; SVG, aspect 16 : 10) with the tray strip under it; the **task panel** (inline end, ≈ 2/5): "Task 3 of 6 · Beam", the task text, predict options or the build controls, "Let go", hints, then the "Why?" panel. Bottom of the panel: "Next" (after an outcome).

### 15.2 Phone (360 px)

One column: task line; the scene (full width, aspect 4 : 3, the stack bench scrolls horizontally only inside its own frame if the stack is wider than the table view — never the page); the tray as a wrapping row of 44 px chips; the step buttons; the "Why?" panel. A sticky bottom bar holds "Let go" (or "Next") and "Undo". Text never below 16 px.

### 15.3 Art direction

Calm, code-drawn SVG: a light workshop wall, a wooden bar with round hooks, weights as cylinders whose **height grows with their mass** and whose label shows the kg; blocks with wood grain, stone blocks with a stone pattern, cubes with their kg. Light and dark via tokens; forced-colours friendly (patterns and labels carry the meaning, § 16).

---

## 16. Accessibility

- **Never colour-only:** sides by position, words and hatch/dot patterns; weights by number and size; outcome by text and arrow; failing joints by "✕ tips" and an arrow; edge joints by a symbol and the word "edge".
- **Screen readers:** every predict task is answerable from the text description (`describe.ts`): "Bar with the axle in the middle. Left: 3 kg at 2 steps, 1 kg at 4 steps. Right: 2 kg at 3 steps." Build tasks are fully operable with the keyboard and announced ("3 kg weight on hook 2, right side"). After "Let go", one polite announcement: "Released. The left side goes down: left 10, right 6."
- The scene SVG has `role="img"` with `aria-labelledby` (title = task, description = `describe.ts` text); the interactive layer is a roving-tabindex group of buttons with accessible names (no `role="application"`).
- 44 px targets everywhere (§ 13.1), visible focus rings, `prefers-reduced-motion` and `context.reducedMotion` respected, no flashing.
- Logical CSS properties throughout; the scene itself is `direction: ltr` (§ 17.4).

---

## 17. Localisation

### 17.1 Files

- `src/messages.ts`: catalogue keys (`title`, `tagline`, `rules`, `difficulty.*`), settings labels and hints, buttons, outcome templates, marks, summary templates, accessible-name templates — about 110 keys, all 16 locales.
- `src/content/<locale>.ts` (ADR 0011, `preload`): the longer texts — rules help and model limits, the "Think about…" tips per task id and bench, closing remarks, facts (Appendix D) — about 50 entries per locale. `src/content/index.ts` holds `CONTENT_LOADERS`, `preloadContent`, `contentFor` (ecosystem pattern).

### 17.2 Terms

Appendix B is the glossary (moment/turning effect, axle, hook, centre of mass, overhang, joint, mobile, counterweight). en and de are binding; the others are drafts to check.

### 17.3 Numbers and units (`src/format.ts`, pure, tested)

`Intl.NumberFormat(locale, { style: 'unit', unit: 'kilogram' | 'centimeter' })` for masses and lengths; plain integers for moments ("3 kg × 2 = 6"), and steps with plural rules (`Intl.PluralRules`). Centres of mass with at most one decimal. Locale digits follow `Intl` (fermi-lab pattern).

### 17.4 RTL

The scene is physical: left and right mean the picture's left and right, so the SVG and the scene controls are wrapped in `dir="ltr"` and never mirrored. Texts say "left"/"right" as absolute sides, each with an arrow glyph that points the same way in every locale (the rules help says so in one line). Everything around the scene (panel, tray, buttons) follows the page direction with logical properties. The ◀ ▶ step buttons live inside the `ltr` scene controls.

### 17.5 Preview locales (ADR 0003 amendment)

**Recommended: ship all 16 locales at once** (owner question 3). The text volume is moderate (no per-task prose content like Estimation Lab or Sense of Time), the terms are standard school physics with stable translations in every locale, and partial locales are reserved for games the owner releases as previews. Fallback if the owner prefers speed: en/de as a preview (`locales: ['en', 'de']`, `status: 'preview'`), with the 14 others in a follow-up.

---

## 18. Preview (catalogue SVG, for the orchestrator)

Decorative, `aria-hidden`, the shared 96 × 64 viewBox, classes and tokens. Left 60 %: a bar on a triangular stand, level, with two hanging weights of different heights at different distances (the taller one nearer the axle). Right 40 %: the edge of a table with three blocks stacked so the top one reaches beyond the edge, and a small dashed plumb line. No text; not mirrored in RTL.

---

## 19. Module layout and mutation targets

### 19.1 Files

```
src/metadata.ts, src/messages.ts, src/index.ts (settings, settingsOf, preload)
src/statics.ts     beam/mobile/stack verdicts, centres of mass, joints, overhang (pure, integer)
src/solve.ts       brute-force solution counting, bestOverhang(n) (greedy) (pure)
src/naive.ts       the naive rules for trap selection (pure)
src/generate.ts    generateRound and per-task generators (pure; rng passed in)
src/fallbacks.ts   hand-made fallback tasks (data)
src/explain.ts     explanation data: segments, markers, sentences' parameters (pure)
src/describe.ts    text descriptions for screen readers (pure; takes the translator)
src/motion.ts      cosmetic keyframes from verdict + geometry (pure)
src/layout.ts      world → pixel geometry, hit zones, snapping (pure)
src/format.ts      Intl formatting (pure)
src/rules.ts       state, transitions, isValidState, settingsOf (pure)
src/view.ts, src/scene-view.ts, src/explain-view.ts, src/styles.css
src/content/index.ts, src/content/<locale>.ts
```

### 19.2 Stryker `mutate` lines (orchestrator; `rules.ts` is covered by the glob)

`packages/games/balance-lab/src/statics.ts`, `src/solve.ts`, `src/naive.ts`, `src/generate.ts`, `src/explain.ts`, `src/layout.ts`. Never `src/fallbacks.ts` or `src/content/**` (data).

---

## 20. Test plan

### 20.1 Fast tests (TDD + fast-check; mutation-relevant)

Files: `test/statics.test.ts`, `test/solve.test.ts`, `test/naive.test.ts`, `test/generate.test.ts`, `test/explain.test.ts`, `test/layout.test.ts`, `test/rules.test.ts`.

- **Statics, table tests:** hand-computed beams (incl. 3×4 vs 4×3, the bar's own weight with an off-centre axle), mobiles (one, two and three levels), stacks (centred, edge-exact, failing left, failing right, two failing joints, cube on top saving a stack, the bucket and plank).
- **Statics, properties (fast-check over generated scenes):**
  - *mirror symmetry:* reflecting every position (x → −x; stack: about the table edge with the table mirrored) swaps left-down ↔ right-down and keeps level/stands;
  - *scaling:* multiplying every mass by k ≥ 1 never changes a verdict; multiplying every distance by k ≥ 1 (beam/mobile) neither;
  - *superposition:* `net(A ∪ B) = net(A) + net(B)`;
  - *axle weights:* adding a weight at the axle never changes a beam verdict;
  - *monotonicity:* moving a weight one hook further out on the side that goes down never makes the beam level;
  - *swap rule:* m kg at d steps on the left and d kg at m steps on the right always balance (masses and distances swapped);
  - *mobile substitution:* replacing a level sub-mobile by a single weight of its total mass never changes any verdict above it;
  - *centre of mass:* lies within [min x, max x] of the parts; translating the whole stack and the table edge together changes nothing;
  - *two formulations agree:* the centre-of-mass form (§ 8.4) equals the moment-about-edges form (`Σ m·(x − lo) ≥ 0 ∧ Σ m·(x − hi) ≤ 0`), written independently in the test;
  - *every-body-centred stacks stand;* a stack verdict equals the conjunction of its joints.
- **Solve:** solution counts equal an independent enumeration in the test for small cases; `bestOverhang(n)` equals 18, 22, 25 for n = 2, 3, 4 (block 24 cm) and is ≤ ⌊12·Hₙ⌋ for n ≤ 8; the greedy stack stands.
- **Naive:** each rule on its table cases; trap detection agrees with `statics` on generated scenes.
- **Generate (properties over seeds × settings):** determinism; every build task's witness meets its goal; the start does **not** meet it; unique tasks have exactly one solution (by `solve.ts`); all bounds of § 14; predict items obey the trap share, margins, exact-case and answer-balance rules of § 10.2; mobile mass rules; stack-predict has at most one failing joint; no repeated task id before the pool is used.
- **Explain:** segments sum to the net moment; the verdict sentence's parameters equal `statics`; markers at the exact centres; edge flags exactly at equality.
- **Layout:** hit zones ≥ 44 px tall; snapping picks the nearest hook and is idempotent; nothing outside the scene at 328 px width; RTL does not change the geometry.
- **Rules:**
  - every transition, incl. `letGo` → outcome, `tryAgain` restores the draft, undo bounds (30), hint steps and status, `showSolution` sets `shown`, predict commit once, `reported` once;
  - random action sequences never throw and keep `isValidState`;
  - `settingsOf` round trip over every setting combination;
  - `isValidState`: `fc.anything()` never throws; generated states are valid; tampered fields are rejected (mass 0 or 10, hook outside the bar, 4 weights on one hook, contact < 1 cm, cube on a covered top, witness that does not balance, stored outcome ≠ recomputed, history > 30, `reported` early, unknown task id).

### 20.2 `test/content.test.ts`, `test/format.test.ts`, `test/view.test.ts`

- Content: every locale loads through `CONTENT_LOADERS`; same keys and placeholders as en; a tip for every task id × bench.
- Format: units and plurals in en, de, ar, hi, zh-Hans; one decimal for centres.
- View (jsdom): renders every bench and task kind; keyboard placement path; tap-tap path; step buttons; "Let go" announces; reduced motion gives the final pose at once; the scene wrapper has `dir="ltr"` on an RTL page; no answer leaks into the DOM or accessible names before "Let go" in predict tasks (no verdict text, no outcome class).

### 20.3 Slow tests (`*.slow.test.ts`, ADR 0021: `pnpm test` and the CI `long` job, not Stryker)

- `generate.slow.test.ts`: 2,000 rounds per difficulty and bench; records the fallback rate (< 1 %), the trap share, the margin distribution and the generation time (p99 < 20 ms per round *(calibrate)*).
- `overhang.slow.test.ts`: exhaustive search over all grid placements for n ≤ 4 (block 24 cm) confirms `bestOverhang` (prototype: ≈ 0.5 s for all cases, Appendix C).
- Each stays under 50 % of its timeout under load.

### 20.4 Contract (`test/contract.test.ts`)

`runGameContract(module, { interact })` — `interact` places one tray weight and presses "Let go". The suite also covers every setting combination via `settings` sampling.

### 20.5 E2E (`e2e/games/balance-lab.spec.ts`)

- `startGame` with each mode; `chooseSetting` for bench, tasks and difficulty.
- A predict task answered by clicking an option and "Let go"; the explanation opens.
- A build task (`beam-hook` on easy, seed fixed) solved with the **keyboard only**; another with the step buttons at a 360 × 740 viewport (no horizontal page scroll asserted).
- `expectResumeAfterReload` in the middle of a build task with one weight placed (the draft survives), and on the summary.
- The free bench: add, let go, hold again, reload, still there.
- An RTL locale (ar): the scene is not mirrored; "Let go" works.
- Run with the pipeline gate command.

---

## 21. Performance and bundle budget

- Game chunk ≤ 60 kB gzip *(calibrate)* without content; each content chunk ≤ 12 kB gzip.
- Generating a round < 20 ms p99 on a mid phone (statics are O(n), solvers bounded as in § 10.1).
- SVG ≤ 400 nodes per scene; animations with `requestAnimationFrame`, transforms only.

---

## 22. Risks

| Risk | Mitigation |
|---|---|
| Too close to PhET's "Balancing Act" | Different title; hooks-and-axle lever kit, mobiles and stacks; no names, objects, layouts or star scoring copied (§ 1.1). |
| Hooks too dense at 360 px | Strip-wide snapping, step buttons and part chips give a ≥ 44 px route for every action (§ 13.1); layout tests. |
| Predict items feel like guessing or are trivial | Trap shares, margins and exact cases measured in slow tests (§ 10.2); "Skip — just show me"; the explanation is the reward. |
| Edge case ("balanced on the edge") confuses players | One defined rule (closed interval), labelled outcome and a sentence about real-life nudges; tested at equality. |
| Mobile bars stopping at 25° look unphysical | Stated plainly in the rules help (§ 8.6); the verdict never depends on the angle. |
| Players expect sliding or friction | The help says why friction does not matter here (§ 8.7). |
| Scope: three benches plus a free bench | Benches are independent; § 23 builds beam → stack → mobile → free bench. If time runs short, the orchestrator may release without the mobile bench and the free bench (owner question 2). |
| Animation code entangled with logic | `motion.ts` is pure keyframes from the verdict; state stores only the verdict; view test with reduced motion. |

---

## 23. Implementation steps (one implementer)

1. **Statics core (tests first):** `statics.ts` with the table tests and all properties of § 20.1; `solve.ts` with `bestOverhang`; `naive.ts`.
2. **Generators:** `generate.ts` for the beam, then the stack, then the mobile; `fallbacks.ts`; the generator properties and `generate.slow.test.ts`, `overhang.slow.test.ts`. Record the measured trap shares and fallback rates in the implementation notes.
3. **State and transitions:** `rules.ts` (`BalanceState`, `generateRound` wiring, transitions, `isValidState`, `settingsOf`, marks, summary) with fuzz tests.
4. **Explanations and text:** `explain.ts`, `describe.ts`, `format.ts`, `motion.ts`, `layout.ts` with tests.
5. **Text:** `messages.ts`, `content/en.ts`, then `de`, then the other 14 (Appendix B terms); content tests.
6. **View:** `scene-view.ts` (three benches, drag, tap-tap, keyboard, step buttons, chips), `explain-view.ts`, `view.ts` (panel, predict options, hints, "Let go", summary, free bench, preferences), `styles.css` (logical properties, forced colours, 360 px); `index.ts` with `settings`, `settingsOf`, `preload`; `test/view.test.ts`.
7. **Contract and e2e:** `test/contract.test.ts`, `e2e/games/balance-lab.spec.ts`; the full gate (`pnpm check`, `pnpm build`, the e2e command of the pipeline brief).
8. **Report to the orchestrator:** registry line (append), dependency, preview (§ 18), ROADMAP row (skills spatial/hypothesis), Stryker lines (§ 19.2), Appendix A, chunk sizes, calibration changes.

---

## 24. Open questions for the owner (max 4, each with a recommendation)

**Owner decisions (2026-10-27): all four recommendations accepted** — title "Weight & Balance" / "Gewicht & Gleichgewicht"; all three benches plus the free bench; all 16 locales at once; a short tipping animation computed from the exact verdict (≤ 0.7 s, instant with reduced motion).

1. **Title.** (a) **"Weight & Balance" / "Gewicht & Gleichgewicht"** — recommended: says what you work with, matches "Pond & Meadow" and "Tones & Chords", avoids the PhET screen name. (b) "Balance Lab" / "Gleichgewichtslabor" — the working title; fits Flow Lab and Estimation Lab, but is the name of a screen in PhET's balance simulation, whose game asks similar questions. (c) "Lever & Ledge" / "Hebel & Kante" — playful, but the mobile bench is neither.
2. **Scope of the first release.** (a) **All three benches (beam, mobile, stack) plus the free bench** — recommended: one shared statics core makes the extra benches cheap, and the mobile bench is where the idea "a whole sub-mobile acts like one weight" clicks. (b) Beam and stack first, mobile and free bench in a follow-up (about 30 % less work). (c) As (a), plus a fourth bench "Scales" with odd-coin weighing puzzles (logic rather than physics; about 25 % more work).
3. **Languages.** (a) **All 16 locales at once** — recommended: moderate text, standard school terms, no preview label needed. (b) English and German first as a "Work in progress" preview (ADR 0003 amendment), the other 14 later.
4. **What happens on "Let go".** (a) **A short tipping animation computed from the exact verdict** (≤ 0.7 s, instant with reduced motion) — recommended: shows the outcome without letting numerics decide. (b) Only a before/after picture, no motion. (c) A real falling simulation from a shared physics package extracted from Stack Duel, with lower friction — not recommended: results near the edge would no longer be exact, and the orchestrator would have to extract and maintain the engine.

---

## Appendix A — row for `docs/third-party.md` (ready to paste)

```markdown
| *Weight & Balance* statics, generators, pictures and texts (`packages/games/balance-lab/src/`) | Project license (written for Worthwhile Play; the law of the lever, centre of mass and the tipping criterion are textbook physics stated in our own words; facts cited in Appendix D of `docs/design/balance-lab.md` are paraphrased, no text or figure copied; all scenes are own SVG drawn in code, no images or fonts added; no names, layouts or art from existing balance simulations; non-en/de AI-assisted) | Scenes, puzzles and explanations of *Weight & Balance* |
```

---

## Appendix B — terms (glossary for translators; en and de binding, the others a draft to verify)

| en | de | Note |
|---|---|---|
| turning effect (moment, torque) | Drehwirkung (Drehmoment) | "turning effect" in the UI; "torque" only in the formula details |
| axle | Achse | the bar turns on it |
| hook | Haken | where weights hang |
| bar | Stange / Balken | beam bench: "Balken"; mobile: "Stange" |
| step (distance unit) | Schritt | the spacing between hooks |
| pin (holds the bar) | Stift | removed by "Let go" |
| Let go | Loslassen | the release button |
| level | waagerecht | "stays level" = "bleibt waagerecht" |
| left side down | links runter | answer option |
| centre of mass | Schwerpunkt | |
| support / contact | Auflage | the contact segment of a joint |
| joint | Fuge | where one block lies on another |
| overhang | Überhang | |
| table edge | Tischkante | |
| counterweight | Gegengewicht | |
| mobile | Mobile | the hanging sculpture |
| string | Faden | |
| balanced on the edge | genau auf der Kante im Gleichgewicht | the edge outcome |

---

## Appendix C — prototype evidence (planner, 2026-10-27; plain JS, mulberry32, discarded after measuring)

- **Overhang on a 1 cm grid, block 24 cm** (single column, closed interval, ≥ 1 cm contact): the top-down greedy rule (each lower block's outer edge at the centre of mass of everything above, rounded up to the grid) and an exhaustive search over all placements agree: n = 1: 12, 2: 18, 3: 22, 4: 25 cm (exhaustive for n ≤ 4); n = 5 greedy 27 cm (continuous 27.4). Greedy placements for n = 4 (left edges, bottom to top): −21, −17, −11, +1 — the top block starts 1 cm past the edge. With a 12 cm block the grid optimum for n = 4 is 12 (continuous 12.5), so 24 cm was chosen: n ≤ 4 reach the exact continuous optimum. Total run time 0.6 s.
- **Beam build** (balanced scene drawn, k weights moved to the tray, start not level; 300 tasks each): easy (3 weights, k = 1, ±4, 1–4 kg) — 100 % unique; medium (5 weights, k = 2, ±6, 1–6 kg) — 1 solution 13 %, 2–3 solutions 55 %, 4+ 32 %; hard (6, k = 3, 1–9 kg) — almost always 9+ solutions. Hence `beam-weights` is "any solution", and uniqueness comes from `beam-hook`, `beam-choose` and `beam-axle` instead.
- **Beam predict, random scenes** (2,000 each): the "more kilograms goes down" rule is wrong for 16–17 % at every level; exact balances occur in 3.5 % (easy) and about 1 % (medium/hard). Hence the selection rules of § 10.2.
- **Mobile hang** (bottom-up masses, arms 1–3; shapes two bars, two bars under one, three levels deep; 300 each, weights ≤ 6 or ≤ 9): every candidate built within the retry bound; the assignment of tray weights to hooks was unique (up to equal masses) in 100 %; all-distinct masses only in 6–35 %, hence the distinct-mass rule of § 10.1.

---

## Appendix D — references (for facts in explanations; paraphrased, never quoted at length)

- **Law of the lever:** Archimedes, *On the Equilibrium of Planes*, Book I, Propositions 6–7 (3rd century BCE): magnitudes balance at distances inversely proportional to their weights. Used for one "Did you know" line ("Archimedes wrote down the law of the lever more than 2,200 years ago").
- **Harmonic stack (overhang ½·Hₙ block lengths):** a classic puzzle; Paul B. Johnson, "Leaning Tower of Lire", *American Journal of Physics* 23(4), 240 (1955). The fact used: with enough blocks, the top one can reach as far as you like past the edge, because the harmonic series grows without limit — but very slowly; four blocks already reach beyond one block length.
- **Better stacks with several blocks per layer:** Mike Paterson and Uri Zwick, "Overhang", *American Mathematical Monthly* 116(1), 19–44 (2009); Paterson, Peres, Thorup, Winkler and Zwick, "Maximum overhang", *American Mathematical Monthly* 116(9), 763–787 (2009). The fact used: when blocks may sit side by side, the overhang can grow much faster (about the cube root of the number of blocks rather than its logarithm). The implementer checks the page ranges before shipping; the explanation names only the authors and the year.
- **Tipping criterion and neutral equilibrium:** standard introductory mechanics (any first-year statics text); no specific source is quoted.
