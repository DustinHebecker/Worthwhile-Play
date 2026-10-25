// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createTestContext } from '@wp/testing';
import { interpretSave } from '@wp/persistence';
import type { GameInstance, GameModule } from '@wp/game-core';
import game, { settings } from '../src/index';
import { STATE_VERSION, migrateState, settingsOf, summarize, taskOf, type FermiState } from '../src/rules';

/** Envelopes written by the stateVersion 1 code (first guess → optional model → review), before the change of 2026-10-25. */
const fixture = (name: string): { stateVersion: number; settings: Record<string, string>; state: Record<string, unknown> } =>
  JSON.parse(readFileSync(`${__dirname}/fixtures/${name}.json`, 'utf8'));
const NAMES = ['v1-guided-estimate', 'v1-guided-model', 'v1-guided-summary', 'v1-free-estimate', 'v1-free-model'];

beforeAll(async () => {
  await game.preload!('en');
});

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

function load(name: string): FermiState {
  const result = interpretSave(fixture(name), game as GameModule<FermiState>);
  if (result.status !== 'ok') throw new Error(`${name}: ${JSON.stringify(result)}`);
  expect(result.migrated).toBe(true);
  expect(result.save.stateVersion).toBe(STATE_VERSION);
  return result.save.state;
}

function restore(state: FermiState) {
  const ctx = createTestContext(game as GameModule<unknown>, 'en');
  const finished: unknown[] = [];
  const instance = game.create({ ...ctx.context, finished: (r: unknown) => finished.push(r) }) as GameInstance<FermiState>;
  instance.restore(state);
  cleanup.push(() => instance.dispose());
  const q = (id: string) => ctx.context.root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  return { ctx, instance, q, finished, phase: () => ctx.context.root.querySelector('.wp-fermi-lab')!.getAttribute('data-phase') };
}

describe('stateVersion 1 saves (change 2026-10-25)', () => {
  it('stateVersion is 2; every v1 fixture loads, migrated, and renders without missing keys', () => {
    expect(game.metadata.stateVersion).toBe(2);
    for (const name of NAMES) {
      expect(fixture(name).stateVersion, name).toBe(1);
      const state = load(name);
      expect(state.v).toBe(2);
      const r = restore(state);
      expect(r.ctx.missingKeys, name).toEqual([]);
    }
  });

  it('guided, current question in the old first-guess step: opens in the guided model (the unsent draft is dropped)', () => {
    const old = fixture('v1-guided-estimate').state as unknown as FermiState;
    const state = load('v1-guided-estimate');
    expect(state.index).toBe(2);
    const q = state.questions[2]!;
    expect(q).toMatchObject({ phase: 'model', draft: '', firstGuess: null, answer: null, modelUsed: false });
    expect(q.factors.map((f) => f.ref)).toEqual(taskOf(q).factors.map((x) => x.id));
    // Earlier reviews are kept as they were; later questions open in the model too.
    expect(state.questions.slice(0, 2)).toEqual(old.questions.slice(0, 2));
    for (const later of state.questions.slice(3)) expect(later.phase).toBe('model');
    const r = restore(state);
    expect(r.phase()).toBe('model');
    expect(r.q('fl-est-input')).toBeNull();
  });

  it('guided, current question in the old model step: stays in the model with its typed values', () => {
    const old = fixture('v1-guided-model').state as unknown as FermiState;
    const state = load('v1-guided-model');
    const q = state.questions[2]!;
    expect(q.phase).toBe('model');
    expect(q.factors).toEqual(old.questions[2]!.factors);
    expect(q.firstGuess).toBeNull();
    const r = restore(state);
    const typed = q.factors.findIndex((f) => f.text !== '');
    expect((r.q(`fl-row-${typed}-input`) as HTMLInputElement).value).toBe(q.factors[typed]!.text);
    expect(r.q('fl-first-guess')).toBeNull();
  });

  it('free, current question in the old free model builder: finished with its first guess', () => {
    const old = fixture('v1-free-model').state as unknown as FermiState;
    const state = load('v1-free-model');
    const q = state.questions[1]!;
    expect(q).toMatchObject({ phase: 'review', answer: old.questions[1]!.firstGuess, modelUsed: false, factors: [] });
    // The question reviewed before (with an old free row) stays as it was and still renders.
    expect(state.questions[0]).toEqual(old.questions[0]);
    const r = restore(state);
    expect(r.phase()).toBe('review');
    expect(Number(r.q('fl-answer')!.dataset.value)).toBe(old.questions[1]!.firstGuess);
    expect(r.q('fl-compare')).not.toBeNull();
  });

  it('free estimate and finished summaries are unchanged (no second finished report)', () => {
    const fe = fixture('v1-free-estimate').state as unknown as FermiState;
    expect(load('v1-free-estimate')).toEqual({ ...fe, v: 2 });
    const r = restore(load('v1-free-estimate'));
    expect((r.q('fl-est-input') as HTMLInputElement).value).toBe(fe.questions[0]!.draft);
    const sum = load('v1-guided-summary');
    expect(sum.questions).toEqual((fixture('v1-guided-summary').state as unknown as FermiState).questions);
    expect(summarize(sum).rows).toHaveLength(5);
    const s = restore(sum);
    expect(s.phase()).toBe('summary');
    expect(s.finished).toHaveLength(0);
  });

  it('settings: the remembered model values keep their ids (old "free" builder → free estimate)', () => {
    expect(fixture('v1-free-model').settings.model).toBe('free');
    expect(settingsOf(load('v1-free-model')).model).toBe('free');
    expect(settingsOf(load('v1-guided-model')).model).toBe('guided');
    const spec = settings.find((x) => x.kind === 'choice' && x.id === 'model');
    expect(spec).toMatchObject({ values: ['guided', 'free'], default: 'guided' });
  });

  it('refuses a v1 save it cannot migrate, without throwing', () => {
    const broken = fixture('v1-guided-model');
    (broken.state.questions as unknown[])[0] = { taskId: 'future-task' };
    expect(interpretSave(broken, game as GameModule<FermiState>)).toMatchObject({ status: 'corrupt', reason: 'migration-failed' });
    expect(migrateState({ ...fixture('v1-free-model').state, model: 'auto' }, 1)).toBeUndefined();
  });
});
