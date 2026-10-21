import { beforeAll, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { coerceSetting, hostSettings, resolveSettings, settingChoices, settingId, validateMetadata, validateSettings, type GameInstance, type GameModule, type NewGameOptions, type SettingSpec, type SettingValue } from '@wp/game-core';
import { auditCatalogues, COMMON_MESSAGES, SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import { createSave, createMemoryStore, interpretSave } from '@wp/persistence';
import { createTestContext, createTestLibrary, type TestContextExtras } from './context';

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
  /**
   * Locales whose translations must be complete. Defaults to every supported locale. A smaller set is
   * only for games still in development and NOT registered in the app (released games ship all 16).
   */
  locales?: readonly SupportedLocale[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** An arbitrary allowed value of one setting. */
function arbitraryValue(spec: SettingSpec, module: GameModule<unknown>): fc.Arbitrary<SettingValue> {
  const choices = settingChoices(spec, module.metadata);
  if (choices) return fc.constantFrom(...(choices.length ? choices : ['']));
  if (spec.kind === 'toggle') return fc.boolean();
  if (spec.kind === 'number') {
    const step = spec.step ?? 1;
    return fc.integer({ min: 0, max: Math.floor((spec.max - spec.min) / step + 1e-9) }).map((i) => spec.min + i * step);
  }
  return fc.constant('');
}

/** Arbitrary start-screen choices for a module's host settings, resolved as the host would (hidden ones left out). */
function arbitraryOptions(module: GameModule<unknown>, specs: readonly SettingSpec[]): fc.Arbitrary<Omit<NewGameOptions, 'seed'>> {
  const record: Record<string, fc.Arbitrary<SettingValue>> = {};
  for (const spec of specs) record[settingId(spec)] = arbitraryValue(spec, module);
  return fc.record(record).map((chosen) => {
    const { difficulty, settings } = resolveSettings(specs, module.metadata, chosen);
    return { ...(difficulty !== undefined ? { difficulty } : {}), settings, begin: true };
  });
}

/**
 * Shared contract every game must satisfy. Games with `preload` (ADR 0011) get it awaited for English before
 * the suite and for each locale before rendering in it, as the app shell does. Call from a test file running in jsdom:
 *
 *   // @vitest-environment jsdom
 *   runGameContract(game, { interact: (root) => root.querySelector('button')!.click() });
 */
export function runGameContract<S>(module: GameModule<S>, options: ContractOptions<S> = {}): void {
  const seeds = options.seeds ?? [1, 42, 0xdeadbeef];
  const locales = options.locales ?? SUPPORTED_LOCALES;
  const start = (seed: number, extras: TestContextExtras | undefined = options.extras?.()) => {
    const ctx = createTestContext(module as GameModule<unknown>, 'en', undefined, extras);
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
      expect(validateMetadata(module.metadata, locales)).toEqual([]);
    });

    it('has complete, placeholder-consistent translations in every locale', () => {
      expect(auditCatalogues(module.metadata.messages, locales)).toEqual([]);
    });

    it('declares valid start-screen settings (ADR 0017) with all keys in all 16 locales', () => {
      const ctx = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
      expect(validateSettings(module as GameModule<unknown>, locales, ctx.settingsEnv)).toEqual([]);
      ctx.context.root.remove();
    });

    it('starts deterministically and validly with any start-screen settings and with begin (ADR 0017)', () => {
      const env = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
      const specs = hostSettings(module as GameModule<unknown>, env.settingsEnv);
      env.context.root.remove();
      const play = (seed: number, opts: Omit<NewGameOptions, 'seed'>) => {
        const ctx = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
        const instance = module.create(ctx.context);
        instance.newGame({ seed, ...opts });
        const state = clone(instance.serialize());
        instance.dispose();
        ctx.context.root.remove();
        return state;
      };
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 0xffffffff }), arbitraryOptions(module as GameModule<unknown>, specs), (seed, opts) => {
          const a = play(seed, opts);
          expect(module.isValidState(a)).toBe(true);
          expect(play(seed, opts)).toEqual(a);
        }),
        { numRuns: specs.length ? 12 : 3 }
      );
    });

    it('never throws on junk settings (old saves, deep links, tests), also under its own setting ids', () => {
      const env = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
      const ids = hostSettings(module as GameModule<unknown>, env.settingsEnv).map(settingId).filter((id) => id !== 'difficulty');
      env.context.root.remove();
      const junkValue = fc.oneof(
        fc.string(),
        fc.integer(),
        fc.double(),
        fc.boolean(),
        fc.constantFrom('', 'zzz', '__proto__', 'own:missing', 'random', -1, 0, 1, 3.5, 1e9, Number.NaN, Number.POSITIVE_INFINITY)
      ) as fc.Arbitrary<SettingValue>;
      const own = fc.record(Object.fromEntries(ids.map((id) => [id, junkValue])) as Record<string, fc.Arbitrary<SettingValue>>, { requiredKeys: [] });
      const junk = fc.record({
        difficulty: fc.option(fc.oneof(fc.string(), fc.constantFrom(...(module.metadata.difficulties ?? ['x']))), { nil: undefined }),
        settings: fc.tuple(fc.dictionary(fc.string({ maxLength: 8 }), junkValue, { maxKeys: 4 }), own).map(([other, mine]) => ({ ...other, ...mine }) as Record<string, SettingValue>),
        begin: fc.boolean()
      });
      fc.assert(
        fc.property(junk, (opts) => {
          const ctx = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
          const instance = module.create(ctx.context);
          const { difficulty, ...rest } = opts;
          instance.newGame({ seed: 9, ...rest, ...(difficulty !== undefined ? { difficulty } : {}) });
          expect(module.isValidState(clone(instance.serialize()))).toBe(true);
          instance.dispose();
          ctx.context.root.remove();
        }),
        { numRuns: module.settings ? 25 : 3 }
      );
    });

    if (module.settingsOf) {
      const settingsOf = module.settingsOf.bind(module) as (state: unknown) => Readonly<Record<string, SettingValue>>;
      it('settingsOf tells every start-screen setting a game was started with (older saves, ADR 0017)', () => {
        const env = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
        const specs = hostSettings(module as GameModule<unknown>, env.settingsEnv);
        env.context.root.remove();
        fc.assert(
          fc.property(fc.integer({ min: 0, max: 0xffffffff }), arbitraryOptions(module as GameModule<unknown>, specs), (seed, opts) => {
            const play = (start: Omit<NewGameOptions, 'seed'>) => {
              const ctx = createTestContext(module as GameModule<unknown>, 'en', undefined, options.extras?.());
              const instance = module.create(ctx.context);
              instance.newGame({ seed, ...start });
              const state = clone(instance.serialize());
              instance.dispose();
              ctx.context.root.remove();
              return state;
            };
            const state = play(opts);
            const derived = settingsOf(state);
            // "Another round" with what settingsOf tells starts the same game (equivalent choices may differ in name,
            // e.g. "any map" and the map the game number picks).
            const actual = resolveSettings(specs, module.metadata, derived);
            expect(play({ ...(actual.difficulty !== undefined ? { difficulty: actual.difficulty } : {}), settings: actual.settings, begin: true })).toEqual(state);
            // As the host checks it: every visible setting comes from the state (none filled in by a default).
            for (const spec of specs) {
              const id = settingId(spec);
              if (actual.visible.has(id)) expect(coerceSetting(spec, module.metadata, derived[id]), `settingsOf lacks "${id}"`).not.toBeUndefined();
            }
          }),
          { numRuns: 20 }
        );
      });
    }

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
      // Same device, so the same library (ADR 0012) in both sessions, unless the suite provides its own.
      const shared = createTestLibrary(module.metadata.id).library;
      const extras = (): TestContextExtras => ({ library: shared, ...options.extras?.() });
      const { ctx, instance } = start(seeds[1] ?? 42, extras());
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
      const ctx2 = createTestContext(module as GameModule<unknown>, 'en', undefined, extras());
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
          for (const locale of locales) {
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
      for (const locale of locales) {
        // The host awaits `preload(locale)` for the locale the game is shown in.
        await module.preload?.(locale);
        const ctx = createTestContext(module as GameModule<unknown>, locale, undefined, options.extras?.());
        const instance = module.create(ctx.context);
        instance.newGame({ seed: 3 });
        expect(ctx.missingKeys, `missing keys in ${locale}`).toEqual([]);
        instance.dispose();
      }
    });

    it('works without the optional library (older hosts, storage-less tests)', () => {
      const ctx = createTestContext(module as GameModule<unknown>, 'en', undefined, { ...options.extras?.(), library: undefined });
      expect(ctx.context.library).toBeUndefined();
      const instance = module.create(ctx.context);
      instance.newGame({ seed: 4 });
      expect(module.isValidState(clone(instance.serialize()))).toBe(true);
      instance.dispose();
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
