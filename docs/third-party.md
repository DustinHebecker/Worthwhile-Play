# Third-party components

Shipped to users:

| Component | License | Use |
|---|---|---|
| Workbox (via vite-plugin-pwa) | MIT | Service worker / offline caching |
| Unicode emoji (rendered by the user's system font) | — | Symbols in the Memory symbol deck, pictures of the *First words* deck and country flags (regional-indicator sequences); no artwork or font is bundled |
| Country names (Unicode CLDR data, provided by the user's browser via `Intl.DisplayNames`) | — (nothing bundled; CLDR is under the Unicode License v3 in the browser) | *Flags & countries* and *Capitals* decks; names appear in the user's learning or UI language |
| *First words* vocabulary (60 nouns × 16 languages, `packages/learning-content/src/builtin/first-words.ts`) | Project license (authored for Worthwhile Play, no third-party word list) | Memory picture ↔ word and word ↔ translation |
| *Capitals* capital names (55 capitals × 16 languages, `packages/learning-content/src/builtin/capitals.ts`) | Project license (written for Worthwhile Play: the conventional exonym in each language; facts, no third-party list or dataset file copied) | *Capitals* deck (Memory country ↔ capital, *Review*); the country names on the other side come from CLDR via the browser, as for *Flags & countries* |
| Brand image `assets/brand/brain-controller.webp` (brain-shaped game controller) | Provided by the project owner, free to use | Source of the app icons, favicons, header logo and link preview (`scripts/generate-icons.mjs`) |
| DejaVu Sans (only at asset build time, baked into `og-image.png`) | Bitstream Vera / DejaVu license (permissive) | Text of the link preview image; no font file is shipped |

Build and test tooling (not distributed): Vite, TypeScript, Vitest, fast-check, Playwright, Stryker, ESLint, Wrangler and their dependencies. `pnpm check:licenses` enforces an allow-list; reviewed exceptions are documented in `scripts/check-licenses.mjs`.

Decks that users import stay on their device and are never redistributed by the project; the import removes links to remote images/audio so opening a deck never contacts third-party servers.

Any new font, image, audio, model, dataset or library requires a license review before inclusion (see CONTRIBUTING.md). Games inspired by existing titles (Command & Conquer, King's Quest VIII, TimeShift) use them as high-level design references only — no names, story, characters, maps, art, sounds or other assets are taken.
