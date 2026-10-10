// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { initialIntel, passable, type Entity } from '@wp/strategy-engine';
import { concede, lockTurn, OPPONENT, PLAYER, RULESET, STALL_TURNS, type RcState } from '../src/rules';
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
  it('renders the turn, the status, both unit lists and the map', () => {
    expect($('rc-turn').textContent).toBe('Turn 1');
    expect($('rc-status').getAttribute('data-phase')).toBe('plan');
    expect(ctx.context.root.querySelectorAll('[data-testid^="rc-unit-"]')).toHaveLength(10);
    // Fog: of the enemy, only its structures (Command Post, Muster Yard) are known, from before the battle.
    expect($('rc-enemy').querySelectorAll('li')).toHaveLength(2);
    expect($('rc-enemy').textContent).toContain('Position known from before the battle');
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
    expect($('rc-deploy').hidden).toBe(true);
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
    // Visible too, for pointer and touch players (N9); cleared by the next successful action.
    expect($('rc-notice').hidden).toBe(false);
    expect($('rc-notice').textContent).toContain('No orders left this turn');
    click(`rc-unit-${others[0]!.id}`);
    click('rc-hold');
    expect($('rc-notice').hidden).toBe(true);
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
    expect($('rc-slots').textContent).toBe('Orders this turn: 1 of 4.');
    click('rc-lock');
    expect(state().world.entities.find((e) => e.id === unit.id)!.doctrine).toEqual({ retreatBelow: 50, priority: 'weakest', seekCover: true, holdFire: false, lostContact: 'regroup' });
    click(`rc-unit-${unit.id}`);
    expect(($('rc-doctrine-retreat') as HTMLSelectElement).value).toBe('50');
    expect(($('rc-doctrine-cover') as HTMLInputElement).checked).toBe(true);
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
    expect($('rc-status').textContent).toBe('Your Command Post is jammed: no orders can be sent this turn. Destroy the jammer, or bring a Tracer next to the post.');
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

  it('shows a uniform stat card for the selected unit, and says when a unit has no weapon', () => {
    expect($('rc-card').hidden).toBe(true);
    const rifle = firstMobile();
    click(`rc-unit-${rifle.id}`);
    expect($('rc-card').hidden).toBe(false);
    expect($('rc-card-health').textContent).toContain('40 / 40');
    expect($('rc-card-damage').textContent).toContain('6');
    expect($('rc-card').textContent).toContain('Effect against');
    expect($('rc-selection-text').textContent).toContain('or an enemy to attack it');
    const truck = own().find((e) => e.kind === 'mast-truck')!;
    click(`rc-unit-${truck.id}`);
    expect($('rc-card-noweapon').textContent).toContain('none');
    expect($('rc-card').textContent).toContain('relay, radius 5');
    expect($('rc-selection-text').textContent).toContain('This unit has no weapon');
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
    expect(legend.textContent).toContain('Structure (square)');
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
    expect($('rc-setup').hidden).toBe(true);
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

  it('in an open-ended game the turn line warns from three quiet turns on that strength will decide; the host learns the level', () => {
    expect(ctx.difficulties).toEqual(['normal']); // newGame without a known level fell back to 'normal'
    instance.restore({ ...state(), quiet: 2 });
    expect($('rc-turn').textContent).toBe('Turn 1');
    instance.restore({ ...state(), quiet: 3, difficulty: 'hard' });
    expect($('rc-turn').textContent).toBe('Turn 1 No losses for 3 turns: after 12 in a row, strength decides.');
    expect(ctx.difficulties).toEqual(['normal', 'normal', 'hard']);
    // A turn limit has no stall rule.
    instance.restore({ ...state(), quiet: 5, turnLimit: 12 });
    expect($('rc-turn').textContent).toBe('Turn 1 of 12');
    // A game the quiet rule ended says so instead of "after the last turn".
    let quiet: RcState = { ...state(), turnLimit: null };
    for (let i = 0; i < STALL_TURNS && quiet.phase === 'plan'; i++) quiet = lockTurn({ ...quiet, world: withoutMobileUnits(quiet.world) });
    expect(quiet).toMatchObject({ phase: 'finished', result: 'draw', quiet: STALL_TURNS });
    instance.restore(quiet);
    expect($('rc-status').textContent).toBe(`Draw after ${STALL_TURNS} turns without losses (300 : 300).`);
  });

  it('shows Supply and income, lets a yard queue units (paid from the planned Supply) and cancel them', () => {
    expect($('rc-supply').textContent).toBe('Supply 300 · income 20 per turn');
    const yard = own().find((e) => e.kind === 'muster')!;
    click(`rc-unit-${yard.id}`);
    expect($('rc-selection-text').textContent).toContain('Queue units below');
    expect($('rc-jobs').hidden).toBe(false);
    expect($('rc-job-rifles').textContent).toBe('Rifle Squad · 40 Supply · 1 turns');
    expect($('rc-card-cost').textContent).toContain('100 Supply');
    click('rc-job-rifles');
    click('rc-job-lancer');
    expect(state().draft.map((c) => c.order)).toEqual([{ type: 'produce', kind: 'rifles' }, { type: 'produce', kind: 'lancer' }]);
    expect($('rc-supply').textContent).toBe('Supply 300 (200 after planned orders) · income 20 per turn');
    expect($('rc-slots').textContent).toBe('Orders this turn: 2 of 4.');
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
    expect($('rc-summary').textContent).toContain('Finished: Lancer Team');
    expect($('rc-summary').textContent).toContain('Income: +20 Supply');
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
    expect($('rc-notice').hidden).toBe(false);
    expect($('rc-notice').textContent).toContain('Not here');
    expect(state().draft).toHaveLength(0);
    expect($('rc-placing')).not.toBeNull();
    // The deposit behind the own post is inside coverage.
    const near = state().world.map.deposits!.find((d) => d.x === 4 && d.y === 10)!;
    place(near.x, near.y);
    expect(state().draft.map((c) => c.order)).toEqual([{ type: 'build', kind: 'extractor', x: near.x, y: near.y }]);
    expect($('rc-jobs').textContent).toContain(`Planned: Extractor at ${near.x + 1}, ${near.y + 1}`);
    expect($('rc-placing')).toBeNull();
    click('rc-lock');
    const site = own().find((e) => e.kind === 'extractor')!;
    expect(site).toMatchObject({ x: near.x, y: near.y, build: 1 });
    expect($(`rc-unit-${site.id}`).textContent).toContain('under construction, 1 turns left');
    click(`rc-unit-${site.id}`);
    expect($('rc-selection-text').textContent).toContain('Under construction: 1 turns left');
    expect($('rc-jobs').hidden).toBe(true);
    click('rc-lock');
    expect($('rc-summary').textContent).toContain('Built: Extractor');
    expect($('rc-supply').textContent).toBe(`Supply ${300 - 80 + 20 + 20} · income 35 per turn`);
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
