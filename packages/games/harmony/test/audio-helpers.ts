/** Helpers shared by the level-cap tests (fast and slow). */
import type { Variant } from '../src/audio/play';
import { ATTACK, gainAt, type ScheduledNote } from '../src/audio/schedule';
import type { Spec } from '../src/spec';

/** The sum of all note envelopes at many instants (every edge ± ε and, unless `grid` is false, a fine grid). */
export function peakSum(notes: readonly ScheduledNote[], grid = true): number {
  const times = new Set<number>();
  for (const n of notes) for (const t of [n.start, n.start + ATTACK, n.end, n.stop]) for (const d of [-1e-6, 0, 1e-6]) times.add(t + d);
  // Each envelope rises only during its attack and never rises afterwards, so the sum peaks at an attack's end; the grid
  // is an extra, independent check.
  const end = Math.max(0, ...notes.map((n) => n.stop));
  if (grid) for (let t = 0; t <= end; t += 0.01) times.add(t);
  let max = 0;
  for (const t of times) max = Math.max(max, notes.reduce((s, n) => s + gainAt(n, t), 0));
  return max;
}

/** Every variant a spec can play. */
export function variants(spec: Spec): Variant[] {
  const out: Variant[] = [{ kind: 'question' }];
  const options = spec.k === 'pair' ? 2 : spec.k === 'changed' ? 4 : spec.k === 'build' ? 0 : spec.options.length;
  for (let i = 0; i < options; i++) out.push({ kind: 'option', i });
  if (spec.k === 'interval') out.push({ kind: 'together-apart' });
  if (spec.k === 'changed') out.push({ kind: 'A' }, { kind: 'B' });
  if (spec.k === 'build') out.push({ kind: 'target' }, { kind: 'keys', keys: [61, 64, 70, 83] });
  return out;
}

