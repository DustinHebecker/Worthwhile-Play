# Third-party components

Shipped to users:

| Component | License | Use |
|---|---|---|
| Workbox (via vite-plugin-pwa) | MIT | Service worker / offline caching |
| Unicode emoji (rendered by the user's system font) | — | Symbols in the Memory symbol deck; no artwork is bundled |

Build and test tooling (not distributed): Vite, TypeScript, Vitest, fast-check, Playwright, Stryker, ESLint, Wrangler and their dependencies. `pnpm check:licenses` enforces an allow-list; reviewed exceptions are documented in `scripts/check-licenses.mjs`.

Any new font, image, audio, model, dataset or library requires a license review before inclusion (see CONTRIBUTING.md). Games inspired by existing titles (Command & Conquer, King's Quest VIII, TimeShift) use them as high-level design references only — no names, story, characters, maps, art, sounds or other assets are taken.
