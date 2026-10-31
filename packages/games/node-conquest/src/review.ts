import { countsOf, type NcState } from './rules';

/**
 * Post-game review, derived deterministically from the compact history in the state
 * (node counts per faction every `hist.every` ticks) plus the final position.
 */

export interface Point {
  tick: number;
  /** Node count per faction (player first). */
  counts: number[];
}

export type MomentKind = 'gain' | 'loss' | 'centre' | 'leadGained' | 'leadLost';

export interface Moment {
  kind: MomentKind;
  tick: number;
  /** Size of the swing (gain/loss), otherwise 0. */
  value: number;
  /** Faction that took the centre (centre only), otherwise 0. */
  faction: number;
}

export interface Review {
  points: Point[];
  /** Up to three key moments, in time order. */
  moments: Moment[];
  /** The player's highest node count and the first tick it was reached. */
  best: { count: number; tick: number };
}

export function historyPoints(s: NcState, factions: number): Point[] {
  const { start, every, rows } = s.hist;
  const points = rows.map((counts, i) => ({ tick: start + i * every, counts: [...counts] }));
  const last = points[points.length - 1];
  if (!last || last.tick < s.tick) points.push({ tick: s.tick, counts: countsOf(s, factions) });
  return points;
}

const leads = (counts: readonly number[]) => counts.slice(1).every((c) => counts[0]! > c);

export function reviewOf(s: NcState, factions: number): Review {
  const points = historyPoints(s, factions);
  const moments: Moment[] = [];

  // Biggest swing of the player's node count between two samples (earliest on ties).
  let swing: Moment | null = null;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i]!.counts[0]! - points[i - 1]!.counts[0]!;
    if (delta !== 0 && (!swing || Math.abs(delta) > swing.value)) swing = { kind: delta > 0 ? 'gain' : 'loss', tick: points[i]!.tick, value: Math.abs(delta), faction: 0 };
  }
  if (swing) moments.push(swing);

  if (s.centre.length === 2) moments.push({ kind: 'centre', tick: s.centre[0]!, value: 0, faction: s.centre[1]! });

  // The last time the player took or lost the lead (strictly more nodes than every rival).
  let lead: Moment | null = null;
  for (let i = 1; i < points.length; i++) {
    const before = leads(points[i - 1]!.counts);
    const now = leads(points[i]!.counts);
    if (before !== now) lead = { kind: now ? 'leadGained' : 'leadLost', tick: points[i]!.tick, value: 0, faction: 0 };
  }
  if (lead) moments.push(lead);

  let best = { count: -1, tick: 0 };
  for (const p of points) if (p.counts[0]! > best.count) best = { count: p.counts[0]!, tick: p.tick };

  moments.sort((a, b) => a.tick - b.tick);
  return { points, moments, best };
}
