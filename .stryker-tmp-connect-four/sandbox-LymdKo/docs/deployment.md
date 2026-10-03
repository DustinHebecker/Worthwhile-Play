# Deployment (Cloudflare)

The app is deployed to **Cloudflare Pages** (project `worthwhile-play`, `wrangler.jsonc`, URL https://worthwhile-play.pages.dev), by GitHub Actions on every push to `main` after lint, types, unit, property and E2E tests pass (`.github/workflows/ci.yml`, job `deploy`). Without the secrets below, CI skips the deploy step with a notice.

## One-time setup (owner)

1. **Cloudflare API token**: <https://dash.cloudflare.com/profile/api-tokens> → *Create Token* → template **Edit Cloudflare Workers** → *Use template* → under *Account Resources* select the account (same account as Home Workout) → *Continue to summary* → *Create Token* → copy it.
2. **GitHub secret `CLOUDFLARE_API_TOKEN`**: <https://github.com/DustinHebecker/Worthwhile-Play/settings/secrets/actions/new> → paste the token.
3. **GitHub secret `WP_LEGAL`**: same page → value `Name|Street No.|Postal code City|Country` — i.e. the provider name, `|`, then the same value as `HW_LEGAL_ADDRESS` in Home Workout.

`CLOUDFLARE_ACCOUNT_ID` is optional (a token limited to one account is enough for wrangler to find it; the ID is the 32-character hex string in the dashboard URL `dash.cloudflare.com/<account-id>/…`). Instead of `WP_LEGAL`, the separate secrets `WP_LEGAL_NAME`, `WP_LEGAL_ADDRESS` and optional `WP_LEGAL_EMAIL` are also accepted.

Deploys run on every push to `main` and on a manual *Run workflow* of CI on `main`. The deploy job creates the Pages project on its first run and prints the URL.

## Legal notice (Impressum) handling

- The repository contains only the page template (`apps/web/src/pages/legal.ts`), never the personal values.
- Values are read from `WP_LEGAL_*` at **build time** (`apps/web/vite.config.ts`) and end up only in `apps/web/dist/` (ignored by Git).
- `scripts/check-release-env.mjs` blocks a release build if name or address is missing; it never prints the values.
- CI test builds run without the values and show an explicit "not included in this development build" notice.
- The page is linked from the footer of every page and reachable at `/legal` and `/impressum`, with a localized label.
- Note: the deployed values are public by nature (they are shown on the website and contained in its JavaScript, including offline copies).

## Manual deploy (local)

```bash
cp .env.example .env.production.local   # fill in WP_LEGAL; the file is git-ignored
pnpm exec wrangler login                # or export CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID
pnpm deploy:cloudflare                  # checks legal env → build → wrangler pages deploy
```

## Why Pages?

See [ADR 0008](adr/0008-cloudflare-pages.md): clean `*.pages.dev` URL without the account-wide workers.dev subdomain, same setup as Home Workout.
