# Worthwhile Play

**Games worth your attention.**

Worthwhile Play is a free, multilingual, installable web app with games and exercises for *productive leisure*: logic, planning, memory, attention, communication and strategy. It is meant as a calm alternative to doom scrolling — not as an engagement machine.

- **No** ads, tracking, accounts, streaks, daily rewards, loot boxes, energy systems or endless feeds.
- **Every game can be closed at any moment and continued later** — progress is saved continuously on your device.
- **Works offline** once loaded and can be installed as an app (PWA).
- **16 interface languages** (de, en, nl, es, fr, ru, zh-Hans, ko, ja, ar, pt, it, pl, tr, uk, hi), with Arabic right-to-left.
- **Honest claims**: the games exercise specific skills. They are not proven to make you smarter in general, and we don't say so.

> Status: early development. The foundation (architecture, persistence, localization, PWA, CI) and three reference games (Tic-Tac-Toe, Code Breaker — a Mastermind-style deduction game, Memory) exist. The full backlog — puzzles, learning decks, Faces & Names, chess, communication exercises, an original turn-based strategy/tower-defense engine and two point-and-click adventures — is planned in [docs/ROADMAP.md](docs/ROADMAP.md).

## Play

Open the deployed site, pick a game, or install it via your browser's *Install app* / *Add to Home Screen*. Each game has a direct URL such as `/games/memory`. Adding `?seed=123&difficulty=…` reproduces exactly the same game (useful for bug reports).

## Develop

Requirements: Node.js ≥ 22, pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit + property tests (Vitest, fast-check)
pnpm e2e          # Playwright (builds are served via `vite preview`; run `pnpm build` first)
pnpm mutation     # Stryker on core logic and game rules
pnpm check        # licenses, lint, typecheck, tests, build
```

### Repository layout

```text
apps/web/                  App shell: catalogue, game host, settings, legal notice, PWA
packages/game-core/        GameModule contract, seeded PRNG, guards
packages/persistence/      Versioned saves (IndexedDB), migration, autosave
packages/localization/     16 UI locales, translator, UI vs. content language preferences
packages/learning-content/ Generic deck model (text/image/audio, CSV/JSON import)
packages/ui/               Dependency-free DOM helpers and design tokens
packages/testing/          Shared contract test suite every game must pass, e2e helpers
packages/games/<id>/       One package per game (rules, view, messages, tests)
e2e/                       Playwright tests (shell, offline, per-game resume contract)
docs/                      Spec, roadmap, architecture, ADRs, deployment
```

Read [docs/architecture.md](docs/architecture.md) before adding a game, and [CONTRIBUTING.md](CONTRIBUTING.md) for the rules (no `Math.random()`, games never import each other, every game passes the shared contract including save/restore in all 16 locales).

## Privacy

Core games run entirely in your browser. Saves and settings stay in your browser's local storage (IndexedDB/localStorage). There is no analytics or tracking. Optional future features that need the network or downloads (e.g. a local AI model) will always be opt-in and show their size first.

## Browser support

Current versions of Chrome/Edge, Firefox and Safari (desktop and mobile). Offline mode requires service-worker support. Games that will use WebGPU (optional local AI) will state that requirement.

## Deployment

Cloudflare Workers with Static Assets, deployed by GitHub Actions on every push to `main`. The legal notice (Impressum) data is injected at build time from secrets and is never committed. See [docs/deployment.md](docs/deployment.md).

## Documentation

- [Product specification](docs/spec/implementation-brief.md) (binding) and [reference conversation](docs/product/reference-conversation.md) (rationale, game descriptions)
- [Roadmap & backlog](docs/ROADMAP.md)
- [Architecture](docs/architecture.md) and [decision records](docs/adr/)
- [Deck format](docs/content/deck-format.md)
- [Multi-agent workflow](CLAUDE.md)

## License

Source available under the [PolyForm Perimeter License 1.0.0](LICENSE) — not "open source" in the OSI sense. Copyright © 2026 Dr. Dustin Hebecker; see [COPYRIGHT_NOTICE.md](COPYRIGHT_NOTICE.md). Third-party components: [docs/third-party.md](docs/third-party.md).
