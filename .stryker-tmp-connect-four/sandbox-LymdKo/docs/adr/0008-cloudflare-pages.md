# 0008 — Cloudflare Pages instead of Workers Static Assets

Status: Accepted (2026-10-03), supersedes 0004

## Context
The first deployment as a Worker was served at `worthwhile-play.<account-subdomain>.workers.dev`. The account-wide workers.dev subdomain cannot be removed from the URL, only renamed, and renaming would affect every Worker in the account. The owner wants a clean URL without the account part; Home Workout already uses Cloudflare Pages on the same account.

## Decision
Deploy with `wrangler pages deploy` to the Pages project `worthwhile-play` (`wrangler.jsonc` with `pages_build_output_dir`), URL `https://worthwhile-play.pages.dev`. The CI deploy job creates the project on first run. Pages serves `index.html` for unknown paths (no top-level `404.html`), so deep links work; `_headers` is supported unchanged. The earlier Worker was deleted once by CI on 2026-10-03.

## Consequences
+ Clean URL, same setup as Home Workout, preview deployments per branch possible later.
− Server-side logic would use Pages Functions instead of a Worker script; a custom domain remains the way to a fully own URL.
