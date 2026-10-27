import type { Entity, SimEvent } from '@wp/strategy-engine';

/**
 * Turn replay (owner request 2026-10-27: "die Bewegungen und Schüsse beim Rundenwechsel sehen"): the
 * last turn played back tick by tick from what the side was told (its reported events) and what it
 * knows now (its picture). Presentation only: nothing here changes the game, and a replay can be
 * cut short at any moment. Each unit is walked back from where it is now through the cells its
 * steps left (`fx`, `fy` of a move); units lost in the turn come back from their last cell.
 */

export interface ReplayUnit {
  readonly id: number;
  readonly side: number;
  readonly kind: string;
  /** Cell at the start of the turn (index 0) and after each tick (index k), `null` while it is not on the map. */
  readonly cells: readonly ({ x: number; y: number } | null)[];
}

export type ReplayShot =
  /** A direct shot or beam from a unit at another (both as they stood in that tick). */
  | { readonly t: 'fire'; readonly tick: number; readonly from: number; readonly to: number }
  /** A shell fired by a unit at a cell. */
  | { readonly t: 'shell'; readonly tick: number; readonly from: number; readonly x: number; readonly y: number }
  /** A shell landing, or the muzzle flash of an unseen shooter, on a cell. */
  | { readonly t: 'burst'; readonly tick: number; readonly x: number; readonly y: number }
  /** A unit was hit. */
  | { readonly t: 'hit'; readonly tick: number; readonly id: number };

export interface Replay {
  /** Ticks in the turn: frames 0 (start) … `ticks` (end). */
  readonly ticks: number;
  readonly units: readonly ReplayUnit[];
  readonly shots: readonly ReplayShot[];
}

const cellOk = (x: unknown, y: unknown): x is number => Number.isInteger(x) && Number.isInteger(y);

/**
 * The replay of the turn that ended at `lastTick` (`ticks` ticks long), from the side's picture now
 * (`entities`) and the events it was told. `null` when there is nothing to show (no events) or the
 * events cannot be played back (saved before steps carried the cell they left).
 */
export function buildReplay(entities: readonly Entity[], events: readonly SimEvent[], lastTick: number, ticks: number): Replay | null {
  const first = lastTick - ticks + 1;
  const inTurn = events.filter((e) => Number.isInteger(e.tick) && e.tick >= first && e.tick <= lastTick);
  if (inTurn.length === 0 || ticks < 1) return null;
  const index = (tick: number) => tick - first + 1;
  const moves = inTurn.filter((e): e is Extract<SimEvent, { t: 'move' }> => e.t === 'move');
  if (moves.some((m) => !cellOk(m.fx, m.fy) || !cellOk(m.x, m.y))) return null;

  // Where each unit stands at the end of the turn, and when it left the map or came onto it.
  interface Track {
    id: number;
    side: number;
    kind: string;
    end: { x: number; y: number };
    /** Index of the frame from which it is gone (lost or landed), or none. */
    goneAt?: number;
    /** Index of the first frame it is on the map (produced, launched, placed). */
    from?: number;
  }
  const tracks = new Map<number, Track>();
  for (const e of entities) tracks.set(e.id, { id: e.id, side: e.side, kind: e.kind, end: { x: e.x, y: e.y } });
  for (const e of inTurn) {
    if (e.t === 'destroyed' && cellOk(e.x, e.y)) tracks.set(e.id, { id: e.id, side: e.side, kind: e.kind, end: { x: e.x, y: e.y }, goneAt: index(e.tick) });
    if (e.t === 'drone-docked') {
      const t = tracks.get(e.id);
      if (t) t.goneAt = index(e.tick);
    }
  }
  for (const e of inTurn) {
    if ((e.t === 'produced' || e.t === 'drone-launched' || e.t === 'site') && tracks.has(e.id)) (tracks.get(e.id) as Track).from = index(e.tick);
  }

  const units: ReplayUnit[] = [];
  for (const track of tracks.values()) {
    const own = moves.filter((m) => m.id === track.id).sort((a, b) => b.tick - a.tick);
    const cells: ({ x: number; y: number } | null)[] = Array.from({ length: ticks + 1 }, () => null);
    // Walk back from the end: before each step the unit stood on the cell that step left.
    let at = track.end;
    let next = 0;
    for (let k = ticks; k >= 0; k--) {
      cells[k] = at;
      while (next < own.length && index((own[next] as (typeof own)[number]).tick) === k) {
        const step = own[next] as (typeof own)[number];
        at = { x: step.fx as number, y: step.fy as number };
        next++;
      }
    }
    // Gone from the frame after the tick it was lost in; on the map from the frame after the tick it came.
    for (let k = 0; k <= ticks; k++) if ((track.goneAt !== undefined && k >= track.goneAt) || (track.from !== undefined && k < track.from)) cells[k] = null;
    units.push({ id: track.id, side: track.side, kind: track.kind, cells });
  }
  units.sort((a, b) => a.id - b.id);

  const shots: ReplayShot[] = [];
  for (const e of inTurn) {
    const tick = index(e.tick);
    if (e.t === 'fire' && tracks.has(e.id) && tracks.has(e.target)) shots.push({ t: 'fire', tick, from: e.id, to: e.target });
    else if (e.t === 'launch' && tracks.has(e.id) && cellOk(e.x, e.y)) shots.push({ t: 'shell', tick, from: e.id, x: e.x, y: e.y });
    else if ((e.t === 'land' || e.t === 'flash') && cellOk(e.x, e.y)) shots.push({ t: 'burst', tick, x: e.x, y: e.y });
    else if (e.t === 'hit' && e.damage > 0 && tracks.has(e.id)) shots.push({ t: 'hit', tick, id: e.id });
  }
  return { ticks, units, shots };
}

/** Where a replay unit is at time `f` (0 … ticks, fractions between frames), or `null` when it is not on the map. */
export function positionAt(unit: ReplayUnit, time: number): { x: number; y: number } | null {
  const f = Math.max(0, Math.min(unit.cells.length - 1, time));
  const k = Math.floor(f);
  const a = unit.cells[k] ?? null;
  const b = unit.cells[Math.min(unit.cells.length - 1, k + 1)] ?? null;
  if (!a) return null;
  if (!b) return a;
  const p = f - k;
  const ease = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
  return { x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * ease };
}
