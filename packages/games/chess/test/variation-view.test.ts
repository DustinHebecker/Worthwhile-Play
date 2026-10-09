// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { COMPUTER_REVEAL_MS, formatEvaluation } from '../src/view';
import { createGame, isValidState, legalMoves, moveToUci, nextSeed, puzzlesFor, randomColor, replay, toFen, type ChessState } from '../src/rules';

let instances: GameInstance<ChessState>[] = [];

function mount(options: { reducedMotion?: boolean; ctx?: TestContext } = {}) {
  const ctx: TestContext = options.ctx ?? createTestContext(game as GameModule<unknown>, 'en');
  const context = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const byId = <T extends HTMLElement = HTMLButtonElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`)!;
  const sq = (name: string) => byId(`sq-${name}`);
  const vsq = (name: string) => byId(`var-sq-${name}`);
  const tap = (...names: string[]) => names.forEach((n) => sq(n).click());
  const vtap = (...names: string[]) => names.forEach((n) => vsq(n).click());
  const status = () => byId('status').textContent;
  const plies = () => [...root.querySelectorAll('[data-testid^="ply-"]')].map((el) => el.textContent);
  return { ctx, instance, root, byId, sq, vsq, tap, vtap, status, plies };
}

const twoPlayers = (extra: Partial<ChessState> = {}): ChessState => ({
  ...createGame({ seed: 3, difficulty: 'beginner', opponent: 'human', humanColor: 'w' }),
  ...extra
});

afterEach(() => {
  for (const instance of instances) instance.dispose();
  instances = [];
  vi.useRealTimers();
});

describe('random colour', () => {
  it('draws the colour from the seed, says so, and remembers "random" as the choice', () => {
    const { ctx, instance, byId, status } = mount();
    instance.newGame({ seed: 9, difficulty: 'beginner' });
    byId('color-random').click();
    byId('start').click();
    const state = instance.serialize();
    expect(state.seed).toBe(nextSeed(9));
    expect(state.colorRandom).toBe(true);
    expect(state.humanColor).toBe(randomColor(state.seed));
    expect(isValidState(state)).toBe(true);
    const colour = state.humanColor === 'w' ? 'White' : 'Black';
    expect(byId('mode').textContent).toBe(`You play ${colour} (drawn at random) against the computer (Beginner).`);
    expect(status()).toBe(`Your move — you play ${colour}.`);
    expect(byId('board').firstElementChild?.getAttribute('data-square')).toBe(state.humanColor === 'w' ? 'a8' : 'h1');
    expect(ctx.preferences.get('menu')).toMatchObject({ opponent: 'computer', humanColor: 'random' });
    expect(byId<HTMLInputElement>('color-random').checked).toBe(true);
    expect(byId('menu-color').textContent).toContain('Random');
    // Each start from the menu draws again from a fresh seed.
    byId('start').click();
    expect(instance.serialize().seed).toBe(nextSeed(nextSeed(9)));
    // The host's "new game" keeps drawing; both colours occur, and the computer opens as White.
    const drawn = new Set<string>();
    for (let seed = 1; seed <= 8; seed++) {
      instance.newGame({ seed, difficulty: 'beginner' });
      const s = instance.serialize();
      expect(s).toMatchObject({ colorRandom: true, humanColor: randomColor(seed) });
      expect(s.moves).toHaveLength(s.humanColor === 'b' ? 1 : 0);
      drawn.add(s.humanColor);
    }
    expect(drawn).toEqual(new Set(['w', 'b']));
    // Restoring is exact (the drawn colour is stored).
    const saved = instance.serialize();
    instance.restore(saved);
    expect(instance.serialize()).toEqual(saved);
  });

  it('keeps "random" while puzzles or two-player games run in between', () => {
    const { instance, byId } = mount();
    instance.newGame({ seed: 2 });
    byId('color-random').click();
    byId('start').click();
    byId('mode-mate').click();
    byId('start').click();
    expect(instance.serialize().mode).toBe('mate');
    expect(instance.serialize().colorRandom).toBeUndefined();
    byId('mode-computer').click();
    expect(byId<HTMLInputElement>('color-random').checked).toBe(true);
    byId('start').click();
    expect(instance.serialize().colorRandom).toBe(true);
  });

  it('a fresh instance on the same device starts with the remembered random choice', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    ctx.preferences.set('menu', { opponent: 'computer', humanColor: 'random', mode: 'play', mateN: 1 });
    const { instance, byId } = mount({
      ctx: { ...ctx, context: { ...ctx.context, preferences: { get: (k) => ctx.preferences.get(k), set: (k, v) => void ctx.preferences.set(k, v) } } }
    });
    instance.newGame({ seed: 5 });
    expect(instance.serialize()).toMatchObject({ colorRandom: true, humanColor: randomColor(5) });
    expect(byId<HTMLInputElement>('color-random').checked).toBe(true);
  });
});

describe('variation board', () => {
  it('opens on the current position, plays both sides freely and never changes the game', () => {
    const { ctx, instance, byId, root, sq, vsq, tap, vtap } = mount();
    instance.restore(twoPlayers());
    tap('e2', 'e4', 'e7', 'e5');
    const before = instance.serialize();
    const saves = ctx.saveRequests();
    expect(byId('variation').hidden).toBe(true);
    byId('variation-open').click();
    expect(byId('variation').hidden).toBe(false);
    expect(root.querySelector('.wp-chess')!.hasAttribute('data-variation')).toBe(true);
    expect(byId('variation-open').hidden).toBe(true);
    expect(byId('var-board').getAttribute('aria-label')).toBe('Variation board');
    expect(byId('variation').getAttribute('aria-labelledby')).toBeTruthy();
    expect(vsq('e4').dataset.piece).toBe('wP');
    expect(vsq('e5').dataset.piece).toBe('bP');
    expect(document.activeElement).toBe(vsq('e1'));
    expect(byId('var-status').textContent).toBe('Starting position. White to move.');
    expect(ctx.saveRequests()).toBeGreaterThan(saves);
    // Both sides, legal moves only.
    vtap('g1', 'f3');
    vtap('g8', 'g5'); // not a knight move: selects nothing / deselects
    vtap('b8', 'c6');
    expect(vsq('f3').dataset.piece).toBe('wN');
    expect(vsq('c6').dataset.piece).toBe('bN');
    expect(byId('var-status').textContent).toBe('Move 2 of 2 in this line. White to move.');
    expect(byId('var-ply-1').textContent).toBe('♘c6');
    expect(byId('var-ply-1').getAttribute('aria-current')).toBe('step');
    // The real game is untouched.
    expect(sq('g1').dataset.piece).toBe('wN');
    expect(sq('f3').dataset.piece).toBe('');
    const { variation, ...game } = instance.serialize();
    expect(game).toEqual(before);
    expect(variation).toEqual({ fen: toFen(replay(before.start, before.moves)!.pos), moves: ['g1f3', 'b8c6'], cursor: 2, orientation: 'w' });
    expect(isValidState(instance.serialize())).toBe(true);
    expect(ctx.results).toEqual([]);
    // Step back and forward through the line.
    byId('var-back').click();
    expect(vsq('c6').dataset.piece).toBe('');
    expect(byId('var-ply-1').classList.contains('is-ahead')).toBe(true);
    expect(byId('var-ply-0').getAttribute('aria-current')).toBe('step');
    expect(byId('var-forward').disabled).toBe(false);
    byId('var-forward').click();
    expect(vsq('c6').dataset.piece).toBe('bN');
    expect(byId('var-forward').disabled).toBe(true);
    // A different move after stepping back replaces the rest of the line.
    byId('var-back').click();
    vtap('d7', 'd6');
    expect(instance.serialize().variation!.moves).toEqual(['g1f3', 'd7d6']);
    // Flip only the variation board.
    byId('var-flip').click();
    expect(byId('var-board').firstElementChild?.getAttribute('data-square')).toBe('h1');
    expect(byId('board').firstElementChild?.getAttribute('data-square')).toBe('a8');
    // Reset to the variation's starting position.
    byId('var-reset').click();
    expect(instance.serialize().variation).toMatchObject({ moves: [], cursor: 0, orientation: 'b' });
    expect(byId('var-back').disabled).toBe(true);
    expect(byId('var-reset').disabled).toBe(true);
    // Close: back to the game, which goes on as before.
    byId('var-close').click();
    expect(byId('variation').hidden).toBe(true);
    expect('variation' in instance.serialize()).toBe(false);
    expect(instance.serialize()).toEqual(before);
    expect(document.activeElement).toBe(byId('variation-open'));
    tap('g1', 'f3');
    expect(instance.serialize().moves).toEqual([...before.moves, 'g1f3']);
    expect(ctx.results).toEqual([]);
  });

  it('survives close and reload (restore) with its line, cursor and orientation', () => {
    const first = mount();
    first.instance.restore(twoPlayers());
    first.byId('variation-open').click();
    first.vtap('d2', 'd4', 'd7', 'd5', 'c2', 'c4');
    first.byId('var-back').click();
    first.byId('var-flip').click();
    const saved = JSON.parse(JSON.stringify(first.instance.serialize())) as ChessState;
    expect(isValidState(saved)).toBe(true);
    const second = mount();
    second.instance.restore(saved);
    expect(second.byId('variation').hidden).toBe(false);
    expect(second.vsq('d5').dataset.piece).toBe('bP');
    expect(second.vsq('c4').dataset.piece).toBe('');
    expect(second.byId('var-board').firstElementChild?.getAttribute('data-square')).toBe('h1');
    expect(second.instance.serialize()).toEqual(saved);
    // A new game closes it.
    second.instance.newGame({ seed: 4 });
    expect(second.byId('variation').hidden).toBe(true);
    expect('variation' in second.instance.serialize()).toBe(false);
  });

  it('uses the full position against the computer, even while its reply is still being revealed', () => {
    vi.useFakeTimers();
    const { instance, byId, tap, vsq } = mount({ reducedMotion: false });
    instance.newGame({ seed: 1 });
    tap('e2', 'e4');
    byId('variation-open').click();
    const state = instance.serialize();
    expect(state.moves).toHaveLength(2);
    expect(state.variation!.fen).toBe(toFen(replay(state.start, state.moves)!.pos));
    expect(vsq('e4').dataset.piece).toBe('wP');
    vi.advanceTimersByTime(COMPUTER_REVEAL_MS * 2);
    expect(instance.serialize().moves).toHaveLength(2);
  });

  it('is keyboard operable with the same grid keys and offers promotion choices', () => {
    const { instance, byId, sq, vsq, vtap } = mount();
    instance.restore(twoPlayers({ start: '8/P6k/8/8/8/8/8/K7 w - - 0 1' }));
    byId('variation-open').click();
    vsq('a1').focus();
    vsq('a1').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(vsq('a2'));
    vtap('a7', 'a8');
    expect(byId('var-promotion').hidden).toBe(false);
    expect(document.activeElement).toBe(byId('var-promote-q'));
    byId('var-promote-cancel').click();
    expect(byId('var-promotion').hidden).toBe(true);
    vtap('a7', 'a8');
    byId('var-promote-n').click();
    expect(vsq('a8').dataset.piece).toBe('wN');
    expect(sq('a7').dataset.piece).toBe('wP');
    expect(instance.serialize().moves).toEqual([]);
  });

  it('shows the engine suggestion on request; in an unsolved puzzle only after confirming', () => {
    const play = mount();
    play.instance.restore(twoPlayers({ start: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1' }));
    play.byId('variation-open').click();
    expect(play.byId('var-engine-result').hidden).toBe(true);
    play.byId('var-engine').click();
    expect(play.byId('var-solution-confirm').hidden).toBe(true);
    expect(play.byId('var-engine-result').textContent).toContain('♖a8#');
    expect(play.byId('var-engine-result').textContent).toContain('mate in 1: White');
    expect(play.root.querySelectorAll('[data-testid^="var-sq-"][data-hint]')).toHaveLength(2);
    expect(play.root.querySelectorAll('[data-testid^="sq-"][data-hint]')).toHaveLength(0);
    // Moving on clears the suggestion.
    play.vtap('a1', 'a2');
    expect(play.byId('var-engine-result').hidden).toBe(true);

    const { ctx, instance, byId, vtap } = mount();
    instance.restore(createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode: 'best', puzzle: 0 }));
    const before = instance.serialize();
    byId('variation-open').click();
    byId('var-engine').click();
    expect(byId('var-solution-confirm').hidden).toBe(false);
    expect(byId('var-solution-confirm').textContent).toContain('solution');
    expect(byId('var-engine-result').hidden).toBe(true);
    expect(document.activeElement).toBe(byId('var-solution-yes'));
    byId('var-solution-no').click();
    expect(byId('var-solution-confirm').hidden).toBe(true);
    expect(byId('var-engine-result').hidden).toBe(true);
    expect(document.activeElement).toBe(byId('var-engine'));
    byId('var-engine').click();
    byId('var-solution-yes').click();
    expect(byId('var-engine-result').textContent).toMatch(/^Engine suggestion: /);
    // Asked once per puzzle.
    byId('var-engine').click();
    expect(byId('var-solution-confirm').hidden).toBe(true);
    // Playing on the variation board is no attempt: the puzzle is unchanged and not solved.
    const ref = puzzlesFor('best', 1)[0]!;
    vtap(ref.line[0]!.slice(0, 2), ref.line[0]!.slice(2, 4));
    if (ref.line[0]!.length === 5) byId(`var-promote-${ref.line[0]![4]}`).click();
    const { variation, ...game } = instance.serialize();
    expect(game).toEqual(before);
    expect(variation!.moves).toEqual([ref.line[0]]);
    expect(ctx.results).toEqual([]);
  });

  it('formats evaluations from White’s view', () => {
    expect(formatEvaluation({ white: 125, mate: 0 })).toBe('+1.25');
    expect(formatEvaluation({ white: -40, mate: 0 })).toBe('−0.40');
    expect(formatEvaluation({ white: 0, mate: 0 })).toBe('+0.00');
    expect(formatEvaluation({ white: 29_990, mate: 3 })).toBe('#3');
    expect(formatEvaluation({ white: -29_990, mate: -2 })).toBe('#−2');
  });
});

describe('multi-move "find the best move"', () => {
  const multi = () => {
    const list = puzzlesFor('best', 1);
    const index = list.findIndex((p) => p.line.length >= 3);
    return { index, ref: list[index]! };
  };
  const playUci = (m: ReturnType<typeof mount>, uci: string) => {
    m.tap(uci.slice(0, 2), uci.slice(2, 4));
    if (uci.length === 5) m.byId(`promote-${uci[4]}`).click();
  };

  it('shows progress, answers with the stored reply, keeps wrong tries out of the state and finishes once', () => {
    vi.useFakeTimers();
    const m = mount({ reducedMotion: false });
    const { index, ref } = multi();
    const total = (ref.line.length + 1) / 2;
    m.instance.restore(createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode: 'best', puzzle: index }));
    expect(m.status()).toMatch(new RegExp(`find the clearly best move\\. Move 1 of ${total}\\.$`));
    playUci(m, ref.line[0]!);
    // The engine's reply is part of the state at once; drawing it is animated.
    expect(m.instance.serialize().moves).toEqual(ref.line.slice(0, 2));
    expect(m.plies()).toHaveLength(1);
    vi.advanceTimersByTime(COMPUTER_REVEAL_MS);
    expect(m.plies()).toHaveLength(2);
    expect(m.status()).toMatch(new RegExp(`Move 2 of ${total}\\.$`));
    // A wrong second move: refutation, retry, nothing stored.
    const here = replay(ref.fen, ref.line.slice(0, 2))!.pos;
    const wrong = legalMoves(here).map(moveToUci).find((u) => u !== ref.line[2] && u.length === 4)!;
    playUci(m, wrong);
    expect(m.byId('explanation').textContent).toContain('is not the solution');
    expect(m.instance.serialize().moves).toEqual(ref.line.slice(0, 2));
    // The hint works for every step.
    m.byId('hint').click();
    expect(m.byId('explanation').textContent).toMatch(/^Suggestion: /);
    for (let k = 2; k < ref.line.length; k += 2) {
      playUci(m, ref.line[k]!);
      vi.advanceTimersByTime(COMPUTER_REVEAL_MS);
    }
    expect(m.instance.serialize().moves).toEqual(ref.line);
    expect(m.status()).toBe('Solved — you found every move of the line.');
    expect(m.ctx.results).toEqual([{ outcome: 'won', stats: { moves: total } }]);
    // Restoring the solved puzzle does not report again.
    m.instance.restore(m.instance.serialize());
    expect(m.ctx.results).toHaveLength(1);
  });

  it('undoes a step of the line (the person’s move with the reply)', () => {
    const m = mount();
    const { index, ref } = multi();
    m.instance.restore(createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode: 'best', puzzle: index }));
    playUci(m, ref.line[0]!);
    expect(m.byId('undo').disabled).toBe(false);
    m.byId('undo').click();
    expect(m.instance.serialize().moves).toEqual([]);
  });

  it('restores saves from the single-move era as solved', () => {
    const m = mount();
    const { index, ref } = multi();
    const legacy = { ...createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode: 'best', puzzle: index }), moves: [ref.line[0]!] };
    expect(isValidState(legacy)).toBe(true);
    m.instance.restore(legacy);
    expect(m.status()).toBe('Solved — that is the best move.');
    expect(m.byId('next-puzzle').hidden).toBe(false);
    expect(m.instance.serialize()).toEqual(legacy);
    expect(m.ctx.results).toEqual([]);
  });
});
