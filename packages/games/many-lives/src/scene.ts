import type { ManyLivesState } from './rules';
import { ageOf } from './rules';

const SVG = 'http://www.w3.org/2000/svg';
/** Skin tones and hair colours (independent of the region, owner decision O20). */
const SKIN = ['#f6d7c3', '#eac09c', '#d39b72', '#b07a52', '#8a5a3b', '#5e3b26'];
const HAIR = ['#2b211c', '#4a3123', '#7a4b2a', '#b8864b', '#d9b26f', '#8c3b22'];
const GREY = '#c9c4bd';

type Attrs = Record<string, string | number>;
function el(tag: string, attrs: Attrs, ...children: SVGElement[]): SVGElement {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  for (const c of children) e.appendChild(c);
  return e;
}

/** What the background shows: where the person lives and what fills their days. */
export type Place = 'child' | 'school' | 'training' | 'study' | 'employed' | 'unemployed' | 'idle';

export function placeOf(state: ManyLivesState): Place {
  const f = state.life.flags;
  if (ageOf(state) < 16) return ageOf(state) < 6 ? 'child' : 'school';
  if (f.includes('work.employed')) return 'employed';
  if (f.includes('work.study')) return 'study';
  if (f.includes('work.training')) return 'training';
  if (f.includes('work.school')) return 'school';
  if (f.includes('work.unemployed')) return 'unemployed';
  return 'idle';
}

function home(state: ManyLivesState): SVGElement {
  const g = el('g', { class: 'ml-scene-home' });
  if (state.life.flags.includes('home.parents')) {
    // The parents' house: a gabled house on the left.
    g.append(
      el('rect', { x: 14, y: 70, width: 96, height: 72, rx: 3, class: 'ml-s-wall' }),
      el('path', { d: 'M8 74 L62 34 L116 74 Z', class: 'ml-s-roof' }),
      el('rect', { x: 28, y: 88, width: 22, height: 20, class: 'ml-s-window' }),
      el('rect', { x: 72, y: 104, width: 22, height: 38, class: 'ml-s-door' })
    );
  } else {
    // An own flat: a block of windows; bigger and greener for a comfortable lifestyle.
    const level = state.life.counters.lifestyle ?? 1;
    const w = 70 + level * 16;
    g.append(el('rect', { x: 14, y: 40, width: w, height: 102, rx: 2, class: 'ml-s-wall' }));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2 + level; c++) {
      g.append(el('rect', { x: 22 + c * 22, y: 50 + r * 22, width: 14, height: 14, class: 'ml-s-window' }));
    }
    if (level === 2) g.append(el('circle', { cx: 18 + w, cy: 120, r: 14, class: 'ml-s-plant' }), el('rect', { x: 16 + w, y: 128, width: 4, height: 14, class: 'ml-s-trunk' }));
  }
  return g;
}

function activity(place: Place): SVGElement {
  const g = el('g', { class: 'ml-scene-activity' });
  const x = 230;
  switch (place) {
    case 'school':
      g.append(el('rect', { x, y: 60, width: 70, height: 50, rx: 3, class: 'ml-s-board' }),
        el('path', { d: `M${x + 10} 75 h40 M${x + 10} 87 h30 M${x + 10} 99 h45`, class: 'ml-s-chalk' }));
      break;
    case 'study':
      for (let i = 0; i < 4; i++) g.append(el('rect', { x: x + 6 + i * 14, y: 80 - i * 4, width: 12, height: 50 + i * 4, rx: 1, class: `ml-s-book ml-s-book-${i}` }));
      break;
    case 'training':
      g.append(el('path', { d: `M${x + 10} 120 l40 -40 l8 8 l-40 40 z`, class: 'ml-s-tool' }),
        el('circle', { cx: x + 54, cy: 76, r: 10, class: 'ml-s-tool' }));
      break;
    case 'employed':
      g.append(el('rect', { x, y: 104, width: 76, height: 8, class: 'ml-s-desk' }),
        el('rect', { x: x + 18, y: 72, width: 40, height: 28, rx: 2, class: 'ml-s-screen' }),
        el('rect', { x: x + 34, y: 100, width: 8, height: 4, class: 'ml-s-desk' }));
      break;
    case 'unemployed':
      g.append(el('rect', { x: x + 6, y: 70, width: 56, height: 60, rx: 2, class: 'ml-s-paper' }),
        el('circle', { cx: x + 52, cy: 116, r: 12, class: 'ml-s-lens' }),
        el('path', { d: `M${x + 60} 124 l12 12`, class: 'ml-s-lens-handle' }));
      break;
    case 'child':
      g.append(el('circle', { cx: x + 30, cy: 124, r: 16, class: 'ml-s-ball' }));
      break;
    case 'idle':
      break;
  }
  return g;
}

/** The person in the centre, drawn by age stage with the appearance given at birth. */
function person(state: ManyLivesState): SVGElement {
  const age = ageOf(state);
  const scale = age < 6 ? 0.55 : age < 12 ? 0.7 : age < 16 ? 0.85 : 1;
  const hair = age >= 62 ? GREY : (HAIR[state.appearance.hair] ?? HAIR[0]) as string;
  const skin = (SKIN[state.appearance.skin] ?? SKIN[0]) as string;
  const g = el('g', { class: 'ml-scene-person', transform: `translate(160 ${142 - 112 * scale}) scale(${scale})` });
  g.append(
    el('rect', { x: -22, y: 46, width: 44, height: 50, rx: 14, class: 'ml-s-clothes' }),
    el('rect', { x: -18, y: 92, width: 14, height: 22, rx: 4, class: 'ml-s-legs' }),
    el('rect', { x: 4, y: 92, width: 14, height: 22, rx: 4, class: 'ml-s-legs' }),
    el('circle', { cx: 0, cy: 26, r: 22, fill: skin }),
    el('path', { d: state.appearance.style === 1 ? 'M-23 26 C-26 -4 26 -4 23 26 L23 44 L16 30 C10 10 -10 10 -16 30 L-23 44 Z' : 'M-22 22 C-22 -2 22 -2 22 22 C14 10 -14 10 -22 22 Z', fill: hair }),
    el('circle', { cx: -7, cy: 28, r: 2.2, class: 'ml-s-eye' }),
    el('circle', { cx: 7, cy: 28, r: 2.2, class: 'ml-s-eye' }),
    el('path', { d: state.life.stats.satisfaction >= 450 ? 'M-7 36 Q0 42 7 36' : 'M-7 39 Q0 35 7 39', class: 'ml-s-mouth' })
  );
  return g;
}

export function drawScene(state: ManyLivesState): SVGElement {
  const svg = el('svg', { viewBox: '0 0 320 160', class: 'ml-scene-art', 'aria-hidden': 'true', focusable: 'false' });
  svg.append(
    el('rect', { x: 0, y: 0, width: 320, height: 160, class: 'ml-s-sky' }),
    el('rect', { x: 0, y: 142, width: 320, height: 18, class: 'ml-s-ground' }),
    home(state),
    activity(placeOf(state)),
    person(state)
  );
  return svg;
}
