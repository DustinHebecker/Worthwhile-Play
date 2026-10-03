# Deployment (Cloudflare)

The app is deployed as a **Cloudflare Worker with Static Assets** (`wrangler.jsonc`), by GitHub Actions on every push to `main` after lint, types, unit, property and E2E tests pass (`.github/workflows/ci.yml`, job `deploy`). Without the secrets below, CI skips the deploy step with a notice.

## One-time setup

1. **Cloudflare API token** — Cloudflare dashboard → *My Profile → API Tokens → Create Token* → template **"Edit Cloudflare Workers"**. Restrict it to your account (and zone, if you use a custom domain).
2. **Account ID** — Cloudflare dashboard → *Workers & Pages* → right sidebar "Account ID".
3. **GitHub repository secrets** — GitHub → repository → *Settings → Secrets and variables → Actions → New repository secret*:

   | Secret | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | token from step 1 |
   | `CLOUDFLARE_ACCOUNT_ID` | account ID from step 2 |
   | `WP_LEGAL_NAME` | provider name for the legal notice, same as Home Workout |
   | `WP_LEGAL_ADDRESS` | postal address lines separated by `\|`, e.g. `Street 1\|12345 City\|Germany` — same format as `HW_LEGAL_ADDRESS` in Home Workout |
   | `WP_LEGAL_EMAIL` | optional contact e-mail |

4. Push to `main` (or re-run the CI workflow). The deploy job prints the `*.workers.dev` URL. A custom domain can be attached in the Cloudflare dashboard (*Workers & Pages → worthwhile-play → Settings → Domains & Routes*).

## Legal notice (Impressum) handling

- The repository contains only the page template (`apps/web/src/pages/legal.ts`), never the personal values.
- Values are read from `WP_LEGAL_*` at **build time** (`apps/web/vite.config.ts`) and end up only in `apps/web/dist/` (ignored by Git).
- `scripts/check-release-env.mjs` blocks a release build if name or address is missing; it never prints the values.
- CI test builds run without the values and show an explicit "not included in this development build" notice.
- The page is linked from the footer of every page and reachable at `/legal` and `/impressum`, with a localized label.
- Note: the deployed values are public by nature (they are shown on the website and contained in its JavaScript, including offline copies).

## Manual deploy (local)

```bash
cp .env.example .env.production.local   # fill in WP_LEGAL_*; the file is git-ignored
pnpm exec wrangler login                # or export CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID
pnpm deploy:cloudflare                  # checks legal env → build → wrangler deploy
```

## Why Workers Static Assets (not Pages)?

See [ADR 0004](adr/0004-cloudflare-workers-static-assets.md). In short: Cloudflare's current recommendation for new projects; serves the SPA with deep-link fallback; allows adding a small Worker later (e.g. opt-in online features) without changing hosting.
