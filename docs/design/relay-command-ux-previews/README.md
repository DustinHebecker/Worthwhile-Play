# Relay Command: icon set and unit card previews

> Status: the owner chose card **Proposal 2 (meter list)** on 2026-10-14, and it is built in `view.ts` (`renderCard`). The meters are a `<dl>`: pictogram and word, five decorative segments of one fixed width, and the exact value as text. Everything else sits behind "More", including the full effect table: one row per armour class with its pictogram (the map icon of a kind standing for the class) and the exact %, "0 %" as text. There is no match-up block on top: the owner dropped "Strong against", "Weaker against" and "Cannot hurt" on 2026-10-14, because they repeated the effect table. Tested at 360 px left to right and right to left. Earlier status: proposals awaiting the owner's choice (2026-10-12); the rendered PNGs are not committed; open `sheet.html`, `map.html` or `cards.html` in a browser (they load `icons.js` from this folder) to see the sets; the recommendation then was Set A for the map and card Proposal 1.

These are previews only. Nothing in the repository was changed. All artwork is hand-written SVG (no fonts, icon libraries or images), so no licence review is needed. Each file is described below.

| File                                           | What it shows                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `current-map-light.png`                        | The map as it is today, rendered from the real `view.ts` (Field Exercise at the start). Muster Yard and every other kind without a glyph fall back to the same dot.                                                                                                           |
| `setA-sheet-light.png`, `setA-sheet-dark.png`  | Set A, frames with role marks: all 10 units, all 9 structures and the economy marks (deposit fresh or dry, site, unit on a deposit). Each kind is shown for both sides at 1x and 2x. There is a grid of states and a contrast strip on every terrain.                         |
| `setB-sheet-light.png`, `setB-sheet-dark.png`  | Set B, silhouette pictograms on today's tokens. Same layout.                                                                                                                                                                                                                  |
| `setC-sheet-light.png`, `setC-sheet-dark.png`  | Set C, a category shape with a letter code. Same layout.                                                                                                                                                                                                                      |
| `setA-map.png`, `setB-map.png`, `setC-map.png` | A 10x8 crop of Field Exercise in the middle of a game, light and dark side by side, at the real 44 px cell size, rendered at device-pixel-ratio 2. It includes coverage hatching, fog, jammed cells, node rings, order lines, a selection, sites, both sides and every state. |
| `card-compare-360.png`                         | Unit card at phone width, for the Warden (fighter) and the Mast Truck (support). Columns: the current card (real view) next to Proposal 1, Proposal 2 and Proposal 1 in RTL (`dir="rtl"`, Arabic strings from `messages.ts`).                                                 |
| `card-compare-desktop.png`                     | The same comparison in a 420 px desktop side panel, with "More" opened.                                                                                                                                                                                                       |

Sources: `src/icons.js` holds all icon geometry in a 44-unit box (= `CELL`). `src/sheet.html`, `src/map.html` and `src/cards.html` build the pages. `render.mjs` renders them with Playwright. `shot-current.mjs` captures the current UI, which was built from the real source by Vite into `app/dist` inside this scratch folder. `contrast.mjs` checks contrast.

## Problems I found in today's drawing

- `drawGlyph` (view.ts around line 1217) has glyphs for only 8 kinds. `muster`, `motor-pool`, `extractor`, `relay-mast`, `field-post`, `outrider`, `kite` and all four towers fall to `default`, which draws a 3 px dot. Rifle Squad is three dots. That is the "several kinds show a dot" issue.
- Enemy and own structures share the same square and differ only in fill.
- The health bar is always drawn, so it adds clutter on every unit at full health.
- The card repeats the prose selection line. It has 8 to 14 rows of label, bar and words, and its bars are not aligned (the third grid column is `auto`, so every bar has a different length). It shows "1 turns": `card.turns` is `'{n} turns'` with no singular form.

## Rules shared by all three sets (states)

- **Halo.** Every frame first gets a 3.5 px outline in the surface colour, so it stands out from any terrain, hatching or fog.
- **Set up.** The wheels are replaced by outrigger legs on a ground line: the vehicle "stands like a structure". This replaces the grey plate.
- **Last known position (ghost).** The icon is drawn at 60 % opacity with a dashed frame and a "?" badge at the top left.
- **Out of contact.** A crossed-signal badge at the top right.
- **Jammed.** A zigzag badge at the top right. This is new: today jamming is only drawn on the cell.
- **Damaged.** Five countable health pips, shown only when the unit is below full health.
- **Selected.** The focus square, as today.
- **Deposit.** A cut-gem outline in the middle of an empty cell. A run-dry deposit is dashed and struck through. A unit standing on a deposit gets a small diamond in the corner.

**Contrast** (WCAG, computed by `contrast.mjs`):

- **Frame against its halo:** 8.0 (own) and 7.3 (enemy) in light; 7.5 and 7.6 in dark.
- **Own mark (surface colour) on the own fill:** 8.0 in light, 7.5 in dark.
- **Danger badge on surface:** 7.4 in light, 6.5 in dark.
- **Without the halo:** every terrain is at least 3:1. The one exception is the enemy frame on light ridge, at 2.9; ridge is impassable, so only a drone could be there. The halo covers that case.
- **Stroke weights at 1x:** frame 2.5 px, marks 2 px, the same for every kind in every set.

## Proposals

### A: frames with role marks (recommended)

**How it works.**

- **The frame shows category and side.** Own units sit in a plain rectangle; enemy units sit in a frame with pointed ends.
- **Category extras.** Structures are squares on a foundation bar, and enemy structures have cut corners. Towers add battlements, vehicles have two wheels, and the drone has an arched top.
- **The mark inside shows function.** A mark is reused across categories: the flag means command source (Command Post, Field Post), the mast with arcs means relay (Mast Truck, Relay Mast), and the ballistic arc means artillery (Field Gun, Artillery Tower).
- The design is original and only loosely like NATO symbols. It copies nothing from games.

**Pros.**

- All 19 kinds are clearly different at 1x.
- Side is told by outline shape and by fill. This works in greyscale and for colour-blind players, and the enemy is recognisable even as a ghost.
- Category can be read from the frame before the mark.
- It extends easily to TD tower branches (keep the frame, add a mark).
- Thin strokes stay legible in dark mode.

**Cons.**

- It is abstract, so players need to learn about a dozen marks once from the legend. This is eased by reusing marks.
- The enemy frame is wider (3 to 41), so the corner badges sit close to it.

### B: silhouette pictograms on tokens

**How it works.** It keeps today's tokens: own units are a filled circle, enemies an outlined diamond, structures a square, and enemy structures an octagon. The glyphs become small filled silhouettes. Enemy pictograms face left as a second cue that does not rely on colour.

**Pros.** The most immediately recognisable set (a tank looks like a tank). Players have the least to relearn.

**Cons.**

- The four support vehicles share one truck body and differ only by the small attachment on top. Mast Truck, Tracer and Jammer are hard to tell apart at 1x.
- Enemy silhouettes must shrink to 80 % to fit inside the diamond, so they are about 16 px at 1x.
- It has the most path detail and is the most work.
- Silhouettes of military vehicles drift toward the generic RTS look. They are original, but the set is less distinctive.

### C: category shape with letter code

**How it works.** The shape gives the category: circle for infantry, rounded box for vehicles, triangle for air, house for structures, shield for towers. Own icons are solid; enemy icons have a double outline. A letter names the kind.

**Pros.** The cheapest to build, and trivially distinct.

**Cons.**

- The letters would need a short code per locale: 19 codes × 16 locales, including CJK, Arabic and Devanagari.
- Players memorise codes rather than recognise pictures. Some codes are reused (M for Mast Truck and Relay Mast, E for Extractor and EMP Tower).
- It looks like a placeholder.
- The thin inner outline on enemy icons is weak at 1x.

**Recommendation: Set A for the map, with Set B's armour-class silhouettes reused in the unit card.** Both card proposals already use them for the "Hits" and "Strong vs" lists, so the map and the card share one vocabulary. Adopt the shared state rules above whichever set is chosen.

## Unit card

**Proposal 1, icon tiles (recommended).**

- The header has the map icon, the name, a "Yours" chip and a role chip. Status is shown as chips: order, contact and position.
- One health bar with the exact value.
- Four tiles with a big number, a 5-pip meter and a short label:
  - fighters: Attack, Range, Move, Sight;
  - support units: Relay, Armour, Move, Sight.
- A one-row match-up strip shows each armour pictogram with a grade (●●● / ●●○ / ●○○ / —) and the exact %.
- Everything else (armour, fire rate and delivery, radio detail, cost and build time) sits behind a native `<details>` "More".
- Unarmed units get a one-line hint instead of the strip.

**Proposal 2, meter list.** One row per stat (icon, word, 5 segments, exact value), then plain-word lists: "Strong vs", "Weaker vs" and "Can't hit", with pictograms. "More" holds the full effect table. It is denser and very scannable on desktop, but at 328 px it is taller than Proposal 1.

**Accessibility (both proposals).**

- Every number is visible text. Pips and bars are `aria-hidden`.
- The tiles and meters are a `<dl>`. The match-up items carry a visually hidden class name and the %.
- The grade is a glyph count, never colour alone.
- Only logical properties are used, and positions are wrapped in `<bdi>`. The RTL column shows tiles, chips, bars and the "More" arrow mirroring correctly.
- Known RTL nit: "5/turn" needs bidi isolation of the unit (`<bdi>`) in the final build.

## Implementation sketch (for whoever implements this)

### Map icons (Set A)

**Where the code changes:**

- New pure module `packages/games/relay-command/src/icons.ts`, holding:
  - per-kind SVG path strings in the 44 box: a frame per category and side, plus the 19 marks;
  - `drawIcon(g, kind, side, state, colours)`, which uses `new Path2D(d)` (Canvas accepts SVG path data, so the preview's `icons.js` ports almost one-to-one).
- `drawUnit` (view.ts ~1132–1215): replace the circle/diamond/square, plate, health bar, "?" and no-contact code with `drawIcon`. Add the jammed badge; `jammed()` already exists.
- `drawGlyph` (~1217–1281): delete it.
- `unitIcon` (~537) and the legend swatches (~632–773): call the same `drawIcon`, or render the path strings as inline `<svg>`, which is crisper in DOM and has no canvas fallback issue.
- `drawDeposit` (~968): use the new gem mark, plus a corner mini-mark when the cell is occupied.

**Legend and translations:**

- `legend.own`, `legend.enemy`, `legend.structure`, `legend.setUp` and `legend.ghost` change wording.
- New keys: jammed badge, health pips, towers (battlements), wheels/air. That is about 5 new and 5 changed keys × 16 locales.
- `help.shapes` text needs updating.

**Tests:**

- Add a pure test that every archetype in `RULESET` has a mark with no fallback (this prevents the dot regression).
- Add a test that frames differ by side for each category.
- `view.test.ts` (jsdom, no canvas) is unaffected.

**Effort:**

| Option | Estimate                                                     |
| ------ | ------------------------------------------------------------ |
| Set A  | about 1 to 1.5 days including legend, translations and tests |
| Set B  | about 2 days (more path detail, mirroring and scaling)       |
| Set C  | about 1 day plus 19 short codes × 16 locales                 |

### Unit card

**Where the code changes:**

- Rewrite `renderCard` (~572–617). Replace `statRow` with `tile()` / `meter()` helpers and the `.rc-stat*` CSS with `.rc-tiles`, `.rc-match` and `.rc-more`.
- The selection prose (`selectionText`, built from `describeUnit`) duplicates the card visually. Keep `describeUnit` for the unit list and the aria-live cursor, but show only the action hint under the card. The status moves into the chips.

**Data model:** no engine change. Everything comes from the archetype (`hp`, `weapon.vs`, `speed`, `vision`, `comms`, `ew`, `cost`, `buildTurns`) plus roster maxima, which already exist as `MAX`. The match-up grade is derived from the vs table: 0 = can't hit, ≤40 = ●○○, <100 = ●●○, ≥100 = ●●●.

**New message keys:**

- about 12 short labels (attack, range, move, sight, relay, more, hits, strong, weaker, cantHit, packed, setUp);
- optionally one role label per kind (`role.<kind>`, 19 keys). The role label could instead be derived from armour and role, but a hand-written one reads better.

That totals about 31 keys × 16 locales. Fix `card.turns` pluralisation at the same time.

**Effort:** about 1 day including translations and the view tests that reference `rc-card-health`, `rc-card-damage`, `rc-card-noweapon` and `rc-card-cost` (keep those test ids on the new elements).
