// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { COMPUTER_REVEAL_MS, figurine } from '../src/view';
import { createGame, isValidState, legalMoves, moveToUci, parseFen, puzzlesFor, type ChessState } from '../src/rules';

let instances: GameInstance<ChessState>[] = [];

function mount(options: { reducedMotion?: boolean } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, 'en');
  const context = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const sq = (name: string) => root.querySelector<HTMLButtonElement>(`[data-testid="sq-${name}"]`)!;
  const byId = <T extends HTMLElement = HTMLButtonElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`)!;
  const tap = (...names: string[]) => names.forEach((n) => sq(n).click());
  const status = () => byId('status').textContent;
  const plies = () => [...root.querySelectorAll('[data-testid^="ply-"]')].map((el) => el.textContent);
  return { ctx, instance, root, sq, byId, tap, status, plies };
}

const humanGame = (extra: Partial<ChessState> = {}): ChessState => ({
  ...createGame({ seed: 3, difficulty: 'beginner', opponent: 'human', humanColor: 'w' }),
  ...extra
});

afterEach(() => {
  for (const instance of instances) instance.dispose();
  instances = [];
  vi.useRealTimers();
});

describe('chess view', () => {
  it('renders 64 labelled squares in white’s orientation with the start position', () => {
    const { instance, root, sq, status, byId } = mount();
    instance.newGame({ seed: 1, difficulty: 'beginner' });
    const squares = root.querySelectorAll('[data-testid^="sq-"]');
    expect(squares).toHaveLength(64);
    expect(byId('board').firstElementChild?.getAttribute('data-square')).toBe('a8');
    expect(byId('board').lastElementChild?.getAttribute('data-square')).toBe('h1');
    expect(sq('e1').dataset.piece).toBe('wK');
    expect(sq('d8').dataset.piece).toBe('bQ');
    expect(sq('e4').dataset.piece).toBe('');
    expect(sq('e2').getAttribute('aria-label')).toBe('e2, Pawn, White');
    expect(sq('e4').getAttribute('aria-label')).toBe('e4, empty');
    expect(status()).toBe('Your move — you play White.');
    expect(byId('board').getAttribute('dir')).toBe('ltr');
    expect([...squares].filter((s) => (s as HTMLElement).tabIndex === 0)).toHaveLength(1);
  });

  it('selects a piece, marks its targets, and plays the move with the computer’s reply in one step', () => {
    const { ctx, instance, sq, tap, plies, byId } = mount();
    instance.newGame({ seed: 1, difficulty: 'beginner' });
    tap('e2');
    expect(sq('e2').hasAttribute('data-selected')).toBe(true);
    expect(sq('e2').getAttribute('aria-pressed')).toBe('true');
    expect(sq('e3').dataset.target).toBe('move');
    expect(sq('e4').dataset.target).toBe('move');
    expect(sq('e4').getAttribute('aria-label')).toBe('e4, empty, possible move');
    expect(sq('d3').dataset.target).toBe('');
    tap('e4');
    expect(sq('e4').dataset.piece).toBe('wP');
    expect(sq('e4').hasAttribute('data-last')).toBe(false); // the computer moved last
    expect(plies()).toHaveLength(2);
    expect(plies()[0]).toBe('e4');
    expect(instance.serialize().moves).toHaveLength(2);
    expect(isValidState(instance.serialize())).toBe(true);
    expect(ctx.saveRequests()).toBeGreaterThan(0);
    expect(byId('undo').disabled).toBe(false);
  });

  it('ignores taps on empty squares, opponent pieces and illegal targets', () => {
    const { instance, sq, tap } = mount();
    instance.newGame({ seed: 1 });
    tap('e5');
    tap('e7');
    expect(sq('e7').hasAttribute('data-selected')).toBe(false);
    tap('e2', 'e5');
    expect(instance.serialize().moves).toEqual([]);
    expect(sq('e2').hasAttribute('data-selected')).toBe(false);
    // Re-tapping the selected piece deselects it.
    tap('g1', 'g1');
    expect(sq('g1').hasAttribute('data-selected')).toBe(false);
  });

  it('plays a two-person game to checkmate and reports it exactly once', () => {
    const { ctx, instance, tap, status, sq, plies } = mount();
    instance.restore(humanGame());
    tap('f2', 'f3', 'e7', 'e5', 'g2', 'g4', 'd8', 'h4');
    expect(status()).toBe('Checkmate — Black wins.');
    expect(sq('e1').hasAttribute('data-check')).toBe(true);
    expect(sq('e1').getAttribute('aria-label')).toContain('in check');
    expect(plies()).toEqual(['f3', 'e5', 'g4', '♕h4#']);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 2 } }]);
    // Restoring a finished game does not report again.
    instance.restore(instance.serialize());
    expect(ctx.results).toHaveLength(1);
  });

  it('reports a win against the computer', () => {
    const { ctx, instance, tap, status } = mount();
    instance.restore({ ...humanGame({ opponent: 'computer', start: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1' }) });
    tap('a1', 'a8');
    expect(status()).toBe('Checkmate — White wins.');
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { moves: 1 } }]);
  });

  it('asks which piece to promote to, with cancel', () => {
    const { instance, tap, byId, sq } = mount();
    instance.restore(humanGame({ start: '8/P6k/8/8/8/8/8/K7 w - - 0 1' }));
    tap('a7', 'a8');
    expect(byId('promotion').hidden).toBe(false);
    expect(document.activeElement).toBe(byId('promote-q'));
    byId('promote-cancel').click();
    expect(byId('promotion').hidden).toBe(true);
    expect(instance.serialize().moves).toEqual([]);
    tap('a7', 'a8');
    byId('promotion').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(byId('promotion').hidden).toBe(true);
    tap('a7', 'a8');
    byId('promote-n').click();
    expect(instance.serialize().moves).toEqual(['a7a8n']);
    expect(sq('a8').dataset.piece).toBe('wN');
  });

  it('undoes a full turn against the computer and one move between people', () => {
    const vs = mount();
    vs.instance.newGame({ seed: 4 });
    vs.tap('d2', 'd4');
    expect(vs.instance.serialize().moves).toHaveLength(2);
    vs.byId('undo').click();
    expect(vs.instance.serialize().moves).toEqual([]);
    expect(vs.byId('undo').disabled).toBe(true);

    const two = mount();
    two.instance.restore(humanGame());
    two.tap('d2', 'd4', 'd7', 'd5');
    two.byId('undo').click();
    expect(two.instance.serialize().moves).toEqual(['d2d4']);
    expect(two.status()).toBe('Black to move.');
  });

  it('resigns only after confirmation', () => {
    const { ctx, instance, byId, status } = mount();
    instance.newGame({ seed: 2 });
    byId('resign').click();
    expect(byId('resign-yes').closest('[role="group"]')!.hasAttribute('hidden')).toBe(false);
    byId('resign-no').click();
    expect(instance.serialize().resigned).toBe('');
    byId('resign').click();
    byId('resign-yes').click();
    expect(instance.serialize().resigned).toBe('w');
    expect(status()).toBe('White resigned — Black wins.');
    expect(ctx.results).toEqual([{ outcome: 'lost', stats: { moves: 0 } }]);
    expect(byId('resign').disabled).toBe(true);
  });

  it('flips the board and supports arrow-key navigation', () => {
    const { instance, byId, sq } = mount();
    instance.newGame({ seed: 1 });
    sq('e2').focus();
    sq('e2').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(sq('e3'));
    sq('e3').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(sq('f3'));
    byId('flip').click();
    expect(byId('board').firstElementChild?.getAttribute('data-square')).toBe('h1');
    expect(byId('board').lastElementChild?.getAttribute('data-square')).toBe('a8');
  });

  it('starts new games from the menu above the board (computer moves first when the person plays black)', () => {
    const { instance, byId, root, plies, status } = mount();
    instance.newGame({ seed: 9, difficulty: 'intermediate' });
    const container = root.querySelector('.wp-chess')!;
    // The menu comes before the board and shows the running game as current.
    expect(container.firstElementChild).toBe(byId('menu'));
    expect(byId<HTMLInputElement>('mode-computer').checked).toBe(true);
    expect(byId('current-computer').hidden).toBe(false);
    expect(byId('current-human').hidden).toBe(true);
    // The host's difficulty is the preselected strength.
    expect(byId<HTMLInputElement>('strength-intermediate').checked).toBe(true);
    expect(byId('menu-strength').hidden).toBe(false);
    expect(byId('menu-mate').hidden).toBe(true);
    byId('color-b').click();
    byId('start').click();
    expect(instance.serialize().humanColor).toBe('b');
    expect(instance.serialize().difficulty).toBe('intermediate');
    expect(plies()).toHaveLength(1);
    expect(status()).toBe('Your move — you play Black.');
    expect(byId('board').firstElementChild?.getAttribute('data-square')).toBe('h1');
    // Only the computer's opening move so far: no confirmation needed.
    byId('mode-human').click();
    expect(byId('menu-color').hidden).toBe(true);
    expect(byId('menu-strength').hidden).toBe(true);
    // Choosing alone does not start anything.
    expect(instance.serialize().opponent).toBe('computer');
    expect(byId('current-computer').hidden).toBe(false);
    byId('start').click();
    expect(byId('start-confirm').hidden).toBe(true);
    expect(instance.serialize().opponent).toBe('human');
    expect(byId('current-human').hidden).toBe(false);
    expect(byId('current-computer').hidden).toBe(true);
    expect(byId('why').hidden).toBe(true);
    expect(byId('mode').textContent).toBe('Two players on this device.');
    // The host's "new game" keeps opponent and colour and sets the strength.
    instance.newGame({ seed: 10, difficulty: 'strong' });
    expect(instance.serialize()).toMatchObject({ opponent: 'human', difficulty: 'strong', moves: [] });
    expect(byId<HTMLInputElement>('strength-strong').checked).toBe(true);
  });

  it('reports a strength chosen in the menu to the host and remembers the menu choice across instances', () => {
    const first = mount();
    first.instance.newGame({ seed: 9, difficulty: 'beginner' });
    first.byId('strength-strong').click();
    first.byId('color-b').click();
    first.byId('start').click();
    expect(first.ctx.difficulties).toEqual(['strong']);
    expect(first.ctx.preferences.get('menu')).toEqual({ opponent: 'computer', humanColor: 'b', mode: 'play', mateN: first.instance.serialize().mateN });
    // Two players: no strength is reported.
    first.byId('mode-human').click();
    first.byId('start').click();
    if (!first.byId('start-confirm').hidden) first.byId('start-yes').click();
    expect(first.ctx.difficulties).toEqual(['strong']);
    // A fresh instance (e.g. after a reload) on the same device starts the remembered kind of game.
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    for (const [k, v] of first.ctx.preferences) ctx.preferences.set(k, v);
    const second = game.create({ ...ctx.context, preferences: { get: (k) => ctx.preferences.get(k), set: (k, v) => void ctx.preferences.set(k, v) } });
    instances.push(second);
    second.newGame({ seed: 3, difficulty: 'beginner' });
    expect(second.serialize()).toMatchObject({ opponent: 'human', humanColor: 'b', mode: 'play' });
    // Unexpected stored values are ignored.
    const odd = createTestContext(game as GameModule<unknown>, 'en');
    const third = game.create({ ...odd.context, preferences: { get: () => ({ opponent: 'robot', humanColor: 7, mode: 'x', mateN: 9 }), set: () => undefined } });
    instances.push(third);
    third.newGame({ seed: 3, difficulty: 'beginner' });
    expect(third.serialize()).toMatchObject({ opponent: 'computer', humanColor: 'w', mode: 'play' });
  });

  it('asks before a running game with own moves is replaced, and keeps it on “keep playing”', () => {
    const { ctx, instance, byId, tap } = mount();
    instance.newGame({ seed: 3 });
    tap('e2', 'e4');
    const before = instance.serialize();
    byId('mode-mate').click();
    expect(byId('menu-mate').hidden).toBe(false);
    byId('mate-2').click();
    byId('start').click();
    expect(byId('start-confirm').hidden).toBe(false);
    expect(byId('start').hidden).toBe(true);
    expect(document.activeElement).toBe(byId('start-yes'));
    expect(instance.serialize()).toEqual(before);
    byId('start-no').click();
    expect(byId('start-confirm').hidden).toBe(true);
    expect(document.activeElement).toBe(byId('start'));
    expect(instance.serialize()).toEqual(before);
    // Escape also keeps the game.
    byId('start').click();
    byId('start-yes').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(byId('start-confirm').hidden).toBe(true);
    expect(instance.serialize()).toEqual(before);
    // Changing the choice closes an open question.
    byId('start').click();
    byId('mate-3').click();
    expect(byId('start-confirm').hidden).toBe(true);
    byId('start').click();
    byId('start-yes').click();
    expect(instance.serialize()).toMatchObject({ mode: 'mate', mateN: 3, moves: [] });
    expect(byId('current-mate').hidden).toBe(false);
    expect(byId<HTMLInputElement>('mate-3').checked).toBe(true);
    expect(byId('mode').textContent).toMatch(/^Mate in \(moves\): 3 — Puzzle \d+ of \d+$/);
    expect(document.activeElement?.getAttribute('data-square')).toBeTruthy();
    expect(ctx.results).toEqual([]);
  });

  it('starts directly when the game is over or untouched, and uses native radio groups for the keyboard', () => {
    const { instance, byId, root } = mount();
    instance.restore({ ...humanGame({ opponent: 'computer', start: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', moves: ['a1a8'] }) });
    byId('mode-best').click();
    expect(byId('menu-color').hidden).toBe(true);
    expect(byId('menu-mate').hidden).toBe(true);
    byId('start').click();
    expect(byId('start-confirm').hidden).toBe(true);
    expect(instance.serialize().mode).toBe('best');
    // Each group is one radio group (one tab stop, arrow keys handled by the browser) with a legend.
    for (const name of ['mode', 'strength', 'color', 'mate']) {
      const group = byId(`menu-${name}`);
      expect(group.tagName).toBe('FIELDSET');
      expect(group.querySelector('legend')!.textContent).not.toBe('');
      const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
      expect(radios.length).toBeGreaterThan(1);
      expect(new Set(radios.map((r) => r.name)).size).toBe(1);
      expect(radios.filter((r) => r.checked)).toHaveLength(1);
    }
    expect(byId('menu-mode').textContent).toContain('Against the computer');
    // Two boards on one page do not share radio groups.
    const other = mount();
    expect(other.byId<HTMLInputElement>('mode-computer').name).not.toBe(byId<HTMLInputElement>('mode-computer').name);
    // The old collapsed settings panel is gone.
    expect(root.querySelector('details')).toBeNull();
  });

  it('explains the computer’s move and gives hints on request', () => {
    const { instance, byId, tap, root } = mount();
    instance.newGame({ seed: 1 });
    expect(byId('why').disabled).toBe(true);
    tap('e2', 'e4');
    byId('why').click();
    expect(byId('explanation').hidden).toBe(false);
    expect(byId('explanation').textContent).toMatch(/^Why the computer played/);
    expect(byId('explanation').querySelectorAll('li').length).toBeGreaterThan(0);
    byId('hint').click();
    expect(byId('explanation').textContent).toMatch(/^Suggestion: /);
    expect(root.querySelectorAll('[data-hint]')).toHaveLength(2);
    // Moving clears the hint.
    tap('g1', 'f3');
    expect(byId('explanation').hidden).toBe(true);
  });

  it('draws the person’s move first and reveals the reply after a pause; closing never loses a move', () => {
    vi.useFakeTimers();
    const { instance, tap, plies, status, ctx } = mount({ reducedMotion: false });
    instance.newGame({ seed: 1 });
    tap('e2', 'e4');
    expect(plies()).toEqual(['e4']);
    expect(status()).toBe('Thinking…');
    expect(instance.serialize().moves).toEqual([]);
    vi.advanceTimersByTime(30);
    expect(instance.serialize().moves).toHaveLength(2);
    expect(ctx.saveRequests()).toBeGreaterThan(0);
    expect(plies()).toHaveLength(1);
    vi.advanceTimersByTime(COMPUTER_REVEAL_MS);
    expect(plies()).toHaveLength(2);
    // Pausing in the middle completes the turn immediately.
    tap('g1', 'f3');
    instance.pause();
    expect(instance.serialize().moves).toHaveLength(4);
    expect(plies()).toHaveLength(4);
  });

  it('moves by mouse drag from a piece to a target square', () => {
    const { instance, sq } = mount();
    instance.restore(humanGame());
    const pointer = (type: string, target: HTMLElement) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0 }) as MouseEvent & { pointerType: string };
      Object.defineProperty(event, 'pointerType', { value: 'mouse' });
      target.dispatchEvent(event);
    };
    const original = document.elementFromPoint;
    document.elementFromPoint = () => sq('g1').querySelector('span') ?? sq('g1');
    pointer('pointerdown', sq('g1'));
    document.elementFromPoint = () => sq('f3');
    pointer('pointerup', sq('f3'));
    document.elementFromPoint = original;
    expect(instance.serialize().moves).toEqual(['g1f3']);
    // Dragging an opponent piece does nothing.
    pointer('pointerdown', sq('g1'));
    pointer('pointerup', sq('g3'));
    expect(instance.serialize().moves).toEqual(['g1f3']);
  });

  it('offers "find the best move" puzzles with explanations for wrong tries', () => {
    const { ctx, instance, byId, tap, status, root } = mount();
    instance.newGame({ seed: 0 });
    byId('mode-best').click();
    expect(root.querySelector('[data-testid="menu-strength"]')!.hasAttribute('hidden')).toBe(true);
    byId('start').click();
    const state = instance.serialize();
    expect(state.mode).toBe('best');
    const ref = puzzlesFor('best', 1)[state.puzzle]!;
    expect(state.start).toBe(ref.fen);
    expect(status()).toMatch(/to move: find the clearly best move\.$/);
    expect(byId('mode').textContent).toContain(`${state.puzzle + 1} of ${puzzlesFor('best', 1).length}`);
    expect(byId('resign').hidden).toBe(true);
    expect(byId('next-puzzle').hidden).toBe(false);
    const wrong = legalMoves(parseFen(ref.fen)!).map(moveToUci).find((m) => m !== ref.line[0] && m.length === 4)!;
    tap(wrong.slice(0, 2), wrong.slice(2, 4));
    expect(byId('explanation').textContent).toContain('is not the solution');
    expect(instance.serialize().moves).toEqual([]);
    byId('hint').click();
    expect(byId('explanation').textContent).toMatch(/^Suggestion: /);
    tap(ref.line[0]!.slice(0, 2), ref.line[0]!.slice(2, 4));
    if (ref.line[0]!.length === 5) byId(`promote-${ref.line[0]![4]}`).click();
    expect(status()).toBe('Solved — that is the best move.');
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { moves: 1 } }]);
    byId('next-puzzle').click();
    expect(instance.serialize().puzzle).toBe((state.puzzle + 1) % puzzlesFor('best', 1).length);
    expect(instance.serialize().moves).toEqual([]);
    // The host's "new game" keeps the mode; the seed picks the puzzle.
    instance.newGame({ seed: 5 });
    expect(instance.serialize()).toMatchObject({ mode: 'best', puzzle: 5 % puzzlesFor('best', 1).length });
  });

  it('plays mate-in-N puzzles against the engine’s defence', () => {
    const { ctx, instance, byId, tap, status } = mount();
    instance.restore(createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode: 'mate', mateN: 2, puzzle: 0 }));
    const ref = puzzlesFor('mate', 2)[0]!;
    expect(status()).toMatch(/force checkmate — moves left: 2\.$/);
    const play = (uci: string) => {
      tap(uci.slice(0, 2), uci.slice(2, 4));
      if (uci.length === 5) byId(`promote-${uci[4]}`).click();
    };
    play(ref.line[0]!);
    expect(instance.serialize().moves).toEqual(ref.line.slice(0, 2));
    expect(status()).toMatch(/moves left: 1\.$/);
    byId('undo').click();
    expect(instance.serialize().moves).toEqual([]);
    play(ref.line[0]!);
    play(ref.line[2]!);
    expect(status()).toBe('Checkmate — puzzle solved.');
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { moves: 2 } }]);
    expect(isValidState(instance.serialize())).toBe(true);
  });

  it('uses figurines in the move list', () => {
    expect(figurine('Nf3')).toBe('♘f3');
    expect(figurine('exd8=Q+')).toBe('exd8=♕+');
    expect(figurine('O-O')).toBe('O-O');
  });
});
