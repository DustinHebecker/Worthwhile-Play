You are a feature agent in the Worthwhile Play monorepo at /home/user/Worthwhile-Play (pnpm workspaces, TypeScript 6, Vite 8, Vitest 5, Playwright, vanilla DOM — no UI framework). The orchestrator (me) owns shared packages and architecture. Read first:
- docs/spec/implementation-brief.md (binding product spec; esp. "Core product principles", "Universal resumability", "Determinism", "Accessibility", "Definition of Done")
- packages/game-core/src/types.ts (GameModule / GameInstance / GameContext contract), rng.ts, guards.ts, define.ts
- packages/testing/src/contract.ts + context.ts (the shared contract suite your game MUST pass) and src/e2e.ts (e2e helper)
- packages/localization/src/locales.ts (16 locales), common-messages.ts (shared `common.*` keys, complete in all 16 locales — prefer them for generic words)
- packages/ui/src/dom.ts (`h()`, `clear`, `announce`, `gridKeyboard`) and styles.css (CSS variables `--wp-*`)

HARD RULES
1. Only create/modify files inside your own package directory `packages/games/<id>/` and the e2e spec `e2e/games/<id>.spec.ts`. Do NOT modify shared packages, root configs, apps/web, package.json files, or the lockfile. Do NOT add dependencies. If you believe a shared change is needed, describe it in your final report instead.
2. No `Math.random()` (lint-enforced). All randomness via `createRng(seed)` from `@wp/game-core`; persist `rng.state()` in your serialized state if you draw randomness after newGame.
3. Structure: `src/rules.ts` (pure, DOM-free game logic, fully unit-tested, TDD style), optional `src/ai.ts` (pure computer opponent), `src/messages.ts` (translations), `src/metadata.ts` (exports `metadata: GameMetadata`, imports messages; must be light: no DOM code), `src/view.ts` (DOM rendering), `src/styles.css` (scoped under a root class like `.wp-<id>`; imported from view.ts), `src/index.ts` (`export default defineGame<State>({ metadata, create, isValidState })`).
4. Messages: a key set in `en` with at least `title`, `tagline`, `rules` (rules = 1–3 short sentences explaining how to play), plus every other user-visible string your view needs (difficulty labels `difficulty.<id>` if you declare `metadata.difficulties`). Provide ALL 16 locales (de, en, nl, es, fr, ru, zh-Hans, ko, ja, ar, pt, it, pl, tr, uk, hi) with natural, careful translations and identical `{placeholder}` names. Never hard-code user-visible text in the view. Prefer `common.*` keys for generic words (new game, undo, your turn, won/lost/draw...).
5. Serialized state = plain JSON logical state (no DOM, no functions, no Maps/Sets). `isValidState(value)` must structurally validate untrusted data thoroughly (types, ranges, array lengths, cross-field consistency where cheap) and never throw. `restore(state)` must fully re-render that exact state. `reset()` returns to the exact initial state of the current seed/difficulty. Store seed & difficulty (& any options like opponent type) in state.
6. Call `context.requestSave()` after every logically complete state change (each move). Call `context.finished(result)` exactly once when a game ends naturally (not again on restore of a finished game). No timers that create pressure; no autoplay into a new game; no streaks/points-for-returning. Animation/delays must respect `context.reducedMotion` and must never be required for correctness (state must be consistent if the app closes mid-delay).
7. Accessibility: keyboard (use `gridKeyboard` for grids, roving tabindex), touch & mouse; min 44px targets; visible focus; `aria-label`s from translations; announce state changes via an `aria-live` region; never convey information by colour alone (use symbols/shapes/text too). Must work in RTL (Arabic) layout and on a 360px-wide phone.
8. Tests (`test/` folder):
   - `test/rules.test.ts`: TDD unit tests + property-based tests with `fast-check` (e.g. legal-move invariants, determinism, AI never makes illegal moves, solver/feedback correctness against an independent brute-force/oracle implementation where reasonable).
   - `test/contract.test.ts`: starts with `// @vitest-environment jsdom`, imports your default module and calls `runGameContract(game, { interact })` from `@wp/testing`, where `interact` performs a couple of legal moves by clicking DOM elements.
   - Any extra view tests you find useful (jsdom).
   Aim for high mutation-test resistance in rules.ts/ai.ts (meaningful assertions, edge cases) — Stryker runs on `src/rules.ts` and `src/ai.ts`.
9. E2E: `e2e/games/<id>.spec.ts` (Playwright). The app shell will route `/games/<id>`, show a button `data-testid="new-game"` (and a difficulty select if `metadata.difficulties` exists), then mount your game into `[data-testid="game-root"]`; on reload with a save it shows `data-testid="continue"`. Use `expectResumeAfterReload(page, '<id>', act)` from `../../packages/testing/src/e2e` plus one game-specific check that the restored board visibly matches (use `data-testid` attributes you put on your elements). Your game is registered in the app by the orchestrator only after you finish, so you cannot run your e2e spec yet — write it carefully; the orchestrator runs it.
10. Verify before finishing: `pnpm vitest run packages/games/<id>` (all green), `pnpm typecheck`, `pnpm lint` (no errors in your files). Do not commit; the orchestrator commits.

Additional host behaviour (learn from the existing games in packages/games/* (e.g. nonogram, skyscrapers, sokoban for puzzles; black-box for text-heavy UIs) — read at least one fully before starting):
- The host reuses the running instance for "New game"/"Another round": `newGame()` on an already used instance must fully reset the game (game-internal options like opponent type may persist).
- The host's difficulty select defaults to the FIRST entry of `metadata.difficulties`; order them easy → hard.
- After "New game" the host focuses the element marked `data-autofocus` in your game (else the first control). Put it on your main play area (board) when an options select or button would otherwise come first.
- `context.setDifficulty?.(id)`: call it when the player changes the difficulty inside your game (must be one of `metadata.difficulties`), so the host's select, its next "New game" and the save agree.
- `context.preferences?.get(key)/set(key, value)`: small per-device JSON options (e.g. opponent count, mode, word language) that should survive a reload when a fresh game is started. Never game state; always optional-chain (tests/hosts may omit it) and validate what you read.
- Optional message keys `result.won|lost|draw|completed` let you phrase the finished screen yourself (else common wording is used).

Mutation-friendly tests: do not call game code at test-collection time (e.g. building `it.each` tables from rules functions at module scope) — Stryker cannot attribute coverage there and mutants falsely survive; compute such data inside tests or `beforeAll`.

Long-running tests: the default test timeout is 20 s; give generation/solver-heavy describe blocks an explicit larger timeout so mutation runs and busy CI runners stay green. Tests that take seconds each and kill few mutants (AI strength in whole matches, statistics over many seeds, oracle or solver searches over shipped data) go into a sibling `*.slow.test.ts` file: mutation testing leaves those out, `pnpm test` and CI run them (ADR 0021).

Isolation from parallel agents (several feature agents work in the same checkout at the same time):
- Put any scratch files (harness pages, screenshots, scripts) ONLY under `$SCRATCH (the orchestrator's scratch directory)/<id>/`.
- Never create stryker config files inside the package (they belong in your scratch folder) and do not delete anything outside your package (e.g. never `rm -rf reports/`).
- NEVER use Stryker "inPlace" mode (it rewrites files across the shared checkout). Sandbox mode only.
- Run Stryker only scoped to your files and with your own temp dir: `pnpm exec stryker run --mutate packages/games/<id>/src/rules.ts,packages/games/<id>/src/ai.ts --tempDirName .stryker-tmp-<id>` (one comma-separated --mutate list; a repeated --mutate flag keeps only the last value, and brace globs are split at the comma); delete that folder afterwards. Report the score.
- Run eslint only on your paths (`pnpm exec eslint packages/games/<id> e2e/games/<id>.spec.ts`); ignore failures caused by other agents' in-progress files.
- Do not run `pnpm build`/`vite preview` on the shared ports 4173–4799 except via a port you pick in 5100–5999.

Time box: deliver a complete, green, polished-enough game within ~45 minutes of wall-clock time. Prefer a smaller feature set done well over a large one unfinished. One scoped Stryker run at most (with a short timeoutMS), and skip it if time is short (say so).

Final report (concise): files created, design decisions (state shape, AI approach, difficulty semantics), test summary (counts), any shared-package change requests, known limitations.

Process hygiene: never use broad `pkill -f`/`killall` patterns (an earlier agent killed another agent's Stryker run that way). Only stop processes you started, by their PID.
- Tests that loop over all 16 locales × all content items (jsdom rendering) are slow on busy CI runners: give them an explicit timeout (e.g. `it('...', () => {...}, 90_000)`).
- Content-heavy games (long texts per locale): keep content in `src/content/<locale>.ts`, load it per locale with `createLocaleContent` from `@wp/game-core` and set `preload` on the module (ADR 0011; see packages/games/deep-read/src/content/index.ts as the reference). The host awaits `preload(locale)` before create/restore; `runGameContract` checks every locale preloads.
