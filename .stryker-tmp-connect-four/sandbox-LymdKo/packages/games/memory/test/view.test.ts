// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { isPair, partnerOf, type MemoryState } from '../src/rules';
import { renderSide } from '../src/view';

let running: GameInstance<MemoryState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function setup(seed = 11, difficulty?: string, locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame(difficulty === undefined ? { seed } : { seed, difficulty });
  return { ctx, instance, root: ctx.context.root };
}

const card = (root: HTMLElement, i: number) => root.querySelector<HTMLButtonElement>(`[data-testid="card-${i}"]`) as HTMLButtonElement;
const states = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-testid^="card-"]')].map((c) => c.dataset.state);
const continueButton = (root: HTMLElement) => root.querySelector<HTMLButtonElement>('[data-testid="memory-continue"]') as HTMLButtonElement;
const text = (root: HTMLElement, id: string) => root.querySelector(`[data-testid="${id}"]`)?.textContent;
const otherThan = (s: MemoryState, p: number) => s.cards.findIndex((_, i) => i !== p && !isPair(s.cards, p, i));

function mismatch(ctx: TestContext, instance: GameInstance<MemoryState>) {
  const s = instance.serialize();
  const b = otherThan(s, 0);
  card(ctx.context.root, 0).click();
  card(ctx.context.root, b).click();
  return b;
}

describe('Memory view', () => {
  it('renders a hidden board with accessible names and no leaked content', () => {
    const { root, instance } = setup();
    expect(states(root)).toEqual(new Array(12).fill('hidden'));
    expect(card(root, 4).getAttribute('aria-label')).toBe('Card 5, hidden');
    expect(root.querySelector('.wp-memory__symbol')).toBeNull();
    expect(root.textContent).not.toContain(instance.serialize().cards[0]?.item);
    expect(text(root, 'memory-moves')).toBe('Moves: 0');
    expect(text(root, 'memory-pairs')).toBe('Pairs: 0 of 6');
    expect(continueButton(root).hidden).toBe(true);
    expect(card(root, 0).tabIndex).toBe(0);
    expect(card(root, 1).tabIndex).toBe(-1);
  });

  it('uses the difficulty for board size and columns', () => {
    const { root } = setup(3, 'large');
    expect(states(root)).toHaveLength(24);
    const board = root.querySelector<HTMLElement>('[data-testid="memory-board"]');
    expect(board?.style.getPropertyValue('--wp-memory-columns')).toBe('4');
    expect(board?.getAttribute('aria-label')).toBe('Cards');
  });

  it('reveals a card with its translated description', () => {
    const { root, instance, ctx } = setup();
    card(root, 0).click();
    const s = instance.serialize();
    expect(s.revealed).toEqual([0]);
    expect(card(root, 0).dataset.state).toBe('revealed');
    const name = ctx.context.t(`symbol.${s.cards[0]?.item}`);
    expect(card(root, 0).getAttribute('aria-label')).toBe(`Card 1: ${name}`);
    expect(card(root, 0).querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(name);
    expect(text(root, 'memory-status')).toBe('Now turn over a second card.');
    expect(ctx.saveRequests()).toBeGreaterThanOrEqual(2);
  });

  it('keeps a found pair face up and marks it matched', () => {
    const { root, instance } = setup();
    const partner = partnerOf(instance.serialize().cards, 0);
    card(root, 0).click();
    card(root, partner).click();
    expect(card(root, 0).dataset.state).toBe('matched');
    expect(card(root, partner).dataset.state).toBe('matched');
    expect(card(root, 0).getAttribute('aria-disabled')).toBe('true');
    expect(card(root, 0).getAttribute('aria-label')).toMatch(/^Card 1: .+, pair found$/);
    expect(text(root, 'memory-moves')).toBe('Moves: 1');
    expect(text(root, 'memory-pairs')).toBe('Pairs: 1 of 6');
    expect(text(root, 'memory-status')).toBe('A pair! Both cards stay face up.');
  });

  it('leaves a mismatch visible without timers until the next action (Continue button)', async () => {
    const { root, instance, ctx } = setup();
    const b = mismatch(ctx, instance);
    await new Promise((r) => setTimeout(r, 50));
    expect(card(root, 0).dataset.state).toBe('revealed');
    expect(card(root, b).dataset.state).toBe('revealed');
    expect(continueButton(root).hidden).toBe(false);
    expect(text(root, 'memory-status')).toBe('Not a pair. Take a look, then continue.');
    const saves = ctx.saveRequests();
    continueButton(root).click();
    expect(states(root).every((st) => st === 'hidden')).toBe(true);
    expect(continueButton(root).hidden).toBe(true);
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(instance.serialize().moves).toBe(1);
  });

  it('clears a pending mismatch when tapping anywhere in the game or pressing Escape', () => {
    const { root, instance, ctx } = setup();
    mismatch(ctx, instance);
    (root.querySelector('[data-testid="memory-status"]') as HTMLElement).click();
    expect(instance.serialize().revealed).toEqual([]);

    mismatch(ctx, instance);
    card(root, 0).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(instance.serialize().revealed).toEqual([]);
  });

  it('tapping a hidden card during a mismatch hides the pair and turns that card over', () => {
    const { root, instance, ctx } = setup();
    const b = mismatch(ctx, instance);
    const c = [...Array(12).keys()].find((i) => i !== 0 && i !== b) as number;
    card(root, c).click();
    expect(instance.serialize().revealed).toEqual([c]);
    expect(card(root, 0).dataset.state).toBe('hidden');
    expect(card(root, c).dataset.state).toBe('revealed');
  });

  it('restores a pending mismatch exactly after reload', () => {
    const { instance, ctx } = setup();
    const b = mismatch(ctx, instance);
    const saved = JSON.parse(JSON.stringify(instance.serialize())) as MemoryState;
    instance.dispose();
    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    const root = ctx2.context.root;
    expect(card(root, 0).dataset.state).toBe('revealed');
    expect(card(root, b).dataset.state).toBe('revealed');
    expect(continueButton(root).hidden).toBe(false);
    expect(restored.serialize()).toEqual(saved);
    expect(ctx2.saveRequests()).toBe(0);
  });

  it('reports completion exactly once and not again on restore', () => {
    const { root, instance, ctx } = setup(5);
    const s = instance.serialize();
    const done = new Set<number>();
    for (let p = 0; p < s.cards.length; p++) {
      if (done.has(p)) continue;
      const q = partnerOf(s.cards, p);
      card(root, p).click();
      card(root, q).click();
      done.add(p).add(q);
    }
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 6 } }]);
    expect(text(root, 'memory-status')).toBe('All pairs found. Moves: 6');
    card(root, 0).click();
    expect(ctx.results).toHaveLength(1);

    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(instance.serialize());
    expect(ctx2.results).toEqual([]);
    expect(states(ctx2.context.root).every((st) => st === 'matched')).toBe(true);
  });

  it('ignores input while paused', () => {
    const { root, instance } = setup();
    instance.pause();
    card(root, 0).click();
    expect(instance.serialize().revealed).toEqual([]);
    instance.resume();
    card(root, 0).click();
    expect(instance.serialize().revealed).toEqual([0]);
  });

  it('supports arrow-key navigation with a roving tabindex', () => {
    const { root } = setup();
    card(root, 0).focus();
    card(root, 0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(card(root, 1));
    card(root, 1).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(card(root, 4));
    expect(card(root, 4).tabIndex).toBe(0);
  });

  it('lays out right-to-left for Arabic', () => {
    const { root } = setup(1, undefined, 'ar');
    expect(root.querySelector('.wp-memory')?.getAttribute('dir')).toBe('rtl');
    expect(card(root, 0).getAttribute('aria-label')).toBe('البطاقة 1، مقلوبة');
  });
});

describe('renderSide', () => {
  it('renders text with its language, images with alt and symbols as labelled images', () => {
    const textFace = renderSide({ text: 'chat', lang: 'fr' }, 'chat');
    expect(textFace.querySelector('.wp-memory__text')?.getAttribute('lang')).toBe('fr');
    expect(textFace.textContent).toBe('chat');
    const imageFace = renderSide({ image: 'cat.png', alt: 'a cat' }, 'a cat');
    expect(imageFace.querySelector('img')?.getAttribute('alt')).toBe('a cat');
    expect(imageFace.querySelector('img')?.getAttribute('src')).toBe('cat.png');
    const symbolFace = renderSide({ symbol: '🐢', alt: 'turtle' }, 'Schildkröte');
    expect(symbolFace.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Schildkröte');
    expect(renderSide({ audio: 'x.mp3' }, '').childElementCount).toBe(0);
  });
});
