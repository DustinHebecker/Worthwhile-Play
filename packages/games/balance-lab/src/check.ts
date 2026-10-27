/** Outcomes and goals (design §§ 11.2, 14): what "Let go" shows, computed only by the statics core. */
import type { Scene, TaskSpec } from './generate';
import { emptySlots } from './solve';
import { beamVerdict, mobileVerdicts, stackVerdict, type Side } from './statics';

export type Outcome =
  | { bench: 'beam' | 'mobile'; sides: Side[] }
  | { bench: 'stack'; stands: boolean; edge: boolean; failing: { joint: number; dir: 'left' | 'right' }[]; overhang: number };

export function outcomeOf(scene: Scene): Outcome {
  if (scene.bench === 'beam') return { bench: 'beam', sides: [beamVerdict(scene.s)] };
  if (scene.bench === 'mobile') return { bench: 'mobile', sides: mobileVerdicts(scene.s) };
  return { bench: 'stack', ...stackVerdict(scene.s) };
}

/** Parts still in the tray. */
export function trayLeft(task: Pick<TaskSpec, 'tray'>, scene: Scene): number {
  if (scene.bench === 'beam') return task.tray.length - scene.s.weights.filter((w) => w.free).length;
  if (scene.bench === 'mobile') return emptySlots(scene.s);
  return task.tray.length - scene.s.cubes.filter((c) => c.free).length;
}

export function outcomeMeets(task: Pick<TaskSpec, 'goal'>, outcome: Outcome): boolean {
  const goal = task.goal;
  if (!goal) return false;
  if (outcome.bench !== 'stack') return goal.kind === 'level' && outcome.sides.every((s) => s === 'level');
  if (!outcome.stands) return false;
  return goal.kind === 'overhang' ? outcome.overhang >= goal.cm : goal.kind === 'stand';
}

export function goalMet(task: Pick<TaskSpec, 'goal' | 'tray'>, scene: Scene): boolean {
  return trayLeft(task, scene) === 0 && outcomeMeets(task, outcomeOf(scene));
}
