// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { GameMetadata, GameModule } from '@wp/game-core';
import { createTestContext, runGameContract } from '../src';

/** A tiny counter game that renders its own messages, released early in English and German (ADR 0003 amendment). */
function counterGame(metadata: Partial<GameMetadata> = {}): GameModule<{ n: number }> {
  return {
    metadata: {
      id: 'counter-preview',
      stateVersion: 1,
      skills: ['attention'],
      typicalMinutes: [1, 2],
      inputMethods: ['pointer', 'keyboard'],
      capabilities: { offline: true, audio: 'none', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
      status: 'preview',
      locales: ['en', 'de'],
      messages: {
        en: { title: 'Counter', tagline: 'Count up', rules: 'Press the button.', add: 'Add one ({n})' },
        de: { title: 'Zähler', tagline: 'Hochzählen', rules: 'Drück den Knopf.', add: 'Eins dazu ({n})' }
      },
      ...metadata
    },
    isValidState: (value): value is { n: number } =>
      typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 1 && Number.isInteger((value as { n?: unknown }).n),
    create: (context) => {
      let state = { n: 0 };
      let start = { n: 0 };
      const render = () => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = context.t('add', { n: state.n });
        button.addEventListener('click', () => {
          state = { n: state.n + 1 };
          render();
          context.requestSave();
        });
        context.root.replaceChildren(button);
      };
      return {
        newGame: (options) => {
          state = { n: options.seed % 3 };
          start = state;
          render();
        },
        restore: (saved) => {
          state = { ...saved };
          render();
        },
        serialize: () => ({ ...state }),
        pause: () => undefined,
        resume: () => undefined,
        reset: () => {
          state = start;
          render();
        },
        dispose: () => context.root.replaceChildren()
      };
    }
  };
}

const click = (root: HTMLElement) => root.querySelector('button')!.click();

// `locales` defaults to `metadata.locales`: the suite passes although fr, ar … have no messages.
runGameContract(counterGame(), { interact: click });
// An explicit `locales` option still wins (here: German is half-translated, only English is checked).
runGameContract(counterGame({ id: 'counter-explicit', messages: { en: { title: 'Counter', tagline: 'Count up', rules: 'Press.', add: 'Add ({n})' }, de: { title: 'Zähler' } } }), { interact: click, locales: ['en'] });

describe('test context of a game shipping only some locales', () => {
  it('renders in English, without missing keys, in a locale the game does not ship (fr, ar)', () => {
    for (const locale of ['fr', 'ar'] as const) {
      const ctx = createTestContext(counterGame() as GameModule<unknown>, locale);
      expect(ctx.context.t.locale).toBe('en');
      expect(ctx.context.t.direction).toBe('ltr');
      expect(ctx.context.t('add', { n: 2 })).toBe('Add one (2)');
      expect(ctx.missingKeys).toEqual([]);
      ctx.context.root.remove();
    }
  });

  it('uses a shipped locale as it is', () => {
    const ctx = createTestContext(counterGame() as GameModule<unknown>, 'de');
    expect(ctx.context.t.locale).toBe('de');
    expect(ctx.context.t('title')).toBe('Zähler');
    ctx.context.root.remove();
  });

  it('keeps reporting missing keys for a game without `locales` (strict as before)', () => {
    const { locales: _locales, status: _status, ...rest } = counterGame().metadata;
    const ctx = createTestContext({ ...counterGame(), metadata: rest } as GameModule<unknown>, 'fr');
    expect(ctx.context.t.locale).toBe('fr');
    expect(ctx.context.t('title')).toBe('Counter');
    expect(ctx.missingKeys).toEqual(['title']);
    ctx.context.root.remove();
  });
});
