/**
 * Notation drawn by code as SVG (design § 11.1, § 14): five lines, noteheads, stems, ledger lines, accidentals,
 * rests and the treble and bass clefs as own simplified paths (circles and hand-placed Béziers; no music font, nothing
 * traced from a font or image). Always `dir="ltr"`, `role="img"` with an accessible name.
 */
import { notation, type NotationEvent } from './rhythm';
import { chordHeads, ledgerLines, naturalSigns, staffPosition, stemUp, type Clef } from './staff';
import { midiOf, type Spelled } from './spelling';

const NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...children: (Node | null | false | undefined)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) if (c) el.appendChild(c);
  return el;
}

const path = (d: string, cls: string) => svg('path', { d, class: cls });
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Treble (G) clef: one stroke from the bottom hook up to the top loop and round the G line (y0 = top line). */
export const trebleClef = (x: number, y0: number) =>
  svg(
    'g',
    { class: 'hm-clef', transform: `translate(${x} ${y0})` },
    path('M12 49C12 55 21 55 20.5 47L15.5-7C15-14 24-14 22.5-4C20.5 6 5.5 13 5.5 27C5.5 38 25 38 25 29C25 21 12 20 12 28C12 33 17 34 19 31', 'hm-clef-line'),
    svg('circle', { cx: 13.5, cy: 49, r: 3, class: 'hm-ink' })
  );

/** Bass (F) clef: a dot on the F line, a curve to the right and down, two dots around the F line. */
export const bassClef = (x: number, y0: number) =>
  svg(
    'g',
    { class: 'hm-clef', transform: `translate(${x} ${y0})` },
    svg('circle', { cx: 8, cy: 10, r: 3.4, class: 'hm-ink' }),
    path('M6 10C6 1 21-2 25.5 8C29.5 18 20 29 5 37', 'hm-clef-line'),
    svg('circle', { cx: 31, cy: 5, r: 1.9, class: 'hm-ink' }),
    svg('circle', { cx: 31, cy: 15, r: 1.9, class: 'hm-ink' })
  );

/** ♯ ♭ ♮ as own paths, centred on (x, y) (0 = the natural sign). */
export function accidental(a: -1 | 0 | 1, x: number, y: number): SVGGElement {
  if (a === 0)
    return svg(
      'g',
      { class: 'hm-acc', 'data-acc': 'natural' },
      path(`M${x - 2.4} ${y - 10}V${y + 4.4}M${x + 2.4} ${y - 4.4}V${y + 10}`, 'hm-thin'),
      path(`M${x - 2.4} ${y - 1.6}L${x + 2.4} ${y - 4.4}M${x - 2.4} ${y + 4.4}L${x + 2.4} ${y + 1.6}`, 'hm-thick')
    );
  if (a === 1)
    return svg(
      'g',
      { class: 'hm-acc', 'data-acc': 'sharp' },
      path(`M${x - 2.4} ${y - 8}V${y + 9}M${x + 2.4} ${y - 9}V${y + 8}`, 'hm-thin'),
      path(`M${x - 4.8} ${y - 2}L${x + 4.8} ${y - 4.6}M${x - 4.8} ${y + 4.6}L${x + 4.8} ${y + 2}`, 'hm-thick')
    );
  return svg(
    'g',
    { class: 'hm-acc', 'data-acc': 'flat' },
    path(`M${x - 3} ${y - 13}V${y + 4.5}`, 'hm-thin'),
    path(`M${x - 3} ${y + 4.5}C${x + 6} ${y - 0.5} ${x + 5} ${y - 6.5} ${x - 3} ${y - 1.2}`, 'hm-mid')
  );
}

const head = (x: number, y: number, open: boolean, cls = '') =>
  open
    ? svg('ellipse', { cx: r1(x), cy: r1(y), rx: 6.3, ry: 4.3, transform: `rotate(-12 ${r1(x)} ${r1(y)})`, class: `hm-head-open ${cls}` })
    : svg('ellipse', { cx: r1(x), cy: r1(y), rx: 6, ry: 4.2, transform: `rotate(-20 ${r1(x)} ${r1(y)})`, class: `hm-head ${cls}` });

export interface StaffEvent {
  readonly notes: readonly Spelled[];
  /** Text under the event (a chord name, "1", "2" …). */
  readonly label?: string;
  /** Marked with ◆ above the staff (the changed note). */
  readonly mark?: boolean;
  /** Highlighted while it plays (cosmetic). */
  readonly id?: string;
}

export interface StaffOptions {
  readonly grand?: boolean;
  /** Whole notes (theory examples) or filled heads with stems (melodies). */
  readonly style?: 'whole' | 'quarter';
  /** A dashed line through the heads (melody contour). */
  readonly contour?: boolean;
  readonly name: string;
  readonly testid?: string;
}

const LINE_GAP = 10;
const TREBLE_TOP = 34;
const BASS_TOP = 114;

/**
 * A staff (or grand staff) with one event per column. Notes ≥ C4 go on the treble staff of a grand staff, lower notes
 * on the bass staff.
 */
export function renderStaff(events: readonly StaffEvent[], options: StaffOptions): SVGSVGElement {
  const spacing = options.style === 'quarter' ? 42 : 58;
  const left = 62;
  const width = left + Math.max(1, events.length) * spacing + 10;
  const grand = options.grand === true;
  const labels = events.some((e) => e.label);
  const bottomLine = grand ? BASS_TOP + 40 : TREBLE_TOP + 40;
  const labelY = bottomLine + 30;
  const height = labels ? labelY + 6 : bottomLine + (grand ? 18 : 26);
  const root = svg('svg', { viewBox: `0 0 ${width} ${height}`, class: 'hm-staff', role: 'img', 'aria-label': options.name, dir: 'ltr', ...(options.testid ? { 'data-testid': options.testid } : {}) });
  root.style.maxInlineSize = `${Math.round(width * 1.6)}px`;
  const staves: { clef: Clef; top: number }[] = grand ? [{ clef: 'treble', top: TREBLE_TOP }, { clef: 'bass', top: BASS_TOP }] : [{ clef: 'treble', top: TREBLE_TOP }];
  for (const { clef, top } of staves) {
    for (let i = 0; i < 5; i++) root.appendChild(svg('line', { x1: 4, x2: width - 4, y1: top + i * LINE_GAP, y2: top + i * LINE_GAP, class: 'hm-line' }));
    root.appendChild(clef === 'treble' ? trebleClef(8, top) : bassClef(10, top));
  }
  if (grand) root.appendChild(svg('line', { x1: 4, x2: 4, y1: TREBLE_TOP, y2: BASS_TOP + 40, class: 'hm-line' }));
  const centres: [number, number][] = [];
  const naturals = naturalSigns(events.map((ev) => ev.notes));
  events.forEach((ev, i) => {
    const x = left + i * spacing + spacing / 2;
    const g = svg('g', { class: 'hm-event', ...(ev.id ? { 'data-ev': ev.id } : {}) });
    for (const { clef, top } of staves) {
      const onStaff = (n: Spelled) => !grand || (clef === 'treble' ? midiOf(n) >= 60 : midiOf(n) < 60);
      const mine = ev.notes.filter(onStaff);
      const natural = naturals[i]!.filter((_, k) => onStaff(ev.notes[k]!));
      if (!mine.length) continue;
      const bottom = top + 4 * LINE_GAP;
      const yOf = (p: number) => bottom - (p * LINE_GAP) / 2;
      const positions = mine.map((n) => staffPosition(n, clef));
      const up = options.style === 'quarter' ? stemUp(positions) : true;
      const heads = chordHeads(mine.map((n, k) => ({ p: positions[k]!, a: n.a, natural: natural[k] })), up);
      const ledgers = new Set<number>();
      for (const hd of heads) for (const q of ledgerLines(hd.p)) ledgers.add(q);
      for (const q of ledgers) g.appendChild(svg('line', { x1: x - 11, x2: x + 11 + (heads.some((h2) => h2.side === 1) ? 13 : 0), y1: yOf(q), y2: yOf(q), class: 'hm-ledger' }));
      for (const hd of heads) {
        const hx = x + hd.side * 13;
        g.appendChild(head(hx, yOf(hd.p), options.style !== 'quarter'));
        if (hd.a !== 0 || hd.natural) g.appendChild(accidental(hd.a, x - 15 - hd.accCol * 10 - (heads.some((h2) => h2.side === -1) ? 13 : 0), yOf(hd.p)));
        centres.push([hx, yOf(hd.p)]);
      }
      if (options.style === 'quarter') {
        const ys = heads.map((hd) => yOf(hd.p));
        const sx = up ? x + 5.6 : x - 5.6;
        const y1 = up ? Math.max(...ys) : Math.min(...ys);
        const y2 = up ? Math.min(...ys) - 34 : Math.max(...ys) + 34;
        g.appendChild(svg('line', { x1: sx, x2: sx, y1, y2, class: 'hm-stem' }));
      }
      if (ev.mark) g.appendChild(path(`M${x} ${top - 26}l5 5-5 5-5-5z`, 'hm-ink'));
    }
    if (ev.label) g.appendChild(svg('text', { x, y: labelY, class: 'hm-label', 'text-anchor': 'middle' }, document.createTextNode(ev.label)));
    root.appendChild(g);
  });
  if (options.contour && centres.length > 1) root.appendChild(svg('polyline', { points: centres.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' '), class: 'hm-contour' }));
  return root;
}

/* ---------- Rhythm notation (design § 14.3) ---------- */

const RLINE = 44;

const quarterRest = (x: number, y: number) => path(`M${x - 2} ${y - 11}L${x + 3} ${y - 5}L${x - 2} ${y + 1}L${x + 3} ${y + 6}C${x - 3} ${y + 3} ${x - 4} ${y + 9} ${x + 1} ${y + 12}`, 'hm-rest');
const eighthRest = (x: number, y: number) =>
  svg('g', {}, svg('circle', { cx: x - 2, cy: y - 5, r: 2.3, class: 'hm-ink' }), path(`M${x - 2} ${y - 3.5}C${x + 1} ${y - 1.5} ${x + 4} ${y - 3} ${x + 5} ${y - 6}L${x + 1} ${y + 8}`, 'hm-rest'));

/** One bar on a single-line percussion staff with a 4/4 time signature; eighths beamed in pairs within a beat. */
export function renderRhythm(pattern: readonly number[], name: string, testid?: string): SVGSVGElement {
  const slotW = 34;
  const left = 46;
  const width = left + 8 * slotW + 10;
  const root = svg('svg', { viewBox: `0 0 ${width} 76`, class: 'hm-staff hm-rhythm-staff', role: 'img', 'aria-label': name, dir: 'ltr', ...(testid ? { 'data-testid': testid } : {}) });
  root.appendChild(svg('line', { x1: 4, x2: width - 4, y1: RLINE, y2: RLINE, class: 'hm-line' }));
  root.appendChild(svg('line', { x1: width - 4, x2: width - 4, y1: RLINE - 12, y2: RLINE + 12, class: 'hm-line' }));
  root.appendChild(svg('text', { x: 20, y: RLINE - 3, class: 'hm-time', 'text-anchor': 'middle' }, document.createTextNode('4')));
  root.appendChild(svg('text', { x: 20, y: RLINE + 17, class: 'hm-time', 'text-anchor': 'middle' }, document.createTextNode('4')));
  const events = notation(pattern);
  const stemTop = RLINE - 32;
  const stemX = (e: NotationEvent) => left + e.slot * slotW + slotW / 2 + 5.6;
  for (const e of events) {
    const x = left + e.slot * slotW + slotW / 2;
    const g = svg('g', { class: 'hm-event', 'data-ev': `s${e.slot}` });
    if (e.glyph === 'rest-quarter') g.appendChild(quarterRest(x, RLINE));
    else if (e.glyph === 'rest-eighth') g.appendChild(eighthRest(x, RLINE));
    else {
      g.appendChild(head(x, RLINE, e.glyph === 'half'));
      g.appendChild(svg('line', { x1: stemX(e), x2: stemX(e), y1: RLINE, y2: stemTop, class: 'hm-stem' }));
      if (e.glyph === 'dotted-quarter') g.appendChild(svg('circle', { cx: x + 11, cy: RLINE - 4, r: 2, class: 'hm-ink' }));
      if (e.glyph === 'eighth' && e.beam < 0) g.appendChild(path(`M${stemX(e)} ${stemTop}C${stemX(e) + 7} ${stemTop + 8} ${stemX(e) + 10} ${stemTop + 13} ${stemX(e) + 6} ${stemTop + 20}`, 'hm-flag'));
    }
    root.appendChild(g);
  }
  for (const e of events) {
    if (e.beam < 0 || events.find((o) => o.beam === e.beam) !== e) continue;
    const other = events.find((o) => o.beam === e.beam && o !== e)!;
    root.appendChild(svg('rect', { x: stemX(e) - 0.9, y: stemTop, width: stemX(other) - stemX(e) + 1.8, height: 5, class: 'hm-ink hm-beam' }));
  }
  return root;
}

/* ---------- Contour pictures (melody options) ---------- */

/** A dot-and-line picture of a contour ("ud" = up, down), drawn left to right. */
export function renderContour(contour: string): SVGSVGElement {
  const n = contour.length + 1;
  const w = 16 + (n - 1) * 22;
  let level = 0;
  const levels = [0];
  for (const c of contour) levels.push((level += c === 'u' ? 1 : -1));
  const max = Math.max(...levels);
  const min = Math.min(...levels);
  const span = Math.max(1, max - min);
  const pts = levels.map((l, i) => [8 + i * 22, 6 + ((max - l) / span) * 28] as const);
  const root = svg('svg', { viewBox: `0 0 ${w} 40`, class: 'hm-contour-pic', 'aria-hidden': 'true', focusable: 'false' });
  root.appendChild(svg('polyline', { points: pts.map(([x, y]) => `${x},${r1(y)}`).join(' '), class: 'hm-contour-line' }));
  for (const [x, y] of pts) root.appendChild(svg('circle', { cx: x, cy: r1(y), r: 3.6, class: 'hm-ink' }));
  return root;
}
