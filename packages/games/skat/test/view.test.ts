// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { cardLabel, type Card } from '@wp/cards';
import type { GameModule } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { newDeal, newGame, type DealState, type SkatState } from '../src/rules';

const start = (locale: 'en' | 'de' | 'ar' = 'en', seed = 42) => {
  const ctx = createTestContext(game as GameModule<unknown>, locale);
  const instance = game.create(ctx.context);
  instance.newGame({ seed });
  return { ctx, instance, root: ctx.context.root };
};
const q = <T extends HTMLElement = HTMLElement>(root: HTMLElement, testid: string) => root.querySelector<T>(`[data-testid="${testid}"]`);

/** Hidden cards (opponents' hands and the Skat, while the game runs) must not appear in the DOM in any form. */
function expectNothingHidden(root: HTMLElement, state: SkatState, t: Parameters<typeof cardLabel>[1]) {
  const d = state.deal;
  if (!d || d.result) return;
  const html = root.innerHTML;
  const hidden: Card[] = [...d.hands[1], ...d.hands[2], ...d.skat];
  for (const c of hidden) {
    expect(html).not.toContain(`data-card="${c}"`);
    expect(html).not.toContain(cardLabel(c, t, 'french'));
    expect(html).not.toContain(cardLabel(c, t, 'german'));
  }
}

/** Plays as the person by always taking the first offered action (passing in the bidding). */
function playOneGame(root: HTMLElement, check?: () => void) {
  for (let i = 0; i < 60; i++) {
    check?.();
    if (q(root, 'next') || q(root, 'summary')) return;
    const pass = q(root, 'bid-pass');
    if (pass) {
      pass.click();
      continue;
    }
    const card = root.querySelector<HTMLElement>('[data-testid="my-hand"] button:not([aria-disabled="true"])');
    if (card) {
      card.click();
      continue;
    }
    const any = root.querySelector<HTMLElement>('[data-testid="panel"] button');
    if (any) any.click();
    else return;
  }
}

describe('Skat view', () => {
  it('opens on the setup screen and remembers options', () => {
    const { ctx, root, instance } = start();
    expect(q(root, 'setup')?.hidden).toBe(false);
    const series = q<HTMLSelectElement>(root, 'option-series') as HTMLSelectElement;
    series.value = '3';
    series.dispatchEvent(new Event('change'));
    const ramsch = q<HTMLInputElement>(root, 'option-ramsch') as HTMLInputElement;
    ramsch.checked = true;
    ramsch.dispatchEvent(new Event('change'));
    expect(ctx.preferences.get('options')).toEqual({ series: 3, scoring: 'simple', ramsch: true });
    expect((instance.serialize() as SkatState).options.series).toBe(3);
    q(root, 'start')?.click();
    expect(q(root, 'setup')?.hidden).toBe(true);
    expect(q(root, 'progress')?.textContent).toBe('Game 1 of 3');
    instance.dispose();
  });

  it('plays a whole series through the DOM, never showing hidden cards', () => {
    const { ctx, root, instance } = start('en', 7);
    const series = q<HTMLSelectElement>(root, 'option-series') as HTMLSelectElement;
    series.value = '3';
    series.dispatchEvent(new Event('change'));
    q(root, 'start')?.click();
    const check = () => expectNothingHidden(root, instance.serialize() as SkatState, ctx.context.t);
    for (let g = 0; g < 3; g++) {
      playOneGame(root, check);
      expect(q(root, 'result')).not.toBeNull();
      if (g < 2) q(root, 'next')?.click();
    }
    expect(q(root, 'summary')).not.toBeNull();
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: expect.objectContaining({ games: 3 }) }]);
    expect(root.querySelectorAll('[data-testid="liste"] tbody tr')).toHaveLength(3);
    // Restoring the finished series does not report it again.
    const saved = instance.serialize();
    instance.dispose();
    const again = createTestContext(game as GameModule<unknown>, 'en');
    const restored = game.create(again.context);
    restored.restore(saved as SkatState);
    expect(again.results).toEqual([]);
    expect(q(again.context.root, 'summary')).not.toBeNull();
    restored.dispose();
  });

  it('lets the person declare: Skat, two cards away, game choice, value hint', () => {
    const { root, instance } = start();
    const { deal } = newDeal(2, 555);
    // Both others have passed; the person (Vorhand) may play at 18.
    deal.bids = ['pass', 'pass'];
    const s: SkatState = { ...newGame(42), stage: 'play', deal: deal as DealState };
    instance.restore(s);
    q(root, 'bid-play')?.click();
    expect(q(root, 'skat-pickup')).not.toBeNull();
    q(root, 'skat-pickup')?.click();
    const cards = () => Array.from(root.querySelectorAll<HTMLButtonElement>('[data-testid="my-hand"] button'));
    expect(cards()).toHaveLength(12);
    expect(cards().every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
    const confirm = () => q<HTMLButtonElement>(root, 'discard-confirm') as HTMLButtonElement;
    expect(confirm().disabled).toBe(true);
    cards()[10]?.click();
    cards()[11]?.click();
    expect(cards().filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(2);
    expect(confirm().disabled).toBe(false);
    confirm().click();
    expect(q(root, 'declare-grand')).not.toBeNull();
    // Announcements need Hand: disabled after picking up the Skat (except Null ouvert).
    expect(q<HTMLInputElement>(root, 'declare-schneider')?.disabled).toBe(true);
    q<HTMLInputElement>(root, 'declare-null')?.click();
    expect(q<HTMLInputElement>(root, 'declare-ouvert')?.disabled).toBe(false);
    expect(q(root, 'declare-value')?.textContent).toContain('23');
    q<HTMLInputElement>(root, 'declare-grand')?.click();
    q(root, 'declare-confirm')?.click();
    const state = instance.serialize() as SkatState;
    expect(state.deal?.contract).toEqual({ kind: 'grand', hand: false, schneider: false, schwarz: false, ouvert: false });
    expect(q(root, 'contract')?.textContent).toContain('Grand');
    // After declaring, the hand buttons are play buttons again (no aria-pressed).
    expect(cards().some((b) => b.hasAttribute('aria-pressed'))).toBe(false);
    instance.dispose();
  });

  it('shows card names in the chosen card set and runs right-to-left in Arabic', () => {
    const de = start('de');
    q(de.root, 'start')?.click();
    const faces = q<HTMLSelectElement>(de.root, 'option-faces') as HTMLSelectElement;
    faces.value = 'german';
    faces.dispatchEvent(new Event('change'));
    expect(de.ctx.preferences.get('faces')).toBe('german');
    const labels = Array.from(de.root.querySelectorAll('[data-testid="my-hand"] .wp-hand-card')).map((b) => b.getAttribute('aria-label') ?? '');
    expect(labels.some((l) => /Eichel|Grün|Rot|Schellen/.test(l))).toBe(true);
    de.instance.dispose();
    const ar = start('ar');
    expect(ar.root.querySelector('.wp-skat')?.getAttribute('dir')).toBe('rtl');
    ar.instance.dispose();
  });

  it('keeps keyboard focus in the panel after a bid', () => {
    const { root, instance } = start('en', 3);
    q(root, 'start')?.click();
    const pass = q(root, 'bid-pass');
    if (pass) {
      pass.focus();
      pass.click();
      expect(document.activeElement && root.contains(document.activeElement)).toBe(true);
    }
    instance.dispose();
  });
});
