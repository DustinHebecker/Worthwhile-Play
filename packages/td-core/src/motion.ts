import type { SimEvent } from '@wp/strategy-engine';

/**
 * Smooth movement for the view (owner playtest 2026-11-01: "the units still move like the
 * turn-based strategy game"). The engine moves a unit one whole cell when it has gathered enough
 * movement points, so on the map it would jump a cell about once a second. Here every step glides
 * over the time the unit takes for a cell: from the cell it left to the cell it reached, starting at
 * the tick of the step and lasting as long as its previous step took (its pace, slowed or not).
 * The picture therefore trails the simulation by up to one cell; nothing in the rules depends on it.
 */

/** Where a unit is drawn (cells), how far through its step (0..1) and the step's direction. */
export interface Placed {
  x: number;
  y: number;
  progress: number;
  dx: number;
  dy: number;
}

interface Glide {
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  /** Tick of the step (the engine tick at which the unit reached tx, ty). */
  at: number;
  /** Ticks the glide lasts. */
  span: number;
}

/** Ticks a step lasts when the unit's pace is not known yet (a Walker on road: one cell per second). */
export const DEFAULT_SPAN = 8;
/** Longest glide: a unit that stood still for long does not crawl over its next cell. */
export const MAX_SPAN = 32;

export class Motion {
  private glides = new Map<number, Glide>();

  /** Forgets everything (a new game, a restore, a new round). */
  clear(): void {
    this.glides.clear();
  }

  /** Takes the steps of a batch of ticks; units that are gone are forgotten by `prune`. */
  update(events: readonly SimEvent[]): void {
    for (const e of events) {
      if (e.t !== 'move' || e.fx === undefined || e.fy === undefined) continue;
      const before = this.glides.get(e.id);
      const span = before ? Math.min(MAX_SPAN, Math.max(1, e.tick - before.at)) : DEFAULT_SPAN;
      this.glides.set(e.id, { fx: e.fx, fy: e.fy, tx: e.x, ty: e.y, at: e.tick, span });
    }
  }

  /** Drops the glides of units that no longer exist. */
  prune(alive: ReadonlySet<number>): void {
    for (const id of this.glides.keys()) if (!alive.has(id)) this.glides.delete(id);
  }

  /**
   * Where to draw a unit standing on (x, y) at time `now` (engine ticks, fractional), and how far
   * through its current step it is (0..1; 1 when it is not moving).
   */
  position(id: number, x: number, y: number, now: number): Placed {
    const g = this.glides.get(id);
    if (!g || g.tx !== x || g.ty !== y) return { x, y, progress: 1, dx: 0, dy: 0 };
    const p = Math.max(0, Math.min(1, (now - g.at) / g.span));
    return { x: g.fx + (g.tx - g.fx) * p, y: g.fy + (g.ty - g.fy) * p, progress: p, dx: Math.sign(g.tx - g.fx), dy: Math.sign(g.ty - g.fy) };
  }
}
