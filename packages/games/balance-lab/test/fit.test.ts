// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { contentBox, fitViewBox, pathPoints, toClient, toScene } from '../src/fit';
import { drawScene, s, type SceneOptions } from '../src/scene-view';
import type { Scene } from '../src/generate';
import { outcomeOf } from '../src/check';

const opts: SceneOptions = { outcome: null, explain: false, animate: false, cursor: null, marked: null, flag: null, title: 't', desc: 'd', kgUnit: { pre: '', post: 'kg' } };

describe('scene framing', () => {
  it('reads the points of the simple paths the scene draws', () => {
    expect(pathPoints('M10 20h14l-7 9z')).toEqual([
      [10, 20],
      [24, 20],
      [17, 29]
    ]);
    expect(pathPoints('M0 0L5 6H9V2')).toEqual([
      [0, 0],
      [5, 6],
      [9, 6],
      [9, 2]
    ]);
    expect(pathPoints('M5 18h14l-4 5 4 5h-14z').at(-1)).toEqual([5, 28]);
  });

  it('ignores parts marked data-nofit and covers the whole tipping motion', () => {
    const g = s('g', {}, s('rect', { x: -1000, y: 0, width: 5000, height: 10, 'data-nofit': '' }), s('rect', { x: 0, y: 0, width: 100, height: 10 }));
    expect(contentBox(g)).toEqual({ x0: 0, y0: 0, x1: 100, y1: 10 });
    const turned = s('g', { 'data-rot': 90, 'data-cx': 0, 'data-cy': 0 }, s('line', { x1: 0, y1: 0, x2: 100, y2: 0 }));
    const b = contentBox(s('g', {}, turned))!;
    // At rest (0°), half-way (45°) and in the final pose (90°).
    expect(b.x1).toBeCloseTo(100);
    expect(b.y1).toBeCloseTo(100);
    expect(fitViewBox(s('g'), '0 0 320 230')).toBe('0 0 320 230');
  });

  it('frames every bench around its content, larger than the old fixed picture on a phone', () => {
    const scenes: Scene[] = [
      { bench: 'beam', s: { half: 4, axle: 0, barKg: 0, weights: [{ kg: 3, hook: -2 }] } },
      { bench: 'stack', s: { bodies: [{ kind: 'block', left: -10 }, { kind: 'block', left: -6 }], cubes: [{ kg: 2, x: 0, on: 1 }] } },
      {
        bench: 'mobile',
        s: { bar: { width: 4, string: 2, hooks: [{ pos: 0, child: { kg: 2 } }, { pos: 4, child: null }] } }
      }
    ] as Scene[];
    for (const sc of scenes) {
      const svg = drawScene(sc, opts);
      const [, , w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
      if (sc.bench !== 'beam') expect(w).toBeLessThan(320);
      // Weights carry their unit, so they never read like a part number.
      expect(svg.querySelector('.bl-kg')?.textContent).toMatch(/^\d+kg$/);
    }
  });

  it('puts the fall note above the upright stack, clear of the tipped parts', () => {
    const sc = { bench: 'stack', s: { bodies: [{ kind: 'block', left: -12 }, { kind: 'block', left: 4 }], cubes: [] } } as Scene;
    const outcome = outcomeOf(sc);
    expect(outcome.bench === 'stack' && outcome.failing.length).toBeTruthy();
    const svg = drawScene(sc, { ...opts, outcome, explain: true });
    const note = svg.querySelector('.bl-fall-note')!;
    const top = Math.min(...Array.from(svg.querySelectorAll('.bl-body')).map((b) => Number(b.getAttribute('y'))));
    expect(Number(note.getAttribute('y'))).toBeLessThan(top);
  });

  it('keeps the beam weight label off the axle dot when the axle is in the middle', () => {
    const svg = drawScene({ bench: 'beam', s: { half: 6, axle: 0, barKg: 7, weights: [] } } as Scene, opts);
    const axle = svg.querySelector('.bl-axle')!;
    const label = svg.querySelector('.bl-kg')!;
    expect(Math.abs(Number(label.getAttribute('x')) - Number(axle.getAttribute('cx')))).toBeGreaterThanOrEqual(15);
  });

  it('maps client points into the fitted viewBox, letterboxed, and back', () => {
    // A 100 × 50 viewBox in a 400 × 400 box: scale 4, 100 px of letterbox above and below.
    const rect = { left: 10, top: 20, width: 400, height: 400 };
    expect(toScene('-20 30 100 50', rect, 10, 120)).toEqual({ x: -20, y: 30 });
    expect(toScene('-20 30 100 50', rect, 410, 320)).toEqual({ x: 80, y: 80 });
    expect(toClient('-20 30 100 50', rect, 30, 55)).toEqual({ x: 210, y: 220 });
    for (const [x, y] of [[0, 0], [12.5, -3], [77, 41]] as const) {
      const c = toClient('5 -10 320 230', rect, x, y);
      const back = toScene('5 -10 320 230', rect, c.x, c.y);
      expect(back.x).toBeCloseTo(x, 9);
      expect(back.y).toBeCloseTo(y, 9);
    }
    // A missing or broken viewBox falls back to the default frame.
    expect(toScene(null, { left: 0, top: 0, width: 320, height: 230 }, 160, 115)).toEqual({ x: 160, y: 115 });
    expect(toScene('1 2 x', { left: 0, top: 0, width: 320, height: 230 }, 0, 0)).toEqual({ x: 0, y: 0 });
  });
});
