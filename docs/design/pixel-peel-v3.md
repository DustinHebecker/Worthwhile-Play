# Pixel Peel v3 (`pixel-peel`): fair hard games, slow peeling, one-screen phone play

Status: **Plan (2026-10-29)**, written by the planner of this rework. The implementer follows it and the reviewer checks against it. It amends `docs/design/pixel-peel.md` (v1) and `docs/design/pixel-peel-v2.md` (v2). Anything not mentioned here stays as v2 (with its implementation notes, § 15) specifies it: identity, value claims, **all mechanics of v1 § 4** (track, fronts, launch with laps, legality, parking, undo, restart), art pipeline, motifs, policies, hint, settings and state. Numbers marked *(calibrate)* are first values; the implementer may tune them within the stated bounds and records the final values in an "Implementation notes" section at the end of this file.

Binding inputs: `CLAUDE.md`; `docs/spec/implementation-brief.md` (Definition of Done; "never require timers for correctness"; no artificial waiting); ADR 0002, 0006, 0017, 0021; v1 and v2 design docs.

## 0. Owner feedback and what this plan changes

Owner, 2026-10-29 (translated):

1. "On hard, decisions made at the very start are sometimes decisive, but at that moment their effect wasn't visible. Extreme case: a wrong first move that only shows near the end. Please rework this."
2. "I'd like to slow the game flow down. In the example I showed you, small ants remove the pixels slowly; that way they also reach nooks, but sometimes only after the ant in front of them is done — until then they wait in the (colour) box. You don't have to copy it 1:1, but this slow peeling is part of what makes it relaxing; being able to choose the next move immediately is not as relaxing."
3. "On the phone I have to scroll a lot between clicks to see the picture, the feedback message and the colours."

Owner addition (same day): slow peeling must be **optional**, a per-device display preference; with it off, behaviour stays as today. The owner wants to try both before deciding, so the switch must be easy to reach during play and take effect at once.

| Point | Finding (§ 1) | v3 decision |
|---|---|---|
| 1 Fairness on hard | In today's hard games a stuck player made the fatal move a median **11** moves (p90 **32**, max 67) before the dead end showed; in **15 %** of dead ends the fatal move was among the first 5 moves; **10–15 %** of puzzles have a first move that already decides the game, and it is usually a good-looking move (a shooter used up with 37–88 hits). The cause: decoys wait in a waiting place for most of the game (longest wait median **93** of ~120 moves; all 4 places full for 66 moves). | **Bounded waiting horizon** in the hard generator (§ 2.2): a parked shooter is steered back within about 20 construction steps, and decoys only use colours that are reachable now. Measured on the prototype: fatal-move delay median **4**, p90 **17**; no fatal move among the first 5 moves (0 of 466 dead ends); first-move dooms 1 of 360; all five rules of thumb still fail in **98 %**. Plus an **opening guard** (§ 2.3) that proves every first move can still be finished, and a stuck panel that offers the safe move number directly (§ 2.4). No automatic "doomed" warning (§ 2.5: not reliable enough to be honest). |
| 2 Slow peeling | Today a launch pops its pixels in ≤ 900 ms and any input skips that. | A **"Peeling" display preference: Slow · Quick · Off**, default **Slow** (§ 3). In Slow, a shooter token walks the track and peels its pixels one by one; later launches **queue** at the start of the track and run when the one ahead is done. The game state is committed at once; the queue is presentation only and never blocks input. Quick = today's animation; Off = instant. Reduced motion forces Off. |
| 3 Phone layout | Between the top of the picture and the bottom of the lane fronts there are **572–668 px** (square 48: 668), plus **154 px** of queued chips; phone browsers with their bars show **~640–664 px**. With the queue in view, the status line lies **under the sticky picture**. The game starts **591 px** down the page. | A **one-screen play unit** on narrow portrait screens (§ 4): title line, picture, a 3-line status, waiting places, lane fronts with 2 queued chips each, and an action row fit in `100svh`; notices (stuck, hint target) overlay the picture instead of pushing the lanes down; secondary panels follow below; the page scrolls the unit into view once when play starts. Landscape and desktop keep the side-by-side layout. |

No state change: `stateVersion` stays **2**, no save migration (§ 5).

## 1. Measurements

All numbers come from throwaway scripts in this container (Node 22, 4 cores; Chromium for the layout), on the code of `origin/claude/orchestrator-2` at 4e1083e. The scripts are not committed; the method is described so the implementer can rebuild the benchmark (§ 6.1).

### 1.1 Method for "doom" and "doom delay"

- **Doomed** = no solution exists from a position. **Stuck** = no legal move (v1 § 4.5). A doomed position always ends stuck, but possibly much later.
- Exact solvability is out of reach at 48–64 cells and ~70 shooters (v2 § 3.7), so solvability is decided by a one-sided **oracle**: a position is *solvable* when any of these finds a solution: "follow the plan" (P0 of v2 § 4), the policies P1–P4, 40 noisy rollouts (noise 5–30 %, around P0, tidy and cautious), then a plan-guided depth-first search with a failure memo (4 000 nodes). If none finds one, the position counts as *doomed* (proven when the search space was exhausted, otherwise "no way found").
- **Players:** the five rules of thumb that define hard (obvious, tidy, cautious, noisy tidy; v2 § 3.3) and, in § 1.2, "plan with slips" (follows the stored plan, picks a random legal move 10 % of the time: a good player who slips now and then).
- For each run that ends stuck after `t` moves, the **latest solvable position** `k` is found by stepping back 1, 2, 4 … moves and then bisecting (solvability only goes from yes to no along one run). The **fatal move** is move `k + 1`; the **doom delay** is `t − (k + 1)`, the number of moves the player makes after the fatal move before the game shows "No move left".
- The oracle can miss solutions, so a delay is an **upper bound**. A check with a 5× stronger oracle (200 rollouts, 25 000 nodes) on 40 sampled doom points confirmed 27, moved 13 later, and changed the median delay of the sample from 17 to 14.5 moves. The comparison in § 2 uses the same oracle for every variant, so it is fair even where it is not exact.

### 1.2 Today's hard games

**Runs of the rules of thumb** (20 motifs × 2 seeds × 5 players = 200 runs; 182 stuck):

| | value |
|---|---|
| Fatal move (median / 10th percentile) | move 16 / move 3 |
| Doom delay: median / 75th / 90th percentile / max | 12 / 20 / 26 / 69 moves |
| Dead ends whose fatal move was among the first 5 / first 10 moves | 18 % / 28 % |
| Doom delay ≥ 20 moves | 27 % |
| "Plan with slips" (a good player): solved / stuck; doom delay median, max | 17 / 23; 9, 69 |

**First moves** (20 motifs × 6 seeds = 120 puzzles; 360 first moves that are not the stored plan's):

- 20 of 360 first moves (**5.6 %**) are fatal; **18 of 120 puzzles (15 %)** have at least one. 16 of the 20 are shooters that are used up at once with 29–88 hits: they *look* like the best move. The obvious first move (most hits) is fatal in 2 of 120 puzzles.
- After a fatal first move, the game shows "No move left" only after **15–96 moves** (following the plan: median 44; obvious play: median 37), in games of about 122 moves. This is the owner's "extreme case", and it is not rare.

**Why:** the stored solution (witness) of a hard game parks its decoys early and needs them late. The longest wait in a waiting place has a median of **93 moves**, and all 4 places are full for a median of **66** of ~120 moves. A slip at the start uses slack that is only missed when the waiting places run out, near the end. (Per puzzle, the correlation between the longest wait and the measured delay is weak, −0.14: the delay comes from the structure "places full most of the game", not from one long wait.)

**Cheap checks are not reliable on hard** (relevant to § 2.5): the hint's rollouts (P0 + P1–P4 + 8 noisy runs, ~2 500 launches) find no way from **49.5 %** of positions that the oracle proves solvable in mid-game (1 083 samples), and from 12 % right after the first move. The oracle itself takes 0.2–0.4 s per position on CI (about 1 s on a phone), and a 5× stronger search still overturns a third of its "no way found" verdicts.

### 1.3 Phone layout today

Measured in Chromium with the hard game after 12 moves of its plan (all waiting places in use), positions in CSS px from the top of the page:

| | 390 × 844 wide (winter village 64 × 48) | 390 × 844 square (red fox 48 × 48) | 360 × 640 square |
|---|---|---|---|
| Game title line starts at | 591 | 591 | 591 |
| Picture (board) | 657–917 (260) | 657–1013 (356) | 657–965 (308) |
| Status (reserved 6em) | 929–1025 (96) | 1025–1121 (96) | 977–1073 (96) |
| Waiting places (heading + row) | 1037–1108 | 1133–1204 | 1085–1156 |
| Lane fronts | 1177–1229 | 1273–1325 | 1225–1277 |
| First 7 queued chips end at | 1385 | 1481 | 1433 |
| **Picture top → lane fronts bottom** | **572** | **668** | **620** |
| … including 7 queued chips | 728 | 824 | 776 |

- Real phone viewports with the browser bars shown are about **390 × 664** (Safari) and **360 × 640** (Chrome on a 360 × 740 phone). The unit "picture + status + waiting places + lane fronts" just fits at one exact scroll position; any queued chip does not.
- **The status line disappears:** at 360 × 640, scrolled so the queued chips of lane 1 are visible (scroll 797), the sticky picture covers 0–308 and the status sits at 180–276, i.e. under the picture (screenshot `s360-chips.png`). To read the result of a launch the player scrolls up; to see what comes next in the lanes, down again. This is the owner's "scroll a lot between clicks".
- The stuck panel and the "Undo to move k" row are inserted between status and waiting places (+~110 px), so the lanes jump down when they appear.
- From pressing Start, the player has to scroll ~600 px before the lanes are in view (host header, title, description, tags, "How to play", toolbar).
- Desktop 1280 × 800: the picture (464–860) is taller than the screen below the host header; held sideways (844 × 390) the side-by-side layout works (lane fronts in view with the sticky picture).

Screenshots (scratch, not committed): `p390-full.png` (whole page), `p390-lanes.png`, `s360-lanes.png`, `s360-chips.png` (status hidden), `s390-lanes.png`, `p360-lanes.png`, `desk-top.png`, `land-top.png`, `land-lanes.png`, `p390fox-preview.png`.

## 2. Point 1: fair hard games

### 2.1 Options evaluated

Every generator variant was prototyped and measured with the method of § 1.1 on 20 motifs × 3–6 seeds (60–120 puzzles × 4 players), the baseline with exactly the same pipeline:

| Variant | All 5 rules fail | Rules-of-thumb runs that solve | Doom delay median / p90 / ≥ 25 | Fatal move in first 5 moves | Puzzles with a fatal first move | Generation median / max (CI) |
|---|---|---|---|---|---|---|
| **Today** (K 4) | 100 % | 0.2 % | 11 / 32 / 19 % | 14.6 % | 12 / 120 | 7 / 81 ms |
| Horizon 30, K 4 | 98 % | 4.2 % | 5 / 24 / 10 % | 1.3 % | 4 / 60 | 22 / 98 ms |
| **Horizon 20, K 4** | **98 %** | 2.9 % | **4 / 17 / 5 %** | **0 %** | **1 / 120** | 24 / 118 ms |
| Horizon 12, K 4 | 97 % | 5.4 % | 4 / 11 / 4 % | 0 % | 0 / 60 | 26 / 137 ms |
| Horizon 20, K 3 | 100 % | 0.8 % | 5 / 31 / 13 % | 5.5 % | 7 / 60 | 13 / 112 ms |

The other options:

| Option | Assessment |
|---|---|
| **A. Generator: bounded waiting horizon** (§ 2.2) | Attacks the cause. Halves to thirds the delay, removes early fatal moves, keeps hard beyond the rules of thumb. Costs 3× generation time (still within the phone budget, § 2.6). **Recommended.** |
| **B. Generator: opening guard** (§ 2.3) | Proves that every first move can still be finished (one rollout each). Alone on today's generator it would reject 41 % of candidates and leave move 2–5 dooms untouched; on top of A it rejects 16 % and turns "1 in 120" into "never, proven". **Recommended with A.** |
| **C. Fewer waiting places (K 3)** | Keeps hardness but long delays come back (p90 31): fewer places make the slack run out at unpredictable times. Rejected. |
| **D. Automatic "this can no longer be finished" signal after each move** | Honest only if proven. The cheap check misses half of the solvable mid-game positions (§ 1.2), so it would raise a false alarm in about half of the solvable mid-game positions; the strong check costs ~1 s per move on a phone and still errs a third of the time. As an always-on signal it would also turn hard into "try a move, watch the signal, undo". Rejected as a default and as a setting. The existing Hint stays the honest, on-request check. |
| **E. Show more consequences** (e.g. per colour "shots that will have to wait") | The colours list already shows left / at the edge / shots waiting per colour. Fatal moves arise from the interplay of all four places over many moves; no simple number predicts them. Not pursued now. |
| **F. Mechanic change: send a parked shooter back to its lane** | Removes most dead ends and therefore most of the planning. Rejected (planning must matter). |

**Recommendation:** A + B, plus the small play-side improvement of § 2.4. Hard stays hard: no rule of thumb finishes the picture in 98 % of games, but a wrong decision now shows within a few moves (median 4, 90 % within 17), never only at the very end of the game because of the first moves.

### 2.2 Bounded waiting horizon (hard only)

Changes to `construct` (v2 § 3.2, `src/generate.ts`); medium and easy keep today's rules (`LEVELS[*].horizon = Infinity`).

1. Each slot entry records `since`, the construction step (witness event index) at which the shooter was parked. A parked shooter is **overdue** when `step − since ≥ H` with **`H = 20`** *(calibrate 12–30)*.
2. **Relaunch first:** if an overdue parked shooter's colour is exposed, it is relaunched in this step (before the existing 60 % coin), choosing among overdue ones by `rng.pick`.
3. **Decoys only of reachable colours:** a decoy colour must have at least one exposed cell now (`exposed[c] > 0`), weighted by `clamp(⌊(remaining − reserved) / 16⌋, 1, 20)` (big colour pools first). Today's rule prefers colours that are *not* exposed, which is what makes decoys wait for most of the game. No decoy is placed while any parked shooter is overdue.
4. **Steering:** while a parked shooter is overdue and its colour is not exposed, the fitting-shooter choice is restricted to options whose launch would expose at least one cell of an overdue colour (trial launch on a copy, then `exposedCounts`), when any such option exists. Each trial counts against the budget.
5. Everything else is unchanged: fitting shooters used up exactly, `minShots`, the never-stuck argument of v2 § 3.2 (none of the rules above can make a colour unreachable or overflow a slot), the dealing penalty, the witness check in `createInitial`.
6. **Level parameters for hard** *(calibrate)*: `slots 4`, `candidates 6` (was 4), `budget 18 000` launches (was 10 000; the steering trials and B add work), everything else as v2 § 15.1.

Prototype result (H = 20, 120 puzzles; § 2.1 row): longest wait median 43 moves (was 93); witness length 107 (was 120); slot entries per witness 10 (was 9); candidates tried 2.2 (was 1.07); **all 4 places full at least once in 72 %** (was 100 %). The steering is a preference, not a hard cap, so a few waits stay long; the property tests check the rules (§ 6.1), the benchmark checks the effect.

Consequences for v2 § 2.2 (level definition), recorded as new hard targets:

| Measure (hard) | v2 target | v3 target |
|---|---|---|
| All five policies fail | ≥ 90 % | ≥ 90 % (prototype 98 %) |
| All K slots occupied at least once | ≥ 90 % | **≥ 60 %** |
| At least one zero-hit park in the witness | ≥ 60 % | **dropped**: decoys now always hit something first. Parking remains a legal and useful move for players. |
| Doom delay (benchmark, § 6.1): median / p90 | — | **≤ 6 / ≤ 20** moves |
| Fatal move among the first 5 moves (benchmark) | — | **≤ 2 %** of dead ends |

### 2.3 Opening guard (hard)

After a hard candidate passes the level rule (all five policies fail), the generator checks every **first move other than the witness's first** (at most 3 lane launches; at the start every lane front is legal): from the position after it, "follow the plan" (P0), then P2 (tidy) must find a solution. The first success proves that move can still be finished. If any first move finds none, the candidate is rejected (it counts as not accepted; the fallback rule of v2 § 3.4 still returns the best candidate if none is accepted, so a game always starts).

- Cost: ≤ 3 × 2 rollouts ≈ 2 700 launches on average (measured median ~900 launches per first move), inside the § 2.2 budget.
- Prototype: on the horizon generator 84 % of candidates pass (today's generator: 59 %).
- Result: in every accepted hard game, **no first move can decide the game**, proven by a found solution, not estimated.
- Why not further (moves 2–3): the number of positions grows as 3–4ⁿ and the phone budget would not hold; § 2.2 already removes the early fatal moves in the measurement (0 of 466 dead ends had their fatal move in the first 5 moves).

### 2.4 Play side: a clear way back

The rules stay as they are; two small view changes:

1. **Stuck panel with the way back:** when the position becomes stuck, the view computes the hint's safe point (v2 § 4 step 4, existing code, ≤ 14 000 launches, behind the existing one-frame "Checking…" state) and the panel offers **"Back to move k"** as its first button, next to Undo and Start again. Text: "No move left. Going back to move {k} works." (`stuck.back`), or the existing text when `k` is the start. Proven as today (a rollout from `k` finds a solution, or `k` lies on the witness).
2. The panel is an overlay on the picture (§ 4.3), so the lanes do not move.

No "this move was the mistake" claim: the oracle can only prove that going back works, not which move was fatal.

### 2.5 What is not done, and why

No automatic doomed/undoomed indicator, no per-move solvability colouring, no limit on how often Hint can be used. Reasons in § 2.1 D. The product rule "honest claims only" applies to in-game claims too.

### 2.6 Time budget

Generation stays synchronous in `newGame` (v2 § 15.9). Prototype on CI: median 24 ms, max 118 ms (today 7 / 81 ms) before the opening guard; with the guard expect median ~35 ms, max ~150 ms *(measure)*. A phone is about 3× slower: median ~100 ms, worst ~450 ms. `test/timing.slow.test.ts` gets the new bounds (fastest of 3 repeats: average < 60 ms, slowest < 250 ms on CI) *(calibrate)*. If the phone start time exceeds the v2 target clearly, lower `candidates` to 5 first.

## 3. Point 2: slow peeling

> **Changed after the owner's feedback of 2026-10-30 (§ 12.9):** the animation described in § 3.2–3.3 as "Slow" is now called **Quick** and is the default; the short v2 "Quick" animation is gone; a new, calmer **Slow** shoots line by line (§ 12.9). The preference is stored as `peeling`. The rules of § 3.4 hold for both.

### 3.1 The preference

- Display option **"Peeling"** (a radio group in the Display panel, per device via `context.preferences`, key `peel`): **Slow** ("Slow: shooters run round and peel pixel by pixel") · **Quick** (today's ≤ 900 ms animation) · **Off** (instant).
- **Default: Slow.** Reasons: it is what the owner asked for and what makes the game calm; it never blocks input (§ 3.4), so it adds no waiting; anyone who prefers brisk play switches once and the choice is remembered. With reduced motion the group shows **Off**, disabled, with "Off because your device asks for reduced motion" (as the Animation box does today).
- Migration of the device preference: an existing `display.animation === false` becomes `peel: 'off'`; otherwise the stored choice or the default applies. The old `animation` field is no longer written.
- **Effective at once, mid-game:** Slow → Quick or Off finishes the running queue immediately (the picture jumps to the committed state); Quick or Off → Slow applies from the next launch.
- **Reachable during play** (owner will compare): the action row of the play unit gets a **"Display"** button (44 px) that opens the Display panel in place (it is the same `<details>`, moved into a panel that opens directly under the action row and scrolls into view). The Peeling group is its first item.

### 3.2 What the player sees (Slow)

- **The token ("ant"):** a rounded square of the shooter's colour with its symbol and its remaining shots as a small number, drawn on the track frame. Nothing of the reference's art or creatures is copied: it is our token, as in v2.
- **A launch:** the token enters at the track start (bottom-left corner), walks the stations in track order, and at each station where it hits it pauses briefly: a thin line from the token to the target cell, the cell **peels** (shrinks to the backdrop over 150 ms), the number counts down. Laps continue as the rules say, so it visibly goes round again and reaches the nooks its earlier hits opened. A used-up token fades out where it stops; a token with shots left walks back to the start corner and disappears into its waiting place.
- **The queue ("they wait in the box"):** launches made while a token is running wait as small tokens stacked at the start corner, in launch order, and start one after the other. Strictly one token at a time: the next launch's hits were computed after the previous launch, so its nooks may only open when the one ahead is done; serial order makes that visible exactly as the owner described.
- **Still-to-peel cells:** cells already removed in the game state but not yet peeled are drawn as before (they are still "there" for the eye), with one change: under a spotlight or preview they are drawn dimmed like other colours, because they are going. Previews, spotlight, legality and every number in the UI always describe the **committed** position.
- **"Finish peeling"** (44 px button, shown in the action row only while tokens are running or queued; `aria-controls` the picture): ends the queue at once. Also finished at once by Undo, Start again, Back to move k, Hint, picture size changes, `pause()`, `dispose()` and switching the preference away from Slow.

### 3.3 Timing *(calibrate)*

Pure function `peelTimeline(hits, stations, speed)` in a new DOM-free module `src/peel.ts`:

- Segments: from the start corner to the first hit, between consecutive hits (forward along the track, wrapping into the next lap), and back to the corner.
- Walking: **3 ms per station**, but at most **250 ms per segment** (long empty stretches and full empty laps are walked quickly, so multi-lap shooters do not dawdle).
- Each hit: **40 ms** pause; the peel effect (150 ms) overlaps the walk on.
- A launch with no hits (parking): one lap, at most **700 ms**.
- **Cap per launch: 3.5 s** (the whole timeline is scaled down to fit).
- **Backlog cap:** the running token speeds up so that everything still queued finishes within **6 s**: `speed = max(1, remainingTotal / 6 000 ms)`.

Calibration from the stored witnesses (20 motifs × 3 seeds): a hard launch hits median 13 / p90 59 / max 90 cells and runs median 2 / p90 8 / max 46 laps; with the values above a hard launch takes median **1.6 s**, p90 3.5 s (the cap applies to 21 % of hard launches, mostly the 60–90-hit ones), about **4 minutes of peeling per hard game** spread over a 20–30 minute game, never blocking. Medium: median 1.5 s, ~2.5 min per game; easy: median 1.4 s, ~1.5 min.

### 3.4 Rules that keep it honest and robust

- **The state is committed first.** `activate` computes the move, appends it to `moves`, updates the cursor, calls `requestSave()` and announces the result **before** any animation, exactly as today. The queue holds only `{ hits: Hit[], colour, shots }` per launch.
- **Input is never blocked:** shooters can be launched (and queue), Undo works (finishes the queue first), the preview works, during peeling. No "please wait". The default does not rapid-fire anything: one press, one launch, as today (with "Confirm before launch" as before on touch).
- **Close or reload mid-peeling:** nothing is lost, because the save already holds every move. A resumed game shows the committed picture without animation (no replay of old launches).
- **No timers for correctness:** peeling uses `requestAnimationFrame` and `performance.now()` only to draw. Nothing in the rules, the save or `finished()` waits for it. `finished()` is called when the last move is committed; the reveal fades in when the queue is empty or finished (at most 6 s later; Finish peeling shows it at once).
- **Reduced motion:** Off, always. **Tests:** jsdom has no `requestAnimationFrame` drawing; the view takes an injectable clock and frame scheduler (`createPixelPeel(context, { frame?, now? })`, internal option used only by tests), and e2e tests set the `peel: 'off'` preference unless they test peeling.
- **Performance:** one frame = one blit of the 1-pixel-per-cell image + overlays (token, line, queue stack), as today; popping cells updates only their pixels. Target < 2 ms per frame on a phone; the canvas is not redrawn when nothing moves.
- **Accessibility:** no per-hit announcements; the existing single result announcement stays. The picture's `aria-label` keeps describing the committed position. While peeling, the board has `data-peeling="<queued launches>"` and `data-pending="<cells still to peel>"` (test hooks), and the Finish peeling button's accessible name says how many launches are still peeling ("Finish peeling (2 waiting)").

## 4. Point 3: one-screen play on phones

### 4.1 Target

On narrow portrait screens (the existing stacked media query: below 48 rem in portrait, or below 36 rem), the **play unit** holds everything needed between two launches and fits in **`100svh`** (the viewport with the browser bars shown):

1. Title line (one line: "Red fox · 15 colours", pixels left at inline-end), 24 px.
2. Picture (sticky as today), its cell size computed so the unit fits (§ 4.2).
3. **Status: 3 lines at 0.875 rem** (≈ 57 px; today 6 em ≈ 96 px), fixed height so nothing moves. The long first-time text `status.start` is replaced on phones by `status.startShort` ("Choose a shooter: tap once to see what it removes."); the long version moves into the help paragraph below.
4. **Waiting places:** one row of K boxes, 48 px high; the heading becomes visually hidden (the group keeps its accessible name "Waiting places: 2 of 4 free"); free boxes keep their visible "free" text.
5. **Lanes:** the "Shooters" heading and "Lane n" labels become visually hidden on phones (the buttons' accessible names already say "Lane 2, front: …"; a small lane number stays in the button's corner, 11 px, for sighted reference); the front button 52 px; **2 queued chips per lane** (2 × 22 px); "Show whole lanes" expands below the unit.
6. **Action row** (44 px): Undo · Hint · Display · (Finish peeling while peeling). "Start this picture again" moves into a secondary row below the unit (it is used rarely and is now farther from Undo, which avoids slips).

Below the unit, in normal flow: "Show whole lanes" with the expanded queues, Start this picture again, help texts, Colours, Display (when not opened from the action row).

### 4.2 Fit computation

A pure function `fitCell({ availW, availH, w, h, track, chrome })` in `src/layout.ts` (testable, mutation target):

- `availH` = the measured height of a hidden probe element with `block-size: 100svh` (fallback `innerHeight`), read once per mount and resize, as the fit size is today.
- `chrome` = the measured height of the unit without the picture (title line, status, places, lanes with 2 chips, action row, gaps), read once per mount, resize and font change.
- `cell = max(5, min(24, ⌊(availW − 2·track) / w⌋, ⌊(availH − chrome − 2·track − 8) / h⌋))`.

Budget at 360 × 640: chrome ≈ 24 + 6 + 57 + 6 + 48 + 6 + 52 + 4 + 44 + 6 + 44 + 8 ≈ **305 px**, leaving ~335 px for the picture: square 48 → 6 px cells (300 px), wide 64 × 48 → 5 px (252 px). At 390 × 664: square 48 → 6 px (300 px; 7 px would need 348). Both fit with room; at 5 px the picture is still legible (v2 allows 5 px). Large view (14 px cells, its own scroll box) is unchanged and exempt from the fit.

### 4.3 Nothing moves under the finger

- The stuck panel, the hint's "Back to move k" and any future notice render as an **overlay card** anchored to the bottom edge inside the picture frame (logical properties; max 50 % of the picture height, scrolls internally if longer; Esc or its close button dismisses it; focus moves into it for keyboard users and back afterwards). They no longer push the waiting places and lanes down.
- The status keeps its fixed 3-line height; a longer text (rare, long locales) wraps inside and the e2e test asserts it fits for the longest locale strings of the keys used during play.

### 4.4 Into view once

When a game starts (`newGame`) or a save is restored on a narrow portrait screen, and the play unit's top is below the top quarter of the viewport, the view scrolls the page once so the unit's top sits at the top (`scrollIntoView({ block: 'start' })`, instant; no smooth scroll with reduced motion either). This happens after mount in the next animation frame (presentation only). It never happens again during play, so it cannot fight the player. The host's intro stays above, one scroll up.

(A shared alternative, "the host collapses its intro while a game is playing", would help every game; it is listed for the orchestrator, not required here.)

### 4.5 Other layouts

- Landscape phones and desktop keep the v2 § 15.6 side-by-side layout. The tray order inside the side column follows § 4.1 (status, places, lanes, actions), the overlay notices of § 4.3 apply everywhere, and on desktop the picture's fit also respects the height (`availH`), so the picture and the lane fronts are in view together at 1280 × 800.
- RTL: all new CSS uses logical properties; the overlay card anchors at `inset-inline` and `inset-block-end`; the picture stays `dir=ltr`.
- 44 px targets everywhere; the lane number in the button corner is decorative (`aria-hidden`).

## 5. State, preferences and migration

- **Game state: unchanged** (`stateVersion: 2`). The generator change affects new games only; a save stores its full instance (picture, lanes, witness), so old saves replay identically, and the opening guard and horizon are properties of how a game was made, not of the state. `isValidState` is unchanged.
- **Display preferences** (`display` record, per device): new field `peel: 'slow' | 'quick' | 'off'`; read `animation: false` as `'off'` when `peel` is absent; unknown values fall back to the default. The fields `allSymbols`, `confirm`, `large`, `wholeLanes` are unchanged. A unit test covers old records (`{ animation: false }`, `{ animation: true }`, `{}`, garbage).
- Determinism note: the same seed now gives a different hard game than before (new generator). "Another round" uses a new seed anyway; the v1 fixtures and the migration tests are unaffected.

## 6. Test plan

### 6.1 Fairness (A)

- `test/generator.test.ts` (fast):
  - **Horizon rules, property tests** (fast-check over small random pictures up to 12 × 12, 3–6 colours, 2–4 slots, `H` 3–10): replaying the construction's witness, (a) at every step where an overdue parked shooter's colour is exposed, the step is a relaunch of an overdue shooter; (b) every decoy's colour had an exposed cell when it was launched (its launch hits ≥ 1); (c) no decoy is launched while a shooter is overdue; (d) the v2 invariants still hold (`reserved ≤ remaining`, no slot overflow, termination, witness solves).
  - **Opening guard:** for 10 hard games (fixed seeds), every first move that the witness does not start with has a P0 or P2 rollout that solves (recomputed in the test).
  - Determinism; easy and medium generate byte-identical states to the pre-v3 code for 3 fixed seeds each (the change is hard-only), checked against committed hashes.
- `test/generator.slow.test.ts`: the v3 hard targets of § 2.2 over every motif × 6 seeds (all five fail ≥ 90 %, all K slots occupied at least once ≥ 60 %, shooters below 4 shots ≤ 8 %, guard passed in every accepted game).
- **Doom benchmark** `packages/games/pixel-peel/scripts/doom-report.ts` (not run in CI; run by the implementer and the reviewer, results in the implementation notes): the method of § 1.1 on every motif × 3 seeds × the 4 policy players, printing the fatal-move and doom-delay distribution and first-move dooms. Targets: median delay ≤ 6, p90 ≤ 20, fatal move in the first 5 moves ≤ 2 % of dead ends. A small CI guard in `generator.slow.test.ts` runs it on 4 fixed hard games × 2 players with a reduced oracle and asserts a delay ≤ 25 for each dead end (< 10 s).
- `test/hint.test.ts`: the stuck panel's safe point is the hint's undo target (same function), and from it a rollout solves.
- `test/timing.slow.test.ts`: the new generation bounds (§ 2.6).

### 6.2 Slow peeling (B)

- `test/peel.test.ts` (pure, fast-check):
  - timeline: durations ≥ 0, monotone; hit times strictly increasing in hit order; per-launch total ≤ cap; a parking launch ≤ 700 ms; segment walking ≤ 250 ms;
  - queue (fake clock): for any interleaving of `enqueue`, `advance(dt)` and `finishAll`: the cells shown as peeled are always a subset of the committed removed cells; after `finishAll` (or enough time) the shown cells equal the committed position; cells of one launch peel in hit order; launch *n + 1* starts no earlier than launch *n* ends; the backlog never exceeds 6 s of remaining time at speed 1.
- `test/view.test.ts` (jsdom, injected clock and frame scheduler):
  - Slow: two launches in a row → `moves` has both and `requestSave` was called twice **before** any frame runs; `data-peeling` is 2; after enough frames `data-pending` is 0 and the reveal state matches `position(state)`;
  - Undo while peeling → queue finished, then undone; Hint, Restart, pause and dispose finish it;
  - switching Peeling to Quick or Off mid-queue finishes it at once; Off → no queue ever; reduced motion → the group shows Off and is disabled;
  - preference migration (§ 5);
  - finishing the picture while peeling calls `finished` exactly once at commit; the reveal shows after the queue.
- `e2e/games/pixel-peel.spec.ts`:
  - **Queueing:** Slow on, three fast launches of the witness → the save holds 3 moves at once; `data-peeling` > 0; "Finish peeling" ends it; the picture's pixel count equals the save's position.
  - **Reload mid-peeling:** three fast launches, reload immediately → `expectResumeAfterReload` passes; after reload `data-pending` is 0 and pixels left match the position of the saved moves.
  - **Display panel mid-game:** open "Display" from the action row, switch Slow → Off during a running queue → it finishes at once; the choice survives a reload.
  - With `page.emulateMedia({ reducedMotion: 'reduce' })`: no peeling.
  - All other existing tests set `peel: 'off'` in their init script (next to `confirm: false`).

### 6.3 Phone layout (C)

- `test/layout.test.ts` (pure): `fitCell` for the budgets of § 4.2; never below 5, never above 24; monotone in `availH`; property: `chrome + 2·track + h·cell ≤ availH` whenever a cell ≥ 5 fits.
- e2e, for **360 × 640, 390 × 664, 360 × 740, 390 × 844** (portrait), hard `winter-village` (64 × 48) and `red-fox` (48 × 48):
  - after Start, the unit is scrolled into view; **title line, picture, status, all waiting places, all lane fronts and the first 2 chips of every lane are fully inside the viewport and do not overlap**;
  - play 10 witness moves including a park: `window.scrollY` does not change and the bounding boxes of status, places and fronts stay within ± 1 px;
  - make the game stuck (a prepared save) → the overlay card appears inside the picture; the fronts do not move;
  - the status text fits its 3 lines for the longest strings (de, ru, and one CJK locale) of `preview.*`, `result.*`, `hint.lane`;
  - no horizontal scroll; every target ≥ 44 × 44 px.
- Kept and extended: landscape 844 × 390 and 740 × 360 side by side; desktop 1280 × 800 (picture and fronts in view together); Arabic (the tray mirrors, the picture does not).

### 6.4 Contract and gate

`runGameContract` unchanged (the contract's interaction still clicks `pp-lane-0`; the contract context has reduced motion, so peeling is Off). Full gate: `pnpm check`, `pnpm build && pnpm e2e`.

## 7. Mutation targets (`pnpm mutation`)

- `src/peel.ts` (timeline and queue): surviving mutants in ordering, caps, backlog speed-up or `finishAll` must be killed by § 6.2.
- `src/generate.ts` `construct` horizon rules (overdue test, relaunch-first, reachable-decoy filter, steering filter) and the opening guard: killed by the property tests of § 6.1.
- `src/layout.ts` `fitCell`.
- Unchanged targets from v2 (`engine.ts`, `rules.ts`, `policies.ts`, `art/raster.ts`) must stay at their current scores.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Hard becomes easier than intended | Measured: all five rules of thumb still fail in 98 %; rules-of-thumb runs that solve rise from 0.2 % to 2.9 %. `H` is the knob (30 is harder and slower to show mistakes; 12 easier). The slow test keeps ≥ 90 %. |
| Generation slower on phones | Counted budget (18 000 launches); measured 3× today's median but max 118 ms on CI; lower `candidates` first if the phone start target is missed (§ 2.6). |
| The doom measurements are estimates | One-sided oracle, upper-bound delays, same method for every variant; a stronger oracle on a sample shifted the median only from 17 to 14.5. The opening guard's claim is proven. |
| Slow peeling feels like waiting | Input is never blocked; queueing; 3.5 s cap per launch; 6 s backlog cap; "Finish peeling"; Quick and Off are one tap away in the play unit; the owner compares both. |
| Visual lag confuses (pixels still drawn that are already gone in the game) | Spotlight and preview dim still-to-peel cells; all numbers and previews show the committed position; the queue is drawn where the player expects the next token. |
| `svh` unsupported (old browsers) | Fallback to `innerHeight`; worst case today's layout. |
| One-time scroll fights the host | Only once per mount, only on narrow portrait screens, only when the unit is low on the screen; the shared host alternative is noted for the orchestrator. |
| Long translations overflow the 3-line status | e2e check with the longest locales; shortened phone start text; texts are already plural-neutral and short. |
| Battery and frame cost of continuous animation | Draw only while tokens move; one blit per frame; stop the frame loop when the queue is empty and when the page is hidden (`document.visibilityState`). |
| Copying the reference ("ants") | Our own token, track and timing; no creatures, no art; the owner said 1:1 is not wanted. |

## 9. Implementation order and scope

The owner wants to try slow peeling and the layout first; the generator follows.

1. **`src/peel.ts`** (timeline + queue, pure) with `test/peel.test.ts`. *~200 lines + tests.*
2. **View: peeling** — Peeling preference (radio, migration), queue drawing (token, line, stack, still-to-peel dimming), "Finish peeling", injectable clock/scheduler, all finish triggers; view tests. *~250 lines changed in `view.ts`.*
3. **Layout** — `src/layout.ts` (`fitCell`), the play unit structure and CSS (§ 4.1), overlay notices, Display button, one-time scroll; e2e layout tests. *~150 lines view + ~120 lines CSS.*
4. **Hand-over checkpoint for the owner** (orchestrator merges per the standing instruction once the gate is green): Slow vs Quick vs Off can be compared in the Display panel mid-game.
5. **Generator** — horizon rules, hard level parameters, opening guard; property tests; slow-test targets; doom benchmark script; timing bounds; calibrate `H` and the budget, record numbers. *~150 lines + ~250 lines tests/script.*
6. **Stuck panel safe point** (§ 2.4). *~40 lines.*
7. **Locales** in all 16: `options.peel`, `options.peelSlow`, `options.peelQuick`, `options.peelOff`, `options.peelReduced`, `action.finishPeeling` (with count), `action.display`, `status.startShort`, `stuck.back`, `lane.number` (visually hidden pattern if needed) — about 10 keys; the `options.animation` key is removed.
8. **E2E** remaining, full gate, implementation notes (measured numbers: § 1-style benchmark after the change, generation times, frame time on a throttled phone profile, layout boxes at the four sizes), screenshots for the owner.

Estimate: about 2.5–3 implementer days; no shared change required (the host-intro collapse of § 4.4 is optional and the orchestrator's call).

## 10. Decisions taken (owner may overrule, § 11)

1. Hard generator: bounded waiting horizon `H = 20`, decoys only of reachable colours, 4 waiting places kept; opening guard proves every first move finishable.
2. No automatic "can no longer be finished" signal; the stuck panel offers the proven way back directly.
3. Peeling preference Slow · Quick · Off, default Slow, Off under reduced motion; launches queue and never block input; state committed first.
4. One-screen play unit on phone portrait screens; notices overlay the picture; the page scrolls the unit into view once at start.
5. No state change, no save migration; only the display preference record gains `peel`.

## 11. Open questions for the owner

1. **Default peeling speed?** (a) Slow *(recommended: calm by default, never blocks, one tap to change)*; (b) Quick (today's feel).
2. **How quickly should a wrong decision show on hard?** (a) Horizon 20 *(recommended: mistakes show within a median of 4 and 90 % within 17 moves; 98 % beyond all rules of thumb)*; (b) horizon 12 (mistakes show even sooner; a little easier, 97 %); (c) horizon 30 (more long-range planning; 10 % of dead ends still show 25+ moves late).
3. **Medium too?** (a) Hard only for now, measure medium in the benchmark and decide later *(recommended)*; (b) apply the same horizon rule to medium now.
4. **Scroll the game into view when it starts on a phone?** (a) Yes, once per game start *(recommended)*; (b) no, and the orchestrator instead collapses the page intro while a game is playing (helps all games, a shared change).

## 12. Implementation notes (2026-10-29)

Implemented on branch `game/pixel-peel-v3` in the order of § 9 (peeling, phone layout, generator, stuck card, locales, tests), with the owner's decisions of 2026-10-29: horizon 20 on hard plus the opening guard and "Back to move k"; easy and medium measured with the same method and changed only if they show the same problem; slow peeling optional (Slow / Quick / Off, default Slow); the phone layout as the main point, plus a one-time scroll into view. Measurements come from this container (Node 22, 4 cores, shared with other work), Chromium for the layout.

### 12.1 Fair games: doom delay before and after (benchmark of § 6.1)

`node packages/games/pixel-peel/scripts/doom-report.ts --level <level> --seeds <n>` (every motif × seeds 1001…, the four rules of thumb obvious, tidy, cautious, noisy tidy; oracle of § 1.1: plan, P1–P4, 40 noisy rollouts, plan-guided search of 4 000 nodes). Owner's targets for all three levels: median ≤ 6, 90th percentile ≤ 20, no fatal move among the first 5 moves.

| Level | Puzzles / dead ends | Delay median / p75 / p90 / max | Delay ≥ 20 / ≥ 25 | Fatal move in the first 5 / 10 moves | First moves with no way found | Targets |
|---|---|---|---|---|---|---|
| Easy, before = after | 60 / 7 | 0 / 2 / 2 / 5 | 0 / 0 % | 0 / 0 % | 0 of 180 | met |
| Easy, 6 seeds | 120 / 21 | 2 / 5 / 6 / 16 | 0 / 0 % | 0 / 0 % | 0 of 360 | met |
| Medium, before = after | 60 / 165 | 4 / 6 / 12 / 32 | 3.0 / 1.8 % | 0 / 0 % | 0 of 180 | met |
| Medium, 6 seeds | 120 / 333 | 4 / 7 / 12 / 32 | 2.1 / 1.5 % | 0 / 0 % | 0 of 360 | met |
| **Hard, before** (v2) | 60 / 238 | **11 / 22 / 31 / 61** | 28.2 / 20.2 % | **14.3** / 28.2 % | **14 of 180** (12 puzzles) | not met |
| **Hard, after** (v3) | 60 / 235 | **4 / 8 / 15 / 56** | 6.4 / 4.3 % | **0** / 0 % | **0 of 180** | met |

- **Easy and medium do not show the problem** (no late dooms by the targets, no early fatal moves, no fatal first move), so they keep the v2 generator: `horizon: Infinity`, `guard: false`. A test pins their states byte for byte (3 seeds each) to the pre-v3 output.
- **The long tail on hard** is an upper bound of the one-sided oracle. The 15 hard dead ends with a delay ≥ 20 were re-measured with a 5× stronger oracle (200 rollouts, 25 000 nodes): their delays became 10–35 (median 18; 3 of 15 still ≥ 25; the 56 became 29). Hard therefore still has a few mistakes that show 25–35 moves later in a ~110-move game; none in the opening.
- Calibration of `H` with the final guard (same 60 puzzles): H 12 → median 4, p90 19, max 58, 0 % early, 1 first move unproven; H 15 → 4 / 19 / 63, 2.6 % early (fallback games); **H 20 → 4 / 15 / 56, 0 %, 0** (chosen, the owner's value); H 30 → 5 / 19 / 56, 0 %, 0. Runs of 60 puzzles vary by a few points between variants.

### 12.2 Generator values (deviations from § 2.2 / § 2.3 in bold)

| Hard | Plan | Implemented |
|---|---|---|
| Waiting horizon `H` | 20 | 20 |
| Candidates, budget | 6, 18 000 | 6, **30 000** launches |
| Opening guard | every first move: P0, then P2 | **every first move and the first 5 moves of each deterministic rule of thumb (P1–P4)**; proof by "follow the plan", 12 noisy rollouts around plan / tidy / cautious (noise 5–20 %), then a plan-guided search of 600 nodes (`src/prove.ts`) |
| Fallback when nothing is accepted | best by score | best by score, **a candidate failing the guard scores 2 lower** |

- **Why the guard is wider.** With the plan's guard (first moves only, P0 then P2) the benchmark still showed fatal moves at move 5 for three rules of thumb in one puzzle (1.3 % of dead ends), against the owner's "no deciding move among the first 5". A position that can be finished means every position before it on the same way can be finished too, so proving the position after 5 moves of each rule of thumb covers the first 5 moves of these ways. Positions are de-duplicated by key, and a proven opening also proves its first move.
- **Why the proof is wider than P0 / P2.** On hard the rules of thumb fail by design, so P2 rarely proves anything; P0 alone proved 73 % of the first moves the oracle could finish. Noisy rollouts and the small search proved almost all the rest (guard pass rate 72 % of the candidates that pass the level rule, plan's prototype 84 %).
- **Budget.** The guard costs about 6 000 launches when it passes. With 18 000 launches only 88 % of hard games were accepted (below the ≥ 90 % target); 30 000 gives 92.5 %.
- Steering trials count one launch each; `since` resets when a parked shooter is relaunched and goes back to its place.

Level definition, hard, every motif × 6 seeds (`generator.slow.test.ts`, v2 values in brackets): accepted 92.5 % (100 %); obvious play fails 100 % (100 %); **all five rules fail 92.5 %** (98 %; target ≥ 90 %); all 4 places full at least once 93 % (100 %; v3 target ≥ 60 %); zero-hit parks in the witness 0 % (100 %; target dropped); median slot entries 11 (9); shooters below 4 shots 1.3 % (1.8 %); witness 112.7 launches (122.5); candidates tried 2.13 (1.06); counted launches 12 231 (2 028); longest wait in a waiting place, median 21 moves (93).

**Time.** Hard generation, fastest of 3, every motif × 3 seeds: average about 50 ms, slowest about 205 ms (v2: 19 / 65 ms). `timing.slow.test.ts`: hard average < 150 ms, slowest < 600 ms (several times the measured values, as for the other bounds there); easy and medium keep < 60 / 400 ms. In Chromium with 4× CPU throttling at 390 × 844, from Start to the drawn picture: hard red fox 568 ms, market stall 372 ms, winter village 311 ms, tiger 302 ms (v2 measured 203–288 ms). If this is too slow on real phones, lower `candidates` first (§ 2.6).

### 12.3 Slow peeling (since 2026-10-30: Quick, § 12.9)

- Timing as § 3.3: 3 ms per station, ≤ 250 ms per walk, 40 ms per hit, 150 ms peel effect, parking lap ≤ 700 ms, ≤ 3.5 s per launch, backlog ≤ 6 s. `peelTimeline(hits, stations, usedUp)` is pure; the speed-up lives in `PeelQueue`: it is set when a launch is queued (`max(1, remaining / 6 000)`), so everything queued ends within 6 s exactly (a speed recomputed every frame would only decay towards it). A used-up token stops at its last hit and fades during its last peel; a token with shots left walks on to the start corner.
- Token 16–26 px (larger than the plan's sketch, to be seen on 6 px cells) with the shooter's symbol and its shots on a small dark pill; a line to the cell during the hit pause; queued launches as small tokens stacked at the start corner.
- Preference record `display.peel`; `animation: false` reads as Off; the `animation` field is no longer written. Reduced motion: the group shows Off, disabled, with "Off, because your device asks for reduced motion." Switching to Quick or Off finishes the queue; Off/Quick → Slow applies from the next launch.
- "Finish peeling": visible text without the count plus a count badge, accessible name with the count ("Finish peeling (2)"): keys `action.finishPeeling` and `action.finishPeelingCount`.
- Frames at 4× CPU throttling during peeling (3 fast launches, 150 frames): interval median 16.7 ms, 95th percentile 16.8 ms, worst 33–50 ms (one dropped frame).
- The reveal fades in when the queue is empty (focus moves to its title then); `finished()` is called at the last move, as before.

### 12.4 Phone layout

Layout after 10 hard moves (CSS px from the viewport top; picture = canvas with its track; the action row is 44 px below the lanes):

| Viewport, motif | Title | Picture | Status (3 lines) | Waiting places | Lane fronts | Lanes with 2 chips end | Before (v2): status, fronts |
|---|---|---|---|---|---|---|---|
| 360 × 640, red fox | 30–54 | 64–364 | 374–429 | 435–483 | 489–541 | 587 | status 210–306 under the sticky picture 4–304 |
| 360 × 640, winter village | 52–76 | 86–338 | 348–402 | 408–456 | 462–514 | 560 | fronts 588–640 |
| 360 × 740, red fox | 130–154 | 164–464 | 474–529 | 535–583 | 589–641 | 687 | status 272–368 under the picture 4–304 |
| 360 × 740, winter village | 152–176 | 186–438 | 448–502 | 508–556 | 562–614 | 660 | fronts 688–740 |
| 390 × 844, red fox | 0–24 | 34–382 | 392–447 | 453–501 | 507–559 | 605 | status 339–435 under the picture 4–352 |
| 390 × 844, winter village | 256–280 | 290–542 | 552–607 | 613–661 | 667–719 | 765 | fronts 792–844 |
| 412 × 915, red fox | 0–24 | 34–382 | 392–446 | 452–500 | 506–558 | 604 | status 385–481 under the picture 21–369 |
| 412 × 915, winter village | 327–351 | 361–613 | 623–677 | 683–731 | 737–789 | 835 | fronts 863–915 |
| 1280 × 800, red fox | 0–27 | 39–579 | beside: 39–135 | 175–223 | 287–339 | 627 | the game started 425 px down; picture 464–1004 |

- The picture size comes from `fitCell` (`src/layout.ts`) with the *measured* height of the unit without the picture (title line to the end of the action row), not a fixed budget; the chips area holds 2 chips also when a lane has fewer, so the unit keeps its height. Red fox at 360 × 640: 6 px cells; winter village: 5 px.
- **Deviation:** the one-time scroll runs on every layout, not only on narrow portrait screens, whenever the play unit is not fully on screen after the start (owner: "scroll the play area into view once at game start"); on desktop this brings the picture and the lanes into view together (e2e at 1280 × 800).
- **Deviation:** "Show whole lanes" stays a button under the action row; switched on, the chips grow inside the lanes (the unit is then taller than one screen, the player's choice). The default on phones is off, 2 chips per lane.
- Notices are cards over the bottom of the picture (`max(50 %, 12.5rem)`, scrolling inside), closed with × (`notice.close`) or Esc until the next change; keyboard players are taken into the stuck card and back.
- **Fonts differ between devices (and CI):** the status box and the action row have fixed heights and fit their text themselves. A text that does not fit steps down 0.875 → 0.8 → 0.75 rem (the last step with a tighter line height, 4 lines in the status), measured by a mutation observer after each text change and on mount and resize; only then does the status scroll inside. Action-row labels wrap inside their buttons (`overflow-wrap: anywhere`, `hyphens: auto` with `lang`); every button stays ≥ 44 × 44 px in a 3 rem row. The e2e tests check this for every locale with the normal font and with `letter-spacing: 0.05em` (it also holds at 0.1 em), asserting fit, font ≥ 0.75 rem and the 44 px targets rather than exact metrics.
- The status is 3 lines at 0.875 rem; an e2e test fills it with the longest `preview.*` (with "press again"), `result.*`, `hint.lane` and `status.startShort` texts of **all 16 locales** at 360 px. One Russian text was shortened to fit ("уберёт {n} и снова будет ждать…").
- Landscape and desktop keep the side-by-side layout (e2e at 844 × 390, 740 × 360, 640 × 360, 1280 × 800, Arabic).

### 12.5 Stuck card

When no move is left the card computes the hint's safe point after one frame (the existing `hint()`, proven as there) and offers "Back to move k" first ("No move left. Going back to move k works."); with no safe point after the start it keeps the v2 text and buttons. Tests: the view offers exactly `hint(state).k` and goes back to it; for 4 hard games where the obvious play is stuck, a way on from `k` is found and checked by replay.

### 12.6 State, locales, tests

- State unchanged (`stateVersion` 2, no migration); only the display preference gains `peel`.
- New keys in all 16 locales: `options.peel`, `options.peelSlow`, `options.peelQuick`, `options.peelOff`, `options.peelReduced`, `action.finishPeeling`, `action.finishPeelingCount`, `action.display`, `status.startShort`, `stuck.back`, `stuck.backButton`, `notice.close`; `options.animation` removed. The lane number in a front's corner is a digit (`aria-hidden`), no key.
- Tests: `peel.test.ts` (timeline and queue, properties), `layout.test.ts` (`fitCell`, properties), `view.test.ts` (Peeling preference and migration, queueing before any frame, finish triggers, reduced motion, reveal after the queue, stuck card, notices), `generator.test.ts` (horizon properties over small random pictures, the guard of 10 hard games checked by replay, a fatal first move rejected and confirmed by breadth-first search, easy/medium unchanged), `generator.slow.test.ts` (v3 hard targets, doom guard on 4 hard games × 2 rules of thumb with the quick oracle: fatal move after move 5 and delay ≤ 25), `hint.test.ts` (stuck card's way back), `timing.slow.test.ts` (hard bounds), e2e (layout at 360 × 640, 360 × 740, 390 × 844, 412 × 915 × 2 motifs through 10 moves without scrolling; stuck card; status in all locales; slow peeling queue, reload mid-peeling, Display panel, reduced motion; desktop 1280 × 800). The doom oracle (`test/doom.ts`) and the benchmark script are not part of `pnpm test` except the small slow-test guard.

### 12.7 Open points

- Mutation testing (`pnpm mutation`) of `peel.ts`, `layout.ts`, `prove.ts` and the new `construct` rules was not run in this round.
- Hard generation takes about 2.5× longer than v2 (§ 12.2); the start on a throttled phone profile is up to ~0.6 s for the slowest motif.
- A few hard mistakes still show 25–35 moves later (§ 12.1); a smaller `H` did not reduce this reliably in the measurement.
- The shared alternative of § 4.4 (the host collapsing its intro during play) is still open for the orchestrator.

### 12.8 Independent review (2026-10-29)

- **Doom benchmark, own seeds** (`doom-report.ts` method, every motif × seeds 7001–7003): hard 60 puzzles / 239 dead ends: delay median **5**, p75 8, p90 **14**, max 36; ≥ 25: 2.9 %; fatal move among the first 5 moves **0**; first moves without a found way 0 of 180. Medium: 3 / 9 / 34, 0 early, 0 of 180. Easy: 4 / 10 / 12, 0 early, 0 of 180. All targets met.
- **Guard proofs** replayed with the v1 reference rules (`test/reference.ts`, independent of the engine): 38 guarded hard games, 266 openings (every other first move and the 5-move openings of P1–P4), every proof a real solution; a first move skipped by the guard is the first move of a proven rule-of-thumb opening. Every witness solves under the reference rules.
- **Fallback games** (not accepted, 2–7 % of hard games): 80 hard games, 5 fallbacks; with a 5× stronger search every first move of them can still be finished.
- **Easy and medium unchanged:** the pinned hashes equal the output of the pre-v3 generator (`origin/claude/orchestrator-2`) for those seeds and 6 more.
- **Generation time** (Node, every motif × 6 seeds, fastest of 2): average 50 ms, p90 113 ms, max 221 ms. Fewer candidates do not help: 5 → average 51 ms, max 190 ms, accepted 95.8 % (6: 98.3 %); budget 24 000 → max 177 ms, accepted 93.3 % and more fallbacks that failed the guard (7 of 120 instead of 2). Almost all time is the engine's launch (47 % of samples), so no cheap safe reduction; kept.
- **Stuck card's way back:** over 153 hard dead ends of the four rules of thumb, the hint's safe point is the start in 22 (14 %), and lies a median of 9 (p90 38) moves before the latest position the quick oracle can still finish. It is proven, but often further back than needed (the v2 hint search); a stronger search there is a possible follow-up.
- **Fixed in review:** the action row's labels spilled out of equal-width buttons in long locales (Display in es, it, pl, ru, uk; Hint in it, pl) and Finish peeling wrapped to three lines in ja and pt, growing the row by 13 px whenever peeling started; buttons are now sized by their words with a 44 px floor, five Display labels use the short word for View, and an e2e test fills the row with all 16 locales. Pressing Hint in the stuck card no longer stacks a second, cut-off "Back to move k" card. The Display panel opened from the action row now shows its heading below the sticky picture on small phones.

### 12.9 Owner feedback 2026-10-30: Quick is the current animation, Slow shoots line by line

Owner (translated): "The current shooter should be the fast one, plus add a slower one. Maybe it always shoots horizontally or vertically, removing everything visible directly in that line, and then moves on."

- **Peeling: Slow · Quick · Off, default Quick.** Quick is the animation of § 12.3, unchanged in timing (`TIMING`). The short v2-style Quick (≤ 900 ms, no queue) is removed. Slow is new (`SLOW_TIMING`). The Display panel explains both under the radio buttons ("Slow: the shooter stops wherever it hits and shoots straight along that row or column. Quick: it runs round and peels pixel by pixel."). Reduced motion still forces Off.
- **Slow, what the player sees.** The shooter walks station by station; where it hits, it stops and fires a shot: a beam in its colour along that station's row or column, from the edge to the farthest pixel it removes, with an outline around the pixels, which then shrink away. Then it walks on. Stations without hits are passed at walking pace; long empty stretches faster.
- **Exactly the rules.** Presentation only: the move is committed and saved first; the pixels go in the order the engine reports its hits. A station reaches one pixel per pass (v1 § 4.3), so a shot normally removes one pixel; hits the rules make at the *same* station one after another (lap after lap, with nothing else hit in between) are drawn as one shot, so the shooter does not walk empty laps (`shotsOf`). Measured over the stored witnesses, shots per launch ≈ hits per launch (hard: median 16 shots for 17 hits).
- **Timing *(calibrated)*:** walking 35 ms per station, at most 600 ms per walk between two shots; a shot 300 ms (the beam is in for the first third, then fades; the pixels shrink over 250 ms); a parking lap at most 1.2 s; **at most 7 s per launch**: a longer launch first walks faster (down to a quarter of the walking time), then everything is scaled; the queue speeds up so that everything queued ends within **10 s**. Over the stored witnesses (20 motifs × 3 seeds): a launch takes median 7.0 s on easy and hard and 6.7 s on medium (56 % of hard launches reach the cap); a shot keeps its 300 ms in the median launch (10th percentile 100–190 ms in the largest launches); about 6 / 8 / 10 minutes of animation per easy / medium / hard game (Quick: 1.5 / 2.5 / 3.6), never blocking input. Finish peeling ends it at once.
- **Preference migration.** New field `peeling` (`slow` | `quick` | `off`). Older records: the first v3 field `peel` — its "slow" was today's Quick, its "quick" is gone — reads as Quick, `peel: 'off'` as Off; the v2 `animation: false` as Off; otherwise Quick. Only `peeling` is written.
- **Locales:** `options.peelSlow` and `options.peelQuick` reworded in all 16 locales (e.g. de "Langsam (Zeile für Zeile)", "Schnell (Pixel für Pixel)", "Aus"), new `options.peelHelp`.
- **Tests:** `peel.test.ts` (shots are the runs of hits at one station in hit order; worked example; durations bounded and shots strictly ordered, property; on real games under a fake clock the pixels go per shot in exactly the engine's order, a shot never split over two frames, every launch within 7 s; the Slow backlog within 10 s); `view.test.ts` (migration of every older record, default Quick, switching mode mid-queue finishes it, Slow ends within 7 s in steps); e2e (Quick and Slow each: fast launches saved at once and queued, Finish peeling, reload mid-animation; Slow removes in steps and ends by itself; the layout tests unchanged).
