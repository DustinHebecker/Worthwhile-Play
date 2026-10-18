/*
 * Card illustrations (design § 7.3, owner feedback B2): one original, code-drawn picture per card that shows what
 * the name says and carries its own gag. Static SVG markup (no text, no user data), 160 × 120 view box, colours
 * from `.il-*` classes (styles.css; forced colours too). Cards without an illustration (or whose world's pictures
 * are still loading) fall back to the pictogram kit (art.ts).
 *
 * One chunk per world, loaded on demand: Kampfzwerge with the game's `preload`, other worlds when a game with them
 * is dealt or restored (K3; all three together would triple the game chunk).
 */
import type { WorldId } from '../worlds';

const LOADERS: Readonly<Record<WorldId, () => Promise<Readonly<Record<string, string>>>>> = {
  kz: () => import('./kz').then((m) => m.KZ),
  sl: () => import('./sl').then((m) => m.SL),
  of: () => import('./of').then((m) => m.OF)
};

const ILLUSTRATIONS = new Map<string, string>();
const pending = new Map<string, Promise<void>>();
const loaded = new Set<string>();

/** Loads the pictures of the given worlds (repeatable; unknown worlds and failed loads leave the pictograms). */
export function loadIllustrations(worlds: readonly string[]): Promise<void> {
  return Promise.all(
    worlds.map((world) => {
      const loader = Object.hasOwn(LOADERS, world) ? LOADERS[world as WorldId] : undefined;
      if (!loader) return Promise.resolve();
      let p = pending.get(world);
      if (!p) {
        p = loader().then(
          (pictures) => {
            for (const [id, svg] of Object.entries(pictures)) ILLUSTRATIONS.set(id, svg);
            loaded.add(world);
          },
          () => {
            // Offline without the chunk: the pictograms stay. A later call tries again, but browsers may keep a failed
            // chunk import until the page is reloaded, so the pictures can stay missing until then.
            pending.delete(world);
          }
        );
        pending.set(world, p);
      }
      return p;
    })
  ).then(() => undefined);
}

/** True when every given world's pictures are loaded. */
export const illustrationsLoaded = (worlds: readonly string[]): boolean => worlds.every((w) => !Object.hasOwn(LOADERS, w) || loaded.has(w));

/** SVG markup of a card's illustration, or `undefined` if it has none (yet). */
export function illustration(base: string): string | undefined {
  const inner = ILLUSTRATIONS.get(base);
  return inner === undefined ? undefined : `<svg viewBox="0 0 160 120" aria-hidden="true" focusable="false" class="cq-il">${inner}</svg>`;
}

/** Base ids that have a loaded illustration (for tests). */
export const illustratedCards = (): string[] => [...ILLUSTRATIONS.keys()];
