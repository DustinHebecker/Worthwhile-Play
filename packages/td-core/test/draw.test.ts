import { describe, expect, it } from 'vitest';
import { PROFILE, TOP } from '@wp/strategy-art';
import { archetypeOf, createWorld, spawn, type World } from '@wp/strategy-engine';
import { drawFrame, ENEMY_ICON, TOWER_ICON, type Frame, type Palette } from '../src/draw';
import { ENEMY_KINDS, FAMILIES, TD_RULESET } from '../src/ruleset';

/** A canvas context that records the calls (no Path2D in tests: pictures fall back to shapes). */
function recorder(): { g: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = [];
  const g = new Proxy({} as Record<string, unknown>, {
    get: (_t, key: string) => (...args: unknown[]) => calls.push(`${key}(${args.map((a) => (typeof a === 'number' ? Math.round(a * 10) / 10 : String(a))).join(',')})`),
    set: (_t, key: string, value: unknown) => {
      calls.push(`${key}=${String(value)}`);
      return true;
    }
  });
  return { g: g as unknown as CanvasRenderingContext2D, calls };
}
const PALETTE: Palette = { surface: '#fff', ink: '#000', muted: '#888', own: '#00f', enemy: '#f00', focus: '#0f0', grid: '#ccc', terrain: { key: 'k', base: () => '#eee', dark: false } };
function frameOf(world: World): Frame {
  return { world, beams: [], blasts: [], selected: null, entries: [], goals: [], hpMax: (k) => archetypeOf(TD_RULESET, k)?.hp ?? 1, splashOf: () => 0 };
}
function draw(build: (w: World) => void, extra: Partial<Frame> = {}): string[] {
  const w = createWorld({ map: { w: 5, h: 5, terrain: '='.repeat(25) }, sides: 2, entities: [], seed: 1 }, TD_RULESET);
  build(w);
  const { g, calls } = recorder();
  drawFrame(g, 220, PALETTE, { ...frameOf(w), ...extra }, null);
  return calls;
}
const put = (w: World, kind: string, side = 1) => {
  const e = spawn(w.nextId++, side, archetypeOf(TD_RULESET, kind)!, 2, 2);
  w.entities.push(e);
  return e;
};

describe('pictures in the strategy look', () => {
  it('every tower family has a strategy picture in both views, and the families look different', () => {
    for (const family of FAMILIES) {
      expect(PROFILE[TOWER_ICON[family]], family).toBeDefined();
      expect(TOP[TOWER_ICON[family]], family).toBeDefined();
    }
    expect(new Set(Object.values(TOWER_ICON)).size).toBe(FAMILIES.length);
  });

  it('every wave unit has a picture; units sharing one differ in size', () => {
    const seen = new Map<string, number[]>();
    for (const kind of ENEMY_KINDS) {
      const [icon, size] = ENEMY_ICON[kind]!;
      expect(PROFILE[icon], kind).toBeDefined();
      const sizes = seen.get(icon) ?? [];
      expect(sizes, `${kind} needs its own size`).not.toContain(size);
      seen.set(icon, [...sizes, size]);
    }
  });
});

describe('state marks (never colour alone)', () => {
  const lineTos = (calls: string[]) => calls.filter((c) => c.startsWith('lineTo')).length;

  it('a shielded unit gets a hexagon while its shield lasts', () => {
    const plain = draw((w) => put(w, 'walker'));
    const shielded = draw((w) => put(w, 'shielder'));
    expect(lineTos(shielded) - lineTos(plain)).toBe(6);
    const broken = draw((w) => {
      put(w, 'shielder').shield = 0;
    });
    expect(lineTos(broken)).toBe(lineTos(plain));
  });

  it('a marked unit gets a diamond; an expired mark none', () => {
    const plain = draw((w) => put(w, 'walker'));
    const marked = draw((w) => {
      put(w, 'walker').status = [{ kind: 'marked', ticks: 5, amount: 25 }];
    });
    expect(lineTos(marked) - lineTos(plain)).toBe(3);
    expect(marked.filter((c) => c === 'closePath()').length).toBe(plain.filter((c) => c === 'closePath()').length + 1);
    const expired = draw((w) => {
      put(w, 'walker').status = [{ kind: 'marked', ticks: 0, amount: 25 }];
    });
    expect(lineTos(expired)).toBe(lineTos(plain));
  });

  it('level pips: dots for branches A and B (filled, hollow), squares for C, each on a halo', () => {
    const rects = (calls: string[]) => calls.filter((c) => c.startsWith('rect(')).length;
    const arcs = (calls: string[]) => calls.filter((c) => c.startsWith('arc(')).length;
    const a = draw((w) => put(w, 'focus-2', 0));
    const b = draw((w) => put(w, 'pulse-2', 0));
    const c = draw((w) => put(w, 'prism-2', 0));
    // The fallback tower shape is one rect; level 3 adds three pips, each a halo and a pip.
    expect(rects(a)).toBe(1);
    expect(rects(c)).toBe(7);
    expect(arcs(a) - arcs(c)).toBe(6);
    expect(b.filter((x) => x === 'stroke()').length - a.filter((x) => x === 'stroke()').length).toBe(3);
    expect(a.filter((x) => x === 'fill()').length - b.filter((x) => x === 'fill()').length).toBe(3);
    // Pips are at least 0.15 of a cell wide (6.6 px on a 44 px cell).
    const pip = c.filter((x) => x.startsWith('rect('))[2]!;
    expect(Number(pip.slice(5, -1).split(',')[2])).toBeGreaterThanOrEqual((220 / 5) * 0.15 - 0.1);
  });
});

describe('outside force (hybrid External modes)', () => {
  it('draws the wave units of both sides alike, in ink', () => {
    const unitFills = (neutral: boolean) => {
      const calls = draw(
        (w) => {
          put(w, 'walker', 0);
          w.entities.push(spawn(w.nextId++, 1, archetypeOf(TD_RULESET, 'walker')!, 3, 3));
        },
        { neutralUnits: neutral }
      );
      return calls.filter((c, i) => c.startsWith('fillStyle=') && calls[i + 1] === 'fill()').map((c) => c.slice(10));
    };
    // Each side's units in its own colour; as an outside force none of them in a side colour.
    expect(unitFills(false)).toContain(PALETTE.own);
    expect(unitFills(false)).toContain(PALETTE.enemy);
    expect(unitFills(true)).toContain(PALETTE.ink);
    expect(unitFills(true)).not.toContain(PALETTE.own);
    expect(unitFills(true)).not.toContain(PALETTE.enemy);
  });
});

describe('unit pictures', () => {
  it('every wave unit kind has its own picture, drawn without errors, facing either way', async () => {
    const { drawUnit, UNIT_KINDS } = await import('../src/units');
    const { ENEMY_KINDS } = await import('../src/ruleset');
    expect([...UNIT_KINDS].sort()).toEqual([...ENEMY_KINDS].sort());
    const shapes = new Set<string>();
    for (const kind of UNIT_KINDS) {
      for (const facing of [1, -1] as const) {
        for (const moving of [false, true]) {
          const { g, calls } = recorder();
          expect(drawUnit(g, kind, 20, 20, 40, { colour: '#00f', ink: '#000', surface: '#fff', facing, phase: 0.3, moving }), kind).toBe(true);
          expect(calls).toContain(`scale(${facing},1)`);
          if (facing === 1 && !moving) shapes.add(calls.filter((c) => !c.includes('=')).join('|'));
        }
      }
    }
    // Different silhouettes: no two kinds draw the same path.
    expect(shapes.size).toBe(UNIT_KINDS.length);
    const { g } = recorder();
    expect(drawUnit(g, 'gun', 0, 0, 10, { colour: '#00f', ink: '#000', surface: '#fff', facing: 1, phase: 0, moving: false })).toBe(false);
  });

  it('moving units swing their legs; standing ones do not', async () => {
    const { drawUnit } = await import('../src/units');
    const draw1 = (phase: number, moving: boolean) => {
      const { g, calls } = recorder();
      drawUnit(g, 'walker', 0, 0, 44, { colour: '#00f', ink: '#000', surface: '#fff', facing: 1, phase, moving });
      return calls.join('|');
    };
    expect(draw1(0.1, true)).not.toBe(draw1(0.3, true));
    expect(draw1(0.1, false)).toBe(draw1(0.3, false));
  });
});
