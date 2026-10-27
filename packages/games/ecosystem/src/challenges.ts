/**
 * The 16 prediction challenges (design § 10.1): a preset, the scripted change(s), the horizon and the questions per
 * difficulty. Texts live in `content/<locale>.ts`. The `expect` fields name the model's answer for tests and the e2e
 * only: reviews always score against the model run itself, and `challenges.slow.test.ts` checks that every `expect`
 * still holds (answers unambiguous at p = 15/20/25 %, level ratios outside the margins).
 */
import { createRng } from '@wp/game-core';
import { habitatDef, speciesIndex, type Habitat } from './habitats';
import { cloneSim, idiv, simulate, type Action } from './model';
import { PRESETS } from './presets';
import type { Band } from './score';
import type { Shape } from './shape';
import type { PresetId } from './spinup';

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export type Question =
  | { readonly kind: 'level'; readonly species: string; readonly week: number; readonly expect: Band }
  | { readonly kind: 'shape'; readonly species: string; readonly options: readonly Shape[]; readonly expect: Shape }
  | { readonly kind: 'sketch'; readonly species: string; readonly max: number; readonly expect: Shape };

export interface Challenge {
  readonly id: string;
  readonly habitat: Habitat;
  readonly preset: PresetId;
  /** Scripted changes (week 0 = the change the story describes; later weeks for timed changes). */
  readonly actions: readonly Action[];
  readonly horizon: number;
  readonly questions: Readonly<Record<Difficulty, readonly Question[]>>;
  /** The explaining loop acts through a maturation or other delay (round summary remark). */
  readonly delay: boolean;
}

const set = (cond: number, level: number, week = 0): Action => ({ week, kind: 'set', cond, level });
const add = (species: string): Action => ({ week: 0, kind: 'add', species });
const remove = (species: string, share: 50 | 90 | 100): Action => ({ week: 0, kind: 'remove', species, share });
const level = (species: string, week: number, expect: Band): Question => ({ kind: 'level', species, week, expect });
const shape = (species: string, expect: Shape, ...others: Shape[]): Question => {
  // Option order is fixed per question and does not reveal the answer (the expected class is not always first).
  const options = [...others];
  options.splice(idiv(species.length + others.length, 2) % (others.length + 1), 0, expect);
  return { kind: 'shape', species, options, expect };
};
const sketch = (species: string, max: number, expect: Shape): Question => ({ kind: 'sketch', species, max, expect });
const LOWER = 0;
const HIGHER = 2;

/** Pond conditions: 0 light, 1 runoff, 2 water flow. Meadow: 0 rain, 1 fertiliser. */
export const CHALLENGES: readonly Challenge[] = [
  {
    id: 'fleas-arrive',
    habitat: 'pond',
    preset: 'pond.young',
    actions: [add('fleas')],
    horizon: 26,
    questions: {
      easy: [level('algae', 26, LOWER)],
      medium: [shape('algae', 'falls', 'rises', 'steady', 'swings-last')],
      hard: [sketch('algae', 500_000, 'falls')]
    },
    delay: false
  },
  {
    id: 'enrich-swings',
    habitat: 'pond',
    preset: 'pond.plankton',
    actions: [set(1, 4)],
    horizon: 78,
    questions: {
      easy: [shape('fleas', 'swings-last', 'rises', 'vanishes')],
      medium: [shape('fleas', 'swings-last', 'rises', 'rise-fall', 'swings-fade')],
      hard: [sketch('fleas', 500_000, 'swings-last')]
    },
    delay: false
  },
  {
    id: 'fish-stocked',
    habitat: 'pond',
    preset: 'pond.plankton',
    actions: [add('minnows')],
    horizon: 52,
    questions: {
      easy: [level('algae', 52, HIGHER)],
      medium: [shape('algae', 'rises', 'falls', 'steady', 'fall-rise'), shape('fleas', 'falls', 'rises', 'steady', 'fall-rise')],
      hard: [sketch('algae', 200_000, 'rises')]
    },
    delay: true
  },
  {
    id: 'pike-return',
    habitat: 'pond',
    preset: 'pond.openfish',
    actions: [add('pike')],
    horizon: 104,
    questions: {
      easy: [level('algae', 104, LOWER)],
      medium: [shape('algae', 'falls', 'rises', 'steady', 'rise-fall'), shape('fleas', 'rises', 'falls', 'steady', 'fall-rise')],
      hard: [sketch('algae', 500_000, 'falls')]
    },
    delay: true
  },
  {
    id: 'algae-treatment',
    habitat: 'pond',
    preset: 'pond.lively',
    actions: [{ week: 0, kind: 'treat-algae' }],
    horizon: 16,
    questions: {
      easy: [level('algae', 3, HIGHER)],
      medium: [level('algae', 3, HIGHER)],
      hard: [sketch('algae', 200_000, 'swings-last')]
    },
    delay: true
  },
  {
    id: 'slow-runoff',
    habitat: 'pond',
    preset: 'pond.lively',
    actions: [set(1, 3)],
    horizon: 104,
    questions: {
      easy: [level('pondweed', 104, LOWER)],
      medium: [shape('pondweed', 'vanishes', 'falls', 'steady', 'swings-last')],
      hard: [sketch('pondweed', 1_000_000, 'vanishes')]
    },
    delay: true
  },
  {
    id: 'no-way-back',
    habitat: 'pond',
    preset: 'pond.green',
    actions: [set(1, 0)],
    horizon: 104,
    questions: {
      easy: [shape('pondweed', 'steady', 'rises', 'rise-fall')],
      medium: [shape('pondweed', 'steady', 'rises', 'rise-fall', 'swings-last')],
      hard: [shape('pondweed', 'steady', 'rises', 'rise-fall', 'swings-last')]
    },
    delay: false
  },
  {
    id: 'shade',
    habitat: 'pond',
    preset: 'pond.lively',
    actions: [set(0, 2)],
    horizon: 52,
    questions: {
      easy: [level('pondweed', 52, LOWER)],
      medium: [shape('pondweed', 'falls', 'steady', 'rises', 'fall-rise')],
      hard: [sketch('pondweed', 1_000_000, 'falls')]
    },
    delay: false
  },
  {
    id: 'spray',
    habitat: 'meadow',
    preset: 'meadow.lively',
    actions: [{ week: 0, kind: 'spray' }],
    horizon: 26,
    questions: {
      easy: [level('aphids', 16, HIGHER), level('flowers', 26, LOWER)],
      medium: [level('aphids', 16, HIGHER)],
      hard: [sketch('aphids', 50_000, 'swings-last')]
    },
    delay: true
  },
  {
    id: 'no-foxes',
    habitat: 'meadow',
    preset: 'meadow.lively',
    actions: [remove('foxes', 100)],
    horizon: 104,
    questions: {
      easy: [level('rabbits', 104, HIGHER), level('clover', 104, LOWER)],
      medium: [shape('rabbits', 'rises', 'rise-fall', 'steady', 'swings-last')],
      hard: [sketch('rabbits', 100_000, 'rises')]
    },
    delay: true
  },
  {
    id: 'fertilise',
    habitat: 'meadow',
    preset: 'meadow.lively',
    actions: [set(1, 1)],
    horizon: 104,
    questions: {
      easy: [level('clover', 104, LOWER)],
      medium: [shape('clover', 'falls', 'rises', 'steady', 'fall-rise')],
      hard: [sketch('clover', 100_000, 'falls')]
    },
    delay: false
  },
  {
    id: 'drought',
    habitat: 'meadow',
    preset: 'meadow.lively',
    actions: [set(0, 1), set(0, 0, 12)],
    horizon: 52,
    questions: {
      easy: [level('grass', 13, LOWER)],
      medium: [shape('grass', 'fall-rise', 'falls', 'steady', 'rise-fall')],
      hard: [sketch('grass', 200_000, 'fall-rise')]
    },
    delay: false
  },
  {
    id: 'clover-poor',
    habitat: 'meadow',
    preset: 'meadow.poor',
    actions: [add('clover')],
    horizon: 104,
    questions: {
      easy: [level('flowers', 104, HIGHER)],
      medium: [shape('flowers', 'rises', 'falls', 'steady', 'rise-fall')],
      hard: [sketch('flowers', 500_000, 'rises')]
    },
    delay: true
  },
  {
    id: 'worms-gone',
    habitat: 'meadow',
    preset: 'meadow.lively',
    actions: [remove('worms', 100)],
    horizon: 104,
    questions: {
      easy: [level('clover', 104, HIGHER)],
      medium: [shape('clover', 'rises', 'falls', 'steady', 'rise-fall')],
      hard: [sketch('clover', 200_000, 'rises')]
    },
    delay: true
  },
  {
    id: 'foxes-return',
    habitat: 'meadow',
    preset: 'meadow.nofox',
    actions: [add('foxes')],
    horizon: 156,
    questions: {
      easy: [level('clover', 156, HIGHER)],
      medium: [shape('clover', 'rises', 'falls', 'steady', 'rise-fall'), shape('rabbits', 'falls', 'rises', 'steady', 'rise-fall')],
      hard: [sketch('rabbits', 200_000, 'falls')]
    },
    delay: true
  },
  {
    id: 'ladybirds-gone',
    habitat: 'meadow',
    preset: 'meadow.lively',
    actions: [remove('ladybirds', 90)],
    horizon: 26,
    questions: {
      easy: [level('aphids', 8, HIGHER)],
      medium: [shape('aphids', 'rise-fall', 'rises', 'steady', 'falls')],
      hard: [sketch('aphids', 50_000, 'rise-fall')]
    },
    delay: false
  }
];

export const CHALLENGE_IDS: readonly string[] = CHALLENGES.map((c) => c.id);
export const challengeOf = (id: string): Challenge | undefined => CHALLENGES.find((c) => c.id === id);

/** The round of 4: pond, meadow, pond, meadow (first habitat from the seed), each with its question (§ 10.1). */
export function drawRound(seed: number, difficulty: Difficulty): { challenge: string; question: number }[] {
  const rng = createRng(seed);
  const pond = rng.shuffle(CHALLENGES.filter((c) => c.habitat === 'pond').map((c) => c.id).sort());
  const meadow = rng.shuffle(CHALLENGES.filter((c) => c.habitat === 'meadow').map((c) => c.id).sort());
  const first = rng.int(0, 1);
  const order = first === 0 ? [pond[0]!, meadow[0]!, pond[1]!, meadow[1]!] : [meadow[0]!, pond[0]!, meadow[1]!, pond[1]!];
  return order.map((id) => ({ challenge: id, question: rng.int(0, challengeOf(id)!.questions[difficulty].length - 1) }));
}

/** The challenge's start (the preset, before its change), the value of a species before the change, and the run. */
export const challengeStart = (c: Challenge) => PRESETS[c.preset].sim;

export function preValue(c: Challenge, species: string): number {
  const hab = habitatDef(c.habitat);
  const i = speciesIndex(hab, species);
  return PRESETS[c.preset].sim.b[i]! + PRESETS[c.preset].sim.j[i]!.reduce((x, y) => x + y, 0);
}

/** The model run of a challenge over its horizon (samples[0] = before the change). */
export const runChallenge = (c: Challenge) => simulate(cloneSim(challengeStart(c)), c.habitat, c.actions, c.horizon);

/** The series of one species over the horizon. */
export function seriesOf(c: Challenge, samples: readonly (readonly number[])[], species: string): number[] {
  const i = speciesIndex(habitatDef(c.habitat), species);
  return samples.map((s) => s[i]!);
}
