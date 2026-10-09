/**
 * Per-locale game content (ADR 0011): a game keeps the content of each UI locale in its own module and
 * lists them as dynamic imports, so the bundler emits one chunk per locale. `GameModule.preload(locale)`
 * loads the active locale and the fallback before the host creates the game; afterwards the view reads
 * the content synchronously with `get(locale)`.
 */
export type LocaleLoaders<T> = Readonly<Record<string, () => Promise<T>>>;

export interface LocaleContentStore<T> {
  /**
   * Loads the content of `locale` (if it has a loader) and of the fallback locale in parallel; loaded content
   * is cached, a failed load is retried on the next call. Resolves as soon as `get(locale)` can return content:
   * the requested locale's, or the fallback's when the requested one failed (reported via `onError`).
   * Rejects only when neither can be loaded.
   */
  preload(locale: string): Promise<void>;
  /**
   * Content of `locale` if it is loaded, else of the fallback locale. Throws when neither is loaded,
   * i.e. when the host did not await `preload` (a programming error, never a user-visible state).
   */
  get(locale: string): T;
  /** Whether the content of `locale` itself is loaded. */
  isLoaded(locale: string): boolean;
}

export interface LocaleContentOptions {
  /** Locale used when the requested one has no loader or cannot be loaded. Default `en`. */
  readonly fallback?: string;
  /** Reports a failed load that `preload` recovered from (default: `console.error`). */
  readonly onError?: (error: unknown) => void;
}

export function createLocaleContent<T>(loaders: LocaleLoaders<T>, options: LocaleContentOptions = {}): LocaleContentStore<T> {
  const fallback = options.fallback ?? 'en';
  const onError = options.onError ?? ((error: unknown) => console.error(error));
  const loaded = new Map<string, T>();
  const pending = new Map<string, Promise<T>>();
  const has = (locale: string) => Object.hasOwn(loaders, locale);

  const loadOne = (locale: string): Promise<T> => {
    let promise = pending.get(locale);
    if (!promise) {
      promise = loaders[locale]!().then((content) => {
        loaded.set(locale, content);
        return content;
      });
      // A failed load (e.g. offline before the chunk was cached) may be retried by a later preload.
      promise.catch(() => pending.delete(locale));
      pending.set(locale, promise);
    }
    return promise;
  };

  return {
    async preload(locale) {
      const wanted = has(locale) && locale !== fallback ? [loadOne(locale)] : [];
      const results = await Promise.allSettled([...wanted, loadOne(fallback)]);
      const failures = results.flatMap((r) => (r.status === 'rejected' ? [r.reason as unknown] : []));
      if (failures.length === results.length) throw failures[0];
      for (const failure of failures) onError(failure);
    },
    get(locale) {
      const content = loaded.get(locale) ?? loaded.get(fallback);
      if (content === undefined) throw new Error(`Content for "${locale}" is not loaded: await preload("${locale}") before creating the game.`);
      return content;
    },
    isLoaded: (locale) => loaded.has(locale)
  };
}
