# 0016 — Shared playing-card package (`@wp/cards`)

Status: Accepted (2026-10-15).

## Context
Two upcoming games use standard playing cards: Texas Hold'em (52-card French deck) and Skat (32 cards, French or German suits). Each would otherwise need its own card model, shuffle, validators, card art, translations and an accessible hand widget. Games must not import each other (ADR 0006), so shared card code belongs in a shared package. Commercial card designs (e.g. the French "Paris" pattern, German Skat images of specific publishers) must not be copied, and no third-party art or fonts may be bundled.

## Decision
- **Package `packages/cards` (`@wp/cards`)**, owned by the orchestrator, depends only on `@wp/game-core`.
- **Model**: a card is a two-character id string `<rank><suit>` (`"AS"`, `"TD"`, `"7H"`), ranks `2–9 T J Q K A`, suits `C S H D` (Skat order). The suit set (French ♣♠♥♦ or German acorns/leaves/hearts/bells; J/Q = Unter/Ober) is presentation only — rules never depend on it. `deck52()`, `deck32()`, `isCard`/`isCardList` (never throw), `sortCards`/`cardComparator`, `deal`.
- **Shuffle**: Fisher–Yates driven by the seeded `Rng` from `createRng`; `shuffleWithState` returns the generator state for the save. A test pins the order for one seed, so a change of the algorithm is a deliberate, visible decision (it would change existing saves' futures).
- **Rendering**: `cardSvgMarkup` (pure string) / `renderCard` (SVG element). All art is drawn in code, original and abstract: own pip paths, court cards as a framed emblem (crown, coronet, chevrons) instead of figures, a dotted back. Styles `full` and `index` (compact face with the index in both top corners, for overlapped fans in LTR and RTL). Colours are `--wp-pc-*` custom properties (light, dark, forced colours); two-colour and four-colour modes, suit shapes always distinct, so colour is never the only cue. Class prefix `wp-pc` because `.wp-card` is already the panel class of `@wp/ui`.
- **Hand**: `renderHand` renders a group of buttons with a roving tabindex. In a fan each card is covered by the next one (later in the DOM, so on top for painting and hit testing), and the uncovered strip is never narrower than 44 px; if a hand does not fit, it wraps into balanced rows (10 Skat cards at 360 px → 2 × 5).
- **Translations**: `CARD_MESSAGES` (`cards.*`, all 16 locales) holds suit names, per-suit label templates with a `{rank}` placeholder (word order and case per language), rank names and corner letters. Games add them to their catalogue with `withCardMessages(messages)`, so the contract test audits them with the game's own keys.

## Consequences
+ One tested implementation of decks, shuffling, validation, card art and the accessible hand for every card game.
+ States stay small, readable JSON (arrays of card ids).
− Card art is intentionally plain; richer court cards would need a new, original design (no copied patterns).
− Changing the shuffle or the id format affects all card games' saves and needs a migration.
