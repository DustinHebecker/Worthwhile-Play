# 0018 — Life engine (`@wp/life-engine`) for Many Lives

Status: Proposed (2026-10-18; the number is provisional until the orchestrator assigns it). Design and owner decisions: [docs/design/many-lives.md](../design/many-lives.md).

## Context
The owner asked for a long life simulation about personal finances (Many Lives): many region profiles, a monthly economy with a stock market, real estate, careers, relationships, health and migration, calibrated on cited data, with simulation tournaments that measure upward mobility and balance. The simulation is large, must be deterministic and testable without a DOM, and is reused by three modes (live a life, understand other lives, plan your own life) and by tournament and calibration tests.

## Decision
- New package `packages/life-engine` (`@wp/life-engine`), pure TypeScript without DOM, depending only on `@wp/game-core`. The game `packages/games/many-lives` depends on it; it never imports games. **Owned by the life-sim workstream** (deviation from ADR 0006's default, like ADR 0009 and 0014); API changes amend this ADR.
- **Monthly tick** (owner question Q1 pending): `step(state, actions, params, rng) → { state, events }`; actions between ticks are validated by `validateAction` (never throws). Fast-forward runs `step` until an event or a player-set stop condition.
- **Parameters are data**: per region profile, typed, each with source, year, region and uncertainty; no parameter without a source entry. Saves hold the profile id and the parameter version, not the parameters.
- **Money in integer cents**; deterministic own approximations of `exp`/`log` (ECMAScript leaves `Math.exp/log/pow` implementation-defined), so a seed reproduces a life across browsers.
- **State** is plain JSON with bounded histories (monthly detail compacted to yearly summaries), PRNG state inside; `isValidState` never throws.
- **Tests**: properties (money conservation, determinism, purity, ETF = market factor), calibration tests against the sourced targets, and seeded tournaments (policies × profiles × households) that measure mobility and the start/decision/luck variance decomposition.
- No dependency on the business tycoon's economy engine; shared finance maths may later move into a shared package proposed to the orchestrator.

## Consequences
+ One deterministic core for all modes, tournaments and calibration; balance and mobility are measured, not guessed.
+ Parameters are auditable and replaceable as data improve.
− A large parameter set must be researched and maintained per profile; calibration tests add CI time (heavy suites in `*.long.test.ts`).
− Own deterministic maths functions need their own accuracy tests.
