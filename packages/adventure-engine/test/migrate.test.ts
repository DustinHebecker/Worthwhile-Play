import { describe, expect, it } from 'vitest';
import { compile, initialState, isValidAdventureState, migrateAdventureState, type Adventure, type AdventureState } from '../src';
import { checkAdventure } from '../src/check';
import { WATCHTOWER } from './fixture';

/**
 * Content version 2 of the fixture: the flag "grapnel-hooked" is renamed to "window-rope" and a new clue is
 * added. A version-1 save must continue as a valid version-2 save (orchestrator review M1).
 */
const V2: Adventure = JSON.parse(
  JSON.stringify({ ...WATCHTOWER, contentVersion: 2, clues: [...WATCHTOWER.clues, { id: 'new-clue' }] }).replaceAll('grapnel-hooked', 'window-rope')
) as Adventure;
const C1 = compile(WATCHTOWER);
const C2 = compile(V2);
const STEPS = {
  1: (s: Record<string, unknown>) => {
    const flags = { ...(s.flags as Record<string, number>) };
    if ('grapnel-hooked' in flags) {
      flags['window-rope'] = flags['grapnel-hooked'] as number;
      delete flags['grapnel-hooked'];
    }
    return { ...s, flags };
  }
};

/** A version-1 fixture save: the grapnel is hooked to the window (flag set). */
const V1_SAVE: AdventureState = { ...initialState(C1, 7), flags: { 'grapnel-hooked': 1 }, used: ['rope', 'hook', 'grapnel'], visited: ['yard', 'cellar'], goalsDone: ['explore'], chapter: 1 };

describe('content migrations', () => {
  it('the v1 fixture save is valid for v1 and not for v2 as it is', () => {
    expect(isValidAdventureState(C1, V1_SAVE)).toBe(true);
    expect(isValidAdventureState(C2, V1_SAVE)).toBe(false);
  });

  it('migrates a v1 save to v2', () => {
    const m = migrateAdventureState(C2, STEPS, structuredClone(V1_SAVE), 1);
    expect(m).toEqual({ ...V1_SAVE, content: 2, flags: { 'window-rope': 1 } });
    expect(isValidAdventureState(C2, m)).toBe(true);
  });

  it('gives up (never throws) on a missing step, a failing step, a wrong version or junk', () => {
    expect(migrateAdventureState(C2, {}, V1_SAVE, 1)).toBeUndefined();
    expect(migrateAdventureState(C2, { 1: () => { throw new Error('x'); } }, V1_SAVE, 1)).toBeUndefined();
    expect(migrateAdventureState(C2, { 1: (s) => ({ ...s, scene: 'moon' }) }, V1_SAVE, 1)).toBeUndefined();
    expect(migrateAdventureState(C2, STEPS, V1_SAVE, 2)).toBeUndefined();
    expect(migrateAdventureState(C2, STEPS, V1_SAVE, 0)).toBeUndefined();
    expect(migrateAdventureState(C2, STEPS, { ...V1_SAVE, content: 3 }, 1)).toBeUndefined();
    expect(migrateAdventureState(C2, STEPS, null, 1)).toBeUndefined();
    expect(migrateAdventureState(C2, STEPS, 'save', 1)).toBeUndefined();
  });

  it('does not mutate the input; steps cannot set the version themselves', () => {
    const input = structuredClone(V1_SAVE);
    migrateAdventureState(C2, { 1: (s) => ({ ...STEPS[1](s), content: 99 }) }, input, 1);
    expect(input).toEqual(V1_SAVE);
    expect(migrateAdventureState(C2, { 1: (s) => ({ ...STEPS[1](s), content: 99 }) }, input, 1)?.content).toBe(2);
  });

  it('chains steps across several versions', () => {
    const V3 = { ...V2, contentVersion: 3 } as Adventure;
    const m = migrateAdventureState(compile(V3), { ...STEPS, 2: (s) => s }, V1_SAVE, 1);
    expect(m?.content).toBe(3);
    expect(migrateAdventureState(compile(V3), STEPS, V1_SAVE, 1)).toBeUndefined();
  });
});

describe('checker: scene-change loop at the start (review L3)', () => {
  it('is reported', () => {
    const adv: Adventure = {
      ...WATCHTOWER,
      scenes: WATCHTOWER.scenes.map((sc) =>
        sc.id === 'yard' ? { ...sc, onEnter: [{ then: [{ go: 'cellar' }] }] } : sc.id === 'cellar' ? { ...sc, onEnter: [{ then: [{ go: 'yard' }] }] } : sc
      )
    };
    expect(checkAdventure(adv).errors).toContain('scene-change loop: an action leads through more than 8 onEnter scene changes (the engine stops there): at the start');
  });
});
