/**
 * Small deterministic 2D rigid-body physics for Stack Duel (pure, DOM-free).
 *
 * Design (in the spirit of "Box2D Lite", written from scratch):
 * - Bodies are rigid compounds of convex polygons (concave pieces are decomposed upfront);
 *   uniform density 1, so mass = area.
 * - Fixed time step (1/60 s), gravity 10 units/s², small linear/angular damping.
 * - Narrow phase: separating-axis test on polygon pairs and reference-face clipping into
 *   contact manifolds of up to two points per part pair (with a small speculative margin).
 * - Solver: sequential impulses with friction (Coulomb, clamped by the accumulated normal
 *   impulse), restitution 0 and warm starting matched by contact feature + proximity.
 * - Penetration is removed with split impulses (pseudo velocities that move bodies but are
 *   discarded afterwards), so resolving overlap never adds kinetic energy.
 * - Islands (union–find over touching dynamic bodies) sleep together once every body has
 *   been nearly still for 0.5 s. Sleeping islands are neither solved nor integrated, and
 *   contacts between sleeping bodies are not recomputed. Bodies restored from a save start
 *   asleep with zero velocity, so a settled tower stays exactly where it is until something
 *   touches it.
 *
 * Determinism: only plain IEEE doubles, Math.sin/cos/sqrt, fixed iteration order (body
 * index order, i < j pairs), no object-key iteration, no randomness. Same inputs therefore
 * give bit-identical results within one JS engine.
 */
import type { Polygon } from './pieces';

export const DT = 1 / 60;
export const GRAVITY = 10;
/** Contacts are created up to this gap (speculative contacts avoid jitter and tunnelling). */
export const MARGIN = 0.02;
/** Allowed penetration that is not corrected (keeps resting contacts warm). */
export const SLOP = 0.005;
const BAUMGARTE = 0.2;
const VELOCITY_ITERATIONS = 12;
const POSITION_ITERATIONS = 6;
const FRICTION = 0.6;
const LINEAR_DAMPING = 0.05;
const ANGULAR_DAMPING = 0.3;
export const SLEEP_LINEAR = 0.03;
export const SLEEP_ANGULAR = 0.05;
export const TIME_TO_SLEEP = 0.5;

interface Part {
  readonly n: number;
  readonly lx: number[];
  readonly ly: number[];
  readonly lnx: number[];
  readonly lny: number[];
  readonly wx: number[];
  readonly wy: number[];
  readonly wnx: number[];
  readonly wny: number[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Body {
  x: number;
  y: number;
  a: number;
  vx: number;
  vy: number;
  w: number;
  readonly mass: number;
  readonly inertia: number;
  readonly invMass: number;
  readonly invI: number;
  readonly isStatic: boolean;
  readonly parts: Part[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** Seconds this body has been nearly still. */
  sleepTime: number;
  awake: boolean;
}

export interface BodyDef {
  /** Convex, counter-clockwise polygons around the body origin (= centre of mass for dynamic bodies). */
  readonly parts: readonly Polygon[];
  readonly x: number;
  readonly y: number;
  readonly a: number;
  readonly isStatic?: boolean;
  /** Starts asleep with zero velocity (used for bodies restored from a settled state). */
  readonly asleep?: boolean;
  readonly vx?: number;
  readonly vy?: number;
  readonly w?: number;
}

interface ContactPoint {
  /** Feature key: part indices, reference side and reference edge. */
  readonly key: number;
  readonly nx: number;
  readonly ny: number;
  /** Contact point relative to body A / B centres. */
  readonly rax: number;
  readonly ray: number;
  readonly rbx: number;
  readonly rby: number;
  readonly sep: number;
  pn: number;
  pt: number;
  pp: number;
  massN: number;
  massT: number;
  bias: number;
}

interface Manifold {
  readonly a: number;
  readonly b: number;
  readonly points: ContactPoint[];
  readonly friction: number;
}

function makePart(poly: Polygon): Part {
  const n = poly.length;
  const lx: number[] = [];
  const ly: number[] = [];
  const lnx: number[] = [];
  const lny: number[] = [];
  for (let i = 0; i < n; i++) {
    const [x1, y1] = poly[i]!;
    const [x2, y2] = poly[(i + 1) % n]!;
    lx.push(x1);
    ly.push(y1);
    const ex = x2 - x1;
    const ey = y2 - y1;
    const len = Math.sqrt(ex * ex + ey * ey);
    lnx.push(ey / len);
    lny.push(-ex / len);
  }
  return { n, lx, ly, lnx, lny, wx: lx.slice(), wy: ly.slice(), wnx: lnx.slice(), wny: lny.slice(), minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

/** Mass and rotational inertia about the origin for density 1. */
export function massProperties(parts: readonly Polygon[]): { mass: number; inertia: number } {
  let mass = 0;
  let inertia = 0;
  for (const poly of parts) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i]!;
      const [x2, y2] = poly[(i + 1) % poly.length]!;
      const cross = x1 * y2 - x2 * y1;
      mass += cross / 2;
      inertia += (cross * (x1 * x1 + x1 * x2 + x2 * x2 + y1 * y1 + y1 * y2 + y2 * y2)) / 12;
    }
  }
  return { mass, inertia };
}

export function createBody(def: BodyDef): Body {
  const isStatic = def.isStatic === true;
  const { mass, inertia } = massProperties(def.parts);
  const asleep = def.asleep === true;
  const body: Body = {
    x: def.x,
    y: def.y,
    a: def.a,
    vx: asleep ? 0 : (def.vx ?? 0),
    vy: asleep ? 0 : (def.vy ?? 0),
    w: asleep ? 0 : (def.w ?? 0),
    mass: isStatic ? 0 : mass,
    inertia: isStatic ? 0 : inertia,
    invMass: isStatic ? 0 : 1 / mass,
    invI: isStatic ? 0 : 1 / inertia,
    isStatic,
    parts: def.parts.map(makePart),
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    sleepTime: asleep ? TIME_TO_SLEEP : 0,
    awake: !isStatic && !asleep
  };
  updateGeometry(body);
  return body;
}

/** Recomputes world-space vertices, normals and bounding boxes of a body. */
export function updateGeometry(body: Body): void {
  const c = Math.cos(body.a);
  const s = Math.sin(body.a);
  let bMinX = Infinity;
  let bMinY = Infinity;
  let bMaxX = -Infinity;
  let bMaxY = -Infinity;
  for (const part of body.parts) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < part.n; i++) {
      const lx = part.lx[i]!;
      const ly = part.ly[i]!;
      const x = body.x + lx * c - ly * s;
      const y = body.y + lx * s + ly * c;
      part.wx[i] = x;
      part.wy[i] = y;
      const nx = part.lnx[i]!;
      const ny = part.lny[i]!;
      part.wnx[i] = nx * c - ny * s;
      part.wny[i] = nx * s + ny * c;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    part.minX = minX;
    part.minY = minY;
    part.maxX = maxX;
    part.maxY = maxY;
    if (minX < bMinX) bMinX = minX;
    if (minY < bMinY) bMinY = minY;
    if (maxX > bMaxX) bMaxX = maxX;
    if (maxY > bMaxY) bMaxY = maxY;
  }
  body.minX = bMinX;
  body.minY = bMinY;
  body.maxX = bMaxX;
  body.maxY = bMaxY;
}

/** Largest separation of `q` from any edge of `p` (positive = a separating axis exists). */
function maxSeparation(p: Part, q: Part): { edge: number; sep: number } {
  let best = -Infinity;
  let edge = 0;
  for (let i = 0; i < p.n; i++) {
    const nx = p.wnx[i]!;
    const ny = p.wny[i]!;
    const vx = p.wx[i]!;
    const vy = p.wy[i]!;
    let si = Infinity;
    for (let j = 0; j < q.n; j++) {
      const d = nx * (q.wx[j]! - vx) + ny * (q.wy[j]! - vy);
      if (d < si) si = d;
    }
    if (si > best) {
      best = si;
      edge = i;
    }
  }
  return { edge, sep: best };
}

/** Signed penetration-free distance between two convex parts (negative = overlap depth). */
export function partSeparation(p: Part, q: Part): number {
  return Math.max(maxSeparation(p, q).sep, maxSeparation(q, p).sep);
}

interface ClipVertex {
  x: number;
  y: number;
}

function clipSegment(v: ClipVertex[], nx: number, ny: number, offset: number): ClipVertex[] {
  const out: ClipVertex[] = [];
  const v0 = v[0]!;
  const v1 = v[1]!;
  const d0 = nx * v0.x + ny * v0.y - offset;
  const d1 = nx * v1.x + ny * v1.y - offset;
  if (d0 <= 0) out.push(v0);
  if (d1 <= 0) out.push(v1);
  if (d0 * d1 < 0) {
    const t = d0 / (d0 - d1);
    out.push({ x: v0.x + t * (v1.x - v0.x), y: v0.y + t * (v1.y - v0.y) });
  }
  return out;
}

/**
 * Appends contact points between part `pa` of body A and `pb` of body B. Normals point
 * from A to B; points are the midpoints between the two surfaces.
 */
function collideParts(pa: Part, pb: Part, partKey: number, out: { key: number; nx: number; ny: number; x: number; y: number; sep: number }[]): void {
  const sa = maxSeparation(pa, pb);
  if (sa.sep > MARGIN) return;
  const sb = maxSeparation(pb, pa);
  if (sb.sep > MARGIN) return;
  const flip = sb.sep > sa.sep + 0.1 * SLOP;
  const ref = flip ? pb : pa;
  const inc = flip ? pa : pb;
  const refEdge = flip ? sb.edge : sa.edge;
  const nx = ref.wnx[refEdge]!;
  const ny = ref.wny[refEdge]!;
  let incEdge = 0;
  let minDot = Infinity;
  for (let i = 0; i < inc.n; i++) {
    const d = nx * inc.wnx[i]! + ny * inc.wny[i]!;
    if (d < minDot) {
      minDot = d;
      incEdge = i;
    }
  }
  const i2 = (incEdge + 1) % inc.n;
  const r2 = (refEdge + 1) % ref.n;
  const v11x = ref.wx[refEdge]!;
  const v11y = ref.wy[refEdge]!;
  const v12x = ref.wx[r2]!;
  const v12y = ref.wy[r2]!;
  let tx = v12x - v11x;
  let ty = v12y - v11y;
  const tl = Math.sqrt(tx * tx + ty * ty);
  tx /= tl;
  ty /= tl;
  const seg: ClipVertex[] = [
    { x: inc.wx[incEdge]!, y: inc.wy[incEdge]! },
    { x: inc.wx[i2]!, y: inc.wy[i2]! }
  ];
  const c1 = clipSegment(seg, -tx, -ty, -(tx * v11x + ty * v11y));
  if (c1.length < 2) return;
  const c2 = clipSegment(c1, tx, ty, tx * v12x + ty * v12y);
  if (c2.length < 2) return;
  const front = nx * v11x + ny * v11y;
  const key = partKey | (flip ? 1 << 16 : 0) | (refEdge << 17);
  const onx = flip ? -nx : nx;
  const ony = flip ? -ny : ny;
  for (const p of c2) {
    const sep = nx * p.x + ny * p.y - front;
    if (sep <= MARGIN) out.push({ key, nx: onx, ny: ony, x: p.x - (nx * sep) / 2, y: p.y - (ny * sep) / 2, sep });
  }
}

export interface StepStats {
  contacts: number;
}

/** A physics world: bodies (index order is significant for determinism) and persistent contacts. */
export class World {
  readonly bodies: Body[] = [];
  private manifolds = new Map<number, Manifold>();
  private firstStep = true;

  add(def: BodyDef): number {
    this.bodies.push(createBody(def));
    this.firstStep = true;
    return this.bodies.length - 1;
  }

  /** True once every dynamic body is asleep. */
  allAsleep(): boolean {
    for (const b of this.bodies) if (!b.isStatic && b.sleepTime < TIME_TO_SLEEP) return false;
    return true;
  }

  private collide(): Manifold[] {
    const bodies = this.bodies;
    const old = this.manifolds;
    const next = new Map<number, Manifold>();
    const list: Manifold[] = [];
    const raw: { key: number; nx: number; ny: number; x: number; y: number; sep: number }[] = [];
    for (let i = 0; i < bodies.length; i++) {
      const A = bodies[i]!;
      for (let j = i + 1; j < bodies.length; j++) {
        const B = bodies[j]!;
        if (A.isStatic && B.isStatic) continue;
        const pairKey = i * 4096 + j;
        if (!this.firstStep && !A.awake && !B.awake) {
          // Nothing moved: keep the previous manifold (needed for island connectivity).
          const kept = old.get(pairKey);
          if (kept) {
            next.set(pairKey, kept);
            list.push(kept);
          }
          continue;
        }
        if (A.maxX + MARGIN < B.minX || B.maxX + MARGIN < A.minX || A.maxY + MARGIN < B.minY || B.maxY + MARGIN < A.minY) continue;
        raw.length = 0;
        for (let pi = 0; pi < A.parts.length; pi++) {
          const pa = A.parts[pi]!;
          for (let pj = 0; pj < B.parts.length; pj++) {
            const pb = B.parts[pj]!;
            if (pa.maxX + MARGIN < pb.minX || pb.maxX + MARGIN < pa.minX || pa.maxY + MARGIN < pb.minY || pb.maxY + MARGIN < pa.minY) continue;
            collideParts(pa, pb, pi | (pj << 8), raw);
          }
        }
        if (raw.length === 0) continue;
        const prev = old.get(pairKey);
        const points: ContactPoint[] = [];
        for (const r of raw) {
          const rax = r.x - A.x;
          const ray = r.y - A.y;
          let pn = 0;
          let pt = 0;
          if (prev) {
            // Warm start from the closest previous point with the same feature.
            let bestD = 0.05 * 0.05;
            for (const q of prev.points) {
              if (q.key !== r.key) continue;
              const dx = q.rax - rax;
              const dy = q.ray - ray;
              const d = dx * dx + dy * dy;
              if (d < bestD) {
                bestD = d;
                pn = q.pn;
                pt = q.pt;
              }
            }
          }
          points.push({ key: r.key, nx: r.nx, ny: r.ny, rax, ray, rbx: r.x - B.x, rby: r.y - B.y, sep: r.sep, pn, pt, pp: 0, massN: 0, massT: 0, bias: 0 });
        }
        const m: Manifold = { a: i, b: j, points, friction: FRICTION };
        next.set(pairKey, m);
        list.push(m);
      }
    }
    this.manifolds = next;
    this.firstStep = false;
    return list;
  }

  /** Union–find over contacts between dynamic bodies; an island is awake if any member is not yet sleepy. */
  private updateIslands(list: readonly Manifold[]): void {
    const bodies = this.bodies;
    const parent = bodies.map((_, i) => i);
    const find = (i: number): number => {
      let r = i;
      while (parent[r] !== r) r = parent[r]!;
      let k = i;
      while (parent[k] !== r) {
        const nextK = parent[k]!;
        parent[k] = r;
        k = nextK;
      }
      return r;
    };
    for (const m of list) {
      if (bodies[m.a]!.isStatic || bodies[m.b]!.isStatic) continue;
      const ra = find(m.a);
      const rb = find(m.b);
      if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
    }
    const minSleep = bodies.map(() => Infinity);
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i]!;
      if (b.isStatic) continue;
      const r = find(i);
      if (b.sleepTime < minSleep[r]!) minSleep[r] = b.sleepTime;
    }
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i]!;
      if (b.isStatic) continue;
      const awake = minSleep[find(i)]! < TIME_TO_SLEEP;
      if (awake && !b.awake) b.sleepTime = 0; // a woken body must prove again that it is still
      b.awake = awake;
      if (!awake) {
        b.vx = 0;
        b.vy = 0;
        b.w = 0;
      }
    }
  }

  /** Effective masses, penetration bias and warm start for the active manifolds. */
  private preStep(active: readonly Manifold[], warm: boolean): void {
    const bodies = this.bodies;
    for (const m of active) {
      const A = bodies[m.a]!;
      const B = bodies[m.b]!;
      for (const c of m.points) {
        const rnA = c.rax * c.ny - c.ray * c.nx;
        const rnB = c.rbx * c.ny - c.rby * c.nx;
        c.massN = 1 / (A.invMass + B.invMass + A.invI * rnA * rnA + B.invI * rnB * rnB);
        const tx = -c.ny;
        const ty = c.nx;
        const rtA = c.rax * ty - c.ray * tx;
        const rtB = c.rbx * ty - c.rby * tx;
        c.massT = 1 / (A.invMass + B.invMass + A.invI * rtA * rtA + B.invI * rtB * rtB);
        c.bias = (BAUMGARTE / DT) * Math.max(0, -c.sep - SLOP);
        c.pp = 0;
        if (!warm) continue;
        const px = c.pn * c.nx + c.pt * tx;
        const py = c.pn * c.ny + c.pt * ty;
        A.vx -= px * A.invMass;
        A.vy -= py * A.invMass;
        A.w -= A.invI * (c.rax * py - c.ray * px);
        B.vx += px * B.invMass;
        B.vy += py * B.invMass;
        B.w += B.invI * (c.rbx * py - c.rby * px);
      }
    }
  }

  /** Sequential impulses: friction, then non-penetration with speculative gap. */
  private solveVelocities(active: readonly Manifold[], iterations: number): void {
    const bodies = this.bodies;
    for (let it = 0; it < iterations; it++) {
      for (const m of active) {
        const A = bodies[m.a]!;
        const B = bodies[m.b]!;
        for (const c of m.points) {
          const tx = -c.ny;
          const ty = c.nx;
          let dvx = B.vx - B.w * c.rby - A.vx + A.w * c.ray;
          let dvy = B.vy + B.w * c.rbx - A.vy - A.w * c.rax;
          const vt = dvx * tx + dvy * ty;
          const maxF = m.friction * c.pn;
          const oldT = c.pt;
          c.pt = Math.max(-maxF, Math.min(maxF, oldT - vt * c.massT));
          let d = c.pt - oldT;
          let px = d * tx;
          let py = d * ty;
          A.vx -= px * A.invMass;
          A.vy -= py * A.invMass;
          A.w -= A.invI * (c.rax * py - c.ray * px);
          B.vx += px * B.invMass;
          B.vy += py * B.invMass;
          B.w += B.invI * (c.rbx * py - c.rby * px);

          dvx = B.vx - B.w * c.rby - A.vx + A.w * c.ray;
          dvy = B.vy + B.w * c.rbx - A.vy - A.w * c.rax;
          const vn = dvx * c.nx + dvy * c.ny;
          const gap = c.sep > 0 ? c.sep / DT : 0;
          const oldN = c.pn;
          c.pn = Math.max(0, oldN - (vn + gap) * c.massN);
          d = c.pn - oldN;
          px = d * c.nx;
          py = d * c.ny;
          A.vx -= px * A.invMass;
          A.vy -= py * A.invMass;
          A.w -= A.invI * (c.rax * py - c.ray * px);
          B.vx += px * B.invMass;
          B.vy += py * B.invMass;
          B.w += B.invI * (c.rbx * py - c.rby * px);
        }
      }
    }
  }

  /**
   * Computes resting contact impulses for bodies at rest (as if the world had been running),
   * without moving anything. Used for worlds built from a settled snapshot: the stored
   * impulses warm-start the solver, so the tower does not sag when it wakes up.
   */
  prime(iterations = 60): void {
    const bodies = this.bodies;
    const list = this.collide();
    for (const b of bodies) {
      if (b.isStatic) continue;
      b.vx = 0;
      b.vy = -GRAVITY * DT;
      b.w = 0;
    }
    this.preStep(list, false);
    this.solveVelocities(list, iterations);
    for (const b of bodies) {
      b.vx = 0;
      b.vy = 0;
      b.w = 0;
    }
  }

  step(): StepStats {
    const bodies = this.bodies;
    const list = this.collide();
    this.updateIslands(list);

    for (const b of bodies) {
      if (!b.awake) continue;
      b.vy -= GRAVITY * DT;
      b.vx /= 1 + DT * LINEAR_DAMPING;
      b.vy /= 1 + DT * LINEAR_DAMPING;
      b.w /= 1 + DT * ANGULAR_DAMPING;
    }

    const active: Manifold[] = [];
    for (const m of list) if (bodies[m.a]!.awake || bodies[m.b]!.awake) active.push(m);
    this.preStep(active, true);
    this.solveVelocities(active, VELOCITY_ITERATIONS);

    // Split impulses: pseudo velocities that only remove penetration.
    const pvx = bodies.map(() => 0);
    const pvy = bodies.map(() => 0);
    const pw = bodies.map(() => 0);
    for (let it = 0; it < POSITION_ITERATIONS; it++) {
      for (const m of active) {
        const A = bodies[m.a]!;
        const B = bodies[m.b]!;
        for (const c of m.points) {
          const dvx = pvx[m.b]! - pw[m.b]! * c.rby - pvx[m.a]! + pw[m.a]! * c.ray;
          const dvy = pvy[m.b]! + pw[m.b]! * c.rbx - pvy[m.a]! - pw[m.a]! * c.rax;
          const vn = dvx * c.nx + dvy * c.ny;
          const oldP = c.pp;
          c.pp = Math.max(0, oldP + (c.bias - vn) * c.massN);
          const d = c.pp - oldP;
          const px = d * c.nx;
          const py = d * c.ny;
          pvx[m.a] = pvx[m.a]! - px * A.invMass;
          pvy[m.a] = pvy[m.a]! - py * A.invMass;
          pw[m.a] = pw[m.a]! - A.invI * (c.rax * py - c.ray * px);
          pvx[m.b] = pvx[m.b]! + px * B.invMass;
          pvy[m.b] = pvy[m.b]! + py * B.invMass;
          pw[m.b] = pw[m.b]! + B.invI * (c.rbx * py - c.rby * px);
        }
      }
    }

    // Integrate positions and update sleep timers.
    const lin2 = SLEEP_LINEAR * SLEEP_LINEAR;
    const ang2 = SLEEP_ANGULAR * SLEEP_ANGULAR;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i]!;
      if (!b.awake) continue;
      b.x += (b.vx + pvx[i]!) * DT;
      b.y += (b.vy + pvy[i]!) * DT;
      b.a += (b.w + pw[i]!) * DT;
      updateGeometry(b);
      if (b.vx * b.vx + b.vy * b.vy < lin2 && b.w * b.w < ang2) b.sleepTime += DT;
      else b.sleepTime = 0;
    }
    let contacts = 0;
    for (const m of list) contacts += m.points.length;
    return { contacts };
  }

  /** Kinetic + potential energy of all dynamic bodies (density 1). */
  energy(): number {
    let e = 0;
    for (const b of this.bodies) {
      if (b.isStatic) continue;
      e += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy) + 0.5 * b.inertia * b.w * b.w + b.mass * GRAVITY * b.y;
    }
    return e;
  }

  /** Deepest overlap between parts of different bodies (0 if none overlap). */
  maxPenetration(): number {
    let worst = 0;
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const A = bodies[i]!;
        const B = bodies[j]!;
        if (A.maxX < B.minX || B.maxX < A.minX || A.maxY < B.minY || B.maxY < A.minY) continue;
        for (const pa of A.parts) for (const pb of B.parts) worst = Math.max(worst, -partSeparation(pa, pb));
      }
    }
    return worst;
  }
}
