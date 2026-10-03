// @ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import type { GameModule } from '@wp/game-core';
import { createAutosave, createIndexedDbStore, createMemoryStore, createSave, interpretSave, isGameSave } from '../src';

type State = { count: number };
const module = (overrides: Partial<GameModule<State>> = {}, stateVersion = 2): GameModule<State> => ({
  metadata: {
    id: 'counter',
    stateVersion,
    skills: ['planning'],
    typicalMinutes: [1, 2],
    inputMethods: ['pointer'],
    capabilities: { offline: true, audio: 'none', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
    messages: {}
  },
  create: () => {
    throw new Error('not used');
  },
  isValidState: (v: unknown): v is State => typeof v === 'object' && v !== null && Number.isInteger((v as State).count),
  migrateState: (s, from) => (from === 1 && typeof s === 'number' ? { count: s } : undefined),
  ...overrides
});

describe('interpretSave', () => {
  it('returns empty for missing data', () => {
    expect(interpretSave(undefined, module())).toEqual({ status: 'empty' });
    expect(interpretSave(null, module())).toEqual({ status: 'empty' });
  });

  it('accepts a valid current save', () => {
    const save = createSave(module(), 9, { count: 3 }, 'easy', new Date('2026-01-01T00:00:00Z'));
    const result = interpretSave(save, module());
    expect(result).toEqual({ status: 'ok', migrated: false, save });
    expect(save.updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('migrates older state versions', () => {
    const old = { ...createSave(module(), 1, 5 as unknown as State), stateVersion: 1 };
    const result = interpretSave(old, module());
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.migrated).toBe(true);
      expect(result.save.state).toEqual({ count: 5 });
      expect(result.save.stateVersion).toBe(2);
    }
  });

  it.each([
    ['invalid-envelope', { hello: 'world' }],
    ['game-mismatch', { ...createSave(module(), 1, { count: 1 }), gameId: 'other' }],
    ['newer-version', { ...createSave(module(), 1, { count: 1 }), stateVersion: 3 }],
    ['migration-failed', { ...createSave(module(), 1, { count: 1 }), stateVersion: 1 }],
    ['invalid-state', createSave(module(), 1, { count: 'x' } as unknown as State)]
  ])('reports %s as corrupt instead of throwing', (reason, raw) => {
    expect(interpretSave(raw, module())).toEqual({ status: 'corrupt', reason });
  });

  it('treats throwing migrations and validators as corrupt', () => {
    const throwing = module({
      migrateState: () => {
        throw new Error('boom');
      }
    });
    expect(interpretSave({ ...createSave(throwing, 1, { count: 1 }), stateVersion: 1 }, throwing)).toEqual({ status: 'corrupt', reason: 'migration-failed' });
    const badValidator = module({
      isValidState: (_v: unknown): _v is State => {
        throw new Error('boom');
      }
    });
    expect(interpretSave(createSave(badValidator, 1, { count: 1 }), badValidator)).toEqual({ status: 'corrupt', reason: 'invalid-state' });
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.anything(), (raw) => void interpretSave(raw, module())));
  });

  it('isGameSave checks seed range and difficulty type', () => {
    const save = createSave(module(), 1, { count: 1 });
    expect(isGameSave(save)).toBe(true);
    expect(isGameSave({ ...save, seed: -1 })).toBe(false);
    expect(isGameSave({ ...save, difficulty: 3 })).toBe(false);
    const { state: _state, ...withoutState } = save;
    expect(isGameSave(withoutState)).toBe(false);
  });
});

describe('stores', () => {
  it.each([
    ['memory', async () => createMemoryStore()],
    ['indexeddb', async () => createIndexedDbStore(indexedDB, `test-${Math.random()}`)] // eslint-disable-line no-restricted-properties
  ])('%s store round-trips saves', async (_name, factory) => {
    const store = await factory();
    const save = createSave(module(), 4, { count: 2 });
    expect(await store.read('counter')).toBeUndefined();
    await store.write(save);
    expect(await store.read('counter')).toEqual(save);
    expect(await store.keys()).toEqual(['counter']);
    await store.remove('counter');
    expect(await store.keys()).toEqual([]);
  });

  it('falls back to memory when IndexedDB is unavailable', async () => {
    const store = await createIndexedDbStore(null);
    expect(store.persistent).toBe(false);
    const broken = { open: () => { throw new Error('denied'); } } as unknown as IDBFactory;
    expect((await createIndexedDbStore(broken)).persistent).toBe(false);
  });

  it('memory store rejects non-serializable state like IndexedDB would', async () => {
    const store = createMemoryStore();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    await expect(store.write(createSave(module(), 1, cyclic as unknown as State))).rejects.toThrow();
  });
});

describe('autosave', () => {
  const flushMicrotasks = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };
  const setup = (delayMs = 100) => {
    vi.useFakeTimers();
    const listeners = new Map<string, () => void>();
    const target = {
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
      removeEventListener: (type: string, fn: () => void) => {
        if (listeners.get(type) === fn) listeners.delete(type);
      },
      visibilityState: 'visible' as DocumentVisibilityState
    };
    const save = vi.fn(async () => {});
    const onError = vi.fn();
    const autosave = createAutosave({ save, onError, delayMs, win: target as never, doc: target as never, timers: { setTimeout, clearTimeout } });
    return { autosave, save, onError, listeners, target };
  };
  afterEach(() => vi.useRealTimers());

  it('registers visibilitychange on the document and pagehide on the window', () => {
    vi.useFakeTimers();
    const doc = { addEventListener: vi.fn(), removeEventListener: vi.fn(), visibilityState: 'visible' };
    const win = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const a = createAutosave({ save: async () => {}, doc: doc as never, win: win as never });
    expect(doc.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(win.addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function));
    a.dispose();
    expect(doc.removeEventListener).toHaveBeenCalledWith('visibilitychange', doc.addEventListener.mock.calls[0]?.[1]);
    expect(win.removeEventListener).toHaveBeenCalledWith('pagehide', win.addEventListener.mock.calls[0]?.[1]);
  });

  it('debounces requests into one save after the delay', async () => {
    const { autosave, save } = setup();
    autosave.request();
    await vi.advanceTimersByTimeAsync(60);
    autosave.request();
    await vi.advanceTimersByTimeAsync(99);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('uses a short default delay', async () => {
    vi.useFakeTimers();
    const save = vi.fn(async () => {});
    const a = createAutosave({ save, doc: undefined as never, win: undefined as never });
    a.request();
    await vi.advanceTimersByTimeAsync(49);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    a.dispose();
  });

  it('flushes synchronously (without waiting for the timer) when the page becomes hidden', async () => {
    const { autosave, save, listeners, target } = setup(10_000);
    autosave.request();
    target.visibilityState = 'hidden';
    listeners.get('visibilitychange')?.();
    await flushMicrotasks();
    expect(save).toHaveBeenCalledTimes(1);
    // the pending timer was cancelled: no second save later
    await vi.advanceTimersByTimeAsync(20_000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('does not save on visibilitychange while visible or when nothing is pending', async () => {
    const { autosave, save, listeners, target } = setup(10_000);
    autosave.request();
    listeners.get('visibilitychange')?.();
    await flushMicrotasks();
    expect(save).not.toHaveBeenCalled();
    await autosave.flush();
    target.visibilityState = 'hidden';
    listeners.get('visibilitychange')?.();
    await flushMicrotasks();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flushes on pagehide only when a save is pending', async () => {
    const { autosave, save, listeners } = setup(10_000);
    listeners.get('pagehide')?.();
    await flushMicrotasks();
    expect(save).not.toHaveBeenCalled();
    autosave.request();
    listeners.get('pagehide')?.();
    await flushMicrotasks();
    expect(save).toHaveBeenCalledTimes(1);
    listeners.get('pagehide')?.();
    await flushMicrotasks();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('flush() saves only when pending unless forced', async () => {
    const { autosave, save } = setup();
    await autosave.flush();
    expect(save).not.toHaveBeenCalled();
    autosave.request();
    await autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledTimes(1);
    await autosave.flush(true);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('dispose() cancels a pending timer and removes listeners', async () => {
    const { autosave, save, listeners } = setup();
    autosave.request();
    autosave.dispose();
    expect(listeners.size).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).not.toHaveBeenCalled();
  });

  it('serializes saves and reports errors without breaking later saves', async () => {
    const { autosave, save, onError } = setup();
    const order: string[] = [];
    save.mockImplementationOnce(async () => {
      order.push('a-start');
      await Promise.resolve();
      order.push('a-end');
      throw new Error('quota');
    });
    save.mockImplementationOnce(async () => {
      order.push('b');
    });
    const first = autosave.flush(true);
    const second = autosave.flush(true);
    await Promise.all([first, second]);
    expect(order).toEqual(['a-start', 'a-end', 'b']);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  it('works without an onError handler', async () => {
    vi.useFakeTimers();
    const a = createAutosave({ save: async () => { throw new Error('x'); }, doc: undefined as never, win: undefined as never, timers: { setTimeout, clearTimeout } });
    await expect(a.flush(true)).resolves.toBeUndefined();
  });
});
