# Worthwhile Play — rules for AI agents

Read first: `docs/spec/implementation-brief.md` (binding spec), `docs/architecture.md`, `docs/ROADMAP.md`, `docs/adr/`.
The product reference conversation (`docs/product/reference-conversation.md`) explains the intent behind each game.

## Product rules (never violate)

- No ads, tracking, streaks, daily rewards, loot boxes, energy/lives, artificial waiting, autoplay into the next game, infinite feeds, variable-ratio rewards, default push notifications.
- Every game is closable at any moment and resumable later (contract-tested).
- Honest claims only: "practice", "exercise", "active leisure" — never "improves your brain/IQ".
- C&C, King's Quest VIII, TimeShift are high-level design references only: copy no names, story, characters, maps, art, sound, units or layouts.
- Never commit personal legal data (Impressum). It comes from `WP_LEGAL_*` at build time (ADR 0005).
- Any third-party library, font, image, audio, model or dataset needs a license review (`pnpm check:licenses`, `docs/third-party.md`).

## Roles (ADR 0006)

- **Orchestrator**: owns `packages/{game-core,persistence,localization,ui,learning-content,testing}`, future shared engines, `apps/web`, root configs, CI, backlog, ADRs, merges. Decomposes work, writes the agent briefs, integrates.
- **Feature agent** (one game): may only touch `packages/games/<id>/` and `e2e/games/<id>.spec.ts`; adds no dependencies; reports needed shared changes instead of making them. Registers nothing in the app — the orchestrator adds the registry line in `apps/web/src/registry.ts` and the dependency in `apps/web/package.json`.
- **Large-system agents** (strategy engine, adventure engine, each adventure, local AI): fresh context; get the spec, ADRs and the relevant interfaces only.
- **QA agent**: independent review of tests, mutation reports and e2e coverage.

## How to add a game

1. Orchestrator creates `packages/games/<id>/package.json` (`@wp/game-<id>`, exports `.` and `./metadata`), runs `pnpm install`.
2. Feature agent implements `src/{metadata,messages,rules,ai?,view,index}.ts`, `test/rules.test.ts` (TDD + fast-check), `test/contract.test.ts` (`runGameContract`), `e2e/games/<id>.spec.ts` (`expectResumeAfterReload`).
3. Orchestrator registers it in `apps/web/src/registry.ts`, updates `docs/ROADMAP.md`, runs the full gate.

## Engineering rules

- TypeScript strict; no `Math.random()` (use `createRng(seed)`); games never import other games.
- Game logic in pure `rules.ts`/`ai.ts`; DOM only in `view.ts`. State = plain JSON; `isValidState` never throws.
- Call `requestSave()` after every logical change, `finished()` once on a natural end. Never require timers for correctness.
- All user-visible text via translations in all 16 locales; no colour-only information; keyboard + touch + pointer; 44 px targets; RTL-safe CSS (logical properties).
- Tests are part of the change, not a follow-up. Definition of Done: spec "Definition of Done".

## Commands

```bash
pnpm install
pnpm check            # licenses, lint, typecheck, unit/property/contract tests, build
pnpm vitest run packages/games/<id>
pnpm build && pnpm e2e
pnpm mutation         # Stryker (slow)
```

In cloud containers Playwright's Chromium is preinstalled (`PLAYWRIGHT_BROWSERS_PATH`); do not run `playwright install`.

## Git

Work on a feature branch; one logical change per commit; never commit `.env*`, `dist/`, reports or personal data. Merge only with green CI.

**Always publish finished work** (owner's standing instruction): as soon as a change is complete and the full gate is green, merge it into `main` — every push to `main` deploys to https://worthwhile-play.pages.dev. Do not leave finished work only on a feature branch. Verify the deployment afterwards.
