/** Drawing shared by the game map and the map editor (one cell = CELL px, marks never colour alone). */

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
export function drawDeposit(g: CanvasRenderingContext2D, px: number, py: number, size: 'plain' | 'rich' | 'endless' = 'plain'): void {
  const cx = px + CELL - 9;
  const cy = py + 9;
  g.lineWidth = 1.5;
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
  g.arc(cx, cy, 1.5, 0, Math.PI * 2);
  g.fill();
}


/** Pattern marks so that terrain is never told apart by colour alone. */
export function drawTerrainMark(g: CanvasRenderingContext2D, name: string, px: number, py: number): void {
  const c = CELL;
  g.beginPath();
  switch (name) {
    case 'road':
      g.moveTo(px, py + c / 2);
      g.lineTo(px + c, py + c / 2);
      g.setLineDash([4, 4]);
      g.stroke();
      g.setLineDash([]);
      return;
    case 'forest':
      for (const [dx, dy] of [[0.25, 0.3], [0.7, 0.25], [0.45, 0.7]] as const) {
        g.moveTo(px + dx * c + 4, py + dy * c);
        g.arc(px + dx * c, py + dy * c, 4, 0, Math.PI * 2);
      }
      g.fill();
      return;
    case 'hill':
      g.moveTo(px + c * 0.2, py + c * 0.75);
      g.lineTo(px + c * 0.5, py + c * 0.3);
      g.lineTo(px + c * 0.8, py + c * 0.75);
      g.stroke();
      return;
    case 'urban':
      g.rect(px + c * 0.2, py + c * 0.2, c * 0.22, c * 0.22);
      g.rect(px + c * 0.55, py + c * 0.5, c * 0.22, c * 0.22);
      g.stroke();
      return;
    case 'swamp':
      for (const dy of [0.35, 0.65]) {
        g.moveTo(px + c * 0.2, py + dy * c);
        g.lineTo(px + c * 0.45, py + dy * c);
        g.moveTo(px + c * 0.55, py + dy * c);
        g.lineTo(px + c * 0.8, py + dy * c);
      }
      g.stroke();
      return;
    case 'water':
      for (const dy of [0.35, 0.65]) {
        g.moveTo(px + c * 0.15, py + dy * c);
        g.quadraticCurveTo(px + c * 0.32, py + dy * c - 6, px + c * 0.5, py + dy * c);
        g.quadraticCurveTo(px + c * 0.68, py + dy * c + 6, px + c * 0.85, py + dy * c);
      }
      g.stroke();
      return;
    case 'ridge':
      for (let i = 0; i < 4; i++) {
        g.moveTo(px + (i * c) / 4, py + c);
        g.lineTo(px + ((i + 1) * c) / 4, py);
      }
      g.stroke();
      return;
    default:
      return;
  }
}
