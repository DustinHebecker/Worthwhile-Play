// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { createInitialState, gameStatus, type MastermindState } from '../src/rules';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

function start(options: { seed?: number; difficulty?: string; locale?: SupportedLocale; state?: MastermindState } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const instance = game.create(ctx.context) as GameInstance<MastermindState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 1, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const all = (prefix: string) => [...root.querySelectorAll<HTMLElement>(`[data-testid^="${prefix}"]`)];
  const key = (k: string, target: Element = q('mm-slot-0') ?? root.firstElementChild!) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const type = (code: readonly number[]) => code.forEach((s) => q(`mm-palette-${s}`)!.click());
  return { ctx, instance, root, q, all, key, type };
}

const wrongFor = (state: MastermindState): number[] => {
  const code = [...state.secret];
  [code[0], code[1]] = [code[1]!, code[0]!];
  if (code[0] === code[1]) code[0] = (code[0]! + 1) % 6;
  return code;
};

describe('view', () => {
  it('renders the board for each difficulty', () => {
    const cases: [string, number, number][] = [['easy', 4, 6], ['standard', 4, 6], ['hard', 5, 8]];
    for (const [difficulty, positions, symbols] of cases) {
      const { all, instance, q } = start({ difficulty });
      expect(all('mm-slot-')).toHaveLength(positions);
      expect(all('mm-palette-')).toHaveLength(symbols);
      expect(instance.serialize().difficulty).toBe(difficulty);
      expect(q('mm-status')?.textContent).toBe('Guesses left: 10 of 10');
    }
    expect(start({ difficulty: 'bogus' }).instance.serialize().difficulty).toBe('standard');
  });

  it('labels every symbol with a name and a key, not colour alone', () => {
    const { q } = start({ difficulty: 'hard' });
    const labels = Array.from({ length: 8 }, (_, i) => q(`mm-palette-${i}`)!.getAttribute('aria-label'));
    expect(labels).toEqual(['circle, key 1', 'triangle, key 2', 'square, key 3', 'diamond, key 4', 'star, key 5', 'hexagon, key 6', 'plus, key 7', 'heart, key 8']);
    expect(q('mm-palette-0')!.querySelector('svg circle')).not.toBeNull();
    expect(q('mm-palette-1')!.querySelector('svg polygon')).not.toBeNull();
  });

  it('builds a draft with clicks and saves after each change', () => {
    const { q, ctx, instance } = start();
    q('mm-palette-2')!.click();
    expect(ctx.saveRequests()).toBe(1);
    expect(q('mm-slot-0')!.dataset.symbol).toBe('2');
    expect(q('mm-slot-0')!.getAttribute('aria-label')).toBe('Position 1: square');
    expect(q('mm-slot-1')!.getAttribute('aria-current')).toBe('true');
    q('mm-slot-3')!.click();
    expect(instance.serialize().cursor).toBe(3);
    q('mm-palette-5')!.click();
    expect(instance.serialize().draft).toEqual([2, null, null, 5]);
    expect(ctx.saveRequests()).toBe(3);
    q('mm-clear')!.click();
    expect(instance.serialize().draft).toEqual([null, null, null, null]);
  });

  it('supports digits, Backspace, arrows and Enter', () => {
    const { key, instance, q } = start({ seed: 4 });
    key('1');
    key('3');
    key('7'); // out of range on standard (6 symbols)
    expect(instance.serialize().draft).toEqual([0, 2, null, null]);
    key('Backspace');
    expect(instance.serialize().draft).toEqual([0, null, null, null]);
    key('Enter'); // incomplete: nothing submitted
    expect(instance.serialize().guesses).toEqual([]);
    expect(q('mm-check-result')!.textContent).toBe('Fill every position before submitting.');
    key('End');
    expect(instance.serialize().cursor).toBe(3);
    key('ArrowLeft', q('mm-slot-3')!);
    expect(instance.serialize().cursor).toBe(2);
    key('ArrowRight', q('mm-slot-2')!);
    key('ArrowRight', q('mm-slot-3')!);
    expect(instance.serialize().cursor).toBe(3);
    key('Home', q('mm-slot-3')!);
    expect(instance.serialize().cursor).toBe(0);
    for (const k of ['2', '2', '2', '2']) key(k);
    key('Enter');
    expect(instance.serialize().guesses).toEqual([[1, 1, 1, 1]]);
    expect(q('mm-guess-0')!.dataset.code).toBe('1,1,1,1');
  });

  it('lets Enter activate a focused palette button instead of submitting', () => {
    const { key, instance, q, type } = start({ seed: 4 });
    type([0, 1, 2, 3]);
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    q('mm-palette-0')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(instance.serialize().guesses).toEqual([]);
    key('Enter', q('mm-slot-0')!);
    expect(instance.serialize().guesses).toHaveLength(1);
  });

  it('reverses arrow keys in right-to-left locales', () => {
    const { key, instance, q } = start({ locale: 'ar' });
    expect(q('mm-slot-0')!.closest('.wp-mastermind')!.getAttribute('dir')).toBe('rtl');
    key('ArrowLeft', q('mm-slot-0')!);
    expect(instance.serialize().cursor).toBe(1);
    key('ArrowRight', q('mm-slot-1')!);
    expect(instance.serialize().cursor).toBe(0);
  });

  it('ignores input while paused', () => {
    const { key, instance, q } = start();
    instance.pause();
    key('1');
    q('mm-palette-0')!.click();
    expect(instance.serialize().draft).toEqual([null, null, null, null]);
    instance.resume();
    key('1');
    expect(instance.serialize().draft[0]).toBe(0);
  });

  it('shows feedback rows with an accessible summary', () => {
    const initial = createInitialState(9, 'standard');
    const { type, q } = start({ state: { ...initial, secret: initial.secret } });
    const guess = wrongFor(initial);
    type(guess);
    q('mm-submit')!.click();
    const row = q('mm-guess-0')!;
    const exact = Number(row.dataset.exact);
    const partial = Number(row.dataset.partial);
    expect(row.querySelectorAll('.mm-peg-exact')).toHaveLength(exact);
    expect(row.querySelectorAll('.mm-peg-partial')).toHaveLength(partial);
    expect(row.querySelector('.sr-only')!.textContent).toMatch(new RegExp(`^Guess 1: .+\\. Right place: ${exact}\\. Wrong place: ${partial}\\.$`));
    expect(q('mm-status')!.textContent).toBe('Guesses left: 9 of 10');
  });

  it('consistency check reports remaining codes without revealing the secret', () => {
    const { q, type } = start({ seed: 3 });
    q('mm-check')!.click();
    expect(q('mm-check-result')!.textContent).toBe('Fill every position to test this guess. Possible codes remaining: 1296.');
    type([0, 0, 0, 0]);
    q('mm-check')!.click();
    expect(q('mm-check-result')!.textContent).toBe('Consistent: this guess could still be the code. Possible codes remaining: 1296.');
    // Any draft change hides the stale result.
    q('mm-palette-1')!.click();
    expect(q('mm-check-result')!.hidden).toBe(true);
  });

  it('flags a contradiction with an earlier guess', () => {
    const s = createInitialState(12, 'easy');
    const { q, type } = start({ state: { ...s, guesses: [wrongFor(s)] } });
    type(wrongFor(s));
    q('mm-check')!.click();
    expect(q('mm-check-result')!.textContent).toMatch(/^Contradicts guess 1: if this were the code, guess 1 would have shown right place: 4, wrong place: 0\. Possible codes remaining: \d+\.$/);
    q('mm-clear')!.click();
    type([0, 0, 1, 2]);
    q('mm-check')!.click();
    expect(q('mm-check-result')!.textContent).toMatch(/^Not possible: at this difficulty the code never repeats a symbol\./);
  });

  it('wins, reports once and restores to the finished view without reporting again', () => {
    const initial = createInitialState(21, 'standard');
    const { ctx, instance, q, type, root } = start({ seed: 21, difficulty: 'standard' });
    type(wrongFor(initial));
    q('mm-submit')!.click();
    type(initial.secret);
    q('mm-submit')!.click();
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { guesses: 2 } }]);
    expect(q('mm-status')!.dataset.status).toBe('won');
    expect(q('mm-status')!.textContent).toBe('Code cracked! Guesses used: 2.');
    expect(q('mm-submit')).toBeNull();
    expect(q('mm-palette-0')).toBeNull();
    // Input after the end is ignored.
    root.firstElementChild!.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    const saved = instance.serialize();
    expect(gameStatus(saved)).toBe('won');

    const again = start({ state: saved });
    expect(again.ctx.results).toEqual([]);
    expect(again.q('mm-status')!.dataset.status).toBe('won');
    expect(again.all('mm-guess-')).toHaveLength(2);
  });

  it('loses after ten wrong guesses and reveals the code', () => {
    const initial = createInitialState(8, 'hard');
    const { ctx, q, type } = start({ seed: 8, difficulty: 'hard' });
    const wrong = [...initial.secret];
    wrong[0] = (wrong[0]! + 1) % 8;
    for (let i = 0; i < 10; i++) {
      type(wrong);
      q('mm-submit')!.click();
    }
    expect(ctx.results).toEqual([{ outcome: 'lost', stats: { guesses: 10 } }]);
    expect(q('mm-secret')!.dataset.code).toBe(initial.secret.join(','));
    expect(q('mm-status')!.textContent).toMatch(/^No guesses left\. The code was: .+\.$/);
  });

  it('reset returns to the seeded start and requests a save', () => {
    const { instance, ctx, type } = start({ seed: 77, difficulty: 'easy' });
    const initial = instance.serialize();
    type([0, 1]);
    const saves = ctx.saveRequests();
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    expect(ctx.saveRequests()).toBe(saves + 1);
  });

  it('has every message used by all game phases in every locale', () => {
    const s = createInitialState(5, 'easy');
    const wrong = wrongFor(s);
    const won: MastermindState = { ...s, guesses: [wrong, s.secret] };
    const lost: MastermindState = { ...s, guesses: Array.from({ length: 10 }, () => wrong) };
    for (const locale of SUPPORTED_LOCALES) {
      const playing = start({ locale, state: { ...s, guesses: [wrong] } });
      playing.q('mm-check')!.click();
      playing.type(wrong);
      playing.q('mm-check')!.click();
      playing.q('mm-clear')!.click();
      playing.type([0, 0, 1, 2]);
      playing.q('mm-check')!.click();
      playing.key('Backspace');
      playing.q('mm-submit')!.click();
      const w = start({ locale, state: won });
      const l = start({ locale, state: lost });
      expect(w.ctx.missingKeys, locale).toEqual([]);
      expect(l.ctx.missingKeys, locale).toEqual([]);
      expect(playing.ctx.missingKeys, locale).toEqual([]);
    }
  });

  it('removes its DOM on dispose', () => {
    const { instance, root } = start();
    instance.dispose();
    expect(root.childElementCount).toBe(0);
  });
});
