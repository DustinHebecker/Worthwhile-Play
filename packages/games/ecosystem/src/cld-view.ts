/**
 * The causal loop diagram (design § 12.2): nodes on an ellipse, arcs with arrowheads, a sign disc near each
 * arrowhead, two strokes across delayed arcs, and the loop labels; the explaining loop or chain is drawn thicker and
 * dashed. Not mirrored in RTL (a diagram); an ordered list below reads it out.
 */
import { h } from '@wp/ui';
import { chainEdges, layoutCld, loopHasDelay, loopKind, NODE_H, NODE_W, type Cld, type Edge, type Loop } from './cld';
import { glyph, svg } from './glyphs';
import type { Ui } from './ui';

let uid = 0;
const POOL = new Set(['nutrients', 'dead', 'water', 'light', 'runoff', 'flow', 'rain', 'fertiliser']);

/** "algae ↑ → water fleas ↑ → algae ↓": each node with the direction it moves when the first one rises. */
export function pathText(ui: Ui, cld: Cld, nodes: readonly string[], closed: boolean): string {
  const name = (id: string) => (POOL.has(id) ? ui.t(`pool.${id}`) : ui.name(id));
  const seq = closed ? [...nodes, nodes[0]!] : [...nodes];
  let sign = 1;
  const parts = [`${name(seq[0]!)} ↑`];
  for (let k = 1; k < seq.length; k++) {
    const e = cld.edges.find((x) => x.from === seq[k - 1] && x.to === seq[k]);
    sign *= e?.sign ?? 1;
    parts.push(`${name(seq[k]!)} ${sign > 0 ? '↑' : '↓'}${e?.delay ? ' ‖' : ''}`);
  }
  return parts.join(' → ');
}

const loopLine = (ui: Ui, cld: Cld, loop: Loop): string => {
  const kind = ui.t(`cld.kind.${loopKind(loop)}`) + (loopHasDelay(cld, loop) ? `, ${ui.t('cld.delay')}` : '');
  return `${ui.t('cld.loop', { id: loop.id, kind, path: pathText(ui, cld, loop.path, true) })} ${ui.content().loops[loop.key] ?? ''}`.trim();
};

/** The diagram with its accessible list; `highlight` overrides the diagram's own highlighted loop. */
export function cldView(ui: Ui, cld: Cld, opts: { highlight?: string | null; testid?: string } = {}): HTMLElement {
  const hl = opts.highlight === undefined ? cld.highlight : opts.highlight;
  const L = layoutCld(cld);
  const strong = new Set<Edge>();
  const loop = cld.loops.find((l) => l.id === hl);
  if (loop) loop.path.forEach((a, k) => {
    const e = cld.edges.find((x) => x.from === a && x.to === loop.path[(k + 1) % loop.path.length]);
    if (e) strong.add(e);
  });
  if (!loop && cld.chain) for (const e of chainEdges(cld, cld.chain)) strong.add(e);
  const s = svg('svg', { viewBox: `0 0 ${L.width} ${L.height}`, class: 'eco-cld-svg', role: 'img', 'aria-label': ui.t('cld.label'), focusable: 'false' });
  const arrow = `eco-arrow-${++uid}`;
  const defs = svg('defs', {}, svg('marker', { id: arrow, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, svg('path', { d: 'M0 0L10 5L0 10Z', class: 'eco-arrowhead' })));
  s.append(defs);
  for (const e of L.edges) {
    const on = strong.has(e.edge);
    s.append(svg('path', { d: `M${e.a.x} ${e.a.y}Q${e.c.x} ${e.c.y} ${e.b.x} ${e.b.y}`, class: `eco-edge${on ? ' eco-edge-on' : ''}`, 'marker-end': `url(#${arrow})` }));
    if (e.edge.delay) {
      // Two short strokes across the arc at its middle.
      const ang = e.angle + Math.PI / 2;
      const dx = Math.cos(ang) * 6;
      const dy = Math.sin(ang) * 6;
      const ox = Math.cos(e.angle) * 2.5;
      const oy = Math.sin(e.angle) * 2.5;
      s.append(svg('path', { d: `M${(e.mid.x - dx - ox).toFixed(1)} ${(e.mid.y - dy - oy).toFixed(1)}l${(2 * dx).toFixed(1)} ${(2 * dy).toFixed(1)}M${(e.mid.x - dx + ox).toFixed(1)} ${(e.mid.y - dy + oy).toFixed(1)}l${(2 * dx).toFixed(1)} ${(2 * dy).toFixed(1)}`, class: 'eco-delay' }));
    }
    s.append(svg('circle', { cx: e.sign.x, cy: e.sign.y, r: 7, class: 'eco-sign-disc' }), svg('text', { x: e.sign.x, y: e.sign.y + 4, class: 'eco-sign' }, document.createTextNode(e.edge.sign > 0 ? '+' : '−')));
  }
  for (const n of L.nodes) {
    const g = svg('g', { transform: `translate(${n.at.x} ${n.at.y})`, class: 'eco-node' });
    g.append(svg('rect', { x: -NODE_W / 2, y: -NODE_H / 2, width: NODE_W, height: NODE_H, rx: 8, class: 'eco-node-box' }));
    if (!POOL.has(n.id)) {
      const gl = glyph(n.id);
      gl.setAttribute('transform', `translate(${-NODE_W / 2 + 13} 0) scale(0.7)`);
      g.append(gl);
    }
    const label = POOL.has(n.id) ? ui.t(`pool.${n.id}`) : ui.name(n.id);
    g.append(svg('text', { x: POOL.has(n.id) ? 0 : 8, y: 4, class: `eco-node-text${label.length > 13 ? ' eco-small' : ''}` }, document.createTextNode(label)));
    s.append(g);
  }
  for (const l of L.loops) {
    const on = l.loop.id === hl;
    s.append(
      svg('circle', { cx: l.at.x, cy: l.at.y, r: 14, class: `eco-loop-disc${on ? ' eco-loop-on' : ''}` }),
      svg('path', { d: `M${l.at.x + 9} ${l.at.y - 4}A10 10 0 1 0 ${l.at.x + 6} ${l.at.y + 8}`, class: 'eco-loop-arrow' }),
      svg('text', { x: l.at.x, y: l.at.y + 4, class: 'eco-loop-id' }, document.createTextNode(l.loop.id))
    );
  }
  const list = h('ol', { class: 'eco-cld-list', 'data-testid': 'eco-cld-list' });
  const ordered = [...cld.loops].sort((a, b) => (a.id === hl ? -1 : b.id === hl ? 1 : 0));
  for (const lp of ordered) list.append(h('li', { class: lp.id === hl ? 'eco-on' : '' }, loopLine(ui, cld, lp)));
  if (cld.chain) list.append(h('li', { class: !loop ? 'eco-on' : '' }, ui.t('cld.chain', { path: pathText(ui, cld, cld.chain, false) })));
  return h('figure', { class: 'eco-cld', 'data-testid': opts.testid ?? 'eco-cld' }, h('div', { class: 'eco-cld-box', dir: 'ltr' }, s), h('figcaption', {}, h('p', { class: 'eco-muted' }, ui.t('cld.legend')), list));
}
