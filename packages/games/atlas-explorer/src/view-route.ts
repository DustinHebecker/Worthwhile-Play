/**
 * "Overland route" (design § 9): the current country outlined, its neighbours patterned on the map and listed as
 * buttons (sorted with `Intl.Collator`), the path drawn with numbered steps, Back and "Show a shortest route"; the
 * review compares with a shortest route. Playable without the map.
 */
import { bcp47Tag } from '@wp/game-core';
import { h } from '@wp/ui';
import { countryAt, type Box } from './atlas';
import type { Scene } from './map-view';
import { back, showRoute, step } from './rules';
import { graphOf, shortestRoute } from './route';
import type { RouteItem } from './state';
import { boxAround, exploreBox, exploreMarker } from './view-common';
import { pickPopup } from './view-mystery';
import type { Host, Screen } from './view-host';

export function routeScreen(host: Host, item: RouteItem): Screen {
  const { ui, atlas } = host;
  const t = ui.t;
  const s = host.state();
  const review = item.end !== null;
  const from = ui.country(item.from);
  const to = ui.country(item.to);
  const card: HTMLElement[] = [host.header(item, t('route.title', { from, to }))];
  card.push(h('p', {}, t('route.task', { from, to })), h('p', { class: 'ae-muted' }, t('route.rule')));
  if (s.region === 'oceania') card.push(h('p', { class: 'ae-muted', 'data-testid': 'ae-worldwide' }, t('route.worldwide')));
  const here = item.path[item.path.length - 1]!;
  const hereC = atlas.country(here)!;
  const goal = atlas.country(item.to)!;
  const pathPts = item.path.map((id) => atlas.country(id)!.label);
  const shapes: NonNullable<Scene['shapes']>[number][] = [{ kind: 'country', id: item.to, style: 'target' }];
  const markers: NonNullable<Scene['markers']>[number][] = [
    { lon: atlas.country(item.from)!.label[0], lat: atlas.country(item.from)!.label[1], symbol: '●', label: from, style: 'place' },
    { lon: goal.label[0], lat: goal.label[1], symbol: '▲', label: to, style: 'place' }
  ];
  const scene: { -readonly [K in keyof Scene]: Scene[K] } = { borders: true, graticule: null, ariaLabel: '', shapes, markers };
  const pathList = h('ol', { class: 'ae-path', 'data-testid': 'ae-path' }, ...item.path.map((id) => h('li', {}, ui.bdi(ui.country(id)))));
  card.push(h('h3', { class: 'ae-sub' }, t('route.path')), pathList, h('p', { 'data-testid': 'ae-crossed' }, t('route.crossed', { n: ui.int(item.path.length - 1) })));

  if (!review) {
    shapes.push({ kind: 'country', id: here, style: 'current' });
    const collator = new Intl.Collator(bcp47Tag(ui.locale));
    const nbs = [...(graphOf(atlas).get(here) ?? [])].sort((a, b) => collator.compare(ui.country(a), ui.country(b)));
    for (const n of nbs) if (!item.path.includes(n)) shapes.push({ kind: 'country', id: n, style: 'neighbour' });
    card.push(h('p', { id: 'ae-here', tabindex: -1, 'data-testid': 'ae-here' }, t('route.here', { name: ui.country(here) })));
    if (s.difficulty === 'easy') card.push(h('p', { class: 'ae-muted', 'data-testid': 'ae-compass' }, t('route.compass', { to, dir: ui.direction(hereC.label[0], hereC.label[1], goal.label[0], goal.label[1], 8) })));
    const buttons = h('div', { class: 'ae-neighbours', role: 'group', 'aria-label': t('route.neighbours'), 'data-testid': 'ae-neighbours' });
    for (const n of nbs) {
      const visited = item.path.includes(n);
      const b = h('button', { type: 'button', class: 'ae-secondary ae-nb', 'data-testid': `ae-nb-${n}`, 'aria-disabled': visited ? 'true' : 'false' }, ui.bdi(ui.country(n)), visited ? h('span', { class: 'ae-visited' }, ` (${t('route.visitedShort')})`) : '');
      b.addEventListener('click', () => go(host, n));
      buttons.append(b);
    }
    card.push(h('h3', { class: 'ae-sub' }, t('route.neighbours')), buttons);
    const backBtn = h('button', { type: 'button', class: 'ae-secondary', 'data-testid': 'ae-back', 'aria-disabled': item.path.length > 1 ? 'false' : 'true' }, t('route.back'));
    backBtn.addEventListener('click', () => !host.paused() && item.path.length > 1 && host.commit(back(host.state()), 'ae-back', t('route.here', { name: ui.country(item.path[item.path.length - 2]!) })));
    const show = h('button', { type: 'button', class: 'ae-secondary', 'data-testid': 'ae-skip' }, t('route.show'));
    show.addEventListener('click', () => !host.paused() && host.commit(showRoute(host.state()), 'ae-review-heading', t('route.shown')));
    card.push(h('div', { class: 'ae-actions ae-sticky' }, backBtn, show));
    scene.polylines = [{ pts: pathPts, style: 'route', numbers: true }];
    scene.ariaLabel = t('route.here', { name: ui.country(here) });
    const fit: Box = boxAround([[hereC.box[0], hereC.box[1]], [hereC.box[2], hereC.box[3]], goal.label, atlas.country(item.from)!.label], 3);
    return {
      card,
      scene,
      fit,
      onPick(lon, lat, _via, client) {
        if (host.paused()) return;
        const id = countryAt(atlas, lon, lat);
        if (id) return go(host, id);
        const near = client ? host.map.dotsNear(client, 22).filter((x) => nbs.includes(x)) : [];
        if (near.length === 1) return go(host, near[0]!);
        if (near.length > 1) return pickPopup(host, near, (x) => go(host, x));
      }
    };
  }

  // Review.
  const best = shortestRoute(graphOf(atlas), item.from, item.to);
  const crossed = item.path.length - 1;
  card.push(ui.heading('h3', 'ae-review-heading', t('review.heading')));
  if (item.end === 'arrived') {
    card.push(h('p', { class: 'ae-verdict', 'data-testid': 'ae-verdict', 'data-shortest': crossed === item.best ? 'yes' : 'no' }, t('route.arrived', { n: ui.int(crossed) })));
    if (crossed === item.best) card.push(h('p', { 'data-testid': 'ae-shortest' }, t('route.shortestYes')));
  } else card.push(h('p', { class: 'ae-verdict', 'data-testid': 'ae-verdict' }, t('route.shown')));
  card.push(h('p', {}, t('route.best', { best: ui.int(item.best), ways: ui.int(item.ways) })));
  if (best) card.push(h('p', { 'data-testid': 'ae-best-route' }, t('route.one', { path: best.map((id) => ui.country(id)).join(' → ') })));
  card.push(exploreBox(host, to, goal.label), h('div', { class: 'ae-actions ae-sticky' }, host.nextButton()));
  scene.polylines = [...(best ? [{ pts: best.map((id) => atlas.country(id)!.label), style: 'best' as const }] : []), { pts: pathPts, style: 'route', numbers: true }];
  for (const id of best ?? []) if (id !== item.from && id !== item.to) markers.push({ lon: atlas.country(id)!.label[0], lat: atlas.country(id)!.label[1], symbol: '·', label: ui.country(id), style: 'place' });
  scene.markers = [...markers, ...exploreMarker(host)];
  scene.ariaLabel = t('route.best', { best: ui.int(item.best), ways: ui.int(item.ways) });
  const fit = boxAround([...pathPts, ...(best ?? []).map((id) => atlas.country(id)!.label)], 4);
  return {
    card,
    scene,
    fit,
    onPick(lon, lat) {
      host.setExplored([lon, lat]);
      host.refresh();
    }
  };
}

function go(host: Host, id: string): void {
  const { ui, atlas } = host;
  const t = ui.t;
  if (host.paused()) return;
  const st = host.state();
  const item = st.items[st.index] as RouteItem;
  const here = item.path[item.path.length - 1]!;
  if (item.path.includes(id)) return host.announce(t('route.visited', { name: ui.country(id) }));
  if (!(graphOf(atlas).get(here) ?? []).includes(id)) return host.announce(t('route.notNeighbour', { name: ui.country(id), here: ui.country(here) }));
  const next = step(st, id, atlas);
  const arrived = (next.items[next.index] as RouteItem).end === 'arrived';
  host.commit(next, arrived ? 'ae-review-heading' : 'ae-here', arrived ? t('route.arrived', { n: ui.int(item.path.length) }) : t('route.here', { name: ui.country(id) }));
}
