// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { COMPUTER_REVEAL_MS } from '../src/view';
import { isValidState, type ConnectFourState } from '../src/rules';

const STANDARD = { size: '7x6', connect: 4, pullOut: false };

/** A legal game that fills the board without any line of four. */
const DRAW_MOVES = [3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 6, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6];

let instances: GameInstance<ConnectFourState>[] = [];

function mount(options: { reducedMotion?: boolean; locale?: SupportedLocale; preferences?: Record<string, unknown> } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  for (const [k, v] of Object.entries(options.preferences ?? {})) ctx.preferences.set(k, v);
  const context = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const column = (c: number) => root.querySelector<HTMLButtonElement>(`[data-testid="column-${c}"]`)!;
  const cell = (r: number, c: number) => root.querySelector<HTMLElement>(`[data-testid="cell-${r}-${c}"]`)!;
  /** Board picture, top row first: '.', '1', '2'. */
  const picture = () => {
    const cols = root.querySelectorAll('[data-column]').length;
    const rows = root.querySelectorAll('[data-testid^="cell-"]').length / cols;
    return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => cell(r, c).dataset.disc || '.').join('')).join('/');
  };
  const status = () => root.querySelector('[data-testid="status"]')!.textContent;
  /** Like the host's start screen (ADR 0017): a new game with the current settings, one of them changed. */
  const select = (name: string, value: string) => {
    const s = instance.serialize();
    const settings: Record<string, string | number> = {
      opponent: s.opponent,
      starter: s.starter,
      size: s.variant.size,
      goal: s.variant.connect,
      rule: s.variant.pullOut ? 'pullOut' : 'classic'
    };
    if (name !== 'strength') settings[name] = value;
    instance.newGame({ seed: s.seed, difficulty: name === 'strength' ? value : s.difficulty, settings });
  };
  const button = (id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!;
  const play = (...cols: number[]) => cols.forEach((c) => column(c).click());
  const action = (value: 'drop' | 'pull') => {
    const input = root.querySelector<HTMLInputElement>(`[data-testid="action-${value}"]`)!;
    input.checked = true;
    input.dispatchEvent(new Event('change'));
  };
  const pull = (c: number) => {
    action('pull');
    column(c).click();
  };
  const key = (target: HTMLElement, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  return { ctx, instance, root, column, cell, picture, status, select, button, play, key, action, pull };
}

afterEach(() => {
  for (const instance of instances) instance.dispose();
  instances = [];
  vi.useRealTimers();
});

describe('four-in-a-row view', () => {
  it('renders seven column buttons holding 42 empty cells, with labels and a status', () => {
    const { instance, root, column, cell, status } = mount();
    instance.newGame({ seed: 1, difficulty: 'easy' });
    expect(root.querySelectorAll('[data-column]')).toHaveLength(7);
    expect(root.querySelectorAll('[data-testid^="cell-"]')).toHaveLength(42);
    expect(column(0).tagName).toBe('BUTTON');
    expect(cell(5, 6).dataset.disc).toBe('');
    expect(column(0).getAttribute('aria-label')).toBe('Column 1: empty.');
    expect(column(0).getAttribute('aria-disabled')).toBe('false');
    expect(status()).toBe('Your turn — you play the filled discs.');
    expect(column(3).tabIndex).toBe(0);
    expect(column(0).tabIndex).toBe(-1);
    expect(root.querySelector('[data-testid="board"]')!.getAttribute('role')).toBe('group');
  });

  it('drops the disc to the bottom and plays the computer’s reply in the same step', () => {
    const { ctx, instance, column, cell, picture } = mount();
    instance.newGame({ seed: 9, difficulty: 'medium' });
    column(0).click();
    const state = instance.serialize();
    expect(state.moves).toHaveLength(2);
    expect(state.moves[0]).toBe(0);
    expect(cell(5, 0).dataset.disc).toBe('1');
    expect(picture().split('').filter((c) => c === '1')).toHaveLength(1);
    expect(picture().split('').filter((c) => c === '2')).toHaveLength(1);
    expect(ctx.saveRequests()).toBe(1);
    expect(isValidState(state)).toBe(true);
    // The computer's disc is marked as the last move.
    const reply = state.moves[1]!;
    const replyRow = reply === 0 ? 4 : 5;
    expect(cell(replyRow, reply).dataset.disc).toBe('2');
    expect(cell(replyRow, reply).hasAttribute('data-last')).toBe(true);
    expect(cell(5, 0).hasAttribute('data-last')).toBe(false);
  });

  it('stacks discs in two-person mode and describes columns from the bottom', () => {
    const { instance, select, play, column, picture, status } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    expect(status()).toBe('Filled discs to move.');
    play(2, 2, 2);
    expect(picture()).toBe('......./......./......./..1..../..2..../..1....');
    expect(status()).toBe('Hollow discs to move.');
    expect(column(2).getAttribute('aria-label')).toBe('Column 3, from the bottom: filled, hollow, filled.');
  });

  it('ignores a full column and says so', () => {
    vi.useFakeTimers();
    const { ctx, instance, select, play, column, root } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    play(0, 0, 0, 0, 0, 0);
    expect(column(0).getAttribute('aria-disabled')).toBe('true');
    expect(column(0).getAttribute('aria-label')).toBe('Column 1 (full), from the bottom: filled, hollow, filled, hollow, filled, hollow.');
    const before = instance.serialize();
    const saves = ctx.saveRequests();
    column(0).click();
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(saves);
    vi.runAllTimers();
    expect(root.querySelector('[data-testid="announcer"]')!.textContent).toBe('Column 1 is full — choose another column.');
  });

  it('supports undo of single moves between two people', () => {
    const { instance, select, play, button, cell, status } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    expect(button('undo').disabled).toBe(true);
    play(3, 4);
    expect(button('undo').disabled).toBe(false);
    button('undo').click();
    expect(instance.serialize().moves).toEqual([3]);
    expect(cell(5, 4).dataset.disc).toBe('');
    expect(status()).toBe('Hollow discs to move.');
  });

  it('highlights the winning four with more than colour and reports the result once', () => {
    const { ctx, instance, select, play, cell, column, status, button, root } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    play(0, 0, 1, 1, 2, 2, 3);
    expect(status()).toBe('The filled discs win with four in a row.');
    for (const c of [0, 1, 2, 3]) {
      expect(cell(5, c).hasAttribute('data-winning')).toBe(true);
      expect(cell(5, c).classList.contains('is-winning')).toBe(true);
    }
    expect(cell(4, 0).hasAttribute('data-winning')).toBe(false);
    expect(column(0).getAttribute('aria-label')).toBe('Column 1, from the bottom: filled (part of the winning line), hollow.');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 7 } }]);
    expect(button('undo').disabled).toBe(true);
    expect(column(5).getAttribute('aria-disabled')).toBe('true');
    expect(root.querySelector<HTMLElement>('.c4-status-disc')!.dataset.player).toBe('1');
    // Further clicks do nothing.
    column(5).click();
    expect(instance.serialize().moves).toHaveLength(7);

    // Restoring a finished game re-renders it without reporting it again.
    const saved = instance.serialize();
    const other = mount();
    other.instance.restore(saved);
    expect(other.status()).toBe('The filled discs win with four in a row.');
    expect(other.cell(5, 3).hasAttribute('data-winning')).toBe(true);
    expect(other.ctx.results).toEqual([]);
  });

  it('reports a draw when the board is full', () => {
    const { ctx, instance, select, play, status, root } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    play(...DRAW_MOVES);
    expect(status()).toBe('Draw — the board is full.');
    expect(ctx.results).toEqual([{ outcome: 'draw', stats: { moves: 42 } }]);
    expect(root.querySelector<HTMLElement>('.c4-status-disc')!.hidden).toBe(true);
    expect(root.querySelectorAll('[data-winning]')).toHaveLength(0);
  });

  it('reports a loss against the computer from the person’s perspective', () => {
    const { ctx, instance, column, status } = mount();
    instance.newGame({ seed: 3, difficulty: 'hard' });
    // Keep dropping into the leftmost open column; the hard computer wins this.
    for (let guard = 0; guard < 21 && ctx.results.length === 0; guard++) {
      const open = [0, 1, 2, 3, 4, 5, 6].find((c) => column(c).getAttribute('aria-disabled') === 'false')!;
      column(open).click();
    }
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]!.outcome).toBe('lost');
    expect(status()).toBe('The computer got four in a row.');
  }, 30_000);

  it('lets the computer open when it starts; undo takes back a move pair', () => {
    const { instance, select, button, status, column } = mount();
    instance.newGame({ seed: 11, difficulty: 'easy' });
    select('starter', 'computer');
    const opened = instance.serialize();
    expect(opened.starter).toBe('computer');
    expect(opened.moves).toHaveLength(1);
    expect(status()).toBe('Your turn — you play the hollow discs.');
    expect(button('undo').disabled).toBe(true);
    column(0).click();
    expect(instance.serialize().moves).toHaveLength(3);
    button('undo').click();
    expect(instance.serialize().moves).toEqual(opened.moves);
  });

  it('starts a fresh seeded round when options change, keeping them in the state', () => {
    const { instance, column, select, button, root } = mount();
    instance.newGame({ seed: 21, difficulty: 'easy' });
    column(3).click();
    select('strength', 'hard');
    expect(instance.serialize()).toEqual({ seed: 21, difficulty: 'hard', opponent: 'computer', starter: 'human', variant: STANDARD, moves: [], rng: 21 });
    column(3).click();
    button('restart').click();
    expect(instance.serialize().moves).toEqual([]);
    expect(instance.serialize().difficulty).toBe('hard');
    // The options live only on the host's start screen (ADR 0017).
    expect(root.querySelector('select, [data-testid^="option-"]')).toBeNull();
  });

  it('reset returns to the seeded start; newGame takes the start-screen settings, defaults for invalid ones', () => {
    const { instance, column, select } = mount();
    instance.newGame({ seed: 2, difficulty: 'medium' });
    select('opponent', 'human');
    const start = instance.serialize();
    column(0).click();
    instance.reset();
    expect(instance.serialize()).toEqual(start);
    instance.newGame({ seed: 3, difficulty: 'nonsense', settings: { opponent: 'human', size: '10x10', goal: 6, rule: 'nope' } });
    expect(instance.serialize()).toEqual({ seed: 3, difficulty: 'easy', opponent: 'human', starter: 'human', variant: STANDARD, moves: [], rng: 3 });
    instance.newGame({ seed: 4 });
    expect(instance.serialize()).toEqual({ seed: 4, difficulty: 'easy', opponent: 'computer', starter: 'human', variant: STANDARD, moves: [], rng: 4 });
  });

  it('delays only the drawing of the computer’s reply; the logical state is complete at once', () => {
    vi.useFakeTimers();
    const { instance, column, picture, status, button, root } = mount({ reducedMotion: false });
    instance.newGame({ seed: 4, difficulty: 'medium' });
    column(3).click();
    const state = instance.serialize();
    expect(state.moves).toHaveLength(2);
    expect(isValidState(state)).toBe(true);
    expect(picture().replace(/[^12]/g, '')).toBe('1');
    expect(status()).toBe('Thinking…');
    expect(button('undo').disabled).toBe(true);
    expect(root.querySelector('[data-testid="board"]')!.getAttribute('aria-busy')).toBe('true');
    expect(column(0).getAttribute('aria-disabled')).toBe('true');
    // Input is ignored while the reply is being revealed.
    column(0).click();
    expect(instance.serialize()).toEqual(state);
    vi.advanceTimersByTime(COMPUTER_REVEAL_MS);
    expect(picture().replace(/[^12]/g, '').split('').sort().join('')).toBe('12');
    expect(status()).toBe('Your turn — you play the filled discs.');
  });

  it('pause shows the full state immediately', () => {
    vi.useFakeTimers();
    const { instance, column, picture } = mount({ reducedMotion: false });
    instance.newGame({ seed: 4 });
    column(3).click();
    expect(picture().replace(/[^12]/g, '')).toHaveLength(1);
    instance.pause();
    expect(picture().replace(/[^12]/g, '')).toHaveLength(2);
    instance.resume();
    vi.runAllTimers();
    expect(picture().replace(/[^12]/g, '')).toHaveLength(2);
  });

  it('announces moves through a polite live region', () => {
    vi.useFakeTimers();
    const { instance, select, column, root } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    column(3).click();
    vi.runAllTimers();
    const live = root.querySelector('[data-testid="announcer"]')!;
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('Filled disc in column 4. Hollow discs to move.');
  });

  it('moves between columns with the arrow keys (roving tabindex)', () => {
    const { instance, column, key } = mount();
    instance.newGame({ seed: 1 });
    column(3).focus();
    key(column(3), 'ArrowRight');
    expect(document.activeElement).toBe(column(4));
    expect(column(4).tabIndex).toBe(0);
    expect(column(3).tabIndex).toBe(-1);
    key(column(4), 'ArrowLeft');
    key(column(3), 'ArrowLeft');
    expect(document.activeElement).toBe(column(2));
    key(column(2), 'End');
    expect(document.activeElement).toBe(column(6));
    key(column(6), 'ArrowRight');
    expect(document.activeElement).toBe(column(6));
    key(column(6), 'Home');
    expect(document.activeElement).toBe(column(0));
    key(column(0), 'ArrowLeft');
    expect(document.activeElement).toBe(column(0));
    // Other keys are left alone (Enter/Space activate the focused column button natively).
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    column(0).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('mirrors the board and arrow keys in right-to-left locales', () => {
    const { instance, root, column, key, status } = mount({ locale: 'ar' });
    instance.newGame({ seed: 1 });
    expect(root.querySelector('.wp-connect-four')!.getAttribute('dir')).toBe('rtl');
    expect(status()).toBe('دورك — أنت تلعب بالأقراص المصمتة.');
    column(3).focus();
    key(column(3), 'ArrowRight');
    expect(document.activeElement).toBe(column(2));
    key(column(2), 'ArrowLeft');
    key(column(3), 'ArrowLeft');
    expect(document.activeElement).toBe(column(4));
  });

  it('restores a mid-game state exactly', () => {
    const { instance, column, picture } = mount();
    instance.newGame({ seed: 8, difficulty: 'easy' });
    column(3).click();
    column(3).click();
    const saved = instance.serialize();
    const other = mount();
    other.instance.restore(saved);
    expect(other.instance.serialize()).toEqual(saved);
    expect(other.picture()).toBe(picture());
    expect(other.root.querySelectorAll('[data-last]')).toHaveLength(1);
  });
});

describe('variants: board size, goal and the pull-out rule', () => {
  const human = (m: ReturnType<typeof mount>) => m.select('opponent', 'human');

  it('declares the variant as start-screen settings and rebuilds the board for a new size', () => {
    expect(game.settings).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'size', values: ['7x6', '8x7', '9x7'] })]));
    const m = mount();
    m.instance.newGame({ seed: 5 });
    m.select('size', '9x7');
    m.select('goal', '5');
    expect(m.root.querySelectorAll('[data-column]')).toHaveLength(9);
    expect(m.root.querySelectorAll('[data-testid^="cell-"]')).toHaveLength(63);
    expect(m.root.querySelector('[data-testid="board"]')!.getAttribute('aria-label')).toBe('Board with 9 columns and 7 rows');
    expect(m.column(4).tabIndex).toBe(0);
    expect(m.instance.serialize().variant).toEqual({ size: '9x7', connect: 5, pullOut: false });
    m.column(8).click();
    expect(m.cell(6, 8).dataset.disc).toBe('1');
    // Back to the standard size.
    m.select('size', '7x6');
    expect(m.root.querySelectorAll('[data-testid^="cell-"]')).toHaveLength(42);
  });

  it('starts with the chosen variant and ignores invalid settings', () => {
    const chosen = mount();
    chosen.instance.newGame({ seed: 1, settings: { size: '8x7', goal: 4, rule: 'pullOut' } });
    expect(chosen.instance.serialize().variant).toEqual({ size: '8x7', connect: 4, pullOut: true });
    expect(chosen.root.querySelectorAll('[data-column]')).toHaveLength(8);
    const broken = mount();
    broken.instance.newGame({ seed: 1, settings: { size: '10x10', goal: '9', rule: 1 } });
    expect(broken.instance.serialize().variant).toEqual(STANDARD);
  });

  it('needs five in a row on 9 × 7 when the goal is five', () => {
    const m = mount();
    m.instance.newGame({ seed: 1 });
    human(m);
    m.select('size', '9x7');
    m.select('goal', '5');
    m.play(0, 0, 1, 1, 2, 2, 3, 3);
    expect(m.ctx.results).toEqual([]);
    expect(m.status()).toBe('Filled discs to move.');
    m.play(4);
    expect(m.status()).toBe('The filled discs win with five in a row.');
    for (const c of [0, 1, 2, 3, 4]) expect(m.cell(6, c).hasAttribute('data-winning')).toBe(true);
    expect(m.ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 9 } }]);
  });

  it('pulls one of your own bottom discs out by choosing "pull out", then a column', () => {
    vi.useFakeTimers();
    const m = mount();
    m.instance.newGame({ seed: 1 });
    human(m);
    const choice = m.root.querySelector<HTMLElement>('[data-testid="action-choice"]')!;
    const help = m.root.querySelector<HTMLElement>('[data-testid="help"]')!;
    expect(choice.hidden).toBe(true);
    expect(help.hidden).toBe(true);
    m.select('rule', 'pullOut');
    expect(choice.hidden).toBe(false);
    expect(choice.tagName).toBe('FIELDSET');
    expect(help.hidden).toBe(false);
    expect(help.textContent).toContain('after 168 moves');
    // No disc yet: nothing can be pulled.
    expect(m.root.querySelector<HTMLInputElement>('[data-testid="action-pull"]')!.disabled).toBe(true);
    m.play(0, 0, 1);
    // Hollow to move: its only bottom disc… there is none (column 0 bottom is filled).
    expect(m.root.querySelector<HTMLInputElement>('[data-testid="action-pull"]')!.disabled).toBe(true);
    m.play(2);
    m.action('pull');
    expect(m.root.querySelector('.wp-connect-four')!.getAttribute('data-action')).toBe('pull');
    // Filled to move: bottom discs of columns 1 and 2 (0-based 0 and 1) are filled.
    expect(m.column(0).getAttribute('aria-disabled')).toBe('false');
    expect(m.column(1).getAttribute('aria-disabled')).toBe('false');
    expect(m.column(2).getAttribute('aria-disabled')).toBe('true');
    expect(m.column(3).getAttribute('aria-disabled')).toBe('true');
    expect(m.cell(5, 0).hasAttribute('data-pullable')).toBe(true);
    expect(m.cell(5, 2).hasAttribute('data-pullable')).toBe(false);
    expect(m.column(0).getAttribute('aria-label')).toBe('Column 1: pull out your bottom disc. From the bottom: filled, hollow.');
    // A column without an own bottom disc only explains why.
    m.column(2).click();
    vi.runAllTimers();
    expect(m.root.querySelector('[data-testid="announcer"]')!.textContent).toBe(
      'Column 3 has none of your discs at the bottom — choose another column or drop a disc.'
    );
    expect(m.instance.serialize().moves).toEqual([0, 0, 1, 2]);
    m.column(0).click();
    expect(m.instance.serialize().moves).toEqual([0, 0, 1, 2, -1]);
    expect(m.picture().split('/').slice(4).join('/')).toBe('......./212....');
    expect(m.cell(5, 0).dataset.disc).toBe('2');
    expect(m.root.querySelectorAll('[data-pullable]')).toHaveLength(0);
    // Back to dropping after every move.
    expect(m.root.querySelector<HTMLInputElement>('[data-testid="action-drop"]')!.checked).toBe(true);
    vi.runAllTimers();
    expect(m.root.querySelector('[data-testid="announcer"]')!.textContent).toBe(
      'Filled disc pulled out of column 1; the discs above fell down. Hollow discs to move.'
    );
    expect(isValidState(m.instance.serialize())).toBe(true);
  });

  it('lets the computer answer a pull-out and restores a pull-out game exactly', () => {
    const m = mount();
    m.instance.newGame({ seed: 12, difficulty: 'medium', settings: { rule: 'pullOut' } });
    m.play(3);
    m.pull(3);
    const saved = m.instance.serialize();
    expect(saved.moves[2]).toBe(-4);
    expect(saved.moves).toHaveLength(4);
    const other = mount();
    other.instance.restore(saved);
    expect(other.instance.serialize()).toEqual(saved);
    expect(other.picture()).toBe(m.picture());
    expect(other.root.querySelector<HTMLElement>('[data-testid="help"]')!.hidden).toBe(false);
  });

  it('calls the third repetition of a position a draw', () => {
    const m = mount();
    m.instance.newGame({ seed: 1 });
    human(m);
    m.select('rule', 'pullOut');
    for (let round = 0; round < 2; round++) {
      m.play(0, 1);
      m.pull(0);
      m.pull(1);
    }
    expect(m.status()).toBe('Draw — the same position has come up for the third time.');
    expect(m.ctx.results).toEqual([{ outcome: 'draw', stats: { moves: 8 } }]);
    expect(m.root.querySelector<HTMLElement>('[data-testid="action-choice"]')!.hidden).toBe(true);
  });
});

