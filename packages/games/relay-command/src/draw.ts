/** Drawing shared by the game map and the map editor (one cell = CELL px, marks never colour alone). */
import type { View } from './icons';
import { drawTerrainMap, type TerrainDetail, type TerrainMap } from './terrain';

/** Size of one map cell in canvas pixels (44 px: the touch target). */
export const CELL = 44;

export const TERRAIN_NAMES: Readonly<Record<string, string>> = {
  '.': 'plain',
  '=': 'road',
  f: 'forest',
  h: 'hill',
  u: 'urban',
  s: 'swamp',
  '~': 'water',
  '^': 'ridge'
};

/**
 * A deposit: a small diamond with a dot in the cell's corner (a mark, not a colour). A rich one
 * has a second diamond beside it, an endless one a ring around it (shapes, never colour; a diamond
 * inside the first read as a filled one on a phone, review of PR #36).
 */
export function drawDeposit(g: CanvasRenderingContext2D, px: number, py: number, size: 'plain' | 'rich' | 'endless' = 'plain', halo?: string): void {
  if (halo) {
    // A surface-coloured outline first, so the mark stands out on busy terrain.
    const ink = g.strokeStyle;
    const fill = g.fillStyle;
    g.strokeStyle = halo;
    g.fillStyle = halo;
    g.save();
    g.lineWidth = 4.5;
    drawDepositPath(g, px, py, size);
    g.restore();
    g.strokeStyle = ink;
    g.fillStyle = fill;
  }
  g.lineWidth = 1.5;
  drawDepositPath(g, px, py, size);
}

function drawDepositPath(g: CanvasRenderingContext2D, px: number, py: number, size: 'plain' | 'rich' | 'endless'): void {
  const cx = px + CELL - 9;
  const cy = py + 9;
  const width = g.lineWidth;
  const diamond = (x: number, r: number) => {
    g.beginPath();
    g.moveTo(x, cy - r);
    g.lineTo(x + r, cy);
    g.lineTo(x, cy + r);
    g.lineTo(x - r, cy);
    g.closePath();
    g.stroke();
  };
  diamond(cx, 6);
  if (size === 'rich') diamond(cx - 13, 6);
  if (size === 'endless') {
    g.beginPath();
    g.arc(cx, cy, 8, 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.arc(cx, cy, width > 2 ? 3 : 1.5, 0, Math.PI * 2);
  g.fill();
}

/** Reads a colour token (with a fallback) from the game's stylesheet. */
export type CssToken = (name: string, fallback: string) => string;

const FALLBACK: Readonly<Record<string, string>> = { plain: '#e7e3d4', road: '#cfc8b4', forest: '#b9d0ae', hill: '#ddcfa8', urban: '#d3d1cc', swamp: '#c4d3c2', water: '#a9c7dd', ridge: '#c4bfb3' };
const NAMES = Object.values(TERRAIN_NAMES);

/** The ground colours of the current theme (light or dark) as the terrain renderer wants them. */
function palette(css: CssToken): { base(name: string): string; dark: boolean; key: string } {
  const colours = new Map(NAMES.map((n) => [n, css(`--rc-${n}`, FALLBACK[n] ?? '#dddddd')]));
  const plain = colours.get('plain') ?? '#e7e3d4';
  const m = /^#([0-9a-f]{6})$/i.exec(plain);
  const dark = m ? parseInt(m[1]!.slice(0, 2), 16) + parseInt(m[1]!.slice(2, 4), 16) + parseInt(m[1]!.slice(4, 6), 16) < 3 * 110 : false;
  return { base: (n) => colours.get(n) ?? FALLBACK[n] ?? '#dddddd', dark, key: [...colours.values()].join() };
}

/**
 * The terrain of a map, drawn once into a canvas of its own and reused until the map, the view, the
 * theme or the pixel ratio changes (drawing it takes far longer than copying it).
 */
export function createTerrainLayer(detail: TerrainDetail): { draw(g: CanvasRenderingContext2D, map: TerrainMap, view: View, css: CssToken, ratio: number): void } {
  let key = '';
  let layer: HTMLCanvasElement | null = null;
  return {
    draw(g, map, view, css, ratio) {
      const colours = palette(css);
      const next = [map.w, map.h, map.terrain, view, ratio, colours.key].join('|');
      if (next !== key || !layer) {
        const c = layer ?? (g.canvas.ownerDocument ?? document).createElement('canvas');
        c.width = Math.round(map.w * CELL * ratio);
        c.height = Math.round(map.h * CELL * ratio);
        const lg = c.getContext('2d');
        if (!lg) return;
        lg.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawTerrainMap(lg, map, CELL, colours, view, detail);
        layer = c;
        key = next;
      }
      g.drawImage(layer, 0, 0, map.w * CELL, map.h * CELL);
    }
  };
}

/** One cell of a terrain as in the map (legend and editor palette). */
export function drawTerrainSwatch(g: CanvasRenderingContext2D, code: string, view: View, css: CssToken): void {
  drawTerrainMap(g, { w: 1, h: 1, terrain: code }, CELL, palette(css), view, 'coarse');
}
