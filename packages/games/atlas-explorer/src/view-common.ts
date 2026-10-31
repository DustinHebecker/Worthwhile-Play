/**
 * Pieces shared by the per-kind screens: region views, what lies under a point, the exploring readout of reviews and
 * the keyboard cursor's announcement.
 */
import { h } from '@wp/ui';
import { nearestCity, placeAt, type Atlas, type Box } from './atlas';
import type { Area, Difficulty } from './compare';
import { distanceKm } from './geo';
import type { Scene } from './map-view';
import type { Host } from './view-host';
import type { Ui } from './ui';

/** The initial view of each region (lon/lat box). */
export const REGION_BOX: Readonly<Record<Area, Box>> = {
  world: [-180, -60, 180, 84],
  africa: [-20, -36, 53, 38],
  americas: [-170, -56, -30, 74],
  asia: [25, -11, 150, 56],
  europe: [-25, 34, 45, 71],
  oceania: [110, -48, 180, 5]
};

/** The graticule of a difficulty (design § 6.4). */
export function graticuleFor(d: Difficulty): Scene['graticule'] {
  return { step: 30, labels: d === 'hard' ? 'equator' : 'all' };
}

/** The name of what lies under a point (a country, another unit, a hatched area or the sea). */
export function placeName(ui: Ui, atlas: Atlas, lon: number, lat: number): string {
  const p = placeAt(atlas, lon, lat);
  if (!p) return ui.t('place.sea');
  if (p.kind === 'disputed') return ui.t('place.disputed');
  if (p.kind === 'country') return ui.country(p.id);
  return ui.other(p.id);
}

/**
 * The keyboard cursor's announcement (design § 14.3): coordinates and what lies there; during questions with
 * `nearest`, the nearest listed city that is not the answer.
 */
export function describePoint(ui: Ui, atlas: Atlas, lon: number, lat: number, nearest?: { skipCity?: string; skipCountry?: string }): string {
  const base = ui.t('map.cursor', { coord: ui.coord(lon, lat, 0), place: placeName(ui, atlas, lon, lat) });
  if (!nearest) return base;
  const n = nearestCity(atlas, lon, lat, (c) => c.id === nearest.skipCity || c.country === nearest.skipCountry);
  if (!n) return base;
  const dateLine = ui.dateLine(n.city.lon, lon);
  return `${base} · ${ui.t('map.nearest', { city: ui.city(n.city.id), offset: ui.distanceAndDirection(n.city.lon, n.city.lat, lon, lat) })}${dateLine ? ` · ${dateLine}` : ''}`;
}

/** The exploring readout of a review: name, latitude and distance from the answer of the last picked point. */
export function exploreBox(host: Host, targetName: string, target: readonly [number, number] | null): HTMLElement {
  const { ui, atlas } = host;
  const p = host.explored();
  const box = h('div', { class: 'ae-explore', 'data-testid': 'ae-explore' }, h('p', { class: 'ae-muted' }, ui.t('explore.hint', { name: targetName })));
  if (p) {
    const parts = [placeName(ui, atlas, p[0], p[1]), ui.lat(p[1], 0)];
    if (target) parts.push(ui.t('explore.from', { km: ui.km(distanceKm(p[0], p[1], target[0], target[1])), name: targetName }));
    box.append(h('p', { 'data-testid': 'ae-explore-info', 'aria-live': 'polite' }, parts.join(' · ')));
  }
  return box;
}

/** The marker of an explored point, added to a review scene. */
export function exploreMarker(host: Host): NonNullable<Scene['markers']>[number][] {
  const p = host.explored();
  return p ? [{ lon: p[0], lat: p[1], symbol: '✚', style: 'pick' }] : [];
}

/** A lon/lat box around points, padded (degrees). */
export function boxAround(points: readonly (readonly [number, number])[], pad = 4): Box {
  let a = Infinity;
  let b = Infinity;
  let c = -Infinity;
  let d = -Infinity;
  for (const [x, y] of points) {
    a = Math.min(a, x);
    c = Math.max(c, x);
    b = Math.min(b, y);
    d = Math.max(d, y);
  }
  // Points on both sides of the antimeridian: show the whole width.
  if (c - a > 180) {
    a = -180;
    c = 180;
  }
  return [Math.max(-180, a - pad), Math.max(-85, b - pad), Math.min(180, c + pad), Math.min(85, d + pad)];
}

/** Merges two boxes. */
export const unionBox = (p: Box, q: Box): Box => (q[2] - q[0] > 300 || p[2] - p[0] > 300 ? [-180, Math.min(p[1], q[1]), 180, Math.max(p[3], q[3])] : [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[2], q[2]), Math.max(p[3], q[3])]);
