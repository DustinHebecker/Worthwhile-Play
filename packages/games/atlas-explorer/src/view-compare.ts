/**
 * "Compare places" (design § 7): two or three places marked ● ■ ▲ on the map and in the options, radio buttons, Check;
 * the review draws the explanation on the map (latitude lines, meridians, great circles, outlines) and says it in
 * sentences. Options carry no correctness attribute before the review.
 */
import { h } from '@wp/ui';
import type { Box, City, Country } from './atlas';
import { lonDelta } from './compare';
import { DECLINATION, dayLengthHours, distanceKm, mercatorFactor } from './geo';
import type { LineId, Scene } from './map-view';
import { checkCompare, chooseOption } from './rules';
import type { CompareItem } from './state';
import { PLACE_SYMBOLS } from './ui';
import { boxAround, exploreBox, exploreMarker } from './view-common';
import type { Host, Screen } from './view-host';

const COUNTRY_TEMPLATES = new Set(['larger', 'people', 'density']);

/** The question sentence. */
export function compareQuestion(host: Host, item: CompareItem): string {
  const { ui } = host;
  const t = ui.t;
  const [a, b] = item.places;
  const city = (id: string | undefined) => (id ? ui.city(id) : '');
  switch (item.template) {
    case 'closer':
      return t('compare.closer', { a: city(a) });
    case 'daylight':
      return t(`compare.daylight.${item.param === 12 ? 12 : 6}`);
    case 'midnight':
      return t('compare.midnight', { a: city(a) });
    case 'season':
      return t('compare.season', { a: city(a) });
    case 'suntime':
      return t('compare.suntime', { a: city(a), b: city(b) });
    case 'clock':
      return t('compare.clock', { a: city(a), b: city(b), time: ui.clock(12 * 60) });
    default:
      return t(`compare.${item.template}`);
  }
}

/** The label of one option. */
export function optionLabel(host: Host, item: CompareItem, id: string): string {
  const { ui } = host;
  if (id === 'yes' || id === 'no' || id === 'summer' || id === 'winter') return ui.t(`answer.${id}`);
  const hours = /^h(-?\d+)$/.exec(id);
  if (hours) return ui.clock(12 * 60 + Number(hours[1]) * 60);
  if (COUNTRY_TEMPLATES.has(item.template)) return ui.country(id);
  const c = host.atlas.city(id);
  const name = ui.city(id);
  const country = c ? ui.country(c.country) : '';
  return c && country !== name ? ui.t('find.cityIn', { city: name, country }) : name;
}

const symbolOf = (item: CompareItem, id: string) => {
  const i = item.places.indexOf(id);
  return i >= 0 ? (PLACE_SYMBOLS[i] ?? '') : '';
};

export function compareScreen(host: Host, item: CompareItem): Screen {
  const { ui, atlas } = host;
  const t = ui.t;
  const s = host.state();
  const review = item.answer !== null;
  const question = compareQuestion(host, item);
  const card: HTMLElement[] = [host.header(item, question)];
  const countries = COUNTRY_TEMPLATES.has(item.template);
  const placesCity = countries ? [] : item.places.map((id) => atlas.city(id)).filter((c): c is City => c !== undefined);
  const placesCountry = countries ? item.places.map((id) => atlas.country(id)).filter((c): c is Country => c !== undefined) : [];

  // The places on the map: symbols and names (the places a question names may be labelled).
  const markers: NonNullable<Scene['markers']>[number][] = [];
  const shapes: NonNullable<Scene['shapes']>[number][] = [];
  item.places.forEach((id, i) => {
    const sym = PLACE_SYMBOLS[i] ?? '';
    if (countries) {
      const c = atlas.country(id);
      if (!c) return;
      shapes.push({ kind: 'country', id, style: 'place' });
      markers.push({ lon: c.label[0], lat: c.label[1], symbol: sym, label: ui.country(id), style: 'place' });
    } else {
      const c = atlas.city(id);
      if (c) markers.push({ lon: c.lon, lat: c.lat, symbol: sym, label: ui.city(id), style: 'place' });
    }
  });
  // Countries: their home territory (overseas parts such as Bouvet Island would zoom the view out to the whole world).
  const pts: [number, number][] = countries ? placesCountry.flatMap((c) => [[c.home[0], c.home[1]] as [number, number], [c.home[2], c.home[3]] as [number, number]]) : placesCity.map((c) => [c.lon, c.lat]);
  const fitBox: Box = boxAround(pts, countries ? 3 : 12);
  const scene: { -readonly [K in keyof Scene]: Scene[K] } = {
    borders: true,
    // On easy the graticule is the tool (no labels before the answer).
    graticule: s.difficulty === 'easy' ? { step: 30, labels: review ? 'all' : 'none' } : null,
    ariaLabel: item.places.map((id, i) => `${PLACE_SYMBOLS[i]} ${countries ? ui.country(id) : ui.city(id)}`).join(', '),
    shapes,
    markers
  };

  const fieldset = h('fieldset', { class: 'ae-options', 'data-testid': 'ae-options' }, h('legend', { class: 'ae-legend' }, t('compare.choose')));
  item.options.forEach((id, i) => {
    const input = h('input', { type: 'radio', name: 'ae-option', value: String(i), id: `ae-opt-${i}`, 'data-testid': `ae-opt-${i}` });
    input.checked = (review ? item.answer : item.draft) === i;
    if (review) input.disabled = true;
    input.addEventListener('change', () => !host.paused() && host.commit(chooseOption(host.state(), i), `ae-opt-${i}`));
    const sym = symbolOf(item, id);
    fieldset.append(h('label', { class: 'ae-option', for: `ae-opt-${i}` }, input, sym ? h('span', { class: 'ae-sym', 'aria-hidden': 'true' }, sym) : '', ' ', ui.bdi(optionLabel(host, item, id))));
  });
  card.push(fieldset);

  if (!review) {
    const check = h('button', { type: 'button', class: 'ae-primary', 'data-testid': 'ae-check', 'aria-disabled': item.draft === null ? 'true' : 'false' }, t('action.check'));
    check.addEventListener('click', () => {
      if (host.paused()) return;
      if (item.draft === null) {
        host.announce(t('compare.needChoice'));
        return;
      }
      host.commit(checkCompare(host.state()), 'ae-review-heading', compareVerdict(host, { ...item, answer: item.draft }));
    });
    card.push(h('div', { class: 'ae-actions ae-sticky' }, check, host.skipButton()));
    return { card, scene, fit: fitBox, onPick: () => undefined };
  }

  // Review: verdict, explanation on the map and in words.
  const verdict = h('p', { class: 'ae-verdict', 'data-testid': 'ae-verdict', 'data-match': item.answer === item.correct ? 'yes' : item.answer === 'skip' ? 'skip' : 'no' }, compareVerdict(host, item));
  const explain = explanation(host, item, placesCity, placesCountry, scene);
  card.push(ui.heading('h3', 'ae-review-heading', t('review.heading')), verdict, ...explain.map((line) => h('p', { 'data-testid': 'ae-explain' }, line)));
  const centre = countries ? (placesCountry[0] ? placesCountry[0].label : null) : placesCity[0] ? ([placesCity[0].lon, placesCity[0].lat] as const) : null;
  card.push(exploreBox(host, centre ? (countries ? ui.country(item.places[0]!) : ui.city(item.places[0]!)) : '', centre), h('div', { class: 'ae-actions ae-sticky' }, host.nextButton()));
  scene.markers = [...markers, ...exploreMarker(host)];
  return {
    card,
    scene,
    fit: fitBox,
    onPick(lon, lat) {
      host.setExplored([lon, lat]);
      host.refresh();
    }
  };
}

export function compareVerdict(host: Host, item: CompareItem): string {
  const { t } = host.ui;
  const right = optionLabel(host, item, item.options[item.correct]!);
  if (item.answer === 'skip') return t('compare.skipped', { answer: right });
  return item.answer === item.correct ? t('compare.match') : t('compare.other', { answer: right });
}

/** The explanation sentences of a review; adds the matching lines to the scene (design § 7.2). */
function explanation(host: Host, item: CompareItem, cities: City[], countries: Country[], scene: { -readonly [K in keyof Scene]: Scene[K] }): string[] {
  const { ui } = host;
  const t = ui.t;
  const [a, b, c] = cities;
  const name = (x: City | undefined) => (x ? ui.city(x.id) : '');
  const lines: string[] = [];
  const special: LineId[] = [];
  switch (item.template) {
    case 'north':
    case 'south':
      if (a && b) {
        scene.parallels = [a, b].map((x) => ({ lat: x.lat, label: `${symbolOf(item, x.id)} ${ui.lat(x.lat)}` }));
        lines.push(t('explain.lat', { a: name(a), la: ui.lat(a.lat), b: name(b), lb: ui.lat(b.lat) }));
      }
      break;
    case 'east':
    case 'west':
      if (a && b) {
        scene.meridians = [a, b].map((x) => ({ lon: x.lon, label: `${symbolOf(item, x.id)} ${ui.lon(x.lon)}` }));
        lines.push(t('explain.lon', { a: name(a), la: ui.lon(a.lon), b: name(b), lb: ui.lon(b.lon) }));
      }
      break;
    case 'closer':
      if (a && b && c) {
        const kb = distanceKm(a.lon, a.lat, b.lon, b.lat);
        const kc = distanceKm(a.lon, a.lat, c.lon, c.lat);
        scene.arcs = [
          { from: [a.lon, a.lat], to: [b.lon, b.lat], label: ui.km(kb), style: 'solid' },
          { from: [a.lon, a.lat], to: [c.lon, c.lat], label: ui.km(kc), style: 'solid' }
        ];
        lines.push(t('explain.closer', { a: name(a), b: name(b), kb: ui.km(kb), c: name(c), kc: ui.km(kc) }), t('explain.curved'));
      }
      break;
    case 'larger': {
      const [p, q] = countries;
      if (p && q) {
        lines.push(t('explain.area', { a: ui.country(p.id), aa: ui.area(p.areaCore), b: ui.country(q.id), ab: ui.area(q.areaCore) }), t('explain.equalArea'));
        if (p.areaMax !== p.areaCore || q.areaMax !== q.areaCore) lines.push(t('explain.areaHatched'));
        if (host.state().difficulty === 'hard') {
          // How much a Mercator map would exaggerate the country further from the Equator.
          const far = Math.abs(p.label[1]) > Math.abs(q.label[1]) ? p : q;
          const near = far === p ? q : p;
          if (Math.abs(far.label[1]) >= 50 && Math.abs(near.label[1]) <= 25) lines.push(t('explain.mercator', { name: ui.country(far.id), f: ui.int(Math.round(mercatorFactor(far.label[1]))) }));
        }
      }
      break;
    }
    case 'people': {
      const [p, q] = countries;
      if (p && q) lines.push(t('explain.people', { a: ui.country(p.id), pa: ui.pop(p.pop), b: ui.country(q.id), pb: ui.pop(q.pop), year: ui.int(p.popYear) }));
      break;
    }
    case 'density': {
      const [p, q] = countries;
      if (p && q) lines.push(t('explain.density', { a: ui.country(p.id), da: ui.density(p.pop / p.areaCore), b: ui.country(q.id), db: ui.density(q.pop / q.areaCore) }));
      break;
    }
    case 'daylight':
      if (a && b) {
        const month = item.param === 12 ? 12 : 6;
        const len = (x: City) => {
          const hours = dayLengthHours(x.lat, month);
          return hours >= 24 ? t('explain.noSet') : hours <= 0 ? t('explain.noRise') : ui.dur(hours);
        };
        scene.parallels = [a, b].map((x) => ({ lat: x.lat, label: `${symbolOf(item, x.id)} ${ui.lat(x.lat)}` }));
        special.push('equator', month === 6 ? 'cancer' : 'capricorn');
        lines.push(t(`explain.daylight.${month}`, { a: name(a), ha: len(a), b: name(b), hb: len(b) }), t(`explain.tilt.${month}`));
      }
      break;
    case 'midnight':
      if (a) {
        special.push('arctic');
        lines.push(t(a.lat >= 66 ? 'explain.midnight.no' : 'explain.midnight.yes', { a: name(a), lat: ui.lat(a.lat) }));
      }
      break;
    case 'season':
      if (a) {
        special.push('equator');
        lines.push(t(a.lat > 0 ? 'explain.season.n' : 'explain.season.s', { a: name(a), lat: ui.lat(a.lat) }));
      }
      break;
    case 'tropics': {
      special.push('cancer', 'capricorn', 'equator');
      scene.parallels = cities.map((x) => ({ lat: x.lat, label: `${symbolOf(item, x.id)} ${ui.lat(x.lat)}` }));
      const tropical = cities.find((x) => Math.abs(x.lat) <= DECLINATION);
      lines.push(t('explain.tropics', { lat: ui.dec(DECLINATION) }));
      if (tropical) lines.push(t('explain.inTropics', { a: name(tropical), lat: ui.lat(tropical.lat) }));
      break;
    }
    case 'suntime':
      if (a && b) {
        const dl = lonDelta(a.lon, b.lon);
        scene.meridians = [a, b].map((x) => ({ lon: x.lon, label: `${symbolOf(item, x.id)} ${ui.lon(x.lon)}` }));
        lines.push(t(dl > 0 ? 'explain.suntime.later' : 'explain.suntime.earlier', { a: name(a), b: name(b), deg: ui.int(Math.round(Math.abs(dl))), h: ui.dur(Math.round(Math.abs(dl) / 15)) }));
      }
      break;
    case 'clock':
      if (a && b) {
        scene.meridians = [a, b].map((x) => ({ lon: x.lon, label: `${symbolOf(item, x.id)} ${ui.lon(x.lon)}` }));
        lines.push(t('explain.clock', { a: name(a), oa: ui.utc(a.tz), b: name(b), ob: ui.utc(b.tz) }));
        const sun = Math.round(lonDelta(a.lon, b.lon) / 15);
        if (sun * 60 !== b.tz - a.tz) lines.push(t('explain.clockSun', { h: ui.dur(Math.abs(sun)) }));
      }
      break;
  }
  if (special.length) scene.lines = special;
  return lines;
}
