// @ts-nocheck
export interface AutosaveOptions {
  /** Persists the current state. Errors are reported via `onError`, never thrown. */
  save: () => Promise<void>;
  /** Coalescing window for `request()` calls in ms (default 50). Kept short: a pending write may not survive a tab close. */
  delayMs?: number;
  onError?: (error: unknown) => void;
  /** Injected for tests. */
  win?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  doc?: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;
  timers?: { setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout };
}

export interface Autosave {
  /** Schedule a debounced save (call after each logically complete state change). */
  request(): void;
  /** Save now if a save is pending (or `force`). */
  flush(force?: boolean): Promise<void>;
  dispose(): void;
}

/**
 * Continuous autosave. Saves are debounced during play and flushed when the page
 * becomes hidden (`visibilitychange`) or is being unloaded (`pagehide`). It does not
 * rely on `beforeunload`/`unload`, which are unreliable on mobile.
 */
export function createAutosave(options: AutosaveOptions): Autosave {
  const delay = options.delayMs ?? 50;
  const win = options.win ?? globalThis.window;
  const doc = options.doc ?? globalThis.document;
  const timers = options.timers ?? { setTimeout: globalThis.setTimeout.bind(globalThis), clearTimeout: globalThis.clearTimeout.bind(globalThis) };
  let pending = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let chain: Promise<void> = Promise.resolve();

  const run = (): Promise<void> => {
    pending = false;
    if (timer !== undefined) timers.clearTimeout(timer);
    timer = undefined;
    chain = chain.then(options.save).catch((error: unknown) => options.onError?.(error));
    return chain;
  };

  const onVisibility = () => {
    if (doc?.visibilityState === 'hidden' && pending) void run();
  };
  const onPageHide = () => {
    if (pending) void run();
  };
  doc?.addEventListener('visibilitychange', onVisibility);
  win?.addEventListener('pagehide', onPageHide);

  return {
    request() {
      pending = true;
      if (timer !== undefined) timers.clearTimeout(timer);
      timer = timers.setTimeout(() => void run(), delay);
    },
    flush(force = false) {
      return pending || force ? run() : chain;
    },
    dispose() {
      if (timer !== undefined) timers.clearTimeout(timer);
      doc?.removeEventListener('visibilitychange', onVisibility);
      win?.removeEventListener('pagehide', onPageHide);
    }
  };
}
