import { mix } from '@wp/strategy-art';

/**
 * Pictures of Hold the Line's production buildings (design § 18.2): own canvas drawings in the flat
 * style of the unit pictures (units.ts), each with its own silhouette so it reads without colour:
 * Barracks (long hut with a door and a pennant), Garage (box with a ribbed roller door), Hangar
 * (arched roof over a wide opening), Lab (dome with a flask mark).
 */
export const BUILDING_KINDS = ['barracks', 'garage', 'hangar', 'lab'] as const;

export interface BuildingLook {
  colour: string;
  ink: string;
  surface: string;
}

/** Draws a building of `kind` centred on (cx, cy), `size` pixels across; false for other kinds. */
export function drawBuilding(g: CanvasRenderingContext2D, kind: string, cx: number, cy: number, size: number, look: BuildingLook): boolean {
  const paint = PAINTERS[kind];
  if (!paint) return false;
  const u = size / 44;
  g.save();
  g.translate(cx, cy);
  g.scale(u, u);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = 2;
  g.strokeStyle = look.ink;
  paint(g, { ...look, dark: mix(look.colour, look.ink, 0.45), light: mix(look.colour, look.surface, 0.45) });
  g.restore();
  return true;
}

interface Paint extends BuildingLook {
  dark: string;
  light: string;
}

function shape(g: CanvasRenderingContext2D, fill: string, path: () => void): void {
  g.beginPath();
  path();
  g.fillStyle = fill;
  g.fill();
  g.stroke();
}

const PAINTERS: Readonly<Record<string, (g: CanvasRenderingContext2D, p: Paint) => void>> = {
  barracks(g, p) {
    shape(g, p.colour, () => {
      g.moveTo(-17, 14);
      g.lineTo(-17, -2);
      g.lineTo(0, -11);
      g.lineTo(17, -2);
      g.lineTo(17, 14);
      g.closePath();
    });
    shape(g, p.dark, () => g.rect(-4, 3, 8, 11));
    // A pennant on a pole.
    g.beginPath();
    g.moveTo(11, -5);
    g.lineTo(11, -18);
    g.stroke();
    shape(g, p.light, () => {
      g.moveTo(11, -18);
      g.lineTo(19, -15);
      g.lineTo(11, -12);
      g.closePath();
    });
  },
  garage(g, p) {
    shape(g, p.colour, () => g.rect(-17, -10, 34, 24));
    shape(g, p.light, () => g.rect(-11, -3, 22, 17));
    g.beginPath();
    for (const y of [1, 5, 9]) {
      g.moveTo(-11, y);
      g.lineTo(11, y);
    }
    g.stroke();
  },
  hangar(g, p) {
    shape(g, p.colour, () => {
      g.moveTo(-19, 14);
      g.lineTo(-19, 2);
      g.quadraticCurveTo(0, -24, 19, 2);
      g.lineTo(19, 14);
      g.closePath();
    });
    shape(g, p.dark, () => {
      g.moveTo(-11, 14);
      g.lineTo(-11, 4);
      g.quadraticCurveTo(0, -8, 11, 4);
      g.lineTo(11, 14);
      g.closePath();
    });
  },
  lab(g, p) {
    shape(g, p.colour, () => {
      g.moveTo(-16, 14);
      g.lineTo(-16, 2);
      g.arc(0, 2, 16, Math.PI, 0);
      g.lineTo(16, 14);
      g.closePath();
    });
    // A flask on the dome.
    shape(g, p.light, () => {
      g.moveTo(-3, -9);
      g.lineTo(-3, -3);
      g.lineTo(-8, 8);
      g.lineTo(8, 8);
      g.lineTo(3, -3);
      g.lineTo(3, -9);
      g.closePath();
    });
  }
};
