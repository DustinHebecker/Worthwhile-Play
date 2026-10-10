# Roadmap and backlog

Source: [implementation brief](spec/implementation-brief.md), section "Development sequence" and "Complete initial game backlog".
**No game is silently removed from this backlog.** Removing or merging an item requires an ADR.

Legend — Priority: **P0** foundation/blocking · **P1** next · **P2** later. Status: ✅ done · 🚧 in progress · ⏳ planned.

## Milestones

| # | Milestone | Priority | Depends on | Status |
|---|---|---|---|---|
| M0 | **Foundation**: monorepo, CI, app shell, localization (16 locales, RTL), GameModule contract, persistence + autosave, seeded RNG, PWA/offline, shared contract tests, Cloudflare deploy, 3 reference games | P0 | – | ✅ |
| M1 | **Learning platform**: deck browser/import (CSV/JSON), Memory variants (word↔image, term↔definition, language pairs), optional spaced repetition *without* streaks/notifications ("Items worth reviewing"), audio (bundled + speech synthesis best effort), content-pack download mechanism with size disclosure | P1 | M0 | 🚧 L1 done: local deck library (`/decks`, import CSV/JSON with preview and row-level errors, export JSON, delete), built-in decks *First words* (60 nouns × 16 languages), *Flags & countries* (CLDR via the browser) and *Capitals* (55 countries; capital names written for the project in all 16 languages, country names from CLDR; South Africa, Indonesia, Tunisia, Ukraine and Mongolia deliberately left out, see `packages/learning-content/src/builtin/capitals.ts`), Memory variants picture↔word, word↔translation, flag↔country, country↔capital, own decks, read aloud (speech synthesis, best effort). L2 done: optional spaced repetition — local learning records (Leitner boxes, whole days; IndexedDB v3 store `learning`), "Items worth reviewing" overview and per-deck counts in the library with an explanation of the schedule, the *Review* flash-card game (`/games/review?deck=<id>`; review / new cards / practice; front→back, back→front, mixed; optional typed answers; idempotent record writes), confirmed "Delete learning records" in Settings; no streaks, goals, reminders or notifications. Memory deliberately writes no learning records (play stays play; *Review* is the intentional learning step). *Capitals* is also reviewable in *Review* (country → capital, capital → country). Next: term↔definition decks, maps/neighbours, audio packs; optional export of learning records |
| M2 | **Puzzle core + logic puzzles**: shared grid/puzzle utilities; *generator → independent solver → uniqueness → difficulty* pipeline; first puzzles | P1 | M0 | 🚧 Nonogram, Lights Out, Skyscrapers, Crate Pusher, Mine Logic, Unblock, Logic Grid, River Crossing, Bridges done; `puzzle-core` extraction pending |
| M3 | **Board games**: Connect Four, Chess (complete rules, local AI; engine license review) | P1 | M0 | ✅ Four in a Row, Chess (own engine, no third-party code) |
| M4 | **Systems & hypothesis games** | P1 | M2 | 🚧 Black Box, Laser Paths, Network Detective, Proof Chain, Robot Program, Circuit, Flow Lab, Rule Hunt, Fix the Machine done |
| M5 | **Memory & attention exercises**, Faces & Names (synthetic/licensed faces only) | P1 | M1 | 🚧 Sequence Memory, Pattern Memory, Signal Watch, Stay on Task, Deep Read, Faces & Names done |
| M6 | **Communication exercises** with deterministic evaluation (ADR 0010) | P2 | M0 | ✅ Ambiguity Detector, Audience Switch, Briefing Game, Compression Challenge |
| M7 | **Strategy engine** (fresh agent context): shared simulation → Tower Defense → turn-based strategy → 4 hybrid modes | P2 | stable M0–M2 | 🚧 |
| M8 | **Adventure engine** → Adventure A (dark fantasy) → Adventure B (temporal) | P2 | M0 | ⏳ |
| M9 | **Optional local AI** (WebLLM, explicit download, deterministic checks first) | P2 | M6 | ⏳ |

Cross-cutting, continuous: accessibility review, native-speaker review of translations (currently AI-assisted), performance budget per game chunk, documentation/ADRs.

## Backlog

| Area | Game / feature | Milestone | Status | Notes |
|---|---|---|---|---|
| Board | Tic-Tac-Toe | M0 | ✅ | reference game; human vs human / computer |
| Logic | Mastermind → shown as **Code Breaker** | M0 | ✅ | reference game (id `mastermind`); renamed because "Mastermind" is a trademark; consistency-check helper |
| Memory | Classic Memory | M0 | ✅ | reference game; first consumer of the deck model |
| Memory | image↔word, word↔image, word↔definition, audio↔word, audio↔translation | M1 | 🚧 | picture↔word, word↔translation (any pair of the 16 languages from Settings → learning languages), flag↔country, country↔capital and own decks (front↔back, also word↔definition) done; read aloud via speech synthesis (best effort); audio↔word with bundled audio pending |
| Learning | Language decks, geography (flag/capital/map/neighbours), AI & business vocabulary, user decks | M1 | 🚧 | done: deck library with CSV/JSON import/export (local only), *First words* (60 nouns, 16 languages), *Flags & countries* (60 countries, CLDR names from the browser), *Capitals* (55 countries × 16 languages), spaced repetition ("Items worth reviewing", *Review* game); pending: maps/neighbours, AI & business vocabulary packs |
| Logic | Sokoban → shown as **Crate Pusher** | M2 | ✅ | 24 original levels, solver-verified optimal push counts |
| Logic | Nonogram | M2 | ✅ | line-solvable + unique (independent oracle in tests) |
| Logic | Bridges / Hashi | M2 | ✅ | generated, solvable by logic (capacity, crossing, isolation); uniqueness via oracle |
| Logic | Slitherlink ("Loop") | M2 | ✅ | unique solution checked by an independent exhaustive solver |
| Logic | Einstein / Constraint Grid → shown as **Logic Grid** | M2 | ✅ | generated, minimal clue sets; uniqueness via brute-force oracle; clue templates in 16 locales |
| Logic | Lights Out | M2 | ✅ | GF(2) solver, minimal-solution hints |
| Logic | River Crossing | M2 | ✅ | data-driven rule engine; 24 original-themed puzzles, optimum verified by independent BFS |
| Logic | Skyscrapers | M2 | ✅ | generator + line solver; uniqueness verified by independent oracle |
| Logic | Deterministic Minesweeper → shown as **Mine Logic** | M2 | ✅ | no-guess generation (solver + brute-force oracle); mistakes are undoable, never punished |
| Board | Connect Four → shown as **Four in a Row** | M3 | ✅ | alpha-beta, 3 levels |
| Board | Chess | M3 | ✅ | own engine (no third-party engine); full rules verified by perft; AI uses strategic evaluation and human-like candidate selection (not only depth + piece-square tables); optional move explanations; puzzle modes "Find the best move" and "Mate in N" (positions verified by own solver, original or CC0-licensed); menu above the board (computer/two players/best move/mate in N, random colour); variation board in all modes; best-move puzzles with lines of 1–3 moves |
| Logic | Minimal Proof → shown as **Proof Chain** | M4 | ✅ | generated rule systems (→, ∧, ∨, simple negation); shortest proof verified by oracle |
| Hypothesis | Rule Discovery → shown as **Rule Hunt** | M4 | ✅ | 2-4-6-style task; confirmation-bias feedback and information value of each test after solving |
| Hypothesis | Black Box | M4 | ✅ | 15 rule families; challenge inputs rule out all consistent alternatives of the family |
| Algorithms | Logic Path → shown as **Robot Program** | M4 | ✅ | small command language (repeat, conditional); 24 original levels, limits proven by exhaustive program search |
| Systems | Systems Puzzle → shown as **Flow Lab** | M4 | ✅ | integer tank/valve simulation with float switches and delays; 24 original puzzles proven solvable by brute force |
| Systems | Debug the System → shown as **Fix the Machine** | M4 | ✅ | generated register machines with one injected bug; unique single-rule fix verified by brute force |
| Systems | Graph Detective → shown as **Network Detective** | M4 | ✅ | 5 task types (bridge, augment, shortest route, single point of failure, min cut); algorithms checked against brute-force oracle |
| Spatial | Circuit Puzzle → shown as **Circuit** | M4 | ✅ | rotate tiles into one spanning-tree circuit; any valid solution accepted (checked against oracle) |
| Spatial | Stack Duel — stacking duel (Tower-Battle-style): players alternately rotate and drop irregular original shapes onto a shared tower; whoever makes it collapse loses (also solo: reach a height with N pieces) | M4 | ✅ | original name/shapes (the commercial "Animal Tower Battle" is only a design reference); needs a deterministic 2D physics step (own engine or license-reviewed MIT engine such as planck.js); save only settled states between turns |
| Spatial | Laser Circuit → shown as **Laser Paths** | M4 | ✅ | 24 original levels, each with exactly one solution (oracle-verified); generic `traceBeams` for later reuse |
| Memory | Faces & Names | M5 | ✅ | `faces-names`: procedurally drawn synthetic faces (no photos or datasets; every feature ≥ 3:1 contrast on all skin tones; spoken descriptions for screen readers); study with optional "what stands out" and own association (never graded); test face→name, name→face, face→job; 4/6/8 people |
| Memory | Sequence Memory | M5 | ✅ | user-paced (Auto/Step), adaptive span, 12-round session |
| Memory | Spatial Memory → shown as **Pattern Memory** | M5 | ✅ | adaptive pattern size, standard and rotated variants |
| Memory | Prospective Memory → shown as **Keep in Mind** | M5 | ✅ | self-paced shape sorting with event-based intentions (★ / subtle dot) and an item-count check-in on hard; no clocks; neutral summary with everyday strategies |
| Memory | Association / Mnemonic → shown as **Vivid Links** | M5 | ✅ | link picture pairs in a vivid imagined scene (optional own notes, kept on the device), untimed counting break on medium/hard, recall by choice; neutral summary explaining imagery/elaboration |
| Memory | N-back | M5 | ✅ | N = 1–3; position, shape or dual stream; self-paced by default (calm 3 s pace opt-in); seeded blocks with controlled match rate and look-alikes; neutral summary with d′ |
| Attention | Signal Watch | M5 | ✅ | 2/4/6-minute sessions, seeded stream, calm factual summary; pauses safely |
| Attention | Deep Read | M5 | ✅ | `deep-read`: 6 original texts (2 per level), questions on main idea, details, structure, contradiction and evidence with explanations and the supporting paragraph; looking back is allowed and only noted; optional one-sentence summary, self-checked (ADR 0010); more texts welcome |
| Attention | Distractor Control → shown as **Stay on Task** | M5 | ✅ | self-paced sorting task with mild, explained distractors; no timers, neutral summary |
| Attention | Visual search | M5 | ✅ | feature → conjunction → similar-distractor search; shape/fill/orientation (never colour-only); self-paced, target-absent boards; neutral summary with median time per set size |
| Language | Letter Logic — word-guessing game (Wordle-style): guess a hidden word in a few tries with per-letter feedback; unlimited free play, no daily-puzzle streak | M6 | ✅ | original name and design ("Wordle" is a trademark); word lists per content language need a license review (prefer CC0/public-domain or self-built lists); feedback by symbol + colour; content language independent of UI language |
| Communication | Audience Switch | M6 | ✅ | `audience-switch`: 6 original scenarios × 3 audiences; tick the facts an audience needs (needed / optional / leave out), choose the opening, pick the fitting message; own version self-checked, never graded (ADR 0010); more scenarios welcome |
| Communication | Compression Challenge | M6 | ✅ | `compression-challenge`: 6 original pieces; tick the core sentences, pick the best 3 bullets and the faithful one-sentence summary, then expand a one-liner (needed details, best version); own sentence with word count, self-checked (ADR 0010) |
| Communication | Briefing Game | M6 | ✅ | `briefing-game`: 8 original situations; sort statement cards into context, facts, uncertainty, risks, decision, next action or leave out (gold sections with reasons), then choose the decision and the next action; own notes self-checked (ADR 0010) |
| Communication | Ambiguity Detector | M6 | ✅ | `ambiguity-detector`: 24 original messages (8 per level), tick the missing dimensions (set comparison with gold answers), pick the reply you would send; optional own question, never graded (ADR 0010); per-dimension summary |
| Strategy | Orbit Links — node conquest (space theme, inspired by "tower battle"-type games): own/enemy/neutral nodes connected by lanes; nodes level 1–30 with 1/2/3 active outgoing paths; units stream along paths (level up own nodes, convert neutral/enemy nodes, head-on fights mid-lane); several opponents without alliances; node types (standard, shipyard for heavy units, defence station with level-based range); real-time but pausable at any moment, deterministic tick simulation | M7 | ✅ | original theme (space or abstract rings/dots); separate from the stacking duel; v2: difficulty = opponent intelligence (beginner/advanced/strong/master, same rules, bot-tournament calibrated), 1–3 opponents as a separate setting, bastion nodes (half damage), confirm before switching map, pinch-zoom/pan, post-game review, introduction map |
| Strategy | Shared strategy/TD engine | M7 | 🚧 | `packages/strategy-engine`: core simulation done (I1); design `docs/design/strategy.md`, API ADR 0009 |
| Strategy | Tower Defense (Gun, Artillery, Laser, Support, Specialist + branches) | M7 | ⏳ | |
| Strategy | Original turn-based strategy (plan→lock→resolve, command network, EW) | M7 | 🚧 | **Relay Command** (`relay-command`): playable (I2); command network with relays and order slots (I3a); doctrines and standing orders (I3b); information model with fog and ghosts (I3c); electronic warfare: jammer, tracer, burn-through (I4); opponent levels easy/normal/hard with one-turn lookahead (I5); legend, unit stat cards, open end, second map Ridge Valley, return on lost contact (UX round); economy, research and maps (I6) next; not a C&C clone |
| Strategy | Hybrid: External Small / External Large / VS Small / VS Large | M7 | ⏳ | |
| Adventure | Adventure engine (scenes, hotspots, inventory, dialogue, flags) | M8 | ⏳ | |
| Adventure | Adventure A — original dark-fantasy exploration | M8 | ⏳ | design reference only |
| Adventure | Adventure B — original temporal sci-fi (pause/slow/fast-forward/rewind/travel) | M8 | ⏳ | design reference only |
| AI | Local AI pack (WebLLM), AI interface, golden eval set | M9 | ⏳ | never required |

## Next steps (suggested agent assignments)

1. **M2 kickoff (orchestrator)**: design `packages/puzzle-core` (grid model, generator/solver interfaces, difficulty metrics) via ADR; then one feature agent per puzzle in parallel.
2. **M1 (learning agent)**: L1 (deck library, import, Memory variants) and L2 ("Items worth reviewing", *Review* game) done; *Capitals* deck done; next: more decks (definitions, maps/neighbours), audio packs, optional export of learning records, Memory → "seen" records (skipped in L2).
3. **M3 (board-games agent)**: Connect Four first (alpha-beta, reuses Tic-Tac-Toe patterns), then chess in its own context.
