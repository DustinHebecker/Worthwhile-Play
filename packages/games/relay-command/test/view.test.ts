// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { concede, OPPONENT, PLAYER, type RcState } from '../src/rules';
import { CELL } from '../src/view';

let ctx: TestContext;
let instance: GameInstance<RcState>;

const $ = (id: string) => ctx.context.root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const click = (id: string) => $(id).dispatchEvent(new MouseEvent('click', { bubbles: true }));
const key = (k: string) => $('rc-map').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const state = () => instance.serialize();
const own = () => state().world.entities.filter((e) => e.side === PLAYER);
const enemies = () => state().world.entities.filter((e) => e.side === OPPONENT);
const firstMobile = () => own().find((e) => e.kind === 'rifles')!;

function setup(locale: 'en' | 'ar' | 'de' = 'en') {
  ctx = createTestContext(game as GameModule<unknown>, locale);
  instance = game.create(ctx.context) as GameInstance<RcState>;
  instance.newGame({ seed: 4 });
}

beforeEach(() => {
  vi.useFakeTimers();
  setup();
});
afterEach(() => {
  instance.dispose();
  vi.useRealTimers();
});

describe('Relay Command view', () => {
  it('renders the turn, the status, both unit lists and the map', () => {
    expect($('rc-turn').textContent).toBe('Turn 1 of 12');
    expect($('rc-status').getAttribute('data-phase')).toBe('plan');
    expect(ctx.context.root.querySelectorAll('[data-testid^="rc-unit-"]')).toHaveLength(7);
    expect($('rc-enemy').querySelectorAll('li')).toHaveLength(7);
    expect($('rc-slots').textContent).toBe('Orders this turn: 0 of 4.');
    expect($('rc-map').getAttribute('data-cols')).toBe('12');
    expect($('rc-map').style.width).toBe(`${12 * CELL}px`);
    expect($('rc-summary').textContent).toContain('No turn played yet');
  });

  it('selects a unit from the list and offers attack buttons only then', () => {
    expect(ctx.context.root.querySelector('[data-testid^="rc-attack-"]')).toBeNull();
    const unit = firstMobile();
    click(`rc-unit-${unit.id}`);
    expect($(`rc-unit-${unit.id}`).getAttribute('aria-pressed')).toBe('true');
    expect($('rc-selection-text').textContent).toContain('Rifle Squad');
    expect(ctx.context.root.querySelectorAll('[data-testid^="rc-attack-"]')).toHaveLength(7);
  });

  it('plans attack, hold and cancel through the buttons and saves each change', () => {
    const unit = firstMobile();
    const enemy = enemies()[0]!;
    click(`rc-unit-${unit.id}`);
    click(`rc-attack-${enemy.id}`);
    expect(state().draft).toEqual([{ side: PLAYER, unit: unit.id, order: { type: 'attack', target: enemy.id } }]);
    click('rc-hold');
    expect(state().draft[0]!.order).toEqual({ type: 'hold' });
    expect(($('rc-cancel') as HTMLButtonElement).disabled).toBe(false);
    click('rc-cancel');
    expect(state().draft).toEqual([]);
    expect(ctx.saveRequests()).toBe(3);
    expect($('rc-status').textContent).toContain('0 new orders');
  });

  it('gives move orders with the keyboard cursor on the map', () => {
    const unit = firstMobile();
    click(`rc-unit-${unit.id}`);
    $('rc-map').focus();
    key('ArrowUp');
    key('ArrowRight');
    expect($('rc-cursor').textContent).toContain(`Cell ${unit.x + 2}, ${unit.y}: hill`);
    key('Enter');
    expect(state().draft).toEqual([{ side: PLAYER, unit: unit.id, order: { type: 'move', x: unit.x + 1, y: unit.y - 1 } }]);
    // Enter on a cell with another own unit selects that unit instead.
    key('ArrowLeft');
    key('ArrowUp');
    key('Enter');
    expect($('rc-selection-text').textContent).toContain('Warden');
    click(`rc-unit-${unit.id}`);
    key('Escape');
    expect($('rc-selection-text').textContent).toContain('Select one of your units');
    // H and Delete act on the selected unit.
    click(`rc-unit-${unit.id}`);
    key('h');
    expect(state().draft[0]!.order).toEqual({ type: 'hold' });
    key('Delete');
    expect(state().draft).toEqual([]);
  });

  it('shows contact, offers set-up for the Mast Truck and explains refused orders', () => {
    const truck = own().find((e) => e.kind === 'mast-truck')!;
    expect($(`rc-unit-${truck.id}`).textContent).toContain('in contact');
    expect($(`rc-unit-${truck.id}`).textContent).toContain('Relay packed');
    click(`rc-unit-${truck.id}`);
    expect($('rc-deploy').hidden).toBe(false);
    click('rc-deploy');
    expect(state().draft).toEqual([{ side: PLAYER, unit: truck.id, order: { type: 'deploy' } }]);
    expect($('rc-slots').textContent).toBe('Orders this turn: 1 of 4.');
    // A rifle squad has no relay to set up.
    click(`rc-unit-${firstMobile().id}`);
    expect($('rc-deploy').hidden).toBe(true);
    // Fill the remaining slots, then a fifth unit is refused with a reason.
    const others = own().filter((e) => e.kind !== 'command-post' && e.id !== truck.id);
    for (const u of others.slice(0, 3)) {
      click(`rc-unit-${u.id}`);
      click('rc-hold');
    }
    click(`rc-unit-${others[3]!.id}`);
    click('rc-hold');
    vi.runAllTimers();
    expect($('rc-live').textContent).toContain('No orders left this turn (4 per turn)');
    expect(state().draft).toHaveLength(4);
  });

  it('a unit outside coverage shows why it cannot be ordered', () => {
    const s = structuredClone(state());
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    rifle.x = 9;
    rifle.y = 9;
    instance.restore(s);
    click(`rc-unit-${rifle.id}`);
    expect($(`rc-unit-${rifle.id}`).textContent).toContain('out of contact');
    expect($('rc-selection-text').textContent).toContain('outside your command coverage');
    expect(ctx.context.root.querySelector('.rc-actions[hidden]')).not.toBeNull();
  });

  it('maps pointer clicks on the canvas to cells', () => {
    const unit = firstMobile();
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 12 * CELL, height: 12 * CELL, right: 12 * CELL, bottom: 12 * CELL, x: 0, y: 0, toJSON: () => ({}) });
    const at = (x: number, y: number) => map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x * CELL + 5, clientY: y * CELL + 5 }));
    at(unit.x, unit.y);
    expect($(`rc-unit-${unit.id}`).getAttribute('aria-pressed')).toBe('true');
    at(unit.x + 1, unit.y - 3);
    expect(state().draft[0]!.order).toEqual({ type: 'move', x: unit.x + 1, y: unit.y - 3 });
    const enemy = enemies()[0]!;
    at(enemy.x, enemy.y);
    expect(state().draft[0]!.order).toEqual({ type: 'attack', target: enemy.id });
  });

  it('locks the turn, shows the summary and keeps the selection if the unit survives', () => {
    const unit = firstMobile();
    click(`rc-unit-${unit.id}`);
    click('rc-hold');
    click('rc-lock');
    expect(state().world.turn).toBe(1);
    expect(state().draft).toEqual([]);
    expect($('rc-turn').textContent).toBe('Turn 2 of 12');
    expect($('rc-summary').textContent).toContain('Damage dealt');
    expect($(`rc-unit-${unit.id}`).getAttribute('aria-pressed')).toBe('true');
  });

  it('asks before giving up, reports the result once and disables play', () => {
    click('rc-concede');
    expect($('rc-confirm').hidden).toBe(false);
    expect(document.activeElement).toBe($('rc-concede-no'));
    click('rc-concede-no');
    expect($('rc-confirm').hidden).toBe(true);
    expect(document.activeElement).toBe($('rc-concede'));
    expect(state().phase).toBe('plan');
    click('rc-concede');
    click('rc-concede-yes');
    expect(state()).toMatchObject({ phase: 'finished', result: 'lost', conceded: true });
    expect(document.activeElement).toBe($('rc-status'));
    expect(ctx.results).toEqual([{ outcome: 'lost', stats: { turns: 0 } }]);
    expect(($('rc-lock') as HTMLButtonElement).disabled).toBe(true);
    click('rc-lock');
    expect(ctx.results).toHaveLength(1);
    expect($('rc-status').textContent).toContain('gave up');
  });

  it('does not report a restored finished game again, and reset starts over with the same seed', () => {
    const finished = concede(state());
    instance.restore(finished);
    expect(ctx.results).toEqual([]);
    expect($('rc-status').getAttribute('data-phase')).toBe('finished');
    instance.reset();
    expect(state().phase).toBe('plan');
    expect(state().seed).toBe(4);
    expect(state().world.turn).toBe(0);
  });

  it('keeps the map left-to-right in RTL locales and translates the interface', () => {
    instance.dispose();
    setup('ar');
    expect(ctx.missingKeys).toEqual([]);
    expect(ctx.context.root.querySelector('.rc-mapwrap')!.getAttribute('dir')).toBe('ltr');
    instance.dispose();
    setup('de');
    expect($('rc-lock').textContent).toBe('Runde abschließen');
  });
});
