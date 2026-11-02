import { mix } from '@wp/strategy-art';

/**
 * Pictures of the wave units (owner playtest 2026-11-01: "optisch ansprechendere Einheiten").
 * Own drawings in canvas paths, in the strategy game's flat style (filled body, darker outline,
 * a light highlight, a soft shadow), but each kind with its own silhouette so it reads at a glance:
 * Walker (biped), Runner (long-legged, leaning), Swarm unit (small beetle), Brute (armoured block),
 * Glider (delta wing, flying), Raider (armed buggy), Siege crawler (tracked hull with a big gun),
 * Shield bearer (biped behind a shield plate), Mender (hovering drone with a cross).
 * Legs, wheels and treads move with the step (`phase`); units face the way they walk.
 * No colour carries meaning on its own: kinds differ in shape, states have their own marks (draw.ts).
 */

export interface UnitLook {
  /** Body colour (the side's colour, or ink for an outside force). */
  colour: string;
  /** Outline and dark details. */
  ink: string;
  /** Highlights and shadows are mixed from it (the page background). */
  surface: string;
  /** 1: facing right, -1: facing left. */
  facing: 1 | -1;
  /** 0..1 through the current step: legs, wheels and treads move with it. */
  phase: number;
  /** Whether the unit is moving at all (standing units do not swing their legs). */
  moving: boolean;
}

/** Kinds with a picture of their own. */
export const UNIT_KINDS = ['walker', 'runner', 'swarm', 'brute', 'glider', 'raider', 'crawler', 'shielder', 'mender'] as const;

const TAU = Math.PI * 2;

/** A rounded rectangle path (plain rectangle where the browser has no roundRect yet). */
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  if (typeof g.roundRect === 'function') g.roundRect(x, y, w, h, r);
  else g.rect(x, y, w, h);
}

/**
 * Draws a unit of `kind` centred on (cx, cy), `size` pixels across. Returns false for kinds
 * without a picture (the caller draws its fallback).
 */
export function drawUnit(g: CanvasRenderingContext2D, kind: string, cx: number, cy: number, size: number, look: UnitLook): boolean {
  const paint = PAINTERS[kind];
  if (!paint) return false;
  const u = size / 44;
  g.save();
  g.translate(cx, cy);
  g.scale(u, u);
  const dark = mix(look.colour, look.ink, 0.45);
  const light = mix(look.colour, look.surface, 0.45);
  // Shadow on the ground (flying units: further below and smaller).
  const air = kind === 'glider' || kind === 'mender';
  g.fillStyle = mix(look.surface, look.ink, 0.28);
  g.globalAlpha = 0.55;
  g.beginPath();
  g.ellipse(0, air ? 19 : 17, air ? 9 : 14, air ? 2.4 : 3.2, 0, 0, TAU);
  g.fill();
  g.globalAlpha = 1;
  g.scale(look.facing, 1);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = 2;
  g.strokeStyle = look.ink;
  paint(g, { ...look, dark, light });
  g.restore();
  return true;
}

interface Paint extends UnitLook {
  dark: string;
  light: string;
}

/** Leg swing for a walk cycle: two steps per cell. */
const swing = (p: Paint, amount: number): number => (p.moving ? Math.sin(p.phase * TAU * 2) * amount : 0);

function body(g: CanvasRenderingContext2D, fill: string, path: () => void): void {
  g.beginPath();
  path();
  g.fillStyle = fill;
  g.fill();
  g.stroke();
}

function legs(g: CanvasRenderingContext2D, p: Paint, hipY: number, length: number, spread: number, width = 2.6): void {
  const a = swing(p, 0.5);
  g.lineWidth = width;
  g.strokeStyle = p.ink;
  for (const [side, angle] of [[-1, a], [1, -a]] as const) {
    g.beginPath();
    g.moveTo(side * spread, hipY);
    g.lineTo(side * spread + Math.sin(angle) * length, hipY + Math.cos(angle) * length);
    g.stroke();
  }
  g.lineWidth = 2;
}

const PAINTERS: Readonly<Record<string, (g: CanvasRenderingContext2D, p: Paint) => void>> = {
  walker(g, p) {
    legs(g, p, 4, 11, 3.5);
    body(g, p.colour, () => g.ellipse(0, -2, 9, 10, 0, 0, TAU));
    // Visor looking ahead, and an antenna.
    body(g, p.light, () => rr(g, 1, -7, 7, 4, 1.5));
    g.beginPath();
    g.moveTo(-3, -11);
    g.lineTo(-5, -17);
    g.stroke();
    g.fillStyle = p.dark;
    g.beginPath();
    g.arc(-5, -17, 1.6, 0, TAU);
    g.fill();
  },
  runner(g, p) {
    g.save();
    g.rotate(0.25);
    legs(g, p, 2, 13, 2.5, 2.2);
    body(g, p.colour, () => g.ellipse(0, -5, 6, 8, 0, 0, TAU));
    body(g, p.light, () => rr(g, 0, -9, 6, 3, 1.2));
    g.restore();
    // Speed lines behind it while it runs.
    if (p.moving) {
      g.strokeStyle = p.dark;
      g.lineWidth = 1.6;
      g.beginPath();
      for (const y of [-8, -3, 2]) {
        g.moveTo(-10, y);
        g.lineTo(-17, y);
      }
      g.stroke();
    }
  },
  swarm(g, p) {
    // Small: drawn inside a 44 box but only half as wide; six legs.
    const a = swing(p, 2.2);
    g.lineWidth = 1.6;
    g.beginPath();
    for (const [x, d] of [[-5, a], [0, -a], [5, a]] as const) {
      g.moveTo(x, 0);
      g.lineTo(x + d, -8);
      g.moveTo(x, 0);
      g.lineTo(x - d, 8);
    }
    g.stroke();
    g.lineWidth = 2;
    body(g, p.colour, () => g.ellipse(0, 0, 9, 6, 0, 0, TAU));
    body(g, p.dark, () => g.ellipse(9, 0, 3.5, 3, 0, 0, TAU));
  },
  brute(g, p) {
    legs(g, p, 8, 9, 7, 4);
    body(g, p.colour, () => rr(g, -14, -12, 28, 21, 5));
    // Armour plates and a small head.
    body(g, p.dark, () => rr(g, -14, -3, 28, 6, 2));
    body(g, p.light, () => rr(g, 6, -17, 9, 7, 2));
  },
  glider(g, p) {
    // A delta wing seen from above, rising and falling a little.
    const bob = p.moving ? Math.sin(p.phase * TAU) * 1.2 : 0;
    g.translate(0, -4 + bob);
    body(g, p.colour, () => {
      g.moveTo(15, 0);
      g.lineTo(-11, -12);
      g.lineTo(-6, 0);
      g.lineTo(-11, 12);
      g.closePath();
    });
    body(g, p.light, () => g.ellipse(4, 0, 4, 2.4, 0, 0, TAU));
  },
  raider(g, p) {
    const turn = p.moving ? p.phase * TAU : 0;
    for (const x of [-9, 9]) {
      body(g, p.dark, () => g.arc(x, 9, 5, 0, TAU));
      g.beginPath();
      g.moveTo(x, 9);
      g.lineTo(x + Math.cos(turn) * 4, 9 + Math.sin(turn) * 4);
      g.stroke();
    }
    body(g, p.colour, () => rr(g, -15, -3, 30, 10, 3));
    // Gun on top, pointing ahead.
    body(g, p.dark, () => rr(g, -5, -9, 10, 6, 2));
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(4, -6);
    g.lineTo(16, -8);
    g.stroke();
  },
  crawler(g, p) {
    // Treads: a band with marks that run with the step.
    body(g, p.dark, () => rr(g, -19, 4, 38, 11, 5));
    g.strokeStyle = p.light;
    g.lineWidth = 1.5;
    g.beginPath();
    const shift = p.moving ? (p.phase * 8) % 8 : 0;
    for (let x = -16 + shift; x < 17; x += 8) {
      g.moveTo(x, 6);
      g.lineTo(x, 13);
    }
    g.stroke();
    g.strokeStyle = p.ink;
    g.lineWidth = 2;
    body(g, p.colour, () => {
      g.moveTo(-17, 4);
      g.lineTo(-13, -7);
      g.lineTo(13, -7);
      g.lineTo(17, 4);
      g.closePath();
    });
    body(g, p.dark, () => rr(g, -8, -14, 14, 9, 3));
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(5, -10);
    g.lineTo(21, -13);
    g.stroke();
  },
  shielder(g, p) {
    legs(g, p, 4, 11, 3.5);
    body(g, p.colour, () => g.ellipse(-2, -2, 8, 10, 0, 0, TAU));
    // The shield plate ahead of it.
    body(g, p.light, () => {
      g.moveTo(6, -14);
      g.quadraticCurveTo(15, -2, 6, 12);
      g.lineTo(9, -2);
      g.closePath();
    });
  },
  mender(g, p) {
    const hover = p.moving ? Math.sin(p.phase * TAU) * 1.2 : 0;
    g.translate(0, -4 + hover);
    // Rotor bar, body, and a cross.
    g.beginPath();
    g.moveTo(-12, -12);
    g.lineTo(12, -12);
    g.moveTo(0, -12);
    g.lineTo(0, -8);
    g.stroke();
    body(g, p.colour, () => g.arc(0, 0, 9, 0, TAU));
    g.fillStyle = p.light;
    g.fillRect(-1.8, -5.5, 3.6, 11);
    g.fillRect(-5.5, -1.8, 11, 3.6);
  }
};
