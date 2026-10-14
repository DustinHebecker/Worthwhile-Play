import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { DT, GRAVITY, SLOP, TIME_TO_SLEEP, World, createBody, massProperties, partSeparation } from '../src/physics';
import { PIECE_KINDS, centroidOf, kindById, polygonArea, type Polygon } from '../src/pieces';
import { platformParts } from '../src/rules';

const box = (w: number, h: number): Polygon => [
  [-w / 2, -h / 2],
  [w / 2, -h / 2],
  [w / 2, h / 2],
  [-w / 2, h / 2]
];

const withPlatform = () => {
  const world = new World();
  world.add({ parts: platformParts(), x: 0, y: 0, a: 0, isStatic: true });
  return world;
};

const run = (world: World, steps: number) => {
  for (let i = 0; i < steps; i++) world.step();
};

const poses = (world: World) => world.bodies.map((b) => [b.x, b.y, b.a, b.vx, b.vy, b.w]);

describe('piece catalogue', () => {
  it('has convex, counter-clockwise parts whose union matches the outline, centred on the centre of mass', () => {
    for (const kind of PIECE_KINDS) {
      const partsArea = kind.parts.reduce((sum, p) => sum + polygonArea(p), 0);
      expect(partsArea, kind.id).toBeCloseTo(polygonArea(kind.outline), 9);
      expect(polygonArea(kind.outline), kind.id).toBeGreaterThan(0.3);
      const [cx, cy] = centroidOf(kind.parts);
      expect(Math.abs(cx), kind.id).toBeLessThan(1e-9);
      expect(Math.abs(cy), kind.id).toBeLessThan(1e-9);
      for (const part of kind.parts) {
        expect(polygonArea(part), kind.id).toBeGreaterThan(0);
        for (let i = 0; i < part.length; i++) {
          const [ax, ay] = part[i]!;
          const [bx, by] = part[(i + 1) % part.length]!;
          const [cx2, cy2] = part[(i + 2) % part.length]!;
          // Left turn at every vertex = convex and counter-clockwise.
          expect((bx - ax) * (cy2 - by) - (by - ay) * (cx2 - bx), kind.id).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has unique ids', () => {
    expect(new Set(PIECE_KINDS.map((k) => k.id)).size).toBe(PIECE_KINDS.length);
    expect(kindById('block')).toBe(0);
    expect(kindById('nope')).toBe(-1);
  });
});

describe('mass properties', () => {
  it('computes area and polar moment of a unit square and a 2×1 rectangle', () => {
    expect(massProperties([box(1, 1)]).mass).toBeCloseTo(1, 12);
    expect(massProperties([box(1, 1)]).inertia).toBeCloseTo(1 / 6, 12);
    const r = massProperties([box(2, 1)]);
    expect(r.mass).toBeCloseTo(2, 12);
    expect(r.inertia).toBeCloseTo((2 * (4 + 1)) / 12, 12);
  });

  it('gives static bodies zero inverse mass and asleep bodies zero velocity', () => {
    const s = createBody({ parts: [box(1, 1)], x: 0, y: 0, a: 0, isStatic: true });
    expect(s.invMass).toBe(0);
    expect(s.invI).toBe(0);
    expect(s.awake).toBe(false);
    const b = createBody({ parts: [box(1, 1)], x: 0, y: 0, a: 0, asleep: true, vx: 3, vy: 2, w: 1 });
    expect([b.vx, b.vy, b.w]).toEqual([0, 0, 0]);
    expect(b.sleepTime).toBe(TIME_TO_SLEEP);
    expect(b.awake).toBe(false);
  });

  it('measures separation and overlap between convex parts', () => {
    const a = createBody({ parts: [box(1, 1)], x: 0, y: 0, a: 0 });
    const b = createBody({ parts: [box(1, 1)], x: 1.5, y: 0, a: 0 });
    const c = createBody({ parts: [box(1, 1)], x: 0.8, y: 0, a: 0 });
    expect(partSeparation(a.parts[0]!, b.parts[0]!)).toBeCloseTo(0.5, 12);
    expect(partSeparation(a.parts[0]!, c.parts[0]!)).toBeCloseTo(-0.2, 12);
  });
});

describe('world', () => {
  it('lets a free body fall with gravity (slightly damped)', () => {
    const world = new World();
    world.add({ parts: [box(1, 1)], x: 0, y: 10, a: 0 });
    run(world, 60);
    const b = world.bodies[0]!;
    expect(b.vy).toBeLessThan(-GRAVITY * 0.95);
    expect(b.vy).toBeGreaterThan(-GRAVITY * 1.0001);
    expect(b.y).toBeLessThan(10 - 0.5 * GRAVITY * 0.95);
    expect(b.x).toBe(0);
    expect(b.a).toBe(0);
  });

  it('rests a box on the platform, puts it to sleep and keeps penetration within the slop', () => {
    const world = withPlatform();
    world.add({ parts: [box(1, 1)], x: 0.3, y: 1.5, a: 0 });
    let steps = 0;
    while (!world.allAsleep() && steps < 600) {
      world.step();
      steps++;
    }
    expect(world.allAsleep()).toBe(true);
    expect(steps).toBeLessThan(200);
    const b = world.bodies[1]!;
    expect(b.y).toBeGreaterThan(0.5 - 2 * SLOP);
    expect(b.y).toBeLessThan(0.5 + 0.01);
    expect(Math.abs(b.x - 0.3)).toBeLessThan(0.01);
    expect(Math.abs(b.a)).toBeLessThan(0.01);
    expect(world.maxPenetration()).toBeLessThan(2 * SLOP);
  });

  it('keeps a tall stack of blocks standing', () => {
    const world = withPlatform();
    for (let i = 0; i < 10; i++) world.add({ parts: [box(1, 1)], x: (i % 2) * 0.1, y: 0.5 + i + 0.001, a: 0 });
    run(world, 400);
    for (let i = 0; i < 10; i++) {
      const b = world.bodies[i + 1]!;
      expect(Math.abs(b.x - (i % 2) * 0.1), `block ${i}`).toBeLessThan(0.02);
      expect(Math.abs(b.y - (0.5 + i)), `block ${i}`).toBeLessThan(0.03);
    }
    expect(world.allAsleep()).toBe(true);
  });

  it('topples a block whose centre is beyond the edge', () => {
    const world = withPlatform();
    world.add({ parts: [box(1, 1)], x: 2.75, y: 0.5, a: 0 });
    run(world, 300);
    expect(world.bodies[1]!.y).toBeLessThan(-1);
  });

  it('resolves an initial overlap without launching the bodies', () => {
    const world = withPlatform();
    world.add({ parts: [box(1, 1)], x: 0, y: 0.45, a: 0 });
    world.add({ parts: [box(1, 1)], x: 0.2, y: 1.35, a: 0 });
    const e0 = world.energy();
    let maxSpeed = 0;
    for (let i = 0; i < 120; i++) {
      world.step();
      for (const b of world.bodies) maxSpeed = Math.max(maxSpeed, Math.hypot(b.vx, b.vy));
    }
    expect(maxSpeed).toBeLessThan(0.5);
    expect(world.maxPenetration()).toBeLessThan(0.02);
    // Pushing out of the overlap lifts the bodies a little but adds no kinetic energy.
    expect(world.energy()).toBeLessThan(e0 + 2 * GRAVITY * 0.1);
  });

  it('slides on a steep slope but holds on a gentle one (friction)', () => {
    const slope = (angle: number) => {
      const world = new World();
      world.add({ parts: [box(20, 1)], x: 0, y: 0, a: angle, isStatic: true });
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      world.add({ parts: [box(1, 0.5)], x: nx * 0.75, y: ny * 0.75, a: angle });
      run(world, 120);
      const b = world.bodies[1]!;
      return Math.hypot(b.x - nx * 0.75, b.y - ny * 0.75);
    };
    expect(slope(0.2)).toBeLessThan(0.03); // tan 0.2 ≈ 0.2 < μ = 0.6
    expect(slope(0.9)).toBeGreaterThan(1); // tan 0.9 ≈ 1.26 > μ
  });

  it('is bit-for-bit deterministic', () => {
    const build = () => {
      const world = withPlatform();
      PIECE_KINDS.slice(0, 6).forEach((k, i) => world.add({ parts: k.parts, x: -2 + 0.8 * i, y: 1 + 1.3 * i, a: 0.3 * i }));
      return world;
    };
    const a = build();
    const b = build();
    run(a, 240);
    run(b, 240);
    expect(poses(a)).toEqual(poses(b));
  });

  it('never gains energy while a random stone falls onto a random little tower (property)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ k: fc.integer({ min: 0, max: PIECE_KINDS.length - 1 }), x: fc.double({ min: -1.5, max: 1.5, noNaN: true }), a: fc.double({ min: -3, max: 3, noNaN: true }) }), { minLength: 1, maxLength: 4 }),
        (drops) => {
          const world = withPlatform();
          let max = -Infinity;
          drops.forEach((d, i) => world.add({ parts: PIECE_KINDS[d.k]!.parts, x: d.x, y: 2 + 2.2 * i, a: d.a }));
          const e0 = world.energy();
          for (let i = 0; i < 240; i++) {
            world.step();
            max = Math.max(max, world.energy());
          }
          // Small allowance for split-impulse position correction (penetration ≤ a few slops).
          expect(max).toBeLessThanOrEqual(e0 + 0.05 * drops.length);
        }
      ),
      { numRuns: 25 }
    );
  });

  it('primes resting contacts so a woken settled stack does not sag', () => {
    const settled = withPlatform();
    for (let i = 0; i < 6; i++) settled.add({ parts: [box(2, 0.5)], x: 0.2 * (i % 3), y: 0.25 + 0.5 * i, a: 0 });
    run(settled, 300);
    const snapshot = settled.bodies.slice(1).map((b) => ({ x: b.x, y: b.y, a: b.a }));
    const cold = withPlatform();
    for (const s of snapshot) cold.add({ parts: [box(2, 0.5)], x: s.x, y: s.y, a: s.a });
    cold.prime();
    expect(cold.bodies.every((b) => b.vx === 0 && b.vy === 0 && b.w === 0)).toBe(true);
    run(cold, 30);
    cold.bodies.slice(1).forEach((b, i) => {
      expect(Math.abs(b.y - snapshot[i]!.y)).toBeLessThan(0.003);
      expect(Math.abs(b.x - snapshot[i]!.x)).toBeLessThan(0.003);
    });
  });

  it('does not integrate sleeping islands, and wakes them on contact', () => {
    const world = withPlatform();
    world.add({ parts: [box(1, 1)], x: -1.5, y: 0.5, a: 0, asleep: true });
    world.add({ parts: [box(1, 1)], x: 1.5, y: 0.5, a: 0, asleep: true });
    world.add({ parts: [box(1, 1)], x: 1.5, y: 2, a: 0 });
    world.prime();
    run(world, 10);
    expect(world.bodies[1]!.awake).toBe(false);
    run(world, 30);
    expect(world.bodies[2]!.awake).toBe(true); // touched by the falling box
    expect(world.bodies[1]!.awake).toBe(false); // separate island stays asleep
    expect(world.bodies[1]!.y).toBe(0.5);
    expect(DT).toBeCloseTo(1 / 60, 12);
  });
});
