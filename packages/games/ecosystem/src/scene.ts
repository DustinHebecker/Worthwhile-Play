/**
 * The pond and meadow scenes (design § 13): a calm cross-section drawn in SVG from one weekly sample. Glyph counts grow
 * with the logarithm of each amount; positions are fixed per species (from its id), so the picture does not jump
 * between weeks. The water and soil state is also given as a text badge, never by colour alone. Not mirrored in RTL.
 */
import { createRng, seedFromString } from '@wp/game-core';
import { h } from '@wp/ui';
import { glyph, glyphCount, svg } from './glyphs';
import { habitatDef, type Habitat } from './habitats';
import { idiv } from './model';
import type { Ui } from './ui';

export const SCENE_W = 320;
export const SCENE_H = 180;

/** Water clarity from the suspended algae (thresholds 80 / 200 thousand u). */
export function waterState(sample: readonly number[]): 'clear' | 'cloudy' | 'green' {
  const algae = (sample[0] ?? 0) + (sample[1] ?? 0);
  return algae <= 80_000 ? 'clear' : algae <= 200_000 ? 'cloudy' : 'green';
}

/** Soil moisture from the water stock (dry below half of the meadow's usual 150,000 w). */
export const soilState = (w: number): 'moist' | 'dry' => (w >= 75_000 ? 'moist' : 'dry');

/** The status badge text ("Water: clear" / "Soil: moist"). */
export const badgeKey = (habitat: Habitat, sample: readonly number[]): string =>
  habitat === 'pond' ? `water.${waterState(sample)}` : `soil.${soilState(sample[sample.length - 1] ?? 0)}`;

type Region = { x0: number; x1: number; y0: number; y1: number; scale: number };

const REGIONS: Readonly<Record<string, Region>> = {
  algae: { x0: 12, x1: 308, y0: 40, y1: 132, scale: 1 },
  bluegreen: { x0: 12, x1: 308, y0: 36, y1: 110, scale: 1 },
  duckweed: { x0: 14, x1: 306, y0: 26, y1: 27, scale: 1.1 },
  pondweed: { x0: 12, x1: 308, y0: 126, y1: 138, scale: 1.7 },
  fleas: { x0: 16, x1: 304, y0: 44, y1: 124, scale: 0.9 },
  snails: { x0: 14, x1: 306, y0: 150, y1: 156, scale: 0.9 },
  minnows: { x0: 24, x1: 296, y0: 56, y1: 120, scale: 1.1 },
  pike: { x0: 30, x1: 290, y0: 66, y1: 112, scale: 1.4 },
  grass: { x0: 8, x1: 312, y0: 112, y1: 128, scale: 1.3 },
  flowers: { x0: 10, x1: 310, y0: 112, y1: 126, scale: 1 },
  clover: { x0: 10, x1: 310, y0: 124, y1: 134, scale: 0.9 },
  aphids: { x0: 12, x1: 308, y0: 98, y1: 112, scale: 0.7 },
  ladybirds: { x0: 12, x1: 308, y0: 92, y1: 108, scale: 0.8 },
  rabbits: { x0: 20, x1: 300, y0: 114, y1: 124, scale: 1.4 },
  foxes: { x0: 30, x1: 290, y0: 108, y1: 118, scale: 1.6 },
  worms: { x0: 12, x1: 308, y0: 156, y1: 174, scale: 0.9 }
};

const positions = new Map<string, [number, number][]>();
/** Twelve fixed positions per species (deterministic from its id). */
function placesOf(id: string): [number, number][] {
  let p = positions.get(id);
  if (!p) {
    const rng = createRng(seedFromString(`eco-scene:${id}`));
    const r = REGIONS[id]!;
    p = Array.from({ length: 12 }, (_, k): [number, number] => {
      // Spread across the width in 12 slots, jittered, so that glyphs do not pile up.
      const slot = (r.x1 - r.x0) / 12;
      return [Math.round(r.x0 + slot * k + rng.next() * slot), Math.round(r.y0 + rng.next() * (r.y1 - r.y0))];
    });
    p = rng.shuffle(p);
    positions.set(id, p);
  }
  return p;
}

export interface SceneOptions {
  /** Show a small value tag per species (display preference). */
  numbers: boolean;
}

/** The scene for one sample: a figure with an SVG (`role="img"`) whose name lists what lives there. */
export function renderScene(ui: Ui, habitat: Habitat, sample: readonly number[], opts: SceneOptions): HTMLElement {
  const hab = habitatDef(habitat);
  const s = svg('svg', { viewBox: `0 0 ${SCENE_W} ${SCENE_H}`, class: `eco-scene-svg eco-${habitat}`, role: 'img', focusable: 'false' });
  if (habitat === 'pond') {
    const algae = (sample[0] ?? 0) + (sample[1] ?? 0);
    // Cosmetic tint: the green layer's opacity grows with the algae (clamped); the badge says it in words.
    const tint = Math.min(70, idiv(algae, 4_000)) / 100;
    s.append(
      svg('rect', { x: 0, y: 0, width: SCENE_W, height: 26, class: 'eco-sky' }),
      svg('rect', { x: 0, y: 26, width: SCENE_W, height: 124, class: 'eco-water' }),
      svg('rect', { x: 0, y: 26, width: SCENE_W, height: 124, class: 'eco-tint', 'fill-opacity': tint }),
      svg('path', { d: 'M0 26q20 -4 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0', class: 'eco-ripple' }),
      svg('path', { d: `M0 146q60 -8 120 -2t120 -4t80 2V${SCENE_H}H0Z`, class: 'eco-mud' })
    );
  } else {
    const w = sample[sample.length - 1] ?? 0;
    s.append(
      svg('rect', { x: 0, y: 0, width: SCENE_W, height: 150, class: 'eco-sky' }),
      svg('path', { d: 'M0 120q80 -26 160 -10t160 -6V150H0Z', class: 'eco-hill' }),
      svg('rect', { x: 0, y: 150, width: SCENE_W, height: 30, class: 'eco-soil' })
    );
    // Moisture texture: dots in the soil, their number grows with the soil water.
    const dots = Math.min(40, idiv(w * 40, hab.wMax || 1));
    const rng = createRng(seedFromString('eco-soil'));
    const g = svg('g', { class: 'eco-moist' });
    for (let k = 0; k < 40; k++) {
      const x = Math.round(rng.next() * SCENE_W);
      const y = 152 + Math.round(rng.next() * 26);
      if (k < dots) g.append(svg('circle', { cx: x, cy: y, r: 1.2 }));
    }
    s.append(g);
  }
  const items: { name: string; v: number }[] = [];
  hab.species.forEach((sp, i) => {
    const v = sample[i] ?? 0;
    if (v <= 0) return;
    items.push({ name: ui.name(sp.id), v });
    const n = glyphCount(sp.id, v);
    const r = REGIONS[sp.id]!;
    const at = placesOf(sp.id);
    const group = svg('g', { class: `eco-sp eco-sp-${sp.id}`, 'data-count': n });
    for (let k = 0; k < n; k++) {
      const [x, y] = at[k]!;
      const gl = glyph(sp.id);
      gl.setAttribute('transform', `translate(${x} ${y}) scale(${r.scale})`);
      group.append(gl);
    }
    if (opts.numbers) {
      const [x, y] = at[0]!;
      group.append(svg('text', { x: x + 8, y: y - 8, class: 'eco-tag' }, document.createTextNode(ui.amount(v))));
    }
    s.append(group);
  });
  items.sort((a, b) => b.v - a.v);
  const list = items.length ? items.map((x) => ui.t('scene.item', { name: x.name, v: ui.amount(x.v) })).join(', ') : ui.t('scene.empty');
  const summary = `${ui.t(`scene.${habitat}`, { list })} ${ui.t(badgeKey(habitat, sample))}`;
  s.setAttribute('aria-label', summary);
  return h('figure', { class: 'eco-scene', dir: 'ltr', 'data-testid': 'eco-scene' }, s);
}
