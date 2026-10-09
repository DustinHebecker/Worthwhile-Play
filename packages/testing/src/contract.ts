import { beforeAll, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { validateMetadata, type GameInstance, type GameModule } from '@wp/game-core';
import { auditCatalogues, COMMON_MESSAGES, SUPPORTED_LOCALES } from '@wp/localization';
import { createSave, createMemoryStore, interpretSave } from '@wp/persistence';
import { createTestContext, type TestContextExtras } from './context';

export interface ContractOptions<S> {
  /** Seeds used for determinism checks. */
  seeds?: readonly number[];
  /**
   * Performs a few legal user interactions through the DOM (preferred) or instance API,
   * so that save/restore is verified on a non-initial state. Should trigger `requestSave`.
   */
  interact?: (root: HTMLElement, instance: GameInstance<S>) => void | Promise<void>;
  /** Optional host services for every context the suite creates (fresh per context, e.g. learning records). */
  extras?: () => TestContextExtras;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Shared contract every game must satisfy. Games with `preload` (ADR 0011) get it awaited for English before
 * the suite and for each locale before rendering in it, as the app shell does. Call from a test file running in jsdom:
 *
 *   // @vitest-environment jsdom
 *   runGameContract(game, { interact: (root) => root.querySelector('button')!.click() });
 */
export function runGameContract<S>(module: GameModule<S>, options: ContractOptions<S> = {}): void {
  const seeds = options.seeds ?? [1, 42, 0xdeadbeef];
  const start = (seed: number) => {
    const ctx = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
    const instance = module.create(ctx.context) as GameInstance<S>;
    instance.newGame({ seed });
    return { ctx, instance };
  };

  describe(`GameModule contract: ${module.metadata.id}`, () => {
    // Games with per-locale content (ADR 0011) need it loaded before `create`, like in the app shell.
    beforeAll(async () => {
      await module.preload?.('en');
    });

    it('has valid metadata with required messages for all 16 UI locales', () => {
      expect(validateMetadata(module.metadata, SUPPORTED_LOCALES)).toEqual([]);
    });

    it('has complete, placeholder-consistent translations in every locale', () => {
      expect(auditCatalogues(module.metadata.messages, SUPPORTED_LOCALES)).toEqual([]);
    });

    it('is deterministic for a given seed', () => {
      for (const seed of seeds) {
        const a = start(seed);
        const b = start(seed);
        expect(a.instance.serialize()).toEqual(b.instance.serialize());
        a.instance.dispose();
        b.instance.dispose();
      }
    });

    it('serializes to plain JSON data accepted by isValidState', () => {
      const { instance } = start(seeds[0] ?? 1);
      const state = instance.serialize();
      expect(clone(state)).toEqual(state);
      expect(module.isValidState(clone(state))).toBe(true);
      instance.dispose();
    });

    it('rejects arbitrary untrusted data without throwing', () => {
      for (const junk of [null, undefined, 0, 'x', [], {}, { board: 'nope' }, [[1, 2]]]) {
        expect(module.isValidState(junk)).toBe(false);
      }
      fc.assert(
        fc.property(fc.anything(), (value) => {
          expect(() => module.isValidState(value)).not.toThrow();
        }),
        { numRuns: 300 }
      );
    });

    it('resumes exactly after close (save → reload → restore), including after interaction', async () => {
      const { ctx, instance } = start(seeds[1] ?? 42);
      if (options.interact) {
        await options.interact(ctx.context.root, instance);
        expect(ctx.saveRequests(), 'interaction should request an autosave').toBeGreaterThan(0);
      }
      const before = instance.serialize();
      const store = createMemoryStore();
      await store.write(createSave(module, seeds[1] ?? 42, before));
      instance.dispose();

      const loaded = interpretSave(await store.read(module.metadata.id), module);
      expect(loaded.status).toBe('ok');
      if (loaded.status !== 'ok') return;
      const ctx2 = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
      const restored = module.create(ctx2.context) as GameInstance<S>;
      restored.restore(loaded.save.state);
      expect(restored.serialize()).toEqual(before);
      expect(ctx2.context.root.childElementCount, 'restored game should render').toBeGreaterThan(0);
      restored.dispose();
    });

    it('keeps logical state across pause/resume and resets to the seeded start', async () => {
      const { ctx, instance } = start(7);
      const initial = instance.serialize();
      if (options.interact) await options.interact(ctx.context.root, instance);
      const mid = instance.serialize();
      instance.pause();
      instance.resume();
      expect(instance.serialize()).toEqual(mid);
      instance.reset();
      expect(instance.serialize()).toEqual(initial);
      instance.dispose();
    });

    if (module.preload) {
      const preload = module.preload.bind(module);
      it('preloads the content of every UI locale (repeatable, nothing reported)', async () => {
        // A locale that fails to load falls back to English and is reported via console.error.
        const reported = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
          for (const locale of SUPPORTED_LOCALES) {
            await expect(preload(locale), `preload ${locale}`).resolves.toBeUndefined();
            await expect(preload(locale), `preload ${locale} again`).resolves.toBeUndefined();
          }
          expect(reported.mock.calls).toEqual([]);
        } finally {
          reported.mockRestore();
        }
      });
    }

    it('renders without missing translation keys in every locale', async () => {
      for (const locale of SUPPORTED_LOCALES) {
        // The host awaits `preload(locale)` for the locale the game is shown in.
        await module.preload?.(locale);
        const ctx = createTestContext(module as GameModule<unknown>, locale, undefined, options.extras?.());
        const instance = module.create(ctx.context);
        instance.newGame({ seed: 3 });
        expect(ctx.missingKeys, `missing keys in ${locale}`).toEqual([]);
        instance.dispose();
      }
    });

    it('cleans up its DOM on dispose', () => {
      const { ctx, instance } = start(5);
      instance.dispose();
      expect(ctx.context.root.childElementCount).toBe(0);
    });
  });
}

/** Asserts that shared common messages are complete; used by the localization package tests. */
export function auditCommonMessages(): string[] {
  return auditCatalogues(COMMON_MESSAGES, SUPPORTED_LOCALES);
}
