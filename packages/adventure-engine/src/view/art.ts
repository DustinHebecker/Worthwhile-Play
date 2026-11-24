import type { AdventureState, Scene, Shape } from '../types';

export const SVG_NS = 'http://www.w3.org/2000/svg';
/** Scene coordinates (docs/design/adventures.md § 6). */
export const VIEW_BOX = '0 0 1600 900';

export const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

/**
 * Draws a scene's picture (docs/design/adventures.md § 7.2). The picture is decoration for sighted players;
 * hotspot geometry, labels and every piece of information stay in the structure and the text view, so an
 * adventure can switch from code-drawn art to another provider without touching logic, texts or saves.
 * Returns the content of an `<svg viewBox="0 0 1600 900">` (the view creates the element).
 */
export interface ArtProvider {
  render(scene: Scene, state: Readonly<AdventureState>): SVGElement;
}

/** The SVG shape of a hotspot (used for the clickable overlay and by art providers). */
export function shapeElement(shape: Shape): SVGElement {
  return 'points' in shape
    ? svg('polygon', { points: shape.points.map(([x, y]) => `${x},${y}`).join(' ') })
    : svg('rect', { x: shape.x, y: shape.y, width: shape.w, height: shape.h, rx: 12 });
}

/** Neutral placeholder art: a calm two-tone backdrop per region, for tests and content in progress. */
export const plainArt: ArtProvider = {
  render(scene) {
    let hue = 0;
    for (const ch of scene.region) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    const g = svg('g', { class: 'wp-adv__art' });
    g.append(
      svg('rect', { x: 0, y: 0, width: 1600, height: 900, fill: `hsl(${hue} 18% 26%)` }),
      svg('rect', { x: 0, y: 560, width: 1600, height: 340, fill: `hsl(${hue} 16% 18%)` })
    );
    return g;
  }
};
