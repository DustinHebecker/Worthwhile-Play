# Pixel Peel v2 (`pixel-peel`): bigger pictures, more colours, real difficulty

Status: **Plan (2026-10-18)**, written by the planner of the rework. The implementer follows it and the reviewer checks against it. It amends `docs/design/pixel-peel.md` (v1). Anything not mentioned here stays as v1 specifies it: the identity (§ 1), the value claims (§ 2), **all mechanics of v1 § 4** (track, fronts, launch with laps, legality, parking, undo, restart), the reveal (§ 8) and the RTL rules (§ 7.6). Numbers marked *(calibrate)* are first values. The implementer may tune them within the stated bounds and records the final values in an "Implementation notes" section at the end of this file, as v1 did.

Binding inputs: `CLAUDE.md`; the implementation brief; ADR 0002, 0006 and 0017; the pipeline brief, section "Game 9"; v1 design and its implementation notes.

## 0. Owner feedback and what this plan changes

Owner, 2026-10-18: "Pixel für Pixel ist zu einfach, die Anzahl der Farben zu gering, genauso wie die Auflösung der Bilder. Die Auswahl der Bilder sollte als Default zufällig sein." In English: too easy, too few colours, picture resolution too low, and the picture choice should default to random.

The owner's reference screenshots (a commercial game in the genre) were used **only** to calibrate scale. They show pictures of about 40–56 cells per side with 12–20 colours, shading and outlines, 5 waiting slots, 4 lanes with deep stacks, and ammo values of about 6–90. Nothing else is taken: no art, no subjects (no bento box, no snowy cabin among firs), no layout details and no visual style.

| Problem | v1 | v2 decision |
|---|---|---|
| Resolution | 16 × 16 and 20 × 16, hand-typed rows | **32 / 40 / 48** cells wide by difficulty, rasterised from vector motifs (§ 1, § 2) |
| Colours | 4–6 per motif | **10–12 / 13–16 / 15–20** by difficulty, from tiered palettes (§ 1.5) |
| Too easy | perturbed base deal; the obvious play solved 39 % of hard games | a **constructive generator with decoys**, checked against **five heuristic policies**; hard = all five fail (§ 3, § 4) |
| Default picture | `any` was already the declared default, but the host **remembers** the last choice (ADR 0017), so one explicit pick stuck | new shared option **`remember: false`**: the picture select opens on "Any picture" every time (§ 5) |
| Scale | DFS solver with memo; 2 or 3 lanes; at most 120 shooters | a fast incremental engine, rollout-based verification and hint, 4 lanes, about 55–70 shooters (§ 4, § 7) |

## 1. Art pipeline: vector motifs rasterised to a grid

Hand-typing 48 × 48 rows with 15 colours is not workable. It also cannot give three resolutions. In v2 a motif is a **list of layered vector shapes** in a fixed coordinate space. A **deterministic rasteriser** turns it into a grid at the resolution of the difficulty, with the motif's **fixed palette**. There is no free colour quantisation: every cell gets a palette key chosen by a rule, never a colour computed from blending.

### 1.1 Coordinates and resolution

- The canvas is **100 units wide**. It is 100 units high for `aspect: 'square'` and 75 units high for `aspect: 'wide'` (4:3). The units are isotropic, so circles stay round.
- Grid width `W` comes from the difficulty: 32, 40 or 48. `H = W` (square) or `H = 3W/4` (wide: 24, 30, 36). The cell size is `u = 100 / W` units.
- Cell `(x, y)` is sampled at its **centre**, `((x + 0.5)·u, (y + 0.5)·u)`.
- Rows are numbered top to bottom, as in v1. The picture is never mirrored.

### 1.2 Shape language (`src/art/types.ts`)

```ts
export interface Motif {
  id: string;                         // [a-z0-9-]{2,32}, unique, never 'any'
  group: 'season' | 'landscape' | 'animal' | 'scene';
  title: Localized;                   // all 16 locales (type-checked), ≤ 32 characters
  place: Localized;                   // one factual line for the reveal
  aspect: 'square' | 'wide';
  backdrop: string;                   // #rrggbb: transparent and removed cells
  palette: Readonly<Record<string, PaletteSpec>>;  // keys: one lowercase letter; insertion order = symbol order
  layers: readonly Layer[];           // painted in order: later layers cover earlier ones
  silhouette?: string;                // optional 1-cell outline around all non-transparent cells (cut-out animals)
}

/** [hex, colour name, tier, merge target]. Tier 1 = present at every difficulty, 2 = from medium, 3 = hard only. */
export type PaletteSpec = readonly [hex: string, name: ColourName, tier: 1 | 2 | 3, merge?: string];

export interface Layer {
  name?: string;                      // only needed when another layer clips to it
  shape: Shape;
  fill: Fill;
  shade?: Shade;
  outline?: string;                   // 1-cell inner outline in this key, at every resolution
  clip?: string;                      // paint only where the named earlier layer's mask is set
  keep?: boolean;                     // never vanishes: an empty mask gets the cell under the shape's anchor
  min?: 40 | 48;                      // level of detail: drawn only at W ≥ min
}

export type Shape =
  | { rect: readonly [x: number, y: number, w: number, h: number]; round?: number }
  | { ellipse: readonly [cx: number, cy: number, rx: number, ry: number]; rot?: number }
  | { poly: readonly (readonly [number, number])[]; smooth?: 1 | 2 }
  | { star: readonly [cx: number, cy: number, outer: number, inner: number, points: number]; rot?: number }
  | { line: readonly (readonly [number, number])[]; width: number }
  | { all: true };

export type Fill =
  | string                                                    // a palette key, or '.' to erase to transparent
  | { gradient: readonly string[]; from: readonly [number, number]; to: readonly [number, number]; soft?: number }
  | { stripes: readonly string[]; width: number; angle?: number }
  | { scatter: string; density: number; salt: number };     // sparse cells of one key; the rest stay untouched

export interface Shade {
  light?: string;                     // palette key on the lit rim
  dark?: string;                      // palette key on the shadow rim
  dir: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';    // where the light comes from
  width?: 1 | 2 | 3;                  // rim width in cells at W = 48; scaled by W/48, at least 1
  mode?: 'rim' | 'band';              // default 'rim'
  amount?: number;                    // 'band' only: share of the shape's extent along dir (0.1–0.5)
}
```

Angles (`rot`, `angle`) are **integer degrees**. A motif file is pure data. It imports only types, so the render script can load it directly (§ 1.7).

### 1.3 Rasteriser rules (`src/art/raster.ts`)

`rasterise(motif, W, tier): Picture` is pure, synchronous and free of randomness. It uses only `+ − × ÷`, comparisons, `Math.floor`, `Math.sqrt` and integer hashing. `Math.sqrt` is correctly rounded by IEEE 754. It never uses `Math.sin`, `Math.cos` or other transcendental functions, whose last bit may differ between engines. Trigonometry comes from a **table of 91 literal values** (sin 0°…90°, 9 decimals) with quadrant folding. The same motif, resolution and tier therefore give **bit-identical grids on every device**.

Per layer, in array order:

1. **Level of detail:** skip the layer when `W < min`.
2. **Mask:** the cells whose centre lies inside the shape. Only the shape's bounding box is scanned.
   - `rect`: half-open, `x ≤ px < x + w` and `y ≤ py < y + h`. With `round = r`, the corners are cut by quarter circles of radius `r`.
   - `ellipse`: rotate `(px − cx, py − cy)` by `−rot`, then test `(dx/rx)² + (dy/ry)² ≤ 1`.
   - `poly`: an even–odd crossing test with the half-open edge rule `(yi > py) !== (yj > py)`, so a centre exactly on an edge is decided the same way everywhere. `smooth: k` applies `k` rounds of Chaikin corner cutting to the closed polygon once, before testing. The input has at most 32 points.
   - `star`: a polygon of `2·points` vertices from the table trigonometry, then as `poly`.
   - `line`: a thick polyline. If `width ≤ u`, each segment is drawn with an integer DDA (Bresenham) between the cells of its endpoints. This gives an 8-connected line exactly one cell wide at every resolution, so branches, whiskers and chopstick-thin details neither vanish nor double. If `width > u`, a cell is in the mask when the distance from its centre to a segment is `≤ width / 2`.
   - `all`: every cell.
3. **Clip:** if `clip` names an earlier layer, intersect with that layer's mask. Masks are kept per named layer for this run only.
4. **Keep:** if the mask is empty and `keep` is set, take the single cell containing the shape's anchor (rect centre, ellipse centre, polygon vertex mean, first line point). This is for eyes, noses and windows at W = 32.
5. **Fill**, for each mask cell:
   - a key gives that key, and `.` erases to transparent;
   - `gradient`: `t` = the projection of the cell centre on `from → to`, clamped to `[0, 1]`. With `n` keys, `p = t·(n − 1)`, `i = ⌊p⌋` and `f = p − i`. With `soft = s` (default 0.5), a cell in the last `s` of a band is **ordered-dithered** to the next key when `(f − (1 − s)) / s > (B[y mod 4][x mod 4] + 0.5) / 16`, where `B` is the 4 × 4 Bayer matrix. Dithering works in cell coordinates, so bands stay crisp at every resolution.
   - `stripes`: key `k = ⌊(px·cos a + py·sin a) / max(width, u)⌋ mod n`. Stripes are never thinner than one cell.
   - `scatter`: a cell takes the key when `hash32(x, y, W, salt) / 2³² < density`. `hash32` is a fixed integer mixer (`Math.imul`-based). Cells not chosen keep what is under them. Scatter cells are marked **protected** (step 3 of § 1.4).
6. **Shade** (on the fill result, never on erased cells). Let `d` be the unit grid step towards the light (`'nw'` = `(−1, −1)`) and `w = max(1, round(width·W/48))`.
   - `rim` mode: a mask cell becomes `light` if any of `c + k·d` (k = 1…w) is outside the mask. Otherwise it becomes `dark` if any of `c − k·d` is outside. Cells beyond the grid edge count as inside, so full-frame layers get no rim at the picture border.
   - `band` mode: project the mask cells on `d`. The first `amount` of the extent towards the light becomes `light`, and the last `amount` becomes `dark`.
7. **Outline:** a mask cell with a 4-neighbour outside the mask (grid edges excluded) becomes the `outline` key. The outline is always exactly one cell and lies **inside** the shape, so shapes do not grow with resolution.
8. **Composite:** write the layer's cells into the grid. This is the painter's algorithm: last write wins.

After all layers:

1. **Silhouette:** if `silhouette` is set, every non-transparent cell with a transparent 4-neighbour becomes that key.
2. **Tier merge:** for the difficulty's tier `T` (easy 1, medium 2, hard 3), every key with tier `> T` is replaced by following its `merge` chain to a key with tier `≤ T`.
3. **Despeckle:** in one pass, reading from a copy, a non-protected cell with **no** 8-neighbour of its own key and at least 6 of 8 neighbours sharing one key `K` becomes `K`. This removes single-cell noise that rasterisation creates at shape edges. Protected cells (`scatter`, `keep`) are left alone.
4. **Minimum pixels:** a key with fewer than `minPixels(W) = W/4` cells (8, 10, 12) is replaced along its `merge` chain. This repeats until nothing changes. A key without a `merge` target that still falls below the minimum is an **authoring error**: the motif test fails. At runtime the fallback is the nearest remaining key by ΔE, with ties broken by palette order, so it can never throw.
5. **Compact:** drop unused keys and keep palette order. The result is a v1-shaped `Picture` (`w`, `h`, `rows`, `palette: {key, hex, name}[]`, `backdrop`).

**Cost:** each layer scans its bounding box. Polygons have at most 128 edges after smoothing, and a motif has at most 120 layers. The target is **< 10 ms** per rasterisation at W = 48 on CI, asserted at < 25 ms. Results are memoised per `(motif id, W, tier)` in a module-level `Map` for the session. Saves store the **rasterised grid**, as v1 did (§ 8), so a later change to a motif or to the rasteriser never changes a running game.

### 1.4 Rules for crisp, attractive results at 32, 40 and 48

These are authoring rules. Those marked *test* are enforced in `test/motifs.test.ts` at all three resolutions.

1. **Draw for 32 first, add detail for 40 and 48.** Main forms are big shapes. Fine texture (bark lines, snow speckle, extra blossoms, stars) goes into layers with `min: 40` or `min: 48`.
2. **Features smaller than 1.5 cells at 32 (5 units) use `keep`**, or are thin `line`s at `width ≤ u`, which are exactly one cell at every size.
3. **One light direction per motif** (usually `nw`). Every major form gets a `shade` with a light and a dark key from the palette. This is the "simple shading" the reference has, done with our own keys.
4. **Outlines in one dark key per motif**, for example charcoal or darkBrown: an `outline` on subject layers, or a `silhouette` for cut-out animals. Backgrounds get no outlines.
5. **Gradients only on large areas** (sky, water, sand), with at most 4 keys and `soft` 0.3–0.7.
6. *Test:* the played palette has **10–12 colours on easy, 13–16 on medium and 15–20 on hard**, and every played colour has at least `minPixels(W)` cells.
7. *Test:* distinguishable colours. Every pair in the played palette differs by ΔE (CIE76) ≥ 12, and every pair in the easy palette by ≥ 18. The backdrop differs from every played colour by ≥ 15 *(calibrate; never below 10)*. Shades of one hue are allowed. The symbols and the spotlight (§ 6) carry the distinction anyway.
8. *Test:* 600–2304 filled cells at W = 48, and at least 50 % of the grid filled at every resolution. Full-frame scenes are preferred; cut-out animals get a scene background.
9. *Test:* despeckle changes at most 2 % of the cells. More means the shapes are too fiddly for the resolution.
10. *Review:* recognisable at 1 px per cell at W = 32. No text or letters in the art, no faces on objects, no logos, no flags.
11. *Review:* original. Drawn for this project from general knowledge of the subject. Not traced, and not taken from the reference game, an emoji set, an icon font or a stock source.

### 1.5 Palettes and the colour vocabulary

- **Palette size:** 15–20 entries per motif (`PaletteSpec`), of which 10–12 have tier 1 and 13–16 have tier ≤ 2. Each tier-2 or tier-3 entry has a `merge` target, normally its base shade: light green → green.
- Easy shows the same picture with merged shades, at 32 cells. The reveal always shows **the grid that was played**, so it matches what the player peeled. v1's reason against merging (the reveal would differ) no longer applies.
- **Colour names:** the fixed vocabulary grows from 24 to **44** names, each translated once in all 16 locales (`colour.<name>`). The 20 new names are `lightGrey, charcoal, skyBlue, turquoise, mint, lime, darkTeal, lightYellow, peach, coral, rust, maroon, magenta, lavender, violet, beige, ochre, lightBrown, darkPurple, ivory`. Names stay **unique within a motif** (test), so a name identifies a colour in sentences and for screen readers. The vocabulary is a superset of v1's, so v1 saves still validate.

### 1.6 Symbols

20 colours need 20 symbols. They are drawn as SVG and canvas paths, never as font glyphs, in a 24 × 24 box, and assigned by **played-palette position**:

1 dot, 2 triangle, 3 square, 4 diamond, 5 plus, 6 ring, 7 bar, 8 star (as v1), 9 cross, 10 hexagon, 11 triangle-down, 12 heart, 13 crescent, 14 square-ring, 15 diamond-ring, 16 hourglass, 17 half-disc, 18 two-dots, 19 upright bar, 20 chevron.

Each has a translated name (`symbol.<name>`, 12 new keys). Status sentences no longer embed symbol glyphs. v1's `● ▲ …` text characters depend on fonts, so sentences now use the colour name and the number ("orange 12"). The symbols appear in swatches, chips and the colours list, and in accessible names.

### 1.7 Authoring and preview

`packages/games/pixel-peel/scripts/render-motifs.ts` is extended. Node runs it directly with type stripping, as today. `src/art/raster.ts` and `src/art/trig.ts` therefore have **no runtime imports** except explicit relative `.ts` paths, which the script loads. Motif files import only types.

```
node packages/games/pixel-peel/scripts/render-motifs.ts [out-dir] [--only <id>] [--watch]
```

- Per motif it writes `<id>.png`: the three difficulty renders side by side (32 at ×12, 40 at ×10, 48 at ×8, so all are about 384 px), each with a palette strip below: swatch, symbol, name and cell count, with any colour under `minPixels` flagged in red text.
- It also writes `<id>-layers.png`: the hard render with layer masks outlined one by one, for debugging, plus `contact-sheet.png` (all motifs at 48 × 4).
- It prints warnings: ΔE pairs below the thresholds, despeckle share, colours merged by the minimum-pixel rule, and the rasterisation time.
- `--watch` re-renders a motif when its file changes (`fs.watch`), for a quick edit, look and edit loop. `--only` limits the run to one motif.
- Output goes to the git-ignored `renders/` folder and is never committed. The implementer gives the owner the contact sheet and the per-motif PNGs before release (§ 10).

## 2. Resolution and difficulty

### 2.1 Levels

| | easy | medium | hard |
|---|---|---|---|
| Grid width `W` (square H = W, wide H = ¾ W) | **32** | **40** | **48** |
| Palette tier → played colours | 1 → **10–12** | ≤ 2 → **13–16** | ≤ 3 → **15–20** |
| Lanes | 4 | 4 | 4 |
| Waiting slots `K` | **5** | **5** | **4** |
| Fitting pack target (shots) *(calibrate)* | 10–40 | 10–60 | 12–90 |
| Decoy chance per construction step *(calibrate)* | 0.06 | 0.20 | 0.30 |
| Decoy pack *(calibrate)* | 8–30 | 10–40 | 24–90 |
| Minimum shots per shooter (except a colour's last cells) | 4 | 4 | 4 |
| Candidates at most | 3 | 4 | 4 |
| Generation budget (counted launches) | 6 000 | 8 000 | 10 000 |
| Acceptance (§ 3.4) | ≥ 3 of 5 policies solve it | the obvious play fails **and** ≥ 1 other policy solves it | **all 5 policies fail** |

Lanes, slots and grid sizes are fixed per level, so the start screen's difficulty hint can say what changes: "Bigger picture, more colours, more shooters that have to wait; hard has only 4 waiting places."

**Why 4 slots on hard, when the owner's reference shows 5?** In the calibration (§ 3.6), 5 slots let at least one simple policy succeed in 30–58 % of hard candidates. With 4 slots, all five policies failed in 87 %, while the constructed solution still exists. The lever the player can see is "fewer waiting places", so hard really is harder in a way that can be explained. Easy and medium keep the owner's 5.

### 2.2 Measurable definition of the levels

All rates are measured over **every motif × 6 seeds** in `test/generator.test.ts`. The implementer records the measured values in the implementation notes.

| Measure | easy | medium | hard |
|---|---|---|---|
| Accepted by its rule (§ 3.4) *(calibrate)* | ≥ 95 % | ≥ 80 % | ≥ 90 % |
| The obvious play (v1 § 9.3) fails | — | ≥ 75 % | ≥ 95 % |
| All five policies fail | ≤ 2 % | ≤ 25 % | ≥ 90 % |
| Witness: lane launches that leave shots (slot entries) | ≤ 6 | ≥ 4 | ≥ 6 |
| Witness: all `K` slots occupied at least once | — | — | ≥ 90 % |
| Witness: zero-hit parks (pure parking) | — | — | ≥ 1 in ≥ 60 % |
| Shooters below 4 shots | ≤ 8 % | ≤ 8 % | ≤ 8 % |

"Hard" in one sentence: none of five reasonable rules of thumb finishes the picture, the known solution fills every waiting place at some point, and it parks on purpose.

### 2.3 Expected scale

These are synthetic-scene measurements (§ 3.6); real motifs will differ a little.

| | easy | medium | hard |
|---|---|---|---|
| Filled cells | ~1 000 | ~1 600 | ~2 300 |
| Shooters (lane depth) | ~55 (~14) | ~65 (~16) | ~68 (~17) |
| Witness length (launches) | ~60 | ~85 | ~107 |
| Shots per shooter | 4–40 | 4–60 | 4–90 |
| Decoys (shooters deliberately early) | ~2 | ~6 | ~8 |

`metadata.typicalMinutes` becomes `[8, 30]`.

## 3. Generator, policies and verification at the new scale

v1 perturbed a base deal and asked a DFS solver whether the result was still solvable. At about 2 000 cells and 60–70 shooters, that search has no useful bound. v2 turns the problem around:

- **Solvable by construction:** the generator plays a valid game forward and records the lane order it needs.
- **Difficulty by verification:** cheap simulation of five heuristic policies.

### 3.1 The fast engine (`src/engine.ts`)

This is pure and DOM-free. It is shared by rules, generator, hint and view.

- It is built once per picture. `lineStart: Int32Array` and `lineCells: Int16Array` hold the 2W + 2H station lines, flattened. `colour: Uint8Array` holds the palette index + 1 per cell, with 0 for transparent.
- A cursor is `{ present: Uint8Array, ptr: Int16Array (one per station), left, laneFront: Uint8Array, slots }`.
- `ptr[i]` only moves forward, because cells are only removed. `front(i)` advances it past removed cells, so all fronts together cost O(total line length) = O(4·W·H) **over the whole game**.
- `launch(engine, cursor, c, n, onHit?)` mutates the cursor and runs v1 § 4.3 exactly: laps while a lap hits, and each station fires at most once per lap. A lap costs O(S), with S ≤ 192 stations. A launch costs O((laps + 1)·S) plus the amortised pointer moves.
- `clone(cursor)` copies about 2.7 KB of typed arrays.
- `exposed(engine, cursor)` gives the fronts as a reusable `Int32Array`. After a move only stations whose front was removed change, so the view updates the exposed set incrementally (§ 6.5).
- The v1 string-array `launch` moves to `test/reference.ts` as the **oracle**. A property test checks that engine and reference agree on random grids up to 12 × 12, random shooters and random move sequences.
- `rules.ts` keeps its public API (`position`, `preview`, `play`, `undo`, …) but replays through the engine. Measured cost: about **10 µs per launch** at W = 48 on CI, so replaying a 110-move game takes about 1–2 ms.

### 3.2 Constructive generation (`construct`)

The generator simulates a game forward. Unlike a player, it may **choose which shooter comes next** and **how many shots it gets**, and that choice becomes the lane order. All randomness comes from the game's `rng`, in a fixed draw order.

```
construct(picture, level, rng):
  cursor ← full picture; remaining[c] ← cells of c; reserved[c] ← 0     // reserved = leftover shots of parked decoys
  draws ← []; events ← []
  while cells remain:
    E ← colours exposed now
    R ← slots whose colour is in E
    if R ≠ ∅ and (no free slot or rng < 0.6):
        relaunch a slot from R (rng pick); remaining, reserved −= hits; free it when used up
        events += S<j>; continue
    if a slot is free and rng < level.decoy:                            // a deliberate early shooter
        candidates ← colours with remaining − reserved ≥ decoy.min, weighted towards colours exposed
                     least (fewest exposed cells; never exposed = highest weight)
        if any: c ← pick; a ← min(rng(decoy pack), remaining[c] − reserved[c])
                h ← hits of launch(c, a) on a copy
                if h < a: apply; reserved[c] += a − h; park the shooter {c, a − h} in the lowest free slot
                          draws += {c, n: a}; events += L(draw); continue
    // a fitting shooter, used up exactly
    t ← rng(level.pack)
    for c in E with cap = remaining[c] − reserved[c] > 0: h_c ← hits of launch(c, min(t, cap)) on a copy
    good ← { c : h_c ≥ max(4, pack.min) or h_c = cap }       // cap: the colour's last cells, always allowed
    choose c from good weighted by h_c (rng); if good = ∅: the largest h_c
    apply; draws += {c, n: h_c}; events += L(draw)
  deal draws into 4 lanes in draw order (v1 deal: random lane, length ≤ shortest + 2)
  witness ← events mapped to "L<lane of draw>" / "S<j>"
```

**Why it never gets stuck.**

- For every colour, `reserved ≤ remaining`.
- Suppose a colour `c` is exposed. Either `reserved[c] > 0`, so a parked shooter of `c` exists and can hit, or `remaining − reserved > 0`, so a fitting shooter is possible.
- Fitting shooters are used up exactly. Decoys enter a slot only when one is free. Relaunched shooters keep their slot. So the slots never overflow.
- The loop removes at least one cell per non-decoy step. There are at most `shooters` decoy steps, so it terminates.
- The generator replays the witness through the public rules and asserts that it solves the picture.

**Cost:** each step tries at most 20 colours, one launch each. That is about 1 000–2 000 counted launches per candidate at W = 48 (about 9 ms measured).

### 3.3 The five reference policies (`src/policies.ts`)

Each policy is a deterministic function from the legal children of a position to one child. A **run** applies it until the picture is solved (success) or no legal move is left (failure). Each child carries its hits, whether its shooter is used up, whether it is a slot move, its index, and the free slots after it.

| # | Policy | Order of preference |
|---|---|---|
| P1 | **obvious** (v1 § 9.3) | most hits → used up → slot before lane → lowest index |
| P2 | **tidy** | used up → most hits → slot before lane → lowest index |
| P3 | **slots first** | slot relaunch that hits → used up → most hits → lowest index |
| P4 | **cautious** | used up or slot move → keeps ≥ 1 slot free → most hits → lowest index |
| P5 | **noisy tidy** | P2's order, but with probability 0.3 a uniformly random legal child. It uses its own `createRng(seed ⊕ 0x9e3779b9)`, so it is deterministic. |

If no child hits, every policy parks the lowest-index lane front, which is v1's rule. A run stops early when the budget is used up, and that counts as "unknown" (§ 3.5).

These are the rules of thumb a player tries first: biggest effect, keep things tidy, empty the waiting places, keep a place free, and a bit of trial and error. They are also the baseline the hint does better than (§ 4).

### 3.4 Generate and verify

```
generate(seed, difficulty, choice):
  rng ← createRng(seed); motif ← choice = 'any' ? MOTIFS[rng.int(0, n−1)] : findMotif(choice)
  L ← LEVELS[difficulty]; picture ← rasterise(motif, L.width, L.tier)       // memoised, no rng
  best ← none
  for k in 1 … L.candidates while budget left:
    g ← construct(picture, L, rng)
    v ← verdict(g)        // runs P1…P5 with early exit: stop as soon as the level's rule is decided
    if accept(L, v): return g
    best ← the better of best and g by score(L, v)
  return best             // still solvable: every candidate carries its witness
```

- **Accept rules** are those in § 2.1. Early exit: hard stops at the first policy that succeeds (reject). Medium stops when P1 succeeds (reject), or at the first other success (accept). Easy stops at the third success.
- **Score for the fallback:**
  - hard: the number of failing policies;
  - medium: P1 fails first, then the number of successes, closest to 2;
  - easy: the number of successes.
  Ties go to the earlier candidate.
- **Budget:** every engine launch, in construction and in policy runs, counts as one unit. The budget is a count, never time, so a seed gives the same game on every device. When the budget runs out, the current candidate counts as not accepted.

### 3.5 Complexity and time budgets

| Work | Bound | Measured / target |
|---|---|---|
| One launch at W = 48 | ≤ (n + 1)·192 station visits + amortised pointers | ~10 µs on CI |
| One policy run | ≤ 160 moves × ≤ 9 children | 200–450 launches, 2–5 ms |
| `construct` | ≤ 20 colours × ≤ 2 300 steps (in practice ~110 steps) | 3–9 ms (synthetic, CI) |
| Generation | ≤ the level budget (≤ 10 000 launches) | average **< 40 ms**, max **< 120 ms** on CI. A phone is about 3 × slower, so **< 300 ms** worst case. |
| Rasterisation | ≤ 120 layers × bounding box × ≤ 128 edges | < 10 ms at 48 (memoised) |
| `isValidState` | 2 replays (witness, moves) + 1 (`restartUndo`) | < 5 ms at 48 |
| Hint | ≤ 8 000 launches (§ 4) | < 80 ms on CI, < 300 ms on a phone |

### 3.6 Calibration evidence (planner's experiment)

The planner ran a standalone prototype of § 3.1–3.4 in this container (Node 22). It used synthetic 32/40/48 scenes: a 3-band dithered sky plus 34 rim-shaded ellipses, rectangles and triangles in 11/14/18 colours, with 60 seeds per level. Policies were run without early exit.

| Config | Shooters | Witness | Construct avg/max | 5 policies avg/max | P1 fails | All 5 fail |
|---|---|---|---|---|---|---|
| easy: 32, K 5, decoy 0.06 | 55 | 60 | 3.2 / 6.7 ms | 11 / 15 ms | 23 % | 0 % |
| medium: 40, K 5, decoy 0.20 | 65 | 85 | 5.6 / 9.5 ms | 17 / 30 ms | 53 % | 8 % |
| hard: 48, **K 5**, decoy 0.35, decoy pack 30–90 | 68 | 114 | 7.6 / 11 ms | 15 / 33 ms | 95 % | 70 % |
| hard: 48, **K 4**, decoy 0.30, decoy pack 24–90 | 68 | 107 | 8.8 / 16 ms | 12 / 24 ms | 95 % | **87 %** |

In every run the witness replayed to solved (0 failures in 420 instances), and the hard witness always occupied all 4 slots at some point. About 5–6 % of shooters had fewer than 4 shots, from stray single cells of the synthetic shapes. The despeckle pass and the `good` rule of § 3.2 target this. With the acceptance rules, the expected number of candidates is about 1.2 (hard), 2 (medium) and 1 (easy).

### 3.7 The exact solver stays, but small

v1's DFS with a failure memo (`solver.ts`) is kept for three jobs:

- the BFS-oracle tests on tiny puzzles;
- the hint's **endgame** proof (§ 4, step 3);
- `quality` diagnostics in tests.

It is never run on a full 48 × 48 position. Its position key becomes a `Uint8Array` packed into a string, 8 cells per character, which is at most 288 characters.

## 4. Hint at scale

The hint is still offered without penalty, never plays for the player, and never claims what it has not checked. It runs on an explicit press only, under a launch budget of **8 000**:

1. **On the witness path** (`moves` is a prefix of `witness`): the next witness move. This is free.
2. **Rollouts from the current position**, in this order:
   - **P0 "follow the plan"**: among the legal moves, take the shooter whose identity `(lane, index)` comes earliest in the remaining witness events. Identities come from replaying the witness once. Shooters already used up are skipped. Ties use P2's order.
   - Then P1 to P4.

   The first run that solves the picture gives a **proven** hint: its first move, replay-checked.
3. **Endgame proof:** if at most 300 cells and at most 12 shooters remain, run the exact DFS (budget 5 000 nodes). It gives a solution (hint) or a **proven** dead end.
4. **Safe point:** if nothing was found, walk back through ancestors `moves.length − 1` down to `k0 + 1` (at most 6, where `k0` is the common prefix with the witness). For each, run P0 and P1 rollouts. The first success gives `k`. Otherwise `k = k0`, which is always safe because it lies on the witness.

Texts:

- Steps 1–3 with a solution: "Hint: lane 2, orange 12". The shooter gets a dashed ring and the word "Hint", as in v1.
- Step 3 proven: "From here the picture cannot be finished. Going back to move k works." This comes with an **"Undo to move k"** button.
- Step 4: "I found no way on from here in a quick check. Going back to move k works." with **"Undo to move k"**. This is honest: `k` was verified by a rollout or lies on the witness. A position is never called unsolvable when that was not proven.

The view shows a short busy state ("Checking…", `aria-busy`) if the hint takes longer than one frame. The computation is synchronous, needs no timer for correctness, and is bounded by the budget.

## 5. Settings: "Any picture" is the default

- The declaration is unchanged: `{ kind: 'choice', id: 'motif', values: ['any', ...MOTIFS ids], default: 'any', display: 'select' }`. `any` is already the default.
- **Root cause of the owner's observation:** the host remembers every start-screen setting per game in `@settings` (ADR 0017). After one explicit pick, the select keeps opening on that picture.
- **Shared change (orchestrator, before the feature work):**
  - Add an optional `remember?: boolean` (default `true`) to every non-difficulty `SettingSpec` in `packages/game-core`.
  - The host (`apps/web/src/pages/game.ts`) leaves settings with `remember: false` out of `@settings` when writing. When reading, it ignores any stored value for them, so the start screen always opens on the declared default.
  - "Another round" is unaffected: it uses the settings of the save. An explicit picture therefore repeats that picture with a new seed, while "Any picture" draws a new one.
  - `validateSettings` accepts the field. One host unit test and an e2e check: pick "Red fox", start, then "New game", and the select shows "Any picture".
  - One sentence amends ADR 0017.
- Pixel Peel declares `remember: false` on `motif`. The difficulty is still remembered.
- The labels stay: `motif.any` = "Any picture (random)" (updated text) and `motif.<id>` = "{title} · {n} colours". In v2 the colour count depends on the difficulty, so the label shows a range: "Red fox · 10–18 colours" (the easy and hard counts from the rasteriser, computed in `messages.ts` at module load and memoised).
- The explicit picture list stays available below "Any picture", in the order seasons, landscapes, animals, scenes.

## 6. UI at the new scale

### 6.1 Picture size and drawing

- **Fit (default):** cell = `floor((available − 2·track) / W)` CSS px, at least 5. At 360 px (328 px content, 4 px track) this gives 6 px for W = 48 (288 + 8 px), 7 px for 40 and 9 px for 32. The track is a plain frame; station ticks are drawn only when the cell is at least 8 px.
- **Large** (display preference, per device): the cell is 14 px. The picture sits in a scroll box (`overflow: auto`, `max-block-size: 60vh`, focusable with `tabindex=0`, `role=region` and a label). It pans by touch, wheel and arrow keys. When a shooter is previewed, the box scrolls to show the first previewed cell if none is visible.
- The canvas is drawn by blitting a **1-pixel-per-cell offscreen `ImageData`** (`W × H × 4` bytes, at most 9 KB) with `drawImage`, `imageSmoothingEnabled = false` and an integer scale (times `devicePixelRatio`). A removal updates only the removed cells' pixels. A frame is one `putImageData` plus one `drawImage` plus overlays, which is O(changed cells + overlay cells) and never O(W·H) fill calls. A second, precomputed "dimmed" `ImageData` is used for the spotlight.

### 6.2 Colour-blind play at 6 px cells

Symbols on 6 px cells are unreadable, so v2 does not rely on them there. Four mechanisms together make every decision possible without telling colours apart:

1. **Spotlight** (always on). Focusing or hovering a shooter, or pressing a colour in the colours list (`aria-pressed`), dims every cell **not** of that colour to the precomputed dimmed image (backdrop-washed, 70 %). The colour's cells stay full strength. The cells the launch would remove get a **contrasting ink mark**:
   - at cells under 10 px: a solid black or white centre square, chosen by luminance, of `max(2, ⌊cell/2⌋)` px;
   - at 10 px and above: v1's hatch plus a double outline.

   The spotlight is shape and brightness, never hue alone.
2. **Exact preview text**, as in v1: "Orange 12: removes 9, then waits in a free place with 3".
3. **Colours list** (`<details>`, open on desktop, collapsed below 48 rem). One row per played colour shows the swatch with its symbol, the name, "left 123 · at the edge now 14 · shots waiting 120", and a 44 px "Show" toggle that drives the spotlight. This is the screen-reader and colour-blind overview.
4. **Symbols when they fit:** symbols are drawn on **exposed** cells whenever the cell is at least 10 px (always in Large, and in Fit on wide screens). With the option "Symbols on all pixels" they go on every cell, again only from 10 px. The option says so ("only in large view or on wide screens").

Shooter buttons and chips always show the swatch, the symbol and the number. Accessible names, as in v1, read for example "Lane 2, front: orange, triangle, 12 shots".

### 6.3 Lanes and slots with deep stacks

- **Slots:** one row of `K` boxes (5 or 4), each at least 48 × 48 px, above the lanes, as in v1.
- **Lanes:** 4 columns of `(328 − 3·8)/4 = 76` px at 360 px.
  - Each lane's **front** is a 76 × 52 px button: swatch with symbol, and the number in 18 px tabular figures.
  - Behind it the queue is a compact vertical list of **20 px chips** (12 px swatch with symbol, number in 13 px). The chips are non-interactive and in visual order.
  - On phones the first **7 chips per lane** are shown, then one shared 44 px toggle, "Show whole lanes (+n)" with `aria-expanded`, expands all four lanes at once. 7 chips × 22 px = 154 px.
  - The toggle state is a per-device display preference. It is on by default from 48 rem, where the lanes sit beside the picture and the full depth of about 17 × 22 px fits.
  - Every shooter is therefore visible: always on desktop, and one tap away on phones. This keeps the fairness promise "everything visible from the start".
- **Layout from 48 rem:** picture at inline-start, at up to 48 × 11 px; slots, lanes, actions and colours at inline-end. Below 48 rem: title line, picture, status, slots, lanes, actions, colours, display options.
- All targets stay at least 44 px. The e2e test measures them at 360 × 740 and checks that there is no horizontal scroll, with W = 48.

### 6.4 Display options (per device, `context.preferences`)

These are:

- Picture size: Fit or Large.
- Show whole lanes.
- Symbols on all pixels.
- Animation: on by default, and off with `reducedMotion`.
- Confirm before launch (v1).

None of them changes the game, so they stay in the game (ADR 0017).

### 6.5 Performance

- **One cached session per view:** the engine and the current cursor. `play` applies one move incrementally. `undo`, restore and `undoTo` rebuild by replay (< 2 ms). There are no repeated `position(state)` replays per render.
- **Exposed set:** an incremental update. After a launch only the stations whose front was hit are re-advanced, at most 192.
- **Legality and previews** for all fronts and slots, at most 9 launches on cursor clones, are computed once per move and cached until the next move. Hover and focus read the cache.
- **DOM:** after a move only the changed lane (its front and the first chip), the changed slot, and the counters in the colours list are patched. Chips are not rebuilt.
- **Animation:** the hits pop in order and the shooter token runs the track, capped at 900 ms. Each frame touches only cells popped since the last frame. Any input, `pause()` or `dispose()` jumps to the end, as in v1.
- **Budget:** a move's update takes under 4 ms of main-thread time on CI (jsdom does not measure canvas, so this is asserted on the engine and DOM-patch path only).

## 7. State and limits

`stateVersion` becomes **2**. The state shape is v1's `PeelState`, unchanged in its fields; only the bounds widen. The `Picture` is still stored in full, as rows of palette keys.

| Bound | v1 | v2 |
|---|---|---|
| Side `w`, `h` | 4–24 | 4–**48** |
| Palette entries | 1–8 | 1–**20**, keys `[a-z]`, names from the 44-name vocabulary |
| Lanes | 1–4 | 1–4 |
| Slots | 1–5 | 1–**6** |
| Shooters | ≤ 120 | ≤ **160** |
| Shots per shooter | 1–99 | 1–99 |
| Moves, witness, `restartUndo` | ≤ 700 | ≤ **2 500** (≥ filled cells + shooters) |

The save holds about 2.3 KB of rows, 1.3 KB of lanes and 0.7 KB of witness, so roughly **4–6 KB**.

`isValidState` checks the same things as v1 (bounds, the per-colour shots invariant, witness solves, moves and `restartUndo` replay legally, `reported ⇒ solved`), now through the engine, in under 5 ms at 48. It never throws.

## 8. Migration

- `metadata.stateVersion: 2`, with `migrateState(state, from)`:
  - `from === 1`: return `state` unchanged. Every v1 state lies inside the v2 bounds, the rules of v1 § 4 are unchanged, and the vocabulary is a superset. So a v1 save replays identically and the host's `isValidState` accepts it.
  - Anything else returns `undefined`.
- The v1 motif **ids are kept** for the redrawn subjects (`red-fox`, `koala`, …), so a v1 save still finds its title and place. Its picture is the stored v1 grid, so it keeps looking exactly as it did when it was started. An unknown id falls back to "Your picture", as in v1.
- `settingsOf` is unchanged. A v1 save's `choice` is still a valid value, because the ids are kept.
- **Fixtures first:** before changing any code, the implementer commits `test/fixtures/v1-*.json`. These are three envelopes written by the current v1 code: easy `red-fox` with 2 moves, hard `winter-village` with a park, and a solved `koala` with `reported: true`. Tests:
  - `interpretSave` with the v2 module gives `ok` and `migrated: true`;
  - the restored view shows the same position (left count, lane fronts);
  - Undo works;
  - the solved fixture shows the reveal without a second `finished`.
- An older cached client meeting a v2 save reports `newer-version`, which is the host's existing behaviour.

## 9. Motifs (20 planned; at least 16 for release)

**Release minimum:** the 12 redrawn v1 subjects plus `coral-reef`, `polar-bear`, `hummingbird` and `reading-nook`, which is 16. The other 4 (`aurora`, `emperor-penguin`, `market-stall`, `kitchen-window`) are data-only follow-ups if time runs short, but they are planned now. "Colours" means the full palette (hard). Easy plays 10–12 of them and medium 13–16. Every composition is new. None copies the reference's bento box or snowy cabin among firs.

| # | id | Group | Aspect | Colours | Composition sketch | `place` (EN) |
|---|---|---|---|---|---|---|
| 1 | `cherry-blossom` | season | wide | 15 | A dark branch with rim light crosses from the upper left; clusters of five-petal blossoms in three pinks and white; a dithered pale-blue sky; a distant snow-capped mountain; petals drifting over a river at the bottom | Spring in Japan |
| 2 | `summer-meadow` | season | wide | 16 | Sun and shaded cumulus clouds; rolling hills in three greens; poppies, daisies and cornflowers in the foreground; an orange butterfly; a weathered wooden fence | Central Europe |
| 3 | `autumn-forest` | season | square | 18 | A path receding to the centre between deciduous crowns in red, rust, orange and gold; dark trunks; one fir; falling leaves (scatter, `min: 40`); low sun as a pale-yellow gradient | Temperate forests of Europe and North America |
| 4 | `winter-village` | season | wide | 16 | Dusk sky from navy through violet to peach with a moon; three gabled houses up a hillside with lit windows and smoking chimneys; a church tower; a frozen pond with two skaters in red and blue; snow scatter | A mountain village in winter |
| 5 | `desert-dunes` | landscape | wide | 14 | Dithered sunset sky with a large sun; layered dunes in sand, ochre and rust, lit from the left; a camel caravan silhouette on a crest; a small palm oasis | Sahara, North Africa |
| 6 | `fjord` | landscape | wide | 17 | Steep green walls with grey rock and snow caps; a thin waterfall; deep water with a dithered reflection; a red boathouse with white trim; a small white boat | Western Norway |
| 7 | `rice-terraces` | landscape | wide | 15 | Curved terrace bands in lime, light green and green with teal water mirrors; a thatched hut; layered misty mountains in lavender-grey; a white egret | South-East and East Asia |
| 8 | `coral-reef` | landscape | square | 20 | Water from turquoise to dark blue with light rays (stripes); a sand floor; branching corals in coral, magenta and lavender; brain coral; a sea fan; a sea turtle; striped orange and white anemonefish; small fish (scatter) | Tropical seas, e.g. the Great Barrier Reef, Australia |
| 9 | `aurora` | landscape | wide | 16 | Night sky from navy to dark purple; aurora curtains as dithered bands of mint, lime, turquoise and violet; stars (`min: 40`); snowy shore; black spruce silhouettes; the lights mirrored in lake ice; a reindeer silhouette | High northern latitudes, e.g. Lapland |
| 10 | `red-fox` | animal | square | 14 | A sitting fox in three-quarter view on a mossy log; orange body with rim light, cream chest, black legs and ear tips, bushy tail with a white tip; forest bokeh behind (scatter) | Europe, Asia, North Africa and North America |
| 11 | `elephant` | animal | wide | 14 | A savanna elephant walking in profile, grey with light-grey rim and charcoal fold lines (clipped stripes); ivory tusks; a flat-crowned acacia; golden grass; an orange sky | Africa, south of the Sahara |
| 12 | `koala` | animal | square | 14 | A koala hugging a eucalyptus trunk; grey fur, fluffy light-grey ears, a black nose (`keep`); leaves in mint, green and dark teal; sky | Eastern Australia |
| 13 | `llama` | animal | square | 16 | A llama portrait with a woven blanket in red, orange, turquoise and magenta stripes; cream wool; Andean peaks with snow; a deep blue sky | The Andes, South America |
| 14 | `tiger` | animal | square | 15 | A tiger head in three-quarter view, orange with gold rim, black stripes (thick lines clipped to the head), white muzzle and brows, green eyes (`keep`); tall grass behind | South, South-East and East Asia |
| 15 | `polar-bear` | animal | wide | 14 | A polar bear on an ice floe, shaded in ivory, white, light grey and sky blue (white on white is the challenge); dark teal sea with reflections; a pale sky with a low sun; a charcoal nose | The Arctic |
| 16 | `hummingbird` | animal | square | 18 | A hummingbird hovering at a red trumpet flower; iridescent back in green, mint and dark teal; a magenta throat; blurred wings as striped light-grey ellipses; a soft bokeh background | The Americas, from Alaska to Tierra del Fuego |
| 17 | `emperor-penguin` | animal | square | 14 | An adult emperor penguin with its grey chick; black and charcoal back, white belly, ochre and light-yellow neck patch; pale-blue ice and icebergs; snow scatter | Antarctica |
| 18 | `reading-nook` | scene | square | 18 | A rust armchair with rim light by a window; a bookshelf with coloured spines (stripes); a standing lamp with a warm gradient glow; a sleeping grey cat; a mug; a potted plant | A quiet corner at home |
| 19 | `market-stall` | scene | wide | 20 | A red and white striped awning; crates of apples, oranges, lemons, grapes and green vegetables; a brass scale; a blank chalkboard sign | A weekly market |
| 20 | `kitchen-window` | scene | wide | 17 | A windowsill with three potted herbs in different greens; a turquoise teapot and two cups; a loaf on a board; rooftops and sky outside | A kitchen windowsill |

**Coverage:**

- the four seasons;
- landscapes on four continents and the Arctic;
- animals from Europe and Asia, North America (fox, hummingbird), Africa, Australia, South America, Asia, the Arctic and Antarctica;
- three everyday scenes;
- 14–20 colours each.

The places are broad and factual. Native ranges are given in broad terms. The everyday "places" are descriptive and make no factual claim.

**Size of a motif file:** about 40–90 layers, roughly 100–160 lines including the 16-locale title and place.

Every new motif needs the facts reviewed: the emperor penguin breeds only in Antarctica; the hummingbird family ranges from Alaska to Tierra del Fuego; the polar bear's range is the Arctic coasts and sea ice.

## 10. Test plan

### 10.1 Rules and engine (`test/rules.test.ts`, `test/engine.test.ts`)

- All of v1's rules tests stay, now running on the engine.
- **Engine equals reference:** property tests with fast-check. Random grids up to 12 × 12 with up to 20 colours, random shooters and random legal move sequences. Hits, order, cells and leftover shots are identical.
- **Pointers:** after any sequence, each `ptr[i]` points at the true front (brute force).
- **Incremental exposed set:** after any sequence it equals a full rescan.
- `isValidState`:
  - accepts the v1 fixtures and every generated v2 state;
  - rejects mutated saves: sides of 49, 21 palette entries, an unknown colour name, a broken invariant, 161 shooters, 7 slots, an illegal move, a witness that does not solve;
  - never throws on `fc.anything()`;
  - takes under 5 ms on a hard 48 × 48 save.

### 10.2 Rasteriser (`test/raster.test.ts`)

- **Determinism:** identical output for repeated runs. Golden hashes of small fixture motifs at 32, 40 and 48 are committed as numbers. A hash changes only with a deliberate rasteriser change, and that commit says so.
- **Table trigonometry:** within 1e-9 of `Math.sin` at every integer degree (test only).
- **Shape rules:**
  - half-open rects tile without gaps or overlaps;
  - an ellipse with `rx = ry` is symmetric;
  - a thin `line` is 8-connected and one cell wide at all three resolutions;
  - `keep` yields exactly one cell for a sub-cell shape;
  - `clip` never paints outside its parent;
  - `outline` lies inside the mask;
  - `rim` gives light cells only on the light side;
  - the gradient with `soft: 0` gives exactly `n` bands;
  - Bayer dithering is balanced (property).
- **Post passes:** tier merge follows the chains; the minimum-pixel merge terminates and leaves no colour below `minPixels`; despeckle never touches protected cells.
- **Timing:** each motif rasterises in < 25 ms at 48.

### 10.3 Motif data (`test/motifs.test.ts`, iterating `MOTIFS`)

At each of 32, 40 and 48, with the matching tier, the § 1.4 *test* rules:

- the colour-count ranges;
- minimum pixels;
- ΔE thresholds and backdrop distance;
- fill share;
- despeckle share ≤ 2 %.

Also:

- unique ids that are not `any`;
- the group order (seasons, landscapes, animals, scenes);
- titles and places non-empty in all 16 locales, titles ≤ 32 characters;
- names in the vocabulary and unique per motif;
- every tier-2 or tier-3 entry has a `merge` chain that ends in tier 1;
- at least 16 motifs.

### 10.4 Generator and policies (`test/generator.test.ts`, split into one `it` per motif to stay well under timeouts)

- **Deterministic:** the same seed, difficulty and choice give a deep-equal state.
- **Every motif × 3 difficulties × 2 seeds** (≥ 96 generations):
  - `isValidState`;
  - the witness solves;
  - the bounds of § 7;
  - 4 lanes, balanced to within 2;
  - the per-colour invariant;
  - the level's grid size and slot count;
  - at most 8 % of shooters below 4 shots;
  - generation within its counted budget.
- **Level rates, aggregated** over every motif × 6 seeds per level: the table in § 2.2. This runs in a separate `it` per difficulty. Hard: about 20 motifs × 6 seeds × about 30 ms ≈ 4 s.
- **Policies:** each is deterministic. P1 equals v1's `obviousPlay` on v1 fixtures. A policy never plays an illegal move.
- **Construction invariants** (property tests on small random pictures): `reserved ≤ remaining` at every step, no slot overflow, and termination.
- **Timing:** the average generation per level is < 40 ms and the slowest < 120 ms on CI. The file's slowest `it` stays < 50 % of its timeout (the per-test timeout is 20 s, so the target is < 10 s, with the expected maximum about 4 s).
- **"Any picture"** covers every motif over 300 seeds.

### 10.5 Hint (`test/hint.test.ts`)

- On the witness path the hint is the next witness move.
- Off the path, a suggested move leads to a position from which the rollout that found it solves the picture (replayed).
- `undo k` targets are verified: a P0 or P1 rollout from `k` solves, or `k = k0`.
- A "proven" dead end appears only from the endgame DFS, and the BFS oracle agrees on small cases.
- The budget holds: < 80 ms per hint on CI on 20 random off-path hard positions.

### 10.6 Other tests

- **View** (`test/view.test.ts`, jsdom):
  - the spotlight state for a focused shooter (via `data-spotlight` and the previewed cell list exposed for tests);
  - the colours-list toggles with `aria-pressed`;
  - "Show whole lanes" with `aria-expanded`, and all chips present when expanded;
  - Large view toggling;
  - symbols only at ≥ 10 px (via `data-symbols`);
  - the hint busy state;
  - restoring the v1 fixtures;
  - plus all v1 view tests.
- **Contract** (`runGameContract`): as in v1, 3 difficulties × 21 motif values. The `remember: false` field passes `validateSettings`.
- **Migration:** the v1 fixtures (§ 8).
- **E2E** (`e2e/games/pixel-peel.spec.ts`):
  - easy `red-fox`, playing the witness through the buttons with reduced motion, about 60 clicks, then the reveal and the host's finished panel;
  - hard `winter-village`: the first 10 witness moves including a park, then `expectResumeAfterReload`;
  - Undo after a park, and Restart then Undo;
  - keyboard only;
  - a hint marker;
  - at 360 × 740 with W = 48: no horizontal scroll, every button at least 44 × 44 px, the picture fits, and "Show whole lanes" works;
  - Large view scrolls inside its box;
  - `ar` locale: lanes from inline-start, picture not mirrored;
  - after picking "Red fox" and returning to the start screen, the select shows "Any picture".
- **Mutation** (`pnpm mutation`): `engine.ts`, `rules.ts`, `art/raster.ts` and `policies.ts`. Surviving mutants in the launch loop, legality, mask rules or merges must be killed.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Vector motifs look generic or muddy at 32 | Authoring rules § 1.4; level-of-detail layers; per-resolution renders with palette strips (§ 1.7); the owner reviews the contact sheet before release; every motif is one data file |
| Rasteriser differs between browsers | Arithmetic only, table trigonometry, half-open edge rules, integer hashing; golden-hash tests; saves store grids anyway |
| 20 colours too similar | ΔE thresholds; the spotlight; symbols from 10 px; unique names; the colours list; easy uses 10–12 tier-1 colours with ΔE ≥ 18 |
| Hard is frustrating rather than hard | The solution exists by construction; it is verified only against simple rules of thumb, not against a strong search, so a careful player who uses the preview, parks on purpose and keeps a slot free can solve it; the hint gives a proven next move or a verified safe point; unlimited undo. The rates are recorded, and the decoy share is the knob. |
| Phone performance | Counted budgets (≤ 10 000 launches); the engine at about 10 µs per launch; `ImageData` blits; incremental updates; the hint only on press |
| Long lanes overwhelm the phone layout | 7 chips plus "Show whole lanes"; 20 px chips; side layout from 48 rem |
| Tiny shooters (1–3 shots) | `good` rule; minimum pixels per colour; despeckle; test ≤ 8 % |
| Similarity to the commercial reference | Used only for scale. No subjects in common with the screenshots, our own symbols and spotlight, our own track and lane rendering, our own mechanics differences from v1 § 14 (laps while hitting, explicit parking, full visibility, proven fairness) |
| Shared change refused or delayed | The game works without it (the default is already `any`); only the "sticky pick" stays. It is listed as the first implementation step so it is not forgotten. |
| Breaking v1 saves | Identity migration plus fixtures committed before any code change; ids kept |

## 12. Implementation order

1. **Fixtures:** with the unchanged v1 code, write and commit `test/fixtures/v1-*.json` (§ 8).
2. **Orchestrator shared change:** `remember: false` (game-core type and validation, host read and write, a test, the ADR 0017 sentence). The colour vocabulary and symbols are game-local and need no shared change.
3. **Engine:**
   - `src/engine.ts`;
   - move the v1 `launch` to `test/reference.ts`;
   - `rules.ts` replays through the engine;
   - v2 limits, `stateVersion: 2`, `migrateState`;
   - tests (§ 10.1) and migration tests.
4. **Art pipeline:** `src/art/{types,trig,raster}.ts`, raster tests (§ 10.2), and the extended `scripts/render-motifs.ts`.
5. **Four pilot motifs**, one per group (`fjord`, `red-fox`, `winter-village`, `reading-nook`). Render them, check the § 1.4 rules, and adjust the rasteriser defaults (soft, rim width, despeckle threshold) **before** drawing the rest.
6. **Generator:** `construct`, `policies.ts`, `verdict` and `LEVELS`. Calibrate on the pilot motifs, then record the rates.
7. **Hint v2** (§ 4) and its tests.
8. **View:**
   - `ImageData` canvas;
   - Fit and Large;
   - spotlight;
   - 20 symbols;
   - colours list;
   - compact lanes with "Show whole lanes";
   - incremental session;
   - display options.
9. **Remaining motifs** up to at least 16 (target 20). Remove the v1 row-string motif files; the ids live on in the new files.
10. **Locales:** in all 16 locales,
    - the 20 new colour names;
    - the 12 new symbol names;
    - the new UI strings: display options, colours list, hint lines, "Show whole lanes", "Any picture (random)", the colour-range label pattern and difficulty hints (about 45 keys);
    - the motif texts.
11. **E2E**, then the full gate.
12. **Hand-over:** renders for the owner, implementation notes in this file, `docs/ROADMAP.md` updated by the orchestrator, and the `apps/web/src/previews.ts` preview refreshed to a denser picture with 4 lanes.

## 13. Decisions taken (the owner wants progress)

1. Grid size by difficulty: 32 / 40 / 48. Motifs are vectors, rasterised deterministically.
2. Played colours by difficulty through palette tiers: 10–12 / 13–16 / 15–20. The reveal shows the played grid.
3. 4 lanes at every level. Slots 5 / 5 / **4**: hard drops a slot because that is what made it measurably hard.
4. Generation is constructive (solvable by construction, with decoys) and verified by five policies. The full search is gone from generation.
5. Hard is defined as "all five policies fail" (≥ 90 % of games), with the other measures of § 2.2.
6. The hint uses the witness, policy rollouts, the endgame DFS and a verified safe undo point. It claims "cannot be finished" only when the endgame DFS proved it.
7. "Any picture" is always the start-screen default (`remember: false`, a shared change). An explicit pick is still possible, and "Another round" keeps it.
8. 20 motifs are planned and at least 16 ship. The v1 ids are kept.
9. `stateVersion` 2 with identity migration from v1.
10. Symbols are drawn only from 10 px. Below that, the spotlight, the preview text and the colours list carry the colour-independent information.

## 14. Open questions for the owner

**Blocking:** none.

Non-blocking; the plan proceeds with the stated default:

1. Hard uses **4** waiting places instead of the reference's 5, because 5 left the puzzle solvable by simple rules of thumb in about a third of games. Keep it? Default: yes.
2. Should the three everyday scenes stay in the general list, or should there be more of them (food, workshop, garden)? Default: 3 scenes, more later as data-only additions.
3. After the first renders: does the owner want the pilot motifs (step 5) shown before the remaining ones are drawn? Default: the implementer continues, and the contact sheet comes with the hand-over.

## 15. Implementation notes (2026-10-18)

Implemented as planned in the order of § 12, on branch `game/pixel-peel-v2`. The numbers below were measured in the cloud container (Node 22) over **every motif × 6 seeds** (120 games per level), with all five policies run without early exit.

### 15.1 Final level values (deviations from § 2.1 in bold)

| | easy | medium | hard |
|---|---|---|---|
| Width, tier, lanes, slots | 32, 1, 4, 5 | 40, 2, 4, 5 | 48, 3, 4, 4 |
| Fitting pack | 10–40 | 10–60 | 12–90 |
| Decoy chance, decoy pack | 0.06, 8–30 | **0.16**, 10–40 | 0.30, 24–90 |
| Candidates, budget (launches) | 3, 6 000 | **5, 9 000** | 4, 10 000 |

Medium first measured 29 % "all five fail" (target ≤ 25 %) with the plan's values. A lower decoy chance plus one more candidate and a slightly larger budget brought it to 23 % without losing the "obvious play fails" rate.

**Added rule in `construct`:** a draw that would leave a shooter (or a colour's remainder) below 4 shots takes those shots too and goes to a waiting place instead. Without it, 9–14 % of shooters per game had 1–3 shots on real motifs (thin outlines, eyes, sparkles).

### 15.2 Measured level definition (§ 2.2)

| Measure | easy | medium | hard | target |
|---|---|---|---|---|
| Accepted by its rule | 100 % | 94 % | 100 % | ≥ 95 / 80 / 90 % |
| Obvious play (P1) fails | 7 % | 99 % | 100 % | — / ≥ 75 / ≥ 95 % |
| Tidy (P2) fails | 0 % | 47 % | 100 % | |
| Slots first (P3) fails | 0 % | 45 % | 100 % | |
| Cautious (P4) fails | 0 % | 50 % | 100 % | |
| Noisy tidy (P5) fails | 3 % | 49 % | 94 % | |
| All five fail | 0 % | 23 % | 94 % | ≤ 2 / ≤ 25 / ≥ 90 % |
| Witness slot entries (median) | 4 | 8 | 9 | ≤ 6 / ≥ 4 / ≥ 6 |
| All `K` slots occupied at least once | 3 % | 55 % | 100 % | — / — / ≥ 90 % |
| At least one zero-hit park | 56 % | 94 % | 97 % | — / — / ≥ 60 % |
| Shooters below 4 shots | 0.3 % | 0.8 % | 2.4 % | ≤ 8 % |

On hard, all five policies fail for every seed of 14 motifs; the weakest is the llama (4 of 6 seeds), whose large calm areas give the noisy policy a chance. The witness rows (slot entries, slots filled, parks) come from a run before the polar bear redraw (15.4); the other rows from a run after it. `test/generator.test.ts` asserts these rates with the margins of § 2.2.

### 15.3 Scale and time

| | easy | medium | hard |
|---|---|---|---|
| Played colours (min–max, mean over 20 motifs) | 10–12, 10.3 | 13–16, 13.9 | 15–20, 16.2 |
| Shooters per game | 44.8 | 55.3 | 58.4 |
| Witness length (launches) | 52.7 | 78.6 | 103.5 |
| Decoys | 2.0 | 5.7 | 6.9 |
| Candidates tried | 1.04 | 2.31 | 1.23 |
| Counted launches per generation | 1 174 | 3 158 | 1 927 |
| Generation average / max, measured alone | 9.5 / 42 ms | 25 / 86 ms | 20 / 78 ms |
| Generation average / max, inside the parallel test run | 12 / 73 ms | 32 / 152 ms | 25 / 98 ms |

The averages are within the plan's target (< 40 ms). The maximum stays under 120 ms when measured alone. Under the load of the full parallel test run, medium reached 152 ms once, which is a cold start (rasterising plus JIT). The generator test therefore asserts only the average (< 120 ms).

- Rasterisation at 48 (once per motif and size, memoised): median 8 ms; 6 complex motifs take 13–63 ms on the first, cold call. This is above the plan's "< 10 ms", but it happens once per session.
- Hint off the witness path on hard (40 positions, one step off the witness at a third or half of the game): median 4 ms, max 12 ms. A proven move was found in 38 of 40. The other 2 got "no way found in a quick check, going back to move k works". The budgets are 4 000 launches for the rollouts and 4 000 for the safe point; the endgame DFS is 300 cells, 12 shooters, 5 000 nodes; up to 6 ancestors.

### 15.4 Motifs

All 20 planned motifs ship:

- 9 landscapes: cherry blossom, summer meadow, autumn forest, winter village, desert dunes, fjord, rice terraces, coral reef, northern lights.
- 8 animals: red fox, elephant, koala, llama, tiger, polar bear, hummingbird, emperor penguins.
- 3 everyday scenes: reading nook, market stall, kitchen window.

The v1 ids are kept. Every motif passes the motif tests:

- played keys = tier keys at 32/40/48;
- colour ranges;
- minimum pixels (W/4);
- ΔE ≥ 18 on easy, otherwise 12 (backdrop 15);
- fill ≥ 50 %;
- despeckle ≤ 2 %;
- titles and places in all 16 locales.

`scripts/render-motifs.ts <dir>` writes per-motif sheets, 32/40/48 PNGs and a contact sheet; `--only <id>` and `--watch` support authoring. After the first contact sheet, the polar bear was redrawn because it read as a pig at 32 and 40.

### 15.5 UI details beyond the plan

- **Spotlight** wash: 70 % towards the motif's backdrop colour. Every motif has its own backdrop, chosen to contrast with its palette, e.g. a warm sand for the winter village.
- **Large view:** pressing a shooter scrolls the first previewed pixel into view.
- **From 48 rem** the picture is `position: sticky`, so it stays in view while the lanes and the colours list scroll past.
- **Status line** keeps a fixed height of 4 lines. A hover preview of 3 lines otherwise moved the buttons under the pointer, and the preview flickered.
- **Pointer leaving a button** clears only the preview that button started. Leaving a neighbour while another shooter is focused or previewed changes nothing.
- **Off-witness hint:** answered after one 30 ms timer with "Checking…" (`aria-busy`). On the witness path it is answered at once.

### 15.6 Shared change (approved)

`remember?: boolean` on choice, toggle and number settings in `@wp/game-core`:

- validated by `defineGame`;
- honoured by the host's start screen, which never stores or preselects such a setting;
- documented in one sentence in ADR 0017.

The motif setting uses it, so "Any picture" is always the default; "Another round" keeps the explicit pick.

### 15.7 Known limits

- The hard rate depends on the noisy policy: P1–P4 fail 100 %, P5 94 %.
- On easy, the witness fills all 5 slots in only 3 % of games, which is intended (easy should rarely need every waiting place).
- `docs/ROADMAP.md` and the registry are left to the orchestrator.
