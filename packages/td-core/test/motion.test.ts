import { describe, expect, it } from 'vitest';
import type { SimEvent } from '@wp/strategy-engine';
import { DEFAULT_SPAN, MAX_SPAN, Motion } from '../src/motion';

const move = (tick: number, id: number, fx: number, fy: number, x: number, y: number): SimEvent => ({ t: 'move', tick, id, x, y, fx, fy });

describe('smooth movement', () => {
  it('a unit not seen moving stands on its cell', () => {
    expect(new Motion().position(1, 3, 4, 10)).toEqual({ x: 3, y: 4, progress: 1, dx: 0, dy: 0 });
  });

  it('the first step glides over the default span, from the cell it left', () => {
    const m = new Motion();
    m.update([move(10, 1, 2, 0, 2, 1)]);
    expect(m.position(1, 2, 1, 10)).toEqual({ x: 2, y: 0, progress: 0, dx: 0, dy: 1 });
    const half = m.position(1, 2, 1, 10 + DEFAULT_SPAN / 2);
    expect(half.y).toBeCloseTo(0.5, 9);
    expect(half.progress).toBeCloseTo(0.5, 9);
    expect(m.position(1, 2, 1, 10 + DEFAULT_SPAN)).toEqual({ x: 2, y: 1, progress: 1, dx: 0, dy: 1 });
    expect(m.position(1, 2, 1, 99)).toEqual({ x: 2, y: 1, progress: 1, dx: 0, dy: 1 });
    expect(m.position(1, 2, 1, 5)).toEqual({ x: 2, y: 0, progress: 0, dx: 0, dy: 1 });
  });

  it('later steps last as long as the previous step took (the unit’s pace), within bounds', () => {
    const m = new Motion();
    m.update([move(0, 1, 0, 0, 0, 1), move(16, 1, 0, 1, 0, 2)]);
    expect(m.position(1, 0, 2, 24).y).toBeCloseTo(1.5, 9);
    m.update([move(100, 1, 0, 2, 0, 3)]);
    expect(m.position(1, 0, 3, 100 + MAX_SPAN / 2).y).toBeCloseTo(2.5, 9);
    m.update([move(100, 2, 5, 5, 6, 5), move(100, 2, 6, 5, 7, 5)]);
    // Two steps in one tick: the second glides over at least one tick.
    expect(m.position(2, 7, 5, 100.5).x).toBeCloseTo(6.5, 9);
  });

  it('a unit that is elsewhere than its last step (teleported, a new round) stands on its cell', () => {
    const m = new Motion();
    m.update([move(0, 1, 0, 0, 0, 1)]);
    expect(m.position(1, 4, 4, 2)).toEqual({ x: 4, y: 4, progress: 1, dx: 0, dy: 0 });
  });

  it('ignores other events and moves without a start cell; prune and clear forget units', () => {
    const m = new Motion();
    m.update([{ t: 'fire', tick: 0, id: 1, target: 2 }, { t: 'move', tick: 0, id: 1, x: 1, y: 1 }]);
    expect(m.position(1, 1, 1, 0).progress).toBe(1);
    m.update([move(0, 1, 0, 0, 0, 1), move(0, 2, 0, 0, 1, 0)]);
    m.prune(new Set([2]));
    expect(m.position(1, 0, 1, 0).progress).toBe(1);
    expect(m.position(2, 1, 0, 0).progress).toBe(0);
    m.clear();
    expect(m.position(2, 1, 0, 0).progress).toBe(1);
  });
});
