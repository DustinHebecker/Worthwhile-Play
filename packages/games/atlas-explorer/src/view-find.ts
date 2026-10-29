/**
 * "Find it on the map" (design § 6): place a movable marker by tap or keyboard cursor, check, then a review with the
 * distance and direction (marks plus words), the target outlined, a great-circle line and an exploring readout.
 */
import { h } from '@wp/ui';
import { type Box } from './atlas';
import { distanceKm, type Flat } from './geo';
import type { Scene } from './map-view';
import { checkFind, setMarker } from './rules';
import type { FindItem } from './state';
import { BAND_MARKS } from './ui';
import { boxAround, describePoint, exploreBox, exploreMarker, graticuleFor, unionBox } from './view-common';
import type { Host, Screen } from './view-host';

/** The point of the target nearest to (lon, lat): the city or point itself, or the nearest vertex of the outline. */
function nearestTargetPoint(host: Host, item: FindItem, lon: number, lat: number): [number, number] | null {
  const t = item.target;
  if (t.t === 'point') return [t.at[0] / 100, t.at[1] / 100];
  if (t.t === 'city') {
    const c = host.atlas.city(t.id);
    return c ? [c.lon, c.lat] : null;
  }
  const parts: readonly Flat[] = t.t === 'country' ? (host.atlas.country(t.id)?.rings ?? []) : (() => {
    const f = host.atlas.feature(t.id);
    return f ? (f.kind === 'river' ? f.lines : f.rings) : [];
  })();
  let best: [number, number] | null = null;
  let bestKm = Infinity;
  for (const r of parts)
    for (let i = 0; i < r.length; i += 2) {
      const km = distanceKm(lon, lat, r[i]!, r[i + 1]!);
      if (km < bestKm) {
        bestKm = km;
        best = [r[i]!, r[i + 1]!];
      }
    }
  return best;
}

/** The extent of a country (its home territory) or feature target, for fitting the view. */
function targetBox(host: Host, item: FindItem): Box | null {
  const t = item.target;
  if (t.t === 'country') return host.atlas.country(t.id)?.home ?? null;
  if (t.t === 'feature') return host.atlas.feature(t.id)?.box ?? null;
  return null;
}

/** The centre of a target (label point, city or point). */
export function targetCentre(host: Host, item: FindItem): [number, number] | null {
  const t = item.target;
  if (t.t === 'point') return [t.at[0] / 100, t.at[1] / 100];
  if (t.t === 'city') {
    const c = host.atlas.city(t.id);
    return c ? [c.lon, c.lat] : null;
  }
  const s = t.t === 'country' ? host.atlas.country(t.id) : host.atlas.feature(t.id);
  return s ? [s.label[0], s.label[1]] : null;
}

/** "Country: Kenya", "City: Nairobi (Kenya)", "Desert: Atacama Desert", "Point: 30° S, 120° E". */
export function findTitle(host: Host, item: FindItem): string {
  const { ui, atlas } = host;
  const t = item.target;
  if (t.t === 'country') return ui.t('find.title', { kind: ui.t('kindOf.country'), name: ui.country(t.id) });
  if (t.t === 'point') return ui.t('find.title', { kind: ui.t('kindOf.point'), name: ui.coord(t.at[0] / 100, t.at[1] / 100, 0) });
  if (t.t === 'city') {
    const c = atlas.city(t.id)!;
    const city = ui.city(t.id);
    const country = ui.country(c.country);
    const name = city === country ? city : ui.t('find.cityIn', { city, country });
    return ui.t('find.title', { kind: ui.t(c.capital ? 'kindOf.capital' : 'kindOf.city'), name });
  }
  const f = atlas.feature(t.id)!;
  return ui.t('find.title', { kind: ui.t(`kindOf.${f.kind}`), name: ui.feature(t.id) });
}

export function findScreen(host: Host, item: FindItem): Screen {
  const { ui, atlas } = host;
  const t = ui.t;
  const s = host.state();
  const d = s.difficulty;
  const target = item.target;
  const review = item.answer !== null;
  const cityCountry = target.t === 'city' ? atlas.city(target.id)?.country : undefined;
  const title = findTitle(host, item);
  const card: HTMLElement[] = [host.header(item, title)];
  // Hard: coastlines only for city and feature targets (design § 6.4).
  const borders = !(d === 'hard' && (target.t === 'city' || target.t === 'feature')) || review;
  const scene: { -readonly [K in keyof Scene]: Scene[K] } = { borders, graticule: graticuleFor(d), ariaLabel: '' };
  const markers: NonNullable<Scene['markers']>[number][] = [];
  const shapes: NonNullable<Scene['shapes']>[number][] = [];

  if (!review) {
    card.push(h('p', { class: 'ae-hint' }, t('find.instructions')));
    if (d === 'easy' && cityCountry) shapes.push({ kind: 'country', id: cityCountry, style: 'outline' });
    const status = item.draft ? t('find.marker', { coord: ui.coord(item.draft[0] / 100, item.draft[1] / 100) }) : t('find.noMarker');
    card.push(h('p', { class: 'ae-status', 'data-testid': 'ae-marker-status' }, status));
    const check = h('button', { type: 'button', class: 'ae-primary', 'data-testid': 'ae-check', 'aria-disabled': item.draft ? 'false' : 'true' }, t('action.check'));
    check.addEventListener('click', () => {
      if (host.paused()) return;
      if (!item.draft) {
        host.announce(t('find.needMarker'));
        return;
      }
      const next = checkFind(host.state(), atlas);
      const f = next.items[next.index] as FindItem;
      host.commit(next, 'ae-review-heading', verdictText(host, f));
    });
    card.push(h('div', { class: 'ae-actions ae-sticky' }, check, host.skipButton()));
    if (item.draft) markers.push({ lon: item.draft[0] / 100, lat: item.draft[1] / 100, symbol: '◆', label: t('find.yourMarker'), style: 'marker' });
    scene.ariaLabel = item.draft ? t('find.marker', { coord: ui.coord(item.draft[0] / 100, item.draft[1] / 100) }) : t('find.noMarker');
    scene.shapes = shapes;
    scene.markers = markers;
    return {
      card,
      scene,
      onPick(lon, lat) {
        if (host.paused()) return;
        host.commit(setMarker(host.state(), [Math.round(lon * 100), Math.round(lat * 100)]), null, t('find.marker', { coord: ui.coord(lon, lat) }));
      },
      fit: null
    };
  }

  // Review.
  const centre = targetCentre(host, item);
  const name = ui.place(target);
  if (target.t === 'country') shapes.push({ kind: 'country', id: target.id, style: 'target' });
  if (target.t === 'feature') shapes.push({ kind: 'feature', id: target.id, style: 'target' });
  if (target.t === 'city' && centre) markers.push({ lon: centre[0], lat: centre[1], symbol: '●', label: name, style: 'target' });
  if (target.t === 'point' && centre) markers.push({ lon: centre[0], lat: centre[1], symbol: '✚', label: name, style: 'target' });
  const labels: NonNullable<Scene['labels']>[number][] = [];
  if (target.t === 'country') {
    const c = atlas.country(target.id)!;
    labels.push({ lon: c.label[0], lat: c.label[1] + 1.5, text: name });
    for (const n of c.nb) {
      const nc = atlas.country(n);
      if (nc) labels.push({ lon: nc.label[0], lat: nc.label[1], text: ui.country(n) });
    }
  } else if (target.t === 'feature' && centre) labels.push({ lon: centre[0], lat: centre[1], text: name });
  const lines: string[] = [];
  let fit: Box | null = null;
  const verdict = h('p', { class: 'ae-verdict', 'data-testid': 'ae-verdict', 'data-band': item.band ?? 'skip' }, verdictText(host, item));
  card.push(ui.heading('h3', 'ae-review-heading', t('review.heading')), verdict);
  if (Array.isArray(item.answer)) {
    const [mlon, mlat] = [item.answer[0] / 100, item.answer[1] / 100];
    markers.push({ lon: mlon, lat: mlat, symbol: '◆', label: t('find.yourMarker'), style: 'marker' });
    const near = item.km !== null && item.km > 0 ? nearestTargetPoint(host, item, mlon, mlat) : null;
    if (near && item.km !== null) {
      scene.arcs = [{ from: [mlon, mlat], to: near, label: ui.km(item.km), style: 'dashed' }];
      lines.push(t(target.t === 'country' || target.t === 'feature' ? 'find.awayEdge' : 'find.away', { offset: ui.distanceAndDirection(near[0], near[1], mlon, mlat, d === 'easy' ? 8 : 16) }));
      const dateLine = ui.dateLine(near[0], mlon);
      if (dateLine) lines.push(dateLine);
    }
    const box = centre ? boxAround([[mlon, mlat], centre], 6) : boxAround([[mlon, mlat]], 10);
    const area = targetBox(host, item);
    fit = area ? unionBox(box, [area[0] - 2, area[1] - 2, area[2] + 2, area[3] + 2]) : box;
  } else if (centre) {
    const area = targetBox(host, item);
    fit = area ? [area[0] - 4, area[1] - 4, area[2] + 4, area[3] + 4] : boxAround([centre], 15);
  }
  if (centre && (target.t === 'city' || target.t === 'point')) lines.push(t('find.at', { name, coord: ui.coord(centre[0], centre[1]) }));
  if (centre && target.t === 'country') lines.push(t('find.centre', { coord: ui.coord(centre[0], centre[1]) }));
  for (const line of lines) card.push(h('p', { 'data-testid': 'ae-review-line' }, line));
  const insight = target.t === 'point' ? undefined : ui.insight(target.id);
  if (insight) card.push(h('p', { class: 'ae-insight', 'data-testid': 'ae-insight' }, insight));
  card.push(exploreBox(host, name, centre), h('div', { class: 'ae-actions ae-sticky' }, host.nextButton()));
  markers.push(...exploreMarker(host));
  scene.shapes = shapes;
  scene.markers = markers;
  scene.labels = labels;
  scene.ariaLabel = Array.isArray(item.answer) && item.km !== null ? t('find.mapReview', { name, km: ui.km(item.km) }) : name;
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

/** The verdict sentence: marks plus words, never colour alone. */
export function verdictText(host: Host, item: FindItem): string {
  const { t } = host.ui;
  if (item.answer === 'skip' || item.band === null) return t('find.skipped');
  return `${BAND_MARKS[item.band]} ${t(`band.${item.band}`)}`;
}

/** The keyboard cursor's description during a find question: coordinates, place and the nearest other city. */
export function findDescribe(host: Host, item: FindItem, lon: number, lat: number): string {
  const t = item.target;
  const skipCity = t.t === 'city' ? t.id : undefined;
  const skipCountry = t.t === 'country' ? t.id : t.t === 'city' ? host.atlas.city(t.id)?.country : undefined;
  return describePoint(host.ui, host.atlas, lon, lat, item.answer === null ? { ...(skipCity ? { skipCity } : {}), ...(skipCountry ? { skipCountry } : {}) } : undefined);
}
