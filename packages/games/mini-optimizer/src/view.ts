import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { letter } from './common';
import { tripLength, tripLoad, tripOf, type DeliveryPlan, type DeliveryProblem } from './delivery';
import { pointLabel, pointSegmentDistance, usedJunctions, type NetworkPlan, type NetworkProblem } from './network';
import { resourceUse, setupCost, type ProductionPlan, type ProductionProblem } from './production';
import {
  check,
  clearPlan,
  createInitial,
  gapOf,
  isFeasible,
  newTrip,
  resetState,
  reveal,
  score,
  setQty,
  solve,
  tapStop,
  toggleLink,
  undo,
  violations,
  type Kind,
  type MoState,
  type Plan,
  type Violation
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
type SvgAttrs = Record<string, string | number>;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: SvgAttrs, ...children: (SVGElement | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) el.append(child);
  return el;
}

/** Network drawing: one field unit in SVG units, point sizes, and the pointer reach for picking a road. */
const UNIT = 40;
const TOWN_R = 18;
const JUNCTION_HALF = 16;
const HIT = 56;
const PICK_LINK = 28;
/** Delivery drawing: distance between intersections and the margin around the grid. */
const PITCH = 46;
const MARGIN = 44;
const STOP_R = 17;
const STOP_HIT = 34;
/** Line patterns of trips 1, 2, 3 … (repeating); trips also differ by number, never by colour alone. */
const TRIP_DASH = ['', '16 7', '16 5 2 5'];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const LIST_OPEN = 'listOpen';

export function createMiniOptimizer(context: GameContext): GameInstance<MoState> {
  const { t, root } = context;
  let state = createInitial(0);
  let paused = false;
  /** Display only: the diagram shows a best plan instead of the player's (after "Show a best plan"). */
  let showBest = false;
  /** Interactive diagram items (links or depot + customers) in reading order, for roving focus. */
  let items: SVGGElement[] = [];
  let builtFor: MoState['problem'] | null = null;

  const fmt = (n: number) => new Intl.NumberFormat(bcp47Tag(t.locale)).format(n);
  const pct = (n: number) => new Intl.NumberFormat(bcp47Tag(t.locale), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n / 100);
  const valueText = (kind: Kind, n: number) => t(`value.${kind}`, { n: fmt(n) });

  /* ---------- Static frame ---------- */

  const taskEl = h('p', { class: 'mo-task', id: 'mo-task', 'data-testid': 'mo-task' });
  const helpEl = h('p', { class: 'mo-help' });
  const diagram = svg('svg', { class: 'mo-diagram', role: 'group', 'aria-describedby': 'mo-task', 'data-testid': 'mo-diagram' });
  diagram.addEventListener('click', (event) => onDiagramClick(event));
  diagram.addEventListener('keydown', (event) => onDiagramKey(event));
  const products = h('div', { class: 'mo-products', 'data-testid': 'mo-products' });
  const yoursButton = h('button', { type: 'button', 'data-testid': 'mo-view-yours', 'aria-pressed': 'true', onclick: () => setView(false) }, t('view.yours'));
  const bestButton = h('button', { type: 'button', 'data-testid': 'mo-view-best', 'aria-pressed': 'false', onclick: () => setView(true) }, t('view.best'));
  const viewToggle = h('div', { class: 'mo-toggle', role: 'group', 'aria-label': t('view.label'), 'data-testid': 'mo-view' }, yoursButton, bestButton);
  const bestNote = h('p', { class: 'mo-best-note', 'data-testid': 'mo-best-note' });
  const legend = h('p', { class: 'mo-legend' });
  const work = h('div', { class: 'mo-work' }, viewToggle, diagram, products, bestNote, legend);

  const scoreEl = h('p', { class: 'mo-score', 'data-testid': 'mo-score' });
  const checksList = h('ul', { class: 'mo-checks', 'data-testid': 'mo-status' });
  const statusBox = h('div', { class: 'mo-statusbox' }, scoreEl, checksList);

  const checkButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'mo-check', onclick: () => onCheck() }, t('action.check'));
  const depotButton = h('button', { type: 'button', 'data-testid': 'mo-depot', onclick: () => onDepot() }, t('action.depot'));
  const undoButton = h('button', { type: 'button', 'data-testid': 'mo-undo', onclick: () => onUndo() }, t('common.undo'));
  const clearButton = h('button', { type: 'button', 'data-testid': 'mo-clear', onclick: () => onClear() }, t('action.clear'));
  const actions = h('div', { class: 'mo-actions' }, checkButton, depotButton, undoButton, clearButton);

  const resultLines = h('div', { class: 'mo-result-lines' });
  const revealButton = h('button', { type: 'button', 'data-testid': 'mo-reveal', onclick: () => onReveal() }, t('action.reveal'));
  const ideaText = h('p', {});
  const result = h(
    'section',
    { class: 'mo-result', 'data-testid': 'mo-result', 'aria-labelledby': 'mo-result-title' },
    h('h3', { id: 'mo-result-title' }, t('result.title')),
    resultLines,
    revealButton,
    h('h4', {}, t('idea.title')),
    ideaText
  );

  const listBody = h('div', { class: 'mo-list-body', 'data-testid': 'mo-list' });
  const details = h('details', { class: 'mo-details' }, h('summary', {}, t('list.title')), listBody);
  details.addEventListener('toggle', () => context.preferences?.set(LIST_OPEN, details.open));
  const side = h('div', { class: 'mo-side' }, statusBox, actions, result, details);
  const keysEl = h('p', { class: 'mo-keys' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'mo-announcer' });

  const container = h(
    'div',
    { class: 'wp-mini-optimizer', dir: t.direction, lang: bcp47Tag(t.locale) },
    taskEl,
    helpEl,
    h('div', { class: 'mo-layout' }, work, side),
    keysEl,
    live
  );

  /* ---------- Texts ---------- */

  const net = () => state.problem as NetworkProblem;
  const delP = () => state.problem as DeliveryProblem;
  const prodP = () => state.problem as ProductionProblem;

  const linkText = (p: NetworkProblem, i: number) => {
    const l = p.links[i]!;
    const params = { a: pointLabel(p, l.a), b: pointLabel(p, l.b), cost: l.cost };
    return l.rough ? t('link.labelRough', params) : t('link.label', params);
  };
  const productName = (p: ProductionProblem, i: number) => t(`product.${p.products[i]!.id}`);
  const route = (trip: readonly number[]) => [t('depot'), ...trip.map(letter), t('depot')].join(' → ');
  const tripLine = (p: DeliveryProblem, trip: readonly number[], n: number) =>
    t('trip.line', { n, route: route(trip), load: tripLoad(p, trip), capacity: p.capacity, km: tripLength(p, trip) });

  const violationText = (v: Violation): string => {
    switch (v.code) {
      case 'groups':
        return t('net.groups', { n: v.groups.length, groups: v.groups.map((g) => g.map((i) => pointLabel(net(), i)).join(' ')).join(' | ') });
      case 'unvisited':
        return t('del.unvisited', { list: v.stops.map(letter).join(', ') });
      case 'overload':
        return t('trip.over', { n: v.trip + 1, load: v.load, capacity: v.capacity, extra: v.load - v.capacity });
      case 'overStock':
        return t('meter.over', { name: t(`res.${prodP().resources[v.resource]!.id}`), use: v.use, stock: v.stock, extra: v.use - v.stock });
      case 'nothing':
        return t('prod.empty');
    }
  };

  const scoreLine = () => t(`score.${state.problem.kind}`, { n: fmt(score(state.problem, state.plan)) });

  /** One-line description of a plan (for the best-plan note and the list view). */
  const planText = (plan: Plan): string[] => {
    const p = state.problem;
    if (p.kind === 'network') return [t('best.network', { list: (plan as NetworkPlan).built.map((i) => `${pointLabel(p, p.links[i]!.a)}–${pointLabel(p, p.links[i]!.b)}`).join(', ') })];
    if (p.kind === 'delivery') return (plan as DeliveryPlan).trips.filter((trip) => trip.length).map((trip, i) => tripLine(p, trip, i + 1));
    const made = (plan as ProductionPlan).qty.flatMap((q, i) => (q > 0 ? [t('qty.item', { n: q, name: productName(p, i) })] : []));
    return [made.join(', ')];
  };

  /* ---------- Network diagram ---------- */

  const at = (x: number, y: number): [number, number] => [x * UNIT, y * UNIT];

  const buildNetwork = (p: NetworkProblem) => {
    diagram.setAttribute('viewBox', `0 0 ${10 * UNIT} ${10 * UNIT}`);
    const junctions = p.points.filter((q) => q.junction).length;
    diagram.setAttribute('aria-label', t('diagram.network', { towns: p.points.length - junctions, junctions }));
    const links = p.links.map((l, i) => {
      const [x1, y1] = at(p.points[l.a]!.x, p.points[l.a]!.y);
      const [x2, y2] = at(p.points[l.b]!.x, p.points[l.b]!.y);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const line = (cls: string) => svg('line', { class: cls, x1, y1, x2, y2 });
      const g = svg(
        'g',
        { class: 'mo-link', role: 'button', 'data-link': i, 'data-testid': `link-${i}`, tabindex: -1 },
        line('mo-hitline'),
        line('mo-ring'),
        line('mo-road'),
        line('mo-best'),
        line('mo-best-inner'),
        svg('rect', { class: 'mo-hit', x: mx - HIT / 2, y: my - HIT / 2, width: HIT, height: HIT }),
        svg('rect', { class: 'mo-badge', y: my - 13, height: 26, rx: 7 }),
        svg('text', { class: 'mo-cost', x: mx, y: my + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' })
      );
      return { g, mx, my, i };
    });
    /** Opening-cost badges placed so far (they must not cover each other either). */
    const openBadges: [number, number][] = [];
    const points = p.points.map((q, i) => {
      const [x, y] = at(q.x, q.y);
      const label = pointLabel(p, i);
      const shape = q.junction
        ? svg('rect', { class: 'mo-junction', 'data-point': i, x: x - JUNCTION_HALF, y: y - JUNCTION_HALF, width: 2 * JUNCTION_HALF, height: 2 * JUNCTION_HALF, rx: 3 })
        : svg('circle', { class: 'mo-town', cx: x, cy: y, r: TOWN_R });
      const g = svg('g', { class: 'mo-point', 'data-testid': `point-${label}`, 'aria-hidden': 'true' }, shape,
        svg('text', { class: 'mo-label', x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, label));
      if (q.junction && q.open > 0) {
        // The opening-cost badge goes beside the square where it is farthest from every road and every road's cost
        // badge (a badge counts as about 26 units wide around its road's midpoint).
        const h1 = JUNCTION_HALF + 14;
        const w1 = JUNCTION_HALF + 20;
        const spots: [number, number][] = [[x, y + h1], [x, y - h1], [x + w1, y], [x - w1, y], [x + w1, y + h1], [x - w1, y + h1], [x + w1, y - h1], [x - w1, y - h1]];
        const ends = (l: { a: number; b: number }) => [at(p.points[l.a]!.x, p.points[l.a]!.y), at(p.points[l.b]!.x, p.points[l.b]!.y)] as const;
        const clearance = ([bx, by]: [number, number]) =>
          Math.min(
            ...p.links.map((l) => pointSegmentDistance([bx, by], ...ends(l))),
            ...p.links.map((l) => {
              const [[x1, y1], [x2, y2]] = ends(l);
              return Math.hypot((x1 + x2) / 2 - bx, (y1 + y2) / 2 - by) - 26;
            }),
            ...p.points.map((o) => Math.hypot(o.x * UNIT - bx, o.y * UNIT - by) - TOWN_R - 8),
            // Clearly nearer to its own square than to any other junction, so it reads as that junction's cost.
            ...p.points.map((o, k) => (o.junction && k !== i ? Math.hypot(o.x * UNIT - bx, o.y * UNIT - by) - 75 : Infinity)),
            ...openBadges.map(([ox, oy]) => Math.hypot(ox - bx, oy - by) - 34)
          );
        const inside = spots.filter(([sx, sy]) => sx - 16 >= 0 && sx + 16 <= 10 * UNIT && sy - 11 >= 0 && sy + 11 <= 10 * UNIT);
        // Straight below, above or beside the square reads best; a corner spot must be clearly clearer to win.
        const score = (spot: [number, number]) => clearance(spot) - (spot[0] !== x && spot[1] !== y ? 8 : 0);
        const [bx, by] = inside.reduce((best, spot) => (score(spot) > score(best) + 0.5 ? spot : best));
        openBadges.push([bx, by]);
        g.append(
          svg('rect', { class: 'mo-open-box', x: bx - 15, y: by - 10, width: 30, height: 20, rx: 5 }),
          svg('text', { class: 'mo-open', x: bx, y: by + 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, `+${q.open}`)
        );
      }
      if (!q.junction) {
        g.append(svg('g', { class: 'mo-group' }, svg('circle', { cx: x + TOWN_R, cy: y - TOWN_R, r: 9 }), svg('text', { x: x + TOWN_R, y: y - TOWN_R + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' })));
      }
      return g;
    });
    diagram.append(
      svg('rect', { class: 'mo-bg', x: 0, y: 0, width: 10 * UNIT, height: 10 * UNIT, rx: 12 }),
      svg('g', {}, ...links.map((l) => l.g)),
      svg('g', {}, ...points)
    );
    items = links.sort((a, b) => a.my - b.my || a.mx - b.mx).map((l) => l.g);
  };

  const renderNetwork = (p: NetworkProblem) => {
    const shown = showBest ? (solve(p).plan as NetworkPlan) : (state.plan as NetworkPlan);
    const built = new Set(shown.built);
    diagram.querySelectorAll<SVGGElement>('.mo-link').forEach((g) => {
      const i = Number(g.dataset.link);
      const on = built.has(i);
      const l = p.links[i]!;
      g.classList.toggle('is-built', on && !showBest);
      g.classList.toggle('is-best', on && showBest);
      g.dataset.built = String(on && !showBest);
      g.setAttribute('aria-pressed', String(on));
      g.setAttribute('aria-disabled', String(showBest));
      g.setAttribute('aria-label', linkText(p, i));
      const text = `${on ? '✓' : ''}${l.rough ? '≈' : ''}${l.cost}`;
      const label = g.querySelector('.mo-cost')!;
      label.textContent = text;
      const width = 14 + 10 * [...text].length;
      const badge = g.querySelector('.mo-badge')!;
      const mx = Number(label.getAttribute('x'));
      badge.setAttribute('x', String(mx - width / 2));
      badge.setAttribute('width', String(width));
    });
    const groups = violations(p, shown).find((v) => v.code === 'groups');
    const groupOf = new Map<number, number>();
    if (groups?.code === 'groups') groups.groups.forEach((g, k) => g.forEach((town) => groupOf.set(town, k + 1)));
    diagram.querySelectorAll<SVGGElement>('.mo-point').forEach((g, i) => {
      const mark = g.querySelector<SVGGElement>('.mo-group');
      if (!mark) return;
      const k = groupOf.get(i);
      mark.style.display = k ? '' : 'none';
      mark.querySelector('text')!.textContent = k ? String(k) : '';
    });
    const used = new Set(usedJunctions(p, shown.built));
    diagram.querySelectorAll<SVGRectElement>('.mo-junction').forEach((rect) => rect.classList.toggle('is-used', used.has(Number(rect.dataset.point))));
  };

  /* ---------- Delivery diagram ---------- */

  const gx = (x: number) => MARGIN + x * PITCH;

  const buildDelivery = (p: DeliveryProblem) => {
    const side = 2 * MARGIN + (p.size - 1) * PITCH;
    diagram.setAttribute('viewBox', `0 0 ${side} ${side}`);
    diagram.setAttribute('aria-label', t('diagram.delivery', { n: p.stops.length, capacity: p.capacity }));
    const streets: SVGElement[] = [];
    for (let k = 0; k < p.size; k++) {
      streets.push(svg('line', { class: 'mo-street', x1: gx(0), y1: gx(k), x2: gx(p.size - 1), y2: gx(k) }));
      streets.push(svg('line', { class: 'mo-street', x1: gx(k), y1: gx(0), x2: gx(k), y2: gx(p.size - 1) }));
    }
    const [dx, dy] = [gx(p.depot.x), gx(p.depot.y)];
    const depot = svg(
      'g',
      { class: 'mo-depot', role: 'button', 'data-depot': '', 'data-testid': 'depot', tabindex: -1, 'aria-label': t('depot.label') },
      svg('circle', { class: 'mo-hit', cx: dx, cy: dy, r: STOP_HIT }),
      svg('circle', { class: 'mo-ring', cx: dx, cy: dy, r: STOP_R + 10 }),
      svg('path', { class: 'mo-house', d: `M${dx - 17} ${dy - 2}L${dx} ${dy - 19}L${dx + 17} ${dy - 2}V${dy + 16}H${dx - 17}Z` }),
      svg('path', { class: 'mo-door', d: `M${dx - 5} ${dy + 16}V${dy + 4}H${dx + 5}V${dy + 16}` })
    );
    const stops = p.stops.map((s, i) => {
      const [x, y] = [gx(s.x), gx(s.y)];
      return svg(
        'g',
        { class: 'mo-stop', role: 'button', 'data-stop': i, 'data-testid': `stop-${letter(i)}`, tabindex: -1 },
        svg('circle', { class: 'mo-hit', cx: x, cy: y, r: STOP_HIT }),
        svg('circle', { class: 'mo-ring', cx: x, cy: y, r: STOP_R + 10 }),
        svg('circle', { class: 'mo-customer', cx: x, cy: y, r: STOP_R }),
        svg('text', { class: 'mo-label', x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, letter(i)),
        svg('rect', { class: 'mo-parcel-box', x: x + 6, y: y + 12, width: 30, height: 18, rx: 4 }),
        svg('text', { class: 'mo-parcels', x: x + 21, y: y + 21.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, `▣${s.parcels}`),
        svg('rect', { class: 'mo-step-box', x: x - 38, y: y - 32, width: 34, height: 18, rx: 9 }),
        svg('text', { class: 'mo-step', x: x - 21, y: y - 22.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' })
      );
    });
    diagram.append(
      svg('rect', { class: 'mo-bg', x: 0, y: 0, width: side, height: side, rx: 12 }),
      svg('g', {}, ...streets),
      svg('g', { class: 'mo-routes' }),
      depot,
      svg('g', {}, ...stops)
    );
    const order = [{ g: depot, x: p.depot.x, y: p.depot.y }, ...stops.map((g, i) => ({ g, x: p.stops[i]!.x, y: p.stops[i]!.y }))];
    items = order.sort((a, b) => a.y - b.y || a.x - b.x).map((o) => o.g);
  };

  const renderDelivery = (p: DeliveryProblem) => {
    const plan = showBest ? (solve(p).plan as DeliveryPlan) : (state.plan as DeliveryPlan);
    const routes = diagram.querySelector('.mo-routes')!;
    clear(routes);
    plan.trips.forEach((trip, k) => {
      if (trip.length === 0) return;
      const o = ((k % 3) - 1) * 4;
      const pts = [p.depot, ...trip.map((s) => p.stops[s]!)].map((q) => [gx(q.x) + o, gx(q.y) + o] as const);
      let d = `M${pts[0]![0]} ${pts[0]![1]}`;
      for (let j = 1; j < pts.length; j++) d += `H${pts[j]![0]}V${pts[j]![1]}`;
      const last = pts[pts.length - 1]!;
      const back = `M${last[0]} ${last[1]}H${gx(p.depot.x) + o}V${gx(p.depot.y) + o}`;
      const over = tripLoad(p, trip) > p.capacity;
      const dash = TRIP_DASH[k % TRIP_DASH.length]!;
      const attrs = (cls: string, path: string): SvgAttrs => ({ class: cls, d: path, ...(dash && !cls.includes('inner') ? { 'stroke-dasharray': dash } : {}) });
      if (showBest) routes.append(svg('path', attrs('mo-route is-best', d)), svg('path', { class: 'mo-route-inner', d }));
      else routes.append(svg('path', attrs(`mo-route${over ? ' is-over' : ''}`, d)));
      routes.append(svg('path', { class: 'mo-return', d: back }));
    });
    const current = plan.trips.length - 1;
    diagram.querySelectorAll<SVGGElement>('.mo-stop').forEach((g) => {
      const i = Number(g.dataset.stop);
      const trip = tripOf(plan, i);
      const step = trip >= 0 ? plan.trips[trip]!.indexOf(i) + 1 : 0;
      g.classList.toggle('is-planned', trip >= 0);
      g.classList.toggle('is-current', trip >= 0 && trip === current && !showBest);
      g.dataset.trip = String(trip + 1);
      g.querySelector('.mo-step')!.textContent = trip >= 0 ? `${trip + 1}·${step}` : '';
      const s = p.stops[i]!;
      g.setAttribute('aria-label', trip >= 0 ? t('stop.planned', { name: letter(i), parcels: s.parcels, trip: trip + 1, step }) : t('stop.label', { name: letter(i), parcels: s.parcels }));
      g.setAttribute('aria-disabled', String(showBest));
    });
    diagram.querySelector('.mo-depot')!.setAttribute('aria-disabled', String(showBest));
  };

  /* ---------- Production cards ---------- */

  const buildProduction = (p: ProductionProblem) => {
    clear(products);
    p.products.forEach((product, i) => {
      const name = productName(p, i);
      const use = product.use.flatMap((u, r) => (u > 0 ? [t(`use.${p.resources[r]!.id}`, { n: u })] : [])).join(' · ');
      const facts = [t('prod.value', { n: product.value }), use, t('prod.max', { n: product.max }), ...(product.setup > 0 ? [t('prod.setup', { n: product.setup })] : [])];
      const qty = h('span', {
        class: 'mo-qty',
        role: 'spinbutton',
        tabindex: 0,
        'data-testid': `qty-${i}`,
        'data-product': i,
        'aria-label': t('qty.aria', { name }),
        'aria-valuemin': 0,
        'aria-valuemax': product.max
      });
      qty.addEventListener('keydown', (event) => onQtyKey(event, i));
      products.append(
        h(
          'article',
          { class: 'mo-product', 'data-testid': `product-${i}` },
          h('h3', {}, name),
          h('p', { class: 'mo-facts' }, ...facts.flatMap((fact, k) => [k ? ' · ' : '', h('span', { class: 'mo-fact' }, fact)])),
          h(
            'div',
            { class: 'mo-stepper' },
            h('button', { type: 'button', class: 'mo-minus', 'data-testid': `minus-${i}`, 'aria-label': t('qty.less', { name }), onclick: () => onQty(i, -1) }, '−'),
            qty,
            h('button', { type: 'button', class: 'mo-plus', 'data-testid': `plus-${i}`, 'aria-label': t('qty.more', { name }), onclick: () => onQty(i, 1) }, '+')
          ),
          h('p', { class: 'mo-bestqty', 'data-testid': `bestqty-${i}` })
        )
      );
    });
  };

  const renderProduction = (p: ProductionProblem) => {
    const qty = (state.plan as ProductionPlan).qty;
    const best = solve(p).plan as ProductionPlan;
    p.products.forEach((product, i) => {
      const q = qty[i]!;
      const el = products.querySelector<HTMLElement>(`[data-testid="qty-${i}"]`)!;
      el.textContent = String(q);
      el.setAttribute('aria-valuenow', String(q));
      el.setAttribute('aria-valuetext', t('qty.valuetext', { n: q, max: product.max }));
      el.setAttribute('aria-disabled', String(showBest));
      products.querySelector<HTMLButtonElement>(`[data-testid="minus-${i}"]`)!.disabled = showBest || q === 0;
      products.querySelector<HTMLButtonElement>(`[data-testid="plus-${i}"]`)!.disabled = showBest || q === product.max;
      const bestEl = products.querySelector<HTMLElement>(`[data-testid="bestqty-${i}"]`)!;
      bestEl.hidden = !showBest;
      bestEl.textContent = showBest ? t('best.qty', { n: best.qty[i]! }) : '';
    });
  };

  /** The plan the status box describes: the one on screen (the player's, or a best plan while it is shown). */
  const shownPlan = (): Plan => (showBest ? solve(state.problem).plan : state.plan);

  /** Resource meters: a bar up to the stock with a marked limit; use beyond it is drawn hatched, and named. */
  const meters = (p: ProductionProblem): HTMLElement[] => {
    const use = resourceUse(p, (shownPlan() as ProductionPlan).qty);
    return p.resources.map((res, r) => {
      const used = use[r]!;
      const over = used > res.stock;
      const scale = Math.max(used, res.stock);
      const name = t(`res.${res.id}`);
      const text = over ? t('meter.over', { name, use: used, stock: res.stock, extra: used - res.stock }) : t('meter.ok', { name, use: used, stock: res.stock });
      const bar = h(
        'div',
        { class: 'mo-bar', 'aria-hidden': 'true' },
        h('span', { class: 'mo-fill', style: `inline-size:${(100 * Math.min(used, res.stock)) / scale}%` }),
        over ? h('span', { class: 'mo-over', style: `inset-inline-start:${(100 * res.stock) / scale}%;inline-size:${(100 * (used - res.stock)) / scale}%` }) : null,
        h('span', { class: 'mo-limit', style: `inset-inline-start:${(100 * res.stock) / scale}%` })
      );
      return h('li', { class: `mo-meter${over ? ' is-bad' : ' is-ok'}`, 'data-testid': `meter-${res.id}` }, h('span', {}, `${over ? '⚠' : '✓'} ${text}`), bar);
    });
  };

  /* ---------- Status, result and list ---------- */

  const item = (ok: boolean, text: string) => h('li', { class: ok ? 'is-ok' : 'is-bad' }, `${ok ? '✓' : '⚠'} ${text}`);

  const renderStatus = () => {
    const p = state.problem;
    scoreEl.textContent = t(`score.${p.kind}`, { n: fmt(score(p, shownPlan())) });
    scoreEl.dataset.value = String(score(p, shownPlan()));
    clear(checksList);
    if (p.kind === 'network') {
      const plan = shownPlan() as NetworkPlan;
      const groups = violations(p, plan);
      const towns = p.points.filter((q) => !q.junction).length;
      checksList.append(groups.length ? item(false, violationText(groups[0]!)) : item(true, t('net.connected', { n: towns })));
      if (p.points.some((q) => q.junction)) {
        const used = usedJunctions(p, plan.built);
        const open = used.reduce((sum, j) => sum + p.points[j]!.open, 0);
        const list = used.map((j) => pointLabel(p, j)).join(', ');
        checksList.append(h('li', { class: 'is-info' }, used.length === 0 ? t('net.noJunction') : open > 0 ? t('net.junctionsOpen', { list, n: open }) : t('net.junctions', { list })));
      }
    } else if (p.kind === 'delivery') {
      const plan = shownPlan() as DeliveryPlan;
      checksList.append(h('li', { class: 'is-info' }, t('del.capacity', { n: p.capacity })));
      plan.trips.forEach((trip, k) => {
        const load = tripLoad(p, trip);
        if (trip.length === 0) checksList.append(h('li', { class: 'is-info' }, t('trip.empty', { n: k + 1 })));
        else if (load > p.capacity) checksList.append(item(false, t('trip.over', { n: k + 1, load, capacity: p.capacity, extra: load - p.capacity })));
        else checksList.append(item(true, t('trip.status', { n: k + 1, load, capacity: p.capacity })));
      });
      const left = violations(p, plan).find((v) => v.code === 'unvisited');
      checksList.append(left ? item(false, violationText(left)) : item(true, t('del.allVisited')));
    } else {
      if ((shownPlan() as ProductionPlan).qty.every((q) => q === 0)) checksList.append(item(false, t('prod.empty')));
      checksList.append(...meters(p));
      const setup = setupCost(p, (shownPlan() as ProductionPlan).qty);
      if (p.products.some((x) => x.setup > 0)) checksList.append(h('li', { class: 'is-info' }, t('prod.setupTotal', { n: setup })));
    }
  };

  const renderResult = () => {
    result.hidden = state.checks === 0 || !state.last;
    if (!state.last) return;
    const kind = state.problem.kind;
    const best = solve(state.problem).score;
    const yours = state.last.score;
    const { gap, percent } = gapOf(kind, yours, best);
    clear(resultLines);
    const line = (text: string, testid?: string, value?: number) => h('p', { ...(testid ? { 'data-testid': testid } : {}), ...(value !== undefined ? { 'data-value': value } : {}) }, text);
    resultLines.append(
      line(t('result.yours', { value: valueText(kind, yours) }), 'mo-result-yours', yours),
      line(t('result.best', { value: valueText(kind, best) }), 'mo-result-best', best),
      gap === 0
        ? h('p', { class: 'mo-optimal', 'data-testid': 'mo-result-gap', 'data-value': 0 }, t('result.optimal'))
        : line(t('result.gap', { value: kind === 'delivery' ? valueText(kind, gap) : fmt(gap), percent: pct(percent) }), 'mo-result-gap', gap),
      line(`${t('result.checks', { n: state.checks })}${state.bestScore !== null && state.checks > 1 ? ` · ${t('result.ownBest', { value: valueText(kind, state.bestScore) })}` : ''}`, 'mo-result-checks', state.checks)
    );
    if (state.revealed) resultLines.append(line(t('result.afterReveal')));
    if (state.phase === 'planning') resultLines.append(line(t('result.changed'), 'mo-result-changed'));
    revealButton.hidden = state.revealed;
    ideaText.textContent = t(`idea.${kind}`);
  };

  const renderList = () => {
    const p = state.problem;
    details.hidden = p.kind === 'production';
    clear(listBody);
    if (showBest) {
      listBody.append(h('p', {}, t('view.bestList')), ...planText(solve(p).plan).map((text) => h('p', {}, text)));
      return;
    }
    if (p.kind === 'network') {
      const built = new Set((state.plan as NetworkPlan).built);
      const list = h('ul', { class: 'mo-linklist' });
      p.links.forEach((_, i) => {
        const box = h('input', { type: 'checkbox', 'data-testid': `list-link-${i}`, onchange: () => onLink(i) });
        box.checked = built.has(i);
        list.append(h('li', {}, h('label', {}, box, ` ${linkText(p, i)}`)));
      });
      listBody.append(list);
    } else if (p.kind === 'delivery') {
      const plan = state.plan as DeliveryPlan;
      const current = Math.max(1, plan.trips.length);
      plan.trips.forEach((trip, k) => {
        if (trip.length === 0) return;
        listBody.append(
          h('p', { class: 'mo-tripline' }, tripLine(p, trip, k + 1)),
          h('div', { class: 'mo-row' }, ...trip.map((s) => h('button', { type: 'button', 'data-testid': `list-remove-${letter(s)}`, onclick: () => onStop(s) }, t('list.remove', { name: letter(s) }))))
        );
      });
      p.stops.forEach((s, i) => {
        if (tripOf(plan, i) >= 0) return;
        listBody.append(
          h('div', { class: 'mo-row' }, h('span', {}, t('stop.label', { name: letter(i), parcels: s.parcels })),
            h('button', { type: 'button', 'data-testid': `list-add-${letter(i)}`, onclick: () => onStop(i) }, t('list.add', { n: current })))
        );
      });
    }
  };

  const build = () => {
    const p = state.problem;
    clear(diagram);
    items = [];
    container.dataset.kind = p.kind;
    if (p.kind === 'network') buildNetwork(p);
    else if (p.kind === 'delivery') buildDelivery(p);
    else buildProduction(p);
    diagram.style.display = p.kind === 'production' ? 'none' : '';
    products.hidden = p.kind !== 'production';
    items.forEach((g, i) => g.setAttribute('tabindex', i === 0 ? '0' : '-1'));
    taskEl.textContent = t(`task.${p.kind}.${state.difficulty}`);
    helpEl.textContent = t(`help.${p.kind}`);
    keysEl.textContent = t(`keys.${p.kind}`);
    legend.textContent = p.kind === 'network' ? `${t('legend.network')}${p.points.some((q) => q.junction) ? ` ${t('legend.junctions')}` : ''}` : p.kind === 'delivery' ? t('legend.delivery') : '';
    legend.hidden = p.kind === 'production';
    depotButton.hidden = p.kind !== 'delivery';
    const open = context.preferences?.get(LIST_OPEN);
    details.open = typeof open === 'boolean' ? open : false;
    builtFor = p;
  };

  const render = () => {
    if (builtFor !== state.problem) build();
    if (!state.revealed) showBest = false;
    const p = state.problem;
    if (p.kind === 'network') renderNetwork(p);
    else if (p.kind === 'delivery') renderDelivery(p);
    else renderProduction(p);
    container.dataset.phase = state.phase;
    container.dataset.view = showBest ? 'best' : 'yours';
    viewToggle.hidden = !state.revealed;
    yoursButton.setAttribute('aria-pressed', String(!showBest));
    bestButton.setAttribute('aria-pressed', String(showBest));
    bestNote.hidden = !showBest;
    bestNote.textContent = showBest ? t('view.bestNote', { value: valueText(p.kind, solve(p).score) }) : '';
    renderStatus();
    const ready = isFeasible(p, state.plan) && state.phase === 'planning';
    checkButton.setAttribute('aria-disabled', String(!ready));
    checkButton.dataset.ready = String(ready);
    undoButton.disabled = state.undo.length === 0;
    clearButton.disabled = isEmptyPlan();
    if (p.kind === 'delivery') depotButton.disabled = (state.plan as DeliveryPlan).trips.at(-1)?.length ? false : true;
    renderResult();
    renderList();
  };

  const isEmptyPlan = () => {
    const plan = state.plan;
    if ('built' in plan) return plan.built.length === 0;
    if ('trips' in plan) return plan.trips.every((trip) => trip.length === 0);
    return plan.qty.every((q) => q === 0);
  };

  /* ---------- Actions ---------- */

  /** Applies a new state; returns false when nothing changed. */
  const commit = (next: MoState, message?: string): boolean => {
    if (next === state) return false;
    state = next;
    render();
    context.requestSave();
    if (message) announce(live, message);
    return true;
  };

  /** Edits are made to the player's plan; while a best plan is shown, the first press switches back instead. */
  const editing = (): boolean => {
    if (paused) return false;
    if (showBest) {
      setView(false);
      return false;
    }
    return true;
  };

  const onLink = (i: number) => {
    if (!editing()) return render();
    const p = net();
    const was = (state.plan as NetworkPlan).built.includes(i);
    const next = toggleLink(state, i);
    const l = p.links[i]!;
    const params = { a: pointLabel(p, l.a), b: pointLabel(p, l.b), total: fmt(score(p, next.plan)) };
    commit(next, t(was ? 'announce.removed' : 'announce.built', params));
  };

  const onStop = (s: number) => {
    if (!editing()) return render();
    const p = delP();
    const was = tripOf(state.plan as DeliveryPlan, s) >= 0;
    const next = tapStop(state, s);
    const km = score(p, next.plan);
    if (was) commit(next, t('announce.stopRemoved', { name: letter(s), km }));
    else commit(next, t('announce.stopAdded', { name: letter(s), trip: tripOf(next.plan as DeliveryPlan, s) + 1, km }));
  };

  const onDepot = () => {
    if (!editing()) return;
    const next = newTrip(state);
    if (next === state) announce(live, t('announce.tripEmpty'));
    else commit(next, t('announce.newTrip', { n: (next.plan as DeliveryPlan).trips.length }));
  };

  const onQty = (i: number, delta: number) => {
    if (!editing()) return;
    const q = (state.plan as ProductionPlan).qty[i]! + delta;
    changeQty(i, q);
  };
  const changeQty = (i: number, q: number) => {
    const next = setQty(state, i, q);
    commit(next, t('announce.qty', { name: productName(prodP(), i), n: (next.plan as ProductionPlan).qty[i]!, total: fmt(score(next.problem, next.plan)) }));
  };
  const onQtyKey = (event: KeyboardEvent, i: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const q = (state.plan as ProductionPlan).qty[i]!;
    const max = prodP().products[i]!.max;
    const target: Record<string, number> = { ArrowUp: q + 1, ArrowDown: q - 1, '+': q + 1, '-': q - 1, Home: 0, End: max };
    const value = target[event.key];
    if (value === undefined) return;
    event.preventDefault();
    if (!editing()) return;
    changeQty(i, value);
  };

  const onUndo = () => {
    if (!editing()) return;
    if (commit(undo(state))) announce(live, `${t('announce.undone')} ${scoreLine()}`);
  };

  const onClear = () => {
    if (!editing()) return;
    commit(clearPlan(state), t('announce.cleared'));
  };

  const onCheck = () => {
    if (paused) return;
    if (showBest) setView(false);
    if (state.phase === 'checked') return announce(live, t('announce.checkedSame'));
    const problems = violations(state.problem, state.plan);
    if (problems.length) return announce(live, t('check.blocked', { problems: problems.map(violationText).join(' · ') }));
    const { state: next, first } = check(state);
    commit(next);
    const best = solve(next.problem).score;
    const kind = next.problem.kind;
    const yours = next.last!.score;
    const { gap } = gapOf(kind, yours, best);
    announce(live, `${t('result.yours', { value: valueText(kind, yours) })} ${t('result.best', { value: valueText(kind, best) })} ${gap === 0 ? t('result.optimal') : ''}`.trim());
    if (first) context.finished({ outcome: 'completed', stats: { score: yours, best, gap, checks: next.checks } });
  };

  const onReveal = () => {
    if (paused) return;
    if (commit(reveal(state))) {
      setView(true);
      announce(live, t('announce.revealed'));
      bestButton.focus({ preventScroll: true });
    }
  };

  function setView(best: boolean) {
    if (paused || (best && !state.revealed)) return;
    showBest = best;
    render();
  }

  /* ---------- Diagram input ---------- */

  const activate = (el: SVGGElement) => {
    if (el.dataset.link !== undefined) onLink(Number(el.dataset.link));
    else if (el.dataset.stop !== undefined) onStop(Number(el.dataset.stop));
    else if (el.dataset.depot !== undefined) onDepot();
  };

  const focusItem = (el: SVGGElement) => {
    for (const other of items) other.setAttribute('tabindex', '-1');
    el.setAttribute('tabindex', '0');
    el.focus({ preventScroll: true });
  };

  /** The road nearest to a pointer position (taps right on a town or junction pick nothing). */
  const pickLink = (event: MouseEvent): SVGGElement | null => {
    const matrix = diagram.getScreenCTM?.();
    if (!matrix || event.detail === 0 || state.problem.kind !== 'network') return null;
    const inv = matrix.inverse();
    const p: [number, number] = [inv.a * event.clientX + inv.c * event.clientY + inv.e, inv.b * event.clientX + inv.d * event.clientY + inv.f];
    const problem = state.problem;
    if (problem.points.some((q) => Math.hypot(q.x * UNIT - p[0], q.y * UNIT - p[1]) <= TOWN_R)) return null;
    let best = -1;
    let bestDistance = PICK_LINK;
    problem.links.forEach((l, i) => {
      const a = problem.points[l.a]!;
      const b = problem.points[l.b]!;
      const d = pointSegmentDistance(p, [a.x * UNIT, a.y * UNIT], [b.x * UNIT, b.y * UNIT]);
      if (d <= bestDistance) [best, bestDistance] = [i, d];
    });
    return best < 0 ? null : diagram.querySelector<SVGGElement>(`[data-link="${best}"]`);
  };

  const onDiagramClick = (event: MouseEvent) => {
    if (paused) return;
    const target = pickLink(event) ?? (event.target as Element | null)?.closest<SVGGElement>('[role="button"]') ?? null;
    if (!target || !items.includes(target)) return;
    focusItem(target);
    activate(target);
  };

  const onDiagramKey = (event: KeyboardEvent) => {
    if (paused || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = items.indexOf(event.target as SVGGElement);
    if (index < 0) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(items[index]!);
      return;
    }
    // The map is always drawn left to right (also in RTL pages), so the arrow keys follow its visual order.
    const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, ArrowRight: 1, ArrowLeft: -1, Home: -index, End: items.length - 1 - index };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    focusItem(items[(index + step + items.length) % items.length]!);
  };

  const show = (next: MoState) => {
    state = next;
    builtFor = null;
    showBest = false;
    if (!container.isConnected) root.appendChild(container);
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitial(options.seed, options.difficulty, options.settings?.problem));
    },
    restore(saved: MoState) {
      show(clone(saved));
    },
    serialize: () => clone(state),
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      show(resetState(state));
      context.requestSave();
    },
    dispose() {
      builtFor = null;
      items = [];
      clear(root);
    }
  };
}
