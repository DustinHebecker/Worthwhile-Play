import { drawIcon, PROFILE, type IconStyle } from '@wp/strategy-art';

/**
 * Wave units and defenders in the strategy game's own pictures (@wp/strategy-art), animated by a
 * pose per gait instead of pictures of their own (owner, 2026-11-02: "animate the old ones"). View
 * only: a pose is a small offset, tilt and squash of the whole picture, from how far through its
 * step the unit is; a standing unit (and reduced motion, where nothing glides) keeps the plain
 * picture.
 */

/** How a picture moves: soldiers walk, wheels roll, tracks rumble, flyers float. */
export type Gait = 'legs' | 'wheels' | 'tracks' | 'air';

export function gaitOf(icon: string): Gait {
  const def = PROFILE[icon];
  if (!def) return 'legs';
  if (def.air) return 'air';
  if (def.wheels?.length) return 'wheels';
  if (def.parts.some((p) => p[0] === 't')) return 'tracks';
  return 'legs';
}

/** Offset (fractions of the picture's size), tilt (radians, + leans forward) and vertical squash. */
export interface Pose {
  readonly dx: number;
  readonly dy: number;
  readonly tilt: number;
  readonly squash: number;
}
export const STANDING: Pose = { dx: 0, dy: 0, tilt: 0, squash: 1 };

const TAU = Math.PI * 2;

/** The pose `phase` (0..1) through a step; `null`: standing. */
export function poseOf(gait: Gait, phase: number | null): Pose {
  if (phase === null) return STANDING;
  switch (gait) {
    case 'legs': {
      // Two steps per cell: a waddle from foot to foot, a little up on each step, a little down between.
      const step = Math.sin(phase * TAU * 2);
      return { dx: 0, dy: -Math.abs(step) * 0.06, tilt: step * 0.08, squash: 1 - (1 - Math.abs(step)) * 0.05 };
    }
    case 'wheels':
      // Leaning into the drive, bouncing a little on the road.
      return { dx: 0, dy: Math.sin(phase * TAU * 3) * 0.015, tilt: 0.04, squash: 1 };
    case 'tracks': {
      // A heavy rumble: short jolts, no lean.
      const jolt = Math.floor(phase * 8) % 2 === 0 ? 0 : 0.012;
      return { dx: jolt * 0.5, dy: -jolt, tilt: 0, squash: 1 };
    }
    case 'air':
      // Banking forward and riding up and down on the air.
      return { dx: 0, dy: Math.sin(phase * TAU) * 0.05 - 0.03, tilt: 0.1, squash: 1 };
  }
}

/**
 * Draws picture `icon` with its foot at (cx, cy + size / 2), `size` px across, facing `facing`
 * (1 right, -1 left), in pose `pose`. False when there is no such picture (or no Path2D).
 */
export function drawPosed(g: CanvasRenderingContext2D, icon: string, cx: number, cy: number, size: number, style: IconStyle, facing: 1 | -1, pose: Pose): boolean {
  if (!PROFILE[icon] || typeof Path2D === 'undefined') return false;
  // drawIcon faces own pictures right and the others left; turn it round when it walks the other way.
  const natural = style.own ? 1 : -1;
  g.save();
  g.translate(cx + pose.dx * size * facing, cy + size / 2 + pose.dy * size);
  if (facing !== natural) g.scale(-1, 1);
  g.rotate(pose.tilt * natural);
  g.scale(1, pose.squash);
  const drawn = drawIcon(g, icon, -size / 2, -size, size / 44, style);
  g.restore();
  return drawn;
}

/** The defenders' mark (§ 18.3): a pennant on a pole over the picture, pointing the way it faces. */
export function drawPennant(g: CanvasRenderingContext2D, cx: number, top: number, size: number, facing: 1 | -1, colour: string, ink: string): void {
  const pole = cx - facing * size * 0.18;
  const s = size / 44;
  g.lineWidth = Math.max(1.5, 1.6 * s * 2);
  g.strokeStyle = ink;
  g.beginPath();
  g.moveTo(pole, top + 6 * s);
  g.lineTo(pole, top - 9 * s);
  g.stroke();
  g.beginPath();
  g.moveTo(pole, top - 9 * s);
  g.lineTo(pole + facing * 11 * s, top - 6 * s);
  g.lineTo(pole, top - 3 * s);
  g.closePath();
  g.fillStyle = colour;
  g.fill();
  g.stroke();
}
