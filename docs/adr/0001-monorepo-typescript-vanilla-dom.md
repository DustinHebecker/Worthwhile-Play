# 0001 — TypeScript monorepo, pnpm, Vite, framework-free DOM

Status: Accepted (2026-10-03)

## Context
The backlog has ~45 games of very different kinds (grid puzzles, card games, canvas strategy, point-and-click adventures). Each must work standalone and inside the catalogue, be tested in isolation and be developed by independent agents.

## Decision
- pnpm workspaces: `apps/web`, `packages/*`, `packages/games/*`. Packages export TypeScript source directly (`exports: ./src/index.ts`); Vite and Vitest compile them, `tsc --noEmit` type-checks the whole repo with one strict config.
- No UI framework. Games render into a host element with a tiny `h()` helper (`@wp/ui`) or a `<canvas>`. This keeps the game contract framework-agnostic, avoids lock-in and keeps chunks small. If a large game later benefits from a framework, it may use one *internally* behind the same contract (requires license review).
- Lint-enforced rules: no `Math.random()`, games never import other games or the app shell.

## Consequences
+ Very small bundles, no framework upgrades, any rendering technique per game.
− More hand-written DOM code; shared widgets belong in `@wp/ui` to avoid duplication.
