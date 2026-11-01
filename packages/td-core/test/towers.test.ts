import { describe, expect, it } from 'vitest';
import { createWorld, type World } from '@wp/strategy-engine';
import { TD_RULESET, TOWERS } from '../src/ruleset';
import { applyBuild, checkBuild, refundOf, SELL_PERCENT, settleAccount, type Account } from '../src/towers';

const world = (): World => createWorld({ map: { w: 3, h: 1, terrain: 'b=b' }, sides: 2, entities: [], seed: 1 }, TD_RULESET);
const pads = (x: number, y: number) => y === 0 && x !== 1;
const rich = (): Account => ({ credits: 1000, towers: [] });

describe('tower commands', () => {
  it('places a base tower for its side on an allowed free cell and charges its price', () => {
    const built = applyBuild(world(), rich(), 1, { t: 'place', kind: 'gun', x: 0, y: 0 });
    expect(built.world.entities.map((e) => [e.side, e.kind, e.x])).toEqual([[1, 'gun', 0]]);
    expect(built.account).toEqual({ credits: 1000 - TOWERS.gun!.price, towers: [{ id: 1, invested: TOWERS.gun!.price, fresh: TOWERS.gun!.price }] });
    expect(built.spent).toBe(TOWERS.gun!.price);
  });

  it('refuses unknown kinds, forbidden or taken cells, missing credits, other sides\' towers and wrong upgrades', () => {
    const w = world();
    expect(checkBuild(w, rich(), 0, { t: 'place', kind: 'gatling', x: 0, y: 0 }, pads)).toBe('unknown-kind');
    expect(checkBuild(w, rich(), 0, { t: 'place', kind: 'gun', x: 1, y: 0 }, pads)).toBe('not-a-pad');
    expect(checkBuild(w, { credits: 10, towers: [] }, 0, { t: 'place', kind: 'gun', x: 0, y: 0 }, pads)).toBe('credits');
    const built = applyBuild(w, rich(), 0, { t: 'place', kind: 'gun', x: 0, y: 0 });
    expect(checkBuild(built.world, built.account, 0, { t: 'place', kind: 'gun', x: 0, y: 0 }, pads)).toBe('occupied');
    expect(checkBuild(built.world, built.account, 1, { t: 'sell', id: 1 }, pads)).toBe('no-tower');
    expect(checkBuild(built.world, { credits: 1000, towers: [] }, 0, { t: 'sell', id: 1 }, pads)).toBe('no-tower');
    expect(checkBuild(built.world, built.account, 0, { t: 'upgrade', id: 1, kind: 'mortar' }, pads)).toBe('not-an-upgrade');
    expect(checkBuild(built.world, { ...built.account, credits: 10 }, 0, { t: 'upgrade', id: 1, kind: 'cannon' }, pads)).toBe('credits');
    expect(checkBuild(built.world, built.account, 0, { t: 'target', id: 1, priority: 'strongest' as never }, pads)).toBe('priority');
    expect(checkBuild(built.world, built.account, 0, { t: 'target', id: 1, priority: 'armor' }, pads)).toBeNull();
  });

  it('upgrades keep the health share, sales refund fresh credits fully and older ones at SELL_PERCENT', () => {
    let { world: w, account: a } = applyBuild(world(), rich(), 0, { t: 'place', kind: 'gun', x: 0, y: 0 });
    w.entities[0]!.hp = 50;
    ({ world: w, account: a } = applyBuild(w, a, 0, { t: 'upgrade', id: 1, kind: 'cannon' }));
    expect(w.entities[0]!.kind).toBe('cannon');
    expect(w.entities[0]!.hp).toBe(50);
    a = settleAccount(a);
    const record = a.towers[0]!;
    expect(refundOf(record)).toBe(Math.floor(((TOWERS.gun!.price + TOWERS.cannon!.price) * SELL_PERCENT) / 100));
    const sold = applyBuild(w, a, 0, { t: 'sell', id: 1 });
    expect(sold.world.entities).toHaveLength(0);
    expect(sold.account.credits).toBe(a.credits + refundOf(record));
    expect(sold.spent).toBe(0);
    const target = applyBuild(w, a, 0, { t: 'target', id: 1, priority: 'nearest' });
    expect(target.world.entities[0]!.doctrine?.priority).toBe('nearest');
    expect(target.spent).toBe(0);
  });

  it('is pure', () => {
    const w = world();
    const a = rich();
    const before = JSON.stringify([w, a]);
    applyBuild(w, a, 0, { t: 'place', kind: 'gun', x: 0, y: 0 });
    expect(JSON.stringify([w, a])).toBe(before);
  });
});
