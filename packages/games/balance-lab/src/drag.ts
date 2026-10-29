/**
 * Pointer and touch dragging (design § 13.1; owner decision 2026-10-29), pure: the gesture state machine and the snap
 * targets. A press only becomes a drag once the pointer has moved `DRAG_THRESHOLD` px, so a tap stays a tap (the
 * view's tap-tap path handles it). Snap targets and drops use the same edits as tapping and the step buttons
 * (`placeBeam`, `moveBeam`, `setMobileHook`, `placeCube`/`moveCube` with the cube spacing, `moveBody`), so a drag can
 * only put a part where a tap could.
 */
import { freeCubeSpots, type Goal, type Scene, type TaskId } from './generate';
import { layoutBeam, mobileHookPoints, STACK_VIEW } from './layout';
import { mobileHooks, moveBeam, moveBody, moveCube, placeBeam, placeCube, setMobileHook } from './rules';
import { isBar } from './statics';

/** Pointer movement (CSS px) that turns a press into a drag. */
export const DRAG_THRESHOLD = 6;

/** What is dragged: a tray part (index into the remaining tray) or a part in the picture. */
export type DragSource =
  | { kind: 'tray'; index: number }
  /** Beam: index into the weights (a free one). */
  | { kind: 'weight'; index: number }
  /** Mobile: index of the hook (`mobileHooks` order) holding a free weight. */
  | { kind: 'hook'; index: number }
  /** Stack: index of a free cube. */
  | { kind: 'cube'; index: number }
  /** Stack: index of a body moved sideways. */
  | { kind: 'body'; index: number };

export interface Gesture {
  source: DragSource;
  pointerId: number;
  /** Client point of the press. */
  x0: number;
  y0: number;
  /** The pointer moved at least the threshold: this is a drag, not a tap. */
  dragging: boolean;
}

export const press = (source: DragSource, pointerId: number, x: number, y: number): Gesture => ({ source, pointerId, x0: x, y0: y, dragging: false });

/** The gesture after a pointer move (other pointers are ignored; once a drag, always a drag). */
export function movePointer(g: Gesture, pointerId: number, x: number, y: number, threshold = DRAG_THRESHOLD): Gesture {
  if (g.pointerId !== pointerId || g.dragging || Math.hypot(x - g.x0, y - g.y0) < threshold) return g;
  return { ...g, dragging: true };
}

/** What letting go of the pointer means: a tap (the click that follows does the tap action), a drop, or a cancel. */
export type Release = { kind: 'tap' } | { kind: 'drop'; target: number } | { kind: 'cancel' };

export function release(g: Gesture, target: number | null): Release {
  if (!g.dragging) return { kind: 'tap' };
  return target === null ? { kind: 'cancel' } : { kind: 'drop', target };
}

/** Parses a `data-drag` attribute of the picture ("weight:2", "hook:5", "cube:0", "body:1"). */
export function sourceOf(attr: string | null): DragSource | null {
  const m = /^(weight|hook|cube|body):(\d+)$/.exec(attr ?? '');
  return m ? { kind: m[1] as 'weight' | 'hook' | 'cube' | 'body', index: Number(m[2]) } : null;
}

export interface DropContext {
  /** The scene being edited (the draft of a build task, or the free bench). */
  scene: Scene;
  /** The task id (undefined on the free bench). */
  id: TaskId | undefined;
  goal: Goal | null;
  /** The kg of the parts still in the tray (chips; the free bench's weight menu is not dragged). */
  tray: readonly number[];
  /** Whether bodies may be slid sideways (stack-overhang, the free stack bench, the plank of hard stack-counter). */
  bodies: boolean;
}

/** Whether this part may be dragged in this context. */
export function canDrag(ctx: DropContext, source: DragSource): boolean {
  const sc = ctx.scene;
  switch (source.kind) {
    case 'tray':
      return ctx.tray[source.index] !== undefined && ctx.id !== 'beam-axle' && ctx.id !== 'mobile-string' && (sc.bench !== 'stack' || ctx.id === 'stack-counter');
    case 'weight':
      return sc.bench === 'beam' && sc.s.weights[source.index]?.free === true && ctx.id !== 'beam-axle' && ctx.goal?.kind !== 'choose';
    case 'hook': {
      if (sc.bench !== 'mobile' || ctx.id === 'mobile-string') return false;
      const child = mobileHooks(sc.s)[source.index]?.child;
      return !!child && !isBar(child) && child.free === true;
    }
    case 'cube':
      return sc.bench === 'stack' && sc.s.cubes[source.index]?.free === true;
    case 'body':
      return sc.bench === 'stack' && ctx.bodies && source.index >= 0 && source.index < sc.s.bodies.length;
  }
}

/** The kg of the dragged part (bodies: null). */
export function dragKg(ctx: DropContext, source: DragSource): number | null {
  const sc = ctx.scene;
  if (source.kind === 'tray') return ctx.tray[source.index] ?? null;
  if (source.kind === 'weight' && sc.bench === 'beam') return sc.s.weights[source.index]?.kg ?? null;
  if (source.kind === 'cube' && sc.bench === 'stack') return sc.s.cubes[source.index]?.kg ?? null;
  if (source.kind === 'hook' && sc.bench === 'mobile') {
    const child = mobileHooks(sc.s)[source.index]?.child;
    return child && !isBar(child) ? child.kg : null;
  }
  return null;
}

/**
 * The scene after dropping the part on `target` (beam: a hook; mobile: a hook index; stack: a cube centre or a body's
 * new left end, in cm), or null when that is not allowed. Dropping a part where it already is gives the scene unchanged.
 */
export function dropScene(ctx: DropContext, source: DragSource, target: number): Scene | null {
  if (!canDrag(ctx, source)) return null;
  const sc = ctx.scene;
  const kg = dragKg(ctx, source);
  if (sc.bench === 'beam') {
    if (source.kind === 'tray' && kg !== null) {
      // beam-choose: only the marked hook takes a weight, and a new choice replaces the one hanging there (as a tap does).
      if (ctx.goal?.kind === 'choose') return target === ctx.goal.hook ? wrap('beam', placeBeam({ ...sc.s, weights: sc.s.weights.filter((w) => !w.free) }, kg, target)) : null;
      return wrap('beam', placeBeam(sc.s, kg, target));
    }
    return source.kind === 'weight' ? wrap('beam', moveBeam(sc.s, source.index, target)) : null;
  }
  if (sc.bench === 'mobile') {
    const hooks = mobileHooks(sc.s);
    const at = hooks[target];
    if (!at || kg === null) return null;
    if (source.kind === 'tray') {
      // An empty hook, or one with a weight from the tray (it goes back to the tray, as with a tap).
      if (at.child && (isBar(at.child) || !at.child.free)) return null;
      return wrap('mobile', setMobileHook(sc.s, target, kg));
    }
    if (source.kind !== 'hook') return null;
    if (target === source.index) return sc;
    if (at.child !== null) return null;
    const lifted = setMobileHook(sc.s, source.index, null);
    return lifted && wrap('mobile', setMobileHook(lifted, target, kg));
  }
  if (source.kind === 'tray' && kg !== null) return wrap('stack', placeCube(sc.s, kg, 0, target));
  if (source.kind === 'cube') return sc.s.cubes[source.index]!.x === target ? sc : wrap('stack', moveCube(sc.s, source.index, target));
  if (source.kind === 'body') {
    const dx = target - sc.s.bodies[source.index]!.left;
    return dx === 0 ? sc : wrap('stack', moveBody(sc.s, source.index, dx));
  }
  return null;
}

function wrap<B extends Scene['bench']>(bench: B, s: Extract<Scene, { bench: B }>['s'] | null): Scene | null {
  return s === null ? null : ({ bench, s } as Scene);
}

/** The value of `xs` nearest to x by `dist` (the first on a tie), or null when `xs` is empty. */
function nearest(xs: readonly number[], dist: (v: number) => number): number | null {
  let best: number | null = null;
  for (const v of xs) if (best === null || dist(v) < dist(best)) best = v;
  return best;
}

/**
 * The snap target under a picture point `p` (scene coordinates of the fitted viewBox): the allowed place nearest to it,
 * or null when there is none. Bodies slide by the pointer's movement from the press point `from` (whole cm), and stop
 * at the last position that keeps at least 1 cm of contact at every joint.
 */
export function snapTarget(ctx: DropContext, source: DragSource, p: { x: number; y: number }, from: { x: number; y: number }): number | null {
  if (!canDrag(ctx, source)) return null;
  const sc = ctx.scene;
  const ok = (target: number) => dropScene(ctx, source, target) !== null;
  if (sc.bench === 'beam') {
    const L = layoutBeam(sc.s.half);
    const hooks = Array.from({ length: 2 * sc.s.half + 1 }, (_, i) => i - sc.s.half).filter(ok);
    return nearest(hooks, (h) => Math.abs(L.x(h) - p.x));
  }
  if (sc.bench === 'mobile') {
    // The weight hangs below its hook: aim at the middle of where it would hang.
    const pts = mobileHookPoints(sc.s);
    const js = pts.map((_, j) => j).filter(ok);
    return nearest(js, (j) => Math.hypot(pts[j]!.x - p.x, pts[j]!.y + 22 - p.y));
  }
  const cm = (px: number) => Math.round((px - STACK_VIEW.origin) / STACK_VIEW.scale);
  if (source.kind === 'body') {
    const left = sc.s.bodies[source.index]!.left;
    const want = Math.round((p.x - from.x) / STACK_VIEW.scale);
    for (let d = want; d !== 0; d -= Math.sign(d)) if (ok(left + d)) return left + d;
    return left;
  }
  const x = cm(p.x);
  const spots = freeCubeSpots(sc.s, 0, source.kind === 'cube' ? source.index : -1).filter(ok);
  return nearest(spots, (s) => Math.abs(s - x));
}
