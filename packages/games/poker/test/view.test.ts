// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { cardLabel } from '@wp/cards';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { presetAmount } from '../src/view';
import { legalActions, type PokerState } from '../src/rules';

const setup = (locale: 'en' | 'ar' | 'de' = 'en') => {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  instance.newGame({ seed: 7, difficulty: 'medium' });
  const root = ctx.context.root;
  const q = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`);
  return { ctx, instance, root, q };
};

/** Every card label an opponent's hidden hole cards could produce. */
const hiddenLabels = (state: PokerState, t: Parameters<typeof cardLabel>[1]) =>
  state.seats.flatMap((seat, i) => (i === 0 || state.result?.shown.includes(i) ? [] : seat.hole)).map((card) => ({ card, label: cardLabel(card, t) }));

/** Text, attributes and title of everything rendered. */
const domText = (root: HTMLElement) => {
  const parts = [root.textContent ?? '', document.title];
  for (const el of root.querySelectorAll('*')) for (const attr of Array.from(el.attributes)) parts.push(attr.value);
  return parts.join('\n');
};

const act = (q: (id: string) => HTMLElement | null) => {
  for (const id of ['pk-next', 'pk-check', 'pk-call']) {
    const el = q(id);
    if (el) {
      el.click();
      return true;
    }
  }
  return false;
};

describe('setup screen', () => {
  it('starts with the setup and remembers the opponent count', () => {
    const { ctx, instance, q } = setup();
    expect(q('pk-setup')).not.toBeNull();
    expect(q('pk-start')?.hasAttribute('data-autofocus')).toBe(true);
    const select = q<HTMLSelectElement>('pk-opponents')!;
    expect(select.options).toHaveLength(5);
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    expect(ctx.preferences.get('opponents')).toBe(2);
    expect(instance.serialize().seats).toHaveLength(3);
    const level = q<HTMLSelectElement>('pk-level')!;
    level.value = 'hard';
    level.dispatchEvent(new Event('change'));
    expect(ctx.difficulties).toEqual(['hard']);
    expect(instance.serialize().difficulty).toBe('hard');
    // A new game reads the preference again.
    instance.newGame({ seed: 9 });
    expect(instance.serialize().opponents).toBe(2);
    expect(instance.serialize().difficulty).toBe('hard');
    instance.dispose();
  });
});

describe('table', () => {
  it('never shows opponents’ hole cards in the DOM before a showdown', () => {
    const { ctx, instance, q, root } = setup();
    q('pk-start')!.click();
    let showdowns = 0;
    for (let step = 0; step < 80; step++) {
      const state = instance.serialize();
      const text = domText(root) + (root.querySelector('[aria-live]')?.textContent ?? '');
      for (const { card, label } of hiddenLabels(state, ctx.context.t)) {
        expect(text.includes(label), `${label} visible`).toBe(false);
        expect(root.querySelector(`[data-card="${card}"]`)).toBeNull();
      }
      if (state.result?.showdown && state.result.shown.some((i) => i !== 0)) {
        showdowns++;
        const shown = state.result.shown.find((i) => i !== 0)!;
        for (const card of state.seats[shown]!.hole) expect(root.querySelector(`[data-testid="pk-seat-${shown}"] [data-card="${card}"]`)).not.toBeNull();
        expect(q(`pk-seat-hand-${shown}`)?.textContent).toBeTruthy();
      }
      if (!act(q)) break;
    }
    expect(showdowns).toBeGreaterThan(0);
    instance.dispose();
  });

  it('shows the player’s cards, board, pot and the right buttons; requests a save after each action', () => {
    const { ctx, instance, q } = setup();
    q('pk-start')!.click();
    const state = instance.serialize();
    expect(q('pk-hole')?.querySelectorAll('[data-card]')).toHaveLength(2);
    expect(q('pk-board')?.getAttribute('aria-label')).toBe('Board: no cards yet');
    expect(q('pk-pot')?.textContent).toContain('Pot:');
    const legal = legalActions(state);
    expect(q('pk-fold') !== null).toBe(legal.fold);
    expect(q('pk-check') !== null).toBe(legal.check);
    expect(q('pk-call') !== null).toBe(legal.call > 0);
    if (legal.call > 0) expect(q('pk-odds')?.textContent).toMatch(/\d+%/);
    const saves = ctx.saveRequests();
    act(q);
    expect(ctx.saveRequests()).toBeGreaterThan(saves);
    expect(q('pk-seat-0')).not.toBeNull();
    expect(q('pk-seats')?.querySelectorAll('li')).toHaveLength(4);
    instance.dispose();
  });

  it('raises with presets, the slider and the exact amount field', () => {
    const { instance, q } = setup();
    q('pk-start')!.click();
    const state = instance.serialize();
    const legal = legalActions(state);
    expect(legal.raise).not.toBeNull();
    q('pk-preset-pot')!.click();
    const amount = q<HTMLInputElement>('pk-amount')!;
    expect(Number(amount.value)).toBe(presetAmount(state, 1));
    q('pk-preset-allIn')!.click();
    expect(Number(amount.value)).toBe(legal.raise!.max);
    expect(q('pk-raise')!.textContent).toContain('All-in');
    const slider = q<HTMLInputElement>('pk-slider')!;
    slider.value = String(legal.raise!.min + 3);
    slider.dispatchEvent(new Event('input'));
    expect(amount.value).toBe(String(legal.raise!.min + 3));
    amount.value = '9999';
    amount.dispatchEvent(new Event('change'));
    expect(amount.value).toBe(String(legal.raise!.max));
    amount.value = String(legal.raise!.min);
    amount.dispatchEvent(new Event('input'));
    q('pk-raise')!.click();
    const after = instance.serialize();
    const mine = after.log.find((e) => e.seat === 0 && (e.kind === 'raise' || e.kind === 'bet'));
    expect(mine?.amount).toBe(legal.raise!.min);
    instance.dispose();
  });

  it('ends the table calmly after confirmation and reports it once', () => {
    const { ctx, instance, q } = setup();
    q('pk-start')!.click();
    q('pk-end')!.click();
    expect(q('pk-end-no')).not.toBeNull();
    q('pk-end-no')!.click();
    expect(q('pk-end')).not.toBeNull();
    q('pk-end')!.click();
    q('pk-end-yes')!.click();
    expect(instance.serialize().phase).toBe('finished');
    expect(q('pk-summary')?.textContent).toContain('Hands played: 0');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: expect.objectContaining({ hands: 0, chips: 200 }) as unknown }]);
    // Restoring a finished table does not report again.
    const saved = instance.serialize();
    instance.restore(saved);
    expect(ctx.results).toHaveLength(1);
    expect(q('pk-end')).toBeNull();
    instance.dispose();
  });

  it('plays a whole table to its natural end and reports the outcome once', () => {
    const { ctx, instance, q } = setup();
    q('pk-start')!.click();
    for (let step = 0; step < 3000 && instance.serialize().phase !== 'finished'; step++) {
      // Always go all-in when possible: the table ends quickly.
      const allIn = q('pk-preset-allIn');
      if (allIn) {
        allIn.click();
        q('pk-raise')!.click();
      } else act(q);
    }
    const state = instance.serialize();
    expect(state.phase).toBe('finished');
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]?.outcome).toBe(state.ended === 'champion' ? 'won' : 'lost');
    expect(q('pk-summary')).not.toBeNull();
    instance.dispose();
  }, 60_000);

  it('renders in Arabic (RTL) and German without missing keys', () => {
    for (const locale of ['ar', 'de'] as const) {
      const { ctx, instance, q, root } = setup(locale);
      q('pk-start')!.click();
      act(q);
      expect(root.querySelector('.wp-poker')?.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(ctx.missingKeys).toEqual([]);
      instance.dispose();
    }
  });

  it('restores mid-hand exactly', () => {
    const { ctx, instance, q } = setup();
    q('pk-start')!.click();
    act(q);
    const saved = JSON.parse(JSON.stringify(instance.serialize())) as PokerState;
    instance.dispose();
    const ctx2 = createTestContext(game as never, 'en');
    const again = game.create(ctx2.context);
    again.restore(saved);
    expect(again.serialize()).toEqual(saved);
    expect(ctx2.context.root.querySelector('[data-testid="pk-hole"]')).not.toBeNull();
    void ctx;
    again.dispose();
  });
});
