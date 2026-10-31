# 0021 — Mutation-testing budget: changed lines on PRs, a rotating weekly sample, full runs on demand

Status: Accepted (2026-10-21). Amends the mutation-testing practice of the spec ("Mutation testing") and docs/architecture.md.

## Context
Mutation testing (Stryker, `.github/workflows/mutation.yml`) mutated every changed covered file on pull requests and all ~95 covered files every week in 12 jobs of up to 300 minutes. The weekly run cost about 24 runner-hours and still failed (week of 2026-10-19): three groups died in Stryker's initial test run because heavy simulation tests timed out under instrumentation (node-conquest standoff measurements, a chess oracle check, connect-four level grading), and the groups with card-quest's and chess's `rules.ts` hit the 300-minute limit, because each of their many mutants re-ran expensive AI and simulation tests. The owner decided to cut mutation compute by roughly 85–95 % and to run full mutation tests only occasionally.

## Decision
- **Slow tests stay out of Stryker.** Stryker runs Vitest with `vitest.mutation.config.ts` (the normal config minus `**/*.long.test.ts` and `**/*.slow.test.ts`). AI-strength, statistical, oracle-search and data re-verification tests that take seconds each move to sibling `*.slow.test.ts` files; they kill few mutants that the fast unit and property tests do not. `pnpm test`/`pnpm check` and the CI coverage job still run them (the coverage job stays far below its 20-minute limit; `*.long.test.ts` keep their own job), so the deploy gate still covers them. Packages owned by other workstreams are not edited here; their owners move such tests themselves (the strategy workstream did so for `relay-command` and `strategy-engine/test/regression-generators.slow.test.ts`), so `vitest.mutation.config.ts` excludes no file by name.
- **Pull requests mutate only the changed lines.** `git diff -U0 base...HEAD | node scripts/mutation-targets.mjs --lines --json` turns the added and changed lines of each covered file into Stryker mutation ranges (`file:start-end`; hunks at most 5 lines apart merged, 2 lines of context, pure deletions give no range), one matrix job per file, 90-minute limit. The break threshold (65 %) applies to the mutants on those lines. Draft PRs are skipped; a new push cancels the running check.
- **The weekly schedule is a rotating, report-only sample.** The covered files, sorted; those whose index ≡ ISO week (mod 8) — deterministic, every file once in 8 weeks — in 3 jobs. It runs with `stryker.report.config.mjs` (same settings, no break threshold) and writes per-file scores to the job summary (`scripts/mutation-summary.mjs` reading Stryker's JSON report). Infrastructure errors (a failing initial test run, a job timeout) still fail the run.
- **Full runs only manually**: `workflow_dispatch` with `mode: full` mutates every covered file in 12 groups with the 65 % threshold, as before. `mode: sample` (the default) runs this week's sample.

## Consequences
+ A typical PR mutates tens of mutants instead of whole files; the weekly run is about an eighth of the files, without the slow suites.
+ Scores of unchanged code are still visited every 8 weeks, and on demand.
− A score drop in code no PR touched shows up only in the weekly summary (it does not fail anything) or in a manual full run.
− Mutants that only a slow test would kill now survive in mutation reports; write a fast test for such logic rather than relying on the slow suite.
− Line ranges miss mutants of an expression that starts more than 2 lines above a changed line.
- New slow tests (seconds each, AI strength, statistics, oracle or solver searches over shipped data) go into `*.slow.test.ts` files from the start.

## Amendment (2026-10-24)
The `*.slow.test.ts` suites no longer run in the CI coverage job: under coverage instrumentation the job reached about 14 of its 20 minutes and a slow relay-command generator test hit its 20-second timeout (main at 424239f). They now run with the `*.long.test.ts` suites in the `long` job, without coverage (the chess puzzle data file keeps its own job). `pnpm test`/`pnpm check` still run every test locally, and the deploy still needs the `long` job, so the gate is unchanged; only the coverage report no longer counts lines that only slow suites reach.
