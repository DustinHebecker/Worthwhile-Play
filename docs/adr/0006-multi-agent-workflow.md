# 0006 — Orchestrator and feature agents

Status: Accepted (2026-10-03)

## Context
The owner wants implementation by AI agents: one orchestrator, sub-agents for tests and mini games, fresh contexts for large systems, one shared Git repository.

## Decision
- The **orchestrator** owns shared packages (`game-core`, `persistence`, `localization`, `ui`, `learning-content`, `testing`, future engines), root configs, the app shell, the backlog and ADRs, and merges.
- **Feature agents** work only inside `packages/games/<id>/` and `e2e/games/<id>.spec.ts`, add no dependencies, and report needed shared changes instead of making them.
- **Large systems** (strategy engine, adventure engine, temporal adventure, WebLLM) get a fresh context with the spec, ADRs and interfaces only.
- A **QA agent** independently reviews tests (contract, mutation score, e2e) where practical.
- Concurrent work on branches/worktrees; integration only with green CI. Rules are in `CLAUDE.md`.

## Consequences
+ Shared APIs stay coherent; games are parallelizable.
− Shared-API changes are a bottleneck through the orchestrator — intended.
