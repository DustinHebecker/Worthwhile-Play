import { describe, expect, it } from 'vitest';
import { archetypeOf, createWorld, runTicks, spawn, type Entity, type SimEvent, type World } from '@wp/strategy-engine';
import { ENEMIES, ENEMY_KINDS, TD_RULESET, TOWERS } from '../src/ruleset';
import { en } from '../src/i18n/en';

/**
 * The branch-C towers and the shielded/repairing units on the engine extensions (design § 15.5):
 * each does what its description promises. Units stand still (no orders), towers on road cells.
 */
const world = (): World => createWorld({ map: { w: 9, h: 3, terrain: '='.repeat(27) }, sides: 2, entities: [], seed: 1 }, TD_RULESET);
const put = (w: World, kind: string, side: number, x: number, y: number): Entity => {
  const e = spawn(w.nextId++, side, archetypeOf(TD_RULESET, kind)!, x, y);
  w.entities.push(e);
  return e;
};
const run = (w: World, ticks: number): { world: World; events: SimEvent[] } => runTicks(w, TD_RULESET, [], ticks);
const hpOf = (w: World, id: number): number => w.entities.find((e) => e.id === id)?.hp ?? 0;

describe('branch C towers', () => {
  it('Prism: the beam hurts the unit in line behind its target as well', () => {
    const w = world();
    put(w, 'prism', 0, 0, 1);
    const near = put(w, 'brute', 1, 1, 1);
    const far = put(w, 'brute', 1, 3, 1);
    const end = run(w, 16).world;
    const max = archetypeOf(TD_RULESET, 'brute')!.hp;
    expect(hpOf(end, near.id)).toBeLessThan(max);
    expect(hpOf(end, far.id)).toBeLessThan(max);
    expect(max - hpOf(end, far.id)).toBe(max - hpOf(end, near.id));
  });

  it('a plain laser beam does not pierce', () => {
    const w = world();
    put(w, 'laser', 0, 0, 1);
    put(w, 'brute', 1, 1, 1);
    const far = put(w, 'brute', 1, 3, 1);
    const end = run(w, 16).world;
    expect(hpOf(end, far.id)).toBe(archetypeOf(TD_RULESET, 'brute')!.hp);
  });

  it('Amplifier: a gun beside it fires more often; the amplifier itself has no weapon', () => {
    expect(archetypeOf(TD_RULESET, 'amplifier')!.weapon).toBeNull();
    const shots = (amplified: boolean): number => {
      const w = world();
      const gun = put(w, 'gun', 0, 4, 1);
      if (amplified) put(w, 'amplifier', 0, 4, 0);
      put(w, 'crawler', 1, 6, 1);
      return run(w, 80).events.filter((e) => e.t === 'fire' && e.id === gun.id).length;
    };
    expect(shots(true)).toBeGreaterThan(shots(false));
  });

  it('Amplifier II repairs damaged towers nearby; level 2 does not', () => {
    for (const [kind, heals] of [['amplifier-2', true], ['amplifier', false]] as const) {
      const w = world();
      const gun = put(w, 'gun', 0, 4, 1);
      gun.hp = 50;
      put(w, kind, 0, 5, 1);
      const out = run(w, 24);
      expect(hpOf(out.world, gun.id) > 50, kind).toBe(heals);
      expect(out.events.some((e) => e.t === 'repaired'), kind).toBe(heals);
    }
  });

  it('Corroder: its hits mark a unit, which then takes more damage from other towers', () => {
    const marked = (corroder: boolean): number => {
      const w = world();
      put(w, 'gun', 0, 0, 1);
      if (corroder) put(w, 'corroder', 0, 0, 2);
      const target = put(w, 'crawler', 1, 2, 1);
      const out = run(w, 40);
      if (corroder) expect(out.world.entities.find((e) => e.id === target.id)!.status.some((s) => s.kind === 'marked' && (s.amount ?? 0) >= 25)).toBe(true);
      return archetypeOf(TD_RULESET, 'crawler')!.hp - hpOf(out.world, target.id);
    };
    const corroderOnly = (() => {
      const w = world();
      put(w, 'corroder', 0, 0, 2);
      const target = put(w, 'crawler', 1, 2, 1);
      return archetypeOf(TD_RULESET, 'crawler')!.hp - hpOf(run(w, 40).world, target.id);
    })();
    expect(marked(true)).toBeGreaterThan(marked(false) + corroderOnly);
  });
});

describe('shielded and repairing units', () => {
  it('Shield bearer: spawns with a full shield that soaks damage before health', () => {
    const w = world();
    const unit = put(w, 'shielder', 1, 3, 1);
    expect(unit.shield).toBe(archetypeOf(TD_RULESET, 'shielder')!.shield!.hp);
    put(w, 'gun', 0, 1, 1);
    const end = run(w, 12).world.entities.find((e) => e.id === unit.id)!;
    expect(end.shield).toBeLessThan(unit.shield!);
    expect(end.hp).toBe(archetypeOf(TD_RULESET, 'shielder')!.hp);
  });

  it('Shield bearer: an EMP pulse strips the shield at once', () => {
    const w = world();
    const unit = put(w, 'shielder', 1, 3, 1);
    put(w, 'specialist', 0, 1, 1);
    const end = run(w, 12).world.entities.find((e) => e.id === unit.id)!;
    expect(end.shield ?? 0).toBe(0);
  });

  it('Mender: repairs damaged units around it, not itself', () => {
    const w = world();
    const hurt = put(w, 'walker', 1, 4, 1);
    hurt.hp = 10;
    const mender = put(w, 'mender', 1, 5, 1);
    mender.hp = 20;
    const end = run(w, 24).world;
    expect(hpOf(end, hurt.id)).toBeGreaterThan(10);
    expect(hpOf(end, mender.id)).toBe(20);
  });
});

describe('roster data', () => {
  it('every unit kind has a threat, a bounty and texts', () => {
    for (const kind of ENEMY_KINDS) {
      expect(ENEMIES[kind].threat).toBeGreaterThan(0);
      expect(ENEMIES[kind].bounty).toBeGreaterThan(0);
      expect(en[`enemy.${kind}` as keyof typeof en], kind).toBeTruthy();
      expect(en[`enemyAbout.${kind}` as keyof typeof en], kind).toBeTruthy();
    }
  });

  it('every tower kind has a name and an archetype; level 2 kinds have a description', () => {
    for (const [kind, def] of Object.entries(TOWERS)) {
      expect(archetypeOf(TD_RULESET, kind), kind).toBeDefined();
      expect(en[`tower.${kind}` as keyof typeof en], kind).toBeTruthy();
      if (def.level < 3) expect(en[`about.${kind}` as keyof typeof en], kind).toBeTruthy();
    }
  });
});
