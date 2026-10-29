import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { canDrag, DRAG_THRESHOLD, dropScene, movePointer, press, release, snapTarget, sourceOf, type DropContext } from '../src/drag';
import { freeCubeSpots } from '../src/generate';
import { layoutBeam, mobileHookPoints, STACK_VIEW } from '../src/layout';
import { mobileHooks, moveBody, placeBeam, setMobileHook } from '../src/rules';
import { stackContactsOk, type BeamScene, type MobileNode, type StackScene } from '../src/statics';

const beam: BeamScene = { half: 4, axle: 0, barKg: 0, weights: [{ kg: 3, hook: -2 }] };
const ctxBeam = (s: BeamScene = beam, extra: Partial<DropContext> = {}): DropContext => ({ scene: { bench: 'beam', s }, id: 'beam-hook', goal: { kind: 'level' }, tray: [2], bodies: false, ...extra });
const px = (hook: number) => ({ x: layoutBeam(4).x(hook), y: 90 });

describe('the drag gesture', () => {
  it('stays a tap below the threshold and becomes a drag at it; other pointers are ignored', () => {
    const g = press({ kind: 'tray', index: 0 }, 1, 100, 100);
    expect(movePointer(g, 1, 103, 104).dragging).toBe(DRAG_THRESHOLD <= 5);
    expect(movePointer(g, 1, 100 + DRAG_THRESHOLD - 0.5, 100).dragging).toBe(false);
    expect(release(movePointer(g, 1, 102, 101), 3)).toEqual({ kind: 'tap' });
    const d = movePointer(g, 1, 100, 100 + DRAG_THRESHOLD);
    expect(d.dragging).toBe(true);
    // Once a drag, always a drag (coming back near the start does not make it a tap).
    expect(movePointer(d, 1, 100, 100).dragging).toBe(true);
    expect(movePointer(g, 2, 300, 300)).toBe(g);
    expect(release(d, 3)).toEqual({ kind: 'drop', target: 3 });
    expect(release(d, null)).toEqual({ kind: 'cancel' });
  });

  it('reads the picture marks', () => {
    expect(sourceOf('weight:2')).toEqual({ kind: 'weight', index: 2 });
    expect(sourceOf('hook:11')).toEqual({ kind: 'hook', index: 11 });
    expect(sourceOf('body:0')).toEqual({ kind: 'body', index: 0 });
    for (const bad of [null, '', 'tray:1', 'cube:-1', 'cube:x', 'weight:1 ']) expect(sourceOf(bad)).toBeNull();
  });
});

describe('snap targets and drops (the same rules as a tap)', () => {
  it('a tray weight snaps to the nearest hook and lands there exactly as a tap places it', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 320 }), (x) => {
        const target = snapTarget(ctxBeam(), { kind: 'tray', index: 0 }, { x, y: 90 }, { x, y: 90 })!;
        const nearest = Math.max(-4, Math.min(4, Math.round((x - 160) / layoutBeam(4).step)));
        expect(Math.abs(layoutBeam(4).x(target) - x)).toBeLessThanOrEqual(Math.abs(layoutBeam(4).x(nearest) - x));
        expect(dropScene(ctxBeam(), { kind: 'tray', index: 0 }, target)).toEqual({ bench: 'beam', s: placeBeam(beam, 2, target) });
      })
    );
  });

  it('a full hook is skipped for the next allowed one; a placed weight moves', () => {
    const full: BeamScene = { ...beam, weights: [1, 2, 3].map((kg) => ({ kg, hook: 2 })) };
    expect(snapTarget(ctxBeam(full), { kind: 'tray', index: 0 }, px(2), px(2))).not.toBe(2);
    expect([1, 3]).toContain(snapTarget(ctxBeam(full), { kind: 'tray', index: 0 }, px(2), px(2)));
    const placed = placeBeam(beam, 2, 1)!;
    const ctx = ctxBeam(placed, { tray: [] });
    expect(canDrag(ctx, { kind: 'weight', index: 0 })).toBe(false);
    expect(canDrag(ctx, { kind: 'weight', index: 1 })).toBe(true);
    expect(snapTarget(ctx, { kind: 'weight', index: 1 }, px(4), px(1))).toBe(4);
    const moved = dropScene(ctx, { kind: 'weight', index: 1 }, 4)!;
    expect(moved.bench === 'beam' && moved.s.weights[1]).toEqual({ kg: 2, hook: 4, free: true });
  });

  it('beam-choose: only the marked hook takes the weight, replacing an earlier choice; nothing moves on the axle task', () => {
    const ctx = ctxBeam(beam, { id: 'beam-choose', goal: { kind: 'choose', hook: 3 }, tray: [1, 2, 4] });
    expect(snapTarget(ctx, { kind: 'tray', index: 2 }, px(-4), px(-4))).toBe(3);
    expect(dropScene(ctx, { kind: 'tray', index: 2 }, -4)).toBeNull();
    const chosen = dropScene(ctx, { kind: 'tray', index: 0 }, 3)!;
    const again = dropScene({ ...ctx, scene: chosen, tray: [2, 4] }, { kind: 'tray', index: 1 }, 3)!;
    expect(again.bench === 'beam' && again.s.weights.filter((w) => w.free)).toEqual([{ kg: 4, hook: 3, free: true }]);
    expect(canDrag({ ...ctx, scene: chosen }, { kind: 'weight', index: 1 })).toBe(false);
    expect(canDrag(ctxBeam(beam, { id: 'beam-axle', tray: [] }), { kind: 'tray', index: 0 })).toBe(false);
  });

  it('mobile: a tray weight goes on the hook under the pointer; a hung weight moves to an empty hook only', () => {
    const empty: MobileNode = { bar: { width: 4, string: 2, hooks: [{ pos: 0, child: null }, { pos: 4, child: { bar: { width: 3, string: 1, hooks: [{ pos: 0, child: null }, { pos: 3, child: null }] } } }] } };
    const ctx: DropContext = { scene: { bench: 'mobile', s: empty }, id: 'mobile-hang', goal: { kind: 'level' }, tray: [2, 4, 6], bodies: false };
    const pts = mobileHookPoints(empty);
    // Hooks 0 (top bar, left), 1 (top bar, right: the sub-bar), 2 and 3 (sub-bar).
    for (const j of [0, 2, 3]) {
      const target = snapTarget(ctx, { kind: 'tray', index: 0 }, { x: pts[j]!.x, y: pts[j]!.y + 20 }, pts[j]!);
      expect(target).toBe(j);
    }
    expect(dropScene(ctx, { kind: 'tray', index: 0 }, 1)).toBeNull();
    const one = setMobileHook(empty, 2, 4)!;
    const two = setMobileHook(one, 3, 2)!;
    const c2: DropContext = { ...ctx, scene: { bench: 'mobile', s: two }, tray: [6] };
    expect(canDrag(c2, { kind: 'hook', index: 2 })).toBe(true);
    expect(canDrag(c2, { kind: 'hook', index: 1 })).toBe(false);
    expect(dropScene(c2, { kind: 'hook', index: 2 }, 3)).toBeNull();
    const moved = dropScene(c2, { kind: 'hook', index: 2 }, 0)!;
    expect(moved.bench === 'mobile' && mobileHooks(moved.s).map((h) => (h.child && 'kg' in h.child ? h.child.kg : null))).toEqual([4, null, null, 2]);
    // A tray weight on a hook with a placed weight replaces it (that one goes back to the tray), as a tap does.
    const replaced = dropScene(c2, { kind: 'tray', index: 0 }, 3)!;
    expect(replaced.bench === 'mobile' && mobileHooks(replaced.s).map((h) => (h.child && 'kg' in h.child ? h.child.kg : null))).toEqual([null, null, 4, 6]);
  });

  it('stack cubes snap only to spots that keep the cube spacing', () => {
    const scene: StackScene = { bodies: [{ kind: 'plank', left: -30 }], cubes: [{ kg: 2, on: 0, x: -10, free: true }], bucket: { kg: 2, on: 0, x: 16 } };
    const ctx: DropContext = { scene: { bench: 'stack', s: scene }, id: 'stack-counter', goal: { kind: 'stand' }, tray: [3], bodies: false };
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 400 }), fc.constantFrom({ kind: 'tray' as const, index: 0 }, { kind: 'cube' as const, index: 0 }), (x, source) => {
        const t = snapTarget(ctx, source, { x, y: 100 }, { x, y: 100 });
        expect(t).not.toBeNull();
        expect(freeCubeSpots(scene, 0, source.kind === 'cube' ? 0 : -1)).toContain(t);
        if (source.kind === 'tray') expect(t === -10 || Math.abs(t! + 10) >= 6).toBe(true);
      })
    );
    expect(snapTarget(ctx, { kind: 'tray', index: 0 }, { x: STACK_VIEW.origin - 6 * STACK_VIEW.scale, y: 100 }, { x: 0, y: 0 })).toBe(-4);
    // Bodies do not slide on the counterweight task (medium and easy).
    expect(canDrag(ctx, { kind: 'body', index: 0 })).toBe(false);
  });

  it('a body slides by the pointer movement and stops where the contact would get below 1 cm', () => {
    const scene: StackScene = { bodies: [{ kind: 'block', left: -20 }, { kind: 'block', left: -20 }], cubes: [] };
    const ctx: DropContext = { scene: { bench: 'stack', s: scene }, id: 'stack-overhang', goal: { kind: 'overhang', cm: 15, best: 18 }, tray: [], bodies: true };
    const from = { x: 200, y: 100 };
    expect(snapTarget(ctx, { kind: 'body', index: 1 }, { x: 200 + 10 * STACK_VIEW.scale, y: 300 }, from)).toBe(-10);
    expect(snapTarget(ctx, { kind: 'body', index: 1 }, { x: 200 + 1, y: 100 }, from)).toBe(-20);
    fc.assert(
      fc.property(fc.integer({ min: -400, max: 400 }), fc.constantFrom(0, 1), (dxPx, k) => {
        const left = snapTarget(ctx, { kind: 'body', index: k }, { x: from.x + dxPx, y: 100 }, from)!;
        const next = dropScene(ctx, { kind: 'body', index: k }, left)!;
        expect(next.bench === 'stack' && stackContactsOk(next.s)).toBe(true);
        if (left !== scene.bodies[k]!.left) expect(next).toEqual({ bench: 'stack', s: moveBody(scene, k, left - scene.bodies[k]!.left) });
      })
    );
  });
});
