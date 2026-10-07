# Roadmap and backlog

Source: [implementation brief](spec/implementation-brief.md), section "Development sequence" and "Complete initial game backlog".
**No game is silently removed from this backlog.** Removing or merging an item requires an ADR.

Legend — Priority: **P0** foundation/blocking · **P1** next · **P2** later. Status: ✅ done · 🚧 in progress · ⏳ planned.

## Milestones

| # | Milestone | Priority | Depends on | Status |
|---|---|---|---|---|
| M0 | **Foundation**: monorepo, CI, app shell, localization (16 locales, RTL), GameModule contract, persistence + autosave, seeded RNG, PWA/offline, shared contract tests, Cloudflare deploy, 3 reference games | P0 | – | ✅ |
| M1 | **Learning platform**: deck browser/import (CSV/JSON), Memory variants (word↔image, term↔definition, language pairs), optional spaced repetition *without* streaks/notifications ("Items worth reviewing"), audio (bundled + speech synthesis best effort), content-pack download mechanism with size disclosure | P1 | M0 | ⏳ |
| M2 | **Puzzle core + logic puzzles**: shared grid/puzzle utilities; *generator → independent solver → uniqueness → difficulty* pipeline; first puzzles | P1 | M0 | 🚧 Nonogram, Lights Out, Skyscrapers, Crate Pusher, Mine Logic, Unblock, Logic Grid done; `puzzle-core` extraction pending |
| M3 | **Board games**: Connect Four, Chess (complete rules, local AI; engine license review) | P1 | M0 | 🚧 Four in a Row done |
| M4 | **Systems & hypothesis games** | P1 | M2 | 🚧 Black Box, Laser Paths done |
| M5 | **Memory & attention exercises**, Faces & Names (synthetic/licensed faces only) | P1 | M1 | 🚧 Sequence Memory done |
| M6 | **Communication exercises** with deterministic evaluation | P2 | M0 | ⏳ |
| M7 | **Strategy engine** (fresh agent context): shared simulation → Tower Defense → turn-based strategy → 4 hybrid modes | P2 | stable M0–M2 | ⏳ |
| M8 | **Adventure engine** → Adventure A (dark fantasy) → Adventure B (temporal) | P2 | M0 | ⏳ |
| M9 | **Optional local AI** (WebLLM, explicit download, deterministic checks first) | P2 | M6 | ⏳ |

Cross-cutting, continuous: accessibility review, native-speaker review of translations (currently AI-assisted), performance budget per game chunk, documentation/ADRs.

## Backlog

| Area | Game / feature | Milestone | Status | Notes |
|---|---|---|---|---|
| Board | Tic-Tac-Toe | M0 | ✅ | reference game; human vs human / computer |
| Logic | Mastermind → shown as **Code Breaker** | M0 | ✅ | reference game (id `mastermind`); renamed because "Mastermind" is a trademark; consistency-check helper |
| Memory | Classic Memory | M0 | ✅ | reference game; first consumer of the deck model |
| Memory | image↔word, word↔image, word↔definition, audio↔word, audio↔translation | M1 | ⏳ | deck variants, arbitrary language pairs |
| Learning | Language decks, geography (flag/capital/map/neighbours), AI & business vocabulary, user decks | M1 | ⏳ | content packs |
| Logic | Sokoban → shown as **Crate Pusher** | M2 | ✅ | 24 original levels, solver-verified optimal push counts |
| Logic | Nonogram | M2 | ✅ | line-solvable + unique (independent oracle in tests) |
| Logic | Bridges / Hashi | M2 | ⏳ | |
| Logic | Slitherlink | M2 | ⏳ | |
| Logic | Einstein / Constraint Grid → shown as **Logic Grid** | M2 | ✅ | generated, minimal clue sets; uniqueness via brute-force oracle; clue templates in 16 locales |
| Logic | Lights Out | M2 | ✅ | GF(2) solver, minimal-solution hints |
| Logic | River Crossing | M2 | ⏳ | |
| Logic | Rush-Hour-style sliding | M2 | ⏳ | |
| Logic | Skyscrapers | M2 | ✅ | generator + line solver; uniqueness verified by independent oracle |
| Logic | Deterministic Minesweeper → shown as **Mine Logic** | M2 | ✅ | no-guess generation (solver + brute-force oracle); mistakes are undoable, never punished |
| Board | Connect Four → shown as **Four in a Row** | M3 | ✅ | alpha-beta, 3 levels |
| Board | Chess | M3 | ⏳ | full rules incl. repetition/50-move/insufficient material |
| Logic | Minimal Proof | M4 | ⏳ | |
| Hypothesis | Rule Discovery | M4 | ⏳ | value-of-information feedback |
| Hypothesis | Black Box | M4 | ✅ | 15 rule families; challenge inputs rule out all consistent alternatives of the family |
| Algorithms | Logic Path | M4 | ⏳ | |
| Systems | Systems Puzzle | M4 | ⏳ | |
| Systems | Debug the System | M4 | ⏳ | |
| Systems | Graph Detective | M4 | ⏳ | |
| Spatial | Circuit Puzzle | M4 | ⏳ | |
| Spatial | Laser Circuit → shown as **Laser Paths** | M4 | ✅ | 24 original levels, each with exactly one solution (oracle-verified); generic `traceBeams` for later reuse |
| Memory | Faces & Names | M5 | ⏳ | mnemonic, self-generated associations |
| Memory | Sequence Memory | M5 | ✅ | user-paced (Auto/Step), adaptive span, 12-round session |
| Memory | Spatial Memory | M5 | ⏳ | |
| Memory | Prospective Memory | M5 | ⏳ | |
| Memory | Association / Mnemonic exercises | M5 | ⏳ | |
| Memory | N-back (optional) | M5 | ⏳ | |
| Attention | Signal Watch | M5 | ⏳ | explicit session lengths |
| Attention | Deep Read | M5 | ⏳ | |
| Attention | Distractor Control | M5 | ⏳ | must not become irritating |
| Attention | Visual / peripheral search | M5 | ⏳ | |
| Communication | Audience Switch | M6 | ⏳ | |
| Communication | Compression Challenge | M6 | ⏳ | |
| Communication | Briefing Game | M6 | ⏳ | |
| Communication | Ambiguity Detector | M6 | ⏳ | |
| Strategy | Shared strategy/TD engine | M7 | ⏳ | deterministic simulation |
| Strategy | Tower Defense (Gun, Artillery, Laser, Support, Specialist + branches) | M7 | ⏳ | |
| Strategy | Original turn-based strategy (plan→lock→resolve, command network, EW) | M7 | ⏳ | not a C&C clone |
| Strategy | Hybrid: External Small / External Large / VS Small / VS Large | M7 | ⏳ | |
| Adventure | Adventure engine (scenes, hotspots, inventory, dialogue, flags) | M8 | ⏳ | |
| Adventure | Adventure A — original dark-fantasy exploration | M8 | ⏳ | design reference only |
| Adventure | Adventure B — original temporal sci-fi (pause/slow/fast-forward/rewind/travel) | M8 | ⏳ | design reference only |
| AI | Local AI pack (WebLLM), AI interface, golden eval set | M9 | ⏳ | never required |

## Next steps (suggested agent assignments)

1. **M2 kickoff (orchestrator)**: design `packages/puzzle-core` (grid model, generator/solver interfaces, difficulty metrics) via ADR; then one feature agent per puzzle in parallel.
2. **M1 (learning agent)**: deck registry + import UI, Memory variants, spaced repetition (no streaks).
3. **M3 (board-games agent)**: Connect Four first (alpha-beta, reuses Tic-Tac-Toe patterns), then chess in its own context.
