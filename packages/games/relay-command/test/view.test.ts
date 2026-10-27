// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import { createTestContext, createTestLibrary, type TestContext } from '@wp/testing';
import game from '../src/index';
import { initialIntel, NEUTRAL, passable, retire, validateCommand, type Entity } from '@wp/strategy-engine';
import { concede, lockTurn, newGame, OPPONENT, orderRefusal, planOrder, PLAYER, RULESET, sideValue, STALL_TURNS, stalemateTurns, type RcState } from '../src/rules';
import { SCENARIOS } from '../src/scenarios';
import { CELL } from '../src/view';

let ctx: TestContext;
let instance: GameInstance<RcState>;
/** Two-press confirmations ignore a quick second press; the fake clock (vi.useFakeTimers below) moves on. */
const later = () => vi.advanceTimersByTime(1000);

const $ = (id: string) => ctx.context.root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
const click = (id: string) => $(id).dispatchEvent(new MouseEvent('click', { bubbles: true }));
const key = (k: string) => $('rc-map').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const state = () => instance.serialize();
const own = () => state().world.entities.filter((e) => e.side === PLAYER);
const enemies = () => state().world.entities.filter((e) => e.side === OPPONENT);
const firstMobile = () => own().find((e) => e.kind === 'rifles')!;

/** Moves the enemy's first Rifle Squad next to the player's, in sight, and returns it (fog, D7). */
function spotEnemy(): Entity {
  const s = structuredClone(state());
  const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
  const foe = s.world.entities.find((e) => e.side === OPPONENT && e.kind === 'rifles')!;
  const free = (x: number, y: number) => passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y);
  const spot = [[0, -2], [1, -2], [-1, -2], [2, 0], [-2, 0], [0, 2]].map(([dx, dy]) => [rifle.x + dx!, rifle.y + dy!] as const).find(([x, y]) => free(x, y))!;
  foe.x = spot[0];
  foe.y = spot[1];
  s.world.intel = initialIntel(s.world, RULESET);
  instance.restore(s);
  return foe;
}

/** The world with only the two Command Posts left (nothing can change any more). */
const withoutMobileUnits = (w: RcState['world']) => ({ ...w, entities: w.entities.filter((e) => e.kind === 'command-post') });

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
  it('side letters are a fixed property of the game: they stay when the neutral posts are gone out of sight (review of PR #23)', () => {
    const corners = SCENARIOS.find((spec) => spec.id === 'four-corners')!;
    const s = newGame(1, corners, 'normal', 12, false, null, 1);
    instance.restore(s);
    const marks = () => ctx.context.root.querySelectorAll('[data-testid^="rc-mark-"]').length;
    const before = marks();
    expect(before).toBeGreaterThan(0);
    // Both neutral posts destroyed where the player cannot see: its reports still show them.
    const gone = structuredClone(s);
    gone.world.entities = gone.world.entities.filter((e) => e.side !== NEUTRAL);
    instance.restore(gone);
    expect(marks()).toBe(before);
    expect(ctx.context.root.textContent).toContain('Opponent B');
  });

  it('neutral posts have a list of their own on maps with empty seats; it stays when they are gone (a fixed property)', () => {
    const corners = SCENARIOS.find((spec) => spec.id === 'four-corners')!;
    const s = newGame(1, corners, 'normal', 12, false, null, 2);
    instance.restore(s);
    const post = s.world.entities.find((e) => e.side === NEUTRAL)!;
    expect($('rc-neutral-panel').hidden).toBe(false);
    expect($('rc-neutral-panel').textContent).toContain('Neutral Command Posts');
    expect($(`rc-neutral-${post.id}`).textContent).toContain('neutral');
    expect(ctx.context.root.querySelector(`[data-testid="rc-enemy-${post.id}"]`)).toBeNull();
    // Gone where the player cannot see: the report keeps it; gone from the reports too: the heading stays, the list says so.
    const gone = structuredClone(s);
    gone.world.entities = gone.world.entities.filter((e) => e.side !== NEUTRAL);
    for (const list of gone.world.intel ?? []) list.splice(0, list.length, ...list.filter((r) => r.side !== NEUTRAL));
    instance.restore(gone);
    expect($('rc-neutral-panel').hidden).toBe(false);
    expect($('rc-neutral').textContent).toBe('none left');
    // Maps without empty seats have no such list.
    instance.restore(newGame(1, corners, 'normal', 12, false, null, 3));
    expect($('rc-neutral-panel').hidden).toBe(true);
    instance.newGame({ seed: 2 });
    expect($('rc-neutral-panel').hidden).toBe(true);
  });

  it('teams (owner decisions 2026-10-24): the setup offers the shapes of the map and count; allies have their own list and name, never the enemy list', () => {
    const corners = SCENARIOS.find((spec) => spec.id === 'four-corners')!;
    // Field Exercise (two sides): no teams row.
    expect($('rc-teams-label').hidden).toBe(true);
    const scenario = $('rc-scenario') as HTMLSelectElement;
    scenario.value = 'four-corners';
    scenario.dispatchEvent(new Event('change'));
    const opponents = $('rc-opponents') as HTMLSelectElement;
    opponents.value = '3';
    opponents.dispatchEvent(new Event('change'));
    const teams = $('rc-teams') as HTMLSelectElement;
    expect($('rc-teams-label').hidden).toBe(false);
    expect([...teams.options].map((o) => o.value)).toEqual(['ffa', '2v2-next', '2v2-across', '3v1', '1v3']);
    expect([...teams.options].map((o) => o.textContent)).toContain('2 against 2, your ally beside you');
    expect(state().world.teams).toBeUndefined();
    teams.value = '2v2-across';
    teams.dispatchEvent(new Event('change'));
    expect(state().world.teams).toEqual([0, 1, 0, 1]);
    expect(teams.value).toBe('2v2-across');
    // The ally (side C, across) has a list of its own; its pieces are not in the enemy list.
    expect($('rc-allies-panel').hidden).toBe(false);
    const allyPost = state().world.entities.find((e) => e.side === 2 && e.kind === 'command-post')!;
    expect($(`rc-ally-${allyPost.id}`)).not.toBeNull();
    expect(ctx.context.root.querySelector(`[data-testid="rc-enemy-${allyPost.id}"]`)).toBeNull();
    expect(ctx.context.root.textContent).toContain('Ally C');
    // Two opponents: 2 against 1 only; free-for-all hides the allies list.
    opponents.value = '2';
    opponents.dispatchEvent(new Event('change'));
    expect([...teams.options].map((o) => o.value)).toEqual(['ffa', '2v1-next', '2v1-across']);
    teams.value = 'ffa';
    teams.dispatchEvent(new Event('change'));
    expect(state().world.teams).toBeUndefined();
    expect($('rc-allies-panel').hidden).toBe(true);
    // A team game stays one after a reload and "New game" keeps its teams; the setup is locked after the first turn.
    instance.restore(newGame(2, corners, 'normal', 12, false, null, 3, [], false, null, '3v1'));
    expect(($('rc-teams') as HTMLSelectElement).value).toBe('3v1');
    instance.reset();
    expect(state().world.teams).toEqual([0, 0, 1, 0]);
    click('rc-lock');
    expect(($('rc-teams') as HTMLSelectElement).disabled).toBe(true);
    expect($('rc-setup-summary').textContent).toContain('3 against 1 (you and two allies)');
  });

  it('Bastion, a map made for teams: the setup offers only its shapes (1 against 3 first), no free-for-all and no choice of count', () => {
    const scenario = $('rc-scenario') as HTMLSelectElement;
    scenario.value = 'bastion';
    scenario.dispatchEvent(new Event('change'));
    expect(state().scenario).toBe('bastion');
    expect(state().opponents).toBe(3);
    expect($('rc-opponents-label').hidden).toBe(true);
    const teams = $('rc-teams') as HTMLSelectElement;
    expect($('rc-teams-label').hidden).toBe(false);
    expect([...teams.options].map((o) => o.value)).toEqual(['1v3', '3v1']);
    expect(state().world.teams).toEqual([0, 1, 1, 1]);
    teams.value = '3v1';
    teams.dispatchEvent(new Event('change'));
    expect(state().world.teams).toEqual([0, 0, 1, 0]);
    // The player is a base below; the plateau is the lone opponent's.
    const own = state().world.entities.find((e) => e.side === 0 && e.kind === 'command-post')!;
    expect(own.y).toBe(12);
  });

  it('the player picks the own base in the setup (owner request 2026-10-27), named by where it lies; locked after the first turn', () => {
    const start = $('rc-start') as HTMLSelectElement;
    const change = (el: HTMLSelectElement, value: string) => {
      el.value = value;
      el.dispatchEvent(new Event('change'));
    };
    const own = () => state().world.entities.find((e) => e.side === 0 && e.kind === 'command-post')!;
    // Field Exercise: the two bases, the default (bottom left) first.
    expect($('rc-start-label').hidden).toBe(false);
    expect([...start.options].map((o) => [o.value, o.textContent])).toEqual([['0', 'Bottom left'], ['1', 'Top right']]);
    expect(start.value).toBe('0');
    change(start, '1');
    expect(state().start).toBe(1);
    expect(own()).toMatchObject({ x: 10, y: 1 });
    expect(start.value).toBe('1');
    // Another map keeps the corner where it can.
    change($('rc-scenario') as HTMLSelectElement, 'ridge-valley');
    expect(state().start).toBe(1);
    expect(start.value).toBe('1');
    // Four bases: each corner.
    change($('rc-scenario') as HTMLSelectElement, 'four-corners');
    change($('rc-opponents') as HTMLSelectElement, '3');
    expect([...start.options].map((o) => o.textContent)).toEqual(['Bottom left', 'Top left', 'Top right', 'Bottom right']);
    change(start, '3');
    expect(own()).toMatchObject({ x: 13, y: 13 });
    // Bastion, alone against three: the plateau is the only base of that role, so there is no choice.
    change($('rc-scenario') as HTMLSelectElement, 'bastion');
    expect($('rc-start-label').hidden).toBe(true);
    change($('rc-teams') as HTMLSelectElement, '3v1');
    expect($('rc-start-label').hidden).toBe(false);
    expect([...start.options].map((o) => o.textContent)).toEqual(['Bottom left', 'Bottom', 'Bottom right']);
    change(start, '2');
    expect(own()).toMatchObject({ x: 10, y: 12 });
    // "New game" keeps the base; after the first turn the choice is locked.
    instance.reset();
    expect(state().start).toBe(2);
    click('rc-lock');
    expect(start.disabled).toBe(true);
  });

  it('switches the map between the side view (default) and the top view, and keeps the choice on this device', () => {
    expect($('rc-view-profile').getAttribute('aria-pressed')).toBe('true');
    expect($('rc-view-top').getAttribute('aria-pressed')).toBe('false');
    const rows = () => ctx.context.root.querySelectorAll('[data-testid="rc-legend"] li').length;
    const before = rows();
    click('rc-view-top');
    expect($('rc-view-top').getAttribute('aria-pressed')).toBe('true');
    expect($('rc-view-profile').getAttribute('aria-pressed')).toBe('false');
    expect(ctx.preferences.get('mapView')).toBe('top');
    later();
    expect($('rc-live').textContent).toBe('Map view: From above.');
    // The legend is drawn anew for the view, not added a second time.
    expect(rows()).toBe(before);
    expect(ctx.context.root.querySelectorAll('[data-testid="rc-legend-kinds"]')).toHaveLength(1);
    // Choosing the same view again changes nothing.
    $('rc-live').textContent = '';
    click('rc-view-top');
    later();
    expect($('rc-live').textContent).toBe('');
    // The game itself does not change: the choice is not part of the saved game.
    expect(JSON.stringify(state())).not.toContain('mapView');
    // A new start on this device opens in the chosen view.
    instance.dispose();
    instance = game.create(ctx.context) as GameInstance<RcState>;
    instance.newGame({ seed: 4 });
    expect($('rc-view-top').getAttribute('aria-pressed')).toBe('true');
  });

  it('plays the last turn back on demand, or after every turn when chosen; skip, Escape or a click on the map end it (owner request 2026-10-27)', () => {
    // Nothing to play before the first turn.
    expect(($('rc-replay') as HTMLButtonElement).disabled).toBe(true);
    expect($('rc-replay-bar').hidden).toBe(true);
    click('rc-unit-' + firstMobile().id);
    click('rc-regroup');
    click('rc-lock');
    // Off by default: the turn is not played by itself.
    expect($('rc-replay-bar').hidden).toBe(true);
    expect(($('rc-replay') as HTMLButtonElement).disabled).toBe(false);
    click('rc-replay');
    expect($('rc-replay-bar').hidden).toBe(false);
    expect($('rc-replay-status').textContent).toBe('Turn 1 is played back …');
    expect(($('rc-replay') as HTMLButtonElement).disabled).toBe(true);
    click('rc-replay-skip');
    expect($('rc-replay-bar').hidden).toBe(true);
    expect(($('rc-replay') as HTMLButtonElement).disabled).toBe(false);
    // Escape (any key) on the map ends it, and does nothing else (the selection stays).
    const before = $('rc-selection-text').textContent;
    click('rc-replay');
    key('Escape');
    expect($('rc-replay-bar').hidden).toBe(true);
    expect($('rc-selection-text').textContent).toBe(before);
    // A click on the map ends it too.
    click('rc-replay');
    $('rc-map').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect($('rc-replay-bar').hidden).toBe(true);
    // It plays to its end by itself (a turn of six ticks).
    click('rc-replay');
    vi.advanceTimersByTime(10_000);
    expect($('rc-replay-bar').hidden).toBe(true);
    // Chosen: every turn plays when it is carried out, and the choice is kept on this device.
    ($('rc-replay-auto') as HTMLInputElement).checked = true;
    $('rc-replay-auto').dispatchEvent(new Event('change', { bubbles: true }));
    expect(ctx.preferences.get('replayTurns')).toBe(true);
    click('rc-lock');
    expect($('rc-replay-bar').hidden).toBe(false);
    expect($('rc-replay-status').textContent).toBe('Turn 2 is played back …');
    // A new order (a change of the game) ends it.
    click('rc-unit-' + firstMobile().id);
    click('rc-hold');
    expect($('rc-replay-bar').hidden).toBe(true);
    instance.dispose();
    instance = game.create(ctx.context) as GameInstance<RcState>;
    instance.newGame({ seed: 4 });
    expect(($('rc-replay-auto') as HTMLInputElement).checked).toBe(true);
  });

  it('renders the turn, the status, both unit lists and the map', () => {
    expect($('rc-turn').textContent).toBe('Turn 1');
    expect($('rc-status').getAttribute('data-phase')).toBe('plan');
    expect(ctx.context.root.querySelectorAll('[data-testid^="rc-unit-"]')).toHaveLength(10);
    // Fog: of the enemy, only its structures (Command Post, Muster Yard) are known, from before the battle.
    expect($('rc-enemy').querySelectorAll('li')).toHaveLength(2);
    expect($('rc-enemy').textContent).toContain('Position known from before the battle');
    expect($('rc-slots').textContent).toBe('Planning: 0/4');
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
    // Nothing in sight yet: the known enemy post is a ghost and cannot be attacked.
    expect(ctx.context.root.querySelectorAll('[data-testid^="rc-attack-"]')).toHaveLength(0);
    const foe = spotEnemy();
    click(`rc-unit-${unit.id}`);
    expect([...ctx.context.root.querySelectorAll('[data-testid^="rc-attack-"]')].map((b) => b.getAttribute('data-testid'))).toEqual([`rc-attack-${foe.id}`]);
  });

  it('plans attack, hold and cancel through the buttons and saves each change', () => {
    const unit = firstMobile();
    const enemy = spotEnemy();
    click(`rc-unit-${unit.id}`);
    click(`rc-attack-${enemy.id}`);
    expect(state().draft).toEqual([{ side: PLAYER, unit: unit.id, order: { type: 'attack', target: enemy.id } }]);
    click('rc-hold');
    expect(state().draft[0]!.order).toEqual({ type: 'hold' });
    expect(($('rc-cancel') as HTMLButtonElement).disabled).toBe(false);
    click('rc-cancel');
    expect(state().draft).toEqual([]);
    expect(ctx.saveRequests()).toBe(3);
    // While planning, the status line is empty: the counter says it all.
    expect($('rc-status').textContent).toBe('');
    expect($('rc-slots').hasAttribute('data-full')).toBe(false);
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
    expect($('rc-selection-text').textContent).toContain('Battle Tank');
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
    expect($('rc-deploy').hidden).toBe(true);
    expect($('rc-slots').textContent).toBe('Planning: 1/4');
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
    // Visible too, for pointer and touch players (N9); cleared by the next successful action.
    expect($('rc-notice').hidden).toBe(false);
    expect($('rc-notice').textContent).toContain('No orders left this turn');
    click(`rc-unit-${others[0]!.id}`);
    click('rc-hold');
    expect($('rc-notice').hidden).toBe(true);
    expect(state().draft).toHaveLength(4);
  });

  it('a Scout Car launches its drone; the drone is told on the card, lands on the car, and a far destination is refused (owner decision 2026-10-27)', () => {
    // The player's first Rifle Squad becomes a Scout Car (with its drone aboard).
    const s = structuredClone(state());
    const car = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    Object.assign(car, { kind: 'outrider', hp: 45 });
    s.world.intel = initialIntel(s.world, RULESET);
    instance.restore(s);
    click(`rc-unit-${car.id}`);
    expect($('rc-launch').hidden).toBe(false);
    expect($('rc-launch').textContent).toBe('Launch drone');
    expect($('rc-recall').hidden).toBe(true);
    expect($('rc-card-drone').textContent).toBe('aboard, ready to launch');
    click('rc-launch');
    expect(state().draft).toEqual([{ side: PLAYER, unit: car.id, order: { type: 'launch' } }]);
    expect(($('rc-launch') as HTMLButtonElement).disabled).toBe(true);
    expect($('rc-launch').textContent).toBe('Drone takes off this turn');
    // The launch can be taken back like any order.
    expect(($('rc-cancel') as HTMLButtonElement).disabled).toBe(false);
    click('rc-lock');
    later();
    const drone = state().world.entities.find((e) => e.kind === 'kite' && e.side === PLAYER)!;
    expect(drone.carrier).toBe(car.id);
    expect($('rc-summary').textContent).toContain(`Scout Car ${car.id} launched its drone.`);
    expect($(`rc-unit-${drone.id}`).textContent).toContain(`Drone ${drone.id}`);
    click(`rc-unit-${car.id}`);
    expect($('rc-launch').hidden).toBe(true);
    expect($('rc-card-drone').textContent).toBe(`in the air (Drone ${drone.id})`);
    click(`rc-unit-${drone.id}`);
    expect($('rc-recall').hidden).toBe(false);
    expect($('rc-card-leash').textContent).toBe(`at most 5 cells from Scout Car ${car.id}`);
    // Beyond the leash: refused with the reason.
    const far = state().world.map.w - 1 - car.x >= 6 ? { x: car.x + 6, y: car.y } : { x: car.x - 6, y: car.y };
    $('rc-map').focus();
    expect(orderRefusal(state(), drone.id, { type: 'move', ...far })).toBe('leash');
    expect(planOrder(state(), drone.id, { type: 'move', ...far })).toBeUndefined();
    click('rc-recall');
    expect(state().draft).toEqual([{ side: PLAYER, unit: drone.id, order: { type: 'recall' } }]);
    click('rc-lock');
    later();
    expect(state().world.entities.some((e) => e.id === drone.id)).toBe(false);
    expect($('rc-summary').textContent).toContain(`Drone ${drone.id} landed on Scout Car ${car.id}.`);
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
    expect(ctx.context.root.querySelector('.rc-orders[hidden]')).not.toBeNull();
    expect(ctx.context.root.querySelector('[data-testid^="rc-attack-"]')).toBeNull();
  });

  it('plans patrol, escort and regroup through the click modes and buttons', () => {
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 12 * CELL, height: 12 * CELL, right: 12 * CELL, bottom: 12 * CELL, x: 0, y: 0, toJSON: () => ({}) });
    const at = (x: number, y: number) => map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x * CELL + 5, clientY: y * CELL + 5 }));
    const unit = firstMobile();
    click(`rc-unit-${unit.id}`);
    click('rc-mode-patrol');
    expect($('rc-mode-patrol').getAttribute('aria-pressed')).toBe('true');
    expect($('rc-mode-hint').textContent).toContain('far end of the patrol');
    at(unit.x + 1, unit.y - 3);
    expect(state().draft[0]!.order).toEqual({ type: 'patrol', x: unit.x + 1, y: unit.y - 3, rx: unit.x, ry: unit.y });
    expect($('rc-mode-move').getAttribute('aria-pressed')).toBe('true');
    const post = own().find((e) => e.kind === 'command-post')!;
    click('rc-mode-escort');
    at(post.x, post.y);
    expect(state().draft[0]!.order).toEqual({ type: 'escort', target: post.id });
    expect($(`rc-unit-${unit.id}`).textContent).toContain('escort Command Post');
    click('rc-regroup');
    expect(state().draft[0]!.order).toEqual({ type: 'regroup' });
  });

  it('changes the doctrine with the controls, keeping the planned order and spending one slot', () => {
    const unit = firstMobile();
    click(`rc-unit-${unit.id}`);
    const retreat = $('rc-doctrine-retreat') as HTMLSelectElement;
    retreat.value = '50';
    retreat.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state().draft).toEqual([{ side: PLAYER, unit: unit.id, order: { type: 'hold' }, doctrine: { retreatBelow: 50, priority: 'weakest', seekCover: false, holdFire: false, lostContact: 'regroup' } }]);
    const cover = $('rc-doctrine-cover') as HTMLInputElement;
    cover.checked = true;
    cover.dispatchEvent(new Event('change', { bubbles: true }));
    click('rc-hold');
    expect(state().draft).toHaveLength(1);
    expect(state().draft[0]!.doctrine).toEqual({ retreatBelow: 50, priority: 'weakest', seekCover: true, holdFire: false, lostContact: 'regroup' });
    expect($('rc-slots').textContent).toBe('Planning: 1/4');
    click('rc-lock');
    expect(state().world.entities.find((e) => e.id === unit.id)!.doctrine).toEqual({ retreatBelow: 50, priority: 'weakest', seekCover: true, holdFire: false, lostContact: 'regroup' });
    click(`rc-unit-${unit.id}`);
    expect(($('rc-doctrine-retreat') as HTMLSelectElement).value).toBe('50');
    expect(($('rc-doctrine-cover') as HTMLInputElement).checked).toBe(true);
  });

  it('offers three choices without radio contact: return after a turn (default), carry out the order then return, carry on', () => {
    const unit = firstMobile();
    click(`rc-unit-${unit.id}`);
    const lost = $('rc-doctrine-lostcontact') as HTMLSelectElement;
    expect([...lost.options].map((o) => o.textContent)).toEqual(['Return into coverage after a turn', 'Carry out the order, then return', 'Carry on (stay out of contact)']);
    expect(lost.value).toBe('regroup');
    lost.value = 'finish';
    lost.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state().draft[0]!.doctrine?.lostContact).toBe('finish');
    click('rc-lock');
    expect(state().world.entities.find((e) => e.id === unit.id)!.doctrine?.lostContact).toBe('finish');
    click(`rc-unit-${unit.id}`);
    expect(($('rc-doctrine-lostcontact') as HTMLSelectElement).value).toBe('finish');
  });

  it('reports orders the engine ended on its own in the turn summary', () => {
    const s = structuredClone(state());
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    const blocker = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'warden')!;
    // Send the rifle squad onto the cell of a holding Warden next to it.
    Object.assign(rifle, { x: blocker.x - 1, y: blocker.y });
    s.world.entities.sort((a, b) => a.id - b.id);
    instance.restore(s);
    click(`rc-unit-${rifle.id}`);
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 12 * CELL, height: 12 * CELL, right: 12 * CELL, bottom: 12 * CELL, x: 0, y: 0, toJSON: () => ({}) });
    click(`rc-unit-${rifle.id}`);
    instance.restore({ ...state(), draft: [{ side: PLAYER, unit: rifle.id, order: { type: 'move', x: blocker.x, y: blocker.y } }] });
    click('rc-lock');
    expect($('rc-summary').textContent).toContain(`Rifle Squad ${rifle.id}: the destination is occupied; now holding position.`);
  });

  it('tells when a unit turned back after carrying out its order out of contact (doctrine), from an observed event', () => {
    const rifle = firstMobile();
    instance.restore({ ...state(), events: [{ t: 'order-ended', tick: 3, id: rifle.id, reason: 'turned-back' }] });
    expect($('rc-summary').textContent).toContain(`Rifle Squad ${rifle.id}: order carried out without radio contact; returning into coverage (doctrine).`);
  });

  it('reports each automatic order end at most once per unit and turn', () => {
    const rifle = firstMobile();
    const retreat = (tick: number) => ({ t: 'order-ended' as const, tick, id: rifle.id, reason: 'retreat' as const });
    instance.restore({ ...state(), events: [retreat(1), retreat(3), retreat(5)] });
    const lines = [...$('rc-summary').querySelectorAll('li')].filter((li) => li.textContent?.includes('retreating'));
    expect(lines).toHaveLength(1);
  });

  it('after losing the own Command Post the result is told from the true world (no stale picture)', () => {
    const s = structuredClone(state());
    const post = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'command-post')!;
    const foe = s.world.entities.find((e) => e.side === OPPONENT && e.kind === 'warden')!;
    const free = [[-1, 0], [0, -1], [1, 0], [0, 1], [-1, -1], [1, -1]].map(([dx, dy]) => [post.x + dx!, post.y + dy!] as const)
      .find(([x, y]) => x >= 0 && y >= 0 && x < 12 && y < 12 && passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y))!;
    Object.assign(foe, { x: free[0], y: free[1] });
    post.hp = 1;
    s.world.intel = initialIntel(s.world, RULESET);
    instance.restore(s);
    click('rc-lock');
    expect(state().result).toBe('lost');
    expect($('rc-status').textContent).toBe('Your Command Post was destroyed.');
    expect($('rc-summary').textContent).toContain(`Lost: Command Post ${post.id}.`);
  });

  it('describes enemies without orders, own units out of contact with their last order as unconfirmed, and unobserved cells', () => {
    const s = structuredClone(state());
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    // Out of contact: far from the own post, with no report since the start.
    s.world.intel![PLAYER] = s.world.intel![PLAYER]!.map((r) => (r.id === rifle.id ? { ...r, live: false } : r));
    s.log = [];
    instance.restore(s);
    expect($(`rc-unit-${rifle.id}`).textContent).toContain('last order sent: hold position (unconfirmed)');
    expect($('rc-enemy').textContent).not.toContain('Current order');
    $('rc-map').focus();
    for (let i = 0; i < 12; i++) key('ArrowUp');
    for (let i = 0; i < 12; i++) key('ArrowRight');
    expect($('rc-cursor').textContent).toContain('(not observed now)');
  });

  it('sets up a Static Jammer through its own button and explains what it does', () => {
    const jammer = own().find((e) => e.kind === 'jammer')!;
    click(`rc-unit-${jammer.id}`);
    expect($('rc-deploy').textContent).toBe('Set up jammer');
    click('rc-deploy');
    expect(state().draft).toEqual([{ side: PLAYER, unit: jammer.id, order: { type: 'deploy' } }]);
    expect($(`rc-unit-${jammer.id}`).textContent).toContain('Setting up: the jammer works after this turn.');
    expect(ctx.context.root.textContent).toContain('Electronic warfare:');
  });

  /** Puts the enemy jammer, set up, on the first free cell next to (x, y). */
  function enemyJammerNear(x: number, y: number, withoutOwnTracer = false) {
    const s = structuredClone(state());
    if (withoutOwnTracer) s.world.entities = s.world.entities.filter((e) => !(e.side === PLAYER && e.kind === 'tracer'));
    const jammer = s.world.entities.find((e) => e.side === OPPONENT && e.kind === 'jammer')!;
    const free = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < 12 && cy < 12 && passable(s.world.map, RULESET, cx, cy, 'ground') && !s.world.entities.some((e) => e.x === cx && e.y === cy);
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [0, 2]].map(([dx, dy]) => [x + dx!, y + dy!] as const).find(([cx, cy]) => free(cx, cy))!;
    Object.assign(jammer, { x: spot[0], y: spot[1], order: { type: 'hold' }, deploy: RULESET.ticksPerTurn });
    s.world.entities.sort((a, b) => a.id - b.id);
    s.world.intel = initialIntel(s.world, RULESET);
    instance.restore(s);
    return jammer;
  }

  it('shows the player\'s own units as jammed when an enemy jammer works next to them (no order buttons)', () => {
    const lancer = own().find((e) => e.kind === 'lancer')!;
    enemyJammerNear(lancer.x, lancer.y);
    expect($(`rc-unit-${lancer.id}`).textContent).toContain('jammed, keeps its last order');
    click(`rc-unit-${lancer.id}`);
    expect($('rc-hold').closest('[hidden]')).not.toBeNull();
    $('rc-map').focus();
    expect($('rc-cursor').textContent).toContain('(your radio is jammed here)');
  });

  it('tells the player when the Command Post itself is jammed', () => {
    const post = own().find((e) => e.kind === 'command-post')!;
    // The own Tracer starts next to the post and would burn through; take it away.
    enemyJammerNear(post.x, post.y, true);
    expect($('rc-slots').textContent).toBe('Planning: jammed');
    expect($('rc-slots').hasAttribute('data-full')).toBe(true);
    // The silenced post shows no jam marks: they would pin down the (unlocated) jammer.
    const jammer = state().world.entities.find((e) => e.side === OPPONENT && e.kind === 'jammer')!;
    $('rc-map').focus();
    for (let i = 0; i < 12; i++) key('ArrowUp');
    for (let i = 0; i < 12; i++) key('ArrowLeft');
    for (let i = 0; i < jammer.x; i++) key('ArrowRight');
    for (let i = 0; i < jammer.y; i++) key('ArrowDown');
    expect($('rc-cursor').textContent).not.toContain('jammed');
  });

  it('does not mark jammed cells outside the own coverage (that would reveal a hidden jammer)', () => {
    const s = structuredClone(state());
    const jammer = s.world.entities.find((e) => e.side === OPPONENT && e.kind === 'jammer')!;
    Object.assign(jammer, { order: { type: 'hold' }, deploy: RULESET.ticksPerTurn }); // at its start, far from the player
    s.world.intel = initialIntel(s.world, RULESET);
    instance.restore(s);
    $('rc-map').focus();
    // Walk the cursor onto the jammer's own cell (inside its disc, outside the player's coverage).
    for (let i = 0; i < 12; i++) key('ArrowUp');
    for (let i = 0; i < 12; i++) key('ArrowLeft');
    for (let i = 0; i < jammer.x; i++) key('ArrowRight');
    for (let i = 0; i < jammer.y; i++) key('ArrowDown');
    expect($('rc-cursor').textContent).toContain(`Cell ${jammer.x + 1}, ${jammer.y + 1}`);
    expect($('rc-cursor').textContent).not.toContain('jammed');
  });

  it('shows the unit card as a meter list (owner: Proposal 2), and says when a unit has no weapon', () => {
    expect($('rc-card').hidden).toBe(true);
    const rifle = firstMobile();
    click(`rc-unit-${rifle.id}`);
    expect($('rc-card').hidden).toBe(false);
    // A description list: one term (pictogram and word) and one value per stat; the segments are decoration.
    const meters = $('rc-card-meters');
    expect(meters.tagName).toBe('DL');
    expect([...meters.querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(['Health', 'Damage', 'Range', 'Speed', 'Vision']);
    expect($('rc-card-health').textContent).toBe('40 / 40');
    expect($('rc-card-damage').textContent).toBe('6');
    expect(meters.querySelectorAll('.rc-seg[aria-hidden="true"]')).toHaveLength(5);
    expect(meters.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(5);
    // Owner: the match-up is told once, in the effect table behind "More" (no block on top).
    expect(ctx.context.root.querySelector('[data-testid="rc-card-matchup"]')).toBeNull();
    expect($('rc-card').textContent).not.toMatch(/Strong against|Weaker against|Cannot hurt/);
    // The full effect table sits behind "More".
    expect($('rc-card-vs').closest('details')).toBe($('rc-card-more'));
    expect($('rc-card-vs').querySelectorAll('th[scope="row"]')).toHaveLength(5);
    // The rate of fire per turn, not per tick (owner, 2026-10-18): a Rifle Squad fires every tick, 6 ticks a turn.
    expect($('rc-card-rate').textContent).toBe('6× per turn · direct fire');
    expect([...$('rc-card-vs').querySelectorAll('tr')].map((tr) => tr.textContent)).toEqual(['infantry100 %', 'light vehicle60 %', 'heavy armour20 %', 'structure30 %', 'air40 %']);
    // Segments on the roster scale: damage 6 of the roster's 25 fills 2 of 5; full health fills all 5.
    expect($('rc-card-damage').querySelectorAll('.rc-seg i.on')).toHaveLength(2);
    expect($('rc-card-health').querySelectorAll('.rc-seg i.on')).toHaveLength(5);
    expect($('rc-selection-text').textContent).toContain('or an enemy to attack it');
    const truck = own().find((e) => e.kind === 'mast-truck')!;
    click(`rc-unit-${truck.id}`);
    expect($('rc-card-noweapon').textContent).toContain('none');
    expect($('rc-card').textContent).toContain('relay, radius 5');
    expect($('rc-selection-text').textContent).toContain('This unit has no weapon');
    // Unarmed: radio range as a meter instead of damage and range.
    expect([...$('rc-card-meters').querySelectorAll('dt')].map((dt) => dt.textContent)).toEqual(['Health', 'Radio', 'Speed', 'Vision']);
    // "More" is folded; once opened it stays open while the card is redrawn.
    const more = $('rc-card-more') as HTMLDetailsElement;
    expect(more.open).toBe(false);
    more.open = true;
    more.dispatchEvent(new Event('toggle'));
    click(`rc-unit-${rifle.id}`);
    expect(($('rc-card-more') as HTMLDetailsElement).open).toBe(true);
    click(`rc-unit-${truck.id}`);
    // Ordering the truck to attack is refused with a specific reason.
    const foe = spotEnemy();
    click(`rc-unit-${truck.id}`);
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 12 * CELL, height: 12 * CELL, right: 12 * CELL, bottom: 12 * CELL, x: 0, y: 0, toJSON: () => ({}) });
    map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: foe.x * CELL + 5, clientY: foe.y * CELL + 5 }));
    expect($('rc-notice').textContent).toContain('has no weapon');
  });

  it('has a legend with every terrain type and the map shapes', () => {
    const legend = $('rc-legend');
    for (const name of ['open ground', 'road', 'forest', 'hill', 'buildings', 'swamp', 'water', 'ridge']) expect(legend.textContent).toContain(name);
    expect(legend.textContent).toContain('move cost 6 · cover 25 %');
    expect(legend.textContent).toContain('impassable');
    expect(legend.textContent).toContain('Structure (a building, no wheels)');
    expect(legend.querySelectorAll('li').length).toBeGreaterThanOrEqual(16);
  });

  it('lets the player choose map and length until the first turn is locked', () => {
    expect($('rc-setup').hidden).toBe(false);
    expect($('rc-turn').textContent).toBe('Turn 1');
    const limit = $('rc-turn-limit') as HTMLSelectElement;
    limit.value = '12';
    limit.dispatchEvent(new Event('change'));
    expect(state().turnLimit).toBe(12);
    expect($('rc-turn').textContent).toBe('Turn 1 of 12');
    const scenario = $('rc-scenario') as HTMLSelectElement;
    scenario.value = 'ridge-valley';
    scenario.dispatchEvent(new Event('change'));
    expect(state().scenario).toBe('ridge-valley');
    expect(state().turnLimit).toBe(12);
    expect($('rc-map').getAttribute('data-cols')).toBe('20');
    expect(ctx.context.root.querySelectorAll('[data-testid^="rc-unit-"]')).toHaveLength(15);
    click('rc-lock');
    // Locked, the setup folds into one closed line (map and length) that opens on demand.
    const fold = $('rc-setup-fold') as HTMLDetailsElement;
    expect(fold.open).toBe(false);
    expect(fold.contains($('rc-setup'))).toBe(true);
    expect($('rc-setup-summary').textContent).toBe('Ridge Valley (20×14, 14 units per side, with a Command Vehicle) · 12 turns, then strength decides · Normal (thinks one turn ahead)');
    expect(($('rc-scenario') as HTMLSelectElement).disabled).toBe(true);
    expect(($('rc-turn-limit') as HTMLSelectElement).disabled).toBe(true);
  });

  it('offers "Deposits never run dry" until the first turn: the game starts afresh with it, the map and the summary tell it', () => {
    const box = $('rc-endless') as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(box.closest('label')!.textContent).toBe('Deposits never run dry');
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    expect(state().endless).toBe(true);
    expect((state().world.map.deposits ?? []).every((d) => d.endless)).toBe(true);
    // The cell description tells it in words (also where the deposit is not observed).
    const post = own().find((e) => e.kind === 'command-post')!;
    const deposit = state().world.map.deposits![0]!;
    for (let i = 0; i < Math.abs(deposit.x - post.x); i++) key(deposit.x > post.x ? 'ArrowRight' : 'ArrowLeft');
    for (let i = 0; i < Math.abs(deposit.y - post.y); i++) key(deposit.y > post.y ? 'ArrowDown' : 'ArrowUp');
    expect($('rc-cursor').textContent).toContain('Deposit: never runs dry.');
    expect($('rc-legend').textContent).toContain('Endless deposit (diamond in a ring): never runs dry');
    // Another map keeps the option; after the first turn it is locked and in the summary.
    const scenario = $('rc-scenario') as HTMLSelectElement;
    scenario.value = 'ridge-valley';
    scenario.dispatchEvent(new Event('change'));
    expect(state().endless).toBe(true);
    click('rc-lock');
    expect(box.disabled).toBe(true);
    expect($('rc-setup-summary').textContent).toContain(' · endless deposits');
    // Restored from the save, the option shows as it was.
    const saved = state();
    setup();
    instance.restore(saved);
    expect(($('rc-endless') as HTMLInputElement).checked).toBe(true);
  });

  it('the opponent level is chosen in the setup with the map (owner decision 2026-10-16); locked after the first turn', () => {
    const level = $('rc-difficulty') as HTMLSelectElement;
    expect(level.value).toBe('normal');
    expect([...level.options].map((o) => o.value)).toEqual(['easy', 'normal', 'hard']);
    const units = state().world.entities.length;
    level.value = 'hard';
    level.dispatchEvent(new Event('change'));
    expect(state().difficulty).toBe('hard');
    expect(state().world.entities).toHaveLength(units); // the map stays as it is
    expect(ctx.difficulties).toEqual(['normal', 'hard']); // the host follows (its next "New game", the save envelope)
    vi.advanceTimersByTime(50);
    expect(ctx.context.root.textContent).toContain('Opponent: Hard (thinks ahead, uses jamming).');
    // Another map keeps the chosen level.
    const scenario = $('rc-scenario') as HTMLSelectElement;
    scenario.value = 'ridge-valley';
    scenario.dispatchEvent(new Event('change'));
    expect(state().difficulty).toBe('hard');
    expect(level.value).toBe('hard');
    click('rc-lock');
    expect(level.disabled).toBe(true);
    expect($('rc-setup-summary').textContent).toContain(' · Hard (thinks ahead, uses jamming)');
    // A save restores its level into the select and reports it to the host.
    const saved = state();
    setup();
    instance.restore(saved);
    expect(($('rc-difficulty') as HTMLSelectElement).value).toBe('hard');
    expect(ctx.difficulties.at(-1)).toBe('hard');
  });

  it('with no computer seat (hot-seat only) there is no opponent level: the control is hidden and not in the summary (review of PR #49)', () => {
    expect($('rc-difficulty-label').hidden).toBe(false);
    const person = $('rc-seat-1-person') as HTMLInputElement;
    person.checked = true;
    person.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state().seats).not.toContain('computer');
    expect($('rc-difficulty-label').hidden).toBe(true);
    const computer = $('rc-seat-1-computer') as HTMLInputElement;
    computer.checked = true;
    computer.dispatchEvent(new Event('change', { bubbles: true }));
    expect($('rc-difficulty-label').hidden).toBe(false);
    person.checked = true;
    person.dispatchEvent(new Event('change', { bubbles: true }));
    click('rc-lock'); // A locks; the device passes to B, who locks too; then the turn runs
    click('rc-handover-confirm');
    click('rc-lock');
    click('rc-handover-confirm');
    expect(state().log.length).toBeGreaterThan(0);
    expect($('rc-setup-summary').textContent).not.toContain('Normal');
    expect($('rc-setup-summary').textContent).not.toContain(' · ·');
  });

  it('offers a random map: size and map number pick it, "New map" draws another; the same number gives it back; locked after the first turn', () => {
    expect($('rc-random').hidden).toBe(true);
    const scenario = $('rc-scenario') as HTMLSelectElement;
    scenario.value = 'random';
    scenario.dispatchEvent(new Event('change'));
    expect($('rc-random').hidden).toBe(false);
    const first = state().random!;
    expect(first).toMatchObject({ w: 16, h: 12 });
    expect(state().map!.name).toBe(`Random map 16×12 · No. ${first.seed}`);
    expect($('rc-map').getAttribute('data-cols')).toBe('16');
    // Another size.
    const size = $('rc-random-size') as HTMLSelectElement;
    size.value = '24x16';
    size.dispatchEvent(new Event('change'));
    expect(state().random).toEqual({ w: 24, h: 16, seed: first.seed });
    expect($('rc-map').getAttribute('data-cols')).toBe('24');
    // "New map" draws the next number; typing the old one brings the old map back.
    const old = state().map;
    click('rc-random-new');
    expect(state().random!.seed).not.toBe(first.seed);
    expect(state().map!.terrain).not.toBe(old!.terrain);
    const seed = $('rc-random-seed') as HTMLInputElement;
    seed.value = String(first.seed);
    seed.dispatchEvent(new Event('change'));
    expect(state().map).toEqual(old);
    // Any number is read as the generator reads it: fractions dropped, wrapped modulo 2^32.
    seed.value = String(2 ** 32 + first.seed + 0.6);
    seed.dispatchEvent(new Event('change'));
    expect(state().random!.seed).toBe(first.seed);
    expect(seed.value).toBe(String(first.seed));
    expect(scenario.value).toBe('random');
    // Empty or not a number keeps the map being played; a negative number wraps; the field shows the number used.
    const keep = state().map;
    for (const typed of ['', '   ']) {
      seed.value = typed;
      seed.dispatchEvent(new Event('change'));
      expect(state().random!.seed).toBe(first.seed);
      expect(state().map).toEqual(keep);
      expect(seed.value).toBe(String(first.seed));
    }
    seed.value = '-1';
    seed.dispatchEvent(new Event('change'));
    expect(state().random!.seed).toBe(2 ** 32 - 1);
    expect(seed.value).toBe(String(2 ** 32 - 1));
    seed.value = '7.9';
    seed.dispatchEvent(new Event('change'));
    expect(state().random!.seed).toBe(7);
    expect(seed.value).toBe('7');
    seed.value = String(first.seed);
    seed.dispatchEvent(new Event('change'));
    // The sizes are announced in words.
    expect([...size.options].map((o) => o.getAttribute('aria-label'))).toEqual(['12 by 10', '16 by 12', '20 by 14', '24 by 16']);
    // The map editor opens the map being played.
    click('rc-editor-open');
    expect(state().edit!.map).toEqual(old);
    click('ed-close');
    click('rc-lock');
    expect(size.disabled && seed.disabled && ($('rc-random-new') as HTMLButtonElement).disabled).toBe(true);
    expect($('rc-setup-summary').textContent).toContain(`Random map 24×16 · No. ${first.seed}`);
  });

  it('a random map for two or three opponents has four bases, one per corner; one opponent goes back to two sides; the editor opens on it', () => {
    const scenario = $('rc-scenario') as HTMLSelectElement;
    scenario.value = 'random';
    scenario.dispatchEvent(new Event('change'));
    const opponents = $('rc-opponents') as HTMLSelectElement;
    expect($('rc-opponents-label').hidden).toBe(false);
    expect([...opponents.options].map((o) => o.value)).toEqual(['1', '2', '3']);
    expect(state().map!.seats).toBeUndefined();
    const { seed } = state().random!;
    opponents.value = '3';
    opponents.dispatchEvent(new Event('change'));
    expect(state().opponents).toBe(3);
    expect(state().map!.seats).toBe(4);
    expect(state().random).toEqual({ w: 16, h: 12, seed });
    expect(state().world.sides).toBe(4);
    expect(scenario.value).toBe('random');
    // Two opponents: the same map, the fourth base a neutral post.
    const four = state().map;
    opponents.value = '2';
    opponents.dispatchEvent(new Event('change'));
    expect(state().map).toEqual(four);
    expect(state().world.entities.some((e) => e.side === NEUTRAL && e.kind === 'command-post')).toBe(true);
    // The map editor opens on the four-base map being played (four-base maps in the editor, 2026-10-24).
    click('rc-editor-open');
    expect(state().edit!.map).toEqual(four);
    click('ed-close');
    opponents.value = '1';
    opponents.dispatchEvent(new Event('change'));
    expect(state().map!.seats).toBeUndefined();
    expect(state().world.sides).toBe(2);
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
    // A ghost (the enemy post, known from before the battle) takes a move order, not an attack.
    const post = enemies().find((e) => e.kind === 'command-post')!;
    at(post.x, post.y);
    expect(state().draft[0]!.order).toEqual({ type: 'move', x: post.x, y: post.y });
    const enemy = spotEnemy();
    at(unit.x, unit.y);
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
    expect($('rc-turn').textContent).toBe('Turn 2');
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

  it('in a quick match the turn line warns of a stalemate from three turns on; a stalemate end says so; the host learns the level', () => {
    expect(ctx.difficulties).toEqual(['normal']); // newGame without a known level fell back to 'normal'
    // Only the two posts left: from CONTACT_TURN on, nothing changes and the stalemate rule counts.
    let s: RcState = { ...state(), turnLimit: null, quick: true, difficulty: 'hard', world: withoutMobileUnits(state().world) };
    while (s.phase === 'plan' && stalemateTurns(s) < 2) s = lockTurn(s);
    instance.restore(s);
    expect($('rc-turn').textContent).toBe(`Turn ${s.world.turn + 1}`);
    s = lockTurn(s);
    instance.restore(s);
    expect($('rc-turn').textContent).toBe(`Turn ${s.world.turn + 1}`);
    expect($('rc-stalemate-text').textContent).toBe(`Stalemate: strength decides after turn ${s.world.turn + STALL_TURNS - 3}`);
    expect(($('rc-settle') as HTMLButtonElement).hidden).toBe(true); // a quick match decides on its own
    expect(ctx.difficulties).toEqual(['normal', 'hard', 'hard']);
    // A turn limit has no stalemate rule.
    instance.restore({ ...s, turnLimit: 100 });
    expect($('rc-turn').textContent).toBe(`Turn ${s.world.turn + 1} of 100`);
    while (s.phase === 'plan') s = lockTurn(s);
    // The opponent builds an Extractor with its post and pulls ahead on income; the player never gains ground.
    expect(s).toMatchObject({ phase: 'finished', result: 'lost' });
    expect(stalemateTurns(s)).toBe(STALL_TURNS);
    instance.restore(s);
    expect($('rc-status').textContent).toBe(
      `The opponent is stronger, and you did not gain ground for ${STALL_TURNS} turns (${sideValue(s.world, PLAYER)} : ${sideValue(s.world, OPPONENT)}).`
    );
  });

  it('a stalled plain open end offers to end on strength (two presses), and the result says so', () => {
    let s: RcState = { ...state(), turnLimit: null, quick: false, world: withoutMobileUnits(state().world) };
    instance.restore(s);
    expect(($('rc-settle') as HTMLButtonElement).hidden).toBe(true);
    while (s.phase === 'plan' && stalemateTurns(s) < STALL_TURNS) s = lockTurn(s);
    expect(s.phase).toBe('plan'); // nothing forces the end
    instance.restore(s);
    const btn = $('rc-settle') as HTMLButtonElement;
    expect(btn.hidden).toBe(false);
    expect($('rc-stalemate-text').textContent).toBe(`Turns without progress: ${STALL_TURNS}`);
    const score = `(${sideValue(s.world, PLAYER)} : ${sideValue(s.world, OPPONENT)})`;
    expect(btn.textContent).toBe(`End now: you lose ${score}`); // the opponent built an Extractor
    btn.click();
    expect(state().phase).toBe('plan');
    expect(($('rc-settle') as HTMLButtonElement).textContent).toBe('Press again to end the game');
    // A second press right after arming (a quick double tap, a held Enter) does not count.
    ($('rc-settle') as HTMLButtonElement).click();
    expect(state().phase).toBe('plan');
    later();
    ($('rc-settle') as HTMLButtonElement).click();
    expect(state()).toMatchObject({ phase: 'finished', result: 'lost', settled: true });
    expect($('rc-status').textContent).toBe(`You ended the game on strength; the opponent was stronger ${score}.`);
  });

  it('shows Supply and income, lets a yard queue units (paid from the planned Supply) and cancel them', () => {
    expect($('rc-supply').textContent).toBe('Supply 300 (+20)');
    const yard = own().find((e) => e.kind === 'muster')!;
    click(`rc-unit-${yard.id}`);
    expect($('rc-selection-text').textContent).toContain('Queue units below');
    expect($('rc-jobs').hidden).toBe(false);
    expect($('rc-job-rifles').getAttribute('aria-label')).toBe('Rifle Squad · 40 Supply · build time (turns): 1');
    expect($('rc-job-rifles').querySelector('canvas.rc-icon')).not.toBeNull(); // a picture of the unit
    expect($('rc-job-rifles').textContent).toBe('Rifle Squad40 · ⌛1');
    expect($('rc-card-cost').textContent).toContain('100 Supply');
    click('rc-job-rifles');
    click('rc-job-lancer');
    expect(state().draft.map((c) => c.order)).toEqual([{ type: 'produce', kind: 'rifles' }, { type: 'produce', kind: 'lancer' }]);
    expect($('rc-supply').textContent).toBe('Supply 300 → 200 (+20)');
    expect($('rc-slots').textContent).toBe('Planning: 2/4');
    expect($('rc-jobs').textContent).toContain('Planned: Rifle Squad');
    // A third one does not fit the queue of two.
    click('rc-job-rifles');
    expect($('rc-notice').textContent).toBe('The production queue is full (two units).');
    expect(state().draft).toHaveLength(2);
    click('rc-job-cancel-0');
    expect(state().draft.map((c) => c.order)).toEqual([{ type: 'produce', kind: 'lancer' }]);
    // Locking: the lancer stands next to the yard at the end of the turn, told in the summary.
    click('rc-lock');
    expect(own().filter((e) => e.kind === 'lancer')).toHaveLength(2);
    expect($('rc-summary').textContent).toContain('Finished: Anti-tank Team');
    expect($('rc-summary').textContent).toContain('Income: +20 Supply');
  });

  it('a yard repairs a damaged unit next to it (half price, at once); a structure is sold after two presses', () => {
    const s = structuredClone(state());
    const yard = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'muster')!;
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    const free = (x: number, y: number) => passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y);
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => [yard.x + dx!, yard.y + dy!] as const).find(([x, y]) => free(x, y))!;
    Object.assign(rifle, { x: spot[0], y: spot[1], hp: 10 });
    for (const r of s.world.intel?.[PLAYER] ?? []) if (r.id === rifle.id) Object.assign(r, { x: spot[0], y: spot[1], hp: 10 });
    instance.restore(s);
    click(`rc-unit-${yard.id}`);
    const arch = RULESET.archetypes.rifles!;
    const price = Math.ceil((arch.cost * (arch.hp - 10)) / arch.hp / 2);
    expect($(`rc-repair-${rifle.id}`).textContent).toContain(`10/${arch.hp} · ${price}`);
    expect($(`rc-repair-${rifle.id}`).getAttribute('aria-label')).toBe(`Repair ${rifle.kind === 'rifles' ? 'Rifle Squad' : ''} ${rifle.id}: health 10 of ${arch.hp}, ${price} Supply`);
    click(`rc-repair-${rifle.id}`);
    expect(state().draft).toEqual([{ side: PLAYER, unit: yard.id, order: { type: 'repair', target: rifle.id } }]);
    expect($('rc-supply').textContent).toBe(`Supply 300 → ${300 - price} (+20)`);
    expect(ctx.context.root.querySelector(`[data-testid="rc-repair-${rifle.id}"]`)).toBeNull(); // planned once
    // Selling: the first press shows the refund, the second plans it.
    expect($('rc-sell').textContent).toBe('Sell (+50 Supply)');
    click('rc-sell');
    expect($('rc-sell').textContent).toBe('Press again to sell (+50 Supply)');
    expect(state().draft).toHaveLength(1);
    // The second click of a double-click is not a deliberate second press.
    $('rc-sell').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 }));
    expect(state().draft).toHaveLength(1);
    // Nor is a press right after arming (a double tap 80 ms apart has detail 1, a held Enter detail 0).
    click('rc-sell');
    expect(state().draft).toHaveLength(1);
    later();
    click('rc-sell');
    expect(state().draft.map((c) => c.order.type)).toEqual(['repair', 'sell']);
    expect($('rc-jobs').textContent).toContain('Planned: sell (+50 Supply)');
    // Planned for sale: no more production or repair offered there.
    expect(ctx.context.root.querySelector('[data-testid="rc-job-rifles"]')).toBeNull();
    expect(ctx.context.root.querySelector('[data-testid="rc-repair"]')).toBeNull();
    click('rc-lock');
    expect(state().world.entities.find((e) => e.id === rifle.id)?.hp).toBe(arch.hp);
    expect(state().world.entities.some((e) => e.id === yard.id)).toBe(false);
    expect($('rc-summary').textContent).toContain('repaired (+30 health)');
    expect($('rc-summary').textContent).toContain('sold (+50 Supply)');
    // The Command Post cannot be sold.
    click(`rc-unit-${own().find((e) => e.kind === 'command-post')!.id}`);
    expect(ctx.context.root.querySelector('[data-testid="rc-sell"]')).toBeNull();
  });

  it('an armed sale does not survive the turn; a disabled structure offers no sale; the shown refund includes planned production', () => {
    const yard = own().find((e) => e.kind === 'muster')!;
    click(`rc-unit-${yard.id}`);
    click('rc-job-rifles');
    expect($('rc-sell').textContent).toBe(`Sell (+${50 + RULESET.archetypes.rifles!.cost} Supply)`);
    click('rc-sell');
    expect($('rc-sell').textContent).toContain('Press again');
    click('rc-lock');
    click(`rc-unit-${yard.id}`);
    expect($('rc-sell').textContent).toContain('Sell (+');
    expect($('rc-sell').textContent).not.toContain('Press again');
    const s = structuredClone(state());
    s.world.entities.find((e) => e.id === yard.id)!.status = [{ kind: 'disabled', ticks: 6 }];
    instance.restore(s);
    click(`rc-unit-${yard.id}`);
    expect(ctx.context.root.querySelector('[data-testid="rc-sell"]')).toBeNull();
  });

  it('defence towers (owner decision 2026-10-16): the post offers all four with price and time; a tower\'s card tells what it does; the legend and help name them', () => {
    const post = own().find((e) => e.kind === 'command-post')!;
    click(`rc-unit-${post.id}`);
    expect($('rc-job-tower-gun').getAttribute('aria-label')).toBe('Gun Tower · 90 Supply · build time (turns): 2');
    expect($('rc-job-tower-emp').getAttribute('aria-label')).toBe('EMP Tower · 130 Supply · build time (turns): 2');
    expect($('rc-job-tower-artillery').getAttribute('aria-label')).toBe('Artillery Tower · 150 Supply · build time (turns): 3');
    expect($('rc-job-tower-laser').getAttribute('aria-label')).toBe('Laser Tower · 160 Supply · build time (turns): 3');
    // A built EMP Tower: its card says it stuns, for how long.
    const s = structuredClone(state());
    // A cell the post could build on (free, passable, covered): the tower stands there.
    const cells = Array.from({ length: s.world.map.w * s.world.map.h }, (_, i) => ({ x: i % s.world.map.w, y: Math.floor(i / s.world.map.w) }));
    const free = cells.find((c) => validateCommand(s.world, RULESET, { side: 0, unit: post.id, order: { type: 'build', kind: 'tower-emp', x: c.x, y: c.y } }).ok)!;
    const id = s.world.nextId++;
    s.world.entities.push({ ...s.world.entities.find((e) => e.id === post.id)!, id, kind: 'tower-emp', hp: 120, x: free.x, y: free.y });
    s.world.intel = initialIntel(s.world, RULESET); // the side's own reports include it
    instance.restore(s);
    expect(state().world.entities.some((e) => e.id === id)).toBe(true); // a valid save
    click(`rc-unit-${id}`);
    expect($('rc-card-stun').textContent).toBe('Hits stun: the target can neither move nor fire for one turn.');
    // Rates per turn, not per tick (owner, 2026-10-18): 6 ticks a turn, the EMP Tower every 4: 1.5 shots.
    expect($('rc-card-rate').textContent).toBe('1.5× per turn · pulse (lands a moment later on the target’s cell and its neighbours)');
    expect($('rc-legend-kinds').textContent).toContain('Laser Tower');
    expect(ctx.context.root.textContent).toContain('Defence tower (a turret on a pedestal)');
    expect(ctx.context.root.textContent).toContain('Defence towers are placed by the Command Post');
  });

  it('muzzle flash (owner decision 2026-10-17): an unseen enemy that fired at the player is named in the summary and marked on its cell', () => {
    const s = structuredClone(state());
    const seen = new Set((s.world.intel?.[PLAYER] ?? []).filter((r) => r.live).map((r) => r.id));
    const gun = s.world.entities.find((e) => e.side === OPPONENT && !seen.has(e.id) && e.kind !== 'command-post')!;
    s.events = [...s.events, { t: 'flash', tick: s.world.tick, id: gun.id, side: OPPONENT, kind: gun.kind, x: gun.x, y: gun.y }, { t: 'flash', tick: s.world.tick, id: gun.id, side: OPPONENT, kind: gun.kind, x: gun.x, y: gun.y }];
    instance.restore(s);
    const lines = [...$('rc-summary').querySelectorAll('li')].map((li) => li.textContent ?? '');
    const told = lines.filter((l) => l.startsWith('Fired on by an unseen'));
    expect(told).toHaveLength(1); // once per shooter
    expect(told[0]).toMatch(new RegExp(`^Fired on by an unseen [A-Z][\\w -]+ from ${gun.x + 1}, ${gun.y + 1} \\(marked on the map\\)\\.$`));
    // The cell tells it in words (screen readers): click it on the map.
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 12 * CELL, height: 12 * CELL, right: 12 * CELL, bottom: 12 * CELL, x: 0, y: 0, toJSON: () => ({}) });
    map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: gun.x * CELL + 5, clientY: gun.y * CELL + 5 }));
    expect($('rc-cursor').textContent).toContain('Muzzle flash: an unseen');
    expect(ctx.context.root.textContent).toContain('Muzzle flash (burst)');
    expect(ctx.context.root.textContent).toContain('its muzzle flash gives it away');
    // Once the game is over everything is revealed: no flash marks then.
    instance.restore({ ...s, phase: 'finished', result: 'lost' });
    map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: gun.x * CELL + 5, clientY: gun.y * CELL + 5 }));
    expect($('rc-cursor').textContent).not.toContain('Muzzle flash');
  });

  it('direction finding (owner choice 2026-10-27): an enemy whose order was intercepted is named once and its last tracked cell marked while unseen', () => {
    const s = structuredClone(state());
    const seen = new Set((s.world.intel?.[PLAYER] ?? []).filter((r) => r.live).map((r) => r.id));
    const enemy = s.world.entities.find((e) => e.side === OPPONENT && !seen.has(e.id) && e.kind !== 'command-post')!;
    const finder = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'tracer')!;
    // The last report, a ghost now, stands where the fix is marked.
    const ghost = { id: enemy.id, side: OPPONENT, kind: enemy.kind, x: enemy.x, y: enemy.y, hp: enemy.hp, tick: s.world.tick, live: false };
    s.world.intel![PLAYER] = [...s.world.intel![PLAYER]!.filter((r) => r.id !== enemy.id), ghost].sort((a, b) => a.id - b.id);
    const ev = { t: 'intercept' as const, tick: s.world.tick, id: enemy.id, side: OPPONENT, kind: enemy.kind, x: enemy.x, y: enemy.y, by: finder.id, to: PLAYER };
    s.events = [...s.events, ev, { ...ev }];
    instance.restore(s);
    const lines = [...$('rc-summary').querySelectorAll('li')].map((li) => li.textContent ?? '');
    const told = lines.filter((l) => l.startsWith('Direction Finder: an order'));
    expect(told).toHaveLength(1);
    expect(told[0]).toContain(`at ${enemy.x + 1}, ${enemy.y + 1} was intercepted`);
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 12 * CELL, height: 12 * CELL, right: 12 * CELL, bottom: 12 * CELL, x: 0, y: 0, toJSON: () => ({}) });
    map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: enemy.x * CELL + 5, clientY: enemy.y * CELL + 5 }));
    expect($('rc-cursor').textContent).toContain('Fix: an enemy');
    expect(ctx.context.root.textContent).toContain('Fix (crosshair)');
    expect(ctx.context.root.textContent).toContain('every order is a radio message');
    // Seen again (live): drawn as a unit, no fix mark.
    s.world.intel![PLAYER] = s.world.intel![PLAYER]!.map((r) => (r.id === enemy.id ? { ...r, live: true } : r));
    instance.restore(s);
    map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: enemy.x * CELL + 5, clientY: enemy.y * CELL + 5 }));
    expect($('rc-cursor').textContent).not.toContain('Fix: an enemy');
  });

  it('lets the Command Post place an Extractor on a deposit inside coverage and explains a bad cell', () => {
    const post = own().find((e) => e.kind === 'command-post')!;
    click(`rc-unit-${post.id}`);
    expect($('rc-selection-text').textContent).toContain('Place structures below');
    click('rc-job-extractor');
    expect($('rc-placing').textContent).toBe('Choose a deposit inside your coverage for the Extractor.');
    expect($('rc-job-extractor').getAttribute('aria-pressed')).toBe('true');
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: 12 * CELL, height: 12 * CELL, right: 12 * CELL, bottom: 12 * CELL, x: 0, y: 0, toJSON: () => ({}) });
    const place = (x: number, y: number) => map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x * CELL + 5, clientY: y * CELL + 5 }));
    // The deposit behind the enemy post lies outside coverage: refused with the reason, still placing.
    const far = state().world.map.deposits!.find((d) => d.x === 7 && d.y === 1)!;
    place(far.x, far.y);
    // The cell is described in words, deposit included; its remainder is unknown while unobserved.
    expect($('rc-cursor').textContent).toContain('Deposit (amount left unknown: not observed).');
    expect($('rc-notice').hidden).toBe(false);
    expect($('rc-notice').textContent).toContain('Not here');
    expect(state().draft).toHaveLength(0);
    expect($('rc-placing')).not.toBeNull();
    // The deposit behind the own post is inside coverage.
    const near = state().world.map.deposits!.find((d) => d.x === 4 && d.y === 10)!;
    place(near.x, near.y);
    expect($('rc-cursor').textContent).toContain('Deposit: 300 Supply left.');
    expect(state().draft.map((c) => c.order)).toEqual([{ type: 'build', kind: 'extractor', x: near.x, y: near.y }]);
    // A second placement on the planned site's cell is refused while planning.
    click('rc-job-extractor');
    place(near.x, near.y);
    expect(state().draft).toHaveLength(1);
    expect($('rc-notice').textContent).toContain('Not here');
    click('rc-placing-stop');
    expect($('rc-jobs').textContent).toContain(`Planned: Extractor at ${near.x + 1}, ${near.y + 1}`);
    expect($('rc-placing')).toBeNull();
    click('rc-lock');
    const site = own().find((e) => e.kind === 'extractor')!;
    expect(site).toMatchObject({ x: near.x, y: near.y, build: 1 });
    expect($(`rc-unit-${site.id}`).textContent).toContain('under construction, turns left: 1');
    click(`rc-unit-${site.id}`);
    expect($('rc-selection-text').textContent).toContain('Under construction (turns left: 1)');
    expect($('rc-jobs').hidden).toBe(true);
    click('rc-lock');
    expect($('rc-summary').textContent).toContain('Built: Extractor');
    expect($('rc-supply').textContent).toBe(`Supply ${300 - 80 + 20 + 20} (+35)`);
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

describe('own ghosts (owner report)', () => {
  it('with a unit selected, a click on the cell of an own ghost moves it there instead of selecting the ghost', () => {
    const s = structuredClone(state());
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    const other = s.world.entities.filter((e) => e.side === PLAYER && e.kind === 'rifles')[1] ?? s.world.entities.find((e) => e.side === PLAYER && e.kind === 'lancer')!;
    // The rifle squad's report sits elsewhere (out of contact): its ghost marks a free cell.
    const free = (x: number, y: number) => passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y);
    const spot = [[2, 0], [0, 2], [-2, 0], [0, -2], [3, 0], [0, 3]].map(([dx, dy]) => [other.x + dx!, other.y + dy!] as const).find(([x, y]) => free(x, y))!;
    const r = s.world.intel![PLAYER]!.find((e) => e.id === rifle.id)!;
    Object.assign(r, { x: spot[0], y: spot[1], live: false });
    // The squad itself is far away, out of contact (in the enemy's corner).
    const far = [...Array(s.world.map.w * s.world.map.h).keys()].map((c) => [c % s.world.map.w, Math.floor(c / s.world.map.w)] as const).reverse().find(([x, y]) => free(x, y))!;
    Object.assign(rifle, { x: far[0], y: far[1] });
    instance.restore(s);
    expect($(`rc-unit-${rifle.id}`).textContent).toContain('last'); // shown as out of contact
    click(`rc-unit-${other.id}`);
    const map = $('rc-map');
    map.getBoundingClientRect = () => ({ left: 0, top: 0, width: s.world.map.w * CELL, height: s.world.map.h * CELL, right: s.world.map.w * CELL, bottom: s.world.map.h * CELL, x: 0, y: 0, toJSON: () => ({}) });
    map.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: spot[0] * CELL + 5, clientY: spot[1] * CELL + 5 }));
    expect(state().draft).toEqual([expect.objectContaining({ unit: other.id, order: { type: 'move', x: spot[0], y: spot[1] } })]);
  });
});

describe('Relay Command map editor', () => {
  /** The map library is asynchronous: let its promises settle. */
  const settle = async () => {
    await vi.runAllTimersAsync();
    for (let k = 0; k < 20; k++) await Promise.resolve();
  };
  const edKey = (k: string) => $('ed-map').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const moveTo = (x: number, y: number) => {
    for (let i = 0; i < 30; i++) edKey('ArrowLeft');
    for (let i = 0; i < 20; i++) edKey('ArrowUp');
    for (let i = 0; i < x; i++) edKey('ArrowRight');
    for (let i = 0; i < y; i++) edKey('ArrowDown');
  };

  it('opens from the setup, edits with the keyboard (mirrored), tells what is missing, saves, survives a restore and plays the map', async () => {
    click('rc-editor-open');
    await settle();
    expect($('rc-editor').hidden).toBe(false);
    expect($('rc-map').closest('[hidden]')).not.toBeNull(); // the game waits behind the editor
    expect(state().edit).toMatchObject({ slot: null, mirror: true });
    expect($('ed-issues').textContent).toContain('Place exactly one Command Post for you.');
    // A Command Post and a Rifle Squad for you; mirroring gives the opponent the same.
    click('ed-tool-command-post');
    moveTo(1, 9);
    edKey('Enter');
    expect($('ed-cursor').textContent).toBe('Cell 2, 10: open ground · You (blue): Command Post');
    click('ed-tool-rifles');
    moveTo(2, 9);
    edKey(' ');
    expect(state().edit!.map.units).toEqual([
      { side: 0, kind: 'command-post', x: 1, y: 9 },
      { side: 0, kind: 'rifles', x: 2, y: 9 },
      { side: 1, kind: 'rifles', x: 13, y: 2 },
      { side: 1, kind: 'command-post', x: 14, y: 2 }
    ]);
    expect($('ed-ok').textContent).toBe('Ready to play.');
    expect($('ed-fair').textContent).toContain('Point-symmetric');
    // Name and save: the map goes into the device's maps (preferences).
    const name = $('ed-name') as HTMLInputElement;
    name.value = 'Duel';
    name.dispatchEvent(new Event('change'));
    click('ed-save');
    await settle();
    expect($('ed-notice').textContent).toBe('Saved: Duel.');
    expect(state().edit!.slot).toBe(0);
    expect((await ctx.library!.list()).map((e) => e.id)).toEqual(['slot-0']); // the host's library (Settings counts it)
    expect($('ed-library').textContent).toContain('Duel (16×12)');
    // Closing and reopening the game keeps the draft (it is part of the state).
    const saved = state();
    setup();
    instance.restore(saved);
    expect($('rc-editor').hidden).toBe(false);
    expect(state().edit!.map.name).toBe('Duel');
    // Play: a new game on the map; the setup offers it among the maps.
    click('ed-play');
    expect(state()).toMatchObject({ scenario: 'custom', edit: null });
    expect(state().map!.name).toBe('Duel');
    expect($('rc-editor').hidden).toBe(true);
    expect([...($('rc-scenario') as HTMLSelectElement).options].map((o) => o.textContent)).toContain('Duel');
    click('rc-lock');
    expect($('rc-setup-summary').textContent).toContain('Duel');
  });

  it('four bases: the editor makes a map with a base in each corner (mirrored four ways), names the bases A to D and plays it with three opponents', async () => {
    click('rc-editor-open');
    await settle();
    const bases = $('ed-bases') as HTMLSelectElement;
    expect(bases.value).toBe('2');
    bases.value = '4';
    bases.dispatchEvent(new Event('change'));
    expect(state().edit!.map.seats).toBe(4);
    expect(['ed-side-0', 'ed-side-1', 'ed-side-2', 'ed-side-3'].map((id) => $(id).textContent)).toEqual(['Base A (you, blue)', 'Base B', 'Base C', 'Base D']);
    click('ed-tool-command-post');
    moveTo(2, 9);
    edKey('Enter');
    click('ed-tool-rifles');
    moveTo(3, 9);
    edKey('Enter');
    expect(state().edit!.map.units.filter((u) => u.kind === 'command-post').map((u) => u.side).sort()).toEqual([0, 1, 2, 3]);
    expect($('ed-ok').textContent).toBe('Ready to play.');
    expect($('ed-fair').textContent).toBe('Mirrored both ways: every base starts equal.');
    moveTo(13, 2);
    expect($('ed-cursor').textContent).toBe('Cell 14, 3: open ground · Base C: Command Post');
    click('ed-play');
    expect(state().map!.seats).toBe(4);
    expect(state().opponents).toBe(3);
    expect(state().world.sides).toBe(4);
    expect([...($('rc-opponents') as HTMLSelectElement).options].map((o) => o.value)).toEqual(['1', '2', '3']);
    expect($('rc-teams-label').hidden).toBe(false);
    // The editor opens on the four-base map being played; back to two bases drops bases C and D.
    click('rc-editor-open');
    expect(state().edit!.map.seats).toBe(4);
    ($('ed-bases') as HTMLSelectElement).value = '2';
    $('ed-bases').dispatchEvent(new Event('change'));
    expect(state().edit!.map.seats).toBeUndefined();
    expect(state().edit!.map.units.every((u) => u.side < 2)).toBe(true);
  });

  it('asymmetric maps: each base its own Supply at the start; with four bases a map for teams (base A alone against three); Bastion opens as it is', async () => {
    click('rc-editor-open');
    await settle();
    const supply = (seat: number) => $(`ed-supply-${seat}`) as HTMLSelectElement;
    const choose = (select: HTMLSelectElement, value: string) => {
      select.value = value;
      select.dispatchEvent(new Event('change'));
    };
    // Two sides: one choice each, named as the sides are; the usual 300 to start with; no teams.
    expect($('ed-supply').querySelector('legend')!.textContent).toBe('Supply at the start');
    expect([...$('ed-supply').querySelectorAll('label > span')].map((x) => x.textContent)).toEqual(['You (blue)', 'Opponent (red)']);
    expect([supply(0).value, supply(1).value]).toEqual(['300', '300']);
    expect([...supply(0).options].map((o) => o.value)).toEqual(['0', '150', '300', '600', '1000', '1500', '3000']);
    expect($('ed-teams').closest('label')!.hidden).toBe(true);
    choose(supply(1), '1500');
    expect(state().edit!.map.supply).toEqual([300, 1500]);
    expect($('ed-fair').textContent).toBe('Not symmetric: one side may start better off.');
    // Four bases: a choice per base; base A alone against three.
    choose($('ed-bases') as HTMLSelectElement, '4');
    expect([...$('ed-supply').querySelectorAll('label > span')].map((x) => x.textContent)).toEqual(['Base A (you, blue)', 'Base B', 'Base C', 'Base D']);
    expect([0, 1, 2, 3].map((seat) => supply(seat).value)).toEqual(['300', '1500', '300', '300']);
    expect($('ed-teams').closest('label')!.hidden).toBe(false);
    ($('ed-teams') as HTMLInputElement).checked = true;
    $('ed-teams').dispatchEvent(new Event('change'));
    expect(state().edit!.map.teams).toBe(true);
    expect($('ed-fair').textContent).toBe('Made for teams: base A stands alone against three; it is played only as 1 against 3 or 3 against 1.');
    // Bastion is among the maps to start from, and opens made for teams with its Supply.
    ($('ed-start') as HTMLSelectElement).value = 'bastion';
    click('ed-load');
    later();
    click('ed-load');
    expect(state().edit!.map).toMatchObject({ seats: 4, teams: true, supply: [1500, 300, 300, 300] });
    expect(supply(0).value).toBe('1500');
    expect(($('ed-teams') as HTMLInputElement).checked).toBe(true);
    // Played: three opponents, only the two team shapes, 1 against 3 first; base A's Supply is the player's.
    click('ed-play');
    expect(state().opponents).toBe(3);
    expect([...($('rc-teams') as HTMLSelectElement).options].map((o) => o.value)).toEqual(['1v3', '3v1']);
    expect(state().world.teams).toEqual([0, 1, 1, 1]);
    expect(state().world.supply).toEqual([1500, 300, 300, 300]);
  });

  it('places plain, rich and endless deposits; on a deposit the tool sets its size; the cell tells which', async () => {
    click('rc-editor-open');
    await settle();
    for (const id of ['ed-tool-deposit', 'ed-tool-deposit-rich', 'ed-tool-deposit-endless']) expect($(id)).not.toBeNull();
    expect($('ed-tool-deposit-rich').textContent).toBe('Rich deposit (600)');
    click('ed-tool-deposit');
    moveTo(3, 4);
    edKey('Enter');
    expect($('ed-cursor').textContent).toBe('Cell 4, 5: open ground · deposit');
    click('ed-tool-deposit-rich');
    edKey('Enter');
    expect($('ed-cursor').textContent).toBe('Cell 4, 5: open ground · rich deposit');
    click('ed-tool-deposit-endless');
    edKey('Enter');
    expect($('ed-cursor').textContent).toBe('Cell 4, 5: open ground · endless deposit');
    // Mirrored by default: the opposite cell has the same size.
    expect(state().edit!.map.deposits).toEqual([{ x: 3, y: 4, size: 'endless' }, { x: 12, y: 7, size: 'endless' }]);
  });

  it('undoes the last change (one step, also a resize); a draft survives "New game"; a failed save says so', async () => {
    click('rc-editor-open');
    await settle();
    click('ed-tool-command-post');
    moveTo(1, 9);
    edKey('Enter');
    expect(state().edit!.map.units).toHaveLength(2);
    const width = $('ed-width') as HTMLSelectElement;
    width.value = '10';
    width.dispatchEvent(new Event('change'));
    expect(state().edit!.map.w).toBe(10);
    click('ed-undo');
    expect(state().edit!.map.w).toBe(16);
    expect(state().edit!.map.units).toHaveLength(2);
    expect(($('ed-undo') as HTMLButtonElement).disabled).toBe(true); // one step only
    instance.newGame({ seed: 9 });
    expect(state().edit!.map.units).toHaveLength(2);
    // The library refuses: no "Saved", but the reason and the way out (the map code).
    ctx.context.library!.put = () => Promise.reject(Object.assign(new Error('too-large'), { name: 'GameLibraryError', reason: 'too-large' }));
    click('ed-save');
    await settle();
    expect($('ed-notice').textContent).toBe('The map is too large to keep. Copy the map code to keep it.');
    expect(state().edit!.slot).toBeNull();
  });

  it('undo restores the whole draft (map and its saved place), and is forgotten when the editor closes', async () => {
    const name = (v: string) => {
      const input = $('ed-name') as HTMLInputElement;
      input.value = v;
      input.dispatchEvent(new Event('change'));
    };
    const load = (value: string) => {
      ($('ed-start') as HTMLSelectElement).value = value;
      expect(($('ed-start') as HTMLSelectElement).value).toBe(value);
      click('ed-load');
      later();
      click('ed-load');
    };
    click('rc-editor-open');
    await settle();
    name('A');
    click('ed-save');
    await settle(); // slot 0
    load('blank');
    name('B');
    click('ed-save');
    await settle(); // slot 1
    expect(state().edit!.slot).toBe(1);
    load('slot:0');
    expect(state().edit).toMatchObject({ slot: 0, map: expect.objectContaining({ name: 'A' }) });
    click('ed-undo');
    expect(state().edit).toMatchObject({ slot: 1, map: expect.objectContaining({ name: 'B' }) });
    click('ed-save');
    await settle();
    expect($('ed-library').textContent).toContain('A (16×12)');
    expect($('ed-library').textContent).toContain('B (16×12)');
    // Closing forgets the step: reopened, there is nothing to undo.
    name('B2');
    expect(($('ed-undo') as HTMLButtonElement).disabled).toBe(false);
    click('ed-close');
    click('rc-editor-open');
    await settle();
    expect(($('ed-undo') as HTMLButtonElement).disabled).toBe(true);
  });

  it('without a host library the maps stay in preferences; with one, maps from preferences move over once', async () => {
    const make = (extras: Parameters<typeof createTestContext>[3], seed?: (c: TestContext) => void) => {
      instance.dispose();
      ctx = createTestContext(game as GameModule<unknown>, 'en', document.createElement('div'), extras);
      seed?.(ctx);
      instance = game.create(ctx.context) as GameInstance<RcState>;
      instance.newGame({ seed: 4 });
    };
    make({ library: undefined });
    click('rc-editor-open');
    await settle();
    click('ed-save');
    await settle();
    expect($('ed-notice').textContent).toBe('Saved: Untitled map.');
    expect(typeof ctx.preferences.get('map:0')).toBe('string');
    const code = ctx.preferences.get('map:0') as string;
    // A newer host with a library: the map moves there, the preference is cleared.
    make({}, (c) => c.preferences.set('map:0', code));
    await settle();
    expect((await ctx.library!.list()).map((e) => e.id)).toEqual(['slot-0']);
    expect(ctx.preferences.has('map:0')).toBe(false);
  });

  it('a failed delete says so and keeps the place; a save finishing after the draft became another map does not hand it the place', async () => {
    instance.dispose();
    const lib = createTestLibrary('relay-command').library;
    let refuseDelete = true;
    let hold: (() => void) | null = null;
    const host = {
      ...lib,
      delete: (id: string) => (refuseDelete ? Promise.reject(new Error('blocked')) : lib.delete(id)),
      put: (item: Parameters<typeof lib.put>[0]) => (hold === null ? lib.put(item) : new Promise<void>((r) => (hold = r)).then(() => lib.put(item)))
    };
    ctx = createTestContext(game as GameModule<unknown>, 'en', document.createElement('div'), { library: host });
    instance = game.create(ctx.context) as GameInstance<RcState>;
    instance.newGame({ seed: 4 });
    click('rc-editor-open');
    await settle();
    click('ed-save');
    await settle();
    expect(state().edit!.slot).toBe(0);
    click('ed-delete');
    later();
    click('ed-delete');
    await settle();
    expect($('ed-notice').textContent).toBe('Could not delete Untitled map: it is still in the list.');
    expect(state().edit!.slot).toBe(0);
    expect($('ed-library').textContent).toContain('Untitled map');
    refuseDelete = false;
    // Save as a new map; while the save is pending, the draft becomes another map (a blank one).
    ($('ed-start') as HTMLSelectElement).value = 'ridge-valley';
    click('ed-load');
    later();
    click('ed-load');
    hold = () => undefined;
    click('ed-save');
    await settle();
    ($('ed-start') as HTMLSelectElement).value = 'blank';
    click('ed-load');
    later();
    click('ed-load');
    expect(state().edit).toMatchObject({ slot: null, map: expect.objectContaining({ units: [] }) });
    const release = hold as () => void;
    hold = null;
    release();
    await settle();
    expect($('ed-notice').textContent).toMatch(/^Saved: /);
    // The ridge map was saved (place 1), but the blank draft is not that map: it stays unsaved.
    expect(state().edit!.slot).toBeNull();
    expect((await lib.list()).map((e) => e.id).sort()).toEqual(['slot-0', 'slot-1']);
  });

  it('shares a map as a code, refuses a bad code, and asks twice before replacing or deleting', async () => {
    click('rc-editor-open');
    await settle();
    click('ed-copy');
    const code = ($('ed-code') as HTMLTextAreaElement).value;
    expect(code.startsWith('RC1.')).toBe(true);
    ($('ed-code') as HTMLTextAreaElement).value = 'nonsense';
    click('ed-use-code');
    expect($('ed-notice').textContent).toBe('That is not a valid map code.');
    // Load a built-in map to start from: two presses (with time between them).
    ($('ed-start') as HTMLSelectElement).value = 'ridge-valley';
    click('ed-load');
    expect(state().edit!.map.w).toBe(16);
    expect($('ed-load').textContent).toBe('Press again to replace the map');
    later();
    click('ed-load');
    expect(state().edit!.map.w).toBe(20);
    // The code of that map restores it exactly.
    click('ed-copy');
    click('ed-copy');
    const ridge = ($('ed-code') as HTMLTextAreaElement).value;
    click('ed-close');
    expect(state().edit).toBeNull();
    click('rc-editor-open');
    await settle();
    ($('ed-start') as HTMLSelectElement).value = 'blank';
    click('ed-load');
    later();
    click('ed-load');
    expect(state().edit!.map.units).toEqual([]);
    click('ed-copy');
    ($('ed-code') as HTMLTextAreaElement).value = ridge;
    click('ed-use-code');
    expect(state().edit!.map.w).toBe(20);
    expect(state().edit!.map.units.length).toBeGreaterThan(20);
    // Save, then delete with two presses.
    click('ed-save');
    await settle();
    expect($('ed-delete').hidden).toBe(false);
    click('ed-delete');
    await settle();
    expect(await ctx.library!.list()).toHaveLength(1);
    later();
    click('ed-delete');
    await settle();
    expect(await ctx.library!.list()).toHaveLength(0);
    expect(state().edit!.slot).toBeNull();
  });
});

describe('hot-seat (D10)', () => {
  const corners = SCENARIOS.find((spec) => spec.id === 'four-corners')!;
  /** Everything a person could read, hear or reach: the document text, the title and every live region. */
  const visible = () => ({
    text: ctx.context.root.textContent ?? '',
    title: document.title,
    live: [...ctx.context.root.querySelectorAll('[aria-live]')].map((el) => el.textContent ?? '').join('|')
  });
  const hot = () => newGame(3, corners, 'normal', 12, false, null, 2, ['person', 'person', 'computer']);
  it('teams with several persons: the setup offers the shapes; a team that wins together is named, survivors only', () => {
    const team = newGame(3, corners, 'normal', 12, false, null, 3, ['person', 'person', 'computer', 'computer'], false, null, '2v2-next');
    open(team);
    expect($('rc-teams-label').hidden).toBe(false);
    expect(($('rc-teams') as HTMLSelectElement).value).toBe('2v2-next');
    // Both opponents out: the next locks end the game (one team is left).
    let w = state().world;
    for (const side of [2, 3]) w = retire(w, side).world;
    const ended = structuredClone(state());
    ended.world = w;
    instance.restore(ended);
    click('rc-handover-confirm');
    click('rc-lock');
    if (state().handover) {
      click('rc-handover-confirm');
      click('rc-lock');
    }
    expect(state().phase).toBe('finished');
    expect($('rc-result-winner').textContent).toBe('Players A, B won together.');
  });


  /** Opens a hot-seat game: like any resumed one, it starts at the hand-over to the person planning. */
  function open(s: RcState): void {
    instance.restore(s);
    expect(state().handover).toBe(true);
    click('rc-handover-confirm');
  }
  /** Plans a move for the first rifle squad of the side planning and returns its id and the cell. */
  function planMove(): { id: number; x: number; y: number } {
    const s = state();
    const rifle = s.world.entities.find((e) => e.side === s.planning && e.kind === 'rifles')!;
    click(`rc-unit-${rifle.id}`);
    const x = rifle.x + (rifle.x < 8 ? 1 : -1);
    const y = rifle.y;
    const rect = { left: 0, top: 0, width: 16 * CELL, height: 16 * CELL } as DOMRect;
    $('rc-map').getBoundingClientRect = () => rect;
    $('rc-map').dispatchEvent(new MouseEvent('click', { clientX: x * CELL + CELL / 2, clientY: y * CELL + CELL / 2, bubbles: true }));
    expect(state().draft.some((c) => c.unit === rifle.id)).toBe(true);
    return { id: rifle.id, x, y };
  }

  it('the setup offers person or computer per side (A is you); several persons hide the quick match and explain the open end', () => {
    instance.restore(newGame(3, corners, 'normal', null, false, null, 3));
    expect($('rc-seat-0').textContent).toContain('Player A: you');
    for (const side of [1, 2, 3]) expect(($(`rc-seat-${side}-computer`) as HTMLInputElement).checked).toBe(true);
    expect($('rc-hotseat-hint').hidden).toBe(true);
    const person = $('rc-seat-2-person') as HTMLInputElement;
    person.checked = true;
    person.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state().seats).toEqual(['person', 'computer', 'person', 'computer']);
    expect($('rc-hotseat-hint').hidden).toBe(false);
    expect(($('rc-turn-limit').querySelector('option[value="quick"]') as HTMLOptionElement).disabled).toBe(true);
    expect($('rc-lock').textContent).toBe('Done: hand over');
  });

  it('a lock hands over: the document holds nothing of the previous side (no map, list, summary, live text, title or focus) until the next person confirms', () => {
    open(hot());
    const titleBefore = document.title;
    const aMove = planMove();
    const aName = $(`rc-unit-${aMove.id}`).textContent!;
    click('rc-lock');
    expect(state()).toMatchObject({ planning: 1, handover: true });
    const shown = visible();
    expect($('rc-handover').getAttribute('role')).toBe('dialog');
    expect(shown.text).toContain('Pass the device to Player B');
    for (const id of ['rc-map', 'rc-own', 'rc-enemy', 'rc-summary', 'rc-selection', 'rc-slots', 'rc-supply', 'rc-lock']) expect(ctx.context.root.querySelector(`[data-testid="${id}"]`), id).toBeNull();
    expect(shown.text).not.toContain(aName);
    expect(shown.title).toBe(titleBefore);
    expect(shown.live).not.toMatch(/Player A|Rifle|Turn 2/);
    expect(document.activeElement).toBe($('rc-handover-confirm'));
    // B confirms: B's own units are listed, A's plan is nowhere (no route, no order text, no planned count).
    click('rc-handover-confirm');
    expect(ctx.context.root.querySelector('[data-testid="rc-handover"]')).toBeNull();
    expect($('rc-seat').textContent).toContain('Player B plans');
    expect($('rc-slots').textContent).toMatch(/^Planning: 0\//);
    expect($('rc-own').textContent).not.toContain(aName);
    expect(ctx.context.root.textContent).not.toContain(`(${aMove.x + 1}, ${aMove.y + 1})`);
    expect($('rc-lock').textContent).toBe('Done: carry out the turn');
  });

  it('after the turn each person sees their own summary only after the hand-over; a reload always opens at the hand-over', () => {
    open(hot());
    planMove();
    click('rc-lock');
    click('rc-handover-confirm');
    click('rc-lock');
    expect(state()).toMatchObject({ planning: 0, handover: true });
    expect(state().log).toHaveLength(1);
    expect(ctx.context.root.querySelector('[data-testid="rc-summary"]')).toBeNull();
    click('rc-handover-confirm');
    expect($('rc-turn').textContent).toBe('Turn 2 of 12');
    // Reopening the game: whoever opens it passes the device to the person planning.
    const saved = state();
    instance.dispose();
    setup();
    instance.restore(saved);
    expect(state().handover).toBe(true);
    expect(ctx.context.root.querySelector('[data-testid="rc-map"]')).toBeNull();
    expect($('rc-handover').textContent).toContain('Player A');
  });

  it('giving up takes only that side out and hands over; the result names the winner and the sides out, and shows no map', () => {
    open(newGame(3, corners, 'normal', 12, false, null, 3, ['person', 'person', 'computer', 'computer']));
    click('rc-lock');
    click('rc-handover-confirm');
    click('rc-concede');
    click('rc-concede-yes');
    // B was the last person: the turn is carried out, and A plans on (no hand-over with one person left).
    expect(state().world.out).toEqual([1]);
    expect(state()).toMatchObject({ planning: 0, handover: false, phase: 'plan' });
    expect($('rc-summary').textContent).toContain('Opponent B');
    click('rc-concede');
    click('rc-concede-yes');
    expect(state().phase).toBe('finished');
    expect($('rc-result').hidden).toBe(false);
    expect($('rc-result-winner').textContent).toMatch(/Player [CD] won\.|Draw/);
    expect($('rc-result-out').textContent).toContain('B');
    // No map, list, report, cursor text or selection of any side is in the document (review of PR #25).
    for (const id of ['rc-main', 'rc-map', 'rc-own', 'rc-enemy', 'rc-summary', 'rc-cursor', 'rc-selection']) expect(ctx.context.root.querySelector(`[data-testid="${id}"]`), id).toBeNull();
    expect(ctx.context.root.querySelectorAll('[data-testid^="rc-unit-"]')).toHaveLength(0);
    expect(ctx.context.root.textContent).not.toMatch(/known from before the battle|last seen turn|\(\d+ : \d+\)/);
    expect([$('rc-supply').textContent, $('rc-slots').textContent, $('rc-seat').textContent]).toEqual(['', '', '']);
    // A new game brings the map back, in its place (before the help).
    instance.newGame({ seed: 5 });
    const order = [...$('rc-root').children].map((el) => el.getAttribute('data-testid') ?? el.className);
    expect(order.indexOf('rc-main')).toBeLessThan(order.findIndex((x) => x.includes('rc-help')));
  });

  it('an announcement still pending for the previous person never reaches the hand-over', () => {
    open(hot());
    const rifle = state().world.entities.find((e) => e.side === 0 && e.kind === 'rifles')!;
    click(`rc-unit-${rifle.id}`); // announces the selection a moment later
    click('rc-lock');
    later();
    expect([...ctx.context.root.querySelectorAll('[aria-live]')].map((el) => el.textContent).join('|')).not.toMatch(/Rifle|selected/i);
  });
});
