/** World → picture geometry and snapping (design § 19.1). Pure; the picture is 320 units wide and never mirrored. */
import { isBar, type MobileNode, type StackScene } from './statics';

export const VIEW_WIDTH = 320;

export function layoutBeam(half: number) {
  const step = 260 / (2 * half);
  return { step, barY: 70, x: (p: number) => VIEW_WIDTH / 2 + p * step };
}

/** The hook nearest to a picture x (clamped to the bar). */
export function nearestHook(half: number, px: number): number {
  const L = layoutBeam(half);
  return Math.max(-half, Math.min(half, Math.round((px - VIEW_WIDTH / 2) / L.step)));
}

export interface MobileLayout {
  /** The string point of the bar. */
  x: number;
  y: number;
  unit: number;
  children: (MobileLayout | null)[];
}

export function layoutMobile(node: MobileNode, x = VIEW_WIDTH / 2, y = 34, unit = 24): MobileLayout {
  if (!isBar(node)) return { x, y, unit, children: [] };
  const x0 = x - node.bar.string * unit;
  return {
    x,
    y,
    unit,
    children: node.bar.hooks.map((h) => (h.child && isBar(h.child) ? layoutMobile(h.child, x0 + h.pos * unit, y + 62, unit * 0.72) : null))
  };
}

/** Picture x of every mobile hook, depth-first (the order of `mobileHooks`). */
export function mobileHookXs(node: MobileNode): number[] {
  const out: number[] = [];
  const walk = (n: MobileNode, l: MobileLayout) => {
    if (!isBar(n)) return;
    const x0 = l.x - n.bar.string * l.unit;
    n.bar.hooks.forEach((h, k) => {
      out.push(x0 + h.pos * l.unit);
      const c = l.children[k];
      if (h.child && c) walk(h.child, c);
    });
  };
  walk(node, layoutMobile(node));
  return out;
}

export const STACK_VIEW = { height: 240, scale: 2.2, origin: 180, bodyH: 22 } as const;

export function layoutStack(scene: StackScene) {
  const { scale, origin, bodyH, height } = STACK_VIEW;
  const tableY = height - 46 - (scene.bucket ? 0 : 0);
  return { scale, bodyH, tableY, px: (x: number) => origin + x * scale, bodyY: (k: number) => tableY - (k + 1) * bodyH };
}

/** The world x (cm, on the 1 cm grid) under a picture x on the stack bench. */
export const stackXAt = (px: number): number => Math.round((px - STACK_VIEW.origin) / STACK_VIEW.scale);
