import { describe, expect, it } from 'vitest';
import type { Entity, SimEvent } from '@wp/strategy-engine';
import { buildReplay, positionAt } from '../src/replay';

const unit = (id: number, side: number, kind: string, x: number, y: number): Entity => ({ id, side, kind, x, y, hp: 40, mp: 0, cooldown: 0, order: { type: 'hold' }, status: [], beam: null });
const move = (tick: number, id: number, fx: number, fy: number, x: number, y: number): SimEvent => ({ t: 'move', tick, id, x, y, fx, fy });

describe('turn replay', () => {
  // A turn of 6 ticks ending at tick 12 (ticks 7 … 12; frames 0 … 6).
  const last = 12;

  it('walks each unit back through the cells its steps left', () => {
    const r = buildReplay([unit(1, 0, 'rifles', 3, 1), unit(2, 1, 'rifles', 9, 9)], [move(8, 1, 1, 1, 2, 1), move(10, 1, 2, 1, 3, 1)], last, 6)!;
    expect(r.ticks).toBe(6);
    expect(r.units.map((u) => u.id)).toEqual([1, 2]);
    expect(r.units[0]!.cells).toEqual([
      { x: 1, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 1 }
    ]);
    // A unit that did not move stands still the whole turn.
    expect(new Set(r.units[1]!.cells.map((c) => JSON.stringify(c)))).toEqual(new Set([JSON.stringify({ x: 9, y: 9 })]));
  });

  it('brings lost units back until they fall, and new ones in from when they came', () => {
    const events: SimEvent[] = [
      move(7, 5, 4, 4, 5, 4),
      { t: 'destroyed', tick: 9, id: 5, side: 1, kind: 'rifles', x: 5, y: 4 },
      { t: 'produced', tick: 12, id: 7, side: 0, kind: 'lancer', x: 0, y: 1, by: 3 },
      { t: 'drone-docked', tick: 11, id: 8, side: 0, by: 6 }
    ];
    const r = buildReplay([unit(7, 0, 'lancer', 0, 1), unit(8, 0, 'kite', 2, 2)], events, last, 6)!;
    const lost = r.units.find((u) => u.id === 5)!;
    expect(lost.kind).toBe('rifles');
    expect(lost.cells.slice(0, 3)).toEqual([{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 4 }]);
    expect(lost.cells.slice(3)).toEqual([null, null, null, null]);
    const made = r.units.find((u) => u.id === 7)!;
    expect(made.cells.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(made.cells[6]).toEqual({ x: 0, y: 1 });
    const landed = r.units.find((u) => u.id === 8)!;
    expect(landed.cells.slice(0, 5).every((c) => c !== null)).toBe(true);
    expect(landed.cells.slice(5)).toEqual([null, null]);
  });

  it('collects shots, shells, bursts and hits of the turn by tick', () => {
    const events: SimEvent[] = [
      { t: 'fire', tick: 7, id: 1, target: 2 },
      { t: 'launch', tick: 8, id: 1, x: 9, y: 9 },
      { t: 'land', tick: 10, x: 9, y: 9 },
      { t: 'flash', tick: 11, id: 4, side: 1, kind: 'warden', x: 6, y: 6 },
      { t: 'hit', tick: 10, id: 2, side: 1, damage: 12 },
      { t: 'hit', tick: 10, id: 1, side: 0, damage: 0 },
      // Not in this turn, or about units the side does not know: left out.
      { t: 'fire', tick: 3, id: 1, target: 2 },
      { t: 'fire', tick: 9, id: 1, target: 99 }
    ];
    const r = buildReplay([unit(1, 0, 'howitzer', 1, 1), unit(2, 1, 'rifles', 9, 9)], events, last, 6)!;
    expect(r.shots).toEqual([
      { t: 'fire', tick: 1, from: 1, to: 2 },
      { t: 'shell', tick: 2, from: 1, x: 9, y: 9 },
      { t: 'burst', tick: 4, x: 9, y: 9 },
      { t: 'burst', tick: 5, x: 6, y: 6 },
      { t: 'hit', tick: 4, id: 2 }
    ]);
  });

  it('has nothing to show without events of the turn, and cannot play steps saved without the cell they left', () => {
    expect(buildReplay([unit(1, 0, 'rifles', 1, 1)], [], last, 6)).toBeNull();
    expect(buildReplay([unit(1, 0, 'rifles', 1, 1)], [{ t: 'bump', tick: 2, id: 1 }], last, 6)).toBeNull();
    expect(buildReplay([unit(1, 0, 'rifles', 1, 1)], [{ t: 'move', tick: 8, id: 1, x: 1, y: 1 }], last, 6)).toBeNull();
    expect(buildReplay([unit(1, 0, 'rifles', 1, 1)], [{ t: 'bump', tick: 8, id: 1 }], last, 0)).toBeNull();
    expect(buildReplay([unit(1, 0, 'rifles', 1, 1)], [{ t: 'bump', tick: 8, id: 1 }], last, 6)).not.toBeNull();
  });

  it('moves smoothly between frames and holds the last cell of a unit that is gone in the next frame', () => {
    const u = { id: 1, side: 0, kind: 'rifles', cells: [{ x: 0, y: 0 }, { x: 2, y: 0 }, null] };
    expect(positionAt(u, 0)).toEqual({ x: 0, y: 0 });
    expect(positionAt(u, 0.5)).toEqual({ x: 1, y: 0 });
    expect(positionAt(u, 0.25)!.x).toBeCloseTo(0.25);
    expect(positionAt(u, 0.75)!.x).toBeCloseTo(1.75);
    expect(positionAt(u, 1)).toEqual({ x: 2, y: 0 });
    expect(positionAt(u, 1.5)).toEqual({ x: 2, y: 0 });
    expect(positionAt(u, 2)).toBeNull();
    expect(positionAt(u, -1)).toEqual({ x: 0, y: 0 });
    expect(positionAt(u, 9)).toBeNull();
  });
});
