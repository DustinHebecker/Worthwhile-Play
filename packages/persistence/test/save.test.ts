import { describe, expect, it, vi } from 'vitest';
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
  const setup = () => {
    vi.useFakeTimers();
    const listeners = new Map<string, () => void>();
    const target = {
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
      visibilityState: 'visible' as DocumentVisibilityState
    };
    const save = vi.fn(async () => {});
    const onError = vi.fn();
    const autosave = createAutosave({ save, onError, delayMs: 100, win: target as never, doc: target as never, timers: { setTimeout, clearTimeout } });
    return { autosave, save, onError, listeners, target };
  };

  it('debounces requests', async () => {
    const { autosave, save } = setup();
    autosave.request();
    autosave.request();
    await vi.advanceTimersByTimeAsync(99);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('flushes immediately when the page is hidden or unloaded', async () => {
    const { autosave, save, listeners, target } = setup();
    autosave.request();
    target.visibilityState = 'hidden';
    listeners.get('visibilitychange')?.();
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledTimes(1);
    autosave.request();
    listeners.get('pagehide')?.();
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledTimes(2);
    listeners.get('pagehide')?.();
    await vi.runAllTimersAsync();
    expect(save).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('does not flush on visible visibilitychange; flush(force) saves anyway; dispose removes listeners', async () => {
    const { autosave, save, listeners } = setup();
    autosave.request();
    listeners.get('visibilitychange')?.();
    expect(save).not.toHaveBeenCalled();
    await autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
    await autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
    await autosave.flush(true);
    expect(save).toHaveBeenCalledTimes(2);
    autosave.dispose();
    expect(listeners.size).toBe(0);
    vi.useRealTimers();
  });

  it('reports save errors without breaking later saves', async () => {
    const { autosave, save, onError } = setup();
    save.mockRejectedValueOnce(new Error('quota'));
    await autosave.flush(true);
    expect(onError).toHaveBeenCalledTimes(1);
    await autosave.flush(true);
    expect(save).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
