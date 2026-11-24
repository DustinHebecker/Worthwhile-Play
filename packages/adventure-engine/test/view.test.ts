// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import { ADVENTURE_UI_MESSAGES, type AdventureState, type Speech } from '../src';
import { fixtureGame } from './game';

const game = fixtureGame();
beforeAll(() => game.preload?.('en'));

const setup = (speech?: Speech) => {
  const g = speech ? fixtureGame(speech) : game;
  const ctx = createTestContext(g as GameModule<unknown>);
  const inst = g.create(ctx.context);
  inst.newGame({ seed: 1 });
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const click = (id: string) => {
    const el = q(id);
    if (!el) throw new Error(`no element ${id}; outcome: ${q('outcome')?.textContent}`);
    el.click();
  };
  return { ctx, inst, root, q, click, state: () => inst.serialize() as AdventureState };
};

describe('adventure view', () => {
  it('shows the scene, its description, the start text and the things here', () => {
    const { root, q } = setup();
    expect(q('scene-name')?.textContent).toBe('en:scene.yard.name');
    expect(root.textContent).toContain('en:scene.yard.desc');
    expect(q('outcome')?.textContent).toBe('en:scene.yard.enter.0');
    expect([...root.querySelectorAll('[data-testid^="hs-"]')].map((b) => b.textContent)).toEqual(['en:hs.yard.rope.name', 'en:hs.yard.keeper.name', 'en:hs.yard.stair.name', 'en:hs.yard.window.name']);
    expect(root.querySelector('svg')?.getAttribute('aria-label')).toBe('en:scene.yard.desc');
  });

  it('a place opens its actions; acting closes the menu, shows the outcome and requests a save', () => {
    const { ctx, q, click, state } = setup();
    click('hs-rope');
    expect(q('hs-rope')?.getAttribute('aria-expanded')).toBe('true');
    expect(q('act-take-rope')).not.toBeNull();
    expect(q('act-talk-rope')).toBeNull();
    click('act-take-rope');
    expect(state().items).toEqual(['rope']);
    expect(q('outcome')?.textContent).toBe('en:hs.yard.rope.take.0');
    expect(q('act-take-rope')).toBeNull();
    expect(ctx.saveRequests()).toBe(1);
    expect(q('item-rope')?.textContent).toBe('en:item.rope.name');
  });

  it('a tap on the picture opens the same actions (never acts directly)', () => {
    const { q, state } = setup();
    q('spot-keeper')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(state().dialogue).toBeNull();
    expect(q('act-talk-keeper')).not.toBeNull();
    expect(q('spot-keeper')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('a tap on the picture scrolls the opened actions into view (phones, review L4)', () => {
    const { root, q } = setup();
    const calls: unknown[] = [];
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions) {
      calls.push([this.className, arg]);
    };
    try {
      q('spot-stair')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(calls).toEqual([['wp-adv__menu', { block: 'nearest' }]]);
      expect(root.querySelector('.wp-adv__menu')?.getAttribute('aria-label')).toBe('en:hs.yard.stair.name');
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  it('refusals are explained with the shared texts and change nothing', () => {
    const { ctx, q, click, state } = setup();
    const before = JSON.stringify(state());
    click('hs-window');
    click('act-use-window');
    expect(q('outcome')?.textContent).toBe('en:hs.yard.window.use.1');
    const s = JSON.parse(before) as AdventureState;
    expect(state().scene).toBe(s.scene);
    expect(ctx.saveRequests()).toBe(1);
  });

  it('plays the whole fixture through the text view to the ending, and reports it once', () => {
    const { ctx, q, click, state } = setup();
    const at = (hs: string, verb: string) => (click(`hs-${hs}`), click(`act-${verb}-${hs}`));
    at('rope', 'take');
    at('keeper', 'talk');
    expect(q('opt-shifts')).not.toBeNull();
    expect(q('hs-rope')).toBeNull();
    click('opt-shifts');
    click('opt-thanks');
    at('stair', 'use');
    expect(q('scene-name')?.textContent).toBe('en:scene.cellar.name');
    at('hook', 'take');
    at('ledger', 'examine');
    click('item-rope');
    expect(q('item-rope')?.getAttribute('aria-pressed')).toBe('true');
    click('item-hook');
    expect(state().items).toEqual(['grapnel']);
    expect(q('chapter-continue')).not.toBeNull();
    click('chapter-continue');
    click('clue-shifts');
    click('clue-ledger-dates');
    click('connect');
    expect(state().clues).toContain('gate-unwatched');
    click('travel-yard');
    click('hs-keeper');
    click('act-present-gate-unwatched-keeper');
    expect(state().items).toContain('chest-key');
    click('item-grapnel');
    click('hs-window');
    click('act-useItem-window');
    at('window', 'use');
    click('item-chest-key');
    click('hs-chest');
    click('act-useItem-chest');
    expect(state().ended).toBe('map-found');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { actions: state().actions, hints: 0 } }]);
    expect(state().actions).toBe(17); // the 14 walkthrough actions + 3 item selections
  });

  it('hints: three tiers per open goal, in the hints panel', () => {
    const { q, click, state } = setup();
    click('hint-explore');
    click('hint-explore');
    expect(q('hints')?.textContent).toContain('en:goal.explore.hint.2');
    click('hint-explore');
    expect(state().hints).toEqual({ explore: 3 });
    expect(q('hint-explore')).toBeNull();
  });

  it('marking clues toggles them; only two are kept', () => {
    const { q, click } = setup();
    click('hs-keeper');
    click('act-talk-keeper');
    click('opt-shifts');
    click('opt-thanks');
    click('clue-shifts');
    expect(q('clue-shifts')?.getAttribute('aria-pressed')).toBe('true');
    expect(q('connect')).toBeNull();
    click('clue-shifts');
    expect(q('clue-shifts')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('Escape closes an open menu and returns focus to the place', () => {
    const { root, q, click } = setup();
    click('hs-stair');
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(q('act-use-stair')).toBeNull();
    expect(document.activeElement).toBe(q('hs-stair'));
  });

  it('reveal toggles the outlines of all places', () => {
    const { root, q } = setup();
    const box = q('reveal') as HTMLInputElement;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    expect(root.querySelector('svg')?.classList.contains('wp-adv__picture--reveal')).toBe(true);
  });

  it('read aloud speaks outcomes in the UI locale only when switched on, and stops on pause', () => {
    const spoken: string[] = [];
    let cancelled = 0;
    const speech: Speech = { speak: (text, lang) => spoken.push(`${lang}|${text}`), cancel: () => void cancelled++ };
    const { q, click, inst } = setup(speech);
    click('hs-rope');
    click('act-take-rope');
    expect(spoken).toEqual([]);
    const box = q('read-aloud') as HTMLInputElement;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    click('hs-keeper');
    click('act-examine-keeper');
    expect(spoken).toEqual(['en|en:hs.yard.keeper.desc']);
    inst.pause();
    expect(cancelled).toBeGreaterThan(0);
  });

  it('without speech synthesis there is no read-aloud option', () => {
    expect(setup().q('read-aloud')).toBeNull();
  });

  it('restores an open dialogue and a selected item exactly', () => {
    const a = setup();
    a.click('hs-rope');
    a.click('act-take-rope');
    a.click('item-rope');
    a.click('hs-keeper');
    a.click('act-talk-keeper');
    const saved = a.state();
    const b = setup();
    b.inst.restore(saved);
    expect(b.state()).toEqual(saved);
    expect(b.q('opt-shifts')).not.toBeNull();
    b.click('opt-bye');
    expect(b.q('item-rope')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shared interface texts exist in all 16 locales with the same keys', () => {
    const keys = Object.keys(ADVENTURE_UI_MESSAGES.en ?? {}).sort();
    for (const l of SUPPORTED_LOCALES) expect(Object.keys(ADVENTURE_UI_MESSAGES[l] ?? {}).sort(), l).toEqual(keys);
    expect(keys.filter((k) => k.startsWith('adv.refuse.')).length).toBe(11);
  });
});
