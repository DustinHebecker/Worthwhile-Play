# Pixel Peel (`pixel-peel`): design

Status: **Implemented as a prototype (2026-10-17)**; see "Implementation notes" at the end. The planner of the new-games pipeline wrote this; the implementer follows it and the reviewer checks against it. Numbers marked *(calibrate)* are first estimates. The implementer may tune them within the stated bounds, but never beyond the limits in § 9 and § 12. Deviations go into a final "Implementation notes" section, as in `mini-optimizer.md`.

Owner priority for this round: a **deployable prototype** that is complete, fully playable, correct, tested and accessible, with **12 motifs**. The owner refines the pictures afterwards, so everything about a motif is data, and adding or redrawing a motif is a data-only change (§ 6).

Binding inputs: `CLAUDE.md`; the implementation brief ("Core product principles", "Determinism", "Localization", "Accessibility", "Testing philosophy", "Definition of Done"); ADR 0002 (contract), 0006 (roles) and 0017 (host start screen, `settings`, `settingsOf`, `begin`); the pipeline brief, section "Game 9".

## 1. Identity

| | |
|---|---|
| Game id | `pixel-peel` (package `@wp/game-pixel-peel`) |
| English name | **Pixel Peel** |
| German name | **Pixel für Pixel** |
| Skills | `['planning', 'spatial']` |
| Typical minutes | `[4, 15]` |
| Difficulties | `['easy', 'medium', 'hard']` (`metadata.difficulties`; the host default is the first, `easy`) |
| Input | pointer, touch, keyboard |
| Capabilities | offline, `audio: 'none'`, `network: 'none'`, `webgpu: 'none'`, `aiOptional: false`, `pauseable: true` |
| `stateVersion` | 1 |

Both names use generic, descriptive words only ("pixel", "peel", "pixel by pixel"). Neither is close to the name of any game in the reference genre. A formal trademark search was not possible in this environment (see § 13, Risks).

## 2. Pitch and honest value

A small pixel picture sits on a board. Below it wait **shooters**, each with a colour (and its own symbol) and a number of shots. When you send a shooter out, it runs once around the edge of the picture, and again for as long as it keeps hitting. It only removes pixels of **its own colour** that it can reach from the edge. The picture peels away from the outside in. There are only a few waiting places for shooters that still have shots but nothing to hit, so the **order** matters. Everything is visible from the start, nothing is random during play, there is no clock, and Undo is unlimited. At the end the whole picture returns, with its title.

Allowed wording (tagline, rules, catalogue):

- "Practice planning a few moves ahead: which colour can go now, and which has to wait?"
- "An exercise in sequencing with limited space."
- "Calm, focused active leisure: no clock, no luck, unlimited undo."

Never claim that it improves your brain, memory, concentration, IQ or anything else.

## 3. Fit with the collection and reuse

| Existing game | Overlap? |
|---|---|
| Nonogram | Also a pixel picture, but there you **deduce** the picture from clues. Here the picture is given and you **plan the order** in which to remove it. The deduction is different and so is the skill. |
| Sokoban, Sliding Blocks | Also sequencing with dead ends and undo. Different domain: no colours and no shared "edge" resource. |
| Lights Out, Laser Paths | One-shot logic puzzles. No queue and no limited slots. |

Reuse:

- **Shared packages** (imports): `@wp/game-core` (`createRng`, `normalizeSeed`, the guards, `defineGame`, setting types), `@wp/ui` (`h`, `clear`, `announce`) and `@wp/testing` (`runGameContract`, `startGame`, `chooseSetting`, `expectResumeAfterReload`, `readSave`).
- **Patterns copied, not imported** (games never import other games): the roving-focus keyboard handler (graph-detective and mini-optimizer); the "state stores the full instance, so generator changes never break saves" approach (mini-optimizer § 8); and the per-device display preferences via `context.preferences` (nonogram zoom).
- **No new dependency, and no third-party art or data.** All motifs are original pixel art drawn as text in this repository (§ 6.4).
- **No shared change requested.**

## 4. Mechanics (normative)

### 4.1 Board

- The picture is `W × H` cells, with `W` and `H` from 4 to 24. Motifs used in play are 12–24 (§ 6). The format allows rectangles.
- Every cell is either **transparent** (`.`) or **filled** with one palette colour. Transparent cells are never targets and never block.
- A filled cell is **present** until it is removed. The puzzle is solved when no filled cell is present.
- Rows are numbered `y = 0 … H−1` from top to bottom. Columns are numbered `x = 0 … W−1` from left to right. The picture is never mirrored, not even in RTL locales (it is a picture, § 7.6).

**Grid size is a property of the motif, not of the difficulty.** Redrawing every motif at two or three resolutions would multiply the art work. Scaling pixel art down destroys it, and the owner is about to refine the pictures. Prototype motifs are **16 × 16** (animals, on a transparent background) or **20 × 16** (landscapes and seasons, full frame), so 120 to 320 filled pixels each. Difficulty uses the levers in § 5.

### 4.2 The track and "exposed"

A shooter moves along a closed **track** around the picture. The track has `S = 2W + 2H` **stations**, one per row or column per side. Each station looks into one line from one side.

| Stations `i` | Side | Line | Scans from |
|---|---|---|---|
| `0 … W−1` | bottom | column `x = i` | row `H−1` upwards |
| `W … W+H−1` | right | row `y = H−1−(i−W)` | column `W−1` leftwards |
| `W+H … 2W+H−1` | top | column `x = W−1−(i−W−H)` | row `0` downwards |
| `2W+H … 2W+2H−1` | left | row `y = i−2W−H` | column `0` rightwards |

So a lap starts at the bottom-left corner, which is where the shooters wait (§ 7), and runs right along the bottom, up the right side, left along the top and down the left side.

**Front of a station:** the first present filled cell met when scanning the station's line from its side, skipping transparent and removed cells. If no such cell exists, the station has no front.

**Exposed:** a cell is exposed when it is the front of at least one station. There are at most `S` exposed cells. A cell can be the front of up to four stations (a corner pixel, for example). This is the "outermost remaining pixel of each row and column, seen from that side" rule. It is what the player sees marked with symbols (§ 7.3).

### 4.3 One launch (the only kind of move)

A **shooter** is `{ c, n }`: a palette key `c` and its shots (ammo) `n ≥ 1`.

```
launch(cells, shooter):
  hits = 0
  repeat
    lapHits = 0
    for i in 0 … S−1:                      // stations in the order of § 4.2
      f = front(cells, i)
      if f exists and colour(f) == shooter.c:
        remove f; shooter.n -= 1; lapHits += 1
        if shooter.n == 0: return (hits + lapHits, used up)
    hits += lapHits
  while lapHits > 0                         // another lap only after a lap that hit something
  return (hits, n left)                     // n ≥ 1: the shooter needs a waiting slot
```

- Each station fires **at most once per lap**, at its front at the moment the shooter passes. A removal changes the fronts immediately, so later stations in the same lap see it.
- The shooter keeps lapping while it hits something and still has shots. This is a deliberate difference from the reference genre (one lap per launch). With this rule a launch does everything its colour can do right now, so the player never has to tap the same shooter again only to finish a job. Removing a pixel with a matching shooter never wastes a shot (§ 4.5), so continuing is never worse than stopping.
- A launch terminates. Each lap that continues removes at least one cell, so there are at most `n + 1` laps of `S` stations.
- **Rules are instantaneous.** The whole launch is computed at once. Any animation is cosmetic (§ 7.5).

Worked example (a fixture for `rules.test.ts`). `W = 3`, `H = 2`, rows `aba` / `bba`, so stations 0–2 are bottom (columns 0, 1, 2), 3–4 right (rows 1, 0), 5–7 top (columns 2, 1, 0) and 8–9 left (rows 0, 1). Cells are written `(x, y)`. Launch `{a, 3}`:

1. Station 2 removes `(2,1)`.
2. Station 4 removes `(2,0)`.
3. Station 7 removes `(0,0)`.

That is 3 hits; the shooter is used up and `b` at `(1,0)`, `(0,1)` and `(1,1)` remains. Then `{b, 3}` removes them at stations 0, 1 and 4.

A second fixture: a 3 × 3 ring of `a` around one `b`. `{b, 1}` launched first hits nothing and needs a slot. After `{a, 8}`, relaunching it removes the centre.

### 4.4 Lanes, slots and legal moves

- **Lanes:** `L` queues of shooters (2–4). Only the **front** of each lane can be launched. All shooters of all lanes are visible from the start, with colour, symbol and shots.
- **Waiting slots:** `K` places (2–5) for shooters that came back with shots left. A parked shooter keeps its slot index.
- Moves are encoded as strings: `"L<i>"` launches the front of lane `i`, and `"S<j>"` relaunches the shooter in slot `j`.

**Legal moves:**

| Move | Legal when | Effect |
|---|---|---|
| `L<i>` | lane `i` is not empty **and** (the launch uses the shooter up **or** a slot is free) | The shooter leaves the lane. If shots are left, it takes the **lowest free** slot. |
| `S<j>` | slot `j` holds a shooter **and** its launch hits **at least one** cell | If shots are left, it returns to slot `j`. |

- A lane launch that hits nothing is legal when a slot is free. This is **parking**: you move a shooter aside to reach the one behind it. It is the central tactical move.
- A slot relaunch that would hit nothing is not legal. It would change nothing.
- An illegal move is never applied or recorded. The view shows why (§ 7.2): "No free waiting place: 3 shots would be left", or "Nothing of this colour can be reached yet".

### 4.5 Invariant, end and stuck

- **Invariant (checked by `isValidState`):** for every colour, the sum of the shots of all shooters in lanes and slots equals the number of present cells of that colour. Every shot is a hit, so the invariant holds after every move. The picture is therefore empty exactly when every lane and slot is empty.
- **Solved:** no present cell. The reveal follows (§ 8), and `finished()` is called once.
- **Stuck:** the picture is not empty and there is no legal move. This happens when every slot is full, no lane front would be used up, and no parked shooter can hit anything. The game shows a calm panel: "No move left. Undo a move, or start this picture again." It offers Undo, Restart and Hint (Hint names the undo target, § 4.7). It is not a loss: `finished()` is not called, nothing is recorded, and nothing is lost.
- **Doomed but not stuck** (legal moves exist, but no solution): the game does not announce this by itself, because that would put pressure on the player. The Hint tells it on request (§ 4.7).

### 4.6 Undo and restart

- **Undo:** unlimited, back to the start. The state stores the list of moves, and the current position is a replay (§ 10). Shortcut: Ctrl+Z or Cmd+Z while focus is inside the game.
- **Restart** ("Start this picture again"): clears the moves without asking for confirmation. Its previous move list is kept in `restartUndo`, so the next Undo brings the whole game back. Any new move discards `restartUndo`.
- `GameInstance.reset()` behaves like Restart without `restartUndo`: the same picture and lanes, no moves, `reported: false`.
- After the picture is solved, Undo and Restart are not offered (the reveal is the end, § 8). Playing the same picture again is "Another round", or Restart from the host's "New game" flow.

### 4.7 Hint (offered, no penalty)

A **Hint** button is always available. It is not counted, not stored and changes nothing. It only shows; it never plays a move for you. It runs the solver (§ 9) from the current position:

1. **Solution found:** the suggested move is marked on its shooter with a dashed ring and the word "Hint". The status line says "Hint: lane 2, orange ▲ 12", as text and announced.
2. **Proven unsolvable** (search space exhausted): "From here the picture cannot be finished. Going back to move k works." This comes with an **"Undo to move k"** button. `k` is the latest ancestor proven solvable. The search tests ancestors from the newest backwards, at most 8 of them, each with a smaller budget. If none is proven, `k` = the longest common prefix of `moves` and the stored `witness`, which is solvable by construction.
3. **Budget exhausted without an answer** (rare): "I could not check this position quickly. Going back to move k is safe." `k` is the witness prefix, as in case 2.

Why offer a hint at all: the owner asked for fairness and calm play. A dead end found only after ten more moves is frustrating, and the hint turns it into information. It is honest because the solver proves its answer, or says plainly that it could not.

## 5. Difficulty levels and levers

| Lever | easy | medium | hard |
|---|---|---|---|
| Lanes `L` | 2 | 3 | 3 |
| Waiting slots `K` | 5 | 4 | 3 |
| Pack target (shots aimed for per shooter) *(calibrate)* | 14–30 | 8–20 | 5–14 |
| Shooters moved forward in their lanes ("covered colours early") | 0 | 2–3 | 4–6 |
| Acceptance (§ 9.3) | solvable | solvable; prefers positions where the obvious play fails | solvable; requires that the obvious play fails, otherwise the best fallback |

The motif fixes the **number of colours** (4–6 in the prototype). The start screen's motif list shows it ("Red fox · 4 colours") so the player can choose. A per-difficulty colour merge (for example, light green counting as green on easy) was considered and left out. It would make the play picture differ from the revealed one. It is listed as a later option in § 16.

Difficulty labels: `difficulty.easy` = "Easy (more room)", `difficulty.medium` = "Medium", `difficulty.hard` = "Hard (little room)". The hint under the difficulty says what grows: fewer waiting places, smaller packs, and more shooters out of order.

## 6. Motifs

### 6.1 Data format

One file per motif in `packages/games/pixel-peel/src/motifs/<id>.ts`, plus one line in `src/motifs/index.ts` (the ordered list `MOTIFS`). **Nothing else is needed to add a motif:** no rules code, no message file, and no test change, because the tests iterate over `MOTIFS`.

```ts
import type { Motif } from './types';

export const redFox: Motif = {
  id: 'red-fox',                      // [a-z0-9-]{2,32}; not 'any'; unique
  group: 'animal',                    // 'season' | 'landscape' | 'animal' (order in the select, rules hint)
  title: { en: 'Red fox', de: 'Rotfuchs', nl: 'Vos', /* … all 16 locales (type-checked) */ },
  place: { en: 'Europe, Asia and North America', de: 'Europa, Asien und Nordamerika', /* … all 16 */ },
  backdrop: '#e9efe4',                // shown behind transparent and removed cells
  palette: {                          // insertion order = symbol order; keys: one lowercase letter a–z
    o: ['#d2691e', 'orange'],
    w: ['#f5efe3', 'cream'],
    k: ['#2a2420', 'black'],
    b: ['#7a4a2a', 'brown']
  },
  rows: [                             // exactly H strings of W characters; '.' = transparent
    '................',
    '..o..........o..',
    // …
  ]
};
```

- `Localized` is `Record<SupportedLocale, string>`, so a missing locale is a **compile error**. `messages.ts` generates the start-screen value labels `motif.<id>` from `title` (§ 6.5). The view reads `place` directly.
- **Colour names** come from a fixed vocabulary that is translated once in `messages.ts` (`colour.<name>`, 24 names): `white, cream, yellow, gold, orange, red, darkRed, pink, lightPink, purple, lightBlue, blue, navy, teal, lightGreen, green, darkGreen, olive, tan, brown, darkBrown, grey, darkGrey, black`. A new name is a messages change; reusing names stays data-only.
- **Symbols** are assigned by palette position, not stored: 1 dot, 2 triangle, 3 square, 4 diamond, 5 plus, 6 ring, 7 bar, 8 star (SVG and canvas paths, never font glyphs). The view draws each symbol in black or white, whichever contrasts with the fill (WCAG relative luminance > 0.4 → black).
- Palette keys are letters only, so JavaScript object order is the insertion order. Integer-like keys would be reordered, which is one reason digits are forbidden.

### 6.2 Palette and motif rules (each one marked "test" is enforced in `test/motifs.test.ts`)

1. **Dimensions** (test): 12 ≤ W, H ≤ 24. Every row has length W. Only palette keys and `.` appear.
2. **Colours** (test): 3–8 palette entries (target 4–6), each used by **at least 4** pixels. Every entry is used, and names are unique within the motif.
3. **Distinguishable** (test): every pair of palette colours differs by ΔE (CIE76, sRGB → Lab) ≥ 20 *(calibrate, never below 15)*. The backdrop differs from every palette colour by ΔE ≥ 20, so peeled areas are evident (and the symbols carry the information anyway).
4. **Size** (test): 80–480 filled pixels. The **first position must allow a launch that hits** (always true in practice; asserted).
5. **Texts** (test): `title` and `place` are non-empty in all 16 locales, `title` ≤ 32 characters, and ids are unique.
6. **Solvable** (test): § 11, generation for every motif × difficulty × 8 seeds.
7. **Silhouette** (review, not testable): recognisable as a thumbnail of 1 px per pixel. One subject, centred, with a 1-pixel margin for animals. A strong outline colour or contrast against the backdrop. No text or letters in the art. No single-pixel noise (a lone pixel of a colour is hard to see and leads to tedious one-shot shooters).
8. **Facts** (review): `place` must be correct. Approximate or popular associations are worded carefully ("Japan" for sakura is fine; animals name their native range in broad terms).
9. **Originality** (review): drawn for this project. Not traced, and not taken from any game, emoji set, icon font or stock source.

### 6.3 Review renders

`packages/games/pixel-peel/scripts/render-motifs.ts` (run with `pnpm exec tsx` or `node --experimental-strip-types`, whichever the repo already uses; check first, and add nothing new). It writes one PNG per motif, scaled ×16 with the backdrop, plus a contact sheet. It uses only `node:zlib` (deflate and crc32) for a minimal PNG encoder. The output goes to `packages/games/pixel-peel/renders/`, which is git-ignored via the existing `reports/` pattern or a package-local `.gitignore` line. The implementer reports the path, so the owner can review the motifs before release. The renders are never committed.

### 6.4 Licence

All motifs are original work of this project, under the repository licence (ADR 0007). `docs/third-party.md` needs no entry. The implementer adds one sentence there saying that the Pixel Peel motifs are self-made, so the licence review has a record.

### 6.5 The 12 prototype motifs

| # | id | Group | Size | Colours (names, about) | Subject | `place` (EN) |
|---|---|---|---|---|---|---|
| 1 | `cherry-blossom` | season (spring) | 20×16 | lightBlue, lightPink, pink, darkBrown, green | A blossoming branch across a spring sky, with grass at the bottom | Japan |
| 2 | `summer-meadow` | season (summer) | 20×16 | lightBlue, yellow, green, darkGreen, red, white | Sun, a meadow with poppies and daisies | Central Europe |
| 3 | `autumn-forest` | season (autumn) | 20×16 | lightBlue, orange, red, gold, brown, darkGreen | Deciduous trees in autumn colours, one fir | Temperate forests of Europe and North America |
| 4 | `winter-village` | season (winter) | 20×16 | navy, white, brown, yellow, darkGreen, grey | Snowy roofs, lit windows, firs, night sky | A mountain village in winter |
| 5 | `desert-dunes` | landscape | 20×16 | orange (sky), yellow (sun), gold, tan, darkBrown | Dunes at sunset with a camel silhouette | Sahara, North Africa |
| 6 | `fjord` | landscape | 20×16 | lightBlue, white, darkGreen, green, blue, red | Steep green walls, snowy peaks, water, a red boathouse | Western Norway |
| 7 | `rice-terraces` | landscape | 20×16 | lightBlue, lightGreen, green, darkGreen, teal, brown | Curved terraces with water strips and a small hut | South-East and East Asia |
| 8 | `red-fox` | animal | 16×16 | orange, cream, black, brown | Sitting fox, bushy tail with a light tip | Europe, Asia and North America |
| 9 | `elephant` | animal | 16×16 | grey, darkGrey, cream (tusk), tan (ground) | African savanna elephant in profile | Africa, south of the Sahara |
| 10 | `koala` | animal | 16×16 | grey, white, black, green, brown | Koala holding a eucalyptus branch | Eastern Australia |
| 11 | `llama` | animal | 16×16 | cream, brown, darkBrown, red, teal | Llama with a woven saddle blanket | The Andes, South America |
| 12 | `tiger` | animal | 16×16 | orange, black, white, green (grass) | Tiger head, front view, bold stripes | Asia |

Coverage: four seasons; landscapes in Africa, Europe and Asia; animals from Europe, Asia and North America (fox), Africa, Australia, South America and Asia; colour counts from 4 to 6. Later additions from the brief's list (polar bear, hummingbird, crane, octopus, turtle, penguin, chameleon, coral reef, volcano, aurora, mangroves, steppe, mountain lake, savanna) are data-only.

The start-screen list order is: seasons, then landscapes, then animals (the `MOTIFS` order).

## 7. UI

### 7.1 Layout

From top to bottom at 360 px (a 16 px gutter gives a 328 px content width). From 48 rem, the picture sits at inline-start and the controls at inline-end (CSS grid, logical properties).

1. **Title line:** the motif title, and "184 of 320 pixels left" in text.
2. **Picture:** `<canvas>` with a 1-cell track frame drawn around it and station ticks. Cell size = `floor(min(available / W, 28))` px, so 16 px at 360 px for W = 20 and 20 px for W = 16. `image-rendering: pixelated` and `devicePixelRatio` scaling are used. The canvas has `role="img"` and an `aria-label` summary. It is not interactive: the cells are not targets.
3. **Status line** (a polite live region mirrors it): the result of the last move, a hint, or the preview text (§ 7.2).
4. **Waiting slots:** a row of K boxes, at least 48 × 48 px, showing "free" or a shooter.
5. **Lanes:** L columns side by side. Each lane's **front** shooter is a button of at least 48 × 56 px. The shooters behind it are visible as compact non-interactive chips (28 px high, with symbol and number), so every lane is fully visible. When a lane has more than 6 waiting chips, it shows the first 6 and "+n" with a `<details>` to show all. 3 lanes × 96 px fit easily within 328 px.
6. **Actions:** Undo, Restart ("Start this picture again"), Hint. These are 44 px buttons with text labels.
7. **Colours** (`<details>`, collapsed at < 48 rem and open on desktop): one row per colour with symbol, name, "34 left · 6 reachable now", and the total shots waiting. This is the screen-reader and colour-blind overview.
8. **Display options** (`<details>`, per-device `context.preferences`): "Animation" (default on, and always off with `reducedMotion`), "Symbols on all pixels" (default off; when off, symbols show on exposed pixels only, § 7.3), and "Confirm before launch" (default off; § 7.2).

### 7.2 Input

- **Pointer, touch:** tap a lane front or a parked shooter to launch it. Hovering it shows the **preview**.
- **Keyboard:** two roving-focus groups (slots, and lane fronts), each one Tab stop. ArrowLeft and ArrowRight move between items, following the visual order in RTL. Home and End go to the first and last. Enter or Space launches. Esc clears the preview. Ctrl+Z or Cmd+Z undoes. The focus ring is always visible.
- **Preview** (on focus or hover, and on the first tap with "Confirm before launch"): the pixels this launch would remove get an outline with a hatch overlay (not colour alone). The status line says, for example, "Orange ▲ 12: removes 9, then waits in a free place with 3", "… removes 12 and is used up", or "… finds nothing yet and waits (parking)". An illegal move shows the reason, and the button carries `aria-disabled="true"` while staying focusable. Activating it announces the reason and changes nothing.
- **Confirm before launch** (an optional preference for touch users who want the preview): the first tap selects and previews, and a second tap on the same shooter launches. A tap elsewhere cancels.
- After a launch, focus stays on the same lane. If that lane is now empty, focus goes to the next non-empty lane, then the first slot.
- `pause()` blocks input and finishes any animation immediately. There are no timers.

### 7.3 No colour-only information

- Every colour has a **symbol** (§ 6.1) and a **name**. Shooter buttons show the swatch, the symbol and the shots as a number. The accessible name is, for example, "Lane 2, front: orange, triangle, 12 shots".
- In the picture, **exposed pixels always show their symbol**: these are the cells that matter for the next decision. Other pixels show the symbol only with "Symbols on all pixels". This keeps the art readable and the decisions colour-independent.
- Removed and transparent cells show the backdrop. A preview uses a hatch pattern plus an outline. A hint uses a dashed ring plus the word "Hint".
- Forced colours: `forced-color-adjust: none` on the canvas and the swatches (the art keeps its colours). The symbols, the text and the outlines carry the meaning.

### 7.4 Announcements

There is one polite announcement per action. Examples: "Orange ▲ removed 9 pixels, waits in place 2 with 3 shots." "Undone." "Hint: lane 2." "No move left. Undo a move or start again." Pressing Undo repeatedly announces only the latest state.

### 7.5 Motion

If animation is on and `reducedMotion` is false, a shooter token moves along the track and the removed pixels pop in hit order. The total time is capped at 900 ms. The state has already changed when the animation starts. Any input, `pause()` or `dispose()` jumps to the end. There is no motion with `reducedMotion`. The reveal fades in, or appears at once with reduced motion.

### 7.6 RTL

The picture and the track have `direction: ltr`, because they are content, like the boards in other games. The surrounding UI follows the locale: lanes and slots run from inline-start, lane 1 sits at inline-start, and the arrow keys follow the visual order. All CSS uses logical properties. The numbers inside shooters stay left-to-right.

### 7.7 Targets

All interactive elements are at least 44 × 44 px: shooter buttons are at least 48 px, and the action buttons and the details summaries are at least 44 px. The e2e test measures them at 360 × 740 and checks that there is no horizontal page scroll.

## 8. End, reveal and replay

- When the last pixel goes, the board becomes the **reveal**. The original picture is drawn large on its backdrop, without symbols, with the title (`h2`, which receives focus), the place line, and one factual line: "Peeled in 23 launches, 4 of them parking." There are no stars, grades, times or comparisons with other players.
- `finished({ outcome: 'completed', stats: { launches, parks } })` is called exactly once (`reported: true`). The host shows its calm finished panel: "Another round" (same settings, a new seed, so with "Any picture" usually a different motif), "Change settings" and "Back". The game never starts a next picture by itself.
- There are no streaks, collections, "x of 12 seen" counters or unlock order. Every motif is open at every difficulty from the start.
- On `restore` of a solved state, the reveal shows again, and `finished` is not called a second time.

## 9. Fairness: generator and solver

### 9.1 Guarantee

Every generated position comes with a **witness**: a move list that solves it, replayed and checked inside the generator. The base construction (§ 9.2) is solvable **by construction**. Perturbed candidates are accepted only when the solver (§ 9.4) returns a solution, and that solution becomes the witness. Whatever the seed, motif and difficulty, the position is solvable. Tests replay the witness for every motif × difficulty × several seeds (§ 11). The witness is stored in the state (it backs the hint fallback, § 4.7) and is never shown.

### 9.2 Generator

All randomness comes from `createRng(normalizeSeed(seed))`, in a fixed draw order. Budgets are counted in **nodes or steps, never in time**, so a seed gives the same game on every device.

```
generate(seed, difficulty, choice):
  rng = createRng(seed)
  motif = choice == 'any' ? MOTIFS[rng.int(0, MOTIFS.length−1)]     // first draw
        : findMotif(choice) ?? MOTIFS[0]
  P = LEVELS[difficulty]
  order = peelPlan(motif, P, rng)              // shooters in an order where each launch is used up
  lanes0 = deal(order, P.lanes, rng)           // order-preserving deal; lane lengths differ by ≤ 2
  best = { lanes: lanes0, witness: order as lane moves, quality: 0 }
  repeat P.attempts times:
    cand = perturb(lanes0, P, rng)             // move P.moves shooters forward
    sol = solve(cand, P.slots, P.budget)       // § 9.4; undefined if not found within budget
    if sol: q = quality(cand, sol); if q > best.quality: best = { cand, sol, q }; if q == 2: stop
  return state from best
```

- **`peelPlan`:** start with the full picture. Repeat until it is empty:
  1. Draw a pack target `a` from `P.pack`.
  2. For every colour with an exposed cell, simulate `launch({c, a})` on a copy. Let the cells it removes be `r_c ≥ 1`.
  3. Choose among the colours with `r_c ≥ P.pack.min`, weighted by `r_c` (`rng`). If none qualifies, take the colour with the largest `r_c`; ties go to palette order.
  4. Append the shooter `{c, n: r_c}` and apply the launch.

  Each shooter is therefore used up exactly when launched in this order. At least one colour is always exposed (the leftmost present cell of any non-empty row is the front of a left station), so the loop ends. Cost: at most the number of shooters × 8 colours × one launch.
- **`deal`:** go through the shooters in order and assign each to a lane drawn by `rng`. Any lane whose length would exceed the shortest lane + 2 is excluded. The witness is "launch the lane of shooter 1, then of shooter 2, …". It uses no slot.
- **`perturb`:** choose `P.moves` shooters at lane position ≥ 1, weighted towards **late** witness indices (colours that stay covered for long). Move each one forward by 1–3 places in its own lane. Lane contents never change, only the order.
- **Easy:** `attempts = 0`, so the base deal is used. It is solvable without parking, with the generous slots as a safety margin.
- **`quality`:** 2 if the **obvious play** (§ 9.3) fails on the candidate, 1 if the found solution parks at least once, otherwise 0. Medium accepts the best within its attempts. Hard stops at the first quality 2. If none reaches 2, hard keeps the best found, which may be the base deal. Tests measure this rate (§ 11).

Parameters *(calibrate)*:

| | easy | medium | hard |
|---|---|---|---|
| `pack` (min–max) | 14–30 | 8–20 | 5–14 |
| `moves` | 0 | 2–3 | 4–6 |
| `attempts` | 0 | 8 | 12 |
| solver `budget` (expanded nodes per candidate) | — | 4 000 | 4 000 |

### 9.3 The obvious play (triviality check)

This is a deterministic greedy policy, `obviousPlay(position)`. Among the legal moves it picks the one with the most hits. Ties go first to the move that uses its shooter up, then to slot moves before lane moves, then to the lowest index. If no legal move hits, it parks the lowest-index lane front. It stops when the picture is solved (success) or stuck (failure). A medium or hard position on which this policy fails needs real planning.

### 9.4 Solver

- **Depth-first search** over positions with a **memo of failed positions**. Moves are ordered as in § 9.3, so the first dive is the obvious play, then the search backtracks.
- **Position key:** the lane fronts (one index per lane); the slot contents as a sorted list of `(lane, index, shots)`, because which slot a shooter sits in does not affect solvability; and the present-cell bitset, 5 bits per character, which comes to at most 116 characters for 24 × 24. The key is a plain string in a `Map`.
- **Fast internal representation** (allowed, because it is not part of the state): a `Uint8Array` of cells, a per-station front pointer that is advanced lazily past removed cells, and apply/revert instead of cloning. The pure `rules.ts` `launch` stays the reference, and a property test checks that the two agree (§ 11).
- **Result:** `{ solution: Move[] }`, `{ unsolvable: true }` (search space exhausted within budget) or `{ unknown: true }` (budget hit).
- **Termination:** every move either removes at least one cell or moves a shooter from a lane into a slot. The number of slot entries is at most the number of shooters. Depth ≤ shooters + filled cells.

### 9.5 Complexity bounds (worst cases admitted by `isValidState`)

| Quantity | Bound |
|---|---|
| Cells | ≤ 24 × 24 = 576; stations ≤ 96 |
| One launch | ≤ (n+1) × S station visits + O(W·H) pointer advance → ≤ 100 × 96 + 576 ≈ 10⁴ steps |
| Shooters | ≤ 120 (prototype about 10–45); shots per shooter 1–99 |
| Moves in a game | ≤ shooters + cells ≤ 696 (`isValidState` cap 700) |
| Replay (`position(state)`, also in `isValidState`) | ≤ 700 launches; typically 20–60 launches, well under 5 ms |
| Generator | ≤ 12 candidates × 4 000 nodes × ≤ 7 children ≈ 3.4 × 10⁵ launches, worst case. Typical: the first dive succeeds (tens of nodes). **Target < 60 ms per generation on CI**; the test asserts < 150 ms per instance and the aggregate under 50 % of its timeout. |
| Hint | ≤ 20 000 nodes for the current position, plus ≤ 8 ancestors × 2 000 nodes; target < 300 ms on a phone, in response to an explicit press only |

## 10. Settings and state

### 10.1 Start-screen settings (ADR 0017)

```ts
settings: [
  { kind: 'difficulty' },
  { kind: 'choice', id: 'motif', labelKey: 'setting.motif', valueKey: 'motif',
    values: ['any', ...MOTIFS.map((m) => m.id)], default: 'any', display: 'select', hintKey: 'setting.motifHint' }
],
settingsOf: (state) => ({ difficulty: state.difficulty, motif: state.choice })
```

- With more than 4 values the host draws a labelled select. Its labels are `motif.any` ("Any picture") and `motif.<id>`, generated from the motif titles with the colour count appended ("Red fox · 4 colours", using a translated pattern). The default is `any`. `begin` is ignored, because there is no intro screen. `setupInGame` is not used.
- **No "next" option.** It would depend on per-device memory of what was played (`settingsOf` and "Another round" could then not repeat the same game, as the contract requires), and "next unseen" reads like a collection mechanic. "Any picture" draws from the seed, so "Another round" brings a fresh picture.
- Untrusted input: an unknown difficulty → `easy`, and an unknown motif → `any`'s draw (the host has already resolved it; the game still treats the record as untrusted).
- The state keeps `choice` (what the start screen said) separately from `motif` (what was drawn), so `settingsOf` is exact.

### 10.2 State (JSON, `stateVersion: 1`)

```ts
type Move = string;                 // /^[LS][0-4]$/  ("L0"…"L3", "S0"…"S4")

interface PeelState {
  seed: number;                     // uint32
  difficulty: 'easy' | 'medium' | 'hard';
  choice: string;                   // start-screen value: 'any' or a motif id (kept even if that motif is later removed)
  motif: string;                    // id of the drawn motif (title/place lookup; unknown id → generic "Your picture")
  picture: {                        // full copy, so redrawn or removed motifs never break a save
    w: number; h: number;           // 4..24
    rows: string[];                 // h strings of w chars, palette keys or '.'
    palette: { key: string; hex: string; name: string }[];   // 1..8, keys unique [a-z], hex #rrggbb, name in vocabulary
    backdrop: string;               // #rrggbb
  };
  lanes: { c: string; n: number }[][];   // initial lanes, front first; 1..4 lanes, ≤ 120 shooters, n 1..99
  slots: number;                    // K, 1..5
  witness: Move[];                  // solves the initial position
  moves: Move[];                    // played so far; current position = replay(initial, moves)
  restartUndo: Move[] | null;       // moves before the last Restart, until the next move
  reported: boolean;                // finished() already called
}
```

The size is roughly 1–3 KB.

**`isValidState` never throws.** It checks every bound above. It checks the invariant (per colour, Σ shots over all lanes = filled cells of that colour). It checks that `witness` replays legally to an empty picture, and that `moves` (and `restartUndo`, when present) replay legally. It checks `reported ⇒` the replayed position is solved. Replays are bounded by § 9.5. No PRNG state is stored, because all randomness is spent in generation.

**Pure API in `rules.ts`** (DOM-free):

- `createInitial(seed, difficulty, choice)`
- `position(state)`, which returns `{ cells, laneFront[], slots[], solved, stuck }`
- `launch`, `legalMoves`, `preview(pos, move)`, which returns `{ removed: [x, y][], left, parks, legal, reason }`
- `play(state, move)`, which returns the same object when the move is illegal
- `undo`, `restart`, `undoTo(state, k)`
- `exposed(pos)`
- `obviousPlay`, and `solve(pos, budget)` (in `solver.ts`)
- `isPeelState`

## 11. Test plan

**`test/rules.test.ts`** (TDD and fast-check):

- Fronts and exposure: the worked examples of § 4.3 as fixtures, with exact station order and hits. A transparent cell never blocks. A corner cell is the front of two stations. `exposed` equals a brute-force scan of all four directions (property, random small grids).
- Launch properties (random grids up to 8 × 8 and random shooters): hits ≤ n; every removed cell had colour c and was a front when hit; laps stop exactly after a lap without hits; the result does not depend on how the grid is copied; the invariant is preserved.
- Legal moves: a lane launch with leftover shots and no free slot is illegal; a slot relaunch without hits is illegal; parking takes the lowest free slot; a relaunch keeps its slot; an illegal `play` returns the same object.
- Stuck detection on a hand-made position (all slots full of unreachable colours).
- Undo, restart, `restartUndo`: arbitrary sequences of legal moves, undos and restarts never throw, always satisfy `isValidState`, and undo restores the previous position exactly.
- `isValidState`: never throws on `fc.anything()`. It rejects mutated saves: a broken invariant, a bad row length, an unknown palette key, a witness that does not solve, an illegal move in `moves`, more than 5 slots, more than 4 lanes, a bad hex, and `reported` on an unsolved position.
- `settingsOf` round trip: `createInitial(seed, d, choice)` gives `{ difficulty: d, motif: choice }` for `any` and every motif id.

**`test/solver.test.ts`:**

- The fast internal launch equals the pure `launch` on random positions (property).
- Against an **independent oracle**: plain breadth-first search over the pure rules with no memo shortcuts, on tiny hand-made and random puzzles (≤ 5 × 5, ≤ 6 shooters, 2 lanes, 1–2 slots). The solver and the oracle agree on solvable or unsolvable on ≥ 200 random instances and on hand-made cases, including one that is solvable only by parking and one that is unsolvable because of too few slots.
- Every returned solution replays to solved. `unsolvable` is only reported when the oracle agrees.
- Hint: on a doomed position, `undoTo` k is solvable. The witness-prefix fallback is always solvable.

**`test/motifs.test.ts`** (data validity, iterating over `MOTIFS`):

- All rules of § 6.2 marked "test": dimensions, characters, palette references both ways, 3–8 colours with ≥ 4 pixels each, ΔE thresholds, backdrop distance, pixel-count range, unique ids (not `any`), titles and places in all 16 locales and within length, colour names in the vocabulary and unique per motif.
- The generated messages contain `motif.<id>` in every locale (also covered by `validateSettings` in the contract).

**`test/generator.test.ts`:**

- Deterministic: the same seed, difficulty and choice give a deep-equal state.
- For **every motif × every difficulty × 8 seeds**: `isValidState` holds, the witness replays to solved, the bounds of § 9.5 hold, lane lengths are balanced, and the per-colour shots invariant holds.
- Levers are visible: easy gives 0 parks in the witness; hard reaches quality 2 in ≥ 60 % of seeds over all motifs *(calibrate; record the measured rate in the implementation notes)*; medium and hard give at least one perturbation.
- `any` covers all motifs over 200 seeds.
- Timing: each generation < 150 ms, and the whole file < 50 % of its timeout under load (CI-safe sizes).

**`test/contract.test.ts`:** `runGameContract(game, { interact: (root) => root.querySelector<HTMLButtonElement>('[data-testid="pp-lane-0"]')!.click() })`. With all slots free at the start, every lane front is legal at every difficulty: it is either used up or it parks in a free slot. So the click always triggers `requestSave`. Without a difficulty, `newGame` uses `easy`. The settings are sampled by the contract (3 difficulties × 13 motif values).

**`test/view.test.ts`** (jsdom): preview text for a legal and an illegal move; `aria-disabled` and the reason announcement; Hint marks a lane; the stuck panel appears; the reveal shows the title and calls `finished` once; restore of a solved state shows the reveal without a second `finished`; symbols on exposed cells (via an exposed-cell list the view exposes for tests, since canvas is not inspectable in jsdom).

**`e2e/games/pixel-peel.spec.ts`:**

- `startGame` with `chooseSetting('motif', 'red-fox')` on easy. Read the save, play the stored `witness` by clicking `pp-lane-i` / `pp-slot-j`, and expect the reveal heading "Red fox" plus the host's finished panel.
- `expectResumeAfterReload` after two moves: the moves and the position survive, and so does Undo.
- Undo after a park restores the lane. Restart, then Undo, brings the moves back.
- Keyboard only: Tab to the lanes, ArrowRight, Enter launches, and the status announces it.
- Hint shows a "Hint" marker on a shooter.
- At 360 × 740: no horizontal scroll, every shooter and action button ≥ 44 × 44 px, and the canvas fits.
- In an `ar` locale: the lane order follows inline-start, and the picture is not mirrored (the canvas has `dir=ltr`).

**Mutation** (Stryker, `pnpm mutation`): run it on `rules.ts` and `solver.ts`. Surviving mutants in the launch loop or the legality checks must be killed by the property tests above.

## 12. Files and integration

- **Implementer (feature agent):**
  - `packages/games/pixel-peel/src/{metadata,messages,rules,solver,generate,view,index}.ts` and `styles.css`
  - `src/motifs/{types,index}.ts` and the 12 motif files
  - `src/locales/<locale>.ts` (UI strings, typed against English, as in mini-optimizer)
  - `test/{rules,solver,motifs,generator,view,contract}.test.ts` and `test/oracle.ts`
  - `scripts/render-motifs.ts`
  - `e2e/games/pixel-peel.spec.ts`
- **Orchestrator** (per the pipeline brief):
  - `packages/games/pixel-peel/package.json` (copied from an existing game)
  - the dependency in `apps/web/package.json`
  - the registry line appended last in `apps/web/src/registry.ts`
  - the SVG preview in `apps/web/src/previews.ts`: a 6 × 4 block of coloured squares with the outer ring partly missing, a thin track around it, and three shooter tokens below (one with a small triangle symbol and a number)
  - `pnpm install`
  - `docs/ROADMAP.md`, and one line in `docs/third-party.md` (§ 6.4)

## 13. Localisation scope

There are about **75 keys** in the game namespace, in all 16 locales. On top of that, 12 × 2 motif texts live in the motif data (type-checked for all locales).

- **Identity:** `title`, `tagline`, `rules` (3). The rules text covers: a shooter runs around the edge; it removes only its own colour that it can reach; it keeps going while it hits; waiting places are limited; Undo is free.
- **Settings:** `setting.motif`, `setting.motifHint`, `motif.any`, the "{title} · {n} colours" pattern, and the three `difficulty.*` labels plus their hint (8).
- **Colour names:** `colour.*` (24).
- **UI and status:** lane and slot labels, free, shots, preview lines (removes/used up/waits/parking), illegal reasons (2), pixels left, colours overview, the three display options, Undo, Restart, Hint, and the three hint lines (~25).
- **Announcements:** launch result variants, undone, restarted, restart undone, stuck, hint (~10).
- **Reveal:** "Peeled in {launches} launches, {parks} of them parking", and the generic "Your picture" (~3).
- Plural-sensitive phrases use neutral wording ("Shots: {n}") as other games do.

## 14. Risks

| Risk | Mitigation |
|---|---|
| **Copying the commercial reference** | No names, levels, art or layouts are taken. The name is generic. Every motif is self-drawn (§ 6.2 rule 9). The mechanics are re-specified with our own deliberate differences: one shooter at a time (turn-based, no real-time belt capacity); laps continue while hitting; parking is an explicit legal move; a full-lane view instead of hidden stacks; a proven-solvable generator; a preview and a proven hint. The layout is our own: slots above the lanes, and a track drawn as a thin frame with ticks. The art direction follows the collection's tokens, not the reference's style. |
| Trademark on the name | The words are descriptive ("Pixel Peel", "Pixel für Pixel"). The title is a message key and the id is neutral, so a rename touches no saves. This is flagged in the open questions. |
| Motif quality at 16–20 px | PNG renders (§ 6.3) for the owner's review before release. The silhouette and colour rules are enforced where testable. All data is editable in one file per motif. |
| Similar colours confuse players | ΔE threshold test, the symbol on every exposed pixel, colour names everywhere, and the colours overview. |
| Generator too often trivial on hard | The quality rate is measured in tests. The levers are `moves`, `pack` and `attempts`, all within the § 9.5 bounds. The prototype accepts a solvable fallback and records the rate. |
| Generation or hint slow on low-end phones | Node budgets (deterministic). Fast internal representation. Hint only on explicit press. Generation is measured in tests. If needed, `budget` is reduced (solvability does not depend on it: the base deal is always a valid fallback). |
| Many tiny shooters (1–2 shots) on some motifs | `peelPlan` prefers colours with `r_c ≥ pack.min`. The "no single-pixel noise" motif rule. The data test warns (fails) if a motif's easy plan has more than 40 % shooters below 3 shots *(calibrate)*. |
| Preview makes it too easy | It shows only the next launch's effect. Planning several launches ahead with limited slots remains the puzzle. Hard still requires the obvious play to fail. |
| Save robustness after the owner redraws motifs | The state holds a full copy of the picture and lanes. An unknown motif id only loses the title, which falls back to "Your picture". |
| Canvas and accessibility | The canvas is decorative-plus-summary (`role="img"`). All decisions are possible via the buttons, the preview text and the colours overview. The e2e test plays only via buttons. |

## 15. Decisions taken in place of the owner (the owner is away)

1. **Name:** "Pixel Peel" / "Pixel für Pixel", with the id `pixel-peel`.
2. **Laps continue while hitting** (instead of exactly one lap per launch). This avoids pointless repeat taps. The puzzle stays in the order and the parking.
3. **Grid size per motif, not per difficulty** (§ 4.1). The prototype uses 16 × 16 and 20 × 16.
4. **Lanes are fully visible.** Only fronts are launchable. Slots are positional, and parking takes the lowest free slot.
5. **Hint included**, without penalty and only on request, with proven answers and a safe undo target.
6. **No "next picture" setting.** "Any picture" is drawn from the seed.
7. **Undo after the reveal is not offered.** The reveal is the natural end.

## 16. Open questions for the owner (non-blocking)

1. Is the name acceptable, or should it be more descriptive, for example "Colour Peel" or "Peel the Picture"?
2. Should easy merge similar shades into one colour (fewer colours, but a play picture that differs from the reveal)? It was left out of the prototype.
3. Should there be a short "how it moves" mini-demo (a 3 × 2 picture, like the worked example) as an optional first screen? The prototype uses the rules text and the preview instead.

## Implementation notes (2026-10-17, prototype)

Orchestrator decisions on § 16: the names stay ("Pixel Peel" / "Pixel für Pixel"); easy does not merge shades; no mini-demo.

**Built as designed:** the rules (§ 4) with the worked examples as fixtures; the DFS solver with a failure memo and a fast byte-array/front-pointer representation, checked against the pure launch (property) and against an independent BFS oracle (600 random tiny puzzles, ring-nested ones included, plus the hand-made "only by parking" and "too few slots" cases); the generator with a stored witness; the obvious play; undo, restart with `restartUndo`, `undoTo`; the hint (witness-path shortcut, solver, latest solvable ancestor, witness-prefix fallback); the stuck panel; the reveal; settings and `settingsOf`; all 16 locales; 12 motifs as data.

**Deviations from the design:**

1. **Levels (§ 5, § 9.2).** With the designed numbers the obvious play still solved almost every perturbed hard position (it failed on 4 of 96 seeds). Two findings: with "keep lapping while hitting", *larger* packs make a position harder (more shots are left over and need a slot), not smaller ones; and three slots are generous. Final levels:

   | | easy | medium | hard |
   |---|---|---|---|
   | lanes / slots | 2 / 5 | 3 / **3** (design 4) | 3 / **2** (design 3) |
   | pack | 14–30 | **10–24** | **12–28** |
   | shooters moved forward per attempt | 0 | **6–10** | **10–14** |
   | attempts / solver budget | 0 / – | 8 / 4 000 | 12 / 4 000 |

   Perturbations **accumulate**: each attempt builds on the last candidate the solver solved, so the disorder grows step by step while every accepted step stays proven solvable. Equal quality prefers the later (more disordered) candidate. The difficulty hint says "fewer waiting places and more shooters out of order" (no claim about pack size).
2. **`createInitial` lives in `generate.ts`** (not `rules.ts`), so the pure rules import neither the generator nor the solver.
3. **Places:** red fox "Europe, Asia, North Africa and North America" (the native range includes North Africa); tiger "South, South-East and East Asia"; cherry blossom "Spring in Japan".
4. **Count phrases** are plural-neutral ("removed 9, waits in place 2 with 3 left"; Slavic and other locales use "label: n"), as in other games.
5. **Preview after a launch:** the button just launched does not preview its next shooter until the pointer leaves or focus moves, so the status line keeps the result (browsers re-enter a button when its content is replaced). Hovering a shooter first finishes a running animation.
6. **Render script** writes to `packages/games/pixel-peel/renders/` (package-local `.gitignore`) or to a directory given as its argument. Node runs it directly (type stripping), so it imports each motif file and reads the order from `motifs/index.ts` as text.

**Measured (this container, Node 22, 12 motifs × 8 seeds per difficulty):**

| | easy | medium | hard |
|---|---|---|---|
| generation, average / max | 0.8 / 6.3 ms | 4.7 / 10.9 ms | 3.7 / 16.6 ms |
| obvious play fails (quality 2) | 0 % | 21 % (20/96) | 61 % (59/96) |
| quality ≥ 1 (parking needed or obvious play fails) | 0 % | 53 % | 73 % |
| shooters per game (average) | 14.9 | 18.3 | 16.1 |

The hint off the witness path on hard takes 0.5 ms on average, 4 ms at most (budgets: 20 000 nodes, then 8 ancestors × 2 000). Tests assert each generation < 150 ms and the average < 60 ms, a hard quality-2 rate ≥ 50 % and a medium one ≥ 15 %, and at most 40 % shooters below 3 shots in each motif's easy plan (about 5 % measured). The whole package suite (182 tests) runs in about 4 s, far below the 20 s per-test timeout.

**Known limits of the prototype:** the motifs are first drafts for the owner's review (`node packages/games/pixel-peel/scripts/render-motifs.ts <dir>`); medium is still often solvable by the obvious play; Stryker was not run.
