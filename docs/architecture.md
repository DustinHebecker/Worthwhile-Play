# Architecture

## Principles (from the spec)

1. **Every game is closable at any moment and resumable later.** Logical state is serialized after every meaningful change and on `visibilitychange`/`pagehide`.
2. **Determinism.** All randomness comes from a seeded, serializable PRNG. `game + seed + difficulty + actions` reproduces any state.
3. **Modularity.** Games implement one contract, never import each other, and are lazy-loaded chunks with their own direct URL.
4. **Local-first.** No backend is required for play. Saves live in IndexedDB on the device.
5. **UI language ≠ content language.** Interface strings and learning content use separate catalogues and preferences.
6. **No engagement dark patterns** — enforced by review and by the host design (no autoplay, calm "Finished" screen, informational play-time note only).

## Layers

```text
apps/web (shell)  ──uses──►  game-core · persistence · localization · ui · learning-content
     │ lazy import()
     ▼
packages/games/<id>  ──uses──►  game-core · ui · (learning-content | puzzle-core | strategy-engine | adventure-engine …)
```

Future shared engines (`puzzle-core`, `strategy-engine`, `adventure-engine`, `ai`, `audio`) are separate packages owned by the orchestrator.

## The GameModule contract

`packages/game-core/src/types.ts`:

```ts
interface GameModule<S> {
  metadata: GameMetadata;            // id, stateVersion, skills, typicalMinutes, inputMethods, capabilities, messages, difficulties
  create(ctx: GameContext): GameInstance<S>;
  isValidState(value: unknown): value is S;     // validates untrusted saves, never throws
  migrateState?(state: unknown, fromVersion: number): S | undefined;
}
interface GameInstance<S> {
  newGame({ seed, difficulty }): void;
  restore(state: S): void;
  serialize(): S;                    // plain JSON, includes PRNG state if randomness is drawn later
  pause(): void; resume(): void; reset(): void; dispose(): void;
}
interface GameContext {
  root: HTMLElement; t: Translator; reducedMotion: boolean;
  requestSave(): void;               // after each logical change
  finished(result: GameResult): void;// once, on natural end
}
```

The spec's `metadata()`/`initialize()` are expressed as the `metadata` object and `create()`. Every game package has:

```text
src/metadata.ts   light: metadata + messages (bundled with the catalogue)
src/messages.ts   16 locales; keys `title`, `tagline`, `rules`, `difficulty.<id>` …
src/rules.ts      pure logic (DOM-free) — unit, property and mutation tested
src/ai.ts         optional pure opponent logic
src/view.ts       DOM rendering, keyboard/touch/pointer, aria-live announcements
src/index.ts      export default defineGame({...})
test/rules.test.ts, test/contract.test.ts (runGameContract), e2e/games/<id>.spec.ts
```

After "New game" the host moves focus into the game: to the element marked `data-autofocus` (usually the board), otherwise to the first control.

### Shared contract suite

`runGameContract(module, { interact })` (`packages/testing`) checks for every game: valid metadata and complete translations in all 16 locales, determinism per seed, JSON-serializable state accepted by `isValidState`, rejection of arbitrary junk (fuzzed with fast-check), exact restore through the real persistence layer after interaction, pause/resume invariance, `reset()` to the seeded start, no missing translation keys when rendering in each locale, and DOM cleanup on `dispose()`. The e2e helper `expectResumeAfterReload` verifies the same across a real browser reload.

## Persistence

`GameSave { schemaVersion, gameId, stateVersion, updatedAt, seed, difficulty?, state }` in IndexedDB (`worthwhile-play` → `saves`, one active save per game). `interpretSave` validates and migrates untrusted data and returns `empty | ok | corrupt` — a corrupt save is reported and discarded, never crashes the app. If IndexedDB is unavailable, an in-memory store is used and the user is told that progress will not persist.

## Localization

- 16 UI locales (`packages/localization/src/locales.ts`), BCP-47, Arabic RTL (`<html dir>`; CSS uses logical properties).
- Resolution: stored choice → first matching browser language → English. Traditional Chinese is *not* mapped to `zh-Hans`.
- Catalogues: shell (`apps/web/src/i18n/ui/<locale>.ts`, type-checked key sets), shared game vocabulary (`common.*`), and one namespace per game (`metadata.messages`). Tests enforce complete key sets and identical placeholders; the English fallback exists only as a safety net and is reported.
- Content languages (learning/translation) are separate preferences that accept any BCP-47 tag.
- Translations other than en/de are AI-assisted and await native-speaker review.

## PWA and offline

`vite-plugin-pwa` (Workbox `generateSW`) precaches the shell and all bundled game chunks. Updates: a new release is applied automatically (reload) whenever no game page is open; on a game page it waits and is offered via "Update now", and is applied on the next navigation away — a running game is never interrupted. Open tabs check for updates hourly. Large optional content (audio packs, AI models) will use separate caches downloaded only on explicit request with the size shown first.

## Deployment

Cloudflare Pages (SPA fallback for deep links, ADR 0008). Security headers via `public/_headers`. See [deployment.md](deployment.md).

## Determinism and randomness

`createRng(seed)` (mulberry32, 32-bit state). `Math.random()` is banned by lint. The shell picks new seeds via `crypto.getRandomValues` (`randomSeed`) and accepts `?seed=` for reproduction.

## Testing strategy

| Level | Tool | Scope |
|---|---|---|
| Unit / TDD | Vitest | rules, core packages, router, catalogues |
| Property / fuzz | fast-check | invariants (legal moves, permutations, parsers never throw, determinism) |
| Contract | `@wp/testing` | every game, every locale |
| Mutation | Stryker | core packages, `games/*/src/rules.ts`, `ai.ts` (break threshold 65 %). Vitest is pinned to 4.1.x: with Vitest 5, `@stryker-mutator/vitest-runner` 10 does not activate mutants (every mutant "survives"). Re-check before upgrading. |
| E2E | Playwright | shell, direct URLs, RTL, corrupt saves, offline, per-game resume; desktop + mobile viewports |
