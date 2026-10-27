/**
 * The food web of a habitat (design § 12.3), generated from the species table: rows by feeding level (plants at the
 * bottom, the nutrient pools below them), arrows from food to eater (three widths by preference), the nutrient cycle
 * as a dashed loop. Present species solid, absent ones outlined and marked "not here". Read out as a list with each
 * species' "about" line.
 */
import { h } from '@wp/ui';
import { glyph, svg } from './glyphs';
import { DEAD, habitatDef, type Habitat } from './habitats';
import type { Ui } from './ui';

/** Feeding level: plants 0, consumers 1 + the highest level of their food (dead matter counts as 0). */
export function trophicLevels(habitat: Habitat): number[] {
  const sp = habitatDef(habitat).species;
  const lvl: number[] = sp.map((s) => (s.producer ? 0 : -1));
  for (let pass = 0; pass < sp.length; pass++)
    sp.forEach((s, i) => {
      if (s.producer) return;
      lvl[i] = 1 + Math.max(0, ...s.eats.map(([f]) => (f === DEAD ? 0 : Math.max(0, lvl[f]!))));
    });
  return lvl;
}

export function foodWebView(ui: Ui, habitat: Habitat, present: readonly boolean[]): HTMLElement {
  const hab = habitatDef(habitat);
  const lvl = trophicLevels(habitat);
  const top = Math.max(...lvl);
  const W = 360;
  const rowH = 52;
  const H = (top + 2) * rowH + 20;
  const at: { x: number; y: number }[] = [];
  for (let L = 0; L <= top; L++) {
    const ids = hab.species.map((_, i) => i).filter((i) => lvl[i] === L);
    ids.forEach((i, k) => {
      at[i] = { x: Math.round(((k + 0.5) * W) / ids.length), y: H - 20 - (L + 1) * rowH - rowH / 2 + 20 };
    });
  }
  const poolY = H - 30;
  const pools = { dead: { x: W * 0.3, y: poolY }, nutrients: { x: W * 0.7, y: poolY } };
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'eco-web-svg', 'aria-hidden': 'true', focusable: 'false' });
  const arrow = (x1: number, y1: number, x2: number, y2: number, cls: string) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const sx = x1 + (dx / len) * 16;
    const sy = y1 + (dy / len) * 16;
    const ex = x2 - (dx / len) * 18;
    const ey = y2 - (dy / len) * 18;
    s.append(svg('path', { d: `M${sx.toFixed(1)} ${sy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`, class: cls }));
    s.append(svg('circle', { cx: ex.toFixed(1), cy: ey.toFixed(1), r: 2.5, class: 'eco-web-head' }));
  };
  // The nutrient cycle: dead matter → nutrients → plants (dashed).
  s.append(svg('path', { d: `M${pools.dead.x + 30} ${poolY}H${pools.nutrients.x - 34}`, class: 'eco-web-cycle' }));
  hab.species.forEach((sp, i) => {
    if (sp.producer) arrow(pools.nutrients.x, poolY, at[i]!.x, at[i]!.y, 'eco-web-cycle');
    for (const [f, pref] of sp.eats) {
      const from = f === DEAD ? pools.dead : at[f]!;
      arrow(from.x, from.y, at[i]!.x, at[i]!.y, `eco-web-edge eco-w${pref >= 1000 ? 3 : pref >= 400 ? 2 : 1}`);
    }
  });
  for (const [id, p] of Object.entries(pools)) {
    s.append(svg('rect', { x: p.x - 34, y: p.y - 12, width: 68, height: 24, rx: 6, class: 'eco-web-pool' }), svg('text', { x: p.x, y: p.y + 4, class: 'eco-web-text' }, document.createTextNode(ui.t(`pool.${id}`))));
  }
  hab.species.forEach((sp, i) => {
    const p = at[i]!;
    const g = svg('g', { transform: `translate(${p.x} ${p.y})`, class: `eco-web-node${present[i] ? '' : ' eco-absent'}` });
    g.append(svg('circle', { r: 15, class: 'eco-web-disc' }));
    const gl = glyph(sp.id);
    gl.setAttribute('transform', 'scale(0.8)');
    g.append(gl);
    g.append(svg('text', { y: 26, class: 'eco-web-text' }, document.createTextNode(present[i] ? ui.name(sp.id) : `${ui.name(sp.id)} (${ui.t('web.notHere')})`)));
    s.append(g);
  });
  const eaters = (i: number) => hab.species.filter((x) => x.eats.some(([f]) => f === i)).map((x) => ui.name(x.id));
  const list = h('ul', { class: 'eco-web-list', 'data-testid': 'eco-web-list' });
  hab.species.forEach((sp, i) => {
    const food = sp.eats.map(([f, pref]) => {
      const x = f === DEAD ? ui.t('pool.dead') : ui.name(hab.species[f]!.id);
      return pref >= 1000 ? ui.t('web.mostly', { x }) : pref < 400 ? ui.t('web.little', { x }) : x;
    });
    const by = eaters(i);
    const line = `${sp.producer ? ui.t('web.grows', { name: ui.name(sp.id) }) : ui.t('web.food', { name: ui.name(sp.id), list: food.join(', ') })} ${ui.t('web.eatenBy', { list: by.length ? by.join(', ') : ui.t('web.nobody') })}`;
    list.append(h('li', { class: present[i] ? '' : 'eco-absent' }, h('details', {}, h('summary', {}, `${line}${present[i] ? '' : ` (${ui.t('web.notHere')})`}`), h('p', {}, ui.about(sp.id)))));
  });
  list.append(h('li', {}, ui.t('web.cycle')));
  return h('section', { class: 'eco-web', 'data-testid': 'eco-web' }, h('h3', {}, ui.t('web.heading')), h('div', { class: 'eco-web-box', dir: 'ltr' }, s), list);
}
