import type { Archetype, ArmorClass, CommsSpec, EwSpec, Ruleset, StatusEffectSpec, TerrainSpec, WeaponSpec } from './types';

/**
 * Shared base content (ADR 0009, decision D16): terrain and archetypes used by the strategy
 * game and as the starting point for Tower Defense / hybrid rulesets. All names are original.
 * Numbers are first balancing guesses (docs/design/strategy.md § 4).
 */

/** Terrain codes: `.` plain, `=` road, `f` forest, `h` hill, `u` urban, `s` swamp, `~` water, `^` ridge. */
export const BASE_TERRAIN: Readonly<Record<string, TerrainSpec>> = {
  '.': { cost: 4, cover: 0, rangeBonus: 0 },
  '=': { cost: 2, cover: 0, rangeBonus: 0 },
  f: { cost: 6, cover: 25, rangeBonus: 0 },
  h: { cost: 6, cover: 0, rangeBonus: 1 },
  u: { cost: 4, cover: 25, rangeBonus: 0 },
  s: { cost: 8, cover: 0, rangeBonus: 0 },
  '~': { cost: null, cover: 0, rangeBonus: 0 },
  '^': { cost: null, cover: 0, rangeBonus: 0 }
};

const vs = (infantry: number, light: number, heavy: number, structure: number, air: number): Record<ArmorClass, number> => ({
  infantry, light, heavy, structure, air
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

const unit = (spec: Omit<Archetype, 'weapon' | 'comms' | 'ew'> & { weapon?: WeaponSpec; comms?: CommsSpec; ew?: EwSpec }): Archetype => ({
  ...spec,
  weapon: spec.weapon ?? null,
  comms: spec.comms ?? null,
  ew: spec.ew ?? null
});

export const BASE_ARCHETYPES: Readonly<Record<string, Archetype>> = Object.fromEntries(
  [
    unit({ id: 'rifles', hp: 40, armor: 'infantry', layer: 'ground', speed: 2, vision: 4, cost: 40,
      weapon: weapon({ damage: 6, range: 2, vs: vs(100, 60, 20, 30, 40) }) }),
    unit({ id: 'lancer', hp: 35, armor: 'infantry', layer: 'ground', speed: 2, vision: 4, cost: 60,
      weapon: weapon({ damage: 14, range: 3, cooldown: 2, vs: vs(40, 100, 120, 80, 30) }) }),
    unit({ id: 'outrider', hp: 45, armor: 'light', layer: 'ground', speed: 5, vision: 6, cost: 50,
      weapon: weapon({ damage: 5, range: 2, vs: vs(100, 70, 20, 20, 50) }) }),
    unit({ id: 'warden', hp: 140, armor: 'heavy', layer: 'ground', speed: 3, vision: 4, cost: 150,
      weapon: weapon({ damage: 18, range: 3, cooldown: 2, vs: vs(70, 100, 100, 100, 0) }) }),
    unit({ id: 'howitzer', hp: 50, armor: 'light', layer: 'ground', speed: 2, vision: 3, cost: 120,
      weapon: weapon({ damage: 25, range: 7, minRange: 3, cooldown: 3, delivery: 'ballistic', flight: 2, splash: 1,
        stationary: true, vs: vs(100, 100, 70, 120, 0) }) }),
    unit({ id: 'kite', hp: 20, armor: 'air', layer: 'air', speed: 6, vision: 6, cost: 60,
      comms: { role: 'relay', radius: 3, orderSlots: 0, needsDeploy: false } }),
    unit({ id: 'mast-truck', hp: 60, armor: 'light', layer: 'ground', speed: 4, vision: 4, cost: 70,
      comms: { role: 'relay', radius: 5, orderSlots: 0, needsDeploy: true } }),
    unit({ id: 'field-post', hp: 90, armor: 'light', layer: 'ground', speed: 3, vision: 4, cost: 160,
      comms: { role: 'source', radius: 4, orderSlots: 2, needsDeploy: true } }),
    unit({ id: 'jammer', hp: 50, armor: 'light', layer: 'ground', speed: 3, vision: 3, cost: 100,
      ew: { role: 'jammer', radius: 3, burnThrough: 0, needsDeploy: true } }),
    unit({ id: 'tracer', hp: 45, armor: 'light', layer: 'ground', speed: 3, vision: 4, cost: 90,
      ew: { role: 'tracer', radius: 8, burnThrough: 2, needsDeploy: false } }),
    unit({ id: 'command-post', hp: 400, armor: 'structure', layer: 'ground', speed: 0, vision: 5, cost: 0,
      comms: { role: 'source', radius: 5, orderSlots: 4, needsDeploy: false } }),
    unit({ id: 'relay-mast', hp: 100, armor: 'structure', layer: 'ground', speed: 0, vision: 4, cost: 60,
      comms: { role: 'relay', radius: 6, orderSlots: 0, needsDeploy: false } }),
    unit({ id: 'tower-gun', hp: 150, armor: 'structure', layer: 'ground', speed: 0, vision: 5, cost: 60,
      weapon: weapon({ damage: 8, range: 3, vs: vs(100, 80, 40, 30, 60) }) }),
    unit({ id: 'tower-artillery', hp: 150, armor: 'structure', layer: 'ground', speed: 0, vision: 5, cost: 120,
      weapon: weapon({ damage: 20, range: 6, minRange: 2, cooldown: 3, delivery: 'ballistic', flight: 2, splash: 1,
        vs: vs(100, 100, 70, 100, 0) }) }),
    unit({ id: 'tower-laser', hp: 120, armor: 'structure', layer: 'ground', speed: 0, vision: 5, cost: 140,
      weapon: weapon({ damage: 4, range: 4, delivery: 'beam', beamRamp: 3, beamMaxStacks: 4, vs: vs(80, 100, 100, 60, 100) }) }),
    unit({ id: 'tower-emp', hp: 120, armor: 'structure', layer: 'ground', speed: 0, vision: 5, cost: 120,
      weapon: weapon({ damage: 2, range: 4, cooldown: 4, delivery: 'ballistic', flight: 1, splash: 1,
        vs: vs(100, 100, 100, 100, 100), effect: { kind: 'disabled', ticks: 6 } }) })
  ].map((a) => [a.id, a])
);

/** Shared base ruleset without command-network gating (Tower Defense and tests). */
export const BASE_RULESET: Ruleset = {
  id: 'base-1',
  ticksPerTurn: 6,
  terrain: BASE_TERRAIN,
  archetypes: BASE_ARCHETYPES,
  commandNetwork: false,
  relayHillBonus: 2,
  fog: false
};

/**
 * Turn-based strategy: orders and reports travel through the command network
 * (docs/design/strategy.md § 5). `strategy-1` (I3a/I3b) had no fog; `strategy-2` adds D7.
 */
export const STRATEGY_RULESET: Ruleset = { ...BASE_RULESET, id: 'strategy-2', commandNetwork: true, fog: true };
