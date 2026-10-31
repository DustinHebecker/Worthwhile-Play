# Pixel Peel motifs: authoring guide

Status: **binding for every new motif (2026-10-30)**. It distils the art pipeline of `pixel-peel-v2.md` (§ 1, § 2, § 9, § 15.3–15.5) and the phone layout of `pixel-peel-v3.md` (§ 4, § 12.4) into what an art agent needs. Several agents author motifs in parallel; following § 2 exactly keeps their branches free of merge conflicts.

Who may edit what: an art agent touches only its own motif files, its own batch file and the files the bake generates for them (§ 2). Anything else (`src/art/*`, `src/catalogue.ts`, the tests, the locales, `scripts/*`) is reported to the orchestrator, not changed.

## 1. What a motif is

A motif is a TypeScript file of pure data (`src/motifs/<id>.ts`, type `Motif` from `src/art/types.ts`): an id, a group, an aspect, a title and a place in 16 locales, a palette of 15–20 colours, and a list of layered vector shapes. The rasteriser (`src/art/raster.ts`) turns it into a grid of palette keys at the width of each difficulty, deterministically. The bake stores those grids; a game plays the stored grids and never rasterises.

```ts
import type { Motif } from '../art/types';

/** One sentence on what the picture shows. Original vector art drawn for Worthwhile Play. */
export const mountFuji: Motif = {
  id: 'mount-fuji',                 // [a-z0-9-], ≤ 32 characters, unique, never starting with "any"
  group: 'landmark',                // season | landscape | animal | scene | landmark
  title: { de: '…', en: 'Mount Fuji', /* all 16 locales */ },   // ≤ 32 characters each
  place: { de: '…', en: 'Honshu, Japan', /* all 16 locales */ }, // one factual line, ≤ 120 characters
  aspect: 'square',                 // square | wide | tall | panorama (§ 3)
  // size: [36, 44, 56],            // optional widths for easy, medium, hard (§ 3.2)
  backdrop: '#e4d8f0',              // behind removed cells; ΔE ≥ 15 from every played colour
  palette: { s: ['#5ea7dd', 'skyBlue', 1], l: ['#b9dcf2', 'lightBlue', 2, 's'], /* … */ },
  layers: [ /* painted in order, later layers on top (§ 7) */ ]
};
```

## 2. Adding motifs: files, batch, bake (conflict-free)

Each art batch is one file `src/motifs/batches/<nn>-<name>.ts` (two digits, a dash, a kebab-case name; the orchestrator assigns the name, e.g. `20-landmarks-a`). Batches are found automatically (`import.meta.glob`), so **no shared file is edited** to register a motif. Start-screen order: by group (seasons, landscapes, animals, scenes, landmarks), and within a group by batch file name, then by the order in the batch.

Steps for an art agent:

1. Write `src/motifs/<id>.ts` for each motif (§ 1, § 6, § 7).
2. List them in your batch file (create it once):
   ```ts
   import type { Motif } from '../../art/types';
   import { mountFuji } from '../mount-fuji';
   import { toriiGate } from '../torii-gate';

   /** Landmarks of Japan and … (batch of <agent or topic>). */
   export const BATCH: readonly Motif[] = [mountFuji, toriiGate];
   ```
3. Preview while drawing (§ 5): `node packages/games/pixel-peel/scripts/render-motifs.ts --only mount-fuji` (add `--watch` for an edit–look loop) and look at the PNGs in `packages/games/pixel-peel/renders/`.
4. Bake your batch: `node packages/games/pixel-peel/scripts/render-motifs.ts --batch 20-landmarks-a --bake --sheet`. This writes `src/motifs/baked/<id>.ts` for each motif of the batch (the played grids, palette and backdrop; a chunk of its own) and `src/motifs/cards/20-landmarks-a.ts` (ids, groups, aspects, titles, places). Never edit these by hand; re-bake after every change to a motif.
5. Run `pnpm vitest run packages/games/pixel-peel/test/motifs.test.ts` (fast: every motif's data and authoring rules), then `pnpm vitest run packages/games/pixel-peel` (includes the slow sweeps, § 6.3), `pnpm typecheck` and `pnpm lint`.
6. Commit the motif files, the batch file and the generated files of your batch together. Send the orchestrator the contact sheet (§ 5).

Why this merges cleanly: every file above belongs to one batch. Only a full bake (no `--only`/`--batch`) touches other batches' generated files, and only when their output changed; a full bake also deletes generated files whose motif or batch no longer exists. Agents bake with `--batch`.

Saves: a save stores its whole picture, so a later change of a motif never changes a running game. Never rename or remove an id that has shipped (a save would show "Your picture" instead of the title).

## 3. Sizes and aspects

### 3.1 The size table (`src/art/sizes.ts`)

Widths in cells for easy / medium / hard (height in brackets). "Large" are seasons, landscapes and landmarks, whose big areas need pixels for colour and detail; "other" are animals and scenes.

| Aspect (w : h) | Other: easy / medium / hard | Large: easy / medium / hard | Use for |
|---|---|---|---|
| `square` 1 : 1 | 32 / 40 / 48 | 36 / 44 / 56 | portraits, single objects, compact views |
| `wide` 4 : 3 | 36 (27) / 44 (33) / 56 (42) | 40 (30) / 48 (36) / 64 (48) | most landscapes and scenes |
| `tall` 3 : 4 | 30 (40) / 36 (48) / 42 (56) | 33 (44) / 39 (52) / 45 (60) | towers, gates, waterfalls, standing figures |
| `panorama` 2 : 1 | 48 (24) / 56 (28) / 64 (32) | 48 (24) / 56 (28) / 64 (32) | canyons, bridges, skylines, walls, ranges |

The square and wide sizes are those of v2, so the 20 v2 pictures are unchanged. The canvas is always 100 units wide and as high as the aspect says: 100 (square), 75 (wide), 133⅓ (tall), 50 (panorama). Cell size is `100 / W` units.

Limits and why: width ≤ 64 (a 360 px phone shows 64 cells at 5 px); height ≤ 60 (at 5 px cells a 360 × 640 phone still shows the status, waiting places, lane fronts and actions under the picture, v3 § 4.2; e2e-tested with the tall and panorama pictures); at most 3 136 cells (56 × 56, the largest v2 picture: generation time on phones); width ≥ 24. Rules and saves allow sides up to 64 (unchanged).

Choosing: pick the aspect that fits the subject's silhouette, not the one with most pixels. A tower in `square` wastes half the cells on sky; a bridge in `square` becomes a thin line. Panorama has the fewest cells (2 048 on hard), so it suits subjects that read as a band.

### 3.2 Size override

`size: [easy, medium, hard]` replaces the table for one motif, e.g. a detailed tower that needs more pixels on easy (`[36, 42, 45]` tall instead of 33 / 39 / 45) or a simple animal that reads better with fewer, bigger pixels (`[28, 36, 44]` square). Rules (`sizeProblems`, enforced by the motif tests; an invalid override falls back to the table): three whole widths, strictly increasing, each a multiple of the aspect's first number (4 wide, 3 tall, 2 panorama), within the limits above. The tests also require at least 2 048 cells on hard for large pictures and 1 728 for the others.

## 4. How a game gets its picture (for reference)

- The game chunk holds only the **cards** (`src/motifs/cards/*.ts`: id, group, aspect, title, place). Each motif's **art** (`src/motifs/baked/<id>.ts`) is a chunk of its own.
- The start screen lists "Any picture", then one group per kind of picture (`<optgroup>`), each starting with "Any <kind>" (`any-<group>`, drawn from the seed) and listing its pictures.
- Before a new game the host awaits `prepare(options)` (ADR 0011 amendment), which loads the art of the picture the seed draws; `newGame` then generates synchronously. Restoring a save loads no art. Offline every art chunk is precached by the service worker.
- Neither the vector motifs nor the rasteriser are in the game bundle (`test/catalogue.test.ts` checks the import graph).

Sizes, measured with `pnpm build` (gzip -9):

| | Game chunk | Art per picture |
|---|---|---|
| Before (20 motifs, everything in the game chunk) | 389 kB raw / 126 kB gzip | — |
| After (22 motifs) | 241 kB raw / 77 kB gzip | 1.1–2.3 kB gzip, one per new game |
| Projected for 95 motifs | about 110 kB gzip (cards ≈ 0.47 kB gzip each) | same |

Without the split, 95 motifs would have made the game chunk about 330 kB gzip.

## 5. Preview, contact sheet, bake

```
node packages/games/pixel-peel/scripts/render-motifs.ts [out-dir] [--only <id>[,<id>…]] [--batch <name>] [--sheet] [--bake] [--watch]
```

- Output: `packages/games/pixel-peel/renders/` (git-ignored) unless `out-dir` is given.
- Per motif: `<id>.png` (the three difficulties side by side with the palette strip: swatch, symbol, name, cell count, counts under the minimum in red), `<id>-<difficulty>-<w>.png` (about 512 px) and `<id>-layers.png` (the hard render once per layer with that layer's mask highlighted, for debugging).
- `contact-sheet.png`: every selected motif at easy, medium and hard, each fitted into a 256 px box, two motifs per row, labelled with id, group, aspect, sizes and played colours. **Review command for the orchestrator:** `node packages/games/pixel-peel/scripts/render-motifs.ts --only mount-fuji,torii-gate,… --sheet` (or `--batch <name> --sheet`); about 0.3 s per motif.
- The console lists per difficulty: played colours, effective colours, colours with ≥ 2 %, the largest share, fill, despeckle share and time, and warns (`!`) about every authoring rule of § 6 that fails. Fix all warnings before baking.
- `--bake` writes the generated files (§ 2). `--sheet` skips the per-motif PNGs.

Node runs the script directly (type stripping, Node ≥ 22.18); `scripts/hooks.ts` resolves the game's own imports and its `import.meta.glob`.

## 6. Quality bar and the tests that enforce it

### 6.1 Owner feedback, distilled

The owner judged the v2 pictures (2026-10-18, v2 § 15.3–15.5, § 15.8, § 15.10). What made pictures fail and what fixed them:

1. **Enough colours that matter.** Too few colours and pictures made of three big blobs were the first complaint. Each colour must cover a real share of the picture: break big areas (sky, water, sand, fur, walls) into 3–4 gradient bands, dithered transitions, clouds, reflections, texture (scatter at `min: 40/48`). On hard no colour may exceed 25 % and at least 12 colours need ≥ 2 % each.
2. **Readable subject at easy size.** Draw for the easy width first (32–48 cells); every feature that identifies the subject must survive there. Features smaller than 1.5 cells at easy use `keep: true` (eyes, windows, the tip of a spire) or a 1-cell `line`. Detail goes into layers with `min: 40` / `min: 48`.
3. **Crisp silhouettes, soft shading.** The owner preferred smooth, recognisable shapes (`smooth: 1` polygons, ellipses) to jagged ones, and a clear light direction (one per motif, usually `nw`) with a light and a dark key on every major form. Outlines: one dark key per motif, used sparingly; on animals dark-grey edges or no outline read better than black lines (koala, tiger, elephant were redrawn for this).
4. **High resolution first, then down.** The rasteriser draws every layer at 4× and takes the majority per cell (supersampling), so author at the 100-unit canvas, not at cell level; only outlines, dithering, scatter, keep-cells and 1-cell lines stay cell-exact.
5. **No accidental faces or symbols.** Small dark spots placed in pairs read as eyes (the tiger's muzzle pads did). No text, letters, numbers, logos, flags, signage, or faces on objects.
6. **Distinct palettes.** Each motif has its own palette and light (time of day, season, weather). Avoid giving every landmark the same blue sky, green grass and grey stone: dusk, snow, desert light, fog, night with lit windows, autumn colours all exist. Across a batch, vary aspect, composition and dominant hues.
7. **Composition.** The subject fills the frame with a scene around it (cut-out subjects get a background); at least 50 % of the grid is filled, full-frame is preferred. Keep the subject away from the very edge where the shooters' track runs.

### 6.2 The fast motif tests (`test/motifs.test.ts`, every motif automatically)

At each difficulty with its tier, on the baked picture:

- played keys = the palette keys of the tier (nothing merged away); 10–12 colours easy, 13–16 medium, 15–20 hard; each colour ≥ `W / 4` pixels;
- ΔE (CIE76) ≥ 18 between easy colours, ≥ 12 on medium and hard, ≥ 15 to the backdrop;
- ≥ 50 % filled; effective colours (1 / Σ p²) ≥ 6 on medium and ≥ 8 on hard; on hard ≥ 12 colours with ≥ 2 % and none above 25 %;
- valid ids, palette keys (one letter), colour names from the 44-name vocabulary (`COLOUR_NAMES`, unique per motif), tiers with merge chains ending in tier 1, 15–20 palette entries, more than 5 layers;
- titles (≤ 32) and places (≤ 120) non-empty in all 16 locales; the start-screen label equals the title;
- sizes valid (§ 3.2); baked art matches the motif (backdrop, palette) and the cards match the motifs (run the bake);
- one cards file per batch file, one baked file per motif, nothing stale.

### 6.3 The slow tests (CI's long job; `pnpm test` runs them too)

- `motifs.slow.test.ts`: every motif re-rasterised at every difficulty must equal its baked picture; no colour merged for size, no orphan, despeckle ≤ 2 %. About 0.2 s per motif.
- `generator.slow.test.ts`: every motif × 3 difficulties × 6 seeds is generated and checked (witness solves, bounds, lanes, counted launch budget), and the level definitions of v2 § 2.2 are asserted over all of them. About 0.8 s per motif.
- `timing.slow.test.ts` (wall clock) and the fast `generator.test.ts` use a fixed sample (`test/sample.ts`: the first motif of each group and aspect, and the largest picture), so they do not grow with the motif count.

Measured in this container (4 cores, 22 motifs): slow suites about 1 s of test time per motif plus about 10 s fixed; for 95 motifs about 110 s in total, about 75 s wall time with the files running in parallel (before this change: about 2 s per motif, 200 s for 95). The fast motif test takes about 20 ms per motif.

### 6.4 Palette guidance

- 15–20 entries: 10–12 of tier 1 (easy), 13–16 of tier ≤ 2 (medium), all on hard. Every tier-2/3 entry merges into a similar tier-1 colour (light green → green), so easy shows the same picture with fewer shades.
- Colour names come from the fixed vocabulary in `src/art/types.ts`; a name is used once per motif and must describe the colour (the colour list and screen readers use it). A new name needs translations in all 16 locales: ask the orchestrator.
- Tier-1 colours must be clearly apart (ΔE ≥ 18): pick hue families, not shades of one hue. Shades of one hue belong to tiers 2 and 3.
- The backdrop is a soft colour that is in no picture (lilac, mint, rose …), ΔE ≥ 15 from every played colour.

## 7. Shape language (reference)

Full rules: `pixel-peel-v2.md` § 1.2–1.4 and `src/art/types.ts`. Coordinates are canvas units (x 0–100, y 0–height of § 3.1), y downwards; angles are whole degrees.

| Shape | Form | Notes |
|---|---|---|
| `rect: [x, y, w, h]`, `round?` | half-open rectangle, corners cut by radius `round` | tiles without gaps |
| `ellipse: [cx, cy, rx, ry]`, `rot?` | rotated ellipse | clouds, crowns, bodies |
| `poly: [[x, y], …]`, `smooth?: 1 \| 2` | even–odd polygon, ≤ 32 points, Chaikin smoothing | most silhouettes; `smooth: 1` for organic forms |
| `star: [cx, cy, outer, inner, points]`, `rot?` | star polygon | flowers, sparkles |
| `line: [[x, y], …], width` | thick polyline; `width ≤ 100 / W` gives an exact 1-cell line at every size | cables, masts, branches, railings |
| `all: true` | every cell | with `clip` for textures |

| Fill | Effect |
|---|---|
| `'k'` (a palette key), `'.'` | solid colour; `.` erases to transparent |
| `{ gradient: [keys…], from, to, soft? }` | bands along `from → to`, ordered-dithered transitions (`soft` 0.3–0.7); ≤ 4 keys, large areas only |
| `{ stripes: [keys…], width, angle? }` | stripes, never thinner than a cell |
| `{ scatter: 'k', density, salt }` | sparse protected cells (stars, snow, texture, leaves) |

Layer options: `name` (for `clip`), `clip` (paint only inside a named earlier layer), `shade: { light?, dark?, dir, width?, mode?: 'rim' \| 'band', amount? }`, `outline` (1-cell inner outline key), `keep` (never vanishes: one cell at the anchor), `min: 40 \| 48 …` (drawn only from that width). Motif option: `silhouette` (1-cell outline around everything, for cut-outs).

Patterns that work (see the 22 shipped motifs): sky as a 2–4 key gradient plus clouds with a band shade; water as a gradient with a dithered reflection of what stands above it; forms with `shade: { light, dark, dir: 'nw' }`; repetitive detail (windows, bricks, cables) as `stripes` or 1-cell `line`s clipped to the form; `scatter` at `min: 40` for texture that would be noise at easy. `lighthouse.ts` (tall) and `lavender-fields.ts` (panorama) show the two newer aspects.

## 8. Originality and licensing

- **Original art only**, drawn for this project from general knowledge of the subject: shapes from your own understanding of a landmark's silhouette, proportions and setting.
- **Never** trace or sample photographs, maps or drawings; never copy or adapt existing pixel art, icon sets, emoji, clip art, stock images, or any game's art (including the commercial game the owner used to calibrate scale; v2 § 0). No third-party assets of any kind (CLAUDE.md: anything third-party needs a licence review).
- Landmarks: no logos, signs, text, trademarks or advertising; show the structure, not a branded event or light show. Show sacred and protected places respectfully (e.g. Uluru from a distance, without climbers; no people inside religious sites).
- Facts: the `place` line is one factual, broad line ("Honshu, Japan", "Arizona, United States"); animals give their native range in broad terms; generic scenes ("A rocky coast by the sea") make no factual claim. Double-check names in all 16 locales (official or customary names).
- Product rules apply: no claims about brains or intelligence, nothing frightening, no violence.

## 9. Checklist (per motif)

- [ ] Subject recognisable at easy size; aspect fits the silhouette; size override (if any) within § 3.2.
- [ ] 15–20 palette entries, 10–12 tier 1, names from the vocabulary, merges to similar colours, backdrop clearly apart.
- [ ] One light direction; major forms shaded; detail at `min: 40/48`; small features `keep`.
- [ ] Render shows no `!` warnings; colours that matter (effective ≥ 6 medium / ≥ 8 hard, ≥ 12 colours with 2 % and none > 25 % on hard).
- [ ] No text, logos, flags, accidental faces; original, nothing traced.
- [ ] Title (≤ 32) and place (≤ 120) in all 16 locales, facts checked.
- [ ] In your batch file; baked with `--batch <name> --bake`; motif tests green; contact sheet sent to the orchestrator.
