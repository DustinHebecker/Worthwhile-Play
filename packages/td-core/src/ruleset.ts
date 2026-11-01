import type { Archetype, ArmorClass, Ruleset, StatusEffectSpec, TerrainSpec, WeaponSpec } from '@wp/strategy-engine';

/**
 * Tower Defense ruleset on the shared strategy engine (docs/design/tower-defense.md § 15).
 * Numbers are first balancing guesses; the balance tests keep the intended trade-offs true.
 *
 * Time: 8 ticks per second at 1× playback. Road cost 16 → speed 2 moves one cell per 8 ticks (one cell
 * per second); slowed units move at half speed (engine: speed halved, at least 1).
 */

export const TICKS_PER_SECOND = 8;

/** Terrain: `=` road, `b` build pad (passable but never worth a step), `^` rock, `~` water. */
export const TD_TERRAIN: Readonly<Record<string, TerrainSpec>> = {
  '=': { cost: 16, cover: 0, rangeBonus: 0 },
  b: { cost: 1600, cover: 0, rangeBonus: 0 },
  '^': { cost: null, cover: 0, rangeBonus: 0 },
  '~': { cost: null, cover: 0, rangeBonus: 0 }
};

export const FAMILIES = ['gun', 'artillery', 'laser', 'support', 'specialist'] as const;
export type Family = (typeof FAMILIES)[number];
export type Branch = 'a' | 'b';

export interface TowerDef {
  readonly kind: string;
  readonly family: Family;
  readonly level: 1 | 2 | 3;
  readonly branch: Branch | null;
  /** Credits to build (level 1) or to upgrade into this kind from its predecessor. */
  readonly price: number;
  /** Kinds this tower can be upgraded into (level 1: one per branch; level 2: its level 3). */
  readonly next: readonly string[];
}

export interface EnemyDef {
  readonly kind: string;
  /** Core integrity lost when it gets through. */
  readonly threat: number;
  /** Credits for destroying it. */
  readonly bounty: number;
}

const vs = (infantry: number, light: number, heavy: number, air: number, structure = 0): Record<ArmorClass, number> => ({
  infantry,
  light,
  heavy,
  structure,
  air
});

const weapon = (spec: Partial<WeaponSpec> & Pick<WeaponSpec, 'damage' | 'range' | 'vs'>): WeaponSpec => ({
  minRange: 0,
  cooldown: 1,
  delivery: 'direct',
  flight: 0,
  splash: 0,
  beamRamp: 0,
  beamMaxStacks: 0,
  stationary: false,
  effect: null as StatusEffectSpec | null,
  ...spec
});

const slow = (ticks: number): StatusEffectSpec => ({ kind: 'slowed', ticks });
const stun = (ticks: number): StatusEffectSpec => ({ kind: 'disabled', ticks });

const TOWER_HP = 100;

const tower = (id: string, w: WeaponSpec | null): Archetype => ({
  id,
  hp: TOWER_HP,
  armor: 'structure',
  layer: 'ground',
  speed: 0,
  vision: 12,
  cost: 0,
  buildTurns: 0,
  income: 0,
  extractor: false,
  production: null,
  weapon: w,
  comms: null,
  ew: null
});

const enemy = (id: string, hp: number, armor: ArmorClass, speed: number, w: WeaponSpec | null = null): Archetype => ({
  id,
  hp,
  armor,
  layer: armor === 'air' ? 'air' : 'ground',
  speed,
  vision: 3,
  cost: 0,
  buildTurns: 0,
  income: 0,
  extractor: false,
  production: null,
  weapon: w,
  comms: null,
  ew: null
});

/** Weapons of the tower kinds. Branch A is listed first in every family. */
const TOWER_WEAPONS: Readonly<Record<string, WeaponSpec>> = {
  // Gun: cheap all-rounder. Gatling = many small hits (weak vs heavy); Cannon = big hits, no air.
  gun: weapon({ damage: 6, range: 3, cooldown: 4, vs: vs(100, 100, 40, 50) }),
  gatling: weapon({ damage: 2, range: 3, cooldown: 1, vs: vs(100, 100, 25, 100) }),
  'gatling-2': weapon({ damage: 3, range: 4, cooldown: 1, vs: vs(100, 100, 25, 100) }),
  cannon: weapon({ damage: 24, range: 3, cooldown: 10, vs: vs(70, 100, 130, 0) }),
  'cannon-2': weapon({ damage: 48, range: 4, cooldown: 10, vs: vs(70, 100, 130, 0) }),
  // Artillery: shells fly to a cell (moving targets can leave it), dead zone, ground only.
  artillery: weapon({ damage: 18, range: 5, minRange: 2, cooldown: 12, delivery: 'ballistic', flight: 4, splash: 1, vs: vs(100, 90, 60, 0) }),
  howitzer: weapon({ damage: 26, range: 8, minRange: 3, cooldown: 14, delivery: 'ballistic', flight: 6, splash: 1, vs: vs(100, 90, 70, 0) }),
  'howitzer-2': weapon({ damage: 40, range: 10, minRange: 3, cooldown: 14, delivery: 'ballistic', flight: 6, splash: 1, vs: vs(100, 90, 70, 0) }),
  mortar: weapon({ damage: 14, range: 4, minRange: 1, cooldown: 10, delivery: 'ballistic', flight: 3, splash: 2, vs: vs(100, 90, 50, 0), effect: slow(8) }),
  'mortar-2': weapon({ damage: 22, range: 4, minRange: 1, cooldown: 10, delivery: 'ballistic', flight: 3, splash: 2, vs: vs(100, 90, 50, 0), effect: slow(16) }),
  // Laser: beam that heats up on one target. Focus = long ramp (boss killer); Pulse = quick shots.
  laser: weapon({ damage: 1, range: 3, cooldown: 2, delivery: 'beam', beamRamp: 1, beamMaxStacks: 3, vs: vs(100, 100, 100, 100) }),
  focus: weapon({ damage: 1, range: 3, cooldown: 2, delivery: 'beam', beamRamp: 1, beamMaxStacks: 8, vs: vs(100, 100, 110, 100) }),
  'focus-2': weapon({ damage: 1, range: 4, cooldown: 2, delivery: 'beam', beamRamp: 2, beamMaxStacks: 8, vs: vs(100, 100, 110, 100) }),
  pulse: weapon({ damage: 5, range: 4, cooldown: 2, vs: vs(100, 100, 50, 130) }),
  'pulse-2': weapon({ damage: 8, range: 5, cooldown: 2, vs: vs(100, 100, 50, 130) }),
  // Support: no real damage; slows. Stasis = wide short pulses; Snare = one target, long slow, far.
  support: weapon({ damage: 1, range: 3, cooldown: 10, delivery: 'ballistic', flight: 1, splash: 1, vs: vs(100, 100, 100, 100), effect: slow(10) }),
  stasis: weapon({ damage: 1, range: 3, cooldown: 8, delivery: 'ballistic', flight: 1, splash: 2, vs: vs(100, 100, 100, 100), effect: slow(14) }),
  'stasis-2': weapon({ damage: 1, range: 4, cooldown: 6, delivery: 'ballistic', flight: 1, splash: 2, vs: vs(100, 100, 100, 100), effect: slow(20) }),
  snare: weapon({ damage: 1, range: 5, cooldown: 6, delivery: 'ballistic', flight: 1, splash: 0, vs: vs(100, 100, 100, 100), effect: slow(30) }),
  'snare-2': weapon({ damage: 1, range: 6, cooldown: 4, delivery: 'ballistic', flight: 1, splash: 0, vs: vs(100, 100, 100, 100), effect: slow(40) }),
  // Specialist: EMP stops units briefly. Interceptor = air only; Blackout = wide, long EMP.
  specialist: weapon({ damage: 1, range: 3, cooldown: 24, delivery: 'ballistic', flight: 2, splash: 1, vs: vs(100, 100, 100, 100), effect: stun(6) }),
  interceptor: weapon({ damage: 40, range: 6, cooldown: 6, vs: vs(0, 0, 0, 150) }),
  'interceptor-2': weapon({ damage: 70, range: 7, cooldown: 6, vs: vs(0, 0, 0, 150) }),
  blackout: weapon({ damage: 1, range: 4, cooldown: 30, delivery: 'ballistic', flight: 2, splash: 2, vs: vs(100, 100, 100, 100), effect: stun(12) }),
  'blackout-2': weapon({ damage: 1, range: 4, cooldown: 26, delivery: 'ballistic', flight: 2, splash: 2, vs: vs(100, 100, 100, 100), effect: stun(18) })
};

const def = (kind: string, family: Family, level: 1 | 2 | 3, branch: Branch | null, price: number, next: readonly string[] = []): TowerDef => ({
  kind,
  family,
  level,
  branch,
  price,
  next
});

export const TOWERS: Readonly<Record<string, TowerDef>> = Object.fromEntries(
  [
    def('gun', 'gun', 1, null, 100, ['gatling', 'cannon']),
    def('gatling', 'gun', 2, 'a', 120, ['gatling-2']),
    def('gatling-2', 'gun', 3, 'a', 180),
    def('cannon', 'gun', 2, 'b', 150, ['cannon-2']),
    def('cannon-2', 'gun', 3, 'b', 220),
    def('artillery', 'artillery', 1, null, 175, ['howitzer', 'mortar']),
    def('howitzer', 'artillery', 2, 'a', 175, ['howitzer-2']),
    def('howitzer-2', 'artillery', 3, 'a', 250),
    def('mortar', 'artillery', 2, 'b', 150, ['mortar-2']),
    def('mortar-2', 'artillery', 3, 'b', 220),
    def('laser', 'laser', 1, null, 150, ['focus', 'pulse']),
    def('focus', 'laser', 2, 'a', 175, ['focus-2']),
    def('focus-2', 'laser', 3, 'a', 250),
    def('pulse', 'laser', 2, 'b', 150, ['pulse-2']),
    def('pulse-2', 'laser', 3, 'b', 220),
    def('support', 'support', 1, null, 125, ['stasis', 'snare']),
    def('stasis', 'support', 2, 'a', 125, ['stasis-2']),
    def('stasis-2', 'support', 3, 'a', 175),
    def('snare', 'support', 2, 'b', 125, ['snare-2']),
    def('snare-2', 'support', 3, 'b', 175),
    def('specialist', 'specialist', 1, null, 150, ['interceptor', 'blackout']),
    def('interceptor', 'specialist', 2, 'a', 150, ['interceptor-2']),
    def('interceptor-2', 'specialist', 3, 'a', 220),
    def('blackout', 'specialist', 2, 'b', 150, ['blackout-2']),
    def('blackout-2', 'specialist', 3, 'b', 220)
  ].map((d) => [d.kind, d])
);

/** Level-1 kind of each family (what can be placed). */
export const BASE_TOWERS: readonly string[] = FAMILIES;

export const ENEMY_KINDS = ['walker', 'runner', 'swarm', 'brute', 'glider', 'raider', 'crawler'] as const;
export type EnemyKind = (typeof ENEMY_KINDS)[number];

const ENEMY_ARCHETYPES: readonly Archetype[] = [
  enemy('walker', 40, 'infantry', 2),
  enemy('runner', 24, 'light', 4),
  enemy('swarm', 10, 'infantry', 3),
  enemy('brute', 220, 'heavy', 2),
  enemy('glider', 30, 'air', 1),
  // Armed: fires at towers within reach while it walks past.
  enemy('raider', 70, 'light', 2, weapon({ damage: 4, range: 2, cooldown: 4, vs: vs(0, 0, 0, 0, 100) })),
  enemy('crawler', 1500, 'heavy', 2, weapon({ damage: 12, range: 2, cooldown: 6, vs: vs(0, 0, 0, 0, 100) }))
];

export const ENEMIES: Readonly<Record<EnemyKind, EnemyDef>> = {
  walker: { kind: 'walker', threat: 1, bounty: 4 },
  runner: { kind: 'runner', threat: 1, bounty: 4 },
  swarm: { kind: 'swarm', threat: 1, bounty: 1 },
  brute: { kind: 'brute', threat: 3, bounty: 15 },
  glider: { kind: 'glider', threat: 2, bounty: 6 },
  raider: { kind: 'raider', threat: 2, bounty: 10 },
  crawler: { kind: 'crawler', threat: 10, bounty: 100 }
};

export const isEnemyKind = (kind: string): kind is EnemyKind => (ENEMY_KINDS as readonly string[]).includes(kind);
export const isTowerKind = (kind: string): boolean => Object.hasOwn(TOWERS, kind);

/**
 * Economy structures (strategy/TD hybrid): built on a pad like a tower, no weapon. An Extractor adds
 * income every round; it can be shot by armed units like any structure.
 */
export const STRUCTURES = ['extractor'] as const;
export type StructureKind = (typeof STRUCTURES)[number];
export const isStructureKind = (kind: string): kind is StructureKind => (STRUCTURES as readonly string[]).includes(kind);
const STRUCTURE_ARCHETYPES: readonly Archetype[] = [{ ...tower('extractor', null), hp: 120 }];

export const TD_RULESET: Ruleset = {
  id: 'td-1',
  ticksPerTurn: TICKS_PER_SECOND,
  terrain: TD_TERRAIN,
  archetypes: Object.fromEntries([...Object.keys(TOWER_WEAPONS).map((k) => tower(k, TOWER_WEAPONS[k] as WeaponSpec)), ...ENEMY_ARCHETYPES, ...STRUCTURE_ARCHETYPES].map((a) => [a.id, a])),
  commandNetwork: false,
  relayHillBonus: 0,
  fog: false,
  economy: false,
  startSupply: 0
};
