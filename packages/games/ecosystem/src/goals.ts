/**
 * The four goals (design § 10.2): a preset with continuing conditions, the allowed tools, a target and a deadline, the
 * reference plans ("Show me a way") and the tested non-solutions. Pure: status, budgets and "Does it hold?".
 */
import { habitatDef, speciesIndex, type Habitat } from './habitats';
import { cloneSim, extendRun, simulate, sortActions, startRun, type Action, type Run } from './model';
import { PRESETS } from './presets';
import type { PresetId } from './spinup';
import type { Difficulty } from './challenges';

export const GOAL_IDS = ['save-pondweed', 'clear-pond', 'protect-flowers', 'bring-back-clover'] as const;
export type GoalId = (typeof GOAL_IDS)[number];

/** One condition on a sample: the sum of the species' amounts compared with a value (u). */
export interface Term {
  readonly species: readonly string[];
  readonly op: 'ge' | 'le';
  readonly value: number;
}

/** `every`: all terms hold in every week through the deadline; `streak`: all hold for `weeks` weeks in a row by then. */
export type Target = { readonly kind: 'every'; readonly terms: readonly Term[] } | { readonly kind: 'streak'; readonly weeks: number; readonly terms: readonly Term[] };

/** A tool: an action template (the week is filled in when it is applied). */
export type Tool = Omit<Action, 'week'> & { readonly id: string };

export interface GoalPlan {
  /** Content key of its explanation (`goals.<goal>.plans.<key>`). */
  readonly key: string;
  readonly actions: readonly Action[];
  /** The loop the plan works through (highlighted in the review diagram). */
  readonly loop: string;
}

export interface Goal {
  readonly id: GoalId;
  readonly habitat: Habitat;
  readonly preset: PresetId;
  /** Changes that are part of the situation (not the player's, not counted, not undoable). */
  readonly script: readonly Action[];
  readonly target: Target;
  readonly deadline: number;
  readonly tools: readonly Tool[];
  /** The species shown in the focus chart (the first term's first species). */
  readonly focus: string;
  readonly plans: readonly GoalPlan[];
  /** Whether the review checks if the result holds for 104 more weeks. */
  readonly holdCheck: boolean;
}

/** Interventions allowed per difficulty (∞ on easy). */
export const BUDGET: Readonly<Record<Difficulty, number>> = { easy: Number.POSITIVE_INFINITY, medium: 6, hard: 4 };
export const HOLD_WEEKS = 104;

const at = (week: number, a: Omit<Action, 'week'>): Action => ({ week, ...a });
// Pond conditions: 0 light, 1 runoff (0 none … 3 high), 2 water flow (0 still, 1 trickle, 2 stream). Meadow: 0 rain, 1 fertiliser.
const RUNOFF_LOW = { kind: 'set', cond: 1, level: 1 } as const;
const RUNOFF_NONE = { kind: 'set', cond: 1, level: 0 } as const;
const STREAM = { kind: 'set', cond: 2, level: 2 } as const;
const STILL = { kind: 'set', cond: 2, level: 0 } as const;

export const GOALS: readonly Goal[] = [
  {
    id: 'save-pondweed',
    habitat: 'pond',
    preset: 'pond.lively',
    script: [at(0, { kind: 'set', cond: 1, level: 3 })],
    target: { kind: 'every', terms: [{ species: ['pondweed'], op: 'ge', value: 100_000 }] },
    deadline: 104,
    tools: [
      { id: 'buffer', ...RUNOFF_LOW },
      { id: 'ditch', ...RUNOFF_NONE },
      { id: 'net', kind: 'net-algae' },
      { id: 'dredge', kind: 'dredge' },
      { id: 'fish-out', kind: 'remove', species: 'minnows', share: 90 },
      { id: 'pike', kind: 'add', species: 'pike' },
      { id: 'stream', ...STREAM },
      { id: 'still', ...STILL }
    ],
    focus: 'pondweed',
    plans: [
      { key: 'buffer', actions: [at(0, RUNOFF_LOW)], loop: 'R1' },
      { key: 'ditch', actions: [at(0, RUNOFF_NONE)], loop: 'R1' }
    ],
    holdCheck: false
  },
  {
    id: 'clear-pond',
    habitat: 'pond',
    preset: 'pond.green',
    script: [],
    target: {
      kind: 'streak',
      weeks: 12,
      terms: [
        { species: ['algae', 'bluegreen'], op: 'le', value: 80_000 },
        { species: ['pondweed'], op: 'ge', value: 50_000 }
      ]
    },
    deadline: 156,
    tools: [
      { id: 'ditch', ...RUNOFF_NONE },
      { id: 'dredge', kind: 'dredge' },
      { id: 'plant', kind: 'add', species: 'pondweed' },
      { id: 'fish-out', kind: 'remove', species: 'minnows', share: 90 },
      { id: 'pike', kind: 'add', species: 'pike' },
      { id: 'treat', kind: 'treat-algae' },
      { id: 'net', kind: 'net-algae' },
      { id: 'stream', ...STREAM },
      { id: 'still', ...STILL }
    ],
    focus: 'pondweed',
    plans: [
      {
        key: 'restore',
        actions: [at(0, RUNOFF_NONE), at(0, { kind: 'dredge' }), at(0, { kind: 'add', species: 'pondweed' }), at(0, { kind: 'remove', species: 'minnows', share: 90 })],
        loop: 'R1'
      },
      { key: 'flush', actions: [at(0, RUNOFF_NONE), at(0, STREAM), at(20, STILL), at(20, { kind: 'add', species: 'pondweed' })], loop: 'R1' }
    ],
    holdCheck: true
  },
  {
    id: 'protect-flowers',
    habitat: 'meadow',
    preset: 'meadow.lively',
    script: [at(0, { kind: 'spray' })],
    target: { kind: 'every', terms: [{ species: ['flowers'], op: 'ge', value: 60_000 }] },
    deadline: 52,
    tools: [
      { id: 'ladybirds', kind: 'add', species: 'ladybirds' },
      { id: 'spray', kind: 'spray' },
      { id: 'mow-remove', kind: 'mow', cuttings: 'remove' },
      { id: 'mow-leave', kind: 'mow', cuttings: 'leave' }
    ],
    focus: 'flowers',
    plans: [{ key: 'ladybirds', actions: [at(10, { kind: 'add', species: 'ladybirds' })], loop: 'B2' }],
    holdCheck: false
  },
  {
    id: 'bring-back-clover',
    habitat: 'meadow',
    preset: 'meadow.nofox',
    script: [],
    target: { kind: 'streak', weeks: 8, terms: [{ species: ['clover'], op: 'ge', value: 20_000 }] },
    deadline: 208,
    tools: [
      { id: 'foxes', kind: 'add', species: 'foxes' },
      { id: 'rabbits-50', kind: 'remove', species: 'rabbits', share: 50 },
      { id: 'rabbits-90', kind: 'remove', species: 'rabbits', share: 90 },
      { id: 'clover', kind: 'add', species: 'clover' }
    ],
    focus: 'clover',
    plans: [
      { key: 'foxes', actions: [at(0, { kind: 'add', species: 'foxes' })], loop: 'B2' },
      { key: 'foxesRabbits', actions: [at(0, { kind: 'add', species: 'foxes' }), at(0, { kind: 'remove', species: 'rabbits', share: 50 })], loop: 'B2' },
      {
        key: 'foxesRabbitsClover',
        actions: [at(0, { kind: 'add', species: 'foxes' }), at(0, { kind: 'remove', species: 'rabbits', share: 90 }), at(0, { kind: 'add', species: 'clover' })],
        loop: 'B2'
      }
    ],
    holdCheck: true
  }
];

export const goalOf = (id: string): Goal | undefined => GOALS.find((g) => g.id === id);

/** Whether an action matches one of the goal's tools (ignoring the week). */
export function toolOf(goal: Goal, a: Action): Tool | undefined {
  return goal.tools.find(
    (t) =>
      t.kind === a.kind &&
      (t.species ?? null) === (a.species ?? null) &&
      (t.share ?? null) === (a.share ?? null) &&
      (t.cuttings ?? null) === (a.cuttings ?? null) &&
      (t.cond ?? null) === (a.cond ?? null) &&
      (t.level ?? null) === (a.level ?? null)
  );
}

export const toolAction = (t: Tool, week: number): Action => {
  const { id: _id, ...rest } = t;
  return { week, ...rest };
};

/** Whether a sample meets every term of the target. */
export function meets(goal: Goal, sample: readonly number[]): boolean {
  const hab = habitatDef(goal.habitat);
  return goal.target.terms.every((term) => {
    let v = 0;
    for (const id of term.species) v += sample[speciesIndex(hab, id)] ?? 0;
    return term.op === 'ge' ? v >= term.value : v <= term.value;
  });
}

export type GoalStatus = { readonly kind: 'running' } | { readonly kind: 'failed'; readonly week: number } | { readonly kind: 'reached'; readonly week: number };

/**
 * The status after the samples so far (`samples[w]` = after week w): `every` fails at the first week below the line
 * and is reached when the deadline passed without; `streak` is reached at the week that completes the streak and
 * fails once the deadline passed without.
 */
export function goalStatus(goal: Goal, samples: readonly (readonly number[])[]): GoalStatus {
  const last = Math.min(samples.length - 1, goal.deadline);
  if (goal.target.kind === 'every') {
    for (let w = 1; w <= last; w++) if (!meets(goal, samples[w]!)) return { kind: 'failed', week: w };
    return last >= goal.deadline ? { kind: 'reached', week: goal.deadline } : { kind: 'running' };
  }
  let streak = 0;
  for (let w = 1; w <= last; w++) {
    streak = meets(goal, samples[w]!) ? streak + 1 : 0;
    if (streak >= goal.target.weeks) return { kind: 'reached', week: w };
  }
  return last >= goal.deadline ? { kind: 'failed', week: goal.deadline } : { kind: 'running' };
}

/** All actions of a goal notebook in replay order: the script first, then the player's log. */
export const goalActions = (goal: Goal, log: readonly Action[]): Action[] => sortActions([...goal.script, ...log]);

/** A fresh run of the goal with the player's log (to `week`). */
export function goalRun(goal: Goal, log: readonly Action[], week: number): Run {
  const hab = habitatDef(goal.habitat);
  const actions = goalActions(goal, log);
  return extendRun(startRun(cloneSim(PRESETS[goal.preset].sim), hab, actions), hab, actions, week);
}

/**
 * Runs a goal notebook on by `weeks` (or until the status changes), never past the deadline; returns the run and the
 * new status. `run` must be the run of `log` so far (it is extended in place).
 */
export function runGoal(goal: Goal, run: Run, log: readonly Action[], weeks: number): { run: Run; status: GoalStatus } {
  const hab = habitatDef(goal.habitat);
  const actions = goalActions(goal, log);
  const end = Math.min(goal.deadline, run.sim.week + weeks);
  let status = goalStatus(goal, run.samples);
  while (run.sim.week < end && status.kind === 'running') {
    extendRun(run, hab, actions, run.sim.week + 1);
    status = goalStatus(goal, run.samples);
  }
  return { run, status };
}

/** "Does it hold?": with no new changes, the first week after reaching where the target no longer holds, or -1. */
export function holdsAfter(goal: Goal, log: readonly Action[], reachedWeek: number): number {
  const run = simulate(cloneSim(PRESETS[goal.preset].sim), goal.habitat, goalActions(goal, log.filter((a) => a.week <= reachedWeek)), reachedWeek + HOLD_WEEKS);
  for (let w = reachedWeek + 1; w < run.samples.length; w++) if (!meets(goal, run.samples[w]!)) return w;
  return -1;
}

/** The outcome of a whole plan run to the deadline (tests, "Show me a way"). */
export function planOutcome(goal: Goal, actions: readonly Action[]): GoalStatus {
  return runGoal(goal, goalRun(goal, actions, 0), actions, goal.deadline).status;
}
