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

const unit = (
  spec: Omit<Archetype, 'weapon' | 'comms' | 'ew' | 'buildTurns' | 'income' | 'extractor' | 'production'> & {
    weapon?: WeaponSpec;
    comms?: CommsSpec;
    ew?: EwSpec;
    buildTurns?: number;
    income?: number;
    extractor?: boolean;
    production?: readonly string[];
  }
): Archetype => ({
  ...spec,
  buildTurns: spec.buildTurns ?? 0,
  income: spec.income ?? 0,
  extractor: spec.extractor ?? false,
  production: spec.production ?? null,
  weapon: spec.weapon ?? null,
  comms: spec.comms ?? null,
  ew: spec.ew ?? null
});

/** What the two yards produce (docs/design/strategy.md § 4.2). */
const INFANTRY = ['rifles', 'lancer'] as const;
const VEHICLES = ['outrider', 'warden', 'howitzer', 'mast-truck', 'field-post', 'jammer', 'tracer'] as const;

export const BASE_ARCHETYPES: Readonly<Record<string, Archetype>> = Object.fromEntries(
  [
    unit({ id: 'rifles', hp: 40, armor: 'infantry', layer: 'ground', speed: 2, vision: 4, cost: 40, buildTurns: 1,
      weapon: weapon({ damage: 6, range: 2, vs: vs(100, 60, 20, 30, 40) }) }),
    unit({ id: 'lancer', hp: 35, armor: 'infantry', layer: 'ground', speed: 2, vision: 4, cost: 60, buildTurns: 1,
      weapon: weapon({ damage: 14, range: 3, cooldown: 2, vs: vs(40, 100, 120, 80, 30) }) }),
    unit({ id: 'outrider', hp: 45, armor: 'light', layer: 'ground', speed: 5, vision: 6, cost: 50, buildTurns: 1,
      weapon: weapon({ damage: 5, range: 2, vs: vs(100, 70, 20, 20, 50) }) }),
    unit({ id: 'warden', hp: 140, armor: 'heavy', layer: 'ground', speed: 3, vision: 4, cost: 150, buildTurns: 2,
      weapon: weapon({ damage: 18, range: 3, cooldown: 2, vs: vs(70, 100, 100, 100, 0) }) }),
    unit({ id: 'howitzer', hp: 50, armor: 'light', layer: 'ground', speed: 2, vision: 3, cost: 120, buildTurns: 2,
      weapon: weapon({ damage: 25, range: 7, minRange: 3, cooldown: 3, delivery: 'ballistic', flight: 2, splash: 1,
        stationary: true, vs: vs(100, 100, 70, 120, 0) }) }),
    unit({ id: 'kite', hp: 20, armor: 'air', layer: 'air', speed: 6, vision: 6, cost: 60,
      comms: { role: 'relay', radius: 3, orderSlots: 0, needsDeploy: false } }),
    unit({ id: 'mast-truck', hp: 60, armor: 'light', layer: 'ground', speed: 4, vision: 4, cost: 70, buildTurns: 1,
      comms: { role: 'relay', radius: 5, orderSlots: 0, needsDeploy: true } }),
    unit({ id: 'field-post', hp: 90, armor: 'light', layer: 'ground', speed: 3, vision: 4, cost: 160, buildTurns: 2,
      comms: { role: 'source', radius: 4, orderSlots: 2, needsDeploy: true } }),
    unit({ id: 'jammer', hp: 50, armor: 'light', layer: 'ground', speed: 3, vision: 3, cost: 100, buildTurns: 2,
      ew: { role: 'jammer', radius: 3, burnThrough: 0, needsDeploy: true } }),
    unit({ id: 'tracer', hp: 45, armor: 'light', layer: 'ground', speed: 3, vision: 4, cost: 90, buildTurns: 2,
      ew: { role: 'tracer', radius: 8, burnThrough: 2, needsDeploy: false } }),
    unit({ id: 'command-post', hp: 400, armor: 'structure', layer: 'ground', speed: 0, vision: 5, cost: 0, income: 20,
      comms: { role: 'source', radius: 5, orderSlots: 4, needsDeploy: false } }),
    unit({ id: 'relay-mast', hp: 100, armor: 'structure', layer: 'ground', speed: 0, vision: 4, cost: 60, buildTurns: 1,
      comms: { role: 'relay', radius: 6, orderSlots: 0, needsDeploy: false } }),
    // Economy (I6a, § 4.2 and § 8): yards produce, an Extractor on a deposit yields while connected.
    unit({ id: 'muster', hp: 200, armor: 'structure', layer: 'ground', speed: 0, vision: 3, cost: 100, buildTurns: 2, production: INFANTRY }),
    unit({ id: 'motor-pool', hp: 250, armor: 'structure', layer: 'ground', speed: 0, vision: 3, cost: 150, buildTurns: 3, production: VEHICLES }),
    unit({ id: 'extractor', hp: 120, armor: 'structure', layer: 'ground', speed: 0, vision: 3, cost: 80, buildTurns: 2, income: 15, extractor: true }),
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
  fog: false,
  economy: false,
  startSupply: 0
};

/**
 * Turn-based strategy: orders and reports travel through the command network
 * (docs/design/strategy.md § 5). `strategy-1` (I3a/I3b) had no fog; `strategy-2` added D7;
 * `strategy-3` (I6a) adds the economy (D8).
 */
export const STRATEGY_RULESET: Ruleset = { ...BASE_RULESET, id: 'strategy-3', commandNetwork: true, fog: true, economy: true, startSupply: 300 };
