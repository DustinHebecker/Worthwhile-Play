/**
 * Icon set A (docs/design/relay-command-ux-previews, owner feedback "units are not told apart"):
 * the frame tells category and side (own: plain rectangle; enemy: pointed ends or cut corners),
 * the mark inside tells the function, reused across categories (flag = command source, mast with
 * arcs = relay, arc = artillery). Vehicles have wheels, structures a foundation bar, towers
 * battlements. Hand-written geometry in a 44-unit box (one map cell); no fonts or images.
 */

export type IconCategory = 'inf' | 'veh' | 'air' | 'str' | 'def';

/** Category of every kind the rulesets know; a kind missing here has no icon (tested). */
export const ICON_CATEGORY: Readonly<Record<string, IconCategory>> = {
  rifles: 'inf',
  lancer: 'inf',
  outrider: 'veh',
  warden: 'veh',
  howitzer: 'veh',
  'mast-truck': 'veh',
  'field-post': 'veh',
  jammer: 'veh',
  tracer: 'veh',
  kite: 'air',
  'command-post': 'str',
  'relay-mast': 'str',
  muster: 'str',
  'motor-pool': 'str',
  extractor: 'str',
  'tower-gun': 'def',
  'tower-artillery': 'def',
  'tower-laser': 'def',
  'tower-emp': 'def'
};

const rectD = (x: number, y: number, w: number, h: number, r = 0): string =>
  r === 0
    ? `M${x},${y} H${x + w} V${y + h} H${x} Z`
    : `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
const circleD = (cx: number, cy: number, r: number): string => `M${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} Z`;
const polyD = (pts: readonly (readonly [number, number])[]): string => 'M' + pts.map((p) => p.join(',')).join(' L') + ' Z';
const octD = (x: number, y: number, w: number, h: number, c: number): string =>
  polyD([[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]]);

/** The frame of a category for one side. */
export function frameD(cat: IconCategory, own: boolean): string {
  if (cat === 'inf' || cat === 'veh') return own ? rectD(7, 8, 30, 20, 3) : polyD([[3, 18], [10, 8], [34, 8], [41, 18], [34, 28], [10, 28]]);
  if (cat === 'air') return own ? 'M7,28 L7,17 Q22,1 37,17 L37,28 Z' : 'M3,22 L8,15 Q22,0 36,15 L41,22 L36,28 L8,28 Z';
  return own ? rectD(9, 5, 26, 26, 1.5) : octD(9, 5, 26, 26, 6);
}

/** A stroke of the mark (`fill`: a filled shape instead), optionally thicker. */
interface MarkPart {
  readonly d: string;
  readonly fill?: boolean;
  readonly width?: number;
}

const arcs = (cx: number, cy: number): MarkPart => ({
  d: `M${cx - 2.8},${cy - 2.8} A4,4 0 0 0 ${cx - 2.8},${cy + 2.8} M${cx + 2.8},${cy - 2.8} A4,4 0 0 1 ${cx + 2.8},${cy + 2.8} M${cx - 4.9},${cy - 4.9} A7,7 0 0 0 ${cx - 4.9},${cy + 4.9} M${cx + 4.9},${cy - 4.9} A7,7 0 0 1 ${cx + 4.9},${cy + 4.9}`
});

/** The mark of every kind (its function). */
export const MARKS: Readonly<Record<string, readonly MarkPart[]>> = {
  rifles: [{ d: 'M16,13 V23 M22,13 V23 M28,13 V23' }],
  lancer: [{ d: 'M12,18 H25 M21,14 L25,18 L21,22' }, { d: 'M29.5,12 V24', width: 3 }],
  outrider: [{ d: 'M12,18 Q22,9 32,18 Q22,27 12,18 Z' }, { d: circleD(22, 18, 2.6), fill: true }],
  warden: [{ d: rectD(12, 13, 20, 10, 5), width: 2.5 }, { d: 'M17,18 H27' }],
  howitzer: [{ d: 'M11,25 Q17,6 28.5,20' }, { d: circleD(29.5, 22, 2.6), fill: true }],
  'tower-artillery': [{ d: 'M11,25 Q17,6 28.5,20' }, { d: circleD(29.5, 22, 2.6), fill: true }],
  kite: [{ d: 'M22,10 L28,17 L22,24 L16,17 Z M16,17 H28' }, { d: 'M22,24 Q19.5,25.5 22,27' }],
  'mast-truck': [{ d: 'M22,25 V14' }, arcs(22, 14)],
  'field-post': [{ d: 'M17,26 V10' }, { d: 'M17,10 L29,14 L17,18 Z', fill: true }],
  'command-post': [{ d: 'M17,26 V10' }, { d: 'M17,10 L29,14 L17,18 Z', fill: true }],
  jammer: [{ d: 'M11,18 L15,12 L19,24 L23,12 L27,24 L31,12 L33,15' }],
  tracer: [{ d: circleD(22, 15, 5) }, { d: 'M22,20 V25 M19,15 H25' }],
  'relay-mast': [{ d: 'M16.5,28 L22,13 L27.5,28 M18.4,23 H25.6' }, arcs(22, 13)],
  muster: [{ d: 'M13,15 L22,9 L31,15 M17,18.5 V27 M22,18.5 V27 M27,18.5 V27' }],
  'motor-pool': [{ d: 'M13,15 L22,9 L31,15' }, { d: circleD(17, 23, 3.5) }, { d: circleD(27, 23, 3.5) }],
  extractor: [{ d: 'M22,17 L28,23 L22,29 L16,23 Z' }, { d: 'M22,23 V9 M18.5,12.5 L22,9 L25.5,12.5' }],
  'tower-gun': [{ d: circleD(22, 22, 5) }, { d: 'M22,17 V9', width: 3 }],
  'tower-laser': [{ d: 'M13,27 L26.5,13.5 M29,11 L31.5,8.5 M30,14.5 H33.5 M25.5,10 V6.5' }],
  'tower-emp': [{ d: circleD(22, 19, 3) }, { d: circleD(22, 19, 8) }]
};

export interface IconStyle {
  readonly own: boolean;
  /** Side colour (frame, own fill) and the surface colour (halo, enemy fill, own mark). */
  readonly colour: string;
  readonly surface: string;
  /** Last known position: faded, dashed frame. */
  readonly ghost?: boolean;
  /** Set up in place: outrigger legs instead of wheels. */
  readonly deployed?: boolean;
  /** Under construction: dashed, hatched frame with the turns left. */
  readonly site?: number;
}

const FRAME_W = 2.5;
const MARK_W = 2;

/**
 * Draws the icon of `kind` with its 44-unit box at (x, y), scaled by `scale`. Returns false if the
 * kind has no icon (canvas without Path2D, e.g. tests, or an unknown kind).
 */
export function drawIcon(g: CanvasRenderingContext2D, kind: string, x: number, y: number, scale: number, style: IconStyle): boolean {
  const cat = ICON_CATEGORY[kind];
  const marks = MARKS[kind];
  if (!cat || !marks || typeof Path2D === 'undefined') return false;
  const { own, colour, surface } = style;
  const faded = !!style.ghost || style.site !== undefined;
  const fill = own && !faded ? colour : surface;
  const ink = own && !faded ? surface : colour;
  const frame = new Path2D(frameD(cat, own));
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  if (style.ghost) g.globalAlpha = 0.6;
  // Halo: a surface-coloured outline so the icon stands out from any terrain, hatching or fog.
  g.strokeStyle = surface;
  g.lineWidth = FRAME_W + 3.5;
  g.stroke(frame);
  g.fillStyle = fill;
  g.fill(frame);
  g.strokeStyle = colour;
  g.lineWidth = FRAME_W;
  if (faded) g.setLineDash([4, 3]);
  g.stroke(frame);
  g.setLineDash([]);
  // Category extras: wheels (vehicles not set up), foundation bar (structures), battlements (towers).
  if (cat === 'veh' && !style.deployed) {
    for (const wx of [14, 30]) {
      const wheel = new Path2D(circleD(wx, 32, 2.6));
      g.fillStyle = own && !faded ? colour : surface;
      g.fill(wheel);
      g.lineWidth = 1.6;
      g.stroke(wheel);
    }
  }
  if (cat === 'str' || cat === 'def') {
    g.lineWidth = 3;
    g.lineCap = 'butt';
    if (style.site !== undefined) g.setLineDash([3, 2]);
    g.stroke(new Path2D('M7,34.5 H37'));
    g.setLineDash([]);
    g.lineCap = 'round';
  }
  if (cat === 'def') {
    g.fillStyle = colour;
    for (const bx of own ? [11.5, 20, 28.5] : [15, 20, 25]) g.fillRect(bx, 1, 4, 4);
  }
  if (style.deployed) {
    g.lineWidth = 2.4;
    g.stroke(new Path2D('M13,28 L8.5,34 M31,28 L35.5,34 M5,34 H39'));
  }
  if (style.site !== undefined) {
    // Hatching inside the frame and the turns left.
    g.save();
    g.clip(frame);
    g.lineWidth = 1.3;
    const hatch = new Path2D(Array.from({ length: 27 }, (_, i) => `M${-44 + i * 5},44 L${i * 5},0`).join(' '));
    g.stroke(hatch);
    g.restore();
    g.font = '800 14px system-ui, sans-serif';
    g.textAlign = 'center';
    g.lineWidth = 3;
    g.strokeStyle = surface;
    g.strokeText(String(style.site), 22, 23.5);
    g.fillStyle = colour;
    g.fillText(String(style.site), 22, 23.5);
  } else {
    for (const part of marks) {
      const p = new Path2D(part.d);
      if (part.fill) {
        g.fillStyle = ink;
        g.fill(p);
      } else {
        g.strokeStyle = ink;
        g.lineWidth = part.width ?? MARK_W;
        g.stroke(p);
      }
    }
  }
  g.restore();
  return true;
}
