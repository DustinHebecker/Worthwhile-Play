// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { PREFERENCES_KEY } from '../src/view';
import { isValidState, type TicTacToeState } from '../src/state';
import type { NestedState } from '../src/nested';
import type { OrderChaosState } from '../src/order-chaos';
import { nestedFromMoves } from '../src/nested';

let instances: GameInstance<TicTacToeState>[] = [];

function mount(preferences?: unknown) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, 'en');
  if (preferences !== undefined) ctx.preferences.set(PREFERENCES_KEY, preferences);
  const instance = game.create(ctx.context);
  instances.push(instance);
  const root = ctx.context.root;
  const q = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`)!;
  const select = (name: string, value: string) => {
    const el = q<HTMLSelectElement>(`option-${name}`);
    el.value = value;
    el.dispatchEvent(new Event('change'));
  };
  const key = (target: HTMLElement, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  return { ctx, instance, root, q, select, key };
}

afterEach(() => {
  for (const instance of instances) instance.dispose();
  instances = [];
});

describe('variant choice', () => {
  it('switches variants from the options, remembers the choice and keeps it for new games', () => {
    const { ctx, instance, q, select } = mount();
    instance.newGame({ seed: 4 });
    expect(instance.serialize().variant).toBe('classic');
    select('variant', 'nested');
    expect(instance.serialize().variant).toBe('nested');
    expect(q('overview')).not.toBeNull();
    expect(ctx.preferences.get(PREFERENCES_KEY)).toMatchObject({ variant: 'nested' });
    instance.newGame({ seed: 5 });
    expect(instance.serialize().variant).toBe('nested');
    select('variant', 'order-chaos');
    expect(q('oc-board')).not.toBeNull();
    expect(q('overview')).toBeNull();
    expect(q('variant-hint').textContent).toContain('exactly five');
  });

  it('starts with the remembered variant on a new device session', () => {
    const { instance, q } = mount({ variant: 'order-chaos', opponent: 'computer', role: 'chaos' });
    instance.newGame({ seed: 8 });
    const s = instance.serialize() as OrderChaosState;
    expect(s.variant).toBe('order-chaos');
    expect(s.role).toBe('chaos');
    // The computer plays Order and has opened.
    expect(s.moves).toHaveLength(1);
    expect(q('status').textContent).toBe('Your turn — you are Chaos: prevent every line of five.');
    expect(q<HTMLSelectElement>('option-role').closest('label')!.hidden).toBe(false);
    expect(q<HTMLSelectElement>('option-starter').closest('label')!.hidden).toBe(true);
  });

  it('restores each variant exactly, even when another variant is remembered', () => {
    const a = mount({ variant: 'nested' });
    a.instance.newGame({ seed: 12, difficulty: 'easy' });
    a.q('board-4').click();
    a.q('zoom-cell-2').click();
    const saved = a.instance.serialize();
    expect(saved.moves).toHaveLength(2);
    const b = mount({ variant: 'classic' });
    b.instance.restore(JSON.parse(JSON.stringify(saved)) as TicTacToeState);
    expect(b.instance.serialize()).toEqual(saved);
    expect(b.q('overview')).not.toBeNull();
    expect(b.q<HTMLSelectElement>('option-variant').value).toBe('nested');
  });
});

describe('board in board view', () => {
  it('opens the forced board automatically and marks it with an outline and text', () => {
    const { instance, q, select } = mount({ variant: 'nested', opponent: 'human' });
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    expect(q('status').textContent).toBe('X to move\nFree choice: play in any open small board.');
    q('board-0').click();
    expect(q('zoom-board').dataset.board).toBe('0');
    q('zoom-cell-5').click(); // X in board 0, cell 5 → O must play in board 5
    const s = instance.serialize() as NestedState;
    expect(s.moves).toEqual([5]);
    expect(q('zoom-board').dataset.board).toBe('5');
    expect(q('board-5').hasAttribute('data-target')).toBe(true);
    expect(q('board-5').getAttribute('aria-label')).toBe('Small board row 2, column 3: still open, the next move must be played here');
    expect(q('board-5').querySelector('.ttt-here')!.hasAttribute('hidden')).toBe(false);
    expect(q('status').textContent).toBe('O to move\nPlay in the small board in row 2, column 3.');
    expect(q('zoom-title').textContent).toBe('Play here: small board row 2, column 3');
    expect(q('mini-cell-5').dataset.mark).toBe('X');
  });

  it('lets the player look at another board without playing there', () => {
    const { instance, q, select } = mount({ variant: 'nested' });
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    q('board-0').click();
    q('zoom-cell-5').click();
    q('board-1').click();
    expect(q('zoom-board').dataset.board).toBe('1');
    expect(q('zoom-note').hidden).toBe(false);
    expect(q('zoom-cell-0').getAttribute('aria-disabled')).toBe('true');
    q('zoom-cell-0').click();
    expect(instance.serialize().moves).toEqual([5]);
  });

  it('plays against the computer, announces moves and saves after each turn', async () => {
    const { ctx, instance, q, root } = mount({ variant: 'nested' });
    instance.newGame({ seed: 3, difficulty: 'easy' });
    q('board-4').click();
    q('zoom-cell-4').click();
    const s = instance.serialize() as NestedState;
    expect(s.moves).toHaveLength(2);
    expect(s.moves[0]).toBe(40);
    expect(ctx.saveRequests()).toBe(1);
    expect(isValidState(s)).toBe(true);
    // The computer had to play in board 4; now the person is sent to the board of its cell.
    const forced = nestedFromMoves(s.moves).forced;
    expect(q('zoom-board').dataset.board).toBe(String(forced));
    await new Promise((r) => setTimeout(r, 50));
    expect(root.querySelector('[data-testid="announcer"]')!.textContent).toContain('X in small board row 2, column 2, cell row 2, column 2.');
  });

  it('keyboard: digits open a small board, Escape returns to the overview, arrows move', () => {
    const { instance, q, key } = mount({ variant: 'nested' });
    instance.newGame({ seed: 1 });
    key(q('zoom-cell-0'), '7');
    expect(q('zoom-board').dataset.board).toBe('6');
    expect(document.activeElement).toBe(q('zoom-cell-0'));
    key(q('zoom-cell-0'), 'ArrowRight');
    expect(document.activeElement).toBe(q('zoom-cell-1'));
    key(q('zoom-cell-1'), 'Escape');
    expect(document.activeElement).toBe(q('board-6'));
    key(q('board-6'), 'ArrowUp');
    expect(document.activeElement).toBe(q('board-3'));
  });

  it('reports the end of a game against another person once', () => {
    const { ctx, instance, q, select } = mount({ variant: 'nested' });
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    // Play the lowest legal cell until the game ends.
    for (let guard = 0; guard < 81 && ctx.results.length === 0; guard++) {
      const s = instance.serialize() as NestedState;
      const pos = nestedFromMoves(s.moves);
      const board = pos.forced ?? pos.claims.findIndex((c) => c === '');
      q(`board-${board}`).click();
      const cell = [...Array(9).keys()].find((i) => pos.cells[board * 9 + i] === '')!;
      q(`zoom-cell-${cell}`).click();
    }
    expect(ctx.results).toHaveLength(1);
    expect(['completed', 'draw']).toContain(ctx.results[0]!.outcome);
    expect(q('undo')).toHaveProperty('disabled', true);
  });
});

describe('Order & Chaos view', () => {
  it('places the chosen symbol, by button or keyboard shortcut', () => {
    const { instance, q, select, key } = mount({ variant: 'order-chaos' });
    instance.newGame({ seed: 2 });
    select('opponent', 'human');
    expect(q('symbol-X').getAttribute('aria-pressed')).toBe('true');
    q('symbol-O').click();
    expect(q('symbol-O').getAttribute('aria-pressed')).toBe('true');
    expect(q('symbol-X').getAttribute('aria-pressed')).toBe('false');
    q('oc-cell-7').click();
    expect((instance.serialize() as OrderChaosState).moves).toEqual([{ cell: 7, mark: 'O' }]);
    expect(q('status').textContent).toBe('Chaos to move');
    key(q('oc-cell-8'), 'x');
    expect((instance.serialize() as OrderChaosState).moves).toEqual([{ cell: 7, mark: 'O' }, { cell: 8, mark: 'X' }]);
    expect(q('symbol-X').getAttribute('aria-pressed')).toBe('true');
    q('oc-cell-8').click(); // occupied: ignored
    expect((instance.serialize() as OrderChaosState).moves).toHaveLength(2);
    q('undo').click();
    expect((instance.serialize() as OrderChaosState).moves).toHaveLength(1);
  });

  it('Order wins with exactly five, shown on the cells and reported once', () => {
    const { ctx, instance, q, select } = mount({ variant: 'order-chaos' });
    instance.newGame({ seed: 2 });
    select('opponent', 'human');
    for (const cell of [0, 30, 1, 31, 2, 32, 3, 33, 4]) q(`oc-cell-${cell}`).click();
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 9 } }]);
    for (const cell of [0, 1, 2, 3, 4]) expect(q(`oc-cell-${cell}`).hasAttribute('data-winning')).toBe(true);
    expect(q('status').textContent).toBe('Order wins: exactly five X in a row.');
    expect(q('oc-cell-20').getAttribute('aria-disabled')).toBe('true');
  });

  it('against the computer: the person’s role decides who opens, and the result is from the person’s view', () => {
    const { ctx, instance, q, select } = mount({ variant: 'order-chaos' });
    instance.newGame({ seed: 6, difficulty: 'easy' });
    select('role', 'order');
    expect((instance.serialize() as OrderChaosState).moves).toEqual([]);
    for (let guard = 0; guard < 36 && ctx.results.length === 0; guard++) {
      const s = instance.serialize() as OrderChaosState;
      const used = new Set(s.moves.map((m) => m.cell));
      const free = [...Array(36).keys()].find((i) => !used.has(i))!;
      q(`oc-cell-${free}`).click();
    }
    expect(ctx.results).toHaveLength(1);
    expect(['won', 'lost']).toContain(ctx.results[0]!.outcome);
  });
});
