# 0004 — Cloudflare Workers Static Assets

Status: Accepted (2026-10-03)

## Context
The owner has a Cloudflare account; Home Workout uses Cloudflare Pages. The spec prefers the current Workers Static Assets architecture while keeping the app client-side.

## Decision
Deploy an assets-only Worker (`wrangler.jsonc`, `not_found_handling: single-page-application`) from GitHub Actions after all checks pass. Security and caching headers via `_headers`. No Worker script until an opt-in online feature needs one.

## Consequences
+ Deep links work, global CDN, a backend can be added later without migration.
− Deployment requires `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` repository secrets. PR preview deployments are not configured yet (would need `wrangler versions upload` and legal data in previews).
