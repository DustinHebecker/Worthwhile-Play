/**
 * "Mystery country" (design § 8): clues one at a time, unlimited guesses by tapping a country or with the country
 * search (an ARIA 1.2 combobox filtered with `Intl.Collator`), feedback cards with distance and direction between the
 * centres, and a review that checks every clue against the target. Playable without the map.
 */
import { bcp47Tag } from '@wp/game-core';
import { h } from '@wp/ui';
import { countryAt, placeAt, type Box } from './atlas';
import { capitalOf, type Clue } from './clues';
import type { LineId, Scene } from './map-view';
import { guess, nextClue, setGuessDraft, showMystery } from './rules';
import type { MysteryItem } from './state';
import { boxAround, describePoint, exploreBox, exploreMarker } from './view-common';
import type { Host, Screen } from './view-host';

/** The sentence of one clue; `mostly`: the target lies mostly in its region (transcontinental, design § 8.2). */
export function clueText(host: Host, clue: Clue, mostly = false): string {
  const { ui } = host;
  const t = ui.t;
  const { id, arg } = clue;
  switch (id) {
    case 'region':
      return t(mostly ? `clue.regionMostly.${arg}` : `clue.region.${arg}`);
    case 'sub':
      return t('clue.sub', { sub: ui.sub(arg) });
    case 'ns':
    case 'ew':
    case 'coast':
      return t(`clue.${id}.${arg}`);
    case 'line':
      return t(`clue.line.${arg}`);
    case 'island':
      return t('clue.island');
    case 'nbCount':
      return arg === '0' ? t('clue.nbNone') : t('clue.nbCount', { n: ui.int(Number(arg)) });
    case 'nb':
      return t('clue.nb', { name: ui.country(arg) });
    case 'area':
    case 'people': {
      const [dir, ref] = arg.split(':');
      return t(`clue.${id}.${dir}`, { name: ui.country(ref ?? '') });
    }
    case 'river':
    case 'range':
    case 'desert':
      return t(`clue.${id}`, { name: ui.feature(arg) });
    case 'capital': {
      const [dir, ref] = arg.split(':');
      return t(`clue.capital.${dir}`, { city: ui.city(ref ?? '') });
    }
  }
}

/** Lines of the map that illustrate the clues in a review. */
function clueLines(clues: readonly Clue[]): LineId[] {
  const out = new Set<LineId>();
  for (const k of clues) {
    if (k.id === 'ns') out.add('equator');
    if (k.id === 'ew') out.add('meridian');
    if (k.id === 'line') out.add(k.arg as LineId);
  }
  return [...out];
}

/** Matches with the UI language's collation: accent- and case-insensitive, at any position. */
export function matches(collator: Intl.Collator, name: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  for (let i = 0; i + q.length <= name.length; i++) if (collator.compare(name.slice(i, i + q.length), q) === 0) return true;
  return false;
}

/** Per-item view state of the search box (not saved: typing is not a game action). */
const searches = new WeakMap<Host, { index: number; query: string }>();

export function mysteryScreen(host: Host, item: MysteryItem): Screen {
  const { ui, atlas } = host;
  const t = ui.t;
  const s = host.state();
  const review = item.end !== null;
  const card: HTMLElement[] = [host.header(item, t('mystery.title'))];
  const target = atlas.country(item.target)!;
  const shapes: NonNullable<Scene['shapes']>[number][] = item.guesses.map((g) => ({ kind: 'country' as const, id: g, style: 'guess' as const }));
  const labels: NonNullable<Scene['labels']>[number][] = item.guesses.map((g) => {
    const c = atlas.country(g)!;
    return { lon: c.label[0], lat: c.label[1], text: ui.country(g) };
  });
  const arcs: NonNullable<Scene['arcs']>[number][] = [];
  const scene: { -readonly [K in keyof Scene]: Scene[K] } = { borders: true, graticule: { step: 30, labels: 'all' }, ariaLabel: '', shapes, labels, arcs };

  // Clues.
  const clues = h('ol', { class: 'ae-clues', 'data-testid': 'ae-clues' });
  item.clues.slice(0, review ? item.clues.length : item.shown).forEach((k, i) => clues.append(h('li', { 'data-testid': `ae-clue-${i}` }, clueText(host, k, target.mostly), review ? h('span', { class: 'ae-check-mark' }, ' ✓') : '')));
  card.push(h('h3', { class: 'ae-sub' }, t('mystery.clues')), clues);

  if (!review) {
    card.push(h('p', { class: 'ae-muted', 'data-testid': 'ae-clue-count' }, t('mystery.shown', { n: ui.int(item.shown), total: ui.int(item.clues.length) })));
    if (item.shown < item.clues.length) {
      const more = h('button', { type: 'button', class: 'ae-secondary', 'data-testid': 'ae-next-clue' }, t('mystery.nextClue'));
      more.addEventListener('click', () => !host.paused() && host.commit(nextClue(host.state()), 'ae-next-clue', clueText(host, item.clues[item.shown]!, target.mostly)));
      card.push(more);
    }
    card.push(...guessControls(host, item));
  } else {
    card.push(ui.heading('h3', 'ae-review-heading', t('review.heading')));
    const found = item.end === 'solved';
    card.push(
      h('p', { class: 'ae-verdict', 'data-testid': 'ae-verdict', 'data-solved': found ? 'yes' : 'no' }, t(found ? 'mystery.solved' : 'mystery.was', { name: ui.country(item.target) })),
      h('p', {}, t('mystery.used', { c: ui.int(item.shown), g: ui.int(item.guesses.length) }))
    );
    const insight = ui.insight(item.target);
    if (insight) card.push(h('p', { class: 'ae-insight' }, insight));
    card.push(exploreBox(host, ui.country(item.target), target.label), h('div', { class: 'ae-actions ae-sticky' }, host.nextButton()));
    shapes.push({ kind: 'country', id: item.target, style: 'target' });
    labels.push({ lon: target.label[0], lat: target.label[1] + 1.5, text: ui.country(item.target) });
    for (const k of item.clues) {
      if (k.id === 'nb') {
        const n = atlas.country(k.arg);
        if (n) labels.push({ lon: n.label[0], lat: n.label[1], text: ui.country(k.arg) });
      }
      if (k.id === 'river' || k.id === 'range' || k.id === 'desert') shapes.push({ kind: 'feature', id: k.arg, style: 'feature' });
    }
    const cap = capitalOf(atlas, item.target);
    if (cap && item.clues.some((k) => k.id === 'capital')) {
      const ref = atlas.city(item.clues.find((k) => k.id === 'capital')!.arg.split(':')[1] ?? '');
      scene.parallels = [cap, ...(ref ? [ref] : [])].map((c) => ({ lat: c.lat, label: `${ui.city(c.id)} ${ui.lat(c.lat)}` }));
    }
    scene.lines = clueLines(item.clues);
    scene.markers = exploreMarker(host);
  }

  // Guess cards, newest first (on the map: the guess outlined, an arrow towards the target).
  if (item.guesses.length) {
    const list = h('ul', { class: 'ae-guesses', 'data-testid': 'ae-guesses' });
    for (const g of [...item.guesses].reverse()) {
      if (g === item.target) continue;
      const c = atlas.country(g)!;
      const lines: (string | HTMLElement)[] = [h('strong', {}, t('mystery.not', { name: ui.country(g) })), ' ', t('mystery.towards', { offset: ui.distanceAndDirection(c.label[0], c.label[1], target.label[0], target.label[1], s.difficulty === 'easy' ? 8 : 16), name: ui.country(g) })];
      if (target.nb.includes(g)) lines.push(' ', h('span', { class: 'ae-borders' }, t('mystery.borders', { name: ui.country(g) })));
      list.append(h('li', { class: 'ae-guess-card', 'data-testid': `ae-guess-${g}` }, ...lines));
      arcs.push({ from: [c.label[0], c.label[1]], to: [target.label[0], target.label[1]], style: 'arrow' });
    }
    if (list.childElementCount) card.splice(review ? card.length - 1 : card.length, 0, h('h3', { class: 'ae-sub' }, t('mystery.guesses')), list);
  }
  // Arrows only show the map direction (as the text does), a short way towards the target.
  for (let i = 0; i < arcs.length; i++) {
    const a = arcs[i]!;
    const dl = ((((a.to[0] - a.from[0] + 540) % 360) + 360) % 360) - 180;
    const f = Math.min(0.3, 12 / Math.max(1e-9, Math.hypot(dl, a.to[1] - a.from[1])));
    arcs[i] = { ...a, to: [a.from[0] + dl * f, a.from[1] + (a.to[1] - a.from[1]) * f] };
  }
  if (item.draft) shapes.push({ kind: 'country', id: item.draft, style: 'current' });
  scene.ariaLabel = item.guesses.length ? t('mystery.mapGuesses', { list: item.guesses.map((g) => ui.country(g)).join(', ') }) : t('mystery.title');
  const fit: Box | null = review ? boxAround([[target.box[0], target.box[1]], [target.box[2], target.box[3]], ...item.guesses.map((g) => atlas.country(g)!.label)], 4) : null;
  return {
    card,
    scene,
    fit,
    onPick(lon, lat, _via, client) {
      if (host.paused()) return;
      if (review) {
        host.setExplored([lon, lat]);
        host.refresh();
        return;
      }
      const id = countryAt(atlas, lon, lat);
      if (id) return choose(host, id);
      const place = placeAt(atlas, lon, lat);
      if (place?.kind === 'disputed') return host.announce(t('mystery.disputedTap'));
      if (place?.kind === 'other') return host.announce(t('mystery.notMember', { name: ui.other(place.id) }));
      // Tiny countries a finger cannot hit: offer the dots within 22 px.
      const near = client ? host.map.dotsNear(client, 22) : [];
      if (near.length === 1) return choose(host, near[0]!);
      if (near.length > 1) return pickPopup(host, near, (cid) => choose(host, cid));
      host.announce(describePoint(ui, atlas, lon, lat));
    }
  };
}

function choose(host: Host, id: string): void {
  const st = host.state();
  const item = st.items[st.index] as MysteryItem;
  if (item.guesses.includes(id)) {
    host.announce(host.ui.t('mystery.already', { name: host.ui.country(id) }));
    return;
  }
  host.commit(setGuessDraft(st, id, host.atlas), 'ae-guess', host.ui.t('mystery.choice', { name: host.ui.country(id) }));
}

/** A small chooser for several tiny countries under the finger (44 px buttons). */
export function pickPopup(host: Host, ids: readonly string[], onChoose: (id: string) => void): void {
  const { ui } = host;
  host.map.element.querySelector('.ae-pick')?.remove();
  const close = h('button', { type: 'button', class: 'ae-secondary', 'data-testid': 'ae-pick-close' }, ui.t('pick.close'));
  const box = h('div', { class: 'ae-pick', role: 'dialog', 'aria-label': ui.t('pick.which'), 'data-testid': 'ae-pick' }, h('p', {}, ui.t('pick.which')));
  for (const id of ids) {
    const b = h('button', { type: 'button', class: 'ae-secondary', 'data-testid': `ae-pick-${id}` }, ui.country(id));
    b.addEventListener('click', () => {
      box.remove();
      onChoose(id);
    });
    box.append(b);
  }
  close.addEventListener('click', () => {
    box.remove();
    host.map.focus();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      box.remove();
      host.map.focus();
    }
  });
  box.append(close);
  host.map.element.append(box);
  box.querySelector('button')?.focus();
}

/** The country search (combobox), the current choice and the Guess / Show me buttons. */
function guessControls(host: Host, item: MysteryItem): HTMLElement[] {
  const { ui, atlas } = host;
  const t = ui.t;
  const st = host.state();
  let search = searches.get(host);
  if (!search || search.index !== st.index) {
    search = { index: st.index, query: '' };
    searches.set(host, search);
  }
  const collator = new Intl.Collator(bcp47Tag(ui.locale), { sensitivity: 'base', usage: 'search' });
  const all = atlas.countries.map((c) => ({ id: c.id, name: ui.country(c.id) })).sort((a, b) => collator.compare(a.name, b.name));
  const input = h('input', {
    type: 'text',
    id: 'ae-search',
    class: 'ae-search',
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': 'false',
    'aria-controls': 'ae-listbox',
    autocomplete: 'off',
    spellcheck: 'false',
    'data-testid': 'ae-search'
  });
  input.value = search.query;
  const listbox = h('ul', { id: 'ae-listbox', role: 'listbox', class: 'ae-listbox', 'aria-label': t('mystery.search'), 'data-testid': 'ae-listbox', hidden: '' });
  let active = -1;
  let shown: { id: string; name: string }[] = [];
  const renderList = () => {
    const q = input.value;
    search!.query = q;
    shown = q.trim() ? all.filter((c) => !item.guesses.includes(c.id) && matches(collator, c.name, q)).slice(0, 8) : [];
    listbox.replaceChildren(
      ...shown.map((c, i) => {
        const li = h('li', { role: 'option', id: `ae-option-${c.id}`, class: 'ae-listopt', 'aria-selected': i === active ? 'true' : 'false', 'data-testid': `ae-listopt-${c.id}` }, ui.bdi(c.name));
        li.addEventListener('mousedown', (e) => e.preventDefault());
        li.addEventListener('click', () => choose(host, c.id));
        return li;
      })
    );
    const open = shown.length > 0;
    listbox.hidden = !open;
    input.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (active >= 0 && shown[active]) input.setAttribute('aria-activedescendant', `ae-option-${shown[active]!.id}`);
    else input.removeAttribute('aria-activedescendant');
  };
  input.addEventListener('input', () => {
    active = -1;
    renderList();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!shown.length) return;
      active = e.key === 'ArrowDown' ? (active + 1) % shown.length : (active - 1 + shown.length) % shown.length;
      renderList();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const pick = shown[active >= 0 ? active : 0];
      if (pick) choose(host, pick.id);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      input.value = '';
      active = -1;
      renderList();
    }
  });
  renderList();

  const choice = h('p', { class: 'ae-status', 'data-testid': 'ae-choice' }, item.draft ? t('mystery.choice', { name: ui.country(item.draft) }) : t('mystery.noChoice'));
  const guessBtn = h('button', { type: 'button', class: 'ae-primary', id: 'ae-guess', 'data-testid': 'ae-guess', 'aria-disabled': item.draft ? 'false' : 'true' }, t('mystery.guess'));
  guessBtn.addEventListener('click', () => {
    if (host.paused()) return;
    const cur = host.state().items[host.state().index] as MysteryItem;
    if (!cur.draft) {
      host.announce(t('mystery.noChoice'));
      return;
    }
    const next = guess(host.state());
    const done = (next.items[next.index] as MysteryItem).end === 'solved';
    search!.query = '';
    host.commit(next, done ? 'ae-review-heading' : 'ae-search', done ? t('mystery.solved', { name: ui.country(cur.draft) }) : t('mystery.not', { name: ui.country(cur.draft) }));
  });
  const show = h('button', { type: 'button', class: 'ae-secondary', 'data-testid': 'ae-skip' }, t('mystery.show'));
  show.addEventListener('click', () => !host.paused() && host.commit(showMystery(host.state()), 'ae-review-heading', t('mystery.was', { name: ui.country(item.target) })));
  return [
    h('h3', { class: 'ae-sub' }, t('mystery.yourGuess')),
    h('p', { class: 'ae-hint' }, t('mystery.hint')),
    h('label', { for: 'ae-search', class: 'ae-label' }, t('mystery.search')),
    h('div', { class: 'ae-combo' }, input, listbox),
    choice,
    h('div', { class: 'ae-actions ae-sticky' }, guessBtn, show)
  ];
}
