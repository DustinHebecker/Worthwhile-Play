# 0005 — Legal-notice data injected at build time

Status: Accepted (2026-10-03)

## Context
The public site needs the same Impressum data as Home Workout; the personal data must not be committed to the public repository (not even via a git-ignored file convention that could be bypassed).

## Decision
Template in Git; values from `WP_LEGAL_NAME`, `WP_LEGAL_ADDRESS` (pipe-separated, same format as Home Workout's `HW_LEGAL_ADDRESS`), `WP_LEGAL_EMAIL` provided as GitHub Actions secrets or an untracked `.env.production.local`, injected by Vite `define` into `dist/` only. `scripts/check-release-env.mjs` blocks releases without them and never logs them. Development/CI builds show an explicit "not included" notice. Unlike Home Workout, the provider name is also kept out of the source.

## Consequences
+ No personal address in Git history.
− Values are still public on the deployed site (by legal necessity) and in its cached JavaScript.
