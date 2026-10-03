# Contributing

Thanks for your interest! Worthwhile Play is a personal, non-commercial project. Bug reports and ideas are welcome as GitHub issues. Please do not post personal or confidential information in issues.

Pull requests are reviewed at the owner's discretion; by submitting one you agree that it may be used under the project's license ([PolyForm Perimeter 1.0.0](LICENSE)).

## Before you open a PR

- Read [docs/architecture.md](docs/architecture.md) and the agent/engineering rules in [CLAUDE.md](CLAUDE.md) (they apply to humans too).
- `pnpm check` and `pnpm build && pnpm e2e` pass locally.
- New games pass the shared contract (`runGameContract`) and include rules tests and an e2e resume test.
- No new dark patterns (see the product rules in CLAUDE.md).

## Third-party code and assets

Every new dependency, font, image, sound, model or dataset needs a license review:
1. Prefer MIT/ISC/BSD/Apache-2.0/CC0 for anything shipped to users.
2. Add it to [docs/third-party.md](docs/third-party.md) with its license and purpose.
3. `pnpm check:licenses` must pass; exceptions for build-only tooling are documented in `scripts/check-licenses.mjs`.

Faces for Faces & Names must be synthetic or explicitly licensed for this use — never scraped photos of real people.

## Translations

UI and game texts exist in 16 languages. Corrections by native speakers are very welcome — edit the locale file and keep `{placeholders}` unchanged.
